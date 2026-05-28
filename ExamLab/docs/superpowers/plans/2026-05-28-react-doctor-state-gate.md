# react-doctor State-Correctness Gate — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CI/pre-push gate that fails when the per-file count of two react-doctor state-correctness rules (`no-adjust-state-on-prop-change`, `no-cascading-set-state`) rises above a frozen, verified-clean baseline.

**Architecture:** A standalone Node script (`scripts/audit-react-doctor-state.mjs`) runs the pinned react-doctor binary in lint-only mode, parses the JSON, counts the two rules per file, and compares against `scripts/react-doctor-state-baseline.json`. It mirrors the existing `scripts/audit-no-emoji.mjs` (`--strict` / `--baseline` flags, `per_file_max` map, IMPROVEMENT-drift report). Wired into the `ci-check` chain → runs in the pre-push hook.

**Tech Stack:** Node ESM (`.mjs`), `react-doctor@0.2.10` (pinned devDep), npm-workspaces monorepo (binary hoisted to repo-root `node_modules/.bin`).

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-28-react-doctor-state-gate-design.md`

**Reference rules:** `.claude/rules/code-quality.md` (S129/S130 patterns), `.claude/rules/deployment-workflow.md` (branch/merge gate).

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `ExamLab/package.json` | Pin `react-doctor` devDep; add `lint:react-doctor-state` script; add to `ci-check` chain | Modify |
| `package-lock.json` (repo root) | Lockfile after `npm install` | Modify (generated) |
| `scripts/audit-react-doctor-state.mjs` | The gate: run react-doctor, parse, per-file count, compare to baseline, `--strict`/`--baseline` | Create |
| `scripts/react-doctor-state-baseline.json` | Frozen `per_file_max` baseline (42 findings) | Create (generated via `--baseline`) |
| `ExamLab/HANDOFF.md` | Session handoff note | Modify |

**Working branch:** `feature/react-doctor-state-gate` (already created; spec committed at `f6c93f9`).

**Note on testing approach:** The 9 sibling audit scripts (`audit-no-emoji.mjs`, `audit-musterloesung.sh`, …) have **no unit tests** — they are verified behaviorally (run the script, assert exit code + output). This plan follows that established pattern: each task's verification runs the actual gate against known states (clean → pass; injected regression → fail; removed finding → drift). Inventing a vitest harness for one repo-root tooling script would diverge from the project pattern (YAGNI).

---

## Task 1: Pin react-doctor as exact devDep

**Files:**
- Modify: `ExamLab/package.json` (devDependencies)
- Modify: `package-lock.json` (repo root, generated)

- [ ] **Step 1: Add the pinned devDep**

In `ExamLab/package.json`, add to `devDependencies` (exact version, NO caret):
```json
"react-doctor": "0.2.10"
```

- [ ] **Step 2: Install at repo root**

Run (from repo root):
```bash
npm install
```
Expected: completes; `react-doctor@0.2.10` added. `package-lock.json` updated.

- [ ] **Step 3: Verify the binary resolves from the hoisted root**

Run (from repo root):
```bash
node_modules/.bin/react-doctor --version
```
Expected: prints `0.2.10`. (Workspace hoisting puts the binary at **repo-root** `node_modules/.bin`, not `ExamLab/node_modules`.)
If it does NOT resolve there, STOP — the script's `RD_BIN` path assumption (Task 2) is wrong; report back.

- [ ] **Step 4: Verify non-interactive lint-only run works from ExamLab**

Run (from repo root):
```bash
(cd ExamLab && ../node_modules/.bin/react-doctor --full --lint --no-dead-code --no-score --json --json-compact | head -c 200)
```
Expected: prints the start of a JSON object (`{"schemaVersion":...`), does NOT hang waiting for input. (Confirms non-TTY safety — no `-y` needed; verified during brainstorming.)

Also confirm each per-diagnostic object uses the key **`filePath`** — already verified from the captured benchmark JSON (`{"filePath":"src/components/AutoSaveIndikator.tsx","plugin":"react-doctor","rule":"no-cascading-set-state",...}`). If a future react-doctor version renames it, adjust `d.filePath` in the script (Task 2, the `currentCounts` loop).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/package.json package-lock.json
git commit -m "build(react-doctor-gate): react-doctor@0.2.10 als exakt-gepinnte devDep

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: Write the audit script

**Files:**
- Create: `scripts/audit-react-doctor-state.mjs`

- [ ] **Step 1: Create the script with the full implementation below**

```js
#!/usr/bin/env node
/**
 * Audit-Skript: Regression-Gate für zwei react-doctor State-Correctness-Regeln.
 *
 * Regeln: `no-adjust-state-on-prop-change` (S129-Muster) + `no-cascading-set-state`
 * (S130-Risiko). Am 28.05.2026 wurden alle 42 Findings triagiert → 0 echte Bugs
 * (alle benigne Load-Effects / Timer-mit-Cleanup / bereits-angewendete Remedies).
 * Dieses Gate friert den sauberen Stand ein: neue Verletzungen über die Baseline
 * failen CI. Triage-Audit-Trail: specs/2026-05-28-react-doctor-state-gate-design.md.
 *
 * Muster: Baseline-Snapshot wie scripts/audit-no-emoji.mjs (per_file_max, Counts
 * statt Zeilennummern → robust gegen Zeilen-Verschiebung).
 *
 * Aufruf:
 *   node scripts/audit-react-doctor-state.mjs            # report-only
 *   node scripts/audit-react-doctor-state.mjs --strict   # exit 1 bei Regression (CI-Gate)
 *   node scripts/audit-react-doctor-state.mjs --baseline # regeneriert per_file_max
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

const RULES = new Set(['no-adjust-state-on-prop-change', 'no-cascading-set-state'])
const baselinePath = join(ROOT, 'scripts/react-doctor-state-baseline.json')
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
      'Baseline für lint:react-doctor-state. per_file_max = Count der 2 State-Regeln pro Datei. Bei Anstieg failt CI. Regenerieren: node scripts/audit-react-doctor-state.mjs --baseline (nur mit Begründung erhöhen).',
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
console.log('react-doctor-state-Audit (no-adjust-state-on-prop-change + no-cascading-set-state):')
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
    console.log('\nFAIL: Neue State-Correctness-Verletzung. Entweder:')
    console.log('  (a) Den neuen useEffect fixen (Render-Loop-Guard / Sync-on-id /')
    console.log('      key-Remount — siehe .claude/rules/code-quality.md S129/S130)')
    console.log('  (b) Falls bewusst benigne: per_file_max in')
    console.log('      scripts/react-doctor-state-baseline.json erhöhen (mit Begründung)')
    process.exit(1)
  } else {
    console.log('\nWARN: Run mit --strict für CI-Gate.')
  }
} else {
  console.log('\nOK: Keine State-Correctness-Regression über Baseline.')
}

if (drifts.length > 0) {
  console.log(`\nIMPROVEMENT: ${drifts.length} Datei(en) unter Baseline — kann gesenkt werden (--baseline).`)
  for (const d of drifts.slice(0, 5)) {
    console.log(`  ${d.path} — aktuell ${d.found}, baseline ${d.baseline} (−${d.diff})`)
  }
  if (drifts.length > 5) console.log(`  … +${drifts.length - 5} weitere`)
}
```

- [ ] **Step 2: Verify the script errors cleanly when no baseline exists yet (report mode)**

Run (from repo root):
```bash
node scripts/audit-react-doctor-state.mjs
```
Expected: exit 2, message `FATAL: Baseline fehlt … Erst mit --baseline erzeugen.` (The baseline file does not exist yet — this confirms the guard.)

---

## Task 3: Generate and verify the baseline

**Files:**
- Create: `scripts/react-doctor-state-baseline.json` (generated)

- [ ] **Step 1: Generate the baseline**

Run (from repo root):
```bash
node scripts/audit-react-doctor-state.mjs --baseline
```
Expected: prints `Baseline updated: 42 findings across N files`, writes `scripts/react-doctor-state-baseline.json`.

- [ ] **Step 2: Verify the baseline content matches the triage inventory**

Run (from repo root):
```bash
cat scripts/react-doctor-state-baseline.json
```
Expected: `per_file_max` total = **42**. Cross-check the files against Anhang A of the spec — e.g. `useKorrekturDaten.ts` should be 6, `VorbereitungPhase.tsx` 4, `FormelFrageComponent.tsx` 3, `useTabKonflikt.ts` 2, `useTestdatenStatus.ts` 2, `KorrekturEinsicht.tsx` 2, `Startbildschirm.tsx` 2. `react_doctor_version` = `0.2.10`.

- [ ] **Step 3: Verify a clean run passes**

Run (from repo root):
```bash
node scripts/audit-react-doctor-state.mjs --strict; echo "exit=$?"
```
Expected: `OK: Keine State-Correctness-Regression über Baseline.`, `exit=0`.

- [ ] **Step 4: Commit script + baseline together**

```bash
git add scripts/audit-react-doctor-state.mjs scripts/react-doctor-state-baseline.json
git commit -m "feat(react-doctor-gate): audit-react-doctor-state.mjs + Baseline (42, sauber)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Wire into package.json + ci-check

**Files:**
- Modify: `ExamLab/package.json` (scripts)

- [ ] **Step 1: Add the npm script**

In `ExamLab/package.json` `scripts`, after `lint:storybook-coverage`:
```json
"lint:react-doctor-state": "node ../scripts/audit-react-doctor-state.mjs --strict",
```

- [ ] **Step 2: Add to the ci-check chain**

In `ExamLab/package.json`, extend the `ci-check` script to include the new gate **before** `npm test`:
```json
"ci-check": "npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung && npm run lint:wire-contract && npm run lint:no-emoji && npm run lint:no-inline-svg && npm run lint:typo-tokens && npm run lint:storybook-coverage && npm run lint:react-doctor-state && npm test && npm run build",
```

- [ ] **Step 3: Verify the gate runs standalone**

Run (from repo root):
```bash
npm run lint:react-doctor-state --prefix ExamLab; echo "exit=$?"
```
Expected: `OK: Keine State-Correctness-Regression über Baseline.`, `exit=0`.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/package.json
git commit -m "ci(react-doctor-gate): lint:react-doctor-state in ci-check (pre-push)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Behavioral verification — regression + drift detection

This task makes NO commits. It proves the gate actually catches a regression and reports drift, then fully reverts. (Mirrors the positive-test discipline from `.claude/rules/code-quality.md` — verify the gate detects real change, not just passes on clean.)

- [ ] **Step 1: Inject a new cascading-set-state finding**

Pick a small component WITHOUT a baseline entry. Temporarily add a useEffect with 3 setState calls. Simplest: in an existing `.tsx` with local state, add near the other hooks:
```tsx
useEffect(() => { setA(1); setB(2); setC(3) }, [])
```
(Use real existing setters, or add throwaway `useState`s. The goal is to trip `no-cascading-set-state`.) Note the file you chose.

- [ ] **Step 2: Verify the gate FAILS**

Run (from repo root):
```bash
node scripts/audit-react-doctor-state.mjs --strict; echo "exit=$?"
```
Expected: `REGRESSIONS:` lists your file with `+1`, prints the `(a)/(b)` guidance, `exit=1`.

- [ ] **Step 3: Revert the injection completely**

```bash
git checkout -- <the-file-you-edited>
git status --short   # expect empty
```

- [ ] **Step 4: Verify drift (improvement) reporting**

Temporarily comment out ONE *currently-flagged* effect in a baselined file — consult `scripts/react-doctor-state-baseline.json` for which files/counts. Good target: the debounced KaTeX-preview `useEffect` in `FormelFrageComponent.tsx` (the one with deps `[eingabe, katexGeladen]`; it carries the cascade@92 + adjust findings, so removing it should drop ~3). NOTE: do NOT pick the `setEingabe` sync effect on `[frage.id]` — that one is already-handled and is NOT in the baseline. Then:
```bash
node scripts/audit-react-doctor-state.mjs; echo "exit=$?"
```
Expected: `IMPROVEMENT:` lists that file (`−1`), `exit=0` (drift is not a failure). Then revert:
```bash
git checkout -- <the-file-you-edited>
git status --short   # expect empty
```

- [ ] **Step 5: Confirm clean state restored**

Run (from repo root):
```bash
node scripts/audit-react-doctor-state.mjs --strict; echo "exit=$?"
git status --short
```
Expected: `OK`, `exit=0`, empty git status.

---

## Task 6: Full ci-check + HANDOFF, ready for merge gate

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Run the full ci-check (the real pre-push path)**

Run (from repo root):
```bash
cd ExamLab && npm run ci-check
```
Expected: all gates pass INCLUDING `lint:react-doctor-state`, then vitest (2131+ passed) + build succeed. Note the added ~7s from react-doctor is acceptable.

- [ ] **Step 2: Update HANDOFF.md**

Add a dated entry under "NÄCHSTE SESSION" summarizing: triage of all 42 state-correctness findings → 0 bugs; gate `lint:react-doctor-state` added (pre-push, ~7s, baseline 42); spec + plan paths; the `--no-score`-memory correction; the deploy.yml CI-coverage-gap note (separate follow-up).

- [ ] **Step 3: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "docs(handoff): react-doctor-state Gate live + Triage-Bilanz

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 4: Merge gate (STOP — needs user OK)**

This is a CI-tooling change with **no app behavior change** → no browser E2E required (N/A per `.claude/rules/regression-prevention.md`; that gate targets runtime behavior). Verification = the gate's own behavioral tests (Task 5) + full ci-check green (Step 1).

Report to the user: what changed, ci-check result, that browser-E2E is N/A and why. **Wait for explicit "Merge OK"** before:
```bash
git checkout main && git merge --ff-only feature/react-doctor-state-gate
git push origin main
git push origin main:preview   # keep preview in sync (deployment-workflow.md lesson)
git branch -d feature/react-doctor-state-gate
```

---

## Risks / watch-items (from spec §8)

- **Binary resolution** in hoisted monorepo (Task 1 Step 3 is the gate for this). If it fails, fall back to `npx react-doctor@0.2.10` in the script (with download caveat).
- **react-doctor version drift** — exact-pin + `react_doctor_version` in baseline; bump = regenerate baseline.
- **CI deploy.yml coverage gap** (no-emoji etc. are pre-push-only) — out of scope, flag as separate follow-up.
