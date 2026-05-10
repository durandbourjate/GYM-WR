# Bundle Legacy-Naming-Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all legacy tokens `fragenbank` → `fragensammlung` and `lernplattform*` → `ueben*` (action-strings + identifiers + sheet-name prefix) across Frontend + Apps-Script in a single Hard-Cut deploy.

**Architecture:** 4-phase rename (no functional changes). Phase 1 = `fragenbank` cleanup (no wire-contract change). Phase 2 = `lernplattform*` action-strings (Hard-Cut wire-contract rename — Apps-Script + Frontend deployed simultaneously). Phase 3 = Sheet-prefix + `apps-script-lernen/` deletion. Phase 4 = Browser-E2E + Drive-Cleanup-Brief + HANDOFF/Memory.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 (PWA), Google Apps Script backend, Vitest, GitHub Actions CI.

**Spec:** [2026-05-10-legacy-naming-cleanup-design.md](../specs/2026-05-10-legacy-naming-cleanup-design.md)

**Branch:** `refactor/legacy-naming-cleanup` (von `main` @ `08c4a38`)

**Verification commands (used throughout):**
- vitest: `cd ExamLab && npm run test -- --run`
- tsc: `cd ExamLab && npx tsc -b`
- lint suite: `cd ExamLab && npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung`
- build: `cd ExamLab && npm run build`

---

## Task 0: Pre-Flight Baseline

**Goal:** Establish numerical baseline before changes. This snapshot is the reference for every "drift = 0" check.

**Files:**
- No code changes
- Output: comments in commit messages or a temporary `audit-baseline.txt` (delete after Phase 4)

- [ ] **Step 1: Verify branch + working state clean**

```bash
cd "/path/to/GYM-WR-DUY"
git status
# expected: On branch refactor/legacy-naming-cleanup, working tree clean
git log --oneline ^main HEAD
# expected: 3 spec commits (891a822, 633fdcb, ddc5afc)
```

- [ ] **Step 2: Run baseline vitest + record count**

```bash
cd ExamLab
npm run test -- --run 2>&1 | tail -5
# expected: "Test Files X passed (X)" + "Tests Y passed (Y)" — record Y as baseline
```

- [ ] **Step 3: Run baseline lint + tsc + build**

```bash
npx tsc -b
# expected: clean (exit 0)
npm run lint:as-any
# expected: 0/0/0
npm run lint:no-alert
# expected: 0
npm run lint:no-tests-dir
# expected: clean
npm run lint:musterloesung
# expected: Baseline (drift = 0)
npm run build
# expected: vite build grün, PWA generateSW
```

- [ ] **Step 4: Run baseline grep counts (record for verification)**

```bash
echo "fragenbank in src/:"; grep -rIli "fragenbank" src | wc -l
# expected: 14
echo "lernplattform in src/:"; grep -rIli "lernplattform" src | wc -l
# expected: 19
echo "case 'lernplattform' in apps-script-code.js:"; grep -cE "case ['\"]lernplattform[A-Z]" apps-script-code.js
# expected: 32
echo "function lernplattform in apps-script-code.js:"; grep -cE "^function lernplattform[A-Z]" apps-script-code.js
# expected: 36
```

---

## Phase 1: `fragenbank` → `fragensammlung`

### Task 1.1: Apps-Script-Konstanten umbenennen

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 120, 285, 770, 9265–9268)

**Stellen:**
- `FRAGENBANK_SYSTEM_TABS` (Const, Z. 120)
- `FRAGENBANK_SYSTEM_TABS` (Ref, Z. 285)
- `FRAGENBANK_SYSTEM_TABS` (Ref, Z. 770)
- `var fragenbankTabs = getFragensammlungTabs_();` (Z. 9265)
- `for (var t = 0; t < fragenbankTabs.length; t++)` (Z. 9267)
- `var tabName = fragenbankTabs[t];` (Z. 9268)

- [ ] **Step 1: Edit apps-script-code.js — `FRAGENBANK_SYSTEM_TABS` → `FRAGENSAMMLUNG_SYSTEM_TABS`**

Use Edit tool with `replace_all: true` on `apps-script-code.js`:
- old_string: `FRAGENBANK_SYSTEM_TABS`
- new_string: `FRAGENSAMMLUNG_SYSTEM_TABS`

- [ ] **Step 2: Edit apps-script-code.js — `fragenbankTabs` → `fragensammlungTabs`**

Use Edit tool with `replace_all: true` on `apps-script-code.js`:
- old_string: `fragenbankTabs`
- new_string: `fragensammlungTabs`

- [ ] **Step 3: Verify token-cleanup in apps-script-code.js**

```bash
cd ExamLab
grep -n "fragenbank\|FRAGENBANK" apps-script-code.js
# expected: 0 matches
grep -cn "FRAGENSAMMLUNG_SYSTEM_TABS" apps-script-code.js
# expected: 3 (Const-Def + 2 Refs)
grep -cn "fragensammlungTabs" apps-script-code.js
# expected: 3 (Var-Def + 2 Refs)
```

- [ ] **Step 4: vitest baseline (Apps-Script-Code wird nicht direkt von Tests gelesen, aber sicherstellen dass nichts zerbricht)**

```bash
npm run test -- --run 2>&1 | tail -3
# expected: same baseline test count, 0 failures
```

- [ ] **Step 5: Commit Task 1.1 (zwischen-Commit, optional — kann auch in 1.8 final-Commit gebündelt werden)**

Empfehlung: kein Sub-Commit per Task; alle Phase-1-Edits laufen, dann in Task 1.8 ein einziger Phase-1-Commit. Sub-Commits machen Rollback chaotisch bei Token-Rename-Bündel.

---

### Task 1.2: src/ Components umbenennen (4 Files)

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/SuSVorschau.tsx`
- Modify: `ExamLab/src/components/lp/fragensammlung/fragenbrowser/FragenBrowserHeader.tsx`
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturDashboard.tsx`
- Modify: `ExamLab/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx`

- [ ] **Step 1: Pro File grep `fragenbank`/`Fragenbank` und Kontext-Zeile lesen**

Pro File:
```bash
grep -n "fragenbank\|Fragenbank" src/components/lp/vorbereitung/SuSVorschau.tsx
```

Wiederholen für alle 4 Files.

- [ ] **Step 2: Pro Treffer entscheiden: UI-String oder Identifier?**

Erwartung: 99% UI-Strings (Bundle M war UI-only). Beispiele:
- `<h2>Fragenbank</h2>` → `<h2>Fragensammlung</h2>`
- `aria-label="Fragenbank durchsuchen"` → `aria-label="Fragensammlung durchsuchen"`

Falls Identifier-Treffer auftaucht (z.B. `props.fragenbankRef`), separat handlen mit Caller-Audit.

- [ ] **Step 3: Edit pro File — case-sensitive replace**

Pro File mit Edit tool `replace_all: true`:
- `Fragenbank` → `Fragensammlung`
- `fragenbank` → `fragensammlung` (separater Edit-Call falls Konstanten-Refs auch im Kontext)

- [ ] **Step 4: Pro File grep-Verifikation**

```bash
grep -ni "fragenbank" src/components/lp/vorbereitung/SuSVorschau.tsx
# expected: 0 matches
```

Wiederholen für alle 4 Files.

- [ ] **Step 5: vitest run (UI-Tests könnten fail wegen Test-Strings die noch „Fragenbank" suchen — ist OK, kommt in Task 1.3)**

```bash
npm run test -- --run src/components/lp 2>&1 | tail -5
# tolerieren: einige UI-Tests könnten wegen Test-String-Mismatch fail
```

---

### Task 1.3: src/ Tests umbenennen (7 Files)

**Files:**
- Modify: `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`
- Modify: `ExamLab/src/tests/LPStartseite.test.tsx`
- Modify: `ExamLab/src/tests/fragenBrowserEditorPrefetch.test.tsx`
- Modify: `ExamLab/src/tests/FragenBrowser.test.tsx`
- Modify: `ExamLab/src/components/lp/LPAppHeaderContainer.test.tsx`
- Modify: `ExamLab/src/components/sus/SuSAppHeaderContainer.test.tsx`
- Modify: `ExamLab/src/store/authStore.test.ts`

- [ ] **Step 1: Pro File grep + Kontext lesen**

```bash
grep -n "fragenbank\|Fragenbank" src/tests/authStoreLoginPrefetch.test.ts
```

Wiederholen für alle 7 Files. Kontext-Zeilen lesen (`Read` Tool 5 Zeilen Context).

- [ ] **Step 2: Treffer-Klassifikation**

Pro Treffer entscheiden:
- (a) Test-String der UI-Text "Fragenbank" prüft → auf "Fragensammlung" umstellen
- (b) `vi.mock('./fragenbankStore')`-Path-Ref → siehe Task 1.7 (Dead-Mocks)
- (c) Identifier-Ref auf nicht-existierenden Store → siehe Task 1.7

Treffer der Kategorie (a) jetzt umstellen, (b)+(c) markieren für Task 1.7.

- [ ] **Step 3: Edit Kategorie-(a)-Treffer pro File**

Pro File case-sensitive Edit:
- `'Fragenbank'` → `'Fragensammlung'` (in screen.getByText etc.)
- `"Fragenbank"` → `"Fragensammlung"`

- [ ] **Step 4: Verifikation pro File: nur (b)+(c)-Treffer übrig**

```bash
grep -n "fragenbank\|Fragenbank" src/tests/authStoreLoginPrefetch.test.ts
# expected: nur noch vi.mock-Pfade übrig (kommt in Task 1.7)
```

- [ ] **Step 5: vitest run (alle Tests sollten grün sein wieder)**

```bash
npm run test -- --run 2>&1 | tail -5
# expected: gleiche Test-Count wie Baseline, 0 failures
# falls Failures: Stop, Kontext lesen, Plan anpassen
```

---

### Task 1.4: src/ Hooks JSDoc umbenennen

**Files:**
- Modify: `ExamLab/src/hooks/useEditorNeighborPrefetch.ts`

- [ ] **Step 1: Read File + Treffer-Stelle lesen**

```bash
grep -n "fragenbank\|Fragenbank" src/hooks/useEditorNeighborPrefetch.ts
```

Erwartung: 1-2 Treffer in JSDoc-Kommentar.

- [ ] **Step 2: Edit case-sensitive**

- `Fragenbank` → `Fragensammlung`
- `fragenbank` → `fragensammlung`

- [ ] **Step 3: Verifikation**

```bash
grep -n "fragenbank\|Fragenbank" src/hooks/useEditorNeighborPrefetch.ts
# expected: 0 matches
```

---

### Task 1.5: src/ navigationStore route-token (LOAD-BEARING)

**Files:**
- Modify: `ExamLab/src/store/ueben/navigationStore.ts`

**Achtung:** `'adminFragenbank'` ist ein **route-token** in einer Union-Type. Caller setzen + lesen diesen Token. Rename erfordert Audit aller Caller.

- [ ] **Step 1: Read navigationStore.ts vollständig**

```bash
cat src/store/ueben/navigationStore.ts
# Token-Form identifizieren: z.B. type Route = 'lobby' | 'aktiv' | 'beendet' | 'adminFragenbank' | ...
```

- [ ] **Step 2: Caller-Audit über das gesamte src/-Verzeichnis**

```bash
grep -rIn "'adminFragenbank'\|\"adminFragenbank\"" src
# Liste aller Caller dokumentieren (Setter `.setRoute('adminFragenbank')`, Reader, JSX-Branches)
```

- [ ] **Step 3: Edit navigationStore.ts**

Mit Edit tool `replace_all: true` (oder File-spezifisch):
- `'adminFragenbank'` → `'adminFragensammlung'`
- `"adminFragenbank"` → `"adminFragensammlung"`

- [ ] **Step 4: Edit alle Caller**

Pro Caller-File aus Task-1.5-Step-2-Liste den Edit anwenden:
- `'adminFragenbank'` → `'adminFragensammlung'`

- [ ] **Step 5: Repo-wide Verifikation**

```bash
grep -rIn "adminFragenbank" src
# expected: 0 matches
grep -rIn "adminFragensammlung" src
# expected: gleiche Anzahl Treffer wie vor Task 1.5 mit alter Token-Form
```

- [ ] **Step 6: vitest run + tsc**

```bash
npm run test -- --run 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
# expected: vitest grün, tsc clean
# falls TS-Error: vermutlich Caller-Reference vergessen — nachholen
```

---

### Task 1.6: src/ authStore Storage-Drop-Code entfernen

**Files:**
- Modify: `ExamLab/src/store/authStore.ts` (Zeile ~159)

- [ ] **Step 1: Read authStore.ts:155-170**

Erwartung: Zeile 159 enthält `indexedDB.deleteDatabase('examlab-fragenbank-cache')` (oder ähnlich), wahrscheinlich in einer Logout-Helper-Function.

- [ ] **Step 2: Kontext-Block lesen**

Identifizieren: ist es ein einzelner statement, eingebettet in einen größeren `try`/`catch`-Block, oder Teil eines Promise-Chains?

- [ ] **Step 3: Edit — Drop-Code entfernen**

Den `deleteDatabase('examlab-fragenbank-cache')`-Statement (und ggf. dessen einrahmenden `try`/`onsuccess`/`onerror`-Block falls nur dieser eine DB-Drop drin war) entfernen.

Achtung: falls weitere DB-Drops (z.B. `examlab-fragensammlung-cache`) im selben Block stehen, **nur** den `fragenbank`-Drop entfernen, andere lassen.

- [ ] **Step 4: vitest run (authStore-Tests sollten grün sein, kein Test prüft den Drop)**

```bash
npm run test -- --run src/store/authStore 2>&1 | tail -3
```

- [ ] **Step 5: Verifikation**

```bash
grep -n "examlab-fragenbank-cache" src/store/authStore.ts
# expected: 0 matches
grep -rIn "examlab-fragenbank-cache" src
# expected: 0 matches (sollte nirgendwo mehr referenziert sein)
```

---

### Task 1.7: Dead-Mocks fixen (`vi.mock('./fragenbankStore')`)

**Files:**
- Audit + Modify: 6 Test-Files (laut Reviewer-Audit)

**Hintergrund:** Mehrere Tests mocken einen Pfad `./fragenbankStore` (oder `../store/fragenbankStore`, `../../store/fragenbankStore`) der nicht existiert (echter Store: `fragensammlungStore.ts`). Mocks sind dead-no-ops.

- [ ] **Step 1: Repo-wide Audit aller `vi.mock`-Calls auf Path-Variants**

```bash
grep -rIn "vi.mock\(['\"][^'\"]*fragenbankStore" src
# liefert ALLE Pfad-Variants ('./fragenbankStore', '../store/fragenbankStore', '../../store/fragenbankStore')
```

- [ ] **Step 2: Pro Treffer entscheiden: Mock fixen oder löschen?**

Pro Test-File:
- (a) Test braucht den Mock semantisch (Test-Logic referenziert `vi.mocked()` o.ä.) → **Pfad fixen** auf `'./fragensammlungStore'` oder relative-Pfad-Äquivalent
- (b) Test braucht den Mock nicht semantisch (Mock ist tote no-op aus Copy-Paste) → **Mock-Block löschen**

Heuristik: prüfen ob `vi.mocked(import von `fragenbankStore`)` irgendwo im Test-Body referenziert wird. Wenn nein → (b).

- [ ] **Step 3: Edit pro Test-File**

(a) Pfad fixen: `'./fragenbankStore'` → `'./fragensammlungStore'`
(b) Mock-Block entfernen (`vi.mock('./fragenbankStore', () => ({ ... }))` Multi-Line-Statement)

- [ ] **Step 4: Verifikation Test-File**

```bash
grep -n "fragenbankStore" src/tests/<file>
# expected: 0 matches
```

- [ ] **Step 5: vitest run**

```bash
npm run test -- --run 2>&1 | tail -5
# expected: gleiche Test-Count, 0 failures
# falls Failures: Mock war doch semantisch wichtig, anders als erwartet — Plan anpassen
```

---

### Task 1.8: Phase 1 Final-Verifikation + Commit

**Files:**
- No code changes
- git commit

- [ ] **Step 1: Repo-wide grep `fragenbank` (case-insensitive) — sollte nur Spec-/Plan-Files in `docs/` haben**

```bash
cd ExamLab
grep -rIli "fragenbank" src apps-script-code.js
# expected: 0 matches
grep -rIli "fragenbank" docs
# expected: spec + plan files (acceptable — docs can mention legacy term)
```

- [ ] **Step 2: Repo-wide grep `fragensammlung` — Anwesenheit beweisen**

```bash
grep -rIli "fragensammlung" src | wc -l
# expected: > Baseline (alle 14 fragenbank-Files + bestehende fragensammlung-Files)
```

- [ ] **Step 3: vitest + tsc + 4× lint + build**

```bash
npm run test -- --run 2>&1 | tail -3
# expected: gleiche Baseline-Count, 0 failures
npx tsc -b
# expected: clean
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
# expected: alle clean / Baseline
npm run build
# expected: vite build grün, PWA generateSW
```

- [ ] **Step 4: git diff Review**

```bash
cd ..
git diff --stat
# erwarteter Umfang: ~14 src/ Files + 1 apps-script-code.js + ggf. authStore.ts/-test.ts
git diff src/store/ueben/navigationStore.ts
# Visual-Sanity-Check route-token rename
```

- [ ] **Step 5: Commit Phase 1**

```bash
cd "/path/to/GYM-WR-DUY"
git add ExamLab/src ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
cleanup: fragenbank → fragensammlung (Phase 1/4)

- 14 src/ Files: 4 Components + 7 Tests + 1 Hook (JSDoc) +
  1 Store (route-token 'adminFragenbank') + 1 Storage-Drop-Code
- apps-script-code.js: FRAGENBANK_SYSTEM_TABS, fragenbankTabs (6 Stellen)
- Dead-Mocks vi.mock('./fragenbankStore') gefixt/entfernt

Bundle Legacy-Naming-Cleanup, kein Wire-Vertrag-Wechsel.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Code-Reviewer-Subagent dispatchen (für diese Phase)**

```
Agent tool: subagent_type "superpowers:code-reviewer"
description: "Phase 1 fragenbank-rename review"
prompt: Review commit <hash> on branch refactor/legacy-naming-cleanup. Focus: token-rename completeness, route-token caller-audit, dead-mock-fix correctness, no functional changes, vitest/tsc/lint/build clean.
```

Falls Reviewer Issues findet: fixen, neuen Commit, Reviewer re-dispatch.

---

## Phase 2: `lernplattform*` → `ueben*` action-Strings

### Task 2.1: Apps-Script doPost-Switch (32 case-Statements)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. ~1367-1445)

**Mapping:** Siehe [Spec §3 Phase 2 Mapping-Tabelle](../specs/2026-05-10-legacy-naming-cleanup-design.md) (33 Strings inkl. `lernplattformMarkiereKIFeedbackAlsIgnoriert`).

- [ ] **Step 1: Edit apps-script-code.js — `case 'lernplattform` → `case 'ueben`**

Mit Edit tool `replace_all: true`:
- old_string: `case 'lernplattform`
- new_string: `case 'ueben`

Achtung: dies trifft nur die Switch-`case`-Statements, NICHT andere `lernplattform`-Strings (Function-Defs, `_`-Suffix-Functions, sonstige Refs).

- [ ] **Step 2: Verifikation**

```bash
cd ExamLab
grep -cE "case ['\"]lernplattform[A-Z]" apps-script-code.js
# expected: 0
grep -cE "case ['\"]ueben[A-Z]" apps-script-code.js
# expected: 32 (vorher 0, alle umbenannt)
```

---

### Task 2.2: Apps-Script function-Definitionen (36 Defs)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. ~235-11354)

**Functions:** 32 normale + 4 internal `_`-Suffix:
- `lernplattformGeneriereToken_`, `lernplattformValidiereToken_`, `lernplattformRateLimitCheck_`, `lernplattformLadeFragenAusGruppenSheet_`

- [ ] **Step 1: Audit aller Function-Defs**

```bash
grep -nE "^function lernplattform[A-Z]" apps-script-code.js
# expected: 36 Treffer
```

- [ ] **Step 2: Edit apps-script-code.js — `function lernplattform` → `function ueben`**

Mit Edit tool `replace_all: true`:
- old_string: `function lernplattform`
- new_string: `function ueben`

Achtung: dies trifft NUR Function-Defs am Zeilenanfang. Falls es einen `// function lernplattformXXX` als Kommentar gibt, der wäre auch betroffen — das ist OK (Kommentar referenziert Function-Name).

- [ ] **Step 3: Edit aller Function-Refs (Aufrufe + interne Calls)**

```bash
# Audit aller verbleibenden lernplattform*-Refs (sollten Calls sein, nicht mehr Defs)
grep -nE "lernplattform[A-Z]" apps-script-code.js | head -20
```

Mit Edit tool `replace_all: true` auf apps-script-code.js:
- old_string: `lernplattform` (case-sensitive!)
- new_string: `ueben`

**Achtung:** dies ist ein **massiver replace_all**. Vor dem Edit nochmal lesen:
- Alle `case 'lernplattform...'` sind in Task 2.1 schon weg
- Alle `function lernplattform...` sind in Task 2.2-Step-2 schon weg
- Verbleibende sind: function-calls, comments, error-messages mit `lernplattform`-string

Nach Edit:
```bash
grep -nE "lernplattform" apps-script-code.js
# expected: 0 matches im gesamten File
grep -nE "ueben[A-Z]" apps-script-code.js | wc -l
# expected: deutlich höher als vorher (alle Function-Defs + Refs umbenannt)
```

- [ ] **Step 4: Manueller Sanity-Check**

`Read` Tool auf apps-script-code.js:1367-1450 (doPost-Switch-Bereich):
- Erwartung: `case 'uebenLogin':` → ruft `uebenLogin(body)` auf → Function ist als `function uebenLogin(body) {` definiert
- Konsistenz Switch ↔ Function-Def ↔ Function-Call

`Read` Tool auf apps-script-code.js:235-270 (internal-Functions-Bereich):
- `function uebenGeneriereToken_(email)` — alte interne Function
- `function uebenValidiereToken_(token, email)` — alte interne Function
- `function uebenRateLimitCheck_(action, key, ...)` — alte interne Function
- Alle Refs im File sollten konsistent sein

---

### Task 2.3: src/ Services umbenennen (4 Files)

**Files:**
- Modify: `ExamLab/src/services/preWarmApi.ts`
- Modify: `ExamLab/src/services/uebenKorrekturApi.ts`
- Modify: `ExamLab/src/services/uebenLoesungsApi.ts`
- Modify: `ExamLab/src/services/ueben/apiClient.ts`

- [ ] **Step 1: Pro File grep + Treffer-Klassifikation**

```bash
grep -n "lernplattform" src/services/preWarmApi.ts
grep -n "lernplattform" src/services/uebenKorrekturApi.ts
grep -n "lernplattform" src/services/uebenLoesungsApi.ts
grep -n "lernplattform" src/services/ueben/apiClient.ts
```

Erwartung: action-String-Literale in `await uebenPost('lernplattformXXX', ...)`-Calls + ggf. JSDoc-Comments + Type-Refs.

- [ ] **Step 2: Edit pro File mit `replace_all: true`**

Achtung: in Service-Files werden die action-String-Literale + ggf. JSDoc gleichzeitig betroffen. Da der Mapping-Pattern `lernplattform` → `ueben` einheitlich ist, ist `replace_all: true` sicher.

Pro File:
- old_string: `lernplattform`
- new_string: `ueben`

- [ ] **Step 3: Verifikation pro File**

```bash
grep -n "lernplattform" src/services/preWarmApi.ts
# expected: 0 matches
# wiederholen für alle 4 Files
```

- [ ] **Step 4: vitest run (Service-Tests)**

```bash
npm run test -- --run src/tests/preWarmApi 2>&1 | tail -3
npm run test -- --run src/tests/uebenLoesungsApi 2>&1 | tail -3
npm run test -- --run src/tests/uebenKorrekturApi 2>&1 | tail -3
# expected: alle grün (Tests müssen in Task 2.8 angepasst werden, daher hier ggf. einige Failures akzeptabel)
```

---

### Task 2.4: src/ Adapter umbenennen (1 File)

**Files:**
- Modify: `ExamLab/src/adapters/ueben/appsScriptAdapter.ts`

- [ ] **Step 1: grep + Read-Kontext**

```bash
grep -n "lernplattform" src/adapters/ueben/appsScriptAdapter.ts
```

- [ ] **Step 2: Edit mit `replace_all: true`**

- old_string: `lernplattform`
- new_string: `ueben`

- [ ] **Step 3: Verifikation**

```bash
grep -n "lernplattform" src/adapters/ueben/appsScriptAdapter.ts
# expected: 0
```

---

### Task 2.5: src/ Stores umbenennen (3 Files)

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts`
- Modify: `ExamLab/src/store/ueben/authStore.ts`
- Modify: `ExamLab/src/store/ueben/auftragStore.ts`

- [ ] **Step 1: Pro Store grep**

```bash
grep -n "lernplattform" src/store/ueben/uebungsStore.ts
grep -n "lernplattform" src/store/ueben/authStore.ts
grep -n "lernplattform" src/store/ueben/auftragStore.ts
```

- [ ] **Step 2: Edit pro Store mit `replace_all: true`**

Pro File:
- old_string: `lernplattform`
- new_string: `ueben`

**Achtung:** `auftragStore.ts` und `authStore.ts` enthalten möglicherweise localStorage-Key-Refs. Falls das File nur action-Strings hat: replace_all ist sicher. Falls auch Storage-Keys (`'lernplattform-auftraege'` etc.) → siehe Task 2.9 (storageMigration). Im Store sollten die Storage-Keys aber NICHT direkt referenziert werden (Migration läuft via storageMigration-Helper).

- [ ] **Step 3: Verifikation**

```bash
grep -n "lernplattform" src/store/ueben/uebungsStore.ts
grep -n "lernplattform" src/store/ueben/authStore.ts
grep -n "lernplattform" src/store/ueben/auftragStore.ts
# expected: 0 matches in jedem File
```

---

### Task 2.6: src/ Components umbenennen (3 Files)

**Files:**
- Modify: `ExamLab/src/components/ueben/admin/UebenEditorProvider.tsx`
- Modify: `ExamLab/src/components/sus/SuSStartseite.tsx`
- Modify: `ExamLab/src/components/lp/UebungsToolView.tsx`

- [ ] **Step 1: Pro File grep**

```bash
grep -n "lernplattform" src/components/ueben/admin/UebenEditorProvider.tsx
grep -n "lernplattform" src/components/sus/SuSStartseite.tsx
grep -n "lernplattform" src/components/lp/UebungsToolView.tsx
```

- [ ] **Step 2: Edit pro File mit `replace_all: true`**

Pro File:
- old_string: `lernplattform`
- new_string: `ueben`

- [ ] **Step 3: Verifikation**

```bash
grep -n "lernplattform" src/components/ueben/admin/UebenEditorProvider.tsx
grep -n "lernplattform" src/components/sus/SuSStartseite.tsx
grep -n "lernplattform" src/components/lp/UebungsToolView.tsx
# expected: 0 matches in jedem File
```

---

### Task 2.7: src/ Types umbenennen (2 Files)

**Files:**
- Modify: `ExamLab/src/types/ueben/pruefResultat.ts`
- Modify: `ExamLab/src/types/ueben/loesung.ts`

- [ ] **Step 1: Pro File grep**

```bash
grep -n "lernplattform" src/types/ueben/pruefResultat.ts
grep -n "lernplattform" src/types/ueben/loesung.ts
```

- [ ] **Step 2: Edit pro File mit `replace_all: true`**

Pro File:
- old_string: `lernplattform`
- new_string: `ueben`

- [ ] **Step 3: Verifikation + tsc-Check**

```bash
grep -n "lernplattform" src/types/ueben/pruefResultat.ts
grep -n "lernplattform" src/types/ueben/loesung.ts
# expected: 0
npx tsc -b 2>&1 | tail -5
# expected: clean
```

---

### Task 2.8: src/ Tests umbenennen (5 Files)

**Files:**
- Modify: `ExamLab/src/tests/uebenSecurityInvariant.test.ts`
- Modify: `ExamLab/src/tests/preWarmApi.test.ts`
- Modify: `ExamLab/src/tests/uebenLoesungsApi.test.ts`
- Modify: `ExamLab/src/tests/uebenKorrekturApi.test.ts`
- Modify: `ExamLab/src/store/ueben/uebungsStorePruefen.test.ts`

- [ ] **Step 1: Pro File grep**

```bash
grep -n "lernplattform" src/tests/uebenSecurityInvariant.test.ts
grep -n "lernplattform" src/tests/preWarmApi.test.ts
grep -n "lernplattform" src/tests/uebenLoesungsApi.test.ts
grep -n "lernplattform" src/tests/uebenKorrekturApi.test.ts
grep -n "lernplattform" src/store/ueben/uebungsStorePruefen.test.ts
```

- [ ] **Step 2: Edit pro File mit `replace_all: true`**

Pro File:
- old_string: `lernplattform`
- new_string: `ueben`

- [ ] **Step 3: vitest run**

```bash
npm run test -- --run 2>&1 | tail -5
# expected: gleiche Test-Count wie Baseline, 0 failures
# falls Failures: Mock-action-Strings vs. Frontend-Service-Strings drift — Stop, Audit
```

---

### Task 2.9: storageMigration.ts (Function-Rename, 4 Source-Keys behalten!)

**Files:**
- Modify: `ExamLab/src/utils/ueben/storageMigration.ts`

**Achtung:** Die Function `migriereLernplattformKeys` wird umbenannt, aber die **4 Source-localStorage-Keys** (`'lernplattform-auth'`, `'lernplattform-fortschritt'`, `'lernplattform-auftraege'`, `'lernplattform-theme'`) **bleiben** als Migration-Source-Reads.

- [ ] **Step 1: Read storageMigration.ts vollständig**

Erwartung: Function `migriereLernplattformKeys` enthält Map oder Array-Loop, der die 4 Keys list und für jede Key:
- `localStorage.getItem('lernplattform-auth')` lesen
- ggf. transformieren
- als neuen Key (z.B. `'examlab-ueben-auth'`) schreiben
- alten Key löschen (`localStorage.removeItem('lernplattform-auth')`)

Die 4 Keys mit `'lernplattform-'`-Prefix MÜSSEN als Read-Source bleiben.

- [ ] **Step 2: Identifizieren — was bleibt, was wird umbenannt?**

- BLEIBT: 4 Source-Keys-Strings (`'lernplattform-auth'`, etc.)
- UMBENNANT: Function-Name `migriereLernplattformKeys` → `migriereLernplattformKeysToUeben` (klarer) oder einfach `migriereAlteUebenKeys`
- UMBENNANT: ggf. Function-Aufrufe in Caller-Files

- [ ] **Step 3: Function-Rename mit `replace_all: false`**

Edit tool präzise:
- old_string: `function migriereLernplattformKeys(`
- new_string: `function migriereAlteUebenKeys(`

(Ähnlich falls `export const migriereLernplattformKeys = `.)

- [ ] **Step 4: Caller-Audit + Edit**

```bash
grep -rIn "migriereLernplattformKeys" src
# Erwartung: 1-3 Caller (vermutlich in authStore oder beim App-Start)
```

Pro Caller-File:
- old_string: `migriereLernplattformKeys`
- new_string: `migriereAlteUebenKeys`

- [ ] **Step 5: Verifikation: 4 Source-Keys noch da, Function-Name weg**

```bash
grep -n "lernplattform-auth\|lernplattform-fortschritt\|lernplattform-auftraege\|lernplattform-theme" src/utils/ueben/storageMigration.ts
# expected: 4 Treffer (Source-Keys bleiben!)
grep -n "migriereLernplattformKeys" src
# expected: 0 matches
```

- [ ] **Step 6: vitest run + tsc**

```bash
npm run test -- --run 2>&1 | tail -3
npx tsc -b 2>&1 | tail -3
```

---

### Task 2.10: Phase 2 Final-Verifikation + Commit

**Files:**
- No code changes
- git commit

- [ ] **Step 1: Token-Form-grep `lernplattform[A-Z]` (sollte 0 sein)**

```bash
cd ExamLab
grep -rInE "lernplattform[A-Z]" src apps-script-code.js
# expected: 0 matches
```

- [ ] **Step 2: Storage-Migration-Source-Keys grep (sollten 4 sein)**

```bash
grep -rIn "lernplattform-" src
# expected: 4 Treffer in src/utils/ueben/storageMigration.ts
```

- [ ] **Step 3: Anwesenheit von `ueben*`-action-Strings im Apps-Script**

```bash
grep -cE "case ['\"]ueben[A-Z]" apps-script-code.js
# expected: 33 (32 vom Mapping + ggf. 1× 'uebenMarkiereKIFeedbackAlsIgnoriert' falls Backend-Handler nachgerüstet wurde — ist aber Out-of-Scope per Spec §6.1)
# falls 33 nicht erreicht: 32 ist OK (latent-bug bleibt)
grep -cE "^function ueben[A-Z]" apps-script-code.js
# expected: 36
```

- [ ] **Step 4: vitest + tsc + 4× lint + build (Pflicht-Pass)**

```bash
npm run test -- --run 2>&1 | tail -3
# expected: gleiche Baseline-Count, 0 failures
npx tsc -b
# expected: clean
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
# expected: alle clean / Baseline
npm run build
# expected: vite build grün, PWA generateSW
```

- [ ] **Step 5: git diff Review**

```bash
cd ..
git diff --stat
# erwarteter Umfang: 19 src/ Files + apps-script-code.js
```

- [ ] **Step 6: Commit Phase 2**

```bash
git add ExamLab/src ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
refactor: lernplattform* → ueben* action-Strings (Phase 2/4)

Wire-Vertrag-Wechsel (Hard-Cut):
- Frontend src/: 19 Files (4 Services + 1 Adapter + 3 Stores +
  3 Components + 2 Types + 5 Tests + 1 Migration-Function)
- apps-script-code.js: 32 case-Statements + 36 Funktions-Definitionen
- 4 historic localStorage-Keys ('lernplattform-auth' etc.) bleiben
  als Migration-Source-Reads in storageMigration.ts

Apps-Script-Deploy + Frontend-Deploy zeitgleich nötig.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Code-Reviewer-Subagent dispatchen**

```
Agent tool: subagent_type "superpowers:code-reviewer"
description: "Phase 2 lernplattform → ueben rename review"
prompt: Review commit <hash> on branch refactor/legacy-naming-cleanup. Focus: Wire-Vertrag-Konsistenz Frontend ↔ Apps-Script (action-Strings + Function-Names match), Storage-Migration-Keys preserved, no functional changes, vitest/tsc/lint/build clean.
```

---

## Phase 3: Sheet-Prefix + apps-script-lernen löschen

### Task 3.1: Sheet-Prefix-String

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Z. 8978)

- [ ] **Step 1: Read Z. 8975-8985 für Kontext**

```bash
sed -n '8975,8985p' ExamLab/apps-script-code.js
```

Erwartung: `var fragensammlungSS = SpreadsheetApp.create('Lernplattform: ' + name);`

- [ ] **Step 2: Edit**

Edit tool präzise:
- old_string: `'Lernplattform: ' + name`
- new_string: `'ExamLab: ' + name`

- [ ] **Step 3: Verifikation**

```bash
grep -n "Lernplattform" apps-script-code.js
# expected: 0 matches (oder nur Comment-Refs auf Domain-Begriff, nicht User-facing)
grep -n "ExamLab: ' + name" apps-script-code.js
# expected: 1 match
```

---

### Task 3.2: apps-script-lernen/ Inhalts-Review

**Files:**
- Read-only audit: `ExamLab/apps-script-lernen/SETUP.md`, `ExamLab/apps-script-lernen/COPY-PASTE-HILFE.md`, `ExamLab/apps-script-lernen/lernplattform-backend.js`

**Goal:** Sicherstellen, dass keine wichtigen Setup-Anweisungen verloren gehen.

- [ ] **Step 1: Read SETUP.md vollständig**

```bash
cat ExamLab/apps-script-lernen/SETUP.md
```

Identifizieren: Schritte zur Sheet-Erstellung, Apps-Script-Deploy-Anleitungen, Spalten-Schema-Doku.

- [ ] **Step 2: Read COPY-PASTE-HILFE.md vollständig**

```bash
cat ExamLab/apps-script-lernen/COPY-PASTE-HILFE.md
```

- [ ] **Step 3: Vergleich mit Hauptbackend-Doku**

```bash
ls ExamLab/Google_Workspace_Setup.md ExamLab/README.md ExamLab/docs/
cat ExamLab/Google_Workspace_Setup.md | head -50
```

Identifizieren: welche Setup-Anweisungen aus apps-script-lernen/ sind in Hauptdoku schon abgedeckt? Welche fehlen?

- [ ] **Step 4: Migrations-Liste schreiben**

Erstellen einer Liste:
- Was bleibt: Source-Files in apps-script-lernen/ (alle gehen weg)
- Was migriert wird: relevante Setup-Sections in z.B. `Google_Workspace_Setup.md` oder `apps-script-lernen-archive.md`

Falls Setup-Doku komplett in Hauptbackend abgedeckt ist: keine Doku-Migration nötig.

---

### Task 3.3: Doku-Konsolidierung + Ordner-Löschung

**Files:**
- Optional Modify: `ExamLab/Google_Workspace_Setup.md` (oder neue Datei)
- Delete: `ExamLab/apps-script-lernen/lernplattform-backend.js`
- Delete: `ExamLab/apps-script-lernen/SETUP.md`
- Delete: `ExamLab/apps-script-lernen/COPY-PASTE-HILFE.md`
- Delete: directory `ExamLab/apps-script-lernen/`

- [ ] **Step 1: Doku-Migration ausführen (falls in Task 3.2-Step-4 nötig)**

Mit Edit oder Write Tool relevante Setup-Sections in Hauptdoku ergänzen.

- [ ] **Step 2: Verzeichnis löschen**

```bash
cd ExamLab
rm -rf apps-script-lernen/
ls apps-script-lernen/ 2>&1
# expected: "No such file or directory"
```

- [ ] **Step 3: Repo-wide Refs-Audit**

```bash
cd ..
grep -rIn "apps-script-lernen" ExamLab/src ExamLab/apps-script-code.js ExamLab/package.json ExamLab/vite.config.ts ExamLab/README.md 2>/dev/null
# expected: 0 matches
```

---

### Task 3.4: Phase 3 Final-Verifikation + Commit

- [ ] **Step 1: Repo-wide token-form-grep (Restposten-Check)**

```bash
cd ExamLab
grep -rIliE "lernplattform[A-Z]|fragenbank" src apps-script-code.js
# expected: 0 matches
grep -rIli "lernplattform-" src
# expected: 1 File (storageMigration.ts mit 4 Source-Keys)
```

- [ ] **Step 2: vitest + tsc + 4× lint + build**

```bash
npm run test -- --run 2>&1 | tail -3
npx tsc -b
npm run lint:as-any && npm run lint:no-alert && npm run lint:no-tests-dir && npm run lint:musterloesung
npm run build
# expected: alle clean
```

- [ ] **Step 3: git diff Review**

```bash
cd ..
git diff --stat
# erwarteter Umfang: 1 apps-script-code.js Edit (Sheet-Prefix) + 3 deleted Files in apps-script-lernen/ + ggf. Doku-Migration
```

- [ ] **Step 4: Commit Phase 3**

```bash
git add -A ExamLab/
git commit -m "$(cat <<'EOF'
cleanup: Sheet-Prefix + apps-script-lernen-Löschung (Phase 3/4)

- 'Lernplattform: ' + name → 'ExamLab: ' + name in apps-script-code.js
- apps-script-lernen/ (3 Files: lernplattform-backend.js,
  SETUP.md, COPY-PASTE-HILFE.md) gelöscht — Pre-Fusion-Phase-6-Legacy
- Relevante Setup-Doku in Google_Workspace_Setup.md übernommen

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: Browser-E2E + Drive-Brief + HANDOFF

### Task 4.1: Drive-Aufräum-Brief erstellen

**Files:**
- Create: `ExamLab/docs/drive-aufraum-2026-05-10.md`

- [ ] **Step 1: Brief-Inhalt aus Spec §3 Phase 4 schreiben**

Mit Write Tool erstellen — Inhalt:
- Aktiv verwendete Drive-Sheets (NICHT LÖSCHEN!): Hauptdaten, Gruppen-Registry, Schul-Configs, pro Familie Sheet + Analytik-Sheet
- Empfehlung manueller Sheet-Rename (Lernplattform: → ExamLab:)
- Empfehlung Löschung: altes Lernplattform-Apps-Script-Projekt + alte Test-Sheets aus Fusion-Phase
- User-Verifikations-Schritte

- [ ] **Step 2: Commit Brief**

```bash
git add ExamLab/docs/drive-aufraum-2026-05-10.md
git commit -m "ExamLab: Drive-Aufräum-Brief Bundle Legacy-Naming-Cleanup

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4.2: Branch-Push + Apps-Script-Deploy

- [ ] **Step 1: Pre-Push-Check vor Force-Push auf preview**

Memory-Lehre `feedback_preview_forcepush.md`:

```bash
git fetch origin preview
git log preview..HEAD --oneline
git log HEAD..preview --oneline
# Pre-Check: enthält origin/preview Work-in-Progress, der nicht in HEAD ist?
```

Falls `origin/preview` Work-in-Progress hat: STOP, mit User abklären.

- [ ] **Step 2: Branch nach preview pushen**

```bash
git push origin refactor/legacy-naming-cleanup:preview --force-with-lease
# --force-with-lease ist sicherer als --force
```

- [ ] **Step 3: User informieren — Apps-Script-Deploy nötig**

Brief an User:
- Apps-Script-Editor öffnen (gleiches Apps-Script-Projekt wie ExamLab Prüfen)
- Code aus `ExamLab/apps-script-code.js` von `refactor/legacy-naming-cleanup`-Branch kopieren
- Code im Editor einfügen + speichern
- "Bereitstellen → Bereitstellung verwalten" → neue Version erstellen

User wartet auf Bestätigung von Apps-Script-Deploy bevor Browser-E2E gestartet wird.

---

### Task 4.3: Browser-E2E auf Staging

**Voraussetzung:** Apps-Script-Deploy abgeschlossen (Task 4.2). Frontend-Deploy auf Staging via Preview-Branch-Build sollte automatisch laufen.

- [ ] **Step 1: Service-Worker-Cache-Invalidation (Memory-Pattern)**

Im Browser-DevTools-Console auf Staging-URL:
```javascript
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
location.reload();
```

- [ ] **Step 2: LP-Login-Test mit echtem Account `wr.test@gymhofwil.ch`**

Browser-MCP oder manuell:
- LP-Startseite öffnen
- Composer-Editor öffnen → 0 Console-Errors aus aktuellem Bundle
- Vorschau-Tab → 0 Errors
- SuS-Vorschau-Modal öffnen → Banner sichtbar, 0 Errors

- [ ] **Step 3: SuS-Login-Test mit echtem Account `wr.test@stud.gymhofwil.ch`**

- SuS-Startseite öffnen → Übungs-Tab + Themen-Karten laden
- Eine Frage starten → Frage rendert
- Antwort eingeben + abgeben → Korrektur funktioniert
- 0 Console-Errors aus aktuellem Bundle

- [ ] **Step 4: Console-Errors-Audit**

DevTools Console-Tab → alle Errors notieren:
- Errors aus aktuellem Bundle: **MUSS 0 sein**
- Carryover-Errors aus alten Bundles vor Cache-Reset: dokumentieren

Falls aktuelle-Bundle-Errors > 0: **STOP**, Errors analysieren, ggf. Rollback.

---

### Task 4.4: HANDOFF + Memory + Final-Commit

**Files:**
- Modify: `ExamLab/HANDOFF.md`
- Create: `~/.claude/projects/.../memory/project_bundle_legacy_naming_cleanup.md`
- Modify: `~/.claude/projects/.../memory/MEMORY.md`

- [ ] **Step 1: HANDOFF-Bundle-Eintrag schreiben**

In `ExamLab/HANDOFF.md` neuen Top-Eintrag (analog Format Bundle Test-Tickets):

```markdown
### Bundle Legacy-Naming-Cleanup ✅ MERGED (2026-05-XX)

Branch `refactor/legacy-naming-cleanup` → preview → main. Vollständige Migration `fragenbank` → `fragensammlung` + `lernplattform*` → `ueben*` (Frontend + Apps-Script Wire-Vertrag, Hard-Cut).

| Phase | Inhalt | Commit |
|---|---|---|
| 1 | fragenbank → fragensammlung (14 src/ + 6 AS) | <hash> |
| 2 | lernplattform* → ueben* (19 src/ + 32 cases + 36 funcs) | <hash> |
| 3 | Sheet-Prefix + apps-script-lernen-Löschung | <hash> |
| 4 | Drive-Aufräum-Brief | <hash> |

**Verifikation:** vitest <count>, tsc clean, 4× lint clean, build grün, Browser-E2E LP+SuS ✅, 0 neue Console-Errors.

**Apps-Script-Deploy:** User hat Apps-Script manuell deployed ✅.

**User-Aktion Drive-Aufräumung:** Brief in `docs/drive-aufraum-2026-05-10.md`, manuelle Sheet-Renames (Lernplattform: → ExamLab:) ausgeführt.

**Lehre:** Hard-Cut-Wire-Vertrag-Wechsel mit 4 Sub-Phasen + Reviewer-Loop pro Phase + 2-iteration Spec-Review hat Migration sauber durchgeführt. Storage-Migration-Source-Keys (`'lernplattform-*'`) bleiben absichtlich als historic-Read-Source.
```

- [ ] **Step 2: Memory-File schreiben**

Mit Write Tool: `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_legacy_naming_cleanup.md`

Inhalt:
- name: Bundle Legacy-Naming-Cleanup KOMPLETT
- description: Vollständige Migration fragenbank/lernplattform → fragensammlung/ueben (Wire-Vertrag-Hard-Cut)
- type: project
- Effekt-Bilanz, Lehren, Architektur-Patterns

- [ ] **Step 3: MEMORY.md Index-Eintrag**

Eine Zeile in `MEMORY.md`:
```
- [Bundle Legacy-Naming-Cleanup KOMPLETT](project_bundle_legacy_naming_cleanup.md) — fragenbank/lernplattform → fragensammlung/ueben Hard-Cut, 14+19 src/-Files + AS-Wire-Vertrag, 2026-05-XX
```

- [ ] **Step 4: Final-Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
ExamLab: HANDOFF + Memory Bundle Legacy-Naming-Cleanup KOMPLETT

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Merge nach main + push**

Nach User-Freigabe (Memory-Regel `feedback_staging_workflow.md`):

```bash
git checkout main
git pull origin main
git merge --no-ff refactor/legacy-naming-cleanup
git push origin main
```

- [ ] **Step 6: Production-Deploy**

Frontend Production-Deploy via main-Branch-Build (CI). Apps-Script bleibt auf Staging-Version (= Production-Version).

- [ ] **Step 7: Post-Merge Cleanup**

```bash
git branch -d refactor/legacy-naming-cleanup
git push origin --delete refactor/legacy-naming-cleanup
```

- [ ] **Step 8: User-Action Drive-Aufräumung anstoßen**

User bittet die manuellen Sheet-Renames + Drive-Cleanup gemäß `docs/drive-aufraum-2026-05-10.md` auszuführen.

---

## Bonus-Findings: Spawn-Tasks (Out-of-Scope, post-Bundle)

Aus Spec §6 — bei Bundle-Abschluss als separate Sessions/Tasks anlegen:

1. **Latent-Bug Backend-Handler nachrüsten:** `uebenMarkiereKIFeedbackAlsIgnoriert` (Frontend ruft, kein Backend-Handler)
2. **Optional Typo-Fix:** `uebenUmbenneGruppe` → `uebenUmbenenneGruppe` (kosmetisch)

Mit `mcp__ccd_session__spawn_task` Tool nach Bundle-Abschluss flaggen.

---

## Definition of Done (Final)

- ✅ Phase 1+2+3 alle Commits auf Branch
- ✅ Token-form-grep `lernplattform[A-Z]` + `fragenbank` (case-insens.) im gesamten Repo: 0 matches (außer 4 Storage-Migration-Source-Keys in `storageMigration.ts`)
- ✅ vitest <baseline-count> grün, drift = 0
- ✅ tsc clean, 4× lint clean, build grün
- ✅ Browser-E2E auf Staging mit echten LP+SuS-Logins ✅
- ✅ User Apps-Script-Deploy + Drive-Rename-Aktion ausgeführt
- ✅ HANDOFF + Memory + git push zum main + Branch gelöscht
- ✅ Bonus-Findings als Spawn-Tasks geflaggt
