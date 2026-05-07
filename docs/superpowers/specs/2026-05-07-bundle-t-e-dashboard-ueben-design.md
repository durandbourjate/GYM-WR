# Bundle T.e — Dashboard-Üben Hook-Extraktion (Design Spec)

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Bezug:** [`docs/superpowers/specs/2026-05-06-bundle-t-hooks-splits-design.md`](2026-05-06-bundle-t-hooks-splits-design.md) §5.2 (Master-Spec)
**Sub-Bundle:** 5/6 in Bundle T (nach T.a/T.b/T.c/T.d, vor T.f)

## 1. Kontext

Fünftes Sub-Bundle aus Bundle T. Master-Spec auf main `1be0f6a`. Dashboard.tsx (Üben-Bereich) ist mit **930 Zeilen, 14 useState, 8 useMemo, 5 useEffect, 1 useRef und 9 Stores** das zweitgrösste verbleibende Hotspot-File und als hoch-Risiko klassifiziert (Master-Spec §3 Inventar).

Hotspot-Bilanz Files >500 Z. nach T.d: **9 Files**. Nach T.e Ziel: **8 Files**.

Die fünf vorherigen Sub-Bundles (T.a, T.b, T.c, T.d) haben den Pattern-Stamm etabliert:
- Hook-Naming via Domain-Prefix (T.a: `useDurchfuehrenLoad`/`useDurchfuehrenMonitoring`/`useDurchfuehrenPhasenTab`)
- Hook-Result-Destrukturierung in stabile Namen (T.d Reviewer-Iteration-1-Lehre)
- Pure-Hooks bekommen Vitest, Async-Store-Orchestration nicht (Master-Spec §4.2)
- 2 separate useEffect's bleiben separat — keine Konsolidierung in Promise.all (byte-identisch)
- Komponenten-Splits in eigenem Sub-Folder (`tkonto/`, `zeichnen/`, `fragenbrowser/`)

T.e folgt allen vier Patterns.

## 2. Ziel

Dashboard.tsx von **930 → ~430 Zeilen (-54%)** reduzieren, ohne Verhaltensänderung. Hotspot-Set verlassen.

## 3. Scope (Strategie B — Pragmatisch)

### In Scope

| Cut | Ziel | Z. neu | Test |
|---|---|---:|---|
| Hook 1: `useDashboardLoad({ aktiveGruppe })` | Daten-Loading (4 Store-Calls) + `alleFragen`/`laden`-State | ~70 | NEIN |
| Hook 2: `useThemenKomputationen({ ...19 Inputs })` | alle 8 useMemo's byte-identisch | ~150 | JA |
| Hook 2 Test-File: `useThemenKomputationen.test.ts` | 15-20 Vitest-Tests (renderHook + Mocks) | ~250 | — |
| Komponenten-Split 1: `dashboard/ThemaDetailView.tsx` | Inline-Funktion (Z. 728-851) → File | ~140 | NEIN (UI) |
| Komponenten-Split 2: `dashboard/themaDetailHelpers.tsx` | FilterSection + Chip + FortschrittsBalken + MasteryBadges | ~80 | NEIN (UI) |

### Out of Scope

- **Bundle T.f** (LPStartseite, 1043 Z., separates Sub-Bundle)
- **`useFragenFilter`-Hook** — Filter-State (suchtext + 3 Filter-Sets) + 4 Toggle-Helpers (`toggleChip`, `toggleAll`, `toggleFachEinklappen`, `handleSortierungAendern`) bleiben im Body
- **`<FachSektion>`-Komponenten-Split** — die 3 Render-Branches im Body (aktuelle/freigegebene/weitere) bleiben separat (Begründung: subtile Unterschiede in Header/Toggle/Opacity, Konvergenz-Risiko unverhältnismässig)
- **DeepLink-useEffect-Konsolidierung** — die 2 useEffect's (`deepLinkZiel` + `deepLinkThema`) bleiben separat im Body
- **`themenMap`-Mutation** des Frage-Objekts (`(f as { unterthema?: string }).unterthema = themaRaw`, Dashboard.tsx Z. 192) — pre-existing, byte-identisch erhalten (Spawn-Task-Kandidat falls Cleanup gewünscht)
- **`as`-Casts** in ThemaDetailView — pre-existing, byte-identisch (`feedback_hook_result_destructuring.md` gilt nur für neuen Code)
- **`useAuthStore.getState().istDemoModus`-Refactor** zu reactive subscribe — pre-existing
- **Apps-Script / Wire-Vertrag** — T.e ist Frontend-only

## 4. Architektur

### 4.1 File-Map

| Datei | Status | Zeilen |
|---|---|---:|
| `ExamLab/src/components/ueben/Dashboard.tsx` | modifiziert | 930 → ~430 |
| `ExamLab/src/hooks/ueben/useDashboardLoad.ts` | NEU | ~70 |
| `ExamLab/src/hooks/ueben/useThemenKomputationen.ts` | NEU | ~150 |
| `ExamLab/src/hooks/ueben/useThemenKomputationen.test.ts` | NEU | ~250 |
| `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx` | NEU | ~140 |
| `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx` | NEU | ~80 |

### 4.2 Hook-Naming-Wahl

Master-Spec-Vorschlag war `useLernpfadData` + `useThemenKomputationen` (Entity-Prefix). Diese Spec verwendet **`useDashboardLoad`** (konsistent mit T.a-Pattern `useDurchfuehrenLoad`) + `useThemenKomputationen` (deskriptiv beibehalten). Üben-Bereich wird durch Pfad `hooks/ueben/` markiert; kein zusätzliches `Ueben`-Prefix nötig.

### 4.3 `useDashboardLoad`

**Pfad:** `ExamLab/src/hooks/ueben/useDashboardLoad.ts`

**Signatur:**

```typescript
interface DashboardLoadResult {
  alleFragen: Frage[]
  laden: boolean
}

function useDashboardLoad(aktiveGruppe: Gruppe | null): DashboardLoadResult
```

**Verantwortung:** kapselt 2 useState (`alleFragen`, `laden`) + 2 unabhängige useEffect's (Dashboard.tsx Z. 131-146).

**Heutige Quelle (Dashboard.tsx Z. 69-70 + 131-146):**

```typescript
const [alleFragen, setAlleFragen] = useState<Frage[]>([])
const [laden, setLaden] = useState(true)

// Effekt A
useEffect(() => {
  ladeFortschritt()
  if (aktiveGruppe) ladeAuftraege(aktiveGruppe.id)
}, [ladeFortschritt, ladeAuftraege, aktiveGruppe])

// Effekt B
useEffect(() => {
  if (!aktiveGruppe) return
  const ladeThemen = async () => {
    setLaden(true)
    const fragen = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
    setAlleFragen(fragen)
    setLaden(false)
  }
  ladeThemen()
  ladeFreischaltungen(aktiveGruppe.id)
}, [aktiveGruppe, ladeFreischaltungen])
```

**Hook-interne Implementation:** Hook holt `ladeFortschritt`/`ladeAuftraege`/`ladeFreischaltungen` selbst über die Store-Selektoren — keine Pass-through-Inputs (hält Caller-Signatur klein). Die 3 Store-Action-Funktionen sind über Zustand-Stores stabil über Renders (Zustand-Convention: Action-Identitäten ändern sich nicht ohne Store-Reset), daher kein Memo-Deps-Drift-Risiko bei direkter Nutzung in `useEffect`-Deps.

**Byte-identisch:** 2 separate useEffect's mit exakt heutigen Deps.

**Test-Klassifikation:** **NEIN** (4× Store-Async-Orchestration + adapter-call, Master-Spec §4.2).

### 4.4 `useThemenKomputationen`

**Pfad:** `ExamLab/src/hooks/ueben/useThemenKomputationen.ts`

**Signatur:**

```typescript
export interface ThemenInfo {
  fach: string
  thema: string
  unterthemen: string[]
  fragen: Frage[]
  fortschritt: ThemenFortschritt
}

interface ThemenKomputationenInputs {
  // Stamm-Daten
  alleFragen: Frage[]
  fortschritte: Record<string, FrageFortschritt>
  auftraege: Auftrag[]
  user: UebenUser | null
  freischaltungen: ThemaFreischaltung[]
  einstellungen: UebenSettings | null
  lernziele: Lernziel[]
  sichtbareFaecher: string[]

  // UI-State
  aktiverFach: string | null
  aktivesThema: string | null
  alleThemenAnzeigen: boolean
  suchtext: string
  unterthemaFilter: Set<string>
  schwierigkeitFilter: Set<number>
  typFilter: Set<string>
  sortierung: 'alphabetisch' | 'zuletztGeuebt'

  // Store-Selektoren (Funktions-Refs)
  getThemenFortschritt: (fragen: Frage[]) => ThemenFortschritt
  getStatus: (fach: string, thema: string) => ThemaStatus
  getAktiveUnterthemen: (fach: string, thema: string) => string[] | null
}

interface ThemenKomputationenResult {
  themenMap: Record<string, ThemenInfo[]>
  verfuegbareFaecher: string[]
  sichtbareThemenListe: ThemenInfo[]
  letzteUebungProThema: Map<string, string>
  themenSektionen: {
    aktuelle: ThemenInfo[]
    faecherSortiert: [string, ThemenInfo[]][]
    weitere: ThemenInfo[]
  }
  themaDetail: ThemenInfo | null
  gefilterteFragen: Frage[]
  empfehlungen: Empfehlung[]
}

function useThemenKomputationen(inputs: ThemenKomputationenInputs): ThemenKomputationenResult
```

**Verantwortung:** kapselt alle 8 useMemo's aus Dashboard.tsx Z. 166-353 byte-identisch. Hook-Body besteht aus 8 useMemo-Aufrufen mit exakt heutigen Deps.

**Type-Co-Location:** `ThemenInfo` wird hier als named export deklariert (Hook ist Quelle der Wahrheit; Dashboard.tsx und ThemaDetailView importieren von hier).

**Identity-Stabilität — kritisch:**
- `themenMap` Memo greift auf `useAuthStore.getState().istDemoModus` (non-reactive). Bleibt byte-identisch — kein subscribe.
- `(f as { unterthema?: string }).unterthema = themaRaw` (Z. 192) **mutiert** das Frage-Objekt. Pre-existing, byte-identisch erhalten.
- `letzteUebungProThema` wird intern in `themenSektionen`-Memo konsumiert + im Result exponiert (Test-Coverage).

**Caller-Pattern in Dashboard.tsx** (Lehre `feedback_hook_result_destructuring.md` aus T.d):

```typescript
const {
  themenMap,
  verfuegbareFaecher,
  sichtbareThemenListe,
  letzteUebungProThema,
  themenSektionen,
  themaDetail,
  gefilterteFragen,
  empfehlungen,
} = useThemenKomputationen({ /* 19 Inputs: 8 Stamm-Daten + 8 UI-State + 3 Funktions-Refs */ })
```

`letzteUebungProThema` wird im Caller voraussichtlich nicht direkt konsumiert (es fliesst intern in `themenSektionen`-Sortierung), wird aber im Result-Interface exponiert und destrukturiert — damit Test-Coverage diesen Memo isoliert prüfen kann und kein Linter eine `unused`-Warnung wirft.

**Test-Klassifikation:** **JA** (pure Komputation, Master-Spec §4.2).

### 4.5 `ThemaDetailView` + `themaDetailHelpers`

**Pfade:**
- `ExamLab/src/components/ueben/dashboard/ThemaDetailView.tsx`
- `ExamLab/src/components/ueben/dashboard/themaDetailHelpers.tsx`

**ThemaDetailView.tsx:** Inline-Funktion aus Dashboard.tsx Z. 728-851 in eigenes File. **Props-Interface byte-identisch** (15 Props). Konstanten `SCHWIERIGKEIT_LABELS`, `SCHWIERIGKEIT_STERNE`, `TYP_LABELS` (Dashboard.tsx Z. 32-45) wandern mit (nur dort konsumiert).

**themaDetailHelpers.tsx:** 4 Helper-Komponenten aus Dashboard.tsx Z. 855-930 byte-identisch:
- `FilterSection({ titel, emoji, children, onToggleAlle })`
- `Chip({ label, count, aktiv, farbe, onClick })`
- `FortschrittsBalken({ fortschritt })`
- `MasteryBadges({ fortschritt })`

**Caller-Anpassung in Dashboard.tsx:** `import { ThemaDetailView } from './dashboard/ThemaDetailView'` + JSX-Aufruf identisch (15 Props bleiben).

**Test-Klassifikation:** **NEIN** (UI, Browser-E2E reicht — Master-Spec §4.2).

### 4.6 Was bleibt im Body von Dashboard.tsx (~430 Z.)

- 14 useState (Filter-State + UI-State, byte-identisch)
- 1 useRef (`deepLinkVerarbeitet`)
- 3 useEffect:
  - URL-Sync für `dashboardTab` (Dashboard.tsx Z. 105-112)
  - DeepLink-Ziel-Navigation (Z. 149-163)
  - DeepLink-Thema aus LernzieleAkkordeon (Z. 217-225)
- Toggle-Helpers (`toggleChip`, `toggleAll`, `toggleFachEinklappen`, `handleSortierungAendern`)
- Action-Helpers (`handleStarte`, `handleStarteGefiltert`, `handleStarteMix`, `handleStarteRepetition`, `zurueckZuThemen`, `preWarmThema`)
- Top-level Render: Themen-Übersicht (Fach-Chips + 3 Sektionen + Empfehlungen + Mix/Repetition + Suchfeld + MixDialog + LzMiniModal)

## 5. Test-Plan für `useThemenKomputationen`

Schätzung **~21 Tests** (~250-300 Z. Test-File). Gruppiert pro Memo:

| Memo | Tests |
|---|---|
| `themenMap` | Demo-Modus-Pfad (Einrichtungstest sichtbar), Non-Demo (Einrichtungstest gefiltert), Pool-Mapping (poolId → poolTitel), sichtbareFaecher-Filter, mehrere Fächer/Themen — **5 Tests** |
| `verfuegbareFaecher` | sortiert alphabetisch — **1 Test** |
| `sichtbareThemenListe` | freischaltungen-leer-Fallback, status-Filter (aktiv/abgeschlossen), aktiveUnterthemen-Filter, suchtext-Match (4 Felder) — **4 Tests** |
| `letzteUebungProThema` | leerer fortschritte, neuester pro Thema, mehrere Themen — **3 Tests** |
| `themenSektionen` | 3 Sektionen-Branches (aktuelle/faecherSortiert/weitere), sortierung-Switch (alphabetisch vs. zuletztGeuebt) — **2 Tests** |
| `themaDetail` | aktivesThema null → null, gefunden, nicht-gefunden — **2 Tests** |
| `gefilterteFragen` | leere Filter, alle 3 Filter aktiv, schwierigkeit-default (`?? 2`) — **2 Tests** |
| `empfehlungen` | user null → leer, alleFragen leer → leer, normaler Pfad — **2 Tests** |

**Mocks:** `getThemenFortschritt`/`getStatus`/`getAktiveUnterthemen` als `vi.fn()`-Stubs. `useAuthStore.getState().istDemoModus` via `vi.mock('../../store/authStore')`. `berechneEmpfehlungen` als `vi.fn()`-Mock-Module für `empfehlungen`-Tests.

**Drift:** vitest 1302 (T.d-Baseline) → 1302 + ~21 = **~1323 passes**.

## 6. Risiken

| Risiko | Mitigation |
|---|---|
| **Memo-Deps-Drift** in `useThemenKomputationen` (Funktions-Refs `getStatus`/`getThemenFortschritt`/`getAktiveUnterthemen` aus Stores) | Implementer-Subagent muss Deps **byte-identisch** übernehmen; Hook-Output via Destrukturierung in stabile Namen |
| **Trigger-Sequenz** der 2 Daten-Loading-useEffect's | Im Hook bleiben 2 separate useEffect's mit byte-identischen Deps — kein `Promise.all`, keine Konsolidierung |
| **`themenMap`-Mutation** des Frage-Objekts (Z. 192) | Pre-existing, byte-identisch im Hook erhalten — Spawn-Task-Kandidat |
| **Non-reactive `useAuthStore.getState().istDemoModus`** in Memo-Body | Pre-existing, byte-identisch (Hook ruft genauso `getState()` ohne subscribe) |
| **Deep-Link-useEffects** hängen an `alleFragen.length` aus Hook + UI-State im Body | useEffects bleiben im Body; lesen `alleFragen`/`laden` aus `useDashboardLoad`-Result |
| **`deepLinkVerarbeitet`-Idempotenz-Ref** | Bleibt im Body — kein Hook-Cut für rein lokale Idempotenz-Refs |
| **Service-Worker-Cache** vor Browser-E2E | SW-unregister + caches.delete + reload als Routine (Lehre `feedback_service_worker_cache_wire_bundle.md`) |
| **Subagent-Branch-Drift** | Branch-Setup explizit im Subagent-Prompt + remote-Push vor Folge-Subagents |

## 7. Definition of Done

- [ ] `npx vitest run` grün — Drift +~21 vs. T.d-Baseline 1302
- [ ] `npx tsc -b` clean (Output direkt prüfen, Lehre `feedback_tsc_b_exit_misleading.md`)
- [ ] `npm run lint:as-any` clean (Total 0/Defensive 0/Undokumentiert 0)
- [ ] `npm run lint:no-alert` clean
- [ ] `npm run lint:no-tests-dir` clean
- [ ] `npm run lint:musterloesung` Baseline unverändert
- [ ] `npm run build` clean (vite + PWA generateSW)
- [ ] Browser-E2E auf staging mit **echtem SuS-Login** (Lehre `feedback_echte_logins.md`):
  - Pfad 1: SuS-Dashboard lädt (Themen-Übersicht, Fach-Chips, ggf. Empfehlungen)
  - Pfad 2: Fach-Filter-Chip Klick → Themen-Liste filtert
  - Pfad 3: Sortierung-Switch (alphabetisch ↔ zuletztGeuebt) → Reihenfolge ändert
  - Pfad 4: ThemaKarte-Klick → ThemaDetailView lädt mit Fortschritt
  - Pfad 5: Filter-Chips (Unterthema/Schwierigkeit/Typ) → gefilterteFragen-Counter ändert
  - Pfad 6: „Übung starten" → Übung beginnt mit gefilterten Fragen
  - Pfad 7: Mix-Dialog öffnet → 2 Themen wählen → Mix-Übung startet
  - Pfad 8: Lernziel-Mini-Modal öffnet via Lernziele-Klick auf ThemaKarte
  - Pfad 9: Fach-Sektion ein-/ausklappen + localStorage-Persistenz (Reload behält State)
  - Pfad 10: Deep-Link aus LernzieleAkkordeon → Dashboard navigiert direkt zu Thema-Detail
  - Pfad 11: 0 Console-Errors über alle Pfade
- [ ] Code-Reviewer-Subagent **APPROVED FOR MERGE** (byte-identical Behavior bestätigt)
- [ ] Memory-Update mit T.e-Lehren
- [ ] HANDOFF.md-Eintrag

## 8. Hotspot-Bilanz nach T.e

Files >500 Z.:
- Vor T.e: **9 Files** (T.d-Baseline)
- Nach T.e: **8 Files** (Dashboard.tsx 930 → ~430, Hotspot-Set verlassen)

Master-Spec-Ziel <500 Z. erreicht.

## 9. Pause-Punkt nach T.e

Nach T.e bleibt nur **T.f** (LPStartseite, 1043 Z.) für Bundle-T-Komplettierung. Empfehlung: T.f direkt anschliessen oder Pause für Phase-3-Wahl (P-Migration vs. Bundle U).
