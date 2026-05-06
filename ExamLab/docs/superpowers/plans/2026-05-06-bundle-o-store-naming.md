# Bundle O — Store-Action-Naming-Vereinheitlichung Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Action-Naming in 6 Zustand-Stores + 2 Navigation-Hooks nach Bundle-V-Sprach-Konvention vereinheitlichen — Programming-Primitives auf englisch (`set*/reset/register/navigate/openX/back*`), Domain-Verben (`anmelden/abmelden`) bleiben deutsch.

**Architecture:** 8 sequentielle Per-Store/Hook-Commits auf `refactor/bundle-o-store-naming`. Jeder Commit atomar mit grünem `npx tsc -b` + `npm test`. Edit-Tool exact-string mit Kontext (NICHT `replace_all` global, weil `setzeStatus` cross-store identisch). Audit-Grep nach jeder Phase.

**Tech Stack:** TypeScript + Zustand + React + vitest. Keine neuen npm-Dependencies. Kein Backward-Compat-Alias.

**Spec:** [`docs/superpowers/specs/2026-05-06-bundle-o-store-naming-design.md`](../specs/2026-05-06-bundle-o-store-naming-design.md)

---

## File Structure

### Modifizierte Dateien (Stores)

```
ExamLab/src/store/
├── draftStore.ts                              [register/setDirty/setStatus]
├── pruefungStore.ts                           [navigate/reset]
├── lpUIStore.ts                               [openComposer/backToDashboard/back]
├── ueben/
│   ├── authStore.ts                           [setRolle]
│   ├── settingsStore.ts                       [setDefaults/setEinstellungen]
│   └── themenSichtbarkeitStore.ts             [setStatus/setUnterthemen]
└── (authStore.ts root — unverändert, bereits konform)
```

### Modifizierte Dateien (Hooks)

```
ExamLab/src/hooks/
├── useLPNavigation.ts                         [openComposer/backToDashboard + 5x openX]
└── ueben/
    └── useSuSNavigation.ts                    [openDashboard/Uebung/Ergebnis/Admin/GruppenAuswahl/Pruefen, back]
```

### Caller-Dateien (alle modifiziert über Phasen)

```
Direkt-Caller pro Action (verifiziert per grep, Stand 2026-05-06):

setzeRolle (ueben/authStore):
  ExamLab/src/AppUeben.tsx

setzeDefaults / setzeEinstellungen (ueben/settingsStore):
  ExamLab/src/context/ueben/UebenKontextProvider.tsx
  ExamLab/src/tests/uebenSettingsStore.test.ts

setzeStatus / setzeUnterthemen (ueben/themenSichtbarkeitStore):
  ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx
  ExamLab/src/hooks/ueben/useDeepLinkAktivierung.ts
  ExamLab/src/adapters/ueben/appsScriptAdapter.ts

registriere / setzeDirty / setzeStatus (draftStore):
  ExamLab/src/hooks/useDirtyTracker.ts
  ExamLab/src/store/draftStore.test.ts

navigiere / zuruecksetzen (pruefungStore):
  ExamLab/src/components/FragenNavigation.tsx
  ExamLab/src/components/FragenUebersicht.tsx
  ExamLab/src/App.tsx
  ExamLab/src/components/Layout.tsx
  ExamLab/src/store/authStore.ts (intern)
  ExamLab/src/tests/authStoreLoginPrefetch.test.ts

navigiereZuComposer / zurueckZumDashboard / zurueck (lpUIStore + useLPNavigation):
  ExamLab/src/components/lp/LPStartseite.tsx
  ExamLab/src/hooks/useLPRouteSync.ts
  ExamLab/src/tests/LPStartseite.test.tsx

navigiereZuFrageneditor (useLPNavigation):
  ExamLab/src/components/settings/problemmeldungen/useDeepLink.ts

zuDashboard / zuUebung / zuErgebnis / zuAdmin / zuGruppenAuswahl / zuPruefen / zurueck (useSuSNavigation):
  Verschiedene SuS-Komponenten (Phase 7 macht initial-grep nochmal)
```

---

## Pre-flight (vor Phase 1)

- [ ] **Step 0.1: Branch verifizieren**

Run: `cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY" && git branch --show-current`
Expected: `refactor/bundle-o-store-naming`

(Branch existiert bereits inkl. Spec-Commits. Falls nicht: `git checkout main && git pull && git checkout -b refactor/bundle-o-store-naming`.)

- [ ] **Step 0.2: Baseline-Tests grün**

Run: `cd ExamLab && npm test 2>&1 | grep "Tests "`
Expected: `Tests  1234 passed | 4 todo (1238)`

- [ ] **Step 0.3: tsc Baseline**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

- [ ] **Step 0.4: Lint-Gates Baseline**

Run: `cd ExamLab && npm run lint:as-any && npm run lint:no-tests-dir`
Expected: beide exit 0.

---

## Phase 1 — Commit 1: ueben/authStore.ts (1 Rename)

### Task 1.1: setzeRolle → setRolle

**Files:**
- Modify: `ExamLab/src/store/ueben/authStore.ts` (Type + Implementation)
- Modify: `ExamLab/src/AppUeben.tsx` (Caller)

- [ ] **Step 1.1.1: Caller-Inventory**

Run: `grep -nE "\bsetzeRolle\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 4 Treffer in 2 Files (`store/ueben/authStore.ts` 2× def, `AppUeben.tsx` 1-2× call).

- [ ] **Step 1.1.2: Rename in Store**

In `ExamLab/src/store/ueben/authStore.ts` ersetzen:
- `setzeRolle: (rolle: UebenRolle) => void` → `setRolle: (rolle: UebenRolle) => void`
- `setzeRolle: (rolle: UebenRolle) => {` → `setRolle: (rolle: UebenRolle) => {`

(Pro Auftreten Edit-Tool mit umgebendem Kontext.)

- [ ] **Step 1.1.3: Rename in AppUeben.tsx**

In `ExamLab/src/AppUeben.tsx` jeden `setzeRolle` → `setRolle` rewriten.

- [ ] **Step 1.1.4: Verify-Audit**

Run: `grep -nE "\bsetzeRolle\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

- [ ] **Step 1.1.5: tsc + Tests**

Run: `cd ExamLab && npx tsc -b 2>&1 | tail -5`
Expected: keine Error-Zeilen.

Run: `cd ExamLab && npm test 2>&1 | grep "Tests "`
Expected: `Tests  1234 passed | 4 todo (1238)`.

- [ ] **Step 1.1.6: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 1: ueben/authStore setzeRolle → setRolle

Smoke-Test-Phase (kleinster Commit). 1 Action-Rename, 1 Caller-File.
Domain-Verben anmelden/anmeldenMitGoogle/anmeldenMitCode/abmelden
bleiben deutsch (Bundle V).

vitest: 1234 passed (Baseline gehalten).
EOF
)"
```

---

## Phase 2 — Commit 2: ueben/settingsStore.ts (2 Renames)

### Task 2.1: setzeDefaults + setzeEinstellungen → setDefaults + setEinstellungen

**Files:**
- Modify: `ExamLab/src/store/ueben/settingsStore.ts`
- Modify: `ExamLab/src/context/ueben/UebenKontextProvider.tsx`
- Modify: `ExamLab/src/tests/uebenSettingsStore.test.ts`

- [ ] **Step 2.1.1: Caller-Inventory**

Run: `grep -nE "\b(setzeDefaults|setzeEinstellungen)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: ~17 Treffer in 3 Files.

- [ ] **Step 2.1.2: Rename in Store-Datei**

In `ExamLab/src/store/ueben/settingsStore.ts` jeden `setzeDefaults` → `setDefaults`, jeden `setzeEinstellungen` → `setEinstellungen`.

- [ ] **Step 2.1.3: Rename in UebenKontextProvider.tsx**

In `ExamLab/src/context/ueben/UebenKontextProvider.tsx`:
- destructure-line: `const { einstellungen, setzeEinstellungen, setzeDefaults, abbrecheSave } = ...` → `setEinstellungen, setDefaults`
- Call-sites + useEffect-deps-array: jedes `setzeDefaults` → `setDefaults`, `setzeEinstellungen` → `setEinstellungen`.

- [ ] **Step 2.1.4: Rename in Test-Datei**

In `ExamLab/src/tests/uebenSettingsStore.test.ts`: jeden `setzeDefaults` → `setDefaults`, `setzeEinstellungen` → `setEinstellungen`.

- [ ] **Step 2.1.5: Verify-Audit**

Run: `grep -nE "\b(setzeDefaults|setzeEinstellungen)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

- [ ] **Step 2.1.6: tsc + Tests + Commit**

Run: `cd ExamLab && npx tsc -b && npm test 2>&1 | grep "Tests "` → `1234 passed`.

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 2: ueben/settingsStore setze*-Setter → set*

Programming-Primitives englisch (Bundle V).
2 Renames: setzeDefaults → setDefaults, setzeEinstellungen → setEinstellungen.

vitest: 1234 passed.
EOF
)"
```

---

## Phase 3 — Commit 3: ueben/themenSichtbarkeitStore.ts (2 Renames)

### Task 3.1: setzeStatus + setzeUnterthemen → setStatus + setUnterthemen

**Files:**
- Modify: `ExamLab/src/store/ueben/themenSichtbarkeitStore.ts`
- Modify: `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx`
- Modify: `ExamLab/src/hooks/ueben/useDeepLinkAktivierung.ts`
- Modify: `ExamLab/src/adapters/ueben/appsScriptAdapter.ts`

**WICHTIG:** `setzeStatus` ist auch in draftStore (verschiedene Signatur!). NICHT `replace_all`. Pro Edit prüfen ob es der themenSichtbarkeitStore-Caller ist (anhand Signatur: `(gruppeId, fach, thema, status, ...)` vs draftStore's `(editorId, status)`).

- [ ] **Step 3.1.1: Caller-Inventory pro Store separat**

Run: `grep -lE "\buseThemenSichtbarkeitStore\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Files-Liste festhalten — das sind die Stellen wo `setzeStatus`/`setzeUnterthemen` auf themenSichtbarkeitStore zeigen.

Run: `grep -nE "\b(setzeStatus|setzeUnterthemen)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Erwarte ~24 Treffer total. Zähle nur die in den Files aus Schritt-1 plus Store-Datei selbst.

- [ ] **Step 3.1.2: Rename in Store-Datei**

In `ExamLab/src/store/ueben/themenSichtbarkeitStore.ts`: alle `setzeStatus` → `setStatus`, alle `setzeUnterthemen` → `setUnterthemen`. (Diese Datei hat KEIN draftStore-Bezug.)

- [ ] **Step 3.1.3: Rename in AdminThemensteuerung.tsx**

In `ExamLab/src/components/ueben/admin/AdminThemensteuerung.tsx`:
- destructure-line: `const { freischaltungen, ladeFreischaltungen, setzeStatus, getStatus, getAktiveThemen, getAktiveUnterthemen, setzeUnterthemen } = useThemenSichtbarkeitStore()` → `setStatus`/`setUnterthemen`
- Alle 4 Call-Sites von `setzeUnterthemen(...)` → `setUnterthemen(...)`
- `setzeStatus(...)`-Stellen → `setStatus(...)` (nur die in dieser Datei, weil sie im themenSichtbarkeitStore-Kontext sind).

- [ ] **Step 3.1.4: Rename in useDeepLinkAktivierung.ts**

In `ExamLab/src/hooks/ueben/useDeepLinkAktivierung.ts`: setzeStatus → setStatus (themenSichtbarkeitStore).

- [ ] **Step 3.1.5: Rename in appsScriptAdapter.ts**

In `ExamLab/src/adapters/ueben/appsScriptAdapter.ts`: setzeStatus → setStatus (themenSichtbarkeitStore — Adapter ruft den Store auf).

- [ ] **Step 3.1.6: Verify-Audit (themenSichtbarkeitStore)**

Run: `grep -nE "\bsetzeUnterthemen\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

Run: `grep -nE "\bsetzeStatus\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: nur Treffer in `draftStore.ts` und `draftStore.test.ts` (kommt in Phase 4 dran).

- [ ] **Step 3.1.7: tsc + Tests + Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 3: ueben/themenSichtbarkeitStore setze*-Setter → set*

Programming-Primitives englisch (Bundle V).
2 Renames: setzeStatus → setStatus, setzeUnterthemen → setUnterthemen.

WICHTIG: setzeStatus auch in draftStore (verschiedene Signatur),
NICHT mit replace_all über Repo. Diese Phase hat NUR die
themenSichtbarkeitStore-Treffer migriert. draftStore.setzeStatus
folgt in Phase 4.

vitest: 1234 passed.
EOF
)"
```

---

## Phase 4 — Commit 4: draftStore.ts (4 Renames)

### Task 4.1: registriere + abmelde + setzeDirty + setzeStatus → register + unregister + setDirty + setStatus

**Files:**
- Modify: `ExamLab/src/store/draftStore.ts`
- Modify: `ExamLab/src/store/draftStore.test.ts`
- Modify: `ExamLab/src/hooks/useDirtyTracker.ts`
- Modify: `ExamLab/src/hooks/useDirtyTracker.test.tsx`

**Wichtig:** Plan-Reviewer hat aufgedeckt: `draftStore.abmelde` (Sibling zu `registriere` — un-register beim Unmount) ist ebenfalls Programming-Primitive nach Bundle V → englisch. Wird im selben Commit symmetrisch zu `registriere → register` gerenamt: `abmelde → unregister`. Vorsicht: `abmelde` ist NICHT identisch mit auth-domain-`abmelden` (Word-Boundary `\babmelde\b` matcht NICHT `abmelden`, weil das `n` ein Word-Character ist).

- [ ] **Step 4.1.1: Caller-Inventory**

Run: `grep -nE "\b(registriere|abmelde|setzeDirty|setzeStatus)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r | grep -v themenSichtbarkeit | grep -v abmelden`
Expected: ~40 Treffer.

- [ ] **Step 4.1.2: Rename in Store-Datei**

In `ExamLab/src/store/draftStore.ts`:
- `registriere: (editorId: string) => void` → `register: ...`
- `abmelde: (editorId: string) => void` → `unregister: ...`
- `setzeDirty: ...` → `setDirty: ...`
- `setzeStatus: ...` → `setStatus: ...`
- Plus alle Implementation-Zeilen (`registriere: (editorId) => set(...)` etc.).

- [ ] **Step 4.1.3: Rename in useDirtyTracker.ts**

In `ExamLab/src/hooks/useDirtyTracker.ts`:
- Doc-Comment Z. 5+7: `abmelde() ... beim Unmount`, `registriere/abmelde im draftStore` → `unregister() ...`, `register/unregister im draftStore`.
- Z. 22: `const abmelde = useDraftStore(s => s.abmelde)` → `const unregister = useDraftStore(s => s.unregister)`.
- Z. 28: `abmelde(editorId)` → `unregister(editorId)`.
- Z. 30 useEffect-deps-array: `[editorId, registriere, abmelde]` → `[editorId, register, unregister]`.

- [ ] **Step 4.1.4: Rename in useDirtyTracker.test.tsx**

In `ExamLab/src/hooks/useDirtyTracker.test.tsx`:
- Z. 16: `it('abmelde beim Unmount', ...)` → `it('unregister beim Unmount', ...)`.
- Mock-Stellen oder Assertions die `abmelde` referenzieren mit-renamen.

- [ ] **Step 4.1.5: Rename in draftStore.test.ts**

In `ExamLab/src/store/draftStore.test.ts`:
- jedes `registriere`/`abmelde`/`setzeDirty`/`setzeStatus` → `register`/`unregister`/`setDirty`/`setStatus`.
- Z. 46: `it('abmelde entfernt Eintrag', ...)` → `it('unregister entfernt Eintrag', ...)`.
- Z. 48: `useDraftStore.getState().abmelde('editor-1')` → `.unregister('editor-1')`.

- [ ] **Step 4.1.6: Verify-Audit (draftStore-Actions)**

Run: `grep -nE "\bregistriere\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

Run: `grep -nE "\babmelde\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer (Word-Boundary `\b` schliesst `abmelden` aus — auth-domain bleibt deutsch).

Run: `grep -nE "\bsetzeDirty\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

Run: `grep -nE "\bsetzeStatus\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer (jetzt sowohl draftStore als auch themenSichtbarkeitStore migriert).

- [ ] **Step 4.1.7: tsc + Tests + Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 4: draftStore registriere/abmelde/setze* → register/unregister/set*

Programming-Primitives englisch (Bundle V). 4 Renames:
- registriere → register
- abmelde → unregister (symmetrisches Sibling, vom Reviewer aufgedeckt)
- setzeDirty → setDirty
- setzeStatus → setStatus

WICHTIG: draftStore.abmelde (un-register-Hook) ist ein Programming-Primitive,
NICHT der Auth-Domain-Verb abmelden. Word-Boundary-Grep \babmelde\b
matcht abmelden nicht (n ist Word-Char).

Damit ist auch der zweite setzeStatus-Konsument (draftStore) migriert,
nach themenSichtbarkeitStore in Phase 3.

vitest: 1234 passed.
EOF
)"
```

---

## Phase 5 — Commit 5: pruefungStore.ts (2 Renames)

### Task 5.1: navigiere + zuruecksetzen → navigate + reset

**Files:**
- Modify: `ExamLab/src/store/pruefungStore.ts`
- Modify: `ExamLab/src/components/FragenNavigation.tsx`
- Modify: `ExamLab/src/components/FragenUebersicht.tsx`
- Modify: `ExamLab/src/App.tsx`
- Modify: `ExamLab/src/components/Layout.tsx`
- Modify: `ExamLab/src/store/authStore.ts` (intern, ruft `pruefungStore.zuruecksetzen()`)
- Modify: `ExamLab/src/tests/authStoreLoginPrefetch.test.ts`

- [ ] **Step 5.1.1: Caller-Inventory**

Run: `grep -nE "\.navigiere\(" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: in FragenNavigation + FragenUebersicht (~3 Treffer).

Run: `grep -nE "\.zuruecksetzen\(\)" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: ~6-8 Treffer in mehreren Files.

- [ ] **Step 5.1.2: Rename in Store**

In `ExamLab/src/store/pruefungStore.ts`:
- `navigiere: (index: number) => void` → `navigate: ...`
- `zuruecksetzen: () => void` → `reset: ...`
- Plus Implementation-Zeilen.

- [ ] **Step 5.1.3: Rename in FragenNavigation.tsx + FragenUebersicht.tsx**

Beide Files: `const navigiere = usePruefungStore((s) => s.navigiere)` → `const navigate = ... s.navigate`. Alle Call-Sites mitziehen.

- [ ] **Step 5.1.4: Rename in App.tsx + Layout.tsx + authStore.ts (intern)**

Jeder `usePruefungStore.getState().zuruecksetzen()` → `.reset()`.

- [ ] **Step 5.1.5: Rename in authStoreLoginPrefetch.test.ts**

Mock-Stellen aktualisieren.

- [ ] **Step 5.1.6: Verify-Audit**

Run: `grep -nE "\.navigiere\(|\.zuruecksetzen\(" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer (außer evt. doc-comments).

- [ ] **Step 5.1.7: tsc + Tests + Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 5: pruefungStore navigiere/zuruecksetzen → navigate/reset

Programming-Primitives englisch (Bundle V).
- navigiere(index) → navigate(index)
- zuruecksetzen() → reset()

Set*-Actions im Store waren bereits konform (setAntwort/setPhase/...).
Touched: pruefungStore + 4 Caller-Files + 1 Test-Mock + authStore (intern).

vitest: 1234 passed.
EOF
)"
```

---

## Phase 6 — Commit 6: lpUIStore.ts + useLPNavigation.ts (8 Renames)

### Task 6.1: lpUIStore navigiereZuComposer/zurueckZumDashboard/zurueck → openComposer/backToDashboard/back

**Files:**
- Modify: `ExamLab/src/store/lpUIStore.ts`
- Modify: `ExamLab/src/hooks/useLPNavigation.ts` (mirrors store API + 5 own methods)
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`
- Modify: `ExamLab/src/hooks/useLPRouteSync.ts`
- Modify: `ExamLab/src/tests/LPStartseite.test.tsx`
- Modify: `ExamLab/src/components/settings/problemmeldungen/useDeepLink.ts` (caller of `navigiereZuFrageneditor`)

- [ ] **Step 6.1.1: Caller-Inventory**

Run: `grep -nE "\b(navigiereZuComposer|zurueckZumDashboard|navigiereZuEinstellungen|navigiereZuKorrektur|navigiereZuMonitoring|navigiereZuFrageneditor|navigiereZuFavoriten)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`

Run: `grep -nE "\.zurueck\(\)" ExamLab/src --include='*.ts' --include='*.tsx' -r`
(Erfasst sowohl lpUIStore.zurueck als auch useSuSNavigation.zurueck — letzteres bleibt zu Phase 7.)

- [ ] **Step 6.1.2: Rename in lpUIStore.ts**

- `navigiereZuComposer: (titel: string, configId?: string) => void` → `openComposer: ...`
- `zurueckZumDashboard: () => void` → `backToDashboard: ...`
- `zurueck: () => void` → `back: ...`
- Plus Implementation-Zeilen.

- [ ] **Step 6.1.3: Rename in useLPNavigation.ts (Store-API-Mirrors + 5 eigene)**

- `const navigiereZuComposer = useCallback(...)` → `const openComposer = ...`
- `const zurueckZumDashboard = useCallback(...)` → `const backToDashboard = ...`
- `const navigiereZuEinstellungen = ...` → `const openEinstellungen = ...`
- `const navigiereZuKorrektur = ...` → `const openKorrektur = ...`
- `const navigiereZuMonitoring = ...` → `const openMonitoring = ...`
- `const navigiereZuFrageneditor = ...` → `const openFrageneditor = ...`
- `const navigiereZuFavoriten = ...` → `const openFavoriten = ...`
- Im Return-Object alle 7 Keys mit-renamen.

- [ ] **Step 6.1.4: Rename in LPStartseite.tsx**

Alle Call-Sites (~14 Stellen für navigiereZuComposer, ~11 für zurueckZumDashboard, plus die `.zurueck()`-Stelle bei Line 887).

- [ ] **Step 6.1.5: Rename in useLPRouteSync.ts**

Selbe Renames anwenden.

- [ ] **Step 6.1.6: Rename in LPStartseite.test.tsx**

Mock-Object: `navigiereZuComposer: vi.fn()` → `openComposer: vi.fn()` etc.

- [ ] **Step 6.1.7: Rename in useDeepLink.ts (problemmeldungen)**

`nav.navigiereZuFrageneditor(ziel.id)` → `nav.openFrageneditor(ziel.id)`.

- [ ] **Step 6.1.8: Verify-Audit (LP-Hook + Store)**

Run: `grep -nE "\b(navigiereZuComposer|zurueckZumDashboard|navigiereZuEinstellungen|navigiereZuKorrektur|navigiereZuMonitoring|navigiereZuFrageneditor|navigiereZuFavoriten)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

Run: `grep -nE "\.zurueck\(\)" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: nur Treffer in `useSuSNavigation.ts` und seinen Caller-Files (kommt in Phase 7).

- [ ] **Step 6.1.9: tsc + Tests + Browser-Smoke**

Run: `cd ExamLab && npx tsc -b && npm test 2>&1 | grep "Tests "` → `1234 passed`.

**Browser-Smoke (LP):** Bei größerem Umfang dieser Phase und UI-Bezug (LP-Header, Komposer-Navigation) mit echtem Login (`wr.test@gymhofwil.ch`) verifizieren:
- LP-Login → Dashboard sichtbar
- Composer öffnen (klick auf „Neue Prüfung" o.ä.)
- Speichern + zurück
- Console clean, kein „X is not a function".

- [ ] **Step 6.1.10: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 6: lpUIStore + useLPNavigation navigiere*/zurueck* → openX/backToDashboard/back

Programming-Primitives englisch (Bundle V).

Store (lpUIStore.ts):
- navigiereZuComposer → openComposer
- zurueckZumDashboard → backToDashboard
- zurueck → back

Hook (useLPNavigation.ts) — API-Spiegelungen + 5 zusätzliche LP-Routes:
- navigiereZuComposer (Mirror) → openComposer
- zurueckZumDashboard (Mirror) → backToDashboard
- navigiereZuEinstellungen → openEinstellungen
- navigiereZuKorrektur → openKorrektur
- navigiereZuMonitoring → openMonitoring
- navigiereZuFrageneditor → openFrageneditor
- navigiereZuFavoriten → openFavoriten

Konvention: englisch-Verb + deutsches Domain-Substantiv (Mixed-Compound
ist Bundle-V-konform).

Touched: lpUIStore + useLPNavigation + LPStartseite + useLPRouteSync
+ LPStartseite.test + useDeepLink (problemmeldungen).

vitest: 1234 passed. Browser-Smoke LP-Login + Composer ✓.
EOF
)"
```

---

## Phase 7 — Commit 7: useSuSNavigation.ts (6 Renames + zurueck)

### Task 7.1: zu* → open* + zurueck → back

**Files:**
- Modify: `ExamLab/src/hooks/ueben/useSuSNavigation.ts`
- Modify: `ExamLab/src/components/ueben/layout/AppShell.tsx` (oben verifizierter Caller von `zurueck`)
- Plus: alle Caller-Komponenten (initial-grep in Step 7.1.1).

- [ ] **Step 7.1.1: Caller-Inventory**

Run: `grep -nE "\b(zuDashboard|zuUebung|zuErgebnis|zuAdmin|zuGruppenAuswahl|zuPruefen)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r | head -100`
Files-Liste festhalten — typischerweise SuS-Komponenten (`components/ueben/...`, `components/sus/...`, etc.).

Run: `grep -nE "\.zurueck\(\)" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: nach Phase 6 nur noch `useSuSNavigation`-Caller.

- [ ] **Step 7.1.2: Rename in useSuSNavigation.ts**

- `const zuDashboard = useCallback(...)` → `const openDashboard = ...`
- `const zuUebung = useCallback(...)` → `const openUebung = ...`
- `const zuErgebnis = useCallback(...)` → `const openErgebnis = ...`
- `const zuAdmin = useCallback(...)` → `const openAdmin = ...`
- `const zuGruppenAuswahl = useCallback(...)` → `const openGruppenAuswahl = ...`
- `const zuPruefen = useCallback(...)` → `const openPruefen = ...`
- `const zurueck = useCallback(...)` → `const back = ...`
- Im Return-Object alle 7 Keys mit-renamen.

- [ ] **Step 7.1.3: Rename in allen Caller-Files**

Pro File aus Step 7.1.1 alle Vorkommen anpassen:
- destructure: `{ zuDashboard, zurueck } = useSuSNavigation()` → `{ openDashboard, back }`
- Call-sites: `zuDashboard()` → `openDashboard()` etc.
- useEffect-deps-arrays mitziehen.

Erwarte ~5-8 Files plus die Hook selbst.

- [ ] **Step 7.1.4: Verify-Audit (SuS-Hook)**

Run: `grep -nE "\b(zuDashboard|zuUebung|zuErgebnis|zuAdmin|zuGruppenAuswahl|zuPruefen)\b" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

Run: `grep -nE "\.zurueck\(\)" ExamLab/src --include='*.ts' --include='*.tsx' -r`
Expected: 0 Treffer.

- [ ] **Step 7.1.5: tsc + Tests + Browser-Smoke**

Run: `cd ExamLab && npx tsc -b && npm test 2>&1 | grep "Tests "` → `1234 passed`.

**Browser-Smoke (SuS):** Mit echtem SuS-Login (`wr.test@stud.gymhofwil.ch`) verifizieren:
- SuS-Login → Dashboard
- Üben starten (Thema klicken) → Übung läuft
- Übung beenden → Ergebnis-Seite
- Zurück zum Dashboard
- Logout (Domain-Verb `abmelden` bleibt deutsch)
- Console clean, Network 200.

- [ ] **Step 7.1.6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Bundle O Phase 7: useSuSNavigation zu* → open* (+ zurueck → back)

Programming-Primitives englisch (Bundle V).
Symmetrisch zu useLPNavigation (Phase 6).

Renames:
- zuDashboard → openDashboard
- zuUebung → openUebung
- zuErgebnis → openErgebnis
- zuAdmin → openAdmin
- zuGruppenAuswahl → openGruppenAuswahl
- zuPruefen → openPruefen
- zurueck → back

Damit ist Final-Audit-Pattern \.zurueck\(\) jetzt 0.

Touched: useSuSNavigation + ~5-8 SuS-Komponenten.

vitest: 1234 passed. Browser-Smoke SuS-Login + Üben + Ergebnis ✓.
EOF
)"
```

---

## Phase 8 — Commit 8: HANDOFF + Memory + Final-Audit

### Task 8.1: Final-Audit-Grep

- [ ] **Step 8.1.1: Audit-Grep über alle Patterns**

Run:
```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
grep -nE "\.zuruecksetzen\b|\.setze[A-Z]|\.navigiereZ|\.zurueckZum|\.zurueck\b\(\)|\.registriere\b\(|\.\babmelde\b\(|\.navigiere\b\(|\.zuDashboard\b\(|\.zuUebung\b\(|\.zuErgebnis\b\(|\.zuAdmin\b\(|\.zuGruppenAuswahl\b\(|\.zuPruefen\b\(" \
  ExamLab/src --include='*.ts' --include='*.tsx' -r \
  | grep -v "Defensive\|//\\s*Domain\|abmelden" \
  | grep -v "setzeTeilnehmer"
```
Expected: 0 Treffer.

**Erlaubte Ausnahmen (gefiltert):**
- `abmelden` (Auth-Domain-Verb, bleibt deutsch per Bundle V).
- `setzeTeilnehmer` (apiService HTTP-Action — Wire-Vertrag-Property in `klassenlistenApi.ts`, KEIN Store-Action — out-of-scope für Bundle O).
- Defensive-Marker-Kommentare und `// Domain`-Kommentare.

Falls Treffer ausserhalb dieser Ausnahmen: identifizieren, fixen, neue Audit-Run.

### Task 8.2: HANDOFF.md aktualisieren

**File:** `ExamLab/HANDOFF.md`

- [ ] **Step 8.2.1: Neuer Eintrag oben**

Direkt nach `## Letzter Stand auf main` (vor dem aktuellen Top-Bundle-Eintrag — vermutlich noch Bundle Q oder eine zwischenzeitliche Lehre) folgendes einfügen:

```markdown
### Bundle O — Store-Action-Naming-Vereinheitlichung ✅ MERGED (2026-05-06)

Merge-Commit `<TBD nach Merge>` auf `main`. Branch `refactor/bundle-o-store-naming` lokal + remote gelöscht. 7 Sub-Commits + 1 HANDOFF/Memory. Viertes Cleanup-Bundle aus dem Vereinfachungs-Audit (2026-05-05). 22 Action-Renames in 6 Stores + 2 Navigation-Hooks nach Bundle-V-Sprach-Konvention (Programming-Primitives englisch, Domain-Verben deutsch).

**Audit-Token-Diff:**
| Token | vorher | nachher |
|---|---:|---:|
| `setze` (Setter-Präfix) | ~50 | 0 |
| `zuruecksetzen` (pruefungStore) | 8 | 0 |
| `registriere(` (draftStore) | 19 | 0 |
| `navigiereZuComposer` | 14 | 0 |
| `zurueckZumDashboard` | 11 | 0 |
| `\.navigiere(` (pruefungStore) | ~3 | 0 |
| `\.zurueck()` (lpUIStore + useSuSNavigation) | ~3 | 0 |
| `navigiereZuEinstellungen/Korrektur/Monitoring/Frageneditor/Favoriten` | 11 | 0 |
| `\.zu(Dashboard\|Uebung\|Ergebnis\|Admin\|GruppenAuswahl\|Pruefen)\(` | 60+ | 0 |
| `set` (englischer Setter-Präfix) | (Baseline) | +50 |
| `register/openComposer/backToDashboard/back` etc. | 0 | ~190 |

**Domain-Verben unverändert (Bundle-V-Konvention):** anmelden / anmeldenMitGoogle / anmeldenMitCode / abmelden bleiben deutsch.

**Sub-Commits:**
- `<hash1>` Phase 1: ueben/authStore setzeRolle → setRolle
- `<hash2>` Phase 2: ueben/settingsStore setze*-Setter → set*
- `<hash3>` Phase 3: ueben/themenSichtbarkeitStore setze*-Setter → set*
- `<hash4>` Phase 4: draftStore registriere/setze* → register/set*
- `<hash5>` Phase 5: pruefungStore navigiere/zuruecksetzen → navigate/reset
- `<hash6>` Phase 6: lpUIStore + useLPNavigation navigiere*/zurueck* → openX/backToDashboard/back
- `<hash7>` Phase 7: useSuSNavigation zu* → open* + zurueck → back
- `<TBD>` Phase 8: HANDOFF + Memory

**Pre-Push-Verifikation:**
- vitest: 1234 passed | 4 todo (gleiche Baseline wie nach Bundle Q) ✅
- tsc -b: clean ✅
- npm run build: clean ✅
- npm run lint:as-any: 0 ✅
- npm run lint:no-tests-dir: 0 ✅
- Browser-E2E LP+SuS mit echten Logins ✓ (Phase 6 + 7 jeweils gesmoket)

**Apps-Script-Deploy:** nicht nötig (rein Frontend-TS).
**Preview-Sync:** `git push origin main:preview` nach Merge (deployment-workflow-Lehre 2026-05-06).
```

- [ ] **Step 8.2.2: Sub-Commit-Hashes nachtragen**

Run: `git log --oneline -10 | head -10`
Hashes der Phasen 1-7 in HANDOFF einfügen. Phase 8 bleibt `<TBD>` (= aktueller Commit).

### Task 8.3: Memory-File schreiben

**Path:** `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/`

- [ ] **Step 8.3.1: project_bundle_o_store_naming.md**

Inhalt:

```markdown
---
name: Bundle O Store-Action-Naming-Vereinheitlichung
description: ExamLab Bundle O (2026-05-06) — 22 Action-Renames in 6 Stores + 2 Hooks, Bundle-V-Sprach-Konvention strikt durchgesetzt
type: project
---

# Bundle O — Store-Action-Naming-Vereinheitlichung

**Datum:** 2026-05-06. Merge-Commit `<TBD>` auf main.

**Was:** Viertes Cleanup-Bundle aus Vereinfachungs-Audit (2026-05-05). 22 Action-Renames in 6 Stores + 2 Navigation-Hooks nach Bundle-V-Sprach-Konvention.

**Lager:**
- Setter-Renames (setze* → set*) in 4 Stores (draftStore, ueben/settingsStore, ueben/themenSichtbarkeitStore, ueben/authStore)
- Reset-Rename (zuruecksetzen → reset) in pruefungStore
- Register-Rename (registriere → register) in draftStore
- Navigation-Renames in 2 Stores (pruefungStore.navigate, lpUIStore.openComposer/backToDashboard/back) + 2 Hooks (useLPNavigation: 5 openX-Methoden, useSuSNavigation: 6 openX-Methoden + back)

**Domain-Verben unverändert (Bundle V):** anmelden/anmeldenMitGoogle/anmeldenMitCode/abmelden bleiben deutsch.

**Konvention etabliert:** englisch-Verb + deutsches Domain-Substantiv (`openEinstellungen`, `openKorrektur`, `openUebung`) ist Bundle-V-konform — Mixed-Language-Compound mit englischem Programming-Primitive-Präfix und deutschem Identifier-Domain-Wort.

**Test-Baseline:** 1234 vitest passes (gleich wie nach Bundle Q).

**Why:** Cleanup nach Audit-Empfehlung A2.3. Mix aus `setze*/zuruecksetzen` (deutsch) und `set*/toggle*/reset` (englisch) machte Action-Naming-Lesbarkeit schwammig. Bundle V gibt klare Heuristik (Programming-Primitives englisch, Domain-Wörter deutsch); Bundle O wendet diese in 6 Stores + 2 Hooks an.

**How to apply:** Bei neuen Stores/Hooks: Setter-/Reset-/Navigation-Actions auf englisch (`setX/openX/back/reset/register`), Auth-Domain-Verben deutsch (`anmelden/abmelden`).

**Sub-Commits:** `<hash1>` Phase 1 + `<hash2>` Phase 2 + `<hash3>` Phase 3 + `<hash4>` Phase 4 + `<hash5>` Phase 5 + `<hash6>` Phase 6 + `<hash7>` Phase 7 + `<TBD>` Phase 8.
```

- [ ] **Step 8.3.2: MEMORY.md-Index ergänzen**

In MEMORY.md ExamLab-Sektion (vor existierender Bundle-Q-Zeile) einfügen:

```markdown
- **[Bundle O Store-Action-Naming auf main](project_bundle_o_store_naming.md)** — 2026-05-06 Merge `<TBD>`. Viertes Cleanup-Bundle. 22 Action-Renames in 6 Stores + 2 Navigation-Hooks. Programming-Primitives englisch, Domain-Verben (anmelden/abmelden) deutsch. Bundle-V-Konvention strikt durchgesetzt. 1234 vitest.
```

### Task 8.4: Final-Verifikation vor Phase-8-Commit

- [ ] **Step 8.4.1: All gates green**

Run:
```bash
cd ExamLab && npx tsc -b && npm test 2>&1 | grep "Tests " && npm run build 2>&1 | tail -3 && npm run lint:as-any && npm run lint:no-tests-dir
```
Expected: tsc clean + 1234 passes + build clean + beide lint-gates 0.

### Task 8.5: Phase 8 commit

- [ ] **Step 8.5.1: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git add ExamLab/HANDOFF.md
git commit -m "Bundle O Phase 8: HANDOFF + Memory"
```

(Memory-Dir ist nicht git-tracked — Files sind separat geschrieben.)

---

## Final Verification (vor PR / Merge)

- [ ] **Step F.1: Vollständige Test-Suite**

Run: `cd ExamLab && npm test 2>&1 | grep "Tests "` → `1234 passed`.

- [ ] **Step F.2: tsc + Build**

Run: `cd ExamLab && npx tsc -b && npm run build 2>&1 | tail -3` → clean.

- [ ] **Step F.3: Lint-Gates**

Run: `cd ExamLab && npm run lint:as-any && npm run lint:no-tests-dir`
Expected: beide exit 0.

- [ ] **Step F.4: Final-Audit-Grep**

Run (Step 8.1.1 wiederholen) → 0 Treffer.

- [ ] **Step F.5: Browser-E2E (User oder ich verifiziert)**

LP-Login → Dashboard → Composer öffnen → Speichern → backToDashboard. Console clean.
SuS-Login → Üben starten → navigate(idx) → Übung beenden → openErgebnis → openDashboard → Logout (`abmelden` bleibt deutsch). Console clean.

- [ ] **Step F.6: Push + PR**

```bash
git push -u origin refactor/bundle-o-store-naming
gh pr create --title "Bundle O: Store-Action-Naming + Navigation-Hook-Vereinheitlichung" --body "$(cat <<'EOF'
## Summary
- 22 Action-Renames in 6 Zustand-Stores + 2 Navigation-Hooks nach Bundle-V-Sprach-Konvention
- Programming-Primitives englisch (`set*/openX/backToDashboard/back/reset/register/navigate`), Domain-Verben deutsch (`anmelden/abmelden`)
- ~36 unique Files, ~190 Occurrences

Spec: [`docs/superpowers/specs/2026-05-06-bundle-o-store-naming-design.md`](ExamLab/docs/superpowers/specs/2026-05-06-bundle-o-store-naming-design.md)
Plan: [`docs/superpowers/plans/2026-05-06-bundle-o-store-naming.md`](ExamLab/docs/superpowers/plans/2026-05-06-bundle-o-store-naming.md)

## Test plan
- [x] vitest: 1234 passed
- [x] tsc -b clean
- [x] npm run build clean
- [x] lint:as-any 0, lint:no-tests-dir 0
- [x] Final-Audit-Grep 0
- [x] Browser-E2E LP (Composer + Dashboard) ✓
- [x] Browser-E2E SuS (Üben + Ergebnis + Dashboard) ✓
- [ ] CI grün auf Branch (production + staging mit allen Gates)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step F.7: Post-Merge-Schritte**

Nach Merge:
1. `<TBD>`-Hashes in HANDOFF + Memory durch Merge-SHA ersetzen.
2. `git push origin main:preview` (deployment-workflow-Lehre).
3. Branch löschen: `git branch -d refactor/bundle-o-store-naming`.

---

## Out of Scope / Folge-Bundles

Aus der Audit-Roadmap:

- **Bundle R** — Error-Handling-Vereinheitlichung (M, ~2 Sessions, A/B-Verifizierung pro `alert()`-Stelle).
- **Bundle S** — Datei-Hotspots Niedrig-Risiko-Splits (5 Files, S).
- **Bundle P** — `musterlosung` Field-Drift (erhöhtes Risiko, Apps-Script-Storage-Vertrag berührt).
- **Bundle T** — Datei-Hotspots Mittel-Risiko-Splits + Hook-Extraktion (M-L, ~3-4 Sessions).

Plus aus Bundle-O-Spec-Reviewer-Recommendations:
- Nach Merge: `open*/navigate*/back*` als Verb-Präfixe in `.claude/rules/code-quality.md` Bundle-V-Sektion ergänzen.
- Optional: Phase-6-Split in 6a (Hook-only) + 6b (Store) für tighter bisect granularity bei künftigen Bundles dieser Art.
