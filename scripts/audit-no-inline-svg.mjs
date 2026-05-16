#!/usr/bin/env node
/**
 * Audit-Skript: Verhindert Re-Introduction von Inline-`<svg>`-Tags in Production-Code.
 *
 * Hintergrund: Cluster G Icon-System (Spec §10) hat Inline-SVG-Icons durch Lucide-React
 * ersetzt. Inline-SVGs bleiben NUR für Content-SVGs erlaubt (Hotspot-Zonen, Drag-Drop-
 * Overlays, T-Konto-Zeichnungen, PDF-Annotationen) und für die `CustomIcons.tsx`-Datei
 * (Lucide-Erweiterungen).
 *
 * Strategie: Whitelist-Pfade. Alles außerhalb der Whitelist mit `<svg`-Tag → FAIL.
 *
 * Aufruf:
 *   node scripts/audit-no-inline-svg.mjs            # report-only
 *   node scripts/audit-no-inline-svg.mjs --strict   # exit 1 bei Violation (CI-Gate)
 *
 * Spec: ExamLab/docs/superpowers/specs/2026-05-11-cluster-g-icon-system-design.md §10
 */

import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')

// Whitelist: Content-SVGs (Hotspot/DragDrop/T-Konto/PDF) + Custom-Icons (Lucide-Extensions).
// Prefix-Match (path.startsWith) UND exact-match auf Datei.
const WHITELIST = [
  // Custom Lucide-Extensions
  'ExamLab/src/components/ui/icons/',
  // Content-SVGs für Fragetypen (Hotspot, DragDropBild, T-Konto, PDF, Buchungssatz, MC-Indikatoren)
  'ExamLab/src/components/fragetypen/pdf/',
  'ExamLab/src/components/fragetypen/zeichnen/',
  'ExamLab/src/components/fragetypen/tkonto/',
  'ExamLab/src/components/fragetypen/HotspotFrage.tsx',
  'ExamLab/src/components/fragetypen/DragDropBildFrage.tsx',
  'ExamLab/src/components/fragetypen/BuchungssatzFrage.tsx',
  'ExamLab/src/components/fragetypen/MCFrage.tsx',
  // LP-Korrektur Hotspot-Anzeige
  'ExamLab/src/components/lp/korrektur/KorrekturFrageVollansicht/HotspotAnzeige.tsx',
  // Shared-Editor Content-SVGs
  'packages/shared/src/editor/typen/HotspotEditor.tsx',
  'packages/shared/src/editor/typen/DragDropBildEditor.tsx',
  'packages/shared/src/editor/components/ZonenOverlay.tsx',
]

function isWhitelisted(relPath) {
  return WHITELIST.some((entry) => relPath === entry || relPath.startsWith(entry))
}

const SVG_TAG_RE = /<svg\b/g

const filesRaw = execSync(
  `git ls-files 'ExamLab/*.ts' 'ExamLab/*.tsx' 'packages/shared/*.ts' 'packages/shared/*.tsx'`,
  { cwd: ROOT }
).toString()
const files = filesRaw.split('\n').filter(Boolean)

const whitelisted = []
const violations = []
let whitelistedSvgCount = 0

for (const relPath of files) {
  const absPath = join(ROOT, relPath)
  if (!existsSync(absPath)) continue
  const content = readFileSync(absPath, 'utf-8')
  const matches = content.match(SVG_TAG_RE)
  if (!matches) continue
  const count = matches.length

  if (isWhitelisted(relPath)) {
    whitelisted.push({ path: relPath, count })
    whitelistedSvgCount += count
    continue
  }

  violations.push({ path: relPath, count })
}

console.log('')
console.log('no-inline-svg-Audit:')
console.log(`  Files mit <svg> in Whitelist (Content-SVG/Icons): ${whitelisted.length} (${whitelistedSvgCount} tags)`)
console.log(`  Files mit <svg> ausserhalb Whitelist:             ${violations.length}`)

if (violations.length > 0) {
  console.log('')
  console.log('VIOLATIONS:')
  for (const v of violations) {
    console.log(`  FAIL: ${v.path} — ${v.count} <svg>-tag(s)`)
  }
  console.log('')
  if (STRICT) {
    console.log('FAIL: Inline-<svg> ausserhalb Whitelist. Entweder:')
    console.log('  (a) Lucide-Icon verwenden statt Inline-SVG (siehe FragetypIcon/IconMapping)')
    console.log('  (b) Custom-Icon in ExamLab/src/components/ui/icons/CustomIcons.tsx erweitern')
    console.log('  (c) Whitelist in scripts/audit-no-inline-svg.mjs erweitern (Content-SVG)')
    process.exit(1)
  } else {
    console.log('WARN: Run mit --strict um CI-Gate zu aktivieren.')
  }
} else {
  console.log('')
  console.log('OK: Alle Inline-<svg> sind whitelisted.')
}
