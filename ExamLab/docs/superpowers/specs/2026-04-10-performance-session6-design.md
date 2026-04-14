# Session 6 — Performance + Problem-Melden

> Scope: A (LP-Laden optimieren) + B (SuS-Skeleton) + C (Problem-Melden Kontext) + E (Prefetching)
> Branch: `feature/performance-features`
> Basis: `feature/ux-polish-session5`

---

## Ist-Zustand

### LP-Laden (~25 Sek.)

`LPStartseite.tsx:195–239` macht beim Mount 3 parallele API-Calls via `Promise.all`:

1. `ladeAlleConfigs(email)` — Prüfungs-/Übungs-Konfigurationen
2. `ladeTrackerDaten(email)` — Monitoring-Daten
3. `fragenbankStore.lade(email)` — 2-stufig: Summaries (schnell) → Details (Hintergrund, 90s Timeout)

**Nach** den Calls: `syncEinrichtungsPruefung()` + `syncEinrichtungsUebung()` → nochmal `ladeAlleConfigs()`.

**Probleme:**
- Kein IndexedDB-Cache für Fragenbank — jeder Mount = 3–5 MB neu laden
- Kein Skeleton — leere Seite für ~25s
- Sync läuft bei jedem Mount, auch wenn nichts geändert wurde
- Keine `React.lazy()` Boundaries im LP-Bereich

### SuS-Skeleton

`SuSStartseite.tsx:103–117` hat bereits ein einfaches Skeleton (animate-pulse Header + Text).
Könnte erweitert werden mit Karten-Platzhaltern.

### Problem-Melden

`FeedbackModal.tsx:6–13` — `FeedbackContext` hat: `rolle`, `ort`, `pruefungId?`, `frageId?`, `frageText?`, `zusatzinfo?`.
Fehlt: `frageTyp`, `modus`, `bildschirm`, `appVersion`, `gruppeId`.

7 Verwendungsstellen: `LPHeader`, `AppShell`, `KorrekturFragenAnsicht`, `KorrekturEinsicht`, `Startbildschirm`, `FeedbackButton`, `FeedbackModal`.

---

## Design

### A) IndexedDB-Cache für Fragenbank (grösster Performance-Impact)

**Neue Datei:** `src/services/fragenbankCache.ts`

```typescript
const IDB_NAME = 'examlab-cache'
const IDB_VERSION = 1
const STORE_SUMMARIES = 'fragenbank-summaries'
const STORE_DETAILS = 'fragenbank-details'
const STORE_META = 'cache-meta'

interface CacheMeta {
  key: string
  timestamp: string   // ISO, wann zuletzt vom Server geladen
  count: number       // Anzahl Einträge
}

// API
export async function getCachedSummaries(): Promise<FrageSummary[] | null>
export async function setCachedSummaries(summaries: FrageSummary[]): Promise<void>
export async function getCachedDetails(): Promise<Frage[] | null>
export async function setCachedDetails(details: Frage[]): Promise<void>
export async function getCacheMeta(key: string): Promise<CacheMeta | null>
export async function clearFragenbankCache(): Promise<void>
```

**Stale-While-Revalidate Pattern in `fragenbankStore.ts`:**

```
lade(email):
  1. Prüfe IndexedDB-Cache (nur wenn cacheInvalid !== true)
  2. Wenn Cache vorhanden UND < 10 Minuten alt:
     → Sofort in Store setzen (status: 'summary_fertig')
     → Im Hintergrund: Server-Summaries laden mit force=true (Status-Guards bypassen!)
       → Bei Änderung: Store + IndexedDB updaten
       → Bei Gleichheit: nur CacheMeta-Timestamp refreshen
  3. Wenn kein Cache oder abgelaufen oder invalid:
     → Wie bisher: Server laden → Store + IndexedDB setzen
     → cacheInvalid zurücksetzen
```

**Wichtig:** Die Hintergrund-Revalidierung muss `ladeSummaries(email, true)` mit `force=true` aufrufen, da der Status-Guard in Zeile 70 (`if (status !== 'idle' && !force) return`) sonst den Call blockiert.

**Cache-Invalidierung (3 Ebenen):**
1. **Zeitbasiert:** Maximal 10 Minuten alt (Multi-Teacher-Umgebung → kurzes Fenster)
2. **Store-Mutationen:** In `aktualisiereFrage`, `entferneFrage` und `fuegeFragenHinzu` im fragenbankStore den IndexedDB-Cache als dirty markieren (Flag `cacheInvalid = true`). Nächster `lade()`-Aufruf ignoriert Cache.
3. **Logout:** `clearFragenbankCache()` in der Store-`reset()`-Methode aufrufen → verhindert User-A-sieht-User-B-Daten.

**Fehlerbehandlung:** Alle IndexedDB-Schreibzugriffe (`setCachedSummaries`, `setCachedDetails`) in try/catch wrappen. Bei Fehler (z.B. Private Browsing, QuotaExceeded): silent ignore, App funktioniert wie ohne Cache.

### A2) LP-Skeleton

**Neue Datei:** `src/components/lp/LPSkeleton.tsx` (~50 Zeilen)

Zeigt pulsierendes Dashboard-Layout:
- Header-Bar (identisch mit echtem Header)
- 2 Tab-Platzhalter (Prüfen / Üben)
- 3–4 Karten-Platzhalter (animate-pulse)

Eingebaut in `LPStartseite.tsx`:
```tsx
if (ladeStatus === 'laden') return <LPSkeleton />
```

### A3) Sync nur beim ersten Login

**In `LPStartseite.tsx`:**

```typescript
const SYNC_DONE_KEY = 'examlab-sync-done'

// Nur syncen wenn noch nie gesynct (pro Browser-Session)
if (!sessionStorage.getItem(SYNC_DONE_KEY)) {
  await Promise.all([syncEinrichtungsPruefung(...), syncEinrichtungsUebung(...)])
  sessionStorage.setItem(SYNC_DONE_KEY, '1')
  // Configs nur neu laden wenn Sync tatsächlich was geändert hat
  const neueConfigs = await apiService.ladeAlleConfigs(email)
  if (neueConfigs) setConfigs(neueConfigs)
}
```

`sessionStorage` statt `localStorage` → pro Tab-Session, wird bei Tab-Schliessung gelöscht.
**Fehlerbehandlung:** `SYNC_DONE_KEY` nur setzen wenn `Promise.all` erfolgreich war. Bei Fehler: kein Key → nächster Mount versucht erneut.

### B) SuS-Skeleton erweitern

In `SuSStartseite.tsx` das bestehende Skeleton erweitern:
- 3 Karten-Platzhalter unter dem Header
- Gleicher animate-pulse Stil wie LP-Skeleton
- Suspense-Boundary um `AppUeben` bleibt bestehen

Minimal — das meiste ist schon da.

### C) Problem-Melden Kontext erweitern

**`FeedbackContext` erweitern:**

```typescript
export interface FeedbackContext {
  rolle: 'lp' | 'sus'
  ort: string
  pruefungId?: string
  frageId?: string
  frageText?: string
  zusatzinfo?: string
  // NEU:
  frageTyp?: string
  modus?: 'pruefen' | 'ueben' | 'fragensammlung'
  bildschirm?: string     // z.B. 'dashboard', 'composer', 'monitoring'
  appVersion?: string
  gruppeId?: string
}
```

**`appVersion`:** Via Vite `define` in `vite.config.ts`:
```typescript
define: { '__APP_BUILD_TIME__': JSON.stringify(new Date().toISOString()) }
```
Dann im Code: `appVersion: typeof __APP_BUILD_TIME__ === 'string' ? __APP_BUILD_TIME__ : 'unknown'`.

**Verwendungsstellen anpassen:**

| Stelle | Neue Felder |
|--------|-------------|
| `LPHeader.tsx` | `modus: aktuellerTab`, `bildschirm: 'header'` |
| `AppShell.tsx` (Üben) | `modus: 'ueben'`, `gruppeId`, `bildschirm` aus navigationStore |
| `KorrekturFragenAnsicht.tsx` | `frageTyp`, `modus: 'pruefen'`, `bildschirm: 'korrektur'` |
| `KorrekturEinsicht.tsx` | `frageTyp`, `modus: 'pruefen'` |
| `Startbildschirm.tsx` | `bildschirm: 'start'` |

**Im Modal:** Kontext-Felder automatisch als versteckten Block ans Feedback anhängen (User muss nichts manuell eingeben).

**Submission:** Aktuell Image-Ping (GET mit URLSearchParams). Neue Felder halten die URL kompakt (kurze Strings). Falls URL > 1500 Zeichen: `navigator.sendBeacon()` als POST-Fallback. Die neuen Felder (`frageTyp`, `modus`, `bildschirm`, `appVersion`, `gruppeId`) sind alle < 30 Zeichen, also kein Problem.

### E) Hintergrund-Prefetching

**In `LPStartseite.tsx` nach `setLadeStatus('fertig')`:**

```typescript
// Prefetch im Hintergrund wenn Browser idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Fragenbank-Details im Hintergrund laden (wenn nur Summaries da)
    const fbState = useFragenbankStore.getState()
    if (fbState.status === 'summary_fertig') {
      fbState.ladeAlleDetails(user.email)
    }
  })
} else {
  // Fallback: nach 2s starten
  setTimeout(() => {
    const fbState = useFragenbankStore.getState()
    if (fbState.status === 'summary_fertig') {
      fbState.ladeAlleDetails(user.email)
    }
  }, 2000)
}
```

Das Fragenbank-Detail-Loading ist bereits als Hintergrund-Task implementiert (`ladeAlleDetails`). Der Prefetch stellt sicher, dass es auch bei Cache-Hit (wo Summaries sofort da sind) zeitnah startet.

**Configs-Prefetch:** Nicht nötig — Configs sind schnell und werden sowieso geladen.

---

## Nicht in Scope

- Excel-Import (D) — eigene Session
- Lernziele überall (F) — eigene Session
- React.lazy() für LP-Subkomponenten — bringt wenig wenn die Daten der Bottleneck sind
- `useDeferredValue` für Filter — nur sinnvoll bei >100ms Render-Kosten

## Neue Dateien

1. `src/services/fragenbankCache.ts` — IndexedDB Cache-Layer (~80 Z.)
2. `src/components/lp/LPSkeleton.tsx` — LP Loading Skeleton (~50 Z.)

## Geänderte Dateien

1. `src/store/fragenbankStore.ts` — Stale-While-Revalidate mit Cache
2. `src/components/lp/LPStartseite.tsx` — Skeleton + Sync-Guard + Prefetch
3. `src/components/sus/SuSStartseite.tsx` — Skeleton erweitern
4. `src/components/shared/FeedbackModal.tsx` — Erweiterte Context-Felder
5. `src/components/lp/LPHeader.tsx` — FeedbackButton Kontext erweitern
7. `src/components/ueben/layout/AppShell.tsx` — FeedbackButton Kontext erweitern
8. `src/components/lp/korrektur/KorrekturFragenAnsicht.tsx` — Kontext erweitern
9. `src/components/sus/KorrekturEinsicht.tsx` — Kontext erweitern
10. `src/components/Startbildschirm.tsx` — Kontext erweitern
11. `vite.config.ts` — `__APP_BUILD_TIME__` define hinzufügen

## Verifizierung

- [ ] `npx tsc -b` + `npx vitest run` + `npm run build`
- [ ] LP-Ladezeit: Erstaufruf ~gleich, Zweitaufruf deutlich schneller (IndexedDB-Hit)
- [ ] LP: Skeleton sichtbar beim Laden (nicht blank)
- [ ] SuS: Skeleton mit Karten-Platzhaltern
- [ ] Problem-Melden: Formular-Payload enthält automatisch frageTyp, modus, bildschirm, appVersion
- [ ] Prefetching: Details laden im Hintergrund, kein UI-Block
- [ ] Cache-Invalidierung: Nach Frage speichern/löschen → nächster Load holt frische Daten

## Risiken

- IndexedDB kann bei Private Browsing fehlschlagen → Graceful Fallback (wie bisher ohne Cache)
- Cache-Staleness: 30min-Grenze + Invalidierung bei Schreiboperationen als Schutz
- `requestIdleCallback` nicht in allen Browsern → setTimeout-Fallback
