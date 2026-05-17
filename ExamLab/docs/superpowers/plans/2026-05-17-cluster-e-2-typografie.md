# Cluster E.2 — Typografie-Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all App-Chrome-Headings in ExamLab onto the 5-Tier `TYPO`-scale via a new `<PageTitle>` component, add a `lint:typo-tokens` baseline-watch CI gate, and ensure consistent typography hierarchy across all 5 top-level views.

**Architecture:** `TYPO` constants in `src/styles/typografie.ts` already exist (5-Tier-Skala: Display 24/700, H1 20/700, H2 18/600, Body 14/400, Caption 12/500). Migration covers 6 phases on feature-branch `feature/cluster-e-2-typografie`, each phase = 1 commit. Lint-gate activated only after migration completes. Tiptap-Editor-files are whitelisted because they render user-content headings dynamically.

**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4, Vitest, Node ESM scripts (mjs), bash ci-check chain.

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-17-cluster-e-2-typografie-design.md`

**Feature-Branch:** Already created — `feature/cluster-e-2-typografie` (HEAD `a7b19d2` with spec commits).

---

## File Structure

### New files

| Path | Purpose | LOC estimate |
|---|---|---|
| `ExamLab/src/components/shared/PageTitle.tsx` | Display-Title-Pattern wrapper (Padding + Border-Bottom + h1 with TYPO.display) | ~20 |
| `ExamLab/src/components/shared/PageTitle.test.tsx` | Renders + ARIA-role test | ~30 |
| `scripts/audit-typo-tokens.mjs` | Lint-Gate script analog to `audit-no-emoji.mjs` | ~120 |
| `scripts/typo-tokens-baseline.json` | Baseline snapshot file: total + per-file counts | data file |

### Modified files

| Path | Reason |
|---|---|
| `ExamLab/package.json` | New `lint:typo-tokens` script + add to `ci-check` chain |
| `ExamLab/src/components/ui/BaseDialog.tsx` | Replace hardcoded `text-xl font-bold` (line 52) with `TYPO.h2` |
| ~5 top-level view components | Add `<PageTitle>` |
| ~20 tab-content components (Einstellungen+Hilfe) | Replace tab-internal headings with `TYPO.h1` / `TYPO.h2` |
| ~30-40 modal/dialog files | Replace heading styles with `TYPO.h2` (mostly inheriting from BaseDialog default) |
| ~15-20 card components | Replace card-title styles with `TYPO.h2` |
| ~5-10 sub-section files | Replace inline sub-section headers with `TYPO.body font-semibold` or similar |

### Unchanged (whitelist for lint-gate)

| Path/Pattern | Reason |
|---|---|
| `packages/shared/src/editor/**` | Tiptap-based user-content editors |
| Any Tiptap-mount-points found during Phase 1 audit | Will be discovered + whitelisted explicitly |

---

## Task 0: Verify branch state and ci-check baseline

**Files:** none (verification only)

- [ ] **Step 1: Confirm current branch and clean tree**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && git branch --show-current && git status`
Expected: branch = `feature/cluster-e-2-typografie`, working tree clean.

If branch wrong: `git checkout feature/cluster-e-2-typografie`.

- [ ] **Step 2: Confirm ci-check baseline grün**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -20`
Expected: all gates green, build succeeds, vitest passes (~1839 + 4 todo per memory; may differ now).

Note actual test count for later comparison.

---

## Task 1 (Phase 1): Audit-Foundation + PageTitle component

**Files:**
- Create: `scripts/audit-typo-tokens.mjs`
- Create: `scripts/typo-tokens-baseline.json` (auto-generated)
- Create: `ExamLab/src/components/shared/PageTitle.tsx`
- Create: `ExamLab/src/components/shared/PageTitle.test.tsx`
- Modify: `ExamLab/package.json` (script entry only, NOT in ci-check yet)

### Sub-Task 1a: Write PageTitle test first (TDD)

- [ ] **Step 1: Write failing test**

Create `ExamLab/src/components/shared/PageTitle.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageTitle } from './PageTitle'
import { TYPO } from '../../styles/typografie'

describe('PageTitle', () => {
  it('rendert <h1> mit der titel-Prop als Text', () => {
    render(<PageTitle titel="Einstellungen" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Einstellungen')
  })

  it('applies TYPO.display classes to the heading', () => {
    render(<PageTitle titel="Hilfe" />)
    const heading = screen.getByRole('heading', { level: 1 })
    // TYPO.display = 'text-2xl font-bold' — check both tokens present
    for (const cls of TYPO.display.split(' ')) {
      expect(heading.className).toContain(cls)
    }
  })

  it('rendert mit Border-Bottom für visuellen Abschluss', () => {
    const { container } = render(<PageTitle titel="Test" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toMatch(/border-b/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ExamLab && npx vitest run src/components/shared/PageTitle.test.tsx`
Expected: FAIL — module not found / `PageTitle` is not exported.

### Sub-Task 1b: Implement PageTitle component

- [ ] **Step 3: Create PageTitle.tsx**

Create `ExamLab/src/components/shared/PageTitle.tsx`:

```tsx
import { TYPO } from '../../styles/typografie'

interface Props {
  titel: string
}

export function PageTitle({ titel }: Props) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <h1 className={TYPO.display}>{titel}</h1>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd ExamLab && npx vitest run src/components/shared/PageTitle.test.tsx`
Expected: all 3 tests PASS.

### Sub-Task 1c: Write audit-typo-tokens.mjs

- [ ] **Step 5: Create scripts/audit-typo-tokens.mjs**

Use `scripts/audit-no-emoji.mjs` as the structural template. Key differences:

1. **Detection regex (line-based, with template-literal-tolerance):**

```js
// Heading-Tag without TYPO. reference on the same line OR within ~3 lines (JSX-span)
const HEADING_OPEN_RE = /<h[1-6](\s|>)/g
// We scan each file, find <hN ...> openings, then check if TYPO. appears within the same
// JSX expression. Simple heuristic: read forward until matching `>` (allow multi-line).
```

2. **Algorithm:**

```js
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const STRICT = process.argv.includes('--strict')
const UPDATE_BASELINE = process.argv.includes('--baseline')

// Whitelist: Tiptap user-content editors render headings dynamically — not greppable.
const WHITELIST_PATTERNS = [
  /^packages\/shared\/src\/editor\//,
]

const baselinePath = join(ROOT, 'scripts/typo-tokens-baseline.json')

function isWhitelisted(relPath) {
  return WHITELIST_PATTERNS.some(re => re.test(relPath))
}

/**
 * Count heading tags (<h1..h6) NOT followed by TYPO. reference within their JSX expression.
 * Heuristic: for each `<h[1-6]` opening, read forward to matching `>` (allow multi-line
 * for `<h2\n  className={...}>`). If `TYPO.` does not appear in that span, it's a violation.
 */
function countViolations(content) {
  let count = 0
  let idx = 0
  while (true) {
    const match = content.substring(idx).match(/<h[1-6](\s|>)/)
    if (!match) break
    const openStart = idx + (match.index ?? 0)
    // Find matching `>` — naive scan ignoring nested template-literal braces
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
    if (!span) break  // unterminated; skip rest of file
    if (!/TYPO\./.test(span)) count++
    idx = pos + 1
  }
  return count
}

// Scope: ExamLab + packages/shared, .ts + .tsx
const filesRaw = execSync(
  `git ls-files 'ExamLab/*.ts' 'ExamLab/*.tsx' 'packages/shared/*.ts' 'packages/shared/*.tsx'`,
  { cwd: ROOT }
).toString()
const files = filesRaw.split('\n').filter(Boolean)

const currentCounts = {}  // relPath -> count
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
for (const [relPath, count] of Object.entries(currentCounts)) {
  const max = PER_FILE[relPath] ?? 0
  if (count > max) regressions.push({ path: relPath, found: count, baseline: max, diff: count - max })
}

console.log('')
console.log('typo-tokens-Audit:')
console.log(`  Baseline total:      ${baseline.totalCount}`)
console.log(`  Current total:       ${totalCurrent}`)
console.log(`  Files in baseline:   ${Object.keys(PER_FILE).length}`)
console.log(`  Files with current:  ${Object.keys(currentCounts).length}`)
console.log(`  Regressions:         ${regressions.length}`)

if (regressions.length > 0) {
  console.log('')
  console.log('REGRESSIONS (files above baseline):')
  for (const r of regressions) {
    console.log(`  FAIL: ${r.path} — ${r.found} matches (baseline: ${r.baseline}, +${r.diff})`)
  }
  if (STRICT) process.exit(1)
}

if (totalCurrent < baseline.totalCount) {
  console.log('')
  console.log(`IMPROVEMENT: total dropped from ${baseline.totalCount} to ${totalCurrent}.`)
  console.log(`Run with --baseline to lock in the improvement.`)
}

process.exit(0)
```

- [ ] **Step 6: Verify script syntax (dry-run without baseline)**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && node scripts/audit-typo-tokens.mjs --baseline`
Expected: writes `scripts/typo-tokens-baseline.json` with current violation count, prints summary like `Baseline updated: X violations across Y files`. **Note the X and Y numbers** for sanity-check across phases.

- [ ] **Step 7: Verify strict mode passes against the just-generated baseline**

Run: `node scripts/audit-typo-tokens.mjs --strict`
Expected: exit 0, summary shows `Regressions: 0`.

### Sub-Task 1d: Wire script into package.json (NOT in ci-check yet)

- [ ] **Step 8: Add lint:typo-tokens script entry (only)**

Edit `ExamLab/package.json` — add new line to scripts section, but DO NOT add to ci-check chain yet:

```diff
   "lint:no-inline-svg": "node ../scripts/audit-no-inline-svg.mjs --strict",
+  "lint:typo-tokens": "node ../scripts/audit-typo-tokens.mjs --strict",
```

Place the line alphabetically (after `lint:no-inline-svg`, before `test`/`build`).

- [ ] **Step 9: Verify script runs via npm**

Run: `cd ExamLab && npm run lint:typo-tokens`
Expected: exit 0, summary printed.

### Sub-Task 1e: Run ci-check (baseline still passes)

- [ ] **Step 10: Verify ci-check stays grün**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -10`
Expected: all gates still pass. (`lint:typo-tokens` is NOT in the chain yet — that comes in Phase 6.)

- [ ] **Step 11: Commit Phase 1**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/src/components/shared/PageTitle.tsx ExamLab/src/components/shared/PageTitle.test.tsx \
        ExamLab/package.json scripts/audit-typo-tokens.mjs scripts/typo-tokens-baseline.json
git status
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 1: PageTitle-Komponente + Audit-Skript-Foundation

Neu:
- src/components/shared/PageTitle.tsx (Display-Title-Pattern Wrapper)
- src/components/shared/PageTitle.test.tsx (3 Tests, alle grün)
- scripts/audit-typo-tokens.mjs (Lint-Gate analog audit-no-emoji.mjs)
- scripts/typo-tokens-baseline.json (Initial-Baseline)

Skript ist als `lint:typo-tokens` in ExamLab/package.json verdrahtet,
aber NICHT in ci-check-Chain — kommt in Phase 6 nach Migration.

Verhalten unverändert, Foundation für Phase 2-5 steht.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 (Phase 2): Page-Title-Pattern auf Top-Level-Seiten

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` (Prüfen/Üben/Fragensammlung Tabs)
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`
- Modify: `ExamLab/src/components/lp/HilfeSeite.tsx`
- Modify: `ExamLab/src/components/sus/SuSStartseite.tsx`
- Modify: any other top-level view discovered in audit step

### Sub-Task 2a: Audit current top-level views

- [ ] **Step 1: Grep App.tsx for top-level component returns**

Run: `grep -n "return <\|return (" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/src/App.tsx" | head -20`
Expected: identifies components used as top-level (LPStartseite, SuSStartseite, LoginScreen, Layout, Startbildschirm).

- [ ] **Step 2: Inspect LPStartseite tab structure**

Run: `grep -n "aktiverTab\|setAktiverTab\|switch (aktiverTab)" "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/src/components/lp/LPStartseite.tsx" | head -20`
Expected: shows the internal tab-switching (Prüfen, Üben, Fragensammlung, Favoriten, Papierkorb).

- [ ] **Step 3: List candidate top-level surfaces**

Document in chat which surfaces will get a PageTitle:
1. LP top-level dashboard surfaces (likely 4-5 internal tab-views inside LPStartseite)
2. EinstellungenPanel (separate panel)
3. HilfeSeite (separate)
4. SuSStartseite (SuS-side)
5. SuS-Üben surface (if separate from SuSStartseite)

Decide PER SURFACE: where exactly does `<PageTitle>` go — top of which component, replacing what existing heading.

### Sub-Task 2b: Add PageTitle to EinstellungenPanel

- [ ] **Step 4: Read EinstellungenPanel top**

Run: `head -60 "ExamLab/src/components/settings/EinstellungenPanel.tsx"`
Identify: existing title heading (if any) and the JSX root structure.

- [ ] **Step 5: Add `<PageTitle titel="Einstellungen" />` as first child of root**

Use Edit tool. Pattern:
```tsx
// Before (example — actual code differs):
return (
  <div className="...">
    {/* tabs and content */}
  </div>
)

// After:
return (
  <div className="...">
    <PageTitle titel="Einstellungen" />
    {/* tabs and content */}
  </div>
)
```

If a redundant title already exists (e.g. `<h1>Einstellungen</h1>`), remove it.

Add import: `import { PageTitle } from '../shared/PageTitle'` (relative path correct for `components/settings/`).

- [ ] **Step 6: Run EinstellungenPanel tests if any exist**

Run: `cd ExamLab && npx vitest run --grep EinstellungenPanel`
Expected: pass. If headings-by-role-tests break, update them.

### Sub-Task 2c: Add PageTitle to HilfeSeite

- [ ] **Step 7: Read HilfeSeite top + check existing test**

Run: `head -40 "ExamLab/src/components/lp/HilfeSeite.tsx"` and `head -30 "ExamLab/src/components/lp/HilfeSeite.test.tsx"`

- [ ] **Step 8: Add `<PageTitle titel="Hilfe" />` as first child of root**

Pattern same as EinstellungenPanel.

- [ ] **Step 9: Update HilfeSeite tests if heading-role expectations changed**

Run: `cd ExamLab && npx vitest run src/components/lp/HilfeSeite.test.tsx`
Expected: pass. Adjust any `getByRole('heading')` calls accordingly.

### Sub-Task 2d: Add PageTitle to LP Dashboard surfaces

- [ ] **Step 10: Decide LP-Surface strategy**

LPStartseite has internal tabs. Decision:

**Option A:** One PageTitle in LPStartseite root with dynamic `titel` based on `aktiverTab` (e.g. "Prüfen" / "Üben" / "Fragensammlung").

**Option B:** PageTitle inside each tab-content section.

**Recommendation:** Option A — single PageTitle in LPStartseite, dynamic titel. Matches single-source-of-truth for surface-titel. Implementation:

```tsx
const surfaceTitel = {
  pruefen: 'Prüfen',
  ueben: 'Üben',
  fragensammlung: 'Fragensammlung',
  favoriten: 'Favoriten',
  papierkorb: 'Papierkorb',
}[aktiverTab] ?? 'Übersicht'

return (
  <div className="...">
    <PageTitle titel={surfaceTitel} />
    {/* tabs */}
  </div>
)
```

- [ ] **Step 11: Implement chosen option**

Edit `LPStartseite.tsx`. Add import + map + PageTitle render.

- [ ] **Step 12: Run LPStartseite tests**

Run: `cd ExamLab && npx vitest run src/components/lp/LPStartseite.test.tsx 2>&1 | tail -30`
Expected: pass. Adjust assertions if heading-role-expectations broke.

### Sub-Task 2e: Add PageTitle to SuS surfaces

- [ ] **Step 13: Read SuSStartseite root**

Run: `head -50 "ExamLab/src/components/sus/SuSStartseite.tsx"`

- [ ] **Step 14: Add `<PageTitle titel="Üben" />` (or matching label per current SuS-surface)**

If SuS has internal tab-switching, apply same dynamic-titel logic as Sub-Task 2d.

### Sub-Task 2f: ci-check + Browser-E2E

- [ ] **Step 15: Run ci-check**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -15`
Expected: all gates grün.

- [ ] **Step 16: Browser-E2E**

Use `npm run dev` or `npm run preview` after `npm run build`. Test plan:
1. Login as LP `wr.test@gymhofwil.ch`
2. Visit each LP-Top-Level (Prüfen, Üben, Fragensammlung, Favoriten, Papierkorb tabs in LPStartseite) — verify Display-Titel oben links, Border-Bottom darunter.
3. Open Einstellungen — verify "Einstellungen" Display-Titel.
4. Open Hilfe — verify "Hilfe" Display-Titel.
5. Logout, login as SuS `wr.test@stud.gymhofwil.ch`, navigate to SuS-Üben — verify Display-Titel.
6. Test Light + Dark mode for each.

Document results in chat (under "Test Results"). Screenshots optional but encouraged for first/last page.

- [ ] **Step 17: Re-run audit-typo-tokens to see drift**

Run: `node scripts/audit-typo-tokens.mjs --baseline`
Note: total count may have changed if any heading was added/removed. Don't update baseline yet — phase 6 does that.

- [ ] **Step 18: Commit Phase 2**

```bash
git add -A
git status
git diff --stat
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 2: Page-Title-Pattern auf N Top-Level-Seiten

PageTitle hinzugefügt zu:
- EinstellungenPanel
- HilfeSeite
- LPStartseite (dynamic titel je aktiverTab)
- SuSStartseite

Browser-E2E (Light + Dark, LP + SuS-Login) verifiziert: alle Top-Level
zeigen Display-Titel oben links mit Border-Bottom.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 (Phase 3): Tab-Inhalt-Header (Einstellungen + Hilfe)

**Files:**
- Modify: 10 Einstellungen-Tab files in `ExamLab/src/components/settings/` + `ExamLab/src/components/lp/einstellungen/`
- Modify: 10 Hilfe-Tab files in `ExamLab/src/components/lp/hilfe/` (path to verify)

### Sub-Task 3a: Locate all tab-content files

- [ ] **Step 1: Find Einstellungen tab content files**

Run: `cd ExamLab && find src/components -path "*/einstellungen/*" -name "*.tsx" -not -name "*.test.tsx" | head -20 && echo --- && find src/components/settings -name "*Tab*.tsx" -not -name "*.test.tsx" | head -20`
Document: list of Einstellungen-tab-files mapped to Tab-Registry IDs (profil, lernziele, favoriten, problemmeldungen, uebungen, fragensammlung, testdaten, tags, admin, ki-kalibrierung).

- [ ] **Step 2: Find Hilfe tab content files**

Run: `find src/components -path "*/hilfe/*" -name "*.tsx" -not -name "*.test.tsx" | head -20 && echo --- && grep -rln "HilfeSeite\|TabSection\|HilfeTab" src/components/lp/ | head -20`
Document: list of Hilfe-tab-files. May be inline-rendered inside HilfeSeite — adapt accordingly.

### Sub-Task 3b: Migrate Einstellungen tabs

For each of the ~10 Einstellungen-tab files:

- [ ] **Step 3a-j (one per tab): Migrate tab heading**

For each file:
1. Find the top-level heading inside the tab content (typically `<h2>` or `<h3>` near the top).
2. Replace its className with `TYPO.h1`.
3. If the tag is `<h3>` or `<h4>`, also upgrade tag-level to `<h1>` (semantic correctness — Tab-Content-Heading is H1 inside the surface).
4. Add `import { TYPO } from '../../../styles/typografie'` (adjust relative path).
5. Any sub-section header below: `TYPO.h2`.

Example transformation:

```tsx
// Before
<h3 className="text-sm font-semibold text-slate-700 mb-2">
  Mein Profil
</h3>

// After
import { TYPO } from '../../../styles/typografie'
...
<h1 className={TYPO.h1}>Mein Profil</h1>
```

- [ ] **Step 4: Run vitest for Einstellungen tests**

Run: `cd ExamLab && npx vitest run --grep "Einstellungen\|Profil\|Lernziele\|Favoriten\|Problem\|Übungen\|Fragensammlung\|Testdaten\|Tags\|Admin\|KIKalibrierung" 2>&1 | tail -20`
Expected: pass. Adjust heading-role-tests where needed.

### Sub-Task 3c: Migrate Hilfe tabs

- [ ] **Step 5a-j (one per tab): Migrate Hilfe tab headings**

Same pattern as Einstellungen. 10 tabs (einstieg, fragen, pruefung, durchfuehrung, korrektur, ueben, ki, bloom, zusammenarbeit, faq).

If Hilfe tabs are rendered inline inside HilfeSeite via a section-array or component-map, fix the heading template at the rendering location (1 edit instead of 10).

- [ ] **Step 6: Run vitest for HilfeSeite test**

Run: `cd ExamLab && npx vitest run src/components/lp/HilfeSeite.test.tsx`
Expected: pass.

### Sub-Task 3d: ci-check + Browser-E2E

- [ ] **Step 7: Run ci-check**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -15`
Expected: all gates grün.

- [ ] **Step 8: Browser-E2E**

Test plan:
1. Login as LP. Open Einstellungen.
2. Visit each tab (Profil, Lernziele, Favoriten, Problemmeldungen, Übungen, Fragensammlung, Testdaten, Tags, Admin, KI-Kalibrierung) — verify each tab-content has a clear `<h1 TYPO.h1>` title at top.
3. Open Hilfe. Visit each of the 10 sections — verify each has `<h1 TYPO.h1>` title.
4. Hierarchy check: Display > H1 > H2 sichtbar konsistent.
5. Light + Dark.

Document results.

- [ ] **Step 9: Commit Phase 3**

```bash
git add -A
git diff --stat
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 3: Tab-Inhalt-Header (20 Tabs auf TYPO.h1/h2)

10 Einstellungen-Tabs + 10 Hilfe-Tabs migriert:
- Tab-Haupttitel auf <h1 className={TYPO.h1}>
- Sub-Section-Header auf TYPO.h2

Browser-E2E: alle 20 Tabs zeigen einheitliche Tab-Header-Hierarchie.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4 (Phase 4): Modal/Dialog-Titel

**Files:**
- Modify: `ExamLab/src/components/ui/BaseDialog.tsx` (central default — biggest leverage)
- Modify: any modal/dialog that renders its own heading inline (NOT using BaseDialog's `title` prop)

### Sub-Task 4a: Migrate BaseDialog default

- [ ] **Step 1: Apply TYPO.h2 to BaseDialog default title**

Edit `ExamLab/src/components/ui/BaseDialog.tsx`:

Find line 51-54 (the `{title && <h2 ...>` block):
```tsx
// Before
<h2 id={titleId} className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
  {title}
</h2>

// After
<h2 id={titleId} className={`${TYPO.h2} text-slate-800 dark:text-slate-100 mb-4`}>
  {title}
</h2>
```

Add import: `import { TYPO } from '../../styles/typografie'`

**Important:** `TYPO.h2` = `text-lg font-semibold` (18px) — smaller than the current `text-xl font-bold` (20px). This is the intended hierarchy change (Modal-Titel kleiner als Tab-Header).

- [ ] **Step 2: Run BaseDialog-related tests**

Run: `cd ExamLab && npx vitest run --grep "BaseDialog\|Dialog\|Modal" 2>&1 | tail -30`
Expected: pass. Adjust any tests asserting specific className strings.

### Sub-Task 4b: Find non-BaseDialog modals with inline headings

- [ ] **Step 3: Grep for modal-like components with inline h2/h3**

Run: `cd ExamLab && grep -rln "role=.dialog.\|aria-modal" src/ --include="*.tsx" | head -20`
Then for each: `grep -n "<h[1-6]" <file>` to check if it renders its own heading.

Candidate non-BaseDialog modals (verify in audit):
- `src/components/AbgabeDialog.tsx`
- `src/components/Layout.tsx` (if modal-like dialogs inside)
- `src/components/shared/FeedbackModal.tsx`
- `src/components/lp/einstellungen/tags/MergeTagsModal.tsx` (uses BaseDialog — should inherit)
- `src/components/lp/einstellungen/tags/TagEditModal.tsx` (uses BaseDialog — should inherit)
- ConfirmModal, BatchConfirmModal, BatchLoeschConfirmModal, ResetConfirmModal — check each.

- [ ] **Step 4: For each non-BaseDialog modal, migrate heading**

For each identified file: replace heading-className with `${TYPO.h2}` template, add import.

### Sub-Task 4c: ci-check + Browser-E2E

- [ ] **Step 5: Run ci-check**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -15`
Expected: grün.

- [ ] **Step 6: Browser-E2E modal sweep**

Test plan:
1. Login as LP. Open one modal per category:
   - BaseDialog-Konsument: e.g. TagEditModal (Einstellungen → Tags → Edit-Icon).
   - ConfirmModal: e.g. delete-confirmation in Fragensammlung.
   - BatchConfirmModal: trigger via Batch-Edit-Flow in FragenBrowser.
   - FeedbackModal: open via help-button or similar.
2. Verify each modal title uses TYPO.h2 (sichtbar kleiner als Tab-Header, größer als Body-Text).
3. Light + Dark.

- [ ] **Step 7: Commit Phase 4**

```bash
git add -A
git diff --stat
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 4: Modal/Dialog-Titel auf TYPO.h2

- BaseDialog Default-Titel-Style auf TYPO.h2 umgestellt (single source).
  Alle BaseDialog-Konsumenten erben automatisch.
- N non-BaseDialog-Modals manuell migriert.

Modal-Titel jetzt 18px font-semibold (vorher 20px font-bold) —
matched Hierarchie unter Tab-Headern.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 (Phase 5): Karten + Sub-Section-Header

**Files:**
- Modify: ~15-20 card components (PruefungsKarte, ConfigListe, KorrekturFrageKarte, FragenZeile, KompaktZeile, DetailKarte, TagsListe entries, etc.)
- Modify: ~5-10 sub-section files with inline `<h3>` for nested-section-headers

### Sub-Task 5a: Audit cards

- [ ] **Step 1: List card-like components**

Run: `cd ExamLab && find src -name "*Karte*.tsx" -not -name "*.test.tsx" | head -20 && echo --- && find src -name "*Zeile*.tsx" -not -name "*.test.tsx" | head -20 && echo --- && find src -name "*Liste*.tsx" -not -name "*.test.tsx" | head -20`

Document files to migrate.

- [ ] **Step 2: For each card file, check existing heading**

Run for each: `grep -n "<h[1-6]" <file>`

If a card has a title heading, plan: replace its className with `TYPO.h2` for the card-title.

### Sub-Task 5b: Migrate card headings

- [ ] **Step 3a-z (one per card file): Migrate**

For each card component:
1. Add `import { TYPO } from '<relative-path>/styles/typografie'`
2. Replace heading className with `TYPO.h2` (or `TYPO.body + ' font-semibold'` for smaller card headers like FragenZeile-Compact).
3. Run colocated tests if present.

Heuristik:
- **Featured / large cards** (PruefungsKarte, ConfigListe entries): `TYPO.h2`.
- **Compact list-items** (FragenZeile.tsx, KompaktZeile): `TYPO.body + ' font-semibold'` — Card-Title sollte body-size sein wenn die Karte selbst nur 1-2 Zeilen ist.
- **Inline sub-section headers** in larger tabs: `TYPO.h2`.

### Sub-Task 5c: ci-check + Browser-E2E

- [ ] **Step 4: Run ci-check**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -15`
Expected: grün.

- [ ] **Step 5: Browser-E2E card sweep**

Test plan:
1. LP-Login → Prüfen-Tab → visuelle Verifikation PruefungsKarte.
2. Fragensammlung → FragenZeile / KompaktZeile / DetailKarte ansehen.
3. Korrektur → KorrekturFrageKarte (in einer offenen Korrektur).
4. Einstellungen → Tags → TagsListe.
5. Light + Dark.

- [ ] **Step 6: Commit Phase 5**

```bash
git add -A
git diff --stat
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 5: Karten + Sub-Section-Header

N Karten-Komponenten migriert:
- Grosse Karten (PruefungsKarte, ConfigListe): TYPO.h2
- Kompakte List-Items (FragenZeile, KompaktZeile): TYPO.body + font-semibold
- Inline Sub-Section-Header in Tabs: TYPO.h2

Browser-E2E: Karten visuell konsistent in Light + Dark.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 (Phase 6): Lint-Gate aktivieren

**Files:**
- Modify: `scripts/typo-tokens-baseline.json` (regenerate)
- Modify: `ExamLab/package.json` (add `lint:typo-tokens` to ci-check chain)

### Sub-Task 6a: Re-generate baseline

- [ ] **Step 1: Run audit script with --baseline to capture post-migration state**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && node scripts/audit-typo-tokens.mjs --baseline`
Expected: prints `Baseline updated: N violations across M files`. **N should be substantially lower than Phase 1 baseline.**

Document: Phase 1 baseline count → Phase 6 post-migration count. The drop is the migration impact metric.

- [ ] **Step 2: Inspect typo-tokens-baseline.json**

Verify the file contains only files that are intentionally not migrated (whitelist-equivalent — typically zero or very few entries remaining).

- [ ] **Step 3: Decide on remaining baseline entries**

For each file with `count > 0` in baseline:
- Is this legitimate (Tiptap-mount, intentional non-TYPO heading)? → Keep in baseline.
- Is this a missed migration? → Re-open Phase 5 for that file.

Per spec acceptance criteria 5/6: 80% threshold for modals/cards. If baseline still contains >20% of original modals/cards, re-do Phase 4/5 for the misses.

### Sub-Task 6b: Wire lint:typo-tokens into ci-check chain

- [ ] **Step 4: Add lint:typo-tokens to ci-check chain**

Edit `ExamLab/package.json` ci-check line:

```diff
- "ci-check": "npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract && npm run lint:no-emoji && npm run lint:no-inline-svg && npm test && npm run build",
+ "ci-check": "npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract && npm run lint:no-emoji && npm run lint:no-inline-svg && npm run lint:typo-tokens && npm test && npm run build",
```

- [ ] **Step 5: Run full ci-check chain**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -20`
Expected: ALL gates grün including the new `lint:typo-tokens`.

### Sub-Task 6c: Test the gate by injecting a violation

- [ ] **Step 6: Temporarily inject a violation**

Pick a recently-modified file from Phase 2-5, add a regression `<h3 className="text-sm">Test</h3>` line.

Run: `cd ExamLab && npm run lint:typo-tokens`
Expected: exit 1, regression listed.

- [ ] **Step 7: Revert the test injection**

Restore the file.

Run again: `cd ExamLab && npm run lint:typo-tokens`
Expected: exit 0.

- [ ] **Step 8: Commit Phase 6**

```bash
git add -A
git diff --stat
git commit -m "$(cat <<'EOF'
Cluster E.2 Phase 6: lint:typo-tokens als CI-Gate aktiviert

Baseline: M Files mit N legitimen Resttreffern (Tiptap-Whitelist etc.).
ci-check-Chain: lint:typo-tokens vor npm test eingereiht.

Migration komplett:
- Phase 1: PageTitle + Audit-Skript ✅
- Phase 2: PageTitle auf X Top-Level ✅
- Phase 3: TYPO.h1/h2 auf 20 Tabs ✅
- Phase 4: BaseDialog + N Modals ✅
- Phase 5: M Karten ✅
- Phase 6: Lint-Gate live ✅

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: HANDOFF + Memory Update + Merge

### Sub-Task 7a: Update HANDOFF

- [ ] **Step 1: Append to HANDOFF.md**

Edit `ExamLab/HANDOFF.md` (or root HANDOFF.md) with a section like:

```markdown
## 📍 STAND 2026-05-17 — Cluster E.2 Typografie komplett

**Feature-Branch:** `feature/cluster-e-2-typografie` (HEAD <SHA>)
**Spec:** `ExamLab/docs/superpowers/specs/2026-05-17-cluster-e-2-typografie-design.md`
**Plan:** `ExamLab/docs/superpowers/plans/2026-05-17-cluster-e-2-typografie.md`

6 Phasen komplett, ci-check grün. Browser-E2E LP + SuS Light + Dark verifiziert.
Baseline `scripts/typo-tokens-baseline.json` mit N Resttreffern (Whitelist).
```

### Sub-Task 7b: Memory Update (durch User getrieben oder durch separate Skill-Invocation)

- [ ] **Step 2: Update auto-memory MEMORY.md hot-picks**

The current MEMORY.md is stale (references HEAD `986dbbc` while actual is now post-E.2). Update the "Nächste Session — Hot Picks" section to reflect:
- E.2 LIVE (with branch + spec + plan paths)
- E.3-E.5 next pickable
- Other open spawn-tasks unchanged

### Sub-Task 7c: Merge to main

- [ ] **Step 3: Final ci-check before merge**

Run: `cd ExamLab && npm run ci-check 2>&1 | tail -10`
Expected: grün.

- [ ] **Step 4: Check user-facing test plan is documented**

Confirm all Browser-E2E results from Phases 2/3/4/5 are recorded in chat.

- [ ] **Step 5: Ask user for merge freigabe**

Per `regression-prevention.md` Phase 5 — explicit user merge approval needed. Tell user:

> "E.2 Migration komplett auf `feature/cluster-e-2-typografie`. Browser-E2E LP + SuS in Light + Dark grün. ci-check grün auf jedem Phase-Commit. Bereit für Merge zu main?"

- [ ] **Step 6: After user OK — merge + push**

```bash
git checkout main
git pull
git merge --ff-only feature/cluster-e-2-typografie
git push origin main
```

If FF-merge fails (main has moved): rebase or re-coordinate per project conventions. Don't force-push to main.

- [ ] **Step 7: Optional — also push branch to preview**

```bash
git push origin main:preview
```

Per memory `feedback_github_push_gruen` — keep preview in sync.

- [ ] **Step 8: Delete feature branch (after main is live)**

```bash
git branch -d feature/cluster-e-2-typografie
```

---

## Open issues / discoveries during plan execution

Track items found during phases that are out-of-scope for E.2 but worth noting:

- Files with conditional className on `<h*>` tags that the audit-regex can't detect: track as Phase 1 discovery, decide pattern (template-literal with `${TYPO.h2}` vs. helper `mitTypo()`).
- Tests breaking from heading-role-changes: track per phase, fix inline.
- Layout/padding collisions between PageTitle and existing surface containers: track, fix inline.
- Hierarchy decisions for compact cards (h2 vs body+semibold): document the heuristic chosen in Phase 5 commit message.

---

## Skills referenced

- @superpowers:executing-plans (or @superpowers:subagent-driven-development if subagents available)
- @superpowers:test-driven-development (use for PageTitle test + any other new tests)
- @superpowers:verification-before-completion (run ci-check + Browser-E2E before claiming phase complete)
- @superpowers:systematic-debugging (if any phase shows regression in unrelated tests)
- @superpowers:finishing-a-development-branch (for Task 7 merge phase)
