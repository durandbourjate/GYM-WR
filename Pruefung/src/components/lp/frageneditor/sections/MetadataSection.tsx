/**
 * Zuordnungs-Abschnitt: Fachbereich, Bloom, Thema, Unterthema, Tags, Zeitbedarf, Punkte, Semester, Gefässe, Sharing, KI-Klassifizierung.
 * Extrahiert aus FragenEditor.tsx.
 */
import type { Fachbereich, BloomStufe, Gefaess } from '../../../../types/fragen.ts'
import type { useKIAssistent } from '../useKIAssistent.ts'
import { bloomLabel } from '../../../../utils/fachbereich.ts'
import { Abschnitt, Feld } from '../EditorBausteine.tsx'
import { ErgebnisAnzeige } from '../KIBausteine.tsx'

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
  semester: string[]
  setSemester: React.Dispatch<React.SetStateAction<string[]>>
  gefaesse: Gefaess[]
  setGefaesse: React.Dispatch<React.SetStateAction<Gefaess[]>>
  geteilt: 'privat' | 'schule'
  setGeteilt: (v: 'privat' | 'schule') => void
  ki: ReturnType<typeof useKIAssistent>
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
  semester, setSemester,
  gefaesse, setGefaesse,
  geteilt, setGeteilt,
  ki,
}: MetadataSectionProps) {
  return (
    <Abschnitt
      titel="Zuordnung"
      einklappbar
      standardOffen={istNeu}
      titelRechts={ki.verfuegbar ? (
        <button
          onClick={() => ki.ausfuehren('klassifiziereFrage', { fragetext })}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          title="KI klassifiziert die Frage und schlägt Fachbereich, Thema, Bloom-Stufe und Tags vor"
          className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors cursor-pointer inline-flex items-center gap-1
            ${!fragetext.trim() || ki.ladeAktion !== null
              ? 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                  {fb && <p><span className="text-xs text-slate-500 dark:text-slate-400">Fachbereich:</span> {fb}</p>}
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
                if (typeof d.fachbereich === 'string' && ['VWL', 'BWL', 'Recht'].includes(d.fachbereich)) {
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
        <Feld label="Fachbereich">
          <select value={fachbereich} onChange={(e) => setFachbereich(e.target.value as Fachbereich)} className="input-field">
            <option value="VWL">VWL</option>
            <option value="BWL">BWL</option>
            <option value="Recht">Recht</option>
          </select>
        </Feld>
        <Feld label="Bloom-Stufe">
          <select value={bloom} onChange={(e) => setBloom(e.target.value as BloomStufe)} className="input-field">
            {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomStufe[]).map((k) => (
              <option key={k} value={k}>{k} — {bloomLabel(k)}</option>
            ))}
          </select>
        </Feld>
        <Feld label="Thema *">
          <input type="text" value={thema} onChange={(e) => setThema(e.target.value)}
            placeholder="z.B. Marktgleichgewicht" className="input-field" />
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
        <Feld label="Punkte *">
          <input type="number" value={punkte} onChange={(e) => setPunkte(parseInt(e.target.value) || 0)}
            min={1} max={20} className="input-field" />
        </Feld>
        <Feld label="Tags (Komma-getrennt)">
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
            placeholder="z.B. Angebot, Nachfrage, BIP" className="input-field" />
        </Feld>
      </div>

      {/* Semester + Gefässe */}
      <div className="flex gap-6 mt-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semester</label>
          <div className="flex gap-1 flex-wrap">
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
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
            {(['SF', 'EF', 'EWR', 'GF'] as Gefaess[]).map((g) => (
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

        {/* Sharing / Teilen */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Sichtbarkeit</label>
          <div className="flex w-48 rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setGeteilt('privat')}
              className={`flex-1 px-3 py-1 text-xs transition-colors cursor-pointer ${
                geteilt === 'privat'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Privat
            </button>
            <button
              onClick={() => setGeteilt('schule')}
              className={`flex-1 px-3 py-1 text-xs transition-colors cursor-pointer border-l border-slate-300 dark:border-slate-600 ${
                geteilt === 'schule'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Schule
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            {geteilt === 'schule' ? 'Sichtbar für alle @gymhofwil.ch Lehrpersonen' : 'Nur für Sie sichtbar'}
          </p>
        </div>
      </div>
    </Abschnitt>
  )
}
