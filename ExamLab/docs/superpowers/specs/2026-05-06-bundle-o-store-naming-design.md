# Bundle O — Store-Action-Naming-Vereinheitlichung

> Viertes Cleanup-Bundle nach Bundle M (Fragenbank → Fragensammlung), Bundle N+V (action/aktion + Sprach-Konvention) und Bundle Q (Test-Verzeichnis-Konsolidierung). Befundgrundlage stammt aus dem Vereinfachungs-Audit vom 2026-05-05 (Branch `audit/examlab-vereinfachung`, nicht auf `main` committed); die für Bundle O relevanten Befunde sind unten inline übernommen, damit die Spec self-contained bleibt.

## Audit-Befund (inline aus A2.3 + Roadmap-Bundle O)

**Befund (A2.3):** Action-Naming in Zustand-Stores ist inkonsistent — Mix aus englischem `set*/toggle*/reset` und deutschem `setze*/zuruecksetzen`. Audit nennt 4 Stores explizit (`authStore`, `pruefungStore`, `lpUIStore`, optional `draftStore`). Beim Re-Audit für die Spec wurde aufgedeckt: 3 weitere Stores im `ueben/`-Subtree haben das gleiche Pattern (`ueben/authStore`, `ueben/settingsStore`, `ueben/themenSichtbarkeitStore`). Total: 6 Stores brauchen Renames; `authStore.ts` (root) ist bereits konform und bleibt unangetastet.

**Roadmap-Klassifikation:** Bundle O, Aufwand **M** (Audit) → revidiert auf **M-L** (~1-2 Sessions, ~119 Occurrence-Rewrites über ~30 Files), Risiko **refactor** (mittel — Caller verstreut), keine Abhängigkeiten. Test-Plan: Vitest grün + LP-/SuS-Browser-E2E auf Login, Logout, Prüfung-Navigation, Composer-öffnen.

**Spannung mit Bundle V (Sprach-Konvention):** Audit empfahl pragmatic „alles englisch". Bundle V (parallel auf main gemerged) sagt: Programming-Primitives (`set*/get*/toggle*/use*/on*/handle*`) englisch, Domain-Wörter im Identifier deutsch ohne Umlaut. Diese Spec wendet Bundle V strikt an — Setter+Reset+Navigation auf englisch, Auth-Domain-Verben (`anmelden/abmelden/anmeldenMitGoogle/anmeldenMitCode`) bleiben deutsch.

---

## Scope & Ziel

**Was:** Action-Naming in 6 Zustand-Stores nach Bundle-V-Sprach-Konvention vereinheitlichen. Programming-Primitives auf englisch (`setze*→set*`, `zuruecksetzen→reset`, `registriere→register`, `navigiere*→navigate/openX/back*`). Tests + Caller-Migration im selben Commit pro Store.

**Was nicht:**
- Keine Store-Logik-Änderung, keine neuen Actions, keine Backward-Compat-Aliases (rein Frontend-TS, tsc fängt Caller-Misses).
- Keine `getX`-Selectors anfassen (waren nicht Audit-Befund).
- `authStore.ts` (root) ist bereits konform — wird nicht angefasst, nur als „checked"-Eintrag im HANDOFF erwähnt.
- Domain-Verben (`anmelden/anmeldenMitGoogle/anmeldenMitCode/abmelden`) bleiben deutsch (Bundle-V-Konvention).

**Definition of Done:**
- 6 Stores (`draftStore`, `ueben/themenSichtbarkeitStore`, `ueben/settingsStore`, `ueben/authStore`, `pruefungStore`, `lpUIStore`) haben alle Programming-Primitive-Actions auf englisch.
- Final-Audit-Grep: 0 Treffer von `\.zuruecksetzen\b|\.setze[A-Z]|\.navigiereZ|\.zurueckZum|\.zurueck\b\(\)|\.registriere\b\(|\.navigiere\b\(` in `ExamLab/src` (außer in den 4 unangefassten Auth-Domain-Verben `anmelden*/abmelden`).
- `npm test` grün mit gleicher Anzahl (1234 passed | 4 todo).
- `npx tsc -b` clean.
- `npm run lint:as-any` 0, `npm run lint:no-tests-dir` 0 (Baselines gehalten).
- Browser-E2E LP+SuS bestätigt (Console clean, kein „X is not a function").
- HANDOFF + Memory-Eintrag „Bundle O ✅ MERGED".
- `origin/preview` FF zu main nach Merge (deployment-workflow-Lehre 2026-05-06).

**Risiko:** **refactor** (mittel) — Caller verstreut, `setzeStatus` cross-store identisch (verschiedene Signaturen). Mitigation: per-Store-Commit + `tsc -b` + `npm test` zwischen Commits, Edit-Tool exact-string-replace mit Kontext (NICHT `replace_all`), Audit-Grep nach jeder Phase.

**Aufwand:** **M-L** — 1-2 Sessions, 7 Sub-Commits (6 Per-Store + 1 HANDOFF/Memory).

**Abhängigkeiten:** keine. Parallel zu allen anderen Bundles spielbar (kein Wire-Vertrag-Konflikt mit Bundle P, Bundle R, Bundle S/T).

---

## Strategie-Entscheidungen (Klärungsfragen)

| Frage | Entscheidung | Begründung |
|---|---|---|
| Scope | **A — alle 7 Stores (= 6 zu ändern + 1 bereits konform)** | Audit unterzählte; konsequent durchziehen. |
| Domain-Verben (`anmelden/abmelden/...`) | **A — bleiben deutsch** | Bundle-V-Konvention strikt anwenden. Audit-Empfehlung „alles englisch" ist überstimmt. |
| Navigations-Actions (`navigiere*/zurueck*`) | **A — alles englisch** | Sind UI-State-Mutationen, nicht Domain-Logik. Bundle V's Programming-Primitive-Heuristik passt. |
| Commit-Strategie | **A — pro Store atomarer Commit** (Bundle-M/N+V-Pattern) | Klares Bisect-Verhalten, vitest grün dazwischen. |
| Backward-Compat-Aliases | **Nein** | Rein Frontend-TS, tsc fängt Caller-Misses sofort. |

---

## Renames-Map (alle 6 Stores, ~119 Occurrence-Rewrites)

### draftStore.ts (3 Renames)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `registriere(editorId)` | `register(editorId)` | 3 | 19 |
| `setzeDirty(editorId, dirty)` | `setDirty(editorId, dirty)` | 3 | 15 |
| `setzeStatus(editorId, status)` | `setStatus(editorId, status)` | (siehe ueben/themen) | (siehe ueben/themen) |

### ueben/themenSichtbarkeitStore.ts (2 Renames)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `setzeStatus(...)` | `setStatus(...)` | 6* | 17* |
| `setzeUnterthemen(...)` | `setUnterthemen(...)` | 2 | 7 |

*`setzeStatus` ist sowohl in draftStore als auch themenSichtbarkeitStore — der Grep counted beide. Stores haben unterschiedliche Signaturen (`(editorId, status)` vs `(gruppeId, fach, thema, status, ...)`), tsc fängt cross-Store-Verwechslungen.

### ueben/settingsStore.ts (2 Renames)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `setzeDefaults(typ)` | `setDefaults(typ)` | 2 | 5 |
| `setzeEinstellungen(e)` | `setEinstellungen(e)` | 3 | 12 |

### ueben/authStore.ts (1 Rename)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `anmeldenMitGoogle/anmeldenMitCode/abmelden` | (bleiben — Domain-Verben) | – | – |
| `setzeRolle(rolle)` | `setRolle(rolle)` | 2 | 4 |

### pruefungStore.ts (2 Renames)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `setAntwort/toggleMarkierung/setPhase/setVerbindungsstatus/setLetzterSave/setBeendetUm/setDurchfuehrungId/setMultiTabWarnung/setConfigUndFragen` | (bleiben — bereits konform) | – | – |
| `navigiere(index)` | `navigate(index)` | 4 | 7 |
| `zuruecksetzen()` | `reset()` | 5 | 8 |

### lpUIStore.ts (3 Renames)

| Aktuell | Neu | Files | Occurrences |
|---|---|---:|---:|
| `setModus/setListenTab/setUebungsTab/toggleHilfe/setZeigEinstellungen/toggleEinstellungen/setBreadcrumbs/setAktiveConfigId/reset` | (bleiben — bereits konform) | – | – |
| `navigiereZuComposer(titel, configId)` | `openComposer(titel, configId)` | 5 | 14 |
| `zurueckZumDashboard()` | `backToDashboard()` | 5 | 11 |
| `zurueck()` | `back()` | 1 | 1 |

### Total

11 Action-Renames in 6 Stores. **Caller-Migration-Sweep:** ~30 unique Files, ~119 Occurrences. `authStore.ts` (root) bleibt unangetastet als Sanity-Eintrag im HANDOFF.

---

## Commit-Reihenfolge

Branch: `refactor/bundle-o-store-naming`. 7 atomare Commits, klein → groß.

| # | Commit | Stores | Renames | ~Occurrences |
|---|---|---|---:|---:|
| 1 | `Bundle O Phase 1: ueben/authStore setzeRolle → setRolle` | ueben/authStore | 1 | 4 |
| 2 | `Bundle O Phase 2: ueben/settingsStore setze*-Setter → set*` | ueben/settingsStore | 2 | 17 |
| 3 | `Bundle O Phase 3: ueben/themenSichtbarkeitStore setze*-Setter → set*` | ueben/themenSichtbarkeitStore | 2 | 24 |
| 4 | `Bundle O Phase 4: draftStore registriere/setze* → register/set*` | draftStore | 3 | 34 |
| 5 | `Bundle O Phase 5: pruefungStore navigiere/zuruecksetzen → navigate/reset` | pruefungStore | 2 | 15 |
| 6 | `Bundle O Phase 6: lpUIStore navigiere*/zurueck* → openComposer/backToDashboard/back` | lpUIStore | 3 | 26+ |
| 7 | `Bundle O Phase 7: HANDOFF + Memory` | – | – | – |

Phase 1 ist Smoke-Test (kleinster Commit). Phase 6 (lpUIStore) ist die UI-betreffendste — danach Browser-Smoke vor Final-Verifikation.

### Pro Phase

1. Rename in Store-Datei (Type-Definition + Implementation).
2. `grep -lE "\b<altName>\b" ExamLab/src --include='*.ts' --include='*.tsx' -r` → Liste aller betroffenen Files.
3. Per File `Edit`-Tool (NICHT `replace_all`), pro Edit prüfen ob es der richtige Store ist (vor allem bei `setzeStatus` cross-store).
4. Tests in den betroffenen Files mitziehen.
5. `npx tsc -b 2>&1 | tail -5` → 0 Error-Zeilen. Falls Errors: Caller-Misses identifizieren, fixen.
6. `cd ExamLab && npm test 2>&1 | grep "Tests "` → `1234 passed | 4 todo`.
7. Audit-Grep für die in dieser Phase umbenannten Actions → 0 Treffer.
8. Commit.

### Audit-Pattern pro Phase

```bash
grep -nE "\.<altName>\b" ExamLab/src --include='*.ts' --include='*.tsx' -r
# Erwartet: 0 Treffer (außer vielleicht in Tests die explizit den Re-Export checken)
```

### Final-Audit-Grep (Phase 7)

```bash
grep -nE "\.zuruecksetzen\b|\.setze[A-Z]|\.navigiereZ|\.zurueckZum|\.zurueck\b\(\)|\.registriere\b\(|\.navigiere\b\(" \
  ExamLab/src --include='*.ts' --include='*.tsx' -r | wc -l
# Erwartet: 0
```

---

## Test-Plan

### Pro Per-Store-Commit (während Implementation)

1. `npx tsc -b 2>&1 | tail -5` → keine Error-Zeilen.
2. `cd ExamLab && npm test 2>&1 | grep "Tests "` → `1234 passed | 4 todo` (gleiche Anzahl).
3. Audit-Grep für die in diesem Commit umbenannten Actions → 0 Treffer.
4. Falls Phase eine UI-relevante Datei berührt (insbesondere Phase 6 lpUIStore mit `LPHeader.tsx`, `LPSidebar.tsx`, …): kurzer Browser-Smoke (LP-Login, Tab-Wechsel, Composer öffnen, zurück).

### Vor PR / Merge (alle Phasen abgeschlossen)

1. **Final-Audit-Grep** → 0.
2. `npm test` → 1234 passes.
3. `npx tsc -b` → clean.
4. `npm run build` → success.
5. `npm run lint:as-any` → 0.
6. `npm run lint:no-tests-dir` → 0.
7. **Browser-E2E mit echten Logins** (Memory-Regel „Echte Logins statt Demo"):
   - LP-Login (`wr.test@gymhofwil.ch`) → Dashboard → Composer öffnen (`openComposer`) → Speichern → zurück (`backToDashboard`).
   - SuS-Login (`wr.test@stud.gymhofwil.ch`) → Üben starten → Frage navigieren (`navigate(idx)`) → Übung beenden → Logout (`abmelden` bleibt deutsch).
   - Beobachten: Console clean, Network 200, kein „X is not a function"-Fehler.
8. CI grün auf Branch (production-Job + staging-Job, alle Gates ✅).

---

## Audit-Token-Diff (erwartet, für HANDOFF)

| Token | vorher | nachher |
|---|---:|---:|
| `setze` (Setter-Präfix) | ~50 | 0 |
| `zuruecksetzen` | 8 | 0 |
| `registriere(` (draftStore) | 19 | 0 |
| `navigiereZuComposer` | 14 | 0 |
| `zurueckZumDashboard` | 11 | 0 |
| `\.navigiere(` (pruefungStore) | 7 | 0 |
| `\.zurueck()` (lpUIStore) | 1 | 0 |
| `set` (englischer Setter-Präfix) | (Baseline) | +50 |
| `register(` | 0 | 19 |
| `openComposer` | 0 | 14 |
| `backToDashboard` | 0 | 11 |
| `\.navigate(` (pruefungStore) | 0 | 7 |
| `\.back()` (lpUIStore) | 0 | 1 |
| `reset()` (pruefungStore) | 0 | 8 |

**Auth-Domain-Verben unverändert (Bundle-V-Konvention):**
- `anmelden/anmeldenMitGoogle/anmeldenMitCode/abmelden` — keine Änderung.

Test-Anzahl unverändert: 1234 passes (vitest-Baseline nach Bundle Q).

---

## Risiken + Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Caller-Miss in einem `.tsx`-File via destructuring | mittel | tsc-Error sofort | tsc-b zwischen Phasen; Edit exact-string mit Kontext |
| `setzeStatus` Cross-Store-Verwechslung | mittel | Funktionsbug | Edit pro File mit umgebendem Kontext, NICHT `replace_all` über Repo. tsc fängt Type-Mismatches |
| useEffect-deps-Array enthält alten Action-Namen | niedrig-mittel | Stale closure / endless re-render | Audit-Grep nach Phase prüft `\b<oldName>\b` (word-boundary), nicht nur `\.<oldName>\(` |
| Test-Files referenzieren via `vi.fn()`-Mocks die alten Namen | mittel | Tests grün aber falsch | Bundle-Q-Lehre: kombinierter Grep auch über `vi.mock\(['"]\.|import\(['"]\.` |
| Browser-E2E zeigt subtile UI-Bugs nach Phase 6 | niedrig | UX-Bruch | Browser-Smoke nach Phase 6 + Final-E2E vor Merge |

**Pre-Flight aus deployment-workflow-Lehre (2026-05-06):** Bundle O führt KEIN neues CI-Gate ein, aber `git push origin main:preview` nach Merge, weil staging-Build sonst stale läuft.

---

## Out-of-Scope

- `getX`-Selectors (`getStatus`, `getAktiveThemen`, `getAktiveUnterthemen`, …) — waren nicht Audit-Befund. Bleiben wie aktuell.
- Domain-Verb-Rename (`anmelden → login`, `abmelden → logout` etc.) — explizit gegen Bundle-V-Konvention.
- `subscribe`/`unsubscribe`/Zustand-Native-API — Library-Konvention, nicht touched.
- `authStore.ts` (root, nicht ueben) — bereits konform, keine Änderung.
- Store-Logik-Refactoring, Selector-Performance-Tuning, Cache-Layer-Änderungen.
- `pruefungStore`-Internals: `setAntwort`'s Antwort-Type-Validierung, `toggleMarkierung`-Persistierung — alles unangetastet.

---

## Folge-Bundles (laut Audit-Roadmap)

- **Bundle R** — Error-Handling-Vereinheitlichung (M, ~2 Sessions, A/B-Verifizierung pro `alert()`-Stelle).
- **Bundle S** — Datei-Hotspots Niedrig-Risiko-Splits (5 Files, S).
- **Bundle P** — `musterlosung` Field-Drift-Konsolidierung (erhöhtes Risiko, Apps-Script-Storage-Vertrag berührt).
- **Bundle T** — Datei-Hotspots Mittel-Risiko-Splits + Hook-Extraktion (M-L, ~3-4 Sessions).
