#!/usr/bin/env node
/**
 * Lückentext-Migration Phase 7 — Upload-Skript.
 *
 * Schreibt korrekteAntworten + dropdownOptionen pro Lücke via
 * batchUpdateLueckentextMigration ins Sheet. Gruppiert Updates nach
 * fachbereich, sendet einen POST pro Fachbereich. Bei HTTP-Fehler oder
 * resp.error: split in Hälften + retry (analog C9 Phase 4 upload.mjs).
 *
 * Input-Format (JSON-Array oder JSONL, automatisch erkannt):
 *   [
 *     { "id": "...", "fachbereich": "BWL", "luecken": [
 *         { "id": "luecke-0",
 *           "korrekteAntworten": ["Haupt", "Syn1"],
 *           "dropdownOptionen": ["Haupt", "D1", "D2", "D3", "D4"] }
 *     ]},
 *     ...
 *   ]
 *
 * Usage:
 *   export APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 *   export MIGRATION_EMAIL=admin@gymhofwil.ch
 *   node upload.mjs lueckentext-updates.jsonl
 *   node upload.mjs batch-BWL-s1.json --dry-run
 *   node upload.mjs batch-s2.json --fachbereich=VWL
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

const fileArg = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!fileArg) {
  console.error('Usage: node upload.mjs <batch.json|batch.jsonl> [--dry-run] [--fachbereich=VWL]')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.isAbsolute(fileArg) ? fileArg : path.join(__dirname, fileArg)
const LOG = path.join(__dirname, 'upload.log')

async function appendLog(line) {
  await fs.appendFile(LOG, `[${new Date().toISOString()}] ${line}\n`)
}

async function appsScriptCall(fachbereich, updates) {
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'batchUpdateLueckentextMigration',
      email: MIGRATION_EMAIL,
      fachbereich,
      updates,
    }),
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

function leereResult(extras = {}) {
  return {
    success: true,
    aktualisiert: 0,
    nichtGefunden: [],
    keineLuecken: [],
    falscherTyp: [],
    ...extras,
  }
}

async function uploadFachbereich(fachbereich, updates) {
  console.log(`[upload] ${fachbereich}: ${updates.length} Fragen ...`)
  await appendLog(`${fachbereich}: starte mit ${updates.length} Updates`)
  if (DRY_RUN) {
    console.log(`[upload] DRY-RUN: skip Apps-Script-Call`)
    return leereResult({ aktualisiert: updates.length })
  }
  try {
    const res = await appsScriptCall(fachbereich, updates)
    await appendLog(`${fachbereich}: response ${JSON.stringify(res)}`)
    if (res.error) throw new Error(`Apps-Script: ${res.error}`)
    return res
  } catch (e) {
    // Bei Timeout / HTTP-Fehler / Apps-Script-Error: Hälfte versuchen (analog C9).
    const splitable = updates.length > 10
      && (e.message.includes('timeout')
        || e.message.includes('exceeded')
        || e.message.includes('HTTP 5')
        || e.message.includes('HTTP 4')
        || e.message.includes('Apps-Script'))
    if (splitable) {
      console.warn(`[upload] ${fachbereich} Fehler (${e.message}) — split in Hälften`)
      await appendLog(`${fachbereich}: split nach Fehler ${e.message}`)
      const mid = Math.floor(updates.length / 2)
      const r1 = await uploadFachbereich(fachbereich, updates.slice(0, mid))
      const r2 = await uploadFachbereich(fachbereich, updates.slice(mid))
      return {
        success: r1.success && r2.success,
        aktualisiert: (r1.aktualisiert || 0) + (r2.aktualisiert || 0),
        nichtGefunden: [...(r1.nichtGefunden || []), ...(r2.nichtGefunden || [])],
        keineLuecken: [...(r1.keineLuecken || []), ...(r2.keineLuecken || [])],
        falscherTyp: [...(r1.falscherTyp || []), ...(r2.falscherTyp || [])],
      }
    }
    throw e
  }
}

async function main() {
  const text = await fs.readFile(INPUT, 'utf8')
  const items = INPUT.endsWith('.jsonl')
    ? text.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l))
    : JSON.parse(text)
  if (!Array.isArray(items)) {
    throw new Error(`${INPUT}: Input ist kein Array`)
  }
  console.log(`[upload] ${items.length} Einträge in ${INPUT}`)

  // Nach fachbereich gruppieren. Updates ohne fachbereich: skip mit Warnung.
  const proFach = {}
  let ohneFach = 0
  for (const u of items) {
    const fb = u.fachbereich
    if (!fb) {
      ohneFach++
      console.warn('[upload] Update ohne fachbereich, skip:', u.id)
      continue
    }
    if (FACHBEREICH_FILTER && fb !== FACHBEREICH_FILTER) continue
    if (!proFach[fb]) proFach[fb] = []
    proFach[fb].push({ id: u.id, luecken: Array.isArray(u.luecken) ? u.luecken : [] })
  }
  if (ohneFach > 0) console.warn(`[upload] ${ohneFach} Updates ohne fachbereich übersprungen`)

  const summary = {}
  for (const fb of Object.keys(proFach).sort()) {
    summary[fb] = await uploadFachbereich(fb, proFach[fb])
  }

  console.log('\n[upload] === ZUSAMMENFASSUNG ===')
  for (const [fb, r] of Object.entries(summary)) {
    console.log(`  ${fb}: aktualisiert=${r.aktualisiert}`
      + `, nichtGefunden=${r.nichtGefunden?.length || 0}`
      + `, keineLuecken=${r.keineLuecken?.length || 0}`
      + `, falscherTyp=${r.falscherTyp?.length || 0}`)
    const problematisch = [
      ...(r.nichtGefunden || []).map((id) => `NF:${id}`),
      ...(r.keineLuecken || []).map((id) => `NL:${id}`),
      ...(r.falscherTyp || []).map((id) => `FT:${id}`),
    ]
    if (problematisch.length) {
      console.log(
        `    IDs: ${problematisch.slice(0, 10).join(', ')}`
        + `${problematisch.length > 10 ? ` (+${problematisch.length - 10} weitere)` : ''}`,
      )
    }
  }
  await appendLog(`FERTIG: ${JSON.stringify(summary)}`)
}

main().catch((e) => {
  console.error('[upload] Abbruch:', e.message)
  process.exit(1)
})
