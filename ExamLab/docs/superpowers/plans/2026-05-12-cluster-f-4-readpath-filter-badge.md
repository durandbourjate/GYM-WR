# Cluster F.4 — Read-Pfad-Filter + TestBadge-Konsumenten Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Frontend-side Filterung der Testdaten in allen LP-Listen-Surfaces (zentralisiert über `useLPConfigFiltering` + Korrektur-Dashboard + Favoriten) und sichtbare `<TestBadge />`-Markierung in `PruefungsKarte` + Schüler-Zeile, abhängig vom `lpProfil.testdatenSichtbar`-Toggle (F.3).

**Architecture:** Filter geschieht **at-render-time im Frontend**, kein Apps-Script-Touch. Pivot-Stelle für Prüfungs-/Übungs-Listen ist `useLPConfigFiltering` (zentraler Hook, propagiert zu Hauptliste/letzteFuenf/favoritenConfigs/multiDashboardCfgs automatisch). Korrektur-Schüler-Listen sind separater Pfad (über Klasse-Filter). `<TestBadge />` und `useTestBadgeVisible` aus F.3 werden direkt re-used; neuer DRY-Selektor-Hook `useTestdatenSichtbar` als Single-Source für den Toggle-State.

**Tech Stack:** React 19 + TypeScript + Zustand + Vitest. F.1 `filtereTestdatenWennDeaktiviert<T>` + `istTestdaten` werden direkt konsumiert.

---

## Spec-Referenz

- **Spec:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md` §5.2 Frontend-Filter-Layer + Read-Pfad-Audit + Test-Badge + §10.3 Read-Pfad-Audit.
- **Vorgänger-Bundles:** F.1 (`filter.ts` + `identifikation.ts`), F.2 (Apps-Script-Backend), F.3 (TestdatenTab + TestBadge + Hooks).

## Plan-Phase Audit-Befunde

- **Zentrale Filter-Stelle für 4 LP-Listen:** `useLPConfigFiltering` (`src/hooks/useLPConfigFiltering.ts:24`) ist ein Pure-Hook, der **alle** LP-Config-Listen erzeugt (`gefilterteConfigs`, `gefilterteUebungen`, `letzteFuenf`, `summativeConfigs`, `formativeConfigs`). LPStartseite konsumiert daraus alles. Filter-Pipeline läuft durch `filtereConfigs(basisConfigs)` als gemeinsamer Helper im Hook. **Ein Filter-Add an dieser Stelle gilt für alle 4 Listen.**
- **`PruefungsKarte`** (`src/components/lp/startseite/PruefungsKarte.tsx`) ist die einzige Card-Komponente für LP-Configs — TestBadge-Slot kommt einmal hier rein.
- **`KorrekturDashboard`** (`src/components/lp/korrektur/KorrekturDashboard.tsx`) rendert SchülerZeilen — separater Pfad, eigener Filter + Badge nötig. Schüler-Records haben `email`+`klasse` → istTestdaten-tauglich.
- **`Favoriten.tsx`** rendert Favorit-Liste — Favorit hat `typ`+`ziel`; `ziel` ist Config-ID bei `typ=pruefung/uebung`. Filter via `istTestdaten({ id: f.ziel })` wenn typ pruefung/uebung.
- **`MultiDashboardDialog`** konsumiert `gefilterteConfigs` von LPStartseite → erbt Filter automatisch via Props (kein eigener Touch nötig). Verifiziert via grep.
- **SuS-Sicht (Out-of-Scope laut Spec §8):** `wr.test` sieht immer Testdaten, andere SuS sehen sie nie via Backend-Filter — kein Frontend-Filter nötig in `components/sus/`.
- **Apps-Script-side Filter (Out-of-Scope):** Keine API-Endpoints werden geändert. `ladeAlleConfigs` liefert weiter alle Configs, Frontend entscheidet at-render-time. Vereinfachung weil weder LP noch SuS Server-side gefiltert werden müssen.
- **Fragensammlung NICHT gefiltert** (Spec §5.2 Ausnahme).
- **DRY-Selektor:** Multiple Surfaces lesen den gleichen `lpProfil?.testdatenSichtbar ?? false`-State → `useTestdatenSichtbar`-Hook für DRY + Konsistenz.

## File Structure

**Create (1 neu + 1 Test):**
- `ExamLab/src/hooks/useTestdatenSichtbar.ts` — DRY-Selektor-Hook
- `ExamLab/src/hooks/useTestdatenSichtbar.test.tsx`

**Modify (5):**
- `ExamLab/src/hooks/useLPConfigFiltering.ts` — `testdatenSichtbar`-Input + Filter-Step
- `ExamLab/src/hooks/useLPDashboardData.ts` (oder LPStartseite-Caller) — Hook-Input injizieren
- `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx` — `<TestBadge />`-Slot
- `ExamLab/src/components/lp/korrektur/KorrekturDashboard.tsx` — Schüler-Filter + Badge
- `ExamLab/src/components/lp/Favoriten.tsx` — Filter (typ=pruefung/uebung mit test-Ziel)

**Test-Modify:**
- `ExamLab/src/hooks/useLPConfigFiltering.test.ts` — neue Filter-Test-Cases (wenn die Test-Datei existiert; sonst Spawn-Task)

---

## Task 1: useTestdatenSichtbar-Hook (DRY)

**Files:**
- Create: `ExamLab/src/hooks/useTestdatenSichtbar.ts`
- Test: `ExamLab/src/hooks/useTestdatenSichtbar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/hooks/useTestdatenSichtbar.test.tsx
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestdatenSichtbar } from './useTestdatenSichtbar'

const mockStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

describe('useTestdatenSichtbar', () => {
  beforeEach(() => { mockStore.lpProfil = null })

  it('false wenn lpProfil null', () => {
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })

  it('false wenn testdatenSichtbar undefined (default-Pfad)', () => {
    mockStore.lpProfil = {}
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })

  it('true wenn explizit true', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(true)
  })

  it('false wenn explizit false', () => {
    mockStore.lpProfil = { testdatenSichtbar: false }
    const { result } = renderHook(() => useTestdatenSichtbar())
    expect(result.current).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/hooks/useTestdatenSichtbar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementation**

```ts
// ExamLab/src/hooks/useTestdatenSichtbar.ts
import { useStammdatenStore } from '../store/stammdatenStore'

/**
 * DRY-Selektor für den globalen Sichtbarkeit-Toggle aus dem LP-Profil (F.3 Cluster).
 * Konsumiert von F.4 Read-Pfad-Filtern + TestBadge-Konsumenten.
 */
export function useTestdatenSichtbar(): boolean {
  return useStammdatenStore(s => s.lpProfil?.testdatenSichtbar ?? false)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/hooks/useTestdatenSichtbar.test.tsx`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useTestdatenSichtbar.ts ExamLab/src/hooks/useTestdatenSichtbar.test.tsx
git commit -m "ExamLab F.4 Task 1: useTestdatenSichtbar-Hook (DRY-Selektor, 4 Tests)"
```

---

## Task 2: useLPConfigFiltering um Testdaten-Filter erweitern

**Files:**
- Modify: `ExamLab/src/hooks/useLPConfigFiltering.ts` (`UseLPConfigFilteringInputs` + `filtereConfigs`)
- Test: `ExamLab/src/hooks/useLPConfigFiltering.test.ts` (falls existiert; sonst neuer Test-File)

**Verhalten:** Neuer Input `testdatenSichtbar: boolean`. Wenn `false`, werden Test-Configs (id startswith `test-` ODER klasse `test-klasse-01`) aus **allen** Output-Listen (gefilterteConfigs/gefilterteUebungen/letzteFuenf/summativeConfigs/formativeConfigs) gefiltert.

- [ ] **Step 1: Verifiziere ob Test-File existiert**

Run: `ls ExamLab/src/hooks/useLPConfigFiltering.test.ts 2>&1`

Wenn EXISTS: erweitere bestehenden Test um neue Cases.
Wenn NOT EXISTS: erstelle neuen Test-File.

- [ ] **Step 2: Write/Erweitere failing test**

```ts
// ExamLab/src/hooks/useLPConfigFiltering.test.ts (Neu oder erweitert)
import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useLPConfigFiltering, type UseLPConfigFilteringInputs } from './useLPConfigFiltering'
import type { PruefungsConfig } from '../types/pruefung'

const mkConfig = (over: Partial<PruefungsConfig>): PruefungsConfig => ({
  id: 'p1', titel: 'P1', klasse: '29c', gefaess: 'SF', semester: 'HS25',
  fachbereiche: ['WR'], datum: '2026-05-12', typ: 'summativ', modus: 'pruefung',
  dauerMinuten: 60, zeitModus: 'countdown', gesamtpunkte: 30, erlaubteKlasse: '29c',
  sebErforderlich: false, abschnitte: [], ...over,
} as PruefungsConfig)

const baseInputs: Omit<UseLPConfigFilteringInputs, 'configs' | 'testdatenSichtbar'> = {
  suchtext: '', filterFach: [], filterTyp: null, filterGefaess: null,
  sortierung: 'datum', filterStatus: 'alle',
}

describe('useLPConfigFiltering — Testdaten-Filter', () => {
  const echteConfig = mkConfig({ id: 'p1', klasse: '29c' })
  const testConfigViaId = mkConfig({ id: 'test-p1', klasse: '29c' })
  const testConfigViaKlasse = mkConfig({ id: 'p2', klasse: 'test-klasse-01' })

  it('testdatenSichtbar=false filtert Test-Configs via id-Prefix raus', () => {
    const { result } = renderHook(() => useLPConfigFiltering({
      ...baseInputs, configs: [echteConfig, testConfigViaId], testdatenSichtbar: false,
    }))
    expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['p1'])
  })

  it('testdatenSichtbar=false filtert Test-Configs via klasse raus', () => {
    const { result } = renderHook(() => useLPConfigFiltering({
      ...baseInputs, configs: [echteConfig, testConfigViaKlasse], testdatenSichtbar: false,
    }))
    expect(result.current.gefilterteConfigs.map(c => c.id)).toEqual(['p1'])
  })

  it('testdatenSichtbar=true lässt Test-Configs durch', () => {
    const { result } = renderHook(() => useLPConfigFiltering({
      ...baseInputs, configs: [echteConfig, testConfigViaId, testConfigViaKlasse], testdatenSichtbar: true,
    }))
    expect(result.current.gefilterteConfigs.map(c => c.id).sort()).toEqual(['p1', 'p2', 'test-p1'])
  })

  it('Filter propagiert zu letzteFuenf', () => {
    const { result } = renderHook(() => useLPConfigFiltering({
      ...baseInputs, configs: [echteConfig, testConfigViaId], testdatenSichtbar: false,
    }))
    expect(result.current.letzteFuenf.every(c => !c.id.startsWith('test-'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/hooks/useLPConfigFiltering.test.ts`
Expected: FAIL — `testdatenSichtbar` ist kein Input des Hooks.

- [ ] **Step 4: Implementation — Input + Filter-Step**

Edit `ExamLab/src/hooks/useLPConfigFiltering.ts`:

a) `UseLPConfigFilteringInputs`-Interface um Feld erweitern:

```ts
export interface UseLPConfigFilteringInputs {
  configs: PruefungsConfig[]
  suchtext: string
  filterFach: string[]
  filterTyp: string | null
  filterGefaess: string | null
  sortierung: 'datum' | 'titel' | 'klasse'
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  /** Cluster F.4: Wenn false, werden Test-Configs (id-prefix oder klasse) raus-gefiltert. */
  testdatenSichtbar: boolean
}
```

b) Im `useLPConfigFiltering`-Body neuer Import:

```ts
import { filtereTestdatenWennDeaktiviert } from '../utils/testdaten/filter'
```

c) Destrukturierung + `filtereConfigs`-Pipeline:

```ts
const { configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus, testdatenSichtbar } = inputs
```

Und in `filtereConfigs(basisConfigs)` als ERSTEN Filter-Step (nach `result = [...basisConfigs]`):

```ts
function filtereConfigs(basisConfigs: PruefungsConfig[]): PruefungsConfig[] {
  let result = filtereTestdatenWennDeaktiviert([...basisConfigs], testdatenSichtbar)
  // Status-Filter (Archiv) ...
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/hooks/useLPConfigFiltering.test.ts`
Expected: 4 passed.

- [ ] **Step 6: Update Callers — useLPConfigFiltering-Konsumenten brauchen neuen Input**

Run: `cd ExamLab && grep -rn "useLPConfigFiltering" src --include="*.ts" --include="*.tsx" | grep -v "\.test\."`

Erwartete Konsumenten: 1-2 Stellen (vermutlich LPStartseite). Pro Caller: Hook-Aufruf um `testdatenSichtbar: testdatenSichtbar` ergänzen, wo `testdatenSichtbar` aus `useTestdatenSichtbar()` kommt.

Beispiel-Pattern für Caller-Update:

```tsx
import { useTestdatenSichtbar } from '../../hooks/useTestdatenSichtbar'
// ...
const testdatenSichtbar = useTestdatenSichtbar()
const { gefilterteConfigs, ... } = useLPConfigFiltering({
  configs, suchtext, filterFach, filterTyp, filterGefaess, sortierung, filterStatus,
  testdatenSichtbar,
})
```

- [ ] **Step 7: Full tsc + vitest**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: clean, +4 Tests (Baseline 1611 → 1615).

- [ ] **Step 8: Commit**

```bash
git add ExamLab/src/hooks/useLPConfigFiltering.ts ExamLab/src/hooks/useLPConfigFiltering.test.ts ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "ExamLab F.4 Task 2: useLPConfigFiltering um testdatenSichtbar-Input + Filter-Step (4 neue Tests, propagiert zu allen 4 LP-Listen)"
```

---

## Task 3: PruefungsKarte TestBadge-Slot

**Files:**
- Modify: `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx`
- Test: `ExamLab/src/components/lp/startseite/PruefungsKarte.test.tsx` (falls existiert; sonst neu)

**Verhalten:** `<TestBadge />` rendert neben Titel (oder Klasse-Subtext) wenn `useTestBadgeVisible({ id: c.id, klasse: c.klasse })` → true.

- [ ] **Step 1: Write failing test**

```tsx
// ExamLab/src/components/lp/startseite/PruefungsKarte.test.tsx (neu oder erweitert)
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PruefungsKarte } from './PruefungsKarte'
import type { PruefungsConfig } from '../../../types/pruefung'

const mockStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))

vi.mock('../../../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStore) => unknown) => sel(mockStore),
}))

vi.mock('../../../store/favoritenStore', () => ({
  useFavoritenStore: (sel?: any) => {
    const state = { toggleFavorit: vi.fn(), istFavorit: () => false }
    return sel ? sel(state) : state
  },
}))

const mkConfig = (over: Partial<PruefungsConfig>): PruefungsConfig => ({
  id: 'p1', titel: 'Test-Prüfung', klasse: '29c', gefaess: 'SF', semester: 'HS25',
  fachbereiche: ['WR'], datum: '2026-05-12', typ: 'summativ', modus: 'pruefung',
  dauerMinuten: 60, zeitModus: 'countdown', gesamtpunkte: 30, erlaubteKlasse: '29c',
  sebErforderlich: false, abschnitte: [], ...over,
} as PruefungsConfig)

const noop = () => {}

describe('PruefungsKarte — TestBadge', () => {
  it('zeigt TestBadge wenn Config Test-Marker hat + testdatenSichtbar=true', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    render(<PruefungsKarte config={mkConfig({ id: 'test-p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('KEIN TestBadge wenn echte Config', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    render(<PruefungsKarte config={mkConfig({ id: 'p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })

  it('KEIN TestBadge wenn Toggle aus', () => {
    mockStore.lpProfil = { testdatenSichtbar: false }
    render(<PruefungsKarte config={mkConfig({ id: 'test-p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/components/lp/startseite/PruefungsKarte.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementation**

Edit `ExamLab/src/components/lp/startseite/PruefungsKarte.tsx`:

a) Imports oben ergänzen:

```tsx
import TestBadge from '../../shared/TestBadge'
import { useTestBadgeVisible } from '../../../hooks/useTestBadgeVisible'
```

b) Im Body vor return:

```tsx
const istTestRecord = useTestBadgeVisible({ id: c.id, klasse: c.klasse })
```

c) JSX im Title-Block ergänzen (nach `<h3>{c.titel}</h3>`):

```tsx
<h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
  {c.titel}
  {istTestRecord && <TestBadge />}
</h3>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/components/lp/startseite/PruefungsKarte.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/startseite/PruefungsKarte.tsx ExamLab/src/components/lp/startseite/PruefungsKarte.test.tsx
git commit -m "ExamLab F.4 Task 3: PruefungsKarte TestBadge-Slot neben Titel (3 Tests)"
```

---

## Task 4: KorrekturDashboard Schüler-Filter + Badge

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturDashboard.tsx`
- Test: zugehöriger Test (falls existiert; sonst neu)

**Verhalten:** Schüler-Liste filtert via `filtereTestdatenWennDeaktiviert(schueler, sichtbar)` mit `{ userEmail: s.email, klasse: s.klasse }`-Mapping. `KorrekturSchuelerZeile` bekommt `<TestBadge />`-Slot neben Schüler-Namen.

**Vorab-Audit (in Implementation):** Lese `KorrekturDashboard.tsx`, identifiziere wo Schüler-Liste gerendert + welcher Type konsumiert wird. Mapping anpassen.

- [ ] **Step 1: Audit KorrekturDashboard**

Run: `cd ExamLab && grep -n "schueler\|SchuelerStatus\|SchuelerAbgabe\|\.map(" src/components/lp/korrektur/KorrekturDashboard.tsx | head -20`

Erwartet: `schueler.map(s => <KorrekturSchuelerZeile ... />)`-Pattern. Filter-Insertion-Point identifiziert.

- [ ] **Step 2: Write failing test**

Minimal-Test: simuliere Schüler-Array mit echtem + Test-Schüler, prüfe nur echter ist im Output.

(Details abhängig von Audit-Schritt 1 — Plan-Reviewer + Implementor entscheiden konkrete Form. Falls KorrekturDashboard kein eigenes Test-File hat, Spawn-Task: separater Test-File.)

- [ ] **Step 3: Run test to verify it fails**

Expected: FAIL.

- [ ] **Step 4: Implementation**

In `KorrekturDashboard.tsx`:

```tsx
import { useTestdatenSichtbar } from '../../../hooks/useTestdatenSichtbar'
import { filtereTestdatenWennDeaktiviert } from '../../../utils/testdaten/filter'
```

Filter vor Map-Render:

```tsx
const testdatenSichtbar = useTestdatenSichtbar()
const sichtbareSchueler = filtereTestdatenWennDeaktiviert(
  schueler.map(s => ({ ...s, userEmail: s.email })), // shim Email → userEmail für istTestdaten
  testdatenSichtbar,
)
```

(Anpassung je nach Schüler-Type: wenn `email` schon `userEmail` heißt, kein Mapping.)

In `KorrekturSchuelerZeile.tsx`:

```tsx
import TestBadge from '../../shared/TestBadge'
import { useTestBadgeVisible } from '../../../hooks/useTestBadgeVisible'

const istTestRecord = useTestBadgeVisible({ userEmail: schueler.email, klasse: schueler.klasse })
// JSX neben Namen: {istTestRecord && <TestBadge />}
```

- [ ] **Step 5: Run test + tsc**

Expected: passed.

- [ ] **Step 6: Commit**

```bash
git commit -m "ExamLab F.4 Task 4: KorrekturDashboard Schüler-Filter + Badge in SchuelerZeile"
```

---

## Task 5: Favoriten-Liste Filter

**Files:**
- Modify: `ExamLab/src/components/lp/Favoriten.tsx`
- Test: zugehörig

**Verhalten:** Favorit-Records mit `typ='pruefung'` oder `typ='uebung'` haben `ziel` als Config-ID. Filter via `istTestdaten({ id: f.ziel })` wenn typ entsprechend.

- [ ] **Step 1: Audit Favoriten.tsx**

Run: `cd ExamLab && head -60 src/components/lp/Favoriten.tsx`

Identifiziere Render-Map-Stelle.

- [ ] **Step 2: Write failing test**

```tsx
// Test prüft: wenn typ=pruefung mit ziel='test-p1' → bei testdatenSichtbar=false rausgefiltert
```

- [ ] **Step 3: Implementation**

```tsx
import { useTestdatenSichtbar } from '../../hooks/useTestdatenSichtbar'
import { istTestdaten } from '../../utils/testdaten/filter'

const testdatenSichtbar = useTestdatenSichtbar()
const sichtbareFavoriten = testdatenSichtbar
  ? favoriten
  : favoriten.filter(f => {
      if (f.typ !== 'pruefung' && f.typ !== 'uebung') return true
      return !istTestdaten({ id: f.ziel })
    })
```

- [ ] **Step 4: Run test + commit**

```bash
git commit -m "ExamLab F.4 Task 5: Favoriten-Liste filtert Test-Configs bei Toggle aus"
```

---

## Task 6: Final-Verify (tsc + lint + vitest + build + Browser-E2E)

- [ ] **Step 1: Full Suite**

Run: `cd ExamLab && npx tsc -b && npx vitest run`
Expected: 1611 + 11-14 neue = ~1622-1625 passed.

- [ ] **Step 2: 5× Lint**

Run: `cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract`
Expected: alle clean.

- [ ] **Step 3: Build**

Run: `cd ExamLab && npm run build`
Expected: grün.

- [ ] **Step 4: HANDOFF-Block schreiben**

In `ExamLab/HANDOFF.md` neuen Block „Cluster F.4 — Read-Pfad-Filter + TestBadge-Konsumenten ✅ MERGED" direkt vor F.3.

- [ ] **Step 5: Commit + Push preview**

```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab F.4 Task 6: HANDOFF-Eintrag + Final-Verify"
git push origin feature/cluster-f-4-readpath-filter-badge:preview
```

- [ ] **Step 6: Browser-E2E auf Staging**

Nach GH-Build (~5min):
- Yannick-Admin: Toggle aus → Listen ohne „[Test] Einführungsprüfung WR"
- Yannick-Admin: Toggle ein → „[Test] Einführungsprüfung WR" sichtbar **mit TestBadge** rechts vom Titel
- Korrektur-Tab: Schüler-Liste ohne Test-Schüler bei Toggle aus
- Favoriten: Test-Favorit bei Toggle aus weg

---

## Out-of-Scope (Spawn-Tasks)

- **Apps-Script Server-side Filter** — falls künftig Performance-Anforderung
- **Klassenlisten-Tab Filter** — separater Surface, eigenes Mini-Bundle
- **Live-Durchführen Schüler-Filter** — separater Surface (BeendetPhase/AktivPhase)
- **SuS-Sicht** — explizit Out-of-Scope laut Spec §8 (wr.test sieht immer alles)
- **PruefungsComposer Klasse-Dropdown** — Dropdown ist Stammdaten-getrieben, kein Test-Filter nötig
- **MultiDashboardDialog** — erbt Filter automatisch via Props (gefilterteConfigs als Input)

## Verifikations-Checkliste (vor Merge)

- [ ] ~11-14 neue Tests grün
- [ ] tsc clean
- [ ] 5× lint clean (insb. as-any 0/0/0, wire-contract 61/0 unverändert)
- [ ] build grün
- [ ] Browser-E2E auf Staging mit echtem Yannick-Admin-Login: Filter wirkt + Badge sichtbar
- [ ] HANDOFF aktualisiert
- [ ] Memory: `project_cluster_f_4_komplett.md` + Index
