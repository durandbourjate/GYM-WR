import { useState } from 'react'
import { L3Dropdown } from './L3Dropdown'
import type { TabKaskadeConfig, L1Tab, L2Tab } from './types'

interface Props {
  config: TabKaskadeConfig
}

// === Tab-States (einheitlich über L1/L2/L3) ===
const TAB_BASE =
  'px-3 py-1.5 text-sm rounded-md cursor-pointer whitespace-nowrap ' +
  'inline-flex items-center gap-1 border-l-2 border-b-2 border-transparent transition-colors'

const TAB_INACTIVE =
  'text-slate-600 dark:text-slate-400 ' +
  'hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 hover:font-medium ' +
  'hover:border-l-slate-400 dark:hover:border-l-slate-600 ' +
  'hover:border-b-slate-400 dark:hover:border-b-slate-600 ' +
  'hover:rounded-bl-lg'

// Parent = L1 wenn L2 aktiv, L2 wenn L3 aktiv → slate ⌐
const TAB_PARENT =
  'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium ' +
  'border-l-slate-400 dark:border-l-slate-600 ' +
  'border-b-slate-400 dark:border-b-slate-600 ' +
  'rounded-bl-lg'

// Aktiv = innerster Tab mit Fokus → violett ⌐
const TAB_ACTIVE =
  'bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 font-semibold ' +
  'border-l-violet-500 border-b-violet-500 rounded-bl-lg'

// Super-Chip-Container pro L1-Gruppe
const SUPER_CHIP = 'inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg'

export function TabKaskade({ config }: Props) {
  const { l1Tabs, aktivL1, aktivL2 } = config

  return (
    <div
      className="flex items-center gap-2 flex-1 flex-nowrap overflow-x-clip py-1"
      role="tablist"
      aria-label="Hauptnavigation"
      onKeyDown={onL1KeyDown}
    >
      {l1Tabs.map((t1) => (
        <SuperChip key={t1.id} t1={t1} l1Aktiv={t1.id === aktivL1} aktivL2={aktivL2 ?? null} />
      ))}

      {/* Screen-Reader Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {aktivL1 ? `Ansicht ${l1Tabs.find((t) => t.id === aktivL1)?.label ?? ''} aktiv` : ''}
      </div>
    </div>
  )
}

function SuperChip({ t1, l1Aktiv, aktivL2 }: { t1: L1Tab; l1Aktiv: boolean; aktivL2: string | null }) {
  const [hovered, setHovered] = useState(false)
  const hatL2 = !!t1.l2 && t1.l2.length > 0
  // L1 ist "Parent" wenn aktiv MIT L2, sonst "Aktiv" wenn ohne L2, sonst "Inaktiv"
  const l1State: TabState = l1Aktiv ? (hatL2 ? 'parent' : 'active') : 'inactive'
  const zeigeL2 = hatL2 && (l1Aktiv || hovered)

  return (
    <div
      className={SUPER_CHIP}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {renderTab(t1.label, l1State, t1.onClick, true)}

      {zeigeL2 && (
        <div
          role="tablist"
          aria-label={`Ansichten für ${t1.label}`}
          className="inline-flex items-center gap-0.5"
        >
          {t1.l2!.map((t2) => (
            <L2Block key={t2.id} t2={t2} l1Aktiv={l1Aktiv} aktivL2={aktivL2} />
          ))}
        </div>
      )}
    </div>
  )
}

function L2Block({ t2, l1Aktiv, aktivL2 }: { t2: L2Tab; l1Aktiv: boolean; aktivL2: string | null }) {
  const [hovered, setHovered] = useState(false)
  const l2Aktiv = l1Aktiv && t2.id === aktivL2
  const hatL3 = !!t2.l3 && t2.l3.items.length > 0

  // L2-State: parent wenn aktiv+L3 vorhanden, active wenn aktiv+kein L3, inactive sonst
  const l2State: TabState = l2Aktiv ? (hatL3 ? 'parent' : 'active') : 'inactive'

  // L3-Dropdown sichtbar wenn L2 aktiv ODER gehovert (und L2 hat L3).
  const zeigeL3 = hatL3 && (l2Aktiv || hovered)

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {renderTab(t2.label, l2State, t2.onClick)}
      {zeigeL3 && (
        <L3Dropdown
          mode={t2.l3!.mode}
          items={t2.l3!.items}
          selectedIds={t2.l3!.selectedIds}
          onSelect={t2.l3!.onSelect}
          onAddNew={t2.l3!.onAddNew}
          addNewLabel={t2.l3!.addNewLabel}
          placeholder={t2.l3!.placeholder}
        />
      )}
    </div>
  )
}

type TabState = 'inactive' | 'parent' | 'active'

function renderTab(label: string, state: TabState, onClick: () => void, isL1 = false) {
  const stateClass = state === 'active' ? TAB_ACTIVE : state === 'parent' ? TAB_PARENT : TAB_INACTIVE
  return (
    <button
      type="button"
      role="tab"
      aria-selected={state !== 'inactive'}
      onClick={onClick}
      title={label}
      className={`${TAB_BASE} ${stateClass}`}
      {...(isL1 ? { 'data-l1-tab': '' } : {})}
    >
      {label}
    </button>
  )
}

function onL1KeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-l1-tab]'))
  const current = tabs.findIndex((t) => t === document.activeElement)
  if (current < 0) return
  const delta = e.key === 'ArrowRight' ? 1 : -1
  const next = (current + delta + tabs.length) % tabs.length
  tabs[next]?.focus()
  e.preventDefault()
}
