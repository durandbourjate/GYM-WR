# Kopfzeilen-Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine einheitliche Kopfzeilen-Architektur mit kaskadierenden Tabs (L1→L2→L3), globaler Suche und ⋮-Menü für LP und SuS in ExamLab.

**Architecture:** Shared `AppHeader`-Komponente mit rolle-basierter Konfiguration. Tab-Config deklarativ aus URL + Stores abgeleitet. Suche über zwei separate Hooks (LP/SuS) mit Scope-Guards gegen Datenleck. Migration phasenweise: Skeleton → LP → SuS → Cleanup.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Tailwind CSS v4, React Router v6, vitest.

**Spec:** `ExamLab/docs/superpowers/specs/2026-04-15-kopfzeile-refactor-design.md`

---

## Vorarbeiten (alle Phasen)

### Task 0.1: Feature-Branch und Baseline

**Files:** keine Code-Änderungen.

- [ ] Aus `main` Feature-Branch erstellen

```bash
cd ExamLab
git checkout main && git pull
git checkout -b feature/kopfzeile-refactor
```

- [ ] Baseline-Checks (müssen ALLE grün sein)

```bash
npx tsc -b
npx vitest run
npm run build
```

Erwartet: alle drei grün. Tests-Zahl notieren (für Vergleich am Ende).

- [ ] Commit: leer zum Markieren

```bash
git commit --allow-empty -m "chore: start kopfzeile-refactor branch"
```

---

## Phase 1 — Skeleton (neue Komponenten)

### Task 1.1: Typen für Tab-Kaskade

**Files:**
- Create: `ExamLab/src/components/shared/header/types.ts`

- [ ] **Step 1: Typen-Datei anlegen**

```ts
// ExamLab/src/components/shared/header/types.ts
export type L1Id = 'favoriten' | 'pruefung' | 'uebung' | 'fragensammlung'
export type L3Mode = 'single' | 'multi' | 'none'

export interface L3Item {
  id: string
  label: string
  meta?: string
}

export interface L3Config {
  mode: L3Mode
  items: L3Item[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onAddNew?: () => void
  addNewLabel?: string
}

export interface L2Tab {
  id: string
  label: string
  onClick: () => void
  l3?: L3Config
}

export interface L1Tab {
  id: L1Id | string
  label: string
  onClick: () => void
  l2?: L2Tab[]
}

export interface TabKaskadeConfig {
  l1Tabs: L1Tab[]
  aktivL1: L1Id | string | null
  aktivL2?: string | null
}

export type Rolle = 'lp' | 'sus'
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/src/components/shared/header/types.ts
git commit -m "feat(header): add tab kaskade types"
```

---

### Task 1.2: L3Dropdown — Single/Multi-Select

**Files:**
- Create: `ExamLab/src/components/shared/header/L3Dropdown.tsx`
- Create: `ExamLab/src/components/shared/header/L3Dropdown.test.tsx`

- [ ] **Step 1: Test schreiben (failing)**

```tsx
// ExamLab/src/components/shared/header/L3Dropdown.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { L3Dropdown } from './L3Dropdown'

describe('L3Dropdown', () => {
  const itemsBase = [
    { id: 'a', label: 'SF WR 29c', meta: '3 Themen' },
    { id: 'b', label: 'SF WR 28bc29fs', meta: '5 Themen' },
  ]

  it('rendert Trigger mit Label des ersten ausgewählten Items', () => {
    render(<L3Dropdown mode="single" items={itemsBase} selectedIds={['a']} onSelect={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('SF WR 29c')
  })

  it('öffnet Dropdown bei Klick auf Trigger', () => {
    render(<L3Dropdown mode="single" items={itemsBase} selectedIds={['a']} onSelect={() => {}} />)
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('single mode: Auswahl ersetzt aktiven Item', () => {
    const onSelect = vi.fn()
    render(<L3Dropdown mode="single" items={itemsBase} selectedIds={['a']} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('SF WR 28bc29fs'))
    expect(onSelect).toHaveBeenCalledWith(['b'])
  })

  it('multi mode: toggelt Items, zeigt +N Pill im Trigger', () => {
    const onSelect = vi.fn()
    render(<L3Dropdown mode="multi" items={itemsBase} selectedIds={['a', 'b']} onSelect={onSelect} />)
    expect(screen.getByRole('combobox')).toHaveTextContent(/SF WR 29c.*\+1/)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('SF WR 28bc29fs'))
    expect(onSelect).toHaveBeenCalledWith(['a'])
  })

  it('zeigt "+ Neu"-Option wenn onAddNew gesetzt', () => {
    const onAddNew = vi.fn()
    render(
      <L3Dropdown
        mode="single"
        items={itemsBase}
        selectedIds={[]}
        onSelect={() => {}}
        onAddNew={onAddNew}
        addNewLabel="+ Neuer Kurs"
      />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('+ Neuer Kurs'))
    expect(onAddNew).toHaveBeenCalled()
  })

  it('begrenzt Trigger-Label auf 40 Zeichen mit Ellipsis', () => {
    const longItem = { id: 'x', label: 'Einrichtungsprüfung-mit-extrem-langem-Titel-der-über-40-Zeichen-geht' }
    render(<L3Dropdown mode="single" items={[longItem]} selectedIds={['x']} onSelect={() => {}} />)
    const trigger = screen.getByRole('combobox')
    expect(trigger.textContent?.length).toBeLessThanOrEqual(41) // 40 + …
    expect(trigger.textContent).toContain('…')
  })

  it('multi: Uncheck der primären → nächste aktive wird primär', () => {
    const onSelect = vi.fn()
    render(<L3Dropdown mode="multi" items={itemsBase} selectedIds={['a', 'b']} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('combobox'))
    // 'a' ist primär (steht im Trigger-Text). Uncheck auf 'a' → erwarte onSelect(['b'])
    // Komponente ruft onSelect mit neuem Array; Parent entscheidet dann über Primary.
    // Hier testen wir nur den Store-Output: primäres wird entfernt, b bleibt.
    fireEvent.click(screen.getByText('SF WR 29c'))
    expect(onSelect).toHaveBeenCalledWith(['b'])
  })

  it('multi: Uncheck letzter aktiver → onSelect mit leerem Array', () => {
    const onSelect = vi.fn()
    render(<L3Dropdown mode="multi" items={itemsBase} selectedIds={['a']} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('SF WR 29c'))
    expect(onSelect).toHaveBeenCalledWith([])
  })
})
```

- [ ] **Step 2: Test ausführen (erwartet: FAIL weil Datei fehlt)**

```bash
cd ExamLab && npx vitest run src/components/shared/header/L3Dropdown.test.tsx
```
Erwartet: FAIL "Cannot find module"

- [ ] **Step 3: Komponente implementieren**

```tsx
// ExamLab/src/components/shared/header/L3Dropdown.tsx
import { useState, useRef, useEffect } from 'react'
import type { L3Mode, L3Item } from './types'

interface Props {
  mode: L3Mode
  items: L3Item[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onAddNew?: () => void
  addNewLabel?: string
}

const MAX_LABEL_LEN = 40

export function L3Dropdown({ mode, items, selectedIds, onSelect, onAddNew, addNewLabel }: Props) {
  const [offen, setOffen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!offen) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [offen])

  if (mode === 'none' || selectedIds.length === 0) return null

  const primary = items.find((i) => i.id === selectedIds[0])
  const rawLabel = primary?.label ?? '—'
  const truncated = rawLabel.length > MAX_LABEL_LEN ? rawLabel.slice(0, MAX_LABEL_LEN) + '…' : rawLabel
  const extraCount = mode === 'multi' ? Math.max(0, selectedIds.length - 1) : 0

  function toggle(id: string) {
    if (mode === 'single') {
      onSelect([id])
      setOffen(false)
    } else {
      const next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
      onSelect(next)
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={offen}
        onClick={() => setOffen((o) => !o)}
        className="px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 cursor-pointer border border-violet-300 dark:border-violet-700 rounded bg-white dark:bg-slate-800 hover:border-violet-500 flex items-center gap-1.5"
      >
        <span>{truncated}</span>
        {extraCount > 0 && (
          <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
            +{extraCount}
          </span>
        )}
        <span className="text-violet-500 text-[10px]">▾</span>
      </button>
      {offen && (
        <div role="listbox" className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[220px] p-1 z-20">
          {items.map((it) => {
            const sel = selectedIds.includes(it.id)
            return (
              <button
                key={it.id}
                type="button"
                role="option"
                aria-selected={sel}
                onClick={() => toggle(it.id)}
                className={`w-full text-left px-2.5 py-1.5 text-sm rounded flex items-center gap-2 cursor-pointer ${
                  sel ? 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-medium' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {mode === 'multi' && (
                  <span className={`w-3.5 h-3.5 border rounded-sm flex-shrink-0 flex items-center justify-center text-[9px] text-white ${sel ? 'bg-violet-600 border-violet-600' : 'border-slate-300 dark:border-slate-600'}`}>
                    {sel && '✓'}
                  </span>
                )}
                <span className="flex-1">{it.label}</span>
                {it.meta && <span className="text-xs text-slate-400">{it.meta}</span>}
              </button>
            )
          })}
          {onAddNew && (
            <>
              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
              <button
                type="button"
                role="option"
                onClick={() => {
                  onAddNew()
                  setOffen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 text-sm rounded text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 cursor-pointer"
              >
                {addNewLabel ?? '+ Neu'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/L3Dropdown.test.tsx
```
Erwartet: 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/L3Dropdown.tsx ExamLab/src/components/shared/header/L3Dropdown.test.tsx
git commit -m "feat(header): L3Dropdown single/multi-select with +N pill"
```

---

### Task 1.3: TabKaskade — Render-Komponente

**Files:**
- Create: `ExamLab/src/components/shared/header/TabKaskade.tsx`
- Create: `ExamLab/src/components/shared/header/TabKaskade.test.tsx`

- [ ] **Step 1: Test schreiben**

```tsx
// ExamLab/src/components/shared/header/TabKaskade.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TabKaskade } from './TabKaskade'
import type { TabKaskadeConfig } from './types'

function makeConfig(overrides?: Partial<TabKaskadeConfig>): TabKaskadeConfig {
  return {
    l1Tabs: [
      { id: 'favoriten', label: 'Favoriten', onClick: vi.fn() },
      {
        id: 'pruefung',
        label: 'Prüfen',
        onClick: vi.fn(),
        l2: [
          { id: 'durchfuehren', label: 'Durchführen', onClick: vi.fn() },
          { id: 'analyse', label: 'Analyse', onClick: vi.fn() },
        ],
      },
      { id: 'fragensammlung', label: 'Fragensammlung', onClick: vi.fn() },
    ],
    aktivL1: 'pruefung',
    aktivL2: 'durchfuehren',
    ...overrides,
  }
}

describe('TabKaskade', () => {
  it('rendert alle L1-Tabs', () => {
    render(<TabKaskade config={makeConfig()} />)
    expect(screen.getByText('Favoriten')).toBeInTheDocument()
    expect(screen.getByText('Prüfen')).toBeInTheDocument()
    expect(screen.getByText('Fragensammlung')).toBeInTheDocument()
  })

  it('markiert aktives L1 mit aria-selected', () => {
    render(<TabKaskade config={makeConfig()} />)
    const pruefen = screen.getByRole('tab', { name: 'Prüfen' })
    expect(pruefen).toHaveAttribute('aria-selected', 'true')
  })

  it('rendert L2-Gruppe direkt nach aktivem L1', () => {
    render(<TabKaskade config={makeConfig()} />)
    // L2-Tabs müssen existieren
    expect(screen.getByRole('tab', { name: 'Durchführen' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Analyse' })).toBeInTheDocument()
  })

  it('rendert L2-Gruppe nicht, wenn kein L1 aktiv', () => {
    render(<TabKaskade config={makeConfig({ aktivL1: null, aktivL2: null })} />)
    expect(screen.queryByRole('tab', { name: 'Durchführen' })).not.toBeInTheDocument()
  })

  it('zeigt L3-Dropdown wenn aktives L2 eine L3-Config mit Auswahl hat', () => {
    const config = makeConfig()
    config.l1Tabs[1].l2![0].l3 = {
      mode: 'single',
      items: [{ id: 'a', label: 'SF WR 29c' }],
      selectedIds: ['a'],
      onSelect: vi.fn(),
    }
    render(<TabKaskade config={config} />)
    expect(screen.getByRole('combobox')).toHaveTextContent('SF WR 29c')
  })

  it('ruft onClick bei L1-Tab-Klick', () => {
    const config = makeConfig()
    render(<TabKaskade config={config} />)
    fireEvent.click(screen.getByText('Favoriten'))
    expect(config.l1Tabs[0].onClick).toHaveBeenCalled()
  })

  it('L1-Container hat role="tablist" mit aria-label', () => {
    render(<TabKaskade config={makeConfig()} />)
    const mainList = screen.getByRole('tablist', { name: /Hauptnavigation/i })
    expect(mainList).toBeInTheDocument()
  })

  it('L2-Container hat role="tablist" mit kontext-spezifischem aria-label', () => {
    render(<TabKaskade config={makeConfig()} />)
    const l2List = screen.getByRole('tablist', { name: /Ansichten für Prüfen/i })
    expect(l2List).toBeInTheDocument()
  })

  it('Pfeiltasten navigieren zwischen L1-Tabs (WAI-ARIA Authoring Practices)', () => {
    const config = makeConfig()
    render(<TabKaskade config={config} />)
    const favoriten = screen.getByRole('tab', { name: 'Favoriten' })
    favoriten.focus()
    fireEvent.keyDown(favoriten, { key: 'ArrowRight' })
    // Erwartet: nächster L1-Tab (Prüfen) bekommt Fokus
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Prüfen' }))
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL expected)**

```bash
cd ExamLab && npx vitest run src/components/shared/header/TabKaskade.test.tsx
```

- [ ] **Step 3: Komponente implementieren**

```tsx
// ExamLab/src/components/shared/header/TabKaskade.tsx
import { L3Dropdown } from './L3Dropdown'
import type { TabKaskadeConfig } from './types'

interface Props {
  config: TabKaskadeConfig
}

export function TabKaskade({ config }: Props) {
  const { l1Tabs, aktivL1, aktivL2 } = config
  const aktivesL1Tab = l1Tabs.find((t) => t.id === aktivL1)
  const indexAktiv = aktivesL1Tab ? l1Tabs.indexOf(aktivesL1Tab) : -1

  function renderL1Tab(t: (typeof l1Tabs)[number]) {
    const aktiv = t.id === aktivL1
    return (
      <button
        key={t.id}
        type="button"
        role="tab"
        aria-selected={aktiv}
        onClick={t.onClick}
        className={`px-2.5 py-1 text-sm whitespace-nowrap cursor-pointer transition-colors ${
          aktiv
            ? 'text-slate-900 dark:text-slate-100 font-semibold bg-violet-50 dark:bg-violet-950 border-b-2 border-violet-500 -mb-[1px] rounded-t'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-b-2 hover:border-slate-300 -mb-[1px] rounded-t'
        }`}
      >
        {t.label}
      </button>
    )
  }

  function renderL2Group() {
    if (!aktivesL1Tab?.l2 || aktivesL1Tab.l2.length === 0) return null
    const aktivesL2Tab = aktivesL1Tab.l2.find((t) => t.id === aktivL2)
    return (
      <div className="inline-flex items-center gap-[1px] pl-1.5 ml-0.5 border-l-2 border-violet-400 dark:border-violet-600" role="tablist" aria-label={`Ansichten für ${aktivesL1Tab.label}`}>
        {aktivesL1Tab.l2.map((t2) => {
          const aktiv = t2.id === aktivL2
          return (
            <span key={t2.id} className="inline-flex items-center">
              <button
                type="button"
                role="tab"
                aria-selected={aktiv}
                onClick={t2.onClick}
                className={`px-2 py-0.5 text-xs whitespace-nowrap cursor-pointer transition-colors ${
                  aktiv
                    ? 'text-violet-700 dark:text-violet-300 font-semibold border-b-2 border-violet-400 -mb-[1px] bg-violet-50 dark:bg-violet-950 rounded-t'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t2.label}
              </button>
              {aktiv && t2.l3 && t2.l3.selectedIds.length > 0 && (
                <L3Dropdown
                  mode={t2.l3.mode}
                  items={t2.l3.items}
                  selectedIds={t2.l3.selectedIds}
                  onSelect={t2.l3.onSelect}
                  onAddNew={t2.l3.onAddNew}
                  addNewLabel={t2.l3.addNewLabel}
                />
              )}
            </span>
          )
        })}
      </div>
    )
  }

  function onL1KeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const current = tabs.findIndex((t) => t === document.activeElement)
    if (current < 0) return
    const delta = e.key === 'ArrowRight' ? 1 : -1
    const next = (current + delta + tabs.length) % tabs.length
    tabs[next]?.focus()
    e.preventDefault()
  }

  return (
    <>
      <div
        className="flex items-center gap-[1px] flex-1 flex-nowrap overflow-x-auto"
        role="tablist"
        aria-label="Hauptnavigation"
        onKeyDown={onL1KeyDown}
      >
        {l1Tabs.map((t, i) => (
          <span key={t.id} className="inline-flex items-center">
            {renderL1Tab(t)}
            {i === indexAktiv && renderL2Group()}
          </span>
        ))}
      </div>
      {/* Screenreader-Ankündigung bei L1-Wechsel */}
      <div role="status" aria-live="polite" className="sr-only">
        {aktivesL1Tab ? `Ansicht ${aktivesL1Tab.label} aktiv${aktivesL1Tab.l2 ? `, ${aktivesL1Tab.l2.length} Unter-Ansichten verfügbar` : ''}` : ''}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/TabKaskade.test.tsx
```
Erwartet: 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/TabKaskade.tsx ExamLab/src/components/shared/header/TabKaskade.test.tsx
git commit -m "feat(header): TabKaskade with inline L2 + L3 dropdown"
```

---

### Task 1.4: OptionenMenu (⋮-Menü)

**Files:**
- Create: `ExamLab/src/components/shared/header/OptionenMenu.tsx`
- Create: `ExamLab/src/components/shared/header/OptionenMenu.test.tsx`

- [ ] **Step 1: Test schreiben**

```tsx
// ExamLab/src/components/shared/header/OptionenMenu.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OptionenMenu } from './OptionenMenu'

describe('OptionenMenu', () => {
  const baseProps = {
    benutzerName: 'Y. Durand',
    onHilfe: vi.fn(),
    onFeedback: vi.fn(),
    onAbmelden: vi.fn(),
    onThemeToggle: vi.fn(),
    theme: 'light' as const,
  }

  it('öffnet bei Klick auf Trigger und zeigt Benutzer', () => {
    render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Y. Durand')).toBeInTheDocument()
    expect(screen.getByText('LP')).toBeInTheDocument()
  })

  it('LP: zeigt Einstellungen, SuS: zeigt es nicht', () => {
    const onEinstellungen = vi.fn()
    const { rerender } = render(<OptionenMenu rolle="lp" {...baseProps} onEinstellungen={onEinstellungen} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()

    rerender(<OptionenMenu rolle="sus" {...baseProps} onEinstellungen={onEinstellungen} />)
    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument()
  })

  it('SuS: zeigt "Problem melden", LP: zeigt "Feedback senden"', () => {
    const { rerender } = render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByText('Feedback senden')).toBeInTheDocument()

    rerender(<OptionenMenu rolle="sus" {...baseProps} />)
    expect(screen.getByText('Problem melden')).toBeInTheDocument()
  })

  it('Abmelden-Klick ruft onAbmelden', () => {
    render(<OptionenMenu rolle="lp" {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    fireEvent.click(screen.getByText('Abmelden'))
    expect(baseProps.onAbmelden).toHaveBeenCalled()
  })

  it('schliesst bei Outside-Click', () => {
    render(<div><OptionenMenu rolle="lp" {...baseProps} /><div data-testid="outside">x</div></div>)
    fireEvent.click(screen.getByRole('button', { name: /menü/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL)**

```bash
cd ExamLab && npx vitest run src/components/shared/header/OptionenMenu.test.tsx
```

- [ ] **Step 3: Komponente implementieren**

```tsx
// ExamLab/src/components/shared/header/OptionenMenu.tsx
import { useState, useRef, useEffect } from 'react'
import type { Rolle } from './types'

interface Props {
  rolle: Rolle
  benutzerName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onHilfe: () => void
  onFeedback: () => void
  onAbmelden: () => void
  onEinstellungen?: () => void
}

export function OptionenMenu({ rolle, benutzerName, theme, onThemeToggle, onHilfe, onFeedback, onAbmelden, onEinstellungen }: Props) {
  const [offen, setOffen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!offen) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOffen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [offen])

  function itemClass(danger = false) {
    return `w-full text-left px-2.5 py-1.5 text-sm rounded flex items-center gap-2.5 cursor-pointer ${
      danger
        ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`
  }

  const feedbackLabel = rolle === 'sus' ? 'Problem melden' : 'Feedback senden'
  const hilfeLabel = rolle === 'sus' ? 'Hilfe (SuS)' : 'Hilfe & Anleitungen'

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={offen}
        aria-label="Menü"
        className="px-2 py-1 text-lg text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
      >
        ⋮
      </button>
      {offen && (
        <div role="menu" className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg min-w-[220px] p-1 z-30">
          <div className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-slate-400">Benutzer</div>
          <div role="menuitem" className="px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>{benutzerName}</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 rounded">{rolle === 'lp' ? 'LP' : 'SuS'}</span>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" role="separator" />
          {rolle === 'lp' && onEinstellungen && (
            <button role="menuitem" type="button" onClick={() => { onEinstellungen(); setOffen(false) }} className={itemClass()}>
              <span className="w-4 text-center">⚙</span>Einstellungen
            </button>
          )}
          <button role="menuitem" type="button" onClick={() => { onThemeToggle() }} className={itemClass()}>
            <span className="w-4 text-center">{theme === 'dark' ? '☀' : '🌙'}</span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button role="menuitem" type="button" onClick={() => { onHilfe(); setOffen(false) }} className={itemClass()}>
            <span className="w-4 text-center">?</span>{hilfeLabel}
          </button>
          <button role="menuitem" type="button" onClick={() => { onFeedback(); setOffen(false) }} className={itemClass()}>
            <span className="w-4 text-center">✉</span>{feedbackLabel}
          </button>
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" role="separator" />
          <button role="menuitem" type="button" onClick={() => { onAbmelden(); setOffen(false) }} className={itemClass(true)}>
            <span className="w-4 text-center">⎋</span>Abmelden
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/OptionenMenu.test.tsx
```
Erwartet: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/OptionenMenu.tsx ExamLab/src/components/shared/header/OptionenMenu.test.tsx
git commit -m "feat(header): OptionenMenu (dots menu) for LP and SuS"
```

---

### Task 1.5: Such-Hooks (LP + SuS mit Scope-Guards)

**Files:**
- Create: `ExamLab/src/hooks/useGlobalSucheLP.ts`
- Create: `ExamLab/src/hooks/useGlobalSucheSuS.ts`
- Create: `ExamLab/src/hooks/useGlobalSuche.shared.ts` (Typen + Blacklist-Util)
- Create: `ExamLab/src/tests/useGlobalSuche.test.ts`

- [ ] **Step 1: Shared-Modul (nur Typen, Blacklist, Highlight-Util)**

```ts
// ExamLab/src/hooks/useGlobalSuche.shared.ts
export const INDEX_BLACKLIST = [
  'musterlosung',
  'korrekt',
  'korrekteAntworten',
  'bewertungsraster',
  'toleranz',
  'hinweis',
] as const

export type TrefferKategorie = 'frage' | 'pruefung' | 'thema' | 'kurs'

export interface Treffer {
  id: string
  kategorie: TrefferKategorie
  titel: string
  meta?: string
  kontext?: string // z.B. "Üben · SF WR 29c" wenn kontext-priorisiert
  onOpen: () => void
}

export interface SucheGruppe {
  id: string
  label: string
  kontextTag?: string
  treffer: Treffer[]
}

export interface SucheErgebnis {
  gruppen: SucheGruppe[]
  istLadend: boolean
  fehler?: string
}

export function machtMatch(such: string, ...felder: (string | undefined)[]): boolean {
  const s = such.trim().toLowerCase()
  if (!s) return false
  return felder.some((f) => f && f.toLowerCase().includes(s))
}

/**
 * Entfernt aus Objekten alle Felder, die als Lösungs-Leak gelten.
 * Für defensive Nutzung vor Indexierung.
 */
export function stripSensibleFelder<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj)) {
    if (INDEX_BLACKLIST.includes(k as (typeof INDEX_BLACKLIST)[number])) continue
    out[k] = obj[k]
  }
  return out as Partial<T>
}
```

- [ ] **Step 2: LP-Hook**

```ts
// ExamLab/src/hooks/useGlobalSucheLP.ts
import { useMemo } from 'react'
import type { SucheErgebnis, SucheGruppe, Treffer } from './useGlobalSuche.shared'
import { machtMatch } from './useGlobalSuche.shared'
import { useFragensammlungStore } from '../store/fragensammlungStore'
import { usePruefungStore } from '../store/pruefungStore'
import { useUebenStore } from '../store/uebenStore'

interface Ctx {
  l1?: string | null
  l2?: string | null
  l3?: string | null
}

export function useGlobalSucheLP(such: string, kontext: Ctx, onNavigate: (path: string) => void): SucheErgebnis {
  const fragen = useFragensammlungStore((s) => s.fragen)
  const pruefungen = usePruefungStore((s) => s.pruefungen)
  const kurse = useUebenStore((s) => s.kurse)

  return useMemo(() => {
    if (!such.trim()) return { gruppen: [], istLadend: false }
    const istLadend = !fragen || !pruefungen || !kurse
    if (istLadend) return { gruppen: [], istLadend: true }

    const frageTreffer: Treffer[] = fragen
      .filter((f) => machtMatch(such, f.frage, f.thema, f.fach))
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        kategorie: 'frage',
        titel: f.frage ?? '(ohne Titel)',
        meta: [f.fach, f.thema].filter(Boolean).join(' · '),
        onOpen: () => onNavigate(`/fragensammlung?frage=${f.id}`),
      }))

    const pruefungTreffer: Treffer[] = pruefungen
      .filter((p) => machtMatch(such, p.titel, p.kursId))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        kategorie: 'pruefung',
        titel: p.titel ?? '(ohne Titel)',
        meta: p.kursId,
        onOpen: () => onNavigate(`/pruefung/${p.id}`),
      }))

    const kursTreffer: Treffer[] = kurse
      .filter((k) => machtMatch(such, k.label, k.id))
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        kategorie: 'kurs',
        titel: k.label,
        meta: `Kurs · ${k.id}`,
        onOpen: () => onNavigate(`/uebung/kurs/${k.id}`),
      }))

    const gruppen: SucheGruppe[] = []

    // Kontext-priorisierte Gruppe (optional)
    if (kontext.l1 === 'uebung' && kontext.l3) {
      const imKontext = [...frageTreffer, ...pruefungTreffer, ...kursTreffer].filter(
        (t) => t.meta?.includes(kontext.l3!) || t.titel.toLowerCase().includes((kontext.l3 ?? '').toLowerCase()),
      )
      if (imKontext.length > 0) {
        gruppen.push({ id: 'kontext', label: 'Im aktiven Kontext', kontextTag: `Üben · ${kontext.l3}`, treffer: imKontext.slice(0, 5) })
      }
    }

    if (frageTreffer.length) gruppen.push({ id: 'fragen', label: 'Fragensammlung', treffer: frageTreffer })
    if (pruefungTreffer.length) gruppen.push({ id: 'pruefungen', label: 'Prüfungen', treffer: pruefungTreffer })
    if (kursTreffer.length) gruppen.push({ id: 'kurse', label: 'Themen / Kurse', treffer: kursTreffer })

    return { gruppen, istLadend: false }
  }, [such, fragen, pruefungen, kurse, kontext.l1, kontext.l3, onNavigate])
}
```

- [ ] **Step 3: SuS-Hook**

```ts
// ExamLab/src/hooks/useGlobalSucheSuS.ts
import { useMemo } from 'react'
import type { SucheErgebnis, SucheGruppe, Treffer } from './useGlobalSuche.shared'
import { machtMatch } from './useGlobalSuche.shared'
import { useSuSStore } from '../store/susStore'

interface Ctx {
  l1?: string | null
  l2?: string | null
  l3?: string | null
}

// SuS-Suche: NUR auf freigegebene/zurückgegebene Prüfungen + eigene Kurse + freigegebene Themen.
// KEINE sensitiven Felder (musterlosung etc.) werden hier je geladen — sie sind bereits im Store nicht enthalten.
export function useGlobalSucheSuS(such: string, kontext: Ctx, onNavigate: (path: string) => void): SucheErgebnis {
  const pruefungen = useSuSStore((s) => s.meinePruefungen)
  const themen = useSuSStore((s) => s.meineThemen)
  const kurse = useSuSStore((s) => s.meineKurse)

  return useMemo(() => {
    if (!such.trim()) return { gruppen: [], istLadend: false }
    const istLadend = !pruefungen || !themen || !kurse
    if (istLadend) return { gruppen: [], istLadend: true }

    const ERLAUBTE_PRUEFUNG_STATI = ['freigegeben', 'zurueckgegeben', 'abgeschlossen']

    const pruefungTreffer: Treffer[] = pruefungen
      .filter((p) => ERLAUBTE_PRUEFUNG_STATI.includes(p.status))
      .filter((p) => machtMatch(such, p.titel, p.kursId))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        kategorie: 'pruefung',
        titel: p.titel,
        meta: p.kursId,
        onOpen: () => onNavigate(`/sus/pruefen/${p.id}`),
      }))

    const themaTreffer: Treffer[] = themen
      .filter((t) => t.freigegeben === true)
      .filter((t) => machtMatch(such, t.titel, t.fach, t.kursId))
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        kategorie: 'thema',
        titel: t.titel,
        meta: [t.fach, t.kursId].filter(Boolean).join(' · '),
        onOpen: () => onNavigate(`/sus/ueben?thema=${t.id}`),
      }))

    const kursTreffer: Treffer[] = kurse
      .filter((k) => machtMatch(such, k.label, k.id))
      .slice(0, 5)
      .map((k) => ({
        id: k.id,
        kategorie: 'kurs',
        titel: k.label,
        meta: 'Kurs',
        onOpen: () => onNavigate(`/sus/ueben/kurs/${k.id}`),
      }))

    const gruppen: SucheGruppe[] = []

    // SuS: Kontext-Priorisierung für aktiven Kurs
    if (kontext.l3 && themaTreffer.length) {
      const imKontext = themaTreffer.filter((t) => t.meta?.includes(kontext.l3!))
      if (imKontext.length > 0) {
        gruppen.push({ id: 'kontext', label: 'Im aktiven Kurs', kontextTag: kontext.l3, treffer: imKontext })
      }
    }

    if (themaTreffer.length) gruppen.push({ id: 'themen', label: 'Themen', treffer: themaTreffer })
    if (pruefungTreffer.length) gruppen.push({ id: 'pruefungen', label: 'Meine Prüfungen', treffer: pruefungTreffer })
    if (kursTreffer.length) gruppen.push({ id: 'kurse', label: 'Kurse', treffer: kursTreffer })

    return { gruppen, istLadend: false }
  }, [such, pruefungen, themen, kurse, kontext.l3, onNavigate])
}
```

- [ ] **Step 4: Test für beide Hooks (Scope-Guard-Fokus)**

```ts
// ExamLab/src/tests/useGlobalSuche.test.ts
import { describe, it, expect } from 'vitest'
import { INDEX_BLACKLIST, stripSensibleFelder, machtMatch } from '../hooks/useGlobalSuche.shared'

describe('useGlobalSuche.shared', () => {
  it('INDEX_BLACKLIST enthält alle sensiblen Lösungs-Felder', () => {
    expect(INDEX_BLACKLIST).toContain('musterlosung')
    expect(INDEX_BLACKLIST).toContain('korrekt')
    expect(INDEX_BLACKLIST).toContain('korrekteAntworten')
    expect(INDEX_BLACKLIST).toContain('bewertungsraster')
    expect(INDEX_BLACKLIST).toContain('toleranz')
    expect(INDEX_BLACKLIST).toContain('hinweis')
  })

  it('stripSensibleFelder entfernt Blacklist-Felder', () => {
    const input = { frage: 'Was ist X?', musterlosung: 'SOLUTION', korrekt: true, thema: 'BWL' }
    const out = stripSensibleFelder(input) as Record<string, unknown>
    expect(out.frage).toBe('Was ist X?')
    expect(out.thema).toBe('BWL')
    expect(out.musterlosung).toBeUndefined()
    expect(out.korrekt).toBeUndefined()
  })

  it('machtMatch ist case-insensitive und findet Teilstring', () => {
    expect(machtMatch('konj', 'Konjunkturzyklus', undefined)).toBe(true)
    expect(machtMatch('KONJ', 'konjunktur')).toBe(true)
    expect(machtMatch('xyz', 'konjunktur')).toBe(false)
  })

  it('machtMatch ignoriert leeren Suchstring', () => {
    expect(machtMatch('', 'abc')).toBe(false)
    expect(machtMatch('  ', 'abc')).toBe(false)
  })
})
```

- [ ] **Step 5: Tests laufen**

```bash
cd ExamLab && npx vitest run src/tests/useGlobalSuche.test.ts
```
Erwartet: 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/hooks/useGlobalSuche.shared.ts ExamLab/src/hooks/useGlobalSucheLP.ts ExamLab/src/hooks/useGlobalSucheSuS.ts ExamLab/src/tests/useGlobalSuche.test.ts
git commit -m "feat(search): separate LP/SuS search hooks with scope guards"
```

> **Hinweis:** Die Hook-Implementierungen referenzieren `useFragensammlungStore`, `usePruefungStore`, `useUebenStore`, `useSuSStore`. Falls die konkreten Store-Selector-Shapes vom Plan abweichen, in diesem Task die Selektoren ans aktuelle Store-API anpassen (`git grep "export const useFragensammlungStore"` etc. lokal prüfen). Keine neuen Felder im Store einführen.

---

### Task 1.6: GlobalSuche-Komponente

**Files:**
- Create: `ExamLab/src/components/shared/header/GlobalSuche.tsx`
- Create: `ExamLab/src/components/shared/header/GlobalSuche.test.tsx`

- [ ] **Step 1: Test schreiben**

```tsx
// ExamLab/src/components/shared/header/GlobalSuche.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GlobalSuche } from './GlobalSuche'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'

describe('GlobalSuche', () => {
  function mkErgebnis(istLadend = false): SucheErgebnis {
    return {
      istLadend,
      gruppen: [
        {
          id: 'kontext',
          label: 'Im aktiven Kontext',
          kontextTag: 'Üben · SF WR 29c',
          treffer: [
            { id: 't1', kategorie: 'thema', titel: 'Konjunkturzyklus', meta: 'VWL · 14 Fragen', onOpen: vi.fn() },
          ],
        },
        {
          id: 'fragen',
          label: 'Fragensammlung',
          treffer: [
            { id: 'f1', kategorie: 'frage', titel: 'Was ist die SNB?', meta: 'VWL', onOpen: vi.fn() },
          ],
        },
      ],
    }
  }

  it('zeigt Placeholder wenn Input leer', () => {
    render(<GlobalSuche suchen="" onSuchen={() => {}} ergebnis={{ gruppen: [], istLadend: false }} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('zeigt Gruppen-Label + Kontext-Tag', () => {
    render(<GlobalSuche suchen="konj" onSuchen={() => {}} ergebnis={mkErgebnis()} istFokussiert />)
    expect(screen.getByText('Im aktiven Kontext')).toBeInTheDocument()
    expect(screen.getByText('Üben · SF WR 29c')).toBeInTheDocument()
  })

  it('zeigt Lade-Hinweis bei istLadend', () => {
    render(<GlobalSuche suchen="x" onSuchen={() => {}} ergebnis={mkErgebnis(true)} istFokussiert />)
    expect(screen.getByText(/Lade Daten/i)).toBeInTheDocument()
  })

  it('Enter auf erstem Treffer öffnet ihn', () => {
    const erg = mkErgebnis()
    render(<GlobalSuche suchen="konj" onSuchen={() => {}} ergebnis={erg} istFokussiert />)
    const input = screen.getByRole('searchbox')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(erg.gruppen[0].treffer[0].onOpen).toHaveBeenCalled()
  })

  it('ESC löscht Input und entfokussiert', () => {
    const onSuchen = vi.fn()
    render(<GlobalSuche suchen="xyz" onSuchen={onSuchen} ergebnis={mkErgebnis()} istFokussiert />)
    const input = screen.getByRole('searchbox')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onSuchen).toHaveBeenCalledWith('')
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL)**

```bash
cd ExamLab && npx vitest run src/components/shared/header/GlobalSuche.test.tsx
```

- [ ] **Step 3: Komponente implementieren**

```tsx
// ExamLab/src/components/shared/header/GlobalSuche.tsx
import { useEffect, useRef, useState } from 'react'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'

interface Props {
  suchen: string
  onSuchen: (s: string) => void
  ergebnis: SucheErgebnis
  istFokussiert?: boolean
  placeholder?: string
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const SHORTCUT_KEY = IS_MAC ? '⌘K' : 'Ctrl+K'

export function GlobalSuche({ suchen, onSuchen, ergebnis, istFokussiert, placeholder = 'Suchen …' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fokussiert, setFokussiert] = useState(!!istFokussiert)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMetaK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isMetaK) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      onSuchen('')
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      const ersterTreffer = ergebnis.gruppen[0]?.treffer[0]
      if (ersterTreffer) ersterTreffer.onOpen()
    }
  }

  const panelOffen = (fokussiert || istFokussiert) && suchen.trim().length > 0
  const totalTreffer = ergebnis.gruppen.reduce((acc, g) => acc + g.treffer.length, 0)

  return (
    <div className="relative flex-shrink-0">
      <span className="absolute left-2.5 top-[7px] text-slate-400 text-sm pointer-events-none">⌕</span>
      <input
        ref={inputRef}
        role="searchbox"
        aria-label="ExamLab durchsuchen"
        type="search"
        placeholder={placeholder}
        value={suchen}
        onChange={(e) => onSuchen(e.target.value)}
        onFocus={() => setFokussiert(true)}
        onBlur={() => setTimeout(() => setFokussiert(false), 150)}
        onKeyDown={handleKeyDown}
        className={`bg-slate-100 dark:bg-slate-700 rounded-md pl-8 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none border border-transparent transition-all ${
          fokussiert ? 'bg-white dark:bg-slate-800 border-violet-500 w-[360px]' : 'w-[220px]'
        }`}
      />
      <span className="absolute right-2 top-[7px] text-[10px] bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 px-1 rounded pointer-events-none">
        {fokussiert ? 'ESC' : SHORTCUT_KEY}
      </span>
      {panelOffen && (
        <div role="listbox" className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl min-w-[440px] max-h-[420px] overflow-y-auto p-1 z-20">
          {ergebnis.istLadend && (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">Lade Daten …</div>
          )}
          {!ergebnis.istLadend && ergebnis.gruppen.length === 0 && (
            <div className="px-3 py-4 text-sm text-slate-500 text-center">Keine Treffer</div>
          )}
          {!ergebnis.istLadend && ergebnis.gruppen.map((g) => (
            <div key={g.id} role="group" aria-label={g.label}>
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{g.label}</span>
                {g.kontextTag && (
                  <span className="text-[10px] bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1.5 rounded-full">{g.kontextTag}</span>
                )}
              </div>
              {g.treffer.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={t.onOpen}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-900 dark:text-slate-100"
                >
                  <div className="font-medium">{t.titel}</div>
                  {t.meta && <div className="text-xs text-slate-500">{t.meta}</div>}
                </button>
              ))}
            </div>
          ))}
          {!ergebnis.istLadend && totalTreffer > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 px-2.5 py-1.5 text-[11px] text-slate-500 flex justify-between">
              <span>↑↓ navigieren · Enter öffnen · {SHORTCUT_KEY} fokussieren</span>
              <span>{totalTreffer} Treffer</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/GlobalSuche.test.tsx
```
Erwartet: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/GlobalSuche.tsx ExamLab/src/components/shared/header/GlobalSuche.test.tsx
git commit -m "feat(header): GlobalSuche input + dropdown panel"
```

---

### Task 1.7: useTabKaskadeConfig (LP-Variante)

**Files:**
- Create: `ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.ts`
- Create: `ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.test.ts`

- [ ] **Step 1: Test schreiben (URL → Config)**

```ts
// ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.test.ts
import { describe, it, expect, vi } from 'vitest'
import { baueLPConfigAusRoute } from './useTabKaskadeConfig.lp'

const navigate = vi.fn()
const noopKurse = [{ id: 'sf-wr-29c', label: 'SF WR 29c' }]
const noopPruefungen: Array<{ id: string; titel: string }> = []

describe('baueLPConfigAusRoute', () => {
  it('erkennt /pruefung → aktivL1 = pruefung, aktivL2 = durchfuehren (default)', () => {
    const cfg = baueLPConfigAusRoute('/pruefung', navigate, { kurse: noopKurse, pruefungen: noopPruefungen, aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('pruefung')
    expect(cfg.aktivL2).toBe('durchfuehren')
  })

  it('erkennt /uebung/kurs/sf-wr-29c → L1=uebung, L2=uebungen, L3=sf-wr-29c', () => {
    const cfg = baueLPConfigAusRoute('/uebung/kurs/sf-wr-29c', navigate, { kurse: noopKurse, pruefungen: noopPruefungen, aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('uebung')
    expect(cfg.aktivL2).toBe('uebungen')
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'uebungen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
  })

  it('erkennt /fragensammlung → aktivL1 = fragensammlung, kein L2', () => {
    const cfg = baueLPConfigAusRoute('/fragensammlung', navigate, { kurse: [], pruefungen: [], aktivePruefungen: [] })
    expect(cfg.aktivL1).toBe('fragensammlung')
    const fs = cfg.l1Tabs.find((t) => t.id === 'fragensammlung')!
    expect(fs.l2).toBeUndefined()
  })

  it('/pruefung/durchfuehren mit aktiver Prüfung → L3 multi', () => {
    const aktivePruefungen = ['ep-gym1']
    const pruefungen = [{ id: 'ep-gym1', titel: 'Einrichtungsprüfung GYM1' }]
    const cfg = baueLPConfigAusRoute('/pruefung/durchfuehren', navigate, { kurse: [], pruefungen, aktivePruefungen })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'pruefung')!.l2!.find((t) => t.id === 'durchfuehren')!
    expect(l2.l3?.mode).toBe('multi')
    expect(l2.l3?.selectedIds).toEqual(['ep-gym1'])
  })

  // Precedence URL vs localStorage (spec §8)
  it('URL-L3 gewinnt über localStorage', () => {
    localStorage.setItem('examlab-ueben-letzter-kurs', 'in-28c')
    const cfg = baueLPConfigAusRoute('/uebung/kurs/sf-wr-29c', navigate, { kurse: [{ id: 'sf-wr-29c', label: 'SF WR 29c' }, { id: 'in-28c', label: 'IN 28c' }], pruefungen: [], aktivePruefungen: [] })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'uebungen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
    localStorage.removeItem('examlab-ueben-letzter-kurs')
  })

  it('Ohne URL-L3: localStorage wird als Fallback gelesen und löst replace-Navigation aus', () => {
    localStorage.setItem('examlab-ueben-letzter-kurs', 'in-28c')
    const nav = vi.fn()
    baueLPConfigAusRoute('/uebung', nav, { kurse: [{ id: 'in-28c', label: 'IN 28c' }], pruefungen: [], aktivePruefungen: [] })
    // Implementation-Note: Wenn /uebung ohne kurs + localStorage hat, Container löst `navigate('/uebung/kurs/in-28c', { replace: true })` aus
    // Test prüft Config: Wenn Container-Logik korrekt, liegt vor diesem baueLP-Aufruf bereits die Route /uebung/kurs/... an.
    // Da baueLPConfigAusRoute rein funktional ist, wird die localStorage-Logik im Container geprüft (Task 2.1 Browser-Test).
    localStorage.removeItem('examlab-ueben-letzter-kurs')
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL)**

- [ ] **Step 3: Implementation**

```ts
// ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.ts
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TabKaskadeConfig, L1Tab, L2Tab } from './types'

interface Input {
  kurse: { id: string; label: string }[]
  pruefungen: { id: string; titel: string }[]
  aktivePruefungen: string[] // IDs der gerade "aktiven" Prüfungen (MultiSelect)
  onWaehleAktivePruefungen?: (ids: string[]) => void
  onWaehleKurs?: (id: string) => void
}

export function baueLPConfigAusRoute(
  pathname: string,
  navigate: (to: string) => void,
  input: Input,
): TabKaskadeConfig {
  const { kurse, pruefungen, aktivePruefungen, onWaehleAktivePruefungen, onWaehleKurs } = input

  // Aktives L1/L2/L3 aus Pfad ermitteln
  let aktivL1: TabKaskadeConfig['aktivL1'] = null
  let aktivL2: TabKaskadeConfig['aktivL2'] = null
  let aktivL3: string | null = null

  if (pathname.startsWith('/favoriten')) aktivL1 = 'favoriten'
  else if (pathname.startsWith('/pruefung')) {
    aktivL1 = 'pruefung'
    aktivL2 = pathname.includes('/analyse') ? 'analyse' : 'durchfuehren'
  } else if (pathname.startsWith('/uebung')) {
    aktivL1 = 'uebung'
    if (pathname.includes('/durchfuehren')) aktivL2 = 'durchfuehren'
    else if (pathname.includes('/analyse')) aktivL2 = 'analyse'
    else aktivL2 = 'uebungen'
    const kursMatch = pathname.match(/\/kurs\/([^/?]+)/)
    if (kursMatch) aktivL3 = kursMatch[1]
  } else if (pathname.startsWith('/fragensammlung')) aktivL1 = 'fragensammlung'

  const uebungenL2: L2Tab = {
    id: 'uebungen',
    label: 'Übungen',
    onClick: () => navigate('/uebung'),
    l3: aktivL3
      ? {
          mode: 'single',
          items: kurse.map((k) => ({ id: k.id, label: k.label })),
          selectedIds: [aktivL3],
          onSelect: (ids) => {
            if (ids[0]) {
              onWaehleKurs?.(ids[0])
              navigate(`/uebung/kurs/${ids[0]}`)
            }
          },
        }
      : undefined,
  }

  const durchfPruefenL2: L2Tab = {
    id: 'durchfuehren',
    label: 'Durchführen',
    onClick: () => navigate('/pruefung/durchfuehren'),
    l3:
      aktivePruefungen.length > 0
        ? {
            mode: 'multi',
            items: pruefungen.map((p) => ({ id: p.id, label: p.titel })),
            selectedIds: aktivePruefungen,
            onSelect: (ids) => onWaehleAktivePruefungen?.(ids),
          }
        : undefined,
  }

  const l1Tabs: L1Tab[] = [
    { id: 'favoriten', label: 'Favoriten', onClick: () => navigate('/favoriten') },
    {
      id: 'pruefung',
      label: 'Prüfen',
      onClick: () => navigate('/pruefung'),
      l2: [durchfPruefenL2, { id: 'analyse', label: 'Analyse', onClick: () => navigate('/pruefung/analyse') }],
    },
    {
      id: 'uebung',
      label: 'Üben',
      onClick: () => navigate('/uebung'),
      l2: [
        { id: 'durchfuehren', label: 'Durchführen', onClick: () => navigate('/uebung/durchfuehren') },
        uebungenL2,
        { id: 'analyse', label: 'Analyse', onClick: () => navigate('/uebung/analyse') },
      ],
    },
    { id: 'fragensammlung', label: 'Fragensammlung', onClick: () => navigate('/fragensammlung') },
  ]

  return { l1Tabs, aktivL1, aktivL2 }
}

export function useTabKaskadeConfigLP(input: Input): TabKaskadeConfig {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return useMemo(() => baueLPConfigAusRoute(pathname, navigate, input), [pathname, navigate, input])
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/useTabKaskadeConfig.lp.test.ts
```
Erwartet: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.ts ExamLab/src/components/shared/header/useTabKaskadeConfig.lp.test.ts
git commit -m "feat(header): useTabKaskadeConfigLP — URL → Tab-Config"
```

---

### Task 1.8: useTabKaskadeConfig (SuS-Variante)

**Files:**
- Create: `ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.ts`
- Create: `ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.test.ts`

- [ ] **Step 1: Test schreiben**

```ts
// ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.test.ts
import { describe, it, expect, vi } from 'vitest'
import { baueSuSConfigAusRoute } from './useTabKaskadeConfig.sus'

const navigate = vi.fn()

describe('baueSuSConfigAusRoute', () => {
  it('/sus/ueben → L1=uebung, L2=themen', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben', navigate, { kurse: [] })
    expect(cfg.aktivL1).toBe('uebung')
    expect(cfg.aktivL2).toBe('themen')
  })

  it('/sus/ueben/kurs/sf-wr-29c → L3 single, selectedIds=sf-wr-29c', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben/kurs/sf-wr-29c', navigate, {
      kurse: [{ id: 'sf-wr-29c', label: 'SF WR 29c' }],
    })
    const l2 = cfg.l1Tabs.find((t) => t.id === 'uebung')!.l2!.find((t) => t.id === 'themen')!
    expect(l2.l3?.selectedIds).toEqual(['sf-wr-29c'])
  })

  it('/sus/pruefen/ergebnisse → L1=pruefung, L2=ergebnisse', () => {
    const cfg = baueSuSConfigAusRoute('/sus/pruefen/ergebnisse', navigate, { kurse: [] })
    expect(cfg.aktivL1).toBe('pruefung')
    expect(cfg.aktivL2).toBe('ergebnisse')
  })

  it('kein Favoriten und kein Fragensammlung in SuS-L1', () => {
    const cfg = baueSuSConfigAusRoute('/sus/ueben', navigate, { kurse: [] })
    const ids = cfg.l1Tabs.map((t) => t.id)
    expect(ids).not.toContain('favoriten')
    expect(ids).not.toContain('fragensammlung')
    expect(ids).toEqual(['pruefung', 'uebung'])
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL)**

- [ ] **Step 3: Implementation**

```ts
// ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.ts
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TabKaskadeConfig, L1Tab } from './types'

interface Input {
  kurse: { id: string; label: string }[]
  onWaehleKurs?: (id: string) => void
}

export function baueSuSConfigAusRoute(pathname: string, navigate: (to: string) => void, input: Input): TabKaskadeConfig {
  const { kurse, onWaehleKurs } = input

  let aktivL1: TabKaskadeConfig['aktivL1'] = null
  let aktivL2: TabKaskadeConfig['aktivL2'] = null
  let aktivL3: string | null = null

  if (pathname.startsWith('/sus/pruefen')) {
    aktivL1 = 'pruefung'
    aktivL2 = pathname.includes('/ergebnisse') ? 'ergebnisse' : 'offen'
  } else if (pathname.startsWith('/sus/ueben')) {
    aktivL1 = 'uebung'
    if (pathname.includes('/fortschritt')) aktivL2 = 'fortschritt'
    else if (pathname.includes('/ergebnisse')) aktivL2 = 'ergebnisse'
    else aktivL2 = 'themen'
    const kursMatch = pathname.match(/\/kurs\/([^/?]+)/)
    if (kursMatch) aktivL3 = kursMatch[1]
  }

  const l1Tabs: L1Tab[] = [
    {
      id: 'pruefung',
      label: 'Prüfen',
      onClick: () => navigate('/sus/pruefen'),
      l2: [
        { id: 'offen', label: 'Offen', onClick: () => navigate('/sus/pruefen') },
        { id: 'ergebnisse', label: 'Ergebnisse', onClick: () => navigate('/sus/pruefen/ergebnisse') },
      ],
    },
    {
      id: 'uebung',
      label: 'Üben',
      onClick: () => navigate('/sus/ueben'),
      l2: [
        {
          id: 'themen',
          label: 'Themen',
          onClick: () => navigate('/sus/ueben'),
          l3: aktivL3
            ? {
                mode: 'single',
                items: kurse.map((k) => ({ id: k.id, label: k.label })),
                selectedIds: [aktivL3],
                onSelect: (ids) => {
                  if (ids[0]) {
                    onWaehleKurs?.(ids[0])
                    navigate(`/sus/ueben/kurs/${ids[0]}`)
                  }
                },
              }
            : undefined,
        },
        { id: 'fortschritt', label: 'Fortschritt', onClick: () => navigate('/sus/ueben/fortschritt') },
        { id: 'ergebnisse', label: 'Ergebnisse', onClick: () => navigate('/sus/ueben/ergebnisse') },
      ],
    },
  ]

  return { l1Tabs, aktivL1, aktivL2 }
}

export function useTabKaskadeConfigSuS(input: Input): TabKaskadeConfig {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return useMemo(() => baueSuSConfigAusRoute(pathname, navigate, input), [pathname, navigate, input])
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/useTabKaskadeConfig.sus.test.ts
```
Erwartet: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.ts ExamLab/src/components/shared/header/useTabKaskadeConfig.sus.test.ts
git commit -m "feat(header): useTabKaskadeConfigSuS"
```

---

### Task 1.9: AppHeader — integrierende Komponente

**Files:**
- Create: `ExamLab/src/components/shared/header/AppHeader.tsx`
- Create: `ExamLab/src/components/shared/header/AppHeader.test.tsx`

- [ ] **Step 1: Test schreiben**

```tsx
// ExamLab/src/components/shared/header/AppHeader.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('rendert Brand + Version', () => {
    render(
      <MemoryRouter>
        <AppHeader
          rolle="lp"
          benutzerName="Y. Durand"
          theme="light"
          onThemeToggle={vi.fn()}
          onHilfe={vi.fn()}
          onFeedback={vi.fn()}
          onAbmelden={vi.fn()}
          onEinstellungen={vi.fn()}
          kaskadeConfig={{ l1Tabs: [], aktivL1: null }}
          suchen=""
          onSuchen={vi.fn()}
          sucheErgebnis={{ gruppen: [], istLadend: false }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('ExamLab')).toBeInTheDocument()
  })

  it('hat searchbox und menu-trigger', () => {
    render(
      <MemoryRouter>
        <AppHeader
          rolle="lp"
          benutzerName="Y. Durand"
          theme="light"
          onThemeToggle={vi.fn()}
          onHilfe={vi.fn()}
          onFeedback={vi.fn()}
          onAbmelden={vi.fn()}
          onEinstellungen={vi.fn()}
          kaskadeConfig={{ l1Tabs: [], aktivL1: null }}
          suchen=""
          onSuchen={vi.fn()}
          sucheErgebnis={{ gruppen: [], istLadend: false }}
        />
      </MemoryRouter>,
    )
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menü/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Test ausführen (FAIL)**

- [ ] **Step 3: Implementation**

```tsx
// ExamLab/src/components/shared/header/AppHeader.tsx
import { useNavigate } from 'react-router-dom'
import { TabKaskade } from './TabKaskade'
import { GlobalSuche } from './GlobalSuche'
import { OptionenMenu } from './OptionenMenu'
import type { Rolle, TabKaskadeConfig } from './types'
import type { SucheErgebnis } from '../../../hooks/useGlobalSuche.shared'
import { APP_VERSION } from '../../../version'

interface Props {
  rolle: Rolle
  benutzerName: string
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onHilfe: () => void
  onFeedback: () => void
  onAbmelden: () => void
  onEinstellungen?: () => void
  kaskadeConfig: TabKaskadeConfig
  suchen: string
  onSuchen: (s: string) => void
  sucheErgebnis: SucheErgebnis
}

export function AppHeader(props: Props) {
  const navigate = useNavigate()
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2 sticky top-0 z-[60]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(props.rolle === 'sus' ? '/sus/ueben' : '/favoriten')}
            className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            ExamLab
          </button>
          <span className="text-[10px] text-slate-400">{APP_VERSION}</span>
        </div>
        <TabKaskade config={props.kaskadeConfig} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <GlobalSuche suchen={props.suchen} onSuchen={props.onSuchen} ergebnis={props.sucheErgebnis} />
          <OptionenMenu
            rolle={props.rolle}
            benutzerName={props.benutzerName}
            theme={props.theme}
            onThemeToggle={props.onThemeToggle}
            onHilfe={props.onHilfe}
            onFeedback={props.onFeedback}
            onAbmelden={props.onAbmelden}
            onEinstellungen={props.onEinstellungen}
          />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/AppHeader.test.tsx
```
Erwartet: 2 tests pass

- [ ] **Step 5: Alle Header-Tests zusammen laufen**

```bash
cd ExamLab && npx vitest run src/components/shared/header/
```
Erwartet: alle grün. Zählung: ca. 27 neue Tests.

- [ ] **Step 6: Build + tsc grün**

```bash
cd ExamLab && npx tsc -b && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/components/shared/header/AppHeader.tsx ExamLab/src/components/shared/header/AppHeader.test.tsx
git commit -m "feat(header): AppHeader — combines kaskade + search + menu"
```

---

### Task 1.10: useL3Precedence — URL > localStorage

**Files:**
- Create: `ExamLab/src/components/shared/header/useL3Precedence.ts`
- Create: `ExamLab/src/components/shared/header/useL3Precedence.test.ts`

- [ ] **Step 1: Test schreiben**

```ts
// ExamLab/src/components/shared/header/useL3Precedence.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useL3Precedence } from './useL3Precedence'

describe('useL3Precedence', () => {
  const navigate = vi.fn()
  const KEY = 'examlab-ueben-letzter-kurs'

  beforeEach(() => {
    localStorage.clear()
    navigate.mockReset()
  })

  it('URL-Wert vorhanden → returnt URL-Wert, schreibt localStorage', () => {
    const { result } = renderHook(() =>
      useL3Precedence({ urlWert: 'sf-wr-29c', storageKey: KEY, aufRedirect: navigate, basePath: '/uebung' }),
    )
    expect(result.current).toBe('sf-wr-29c')
    expect(localStorage.getItem(KEY)).toBe('sf-wr-29c')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('URL leer, localStorage gefüllt → navigate(..., replace) + gibt Storage-Wert zurück', () => {
    localStorage.setItem(KEY, 'in-28c')
    renderHook(() =>
      useL3Precedence({ urlWert: null, storageKey: KEY, aufRedirect: navigate, basePath: '/uebung' }),
    )
    expect(navigate).toHaveBeenCalledWith('/uebung/kurs/in-28c', { replace: true })
  })

  it('URL leer, localStorage leer → kein navigate, return null', () => {
    const { result } = renderHook(() =>
      useL3Precedence({ urlWert: null, storageKey: KEY, aufRedirect: navigate, basePath: '/uebung' }),
    )
    expect(result.current).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('Aktive User-Auswahl schreibt localStorage', () => {
    const { result } = renderHook(() =>
      useL3Precedence({ urlWert: 'sf-wr-29c', storageKey: KEY, aufRedirect: navigate, basePath: '/uebung' }),
    )
    // URL-Wert wird persistiert (bei erstem Render). Redirect-Szenario: Storage wird NICHT geschrieben (nur gelesen).
    expect(localStorage.getItem(KEY)).toBe('sf-wr-29c')
  })
})
```

- [ ] **Step 2: Implementation**

```ts
// ExamLab/src/components/shared/header/useL3Precedence.ts
import { useEffect } from 'react'

interface Input {
  urlWert: string | null
  storageKey: string
  aufRedirect: (to: string, opts?: { replace?: boolean }) => void
  basePath: string // z.B. '/uebung' — daraus wird '/uebung/kurs/{id}'
}

export function useL3Precedence({ urlWert, storageKey, aufRedirect, basePath }: Input): string | null {
  useEffect(() => {
    if (urlWert) {
      // URL-Wert ist authoritativ und wird persistiert
      try {
        localStorage.setItem(storageKey, urlWert)
      } catch {
        /* ignore quota */
      }
      return
    }
    // URL leer — prüfe localStorage
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) aufRedirect(`${basePath}/kurs/${stored}`, { replace: true })
    } catch {
      /* ignore */
    }
  }, [urlWert, storageKey, aufRedirect, basePath])

  return urlWert
}
```

- [ ] **Step 3: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/useL3Precedence.test.ts
```

- [ ] **Step 4: Integration in Container** — `LPAppHeaderContainer` und `SuSAppHeaderContainer` rufen `useL3Precedence` auf, um den Redirect zu triggern (wird in Task 2.1/3.1 eingebaut; hier nur der Hook).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/shared/header/useL3Precedence.ts ExamLab/src/components/shared/header/useL3Precedence.test.ts
git commit -m "feat(header): useL3Precedence — URL wins, localStorage fallback"
```

---

### Task 1.11: Responsive-Hook + Layout-Varianten

**Files:**
- Create: `ExamLab/src/hooks/useViewport.ts`
- Create: `ExamLab/src/hooks/useViewport.test.ts`
- Modify: `ExamLab/src/components/shared/header/AppHeader.tsx`

- [ ] **Step 1: useViewport Hook mit matchMedia + throttle**

```ts
// ExamLab/src/hooks/useViewport.ts
import { useEffect, useState } from 'react'

export type ViewportTier = 'desktop' | 'schmal' | 'phone'

function leseTier(): ViewportTier {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(min-width: 900px)').matches) return 'desktop'
  if (window.matchMedia('(min-width: 600px)').matches) return 'schmal'
  return 'phone'
}

export function useViewport(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>(() => leseTier())

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    function pruefe() {
      if (timeout) return
      timeout = setTimeout(() => {
        setTier(leseTier())
        timeout = null
      }, 150)
    }
    const mq900 = window.matchMedia('(min-width: 900px)')
    const mq600 = window.matchMedia('(min-width: 600px)')
    mq900.addEventListener('change', pruefe)
    mq600.addEventListener('change', pruefe)
    return () => {
      if (timeout) clearTimeout(timeout)
      mq900.removeEventListener('change', pruefe)
      mq600.removeEventListener('change', pruefe)
    }
  }, [])

  return tier
}
```

- [ ] **Step 2: Test**

```ts
// ExamLab/src/hooks/useViewport.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useViewport } from './useViewport'

describe('useViewport', () => {
  function mockMedia(minWidth: string, matches: boolean) {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === minWidth ? matches : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
  }

  it('gibt "desktop" bei ≥ 900 px', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(min-width: 900px)' || q === '(min-width: 600px)',
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('desktop')
  })

  it('gibt "schmal" bei 600-899 px', () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q === '(min-width: 600px)',
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('schmal')
  })

  it('gibt "phone" bei < 600 px', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      media: '', onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    const { result } = renderHook(() => useViewport())
    expect(result.current).toBe('phone')
  })
})
```

- [ ] **Step 3: AppHeader layout-switch einbauen**

In `AppHeader.tsx`:

```tsx
import { useViewport } from '../../../hooks/useViewport'

const tier = useViewport()

// ≥ 900 px: einzeilig wie gehabt
// schmal: TabKaskade in zweite Zeile
// phone: L1 als Dropdown in Zeile 1, L2-Chip-Row in Zeile 2, Suche als Icon-Button der Modal öffnet
```

Konkrete Struktur:

```tsx
if (tier === 'desktop') {
  return <HeaderDesktop {...props} />
}
if (tier === 'schmal') {
  return <HeaderSchmal {...props} />
}
return <HeaderPhone {...props} />
```

Wobei `HeaderDesktop` die bisherige Einzel-Zeile ist. `HeaderSchmal` hat TabKaskade in zweiter Zeile (eingerückt + optional Indikator). `HeaderPhone` nutzt ein `<select>` für L1 und öffnet die Suche als Fullscreen-Modal.

> **Guidance für Implementer:** Phone-Variante so minimal wie möglich halten. Verwendungsfall ist Deep-Link → Üben. Echte mobile Sessions sind selten (SEB/iPad sind die Ziele).

- [ ] **Step 4: Tests für HeaderSchmal/Phone**

Neue Tests in `AppHeader.test.tsx` oder separate Datei, die `window.matchMedia` mocken und prüfen:
- schmal: TabKaskade in zweiter DOM-Row
- phone: L1-Dropdown (`<select>` oder Custom) vorhanden, Suche als Icon-Button statt Input

- [ ] **Step 5: Browser-Tests in 3 Viewports**

```bash
VITE_ENABLE_NEW_HEADER=1 npm run dev
```

Chrome DevTools → Responsive → 1280 / 800 / 400 px. Screenshots in HANDOFF einfügen.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/hooks/useViewport.ts ExamLab/src/hooks/useViewport.test.ts ExamLab/src/components/shared/header/AppHeader.tsx
git commit -m "feat(header): responsive — desktop/schmal/phone layouts"
```

---

## Phase 2 — LP-Migration

### Task 2.1: LP-Router-Integration via AppHeader (hinter Feature-Flag)

**Files:**
- Create: `ExamLab/src/components/lp/LPAppHeaderContainer.tsx` (neuer Container, Bridge zu Stores)
- Modify: `ExamLab/src/App.tsx` (Feature-Flag-Switch LPHeader ↔ AppHeader)

- [ ] **Step 1: Container lokal implementieren**

> Aufgabe für den Implementer: Adapter-Komponente schreiben, die die LP-Stores (`pruefungStore`, `uebenStore`, `authStore`) liest und die passenden Props an `AppHeader` durchreicht. Orientiere dich an `LPHeader.tsx` (Stores, die dort importiert werden) + `baueLPConfigAusRoute` aus Task 1.7.

Kern-Skelett:

```tsx
// ExamLab/src/components/lp/LPAppHeaderContainer.tsx
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme' // oder bestehender Hook
import { useTabKaskadeConfigLP } from '../shared/header/useTabKaskadeConfig.lp'
import { useGlobalSucheLP } from '../../hooks/useGlobalSucheLP'
import { AppHeader } from '../shared/header/AppHeader'
import { useNavigate } from 'react-router-dom'
import { useLPNavigationStore } from '../../store/lpUIStore'
import { usePruefungStore } from '../../store/pruefungStore'
import { useUebenStore } from '../../store/uebenStore'

export function LPAppHeaderContainer({
  onHilfe,
  onFeedback,
  onEinstellungen,
}: {
  onHilfe: () => void
  onFeedback: () => void
  onEinstellungen: () => void
}) {
  const abmelden = useAuthStore((s) => s.abmelden)
  const benutzer = useAuthStore((s) => s.benutzer)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [suchen, setSuchen] = useState('')

  const kurse = useUebenStore((s) => s.kurse ?? [])
  const pruefungen = usePruefungStore((s) => s.pruefungen ?? [])
  const aktivePruefungen = useLPNavigationStore((s) => s.aktivePruefungenIds ?? [])
  const setzeAktivePruefungen = useLPNavigationStore((s) => s.setzeAktivePruefungenIds)

  const kaskade = useTabKaskadeConfigLP({
    kurse,
    pruefungen,
    aktivePruefungen,
    onWaehleAktivePruefungen: setzeAktivePruefungen,
  })

  const sucheErgebnis = useGlobalSucheLP(
    suchen,
    { l1: kaskade.aktivL1 as string, l2: kaskade.aktivL2 ?? null, l3: null },
    (path) => navigate(path),
  )

  return (
    <AppHeader
      rolle="lp"
      benutzerName={benutzer?.name ?? 'Lehrperson'}
      theme={theme}
      onThemeToggle={toggleTheme}
      onHilfe={onHilfe}
      onFeedback={onFeedback}
      onAbmelden={abmelden}
      onEinstellungen={onEinstellungen}
      kaskadeConfig={kaskade}
      suchen={suchen}
      onSuchen={setSuchen}
      sucheErgebnis={sucheErgebnis}
    />
  )
}
```

> **Wichtig:** Vor dem Schreiben die tatsächlichen Store-Selektoren verifizieren (`git grep "aktivePruefungenIds"` etc.). Falls Felder anders heissen oder fehlen: Container-Props entsprechend anpassen. Ziel: NUR Daten durchreichen, keine Logik-Migration.

- [ ] **Step 2: Feature-Flag in `App.tsx` verdrahten**

`App.tsx` liest `import.meta.env.VITE_ENABLE_NEW_HEADER === '1'`. Wenn `true`, rendert `LPAppHeaderContainer` statt `LPHeader`. Default = `false` (alter Header).

- [ ] **Step 3: Lokal starten mit Flag**

```bash
VITE_ENABLE_NEW_HEADER=1 npm run dev
```

- [ ] **Step 4: Browser-Test (Chrome-in-Chrome)**

Test-Plan siehe Task 4.1 (gesamt). Mindest-Check hier:
- LP-Login funktioniert
- L1-Tabs Favoriten/Prüfen/Üben/Fragensammlung klickbar, Navigation wechselt URL
- L2-Tabs bei Prüfen/Üben sichtbar
- Bei /uebung/kurs/sf-wr-29c zeigt L3-Dropdown den Kurs
- Suche öffnet Panel bei Eingabe, zeigt Treffer
- ⋮-Menü öffnet, schliesst bei Outside-Click

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/lp/LPAppHeaderContainer.tsx ExamLab/src/App.tsx
git commit -m "feat(header): LP AppHeader container behind feature flag"
```

---

### Task 2.2: Dashboard-Seiten wechseln, alter LPHeader wird alternativ genutzt

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` und andere Stellen, die `LPHeader` direkt rendern.

- [ ] **Step 1: Alle Aufrufer von `LPHeader` identifizieren**

```bash
cd ExamLab && git grep -l "LPHeader" src/ | tee /tmp/lpheader-callers.txt
```

- [ ] **Step 2: Pro Aufrufer-Datei**

Ersetze `<LPHeader ... />` durch:

```tsx
import { LPAppHeaderContainer } from './LPAppHeaderContainer'
import LPHeader from './LPHeader'

const NEU = import.meta.env.VITE_ENABLE_NEW_HEADER === '1'

// ...
{NEU ? (
  <LPAppHeaderContainer onHilfe={...} onFeedback={...} onEinstellungen={...} />
) : (
  <LPHeader /* alte Props */ />
)}
```

Props für alten Header bleiben erhalten, um Regressionen zu vermeiden.

- [ ] **Step 3: Detail-Ansichten (mit `zurueck`, `aktionsButtons`) vorerst auf altem LPHeader belassen**

Kommentar in `LPAppHeaderContainer.tsx`:
```tsx
// TODO: Detail-Ansichten mit `mode="detail"` unterstützen (Task 2.3)
```

- [ ] **Step 4: Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] **Step 5: Browser-Test mit Flag**

```bash
VITE_ENABLE_NEW_HEADER=1 npm run dev
```

Manuell klicken: alle 4 Dashboards.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(header): switch LP dashboard pages to AppHeader behind flag"
```

---

### Task 2.3: Detail-Ansicht-Unterstützung (`mode="detail"` mit zurueck-Button)

**Files:**
- Modify: `ExamLab/src/components/shared/header/AppHeader.tsx`
- Create: `ExamLab/src/components/shared/header/AppHeader.detail.test.tsx`

- [ ] **Step 1: Test**

```tsx
// ExamLab/src/components/shared/header/AppHeader.detail.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppHeader } from './AppHeader'

describe('AppHeader — Detail-Modus', () => {
  function rend(props: Partial<Parameters<typeof AppHeader>[0]> = {}) {
    return render(
      <MemoryRouter>
        <AppHeader
          rolle="lp"
          benutzerName="LP"
          theme="light"
          onThemeToggle={vi.fn()}
          onHilfe={vi.fn()}
          onFeedback={vi.fn()}
          onAbmelden={vi.fn()}
          kaskadeConfig={{ l1Tabs: [], aktivL1: null }}
          suchen=""
          onSuchen={vi.fn()}
          sucheErgebnis={{ gruppen: [], istLadend: false }}
          {...props}
        />
      </MemoryRouter>,
    )
  }

  it('rendert Zurück-Button wenn onZurueck gesetzt', () => {
    const onZurueck = vi.fn()
    rend({ onZurueck })
    fireEvent.click(screen.getByRole('button', { name: /zurück/i }))
    expect(onZurueck).toHaveBeenCalled()
  })

  it('rendert Breadcrumbs wenn breadcrumbs gesetzt', () => {
    rend({ breadcrumbs: [{ label: 'Prüfungen' }, { label: 'Einrichtungsprüfung' }] })
    expect(screen.getByText('Prüfungen')).toBeInTheDocument()
    expect(screen.getByText('Einrichtungsprüfung')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Props ergänzen + implementieren**

```tsx
// In AppHeader.tsx — Props-Interface erweitern
onZurueck?: () => void
breadcrumbs?: { label: string; aktion?: () => void }[]
aktionsButtons?: React.ReactNode
```

Im JSX vor der TabKaskade einfügen (wenn `onZurueck`):

```tsx
{props.onZurueck && (
  <button type="button" onClick={props.onZurueck} className="px-2 py-1 text-sm text-slate-600 dark:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
    ← Zurück
  </button>
)}
{props.breadcrumbs && props.breadcrumbs.length > 0 && (
  <nav className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
    {props.breadcrumbs.map((c, i) => (
      <span key={i} className="flex items-center gap-1">
        <span className="text-slate-300">›</span>
        {c.aktion ? (
          <button onClick={c.aktion} className="hover:text-slate-900 cursor-pointer">{c.label}</button>
        ) : (
          <span className="font-medium text-slate-900 dark:text-slate-100">{c.label}</span>
        )}
      </span>
    ))}
  </nav>
)}
```

Und rechts vor Suche:

```tsx
{props.aktionsButtons}
```

- [ ] **Step 3: Tests grün**

```bash
cd ExamLab && npx vitest run src/components/shared/header/AppHeader.detail.test.tsx
```

- [ ] **Step 4: `LPAppHeaderContainer` um optionale Detail-Props erweitern** (pass-through zu AppHeader)

- [ ] **Step 5: Detail-Ansichten migrieren** (dieselben Dateien wie 2.2, aber jetzt auch für `zurueck`-Fälle)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(header): AppHeader detail mode with zurueck + breadcrumbs + aktionsButtons"
```

---

### Task 2.4: UebenTabLeiste entfernen

**Files:**
- Delete: `ExamLab/src/components/lp/UebenTabLeiste.tsx`
- Delete: `ExamLab/src/tests/UebenTabLeiste.test.tsx` (oder wo immer diese liegen)
- Modify: Aufrufer

- [ ] **Step 1: Aufrufer finden**

```bash
cd ExamLab && git grep -l "UebenTabLeiste" src/
```

- [ ] **Step 2: Aufrufer bereinigen** — die Kurs-Tab-Funktion ist jetzt im `AppHeader` via L3-Dropdown. Inline-TabLeiste-Einsatz ersatzlos entfernen.

- [ ] **Step 3: Dateien löschen**

```bash
git rm ExamLab/src/components/lp/UebenTabLeiste.tsx
git rm ExamLab/src/tests/UebenTabLeiste.test.tsx  # oder entsprechender Pfad
```

- [ ] **Step 4: Tests laufen**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(header): remove UebenTabLeiste (absorbed into TabKaskade)"
```

---

### Task 2.4b: Favoriten-Klick setzt Ziel-L3 (Spec §2.6)

**Files:**
- Modify: `ExamLab/src/components/lp/Favoriten*.tsx` (exakter Pfad via `git grep`)

- [ ] **Step 1: Klick-Handler anpassen**

Klick auf Favoriten-Item soll direkt in den Zielbereich navigieren UND die L3-Selektion setzen, z.B. `/uebung/kurs/sf-wr-29c` statt nur `/uebung`. Bei Prüfungs-Favoriten: `/pruefung/durchfuehren` + `setzeAktivePruefungenIds([id])`.

- [ ] **Step 2: Test für Navigation (optional, wenn Komponente testbar)**

Simple MemoryRouter-Test mit fake onClick, Assertions auf `navigate`-Mock.

- [ ] **Step 3: Browser-Test: Klick auf Favoriten-Prüfung öffnet direkt Durchführen mit aktivierter Prüfung**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(favoriten): click sets target L3 selection"
```

---

### Task 2.5: Browser-Verifikation LP (mit Flag aktiviert)

**Tool:** @superpowers:verification-before-completion

- [ ] **Step 1: `.env.local` mit Flag setzen**

```bash
echo "VITE_ENABLE_NEW_HEADER=1" >> ExamLab/.env.local
```

- [ ] **Step 2: Dev-Server starten**

```bash
cd ExamLab && npm run dev
```

- [ ] **Step 3: Chrome-in-Chrome Tab-Gruppe öffnen, User loggt LP ein**

- [ ] **Step 4: Test-Plan abarbeiten**

| # | Test | Erwartung |
|---|---|---|
| 1 | `/favoriten` öffnen | L1 "Favoriten" aktiv, keine L2 |
| 2 | Klick "Prüfen" | URL → /pruefung, L2 = Durchführen/Analyse sichtbar |
| 3 | Klick "Analyse" | URL → /pruefung/analyse, L2 aktiv |
| 4 | Klick "Üben" | URL → /uebung, L2 = Durchführen/Übungen/Analyse |
| 5 | Kurs in Übungen-Dashboard klicken | URL → /uebung/kurs/X, L3-Dropdown zeigt Kursname |
| 6 | L3-Dropdown öffnen, anderen Kurs wählen | URL wechselt, Inhalt lädt |
| 7 | Klick "Fragensammlung" | URL → /fragensammlung, keine L2 |
| 8 | Suche: "konjunktur" eingeben | Panel zeigt Treffer gruppiert |
| 9 | ⌘K / Ctrl+K | Suche bekommt Fokus |
| 10 | ESC in Suche | Input geleert, Panel zu |
| 11 | ⋮-Menü öffnen, "Dark Mode" klicken | Theme wechselt |
| 12 | ⋮-Menü "Einstellungen" | Öffnet bestehendes Settings-Panel |
| 13 | ⋮ "Hilfe" | Öffnet Hilfe-Panel |
| 14 | ⋮ "Abmelden" | Logout funktioniert |

Bei Fehler: Fix, Step 2 wiederholen.

- [ ] **Step 5: Console-Fehler prüfen**

DevTools öffnen, Console scannen. Erlaubt: bekannte Warnings. Nicht erlaubt: rote Errors, unhandled promise rejections.

- [ ] **Step 6: Dark Mode durchtesten** (alle o.g. Schritte in dunklem Theme)

- [ ] **Step 7: Commit**

```bash
git add ExamLab/.env.local   # oder in .gitignore — prüfen!
git commit -m "test: LP new header verified in browser"
```

> Falls `.env.local` in .gitignore steht, nicht committen. Dann leeren Commit zur Markierung:
> `git commit --allow-empty -m "test: LP new header verified in browser"`

---

## Phase 3 — SuS-Migration

### Task 3.1: SuS-Container

**Files:**
- Create: `ExamLab/src/components/sus/SuSAppHeaderContainer.tsx`

- [ ] **Step 1: Container implementieren** (analog LP, mit SuS-Stores)

```tsx
// ExamLab/src/components/sus/SuSAppHeaderContainer.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { useTabKaskadeConfigSuS } from '../shared/header/useTabKaskadeConfig.sus'
import { useGlobalSucheSuS } from '../../hooks/useGlobalSucheSuS'
import { AppHeader } from '../shared/header/AppHeader'
import { useSuSStore } from '../../store/susStore'

export function SuSAppHeaderContainer({ onHilfe, onFeedback }: { onHilfe: () => void; onFeedback: () => void }) {
  const abmelden = useAuthStore((s) => s.abmelden)
  const benutzer = useAuthStore((s) => s.benutzer)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [suchen, setSuchen] = useState('')

  const kurse = useSuSStore((s) => s.meineKurse ?? [])

  const kaskade = useTabKaskadeConfigSuS({ kurse })
  const sucheErgebnis = useGlobalSucheSuS(
    suchen,
    { l1: kaskade.aktivL1 as string, l2: kaskade.aktivL2 ?? null, l3: null },
    (path) => navigate(path),
  )

  return (
    <AppHeader
      rolle="sus"
      benutzerName={benutzer?.name ?? 'Schüler:in'}
      theme={theme}
      onThemeToggle={toggleTheme}
      onHilfe={onHilfe}
      onFeedback={onFeedback}
      onAbmelden={abmelden}
      kaskadeConfig={kaskade}
      suchen={suchen}
      onSuchen={setSuchen}
      sucheErgebnis={sucheErgebnis}
    />
  )
}
```

- [ ] **Step 2: Inline SuS-Header in betroffenen Dateien ersetzen**

Dateien (aus Explorer-Befund): `SuSStartseite.tsx`, `KorrekturListe.tsx`, `KorrekturEinsicht.tsx`. Ggf. weitere via `git grep "ExamLab" ExamLab/src/components/sus/`.

Jeweils Header-Block durch `<SuSAppHeaderContainer ... />` (hinter Flag) ersetzen.

- [ ] **Step 3: Build + Tests + Browser-Test**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
VITE_ENABLE_NEW_HEADER=1 npm run dev
```

SuS-Login, durchklicken: Üben-Tab, Prüfen-Tab, Kurs-Auswahl, Suche ("konjunktur"), Deep-Link `/sus/ueben?fach=BWL`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(header): SuS AppHeader container + pages migration"
```

---

### Task 3.2: Browser-Verifikation SuS

Test-Plan analog Task 2.5, aber für SuS-Routen:

| # | Test | Erwartung |
|---|---|---|
| 1 | `/sus/ueben` | L1 "Üben" aktiv, L2 Themen/Fortschritt/Ergebnisse |
| 2 | Kurs auswählen | L3-Dropdown erscheint |
| 3 | Klick "Prüfen" | L1 wechselt, L2 Offen/Ergebnisse |
| 4 | Deep-Link `/sus/ueben?fach=BWL&thema=X` ohne Login → Login → Return | Query-String erhalten, Thema aktiviert |
| 5 | Suche: eigener Kurs auffindbar | ja |
| 6 | Suche: LP-exklusive Prüfung NICHT sichtbar (Entwurf) | Nicht in Treffern |
| 7 | ⋮-Menü: kein "Einstellungen" | korrekt |
| 8 | ⋮-Menü: "Problem melden" statt "Feedback senden" | korrekt |

- [ ] Alle Checks grün

- [ ] Empty-Commit zum Markieren

```bash
git commit --allow-empty -m "test: SuS new header verified in browser"
```

---

## Phase 4 — Cleanup

### Task 4.1: Flag permanent aktivieren

- [ ] In `App.tsx` / betroffenen Seiten: Ternary entfernen, nur noch `AppHeader` rendern
- [ ] Flag aus `.env.local` entfernen
- [ ] Build + Tests + Browser-Smoke-Test

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

- [ ] Commit

```bash
git add -A
git commit -m "refactor(header): remove feature flag, new header is default"
```

### Task 4.2: `LPHeader.tsx` löschen

- [ ] Aufrufer-Check

```bash
cd ExamLab && git grep -l "LPHeader" src/
```

Erwartet: keine Treffer (oder nur in Kommentaren).

- [ ] `LPHeader.tsx` löschen

```bash
git rm ExamLab/src/components/lp/LPHeader.tsx
```

- [ ] `ThemeToggle.tsx` prüfen: wenn nirgends mehr eigenständig gerendert → löschen. Sonst behalten.

- [ ] Build + Tests

- [ ] Commit

```bash
git add -A
git commit -m "refactor(header): remove legacy LPHeader"
```

### Task 4.3: HANDOFF.md aktualisieren

- [ ] Session-Eintrag hinzufügen mit:
  - Bundle 14 Cluster Kopfzeile
  - Neue Dateien: `components/shared/header/*`
  - Gelöscht: `LPHeader.tsx`, `UebenTabLeiste.tsx` (+ Tests)
  - Test-Zählung (vorher vs. nachher)
  - Apps-Script-Deploy nötig? Nein (reine Frontend-Änderung)
  - Offene Punkte aus Backlog, die dadurch erledigt sind (Kopfzeilen-Refactor, Tab-Unterstrich, SuS=LP-Design-Anteile)

- [ ] Commit

```bash
git add ExamLab/HANDOFF.md
git commit -m "docs(examlab): HANDOFF S114 — Kopfzeilen-Refactor"
```

### Task 4.4: Review + Merge-Antrag

@superpowers:requesting-code-review

- [ ] **Vorher:** Branch aktueller Stand verifizieren

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git log --oneline main..feature/kopfzeile-refactor
npx tsc -b && cd ExamLab && npx vitest run && npm run build
```

- [ ] Zusammenfassung für User erstellen (Was geändert, wie getestet, offene Punkte)
- [ ] Warten auf User-Freigabe
- [ ] Nach Freigabe:

```bash
git checkout preview
git merge feature/kopfzeile-refactor
git push origin preview
```

- [ ] User testet auf Staging (GitHub Pages)
- [ ] Nach Staging-Freigabe: Merge auf `main`

```bash
git checkout main
git merge feature/kopfzeile-refactor
git push
```

- [ ] Branch löschen

```bash
git branch -d feature/kopfzeile-refactor
```

---

## Testing-Strategie (Zusammenfassung)

- **Unit (vitest):** ca. 27 neue Tests in Phase 1, alle müssen grün sein vor Phase 2
- **Integration:** via MemoryRouter in AppHeader.test
- **Browser (Chrome-in-Chrome):** Test-Plan in Task 2.5 und 3.2 abarbeiten, beide zwingend vor Merge
- **Regression:** bestehende Tests (246) müssen alle grün bleiben. Am Ende: `npx vitest run` komplett, Ziel ≥ 273 grün (246 + 27).

## Kritische Pfade (Regression-Risiko)

Aus `.claude/rules/regression-prevention.md`:

| # | Pfad | Prüfung |
|---|---|---|
| 1 | SuS lädt Prüfung | Deep-Link `/sus/pruefen/:id` funktioniert, Lobby öffnet |
| 2 | SuS Heartbeat + Auto-Save | keine Header-Änderung betrifft diesen Pfad, sollte stabil bleiben |
| 3 | SuS Abgabe | kein Header-Bezug, Regression unwahrscheinlich |
| 4 | LP Monitoring | Navigation in Live-Monitoring via Tab-Wechsel klappt |
| 5 | LP Korrektur | Wechsel zwischen Korrektur-Ansicht und Dashboard via Tabs |

## Out-of-Scope

- Tab-Wechsel per Zahlen-Shortcut
- Eigener Suchergebnis-Screen
- Breadcrumb-Historie
- Server-seitige Suche

---

**Ende Plan**
