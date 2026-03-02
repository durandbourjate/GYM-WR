/**
 * Google Calendar API service (v3.60)
 * Uses Google Identity Services (GIS) for OAuth 2.0 implicit grant flow.
 * Requires a Google Cloud Project with Calendar API enabled and OAuth Client ID.
 */
import { useGCalStore } from '../store/gcalStore';

const SCOPES = 'https://www.googleapis.com/auth/calendar';

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
  await loadGIS();
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) throw new Error('Google Identity Services nicht verfügbar');

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: any) => {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        const store = useGCalStore.getState();
        store.setToken(resp.access_token, parseInt(resp.expires_in));
        resolve(resp.access_token);
      },
    });
    client.requestAccessToken();
  });
}

/** Revoke token and clear state */
export function logout() {
  const store = useGCalStore.getState();
  if (store.accessToken) {
    try { (window as any).google?.accounts?.oauth2?.revoke?.(store.accessToken); } catch { /* ignore */ }
  }
  store.clearToken();
}

/** Authenticated fetch wrapper for Google Calendar API v3 */
async function gcalFetch(path: string, options?: RequestInit) {
  const store = useGCalStore.getState();
  if (!store.isAuthenticated()) throw new Error('Nicht authentifiziert – bitte erneut anmelden');

  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${store.accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 401) {
    store.clearToken();
    throw new Error('Token abgelaufen – bitte erneut anmelden');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API-Fehler ${res.status}`);
  }
  return res.json();
}

/** Fetch list of user's calendars */
export async function fetchCalendarList() {
  const data = await gcalFetch('/users/me/calendarList');
  return (data.items || []).map((cal: any) => ({
    id: cal.id as string,
    summary: (cal.summaryOverride || cal.summary || cal.id) as string,
    primary: !!cal.primary,
    accessRole: cal.accessRole as string,
  }));
}

/** Fetch events from a calendar within a time range */
export async function fetchEvents(calendarId: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin, timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  });
  const data = await gcalFetch(`/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  return data.items || [];
}

/** Create an event on a calendar */
export async function createEvent(calendarId: string, event: any) {
  return gcalFetch(`/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

/** Update an event */
export async function updateEvent(calendarId: string, eventId: string, event: any) {
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
