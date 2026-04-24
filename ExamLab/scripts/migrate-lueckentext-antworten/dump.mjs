#!/usr/bin/env node
/**
 * Lückentext-Migration Phase 7 Dump — Lädt alle Lückentext-Fragen aus der
 * Fragenbank via Apps-Script (bestehender C9-Endpoint `holeAlleFragenFuerMigration`).
 *
 * Schreibt `fragen-dump.json` (JSON-Array, nicht JSONL — Dataset ist klein genug,
 * ~253 Fragen, und der Batch-Prozess paste-t die Datei in Claude Code).
 *
 * Usage:
 *   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   export MIGRATION_EMAIL=admin@gymhofwil.ch
 *   node dump.mjs
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
const OUTPUT = path.join(__dirname, 'fragen-dump.json')

async function postAction(action, payload) {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

async function main() {
  console.log(`[dump] Lade Fragen von ${APPS_SCRIPT_URL.slice(0, 60)}...`)
  const resp = await postAction('holeAlleFragenFuerMigration', { email: MIGRATION_EMAIL })
  if (resp.error) throw new Error(`Apps-Script: ${resp.error}`)

  // `holeAlleFragenFuerMigrationEndpoint` liefert das Array direkt als `data`
  // (kein `data.fragen`-Wrapper — siehe apps-script-code.js ~L11294).
  // Fallback auf `data.fragen` defensiv, falls Backend umgebaut wird.
  const alleFragen = Array.isArray(resp.data)
    ? resp.data
    : Array.isArray(resp.data?.fragen)
      ? resp.data.fragen
      : []
  if (!Array.isArray(alleFragen) || alleFragen.length === 0) {
    throw new Error('Response enthält keine Fragen (erwartet: Array in resp.data)')
  }

  const lueckentextFragen = alleFragen.filter((f) => f.typ === 'lueckentext')

  // Plausibilitäts-Statistik
  const proFach = {}
  for (const f of lueckentextFragen) {
    const fb = f.fachbereich || 'unbekannt'
    proFach[fb] = (proFach[fb] || 0) + 1
  }

  await fs.writeFile(OUTPUT, JSON.stringify(lueckentextFragen, null, 2))

  console.log(`[dump] Total Fragen: ${alleFragen.length}`)
  console.log(`[dump] Lückentext:  ${lueckentextFragen.length} → ${OUTPUT}`)
  console.log(`[dump] Pro Fachbereich:`, proFach)
}

main().catch((e) => {
  console.error('[dump] Abbruch:', e.message)
  process.exit(1)
})
