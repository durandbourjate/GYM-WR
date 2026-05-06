/**
 * Musterlösung-Abschnitt: Textarea + FormattierungsToolbar + KI-Buttons.
 * Nicht für FiBu-Typen (diese haben strukturierte Musterlösungen).
 *
 * C9 Phase 3 Task 24: Wenn `teilerklaerungsKontext` gesetzt ist, wird das Sub-Array
 * im `generiereMusterloesung`-Request mitgeschickt (damit das Backend Teilerklärungen
 * pro Sub-Element generieren kann). Das Ergebnis wird in `KIMusterloesungPreview`
 * angezeigt — die LP entscheidet pro Zeile ob eine Teilerklärung übernommen wird.
 */
import type { Fachbereich, BloomStufe } from '../../types/fragen-core'
import type { FrageTyp } from '../editorUtils'
import type { useKIAssistent } from '../useKIAssistent'
import type { TeilerklaerungsKontext } from '../musterloesungKontext'
import { Abschnitt } from '../components/EditorBausteine'
import { InlineAktionButton, ErgebnisAnzeige } from '../ki/KIBausteine'
import { KIMusterloesungPreview } from '../ki/KIMusterloesungPreview'
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
  /** Optional: Sub-Element-Kontext für Teilerklärungen (nur für Fragetypen mit Sub-Struktur). */
  teilerklaerungsKontext?: TeilerklaerungsKontext
}

export default function MusterloesungSection({
  typ, fragetext, fachbereich, bloom,
  musterlosung, setMusterlosung, musterloeRef, ki,
  teilerklaerungsKontext,
}: MusterloesungSectionProps) {
  // Nicht für FiBu-Typen
  if (['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur'].includes(typ)) {
    return null
  }

  function generiereMusterloesung() {
    const request: Record<string, unknown> = { fragetext, typ, fachbereich, bloom }
    if (teilerklaerungsKontext) {
      request[teilerklaerungsKontext.feld] = teilerklaerungsKontext.subArrayFuerRequest
    }
    ki.ausfuehren('generiereMusterloesung', request)
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
            disabled={!fragetext.trim() || ki.ladeKiAktion !== null}
            ladend={ki.ladeKiAktion === 'generiereMusterloesung'}
            onClick={generiereMusterloesung}
          />
          <InlineAktionButton
            label="Prüfen & Verbessern"
            tooltip="KI prüft die Musterlösung auf Korrektheit und Vollständigkeit"
            hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterlösung nötig' : undefined}
            disabled={!fragetext.trim() || !musterlosung.trim() || ki.ladeKiAktion !== null}
            ladend={ki.ladeKiAktion === 'pruefeMusterloesung'}
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
      {ki.ergebnisse.generiereMusterloesung && !ki.ergebnisse.generiereMusterloesung.fehler && ki.ergebnisse.generiereMusterloesung.daten && (
        <div className="mt-2">
          <KIMusterloesungPreview
            rawDaten={ki.ergebnisse.generiereMusterloesung.daten}
            elementeInfo={teilerklaerungsKontext?.elementeInfo}
            onUebernehmen={(payload) => {
              setMusterlosung(payload.musterloesung)
              if (teilerklaerungsKontext && payload.teilerklaerungen.length > 0) {
                teilerklaerungsKontext.uebernimmErklaerungen(payload.teilerklaerungen)
              }
              ki.verwerfen('generiereMusterloesung')
            }}
            onVerwerfen={() => ki.verwerfen('generiereMusterloesung')}
            wichtig={ki.offeneKIFeedbacks.find(f => f.kiAktion === 'generiereMusterloesung')?.wichtig ?? false}
            onWichtigToggle={() => {
              const cur = ki.offeneKIFeedbacks.find(f => f.kiAktion === 'generiereMusterloesung')
              ki.markiereWichtig('generiereMusterloesung', !(cur?.wichtig ?? false))
            }}
          />
        </div>
      )}
      {ki.ergebnisse.generiereMusterloesung?.fehler && (
        <div className="mt-2">
          <ErgebnisAnzeige
            ergebnis={ki.ergebnisse.generiereMusterloesung}
            vorschauKey="musterloesung"
            onUebernehmen={() => ki.verwerfen('generiereMusterloesung')}
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
