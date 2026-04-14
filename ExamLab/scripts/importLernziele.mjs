#!/usr/bin/env node
/**
 * Importiert Pool-Lernziele ins ExamLab-Backend (Fragenbank → Lernziele-Tab).
 *
 * Liest alle Pool-Config-Dateien, extrahiert POOL_META.lernziele + TOPICS[key].lernziele,
 * und sendet sie an den importiereLernziele-Endpoint.
 *
 * Usage: node scripts/importLernziele.mjs
 *
 * Voraussetzung: APPS_SCRIPT_URL und LP_EMAIL in .env.local oder als Umgebungsvariable.
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_DIR = join(__dirname, '../Uebungen/Uebungspools/config')

// Apps Script URL aus .env.local oder Umgebungsvariable
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || (() => {
  try {
    const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf-8')
    const match = envContent.match(/VITE_APPS_SCRIPT_URL=(.+)/)
    return match?.[1]?.trim()
  } catch { return null }
})()

const LP_EMAIL = process.env.LP_EMAIL || 'yannick.durand@gymhofwil.ch'

if (!APPS_SCRIPT_URL) {
  console.error('❌ APPS_SCRIPT_URL nicht gefunden. Setze VITE_APPS_SCRIPT_URL in .env.local oder als Umgebungsvariable.')
  process.exit(1)
}

// Fach-Mapping: Pool-Dateiname → Fachbereich
function bestimmeFach(filename) {
  if (filename.startsWith('bwl_') || filename.startsWith('fibu')) return 'BWL'
  if (filename.startsWith('recht_')) return 'Recht'
  if (filename.startsWith('vwl_')) return 'VWL'
  if (filename.startsWith('in_')) return 'Informatik'
  return 'Andere'
}

// Bloom-Level aus Lernziel-Text extrahieren: "... (K2)" → "K2"
function extrahiereBloom(text) {
  const match = text.match(/\((K[1-6])\)\s*$/)
  return match ? match[1] : 'K2'
}

// Lernziel-Text ohne Bloom-Klammer
function bereinigeLernzielText(text) {
  return text.replace(/\s*\(K[1-6]\)\s*$/, '').trim()
}

async function main() {
  const configDateien = readdirSync(CONFIG_DIR).filter(f => f.endsWith('.js'))
  console.log(`📂 ${configDateien.length} Pool-Configs gefunden in ${CONFIG_DIR}`)

  const alleLernziele = []
  let poolCount = 0

  for (const datei of configDateien) {
    const pfad = join(CONFIG_DIR, datei)
    const inhalt = readFileSync(pfad, 'utf-8')
    const poolId = datei.replace('.js', '')
    const fach = bestimmeFach(poolId)

    // POOL_META parsen
    const metaMatch = inhalt.match(/window\.POOL_META\s*=\s*(\{[\s\S]*?\});/)
    let poolTitle = poolId

    if (metaMatch) {
      try {
        // title extrahieren
        const titleMatch = metaMatch[1].match(/title:\s*["'](.+?)["']/)
        if (titleMatch) poolTitle = titleMatch[1]

        // lernziele extrahieren
        const lzMatch = metaMatch[1].match(/lernziele:\s*\[([\s\S]*?)\]/)
        if (lzMatch) {
          const lzStrings = lzMatch[1].match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || []
          for (const lzText of lzStrings) {
            alleLernziele.push({
              id: `pool-${poolId}-meta-${alleLernziele.length}`,
              fach,
              poolId,
              thema: poolTitle,
              unterthema: '', // Pool-übergreifend, kein spezifisches Unterthema
              text: bereinigeLernzielText(lzText),
              bloom: extrahiereBloom(lzText),
              aktiv: true,
            })
          }
        }
      } catch (e) {
        console.warn(`  ⚠ POOL_META Parse-Fehler in ${datei}: ${e.message}`)
      }
    }

    // TOPICS parsen
    const topicsMatch = inhalt.match(/window\.TOPICS\s*=\s*(\{[\s\S]*?\});/)
    if (topicsMatch) {
      try {
        // Jedes Topic einzeln extrahieren
        const topicBlocks = topicsMatch[1].matchAll(/"([^"]+)":\s*\{([\s\S]*?)(?=\n\s*"[^"]+":|\n\s*\};\s*$)/g)
        for (const [, topicKey, block] of topicBlocks) {
          const labelMatch = block.match(/label:\s*["'](.+?)["']/)
          const topicLabel = labelMatch?.[1] || topicKey

          const lzMatch = block.match(/lernziele:\s*\[([\s\S]*?)\]/)
          if (lzMatch) {
            const lzStrings = lzMatch[1].match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || []
            for (const lzText of lzStrings) {
              alleLernziele.push({
                id: `pool-${poolId}-${topicKey}-${alleLernziele.length}`,
                fach,
                poolId,
                thema: poolTitle,
                unterthema: topicLabel, // Topic-Label = Unterthema in ExamLab
                text: bereinigeLernzielText(lzText),
                bloom: extrahiereBloom(lzText),
                aktiv: true,
              })
            }
          }
        }
      } catch (e) {
        console.warn(`  ⚠ TOPICS Parse-Fehler in ${datei}: ${e.message}`)
      }
    }

    poolCount++
  }

  console.log(`\n📋 ${alleLernziele.length} Lernziele aus ${poolCount} Pools extrahiert`)
  console.log(`   Fächer: ${[...new Set(alleLernziele.map(l => l.fach))].join(', ')}`)

  // An Backend senden
  console.log(`\n📤 Sende an ${APPS_SCRIPT_URL}...`)

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'importiereLernziele',
      email: LP_EMAIL,
      lernziele: alleLernziele,
    }),
  })

  const result = await response.json()

  if (result.erfolg || result.success) {
    console.log(`✅ Import erfolgreich: ${result.neu} neu, ${result.aktualisiert} aktualisiert`)
  } else {
    console.error(`❌ Import fehlgeschlagen: ${result.error}`)
  }
}

main().catch(console.error)
