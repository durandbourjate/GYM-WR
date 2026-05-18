#!/usr/bin/env node
/**
 * Audit-Skript: Storybook-Coverage für Icon-Galerie.
 *
 * Hintergrund: Cluster G Icon-System lebt von zwei Source-of-Truth-Maps:
 * - `LUCIDE_KEY_MAP` in `ExamLab/src/components/ui/icons/NavIcon.tsx`
 * - `FRAGETYP_ICON_MAP` in `ExamLab/src/components/ui/icons/FragetypIcon.tsx`
 *
 * Beide Maps werden auch in der Storybook-Icon-Galerie
 * (`ExamLab/src/components/ui/icons/Icons.stories.tsx`) gerendert. Dieses
 * Gate stellt sicher, dass die Story alle Map-Einträge berücksichtigt —
 * andernfalls bleiben neu hinzugefügte Icons unsichtbar in der visuellen
 * Drift-Prevention.
 *
 * Strategie: Da `Icons.stories.tsx` die Maps via `Object.entries(...)`
 * iteriert, ist Coverage automatisch garantiert SOLANGE die Story die
 * Maps direkt importiert. Dieses Skript prüft das.
 *
 * Aufruf:
 *   node scripts/audit-storybook-coverage.mjs            # report-only
 *   node scripts/audit-storybook-coverage.mjs --strict   # exit 1 bei Coverage-Lücke
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')

const STORY_PATH = join(ROOT, 'ExamLab/src/components/ui/icons/Icons.stories.tsx')
const REQUIRED_MAP_IMPORTS = [
  { source: './NavIcon', name: 'LUCIDE_KEY_MAP' },
  { source: './FragetypIcon', name: 'FRAGETYP_ICON_MAP' },
]

function fail(messages) {
  console.error('storybook-coverage-Audit:')
  for (const m of messages) console.error('  ' + m)
  if (STRICT) process.exit(1)
}

function ok(stats) {
  console.log('storybook-coverage-Audit:')
  console.log('  Story:                  ', STORY_PATH.replace(ROOT + '/', ''))
  for (const r of stats) {
    console.log(`  ${r.name.padEnd(24)} ${r.iterated ? 'iterated (auto-coverage)' : 'FEHLT'}`)
  }
}

if (!existsSync(STORY_PATH)) {
  fail(['Icons.stories.tsx nicht gefunden: ' + STORY_PATH])
} else {
  const src = readFileSync(STORY_PATH, 'utf8')
  const probleme = []
  const stats = []

  for (const { source, name } of REQUIRED_MAP_IMPORTS) {
    // Import-Check: import { NAME } from 'SOURCE'
    const importRe = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"]${source}['"]`)
    const imported = importRe.test(src)
    // Iteration-Check: Object.entries(NAME) oder Object.keys(NAME) oder NAME[...]
    const iterRe = new RegExp(`Object\\.(entries|keys|values)\\(\\s*${name}\\s*\\)`)
    const iterated = iterRe.test(src)

    stats.push({ name, imported, iterated })

    if (!imported) {
      probleme.push(`FAIL: ${name} wird nicht aus '${source}' importiert.`)
    } else if (!iterated) {
      probleme.push(
        `FAIL: ${name} importiert aber nicht via Object.entries/keys/values iteriert — ` +
          `neue Icons werden in der Galerie unsichtbar.`,
      )
    }
  }

  if (probleme.length > 0) {
    fail([
      ...probleme,
      '',
      'Fix: In Icons.stories.tsx beide Maps importieren UND via Object.entries(MAP)',
      '     in die Galerie speisen. Beispiel siehe NavigationIcons-Story.',
    ])
  } else {
    ok(stats)
    console.log('  Status:                  alle Icon-Maps werden in der Galerie iteriert.')
  }
}
