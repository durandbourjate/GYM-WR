# Bundle M — Fragenbank → Fragensammlung Rename — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Legacy-Begriff `fragenbank` (komplett: 152 Frontend + ~105 Apps-Script + 16 Test-Files + 1 Sheet-Spalte + 1 IDB-DB-Name + JS-Field-Typo) auf `fragensammlung` umbenennen, in 6 atomaren Sub-Commits mit koordiniertem Apps-Script-Deploy.

**Architecture:** Mechanischer Rename mit Backward-Compat-Strategie: Apps-Script akzeptiert in Commit 1+2 ALTE und NEUE Endpoint-Namen, Sheet-Spalten-Header und JSON-Field-Names parallel. Frontend wechselt in Commits 3-5 auf neue Namen. Commit 6 entfernt Backward-Compat nach E2E + User-Sheet-Rename. IDB-Cache-DB wird umbenannt + alte DB beim ersten LP-Login einmalig gedroppt.

**Tech Stack:** TypeScript, React 19, Vite, Zustand, Vitest, idb-keyval (IDB), Apps-Script (V8 runtime, Google Sheets API).

**Spec:** [`docs/superpowers/specs/2026-05-05-bundle-m-fragensammlung-rename-design.md`](../specs/2026-05-05-bundle-m-fragensammlung-rename-design.md)

**Branch:** `feature/bundle-m-fragensammlung-rename` (von main, bereits angelegt mit Commits `e7e2f95`, `d4c60b0` für Spec)

---

## Task 0: Audit-Skript aus Audit-Branch cherry-picken

**Files:**
- Create: `scripts/audit-tokens.sh` (cherry-pick von `audit/examlab-vereinfachung` Commit `84151d2`)

- [ ] **Step 1: Verifizieren dass das Skript noch auf audit-Branch existiert**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git show audit/examlab-vereinfachung:scripts/audit-tokens.sh | head -5
```

Erwartet: `#!/usr/bin/env bash` als erste Zeile.

- [ ] **Step 2: Cherry-pick den Skript-Commit**

```bash
git cherry-pick 84151d2
```

Erwartet: `[feature/bundle-m-fragensammlung-rename ...] ExamLab Audit-Tooling: scripts/audit-tokens.sh`. 1 Datei geändert.

- [ ] **Step 3: Skript ausführen und Baseline-Output speichern**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-pre-bundle-m.md
head -5 /tmp/audit-tokens-pre-bundle-m.md
```

Erwartet: Tabelle beginnt mit `| fragenbank | 10 | 11 | 0 | 0 | 76 | 97 |`. Zahlen können leicht abweichen (Bundle 3 hat sich evtl. leicht verändert) — das ist OK.

- [ ] **Step 4: Pre-Tests laufen lassen — sicherstellen dass main grün ist**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic && npm run build && npm run lint:as-any && cd ..
```

Erwartet: `tsc` exit 0, `vitest` 1234+/1234+ passes, `build` exit 0, `lint:as-any` `Total: N, Defensive (OK): N, Undokumentiert (FAIL): 0`.

---

## Task 1: Apps-Script Backward-Compat (deploy-ready)

**Files:**
- Modify: `ExamLab/apps-script-code.js:380-400` (`alleGruppenLaden_()` Sheet-Spalten-Lookup + Dual-JSON-Field)
- Modify: `ExamLab/apps-script-code.js:1062` (Dispatcher: `case 'ladeFragenbank':` + neuer Alias `case 'ladeFragensammlung':`)
- Modify: `ExamLab/apps-script-code.js:1064` (Dispatcher: `case 'ladeFragenbankSummary':` + neuer Alias)

**Ziel:** Apps-Script akzeptiert ALTE und NEUE Bezeichner parallel. Kein Frontend-Code-Change. Nach Deploy ist die App bereit für Frontend-Migration in Tasks 3-5.

- [ ] **Step 1: alleGruppenLaden_() patchen — Sheet-Spalten-Lookup parallel + Dual-JSON-Response**

Lokalisiere die Funktion (Z. ~380-400):

```js
function alleGruppenLaden_() {
  var sheet = getGruppenRegistry_();
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      id: String(data[i][headers.indexOf('id')] || ''),
      name: String(data[i][headers.indexOf('name')] || ''),
      typ: String(data[i][headers.indexOf('typ')] || ''),
      adminEmail: String(data[i][headers.indexOf('adminemail')] || ''),
      fragebankSheetId: String(data[i][headers.indexOf('fragenbanksheetid')] || ''),
      analytikSheetId: String(data[i][headers.indexOf('analytiksheetid')] || ''),
    });
  }
  return result;
}
```

Ersetze den `for`-Block durch:

```js
  for (var i = 1; i < data.length; i++) {
    // Bundle M: Sheet-Spalten-Header lookups parallel (alt + neu)
    var idxNeu = headers.indexOf('fragensammlungsheetid');
    var idxAlt = headers.indexOf('fragenbanksheetid');
    var sheetIdIdx = idxNeu !== -1 ? idxNeu : idxAlt;
    var sheetIdValue = String(sheetIdIdx !== -1 ? data[i][sheetIdIdx] || '' : '');
    result.push({
      id: String(data[i][headers.indexOf('id')] || ''),
      name: String(data[i][headers.indexOf('name')] || ''),
      typ: String(data[i][headers.indexOf('typ')] || ''),
      adminEmail: String(data[i][headers.indexOf('adminemail')] || ''),
      fragebankSheetId: sheetIdValue,         // backward-compat (Typo, von alter Frontend-Bundle gelesen)
      fragensammlungSheetId: sheetIdValue,    // neu (ab Frontend-Bundle Task 3)
      analytikSheetId: String(data[i][headers.indexOf('analytiksheetid')] || ''),
    });
  }
```

- [ ] **Step 2: Dispatcher patchen — beide Endpoint-Cases parallel**

Lokalisiere Z. ~1062:

```js
    case 'ladeFragenbank':
      return jsonResponse(ladeFragenbank(body.email));
    case 'ladeFragenbankSummary':
      return jsonResponse(ladeFragenbankSummary(body.email));
```

Ersetze durch:

```js
    case 'ladeFragenbank':           // backward-compat alias (entfernt in Task 6)
    case 'ladeFragensammlung':
      return jsonResponse(ladeFragenbank(body.email));
    case 'ladeFragenbankSummary':    // backward-compat alias (entfernt in Task 6)
    case 'ladeFragensammlungSummary':
      return jsonResponse(ladeFragenbankSummary(body.email));
```

(Funktions-Namen `ladeFragenbank`/`ladeFragenbankSummary` werden erst in Task 2 umbenannt — hier noch alte Namen aufrufen.)

- [ ] **Step 3: tsc + vitest grün halten (kein Frontend-Code-Change)**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic && cd ..
```

Erwartet: tsc exit 0, vitest 1234+/1234+ passes (keine Änderung).

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
Bundle M Task 1: Apps-Script Backward-Compat (deploy-ready)

- alleGruppenLaden_() liest Sheet-Spalten-Header 'fragensammlungsheetid'
  ODER 'fragenbanksheetid' (case-insensitive, Lookup-Fallback)
- JSON-Response liefert beide Field-Namen mit identischem Wert:
  fragebankSheetId (Typo, alte Frontend-Bundle) + fragensammlungSheetId (neu)
- Dispatcher akzeptiert beide Endpoint-Aliases:
  case 'ladeFragenbank' + case 'ladeFragensammlung'
  case 'ladeFragenbankSummary' + case 'ladeFragensammlungSummary'

Backward-Compat aktiv bis Task 6. Kein Frontend-Code-Change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Erwartet: 1 file changed, ~10 insertions, ~3 deletions.

---

## Task 2: Apps-Script intern alles umbenennen

**Files:**
- Modify: `ExamLab/apps-script-code.js` — alle internen `fragenbank`-Bezeichner

**Ziel:** Apps-Script-internes Naming sauber auf `fragensammlung` umstellen. Backward-Compat (Endpoint-Aliases + Dual-JSON-Field) aus Task 1 bleibt aktiv.

- [ ] **Step 1: FRAGENBANK_ID-Konstante umbenennen**

Lokalisiere Z. 106:

```js
const FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
```

Ersetze durch:

```js
const FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
```

- [ ] **Step 2: Alle Aufrufer von FRAGENBANK_ID anpassen**

```bash
grep -n "FRAGENBANK_ID" ExamLab/apps-script-code.js
```

Erwartet: ~6 Zeilen mit Treffern. Pro Treffer: `FRAGENBANK_ID` → `FRAGENSAMMLUNG_ID`. Verifizieren mit:

```bash
grep -c "FRAGENBANK_ID" ExamLab/apps-script-code.js
```

Erwartet: 0 nach Edit.

- [ ] **Step 3: var fragenbank-Variablen umbenennen (3 Stellen)**

```bash
grep -n "var fragenbank " ExamLab/apps-script-code.js
```

Erwartet: 3 Zeilen (~Z. 280, 761, 2806). Pro Stelle:
- `var fragenbank = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);` → `var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);`
- Innerhalb derselben Funktion: alle Verwendungen von `fragenbank` → `fragensammlung`

Verify:

```bash
grep -n "var fragenbank " ExamLab/apps-script-code.js
```

Erwartet: 0 Treffer.

- [ ] **Step 4: Funktion getFragenbankTabs_() umbenennen**

```bash
grep -n "getFragenbankTabs_\|getFragensammlungTabs_" ExamLab/apps-script-code.js
```

Definition + alle Aufrufer umbenennen.

```bash
grep -n "getFragenbankTabs_" ExamLab/apps-script-code.js
```

Erwartet: 0 Treffer.

- [ ] **Step 5: Funktion ladeFragenbank() umbenennen**

```bash
grep -n "ladeFragenbank\b" ExamLab/apps-script-code.js
```

Treffer-Liste:
- Definition (Z. 4842): `function ladeFragenbank(email)` → `function ladeFragensammlung(email)`
- Dispatcher (Z. ~1063 nach Task 1): `return jsonResponse(ladeFragenbank(body.email));` → `return jsonResponse(ladeFragensammlung(body.email));`
- (Sonstige Aufrufer falls existierend)

```bash
grep -n "ladeFragenbank\b" ExamLab/apps-script-code.js
```

Erwartet: 0 Treffer (nur noch `ladeFragensammlung`).

- [ ] **Step 6: Funktion ladeFragenbankSummary() umbenennen**

Analog Step 5:

```bash
grep -n "ladeFragenbankSummary" ExamLab/apps-script-code.js
```

Definition + Dispatcher-Aufrufer umbenennen. Verify:

```bash
grep -n "ladeFragenbankSummary" ExamLab/apps-script-code.js
```

Erwartet: 0 Treffer.

- [ ] **Step 7: Cache-Keys umbenennen**

```bash
grep -n "'fragenbank_summary'" ExamLab/apps-script-code.js
```

Erwartet: 2 Treffer (Z. ~4904, 4928). Beide: `'fragenbank_summary'` → `'fragensammlung_summary'`. Verify:

```bash
grep -n "'fragenbank_summary'" ExamLab/apps-script-code.js
```

Erwartet: 0 Treffer.

- [ ] **Step 8: JS-Field-Variable fragebankSheetId → fragensammlungSheetId (interner Code)**

JSON-Response-Felder bleiben in `alleGruppenLaden_()` weiterhin **beide** Namen ausliefern (Backward-Compat aus Task 1). Aber: alle anderen Apps-Script-internen Aufrufer von `gruppe.fragebankSheetId` umbenennen.

```bash
grep -n "fragebankSheetId\|fragensammlungSheetId" ExamLab/apps-script-code.js
```

Erwartet: ~14 Stellen mit `fragebankSheetId` + 1 Stelle mit `fragensammlungSheetId` (in `alleGruppenLaden_()`).

Pro Stelle: `gruppe.fragebankSheetId` (oder `g.fragebankSheetId` etc.) → `gruppe.fragensammlungSheetId`.

**Ausnahme:** in `alleGruppenLaden_()` MUSS `fragebankSheetId: sheetIdValue` als Field bestehen bleiben (für alte Frontend-Bundle), nur `fragensammlungSheetId: sheetIdValue` ist der neue Field — beide Felder bleiben erhalten.

Verify:

```bash
grep -n "\.fragebankSheetId\|\bfragebankSheetId\b" ExamLab/apps-script-code.js
```

Erwartet: 1 Treffer (nur `fragebankSheetId: sheetIdValue` in `alleGruppenLaden_()`).

- [ ] **Step 9: Sheet-Lookup-String präferenz-Order anpassen**

In `alleGruppenLaden_()` ist die Lookup-Reihenfolge: `'fragensammlungsheetid'` (neu) bevorzugt, `'fragenbanksheetid'` (alt) Fallback. Bereits in Task 1 so gesetzt — nichts zu ändern in Task 2.

Verify Lookup-String:

```bash
grep -nE "'fragenbanksheetid'|'fragensammlungsheetid'" ExamLab/apps-script-code.js
```

Erwartet: 2 Treffer im `alleGruppenLaden_()`-Block.

- [ ] **Step 10: Audit-Token-Diff prüfen**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-task-2.md
grep -E "^\| (fragenbank|Fragenbank|FRAGENBANK)" /tmp/audit-tokens-task-2.md
```

Erwartet: alle drei Zeilen sollten **`apps-script` Spalte 0** zeigen (oder fast 0 — verbleibende Treffer sind dispatcher-Aliases aus Task 1, die in Task 6 entfernt werden).

```bash
grep -nE "\bfragenbank\b|\bFragenbank\b|\bFRAGENBANK\b" ExamLab/apps-script-code.js | head -20
```

Erwartet: nur noch Dispatcher-Cases (`case 'ladeFragenbank':`, `case 'ladeFragenbankSummary':`) + Lookup-String `'fragenbanksheetid'` + Field-Name `fragebankSheetId` in JSON-Response.

- [ ] **Step 11: Frontend tsc + vitest grün halten (Frontend nicht angefasst)**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic && cd ..
```

Erwartet: alles grün, keine Änderungen.

- [ ] **Step 12: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "$(cat <<'EOF'
Bundle M Task 2: Apps-Script intern alles umbenennen

- FRAGENBANK_ID → FRAGENSAMMLUNG_ID (Konstante + alle ~6 Aufrufer)
- var fragenbank → var fragensammlung (3 Stellen)
- function getFragenbankTabs_() → getFragensammlungTabs_()
- function ladeFragenbank() → ladeFragensammlung()
- function ladeFragenbankSummary() → ladeFragensammlungSummary()
- Cache-Keys 'fragenbank_summary' → 'fragensammlung_summary' (2 Stellen)
- JS-Field-Variable fragebankSheetId → fragensammlungSheetId (~13 Stellen,
  ausser im JSON-Response in alleGruppenLaden_() — beide bleiben für
  Backward-Compat bis Task 6)

Endpoint-Aliases (Task 1) bleiben aktiv. Dispatcher akzeptiert weiterhin
'ladeFragenbank' + 'ladeFragensammlung'. Sheet-Spalten-Backward-Compat
bleibt aktiv. Frontend unverändert.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Erwartet: 1 file changed, ~30+ insertions/deletions.

- [ ] **Step 13: User-Action — Apps-Script Deploy 1**

**Wichtig: Hier User informieren**, dass jetzt der erste Apps-Script-Deploy fällig ist:

```
"Apps-Script ist jetzt bereit für Deploy 1. Bitte:
1. Apps-Script-Editor öffnen
2. Bereitstellen → Bereitstellungen verwalten
3. Neue Bereitstellung erstellen
4. Bestätigen wenn fertig.

Nach Deploy 1 läuft die App weiterhin mit alter Frontend-Bundle, ist aber
bereit für die Frontend-Migration in Task 3."
```

Plan-Ausführung pausiert, bis User Deploy 1 bestätigt.

- [ ] **Step 14: User-Action — Sheet-Spalte umbenennen (parallel zu Deploy 1)**

User-Anweisung:

```
"Bitte parallel zu Deploy 1 die Sheet-Spalte umbenennen:

Spreadsheet: https://docs.google.com/spreadsheets/d/1VH7Vu7JIKYLic2-wK2uSa2nXA7WVvStKOjUDi9cpWnI/edit
Tab: Gruppen
Spalten-Header: 'fragenbanksheetid' (oder 'FragenbankSheetId' o.ä., case-insensitive)
Umbenennen zu: 'fragensammlungsheetid' (oder 'FragensammlungSheetId')

Backward-Compat fängt ab — du kannst auch vor Deploy 1 umbenennen, beides ist OK.
Bestätige wenn fertig."
```

Plan-Ausführung pausiert.

---

## Task 3: Frontend Service-Layer + Type-Field-Rename + IDB-Cleanup-Hook

**Files:**
- Rename + modify: `ExamLab/src/services/fragenbankApi.ts` → `fragensammlungApi.ts`
- Rename + modify: `ExamLab/src/services/fragenbankCache.ts` → `fragensammlungCache.ts`
- Rename + modify: `ExamLab/src/store/fragenbankStore.ts` → `fragensammlungStore.ts`
- Modify: `ExamLab/src/types/ueben/gruppen.ts:6` (Type-Field)
- Modify: `ExamLab/src/AppUeben.tsx:74` (Demo-Mock)
- Modify: `ExamLab/src/adapters/ueben/appsScriptAdapter.ts:35` (Adapter-Type)
- Modify: `ExamLab/src/store/authStore.ts` (Cleanup-Hook)
- Plus: alle Caller-Files mit Imports auf Service/Store-Files (~30+ Stellen, tsc-getrieben)

**Ziel:** Frontend nutzt jetzt neue Apps-Script-Aktion-Strings + neue JSON-Field-Namen + neue IDB-DB. Old-DB Cleanup-Hook beim ersten LP-Login.

- [ ] **Step 1: Service-Files mit `git mv` umbenennen (3 Files)**

```bash
git mv ExamLab/src/services/fragenbankApi.ts ExamLab/src/services/fragensammlungApi.ts
git mv ExamLab/src/services/fragenbankCache.ts ExamLab/src/services/fragensammlungCache.ts
git mv ExamLab/src/store/fragenbankStore.ts ExamLab/src/store/fragensammlungStore.ts
```

Erwartet: 3 Renames (Git erkennt sie automatisch).

- [ ] **Step 2: Test-Files (`*.test.ts` neben den Services) mit umbenennen falls vorhanden**

```bash
ls ExamLab/src/services/fragenbank*.test.ts ExamLab/src/store/fragenbank*.test.ts 2>/dev/null
```

Falls vorhanden: ebenfalls `git mv` nach gleichem Schema.

- [ ] **Step 3: Inhalt von fragensammlungApi.ts anpassen**

Im Code: alle `fragenbank`/`Fragenbank`-Identifier-Vorkommen umbenennen. Action-Strings `'ladeFragenbank'` → `'ladeFragensammlung'`, `'ladeFragenbankSummary'` → `'ladeFragensammlungSummary'`. Funktions-/Klassen-Namen anpassen.

Verify:

```bash
grep -nE "\bfragenbank\b|\bFragenbank\b" ExamLab/src/services/fragensammlungApi.ts
```

Erwartet: 0 Treffer.

- [ ] **Step 4: Inhalt von fragensammlungCache.ts anpassen — IDB-DB-Name + Cleanup**

```bash
grep -n "examlab-fragenbank-cache\|fragenbank" ExamLab/src/services/fragensammlungCache.ts
```

Ersetze:
- `const IDB_NAME = 'examlab-fragenbank-cache'` → `const IDB_NAME = 'examlab-fragensammlung-cache'`
- Alle Identifier `fragenbank*` → `fragensammlung*`

Verify:

```bash
grep -nE "\bfragenbank\b|\bFragenbank\b" ExamLab/src/services/fragensammlungCache.ts
```

Erwartet: 0 Treffer.

- [ ] **Step 5: Inhalt von fragensammlungStore.ts anpassen**

Analog Step 3+4 für Store. Identifier umbenennen.

```bash
grep -nE "\bfragenbank\b|\bFragenbank\b" ExamLab/src/store/fragensammlungStore.ts
```

Erwartet: 0 Treffer.

- [ ] **Step 6: Frontend-Type-Field-Rename — gruppen.ts (Type-Definition)**

```bash
grep -n "fragebankSheetId" ExamLab/src/types/ueben/gruppen.ts
```

Erwartet: 1 Treffer (Z. 6).

Edit: `fragebankSheetId: string` → `fragensammlungSheetId: string`.

- [ ] **Step 7: Frontend-Type-Field-Rename — AppUeben.tsx (Demo-Mock)**

```bash
grep -n "fragebankSheetId" ExamLab/src/AppUeben.tsx
```

Erwartet: 1 Treffer (Z. 74). Edit: `fragebankSheetId: 'demo'` → `fragensammlungSheetId: 'demo'`.

- [ ] **Step 8: Frontend-Type-Field-Rename — appsScriptAdapter.ts (Omit-Type)**

```bash
grep -n "fragebankSheetId" ExamLab/src/adapters/ueben/appsScriptAdapter.ts
```

Erwartet: 1 Treffer (Z. 35). Edit: `Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>` → `Omit<Gruppe, 'fragensammlungSheetId' | 'analytikSheetId'>`.

- [ ] **Step 9: Schritt 6+7+8 auf Tests anwenden (gruppenStoreCache.test.ts, gruppenCache.test.ts)**

```bash
grep -n "fragebankSheetId" ExamLab/src/tests/gruppenStoreCache.test.ts ExamLab/src/tests/gruppenCache.test.ts
```

Erwartet: je 1 Treffer. Beide umbenennen auf `fragensammlungSheetId`.

- [ ] **Step 10: IDB-Cleanup-Hook in authStore.anmelden() einbauen**

Lokalisiere `anmelden()` in `ExamLab/src/store/authStore.ts`. Innerhalb des LP-Login-Pfads (nach erfolgreichem Login, parallel zu existierenden Pre-Fetch-Calls):

```ts
// Bundle M: alte fragenbank-DB einmalig droppen (Cleanup)
const req = indexedDB.deleteDatabase('examlab-fragenbank-cache')
req.onsuccess = () => console.info('[Bundle M] alte fragenbank-DB gedroppt')
// onerror/onblocked silent — DB existiert evtl. nicht (post-Deploy-Re-Login)
```

Hinweis: `req.onerror` und `req.onblocked` brauchen keine Handler — `deleteDatabase` auf nicht-existierender DB ist silent no-op.

- [ ] **Step 11: Imports + Re-Exports in allen Caller-Files anpassen**

```bash
cd ExamLab && npx tsc -b 2>&1 | head -50
```

tsc wird Importpfade als Errors melden (Module not found). Pro Error:
- `from '../services/fragenbankApi'` → `from '../services/fragensammlungApi'`
- `from '../services/fragenbankCache'` → `from '../services/fragensammlungCache'`
- `from '../store/fragenbankStore'` → `from '../store/fragensammlungStore'`

Iterativ bis tsc clean ist.

```bash
cd ExamLab && npx tsc -b
```

Erwartet: exit 0, keine Errors.

- [ ] **Step 12: Vitest grün — laufen lassen**

```bash
cd ExamLab && npx vitest run --reporter=basic && cd ..
```

Erwartet: 1234+/1234+ passes. Falls einzelne Tests scheitern wegen Mock-String-Mismatch oder Type-Field — diese in Task 5 fixen oder hier inline notieren als TODO.

**Note:** vitest-Tests die Apps-Script-Action-Strings hardcoded haben (z.B. `'ladeFragenbank'` in Mock-Bedingungen) brechen jetzt → Task 5 fängt sie ab. Aber Tests die nur Service-Funktionen aufrufen sollten passen (sie nutzen die importierte Funktion, nicht den Action-String).

Falls Tests scheitern: dokumentieren in Task 5 + jetzt erstmal weiter zu Step 13.

- [ ] **Step 13: build + lint:as-any verifizieren**

```bash
cd ExamLab && npm run build && npm run lint:as-any && cd ..
```

Erwartet: build exit 0, lint 0 undokumentiert.

- [ ] **Step 14: Commit**

```bash
git add ExamLab/src/services/ ExamLab/src/store/ ExamLab/src/types/ueben/gruppen.ts ExamLab/src/AppUeben.tsx ExamLab/src/adapters/ueben/appsScriptAdapter.ts ExamLab/src/tests/gruppenStoreCache.test.ts ExamLab/src/tests/gruppenCache.test.ts
# Plus alle Caller-Files mit Import-Änderungen
git add ExamLab/src/  # falls weitere Files
git commit -m "$(cat <<'EOF'
Bundle M Task 3: Frontend Service-Layer + Type-Field-Rename + IDB-Cleanup

- Service/Store-Files renamed:
  fragenbankApi.ts → fragensammlungApi.ts
  fragenbankCache.ts → fragensammlungCache.ts
  fragenbankStore.ts → fragensammlungStore.ts
- Action-Strings: 'ladeFragenbank'/'…Summary' → 'ladeFragensammlung'/'…Summary'
- IDB-DB-Name: 'examlab-fragenbank-cache' → 'examlab-fragensammlung-cache'
- One-Time-Delete-Hook für alte fragenbank-DB in authStore.anmelden()
  (mit Console-Log für E2E-Verifikation)
- Frontend Type-Field-Rename (Typo-Fix gleichzeitig):
  fragebankSheetId → fragensammlungSheetId in:
  - types/ueben/gruppen.ts (Type-Definition)
  - AppUeben.tsx (Demo-Mock)
  - adapters/ueben/appsScriptAdapter.ts (Omit-Type)
  - tests/gruppenStoreCache.test.ts + gruppenCache.test.ts
- Caller-Imports aktualisiert (~30+ Stellen, tsc-getrieben)

Apps-Script-Backward-Compat (Task 1) deckt das JSON-Field-Rename ab —
Apps-Script liefert weiterhin beide Field-Namen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend Komponenten-Ordner-Rename

**Files:**
- Rename: `ExamLab/src/components/lp/fragenbank/` → `ExamLab/src/components/lp/fragensammlung/` (15 Files inkl. `fragenbrowser/`-Subordner)
- Plus: alle Caller-Imports (~30+ Stellen)

**Ziel:** Komponenten-Ordner-Rename + Imports + Identifier in den Komponenten-Files.

- [ ] **Step 1: Ordner mit `git mv` umbenennen**

```bash
git mv ExamLab/src/components/lp/fragenbank ExamLab/src/components/lp/fragensammlung
```

Git rename erkennt automatisch alle 15 Files (inkl. `fragenbrowser/`-Subordner-Files). Verify:

```bash
ls ExamLab/src/components/lp/fragensammlung/ | head -10
ls ExamLab/src/components/lp/fragensammlung/fragenbrowser/ | head -10
```

Erwartet: alle 7 + 7 Files vorhanden.

- [ ] **Step 2: tsc laufen lassen — Caller-Imports identifizieren**

```bash
cd ExamLab && npx tsc -b 2>&1 | head -80 && cd ..
```

Erwartet: viele Module-Not-Found-Errors für `'./components/lp/fragenbank/...'` Imports.

- [ ] **Step 3: Caller-Imports anpassen (Massen-Update)**

Suche alle Caller-Imports:

```bash
grep -rEn "from ['\"].*lp/fragenbank" ExamLab/src --include="*.ts" --include="*.tsx"
```

Pro Treffer: `lp/fragenbank/...` → `lp/fragensammlung/...`. Verify:

```bash
grep -rEn "lp/fragenbank" ExamLab/src --include="*.ts" --include="*.tsx" | wc -l
```

Erwartet: 0.

- [ ] **Step 4: Komponenten-File-Inhalte für `fragenbank`-Identifier durchsuchen**

```bash
grep -rEn "\bfragenbank\b|\bFragenbank\b" ExamLab/src/components/lp/fragensammlung --include="*.ts" --include="*.tsx"
```

Pro Treffer: Identifier umbenennen. Beispiele: lokale Variablen, Komponenten-Namen, Kommentare.

Verify:

```bash
grep -rEn "\bfragenbank\b|\bFragenbank\b" ExamLab/src/components/lp/fragensammlung --include="*.ts" --include="*.tsx"
```

Erwartet: 0 Treffer.

- [ ] **Step 5: tsc + vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic && cd ..
```

Erwartet: tsc exit 0, vitest 1234+/1234+ passes (oder verbleibende Test-Failures aus Task 5-Backlog).

- [ ] **Step 6: build + lint verifizieren**

```bash
cd ExamLab && npm run build && npm run lint:as-any && cd ..
```

Erwartet: alles grün.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/src/
git commit -m "$(cat <<'EOF'
Bundle M Task 4: Frontend Komponenten-Ordner-Rename

- ExamLab/src/components/lp/fragenbank/ → lp/fragensammlung/ (15 Files
  inkl. fragenbrowser/-Subordner)
- Alle Caller-Imports angepasst (~30+ Stellen, tsc-getrieben)
- Komponenten-File-Inhalte: fragenbank-Identifier auf fragensammlung
  umbenannt

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Tests + Mocks

**Files:**
- Modify: ~16 Test-Files in `ExamLab/src/__tests__/`, `ExamLab/src/tests/`, colocated `*.test.tsx`

**Ziel:** Test-Mocks für Apps-Script-Action-Strings + Identifier in Test-Files anpassen. Mocks für IDB-DB-Name aktualisieren.

- [ ] **Step 1: Test-Files mit fragenbank-Imports oder -Identifiern auflisten**

```bash
grep -rEnl "\bfragenbank\b|\bFragenbank\b|examlab-fragenbank-cache|'ladeFragenbank" ExamLab/src --include="*.test.ts" --include="*.test.tsx"
```

Erwartet: ~16 Files. Liste in TodoWrite ablegen.

- [ ] **Step 2: Pro Test-File: Identifier + Mock-Strings umbenennen**

Für jedes File:

```bash
grep -nE "\bfragenbank\b|\bFragenbank\b|examlab-fragenbank-cache|'ladeFragenbank" "<filepath>"
```

Stellen umbenennen:
- `'ladeFragenbank'` → `'ladeFragensammlung'`
- `'ladeFragenbankSummary'` → `'ladeFragensammlungSummary'`
- `'examlab-fragenbank-cache'` → `'examlab-fragensammlung-cache'`
- Identifier `fragenbank*` → `fragensammlung*`
- Test-Beschreibungen (`describe('Fragenbank...')`) → `describe('Fragensammlung...')`
- Import-Pfade falls noch nicht durch tsc-Pass aktualisiert

- [ ] **Step 3: Vitest grün laufen lassen**

```bash
cd ExamLab && npx vitest run --reporter=basic && cd ..
```

Erwartet: 1234+/1234+ passes.

Falls einzelne Tests noch scheitern: pro Test debuggen + fixen.

- [ ] **Step 4: tsc + build + lint final verifizieren**

```bash
cd ExamLab && npx tsc -b && npm run build && npm run lint:as-any && cd ..
```

Erwartet: alles exit 0, lint 0 undokumentiert.

- [ ] **Step 5: Audit-Token-Diff prüfen**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-task-5.md
grep -E "^\| (fragenbank|Fragenbank|FRAGENBANK)" /tmp/audit-tokens-task-5.md
```

Erwartet: alle drei Zeilen Frontend-Spalten = 0 (`src (prod)`, `src (test)`, `shared (prod)`, `shared (test)` alle 0). Apps-Script-Spalte zeigt **noch verbleibende Treffer** wegen Backward-Compat-Aliases (Endpoint-Cases + JSON-Field) — werden in Task 6 entfernt.

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/
git commit -m "$(cat <<'EOF'
Bundle M Task 5: Tests + Mocks angepasst

- ~16 Test-Files: Identifier + Mock-Action-Strings + IDB-DB-Name updated
- 'ladeFragenbank'/'…Summary' → 'ladeFragensammlung'/'…Summary' in Mocks
- 'examlab-fragenbank-cache' → 'examlab-fragensammlung-cache' in IDB-Mocks
- Test-Beschreibungen + describe-Blöcke updated

Vitest 1234+/1234+ passes. Frontend-fragenbank-Treffer in audit-tokens.sh
jetzt 0. Verbleibende Apps-Script-Treffer = Backward-Compat-Aliases,
werden in Task 6 entfernt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Browser-E2E (vor Task 6, regression-prevention.md Phase 3)

**Vor Task 6 verbindlich:**

- [ ] **E2E-Step 1: User-Aktionen verifiziert**

```
"Bitte bestätigen:
✅ Apps-Script Deploy 1 (nach Task 2) durchgeführt
✅ Sheet-Spalte 'fragenbanksheetid' → 'fragensammlungsheetid' im Gruppen-Tab umbenannt
✅ Hard-Reload (Cmd+Shift+R) in Test-Tabs durchgeführt"
```

Plan pausiert bis User bestätigt.

- [ ] **E2E-Step 2: Force-Push zu origin/preview für Browser-Testing**

```bash
# Memory-Regel feedback_preview_forcepush.md beachten
git log preview ^HEAD 2>/dev/null
```

Falls `preview` Work-In-Progress hat: User fragen wie weiter. Sonst:

```bash
git push origin feature/bundle-m-fragensammlung-rename:preview --force-with-lease
```

- [ ] **E2E-Step 3: Browser-Test-Plan (mit echten LP-Logins, Memory-Regel `feedback_echte_logins.md`)**

```
"Tab-Gruppe öffnen mit:
- LP: wr.test@gymhofwil.ch (echter Login!)
- SuS: wr.test@stud.gymhofwil.ch (für Cross-Path-Verifikation)

Pfade testen (gemäss Spec §5):
1. Fragensammlung-Tab → Liste lädt + IDB-DevTools-Inspect: alte 'examlab-fragenbank-cache' weg, neue 'examlab-fragensammlung-cache' voll
2. Frage-Editor öffnen → Auto-Save (Bundle 3) funktioniert → Schliessen
3. Drafts-Section lädt
4. Papierkorb lädt
5. Pool-Sync-Dialog öffnet
6. Excel-Import-Dialog öffnet
7. Logout → beide DBs weg
8. Re-Login → Console-Log '[Bundle M] alte fragenbank-DB gedroppt' (oder DB ist nicht mehr da)

Security-Check (Phase 4):
- LP-Response enthält Lösungsfelder
- SuS-Response unverändert (kein fragenbank-Touch im SuS-Pfad)
- Session-Token wird mit-gesendet
"
```

Pro Pfad: User berichtet ✅/❌. Bei ❌: debuggen + Hotfix vor Task 6.

---

## Task 6: Apps-Script Backward-Compat-Removal + HANDOFF + Memory + Audit-Diff

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Backward-Compat-Removal)
- Modify: `ExamLab/HANDOFF.md`
- Create: `~/.claude/projects/.../memory/project_bundle_m_fragensammlung_rename.md`

**Pre-Bedingung:** Browser-E2E komplett ✅, alle 8 Pfade verifiziert mit echten Logins.

- [ ] **Step 1: Apps-Script-Backward-Compat aus alleGruppenLaden_() entfernen**

In `ExamLab/apps-script-code.js`, `alleGruppenLaden_()`-Funktion:

```js
// Bundle M: Sheet-Spalten-Header lookups parallel (alt + neu)
var idxNeu = headers.indexOf('fragensammlungsheetid');
var idxAlt = headers.indexOf('fragenbanksheetid');
var sheetIdIdx = idxNeu !== -1 ? idxNeu : idxAlt;
var sheetIdValue = String(sheetIdIdx !== -1 ? data[i][sheetIdIdx] || '' : '');
result.push({
  ...,
  fragebankSheetId: sheetIdValue,         // backward-compat (Typo, von alter Frontend-Bundle gelesen)
  fragensammlungSheetId: sheetIdValue,    // neu (ab Frontend-Bundle Task 3)
  ...,
});
```

Ersetze durch:

```js
var sheetIdValue = String(data[i][headers.indexOf('fragensammlungsheetid')] || '');
result.push({
  ...,
  fragensammlungSheetId: sheetIdValue,    // (ehemals fragebankSheetId mit Typo, Bundle M)
  ...,
});
```

(Field `fragebankSheetId` entfernt — alte Frontend-Bundles können ihn nicht mehr lesen, was OK ist nach E2E-Verifikation.)

- [ ] **Step 2: Dispatcher-Aliases entfernen**

Lokalisiere die Doppel-Cases:

```js
case 'ladeFragenbank':           // backward-compat alias (entfernt in Task 6)
case 'ladeFragensammlung':
  return jsonResponse(ladeFragensammlung(body.email));
case 'ladeFragenbankSummary':    // backward-compat alias (entfernt in Task 6)
case 'ladeFragensammlungSummary':
  return jsonResponse(ladeFragensammlungSummary(body.email));
```

Ersetze durch:

```js
case 'ladeFragensammlung':
  return jsonResponse(ladeFragensammlung(body.email));
case 'ladeFragensammlungSummary':
  return jsonResponse(ladeFragensammlungSummary(body.email));
```

- [ ] **Step 3: Audit-Token-Diff laufen lassen**

```bash
./scripts/audit-tokens.sh > /tmp/audit-tokens-final.md
grep -E "^\| (fragenbank|Fragenbank|FRAGENBANK)" /tmp/audit-tokens-final.md
```

Erwartet: alle drei Zeilen, alle Spalten = **0** (oder bewusste Ausnahmen — Doku-Files, Spreadsheet-ID-Wert).

```bash
diff /tmp/audit-tokens-pre-bundle-m.md /tmp/audit-tokens-final.md | head -30
```

Diff zur Dokumentation in HANDOFF speichern.

- [ ] **Step 4: HANDOFF.md aktualisieren**

In `ExamLab/HANDOFF.md` einen neuen Bundle-M-Eintrag oben in der „Letzter Stand auf main"-Section einfügen (analog Bundle 3-Stil):

```markdown
### Bundle M — Fragenbank → Fragensammlung Rename ✅ MERGED (2026-XX-XX)

Merge-Commit `<hash>` auf `main`. Branch `feature/bundle-m-fragensammlung-rename`
lokal + remote gelöscht. 6 Sub-Commits + Merge. Apps-Script 2× deployed
(Deploy 1 nach Task 2, Deploy 2 nach Task 6). Sheet-Spalte umbenannt im
Gruppen-Tab. IDB-DB-Name umgestellt mit One-Time-Delete-Hook für alte DB.

**Sub-Commits:**
- Task 0 (`<hash>`): audit-tokens.sh cherry-pick
- Task 1 (`<hash>`): Apps-Script Backward-Compat
- Task 2 (`<hash>`): Apps-Script intern alles umbenannt
- Task 3 (`<hash>`): Frontend Service-Layer + Type-Field + IDB-Cleanup-Hook
- Task 4 (`<hash>`): Frontend Komponenten-Ordner-Rename
- Task 5 (`<hash>`): Tests + Mocks
- Task 6 (`<hash>`): Backward-Compat-Removal + HANDOFF + Memory

**Audit-Diff:** `fragenbank/Fragenbank/FRAGENBANK` Treffer-Reduktion:
- Vorher: 152 Frontend + 105 Apps-Script + 16 Tests = 273 Total
- Nachher: 0 Frontend + 0 Apps-Script + 0 Tests = **0 Total** (ausser
  bewusste Ausnahmen in Doku-Files: HANDOFF, audit-Doku, Memory)

**Browser-E2E:** alle 8 LP-Pfade ✅ mit echten Logins verifiziert.

**Lehren:**
- (sammeln während Implementation)
```

Roadmap-Section („Code-Vereinfachung — Roadmap aus Audit") aktualisieren: Bundle M ✅, nächstes Bundle = N.

- [ ] **Step 5: Memory-Eintrag erstellen**

```bash
cat > "/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_bundle_m_fragensammlung_rename.md" <<'EOF'
---
name: Bundle M Fragenbank → Fragensammlung Rename auf main
description: Mechanischer Rename des Legacy-Begriffs fragenbank, erstes Cleanup-Bundle aus Vereinfachungs-Audit. Apps-Script-Deploy + Sheet-Spalten-Rename koordiniert.
type: project
---

**MERGED auf main:** YYYY-MM-DD, Merge-Commit `<hash>`. Branch `feature/bundle-m-fragensammlung-rename` gelöscht.

**Why:** Erstes Bundle der Cleanup-Roadmap aus Vereinfachungs-Audit (05.05.2026). Mechanischer Rename, niedriges Risiko, macht Phase-2-Refactors lesbarer.

**How to apply:** Bei künftigen ähnlichen Renames als Referenz nutzen — Backward-Compat-Pattern (Dual-JSON-Field + Dispatcher-Aliases + Sheet-Spalten-Lookup-Fallback) hat sich bewährt.

**Lehren (sammeln während Implementation):**
- ...

**Verbleibende Treffer:** Doku-Files (HANDOFF, audit-Doku, Memory) bewusst belassen — historische Dokumentation.
EOF
```

In `MEMORY.md` Indeix-Eintrag ergänzen unter „ExamLab"-Section.

- [ ] **Step 6: tsc + vitest + build + lint final**

```bash
cd ExamLab && npx tsc -b && npx vitest run --reporter=basic && npm run build && npm run lint:as-any && cd ..
```

Erwartet: alles exit 0, vitest 1234+/1234+ passes.

- [ ] **Step 7: Commit**

```bash
git add ExamLab/apps-script-code.js ExamLab/HANDOFF.md
git commit -m "$(cat <<'EOF'
Bundle M Task 6: Backward-Compat-Removal + HANDOFF + Memory

- Apps-Script: Dispatcher-Aliases 'ladeFragenbank' + 'ladeFragenbankSummary' entfernt
- Apps-Script: Sheet-Spalten-Lookup-Backward-Compat ('fragenbanksheetid'-Fallback) entfernt
- Apps-Script: alten JSON-Field 'fragebankSheetId' aus Response entfernt — nur noch 'fragensammlungSheetId'
- HANDOFF.md: Bundle M-Section + Roadmap aktualisiert
- Memory-Eintrag erstellt

Audit-Token-Diff: fragenbank-Treffer 273 → 0 (ausser Doku-Files).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: User-Action — Apps-Script Deploy 2**

```
"Apps-Script Backward-Compat ist jetzt entfernt. Letzter Deploy fällig:
1. Apps-Script-Editor öffnen
2. Bereitstellen → Bereitstellungen verwalten
3. Neue Bereitstellung erstellen
4. Bestätigen wenn fertig.

Nach Deploy 2 sind alte Frontend-Bundles (z.B. in offenen Tabs vor Hard-Reload) NICHT MEHR LAUFFÄHIG — sie senden 'ladeFragenbank' und bekommen einen 'Unbekannte Aktion'-Error. Bitte Hard-Reload empfehlen."
```

Plan pausiert.

- [ ] **Step 9: Final-Smoke-Test im Browser**

User bestätigt: kurzer Smoke-Test der Hauptpfade (Fragensammlung lädt, Frage-Editor speichert) nach Deploy 2 — verifiziert dass Backward-Compat-Removal nichts gebrochen hat.

---

## Merge-Phase

**Pre-Merge-Checkliste (regression-prevention.md Phase 5):**

- [ ] Browser-E2E erfolgreich (alle 8 LP-Pfade ✅)
- [ ] Security-Check Phase 4 erfolgreich
- [ ] User „Merge OK" oder „Freigabe" bestätigt
- [ ] HANDOFF.md aktualisiert (Task 6 Step 4)

- [ ] **Step 1: Merge nach main**

```bash
git checkout main
git merge --no-ff feature/bundle-m-fragensammlung-rename -m "Merge Bundle M (Fragenbank → Fragensammlung Rename)"
git push
```

- [ ] **Step 2: Branch aufräumen**

```bash
git branch -d feature/bundle-m-fragensammlung-rename
git push origin --delete feature/bundle-m-fragensammlung-rename
```

- [ ] **Step 3: Memory-Eintrag finalisieren**

Memory-File mit echtem Merge-Commit-Hash + Datum + gelernten Lehren updaten.

- [ ] **Step 4: HANDOFF Bundle-M-Section finalisieren**

`<hash>`-Platzhalter mit echten Commit-Hashes ersetzen, Datum eintragen.

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: Bundle M als ✅ MERGED markiert (post-merge)"
git push
```

---

## Out-of-Scope-Reminder

- `pool`-Tokens — nicht in Bundle M (gemischt; eigenes späteres Bundle)
- `action`/`aktion`-Mix in Apps-Script — Bundle N
- `musterlosung` Field-Drift — Bundle P
- Datei-Splits — Bundles S/T
- Frontend-User-sichtbare Texte — bereits „Fragensammlung", keine Änderung
- Sprach-Konvention dokumentieren — Bundle V (Annex zu N)

---

## Skills Used

- @superpowers:test-driven-development (für IDB-Cleanup-Hook und ggf. neue Tests)
- @superpowers:systematic-debugging (falls Tests in Task 5 brechen)
- @superpowers:verification-before-completion (Erfolgs-Kriterien Spec §6)
- @superpowers:requesting-code-review (vor Merge falls grösserer Diff)
