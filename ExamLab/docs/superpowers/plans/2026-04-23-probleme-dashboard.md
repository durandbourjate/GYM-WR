# Probleme-Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin und LPs können die via FeedbackModal eingereichten Problemmeldungen + Wünsche in ExamlLab → Einstellungen → „Problemmeldungen" sehen, per Deep-Link zur betroffenen Frage navigieren und als erledigt markieren.

**Architecture:** Hybrid-Backend: anonymer `no-cors`-Schreibpfad am separaten Feedback-Apps-Script bleibt unverändert; neue authentifizierte Read-/Toggle-Endpoints in der Haupt-Apps-Script greifen auf das Sheet „ExamLab Problemmeldungen" via Script-Property zu. Sichtbarkeit/IDOR über bestehende `istSichtbarMitLP` / `ermittleRechtMitLP`-Helper. Frontend als neuer Tab in `EinstellungenPanel.tsx` mit clientseitigen Filtern (Status/Typ/Scope) und optimistischem Toggle.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand, Tailwind CSS v4, Vitest, Google Apps Script (Haupt + separat Feedback), Google Sheets. Bestehende Helper: `postJson`, `lernplattformValidiereToken_`, `lernplattformRateLimitCheck_`, `istZugelasseneLP`, `getLPInfo`, `alleGruppenLaden_`, `istSichtbarMitLP`, `ermittleRechtMitLP`.

**Spec-Referenz:** `docs/superpowers/specs/2026-04-23-probleme-dashboard-design.md`

---

## Branch

Aktueller Branch `feature/problemmeldungen-dashboard` (bereits mit Spec-Commits angelegt).

## Phase 1 — Feedback-Apps-Script (separat): Schema + Backfill + UUID-Write

Das separate Feedback-Apps-Script schreibt heute anonyme Meldungen. Wir fügen UUID-Generierung hinzu, damit die Haupt-Apps-Script Zeilen eindeutig referenzieren kann.

### Task 1: Sheet-Schema manuell erweitern (User)

**Files:** Google Sheet „ExamLab Problemmeldungen", Tab „ExamLab-Problemmeldungen"

- [ ] **Step 1:** User öffnet das Sheet.
- [ ] **Step 2:** User fügt nach Spalte `zeitstempel` eine neue Spalte `id` ein.
- [ ] **Step 3:** User fügt nach Spalte `id` eine neue Spalte `erledigt` ein.
- [ ] **Step 4:** User bestätigt: Header-Reihe ist jetzt `zeitstempel | id | erledigt | rolle | ort | typ | category | comment | pruefungId | frageId | frageText | zusatzinfo | frageTyp | modus | bildschirm | appVersion | gruppeId`.

**Commit:** keiner (Sheet, nicht Git).

### Task 2: Backfill-Function im separaten Feedback-Apps-Script

Der separate Feedback-Apps-Script hat einen eigenen Code-Bereich. Ich kann dort nur den finalen Code als Diff im Plan festhalten — User muss ihn im GAS-Editor einfügen (kein lokales Repo für diesen Script).

**Files:** separater Feedback-Apps-Script (`Code.gs` im GAS-Editor), **nicht im Repo**.

- [ ] **Step 1:** In der User-Doku den Code-Block für `backfillUuids` bereitstellen:

```js
/**
 * Einmalig auszuführen: füllt leere id-Zellen mit UUIDs.
 * User-Task: GAS-Editor → Function-Dropdown → backfillUuids → Run.
 */
function backfillUuids() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('ExamLab-Problemmeldungen');
  if (!sheet) throw new Error('Tab "ExamLab-Problemmeldungen" nicht gefunden');
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Spalte "id" fehlt — Schema nicht migriert');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var range = sheet.getRange(2, idCol + 1, lastRow - 1, 1);
  var values = range.getValues();
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (!values[i][0]) {
      values[i][0] = Utilities.getUuid();
      count++;
    }
  }
  range.setValues(values);
  Logger.log('Backfill: ' + count + ' UUIDs geschrieben.');
}
```

- [ ] **Step 2:** Schreibe die Anleitung in `ExamLab/docs/superpowers/plans/2026-04-23-probleme-dashboard-setup.md` (kurzes Setup-Dokument für DUY).

**Commit:**
```bash
git add ExamLab/docs/superpowers/plans/2026-04-23-probleme-dashboard-setup.md
git commit -m "ExamLab F1: Setup-Doku für Feedback-Apps-Script-Migration"
```

### Task 3: Write-Handler des Feedback-Apps-Script patchen

**Files:** separater Feedback-Apps-Script, **nicht im Repo**.

- [ ] **Step 1:** Setup-Doku um Code-Snippet für den gepatchten `doGet`-Handler erweitern:

```js
function doGet(e) {
  // … bestehende Parameter-Extraktion …
  var sheet = SpreadsheetApp.getActive().getSheetByName('ExamLab-Problemmeldungen');
  // Schema: zeitstempel | id | erledigt | rolle | ort | typ | category | comment
  //       | pruefungId | frageId | frageText | zusatzinfo | frageTyp | modus
  //       | bildschirm | appVersion | gruppeId
  sheet.appendRow([
    new Date(),
    Utilities.getUuid(),   // NEU
    '',                    // NEU (erledigt leer)
    e.parameter.rolle || '',
    e.parameter.ort || '',
    e.parameter.typ || '',
    e.parameter.category || '',
    e.parameter.comment || '',
    e.parameter.pruefungId || '',
    e.parameter.frageId || '',
    e.parameter.frageText || '',
    e.parameter.zusatzinfo || '',
    e.parameter.frageTyp || '',
    e.parameter.modus || '',
    e.parameter.bildschirm || '',
    e.parameter.appVersion || '',
    e.parameter.gruppeId || '',
  ]);
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}
```

- [ ] **Step 2:** Commit des Setup-Dokuments.

**Commit:**
```bash
git add ExamLab/docs/superpowers/plans/2026-04-23-probleme-dashboard-setup.md
git commit -m "ExamLab F1: Setup-Doku um UUID-Write-Handler erweitert"
```

### Task 4: User führt Backfill + Deploy aus

- [ ] **Step 1:** User öffnet GAS-Editor des Feedback-Apps-Script.
- [ ] **Step 2:** User fügt `backfillUuids`-Function ein → speichert → führt einmal aus → prüft Log (Anzahl backfilled).
- [ ] **Step 3:** User ersetzt `doGet` durch die neue Version → speichert → neue Bereitstellung erstellen (`Deploy → New deployment`).
- [ ] **Step 4:** User meldet „Feedback-Apps-Script deployed".
- [ ] **Step 5:** User testet einmalig: im ExamLab-Frontend eine Test-Meldung absenden → prüft, dass neue Sheet-Zeile eine UUID in `id` und leeres `erledigt` hat.

**Commit:** keiner.

---

## Phase 2 — Haupt-Apps-Script: Read + Toggle Endpoints

### Task 5: Script-Property setzen (User)

- [ ] **Step 1:** User öffnet GAS-Editor des Haupt-Apps-Script (`apps-script-code.js`-Deploy).
- [ ] **Step 2:** Projekt-Einstellungen (Zahnrad) → Script Properties → `PROBLEMMELDUNGEN_SHEET_ID` = <Sheet-ID des „ExamLab Problemmeldungen"-Sheets>.
- [ ] **Step 3:** User meldet „Script-Property gesetzt" mit der ID.

**Commit:** keiner.

### Task 6: Helper-Funktionen `baueFrageMetaMap_` und `baueGruppeMetaMap_`

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1:** Finde eine gute Stelle nach `ermittleRechtMitLP` (ca. Zeile 690) für neue Helper.

- [ ] **Step 2:** Füge Helper ein:

```js
// === Problemmeldungen — Helper ===

/**
 * Liest Fragen-Sheet 1× und gibt Map {frageId: frageMeta} zurück.
 * frageMeta enthält alle Felder, die istSichtbarMitLP / ermittleRechtMitLP brauchen:
 * autor, erstelltVon, berechtigungen, geteilt, fachbereich, quelle.
 * Zusätzlich: inhaberAktiv (Inhaber-Email noch im LP-Sheet).
 */
function baueFrageMetaMap_(frageIds) {
  var map = {};
  if (!frageIds || !frageIds.length) return map;

  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheets = fragenbank.getSheets();
  // LP-Emails einmalig holen für inhaberAktiv-Check
  var aktiveEmails = holeAktiveLPEmails_();

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var name = sheet.getName();
    if (FRAGENBANK_SYSTEM_TABS.indexOf(name) !== -1) continue;
    var lastCol = sheet.getLastColumn();
    if (lastCol === 0) continue;
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var idIdx = headers.indexOf('id');
    var autorIdx = headers.indexOf('autor');
    var erstelltIdx = headers.indexOf('erstelltvon');
    var berechtIdx = headers.indexOf('berechtigungen');
    var geteiltIdx = headers.indexOf('geteilt');
    var fachIdx = headers.indexOf('fachbereich');
    var quelleIdx = headers.indexOf('quelle');
    if (idIdx < 0) continue;

    for (var i = 1; i < data.length; i++) {
      var id = String(data[i][idIdx] || '');
      if (!id || frageIds.indexOf(id) < 0) continue;
      var inhaber = autorIdx >= 0 ? String(data[i][autorIdx] || '').toLowerCase() : '';
      if (!inhaber && erstelltIdx >= 0) inhaber = String(data[i][erstelltIdx] || '').toLowerCase();
      map[id] = {
        id: id,
        autor: autorIdx >= 0 ? String(data[i][autorIdx] || '') : '',
        erstelltVon: erstelltIdx >= 0 ? String(data[i][erstelltIdx] || '') : '',
        berechtigungen: berechtIdx >= 0 ? data[i][berechtIdx] : [],
        geteilt: geteiltIdx >= 0 ? String(data[i][geteiltIdx] || '') : '',
        fachbereich: fachIdx >= 0 ? String(data[i][fachIdx] || '') : '',
        quelle: quelleIdx >= 0 ? String(data[i][quelleIdx] || '') : '',
        inhaberEmail: inhaber,
        inhaberAktiv: inhaber ? aktiveEmails.indexOf(inhaber) >= 0 : false,
      };
    }
  }
  return map;
}

/**
 * Liest Gruppen-Registry 1× und gibt Map {gruppeId: meta} zurück.
 * Pruefung + Uebung teilen dieselbe Registry (unterscheidbar via typ).
 */
function baueGruppeMetaMap_(gruppeIds) {
  var map = {};
  if (!gruppeIds || !gruppeIds.length) return map;
  var gruppen = alleGruppenLaden_();
  gruppen.forEach(function(g) {
    if (gruppeIds.indexOf(g.id) < 0) return;
    map[g.id] = {
      id: g.id,
      autor: g.adminEmail,
      erstelltVon: g.adminEmail,
      berechtigungen: [],  // Gruppen haben Mitglieder-Tab, keine berechtigungen-Array
      geteilt: '',
      fachbereich: '',
      quelle: '',
      typ: g.typ,
      inhaberEmail: String(g.adminEmail || '').toLowerCase(),
      inhaberAktiv: true,  // Admin-Email war in Registry, damit gültig
    };
  });
  return map;
}

/**
 * Hilfsfunktion: Liste aller aktiven LP-Emails (lowercase).
 * Wird genau einmal pro listeProblemmeldungen-Call aufgerufen.
 */
function holeAktiveLPEmails_() {
  var sheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Lehrpersonen');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var emailIdx = headers.indexOf('email');
  if (emailIdx < 0) return [];
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var e = String(data[i][emailIdx] || '').toLowerCase().trim();
    if (e) out.push(e);
  }
  return out;
}
```

- [ ] **Step 3:** TypeScript-Build ist für Apps-Script nicht relevant — Syntax-Check per `node -c` oder via GAS-Editor-Deploy.

- [ ] **Step 4:** Commit.

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab F1: Backend-Helper baueFrageMetaMap_ / baueGruppeMetaMap_ für Problemmeldungen"
```

### Task 7: `listeProblemmeldungen`-Endpoint

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1:** Nach den Helpern aus Task 6 neuen Endpoint einfügen:

```js
/**
 * Liefert Problemmeldungen aus separatem Sheet, gefiltert auf Sichtbarkeit.
 * Auth: LP-Token. Rate-Limit: 30/5min.
 * LP sieht nur Meldungen mit Fragen-/Prüfungs-/Gruppen-Kontext wo er Leserecht hat.
 * Admin sieht alle.
 */
function listeProblemmeldungen(body) {
  var email = String(body.email || '').toLowerCase().trim();
  if (!istZugelasseneLP(email)) return jsonResponse({ success: false, error: 'Nicht autorisiert' });
  if (!lernplattformValidiereToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Token ungültig' });
  }
  var rl = lernplattformRateLimitCheck_('listeProblemmeldungen', email, 30, 300);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });

  var sheetId = PropertiesService.getScriptProperties().getProperty('PROBLEMMELDUNGEN_SHEET_ID');
  if (!sheetId) return jsonResponse({ success: false, error: 'Problemmeldungen-Sheet nicht konfiguriert' });

  var ss;
  try { ss = SpreadsheetApp.openById(sheetId); }
  catch (e) { return jsonResponse({ success: false, error: 'Sheet nicht erreichbar: ' + e.message }); }

  var sheet = ss.getSheetByName('ExamLab-Problemmeldungen');
  if (!sheet) return jsonResponse({ success: false, error: 'Tab "ExamLab-Problemmeldungen" nicht gefunden' });

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return jsonResponse({ success: true, data: [] });
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  var lastRow = sheet.getLastRow();
  var rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var col = function(name) { return headers.indexOf(name); };

  var lpInfo = getLPInfo(email);
  var istAdmin = !!(lpInfo && lpInfo.rolle === 'admin');

  // Alle frageIds + gruppeIds (pruefungId und gruppeId teilen Namespace) deduplizieren
  var frageIds = [];
  var gruppeIds = [];
  rows.forEach(function(r) {
    var fid = String(r[col('frageId')] || '');
    if (fid && frageIds.indexOf(fid) < 0) frageIds.push(fid);
    var pid = String(r[col('pruefungId')] || '');
    if (pid && gruppeIds.indexOf(pid) < 0) gruppeIds.push(pid);
    var gid = String(r[col('gruppeId')] || '');
    if (gid && gruppeIds.indexOf(gid) < 0) gruppeIds.push(gid);
  });

  var frageMap = baueFrageMetaMap_(frageIds);
  var gruppeMap = baueGruppeMetaMap_(gruppeIds);

  var meldungen = rows.map(function(r) {
    var id = String(r[col('id')] || '');
    var frageId = String(r[col('frageId')] || '');
    var pruefungId = String(r[col('pruefungId')] || '');
    var gruppeId = String(r[col('gruppeId')] || '');

    var frageMeta = frageMap[frageId] || null;
    var gruppeMeta = gruppeMap[pruefungId] || gruppeMap[gruppeId] || null;

    var sichtbarFrage = frageMeta ? istSichtbarMitLP(email, frageMeta, lpInfo, istAdmin) : false;
    var sichtbarGruppe = gruppeMeta ? istSichtbarMitLP(email, gruppeMeta, lpInfo, istAdmin) : false;
    var hatKontext = !!(frageId || pruefungId || gruppeId);

    // Sichtbarkeits-Regel:
    // - Admin sieht alles.
    // - LP sieht nur Meldungen mit Kontext wo mindestens eine Sichtbarkeit positiv ist.
    var sichtbar = istAdmin || sichtbarFrage || sichtbarGruppe;
    if (!sichtbar) return null;
    if (!istAdmin && !hatKontext) return null;

    var recht = 'betrachter';
    if (frageMeta && sichtbarFrage) recht = ermittleRechtMitLP(email, frageMeta, lpInfo, istAdmin);
    else if (gruppeMeta && sichtbarGruppe) recht = ermittleRechtMitLP(email, gruppeMeta, lpInfo, istAdmin);
    else if (istAdmin) recht = 'inhaber';

    // Privacy: frageText nur bei Leserecht auf Frage (oder Admin)
    var frageTextRaw = String(r[col('frageText')] || '');
    var frageText = (sichtbarFrage || istAdmin) ? frageTextRaw : '';

    return {
      id: id,
      zeitstempel: toIsoStr_(r[col('zeitstempel')]),
      typ: String(r[col('typ')] || ''),
      category: String(r[col('category')] || ''),
      comment: String(r[col('comment')] || ''),
      rolle: String(r[col('rolle')] || ''),
      frageId: frageId,
      frageText: frageText,
      frageTyp: String(r[col('frageTyp')] || ''),
      modus: String(r[col('modus')] || ''),
      pruefungId: pruefungId,
      gruppeId: gruppeId,
      ort: String(r[col('ort')] || ''),
      appVersion: String(r[col('appVersion')] || ''),
      inhaberEmail: frageMeta ? frageMeta.inhaberEmail : (gruppeMeta ? gruppeMeta.inhaberEmail : ''),
      inhaberAktiv: frageMeta ? frageMeta.inhaberAktiv : (gruppeMeta ? gruppeMeta.inhaberAktiv : true),
      istPoolFrage: !!(frageMeta && frageMeta.quelle === 'pool'),
      recht: recht,
      erledigt: String(r[col('erledigt')] || '').toLowerCase() === 'ja',
    };
  }).filter(function(m) { return m !== null; });

  return jsonResponse({ success: true, data: meldungen });
}
```

- [ ] **Step 2:** Commit.

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab F1: listeProblemmeldungen-Endpoint mit Sichtbarkeit + Privacy"
```

### Task 8: `markiereProblemmeldungErledigt`-Endpoint

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1:** Nach `listeProblemmeldungen` einfügen:

```js
/**
 * Setzt erledigt-Flag auf einer Meldung.
 * Auth: LP-Token. Rate-Limit: 60/5min.
 * IDOR: nicht-Admin muss recht ∈ {inhaber, bearbeiter} auf Frage oder Gruppe haben.
 */
function markiereProblemmeldungErledigt(body) {
  var email = String(body.email || '').toLowerCase().trim();
  var id = String(body.id || '');
  var erledigt = !!body.erledigt;
  if (!istZugelasseneLP(email)) return jsonResponse({ success: false, error: 'Nicht autorisiert' });
  if (!lernplattformValidiereToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Token ungültig' });
  }
  var rl = lernplattformRateLimitCheck_('toggleProblemmeldung', email, 60, 300);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });
  if (!id) return jsonResponse({ success: false, error: 'id fehlt' });

  var sheetId = PropertiesService.getScriptProperties().getProperty('PROBLEMMELDUNGEN_SHEET_ID');
  if (!sheetId) return jsonResponse({ success: false, error: 'Problemmeldungen-Sheet nicht konfiguriert' });

  var ss;
  try { ss = SpreadsheetApp.openById(sheetId); }
  catch (e) { return jsonResponse({ success: false, error: 'Sheet nicht erreichbar: ' + e.message }); }

  var sheet = ss.getSheetByName('ExamLab-Problemmeldungen');
  if (!sheet) return jsonResponse({ success: false, error: 'Tab nicht gefunden' });

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return jsonResponse({ success: false, error: 'Sheet leer' });
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h).trim(); });
  var idCol = headers.indexOf('id');
  var erledigtCol = headers.indexOf('erledigt');
  var frageIdCol = headers.indexOf('frageId');
  var pruefungIdCol = headers.indexOf('pruefungId');
  var gruppeIdCol = headers.indexOf('gruppeId');
  if (idCol < 0 || erledigtCol < 0) return jsonResponse({ success: false, error: 'Sheet-Schema kaputt' });

  var lastRow = sheet.getLastRow();
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];

  var lpInfo = getLPInfo(email);
  var istAdmin = !!(lpInfo && lpInfo.rolle === 'admin');

  for (var i = 0; i < data.length; i++) {
    if (String(data[i][idCol]) !== id) continue;

    if (!istAdmin) {
      var frageId = String(data[i][frageIdCol] || '');
      var pruefungId = String(data[i][pruefungIdCol] || '');
      var gruppeId = String(data[i][gruppeIdCol] || '');
      var recht = 'keine';
      if (frageId) {
        var fmeta = baueFrageMetaMap_([frageId])[frageId];
        if (fmeta && istSichtbarMitLP(email, fmeta, lpInfo, false)) {
          recht = ermittleRechtMitLP(email, fmeta, lpInfo, false);
        }
      }
      if ((recht === 'keine' || recht === 'betrachter') && (pruefungId || gruppeId)) {
        var gid = pruefungId || gruppeId;
        var gmeta = baueGruppeMetaMap_([gid])[gid];
        if (gmeta && istSichtbarMitLP(email, gmeta, lpInfo, false)) {
          var gRecht = ermittleRechtMitLP(email, gmeta, lpInfo, false);
          if (gRecht === 'inhaber' || gRecht === 'bearbeiter') recht = gRecht;
        }
      }
      if (recht !== 'inhaber' && recht !== 'bearbeiter') {
        return jsonResponse({ success: false, error: 'Keine Berechtigung für diese Meldung' });
      }
    }

    sheet.getRange(i + 2, erledigtCol + 1).setValue(erledigt ? 'ja' : '');
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false, error: 'Meldung nicht gefunden' });
}
```

- [ ] **Step 2:** Commit.

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab F1: markiereProblemmeldungErledigt-Endpoint mit IDOR-Schutz"
```

### Task 9: Dispatcher-Cases hinzufügen

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1:** Grep nach `case 'listeKIFeedbacks':` (ca. Zeile 1146) — dort werden LP-Endpoints dispatched. Füge 2 neue Cases dazu:

```js
case 'listeProblemmeldungen': return listeProblemmeldungen(body);
case 'markiereProblemmeldungErledigt': return markiereProblemmeldungErledigt(body);
```

- [ ] **Step 2:** Commit.

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab F1: Dispatcher-Cases für Problemmeldungen"
```

### Task 10: Smoke-Test-Function

**Files:** `ExamLab/apps-script-code.js`

- [ ] **Step 1:** Am Ende der Datei einfügen:

```js
/**
 * Manueller Smoke-Test im GAS-Editor.
 * Voraussetzung: Script-Property PROBLEMMELDUNGEN_SHEET_ID gesetzt.
 * Verwendet eine Admin-Email für den Test.
 */
function testProblemmeldungen() {
  var testEmail = 'yannick.durand@gymhofwil.ch';  // Admin
  var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('PROBLEMMELDUNGEN_SHEET_ID'));
  var sheet = ss.getSheetByName('ExamLab-Problemmeldungen');
  if (!sheet) throw new Error('Tab nicht gefunden');

  // Mock-Token erzeugen
  var cache = CacheService.getScriptCache();
  var mockToken = 'mock-test-' + Utilities.getUuid();
  cache.put('lp_session_' + mockToken, JSON.stringify({ email: testEmail, ts: new Date().toISOString() }), 300);

  // Liste abrufen
  var listResp = listeProblemmeldungen({ email: testEmail, token: mockToken });
  var listData = JSON.parse(listResp.getContent());
  if (!listData.success) throw new Error('Liste: ' + listData.error);
  Logger.log('✓ Liste OK: ' + listData.data.length + ' Meldungen');

  // Toggle auf erste Meldung (wenn vorhanden)
  if (listData.data.length > 0) {
    var first = listData.data[0];
    var origErledigt = first.erledigt;
    var toggleResp = markiereProblemmeldungErledigt({
      email: testEmail, token: mockToken,
      id: first.id, erledigt: !origErledigt
    });
    var toggleData = JSON.parse(toggleResp.getContent());
    if (!toggleData.success) throw new Error('Toggle: ' + toggleData.error);
    Logger.log('✓ Toggle OK auf id=' + first.id);
    // Zurücksetzen
    markiereProblemmeldungErledigt({
      email: testEmail, token: mockToken,
      id: first.id, erledigt: origErledigt
    });
    Logger.log('✓ Zurückgesetzt');
  } else {
    Logger.log('(keine Meldungen im Sheet → Toggle-Test übersprungen)');
  }
  Logger.log('✓ Alle Smoke-Tests bestanden.');
}
```

- [ ] **Step 2:** Commit.

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab F1: Smoke-Test testProblemmeldungen für GAS-Editor"
```

### Task 11: User führt GAS-Test + Deploy aus

- [ ] **Step 1:** User pusht Feature-Branch `feature/problemmeldungen-dashboard` → GAS-Editor synct automatisch (wenn via clasp/github-action) oder User kopiert den neuen Code manuell.
- [ ] **Step 2:** User führt `testProblemmeldungen` im GAS-Editor aus → erwartet `✓ Alle Smoke-Tests bestanden.` im Log.
- [ ] **Step 3:** User erstellt neue Bereitstellung.
- [ ] **Step 4:** User meldet „Haupt-Apps-Script deployed" + neue Deploy-URL (falls geändert).

**Commit:** keiner.

---

## Phase 3 — Frontend Types + API-Client

### Task 12: Type `Recht` + `Problemmeldung`

**Files:**
- Create: `ExamLab/src/types/problemmeldung.ts`

- [ ] **Step 1:** Neue Datei anlegen:

```ts
export type Recht = 'inhaber' | 'bearbeiter' | 'betrachter'

export interface Problemmeldung {
  id: string
  zeitstempel: string
  typ: 'problem' | 'wunsch'
  category: string
  comment: string
  rolle: 'lp' | 'sus' | ''
  frageId: string
  frageText: string
  frageTyp: string
  modus: 'pruefen' | 'ueben' | 'fragensammlung' | ''
  pruefungId: string
  gruppeId: string
  ort: string
  appVersion: string
  inhaberEmail: string
  inhaberAktiv: boolean
  istPoolFrage: boolean
  recht: Recht
  erledigt: boolean
}
```

- [ ] **Step 2:** Commit.

```bash
git add ExamLab/src/types/problemmeldung.ts
git commit -m "ExamLab F1: Types Recht + Problemmeldung"
```

### Task 13: API-Client

**Files:**
- Create: `ExamLab/src/api/problemmeldungenApi.ts`
- Test: `ExamLab/src/api/problemmeldungenApi.test.ts`

- [ ] **Step 1: Failing test** — schreibe Test der den unwrap-Pattern verifiziert:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listeProblemmeldungen, toggleProblemmeldung } from './problemmeldungenApi'
import * as apiClient from './apiClient'

describe('problemmeldungenApi', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('unwrappt listeProblemmeldungen-Response', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({
      success: true,
      data: [{ id: 'm1', typ: 'problem', comment: 'x' } as any]
    })
    const result = await listeProblemmeldungen({ email: 'a@b.ch', token: 't' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('m1')
  })

  it('gibt leeres Array bei success=false', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({ success: false, error: 'x' })
    const result = await listeProblemmeldungen({ email: 'a@b.ch', token: 't' })
    expect(result).toEqual([])
  })

  it('toggleProblemmeldung liefert boolean', async () => {
    vi.spyOn(apiClient, 'postJson').mockResolvedValue({ success: true })
    const ok = await toggleProblemmeldung({ email: 'a@b.ch', token: 't', id: 'm1', erledigt: true })
    expect(ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run test — erwarte FAIL** (Datei existiert nicht).

```bash
cd ExamLab && npx vitest run src/api/problemmeldungenApi.test.ts
```

- [ ] **Step 3: Implementation**

```ts
import type { Problemmeldung } from '../types/problemmeldung'
import { postJson } from './apiClient'

interface ListInput { email: string; token: string }
interface ToggleInput { email: string; token: string; id: string; erledigt: boolean }

interface ListResponse { success: boolean; data?: Problemmeldung[]; error?: string }
interface ToggleResponse { success: boolean; error?: string }

export async function listeProblemmeldungen(input: ListInput): Promise<Problemmeldung[]> {
  const result = await postJson<ListResponse>('listeProblemmeldungen', input)
  if (!result?.success || !Array.isArray(result.data)) return []
  return result.data
}

export async function toggleProblemmeldung(input: ToggleInput): Promise<boolean> {
  const result = await postJson<ToggleResponse>('markiereProblemmeldungErledigt', input)
  return !!result?.success
}
```

- [ ] **Step 4: Run test — erwarte PASS**.

- [ ] **Step 5:** `npx tsc -b` grün.

- [ ] **Step 6:** Commit.

```bash
git add ExamLab/src/api/problemmeldungenApi.ts ExamLab/src/api/problemmeldungenApi.test.ts
git commit -m "ExamLab F1: API-Client problemmeldungenApi mit Response-Unwrap"
```

---

## Phase 4 — Frontend UI

### Task 14: Filter-Logik (pure Functions + Tests)

**Files:**
- Create: `ExamLab/src/components/settings/problemmeldungen/filterLogik.ts`
- Test: `ExamLab/src/components/settings/problemmeldungen/filterLogik.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest'
import { filterMeldungen, priorisiereDeepLink } from './filterLogik'
import type { Problemmeldung } from '../../../types/problemmeldung'

const base: Problemmeldung = {
  id: 'x', zeitstempel: '2026-04-23T10:00:00Z', typ: 'problem', category: 'Fachlicher Fehler',
  comment: '', rolle: 'lp', frageId: '', frageText: '', frageTyp: '', modus: '',
  pruefungId: '', gruppeId: '', ort: 'dashboard', appVersion: '', inhaberEmail: '',
  inhaberAktiv: true, istPoolFrage: false, recht: 'betrachter', erledigt: false,
}

describe('filterMeldungen', () => {
  const m = (patch: Partial<Problemmeldung>): Problemmeldung => ({ ...base, ...patch })

  it('Status Offen filtert erledigte raus', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'offen', typ: 'alle', nurMeine: false }).map(x => x.id)).toEqual(['a'])
  })
  it('Status Erledigt filtert offene raus', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'erledigt', typ: 'alle', nurMeine: false }).map(x => x.id)).toEqual(['b'])
  })
  it('Status Alle lässt alle durch', () => {
    const input = [m({ id: 'a', erledigt: false }), m({ id: 'b', erledigt: true })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'alle', nurMeine: false })).toHaveLength(2)
  })
  it('Typ problem filtert Wünsche raus', () => {
    const input = [m({ id: 'a', typ: 'problem' }), m({ id: 'b', typ: 'wunsch' })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'problem', nurMeine: false }).map(x => x.id)).toEqual(['a'])
  })
  it('nurMeine filtert auf recht=inhaber', () => {
    const input = [m({ id: 'a', recht: 'inhaber' }), m({ id: 'b', recht: 'betrachter' })]
    expect(filterMeldungen(input, { status: 'alle', typ: 'alle', nurMeine: true }).map(x => x.id)).toEqual(['a'])
  })
})

describe('priorisiereDeepLink', () => {
  const m = (patch: Partial<Problemmeldung>): Problemmeldung => ({ ...base, ...patch })

  it('frageId hat höchste Priorität', () => {
    expect(priorisiereDeepLink(m({ frageId: 'f1', pruefungId: 'p1' }))).toEqual({ art: 'frage', id: 'f1' })
  })
  it('pruefungId > gruppeId > ort', () => {
    expect(priorisiereDeepLink(m({ pruefungId: 'p1', gruppeId: 'g1' }))).toEqual({ art: 'pruefung', id: 'p1' })
    expect(priorisiereDeepLink(m({ gruppeId: 'g1' }))).toEqual({ art: 'gruppe', id: 'g1' })
    expect(priorisiereDeepLink(m({ ort: 'dashboard' }))).toEqual({ art: 'ort', id: 'dashboard' })
  })
  it('Pool-Frage liefert kein Ziel', () => {
    expect(priorisiereDeepLink(m({ frageId: 'f1', istPoolFrage: true }))).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — erwarte FAIL**.

- [ ] **Step 3: Implementation**

```ts
import type { Problemmeldung } from '../../../types/problemmeldung'

export interface FilterConfig {
  status: 'offen' | 'erledigt' | 'alle'
  typ: 'alle' | 'problem' | 'wunsch'
  nurMeine: boolean
}

export function filterMeldungen(
  meldungen: Problemmeldung[],
  filter: FilterConfig,
): Problemmeldung[] {
  return meldungen.filter(m => {
    if (filter.status === 'offen' && m.erledigt) return false
    if (filter.status === 'erledigt' && !m.erledigt) return false
    if (filter.typ !== 'alle' && m.typ !== filter.typ) return false
    if (filter.nurMeine && m.recht !== 'inhaber') return false
    return true
  })
}

export type DeepLinkZiel =
  | { art: 'frage'; id: string }
  | { art: 'pruefung'; id: string }
  | { art: 'gruppe'; id: string }
  | { art: 'ort'; id: string }

export function priorisiereDeepLink(m: Problemmeldung): DeepLinkZiel | null {
  if (m.frageId && !m.istPoolFrage) return { art: 'frage', id: m.frageId }
  if (m.pruefungId) return { art: 'pruefung', id: m.pruefungId }
  if (m.gruppeId) return { art: 'gruppe', id: m.gruppeId }
  if (m.ort) return { art: 'ort', id: m.ort }
  return null
}
```

- [ ] **Step 4: Run test — erwarte PASS**.

- [ ] **Step 5: Commit**.

```bash
git add ExamLab/src/components/settings/problemmeldungen/filterLogik.ts ExamLab/src/components/settings/problemmeldungen/filterLogik.test.ts
git commit -m "ExamLab F1: Filter- + Deep-Link-Logik + Tests"
```

### Task 15: `ProblemmeldungenFilter.tsx`

**Files:**
- Create: `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungenFilter.tsx`

- [ ] **Step 1:** Anlegen:

```tsx
import type { FilterConfig } from './filterLogik'

interface Props {
  config: FilterConfig
  onChange: (patch: Partial<FilterConfig>) => void
  istAdmin: boolean
}

export default function ProblemmeldungenFilter({ config, onChange, istAdmin }: Props) {
  const btnCls = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-full border-2 transition-colors cursor-pointer ${
      active
        ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500'
        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
    }`

  return (
    <div className="flex flex-wrap gap-4 items-center mb-4 text-xs">
      <div className="flex gap-1.5">
        <span className="text-slate-500 dark:text-slate-400 self-center">Status:</span>
        {(['offen', 'erledigt', 'alle'] as const).map(s => (
          <button key={s} className={btnCls(config.status === s)} onClick={() => onChange({ status: s })}>
            {s === 'offen' ? 'Offen' : s === 'erledigt' ? 'Erledigt' : 'Alle'}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <span className="text-slate-500 dark:text-slate-400 self-center">Typ:</span>
        {(['alle', 'problem', 'wunsch'] as const).map(t => (
          <button key={t} className={btnCls(config.typ === t)} onClick={() => onChange({ typ: t })}>
            {t === 'alle' ? 'Alle' : t === 'problem' ? '🔴 Probleme' : '💡 Wünsche'}
          </button>
        ))}
      </div>
      {!istAdmin && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.nurMeine}
            onChange={e => onChange({ nurMeine: e.target.checked })}
            className="w-4 h-4"
          />
          <span className="text-slate-600 dark:text-slate-400">Nur meine Fragen</span>
        </label>
      )}
    </div>
  )
}
```

- [ ] **Step 2:** `npx tsc -b` grün.

- [ ] **Step 3:** Commit.

```bash
git add ExamLab/src/components/settings/problemmeldungen/ProblemmeldungenFilter.tsx
git commit -m "ExamLab F1: ProblemmeldungenFilter-Komponente"
```

### Task 16: `ProblemmeldungZeile.tsx`

**Files:**
- Create: `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx`

- [ ] **Step 1:** Anlegen:

```tsx
import type { Problemmeldung } from '../../../types/problemmeldung'
import { priorisiereDeepLink } from './filterLogik'

interface Props {
  meldung: Problemmeldung
  toggleErledigt: (id: string, neuerWert: boolean) => Promise<void>
  onOeffne: (ziel: ReturnType<typeof priorisiereDeepLink>) => void
  istAdmin: boolean
}

function formatRelativ(isoStr: string): string {
  if (!isoStr) return ''
  const ts = new Date(isoStr).getTime()
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'eben'
  if (min < 60) return `vor ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `vor ${d} d`
  return new Date(isoStr).toLocaleDateString('de-CH')
}

export default function ProblemmeldungZeile({ meldung, toggleErledigt, onOeffne, istAdmin }: Props) {
  const ziel = priorisiereDeepLink(meldung)
  const isLegacy = !meldung.id
  const kannToggle = !isLegacy && (istAdmin || meldung.recht === 'inhaber' || meldung.recht === 'bearbeiter')

  const typIcon = meldung.typ === 'problem' ? '🔴' : '💡'

  return (
    <div className={`border-l-4 ${meldung.erledigt ? 'border-slate-300 opacity-60' : meldung.typ === 'problem' ? 'border-red-400' : 'border-amber-400'} bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 mb-2`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <input
            type="checkbox"
            checked={meldung.erledigt}
            disabled={!kannToggle}
            onChange={e => toggleErledigt(meldung.id, e.target.checked)}
            title={isLegacy ? 'Legacy-Eintrag, Backfill nötig' : !kannToggle ? 'Keine Berechtigung' : ''}
            className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{typIcon} {meldung.category}</span>
            <span>·</span>
            <span>{formatRelativ(meldung.zeitstempel)}</span>
            <span>·</span>
            <span>Rolle: {meldung.rolle || '—'}</span>
            {meldung.modus && <><span>·</span><span>Modus: {meldung.modus}</span></>}
            {meldung.frageTyp && <><span>·</span><span>Fragetyp: {meldung.frageTyp}</span></>}
            {!meldung.inhaberAktiv && meldung.inhaberEmail && (
              <><span>·</span><span className="text-amber-600 dark:text-amber-400">ehemaliger Inhaber</span></>
            )}
            {meldung.istPoolFrage && <><span>·</span><span>Pool-Frage</span></>}
          </div>
          {meldung.comment && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{meldung.comment}</p>
          )}
          {meldung.frageText && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic truncate">„{meldung.frageText}"</p>
          )}
        </div>
        {ziel && (
          <button
            onClick={() => onOeffne(ziel)}
            className="flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            → Öffnen
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2:** `npx tsc -b` grün.

- [ ] **Step 3:** Commit.

```bash
git add ExamLab/src/components/settings/problemmeldungen/ProblemmeldungZeile.tsx
git commit -m "ExamLab F1: ProblemmeldungZeile-Komponente"
```

### Task 17: Deep-Link-Navigation-Hook

**Files:**
- Create: `ExamLab/src/components/settings/problemmeldungen/useDeepLink.ts`

- [ ] **Step 1:** Anlegen (Ziele werden via window-Events an Router-Listener geschickt — existierendes Pattern im Projekt, alternativ `useNavigate` wenn vorhanden):

```ts
import { useCallback } from 'react'
import type { DeepLinkZiel } from './filterLogik'

export function useDeepLink(schliesseEinstellungen: () => void) {
  return useCallback((ziel: DeepLinkZiel | null) => {
    if (!ziel) return
    schliesseEinstellungen()
    switch (ziel.art) {
      case 'frage':
        window.dispatchEvent(new CustomEvent('examlab:oeffne-frage', { detail: { frageId: ziel.id } }))
        break
      case 'pruefung':
        window.dispatchEvent(new CustomEvent('examlab:oeffne-pruefung', { detail: { pruefungId: ziel.id } }))
        break
      case 'gruppe':
        window.dispatchEvent(new CustomEvent('examlab:oeffne-gruppe', { detail: { gruppeId: ziel.id } }))
        break
      case 'ort':
        // Nur Info, kein Navigate
        break
    }
  }, [schliesseEinstellungen])
}
```

- [ ] **Step 2:** In den existierenden Page-Komponenten (`LPStartseite.tsx`, Fragensammlung, Prüfungs-Liste) Event-Listener ergänzen, die die jeweilige View öffnen und den Ziel-Datensatz vorwählen. Dies ist eine kleine Ergänzung im bestehenden Routing — Code-Änderung nur dort wo der jeweilige Tab geöffnet werden kann. **Implementation dispatcht zunächst nur das Event; passende Listener werden in Task 21 hinzugefügt**.

- [ ] **Step 3:** Commit.

```bash
git add ExamLab/src/components/settings/problemmeldungen/useDeepLink.ts
git commit -m "ExamLab F1: useDeepLink-Hook dispatcht Custom-Events"
```

### Task 18: `ProblemmeldungenTab.tsx` (Container)

**Files:**
- Create: `ExamLab/src/components/settings/problemmeldungen/ProblemmeldungenTab.tsx`

- [ ] **Step 1:** Anlegen:

```tsx
import { useState, useEffect, useCallback } from 'react'
import type { Problemmeldung } from '../../../types/problemmeldung'
import type { FilterConfig } from './filterLogik'
import { filterMeldungen } from './filterLogik'
import { listeProblemmeldungen, toggleProblemmeldung } from '../../../api/problemmeldungenApi'
import ProblemmeldungenFilter from './ProblemmeldungenFilter'
import ProblemmeldungZeile from './ProblemmeldungZeile'
import { useDeepLink } from './useDeepLink'

interface Props {
  email: string
  token: string
  istAdmin: boolean
  onSchliessen: () => void
}

export default function ProblemmeldungenTab({ email, token, istAdmin, onSchliessen }: Props) {
  const [meldungen, setMeldungen] = useState<Problemmeldung[] | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterConfig>({
    status: 'offen',
    typ: 'alle',
    nurMeine: false,
  })

  const oeffneDeepLink = useDeepLink(onSchliessen)

  useEffect(() => {
    let abgebrochen = false
    listeProblemmeldungen({ email, token })
      .then(data => { if (!abgebrochen) setMeldungen(data) })
      .catch(e => { if (!abgebrochen) setFehler(String(e?.message || e)) })
    return () => { abgebrochen = true }
  }, [email, token])

  const toggleErledigt = useCallback(async (id: string, neuerWert: boolean) => {
    // Optimistisches Update
    setMeldungen(prev => prev ? prev.map(m => m.id === id ? { ...m, erledigt: neuerWert } : m) : prev)
    const ok = await toggleProblemmeldung({ email, token, id, erledigt: neuerWert })
    if (!ok) {
      // Revert bei Fehler
      setMeldungen(prev => prev ? prev.map(m => m.id === id ? { ...m, erledigt: !neuerWert } : m) : prev)
      setFehler('Toggle fehlgeschlagen. Bitte erneut versuchen.')
      setTimeout(() => setFehler(null), 3000)
    }
  }, [email, token])

  if (fehler && meldungen === null) {
    return <div className="p-4 text-sm text-red-600 dark:text-red-400">Fehler beim Laden: {fehler}</div>
  }
  if (meldungen === null) {
    return <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Lade Meldungen…</div>
  }

  const gefiltert = filterMeldungen(meldungen, filter)

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
        Problemmeldungen
      </h3>
      {fehler && <div className="mb-3 p-2 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">{fehler}</div>}
      <ProblemmeldungenFilter
        config={filter}
        onChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
        istAdmin={istAdmin}
      />
      {gefiltert.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic py-4 text-center">
          {meldungen.length === 0 ? 'Keine Meldungen vorhanden.' : 'Keine Meldungen passen zum Filter.'}
        </p>
      ) : (
        gefiltert.map(m => (
          <ProblemmeldungZeile
            key={m.id}
            meldung={m}
            toggleErledigt={toggleErledigt}
            onOeffne={oeffneDeepLink}
            istAdmin={istAdmin}
          />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2:** `npx tsc -b` grün.

- [ ] **Step 3:** Commit.

```bash
git add ExamLab/src/components/settings/problemmeldungen/ProblemmeldungenTab.tsx
git commit -m "ExamLab F1: ProblemmeldungenTab Container mit Optimistic-Toggle"
```

### Task 19: Tab-Integration in `EinstellungenPanel.tsx`

**Files:**
- Modify: `ExamLab/src/store/lpUIStore.ts` (Type-Union `EinstellungenTab`)
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`

- [ ] **Step 1:** In `lpUIStore.ts` die `EinstellungenTab`-Union um `'problemmeldungen'` erweitern.

- [ ] **Step 2:** In `EinstellungenPanel.tsx`:
  - Import `ProblemmeldungenTab` und `listeProblemmeldungen`.
  - Token aus `authStore` holen (per `useAuthStore(s => s.token)` — vorher prüfen, wie der Token-State heute heisst).
  - Beim Mount `listeProblemmeldungen` laden, `offeneCount = meldungen.filter(m => !m.erledigt).length`.
  - Im `tabs`-Array: nach Favoriten einfügen: `{ key: 'problemmeldungen', label: `Problemmeldungen${offeneCount > 0 ? ` (${offeneCount})` : ''}`, sichtbar: true }`.
  - Im Render: `{tab === 'problemmeldungen' && user?.email && <ProblemmeldungenTab email={user.email} token={token} istAdmin={admin} onSchliessen={onSchliessen} />}`.
  - **WICHTIG**: Hook-Order — `useState`/`useEffect` für Meldungen + Count **vor** allen Early-Returns deklarieren (Rule Hooks-vor-Early-Returns aus code-quality.md).

- [ ] **Step 3:** `npx tsc -b` grün.
- [ ] **Step 4:** `npx vitest run` grün.
- [ ] **Step 5:** `npm run build` grün.

- [ ] **Step 6:** Commit.

```bash
git add ExamLab/src/store/lpUIStore.ts ExamLab/src/components/settings/EinstellungenPanel.tsx
git commit -m "ExamLab F1: Problemmeldungen-Tab in Einstellungen integriert"
```

### Task 20: Deep-Link-Listener in Zielseiten

**Files:**
- Modify: `ExamLab/src/components/lp/LPStartseite.tsx` (Event-Listener für `examlab:oeffne-frage`, der Fragensammlung öffnet + Frage vorselektiert — vermutlich via `useUiStore` + Query-Param)
- Modify: entsprechende Prüfungs-/Gruppen-Start-Komponenten (je nach Pfadtiefe)

Details je nach existierender Routing-Architektur. Minimal-Implementation:

- [ ] **Step 1:** In `LPStartseite.tsx` ein `useEffect` ergänzen, der `window.addEventListener('examlab:oeffne-frage', handler)` registriert. Der Handler setzt den UI-State so, dass die Fragensammlung offen und die Frage vorselektiert ist.
- [ ] **Step 2:** Analog für `examlab:oeffne-pruefung` → Prüfungs-Liste öffnen + auf Prüfung scrollen/selektieren.
- [ ] **Step 3:** Analog für `examlab:oeffne-gruppe` → Gruppen-Settings öffnen.

Da die Routing-Architektur des Projekts nicht trivial ist, ist dies der riskanteste Task. Vorgehen: **Exploration erst** (Grep nach bestehenden Custom-Events oder router-ähnlichen Hooks), dann Minimalversion.

- [ ] **Step 4:** Commit.

```bash
git add ExamLab/src/components/lp/LPStartseite.tsx
git commit -m "ExamLab F1: Deep-Link-Listener für examlab:oeffne-frage/pruefung/gruppe"
```

---

## Phase 5 — Staging + E2E + Merge

### Task 21: Lokale Verifikation

- [ ] **Step 1:** `cd ExamLab && npx tsc -b` grün.
- [ ] **Step 2:** `npx vitest run` grün.
- [ ] **Step 3:** `npm run build` grün.

### Task 22: Preview-Start + Frontend-Check

- [ ] **Step 1:** `preview_start` im Projektverzeichnis.
- [ ] **Step 2:** `preview_snapshot` der Startseite, prüfe dass keine Console-Errors.
- [ ] **Step 3:** Mit Admin-Login einloggen, Einstellungen öffnen, Tab „Problemmeldungen" klicken.
- [ ] **Step 4:** Prüfen: Liste lädt, Filter funktionieren, Toggle funktioniert.

### Task 23: Staging-Deploy

- [ ] **Step 1:** `git push -u origin feature/problemmeldungen-dashboard:preview --force-with-lease`
  - (Beachte Memory-Regel Preview-Force-Push: `git log preview ^feature/problemmeldungen-dashboard` prüfen — wenn preview Work-in-Progress hat, stoppen.)
- [ ] **Step 2:** GitHub-Actions-Build abwarten, Staging-URL laden.
- [ ] **Step 3:** User informiert + Chrome-in-Chrome-Tab-Gruppe vorbereiten.

### Task 24: E2E mit echten Logins

- [ ] **Step 1:** Test-Plan schriftlich (siehe regression-prevention.md Phase 3.0) — Abdeckung:
  - Admin sieht alle Meldungen inkl. kontextlose.
  - LP sieht nur Meldungen mit Fragen-/Gruppen-Kontext auf die er Sichtbarkeit hat.
  - Toggle auf eigene Meldung → OK.
  - Toggle auf fremde Meldung ohne Recht → Backend returnt Fehler, UI zeigt Toast, Toggle revertet.
  - Filter Status/Typ/nurMeine client-seitig korrekt.
  - Deep-Link zur Frage öffnet Fragensammlung.
  - Deep-Link zur Prüfung / Gruppe öffnet jeweilige Ansicht.
  - Legacy-Row (falls eine existiert) zeigt disabled-Toggle mit Tooltip.
  - Neue Meldung aus FeedbackModal erscheint in der Liste (nach Reload oder nach Erneut-Öffnen des Tabs).
- [ ] **Step 2:** User führt aus, meldet Ergebnisse.
- [ ] **Step 3:** Ggf. Bugs fixen, erneut Staging → erneut E2E.

### Task 25: Merge auf `main`

- [ ] **Step 1:** Nach User-Freigabe „Merge OK":
  - `git checkout main && git pull`
  - `git merge --no-ff feature/problemmeldungen-dashboard`
- [ ] **Step 2:** HANDOFF.md aktualisieren (Status-Block S139 oder höher).
- [ ] **Step 3:** `git push`.
- [ ] **Step 4:** Feature-Branch löschen: `git branch -d feature/problemmeldungen-dashboard && git push origin :feature/problemmeldungen-dashboard`.

**Commit für HANDOFF.md-Update**:
```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab: HANDOFF-Update nach F1 Merge (Probleme-Dashboard)"
git push
```

---

## Testing-Matrix

| Test | Ebene | Datei |
|------|-------|-------|
| API-Client unwrap | Vitest-Unit | `src/api/problemmeldungenApi.test.ts` |
| Filter-Logik | Vitest-Unit | `src/components/settings/problemmeldungen/filterLogik.test.ts` |
| Deep-Link-Priorität | Vitest-Unit | `src/components/settings/problemmeldungen/filterLogik.test.ts` |
| Backend-Smoke | GAS-Editor | `testProblemmeldungen` (manuell) |
| E2E | Chrome-in-Chrome | Staging-Tab-Gruppe |

## Sicherheitscheck (Phase 4 aus regression-prevention.md)

- [ ] Backend verwendet `lernplattformValidiereToken_` in beiden Endpoints.
- [ ] Backend verwendet `lernplattformRateLimitCheck_` in beiden Endpoints.
- [ ] `frageText` wird nur bei Leserecht ausgeliefert (`sichtbarFrage || istAdmin`).
- [ ] IDOR-Check im Toggle: `recht ∈ {inhaber, bearbeiter}` für nicht-Admin.
- [ ] Keine neuen `localStorage`-Persistierungen.
- [ ] Kein `dangerouslySetInnerHTML` oder `title=`/`href=` mit User-Content.
- [ ] SuS erreichen `EinstellungenPanel` nicht (bestehende Routing-Logik, zusätzlich Rolle-Check).

## Risiken / offene Unbekannte

- **Task 20 (Deep-Link-Listener):** Routing-Architektur noch nicht verifiziert. Möglicherweise nutzt das Projekt bereits `useUiStore` für Tab-Navigation, was eine sauberere Lösung wäre als Custom-Events. Exploration nötig zu Implementation-Beginn.
- **`authStore`-Token-Naming:** Muss vor Task 19 verifiziert werden (`s.token` vs. `s.sessionToken`).
- **`FRAGENBANK_ID` vs. Pool-Fragen:** `baueFrageMetaMap_` iteriert über Fragenbank-Tabs; Pool-Fragen leben evtl. in separatem Sheet. Falls eine Meldung auf eine Pool-Frage-ID zeigt, die nicht in Fragenbank ist, → `frageMeta = null` → Meldung für LP nicht sichtbar, Admin sieht sie ohne Deep-Link. Prüfen beim E2E.

## Referenzen

- Spec: `docs/superpowers/specs/2026-04-23-probleme-dashboard-design.md`
- Rule-Files: `.claude/rules/code-quality.md`, `.claude/rules/regression-prevention.md`, `.claude/rules/deployment-workflow.md`
- Bestehende Patterns: `kalibrierungApi.ts` (unwrap), `listeKIFeedbacks`-Endpoint (Rate-Limit + IDOR-Muster)
