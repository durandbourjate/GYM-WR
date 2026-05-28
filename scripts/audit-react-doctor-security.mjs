#!/usr/bin/env node
/**
 * Audit-Skript: Regression-Gate für react-doctor Security-Regeln.
 *
 * Regeln: `no-danger` (dangerouslySetInnerHTML) + `no-eval` (eval / Function-Konstruktor).
 * Am 29.05.2026 wurden alle no-danger-Stellen triagiert → 0 aktive XSS-Lücken:
 * jede läuft über DOMPurify.sanitize (SuS-/Backend-HTML), renderMarkdown
 * (escape-first + fixe Tag-Whitelist, src/utils/markdown.ts) oder KaTeX mit
 * trust:false (src/utils/latexRenderer.ts / FormelAnzeige / FormelFrageComponent).
 * Die 1 no-eval-Stelle (src/services/poolSync.ts:76, dynamischer Function-Konstruktor
 * für den Pool-Config-Loader) ist bewusst eslint-disabled + dokumentiert.
 *
 * Dieses Gate friert den sauberen Stand ein: neue Danger-HTML- oder eval-Stellen
 * über die Baseline failen CI und erzwingen einen bewussten Sanitization-Review +
 * Baseline-Anhebung mit Begründung.
 * Triage-Audit-Trail: docs/superpowers/specs/2026-05-28-no-danger-bestandsaufnahme.md.
 *
 * Muster: Baseline-Snapshot wie scripts/audit-react-doctor-state.mjs (per_file_max,
 * Counts statt Zeilennummern → robust gegen Zeilen-Verschiebung).
 *
 * Aufruf:
 *   node scripts/audit-react-doctor-security.mjs            # report-only
 *   node scripts/audit-react-doctor-security.mjs --strict   # exit 1 bei Regression (CI-Gate)
 *   node scripts/audit-react-doctor-security.mjs --baseline # regeneriert per_file_max
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..') // repo root

const STRICT = process.argv.includes('--strict')
const UPDATE_BASELINE = process.argv.includes('--baseline')

const RULES = new Set(['no-danger', 'no-eval'])
const baselinePath = join(ROOT, 'scripts/react-doctor-security-baseline.json')
const RD_BIN = join(ROOT, 'node_modules/.bin/react-doctor')
const EXAMLAB = join(ROOT, 'ExamLab')

// react-doctor ausführen. Exitet absichtlich != 0 wenn error-Level-Diagnostics
// existieren — das ist KEIN Fehler; stdout enthält trotzdem das JSON.
let raw
try {
  raw = execFileSync(
    RD_BIN,
    ['--full', '--lint', '--no-dead-code', '--no-score', '--json', '--json-compact'],
    { cwd: EXAMLAB, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 }
  )
} catch (e) {
  raw = e.stdout // non-zero exit: JSON ist trotzdem in stdout
}
if (!raw || !raw.trim()) {
  console.error('FATAL: react-doctor lieferte keine Ausgabe.')
  console.error(`  Binary erwartet unter: ${RD_BIN}`)
  console.error('  Fix: npm install (im Repo-Root) — react-doctor@0.2.10 ist devDep.')
  process.exit(2)
}
let report
try {
  report = JSON.parse(raw)
} catch {
  console.error('FATAL: react-doctor-Ausgabe ist kein gültiges JSON.')
  process.exit(2)
}

// WICHTIG: NUR .projects[0].diagnostics — NICHT das Top-Level .diagnostics.
// Beide enthalten dieselben Findings; ein Merge würde verdoppeln.
const diags = report.projects?.[0]?.diagnostics ?? []
const currentCounts = {}
for (const d of diags) {
  if (!RULES.has(d.rule)) continue
  currentCounts[d.filePath] = (currentCounts[d.filePath] ?? 0) + 1
}

// Baseline laden (existiert beim ersten --baseline-Run evtl. noch nicht).
let BASELINE = { per_file_max: {} }
if (existsSync(baselinePath)) {
  BASELINE = JSON.parse(readFileSync(baselinePath, 'utf-8'))
} else if (!UPDATE_BASELINE) {
  console.error(`FATAL: Baseline fehlt: ${baselinePath}`)
  console.error('  Erst mit --baseline erzeugen.')
  process.exit(2)
}
const PER_FILE = BASELINE.per_file_max || {}

if (UPDATE_BASELINE) {
  const sortedKeys = Object.keys(currentCounts).sort()
  const sortedCounts = {}
  for (const k of sortedKeys) sortedCounts[k] = currentCounts[k]
  const total = sortedKeys.reduce((s, k) => s + sortedCounts[k], 0)
  const next = {
    _comment:
      'Baseline für lint:react-doctor-security. per_file_max = Count der Security-Regeln (no-danger + no-eval) pro Datei. Bei Anstieg failt CI. Regenerieren: node scripts/audit-react-doctor-security.mjs --baseline (nur nach Sanitization-Review + mit Begründung erhöhen).',
    react_doctor_version: '0.2.10',
    rules: [...RULES],
    per_file_max: sortedCounts,
  }
  writeFileSync(baselinePath, JSON.stringify(next, null, 2) + '\n')
  console.log(`Baseline updated: ${total} findings across ${sortedKeys.length} files`)
  process.exit(0)
}

// Vergleich
const regressions = []
const drifts = []
let total = 0
for (const [f, count] of Object.entries(currentCounts)) {
  total += count
  const max = PER_FILE[f] ?? 0
  if (count > max) regressions.push({ path: f, found: count, baseline: max, diff: count - max })
  else if (count < max) drifts.push({ path: f, found: count, baseline: max, diff: max - count })
}
for (const [f, max] of Object.entries(PER_FILE)) {
  if (currentCounts[f] !== undefined) continue
  if (max === 0) continue
  drifts.push({ path: f, found: 0, baseline: max, diff: max })
}

const baselineTotal = Object.values(PER_FILE).reduce((s, n) => s + n, 0)
console.log('')
console.log('react-doctor-security-Audit (no-danger + no-eval):')
console.log(`  Baseline-Total:   ${baselineTotal}`)
console.log(`  Aktuell:          ${total}`)
console.log(`  Regressions:      ${regressions.length}`)
console.log(`  Drifts:           ${drifts.length}`)

if (regressions.length > 0) {
  console.log('\nREGRESSIONS:')
  for (const r of regressions) {
    console.log(`  FAIL: ${r.path} — ${r.found} (baseline ${r.baseline}, +${r.diff})`)
  }
  if (STRICT) {
    console.log('\nFAIL: Neue Danger-HTML- oder eval-Stelle über Baseline. Entweder:')
    console.log('  (a) Sanitization sicherstellen: DOMPurify.sanitize() für SuS-/Backend-HTML,')
    console.log('      renderMarkdown() (escape-first) für LP-Markdown, oder KaTeX mit trust:false.')
    console.log('  (b) Falls verifiziert-sicher: per_file_max in')
    console.log('      scripts/react-doctor-security-baseline.json erhöhen (mit Begründung + Review).')
    process.exit(1)
  } else {
    console.log('\nWARN: Run mit --strict für CI-Gate.')
  }
} else {
  console.log('\nOK: Keine Security-Regression über Baseline.')
}

if (drifts.length > 0) {
  console.log(`\nIMPROVEMENT: ${drifts.length} Datei(en) unter Baseline — kann gesenkt werden (--baseline).`)
  for (const d of drifts.slice(0, 5)) {
    console.log(`  ${d.path} — aktuell ${d.found}, baseline ${d.baseline} (−${d.diff})`)
  }
  if (drifts.length > 5) console.log(`  … +${drifts.length - 5} weitere`)
}
