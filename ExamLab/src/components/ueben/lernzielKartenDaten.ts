// ExamLab/src/components/ueben/lernzielKartenDaten.ts
//
// Pure Berechnungs-Helper für LernzielKarte — extrahiert für only-export-components.
// Der React-Component-File darf nur die Component exportieren; Type + Pure-Function
// leben separat.
import type { Lernziel } from '@shared/types/fragen-core'
import type { FragenFortschritt, LernzielStatus } from '../../types/ueben/fortschritt'
import { lernzielStatus } from '../../utils/ueben/mastery'

export interface KartenDaten {
  total: number
  buckets: { gemeistert: number; gefestigt: number; ueben: number; neu: number }
  status: LernzielStatus
  nichtSicher: number
  letzterVersuch: string | null
}

export function berechneKartenDaten(
  lernziel: Lernziel,
  fortschritte: Record<string, FragenFortschritt>,
): KartenDaten {
  const ids = lernziel.fragenIds ?? []
  const buckets = { gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0 }
  let letzterVersuch: string | null = null

  for (const id of ids) {
    const fp = fortschritte[id]
    // mastery defensiv normalisieren — Backend liefert type-fremde Werte (S118):
    // numerischer String (Test-Seeder) oder '' (leere Zelle) → sonst Rogue-Bucket.
    const roh = fp?.mastery
    const stufe = roh === 'gemeistert' || roh === 'gefestigt' || roh === 'ueben' ? roh : 'neu'
    buckets[stufe]++
    if (fp?.letzterVersuch && (!letzterVersuch || fp.letzterVersuch > letzterVersuch)) {
      letzterVersuch = fp.letzterVersuch
    }
  }

  return {
    total: ids.length,
    buckets,
    status: lernzielStatus(lernziel, fortschritte),
    nichtSicher: buckets.neu + buckets.ueben,
    letzterVersuch,
  }
}
