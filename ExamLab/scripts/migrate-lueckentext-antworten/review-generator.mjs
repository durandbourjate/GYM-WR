#!/usr/bin/env node
/**
 * Lückentext-Migration Phase 7 — MD-Review-Generator.
 *
 * Liest fragen-dump.json (Input), stichprobe-ids.json (gewählte IDs + Seed) und
 * stichprobe-response.json (Claude-Code-Output mit korrekteAntworten/dropdownOptionen)
 * und baut eine Markdown-Datei, die der LP durchblättert und pro Frage OK/Ablehnen
 * markiert.
 *
 * Schreibt stichprobe-review.md.
 *
 * Usage: node review-generator.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DUMP = path.join(__dirname, 'fragen-dump.json')
const IDS = path.join(__dirname, 'stichprobe-ids.json')
const RESPONSE = path.join(__dirname, 'stichprobe-response.json')
const OUTPUT = path.join(__dirname, 'stichprobe-review.md')

function renderLuecke(inputLuecke, outputLuecke) {
  const lines = []
  lines.push(`### Lücke \`${inputLuecke.id}\``)
  // Zeige sowohl die neue korrekteAntworten[]-Spalte (oft leer in der DB)
  // als auch die Legacy-Felder antwort + alternativen (pool-Fragen).
  const alteKA = Array.isArray(inputLuecke.korrekteAntworten) && inputLuecke.korrekteAntworten.length > 0
    ? inputLuecke.korrekteAntworten.join(' · ')
    : '—'
  const legacyAntworten = []
  if (inputLuecke.antwort) legacyAntworten.push(String(inputLuecke.antwort))
  if (Array.isArray(inputLuecke.alternativen) && inputLuecke.alternativen.length > 0) {
    legacyAntworten.push(...inputLuecke.alternativen.map(String))
  }
  const legacyStr = legacyAntworten.length > 0 ? legacyAntworten.join(' · ') : '—'
  lines.push(`- **Alt (korrekteAntworten · antwort+alternativen):** ${alteKA} · Legacy: ${legacyStr}`)
  const alteDropdowns = Array.isArray(inputLuecke.dropdownOptionen) && inputLuecke.dropdownOptionen.length > 0
    ? inputLuecke.dropdownOptionen.join(' · ')
    : '_(keine)_'
  lines.push(`- **Alt (dropdownOptionen):** ${alteDropdowns}`)
  if (!outputLuecke) {
    lines.push(`- ⚠️ **KEINE Response für diese Lücke**`)
    lines.push('')
    return lines.join('\n')
  }
  const korrekt = Array.isArray(outputLuecke.korrekteAntworten) ? outputLuecke.korrekteAntworten : []
  const dropdown = Array.isArray(outputLuecke.dropdownOptionen) ? outputLuecke.dropdownOptionen : []
  lines.push(`- **NEU (Freitext-Varianten):** ${korrekt.join(' · ') || '_(leer)_'}`)
  lines.push(`- **NEU (Dropdown, 5):** ${dropdown.join(' · ') || '_(leer)_'}`)

  // Sanity-Checks inline
  const hinweise = []
  if (korrekt.length < 1) hinweise.push('⚠️ korrekteAntworten leer')
  if (dropdown.length !== 5) hinweise.push(`⚠️ dropdownOptionen hat ${dropdown.length} Einträge (erwartet: 5)`)
  if (korrekt.length > 0 && dropdown.length > 0 && !dropdown.some((d) => d === korrekt[0])) {
    hinweise.push('⚠️ Hauptantwort fehlt in dropdownOptionen')
  }
  if (dropdown.length !== new Set(dropdown.map((s) => String(s).toLowerCase())).size) {
    hinweise.push('⚠️ Dropdown-Duplikate')
  }
  if (hinweise.length) lines.push(`- ${hinweise.join(' · ')}`)
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const [alleFragen, idsData, response] = await Promise.all([
    fs.readFile(DUMP, 'utf8').then(JSON.parse),
    fs.readFile(IDS, 'utf8').then(JSON.parse),
    fs.readFile(RESPONSE, 'utf8').then(JSON.parse),
  ])

  if (!Array.isArray(alleFragen)) throw new Error('fragen-dump.json ist kein Array')
  if (!Array.isArray(idsData.ids)) throw new Error('stichprobe-ids.json hat kein ids[]')
  if (!Array.isArray(response)) throw new Error('stichprobe-response.json ist kein Array')

  const fragenById = new Map(alleFragen.map((f) => [f.id, f]))
  const responseById = new Map(response.map((r) => [r.id, r]))
  const stichproben = idsData.ids.map((id) => fragenById.get(id)).filter(Boolean)

  const md = ['# Lückentext-Migration — Stichproben-Review\n']
  md.push(`Generiert: ${new Date().toISOString()}  `)
  md.push(`Seed: ${idsData.seed}  `)
  md.push(`Stichprobe: ${stichproben.length}/${idsData.ids.length} Fragen gefunden  `)
  md.push(`Responses: ${response.length}\n`)
  md.push('Freigabe: __________ / __________ (Datum)  ')
  md.push('Wenn mehr als 2 Fragen abgelehnt → Prompt iterieren + Stichprobe neu.\n')
  md.push('\n---\n')

  for (const frage of stichproben) {
    const header = `${frage.fachbereich} · ${frage.bloom || '—'} · ${frage.thema || '—'}`
    md.push(`\n## [${header}] \`${frage.id}\`\n`)
    if (frage.fragetext) md.push(`**Fragetext:** ${frage.fragetext}\n`)
    md.push(`**Text mit Lücken:** ${frage.textMitLuecken || '(leer)'}\n`)

    const output = responseById.get(frage.id)
    if (!output) {
      md.push(`⚠️ **KEINE Response für diese Frage**\n`)
      md.push('**Review:** [ ] OK &nbsp;&nbsp; [ ] Ablehnen — Grund: ___________\n')
      md.push('\n---\n')
      continue
    }

    const outputLueckenById = new Map((output.luecken || []).map((l) => [l.id, l]))
    for (const inputLuecke of frage.luecken || []) {
      md.push(renderLuecke(inputLuecke, outputLueckenById.get(inputLuecke.id)))
    }

    md.push('**Review:** [ ] OK &nbsp;&nbsp; [ ] Ablehnen — Grund: ___________\n')
    md.push('\n---\n')
  }

  await fs.writeFile(OUTPUT, md.join('\n'))
  console.log(`[review] ${stichproben.length} Fragen → ${OUTPUT}`)
}

main().catch((e) => {
  console.error('[review] Abbruch:', e.message)
  process.exit(1)
})
