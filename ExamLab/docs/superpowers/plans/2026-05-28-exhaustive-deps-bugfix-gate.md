# exhaustive-deps — Bug-Fix + Wins + Gate — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 1 real stale-closure bug + 2 unstable-memo perf issues + transform 11 ref-in-cleanup findings to the recommended pattern, then freeze the remaining intentional/safe exhaustive-deps findings by extending the react-doctor gate.

**Architecture:** Targeted React-hooks fixes across `src/` (one deps fix, two memo-stabilizations, eleven `ref.current`→local-snapshot transforms), then extend the existing `scripts/audit-react-doctor-state.mjs` gate to also track `exhaustive-deps` with a regenerated baseline capturing the post-fix state.

**Tech Stack:** React 19 + TS + Zustand, vitest + @testing-library/react, react-doctor@0.2.10 (already pinned).

**Spec:** `ExamLab/docs/superpowers/specs/2026-05-28-exhaustive-deps-bugfix-gate-design.md` (Anhang A = full triage).
**Reference rules:** `.claude/rules/code-quality.md` (React-hooks patterns), `.claude/rules/regression-prevention.md` (critical paths + fragetype E2E groups), `.claude/rules/bilder-in-pools.md` (Zeichnen/PDF specifics).

**Working branch:** `feature/exhaustive-deps-bugfix-gate` (spec committed at `c8b836b`).

---

## File Structure

| File | Change |
|---|---|
| `src/hooks/usePruefungsMonitoring.ts` | Bug fix: add `backendVerfuegbar` to deps (line ~277) |
| `src/hooks/usePruefungsMonitoring.test.ts` (or colocated) | New/extended test for the online-listener re-registration |
| `src/components/lp/durchfuehrung/AktivPhase.tsx` | Stabilize `zeitverlaengerungen` (memoize source) |
| `src/components/lp/ueben/AnalyseDashboard.tsx` | Stabilize `fortschritte` (memoize source) |
| 11 ref-in-cleanup files (see Tasks 3-4) | `ref.current`→local-snapshot transform |
| `scripts/audit-react-doctor-state.mjs` | Add `'exhaustive-deps'` to `RULES` (line 32) |
| `scripts/react-doctor-state-baseline.json` | Regenerated baseline (state rules + exhaustive-deps) |
| `ExamLab/HANDOFF.md` | Session note |

**Note on testing approach:** The bug fix (Task 1) and memo fixes (Task 2) get focused tests where feasible. The 11 ref-transforms (Tasks 3-4) are **behavior-preserving refactors** — verification is "existing tests + tsc still pass" + browser-E2E (the transform changes *which* ref value cleanup reads, observable only in specific unmount-timing scenarios that aren't unit-testable; the recommended-pattern transform is correct by construction). This matches how the codebase handles mechanical refactors.

---

## Task 1: Fix the real bug — usePruefungsMonitoring online-listener deps

**Files:**
- Modify: `src/hooks/usePruefungsMonitoring.ts` (line ~277)
- Test: colocated `src/hooks/usePruefungsMonitoring.test.ts` (check if it exists first)

- [ ] **Step 1: Read the current effect + check for existing tests**

Read `src/hooks/usePruefungsMonitoring.ts:250-278` (the online/offline effect) and confirm line ~277 deps = `[config, abgegeben, setVerbindungsstatus]`, and `handleOnline` (line ~256) reads `backendVerfuegbar`. Check whether a test file exists (`ls src/hooks/usePruefungsMonitoring.test.ts` or grep tests dir).

- [ ] **Step 2: Write a failing test (if feasible)**

Attempt a focused `renderHook` test: render the hook with conditions making `backendVerfuegbar=false` (e.g. `user.email` absent / `apiService.istKonfiguriert()` mocked false), dispatch a `window` `'online'` event → assert `processQueue` (mock `../services/retryQueue.ts`) is NOT called; then change conditions so `backendVerfuegbar=true`, rerender, dispatch `'online'` again → assert `processQueue` IS called.
- **Before the fix** this second assertion FAILS (listener wasn't re-registered because deps omit `backendVerfuegbar`).
- **If the hook is too invasive to mount in isolation** (many store deps — likely): document the skip with a one-line reason and rely on Step 5 browser-E2E + the consistency argument (siblings at 133/204/217 already include `backendVerfuegbar`). Do NOT force a brittle test.

Run: `npx vitest run src/hooks/usePruefungsMonitoring.test.ts`
Expected (if written): FAIL on the second assertion.

- [ ] **Step 3: Apply the fix**

Change line ~277 from:
```ts
}, [config, abgegeben, setVerbindungsstatus])
```
to:
```ts
}, [config, abgegeben, setVerbindungsstatus, backendVerfuegbar])
```
(`processQueue` is a module import — stable, not needed in deps.)

- [ ] **Step 4: Verify test passes + tsc**

Run: `npx vitest run src/hooks/usePruefungsMonitoring.test.ts` (if test written → PASS) and `npx tsc -b` (clean).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePruefungsMonitoring.ts src/hooks/usePruefungsMonitoring.test.ts
git commit -m "fix(monitoring): backendVerfuegbar in online-listener deps (Retry-Queue bei Reconnect)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
(Browser-E2E of the heartbeat/reconnect path happens in Task 6.)

---

## Task 2: Stabilize 2 unstable-memo values (perf)

**Files:**
- Modify: `src/components/lp/durchfuehrung/AktivPhase.tsx` (`zeitverlaengerungen` source, used in useMemo at line ~59)
- Modify: `src/components/lp/ueben/AnalyseDashboard.tsx` (`fortschritte` source, used in useMemo at line ~74)

- [ ] **Step 1: Find each unstable value's declaration**

In each file, find where the flagged value is declared (ABOVE the flagged useMemo). The react-doctor message says it "makes dependencies of useMemo change on every render" → the value is recreated each render (typically a `?? {}` / `?? []` fallback or an inline `.filter()`/object literal).
- `AktivPhase.tsx`: find `zeitverlaengerungen` declaration (likely `config.zeitverlaengerungen ?? {}`).
- `AnalyseDashboard.tsx`: find `fortschritte` declaration.

- [ ] **Step 2: Wrap the declaration in useMemo**

Transform e.g.:
```ts
const zeitverlaengerungen = config.zeitverlaengerungen ?? {}
```
into:
```ts
const zeitverlaengerungen = useMemo(() => config.zeitverlaengerungen ?? {}, [config.zeitverlaengerungen])
```
Same pattern for `fortschritte` (memoize on its true source dep). This stabilizes the downstream useMemo's deps. (If the value is computed via a non-trivial expression, memoize that whole expression.)

- [ ] **Step 3: Verify the flagged findings are gone + tsc + tests**

Run: `npx tsc -b` (clean) and `node ../scripts/audit-react-doctor-state.mjs --baseline` is NOT run yet — instead spot-check: `(cd .. && node_modules/.bin/react-doctor ExamLab --full --lint --no-dead-code --no-score --json --json-compact 2>/dev/null | jq -r '[.projects[0].diagnostics[] | select(.rule=="exhaustive-deps" and (.filePath|test("AktivPhase|AnalyseDashboard")))] | length')` → expect `0`.
Run `npx vitest run` for the two components' tests (if any) — PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/durchfuehrung/AktivPhase.tsx src/components/lp/ueben/AnalyseDashboard.tsx
git commit -m "perf(memo): unstable useMemo-Deps stabilisieren (AktivPhase, AnalyseDashboard)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: ref-in-cleanup transform — debounceRef group (5 files)

**Files (each: snapshot `debounceRef.current` to a local var inside the effect, use the local in the cleanup):**
- `src/components/fragetypen/CodeFrageComponent.tsx:58`
- `src/components/fragetypen/FreitextFrage.tsx:109`
- `src/components/fragetypen/PDFFrage.tsx:158`
- `src/components/lp/korrektur/PDFKorrektur.tsx:160`
- `src/components/lp/korrektur/ZeichnenKorrektur.tsx:206`

- [ ] **Step 1: Apply the canonical transform per file**

For each file, read the flagged effect. The pattern is a cleanup that reads `debounceRef.current`. Transform:
```ts
// BEFORE
useEffect(() => {
  // ...
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
}, [...])

// AFTER
useEffect(() => {
  // ... (if the effect itself assigns debounceRef.current, snapshot AFTER the last assignment,
  //      or capture the ref object and read .current in cleanup only if that's the intent)
  return () => {
    const t = debounceRef.current
    if (t) clearTimeout(t)
  }
}, [...])
```
**Important nuance:** for a debounce timer you usually WANT cleanup to clear whatever timer is currently pending — so capturing `debounceRef.current` *inside the cleanup* (as the local `const t`) is the correct intent and silences the warning. Read each effect to confirm the cleanup's intent before transforming; do not change timing semantics. If a file's cleanup genuinely needs the latest `.current`, the `const t = debounceRef.current` inside the returned function is the right form.

- [ ] **Step 2: Verify findings gone + tsc + tests**

Run: `npx tsc -b` (clean). Spot-check the 5 files no longer flagged (stream form, one line per finding):
`(cd .. && node_modules/.bin/react-doctor ExamLab --full --lint --no-dead-code --no-score --json --json-compact 2>/dev/null | jq -r '.projects[0].diagnostics[] | select(.rule=="exhaustive-deps" and (.filePath|test("CodeFrageComponent|FreitextFrage|PDFFrage|PDFKorrektur|ZeichnenKorrektur"))) | "\(.filePath):\(.line)"')` → expect the 5 debounceRef lines (CodeFrage:58, FreitextFrage:109, PDFFrage:158, PDFKorrektur:160, ZeichnenKorrektur:206) gone (note: PDFFrage has OTHER intentional findings that stay).
Run `npx vitest run` for affected components — PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/CodeFrageComponent.tsx src/components/fragetypen/FreitextFrage.tsx src/components/fragetypen/PDFFrage.tsx src/components/lp/korrektur/PDFKorrektur.tsx src/components/lp/korrektur/ZeichnenKorrektur.tsx
git commit -m "refactor(hooks): debounceRef-Cleanup-Snapshot (5 Fragetypen/Korrektur)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: ref-in-cleanup transform — timer/stream/drawing/PDF group (6 files)

**Files:**
- `src/components/ui/Tooltip.tsx:29` (`timerRef.current`)
- `src/hooks/useDebouncedHover.ts:38` (`timerRef.current`)
- `src/hooks/useAudioRecorder.ts:28` (`streamRef.current`)
- `src/components/fragetypen/zeichnen/useStiftRendering.ts:96` (`istAktivRef.current`)
- `src/components/fragetypen/ZeichnenFrage.tsx:121` (`inaktivitaetRef.current`)
- `src/components/fragetypen/pdf/usePDFRenderer.ts:111` (`docRef.current`)

- [ ] **Step 1: Apply the canonical snapshot transform per file**

Same pattern as Task 3 (snapshot `xxxRef.current` to a local inside the effect/cleanup). **Read each effect first** — these vary (a stream needs `stream.getTracks().forEach(t => t.stop())`, a PDF doc needs `doc.destroy()`, etc.). Capture the ref value at the correct point:
```ts
useEffect(() => {
  const stream = streamRef.current
  // ...
  return () => { stream?.getTracks().forEach(t => t.stop()) }   // use captured `stream`
}, [...])
```
Preserve exact cleanup semantics; only change `xxxRef.current` reads in cleanup to use the captured local.

- [ ] **Step 2: Verify findings gone + tsc + tests**

`npx tsc -b` clean. Spot-check:
`(cd .. && node_modules/.bin/react-doctor ExamLab --full --lint --no-dead-code --no-score --json --json-compact 2>/dev/null | jq -r '[.projects[0].diagnostics[] | select(.rule=="exhaustive-deps" and (.filePath|test("Tooltip|useDebouncedHover|useAudioRecorder|useStiftRendering|ZeichnenFrage|usePDFRenderer")))] | length')` → expect `0`.
`npx vitest run` for affected units — PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Tooltip.tsx src/hooks/useDebouncedHover.ts src/hooks/useAudioRecorder.ts src/components/fragetypen/zeichnen/useStiftRendering.ts src/components/fragetypen/ZeichnenFrage.tsx src/components/fragetypen/pdf/usePDFRenderer.ts
git commit -m "refactor(hooks): ref.current-Cleanup-Snapshot (Timer/Stream/Zeichnen/PDF)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Extend gate to exhaustive-deps + regenerate baseline

**Files:**
- Modify: `scripts/audit-react-doctor-state.mjs` (line 32 RULES set)
- Modify: `scripts/react-doctor-state-baseline.json` (regenerated)

- [ ] **Step 1: Add the rule to the RULES set**

In `scripts/audit-react-doctor-state.mjs` line 32:
```js
const RULES = new Set(['no-adjust-state-on-prop-change', 'no-cascading-set-state', 'exhaustive-deps'])
```

- [ ] **Step 2: Regenerate the baseline (captures post-fix state)**

Run (from repo root): `node scripts/audit-react-doctor-state.mjs --baseline`
Expected: `Baseline updated: N findings across M files` where N ≈ 42 (state) + ~51 (exhaustive-deps post-fix) ≈ **93**, and `rules` now lists all 3.

- [ ] **Step 3: Verify the baseline reflects the fixes**

Run: `jq '{total: ([.per_file_max[]]|add), files:(.per_file_max|length), rules}' scripts/react-doctor-state-baseline.json`.
Cross-check the fixed files dropped correctly:
- `usePruefungsMonitoring.ts`: was 2 (1 cascading@250-state-rule... wait that's state) — for exhaustive-deps it had 2 (204+277); after the bug fix it should have **1** (204 remains, intentional). Confirm the per-file count for `usePruefungsMonitoring.ts` is consistent (state-rule entries + 1 exhaustive-deps), NOT 0.
- `AktivPhase.tsx`, `AnalyseDashboard.tsx`: exhaustive-deps entries gone.
- The 11 ref-transform files: their `debounceRef`/`timerRef`/etc. exhaustive-deps entries gone (files with OTHER intentional findings like PDFFrage keep those).
Then confirm `node scripts/audit-react-doctor-state.mjs --strict` → exit 0, "OK".

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-react-doctor-state.mjs scripts/react-doctor-state-baseline.json
git commit -m "ci(react-doctor-gate): exhaustive-deps in Gate-Regelmenge + Baseline (post-fix)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Browser-E2E + full ci-check + HANDOFF + merge gate

**Files:** Modify `ExamLab/HANDOFF.md`.

- [ ] **Step 1: Full ci-check (the pre-push path, incl. the extended gate)**

Run: `cd ExamLab && npm run ci-check` → all gates pass (incl. `lint:react-doctor-state` now covering exhaustive-deps), vitest, build. Note any react-doctor-state-gate timing.

- [ ] **Step 2: Browser-E2E (PFLICHT — sensitive paths touched)**

Per `.claude/rules/regression-prevention.md` Phase 3, with real LP+SuS logins (no demo). Write the test-plan first, then test:
- **Bug fix path (critical path 2):** SuS exam → Timer running → Heartbeat/Auto-Save indicator → simulate offline→online (DevTools Network offline toggle) → confirm queued answers flush + "Gespeichert". Console 0 errors.
- **ref-transform fragetype groups** (`regression-prevention.md` Verwandtschaftsgruppen): Bild/Medien (PDF-Annotation, Zeichnen), Audio-Aufnahme (record + playback), Spezial-Editoren (Code, Formel, Freitext). For each: the debounce/timer/stream/cleanup behaves as before (answer saves, navigation away cleans up, no console errors).
- LP Korrektur: PDFKorrektur + ZeichnenKorrektur (debounce-save still works).
Document results.

- [ ] **Step 3: Update HANDOFF.md**

Dated entry: exhaustive-deps triage (65 → 1 real bug fixed + 2 perf + 11 ref-transforms), gate extended to exhaustive-deps (baseline ~93), branch + commits, E2E result. Note the bug (backendVerfuegbar) + that it's the standout bug-jagd catch.

- [ ] **Step 4: Commit HANDOFF**

```bash
git add ExamLab/HANDOFF.md
git commit -m "docs(handoff): exhaustive-deps Bug-Fix + Wins + Gate

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 5: Merge gate (STOP — needs user OK)**

This touches exam-critical + sensitive fragetype code → browser-E2E is REQUIRED (done Step 2), not optional. Report to user: what changed, ci-check result, E2E results, the 1 real bug fixed. **Wait for explicit "Merge OK"**, then:
```bash
git checkout main && git merge --ff-only feature/exhaustive-deps-bugfix-gate
git push origin main main:preview
git branch -d feature/exhaustive-deps-bugfix-gate
```
Then watch the GitHub Actions run (`gh run watch`) to confirm green (the extended gate runs in CI now too).

---

## Risks / watch-items (from spec §8)

- **Bug fix hard to E2E** (offline→online + queue) — attempt DevTools offline toggle; fall back to unit test + sibling-consistency argument.
- **Sensitive-file churn** (11 ref-transforms) — preserve exact cleanup semantics; per-fragetype E2E.
- **Baseline arithmetic** — `usePruefungsMonitoring.ts` exhaustive-deps count drops 2→1 (not to 0); verify per-file, not just total.
