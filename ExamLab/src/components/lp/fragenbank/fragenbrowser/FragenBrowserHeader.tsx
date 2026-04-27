import { useState, useRef, useEffect } from 'react'
import type { Frage, FrageSummary, Fachbereich, BloomStufe } from '../../../../types/fragen.ts'
import type { Sortierung, FilterPoolStatus, FilterKontext } from '../../../../hooks/useFragenFilter.ts'
import type { Gruppierung } from './gruppenHelfer.ts'
import { typLabel } from '../../../../utils/fachUtils.ts'
import Button from '../../../ui/Button.tsx'

interface Props {
  // Daten
  ladeStatus: 'laden' | 'fertig'
  gefilterteFragen: (Frage | FrageSummary)[]
  stats: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  /** Ungefilterte Stats — für Dropdown-Optionen, damit alle Werte immer sichtbar bleiben */
  alleStats?: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  verfuegbareThemen: [string, number][]
  verfuegbareUnterthemen: [string, number][]
  aktiveFilter: number

  // Filter-State
  suchtext: string
  setSuchtext: (v: string) => void
  filterFachbereich: Fachbereich | ''
  setFilterFachbereich: (v: Fachbereich | '') => void
  filterTyp: string
  setFilterTyp: (v: string) => void
  filterBloom: BloomStufe | ''
  setFilterBloom: (v: BloomStufe | '') => void
  filterThema: string
  setFilterThema: (v: string) => void
  filterUnterthema: string
  setFilterUnterthema: (v: string) => void
  filterPoolStatus: FilterPoolStatus
  setFilterPoolStatus: (v: FilterPoolStatus) => void
  filterMitAnhang: boolean
  setFilterMitAnhang: (v: boolean) => void
  filterKontext: FilterKontext
  setFilterKontext: (v: FilterKontext) => void
  filterZuruecksetzen: () => void

  // Ansicht-State
  sortierung: Sortierung
  setSortierung: (v: Sortierung) => void
  gruppierung: Gruppierung
  setGruppierung: (v: Gruppierung) => void
  setAufgeklappteGruppen: React.Dispatch<React.SetStateAction<Set<string>>>
  kompaktModus: boolean
  setKompaktModus: (v: boolean) => void

  // Aktionen
  onNeueFrageErstellen: () => void
  onBatchExport: () => void
  onImport: () => void
  onExcelImport?: () => void
  onSchliessen: () => void

  // Ziel-Info
  zielPruefungTitel?: string
  zielAbschnittTitel?: string

  // Scroll-Weiterleitung
  listeRef: React.RefObject<HTMLDivElement | null>

  /** Inline-Modus: kein Schliessen-Button */
  inline?: boolean
}

/** Header mit Suche, Filter, Sortierung und Aktions-Buttons */
export default function FragenBrowserHeader({
  ladeStatus, gefilterteFragen, stats, alleStats: alleStatsProp, verfuegbareThemen, verfuegbareUnterthemen, aktiveFilter,
  suchtext, setSuchtext,
  filterFachbereich, setFilterFachbereich,
  filterTyp, setFilterTyp,
  filterBloom, setFilterBloom,
  filterThema, setFilterThema,
  filterUnterthema, setFilterUnterthema,
  filterPoolStatus, setFilterPoolStatus,
  filterMitAnhang, setFilterMitAnhang,
  filterKontext, setFilterKontext,
  filterZuruecksetzen,
  sortierung, setSortierung,
  gruppierung, setGruppierung,
  setAufgeklappteGruppen,
  kompaktModus, setKompaktModus,
  onNeueFrageErstellen, onBatchExport, onImport, onExcelImport, onSchliessen,
  zielPruefungTitel, zielAbschnittTitel,
  listeRef,
  inline,
}: Props) {
  // Ungefilterte Stats für Dropdown-Optionen (Fallback auf gefilterte Stats)
  const dropdownStats = alleStatsProp ?? stats

  const [exportOffen, setExportOffen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOffen(false)
      }
    }
    if (exportOffen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [exportOffen])

  return (
    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700" onWheel={(e) => { listeRef.current?.scrollBy(0, e.deltaY) }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Fragensammlung
          </h2>
          {ladeStatus === 'fertig' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.gesamt} Frage{stats.gesamt !== 1 ? 'n' : ''}
              {aktiveFilter > 0 && ` (${aktiveFilter} Filter aktiv)`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={onNeueFrageErstellen}>
            + Neue Frage
          </Button>
          <button
            onClick={onImport}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            Import via KI
          </button>
          {onExcelImport && (
            <button
              onClick={onExcelImport}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              Excel-Import
            </button>
          )}
          {/* Export-Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOffen(!exportOffen)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              Export
              <span className="text-xs">{exportOffen ? '▲' : '▼'}</span>
            </button>
            {exportOffen && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                <button
                  onClick={() => {
                    onBatchExport()
                    setExportOffen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg transition-colors cursor-pointer"
                >
                  ↑ In Pools exportieren
                </button>
                <button
                  onClick={() => {
                    const json = JSON.stringify(gefilterteFragen, null, 2)
                    const blob = new Blob([json], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const datum = new Date().toISOString().slice(0, 10)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `fragenbank_export_${datum}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                    setExportOffen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg transition-colors cursor-pointer"
                >
                  ↓ Als JSON-Datei
                </button>
              </div>
            )}
          </div>
          {!inline && (
            <button
              onClick={onSchliessen}
              className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Ziel-Leiste */}
      {zielPruefungTitel && (
        <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-3 text-sm text-green-700 dark:text-green-300">
          Ziel: <strong>{zielPruefungTitel}</strong>
          {zielAbschnittTitel && <> → {zielAbschnittTitel}</>}
        </div>
      )}

      {/* Suche */}
      <input
        type="text"
        value={suchtext}
        onChange={(e) => { setSuchtext(e.target.value) }}
        placeholder="Suche nach ID, Thema, Fragetext, Tags..."
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* Filter-Zeile 1: Alle Filter */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wide font-medium">Filter:</span>

        {/* Fach — immer sichtbar */}
        <select
            value={filterFachbereich}
            onChange={(e) => { setFilterFachbereich(e.target.value as Fachbereich | '') }}
            className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="">Fach</option>
            {Array.from(dropdownStats.fachbereiche.entries())
              .map(([fb, count]) => (
                <option key={fb} value={fb}>{fb} ({count})</option>
              ))}
          </select>

        {/* Thema — immer sichtbar */}
        <select
            value={filterThema}
            onChange={(e) => { setFilterThema(e.target.value); setFilterUnterthema('') }}
            className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer max-w-[180px]"
          >
            <option value="">Thema</option>
            {verfuegbareThemen.map(([thema, anzahl]) => (
              <option key={thema} value={thema}>{thema} ({anzahl})</option>
            ))}
          </select>

        {/* Unterthema (kaskadierend) — immer sichtbar */}
        <select
            value={filterUnterthema}
            onChange={(e) => { setFilterUnterthema(e.target.value) }}
            className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer max-w-[180px]"
          >
            <option value="">Unterthema</option>
            {verfuegbareUnterthemen.map(([ut, anzahl]) => (
              <option key={ut} value={ut}>{ut} ({anzahl})</option>
            ))}
          </select>

        {/* Typ */}
        <select
          value={filterTyp}
          onChange={(e) => { setFilterTyp(e.target.value) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">Typ</option>
          {Array.from(dropdownStats.typen.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([typ, anzahl]) => (
              <option key={typ} value={typ}>{typLabel(typ)} ({anzahl})</option>
            ))}
        </select>

        {/* Bloom */}
        <select
          value={filterBloom}
          onChange={(e) => { setFilterBloom(e.target.value as BloomStufe | '') }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">Bloom</option>
          {['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterPoolStatus}
          onChange={(e) => { setFilterPoolStatus(e.target.value as FilterPoolStatus) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="alle">Status</option>
          <option value="ungeprueft">Ungeprüft</option>
          <option value="pool_geprueft">Pool geprüft</option>
          <option value="pruefungstauglich">Prüfungstauglich</option>
          <option value="update">Update verfügbar</option>
        </select>

        {/* Anhang */}
        <button
          onClick={() => { setFilterMitAnhang(!filterMitAnhang) }}
          className={`filter-btn ${filterMitAnhang ? 'filter-btn-active' : ''}`}
        >
          Anhang
        </button>

        {/* Schule/Privat Toggle */}
        <div className="flex items-center gap-0.5 ml-2">
          {(['alle', 'schule', 'privat'] as const).map(k => (
            <button
              key={k}
              onClick={() => { setFilterKontext(k) }}
              className={`filter-btn ${
                k === 'alle' ? 'rounded-l-lg rounded-r-none' : k === 'privat' ? 'rounded-r-lg rounded-l-none' : 'rounded-none'
              } ${filterKontext === k ? 'filter-btn-active' : ''}`}
            >
              {k === 'alle' ? 'Alle' : k === 'schule' ? 'Schule' : 'Privat'}
            </button>
          ))}
        </div>

        {/* Filter zurücksetzen */}
        {aktiveFilter > 0 && (
          <button
            onClick={filterZuruecksetzen}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-auto"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Zeile 2: Sortieren + Ansicht */}
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wide font-medium">Gruppieren:</span>
        <select
          value={gruppierung}
          onChange={(e) => { setGruppierung(e.target.value as Gruppierung); setAufgeklappteGruppen(new Set()) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="keine">Keine</option>
          <option value="fachbereich">Fach</option>
          <option value="thema">Thema</option>
          <option value="typ">Typ</option>
          <option value="bloom">Bloom-Stufe</option>
        </select>

        <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wide font-medium ml-2">Sortieren:</span>
        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="thema">Thema</option>
          <option value="bloom">Bloom</option>
          <option value="punkte">Punkte</option>
          <option value="typ">Typ</option>
          <option value="id">ID</option>
        </select>

        {/* Kompakt-Toggle */}
        <button
          onClick={() => setKompaktModus(!kompaktModus)}
          className={`filter-btn ml-auto ${kompaktModus ? 'filter-btn-active' : ''}`}
        >
          {kompaktModus ? 'Kompakt' : 'Detail'}
        </button>
      </div>
    </div>
  )
}
