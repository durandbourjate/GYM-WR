#!/usr/bin/env node
/**
 * Einmalige Migration: Pool-Fragen im Backend mit korrektem thema/unterthema versehen.
 *
 * Usage: node scripts/migrate-pool-themen.mjs
 */

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxOi9ONg678NeyjoY6azruVhv6yc7HI9GVSmKep6rp84GtR-WiG8BV_9w75pmLeD-x0IA/exec'
const EMAIL = 'yannick.durand@gymhofwil.ch'

// Pool-ID → Bereinigter Titel (aus poolTitelMapping.ts)
const POOL_TITEL = {
  bwl_einfuehrung: 'Grundlagen der Betriebswirtschaftslehre',
  bwl_fibu: 'Finanzbuchhaltung (FIBU)',
  bwl_marketing: 'Markt- und Leistungsanalyse',
  bwl_stratfuehrung: 'Strategische Unternehmensführung',
  bwl_unternehmensmodell: 'Unternehmensmodell – Umweltsphären & Anspruchsgruppen',
  recht_arbeitsrecht: 'Arbeitsrecht',
  recht_einfuehrung: 'Grundsätze der Rechtsordnung',
  recht_einleitungsartikel: 'Rechtsquellen und Rechtsgrundsätze',
  recht_grundrechte: 'Menschenrechte und Grundrechte',
  recht_mietrecht: 'Mietrecht',
  recht_or_at: 'OR AT – Vertragslehre',
  recht_personenrecht: 'Personenrecht',
  recht_prozessrecht: 'Prozessrecht',
  recht_sachenrecht: 'Sachenrecht',
  recht_strafrecht: 'Strafrecht',
  vwl_arbeitslosigkeit: 'Arbeitslosigkeit & Armut',
  vwl_beduerfnisse: 'Bedürfnisse, Knappheit & Produktionsfaktoren',
  vwl_bip: 'Bruttoinlandprodukt (BIP)',
  vwl_geld: 'Geld, Geldpolitik und Finanzmärkte',
  vwl_konjunktur: 'Konjunktur und Konjunkturpolitik',
  vwl_markteffizienz: 'Markteffizienz',
  vwl_menschenbild: 'Ökonomisches Menschenbild',
  vwl_sozialpolitik: 'Sozialpolitik und Sozialversicherungen',
  vwl_staatsverschuldung: 'Staatsverschuldung',
  vwl_steuern: 'Steuern und Staatseinnahmen',
  vwl_wachstum: 'Wirtschaftswachstum',
  informatik_kryptographie: 'Kryptographie',
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

async function apiPost(action, payload = {}) {
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

async function main() {
  console.log('=== Pool-Themen Migration ===')
  console.log(`Backend: ${APPS_SCRIPT_URL.slice(0, 60)}...`)
  console.log(`Email: ${EMAIL}\n`)

  // 1. Alle Fragen laden
  console.log('1. Fragenbank laden...')
  const result = await apiGet('ladeFragenbank')
  console.log('   Raw keys:', Object.keys(result))
  if (result.error) console.log('   Error:', result.error)
  if (result.fragen) console.log('   Fragen:', result.fragen.length)

  // Response kann verschiedene Formate haben
  let fragen = []
  if (Array.isArray(result)) {
    fragen = result
  } else if (result.fragen) {
    fragen = result.fragen
  } else if (result.data?.fragen) {
    fragen = result.data.fragen
  } else if (result.success === false) {
    console.error('Backend-Fehler:', result.error || result)
    return
  } else {
    // Vielleicht ist das Result-Objekt selbst die Fragenbank (key=frageId)
    const keys = Object.keys(result).filter(k => k !== 'success' && k !== 'error')
    if (keys.length > 0 && typeof result[keys[0]] === 'object') {
      fragen = keys.map(k => result[k])
      console.log(`   (Format: Objekt mit ${keys.length} Keys)`)
    }
  }
  console.log(`   ${fragen.length} Fragen geladen\n`)

  // 2. Pool-Fragen ohne unterthema identifizieren
  const zuMigrieren = []
  let bereitsKorrekt = 0
  let keinPool = 0
  let unbekanntPool = 0

  for (const f of fragen) {
    if (!f.poolId) { keinPool++; continue }
    if (f.unterthema) { bereitsKorrekt++; continue }

    const poolMetaId = f.poolId.split(':')[0].toLowerCase()
    const titel = POOL_TITEL[poolMetaId]
    if (!titel) {
      unbekanntPool++
      console.log(`   ⚠ Unbekannter Pool: "${poolMetaId}" (Frage ${f.id})`)
      continue
    }

    zuMigrieren.push({ frage: f, neuesThema: titel, altesThema: f.thema })
  }

  console.log('2. Analyse:')
  console.log(`   ${keinPool} ohne Pool-ID (keine Pool-Fragen)`)
  console.log(`   ${bereitsKorrekt} bereits mit Unterthema (korrekt)`)
  console.log(`   ${unbekanntPool} mit unbekanntem Pool-ID`)
  console.log(`   ${zuMigrieren.length} zu migrieren\n`)

  if (zuMigrieren.length === 0) {
    console.log('✅ Nichts zu migrieren — alles bereits korrekt!')
    return
  }

  // 3. Übersicht vor Migration
  const poolStats = {}
  for (const m of zuMigrieren) {
    poolStats[m.neuesThema] = (poolStats[m.neuesThema] || 0) + 1
  }
  console.log('3. Migration-Vorschau:')
  for (const [thema, count] of Object.entries(poolStats).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`   ${thema}: ${count} Fragen`)
  }
  console.log()

  // 4. Migration durchführen (in 5er-Batches)
  console.log(`4. Migration starten (${zuMigrieren.length} Fragen in ${Math.ceil(zuMigrieren.length / 5)} Batches)...\n`)

  let aktualisiert = 0
  let fehler = 0

  for (let i = 0; i < zuMigrieren.length; i += 5) {
    const batch = zuMigrieren.slice(i, i + 5)
    const promises = batch.map(async ({ frage, neuesThema, altesThema }) => {
      const aktualisiert = { ...frage, thema: neuesThema, unterthema: altesThema }
      try {
        const res = await apiPost('speichereFrage', { frage: aktualisiert })
        if (res.success) return true
        console.error(`   ✗ ${frage.id}: ${res.error || 'unbekannter Fehler'}`)
        return false
      } catch (e) {
        console.error(`   ✗ ${frage.id}: ${e.message}`)
        return false
      }
    })

    const results = await Promise.all(promises)
    aktualisiert += results.filter(Boolean).length
    fehler += results.filter(r => !r).length

    const progress = Math.min(i + 5, zuMigrieren.length)
    process.stdout.write(`   Fortschritt: ${progress}/${zuMigrieren.length} (${aktualisiert} ✓, ${fehler} ✗)\r`)
  }

  console.log(`\n\n=== Ergebnis ===`)
  console.log(`✓ ${aktualisiert} Fragen aktualisiert`)
  if (fehler > 0) console.log(`✗ ${fehler} Fehler`)
  console.log(`\nMigration abgeschlossen.`)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
