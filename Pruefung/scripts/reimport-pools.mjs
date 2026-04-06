#!/usr/bin/env node
/**
 * Vollständiger Re-Import: Alle Pool-Fragen in der Fragenbank löschen und sauber neu importieren.
 * Manuell erstellte Fragen (quelle !== 'pool') bleiben erhalten.
 *
 * Löst alle Dateninkonsistenzen (Themen, Typen, Schwierigkeit) auf einmal.
 *
 * Usage: node scripts/reimport-pools.mjs [--dry-run]
 */

import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { createContext, runInContext } from 'vm'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOi9ONg678NeyjoY6azruVhv6yc7HI9GVSmKep6rp84GtR-WiG8BV_9w75pmLeD-x0IA/exec'
const EMAIL = 'yannick.durand@gymhofwil.ch'
const POOL_DIR = join(import.meta.dirname, '../../Uebungen/Uebungspools/config')
const POOL_IMG_BASE = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'
const DRY_RUN = process.argv.includes('--dry-run')

// === HELPERS ===

function mapFachbereich(fach) {
  const f = (fach || '').toLowerCase().trim()
  if (f.includes('vwl') || f.includes('volkswirt')) return 'VWL'
  if (f.includes('bwl') || f.includes('betriebswirt')) return 'BWL'
  if (f.includes('recht')) return 'Recht'
  if (f === 'in' || f === 'informatik') return 'Informatik'
  return 'Allgemein'
}

function mapBloom(tax) {
  const t = (tax || 'K2').trim().toUpperCase()
  if (t.startsWith('K')) return t.substring(0, 2)
  return 'K2'
}

function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function berechnePunkte(pf) {
  switch (pf.type) {
    case 'mc': case 'tf': return 1
    case 'multi': return 2
    case 'fill': return pf.blanks?.length ?? 1
    case 'calc': return (pf.rows?.length ?? 1) * 2
    case 'sort': return Math.ceil((pf.items?.length ?? 2) / 2)
    case 'open': return 4
    case 'sortierung': return Math.max(2, (pf.items?.length ?? 3))
    case 'formel': return 2
    case 'hotspot': return pf.hotspots?.length ?? 1
    case 'bildbeschriftung': return pf.labels?.length ?? 2
    case 'dragdrop_bild': return pf.labels?.length ?? 2
    case 'code': return 4
    case 'zeichnen': return 3
    case 'buchungssatz': return (pf.correct?.length ?? 1) * 2
    case 'tkonto': return (pf.geschaeftsfaelle?.length ?? 1) * 2
    case 'kontenbestimmung': return (pf.aufgaben?.length ?? 1) * 2
    case 'bilanz': return (pf.kontenMitSaldi?.length ?? 4)
    case 'gruppe': return (pf.teil?.length ?? 1) * 2
    case 'pdf': return 3
    default: return 1
  }
}

function konvertiereBild(img, poolId) {
  if (!img) return null
  const src = img.src?.startsWith('http') ? img.src : `${POOL_IMG_BASE}config/${poolId.replace(/_/g, '/')}/../../${img.src || img}`
  return {
    id: genId(), dateiname: basename(typeof img === 'string' ? img : img.src || ''),
    mimeType: 'image/svg+xml', groesseBytes: 0, driveFileId: '',
    externeUrl: typeof img === 'string' ? img : (img.src?.startsWith('http') ? img.src : `${POOL_IMG_BASE}${img.src}`),
    beschreibung: img.alt || '',
  }
}

// === KONVERTER (alle Typen) ===

function konvertiereFrage(pf, meta, topics) {
  const now = new Date().toISOString()
  const topic = topics[pf.topic] || {}
  const thema = meta.title || topic.label || pf.topic
  const unterthema = topic.label ?? pf.topic

  const basis = {
    id: genId(), version: 1, erstelltAm: now, geaendertAm: now,
    fachbereich: mapFachbereich(meta.fach),
    fach: meta.fach || 'Allgemein',
    thema, unterthema,
    semester: [], gefaesse: [],
    bloom: mapBloom(pf.tax),
    tags: [pf.topic, `diff:${pf.diff}`],
    punkte: berechnePunkte(pf),
    musterlosung: pf.explain ?? pf.sample ?? '',
    bewertungsraster: [],
    schwierigkeit: pf.diff ?? 2,
    verwendungen: [],
    quelle: 'pool',
    quellReferenz: `Pool: ${meta.title}`,
    autor: 'pool-import',
    geteilt: 'schule',
    poolId: `${meta.id}:${pf.id}`,
    poolGeprueft: pf.reviewed ?? false,
    pruefungstauglich: false,
    poolContentHash: '',
    poolUpdateVerfuegbar: false,
    lernzielIds: [],
  }
  if (pf.img) basis.anhaenge = [konvertiereBild(pf.img, meta.id)]

  switch (pf.type) {
    case 'mc': {
      const optionen = (pf.options ?? []).map((o, i) => ({
        id: `opt-${i}`, text: o.t || String(o),
        korrekt: pf.correct === o.v || pf.correct === i || pf.correct === String(i),
      }))
      return { ...basis, typ: 'mc', fragetext: pf.q, optionen, mehrfachauswahl: false, zufallsreihenfolge: true }
    }
    case 'multi': {
      const correctSet = new Set(Array.isArray(pf.correct) ? pf.correct.map(String) : [])
      const optionen = (pf.options ?? []).map((o, i) => ({
        id: `opt-${i}`, text: o.t || String(o),
        korrekt: correctSet.has(o.v) || correctSet.has(String(i)),
      }))
      return { ...basis, typ: 'mc', fragetext: pf.q, optionen, mehrfachauswahl: true, zufallsreihenfolge: true }
    }
    case 'tf':
      return { ...basis, typ: 'richtigfalsch', fragetext: pf.q,
        aussagen: [{ text: pf.q, korrekt: pf.correct === true }] }
    case 'fill': {
      const luecken = (pf.blanks ?? []).map((b, i) => ({
        id: `luecke-${i}`, antwort: b.answer, alternativen: b.alts ?? [],
      }))
      return { ...basis, typ: 'lueckentext', fragetext: pf.q,
        textMitLuecken: pf.q, luecken }
    }
    case 'calc': {
      const ergebnisse = (pf.rows ?? []).map((r, i) => ({
        id: `erg-${i}`, label: r.label, antwort: r.answer,
        toleranz: r.tolerance ?? 0, einheit: r.unit ?? '',
      }))
      return { ...basis, typ: 'berechnung', fragetext: pf.q,
        ergebnisse, rechenwegErforderlich: false }
    }
    case 'sort': {
      const cats = pf.categories ?? []
      const paare = (pf.items ?? []).map(item => {
        if (typeof item === 'string') return { links: item, rechts: '' }
        return { links: item.t, rechts: cats[item.cat] ?? '' }
      })
      return { ...basis, typ: 'zuordnung', fragetext: pf.q, paare, zufallsreihenfolge: true }
    }
    case 'open':
      return { ...basis, typ: 'freitext', fragetext: pf.q, laenge: 'mittel' }
    case 'sortierung': {
      const elemente = (pf.items ?? []).map(item => typeof item === 'string' ? item : item.t)
      return { ...basis, typ: 'sortierung', fragetext: pf.q, elemente, teilpunkte: true }
    }
    case 'formel':
      return { ...basis, typ: 'formel', fragetext: pf.q,
        korrekteFormel: (typeof pf.correct === 'string' ? pf.correct : '') || '', vergleichsModus: 'exakt' }
    case 'hotspot': {
      const bereiche = (pf.hotspots ?? []).map((hs, i) => ({
        id: `hs-${i}`, x: hs.x ?? 0, y: hs.y ?? 0, radius: hs.r ?? 5, label: hs.label ?? ''
      }))
      return { ...basis, typ: 'hotspot', fragetext: pf.q,
        bildUrl: pf.img?.src ? `${POOL_IMG_BASE}${pf.img.src}` : '', bereiche, korrekteHotspots: pf.correct ?? [] }
    }
    case 'bildbeschriftung': {
      const labels = (pf.labels ?? []).map((l, i) => ({
        id: `lbl-${i}`, text: l.text ?? l, x: l.x ?? 0, y: l.y ?? 0
      }))
      return { ...basis, typ: 'bildbeschriftung', fragetext: pf.q,
        bildUrl: pf.img?.src ? `${POOL_IMG_BASE}${pf.img.src}` : '', labels }
    }
    case 'dragdrop_bild': {
      const labels = (pf.labels ?? []).map((l, i) => ({
        id: `dd-${i}`, text: l.text ?? l, zone: l.zone ?? i
      }))
      const zonen = (pf.zones ?? []).map((z, i) => ({
        id: `zone-${i}`, label: z.label ?? z, x: z.x ?? 0, y: z.y ?? 0, breite: z.w ?? 100, hoehe: z.h ?? 40
      }))
      return { ...basis, typ: 'dragdrop_bild', fragetext: pf.q,
        bildUrl: pf.img?.src ? `${POOL_IMG_BASE}${pf.img.src}` : '', labels, zonen }
    }
    case 'code':
      return { ...basis, typ: 'code', fragetext: pf.q,
        sprache: pf.sprache ?? 'python', starterCode: pf.starterCode, musterLoesung: pf.sample }
    case 'zeichnen':
      return { ...basis, typ: 'visualisierung', fragetext: pf.q, untertyp: 'zeichnen',
        breite: 800, hoehe: 400, werkzeuge: ['stift', 'linie', 'text', 'radierer'] }
    case 'pdf':
      return { ...basis, typ: 'pdf', fragetext: pf.q, pdfDriveFileId: '', pdfUrl: '', pdfDateiname: '',
        seitenAnzahl: 0, erlaubteWerkzeuge: ['highlighter', 'kommentar', 'freihand'] }
    case 'buchungssatz':
      return { ...basis, typ: 'buchungssatz', geschaeftsfall: pf.q,
        buchungen: pf.correct ?? [], kontenauswahl: { modus: 'eingeschraenkt', konten: pf.konten ?? [] } }
    case 'tkonto':
      return { ...basis, typ: 'tkonto', aufgabentext: pf.q,
        geschaeftsfaelle: pf.geschaeftsfaelle ?? [], konten: pf.konten ?? [],
        kontenauswahl: { modus: 'voll' },
        bewertungsoptionen: { beschriftungSollHaben: true, kontenkategorie: true,
          zunahmeAbnahme: true, buchungenKorrekt: true, saldoKorrekt: true } }
    case 'kontenbestimmung':
      return { ...basis, typ: 'kontenbestimmung', aufgabentext: pf.q,
        modus: 'gemischt', aufgaben: pf.aufgaben ?? [],
        kontenauswahl: { modus: 'voll' } }
    case 'bilanz':
      return { ...basis, typ: 'bilanzstruktur', aufgabentext: pf.q,
        modus: pf.modus ?? 'bilanz', kontenMitSaldi: pf.kontenMitSaldi ?? [],
        loesung: pf.correct ?? {},
        bewertungsoptionen: { seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
          kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true,
          bilanzsummeOderGewinn: true, mehrstufigkeit: false } }
    case 'gruppe': {
      const teilaufgaben = (pf.teil ?? []).map(teil => ({
        id: genId(), typ: teil.type ?? 'freitext', fragetext: teil.q ?? '',
        punkte: berechnePunkte({ ...pf, type: teil.type }), ...teil,
      }))
      return { ...basis, typ: 'aufgabengruppe',
        kontext: `${pf.q}${pf.context ? '\n\n' + pf.context : ''}`, teilaufgaben }
    }
    default:
      console.warn(`  ⚠ Unbekannter Typ: ${pf.type} → Freitext-Fallback`)
      return { ...basis, typ: 'freitext', fragetext: pf.q, laenge: 'mittel' }
  }
}

// === API ===

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

async function apiPost(action, payload = {}) {
  const body = JSON.stringify({ action, email: EMAIL, ...payload })
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' },
    body, redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error('Not JSON: ' + text.slice(0, 200)) }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parsePoolFile(filePath) {
  const code = readFileSync(filePath, 'utf-8')
  try {
    const window = {}
    const fn = new Function('window', code + '\nreturn { POOL_META: window.POOL_META, TOPICS: window.TOPICS, QUESTIONS: window.QUESTIONS }')
    return fn(window)
  } catch (e) {
    console.error(`  Parse-Fehler ${basename(filePath)}: ${e.message}`)
    return null
  }
}

// === MAIN ===

async function main() {
  console.log('=== VOLLSTÄNDIGER RE-IMPORT: Pool-Fragen ===')
  if (DRY_RUN) console.log('(DRY RUN — keine Änderungen)\n')

  // PHASE 1: Bestehende Pool-Fragen laden und löschen
  console.log('PHASE 1: Bestehende Pool-Fragen identifizieren...')
  const fb = await apiGet('ladeFragenbank')
  if (fb.error) { console.error('Fehler:', fb.error); process.exit(1) }

  const poolFragen = fb.fragen.filter(f => f.quelle === 'pool' || f.poolId)
  const manuelleFragen = fb.fragen.filter(f => f.quelle !== 'pool' && !f.poolId)
  console.log(`  ${fb.fragen.length} Fragen total`)
  console.log(`  ${poolFragen.length} Pool-Fragen → werden gelöscht`)
  console.log(`  ${manuelleFragen.length} manuelle Fragen → bleiben erhalten`)

  if (!DRY_RUN) {
    console.log('\nPHASE 2: Pool-Fragen löschen...')
    let geloescht = 0
    let fehler = 0
    for (const f of poolFragen) {
      try {
        const result = await apiPost('loescheFrage', { frageId: f.id, fachbereich: f.fachbereich })
        if (result.success) { geloescht++ }
        else { console.error(`  ✗ ${f.id}: ${result.error}`); fehler++ }
        // Rate Limiting
        if (geloescht % 10 === 0) await sleep(500)
        if (geloescht % 100 === 0) console.log(`  ... ${geloescht}/${poolFragen.length} gelöscht`)
      } catch (e) {
        console.error(`  ✗ ${f.id}: ${e.message}`); fehler++
        await sleep(2000)
      }
    }
    console.log(`  ✓ ${geloescht} gelöscht, ${fehler} Fehler`)
  } else {
    console.log(`  [DRY] Würde ${poolFragen.length} Pool-Fragen löschen`)
  }

  // PHASE 3: Alle Pools lesen und neu importieren
  console.log('\nPHASE 3: Pools lesen und importieren...')
  const poolFiles = readdirSync(POOL_DIR).filter(f => f.endsWith('.js')).sort()
  let totalNeu = 0
  let totalFehler = 0
  const proFach = {}
  const proTyp = {}

  for (const file of poolFiles) {
    const pool = parsePoolFile(join(POOL_DIR, file))
    if (!pool?.POOL_META || !pool?.QUESTIONS) {
      console.warn(`  ⚠ ${file}: Parse-Fehler — übersprungen`)
      continue
    }

    const meta = pool.POOL_META
    const topics = pool.TOPICS || {}
    const fach = mapFachbereich(meta.fach)
    console.log(`  → ${file}: ${pool.QUESTIONS.length} Fragen (${fach})`)

    for (const pf of pool.QUESTIONS) {
      const frage = konvertiereFrage(pf, meta, topics)
      if (!frage) { totalFehler++; continue }

      proTyp[frage.typ] = (proTyp[frage.typ] || 0) + 1
      proFach[fach] = (proFach[fach] || 0) + 1

      if (DRY_RUN) { totalNeu++; continue }

      try {
        const result = await apiPost('speichereFrage', { frage })
        if (result.success) { totalNeu++ }
        else { console.error(`    ✗ ${pf.id}: ${result.error}`); totalFehler++ }
        // Rate Limiting: 200ms zwischen Requests
        await sleep(200)
        if (totalNeu % 100 === 0) console.log(`    ... ${totalNeu} importiert`)
      } catch (e) {
        console.error(`    ✗ ${pf.id}: ${e.message}`); totalFehler++
        await sleep(2000)
      }
    }
  }

  console.log('\n=== ERGEBNIS ===')
  console.log(`Pool-Fragen gelöscht: ${DRY_RUN ? `[DRY] ${poolFragen.length}` : poolFragen.length}`)
  console.log(`Neu importiert: ${totalNeu}`)
  console.log(`Fehler: ${totalFehler}`)
  console.log(`Pro Fachbereich:`, proFach)
  console.log(`Pro Typ:`, proTyp)

  if (!DRY_RUN && totalNeu > 0) {
    console.log('\nCache invalidieren...')
    try { await apiPost('cacheInvalidieren', {}) } catch {}
    console.log('✓ Fertig!')
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
