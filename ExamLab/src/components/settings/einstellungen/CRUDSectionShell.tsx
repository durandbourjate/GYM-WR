import type { ReactNode } from 'react'

interface Props {
  /** Label-Text vor dem Count */
  label: string
  /** Anzahl der Items (für Count-Klammer) */
  count: number
  /** Bearbeitungsmodus aktiv? Steuert Sichtbarkeit von Add-Button + Item-Delete-Buttons */
  bearbeiten: boolean
  /** Soll der Add-Button gerade sichtbar sein? (false z.B. wenn Editor schon offen) */
  showAddButton: boolean
  /** Label für Add-Button (z.B. "+ Gefäss") */
  addLabel: string
  /** Add-Button Click → Editor öffnen */
  onAdd: () => void
  /** Optionaler Hinweistext unter den Items */
  hint?: string
  /** Items + Inline-Editor (per Caller) */
  children: ReactNode
}

/**
 * Shared Header-Schale für CRUD-Sektionen im AdminTab. Bündelt
 * den wiederholten Label/Count/Add-Button-Header + optionalen Hint
 * — Items und Inline-Editor werden per Caller in `children` geliefert.
 */
export default function CRUDSectionShell({
  label, count, bearbeiten, showAddButton, addLabel, onAdd, hint, children,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label} ({count})
        </label>
        {bearbeiten && showAddButton && (
          <button
            onClick={onAdd}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            {addLabel}
          </button>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{hint}</p>
      )}
    </div>
  )
}
