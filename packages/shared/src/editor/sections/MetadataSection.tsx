/**
 * Metadaten-Abschnitt: Fachbereich, Bloom, Thema, Unterthema, Lernziele, Tags, Zeitbedarf, Punkte, Semester, Gefässe, Sharing, KI-Klassifizierung.
 * Shared Version — Host-Apps übergeben pruefungsspezifische Komponenten als Props.
 */
import { useState } from 'react'
import type { Fachbereich, BloomStufe, FragenPerformance, Lernziel } from '../../types/fragen'
import type { Berechtigung } from '../../types/auth'
import type { useKIAssistent } from '../useKIAssistent'
import { useEditorConfig } from '../EditorContext'
import { bloomLabel, istWRFachschaft } from '../fachUtils'
import { loesungsquoteFarbe } from '../utils/performanceUtils'
import { Abschnitt, Feld } from '../components/EditorBausteine'
import { ErgebnisAnzeige } from '../ki/KIBausteine'
import LernzielWaehler from '../components/LernzielWaehler'

interface MetadataSectionProps {
  istNeu: boolean
  fragetext: string
  fachbereich: Fachbereich
  setFachbereich: (v: Fachbereich) => void
  bloom: BloomStufe
  setBloom: (v: BloomStufe) => void
  thema: string
  setThema: (v: string) => void
  unterthema: string
  setUnterthema: (v: string) => void
  tags: string
  setTags: (v: string) => void
  zeitbedarf: number
  setZeitbedarf: (v: number) => void
  zeitbedarfManuell: boolean
  setZeitbedarfManuell: (v: boolean) => void
  punkte: number
  setPunkte: (v: number) => void
  /** Wenn true: Punkte werden automatisch aus dem Bewertungsraster berechnet */
  bewertungsrasterAktiv?: boolean
  semester: string[]
  setSemester: React.Dispatch<React.SetStateAction<string[]>>
  gefaesse: string[]
  setGefaesse: React.Dispatch<React.SetStateAction<string[]>>
  geteilt: 'privat' | 'fachschaft' | 'schule'
  setGeteilt: (v: 'privat' | 'fachschaft' | 'schule') => void
  berechtigungen: Berechtigung[]
  setBerechtigungen: (b: Berechtigung[]) => void
  ki: ReturnType<typeof useKIAssistent>
  performance?: FragenPerformance
  /** Optionale Berechtigungen-Editor-Komponente (vom Host bereitgestellt) */
  berechtigungenEditor?: React.ReactNode
  /** Lernziel-Zuordnung (optional — nur wenn Editor Lernziele unterstützt) */
  lernziele?: Lernziel[]
  setLernziele?: (v: Lernziel[]) => void
  zeigLernzielDialog?: boolean
  setZeigLernzielDialog?: (v: boolean) => void
  gewaehlterLernzielId?: string
  setGewaehlterLernzielId?: (v: string) => void
  /** Zugeordnete Lernziel-IDs (Persistierung) */
  lernzielIds?: string[]
  setLernzielIds?: (v: string[]) => void
  /** Neues Lernziel erstellen (optional) */
  onNeuLernzielErstellen?: (lernziel: Omit<Lernziel, 'id'>) => Promise<string | null>
  /** Lernziele werden gerade geladen */
  lernzieleLadend?: boolean
}

export default function MetadataSection({
  istNeu, fragetext,
  fachbereich, setFachbereich,
  bloom, setBloom,
  thema, setThema,
  unterthema, setUnterthema,
  tags, setTags,
  zeitbedarf, setZeitbedarf,
  zeitbedarfManuell, setZeitbedarfManuell,
  punkte, setPunkte,
  bewertungsrasterAktiv = false,
  semester, setSemester,
  gefaesse, setGefaesse,
  geteilt: _geteilt, setGeteilt: _setGeteilt,
  berechtigungen: _berechtigungen, setBerechtigungen: _setBerechtigungen,
  ki,
  performance,
  berechtigungenEditor,
  lernziele, setLernziele: _setLernziele,
  zeigLernzielDialog: _zeigLernzielDialog, setZeigLernzielDialog: _setZeigLernzielDialog,
  gewaehlterLernzielId: _gewaehlterLernzielId, setGewaehlterLernzielId: _setGewaehlterLernzielId,
  lernzielIds = [], setLernzielIds,
  onNeuLernzielErstellen, lernzieleLadend,
}: MetadataSectionProps) {
  const [statsOffen, setStatsOffen] = useState(false)
  const config = useEditorConfig()

  return (
    <Abschnitt
      titel="Metadaten"
      einklappbar
      standardOffen={istNeu}
      titelRechts={ki.verfuegbar ? (
        <button
          onClick={() => ki.ausfuehren('klassifiziereFrage', { fragetext })}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          title="KI klassifiziert die Frage und schlägt Fach, Thema, Bloom-Stufe und Tags vor"
          className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer inline-flex items-center gap-1
            ${!fragetext.trim() || ki.ladeAktion !== null
              ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
            }`}
        >
          {ki.ladeAktion === 'klassifiziereFrage' ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Klassifiziere...
            </>
          ) : (
            'KI klassifizieren'
          )}
        </button>
      ) : undefined}
    >
      {/* KI-Klassifizierungs-Ergebnis */}
      {ki.ergebnisse.klassifiziereFrage && (
        <div className="mb-3">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.klassifiziereFrage}
            vorschauKey="zusammenfassung"
            renderVorschau={(daten) => {
              const fb = daten.fachbereich as string | undefined
              const th = daten.thema as string | undefined
              const uth = daten.unterthema as string | undefined
              const bl = daten.bloom as string | undefined
              const tg = daten.tags as string[] | undefined
              return (
                <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                  {fb && <p><span className="text-xs text-slate-500 dark:text-slate-400">Fach:</span> {fb}</p>}
                  {th && <p><span className="text-xs text-slate-500 dark:text-slate-400">Thema:</span> {th}</p>}
                  {uth && <p><span className="text-xs text-slate-500 dark:text-slate-400">Unterthema:</span> {uth}</p>}
                  {bl && <p><span className="text-xs text-slate-500 dark:text-slate-400">Bloom:</span> {bl}</p>}
                  {Array.isArray(tg) && tg.length > 0 && (
                    <p><span className="text-xs text-slate-500 dark:text-slate-400">Tags:</span> {tg.join(', ')}</p>
                  )}
                </div>
              )
            }}
            onUebernehmen={() => {
              const d = ki.ergebnisse.klassifiziereFrage?.daten
              if (d) {
                if (typeof d.fachbereich === 'string' && ['VWL', 'BWL', 'Recht', 'Informatik', 'Allgemein'].includes(d.fachbereich)) {
                  setFachbereich(d.fachbereich as Fachbereich)
                }
                if (typeof d.thema === 'string' && d.thema.trim()) setThema(d.thema.trim())
                if (typeof d.unterthema === 'string' && d.unterthema.trim()) setUnterthema(d.unterthema.trim())
                if (typeof d.bloom === 'string' && /^K[1-6]$/.test(d.bloom)) setBloom(d.bloom as BloomStufe)
                if (Array.isArray(d.tags) && d.tags.length > 0) setTags(d.tags.join(', '))
              }
              ki.verwerfen('klassifiziereFrage')
            }}
            onVerwerfen={() => ki.verwerfen('klassifiziereFrage')}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {istWRFachschaft(config.benutzer.fachschaft) ? (
          <Feld label="Fach *">
            <select value={fachbereich} onChange={(e) => setFachbereich(e.target.value as Fachbereich)} className="input-field input-pflicht">
              <option value="VWL">VWL</option>
              <option value="BWL">BWL</option>
              <option value="Recht">Recht</option>
            </select>
          </Feld>
        ) : (
          <Feld label="Fach *">
            <input type="text" value={fachbereich} readOnly className="input-field input-pflicht text-slate-500 cursor-not-allowed" />
          </Feld>
        )}
        <Feld label="Bloom-Stufe">
          <select value={bloom} onChange={(e) => setBloom(e.target.value as BloomStufe)} className="input-field">
            {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomStufe[]).map((k) => (
              <option key={k} value={k}>{k} — {bloomLabel(k)}</option>
            ))}
          </select>
        </Feld>
        <Feld label="Thema *">
          <input type="text" value={thema} onChange={(e) => setThema(e.target.value)}
            placeholder="z.B. Marktgleichgewicht" className="input-field input-pflicht" />
        </Feld>
        <Feld label="Zeitbedarf (Min.)">
          <input
            type="number"
            value={zeitbedarf}
            onChange={(e) => { setZeitbedarf(parseFloat(e.target.value) || 0); setZeitbedarfManuell(true) }}
            min={0.5}
            max={60}
            step={0.5}
            className="input-field"
            title="Geschätzter Zeitbedarf in Minuten"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {zeitbedarfManuell ? 'Manuell gesetzt' : 'Geschätzt (Typ + Taxonomie)'}
          </p>
        </Feld>
        <Feld label="Unterthema">
          <input type="text" value={unterthema} onChange={(e) => setUnterthema(e.target.value)}
            placeholder="z.B. Angebot & Nachfrage" className="input-field" />
        </Feld>
        <Feld label={bewertungsrasterAktiv ? 'Punkte (aus Bewertungsraster)' : 'Punkte *'}>
          <input type="number" value={punkte} onChange={(e) => setPunkte(parseInt(e.target.value) || 0)}
            min={1} max={20} className="input-field input-pflicht"
            disabled={bewertungsrasterAktiv}
            title={bewertungsrasterAktiv ? 'Punkte werden automatisch aus dem Bewertungsraster berechnet' : undefined} />
        </Feld>
        <Feld label="Tags (Komma-getrennt)">
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="z.B. Angebot, Nachfrage, BIP" className="input-field" />
        </Feld>
      </div>

      {/* Zeitpunkt + Gefässe */}
      <div className="flex gap-6 mt-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Zeitpunkt</label>
          <div className="flex gap-1 flex-wrap">
            {config.verfuegbareSemester.map((s) => (
              <button
                key={s}
                onClick={() => setSemester((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer
                  ${semester.includes(s)
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Gefäss</label>
          <div className="flex gap-1">
            {config.verfuegbareGefaesse.map((g) => (
              <button
                key={g}
                onClick={() => setGefaesse((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])}
                className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer
                  ${gefaesse.includes(g)
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                    : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                  }`}
              >{g}</button>
            ))}
          </div>
        </div>

        {/* Berechtigungen-Editor (vom Host bereitgestellt) */}
        {berechtigungenEditor}
      </div>

      {/* Lernziele zuordnen */}
      {(lernzieleLadend || (lernziele && lernziele.length > 0) || onNeuLernzielErstellen) && (
        <LernzielWaehler
          lernziele={lernziele || []}
          gewaehlteIds={lernzielIds}
          onToggle={(id) => {
            if (!setLernzielIds) return
            setLernzielIds(
              lernzielIds.includes(id)
                ? lernzielIds.filter(x => x !== id)
                : [...lernzielIds, id]
            )
          }}
          onNeuErstellen={onNeuLernzielErstellen}
          aktuellerFachbereich={fachbereich}
          ladend={lernzieleLadend}
        />
      )}

      {/* Fragen-Statistiken (nur wenn Performance-Daten vorhanden) */}
      {performance && (
        <div className="mt-3 border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setStatsOffen(!statsOffen)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="text-slate-500 dark:text-slate-400 w-3">
              {statsOffen ? '\u25BC' : '\u25B6'}
            </span>
            <span className={loesungsquoteFarbe(performance.durchschnittLoesungsquote)}>
              {'\u{1F4CA}'} Statistiken: \u00D8 {performance.durchschnittLoesungsquote}% L\u00F6sungsquote
              {performance.durchschnittTrennschaerfe != null && ` · TS ${performance.durchschnittTrennschaerfe.toFixed(2)}`}
              {' '}({performance.anzahlVerwendungen} Pr\u00FCfungen, {performance.gesamtN} SuS)
            </span>
          </button>
          {statsOffen && (
            <div className="px-3 py-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left py-1 font-medium">Pr\u00FCfung</th>
                    <th className="text-left py-1 font-medium">Datum</th>
                    <th className="text-right py-1 font-medium">L\u00F6sungsquote</th>
                    <th className="text-right py-1 font-medium">TS</th>
                    <th className="text-right py-1 font-medium">SuS</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.verwendungen.map((v) => (
                    <tr key={v.pruefungId} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <td className="py-1 text-slate-700 dark:text-slate-200">{v.pruefungTitel}</td>
                      <td className="py-1 text-slate-500 dark:text-slate-400">{v.datum}</td>
                      <td className={`py-1 text-right font-medium ${loesungsquoteFarbe(v.loesungsquote)}`}>{v.loesungsquote}%</td>
                      <td className="py-1 text-right text-slate-500 dark:text-slate-400">{v.trennschaerfe != null ? v.trennschaerfe.toFixed(2) : '—'}</td>
                      <td className="py-1 text-right text-slate-500 dark:text-slate-400">{v.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Abschnitt>
  )
}
