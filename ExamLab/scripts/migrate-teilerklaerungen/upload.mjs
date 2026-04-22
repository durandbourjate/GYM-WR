#!/usr/bin/env node
/**
 * C9 Phase 4 upload — Schreibt Migration-Updates via Apps-Script-Batch-Endpoint.
 *
 * Liest fragen-updates.jsonl, gruppiert nach fachbereich, ruft pro Fachbereich
 * einmal batchUpdateFragenMigration auf. Bei Apps-Script-Timeout (5 min)
 * oder HTTP-Fehler: split Call in Haelften + retry.
 *
 * Usage:
 *   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   export MIGRATION_EMAIL=admin@gymhofwil.ch
 *   node upload.mjs [--dry-run] [--fachbereich=VWL]
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

const DRY_RUN = process.argv.includes('--dry-run')
const FACHBEREICH_FILTER = (() => {
  const arg = process.argv.find((a) => a.startsWith('--fachbereich='))
  return arg ? arg.split('=')[1] : null
})()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPDATES = path.join(__dirname, 'fragen-updates.jsonl')
const LOG = path.join(__dirname, 'upload.log')

async function appendLog(line) {
  await fs.appendFile(LOG, `[${new Date().toISOString()}] ${line}\n`)
}

async function appsScriptCall(fachbereich, updates) {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'batchUpdateFragenMigration',
      email: MIGRATION_EMAIL,
      fachbereich,
      updates,
    }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

async function uploadFachbereich(fachbereich, updates) {
  console.log(`[upload] ${fachbereich}: ${updates.length} Updates...`)
  await appendLog(`${fachbereich}: starte mit ${updates.length} Updates`)
  if (DRY_RUN) {
    console.log(`[upload] DRY-RUN: skip Apps-Script-Call`)
    return { success: true, aktualisiert: updates.length, nichtGefunden: [] }
  }
  try {
    const res = await appsScriptCall(fachbereich, updates)
    await appendLog(`${fachbereich}: response ${JSON.stringify(res)}`)
    if (res.error) throw new Error(`Apps-Script: ${res.error}`)
    return res
  } catch (e) {
    // Bei Timeout / HTTP-Fehler: Haelfte versuchen
    if (updates.length > 50 && (e.message.includes('timeout') || e.message.includes('exceeded') || e.message.includes('HTTP 5') || e.message.includes('HTTP 4'))) {
      console.warn(`[upload] ${fachbereich} Fehler (${e.message}) — split in Haelften`)
      await appendLog(`${fachbereich}: split nach Fehler ${e.message}`)
      const mid = Math.floor(updates.length / 2)
      const r1 = await uploadFachbereich(fachbereich, updates.slice(0, mid))
      const r2 = await uploadFachbereich(fachbereich, updates.slice(mid))
      return {
        success: r1.success && r2.success,
        aktualisiert: r1.aktualisiert + r2.aktualisiert,
        nichtGefunden: [...(r1.nichtGefunden || []), ...(r2.nichtGefunden || [])],
      }
    }
    throw e
  }
}

async function main() {
  const text = await fs.readFile(UPDATES, 'utf8')
  const alle = text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
  console.log(`[upload] ${alle.length} Updates in ${UPDATES}`)

  // Gruppiere nach fachbereich
  const proFach = {}
  for (const u of alle) {
    const fb = u.fachbereich
    if (FACHBEREICH_FILTER && fb !== FACHBEREICH_FILTER) continue
    if (!proFach[fb]) proFach[fb] = []
    proFach[fb].push({
      id: u.id,
      musterlosung: u.musterlosung,
      teilerklaerungen: u.teilerklaerungen || [],
    })
  }

  const results = {}
  for (const fachbereich of Object.keys(proFach).sort()) {
    results[fachbereich] = await uploadFachbereich(fachbereich, proFach[fachbereich])
  }

  console.log('\n[upload] === ZUSAMMENFASSUNG ===')
  for (const [fb, r] of Object.entries(results)) {
    console.log(`  ${fb}: aktualisiert=${r.aktualisiert}, nichtGefunden=${r.nichtGefunden?.length || 0}`)
    if (r.nichtGefunden?.length) {
      console.log(`    IDs: ${r.nichtGefunden.slice(0, 10).join(', ')}${r.nichtGefunden.length > 10 ? ` (+${r.nichtGefunden.length - 10} weitere)` : ''}`)
    }
  }
  await appendLog(`FERTIG: ${JSON.stringify(results)}`)
}

main().catch((e) => {
  console.error('[upload] Abbruch:', e.message)
  process.exit(1)
})
