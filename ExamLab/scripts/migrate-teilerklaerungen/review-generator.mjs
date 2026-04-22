#!/usr/bin/env node
/**
 * C9 Phase 4 review-generator — MD-Report fuer Stichproben-Review.
 *
 * Liest: fragen-input.jsonl, fragen-updates.jsonl, stichprobe-ids.json
 * Schreibt: stichprobe-review.md (mit alter vs. neuer Musterloesung,
 *           pro-Sub-Element Teilerklaerung, Fach/Bloom/Typ im Header)
 *
 * Usage: node review-generator.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.join(__dirname, 'fragen-input.jsonl')
const UPDATES = path.join(__dirname, 'fragen-updates.jsonl')
const IDS = path.join(__dirname, 'stichprobe-ids.json')
const OUTPUT = path.join(__dirname, 'stichprobe-review.md')

async function loadJSONL(file) {
  const text = await fs.readFile(file, 'utf8')
  return text
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
}

function subArrayFuerTyp(frage) {
  switch (frage.typ) {
    case 'mc':
      return { arr: frage.optionen, feld: 'optionen' }
    case 'richtigfalsch':
      return { arr: frage.aussagen, feld: 'aussagen' }
    case 'lueckentext':
      return { arr: frage.luecken, feld: 'luecken' }
    case 'hotspot':
      return { arr: frage.bereiche, feld: 'bereiche' }
    case 'dragdrop_bild':
      return { arr: frage.zielzonen, feld: 'zielzonen' }
    case 'bildbeschriftung':
      return { arr: frage.beschriftungen, feld: 'beschriftungen' }
    case 'kontenbestimmung':
      return { arr: frage.aufgaben, feld: 'aufgaben' }
    case 'buchungssatz':
      return { arr: frage.buchungen, feld: 'buchungen' }
    case 'bilanzstruktur':
      return { arr: frage.kontenMitSaldi, feld: 'kontenMitSaldi' }
    default:
      return { arr: null, feld: '' }
  }
}

function elementLabel(el, feld, i) {
  if (feld === 'optionen' || feld === 'aussagen') return el.text || '(leer)'
  if (feld === 'kontenMitSaldi') return `${el.kontonummer} ${el.name || ''}`
  if (feld === 'buchungen') return `${el.sollKonto} an ${el.habenKonto} CHF ${el.betrag}`
  if (feld === 'luecken') return el.korrekteAntworten?.[0] || '(leer)'
  if (feld === 'bereiche') return el.label || `Bereich ${i + 1}`
  if (feld === 'zielzonen') return el.korrektesLabel || `Zone ${i + 1}`
  if (feld === 'beschriftungen') return el.korrekt?.[0] || `Stelle ${i + 1}`
  if (feld === 'aufgaben') return el.text || `Aufgabe ${i + 1}`
  return `#${i + 1}`
}

function elementId(el, feld) {
  return feld === 'kontenMitSaldi' ? el.kontonummer : el.id
}

async function main() {
  const [fragen, updates, idsData] = await Promise.all([
    loadJSONL(INPUT),
    loadJSONL(UPDATES),
    fs.readFile(IDS, 'utf8').then(JSON.parse),
  ])
  const fragenById = new Map(fragen.map((f) => [f.id, f]))
  const updatesById = new Map(updates.map((u) => [u.id, u]))
  const stichproben = idsData.ids.map((id) => fragenById.get(id)).filter(Boolean)

  const md = ['# Stichproben-Review (30 Fragen)\n']
  md.push(`Generiert: ${new Date().toISOString()}  `)
  md.push(`Seed: ${idsData.seed}  `)
  md.push(`Stichprobe-Fragen gefunden: ${stichproben.length}/${idsData.ids.length}\n`)
  md.push(`\n---\n\n`)

  for (const frage of stichproben) {
    const update = updatesById.get(frage.id)
    if (!update) {
      md.push(`## [SKIP] ${frage.id} — noch nicht verarbeitet\n\n---\n\n`)
      continue
    }
    const header = `${frage.fachbereich} · ${frage.bloom} · ${frage.typ.toUpperCase()}`
    md.push(`## [${header}] Frage \`${frage.id}\`\n`)
    md.push(`**Fragetext:** ${frage.fragetext}\n\n`)

    const { arr, feld } = subArrayFuerTyp(frage)
    if (arr && arr.length > 0) {
      md.push(`### Sub-Elemente (${feld})\n`)
      for (let i = 0; i < arr.length; i++) {
        const el = arr[i]
        const korrektMarker = el.korrekt === true ? ' ✓' : ''
        md.push(`- ${i + 1}. ${elementLabel(el, feld, i)}${korrektMarker}`)
      }
      md.push('')
    }

    md.push(`### Alte Musterlösung (aus DB)\n`)
    md.push(`> ${(frage.musterlosung || '(leer)').replace(/\n/g, '\n> ')}\n\n`)

    md.push(`### NEUE Musterlösung (Claude Code)\n`)
    md.push(`> ${update.musterlosung.replace(/\n/g, '\n> ')}\n\n`)

    if (update.teilerklaerungen && update.teilerklaerungen.length > 0) {
      md.push(`### NEUE Teilerklärungen (Claude Code)\n`)
      for (const t of update.teilerklaerungen) {
        const idx = arr?.findIndex((el) => elementId(el, feld) === t.id) ?? -1
        const label = idx >= 0 ? elementLabel(arr[idx], feld, idx) : t.id
        md.push(`- **${label}:** ${t.text}`)
      }
      md.push('')
    } else if (arr && arr.length > 0) {
      md.push(`### NEUE Teilerklärungen: _(keine — Fragetyp hat keine Teilerklärungs-Struktur)_\n\n`)
    }

    md.push('---\n\n')
  }

  await fs.writeFile(OUTPUT, md.join('\n'))
  console.log(`[review] ${stichproben.length} Fragen nach ${OUTPUT} geschrieben`)
}

main().catch((e) => {
  console.error('[review] Abbruch:', e.message)
  process.exit(1)
})
