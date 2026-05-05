# Bundle 3 — Auto-Save + Drafts + Papierkorb Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Datenverlust-sicheres Auto-Save für LP-Frageneditor mit klarem Draft↔Sammlung-Lifecycle, prominenter Drafts-Sichtbarkeit und Papierkorb-Soft-Delete.

**Architecture:** Hybrid Persistence (IDB-Cache 1s-debounced + Server-Sync 10s-debounced) mit Server als Source-of-Truth. API-Adapter abstrahiert Apps-Script für spätere Backend-Migration. Lazy-Draft-Creation (kein Draft beim leeren Editor-Mount). State-Machine `draft|sammlung`-Status, orthogonal zu `pruefungstauglich`. Soft-Delete-Papierkorb mit 90-Tage-Auto-Hard-Delete.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand + Tailwind v4 + Vitest + IndexedDB (`idb-keyval` library bereits im Projekt) + BroadcastChannel API + Apps-Script Backend (Google Sheets als Storage).

**Spec:** `docs/superpowers/specs/2026-05-05-bundle-3-autosave-drafts-papierkorb-design.md`

**Branch:** `feature/bundle-3-autosave-drafts-papierkorb` (bereits angelegt, Spec-Commits `cef6d7f` + `63dd047`)

---

## File Structure

| Datei | Verantwortlich für | Status |
|---|---|---|
| `ExamLab/src/types/fragen-storage.ts` | Type-Erweiterung `status: 'draft'\|'sammlung'`, `geloescht_am: string\|null` | Modify |
| `ExamLab/apps-script-code.js` | Sheet-Schema-Migration A1:T1 → A1:V1, 4 neue Endpoints, GAS-Tests, Daily-Trigger | Modify |
| `ExamLab/src/services/draftApi.ts` | API-Adapter (4 Endpoints), abstrahiert Apps-Script für Backend-Migration | Create |
| `ExamLab/src/services/draftSync.ts` | Hybrid IDB+Server, debounce, 4-Stufen-Retry, BroadcastChannel | Create |
| `ExamLab/src/store/draftStore.ts` | globaler Zustand-Store für aktive Drafts (UI-Liste + dirty-Tracker) | Create |
| `ExamLab/src/hooks/useDirtyTracker.ts` | App-weiter dirty-Boolean-Tracker pro Editor-Instanz | Create |
| `ExamLab/src/hooks/useFragenAutoSave.ts` | Editor-Hook, kombiniert dirty-Tracker + draftSync | Create |
| `packages/shared/src/editor/components/SaveStatusIndikator.tsx` | 5-Zustand-Anzeige im Editor-Footer | Create |
| `packages/shared/src/editor/components/SchliessenModal.tsx` | Modal bei unvollständigem Draft | Create |
| `packages/shared/src/editor/SharedFragenEditor.tsx` | useFragenAutoSave integrieren, Save-Button durch Indikator ersetzen | Modify |
| `ExamLab/src/components/lp/fragenbank/DraftsSection.tsx` | Drafts-Sektion oben in Fragensammlung | Create |
| `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx` | DraftsSection einbinden, eigene+geteilte filter | Modify |
| `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx` | Liste, Wiederherstellen, Endgültig-löschen | Create |
| `ExamLab/src/components/lp/LPStartseite.tsx` | Papierkorb-Route + beforeunload-Listener integrieren | Modify |
| `ExamLab/src/store/authStore.ts` | Logout-Pfad: IDB-Cache cleanen mit `tx.oncomplete`-await (S149) | Modify |

**Tests** (in jeweiliger Test-Datei `*.test.ts(x)`):
- `draftSync.test.ts` (debounce, retry, server-authority)
- `draftApi.test.ts` (4 Endpoints, vi.mock auf uebenApiClient/apiClient)
- `useDirtyTracker.test.ts`, `useFragenAutoSave.test.ts`
- `SaveStatusIndikator.test.tsx` (5 Zustände)
- `SchliessenModal.test.tsx`
- `DraftsSection.test.tsx`, `PapierkorbView.test.tsx`

---

## Phase A — Daten-Modell + Apps-Script-Backend

**Ziel:** Schema-Migration + 4 Endpoints + GAS-Test-Shim. Apps-Script muss VOR Frontend-Phasen deployed sein.

### Task A.1: Type-Erweiterung in fragen-storage.ts

**Files:**
- Modify: `ExamLab/src/types/fragen-storage.ts` (FrageStorageBase oder analoges Interface)

- [ ] **Step 1: `status` und `geloescht_am` Felder ergänzen**

```typescript
// In existing FrageStorageBase oder Frage-Type:
export interface FrageStorageBase {
  // ... existing fields
  /** Lifecycle-Status. 'draft' = unvollständig (nur in Drafts-Sektion sichtbar).
   * 'sammlung' = vollständig (in regulärer Fragensammlung). Required mit Default 'sammlung' für Backfill. */
  status: 'draft' | 'sammlung'
  /** Soft-Delete-Timestamp (ISO). null = nicht gelöscht. Bundle 3. */
  geloescht_am: string | null
}
```

- [ ] **Step 2: tsc-Check**

Run: `cd ExamLab && npx tsc -b && npx tsc -b ../packages/shared --force`
Expected: viele Errors weil existing Code nicht mehr type-safe ist (alle Frage-Erzeugungs-Stellen müssen status setzen). Das ist erwartet — Tasks A.2 + B fixen das schrittweise.

**Hinweis:** Bei vielen existing Errors kann es pragmatisch sein, `status` und `geloescht_am` zunächst als optional zu deklarieren (`status?: 'draft' | 'sammlung'`). Später in Phase F (Cleanup) auf required ziehen sobald alle Schreibstellen migriert sind. **Plan-Empfehlung:** zunächst optional, finaler-required Übergang in Task F.1.

- [ ] **Step 3: Edit auf optional umstellen**

```typescript
status?: 'draft' | 'sammlung'
geloescht_am?: string | null
```

- [ ] **Step 4: tsc-b clean**

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/types/fragen-storage.ts
git commit -m "Bundle 3 P-A.1: Type-Erweiterung status + geloescht_am (optional, finaler required-Übergang in F.1)"
```

### Task A.2: Apps-Script Sheet-Schema-Migration

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Header-Setup-Funktion + Backfill-Job)

- [ ] **Step 1: Existing Sheet-Header-Logik finden**

Search im File für `setupFragenbank_` oder `'fragenbank'`-Sheet-Erzeugung. Identifiziere die Header-Definition (~Z. 8485-8489 laut Reviewer-Audit, aber verifiziere).

- [ ] **Step 2: Header von 20 auf 22 Spalten erweitern**

Im Setup-Funktion: existing header-Array um `'status'` und `'geloescht_am'` ergänzen.

```javascript
// vorher (existing, ~20 Spalten):
var fragenHeader = ['id', 'fach', 'thema', /*...*/, 'daten'];

// nachher (22 Spalten):
var fragenHeader = ['id', 'fach', 'thema', /*...*/, 'daten', 'status', 'geloescht_am'];
```

- [ ] **Step 3: Backfill-Job `migriereFragenZuBundle3_()` schreiben**

```javascript
function migriereFragenZuBundle3_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('fragenbank');
  if (!sheet) throw new Error('fragenbank-Sheet nicht gefunden');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    Logger.log('Keine Fragen vorhanden — Migration übersprungen');
    return;
  }

  // Header lesen
  var header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var statusCol = header.indexOf('status');
  var geloeschtCol = header.indexOf('geloescht_am');

  if (statusCol < 0 || geloeschtCol < 0) {
    throw new Error('Header status/geloescht_am fehlt — bitte Setup-Funktion zuerst laufen lassen');
  }

  // Werte für alle Rows: status='sammlung', geloescht_am=''
  var anzahl = lastRow - 1;
  var statusValues = Array.from({ length: anzahl }, function() { return ['sammlung']; });
  var geloeschtValues = Array.from({ length: anzahl }, function() { return ['']; });

  sheet.getRange(2, statusCol + 1, anzahl, 1).setValues(statusValues);
  sheet.getRange(2, geloeschtCol + 1, anzahl, 1).setValues(geloeschtValues);

  Logger.log('Migration abgeschlossen — ' + anzahl + ' Fragen mit status=sammlung backfilled');
}

function migriereFragenZuBundle3() { return migriereFragenZuBundle3_(); }
```

- [ ] **Step 4: Verify-Funktion `verifyBundle3Migration_()`**

```javascript
function verifyBundle3Migration_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('fragenbank');
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusCol = header.indexOf('status');

  if (statusCol < 0) throw new Error('Migration unvollständig: status-Spalte fehlt');

  // Stichprobe: 3 zufällige Rows
  var lastRow = sheet.getLastRow();
  var indices = [2, Math.floor(lastRow / 2), lastRow];
  for (var i = 0; i < indices.length; i++) {
    var row = indices[i];
    var status = sheet.getRange(row, statusCol + 1).getValue();
    if (status !== 'sammlung') {
      throw new Error('Row ' + row + ' hat status="' + status + '", erwartet "sammlung"');
    }
  }
  Logger.log('Verify ✓ — 3 Stichprobe-Rows haben status=sammlung');
}

function verifyBundle3Migration() { return verifyBundle3Migration_(); }
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle 3 P-A.2: Sheet-Schema A1:T1 → A1:V1 + Backfill-Job + Verify"
```

### Task A.3: Apps-Script — 4 Draft-Endpoints

**Files:**
- Modify: `ExamLab/apps-script-code.js`

Endpoints zu implementieren:
1. `speichereDraft(body)` — Upsert mit server-side Status-Berechnung
2. `ladeDraft(body)` — single-Frage mit Owner+Sharing-Check
3. `listeDrafts(body)` — alle Drafts (eigene + geteilte) für User
4. `softDeleteFrage(body)` / `stelleWiederHer(body)` / `hardDeleteFrage(body)` — Papierkorb

- [ ] **Step 1: `istVollstaendig_(frage)` Helper schreiben**

Server-side-Validierung der Pflichtfelder (analog `pflichtfeldValidation`-Logik im Frontend). Memory-Lehre: server ist Authority für Status.

```javascript
function istVollstaendig_(frage) {
  if (!frage || !frage.typ) return false;
  // Basis: thema, fach, fragetext, punkte > 0
  if (!frage.thema || !frage.fach || !frage.fragetext || !(frage.punkte > 0)) return false;

  // Typ-spezifische Pflichtfelder (analog pflichtfeldValidation.ts)
  switch (frage.typ) {
    case 'mc':
      if (!Array.isArray(frage.optionen) || frage.optionen.length < 2) return false;
      return frage.optionen.some(function(o) { return o.korrekt; });
    case 'richtigfalsch':
      return Array.isArray(frage.aussagen) && frage.aussagen.length >= 1;
    case 'lueckentext':
      return Array.isArray(frage.luecken) && frage.luecken.length >= 1
        && frage.luecken.every(function(l) {
          return Array.isArray(l.korrekteAntworten) && l.korrekteAntworten.length >= 1;
        });
    // ... weitere Typen analog (siehe pflichtfeldValidation.ts für vollständige Liste)
    default:
      return true;  // unbekannter Typ → akzeptieren
  }
}
```

- [ ] **Step 2: Endpoint `speichereDraftEndpoint(body)` (Upsert)**

```javascript
function speichereDraftEndpoint(body) {
  var email = (body.email || '').toString().toLowerCase();
  var token = body.token || body.sessionToken;
  var frage = body.frage;

  if (!email || !token || !frage || !frage.id) {
    return jsonResponse({ success: false, error: 'Fehlende Parameter' });
  }
  if (!lernplattformValidiereToken_(token, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }
  // Rate-Limit: 30 Save-Requests pro Minute pro LP
  var rl = lernplattformRateLimitCheck_('speichere-draft', email, 30, 60);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('fragenbank');
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = header.indexOf('id');
  var statusCol = header.indexOf('status');

  // Status server-authoritativ berechnen
  var status = istVollstaendig_(frage) ? 'sammlung' : 'draft';
  frage.status = status;

  // Find existing row by id
  var data = sheet.getRange(2, idCol + 1, sheet.getLastRow() - 1, 1).getValues();
  var rowIdx = -1;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === frage.id) { rowIdx = i + 2; break; }
  }

  // Owner-Check bei Update: nur Owner darf updaten
  var autorCol = header.indexOf('autor');
  if (rowIdx > 0) {
    var existingAutor = sheet.getRange(rowIdx, autorCol + 1).getValue();
    if (existingAutor && existingAutor !== email) {
      return jsonResponse({ success: false, error: 'Nicht eigene Frage' });
    }
  }

  // Upsert: row-Werte aus header + frage-Properties zusammenstellen
  var rowValues = header.map(function(col) {
    if (col === 'autor') return email;
    if (col === 'geloescht_am') return frage.geloescht_am || '';
    var val = frage[col];
    return val === undefined || val === null ? '' : (typeof val === 'object' ? JSON.stringify(val) : val);
  });

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, header.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return jsonResponse({ success: true, status: status });
}
```

- [ ] **Step 3: Endpoint `ladeDraftEndpoint(body)`**

```javascript
function ladeDraftEndpoint(body) {
  var email = (body.email || '').toString().toLowerCase();
  var token = body.token || body.sessionToken;
  var frageId = body.frageId;

  if (!email || !token || !frageId) {
    return jsonResponse({ success: false, error: 'Fehlende Parameter' });
  }
  if (!lernplattformValidiereToken_(token, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('fragenbank');
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = header.indexOf('id');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, header.length).getValues();

  for (var i = 0; i < data.length; i++) {
    if (data[i][idCol] === frageId) {
      var frage = rowZuFrage_(data[i], header);
      // Sharing-Check: eigene oder geteilt
      if (frage.autor !== email && !istGeteilt_(frage, email)) {
        return jsonResponse({ success: false, error: 'Nicht autorisiert' });
      }
      return jsonResponse({ success: true, frage: frage });
    }
  }
  return jsonResponse({ success: false, error: 'Frage nicht gefunden' });
}
```

- [ ] **Step 4: Endpoint `listeDraftsEndpoint(body)`**

```javascript
function listeDraftsEndpoint(body) {
  var email = (body.email || '').toString().toLowerCase();
  var token = body.token || body.sessionToken;
  if (!email || !token) return jsonResponse({ success: false, error: 'Fehlende Parameter' });
  if (!lernplattformValidiereToken_(token, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('fragenbank');
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusCol = header.indexOf('status');
  var geloeschtCol = header.indexOf('geloescht_am');
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, header.length).getValues();

  var drafts = [];
  for (var i = 0; i < data.length; i++) {
    if (data[i][statusCol] !== 'draft') continue;
    if (data[i][geloeschtCol]) continue; // Papierkorb-Inhalte ausblenden
    var frage = rowZuFrage_(data[i], header);
    if (frage.autor === email || istGeteilt_(frage, email)) {
      drafts.push(frage);
    }
  }
  return jsonResponse({ success: true, drafts: drafts });
}
```

- [ ] **Step 5: Soft-Delete + Restore + Hard-Delete Endpoints**

```javascript
function softDeleteFrageEndpoint(body) {
  // Owner-Check + setze geloescht_am=now
  // Return: success
}

function stelleWiederHerEndpoint(body) {
  // Owner-Check + setze geloescht_am=''
  // Return: success
}

function hardDeleteFrageEndpoint(body) {
  // Owner-Check + delete row
  // Return: success
}

function listePapierkorbEndpoint(body) {
  // Wie listeDraftsEndpoint aber filter geloescht_am !== ''
  // Return: success + frages array
}
```

(Vollständige Implementation analog zu `speichereDraftEndpoint`-Pattern: Token-Check, Owner-Check, Sheet-Update.)

- [ ] **Step 6: Dispatcher-Cases im `handlePostRequest_` ergänzen**

Suche im File die `switch(action)`-Anweisung, ergänze:

```javascript
case 'speichereDraft': return speichereDraftEndpoint(body);
case 'ladeDraft': return ladeDraftEndpoint(body);
case 'listeDrafts': return listeDraftsEndpoint(body);
case 'softDeleteFrage': return softDeleteFrageEndpoint(body);
case 'stelleWiederHer': return stelleWiederHerEndpoint(body);
case 'hardDeleteFrage': return hardDeleteFrageEndpoint(body);
case 'listePapierkorb': return listePapierkorbEndpoint(body);
```

- [ ] **Step 7: Existing `lade...`-Endpoints filtern Papierkorb-Inhalte**

Suche `ladeMeineFragen_` oder `ladeFragen_`-Endpoints. Ergänze Filter `geloescht_am === ''` damit Papierkorb-Inhalte nicht in Standard-Listen erscheinen.

- [ ] **Step 8: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle 3 P-A.3: 4 Draft-Endpoints + Papierkorb-Endpoints + Filter in existing Endpoints"
```

### Task A.4: GAS-Test-Shim `testBundle3DraftLifecycle_`

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Test-Shim mit 5 Cases schreiben**

```javascript
function testBundle3DraftLifecycle_() {
  Logger.log('=== Bundle 3 Draft-Lifecycle-Test ===');

  var testEmail = 'test.bundle3@gymhofwil.ch'; // dummy, kein echter Token-Check
  var testFrageBase = {
    id: 'test-bundle3-' + Date.now(),
    typ: 'mc',
    fach: 'WR',
    thema: 'Test',
    autor: testEmail,
    fragetext: 'Test?',
    punkte: 1,
    optionen: [{ id: 'o1', text: 'A', korrekt: true }, { id: 'o2', text: 'B', korrekt: false }],
  };

  // Case 1: speichereDraft mit vollständiger Frage → status=sammlung
  var resp1 = speichereDraftEndpoint({ email: testEmail, token: 'mock', frage: testFrageBase });
  // (Hinweis: Token-Check müsste für Test-Shim umgangen werden — vielleicht eigener Test-Pfad)
  Logger.log('Case 1: vollständig → status=' + JSON.parse(resp1.getContent()).status);

  // Case 2: speichereDraft mit unvollständiger Frage → status=draft
  var unvollstFrage = Object.assign({}, testFrageBase, { fragetext: '' });
  var resp2 = speichereDraftEndpoint({ email: testEmail, token: 'mock', frage: unvollstFrage });
  Logger.log('Case 2: unvollständig → status=' + JSON.parse(resp2.getContent()).status);

  // Case 3: softDelete + stelleWiederHer
  var resp3 = softDeleteFrageEndpoint({ email: testEmail, token: 'mock', frageId: testFrageBase.id });
  Logger.log('Case 3: softDelete → ' + resp3.getContent());
  var resp4 = stelleWiederHerEndpoint({ email: testEmail, token: 'mock', frageId: testFrageBase.id });
  Logger.log('Case 3: stelleWiederHer → ' + resp4.getContent());

  // Case 4: hardDelete (cleanup)
  hardDeleteFrageEndpoint({ email: testEmail, token: 'mock', frageId: testFrageBase.id });
  Logger.log('Case 4: hardDelete cleanup ✓');

  // Case 5: listeDrafts findet keine
  var resp5 = listeDraftsEndpoint({ email: testEmail, token: 'mock' });
  Logger.log('Case 5: listeDrafts nach cleanup → ' + JSON.parse(resp5.getContent()).drafts.length + ' Drafts');

  Logger.log('=== Bundle 3 Draft-Lifecycle-Test bestanden ===');
}

function testBundle3DraftLifecycle() { return testBundle3DraftLifecycle_(); }
```

**Hinweis:** Token-Check in Test-Shim umgehen — entweder Token-Validation mit Test-Mode-Flag oder direkten Helper-Aufruf statt Endpoint. Pragmatischer Pfad: separate `_testInternal`-Helpers ohne Auth-Check.

- [ ] **Step 2: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle 3 P-A.4: GAS-Test-Shim testBundle3DraftLifecycle_ (5 Cases)"
```

### Task A.5: Daily-Trigger für Auto-Hard-Delete (90 Tage)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 1: Auto-Hard-Delete-Funktion schreiben**

```javascript
function autoHardDeleteAlteFragen_() {
  var schwelle = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('fragenbank');
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var geloeschtCol = header.indexOf('geloescht_am');
  if (geloeschtCol < 0) { Logger.log('Migration noch nicht durch — übersprungen'); return; }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, header.length).getValues();
  var zuLoeschende = [];
  for (var i = 0; i < data.length; i++) {
    var geloescht = data[i][geloeschtCol];
    if (geloescht && geloescht < schwelle) {
      zuLoeschende.push(i + 2); // sheet-row-index (1-based + header)
    }
  }

  // Reverse-Sort damit deleteRow nicht Indices verschiebt
  zuLoeschende.sort(function(a, b) { return b - a; });
  for (var j = 0; j < zuLoeschende.length; j++) {
    sheet.deleteRow(zuLoeschende[j]);
  }
  Logger.log('Auto-Hard-Delete: ' + zuLoeschende.length + ' Fragen endgültig gelöscht (älter als 90 Tage)');
}
```

- [ ] **Step 2: Trigger-Installer-Funktion schreiben**

```javascript
function installiereAutoHardDeleteTrigger_() {
  // Existing Trigger entfernen falls vorhanden
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoHardDeleteAlteFragen_') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  // Neuen Trigger: täglich 3:00 Uhr
  ScriptApp.newTrigger('autoHardDeleteAlteFragen_').timeBased().atHour(3).everyDays(1).create();
  Logger.log('Auto-Hard-Delete Trigger installiert (täglich 3:00)');
}

function installiereAutoHardDeleteTrigger() { return installiereAutoHardDeleteTrigger_(); }
```

**User-Task in Phase A:** `installiereAutoHardDeleteTrigger` einmalig im GAS-Editor manuell ausführen (nach Deploy).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Bundle 3 P-A.5: Auto-Hard-Delete (90 Tage) + Daily-Trigger-Installer"
```

### Task A.6: USER-TASK Apps-Script-Deploy + Migration

**Files:** keine

- [ ] **Step 1: User informieren**

Plan listet folgende User-Tasks (in dieser Reihenfolge):

1. **Manuelles Google-Sheets-Backup** der Fragenbank (Memory S136-Lehre).
2. `apps-script-code.js` (HEAD-Commit) komplett in Google Apps Script Editor laden.
3. Im GAS-Editor ausführen:
   - `setupFragenbank` (oder analog) — falls existing setup-Funktion. Falls nicht: manuell Header-Spalten U+V (`status`, `geloescht_am`) ergänzen.
   - `migriereFragenZuBundle3` — Backfill aller existing Fragen auf `status=sammlung`.
   - `verifyBundle3Migration` — Stichprobe-Verifikation.
   - `testBundle3DraftLifecycle` — alle 5 Cases müssen ✓.
   - `installiereAutoHardDeleteTrigger` — Daily-Trigger aktivieren.
4. Bereitstellen → Bereitstellung verwalten → Bearbeiten → Version: Neu.
5. User bestätigt mit „Bundle 3 Backend deployed".

**Bis dahin Implementation pausieren.** Phase B braucht Backend live.

---

## Phase B — Service-Layer

**Ziel:** API-Adapter, Hybrid-Sync, Hooks, Store. Frontend ohne Editor-Integration.

### Task B.1: draftApi.ts — API-Adapter (TDD)

**Files:**
- Create: `ExamLab/src/services/draftApi.ts`
- Test: `ExamLab/src/services/draftApi.test.ts`

- [ ] **Step 1: Failing Test schreiben** (4 Cases pro Endpoint)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { speichereDraft, ladeDraft, listeDrafts, softDeleteFrage } from './draftApi'

vi.mock('./apiClient', () => ({
  postJson: vi.fn(),
}))

import { postJson } from './apiClient'

describe('draftApi.speichereDraft', () => {
  it('ruft postJson mit korrekter action + payload + token', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: true, status: 'sammlung' })
    const result = await speichereDraft({ email: 'a@b.ch', token: 'tok', frage: { id: 'f1' } as any })
    expect(postJson).toHaveBeenCalledWith('speichereDraft', { email: 'a@b.ch', frage: { id: 'f1' } }, 'tok')
    expect(result.status).toBe('sammlung')
  })

  it('wirft Error bei success:false', async () => {
    vi.mocked(postJson).mockResolvedValueOnce({ success: false, error: 'Nicht authentifiziert' })
    await expect(speichereDraft({ email: 'a@b.ch', token: 'tok', frage: { id: 'f1' } as any }))
      .rejects.toThrow('Nicht authentifiziert')
  })
})
// Analog für ladeDraft, listeDrafts, softDeleteFrage, stelleWiederHer, hardDeleteFrage, listePapierkorb
```

- [ ] **Step 2: Run Test → FAIL**

`cd ExamLab && npx vitest run src/services/draftApi.test.ts`
Expected: file existiert nicht → ImportError.

- [ ] **Step 3: draftApi.ts implementieren**

```typescript
import { postJson } from './apiClient'
import type { Frage } from '../types/fragen-storage'

export interface SpeichereDraftParams {
  email: string
  token: string
  frage: Frage
}

export interface SpeichereDraftResult {
  success: boolean
  status: 'draft' | 'sammlung'
}

export async function speichereDraft(params: SpeichereDraftParams): Promise<SpeichereDraftResult> {
  const { email, token, frage } = params
  const response = await postJson<{ success: boolean; status?: 'draft' | 'sammlung'; error?: string }>(
    'speichereDraft',
    { email, frage },
    token,
  )
  if (!response?.success) throw new Error(response?.error || 'speichereDraft fehlgeschlagen')
  return { success: true, status: response.status! }
}

export async function ladeDraft(params: { email: string; token: string; frageId: string }): Promise<Frage | null> {
  const response = await postJson<{ success: boolean; frage?: Frage; error?: string }>(
    'ladeDraft',
    { email: params.email, frageId: params.frageId },
    params.token,
  )
  if (!response?.success) {
    if (response?.error === 'Frage nicht gefunden') return null
    throw new Error(response?.error || 'ladeDraft fehlgeschlagen')
  }
  return response.frage ?? null
}

export async function listeDrafts(params: { email: string; token: string }): Promise<Frage[]> {
  const response = await postJson<{ success: boolean; drafts?: Frage[]; error?: string }>(
    'listeDrafts',
    { email: params.email },
    params.token,
  )
  if (!response?.success) throw new Error(response?.error || 'listeDrafts fehlgeschlagen')
  return response.drafts ?? []
}

export async function softDeleteFrage(params: { email: string; token: string; frageId: string }): Promise<void> {
  const response = await postJson<{ success: boolean; error?: string }>(
    'softDeleteFrage',
    { email: params.email, frageId: params.frageId },
    params.token,
  )
  if (!response?.success) throw new Error(response?.error || 'softDeleteFrage fehlgeschlagen')
}

// Analog: stelleWiederHer, hardDeleteFrage, listePapierkorb
```

- [ ] **Step 4: Test grün**

`cd ExamLab && npx vitest run src/services/draftApi.test.ts`
Expected: alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/services/draftApi.ts ExamLab/src/services/draftApi.test.ts
git commit -m "Bundle 3 P-B.1: draftApi.ts API-Adapter (TDD: 8+ Tests)"
```

### Task B.2: draftSync.ts — Hybrid IDB+Server

**Files:**
- Create: `ExamLab/src/services/draftSync.ts`
- Test: `ExamLab/src/services/draftSync.test.ts`

Komplexer Service — implementiert:
- 1s-debounce IDB-Cache
- 10s-debounce Server-Sync mit Retry-Schema
- BroadcastChannel für Multi-Tab
- finale-Sync-Funktion für Editor-Schließen

- [ ] **Step 1: Failing Tests** (8+ Cases)

Cases:
1. `tippeFrage` triggert IDB-Update nach 1s
2. `tippeFrage` triggert Server-Sync nach 10s
3. Konsekutive `tippeFrage` resettet beide Debounces
4. `finalisiere` führt synchronen Server-Sync mit await
5. Server-Sync 5xx → exp. backoff Retry 3x
6. Server-Sync 401 → sessionWiederherstellen + 1 retry
7. Server-Sync 4xx (außer 401/429) → eskaliert sofort
8. BroadcastChannel-Update von anderem Tab → in-Memory-State updaten

- [ ] **Step 2: Implementation**

(Detail-Implementation überlassen an Implementer; Pattern: idb-keyval für IDB, setTimeout-basierte Debouncer, Promise-Chain für Retries.)

- [ ] **Step 3: Tests grün + Commit**

```bash
git commit -m "Bundle 3 P-B.2: draftSync.ts Hybrid IDB+Server (TDD: 8+ Tests)"
```

### Task B.3: draftStore.ts — Globaler Zustand-Store

**Files:**
- Create: `ExamLab/src/store/draftStore.ts`
- Test: `ExamLab/src/store/draftStore.test.ts`

State:
```ts
interface DraftStore {
  aktiveDrafts: Map<string, { editorId: string; istDirty: boolean; status: 'draft'|'sammlung'|'sync-pending' }>
  registriere: (editorId: string) => void
  setzeDirty: (editorId: string, dirty: boolean) => void
  setzeStatus: (editorId: string, status: 'draft'|'sammlung'|'sync-pending') => void
  abmelde: (editorId: string) => void
  hatDirty: () => boolean // für beforeunload
}
```

- [ ] **Step 1-3: TDD-Cycle + Tests + Commit**

```bash
git commit -m "Bundle 3 P-B.3: draftStore.ts Globaler Tracker (TDD)"
```

### Task B.4: useDirtyTracker + useFragenAutoSave Hooks

**Files:**
- Create: `ExamLab/src/hooks/useDirtyTracker.ts`
- Create: `ExamLab/src/hooks/useFragenAutoSave.ts`
- Tests: jeweils `.test.ts(x)`

`useDirtyTracker(editorId)`: registriert beim draftStore, returnt `{ istDirty, markiereDirty, markiereSauber }`.

`useFragenAutoSave(editorId, frage)`: nutzt useDirtyTracker + draftSync. Returnt `{ status: 'sauber'|'sync-läuft'|'entwurf'|'verbindungsproblem'|'server-down', fehlendePflichtfelder: string[], finalisiereVorClose: () => Promise<void> }`.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-B.4: Hooks useDirtyTracker + useFragenAutoSave (TDD)"
```

---

## Phase C — Editor-Integration

### Task C.1: SaveStatusIndikator Komponente

**Files:**
- Create: `packages/shared/src/editor/components/SaveStatusIndikator.tsx`
- Test: `.test.tsx`

5 Zustände als Storybook-style props:

```tsx
interface Props {
  status: 'sauber' | 'sync-läuft' | 'entwurf' | 'verbindungsproblem' | 'server-down'
  fehlendePflichtfelder?: string[]
  onErneutVersuchen?: () => void
}
```

Render: badge mit Farb-Code (grün/grau/amber/gelb/rot).

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-C.1: SaveStatusIndikator (5 Zustände, TDD)"
```

### Task C.2: SchliessenModal Komponente

**Files:**
- Create: `packages/shared/src/editor/components/SchliessenModal.tsx`
- Test: `.test.tsx`

3 Varianten:
1. Frage unvollständig + Draft → „Als Entwurf behalten / Verwerfen"
2. Verbindungsproblem (sync nicht durch) → „Daten gehen verloren — wirklich schließen?"
3. silent close (vollständig + synced) — Modal nicht zeigen

- [ ] **Step 1-3: TDD + Commit**

```bash
git commit -m "Bundle 3 P-C.2: SchliessenModal (3 Varianten, TDD)"
```

### Task C.3: SharedFragenEditor — useFragenAutoSave integrieren

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx`

Editor-Body um `useFragenAutoSave`-Hook ergänzen. Save-Button-Slot durch SaveStatusIndikator ersetzen. onAbbrechen-Callback wrappen mit SchliessenModal-Logik.

- [ ] **Step 1: Hook integrieren**
- [ ] **Step 2: Save-Button → SaveStatusIndikator**
- [ ] **Step 3: onAbbrechen → SchliessenModal-Pfad**
- [ ] **Step 4: tsc + tests grün**
- [ ] **Step 5: Commit**

```bash
git commit -m "Bundle 3 P-C.3: SharedFragenEditor mit Auto-Save + Status-Indikator + Schließen-Modal"
```

### Task C.4: App-weiter beforeunload + Logout-IDB-Cleanup

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` (oder AppLP.tsx)
- Modify: `ExamLab/src/store/authStore.ts`

beforeunload-Listener:
```tsx
useEffect(() => {
  const handler = (e: BeforeUnloadEvent) => {
    if (useDraftStore.getState().hatDirty()) {
      e.preventDefault()
      e.returnValue = ''
    }
  }
  window.addEventListener('beforeunload', handler)
  return () => window.removeEventListener('beforeunload', handler)
}, [])
```

Logout-Pfad:
```ts
abmelden: async () => {
  // S149-Pattern: IDB-Cache cleanen MIT tx.oncomplete-await VOR Hard-Nav
  await clearDraftIDBCache() // returnt Promise<void> mit tx.oncomplete-resolve
  // ... existing logout ...
  window.location.href = '/login'
}
```

- [ ] **Step 1-3: Implementation + Tests + Commit**

```bash
git commit -m "Bundle 3 P-C.4: beforeunload-Listener + Logout-IDB-Cleanup (S149-Pattern)"
```

---

## Phase D — Fragensammlung-UI

### Task D.1: DraftsSection Komponente

**Files:**
- Create: `ExamLab/src/components/lp/fragenbank/DraftsSection.tsx`
- Test: `.test.tsx`

Render: Header „✏️ Entwürfe (N)" + Liste der eigenen + geteilten Drafts. Klick öffnet Editor mit der Frage.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-D.1: DraftsSection (eigene + geteilte, TDD)"
```

### Task D.2: FragenBrowser — DraftsSection einbinden

**Files:**
- Modify: `ExamLab/src/components/lp/fragenbank/FragenBrowser.tsx`

DraftsSection oben render. Drafts-Liste via `listeDrafts`-API laden + cachen.

- [ ] **Step 1-3: Edit + tests + commit**

```bash
git commit -m "Bundle 3 P-D.2: FragenBrowser mit DraftsSection oben"
```

---

## Phase E — Papierkorb

### Task E.1: PapierkorbView Komponente

**Files:**
- Create: `ExamLab/src/components/lp/papierkorb/PapierkorbView.tsx`
- Test: `.test.tsx`

Render: Liste mit `geloescht_am`-Timestamp, Wiederherstellen + Endgültig-löschen-Buttons. Warning bei Einträgen >83 Tage.

- [ ] **Step 1-3: TDD + Implementation + Commit**

```bash
git commit -m "Bundle 3 P-E.1: PapierkorbView (Liste, Wiederherstellen, Endgültig-löschen, TDD)"
```

### Task E.2: Papierkorb-Route im LPStartseite

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx`

`/papierkorb` Route + Navigation-Link in LP-Header.

- [ ] **Step 1-3: Edit + tests + commit**

```bash
git commit -m "Bundle 3 P-E.2: Papierkorb-Route + LP-Header-Link"
```

---

## Phase F — Cleanup + E2E + Merge

### Task F.1: Type-Felder von optional auf required ziehen

**Files:**
- Modify: `ExamLab/src/types/fragen-storage.ts`

Sobald alle Schreibstellen migriert sind (überprüft via grep), `status?` auf `status: 'draft' | 'sammlung'` (required) ziehen. tsc identifiziert Lücken.

- [ ] **Step 1: tsc lauf, alle ungesetzten Stellen patchen** (oder als Defensive `as unknown as`-Cast mit Marker — Bundle-L-Lehre)
- [ ] **Step 2: Tests + commit**

```bash
git commit -m "Bundle 3 P-F.1: status + geloescht_am required (Cleanup)"
```

### Task F.2: Pre-Merge-Checks

```bash
cd ExamLab
npx tsc -b
npx tsc -b ../packages/shared --force
npx vitest run
npm run build
npm run lint:as-any
```

Expected: alle clean, lint:as-any 0/0/0.

### Task F.3: HANDOFF-Update

**Files:**
- Modify: `ExamLab/HANDOFF.md`

Bundle 3 als „Letzter Stand auf main" eintragen mit Lehren.

```bash
git commit -m "HANDOFF: Bundle 3 dokumentiert"
```

### Task F.4: Push staging + Browser-E2E

Push branch + force preview. User testet:

| # | Test | Erwartung |
|---|---|---|
| 1 | Editor-Mount → kein Tippen → Schließen | nichts persistiert |
| 2 | Editor-Mount → Tippen einer Eingabe → 1s warten | grau „Speichert…" → grün/amber je Vollständigkeit |
| 3 | Vollständige Frage → Server-Sync → grün „Gespeichert" | Frage in Sammlung sichtbar |
| 4 | Pflichtfeld löschen → status → draft | Frage wandert in Drafts-Sektion |
| 5 | Editor schließen mit unvollständiger Frage | Modal „Als Entwurf behalten / Verwerfen" |
| 6 | „Verwerfen" klicken → Frage in Papierkorb | Papierkorb-View zeigt sie |
| 7 | „Wiederherstellen" → Frage zurück in Drafts | Draft-Sektion |
| 8 | Network-Tab: Server-Drop simulieren → 5xx-Retry | gelb „Verbindungsproblem", nach 3 Retries rot Banner |
| 9 | Multi-Tab: 2 Editor-Instanzen → in einem tippen, anderer aktualisiert | BroadcastChannel sync |
| 10 | Logout → IDB-Cache leer (DevTools Application) | Privacy intakt |

User-Bestätigung pro Pfad.

### Task F.5: Merge → main + Cleanup

```bash
git checkout main
git merge --no-ff feature/bundle-3-autosave-drafts-papierkorb -m "Merge feature/bundle-3-autosave-drafts-papierkorb (Bundle 3)"
git push origin main
git branch -d feature/bundle-3-autosave-drafts-papierkorb
git push origin --delete feature/bundle-3-autosave-drafts-papierkorb
```

Memory-Update: `project_bundle_3_autosave_drafts_papierkorb.md` schreiben + MEMORY.md ergänzen.

---

## Verifikation

- `tsc -b` clean (ExamLab + shared force)
- `vitest run` 1135+ vorhandene Tests grün, ~20 neue
- `lint:as-any` 0/0/0
- `npm run build` clean
- Apps-Script `testBundle3DraftLifecycle` 5/5 Cases ✓
- Browser-E2E mit echten Logins: 10 Pfade aus Task F.4

## Aufwand-Schätzung

- **Phasen:** 6 (A-F)
- **Tasks:** ~22 (Phase A: 6, B: 4, C: 4, D: 2, E: 2, F: 5)
- **Steps:** ~120
- **Commits:** ~22 atomare + 1 Merge
- **Sessions:** 3-4 (Phase A allein eine Session wegen Apps-Script-Komplexität + User-Task-Pause; Phase B-C eine Session; Phase D-E eine; Phase F mit E2E eine)
- **Apps-Script-Deploys:** 2 (initial + ggf. Hotfix nach Phase E)
- **User-Tasks:** 2 (Backend-Deploy nach Phase A, Browser-E2E in Phase F)

## Hinweise für Implementer

- **TDD strikt** in Phase B (Service-Layer) — alle Hooks + Sync-Service haben tricky Edge-Cases (Debounce-Race, Retry-Logik)
- **UI-Tests** in Phase C-E können Component-Test-Library-basiert sein (vitest + @testing-library/react)
- **BroadcastChannel** im jsdom-Test mocken via `vi.mock('broadcastchannel')` (jsdom-Support begrenzt)
- **Cleanup-Disziplin** in Phase F — `as unknown as`-Casts mit Defensive-Marker dokumentieren wenn nötig (Bundle-L-Pattern)
- **API-Adapter strikt halten** — keine Apps-Script-spezifische Logik in `draftApi.ts`, nur generische `success/error/data`-Shape. Bei Backend-Migration tauschst du nur die Implementation aus.
