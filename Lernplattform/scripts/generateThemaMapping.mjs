/**
 * Generiert ein Themen-Mapping aus Pool-Configs.
 * Liest alle .js Pool-Dateien und extrahiert:
 * - poolId → Pool-Titel (= Thema-Ebene)
 * - Topics innerhalb des Pools (= Unterthema-Ebene)
 *
 * Output: JSON-Mapping für die Apps-Script-Migration
 *
 * Usage: node scripts/generateThemaMapping.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const poolConfigDir = join(__dirname, '../../Uebungen/Uebungspools/config')
const outputPath = join(__dirname, 'output/thema-mapping.json')

// Pool-Configs simulieren window.POOL_META und window.TOPICS
function parsePoolConfig(filePath) {
  const code = readFileSync(filePath, 'utf-8')

  // Simuliere window-Objekt
  const window = {}
  try {
    const fn = new Function('window', code)
    fn(window)
  } catch {
    // Fallback: Regex-basiertes Parsen für Dateien mit ES6-Syntax
    try {
      // POOL_META extrahieren
      const metaMatch = code.match(/window\.POOL_META\s*=\s*(\{[\s\S]*?\n\};)/m)
      if (metaMatch) {
        window.POOL_META = eval('(' + metaMatch[1].replace(/;$/, '') + ')')
      }
      // TOPICS extrahieren
      const topicsMatch = code.match(/window\.TOPICS\s*=\s*(\{[\s\S]*?\n\};)/m)
      if (topicsMatch) {
        window.TOPICS = eval('(' + topicsMatch[1].replace(/;$/, '') + ')')
      }
      // QUESTIONS zählen
      const qMatch = code.match(/window\.QUESTIONS\s*=\s*\[/m)
      if (qMatch) {
        // Zähle Objekt-Starts: { id: oder {id:
        const qSection = code.slice(qMatch.index)
        const count = (qSection.match(/\{\s*\n?\s*id\s*:/g) || []).length
        window._questionCount = count
      }
    } catch (e2) {
      console.warn(`  Konnte ${filePath} nicht parsen (Fallback): ${e2.message}`)
      return null
    }
  }

  if (!window.POOL_META) return null

  return {
    meta: window.POOL_META,
    topics: window.TOPICS || {},
    questionCount: window._questionCount || (window.QUESTIONS || []).length
  }
}

// Kurzen Titel aus dem vollen Pool-Titel ableiten
function kurzTitel(title) {
  // "Einführung BWL – Grundlagen der Betriebswirtschaftslehre" → "Einführung BWL"
  // "Übungspool: Konjunktur" → "Konjunktur"
  let t = title
  t = t.replace(/^Übungspool:\s*/i, '')
  const teile = t.split(' – ')
  return teile[0].trim()
}

console.log('=== Themen-Mapping Generator ===\n')
console.log(`Pool-Config-Verzeichnis: ${poolConfigDir}\n`)

const files = readdirSync(poolConfigDir).filter(f => f.endsWith('.js'))
const mapping = {}
let totalQuestions = 0
let totalTopics = 0

for (const file of files) {
  const result = parsePoolConfig(join(poolConfigDir, file))
  if (!result) {
    console.log(`  ⚠ ${file} — übersprungen (kein POOL_META)`)
    continue
  }

  const { meta, topics, questionCount } = result
  const thema = kurzTitel(meta.title)
  const topicLabels = {}

  for (const [key, topic] of Object.entries(topics)) {
    topicLabels[key] = topic.label || topic.short || key
  }

  mapping[meta.id] = {
    thema,
    fach: meta.fach,
    level: meta.level || '',
    topicCount: Object.keys(topics).length,
    questionCount,
    topics: topicLabels,
    lernziele: meta.lernziele || []
  }

  totalQuestions += questionCount
  totalTopics += Object.keys(topics).length
  console.log(`  ✓ ${meta.id} — "${thema}" (${Object.keys(topics).length} Unterthemen, ${questionCount} Fragen)`)
}

console.log(`\n=== Zusammenfassung ===`)
console.log(`${Object.keys(mapping).length} Pools, ${totalTopics} Unterthemen, ${totalQuestions} Fragen total`)

// JSON schreiben
writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8')
console.log(`\nMapping gespeichert: ${outputPath}`)

// Apps-Script-Code generieren (zum Kopieren)
const appsScriptMapping = `
// === THEMEN-MAPPING (generiert aus Pool-Configs) ===
// poolId-Prefix → { thema: Pool-Titel }
var THEMEN_MAPPING = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(mapping).map(([id, data]) => [id, { thema: data.thema, fach: data.fach }])
  ), null, 2
)};
`

const appsScriptPath = join(__dirname, 'output/thema-mapping-appsscript.js')
writeFileSync(appsScriptPath, appsScriptMapping, 'utf-8')
console.log(`Apps-Script-Snippet: ${appsScriptPath}`)
