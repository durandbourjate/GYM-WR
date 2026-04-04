/**
 * Musterlösung-Abschnitt: Textarea + FormattierungsToolbar + KI-Buttons.
 * Nicht für FiBu-Typen (diese haben strukturierte Musterlösungen).
 */
import type { Fachbereich, BloomStufe } from '../../types/fragen'
import type { FrageTyp } from '../editorUtils'
import type { useKIAssistent } from '../useKIAssistent'
import { Abschnitt } from '../components/EditorBausteine'
import { InlineAktionButton, ErgebnisAnzeige } from '../ki/KIBausteine'
import FormattierungsToolbar from '../components/FormattierungsToolbar'

interface MusterloesungSectionProps {
  typ: FrageTyp
  fragetext: string
  fachbereich: Fachbereich
  bloom: BloomStufe
  musterlosung: string
  setMusterlosung: (v: string) => void
  musterloeRef: React.RefObject<HTMLTextAreaElement | null>
  ki: ReturnType<typeof useKIAssistent>
}

export default function MusterloesungSection({
  typ, fragetext, fachbereich, bloom,
  musterlosung, setMusterlosung, musterloeRef, ki,
}: MusterloesungSectionProps) {
  // Nicht für FiBu-Typen
  if (['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'].includes(typ)) {
    return null
  }

  return (
    <Abschnitt
      titel="Musterlösung"
      titelRechts={ki.verfuegbar ? (
        <div className="flex gap-1.5">
          <InlineAktionButton
            label="Generieren"
            tooltip="KI erstellt eine Musterlösung basierend auf dem Fragetext"
            hinweis={!fragetext.trim() ? 'Fragetext nötig' : undefined}
            disabled={!fragetext.trim() || ki.ladeAktion !== null}
            ladend={ki.ladeAktion === 'generiereMusterloesung'}
            onClick={() => ki.ausfuehren('generiereMusterloesung', { fragetext, typ, fachbereich, bloom })}
          />
          <InlineAktionButton
            label="Prüfen & Verbessern"
            tooltip="KI prüft die Musterlösung auf Korrektheit und Vollständigkeit"
            hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterlösung nötig' : undefined}
            disabled={!fragetext.trim() || !musterlosung.trim() || ki.ladeAktion !== null}
            ladend={ki.ladeAktion === 'pruefeMusterloesung'}
            onClick={() => ki.ausfuehren('pruefeMusterloesung', { fragetext, musterlosung })}
          />
        </div>
      ) : undefined}
    >
      <FormattierungsToolbar textareaRef={musterloeRef} value={musterlosung} onChange={setMusterlosung} />
      <textarea
        ref={musterloeRef}
        value={musterlosung}
        onChange={(e) => setMusterlosung(e.target.value)}
        rows={3}
        placeholder="Erwartete korrekte Antwort..."
        className="input-field resize-y"
      />
      {ki.ergebnisse.generiereMusterloesung && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.generiereMusterloesung}
            vorschauKey="musterlosung"
            onUebernehmen={() => {
              const d = ki.ergebnisse.generiereMusterloesung?.daten
              if (d && typeof d.musterlosung === 'string') setMusterlosung(d.musterlosung)
              ki.verwerfen('generiereMusterloesung')
            }}
            onVerwerfen={() => ki.verwerfen('generiereMusterloesung')}
          />
        </div>
      )}
      {ki.ergebnisse.pruefeMusterloesung && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.pruefeMusterloesung}
            vorschauKey="bewertung"
            zusatzKey="verbesserteLosung"
            onUebernehmen={() => {
              const d = ki.ergebnisse.pruefeMusterloesung?.daten
              if (d && typeof d.verbesserteLosung === 'string') setMusterlosung(d.verbesserteLosung)
              ki.verwerfen('pruefeMusterloesung')
            }}
            onVerwerfen={() => ki.verwerfen('pruefeMusterloesung')}
          />
        </div>
      )}
    </Abschnitt>
  )
}
