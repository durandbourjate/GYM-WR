# Multi-MC-Sanierung: Distraktoren-Längen-Tell — Implementierungsplan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement Teil A. Teil B ist ein LP-geführter operativer Ablauf (kein Subagent). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den Distraktoren-Längen-Tell in den geschätzt 60–100 Multi-MC-Fragen der „roten Zone" beseitigen — sodass die Heuristik „wähle die längsten k Optionen" nicht mehr systematisch besser als Zufall trifft.

**Architecture:** Apps-Script macht die deterministische Sheet-Mechanik (Phase 0: Tell-Score-Diagnose + rote Zone planen + Review-Tab bauen; Phase 3: freigegebene Distraktoren zurückschreiben). Claude Code (Abo) macht die KI-Arbeit (Phase 1: neue Distraktoren generieren mit Soll-Länge ≈ Ø-Korrekt; Phase 2: unabhängiger Checker). Eine CSV des `MC-Sanierung-Multi-Review`-Tabs ist die Brücke zwischen beiden.

**Tech Stack:** Google Apps Script (V8-Runtime, reines JS), Google Sheets, Claude Code (Abo — keine Anthropic-API). Verifikation: `node --check`, `DRY_RUN`, Logger-Ausgabe, das Review-Sheet als inspizierbares Artefakt, der Diagnose-Re-Run.

Spec: [`ExamLab/docs/superpowers/specs/2026-05-23-multi-mc-sanierung-design.md`](../specs/2026-05-23-multi-mc-sanierung-design.md).

---

## Ausgangslage — was schon existiert

| Datei | Stand | Bezug zu diesem Plan |
|---|---|---|
| `ExamLab/scripts/diagnose-mc-laengste-antwort.js` | `diagnoseMcLaengsteAntwort()` + `diagnoseMcMultiLaenge()` (Commit `1aadc1d`) | Wird in Task A1 um `diagnoseMcMultiTellScore()` erweitert. Bestehende Funktionen bleiben unverändert. |
| `ExamLab/scripts/sanierung-mc-distraktoren.js` | Single-MC-Pipeline auf `main` (Merge `a79b0a5`) | Quelle für Helfer-Code (`textLaenge_`, `sicherJsonParse_`, `leseMcOptionen_` etc.) — wird per Copy-Paste übernommen, nicht referenziert. NICHT angefasst. |
| `ExamLab/apps-script-code.js` | KI-Prompt-Constraint live für Single-MC (`generiereOptionen` + `generiereDistraktoren`) | **Kein Eingriff.** Diese Endpoints sind Single-MC-spezifisch (1 von 4 korrekt). Für Multi-MC existiert heute kein KI-Generations-Endpoint, daher ist Prevention für Multi-MC N/A. Hinweis im Code wird in Task A2 als 1-Zeilen-`// TODO`-Marker gesetzt für künftige Multi-MC-KI-Erweiterung. |
| Branch | `feature/multi-mc-sanierung-spec` (Commits `dcc908a` + `cc977c6`) | Plan kommt als nächster Commit auf denselben Branch. |

## Wichtig: Warum kein klassisches TDD

Teil A fasst ausschliesslich Apps-Script-Code an — kein `vitest`, kein `tsc -b`, kein Build. Verifikation: `node --check` (Syntax-Gate; undefinierte GAS-Globals wie `SpreadsheetApp`/`Logger` sind kein Syntaxfehler) + struktureller Soll/Ist-Abgleich der Funktionsliste. Teil B (Phase-1/2-Generierung + operativer Runbook) wird über `DRY_RUN`, Logger-Ausgabe, das Review-Sheet und den Diagnose-Re-Run verifiziert.

## File Structure

| Datei | Verantwortung | Status |
|---|---|---|
| `ExamLab/scripts/diagnose-mc-laengste-antwort.js` | Single-MC- + Multi-MC-Längen-Diagnose, NEU: Tell-Score-Histogramm | erweitert |
| `ExamLab/scripts/sanierung-mc-multi.js` | Apps-Script: Phase 0 (Planung) + Phase 3 (Rückschreiben) + Helfer + CSV-Import-Helfer | NEU |
| `ExamLab/apps-script-code.js` | TODO-Marker bei `generiereOptionen` | 1-Zeilen-Kommentar |
| Review-CSV | Transiente Arbeitsdatei (Export/Import-Brücke) | gitignored, kein Repo-File |
| `~/Downloads/mc-multi-sanierung/` | Claude-Code-Arbeitsverzeichnis für Phase 1+2 | Lokal, nicht im Repo |

---

# TEIL A — Code (Subagent-ausführbar)

## Task A1: `diagnoseMcMultiTellScore()` ergänzen

**Files:**
- Modify: `ExamLab/scripts/diagnose-mc-laengste-antwort.js`

Die neue Funktion liefert das Tell-Score-Histogramm und die Top-20-Tells. Sie liegt **nach** der bestehenden `diagnoseMcMultiLaenge()` und teilt sich deren Helfer (`leseMcOptionen_`, `textLaenge_`, `sicherJsonParse_`, `kurz_`).

- [ ] **Step 1: Datei lesen**

```bash
wc -l ExamLab/scripts/diagnose-mc-laengste-antwort.js
```
Expected: ~263 Zeilen. Inhalt: `diagnoseMcLaengsteAntwort()` (Z. ~1–139), `diagnoseMcMultiLaenge()` (Z. ~150–228), Helfer-Block (Z. ~230–263).

- [ ] **Step 2: Funktion nach `diagnoseMcMultiLaenge()` einfügen**

Direkt vor dem Helfer-Block (vor der Kommentar-Zeile `/** Liest die MC-Optionen einer Zeile: …`) einfügen:

```js
/**
 * DIAGNOSE: Multi-Choice-MC — Tell-Score-Histogramm + Perfekt-Ranking-Zähler.
 *
 * Pro Multi-MC-Frage:
 *   - tell_score = (Ø_korrekt − Ø_distraktor) / Ø_korrekt (Bereich −∞ bis +1)
 *   - perfektes_ranking = min(korrekt_laengen) > max(distraktor_laengen)
 *
 * Ausgabe: Histogramm in 0.10er-Bins + Anzahl Perfekt-Ranking + Top-20-IDs
 * mit höchstem Tell-Score (für LP-Sichtprüfung beim Schwellen-Wählen).
 *
 * Edge-Cases:
 *   - Fragen mit < 2 korrekten Optionen werden übersprungen (sind keine Multi-MC).
 *   - Fragen mit Ø_korrekt === 0 (alle korrekten leerer Text) werden geloggt
 *     und übersprungen — sie hätten soll_laenge=0 erzwungen.
 *
 * Ausgabe: Logger → Ansicht > Protokolle.
 */
function diagnoseMcMultiTellScore() {
  var FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
  var TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];

  var fragensammlung = SpreadsheetApp.openById(FRAGENSAMMLUNG_ID);

  // Bin-Grenzen: < 0.0, 0.0-0.10, 0.10-0.20, …, 0.50+
  var BINS = [
    { label: 'score < 0.0  ', min: -Infinity, max: 0.0 },
    { label: '0.0  - 0.10 ', min: 0.0, max: 0.10 },
    { label: '0.10 - 0.20 ', min: 0.10, max: 0.20 },
    { label: '0.20 - 0.30 ', min: 0.20, max: 0.30 },
    { label: '0.30 - 0.40 ', min: 0.30, max: 0.40 },
    { label: '0.40 - 0.50 ', min: 0.40, max: 0.50 },
    { label: '0.50 +      ', min: 0.50, max: Infinity }
  ];
  for (var b = 0; b < BINS.length; b++) BINS[b].count = 0;

  var gesamt = 0;
  var perfektesRanking = 0;
  var topTells = []; // { id, score, tab }
  var skipKorrektNull = 0;
  var skipUnterzweiKorrekt = 0;

  for (var t = 0; t < TABS.length; t++) {
    var sheet = fragensammlung.getSheetByName(TABS[t]);
    if (!sheet) continue;

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;

    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf('id');
    var typCol = headers.indexOf('typ');
    var typDatenCol = headers.indexOf('typDaten');
    var optionenCol = headers.indexOf('optionen');
    var geloeschtCol = headers.indexOf('geloescht_am');
    if (typCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][typCol]).trim() !== 'mc') continue;
      if (geloeschtCol >= 0 && String(daten[i][geloeschtCol] || '').trim()) continue;

      var optionen = leseMcOptionen_(daten[i], typDatenCol, optionenCol);
      if (!optionen || optionen.length < 2) continue;

      var korrekte = optionen.filter(function (o) { return o && o.korrekt; });
      if (korrekte.length < 2) { skipUnterzweiKorrekt++; continue; }

      var distraktoren = optionen.filter(function (o) { return !(o && o.korrekt); });
      if (distraktoren.length === 0) continue;

      var korrektLaengen = korrekte.map(function (o) { return textLaenge_(o.text); });
      var distraktorLaengen = distraktoren.map(function (o) { return textLaenge_(o.text); });

      var korrektAvg = mittelwert_(korrektLaengen);
      var distraktorAvg = mittelwert_(distraktorLaengen);

      if (korrektAvg === 0) {
        skipKorrektNull++;
        Logger.log('  SKIP korrektAvg=0: id=' + (idCol >= 0 ? daten[i][idCol] : '?')
          + ' tab=' + TABS[t] + ' — alle korrekten Optionen leerer Text');
        continue;
      }

      var tellScore = (korrektAvg - distraktorAvg) / korrektAvg;
      var ranking = (min_(korrektLaengen) > max_(distraktorLaengen));

      gesamt++;
      if (ranking) perfektesRanking++;

      for (var b = 0; b < BINS.length; b++) {
        if (tellScore >= BINS[b].min && tellScore < BINS[b].max) {
          BINS[b].count++;
          break;
        }
      }

      topTells.push({
        id: idCol >= 0 ? String(daten[i][idCol]) : '?',
        score: tellScore,
        tab: TABS[t]
      });
    }
  }

  Logger.log('=== Multi-MC Tell-Score-Histogramm ===');
  Logger.log('Total Multi-MC: ' + gesamt);
  if (skipUnterzweiKorrekt > 0) Logger.log('  (uebersprungen, <2 korrekt: ' + skipUnterzweiKorrekt + ')');
  if (skipKorrektNull > 0) Logger.log('  (uebersprungen, korrekt_avg=0: ' + skipKorrektNull + ')');
  for (var b = 0; b < BINS.length; b++) {
    var pct = gesamt > 0 ? (BINS[b].count / gesamt * 100) : 0;
    Logger.log(BINS[b].label + ' : ' + pad_(BINS[b].count, 4) + ' (' + pct.toFixed(1) + '%)');
  }
  Logger.log('');
  Logger.log('Perfektes Ranking: ' + perfektesRanking + ' Fragen ('
    + (gesamt > 0 ? (perfektesRanking / gesamt * 100).toFixed(1) : '0.0') + '%)');
  Logger.log('');

  topTells.sort(function (a, b) { return b.score - a.score; });
  Logger.log('Top-20 Tells (id, score, tab):');
  for (var k = 0; k < Math.min(20, topTells.length); k++) {
    Logger.log('  ' + topTells[k].id + '  ' + topTells[k].score.toFixed(2) + '  ' + topTells[k].tab);
  }
}

/** Mittelwert eines nicht-leeren Number-Arrays. */
function mittelwert_(arr) {
  if (!arr || arr.length === 0) return 0;
  var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

/** Minimum eines nicht-leeren Number-Arrays. */
function min_(arr) {
  if (!arr || arr.length === 0) return 0;
  var m = arr[0]; for (var i = 1; i < arr.length; i++) if (arr[i] < m) m = arr[i];
  return m;
}

/** Maximum eines nicht-leeren Number-Arrays. */
function max_(arr) {
  if (!arr || arr.length === 0) return 0;
  var m = arr[0]; for (var i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  return m;
}

/** Pad einer Zahl auf Min-Länge mit führenden Spaces. */
function pad_(n, w) {
  var s = String(n);
  while (s.length < w) s = ' ' + s;
  return s;
}
```

- [ ] **Step 3: `node --check` ausführen**

```bash
node --check ExamLab/scripts/diagnose-mc-laengste-antwort.js
```
Expected: kein Output.

- [ ] **Step 4: Struktur-Verifikation**

```bash
grep -n "^function " ExamLab/scripts/diagnose-mc-laengste-antwort.js
```
Expected: `diagnoseMcLaengsteAntwort`, `diagnoseMcMultiLaenge`, `diagnoseMcMultiTellScore`, `leseMcOptionen_`, `sicherJsonParse_`, `textLaenge_`, `kurz_`, `mittelwert_`, `min_`, `max_`, `pad_`.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/scripts/diagnose-mc-laengste-antwort.js
git commit -m "feat(diagnose): diagnoseMcMultiTellScore() — Tell-Score-Histogramm fuer Multi-MC"
```

## Task A2: TODO-Marker für künftige Multi-MC-KI-Generation

**Files:**
- Modify: `ExamLab/apps-script-code.js` (`case 'generiereOptionen'` ~Z. 7343)

- [ ] **Step 1: Marker einfügen**

Direkt VOR `case 'generiereOptionen':` (Z. 7343) einfügen:

```js
      // NOTE: 'generiereOptionen' und 'generiereDistraktoren' sind Single-MC-spezifisch
      // (genau 1 korrekte Option). Wenn künftig ein Multi-MC-KI-Generations-Endpoint
      // hinzukommt: Längen-Überlappungs-Constraint aus den Single-MC-Prompts oben
      // analog übernehmen (Distraktoren mit gleicher Vollständigkeit/Detailtiefe wie
      // korrekte Optionen — keine systematische Korrelation zwischen Länge und
      // Korrektheit). Siehe MC-Sanierung-Spec 2026-05-23.
```

- [ ] **Step 2: Lint-Gate**

```bash
cd ExamLab && npx tsc -b 2>&1 | head -20
```
Expected: kein neuer Fehler (Kommentar ist syntaktisch unschädlich).

- [ ] **Step 3: Commit**

```bash
git add ExamLab/apps-script-code.js
git commit -m "docs(backend): TODO-Marker fuer kuenftige Multi-MC-KI-Generation"
```

## Task A3: `sanierung-mc-multi.js` — Scaffold + Konstanten + geteilte Helfer

**Files:**
- Create: `ExamLab/scripts/sanierung-mc-multi.js`

Datei-Skelett mit Header-Docstring, Konstanten und den Helfer-Funktionen die später von Phase 0 + 3 + Import-Helfern genutzt werden. Helfer-Code wird per Copy-Paste aus `ExamLab/scripts/sanierung-mc-distraktoren.js` übernommen (Quelle ist auf `main`, identische Signaturen).

- [ ] **Step 1: Datei erstellen mit folgendem Inhalt**

```js
/**
 * SANIERUNG: Multi-MC Distraktoren-Längen-Tell — Apps-Script-Teil (Phase 0 + 3).
 *
 * Phase 0 (phase0_planung) berechnet pro Frage einen Tell-Score, identifiziert die
 * "rote Zone" (datengetrieben nach LP-Schwelle) und baut den Review-Tab.
 * Phase 1+2 (Distraktoren generieren + prüfen) laufen in Claude Code — siehe
 * Plan TEIL B. Phase 3 (phase3_rueckschreiben) schreibt die freigegebenen
 * Distraktoren zurück. Korrekte Optionen werden NIE angefasst.
 *
 * In ein eigenständiges Apps-Script-Projekt kopieren (analog Single-MC-Sanierung,
 * NICHT ins Backend-Projekt — Namens-Kollision). Phasen einzeln ausführen.
 * VORAUSSETZUNG: Backup der Fragensammlung-Tabelle (Datei → Kopie erstellen).
 * SICHERHEIT: DRY_RUN ist DEFAULT (true) — schützt Phase 3. Auf false setzen
 * für echtes Rückschreiben.
 *
 * Spec: ExamLab/docs/superpowers/specs/2026-05-23-multi-mc-sanierung-design.md
 * Plan: ExamLab/docs/superpowers/plans/2026-05-23-multi-mc-sanierung.md
 */

// === SICHERHEITS-TOGGLE ====================================================
var DRY_RUN = true;  // <-- Auf false setzen für echtes Schreiben (Phase 3)!

// === DATEN-IDS =============================================================
var SANIERUNG_FRAGENSAMMLUNG_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
var SANIERUNG_TABS = ['BWL', 'VWL', 'Recht', 'Informatik'];
var REVIEW_TAB = 'MC-Sanierung-Multi-Review';

// === SCHWELLEN (LP konfigurierbar) =========================================
var SCHWELLE_TELL_SCORE = 0.30;             // saniere wenn score > SCHWELLE
var SANIERE_PERFEKTES_RANKING_IMMER = true; // perfektes Ranking immer sanieren
var SOLL_LAENGE_TOLERANZ = 0.20;            // ±20 % Längen-Band für Distraktoren

// === LIMITS ================================================================
// (Multi-MC schreibt nur ~60-100 Zeilen — kein Cursor/Resume-Pattern nötig.
// Falls die rote Zone künftig > 200 Fragen wird: PropertiesService-Resume aus
// sanierung-mc-distraktoren.js kopieren — siehe CURSOR_P3 + cursorLesen_/
// cursorSchreiben_/cursorLoeschen_ + ZEIT_BUDGET_MS dort.)

// === RUN-WRAPPER ===========================================================
// Dropdown im Apps-Script-Editor blendet Funktionen mit `_`-Suffix aus.
// Diese Wrapper machen jede Phase im Dropdown sichtbar.
function runPhase0Planung() { phase0_planung(); }
function runPhase3Rueckschreiben() { phase3_rueckschreiben(); }
function runImportiereDistraktorenNeu() { importiereDistraktorenNeu_(); }
function runImportiereCheckerErgebnis() { importiereCheckerErgebnis_(); }
function runVerifiziereLaengenband() { verifiziereLaengenband_(); }
function runFinalisiereReviewStatus() { finalisiereReviewStatus_(); }
function runExportiereRoteZoneCSV() { exportiereRoteZoneCSV_(); }

// === GETEILTE HELFER =======================================================

/** Getrimmte Zeichenlänge eines Optionstexts (0 bei fehlendem Text). */
function textLaenge_(text) {
  return String(text || '').trim().length;
}

/** JSON-Parse, das niemals wirft. Objekte/Arrays werden durchgereicht. */
function sicherJsonParse_(wert) {
  if (!wert) return null;
  if (typeof wert === 'object') return wert;
  try { return JSON.parse(String(wert)); } catch (e) { return null; }
}

/** Liest die MC-Optionen einer Zeile: zuerst typDaten.optionen, sonst optionen-Spalte. */
function leseMcOptionen_(row, typDatenCol, optionenCol) {
  if (typDatenCol >= 0) {
    var td = sicherJsonParse_(row[typDatenCol]);
    if (td && Array.isArray(td.optionen)) return td.optionen;
  }
  if (optionenCol >= 0) {
    var direkt = sicherJsonParse_(row[optionenCol]);
    if (Array.isArray(direkt)) return direkt;
  }
  return null;
}

/** Mittelwert eines nicht-leeren Number-Arrays. */
function mw_(arr) {
  if (!arr || arr.length === 0) return 0;
  var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i];
  return s / arr.length;
}

/** Minimum eines nicht-leeren Number-Arrays. */
function mn_(arr) {
  if (!arr || arr.length === 0) return 0;
  var m = arr[0]; for (var i = 1; i < arr.length; i++) if (arr[i] < m) m = arr[i];
  return m;
}

/** Maximum eines nicht-leeren Number-Arrays. */
function mx_(arr) {
  if (!arr || arr.length === 0) return 0;
  var m = arr[0]; for (var i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  return m;
}

/** Sucht eine Header-Spalte; wirft hart bei Fehlen (Schutz gegen tippfehler). */
function rcol_(headers, name) {
  var i = headers.indexOf(name);
  if (i < 0) throw new Error('Spalte fehlt im Review-Tab: ' + name);
  return i;
}

/** Header-Definition für den Review-Tab. EXAKT diese Reihenfolge. */
function reviewHeaders_() {
  return [
    'id', 'fachbereich', 'frage_text', 'optionen_alt_json',
    'korrekt_avg_len', 'distraktor_avg_len', 'tell_score', 'perfektes_ranking',
    'in_roter_zone', 'soll_laenge',
    'distraktoren_neu_json',
    'checker_status', 'checker_kommentar', 'checker_detail_json',
    'review_status', 'lp_kommentar',
    'geschrieben_am', 'phase3_status'
  ];
}
```

- [ ] **Step 2: `node --check`**

```bash
node --check ExamLab/scripts/sanierung-mc-multi.js
```
Expected: kein Output.

- [ ] **Step 3: Struktur-Verifikation**

```bash
grep -nE "^function |^var [A-Z_]" ExamLab/scripts/sanierung-mc-multi.js
```
Expected (Auswahl): `DRY_RUN`, `SANIERUNG_FRAGENSAMMLUNG_ID`, `SCHWELLE_TELL_SCORE`, `runPhase0Planung`, `runPhase3Rueckschreiben`, `textLaenge_`, `sicherJsonParse_`, `leseMcOptionen_`, `mw_`, `mn_`, `mx_`, `rcol_`, `reviewHeaders_`.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/scripts/sanierung-mc-multi.js
git commit -m "feat(multi-mc-sanierung): Scaffold sanierung-mc-multi.js — Konstanten + Helfer"
```

## Task A4: `sanierung-mc-multi.js` — `phase0_planung()`

**Files:**
- Modify: `ExamLab/scripts/sanierung-mc-multi.js`

- [ ] **Step 1: Phase 0 nach den geteilten Helfern (am Datei-Ende) anfügen**

```js
// === PHASE 0 — PLANUNG =====================================================

/**
 * Phase 0: Tell-Score berechnen, rote Zone identifizieren, Review-Tab bauen.
 *
 * Ablauf:
 *  1. Hart-Abbruch-Predicate: bricht ab wenn Review-Tab bereits LP-Arbeit hat
 *     (mind. eine non-empty Zelle in distraktoren_neu_json oder review_status).
 *  2. Iteriert Multi-MC der vier Fachbereich-Tabs (typ='mc', >=2 korrekt).
 *  3. Berechnet pro Frage: tell_score, perfektes_ranking, soll_laenge.
 *  4. Setzt in_roter_zone nach SCHWELLE_TELL_SCORE + SANIERE_PERFEKTES_RANKING_IMMER.
 *  5. Schreibt Review-Tab komplett neu (alt überschrieben).
 *  6. Loggt Zähler: rote Zone N, davon X perfektes Ranking, Y nur via Tell-Score.
 */
function phase0_planung() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);

  // 1. Hart-Abbruch-Predicate
  if (tab) {
    var existiertLpArbeit = pruefeReviewTabAufLpArbeit_(tab);
    if (existiertLpArbeit) {
      throw new Error(
        'HART-ABBRUCH: Review-Tab "' + REVIEW_TAB + '" enthält bereits LP-Arbeit ' +
        '(non-empty distraktoren_neu_json oder review_status). Tab manuell löschen ' +
        'oder leeren, dann Phase 0 erneut starten.'
      );
    }
  }

  // 2-4. Multi-MC sammeln + bewerten
  var zeilen = [];
  var skipUnterzweiKorrekt = 0;
  var skipKorrektNull = 0;
  var roteZoneZaehler = 0;
  var perfektRangZaehler = 0;
  var nurTellScoreZaehler = 0;

  for (var t = 0; t < SANIERUNG_TABS.length; t++) {
    var sheet = ss.getSheetByName(SANIERUNG_TABS[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf('id');
    var typCol = headers.indexOf('typ');
    var typDatenCol = headers.indexOf('typDaten');
    var optionenCol = headers.indexOf('optionen');
    var fragetextCol = headers.indexOf('fragetext');
    var geloeschtCol = headers.indexOf('geloescht_am');
    if (idCol < 0 || typCol < 0) continue;

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][typCol]).trim() !== 'mc') continue;
      if (geloeschtCol >= 0 && String(daten[i][geloeschtCol] || '').trim()) continue;
      var optionen = leseMcOptionen_(daten[i], typDatenCol, optionenCol);
      if (!optionen || optionen.length < 2) continue;

      var korrekte = optionen.filter(function (o) { return o && o.korrekt; });
      if (korrekte.length < 2) { skipUnterzweiKorrekt++; continue; }
      var distraktoren = optionen.filter(function (o) { return !(o && o.korrekt); });
      if (distraktoren.length === 0) continue;

      var korrektLaengen = korrekte.map(function (o) { return textLaenge_(o.text); });
      var distraktorLaengen = distraktoren.map(function (o) { return textLaenge_(o.text); });
      var korrektAvg = mw_(korrektLaengen);
      var distraktorAvg = mw_(distraktorLaengen);

      if (korrektAvg === 0) {
        skipKorrektNull++;
        Logger.log('  SKIP korrektAvg=0: id=' + daten[i][idCol] + ' tab=' + SANIERUNG_TABS[t]);
        continue;
      }

      var tellScore = (korrektAvg - distraktorAvg) / korrektAvg;
      var perfektesRanking = (mn_(korrektLaengen) > mx_(distraktorLaengen));
      var sollLaenge = Math.round(korrektAvg);
      var inRoterZone = (tellScore > SCHWELLE_TELL_SCORE)
        || (perfektesRanking && SANIERE_PERFEKTES_RANKING_IMMER);

      if (inRoterZone) {
        roteZoneZaehler++;
        if (perfektesRanking) perfektRangZaehler++;
        else nurTellScoreZaehler++;
      }

      zeilen.push([
        String(daten[i][idCol]),                       // id
        SANIERUNG_TABS[t],                             // fachbereich
        fragetextCol >= 0 ? String(daten[i][fragetextCol] || '') : '',  // frage_text
        JSON.stringify(optionen),                       // optionen_alt_json
        Math.round(korrektAvg),                        // korrekt_avg_len
        Math.round(distraktorAvg),                     // distraktor_avg_len
        Number(tellScore.toFixed(3)),                  // tell_score
        perfektesRanking,                              // perfektes_ranking
        inRoterZone,                                   // in_roter_zone
        inRoterZone ? sollLaenge : '',                 // soll_laenge (nur bei rot)
        '',                                            // distraktoren_neu_json
        '',                                            // checker_status
        '',                                            // checker_kommentar
        '',                                            // checker_detail_json
        '',                                            // review_status
        '',                                            // lp_kommentar
        '',                                            // geschrieben_am
        ''                                             // phase3_status
      ]);
    }
  }

  // 5. Review-Tab komplett neu schreiben
  if (!tab) tab = ss.insertSheet(REVIEW_TAB);
  tab.clear();
  var headers = reviewHeaders_();
  tab.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (zeilen.length > 0) {
    tab.getRange(2, 1, zeilen.length, headers.length).setValues(zeilen);
  }
  // Header fett, Auto-Filter, eingefrorene Header-Zeile
  tab.setFrozenRows(1);
  tab.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // 6. Zähler ausgeben
  Logger.log('=== Phase 0 — Planung abgeschlossen ===');
  Logger.log('Multi-MC gesamt: ' + zeilen.length);
  if (skipUnterzweiKorrekt > 0) Logger.log('  (uebersprungen, <2 korrekt: ' + skipUnterzweiKorrekt + ')');
  if (skipKorrektNull > 0) Logger.log('  (uebersprungen, korrekt_avg=0: ' + skipKorrektNull + ')');
  Logger.log('Rote Zone: ' + roteZoneZaehler + ' Fragen');
  Logger.log('  davon perfektes Ranking: ' + perfektRangZaehler);
  Logger.log('  davon nur via Tell-Score: ' + nurTellScoreZaehler);
  Logger.log('SCHWELLE_TELL_SCORE = ' + SCHWELLE_TELL_SCORE);
  Logger.log('SANIERE_PERFEKTES_RANKING_IMMER = ' + SANIERE_PERFEKTES_RANKING_IMMER);
  Logger.log('Review-Tab: ' + REVIEW_TAB + ' (' + tab.getSheetId() + ')');
}

/** Prüft Hart-Abbruch-Predicate: gibt true zurück wenn LP-Arbeit existiert. */
function pruefeReviewTabAufLpArbeit_(tab) {
  var range = tab.getDataRange();
  if (range.getNumRows() < 2) return false;
  var werte = range.getValues();
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var distrNeuCol = headers.indexOf('distraktoren_neu_json');
  var revStatCol = headers.indexOf('review_status');
  if (distrNeuCol < 0 && revStatCol < 0) return false; // alter Tab ohne diese Spalten
  for (var r = 1; r < werte.length; r++) {
    if (distrNeuCol >= 0 && String(werte[r][distrNeuCol] || '').trim() !== '') return true;
    if (revStatCol >= 0 && String(werte[r][revStatCol] || '').trim() !== '') return true;
  }
  return false;
}
```

- [ ] **Step 2: `node --check`**

```bash
node --check ExamLab/scripts/sanierung-mc-multi.js
```
Expected: kein Output.

- [ ] **Step 3: Struktur-Verifikation**

```bash
grep -nE "^function " ExamLab/scripts/sanierung-mc-multi.js
```
Expected (zusätzlich): `phase0_planung`, `pruefeReviewTabAufLpArbeit_`.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/scripts/sanierung-mc-multi.js
git commit -m "feat(multi-mc-sanierung): Phase 0 — Planung + Review-Tab"
```

## Task A5: `sanierung-mc-multi.js` — `phase3_rueckschreiben()` + Helfer

**Files:**
- Modify: `ExamLab/scripts/sanierung-mc-multi.js`

- [ ] **Step 1: Phase 3 + Helfer am Datei-Ende anfügen**

```js
// === PHASE 3 — RÜCKSCHREIBEN ===============================================

/**
 * Phase 3: Schreibt freigegebene Distraktoren in die Fragensammlung zurück.
 *
 * Filter: in_roter_zone === true && review_status === 'freigegeben'
 *   && geschrieben_am === ''
 *
 * Pro Frage: liest die AKTUELLEN Optionen aus der Fragensammlung (NICHT
 * optionen_alt_json — könnte stale sein), ersetzt nur die Distraktor-Texte
 * an ihrer Index-Position. Korrekte Optionen werden NIE angefasst.
 *
 * Schutz:
 *  - DRY_RUN-Toggle: bei true wird nur geloggt, nichts geschrieben.
 *  - Korrekt-Hash-Audit: Hash der korrekten Optionen pre/post muss identisch sein.
 *  - Idempotenz: geschrieben_am wird gesetzt, re-run überspringt.
 */
function phase3_rueckschreiben() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);
  if (!tab) throw new Error('Review-Tab fehlt: ' + REVIEW_TAB);

  var werte = tab.getDataRange().getValues();
  if (werte.length < 2) { Logger.log('Phase 3: leerer Review-Tab.'); return; }
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var c = {
    id: rcol_(headers, 'id'),
    fach: rcol_(headers, 'fachbereich'),
    rot: rcol_(headers, 'in_roter_zone'),
    distrNeu: rcol_(headers, 'distraktoren_neu_json'),
    revStat: rcol_(headers, 'review_status'),
    geschrieben: rcol_(headers, 'geschrieben_am'),
    phaseStat: rcol_(headers, 'phase3_status')
  };

  // Frage-Index pro Fachbereich-Tab — einmal bauen für alle Updates.
  var frageIndex = baueFrageIndex_(ss);

  var geschrieben = 0, uebersprungen = 0, errors = 0;
  var nowIso = new Date().toISOString();

  for (var r = 1; r < werte.length; r++) {
    var row = werte[r];
    var inRot = row[c.rot] === true || String(row[c.rot]).toLowerCase() === 'true';
    var revStat = String(row[c.revStat] || '').trim();
    var bereitsGeschrieben = String(row[c.geschrieben] || '').trim();

    if (!inRot) continue;
    if (revStat !== 'freigegeben') { uebersprungen++; continue; }
    if (bereitsGeschrieben !== '') { uebersprungen++; continue; }

    var id = String(row[c.id]);
    var fach = String(row[c.fach]);
    var distrNeuJson = String(row[c.distrNeu] || '').trim();
    if (!distrNeuJson) {
      Logger.log('FEHLER id=' + id + ': distraktoren_neu_json leer trotz review_status=freigegeben');
      errors++;
      if (!DRY_RUN) tab.getRange(r + 1, c.phaseStat + 1).setValue('error: distraktoren_neu_json leer');
      continue;
    }
    var neueDistraktoren = sicherJsonParse_(distrNeuJson);
    if (!Array.isArray(neueDistraktoren)) {
      Logger.log('FEHLER id=' + id + ': distraktoren_neu_json kein Array');
      errors++;
      if (!DRY_RUN) tab.getRange(r + 1, c.phaseStat + 1).setValue('error: distraktoren_neu_json kein Array');
      continue;
    }

    var loc = frageIndex[fach + '#' + id];
    if (!loc) {
      Logger.log('FEHLER id=' + id + ' in fach=' + fach + ' nicht im Sheet gefunden');
      errors++;
      if (!DRY_RUN) tab.getRange(r + 1, c.phaseStat + 1).setValue('error: Frage nicht gefunden');
      continue;
    }

    var ergebnis = schreibeDistraktorenZurueck_(loc, neueDistraktoren);
    if (ergebnis.status !== 'ok') {
      Logger.log('FEHLER id=' + id + ': ' + ergebnis.status);
      errors++;
      if (!DRY_RUN) tab.getRange(r + 1, c.phaseStat + 1).setValue('error: ' + ergebnis.status);
      continue;
    }

    if (DRY_RUN) {
      Logger.log('DRY_RUN würde schreiben: id=' + id + ' fach=' + fach
        + ' n_distraktoren=' + neueDistraktoren.length);
    } else {
      tab.getRange(r + 1, c.geschrieben + 1).setValue(nowIso);
      tab.getRange(r + 1, c.phaseStat + 1).setValue('geschrieben');
    }
    geschrieben++;
  }

  Logger.log('=== Phase 3 — Rückschreiben abgeschlossen ===');
  Logger.log('DRY_RUN = ' + DRY_RUN);
  Logger.log((DRY_RUN ? 'WÜRDE schreiben: ' : 'Geschrieben: ') + geschrieben);
  Logger.log('Übersprungen (nicht freigegeben oder bereits geschrieben): ' + uebersprungen);
  Logger.log('Errors: ' + errors);
  if (errors > 0 && !DRY_RUN) {
    throw new Error('Phase 3 mit ' + errors + ' Errors abgebrochen. Bitte Logger lesen, manuell beheben.');
  }
}

/** Baut einen Index {fach#id: {sheet, row, headers, typDatenCol, optionenCol}}. */
function baueFrageIndex_(ss) {
  var index = {};
  for (var t = 0; t < SANIERUNG_TABS.length; t++) {
    var sheet = ss.getSheetByName(SANIERUNG_TABS[t]);
    if (!sheet) continue;
    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) continue;
    var headers = daten[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf('id');
    var typDatenCol = headers.indexOf('typDaten');
    var optionenCol = headers.indexOf('optionen');
    if (idCol < 0) continue;
    for (var i = 1; i < daten.length; i++) {
      var id = String(daten[i][idCol]);
      if (!id) continue;
      index[SANIERUNG_TABS[t] + '#' + id] = {
        sheet: sheet,
        row: i + 1, // 1-based für Range
        headers: headers,
        typDatenCol: typDatenCol,
        optionenCol: optionenCol,
        zeile: daten[i]
      };
    }
  }
  return index;
}

/**
 * Ersetzt nur die Distraktor-Texte einer Frage; korrekte Optionen bleiben unverändert.
 * neueDistraktoren = Array von Strings in der gleichen Reihenfolge wie die alt-Distraktoren.
 * Korrekt-Hash-Audit: Konkateniert die korrekt-Texte vor + nach Replace; bei Mismatch error.
 */
function schreibeDistraktorenZurueck_(loc, neueDistraktoren) {
  var altOptionen = leseMcOptionen_(loc.zeile, loc.typDatenCol, loc.optionenCol);
  if (!Array.isArray(altOptionen)) return { status: 'altOptionen kein Array' };

  // Korrekt-Hash pre
  var korrektPre = altOptionen
    .filter(function (o) { return o && o.korrekt; })
    .map(function (o) { return String(o.text || ''); })
    .join('||');

  var neueOptionen = [];
  var distrIdx = 0;
  for (var i = 0; i < altOptionen.length; i++) {
    var opt = altOptionen[i];
    if (opt && opt.korrekt) {
      // Korrekt: unveraendert uebernehmen
      neueOptionen.push(opt);
    } else {
      if (distrIdx >= neueDistraktoren.length) {
        return { status: 'zu wenig neueDistraktoren (' + neueDistraktoren.length
          + ') fuer alt-Distraktoren (' + (altOptionen.length - korrektPre.split('||').length) + ')' };
      }
      // Distraktor: nur Text ersetzen, alle anderen Felder beibehalten
      var neu = Object.assign({}, opt);
      neu.text = String(neueDistraktoren[distrIdx]);
      neueOptionen.push(neu);
      distrIdx++;
    }
  }

  // Korrekt-Hash post (Sanity-Check)
  var korrektPost = neueOptionen
    .filter(function (o) { return o && o.korrekt; })
    .map(function (o) { return String(o.text || ''); })
    .join('||');
  if (korrektPre !== korrektPost) {
    return { status: 'korrekt-Hash-Mismatch (Invariante verletzt!)' };
  }

  if (DRY_RUN) return { status: 'ok' };

  // Schreiben: typDaten.optionen aktualisieren (Vorrang vor optionen-Legacy-Spalte)
  if (loc.typDatenCol >= 0) {
    var typDaten = sicherJsonParse_(loc.zeile[loc.typDatenCol]) || {};
    typDaten.optionen = neueOptionen;
    loc.sheet.getRange(loc.row, loc.typDatenCol + 1).setValue(JSON.stringify(typDaten));
  }
  if (loc.optionenCol >= 0 && (loc.typDatenCol < 0 || loc.zeile[loc.optionenCol])) {
    loc.sheet.getRange(loc.row, loc.optionenCol + 1).setValue(JSON.stringify(neueOptionen));
  }

  return { status: 'ok' };
}
```

- [ ] **Step 2: `node --check`**

```bash
node --check ExamLab/scripts/sanierung-mc-multi.js
```
Expected: kein Output.

- [ ] **Step 3: Struktur-Verifikation**

```bash
grep -nE "^function " ExamLab/scripts/sanierung-mc-multi.js
```
Expected (neu hinzu): `phase3_rueckschreiben`, `baueFrageIndex_`, `schreibeDistraktorenZurueck_`.

- [ ] **Step 4: Commit**

```bash
git add ExamLab/scripts/sanierung-mc-multi.js
git commit -m "feat(multi-mc-sanierung): Phase 3 — Rueckschreiben + Korrekt-Hash-Audit"
```

## Task A6: `sanierung-mc-multi.js` — Import-Helfer für Phase 1+2

**Files:**
- Modify: `ExamLab/scripts/sanierung-mc-multi.js`

LP exportiert den Review-Tab als CSV → Claude Code füllt Spalten aus → LP importiert CSV zurück ins Sheet. Die Import-Helfer prüfen Spalten-Konsistenz und schreiben die Werte aus den (re-importierten) Sheet-Zellen in die Sanierungs-Spalten. **Achtung:** Diese Helfer überschreiben nichts — wenn LP die CSV korrekt re-importiert, sind die Spalten schon befüllt. Die Helfer sind **Validatoren + Statistik-Generatoren**, kein eigentliches Schreiben.

- [ ] **Step 1: Helfer am Datei-Ende anfügen**

```js
// === IMPORT-HELFER (Phase 1+2 → Sheet) =====================================

/**
 * Validiert nach LP-CSV-Re-Import, dass distraktoren_neu_json für alle
 * roten Zeilen befüllt ist und JSON-Arrays mit > 0 Elementen enthält.
 * Loggt Statistik. Schreibt nichts.
 */
function importiereDistraktorenNeu_() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);
  if (!tab) throw new Error('Review-Tab fehlt: ' + REVIEW_TAB);
  var werte = tab.getDataRange().getValues();
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var rotCol = rcol_(headers, 'in_roter_zone');
  var distrNeuCol = rcol_(headers, 'distraktoren_neu_json');
  var idCol = rcol_(headers, 'id');

  var rot = 0, befuellt = 0, leer = 0, ungueltigJson = 0, leeresArray = 0;
  for (var r = 1; r < werte.length; r++) {
    var inRot = werte[r][rotCol] === true || String(werte[r][rotCol]).toLowerCase() === 'true';
    if (!inRot) continue;
    rot++;
    var raw = String(werte[r][distrNeuCol] || '').trim();
    if (!raw) { leer++; Logger.log('  LEER: id=' + werte[r][idCol]); continue; }
    var parsed = sicherJsonParse_(raw);
    if (!Array.isArray(parsed)) { ungueltigJson++; Logger.log('  KEIN ARRAY: id=' + werte[r][idCol]); continue; }
    if (parsed.length === 0) { leeresArray++; Logger.log('  LEERES ARRAY: id=' + werte[r][idCol]); continue; }
    befuellt++;
  }
  Logger.log('=== Phase-1-Import Verifikation ===');
  Logger.log('Rote Zone gesamt: ' + rot);
  Logger.log('Befüllt + valide: ' + befuellt);
  Logger.log('Leer: ' + leer);
  Logger.log('Ungültiges JSON: ' + ungueltigJson);
  Logger.log('Leeres Array: ' + leeresArray);
  if (befuellt < rot) {
    Logger.log('WARNUNG: Nicht alle roten Zeilen sind befüllt. Phase 2 nicht starten, bis 100 %.');
  }
}

/**
 * Validiert nach Phase-2-Import: checker_status ist OK / FLAG / STICHPROBE.
 * Loggt FLAG- und STICHPROBE-Zähler, hebt sie für LP-Review hervor.
 */
function importiereCheckerErgebnis_() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);
  if (!tab) throw new Error('Review-Tab fehlt: ' + REVIEW_TAB);
  var werte = tab.getDataRange().getValues();
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var rotCol = rcol_(headers, 'in_roter_zone');
  var statCol = rcol_(headers, 'checker_status');
  var idCol = rcol_(headers, 'id');

  var rot = 0, ok = 0, flag = 0, stichprobe = 0, leer = 0, ungueltig = 0;
  var flagZeilen = [], stichprobeZeilen = [];
  for (var r = 1; r < werte.length; r++) {
    var inRot = werte[r][rotCol] === true || String(werte[r][rotCol]).toLowerCase() === 'true';
    if (!inRot) continue;
    rot++;
    var s = String(werte[r][statCol] || '').trim().toUpperCase();
    if (s === 'OK') ok++;
    else if (s === 'FLAG') { flag++; flagZeilen.push(r + 1); }
    else if (s === 'STICHPROBE') { stichprobe++; stichprobeZeilen.push(r + 1); }
    else if (s === '') leer++;
    else { ungueltig++; Logger.log('  UNGUELTIG: id=' + werte[r][idCol] + ' status=' + s); }
  }
  Logger.log('=== Phase-2-Import Verifikation ===');
  Logger.log('Rote Zone gesamt: ' + rot);
  Logger.log('OK: ' + ok);
  Logger.log('FLAG: ' + flag);
  Logger.log('STICHPROBE: ' + stichprobe);
  Logger.log('Leer: ' + leer);
  Logger.log('Ungültig: ' + ungueltig);
  if (flagZeilen.length > 0) Logger.log('FLAG-Zeilen (Sheet-Zeile): ' + flagZeilen.join(', '));
  if (stichprobeZeilen.length > 0) Logger.log('STICHPROBE-Zeilen: ' + stichprobeZeilen.join(', '));

  // Einfärben: FLAG = hellrot, STICHPROBE = hellgelb
  if (flagZeilen.length > 0 || stichprobeZeilen.length > 0) {
    var hcols = headers.length;
    for (var i = 0; i < flagZeilen.length; i++) {
      tab.getRange(flagZeilen[i], 1, 1, hcols).setBackground('#fde0e0');
    }
    for (var j = 0; j < stichprobeZeilen.length; j++) {
      tab.getRange(stichprobeZeilen[j], 1, 1, hcols).setBackground('#fff4cc');
    }
  }
}

/**
 * Prüft pro roter Zeile, dass alle distraktoren_neu im Längen-Band liegen.
 * Loggt Ausreisser ohne zu schreiben.
 */
function verifiziereLaengenband_() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);
  if (!tab) throw new Error('Review-Tab fehlt: ' + REVIEW_TAB);
  var werte = tab.getDataRange().getValues();
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var rotCol = rcol_(headers, 'in_roter_zone');
  var sollCol = rcol_(headers, 'soll_laenge');
  var distrNeuCol = rcol_(headers, 'distraktoren_neu_json');
  var idCol = rcol_(headers, 'id');

  var ausreisser = 0;
  for (var r = 1; r < werte.length; r++) {
    var inRot = werte[r][rotCol] === true || String(werte[r][rotCol]).toLowerCase() === 'true';
    if (!inRot) continue;
    var soll = Number(werte[r][sollCol]);
    if (!soll) continue;
    var min = Math.round(soll * (1 - SOLL_LAENGE_TOLERANZ));
    var max = Math.round(soll * (1 + SOLL_LAENGE_TOLERANZ));
    var neue = sicherJsonParse_(werte[r][distrNeuCol]);
    if (!Array.isArray(neue)) continue;
    for (var d = 0; d < neue.length; d++) {
      var l = textLaenge_(neue[d]);
      if (l < min || l > max) {
        ausreisser++;
        Logger.log('  AUSREISSER id=' + werte[r][idCol] + ' distraktor[' + d + ']='
          + l + ' (Band: ' + min + '-' + max + ')');
      }
    }
  }
  Logger.log('=== Längen-Band-Verifikation ===');
  Logger.log('Ausreisser: ' + ausreisser);
  Logger.log('(Toleranz: ±' + (SOLL_LAENGE_TOLERANZ * 100) + ' %)');
}

/**
 * Fill-Down: setzt review_status='freigegeben' für alle roten OK-Zeilen
 * die NICHT FLAG und NICHT STICHPROBE sind. LP-Bestätigungs-Schritt nach
 * dem Review-Gate (R7).
 */
function finalisiereReviewStatus_() {
  var ss = SpreadsheetApp.openById(SANIERUNG_FRAGENSAMMLUNG_ID);
  var tab = ss.getSheetByName(REVIEW_TAB);
  if (!tab) throw new Error('Review-Tab fehlt: ' + REVIEW_TAB);
  var werte = tab.getDataRange().getValues();
  var headers = werte[0].map(function (h) { return String(h).trim(); });
  var rotCol = rcol_(headers, 'in_roter_zone');
  var statCol = rcol_(headers, 'checker_status');
  var revStatCol = rcol_(headers, 'review_status');
  var idCol = rcol_(headers, 'id');

  var n = 0;
  for (var r = 1; r < werte.length; r++) {
    var inRot = werte[r][rotCol] === true || String(werte[r][rotCol]).toLowerCase() === 'true';
    if (!inRot) continue;
    var ckr = String(werte[r][statCol] || '').trim().toUpperCase();
    if (ckr !== 'OK') continue; // FLAG + STICHPROBE muss LP manuell setzen
    var rev = String(werte[r][revStatCol] || '').trim();
    if (rev !== '') continue;   // bereits gesetzt
    tab.getRange(r + 1, revStatCol + 1).setValue('freigegeben');
    n++;
  }
  Logger.log('=== Fill-Down Review-Status ===');
  Logger.log('Auf freigegeben gesetzt (OK, kein STICHPROBE/FLAG, bislang leer): ' + n);
}

/** LP-Doku: Anleitung im Logger, wie der Review-Tab als CSV exportiert wird. */
function exportiereRoteZoneCSV_() {
  Logger.log('=== CSV-Export-Anleitung ===');
  Logger.log('1. Tab "' + REVIEW_TAB + '" aktiv setzen');
  Logger.log('2. Filter: Spalte "in_roter_zone" = TRUE');
  Logger.log('   (Alternativ: alle Zeilen exportieren, Claude Code filtert)');
  Logger.log('3. Datei → Herunterladen → Kommagetrennte Werte (.csv)');
  Logger.log('4. Datei nach ~/Downloads/mc-multi-sanierung/MC-Multi-Review-export.csv ablegen');
  Logger.log('5. Claude-Code-Session "Multi-MC Sanierung Phase 1" starten');
}
```

- [ ] **Step 2: `node --check`**

```bash
node --check ExamLab/scripts/sanierung-mc-multi.js
```
Expected: kein Output.

- [ ] **Step 3: Struktur-Verifikation**

```bash
grep -nE "^function " ExamLab/scripts/sanierung-mc-multi.js
```
Expected (Vollständigkeits-Liste): `runPhase0Planung`, `runPhase3Rueckschreiben`, `runImportiereDistraktorenNeu`, `runImportiereCheckerErgebnis`, `runVerifiziereLaengenband`, `runFinalisiereReviewStatus`, `runExportiereRoteZoneCSV`, `textLaenge_`, `sicherJsonParse_`, `leseMcOptionen_`, `mw_`, `mn_`, `mx_`, `rcol_`, `reviewHeaders_`, `phase0_planung`, `pruefeReviewTabAufLpArbeit_`, `phase3_rueckschreiben`, `baueFrageIndex_`, `schreibeDistraktorenZurueck_`, `importiereDistraktorenNeu_`, `importiereCheckerErgebnis_`, `verifiziereLaengenband_`, `finalisiereReviewStatus_`, `exportiereRoteZoneCSV_`.

- [ ] **Step 4: Datei-Grösse-Check**

```bash
wc -l ExamLab/scripts/sanierung-mc-multi.js
```
Expected: ~450–550 Zeilen.

- [ ] **Step 5: Commit**

```bash
git add ExamLab/scripts/sanierung-mc-multi.js
git commit -m "feat(multi-mc-sanierung): Import-Helfer + Faerb-/Fill-Down-Logik"
```

---

# TEIL B — Operativer Ablauf (LP + Claude Code)

Diese Schritte laufen nicht als Subagent. Der LP arbeitet im Apps-Script-Editor + Google-Account; die KI-Generierung (Phase 1/2) macht eine Claude-Code-Session. Reihenfolge: R1 → R2 → R3 → R4 → R5 → R6 → R7.

## Die Review-CSV — Spalten-Vertrag

Phase 0 baut den `MC-Sanierung-Multi-Review`-Tab mit exakt diesen Spalten (aus `reviewHeaders_()`); die CSV trägt sie als Kopfzeile:

```
id, fachbereich, frage_text, optionen_alt_json,
korrekt_avg_len, distraktor_avg_len, tell_score, perfektes_ranking,
in_roter_zone, soll_laenge,
distraktoren_neu_json,
checker_status, checker_kommentar, checker_detail_json,
review_status, lp_kommentar,
geschrieben_am, phase3_status
```

Phase 0 füllt alles bis `soll_laenge`. Claude Code füllt `distraktoren_neu_json` (Phase 1) sowie `checker_status`, `checker_kommentar`, `checker_detail_json` (Phase 2). Der LP füllt `review_status` + `lp_kommentar`; Phase 3 setzt `geschrieben_am` + `phase3_status`.

## Phase 1+2 — die Claude-Code-Prozedur

Die Multi-MC-Sanierungs-Session liest die exportierte CSV (gefilterte rote Zeilen) und verarbeitet jede Daten-Zeile. **Die ~60–100 Zeilen in Batches über parallele Subagenten** (`superpowers:dispatching-parallel-agents`).

**Phase 1 — Generierung, pro Zeile:**
1. Lies `id`, `fachbereich`, `frage_text`, `optionen_alt_json`, `soll_laenge`.
2. Aus `optionen_alt_json` die korrekt-Optionen + alt-Distraktoren extrahieren.
3. SOLL_MIN = round(soll_laenge × 0.80), SOLL_MAX = round(soll_laenge × 1.20).
4. N = Anzahl alt-Distraktoren. Generiere N neue Distraktoren (Index-Reihenfolge stabil), jeder: (a) inhaltlich **eindeutig falsch**; (b) fachlich plausibler Ablenker; (c) trifft Soll-Länge ±20 % durch mehr Vollständigkeit/Präzision, nicht durch Padding; (d) wiederholt weder eine korrekte Option noch einen anderen Distraktor; (e) den eingebauten Fehler explizit benennen (kein vages "irgendwie verkehrt").
5. Max 2 Retries pro Distraktor wenn Länge ausserhalb Band. Beim 3. Mal: "BEST EFFORT"-Marker im JSON-Kommentar.
6. Schreibe `distraktoren_neu_json` = JSON-Array der N Strings.

**Phase 2 — Checker, pro Zeile (eigener frischer Subagent — kein Phase-1-Kontext):**
1. Eingabe: `frage_text`, korrekt-Optionen aus `optionen_alt_json`, neue Distraktoren aus `distraktoren_neu_json`. Pro Distraktor prüfen: eindeutig falsch? plausibel? keine Verdoppelung? sprachlich passend? **Konservativ** — im Zweifel FLAG.
2. Frage-Status (rollup): `≥ 1` Distraktor FLAG → frage_status = `FLAG`. Sonst Zufalls-11 %-Stichprobe (deterministisch über FNV-1a von `'stichprobe#'+id` < 0.11) → `STICHPROBE`. Sonst `OK`.
3. Schreibe `checker_status`, `checker_kommentar` (FLAG-Begründung), `checker_detail_json` (Pro-Distraktor-Detail).

## Runbook R1–R7

### R1 — Vorbereitung
- [ ] **Backup:** Fragensammlung-Tabelle → Datei → Kopie erstellen (mit Datums-Suffix).
- [ ] **Bestehendes Standalone-Apps-Script-Projekt "MC-Sanierung"** öffnen (script.google.com — das aus Single-MC-R1, NICHT das Backend-Projekt).
- [ ] Datei `diagnose-mc-laengste-antwort.gs` mit dem aktualisierten Inhalt aus `ExamLab/scripts/diagnose-mc-laengste-antwort.js` (Stand nach Task A1) **vollständig ersetzen**. Bestehende Funktionen bleiben unverändert; `diagnoseMcMultiTellScore()` ist neu.
- [ ] **Neue Datei** `sanierung-mc-multi.gs` anlegen, Inhalt aus `ExamLab/scripts/sanierung-mc-multi.js` (Stand nach Task A6) **vollständig hineinkopieren**.
- [ ] **NICHT** `sanierung-mc-distraktoren.gs` (Single-MC) anfassen — bleibt unverändert.

### R2 — Tell-Score-Histogramm + Schwelle wählen
- [ ] Funktion `diagnoseMcMultiTellScore` im Dropdown wählen → ▶ Ausführen.
- [ ] **Ansicht → Protokolle** öffnen, Histogramm lesen.
- [ ] **Schwelle wählen** auf Basis des Histogramms:
  - Empfehlung Default: `SCHWELLE_TELL_SCORE = 0.30` (deckt typischerweise oberste ~20–25 % ab).
  - Wenn die rote Zone zu klein wirkt (< 30 Fragen): Schwelle senken auf 0.20.
  - Wenn zu gross (> 120 Fragen): Schwelle erhöhen auf 0.40.
- [ ] In `sanierung-mc-multi.gs`: `SCHWELLE_TELL_SCORE`-Wert anpassen, **Datei speichern**.

### R3 — Phase 0 (Apps-Script)
- [ ] Funktion `runPhase0Planung` im Dropdown wählen → ▶ Ausführen.
- [ ] Logger lesen: „Rote Zone: N Fragen" + Aufteilung perfektes Ranking / nur Tell-Score.
- [ ] Tab `MC-Sanierung-Multi-Review` öffnen. Kontrollieren: Header korrekt, ~238 Zeilen, `in_roter_zone === TRUE` bei N Zeilen, `soll_laenge` bei ihnen befüllt.
- [ ] **Wenn die Schwelle revidiert werden soll:** `SCHWELLE_TELL_SCORE` anpassen + `runPhase0Planung` erneut (Phase 0 ist idempotent solange keine LP-Arbeit im Tab steht).

### R4 — Phase 1 (Claude Code, Generierung)
- [ ] Funktion `runExportiereRoteZoneCSV` ausführen → Logger zeigt Export-Anleitung.
- [ ] Tab als CSV herunterladen (Datei → Herunterladen → CSV). Datei nach `~/Downloads/mc-multi-sanierung/MC-Multi-Review-export.csv` ablegen.
- [ ] Claude-Code-Session „Multi-MC Sanierung Phase 1" starten. Arbeitsverzeichnis `~/Downloads/mc-multi-sanierung/` einrichten (per Hand oder per Skript). Inhalt analog `~/Downloads/mc-sanierung-r5/`:
  - `split.js` (CSV in N Batches à ~10 Fragen — nur rote Zeilen)
  - `agent-prompt-template.md` (Generator-Prompt aus Spec §"Phase 1 — Generator-Prompt")
  - `merge.js` (Subagent-Outputs zur Sheet-Re-Import-CSV zusammenführen)
  - `STATE.md` (Fortschritts-Tracker)
- [ ] Subagenten (`superpowers:dispatching-parallel-agents`) starten — pro Batch ein Subagent, Prompt aus Template, Input CSV-Batch.
- [ ] `merge.js` aufrufen → fertige CSV `MC-Multi-Review-import.csv`.
- [ ] **CSV ins Sheet zurück-importieren** (Datei → Importieren → Importspeicherort: Aktuelles Blatt ersetzen, Trennzeichen Komma, Ziel `MC-Sanierung-Multi-Review`).
- [ ] `runImportiereDistraktorenNeu` ausführen → Logger prüft Befüllung. „Befüllt + valide" muss == „Rote Zone gesamt" sein.
- [ ] `runVerifiziereLaengenband` ausführen → Ausreisser-Anzahl notieren. < 10 % der Distraktoren ausserhalb Band = akzeptabel; mehr → in Phase 2 mit-flaggen lassen.

### R5 — Phase 2 (Claude Code, Checker)
- [ ] Tab als CSV erneut herunterladen (jetzt mit `distraktoren_neu_json` befüllt). Datei nach `~/Downloads/mc-multi-sanierung/MC-Multi-Review-checker-input.csv` ablegen.
- [ ] Claude-Code-Session „Multi-MC Sanierung Phase 2" starten (frische Session, KEIN Phase-1-Kontext). Arbeitsverzeichnis analog Phase 1, andere Skripte:
  - `split-checker.js` (CSV in N kleinere Batches à ~5 Fragen, andere Aufteilung als Phase 1)
  - `agent-checker-template.md` (Checker-Prompt aus Spec §"Phase 2 — Checker-Prompt")
  - `merge-checker.js`
- [ ] Subagenten starten, `merge-checker.js` aufrufen → `MC-Multi-Review-checker-import.csv`.
- [ ] CSV ins Sheet zurück-importieren.
- [ ] `runImportiereCheckerErgebnis` ausführen → Logger zeigt OK / FLAG / STICHPROBE-Verteilung; FLAG-/STICHPROBE-Zeilen werden im Sheet eingefärbt.

### R6 — Review-Gate (LP)
- [ ] **Alle `checker_status=FLAG`-Zeilen** prüfen (im Sheet hellrot eingefärbt) → `review_status` setzen:
  - `freigegeben` wenn Checker über-geflaggt hat.
  - `nachbearbeitet` wenn LP die `distraktoren_neu_json`-Werte selbst korrigiert.
  - `abgelehnt` wenn die ganze Frage rausfällt (Phase 3 überspringt sie).
- [ ] **Alle `stichprobe=STICHPROBE`-Zeilen** prüfen (hellgelb) → genauso `review_status` setzen.
- [ ] **Eskalations-Regel:** Wenn in der Stichprobe **≥ 2 echte Korrektheits-Fehler** gefunden werden → komplette `OK`-Menge voll reviewen, nicht nur Stichprobe.
- [ ] Wenn Stichprobe sauber: `runFinalisiereReviewStatus` ausführen → setzt restliche `OK`-Zeilen automatisch auf `freigegeben`.

### R7 — Phase 3 + Schluss-Diagnose
- [ ] **`DRY_RUN=true` (Default)**: `runPhase3Rueckschreiben` ausführen → Log „WÜRDE schreiben: N". Auf 0 Errors prüfen.
- [ ] In `sanierung-mc-multi.gs`: `DRY_RUN` auf `false` setzen, **Datei speichern**.
- [ ] `runPhase3Rueckschreiben` ausführen — schreibt jetzt echt. „Geschrieben: N", „Errors: 0" erwartet.
- [ ] `DRY_RUN` zurück auf `true` setzen + speichern (Schutz vor versehentlichem Re-Run).
- [ ] **Schluss-Diagnose:** `diagnoseMcMultiLaenge` ausführen — Befund **UNAUFFÄLLIG** (Verhältnis < 1.15×, frageProzent < 65 %).
- [ ] `diagnoseMcMultiTellScore` ausführen — Histogramm-Schwerpunkt um 0.0, „Perfektes Ranking: 0" (modulo `abgelehnt`).
- [ ] **Smoke-Test:** 5 zufällige sanierte Fragen in ExamLab (Frageneditor) öffnen, prüfen: 4 Optionen sichtbar, 2-3 korrekt-markiert, Distraktor-Texte sind die neuen.

---

## Abschluss

Wenn R7 „UNAUFFÄLLIG" liefert und 0 Errors, ist die Sanierung fertig.

- [ ] `HANDOFF.md` aktualisieren (Multi-MC-Cluster KOMPLETT, Aggregat-Wert vor/nach).
- [ ] Branch `feature/multi-mc-sanierung-spec` nach LP-Freigabe nach `main` mergen (FF wenn möglich, sonst Merge-Commit).
- [ ] Optional: `origin/preview` mitziehen (`git push origin main:preview`).
- [ ] Memory aktualisieren (`project_mc_laengste_antwort_audit.md` um Multi-MC-Resultat ergänzen).

## Lehren / Memory-Kandidaten (während/nach Umsetzung notieren)

- Falls Subagent-Generierung systematisch in das WAHRE driftet trotz Prompt-Constraint → Prompt schärfen, Memory-Lehre updaten.
- Falls FLAG-Quote stark vom Single-MC-Wert (~21 %) abweicht → Ursache notieren.
- Falls die LP-Schwellen-Wahl mehrere Iterationen brauchte → in der Spec dokumentieren als „Schwelle in Praxis x.xx".
