import { useEffect, useCallback } from 'react'
import { useUebenUebungsStore } from '../../store/lernen/uebungsStore'
import { useUebenNavigationStore } from '../../store/lernen/navigationStore'
import { FRAGETYP_KOMPONENTEN } from './fragetypen'
import { getFragetext, bereinigePlatzhalter } from '../../utils/lernen/fragetext'
import QuizHeader from './uebung/QuizHeader'
import QuizNavigation from './uebung/QuizNavigation'
import QuizActions from './uebung/QuizActions'
// FeedbackPanel wird von Fragetyp-Komponenten via FeedbackBox gerendert

export default function UebungsScreen() {
  const {
    session, feedbackSichtbar, letzteAntwortKorrekt,
    beantworte, naechsteFrage, vorherigeFrage, ueberspringen,
    toggleUnsicher, istUnsicher, istSessionFertig, beendeSession,
    aktuelleFrage, kannZurueck,
  } = useUebenUebungsStore()
  const { navigiere } = useUebenNavigationStore()

  const frage = aktuelleFrage()

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
        navigiere('ergebnis')
      } else {
        naechsteFrage()
      }
    }
    if (e.key === 'ArrowRight' && !feedbackSichtbar && !(frage.id in session.antworten)) {
      e.preventDefault()
      ueberspringen()
    }
  }, [frage, session, feedbackSichtbar, kannZurueck, vorherigeFrage, naechsteFrage, ueberspringen, istSessionFertig, beendeSession, navigiere])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!session || !frage) return null

  const Komponente = FRAGETYP_KOMPONENTEN[frage.typ]
  const istBeantwortet = frage.id in session.antworten
  const fortschritt = Object.keys(session.antworten).length

  const handleWeiter = () => naechsteFrage()
  const handleErgebnis = () => {
    beendeSession()
    navigiere('ergebnis')
  }
  const handleBeenden = () => {
    beendeSession()
    navigiere('ergebnis')
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
        {/* Frage-Karte */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-4">
          {/* Kontext (bei Aufgabengruppe) */}
          {frage.typ === 'aufgabengruppe' && frage.kontext && (
            <div className="mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-xs font-medium text-slate-400 uppercase block mb-1">Situation</span>
              {frage.kontext}
            </div>
          )}

          {/* Fragetext */}
          <h2 className="text-lg font-medium mb-4 dark:text-white">
            {bereinigePlatzhalter(getFragetext(frage))}
          </h2>

          {/* Fragetyp-Komponente */}
          {Komponente ? (
            <Komponente
              frage={frage}
              onAntwort={beantworte}
              disabled={istBeantwortet}
              feedbackSichtbar={feedbackSichtbar}
              korrekt={letzteAntwortKorrekt}
            />
          ) : (
            <p className="text-slate-500">Fragetyp &ldquo;{frage.typ}&rdquo; nicht unterstützt.</p>
          )}

          {/* Feedback wird von den Fragetyp-Komponenten via FeedbackBox angezeigt */}
        </div>

        {/* Navigation (Zurück / Überspringen / Weiter) */}
        <QuizNavigation
          kannZurueck={kannZurueck()}
          istBeantwortet={istBeantwortet}
          feedbackSichtbar={feedbackSichtbar}
          istLetzteFrage={session.aktuelleFrageIndex >= session.fragen.length - 1}
          istSessionFertig={istSessionFertig()}
          onZurueck={vorherigeFrage}
          onUeberspringen={ueberspringen}
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
