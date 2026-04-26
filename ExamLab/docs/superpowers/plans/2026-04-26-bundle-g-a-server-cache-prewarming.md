# Bundle G.a — Server-Cache-Pre-Warming Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apps-Script-`CacheService` proaktiv vorwärmen entlang vier User-Workflow-Trigger (LP speichert Prüfung, SuS klickt Fach-Tab, SuS hovert Themen-Card, SuS gibt ab), um Übungsstart-Latenz von ~3-4s auf ~2-2.5s zu reduzieren.

**Architecture:** Ein neuer Apps-Script-Endpoint `lernplattformPreWarmFragen` (für Trigger A/B/C) plus Inline-Erweiterung in `speichereAntworten` (Trigger D). Frontend nutzt einen einzigen `usePreWarm`-Hook + `useDebouncedHover` für Hover. fragenIds werden vom Frontend mitgegeben — kein Backend-Lookup nötig. Fire-and-forget-Pattern, AbortController, fail-silent. Cache-Schema (`frage_v1_<sheetId>_<frageId>`, 1h TTL) bleibt von Bundle E geerbt.

**Tech Stack:** Google Apps Script V8 (CacheService, SpreadsheetApp), JavaScript ES5+. Frontend: React 19 + TypeScript + Zustand + vitest. Helper aus Bundle E (`gruppiereFragenIdsNachTab_`, `bulkLadeFragenAusSheet_`) werden direkt wiederverwendet.

**Spec:** [`ExamLab/docs/superpowers/specs/2026-04-26-bundle-g-a-server-cache-prewarming-design.md`](../specs/2026-04-26-bundle-g-a-server-cache-prewarming-design.md)

**Branch:** `feature/bundle-g-a-prewarming` (bereits erstellt, Commits `f0450d7`/`464fbf7`/`a1108de` enthalten die Spec)

---

## Klarstellungen aus Spec-Review (vor Implementation lesen)

1. **Ein Endpoint, drei Trigger:** `lernplattformPreWarmFragen` ist universell für Trigger A (LP `speichereConfig`), B (SuS Fach-Tab) und C (SuS Hover). Frontend-seitige Trigger-Differenzierung über das Aufruf-Timing — Backend kennt nur `{fragenIds, gruppeId, fachbereich?}`.
2. **Trigger D ist intern, nicht Frontend-getriggert:** Der Pre-Warm für die Korrektur passiert **server-seitig** im `istAbgabe===true`-Pfad von `speichereAntworten`. Frontend-Code dafür: keiner.
3. **Frontend gibt fragenIds mit:** Kein `holeLobby_`-Helper im Backend — Frontend extrahiert die fragenIds entweder aus `config.abschnitte` (Trigger A) oder aus dem `AppsScriptFragenAdapter`-Cache (Trigger B/C).
4. **Lock-Key über fragenIds-Hash:** Soft-Lock über `CacheService` (Key `prewarm_<email>_<hashIds_(fragenIds)>`, TTL 30s). Re-Hover dieselbe Card → `deduped:true`. Verschiedene Themen blockieren sich nicht. Kein `LockService` — der Cache-basierte Soft-Lock genügt.
5. **`lastUsedThema` ist neu:** localStorage-Key `examlab.lastUsedThema.<gruppeId>.<fach>` mit Themen-Name (String) als Value. Wird im `uebungsStore.starteSession` gesetzt.
6. **Akzeptanz-Kriterium intern ≤ 700 ms** für `testPreWarmEffekt` warm-Pfad. Spürbar ≤ 2.5 s im Browser-E2E. Bundle-E-Latenzen dürfen sich nicht verschlechtern (Cold ≤ 1'200 ms intern, Warm ≤ 250 ms intern).
7. **Kill-Switch:** Frontend-Konstante `PRE_WARM_ENABLED = true` in `preWarmApi.ts`. Bei Production-Issues auf `false` setzen + Frontend-Deploy.

---

## File-Struktur

| Datei | Aktion | Zweck |
|---|---|---|
| `ExamLab/apps-script-code.js` | Modify | Neuer Endpoint `lernplattformPreWarmFragen` + Helper `hashIds_` + Erweiterung `speichereAntworten` (Trigger D) + Helper `preWarmKorrekturNachAbgabe_` + 3 GAS-Test-Shims |
| `ExamLab/src/services/preWarmApi.ts` | Create | API-Wrapper `preWarmFragen(fragenIds, gruppeId, fachbereich?, signal?)` + `PRE_WARM_ENABLED`-Flag |
| `ExamLab/src/hooks/usePreWarm.ts` | Create | Generischer fire-and-forget-Hook mit AbortController + 5s-Timeout |
| `ExamLab/src/hooks/useDebouncedHover.ts` | Create | `{onMouseEnter, onMouseLeave}` mit 300ms-Debounce für Trigger C |
| `ExamLab/src/adapters/ueben/appsScriptAdapter.ts` | Modify | Public-Getter `getCachedFragen(gruppeId): Frage[] \| undefined` |
| `ExamLab/src/store/ueben/uebungsStore.ts` | Modify | `lastUsedThema` in localStorage schreiben nach erfolgreichem `starteSession` |
| `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx` | Modify | Trigger A: nach `apiService.speichereConfig`-Erfolg `preWarmFragen(...)` |
| `ExamLab/src/components/ueben/Dashboard.tsx` | Modify | Trigger B: bei Fach-Tab-Click `preWarmFragen(...)` mit `lastUsedThema` |
| `ExamLab/src/components/ueben/ThemaKarte.tsx` | Modify | Trigger C: `useDebouncedHover` integrieren |
| `ExamLab/src/tests/preWarmApi.test.ts` | Create | vitest für API-Wrapper |
| `ExamLab/src/tests/usePreWarm.test.ts` | Create | vitest für Hook |
| `ExamLab/src/tests/useDebouncedHover.test.ts` | Create | vitest für Hover-Hook |
| `ExamLab/src/tests/lastUsedThemaPersistenz.test.ts` | Create | vitest für localStorage-Schreib-Pfad in `starteSession` |
| `ExamLab/HANDOFF.md` | Modify | Status-Update nach Merge |

**Frontend-Tests:** ~30 neue Test-Cases, ergänzen die bestehenden 684 vitest-Tests.

---

## Phase 1: Backend — Neuer Helper `hashIds_`

Stabile Hash-Funktion für fragenIds-Arrays. Wird im Soft-Lock-Cache-Key (`prewarm_<email>_<hash>`) verwendet.

### Task 1: `hashIds_`-Helper

**Files:**
- Modify: `ExamLab/apps-script-code.js` — vor `gruppiereFragenIdsNachTab_` (Z. ~8962) einfügen

- [ ] **Step 1: Helper-Funktion einfügen**

```javascript
/**
 * Stabiler Hash über ein fragenIds-Array für Soft-Lock-Cache-Keys.
 * Sortiert + joined + MD5 → erste 8 Hex-Zeichen. Reicht für Dedup-Use-Case.
 *
 * @param {string[]} fragenIds
 * @return {string} 8-Zeichen-Hex
 */
function hashIds_(fragenIds) {
  if (!Array.isArray(fragenIds) || fragenIds.length === 0) return 'empty';
  var sorted = fragenIds.slice().sort();
  var raw = sorted.join('|');
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw);
  var hex = '';
  for (var i = 0; i < 4; i++) {
    var b = bytes[i] & 0xff;
    hex += (b < 16 ? '0' : '') + b.toString(16);
  }
  return hex;
}
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

Expected: `apps-script-code.js: script syntax is valid` oder ohne Output.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: hashIds_-Helper für Soft-Lock-Cache-Keys"
```

---

## Phase 2: Backend — Endpoint `lernplattformPreWarmFragen`

Neuer Endpoint für Trigger A+B+C. Nutzt Bundle-E-Helper `gruppiereFragenIdsNachTab_` + `bulkLadeFragenAusSheet_`.

### Task 2: Dispatcher-Case

**Files:**
- Modify: `ExamLab/apps-script-code.js` — Dispatcher in der `doPost`-Funktion (~Z. 1395-1410) ergänzen

- [ ] **Step 1: Dispatcher-Case hinzufügen**

In der Switch/Case-Struktur der `doPost`-Funktion, direkt **nach** dem Case `'lernplattformLadeLoesungen'` (Z. ~1395):

```javascript
    case 'lernplattformPreWarmFragen':
      return lernplattformPreWarmFragen(body);
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

Expected: keine Syntax-Fehler.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: Dispatcher-Case für lernplattformPreWarmFragen"
```

### Task 3: Endpoint-Implementierung

**Files:**
- Modify: `ExamLab/apps-script-code.js` — neue Funktion **nach** `lernplattformLadeLoesungen` (Ende des Funktions-Blocks, vor `function lernplattformLadeFragenAusGruppenSheet_`)

- [ ] **Step 1: Endpoint-Funktion einfügen**

```javascript
/**
 * Bundle G.a — Pre-Warm CacheService für eine Liste von fragenIds.
 *
 * Fire-and-forget aus Frontend bei drei Triggern:
 *   A) LP speichert eine Prüfung (fragenIds aus config.abschnitte)
 *   B) SuS klickt Fach-Tab (fragenIds aus letzt-genutztem Thema, lokal gefiltert)
 *   C) SuS hovert >300ms auf Themen-Card (fragenIds des Themas, lokal gefiltert)
 *
 * Auth: jeder authentifizierte User (LP via istZugelasseneLP, SuS via Session-Token).
 * Soft-Lock via CacheService dedupliziert pro {email, hashIds_(fragenIds)} mit 30s TTL.
 * Sanity-Check: 1 ≤ fragenIds.length ≤ 200 (DoS-Schutz).
 *
 * Body:     { email, sessionToken, fragenIds: string[], gruppeId, fachbereich? }
 * Response: { success: true, fragenAnzahl: N, latenzMs: X }
 *           { success: true, deduped: true }
 *           { error: ... }
 *
 * @param {Object} body
 * @return {Object} jsonResponse
 */
function lernplattformPreWarmFragen(body) {
  var startMs = Date.now();
  try {
    var email = (body.email || '').toLowerCase().trim();
    var sessionToken = body.sessionToken || '';
    var fragenIds = body.fragenIds;
    var gruppeId = body.gruppeId;
    var fachbereich = body.fachbereich || '';

    // 1. Sanity-Check fragenIds
    if (!Array.isArray(fragenIds)) {
      return jsonResponse({ error: 'fragenIds muss Array sein' });
    }
    if (fragenIds.length === 0) {
      return jsonResponse({ error: 'fragenIds leer' });
    }
    if (fragenIds.length > 200) {
      console.log('[PreWarmFragen] DoS-Schutz: ' + fragenIds.length + ' fragenIds von ' + email);
      return jsonResponse({ error: 'Zu viele Fragen (max 200)' });
    }
    if (!gruppeId) {
      return jsonResponse({ error: 'gruppeId fehlt' });
    }

    // 2. Auth: LP via Domain ODER SuS via Session-Token
    //    validiereSessionToken_(token, email, pruefungId?) — pruefungId hier nicht relevant,
    //    weil Pre-Warm an keine konkrete Prüfung gebunden ist.
    var istLP = istZugelasseneLP(email);
    if (!istLP) {
      if (!sessionToken || !validiereSessionToken_(sessionToken, email)) {
        return jsonResponse({ error: 'Nicht autorisiert' });
      }
    }

    // 3. CacheService-Soft-Lock (30s TTL) für Dedup pro {email, hashIds_(fragenIds)}
    //    LockService würde nur Concurrent-Race-Conditions im selben ms abdecken — hier overkill.
    var cache = CacheService.getScriptCache();
    var lockKey = 'prewarm_' + email + '_' + hashIds_(fragenIds);
    if (cache.get(lockKey)) {
      return jsonResponse({ success: true, deduped: true });
    }
    cache.put(lockKey, '1', 30); // 30s Lock-TTL

    // 4. Bulk-Read pro betroffenem Sheet/Tab (Bundle-E-Helper)
    var byTab = gruppiereFragenIdsNachTab_(fragenIds, gruppeId, fachbereich);
    var fragenAnzahl = 0;
    for (var sheetId in byTab) {
      for (var tab in byTab[sheetId]) {
        var found = bulkLadeFragenAusSheet_(sheetId, tab, byTab[sheetId][tab]);
        fragenAnzahl += Object.keys(found).length;
      }
    }

    var latenzMs = Date.now() - startMs;
    Logger.log('[PreWarmFragen] email=%s n=%s ms=%s', email, fragenIds.length, latenzMs);
    return jsonResponse({ success: true, fragenAnzahl: fragenAnzahl, latenzMs: latenzMs });

  } catch (e) {
    console.log('[PreWarmFragen-Fehler] ' + e.message);
    return jsonResponse({ error: e.message });
  }
}
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

Expected: keine Syntax-Fehler.

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: lernplattformPreWarmFragen-Endpoint"
```

---

## Phase 3: Backend — Trigger D in `speichereAntworten`

Inline-Pre-Warm der Korrektur-Daten nach SuS-Abgabe. Helper `preWarmKorrekturNachAbgabe_` lädt `fragenIds` aus dem `Configs`-Sheet anhand `pruefungId` und ruft `bulkLadeFragenAusSheet_`.

### Task 4: Helper `preWarmKorrekturNachAbgabe_`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — neue Funktion direkt **nach** `lernplattformPreWarmFragen` (siehe Task 3)

- [ ] **Step 1: Helper-Funktion einfügen**

```javascript
/**
 * Bundle G.a Trigger D — Inline-Pre-Warm der Korrektur-Daten nach SuS-Abgabe.
 *
 * Wird aus speichereAntworten im istAbgabe===true-Pfad aufgerufen (try/catch).
 * Liest fragenIds aus Configs-Sheet anhand pruefungId und befüllt CacheService
 * via bulkLadeFragenAusSheet_.
 *
 * Cache-Granularität pro Lobby-Tab: erste Abgabe wärmt den Tab, weitere
 * Abgaben derselben Lobby finden den Tab schon warm (~10 ms statt ~200 ms).
 *
 * @param {string} pruefungId
 * @param {string} susEmail (für Logging)
 */
function preWarmKorrekturNachAbgabe_(pruefungId, susEmail) {
  var startMs = Date.now();
  try {
    // fragenIds aus Configs-Sheet extrahieren (analog speichereAntworten Z.~3052)
    var configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    var configRow = getSheetData(configSheet).find(function(r) { return r.id === pruefungId; });
    if (!configRow) {
      console.log('[PreWarmKorrektur] Config nicht gefunden: ' + pruefungId);
      return;
    }

    // abschnitte ist JSON-String in der Sheet-Spalte
    var abschnitte;
    try {
      abschnitte = JSON.parse(configRow.abschnitte || '[]');
    } catch (e) {
      console.log('[PreWarmKorrektur] abschnitte-Parse-Fehler: ' + e.message);
      return;
    }

    var fragenIds = [];
    for (var i = 0; i < abschnitte.length; i++) {
      var ids = abschnitte[i].fragenIds || abschnitte[i].fragen || [];
      for (var j = 0; j < ids.length; j++) {
        // ids[j] kann String oder {id, ...}-Objekt sein
        var fid = typeof ids[j] === 'string' ? ids[j] : (ids[j] && ids[j].id);
        if (fid) fragenIds.push(fid);
      }
    }

    if (fragenIds.length === 0) {
      console.log('[PreWarmKorrektur] keine fragenIds in pruefung=' + pruefungId);
      return;
    }

    // Bulk-Read pro Tab (Bundle-E-Helper)
    var gruppeId = configRow.klasse || ''; // gruppeId-Heuristik analog ladeFrageUnbereinigtById_
    var fachbereich = (configRow.fachbereiche || '').split(',')[0] || '';
    var byTab = gruppiereFragenIdsNachTab_(fragenIds, gruppeId, fachbereich);
    for (var sheetId in byTab) {
      for (var tab in byTab[sheetId]) {
        bulkLadeFragenAusSheet_(sheetId, tab, byTab[sheetId][tab]);
      }
    }

    var latenzMs = Date.now() - startMs;
    Logger.log('[PreWarmKorrektur] pruefungId=%s sus=%s n=%s ms=%s',
               pruefungId, susEmail, fragenIds.length, latenzMs);

  } catch (e) {
    console.log('[PreWarmKorrektur-Fehler] ' + e.message);
  }
}
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: preWarmKorrekturNachAbgabe_-Helper für Trigger D"
```

### Task 5: Erweiterung `speichereAntworten`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — innerhalb `speichereAntworten` (Z. ~3032)

- [ ] **Step 1: Stelle in `speichereAntworten` finden**

`speichereAntworten` schreibt die Antworten und liefert dann `jsonResponse({success: true})`. Wir suchen die Stelle **direkt vor** dem letzten erfolgreichen `return jsonResponse(...)`-Statement und **nur** wenn `istAbgabe === true` ist.

- [ ] **Step 2: Inline-Aufruf einfügen**

In `speichereAntworten`, direkt vor dem `return jsonResponse({...success...})`-Ausdruck, der die erfolgreiche Abgabe quittiert:

```javascript
    // Bundle G.a Trigger D: Pre-Warm Korrektur-Cache nach SuS-Abgabe (fire-and-forget intern)
    if (istAbgabe === true && !istZugelasseneLP(email)) {
      try {
        preWarmKorrekturNachAbgabe_(pruefungId, email);
      } catch (e) {
        console.log('[Abgabe-PreWarm-Fehler] ' + e.message);
      }
    }

    return jsonResponse({ success: true /* ...bestehende Felder... */ });
```

**Wichtig:**
- Nur bei SuS-Abgabe pre-warmen, nicht bei jedem auto-save. `istAbgabe === true && !istZugelasseneLP(email)`.
- Der try/catch sorgt dafür, dass ein Pre-Warm-Fehler nicht die Abgabe blockiert.
- Der Aufruf ist synchron — ~50-200ms Overhead bei erster Abgabe, ~10ms ab der zweiten (Cache schon warm).

- [ ] **Step 3: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: Trigger D in speichereAntworten istAbgabe-Pfad"
```

---

## Phase 4: Backend — GAS Test-Shims

Drei Test-Shims am Dateiende, mit Public-Wrappern ohne Underscore (S133-Lehre).

### Task 6: Test-Shim `testPreWarmFragen`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — am Ende der Datei, nach den bestehenden Bundle-E-Test-Shims (`testLadeLoesungenLatenzNachBundleE`)

- [ ] **Step 1: Test-Shim schreiben**

```javascript
// ============================================================
// BUNDLE G.A — TEST-SHIMS
// ============================================================

/**
 * Test-Shim für lernplattformPreWarmFragen.
 *
 * Cases:
 *   (a) Cold-Call mit 30 fragenIds einer Prüfung → success, fragenAnzahl > 0
 *   (b) Sofortiger zweiter Call mit identischen fragenIds → deduped: true
 *   (c) Zweiter Call mit anderen fragenIds → kein Lock, neuer Sheet-Read
 *   (d) Auth-Fail (kein Token, keine LP-Domain) → error
 *   (e) Sanity-Check (>200 fragenIds) → error 'Zu viele Fragen'
 */
function testPreWarmFragen_() {
  var assert_ = function(cond, msg) {
    if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  };

  // Setup: Test-LP-Email + valider Pool von fragenIds aus BWL-Tab
  var lpEmail = 'yannick.durand@gymhofwil.ch';
  var gruppeId = ''; // Standard-Gruppe via fachbereich-Hint
  var bwlIds = [];
  // Beziehe 30 valide BWL-IDs aus dem BWL-Tab
  var fragebankSs = SpreadsheetApp.openById(FRAGENBANK_ID);
  var bwlSheet = fragebankSs.getSheetByName('BWL');
  if (bwlSheet) {
    var data = bwlSheet.getRange(2, 1, Math.min(30, bwlSheet.getLastRow() - 1), 1).getValues();
    for (var i = 0; i < data.length; i++) bwlIds.push(String(data[i][0]));
  }
  assert_(bwlIds.length >= 10, 'Brauche >=10 BWL-fragenIds, habe ' + bwlIds.length);

  // Cache-Reset: alte Locks/Cache-Einträge wegputzen
  var cache = CacheService.getScriptCache();
  cache.removeAll(['prewarm_' + lpEmail + '_' + hashIds_(bwlIds)]);

  // (a) Cold-Call
  var r1 = lernplattformPreWarmFragen({
    email: lpEmail, sessionToken: '',
    fragenIds: bwlIds, gruppeId: gruppeId, fachbereich: 'BWL'
  });
  var b1 = JSON.parse(r1.getContent());
  Logger.log('Case (a) Cold: %s', JSON.stringify(b1));
  assert_(b1.success === true, '(a) success');
  assert_(!b1.deduped, '(a) NICHT deduped');
  assert_(b1.fragenAnzahl > 0, '(a) fragenAnzahl > 0');
  assert_(b1.latenzMs < 5000, '(a) latenzMs <5s, war ' + b1.latenzMs);

  // (b) Re-Call sofort → deduped
  var r2 = lernplattformPreWarmFragen({
    email: lpEmail, sessionToken: '',
    fragenIds: bwlIds, gruppeId: gruppeId, fachbereich: 'BWL'
  });
  var b2 = JSON.parse(r2.getContent());
  Logger.log('Case (b) Re-Call: %s', JSON.stringify(b2));
  assert_(b2.success === true, '(b) success');
  assert_(b2.deduped === true, '(b) deduped:true');

  // (c) Andere fragenIds → kein Lock, neuer Sheet-Read
  var anderePool = bwlIds.slice(5, 15); // verschobener Subset = anderer Hash
  cache.removeAll(['prewarm_' + lpEmail + '_' + hashIds_(anderePool)]);
  var r3 = lernplattformPreWarmFragen({
    email: lpEmail, sessionToken: '',
    fragenIds: anderePool, gruppeId: gruppeId, fachbereich: 'BWL'
  });
  var b3 = JSON.parse(r3.getContent());
  Logger.log('Case (c) Andere IDs: %s', JSON.stringify(b3));
  assert_(b3.success === true, '(c) success');
  assert_(!b3.deduped, '(c) NICHT deduped');

  // (d) Auth-Fail (SuS ohne Token)
  var r4 = lernplattformPreWarmFragen({
    email: 'wr.test@stud.gymhofwil.ch', sessionToken: 'invalid-token',
    fragenIds: bwlIds, gruppeId: gruppeId, fachbereich: 'BWL'
  });
  var b4 = JSON.parse(r4.getContent());
  Logger.log('Case (d) Auth-Fail: %s', JSON.stringify(b4));
  assert_(b4.error, '(d) error gesetzt');

  // (e) Sanity-Check
  var rieseIds = [];
  for (var k = 0; k < 250; k++) rieseIds.push('frage_' + k);
  var r5 = lernplattformPreWarmFragen({
    email: lpEmail, sessionToken: '',
    fragenIds: rieseIds, gruppeId: gruppeId, fachbereich: 'BWL'
  });
  var b5 = JSON.parse(r5.getContent());
  Logger.log('Case (e) Sanity: %s', JSON.stringify(b5));
  assert_(b5.error && b5.error.indexOf('200') >= 0, '(e) error mit "200"');

  Logger.log('=== testPreWarmFragen — alle 5 Cases grün ===');
}

/** Public-Wrapper ohne Underscore (S133-Lehre, GAS-Editor-Dropdown-Sichtbarkeit) */
function testPreWarmFragen() { return testPreWarmFragen_(); }
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: GAS-Test-Shim testPreWarmFragen (5 Cases)"
```

### Task 7: Test-Shim `testPreWarmEffekt` — Akzeptanz-Kriterium

**Files:**
- Modify: `ExamLab/apps-script-code.js` — direkt nach `testPreWarmFragen`

- [ ] **Step 1: Test-Shim schreiben**

```javascript
/**
 * Test-Shim für die zentrale Akzeptanz-Frage:
 * Wie viel schneller ist lernplattformLadeLoesungen nach Pre-Warm?
 *
 * N=10 cold-Pfad (Cache-Reset, dann Lade-Call)
 *   vs. N=10 warm-Pfad (Pre-Warm + sofortiger Lade-Call)
 *
 * Akzeptanz-Kriterium: warm-Pfad ≤ 700 ms intern.
 */
function testPreWarmEffekt_() {
  var lpEmail = 'yannick.durand@gymhofwil.ch';
  var gruppeId = '';
  var fachbereich = 'BWL';

  // 10 fragenIds aus BWL-Tab beziehen
  var fragebankSs = SpreadsheetApp.openById(FRAGENBANK_ID);
  var bwlSheet = fragebankSs.getSheetByName('BWL');
  var data = bwlSheet.getRange(2, 1, 10, 1).getValues();
  var fragenIds = [];
  for (var i = 0; i < data.length; i++) fragenIds.push(String(data[i][0]));

  // === COLD ===
  // Cache reset für alle 10 frageIds (per-Frage-Cache + Tab-Cache)
  var cache = CacheService.getScriptCache();
  for (var i = 0; i < fragenIds.length; i++) {
    cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + fragenIds[i]);
  }
  cache.remove('prewarm_' + lpEmail + '_' + hashIds_(fragenIds));

  var coldStart = Date.now();
  var coldResult = lernplattformLadeLoesungen({
    email: lpEmail, sessionToken: '',
    gruppe: { fragebankSheetId: FRAGENBANK_ID, id: 'standard' },
    fragenIds: fragenIds, fachbereich: fachbereich
  });
  var coldMs = Date.now() - coldStart;
  Logger.log('[testPreWarmEffekt] COLD: %s ms', coldMs);

  // === WARM (mit Pre-Warm) ===
  for (var i = 0; i < fragenIds.length; i++) {
    cache.remove('frage_v1_' + FRAGENBANK_ID + '_' + fragenIds[i]);
  }
  cache.remove('prewarm_' + lpEmail + '_' + hashIds_(fragenIds));

  // Pre-Warm
  lernplattformPreWarmFragen({
    email: lpEmail, sessionToken: '',
    fragenIds: fragenIds, gruppeId: gruppeId, fachbereich: fachbereich
  });

  // Sofort Lade-Call
  var warmStart = Date.now();
  var warmResult = lernplattformLadeLoesungen({
    email: lpEmail, sessionToken: '',
    gruppe: { fragebankSheetId: FRAGENBANK_ID, id: 'standard' },
    fragenIds: fragenIds, fachbereich: fachbereich
  });
  var warmMs = Date.now() - warmStart;
  Logger.log('[testPreWarmEffekt] WARM: %s ms', warmMs);

  // === Akzeptanz-Check ===
  var delta = coldMs - warmMs;
  var prozent = Math.round(100 * delta / coldMs);
  Logger.log('[testPreWarmEffekt] DELTA: %s ms (-%s%%)', delta, prozent);
  Logger.log('[testPreWarmEffekt] Akzeptanz warm ≤ 700 ms: %s', warmMs <= 700 ? 'ERFÜLLT' : 'VERFEHLT');
}

function testPreWarmEffekt() { return testPreWarmEffekt_(); }
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: GAS-Test-Shim testPreWarmEffekt (Akzeptanz-Messung)"
```

### Task 8: Test-Shim `testPreWarmKorrekturNachAbgabe`

**Files:**
- Modify: `ExamLab/apps-script-code.js` — direkt nach `testPreWarmEffekt`

- [ ] **Step 1: Test-Shim schreiben**

```javascript
/**
 * Test-Shim für preWarmKorrekturNachAbgabe_ (Trigger D).
 *
 * Cases:
 *   (a) Erste Abgabe einer Lobby → Cache-Befüllung messbar (~50-200 ms)
 *   (b) Zweite Abgabe derselben Lobby → Cache schon warm, Overhead ~10 ms
 */
function testPreWarmKorrekturNachAbgabe_() {
  var assert_ = function(cond, msg) {
    if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  };

  // Setup: existierende Test-Prüfung mit pruefungId aus Configs-Sheet wählen
  var configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
  var configs = getSheetData(configSheet);
  // Erste Test-Prüfung mit nicht-leerer abschnitte-Spalte
  var testConfig = configs.find(function(c) {
    return c.id && c.abschnitte && c.abschnitte.length > 2; // nicht leer "[]"
  });
  assert_(testConfig, 'Brauche eine Test-Prüfung mit abschnitten in Configs-Sheet');

  // Cache-Reset
  var cache = CacheService.getScriptCache();
  // Tab-Cache-Keys nicht direkt rauspflücken — Bundle E nutzt frage_v1_<sheetId>_<frageId>.
  // Wir messen Differenz zwischen 1. und 2. Aufruf, auch wenn vorher etwas im Cache war.

  // (a) Erste Abgabe
  var t1 = Date.now();
  preWarmKorrekturNachAbgabe_(testConfig.id, 'wr.test@stud.gymhofwil.ch');
  var ms1 = Date.now() - t1;
  Logger.log('Case (a) Erste Abgabe: %s ms', ms1);

  // (b) Zweite Abgabe
  var t2 = Date.now();
  preWarmKorrekturNachAbgabe_(testConfig.id, 'wr.test2@stud.gymhofwil.ch');
  var ms2 = Date.now() - t2;
  Logger.log('Case (b) Zweite Abgabe: %s ms (sollte schneller als (a) sein)', ms2);

  // Soft-Assertion: zweite Abgabe sollte deutlich schneller sein (Cache warm)
  Logger.log('Cache-Effekt-Verhältnis: ms2/ms1 = %s%% (Ziel <50%%)',
             Math.round(100 * ms2 / Math.max(ms1, 1)));

  Logger.log('=== testPreWarmKorrekturNachAbgabe — beide Cases gelaufen ===');
}

function testPreWarmKorrekturNachAbgabe() { return testPreWarmKorrekturNachAbgabe_(); }
```

- [ ] **Step 2: Verifizieren via `node --check`**

```bash
cd ExamLab && node --check apps-script-code.js
```

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "ExamLab Bundle G.a: GAS-Test-Shim testPreWarmKorrekturNachAbgabe"
```

---

## Phase 5: Backend-Deploy + GAS-Test-Run (User-Aktion)

### Task 9: User deployt Apps-Script und führt Tests aus

**Files:** keine — User-Aktion im Apps-Script-Editor

- [ ] **Step 1: Code-Owner pingt User**

> "Backend-Phase ist fertig. Bitte:
> 1. Im Apps-Script-Editor: **Bereitstellen → Bereitstellungen verwalten → Neue Version**
> 2. Test-Reihenfolge (wichtig wegen Cache-State zwischen Tests):
>    - Zuerst `testPreWarmEffekt` ausführen + Latenz-Log notieren (Akzeptanz: warm ≤ 700 ms intern). Reset eigener Cache-Keys ist im Test integriert.
>    - Dann `testPreWarmFragen` ausführen — Logs auf alle 5 Cases grün prüfen.
>    - Zuletzt `testPreWarmKorrekturNachAbgabe` ausführen + Logs notieren.
> 3. Bestätigen mit den drei Latenz-Werten"

- [ ] **Step 2: Mess-Werte in Plan dokumentieren**

User liefert die Werte zurück. Format-Vorschlag:

```
testPreWarmFragen:                  alle 5 Cases ✓
testPreWarmEffekt:                  Cold = X ms, Warm = Y ms (-Z%)
testPreWarmKorrekturNachAbgabe:     Erste = A ms, Zweite = B ms
```

- [ ] **Step 3: Bei Misserfolg → Code-Fix-Iteration**

Wenn ein Test fehlschlägt: Code-Owner analysiert Logs, bug-fixt und bittet User um Re-Run.

---

## Phase 6: Frontend — Adapter-Erweiterung `getCachedFragen`

Public-Getter im `AppsScriptFragenAdapter`, damit Trigger B/C den Frontend-Cache lesen können.

### Task 10: Test für `getCachedFragen`

**Files:**
- Create: `ExamLab/src/tests/appsScriptAdapterCache.test.ts`

- [ ] **Step 1: Test schreiben (failing)**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('AppsScriptFragenAdapter.getCachedFragen', () => {
  beforeEach(async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    uebenFragenAdapter.invalidateCache()
  })

  it('liefert undefined wenn Cache leer', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    expect(uebenFragenAdapter.getCachedFragen('demo-gruppe')).toBeUndefined()
  })

  it('liefert Cache-Inhalt nach erfolgreichem ladeFragen', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    await uebenFragenAdapter.ladeFragen('demo-gruppe')
    const cached = uebenFragenAdapter.getCachedFragen('demo-gruppe')
    expect(Array.isArray(cached)).toBe(true)
    expect((cached?.length ?? 0)).toBeGreaterThan(0)
  })

  it('liefert undefined für unbekannte gruppeId', async () => {
    const { uebenFragenAdapter } = await import('../adapters/ueben/appsScriptAdapter')
    await uebenFragenAdapter.ladeFragen('demo-gruppe')
    expect(uebenFragenAdapter.getCachedFragen('andere-gruppe')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/tests/appsScriptAdapterCache.test.ts
```

Expected: FAIL mit "uebenFragenAdapter.getCachedFragen is not a function" oder ähnlich.

### Task 11: Public-Getter implementieren

**Files:**
- Modify: `ExamLab/src/adapters/ueben/appsScriptAdapter.ts` (~Z. 142-206)

- [ ] **Step 1: Methode in der Adapter-Klasse ergänzen**

In der `AppsScriptFragenAdapter`-Klasse, nach `invalidateCache` und vor `getToken`:

```typescript
  /** Bundle G.a — Public-Getter für Pre-Warm-Hooks (Read-Through, kein Backend-Call) */
  getCachedFragen(gruppeId: string): Frage[] | undefined {
    return this.cache.get(gruppeId)
  }
```

- [ ] **Step 2: Test laufen lassen — muss PASS**

```bash
cd ExamLab && npx vitest run src/tests/appsScriptAdapterCache.test.ts
```

Expected: 3/3 passed.

- [ ] **Step 3: tsc -b laufen lassen**

```bash
cd ExamLab && npx tsc -b
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/adapters/ueben/appsScriptAdapter.ts ExamLab/src/tests/appsScriptAdapterCache.test.ts
git commit -m "ExamLab Bundle G.a: getCachedFragen-Public-Getter im Adapter"
```

---

## Phase 7: Frontend — `lastUsedThema` Persistenz

Nach erfolgreichem `starteSession` wird `examlab.lastUsedThema.<gruppeId>.<fach>` in localStorage geschrieben.

### Task 12: Test für `lastUsedThema`-Persistenz

**Files:**
- Create: `ExamLab/src/tests/lastUsedThemaPersistenz.test.ts`

- [ ] **Step 1: Test schreiben (failing)**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn().mockResolvedValue([
      { id: 'f1', fach: 'BWL', thema: 'Unternehmensformen', frage: 'Test', typ: 'mc', schwierigkeit: 1 },
      { id: 'f2', fach: 'BWL', thema: 'Unternehmensformen', frage: 'Test 2', typ: 'mc', schwierigkeit: 1 },
    ]),
  },
}))

vi.mock('./authStore', async () => {
  return {
    useUebenAuthStore: {
      getState: () => ({ user: { email: 'test@test.ch', sessionToken: null } }),
    },
  }
})

describe('lastUsedThema-Persistenz', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('schreibt lastUsedThema nach erfolgreichem starteSession', async () => {
    const { useUebungsStore } = await import('../store/ueben/uebungsStore')
    await useUebungsStore.getState().starteSession(
      'gruppe1', 'test@test.ch', 'BWL', 'Unternehmensformen'
    )

    expect(localStorage.getItem('examlab.lastUsedThema.gruppe1.BWL'))
      .toBe('Unternehmensformen')
  })

  it('schreibt nicht bei leerem Block (modus=mix ohne quellen)', async () => {
    const { useUebungsStore } = await import('../store/ueben/uebungsStore')
    await useUebungsStore.getState().starteSession(
      'gruppe1', 'test@test.ch', 'BWL', 'Mix-Session', undefined, 'mix'
    )

    // Bei mix ohne Quellen-Definition: kein lastUsedThema schreiben
    // (oder: keine Session, weil block leer)
    expect(localStorage.getItem('examlab.lastUsedThema.gruppe1.BWL')).toBeNull()
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/tests/lastUsedThemaPersistenz.test.ts
```

Expected: FAIL — localStorage-Eintrag fehlt.

### Task 13: `lastUsedThema`-Schreiben in `starteSession`

**Files:**
- Modify: `ExamLab/src/store/ueben/uebungsStore.ts` (~Z. 250-260, nach erfolgreichem Session-Start)

- [ ] **Step 1: Code einfügen**

In `starteSession` (uebungsStore.ts ~Z. 184). Die Variable `block: Frage[]` wird in der Funktion auf Z. 205 deklariert und ab Z. 216 mit Inhalt gefüllt. Direkt **nach** dem erfolgreichen Setzen der Session (`set({ session, ladeStatus: 'bereit' })` oder analoger Success-Pfad — exakte Stelle anhand des aktuellen Codes lokalisieren), **vor** dem finalen `return`:

```typescript
      // Bundle G.a — lastUsedThema persistieren für Pre-Warm-Trigger B
      // (block ist die lokale Fragen-Auswahl von Z. 205, nach dem erstelleBlock-Aufruf)
      if (modus === 'standard' && fach && thema && block.length > 0) {
        try {
          localStorage.setItem(
            `examlab.lastUsedThema.${gruppeId}.${fach}`,
            thema,
          )
        } catch {
          // localStorage nicht verfügbar / quota — silently ignore
        }
      }
```

- [ ] **Step 2: Test laufen lassen — muss PASS**

```bash
cd ExamLab && npx vitest run src/tests/lastUsedThemaPersistenz.test.ts
```

Expected: 2/2 passed.

- [ ] **Step 3: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/store/ueben/uebungsStore.ts ExamLab/src/tests/lastUsedThemaPersistenz.test.ts
git commit -m "ExamLab Bundle G.a: lastUsedThema-Persistenz in localStorage"
```

---

## Phase 8: Frontend — `preWarmApi.ts`

API-Wrapper für den `lernplattformPreWarmFragen`-Endpoint mit Kill-Switch und fail-silent Error-Handling.

### Task 14: Test für `preWarmFragen`

**Files:**
- Create: `ExamLab/src/tests/preWarmApi.test.ts`

- [ ] **Step 1: Test schreiben (failing)**

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

const postJsonMock = vi.fn()

vi.mock('../services/ueben/apiClient', () => ({
  uebenApiClient: {
    post: postJsonMock,
  },
}))

describe('preWarmFragen', () => {
  beforeEach(() => {
    postJsonMock.mockReset()
  })

  it('returned Promise<void> auch bei erfolgreichem Call', async () => {
    postJsonMock.mockResolvedValue({ success: true, fragenAnzahl: 10, latenzMs: 150 })
    const { preWarmFragen } = await import('../services/preWarmApi')
    const result = await preWarmFragen(['f1', 'f2'], 'gruppe1', 'BWL')
    expect(result).toBeUndefined()
    expect(postJsonMock).toHaveBeenCalledWith(
      'lernplattformPreWarmFragen',
      expect.objectContaining({ fragenIds: ['f1', 'f2'], gruppeId: 'gruppe1', fachbereich: 'BWL' }),
      expect.anything(),
    )
  })

  it('schluckt Backend-Error silent (fail-silent)', async () => {
    postJsonMock.mockResolvedValue({ error: 'Nicht autorisiert' })
    const { preWarmFragen } = await import('../services/preWarmApi')
    await expect(preWarmFragen(['f1'], 'gruppe1', 'BWL')).resolves.toBeUndefined()
  })

  it('schluckt Network-Error silent', async () => {
    postJsonMock.mockRejectedValue(new Error('network'))
    const { preWarmFragen } = await import('../services/preWarmApi')
    await expect(preWarmFragen(['f1'], 'gruppe1', 'BWL')).resolves.toBeUndefined()
  })

  it('macht keinen Call wenn fragenIds leer', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    await preWarmFragen([], 'gruppe1', 'BWL')
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('macht keinen Call wenn signal bereits aborted', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    const abortController = new AbortController()
    abortController.abort()
    await preWarmFragen(['f1'], 'gruppe1', 'BWL', abortController.signal)
    expect(postJsonMock).not.toHaveBeenCalled()
  })

  it('macht keinen Call wenn gruppeId leer', async () => {
    const { preWarmFragen } = await import('../services/preWarmApi')
    await preWarmFragen(['f1'], '', 'BWL')
    expect(postJsonMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/tests/preWarmApi.test.ts
```

Expected: FAIL — Modul existiert noch nicht.

### Task 15: API-Wrapper implementieren

**Files:**
- Create: `ExamLab/src/services/preWarmApi.ts`

- [ ] **Step 1: Datei anlegen**

```typescript
import { uebenApiClient } from './ueben/apiClient'
import { useUebenAuthStore } from '../store/ueben/authStore'

/**
 * Bundle G.a — Kill-Switch.
 * Bei Production-Issues auf `false` setzen + Frontend-Deploy.
 */
export const PRE_WARM_ENABLED = true

interface PreWarmResponse {
  success?: boolean
  deduped?: boolean
  fragenAnzahl?: number
  latenzMs?: number
  error?: string
}

/**
 * Pre-Warm den Apps-Script-CacheService für eine Liste von fragenIds.
 *
 * Fire-and-forget: returnt Promise<void>, wirft NIE — Fehler werden silent geswallowed.
 * Wenn `signal.aborted` bei Eintritt: kein API-Call.
 * Wenn `fragenIds` leer: kein API-Call.
 * Wenn `PRE_WARM_ENABLED` false: kein API-Call.
 *
 * Backend-Endpoint: `lernplattformPreWarmFragen`.
 */
export async function preWarmFragen(
  fragenIds: string[],
  gruppeId: string,
  fachbereich?: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!PRE_WARM_ENABLED) return
  if (signal?.aborted) return
  if (!Array.isArray(fragenIds) || fragenIds.length === 0) return
  if (!gruppeId) return

  try {
    const user = useUebenAuthStore.getState().user
    const email = user?.email ?? ''
    const sessionToken = user?.sessionToken ?? ''

    const response = await uebenApiClient.post<PreWarmResponse>(
      'lernplattformPreWarmFragen',
      { email, sessionToken, fragenIds, gruppeId, fachbereich },
      sessionToken,
    )
    if (response?.error) {
      // Sicherheitsnetz: bei error trotzdem silent swallow (fail-silent)
      console.warn('[preWarmFragen] Backend-Error:', response.error)
    }
  } catch (e) {
    console.warn('[preWarmFragen] Fehler (silent):', e)
  }
}
```

- [ ] **Step 2: Test laufen lassen — muss PASS**

```bash
cd ExamLab && npx vitest run src/tests/preWarmApi.test.ts
```

Expected: 6/6 passed.

- [ ] **Step 3: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/services/preWarmApi.ts ExamLab/src/tests/preWarmApi.test.ts
git commit -m "ExamLab Bundle G.a: preWarmApi.ts API-Wrapper mit Kill-Switch"
```

---

## Phase 9: Frontend — `usePreWarm`-Hook

Generischer fire-and-forget-Hook mit AbortController + 5s Network-Timeout.

### Task 16: Test für `usePreWarm`

**Files:**
- Create: `ExamLab/src/tests/usePreWarm.test.ts`

- [ ] **Step 1: Test schreiben (failing)**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('usePreWarm', () => {
  let apiCallMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    apiCallMock = vi.fn().mockResolvedValue(undefined)
  })

  it('feuert apiCall bei Mount', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    renderHook(() => usePreWarm(apiCallMock, ['dep']))
    expect(apiCallMock).toHaveBeenCalledTimes(1)
  })

  it('übergibt AbortSignal an apiCall', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    renderHook(() => usePreWarm(apiCallMock, ['dep']))
    expect(apiCallMock.mock.calls[0][0]).toBeInstanceOf(AbortSignal)
  })

  it('feuert AbortSignal bei Unmount', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { unmount } = renderHook(() => usePreWarm(apiCallMock, ['dep']))
    const signal = apiCallMock.mock.calls[0][0] as AbortSignal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('re-feuert bei Dep-Change', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { rerender } = renderHook(
      ({ dep }) => usePreWarm(apiCallMock, [dep]),
      { initialProps: { dep: 'a' } },
    )
    expect(apiCallMock).toHaveBeenCalledTimes(1)
    rerender({ dep: 'b' })
    expect(apiCallMock).toHaveBeenCalledTimes(2)
  })

  it('cancelt vorherigen Call bei Dep-Change', async () => {
    const { usePreWarm } = await import('../hooks/usePreWarm')
    const { rerender } = renderHook(
      ({ dep }) => usePreWarm(apiCallMock, [dep]),
      { initialProps: { dep: 'a' } },
    )
    const signalA = apiCallMock.mock.calls[0][0] as AbortSignal
    rerender({ dep: 'b' })
    expect(signalA.aborted).toBe(true)
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/tests/usePreWarm.test.ts
```

Expected: FAIL — Modul existiert noch nicht.

### Task 17: Hook implementieren

**Files:**
- Create: `ExamLab/src/hooks/usePreWarm.ts`

- [ ] **Step 1: Hook schreiben**

```typescript
import { useEffect, useRef } from 'react'

const NETWORK_TIMEOUT_MS = 5_000

/**
 * Bundle G.a — Generischer fire-and-forget Pre-Warm-Hook.
 *
 * Feuert `apiCall(signal)` bei Mount und bei jedem Dep-Change.
 * Bei Unmount oder Dep-Change: AbortController feuert auf den vorherigen Call.
 * Network-Timeout: 5 s (eigener `setTimeout`, der signal abortet).
 *
 * Verwendung:
 *   usePreWarm(
 *     (signal) => preWarmFragen(fragenIds, gruppeId, 'BWL', signal),
 *     [aktivesFach, lastUsedThema]
 *   )
 */
export function usePreWarm(
  apiCall: (signal: AbortSignal) => Promise<void>,
  deps: React.DependencyList,
): void {
  // Vermeide Stale-Closure: apiCall in Ref halten
  const apiCallRef = useRef(apiCall)
  apiCallRef.current = apiCall

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)

    void apiCallRef.current(controller.signal).finally(() => {
      clearTimeout(timeoutId)
    })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
```

- [ ] **Step 2: Test laufen lassen — muss PASS**

```bash
cd ExamLab && npx vitest run src/tests/usePreWarm.test.ts
```

Expected: 5/5 passed.

- [ ] **Step 3: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/hooks/usePreWarm.ts ExamLab/src/tests/usePreWarm.test.ts
git commit -m "ExamLab Bundle G.a: usePreWarm-Hook mit AbortController + 5s-Timeout"
```

---

## Phase 10: Frontend — `useDebouncedHover`-Hook

300-ms-Debounce-Hook für Trigger C (SuS hovert auf Themen-Card).

### Task 18: Test für `useDebouncedHover`

**Files:**
- Create: `ExamLab/src/tests/useDebouncedHover.test.ts`

- [ ] **Step 1: Test schreiben (failing)**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('useDebouncedHover', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('feuert callback NACH 300ms onMouseEnter', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    expect(callback).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(299) })
    expect(callback).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(1) })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancelt callback wenn Mouse vor 300ms leaved', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    await act(async () => { vi.advanceTimersByTime(200) })
    act(() => result.current.onMouseLeave())
    await act(async () => { vi.advanceTimersByTime(500) })

    expect(callback).not.toHaveBeenCalled()
  })

  it('feuert nicht erneut wenn onMouseEnter mehrfach gerufen', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    act(() => result.current.onMouseEnter()) // Re-Enter darf Timer nicht zurücksetzen ODER nicht doppelt feuern
    await act(async () => { vi.advanceTimersByTime(300) })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancelt Timer bei Unmount', async () => {
    const callback = vi.fn()
    const { useDebouncedHover } = await import('../hooks/useDebouncedHover')
    const { result, unmount } = renderHook(() => useDebouncedHover(300, callback))

    act(() => result.current.onMouseEnter())
    unmount()
    await act(async () => { vi.advanceTimersByTime(500) })

    expect(callback).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss FAIL**

```bash
cd ExamLab && npx vitest run src/tests/useDebouncedHover.test.ts
```

Expected: FAIL — Modul existiert noch nicht.

### Task 19: Hook implementieren

**Files:**
- Create: `ExamLab/src/hooks/useDebouncedHover.ts`

- [ ] **Step 1: Hook schreiben**

```typescript
import { useEffect, useRef, useCallback } from 'react'

/**
 * Bundle G.a — Hover-Hook mit Debounce.
 *
 * Liefert `onMouseEnter` + `onMouseLeave`-Handler. `callback` wird `delayMs`
 * nach `onMouseEnter` ausgelöst, sofern `onMouseLeave` nicht vorher feuert.
 * Re-Enter während laufendem Timer: kein erneutes Feuern.
 *
 * Verwendung in einem JSX-Element:
 *   const hover = useDebouncedHover(300, () => preWarmFragen(...))
 *   <div onMouseEnter={hover.onMouseEnter} onMouseLeave={hover.onMouseLeave}>
 */
export function useDebouncedHover(
  delayMs: number,
  callback: () => void,
): { onMouseEnter: () => void; onMouseLeave: () => void } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const onMouseEnter = useCallback(() => {
    if (timerRef.current !== null) return // bereits aktiv → nicht zurücksetzen
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      callbackRef.current()
    }, delayMs)
  }, [delayMs])

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return { onMouseEnter, onMouseLeave }
}
```

- [ ] **Step 2: Test laufen lassen — muss PASS**

```bash
cd ExamLab && npx vitest run src/tests/useDebouncedHover.test.ts
```

Expected: 4/4 passed.

- [ ] **Step 3: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/hooks/useDebouncedHover.ts ExamLab/src/tests/useDebouncedHover.test.ts
git commit -m "ExamLab Bundle G.a: useDebouncedHover-Hook 300ms Debounce"
```

---

## Phase 11: Frontend Trigger A — `PruefungsComposer.tsx`

LP speichert eine Prüfung → Pre-Warm der `fragenIds` aus `config.abschnitte`.

### Task 20: Trigger A integrieren

**Files:**
- Modify: `ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx` (~Z. 264, nach erfolgreichem `apiService.speichereConfig`)

- [ ] **Step 1: Import ergänzen**

Ganz oben in der Datei, bei den anderen Imports:

```typescript
import { preWarmFragen } from '../../../services/preWarmApi'
```

- [ ] **Step 2: Pre-Warm-Aufruf nach `speichereConfig`-Erfolg**

In der `handleSpeichernIntern`-Funktion, **nach** `setPruefung(zuSpeichern)` und **vor** `return ok` (im `if (ok) {}`-Block):

```typescript
      const ok = await apiService.speichereConfig(user!.email, zuSpeichern)
      if (ok) {
        setPruefung(zuSpeichern)
        vorherigePruefungRef.current = JSON.stringify(zuSpeichern)

        // Bundle G.a Trigger A: Pre-Warm der fragenIds dieser Prüfung
        const fragenIds = (zuSpeichern.abschnitte ?? [])
          .flatMap((a) => a.fragenIds ?? [])
          .filter((id): id is string => typeof id === 'string')
        if (fragenIds.length > 0 && zuSpeichern.klasse) {
          const fachbereich = (zuSpeichern.fachbereiche ?? [])[0]
          void preWarmFragen(fragenIds, zuSpeichern.klasse, fachbereich)
        }
      }
      return ok
```

**Wichtig:**
- `void` vor dem Promise-Aufruf — Pre-Warm ist fire-and-forget, wir warten nicht
- `klasse` als gruppeId nutzen (bestehende Konvention im Codebase)
- `fachbereiche[0]` als Hint (Prüfung kann mehrere haben, aber meist nur eines)

- [ ] **Step 3: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

Expected: clean. (Falls TS-Errors zu `abschnitte`-Typ: pruefen ob `a.fragenIds` korrekt typisiert ist; ggf. via `any`-Zwischenschritt entlasten — KEIN neues `as any` einführen ohne Begründung.)

- [ ] **Step 4: Commit**

```bash
git add ExamLab/src/components/lp/vorbereitung/PruefungsComposer.tsx
git commit -m "ExamLab Bundle G.a: Trigger A — Pre-Warm nach speichereConfig"
```

---

## Phase 12: Frontend Trigger B — `Dashboard.tsx`

SuS klickt Fach-Tab → Pre-Warm `lastUsedThema` für dieses Fach.

### Task 21: Trigger B integrieren

**Files:**
- Modify: `ExamLab/src/components/ueben/Dashboard.tsx` (~Z. 522, im Fach-Tab-Click-Handler)

- [ ] **Step 1: Imports ergänzen**

Bei den bestehenden Imports oben ergänzen:

```typescript
import { preWarmFragen } from '../../services/preWarmApi'
import { uebenFragenAdapter } from '../../adapters/ueben/appsScriptAdapter'
```

- [ ] **Step 2: Helper-Funktion definieren**

Innerhalb der `Dashboard`-Komponente, **vor** dem Return-Statement (nach den anderen lokalen Funktionen):

```typescript
  // Bundle G.a Trigger B/C: Hilfsfunktion für Pre-Warm via Frontend-Cache-Filter
  const preWarmThema = (fach: string, thema: string): void => {
    const gruppeId = aktiveGruppe?.id
    if (!gruppeId) return
    const cached = uebenFragenAdapter.getCachedFragen(gruppeId)
    if (!cached) return
    const fragenIds = cached
      .filter((f) => f.fach === fach && f.thema === thema)
      .map((f) => f.id)
    if (fragenIds.length > 0) {
      void preWarmFragen(fragenIds, gruppeId, fach)
    }
  }
```

**Verifiziert** (Code-Read 2026-04-26): In `Dashboard.tsx:60` wird `aktiveGruppe` via `useUebenGruppenStore()` bezogen, das ist ein Objekt mit `.id`-Feld. Daher `aktiveGruppe?.id` (Optional Chaining wegen möglichem `null`).

- [ ] **Step 3: Trigger im Fach-Tab-Click**

Den bestehenden Fach-Tab-Button (Z. 522) erweitern:

```tsx
              {verfuegbareFaecher.map(fach => {
                const farbe = getFachFarbe(fach, fachFarben)
                return (
                  <button
                    key={fach}
                    onClick={() => {
                      const wirdAktiv = aktiverFach !== fach
                      setAktiverFach(wirdAktiv ? fach : null)
                      if (wirdAktiv && aktiveGruppe?.id) {
                        // Bundle G.a Trigger B
                        const gid = aktiveGruppe.id
                        const lastUsed = (() => {
                          try {
                            return localStorage.getItem(`examlab.lastUsedThema.${gid}.${fach}`)
                          } catch {
                            return null
                          }
                        })()
                        if (lastUsed) preWarmThema(fach, lastUsed)
                      }
                    }}
                    className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors"
                    style={...}
                  >
                    {fach}
                  </button>
                )
              })}
```

- [ ] **Step 4: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 5: Commit**

```bash
git add ExamLab/src/components/ueben/Dashboard.tsx
git commit -m "ExamLab Bundle G.a: Trigger B — Pre-Warm bei Fach-Tab-Click"
```

---

## Phase 13: Frontend Trigger C — `ThemaKarte.tsx`

SuS hovert >300 ms auf Themen-Card → Pre-Warm dieses Themas.

### Task 22: Trigger C integrieren

**Files:**
- Modify: `ExamLab/src/components/ueben/ThemaKarte.tsx` (Props um `onMouseEnter`/`onMouseLeave` erweitern)
- Create: `ExamLab/src/components/ueben/ThemaKarteMitPreWarm.tsx` (Wrapper-Komponente, hostet den `useDebouncedHover`-Hook außerhalb der `.map`)
- Modify: `ExamLab/src/components/ueben/Dashboard.tsx` (alle `<ThemaKarte>`-Verwendungen auf Wrapper umstellen)

- [ ] **Step 1: ThemaKarte-Props um Hover-Handler erweitern**

In `ExamLab/src/components/ueben/ThemaKarte.tsx`:

```typescript
interface ThemaKarteProps {
  thema: string
  fach: string
  // ... bestehende Props
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function ThemaKarte({
  thema, fach, onClick,
  onMouseEnter, onMouseLeave,
  // ... bestehende Props
}: ThemaKarteProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={...}
    >
      {/* ... bestehender Inhalt ... */}
    </div>
  )
}
```

(Genaue Komponenten-Struktur via Code-Read im Plan-Phase nochmal verifizieren — falls die Karte ein `<button>` oder `<article>` ist statt `<div>`, entsprechend anpassen.)

- [ ] **Step 2: Hover-Handler in Dashboard verkabeln**

In `ExamLab/src/components/ueben/Dashboard.tsx`, beim Rendern der `<ThemaKarte>` (alle 4 Stellen — Z. 568, 614, 642, evtl. mehr):

Innerhalb der Map-Funktion, vor dem `<ThemaKarte>`-Aufruf:

```tsx
{themen.map(info => {
  const hover = useDebouncedHover(300, () => preWarmThema(info.fach, info.thema))
  return (
    <ThemaKarte
      key={`${info.fach}-${info.thema}`}
      thema={info.thema}
      fach={info.fach}
      // ... bestehende Props
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
    />
  )
})}
```

**Wichtig — Hooks-Regel:** `useDebouncedHover` darf **nicht** direkt in der `.map()`-Schleife aufgerufen werden — die Hook-Aufruf-Reihenfolge muss zwischen Re-Renders identisch bleiben, was bei wechselnder Themen-Anzahl bricht.

**Lösung — neue Datei `ExamLab/src/components/ueben/ThemaKarteMitPreWarm.tsx`:**

```tsx
import type { ComponentProps } from 'react'
import { ThemaKarte } from './ThemaKarte'
import { useDebouncedHover } from '../../hooks/useDebouncedHover'

type ThemaKarteProps = ComponentProps<typeof ThemaKarte>

interface Props extends Omit<ThemaKarteProps, 'onMouseEnter' | 'onMouseLeave'> {
  onPreWarm: () => void
}

/**
 * Bundle G.a — Wrapper für ThemaKarte, der useDebouncedHover hostet.
 * Vermeidet Hook-Aufruf in `.map()`-Schleifen (Hooks-Regel-Verletzung).
 */
export function ThemaKarteMitPreWarm({ onPreWarm, ...rest }: Props) {
  const hover = useDebouncedHover(300, onPreWarm)
  return (
    <ThemaKarte
      {...rest}
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
    />
  )
}
```

Dann in `Dashboard.tsx` an allen 4 `<ThemaKarte>`-Verwendungsstellen (Z. ~568, ~614, ~642 + ggf. weitere) ersetzen:

```tsx
{themen.map(info => (
  <ThemaKarteMitPreWarm
    key={`${info.fach}-${info.thema}`}
    thema={info.thema}
    fach={info.fach}
    /* ... weitere bisherige ThemaKarte-Props 1:1 weiterreichen ... */
    onPreWarm={() => preWarmThema(info.fach, info.thema)}
  />
))}
```

**Hinweis:** `ComponentProps<typeof ThemaKarte>` zieht den Props-Typ direkt aus der Komponente — kein Duplizieren der Felder.

- [ ] **Step 3: Imports ergänzen**

In `Dashboard.tsx`:

```typescript
import { useDebouncedHover } from '../../hooks/useDebouncedHover'
```

- [ ] **Step 4: tsc -b**

```bash
cd ExamLab && npx tsc -b
```

- [ ] **Step 5: vitest gesamtsuite (Regressions-Check)**

```bash
cd ExamLab && npx vitest run
```

Expected: alle Tests grün (684 bestehend + ~30 neue).

- [ ] **Step 6: Commit**

```bash
git add ExamLab/src/components/ueben/Dashboard.tsx ExamLab/src/components/ueben/ThemaKarte.tsx
git commit -m "ExamLab Bundle G.a: Trigger C — Hover-Pre-Warm via useDebouncedHover"
```

---

## Phase 14: Build + Code-Review-Check

### Task 23: Lokaler Build

**Files:** keine (nur Build-Verifikation)

- [ ] **Step 1: Production-Build ausführen**

```bash
cd ExamLab && npm run build
```

Expected: erfolgreich, keine Errors.

- [ ] **Step 2: Bundle-Grösse-Check**

Build-Output dovumentieren — `dist/assets/index-*.js`-Grösse vergleichen mit pre-Bundle-G-Stand. Erwartung: <5 KB Zuwachs (3 kleine Hooks + 1 API-Wrapper).

---

## Phase 15: Browser-E2E auf preview-Branch

### Task 24: Branch nach `origin/preview` pushen

**Files:** keine

- [ ] **Step 1: Force-Push auf preview**

⚠️ **Vor Force-Push:** S113-Lehre durchgehen — `git log preview ^feature/bundle-g-a-prewarming` prüfen ob auf preview was Wichtiges hängt.

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git log origin/preview ^feature/bundle-g-a-prewarming --oneline | head -20
```

Falls Output leer: safe to force-push. Falls Output Commits zeigt, **nicht** force-pushen — User fragen.

```bash
git push origin feature/bundle-g-a-prewarming:preview --force-with-lease
```

GitHub Actions deployt nach ~2-3 Min.

### Task 25: Test-Plan + Browser-E2E mit echten Logins

**Files:** keine — Browser-Test-Sitzung

- [ ] **Step 1: Test-Plan im Chat dokumentieren**

```markdown
## Test-Plan: Bundle G.a Server-Cache-Pre-Warming

### Echte Logins (KEIN Demo-Modus)
- LP: yannick.durand@gymhofwil.ch
- SuS-1: wr.test@stud.gymhofwil.ch

### Pfade
| # | Aktion | Erwartung |
|---|---|---|
| 1 | LP speichert neue BWL-Prüfung mit 10 Fragen | Network-Tab: `lernplattformPreWarmFragen` direkt nach `speichereConfig` |
| 2 | LP wartet 30 s | Stackdriver: `[PreWarmFragen] email=yannick... n=10 ms=...` |
| 3 | LP schaltet live | LP-Workflow funktioniert weiter normal |
| 4 | SuS startet Übung | Stoppuhr "Klick → Frage 1 sichtbar" — ZIEL ≤ 2.5 s |
| 5 | SuS klickt BWL-Tab in Üben-Übersicht (mit lastUsedThema vorhanden) | Network-Tab: `lernplattformPreWarmFragen`-Call |
| 6 | SuS hovert auf 5 verschiedenen Themen-Cards (>300ms) | 5 Network-Calls, alle `success:true` |
| 7 | SuS hovert kurz (<300ms) auf Cards | 0 Network-Calls |
| 8 | SuS hovert dieselbe Card 3× | 1. Call success, 2./3. `deduped:true` |
| 9 | SuS gibt Übung ab (`istAbgabe:true`) | Stackdriver: `[PreWarmKorrektur]` nach `speichereAntworten` |
| 10 | LP öffnet Korrektur-Dashboard für diese Lobby | Spürbar schneller als ohne Pre-Warm-Abgabe |

### Security-Check für diese Änderung
- [ ] Pre-Warm exponiert keine Lösungen (nur Cache-Befüllung server-seitig — verifiziert in Spec)
- [ ] LP-Token-Bypass möglich? Nein — `istZugelasseneLP(email)` prüft Domain
- [ ] SuS kann fremde Lobbies pre-warmen? Egal — Endpoint exponiert nichts, Cache wird nur befüllt (kein Read durch unbefugten User)
- [ ] Sanity-Check >200 fragenIds blockiert? Ja — Test-Shim Case (e) verifiziert

### Betroffene kritische Pfade (aus regression-prevention.md §1.3)
- [ ] SuS lädt Prüfung — sollte unverändert sein, nur schneller
- [ ] SuS Heartbeat + Auto-Save — unverändert
- [ ] SuS Abgabe — Latenz +50-200ms beim ersten SuS pro Lobby (akzeptabel)
- [ ] LP Korrektur + Auto-Korrektur — sollte spürbar schneller sein

### Regressions-Tests
- [ ] Bundle E-Latenzen unverändert: cold ≤ 1'200 ms intern, warm ≤ 250 ms intern
- [ ] Demo-Modus weiterhin funktional (Pre-Warm-Calls sollten 'demo-gruppe' richtig handhaben)
- [ ] PWA-Offline-Modus: Pre-Warm-Fehler darf nicht blockieren
```

- [ ] **Step 2: Tab-Gruppe für Browser-Test erstellen**

User-Aktion: Claude erstellt Tab-Gruppe via `tabs_context_mcp`. User gibt 2 Tabs in die Gruppe und loggt ein:
- Tab 1: LP via Google-OAuth
- Tab 2: SuS via Code-Login (`wr.test@stud.gymhofwil.ch`)

User meldet "kannst loslegen" → Claude testet gemäss Test-Plan.

- [ ] **Step 3: Test durchführen + Screenshots**

Pro Test-Punkt: Network-Tab + ggf. Stackdriver-Auszug + Screenshot. Latenz-Stoppuhr (Test-Punkt 4) im Chat dokumentieren.

- [ ] **Step 4: Mess-Werte konsolidieren**

```
testPreWarmFragen (intern, GAS):    alle 5 Cases ✓
testPreWarmEffekt (intern):         Cold = X ms, Warm = Y ms (-Z%)
Browser-Stoppuhr SuS-Übungsstart:   ~A s spürbar (Ziel ≤ 2.5 s)
Bundle-E-Latenzen Regressions-Check: Cold = ... ms, Warm = ... ms
```

---

## Phase 16: HANDOFF + Merge

### Task 26: HANDOFF.md aktualisieren

**Files:**
- Modify: `ExamLab/HANDOFF.md`

- [ ] **Step 1: Bundle-G.a-Sektion oben einfügen**

Über die bestehende S146-Bundle-E-Sektion (analog zum bisherigen Style):

```markdown
### Aktueller Stand (S147, [DATUM]) — Bundle G.a (Server-Cache-Pre-Warming) auf `feature/bundle-g-a-prewarming`, merge-bereit

**Was Bundle G.a macht:** Apps-Script-`CacheService` proaktiv vorwärmen entlang vier Workflow-Trigger.

**Trigger:**
- A: LP speichert Prüfung → Pre-Warm fragenIds aus `config.abschnitte`
- B: SuS klickt Fach-Tab → Pre-Warm `lastUsedThema`
- C: SuS hovert >300ms auf Themen-Card → Pre-Warm dieses Themas
- D: SuS gibt ab (`istAbgabe:true`) → Inline-Pre-Warm der Korrektur in `speichereAntworten`

**Änderungen:**
- Backend (`apps-script-code.js`): neuer Endpoint `lernplattformPreWarmFragen`, neuer Helper `hashIds_`, Erweiterung `speichereAntworten`, Helper `preWarmKorrekturNachAbgabe_`, 3 GAS-Test-Shims
- Frontend: neue Module `services/preWarmApi.ts`, `hooks/usePreWarm.ts`, `hooks/useDebouncedHover.ts`. `appsScriptAdapter` bekommt `getCachedFragen`-Public-Getter. `uebungsStore.starteSession` schreibt `lastUsedThema` in localStorage.
- Drei Frontend-Call-Sites: `PruefungsComposer.tsx` (A), `Dashboard.tsx` (B), `Dashboard.tsx` + neue Wrapper-Komponente `ThemaKarteMitPreWarm` (C)

**Mess-Werte (GAS-intern, S147):**
- `testPreWarmEffekt` Cold-Pfad: X ms
- `testPreWarmEffekt` Warm-Pfad nach Pre-Warm: Y ms (Akzeptanz ≤ 700 ms: ERFÜLLT/VERFEHLT)
- Browser-Stoppuhr SuS-Übungsstart: ~A s spürbar (vorher ~3-4 s nach Bundle E)

**Test-Stand:**
- 3/3 GAS-Test-Shims grün (8 Cases insgesamt)
- 684 + ~30 neue vitest grün
- `tsc -b` clean
- `npm run build` success
- Apps-Script: ✅ live deployed ([DATUM])

**Browser-E2E (echte Logins, [DATUM]):**
- LP `yannick.durand@gymhofwil.ch` + SuS `wr.test@stud.gymhofwil.ch`
- Alle 10 Test-Punkte aus Test-Plan grün
- API-Vertrag bestätigt: Bundle-E-Pfad unverändert

**Commits auf `feature/bundle-g-a-prewarming`:** [N] Commits ([Hash-1] Spec → [Hash-N] HANDOFF). Merge folgt direkt nach diesem HANDOFF-Commit.

**Was Bundle G.a NICHT enthält (→ G.b/G.c):** Editor/Korrektur-Prev-Next, Material-iframe-Prefetch, Frontend-Memory-Pre-Fetch der Frage-Stammdaten.
```

- [ ] **Step 2: Commit**

```bash
git add ExamLab/HANDOFF.md
git commit -m "ExamLab Bundle G.a: HANDOFF S147 mit Mess-Werten + Browser-E2E"
```

### Task 27: User-Freigabe einholen

**Files:** keine

- [ ] **Step 1: Code-Owner pingt User**

> "Bundle G.a auf `feature/bundle-g-a-prewarming` ist test-grün und Browser-E2E bestätigt. Mess-Werte:
> - testPreWarmEffekt warm: Y ms (Akzeptanz ≤700ms: ERFÜLLT/VERFEHLT)
> - Browser SuS-Übungsstart: ~A s spürbar
> - Alle 10 E2E-Test-Punkte grün
>
> Bereit für Merge auf `main`?"

User antwortet mit "Merge OK" / "Freigabe" / Änderungswunsch.

### Task 28: Merge auf main

**Files:** keine

- [ ] **Step 1: Merge nach `main`**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff feature/bundle-g-a-prewarming -m "Merge feature/bundle-g-a-prewarming: Bundle G.a Server-Cache-Pre-Warming S147"
```

- [ ] **Step 2: Push**

```bash
git push origin main
```

GitHub Actions deployt nach ~2-3 Min.

- [ ] **Step 3: Branch löschen**

```bash
git branch -d feature/bundle-g-a-prewarming
git push origin --delete feature/bundle-g-a-prewarming  # falls remote-Branch existiert
```

### Task 29: Memory aktualisieren

**Files:**
- Create: `/Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/project_s147_bundle_ga.md`
- Modify: MEMORY.md (Index-Eintrag ergänzen)

- [ ] **Step 1: Memory-File für S147 anlegen**

Format analog zu `project_s146_bundle_e.md`. Inhalt:
- Was Bundle G.a auf main gemergt hat
- Mess-Werte (Cold vs. Warm)
- Lehren (z.B. Hover-Hook-Pattern für `.map()`-Schleifen via Wrapper-Komponente)
- Verweis auf Spec + Plan

- [ ] **Step 2: MEMORY.md-Index ergänzen**

```markdown
- **[S147 Bundle G.a auf main](project_s147_bundle_ga.md)** — Server-Cache-Pre-Warming, 4 Trigger (LP-Speichern, SuS-Fach-Tab, SuS-Hover, SuS-Abgabe). Spürbar ~3-4s → ~A s. Merge `[Hash]`.
```

---

## Phase 17: Apps-Script-Cache-Cleanup (User-Aktion, optional)

Falls bei Phase 5 Test-Run Cache-Lock-Einträge übrig blieben (`prewarm_*`-Keys):

### Task 30: Cache-Cleanup-Helper

**Files:**
- Modify: `ExamLab/apps-script-code.js` — temporärer Helper am Dateiende (vor Merge wieder löschen oder als Test-Util drin lassen)

```javascript
/** Bundle G.a — Cache-Cleanup für stale prewarm_*-Lock-Einträge (Debugging) */
function cleanupPreWarmLocks() {
  // CacheService bietet kein listKeys — wir können nur konkret löschen.
  // Falls nötig: Logger.log mit Test-Email + Hash für gezieltes Cleanup.
  Logger.log('CacheService bietet kein listKeys. Lock-TTL ist 30s — automatisches Cleanup.');
}
```

Ohne weitere Aktionen — Locks laufen nach 30 s automatisch ab.

---

## Akzeptanz-Kriterien-Checkliste (am Ende)

- [ ] `testPreWarmEffekt` warm-Pfad ≤ 700 ms intern (Hard-Stop ≤ 800 ms)
- [ ] Browser-Stoppuhr SuS-Übungsstart ≤ 2.5 s
- [ ] Bundle-E-Latenzen unverändert (Cold ≤ 1'200 ms intern, Warm ≤ 250 ms intern)
- [ ] Abgabe-Latenz mit Trigger D erste Abgabe ≤ +250 ms (Hard-Stop)
- [ ] Abgabe-Latenz mit Trigger D n-te Abgabe ≤ +30 ms
- [ ] Alle 8 GAS-Test-Cases grün
- [ ] 684 + ~30 vitest grün
- [ ] `tsc -b` clean
- [ ] `npm run build` success
- [ ] Browser-E2E 10/10 grün
- [ ] LP-Freigabe + Merge erfolgt
- [ ] HANDOFF.md aktualisiert
- [ ] Memory-File angelegt

---

## Geschätzter Aufwand

- Backend (Phase 1-4 + Test-Shims): ~4 Tasks à 5-15 min = ~30-60 min
- User-Aktion Apps-Script-Deploy + Test-Run: ~10-15 min User-Zeit
- Frontend (Phase 6-13): ~9 Tasks à 10-20 min = ~90-180 min
- Browser-E2E Phase 15: ~30-45 min
- Merge + HANDOFF Phase 16-17: ~15 min

**Gesamt: ~3-5 h Arbeitszeit, plus User-Wartezeit für Apps-Script-Tests.**

Realistisch: 1-2 Implementations-Sessions analog Bundle E (S146 hatte 11 Commits in 1 Session).
