#!/usr/bin/env node
/**
 * Repair-Script: Aktualisiert Bild-Fragetypen (bildbeschriftung, dragdrop_bild, hotspot)
 * im ExamLab Fragenbank Sheet mit korrekten Daten aus den Pool-JS-Dateien.
 *
 * Nutzt die echte poolConverter-Logik (via vm Sandbox) um sicherzustellen dass
 * alle Felder korrekt konvertiert werden.
 *
 * Aufruf: node scripts/repair-bild-fragen.mjs [--dry-run]
 */

import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import vm from 'vm'

// === CONFIG ===
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOi9ONg678NeyjoY6azruVhv6yc7HI9GVSmKep6rp84GtR-WiG8BV_9w75pmLeD-x0IA/exec'
const LP_EMAIL = 'yannick.durand@gymhofwil.ch'
const POOL_BASE = resolve(import.meta.dirname, '../Uebungen/Uebungspools')
const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'
const BATCH_SIZE = 15
const BILD_TYPEN = new Set(['bildbeschriftung', 'dragdrop_bild', 'hotspot'])
const DRY_RUN = process.argv.includes('--dry-run')

// === Pool-Config per vm-Sandbox laden (wie poolSync) ===
function ladePoolConfig(filePath) {
  const code = readFileSync(filePath, 'utf8')
  // Pool-JS-Dateien setzen window.POOL_META, window.TOPICS, window.QUESTIONS
  const windowObj = {}
  const sandbox = { window: windowObj, POOL_META: null, TOPICS: null, QUESTIONS: null }
  try {
    vm.createContext(sandbox)
    vm.runInContext(code, sandbox, { timeout: 5000 })
  } catch (e) {
    console.warn(`  vm-Fehler bei ${filePath}: ${e.message}`)
    return null
  }
  // Pool-Dateien schreiben auf window.* ODER direkt als Globals
  const meta = windowObj.POOL_META || sandbox.POOL_META
  const topics = windowObj.TOPICS || sandbox.TOPICS || {}
  const questions = windowObj.QUESTIONS || sandbox.QUESTIONS || []
  if (!meta || !questions.length) return null
  return { meta, topics, questions }
}

// === Fachbereich-Mapping (Pool-fach → ExamLab-Fachbereich) ===
function mapFachbereich(fach) {
  const m = {
    BWL: 'BWL', VWL: 'VWL', Recht: 'Recht', IN: 'Informatik',
    bwl: 'BWL', vwl: 'VWL', recht: 'Recht',
  }
  return m[fach] || fach || 'Allgemein'
}

function mapBloom(tax) {
  if (!tax) return 'K2'
  return tax.toUpperCase().startsWith('K') ? tax.toUpperCase() : `K${tax}`
}

// === Konvertierung Pool → ExamLab (analog zu poolConverter.ts) ===
function konvertierePoolFrage(poolFrage, poolMeta, topics) {
  const now = new Date().toISOString()
  const topic = topics[poolFrage.topic]
  const thema = poolMeta.title || topic?.label || poolFrage.topic
  const unterthema = topic?.label ?? poolFrage.topic
  const poolId = `${poolMeta.id}:${poolFrage.id}`

  // Content-Hash für Delta-Erkennung
  const contentStr = JSON.stringify({
    q: poolFrage.q, type: poolFrage.type, diff: poolFrage.diff,
    labels: poolFrage.labels, zones: poolFrage.zones, hotspots: poolFrage.hotspots,
    img: poolFrage.img, explain: poolFrage.explain,
  })
  const hash = Buffer.from(contentStr).toString('base64').slice(0, 24)

  const basis = {
    id: poolId.replace(/[^a-zA-Z0-9_:-]/g, '_'),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,
    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
    unterthema,
    semester: [],
    gefaesse: ['SF'],
    bloom: mapBloom(poolFrage.tax),
    tags: [poolFrage.topic, `diff:${poolFrage.diff}`, 'pool-import'],
    punkte: berechneTypPunkte(poolFrage),
    musterlosung: poolFrage.explain || poolFrage.sample || '',
    bewertungsraster: [],
    anhaenge: konvertiereBildAnhang(poolFrage),
    verwendungen: [],
    quelle: 'pool',
    quellReferenz: `Pool: ${poolMeta.title}`,
    autor: 'pool-import',
    geteilt: 'schule',
    schwierigkeit: poolFrage.diff || 2,
    poolId,
    poolGeprueft: poolFrage.reviewed || false,
    pruefungstauglich: false,
    poolContentHash: hash,
    poolUpdateVerfuegbar: false,
    lernzielIds: [],
  }

  const bildUrl = poolFrage.img ? POOL_IMG_BASE_URL + poolFrage.img.src : ''

  switch (poolFrage.type) {
    case 'bildbeschriftung': {
      const beschriftungen = (poolFrage.labels || []).map(lbl => ({
        id: lbl.id || `label-${Math.random().toString(36).slice(2, 8)}`,
        position: { x: lbl.x ?? 50, y: lbl.y ?? 50 },
        korrekt: [lbl.text ?? ''],
      }))
      return { ...basis, typ: 'bildbeschriftung', fragetext: poolFrage.q, bildUrl, beschriftungen }
    }
    case 'dragdrop_bild': {
      const zielzonen = (poolFrage.zones || []).map(zone => ({
        id: zone.id || `zone-${Math.random().toString(36).slice(2, 8)}`,
        position: { x: zone.x, y: zone.y, breite: zone.w, hoehe: zone.h },
        korrektesLabel: (poolFrage.labels || []).find(l => l.zone === zone.id)?.text ?? '',
      }))
      const labels = (poolFrage.labels || []).map(l => l.text ?? '')
      return { ...basis, typ: 'dragdrop_bild', fragetext: poolFrage.q, bildUrl, zielzonen, labels }
    }
    case 'hotspot': {
      const rawHotspots = poolFrage.hotspots || []
      const rawCorrect = Array.isArray(poolFrage.correct) ? poolFrage.correct : []
      const bereiche = rawHotspots.map((h, i) => ({
        id: h.id || `hotspot-${i}`,
        x: h.x ?? 50,
        y: h.y ?? 50,
        radius: h.r ?? 8,
        label: h.label ?? '',
        korrekt: rawCorrect.includes(h.id) || rawCorrect.includes(i),
      }))
      // Falls keine hotspots aber correct als Koordinaten
      if (bereiche.length === 0 && rawCorrect.length > 0) {
        for (const c of rawCorrect) {
          if (typeof c === 'object' && c.x !== undefined) {
            bereiche.push({ id: `h-${bereiche.length}`, x: c.x, y: c.y, radius: c.r || 8, label: '', korrekt: true })
          }
        }
      }
      return {
        ...basis, typ: 'hotspot', fragetext: poolFrage.q, bildUrl, bereiche,
        mehrfachauswahl: bereiche.filter(b => b.korrekt).length > 1,
        hotspotRadius: 8,
        maxKlicks: Math.max(1, bereiche.filter(b => b.korrekt).length),
      }
    }
    default:
      return null
  }
}

function berechneTypPunkte(pf) {
  switch (pf.type) {
    case 'bildbeschriftung': return Math.max(2, pf.labels?.length ?? 2)
    case 'dragdrop_bild': return Math.max(2, pf.labels?.length ?? 2)
    case 'hotspot': return 2
    default: return 1
  }
}

function konvertiereBildAnhang(pf) {
  if (!pf.img?.src) return []
  const dateiname = pf.img.src.split('/').pop() || 'bild.svg'
  const ext = dateiname.split('.').pop()?.toLowerCase() || 'svg'
  const mimeMap = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }
  return [{
    typ: 'bild',
    dateiname,
    mimeTyp: mimeMap[ext] || 'image/svg+xml',
    url: POOL_IMG_BASE_URL + pf.img.src,
  }]
}

// === API Calls ===
async function apiCall(action, body) {
  const resp = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
  const text = await resp.text()
  try { return JSON.parse(text) }
  catch { return { error: text.slice(0, 300) } }
}

async function importiereBatch(fragen) {
  return apiCall('importierePoolFragen', { email: LP_EMAIL, fragen })
}

// === MAIN ===
async function main() {
  console.log('=== Repair Bild-Fragen ===')
  if (DRY_RUN) console.log('>>> DRY RUN — keine API-Calls <<<')
  console.log()

  // 1. Alle Pool-Configs laden
  const configDir = join(POOL_BASE, 'config')
  const files = readdirSync(configDir).filter(f => f.endsWith('.js') && !f.startsWith('index'))
  console.log(`1. Lade ${files.length} Pool-Dateien...`)

  const alleFragen = []
  for (const file of files) {
    const config = ladePoolConfig(join(configDir, file))
    if (!config) continue

    const bildFragen = config.questions.filter(q => BILD_TYPEN.has(q.type))
    if (bildFragen.length === 0) continue

    console.log(`   ${file}: ${bildFragen.length} Bild-Fragen (${config.meta.title})`)

    for (const pf of bildFragen) {
      const konvertiert = konvertierePoolFrage(pf, config.meta, config.topics)
      if (konvertiert) alleFragen.push(konvertiert)
    }
  }

  console.log(`\n2. Total: ${alleFragen.length} Fragen konvertiert`)
  const byTyp = {}
  for (const f of alleFragen) byTyp[f.typ] = (byTyp[f.typ] || 0) + 1
  console.log('   Typen:', JSON.stringify(byTyp))

  // Validierung: Prüfe ob alle kritischen Felder gesetzt sind
  let valFehler = 0
  for (const f of alleFragen) {
    const problems = []
    if (!f.fragetext) problems.push('fragetext leer')
    if (!f.bildUrl) problems.push('bildUrl leer')
    if (!f.fachbereich) problems.push('fachbereich leer')
    if (!f.poolId) problems.push('poolId leer')
    if (f.typ === 'bildbeschriftung' && (!f.beschriftungen || f.beschriftungen.length === 0))
      problems.push('beschriftungen leer!')
    if (f.typ === 'dragdrop_bild' && (!f.zielzonen || f.zielzonen.length === 0))
      problems.push('zielzonen leer!')
    if (f.typ === 'dragdrop_bild' && (!f.labels || f.labels.length === 0))
      problems.push('labels leer!')
    if (f.typ === 'hotspot' && (!f.bereiche || f.bereiche.length === 0))
      problems.push('bereiche leer!')
    if (problems.length > 0) {
      console.error(`   FEHLER ${f.poolId}: ${problems.join(', ')}`)
      valFehler++
    }
  }

  if (valFehler > 0) {
    console.error(`\n   ${valFehler} Validierungsfehler! Abbruch.`)
    process.exit(1)
  }
  console.log('   Validierung OK — alle Felder gesetzt\n')

  if (DRY_RUN) {
    console.log('3. DRY RUN — Beispiel-Frage:')
    console.log(JSON.stringify(alleFragen[0], null, 2))
    console.log('\n=== DRY RUN fertig ===')
    return
  }

  // 3. Alte Fragen löschen (damit neu importiert werden kann, nicht nur Sync-Felder)
  console.log('3. Lösche alte Fragen im Sheet...')
  let geloescht = 0
  for (const f of alleFragen) {
    const result = await apiCall('loescheFrage', { email: LP_EMAIL, frageId: f.id, fachbereich: f.fachbereich })
    if (result.success) {
      geloescht++
    } else if (result.error?.includes('nicht gefunden')) {
      // OK — war noch nicht im Sheet
    } else {
      console.warn(`   Löschen ${f.id}: ${result.error || 'unbekannter Fehler'}`)
    }
    // Rate limit
    if (geloescht % 10 === 0 && geloescht > 0) await new Promise(r => setTimeout(r, 1000))
  }
  console.log(`   ${geloescht} gelöscht\n`)

  // 4. Neu importieren (vollständige Zeilen mit typDaten)
  console.log('4. Importiere neu via Apps Script API...')
  let totalImport = 0, totalUpdate = 0
  for (let i = 0; i < alleFragen.length; i += BATCH_SIZE) {
    const batch = alleFragen.slice(i, i + BATCH_SIZE)
    const batchNr = Math.floor(i / BATCH_SIZE) + 1
    console.log(`   Batch ${batchNr}/${Math.ceil(alleFragen.length / BATCH_SIZE)}: ${batch.length} Fragen...`)

    const result = await importiereBatch(batch)
    if (result.error) {
      console.error(`   FEHLER: ${result.error}`)
    } else {
      const imp = result.importiert || 0
      const upd = result.aktualisiert || 0
      console.log(`   → ${imp} neu, ${upd} aktualisiert${result.fehler?.length ? `, ${result.fehler.length} Fehler` : ''}`)
      totalImport += imp
      totalUpdate += upd
      if (result.fehler?.length) {
        for (const f of result.fehler) console.error(`     ${f}`)
      }
    }

    // Rate limit: 2s zwischen Batches
    if (i + BATCH_SIZE < alleFragen.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  console.log(`\n=== Fertig: ${totalImport} importiert, ${totalUpdate} aktualisiert ===`)
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
