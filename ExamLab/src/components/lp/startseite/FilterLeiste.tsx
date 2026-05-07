import type { ReactNode } from 'react'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'

export interface FilterLeisteProps {
  verfuegbareFachbereiche: string[]
  filterFach: string[]
  toggleFachFilter: (fach: string) => void
  verfuegbareGefaesse: string[]
  filterGefaess: string | null
  setFilterGefaess: (g: string | null) => void
  filterStatus: 'alle' | 'aktiv' | 'archiviert'
  setFilterStatus: (s: 'alle' | 'aktiv' | 'archiviert') => void
  sortierung: 'datum' | 'titel' | 'klasse'
  setSortierung: (s: 'datum' | 'titel' | 'klasse') => void
  hatAktiveFilter: boolean
  resetFilter: () => void
  aktionSlot: ReactNode
}

/**
 * DRY-Toolbar: konsolidiert die 2 Filter-Toolbars (Übungen + Prüfungen).
 * Vorher: 2× nahezu-identischer JSX in LPStartseite.tsx Z. 537-606 + Z. 688-755.
 * Gefäss-Sektion bedingt gerendert (verfuegbareGefaesse.length > 0).
 */
export function FilterLeiste(props: FilterLeisteProps) {
  const {
    verfuegbareFachbereiche, filterFach, toggleFachFilter,
    verfuegbareGefaesse, filterGefaess, setFilterGefaess,
    filterStatus, setFilterStatus, sortierung, setSortierung,
    hatAktiveFilter, resetFilter, aktionSlot,
  } = props

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {verfuegbareFachbereiche.map(fb => {
          const farbe = getFachFarbe(fb, {})
          const aktiv = filterFach.includes(fb)
          return (
            <button
              key={fb}
              onClick={() => toggleFachFilter(fb)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                !aktiv ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500' : ''
              }`}
              style={aktiv ? { backgroundColor: farbe + '20', color: farbe, borderColor: farbe + '60' } : undefined}
            >
              {fb}
            </button>
          )
        })}
        {verfuegbareGefaesse.length > 0 && <>
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
          {verfuegbareGefaesse.map(g => (
            <button
              key={g}
              onClick={() => setFilterGefaess(filterGefaess === g ? null : g)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
                filterGefaess === g
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
              }`}
            >
              {g}
            </button>
          ))}
        </>}
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        {(['aktiv', 'archiviert', 'alle'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer ${
              filterStatus === s
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-400 dark:border-slate-500 font-semibold shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-500'
            }`}
          >
            {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
          </button>
        ))}
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as 'datum' | 'titel' | 'klasse')}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="datum">Neueste zuerst</option>
          <option value="titel">Nach Titel</option>
          <option value="klasse">Nach Klasse</option>
        </select>
        {hatAktiveFilter && (
          <button
            onClick={resetFilter}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            Zurücksetzen
          </button>
        )}
        {aktionSlot}
      </div>
    </div>
  )
}
