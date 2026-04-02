import type { Frage } from '../types/fragen'
import { seededShuffle } from './shuffle'

const MAX_BLOCK_SIZE = 10

export function erstelleBlock(
  alleFragen: Frage[],
  thema: string,
  seed?: string
): Frage[] {
  const themaFragen = alleFragen.filter(f => f.thema === thema && f.uebung)

  if (themaFragen.length === 0) return []

  const gemischt = seed
    ? seededShuffle(themaFragen, seed)
    : seededShuffle(themaFragen, `${Date.now()}`)

  return gemischt.slice(0, MAX_BLOCK_SIZE)
}
