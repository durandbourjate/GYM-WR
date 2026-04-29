import { useEffect, useCallback, useState, useMemo } from 'react'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { usePrefetchAssets } from '../../hooks/usePrefetchAssets'
import { pdfPrefetchUrls } from '../../utils/anhaengePrefetch'
import { useSuSNavigation } from '../../hooks/ueben/useSuSNavigation'
import FrageRenderer from '../FrageRenderer'
import { normalisiereFrageDaten } from '../../utils/ueben/fragetypNormalizer'
import type { Frage } from '../../types/fragen-storage'
import { bewerteAntwortDetails, istSelbstbewertungstyp } from '../../utils/ueben/korrektur'
import { alleLueckenGefuellt, anzahlOffeneLuecken } from '../../utils/ueben/lueckentextChecks'
import type { Selbstbewertung } from '../../types/antworten'
import QuizHeader from './uebung/QuizHeader'
import QuizNavigation from './uebung/QuizNavigation'
import QuizActions from './uebung/QuizActions'
import SelbstbewertungsDialog from './uebung/SelbstbewertungsDialog'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'
// C9 Task 25+ (S135): nach „Antwort prüfen" rendert FrageRenderer mit modus='loesung' →
// Phase-2-Lösungs-Komponente mit pro-Sub-Element-Rahmen + erklaerung-Anzeige.
// MusterloesungsBlock darunter zeigt Gesamt-Musterlösung (ersetzt altes FeedbackPanel).

// Bundle H Phase 5: Tiptap + CodeMirror rendern intern contentEditable-Divs (nicht
// INPUT/TEXTAREA), darum reicht der bestehende Tag-Whitelist-Check nicht.
// data-no-enter-submit auf dem Wrapper signalisiert „Enter NICHT als Submit interpretieren".
function istNonSubmittableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.isContentEditable) return true
  if (el.closest('[data-no-enter-submit]')) return true
  return false
}

export default function UebungsScreen() {
  const {
    session, feedbackSichtbar,
    naechsteFrage, vorherigeFrage, ueberspringen,
    toggleUnsicher, istUnsicher, istSessionFertig, beendeSession,
    aktuelleFrage, kannZurueck,
    pruefeAntwortJetzt, selbstbewertenById,
    speichertPruefung, pruefFehler, letzteMusterloesung,
    letzteAntwortKorrekt,
  } = useUebenUebungsStore()
  const { zuErgebnis } = useSuSNavigation()

  const frage = aktuelleFrage()

  // Bundle G.b — PDF-Anhang der NÄCHSTEN Frage browser-prefetchen
  const naechsteFragePdfUrls = useMemo(() => {
    const idx = session?.aktuelleFrageIndex ?? -1
    const naechste = session?.fragen?.[idx + 1]
    return pdfPrefetchUrls(naechste?.anhaenge)
  }, [session?.aktuelleFrageIndex, session?.fragen])

  usePrefetchAssets(naechsteFragePdfUrls)

  const [selbstbewertungOffen, setSelbstbewertungOffen] = useState(false)
  // Bundle H Phase 5: amber-Hinweis-Banner für Tastatur-Trigger (z.B. „Noch 2 Lücken offen")
  const [hinweis, setHinweis] = useState<string | null>(null)

  // Beim Frage-Wechsel Dialog + Hinweis schliessen
  useEffect(() => {
    setSelbstbewertungOffen(false)
    setHinweis(null)
  }, [frage?.id])

  // Hinweis nach 3s automatisch ausblenden
  useEffect(() => {
    if (!hinweis) return
    const t = setTimeout(() => setHinweis(null), 3000)
    return () => clearTimeout(t)
  }, [hinweis])

  // Phase 2: Server liefert für Selbstbewertungstypen letzteMusterloesung —
  // Dialog dann öffnen. Auto-korrigierbare Typen setzen stattdessen feedbackSichtbar.
  useEffect(() => {
    if (frage && istSelbstbewertungstyp(frage.typ) && letzteMusterloesung && !feedbackSichtbar) {
      setSelbstbewertungOffen(true)
    }
  }, [frage, letzteMusterloesung, feedbackSichtbar])

  // Keyboard-Shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!frage || !session) return

    // Pfeil-Navigation: Input/Textarea/Select-Whitelist (User in Eingabe will nicht
    // versehentlich weiternavigieren). Bestehendes Verhalten unverändert.
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
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
      return
    }

    // Enter / Cmd+Enter: „Antwort prüfen" (oder „Weiter" wenn Feedback sichtbar).
    // Tiptap + CodeMirror sind contentEditable bzw. tragen data-no-enter-submit →
    // Enter wird dort durchgelassen, ausser User drückt Cmd/Ctrl-Override.
    if (e.key === 'Enter') {
      const istCmd = e.metaKey || e.ctrlKey
      const isNonSubmit = istNonSubmittableElement(e.target)
      if (isNonSubmit && !istCmd) return

      e.preventDefault()
      if (feedbackSichtbar) {
        if (istSessionFertig()) {
          beendeSession()
          zuErgebnis()
        } else {
          naechsteFrage()
        }
        return
      }
      if (frage.typ === 'lueckentext' && !alleLueckenGefuellt(frage, session.antworten[frage.id] ?? null)) {
        const offen = anzahlOffeneLuecken(frage, session.antworten[frage.id] ?? null)
        setHinweis(`Noch ${offen} ${offen === 1 ? 'Lücke' : 'Lücken'} offen`)
        return
      }
      // Direkt pruefeAntwortJetzt rufen statt indirekt über handlePruefen —
      // handlePruefen wird auf jedem Render neu erstellt und würde useCallback-Deps
      // ständig invalidieren (S130-Lehre: Hooks-Stabilität).
      pruefeAntwortJetzt(frage.id)
    }
  }, [frage, session, feedbackSichtbar, kannZurueck, vorherigeFrage, naechsteFrage, ueberspringen, istSessionFertig, beendeSession, zuErgebnis, pruefeAntwortJetzt])

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
  // Phase 2: Backend liefert frage.musterlosung leer (bereinigt). Server schickt sie
  // erst beim Prüf-Call zurück (in letzteMusterloesung). Hier patchen, damit
  // Fragetyp-Komponenten + Feedback-Boxen weiterhin frage.musterlosung lesen können.
  const baseFrage = letzteMusterloesung && !frage.musterlosung
    ? { ...frage, musterlosung: letzteMusterloesung }
    : frage
  const normFrage = normalisiereFrageDaten(baseFrage)
  const istBeantwortet = frage.id in session.antworten
  const hatZwischenstand = frage.id in (session.zwischenstande ?? {})
  const fortschritt = Object.keys(session.antworten).length

  const handlePruefen = () => {
    // Phase 2: Server liefert Musterlösung + korrekt/selbstbewertung-Flag.
    // Für Selbstbewertungstypen öffnet der useEffect unten den Dialog,
    // sobald letzteMusterloesung vom Server eintrifft.
    pruefeAntwortJetzt(frage.id)
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
        {/* Bundle H Phase 5: Tastatur-Hinweis (z.B. „Noch 2 Lücken offen") */}
        {hinweis && (
          <div
            role="status"
            className="mb-3 p-3 rounded-lg bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 text-sm"
          >
            {hinweis}
          </div>
        )}

        {/* Retry-Banner bei fehlgeschlagener Server-Prüfung (Phase 2) */}
        {pruefFehler && (
          <div
            role="alert"
            className="mb-3 p-3 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center justify-between gap-3"
          >
            <span>Prüfung fehlgeschlagen: {pruefFehler}</span>
            <button
              onClick={handlePruefen}
              className="underline hover:no-underline font-medium whitespace-nowrap"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Frage-Karte — Fragetyp-Komponenten rendern fragetext selbst, analog Prüfungs-Modus (Layout.tsx).
            Nach „Antwort prüfen" wechselt der Modus von 'aufgabe' → 'loesung', damit die
            Phase-2-Lösungs-Komponente mit pro-Zeile-Rahmen + erklaerung-Anzeige gerendert wird. */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 mb-4">
          <FrageRenderer
            frage={normFrage as unknown as Frage}
            modus={feedbackSichtbar ? 'loesung' : 'aufgabe'}
            antwort={session.antworten[frage.id] ?? null}
          />
          {feedbackSichtbar && normFrage.musterlosung && (() => {
            // S137 Ticket 8 Anpassung 3: dreistufiges Label statt binär.
            // bewerteAntwortDetails liefert Teilpunkte für Multi-Element-Typen (R/F, Lückentext,
            // Bildbeschriftung, Zuordnung mit >1 Element). null → Single-Element → binär.
            const details = letzteAntwortKorrekt === false
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? bewerteAntwortDetails(normFrage as any, session.antworten[frage.id] ?? null)
              : null
            let label = 'Musterlösung'
            let variant: 'korrekt' | 'falsch' = 'korrekt'
            if (letzteAntwortKorrekt === false) {
              variant = 'falsch'
              if (details && details.erzielt > 0 && details.erzielt < details.max) {
                label = `Teilweise richtig (${details.erzielt}/${details.max}) — Musterlösung`
              } else {
                label = 'Leider falsch — Musterlösung'
              }
            }
            return (
              <MusterloesungsBlock variant={variant} label={label}>
                <p className="whitespace-pre-wrap">{normFrage.musterlosung}</p>
              </MusterloesungsBlock>
            )
          })()}
        </div>

        {/* Selbstbewertung-Dialog (Freitext/Zeichnen/PDF/Audio/Code).
            Musterlösung wird oben in normFrage gepatcht (frage.musterlosung || letzteMusterloesung). */}
        {selbstbewertungOffen && normFrage.musterlosung && (
          <SelbstbewertungsDialog
            musterloesung={normFrage.musterlosung}
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
          speichertPruefung={speichertPruefung}
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
            feedbackContext={{
              rolle: 'sus',
              ort: 'sus-ueben-frage',
              modus: 'ueben',
              frageId: frage.id,
              frageTyp: frage.typ,
              gruppeId: session.gruppeId,
            }}
          />
        </div>

        {/* Keyboard-Hinweis */}
        <div className="mt-4 text-center text-xs text-slate-400 dark:text-slate-600 hidden sm:block">
          Tastatur: &#8592; Zurück &middot; &#8594; Weiter/Überspringen &middot; &#8629; Prüfen/Weiter (&#8984;&#8629; erzwingen)
        </div>
      </main>
    </div>
  )
}
