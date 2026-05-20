/**
 * Google Calendar API service (v3.62)
 * Uses Google Identity Services (GIS) for OAuth 2.0 implicit grant flow.
 * Requires a Google Cloud Project with Calendar API enabled and OAuth Client ID.
 */
import { useGCalStore } from '../store/gcalStore';
import { weekToDate } from '../store/instanceStore';
import type { Course, Week } from '../types';
import { generateId, type SpecialWeekConfig } from '../store/settingsStore';

const SCOPES = 'https://www.googleapis.com/auth/calendar';

// === Google Identity Services + Calendar-API Types (minimal) ===
// Defensive: GIS/Calendar-API-Types werden nicht vom Browser typisiert; nur
// die hier verwendeten Felder werden modelliert.
interface GISTokenResponse {
  access_token: string;
  expires_in: string;
  error?: string;
  error_description?: string;
}
interface GISErrorResponse { type?: string }
interface GISTokenClient { requestAccessToken: () => void }
interface GISOAuth2 {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    callback: (resp: GISTokenResponse) => void;
    error_callback?: (err: GISErrorResponse) => void;
  }) => GISTokenClient;
  revoke?: (token: string, cb?: () => void) => void;
}
interface GoogleNS { accounts?: { oauth2?: GISOAuth2 } }
function getGoogleNS(): GoogleNS | undefined {
  return (window as unknown as { google?: GoogleNS }).google;
}

/** Google Calendar API event shape (only the fields we read/write) */
export interface GCalEventInput {
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
}
export interface GCalEvent extends GCalEventInput {
  id: string;
}

let gisLoaded = false;

/** Load Google Identity Services script */
function loadGIS(): Promise<void> {
  if (gisLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('gis-script')) { gisLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => { gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Google Identity Services konnte nicht geladen werden'));
    document.head.appendChild(script);
  });
}

/** Initiate OAuth login flow — returns access_token */
export async function loginWithGoogle(clientId: string): Promise<string> {
  // Validate client ID format
  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    throw new Error('Ungültige Client-ID. Format: xxx.apps.googleusercontent.com');
  }

  await loadGIS();
  const google = getGoogleNS();
  if (!google?.accounts?.oauth2) throw new Error('Google Identity Services konnte nicht geladen werden. Prüfe deine Internetverbindung.');
  const oauth2 = google.accounts.oauth2;

  return new Promise((resolve, reject) => {
    try {
      const client = oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp: GISTokenResponse) => {
          if (resp.error) {
            const msg = resp.error === 'access_denied'
              ? 'Zugriff verweigert. Bitte Berechtigung erteilen.'
              : resp.error === 'invalid_client'
              ? 'Ungültige Client-ID. Bitte in den Einstellungen prüfen.'
              : resp.error_description || resp.error;
            reject(new Error(msg));
            return;
          }
          const store = useGCalStore.getState();
          store.setToken(resp.access_token, parseInt(resp.expires_in));
          resolve(resp.access_token);
        },
        error_callback: (err: GISErrorResponse) => {
          const msg = err?.type === 'popup_closed'
            ? 'Anmeldefenster wurde geschlossen.'
            : err?.type === 'popup_failed_to_open'
            ? 'Popup konnte nicht geöffnet werden. Bitte Popup-Blocker deaktivieren.'
            : `Anmeldefehler: ${err?.type || 'Unbekannt'}`;
          reject(new Error(msg));
        },
      });
      client.requestAccessToken();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler';
      reject(new Error(`OAuth-Initialisierung fehlgeschlagen: ${msg}`));
    }
  });
}

/** Revoke token and clear state */
export function logout() {
  const store = useGCalStore.getState();
  if (store.accessToken) {
    try { getGoogleNS()?.accounts?.oauth2?.revoke?.(store.accessToken); } catch { /* ignore */ }
  }
  store.clearToken();
}

/** Authenticated fetch wrapper for Google Calendar API v3 */
async function gcalFetch(path: string, options?: RequestInit) {
  const store = useGCalStore.getState();
  if (!store.isAuthenticated()) throw new Error('Nicht authentifiziert – bitte erneut anmelden');

  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${store.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Keine Verbindung zu Google';
    throw new Error(`Netzwerkfehler: ${msg}. Prüfe deine Internetverbindung.`);
  }

  if (res.status === 401) {
    store.clearToken();
    throw new Error('Token abgelaufen – bitte erneut anmelden');
  }
  if (res.status === 403) {
    const err = await res.json().catch(() => ({}));
    const reason = err.error?.errors?.[0]?.reason;
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
      throw new Error('API-Limit erreicht. Bitte warte einen Moment und versuche es erneut.');
    }
    if (reason === 'insufficientPermissions') {
      store.clearToken();
      throw new Error('Fehlende Berechtigung. Bitte erneut anmelden und Kalender-Zugriff erlauben.');
    }
    throw new Error(err.error?.message || 'Zugriff verweigert (403)');
  }
  if (res.status === 404) {
    throw new Error('Kalender oder Ereignis nicht gefunden. Möglicherweise wurde es gelöscht.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API-Fehler ${res.status}`);
  }
  return res.json();
}

/** Calendar-List-Eintrag aus Google Calendar API */
interface CalendarListItem {
  id: string;
  summary?: string;
  summaryOverride?: string;
  primary?: boolean;
  accessRole?: string;
}

/** Fetch list of user's calendars */
export async function fetchCalendarList() {
  const data = await gcalFetch('/users/me/calendarList');
  return ((data.items || []) as CalendarListItem[]).map((cal) => ({
    id: cal.id,
    summary: cal.summaryOverride || cal.summary || cal.id,
    primary: !!cal.primary,
    accessRole: cal.accessRole || '',
  }));
}

/** Fetch events from a calendar within a time range */
export async function fetchEvents(calendarId: string, timeMin: string, timeMax: string): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    timeMin, timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });
  const data = await gcalFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  return (data.items || []) as GCalEvent[];
}

/** Create an event on a calendar */
export async function createEvent(calendarId: string, event: GCalEventInput): Promise<GCalEvent> {
  return gcalFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/** Update an event */
export async function updateEvent(calendarId: string, eventId: string, event: GCalEventInput): Promise<GCalEvent> {
  return gcalFetch(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
}

/** Delete an event */
export async function deleteEvent(calendarId: string, eventId: string) {
  const store = useGCalStore.getState();
  if (!store.isAuthenticated()) throw new Error('Nicht authentifiziert');
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    { method: 'DELETE', headers: { 'Authorization': `Bearer ${store.accessToken}` } }
  );
  if (!res.ok && res.status !== 404) throw new Error(`Löschen fehlgeschlagen: ${res.status}`);
}

// ---- v3.61: Planer→Kalender Sync ----

const DAY_OFFSET: Record<string, number> = { Mo: 0, Di: 1, Mi: 2, Do: 3, Fr: 4 };
const PLANER_TAG = 'planer-managed';

/** Build a mapping from week key (e.g. "33") to ISO year */
export function buildWeekYearMap(
  startWeek: number, startYear: number, endWeek: number, endYear: number
): Record<string, number> {
  const map: Record<string, number> = {};
  let cw = startWeek, cy = startYear;
  for (let i = 0; i < 60; i++) {
    const key = String(cw).padStart(2, '0');
    map[key] = cy;
    if (cw === endWeek && cy === endYear) break;
    const jan1 = new Date(cy, 0, 1);
    const dec31 = new Date(cy, 11, 31);
    const maxWeek = (jan1.getDay() === 4 || dec31.getDay() === 4) ? 53 : 52;
    cw++;
    if (cw > maxWeek) { cw = 1; cy++; }
  }
  return map;
}

/** Compute an RFC3339 dateTime string from a week/year + day + time (e.g. "09:00") */
function toDateTime(weekNum: number, year: number, day: string, time: string): string {
  const monday = weekToDate(weekNum, year);
  const offset = DAY_OFFSET[day] ?? 0;
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  const [h, m] = time.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export interface SyncProgress {
  total: number;
  done: number;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

/**
 * Sync planner lessons to Google Calendar.
 * Creates/updates/deletes events for each filled lesson cell.
 * Uses the `planer-managed` tag in extendedProperties to identify managed events.
 */
export async function syncPlannerToCalendar(
  calendarId: string,
  weekData: Week[],
  courses: Course[],
  weekYearMap: Record<string, number>,
  onProgress?: (p: SyncProgress) => void,
): Promise<SyncProgress> {
  const gcalStore = useGCalStore.getState();
  if (!gcalStore.isAuthenticated()) throw new Error('Nicht authentifiziert');

  const eventMap = { ...gcalStore.eventMap };
  const progress: SyncProgress = { total: 0, done: 0, created: 0, updated: 0, deleted: 0, errors: [] };

  // Build set of lesson keys that should have events
  const desiredKeys = new Set<string>();
  const courseMap = new Map(courses.map(c => [c.col, c]));

  for (const week of weekData) {
    for (const [colStr, entry] of Object.entries(week.lessons)) {
      const col = Number(colStr);
      const course = courseMap.get(col);
      if (!course) continue;
      // Skip holidays (type 6), events (type 5), and empty entries
      if (!entry.title || entry.type === 5 || entry.type === 6) continue;
      const year = weekYearMap[week.w];
      if (!year) continue;
      const key = `${week.w}-${col}`;
      desiredKeys.add(key);
    }
  }

  // Count total operations: creates + updates + deletes
  const toDelete = Object.keys(eventMap).filter(k => !desiredKeys.has(k));
  progress.total = desiredKeys.size + toDelete.length;
  onProgress?.(progress);

  // Delete events that no longer exist in planner
  for (const key of toDelete) {
    const eventId = eventMap[key];
    try {
      await deleteEvent(calendarId, eventId);
      gcalStore.removeEventMapping(key);
      delete eventMap[key];
      progress.deleted++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      progress.errors.push(`Löschen ${key}: ${msg}`);
    }
    progress.done++;
    onProgress?.(progress);
  }

  // Create or update events for each lesson
  for (const week of weekData) {
    for (const [colStr, entry] of Object.entries(week.lessons)) {
      const col = Number(colStr);
      const course = courseMap.get(col);
      if (!course) continue;
      if (!entry.title || entry.type === 5 || entry.type === 6) continue;
      const year = weekYearMap[week.w];
      if (!year) continue;

      const key = `${week.w}-${col}`;
      const weekNum = parseInt(week.w);
      const startDT = toDateTime(weekNum, year, course.day, course.from);
      const endDT = toDateTime(weekNum, year, course.day, course.to);

      const eventBody = {
        summary: `${course.cls} ${course.typ}: ${entry.title}`,
        description: `Klasse: ${course.cls}\nTyp: ${course.typ}\nKW: ${week.w}${course.hk ? '\nHalbklasse' : ''}`,
        start: { dateTime: startDT },
        end: { dateTime: endDT },
        extendedProperties: {
          private: { [PLANER_TAG]: 'true', planerKey: key },
        },
      };

      const existingId = eventMap[key];
      try {
        if (existingId) {
          await updateEvent(calendarId, existingId, eventBody);
          progress.updated++;
        } else {
          const created = await createEvent(calendarId, eventBody);
          gcalStore.setEventMapping(key, created.id);
          eventMap[key] = created.id;
          progress.created++;
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        progress.errors.push(`${existingId ? 'Update' : 'Create'} ${key}: ${msg}`);
      }
      progress.done++;
      onProgress?.(progress);
    }
  }

  return progress;
}

// ---- v3.62: Kalender→Planer Import ----

/** Keywords that indicate special weeks (IW, Besuchstag, Sonderwoche, etc.) */
const SPECIAL_KEYWORDS = [
  { pattern: /\bIW\b|Interdisziplinäre?\s*Woche|Intensivwoche/i, label: 'IW' },
  { pattern: /\bBesuchstag/i, label: 'Besuchstag' },
  { pattern: /\bSonderwoche/i, label: 'Sonderwoche' },
  { pattern: /\bProjektwoche/i, label: 'Projektwoche' },
  { pattern: /\bStudienreise/i, label: 'Studienreise' },
  { pattern: /\bMatura/i, label: 'Matura' },
  { pattern: /\bSchulfrei/i, label: 'Schulfrei' },
  { pattern: /\bWeiterbildung/i, label: 'Weiterbildung' },
  { pattern: /\bSporttag/i, label: 'Sporttag' },
  { pattern: /\bExkursion/i, label: 'Exkursion' },
];

/** Get ISO week number from a Date */
function getISOWeek(date: Date): string {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return String(weekNum).padStart(2, '0');
}

export interface ImportCandidate {
  event: { summary: string; start: string; end: string; id: string };
  suggestedConfig: SpecialWeekConfig;
  matchedKeyword: string;
}

/**
 * Scan read calendars for events matching special week keywords.
 * Returns candidate SpecialWeekConfig items for user confirmation.
 */
export async function scanCalendarsForSpecialWeeks(
  calendarIds: string[],
  timeMin: string,
  timeMax: string,
): Promise<ImportCandidate[]> {
  const gcalStore = useGCalStore.getState();
  if (!gcalStore.isAuthenticated()) throw new Error('Nicht authentifiziert');

  const candidates: ImportCandidate[] = [];

  for (const calId of calendarIds) {
    let events: GCalEvent[];
    try {
      events = await fetchEvents(calId, timeMin, timeMax);
    } catch {
      continue; // skip inaccessible calendars
    }

    for (const ev of events) {
      // Skip planer-managed events
      if (ev.extendedProperties?.private?.[PLANER_TAG]) continue;

      const summary = ev.summary || '';
      for (const kw of SPECIAL_KEYWORDS) {
        if (kw.pattern.test(summary)) {
          // Determine week from event start
          const startStr = ev.start?.dateTime || ev.start?.date;
          if (!startStr) break;
          const startDate = new Date(startStr);
          const weekKey = getISOWeek(startDate);

          // Determine if it spans partial days
          let days: number[] | undefined;
          const endStr = ev.end?.dateTime || ev.end?.date;
          if (endStr) {
            const endDate = new Date(endStr);
            const startDay = (startDate.getDay() + 6) % 7; // 0=Mo..6=Su
            const endDay = (endDate.getDay() + 6) % 7;
            // If not a full week (Mo-Fr), mark specific days
            if (startDay > 0 || endDay < 4) {
              days = [];
              for (let d = startDay; d <= Math.min(endDay, 4); d++) {
                days.push(d + 1); // 1=Mo..5=Fr
              }
            }
          }

          // Detect GYM level from summary
          let gymLevel: string | undefined;
          const gymMatch = summary.match(/GYM\s*(\d)/i);
          if (gymMatch) gymLevel = `GYM${gymMatch[1]}`;

          candidates.push({
            event: { summary, start: startStr, end: endStr || startStr, id: ev.id },
            suggestedConfig: {
              id: generateId(),
              label: summary,
              week: weekKey,
              type: 'event',
              gymLevel,
              days,
            },
            matchedKeyword: kw.label,
          });
          break; // only match first keyword per event
        }
      }
    }
  }

  return candidates;
}

// ---- v3.63: Kollisionswarnungen ----

/**
 * Check for collisions between planner lessons and external calendar events.
 * Returns a map of "weekKey-col" → array of colliding event summaries.
 */
export async function checkCollisions(
  readCalendarIds: string[],
  weekData: Week[],
  courses: Course[],
  weekYearMap: Record<string, number>,
): Promise<Record<string, string[]>> {
  const gcalStore = useGCalStore.getState();
  if (!gcalStore.isAuthenticated()) throw new Error('Nicht authentifiziert');

  // Build time range
  const weeks = Object.entries(weekYearMap);
  if (weeks.length === 0) return {};
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  const timeMin = new Date(weekToDate(parseInt(firstWeek[0]), firstWeek[1])).toISOString();
  const lastMon = weekToDate(parseInt(lastWeek[0]), lastWeek[1]);
  lastMon.setDate(lastMon.getDate() + 6);
  const timeMax = lastMon.toISOString();

  // Fetch all external events from read calendars
  const externalEvents: Array<{ summary: string; startMs: number; endMs: number }> = [];
  for (const calId of readCalendarIds) {
    let events: GCalEvent[];
    try {
      events = await fetchEvents(calId, timeMin, timeMax);
    } catch {
      continue;
    }
    for (const ev of events) {
      // Skip planer-managed events
      if (ev.extendedProperties?.private?.[PLANER_TAG]) continue;
      const startStr = ev.start?.dateTime;
      const endStr = ev.end?.dateTime;
      // Only check timed events (not all-day)
      if (!startStr || !endStr) continue;
      externalEvents.push({
        summary: ev.summary || '(Kein Titel)',
        startMs: new Date(startStr).getTime(),
        endMs: new Date(endStr).getTime(),
      });
    }
  }

  if (externalEvents.length === 0) return {};

  // Build planner lesson time slots and check overlaps
  const collisions: Record<string, string[]> = {};
  const courseMap = new Map(courses.map(c => [c.col, c]));

  for (const week of weekData) {
    for (const [colStr, entry] of Object.entries(week.lessons)) {
      const col = Number(colStr);
      const course = courseMap.get(col);
      if (!course) continue;
      if (!entry.title || entry.type === 5 || entry.type === 6) continue;
      const year = weekYearMap[week.w];
      if (!year) continue;

      const weekNum = parseInt(week.w);
      const monday = weekToDate(weekNum, year);
      const dayOff = DAY_OFFSET[course.day] ?? 0;
      const d = new Date(monday);
      d.setDate(d.getDate() + dayOff);

      const [sh, sm] = course.from.split(':').map(Number);
      const [eh, em] = course.to.split(':').map(Number);
      const lessonStart = new Date(d); lessonStart.setHours(sh, sm, 0, 0);
      const lessonEnd = new Date(d); lessonEnd.setHours(eh, em, 0, 0);
      const ls = lessonStart.getTime();
      const le = lessonEnd.getTime();

      const key = `${week.w}-${col}`;
      for (const ext of externalEvents) {
        // Check time overlap: start1 < end2 && start2 < end1
        if (ext.startMs < le && ls < ext.endMs) {
          if (!collisions[key]) collisions[key] = [];
          collisions[key].push(ext.summary);
        }
      }
    }
  }

  return collisions;
}
