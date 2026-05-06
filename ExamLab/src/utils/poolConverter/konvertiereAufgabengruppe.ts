import type { Frage, AufgabengruppeFrage, FreitextFrage } from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'
import { berechnePunkte } from './punkte'

export function konvertiereAufgabengruppe(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    // gruppe → AufgabengruppeFrage (Teilaufgaben inline)
    case 'gruppe': {
      const teilaufgaben = (poolFrage.teil ?? []).map((teil) => ({
        id: genId(),
        typ: (typeof teil.type === 'string' ? teil.type : 'freitext'),
        fragetext: (typeof teil.q === 'string' ? teil.q : ''),
        punkte: berechnePunkte(
          { ...poolFrage, type: teil.type } as unknown as PoolFrage
          /* Defensive: synthetic gruppe-Teil — teil.type ist string|undefined und
             kann ein Wert sein, der nicht in der PoolFrageTyp-Union vorkommt. */
        ),
        ...teil,
      }))
      const frage: AufgabengruppeFrage = {
        ...basis,
        typ: 'aufgabengruppe',
        kontext: `${poolFrage.q}${poolFrage.context ? '\n\n' + poolFrage.context : ''}`,
        teilaufgaben,
      }
      return frage
    }

    default: {
      // Unbekannter Typ → als Freitext importieren (statt Error werfen)
      console.warn(`[poolConverter] Unbekannter Pool-Typ "${poolFrage.type}" → Freitext-Fallback`)
      const frage: FreitextFrage = {
        ...basis,
        typ: 'freitext',
        fragetext: poolFrage.q,
        laenge: 'mittel',
      }
      return frage
    }
  }
}
