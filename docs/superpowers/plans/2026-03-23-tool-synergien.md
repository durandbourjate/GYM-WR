# Tool-Synergien Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shared data layer across Unterrichtsplaner, Prüfungsplattform und Übungspools via Google Sheets + Apps Script Gateway.

**Architecture:** 4 neue Google Sheets (Kurse, Stundenplan, Schuljahr, Lehrplan) + Apps Script Endpoints als einheitliche API. Planer cached Daten in localStorage (PWA offline-fähig). Implementierung in 5 Blöcken: S1 → S3 → S2 → S4a → S4b.

**Tech Stack:** Google Sheets, Google Apps Script, React 19 + TypeScript + Zustand (Prüfung + Planer), Vanilla JS (Pools)

**Spec:** `docs/superpowers/specs/2026-03-23-tool-synergien-design.md`

---

## Block S1: Zentrale Kurs-Verwaltung

### Task 1: Google Sheets vorbereiten (manuell durch User)

**Anleitung für User (nicht automatisierbar):**

- [ ] **Step 1: Sheet 1 "Kurse" erstellen**

Neues Google Sheet erstellen. Tab "Kurse" mit Spalten:
`kursId | label | fach | gefaess | lpEmail | klassen | aktiv`

Beispielzeile:
```
sf-wr-28bc29fs | SF WR 28bc29fs | WR | SF | yannick.durand@gymhofwil.ch | 28bc,29fs | true
```

Pro Kurs einen weiteren Tab erstellen (Tab-Name = label, z.B. "SF WR 28bc29fs") mit Spalten: `name | email | klasse`

- [ ] **Step 2: Sheet 2 "Stundenplan" erstellen**

Neues Sheet oder Tab in Sheet 1. Spalten:
`kursId | wochentag | lektionen | zeit | raum`

Beispielzeilen:
```
sf-wr-28bc29fs | Mi | 2 | 10:25-11:55 | B204
sf-wr-28bc29fs | Do | 1 | 08:25-09:10 | B204
```

- [ ] **Step 3: Sheet 3 "Schuljahr" erstellen**

4 Tabs:
- "Semester": `kursId | semester | startKW | endKW | schuljahr`
- "TaF-Phasen": `kursId | phase | startKW | endKW | schuljahr`
- "Ferien": `label | startKW | endKW | schuljahr`
- "Sonderwochen": `kw | label | gymLevel | typ | schuljahr`

Daten aus bestehenden Preset-JSONs übertragen.

- [ ] **Step 4: Sheet 4 "Lehrplan" erstellen**

2 Tabs:
- "Lehrplanziele": `id | ebene | parentId | fach | gefaess | semester | thema | text | bloom`
- "Beurteilungsregeln": `gefaess | semester | minNoten | gewichtung | bemerkung`

Daten aus `lehrplanziele_sf_wr_lp17.json` und `beurteilung_hofwil.json` übertragen.

- [ ] **Step 5: Sheet-IDs notieren**

Jede Sheet-URL enthält die ID: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
Notiere die 4 IDs für Step 6.

---

### Task 2: Apps Script — Sheet-Konstanten + Endpoints

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Konstanten + 4 neue Endpoints)

- [ ] **Step 1: Sheet-Konstanten hinzufügen**

In `apps-script-code.js` nach Zeile 18 (bestehende Konstanten):

```javascript
// Zentrale Daten-Sheets (Synergien)
const KURSE_SHEET_ID = 'PLACEHOLDER_KURSE';       // User muss ID einsetzen
const STUNDENPLAN_SHEET_ID = 'PLACEHOLDER_STUNDENPLAN';
const SCHULJAHR_SHEET_ID = 'PLACEHOLDER_SCHULJAHR';
const LEHRPLAN_SHEET_ID = 'PLACEHOLDER_LEHRPLAN';
```

- [ ] **Step 2: Endpoint `ladeKurse` implementieren**

```javascript
function ladeKurseEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var sheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName('Kurse');
    if (!sheet) return jsonResponse({ kurse: [] });
    var data = getSheetData(sheet);
    var kurse = data.filter(function(r) { return r.lpEmail === email && r.aktiv !== 'false'; });
    return jsonResponse({ kurse: kurse });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}
```

- [ ] **Step 3: Endpoint `ladeKursDetails` implementieren**

```javascript
function ladeKursDetailsEndpoint(body) {
  try {
    var email = body.email;
    var kursId = body.kursId;
    if (!email || !kursId) return jsonResponse({ error: 'Parameter fehlen' });

    // Kurs-Meta laden
    var kurseSheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName('Kurse');
    var kursMeta = getSheetData(kurseSheet).find(function(r) { return r.kursId === kursId; });
    if (!kursMeta) return jsonResponse({ error: 'Kurs nicht gefunden' });

    // SuS-Liste: Tab mit Kurslabel suchen
    var susSheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName(kursMeta.label);
    var sus = susSheet ? getSheetData(susSheet) : [];

    // Stundenplan
    var spSheet = SpreadsheetApp.openById(STUNDENPLAN_SHEET_ID).getSheets()[0];
    var stundenplan = spSheet ? getSheetData(spSheet).filter(function(r) { return r.kursId === kursId; }) : [];

    // Phasen (optional — nur für TaF)
    var phasenSheet = SpreadsheetApp.openById(SCHULJAHR_SHEET_ID).getSheetByName('TaF-Phasen');
    var phasen = phasenSheet ? getSheetData(phasenSheet).filter(function(r) { return r.kursId === kursId; }) : [];

    return jsonResponse({
      kurs: kursMeta,
      schueler: sus,
      stundenplan: stundenplan,
      phasen: phasen
    });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}
```

- [ ] **Step 4: Endpoint `ladeSchuljahr` implementieren**

```javascript
function ladeSchuljahrEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var ss = SpreadsheetApp.openById(SCHULJAHR_SHEET_ID);

    var ferienSheet = ss.getSheetByName('Ferien');
    var ferien = ferienSheet ? getSheetData(ferienSheet) : [];

    var swSheet = ss.getSheetByName('Sonderwochen');
    var sonderwochen = swSheet ? getSheetData(swSheet) : [];

    var semSheet = ss.getSheetByName('Semester');
    var semester = semSheet ? getSheetData(semSheet) : [];

    var phasenSheet = ss.getSheetByName('TaF-Phasen');
    var phasen = phasenSheet ? getSheetData(phasenSheet) : [];

    return jsonResponse({ ferien: ferien, sonderwochen: sonderwochen, semester: semester, phasen: phasen });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}
```

- [ ] **Step 5: Endpoint `ladeLehrplan` implementieren**

```javascript
function ladeLehrplanEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var fach = body.fach || null;
    var gefaess = body.gefaess || null;
    var ss = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID);

    var lzSheet = ss.getSheetByName('Lehrplanziele');
    var lz = lzSheet ? getSheetData(lzSheet) : [];
    if (fach) lz = lz.filter(function(r) { return r.fach === fach; });
    if (gefaess) lz = lz.filter(function(r) { return r.gefaess === gefaess; });

    var brSheet = ss.getSheetByName('Beurteilungsregeln');
    var regeln = brSheet ? getSheetData(brSheet) : [];
    if (gefaess) regeln = regeln.filter(function(r) { return r.gefaess === gefaess; });

    return jsonResponse({ lehrplanziele: lz, beurteilungsregeln: regeln });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}
```

- [ ] **Step 6: Endpoints in doPost/doGet registrieren**

In `doGet` switch (für schnelle Lesezugriffe):
```javascript
case 'ladeKurse': return ladeKurseEndpoint({ email: e.parameter.email });
case 'ladeKursDetails': return ladeKursDetailsEndpoint({ email: e.parameter.email, kursId: e.parameter.kursId });
case 'ladeSchuljahr': return ladeSchuljahrEndpoint({ email: e.parameter.email });
case 'ladeLehrplan': return ladeLehrplanEndpoint({ email: e.parameter.email, fach: e.parameter.fach, gefaess: e.parameter.gefaess });
```

- [ ] **Step 7: Build verifizieren + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add apps-script-code.js && git commit -m "S1: Apps Script Endpoints für zentrale Kurs-Verwaltung"
```

---

### Task 3: Prüfungstool — API-Client für zentrale Daten

**Files:**
- Create: `ExamLab/src/services/synergyApi.ts`
- Modify: `ExamLab/src/services/apiService.ts` (Import + Re-Export)

- [ ] **Step 1: synergyApi.ts erstellen**

```typescript
import { APPS_SCRIPT_URL, getJson } from './apiClient'

// Typen
export interface ZentralerKurs {
  kursId: string
  label: string
  fach: string
  gefaess: string
  lpEmail: string
  klassen: string
  aktiv: string
}

export interface StundenplanEintrag {
  kursId: string
  wochentag: string
  lektionen: string
  zeit: string
  raum: string
}

export interface KursDetails {
  kurs: ZentralerKurs
  schueler: Array<{ name: string; email: string; klasse: string }>
  stundenplan: StundenplanEintrag[]
  phasen: Array<{ kursId: string; phase: string; startKW: string; endKW: string }>
}

export interface Schuljahr {
  ferien: Array<{ label: string; startKW: string; endKW: string }>
  sonderwochen: Array<{ kw: string; label: string; gymLevel: string; typ: string }>
  semester: Array<{ kursId: string; semester: string; startKW: string; endKW: string }>
  phasen: Array<{ kursId: string; phase: string; startKW: string; endKW: string }>
}

export interface LehrplanDaten {
  lehrplanziele: Array<{ id: string; ebene: string; parentId: string; fach: string; gefaess: string; semester: string; thema: string; text: string; bloom: string }>
  beurteilungsregeln: Array<{ gefaess: string; semester: string; minNoten: string; gewichtung: string; bemerkung: string }>
}

// API-Funktionen
export async function ladeKurse(email: string): Promise<ZentralerKurs[]> {
  const result = await getJson<{ kurse: ZentralerKurs[] }>('ladeKurse', { email })
  return result?.kurse ?? []
}

export async function ladeKursDetails(email: string, kursId: string): Promise<KursDetails | null> {
  return getJson<KursDetails>('ladeKursDetails', { email, kursId })
}

export async function ladeSchuljahr(email: string): Promise<Schuljahr | null> {
  return getJson<Schuljahr>('ladeSchuljahr', { email })
}

export async function ladeLehrplan(email: string, fach?: string, gefaess?: string): Promise<LehrplanDaten | null> {
  return getJson<LehrplanDaten>('ladeLehrplan', { email, fach: fach ?? '', gefaess: gefaess ?? '' })
}
```

- [ ] **Step 2: apiService.ts erweitern**

Am Ende der Imports:
```typescript
import { ladeKurse, ladeKursDetails, ladeSchuljahr, ladeLehrplan } from './synergyApi'
```

Im `apiService` Objekt ergänzen:
```typescript
ladeKurse,
ladeKursDetails,
ladeSchuljahr,
ladeLehrplan,
```

- [ ] **Step 3: Build + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add src/services/synergyApi.ts src/services/apiService.ts
git commit -m "S1: API-Client für zentrale Kurs-/Schuljahr-/Lehrplan-Daten"
```

---

### Task 4: Unterrichtsplaner — Synergy-Service + Caching

**Files:**
- Create: `Unterrichtsplaner/src/services/synergyService.ts`
- Modify: `Unterrichtsplaner/src/store/settingsStore.ts` (Import-Button)

- [ ] **Step 1: synergyService.ts erstellen**

```typescript
// Synergy-Service: Lädt zentrale Daten via Apps Script + cached in localStorage

const APPS_SCRIPT_URL = '' // User muss URL einsetzen (gleiche wie Prüfungstool)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const LP_EMAIL = 'yannick.durand@gymhofwil.ch'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`synergy-${key}`)
    if (!raw) return null
    const entry: CacheEntry<T> = JSON.parse(raw)
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null
    return entry.data
  } catch { return null }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`synergy-${key}`, JSON.stringify({ data, timestamp: Date.now() }))
  } catch { /* localStorage voll — ignorieren */ }
}

async function fetchFromBackend<T>(action: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!APPS_SCRIPT_URL) return null
  try {
    const url = new URL(APPS_SCRIPT_URL)
    url.searchParams.set('action', action)
    url.searchParams.set('email', LP_EMAIL)
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
    const res = await fetch(url.toString())
    if (!res.ok) return null
    return await res.json() as T
  } catch { return null }
}

export async function ladeKurse(): Promise<unknown[]> {
  const cached = getCached<unknown[]>('kurse')
  if (cached) return cached
  const result = await fetchFromBackend<{ kurse: unknown[] }>('ladeKurse')
  if (result?.kurse) { setCache('kurse', result.kurse); return result.kurse }
  return []
}

export async function ladeSchuljahr(): Promise<unknown | null> {
  const cached = getCached<unknown>('schuljahr')
  if (cached) return cached
  const result = await fetchFromBackend<unknown>('ladeSchuljahr')
  if (result) { setCache('schuljahr', result); return result }
  return null
}

export async function ladeLehrplan(fach?: string, gefaess?: string): Promise<unknown | null> {
  const key = `lehrplan-${fach ?? 'all'}-${gefaess ?? 'all'}`
  const cached = getCached<unknown>(key)
  if (cached) return cached
  const result = await fetchFromBackend<unknown>('ladeLehrplan', { fach: fach ?? '', gefaess: gefaess ?? '' })
  if (result) { setCache(key, result); return result }
  return null
}

export function getCacheAge(key: string): string | null {
  try {
    const raw = localStorage.getItem(`synergy-${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    const age = Date.now() - entry.timestamp
    const h = Math.floor(age / 3600000)
    if (h < 1) return 'vor wenigen Minuten'
    if (h < 24) return `vor ${h}h`
    return `vor ${Math.floor(h / 24)} Tagen`
  } catch { return null }
}

export function istKonfiguriert(): boolean {
  return APPS_SCRIPT_URL.length > 0
}
```

- [ ] **Step 2: Build + Commit**

```bash
cd Unterrichtsplaner && npx tsc --noEmit && npm run build
git add src/services/synergyService.ts
git commit -m "S1: Synergy-Service mit Caching für Unterrichtsplaner"
```

---

## Block S3: Pool-Statistiken im Composer

### Task 5: FragenPerformance an Composer durchreichen

**Files:**
- Modify: `ExamLab/src/components/lp/PruefungsComposer.tsx`
- Modify: `ExamLab/src/components/lp/composer/AbschnitteTab.tsx`

- [ ] **Step 1: PruefungsComposer — fragenStats laden + weitergeben**

In PruefungsComposer.tsx, nach den bestehenden State-Deklarationen, `fragenStats` laden (gleiche Logik wie FragenBrowser):

```typescript
import { erstelleDemoTrackerDaten, aggregiereFragenPerformance } from '../../utils/trackerUtils.ts'
import type { FragenPerformance } from '../../types/tracker.ts'

// Im Component:
const [fragenStats, setFragenStats] = useState<Map<string, FragenPerformance>>(new Map())

useEffect(() => {
  async function ladeStats() {
    if (istDemo || !apiService.istKonfiguriert()) {
      setFragenStats(aggregiereFragenPerformance(erstelleDemoTrackerDaten()))
      return
    }
    if (!user) return
    const tracker = await apiService.ladeTrackerDaten(user.email)
    if (tracker) setFragenStats(aggregiereFragenPerformance(tracker))
  }
  ladeStats()
}, [user])
```

Prop an AbschnitteTab durchreichen:
```typescript
<AbschnitteTab ... fragenStats={fragenStats} />
```

- [ ] **Step 2: AbschnitteTab — Performance-Badge pro Frage**

Props-Interface erweitern:
```typescript
interface Props {
  // ... bestehend
  fragenStats?: Map<string, FragenPerformance>
}
```

Pro Frage in der Abschnitts-Liste ein Badge anzeigen:
```typescript
{fragenStats?.get(frage.id) && (() => {
  const perf = fragenStats.get(frage.id)!
  const farbe = perf.durchschnittLoesungsquote > 70 ? 'text-green-600' :
    perf.durchschnittLoesungsquote >= 40 ? 'text-amber-600' : 'text-red-600'
  return (
    <span className={`text-xs ${farbe}`} title={`${perf.anzahlVerwendungen}× verwendet, ${perf.gesamtN} SuS`}>
      ∅ {perf.durchschnittLoesungsquote}%
      {perf.durchschnittTrennschaerfe != null && ` · TS ${perf.durchschnittTrennschaerfe.toFixed(2)}`}
    </span>
  )
})()}
```

- [ ] **Step 3: Warnungen für extreme Werte**

Nach dem Performance-Badge:
```typescript
{perf.durchschnittLoesungsquote > 90 && <span className="text-xs text-amber-500 ml-1" title="Fast alle SuS lösen diese Frage richtig">⚠ Sehr leicht</span>}
{perf.durchschnittLoesungsquote < 20 && <span className="text-xs text-red-500 ml-1" title="Wenige SuS lösen diese Frage">⚠ Sehr schwer</span>}
{perf.durchschnittTrennschaerfe != null && perf.durchschnittTrennschaerfe < 0.2 && <span className="text-xs text-red-500 ml-1" title="Frage trennt nicht zwischen starken und schwachen SuS">⚠ Schlechte TS</span>}
```

- [ ] **Step 4: Build + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add src/components/lp/PruefungsComposer.tsx src/components/lp/composer/AbschnitteTab.tsx
git commit -m "S3: Pool-Statistiken + Warnungen im Prüfungs-Composer"
```

---

## Block S2: Prüfung ↔ Planer Bridge

### Task 6: ladeTrackerDaten um Noten-Stand erweitern

**Files:**
- Modify: `ExamLab/apps-script-code.js` (ladeTrackerDaten erweitern)
- Modify: `ExamLab/src/types/tracker.ts` (Interface erweitern)

- [ ] **Step 1: TrackerDaten-Interface erweitern**

In `tracker.ts`, `TrackerDaten` ergänzen:
```typescript
export interface TrackerDaten {
  pruefungen: TrackerPruefungSummary[]
  aktualisiert: string
  notenStand?: NotenStandKurs[] // NEU: Noten-Stand pro Kurs
}
```

Das `NotenStandKurs`-Interface existiert bereits (Zeile 69). Prüfen ob es die nötigen Felder hat, ggf. erweitern:
```typescript
export interface NotenStandKurs {
  kursId: string      // NEU: zentrale kursId
  kurs: string
  gefaess: string
  semester: string
  vorhandeneNoten: number
  erforderlicheNoten: number
}
```

- [ ] **Step 2: Backend — Beurteilungsregeln in Tracker einlesen**

In `ladeTrackerDatenEndpoint` (apps-script-code.js), am Ende vor `return jsonResponse(...)`:

```javascript
// Noten-Stand berechnen (wenn Lehrplan-Sheet konfiguriert)
var notenStand = [];
try {
  var brSheet = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID).getSheetByName('Beurteilungsregeln');
  if (brSheet) {
    var regeln = getSheetData(brSheet);
    for (var ri = 0; ri < regeln.length; ri++) {
      var regel = regeln[ri];
      var vorhandene = 0;
      for (var pi = 0; pi < pruefungen.length; pi++) {
        var p = pruefungen[pi];
        if (p.gefaess === regel.gefaess && p.semester === regel.semester && p.durchschnittNote !== null) {
          vorhandene++;
        }
      }
      notenStand.push({
        kursId: '', // wird vom Frontend via Kurse-Zuordnung ergänzt
        kurs: regel.gefaess + ' ' + regel.semester,
        gefaess: regel.gefaess,
        semester: regel.semester,
        vorhandeneNoten: vorhandene,
        erforderlicheNoten: Number(regel.minNoten) || 0
      });
    }
  }
} catch (e) { /* Lehrplan-Sheet nicht konfiguriert — ok */ }
```

Im Response-Objekt `notenStand: notenStand` ergänzen.

- [ ] **Step 3: Build + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add apps-script-code.js src/types/tracker.ts
git commit -m "S2: Noten-Stand in Tracker-Daten (Beurteilungsregeln)"
```

---

### Task 7: Unterrichtsplaner — Prüfungs-Badges in Wochenansicht

**Files:**
- Create: `Unterrichtsplaner/src/services/pruefungBridge.ts`
- Modify: `Unterrichtsplaner/src/components/WeekRows.tsx` (Badge anzeigen)

- [ ] **Step 1: pruefungBridge.ts erstellen**

```typescript
// Lädt Prüfungsdaten via Apps Script und zeigt Badges im Planer

interface PruefungBadge {
  pruefungId: string
  titel: string
  datum: string
  kw: string
  hatNoten: boolean
  anzahlSuS: number
}

interface NotenStandInfo {
  gefaess: string
  semester: string
  vorhandene: number
  erforderliche: number
}

let pruefungBadges: PruefungBadge[] = []
let notenStand: NotenStandInfo[] = []

export function getPruefungFuerKW(kw: string): PruefungBadge | undefined {
  return pruefungBadges.find(p => p.kw === kw)
}

export function getNotenStand(): NotenStandInfo[] {
  return notenStand
}

export async function ladePruefungsDaten(): Promise<void> {
  // Implementierung kommt wenn Synergy-Service konfiguriert ist
  // Vorerst: Daten aus localStorage Cache laden (von synergyService)
}
```

- [ ] **Step 2: Build + Commit**

```bash
cd Unterrichtsplaner && npx tsc --noEmit && npm run build
git add src/services/pruefungBridge.ts
git commit -m "S2: Prüfungs-Bridge Grundstruktur im Unterrichtsplaner"
```

---

## Block S4a: Zentrale Lernziel-DB

### Task 8: Lehrplanziele-Import (Preset → Sheet)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (neuer Endpoint)
- Create: `ExamLab/src/utils/lehrplanImport.ts`

- [ ] **Step 1: Endpoint `importiereLehrplanziele` implementieren**

```javascript
function importiereLehrplanzieleEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var ziele = body.lehrplanziele || [];
    if (ziele.length === 0) return jsonResponse({ error: 'Keine Lernziele übergeben' });

    var ss = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID);
    var sheet = ss.getSheetByName('Lehrplanziele');
    if (!sheet) {
      sheet = ss.insertSheet('Lehrplanziele');
      sheet.getRange(1, 1, 1, 9).setValues([['id', 'ebene', 'parentId', 'fach', 'gefaess', 'semester', 'thema', 'text', 'bloom']]);
    }

    var existing = getSheetData(sheet);
    var existingIds = new Set(existing.map(function(r) { return r.id; }));
    var neu = 0, aktualisiert = 0;

    for (var i = 0; i < ziele.length; i++) {
      var z = ziele[i];
      if (existingIds.has(z.id)) {
        // Update: Zeile finden und überschreiben
        var rowIdx = existing.findIndex(function(r) { return r.id === z.id; });
        if (rowIdx >= 0) {
          sheet.getRange(rowIdx + 2, 1, 1, 9).setValues([[z.id, z.ebene || 'fein', z.parentId || '', z.fach, z.gefaess || '', z.semester || '', z.thema || '', z.text, z.bloom || '']]);
          aktualisiert++;
        }
      } else {
        sheet.appendRow([z.id, z.ebene || 'fein', z.parentId || '', z.fach, z.gefaess || '', z.semester || '', z.thema || '', z.text, z.bloom || '']);
        neu++;
      }
    }

    return jsonResponse({ erfolg: true, neu: neu, aktualisiert: aktualisiert });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}
```

In doPost switch: `case 'importiereLehrplanziele': return importiereLehrplanzieleEndpoint(body);`

- [ ] **Step 2: lehrplanImport.ts — Preset-Konverter**

```typescript
// Konvertiert bestehende Preset-Formate in das zentrale Lernziel-Format

interface PresetLehrplanziel {
  id: string
  area: string
  cycle: number
  topic: string
  goal: string
  contents: string[]
  semester: string
}

interface ZentralesLernziel {
  id: string
  ebene: 'grob' | 'fein'
  parentId: string
  fach: string
  gefaess: string
  semester: string
  thema: string
  text: string
  bloom: string
}

export function konvertierePresetLehrplanziele(presets: PresetLehrplanziel[]): ZentralesLernziel[] {
  return presets.map(p => ({
    id: p.id,
    ebene: 'grob' as const,
    parentId: '',
    fach: areaZuFach(p.area),
    gefaess: 'SF',
    semester: p.semester,
    thema: p.topic,
    text: p.goal,
    bloom: '',
  }))
}

function areaZuFach(area: string): string {
  switch (area) {
    case 'RECHT': return 'Recht'
    case 'VWL': return 'VWL'
    case 'BWL': return 'BWL'
    default: return area
  }
}
```

- [ ] **Step 3: Build + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add apps-script-code.js src/utils/lehrplanImport.ts
git commit -m "S4a: Lehrplanziele-Import Endpoint + Preset-Konverter"
```

---

### Task 9: ladeLernziele auf zentrale DB umstellen

**Files:**
- Modify: `ExamLab/apps-script-code.js` (ladeLernziele erweitern)
- Modify: `ExamLab/src/services/poolApi.ts` (Fallback-Logik)

- [ ] **Step 1: ladeLernziele — zuerst Lehrplan-Sheet, dann Pool-Sheet**

In `ladeLernziele` (apps-script-code.js), Logik erweitern: Zuerst Lehrplan-Sheet lesen (zentrale DB), bei Fehler Fallback auf bisheriges Pool-Lernziele-Sheet.

```javascript
// Am Anfang der Funktion:
try {
  var lehrplanSheet = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID).getSheetByName('Lehrplanziele');
  if (lehrplanSheet) {
    var lpData = getSheetData(lehrplanSheet);
    if (lpData.length > 0) {
      var lernziele = [];
      for (var i = 0; i < lpData.length; i++) {
        var row = lpData[i];
        if (fachFilter && row.fach !== fachFilter) continue;
        lernziele.push({ id: row.id, fach: row.fach, text: row.text, bloom: row.bloom, thema: row.thema, ebene: row.ebene });
      }
      return jsonResponse({ lernziele: lernziele });
    }
  }
} catch (e) { /* Lehrplan-Sheet nicht konfiguriert — Fallback */ }
// ... bestehende Pool-Lernziele-Logik als Fallback
```

- [ ] **Step 2: Build + Commit**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add apps-script-code.js
git commit -m "S4a: ladeLernziele liest zuerst aus zentralem Lehrplan-Sheet"
```

---

## Block S4b: Abdeckungs-Analyse (spätere Phase)

### Task 10: Lernziel-Abdeckung berechnen

> **Hinweis:** S4b setzt voraus, dass alle 3 Tools zentrale Lernziel-IDs nutzen. Kann erst implementiert werden, wenn Planer `lernzielIds[]` pro Sequenz hat und Pools `lernzielIds[]` in POOL_META haben.

**Files:**
- Create: `ExamLab/src/utils/lernzielAbdeckung.ts`
- Modify: `ExamLab/apps-script-code.js` (Endpoint)

- [ ] **Step 1: Abdeckungs-Utility erstellen**

```typescript
export interface LernzielAbdeckung {
  lernzielId: string
  text: string
  unterrichtet: boolean  // Planer: Sequenz mit lernzielId existiert
  geuebt: boolean        // Pools: Frage mit lernzielId existiert
  geprueft: boolean      // Prüfungstool: Frage mit lernzielId in Prüfung verwendet
  pruefungsCount: number
  loesungsquote: number | null
}

export function berechneLernzielAbdeckung(
  lernziele: Array<{ id: string; text: string }>,
  pruefungsFragenIds: Set<string>,        // frageIds aus Prüfungen
  poolFragenIds: Set<string>,             // frageIds aus Pools
  fragenLernziele: Map<string, string[]>,  // frageId → lernzielIds
): LernzielAbdeckung[] {
  return lernziele.map(lz => {
    const geprueft = [...fragenLernziele.entries()].some(
      ([fId, lzIds]) => pruefungsFragenIds.has(fId) && lzIds.includes(lz.id)
    )
    const geuebt = [...fragenLernziele.entries()].some(
      ([fId, lzIds]) => poolFragenIds.has(fId) && lzIds.includes(lz.id)
    )
    return {
      lernzielId: lz.id,
      text: lz.text,
      unterrichtet: false, // wird vom Planer gesetzt
      geuebt,
      geprueft,
      pruefungsCount: 0,
      loesungsquote: null,
    }
  })
}
```

- [ ] **Step 2: Commit (Grundstruktur, Ausbau in späterer Session)**

```bash
cd ExamLab && npx tsc --noEmit && npm run build
git add src/utils/lernzielAbdeckung.ts
git commit -m "S4b: Lernziel-Abdeckung Grundstruktur (ohne Planer-Integration)"
```

---

## Abschluss

### Task 11: HANDOFF + Dokumentation aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`
- Modify: `Unterrichtsplaner/HANDOFF.md`

- [ ] **Step 1: HANDOFF.md beider Projekte aktualisieren**

Neue Session-Sektion in beiden HANDOFFs mit:
- Geänderte Dateien
- Neue Endpoints + Sheet-Konstanten
- **Wichtig:** User muss 4 Sheets manuell erstellen + IDs in apps-script-code.js eintragen + neue Apps Script Bereitstellung

- [ ] **Step 2: Finaler Commit + Push**

```bash
git add -A && git commit -m "Tool-Synergien: S1 Kurs-Verwaltung + S3 Pool-Stats + S2 Noten-Stand + S4a Lernziel-DB" && git push
```

---

## Zusammenfassung

| Block | Tasks | Aufwand | Ergebnis |
|-------|-------|---------|----------|
| S1 | 1-4 | Gross | 4 Sheets + 4 Endpoints + 2 API-Clients |
| S3 | 5 | Klein | Performance-Badges + Warnungen im Composer |
| S2 | 6-7 | Mittel | Noten-Stand in Tracker + Planer-Bridge |
| S4a | 8-9 | Mittel | Lehrplanziele-Import + zentrale Lernziel-DB |
| S4b | 10 | Klein (Grundstruktur) | Abdeckungs-Utility (ohne Planer-Integration) |
| Doku | 11 | Klein | HANDOFFs aktualisiert |

**User-Aktion nach Implementierung:**
1. 4 Google Sheets erstellen (Task 1)
2. Sheet-IDs in `apps-script-code.js` eintragen (Konstanten)
3. Apps Script Code in Editor kopieren + neue Bereitstellung
4. Apps Script URL in Planer `synergyService.ts` eintragen
