#!/usr/bin/env node
/**
 * Audit-Skript: Verhindert Wachstum von App-Chrome-Headings ohne TYPO.*-Referenz.
 *
 * Strategie: Baseline-Snapshot-Mode (analog audit-no-emoji.mjs).
 * - Tiptap-Editor-Files via Whitelist ignoriert.
 * - byFile-Map mit aktueller Trefferzahl je File. CI failt bei Anstieg.
 *
 * Aufruf:
 *   node scripts/audit-typo-tokens.mjs            # report-only
 *   node scripts/audit-typo-tokens.mjs --strict   # exit 1 bei Regression (CI-Gate)
 *   node scripts/audit-typo-tokens.mjs --baseline # regeneriert Baseline-File
 *
 * Drift-Detection: Wenn ein File unter seinem Baseline-Wert liegt (z.B. nach
 * Migration), wird das als „IMPROVEMENT" mit den ersten 5 Drift-Files
 * angezeigt — Vorschlag, mit `--baseline` neu zu schreiben. Files mit
 * Baseline-Eintrag aber count === 0 zählen ebenfalls als Drift (Cleanup
 * obsoleter Einträge). Pattern aus audit-no-emoji.mjs übernommen.
 *
 * Spec: ExamLab/docs/superpowers/specs/2026-05-17-cluster-e-2-typografie-design.md §4.2
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')
const UPDATE_BASELINE = process.argv.includes('--baseline')

const WHITELIST_PATTERNS = [
  /^packages\/shared\/src\/editor\//,
]

const baselinePath = join(ROOT, 'scripts/typo-tokens-baseline.json')

function isWhitelisted(relPath) {
  return WHITELIST_PATTERNS.some(re => re.test(relPath))
}

/**
 * Count heading tags (<h1..h6>) NOT followed by TYPO. reference within their JSX expression.
 * Heuristik: für jedes `<h[1-6]`-Opening read forward to matching `>` (allow multi-line
 * für `<h2\n  className={...}>`). Wenn `TYPO.` NICHT im Span auftaucht → Violation.
 */
function countViolations(content) {
  let count = 0
  let idx = 0
  while (idx < content.length) {
    const rest = content.substring(idx)
    const match = rest.match(/<h[1-6](\s|>)/)
    if (!match) break
    const openStart = idx + (match.index ?? 0)
    let depth = 0
    let pos = openStart + 2
    let span = ''
    while (pos < content.length) {
      const ch = content[pos]
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) {
        span = content.substring(openStart, pos + 1)
        break
      }
      pos++
    }
    if (!span) break
    if (!/TYPO\./.test(span)) count++
    idx = pos + 1
  }
  return count
}

const filesRaw = execSync(
  `git ls-files 'ExamLab/*.ts' 'ExamLab/*.tsx' 'packages/shared/*.ts' 'packages/shared/*.tsx'`,
  { cwd: ROOT }
).toString()
const files = filesRaw.split('\n').filter(Boolean)

const currentCounts = {}
let totalCurrent = 0

for (const relPath of files) {
  if (isWhitelisted(relPath)) continue
  const absPath = join(ROOT, relPath)
  if (!existsSync(absPath)) continue
  const content = readFileSync(absPath, 'utf-8')
  const count = countViolations(content)
  if (count > 0) {
    currentCounts[relPath] = count
    totalCurrent += count
  }
}

if (UPDATE_BASELINE) {
  const sortedKeys = Object.keys(currentCounts).sort()
  const sortedCounts = {}
  for (const k of sortedKeys) sortedCounts[k] = currentCounts[k]
  const baseline = { totalCount: totalCurrent, byFile: sortedCounts }
  writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')
  console.log(`Baseline updated: ${totalCurrent} violations across ${sortedKeys.length} files`)
  process.exit(0)
}

if (!existsSync(baselinePath)) {
  console.error(`FATAL: Baseline file missing: ${baselinePath}`)
  console.error(`Run with --baseline to generate initial baseline.`)
  process.exit(2)
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf-8'))
const PER_FILE = baseline.byFile || {}

const regressions = []
const drifts = []

// Files mit Treffern: gegen Baseline matchen
for (const [relPath, count] of Object.entries(currentCounts)) {
  const max = PER_FILE[relPath] ?? 0
  if (count > max) {
    regressions.push({ path: relPath, found: count, baseline: max, diff: count - max })
  } else if (count < max) {
    drifts.push({ path: relPath, found: count, baseline: max, diff: max - count })
  }
}

// Drift-only-Files: Baseline-Eintrag existiert, aktuell 0 Treffer (Cleanup-Kandidaten).
for (const [relPath, max] of Object.entries(PER_FILE)) {
  if (max > 0 && currentCounts[relPath] === undefined) {
    drifts.push({ path: relPath, found: 0, baseline: max, diff: max })
  }
}

console.log('')
console.log('typo-tokens-Audit:')
console.log(`  Baseline total:      ${baseline.totalCount}`)
console.log(`  Current total:       ${totalCurrent}`)
console.log(`  Files in baseline:   ${Object.keys(PER_FILE).length}`)
console.log(`  Files with current:  ${Object.keys(currentCounts).length}`)
console.log(`  Regressions:         ${regressions.length}`)
console.log(`  Drifts (unter Baseline): ${drifts.length}`)

if (regressions.length > 0) {
  console.log('')
  console.log('REGRESSIONS (files above baseline):')
  for (const r of regressions) {
    console.log(`  FAIL: ${r.path} — ${r.found} matches (baseline: ${r.baseline}, +${r.diff})`)
  }
  if (STRICT) process.exit(1)
}

if (drifts.length > 0) {
  console.log('')
  console.log(`IMPROVEMENT: ${drifts.length} File(s) unter ihrer Baseline — Baseline kann gesenkt werden.`)
  const preview = drifts.slice(0, 5)
  for (const d of preview) {
    console.log(`  ${d.path} — current ${d.found}, baseline ${d.baseline} (diff -${d.diff})`)
  }
  if (drifts.length > preview.length) {
    console.log(`  … +${drifts.length - preview.length} weitere`)
  }
  console.log('  Run mit --baseline um Baseline neu zu schreiben (entfernt 0-counts, senkt drifts).')
}

process.exit(0)
