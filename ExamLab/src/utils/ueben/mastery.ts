import type { MasteryStufe, FragenFortschritt, LernzielStatus } from '../../types/ueben/fortschritt'
import type { Lernziel } from '@shared/types/fragen'
import { DEFAULT_MASTERY_SCHWELLWERTE, type MasterySchwellwerte } from '../../types/ueben/settings'

export function berechneMastery(
  richtigInFolge: number,
  sessionIds: string[],
  schwellwerte?: Partial<MasterySchwellwerte>
): MasteryStufe {
  if (richtigInFolge === 0 && sessionIds.length === 0) return 'neu'

  const s = { ...DEFAULT_MASTERY_SCHWELLWERTE, ...schwellwerte }
  const uniqueSessions = new Set(sessionIds).size

  if (richtigInFolge >= s.gemeistert && uniqueSessions >= s.gemeistertMinSessions) {
    return 'gemeistert'
  }
  if (richtigInFolge >= s.gefestigt) {
    return 'gefestigt'
  }
  return 'ueben'
}

export function aktualisiereFortschritt(
  fortschritt: FragenFortschritt,
  korrekt: boolean,
  sessionId: string,
  schwellwerte?: Partial<MasterySchwellwerte>
): FragenFortschritt {
  const sessionIds = fortschritt.sessionIds.includes(sessionId)
    ? fortschritt.sessionIds
    : [...fortschritt.sessionIds, sessionId]

  const richtigInFolge = korrekt ? fortschritt.richtigInFolge + 1 : 0

  const mastery = berechneMastery(richtigInFolge, sessionIds, schwellwerte)

  return {
    ...fortschritt,
    versuche: fortschritt.versuche + 1,
    richtig: korrekt ? fortschritt.richtig + 1 : fortschritt.richtig,
    richtigInFolge,
    sessionIds,
    letzterVersuch: new Date().toISOString(),
    mastery,
  }
}

export function lernzielStatus(
  lernziel: Lernziel,
  fortschritte: Record<string, FragenFortschritt>
): LernzielStatus {
  const ids = lernziel.fragenIds
  if (!ids || ids.length === 0) return 'offen'

  let gemeistert = 0
  let gefestigtOderBesser = 0
  let geuebt = 0

  for (const id of ids) {
    const fp = fortschritte[id]
    if (!fp) continue
    switch (fp.mastery) {
      case 'gemeistert': gemeistert++; gefestigtOderBesser++; geuebt++; break
      case 'gefestigt': gefestigtOderBesser++; geuebt++; break
      case 'ueben': geuebt++; break
    }
  }

  if (gemeistert === ids.length) return 'gemeistert'
  if (gefestigtOderBesser / ids.length >= 0.5) return 'gefestigt'
  if (geuebt > 0) return 'inArbeit'
  return 'offen'
}

// ──────────────────────────────────────────────
// Recency-gewichtete Mastery
// ──────────────────────────────────────────────

const TAGE_BIS_VERBLASSEN = 30   // Nach 30 Tagen: 1 Stufe runter (visuell)
const TAGE_BIS_ZURUECK = 90     // Nach 90 Tagen: zurück auf "üben"

const STUFEN_RANG: Record<MasteryStufe, number> = {
  'neu': 0, 'ueben': 1, 'gefestigt': 2, 'gemeistert': 3,
}
const RANG_STUFEN: MasteryStufe[] = ['neu', 'ueben', 'gefestigt', 'gemeistert']

/**
 * Berechnet Mastery unter Berücksichtigung des Zeitabstands.
 * Lange nicht geübt → Stufe sinkt visuell.
 *
 * @param baseMastery  Die berechnete Mastery ohne Recency
 * @param letzterVersuch  ISO-Timestamp des letzten Versuchs
 * @returns { mastery, istVerblasst } — angepasste Stufe + Flag ob verblasst
 */
export function berechneMasteryMitRecency(
  baseMastery: MasteryStufe,
  letzterVersuch: string | undefined
): { mastery: MasteryStufe; istVerblasst: boolean } {
  if (!letzterVersuch || baseMastery === 'neu') {
    return { mastery: baseMastery, istVerblasst: false }
  }

  const tageHer = Math.floor(
    (Date.now() - new Date(letzterVersuch).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (tageHer < TAGE_BIS_VERBLASSEN) {
    return { mastery: baseMastery, istVerblasst: false }
  }

  if (tageHer >= TAGE_BIS_ZURUECK) {
    // Mindestens auf "üben" (nicht auf "neu" — SuS hat ja schon geübt)
    const rang = Math.min(STUFEN_RANG[baseMastery], STUFEN_RANG['ueben'])
    return { mastery: RANG_STUFEN[rang], istVerblasst: true }
  }

  // 30–90 Tage: 1 Stufe runter
  const rang = Math.max(STUFEN_RANG[baseMastery] - 1, STUFEN_RANG['ueben'])
  return { mastery: RANG_STUFEN[rang], istVerblasst: true }
}

export function istDauerbaustelle(
  versuche: number,
  richtig: number,
  schwelle = 10,
  quoteSchwelle = 0.5
): boolean {
  if (versuche < schwelle) return false
  return (richtig / versuche) < quoteSchwelle
}
