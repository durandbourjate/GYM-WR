import type { Frage } from '../../types/ueben/fragen'
import type { SessionModus, ThemaQuelle } from '../../types/ueben/uebung'
import type { MasteryStufe, FragenFortschritt } from '../../types/ueben/fortschritt'
import { erstelleBlock, erstelleMixBlock, erstelleRepetitionsBlock } from './blockBuilder'
import { istDauerbaustelle } from './mastery'

interface ErstelleSessionBlockArgs {
  alleFragen: Frage[]
  fach: string
  thema: string
  modus: SessionModus
  quellen: ThemaQuelle[] | undefined
  fortschritte: Record<string, FragenFortschritt>
}

/**
 * Erzeugt Session-Block + mastery-Map aus alleFragen + Konfiguration.
 * Pure: keine Store-Mutationen, keine Side-Effects. Side-Effect-freie
 * Logik aus uebungsStore.starteSession ausgelagert (Bundle W.b Cut 2).
 */
export function erstelleSessionBlock(
  args: ErstelleSessionBlockArgs,
): { block: Frage[]; mastery: Record<string, MasteryStufe> } {
  const { alleFragen, thema, modus, quellen, fortschritte } = args

  const mastery: Record<string, MasteryStufe> = {}
  for (const f of alleFragen) {
    mastery[f.id] = fortschritte[f.id]?.mastery || 'neu'
  }

  let block: Frage[]
  if (modus === 'mix' && quellen) {
    block = erstelleMixBlock(alleFragen, quellen, { mastery })
  } else if (modus === 'repetition') {
    const dauerBau = new Set<string>()
    for (const [id, fp] of Object.entries(fortschritte)) {
      if (istDauerbaustelle(fp.versuche, fp.richtig)) dauerBau.add(id)
    }
    block = erstelleRepetitionsBlock(alleFragen, mastery, dauerBau)
  } else {
    block = erstelleBlock(alleFragen, thema, { mastery })
  }

  return { block, mastery }
}
