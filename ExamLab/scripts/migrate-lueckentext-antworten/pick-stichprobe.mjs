#!/usr/bin/env node
/**
 * Lückentext-Migration Phase 7 — Stichprobe ziehen.
 *
 * Liest fragen-dump.json und wählt deterministisch (seed=42) je 5 Fragen
 * aus VWL / BWL / Recht — gibt 15 Fragen in stichprobe.json aus und die
 * gewählten IDs + Seed in stichprobe-ids.json (Review-Generator braucht die IDs).
 *
 * Informatik wird ausgelassen (analog C9 Phase 4).
 *
 * Usage: node pick-stichprobe.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.join(__dirname, 'fragen-dump.json')
const STICHPROBE = path.join(__dirname, 'stichprobe.json')
const IDS = path.join(__dirname, 'stichprobe-ids.json')

const FACHBEREICHE = ['VWL', 'BWL', 'Recht']
const PRO_FACH = 5
const SEED = 42

// Linearer Kongruenzgenerator — reicht für deterministisches Shuffle.
function seededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function shuffle(arr, rand) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function main() {
  const fragen = JSON.parse(await fs.readFile(INPUT, 'utf8'))
  if (!Array.isArray(fragen) || fragen.length === 0) {
    throw new Error(`${INPUT} ist leer oder kein Array`)
  }

  const rand = seededRandom(SEED)
  const stichprobe = []
  const zusammensetzung = {}
  const warnings = []

  for (const fb of FACHBEREICHE) {
    const pool = fragen.filter((f) => f.fachbereich === fb && f.typ === 'lueckentext')
    const shuffled = shuffle(pool, rand)
    const picked = shuffled.slice(0, Math.min(PRO_FACH, pool.length))
    zusammensetzung[fb] = picked.length
    if (picked.length < PRO_FACH) {
      warnings.push(`${fb}: nur ${picked.length} von ${PRO_FACH} Fragen verfügbar`)
    }
    stichprobe.push(...picked)
  }

  const ids = stichprobe.map((f) => f.id)
  await fs.writeFile(STICHPROBE, JSON.stringify(stichprobe, null, 2))
  await fs.writeFile(
    IDS,
    JSON.stringify({ seed: SEED, total: ids.length, zusammensetzung, ids, warnings }, null, 2),
  )

  console.log(`[pick-stichprobe] ${ids.length} Fragen → ${STICHPROBE}`)
  console.log(`[pick-stichprobe] IDs + Seed → ${IDS}`)
  console.log('[pick-stichprobe] Zusammensetzung:', zusammensetzung)
  if (warnings.length) console.log('[pick-stichprobe] Warnings:', warnings)
}

main().catch((e) => {
  console.error('[pick-stichprobe] Abbruch:', e.message)
  process.exit(1)
})
