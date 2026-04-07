import type { MasteryStufe, FragenFortschritt, LernzielStatus } from '../../types/ueben/fortschritt'
import type { Lernziel } from '@shared/types/fragen'

const GEFESTIGT_SCHWELLE = 3
const GEMEISTERT_SCHWELLE = 5
const GEMEISTERT_MIN_SESSIONS = 2

export function berechneMastery(richtigInFolge: number, sessionIds: string[]): MasteryStufe {
  if (richtigInFolge === 0 && sessionIds.length === 0) return 'neu'

  const uniqueSessions = new Set(sessionIds).size

  if (richtigInFolge >= GEMEISTERT_SCHWELLE && uniqueSessions >= GEMEISTERT_MIN_SESSIONS) {
    return 'gemeistert'
  }
  if (richtigInFolge >= GEFESTIGT_SCHWELLE) {
    return 'gefestigt'
  }
  return 'ueben'
}

export function aktualisiereFortschritt(
  fortschritt: FragenFortschritt,
  korrekt: boolean,
  sessionId: string
): FragenFortschritt {
  const sessionIds = fortschritt.sessionIds.includes(sessionId)
    ? fortschritt.sessionIds
    : [...fortschritt.sessionIds, sessionId]

  const richtigInFolge = korrekt ? fortschritt.richtigInFolge + 1 : 0

  const mastery = berechneMastery(richtigInFolge, sessionIds)

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

export function istDauerbaustelle(
  versuche: number,
  richtig: number,
  schwelle = 10,
  quoteSchwelle = 0.5
): boolean {
  if (versuche < schwelle) return false
  return (richtig / versuche) < quoteSchwelle
}
