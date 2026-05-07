# Bundle T.f — LPStartseite Hook- + Komponenten-Extraktion (Design Spec)

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Bezug:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](2026-05-06-bundle-t-hooks-splits-design.md) §5.3 (Master-Spec)
**Sub-Bundle:** 6/6 in Bundle T (nach T.a/T.b/T.c/T.d/T.e — Schluss-Sub-Bundle)

## 1. Kontext

Letztes Sub-Bundle aus Bundle T. Master-Spec auf main `1be0f6a`. `LPStartseite.tsx` ist mit **1043 Zeilen, 10 useState, 12 useMemo, 5 useEffect, 6 Stores, 2 Sub-Komponenten (`PruefungsKarte` + `TrackerBadge`) und 1 Demo-Helper im selben File** das grösste verbleibende Hotspot-File und als hoch-Risiko klassifiziert (Master-Spec §3 Inventar).

Hotspot-Bilanz Files >500 Z. nach T.e: **8 Files**. Nach T.f Ziel: **7 Files** (LPStartseite verlässt das Hotspot-Set).

Die fünf vorherigen Sub-Bundles haben fünf zentrale Patterns etabliert:
- **Hook-Naming via Domain-Prefix** (T.a, T.e — `useLP*` für LP-Bereich, flach in `src/hooks/`)
- **Hook-Result-Destrukturierung** in stabile Namen (T.d Reviewer-Iteration-1-Lehre)
- **Pure-Hooks bekommen Vitest, Async-Store-Orchestration nicht** (Master-Spec §4.2)
- **Komponenten-Splits in eigenem Sub-Folder** (T.b: `tkonto/`, T.c: `fragenbrowser/`, T.d: `zeichnen/`, T.e: `dashboard/`) — T.f folgt mit `lp/startseite/`
- **Inline-Closure-Helper als DRY-Alternative zum Komponenten-Split** (T.e Hotfix#1) — wo passend

T.f folgt allen fünf Patterns.

## 2. Ziel

LPStartseite.tsx von **1043 → ~430 Zeilen (-59%)** reduzieren, ohne Verhaltensänderung. Hotspot-Set verlassen.

## 3. Scope (Strategie F+ — Hooks + Utility + Komponenten-Splits)

### In Scope

| Cut | Ziel | Z. neu | Test |
|---|---|---:|---|
| Hook 1: `useLPConfigFiltering(inputs)` | 6 Filter-Memos + `letzteFuenf` + `hatAktiveFilter` (8 Outputs) + interner `filtereConfigs`-Helper | ~110 | JA |
| Hook 1 Test-File: `useLPConfigFiltering.test.ts` | ~14 Vitest-Tests (renderHook + Mocks) | ~220 | — |
| Hook 2: `useLPFavoriten({ configs, favoriten })` | 4 Favoriten-Memos | ~50 | JA |
| Hook 2 Test-File: `useLPFavoriten.test.ts` | ~6 Vitest-Tests | ~110 | — |
| Hook 3: `useLPDashboardData({ user, istDemoModus })` | 5 useState + grosser Lade-useEffect + `findeTrackerSummary` + Reload-Funktion | ~140 | NEIN |
| Utility: `lpEinrichtungSync.ts` | 4 Konstanten + `syncFragenSeriell` + `syncEinrichtungsPruefung` + `syncEinrichtungsUebung` | ~70 | JA (Sync-Reihenfolge + Guard) |
| Utility Test-File: `lpEinrichtungSync.test.ts` | ~5 Vitest-Tests (Guard, Serial, Pause-Timing) | ~120 | — |
| Komponenten-Split 1: `lp/startseite/PruefungsKarte.tsx` (mit `TrackerBadge` co-located) | Karte + Tracker-Badge + Link-Kopier-State | ~125 | NEIN (UI) |
| Komponenten-Split 2: `lp/startseite/FilterLeiste.tsx` | DRY: 2 nahezu-identische Toolbars (Z. 537-606 + Z. 688-755) → 1 Komponente, beide Modi nutzen sie | ~110 | NEIN (UI) |
| Komponenten-Split 3: `lp/startseite/MultiDashboardDialog.tsx` | Dialog (Z. 778-818) | ~55 | NEIN (UI) |
| Komponenten-Split 4: `lp/startseite/LPPruefungenAnsicht.tsx` | Prüfen-Modus-Body (Z. 643-862) inkl. Skeleton/Empty/Liste | ~165 | NEIN (UI) |
| Komponenten-Split 5: `lp/startseite/LPUebungenAnsicht.tsx` | Übungen-Tab-Body (Z. 519-634) inkl. Skeleton/Empty/Liste | ~95 | NEIN (UI) |

**Total neue Files:** 3 Hooks + 1 Utility + 5 Komponenten + 3 Test-Files = **12 Files**.

### Out of Scope

- **`<DashboardContentLayout>`-Wrapper** (Master-Spec YAGNI-Kandidat) — die 5 Modus-Branches (composer/uebung/pruefung/fragensammlung/papierkorb) bleiben als bedingte Render-Blöcke im Body. Layout ist trivial (h-screen + flex-col + flex-row + sidebar + overlays); ein Layout-Wrapper würde mehr Komplexität als Reduktion bringen.
- **Wrapper-Pattern aufbrechen** — Dispatcher (`LPStartseite`) + `LPStartseiteInner` bleiben byte-identisch. Master-Spec §5.3 hat ausdrücklich dokumentiert dass dieses Pattern erhalten bleibt (verhindert React-#310 bei URL-Wechsel).
- **`useLPRouteSync`/`useLPNavigation`** — bestehende Hooks unverändert, nur referenziert.
- **`aktiverKurs`-Memo (Z. 104)** — bleibt im Body (single useMemo, gehört zur Üben-Kurs-Domain, nicht zur Config-Filter-Domain).
- **5 useEffect-Konsolidierung** — die 5 useEffect's bleiben separat (Lehre Bundle T.b/T.e: byte-identisch ist Pflicht). useLPDashboardData kapselt nur den grossen Lade-useEffect (Z. 300-394); die 4 kleinen useEffect's (kurs-redirect, localStorage-kurs, deepLink-config, beforeunload) bleiben im Body.
- **`handleZurueck`-Reload-Logik** — bleibt im Body, ruft `reload()` aus useLPDashboardData (kein Hook für 18-Zeilen-Action). Die Reload-Funktion wird vom Hook exponiert.
- **`PruefungsKarte`-Render-Performance-Optimierung** — pre-existing: handlers sind inline (`handleNeue` wird pro Render neu erzeugt → PruefungsKarte re-rendert immer). Byte-identisch erhalten — keine `useCallback`-Optimierung als Refactor-Bonus (würde Verhaltensänderungs-Surface vergrössern).
- **Test-Coverage für PruefungsKarte/TrackerBadge/FilterLeiste/MultiDashboardDialog/LPPruefungenAnsicht/LPUebungenAnsicht** — UI-Komponenten, Browser-E2E reicht (Master-Spec §4.2).
- **Apps-Script / Backend / Wire-Vertrag** — T.f ist Frontend-only.

## 4. Architektur

### 4.1 File-Map

| Datei | Status | Zeilen |
|---|---|---:|
| `ExamLab/src/components/lp/LPStartseite.tsx` | modifiziert | 1043 → ~430 |
| `ExamLab/src/hooks/useLPConfigFiltering.ts` | NEU | ~110 |
| `ExamLab/src/hooks/useLPConfigFiltering.test.ts` | NEU | ~220 |
| `ExamLab/src/hooks/useLPFavoriten.ts` | NEU | ~50 |
| `ExamLab/src/hooks/useLPFavoriten.test.ts` | NEU | ~110 |
| `ExamLab/src/hooks/useLPDashboardData.ts` | NEU | ~140 |
| `ExamLab/src/utils/lpEinrichtungSync.ts` | NEU | ~70 |
| `ExamLab/src/utils/lpEinrichtungSync.test.ts` | NEU | ~120 |
| `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx` | NEU | ~125 |
| `ExamLab/src/components/lp/startseite/FilterLeiste.tsx` | NEU | ~110 |
| `ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx` | NEU | ~55 |
| `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx` | NEU | ~165 |
| `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx` | NEU | ~95 |

### 4.2 Hook-Naming-Wahl

Master-Spec-Vorschlag war 3 Hooks: `useLPConfigFiltering` + `useLPFavoriten` + `useLPLetzteAktivitaet`. Diese Spec konsolidiert auf **2 Hooks** (`useLPConfigFiltering` enthält `letzteFuenf` + `hatAktiveFilter`-Derivate, weil sie zur Filter-Domain gehören und derselbe Cluster sind) **plus 1 zusätzlichen Hook** `useLPDashboardData` für den 95-Zeilen-Lade-useEffect (analog T.e `useDashboardLoad`).

**Rationale Konsolidierung `useLPLetzteAktivitaet` → `useLPConfigFiltering`:**
- `letzteFuenf` braucht `summativeConfigs` + `hatAktiveFilter` als Input
- Beide werden ohnehin innerhalb des Hooks berechnet
- 1 separater Hook für 1 Memo wäre Über-Abstraktion (ein useMemo, 4 Code-Zeilen)
- Master-Spec markierte den Hook auch als "ggf." (YAGNI-Kandidat-light)

**Rationale Hinzufügung `useLPDashboardData`:**
- Master-Spec mentionierte `useEinrichtungSync` als Audit-Vorschlag, mit Bemerkung "in writing-plans verifizieren ob Hook oder useEffect, ob YAGNI"
- Der grosse Lade-useEffect (Z. 300-394, 95 Zeilen) ist der grösste einzelne Code-Block im File
- Extraktion analog T.e `useDashboardLoad` (4× Store-Async-Orchestration → kein Test, Browser-E2E reicht)
- Sync-Helpers als separate Utility (testbar, weil pure-Logik)

LP-Bereich wird durch Pfad `src/hooks/useLP*` (flach) markiert (Master-Spec §4.1).

### 4.3 `useLPConfigFiltering`

**Pfad:** `ExamLab/src/hooks/useLPConfigFiltering.ts`

**Signatur:**

```typescript
export interface UseLPConfigFilteringInputs {
  configs: PruefungsConfig[]
  suchtext: string
  filterFach: string[]
  filterTyp: string | null
  filterGefaess: string | null
  sortierung: 'datum' | 'titel' | 'klasse'
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
}

export interface UseLPConfigFilteringResult {
  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  hatAktiveFilter: boolean
}

export function useLPConfigFiltering(
  inputs: UseLPConfigFilteringInputs
): UseLPConfigFilteringResult
```

**Verantwortung:** kapselt 6 useMemo's (Z. 149-235) + den nicht-memoisierten `filtereConfigs`-Helper (Z. 162-198) + den derived `hatAktiveFilter` (Z. 146).

**Heutige Quelle (LPStartseite.tsx):**

```typescript
// Z. 146 (derived, nicht memoized)
const hatAktiveFilter = suchtext.length > 0 || filterFach.length > 0 || ...

// Z. 149-159: verfuegbareFachbereiche, verfuegbareGefaesse
// Z. 162-198: filtereConfigs(basisConfigs) — non-memoized helper
// Z. 201-210: summativeConfigs, gefilterteConfigs, formativeConfigs, gefilterteUebungen
// Z. 232-235: letzteFuenf
```

**Hook-interne Implementation:**
- 6 useMemo's byte-identisch übernommen (gleiche Deps, gleiche Bodies, **inkl.** der `// eslint-disable-next-line react-hooks/exhaustive-deps`-Direktive bei `gefilterteConfigs`/`gefilterteUebungen`)
- `filtereConfigs`-Helper als interne Hook-Funktion (innerhalb `useLPConfigFiltering`-Body) — schliesst über die 7 Inputs
- `hatAktiveFilter` als simple Berechnung, nicht memoized (analog Quelle)

**Caller-Pattern in LPStartseite.tsx** (Lehre `feedback_hook_result_destructuring.md` aus T.d):

```typescript
const {
  verfuegbareFachbereiche,
  verfuegbareGefaesse,
  summativeConfigs,
  gefilterteConfigs,
  formativeConfigs,
  gefilterteUebungen,
  letzteFuenf,
  hatAktiveFilter,
} = useLPConfigFiltering({
  configs, suchtext, filterFach, filterTyp,
  filterGefaess, sortierung, filterStatus,
})
```

**Test-Klassifikation:** **JA** (pure Datenfilterung, Master-Spec §4.2).

### 4.4 `useLPFavoriten`

**Pfad:** `ExamLab/src/hooks/useLPFavoriten.ts`

**Signatur:**

```typescript
import type { PruefungsConfig } from '../types/pruefung'
import type { Favorit } from '../store/favoritenStore'

export interface UseLPFavoritenResult {
  favoritenConfigIds: Set<string>
  favoritenConfigs: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
}

export function useLPFavoriten(
  configs: PruefungsConfig[],
  favoriten: Favorit[]
): UseLPFavoritenResult
```

**Verantwortung:** kapselt 4 useMemo's aus LPStartseite.tsx Z. 219-229 byte-identisch.

**Test-Klassifikation:** **JA** (pure Set-/Filter-Komputation).

### 4.5 `useLPDashboardData`

**Pfad:** `ExamLab/src/hooks/useLPDashboardData.ts`

**Signatur:**

```typescript
import type { PruefungsConfig } from '../types/pruefung'
import type { TrackerDaten, TrackerPruefungSummary } from '../types/tracker'

export interface UseLPDashboardDataResult {
  configs: PruefungsConfig[]
  setConfigs: React.Dispatch<React.SetStateAction<PruefungsConfig[]>>
  configsLadeStatus: 'laden' | 'fertig'
  setConfigsLadeStatus: React.Dispatch<React.SetStateAction<'laden' | 'fertig'>>
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  findeTrackerSummary: (pruefungId: string) => TrackerPruefungSummary | undefined
  /** Erzwingt Reload der Configs (für `handleZurueck`). */
  reload: () => Promise<void>
}

export function useLPDashboardData(opts: {
  user: { email: string } | null
  istDemoModus: boolean
}): UseLPDashboardDataResult
```

**Verantwortung:**
- Kapselt die 5 Daten-useState (Z. 129-136: `configs`, `configsLadeStatus`, `trackerLadeStatus`, `backendFehler`, `trackerDaten`)
- Kapselt den 95-Zeilen-Lade-useEffect (Z. 300-394) byte-identisch
- Exportiert `findeTrackerSummary`-Helper (Z. 482-485)
- Exportiert `reload()` für `handleZurueck` (Z. 459-476): Reload-Pfad ohne Sync (analog Z. 463-475)

**`reload()`-Implementation:**

```typescript
const reload = useCallback(async () => {
  setConfigsLadeStatus('laden')
  if (user && apiService.istKonfiguriert() && !istDemoModus) {
    const result = await apiService.ladeAlleConfigs(user.email)
    if (result) {
      setConfigs(result)
      schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl',
        result.filter(c => c.typ !== 'formativ').length)
      schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl',
        result.filter(c => c.typ === 'formativ').length)
    }
    setConfigsLadeStatus('fertig')
  } else {
    setConfigs(demoConfigs())
    setConfigsLadeStatus('fertig')
  }
}, [user, istDemoModus])
```

`demoConfigs()` lebt heute am Ende der LPStartseite.tsx (Z. 1041-1043) — wandert in den Hook (private Funktion) ODER nach `lpEinrichtungSync.ts`. **Entscheidung:** als private Funktion innerhalb `useLPDashboardData.ts` (Sichtbarkeit nur dort benötigt).

**Sync-Helpers in der Lade-useEffect:**
- `syncFragenSeriell` + `syncEinrichtungsPruefung` + `syncEinrichtungsUebung` werden aus `lpEinrichtungSync.ts` importiert (Sektion 4.6)
- `setTimeout(... 10_000)` mit verschachtelten async-Calls bleibt byte-identisch im useEffect-Body
- `toast.warning(...)` bei Sync-Fehler bleibt byte-identisch — Hook nimmt `toast` als Parameter? **Entscheidung:** `toast` wird vom Hook selbst über `useToast()` geholt (kein Pass-through, hält Caller-Signatur klein, gleiche Argumente wie T.e `useDashboardLoad`)

**Test-Klassifikation:** **NEIN** (4× Store-Async-Orchestration + apiService + sessionStorage + setTimeout, Master-Spec §4.2 — analog T.e `useDashboardLoad`).

### 4.6 `lpEinrichtungSync` (Utility-Modul)

**Pfad:** `ExamLab/src/utils/lpEinrichtungSync.ts`

**Exporte:**

```typescript
export const SYNC_KEY = 'einrichtung-sync-v5'
export const UEBUNG_SYNC_KEY = 'einrichtung-uebung-sync-v5'

export function getSyncVersion(): string
export function getUebungSyncVersion(): string

/** Speichert Fragen seriell mit 200ms Pause — verhindert Backend-Stau. */
export async function syncFragenSeriell(
  email: string,
  fragen: Frage[]
): Promise<void>

/** Synchronisiert Einrichtungsprüfung. localStorage-Guard idempotent. */
export async function syncEinrichtungsPruefung(
  email: string,
  onError: (msg: string) => void
): Promise<void>

/** Synchronisiert Einführungsübung. localStorage-Guard idempotent. */
export async function syncEinrichtungsUebung(
  email: string,
  onError: (msg: string) => void
): Promise<void>
```

**Verantwortung:**
- Konstanten-Versionierung (`SYNC_KEY`/`SYNC_VERSION`/`UEBUNG_SYNC_KEY`/`UEBUNG_SYNC_VERSION`) — heute inline in LPStartseite Z. 243-244 + Z. 278-279
- Serielle Frage-Speicherung mit 200ms Pause (heute Z. 249-255)
- Sync-Funktionen mit localStorage-Guard (heute Z. 257-275 + Z. 281-297)
- `_backendConfigs`-Parameter wird **nicht** mehr akzeptiert (war ungenutzt, war Tote-Code)
- `toast`-Aufruf wird auf `onError(msg)`-Callback umgestellt — Utility ist React-frei (besser testbar)

**Test-Plan (siehe Sektion 5.4):**
- localStorage-Guard idempotent
- Serielle Speicherung mit 200ms Pause
- Sync-Reihenfolge (Config zuerst, dann Fragen)
- onError-Callback bei Backend-Fehler
- Version-Match: kein Sync wenn `SYNC_VERSION === stored`

**Test-Klassifikation:** **JA** (pure Logik mit Mocks für `apiService`/`localStorage`).

### 4.7 Komponenten-Splits in `lp/startseite/`

#### 4.7.1 `PruefungsKarte.tsx` (mit `TrackerBadge` co-located)

**Pfad:** `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx`

**Inhalt:** byte-identische Verlagerung von Z. 916-1010 (PruefungsKarte) + Z. 1013-1038 (TrackerBadge). TrackerBadge wird in derselben Datei co-located (analog T.e `themaDetailHelpers.tsx`-Pattern), weil **nur** PruefungsKarte sie konsumiert.

**Props bleiben byte-identisch.** Imports werden aus PruefungsKarte-Konsum-Set abgeleitet:
- `useState` (für `linkKopiert`)
- `useFavoritenStore` (×2)
- `formatDatum`, `getFachFarbe`
- `bestimmePruefungsStatus`, `statusLabel`, `statusFarbe`, `korrekturLabel`
- `PruefungsConfig`, `TrackerPruefungSummary`

**Caller-Anpassung in LPStartseite.tsx:** `import { PruefungsKarte } from './startseite/PruefungsKarte'` — die 4 JSX-Aufrufe in Pruefen-Mode + Übungen-Tab bleiben identisch (gleiche Props-Shape).

#### 4.7.2 `FilterLeiste.tsx` (DRY-Komponente)

**Pfad:** `ExamLab/src/components/lp/startseite/FilterLeiste.tsx`

**Heute:** zwei nahezu-identische Toolbar-JSX-Blöcke (Z. 537-606 für Übungen, Z. 688-755 für Prüfungen). Beide haben:
- Fach-Chips (mit `getFachFarbe`-Highlight)
- Gefäss-Chips (Übungen: nur falls `verfuegbareGefaesse.length > 0`; Prüfungen: immer)
- Status-Chips (`aktiv`/`archiviert`/`alle`)
- Sortierungs-Select
- Reset-Button (wenn `hatAktiveFilter`)
- Aktion-Button rechts (`+ Neue Übung` vs. `+ Neue Prüfung`)

**Unterschiede:** Übungen wickelt Gefäss-Sektion in `verfuegbareGefaesse.length > 0 && <>...</>` (Conditional-Render). Prüfungen rendert immer. **Lösung:** Komponente rendert Gefäss-Sektion nur wenn Array nicht-leer — eliminiert Conditional, byte-identische Ausgabe (leerer Array → keine Gefäss-Chips).

**Signatur:**

```typescript
export interface FilterLeisteProps {
  verfuegbareFachbereiche: string[]
  filterFach: string[]
  toggleFachFilter: (fach: string) => void
  verfuegbareGefaesse: string[]
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  hatAktiveFilter: boolean
  resetFilter: () => void
  aktionSlot: ReactNode  // z.B. <Button onClick={handleNeueUebung}>+ Neue Übung</Button>
}
```

**`resetFilter` als Callback** statt 5× setter-Calls inline:
- Heute Z. 596 + Z. 745: `() => { setSuchtext(''); setFilterFach([]); setFilterTyp(null); setFilterGefaess(null); setFilterStatus('aktiv') }`
- Caller passt diese Closure als `resetFilter`-Prop — keine Verhaltensänderung

**Caller-Anpassung in LPStartseite.tsx:** 2 `<FilterLeiste ... />` Aufrufe ersetzen die 2 inline-Toolbars. JSX-Struktur identisch.

#### 4.7.3 `MultiDashboardDialog.tsx`

**Pfad:** `ExamLab/src/components/lp/startseite/MultiDashboardDialog.tsx`

**Inhalt:** byte-identische Verlagerung von Z. 778-818 (Multi-Dashboard-Auswahl-Dialog).

**Signatur:**

```typescript
export interface MultiDashboardDialogProps {
  summativeConfigs: PruefungsConfig[]
  auswahl: Set<string>
  setAuswahl: (s: Set<string>) => void
  onSchliessen: () => void
}
```

**Verhalten:** öffnet sich extern (caller-controlled), Komponente managt nur internes Render + Submit (`window.open(...)`).

#### 4.7.4 `LPPruefungenAnsicht.tsx`

**Pfad:** `ExamLab/src/components/lp/startseite/LPPruefungenAnsicht.tsx`

**Inhalt:** Prüfen-Modus-Body (Z. 643-862, 220 Zeilen → ~165 nach FilterLeiste/PruefungsKarte/MultiDashboardDialog-Konsum).

**Signatur:**

```typescript
export interface LPPruefungenAnsichtProps {
  // Daten
  configs: PruefungsConfig[]
  configsLadeStatus: 'laden' | 'fertig'
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  istDemoModus: boolean
  listenTab: 'pruefungen' | 'tracker'

  // Hook-Result-Felder
  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  summativeConfigs: PruefungsConfig[]
  gefilterteConfigs: PruefungsConfig[]
  letzteFuenf: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  // Filter-State + Setter
  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  // Multi-Dashboard
  multiDashboardOffen: boolean
  setMultiDashboardOffen: (o: boolean) => void
  multiDashboardAuswahl: Set<string>
  setMultiDashboardAuswahl: (s: Set<string>) => void

  // Aktionen
  handleNeue: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}
```

**Props-Anzahl:** ~26 — vergleichbar mit T.e `ThemaDetailView` (15 Props). Etwas grösser, aber Props sind Hook-Result-Felder oder Setter — keine Logik dupliziert.

**Komponenten-interne Logik:** keine. Reine Render-Komponente.

#### 4.7.5 `LPUebungenAnsicht.tsx`

**Pfad:** `ExamLab/src/components/lp/startseite/LPUebungenAnsicht.tsx`

**Inhalt:** Übungen-Tab-Body (Z. 519-634, 116 Zeilen → ~95 nach FilterLeiste/PruefungsKarte-Konsum).

**Signatur:** ähnlich `LPPruefungenAnsicht` aber kleiner (~18 Props), keine Multi-Dashboard.

```typescript
export interface LPUebungenAnsichtProps {
  configsLadeStatus: 'laden' | 'fertig'
  formativeConfigs: PruefungsConfig[]
  gefilterteUebungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
  hatAktiveFilter: boolean

  verfuegbareFachbereiche: string[]
  verfuegbareGefaesse: string[]
  filterFach: string[]
  toggleFachFilter: (f: string) => void
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  resetFilter: () => void

  handleNeueUebung: () => void
  handleBearbeiten: (c: PruefungsConfig) => void
  handleDuplizieren: (c: PruefungsConfig) => void
  findeTrackerSummary: (id: string) => TrackerPruefungSummary | undefined
}
```

### 4.8 Was bleibt im Body von LPStartseite.tsx (~430 Z.)

- **Dispatcher** (`LPStartseite`, Z. 57-70, ~14 Z.) — byte-identisch
- **Inner-Component** (`LPStartseiteInner`):
  - 6 Filter-useState (`suchtext`, `filterFach`, `filterTyp`, `filterGefaess`, `sortierung`, `filterStatus`)
  - 2 UI-useState (`editConfig`, `multiDashboardOffen`, `multiDashboardAuswahl`)
  - `aktiverKurs`-Memo (Z. 104) — unverändert
  - 4 useEffect:
    - URL-Kurs-Redirect (Z. 110-116)
    - localStorage-Kurs-Persist (Z. 119-123)
    - DeepLink-Config-openComposer (Z. 401-408)
    - beforeunload-Listener (Z. 413-422)
  - `useLPRouteSync()`-Aufruf (Z. 397)
  - 2 Hook-Calls: `useLPConfigFiltering(...)`, `useLPFavoriten(...)`, `useLPDashboardData(...)`
  - Action-Helpers (`toggleFachFilter`, `resetFilter`, `handleNeue`, `handleNeueUebung`, `handleBearbeiten`, `handleDuplizieren`, `handleZurueck`)
  - Top-level Render: Layout (h-screen + flex-col + flex-row + sidebar + overlays) + 5 Modus-Branches mit Komponenten-Aufrufen (`<LPPruefungenAnsicht ...>`, `<LPUebungenAnsicht ...>`, `<FragenBrowser ...>`, `<PapierkorbView />`, `<PruefungsComposer ...>`)

## 5. Test-Pläne

### 5.1 `useLPConfigFiltering` (~14 Tests)

| Memo | Tests |
|---|---|
| `verfuegbareFachbereiche` | leere configs → `[]`, alphabetisch sortiert, mehrere fachbereiche pro config — **2 Tests** |
| `verfuegbareGefaesse` | leere configs → `[]`, configs ohne `gefaess` → leer, alphabetisch sortiert — **2 Tests** |
| `summativeConfigs` / `formativeConfigs` | trennt nach `typ === 'formativ'` — **1 Test** |
| `gefilterteConfigs` | suchtext-Match (titel/klasse/id), filterFach-OR, filterTyp-Single, filterGefaess-Single, filterStatus (aktiv/archiviert/alle), sortierung (datum/titel/klasse) — **5 Tests** |
| `gefilterteUebungen` | analog `gefilterteConfigs` aber auf formative — **1 Test** |
| `letzteFuenf` | aktive Filter → `[]`, ≤5 summative → `[]`, >5 → top-5 nach Datum — **2 Tests** |
| `hatAktiveFilter` | alle Standard → `false`, jeder Filter einzeln aktiv → `true` — **1 Test** |

**Mocks:** keine — `useLPConfigFiltering` ist pure (keine Stores, keine async).

**Drift:** vitest 1324 (T.e-Baseline) → 1324 + ~14 = **~1338 passes**.

### 5.2 `useLPFavoriten` (~6 Tests)

- `favoritenConfigIds`: filtert nur `typ='pruefung'|'uebung'` — **1 Test**
- `favoritenConfigs`: leere favoritenIds → `[]`, sortiert nach Datum desc, filtert auf existierende configs — **2 Tests**
- `favoritenPruefungen` / `favoritenUebungen`: trennt nach `typ === 'formativ'` — **1 Test**
- Edge: gemischte typen + gelöschte configs (favorit zeigt auf nicht-existente ID) — **2 Tests**

**Drift:** +6 → **~1344 passes**.

### 5.3 `lpEinrichtungSync` (~5 Tests)

- `syncFragenSeriell`: ruft `speichereFrage` für jede Frage seriell + 200ms Pause — **1 Test**
- `syncEinrichtungsPruefung`: localStorage-Guard idempotent (kein Sync wenn Version match) — **1 Test**
- `syncEinrichtungsPruefung`: bei Backend-Fehler → `onError`-Callback wird mit Fehlermeldung aufgerufen — **1 Test**
- `syncEinrichtungsUebung`: analog Sync-Reihenfolge (Config → Fragen) — **1 Test**
- Version-Computation: `getSyncVersion()` deterministisch aus `einrichtungsPruefung.id`/`gesamtpunkte`/`typ`/`einrichtungsFragen.length` — **1 Test**

**Mocks:** `vi.mock('../services/fragensammlungApi')` für `speichereConfig`/`speichereFrage`. `vi.useFakeTimers()` für 200ms-Pause.

**Drift:** +5 → **~1349 passes**.

### 5.4 Total-Drift

vitest 1324 (T.e-Baseline) → **~1349 passes** nach T.f (Drift +25).

## 6. Risiken

| Risiko | Mitigation |
|---|---|
| **Filter-State-Drift bei FilterLeiste-Dedup** (Übungen + Prüfungen teilen jetzt Komponente) | Props-Shape-Identität: beide Modi geben ihre eigene `aktionSlot` (Neue-Übung vs. Neue-Prüfung) — keine geteilte State, keine Coupling-Risiko |
| **Memo-Deps in `useLPConfigFiltering`** | Implementer-Subagent muss alle 6 Memos byte-identisch übernehmen, **inkl. eslint-disable-Kommentare** bei `gefilterteConfigs`/`gefilterteUebungen` |
| **5-useEffect-Sequenz in `useLPDashboardData`** | Hook hat nur **1** useEffect (den grossen Lade-useEffect). Die 4 kleinen useEffect's bleiben im Body — **keine Konsolidierung** (Lehre Bundle T.b/T.e) |
| **`reload()`-Pfad vs. Lade-useEffect** | `handleZurueck` ruft `reload()` aus Hook — Hook intern reuse Lade-useEffect-Logik nicht (separates Code-Pfad, byte-identisch zu Z. 463-475 ohne Sync) |
| **`useToast`-Hook im `useLPDashboardData`** | Hook ruft `useToast()` selbst — keine Pass-through-Argumente (analog T.e `useDashboardLoad`) |
| **`demoConfigs()` Helper** | Wandert als private Funktion in `useLPDashboardData.ts` — single Konsumer |
| **Sync-Helpers haben `_backendConfigs`-Parameter (heute ungenutzt)** | In Utility-Refactor entfernt — Tote-Code-Cleanup als Bonus, aber Verhalten byte-identisch (Param wurde nie genutzt) |
| **`PruefungsKarte` re-rendert bei jedem Parent-Render** (handlers inline) | Pre-existing, byte-identisch erhalten — KEINE `useCallback`-Optimierung als Refactor-Bonus |
| **Wrapper-Pattern `LPStartseite` + `LPStartseiteInner`** | Bleibt byte-identisch — Master-Spec §5.3 hat dies explizit dokumentiert (verhindert React-#310) |
| **Service-Worker-Cache** vor Browser-E2E | SW-unregister + `caches.delete` + reload als Routine (Lehre `feedback_service_worker_cache_wire_bundle.md`) |
| **Subagent-Branch-Drift** | Branch-Setup explizit im Subagent-Prompt + remote-Push vor Folge-Subagents |
| **Lade-useEffect 95 Zeilen + viele Closures** (Sync-Helpers, `setTimeout`, nested async) | Implementer-Subagent muss strikt byte-identisch übernehmen — kein "Aufräumen" der `setTimeout` (würde Verhaltens-Surface vergrössern) |

## 7. Definition of Done

- [ ] `npx vitest run` grün — Drift +~25 vs. T.e-Baseline 1324 (= ~1349)
- [ ] `npx tsc -b` clean (Output direkt prüfen, Lehre `feedback_tsc_b_exit_misleading.md`)
- [ ] `npm run lint:as-any` clean (Total 0/Defensive 0/Undokumentiert 0)
- [ ] `npm run lint:no-alert` clean
- [ ] `npm run lint:no-tests-dir` clean
- [ ] `npm run lint:musterloesung` Baseline unverändert
- [ ] `npm run build` clean (vite + PWA generateSW)
- [ ] Browser-E2E auf staging mit **echtem LP-Login** (Lehre `feedback_echte_logins.md`):
  - Pfad 1: LP-Dashboard lädt (Header + Tabs + Skeleton → Configs sichtbar)
  - Pfad 2: Tab-Switch Üben/Prüfen/Fragensammlung/Papierkorb funktioniert
  - Pfad 3: Filter-Toolbar in beiden Modi (Übungen + Prüfungen) — Fach/Gefäss/Status/Sortierung-Filter
  - Pfad 4: Such-Eingabe filtert Liste in Echtzeit
  - Pfad 5: Reset-Button setzt alle Filter zurück
  - Pfad 6: Favoriten-Section erscheint nur bei aktiven Favoriten + ohne Filter
  - Pfad 7: „Zuletzt"-Section bei >5 Prüfungen ohne Filter sichtbar
  - Pfad 8: PruefungsKarte-Klick „Bearbeiten" → Composer öffnet
  - Pfad 9: PruefungsKarte „Duplizieren" → neue Karte mit „(Kopie)"
  - Pfad 10: PruefungsKarte „🔗 Link kopieren" → Clipboard
  - Pfad 11: PruefungsKarte „⭐ Favorit" → Toggle + Sektion-Update
  - Pfad 12: Multi-Dashboard-Dialog öffnet, ≥2 wählen, neuer Tab geht auf
  - Pfad 13: TrackerBadge sichtbar (Status/Teilnahme/Korrektur/Durchschnitt)
  - Pfad 14: Einrichtungsprüfung-Sync nach Login (sessionStorage-Guard, localStorage-Guard)
  - Pfad 15: 0 Console-Errors über alle Pfade
- [ ] Code-Reviewer-Subagent **APPROVED FOR MERGE** (byte-identical Behavior bestätigt)
- [ ] Memory-Update mit T.f-Lehren
- [ ] HANDOFF.md-Eintrag

## 8. Hotspot-Bilanz nach T.f

Files >500 Z.:
- Vor T.f: **8 Files** (T.e-Baseline)
- Nach T.f: **7 Files** (LPStartseite.tsx 1043 → ~430, Hotspot-Set verlassen)

**Master-Spec-Ziel <500 Z. erreicht.** Bundle T komplett (6/6 Sub-Bundles auf main).

## 9. Bundle T komplett — nächste Schritte

Nach T.f abgeschlossen:
- Bundle T-Bilanz in Memory (Hotspot-Reduktion 17 → 7, alle 6 Sub-Bundles dokumentiert)
- Phase-3-Wahl: P-Migration (Backend-Vertrag musterlosung) vs. Bundle U (PDFSeite/useDrawingEngine/uebungsStore Hoch-Risiko)

Empfehlung: User-Briefing nach T.f-Merge mit Bundle-T-Bilanz und Phase-3-Optionen.
