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
// textLaenge_, sicherJsonParse_, leseMcOptionen_ sind identisch zu
// sanierung-mc-distraktoren.js — bei Änderung BEIDE Dateien anpassen.
// mw_/mn_/mx_/rcol_/reviewHeaders_ sind multi-MC-spezifisch.

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
  // Header fett + eingefrorene Header-Zeile (Auto-Filter wird hier nicht gesetzt;
  // LP kann ihn bei Bedarf manuell aktivieren — `createFilter()` wirft bei
  // wiederholtem Lauf, würde Idempotenz brechen).
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
