import type { Frage, Fachbereich, BloomStufe } from '../../../types/fragen.ts'
import type { Sortierung, FilterQuelle, FilterPoolStatus } from '../../../hooks/useFragenFilter.ts'
import type { Gruppierung } from './gruppenHelfer.ts'

interface Props {
  // Daten
  ladeStatus: 'laden' | 'fertig'
  gefilterteFragen: Frage[]
  stats: { fachbereiche: Map<string, number>; typen: Map<string, number>; gesamt: number }
  verfuegbareThemen: [string, number][]
  aktiveFilter: number
  seitenGroesse: number

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
  filterQuelle: FilterQuelle
  setFilterQuelle: (v: FilterQuelle) => void
  filterPoolStatus: FilterPoolStatus
  setFilterPoolStatus: (v: FilterPoolStatus) => void
  filterZuruecksetzen: () => void

  // Ansicht-State
  sortierung: Sortierung
  setSortierung: (v: Sortierung) => void
  gruppierung: Gruppierung
  setGruppierung: (v: Gruppierung) => void
  setAufgeklappteGruppen: React.Dispatch<React.SetStateAction<Set<string>>>
  setAngezeigteMenge: React.Dispatch<React.SetStateAction<number>>
  kompaktModus: boolean
  setKompaktModus: (v: boolean) => void

  // Aktionen
  onNeueFrageErstellen: () => void
  onBatchExport: () => void
  onImport: () => void
  onSchliessen: () => void

  // Ziel-Info
  zielPruefungTitel?: string
  zielAbschnittTitel?: string

  // Scroll-Weiterleitung
  listeRef: React.RefObject<HTMLDivElement | null>
}

/** Header mit Suche, Filter, Sortierung und Aktions-Buttons */
export default function FragenBrowserHeader({
  ladeStatus, gefilterteFragen, stats, verfuegbareThemen, aktiveFilter, seitenGroesse,
  suchtext, setSuchtext,
  filterFachbereich, setFilterFachbereich,
  filterTyp, setFilterTyp,
  filterBloom, setFilterBloom,
  filterThema, setFilterThema,
  filterQuelle, setFilterQuelle,
  filterPoolStatus, setFilterPoolStatus,
  filterZuruecksetzen,
  sortierung, setSortierung,
  gruppierung, setGruppierung,
  setAufgeklappteGruppen, setAngezeigteMenge,
  kompaktModus, setKompaktModus,
  onNeueFrageErstellen, onBatchExport, onImport, onSchliessen,
  zielPruefungTitel, zielAbschnittTitel,
  listeRef,
}: Props) {
  return (
    <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700" onWheel={(e) => { listeRef.current?.scrollBy(0, e.deltaY) }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Fragenbank
          </h2>
          {ladeStatus === 'fertig' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {stats.gesamt} Frage{stats.gesamt !== 1 ? 'n' : ''}
              {aktiveFilter > 0 && ` (${aktiveFilter} Filter aktiv)`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNeueFrageErstellen}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Neue Frage erstellen"
          >
            + Neue Frage
          </button>
          <button
            onClick={onBatchExport}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Mehrere Fragen in Pools exportieren"
          >
            ↑ Pool-Export
          </button>
          <button
            onClick={onImport}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Fragen via KI aus Text importieren"
          >
            Import via KI
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
            }}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            title="Alle gefilterten Fragen als JSON exportieren"
          >
            Export
          </button>
          <button
            onClick={onSchliessen}
            className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            ×
          </button>
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
        onChange={(e) => { setSuchtext(e.target.value); setAngezeigteMenge(seitenGroesse) }}
        placeholder="Suche nach ID, Thema, Fragetext, Tags..."
        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      {/* Filter-Zeile */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <select
          value={filterFachbereich}
          onChange={(e) => { setFilterFachbereich(e.target.value as Fachbereich | ''); setAngezeigteMenge(seitenGroesse) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">Fachbereich</option>
          <option value="VWL">VWL ({stats.fachbereiche.get('VWL') ?? 0})</option>
          <option value="BWL">BWL ({stats.fachbereiche.get('BWL') ?? 0})</option>
          <option value="Recht">Recht ({stats.fachbereiche.get('Recht') ?? 0})</option>
        </select>
        <select
          value={filterTyp}
          onChange={(e) => { setFilterTyp(e.target.value); setAngezeigteMenge(seitenGroesse) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">Typ</option>
          <option value="mc">MC ({stats.typen.get('mc') ?? 0})</option>
          <option value="freitext">Freitext ({stats.typen.get('freitext') ?? 0})</option>
          <option value="lueckentext">Lückentext ({stats.typen.get('lueckentext') ?? 0})</option>
          <option value="zuordnung">Zuordnung ({stats.typen.get('zuordnung') ?? 0})</option>
          <option value="richtigfalsch">Richtig/Falsch ({stats.typen.get('richtigfalsch') ?? 0})</option>
          <option value="berechnung">Berechnung ({stats.typen.get('berechnung') ?? 0})</option>
          <option value="buchungssatz">Buchungssatz ({stats.typen.get('buchungssatz') ?? 0})</option>
          <option value="tkonto">T-Konto ({stats.typen.get('tkonto') ?? 0})</option>
          <option value="kontenbestimmung">Kontenbestimmung ({stats.typen.get('kontenbestimmung') ?? 0})</option>
          <option value="bilanzstruktur">Bilanz/ER ({stats.typen.get('bilanzstruktur') ?? 0})</option>
          <option value="aufgabengruppe">Aufgabengruppe ({stats.typen.get('aufgabengruppe') ?? 0})</option>
        </select>
        <select
          value={filterBloom}
          onChange={(e) => { setFilterBloom(e.target.value as BloomStufe | ''); setAngezeigteMenge(seitenGroesse) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">Bloom</option>
          {['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        {/* Quellen-Filter (Alle / Meine / Pool) */}
        <select
          value={filterQuelle}
          onChange={(e) => { setFilterQuelle(e.target.value as FilterQuelle); if (e.target.value === 'meine') setFilterPoolStatus('alle'); setAngezeigteMenge(seitenGroesse) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="alle">Alle Quellen</option>
          <option value="meine">Meine</option>
          <option value="pool">Pool</option>
        </select>

        {filterQuelle !== 'meine' && (
          <select
            value={filterPoolStatus}
            onChange={(e) => { setFilterPoolStatus(e.target.value as FilterPoolStatus); setAngezeigteMenge(seitenGroesse) }}
            className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="alle">Alle Status</option>
            <option value="ungeprueft">Ungeprüft</option>
            <option value="pool_geprueft">Pool ✓</option>
            <option value="pruefungstauglich">Prüfungstauglich</option>
            <option value="update">Update verfügbar</option>
          </select>
        )}

        {verfuegbareThemen.length > 1 && (
          <select
            value={filterThema}
            onChange={(e) => { setFilterThema(e.target.value); setAngezeigteMenge(seitenGroesse) }}
            className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer max-w-[180px]"
          >
            <option value="">Thema</option>
            {verfuegbareThemen.map(([thema, anzahl]) => (
              <option key={thema} value={thema}>{thema} ({anzahl})</option>
            ))}
          </select>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />

        {/* Gruppierung */}
        <select
          value={gruppierung}
          onChange={(e) => { setGruppierung(e.target.value as Gruppierung); setAufgeklappteGruppen(new Set()) }}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="keine">Keine Gruppierung</option>
          <option value="fachbereich">Nach Fachbereich</option>
          <option value="thema">Nach Thema</option>
          <option value="typ">Nach Typ</option>
          <option value="bloom">Nach Bloom-Stufe</option>
        </select>

        {/* Sortierung */}
        <select
          value={sortierung}
          onChange={(e) => setSortierung(e.target.value as Sortierung)}
          className="text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="thema">Sort: Thema</option>
          <option value="id">Sort: ID</option>
          <option value="bloom">Sort: Bloom</option>
          <option value="punkte">Sort: Punkte ↓</option>
          <option value="typ">Sort: Typ</option>
        </select>

        {/* Kompakt-Toggle */}
        <button
          onClick={() => setKompaktModus(!kompaktModus)}
          className={`text-xs px-2 py-1.5 rounded-lg border transition-colors cursor-pointer
            ${kompaktModus
              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          title={kompaktModus ? 'Detailansicht' : 'Kompaktansicht'}
        >
          {kompaktModus ? '\u2630' : '\u25A4'}
        </button>

        {/* Filter zurücksetzen */}
        {aktiveFilter > 0 && (
          <button
            onClick={filterZuruecksetzen}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-auto"
          >
            Filter ×
          </button>
        )}
      </div>
    </div>
  )
}
