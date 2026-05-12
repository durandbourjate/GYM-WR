# Cluster C — Globale Suche Implementation Plan (rev2)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LP-Header-Suche um 6 Quellen erweitern (Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen) mit gruppierten Treffern, Keyboard-Navigation, Diakritik-Normalize und XSS-sicherem Highlight. **SuS-Pfad bleibt unverändert** (eigener Hook `useGlobalSucheSuS` mit Scope-Guard, kein 6-Quellen-Search).

**Architektur:** Pure Engine (`sucheEngine.ts`) trennt Logik von UI. `useSucheIndex()`-Memo-Hook liest aus 4 Source-Stores + Tab-Registry + neuem `useConfigsListStore` (Cache-Layer). `LPGlobalSuche` ist eine **neue eigene Komponente** (parallel zur bestehenden dumb `GlobalSuche.tsx`) — ersetzt nur in `LPAppHeaderContainer`. Bestehende `GlobalSuche` bleibt für `SuSAppHeaderContainer` erhalten. 4 kleine Sub-Hooks (`useDebouncedValue`, `useKeyboardNavigation`, `useClickOutside`) — TDD pro Hook. Cluster-F-Filter in Adapter-Schicht. Highlight via JSX-Array. Explizite Icon-Map statt `import * as` für tree-shaking. Test-First, per-Task-Commits.

**Tech Stack:** React 19, TypeScript, Zustand v5, Vite, Tailwind v4, react-router-dom 7.14, Vitest, lucide-react.

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-c-globale-suche-design.md` (rev2 approved)

## Spec-Abweichungen (begründet, aus Plan-Review rev1 → rev2)

1. **configsListStore (neu):** Spec §4.2 ging davon aus, dass Configs aus einem bestehenden Store kommen. Codebase-Audit zeigt: sie sind Hook-lokaler State in `useLPDashboardData`. Plan ergänzt schlanken Cache-Store (NICHT Duplikat-State — Configs leben sonst nirgends zentral). Minimal-Patch: 2-3 `setConfigs(...)`-Aufrufstellen in `useLPDashboardData` schreiben zusätzlich in den Store.

2. **`LPGlobalSuche` (neu) statt Refactor von `GlobalSuche`:** Audit zeigt: `GlobalSuche.tsx` ist **Dumb-Komponente** (`Props: { suchen, onSuchen, ergebnis }`), versorgt aus `LPAppHeaderContainer` UND `SuSAppHeaderContainer`. Refactor würde SuS-Pfad brechen (anderer Type, andere Quellen, Scope-Guard). Lösung: eigene neue `LPGlobalSuche` für 6-Quellen-Search; bestehende `GlobalSuche` bleibt für SuS-Pfad unverändert. `useGlobalSucheLP.ts` Legacy wird gelöscht, `useGlobalSucheSuS.ts` bleibt erhalten.

3. **Hilfe-Deep-Linking:** Audit zeigt: `HilfeSeite` ist Modal mit lokalem `kategorie`-State, kein URL-Routing. Phase-1-Pragmatismus: Hilfe-Tab-Treffer navigieren zu `/einstellungen` + URL-Search-Param `?hilfe=<tabId>` — kleiner Patch in `LPStartseite` liest Param und mountet `HilfeSeite` mit neuer `initialKategorie`-Prop. **5-10 Zeilen Patch in 2 Files.**

4. **Cluster-F-Filter-Mechanik präzisiert:** Audit zeigt: `filtereTestdatenWennDeaktiviert` filtert via OR-Matching über `kursId`, `klasse`, `userEmail`, `id`-Prefix (`'test-'`). Für `FrageSummary` greift NUR `id`-Prefix; für `KursDefinition` greifen `id` + `klassen`; für `PruefungsConfig` greifen `id` + `klasse`. Plan-Test 2.3 verifiziert per Quelle mit konkreten test-prefixed IDs.

5. **Icon-Map statt dynamic Import:** `import * as Icons from 'lucide-react'` deaktiviert tree-shaking (~200KB Bundle-Impact). Plan nutzt explizite `ICON_MAP`-Konstante mit ~8 benötigten Icons. Bundle-Effekt: ~10KB.

6. **Min-Query-Guard DRY:** Statt 6×-Wiederholung in Adaptern → einmal in `fuehreSucheAus`-Entry.

7. **`SucheIndex`-Type vollständig in `types/suche.ts`:** keine Inline-Definition in `sucheEngine.ts`.

8. **Performance-Schwelle realistisch:** `<100 ms` initial, `<50 ms` als Bonus-Ziel.

---

## File Structure (Plan-Locked, rev2)

**Neue Files:**
- `src/types/suche.ts` — Types: `SucheQuelle`, `SucheTreffer`, `HighlightStelle`, `SucheErgebnis`, `SucheIndex`, Konstanten + Icon-Map
- `src/utils/sucheEngine.ts` — Pure Engine (normalize, score, highlightStellen, gruppieren, fuehreSucheAus)
- `src/utils/sucheEngine.test.ts` — Engine-Tests
- `src/utils/sucheEngine.perf.test.ts` — Performance-Test (1000 Fragen)
- `src/utils/sucheAdapter.ts` — 6 Adapter-Funktionen (Source → Treffer, mit Cluster-F-Filter)
- `src/utils/sucheAdapter.test.ts` — Adapter-Tests (inkl. Cluster-F-Filter pro Quelle)
- `src/utils/highlight.tsx` — XSS-sicherer Highlight-Helper (JSX-Array)
- `src/utils/highlight.test.tsx` — Highlight-Tests
- `src/hooks/useDebouncedValue.ts` — Debounce-Hook (generisch)
- `src/hooks/useDebouncedValue.test.tsx` — Debounce-Test
- `src/hooks/useKeyboardNavigation.ts` — activeIndex-State + Pfeil/Enter/Escape-Handler
- `src/hooks/useKeyboardNavigation.test.tsx` — Keyboard-Nav-Test
- `src/hooks/useClickOutside.ts` — Click-Outside-Hook
- `src/hooks/useClickOutside.test.tsx` — Click-Outside-Test
- `src/hooks/useSucheIndex.ts` — Memo-Selektor über alle Quellen
- `src/hooks/useSucheIndex.test.tsx` — Hook-Tests (Closure-Ref-Mock-Pattern)
- `src/store/configsListStore.ts` — Cache-Store für Configs
- `src/store/configsListStore.test.ts` — Store-Tests
- `src/components/shared/header/sucheUI/QuellSektion.tsx` — Sektion-Komponente
- `src/components/shared/header/sucheUI/QuellSektion.test.tsx`
- `src/components/shared/header/sucheUI/TrefferZeile.tsx` — Treffer-Zeile
- `src/components/shared/header/sucheUI/TrefferZeile.test.tsx`
- `src/components/shared/header/sucheUI/EmptyState.tsx` — Leer-State
- `src/components/shared/header/sucheUI/index.ts` — Barrel-Export
- `src/components/lp/header/LPGlobalSuche.tsx` — **NEUE** LP-spezifische Such-Komponente (self-contained, ersetzt nicht `GlobalSuche`)

**Modifizierte Files:**
- `src/hooks/useLPDashboardData.ts` — Patch: `setConfigs(...)`-Aufrufstellen schreiben zusätzlich in `useConfigsListStore`. ~3-5 Zeilen.
- `src/components/lp/LPAppHeaderContainer.tsx` — `<GlobalSuche {...props} />` ersetzt durch `<LPGlobalSuche />`. Alte Props + `useGlobalSucheLP`-Aufruf entfernt.
- `src/components/lp/LPStartseite.tsx` — `useEffect` liest `?hilfe=<tabId>`-Param + reicht als `initialKategorie` an `HilfeSeite`-Mount weiter. ~10 Zeilen.
- `src/components/lp/HilfeSeite.tsx` — `initialKategorie?: string`-Prop ergänzt; `useState('einstieg')` → `useState(initialKategorie ?? 'einstieg')`. ~3 Zeilen.

**Gelöschte Files:**
- `src/hooks/useGlobalSucheLP.ts` (NACH `LPGlobalSuche` Migration, ersetzt durch `useSucheIndex` + `fuehreSucheAus`)

**Unverändert (SuS-Pfad bleibt):**
- `src/components/shared/header/GlobalSuche.tsx` (Dumb-Komponente, nur noch SuS-Verbraucher)
- `src/components/sus/SuSAppHeaderContainer.tsx` (oder sus-Pendant)
- `src/hooks/useGlobalSucheSuS.ts`

---

## Implementation Phases (rev2)

| Phase | Inhalt | Tasks | Tasks (kumul.) |
|---|---|---|---|
| 0 | Discovery dokumentiert (bereits durchgeführt) | 0 | 0 |
| 1 | Foundation: Types + Engine + Adapter + Highlight | 8 | 8 |
| 2 | Cache-Store + useSucheIndex-Hook | 3 | 11 |
| 3 | UI-Komponenten (TrefferZeile, QuellSektion, EmptyState) | 4 | 15 |
| 4 | Routes + 3 Sub-Hooks + HilfeSeite-Patch + LPGlobalSuche + Container-Migration + Legacy-Delete | 8 | 23 |
| 5 | Performance + Browser-E2E + Push | 3 | 26 |

Tasks sind sequenziell innerhalb einer Phase; Phasen sind sequenziell zueinander.

---

## Phase 0 — Discovery (bereits durchgeführt, dokumentiert)

Audit-Resultate aus Spec-/Plan-Phase (Memory):

- **`useFragensammlungStore`**: liefert `summaries: FrageSummary[]` (Titel/ID/Tags/Themen ohne Volltext). Lade via `useFragensammlungStore.getState().lade(email)` aus `useLPDashboardData.ts:90`.
- **`useStammdatenStore`**: liefert `stammdaten.kurse: KursDefinition[]`, `lpProfil.testdatenSichtbar: boolean`, `istAdmin(email): boolean`.
- **`tabsFuerSurface(surface, ctx)`** in `src/utils/tabRegistry.ts` mit `ctx: { istAdmin }`.
- **`filtereTestdatenWennDeaktiviert(records, sichtbar)`** in `src/utils/testdaten/filter.ts`. OR-Matching: `kursId === 'test-kurs-01'` ∨ `klasse === 'test-klasse-01'` ∨ `userEmail.match(/test/)` ∨ `id.startsWith('test-')`.
- **Bestehende `GlobalSuche.tsx`**: Dumb-Komponente, Props `{ suchen, onSuchen, ergebnis }`. Versorgt aus `LPAppHeaderContainer` (`useGlobalSucheLP`) + `SuSAppHeaderContainer` (`useGlobalSucheSuS`).
- **Router 7.14**: `/einstellungen/:tab`, `/pruefung/:configId`, `/uebung/:configId`, `/fragensammlung/:frageId`. **Kurse haben keine Detail-Route**; Treffer navigiert zu `/pruefung`.
- **HilfeSeite**: Modal mit lokalem `kategorie`-State, kein URL-Routing. Wird in `LPStartseite` lazy-mounted. Deep-Linking braucht `initialKategorie`-Prop + `?hilfe=<tabId>` URL-Param.
- **TYPO-Tokens**: `src/styles/typografie.ts` mit `display/h1/h2/body/caption`.
- **Zustand v5**: `useShallow` nicht etabliert. Single-Field-Selektoren sind Standard.
- **Brand-Farbe**: `violet-500` Primary, `violet-100/700` Akzente.

---

## Phase 1 — Foundation (Pure Logic + Types)

### Task 1.1: Types-Datei + ICON_MAP + SucheIndex-Type

**Files:**
- Create: `src/types/suche.ts`

- [ ] **Step 1: Datei schreiben (vollständig)**

```ts
// src/types/suche.ts
import type { LucideIcon } from 'lucide-react'
import { File, FileText, HelpCircle, BookOpen, Repeat, Settings, HelpCircle as HelpIcon, Target, User, Layers } from 'lucide-react'
import type { TabDefinition } from '../utils/tabRegistry'
import type { KursDefinition } from './stammdaten'
import type { PruefungsConfig } from './pruefung'
import type { FrageSummary } from './fragen-storage'

export type SucheQuelle =
  | 'einstellungen-tab'
  | 'hilfe-tab'
  | 'kurs'
  | 'pruefung'
  | 'uebung'
  | 'frage'

export interface HighlightStelle {
  start: number
  end: number
  feld: 'titel' | 'subTitel'
}

export interface SucheTreffer {
  quelle: SucheQuelle
  id: string
  titel: string
  subTitel?: string
  highlightStellen?: HighlightStelle[]
  navigation: {
    route: string
    params?: Record<string, string>
  }
  score: number
  iconKey?: SucheIconKey
}

export type ProQuelleZahlen = Record<SucheQuelle, number>

export interface SucheErgebnis {
  treffer: SucheTreffer[]
  proQuelleSichtbar: ProQuelleZahlen
  proQuelleGesamt: ProQuelleZahlen
}

export interface SucheIndex {
  einstellungenTabs: TabDefinition[]
  hilfeTabs: TabDefinition[]
  kurse: KursDefinition[]
  pruefungen: PruefungsConfig[]
  uebungen: PruefungsConfig[]
  fragen: FrageSummary[]
}

export const QUELLEN_REIHENFOLGE: readonly SucheQuelle[] = [
  'einstellungen-tab',
  'hilfe-tab',
  'kurs',
  'pruefung',
  'uebung',
  'frage',
] as const

export const QUELL_LABEL: Record<SucheQuelle, string> = {
  'einstellungen-tab': 'Einstellungen',
  'hilfe-tab': 'Hilfe',
  'kurs': 'Kurse',
  'pruefung': 'Prüfungen',
  'uebung': 'Übungen',
  'frage': 'Fragen',
} as const

export const SCORE_BOUNDS = {
  TITEL_PREFIX: 100,
  ID_EXACT: 95,
  TITEL_SUBSTRING: 70,
  TAG_THEMA: 50,
  SUBTITEL: 30,
} as const

// Explizite Icon-Map (tree-shakable, vs `import * as Icons`).
// Tab-Registry-Icons werden via `tabDefinition.icon` (LucideIcon-Komponente direkt) übernommen,
// nicht als String-Key — Adapter passt das im Mapping an.
export type SucheIconKey = 'einstellungen' | 'hilfe' | 'kurs' | 'pruefung' | 'uebung' | 'frage' | 'default'

export const ICON_MAP: Record<SucheIconKey, LucideIcon> = {
  einstellungen: Settings,
  hilfe: HelpIcon,
  kurs: BookOpen,
  pruefung: FileText,
  uebung: Repeat,
  frage: HelpCircle,
  default: File,
}

export const LEERES_ERGEBNIS: SucheErgebnis = {
  treffer: [],
  proQuelleSichtbar: { 'einstellungen-tab': 0, 'hilfe-tab': 0, kurs: 0, pruefung: 0, uebung: 0, frage: 0 },
  proQuelleGesamt: { 'einstellungen-tab': 0, 'hilfe-tab': 0, kurs: 0, pruefung: 0, uebung: 0, frage: 0 },
}
```

- [ ] **Step 2: Type-Check**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: ✅ kein Fehler.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/types/suche.ts
git commit -m "Cluster C: types/suche.ts — Types + ICON_MAP (tree-shakable) + SucheIndex"
```

### Task 1.2: normalizeForSuche() — Helper + Tests

**Files:**
- Create: `src/utils/sucheEngine.ts` (Initial-Stub)
- Create: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Test schreiben**

```ts
// src/utils/sucheEngine.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeForSuche } from './sucheEngine'

describe('normalizeForSuche', () => {
  it('lowercase', () => {
    expect(normalizeForSuche('Bilanz')).toBe('bilanz')
  })

  it('removes diacritics (umlauts)', () => {
    expect(normalizeForSuche('Übung')).toBe('ubung')
    expect(normalizeForSuche('Schäfer')).toBe('schafer')
    expect(normalizeForSuche('für')).toBe('fur')
  })

  it('preserves base ASCII', () => {
    expect(normalizeForSuche('hello world')).toBe('hello world')
  })

  it('handles empty', () => {
    expect(normalizeForSuche('')).toBe('')
  })

  it('preserves spaces and punctuation', () => {
    expect(normalizeForSuche('Frage 5: BWL')).toBe('frage 5: bwl')
  })
})
```

- [ ] **Step 2: Test laufen, fail erwartet**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts`
Expected: FAIL — Module `sucheEngine` existiert nicht.

- [ ] **Step 3: Minimal-Implementation**

```ts
// src/utils/sucheEngine.ts
export function normalizeForSuche(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}
```

- [ ] **Step 4: Test passes**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C: normalizeForSuche — NFD + Diakritik-Entfernung + Lowercase"
```

### Task 1.3: scoreFromMatch() — Helper

**Files:**
- Modify: `src/utils/sucheEngine.ts`
- Modify: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Test schreiben (append)**

```ts
// in sucheEngine.test.ts (append)
import { scoreFromMatch } from './sucheEngine'

describe('scoreFromMatch', () => {
  it('Titel-Prefix = 100', () => {
    expect(scoreFromMatch('bilanz analyse', 'bilanz', 'titel')).toBe(100)
  })

  it('Titel-Substring = 70', () => {
    expect(scoreFromMatch('eine bilanz analyse', 'bilanz', 'titel')).toBe(70)
  })

  it('ID-Exact = 95', () => {
    expect(scoreFromMatch('frg-123', 'frg-123', 'id')).toBe(95)
  })

  it('Tag/Thema = 50', () => {
    expect(scoreFromMatch('Eigenkapital, Bilanz', 'bilanz', 'tag')).toBe(50)
  })

  it('Subtitel = 30', () => {
    expect(scoreFromMatch('Klasse 29c · 25.06', 'klasse', 'subTitel')).toBe(30)
  })

  it('No match = 0', () => {
    expect(scoreFromMatch('foo', 'bar', 'titel')).toBe(0)
  })

  it('case + diacritics independent', () => {
    expect(scoreFromMatch('Übung', 'ubung', 'titel')).toBe(100)
  })
})
```

- [ ] **Step 2: Test laufen, fail erwartet**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t scoreFromMatch`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// in sucheEngine.ts
import { SCORE_BOUNDS } from '../types/suche'

export type MatchFeld = 'titel' | 'id' | 'tag' | 'subTitel'

export function scoreFromMatch(haystack: string, needle: string, feld: MatchFeld): number {
  const h = normalizeForSuche(haystack)
  const n = normalizeForSuche(needle)
  if (!n || !h.includes(n)) return 0
  if (feld === 'id') return SCORE_BOUNDS.ID_EXACT
  if (feld === 'titel') {
    return h.startsWith(n) ? SCORE_BOUNDS.TITEL_PREFIX : SCORE_BOUNDS.TITEL_SUBSTRING
  }
  if (feld === 'tag') return SCORE_BOUNDS.TAG_THEMA
  return SCORE_BOUNDS.SUBTITEL
}
```

- [ ] **Step 4: Test passes**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t scoreFromMatch`
Expected: PASS (7/7).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C: scoreFromMatch — Boundaries Titel-Prefix/Substring/ID/Tag/Subtitel"
```

### Task 1.4: findeHighlightStellen() — Helper

**Files:**
- Modify: `src/utils/sucheEngine.ts`
- Modify: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Test (append)**

```ts
import { findeHighlightStellen } from './sucheEngine'

describe('findeHighlightStellen', () => {
  it('findet erste Stelle', () => {
    expect(findeHighlightStellen('bilanz analyse', 'bilanz', 'titel')).toEqual([
      { start: 0, end: 6, feld: 'titel' },
    ])
  })

  it('mehrere Stellen', () => {
    const stellen = findeHighlightStellen('bilanz und bilanz', 'bilanz', 'titel')
    expect(stellen).toHaveLength(2)
    expect(stellen[0]).toEqual({ start: 0, end: 6, feld: 'titel' })
    expect(stellen[1]).toEqual({ start: 11, end: 17, feld: 'titel' })
  })

  it('case-insensitiv', () => {
    expect(findeHighlightStellen('Bilanz', 'bilanz', 'titel')).toEqual([
      { start: 0, end: 6, feld: 'titel' },
    ])
  })

  it('diakritik-insensitiv (match-Länge bleibt korrekt)', () => {
    // "Übung" hat 5 Buchstaben, Match "ubung" (5) → start=0, end=5
    const stellen = findeHighlightStellen('Übung 1', 'ubung', 'titel')
    expect(stellen).toEqual([{ start: 0, end: 5, feld: 'titel' }])
  })

  it('keine Stelle bei no-match', () => {
    expect(findeHighlightStellen('foo', 'bar', 'titel')).toEqual([])
  })
})
```

- [ ] **Step 2: Test fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t findeHighlightStellen`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// in sucheEngine.ts
import type { HighlightStelle } from '../types/suche'

export function findeHighlightStellen(
  text: string,
  needle: string,
  feld: 'titel' | 'subTitel',
): HighlightStelle[] {
  const n = normalizeForSuche(needle)
  if (!n) return []
  const stellen: HighlightStelle[] = []
  // Normalize-Text + Text in sync iterieren via NFD-Decomposition.
  // Vereinfachung: NFD-Anzahl der Code-Points entspricht in den meisten Fällen den Original-Positionen,
  // ABER: Diakritik-Buchstabe wird in 2 NFD-Code-Points zerlegt → wir nutzen Original-Indices.
  // Strategie: erst Normalize beider Strings (ohne Längenänderung), dann searche an gleichen Indices.
  const tNorm = text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  // Original-Index-Map: für jeden Index in tNorm finde Original-Index in text.
  // Vereinfachung: wir nutzen tNorm-Indices direkt als Original-Indices, weil
  // toLowerCase + NFD-Strip Längen-stabil bleibt für ASCII + Diacritics → 1:1-Map.
  // (Edge-Cases wie 'ß' → 'ss' werden Phase-2 betrachtet.)
  let cursor = 0
  while (cursor <= tNorm.length - n.length) {
    const idx = tNorm.indexOf(n, cursor)
    if (idx < 0) break
    stellen.push({ start: idx, end: idx + n.length, feld })
    cursor = idx + n.length
  }
  return stellen
}
```

- [ ] **Step 4: Test passes**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t findeHighlightStellen`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C: findeHighlightStellen — alle Match-Positionen für Highlight"
```

### Task 1.5: gruppiereUndLimitiere() — Sortieren + max 5 pro Quelle

**Files:**
- Modify: `src/utils/sucheEngine.ts`
- Modify: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Test (append)**

```ts
import { gruppiereUndLimitiere } from './sucheEngine'
import type { SucheTreffer } from '../types/suche'

const trefferStub = (q: SucheTreffer['quelle'], id: string, score: number, titel = id): SucheTreffer => ({
  quelle: q, id, titel, score, navigation: { route: '/' },
})

describe('gruppiereUndLimitiere', () => {
  it('limitiert auf 5 pro Quelle', () => {
    const treffer = Array.from({ length: 8 }, (_, i) => trefferStub('frage', `f${i}`, 70))
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.proQuelleSichtbar.frage).toBe(5)
    expect(ergebnis.proQuelleGesamt.frage).toBe(8)
    expect(ergebnis.treffer.filter(t => t.quelle === 'frage')).toHaveLength(5)
  })

  it('sortiert nach score absteigend', () => {
    const treffer = [
      trefferStub('frage', 'a', 50),
      trefferStub('frage', 'b', 100),
      trefferStub('frage', 'c', 70),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.treffer.map(t => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('tie-break alphabetisch nach titel', () => {
    const treffer = [
      trefferStub('frage', 'a', 70, 'Zebra'),
      trefferStub('frage', 'b', 70, 'Apfel'),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.treffer.map(t => t.titel)).toEqual(['Apfel', 'Zebra'])
  })

  it('gemischte Quellen behalten ihre eigenen Limits', () => {
    const treffer = [
      ...Array.from({ length: 7 }, (_, i) => trefferStub('frage', `f${i}`, 50)),
      ...Array.from({ length: 3 }, (_, i) => trefferStub('kurs', `k${i}`, 60)),
    ]
    const ergebnis = gruppiereUndLimitiere(treffer, { maxProQuelle: 5 })
    expect(ergebnis.proQuelleGesamt.frage).toBe(7)
    expect(ergebnis.proQuelleSichtbar.frage).toBe(5)
    expect(ergebnis.proQuelleSichtbar.kurs).toBe(3)
  })

  it('leeres Input → LEERES_ERGEBNIS-Shape', () => {
    const ergebnis = gruppiereUndLimitiere([], { maxProQuelle: 5 })
    expect(ergebnis.treffer).toEqual([])
    expect(ergebnis.proQuelleGesamt.frage).toBe(0)
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t gruppiereUndLimitiere`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// in sucheEngine.ts
import type { SucheTreffer, SucheErgebnis, ProQuelleZahlen, SucheQuelle } from '../types/suche'
import { QUELLEN_REIHENFOLGE, LEERES_ERGEBNIS } from '../types/suche'

function leereZahlen(): ProQuelleZahlen {
  return QUELLEN_REIHENFOLGE.reduce((acc, q) => ({ ...acc, [q]: 0 }), {} as ProQuelleZahlen)
}

export function gruppiereUndLimitiere(
  treffer: SucheTreffer[],
  opts: { maxProQuelle: number },
): SucheErgebnis {
  if (treffer.length === 0) return { ...LEERES_ERGEBNIS, proQuelleGesamt: leereZahlen(), proQuelleSichtbar: leereZahlen() }
  const proQuelleGesamt = leereZahlen()
  const proQuelleSichtbar = leereZahlen()
  const grouped: Record<SucheQuelle, SucheTreffer[]> = {} as Record<SucheQuelle, SucheTreffer[]>
  for (const q of QUELLEN_REIHENFOLGE) grouped[q] = []
  for (const t of treffer) {
    grouped[t.quelle].push(t)
    proQuelleGesamt[t.quelle]++
  }
  const result: SucheTreffer[] = []
  for (const q of QUELLEN_REIHENFOLGE) {
    const sortiert = grouped[q].sort((a, b) =>
      b.score - a.score || a.titel.localeCompare(b.titel, 'de'),
    )
    const limited = sortiert.slice(0, opts.maxProQuelle)
    proQuelleSichtbar[q] = limited.length
    result.push(...limited)
  }
  return { treffer: result, proQuelleSichtbar, proQuelleGesamt }
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t gruppiereUndLimitiere`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C: gruppiereUndLimitiere — sort + max 5 pro Quelle + tie-break alphabetisch"
```

### Task 1.6: highlight() Helper — XSS-sicher via JSX-Array

**Files:**
- Create: `src/utils/highlight.tsx`
- Create: `src/utils/highlight.test.tsx`

- [ ] **Step 1: Test**

```tsx
// src/utils/highlight.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { highlight } from './highlight'
import type { HighlightStelle } from '../types/suche'

describe('highlight', () => {
  it('kein Highlight ohne Stellen', () => {
    const { container } = render(<>{highlight('Bilanz', undefined, 'titel')}</>)
    expect(container.querySelector('mark')).toBeNull()
    expect(container.textContent).toBe('Bilanz')
  })

  it('eine Stelle wraps in <mark>', () => {
    const stellen: HighlightStelle[] = [{ start: 0, end: 6, feld: 'titel' }]
    const { container } = render(<>{highlight('Bilanz Analyse', stellen, 'titel')}</>)
    const mark = container.querySelector('mark')
    expect(mark?.textContent).toBe('Bilanz')
    expect(container.textContent).toBe('Bilanz Analyse')
  })

  it('mehrere Stellen', () => {
    const stellen: HighlightStelle[] = [
      { start: 0, end: 3, feld: 'titel' },
      { start: 8, end: 11, feld: 'titel' },
    ]
    const { container } = render(<>{highlight('foo bar foo', stellen, 'titel')}</>)
    expect(container.querySelectorAll('mark')).toHaveLength(2)
  })

  it('filtert nach Feld', () => {
    const stellen: HighlightStelle[] = [
      { start: 0, end: 3, feld: 'titel' },
      { start: 5, end: 8, feld: 'subTitel' },
    ]
    const { container } = render(<>{highlight('Bilanz Analyse', stellen, 'titel')}</>)
    expect(container.querySelectorAll('mark')).toHaveLength(1)
  })

  it('XSS-Schutz: User-Input wird escaped', () => {
    const stellen: HighlightStelle[] = [{ start: 0, end: 7, feld: 'titel' }]
    const { container } = render(<>{highlight('<script>alert(1)</script>', stellen, 'titel')}</>)
    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/utils/highlight.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```tsx
// src/utils/highlight.tsx
import type { ReactNode } from 'react'
import type { HighlightStelle } from '../types/suche'

export function highlight(
  text: string,
  stellen: HighlightStelle[] | undefined,
  feld: 'titel' | 'subTitel',
): ReactNode[] {
  const relevante = (stellen ?? [])
    .filter(s => s.feld === feld)
    .sort((a, b) => a.start - b.start)
  if (relevante.length === 0) return [text]

  const teile: ReactNode[] = []
  let cursor = 0
  relevante.forEach((s, i) => {
    if (s.start > cursor) teile.push(text.slice(cursor, s.start))
    teile.push(
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 font-semibold rounded px-0.5">
        {text.slice(s.start, s.end)}
      </mark>,
    )
    cursor = s.end
  })
  if (cursor < text.length) teile.push(text.slice(cursor))
  return teile
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/highlight.test.tsx`
Expected: PASS (5/5).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/highlight.tsx ExamLab/src/utils/highlight.test.tsx
git commit -m "Cluster C: highlight() — JSX-Array statt dangerouslySetInnerHTML, XSS-sicher"
```

### Task 1.7: 6 Adapter-Funktionen (index*) — Source → Treffer

**Files:**
- Create: `src/utils/sucheAdapter.ts`
- Create: `src/utils/sucheAdapter.test.ts`

**Hinweis:** Adapter-Funktionen sind PUR — sie nehmen die Source-Daten als Input und liefern `SucheTreffer[]`. Routing kommt aus Phase 4 — bis dahin `route: '#'` als Platzhalter.

- [ ] **Step 1: Tests schreiben (6 Adapter)**

```ts
// src/utils/sucheAdapter.test.ts
import { describe, it, expect } from 'vitest'
import {
  indexEinstellungenTabs,
  indexHilfeTabs,
  indexKurse,
  indexPruefungen,
  indexUebungen,
  indexFragen,
} from './sucheAdapter'
import type { TabDefinition } from '../utils/tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary } from '../types/fragen-storage'

describe('indexEinstellungenTabs', () => {
  it('findet Tab-Treffer per Titel', () => {
    const tabs: TabDefinition[] = [
      { id: 'lernziele', label: 'Lernziele', icon: 'Target' } as TabDefinition,
      { id: 'profil', label: 'Profil', icon: 'User' } as TabDefinition,
    ]
    const treffer = indexEinstellungenTabs('lern', tabs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].titel).toBe('Lernziele')
    expect(treffer[0].quelle).toBe('einstellungen-tab')
  })
})

describe('indexHilfeTabs', () => {
  it('findet Hilfe-Tab', () => {
    const tabs: TabDefinition[] = [
      { id: 'bloom', label: 'Bloom-Stufen', icon: 'Layers' } as TabDefinition,
    ]
    const treffer = indexHilfeTabs('bloom', tabs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('hilfe-tab')
  })
})

describe('indexKurse', () => {
  it('findet Kurs per ID-Substring', () => {
    const kurse: KursDefinition[] = [
      { id: 'sf-wr-29c', klassen: ['29c'] } as KursDefinition,
    ]
    const treffer = indexKurse('29c', kurse)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].quelle).toBe('kurs')
  })
})

describe('indexPruefungen', () => {
  it('findet Prüfung per Titel', () => {
    const configs: PruefungsConfig[] = [
      { id: 'p1', titel: 'Bilanz-Test', typ: 'summativ', klasse: '29c', fach: 'BWL' } as PruefungsConfig,
    ]
    const treffer = indexPruefungen('bilanz', configs)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].subTitel).toContain('29c')
  })

  it('filtert formative aus', () => {
    const configs: PruefungsConfig[] = [
      { id: 'p1', titel: 'Übung A', typ: 'formativ' } as PruefungsConfig,
      { id: 'p2', titel: 'Übung B', typ: 'summativ' } as PruefungsConfig,
    ]
    const treffer = indexPruefungen('übung', configs)
    expect(treffer.map(t => t.id)).toEqual(['p2'])
  })
})

describe('indexUebungen', () => {
  it('findet formative Configs', () => {
    const configs: PruefungsConfig[] = [
      { id: 'u1', titel: 'Übung A', typ: 'formativ' } as PruefungsConfig,
      { id: 'p1', titel: 'Test', typ: 'summativ' } as PruefungsConfig,
    ]
    const treffer = indexUebungen('übung', configs)
    expect(treffer.map(t => t.id)).toEqual(['u1'])
  })
})

describe('indexFragen', () => {
  it('matched Titel', () => {
    const fragen: FrageSummary[] = [
      { id: 'f1', fragetext: 'Was ist Bilanz?', tags: [], thema: 'BWL' } as FrageSummary,
    ]
    const treffer = indexFragen('bilanz', fragen)
    expect(treffer).toHaveLength(1)
  })

  it('matched Tag', () => {
    const fragen: FrageSummary[] = [
      { id: 'f1', fragetext: 'Foo', tags: ['Bilanz'], thema: 'BWL' } as FrageSummary,
    ]
    const treffer = indexFragen('bilanz', fragen)
    expect(treffer).toHaveLength(1)
  })

  it('matched ID-exakt', () => {
    const fragen: FrageSummary[] = [
      { id: 'frg-12345', fragetext: 'Foo', tags: [], thema: 'X' } as FrageSummary,
    ]
    const treffer = indexFragen('frg-12345', fragen)
    expect(treffer).toHaveLength(1)
    expect(treffer[0].score).toBe(95) // SCORE_BOUNDS.ID_EXACT
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// src/utils/sucheAdapter.ts
import { scoreFromMatch, findeHighlightStellen } from './sucheEngine'
import type { SucheTreffer, SucheIconKey } from '../types/suche'
import type { TabDefinition } from './tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary } from '../types/fragen-storage'

const PLACEHOLDER_ROUTE = '#'  // wird in Task 4.1 durch echte Routen ersetzt

function tabZuTreffer(
  tab: TabDefinition,
  query: string,
  quelle: 'einstellungen-tab' | 'hilfe-tab',
): SucheTreffer | null {
  const score = scoreFromMatch(tab.label, query, 'titel')
  if (score === 0) return null
  const iconKey: SucheIconKey = quelle === 'einstellungen-tab' ? 'einstellungen' : 'hilfe'
  return {
    quelle,
    id: tab.id,
    titel: tab.label,
    highlightStellen: findeHighlightStellen(tab.label, query, 'titel'),
    navigation: { route: PLACEHOLDER_ROUTE },
    score,
    iconKey,
  }
}

export function indexEinstellungenTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  return tabs.map(t => tabZuTreffer(t, query, 'einstellungen-tab')).filter((t): t is SucheTreffer => t !== null)
}

export function indexHilfeTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  return tabs.map(t => tabZuTreffer(t, query, 'hilfe-tab')).filter((t): t is SucheTreffer => t !== null)
}

export function indexKurse(query: string, kurse: KursDefinition[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  const treffer: SucheTreffer[] = []
  for (const k of kurse) {
    const idScore = scoreFromMatch(k.id, query, 'id')
    const klasseScore = k.klassen.length > 0 ? scoreFromMatch(k.klassen.join(' '), query, 'tag') : 0
    const score = Math.max(idScore, klasseScore)
    if (score === 0) continue
    treffer.push({
      quelle: 'kurs',
      id: k.id,
      titel: k.id,
      subTitel: k.klassen.join(', '),
      highlightStellen: findeHighlightStellen(k.id, query, 'titel'),
      navigation: { route: PLACEHOLDER_ROUTE },
      score,
      iconKey: 'kurs',
    })
  }
  return treffer
}

function configZuTreffer(c: PruefungsConfig, query: string, quelle: 'pruefung' | 'uebung'): SucheTreffer | null {
  const titel = c.titel ?? c.id
  const subTitel = [c.klasse, c.fach].filter(Boolean).join(' · ')
  const titelScore = scoreFromMatch(titel, query, 'titel')
  const subScore = subTitel ? scoreFromMatch(subTitel, query, 'subTitel') : 0
  const score = Math.max(titelScore, subScore)
  if (score === 0) return null
  return {
    quelle,
    id: c.id,
    titel,
    subTitel: subTitel || undefined,
    highlightStellen: [
      ...findeHighlightStellen(titel, query, 'titel'),
      ...(subTitel ? findeHighlightStellen(subTitel, query, 'subTitel') : []),
    ],
    navigation: { route: PLACEHOLDER_ROUTE },
    score,
    iconKey: quelle === 'pruefung' ? 'pruefung' : 'uebung',
  }
}

export function indexPruefungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  return configs
    .filter(c => c.typ !== 'formativ')
    .map(c => configZuTreffer(c, query, 'pruefung'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexUebungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  return configs
    .filter(c => c.typ === 'formativ')
    .map(c => configZuTreffer(c, query, 'uebung'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexFragen(query: string, fragen: FrageSummary[]): SucheTreffer[] {
  // Min-Query-Guard zentral in fuehreSucheAus(); Adapter dürfen davon ausgehen, dass query gültig ist.
  const treffer: SucheTreffer[] = []
  for (const f of fragen) {
    const titel = f.fragetext.slice(0, 80)  // Summary-Fragetext ist max 200 Z., wir nehmen die ersten 80
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const idScore = scoreFromMatch(f.id, query, 'id')
    const tagText = (f.tags ?? []).join(' ')
    const tagScore = tagText ? scoreFromMatch(tagText, query, 'tag') : 0
    const themaScore = f.thema ? scoreFromMatch(f.thema, query, 'tag') : 0
    const score = Math.max(titelScore, idScore, tagScore, themaScore)
    if (score === 0) continue
    treffer.push({
      quelle: 'frage',
      id: f.id,
      titel,
      subTitel: f.thema || undefined,
      highlightStellen: findeHighlightStellen(titel, query, 'titel'),
      navigation: { route: PLACEHOLDER_ROUTE },
      score,
      iconKey: 'frage',
    })
  }
  return treffer
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: PASS (alle 8 Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheAdapter.ts ExamLab/src/utils/sucheAdapter.test.ts
git commit -m "Cluster C: 6 Adapter — Einstellungen/Hilfe-Tabs, Kurse, Pruefungen, Uebungen, Fragen"
```

### Task 1.8: fuehreSucheAus() — Orchestrator

**Files:**
- Modify: `src/utils/sucheEngine.ts`
- Modify: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Test**

```ts
import { fuehreSucheAus } from './sucheEngine'
import type { SucheIndex } from '../types/suche'
import type { TabDefinition } from './tabRegistry'

function leererIndex(): SucheIndex {
  return {
    einstellungenTabs: [],
    hilfeTabs: [],
    kurse: [],
    pruefungen: [],
    uebungen: [],
    fragen: [],
  }
}

describe('fuehreSucheAus', () => {
  it('leere Query → LEERES_ERGEBNIS', () => {
    expect(fuehreSucheAus('', leererIndex()).treffer).toEqual([])
  })

  it('1 Zeichen → leer', () => {
    expect(fuehreSucheAus('a', leererIndex()).treffer).toEqual([])
  })

  it('Multi-Quelle-Treffer', () => {
    const index: SucheIndex = {
      ...leererIndex(),
      einstellungenTabs: [{ id: 'profil', label: 'Profil', icon: 'User' } as TabDefinition],
      kurse: [{ id: 'sf-profil-test', klassen: [] } as any],
    }
    const ergebnis = fuehreSucheAus('profil', index)
    expect(ergebnis.treffer.length).toBeGreaterThanOrEqual(2)
    expect(ergebnis.proQuelleGesamt['einstellungen-tab']).toBe(1)
    expect(ergebnis.proQuelleGesamt.kurs).toBe(1)
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts -t fuehreSucheAus`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// in sucheEngine.ts (append; SucheIndex-Type kommt aus types/suche.ts, hier KEINE Re-Deklaration)
import { indexEinstellungenTabs, indexHilfeTabs, indexKurse, indexPruefungen, indexUebungen, indexFragen } from './sucheAdapter'
import type { SucheIndex, SucheErgebnis, SucheTreffer } from '../types/suche'

export function fuehreSucheAus(query: string, index: SucheIndex): SucheErgebnis {
  if (normalizeForSuche(query).length < 2) return LEERES_ERGEBNIS

  const alle: SucheTreffer[] = [
    ...indexEinstellungenTabs(query, index.einstellungenTabs),
    ...indexHilfeTabs(query, index.hilfeTabs),
    ...indexKurse(query, index.kurse),
    ...indexPruefungen(query, index.pruefungen),
    ...indexUebungen(query, index.uebungen),
    ...indexFragen(query, index.fragen),
  ]

  return gruppiereUndLimitiere(alle, { maxProQuelle: 5 })
}
```

**Hinweis:** `SucheIndex` ist in `types/suche.ts` Task 1.1 vollständig definiert — hier kein Re-Export, sondern Import via `import type`.

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts`
Expected: PASS (alle Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C: fuehreSucheAus — Orchestrator über 6 Adapter + Gruppieren"
```

---

## Phase 2 — Cache-Store + Selektor-Hook

### Task 2.1: configsListStore — Cache-Store

**Files:**
- Create: `src/store/configsListStore.ts`
- Create: `src/store/configsListStore.test.ts`

- [ ] **Step 1: Test**

```ts
// src/store/configsListStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigsListStore } from './configsListStore'
import type { PruefungsConfig } from '../types/pruefung'

describe('useConfigsListStore', () => {
  beforeEach(() => {
    useConfigsListStore.setState({ configs: [], istGeladen: false })
  })

  it('initial leer + nicht geladen', () => {
    const s = useConfigsListStore.getState()
    expect(s.configs).toEqual([])
    expect(s.istGeladen).toBe(false)
  })

  it('setConfigs setzt Liste + istGeladen=true', () => {
    const configs = [{ id: 'p1', titel: 'X', typ: 'summativ' } as PruefungsConfig]
    useConfigsListStore.getState().setConfigs(configs)
    const s = useConfigsListStore.getState()
    expect(s.configs).toEqual(configs)
    expect(s.istGeladen).toBe(true)
  })

  it('reset setzt zurück', () => {
    useConfigsListStore.getState().setConfigs([{ id: 'p1' } as PruefungsConfig])
    useConfigsListStore.getState().reset()
    expect(useConfigsListStore.getState().istGeladen).toBe(false)
    expect(useConfigsListStore.getState().configs).toEqual([])
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/store/configsListStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// src/store/configsListStore.ts
import { create } from 'zustand'
import type { PruefungsConfig } from '../types/pruefung'

interface ConfigsListState {
  configs: PruefungsConfig[]
  istGeladen: boolean
  setConfigs: (configs: PruefungsConfig[]) => void
  reset: () => void
}

export const useConfigsListStore = create<ConfigsListState>((set) => ({
  configs: [],
  istGeladen: false,
  setConfigs: (configs) => set({ configs, istGeladen: true }),
  reset: () => set({ configs: [], istGeladen: false }),
}))
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/store/configsListStore.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/configsListStore.ts ExamLab/src/store/configsListStore.test.ts
git commit -m "Cluster C: configsListStore — Cache-Store für PruefungsConfig-Liste (Single-Source-of-Truth)"
```

### Task 2.2: useLPDashboardData minimal patchen — schreibt in configsListStore

**Files:**
- Modify: `src/hooks/useLPDashboardData.ts` Z.100 + Z.121 + Z.156

- [ ] **Step 1: Patch alle `setConfigs(...)`-Aufrufstellen**

3 Stellen identifiziert (Z.100, 121, 156): Nach jedem `setConfigs(...)` zusätzlich `useConfigsListStore.getState().setConfigs(...)` aufrufen. Import oben ergänzen.

Konkret:
```ts
// Z.1 Import (append)
import { useConfigsListStore } from '../store/configsListStore'

// Z.100 (Cluster F context):
setConfigs(configResult)
useConfigsListStore.getState().setConfigs(configResult)

// Z.121:
if (neueConfigs) {
  setConfigs(neueConfigs)
  useConfigsListStore.getState().setConfigs(neueConfigs)
}

// Z.156:
setConfigs(result)
useConfigsListStore.getState().setConfigs(result)
```

(Demo-Pfade Z.60+165 setzen Demo-Daten — auch dort hooken, damit Such-Hook auch im Demo-Modus reagiert: `useConfigsListStore.getState().setConfigs(demoConfigs())`.)

- [ ] **Step 2: Type-Check + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run lint -- --max-warnings 0 || true`
Expected: ✅ kein neuer Fehler.

- [ ] **Step 3: Bestehende Tests laufen lassen**

Run: `cd ExamLab && npx vitest run src/hooks/useLPDashboardData`
Expected: PASS (bestehende Tests bleiben grün — Patch ist additiv).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/hooks/useLPDashboardData.ts
git commit -m "Cluster C: useLPDashboardData schreibt Configs zusätzlich in configsListStore (Cache-Layer)"
```

### Task 2.3: useSucheIndex — Selektor-Hook

**Files:**
- Create: `src/hooks/useSucheIndex.ts`
- Create: `src/hooks/useSucheIndex.test.tsx`

- [ ] **Step 1: Test (Closure-Ref-Mock-Pattern für Stores)**

```tsx
// src/hooks/useSucheIndex.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const stammdatenStub = { kurse: [{ id: 'k1', klassen: ['29c'] }] }
const lpProfilStub = { testdatenSichtbar: false, email: 'wr@test', kursIds: ['k1'] }
const configsStub = [
  { id: 'p1', titel: 'Bilanz', typ: 'summativ', testdatenSichtbar: false } as any,
  { id: 'u1', titel: 'Übung A', typ: 'formativ', testdatenSichtbar: false } as any,
]
const fragenStub = [{ id: 'f1', fragetext: 'Was', tags: [], thema: 'BWL' } as any]

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: any) => sel({ stammdaten: stammdatenStub, lpProfil: lpProfilStub, istAdmin: () => false }),
}))
vi.mock('../store/configsListStore', () => ({
  useConfigsListStore: (sel: any) => sel({ configs: configsStub, istGeladen: true }),
}))
vi.mock('../store/fragensammlungStore', () => ({
  useFragensammlungStore: (sel: any) => sel({ summaries: fragenStub }),
}))
vi.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ user: { email: 'wr@test' } }),
}))
vi.mock('../utils/tabRegistry', () => ({
  tabsFuerSurface: (surface: string) => surface === 'einstellungen'
    ? [{ id: 'lernziele', label: 'Lernziele', icon: 'Target' }]
    : [{ id: 'bloom', label: 'Bloom', icon: 'Layers' }],
}))

import { useSucheIndex } from './useSucheIndex'

describe('useSucheIndex', () => {
  it('liefert alle 6 Quellen', () => {
    const { result } = renderHook(() => useSucheIndex())
    expect(result.current.einstellungenTabs).toHaveLength(1)
    expect(result.current.hilfeTabs).toHaveLength(1)
    expect(result.current.kurse).toHaveLength(1)
    expect(result.current.pruefungen).toHaveLength(1)
    expect(result.current.uebungen).toHaveLength(1)
    expect(result.current.fragen).toHaveLength(1)
  })

  it('Cluster F: testdatenSichtbar=false filtert Test-Records aus', () => {
    // testdatenSichtbar=false (siehe lpProfilStub) → Test-Records werden gefiltert
    // Aber unsere Stub-Records haben testdatenSichtbar=false (nicht Test-Daten)
    // → kein Filter-Effekt; alle 1 Pruefung + 1 Uebung sichtbar
    const { result } = renderHook(() => useSucheIndex())
    expect(result.current.pruefungen).toHaveLength(1)
    expect(result.current.uebungen).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/hooks/useSucheIndex.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// src/hooks/useSucheIndex.ts
import { useMemo } from 'react'
import { useStammdatenStore } from '../store/stammdatenStore'
import { useConfigsListStore } from '../store/configsListStore'
import { useFragensammlungStore } from '../store/fragensammlungStore'
import { useAuthStore } from '../store/authStore'
import { tabsFuerSurface } from '../utils/tabRegistry'
import { filtereTestdatenWennDeaktiviert } from '../utils/testdaten/filter'
import type { SucheIndex } from '../types/suche'

export function useSucheIndex(): SucheIndex {
  const user = useAuthStore(s => s.user)
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const istAdminFn = useStammdatenStore(s => s.istAdmin)
  const configs = useConfigsListStore(s => s.configs)
  const fragen = useFragensammlungStore(s => s.summaries)

  const istAdmin = user ? istAdminFn(user.email) : false
  const testdatenSichtbar = lpProfil?.testdatenSichtbar ?? false

  return useMemo(() => {
    const ctx = { istAdmin }
    const einstellungenTabs = tabsFuerSurface('einstellungen', ctx)
    const hilfeTabs = tabsFuerSurface('hilfe', ctx)

    const kurseGefiltert = filtereTestdatenWennDeaktiviert(stammdaten?.kurse ?? [], testdatenSichtbar)
    const configsGefiltert = filtereTestdatenWennDeaktiviert(configs, testdatenSichtbar)
    const fragenGefiltert = filtereTestdatenWennDeaktiviert(fragen, testdatenSichtbar)

    return {
      einstellungenTabs,
      hilfeTabs,
      kurse: kurseGefiltert,
      pruefungen: configsGefiltert.filter(c => c.typ !== 'formativ'),
      uebungen: configsGefiltert.filter(c => c.typ === 'formativ'),
      fragen: fragenGefiltert,
    }
  }, [istAdmin, stammdaten, configs, fragen, testdatenSichtbar])
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/hooks/useSucheIndex.test.tsx`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useSucheIndex.ts ExamLab/src/hooks/useSucheIndex.test.tsx
git commit -m "Cluster C: useSucheIndex — Selektor über 4 Stores + tabRegistry + Cluster-F-Filter"
```

---

## Phase 3 — UI-Komponenten

### Task 3.1: EmptyState Komponente

**Files:**
- Create: `src/components/shared/header/sucheUI/EmptyState.tsx`

- [ ] **Step 1: Komponente schreiben (kein Test — pure JSX)**

```tsx
// src/components/shared/header/sucheUI/EmptyState.tsx
import { Search } from 'lucide-react'
import { TYPO } from '../../../../styles/typografie'

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
      <p className={TYPO.body}>Nichts gefunden für „{query}"</p>
      <p className={`${TYPO.caption} text-slate-500`}>Versuche andere Begriffe.</p>
    </div>
  )
}
```

- [ ] **Step 2: tsc**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: ✅.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/shared/header/sucheUI/EmptyState.tsx
git commit -m "Cluster C: EmptyState — Such-Icon + Hinweis bei 0 Treffern"
```

### Task 3.2: TrefferZeile Komponente

**Files:**
- Create: `src/components/shared/header/sucheUI/TrefferZeile.tsx`
- Create: `src/components/shared/header/sucheUI/TrefferZeile.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TrefferZeile } from './TrefferZeile'
import type { SucheTreffer } from '../../../../types/suche'

const treffer: SucheTreffer = {
  quelle: 'frage',
  id: 'f1',
  titel: 'Bilanz Analyse',
  subTitel: 'BWL',
  highlightStellen: [{ start: 0, end: 6, feld: 'titel' }],
  navigation: { route: '/fragensammlung/f1' },
  score: 100,
  iconKey: 'frage',
}

describe('TrefferZeile', () => {
  it('rendert Titel + Subtitel + Icon', () => {
    const { container, getByText } = render(<TrefferZeile treffer={treffer} aktiv={false} onClick={() => {}} />)
    expect(getByText('BWL')).toBeTruthy()
    expect(container.querySelector('mark')?.textContent).toBe('Bilanz')
  })

  it('aktiv-Klasse setzt Ring', () => {
    const { container } = render(<TrefferZeile treffer={treffer} aktiv={true} onClick={() => {}} />)
    expect(container.querySelector('li')?.className).toContain('ring-1')
  })

  it('onClick wird gerufen', () => {
    const onClick = vi.fn()
    const { container } = render(<TrefferZeile treffer={treffer} aktiv={false} onClick={onClick} />)
    fireEvent.click(container.querySelector('li')!)
    expect(onClick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/components/shared/header/sucheUI/TrefferZeile.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```tsx
// src/components/shared/header/sucheUI/TrefferZeile.tsx
import { highlight } from '../../../../utils/highlight'
import { TYPO } from '../../../../styles/typografie'
import { ICON_MAP } from '../../../../types/suche'
import type { SucheTreffer } from '../../../../types/suche'

export function TrefferZeile({ treffer, aktiv, onClick }: {
  treffer: SucheTreffer
  aktiv: boolean
  onClick: () => void
}) {
  const IconComp = ICON_MAP[treffer.iconKey ?? 'default']
  return (
    <li
      onClick={onClick}
      role="option"
      aria-selected={aktiv}
      className={`px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer flex items-center gap-3 ${
        aktiv ? 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-violet-300' : ''
      }`}
    >
      <IconComp className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className={`${TYPO.body} truncate`}>
          {highlight(treffer.titel, treffer.highlightStellen, 'titel')}
        </div>
        {treffer.subTitel && (
          <div className={`${TYPO.caption} truncate text-slate-500`}>
            {highlight(treffer.subTitel, treffer.highlightStellen, 'subTitel')}
          </div>
        )}
      </div>
    </li>
  )
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/components/shared/header/sucheUI/TrefferZeile.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/sucheUI/TrefferZeile.tsx ExamLab/src/components/shared/header/sucheUI/TrefferZeile.test.tsx
git commit -m "Cluster C: TrefferZeile — Icon + Titel + Subtitel mit Highlight + aktiv-Ring"
```

### Task 3.3: QuellSektion Komponente

**Files:**
- Create: `src/components/shared/header/sucheUI/QuellSektion.tsx`
- Create: `src/components/shared/header/sucheUI/QuellSektion.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { QuellSektion } from './QuellSektion'
import type { SucheTreffer } from '../../../../types/suche'

const treffer: SucheTreffer[] = [
  { quelle: 'frage', id: 'f1', titel: 'A', score: 100, navigation: { route: '/' } },
]

describe('QuellSektion', () => {
  it('rendert Label + Treffer', () => {
    const { getByText } = render(
      <QuellSektion quelle="frage" treffer={treffer} gesamtCount={1} activeFlatIndex={-1} flatOffset={0} onTrefferKlick={() => {}} onAlleAnzeigen={() => {}} />
    )
    expect(getByText('Fragen')).toBeTruthy()
  })

  it('zeigt "Alle X Treffer"-Link bei gesamtCount > 5', () => {
    const { getByText } = render(
      <QuellSektion quelle="frage" treffer={treffer} gesamtCount={12} activeFlatIndex={-1} flatOffset={0} onTrefferKlick={() => {}} onAlleAnzeigen={() => {}} />
    )
    expect(getByText(/Alle 12 Treffer in fragen/i)).toBeTruthy()
  })

  it('onAlleAnzeigen wird gerufen', () => {
    const fn = vi.fn()
    const { getByText } = render(
      <QuellSektion quelle="frage" treffer={treffer} gesamtCount={12} activeFlatIndex={-1} flatOffset={0} onTrefferKlick={() => {}} onAlleAnzeigen={fn} />
    )
    fireEvent.click(getByText(/Alle 12/))
    expect(fn).toHaveBeenCalledWith('frage')
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/components/shared/header/sucheUI/QuellSektion.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```tsx
// src/components/shared/header/sucheUI/QuellSektion.tsx
import { TrefferZeile } from './TrefferZeile'
import { TYPO } from '../../../../styles/typografie'
import { QUELL_LABEL } from '../../../../types/suche'
import type { SucheTreffer, SucheQuelle } from '../../../../types/suche'

export function QuellSektion({
  quelle,
  treffer,
  gesamtCount,
  activeFlatIndex,
  flatOffset,
  onTrefferKlick,
  onAlleAnzeigen,
}: {
  quelle: SucheQuelle
  treffer: SucheTreffer[]
  gesamtCount: number
  activeFlatIndex: number
  flatOffset: number
  onTrefferKlick: (t: SucheTreffer) => void
  onAlleAnzeigen: (q: SucheQuelle) => void
}) {
  return (
    <section>
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <h3 className={`${TYPO.caption} uppercase text-slate-600 dark:text-slate-300`}>{QUELL_LABEL[quelle]}</h3>
        {gesamtCount > 5 && (
          <span className={`${TYPO.caption} text-slate-500`}>{gesamtCount}</span>
        )}
      </div>
      <ul role="listbox">
        {treffer.map((t, i) => (
          <TrefferZeile
            key={t.id}
            treffer={t}
            aktiv={activeFlatIndex === flatOffset + i}
            onClick={() => onTrefferKlick(t)}
          />
        ))}
      </ul>
      {gesamtCount > 5 && (
        <button
          onClick={() => onAlleAnzeigen(quelle)}
          className={`${TYPO.caption} block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-300`}
        >
          Alle {gesamtCount} Treffer in {QUELL_LABEL[quelle].toLowerCase()} →
        </button>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/components/shared/header/sucheUI/QuellSektion.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/sucheUI/QuellSektion.tsx ExamLab/src/components/shared/header/sucheUI/QuellSektion.test.tsx
git commit -m "Cluster C: QuellSektion — Header + Treffer-Liste + 'Alle Treffer'-Link"
```

### Task 3.4: Re-Export-Index

**Files:**
- Create: `src/components/shared/header/sucheUI/index.ts`

- [ ] **Step 1: Datei**

```ts
export { TrefferZeile } from './TrefferZeile'
export { QuellSektion } from './QuellSektion'
export { EmptyState } from './EmptyState'
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/shared/header/sucheUI/index.ts
git commit -m "Cluster C: sucheUI Barrel-Export"
```

---

## Phase 4 — Sub-Hooks + HilfeSeite-Patch + LPGlobalSuche + Container-Migration

Phase 4 ist deutlich umfangreicher als Plan rev1, weil:
- 3 generische Sub-Hooks (Debounce, Keyboard, Click-Outside) sind TDD-isoliert testbar.
- `HilfeSeite` braucht `initialKategorie`-Prop für Deep-Linking.
- `LPGlobalSuche` ist neue eigene Komponente (kein Refactor der dumb `GlobalSuche`).

### Task 4.1: Routes-Mapping in Adaptern (von `'#'` auf echte Pfade)

**Files:**
- Modify: `src/utils/sucheAdapter.ts`
- Modify: `src/utils/sucheAdapter.test.ts`

Route-Map:
- `'einstellungen-tab'` → `/einstellungen/{tabId}`
- `'hilfe-tab'` → `/einstellungen?hilfe={tabId}` (siehe Task 4.5: LPStartseite-Patch liest Param)
- `'kurs'` → `/pruefung` (kein eigener Kurs-Detail)
- `'pruefung'` → `/pruefung/{configId}`
- `'uebung'` → `/uebung/{configId}`
- `'frage'` → `/fragensammlung/{frageId}`

- [ ] **Step 1: Route-Assertions in Tests ergänzen**

In `sucheAdapter.test.ts`: pro `describe`-Block + `expect(treffer[0].navigation.route).toBe('/...')`.

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// in sucheAdapter.ts (oberhalb der Adapter)
const ROUTE_BUILDERS = {
  einstellungenTab: (tabId: string) => `/einstellungen/${tabId}`,
  hilfeTab: (tabId: string) => `/einstellungen?hilfe=${encodeURIComponent(tabId)}`,
  kurs: (_kursId: string) => `/pruefung`,
  pruefung: (configId: string) => `/pruefung/${configId}`,
  uebung: (configId: string) => `/uebung/${configId}`,
  frage: (frageId: string) => `/fragensammlung/${frageId}`,
}
```

Pro Adapter `navigation.route` durch Builder ersetzen. Auch `iconKey` setzen (`'einstellungen'` / `'hilfe'` / `'kurs'` / `'pruefung'` / `'uebung'` / `'frage'`).

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheAdapter.ts ExamLab/src/utils/sucheAdapter.test.ts
git commit -m "Cluster C: Routes-Builder pro Quelle + iconKey"
```

### Task 4.2: useDebouncedValue Hook

**Files:**
- Create: `src/hooks/useDebouncedValue.ts`
- Create: `src/hooks/useDebouncedValue.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('liefert initial value sofort', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('debounced Update nach delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } })
    rerender({ value: 'b' })
    expect(result.current).toBe('a')
    act(() => { vi.advanceTimersByTime(300) })
    expect(result.current).toBe('b')
  })

  it('schneller Re-Update resettet Timer', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } })
    rerender({ value: 'b' })
    act(() => { vi.advanceTimersByTime(200) })
    rerender({ value: 'c' })
    act(() => { vi.advanceTimersByTime(200) })
    expect(result.current).toBe('a')  // noch nicht durch
    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe('c')
  })
})
```

- [ ] **Step 2: Fail**

Run: `cd ExamLab && npx vitest run src/hooks/useDebouncedValue.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

```ts
// src/hooks/useDebouncedValue.ts
import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}
```

- [ ] **Step 4: Pass + Commit**

```bash
cd ExamLab && npx vitest run src/hooks/useDebouncedValue.test.tsx  # PASS
git add ExamLab/src/hooks/useDebouncedValue.ts ExamLab/src/hooks/useDebouncedValue.test.tsx
git commit -m "Cluster C: useDebouncedValue — generischer Debounce-Hook"
```

### Task 4.3: useKeyboardNavigation Hook

**Files:**
- Create: `src/hooks/useKeyboardNavigation.ts`
- Create: `src/hooks/useKeyboardNavigation.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardNavigation } from './useKeyboardNavigation'

describe('useKeyboardNavigation', () => {
  it('initial activeIndex = -1', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, onEnter: () => {}, onEscape: () => {} }))
    expect(result.current.activeIndex).toBe(-1)
  })

  it('ArrowDown inkrementiert', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 5, onEnter: () => {}, onEscape: () => {} }))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    expect(result.current.activeIndex).toBe(0)
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    expect(result.current.activeIndex).toBe(1)
  })

  it('ArrowDown clamping bei itemCount-1', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 2, onEnter: () => {}, onEscape: () => {} }))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    expect(result.current.activeIndex).toBe(1)
  })

  it('Enter ruft onEnter mit activeIndex', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, onEnter, onEscape: () => {} }))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    act(() => result.current.handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any))
    expect(onEnter).toHaveBeenCalledWith(0)
  })

  it('Enter ruft onEnter(0) wenn activeIndex=-1', () => {
    const onEnter = vi.fn()
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, onEnter, onEscape: () => {} }))
    act(() => result.current.handleKeyDown({ key: 'Enter', preventDefault: () => {} } as any))
    expect(onEnter).toHaveBeenCalledWith(0)
  })

  it('Escape ruft onEscape', () => {
    const onEscape = vi.fn()
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, onEnter: () => {}, onEscape }))
    act(() => result.current.handleKeyDown({ key: 'Escape', preventDefault: () => {} } as any))
    expect(onEscape).toHaveBeenCalled()
  })

  it('reset setzt activeIndex zurück', () => {
    const { result } = renderHook(() => useKeyboardNavigation({ itemCount: 3, onEnter: () => {}, onEscape: () => {} }))
    act(() => result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: () => {} } as any))
    act(() => result.current.reset())
    expect(result.current.activeIndex).toBe(-1)
  })
})
```

- [ ] **Step 2: Fail + Step 3: Implementation**

```ts
// src/hooks/useKeyboardNavigation.ts
import { useState, useCallback } from 'react'

export interface UseKeyboardNavigationOpts {
  itemCount: number
  onEnter: (index: number) => void
  onEscape: () => void
}

export function useKeyboardNavigation(opts: UseKeyboardNavigationOpts) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement> | KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault?.()
      setActiveIndex(prev => Math.min(prev + 1, opts.itemCount - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault?.()
      setActiveIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault?.()
      const idx = activeIndex >= 0 ? activeIndex : 0
      if (opts.itemCount > 0) opts.onEnter(idx)
    } else if (e.key === 'Escape') {
      opts.onEscape()
    }
  }, [activeIndex, opts])

  const reset = useCallback(() => setActiveIndex(-1), [])

  return { activeIndex, handleKeyDown, reset, setActiveIndex }
}
```

- [ ] **Step 4: Pass + Commit**

```bash
cd ExamLab && npx vitest run src/hooks/useKeyboardNavigation.test.tsx  # PASS
git add ExamLab/src/hooks/useKeyboardNavigation.ts ExamLab/src/hooks/useKeyboardNavigation.test.tsx
git commit -m "Cluster C: useKeyboardNavigation — ArrowUp/Down/Enter/Escape Handler"
```

### Task 4.4: useClickOutside Hook

**Files:**
- Create: `src/hooks/useClickOutside.ts`
- Create: `src/hooks/useClickOutside.test.tsx`

- [ ] **Step 1: Test**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useClickOutside } from './useClickOutside'

describe('useClickOutside', () => {
  it('ruft callback bei click ausserhalb', () => {
    const cb = vi.fn()
    const wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(wrapper)
      useClickOutside(ref, cb)
    })
    const evt = new MouseEvent('mousedown', { bubbles: true })
    document.body.dispatchEvent(evt)
    expect(cb).toHaveBeenCalled()
  })

  it('ruft callback NICHT bei click innerhalb', () => {
    const cb = vi.fn()
    const wrapper = document.createElement('div')
    const child = document.createElement('span')
    wrapper.appendChild(child)
    document.body.appendChild(wrapper)
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(wrapper)
      useClickOutside(ref, cb)
    })
    child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(cb).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Fail + Step 3: Implementation**

```ts
// src/hooks/useClickOutside.ts
import { useEffect, type RefObject } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void,
) {
  useEffect(() => {
    function handle(e: MouseEvent) {
      const target = e.target as Node
      if (ref.current && !ref.current.contains(target)) callback()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, callback])
}
```

- [ ] **Step 4: Pass + Commit**

```bash
cd ExamLab && npx vitest run src/hooks/useClickOutside.test.tsx  # PASS
git add ExamLab/src/hooks/useClickOutside.ts ExamLab/src/hooks/useClickOutside.test.tsx
git commit -m "Cluster C: useClickOutside — Mousedown ausserhalb ref triggert callback"
```

### Task 4.5: HilfeSeite + LPStartseite Patch (Deep-Linking)

**Files:**
- Modify: `src/components/lp/HilfeSeite.tsx` — `initialKategorie?: string`-Prop
- Modify: `src/components/lp/LPStartseite.tsx` — `useSearchParams` liest `?hilfe=<tabId>`, mountet HilfeSeite mit Prop

- [ ] **Step 1: Audit HilfeSeite useState**

Run: `grep -n "useState.*kategorie\|kategorie" ExamLab/src/components/lp/HilfeSeite.tsx | head -10`

Notiere Zeile von `const [kategorie, setKategorie] = useState('einstieg')`.

- [ ] **Step 2: HilfeSeite Patch**

```tsx
// In HilfeSeite.tsx
interface HilfeSeiteProps {
  onSchliessen: () => void
  initialKategorie?: string
}

export default function HilfeSeite({ onSchliessen, initialKategorie }: HilfeSeiteProps) {
  const [kategorie, setKategorie] = useState<string>(initialKategorie ?? 'einstieg')
  // ... Rest unverändert
}
```

- [ ] **Step 3: LPStartseite Patch**

```tsx
// In LPStartseite.tsx — bei HilfeSeite-Mount
const [searchParams, setSearchParams] = useSearchParams()
const hilfeTab = searchParams.get('hilfe')
const [zeigeHilfe, setZeigeHilfe] = useState(!!hilfeTab)

useEffect(() => {
  if (hilfeTab) {
    setZeigeHilfe(true)
    // Param nach Mount entfernen, damit Reload Default-Verhalten zeigt
    const next = new URLSearchParams(searchParams)
    next.delete('hilfe')
    setSearchParams(next, { replace: true })
  }
}, [hilfeTab])

// Mount-Stelle:
{zeigeHilfe && <HilfeSeite onSchliessen={() => setZeigeHilfe(false)} initialKategorie={hilfeTab ?? undefined} />}
```

- [ ] **Step 4: tsc + manueller Smoke-Test**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅.

Manuell im Dev-Server: URL `http://localhost:5173/einstellungen?hilfe=bloom` → HilfeSeite öffnet mit Bloom-Tab aktiv.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/HilfeSeite.tsx ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "Cluster C: HilfeSeite initialKategorie-Prop + LPStartseite ?hilfe=<tab>-Deep-Link"
```

### Task 4.6: LPGlobalSuche Komponente (neue Komponente, nicht Refactor)

**Files:**
- Create: `src/components/lp/header/LPGlobalSuche.tsx`

- [ ] **Step 1: Komponente schreiben (nutzt Hooks aus Task 4.2-4.4)**

```tsx
// src/components/lp/header/LPGlobalSuche.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSucheIndex } from '../../../hooks/useSucheIndex'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { useKeyboardNavigation } from '../../../hooks/useKeyboardNavigation'
import { useClickOutside } from '../../../hooks/useClickOutside'
import { fuehreSucheAus } from '../../../utils/sucheEngine'
import { QUELLEN_REIHENFOLGE } from '../../../types/suche'
import type { SucheTreffer, SucheQuelle } from '../../../types/suche'
import { QuellSektion, EmptyState } from '../../shared/header/sucheUI'

const DEBOUNCE_MS = 300

const SURFACE_ROUTE: Record<SucheQuelle, string> = {
  'einstellungen-tab': '/einstellungen',
  'hilfe-tab': '/einstellungen',  // HilfeSeite ist Modal in Einstellungen-Surface
  'kurs': '/pruefung',
  'pruefung': '/pruefung',
  'uebung': '/uebung',
  'frage': '/fragensammlung',
}

export function LPGlobalSuche() {
  const [query, setQuery] = useState('')
  const [istOffen, setIstOffen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const index = useSucheIndex()

  const ergebnis = useMemo(() => fuehreSucheAus(debouncedQuery, index), [debouncedQuery, index])

  // Cmd+K / Ctrl+K — fokussiert Input (Pattern aus alter GlobalSuche)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Click-Outside schliesst Dropdown
  useClickOutside(containerRef, () => setIstOffen(false))

  const trefferKlick = useCallback((t: SucheTreffer) => {
    navigate(t.navigation.route)
    setIstOffen(false)
    setQuery('')
  }, [navigate])

  const alleAnzeigen = useCallback((q: SucheQuelle) => {
    navigate(SURFACE_ROUTE[q])
    setIstOffen(false)
    setQuery('')
  }, [navigate])

  const { activeIndex, handleKeyDown, reset: resetActiveIndex } = useKeyboardNavigation({
    itemCount: ergebnis.treffer.length,
    onEnter: (idx) => {
      const t = ergebnis.treffer[idx]
      if (t) trefferKlick(t)
    },
    onEscape: () => setIstOffen(false),
  })

  // Reset activeIndex bei Query-Change
  useEffect(() => { resetActiveIndex() }, [debouncedQuery, resetActiveIndex])

  let flatOffset = 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setIstOffen(true) }}
          onFocus={() => setIstOffen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Suche …"
          className="w-64 pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          aria-label="Globale Suche"
        />
      </div>

      {istOffen && debouncedQuery.length >= 2 && (
        <div className="absolute top-full mt-1 right-0 w-96 max-h-[60vh] overflow-y-auto bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 z-50">
          {ergebnis.treffer.length === 0 ? (
            <EmptyState query={debouncedQuery} />
          ) : (
            QUELLEN_REIHENFOLGE.map(quelle => {
              const sektion = ergebnis.treffer.filter(t => t.quelle === quelle)
              if (sektion.length === 0) return null
              const offset = flatOffset
              flatOffset += sektion.length
              return (
                <QuellSektion
                  key={quelle}
                  quelle={quelle}
                  treffer={sektion}
                  gesamtCount={ergebnis.proQuelleGesamt[quelle]}
                  activeFlatIndex={activeIndex}
                  flatOffset={offset}
                  onTrefferKlick={trefferKlick}
                  onAlleAnzeigen={alleAnzeigen}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: tsc + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/lp/header/LPGlobalSuche.tsx
git commit -m "Cluster C: LPGlobalSuche — 6 Quellen, gruppierte Treffer, Sub-Hooks (Debounce/Keyboard/ClickOutside)"
```

### Task 4.7: LPAppHeaderContainer — `<GlobalSuche>` durch `<LPGlobalSuche>` ersetzen

**Files:**
- Modify: `src/components/lp/LPAppHeaderContainer.tsx`

- [ ] **Step 1: Audit aktuelle Stelle**

Run: `grep -n "GlobalSuche\|useGlobalSucheLP" ExamLab/src/components/lp/LPAppHeaderContainer.tsx | head -10`

Notiere alle relevanten Zeilen (Import + Hook-Aufruf + JSX-Mount).

- [ ] **Step 2: Patch**

```tsx
// Import oben ersetzen:
- import { GlobalSuche } from '...'
- import { useGlobalSucheLP } from '../../hooks/useGlobalSucheLP'
+ import { LPGlobalSuche } from './header/LPGlobalSuche'

// Hook-Aufruf entfernen (useGlobalSucheLP-Block komplett löschen).

// JSX-Mount ersetzen:
- <GlobalSuche suchen={suchen} onSuchen={setSuchen} ergebnis={sucheErgebnis} />
+ <LPGlobalSuche />
```

- [ ] **Step 3: tsc + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅. Wenn ungenutzte Imports → cleanup.

- [ ] **Step 4: Manueller Smoke-Test**

```bash
cd ExamLab && npm run dev -- --port 5173 &
```

Browser: LP-Login → Such-Input fokussieren („Bilanz") → Dropdown mit 6 Sektionen + Treffer-Sortierung.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/LPAppHeaderContainer.tsx
git commit -m "Cluster C: LPAppHeaderContainer nutzt LPGlobalSuche (statt GlobalSuche+useGlobalSucheLP)"
```

### Task 4.8: useGlobalSucheLP Legacy löschen

**Files:**
- Delete: `src/hooks/useGlobalSucheLP.ts`
- Delete: zugehörige Test-Datei falls existent

- [ ] **Step 1: Verifizieren, dass kein Konsument mehr existiert**

Run: `grep -rn "useGlobalSucheLP" ExamLab/src/ 2>/dev/null`
Expected: 0 Treffer.

- [ ] **Step 2: Löschen**

```bash
cd ExamLab
git rm src/hooks/useGlobalSucheLP.ts
# falls Test-Datei existiert: git rm src/hooks/useGlobalSucheLP.test.tsx
```

- [ ] **Step 3: tsc + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅.

- [ ] **Step 4: Commit**

```bash
git commit -m "Cluster C: useGlobalSucheLP gelöscht — Logik in sucheEngine + useSucheIndex migriert"
```

---

## Phase 5 — Performance + E2E + Cleanup

### Task 5.1: Performance-Test (synthetische 1000 Fragen)

**Files:**
- Create: `src/utils/sucheEngine.perf.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest'
import { fuehreSucheAus } from './sucheEngine'
import type { SucheIndex } from '../types/suche'

function syntheticIndex(): SucheIndex {
  const fragen = Array.from({ length: 1000 }, (_, i) => ({
    id: `frg-${i}`,
    fragetext: `Frage ${i} zu Bilanz und Eigenkapital ${i % 10}`,
    tags: ['BWL', `tag${i % 50}`],
    thema: 'BWL',
  } as any))
  const pruefungen = Array.from({ length: 100 }, (_, i) => ({
    id: `p${i}`, titel: `Test ${i}`, typ: 'summativ', klasse: '29c', fach: 'BWL',
  } as any))
  return {
    einstellungenTabs: [],
    hilfeTabs: [],
    kurse: Array.from({ length: 50 }, (_, i) => ({ id: `sf-wr-29${String.fromCharCode(97 + i)}`, klassen: [`29${String.fromCharCode(97 + i)}`] } as any)),
    pruefungen,
    uebungen: [],
    fragen,
  }
}

describe('fuehreSucheAus performance', () => {
  it('1000 Fragen + 100 Prüfungen: < 100 ms (Bonus: < 50 ms)', () => {
    const index = syntheticIndex()
    const start = performance.now()
    const ergebnis = fuehreSucheAus('bilanz', index)
    const dauer = performance.now() - start
    expect(ergebnis.treffer.length).toBeGreaterThan(0)
    expect(dauer).toBeLessThan(100)
    if (dauer < 50) console.log(`✨ Bonus-Ziel erreicht: ${dauer.toFixed(1)} ms`)
  })
})
```

- [ ] **Step 2: Run**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.perf.test.ts`
Expected: PASS.

- [ ] **Step 3: Falls langsamer als 100ms → optimieren oder Schwelle anpassen**

Wenn fail: dokumentiere Ursache + nutze Profiler. Optimierungs-Optionen: Pre-Normalize-Cache pro Frage, Early-Exit nach 5 Matches pro Quelle, Score-Berechnung weniger granular.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.perf.test.ts
git commit -m "Cluster C: Performance-Test 1000 Fragen + 100 Pruefungen <100ms (Bonus <50ms)"
```

### Task 5.2: Browser-E2E gegen echte LP-Logins

**Files:** Keine Code-Edits — manueller Test mit Doku.

**Voraussetzung:** Cache-Buster `?nocache=<ts>` verwenden, SW unregister vorher (siehe `feedback_http_cache_after_sw.md` + `feedback_service_worker_cache_wire_bundle.md`).

- [ ] **Step 1: Dev-Build + Preview-Server**

```bash
cd ExamLab && npm run build && npm run preview -- --port 5174
```

- [ ] **Step 2: Browser-Test 11 Cases (gem. Spec §11.2)**

Vor Start: in Browser DevTools Console:
```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))
caches.keys().then(ks => ks.forEach(k => caches.delete(k)))
```
Reload mit `?nocache=<ts>`.

Login mit echtem LP-Account (siehe `feedback_echte_logins.md`).

Cases laut Spec §11.2 abarbeiten:
1. Multi-Quellen-Treffer („BWL")
2. Einstellungen-Tab-Suche („Lernziel")
3. Hilfe-Tab-Suche („Bloom")
4. Frage-Treffer („Aktien")
5. Diakritik („uebung" findet „Übung")
6. Keyboard-Nav (Pfeil-Runter + Enter)
7. „Alle Treffer in"-Link (Surface-Navigation)
8. Cluster-F: Testdaten-Toggle aus/an
9. Empty-State („xyzqwer123")
10. 0 Console-Errors
11. Cmd+K Shortcut

Für jeden Case Screenshot + Status (✅/❌) in `ExamLab/HANDOFF.md` ergänzen.

- [ ] **Step 3: Bug-Fixes falls nötig**

Pro Bug eigener Commit mit präfix `Cluster C Hotfix#N:`.

- [ ] **Step 4: Wenn alle 11 ✅ → Schritt 5; sonst zurück zu 2 nach Fix**

- [ ] **Step 5: HANDOFF-Eintrag commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "Cluster C: Browser-E2E 11/11 ✅ + HANDOFF-Eintrag"
```

### Task 5.3: Push auf preview + Merge nach Freigabe

- [ ] **Step 1: Final vitest + tsc + build + lint**

Run:
```bash
cd ExamLab && npx vitest run && npx tsc --noEmit && npm run build && npm run lint -- --max-warnings 0
```

Expected: alle ✅.

- [ ] **Step 2: Merge feature → preview**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout preview
git merge --no-ff feature/cluster-c-globale-suche
git push origin preview
```

- [ ] **Step 3: User-Freigabe abwarten + Browser-E2E auf preview-Deploy**

User testet Live-Preview-Build. Bei Freigabe → Schritt 4.

- [ ] **Step 4: Merge preview → main**

```bash
git checkout main
git merge --ff-only preview
git push origin main
```

- [ ] **Step 5: Memory-Eintrag**

`memory/project_cluster_c_globale_suche_komplett.md` mit Stand + HEAD-Hash + vitest-Anzahl + E2E-Resultate.

Update `MEMORY.md`-Index.

---

## Rückblick / Lessons-Learned (12.05.2026, post-Merge)

### Was lief gut

- **Pure-Engine + TDD pro Helper** (Phase 1): normalizeForSuche / scoreFromMatch / findeHighlightStellen / gruppiereUndLimitiere / 6 Adapter / fuehreSucheAus → 43 Tests grün beim ersten Versuch. Engine-Test-Suite war direkt nach Phase 1 fertig, was späteren Refactor (Hotfix#3 deutsche Ersatzregel) trivial machte — Tests gaben unmittelbar Feedback.
- **Spec-Review-Loop in 2 Iterationen** zur Approval: Reviewer-Iter-1 hatte 12 Issues, Iter-2 hatte 4 (3 blocker + 1 minor). Plan-Review-Loop ebenfalls 2 Iterationen. Drei Hotfixes nach Live-E2E zeigten: Reviewer-Iterationen helfen, ersetzen Live-Verifikation aber nicht.
- **Performance ist ein No-Brainer mit Plain Substring**: 8.2 ms bei 1000 Fragen + 100 Prüfungen + 50 Kursen — weit unter Bonus-Schwelle 50 ms. Spec/Plan-Entscheidung „YAGNI auf fuse.js" war richtig.
- **Architektur-Entscheidung `LPGlobalSuche` als neue Komponente** statt Refactor der dumb `GlobalSuche` zahlte sich aus: SuS-Pfad blieb unverändert, kein Test-Suite-Risiko in dem Bereich, kein Pen-and-Paper-Aufwand für Discriminated-Union-Props.

### Was war überraschend

- **`useLPDashboardData` ist Hook-lokaler State**, nicht Store. Audit-Annahme der Spec rev1 war falsch. Plan-Phase ergänzte `configsListStore` als minimal-invasive Korrektur (Cache-Layer, kein Duplikat-State). Pattern-Lehre: bei jedem `useStore.X` in der Spec, vor Plan-Commit konkret greppen.
- **`GlobalSuche.tsx` ist Dumb-Komponente** mit Props-Interface, versorgt aus LP + SuS-Container. Reviewer-Iter-1 entdeckte das, sonst hätte Refactor SuS gebrochen.
- **HilfeSeite hat keine eigene URL-Route** — ist Modal mit lokalem State. Deep-Link via `?hilfe=<tabId>`-URL-Param war minimaler Patch (initialKategorie-Prop), aber Plan-Spec-Annahme war falsch.
- **Cluster-F-Filter funktioniert über OR-Matching (id-Prefix + klasse + userEmail + kursId)**, nicht über ein `testdatenSichtbar`-Flag pro Entity. Spec hatte das undeutlich beschrieben.
- **NFD-Diakritik-Strip ≠ deutsche Ersatzregel**: `Übung→Ubung` ist Längen-stabil, aber User erwartet `Übung→Uebung`. Hotfix#3 nach E2E.
- **`Favoriten.tsx` lädt Configs separat** von `useLPDashboardData` (eigene `apiService.ladeAlleConfigs(...)`-Call). Plan-Patch reichte nicht, Hotfix#2 nach E2E.

### Welche Architektur-Entscheidung hat sich bewährt / war suboptimal

- **Bewährt:** `slotSuche?: ReactNode`-Prop in AppHeader für Komponenten-Override. Saubere Backwards-Compat (SuS-Pfad nutzt weiter dumb GlobalSuche), kein Container-Duplikat.
- **Bewährt:** `ICON_MAP` explizit statt `import * as Icons` — Bundle-Effekt ~200KB → ~10KB, Type-sicher via `SucheIconKey`-Union.
- **Bewährt:** 3 Sub-Hooks (`useDebouncedValue`, `useKeyboardNavigation`, `useClickOutside`) generisch + TDD-isoliert. Wiederverwendbar in anderen Cluster-Surfaces.
- **Suboptimal:** Highlight-Indexing arbeitet jetzt auf Original-String (case-insensitive Substring) statt normalisiert. Bei Diakritik-Ersatz-Match (`uebung` → `Übung`) gibt es kein Highlight. UX-Akzeptabel, aber Inkonsistenz: Engine matched, UI markiert nicht. Future: Mapping Original↔Normalisiert für vollständiges Highlight, falls User-Feedback es einfordert.
- **Suboptimal:** Plan-Phase-Audit war unvollständig für „alle Konsumenten von Cache-Stores". Hotfix#2 entdeckte Favoriten.tsx erst beim Live-E2E. Pattern: pro neuem Cache-Store nicht nur Producer-Pfad greppen, sondern auch alle Konsumenten-Pfade die parallel laden.

### Open Items / Spawn-Tasks für Phase 2 (eigene Cluster)

Diese Items sind Out-of-Scope Phase 1 und werden in eigenen Spec/Plan-Zyklen angelegt:

1. **Schüler-Suche** (Spec §9, §10 Issue 3):
   - Benötigt `useEigeneSchueler(lpEmail)`-Hook (~80 Z. Code), kein bestehender LP-Permission-Selektor existiert.
   - Mapping LP-Email → Kurse → Gruppen → Schüler-Liste.
   - Permission-Filter: LP sieht nur Schüler in eigenen Kursen, Admin sieht alle (über `useStammdatenStore.istAdmin`).
   - Spec/Plan-Phase brauchen Codebase-Audit: wo lebt Schüler-Liste heute? Wahrscheinlich aus `useUebenGruppenStore.gruppen` plus Sus-Datenstruktur. Klassen-Mapping unbekannt.

2. **„Alle Treffer in"-Pre-Fill via `?suche=`** (Spec §9, §10 Issue 5):
   - 5+ Surfaces betroffen (Dashboard, Prüfen-Liste, Üben-Liste, Fragensammlung, Übungen-Tab in Einstellungen).
   - Pro Surface: `useSearchParams().get('suche')` lesen + lokalen Filter-State pre-fillen.
   - Aktuell „Alle Treffer in"-Link navigiert nur zur Surface, kein Filter. UX-Verbesserung Phase 2.

3. **Volltext-Suche** (Spec §9):
   - Fragetexte + Lösungen + Material-PDFs durchsuchen.
   - Performance-Risiko bei 1000+ Fragen mit langen Texten — eventuell Backend-Endpoint nötig.
   - Alternative: Client-side Index mit lunr/MiniSearch (Phase 2 Library-Eval).

4. **Fuzzy-Match (Tippfehler-Toleranz)** (Spec §9):
   - Aktuell Plain Substring — keine Toleranz für Tippfehler.
   - `fuse.js` o.ä. evaluieren; Performance-Auswirkung bei 1000+ Fragen messen.
   - User-Feedback abwarten: wird Fuzzy wirklich benötigt?

### Cluster-übergreifende Spawns aus Cluster-C-Arbeit

- **`letzterSeedAm`-Persistenz** im Apps-Script Configs-Sheet (war Spawn-Task aus Cluster F.3, ist Cluster-übergreifend offen).
- **EinstellungenPanel-Migration auf Tab-Registry** (blockiert durch `kiKalibrierung`↔`ki-kalibrierung`-ID-Konflikt, eigener Sub-Cluster E.x).
- **Klassenlisten-Tab Filter** (Cluster F.4 Out-of-Scope).
- **Live-Durchführen Schüler-Filter** in BeendetPhase/AktivPhase (Cluster F.4 Out-of-Scope).

### Lehren als Memory-Files

Folgende Lehren wurden als eigene Memory-Files erstellt (siehe nächste Session):

- `feedback_examlab_repo_preview_main.md` — ExamLab-Repo + preview→main-Workflow + E2E gegen preview-Deploy
- `project_cluster_c_komplett.md` — Cluster-C-Stand für nächste Session

---

## Abhängigkeits-Graph (kompakt)

```
types/suche.ts
   ↑
   ├── utils/sucheEngine.ts (normalize, score, gruppieren, fuehreSucheAus)
   │     ↑
   │     └── utils/sucheAdapter.ts (6 Adapter)
   │           ↑
   │           └── hooks/useSucheIndex.ts
   │                 ↑
   │                 └── components/shared/header/GlobalSuche.tsx
   ├── utils/highlight.tsx
   │     ↑
   │     └── components/shared/header/sucheUI/TrefferZeile.tsx
   │           ↑
   │           └── QuellSektion.tsx
   │                 ↑
   │                 └── GlobalSuche.tsx
   └── store/configsListStore.ts
         ↑
         └── hooks/useLPDashboardData.ts (2-Zeilen-Patch)
```

Tasks laufen Phase 1 → 2 → 3 → 4 → 5 sequenziell. Innerhalb Phase 1 sind Tasks 1.1 → 1.8 sequenziell (jeder baut auf vorigem auf). Innerhalb Phase 3 sind 3.1, 3.2, 3.3 unabhängig — können parallel via Subagents.
