import type { Frage } from '../../types/ueben/fragen'
import type { MasteryStufe } from '../../types/ueben/fortschritt'
import { seededShuffle } from './shuffle'

const MAX_BLOCK_SIZE = 10

// Prioritaet: ueben (zuletzt falsch) > ueben (nie richtig) > neu > gefestigt > gemeistert
const MASTERY_PRIORITAET: Record<MasteryStufe, number> = {
  ueben: 1,
  neu: 2,
  gefestigt: 3,
  gemeistert: 4,
}

export interface BlockOptions {
  mastery?: Record<string, MasteryStufe>
  seed?: string
}

export function erstelleBlock(
  alleFragen: Frage[],
  thema: string,
  seedOrOptions?: string | BlockOptions
): Frage[] {
  const options: BlockOptions = typeof seedOrOptions === 'string'
    ? { seed: seedOrOptions }
    : seedOrOptions || {}

  const themaFragen = alleFragen.filter(f => f.thema === thema)
  if (themaFragen.length === 0) return []

  const seed = options.seed || `${Date.now()}`
  const mastery = options.mastery || {}

  // Sortiere nach Mastery-Prioritaet
  const sortiert = [...themaFragen].sort((a, b) => {
    const prioA = MASTERY_PRIORITAET[mastery[a.id] || 'neu']
    const prioB = MASTERY_PRIORITAET[mastery[b.id] || 'neu']
    return prioA - prioB
  })

  // Innerhalb gleicher Prioritaet mischen
  const gruppen = new Map<number, Frage[]>()
  for (const f of sortiert) {
    const prio = MASTERY_PRIORITAET[mastery[f.id] || 'neu']
    if (!gruppen.has(prio)) gruppen.set(prio, [])
    gruppen.get(prio)!.push(f)
  }

  const ergebnis: Frage[] = []
  for (const [, fragen] of [...gruppen.entries()].sort((a, b) => a[0] - b[0])) {
    ergebnis.push(...seededShuffle(fragen, seed))
  }

  return ergebnis.slice(0, MAX_BLOCK_SIZE)
}
