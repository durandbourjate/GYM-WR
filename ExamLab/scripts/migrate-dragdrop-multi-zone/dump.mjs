#!/usr/bin/env node
/**
 * Bundle J Phase 9 — dump
 *
 * Laedt ALLE Fragen aus Apps-Script und schreibt nur die dragdrop_bild-Fragen
 * als JSON (Array) nach fragen.json.
 *
 * Usage:
 *   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   export MIGRATION_EMAIL=admin@gymhofwil.ch
 *   node dump.mjs
 *
 * Nutzt holeAlleFragenFuerMigration (Admin-LP-Email-Auth, kein Token).
 * Node-builtin fetch mit redirect: 'follow' (Apps-Script schickt 302).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL

if (!APPS_SCRIPT_URL) {
  console.error('FEHLER: APPS_SCRIPT_URL env nicht gesetzt')
  process.exit(1)
}
if (!MIGRATION_EMAIL) {
  console.error('FEHLER: MIGRATION_EMAIL env nicht gesetzt (Admin-LP-E-Mail)')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, 'fragen.json')

async function main() {
  console.error(`[dump] POST ${APPS_SCRIPT_URL.slice(0, 60)}... action=holeAlleFragenFuerMigration`)
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'holeAlleFragenFuerMigration',
      email: MIGRATION_EMAIL,
    }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`Apps-Script HTTP ${r.status}`)
  const json = await r.json()
  if (json.error) throw new Error(`Apps-Script: ${json.error}`)
  if (!Array.isArray(json.data)) throw new Error('Response.data ist kein Array')

  const dnd = json.data.filter((f) => f.typ === 'dragdrop_bild')

  // Pro Fachbereich zaehlen + Multi-Zone-Bug-Detektion (Sanity, nicht blockierend)
  const proFach = {}
  let multiZoneBug = 0
  for (const f of dnd) {
    proFach[f.fachbereich] = (proFach[f.fachbereich] || 0) + 1
    const counts = new Map()
    for (const z of (f.zielzonen ?? [])) {
      const k = (z.korrektesLabel ?? '').trim().toLowerCase()
      if (!k) continue
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
    if ([...counts.values()].some((n) => n > 1)) multiZoneBug++
  }

  await fs.writeFile(OUTPUT, JSON.stringify(dnd, null, 2) + '\n')

  console.error(`[dump] Total dragdrop_bild: ${dnd.length}`)
  console.error(`[dump] Pro Fachbereich:`, proFach)
  console.error(`[dump] Multi-Zone-Bug-Verdacht: ${multiZoneBug}`)
  console.error(`[dump] Geschrieben nach ${OUTPUT}`)
}

main().catch((e) => {
  console.error('[dump] Abbruch:', e.message)
  process.exit(1)
})
