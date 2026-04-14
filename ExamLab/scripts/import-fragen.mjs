/**
 * Import-Script: Fragen und/oder Configs → Google Sheets Backend
 *
 * Liest JSON-Dateien und sendet sie einzeln an die Apps Script API.
 * Kann Fragen, Configs oder beides importieren.
 *
 * Verwendung:
 *   node scripts/import-fragen.mjs daten.json
 *   node scripts/import-fragen.mjs fragen.json config.json
 *   node scripts/import-fragen.mjs --dry-run daten.json
 *
 * JSON-Format (Fragen):
 *   { "fragen": [ { id, typ, fragetext, ... }, ... ] }
 *
 * JSON-Format (Config):
 *   { "config": { id, titel, klasse, ... } }
 *
 * JSON-Format (beides):
 *   { "fragen": [...], "config": { ... } }
 *
 * Optionen:
 *   --dry-run    Nur validieren, nicht hochladen
 *   --url=URL    Apps Script URL (sonst aus .env.local)
 *   --email=X    LP-Email (default: yannick.durand@gymhofwil.ch)
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Argumente parsen ---
const args = process.argv.slice(2)
const flags = args.filter(a => a.startsWith('--'))
const dateien = args.filter(a => !a.startsWith('--'))

const dryRun = flags.includes('--dry-run')
const urlFlag = flags.find(f => f.startsWith('--url='))?.split('=')[1]
const emailFlag = flags.find(f => f.startsWith('--email='))?.split('=')[1]

if (dateien.length === 0) {
  console.error(`
Verwendung: node scripts/import-fragen.mjs [optionen] <datei.json> [datei2.json ...]

Optionen:
  --dry-run     Nur validieren, nicht hochladen
  --url=URL     Apps Script URL (sonst aus .env.local)
  --email=EMAIL LP-Email (default: yannick.durand@gymhofwil.ch)

JSON-Format:
  { "fragen": [...] }           Nur Fragen
  { "config": { ... } }         Nur Config
  { "fragen": [...], "config": { ... } }  Beides
`)
  process.exit(1)
}

// --- Apps Script URL ---
let APPS_SCRIPT_URL = urlFlag
if (!APPS_SCRIPT_URL) {
  const envPath = resolve(__dirname, '..', '.env.local')
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    const urlMatch = envContent.match(/VITE_APPS_SCRIPT_URL=(.+)/)
    APPS_SCRIPT_URL = urlMatch?.[1]?.trim()
  }
}
if (!APPS_SCRIPT_URL) {
  console.error('Keine Apps Script URL gefunden. Entweder --url=... angeben oder .env.local mit VITE_APPS_SCRIPT_URL anlegen.')
  process.exit(1)
}

const EMAIL = emailFlag || 'yannick.durand@gymhofwil.ch'

// --- Helper: POST an Apps Script ---
async function post(action, payload) {
  const body = JSON.stringify({ action, email: EMAIL, ...payload })
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
  })
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { error: text.slice(0, 200) }
  }
}

// --- Validierung ---
function validiereFrageMinimal(frage, index) {
  const fehler = []
  if (!frage.id) fehler.push(`Frage ${index}: 'id' fehlt`)
  if (!frage.typ) fehler.push(`Frage ${index}: 'typ' fehlt`)
  if (!frage.punkte && frage.punkte !== 0) fehler.push(`Frage ${index} (${frage.id}): 'punkte' fehlt`)
  if (!frage.fachbereich) fehler.push(`Frage ${index} (${frage.id}): 'fachbereich' fehlt`)
  return fehler
}

function validiereConfigMinimal(config) {
  const fehler = []
  if (!config.id) fehler.push("Config: 'id' fehlt")
  if (!config.titel) fehler.push("Config: 'titel' fehlt")
  if (!config.abschnitte?.length) fehler.push("Config: 'abschnitte' fehlt oder leer")
  return fehler
}

// --- JSON-Dateien laden und zusammenführen ---
let alleFragen = []
let alleConfigs = []

for (const datei of dateien) {
  const pfad = resolve(datei)
  if (!existsSync(pfad)) {
    console.error(`Datei nicht gefunden: ${pfad}`)
    process.exit(1)
  }

  let daten
  try {
    daten = JSON.parse(readFileSync(pfad, 'utf-8'))
  } catch (e) {
    console.error(`JSON-Parse-Fehler in ${datei}: ${e.message}`)
    process.exit(1)
  }

  if (Array.isArray(daten)) {
    // Reines Array = Fragen-Array
    alleFragen.push(...daten)
  } else {
    if (daten.fragen) alleFragen.push(...daten.fragen)
    if (daten.config) alleConfigs.push(daten.config)
  }
}

// --- Validieren ---
console.log(`\n📦 Import: ${alleFragen.length} Fragen, ${alleConfigs.length} Configs`)
console.log(`   URL: ${APPS_SCRIPT_URL.slice(0, 60)}...`)
console.log(`   Email: ${EMAIL}`)
if (dryRun) console.log('   🔍 DRY RUN — nichts wird hochgeladen')
console.log()

let valFehler = []
alleFragen.forEach((f, i) => valFehler.push(...validiereFrageMinimal(f, i)))
alleConfigs.forEach(c => valFehler.push(...validiereConfigMinimal(c)))

if (valFehler.length > 0) {
  console.error('❌ Validierungsfehler:')
  valFehler.forEach(f => console.error(`   • ${f}`))
  process.exit(1)
}

console.log('✅ Validierung bestanden')

if (dryRun) {
  console.log('\n🔍 Dry-Run beendet. Keine Daten hochgeladen.\n')
  process.exit(0)
}

// --- Upload ---
let fragenErfolg = 0
let fragenFehler = 0

for (const frage of alleFragen) {
  process.stdout.write(`  📝 ${frage.id} (${frage.typ})... `)
  const result = await post('speichereFrage', { frage })
  if (result.success) {
    console.log('✅')
    fragenErfolg++
  } else {
    console.log(`❌ ${result.error || 'unbekannter Fehler'}`)
    fragenFehler++
  }
  // Kurze Pause um Rate-Limits zu vermeiden
  await new Promise(r => setTimeout(r, 300))
}

if (alleFragen.length > 0) {
  console.log(`\n  Fragen: ${fragenErfolg} ✅ / ${fragenFehler} ❌`)
}

for (const config of alleConfigs) {
  process.stdout.write(`\n  📋 Config "${config.id}"... `)
  const result = await post('speichereConfig', { config })
  if (result.success) {
    console.log('✅')
  } else {
    console.log(`❌ ${result.error || 'unbekannter Fehler'}`)
  }
}

const total = fragenErfolg + alleConfigs.length
const fehler = fragenFehler
console.log(`\n✨ Import abgeschlossen: ${total} erfolgreich, ${fehler} fehlgeschlagen.\n`)

if (fehler > 0) process.exit(1)
