#!/usr/bin/env node
/**
 * Pool-Konverter: Wandelt alle Übungspool-JS-Dateien ins Lernplattform-Format.
 *
 * Verwendung: node Lernplattform/scripts/convertPools.mjs
 *
 * Output: Lernplattform/scripts/output/
 *   - {poolId}.json pro Pool
 *   - alle-fragen.json (kombiniert)
 *   - statistik.json (Zusammenfassung)
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { join, basename } from 'path'
import vm from 'vm'

// ── Pfade ──

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const POOLS_DIR = join(REPO_ROOT, 'Uebungen', 'Uebungspools', 'config')
const OUTPUT_DIR = join(import.meta.dirname, 'output')

mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Pool-Datei lesen und parsen ──

function parsePoolFile(filePath) {
  let code = readFileSync(filePath, 'utf-8')

  // Fix: Fehlende Kommas zwischen Array-Elementen nach Kommentaren
  // Pattern: "}\n\n// comment\n\n  {" → "},\n\n// comment\n\n  {"
  code = code.replace(/\}(\s*\/\/[^\n]*\s*)\{/g, '},$1{')
  // Auch ohne Kommentar: "}\n\n\n  {" (innerhalb von Arrays)
  code = code.replace(/\}(\s{2,})\{/g, '},$1{')

  const sandbox = { window: {} }
  vm.createContext(sandbox)
  vm.runInContext(code, sandbox)
  return {
    meta: sandbox.window.POOL_META,
    topics: sandbox.window.TOPICS,
    questions: sandbox.window.QUESTIONS
  }
}

// ── Option-Value zu Text auflösen ──

function optionValueToText(options, value) {
  if (!options || !value) return value
  const opt = options.find(o => o.v === value)
  return opt ? opt.t : value
}

// ── Einzelne Frage konvertieren ──

function convertQuestion(q, poolMeta, topics) {
  const poolId = poolMeta.id
  const topicData = topics[q.topic]
  const themaLabel = topicData?.label || topicData?.short || q.topic

  // Basis-Felder (alle Typen)
  const base = {
    id: `${poolId}-${q.id}`,
    fach: poolMeta.fach,
    thema: themaLabel,
    typ: q.type,
    schwierigkeit: q.diff || 1,
    taxonomie: q.tax,
    frage: q.q,
    erklaerung: q.explain || undefined,
    uebung: true,
    pruefungstauglich: false,
    tags: q.tags || undefined,
    stufe: poolMeta.level || poolMeta.meta || undefined,
  }

  // Bild
  if (q.img) {
    base.bild = {
      src: `/pool-bilder/${q.img.src.replace(/^img\//, '')}`,
      alt: q.img.alt
    }
  }

  // Kontext (für Gruppe und Fragen mit context)
  if (q.context) {
    base.kontext = q.context
  }

  // Typ-spezifische Felder
  switch (q.type) {
    case 'mc':
      base.optionen = q.options.map(o => o.t)
      base.korrekt = optionValueToText(q.options, q.correct)
      break

    case 'multi':
      base.optionen = q.options.map(o => o.t)
      base.korrekt = (q.correct || []).map(v => optionValueToText(q.options, v))
      break

    case 'tf':
      base.aussagen = (q.aussagen || []).map(a => ({
        text: a.text,
        korrekt: a.korrekt
      }))
      break

    case 'fill':
      base.luecken = (q.blanks || []).map((b, i) => ({
        id: String(i),
        korrekt: b.answer,
        optionen: b.alts || undefined
      }))
      break

    case 'calc':
      if (q.rows) {
        // Pool-Format mit rows (z.B. FiBu-Berechnungen)
        base.calcZeilen = q.rows.map(r => ({
          label: r.label,
          answer: r.answer,
          tolerance: r.tolerance ?? 0,
          unit: r.unit || undefined
        }))
        // Für einfache Korrektur: erstes Row als korrekt
        base.korrekt = String(q.rows[0].answer)
        base.toleranz = q.rows[0].tolerance ?? 0
        base.einheit = q.rows[0].unit || undefined
      } else {
        base.korrekt = String(q.correct)
        base.toleranz = q.tolerance ?? 0
        base.einheit = q.unit || undefined
      }
      break

    case 'sort':
      base.kategorien = q.kategorien || q.categories
      base.elemente = (q.elemente || q.items || []).map(e => ({
        text: e.text,
        kategorie: e.kategorie || e.category
      }))
      break

    case 'sortierung':
      base.reihenfolge = q.reihenfolge || q.correct || []
      break

    case 'zuordnung':
      base.paare = (q.paare || []).map(p => ({
        links: p.links,
        rechts: p.rechts
      }))
      break

    // ── FiBu-Typen ──

    case 'buchungssatz':
      base.konten = (q.konten || []).map(k => ({
        nr: k.nr,
        name: k.name,
        kategorie: k.kategorie || undefined
      }))
      base.buchungssatzKorrekt = (q.correct || []).map(z => ({
        soll: z.soll,
        haben: z.haben,
        betrag: z.betrag
      }))
      break

    case 'tkonto':
      base.geschaeftsfaelle = q.geschaeftsfaelle || []
      base.tkontoKonten = (q.konten || []).map(k => ({
        nr: k.nr,
        name: k.name,
        ab: k.ab || undefined,
        correctSoll: k.correctSoll || [],
        correctHaben: k.correctHaben || [],
        correctSaldo: k.correctSaldo
      }))
      base.gegenkonten = (q.gegenkonten || []).map(k => ({
        nr: k.nr,
        name: k.name
      }))
      break

    case 'bilanz':
      base.bilanzModus = q.modus || 'bilanz'
      base.kontenMitSaldi = (q.kontenMitSaldi || []).map(k => ({
        nr: k.nr,
        name: k.name,
        saldo: k.saldo
      }))
      base.bilanzKorrekt = q.correct ? {
        aktiven: q.correct.aktiven || q.correct.aufwand || [],
        passiven: q.correct.passiven || q.correct.ertrag || [],
        bilanzsumme: q.correct.bilanzsumme || q.correct.total || 0
      } : undefined
      break

    case 'kontenbestimmung':
      base.konten = (q.konten || []).map(k => ({
        nr: k.nr,
        name: k.name,
        kategorie: k.kategorie || undefined
      }))
      base.aufgaben = (q.aufgaben || []).map(a => ({
        text: a.text,
        correct: a.correct
      }))
      break

    // ── Bild-interaktive Typen ──

    case 'hotspot':
      base.hotspots = q.hotspots || []
      base.korrekt = q.correct || []  // Indices der korrekten Hotspots
      break

    case 'bildbeschriftung':
      base.labels = (q.labels || []).map(l => ({
        id: l.id,
        text: l.text,
        x: l.x,
        y: l.y
      }))
      break

    case 'dragdrop_bild':
      base.zones = (q.zones || []).map(z => ({
        id: z.id,
        x: z.x,
        y: z.y,
        w: z.w,
        h: z.h
      }))
      base.dragLabels = (q.labels || []).map(l => ({
        id: l.id,
        text: l.text,
        zone: l.zone
      }))
      break

    // ── Weitere Typen ──

    case 'open':
      base.musterantwort = q.sample || undefined
      break

    case 'formel':
      base.korrekt = q.correct || ''
      base.hinweise = q.hints || undefined
      break

    case 'zeichnen':
      base.hinweise = q.hints || undefined
      if (q.sample) {
        base.musterbild = {
          src: typeof q.sample === 'string' ? q.sample : `/pool-bilder/${q.sample.src.replace(/^img\//, '')}`,
          alt: typeof q.sample === 'string' ? 'Musterlösung' : q.sample.alt
        }
      }
      break

    case 'gruppe':
      base.teil = (q.teil || []).map(t => convertGruppeTeil(t, poolMeta, topics))
      break

    case 'pdf':
      base.pdfUrl = q.pdfUrl ? `/pool-bilder/${q.pdfUrl.replace(/^img\//, '')}` : undefined
      base.antwortTyp = q.antwortTyp || 'freitext'
      base.musterantwort = q.sample || undefined
      base.hinweise = q.hints || undefined
      break

    default:
      console.warn(`  ⚠ Unbekannter Typ: ${q.type} (Frage ${q.id})`)
  }

  // Undefinierte Werte entfernen
  return Object.fromEntries(
    Object.entries(base).filter(([, v]) => v !== undefined)
  )
}

// ── Gruppe-Teil konvertieren (rekursiv, aber nicht tief) ──

function convertGruppeTeil(teil, poolMeta, topics) {
  const result = {
    sub: teil.sub,
    type: teil.type,
    q: teil.q,
    explain: teil.explain || undefined,
  }

  // Typ-spezifische Felder des Teils
  switch (teil.type) {
    case 'mc':
    case 'multi':
      result.options = teil.options
      result.correct = teil.correct
      break
    case 'tf':
      result.aussagen = teil.aussagen
      break
    case 'fill':
      result.blanks = teil.blanks
      break
    case 'calc':
      result.rows = teil.rows
      result.correct = teil.correct
      break
    case 'buchungssatz':
      result.konten = teil.konten
      result.correct = teil.correct
      break
    case 'sortierung':
      result.correct = teil.correct || teil.reihenfolge
      break
    default:
      // Alle restlichen Felder kopieren
      if (teil.konten) result.konten = teil.konten
      if (teil.correct) result.correct = teil.correct
  }

  return Object.fromEntries(
    Object.entries(result).filter(([, v]) => v !== undefined)
  )
}

// ── Hauptprozess ──

console.log('Pool-Konverter gestartet\n')

const poolFiles = readdirSync(POOLS_DIR).filter(f => f.endsWith('.js')).sort()
console.log(`${poolFiles.length} Pool-Dateien gefunden\n`)

const alleFragen = []
const statistik = {
  pools: [],
  total: 0,
  typen: {},
  faecher: {}
}

for (const file of poolFiles) {
  const filePath = join(POOLS_DIR, file)
  const poolId = basename(file, '.js')

  try {
    const { meta, topics, questions } = parsePoolFile(filePath)

    if (!meta || !questions) {
      console.warn(`⚠ ${file}: Keine META oder QUESTIONS gefunden — übersprungen`)
      continue
    }

    const konvertiert = questions.map(q => convertQuestion(q, meta, topics || {}))

    // Pool-JSON speichern
    writeFileSync(
      join(OUTPUT_DIR, `${poolId}.json`),
      JSON.stringify(konvertiert, null, 2),
      'utf-8'
    )

    alleFragen.push(...konvertiert)

    // Statistik
    const typenCount = {}
    for (const f of konvertiert) {
      typenCount[f.typ] = (typenCount[f.typ] || 0) + 1
      statistik.typen[f.typ] = (statistik.typen[f.typ] || 0) + 1
      statistik.faecher[f.fach] = (statistik.faecher[f.fach] || 0) + 1
    }

    statistik.pools.push({
      id: poolId,
      fach: meta.fach,
      titel: meta.title,
      fragen: konvertiert.length,
      typen: typenCount
    })

    console.log(`✓ ${poolId}: ${konvertiert.length} Fragen (${meta.fach})`)

  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`)
  }
}

statistik.total = alleFragen.length

// Kombinierte Datei
writeFileSync(
  join(OUTPUT_DIR, 'alle-fragen.json'),
  JSON.stringify(alleFragen, null, 2),
  'utf-8'
)

// Statistik
writeFileSync(
  join(OUTPUT_DIR, 'statistik.json'),
  JSON.stringify(statistik, null, 2),
  'utf-8'
)

console.log(`\n══════════════════════════════════`)
console.log(`Total: ${statistik.total} Fragen aus ${statistik.pools.length} Pools`)
console.log(`\nTypen:`)
for (const [typ, count] of Object.entries(statistik.typen).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${typ}: ${count}`)
}
console.log(`\nFächer:`)
for (const [fach, count] of Object.entries(statistik.faecher).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${fach}: ${count}`)
}
console.log(`\nOutput: ${OUTPUT_DIR}`)
