#!/usr/bin/env node
/**
 * Test-Import: Importiert je 1 Frage pro Typ, liest sie zurück, und prüft ob alle Felder korrekt sind.
 * Löscht die Test-Fragen am Ende wieder.
 *
 * Usage: node scripts/test-import.mjs
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { createContext, runInContext } from 'vm'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOi9ONg678NeyjoY6azruVhv6yc7HI9GVSmKep6rp84GtR-WiG8BV_9w75pmLeD-x0IA/exec'
const EMAIL = 'yannick.durand@gymhofwil.ch'
const POOL_DIR = join(import.meta.dirname, '../Uebungen/Uebungspools/config')

function genId() {
  return 'test-' + Math.random().toString(36).substring(2, 10)
}

function mapFachbereich(fach) {
  const f = (fach || '').toLowerCase().trim()
  if (f.includes('vwl')) return 'VWL'
  if (f.includes('bwl')) return 'BWL'
  if (f.includes('recht')) return 'Recht'
  return 'Allgemein'
}

function mapBloom(tax) {
  const t = (tax || 'K2').trim().toUpperCase()
  return t.startsWith('K') ? t.substring(0, 2) : 'K2'
}

async function apiPost(action, payload) {
  const body = JSON.stringify({ action, email: EMAIL, ...payload })
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, redirect: 'follow',
  })
  const text = await res.text()
  return JSON.parse(text)
}

async function apiGet(action, params = {}) {
  const url = new URL(APPS_SCRIPT_URL)
  url.searchParams.set('action', action)
  url.searchParams.set('email', EMAIL)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { redirect: 'follow' })
  const text = await res.text()
  return JSON.parse(text)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function parsePool(file) {
  const code = readFileSync(join(POOL_DIR, file), 'utf-8')
  const window = {}
  const fn = new Function('window', code + '\nreturn { POOL_META: window.POOL_META, TOPICS: window.TOPICS, QUESTIONS: window.QUESTIONS }')
  return fn(window)
}

// Konvertierung — identisch mit reimport-pools.mjs aber mit test-IDs
function konvertiere(pf, meta, topics) {
  const now = new Date().toISOString()
  const topic = topics[pf.topic] || {}

  const basis = {
    id: genId(), version: 1, erstelltAm: now, geaendertAm: now,
    fachbereich: mapFachbereich(meta.fach), fach: meta.fach || 'Allgemein',
    thema: meta.title, unterthema: topic.label ?? pf.topic,
    semester: [], gefaesse: [], bloom: mapBloom(pf.tax),
    tags: [pf.topic, `diff:${pf.diff}`], punkte: 1,
    musterlosung: pf.explain ?? pf.sample ?? '', bewertungsraster: [],
    schwierigkeit: pf.diff ?? 2, verwendungen: [],
    quelle: 'pool', autor: 'pool-import', geteilt: 'schule',
    poolId: `test:${pf.id}`, poolGeprueft: pf.reviewed ?? false,
    pruefungstauglich: false, poolContentHash: '', poolUpdateVerfuegbar: false, lernzielIds: [],
  }

  switch (pf.type) {
    case 'mc': return { ...basis, typ: 'mc', fragetext: pf.q,
      optionen: (pf.options ?? []).map((o, i) => ({ id: `opt-${i}`, text: o.t, korrekt: pf.correct === o.v })),
      mehrfachauswahl: false, zufallsreihenfolge: true }
    case 'multi': {
      const cs = new Set(Array.isArray(pf.correct) ? pf.correct.map(String) : [])
      return { ...basis, typ: 'mc', fragetext: pf.q,
        optionen: (pf.options ?? []).map((o, i) => ({ id: `opt-${i}`, text: o.t, korrekt: cs.has(o.v) })),
        mehrfachauswahl: true, zufallsreihenfolge: true }
    }
    case 'tf': return { ...basis, typ: 'richtigfalsch', fragetext: pf.q,
      aussagen: [{ text: pf.q, korrekt: pf.correct === true }] }
    case 'fill': return { ...basis, typ: 'lueckentext', fragetext: pf.q, textMitLuecken: pf.q,
      luecken: (pf.blanks ?? []).map((b, i) => ({ id: `l-${i}`, antwort: b.answer, alternativen: b.alts ?? [] })) }
    case 'calc': return { ...basis, typ: 'berechnung', fragetext: pf.q, rechenwegErforderlich: false,
      ergebnisse: (pf.rows ?? []).map((r, i) => ({ id: `e-${i}`, label: r.label, antwort: r.answer, toleranz: r.tolerance ?? 0, einheit: r.unit ?? '' })) }
    case 'sort': return { ...basis, typ: 'zuordnung', fragetext: pf.q, zufallsreihenfolge: true,
      paare: (pf.items ?? []).map(item => typeof item === 'string' ? { links: item, rechts: '' } : { links: item.t, rechts: (pf.categories ?? [])[item.cat] ?? '' }) }
    case 'open': return { ...basis, typ: 'freitext', fragetext: pf.q, laenge: 'mittel' }
    case 'sortierung': return { ...basis, typ: 'sortierung', fragetext: pf.q,
      elemente: (pf.items ?? []).map(i => typeof i === 'string' ? i : i.t), teilpunkte: true }
    case 'formel': return { ...basis, typ: 'formel', fragetext: pf.q,
      korrekteFormel: typeof pf.correct === 'string' ? pf.correct : '', vergleichsModus: 'exakt' }
    case 'hotspot': return { ...basis, typ: 'hotspot', fragetext: pf.q,
      bildUrl: pf.img?.src ? pf.img.src : '',
      hotspots: (pf.hotspots ?? []).map((hs, i) => ({ id: `hs-${i}`, x: hs.x, y: hs.y, radius: hs.r ?? 5, label: hs.label ?? '' })),
      korrekteHotspots: pf.correct ?? [] }
    case 'bildbeschriftung': return { ...basis, typ: 'bildbeschriftung', fragetext: pf.q,
      bildUrl: pf.img?.src ? pf.img.src : '',
      beschriftungen: (pf.labels ?? []).map((l, i) => ({ id: `b-${i}`, text: l.text ?? l, x: l.x ?? 0, y: l.y ?? 0 })) }
    case 'dragdrop_bild': return { ...basis, typ: 'dragdrop_bild', fragetext: pf.q,
      bildUrl: pf.img?.src ? pf.img.src : '',
      labels: (pf.labels ?? []).map((l, i) => ({ id: `dd-${i}`, text: l.text ?? l, zone: l.zone ?? i })),
      zielzonen: (pf.zones ?? []).map((z, i) => ({ id: `z-${i}`, label: z.label ?? z, x: z.x ?? 0, y: z.y ?? 0, breite: z.w ?? 100, hoehe: z.h ?? 40 })) }
    case 'code': return { ...basis, typ: 'code', fragetext: pf.q,
      sprache: pf.sprache ?? 'python', vorlageCode: pf.starterCode ?? '', testcases: [] }
    case 'zeichnen': return { ...basis, typ: 'visualisierung', fragetext: pf.q,
      untertyp: 'zeichnen', breite: 800, hoehe: 400, werkzeuge: ['stift', 'linie', 'text', 'radierer'] }
    case 'pdf': return { ...basis, typ: 'pdf', fragetext: pf.q,
      pdfDriveFileId: '', pdfUrl: '', pdfDateiname: '', seitenAnzahl: 0,
      erlaubteWerkzeuge: ['highlighter', 'kommentar', 'freihand'] }
    case 'buchungssatz': return { ...basis, typ: 'buchungssatz', geschaeftsfall: pf.q,
      buchungen: pf.correct ?? [], kontenauswahl: { modus: 'eingeschraenkt', konten: pf.konten ?? [] } }
    case 'tkonto': return { ...basis, typ: 'tkonto', aufgabentext: pf.q,
      geschaeftsfaelle: pf.geschaeftsfaelle ?? [], konten: pf.konten ?? [],
      kontenauswahl: { modus: 'voll' },
      bewertungsoptionen: { beschriftungSollHaben: true, kontenkategorie: true, zunahmeAbnahme: true, buchungenKorrekt: true, saldoKorrekt: true } }
    case 'kontenbestimmung': return { ...basis, typ: 'kontenbestimmung', aufgabentext: pf.q,
      modus: 'gemischt', aufgaben: pf.aufgaben ?? [], kontenauswahl: { modus: 'voll' } }
    case 'bilanz': return { ...basis, typ: 'bilanzstruktur', aufgabentext: pf.q,
      modus: pf.modus ?? 'bilanz', kontenMitSaldi: pf.kontenMitSaldi ?? [], loesung: pf.correct ?? {},
      bewertungsoptionen: { seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
        kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true, bilanzsummeOderGewinn: true, mehrstufigkeit: false } }
    case 'gruppe': return { ...basis, typ: 'aufgabengruppe',
      kontext: `${pf.q}${pf.context ? '\n\n' + pf.context : ''}`,
      teilaufgabenIds: (pf.teil ?? []).map(() => genId()), kontextAnhaenge: [] }
    default: return { ...basis, typ: 'freitext', fragetext: pf.q, laenge: 'mittel' }
  }
}

// === MAIN ===

async function main() {
  console.log('=== TEST-IMPORT: 1 Frage pro Typ importieren + verifizieren ===\n')

  // Finde je 1 Frage pro Pool-Typ
  const pools = {
    'bwl_einfuehrung.js': ['mc', 'multi', 'tf', 'fill', 'calc', 'sort', 'sortierung', 'bildbeschriftung', 'dragdrop_bild'],
    'bwl_fibu.js': ['buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanz', 'gruppe'],
    'bwl_marketing.js': ['zeichnen', 'hotspot'],
    'vwl_konjunktur.js': ['open', 'formel', 'pdf'],
  }

  const testFragen = []

  for (const [file, typen] of Object.entries(pools)) {
    const pool = parsePool(file)
    if (!pool) { console.error(`  ✗ ${file} konnte nicht gelesen werden`); continue }
    for (const typ of typen) {
      const pf = pool.QUESTIONS.find(q => q.type === typ)
      if (!pf) { console.warn(`  ⚠ Kein ${typ} in ${file}`); continue }
      const frage = konvertiere(pf, pool.POOL_META, pool.TOPICS)
      testFragen.push({ poolTyp: typ, examTyp: frage.typ, frage, pool: file })
    }
  }

  console.log(`${testFragen.length} Test-Fragen vorbereitet:\n`)
  for (const t of testFragen) {
    console.log(`  ${t.poolTyp.padEnd(18)} → ${t.examTyp.padEnd(18)} (${t.frage.id})`)
  }

  // Phase 1: Importieren
  console.log('\n--- PHASE 1: Importieren ---')
  const importiert = []
  for (const t of testFragen) {
    const result = await apiPost('speichereFrage', { frage: t.frage })
    if (result.success) {
      console.log(`  ✓ ${t.poolTyp} → ${t.examTyp}`)
      importiert.push(t)
    } else {
      console.error(`  ✗ ${t.poolTyp}: ${result.error}`)
    }
    await sleep(500)
  }

  // Phase 2: Zurücklesen und verifizieren
  console.log('\n--- PHASE 2: Verifizieren (zurücklesen) ---')
  await sleep(2000) // Cache invalidieren lassen
  const fb = await apiGet('ladeFragenbank')
  if (fb.error) { console.error('Fehler beim Laden:', fb.error); return }

  const fbMap = {}
  for (const f of fb.fragen) fbMap[f.id] = f

  let ok = 0
  let fehler = 0
  for (const t of importiert) {
    const geladen = fbMap[t.frage.id]
    if (!geladen) {
      console.error(`  ✗ ${t.examTyp} (${t.frage.id}): NICHT in Fragenbank gefunden!`)
      fehler++
      continue
    }

    const probleme = []

    // Basis-Felder prüfen
    if (geladen.typ !== t.frage.typ) probleme.push(`typ: ${geladen.typ} ≠ ${t.frage.typ}`)
    if (geladen.fachbereich !== t.frage.fachbereich) probleme.push(`fachbereich: ${geladen.fachbereich} ≠ ${t.frage.fachbereich}`)
    if (geladen.thema !== t.frage.thema) probleme.push(`thema: "${geladen.thema}" ≠ "${t.frage.thema}"`)
    if (geladen.unterthema !== t.frage.unterthema) probleme.push(`unterthema: "${geladen.unterthema}" ≠ "${t.frage.unterthema}"`)
    if (geladen.bloom !== t.frage.bloom) probleme.push(`bloom: ${geladen.bloom} ≠ ${t.frage.bloom}`)
    if (!geladen.poolId) probleme.push('poolId: FEHLT!')
    else if (geladen.poolId !== t.frage.poolId) probleme.push(`poolId: "${geladen.poolId}" ≠ "${t.frage.poolId}"`)
    if (geladen.quelle !== 'pool') probleme.push(`quelle: ${geladen.quelle} ≠ pool`)
    if (geladen.schwierigkeit !== t.frage.schwierigkeit && geladen.schwierigkeit !== undefined) {
      probleme.push(`schwierigkeit: ${geladen.schwierigkeit} ≠ ${t.frage.schwierigkeit}`)
    }

    // Typ-spezifische Felder prüfen
    switch (t.examTyp) {
      case 'mc':
        if (!geladen.optionen?.length) probleme.push('optionen: FEHLT/LEER')
        else if (!geladen.optionen.some(o => o.korrekt)) probleme.push('optionen: keine korrekte Antwort')
        break
      case 'richtigfalsch':
        if (!geladen.aussagen?.length) probleme.push('aussagen: FEHLT/LEER')
        break
      case 'lueckentext':
        if (!geladen.luecken?.length) probleme.push('luecken: FEHLT/LEER')
        break
      case 'berechnung':
        if (!geladen.ergebnisse?.length) probleme.push('ergebnisse: FEHLT/LEER')
        break
      case 'zuordnung':
        if (!geladen.paare?.length) probleme.push('paare: FEHLT/LEER')
        break
      case 'sortierung':
        if (!geladen.elemente?.length) probleme.push('elemente: FEHLT/LEER')
        break
      case 'formel':
        if (!geladen.korrekteFormel) probleme.push('korrekteFormel: FEHLT')
        break
      case 'hotspot':
        if (!geladen.hotspots?.length) probleme.push('hotspots: FEHLT/LEER')
        break
      case 'bildbeschriftung':
        if (!geladen.beschriftungen?.length) probleme.push('beschriftungen: FEHLT/LEER')
        break
      case 'dragdrop_bild':
        if (!geladen.labels?.length) probleme.push('labels: FEHLT/LEER')
        if (!geladen.zielzonen?.length) probleme.push('zielzonen: FEHLT/LEER')
        break
      case 'buchungssatz':
        if (!geladen.buchungen?.length) probleme.push('buchungen: FEHLT/LEER')
        break
      case 'tkonto':
        if (!geladen.geschaeftsfaelle?.length && !geladen.konten?.length) probleme.push('geschaeftsfaelle/konten: FEHLT/LEER')
        break
      case 'kontenbestimmung':
        if (!geladen.aufgaben?.length) probleme.push('aufgaben: FEHLT/LEER')
        break
      case 'bilanzstruktur':
        if (!geladen.kontenMitSaldi?.length) probleme.push('kontenMitSaldi: FEHLT/LEER')
        break
      case 'aufgabengruppe':
        if (!geladen.teilaufgabenIds?.length) probleme.push('teilaufgabenIds: FEHLT/LEER')
        break
      case 'visualisierung':
        if (!geladen.untertyp) probleme.push('untertyp: FEHLT')
        break
      case 'code':
        if (!geladen.sprache) probleme.push('sprache: FEHLT')
        break
    }

    if (probleme.length === 0) {
      console.log(`  ✓ ${t.poolTyp.padEnd(18)} → ${t.examTyp.padEnd(18)} OK`)
      ok++
    } else {
      console.error(`  ✗ ${t.poolTyp.padEnd(18)} → ${t.examTyp.padEnd(18)} PROBLEME:`)
      for (const p of probleme) console.error(`      - ${p}`)
      fehler++
    }
  }

  // Phase 3: Aufräumen
  console.log('\n--- PHASE 3: Test-Fragen löschen ---')
  for (const t of importiert) {
    await apiPost('loescheFrage', { frageId: t.frage.id, fachbereich: t.frage.fachbereich })
    await sleep(300)
  }
  console.log(`  ${importiert.length} Test-Fragen gelöscht`)

  console.log(`\n=== ERGEBNIS: ${ok} OK, ${fehler} Fehler von ${importiert.length} getestet ===`)
  if (fehler > 0) {
    console.log('\n⚠ IMPORT NICHT STARTEN bis alle Fehler behoben sind!')
    process.exit(1)
  } else {
    console.log('\n✓ Alle Typen verifiziert — Import kann gestartet werden.')
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
