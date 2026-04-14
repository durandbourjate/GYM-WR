#!/usr/bin/env node
/**
 * Import: Pool-Fragen mit Spezialtypen (sortierung, hotspot, bildbeschriftung, dragdrop_bild,
 * formel, code, zeichnen, gruppe, bilanz, buchungssatz, tkonto, kontenbestimmung, pdf)
 * in die Fragenbank nachimportieren.
 *
 * Liest Pool-JS-Dateien, extrahiert Spezialtyp-Fragen, konvertiert sie ins ExamLab-Format,
 * und sendet sie via speichereFrage API ans Backend.
 *
 * Usage: node scripts/import-spezialtypen.mjs [--dry-run]
 */

import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOi9ONg678NeyjoY6azruVhv6yc7HI9GVSmKep6rp84GtR-WiG8BV_9w75pmLeD-x0IA/exec'
const EMAIL = 'yannick.durand@gymhofwil.ch'
const POOL_DIR = join(import.meta.dirname, '../Uebungen/Uebungspools/config')
const POOL_IMG_BASE = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'
const DRY_RUN = process.argv.includes('--dry-run')

// Standard-Typen (bereits importiert) — nur Spezialtypen nachimportieren
const STANDARD_TYPEN = new Set(['mc', 'multi', 'tf', 'fill', 'calc', 'sort', 'open'])

// Fachbereich-Mapping
function mapFachbereich(fach) {
  const f = (fach || '').toLowerCase().trim()
  if (f.includes('vwl') || f.includes('volkswirt')) return 'VWL'
  if (f.includes('bwl') || f.includes('betriebswirt')) return 'BWL'
  if (f.includes('recht')) return 'Recht'
  if (f === 'in' || f === 'informatik') return 'Informatik'
  return 'Allgemein'
}

// Bloom-Mapping
function mapBloom(tax) {
  const t = (tax || 'K2').trim().toUpperCase()
  if (t.startsWith('K')) return t.substring(0, 2)
  return 'K2'
}

// UUID
function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Punkte berechnen
function berechnePunkte(pf) {
  switch (pf.type) {
    case 'sortierung': return Math.max(2, (pf.items?.length ?? 3))
    case 'formel': return 2
    case 'hotspot': return pf.hotspots?.length ?? 1
    case 'bildbeschriftung': return pf.labels?.length ?? 2
    case 'dragdrop_bild': return pf.labels?.length ?? 2
    case 'code': return 4
    case 'zeichnen': return 3
    case 'pdf': return 3
    case 'buchungssatz': return (pf.buchungen?.length ?? 1) * 2
    case 'tkonto': return (pf.geschaeftsfaelle?.length ?? 1) * 2
    case 'kontenbestimmung': return (pf.aufgaben?.length ?? 1) * 2
    case 'bilanz': return 4
    case 'gruppe': return (pf.sub?.length ?? 1) * 2
    default: return 1
  }
}

// Pool-Bild konvertieren
function konvertiereBild(img, poolId) {
  if (!img) return null
  const src = img.src?.startsWith('http') ? img.src : `${POOL_IMG_BASE}${poolId.replace(/_/g, '/')}/${img.src || img}`
  return {
    id: genId(),
    dateiname: basename(typeof img === 'string' ? img : img.src || ''),
    mimeType: 'image/svg+xml',
    groesseBytes: 0,
    driveFileId: '',
    externeUrl: src,
    beschreibung: img.alt || '',
  }
}

// Konvertiere eine Pool-Frage mit Spezialtyp ins ExamLab-Format
function konvertiereFrage(poolFrage, poolMeta, topics) {
  const now = new Date().toISOString()
  const topic = topics[poolFrage.topic] || {}
  const thema = poolMeta.title || topic.label || poolFrage.topic
  const unterthema = topic.label ?? poolFrage.topic

  const basis = {
    id: genId(),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,
    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
    unterthema,
    semester: [],
    gefaesse: [],
    bloom: mapBloom(poolFrage.tax),
    tags: [poolFrage.topic, `diff:${poolFrage.diff}`],
    punkte: berechnePunkte(poolFrage),
    musterlosung: poolFrage.explain ?? poolFrage.sample ?? '',
    bewertungsraster: [],
    schwierigkeit: poolFrage.diff ?? 2,
    verwendungen: [],
    quelle: 'pool',
    quellReferenz: `Pool: ${poolMeta.title}`,
    autor: 'pool-import',
    geteilt: 'schule',
    poolId: `${poolMeta.id}:${poolFrage.id}`,
    poolGeprueft: poolFrage.reviewed ?? false,
    pruefungstauglich: false,
    poolContentHash: '',
    poolUpdateVerfuegbar: false,
    lernzielIds: [],
  }

  // Bild als Anhang
  if (poolFrage.img) {
    basis.anhaenge = [konvertiereBild(poolFrage.img, poolMeta.id)]
  }

  switch (poolFrage.type) {
    case 'sortierung': {
      const elemente = (poolFrage.items ?? []).map(item =>
        typeof item === 'string' ? item : item.t
      )
      return { ...basis, typ: 'sortierung', fragetext: poolFrage.q, elemente, teilpunkte: true }
    }
    case 'formel':
      return { ...basis, typ: 'formel', fragetext: poolFrage.q,
        korrekteFormel: (typeof poolFrage.correct === 'string' ? poolFrage.correct : '') || '',
        vergleichsModus: 'exakt' }
    case 'hotspot': {
      const bereiche = (poolFrage.hotspots ?? []).map((hs, idx) => ({
        id: `hs-${idx}`, x: hs.x ?? 0, y: hs.y ?? 0, radius: hs.r ?? 5, label: hs.label ?? ''
      }))
      return { ...basis, typ: 'hotspot', fragetext: poolFrage.q,
        bildUrl: poolFrage.img?.src ? `${POOL_IMG_BASE}${poolFrage.img.src}` : '',
        bereiche, korrekteHotspots: poolFrage.correct ?? [] }
    }
    case 'bildbeschriftung': {
      const labels = (poolFrage.labels ?? []).map((l, idx) => ({
        id: `lbl-${idx}`, text: l.text ?? l, x: l.x ?? 0, y: l.y ?? 0
      }))
      return { ...basis, typ: 'bildbeschriftung', fragetext: poolFrage.q,
        bildUrl: poolFrage.img?.src ? `${POOL_IMG_BASE}${poolFrage.img.src}` : '',
        labels }
    }
    case 'dragdrop_bild': {
      const labels = (poolFrage.labels ?? []).map((l, idx) => ({
        id: `dd-${idx}`, text: l.text ?? l, zone: l.zone ?? idx
      }))
      const zonen = (poolFrage.zones ?? []).map((z, idx) => ({
        id: `zone-${idx}`, label: z.label ?? z, x: z.x ?? 0, y: z.y ?? 0, breite: z.w ?? 100, hoehe: z.h ?? 40
      }))
      return { ...basis, typ: 'dragdrop_bild', fragetext: poolFrage.q,
        bildUrl: poolFrage.img?.src ? `${POOL_IMG_BASE}${poolFrage.img.src}` : '',
        labels, zonen }
    }
    case 'code':
      return { ...basis, typ: 'code', fragetext: poolFrage.q,
        sprache: poolFrage.sprache ?? 'python',
        starterCode: poolFrage.starterCode, musterLoesung: poolFrage.sample }
    case 'zeichnen':
      return { ...basis, typ: 'visualisierung', fragetext: poolFrage.q, untertyp: 'zeichnen',
        breite: 800, hoehe: 400, werkzeuge: ['stift', 'linie', 'text', 'radierer'] }
    case 'pdf':
      return { ...basis, typ: 'pdf', fragetext: poolFrage.q,
        pdfDriveFileId: '', pdfUrl: '', pdfDateiname: '', seitenAnzahl: 0,
        erlaubteWerkzeuge: ['highlighter', 'kommentar', 'freihand'] }
    case 'buchungssatz':
      return { ...basis, typ: 'buchungssatz', geschaeftsfall: poolFrage.q,
        buchungen: poolFrage.buchungen ?? [], kontenauswahl: poolFrage.kontenauswahl ?? { modus: 'voll' } }
    case 'tkonto':
      return { ...basis, typ: 'tkonto', aufgabentext: poolFrage.q,
        geschaeftsfaelle: poolFrage.geschaeftsfaelle ?? [], konten: poolFrage.konten ?? [],
        kontenauswahl: poolFrage.kontenauswahl ?? { modus: 'voll' } }
    case 'kontenbestimmung':
      return { ...basis, typ: 'kontenbestimmung', aufgabentext: poolFrage.q,
        modus: poolFrage.modus ?? 'gemischt', aufgaben: poolFrage.aufgaben ?? [],
        kontenauswahl: poolFrage.kontenauswahl ?? { modus: 'voll' } }
    case 'bilanz':
      return { ...basis, typ: 'bilanzstruktur', aufgabentext: poolFrage.q,
        modus: poolFrage.modus ?? 'bilanz', kontenMitSaldi: poolFrage.kontenMitSaldi ?? [],
        loesung: poolFrage.loesung ?? {} }
    case 'gruppe': {
      // Gruppe: Teilaufgaben inline speichern
      const teilaufgabenIds = (poolFrage.sub ?? []).map(() => genId())
      return { ...basis, typ: 'aufgabengruppe', kontext: poolFrage.q,
        teilaufgabenIds, kontextAnhaenge: [] }
    }
    default:
      console.warn(`  Unbekannter Typ: ${poolFrage.type} — übersprungen`)
      return null
  }
}

// Pool-JS-Datei parsen (window.X = ... extrahieren)
function parsePoolFile(filePath) {
  const code = readFileSync(filePath, 'utf-8')

  // Simuliere window-Objekt und evaluiere den Code
  try {
    const window = {}
    const fn = new Function('window', code + '\nreturn { POOL_META: window.POOL_META, TOPICS: window.TOPICS, QUESTIONS: window.QUESTIONS }')
    return fn(window)
  } catch (e) {
    console.error(`  Parse-Fehler: ${e.message}`)
    return null
  }
}

// API-Aufruf
async function apiPost(action, payload) {
  const body = JSON.stringify({ action, email: EMAIL, ...payload })
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error('Not JSON: ' + text.slice(0, 200)) }
}

async function apiGet(action, params = {}) {
  const url = new URL(APPS_SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('email', EMAIL)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error('Not JSON: ' + text.slice(0, 200)) }
}

// Warte mit Backoff
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// === MAIN ===
async function main() {
  console.log('=== Import Spezialtyp-Fragen aus Pools ===')
  if (DRY_RUN) console.log('(DRY RUN — keine Änderungen)')

  // 1. Bestehende poolIds laden
  console.log('\n1. Lade bestehende Fragenbank...')
  const fb = await apiGet('ladeFragenbank')
  if (fb.error) { console.error('Fehler:', fb.error); process.exit(1) }
  const bestehend = new Set(fb.fragen.map(f => f.poolId).filter(Boolean))
  console.log(`   ${fb.fragen.length} Fragen geladen, ${bestehend.size} mit poolId`)

  // 2. Pool-Dateien lesen
  console.log('\n2. Lese Pool-Dateien...')
  const poolFiles = readdirSync(POOL_DIR).filter(f => f.endsWith('.js')).sort()
  let totalNeu = 0
  let totalBestehend = 0
  let totalFehler = 0
  const neueFragenProFach = { VWL: 0, BWL: 0, Recht: 0, Informatik: 0 }

  for (const file of poolFiles) {
    const pool = parsePoolFile(join(POOL_DIR, file))
    if (!pool?.POOL_META || !pool?.QUESTIONS) {
      console.warn(`   ⚠ ${file}: Parse-Fehler — übersprungen`)
      continue
    }

    const meta = pool.POOL_META
    const topics = pool.TOPICS || {}
    const spezial = pool.QUESTIONS.filter(q => !STANDARD_TYPEN.has(q.type))
    if (spezial.length === 0) continue

    // Prüfe welche schon importiert sind
    const fehlend = spezial.filter(q => !bestehend.has(`${meta.id}:${q.id}`))
    const schonDa = spezial.length - fehlend.length

    if (fehlend.length === 0) {
      console.log(`   ✓ ${file}: ${spezial.length} Spezialtyp-Fragen — alle bereits importiert`)
      totalBestehend += schonDa
      continue
    }

    console.log(`   → ${file}: ${fehlend.length} neue + ${schonDa} bestehende Spezialtyp-Fragen`)

    // Konvertieren und importieren
    for (const pf of fehlend) {
      const frage = konvertiereFrage(pf, meta, topics)
      if (!frage) { totalFehler++; continue }

      const fach = mapFachbereich(meta.fach)

      if (DRY_RUN) {
        console.log(`     [DRY] ${pf.type} "${pf.id}" → ${frage.typ} (${fach})`)
        totalNeu++
        neueFragenProFach[fach] = (neueFragenProFach[fach] || 0) + 1
        continue
      }

      try {
        const result = await apiPost('speichereFrage', { frage })
        if (result.success) {
          console.log(`     ✓ ${pf.type} "${pf.id}" → ${frage.typ} (${fach})`)
          totalNeu++
          neueFragenProFach[fach] = (neueFragenProFach[fach] || 0) + 1
        } else {
          console.error(`     ✗ ${pf.id}: ${result.error}`)
          totalFehler++
        }
        // Rate Limiting: 500ms zwischen Requests
        await sleep(500)
      } catch (e) {
        console.error(`     ✗ ${pf.id}: ${e.message}`)
        totalFehler++
        await sleep(2000)
      }
    }

    totalBestehend += schonDa
  }

  console.log('\n=== Ergebnis ===')
  console.log(`Neu importiert: ${totalNeu}`)
  console.log(`Bereits vorhanden: ${totalBestehend}`)
  console.log(`Fehler: ${totalFehler}`)
  console.log(`Pro Fachbereich:`, neueFragenProFach)

  if (!DRY_RUN && totalNeu > 0) {
    console.log('\n⚠ Cache invalidieren...')
    await apiPost('cacheInvalidieren', {})
    console.log('Fertig!')
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
