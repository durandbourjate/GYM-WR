#!/usr/bin/env node
/**
 * Audit-Skript: Verhindert Re-Introduction von Emojis in Production-Code.
 *
 * Hintergrund: Cluster G Icon-System (Phase 1-5) hat ~152 Emojis durch Lucide-Icons ersetzt
 * (Baseline 467 → ~315 Rest). Dieses Gate verhindert Regression — neue Emojis in Files
 * außerhalb der Allowlist führen zu CI-Fail.
 *
 * Strategie: Baseline-Snapshot-Mode statt Strict-Mode.
 * - `allowlist`: Files mit didaktischem Frage-Inhalt, Test-Daten, Demo-Daten, Belohnungs-
 *   Sticker (gamification) → komplett ignoriert.
 * - `per_file_max`: Snapshot existierender Emoji-Counts pro File. CI failt bei Anstieg.
 *
 * Schrittweise Migration: Nach jeder Migration eines Files den per_file_max-Wert in
 * scripts/no-emoji-baseline.json reduzieren oder File entfernen.
 *
 * Aufruf:
 *   node scripts/audit-no-emoji.mjs            # report-only
 *   node scripts/audit-no-emoji.mjs --strict   # exit 1 bei Regression (CI-Gate)
 *
 * Spec: ExamLab/docs/superpowers/specs/2026-05-11-cluster-g-icon-system-design.md §12.4
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')

// Emoji-Range (analog Baseline-Generator):
// - U+1F300-U+1FAFF: Misc Symbols & Pictographs, Emoticons, Transport, Supplemental
// - U+2600-U+27BF:   Misc Symbols, Dingbats
// - U+2300-U+23FF:   Misc Technical (Hourglass, Watch, Arrow-Pointers etc.)
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu

const baselinePath = join(ROOT, 'scripts/no-emoji-baseline.json')
if (!existsSync(baselinePath)) {
  console.error(`FATAL: Baseline-Datei fehlt: ${baselinePath}`)
  process.exit(2)
}
const BASELINE = JSON.parse(readFileSync(baselinePath, 'utf-8'))
const ALLOWLIST = new Set(BASELINE.allowlist || [])
const PER_FILE = BASELINE.per_file_max || {}

function countEmojis(content) {
  const matches = content.match(EMOJI_RE)
  return matches ? matches.length : 0
}

// Scope: ExamLab/ + packages/shared/ (Cluster G ist ExamLab-Scope).
// Unterrichtsplaner ist out-of-scope und wird NICHT von diesem Gate berührt.
const filesRaw = execSync(
  `git ls-files 'ExamLab/*.ts' 'ExamLab/*.tsx' 'packages/shared/*.ts' 'packages/shared/*.tsx'`,
  { cwd: ROOT }
).toString()
const files = filesRaw.split('\n').filter(Boolean)

const regressions = []
const allowlistedCount = []
let totalEmojis = 0
let baselineTotal = 0

for (const relPath of files) {
  const absPath = join(ROOT, relPath)
  if (!existsSync(absPath)) continue
  const content = readFileSync(absPath, 'utf-8')
  const count = countEmojis(content)
  if (count === 0) continue

  if (ALLOWLIST.has(relPath)) {
    allowlistedCount.push({ path: relPath, count })
    continue
  }

  totalEmojis += count
  const max = PER_FILE[relPath] ?? 0
  baselineTotal += max
  if (count > max) {
    regressions.push({ path: relPath, found: count, baseline: max, diff: count - max })
  }
}

console.log('')
console.log('no-emoji-Audit:')
console.log(`  Files in allowlist (ignored):     ${allowlistedCount.length}`)
console.log(`  Files in per_file_max baseline:   ${Object.keys(PER_FILE).length}`)
console.log(`  Baseline-Total (per_file_max):    ${baselineTotal}`)
console.log(`  Aktuelle Emoji-Count (non-allow): ${totalEmojis}`)
console.log(`  Regressions (über Baseline):      ${regressions.length}`)

if (regressions.length > 0) {
  console.log('')
  console.log('REGRESSIONS:')
  for (const r of regressions) {
    console.log(`  FAIL: ${r.path} — ${r.found} matches (baseline: ${r.baseline}, +${r.diff})`)
  }
  console.log('')
  if (STRICT) {
    console.log('FAIL: Emoji-Regression. Entweder:')
    console.log('  (a) File migrieren (Emoji → Lucide-Icon via IconMapping)')
    console.log('  (b) File in scripts/no-emoji-baseline.json `allowlist` aufnehmen (didakt. Content)')
    console.log('  (c) per_file_max-Wert in baseline.json erhöhen (nur mit Begründung)')
    process.exit(1)
  } else {
    console.log('WARN: Run mit --strict um CI-Gate zu aktivieren.')
  }
} else {
  console.log('')
  console.log('OK: Keine Emoji-Regression über Baseline.')
}
