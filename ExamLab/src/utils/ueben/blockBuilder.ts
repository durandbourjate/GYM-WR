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

/**
 * Erstellt einen gemischten Block aus mehreren Themen (Cross-Topic-Mix).
 * Verteilt proportional über die gewählten Themen, priorisiert nach Mastery.
 */
export function erstelleMixBlock(
  alleFragen: Frage[],
  quellen: { fach: string; thema: string }[],
  options?: BlockOptions
): Frage[] {
  const mastery = options?.mastery || {}
  const seed = options?.seed || `${Date.now()}`

  // Fragen pro Quelle sammeln
  const quellenFragen = quellen.map(q =>
    alleFragen.filter(f => f.fach === q.fach && f.thema === q.thema)
  ).filter(arr => arr.length > 0)

  if (quellenFragen.length === 0) return []

  // Pro Quelle nach Mastery sortieren + mischen
  const sortiertProQuelle = quellenFragen.map((fragen, i) => {
    const sortiert = [...fragen].sort((a, b) => {
      const prioA = MASTERY_PRIORITAET[mastery[a.id] || 'neu']
      const prioB = MASTERY_PRIORITAET[mastery[b.id] || 'neu']
      return prioA - prioB
    })
    return seededShuffle(sortiert, seed + `q${i}`)
  })

  // Round-Robin: Abwechselnd je 1 Frage pro Quelle
  const ergebnis: Frage[] = []
  const indices = sortiertProQuelle.map(() => 0)
  while (ergebnis.length < MAX_BLOCK_SIZE) {
    let hinzugefuegt = false
    for (let q = 0; q < sortiertProQuelle.length && ergebnis.length < MAX_BLOCK_SIZE; q++) {
      if (indices[q] < sortiertProQuelle[q].length) {
        ergebnis.push(sortiertProQuelle[q][indices[q]])
        indices[q]++
        hinzugefuegt = true
      }
    }
    if (!hinzugefuegt) break
  }

  return seededShuffle(ergebnis, seed + 'mix')
}

/**
 * Erstellt einen Repetitions-Block: schwache Fragen über alle Themen.
 * Prio: Dauerbaustellen > üben > gefestigt. Exkludiert gemeistert + neu.
 */
export function erstelleRepetitionsBlock(
  alleFragen: Frage[],
  mastery: Record<string, MasteryStufe>,
  dauerbaustellen?: Set<string>,
  seed?: string
): Frage[] {
  const s = seed || `${Date.now()}`

  const dauerBau: Frage[] = []
  const ueben: Frage[] = []
  const festigung: Frage[] = []

  for (const f of alleFragen) {
    const m = mastery[f.id] || 'neu'
    if (dauerbaustellen?.has(f.id)) {
      dauerBau.push(f)
    } else if (m === 'ueben') {
      ueben.push(f)
    } else if (m === 'gefestigt') {
      festigung.push(f)
    }
    // 'neu' und 'gemeistert' werden bei Repetition übersprungen
  }

  // Prio: Dauerbaustellen (4), üben (4), Festigung (2)
  const ergebnis: Frage[] = [
    ...seededShuffle(dauerBau, s + 'db').slice(0, 4),
    ...seededShuffle(ueben, s + 'ue').slice(0, 4),
    ...seededShuffle(festigung, s + 'fg').slice(0, 2),
  ]

  return seededShuffle(ergebnis, s + 'rep').slice(0, MAX_BLOCK_SIZE)
}

/**
 * Erstellt einen empfohlenen Block basierend auf Mastery-Lücken.
 * Zusammensetzung: 60% üben/neu, 25% Dauerbaustellen, 15% Festigung.
 */
export function erstelleEmpfohlenenBlock(
  alleFragen: Frage[],
  mastery: Record<string, MasteryStufe>,
  dauerbaustellen?: Set<string>,
  seed?: string,
): Frage[] {
  const s = seed || `${Date.now()}`

  // Fragen kategorisieren
  const ueben: Frage[] = []
  const festigung: Frage[] = []
  const dauerBau: Frage[] = []

  for (const f of alleFragen) {
    const m = mastery[f.id] || 'neu'
    if (dauerbaustellen?.has(f.id)) {
      dauerBau.push(f)
    } else if (m === 'neu' || m === 'ueben') {
      ueben.push(f)
    } else if (m === 'gefestigt') {
      festigung.push(f)
    }
    // gemeistert wird nicht empfohlen
  }

  // Kontingente: 6 üben/neu, 2-3 Dauerbaustellen, 1-2 Festigung
  const maxUeben = 6
  const maxDauer = 3
  const maxFest = MAX_BLOCK_SIZE - maxUeben - maxDauer

  const ergebnis: Frage[] = [
    ...seededShuffle(ueben, s).slice(0, maxUeben),
    ...seededShuffle(dauerBau, s + 'db').slice(0, maxDauer),
    ...seededShuffle(festigung, s + 'fg').slice(0, maxFest),
  ]

  return seededShuffle(ergebnis, s + 'mix').slice(0, MAX_BLOCK_SIZE)
}
