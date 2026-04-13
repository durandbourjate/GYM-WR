/**
 * Fragetext-Abschnitt: FormattierungsToolbar, Textarea, KI-Buttons (generieren, verbessern, Lernziel).
 * Extrahiert aus FragenEditor.tsx → shared.
 */
import type { Fachbereich, BloomStufe, Lernziel } from '../../types/fragen'
import type { FrageTyp } from '../editorUtils'
import type { useKIAssistent } from '../useKIAssistent'
import { useEditorServices, useEditorConfig } from '../EditorContext'
import { Abschnitt } from '../components/EditorBausteine'
import { InlineAktionButton, ErgebnisAnzeige } from '../ki/KIBausteine'
import FormattierungsToolbar from '../components/FormattierungsToolbar'

interface FragetextSectionProps {
  fragetext: string
  setFragetext: (v: string) => void
  musterlosung: string
  setMusterlosung: (v: string) => void
  fragetextRef: React.RefObject<HTMLTextAreaElement | null>
  fachbereich: Fachbereich
  thema: string
  unterthema: string
  typ: FrageTyp
  bloom: BloomStufe
  ki: ReturnType<typeof useKIAssistent>
  lernziele: Lernziel[]
  setLernziele: (v: Lernziel[]) => void
  zeigLernzielDialog: boolean
  setZeigLernzielDialog: (v: boolean) => void
  gewaehlterLernzielId: string
  setGewaehlterLernzielId: (v: string) => void
}

export default function FragetextSection({
  fragetext, setFragetext,
  musterlosung: _musterlosung, setMusterlosung,
  fragetextRef,
  fachbereich, thema, unterthema, typ, bloom,
  ki,
  lernziele, setLernziele,
  zeigLernzielDialog, setZeigLernzielDialog,
  gewaehlterLernzielId, setGewaehlterLernzielId,
}: FragetextSectionProps) {
  const services = useEditorServices()
  const config = useEditorConfig()
  return (
    <Abschnitt
      titel="Fragetext *"
      titelRechts={ki.verfuegbar ? (
        <div className="flex gap-1.5">
          <InlineAktionButton
            label="Generieren"
            tooltip="KI erstellt einen neuen Fragetext basierend auf Thema, Fachbereich und Taxonomiestufe"
            hinweis={!thema.trim() ? 'Thema nötig' : undefined}
            disabled={!thema.trim() || ki.ladeAktion !== null}
            ladend={ki.ladeAktion === 'generiereFragetext'}
            onClick={() => ki.ausfuehren('generiereFragetext', { fachbereich, thema, unterthema, typ, bloom })}
          />
          <InlineAktionButton
            label="Prüfen & Verbessern"
            tooltip="KI prüft den Fragetext auf Klarheit, Eindeutigkeit und Taxonomie-Passung"
            hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
            disabled={!fragetext.trim() || ki.ladeAktion !== null}
            ladend={ki.ladeAktion === 'verbessereFragetext'}
            onClick={() => ki.ausfuehren('verbessereFragetext', { fragetext })}
          />
          <InlineAktionButton
            label="🤖 KI: Frage aus Lernziel"
            tooltip="KI generiert eine Frage basierend auf einem Lernziel"
            disabled={ki.ladeAktion !== null}
            ladend={ki.ladeAktion === 'generiereFrageZuLernziel'}
            onClick={async () => {
              if (!lernziele.length) {
                const lz = await services.ladeLernziele?.(config.benutzer?.email ?? '', fachbereich)
                if (lz) setLernziele(lz)
              }
              setZeigLernzielDialog(true)
            }}
          />
        </div>
      ) : undefined}
    >
      <FormattierungsToolbar textareaRef={fragetextRef} value={fragetext} onChange={setFragetext} />
      <textarea
        ref={fragetextRef}
        value={fragetext}
        onChange={(e) => setFragetext(e.target.value)}
        rows={4}
        placeholder="Formulieren Sie die Frage... (Markdown: **fett**, *kursiv*)"
        className="input-field input-pflicht resize-y"
      />
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Tipp: **fett** für Hervorhebungen, \n für Absätze, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">$x^2$</code> für LaTeX inline, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">$$\sum_&#123;i=1&#125;^n$$</code> für Block, <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">```python</code> für Code-Blöcke
      </p>
      {/* KI-Ergebnisse */}
      {ki.ergebnisse.generiereFragetext && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.generiereFragetext}
            vorschauKey="fragetext"
            zusatzKey="musterlosung"
            onUebernehmen={() => {
              const d = ki.ergebnisse.generiereFragetext?.daten
              if (d) {
                if (typeof d.fragetext === 'string') setFragetext(d.fragetext)
                if (typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
              }
              ki.verwerfen('generiereFragetext')
            }}
            onVerwerfen={() => ki.verwerfen('generiereFragetext')}
          />
        </div>
      )}
      {ki.ergebnisse.verbessereFragetext && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.verbessereFragetext}
            vorschauKey="fragetext"
            zusatzKey="aenderungen"
            onUebernehmen={() => {
              const d = ki.ergebnisse.verbessereFragetext?.daten
              if (d && typeof d.fragetext === 'string') setFragetext(d.fragetext)
              ki.verwerfen('verbessereFragetext')
            }}
            onVerwerfen={() => ki.verwerfen('verbessereFragetext')}
          />
        </div>
      )}
      {/* Lernziel-Dialog */}
      {zeigLernzielDialog && (
        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded border border-slate-200 dark:border-slate-600">
          <label className="block text-sm font-medium mb-1 dark:text-white">Lernziel auswählen:</label>
          <select
            value={gewaehlterLernzielId}
            onChange={e => setGewaehlterLernzielId(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-slate-300 rounded mb-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="">— Lernziel wählen —</option>
            {lernziele.map(lz => (
              <option key={lz.id} value={lz.id}>{lz.text} ({lz.bloom})</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              disabled={!gewaehlterLernzielId || ki.ladeAktion === 'generiereFrageZuLernziel'}
              onClick={() => {
                const lz = lernziele.find(l => l.id === gewaehlterLernzielId)
                if (lz) {
                  ki.ausfuehren('generiereFrageZuLernziel', {
                    lernziel: lz.text, bloom: lz.bloom || bloom,
                    thema: lz.thema, fragetyp: typ,
                  })
                  setZeigLernzielDialog(false)
                }
              }}
              className="px-3 py-1 text-sm bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-600"
            >
              {ki.ladeAktion === 'generiereFrageZuLernziel' ? 'Generiert...' : 'Generieren'}
            </button>
            <button onClick={() => setZeigLernzielDialog(false)}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {/* KI-Ergebnis: Lernziel-Generierung */}
      {ki.ergebnisse.generiereFrageZuLernziel && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.generiereFrageZuLernziel}
            vorschauKey="fragetext"
            zusatzKey="musterlosung"
            onUebernehmen={() => {
              const d = ki.ergebnisse.generiereFrageZuLernziel?.daten
              if (d) {
                if (typeof d.fragetext === 'string') setFragetext(d.fragetext)
                if (typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
              }
              ki.verwerfen('generiereFrageZuLernziel')
            }}
            onVerwerfen={() => ki.verwerfen('generiereFrageZuLernziel')}
          />
        </div>
      )}
    </Abschnitt>
  )
}
