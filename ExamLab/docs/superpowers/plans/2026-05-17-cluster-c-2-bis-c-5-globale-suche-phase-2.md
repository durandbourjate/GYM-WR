# Cluster C.2–C.5 — Globale Suche Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase-1-Foundation der globalen Suche um 4 Features erweitern: Fuzzy-Match (C.5), `?suche=`-Pre-Fill (C.3), Schüler-Suche + Klassenlisten-Tab (C.2), Volltext-Toggle (C.4). Jede Phase shippt unabhängig auf preview → main.

**Architektur:** Phase 1 Foundation (`sucheEngine.ts` + `sucheAdapter.ts` + `useSucheIndex.ts`) bleibt unverändert. C.5 erweitert die Engine um Fuzzy-Fallback. C.3 ergänzt `SAMMELVIEW_ROUTE_BUILDERS` + Surface-Patches mit `?suche=`-Pre-Fill-Pattern. C.2 fügt neuen Tab `klassenlisten` in TAB_REGISTRY + neue `KlassenlistenTab.tsx`-Komponente + `indexSchueler`-Adapter + Type-Erweiterung `SucheQuelle += 'schueler'`. C.4 fügt Opt-in Volltext-Toggle im Suche-Dropdown mit lazy-loaded Frage-Volldaten und neuem `indexFragenVolltext`-Adapter.

**Tech Stack:** React 19, TypeScript, Zustand v5, Vite, Tailwind v4, react-router-dom 7.14, Vitest, lucide-react.

**Spec:** [`ExamLab/docs/superpowers/specs/2026-05-17-cluster-c-2-bis-c-5-design.md`](../specs/2026-05-17-cluster-c-2-bis-c-5-design.md) (rev1 nach Spec-Review)

---

## Spec-Abweichungen (Plan-Audit)

1. **`KlassenlistenEintrag.name` statt `nachname`:** Spec §5.2 nutzte fälschlich `e.nachname`. Audit von `src/services/klassenlistenApi.ts` zeigt: das Feld heisst `name` (Nachname-Konvention im DUY-Backend). Plan korrigiert auf `e.name`.

2. **INDEX_BLACKLIST-Co-Existenz für C.4:** `src/hooks/useGlobalSuche.shared.ts` exportiert `INDEX_BLACKLIST` mit `'musterlosung'` als Defense-in-Depth gegen SuS-Lecks. C.4 indexiert `musterlosung` im LP-only-Pfad. Audit: SuS-Hook `useGlobalSucheSuS` nutzt EIN COMPLETELY DIFFERENT code path (eigene `gruppenStore`-Adapter, keine Berührung mit `indexFragen*`). Privacy-Invariant bleibt eingehalten, BLACKLIST bleibt unverändert (Defense-in-Depth-Marker für künftige Adapter).

3. **Sammelview-Routing-Klick-Position:** Spec §4.1 definiert `SAMMELVIEW_ROUTE_BUILDERS`-Map. Plan-Audit zeigt: aktueller "Alle X Treffer in"-Link lebt in `src/components/shared/header/sucheUI/QuellSektion.tsx`. Patch dort, nicht in den 6 Adaptern.

4. **Apps-Script-Endpoint für Volltext:** Spec §6.2 + §10 markierten als "Hard-Plan-Decision". Plan: Task 4.0 setzt Decision-Gate. Falls Apps-Script `ladeAlleFragenVollText`-Endpoint nicht baubar → Universe-Cap "nur aktive Fachschaft-Pools" als Mitigations-Pfad (max ~200 Fragen).

---

## File Structure (Plan-Locked)

**Neue Files (alle Phasen zusammen):**

| Pfad | Verantwortlichkeit | Phase |
|---|---|---|
| `src/components/settings/einstellungen/KlassenlistenTab.tsx` | Klassenlisten-Anzeige + Suche + Schüler-Highlighting | C.2 |
| `src/components/settings/einstellungen/KlassenlistenTab.test.tsx` | Integration-Tests Tab | C.2 |
| `src/utils/sucheVolltextHelpers.ts` | `generiereSnippet()` + Tests-File | C.4 |
| `src/utils/sucheVolltextHelpers.test.ts` | Unit-Tests Snippet | C.4 |

**Modifizierte Files:**

| Pfad | Was geändert | Phase |
|---|---|---|
| `src/utils/sucheEngine.ts` | `levenshtein()` Helper + `scoreFromMatch` Fuzzy-Fallback | C.5 |
| `src/utils/sucheEngine.test.ts` | Tests für Levenshtein + Fuzzy | C.5 |
| `src/utils/sucheEngine.perf.test.ts` | Performance-Smoke Fuzzy | C.5 |
| `src/utils/sucheAdapter.ts` | `SAMMELVIEW_ROUTE_BUILDERS`-Export (C.3); `indexSchueler` Adapter (C.2); `indexFragenVolltext` (C.4) | C.3/C.2/C.4 |
| `src/utils/sucheAdapter.test.ts` | Tests für neue Routing-Map + Adapter | C.3/C.2/C.4 |
| `src/components/shared/header/sucheUI/QuellSektion.tsx` | "Alle X Treffer"-Link nutzt `SAMMELVIEW_ROUTE_BUILDERS` | C.3 |
| `src/components/lp/LPStartseite.tsx` | `?suche=`-Pre-Fill + `?modus=uebung`-Switch | C.3 |
| `src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` (oder Container) | `?suche=`-Pre-Fill | C.3 |
| `src/types/suche.ts` | `SucheQuelle` += `'schueler'`, `SucheIconKey` += `'schueler'`, `ICON_MAP` += `Users`-Eintrag, `QUELL_LABEL` + `QUELLEN_REIHENFOLGE`, `SucheIndex.schueler` + `SucheIndex.fragenVoll?` | C.2/C.4 |
| `src/hooks/useSucheIndex.ts` | `useKlassenlistenStore` einlesen, Index erweitern | C.2 |
| `src/utils/tabRegistry.ts` | Neuer Tab `klassenlisten` | C.2 |
| `src/components/settings/EinstellungenPanel.tsx` | KlassenlistenTab-Lazy-Import + Tab-Rendering | C.2 |
| `src/components/shared/header/GlobalSuche.tsx` oder `LPGlobalSuche.tsx` | Volltext-Toggle UI | C.4 |
| `src/hooks/useGlobalSuche.shared.ts` oder LP-Hook | `volltextAktiv`-State + Lazy-Loader-Trigger | C.4 |

---

## Implementation Phases (Total ~25 Tasks)

| Phase | Inhalt | Tasks | Tasks (kumul.) |
|---|---|---|---|
| C.5 | Fuzzy-Match | 4 | 4 |
| C.3 | `?suche=`-Pre-Fill | 5 | 9 |
| C.2 | Schüler + Klassenlisten-Tab | 8 | 17 |
| C.4 | Volltext-Toggle | 8 | 25 |

Tasks sind innerhalb einer Phase sequenziell. Phasen sind sequenziell (C.5 → C.3 → C.2 → C.4); jede Phase wird einzeln auf preview → main gemerged.

**Vor jedem Push:** `cd ExamLab && npm run ci-check` (Pflicht-Pre-Push, gem. Memory `feedback_pre_push_ci_check.md`).

---

## Phase 1 — C.5 Fuzzy-Match

### Task 1.1: `levenshtein()` Helper + Unit-Tests

**Files:**
- Modify: `src/utils/sucheEngine.ts` (Helper hinzufügen)
- Modify: `src/utils/sucheEngine.test.ts` (Tests hinzufügen)

- [ ] **Step 1: Test schreiben (TDD)**

Anhängen an `src/utils/sucheEngine.test.ts`:

```ts
import { levenshtein } from './sucheEngine'

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('bilanz', 'bilanz')).toBe(0)
  })
  it('returns length for empty input', () => {
    expect(levenshtein('', 'bilanz')).toBe(6)
    expect(levenshtein('bilanz', '')).toBe(6)
    expect(levenshtein('', '')).toBe(0)
  })
  it('handles single-char insertion (dist 1)', () => {
    expect(levenshtein('bilanz', 'bilanze')).toBe(1)
  })
  it('handles single-char deletion (dist 1)', () => {
    expect(levenshtein('bilantz', 'bilanz')).toBe(1)
  })
  it('handles single-char substitution (dist 1)', () => {
    expect(levenshtein('bilanz', 'bilanc')).toBe(1)
  })
  it('handles multi-char edit (dist 3: 1 sub + 2 ins)', () => {
    // bilanz → bilanc (sub z→c) → bilance (ins e) → bilancen (ins n) = 3
    expect(levenshtein('bilanz', 'bilancen')).toBe(3)
  })
  it('handles transposition as 2 edits', () => {
    expect(levenshtein('abc', 'bac')).toBe(2)
  })
  it('early-exit when length-diff > maxDist', () => {
    // Mit maxDist=2 sollte 'ab' vs 'abcdef' früh abbrechen (length-diff 4 > 2)
    expect(levenshtein('ab', 'abcdef', 2)).toBeGreaterThan(2)  // korrekt: 4
  })
  it('handles case-sensitive (caller normalizes)', () => {
    expect(levenshtein('Bilanz', 'bilanz')).toBe(1)  // 1 substitution
  })
  it('handles longer strings', () => {
    expect(levenshtein('konjunktur', 'konjunkturzyklus')).toBe(6)
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts
```
Erwartet: FAIL mit "levenshtein is not defined".

- [ ] **Step 3: Implementierung in `sucheEngine.ts` hinzufügen**

Hinzufügen vor `scoreFromMatch`:

```ts
/**
 * Levenshtein-Distanz mit klassischem DP-Tableau.
 * Optionaler maxDist-Parameter erlaubt early-exit (ungenutzt = ∞).
 * Cluster C.5 (17.05.2026).
 */
export function levenshtein(a: string, b: string, maxDist: number = Infinity): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  // Early-exit wenn Längen-Diff schon > maxDist
  if (Math.abs(a.length - b.length) > maxDist) return Math.abs(a.length - b.length)

  let prev = new Array(b.length + 1).fill(0).map((_, j) => j)
  let curr = new Array(b.length + 1).fill(0)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost,   // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[b.length]
}
```

- [ ] **Step 4: Tests laufen — alle PASS**

```bash
cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts
```
Erwartet: alle Tests grün, inkl. 10 neue `levenshtein`-Cases.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C.5 Phase 1.1: levenshtein() Helper + 10 Unit-Tests"
```

### Task 1.2: Fuzzy-Fallback in `scoreFromMatch`

**Files:**
- Modify: `src/utils/sucheEngine.ts` (`scoreFromMatch`)
- Modify: `src/utils/sucheEngine.test.ts` (Fuzzy-Branch Tests)

- [ ] **Step 1: Tests schreiben (5 Cases)**

Anhängen an `sucheEngine.test.ts`:

```ts
describe('scoreFromMatch — Fuzzy-Fallback (C.5)', () => {
  it('liefert exact-Score wenn substring matched (Fuzzy nicht aktiv)', () => {
    expect(scoreFromMatch('Bilanz', 'bilan', 'titel')).toBe(SCORE_BOUNDS.TITEL_PREFIX)
  })
  it('liefert TITEL_SUBSTRING - 10 bei dist=1 titel', () => {
    // 'bilantz' (Tippfehler) gegen 'bilanz' → dist=1 → 70 - 10 = 60
    expect(scoreFromMatch('Bilanz', 'bilantz', 'titel')).toBe(SCORE_BOUNDS.TITEL_SUBSTRING - 10)
  })
  it('liefert TITEL_SUBSTRING - 20 bei dist=2 titel', () => {
    // 'bilancen' gegen 'bilanz' → dist=2 → 70 - 20 = 50
    expect(scoreFromMatch('Bilanz', 'bilancen', 'titel')).toBe(SCORE_BOUNDS.TITEL_SUBSTRING - 20)
  })
  it('liefert 0 bei dist >= 3 titel', () => {
    expect(scoreFromMatch('Bilanz', 'xyzabc', 'titel')).toBe(0)
  })
  it('respektiert min-length 3 (kurze needle kein fuzzy)', () => {
    // 'ab' (2 chars) gegen 'bilanz' — exact-miss + zu kurz für fuzzy
    expect(scoreFromMatch('Bilanz', 'ab', 'titel')).toBe(0)
  })
  it('fuzzy NICHT auf id-Feld (verworfen, würde Ranking verfälschen)', () => {
    expect(scoreFromMatch('abc-123', 'abc-124', 'id')).toBe(0)
  })
  it('fuzzy NICHT auf tag-Feld', () => {
    expect(scoreFromMatch('Konjunktur', 'konjuncture', 'tag')).toBe(0)
  })
  it('fuzzy NICHT auf subTitel-Feld', () => {
    expect(scoreFromMatch('Konjunktur', 'konjuncture', 'subTitel')).toBe(0)
  })
})
```

- [ ] **Step 2: Tests laufen — müssen FAIL**

```bash
cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts
```
Erwartet: 8 FAIL (Fuzzy-Branch noch nicht implementiert).

- [ ] **Step 3: `scoreFromMatch` erweitern**

Ersetze die bestehende `scoreFromMatch`-Funktion durch:

```ts
export function scoreFromMatch(haystack: string, needle: string, feld: MatchFeld): number {
  const h = normalizeForSuche(haystack)
  const n = normalizeForSuche(needle)
  if (!n) return 0

  // 1. Exact-Substring (Phase-1-Pfad)
  if (h.includes(n)) {
    if (feld === 'id') return SCORE_BOUNDS.ID_EXACT
    if (feld === 'titel') {
      return h.startsWith(n) ? SCORE_BOUNDS.TITEL_PREFIX : SCORE_BOUNDS.TITEL_SUBSTRING
    }
    if (feld === 'tag') return SCORE_BOUNDS.TAG_THEMA
    return SCORE_BOUNDS.SUBTITEL
  }

  // 2. Fuzzy-Fallback (C.5): NUR für titel, min-length 3
  // ID/tag/subTitel bleiben exact-only (Spec §3.3: ID-Fuzzy würde Ranking verfälschen)
  if (feld === 'titel' && n.length >= 3) {
    const tokens = h.split(/\s+/)
    let minDist = Infinity
    for (const t of tokens) {
      const d = levenshtein(t, n, 2)
      if (d < minDist) minDist = d
      if (minDist === 0) break
    }
    if (minDist <= 2) {
      return Math.max(0, SCORE_BOUNDS.TITEL_SUBSTRING - (minDist === 1 ? 10 : 20))
    }
  }

  return 0
}
```

- [ ] **Step 4: Tests laufen — alle PASS**

```bash
cd ExamLab && npx vitest run src/utils/sucheEngine.test.ts
```
Erwartet: alle grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.ts ExamLab/src/utils/sucheEngine.test.ts
git commit -m "Cluster C.5 Phase 1.2: scoreFromMatch Fuzzy-Fallback (titel-only, dist<=2)"
```

### Task 1.3: Performance-Smoke-Test Fuzzy

**Files:**
- Modify: `src/utils/sucheEngine.perf.test.ts`

- [ ] **Step 1: Performance-Test schreiben**

Anhängen an `sucheEngine.perf.test.ts`:

```ts
describe('Performance — Fuzzy-Match (C.5)', () => {
  it('1000 Items × 10 queries × Fuzzy < 100ms', () => {
    const fragen: FrageSummary[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `q-${i}`,
      fragetext: `Frage zum Thema Bilanz ${i}`,
      typ: 'multipleChoice',
      fach: i % 3 === 0 ? 'BWL' : (i % 3 === 1 ? 'VWL' : 'Recht'),
      tagIds: [],
      thema: `Thema ${i % 10}`,
      bloomstufe: 'K2',
      status: 'ungeprueft',
      // … weitere FrageSummary-Pflichtfelder (analog Phase-1-Test)
    }))
    const queries = ['bilantz', 'konjncktr', 'wirtschft', 'kalkulton', 'inflaton',
                     'bilann', 'gewinn', 'verlust', 'aktia', 'passi']

    const start = performance.now()
    for (const q of queries) {
      indexFragen(q, fragen)
    }
    const dauer = performance.now() - start
    expect(dauer).toBeLessThan(100)
  })
})
```

- [ ] **Step 2: Test laufen lassen — sollte PASS (Fuzzy ist optimiert)**

```bash
cd ExamLab && npx vitest run src/utils/sucheEngine.perf.test.ts
```
Erwartet: PASS mit Dauer < 100ms.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/utils/sucheEngine.perf.test.ts
git commit -m "Cluster C.5 Phase 1.3: Performance-Smoke 1000 Items x 10 fuzzy-queries"
```

### Task 1.4: Phase C.5 Push + E2E-Verify

**Files:** keine — verification only.

- [ ] **Step 1: ci-check vor Push**

```bash
cd ExamLab && npm run ci-check
```
Erwartet: 8 lint-Gates clean, alle Tests grün (1926 → ~1943 mit +17 neuen Fuzzy-Tests), build green.

- [ ] **Step 2: FF-Push zu preview**

```bash
git push origin feature/cluster-c-2-bis-c-5-spec-2026-05-17:preview
```

Hinweis: Branch heisst noch `feature/cluster-c-2-bis-c-5-spec-2026-05-17` (von Brainstorming). Bei Bedarf umbenennen oder weiter benutzen.

- [ ] **Step 3: Browser-E2E auf staging (Chrome-in-Chrome)**

LP einloggen, in globale Suche tippen:
- "bilantz" → muss "Bilanz"-haltige Treffer finden (kein Highlight, Score 60)
- "konjncktr" → muss "Konjunktur"-haltige Treffer finden (Score ~50, dist=2)
- "ab" (2 chars) → KEIN fuzzy (min-length-Guard)

Erwartet: Treffer erscheinen, keine Console-Errors.

- [ ] **Step 4: Nach LP-Freigabe FF-Merge zu main**

```bash
git checkout main && git pull
git merge --ff-only feature/cluster-c-2-bis-c-5-spec-2026-05-17
git push origin main
git checkout feature/cluster-c-2-bis-c-5-spec-2026-05-17
```

---

## Phase 2 — C.3 `?suche=`-Pre-Fill

### Task 2.1: `SAMMELVIEW_ROUTE_BUILDERS` in `sucheAdapter.ts`

**Files:**
- Modify: `src/utils/sucheAdapter.ts` (Export hinzufügen)
- Modify: `src/utils/sucheAdapter.test.ts` (Tests)

- [ ] **Step 1: Tests schreiben (6 Cases — 1 pro Quelle inkl. encoding)**

Anhängen an `sucheAdapter.test.ts`:

```ts
import { SAMMELVIEW_ROUTE_BUILDERS } from './sucheAdapter'

describe('SAMMELVIEW_ROUTE_BUILDERS', () => {
  it('einstellungen-tab routes to /einstellungen', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS['einstellungen-tab']('xy')).toBe('/einstellungen')
  })
  it('hilfe-tab routes to /hilfe', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS['hilfe-tab']('xy')).toBe('/hilfe')
  })
  it('kurs routes to / mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.kurs('BWL')).toBe('/?suche=BWL')
  })
  it('pruefung routes to / mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.pruefung('Bilanz')).toBe('/?suche=Bilanz')
  })
  it('uebung routes to / mit ?suche und ?modus=uebung', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.uebung('Aktien')).toBe('/?suche=Aktien&modus=uebung')
  })
  it('frage routes to /fragensammlung mit ?suche', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.frage('Wert')).toBe('/fragensammlung?suche=Wert')
  })
  it('encoded Sonderzeichen werden via encodeURIComponent escaped', () => {
    expect(SAMMELVIEW_ROUTE_BUILDERS.frage('a&b')).toBe('/fragensammlung?suche=a%26b')
  })
})
```

- [ ] **Step 2: Tests laufen — FAIL**

```bash
cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts
```

- [ ] **Step 3: `SAMMELVIEW_ROUTE_BUILDERS` exportieren**

Anfügen an `src/utils/sucheAdapter.ts` (nach existierenden `ROUTE_BUILDERS`):

```ts
/**
 * Sammelview-Routes für "Alle X Treffer in"-Klick im Suche-Dropdown.
 * Pre-Fill via `?suche=<query>` URL-Param; Surface-Komponente liest den Param.
 * Cluster C.3 (17.05.2026). `schueler` wird in C.2 ergänzt.
 */
export const SAMMELVIEW_ROUTE_BUILDERS: Record<'einstellungen-tab' | 'hilfe-tab' | 'kurs' | 'pruefung' | 'uebung' | 'frage', (query: string) => string> = {
  'einstellungen-tab': () => '/einstellungen',
  'hilfe-tab':         () => '/hilfe',
  kurs:                (q) => `/?suche=${encodeURIComponent(q)}`,
  pruefung:            (q) => `/?suche=${encodeURIComponent(q)}`,
  uebung:              (q) => `/?suche=${encodeURIComponent(q)}&modus=uebung`,
  frage:               (q) => `/fragensammlung?suche=${encodeURIComponent(q)}`,
}
```

(Hinweis: `schueler`-Eintrag fehlt absichtlich — kommt in Task 3.5 nach Type-Erweiterung der Map.)

- [ ] **Step 4: Tests laufen — PASS**

```bash
cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/utils/sucheAdapter.ts ExamLab/src/utils/sucheAdapter.test.ts
git commit -m "Cluster C.3 Phase 2.1: SAMMELVIEW_ROUTE_BUILDERS Export + 7 Tests"
```

### Task 2.2: `QuellSektion` "Alle X Treffer"-Link nutzt Sammelview-Route

**Files:**
- Modify: `src/components/shared/header/sucheUI/QuellSektion.tsx`
- Modify: `src/components/shared/header/sucheUI/QuellSektion.test.tsx`

- [ ] **Step 1: Audit existing QuellSektion-Code**

```bash
cd ExamLab && cat src/components/shared/header/sucheUI/QuellSektion.tsx | head -80
```
Notieren: aktuelle "Alle X Treffer in"-Link-URL (vermutlich `route: '#'` als Placeholder).

- [ ] **Step 2: Test für Link-Update schreiben**

In `QuellSektion.test.tsx` hinzufügen (oder als neuer Block):

```ts
import { SAMMELVIEW_ROUTE_BUILDERS } from '../../../../utils/sucheAdapter'

it('Alle X Treffer-Link nutzt SAMMELVIEW_ROUTE_BUILDERS pro Quelle', () => {
  render(<QuellSektion quelle="frage" treffer={[...]} gesamt={10} query="Bilanz" onTrefferClick={vi.fn()} />)
  const link = screen.getByText(/Alle 10 Treffer/i).closest('a')
  expect(link).toHaveAttribute('href', '/fragensammlung?suche=Bilanz')
})

it('Alle X Treffer-Link für uebung enthaelt modus=uebung', () => {
  render(<QuellSektion quelle="uebung" treffer={[...]} gesamt={8} query="Aktien" onTrefferClick={vi.fn()} />)
  const link = screen.getByText(/Alle 8 Treffer/i).closest('a')
  expect(link).toHaveAttribute('href', '/?suche=Aktien&modus=uebung')
})
```

- [ ] **Step 3: QuellSektion patchen**

In `QuellSektion.tsx`:
- Component muss `query: string`-Prop hinzubekommen (falls noch nicht da)
- "Alle X Treffer in …"-`<Link>` nutzt `SAMMELVIEW_ROUTE_BUILDERS[quelle](query)` als `to`-Prop
- Bei `einstellungen-tab` / `hilfe-tab` weiterhin nur `to="/einstellungen"` / `to="/hilfe"` (no-query-target)

- [ ] **Step 4: Tests + tsc laufen**

```bash
cd ExamLab && npx vitest run src/components/shared/header/sucheUI/QuellSektion.test.tsx
cd ExamLab && npx tsc -b
```
Erwartet: PASS + tsc clean.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/sucheUI/QuellSektion.tsx ExamLab/src/components/shared/header/sucheUI/QuellSektion.test.tsx
git commit -m "Cluster C.3 Phase 2.2: QuellSektion Sammelview-Link mit ?suche= per SAMMELVIEW_ROUTE_BUILDERS"
```

### Task 2.3: FragenBrowser Pre-Fill-Pattern

**Files:**
- Modify: `src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx` (oder Container — Plan-Entscheidung im Audit-Step)
- Modify: passender Test-File

- [ ] **Step 1: Audit — wo lebt der suchtext-State?**

```bash
cd ExamLab && grep -n "suchtext\|setSuchtext" src/components/lp/fragensammlung/fragenbrowser/FragenBrowser.tsx src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx | head -10
```

Notieren: ob `suchtext` in FragenBrowser-Container oder im Header lebt. Patch landet im State-Owner.

- [ ] **Step 2: Test für Pre-Fill schreiben**

Im passenden Test-File (z.B. neuer File `FragenBrowserPreFill.test.tsx` oder bestehender Test):

```ts
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FragenBrowser from './FragenBrowser'

describe('FragenBrowser — ?suche=-Pre-Fill (Cluster C.3)', () => {
  it('initial-suchtext aus URL-Param', () => {
    render(
      <MemoryRouter initialEntries={['/fragensammlung?suche=Bilanz']}>
        <Routes>
          <Route path="/fragensammlung" element={<FragenBrowser />} />
        </Routes>
      </MemoryRouter>
    )
    const input = screen.getByPlaceholderText(/suche/i) as HTMLInputElement
    expect(input.value).toBe('Bilanz')
  })
  it('Param wird nach Mount entfernt', async () => {
    // … via MockSetParams testen ob replace aufgerufen
  })
})
```

- [ ] **Step 3: Test laufen — FAIL**

- [ ] **Step 4: State-Owner-Component patchen**

Im State-Owner (vermutlich `FragenBrowser.tsx`):

```tsx
import { useSearchParams } from 'react-router-dom'
import { useRef, useEffect } from 'react'

// … in der Component:
const [searchParams, setSearchParams] = useSearchParams()
const [suchtext, setSuchtext] = useState(searchParams.get('suche') ?? '')
const lastSeenParam = useRef<string | null>(null)

useEffect(() => {
  const suche = searchParams.get('suche')
  if (!suche || suche === lastSeenParam.current) return
  lastSeenParam.current = suche
  setSuchtext(suche)
  // Param entfernen
  const next = new URLSearchParams(searchParams)
  next.delete('suche')
  setSearchParams(next, { replace: true })
}, [searchParams, setSearchParams])
```

- [ ] **Step 5: Tests + tsc laufen**

```bash
cd ExamLab && npx vitest run src/components/lp/fragensammlung/fragenbrowser/
cd ExamLab && npx tsc -b
```

- [ ] **Step 6: Commit**

```bash
git commit -m "Cluster C.3 Phase 2.3: FragenBrowser ?suche=-Pre-Fill (useSearchParams + lastSeenParam-Ref)"
```

### Task 2.4: LPStartseite Pre-Fill + Modus-Switch

**Files:**
- Modify: `src/components/lp/LPStartseite.tsx`
- Modify: Test-File (`src/components/lp/LPStartseite.test.tsx` falls vorhanden, sonst neuer)

- [ ] **Step 1: Audit LPStartseite suchtext + modus**

```bash
cd ExamLab && grep -n "suchtext\|setSuchtext\|setModus\|listenTab" src/components/lp/LPStartseite.tsx | head -15
```

LPStartseite hat suchtext-State + nutzt `useLPNavigationStore.setModus()`. Notieren wo Mount-useEffect läuft.

- [ ] **Step 2: Test für Pre-Fill + Modus-Switch schreiben**

```ts
describe('LPStartseite — ?suche=-Pre-Fill + ?modus= (Cluster C.3)', () => {
  it('initial-suchtext aus URL-Param', () => { /* ... */ })
  it('?modus=uebung schaltet auf Übungen-Modus', () => {
    render(<MemoryRouter initialEntries={['/?suche=Aktien&modus=uebung']}>...
    expect(useLPNavigationStore.getState().modus).toBe('uebung')
  })
  it('Cleanup entfernt beide Params nach Mount', () => { /* ... */ })
})
```

- [ ] **Step 3: Test laufen — FAIL**

- [ ] **Step 4: LPStartseite patchen**

```tsx
import { useSearchParams } from 'react-router-dom'

const [searchParams, setSearchParams] = useSearchParams()
const [suchtext, setSuchtext] = useState(searchParams.get('suche') ?? '')
const lastSeenParam = useRef<string | null>(null)

useEffect(() => {
  const suche = searchParams.get('suche')
  const modus = searchParams.get('modus')

  let updated = false
  const next = new URLSearchParams(searchParams)

  if (suche && suche !== lastSeenParam.current) {
    lastSeenParam.current = suche
    setSuchtext(suche)
    next.delete('suche')
    updated = true
  }
  if (modus === 'uebung' || modus === 'pruefung') {
    useLPNavigationStore.getState().setModus(modus)
    next.delete('modus')
    updated = true
  }
  if (updated) setSearchParams(next, { replace: true })
}, [searchParams, setSearchParams])
```

- [ ] **Step 5: Tests + tsc**

- [ ] **Step 6: Commit**

```bash
git commit -m "Cluster C.3 Phase 2.4: LPStartseite ?suche= + ?modus= Pre-Fill"
```

### Task 2.5: Phase C.3 Push + E2E-Verify

**Files:** keine — verification only.

- [ ] **Step 1: ci-check**

```bash
cd ExamLab && npm run ci-check
```

- [ ] **Step 2: FF-Push zu preview**

```bash
git push origin feature/cluster-c-2-bis-c-5-spec-2026-05-17:preview
```

- [ ] **Step 3: Browser-E2E auf staging**

LP einloggen:
1. In globaler Suche: "Bilanz" tippen → Treffer-Sektion "Fragen" zeigt "Alle X Treffer in Fragen"-Link
2. Klick → Navigiert zu `/fragensammlung?suche=Bilanz`, FragenBrowser zeigt suchtext "Bilanz" vor-gefüllt
3. URL nach Mount: `/fragensammlung` (kein `?suche=` mehr)
4. Wiederholt mit Sektion "Übungen" → Klick navigiert zu `/?suche=...&modus=uebung`, LPStartseite zeigt Übungen-Modus + Filter

Erwartet: 0 Console-Errors.

- [ ] **Step 4: FF-Merge zu main nach Freigabe**

```bash
git checkout main && git pull && git merge --ff-only feature/cluster-c-2-bis-c-5-spec-2026-05-17 && git push origin main
git checkout feature/cluster-c-2-bis-c-5-spec-2026-05-17
```

---

## Phase 3 — C.2 Schüler-Suche + Klassenlisten-Tab

### Task 3.1: Type-Erweiterungen `SucheQuelle += 'schueler'`

**Files:**
- Modify: `src/types/suche.ts`

- [ ] **Step 1: Type-Erweiterung**

In `src/types/suche.ts`:

```ts
// Vor: SucheQuelle ohne 'schueler'
export type SucheQuelle =
  | 'einstellungen-tab'
  | 'hilfe-tab'
  | 'kurs'
  | 'schueler'       // ← NEU C.2
  | 'pruefung'
  | 'uebung'
  | 'frage'

export type SucheIconKey = '...' | 'schueler'  // ergänzen

// QUELLEN_REIHENFOLGE — schueler nach kurs:
export const QUELLEN_REIHENFOLGE: readonly SucheQuelle[] = [
  'einstellungen-tab', 'hilfe-tab', 'kurs',
  'schueler',  // ← NEU
  'pruefung', 'uebung', 'frage',
] as const

// QUELL_LABEL:
export const QUELL_LABEL: Record<SucheQuelle, string> = {
  // ... bestehende
  schueler: 'Schüler',
}

// ICON_MAP:
import { Users } from 'lucide-react'  // ergänzen falls noch nicht da
export const ICON_MAP: Record<SucheIconKey, LucideIcon> = {
  // ... bestehende
  schueler: Users,
}

// SucheIndex:
export interface SucheIndex {
  // ... bestehende
  schueler: KlassenlistenEintrag[]    // ← NEU
}
```

Import oben ergänzen: `import type { KlassenlistenEintrag } from '../services/klassenlistenApi'`

- [ ] **Step 2: tsc laufen — viele Errors erwartet (Index, Adapter, Hook)**

```bash
cd ExamLab && npx tsc -b 2>&1 | head -30
```

Erwartet: Errors in `sucheAdapter.ts`, `useSucheIndex.ts`, `sucheEngine.ts` (alle wissen `schueler`-Quelle nicht).

- [ ] **Step 3: NICHT committen, weiter zu Task 3.2** — Type-Erweiterung committen wir zusammen mit `indexSchueler`-Adapter als atomares Bundle.

### Task 3.2: `indexSchueler` Adapter + Tests

**Files:**
- Modify: `src/utils/sucheAdapter.ts`
- Modify: `src/utils/sucheAdapter.test.ts`

- [ ] **Step 1: Tests schreiben (8 Cases)**

```ts
import { indexSchueler } from './sucheAdapter'

const eintraege = [
  { vorname: 'Anna', name: 'Müller', email: 'anna.mueller@stud.gymhofwil.ch', klasse: '28c' },
  { vorname: 'Ben', name: 'Schmidt', email: 'ben.s@stud.gymhofwil.ch', klasse: '27a' },
  { vorname: 'Clara', name: 'Weber', email: 'clara.w@stud.gymhofwil.ch', klasse: '28c', kurs: 'WR-SF' },
]

describe('indexSchueler', () => {
  it('matched vorname (Titel-Prefix)', () => {
    const treffer = indexSchueler('anna', eintraege)
    expect(treffer.length).toBeGreaterThanOrEqual(1)
    expect(treffer[0].titel).toBe('Anna Müller')
    expect(treffer[0].quelle).toBe('schueler')
  })
  it('matched nachname (titel-substring)', () => {
    const treffer = indexSchueler('Schmidt', eintraege)
    expect(treffer.map(t => t.titel)).toContain('Ben Schmidt')
  })
  it('matched email (id-exact)', () => {
    const treffer = indexSchueler('anna.mueller', eintraege)
    expect(treffer.map(t => t.titel)).toContain('Anna Müller')
  })
  it('matched klasse (subTitel)', () => {
    const treffer = indexSchueler('28c', eintraege)
    const klassen = treffer.map(t => t.titel)
    expect(klassen).toContain('Anna Müller')
    expect(klassen).toContain('Clara Weber')
  })
  it('fuzzy via C.5 (Tippfehler in vorname)', () => {
    const treffer = indexSchueler('anaa', eintraege)  // dist=1 zu 'anna'
    expect(treffer.map(t => t.titel)).toContain('Anna Müller')
  })
  it('subTitel zeigt klasse + kurs falls vorhanden', () => {
    const treffer = indexSchueler('clara', eintraege)
    expect(treffer[0].subTitel).toBe('28c · WR-SF')
  })
  it('leere eintraege liefert leeres Array', () => {
    expect(indexSchueler('anna', [])).toEqual([])
  })
  it('kein Match → leeres Array', () => {
    expect(indexSchueler('xyz123', eintraege)).toEqual([])
  })
})
```

- [ ] **Step 2: Test laufen — FAIL**

- [ ] **Step 3: `indexSchueler` implementieren**

In `src/utils/sucheAdapter.ts`:

```ts
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'

export function indexSchueler(
  query: string,
  eintraege: KlassenlistenEintrag[],
): SucheTreffer[] {
  const treffer: SucheTreffer[] = []
  for (const e of eintraege) {
    const titel = `${e.vorname} ${e.name}`
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const emailScore = scoreFromMatch(e.email, query, 'id')
    const klasseScore = scoreFromMatch(e.klasse, query, 'subTitel')
    const score = Math.max(titelScore, emailScore, klasseScore)
    if (score === 0) continue
    treffer.push({
      quelle: 'schueler',
      id: e.email,
      titel,
      subTitel: `${e.klasse}${e.kurs ? ' · ' + e.kurs : ''}`,
      highlightStellen: findeHighlightStellen(titel, query, 'titel'),
      navigation: {
        route: `${SAMMELVIEW_ROUTE_BUILDERS.schueler(titel)}&schueler=${encodeURIComponent(e.email)}`,
      },
      score,
      iconKey: 'schueler',
    })
  }
  return treffer
}
```

Hinweis: `SAMMELVIEW_ROUTE_BUILDERS.schueler` wird in Step 4 ergänzt.

- [ ] **Step 4: `SAMMELVIEW_ROUTE_BUILDERS` Schueler-Eintrag**

Im selben File `sucheAdapter.ts` die Map auf 7 Einträge erweitern:

```ts
export const SAMMELVIEW_ROUTE_BUILDERS: Record<SucheQuelle, (query: string) => string> = {
  'einstellungen-tab': () => '/einstellungen',
  'hilfe-tab':         () => '/hilfe',
  kurs:                (q) => `/?suche=${encodeURIComponent(q)}`,
  schueler:            (q) => `/einstellungen?tab=klassenlisten&suche=${encodeURIComponent(q)}`,
  pruefung:            (q) => `/?suche=${encodeURIComponent(q)}`,
  uebung:              (q) => `/?suche=${encodeURIComponent(q)}&modus=uebung`,
  frage:               (q) => `/fragensammlung?suche=${encodeURIComponent(q)}`,
}
```

Type wechsle auf `Record<SucheQuelle, ...>` damit TypeScript exhaustiveness checked.

- [ ] **Step 5: Tests laufen — PASS**

```bash
cd ExamLab && npx vitest run src/utils/sucheAdapter.test.ts && npx tsc -b
```

- [ ] **Step 6: Commit (atomar: Types + Adapter + Tests)**

```bash
git add ExamLab/src/types/suche.ts ExamLab/src/utils/sucheAdapter.ts ExamLab/src/utils/sucheAdapter.test.ts
git commit -m "Cluster C.2 Phase 3.1+3.2: SucheQuelle 'schueler' + indexSchueler Adapter + 8 Tests"
```

### Task 3.3: `useSucheIndex` + `fuehreSucheAus` Erweiterung

**Files:**
- Modify: `src/hooks/useSucheIndex.ts`
- Modify: `src/utils/sucheEngine.ts` (`fuehreSucheAus` Adapter-Liste)
- Modify: `src/hooks/useSucheIndex.test.tsx`

- [ ] **Step 1: Audit useSucheIndex**

```bash
cd ExamLab && cat src/hooks/useSucheIndex.ts
```

- [ ] **Step 2: `useKlassenlistenStore` einlesen**

```tsx
import { useKlassenlistenStore } from '../store/klassenlistenStore'

// in der Hook:
const schueler = useKlassenlistenStore(s => s.daten ?? [])

const index = useMemo<SucheIndex>(() => ({
  // ... bestehende Felder
  schueler,
}), [/* deps inkl. schueler */])
```

- [ ] **Step 3: `fuehreSucheAus` Adapter-Liste erweitern**

In `sucheEngine.ts`:

```ts
const alle: SucheTreffer[] = [
  ...indexEinstellungenTabs(query, index.einstellungenTabs),
  ...indexHilfeTabs(query, index.hilfeTabs),
  ...indexKurse(query, index.kurse),
  ...indexSchueler(query, index.schueler),    // ← NEU
  ...indexPruefungen(query, index.pruefungen),
  ...indexUebungen(query, index.uebungen),
  ...indexFragen(query, index.fragen),
]
```

Import `indexSchueler` oben ergänzen.

- [ ] **Step 4: useSucheIndex-Test erweitern**

```ts
it('useSucheIndex enthält schueler aus klassenlistenStore', () => {
  useKlassenlistenStore.setState({ daten: [{ vorname: 'A', name: 'M', email: 'a@b.c', klasse: '28c' }] })
  const { result } = renderHook(() => useSucheIndex())
  expect(result.current.schueler).toHaveLength(1)
})
```

- [ ] **Step 5: tsc + Tests laufen**

```bash
cd ExamLab && npx tsc -b && npx vitest run src/hooks/useSucheIndex.test.tsx src/utils/sucheEngine.test.ts
```

- [ ] **Step 6: Commit**

```bash
git commit -m "Cluster C.2 Phase 3.3: useSucheIndex + fuehreSucheAus integrieren Schueler-Quelle"
```

### Task 3.4: SuS-Permission-Pflicht-Test

**Files:**
- Modify: `src/hooks/useGlobalSucheSuS.ts` (kein Code-Change — nur Test)
- Modify: `src/hooks/useGlobalSucheSuS.test.ts` (anlegen falls nicht vorhanden, sonst erweitern)

- [ ] **Step 1: Test schreiben**

```ts
// src/hooks/useGlobalSucheSuS.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGlobalSucheSuS } from './useGlobalSucheSuS'

describe('useGlobalSucheSuS — Permission-Guard (Cluster C.2 §10)', () => {
  it('hat KEIN schueler-Adapter im Pfad — Privacy-Invariant', () => {
    // Hook hat eigene Implementation ohne sucheAdapter.ts-Adapter.
    // Diese Test fasst eine Code-Invariant: kein Import von indexSchueler.
    const sus = useGlobalSucheSuS('test', {}, () => {})
    // ergebnis.gruppen enthält ausschliesslich Gruppen/Kurse, keine 'schueler'-Kategorie
    expect(sus.gruppen.find(g => /sch[uü]ler/i.test(g.label))).toBeUndefined()
  })
})
```

- [ ] **Step 2: Audit `useGlobalSucheSuS.ts` — Source-Verify**

```bash
cd ExamLab && grep -n "import.*indexSchueler\|schueler" src/hooks/useGlobalSucheSuS.ts
```

Erwartet: KEIN Treffer. Falls doch: STOP, Privacy-Bug — sofort an User eskalieren.

- [ ] **Step 3: Test laufen — PASS**

```bash
cd ExamLab && npx vitest run src/hooks/useGlobalSucheSuS.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Cluster C.2 Phase 3.4: SuS-Permission-Pflicht-Test gegen Schueler-Leak"
```

### Task 3.5: TAB_REGISTRY Klassenlisten-Eintrag

**Files:**
- Modify: `src/utils/tabRegistry.ts`

- [ ] **Step 1: Tab-Eintrag hinzufügen**

In `TAB_REGISTRY` nach dem `lernziele`-Eintrag (Z. 30) einfügen:

```ts
{ id: 'klassenlisten',     surface: 'einstellungen', titel: 'Klassenlisten',     route: '/einstellungen/klassenlisten',
                           icon: 'Users' },
```

- [ ] **Step 2: Tests laufen — sollten alle weiter passieren (Tab-Registry-Tests sind tolerant)**

```bash
cd ExamLab && npx vitest run
```

- [ ] **Step 3: Commit**

```bash
git commit -m "Cluster C.2 Phase 3.5: TAB_REGISTRY Klassenlisten-Tab-Eintrag"
```

### Task 3.6: `KlassenlistenTab` Komponente + Integration-Tests

**Files:**
- Create: `src/components/settings/einstellungen/KlassenlistenTab.tsx`
- Create: `src/components/settings/einstellungen/KlassenlistenTab.test.tsx`

- [ ] **Step 1: Tests schreiben (TDD, ~7 Cases)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import KlassenlistenTab from './KlassenlistenTab'
import { useKlassenlistenStore } from '../../../store/klassenlistenStore'

const eintraege = [
  { vorname: 'Anna', name: 'Müller', email: 'anna.m@stud.gymhofwil.ch', klasse: '28c', kurs: 'WR-SF' },
  { vorname: 'Ben', name: 'Schmidt', email: 'ben.s@stud.gymhofwil.ch', klasse: '27a' },
]

describe('KlassenlistenTab', () => {
  beforeEach(() => {
    useKlassenlistenStore.setState({ daten: eintraege, ladeStatus: 'fertig' })
  })

  it('zeigt alle Eintraege ohne Filter', () => {
    render(<MemoryRouter><KlassenlistenTab /></MemoryRouter>)
    expect(screen.getByText('Anna Müller')).toBeInTheDocument()
    expect(screen.getByText('Ben Schmidt')).toBeInTheDocument()
  })
  it('filtert nach Suchtext', () => { /* ... */ })
  it('filtert nach Klasse', () => { /* ... */ })
  it('Pre-Fill via ?suche= URL-Param', () => {
    render(<MemoryRouter initialEntries={['/einstellungen?tab=klassenlisten&suche=Anna']}><KlassenlistenTab /></MemoryRouter>)
    const input = screen.getByPlaceholderText(/suche/i) as HTMLInputElement
    expect(input.value).toBe('Anna')
  })
  it('Hervorhebung via ?schueler= URL-Param', () => {
    render(<MemoryRouter initialEntries={['/einstellungen?tab=klassenlisten&schueler=anna.m@stud.gymhofwil.ch']}><KlassenlistenTab /></MemoryRouter>)
    const annaRow = screen.getByText('Anna Müller').closest('tr')
    expect(annaRow?.className).toMatch(/bg-violet/)  // oder bg-blue
  })
  it('Skeleton bei ladeStatus=laeuft', () => { /* ... */ })
  it('trigger lade() bei Mount wenn idle', () => { /* ... */ })
})
```

- [ ] **Step 2: Tests laufen — FAIL (Component existiert nicht)**

- [ ] **Step 3: Component implementieren**

```tsx
// src/components/settings/einstellungen/KlassenlistenTab.tsx
import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useKlassenlistenStore } from '../../../store/klassenlistenStore'
import { useAuthStore } from '../../../store/authStore'
import { useTestdatenSichtbar } from '../../../hooks/useTestdatenSichtbar'
import { filtereTestdatenWennDeaktiviert } from '../../../utils/testdaten/filter'
import { normalizeForSuche } from '../../../utils/sucheEngine'

export default function KlassenlistenTab() {
  const eintraege = useKlassenlistenStore(s => s.daten)
  const ladeStatus = useKlassenlistenStore(s => s.ladeStatus)
  const lade = useKlassenlistenStore(s => s.lade)
  const email = useAuthStore(s => s.user?.email)
  const testdatenSichtbar = useTestdatenSichtbar()

  const [searchParams, setSearchParams] = useSearchParams()
  const [suchtext, setSuchtext] = useState(searchParams.get('suche') ?? '')
  const [filterKlasse, setFilterKlasse] = useState('')
  const initialSchueler = searchParams.get('schueler')
  const lastSeenParam = useRef<string | null>(null)

  // Pre-Fill aus URL + Cleanup
  useEffect(() => {
    const s = searchParams.get('suche')
    if (s && s !== lastSeenParam.current) {
      lastSeenParam.current = s
      setSuchtext(s)
      const next = new URLSearchParams(searchParams)
      next.delete('suche')
      // schueler-Param bleibt — wird vom Highlight-Code gelesen
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Lazy load bei Mount
  useEffect(() => {
    if (ladeStatus === 'idle' && email) lade(email)
  }, [ladeStatus, email, lade])

  const gefiltert = useMemo(() => {
    if (!eintraege) return []
    const sichtbar = filtereTestdatenWennDeaktiviert(eintraege, testdatenSichtbar)
    const n = normalizeForSuche(suchtext)
    return sichtbar.filter(e => {
      if (filterKlasse && e.klasse !== filterKlasse) return false
      if (!n) return true
      return (
        normalizeForSuche(`${e.vorname} ${e.name}`).includes(n) ||
        normalizeForSuche(e.email).includes(n) ||
        normalizeForSuche(e.klasse).includes(n)
      )
    })
  }, [eintraege, suchtext, filterKlasse, testdatenSichtbar])

  if (ladeStatus !== 'fertig') {
    return <div className="space-y-2">{[0,1,2].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Suche Schüler/Klasse …"
          value={suchtext}
          onChange={e => setSuchtext(e.target.value)}
          className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded text-sm"
        />
        {/* Klassen-Dropdown analog FragenBrowserHeader-Dropdown */}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr><th>Vorname</th><th>Name</th><th>E-Mail</th><th>Klasse</th><th>Kurs</th></tr>
        </thead>
        <tbody>
          {gefiltert.map(e => {
            const isHighlight = initialSchueler && e.email === initialSchueler
            return (
              <tr key={e.email} className={isHighlight ? 'bg-violet-100 dark:bg-violet-900/30' : ''}
                  ref={isHighlight ? (el => el?.scrollIntoView({ block: 'center' })) : undefined}>
                <td>{e.vorname}</td>
                <td>{e.name}</td>
                <td>{e.email}</td>
                <td>{e.klasse}</td>
                <td>{e.kurs ?? ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Tests + tsc**

```bash
cd ExamLab && npx vitest run src/components/settings/einstellungen/KlassenlistenTab.test.tsx && npx tsc -b
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/settings/einstellungen/KlassenlistenTab.tsx ExamLab/src/components/settings/einstellungen/KlassenlistenTab.test.tsx
git commit -m "Cluster C.2 Phase 3.6: KlassenlistenTab-Komponente + 7 Integration-Tests"
```

### Task 3.7: EinstellungenPanel wiring

**Files:**
- Modify: `src/components/settings/EinstellungenPanel.tsx`

- [ ] **Step 1: Audit Lazy-Tab-Pattern**

```bash
cd ExamLab && grep -n "lazyMitRetry\|LernzieleTab\|TagsTab" src/components/settings/EinstellungenPanel.tsx | head -10
```

Notieren: wo werden Tabs gemapped (Switch / Map / Component).

- [ ] **Step 2: KlassenlistenTab Lazy-Import + Mapping**

In `EinstellungenPanel.tsx`:

```tsx
const KlassenlistenTab = lazyMitRetry(() => import('./einstellungen/KlassenlistenTab'))

// in der Tab-Map / im Switch:
{activeTab === 'klassenlisten' && <Suspense fallback={<TabSkeleton />}><KlassenlistenTab /></Suspense>}
```

(Genaues Pattern abhängig vom Audit-Resultat in Step 1.)

- [ ] **Step 3: tsc + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run src/components/settings/
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Cluster C.2 Phase 3.7: EinstellungenPanel rendert KlassenlistenTab"
```

### Task 3.8: Phase C.2 Push + E2E + Memory-Update

**Files:**
- Modify: Memory-File (MEMORY.md) — F.4-Resolution

- [ ] **Step 1: ci-check**

```bash
cd ExamLab && npm run ci-check
```

- [ ] **Step 2: FF-Push zu preview**

```bash
git push origin feature/cluster-c-2-bis-c-5-spec-2026-05-17:preview
```

- [ ] **Step 3: Browser-E2E auf staging**

LP:
1. Einstellungen öffnen → "Klassenlisten"-Tab sichtbar
2. Schüler-Tabelle erscheint, Suche/Filter funktioniert
3. Globale Suche → "Müller" tippen → "Schüler"-Sektion erscheint
4. Klick auf Schüler-Treffer → Einstellungen öffnet sich, Klassenlisten-Tab aktiv, Filter "Anna Müller" gesetzt, Anna-Zeile highlighted

SuS:
5. Globale Suche → "Müller" tippen → KEINE Schüler-Treffer sichtbar (Privacy-Test)

Erwartet: 0 Console-Errors.

- [ ] **Step 4: Memory-Update**

Im `MEMORY.md` Spawn-Task "Klassenlisten-Tab Filter (F.4 OoS)" als RESOLVED markieren (gestrichen oder entfernen).

```bash
cd "/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory"
# Edit MEMORY.md, remove the "Klassenlisten-Tab Filter (F.4 OoS)" line
```

- [ ] **Step 5: FF-Merge zu main nach Freigabe**

```bash
git checkout main && git pull && git merge --ff-only feature/cluster-c-2-bis-c-5-spec-2026-05-17 && git push origin main
git checkout feature/cluster-c-2-bis-c-5-spec-2026-05-17
```

---

## Phase 4 — C.4 Volltext-Toggle

### Task 4.0: Hard-Plan-Decision — Backend-Endpoint

**Files:** keine — Decision-Gate.

- [ ] **Step 1: Apps-Script-Audit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -n "ladeAlleFragen\|ladeFragenVoll\|getAllFragenVoll\|action.*frage" ExamLab/apps-script-code.js | head -20
```

Notieren: gibt es bereits einen Batch-Endpoint der ALLE Fragen mit Vollobjekt liefert (inkl. fragetext, musterlosung)?

- [ ] **Step 2: Entscheidung dokumentieren**

In `HANDOFF.md` ergänzen unter Cluster-C-Section:

```markdown
**C.4 Backend-Entscheidung (Plan-Phase 4.0):**

Option gewählt: [A: Batch-Endpoint hinzufügen | B: Universe-Cap auf aktive Fachschaft-Pools]

Begründung: ...
```

- [ ] **Step 3: Falls Option A — Apps-Script-Erweiterung**

Wenn Batch-Endpoint nötig: neue Apps-Script-Funktion `ladeFragenVolltext` die per email aus den Fragensammlungen die Vollobjekte zurückgibt. Frontend-API in `src/services/fragenApi.ts` (oder existierend). Test in `ladeFragenVolltext.test.ts`.

- [ ] **Step 4: Falls Option B — Universe-Cap**

Wenn Batch-Endpoint nicht baubar (Apps-Script-Limit): `ladeAlleVollDaten(email, opts?: { activePools?: boolean })`. Lädt nur die Fragen aus aktiven Fachschaft-Pools (gefunden via `useStammdatenStore.lpProfil.fachschaften`).

- [ ] **Step 5: Commit der Entscheidung + Apps-Script-Code (falls Option A)**

```bash
git commit -m "Cluster C.4 Phase 4.0: Backend-Decision [A|B] dokumentiert"
```

### Task 4.1: `useFragenStore.ladeAlleVollDaten()`

**Files:**
- Modify: `src/store/fragenStore.ts` (oder passender Store)
- Modify: passender Test-File

- [ ] **Step 1: Test schreiben**

```ts
describe('useFragenStore — ladeAlleVollDaten (C.4)', () => {
  it('lädt einmalig, cached für Session', async () => { /* ... */ })
  it('returns früher bei zweitem Call (cache-hit)', async () => { /* ... */ })
  it('setzt ladestand-Flag während Loading', async () => { /* ... */ })
})
```

- [ ] **Step 2: `ladeAlleVollDaten` Action im Store**

Die Implementation HÄNGT VON OPTION A oder B aus Task 4.0 ab:

**Option A (Batch-Endpoint vorhanden):**

```ts
// store/fragenStore.ts
fragenVoll: null as Frage[] | null,
volltextLaedt: false,

ladeAlleVollDaten: async (email: string) => {
  const state = get()
  if (state.fragenVoll || state.volltextLaedt) return
  set({ volltextLaedt: true })
  try {
    const fragen = await ladeFragenVolltextApi(email)  // Batch aus Task 4.0 Option A
    set({ fragenVoll: fragen, volltextLaedt: false })
  } catch (err) {
    set({ volltextLaedt: false })
    throw err
  }
}
```

**Option B (Universe-Cap auf aktive Pools):**

```ts
ladeAlleVollDaten: async (email: string) => {
  const state = get()
  if (state.fragenVoll || state.volltextLaedt) return
  set({ volltextLaedt: true })
  try {
    // Nur aktive Fachschaft-Pools (max ~200 Fragen)
    const aktiveFachschaften = useStammdatenStore.getState().lpProfil?.fachschaften ?? []
    const fragen: Frage[] = []
    for (const fs of aktiveFachschaften) {
      const poolFragen = await ladePoolFragenVollAdapter(email, fs)  // existierender API-Call
      fragen.push(...poolFragen)
    }
    set({ fragenVoll: fragen, volltextLaedt: false })
  } catch (err) {
    set({ volltextLaedt: false })
    throw err
  }
}
```

- [ ] **Step 3-5: Tests + Commit**

```bash
git commit -m "Cluster C.4 Phase 4.1: useFragenStore.ladeAlleVollDaten() + cache"
```

### Task 4.2: `generiereSnippet()` Helper + Tests

**Files:**
- Create: `src/utils/sucheVolltextHelpers.ts`
- Create: `src/utils/sucheVolltextHelpers.test.ts`

- [ ] **Step 1: Tests schreiben (5 Cases)**

```ts
import { generiereSnippet } from './sucheVolltextHelpers'

describe('generiereSnippet', () => {
  it('zentriert um Match-Stelle mit Kontext', () => {
    const t = 'Lorem ipsum dolor sit amet, welcher der folgenden Bilanz-Posten zählt zum Anlagevermögen, consectetur'
    const snippet = generiereSnippet(t, 'Bilanz', 30)
    expect(snippet).toMatch(/Bilanz/)
    expect(snippet.length).toBeLessThan(t.length)
  })
  it('Match am Anfang — kein "…"-Prefix', () => {
    expect(generiereSnippet('Bilanz ist wichtig', 'Bilanz', 30)).toMatch(/^Bilanz/)
  })
  it('Match am Ende — kein "…"-Suffix', () => {
    expect(generiereSnippet('Wichtig ist Bilanz', 'Bilanz', 30)).toMatch(/Bilanz$/)
  })
  it('kein Match → kompletten String trunkiert', () => {
    expect(generiereSnippet('abc def ghi', 'xyz', 5)).toBe('abc def ghi'.slice(0, 5*2 + 3))
  })
  it('leerer Text → leerer Snippet', () => {
    expect(generiereSnippet('', 'q', 5)).toBe('')
  })
})
```

- [ ] **Step 2-3: Implementation + Tests laufen**

```ts
// src/utils/sucheVolltextHelpers.ts
import { normalizeForSuche } from './sucheEngine'

export function generiereSnippet(text: string, query: string, kontext: number): string {
  if (!text) return ''
  const n = normalizeForSuche(query)
  const tLower = normalizeForSuche(text)
  const idx = tLower.indexOf(n)
  if (idx < 0) {
    return text.length > kontext * 2 + 3 ? text.slice(0, kontext * 2 + 3) : text
  }
  const start = Math.max(0, idx - kontext)
  const end = Math.min(text.length, idx + n.length + kontext)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + text.slice(start, end) + suffix
}
```

- [ ] **Step 4: Commit**

```bash
git commit -m "Cluster C.4 Phase 4.2: generiereSnippet Helper + 5 Tests"
```

### Task 4.3: `indexFragenVolltext` Adapter + Tests

**Files:**
- Modify: `src/utils/sucheAdapter.ts`
- Modify: `src/utils/sucheAdapter.test.ts`

- [ ] **Step 1: Tests schreiben (10 Cases)**

```ts
describe('indexFragenVolltext (C.4)', () => {
  const fragen: Frage[] = [
    { id: '1', fragetext: 'Frage zur Bilanz', musterlosung: 'Anlagevermögen', /* … */ },
    { id: '2', fragetext: 'Was ist Konjunktur?', musterlosung: 'Wirtschaftszyklus', /* … */ },
  ]
  it('matched Fragetext (subTitel-Score)', () => { /* ... */ })
  it('matched Musterlösung', () => { /* ... */ })
  it('Titel-Match hat höchste Priorität (überschreibt Volltext-Match)', () => { /* ... */ })
  it('Snippet im subTitel statt thema bei Volltext-Match', () => { /* ... */ })
  it('Highlight im snippet', () => { /* ... */ })
  it('leere Musterlösung → kein Crash', () => { /* ... */ })
  // ... weitere 4 Cases (F.4-Filter, leeres Array, etc.)
})
```

- [ ] **Step 2: Adapter implementieren**

```ts
import type { Frage } from '../types/fragen-storage'
import { generiereSnippet } from './sucheVolltextHelpers'

export function indexFragenVolltext(query: string, fragen: Frage[]): SucheTreffer[] {
  const treffer: SucheTreffer[] = []
  for (const f of fragen) {
    // Basis-Match (analog indexFragen)
    const titel = f.fragetext.length > 80 ? f.fragetext.slice(0, 77) + '…' : f.fragetext
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const idScore = scoreFromMatch(f.id, query, 'id')
    const tagText = tagsAlsText(f.tagIds ?? [])
    const tagScore = tagText ? scoreFromMatch(tagText, query, 'tag') : 0
    const themaScore = f.thema ? scoreFromMatch(f.thema, query, 'tag') : 0
    // Volltext-Felder
    const fragetextScore = scoreFromMatch(f.fragetext, query, 'subTitel')
    const loesungScore = typeof f.musterlosung === 'string'
      ? scoreFromMatch(f.musterlosung, query, 'subTitel')
      : 0

    const score = Math.max(titelScore, idScore, tagScore, themaScore, fragetextScore, loesungScore)
    if (score === 0) continue

    const volltextMatch = score === fragetextScore || score === loesungScore
    const snippet = volltextMatch
      ? generiereSnippet(score === loesungScore ? (f.musterlosung as string) : f.fragetext, query, 50)
      : (f.thema || undefined)

    treffer.push({
      quelle: 'frage',
      id: f.id,
      titel,
      subTitel: snippet,
      highlightStellen: findeHighlightStellen(volltextMatch ? snippet! : titel, query, volltextMatch ? 'subTitel' : 'titel'),
      navigation: { route: ROUTE_BUILDERS.frage(f.id) },
      score,
      iconKey: 'frage',
    })
  }
  return treffer
}
```

- [ ] **Step 3-5: Tests + Commit**

```bash
git commit -m "Cluster C.4 Phase 4.3: indexFragenVolltext Adapter + 10 Tests"
```

### Task 4.4: `fuehreSucheAus` Volltext-Opt-In

**Files:**
- Modify: `src/types/suche.ts` (`SucheIndex.fragenVoll`)
- Modify: `src/utils/sucheEngine.ts`
- Modify: `src/utils/sucheEngine.test.ts`

- [ ] **Step 1: Type-Erweiterung**

```ts
// src/types/suche.ts
export interface SucheIndex {
  // ... bestehende
  fragenVoll?: Frage[]   // ← C.4 (lazy-loaded)
}
```

- [ ] **Step 2: `fuehreSucheAus`-Signature**

```ts
export function fuehreSucheAus(
  query: string,
  index: SucheIndex,
  opts?: { volltext?: boolean },
): SucheErgebnis {
  if (normalizeForSuche(query).length < 2) return LEERES_ERGEBNIS
  if (opts?.volltext && normalizeForSuche(query).length < 3) return LEERES_ERGEBNIS  // strenger im Volltext

  const fragenAdapter = opts?.volltext && index.fragenVoll
    ? indexFragenVolltext(query, index.fragenVoll)
    : indexFragen(query, index.fragen)

  const alle: SucheTreffer[] = [
    ...indexEinstellungenTabs(query, index.einstellungenTabs),
    // ... andere
    ...fragenAdapter,
  ]
  return gruppiereUndLimitiere(alle, { maxProQuelle: 5 })
}
```

- [ ] **Step 3: Tests erweitern**

```ts
it('opts.volltext switcht Fragen-Adapter', () => {
  const result = fuehreSucheAus('Anlagevermoegen', indexMitVoll, { volltext: true })
  expect(result.treffer.find(t => t.quelle === 'frage' && t.subTitel?.includes('Anlagevermögen'))).toBeDefined()
})
it('opts.volltext min-length=3', () => {
  expect(fuehreSucheAus('ab', indexMitVoll, { volltext: true })).toEqual(LEERES_ERGEBNIS)
})
```

- [ ] **Step 4-5: Tests + Commit**

```bash
git commit -m "Cluster C.4 Phase 4.4: fuehreSucheAus opts.volltext-Branch + min-length=3"
```

### Task 4.5: Volltext-Toggle UI im Suche-Dropdown

**Files:**
- Modify: `src/components/lp/header/LPGlobalSuche.tsx` (oder shared/header/GlobalSuche.tsx — Audit)

- [ ] **Step 1: Audit — wo lebt der Dropdown-Container?**

```bash
cd ExamLab && grep -n "useGlobalSuche\|volltext\|Toggle" src/components/lp/header/LPGlobalSuche.tsx src/components/shared/header/GlobalSuche.tsx | head -10
```

- [ ] **Step 2: Pill-Toggle UI rechts vom Input**

```tsx
const [volltextAktiv, setVolltextAktiv] = useState(false)
// ...
<div className="flex items-center gap-2">
  <input … />
  <button
    type="button"
    onClick={() => setVolltextAktiv(v => !v)}
    className={`px-2 py-1 text-xs rounded-full border ${volltextAktiv ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-slate-100 border-slate-300 text-slate-600'}`}
    title="Sucht zusätzlich in Fragetext und Musterlösung. Langsamer."
  >
    Volltext
  </button>
</div>
```

- [ ] **Step 3: tsc + Tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "Cluster C.4 Phase 4.5: Volltext-Toggle UI im Suche-Dropdown"
```

### Task 4.6: Hook-Integration `volltextAktiv` + Lazy-Load-Trigger

**Files:**
- Modify: `src/hooks/useGlobalSuche.shared.ts` (oder LP-Hook)
- Modify: passender Test-File

- [ ] **Step 1: Test schreiben**

```ts
describe('useGlobalSuche — Volltext-Modus', () => {
  it('triggered ladeAlleVollDaten bei volltextAktiv=true', async () => { /* ... */ })
  it('zeigt Spinner-State während Loading', async () => { /* ... */ })
  it('switched zu Volltext-Adapter wenn Daten geladen', async () => { /* ... */ })
})
```

- [ ] **Step 2: Hook-Patch**

```ts
// useGlobalSuche.shared.ts (LP-Pfad)
const fragenVoll = useFragenStore(s => s.fragenVoll)
const volltextLaedt = useFragenStore(s => s.volltextLaedt)
const ladeAlleVollDaten = useFragenStore(s => s.ladeAlleVollDaten)

// volltextAktiv kommt als Param oder State
useEffect(() => {
  if (volltextAktiv && !fragenVoll && !volltextLaedt && email) {
    ladeAlleVollDaten(email)
  }
}, [volltextAktiv, fragenVoll, volltextLaedt, email, ladeAlleVollDaten])

// fuehreSucheAus mit opts:
const result = useMemo(
  () => fuehreSucheAus(debouncedQuery, { ...index, fragenVoll: fragenVoll ?? undefined }, { volltext: volltextAktiv }),
  [debouncedQuery, index, fragenVoll, volltextAktiv],
)

// Debounce höher im Volltext-Modus:
const debouncedQuery = useDebouncedValue(query, volltextAktiv ? 300 : 100)
```

- [ ] **Step 3: Tests + Commit**

```bash
git commit -m "Cluster C.4 Phase 4.6: useGlobalSuche Volltext-State + lazy-Load + 300ms-Debounce"
```

### Task 4.7: Performance-Smoke Volltext

**Files:**
- Modify: `src/utils/sucheEngine.perf.test.ts`

- [ ] **Step 1: Performance-Test**

```ts
describe('Performance — Volltext (C.4)', () => {
  it('1000 Fragen x 5 Volltext-queries < 200ms', () => {
    const fragen: Frage[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `q-${i}`,
      fragetext: `Fragetext ${i} mit Begriff Bilanz und Konjunktur und 20 weiteren Wörtern lorem ipsum dolor sit amet`,
      musterlosung: `Musterlösung Aktien Passiva Bilanz Anlagevermögen ${i}`,
      // ... weitere Pflichtfelder
    }))
    const queries = ['Bilanz', 'Anlagevermoegen', 'Konjunktur', 'Aktien', 'Passiva']
    const start = performance.now()
    for (const q of queries) indexFragenVolltext(q, fragen)
    expect(performance.now() - start).toBeLessThan(200)
  })
})
```

- [ ] **Step 2-3: Test laufen + Commit**

```bash
git commit -m "Cluster C.4 Phase 4.7: Volltext Performance-Smoke 1000 Fragen x 5 queries"
```

### Task 4.8: Phase C.4 Push + E2E + Memory-Update

**Files:** keine — verification + Memory.

- [ ] **Step 1: ci-check + Push**

```bash
cd ExamLab && npm run ci-check
git push origin feature/cluster-c-2-bis-c-5-spec-2026-05-17:preview
```

- [ ] **Step 2: Browser-E2E**

LP:
1. Globale Suche → Toggle "Volltext" aktivieren → Spinner "Volltext wird vorbereitet …"
2. Nach Load: "Anlagevermögen" tippen → Treffer mit Snippet aus Fragetext sichtbar
3. Toggle wieder OFF → schnelle Suche, kein Snippet mehr

- [ ] **Step 3: Memory-Update + HANDOFF**

Cluster C.2-C.5 als KOMPLETT LIVE markieren. Apps-Script-Decision dokumentieren.

- [ ] **Step 4: FF-Merge zu main**

```bash
git checkout main && git pull && git merge --ff-only feature/cluster-c-2-bis-c-5-spec-2026-05-17 && git push origin main
```

---

## Post-Cluster Cleanup

### Task 5.1: Branch-Cleanup + Final HANDOFF

- [ ] **Step 1: Branch lokal löschen**

```bash
git branch -d feature/cluster-c-2-bis-c-5-spec-2026-05-17
```

- [ ] **Step 2: HANDOFF.md final update**

- [ ] **Step 3: Memory final update** — Cluster C.2-C.5 LIVE, alle 4 Features dokumentiert, F.4-OoS resolved.

---

## Test-Coverage-Schätzung

| Phase | Neue Tests | Kumulativ vitest |
|---|---|---|
| Start | — | 1926 + 4 todo |
| C.5 | +17 (10 levenshtein + 8 fuzzy + 1 perf) | ~1943 |
| C.3 | +12 (7 route-builders + 2 fragenbrowser + 3 lpstartseite) | ~1955 |
| C.2 | +18 (8 indexSchueler + 1 sus-permission + 7 klassenlistenTab + 2 useSucheIndex) | ~1973 |
| C.4 | +27 (10 indexFragenVolltext + 5 snippet + 3 fuehreSucheAus + 3 hook + 1 perf + 5 ladeAlleVollDaten) | ~2000 |

**Erwartung: vitest ~2000 + 4 todo nach Cluster-Komplettierung.**

---

## Skill-Referenzen

- @superpowers:test-driven-development — TDD-Pattern für jeden Adapter + Hook
- @superpowers:verification-before-completion — Browser-E2E vor jedem main-Merge
- @superpowers:executing-plans oder @superpowers:subagent-driven-development — Plan-Execution
- @superpowers:requesting-code-review — Optional zwischen Phasen falls grosse Refactors aufkommen
