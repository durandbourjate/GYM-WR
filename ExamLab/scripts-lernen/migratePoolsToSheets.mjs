#!/usr/bin/env node
/**
 * Einmal-Migrationsskript: Pool-Fragen → Google Sheets Fragenbank
 *
 * Dieses Script importiert die restlichen Pool-Fragen aus den JSON-Dateien
 * in die Fragenbank-Sheets. Die meisten Fragen wurden bereits über die
 * Pool-Brücke importiert.
 *
 * ANLEITUNG:
 * 1. Alternativ als Apps Script Funktion in lernplattform-backend.js implementieren
 * 2. Content-Hashing (SHA-256) zur Deduplizierung verwenden
 * 3. IDs beibehalten wo möglich
 * 4. Nach erfolgreicher Migration: pool-daten/ löschen
 *
 * HINWEIS: Die meisten Fragen sind bereits im Prüfungstool importiert.
 * Prüfe vorher welche Fragen noch fehlen.
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const POOL_DATEN_DIR = join(import.meta.dirname, '../public/pool-daten')

// Alle JSON-Dateien lesen
const files = readdirSync(POOL_DATEN_DIR).filter(f => f.endsWith('.json') && f !== 'alle-fragen.json' && f !== 'statistik.json')

let total = 0
for (const file of files) {
  const fragen = JSON.parse(readFileSync(join(POOL_DATEN_DIR, file), 'utf-8'))
  console.log(`${file}: ${fragen.length} Fragen`)
  total += fragen.length
}

console.log(`\nTotal: ${total} Fragen in ${files.length} Pools`)
console.log('\nNächster Schritt: Diese Fragen in das Fragenbank-Sheet importieren.')
console.log('Verwende die Pool-Brücke oder eine Apps Script Funktion dafür.')
