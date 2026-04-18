import { useEffect, useCallback, useState } from 'react'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import FrageRenderer from '../FrageRenderer'
import { normalisiereFrageDaten } from '../../utils/ueben/fragetypNormalizer'
import type { Frage } from '../../types/fragen'
import { istSelbstbewertungstyp } from '../../utils/ueben/korrektur'
import type { Selbstbewertung } from '../../types/antworten'
import QuizHeader from './uebung/QuizHeader'
import QuizNavigation from './uebung/QuizNavigation'
import QuizActions from './uebung/QuizActions'
import SelbstbewertungsDialog from './uebung/SelbstbewertungsDialog'
// FeedbackPanel wird von Fragetyp-Komponenten via FeedbackBox gerendert

export default function UebungsScreen() {
  const {
    session, feedbackSichtbar,
    naechsteFrage, vorherigeFrage, ueberspringen,
    toggleUnsicher, istUnsicher, istSessionFertig, beendeSession,
    aktuelleFrage, kannZurueck,
    pruefeAntwortJetzt, selbstbewertenById,
  } = useUebenUebungsStore()
  const { zuErgebnis } = useSuSNavigation()

  const frage = aktuelleFrage()
  const [selbstbewertungOffen, setSelbstbewertungOffen] = useState(false)

  // Beim Frage-Wechsel Dialog schliessen
  useEffect(() => { setSelbstbewertungOffen(false) }, [frage?.id])

  // Keyboard-Shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!frage || !session) return
    // Nicht abfangen wenn ein Input/Textarea fokussiert ist
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if (e.key === 'ArrowLeft' && kannZurueck()) {
      e.preventDefault()
      vorherigeFrage()
    }
    if (e.key === 'ArrowRight' && feedbackSichtbar) {
      e.preventDefault()
      if (istSessionFertig()) {
        beendeSession()
        zuErgebnis()
      } else {
        naechsteFrage()
      }
    }
    if (e.key === 'ArrowRight' && !feedbackSichtbar && !(frage.id in session.antworten)) {
      e.preventDefault()
      ueberspringen()
    }
  }, [frage, session, feedbackSichtbar, kannZurueck, vorherigeFrage, naechsteFrage, ueberspringen, istSessionFertig, beendeSession, zuErgebnis])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Keine Frage mehr → Session automatisch beenden (z.B. letzte Frage übersprungen)
  useEffect(() => {
    if (session && !frage && !session.beendet) {
      beendeSession()
      zuErgebnis()
    }
  }, [session, frage, beendeSession, zuErgebnis])

  if (!session || !frage) return null

  // Daten normalisieren (fehlende Felder mit Defaults füllen)
  const normFrage = normalisiereFrageDaten(frage)
  const istBeantwortet = frage.id in session.antworten
  const hatZwischenstand = frage.id in (session.zwischenstande ?? {})
  const fortschritt = Object.keys(session.antworten).length

  const handlePruefen = () => {
    if (istSelbstbewertungstyp(frage.typ)) {
      setSelbstbewertungOffen(true)
    } else {
      pruefeAntwortJetzt(frage.id)
    }
  }
  const handleSelbstbewerten = (bewertung: Selbstbewertung) => {
    selbstbewertenById(frage.id, bewertung)
    setSelbstbewertungOffen(false)
  }
  const handleWeiter = () => naechsteFrage()
  const handleErgebnis = () => {
    beendeSession()
    zuErgebnis()
  }
  const handleBeenden = () => {
    beendeSession()
    zuErgebnis()
  }

  return (
    <div>
      <QuizHeader
        fach={session.fach}
        thema={session.thema}
        fortschritt={fortschritt}
        gesamt={session.fragen.length}
        score={session.score}
        schwierigkeit={frage.schwierigkeit ?? 2}
        typ={frage.typ}
      />

      <main className="max-w-2xl mx-auto p-4">
        {/* Frage-Karte — Fragetyp-Komponenten rendern fragetext selbst, analog Prüfungs-Modus (Layout.tsx) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-4">
          <FrageRenderer frage={normFrage as unknown as Frage} />
        </div>

        {/* Selbstbewertung-Dialog (Freitext/Zeichnen/PDF/Audio/Code) */}
        {selbstbewertungOffen && frage.musterlosung && (
          <SelbstbewertungsDialog
            musterloesung={frage.musterlosung}
            onWahl={handleSelbstbewerten}
          />
        )}

        {/* Navigation (Zurück / Überspringen / Prüfen / Weiter) */}
        <QuizNavigation
          kannZurueck={kannZurueck()}
          istBeantwortet={istBeantwortet}
          feedbackSichtbar={feedbackSichtbar}
          hatZwischenstand={hatZwischenstand && !selbstbewertungOffen}
          istLetzteFrage={session.aktuelleFrageIndex >= session.fragen.length - 1}
          istSessionFertig={istSessionFertig()}
          onZurueck={vorherigeFrage}
          onUeberspringen={ueberspringen}
          onPruefen={handlePruefen}
          onWeiter={handleWeiter}
          onErgebnis={handleErgebnis}
        />

        {/* Beenden + Unsicher */}
        <div className="mt-4">
          <QuizActions
            istUnsicher={istUnsicher()}
            feedbackSichtbar={feedbackSichtbar}
            onToggleUnsicher={toggleUnsicher}
            onBeenden={handleBeenden}
          />
        </div>

        {/* Keyboard-Hinweis */}
        <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600 hidden sm:block">
          Tastatur: &#8592; Zurück &middot; &#8594; Weiter/Überspringen
        </div>
      </main>
    </div>
  )
}
