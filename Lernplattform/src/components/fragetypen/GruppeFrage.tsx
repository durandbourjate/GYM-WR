import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { AufgabengruppeFrage, InlineTeilaufgabe } from '../../types/fragen'
import type { AntwortTyp } from '../../types/antworten'
import { FRAGETYP_KOMPONENTEN } from './index'
import FeedbackBox from './FeedbackBox'

export default function GruppeFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'aufgabengruppe') return null
  const agFrage = frage as AufgabengruppeFrage

  const teilaufgaben = agFrage.teilaufgaben || []
  const [teilAntworten, setTeilAntworten] = useState<Record<string, AntwortTyp>>({})

  const handleTeilAntwort = (taId: string, antwort: AntwortTyp) => {
    const neu = { ...teilAntworten, [taId]: antwort }
    setTeilAntworten(neu)
    // Gesamtantwort senden wenn alle Teile beantwortet
    if (Object.keys(neu).length === teilaufgaben.length) {
      onAntwort({ typ: 'gruppe', teilAntworten: neu })
    }
  }

  return (
    <div className="space-y-4">
      {/* Kontext-Block */}
      {agFrage.kontext && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 italic">
          {agFrage.kontext}
        </div>
      )}

      {/* Teil-Fragen */}
      {teilaufgaben.map((ta: InlineTeilaufgabe) => {
        const Komponente = FRAGETYP_KOMPONENTEN[ta.typ]
        if (!Komponente) {
          return (
            <div key={ta.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-700 dark:text-amber-300">
              Fragetyp &quot;{ta.typ}&quot; wird noch nicht unterstuetzt.
            </div>
          )
        }

        // Teilaufgabe als Pseudo-Frage aufbereiten (InlineTeilaufgabe → Frage)
        const teilFrage = {
          id: ta.id,
          fach: frage.fach,
          thema: frage.thema,
          typ: ta.typ,
          schwierigkeit: frage.schwierigkeit,
          frage: ta.fragetext,
          fragetext: ta.fragetext,
          musterlosung: ta.musterlosung || '',
          uebung: true,
          pruefungstauglich: (frage as unknown as Record<string, unknown>).pruefungstauglich ?? false,
          // MC/Multi
          optionen: ta.optionen,
          mehrfachauswahl: ta.mehrfachauswahl,
          zufallsreihenfolge: ta.zufallsreihenfolge,
          erklaerungSichtbar: ta.erklaerungSichtbar,
          // Richtig/Falsch
          aussagen: ta.aussagen,
          // Lückentext
          textMitLuecken: ta.textMitLuecken,
          luecken: ta.luecken,
          // Berechnung
          ergebnisse: ta.ergebnisse,
          rechenwegErforderlich: ta.rechenwegErforderlich,
          hilfsmittel: ta.hilfsmittel,
          // Sortierung
          elemente: ta.elemente,
          teilpunkte: ta.teilpunkte,
          // Zuordnung
          paare: ta.paare,
          // Freitext
          laenge: ta.laenge,
          maxZeichen: ta.maxZeichen,
          // Hotspot / Bildbeschriftung / DragDrop
          bildUrl: ta.bildUrl,
          bereiche: ta.bereiche,
          beschriftungen: ta.beschriftungen,
          zielzonen: ta.zielzonen,
          labels: ta.labels,
          // Code
          sprache: ta.sprache,
          starterCode: ta.starterCode,
          musterLoesung: ta.musterLoesung,
          // Formel
          korrekteFormel: ta.korrekteFormel,
          vergleichsModus: ta.vergleichsModus,
          // Visualisierung
          untertyp: ta.untertyp,
          canvasConfig: ta.canvasConfig,
          musterloesungBild: ta.musterloesungBild,
          // Anhänge
          anhaenge: ta.anhaenge,
        } as unknown as import('../../types/fragen').Frage

        // Label aus der ID extrahieren (z.B. "parent_a" → "a")
        const label = ta.id.includes('_') ? ta.id.split('_').pop() || ta.id : ta.id

        const teilKorrekt = feedbackSichtbar ? (teilAntworten[ta.id] ? true : null) : null

        return (
          <div key={ta.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold flex items-center justify-center">
                {label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {ta.typ}
              </span>
            </div>
            <p className="text-base font-medium dark:text-white mb-2">{ta.fragetext}</p>
            <Komponente
              frage={teilFrage}
              onAntwort={(a) => handleTeilAntwort(ta.id, a)}
              disabled={disabled}
              feedbackSichtbar={feedbackSichtbar}
              korrekt={teilKorrekt}
            />
          </div>
        )
      })}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={agFrage.musterlosung} />}
    </div>
  )
}
