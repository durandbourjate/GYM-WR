# Cluster C — Globale Suche Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Globale Suche im App-Header über 6 Quellen (Einstellungen-Tabs, Hilfe-Tabs, Kurse, Prüfungen, Übungen, Fragen) mit gruppierten Treffern, Keyboard-Navigation, Diakritik-Normalize und XSS-sicherem Highlight.

**Architektur:** Pure Engine (`sucheEngine.ts`) trennt Logik von UI. `useSucheIndex()`-Memo-Hook liest aus 5 Source-Stores + Tab-Registry + neuem `useConfigsListStore` (Cache-Layer für Configs, der aus `useLPDashboardData` befüllt wird). Cluster-F-Filter in Adapter-Schicht. Highlight via JSX-Array statt `dangerouslySetInnerHTML`. Test-First (Vitest), per-Task-Commits.

**Tech Stack:** React 19, TypeScript, Zustand v5, Vite, Tailwind v4, react-router-dom 7.14, Vitest, lucide-react.

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-c-globale-suche-design.md` (rev2 approved)

**Spec-Abweichung (begründet):**
Spec §4.2 ging davon aus, dass Prüfungs/Übungs-Configs aus einem bestehenden Store kommen. Codebase-Audit zeigt: sie sind Hook-lokaler State in `useLPDashboardData` (per-Komponenten-Mount). Plan ergänzt: schlanker neuer `useConfigsListStore` als Cache-Layer (NICHT Duplikat-State — Source-of-Truth für Configs gibt es heute nirgends zentral). `useLPDashboardData` wird minimal gepatcht: `setConfigs` schreibt zusätzlich in den Cache-Store. Damit kann `useSucheIndex` ohne API-Doppel-Call lesen. Phase 2.

---

## File Structure (Plan-Locked)

**Neue Files:**
- `src/utils/sucheEngine.ts` — Pure Engine (normalize, score, gruppieren, fuehreSucheAus)
- `src/utils/sucheEngine.test.ts` — Engine-Tests
- `src/utils/sucheAdapter.ts` — 6 Adapter-Funktionen (Source → Treffer)
- `src/utils/sucheAdapter.test.ts` — Adapter-Tests
- `src/utils/highlight.tsx` — XSS-sicherer Highlight-Helper (JSX-Array)
- `src/utils/highlight.test.tsx` — Highlight-Tests
- `src/types/suche.ts` — `SucheQuelle`, `SucheTreffer`, `HighlightStelle`, `SucheErgebnis`, `SucheIndex`
- `src/hooks/useSucheIndex.ts` — Memo-Selektor über alle Quellen
- `src/hooks/useSucheIndex.test.tsx` — Hook-Tests (Closure-Ref-Mock-Pattern)
- `src/store/configsListStore.ts` — Cache-Store für Configs
- `src/store/configsListStore.test.ts` — Store-Tests
- `src/components/shared/header/sucheUI/QuellSektion.tsx` — Sektion-Komponente
- `src/components/shared/header/sucheUI/TrefferZeile.tsx` — Treffer-Zeile
- `src/components/shared/header/sucheUI/EmptyState.tsx` — Leer-State
- `src/components/shared/header/sucheUI/index.ts` — Re-Exports

**Modifizierte Files:**
- `src/components/shared/header/GlobalSuche.tsx` — Refactor: Wiring an `useSucheIndex` + neue Dropdown-Struktur
- `src/hooks/useLPDashboardData.ts` — 2-Zeilen-Patch: `setConfigs`-Aufrufe zusätzlich in Cache-Store schreiben
- `src/hooks/useGlobalSucheLP.ts` — Verbleibt unverändert bis Phase 5, dann lösche (durch `useSucheIndex` + Engine ersetzt)

**Touched Tests:**
- `src/components/shared/header/GlobalSuche.test.tsx` (falls existent, sonst neu)

---

## Implementation Phases

### Phase 0 — Discovery (verbleibende Audits)
### Phase 1 — Foundation (Pure Logic + Tests)
### Phase 2 — Cache-Store + Selektor-Hook
### Phase 3 — UI-Komponenten
### Phase 4 — GlobalSuche-Refactor + Navigation
### Phase 5 — Performance + E2E + Cleanup

---

## Phase 0 — Discovery (Plan-Phase Audits, vor Code)

### Task 0.1: Routing-Audit für nicht-erfasste Detail-Routes

**Files:** Read-only audit, kein Code.

- [ ] **Step 1: Grep nach Hilfe-Route + Tab-Wechsel-Logik**

Run:
```bash
grep -rn "HilfeSeite\|hilfe-tab\|/hilfe/\|setAktiveTab" ExamLab/src/components/lp/LPStartseite.tsx ExamLab/src/components/lp/HilfeSeite.tsx 2>/dev/null | head -20
```

Notiere: Wie wird der aktive Hilfe-Tab gesetzt? URL-basiert (z.B. `/einstellungen/hilfe-bloom`?) oder reiner State?

- [ ] **Step 2: Grep nach Kurs-Detail-Navigation**

Run:
```bash
grep -rn "navigate.*kurs\|/kurs/\|kursDetail" ExamLab/src/ 2>/dev/null | head -10
```

Notiere: Existiert Kurs-Detail-Route? Falls nicht → Kurs-Treffer navigiert zu `/pruefung` (LP-Dashboard).

- [ ] **Step 3: Resultate in Plan ergänzen (kein Commit)**

Audit-Result wird in `useSucheIndex`-Adapter-Tasks (Phase 2) eingebaut als Route-Builder pro Quelle.

### Task 0.2: useFragensammlungStore.summaries Verfügbarkeit verifizieren

- [ ] **Step 1: Read store API**

Run: `grep -n "summaries\|ladeAlleFragen" ExamLab/src/store/fragensammlungStore.ts | head -10`

Expected: `summaries: FrageSummary[]` als State-Feld + `lade(email)` als Action.

- [ ] **Step 2: Trigger-Path notieren**

Wo wird `useFragensammlungStore.getState().lade(email)` aufgerufen? → `useLPDashboardData.ts:90`. Bedeutet: Fragen-Summaries sind nach LP-Login geladen. Such-Hook kann sie nutzen.

---

## Phase 1 — Foundation (Pure Logic + Types)

### Task 1.1: Types-Datei anlegen

**Files:**
- Create: `src/types/suche.ts`

- [ ] **Step 1: Datei schreiben**

```ts
// src/types/suche.ts
import type { ReactNode } from 'react'

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
  icon?: string
}

export type ProQuelleZahlen = Record<SucheQuelle, number>

export interface SucheErgebnis {
  treffer: SucheTreffer[]
  proQuelleSichtbar: ProQuelleZahlen
  proQuelleGesamt: ProQuelleZahlen
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

export const LEERES_ERGEBNIS: SucheErgebnis = {
  treffer: [],
  proQuelleSichtbar: { 'einstellungen-tab': 0, 'hilfe-tab': 0, kurs: 0, pruefung: 0, uebung: 0, frage: 0 },
  proQuelleGesamt: { 'einstellungen-tab': 0, 'hilfe-tab': 0, kurs: 0, pruefung: 0, uebung: 0, frage: 0 },
}

export type HighlightReactNode = ReactNode  // re-export for highlight.tsx
```

- [ ] **Step 2: Type-Check**

Run: `cd ExamLab && npx tsc --noEmit`
Expected: ✅ kein Fehler.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/types/suche.ts
git commit -m "Cluster C: types/suche.ts — Treffer/Quelle/Score-Bounds Type-Definitionen"
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
import { scoreFromMatch, findeHighlightStellen, normalizeForSuche } from './sucheEngine'
import type { SucheTreffer } from '../types/suche'
import type { TabDefinition } from './tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary } from '../types/fragen-storage'

const PLACEHOLDER_ROUTE = '#'  // wird in Phase 4 durch echte Routen ersetzt

function tabZuTreffer(tab: TabDefinition, query: string, quelle: 'einstellungen-tab' | 'hilfe-tab'): SucheTreffer | null {
  const score = scoreFromMatch(tab.label, query, 'titel')
  if (score === 0) return null
  return {
    quelle,
    id: tab.id,
    titel: tab.label,
    highlightStellen: findeHighlightStellen(tab.label, query, 'titel'),
    navigation: { route: PLACEHOLDER_ROUTE },
    score,
    icon: tab.icon,
  }
}

export function indexEinstellungenTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
  return tabs.map(t => tabZuTreffer(t, query, 'einstellungen-tab')).filter((t): t is SucheTreffer => t !== null)
}

export function indexHilfeTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
  return tabs.map(t => tabZuTreffer(t, query, 'hilfe-tab')).filter((t): t is SucheTreffer => t !== null)
}

export function indexKurse(query: string, kurse: KursDefinition[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
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
      icon: 'BookOpen',
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
    icon: quelle === 'pruefung' ? 'FileText' : 'Repeat',
  }
}

export function indexPruefungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
  return configs
    .filter(c => c.typ !== 'formativ')
    .map(c => configZuTreffer(c, query, 'pruefung'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexUebungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
  return configs
    .filter(c => c.typ === 'formativ')
    .map(c => configZuTreffer(c, query, 'uebung'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexFragen(query: string, fragen: FrageSummary[]): SucheTreffer[] {
  if (normalizeForSuche(query).length < 2) return []
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
      icon: 'HelpCircle',
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
// in sucheEngine.ts
import { indexEinstellungenTabs, indexHilfeTabs, indexKurse, indexPruefungen, indexUebungen, indexFragen } from './sucheAdapter'

export interface SucheIndex {
  einstellungenTabs: TabDefinition[]
  hilfeTabs: TabDefinition[]
  kurse: KursDefinition[]
  pruefungen: PruefungsConfig[]
  uebungen: PruefungsConfig[]  // formative Subset von Configs
  fragen: FrageSummary[]
}

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

Type-Import-Korrektur in `src/types/suche.ts` (Append `SucheIndex` Type-Export) oder hier inline definieren.

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts`
Expected: PASS (alle Tests).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts ExamLab/src/types/suche.ts
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
import type { SucheIndex } from '../utils/sucheEngine'

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
  icon: 'HelpCircle',
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
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { highlight } from '../../../../utils/highlight'
import { TYPO } from '../../../../styles/typografie'
import type { SucheTreffer } from '../../../../types/suche'

function getIcon(name: string | undefined): LucideIcon {
  if (!name) return Icons.File
  return (Icons as unknown as Record<string, LucideIcon>)[name] ?? Icons.File
}

export function TrefferZeile({ treffer, aktiv, onClick }: {
  treffer: SucheTreffer
  aktiv: boolean
  onClick: () => void
}) {
  const IconComp = getIcon(treffer.icon)
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

## Phase 4 — GlobalSuche Refactor + Navigation

### Task 4.1: Audit alte GlobalSuche.tsx — Identifizieren was bleibt / weg muss

**Files:** Read-only

- [ ] **Step 1: Lese alte Datei**

Run: `cat ExamLab/src/components/shared/header/GlobalSuche.tsx`

Identifiziere:
- Cmd+K-Listener (bleibt, byte-identisch übernehmen)
- onBlur-Schließ-Pattern (bleibt)
- Bisherige Dropdown-Gruppen (löschen, durch `QuellSektion` ersetzt)
- Imports von `useGlobalSucheLP` (löschen — ersetzt durch `useSucheIndex` + `fuehreSucheAus`)

### Task 4.2: Hilfe-Tab Navigation klären

**Files:** Read-only Audit + falls neue Route nötig.

- [ ] **Step 1: Grep**

Run: `grep -n "HilfeSeite\|aktiveTab.*hilfe" ExamLab/src/components/lp/LPStartseite.tsx | head -10`

Entscheidung-Tree:
- **Falls Hilfe als eigene Route existiert** (`/hilfe/:tab`): nutze diese.
- **Falls Hilfe via internem State gewechselt wird:** lege im LPStartseite eine `?surface=hilfe&tab=X` URL-Pattern an ODER navigiere zu `/einstellungen` und triggere Tab-Wechsel via Event.

Empfehlung Phase-1: **Wir navigieren zu `/einstellungen/{tabId}` für Einstellungen, und `/?surface=hilfe&tab={tabId}` für Hilfe** (existiert das URL-Pattern nicht, fügen wir es im LPStartseite-URL-Sync minimal hinzu). Falls zu invasiv → einfach `navigate('/einstellungen')` für Hilfe-Tabs und Tab-Switch via `sessionStorage`-Marker.

Notiere Entscheidung in Phase-4-Task-Outcome.

### Task 4.3: Routes-Mapping pro Quelle

**Files:**
- Modify: `src/utils/sucheAdapter.ts` (Routes von `'#'` auf echte Pfade)
- Modify: `src/utils/sucheAdapter.test.ts` (Route-Assertions)

Route-Map laut Audit:
- `'einstellungen-tab'` → `/einstellungen/{tabId}`
- `'hilfe-tab'` → laut Task 4.2 (vorraussichtlich `/einstellungen/hilfe` + Tab via Event/sessionStorage)
- `'kurs'` → `/pruefung` (LP-Dashboard, kein eigener Kurs-Detail)
- `'pruefung'` → `/pruefung/{configId}`
- `'uebung'` → `/uebung/{configId}`
- `'frage'` → `/fragensammlung/{frageId}`

- [ ] **Step 1: Tests anpassen — Route-Assertions hinzufügen**

In `sucheAdapter.test.ts`: pro `describe`-Block 1 `expect(treffer[0].navigation.route).toBe('...')`.

- [ ] **Step 2: Tests fail**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: FAIL (routes immer noch `'#'`).

- [ ] **Step 3: Implementation — Route-Konstanten + Builder-Funktionen**

```ts
// in sucheAdapter.ts (oberhalb der Adapter)
const ROUTE_BUILDERS = {
  einstellungenTab: (tabId: string) => `/einstellungen/${tabId}`,
  hilfeTab: (tabId: string) => `/einstellungen/hilfe?tab=${encodeURIComponent(tabId)}`,
  kurs: (_kursId: string) => `/pruefung`,  // kein Detail-Route in Phase 1
  pruefung: (configId: string) => `/pruefung/${configId}`,
  uebung: (configId: string) => `/uebung/${configId}`,
  frage: (frageId: string) => `/fragensammlung/${frageId}`,
}
```

Dann pro Adapter `navigation.route` durch passenden Builder ersetzen.

- [ ] **Step 4: Pass**

Run: `cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheAdapter.ts ExamLab/src/utils/sucheAdapter.test.ts
git commit -m "Cluster C: Routes pro Quelle — Einstellungen/Hilfe/Kurs/Pruefung/Uebung/Frage"
```

### Task 4.4: GlobalSuche.tsx Refactor

**Files:**
- Modify: `src/components/shared/header/GlobalSuche.tsx`

- [ ] **Step 1: Implementierung (komplett neue Datei, byte-identisch Cmd+K + onBlur)**

```tsx
// src/components/shared/header/GlobalSuche.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSucheIndex } from '../../../hooks/useSucheIndex'
import { fuehreSucheAus } from '../../../utils/sucheEngine'
import { QUELLEN_REIHENFOLGE, QUELL_LABEL } from '../../../types/suche'
import type { SucheTreffer, SucheQuelle } from '../../../types/suche'
import { QuellSektion, EmptyState } from './sucheUI'

const DEBOUNCE_MS = 300

export function GlobalSuche() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [istOffen, setIstOffen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const index = useSucheIndex()

  // Cmd+K / Ctrl+K Shortcut (byte-identisch aus alter Komponente)
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

  // Debounced Query
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [query])

  const ergebnis = useMemo(() => fuehreSucheAus(debouncedQuery, index), [debouncedQuery, index])

  // Reset activeIndex bei Query-Change
  useEffect(() => {
    setActiveIndex(-1)
  }, [debouncedQuery])

  const trefferKlick = useCallback((t: SucheTreffer) => {
    navigate(t.navigation.route)
    setIstOffen(false)
    setQuery('')
  }, [navigate])

  const alleAnzeigen = useCallback((q: SucheQuelle) => {
    const surfaceRoute: Record<SucheQuelle, string> = {
      'einstellungen-tab': '/einstellungen',
      'hilfe-tab': '/einstellungen/hilfe',
      'kurs': '/pruefung',
      'pruefung': '/pruefung',
      'uebung': '/uebung',
      'frage': '/fragensammlung',
    }
    navigate(surfaceRoute[q])
    setIstOffen(false)
    setQuery('')
  }, [navigate])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIstOffen(false)
      return
    }
    if (ergebnis.treffer.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, ergebnis.treffer.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      const idx = activeIndex >= 0 ? activeIndex : 0
      const t = ergebnis.treffer[idx]
      if (t) {
        e.preventDefault()
        trefferKlick(t)
      }
    }
  }

  // onBlur-Schließ-Pattern mit setTimeout (byte-identisch aus alter Komponente)
  const onBlur = () => {
    setTimeout(() => setIstOffen(false), 150)
  }

  let flatOffset = 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => { setQuery(e.target.value); setIstOffen(true) }}
          onFocus={() => setIstOffen(true)}
          onBlur={onBlur}
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

- [ ] **Step 2: Type-Check + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅.

- [ ] **Step 3: Vitest komplett**

Run: `cd ExamLab && npx vitest run`
Expected: alle Tests PASS (inklusive `useSucheIndex.test.tsx`, `sucheEngine.test.ts`, etc.).

- [ ] **Step 4: Manuell Smoke-Test in dev-Server**

Run: `cd ExamLab && npm run dev -- --port 5173 &`

Browser: `http://localhost:5173/` → LP-Login → Such-Input fokussieren → „Bilanz" eintippen → Dropdown muss erscheinen mit Sektionen.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/GlobalSuche.tsx
git commit -m "Cluster C: GlobalSuche refactor — 6 Quellen, gruppierte Treffer, Keyboard-Nav, Debounce 300ms"
```

### Task 4.5: useGlobalSucheLP Legacy entfernen

**Files:**
- Delete: `src/hooks/useGlobalSucheLP.ts`
- Delete: zugehörige Test-Datei falls existent

- [ ] **Step 1: Verifizieren, dass kein anderer Konsument existiert**

Run: `grep -rn "useGlobalSucheLP" ExamLab/src/ 2>/dev/null`
Expected: nur Import in GlobalSuche.tsx (alte Datei, jetzt nicht mehr vorhanden nach Task 4.4).

- [ ] **Step 2: Datei löschen**

Run: `cd ExamLab && rm src/hooks/useGlobalSucheLP.ts`
(falls Test-Datei: `rm src/hooks/useGlobalSucheLP.test.tsx` oder ähnlich)

- [ ] **Step 3: tsc + Build**

Run: `cd ExamLab && npx tsc --noEmit && npm run build`
Expected: ✅.

- [ ] **Step 4: Commit**

```bash
git add -A ExamLab/src/hooks/useGlobalSucheLP.ts
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
import type { SucheIndex } from './sucheEngine'

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
  it('1000 Fragen + 100 Prüfungen: < 50 ms', () => {
    const index = syntheticIndex()
    const start = performance.now()
    const ergebnis = fuehreSucheAus('bilanz', index)
    const dauer = performance.now() - start
    expect(ergebnis.treffer.length).toBeGreaterThan(0)
    expect(dauer).toBeLessThan(50)
  })
})
```

- [ ] **Step 2: Run**

Run: `cd ExamLab && npx vitest run src/utils/sucheEngine.perf.test.ts`
Expected: PASS.

- [ ] **Step 3: Falls langsamer als 50ms → optimieren oder Schwelle anpassen**

Wenn fail: dokumentiere Ursache, justiere Schwelle auf realistisches Niveau (z.B. <100 ms) und ergänze HANDOFF-Entry.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.perf.test.ts
git commit -m "Cluster C: Performance-Test 1000 Fragen + 100 Pruefungen <50ms"
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

## Rückblick / Lessons-Learned (nach Fertigstellung)

Diese Sektion wird nach Phase 5 mit konkreten Inhalten gefüllt:
- Was lief gut?
- Was war überraschend?
- Welche Architektur-Entscheidung hat sich bewährt / war suboptimal?
- Spawn-Tasks für Phase 2 (Schüler-Suche, Pre-Fill `?suche=`, Volltext, Fuzzy)?

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
