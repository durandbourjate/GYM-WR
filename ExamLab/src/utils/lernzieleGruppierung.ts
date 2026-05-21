import type { Lernziel } from '@shared/types/fragen-core'

export interface ThemaGruppe {
  /** Lernziele ohne Unterthema. */
  meta: Lernziel[]
  unterthemen: Record<string, Lernziel[]>
}
/** Fach → Thema → ThemaGruppe. */
export type LernzielGruppierung = Record<string, Record<string, ThemaGruppe>>

/** Gruppiert Lernziele nach Fach → Thema → Unterthema. */
export function gruppiereLernziele(lernziele: Lernziel[]): LernzielGruppierung {
  const result: LernzielGruppierung = {}
  for (const lz of lernziele) {
    const fach = lz.fach || 'Andere'
    const thema = lz.thema || 'Allgemein'
    if (!result[fach]) result[fach] = {}
    if (!result[fach][thema]) result[fach][thema] = { meta: [], unterthemen: {} }
    const gruppe = result[fach][thema]
    if (lz.unterthema) {
      if (!gruppe.unterthemen[lz.unterthema]) gruppe.unterthemen[lz.unterthema] = []
      gruppe.unterthemen[lz.unterthema].push(lz)
    } else {
      gruppe.meta.push(lz)
    }
  }
  return result
}
