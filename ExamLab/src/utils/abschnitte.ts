import type { PruefungsConfig, PruefungsAbschnitt } from '../types/pruefung.ts'
import type { Frage } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'
import { istVollstaendigBeantwortet } from './antwortStatus.ts'

/** Findet den Abschnitt und die Position der aktuellen Frage */
export function findeAbschnitt(
  config: PruefungsConfig,
  frageIndex: number,
  fragen: Frage[]
): { abschnitt: PruefungsAbschnitt; istErsteFrage: boolean; positionImAbschnitt: number; abschnittIndex: number } | null {
  if (!fragen[frageIndex]) return null

  const frageId = fragen[frageIndex].id
  let globalIdx = 0

  for (let ai = 0; ai < config.abschnitte.length; ai++) {
    const abschnitt = config.abschnitte[ai]
    for (let fi = 0; fi < abschnitt.fragenIds.length; fi++) {
      if (abschnitt.fragenIds[fi] === frageId) {
        return {
          abschnitt,
          istErsteFrage: fi === 0,
          positionImAbschnitt: fi,
          abschnittIndex: ai,
        }
      }
      globalIdx++
    }
  }
  return null
}

/** Berechnet Fortschritt pro Abschnitt und gesamt */
export interface AbschnittFortschritt {
  titel: string
  beantwortet: number
  gesamt: number
  punkte: number
  punkteBeantwortet: number
}

export function berechneAbschnittFortschritt(
  config: PruefungsConfig,
  fragen: Frage[],
  antworten: Record<string, Antwort>
): { abschnitte: AbschnittFortschritt[]; gesamtBeantwortet: number; gesamtFragen: number } {
  const fragenMap = new Map(fragen.map((f) => [f.id, f]))
  let gesamtBeantwortet = 0
  let gesamtFragen = 0

  const abschnitte = config.abschnitte.map((a) => {
    let beantwortet = 0
    let punkte = 0
    let punkteBeantwortet = 0

    for (const id of a.fragenIds) {
      const frage = fragenMap.get(id)
      const p = frage?.punkte ?? 0
      punkte += p
      if (frage && istVollstaendigBeantwortet(frage, antworten[id], fragen, antworten)) {
        beantwortet++
        punkteBeantwortet += p
      }
    }

    gesamtBeantwortet += beantwortet
    gesamtFragen += a.fragenIds.length

    return {
      titel: a.titel,
      beantwortet,
      gesamt: a.fragenIds.length,
      punkte,
      punkteBeantwortet,
    }
  })

  return { abschnitte, gesamtBeantwortet, gesamtFragen }
}
