# KI-Kalibrierung durch LP-Korrekturen — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editor- und Korrektur-KI-Vorschläge lernen pro LP aus vergangenen Korrekturen, injiziert als Few-Shot-Beispiele in Folge-Prompts.

**Architecture:** Zentrales `KIFeedback`-Sheet, Apps-Script-Backend serialisiert Paare (KI-Output ↔ LP-Endversion), holt bei jedem KI-Call relevante Beispiele (Recency, LP-Scope, Aktions-/Fachbereich-Filter), baut Few-Shot-Block vor den User-Prompt. Frontend-Hook erweitert um `offeneKIFeedbacks`-Lifecycle; neuer Settings-Tab mit 3 Sub-Tabs für Review/Statistik/Einstellungen.

**Tech Stack:** Apps Script (Backend + Sheets) · React 19 + TypeScript + Zustand + Tailwind v4 (Frontend) · Vitest (Tests) · Anthropic Claude Sonnet 4

**Spec:** `ExamLab/docs/superpowers/specs/2026-04-20-ki-kalibrierung-design.md` (Commit `95dfc00`)
**Branch:** `feature/ki-kalibrierung` (bereits existent, Spec committed)

---

## Konventionen

- **Alle Commits** auf Branch `feature/ki-kalibrierung`, nicht `main`.
- **TDD wo möglich:** TypeScript via `vitest`. Apps-Script-Code via manueller Validierung im Apps-Script-Editor + Staging-E2E (keine Unit-Tests für GAS — Plattform-Einschränkung).
- **Pre-Commit jeder Task:** `cd ExamLab && npx tsc -b && npx vitest run` grün (Baseline: 455/455).
- **Apps-Script-Deploy:** manuell durch User nach jeder Backend-Änderung. Plan markiert deploy-bedürftige Tasks.
- **Defensive Normalizer-Regel** (`.claude/rules/code-quality.md`): neue Felder aus Backend am Eintrittspunkt normalisieren.
- **Keine Commits ohne Begründung "Warum":** Commit-Messages erklären Intent, nicht "was".

---

## Phase 1 — Backend-Foundations (Apps Script)

Zielzustand Phase 1: Sheet-Setup + Lifecycle-Helper + Retrieval funktionieren. Kein Endpoint eingebunden. Master-Toggle Default AUS.

### Task 1 — KIFeedback-Sheet + Header-Migration

**Files:**
- Modify: `ExamLab/apps-script-code.js` (neue Helper ans Ende, vor `// ==============` Kommentar-Abschnitten)

- [ ] **Step 1.1: `stelleKIFeedbackSheetBereit_` hinzufügen**

Am Ende von `apps-script-code.js` (vor closing `}` des letzten Abschnitts):

```js
/**
 * Idempotent: legt KIFeedback-Sheet mit Headers an, falls fehlt.
 * Wird bei jedem schreibenden Feedback-Call als erstes aufgerufen.
 */
function stelleKIFeedbackSheetBereit_() {
  var ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName('KIFeedback');
  var headers = ['feedbackId','zeitstempel','lpEmail','fachschaft','aktion','fachbereich',
                 'bloom','inputJson','kiOutputJson','finaleVersionJson','diffScore',
                 'status','qualifiziert','wichtig','aktiv','teilen','embeddingHash'];
  if (!sheet) {
    sheet = ss.insertSheet('KIFeedback');
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var vorhandene = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (vorhandene[i] !== headers[i]) {
      if (i >= sheet.getLastColumn()) {
        // Spalte fehlt am Ende: ergänzen
        sheet.getRange(1, i + 1).setValue(headers[i]);
      }
      // Header-Mismatch in mittlerer Spalte → Log, kein Throw (defensive)
    }
  }
  return sheet;
}
```

- [ ] **Step 1.2: `stelleKorrekturSheetHeaderBereit_` hinzufügen**

```js
/**
 * Idempotent: ergänzt fehlenden `kriterienBewertung`-Header im Korrektur_-Sheet einer Prüfung.
 * Aufgerufen von speichereKorrekturZeile vor dem Write.
 */
function stelleKorrekturSheetHeaderBereit_(korrekturSheet) {
  var headers = korrekturSheet.getRange(1, 1, 1, korrekturSheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('kriterienBewertung') === -1) {
    var neueSpalteIdx = korrekturSheet.getLastColumn() + 1;
    korrekturSheet.getRange(1, neueSpalteIdx).setValue('kriterienBewertung');
  }
}
```

- [ ] **Step 1.3: Manuell im Apps-Script-Editor `stelleKIFeedbackSheetBereit_()` aufrufen**

In Apps-Script-Editor: Funktion auswählen + „Ausführen". Erwartet: Neues Sheet `KIFeedback` mit 17 Headern sichtbar. Danach nochmal ausführen → keine Doppelung (idempotent verifiziert).

- [ ] **Step 1.4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "KIFeedback Sheet-Setup + Header-Migrator für Korrektur-Sheet

Idempotente Helper, bereiten Infrastruktur für Spec 2026-04-20.
Noch kein Endpoint-Wiring — reiner Sheet-Grundbau."
```

---

### Task 2 — LP-Einstellungen-Schema (Kalibrierungs-Konfig)

**Files:**
- Modify: `ExamLab/apps-script-code.js` (existing `LPEinstellungen`-Sheet oder neues Unter-Sheet, je nachdem ob bereits existiert)

- [ ] **Step 2.1: Im Apps-Script-Editor Sheet-Struktur prüfen**

Console-Skript im Apps-Script-Editor:
```js
function pruefeLPEinstellungen() {
  var ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName('LPEinstellungen');
  if (!sheet) { console.log('LPEinstellungen fehlt'); return; }
  console.log(sheet.getRange(1,1,1,sheet.getLastColumn()).getValues());
}
```

Erwartet: Bestehende Spalten dokumentieren. Wenn Sheet fehlt: neu anlegen in Task-2.2.

- [ ] **Step 2.2: `ladeLPKalibrierungsEinstellungen_` + `speichereLPKalibrierungsEinstellungen_` hinzufügen**

```js
var KALIBRIERUNG_DEFAULTS = {
  global: false,                    // Default AUS — LP schaltet explizit ein
  aktionenAktiv: {
    generiereMusterloesung: true,
    klassifiziereFrage: true,
    bewertungsrasterGenerieren: true,
    korrigiereFreitext: true
  },
  minBeispiele: 3,
  beispielAnzahl: 5
};

function ladeLPKalibrierungsEinstellungen_(lpEmail) {
  var ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName('LPEinstellungen');
  if (!sheet) return KALIBRIERUNG_DEFAULTS;
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var emailIdx = headers.indexOf('email');
  var konfigIdx = headers.indexOf('kalibrierung');
  if (konfigIdx === -1) return KALIBRIERUNG_DEFAULTS;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][emailIdx]).toLowerCase() === lpEmail.toLowerCase()) {
      try {
        var parsed = JSON.parse(rows[i][konfigIdx] || '{}');
        return Object.assign({}, KALIBRIERUNG_DEFAULTS, parsed);
      } catch(e) { return KALIBRIERUNG_DEFAULTS; }
    }
  }
  return KALIBRIERUNG_DEFAULTS;
}

function speichereLPKalibrierungsEinstellungen_(lpEmail, konfig) {
  var ss = SpreadsheetApp.openById(GLOBAL_SPREADSHEET_ID);
  var sheet = ss.getSheetByName('LPEinstellungen');
  if (!sheet) {
    sheet = ss.insertSheet('LPEinstellungen');
    sheet.appendRow(['email', 'kalibrierung', 'letzteAenderung']);
  }
  var headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  var konfigIdx = headers.indexOf('kalibrierung');
  if (konfigIdx === -1) {
    konfigIdx = sheet.getLastColumn();
    sheet.getRange(1, konfigIdx + 1).setValue('kalibrierung');
  }
  var rows = sheet.getDataRange().getValues();
  var emailIdx = headers.indexOf('email');
  var konfigStr = JSON.stringify(konfig);
  var jetzt = new Date().toISOString();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][emailIdx]).toLowerCase() === lpEmail.toLowerCase()) {
      sheet.getRange(i + 1, konfigIdx + 1).setValue(konfigStr);
      var zeitIdx = headers.indexOf('letzteAenderung');
      if (zeitIdx >= 0) sheet.getRange(i + 1, zeitIdx + 1).setValue(jetzt);
      return;
    }
  }
  sheet.appendRow([lpEmail, konfigStr, jetzt]);
}
```

- [ ] **Step 2.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Kalibrierungs-Einstellungen Load/Save pro LP

Default global=false — Feature ist ausgeschaltet bis LP explizit
aktiviert. Konfig als JSON-String in LPEinstellungen-Sheet."
```

---

### Task 3 — Feedback-Lifecycle-Helper (start/schliesse/ignoriere)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 3.1: `starteFeedbackEintrag_` hinzufügen**

```js
/** Neue offene Zeile ins KIFeedback-Sheet. Rückgabe: feedbackId. */
function starteFeedbackEintrag_(args) {
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var feedbackId = 'fb_' + new Date().toISOString().slice(0,10) + '_' + Utilities.getUuid().slice(0,8);
    var fachschaft = holeFachschaftAusEmail_(args.lpEmail) || '';
    sheet.appendRow([
      feedbackId,
      new Date().toISOString(),
      args.lpEmail,
      fachschaft,
      args.aktion,
      args.fachbereich || '',
      args.bloom || '',
      JSON.stringify(args.inputJson || {}),
      JSON.stringify(args.kiOutputJson || {}),
      '',       // finaleVersionJson
      '',       // diffScore
      'offen',
      false,    // qualifiziert
      false,    // wichtig
      true,     // aktiv
      'privat', // teilen
      ''        // embeddingHash (Ansatz-3-Hook)
    ]);
    return feedbackId;
  } catch (e) {
    console.warn('[KIFeedback] starteFeedbackEintrag_ Lock-Fehler:', e);
    return null; // Fail-open: Haupt-Call läuft trotzdem
  } finally {
    try { lock.releaseLock(); } catch(e){}
  }
}

/** Helper: Fachschaft aus LP-Email via Stammdaten. Live-Resolution. */
function holeFachschaftAusEmail_(email) {
  // Nutze bestehende Stammdaten-Helper wenn vorhanden
  try {
    var lpInfo = getLPInfo(email);  // existierender Helper
    return lpInfo && lpInfo.fachschaft ? lpInfo.fachschaft : '';
  } catch(e) { return ''; }
}
```

- [ ] **Step 3.2: `schliesseFeedbackEintrag_` hinzufügen**

```js
/**
 * Schliesst offene Feedback-Zeile: setzt finaleVersion, diffScore, qualifiziert, status.
 * Idempotent — wenn bereits geschlossen/nicht gefunden, stumm log.
 */
function schliesseFeedbackEintrag_(feedbackId, finaleVersionJson, options) {
  options = options || {};
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var col = function(name) { return headers.indexOf(name); };
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][col('feedbackId')] === feedbackId) {
        if (rows[i][col('status')] !== 'offen') {
          console.log('[KIFeedback] Eintrag bereits geschlossen:', feedbackId);
          return;
        }
        var aktion = rows[i][col('aktion')];
        var kiOutput = safeParse_(rows[i][col('kiOutputJson')]);
        var diff = berechneDiffScore_(aktion, kiOutput, finaleVersionJson);
        var wichtig = options.wichtig || false;
        var qualifiziert = istQualifiziert_(aktion, diff) || wichtig;
        var rowIdx = i + 1;
        sheet.getRange(rowIdx, col('finaleVersionJson') + 1).setValue(JSON.stringify(finaleVersionJson));
        sheet.getRange(rowIdx, col('diffScore') + 1).setValue(diff);
        sheet.getRange(rowIdx, col('status') + 1).setValue('geschlossen');
        sheet.getRange(rowIdx, col('qualifiziert') + 1).setValue(qualifiziert);
        sheet.getRange(rowIdx, col('wichtig') + 1).setValue(wichtig);
        return;
      }
    }
    console.warn('[KIFeedback] feedbackId nicht gefunden:', feedbackId);
  } finally {
    try { lock.releaseLock(); } catch(e){}
  }
}

function markiereFeedbackAlsIgnoriert_(feedbackId) {
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var statusIdx = headers.indexOf('status');
    var idIdx = headers.indexOf('feedbackId');
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][idIdx] === feedbackId && rows[i][statusIdx] === 'offen') {
        sheet.getRange(i + 1, statusIdx + 1).setValue('ignoriert');
        return;
      }
    }
  } finally {
    try { lock.releaseLock(); } catch(e){}
  }
}

function safeParse_(s) { try { return JSON.parse(s || '{}'); } catch(e) { return {}; } }
```

- [ ] **Step 3.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Feedback-Lifecycle: start/schliesse/ignoriere mit LockService

LockService serialisiert Writes gegen Races bei parallelen LP-Sessions.
Fail-open Semantik: Lock-Fehler loggen, Haupt-Call läuft weiter."
```

---

### Task 4 — Heuristik (Diff-Score + Qualifikation)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 4.1: `berechneDiffScore_` + `istQualifiziert_` hinzufügen**

```js
function berechneDiffScore_(aktion, ki, lp) {
  if (!ki || !lp) return 1;
  switch (aktion) {
    case 'generiereMusterloesung':
    case 'bewertungsrasterGenerieren':
      return levenshteinNorm_(extrahiereText_(aktion, ki), extrahiereText_(aktion, lp));
    case 'klassifiziereFrage':
      // Gewichtung (E2): fachbereich=0.4, bloom=0.25, thema=0.25, unterthema=0.1
      var w = { fachbereich: 0.4, bloom: 0.25, thema: 0.25, unterthema: 0.1 };
      var diff = 0;
      for (var k in w) if ((ki[k] || '') !== (lp[k] || '')) diff += w[k];
      return Math.min(1, diff);
    case 'korrigiereFreitext':
      var maxP = ki.maxPunkte || lp.maxPunkte || 1;
      var punkteDiff = Math.abs((ki.punkte || 0) - (lp.punkte || 0)) / Math.max(maxP, 1);
      var textDiff = levenshteinNorm_(ki.begruendung || '', lp.begruendung || '');
      return 0.6 * Math.min(1, punkteDiff) + 0.4 * textDiff;
    default:
      return 0.5;
  }
}

function istQualifiziert_(aktion, diff) {
  // unverändert übernommen (diff=0) ODER deutlich angepasst
  return diff === 0 || diff >= 0.15;
}

function extrahiereText_(aktion, daten) {
  if (aktion === 'generiereMusterloesung') return daten.loesung || daten.musterlosung || '';
  if (aktion === 'bewertungsrasterGenerieren') {
    if (Array.isArray(daten.kriterien)) {
      return daten.kriterien.map(function(k) {
        return (k.beschreibung || '') + (k.punkte || '') + (Array.isArray(k.niveaustufen) ? k.niveaustufen.map(function(n){return n.beschreibung;}).join('|') : '');
      }).join('\n');
    }
    return JSON.stringify(daten);
  }
  return JSON.stringify(daten);
}

function levenshteinNorm_(a, b) {
  a = String(a); b = String(b);
  if (!a && !b) return 0;
  if (!a || !b) return 1;
  var m = a.length, n = b.length;
  var dp = new Array(n + 1);
  for (var j = 0; j <= n; j++) dp[j] = j;
  for (var i = 1; i <= m; i++) {
    var prev = dp[0]; dp[0] = i;
    for (var j = 1; j <= n; j++) {
      var cur = dp[j];
      dp[j] = a[i-1] === b[j-1] ? prev : Math.min(prev, dp[j-1], dp[j]) + 1;
      prev = cur;
    }
  }
  return dp[n] / Math.max(m, n);
}
```

- [ ] **Step 4.2: Manuelle Tests im Apps-Script-Editor — Levenshtein + Heuristik (E1)**

Im Apps-Script-Editor eine Test-Funktion anlegen (ausführbar via „Run" im Editor):

```js
function testHeuristik_() {
  // Levenshtein-Norm
  console.assert(levenshteinNorm_('abc', 'abc') === 0, 'gleicher String = 0');
  console.assert(levenshteinNorm_('', '') === 0, 'beide leer = 0');
  console.assert(levenshteinNorm_('abc', 'abd') < 0.4, '1 Zeichen Diff bei 3 = ~0.33');
  console.assert(levenshteinNorm_('', 'abc') === 1, 'eine leer = 1');
  var lang = 'A'.repeat(100), lang2 = 'B'.repeat(100);
  console.assert(levenshteinNorm_(lang, lang2) === 1, '100 Ersetzungen = 1');

  // Musterlösung — Mikro-Edit darf NICHT qualifizieren
  var diff1 = berechneDiffScore_('generiereMusterloesung',
    {loesung:'BIP misst die Wirtschaftsleistung eines Landes.'},
    {loesung:'BIP misst die Wirtschaftsleistung eines Landes'}); // Punkt entfernt
  console.assert(!istQualifiziert_('generiereMusterloesung', diff1), 'Mikro-Edit nicht qualifiziert');

  // Musterlösung — deutlicher Rewrite qualifiziert
  var diff2 = berechneDiffScore_('generiereMusterloesung',
    {loesung:'BIP misst die Wirtschaftsleistung eines Landes.'},
    {loesung:'BIP = Bruttoinlandsprodukt. Misst Wert aller produzierten Güter und Dienstleistungen in einem Jahr.'});
  console.assert(istQualifiziert_('generiereMusterloesung', diff2), 'Rewrite qualifiziert');

  // klassifiziereFrage — fachbereich geändert (0.4) → qualifiziert (≥0.15)
  var diff3 = berechneDiffScore_('klassifiziereFrage',
    {fachbereich:'VWL', bloom:'K2', thema:'BIP', unterthema:''},
    {fachbereich:'BWL', bloom:'K2', thema:'BIP', unterthema:''});
  console.assert(Math.abs(diff3 - 0.4) < 0.001, 'fachbereich-Diff = 0.4');
  console.assert(istQualifiziert_('klassifiziereFrage', diff3), 'fachbereich-Change qualifiziert');

  // klassifiziereFrage — nur unterthema geändert (0.1) → NICHT qualifiziert
  var diff4 = berechneDiffScore_('klassifiziereFrage',
    {fachbereich:'VWL', bloom:'K2', thema:'BIP', unterthema:''},
    {fachbereich:'VWL', bloom:'K2', thema:'BIP', unterthema:'nominal vs. real'});
  console.assert(!istQualifiziert_('klassifiziereFrage', diff4), 'nur unterthema nicht qualifiziert');

  // korrigiereFreitext — 2 Punkte von 5 Diff = 0.4 × 0.6 = 0.24 → qualifiziert
  var diff5 = berechneDiffScore_('korrigiereFreitext',
    {punkte: 5, maxPunkte: 10, begruendung: 'Gut.'},
    {punkte: 7, maxPunkte: 10, begruendung: 'Gut.'});
  console.assert(diff5 > 0.1, 'Punktediff signifikant');
  console.assert(istQualifiziert_('korrigiereFreitext', diff5), 'Punktediff qualifiziert');

  console.log('Alle Heuristik-Tests bestanden.');
}
```

Ausführen in Apps-Script-Editor: keine Assertion-Fehler im Log.

- [ ] **Step 4.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Heuristik: gewichtete Diff-Score + Qualifikation pro Aktion

Reviewer-Empfehlung E2: klassifiziereFrage bekommt gewichtete Felder
(fachbereich=0.4, bloom=0.25, thema=0.25, unterthema=0.1).
E1: Manuelle Testfälle für alle 4 Aktions-Pfade im Apps-Script-Editor."
```

---

### Task 5 — Retrieval (holeFewShotBeispiele_ + baueFewShotBlock_)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 5.1: `holeFewShotBeispiele_` + `baueFewShotBlock_` hinzufügen**

```js
function holeFewShotBeispiele_(opts) {
  if (opts.sortierung && opts.sortierung === 'similarity') {
    throw new Error('NotImplemented: similarity-Retrieval in v3');
  }
  var einst = ladeLPKalibrierungsEinstellungen_(opts.lpEmail);
  if (!einst.global) return [];
  if (!einst.aktionenAktiv[opts.aktion]) return [];

  var sheet = stelleKIFeedbackSheetBereit_();
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0];
  var col = function(n) { return headers.indexOf(n); };

  var passend = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[col('lpEmail')] !== opts.lpEmail) continue;
    if (r[col('aktion')] !== opts.aktion) continue;
    if (r[col('status')] !== 'geschlossen') continue;
    if (r[col('qualifiziert')] !== true) continue;
    if (r[col('aktiv')] !== true) continue;
    if (opts.fachbereich && r[col('fachbereich')] !== opts.fachbereich) continue;
    passend.push({
      zeitstempel: r[col('zeitstempel')],
      bloom: r[col('bloom')],
      wichtig: r[col('wichtig')],
      inputJson: safeParse_(r[col('inputJson')]),
      kiOutputJson: safeParse_(r[col('kiOutputJson')]),
      finaleVersionJson: safeParse_(r[col('finaleVersionJson')])
    });
  }

  // Sortierung: wichtig zuerst, dann Recency (neueste zuerst)
  passend.sort(function(a, b) {
    if (a.wichtig !== b.wichtig) return a.wichtig ? -1 : 1;
    return String(b.zeitstempel).localeCompare(String(a.zeitstempel));
  });

  // minBeispiele-Schwelle: wenn weniger qualifizierte da, kein Few-Shot
  if (passend.length < einst.minBeispiele) return [];

  return passend.slice(0, einst.beispielAnzahl);
}

function baueFewShotBlock_(aktion, beispiele, opts) {
  if (!beispiele || beispiele.length === 0) return '';
  var token_cap = 1500; // hart-Cap
  var lines;
  switch (aktion) {
    case 'generiereMusterloesung':
      lines = beispiele.map(function(b, i) {
        return 'Beispiel ' + (i+1) + ' (' + (b.inputJson.fachbereich || '?') + ', ' + (b.bloom || '?') + '):\n' +
               'Frage: "' + truncate_(b.inputJson.fragetext || '', 200) + '"\n' +
               'Musterlösung: "' + truncate_(b.finaleVersionJson.loesung || b.finaleVersionJson.musterlosung || '', 400) + '"';
      });
      return '--- ' + beispiele.length + ' Beispiele aus deinen bisherigen Musterlösungen ---\n\n' +
             capByTokens_(lines.join('\n\n'), token_cap) +
             '\n\n--- Ende der Beispiele ---\n\n';

    case 'klassifiziereFrage':
      lines = beispiele.map(function(b, i) {
        var f = b.finaleVersionJson;
        return 'Beispiel ' + (i+1) + ':\nFrage: "' + truncate_(b.inputJson.fragetext || '', 200) + '"\n' +
               'Deine Klassifikation: Fach=' + (f.fachbereich||'?') + ', Thema=' + (f.thema||'?') +
               ', Bloom=' + (f.bloom||'?') + (f.unterthema ? ', Unterthema=' + f.unterthema : '');
      });
      return '--- Beispiele deiner bisherigen Klassifikationen ---\n\n' +
             capByTokens_(lines.join('\n\n'), token_cap) +
             '\n\n--- Ende der Beispiele ---\n\n';

    case 'bewertungsrasterGenerieren':
      lines = beispiele.map(function(b, i) {
        return 'Beispiel ' + (i+1) + ':\nFrage: "' + truncate_(b.inputJson.fragetext || '', 200) + '"\n' +
               'Dein Bewertungsraster: ' + truncate_(JSON.stringify(b.finaleVersionJson.kriterien || b.finaleVersionJson), 500);
      });
      return '--- Beispiele deiner Bewertungsraster ---\n\n' +
             capByTokens_(lines.join('\n\n'), token_cap) +
             '\n\n--- Ende der Beispiele ---\n\n';

    case 'korrigiereFreitext':
      // PRIVACY: Keine SuS-Antworten! Nur Bewertungs-Logik.
      lines = beispiele.map(function(b, i) {
        var f = b.finaleVersionJson, k = b.kiOutputJson;
        var raster = b.inputJson.bewertungsraster;
        return 'Beispiel ' + (i+1) + ' (Bewertungsraster-basiert):\n' +
               'Raster: ' + truncate_(JSON.stringify(raster || []), 300) + '\n' +
               'KI hatte: ' + (k.punkte||'?') + 'P — "' + truncate_(k.begruendung||'', 150) + '"\n' +
               'Du gabst: ' + (f.punkte||'?') + 'P — "' + truncate_(f.begruendung||'', 150) + '"';
      });
      return '--- Beispiele deiner Korrektur-Entscheidungen (ohne SuS-Antworten) ---\n\n' +
             capByTokens_(lines.join('\n\n'), token_cap) +
             '\n\n--- Ende der Beispiele ---\n\n';

    default:
      return '';
  }
}

function truncate_(s, max) { s = String(s||''); return s.length > max ? s.slice(0, max) + '...' : s; }
function capByTokens_(s, max) {
  // Grobe Schätzung: 1 Token ≈ 4 Zeichen (konservativ für DE)
  var maxChars = max * 4;
  return s.length > maxChars ? s.slice(0, maxChars) + '\n[… ältere Beispiele abgeschnitten …]' : s;
}
```

- [ ] **Step 5.2: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Few-Shot-Retrieval + Block-Builder (4 aktions-spezifische Renderer)

Retrieval: LP-Scope, Aktion-Filter, Fachbereich, qualifiziert+aktiv,
Stern-Priorisierung vor Recency, minBeispiele-Schwelle.

Block-Builder pro Aktion; korrigiereFreitext-Renderer enthält NIE
SuS-Antworten (Spec 7.6 Privacy-Invariante).

Hart-Cap 1500 Tokens mit truncate/capByTokens Utils."
```

---

## Phase 2 — Endpoint-Integration (Apps Script)

### Task 6 — kiAssistentEndpoint erweitern

**Files:**
- Modify: `ExamLab/apps-script-code.js` (bestehenden `kiAssistentEndpoint` bei Zeile ~5014)

- [ ] **Step 6.1: Instrumentation einbauen**

Ersetze den Abschnitt zwischen `// Validierung` und `rufeClaudeAuf` durch:

```js
function kiAssistentEndpoint(body) {
  var email = body.email;
  var aktion = body.aktion;
  var daten = body.daten || {};

  if (!istZugelasseneLP(email)) {
    return jsonResponse({ success: false, error: 'Nicht autorisiert' });
  }

  var instrumentiert = ['generiereMusterloesung','klassifiziereFrage',
                        'bewertungsrasterGenerieren','korrigiereFreitext'].indexOf(aktion) !== -1;

  var fewShotBlock = '';
  var feedbackId = null;

  if (instrumentiert) {
    try {
      var beispiele = holeFewShotBeispiele_({
        lpEmail: email,
        aktion: aktion,
        fachbereich: daten.fachbereich,
        bloom: daten.bloom
      });
      fewShotBlock = baueFewShotBlock_(aktion, beispiele);
    } catch (e) {
      console.warn('[Kalibrierung] Retrieval-Fehler, fahre ohne Few-Shot fort:', e.message);
    }
  }

  var systemPrompt = /* ...bestehender System-Prompt */;  // BEHALTEN wie heute (Z. 5027)
  var userPromptBase = baueUserPrompt_(aktion, daten);    // bestehender Helper
  var userPrompt = fewShotBlock + userPromptBase;

  var einst = instrumentiert ? ladeLPKalibrierungsEinstellungen_(email) : null;
  if (instrumentiert && einst && einst.global) {
    try {
      feedbackId = starteFeedbackEintrag_({
        lpEmail: email, aktion: aktion,
        fachbereich: daten.fachbereich, bloom: daten.bloom,
        inputJson: daten, kiOutputJson: {}  // kiOutput wird später nachgetragen
      });
    } catch (e) {
      console.warn('[Kalibrierung] Start-Feedback-Fehler:', e.message);
    }
  }

  var kiOutput;
  try {
    kiOutput = rufeClaudeAuf(systemPrompt, userPrompt, /* maxTokens wie heute */, email);
  } catch (e) {
    // Bei API-Quota-Fehler: Feedback ignorieren + Fehler melden (N1-Vorbereitung)
    if (feedbackId) try { markiereFeedbackAlsIgnoriert_(feedbackId); } catch(_){}
    throw e;
  }

  // kiOutput in Feedback nachtragen
  if (feedbackId && kiOutput) {
    try {
      var sheet = stelleKIFeedbackSheetBereit_();
      var rows = sheet.getDataRange().getValues();
      var hdr = rows[0];
      var ki = hdr.indexOf('kiOutputJson'), idIdx = hdr.indexOf('feedbackId');
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][idIdx] === feedbackId) {
          sheet.getRange(i + 1, ki + 1).setValue(JSON.stringify(kiOutput));
          break;
        }
      }
    } catch (e) { console.warn('[Kalibrierung] kiOutput-Nachtrag fehlgeschlagen:', e); }
  }

  return jsonResponse({ success: true, daten: kiOutput, feedbackId: feedbackId });
}
```

- [ ] **Step 6.2: Im Apps-Script-Editor smoke-testen**

```js
function smokeTest_kiEndpoint() {
  var res = kiAssistentEndpoint({
    email: 'yannick.durand@gymhofwil.ch',
    aktion: 'generiereMusterloesung',  // instrumentiert, aber global=false → kein Feedback
    daten: { fragetext: 'Was ist BIP?', fachbereich: 'VWL', bloom: 'K2' }
  });
  console.log(JSON.parse(res.getContent()));
}
```

Erwartet: `success: true, daten: {...}, feedbackId: null` (global default=false).

- [ ] **Step 6.3: Master-Toggle manuell AN schalten → Smoke re-run**

Im Editor:
```js
speichereLPKalibrierungsEinstellungen_('yannick.durand@gymhofwil.ch',
  Object.assign({}, KALIBRIERUNG_DEFAULTS, { global: true }));
```

Dann Smoke wieder. Erwartet: `feedbackId: 'fb_...'`. KIFeedback-Sheet enthält neuen Eintrag mit Status `offen`.

- [ ] **Step 6.4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "kiAssistentEndpoint: Few-Shot-Injection + Feedback-Start

Nur 4 instrumentierte Aktionen. Master-Toggle (global) steuert
ob Feedback-Eintrag erzeugt wird. Bei Fehlern Fail-open.

Response-Shape: {daten, feedbackId}. feedbackId=null wenn Kalibrierung
AUS oder Aktion nicht instrumentiert."
```

---

### Task 7 — speichereFrage um offeneKIFeedbacks erweitern

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Endpoint `speichereFrage`, via `grep -n "function speichereFrage"`)

- [ ] **Step 7.1: Im Editor Endpoint finden**

```bash
grep -n "function speichereFrage" ExamLab/apps-script-code.js
```

- [ ] **Step 7.2: Nach erfolgreichem Speicher-Write ergänzen**

Innerhalb `speichereFrage`, direkt vor dem `return jsonResponse({success:true})`:

```js
// Kalibrierungs-Feedbacks schliessen
if (body.offeneKIFeedbacks && Array.isArray(body.offeneKIFeedbacks)) {
  body.offeneKIFeedbacks.forEach(function(fb) {
    try {
      var final = extrahiereFinaleVersionEditor_(fb.aktion, gespeicherteFrage);
      schliesseFeedbackEintrag_(fb.feedbackId, final, { wichtig: !!fb.wichtig });
    } catch(e) { console.warn('[Kalibrierung] schliesseFeedback fehlgeschlagen:', e); }
  });
}
```

Und den Helper hinzufügen (am Ende der Datei, mit anderen Helpern):

```js
function extrahiereFinaleVersionEditor_(aktion, frage) {
  switch (aktion) {
    case 'generiereMusterloesung':
      return { loesung: frage.musterlosung || '' };
    case 'klassifiziereFrage':
      return {
        fachbereich: frage.fachbereich || '',
        thema: frage.thema || '',
        bloom: frage.bloom || '',
        unterthema: frage.unterthema || ''
      };
    case 'bewertungsrasterGenerieren':
      return { kriterien: frage.bewertungsraster || [] };
    default:
      return frage;
  }
}
```

- [ ] **Step 7.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "speichereFrage schliesst offeneKIFeedbacks beim Save

Extrahiert finale Version aktions-spezifisch (Musterlösung aus
musterlosung-Feld, Klassifizierung aus den 4 Feldern, Raster
aus bewertungsraster-Array)."
```

---

### Task 8 — speichereKorrekturZeile Persistenz-Fix + Feedback-Schliessung

**Files:**
- Modify: `ExamLab/apps-script-code.js` (Endpoint `speichereKorrekturZeile` bei Zeile ~6015)

- [ ] **Step 8.1: Body-Felder erweitern + Header-Migration**

In `speichereKorrekturZeile`, nach dem `openById`/`getSheetByName`-Block:

```js
var kPunkte = body.kiPunkte !== undefined ? body.kiPunkte : null;
var kBegr = body.kiBegruendung !== undefined ? body.kiBegruendung : null;
var kritBew = body.kriterienBewertung || null;
var quelle = body.quelle || null;

stelleKorrekturSheetHeaderBereit_(korrekturSheet);
// …bisheriger Code, der headers liest, kommt danach und enthält dann auch kriterienBewertung
```

Im Write-Block (bestehend, wo `lpPunkte` etc. geschrieben werden) zusätzlich:

```js
var hdrKI = headers.indexOf('kiPunkte');
if (hdrKI >= 0 && kPunkte !== null) korrekturSheet.getRange(rowIdx, hdrKI + 1).setValue(kPunkte);
var hdrKB = headers.indexOf('kiBegruendung');
if (hdrKB >= 0 && kBegr !== null) korrekturSheet.getRange(rowIdx, hdrKB + 1).setValue(kBegr);
var hdrKrit = headers.indexOf('kriterienBewertung');
if (hdrKrit >= 0 && kritBew) korrekturSheet.getRange(rowIdx, hdrKrit + 1).setValue(JSON.stringify(kritBew));
var hdrQuelle = headers.indexOf('quelle');
if (hdrQuelle >= 0 && quelle) korrekturSheet.getRange(rowIdx, hdrQuelle + 1).setValue(quelle);
```

- [ ] **Step 8.2: Feedback-Schliessung ergänzen**

Vor dem `return jsonResponse({success:true})`:

```js
if (body.offeneKIFeedbacks && Array.isArray(body.offeneKIFeedbacks)) {
  body.offeneKIFeedbacks.forEach(function(fb) {
    try {
      var final = {
        punkte: body.lpPunkte,
        begruendung: body.lpKommentar,
        kriterienBewertung: kritBew,
        maxPunkte: body.maxPunkte || null
      };
      schliesseFeedbackEintrag_(fb.feedbackId, final, { wichtig: !!fb.wichtig });
    } catch(e) { console.warn('[Kalibrierung] Korrektur-schliesseFeedback:', e); }
  });
}
```

- [ ] **Step 8.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "speichereKorrekturZeile: Persistenz-Fix + Feedback-Schliessung

Behebt blockierenden Bug (Audit): kiPunkte/kiBegruendung/
kriterienBewertung/quelle wurden nie persistiert. Header-Migration
für kriterienBewertung idempotent via stelleKorrekturSheetHeaderBereit_.

Schliesst jetzt auch offeneKIFeedbacks analog speichereFrage."
```

---

### Task 9 — Review- + Statistik-Endpoints

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 9.1: `listeKIFeedbacks` + `aktualisiereKIFeedback` + `loescheKIFeedback`**

```js
function listeKIFeedbacks(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  var sheet = stelleKIFeedbackSheetBereit_();
  var rows = sheet.getDataRange().getValues();
  var hdr = rows[0];
  var c = function(n){return hdr.indexOf(n);};
  var seite = body.seite || 0;
  var proSeite = body.proSeite || 50;
  var f = body.filter || {};

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[c('lpEmail')]).toLowerCase() !== body.email.toLowerCase()) continue;
    if (f.aktion && r[c('aktion')] !== f.aktion) continue;
    if (f.fachbereich && r[c('fachbereich')] !== f.fachbereich) continue;
    if (f.status && r[c('status')] !== f.status) continue;
    if (f.nurWichtige && !r[c('wichtig')]) continue;
    if (f.von && String(r[c('zeitstempel')]) < f.von) continue;
    if (f.bis && String(r[c('zeitstempel')]) > f.bis) continue;
    result.push({
      feedbackId: r[c('feedbackId')],
      zeitstempel: r[c('zeitstempel')],
      aktion: r[c('aktion')],
      fachbereich: r[c('fachbereich')],
      bloom: r[c('bloom')],
      inputJson: safeParse_(r[c('inputJson')]),
      kiOutputJson: safeParse_(r[c('kiOutputJson')]),
      finaleVersionJson: safeParse_(r[c('finaleVersionJson')]),
      diffScore: r[c('diffScore')],
      status: r[c('status')],
      qualifiziert: r[c('qualifiziert')],
      wichtig: r[c('wichtig')],
      aktiv: r[c('aktiv')]
    });
  }
  // Newest first
  result.sort(function(a,b){ return String(b.zeitstempel).localeCompare(String(a.zeitstempel)); });
  var gesamt = result.length;
  var start = seite * proSeite;
  return jsonResponse({success:true, data:{eintraege: result.slice(start, start + proSeite), gesamt: gesamt}});
}

function aktualisiereKIFeedback(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var rows = sheet.getDataRange().getValues();
    var hdr = rows[0];
    var c = function(n){return hdr.indexOf(n);};
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][c('feedbackId')] !== body.feedbackId) continue;
      if (String(rows[i][c('lpEmail')]).toLowerCase() !== body.email.toLowerCase()) {
        return jsonResponse({success:false, error:'Nicht autorisiert (nicht eigener Eintrag)'});
      }
      if (body.wichtig !== undefined) sheet.getRange(i+1, c('wichtig')+1).setValue(!!body.wichtig);
      if (body.aktiv !== undefined) sheet.getRange(i+1, c('aktiv')+1).setValue(!!body.aktiv);
      return jsonResponse({success:true});
    }
    return jsonResponse({success:false, error:'Eintrag nicht gefunden'});
  } finally { try{lock.releaseLock();}catch(e){} }
}

function loescheKIFeedback(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var rows = sheet.getDataRange().getValues();
    var hdr = rows[0];
    var c = function(n){return hdr.indexOf(n);};
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][c('feedbackId')] !== body.feedbackId) continue;
      if (String(rows[i][c('lpEmail')]).toLowerCase() !== body.email.toLowerCase()) {
        return jsonResponse({success:false, error:'Nicht autorisiert'});
      }
      sheet.deleteRow(i + 1);
      auditLog_('kiFeedback:delete', body.email, {feedbackId: body.feedbackId});
      return jsonResponse({success:true});
    }
    return jsonResponse({success:false, error:'Nicht gefunden'});
  } finally { try{lock.releaseLock();}catch(e){} }
}

function bulkLoescheKIFeedbacks(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  var filter = body.filter || {};
  var sheet = stelleKIFeedbackSheetBereit_();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    var rows = sheet.getDataRange().getValues();
    var hdr = rows[0];
    var c = function(n){return hdr.indexOf(n);};
    var zuLoeschen = [];
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][c('lpEmail')]).toLowerCase() !== body.email.toLowerCase()) continue;
      if (filter.status && rows[i][c('status')] !== filter.status) continue;
      if (filter.aelter_als) {
        if (String(rows[i][c('zeitstempel')]) > filter.aelter_als) continue;
      }
      zuLoeschen.push(i + 1);
    }
    // Von unten nach oben löschen (Zeilen-Shift!)
    zuLoeschen.sort(function(a,b){return b-a;}).forEach(function(rowNum){
      sheet.deleteRow(rowNum);
    });
    auditLog_('kiFeedback:bulkDelete', body.email, {anzahl: zuLoeschen.length, filter: filter});
    return jsonResponse({success:true, data:{geloescht: zuLoeschen.length}});
  } finally { try{lock.releaseLock();}catch(e){} }
}
```

- [ ] **Step 9.2: `kalibrierungsEinstellungen` + `kalibrierungsStatistik`**

```js
function kalibrierungsEinstellungen(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  if (body.modus === 'laden') {
    return jsonResponse({success:true, data: ladeLPKalibrierungsEinstellungen_(body.email)});
  }
  if (body.modus === 'speichern') {
    if (!body.konfig) return jsonResponse({success:false, error:'konfig fehlt'});
    speichereLPKalibrierungsEinstellungen_(body.email, body.konfig);
    return jsonResponse({success:true});
  }
  return jsonResponse({success:false, error:'Unbekannter modus'});
}

function kalibrierungsStatistik(body) {
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false, error:'Nicht autorisiert'});
  var tage = body.zeitraum_tage || 30;
  var schwelleIso = new Date(Date.now() - tage*24*60*60*1000).toISOString();
  var sheet = stelleKIFeedbackSheetBereit_();
  var rows = sheet.getDataRange().getValues();
  var hdr = rows[0];
  var c = function(n){return hdr.indexOf(n);};

  var aktionenStats = {};
  ['generiereMusterloesung','klassifiziereFrage','bewertungsrasterGenerieren','korrigiereFreitext'].forEach(function(a){
    aktionenStats[a] = { vorschlaege:0, unveraendert:0, leicht:0, deutlich:0, verworfen:0, aktive:0, wichtige:0 };
  });

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[c('lpEmail')]).toLowerCase() !== body.email.toLowerCase()) continue;
    var a = r[c('aktion')];
    if (!aktionenStats[a]) continue;
    var zs = String(r[c('zeitstempel')]);
    if (zs < schwelleIso) continue;
    aktionenStats[a].vorschlaege++;
    var st = r[c('status')];
    var diff = Number(r[c('diffScore')]) || 0;
    if (st === 'ignoriert') aktionenStats[a].verworfen++;
    else if (st === 'geschlossen') {
      if (diff === 0) aktionenStats[a].unveraendert++;
      else if (diff < 0.15) aktionenStats[a].leicht++;
      else aktionenStats[a].deutlich++;
    }
    if (r[c('qualifiziert')] === true && r[c('aktiv')] === true) aktionenStats[a].aktive++;
    if (r[c('wichtig')] === true) aktionenStats[a].wichtige++;
  }
  return jsonResponse({success:true, data:{aktionen: aktionenStats, zeitraum_tage: tage}});
}
```

- [ ] **Step 9.3: Endpoints im Haupt-Dispatcher registrieren**

Im `doPost`-Switch (~Zeile 1060, wo andere `lernplattform*`-Cases sind) hinzufügen:

```js
case 'listeKIFeedbacks': return listeKIFeedbacks(body);
case 'aktualisiereKIFeedback': return aktualisiereKIFeedback(body);
case 'loescheKIFeedback': return loescheKIFeedback(body);
case 'bulkLoescheKIFeedbacks': return bulkLoescheKIFeedbacks(body);
case 'kalibrierungsEinstellungen': return kalibrierungsEinstellungen(body);
case 'kalibrierungsStatistik': return kalibrierungsStatistik(body);
case 'markiereKIFeedbackAlsIgnoriert':
  if (!istZugelasseneLP(body.email)) return jsonResponse({success:false,error:'Nicht autorisiert'});
  markiereFeedbackAlsIgnoriert_(body.feedbackId);
  return jsonResponse({success:true});
```

- [ ] **Step 9.4: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "Review + Statistik + Einstellungs-Endpoints (7 neue Cases)

listeKIFeedbacks (paginiert+filterbar), aktualisiere/loesche mit
LP-Scope-Enforcement, bulkLoesche, kalibrierungsEinstellungen (Load/Save),
kalibrierungsStatistik (pro Aktion im Zeitraum), markiereAlsIgnoriert.

Alle Endpoints auf istZugelasseneLP + lpEmail-Match streng gefiltert.
Lösch-Endpoints schreiben auditLog_."
```

---

### Task 10 — Quota-Watchdog (Reviewer-Notiz N1)

**Files:**
- Modify: `ExamLab/apps-script-code.js`

- [ ] **Step 10.1: Watchdog in `rufeClaudeAuf` (oder Wrapper) einbauen**

Nach Auffinden von `rufeClaudeAuf` (~Zeile 5514), den Fehlerpfad ergänzen:

```js
function rufeClaudeAuf(systemPrompt, userPrompt, maxTokens, email) {
  // ...bestehender Code...
  try {
    var response = UrlFetchApp.fetch(/*...*/);
    // ...
    return parsed;
  } catch (e) {
    var msg = String(e.message || e);
    // Quota-Fehler erkennen
    if (/quota|rate limit|429|Daily Limit/i.test(msg)) {
      auditLog_('kiAssistent:quotaExceeded', email, { aktion: 'auto-disable-attempt' });
      try {
        var einst = ladeLPKalibrierungsEinstellungen_(email);
        einst.global = false;
        einst.letzterQuotaFehler = new Date().toISOString();
        speichereLPKalibrierungsEinstellungen_(email, einst);
      } catch(_){}
    }
    throw e;
  }
}
```

- [ ] **Step 10.2: Frontend-Signal — Backend-Response bei Quota-Fehler**

Wenn im `kalibrierungsEinstellungen`-Load ein `letzterQuotaFehler`-Feld vorhanden ist und innerhalb letzter 24h liegt, im Response mitliefern. Frontend zeigt Banner.

In `kalibrierungsEinstellungen`, Load-Pfad:

```js
var konfig = ladeLPKalibrierungsEinstellungen_(body.email);
// Quota-Fehler < 24h als Warn-Flag mitgeben
if (konfig.letzterQuotaFehler) {
  var vor = (Date.now() - new Date(konfig.letzterQuotaFehler).getTime()) / (60*60*1000);
  konfig.zeigeQuotaWarnung = vor < 24;
}
return jsonResponse({success:true, data: konfig});
```

- [ ] **Step 10.3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "N1: Quota-Watchdog — Master-Toggle Auto-Disable bei API-Quota

Bei rate-limit/429/quota-Fehler wird einst.global automatisch auf false
gesetzt + auditLog_-Eintrag. Frontend erhält zeigeQuotaWarnung=true
innerhalb 24h für Banner."
```

---

### Task 11 — **Deploy-Runde 1** (Backend-only)

**Files:** keine Code-Änderungen, Deploy + Smoke-Test durch User.

- [ ] **Step 11.1: User-Anweisung dokumentieren**

In HANDOFF.md einen Abschnitt:
```
## S130 Phase 2 Deploy 1 — nur Backend
Zweck: Endpoints bereit, aber Frontend ruft sie noch nicht. Null User-Impact.
Deploy-Schritte: Apps Script Editor → neue Bereitstellung erstellen (HEAD ist NICHT ok).
Verifikation: im Editor Smoke-Funktionen laufen lassen (testHeuristik_, smokeTest_kiEndpoint).
```

- [ ] **Step 11.2: Commit HANDOFF-Update + Branch auf preview pushen**

```bash
git add ExamLab/HANDOFF.md
git commit -m "HANDOFF: S130 Phase 2 Deploy 1 Anleitung"
git push origin feature/ki-kalibrierung:preview --force-with-lease
```

- [ ] **Step 11.3: User testet — abwarten bis Freigabe**

User deployed + smoke-testet. Fixes bei Fehlern: neue Commits auf feature-Branch, preview re-push.

---

## Phase 3 — Frontend-Service-Layer + Hook

### Task 12 — Service-Signatur erweitern (EditorServices + apiService)

**Files:**
- Modify: `packages/shared/src/editor/types.ts` (EditorServices)
- Modify: `packages/shared/src/editor/useKIAssistent.ts`
- Modify: `ExamLab/src/services/uploadApi.ts` (Frontend-seitige kiAssistent-Funktion)

- [ ] **Step 12.1: Test schreiben für Rückgabe-Typ**

`packages/shared/src/editor/useKIAssistent.test.ts` (falls nicht existiert, erstellen):

```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKIAssistent } from './useKIAssistent'
import { EditorProvider } from './EditorContext'
// ...setup mit config + services mock
// Test: wenn services.kiAssistent `{ ergebnis: {...}, feedbackId: 'fb_123' }` zurückgibt,
// dann ki.ergebnisse[aktion]?.daten enthält ergebnis UND offeneKIFeedbacks enthält Eintrag
```

Konkret: mock `services.kiAssistent` der neuen Signatur, prüfe `ki.offeneKIFeedbacks` nach `ausfuehren`.

- [ ] **Step 12.2: Test ausführen — FAIL**

```bash
cd ExamLab && npx vitest run packages/shared/src/editor/useKIAssistent.test.ts
```

Erwartet: FAIL weil der Hook offeneKIFeedbacks noch nicht hat.

- [ ] **Step 12.3: Typ-Änderung in types.ts**

```ts
/** Rückgabe-Shape aus kiAssistent-Service (Breaking Change Spec 8.1) */
export interface KIAssistentRueckgabe {
  ergebnis: Record<string, unknown>
  feedbackId?: string  // nur bei instrumentierten Aktionen
}

export interface EditorServices {
  // ...
  kiAssistent?: (aktion: string, daten: Record<string, unknown>) => Promise<KIAssistentRueckgabe | null>
  /** NEU: Markiert offenen Feedback-Eintrag als ignoriert (fire-and-forget) */
  markiereFeedbackAlsIgnoriert?: (feedbackId: string) => Promise<void>
}
```

- [ ] **Step 12.4: `uploadApi.kiAssistent` Rückgabe-Typ ändern**

```ts
export async function kiAssistent(email: string, aktion: string, daten: Record<string, unknown>): Promise<KIAssistentRueckgabe | null> {
  // ...existing fetch...
  if (data.success) {
    return { ergebnis: data.daten, feedbackId: data.feedbackId }
  }
  return null
}
```

- [ ] **Step 12.5: Neue `markiereFeedbackAlsIgnoriert`-Funktion in uploadApi**

```ts
export async function markiereFeedbackAlsIgnoriert(email: string, feedbackId: string): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'markiereKIFeedbackAlsIgnoriert', email, feedbackId })
    })
  } catch (e) { console.warn('[API] markiereFeedbackAlsIgnoriert:', e) }
}
```

In `apiService.ts` re-exportieren.

- [ ] **Step 12.6: PruefungFragenEditor + UebenEditorProvider — Service-Adapter angleichen**

`ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx` Zeile ~84:

```ts
kiAssistent: async (aktion: string, daten: Record<string, unknown>) => {
  if (!user) return null
  return apiKiAssistent(user.email, aktion, daten)  // returns KIAssistentRueckgabe | null
},
markiereFeedbackAlsIgnoriert: async (feedbackId: string) => {
  if (!user) return
  return apiMarkiereIgnoriert(user.email, feedbackId)
},
```

Analog `ExamLab/src/components/ueben/admin/UebenEditorProvider.tsx` — gleicher Hook.

- [ ] **Step 12.7: tsc grün prüfen**

```bash
cd ExamLab && npx tsc -b
```

Erwartet: Build grün. Alle Verwender von `services.kiAssistent` müssen neue Shape behandeln — wird Compile-Error zeigen an Stellen, die `result.fachbereich` direkt lasen statt `result.ergebnis.fachbereich`. Schrittweise fixen.

- [ ] **Step 12.8: Commit**

```bash
git add packages/shared/src/editor/types.ts packages/shared/src/editor/useKIAssistent.ts \
        ExamLab/src/services/uploadApi.ts ExamLab/src/services/apiService.ts \
        ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx \
        ExamLab/src/components/ueben/admin/UebenEditorProvider.tsx
git commit -m "Service-Signatur: kiAssistent liefert {ergebnis, feedbackId?}

Breaking Change (Spec B1). Beide Host-Apps angepasst. Neuer Service
markiereFeedbackAlsIgnoriert (fire-and-forget). Bestehender Code der
das ergebnis-Feld liest, ist angepasst."
```

---

### Task 13 — useKIAssistent Hook: offeneKIFeedbacks + Race-Handling

**Files:**
- Modify: `packages/shared/src/editor/useKIAssistent.ts`

- [ ] **Step 13.1: Tests erweitern**

Zusätzliche Cases in `useKIAssistent.test.ts`:
- Zweimaliger `ausfuehren` derselben Aktion → erster feedbackId wird via `markiereFeedbackAlsIgnoriert` fire-and-forget geschlossen
- `markiereWichtig(aktion, true)` setzt `wichtig` nur auf den einen offenen Eintrag
- `alleOffenenFeedbacks()` liefert Array
- `reset()` leert Array

- [ ] **Step 13.2: Hook-Implementierung**

```ts
// useKIAssistent.ts — bestehende Struktur beibehalten, ergänzen:
const [offeneKIFeedbacks, setOffeneKIFeedbacks] = useState<Array<{aktion: string; feedbackId: string; wichtig: boolean}>>([])

async function ausfuehren(aktion: string, daten: Record<string, unknown>) {
  // Race-Handling (Spec 8.1 B2): alter offener Eintrag derselben Aktion → ignoriert
  const alt = offeneKIFeedbacks.find(f => f.aktion === aktion)
  if (alt && services.markiereFeedbackAlsIgnoriert) {
    void services.markiereFeedbackAlsIgnoriert(alt.feedbackId)
  }
  setOffeneKIFeedbacks(prev => prev.filter(f => f.aktion !== aktion))

  setLadeAktion(aktion)
  try {
    const res = await services.kiAssistent?.(aktion, daten)
    if (!res) { setLadeAktion(null); return null }
    setErgebnisse(prev => ({ ...prev, [aktion]: { daten: res.ergebnis, zeitstempel: Date.now() } }))
    if (res.feedbackId) {
      setOffeneKIFeedbacks(prev => [...prev, { aktion, feedbackId: res.feedbackId!, wichtig: false }])
    }
    return res.ergebnis
  } finally { setLadeAktion(null) }
}

function markiereWichtig(aktion: string, wert: boolean) {
  setOffeneKIFeedbacks(prev => prev.map(f => f.aktion === aktion ? { ...f, wichtig: wert } : f))
}

function alleOffenenFeedbacks() { return offeneKIFeedbacks }

function reset() { setOffeneKIFeedbacks([]); setErgebnisse({}) }

// In return: offeneKIFeedbacks, markiereWichtig, alleOffenenFeedbacks, reset
```

- [ ] **Step 13.3: Tests laufen lassen — PASS**

```bash
cd ExamLab && npx vitest run packages/shared/src/editor/useKIAssistent.test.ts
```

- [ ] **Step 13.4: Gesamt-Test + Build grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

Erwartet: 455/455 + neue Hook-Tests grün.

- [ ] **Step 13.5: Commit**

```bash
git add packages/shared/src/editor/useKIAssistent.ts packages/shared/src/editor/useKIAssistent.test.ts
git commit -m "useKIAssistent: offeneKIFeedbacks-Lifecycle + Race-Handling

Mehrfach-Klick auf gleiche Aktion (Spec B2): vorheriger offener
Eintrag wird via markiereFeedbackAlsIgnoriert (fire-and-forget)
geschlossen. markiereWichtig/alleOffenenFeedbacks/reset neu."
```

---

## Phase 4 — Editor-UI (Stern + Save)

### Task 14 — ErgebnisAnzeige Stern-Toggle

**Files:**
- Modify: `packages/shared/src/editor/ki/KIBausteine.tsx`

- [ ] **Step 14.1: Neue Props für ErgebnisAnzeige**

`ErgebnisAnzeige` bekommt zwei optional Props:

```ts
interface Props {
  // ...existing
  wichtig?: boolean
  onWichtigToggle?: () => void
}
```

- [ ] **Step 14.2: Stern-Button in Render**

Im Header über „Übernehmen/Verwerfen":

```tsx
{onWichtigToggle && (
  <button
    onClick={onWichtigToggle}
    className={wichtig ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-amber-400'}
    title={wichtig ? 'Als wichtiges Trainings-Beispiel markiert (Klick = entfernen)' : 'Als wichtiges Trainings-Beispiel markieren — fliesst priorisiert in künftige KI-Vorschläge'}
    aria-label={wichtig ? 'Stern entfernen' : 'Als wichtig markieren'}
  >
    {wichtig ? '★' : '☆'}
  </button>
)}
```

- [ ] **Step 14.3: In MetadataSection + allen Callsites Prop durchreichen**

`packages/shared/src/editor/sections/MetadataSection.tsx` — `ErgebnisAnzeige` für `klassifiziereFrage`:

```tsx
<ErgebnisAnzeige
  // ...existing
  wichtig={ki.offeneKIFeedbacks.find(f => f.aktion === 'klassifiziereFrage')?.wichtig ?? false}
  onWichtigToggle={() => {
    const cur = ki.offeneKIFeedbacks.find(f => f.aktion === 'klassifiziereFrage')
    ki.markiereWichtig('klassifiziereFrage', !(cur?.wichtig ?? false))
  }}
/>
```

Analog für die anderen 3 instrumentierten Aktionen wo `ErgebnisAnzeige` gerendert wird: `MusterloesungSection` (generiereMusterloesung), `BewertungsrasterEditor` (bewertungsrasterGenerieren). `korrigiereFreitext` kommt in Phase 5.

- [ ] **Step 14.4: Build + Tests grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 14.5: Commit**

```bash
git add packages/shared/src/editor/ki/KIBausteine.tsx \
        packages/shared/src/editor/sections/MetadataSection.tsx \
        packages/shared/src/editor/sections/MusterloesungSection.tsx \
        packages/shared/src/editor/typen/BewertungsrasterEditor.tsx
git commit -m "ErgebnisAnzeige: Stern-Toggle für Kalibrierungs-Boost

Zustand kommt aus useKIAssistent.offeneKIFeedbacks. Eingehängt in
MetadataSection (klassifiziereFrage), MusterloesungSection und
BewertungsrasterEditor. Korrektur-Stern in Task 16."
```

---

### Task 15 — SharedFragenEditor: offeneKIFeedbacks beim Save + markiereIgnoriert beim Verwerfen

**Files:**
- Modify: `packages/shared/src/editor/SharedFragenEditor.tsx`

- [ ] **Step 15.1: In `handleSpeichern` (Abschnitt `onSpeichern(frage)`) offeneKIFeedbacks mitsenden**

Save-Payload muss `offeneKIFeedbacks` enthalten. Der Host (PruefungFragenEditor → `onSpeichern`) leitet an `apiService.speichereFrage` weiter.

Im `handleSpeichern`:

```ts
async function handleSpeichern() {
  // ...existing validation + build frage object
  const feedbacks = ki.alleOffenenFeedbacks()
  // Der Host entscheidet, ob er das Feld in den Save-Call packt.
  // Pattern: eine neue Meta-Prop auf onSpeichern.
  await onSpeichern(frage, { offeneKIFeedbacks: feedbacks })
  ki.reset()
}
```

Dazu `onSpeichern`-Signatur erweitern (Breaking Change, aber lokal, nur 2 Hosts):

```ts
onSpeichern: (frage: Frage, meta?: { offeneKIFeedbacks?: Array<{aktion: string; feedbackId: string; wichtig: boolean}> }) => void
```

Host-Adapter (PruefungFragenEditor, UebenEditorProvider) leiten `meta.offeneKIFeedbacks` im API-Call weiter.

- [ ] **Step 15.2: `onVerwerfen`-Handler in ErgebnisAnzeige erweitert**

Wenn LP „Verwerfen" klickt: zusätzlich `services.markiereFeedbackAlsIgnoriert(feedbackId)` fire-and-forget, + Eintrag aus `ki.offeneKIFeedbacks` entfernen.

Neuer Hook-Helper:
```ts
function verwerfen(aktion: string) {
  const fb = offeneKIFeedbacks.find(f => f.aktion === aktion)
  if (fb) {
    services.markiereFeedbackAlsIgnoriert?.(fb.feedbackId)
    setOffeneKIFeedbacks(prev => prev.filter(f => f.aktion !== aktion))
  }
  setErgebnisse(prev => { const n = { ...prev }; delete n[aktion]; return n })
}
```

Ersetzt bisherigen `verwerfen`-Handler.

- [ ] **Step 15.3: Build + Tests**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 15.4: Commit**

```bash
git add packages/shared/src/editor/SharedFragenEditor.tsx \
        packages/shared/src/editor/useKIAssistent.ts \
        ExamLab/src/components/lp/frageneditor/PruefungFragenEditor.tsx \
        ExamLab/src/components/ueben/admin/UebenEditorProvider.tsx
git commit -m "Save-Pfad: offeneKIFeedbacks an Backend, Verwerfen markiert ignoriert

onSpeichern-Signatur um meta.offeneKIFeedbacks erweitert. Beide Host-
Adapter reichen das an speichereFrage durch. Verwerfen ruft zusätzlich
markiereFeedbackAlsIgnoriert fire-and-forget."
```

---

## Phase 5 — Korrektur-UI

### Task 16 — KorrekturFrageZeile: feedbackId + Stern + Persistenz

**Files:**
- Modify: `ExamLab/src/components/lp/korrektur/KorrekturFrageZeile.tsx` (Zeilen 72–110 + Save-Pfad)

- [ ] **Step 16.1: `handleKiVorschlag` — feedbackId aufnehmen**

```ts
async function handleKiVorschlag() {
  // ...existing
  const res = await apiService.kiAssistent(userEmail, 'korrigiereFreitext', {...})
  if (!res) return
  const { ergebnis, feedbackId } = res
  onUpdate({
    kiPunkte: ergebnis.punkte as number,
    kiBegruendung: ergebnis.begruendung as string,
    kriterienBewertung: ergebnis.kriterienBewertung,
    _offeneKIFeedbackId: feedbackId,
    _kiWichtig: false
  })
}
```

- [ ] **Step 16.2: Stern-UI neben KI-Vorschlag-Anzeige**

```tsx
{kiPunkte != null && _offeneKIFeedbackId && (
  <button
    onClick={() => onUpdate({ _kiWichtig: !_kiWichtig })}
    className={_kiWichtig ? 'text-amber-500' : 'text-slate-400 hover:text-amber-400'}
    title={_kiWichtig ? 'Als wichtig markiert' : 'Für künftige Korrekturen als wichtig markieren'}
  >
    {_kiWichtig ? '★' : '☆'}
  </button>
)}
```

- [ ] **Step 16.3: Save-Payload um offeneKIFeedbacks + KI-Felder erweitern**

Im Save-Handler (vmtl. `speichereKorrekturZeile`-Call):

```ts
const payload = {
  email: userEmail,
  pruefungId, schuelerEmail, frageId,
  lpPunkte, lpKommentar, geprueft,
  audioKommentarId,
  kiPunkte, kiBegruendung, kriterienBewertung,
  quelle: lpPunkte !== null && lpPunkte !== kiPunkte ? 'manuell' : (kiPunkte !== null ? 'ki' : 'manuell'),
  offeneKIFeedbacks: _offeneKIFeedbackId ? [{ feedbackId: _offeneKIFeedbackId, wichtig: !!_kiWichtig }] : [],
  maxPunkte: frage.punkte
}
await apiService.speichereKorrekturZeile(payload)
```

Nach Erfolg: `onUpdate({ _offeneKIFeedbackId: undefined, _kiWichtig: false })`.

- [ ] **Step 16.4: Build + tsc grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 16.5: Commit**

```bash
git add ExamLab/src/components/lp/korrektur/KorrekturFrageZeile.tsx
git commit -m "Korrektur: feedbackId-Lifecycle + Stern + Save-Persistenz

handleKiVorschlag nimmt jetzt {ergebnis, feedbackId} entgegen.
Stern-Toggle am KI-Vorschlag. Save-Payload sendet offeneKIFeedbacks +
kiPunkte/kiBegruendung/kriterienBewertung/quelle ans Backend — behebt
Persistenz-Bug aus Audit (kiPunkte wurden bisher nie gespeichert)."
```

---

## Phase 6 — Settings-Tab (3 Sub-Tabs)

### Task 17 — Skeleton + Tab-Registrierung

**Files:**
- Create: `ExamLab/src/components/settings/kiKalibrierung/KIKalibrierungTab.tsx`
- Create: `ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx` (Placeholder)
- Create: `ExamLab/src/components/settings/kiKalibrierung/StatistikKarten.tsx` (Placeholder)
- Create: `ExamLab/src/components/settings/kiKalibrierung/EinstellungenPanel.tsx` (Placeholder)
- Modify: `ExamLab/src/components/settings/EinstellungenPanel.tsx`
- Modify: `ExamLab/src/store/lpUIStore.ts` (EinstellungenTab-Union)

- [ ] **Step 17.1: EinstellungenTab-Union erweitern**

```ts
// lpUIStore.ts
export type EinstellungenTab = 'profil' | 'lernziele' | 'favoriten' | 'uebungen' | 'admin' | 'kiKalibrierung'
```

- [ ] **Step 17.2: Skeleton-Komponente**

```tsx
// KIKalibrierungTab.tsx
import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import BeispieleListe from './BeispieleListe'
import StatistikKarten from './StatistikKarten'
import KalibrierungsEinstellungen from './EinstellungenPanel'

type Sub = 'beispiele' | 'statistik' | 'einstellungen'
const TABS = [
  { id: 'beispiele' as Sub, label: 'Beispiele' },
  { id: 'statistik' as Sub, label: 'Statistik' },
  { id: 'einstellungen' as Sub, label: 'Einstellungen' },
]

export default function KIKalibrierungTab({ email }: { email: string }) {
  const [sub, setSub] = useState<Sub>('statistik')
  return (
    <div className="space-y-4">
      <TabBar tabs={TABS} activeTab={sub} onTabChange={(id) => setSub(id as Sub)} size="sm" />
      {sub === 'beispiele' && <BeispieleListe email={email} />}
      {sub === 'statistik' && <StatistikKarten email={email} />}
      {sub === 'einstellungen' && <KalibrierungsEinstellungen email={email} />}
    </div>
  )
}
```

Placeholders (BeispieleListe, StatistikKarten, EinstellungenPanel) geben einfach `<p>TODO Task N</p>` zurück.

- [ ] **Step 17.3: Tab in EinstellungenPanel.tsx einhängen**

```tsx
// EinstellungenPanel.tsx
import KIKalibrierungTab from './kiKalibrierung/KIKalibrierungTab'
// ...in tabs-Array:
{ key: 'kiKalibrierung', label: 'KI-Kalibrierung', sichtbar: true },
// ...in Tab-Rendering-Block:
{tab === 'kiKalibrierung' && user?.email && <KIKalibrierungTab email={user.email} />}
```

- [ ] **Step 17.4: tsc + vitest grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 17.5: Commit**

```bash
git add ExamLab/src/components/settings/kiKalibrierung/ \
        ExamLab/src/components/settings/EinstellungenPanel.tsx \
        ExamLab/src/store/lpUIStore.ts
git commit -m "Settings-Tab Skeleton: KI-Kalibrierung mit 3 Sub-Tabs

Placeholder-Komponenten für Beispiele/Statistik/Einstellungen — echter
Inhalt in Tasks 18-20."
```

---

### Task 18 — Einstellungen-Sub-Tab (Master-Toggle + Aktion-Toggles + Werte + Aufräumen)

**Files:**
- Modify: `ExamLab/src/components/settings/kiKalibrierung/EinstellungenPanel.tsx`
- Create: `ExamLab/src/services/kalibrierungApi.ts` (Client-Layer für die 7 neuen Endpoints)

- [ ] **Step 18.1: API-Client für Kalibrierung**

```ts
// kalibrierungApi.ts
import { APPS_SCRIPT_URL } from './apiService'

export type KalibrierungsEinstellungen = {
  global: boolean
  aktionenAktiv: { generiereMusterloesung: boolean; klassifiziereFrage: boolean; bewertungsrasterGenerieren: boolean; korrigiereFreitext: boolean }
  minBeispiele: number
  beispielAnzahl: number
  zeigeQuotaWarnung?: boolean
}

async function post<T>(body: Record<string, unknown>): Promise<T | null> {
  try {
    const r = await fetch(APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(body) })
    const j = await r.json()
    return j.success ? (j.data ?? (true as unknown as T)) : null
  } catch (e) { console.error('[kalibrierung]', e); return null }
}

export const kalibrierungApi = {
  ladeEinstellungen: (email: string) => post<KalibrierungsEinstellungen>({ action: 'kalibrierungsEinstellungen', modus: 'laden', email }),
  speichereEinstellungen: (email: string, konfig: KalibrierungsEinstellungen) => post<boolean>({ action: 'kalibrierungsEinstellungen', modus: 'speichern', email, konfig }),
  listeFeedbacks: (email: string, filter = {}, seite = 0, proSeite = 50) => post<{ eintraege: any[]; gesamt: number }>({ action: 'listeKIFeedbacks', email, filter, seite, proSeite }),
  aktualisiereFeedback: (email: string, feedbackId: string, changes: { wichtig?: boolean; aktiv?: boolean }) => post<boolean>({ action: 'aktualisiereKIFeedback', email, feedbackId, ...changes }),
  loescheFeedback: (email: string, feedbackId: string) => post<boolean>({ action: 'loescheKIFeedback', email, feedbackId }),
  bulkLoesche: (email: string, filter: Record<string, unknown>) => post<{ geloescht: number }>({ action: 'bulkLoescheKIFeedbacks', email, filter }),
  statistik: (email: string, zeitraum_tage = 30) => post<{ aktionen: Record<string, { vorschlaege: number; unveraendert: number; leicht: number; deutlich: number; verworfen: number; aktive: number; wichtige: number }>; zeitraum_tage: number }>({ action: 'kalibrierungsStatistik', email, zeitraum_tage }),
}
```

- [ ] **Step 18.2: EinstellungenPanel (Sub-Tab) — Master-Toggle + Pro-Aktion + Werte**

Implementiert alle Elemente aus Spec 8.3 „Einstellungen-Tab":

```tsx
// EinstellungenPanel.tsx (der Kalibrierungs-Sub-Tab, nicht der Haupt-Settings-Panel!)
export default function KalibrierungsEinstellungen({ email }: { email: string }) {
  const [konfig, setKonfig] = useState<KalibrierungsEinstellungen | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { kalibrierungApi.ladeEinstellungen(email).then(setKonfig) }, [email])

  if (!konfig) return <p className="text-slate-500">Lädt…</p>

  function update(patch: Partial<KalibrierungsEinstellungen>) {
    const neu = { ...konfig!, ...patch }
    setKonfig(neu)
    setSaving(true)
    kalibrierungApi.speichereEinstellungen(email, neu).finally(() => setSaving(false))
  }

  return (
    <div className="space-y-6">
      {konfig.zeigeQuotaWarnung && (
        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
          KI-Kalibrierung wurde wegen API-Quota automatisch deaktiviert. Bitte prüfe deine Anthropic-Kosten bevor du wieder aktivierst.
        </div>
      )}

      {/* Master-Toggle */}
      <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
        <input type="checkbox" checked={konfig.global} onChange={e => update({ global: e.target.checked })} />
        <span className="font-medium">KI-Kalibrierung aktiv</span>
        <span className="text-xs text-slate-500 ml-auto">Kill-Switch: stoppt Few-Shot + Logging</span>
      </label>

      {/* Pro-Aktion */}
      <fieldset disabled={!konfig.global} className={konfig.global ? '' : 'opacity-50'}>
        <legend className="text-sm font-semibold mb-2">Aktiv für Aktionen</legend>
        {(['generiereMusterloesung','klassifiziereFrage','bewertungsrasterGenerieren','korrigiereFreitext'] as const).map(a => (
          <label key={a} className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={konfig.aktionenAktiv[a]} onChange={e => update({ aktionenAktiv: { ...konfig.aktionenAktiv, [a]: e.target.checked } })} />
            <span>{aktionLabel(a)}</span>
          </label>
        ))}
      </fieldset>

      {/* Werte */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600 dark:text-slate-300">Minimum Beispiele (bevor Kalibrierung greift)</span>
          <input type="number" min={0} max={20} value={konfig.minBeispiele}
                 onChange={e => update({ minBeispiele: parseInt(e.target.value) || 0 })}
                 className="input-field" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600 dark:text-slate-300">Beispiele pro KI-Call</span>
          <select value={konfig.beispielAnzahl} onChange={e => update({ beispielAnzahl: parseInt(e.target.value) })} className="input-field">
            <option value={3}>3</option><option value={5}>5</option><option value={10}>10</option>
          </select>
        </label>
      </div>

      {/* Aufräumen */}
      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-semibold">Aufräumen</h4>
        <button onClick={() => bulkLoeschen('ignoriert')} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50">Alle ignorierten löschen</button>
        <button onClick={() => bulkLoeschenAeltere(180)} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50 ml-2">Älter als 180 Tage löschen</button>
      </div>

      {/* Ansatz-3 Placeholder */}
      <div className="space-y-2 border-t pt-4 opacity-60">
        <h4 className="text-sm font-semibold">Ausblick: Teilen (noch nicht verfügbar)</h4>
        <label className="flex items-center gap-2"><input type="checkbox" disabled /> Mit Fachschaft teilen</label>
        <label className="flex items-center gap-2"><input type="checkbox" disabled /> Schulweit teilen</label>
      </div>

      {saving && <p className="text-xs text-slate-400">Speichern…</p>}
    </div>
  )

  async function bulkLoeschen(status: string) {
    if (!confirm(`Alle Einträge mit Status "${status}" löschen?`)) return
    await kalibrierungApi.bulkLoesche(email, { status })
  }
  async function bulkLoeschenAeltere(tage: number) {
    if (!confirm(`Alle Einträge älter als ${tage} Tage löschen?`)) return
    const iso = new Date(Date.now() - tage*86400*1000).toISOString()
    await kalibrierungApi.bulkLoesche(email, { aelter_als: iso })
  }
}

function aktionLabel(a: string): string {
  return {
    generiereMusterloesung: 'Musterlösung generieren',
    klassifiziereFrage: 'Frage klassifizieren (Fach/Thema/Bloom)',
    bewertungsrasterGenerieren: 'Bewertungsraster generieren',
    korrigiereFreitext: 'Freitext-Korrektur (Punkte/Begründung)'
  }[a] ?? a
}
```

- [ ] **Step 18.3: Test für Speicher-Verhalten (Debounce beobachten nicht nötig; reicht Load→Update→Save)**

```ts
// KalibrierungsEinstellungen.test.tsx
// Mock fetch, render mit MemoryRouter + fakeUser
// Prüfen: Master-Toggle ändert → kalibrierungApi.speichereEinstellungen wird aufgerufen
```

- [ ] **Step 18.4: Build + Tests grün**

```bash
cd ExamLab && npx tsc -b && npx vitest run
```

- [ ] **Step 18.5: Commit**

```bash
git add ExamLab/src/components/settings/kiKalibrierung/EinstellungenPanel.tsx \
        ExamLab/src/services/kalibrierungApi.ts
git commit -m "Einstellungen-Sub-Tab: Master-Toggle + Pro-Aktion + Werte + Aufräumen

Ansatz-3-Teilen-Placeholder readonly. Quota-Warn-Banner wenn letzter
Quota-Fehler < 24h alt."
```

---

### Task 19 — Statistik-Sub-Tab

**Files:**
- Modify: `ExamLab/src/components/settings/kiKalibrierung/StatistikKarten.tsx`

- [ ] **Step 19.1: Komponente implementieren**

```tsx
export default function StatistikKarten({ email }: { email: string }) {
  const [tage, setTage] = useState(30)
  const [stats, setStats] = useState<Awaited<ReturnType<typeof kalibrierungApi.statistik>>>(null)

  useEffect(() => { kalibrierungApi.statistik(email, tage).then(setStats) }, [email, tage])
  if (!stats) return <p className="text-slate-500">Lädt…</p>

  const gesamt = Object.values(stats.aktionen).reduce((s, a) => s + a.vorschlaege, 0)
  const unveraendertAbs = Object.values(stats.aktionen).reduce((s, a) => s + a.unveraendert, 0)
  const rate = gesamt > 0 ? Math.round(100 * unveraendertAbs / gesamt) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Zeitraum:</span>
        <select value={tage} onChange={e => setTage(parseInt(e.target.value))} className="input-field-narrow">
          <option value={7}>7 Tage</option><option value={30}>30 Tage</option><option value={90}>90 Tage</option>
        </select>
      </div>
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800">
        <p className="text-sm">Akzeptanz-Trend: <strong>{rate}%</strong> unverändert übernommen ({unveraendertAbs} von {gesamt} Vorschlägen)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(stats.aktionen).map(([a, s]) => (
          <div key={a} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-semibold">{aktionLabel(a)}</h4>
            <p className="text-xs text-slate-500">Letzte {tage} Tage: {s.vorschlaege} Vorschläge</p>
            <ul className="text-sm space-y-1">
              <li>✓ unverändert übernommen: {s.unveraendert} ({pct(s.unveraendert, s.vorschlaege)})</li>
              <li>≈ leicht angepasst: {s.leicht} ({pct(s.leicht, s.vorschlaege)})</li>
              <li>⚠ deutlich umgeschrieben: {s.deutlich} ({pct(s.deutlich, s.vorschlaege)})</li>
              <li>✗ verworfen: {s.verworfen} ({pct(s.verworfen, s.vorschlaege)})</li>
            </ul>
            <p className="text-xs text-slate-500 pt-2 border-t">Aktive Trainings-Beispiele: <strong>{s.aktive}</strong> ({s.wichtige} wichtig)</p>
          </div>
        ))}
      </div>
      {/* Ansatz-3-Placeholder */}
      <div className="p-4 rounded-xl border border-dashed border-slate-300 opacity-60">
        <p className="text-sm">Details zu Few-Shot-Verwendung (noch nicht verfügbar — benötigt Embedding-Infrastruktur)</p>
      </div>
    </div>
  )
}
function pct(x: number, ges: number) { return ges ? Math.round(100*x/ges) + '%' : '—' }
```

- [ ] **Step 19.2: Build + Tests grün + Commit**

```bash
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/settings/kiKalibrierung/StatistikKarten.tsx
git commit -m "Statistik-Sub-Tab: pro-Aktion Karten + Akzeptanz-Trend

Globales Trend-Summary (unverändert-Rate), pro Aktion Kartenzahl-Breakdown,
Ansatz-3-Placeholder für Few-Shot-Details unten."
```

---

### Task 20 — Beispiele-Sub-Tab (Liste + Diff-Modal + Stern/Aktiv/Löschen)

**Files:**
- Modify: `ExamLab/src/components/settings/kiKalibrierung/BeispieleListe.tsx`
- Create: `ExamLab/src/components/settings/kiKalibrierung/DiffModal.tsx`

- [ ] **Step 20.1: Liste-Komponente mit Filter + Pagination**

Gem. Spec Abschnitt 8.3 „Beispiele-Tab": Tabelle mit Spalten, Filter oben, klickbare „KI → LP"-Vorschau öffnet Diff-Modal, Stern/🗑/⊘ Aktionen pro Zeile. `aktualisiereFeedback`/`loescheFeedback`-Calls.

- [ ] **Step 20.2: Diff-Modal**

Zwei-Spalten-Layout (links `kiOutputJson`, rechts `finaleVersionJson`), JSON-rendered als formatiert-vorhandener Key/Value. Einfache Text-Hervorhebung für geänderte Zeilen — kann mit `diff`-Paket oder manuellem Compare.

- [ ] **Step 20.3: Build + Tests grün + Commit**

```bash
cd ExamLab && npx tsc -b && npx vitest run
git add ExamLab/src/components/settings/kiKalibrierung/
git commit -m "Beispiele-Sub-Tab: Liste + Filter + Pagination + Diff-Modal

Aktionen pro Zeile: Stern toggeln, Aktiv toggeln, Löschen mit Confirm.
Diff-Modal zeigt ki/lp nebeneinander."
```

---

## Phase 7 — Final Deploy + E2E

### Task 21 — **Deploy-Runde 2** (Frontend live)

Analog Task 11: HANDOFF aktualisieren, push auf preview.

### Task 22 — E2E mit echten Logins (inkl. N2 Header-Migration)

**Files:** Test-Plan als separates Dokument in `ExamLab/docs/superpowers/plans/2026-04-20-ki-kalibrierung-testplan.md` für User-Durchführung.

- [ ] **Step 22.1: Testplan erstellen**

Zu testende Pfade (LP-Login):
1. **Header-Migration (N2):** Vor Deploy Apps-Script-Editor: prüfe `KIFeedback`-Sheet existiert nicht. Nach Deploy + erstem KI-Call → Sheet existiert, alle 17 Header. `Korrektur_`-Sheet einer alten Prüfung: vor Deploy → kein `kriterienBewertung`-Header, nach erstem Korrektur-Save → Header am rechten Rand ergänzt.
2. **Editor-Flow (Musterlösung):** Neue Frage → KI-Vorschlag holen → `offen`-Eintrag im Sheet. Übernehmen → Edit → Save → `geschlossen`, `qualifiziert`, finaleVersion gespeichert.
3. **Mehrfach-Klick (B2):** Zweimal „Generiere Musterlösung" ohne Save. Erster Eintrag → `ignoriert`, zweiter bleibt offen.
4. **Verwerfen:** KI-Call → Verwerfen → Eintrag `ignoriert`.
5. **Stern-Flag:** KI-Call → ★ klicken → Save. Eintrag im Sheet hat `wichtig=TRUE`.
6. **Korrektur-Flow:** Freitext-SuS-Antwort öffnen → KI-Korrektur → Anpassen → Save. `kiPunkte`/`kriterienBewertung` jetzt persistent (nicht mehr verloren bei Reload).
7. **Few-Shot aktiv nach min=3:** Master-AN + min=3 setzen. Erst 3 Musterlösungen qualifizieren → 4. KI-Call zeigt Few-Shot in Claude-Response-Style. Vergleich mit min=10 (würde keinen FewShot haben).
8. **Settings-Tab komplette Navigation:** Alle 3 Sub-Tabs. Master-Toggle aus → KI-Call in Editor erzeugt KEINEN Eintrag.
9. **Quota-Watchdog (N1):** (Schwer zu simulieren — nur Log-Check in Apps-Script-Editor: bei Quota-Fehler wird `global=false` gesetzt).
10. **Bulk-Löschen:** Alle ignorierten löschen → Liste kleiner, Audit-Log sichtbar.

- [ ] **Step 22.2: User testet, Bugs in neue Commits auf feature-Branch, push auf preview**

- [ ] **Step 22.3: Freigabe → Merge auf main**

```bash
git checkout main && git pull
git merge --no-ff feature/ki-kalibrierung -m "Merge KI-Kalibrierung v1 (Spec 2026-04-20)"
git push origin main
git branch -d feature/ki-kalibrierung
```

- [ ] **Step 22.4: Memory + HANDOFF aktualisieren**

Bestehende Pattern: S130-Eintrag in MEMORY.md + Lehren aus Build in code-quality.md.

---

## Lernschleife-Punkte (nach Feature-Release)

Gemäss `.claude/rules/lernschleife.md` dokumentieren:
- Wenn Few-Shot-Block-Token-Cap tatsächlich greift → Heuristik-Verfeinerung als Rule
- Wenn LP Kalibrierung nicht mehr einschaltet nach Probe → UX-Lehre (Onboarding fehlt?)
- Wenn Apps-Script-Quota tatsächlich fliegt → Pattern für Auto-Disable als Rule

---

## Rollback-Plan

Bei Problem nach Merge:
```bash
git revert -m 1 <merge-commit-hash>   # Revert des Merges
git push origin main
```

Apps-Script-Bereitstellung: vorherige Version über „Bereitstellungen verwalten" aktivieren. Das Feature ist via Master-Toggle Default-AUS → selbst wenn Code live ist, passiert nichts, solange LP nicht aktiviert. Rollback selten nötig; Master-Toggle ist der erste Reflex.
