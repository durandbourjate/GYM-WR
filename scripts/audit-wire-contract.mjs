#!/usr/bin/env node
/**
 * Wire-Contract-Audit: Verify every action-string passed to `<client>.post('<action>', ...)` or
 * `postJson('<action>', ...)` in src/ has a matching `case '<action>':` in apps-script-code.js.
 *
 * Hintergrund: Bundle Legacy-Naming-Cleanup (10.05.2026) hat einen pre-existing
 * Wire-Vertrag-Slip aufgedeckt — der Frontend-Call `'uebenMarkiereKIFeedbackAlsIgnoriert'`
 * matchte keinen Backend-Case (Backend hatte `'markiereKIFeedbackAlsIgnoriert'` ohne `ueben`-Prefix).
 * Pre-existing seit unbekannter Zeit. Memory-Lehre `feedback_backend_read_paths_audit.md`:
 * alle Read/Write-Pfade müssen lockstep sein.
 *
 * Aufruf:
 *   node scripts/audit-wire-contract.mjs           # report-only
 *   node scripts/audit-wire-contract.mjs --strict  # exit 1 bei Mismatch (CI-Gate)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const SRC_DIR = join(ROOT, 'ExamLab/src')
const APPS_SCRIPT = join(ROOT, 'ExamLab/apps-script-code.js')

const STRICT = process.argv.includes('--strict')

/** Recursively walk dir, return all .ts/.tsx files except tests. */
function* walkSourceFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (entry === 'tests' || entry === '__tests__') continue
      yield* walkSourceFiles(full)
    } else if (st.isFile()) {
      if (!/\.(ts|tsx)$/.test(entry)) continue
      if (/\.test\.(ts|tsx)$/.test(entry)) continue
      yield full
    }
  }
}

/** Extract action-strings from `<client>.post('<X>', ...)` and `postJson('<X>', ...)` calls. */
function extractClientActions() {
  const actions = new Set()
  // Match .post(...)?  or postJson(...)? with optional generic <...> and capture first string-arg.
  // Allow whitespace + newlines between `(` and the string-literal.
  const callRegex = /(?:\b(?:postJson|\w+\.post))(?:<[^>]*>)?\(\s*['"]([a-zA-Z][a-zA-Z0-9_]+)['"]/g
  for (const file of walkSourceFiles(SRC_DIR)) {
    const content = readFileSync(file, 'utf-8')
    for (const m of content.matchAll(callRegex)) {
      actions.add(m[1])
    }
  }
  return actions
}

/** Extract `case 'X':` cases from apps-script-code.js. */
function extractBackendCases() {
  const cases = new Set()
  const content = readFileSync(APPS_SCRIPT, 'utf-8')
  const caseRegex = /case\s+['"]([a-zA-Z][a-zA-Z0-9_]+)['"]/g
  for (const m of content.matchAll(caseRegex)) {
    cases.add(m[1])
  }
  return cases
}

const clientActions = extractClientActions()
const backendCases = extractBackendCases()

const unmatched = [...clientActions].filter((a) => !backendCases.has(a)).sort()

console.log('')
console.log('Wire-Contract-Audit:')
console.log(`  Frontend-action-strings (production): ${clientActions.size}`)
console.log(`  Davon ohne Backend-Handler:           ${unmatched.length}`)

if (unmatched.length > 0) {
  console.log('')
  console.log('FEHLENDE Backend-Handler:')
  for (const a of unmatched) console.log(`  - ${a}`)
  console.log('')
  if (STRICT) {
    console.log('FAIL: Wire-Vertrag inkonsistent. Frontend ruft action-strings ohne Backend-handler.')
    process.exit(1)
  } else {
    console.log('WARN: Run mit --strict um CI-Gate zu aktivieren.')
  }
} else {
  console.log('')
  console.log('OK: Alle Frontend-action-strings haben einen Backend-Handler.')
}
