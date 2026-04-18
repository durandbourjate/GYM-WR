import { useFrageMode } from '../context/FrageModeContext.tsx'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore.ts'
import type { Antwort, Selbstbewertung } from '../types/antworten.ts'

export interface FrageAdapterResult {
  antwort: Antwort | null
  /**
   * Speichert die Antwort.
   * - Pruefungs-Modus: persistiert sofort (mit Auto-Save)
   * - Üben-Modus: nur lokaler Zwischenstand, keine Korrektur. Korrektur erst über
   *   `onPruefen()` oder `onSelbstbewerten()`.
   */
  onAntwort: (antwort: Antwort) => void
  /** Zwischenstand speichern ohne Korrektur (für Multi-Feld-Fragetypen im Üben-Modus) */
  speichereZwischenstand: ((antwort: Antwort) => void) | null
  /** Üben-Modus: explizit "Antwort prüfen" — gibt es nur im Üben-Modus */
  onPruefen: (() => void) | null
  /** Üben-Modus: SuS-Selbstbewertung für Freitext/Visualisierung/PDF/Audio/Code */
  onSelbstbewerten: ((bewertung: Selbstbewertung) => void) | null
  /** True wenn die Frage bereits geprüft wurde (Üben) bzw. Prüfung abgegeben (Pruefung). */
  disabled: boolean
  /** True wenn aktuell ein Zwischenstand existiert, der geprüft werden kann (Üben). */
  hatZwischenstand: boolean
  /** True wenn die Frage bereits geprüft wurde (Üben-Modus). */
  istGeprueft: boolean
  feedbackSichtbar: boolean
  korrekt: boolean | null
  markiertAlsUnsicher: boolean
  toggleUnsicher: () => void
}

export function useFrageAdapter(frageId: string): FrageAdapterResult {
  const mode = useFrageMode()

  // BEIDE Stores werden bedingungslos aufgerufen (React Rules of Hooks)
  const pruefungAntwort = usePruefungStore((s) => s.antworten[frageId] ?? null)
  const pruefungSetAntwort = usePruefungStore((s) => s.setAntwort)
  const pruefungAbgegeben = usePruefungStore((s) => s.abgegeben)
  const pruefungMarkiert = usePruefungStore((s) => !!s.markierungen[frageId])
  const pruefungToggleMarkierung = usePruefungStore((s) => s.toggleMarkierung)

  const uebenSession = useUebenUebungsStore((s) => s.session)
  const uebenFeedbackSichtbar = useUebenUebungsStore((s) => s.feedbackSichtbar)
  const uebenLetzteKorrekt = useUebenUebungsStore((s) => s.letzteAntwortKorrekt)
  const uebenSpeichereZwischenstandById = useUebenUebungsStore((s) => s.speichereZwischenstandById)
  const uebenPruefeAntwortJetzt = useUebenUebungsStore((s) => s.pruefeAntwortJetzt)
  const uebenSelbstbewertenById = useUebenUebungsStore((s) => s.selbstbewertenById)
  const uebenToggleUnsicherById = useUebenUebungsStore((s) => s.toggleUnsicherById)

  if (mode === 'pruefung') {
    return {
      antwort: pruefungAntwort,
      onAntwort: (a) => pruefungSetAntwort(frageId, a),
      speichereZwischenstand: null, // Im Prüfungsmodus nicht nötig — onAntwort speichert ohne Korrektur
      onPruefen: null,
      onSelbstbewerten: null,
      disabled: pruefungAbgegeben,
      hatZwischenstand: false,
      istGeprueft: false,
      feedbackSichtbar: false,
      korrekt: null,
      markiertAlsUnsicher: pruefungMarkiert,
      toggleUnsicher: () => pruefungToggleMarkierung(frageId),
    }
  }

  // Üben-Modus: Zwischenstand bevorzugen (live-Eingabe), Fallback auf gespeicherte Antwort
  const antwort = uebenSession?.zwischenstande?.[frageId] ?? uebenSession?.antworten[frageId] ?? null
  const istGeprueft = frageId in (uebenSession?.ergebnisse ?? {})
  const hatZwischenstand = frageId in (uebenSession?.zwischenstande ?? {})
  const korrekt = uebenSession?.ergebnisse[frageId] ?? uebenLetzteKorrekt

  return {
    antwort,
    // Im Üben-Modus speichert onAntwort nur Zwischenstand — keine Korrektur.
    // Die Korrektur erfolgt explizit über onPruefen() oder onSelbstbewerten().
    onAntwort: (a) => uebenSpeichereZwischenstandById(frageId, a),
    speichereZwischenstand: (a) => uebenSpeichereZwischenstandById(frageId, a),
    onPruefen: () => uebenPruefeAntwortJetzt(frageId),
    onSelbstbewerten: (bewertung: Selbstbewertung) => uebenSelbstbewertenById(frageId, bewertung),
    disabled: istGeprueft,
    hatZwischenstand,
    istGeprueft,
    feedbackSichtbar: uebenFeedbackSichtbar && istGeprueft,
    korrekt: korrekt ?? null,
    markiertAlsUnsicher: uebenSession?.unsicher?.has(frageId) ?? false,
    toggleUnsicher: () => uebenToggleUnsicherById(frageId),
  }
}
