# Bundle M — Fragenbank → Fragensammlung Rename

**Datum:** 2026-05-05
**Status:** Spec freigegeben durch User-Brainstorming, Reviewer-Loop offen
**Charakter:** Mechanischer Rename mit koordiniertem Apps-Script-Deploy + Sheet-Spalten-Rename
**Branch:** `feature/bundle-m-fragensammlung-rename` (von main)
**Folge-Phase:** writing-plans-Skill → konkreter Plan mit Task-Liste pro Commit

---

## 1. Ziel

Den Legacy-Begriff `fragenbank` (152 Frontend-Treffer + ~105 Apps-Script-Treffer + 16 Test-Files + 1 Sheet-Spalte + 1 IDB-DB-Name) komplett auf `fragensammlung` umbenennen. UI heisst seit Session 99 „Fragensammlung", der Code zieht nun nach.

Bundle M ist erstes Bundle der Cleanup-Roadmap aus dem [Vereinfachungs-Audit (05.05.2026)](../audits/2026-05-05-examlab-vereinfachung-audit.md). Mechanischer Rename, niedriges Risiko, macht Phase-2-Refactors lesbarer.

## 2. Code-Bereich-Inventar

### 2.1 Frontend (ExamLab/src)

**Service- und Store-Files (3, alle umbenennen):**
- `ExamLab/src/services/fragenbankApi.ts` → `fragensammlungApi.ts`
- `ExamLab/src/services/fragenbankCache.ts` → `fragensammlungCache.ts`
- `ExamLab/src/store/fragenbankStore.ts` → `fragensammlungStore.ts`

**Komponenten-Ordner (15 Files inkl. `fragenbrowser/`-Subordner):**
- `ExamLab/src/components/lp/fragenbank/` → `fragensammlung/`

Liste der Files im Ordner:
- `FragenBrowser.tsx`, `PoolSyncDialog.tsx`, `ExcelImport.tsx`, `DraftsSection.tsx` (Bundle 3), `FragenImport.tsx`, `RueckSyncDialog.tsx`, `index.ts`
- `fragenbrowser/`: `FragenBrowserHeader.tsx`, `DetailKarte.tsx`, `PoolBadges.tsx`, `VirtualisierteFragenListe.tsx`, `gruppenHelfer.ts`, `KompaktZeile.tsx`

**Test-Files (16, mit fragenbank-Imports):**
- Identifiziert durch `grep -rEn "fragenbank|Fragenbank" --include="*.test.*" ExamLab/src/__tests__ ExamLab/src/tests`
- Beispiele: `VirtualisierteFragenListe.test.tsx`, `DraftsSection.test.tsx`, `FragenBrowser.test.tsx`, `LPStartseite.test.tsx`, `LPStartseiteBeforeUnload.test.tsx`, `fragenBrowserEditorPrefetch.test.tsx`, `authStoreLoginPrefetch.test.ts`, `useEditorNeighborPrefetch.test.tsx`

**Storage:**
- IDB DB-Name in `fragensammlungCache.ts`: `'examlab-fragenbank-cache'` → `'examlab-fragensammlung-cache'`
- One-Time-Delete-Hook für alte DB in `authStore.anmelden()` (LP-Login):
  ```ts
  // Bundle M: alte fragenbank-DB einmalig droppen (Cleanup)
  const req = indexedDB.deleteDatabase('examlab-fragenbank-cache')
  req.onsuccess = () => console.info('[Bundle M] alte fragenbank-DB gedroppt')
  // onerror/onblocked silent — DB existiert evtl. nicht (post-Deploy-Re-Login)
  ```

### 2.2 Apps-Script (ExamLab/apps-script-code.js)

**Konstanten:**
- `FRAGENBANK_ID` → `FRAGENSAMMLUNG_ID` (Z. 106; Wert bleibt `'1ASSRv7m...'`)

**Variablen (lokal):**
- `var fragenbank = SpreadsheetApp.openById(...)` → `var fragensammlung = ...` (Z. 280, 761, 2806)

**Funktionen:**
- `function getFragenbankTabs_()` (Z. 279) → `getFragensammlungTabs_()`
- `function ladeFragenbank(email)` (Z. 4842) → `ladeFragensammlung(email)`
- `function ladeFragenbankSummary(email)` (Z. 4894) → `ladeFragensammlungSummary(email)`

**Endpoint-Cases (Wire-Vertrag):**
- `case 'ladeFragenbank':` → `case 'ladeFragensammlung':`
- `case 'ladeFragenbankSummary':` → `case 'ladeFragensammlungSummary':`

**Cache-Keys (transient, 30min TTL):**
- `cacheGet_('fragenbank_summary')` / `cachePut_('fragenbank_summary', …)` → `'fragensammlung_summary'` (Z. 4904, 4928)

**Sheet-Lookup-String:**
- `headers.indexOf('fragenbanksheetid')` → `'fragensammlungsheetid'` (Z. 391, in `alleGruppenLaden_()`)

**JS-Field-Name (Typo `fragebank` ohne `n` simultan korrigiert) — Apps-Script + Frontend:**
- `fragebankSheetId` → `fragensammlungSheetId` (Audit zeigt: ~14 Apps-Script-Stellen + 5 Frontend-Stellen)
- Apps-Script-Stellen:
  - Z. 310, 341 (öffnen Spreadsheet)
  - Z. 391 (Field-Definition in `alleGruppenLaden_()`)
  - Z. 8793, 8834, 8886, 8939 (lernplattform-Pfade)
  - Z. 9020 (Initial-Setup)
  - Z. 9041, 9086, 9122, 9193 (lernplattform-Pfade)
  - Z. 9260, 9781, 9792, 9793 (Familie-Gruppen-Logik)
- **Frontend-Stellen** (im selben Commit 2 oder als eigener Commit 2b — Plan entscheidet):
  - `ExamLab/src/types/ueben/gruppen.ts:6` — Type-Definition `fragebankSheetId: string`
  - `ExamLab/src/AppUeben.tsx:74` — Demo-Mock-Daten
  - `ExamLab/src/adapters/ueben/appsScriptAdapter.ts:35` — Adapter Omit-Type
  - `ExamLab/src/tests/gruppenStoreCache.test.ts:24` — Test-Mock
  - `ExamLab/src/tests/gruppenCache.test.ts:11` — Test-Mock
- Da der Field-Name **serialisiert** zwischen Apps-Script-JSON und Frontend-Type wandert (über `appsScriptAdapter.ts`), nutzen wir die gleiche Backward-Compat-Strategie wie für die Endpoint-Namen: **Apps-Script JSON-Response liefert in Commit 1 BEIDE Felder** (`fragebankSheetId` + `fragensammlungSheetId` mit identischem Wert) → Commit 3 stellt Frontend-Type auf neuen Namen um → Commit 6 entfernt das alte Feld aus der Response. Damit bricht nichts während Deploy-Lag.

### 2.3 Externes Sheet (User-Action-Item)

**Spreadsheet:** `https://docs.google.com/spreadsheets/d/1VH7Vu7JIKYLic2-wK2uSa2nXA7WVvStKOjUDi9cpWnI/edit`
**Tab:** `Gruppen`
**Spalten-Header umbenennen:** `fragenbanksheetid` → `fragensammlungsheetid` (Klein-/Grossschreibung egal — Lookup ist case-insensitive).
**Daten-Migration:** keine (vermutlich 1 Datenzeile, nur Header-Rename).

### 2.4 Out of scope

- Sheet-Spalten **innerhalb** der Fragensammlung-Spreadsheets (z.B. `musterlosung`, `bewertungsraster`) — Bundle P
- `pool`-Tokens — separates Bundle (gemischt)
- `action`/`aktion`-Mix in Apps-Script — Bundle N
- Spreadsheet-Filename in Drive (Kosmetik, ID-basiert auflösen)
- Doku-Files (`HANDOFF.md` Historie, audit-Doku, vergangene Spec/Plan) — historische Treffer bewusst belassen
- `packages/shared/src/` — laut Audit `fragenbank`: 0 Treffer (keine Änderung nötig)
- Frontend-User-sichtbare Texte (sind bereits „Fragensammlung")
- IDB-Schema-Migration der Cache-Inhalte (alte DB wird gedroppt, neuer Cache füllt sich vom Server)

## 3. Sub-Commit-Sequenz

Branch: `feature/bundle-m-fragensammlung-rename` von `main`. Jeder Commit: `npx tsc -b` + `npx vitest run` + `npm run build` + `npm run lint:as-any` clean.

### Commit 1 — Apps-Script Backward-Compat (deploy-ready)

**Ziel:** Apps-Script akzeptiert ALTE und NEUE Endpoint-Namen + Sheet-Spalten-Header gleichzeitig. Kein Frontend-Code-Change.

**Änderungen:**
- Sheet-Spalten-Lookup in `alleGruppenLaden_()`: liest `'fragensammlungsheetid'` ODER `'fragenbanksheetid'`, Response liefert BEIDE Field-Namen mit identischem Wert (Typo-Fix-Backward-Compat):
  ```js
  var idxNeu = headers.indexOf('fragensammlungsheetid');
  var idxAlt = headers.indexOf('fragenbanksheetid');
  var idx = idxNeu !== -1 ? idxNeu : idxAlt;
  var sheetId = String(idx !== -1 ? data[i][idx] : '');
  result.push({
    ...,
    fragebankSheetId: sheetId,         // backward-compat (Typo-Field, von Frontend-Bundle alt gelesen)
    fragensammlungSheetId: sheetId,    // neu (von Frontend-Bundle neu gelesen, ab Commit 3)
    ...,
  });
  ```
- Dispatcher-Cases additiv: `case 'ladeFragensammlung':` + `case 'ladeFragenbank':` rufen denselben Funktions-Body. Analog `…Summary`.

**User-Aktion:** kein Deploy nach Commit 1 — wir warten bis nach Commit 2 (siehe Apps-Script-Deploy-Plan unten), beide Commits werden gemeinsam deployed.

### Commit 2 — Apps-Script intern alles umbenennen

**Änderungen:**
- `FRAGENBANK_ID` → `FRAGENSAMMLUNG_ID` (Konstante + alle ~10 Aufrufer)
- `var fragenbank` → `var fragensammlung` (3 Stellen)
- `function getFragenbankTabs_()` → `getFragensammlungTabs_()` + Caller anpassen
- `function ladeFragenbank()` → `ladeFragensammlung()` (Body + Aufrufer-Funktionen wie `ladeFrageDetail()` falls intern aufrufend)
- `function ladeFragenbankSummary()` → `ladeFragensammlungSummary()`
- Cache-Keys `'fragenbank_summary'` → `'fragensammlung_summary'`
- Sheet-Lookup-String: `'fragenbanksheetid'` als bevorzugte Variante belassen (Backward-Compat aus Commit 1 bleibt)
- JS-Field-Variable `fragebankSheetId` → `fragensammlungSheetId` (~14 Stellen Apps-Script-intern, **gleichzeitig** Typo korrigiert). JSON-Response weiterhin BEIDE Felder ausliefert (Backward-Compat aus Commit 1 bleibt aktiv).
- Comments + JSDoc wo relevant

**Endpoint-Cases bleiben unverändert** — beide Aliases (`ladeFragenbank` + `ladeFragensammlung`) leben aus Commit 1 weiter.

**User-Aktion:** **Deploy 1** (nach Commit 1 + 2 zusammen, ein einziger Deploy aktiviert alles).

**User-Aktion (parallel zu Deploy 1, vor Commit 6):** Sheet-Spalte `fragenbanksheetid` → `fragensammlungsheetid` im Gruppen-Tab umbenennen. Backward-Compat im Apps-Script lässt diese Reihenfolge frei (umbenennen vor oder nach Deploy 1, beides funktioniert).

### Commit 3 — Frontend Service-Layer-Rename + Frontend-Type-Field-Rename

**Änderungen:**
- `git mv ExamLab/src/services/fragenbankApi.ts fragensammlungApi.ts`
- `git mv ExamLab/src/services/fragenbankCache.ts fragensammlungCache.ts`
- `git mv ExamLab/src/store/fragenbankStore.ts fragensammlungStore.ts`
- File-Inhalte: alle Identifier umbenennen (Klassen, Funktionen, Exports, Typen)
- Action-Strings: `postJson('ladeFragenbank', ...)` → `postJson('ladeFragensammlung', ...)`
- **Frontend Type-Field-Rename** (Typo-Fix, hängt an Apps-Script-JSON-Response-Backward-Compat aus Commit 1):
  - `ExamLab/src/types/ueben/gruppen.ts:6` — Type-Field `fragebankSheetId: string` → `fragensammlungSheetId: string`
  - `ExamLab/src/AppUeben.tsx:74` — Demo-Mock-Daten
  - `ExamLab/src/adapters/ueben/appsScriptAdapter.ts:35` — Adapter Omit-Type
  - `ExamLab/src/tests/gruppenStoreCache.test.ts:24` — Test-Mock
  - `ExamLab/src/tests/gruppenCache.test.ts:11` — Test-Mock
- IDB-DB-Name in `fragensammlungCache.ts`: `'examlab-fragenbank-cache'` → `'examlab-fragensammlung-cache'`
- One-Time-Delete-Hook in `authStore.anmelden()` für LP-Login (mit Console-Log für E2E-Verifikation):
  ```ts
  // Bundle M: alte fragenbank-DB einmalig droppen
  const req = indexedDB.deleteDatabase('examlab-fragenbank-cache')
  req.onsuccess = () => console.info('[Bundle M] alte fragenbank-DB gedroppt')
  ```
- Imports + Re-Exports in allen Caller-Files anpassen (wird durch tsc gefangen)

**Test-Files in diesem Commit nicht angefasst** — laufen via vitest grün, weil Apps-Script-Mocks via Frontend-Action-String matchen (neue Action ist `'ladeFragensammlung'`).

### Commit 4 — Frontend Komponenten-Ordner-Rename

**Änderungen:**
- `git mv ExamLab/src/components/lp/fragenbank ExamLab/src/components/lp/fragensammlung`
- Alle Imports `'../components/lp/fragenbank/...'` → `'.../fragensammlung/...'` (~30+ Stellen, tsc-getrieben)
- File-Inhalte: Komponenten-Namen, Identifier, Comments anpassen wo `fragenbank`/`Fragenbank` vorkommt

### Commit 5 — Tests + Mocks

**Änderungen:**
- 16 Test-Files: Imports + Mock-Action-Strings + Test-Beschreibungen
- Mock-Helpers (z.B. in `__tests__/helpers/`) wo `'fragenbank'`-Referenzen
- IDB-Mocks in Tests (jsdom + fake-indexeddb): DB-Name auf neuen Wert anpassen

### Commit 6 — Apps-Script Backward-Compat entfernen + HANDOFF + Memory + Audit-Diff

**Pre-Bedingung (User-bestätigt):**
- ✅ Sheet-Spalte umbenannt (User hat es im Browser gemacht)
- ✅ Apps-Script-Deploy(s) durchgeführt
- ✅ Browser-E2E erfolgreich (alle 8 Pfade)

**Änderungen:**
- Apps-Script: Dispatcher-Aliases entfernen — `case 'ladeFragenbank':` + `case 'ladeFragenbankSummary':` raus
- Apps-Script: Sheet-Spalten-Lookup-Backward-Compat entfernen — nur noch `'fragensammlungsheetid'` lesen (Sheet ist jetzt umbenannt)
- Apps-Script: alten JSON-Field-Namen `fragebankSheetId` aus Response entfernen — nur noch `fragensammlungSheetId` ausliefern
- HANDOFF.md: Bundle M-Section eingefügt (analog Bundle 3-Stil), Roadmap-Status aktualisiert
- Memory-Eintrag `project_bundle_m_fragensammlung_rename.md` mit Commit-Hashes + Lehren
- `./scripts/audit-tokens.sh` re-run, Output-Diff in HANDOFF dokumentieren (Skript wird aus `audit/examlab-vereinfachung`-Branch in `feature/bundle-m`-Branch übernommen via cherry-pick — siehe Task 0 im Plan)

**User-Aktion:** **Deploy 2** (Backward-Compat raus, finaler Stand).

## 4. Risiken + Mitigation

| # | Risiko | Mitigation |
|---|--------|------------|
| 1 | Wire-Mismatch Frontend ↔ Apps-Script während Deploy-Lag | Backward-Compat in Commit 1 (Sheet-Spalte + Endpoints parallel akzeptiert). Removal erst Commit 6 nach E2E + User-Sheet-Rename. |
| 2 | IDB-DB-Cleanup-Hook tötet Cache | DB enthält nur Cache (Frage-Summaries) — regeneriert sich beim nächsten Server-Pull. **Keine Daten-Verluste**, max. 2-3s Cold-Start beim ersten Login nach Deploy. |
| 3 | User-Tabs mit altem JS-Bundle senden alte Action-Strings | Backward-Compat in Apps-Script deckt das ab bis Commit 6. PWA-Service-Worker-Cache-Bust + Hard-Reload-Empfehlung im HANDOFF. |
| 4 | `git mv` verliert Tracking-Historie | Git erkennt Renames automatisch wenn Diff <50% Similarity. Bei Bundle M sind Identifier-Renames in den meisten Files <<50% Diff → `git mv old new` + Inhalt-Edit im selben Commit ist akzeptabel. Falls einzelne File-Edits zu gross sind (z.B. komplette Index-Datei), Plan splittet sie als 2-Schritt (mv + edit). |
| 5 | 30+ Import-Pfade übersehen | TypeScript fängt Missing-Imports im `tsc -b`. Auch ESLint-`import/no-unresolved` falls aktiv. |
| 6 | Sheet-Spalten-Rename vergessen → Commit 6 bricht App | User-Task im HANDOFF: vor Commit 6 Bestätigung „Sheet-Spalte umbenannt? — JA". |
| 7 | Doku-Files (HANDOFF, audit-Doku) referenzieren `fragenbank` | Bewusst belassen (historische Doku). Erfolgs-Kriterium 1 schliesst Doku-Files explizit aus. |

## 5. Test-Plan

### Pro Commit (alle 6)

```bash
cd ExamLab && npx tsc -b && npx vitest run && cd .. && cd ExamLab && npm run build && npm run lint:as-any
```

Erwartung: alle exit 0, 1234+ vitest passes (kein Test-Verlust), 0/0/0 lint:as-any.

### Browser-E2E vor Merge (Phase 4 in `regression-prevention.md`)

**Setup:** Tab-Gruppe mit LP-Login (`wr.test@gymhofwil.ch`) auf `origin/preview` (Force-Push von `feature/bundle-m-fragensammlung-rename` nach `origin/preview` per Memory-Regel `feedback_preview_forcepush.md`).

**Pre-E2E User-Tasks (Reihenfolge wichtig — verbindlich VOR E2E-Start, NICHT zwischendurch):**
1. ✅ Apps-Script-Deploy 1 (nach Commit 1 + 2 gemeinsam) — Backward-Compat aktiv
2. ✅ Sheet-Spalte `fragenbanksheetid` → `fragensammlungsheetid` im Gruppen-Tab umbenennen — Backward-Compat fängt es trotzdem ab, aber E2E soll mit final-state laufen
3. ✅ Hard-Reload in Test-Tabs (Cmd+Shift+R) — neuer Frontend-Build wird geladen
4. ⚠️ **Constraint:** Pre-Bedingungen 1+2 müssen vor Commit 6 erfüllt sein, sonst bricht App nach Deploy 2 (Backward-Compat-Removal)

**E2E-Pfade (LP):**

| # | Pfad | Erwartung |
|---|---|---|
| 1 | Fragensammlung-Tab öffnen | Liste lädt (≥2400 Fragen), IDB-DevTools: alte DB `examlab-fragenbank-cache` weg, neue `examlab-fragensammlung-cache` voll |
| 2 | Frage-Editor öffnen → Auto-Save | Bundle-3-Verhalten unverändert, Auto-Save grün |
| 3 | Drafts-Section (Bundle 3) | Lädt + zeigt Draft-Liste |
| 4 | Papierkorb (Bundle 3) | Lädt + zeigt gelöschte Fragen |
| 5 | Pool-Sync-Dialog | Öffnet + lädt Pool-Index (`PoolSyncDialog.tsx` aus renamem Ordner) |
| 6 | Excel-Import-Dialog | Öffnet (`ExcelImport.tsx` aus renamem Ordner) |
| 7 | Logout | Beide DBs weg (Logout-Cleanup-Pattern), authStore.zuruecksetzen-Cleanup |
| 8 | Re-Login | One-Time-Delete-Hook läuft (Console-Log `[Bundle M] alte fragenbank-DB gedroppt` ODER DevTools→Application→IndexedDB: alte DB nicht mehr da), neue DB füllt sich |

**Security-Check (Phase 4 regression-prevention.md):**
- LP-Response enthält weiterhin Lösungsfelder
- SuS-Response unverändert (Bundle M ändert nichts an SuS-Pfaden)
- Session-Token weiter mit-gesendet
- Owner-Check beim Frage-Schreiben funktioniert (Bundle 3-IDOR)

### Apps-Script-Deploy-Plan

| Phase | State | User-Action |
|-------|---|---|
| Vor Bundle M | Stand `0042b5f` (Bundle 3) | — |
| Nach Commit 1+2 (gemeinsam) | + Backward-Compat + interner Rename + Cache-Key + JS-Field-Typo-Fix in JSON-Response | **Deploy 1** (ein Deploy nach beiden Commits, weil Commit 2 die Cache-Keys ändert und ohne Deploy nicht aktiv wären) |
| Vor Commit 6 | (User benennt Sheet-Spalte um) | **Sheet-Spalten-Rename** |
| Nach Commit 6 | Backward-Compat entfernt | **Deploy 2** |

**Total:** 2 Apps-Script-Deploys (Bundle 3 hatte 4 — Bundle M ist deutlich einfacher).

## 6. Erfolgs-Kriterien

Bundle M ist erfolgreich, wenn:

1. `./scripts/audit-tokens.sh` zeigt `fragenbank/Fragenbank/FRAGENBANK` = **0** Treffer in `ExamLab/src/`, `packages/shared/src/`, `ExamLab/apps-script-code.js`. Bewusste Ausnahmen: Doku-Files (HANDOFF.md Historie, audit-Doku, Memory-Einträge, vergangene Spec/Plan-Files), Spreadsheet-ID-Wert, Drive-Filename.

   **Task 0** (vor Commit 1 im Plan): `scripts/audit-tokens.sh` aus Branch `audit/examlab-vereinfachung` (Commit `84151d2`) cherry-picken in `feature/bundle-m-fragensammlung-rename`. Skript existiert auf main (noch) nicht.
2. `npx tsc -b` exit 0
3. `npx vitest run` 1234+/1234+ passes (kein Test-Verlust durch Rename)
4. `npm run build` exit 0, PWA-precache valid
5. `npm run lint:as-any` 0/0/0
6. Browser-E2E: alle 8 LP-Pfade ✅ + Security-Check ✅
7. Sheet-Spalte umbenannt + Apps-Script ohne Backward-Compat deployed
8. HANDOFF.md mit Commit-Hashes + Memory-Eintrag aktualisiert
9. Branch lokal + remote gelöscht nach Merge

## 7. Folge-Phase

Nach Spec-Approval (Reviewer-Loop + User-Review):

1. **`writing-plans`-Skill** → konkreter Implementation-Plan mit Task-Liste pro Commit (Bundle-3-Style: rev1/rev2 Reviewer-Loop)
2. Plan-Reviewer-Loop
3. User-Review des Plans
4. Implementation in eigener Session via `executing-plans` (oder direkt sequenziell wenn überschaubar)
5. Browser-E2E + Merge nach LP-Freigabe (regression-prevention.md Phase 5)

## 8. Out of Scope

- Sheet-Spalten **innerhalb** der Fragensammlung-Spreadsheets (Bundle P)
- `pool`-Tokens (eigenes Bundle)
- `action`/`aktion`-Mix in Apps-Script (Bundle N)
- `musterlosung` Field-Drift (Bundle P)
- Datei-Splits aus A3-Hotspots (Bundles S/T)
- Spreadsheet-Filename in Drive (Kosmetik)
- Frontend-User-sichtbare Texte (sind bereits „Fragensammlung")
- Daten-Migration in IDB-Cache-Inhalten (Cache regeneriert sich)
- `packages/shared/src/` (0 Treffer, nichts zu ändern)
