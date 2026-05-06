# Bundle R — Error-Handling-Vereinheitlichung Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ExamLab-weite einheitliche Toast-Surface etablieren, alle 9 `alert()`-Aufrufe migrieren, alle silent-fail `console.error`-Stellen mit User-Feedback ergänzen, Konvention in `code-quality.md` festschreiben.

**Architecture:** Zustand-Store (`toastStore`) + Hook-Wrapper (`useToast`) + Container-Komponente (`ToastContainer`) gemounted in `App.tsx`. Variants: `error` (sticky), `success`/`info`/`warning` (4s Auto-Hide). Toast-Mount via `useToastStore.getState().add(...)` in Class-Components (ErrorBoundary). Migration in 6 Phasen (Infrastruktur → 9 alerts → silent-fail-Sweep → LPStartseite-Reuse → Doku → Browser-E2E).

**Tech Stack:** React 19, TypeScript 5, Zustand 4, Tailwind CSS v4, Vitest, React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-06-bundle-r-error-handling-vereinheitlichung-design.md`

**Branch:** `feature/bundle-r-error-handling-vereinheitlichung` (bereits angelegt, ausgehend von `main` @ `9aa8b51`).

**Working directory:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY`. Alle Pfade relativ dazu, sofern nicht absolut angegeben.

**Test-Stand bei Plan-Erstellung:** 1234 vitest passes auf `main`.

---

## File Structure

| Pfad | Verantwortung | Phase |
|---|---|---|
| `ExamLab/src/store/toastStore.ts` (neu) | Zustand-Store: `toasts: Toast[]`, `add/dismiss/clear`-Actions, Auto-Hide-Timer | 1 |
| `ExamLab/src/store/toastStore.test.ts` (neu) | Store-Tests (add-Defaults, dismiss, clear, Auto-Hide-Timer) | 1 |
| `ExamLab/src/hooks/useToast.ts` (neu) | Hook-Wrapper: `error/success/info/warning/dismiss`-API | 1 |
| `ExamLab/src/hooks/useToast.test.tsx` (neu) | Hook-Tests | 1 |
| `ExamLab/src/components/shared/ToastContainer.tsx` (neu) | Render-Container, X-Dismiss, Variant-Styles, Stacking | 1 |
| `ExamLab/src/components/shared/ToastContainer.test.tsx` (neu) | Container-Tests | 1 |
| `ExamLab/src/App.tsx` (modify) | `<ToastContainer />` mounten | 1 |
| `ExamLab/src/components/ErrorBoundary.tsx` (modify) | 2 alerts ersetzen, `useToastStore.getState()`-Pattern | 2 |
| `ExamLab/src/components/ueben/admin/settings/MitgliederTab.tsx` (modify) | 1 alert ersetzen | 2 |
| `ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx` (modify) | 3 alerts ersetzen | 2 |
| `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx` (modify) | 2 window.alerts ersetzen | 2 |
| `ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx` (modify) | 1 alert ersetzen | 2 |
| Phase-3-Bucket-(b)-Files (TBD aus rg-Audit) | Silent-Fail → Toast ergänzen | 3 |
| `ExamLab/src/components/lp/LPStartseite.tsx` (modify) | Ad-hoc Toast → useToast | 4 |
| `.claude/rules/code-quality.md` (modify) | Sektion „Error-Handling" ergänzen | 5 |
| `scripts/audit-no-alert.sh` (neu, optional) | CI-Gate falls in Phase 5 entschieden | 5 |

---

## Phase 1 — Toast-Infrastruktur

### Task 1.1: `toastStore.ts` — Failing Test

**Files:**
- Create: `ExamLab/src/store/toastStore.test.ts`
- Reference: existing `ExamLab/src/store/draftStore.test.ts` für Test-Style

- [ ] **Step 1: Write the failing tests**

```ts
// ExamLab/src/store/toastStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore, DEFAULT_TOAST_AUTO_HIDE_MS } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useRealTimers()
  })

  it('add() liefert id und legt Toast in Liste', () => {
    const id = useToastStore.getState().add('error', 'Boom')
    expect(typeof id).toBe('string')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].variant).toBe('error')
    expect(useToastStore.getState().toasts[0].message).toBe('Boom')
  })

  it('error ist standardmässig sticky, success/info/warning nicht', () => {
    const errId = useToastStore.getState().add('error', 'X')
    const sucId = useToastStore.getState().add('success', 'Y')
    const infId = useToastStore.getState().add('info', 'Z')
    const warId = useToastStore.getState().add('warning', 'W')
    const t = useToastStore.getState().toasts
    expect(t.find(x => x.id === errId)?.sticky).toBe(true)
    expect(t.find(x => x.id === sucId)?.sticky).toBe(false)
    expect(t.find(x => x.id === infId)?.sticky).toBe(false)
    expect(t.find(x => x.id === warId)?.sticky).toBe(false)
  })

  it('add() respektiert opts.sticky und opts.autoHideMs', () => {
    useToastStore.getState().add('error', 'X', { sticky: false })
    useToastStore.getState().add('info', 'Y', { sticky: true })
    const t = useToastStore.getState().toasts
    expect(t[0].sticky).toBe(false)
    expect(t[1].sticky).toBe(true)
  })

  it('dismiss(id) entfernt Toast aus Liste', () => {
    const id = useToastStore.getState().add('error', 'X')
    useToastStore.getState().add('info', 'Y')
    useToastStore.getState().dismiss(id)
    const t = useToastStore.getState().toasts
    expect(t).toHaveLength(1)
    expect(t[0].variant).toBe('info')
  })

  it('clear() entfernt alle Toasts', () => {
    useToastStore.getState().add('error', 'X')
    useToastStore.getState().add('info', 'Y')
    useToastStore.getState().clear()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('non-sticky Toast verschwindet nach DEFAULT_TOAST_AUTO_HIDE_MS', async () => {
    vi.useFakeTimers()
    useToastStore.getState().add('success', 'Y')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS - 1)
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('sticky Toast verschwindet NICHT nach Auto-Hide-Zeit', () => {
    vi.useFakeTimers()
    useToastStore.getState().add('error', 'X')
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS * 5)
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('manuelles dismiss greift auch bei laufendem Auto-Hide-Timer', () => {
    vi.useFakeTimers()
    const id = useToastStore.getState().add('success', 'X')
    useToastStore.getState().dismiss(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS * 2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('autoHideMs override greift', () => {
    vi.useFakeTimers()
    useToastStore.getState().add('info', 'X', { autoHideMs: 1000 })
    vi.advanceTimersByTime(999)
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ExamLab && npx vitest run src/store/toastStore.test.ts
```

Expected: FAIL — `Cannot find module './toastStore'` (Datei existiert noch nicht).

### Task 1.2: `toastStore.ts` — Implementation

**Files:**
- Create: `ExamLab/src/store/toastStore.ts`

- [ ] **Step 1: Implement the store**

```ts
// ExamLab/src/store/toastStore.ts
import { create } from 'zustand'

export const DEFAULT_TOAST_AUTO_HIDE_MS = 4000

export type ToastVariant = 'error' | 'success' | 'info' | 'warning'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
  sticky: boolean
  createdAt: number
}

export interface ToastAddOptions {
  sticky?: boolean
  autoHideMs?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (variant: ToastVariant, message: string, opts?: ToastAddOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

function defaultStickyForVariant(variant: ToastVariant): boolean {
  return variant === 'error'
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  add: (variant, message, opts) => {
    const id = crypto.randomUUID()
    const sticky = opts?.sticky ?? defaultStickyForVariant(variant)
    const toast: Toast = {
      id,
      variant,
      message,
      sticky,
      createdAt: Date.now(),
    }
    set((state) => ({ toasts: [...state.toasts, toast] }))
    if (!sticky) {
      const ms = opts?.autoHideMs ?? DEFAULT_TOAST_AUTO_HIDE_MS
      setTimeout(() => {
        if (get().toasts.some((t) => t.id === id)) {
          get().dismiss(id)
        }
      }, ms)
    }
    return id
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
  clear: () => {
    set({ toasts: [] })
  },
}))
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd ExamLab && npx vitest run src/store/toastStore.test.ts
```

Expected: PASS — alle 9 Tests grün.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/store/toastStore.ts ExamLab/src/store/toastStore.test.ts
git commit -m "Bundle R Phase 1.1: toastStore + Tests"
```

### Task 1.3: `useToast.ts` Hook — Failing Test

**Files:**
- Create: `ExamLab/src/hooks/useToast.test.tsx`
- Reference: `ExamLab/src/hooks/useDirtyTracker.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// ExamLab/src/hooks/useToast.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToastStore } from '../store/toastStore'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('error() fügt error-Variant zum Store hinzu', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.error('Boom') })
    const t = useToastStore.getState().toasts
    expect(t).toHaveLength(1)
    expect(t[0].variant).toBe('error')
    expect(t[0].message).toBe('Boom')
  })

  it('success/info/warning rufen jeweils richtigen Variant', () => {
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.success('A')
      result.current.info('B')
      result.current.warning('C')
    })
    const t = useToastStore.getState().toasts
    expect(t.map(x => x.variant)).toEqual(['success', 'info', 'warning'])
  })

  it('dismiss(id) entfernt Toast', () => {
    const { result } = renderHook(() => useToast())
    let id: string = ''
    act(() => { id = result.current.error('X') })
    act(() => { result.current.dismiss(id) })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('opts werden durchgereicht (sticky override)', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.success('X', { sticky: true }) })
    expect(useToastStore.getState().toasts[0].sticky).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ExamLab && npx vitest run src/hooks/useToast.test.tsx
```

Expected: FAIL — `Cannot find module './useToast'`.

### Task 1.4: `useToast.ts` Hook — Implementation

**Files:**
- Create: `ExamLab/src/hooks/useToast.ts`

- [ ] **Step 1: Implement**

```ts
// ExamLab/src/hooks/useToast.ts
import { useToastStore, type ToastAddOptions, type ToastVariant } from '../store/toastStore'

interface UseToastResult {
  error: (message: string, opts?: ToastAddOptions) => string
  success: (message: string, opts?: ToastAddOptions) => string
  info: (message: string, opts?: ToastAddOptions) => string
  warning: (message: string, opts?: ToastAddOptions) => string
  dismiss: (id: string) => void
}

export function useToast(): UseToastResult {
  const store = useToastStore.getState()
  return {
    error: (message, opts) => store.add('error', message, opts),
    success: (message, opts) => store.add('success', message, opts),
    info: (message, opts) => store.add('info', message, opts),
    warning: (message, opts) => store.add('warning', message, opts),
    dismiss: (id) => store.dismiss(id),
  }
}
```

> Hinweis: Hook ruft `getState()`-Snapshot bei jedem Render — das ist OK, weil die Actions ihrerseits `set()` direkt aufrufen und kein React-State-Subscription brauchen. Der `ToastContainer` hingegen subscribed via `useToastStore(s => s.toasts)`.

- [ ] **Step 2: Run tests**

```bash
cd ExamLab && npx vitest run src/hooks/useToast.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/hooks/useToast.ts ExamLab/src/hooks/useToast.test.tsx
git commit -m "Bundle R Phase 1.2: useToast Hook + Tests"
```

### Task 1.5: `ToastContainer.tsx` — Failing Test

**Files:**
- Create: `ExamLab/src/components/shared/ToastContainer.test.tsx`
- Reference: existing `ExamLab/src/components/shared/FeedbackModal.tsx` für JSX-Style

- [ ] **Step 1: Write failing tests**

```tsx
// ExamLab/src/components/shared/ToastContainer.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToastStore } from '../../store/toastStore'
import { ToastContainer } from './ToastContainer'

describe('ToastContainer', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('rendert keine Toasts wenn Store leer', () => {
    render(<ToastContainer />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('rendert sichtbaren Toast nach add()', () => {
    useToastStore.getState().add('error', 'Boom')
    render(<ToastContainer />)
    expect(screen.getByText('Boom')).toBeInTheDocument()
  })

  it('rendert mehrere Toasts (Stack)', () => {
    useToastStore.getState().add('error', 'A')
    useToastStore.getState().add('info', 'B')
    render(<ToastContainer />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('X-Button dismisses den Toast', async () => {
    useToastStore.getState().add('error', 'Boom')
    render(<ToastContainer />)
    const btn = screen.getByRole('button', { name: /schliessen|schließen|dismiss|×/i })
    await userEvent.click(btn)
    expect(screen.queryByText('Boom')).toBeNull()
  })

  it('error-Variant hat rote Styling-Klasse', () => {
    useToastStore.getState().add('error', 'X')
    render(<ToastContainer />)
    const toast = screen.getByText('X').closest('[role="alert"]')
    expect(toast?.className).toMatch(/red/)
  })

  it('success-Variant hat grüne Styling-Klasse mit Dark-Mode-Pairing', () => {
    useToastStore.getState().add('success', 'X')
    render(<ToastContainer />)
    const toast = screen.getByText('X').closest('[role="alert"]')
    expect(toast?.className).toMatch(/green/)
    expect(toast?.className).toMatch(/dark:/)
  })
})
```

- [ ] **Step 2: Run tests to verify failure**

```bash
cd ExamLab && npx vitest run src/components/shared/ToastContainer.test.tsx
```

Expected: FAIL — `Cannot find module './ToastContainer'`.

### Task 1.6: `ToastContainer.tsx` — Implementation

**Files:**
- Create: `ExamLab/src/components/shared/ToastContainer.tsx`

- [ ] **Step 1: Implement**

```tsx
// ExamLab/src/components/shared/ToastContainer.tsx
import { useToastStore, type ToastVariant } from '../../store/toastStore'

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error:   'bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
  success: 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  info:    'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  warning: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
}

const VARIANT_ICONS: Record<ToastVariant, string> = {
  error:   '⚠️',
  success: '✓',
  info:    'ℹ️',
  warning: '⚠️',
}

export function ToastContainer(): JSX.Element | null {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[1000] flex flex-col gap-2 max-w-md pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-4 py-3 rounded-md shadow-lg border flex items-start gap-2 ${VARIANT_STYLES[t.variant]}`}
        >
          <span aria-hidden="true">{VARIANT_ICONS[t.variant]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Toast schliessen"
            className="ml-2 text-lg leading-none font-semibold opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Run tests**

```bash
cd ExamLab && npx vitest run src/components/shared/ToastContainer.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/src/components/shared/ToastContainer.tsx ExamLab/src/components/shared/ToastContainer.test.tsx
git commit -m "Bundle R Phase 1.3: ToastContainer + Tests"
```

### Task 1.7: Mount in `App.tsx`

**Files:**
- Modify: `ExamLab/src/App.tsx`

- [ ] **Step 1: Import-Statement ergänzen**

Im Import-Block oben (nach `import ThemeToggle ...`):

```ts
import { ToastContainer } from './components/shared/ToastContainer.tsx'
```

- [ ] **Step 2: ToastContainer in jedes return-Tree einfügen**

App.tsx hat mehrere Conditional-Returns. Wrapping-Strategie: Pro return, das JSX rendert (nicht die `return null`-Pfade), den Container als letztes Sibling vor dem schliessenden Fragment einfügen.

Empfohlenes Pattern für jedes Return:

```tsx
return (
  <FrageModeProvider mode="pruefung">
    <Layout />
    <ToastContainer />
  </FrageModeProvider>
)
```

Konkrete Stellen finden und JEDE patchen:
```bash
grep -n "return (" ExamLab/src/App.tsx
grep -n "</FrageModeProvider>" ExamLab/src/App.tsx
```

**Verbindlich:** Pro `</FrageModeProvider>` (oder äusserster Wrapper im jeweiligen Pfad) ein `<ToastContainer />` als Sibling davor einfügen. Mind. abgedeckt: LP-Layout-Pfad, SuS-Layout-Pfad, KorrekturEinsicht-Pfad, FragenUebersicht-Pfad. Wenn nur EIN ToastContainer mounted (z.B. neben Routes-Wurzel), MUSS er ausserhalb aller Conditional-Returns gehoben werden — sonst zeigen manche Pfade keinen Toast.

**Mount-Verifikation am Ende von Task 1.7:** Nach dem Edit DevTools-Console öffnen, einmal `useToastStore.getState().add('info', 'Mount-Test')` ausführen — Toast muss in jedem der 4 Pfade sichtbar sein (LP-Login, SuS-Login, KorrekturEinsicht, FragenUebersicht). Wenn nicht in allen Pfaden: Mount-Stelle nachpatchen.

- [ ] **Step 3: Build & Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Expected: tsc clean, alle Tests grün (1234 + 1.6 ToastContainer-Tests + Hook-Tests + Store-Tests).

- [ ] **Step 4: Manuelle Build-Verifikation**

```bash
cd ExamLab && npm run build
```

Expected: build clean, kein neuer Warn.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/App.tsx
git commit -m "Bundle R Phase 1.4: ToastContainer in App.tsx mounten"
```

### Task 1.8: rg-Audit für `console.error` (Plan-Phase-Task #1, advisory eingearbeitet)

**Files:**
- Create: `docs/superpowers/audits/2026-05-06-bundle-r-console-error-audit.md`

- [ ] **Step 1: rg-Scan ausführen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
rg -n "console\.error" ExamLab/src/components --type ts --type tsx -g '!*.test.*' -g '!__tests__/**' > /tmp/console-error-scan.txt
wc -l /tmp/console-error-scan.txt
```

- [ ] **Step 2: Bucket-Klassifikation in Markdown-Tabelle**

Pro Treffer im Scan: File:Line, kurze Pfad-Beschreibung, Bucket (a/b/c), Kommentar.

Format:

```markdown
# Bundle R — Silent-Fail-Audit

| Datei : Zeile | Code-Snippet | Bucket | Notiz |
|---|---|---|---|
| sus/SuSStartseite.tsx:55 | `console.error('Login-Bridge fehlgeschlagen — keine gültige Antwort:', response)` | b | Demo-Modus stillschweigend, User sieht nichts |
| sus/SuSStartseite.tsx:79 | `console.error('Login-Bridge Fehler:', error)` | b | s.o. |
| ... | ... | ... | ... |
```

- [ ] **Step 3: Bucket-Liste committen**

```bash
git add docs/superpowers/audits/2026-05-06-bundle-r-console-error-audit.md
git commit -m "Bundle R Phase 1.5: console.error-Audit (Bucket-a/b/c)"
```

> **Erwartung:** ~10-20 Bucket-(b)-Stellen.
> - **>30 Bucket-(b)-Stellen:** Scope-Cut zwingend. Stop-the-line, mit User klären: entweder Phase 3 in Bundle R behalten und nur die kritischsten ~10 abdecken (Login, SuS-Pfade, Auto-Save, Backend-Calls), Rest auf Spawn-Task „Bundle R-Followup silent-fail" verschieben. Oder die ganze Phase 3 als eigenes Bundle ausgliedern.
> - **<5 Bucket-(b)-Stellen:** Erwartet wäre dass mehr Pfade silent-fail-en. Audit-Methodik nochmal prüfen (Bucket-Klassifikation zu konservativ?).

---

## Phase 2 — 9 `alert()` migrieren

**Pro Stelle einheitliches Pattern:**
1. Vorher-Snapshot (rg-Treffer notieren).
2. `useToast`-Hook importieren (in Function-Components) bzw. `useToastStore.getState()` (in Class-Components).
3. `alert(...)` ersetzen durch passenden Toast-Call.
4. tsc + vitest grün.
5. Per-File commit.

### Task 2.1: `ErrorBoundary.tsx` (2 alerts, Class-Component)

**Files:**
- Modify: `ExamLab/src/components/ErrorBoundary.tsx:47, 59`

- [ ] **Step 1: Import ergänzen**

```ts
import { useToastStore } from '../store/toastStore'
```

- [ ] **Step 2: alert Z. 47 ersetzen**

```diff
-        alert('Keine gespeicherten Daten gefunden.')
+        useToastStore.getState().add('info', 'Keine gespeicherten Daten gefunden.')
```

- [ ] **Step 3: alert Z. 59 ersetzen**

```diff
-      alert('Export fehlgeschlagen. Bitte Lehrperson kontaktieren.')
+      useToastStore.getState().add('error', 'Export fehlgeschlagen. Bitte Lehrperson kontaktieren.', { sticky: true })
```

- [ ] **Step 4: Verify**

```bash
grep -n "alert(" ExamLab/src/components/ErrorBoundary.tsx
```

Expected: keine Treffer.

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ErrorBoundary.tsx
git commit -m "Bundle R Phase 2.1: ErrorBoundary alert() → toastStore"
```

### Task 2.2: `MitgliederTab.tsx` (1 alert)

**Files:**
- Modify: `ExamLab/src/components/ueben/admin/settings/MitgliederTab.tsx:30`

- [ ] **Step 1: Hook importieren**

```ts
import { useToast } from '../../../../hooks/useToast'  // Pfad-Tiefe verifizieren
```

- [ ] **Step 2: Im Component-Body Hook aufrufen**

```ts
const toast = useToast()
```

- [ ] **Step 3: alert ersetzen**

```diff
-      alert('Entfernen fehlgeschlagen.')
+      toast.error('Entfernen fehlgeschlagen.')
```

- [ ] **Step 4: Verify + Commit**

```bash
grep -n "alert(" ExamLab/src/components/ueben/admin/settings/MitgliederTab.tsx
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/ueben/admin/settings/MitgliederTab.tsx
git commit -m "Bundle R Phase 2.2: MitgliederTab alert() → toast.error"
```

### Task 2.3: `BeispieleListe.tsx` (3 alerts)

**Files:**
- Modify: `ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx:42, 50, 57`

- [ ] **Step 1: Hook importieren + im Component-Body**

```ts
import { useToast } from '../../../hooks/useToast'  // Pfad-Tiefe verifizieren
// im Component:
const toast = useToast()
```

- [ ] **Step 2: 3 alerts ersetzen**

```diff
-    if (!ok) { setWichtig(!neu); alert('Speichern fehlgeschlagen'); return }
+    if (!ok) { setWichtig(!neu); toast.error('Speichern fehlgeschlagen'); return }

-    if (!ok) { setAktiv(!neu); alert('Speichern fehlgeschlagen'); return }
+    if (!ok) { setAktiv(!neu); toast.error('Speichern fehlgeschlagen'); return }

-    if (!ok) { alert('Löschen fehlgeschlagen'); return }
+    if (!ok) { toast.error('Löschen fehlgeschlagen'); return }
```

- [ ] **Step 3: Verify + Commit**

```bash
grep -n "alert(" ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx
git commit -m "Bundle R Phase 2.3: BeispieleListe 3 alerts → toast.error"
```

### Task 2.4: `PapierkorbView.tsx` (2 window.alerts)

**Files:**
- Modify: `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx:92, 116`

- [ ] **Step 1: Hook importieren + im Component-Body**

```ts
import { useToast } from '../../../hooks/useToast'  // Pfad-Tiefe verifizieren
// im Component:
const toast = useToast()
```

- [ ] **Step 2: 2 window.alerts ersetzen**

```diff
-        window.alert('Fehler beim Wiederherstellen: ' + msg)
+        toast.error(`Fehler beim Wiederherstellen: ${msg}`)

-        window.alert('Fehler beim Löschen: ' + msg)
+        toast.error(`Fehler beim Löschen: ${msg}`)
```

> Beide bleiben sticky-default (error-Variant). User muss aktiv quittieren — semantisch äquivalent zum bisherigen blockierenden alert().

- [ ] **Step 3: Verify + Commit**

```bash
grep -n "alert(" ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx
git commit -m "Bundle R Phase 2.4: PapierkorbView window.alert → toast.error"
```

### Task 2.5: `BeendetPhase.tsx` (1 alert)

**Files:**
- Modify: `ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx:89`

- [ ] **Step 1: Hook importieren + im Component-Body**

```ts
import { useToast } from '../../../hooks/useToast'  // Pfad-Tiefe verifizieren
const toast = useToast()
```

- [ ] **Step 2: alert ersetzen**

```diff
-                alert('Export fehlgeschlagen. Bitte erneut versuchen.')
+                toast.error('Export fehlgeschlagen. Bitte erneut versuchen.')
```

- [ ] **Step 3: Verify + Commit**

```bash
grep -n "alert(" ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/lp/durchfuehrung/BeendetPhase.tsx
git commit -m "Bundle R Phase 2.5: BeendetPhase alert() → toast.error"
```

### Task 2.6: Phase-2-Verification-Sweep

- [ ] **Step 1: Globale alert()-Verifikation**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
rg -n "\balert\(|window\.alert" ExamLab/src --type ts --type tsx -g '!*.test.*' -g '!__tests__/**' -g '!tests/**'
```

Expected: **0 Treffer** (außer Tests).

- [ ] **Step 2: Build + Lint sweep**

```bash
cd ExamLab && npx tsc -b && npm run lint && npm run lint:as-any && npm run build && npx vitest run
```

Expected: alles grün.

> Wenn Treffer übrig: in Plan-Phase nicht erfasste alert()-Stelle entdeckt — Task 2.X ergänzen, Spec dokumentieren, dann erneut Sweep.

---

## Phase 3 — Silent-Fail `console.error` → Toast

### Task 3.1: Audit-File reviewen, Bucket-(b)-Subtasks ableiten

**Files:**
- Read: `docs/superpowers/audits/2026-05-06-bundle-r-console-error-audit.md` (aus Phase 1.8)

- [ ] **Step 1: Bucket-(b)-Liste extrahieren**

Pro Bucket-(b)-Eintrag: File:Line, gewählter Toast-Variant (default `error`, ggf. `warning` falls Pfad nicht-fatal), kurze User-Message.

- [ ] **Step 2: Pro Eintrag Subtask aus Schablone**

Schablone:

```
Task 3.X — <File-Basename> Z. <line> silent-fail
- Hook importieren (oder useToastStore.getState() falls Class)
- Im catch nach console.error: toast.error('<Userfreundliche Message>')
- Verify: grep + tsc + vitest grün
- Commit: "Bundle R Phase 3.X: <File> silent-fail → toast.error"
```

> **Erwartung:** ~10-20 Subtasks. Genaue Anzahl steht erst nach Audit fest.

### Task 3.2 .. 3.N: Pro Bucket-(b)-Stelle Toast ergänzen

Beispiel-Fall — `SuSStartseite.tsx`:

**Files:**
- Modify: `ExamLab/src/components/sus/SuSStartseite.tsx:55, 79`

- [ ] **Step 1: Hook importieren + im Component-Body**

```ts
import { useToast } from '../../hooks/useToast'
const toast = useToast()
```

- [ ] **Step 2: Z. 55 — `console.error` ergänzen mit Toast**

```diff
         if (!response || !response.data?.sessionToken) {
           console.error('[SuSStartseite] Login-Bridge fehlgeschlagen — keine gültige Antwort:', response)
+          toast.error('Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.')
           setLoginBridged(true)
           return
         }
```

- [ ] **Step 3: Z. 79 — `console.error` ergänzen mit Toast**

```diff
       } catch (error) {
         console.error('[SuSStartseite] Login-Bridge Fehler:', error)
+        toast.error('Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.')
         setLoginBridged(true)
       }
```

- [ ] **Step 4: Verify + Commit**

```bash
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/sus/SuSStartseite.tsx
git commit -m "Bundle R Phase 3.2: SuSStartseite Login-Bridge silent-fail → toast.error"
```

### Task 3.N+1: Phase-3-Verification

- [ ] **Step 1: rg-Scan re-run**

```bash
rg -n "console\.error" ExamLab/src/components --type ts --type tsx -g '!*.test.*'
```

Im Audit-File pro Bucket-(b)-Eintrag prüfen, dass jetzt ein `toast.*`-Call in der Nähe steht.

- [ ] **Step 2: Build + Tests**

```bash
cd ExamLab && npx tsc -b && npm run build && npx vitest run
```

Expected: alles grün.

---

## Phase 4 — `LPStartseite.tsx` ad-hoc Toast → `useToast()`

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx:107-122, 504-520`

### Task 4.1: Migration

- [ ] **Step 1: Hook importieren**

```ts
import { useToast } from '../../hooks/useToast'
```

- [ ] **Step 2: Lokalen State entfernen**

```diff
-  // Invaliden Kurs → Redirect auf erste Gruppe + Toast
-  const [kursNichtGefundenToast, setKursNichtGefundenToast] = useState<string | null>(null)
+  const toast = useToast()
```

- [ ] **Step 3: setter-Aufruf ersetzen (Z. 113)**

```diff
-      setKursNichtGefundenToast(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
+      toast.warning(`Kurs "${urlKursId}" nicht gefunden — zu ${zielName} umgeleitet`)
```

- [ ] **Step 4: Auto-Hide-Effect entfernen (Z. 117-122)**

```diff
-  // Toast nach 4s automatisch ausblenden
-  useEffect(() => {
-    if (!kursNichtGefundenToast) return
-    const t = setTimeout(() => setKursNichtGefundenToast(null), 4000)
-    return () => clearTimeout(t)
-  }, [kursNichtGefundenToast])
```

> Auto-Hide übernimmt jetzt der zentrale Store (warning → 4s default).

- [ ] **Step 5: JSX-Toast-Block entfernen (Z. 504-520, ungefähr)**

```diff
-      {/* Toast: Kurs nicht gefunden */}
-      {kursNichtGefundenToast && (
-        <div className="...">
-          <span className="mr-2">⚠️</span>{kursNichtGefundenToast}
-        </div>
-      )}
```

> Wird ersetzt durch globalen `<ToastContainer />` aus App.tsx.

- [ ] **Step 6: Verify**

```bash
grep -n "kursNichtGefundenToast" ExamLab/src/components/lp/LPStartseite.tsx
```

Expected: **0 Treffer**.

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Expected: clean (LPStartseite-Tests anpassen falls vorhanden — laut grep aktuell keine).

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "Bundle R Phase 4: LPStartseite ad-hoc Toast → useToast"
```

---

## Phase 5 — Convention-Doku + CI-Gate-Entscheidung

### Task 5.1: Sektion „Error-Handling" in `code-quality.md`

**Files:**
- Modify: `.claude/rules/code-quality.md`

- [ ] **Step 1: File aufrufen, Ende oder passende Stelle finden**

```bash
grep -n "^## " .claude/rules/code-quality.md | tail -10
```

- [ ] **Step 2: Sektion am Ende einfügen (nach „Test-Layer-Strategie")**

```markdown
## Error-Handling

### User-Surface

| Pattern | Verwendung |
|---|---|
| `useToast().error(...)` | Standard für API-Fehler, async-Catch in Components |
| `useToast().success(...)` / `.info(...)` / `.warning(...)` | Erfolgs- und Hinweis-Surface |
| `setError`-State + Inline-Render | Form-Validation (Pflichtfeld leer, ungültige Eingabe) |
| ErrorBoundary-Fallback-UI | Render-Fehler (unverändert) |

### Konventionen

- **`alert()` deprecated** — keine Neuanlagen. Bestehende Aufrufe wurden in Bundle R migriert (06.05.2026).
- **Niemals silent-fail**: jeder catch-Block in einer Component muss entweder Toast/setError setzen
  oder ein bewusstes Fallback-UI rendern. `console.error()` allein ist kein User-Feedback.
- `console.error()` ergänzt User-Surface, ersetzt es nicht (Debugging-Hilfe für DevTools).
- Außerhalb von Function-Components (ErrorBoundary, Util-Hooks) wird der Toast direkt via
  `useToastStore.getState().add(...)` aufgerufen — kein Hook nötig.

### Wo lebt der Toast-Code

- Komponenten: `ExamLab/src/components/shared/ToastContainer.tsx`
- Store: `ExamLab/src/store/toastStore.ts`
- Hook: `ExamLab/src/hooks/useToast.ts`
- (Migration nach `packages/shared` erst wenn externer Konsument auftaucht — YAGNI.)
```

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/code-quality.md
git commit -m "Bundle R Phase 5.1: code-quality.md — Error-Handling-Konvention"
```

### Task 5.2: CI-Gate-Entscheidung `lint:no-alert`

**Entscheidung:** **Ja, CI-Gate bauen** — analog zu `lint:as-any` und `lint:no-tests-dir`. Begründung: ohne Gate schleicht sich `alert()` in künftigen Sessions wieder ein (siehe Audit-Empfehlung Bundle V „Konvention dokumentieren reicht nicht, Gate verhindert Drift").

**Files:**
- Create: `scripts/audit-no-alert.sh`
- Modify: `ExamLab/package.json` (Script-Eintrag)
- Modify: `.github/workflows/deploy.yml` (CI-Step) — falls vorhanden

- [ ] **Step 1: Audit-Skript erstellen**

```bash
# scripts/audit-no-alert.sh
#!/usr/bin/env bash
# Audit: alert() / window.alert in produktivem ExamLab-Code.
# Test-Code (*.test.*, __tests__/, tests/) ist erlaubt.
#
# Aufruf:
#   ./scripts/audit-no-alert.sh
#   ./scripts/audit-no-alert.sh --strict   # exit 1 bei Treffern (CI-Gate)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT=0
[[ "${1:-}" == "--strict" ]] && STRICT=1

HITS=$(grep -rEn '\balert\(|window\.alert\(' ExamLab/src \
  --include='*.ts' --include='*.tsx' \
  | grep -v '\.test\.' | grep -v '__tests__' | grep -v '/tests/' || true)

COUNT=$(echo -n "$HITS" | grep -c . || true)

echo "Bundle-R `alert()`-Audit: $COUNT Treffer in produktivem Code"
[[ -n "$HITS" ]] && echo "$HITS"

if [[ "$STRICT" -eq 1 && "$COUNT" -gt 0 ]]; then
  echo "FEHLER: alert() in produktivem Code nicht erlaubt (Bundle R Konvention). Verwende useToast()."
  exit 1
fi
exit 0
```

- [ ] **Step 2: Skript ausführbar machen**

```bash
chmod +x scripts/audit-no-alert.sh
```

- [ ] **Step 3: npm-Script hinzufügen**

In `ExamLab/package.json` unter `scripts`:

```json
"lint:no-alert": "../scripts/audit-no-alert.sh --strict",
```

- [ ] **Step 4: Skript lokal testen**

```bash
./scripts/audit-no-alert.sh --strict
```

Expected: `0 Treffer` und exit 0 (Phase 2 hat alle alerts entfernt).

- [ ] **Step 5: CI-Gate-Integration**

```bash
ls .github/workflows/ 2>/dev/null
```

Falls `deploy.yml` existiert: `lint:no-alert`-Step nach `lint:as-any` ergänzen (analoge Position).

- [ ] **Step 6: Commit**

```bash
git add scripts/audit-no-alert.sh ExamLab/package.json
[[ -f .github/workflows/deploy.yml ]] && git add .github/workflows/deploy.yml
git commit -m "Bundle R Phase 5.2: lint:no-alert CI-Gate (analog lint:as-any)"
```

---

## Phase 6 — Browser-E2E mit echten Logins

> **Wichtig:** Workflow-Regel `feedback_echte_logins.md` — bei Browser-Tests echte Logins, niemals Demo-Modus.

### Task 6.1: Service-Worker-Cache zurücksetzen (optional, empfohlen)

- [ ] **Step 1: Im Browser DevTools**

`Application` → `Service Workers` → `Unregister` für ExamLab-Domain.
`Application` → `Clear storage` → `Clear site data`.
Reload.

> Optional, aber empfohlen damit der neue ToastContainer nicht aus altem PWA-Cache geladen wird.

### Task 6.2: LP-E2E (5 alert-Pfade + LPStartseite-Toast)

- [ ] **Step 1: LP-Login mit echtem Account**

Staging-URL aufrufen, mit LP-Test-Account einloggen.

- [ ] **Step 2: ErrorBoundary Z. 47 reproduzieren — `info`-Toast**

Pfad: ErrorBoundary tritt auf wenn unrecovered Render-Error + `localStorage.getItem('pruefungBackup') === null`. Provozieren via DevTools-Console:

```js
localStorage.removeItem('pruefungBackup')
// Recovery-Button in Fallback-UI klicken
```

Erwartung: `info`-Toast „Keine gespeicherten Daten gefunden." erscheint, verschwindet nach ~4s.

- [ ] **Step 3: ErrorBoundary Z. 59 reproduzieren — sticky `error`-Toast**

Export-Button im Fallback-UI mit DevTools-Network-Tab auf „Offline" provozieren.

Erwartung: roter Toast „Export fehlgeschlagen. Bitte Lehrperson kontaktieren." erscheint, verschwindet **nicht** von selbst, X-Button dismisses.

- [ ] **Step 4: BeendetPhase Z. 89 reproduzieren**

Prüfung beenden → Export-Button → Network-Tab `Offline`.

Erwartung: roter Toast „Export fehlgeschlagen. Bitte erneut versuchen." erscheint.

- [ ] **Step 5: PapierkorbView Z. 92 reproduzieren — Wiederherstellen-Fehler**

Papierkorb-Tab → Wiederherstellen klicken bei Network-Offline.

Erwartung: roter Toast „Fehler beim Wiederherstellen: …" erscheint sticky.

- [ ] **Step 6: PapierkorbView Z. 116 reproduzieren — Löschen-Fehler**

Papierkorb-Tab → Endgültig löschen bei Network-Offline.

Erwartung: roter Toast „Fehler beim Löschen: …" erscheint sticky.

- [ ] **Step 7: BeispieleListe Z. 42, 50, 57 reproduzieren**

LP-Einstellungen → KI-Kalibrierung → Beispiele-Tab. Pro Action (Wichtig-Toggle, Aktiv-Toggle, Löschen) bei Network-Offline durchführen.

Erwartung: 3× roter Toast „Speichern fehlgeschlagen" / „Löschen fehlgeschlagen".

- [ ] **Step 8: MitgliederTab Z. 30 reproduzieren**

LP-Einstellungen → Übungen-Admin → Mitglieder-Tab → Mitglied entfernen bei Network-Offline.

Erwartung: roter Toast „Entfernen fehlgeschlagen.".

- [ ] **Step 9: LPStartseite Phase-4-Toast prüfen**

URL `?kurs=NICHT_EXISTIEREND` aufrufen.

Erwartung: gelber `warning`-Toast „Kurs „NICHT_EXISTIEREND" nicht gefunden — zu … umgeleitet" erscheint, verschwindet nach 4s.

- [ ] **Step 10: LP-Logout**

### Task 6.3: SuS-E2E (silent-fail-Pfade)

- [ ] **Step 1: SuS-Login mit echtem Test-Account**

- [ ] **Step 2: Login-Bridge-Failure provozieren**

DevTools fetch-hook auf `/api/sus/login-bridge` → 500-Response. Reload.

Erwartung: roter Toast „Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen." erscheint (vorher: nichts, User landete im Demo-Modus).

- [ ] **Step 3: Übrige Phase-3-Bucket-(b)-Stellen pro Audit-File durchgehen**

Pro Eintrag: Pfad provozieren, Toast verifizieren, Screenshot/Note ins Audit-File ergänzen.

### Task 6.4: Verifikations-Sweep + Merge-Vorbereitung

- [ ] **Step 1: Final Lint + Build + Test**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
cd ExamLab && npm run lint && npm run lint:as-any && npm run lint:no-alert && npm run build && npx vitest run
```

Expected: alles grün, vitest-Anzahl: 1234 + ~10-15 Phase-1-Tests = ~1244-1249.

- [ ] **Step 2: Commit-Liste auf Branch reviewen**

```bash
git log --oneline main..HEAD
```

Expected: 1 Spec-Commit + Phase-1 (1.1-1.5) + Phase-2 (2.1-2.5+Sweep) + Phase-3 (~10-22 Subtasks + Verify) + Phase-4 + Phase-5 (5.1-5.2) — ca. 25-35 atomare Commits.

- [ ] **Step 3: HANDOFF.md aktualisieren**

```bash
grep -n "Bundle " HANDOFF.md | head -10
```

Bundle-R-Sektion ergänzen: Stand, Lehren, Memory-Updates.

- [ ] **Step 4: Merge auf main (nach User-Freigabe)**

```bash
git checkout main
git merge --no-ff feature/bundle-r-error-handling-vereinheitlichung
git push origin main
```

- [ ] **Step 5: Branch lokal+remote löschen**

```bash
git branch -d feature/bundle-r-error-handling-vereinheitlichung
git push origin :feature/bundle-r-error-handling-vereinheitlichung
```

- [ ] **Step 6: Memory-Update**

Memory-Eintrag schreiben (Pattern wie `project_bundle_o_store_naming.md`):
- File: `~/.claude/projects/-Users-.../memory/project_bundle_r_error_handling.md`
- MEMORY.md Index-Eintrag
- Lehren aus Phase 3 (z.B. wenn unerwartet viele/wenige Bucket-(b)-Stellen)

---

## Acceptance Criteria

- [ ] `rg -n "\balert\(|window\.alert" ExamLab/src --type ts --type tsx -g '!*.test.*'` → 0 Treffer
- [ ] `npm run lint:no-alert --prefix ExamLab` exit 0
- [ ] `npm run lint`, `lint:as-any`, `build`, `test` (vitest) alle clean
- [ ] vitest passes ≥ 1244 (1234 baseline + Phase-1-Tests)
- [ ] Phase-2-Browser-E2E: alle 9 Pfade Toast-verifiziert mit echten Logins
- [ ] Phase-3-Browser-E2E: Bucket-(b)-Stellen Toast-verifiziert (Stichprobe ≥ 3, davon SuSStartseite-Login-Bridge)
- [ ] Phase-4-Browser-E2E: LPStartseite-Kurs-nicht-gefunden-Toast funktioniert wie vorher
- [ ] `code-quality.md` enthält Sektion „Error-Handling"
- [ ] Audit-File `2026-05-06-bundle-r-console-error-audit.md` committed
- [ ] CI-Gate `lint:no-alert` läuft in CI grün

---

## Out of Scope (referenced in spec)

- Service-Layer-`console.error` (Bucket c) — kein UI-Bezug
- ErrorBoundary-Render-Fallback-UI bleibt erhalten
- Toast-Animation/Transitions
- Migration nach `packages/shared`
- Apps-Script-Backend-Logger
- `setError`-Pattern in `LueckentextBulkToggle`/`FeedbackModal` — bleibt
- Bucket-(a)+(c) `console.error`-Stellen (~44-54 Stellen) bleiben unverändert
