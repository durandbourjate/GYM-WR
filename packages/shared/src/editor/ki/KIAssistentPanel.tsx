/**
 * KI-Assistent Button-Komponenten fuer Fragetext, Musterloesung, MC-Optionen.
 * Hook und UI-Bausteine sind in useKIAssistent.ts / KIBausteine.tsx extrahiert.
 */
export { useKIAssistent } from '../useKIAssistent'
export type { AktionKey, AktionErgebnis } from '../useKIAssistent'

import type { useKIAssistent } from '../useKIAssistent'
import type { MCOption } from '../../types/fragen'
import type { FrageTyp } from '../editorUtils'
import type { Fachbereich, BloomStufe } from '../../types/fragen'
import { InlineAktionButton, ErgebnisAnzeige } from './KIBausteine'

// === Fragetext-Buttons ===

interface KIFragetextButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  typ: FrageTyp
  fachbereich: Fachbereich
  thema: string
  unterthema: string
  bloom: BloomStufe
  fragetext: string
  onSetFragetext: (text: string) => void
  onSetMusterlosung: (text: string) => void
}

/** Inline-Buttons "Generieren" und "Pruefen & Verbessern" neben dem Fragetext */
export function KIFragetextButtons({
  ki, typ, fachbereich, thema, unterthema, bloom, fragetext,
  onSetFragetext, onSetMusterlosung,
}: KIFragetextButtonsProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
        <InlineAktionButton
          label="Generieren"
          tooltip="KI erstellt einen neuen Fragetext basierend auf Thema, Fachbereich und Taxonomiestufe"
          hinweis={!thema.trim() ? 'Thema noetig' : undefined}
          disabled={!thema.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereFragetext'}
          onClick={() => ki.ausfuehren('generiereFragetext', { fachbereich, thema, unterthema, typ, bloom })}
        />
        <InlineAktionButton
          label="Pruefen & Verbessern"
          tooltip="KI prueft den Fragetext auf Klarheit, Eindeutigkeit und Taxonomie-Passung und schlaegt Verbesserungen vor"
          hinweis={!fragetext.trim() ? 'Fragetext noetig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'verbessereFragetext'}
          onClick={() => ki.ausfuehren('verbessereFragetext', { fragetext })}
        />
      </div>

      {ki.ergebnisse.generiereFragetext && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.generiereFragetext}
          vorschauKey="fragetext"
          zusatzKey="musterlosung"
          onUebernehmen={() => {
            const d = ki.ergebnisse.generiereFragetext?.daten
            if (d) {
              if (typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
              if (typeof d.musterlosung === 'string') onSetMusterlosung(d.musterlosung)
            }
            ki.verwerfen('generiereFragetext')
          }}
          onVerwerfen={() => ki.verwerfen('generiereFragetext')}
        />
      )}

      {ki.ergebnisse.verbessereFragetext && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.verbessereFragetext}
          vorschauKey="fragetext"
          zusatzKey="aenderungen"
          onUebernehmen={() => {
            const d = ki.ergebnisse.verbessereFragetext?.daten
            if (d && typeof d.fragetext === 'string') onSetFragetext(d.fragetext)
            ki.verwerfen('verbessereFragetext')
          }}
          onVerwerfen={() => ki.verwerfen('verbessereFragetext')}
        />
      )}
    </div>
  )
}

// === Musterloesung-Buttons ===

interface KIMusterlosungButtonsProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  musterlosung: string
  typ: FrageTyp
  fachbereich: Fachbereich
  bloom: BloomStufe
  onSetMusterlosung: (text: string) => void
}

/** Inline-Buttons "Generieren" und "Pruefen & Verbessern" neben der Musterloesung */
export function KIMusterlosungButtons({ ki, fragetext, musterlosung, typ, fachbereich, bloom, onSetMusterlosung }: KIMusterlosungButtonsProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mt-2">
        <InlineAktionButton
          label="Generieren"
          tooltip="KI erstellt eine Musterloesung basierend auf dem Fragetext"
          hinweis={!fragetext.trim() ? 'Fragetext noetig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereMusterloesung'}
          onClick={() => ki.ausfuehren('generiereMusterloesung', { fragetext, typ, fachbereich, bloom })}
        />
        <InlineAktionButton
          label="Pruefen & Verbessern"
          tooltip="KI prueft die Musterloesung auf Korrektheit und Vollstaendigkeit und schlaegt Verbesserungen vor"
          hinweis={!fragetext.trim() || !musterlosung.trim() ? 'Fragetext + Musterloesung noetig' : undefined}
          disabled={!fragetext.trim() || !musterlosung.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'pruefeMusterloesung'}
          onClick={() => ki.ausfuehren('pruefeMusterloesung', { fragetext, musterlosung })}
        />
      </div>

      {ki.ergebnisse.generiereMusterloesung && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.generiereMusterloesung}
          vorschauKey="musterlosung"
          onUebernehmen={() => {
            const d = ki.ergebnisse.generiereMusterloesung?.daten
            if (d && typeof d.musterlosung === 'string') onSetMusterlosung(d.musterlosung)
            ki.verwerfen('generiereMusterloesung')
          }}
          onVerwerfen={() => ki.verwerfen('generiereMusterloesung')}
        />
      )}

      {ki.ergebnisse.pruefeMusterloesung && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.pruefeMusterloesung}
          vorschauKey="bewertung"
          zusatzKey="verbesserteLosung"
          onUebernehmen={() => {
            const d = ki.ergebnisse.pruefeMusterloesung?.daten
            if (d && typeof d.verbesserteLosung === 'string') onSetMusterlosung(d.verbesserteLosung)
            ki.verwerfen('pruefeMusterloesung')
          }}
          onVerwerfen={() => ki.verwerfen('pruefeMusterloesung')}
        />
      )}
    </div>
  )
}

// Rueckwaertskompatibilitaet
/** @deprecated Nutze KIMusterlosungButtons stattdessen */
export const KIMusterlosungButton = KIMusterlosungButtons

// === MC-Optionen-Button ===

interface KIMCOptionenButtonProps {
  ki: ReturnType<typeof useKIAssistent>
  fragetext: string
  optionen: MCOption[]
  onSetOptionen: (optionen: MCOption[]) => void
}

/** Inline-Button "Generieren" neben den MC-Optionen */
export function KIMCOptionenButton({ ki, fragetext, optionen, onSetOptionen }: KIMCOptionenButtonProps) {
  if (!ki.verfuegbar) return null

  return (
    <div className="space-y-2">
      <div className="mt-2">
        <InlineAktionButton
          label="Optionen generieren"
          tooltip="KI erstellt Antwortoptionen (korrekte und falsche) passend zum Fragetext"
          hinweis={!fragetext.trim() ? 'Fragetext noetig' : undefined}
          disabled={!fragetext.trim() || ki.ladeAktion !== null}
          ladend={ki.ladeAktion === 'generiereOptionen'}
          onClick={() => ki.ausfuehren('generiereOptionen', { fragetext })}
        />
      </div>

      {ki.ergebnisse.generiereOptionen && (
        <ErgebnisAnzeige
          ergebnis={ki.ergebnisse.generiereOptionen}
          vorschauKey="optionen"
          renderVorschau={(daten) => {
            const opts = daten.optionen as Array<{ text: string; korrekt: boolean }> | undefined
            if (!Array.isArray(opts)) return null
            return (
              <ul className="space-y-1">
                {opts.map((o, i) => (
                  <li key={i} className={`text-sm px-2 py-1 rounded ${o.korrekt ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>
                    {o.korrekt ? '\u2713 ' : '\u2717 '}{o.text}
                  </li>
                ))}
              </ul>
            )
          }}
          onUebernehmen={() => {
            const d = ki.ergebnisse.generiereOptionen?.daten
            if (d && Array.isArray(d.optionen)) {
              const neueOptionen: MCOption[] = (d.optionen as Array<{ text: string; korrekt: boolean }>).map((o, i) => ({
                id: String.fromCharCode(97 + i),
                text: o.text,
                korrekt: o.korrekt,
              }))
              const merged = neueOptionen.length >= optionen.length
                ? neueOptionen
                : [...neueOptionen, ...optionen.slice(neueOptionen.length)]
              onSetOptionen(merged)
            }
            ki.verwerfen('generiereOptionen')
          }}
          onVerwerfen={() => ki.verwerfen('generiereOptionen')}
        />
      )}
    </div>
  )
}
