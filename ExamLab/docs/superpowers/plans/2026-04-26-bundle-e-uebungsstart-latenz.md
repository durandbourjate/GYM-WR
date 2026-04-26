# Bundle E — Übungsstart-Latenz Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `lernplattformLadeLoesungen` cold-cache latency from ~4'322 ms (intern, N=10 Fragen) to ≤ 800 ms intern by replacing N× Per-Frage Sheet-Reads with 1× Bulk-Read pro betroffenem Sheet/Tab.

**Architecture:** Backend-only change in Apps Script. New helpers `gruppiereFragenIdsNachTab_` und `bulkLadeFragenAusSheet_` ersetzen die Per-Frage-Schleife in `lernplattformLadeLoesungen`. Cache-Schema (`frage_v1_<sheetId>_<frageId>`, 1 h TTL) bleibt unverändert. API-Vertrag und Frontend unverändert. Try/Catch-Fallback auf bestehende Per-Frage-Schleife bei Bulk-Read-Fehlern.

**Tech Stack:** Google Apps Script V8 (CacheService, SpreadsheetApp), JavaScript ES5+. Frontend: React 19 + Zustand + vitest (zur Verifikation der API-Vertrags-Stabilität).

**Spec:** [`ExamLab/docs/superpowers/specs/2026-04-26-bundle-e-uebungsstart-latenz-design.md`](../specs/2026-04-26-bundle-e-uebungsstart-latenz-design.md)

**Branch:** `feature/bundle-e-uebungsstart-latenz` (bereits erstellt, Commit `f4179cc` enthält die Spec)

---

## Klarstellungen aus Spec-Review (vor Implementation lesen)

1. **Aufgabengruppen-Teilaufgaben:** Teilaufgaben (`frage.teilaufgaben[]`) leben als JSON-Array innerhalb des Parent-Rows in der Sheet-Spalte `typDaten`. `bulkLadeFragenAusSheet_` matcht **nur Top-Level-IDs** im Sheet. Teilaufgaben-Lösungen werden danach (wie heute) über `frage.teilaufgaben` ergänzt — kein separater Sheet-Lookup.
2. **Worst-Case ohne `fachbereichHint`:** Wenn weder `gruppe.fragebankSheetId` (Familie) noch `fachbereichHint` gesetzt sind, fällt `gruppiereFragenIdsNachTab_` auf „alle Tabs durchsuchen" zurück → max. 4 Bulk-Reads (BWL/VWL/Recht/Andere). Das ist **bei weitem besser** als N×Per-Frage und kein Bug.
3. **Latenz-Messung intern:** `testLadeLoesungenLatenzNachBundleE` misst mit `Date.now()`-Brackets **innerhalb** der Funktion, nicht via Web-App-Roundtrip. Akzeptanz-Kriterium ist intern (ohne Plattform-Overhead).
4. **Browser-E2E SuS-2 optional:** Concurrent-Cache-Share-Test braucht 2. Test-SuS-Account. Falls nicht verfügbar: nicht-blockierend, der Test-Plan markiert ihn als „falls verfügbar".

---

## File-Struktur

| Datei | Aktion | Zweck |
|---|---|---|
| `ExamLab/apps-script-code.js` | Modify | Neue Helper, Umbau `lernplattformLadeLoesungen`, Test-Shims |
| `ExamLab/docs/superpowers/plans/2026-04-26-bundle-e-uebungsstart-latenz.md` | Create | Dieser Plan |
| `ExamLab/HANDOFF.md` | Modify | Status-Update nach Merge |
| Frontend (`src/store/ueben/uebungsStore.ts`, `src/services/uebenLoesungsApi.ts`) | Unchanged | API-Vertrag bleibt |
| `ExamLab/src/tests/uebenLoesungsApi.test.ts`, `uebungsStoreLoesungsPreload.test.ts` | Unchanged | Müssen grün bleiben (Vertrags-Test) |

---

## Phase 1: Helper `gruppiereFragenIdsNachTab_`

Gruppiert die `fragenIds` nach `{sheetId → tab → Set<frageId>}` für den Bulk-Read.

### Task 1: Test-Shim für `gruppiereFragenIdsNachTab_`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — neue Test-Funktion am Ende der Datei (nach Zeile 12778)

- [ ] **Step 1: Test-Shim schreiben (failing)**

Am Ende der Datei (nach `}` der letzten Funktion) anhängen:

```javascript
// =====================================================================
// BUNDLE E — Test-Shims (S146)
// =====================================================================

/** Test-Shim für gruppiereFragenIdsNachTab_ — Public-Wrapper ohne Underscore (GAS-Dropdown-Sichtbarkeit, S133-Lehre) */
function testGruppiereFragenIdsNachTab() {
  return testGruppiereFragenIdsNachTab_();
}

function testGruppiereFragenIdsNachTab_() {
  function assert_(cond, msg) { if (!cond) throw new Error('ASSERT FAIL: ' + msg); }
  Logger.log('=== testGruppiereFragenIdsNachTab ===');

  // Case 1: fachbereichHint gesetzt → alle IDs gehen in den Hint-Tab
  var r1 = gruppiereFragenIdsNachTab_(['id1', 'id2'], null, 'BWL');
  var sheet1 = Object.keys(r1)[0];
  assert_(sheet1 === FRAGENBANK_ID, 'Case 1: sheetId muss FRAGENBANK_ID sein, war ' + sheet1);
  assert_(Object.keys(r1[sheet1]).length === 1, 'Case 1: nur 1 Tab erwartet');
  assert_(r1[sheet1]['BWL'] !== undefined, 'Case 1: Tab BWL fehlt');
  assert_(r1[sheet1]['BWL'].size === 2, 'Case 1: 2 IDs erwartet, war ' + r1[sheet1]['BWL'].size);
  Logger.log('Case 1 (Hint=BWL): OK');

  // Case 2: kein Hint, kein Familie → alle Tabs als Suchraum
  var r2 = gruppiereFragenIdsNachTab_(['id1'], null, '');
  var tabs2 = Object.keys(r2[FRAGENBANK_ID]);
  assert_(tabs2.length >= 2, 'Case 2: mindestens 2 Tabs erwartet (BWL+VWL+...), war ' + tabs2.length);
  Logger.log('Case 2 (kein Hint): OK, ' + tabs2.length + ' Tabs');

  // Case 3: Familie-Gruppe → eigenes Sheet, Tab "Fragen"
  var familie = { typ: 'familie', fragebankSheetId: 'FAM_TEST_SHEET_ID' };
  var r3 = gruppiereFragenIdsNachTab_(['fid1', 'fid2'], familie, 'BWL');
  assert_(r3['FAM_TEST_SHEET_ID'] !== undefined, 'Case 3: Familie-Sheet fehlt');
  assert_(r3['FAM_TEST_SHEET_ID']['Fragen'].size === 2, 'Case 3: 2 IDs in Fragen-Tab erwartet');
  assert_(r3[FRAGENBANK_ID] === undefined, 'Case 3: Bank-Sheet darf nicht da sein');
  Logger.log('Case 3 (Familie): OK');

  Logger.log('=== testGruppiereFragenIdsNachTab: alle Cases OK ===');
  return { success: true };
}
```

- [ ] **Step 2: Run im GAS-Editor (User-Action) — Erwartet: FAIL**

User-Action: `ExamLab/apps-script-code.js` in GAS-Editor synchen (clasp push oder copy-paste). Im GAS-Editor Funktion `testGruppiereFragenIdsNachTab` aus Dropdown wählen + Ausführen.

Erwartet: `ReferenceError: gruppiereFragenIdsNachTab_ is not defined` (Funktion existiert noch nicht).

- [ ] **Step 3: Commit (Test failing)**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 1 — Test-Shim testGruppiereFragenIdsNachTab (failing)"
```

### Task 2: Implementation `gruppiereFragenIdsNachTab_`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — neue Funktion nach `ladeFrageUnbereinigtById_` (nach Zeile 8923)

- [ ] **Step 1: Funktion einfügen**

Direkt nach `ladeFrageUnbereinigtById_` (Zeile 8923) einfügen:

```javascript
/**
 * Gruppiert fragenIds nach {sheetId → tab → Set<frageId>} für Bulk-Read.
 * - Familie-Gruppe (gruppe.typ === 'familie' && gruppe.fragebankSheetId): alles geht in eigenes Sheet, Tab 'Fragen'
 * - fachbereichHint gesetzt + Hint ist gültiger Tab: alle IDs in den Hint-Tab (Happy-Path bei Bank)
 * - Sonst: Worst-Case → alle Bank-Tabs als Suchraum (max. 4 Bulk-Reads). Besser als N×Per-Frage.
 *
 * Returns: { [sheetId]: { [tab]: Set<frageId> } }
 */
function gruppiereFragenIdsNachTab_(fragenIds, gruppe, fachbereichHint) {
  var result = {};

  // Familie-Gruppe: eigenes Sheet, fester Tab 'Fragen'
  var istFamilie = gruppe && gruppe.typ === 'familie' && gruppe.fragebankSheetId;
  if (istFamilie) {
    result[gruppe.fragebankSheetId] = { 'Fragen': new Set(fragenIds) };
    return result;
  }

  // Bank-Gruppe: alle IDs gehen in FRAGENBANK_ID
  var sheetId = FRAGENBANK_ID;
  result[sheetId] = {};

  var alleTabs = getFragenbankTabs_();
  // Hint-Tab muss existieren in der Tab-Liste
  if (fachbereichHint && alleTabs.indexOf(fachbereichHint) !== -1) {
    result[sheetId][fachbereichHint] = new Set(fragenIds);
    return result;
  }

  // Worst-Case: kein Hint → alle Tabs als Suchraum (Bulk-Read sucht alle IDs in jedem Tab)
  for (var t = 0; t < alleTabs.length; t++) {
    result[sheetId][alleTabs[t]] = new Set(fragenIds);
  }
  return result;
}
```

- [ ] **Step 2: User-Action — clasp push / copy-paste in GAS-Editor**

Identische Anweisung wie Task 1 Step 2.

- [ ] **Step 3: User führt `testGruppiereFragenIdsNachTab` aus — Erwartet: PASS**

Erwartete Logs:
```
Case 1 (Hint=BWL): OK
Case 2 (kein Hint): OK, N Tabs
Case 3 (Familie): OK
=== testGruppiereFragenIdsNachTab: alle Cases OK ===
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 2 — gruppiereFragenIdsNachTab_ implementiert (alle Tests grün)"
```

---

## Phase 2: Helper `bulkLadeFragenAusSheet_`

Liest in 1 Sheet-Read alle angefragten IDs eines Tabs.

### Task 3: Test-Shim für `bulkLadeFragenAusSheet_`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — Test-Shim am Ende anhängen

- [ ] **Step 1: Test-Shim schreiben (failing)**

Nach `testGruppiereFragenIdsNachTab_` einfügen:

```javascript
/** Public-Wrapper ohne Underscore */
function testBulkLadeFragenAusSheet() { return testBulkLadeFragenAusSheet_(); }

function testBulkLadeFragenAusSheet_() {
  function assert_(cond, msg) { if (!cond) throw new Error('ASSERT FAIL: ' + msg); }
  Logger.log('=== testBulkLadeFragenAusSheet ===');

  // Erste 10 IDs aus BWL-Tab via direktem Sheet-Read holen (deterministisches Test-Set)
  var ss = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheet = ss.getSheetByName('BWL');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idIdx = headers.indexOf('id');
  var bwlIds = [];
  for (var i = 1; i < data.length && bwlIds.length < 10; i++) {
    if (data[i][idIdx]) bwlIds.push(String(data[i][idIdx]));
  }
  assert_(bwlIds.length === 10, 'Setup: brauche 10 BWL-IDs');

  var cache = CacheService.getScriptCache();

  // Case 1: Happy-Path — 10 IDs, alle gefunden, Cache-Slots gefüllt
  for (var i = 0; i < bwlIds.length; i++) cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + bwlIds[i]);
  Utilities.sleep(50);
  var idSet1 = new Set(bwlIds);
  var r1 = bulkLadeFragenAusSheet_(FRAGENBANK_ID, 'BWL', idSet1);
  assert_(Object.keys(r1).length === 10, 'Case 1: 10 Treffer erwartet, war ' + Object.keys(r1).length);
  // Cache-Effekt: ein Eintrag muss jetzt im Cache sein
  var cached = cache.get('frage_v1_' + FRAGENBANK_ID + '_' + bwlIds[5]);
  assert_(cached !== null, 'Case 1: Cache-Eintrag für ID 5 fehlt');
  Logger.log('Case 1 (Happy-Path): OK, 10/10 + Cache befüllt');

  // Case 2: Lücken — 9 valide + 1 Garbage-ID
  for (var i = 0; i < bwlIds.length; i++) cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + bwlIds[i]);
  Utilities.sleep(50);
  var idSet2 = new Set(bwlIds.slice(0, 9).concat(['nicht-existent-12345']));
  var r2 = bulkLadeFragenAusSheet_(FRAGENBANK_ID, 'BWL', idSet2);
  assert_(Object.keys(r2).length === 9, 'Case 2: 9 Treffer erwartet, war ' + Object.keys(r2).length);
  assert_(r2['nicht-existent-12345'] === undefined, 'Case 2: Garbage-ID darf nicht im Result sein');
  Logger.log('Case 2 (Lücken): OK, 9/10 (Lücke schweigend)');

  // Case 3: Cache-Hit — zweiter Call ohne Cache-Reset
  var idSet3 = new Set(bwlIds.slice(0, 5));
  var t0 = Date.now();
  var r3 = bulkLadeFragenAusSheet_(FRAGENBANK_ID, 'BWL', idSet3);
  var dt = Date.now() - t0;
  assert_(Object.keys(r3).length === 5, 'Case 3: 5 Treffer erwartet');
  assert_(dt < 200, 'Case 3: Warm-Cache muss < 200 ms sein, war ' + dt);
  Logger.log('Case 3 (Warm-Cache): OK, 5/5 in ' + dt + ' ms');

  Logger.log('=== testBulkLadeFragenAusSheet: alle Cases OK ===');
  return { success: true };
}
```

- [ ] **Step 2: User-Action push + run — Erwartet: FAIL**

`bulkLadeFragenAusSheet_ is not defined`.

- [ ] **Step 3: Commit (Test failing)**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 3 — Test-Shim testBulkLadeFragenAusSheet (failing)"
```

### Task 4: Implementation `bulkLadeFragenAusSheet_`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — neue Funktion direkt nach `gruppiereFragenIdsNachTab_`

- [ ] **Step 1: Funktion einfügen**

Direkt nach `gruppiereFragenIdsNachTab_` einfügen:

```javascript
/**
 * Liest in 1× Sheet-Read alle in idSet angefragten Fragen eines Tabs.
 *
 * Performance:
 * - Cache-Lookup zuerst pro ID (frage_v1_<sheetId>_<frageId>) → Treffer aus idSet entfernen
 * - Bei restlichem idSet > 0: 1× sheet.getDataRange().getValues() + Linear-Scan + Set.has()
 * - Pro Treffer: cache.put mit < 100'000 Bytes-Guard (existing pattern)
 *
 * Returns: Map { [frageId]: Frage } — nur Treffer; Lücken fehlen schweigend.
 */
function bulkLadeFragenAusSheet_(sheetId, tab, idSet) {
  var result = {};
  if (!idSet || idSet.size === 0) return result;

  var cache = CacheService.getScriptCache();
  var remaining = new Set();

  // Cache-Lookup zuerst
  var ids = Array.from(idSet);
  for (var i = 0; i < ids.length; i++) {
    var cacheKey = 'frage_v1_' + sheetId + '_' + ids[i];
    var cached = cache.get(cacheKey);
    if (cached) {
      try {
        result[ids[i]] = JSON.parse(cached);
        continue;
      } catch (e) { /* fallthrough */ }
    }
    remaining.add(ids[i]);
  }

  if (remaining.size === 0) return result;

  // Bulk-Read: 1× getDataRange().getValues()
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(tab);
    if (!sheet) return result;
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return result;

    var headers = data[0].map(function(h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');
    if (idIdx === -1) return result;

    // Linear-Scan, Match via Set.has() (O(1) statt O(N) bei jeder Frage)
    for (var r = 1; r < data.length; r++) {
      var rowId = String(data[r][idIdx]);
      if (!remaining.has(rowId)) continue;

      var row = {};
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        var val = data[r][c];
        if (!key || val === '' || val === null || val === undefined) continue;
        row[key] = String(val);
      }
      var frage = parseFrageKanonisch_(row, tab);
      result[rowId] = frage;

      // Cache schreiben (< 100'000 Bytes-Guard)
      try {
        var serialized = JSON.stringify(frage);
        if (serialized.length < 100000) {
          cache.put('frage_v1_' + sheetId + '_' + rowId, serialized, 3600);
        }
      } catch (e) { /* skip cache on serialize error */ }
    }
  } catch (e) {
    Logger.log('[bulkLadeFragenAusSheet_] Fehler in tab=' + tab + ': ' + e.message);
  }

  return result;
}
```

- [ ] **Step 2: User-Action push + run `testBulkLadeFragenAusSheet` — Erwartet: PASS**

Erwartete Logs:
```
Case 1 (Happy-Path): OK, 10/10 + Cache befüllt
Case 2 (Lücken): OK, 9/10 (Lücke schweigend)
Case 3 (Warm-Cache): OK, 5/5 in <200 ms
=== testBulkLadeFragenAusSheet: alle Cases OK ===
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 4 — bulkLadeFragenAusSheet_ implementiert (alle Tests grün)"
```

---

## Phase 3: `lernplattformLadeLoesungen` Umbau

### Task 5: Umbau `lernplattformLadeLoesungen` mit Try/Catch-Fallback

**Files:**
- Modify: `ExamLab/apps-script-code.js:8807-8858` — bestehende Funktion umbauen

- [ ] **Step 1: Bestehende Funktion lesen**

```bash
sed -n '8807,8858p' ExamLab/apps-script-code.js
```

Verifizieren dass die Schleife in Zeilen 8839-8855 unverändert ist.

- [ ] **Step 2: Funktion ersetzen**

Den Block von Zeile 8807 bis 8858 (`function lernplattformLadeLoesungen(body) { ... }`) ersetzen durch:

```javascript
function lernplattformLadeLoesungen(body) {
  var gruppeId = body.gruppeId;
  var fragenIds = body.fragenIds;
  var claimEmail = (body.email || '').toString().toLowerCase();
  var token = body.token || body.sessionToken;

  if (!gruppeId || !Array.isArray(fragenIds) || fragenIds.length === 0 || !claimEmail || !token) {
    return jsonResponse({ success: false, error: 'Fehlende oder ungültige Parameter' });
  }

  if (!lernplattformValidiereToken_(token, claimEmail)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }
  var email = claimEmail;

  // Rate-Limit: 5 Calls/Minute pro SuS
  var rl = lernplattformRateLimitCheck_('lade-loesungen', email, 5, 60);
  if (rl.blocked) return jsonResponse({ success: false, error: rl.error });

  // Gruppe + Mitgliedschaft prüfen
  var mitgliedCheck = istGruppenMitglied_(body, gruppeId);
  if (!mitgliedCheck) {
    return jsonResponse({ success: false, error: 'Kein Zugriff auf diese Gruppe' });
  }
  var gruppe = mitgliedCheck.gruppe;

  // Audit-Log — wer hat wann wieviele Lösungen abgefragt
  try {
    Logger.log('[lernplattformLadeLoesungen] gruppe=%s email=%s n=%s',
      gruppeId, email, String(fragenIds.length));
  } catch (e) { /* Logger-Unavailable nicht kritisch */ }

  // === Bundle E (S146): Bulk-Read pro Sheet/Tab statt Per-Frage-Read ===
  // Bei Fehler im Bulk-Pfad: Fallback auf bestehende Per-Frage-Schleife (kein Funktions-Verlust).
  // Worst-Case-Optimierung (Plan-Review-Empfehlung): nach jedem Tab gefundene IDs aus den idSets
  // der noch unbearbeiteten Tabs entfernen → spart Sheet-Reads wenn alle IDs in Tab 1 lagen.
  var fragenMap = {};
  try {
    var byTab = gruppiereFragenIdsNachTab_(fragenIds, gruppe, body.fachbereich);
    for (var sheetId in byTab) {
      for (var tab in byTab[sheetId]) {
        var idSet = byTab[sheetId][tab];
        if (idSet.size === 0) continue; // Alles in vorigem Tab gefunden — kein Sheet-Read nötig
        var found = bulkLadeFragenAusSheet_(sheetId, tab, idSet);
        for (var k in found) {
          fragenMap[k] = found[k];
          // Aus den noch zu durchsuchenden Tabs entfernen (Worst-Case-Speed-up)
          for (var nextTab in byTab[sheetId]) {
            if (nextTab !== tab) byTab[sheetId][nextTab].delete(k);
          }
        }
      }
    }
  } catch (e) {
    Logger.log('[lernplattformLadeLoesungen] Bulk-Read-Fallback aktiv: ' + e.message);
    fragenMap = {}; // Sicherheits-Reset, der Per-Frage-Loop unten füllt neu
  }

  var loesungen = {};
  for (var i = 0; i < fragenIds.length; i++) {
    var frageId = fragenIds[i];
    // Aus Bulk-Read-Map; falls Lücke, Per-Frage-Fallback (war heute schon der Pfad)
    var frage = fragenMap[frageId] || ladeFrageUnbereinigtById_(frageId, gruppe, body.fachbereich);
    if (!frage) continue; // Lücke → Client fällt pro-Frage zurück

    loesungen[frageId] = extrahiereLoesungsSlice_(frage);
    // Aufgabengruppe: Teilaufgaben als eigene Map-Keys ergänzen (unverändert)
    if (frage.typ === 'aufgabengruppe' && Array.isArray(frage.teilaufgaben)) {
      for (var t = 0; t < frage.teilaufgaben.length; t++) {
        var ta = frage.teilaufgaben[t];
        if (ta && ta.id) {
          loesungen[ta.id] = extrahiereLoesungsSlice_(ta);
        }
      }
    }
  }

  return jsonResponse({ success: true, loesungen: loesungen });
}
```

**Wichtig:** Die Anzahl der Zeilen kann leicht abweichen — verlasse Dich nicht auf exakte Zeilen-Replacement, sondern matche die ganze Funktions-Definition. Verifizieren mit `grep -n "^function lernplattformLadeLoesungen" ExamLab/apps-script-code.js`.

- [ ] **Step 3: Apps-Script-Syntax-Check (lokal mit Node)**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/" && node --check apps-script-code.js
```

Erwartet: kein Output (Syntax OK).

- [ ] **Step 4: Frontend-Tests laufen — Erwartet: alle 684 grün**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/ExamLab/" && npx vitest run uebenLoesungsApi uebungsStoreLoesungsPreload
```

Erwartet: API-Vertrag-Tests grün (kein Vertrags-Bruch, kein Code-Change im Frontend).

- [ ] **Step 5: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 5 — lernplattformLadeLoesungen auf Bulk-Read umgebaut + Try/Catch-Fallback"
```

---

## Phase 4: Latenz-Re-Messung & Akzeptanz

### Task 6: Test-Shim `testLadeLoesungenLatenzNachBundleE` (intern)

**Files:**
- Modify: `ExamLab/apps-script-code.js` — Test-Shim am Ende anhängen

- [ ] **Step 1: Test-Shim einfügen**

Nach `testBulkLadeFragenAusSheet_` einfügen:

```javascript
/** Public-Wrapper ohne Underscore */
function testLadeLoesungenLatenzNachBundleE() { return testLadeLoesungenLatenzNachBundleE_(); }

/**
 * Misst die INTERNE Latenz von lernplattformLadeLoesungen nach Bundle E.
 * Date.now()-Brackets DIREKT um den Bulk-Read + Per-Frage-Loop, nicht um den
 * gesamten Web-App-Call (= ohne Plattform-Overhead von ~1.5-2 s).
 * Akzeptanz-Kriterium: N=10 cold ≤ 800 ms intern.
 */
function testLadeLoesungenLatenzNachBundleE_() {
  function assert_(cond, msg) { if (!cond) throw new Error('ASSERT FAIL: ' + msg); }
  Logger.log('=== testLadeLoesungenLatenzNachBundleE ===');

  // Erste 10 BWL-IDs holen
  var ss = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheet = ss.getSheetByName('BWL');
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idIdx = headers.indexOf('id');
  var bwlIds = [];
  for (var i = 1; i < data.length && bwlIds.length < 10; i++) {
    if (data[i][idIdx]) bwlIds.push(String(data[i][idIdx]));
  }
  assert_(bwlIds.length === 10, 'Setup: brauche 10 BWL-IDs');

  var cache = CacheService.getScriptCache();
  var n_values = [1, 3, 5, 10];

  Logger.log('--- COLD CACHE (intern, ohne Plattform-Overhead) ---');
  for (var k = 0; k < n_values.length; k++) {
    var n = n_values[k];
    var ids = bwlIds.slice(0, n);

    // Cache-Reset für alle 10 IDs
    for (var j = 0; j < bwlIds.length; j++) {
      cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + bwlIds[j]);
    }
    Utilities.sleep(50);

    // Internes Brackets — simuliert den Bulk-Read + Per-Frage-Loop von lernplattformLadeLoesungen
    var t0 = Date.now();
    var byTab = gruppiereFragenIdsNachTab_(ids, null, 'BWL');
    var fragenMap = {};
    for (var sheetId in byTab) {
      for (var tab in byTab[sheetId]) {
        var found = bulkLadeFragenAusSheet_(sheetId, tab, byTab[sheetId][tab]);
        for (var x in found) fragenMap[x] = found[x];
      }
    }
    var loesungen = {};
    for (var p = 0; p < ids.length; p++) {
      var frage = fragenMap[ids[p]] || ladeFrageUnbereinigtById_(ids[p], null, 'BWL');
      if (frage) loesungen[ids[p]] = extrahiereLoesungsSlice_(frage);
    }
    var dt = Date.now() - t0;
    Logger.log('N=%s cold intern: %s ms (gefunden %s/%s)', n, dt, Object.keys(loesungen).length, n);
  }

  Logger.log('--- WARM CACHE (Re-Run) ---');
  for (var k = 0; k < n_values.length; k++) {
    var n = n_values[k];
    var ids = bwlIds.slice(0, n);
    var t0 = Date.now();
    var byTab = gruppiereFragenIdsNachTab_(ids, null, 'BWL');
    for (var sheetId in byTab) {
      for (var tab in byTab[sheetId]) {
        bulkLadeFragenAusSheet_(sheetId, tab, byTab[sheetId][tab]);
      }
    }
    var dt = Date.now() - t0;
    Logger.log('N=%s warm intern: %s ms', n, dt);
  }

  // Worst-Case-Variante (Plan-Review-Empfehlung): kein fachbereichHint → alle 4 Tabs durchsuchen
  Logger.log('--- WORST-CASE COLD (kein fachbereichHint, alle Tabs) ---');
  // Cache-Reset
  for (var j = 0; j < bwlIds.length; j++) cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + bwlIds[j]);
  Utilities.sleep(50);
  var t0 = Date.now();
  var byTabWc = gruppiereFragenIdsNachTab_(bwlIds, null, ''); // leerer Hint
  var foundCount = 0;
  for (var sheetId in byTabWc) {
    for (var tab in byTabWc[sheetId]) {
      if (byTabWc[sheetId][tab].size === 0) continue;
      var f = bulkLadeFragenAusSheet_(sheetId, tab, byTabWc[sheetId][tab]);
      for (var k in f) {
        foundCount++;
        for (var nextTab in byTabWc[sheetId]) {
          if (nextTab !== tab) byTabWc[sheetId][nextTab].delete(k);
        }
      }
    }
  }
  var dtWc = Date.now() - t0;
  Logger.log('N=10 worst-case cold (alle Tabs, mit Cache-Filtering): %s ms (%s/10 gefunden)', dtWc, foundCount);

  Logger.log('=== Akzeptanz-Kriterium: N=10 cold intern ≤ 800 ms (Happy-Path mit Hint) ===');
  return { success: true };
}
```

- [ ] **Step 2: User-Action — push + im GAS-Editor `testLadeLoesungenLatenzNachBundleE` ausführen**

User postet die Logs hier rein.

- [ ] **Step 3: Akzeptanz-Check**

Lese N=10 cold-Wert aus den Logs. Akzeptanz: ≤ 800 ms intern.

**Wenn ≤ 800 ms:** weiter zu Task 7 (Cleanup).

**Wenn > 800 ms:** Root-Cause-Analyse — möglicherweise Bulk-Read pro Tab im Worst-Case (4 Tabs × 400 ms = 1'600 ms). Mitigation: prüfen ob `body.fachbereich` im Frontend immer mitgegeben wird (sollte). Falls nicht: kleines Frontend-Fix.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab S146: Bundle E Task 6 — Latenz-Re-Messung Shim, Akzeptanz N=10 cold ≤ 800 ms verifiziert"
```

### Task 7: Mess-Shim aus Spec-Phase entfernen

Der ursprüngliche `testLadeLoesungenLatenz` (S146 Z-Phase) liegt nur im GAS-Editor des Users (lokal nicht committed). Der neue `testLadeLoesungenLatenzNachBundleE` ersetzt ihn funktional. Wir lassen den alten im GAS-Editor stehen — er ist zwar redundant, aber harmlos. Alternativ kann der User ihn manuell löschen.

- [ ] **Step 1: Notiz im HANDOFF — kein Code-Änderung nötig**

Wird in Task 11 (HANDOFF-Update) erwähnt.

---

## Phase 5: Apps-Script-Deploy & Browser-E2E

### Task 8: User-Action — Apps-Script Deploy

- [ ] **Step 1: Aktuelle Bereitstellungs-Nr. notieren**

User notiert sich im GAS-Editor unter „Bereitstellungen verwalten" die aktuelle Version (für Rollback).

- [ ] **Step 2: Neue Bereitstellung erstellen**

GAS-Editor → Bereitstellen → Neue Bereitstellung → Beschreibung: `Bundle E — Bulk-Read S146`. Webapp-URL bleibt identisch.

- [ ] **Step 3: User postet Bestätigung „Deploy live"**

Erst nach Bestätigung weiter zu Task 9.

### Task 9: Test-Plan schreiben (regression-prevention.md Phase 3.0)

**Files:** Kein Code-Change. Test-Plan im Chat dokumentieren.

- [ ] **Step 1: Test-Plan-Tabelle**

```
## Test-Plan: Bundle E — Übungsstart-Latenz

### Zu testende Änderungen
| # | Änderung | Erwartetes Verhalten | Regressions-Risiko |
|---|---|---|---|
| 1 | lernplattformLadeLoesungen Bulk-Read | Übungsstart 10 Fragen ≤ 3s (statt ~6s) | Wenn Bulk-Read crasht, Fallback auf alte Logik aktiv |
| 2 | Per-Frage-Cache wird bei Bulk-Read pre-warmt | pruefeAntwortJetzt nach Übungsstart instant (~25ms) | Kein |
| 3 | Multi-Fachbereich-Übungen (Mix-Modus) | 1 Bulk-Read pro betroffenem Tab | Worst-Case: bis 4 Tabs durchsucht |
| 4 | Familie-Pool-Fragen | Bulk-Read aus eigenem Sheet | Identisch zu heute, nur 1× statt N× |

### Security-Check
- [ ] SuS-Response von lernplattformLadeLoesungen enthält nur Lösungs-Felder (extrahiereLoesungsSlice_ unverändert)
- [ ] Token-Check + Rate-Limit + Mitgliedschafts-Check unverändert
- [ ] LP-Response unverändert (gleicher Endpoint)

### Betroffene kritische Pfade
- [ ] Pfad 1 (SuS lädt Übung) — Übungsstart, Haupt-Trigger
- [ ] Pfad 5 (LP Korrektur) — `lernplattformLadeLoesungen` wird auch im LP-Übungs-Vorschau-Pfad gerufen, dieselbe Optimierung greift dort. Explizit testen: LP klickt eine Übung an, sollte ebenfalls schneller laden.

### Regressions-Tests
- [ ] Übungsstart Single-Fachbereich (BWL, 10 Fragen)
- [ ] Übungsstart Mix-Modus
- [ ] Pool-Familie-Übung
- [ ] Aufgabengruppe mit Teilaufgaben (Lösungen pro Teilaufgabe da)
- [ ] Antwort-Korrektur instant nach Übungsstart
```

### Task 10: Browser-E2E mit echten Logins

**Files:** Kein Code-Change. E2E-Test laut Spec.

- [ ] **Step 1: Tab-Gruppe „Bundle E" erstellen, User loggt ein**

LP: `yannick.durand@gymhofwil.ch` · SuS-1: `wr.test@stud.gymhofwil.ch` · SuS-2 (optional, falls verfügbar): zweiter Test-SuS-Account.

- [ ] **Step 2: Single-SuS Cold-Cache-Test**

SuS-1 startet leere-Cache-Übung mit 10 Fragen aus BWL (nach Apps-Script-Deploy ist Cache 1 h leer für die ersten Calls).
- Stoppuhr vom Klick „Übung starten" bis erste Frage sichtbar
- **Erwartet: ≤ 3 s** (= ~2.5 s intern + Plattform-Overhead)
- Network-Tab: 1× POST `lernplattformLadeLoesungen`, Status 200, Response enthält 10 Lösungs-Slices

- [ ] **Step 3: Concurrent-Cache-Share-Test (FALLS SuS-2 verfügbar)**

SuS-2 startet 30 s nach SuS-1 dieselbe Übung.
- Erwartet: ≤ 1 s (warm-Cache)
- Network-Tab: gleicher POST, schnellere Response

**Falls SuS-2 nicht verfügbar:** SuS-1 startet die Übung erneut nach Abbruch. Auch warm.

- [ ] **Step 4: Multi-Fachbereich-Mix-Modus**

LP konfiguriert eine Mix-Übung mit Fragen aus 2 Fachbereichen. SuS-1 startet.
- Erwartet: ≤ 4 s (2 Bulk-Reads sequentiell)

- [ ] **Step 5: Pool-Frage-Familie**

Familie-Gruppe mit eigener Fragenbank (falls eingerichtet). SuS startet Übung.
- Erwartet: ≤ 3 s
- Bulk-Read aus Familie-Sheet, kein Bank-Sheet-Read

**Falls keine Familie-Gruppe eingerichtet:** als nicht-blockierend markieren (kann später nachgetestet werden).

- [ ] **Step 6: Antwort-Korrektur**

SuS antwortet auf Frage 3 → Erwartet: instant Feedback (Per-Frage-Cache wurde von Bulk-Read pre-warmt). Network-Tab: kein zusätzlicher `pruefeAntwortJetzt`-Call (oder falls doch, unter ~30 ms).

- [ ] **Step 7: Security-Network-Tab-Check**

In SuS-Tab DevTools → Network → POST `lernplattformLadeLoesungen` öffnen. Response-Body inspizieren:
- Pro Frage nur Lösungs-Felder (`korrekt`, `musterlosung`, `bewertungsraster`, `korrekteAntworten`, `dropdownOptionen`, etc. — je nach Fragetyp)
- Keine vollständige Frage-Definition (sonst Daten-Leak)
- Identisch zu Pre-Bundle-E-Verhalten

- [ ] **Step 8: Console-Errors-Check**

DevTools-Console während aller Tests offen. Keine neuen Errors außer evtl. erwartete Warnings.

- [ ] **Step 9: Resultate dokumentieren**

Im Chat: pro Test-Schritt Erwartung vs. Ist (Stoppuhr-Werte).

---

## Phase 6: HANDOFF & Merge

### Task 11: HANDOFF aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md` — neuer „Aktueller Stand"-Block

- [ ] **Step 1: HANDOFF.md aktualisieren**

Den Block „Aktueller Stand (S146, 26.04.2026) — Repo-Cleanup ..." durch den neuen Bundle-E-Stand ersetzen, alten Cleanup-Block in „Vorgänger-Stand" verschieben:

```markdown
### Aktueller Stand (S146, 26.04.2026) — Bundle E (Übungsstart-Latenz) auf `feature/bundle-e-uebungsstart-latenz`

**Backend-Optimierung von `lernplattformLadeLoesungen`:** Per-Frage-Sheet-Read durch Bulk-Read pro Sheet/Tab ersetzt. Cold-Latenz N=10 von ~4'322 ms (Z-Messung 26.04.) auf ≤ 800 ms intern reduziert (≤ -80 %). Spürbare Übungsstart-Latenz beim ersten SuS einer Klasse von ~6 s auf ~2.5 s.

**Architektur:**
- Neue Helper: `gruppiereFragenIdsNachTab_(fragenIds, gruppe, fachbereichHint)` + `bulkLadeFragenAusSheet_(sheetId, tab, idSet)`
- `lernplattformLadeLoesungen` ruft Bulk-Read in 1 Pass pro betroffenem Sheet/Tab auf, fällt bei Lücken oder Crash auf bestehenden Per-Frage-`ladeFrageUnbereinigtById_`-Pfad zurück
- Cache-Schema (`frage_v1_<sheetId>_<frageId>`, 1 h TTL) unverändert — nach 1. Bulk-Read sind alle relevanten Fragen warm; nachfolgende `pruefeAntwortJetzt`-Calls innerhalb 1 h instant
- API-Vertrag und Frontend unverändert

**Test-Stand:** N+M neue GAS-Test-Shims grün, 684/684 vitest grün, `tsc -b` clean, `npm run build` success.

**Browser-E2E mit echten Logins (LP yannick.durand + SuS wr.test):** [Resultate eintragen]

**Apps-Script-Deploy:** ✅ neue Bereitstellung am [Datum] mit Bundle E.

**Folge-Optimierungen vermerkt für später:**
- Frontend-Skeleton-Pattern (A3-Variante) wenn 2.5 s sich noch zu langsam anfühlt
- Per-aktive-Themen-Pre-Warm wenn LP-Übungen häufig Themen wechseln
- Edge-Backend-Migration für Multi-Klassen-Concurrency

### Vorgänger-Stand (S146, 26.04.2026) — Repo-Cleanup auf `main`

[bestehender Cleanup-Block]
```

- [ ] **Step 2: Bundle-E-Eintrag in „Offen für S146+"-Sektion entfernen**

Den Block „**3) Bundle E (Übungsstart-Latenz)**" aus der „Offen"-Liste entfernen — wird durch das Merge erledigt.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab S146: HANDOFF Bundle E Stand + Browser-E2E-Resultate"
```

### Task 12: Merge nach `main`

- [ ] **Step 1: User-Freigabe einholen**

Im Chat zusammenfassen:
- Was wurde geändert (2 Helper, 1 Funktion umgebaut, 3 Test-Shims, HANDOFF)
- Browser-E2E-Resultate (Stoppuhr-Werte vs. Erwartungen)
- Security-Check-Resultat
- Apps-Script-Deploy bestätigt

User antwortet „Merge OK" oder Korrekturen.

- [ ] **Step 2: Merge nach main**

```bash
git checkout main
git pull
git merge --no-ff feature/bundle-e-uebungsstart-latenz -m "Merge feature/bundle-e-uebungsstart-latenz: Bundle E Übungsstart-Latenz S146"
git push
```

- [ ] **Step 3: Branch löschen**

```bash
git branch -d feature/bundle-e-uebungsstart-latenz
```

- [ ] **Step 4: Final-Check Tests + Build auf main**

```bash
cd ExamLab && npx tsc -b && npx vitest run && npm run build
```

Alle 3 grün → fertig.

---

## Risiken-Checkliste (vor jedem Task durchgehen)

- [ ] Bulk-Read-Memory: heute schon `getDataRange().getValues()` für ganzen Tab → kein neues Memory-Risiko
- [ ] Cache-Größe: Per-Frage-Cache mit < 100'000-Bytes-Guard übernommen
- [ ] Try/Catch-Fallback: bei Bulk-Read-Crash fällt Code auf existierende Per-Frage-Schleife zurück → keine Funktions-Regression möglich
- [ ] API-Vertrag: Request/Response-Shape unverändert → kein Frontend-Breakdown
- [ ] Sicherheits-Invarianten: Token-Check, Rate-Limit, Mitgliedschaft, Lösungs-Slice unverändert
- [ ] Apps-Script-Editor-Sichtbarkeit: alle Test-Funktionen haben Public-Wrapper ohne `_`-Suffix (S133-Lehre)
- [ ] Latenz-Messung intern: `Date.now()`-Brackets im Test-Shim, nicht via Web-App-Call (Spec-Reviewer-Empfehlung)

## Referenzen

- Spec: [`ExamLab/docs/superpowers/specs/2026-04-26-bundle-e-uebungsstart-latenz-design.md`](../specs/2026-04-26-bundle-e-uebungsstart-latenz-design.md)
- Code-Quality-Regeln: [`.claude/rules/code-quality.md`](../../../../.claude/rules/code-quality.md) — insbesondere §„Apps-Script-Latenz", §„Apps-Script Sheet-Guards", §„postJson-Response-Unwrap"
- Regression-Prevention: [`.claude/rules/regression-prevention.md`](../../../../.claude/rules/regression-prevention.md) — Phase 3 Browser-E2E
- Deployment-Workflow: [`.claude/rules/deployment-workflow.md`](../../../../.claude/rules/deployment-workflow.md) — Branch + Merge + Apps-Script-Deploy
