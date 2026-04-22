#!/usr/bin/env node
/**
 * C9 Phase 4 dump — Laedt ALLE Fragen aus Apps-Script und schreibt sie als JSONL.
 *
 * Usage:
 *   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   export MIGRATION_EMAIL=admin@gymhofwil.ch
 *   node dump.mjs
 *
 * Output: fragen-input.jsonl (eine Frage pro Zeile)
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
  console.error('FEHLER: MIGRATION_EMAIL env nicht gesetzt')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT = path.join(__dirname, 'fragen-input.jsonl')

async function main() {
  console.log(`[dump] Lade Fragen von ${APPS_SCRIPT_URL.slice(0, 60)}...`)
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
  const fragen = json.data || []
  if (!Array.isArray(fragen)) throw new Error('Response data ist kein Array')

  // Pro Fachbereich zaehlen fuer Sanity-Check
  const counts = {}
  for (const f of fragen) {
    counts[f.fachbereich || 'unbekannt'] = (counts[f.fachbereich || 'unbekannt'] || 0) + 1
  }

  // JSONL schreiben
  const lines = fragen.map((f) => JSON.stringify(f)).join('\n') + '\n'
  await fs.writeFile(OUTPUT, lines)

  console.log(`[dump] ${fragen.length} Fragen geschrieben nach ${OUTPUT}`)
  console.log(`[dump] Pro Fachbereich:`, counts)
}

main().catch((e) => {
  console.error('[dump] Abbruch:', e.message)
  process.exit(1)
})
