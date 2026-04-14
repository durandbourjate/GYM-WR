import { useFrageMode } from '../context/FrageModeContext.tsx'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useUebenUebungsStore } from '../store/ueben/uebungsStore.ts'
import type { Antwort } from '../types/antworten.ts'

export interface FrageAdapterResult {
  antwort: Antwort | null
  onAntwort: (antwort: Antwort) => void
  /** Zwischenstand speichern ohne Korrektur (für Multi-Feld-Fragetypen im Üben-Modus) */
  speichereZwischenstand: ((antwort: Antwort) => void) | null
  disabled: boolean
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
  const uebenBeantworteById = useUebenUebungsStore((s) => s.beantworteById)
  const uebenSpeichereZwischenstandById = useUebenUebungsStore((s) => s.speichereZwischenstandById)
  const uebenToggleUnsicherById = useUebenUebungsStore((s) => s.toggleUnsicherById)

  if (mode === 'pruefung') {
    return {
      antwort: pruefungAntwort,
      onAntwort: (a) => pruefungSetAntwort(frageId, a),
      speichereZwischenstand: null, // Im Prüfungsmodus nicht nötig — onAntwort speichert ohne Korrektur
      disabled: pruefungAbgegeben,
      feedbackSichtbar: false,
      korrekt: null,
      markiertAlsUnsicher: pruefungMarkiert,
      toggleUnsicher: () => pruefungToggleMarkierung(frageId),
    }
  }

  const antwort = uebenSession?.antworten[frageId] ?? uebenSession?.zwischenstande?.[frageId] ?? null
  const korrekt = uebenSession?.ergebnisse[frageId] ?? uebenLetzteKorrekt
  const istBeantwortet = frageId in (uebenSession?.antworten ?? {})

  return {
    antwort,
    onAntwort: (a) => uebenBeantworteById(frageId, a),
    speichereZwischenstand: (a) => uebenSpeichereZwischenstandById(frageId, a),
    disabled: istBeantwortet,
    feedbackSichtbar: uebenFeedbackSichtbar,
    korrekt: korrekt ?? null,
    markiertAlsUnsicher: uebenSession?.unsicher?.has(frageId) ?? false,
    toggleUnsicher: () => uebenToggleUnsicherById(frageId),
  }
}
