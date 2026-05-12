# Cluster F.3 — UI-Schicht für Testdaten Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** UI-Schicht für Testdaten-Infrastruktur — Settings-Tab „Testdaten" (Status + Sichtbarkeit-Toggle + Admin-Seed/Reset), wiederverwendbare `TestBadge`-Komponente, `useTestBadgeVisible`-Hook, Confirm-Modal beim Reset.

**Architecture:** F.1 (`identifikation.ts` + `filter.ts`) + F.2 (`testdatenApi.ts` + Apps-Script-Backend) sind bereits auf main. F.3 verbindet die Frontend-Foundation mit einer User-Surface im EinstellungenPanel. **NICHT** Teil dieses Bundles: F.4 (Read-Pfad-Filter-Integration in Stores/Listen + `TestBadge`-Konsumenten — separates Bundle). EinstellungenPanel-Migration auf Tab-Registry bleibt out-of-scope (Cluster E.x reserviert wegen kiKalibrierung-ID-Konflikt — wir ergänzen nur den `testdaten`-Eintrag im hardcoded `tabs`-Array).

**Tech Stack:** React 19 + TypeScript + Zustand + Tailwind v4 + Tiptap + Vitest. Bestehende Patterns: `useSpeicherStatus`-Hook + `SpeicherButton` (ProfilTab) für Persistenz, `fixed inset-0 z-[1000] bg-black/40` für Modal (ProblemmeldungenTab), `useStammdatenStore.istAdmin(email)` für Admin-Check.

---

## Spec-Referenz

- **Spec:** `ExamLab/docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md` §5.2 Frontend + §6.3 Onboarding-Flow + §7 Edge-Cases.
- **Vorgänger-Bundles:** F.1 Frontend-Foundation (`ecd0370`), F.2 Backend (`e8e9bb77`).

## Aufgelöste Spec-Open-Points (§11)

1. **Pruefung-zu-Frage-Persistenz:** Reference (`fragenIds: string[]`) — aus F.2 bestätigt.
2. **Mastery-Datenmodell:** pro Gruppen-Sheet, 5 fixe Sheets — aus F.2 bestätigt.
3. **Statistik-Felder:** `SeedStatistik`-Interface in `testdatenApi.ts` ist die Quelle. Display-Reihenfolge: Klasse / Kurs / Test-LP / SuS / Prüfungen / Antworten / Korrekturen / Übungen / Sessions / Fortschritt + `hinweis`.

## Plan-Phase Audit-Befunde

- **Status-Inferenz ohne neuen Backend-Read-Endpoint:** Wir leiten den Init-Status aus `Stammdaten` ab — wenn `stammdaten.klassen.includes('test-klasse-01')` UND `stammdaten.kurse.some(k => k.id === 'test-kurs-01')` → initialisiert. Funktioniert ohne Backend-Erweiterung, alle LPs lesen das bereits beim Stammdaten-Load. **Last-Seed-Datum aus Spec §5.2 A** ist optional — wird in F.3 weggelassen, weil keine Datenquelle existiert (Backend-Sheet hat es nicht persistent). Wir zeigen stattdessen nur „✓ Initialisiert" / „✗ Nicht initialisiert". Out-of-Scope-Erweiterung: persistente `letzterSeedAm`-Spalte in Configs-Sheet (separater Spawn-Task).
- **`EinstellungenTab`-Type** in `lpUIStore.ts` braucht `'testdaten'`.
- **`tabs`-Array** in `EinstellungenPanel.tsx` braucht `{ key: 'testdaten', label: 'Testdaten', sichtbar: true }`.
- **TestBadge ohne Konsumenten in F.3:** Komponente + Hook werden erstellt, aber Listen-Integration ist F.4. Pure-Komponente bleibt voll testbar via Render-Test.
- **Backend-Read-Pfad-Audit für `LPProfil.testdatenSichtbar`:** `ladeLPProfilEndpoint` (`apps-script-code.js:11621`) speichert/liest `LPProfil` als **JSON-Blob** in einer einzelnen Sheet-Cell (`JSON.stringify(profil)` / `JSON.parse(...)`) — Backend ist schemafrei für `LPProfil`. Neue Felder wie `testdatenSichtbar` persistieren automatisch ohne Apps-Script-Patch. (Memory-Lehre `feedback_backend_read_paths_audit` gilt nur für Spalten-Schema-Sheets; bei JSON-Blob-Persistenz nicht zutreffend.)
- **Mock-Pattern für `useStammdatenStore`:** Zustand-Store erlaubt Aufruf **mit** und **ohne** Selektor (`useStammdatenStore(s => s.x)` und `const { x } = useStammdatenStore()`). EinstellungenPanel nutzt beide Varianten. Alle Test-Mocks in diesem Plan MÜSSEN die `(sel?) => sel ? sel(state) : state`-Signatur verwenden, damit Mock konsistent gegen beide Aufruf-Varianten greift. **Vereinheitlichtes Mock-Pattern in allen 4 Test-Files unten.**

## File Structure

**Create (5 neue Files + 5 Tests):**
- `ExamLab/src/components/shared/TestBadge.tsx` — Pure-Komponente, `<span>Test</span>` Pill
- `ExamLab/src/components/shared/TestBadge.test.tsx`
- `ExamLab/src/hooks/useTestBadgeVisible.ts` — Hook mit `(record) => boolean`
- `ExamLab/src/hooks/useTestBadgeVisible.test.tsx`
- `ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx` — Main Tab
- `ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx`
- `ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.tsx` — Sub-Komponente
- `ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.test.tsx`
- `ExamLab/src/hooks/useTestdatenStatus.ts` — Status-Inferenz aus Stammdaten
- `ExamLab/src/hooks/useTestdatenStatus.test.tsx`

**Modify (2):**
- `ExamLab/src/store/lpUIStore.ts:7` — `EinstellungenTab`-Type um `'testdaten'` erweitern
- `ExamLab/src/components/settings/EinstellungenPanel.tsx` — `tabs`-Array + Render-Conditional + Import

**No-touch:**
- `apps-script-code.js` (alles aus F.2 da)
- `src/services/testdatenApi.ts` (vollständig aus F.2.a)
- `src/utils/testdaten/filter.ts` + `identifikation.ts` (aus F.1)
- `src/types/stammdaten.ts` (`LPProfil.testdatenSichtbar` aus F.1)

---

## Task 1: TestBadge-Komponente

**Files:**
- Create: `ExamLab/src/components/shared/TestBadge.tsx`
- Test: `ExamLab/src/components/shared/TestBadge.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/components/shared/TestBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TestBadge from './TestBadge'

describe('TestBadge', () => {
  it('rendert Pill mit Label „Test"', () => {
    render(<TestBadge />)
    const pill = screen.getByText('Test')
    expect(pill).toBeInTheDocument()
    expect(pill.tagName).toBe('SPAN')
  })

  it('appliziert Brand-Yellow-Farben mit dark-mode-Varianten', () => {
    render(<TestBadge />)
    const pill = screen.getByText('Test')
    expect(pill.className).toMatch(/bg-yellow-100/)
    expect(pill.className).toMatch(/dark:bg-yellow-900/)
    expect(pill.className).toMatch(/text-yellow-700/)
    expect(pill.className).toMatch(/dark:text-yellow-200/)
  })

  it('mergt zusätzliche className-Props', () => {
    render(<TestBadge className="ml-2" />)
    expect(screen.getByText('Test').className).toMatch(/ml-2/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/components/shared/TestBadge.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
// ExamLab/src/components/shared/TestBadge.tsx
interface Props {
  className?: string
}

export default function TestBadge({ className = '' }: Props) {
  return (
    <span
      className={`bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 text-xs font-medium rounded-full px-2 py-0.5 ${className}`.trim()}
    >
      Test
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/components/shared/TestBadge.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/TestBadge.tsx ExamLab/src/components/shared/TestBadge.test.tsx
git commit -m "ExamLab F.3 Task 1: TestBadge-Komponente (Pill mit Brand-Yellow + dark-mode + className-Merge)"
```

---

## Task 2: useTestBadgeVisible-Hook

**Files:**
- Create: `ExamLab/src/hooks/useTestBadgeVisible.ts`
- Test: `ExamLab/src/hooks/useTestBadgeVisible.test.tsx`

**Verhalten:** Hook gibt `true` zurück wenn (a) das record-Argument zu Testdaten gehört UND (b) der aktuelle LP `testdatenSichtbar=true` gesetzt hat. Konsumenten zeigen dann den `<TestBadge />`. F.4 wird das in Listen einbauen.

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/hooks/useTestBadgeVisible.test.tsx
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTestBadgeVisible } from './useTestBadgeVisible'

const mockStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))

// Mock-Pattern vereinheitlicht über alle 4 Test-Files: sel optional, gegen beide Aufruf-Varianten robust.
vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel?: any) => (sel ? sel(mockStore) : mockStore),
}))

describe('useTestBadgeVisible', () => {
  beforeEach(() => {
    mockStore.lpProfil = null
  })

  it('false wenn lpProfil null', () => {
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(false)
  })

  it('false wenn record kein Test-Record', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'sf-wr-29c' }))
    expect(result.current).toBe(false)
  })

  it('false wenn record Test-Record aber testdatenSichtbar=false', () => {
    mockStore.lpProfil = { testdatenSichtbar: false }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(false)
  })

  it('true wenn Test-Record + testdatenSichtbar=true', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ kursId: 'test-kurs-01' }))
    expect(result.current).toBe(true)
  })

  it('true für Test-Email-Record', () => {
    mockStore.lpProfil = { testdatenSichtbar: true }
    const { result } = renderHook(() => useTestBadgeVisible({ userEmail: 'wr.test@stud.gymhofwil.ch' }))
    expect(result.current).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/hooks/useTestBadgeVisible.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// ExamLab/src/hooks/useTestBadgeVisible.ts
import { useStammdatenStore } from '../store/stammdatenStore'
import { istTestdaten, type TestdatenKandidat } from '../utils/testdaten/filter'

/**
 * Liefert true wenn (a) record zu Testdaten gehört UND (b) LP `testdatenSichtbar=true` hat.
 * Konsumenten zeigen <TestBadge /> bei true.
 */
export function useTestBadgeVisible(record: TestdatenKandidat): boolean {
  const sichtbar = useStammdatenStore(s => s.lpProfil?.testdatenSichtbar ?? false)
  if (!sichtbar) return false
  return istTestdaten(record)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/hooks/useTestBadgeVisible.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useTestBadgeVisible.ts ExamLab/src/hooks/useTestBadgeVisible.test.tsx
git commit -m "ExamLab F.3 Task 2: useTestBadgeVisible-Hook (record + LP-Toggle, 5 Tests)"
```

---

## Task 3: useTestdatenStatus-Hook

**Files:**
- Create: `ExamLab/src/hooks/useTestdatenStatus.ts`
- Test: `ExamLab/src/hooks/useTestdatenStatus.test.tsx`

**Verhalten:** Inferenz aus Stammdaten — wenn beide Marker-Records (`'test-klasse-01'` in `klassen` UND `'test-kurs-01'` in `kurse`) vorhanden → `initialisiert=true`.

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/hooks/useTestdatenStatus.test.tsx
import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useTestdatenStatus } from './useTestdatenStatus'
import type { Stammdaten } from '../types/stammdaten'

const mockStore = vi.hoisted(() => ({ stammdaten: null as Stammdaten | null }))

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel?: any) => (sel ? sel(mockStore) : mockStore),
}))

const echteSD: Stammdaten = {
  fachschaften: [],
  klassen: ['29c'],
  kurse: [{ id: 'sf-wr-29c', name: 'SF WR', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }],
  admins: [],
  gefaesse: [],
  faecher: [],
}

describe('useTestdatenStatus', () => {
  it('initialisiert=false wenn stammdaten null', () => {
    mockStore.stammdaten = null
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })

  it('initialisiert=false ohne Test-Marker', () => {
    mockStore.stammdaten = echteSD
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })

  it('initialisiert=true wenn beide Marker vorhanden', () => {
    mockStore.stammdaten = {
      ...echteSD,
      klassen: ['29c', 'test-klasse-01'],
      kurse: [
        ...echteSD.kurse,
        { id: 'test-kurs-01', name: '[Test] Kurs', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['test-klasse-01'] },
      ],
    }
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(true)
  })

  it('initialisiert=false wenn nur Klasse aber kein Kurs', () => {
    mockStore.stammdaten = { ...echteSD, klassen: ['29c', 'test-klasse-01'] }
    const { result } = renderHook(() => useTestdatenStatus())
    expect(result.current.initialisiert).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/hooks/useTestdatenStatus.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// ExamLab/src/hooks/useTestdatenStatus.ts
import { useStammdatenStore } from '../store/stammdatenStore'
import { TEST_KLASSE_ID, TEST_KURS_ID } from '../utils/testdaten/identifikation'

export interface TestdatenStatus {
  initialisiert: boolean
}

/**
 * Inferenz ohne neuen Backend-Endpoint: Testdaten gelten als initialisiert,
 * wenn die Marker-Klasse + Marker-Kurs in Stammdaten vorhanden sind. F.2
 * `seedTestdatenStammdaten_` legt beide an, `loescheAlleTestdaten_` entfernt
 * sie wieder.
 */
export function useTestdatenStatus(): TestdatenStatus {
  const stammdaten = useStammdatenStore(s => s.stammdaten)
  if (!stammdaten) return { initialisiert: false }
  const hatKlasse = stammdaten.klassen.includes(TEST_KLASSE_ID)
  const hatKurs = stammdaten.kurse.some(k => k.id === TEST_KURS_ID)
  return { initialisiert: hatKlasse && hatKurs }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/hooks/useTestdatenStatus.test.tsx`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/hooks/useTestdatenStatus.ts ExamLab/src/hooks/useTestdatenStatus.test.tsx
git commit -m "ExamLab F.3 Task 3: useTestdatenStatus-Hook (Stammdaten-Inferenz, 4 Tests)"
```

---

## Task 4: ResetConfirmModal

**Files:**
- Create: `ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.tsx`
- Test: `ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.test.tsx`

**Verhalten:** Pure-Modal mit Backdrop, „Abbrechen" / „Endgültig zurücksetzen". Pattern aus `ProblemmeldungenTab` (`fixed inset-0 z-[1000]`).

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ResetConfirmModal from './ResetConfirmModal'

describe('ResetConfirmModal', () => {
  it('rendert nicht wenn offen=false', () => {
    render(<ResetConfirmModal offen={false} onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument()
  })

  it('rendert Titel + Body + 2 Buttons wenn offen=true', () => {
    render(<ResetConfirmModal offen onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    expect(screen.getByText(/Echtdaten sind nicht betroffen/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Endgültig zurücksetzen' })).toBeInTheDocument()
  })

  it('feuert onAbbrechen bei Click', () => {
    const onAbbrechen = vi.fn()
    render(<ResetConfirmModal offen onAbbrechen={onAbbrechen} onBestaetigen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onAbbrechen).toHaveBeenCalledOnce()
  })

  it('feuert onBestaetigen bei Click', () => {
    const onBestaetigen = vi.fn()
    render(<ResetConfirmModal offen onAbbrechen={() => {}} onBestaetigen={onBestaetigen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    expect(onBestaetigen).toHaveBeenCalledOnce()
  })

  it('disabled Buttons wenn loading=true', () => {
    render(<ResetConfirmModal offen loading onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Endgültig/ })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/testdaten/ResetConfirmModal.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
// ExamLab/src/components/settings/einstellungen/testdaten/ResetConfirmModal.tsx
interface Props {
  offen: boolean
  loading?: boolean
  onAbbrechen: () => void
  onBestaetigen: () => void
}

export default function ResetConfirmModal({ offen, loading = false, onAbbrechen, onBestaetigen }: Props) {
  if (!offen) return null
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Testdaten zurücksetzen?
        </h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">
          Alle Testdaten werden gelöscht und neu erzeugt. Eigene Änderungen am Testkurs
          (zusätzliche Prüfungen, Antworten, …) gehen dauerhaft verloren. Echtdaten sind
          nicht betroffen.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
            disabled={loading}
            onClick={onAbbrechen}
          >
            Abbrechen
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            disabled={loading}
            onClick={onBestaetigen}
          >
            Endgültig zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/testdaten/ResetConfirmModal.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/settings/einstellungen/testdaten/
git commit -m "ExamLab F.3 Task 4: ResetConfirmModal (Standard-Modal-Pattern, 5 Tests)"
```

---

## Task 5: TestdatenTab — Status + Sichtbarkeit-Toggle (non-Admin Pfad)

**Files:**
- Create: `ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx`
- Test: `ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx`

**Verhalten Phase 1:** Tab zeigt 2 Sektionen — A (Status) und B (Sichtbarkeit-Toggle). Admin-Sektion C kommt in Task 6.

- [ ] **Step 1: Write the failing test**

```tsx
// ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TestdatenTab from './TestdatenTab'
import type { Stammdaten, LPProfil } from '../../../types/stammdaten'

const speichereLPProfil = vi.fn()
const istAdminFn = vi.fn(() => false)
const toastAdd = vi.fn()

vi.mock('../../../store/toastStore', () => ({
  useToastStore: Object.assign(
    (sel?: any) => (sel ? sel({ add: toastAdd }) : { add: toastAdd }),
    { getState: () => ({ add: toastAdd }) },
  ),
}))

const echteSD: Stammdaten = {
  fachschaften: [], klassen: ['29c'],
  kurse: [{ id: 'sf-wr-29c', name: 'SF WR', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }],
  admins: [], gefaesse: [], faecher: [],
}
const initSD: Stammdaten = {
  ...echteSD,
  klassen: [...echteSD.klassen, 'test-klasse-01'],
  kurse: [...echteSD.kurse, { id: 'test-kurs-01', name: '[Test] Kurs', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['test-klasse-01'] }],
}

vi.mock('../../../store/stammdatenStore', () => ({
  useStammdatenStore: (sel?: any) => {
    const state = { stammdaten: storeState.stammdaten, lpProfil: storeState.lpProfil, speichereLPProfil, istAdmin: istAdminFn }
    return sel ? sel(state) : state
  },
}))

const storeState = { stammdaten: null as Stammdaten | null, lpProfil: null as LPProfil | null }

describe('TestdatenTab — Status + Toggle', () => {
  beforeEach(() => {
    storeState.stammdaten = null
    storeState.lpProfil = null
    speichereLPProfil.mockReset()
    toastAdd.mockReset()
    istAdminFn.mockImplementation(() => false)
  })

  it('zeigt Status „nicht initialisiert" wenn Marker fehlen', () => {
    storeState.stammdaten = echteSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.getByText(/Noch nicht erzeugt/)).toBeInTheDocument()
  })

  it('zeigt Status „initialisiert" wenn Marker vorhanden', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.getByText(/Initialisiert/)).toBeInTheDocument()
  })

  it('Toggle gespiegelt aus lpProfil.testdatenSichtbar (default false)', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    const checkbox = screen.getByLabelText(/Testdaten in meinen Listen anzeigen/) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('Toggle speichert testdatenSichtbar=true bei Click', async () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    speichereLPProfil.mockResolvedValue(true)
    render(<TestdatenTab email="lp@x.ch" />)
    fireEvent.click(screen.getByLabelText(/Testdaten in meinen Listen anzeigen/))
    await waitFor(() => expect(speichereLPProfil).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'lp@x.ch', testdatenSichtbar: true })
    ))
  })

  it('Toggle Fehler-Pfad: Toast mit error wird ausgelöst', async () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    speichereLPProfil.mockResolvedValue(false)
    render(<TestdatenTab email="lp@x.ch" />)
    fireEvent.click(screen.getByLabelText(/Testdaten in meinen Listen anzeigen/))
    await waitFor(() => expect(toastAdd).toHaveBeenCalledWith('error', expect.stringContaining('konnte nicht gespeichert')))
  })

  it('Admin-Sektion C nicht sichtbar bei non-Admin', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    istAdminFn.mockImplementation(() => false)
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.queryByRole('button', { name: /Erzeugen/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/TestdatenTab.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation (Phase 1, ohne Admin-Sektion)**

```tsx
// ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx
import { useStammdatenStore } from '../../../store/stammdatenStore'
import { useToastStore } from '../../../store/toastStore'
import { useTestdatenStatus } from '../../../hooks/useTestdatenStatus'
import type { LPProfil } from '../../../types/stammdaten'

interface Props {
  email: string
}

// Speicher-Pattern: Toggle ist Single-Field instant-save (kein expliziter Button),
// daher KEIN useSpeicherStatus + SpeicherButton (Pattern für Multi-Field-Forms).
// Stattdessen optimistic call + Toast bei Fehler.
export default function TestdatenTab({ email }: Props) {
  const lpProfil = useStammdatenStore(s => s.lpProfil)
  const speichereLPProfil = useStammdatenStore(s => s.speichereLPProfil)
  const istAdmin = useStammdatenStore(s => s.istAdmin)
  const toastAdd = useToastStore(s => s.add)
  const { initialisiert } = useTestdatenStatus()

  const admin = istAdmin(email)
  const sichtbar = lpProfil?.testdatenSichtbar ?? false

  const onToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!lpProfil) return
    const updated: LPProfil = { ...lpProfil, testdatenSichtbar: e.target.checked }
    const ok = await speichereLPProfil(updated)
    if (!ok) toastAdd('error', 'Sichtbarkeit konnte nicht gespeichert werden.')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        Testdaten
      </h3>

      {/* Sektion A: Status */}
      <section>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</h4>
        {initialisiert ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">✓ Initialisiert</p>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ✗ Noch nicht erzeugt{!admin && ' — bitte Admin kontaktieren.'}
          </p>
        )}
      </section>

      {/* Sektion B: Sichtbarkeit (alle LPs) */}
      <section>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sichtbarkeit</h4>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={sichtbar}
            onChange={onToggle}
            disabled={!lpProfil}
            className="rounded border-slate-300 dark:border-slate-600"
          />
          Testdaten in meinen Listen anzeigen
        </label>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Testdaten sind nur zum Kennenlernen und Testen. Sie sind als „Test" markiert und werden Echtdaten nie beeinflussen.
        </p>
      </section>

      {/* Sektion C: Admin (Task 6) */}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/TestdatenTab.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx
git commit -m "ExamLab F.3 Task 5: TestdatenTab Phase 1 (Status-Section + Sichtbarkeit-Toggle + Error-Toast, 6 Tests)"
```

---

## Task 6: TestdatenTab — Admin-Sektion (Seed/Reset + Confirm-Modal)

**Files:**
- Modify: `ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx`
- Modify: `ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx`

**Verhalten:** Admin sieht Sektion C — Erzeugen-Button (wenn nicht initialisiert), Reset-Button (wenn initialisiert), Statistik-Bereich nach Seed-Erfolg.

- [ ] **Step 1: Erweitere Test um Admin-Pfade**

Hänge an `TestdatenTab.test.tsx` an:

```tsx
import { apiAdminSeedTestdaten } from '../../../services/testdatenApi'

vi.mock('../../../services/testdatenApi', () => ({
  apiAdminSeedTestdaten: vi.fn(),
}))

describe('TestdatenTab — Admin-Sektion', () => {
  beforeEach(() => {
    speichereLPProfil.mockReset()
    istAdminFn.mockImplementation(() => true)
    storeState.lpProfil = { email: 'admin@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    vi.mocked(apiAdminSeedTestdaten).mockReset()
  })

  it('Admin nicht-initialisiert: zeigt „Testdaten erzeugen"-Button + KEIN Reset', () => {
    storeState.stammdaten = echteSD
    render(<TestdatenTab email="admin@x.ch" />)
    expect(screen.getByRole('button', { name: /Testdaten erzeugen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).not.toBeInTheDocument()
  })

  it('Admin initialisiert: zeigt „Zurücksetzen"-Button + KEIN Erzeugen', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    expect(screen.getByRole('button', { name: /Zurücksetzen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Erzeugen/ })).not.toBeInTheDocument()
  })

  it('„Erzeugen" feuert apiAdminSeedTestdaten mit mode=initial', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: true, statistik: { mode: 'initial', testSuSAngelegt: 20 }, dauerMs: 30000 })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    await waitFor(() => expect(apiAdminSeedTestdaten).toHaveBeenCalledWith({ email: 'admin@x.ch', mode: 'initial' }))
  })

  it('„Zurücksetzen" öffnet ConfirmModal, nicht direkt API-Call', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    expect(apiAdminSeedTestdaten).not.toHaveBeenCalled()
  })

  it('Modal-Bestätigung feuert apiAdminSeedTestdaten mit mode=reset', async () => {
    storeState.stammdaten = initSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: true, statistik: { mode: 'reset' } })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    await waitFor(() => expect(apiAdminSeedTestdaten).toHaveBeenCalledWith({ email: 'admin@x.ch', mode: 'reset' }))
  })

  it('Modal „Abbrechen" macht keinen API-Call', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(apiAdminSeedTestdaten).not.toHaveBeenCalled()
    expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument()
  })

  it('Erfolg zeigt Statistik nach Seed', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({
      success: true,
      statistik: { mode: 'initial', testSuSAngelegt: 20, testPruefungenAngelegt: 1 },
    })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    // robust gegen Drift: matche das spezifische Listen-Item, nicht nur die Zahl 20
    await waitFor(() => expect(screen.getByText(/20 SuS angelegt/)).toBeInTheDocument())
    expect(screen.getByText(/1 Prüfungen/)).toBeInTheDocument()
  })

  it('Doppel-Klick auf Erzeugen während Loading triggert nur 1 API-Call', async () => {
    storeState.stammdaten = echteSD
    let resolveSeed: ((r: any) => void) | undefined
    vi.mocked(apiAdminSeedTestdaten).mockImplementation(() => new Promise(r => { resolveSeed = r }))
    render(<TestdatenTab email="admin@x.ch" />)
    const btn = screen.getByRole('button', { name: /Testdaten erzeugen/ })
    fireEvent.click(btn)
    fireEvent.click(btn) // sofortiger 2. Klick
    expect(apiAdminSeedTestdaten).toHaveBeenCalledTimes(1)
    resolveSeed?.({ success: true, statistik: { mode: 'initial' } })
  })

  it('Modal bleibt offen während Reset-Loading, schliesst erst nach Erfolg', async () => {
    storeState.stammdaten = initSD
    let resolveReset: ((r: any) => void) | undefined
    vi.mocked(apiAdminSeedTestdaten).mockImplementation(() => new Promise(r => { resolveReset = r }))
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    // Modal noch offen während Promise pending
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    // Buttons disabled
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDisabled()
    resolveReset?.({ success: true, statistik: { mode: 'reset' } })
    await waitFor(() => expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument())
  })

  it('Fehler zeigt Error-Text', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: false, error: 'LockService timeout' })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    await waitFor(() => expect(screen.getByText(/LockService timeout/)).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run test to verify Admin-Tests fail**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/TestdatenTab.test.tsx`
Expected: 10 new failures (no buttons rendered).

- [ ] **Step 3: Erweitere TestdatenTab um Admin-Sektion**

Ersetze den Kommentar `{/* Sektion C: Admin (Task 6) */}` durch:

```tsx
import { useRef, useState } from 'react'
import { apiAdminSeedTestdaten, type SeedResponse } from '../../../services/testdatenApi'
import ResetConfirmModal from './testdaten/ResetConfirmModal'
// ... (Imports + Hooks bleiben unverändert)

// Inside Komponente:
const [seedResult, setSeedResult] = useState<SeedResponse | null>(null)
const [seedLoading, setSeedLoading] = useState(false)
const [modalOffen, setModalOffen] = useState(false)
const loadingRef = useRef(false) // Doppel-Klick-Guard (State ist stale zwischen Klicks)

const fuehreAus = async (mode: 'initial' | 'reset') => {
  if (loadingRef.current) return
  loadingRef.current = true
  setSeedLoading(true)
  setSeedResult(null)
  try {
    const result = await apiAdminSeedTestdaten({ email, mode })
    setSeedResult(result)
    if (result.success && mode === 'reset') setModalOffen(false) // erst nach Erfolg schliessen
  } finally {
    loadingRef.current = false
    setSeedLoading(false)
  }
}

// Sektion C JSX (nur wenn admin):
{admin && (
  <section>
    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Admin-Aktionen</h4>
    <div className="flex gap-2">
      {!initialisiert && (
        <button
          type="button"
          onClick={() => void fuehreAus('initial')}
          disabled={seedLoading}
          className="px-3 py-1.5 rounded text-sm bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {seedLoading ? 'Wird erzeugt…' : 'Testdaten erzeugen'}
        </button>
      )}
      {initialisiert && (
        <button
          type="button"
          onClick={() => setModalOffen(true)}
          disabled={seedLoading}
          className="px-3 py-1.5 rounded text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          Zurücksetzen
        </button>
      )}
    </div>

    {seedResult && (
      <div className="mt-3 text-sm">
        {seedResult.success ? (
          <div className="text-emerald-700 dark:text-emerald-300">
            <p className="font-medium">Erfolg{seedResult.dauerMs ? ` (${Math.round(seedResult.dauerMs / 1000)}s)` : ''}</p>
            <ul className="mt-1 text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
              {seedResult.statistik?.testSuSAngelegt !== undefined && <li>{seedResult.statistik.testSuSAngelegt} SuS angelegt</li>}
              {seedResult.statistik?.testPruefungenAngelegt !== undefined && <li>{seedResult.statistik.testPruefungenAngelegt} Prüfungen</li>}
              {seedResult.statistik?.testUebungenAngelegt !== undefined && <li>{seedResult.statistik.testUebungenAngelegt} Übungen</li>}
              {seedResult.statistik?.testSessionsAngelegt !== undefined && <li>{seedResult.statistik.testSessionsAngelegt} Sessions</li>}
            </ul>
          </div>
        ) : (
          <p className="text-rose-700 dark:text-rose-300">Fehler: {seedResult.error ?? 'Unbekannt'}</p>
        )}
      </div>
    )}

    <ResetConfirmModal
      offen={modalOffen}
      loading={seedLoading}
      onAbbrechen={() => { if (!seedLoading) setModalOffen(false) }}
      onBestaetigen={() => void fuehreAus('reset')}
    />
  </section>
)}
```

- [ ] **Step 4: Run test to verify all pass**

Run: `cd ExamLab && npx vitest run src/components/settings/einstellungen/TestdatenTab.test.tsx`
Expected: 16 passed (6 Phase 1 inkl. Fehler-Toast + 10 Admin inkl. Doppel-Klick-Guard + Modal-Open-During-Loading).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/settings/einstellungen/TestdatenTab.tsx ExamLab/src/components/settings/einstellungen/TestdatenTab.test.tsx
git commit -m "ExamLab F.3 Task 6: TestdatenTab Admin-Sektion (Seed/Reset + Confirm-Modal + Statistik + Doppel-Klick-Guard + Modal-Loading, 10 neue Tests)"
```

---

## Task 7: EinstellungenPanel-Wiring

**Files:**
- Modify: `ExamLab/src/store/lpUIStore.ts:7`
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`

**Verhalten:** Tab erscheint in EinstellungenPanel, navigierbar.

- [ ] **Step 1: Erweitere EinstellungenTab-Type**

Edit `ExamLab/src/store/lpUIStore.ts:7`:

```ts
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'uebungen' | 'admin' | 'kiKalibrierung' | 'problemmeldungen' | 'fragensammlung' | 'testdaten'
```

- [ ] **Step 2: Wire Tab in EinstellungenPanel**

Edit `ExamLab/src/components/settings/EinstellungenPanel.tsx`:

a) Import nach `import AdminTab from './einstellungen/AdminTab'`:

```ts
import TestdatenTab from './einstellungen/TestdatenTab'
```

b) Im `tabs`-Array nach `fragensammlung`:

```ts
{ key: 'fragensammlung', label: 'Fragensammlung', sichtbar: true },
{ key: 'testdaten', label: 'Testdaten', sichtbar: true },
{ key: 'admin', label: 'Admin', sichtbar: admin },
```

c) Im Render-Block nach `fragensammlung`-Conditional:

```tsx
{tab === 'testdaten' && user?.email && (
  <TestdatenTab email={user.email} />
)}
```

- [ ] **Step 3: Verifiziere via Type-Check + Build**

Run: `cd ExamLab && npx tsc -b`
Expected: clean.

Run: `cd ExamLab && npx vitest run`
Expected: vorheriger Baseline + Task-1-bis-6-Tests passed.

Run: `cd ExamLab && npm run build`
Expected: build grün.

- [ ] **Step 4: Browser-E2E (User-Aktion oder local)**

Mit echtem LP-Login `wr`:
1. Einstellungen öffnen → Tab „Testdaten" sichtbar
2. Klick → Status-Sektion + Sichtbarkeit-Toggle sichtbar
3. (Admin) Aktions-Sektion sichtbar mit Erzeugen/Zurücksetzen-Button
4. (Admin) Reset-Button → Modal öffnet → Abbrechen schliesst
5. Toggle aktivieren → kein Fehler in Konsole

Erwartung: 0 Console-Errors.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/store/lpUIStore.ts ExamLab/src/components/settings/EinstellungenPanel.tsx
git commit -m "ExamLab F.3 Task 7: EinstellungenPanel-Wiring (Tab + Type-Erweiterung)"
```

---

## Task 8: Lint + Full-Suite + Final-Commit

- [ ] **Step 1: vitest gesamte Suite**

Run: `cd ExamLab && npx vitest run`
Expected: Baseline (1576 oder höher) + 33 neue Tests (3 + 5 + 4 + 5 + 6 + 10) = ~1609 passed, drift = 0.

- [ ] **Step 2: tsc -b**

Run: `cd ExamLab && npx tsc -b`
Expected: clean.

- [ ] **Step 3: Alle 5 lints**

Run: 
```bash
cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract
```
Expected: alle clean (`wire-contract` 61/0 unverändert — F.3 fügt keine neuen Wire-Actions).

- [ ] **Step 4: vite build**

Run: `cd ExamLab && npm run build`
Expected: grün, PWA generateSW.

- [ ] **Step 5: HANDOFF-Eintrag schreiben**

Ergänze in `ExamLab/HANDOFF.md` direkt nach „Cluster B.a"-Block einen neuen Block „Cluster F.3 — UI-Schicht für Testdaten ✅ MERGED (2026-05-12)".

- [ ] **Step 6: Push + Merge-Branch**

User-Aktion: preview-Push, dann Browser-E2E mit Yannick-Admin + echtem LP-Account, dann main-Merge.

---

## Out-of-Scope (für F.4 + spätere Cluster)

- **Read-Pfad-Filter-Integration** in 8-15 Stores/Hooks (`ladeKurse`, `ladePruefungen`, `ladeUebungen`, `ladeSchueler`, `ladeAntworten`, `ladeKorrekturen`, `ladeMastery`, `ladeUebungsSessions`, alle `holeAlle*`-Pfade) — Cluster F.4.
- **TestBadge-Konsumenten** in Listen (Dashboard, Composer, Prüfen-Tab, Üben-Tab, Korrektur-Tab, Klassen-Liste) — Cluster F.4.
- **EinstellungenPanel-Migration auf Tab-Registry** — Cluster E.x (blockiert durch kiKalibrierung-ID-Konflikt).
- **`letzterSeedAm`-Persistenz** in Apps-Script Configs-Sheet (Spec §5.2 A Sub-Bullet „zuletzt: …") — optionaler Spawn-Task, separater Backend-Deploy.
- **Toast-Notification** statt inline Statistik-Anzeige — Lehre aus Bundle 3 hotfix#1 wir nutzen die kurze inline-Variante.
- **Live-E2E mit Apps-Script-Call** (Erzeugen/Reset gegen Production-Backend) — bereits aus F.2-User-Action verifiziert; F.3 nur UI-E2E.

## Verifikations-Checkliste (vor Merge)

- [ ] 33 neue Tests grün
- [ ] tsc -b clean
- [ ] 5× lint clean (wire-contract 61/0)
- [ ] build grün, PWA generateSW
- [ ] Browser-E2E mit echtem LP-Login: Tab navigierbar, Toggle persistiert
- [ ] Browser-E2E mit Admin-Account: Modal öffnet/schliesst, Buttons disabled während Loading
- [ ] 0 Console-Errors
- [ ] HANDOFF.md aktualisiert
- [ ] Memory-Update (Memory hatte F-Status als F.3/F.4 pending — F.3 wird MERGED-Eintrag)
