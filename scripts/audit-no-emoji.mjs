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
 *   node scripts/audit-no-emoji.mjs --baseline # regeneriert per_file_max aus aktuellem Stand
 *
 * Drift-Detection: Wenn ein File unter seinem per_file_max-Wert liegt (z.B. nach
 * Migration), wird das als „IMPROVEMENT" gemeldet — Vorschlag, mit `--baseline`
 * die Baseline zu senken, damit zukünftige Regressions schärfer gefangen werden.
 *
 * Spec: ExamLab/docs/superpowers/specs/2026-05-11-cluster-g-icon-system-design.md §12.4
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')
const UPDATE_BASELINE = process.argv.includes('--baseline')

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
const drifts = []
const allowlistedCount = []
let totalEmojis = 0
const currentCounts = {}

// Baseline-Total: Sum aller per_file_max-Werte (unabhängig vom aktuellen Stand).
const baselineTotal = Object.values(PER_FILE).reduce((sum, n) => sum + n, 0)

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
  currentCounts[relPath] = count
  const max = PER_FILE[relPath] ?? 0
  if (count > max) {
    regressions.push({ path: relPath, found: count, baseline: max, diff: count - max })
  } else if (count < max) {
    drifts.push({ path: relPath, found: count, baseline: max, diff: max - count })
  }
}

// Drift-only-Files: per_file_max-Eintrag existiert, aktuell 0 Treffer.
// Auch diese zählen für die Baseline-Tighten-Suggestion.
for (const [relPath, max] of Object.entries(PER_FILE)) {
  if (currentCounts[relPath] !== undefined) continue
  if (max === 0) continue
  drifts.push({ path: relPath, found: 0, baseline: max, diff: max })
}

if (UPDATE_BASELINE) {
  const sortedKeys = Object.keys(currentCounts).sort()
  const sortedCounts = {}
  for (const k of sortedKeys) sortedCounts[k] = currentCounts[k]
  const next = { ...BASELINE, per_file_max: sortedCounts }
  writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n')
  console.log(`Baseline updated: ${totalEmojis} emojis across ${sortedKeys.length} files`)
  process.exit(0)
}

console.log('')
console.log('no-emoji-Audit:')
console.log(`  Files in allowlist (ignored):     ${allowlistedCount.length}`)
console.log(`  Files in per_file_max baseline:   ${Object.keys(PER_FILE).length}`)
console.log(`  Baseline-Total (per_file_max):    ${baselineTotal}`)
console.log(`  Aktuelle Emoji-Count (non-allow): ${totalEmojis}`)
console.log(`  Regressions (über Baseline):      ${regressions.length}`)
console.log(`  Drifts (unter Baseline):          ${drifts.length}`)

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

if (drifts.length > 0) {
  console.log('')
  console.log(`IMPROVEMENT: ${drifts.length} File(s) unter ihrem per_file_max — Baseline kann gesenkt werden.`)
  // Erste 5 Drift-Files zeigen, dann zusammenfassen.
  const preview = drifts.slice(0, 5)
  for (const d of preview) {
    console.log(`  ${d.path} — aktuell ${d.found}, baseline ${d.baseline} (−${d.diff})`)
  }
  if (drifts.length > preview.length) {
    console.log(`  … +${drifts.length - preview.length} weitere`)
  }
  console.log('  Run mit --baseline um per_file_max neu zu schreiben (entfernt 0-counts, senkt drifts).')
}
