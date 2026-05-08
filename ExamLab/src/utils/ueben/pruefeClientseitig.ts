import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import type { UebungsSession } from '../../types/ueben/uebung'
import { pruefeAntwort } from './korrektur'

interface PruefeClientseitigArgs {
  session: UebungsSession
  frage: Frage
  normalized: Antwort
}

export interface PruefeClientseitigResult {
  korrekt: boolean
  sessionUpdates: Pick<UebungsSession, 'antworten' | 'ergebnisse' | 'score'>
  letzteMusterloesung: string | null
}

/**
 * Clientseitige Korrektur via Pre-Load-Lösung (Bundle Ü-Pfad).
 * Reine Berechnung — Side-Effects (Fortschritt-Tracking, set()-Call) bleiben
 * im Store-Action (uebungsStore.pruefeAntwortJetzt).
 */
export function pruefeClientseitig(args: PruefeClientseitigArgs): PruefeClientseitigResult {
  const { session, frage, normalized } = args
  const korrekt = pruefeAntwort(frage, normalized)
  return {
    korrekt,
    sessionUpdates: {
      antworten: { ...session.antworten, [frage.id]: normalized },
      ergebnisse: { ...session.ergebnisse, [frage.id]: korrekt },
      score: session.score + (korrekt ? 1 : 0),
    },
    letzteMusterloesung: frage.musterlosung ?? null,
  }
}
