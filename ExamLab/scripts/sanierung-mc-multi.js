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

/**
 * Konvertiert 1-basierten Spalten-Index in A1-Notation-Buchstaben.
 * 1 → 'A', 26 → 'Z', 27 → 'AA', 52 → 'AZ'. Für `getRangeList()`-Builder.
 */
function colIndexToA1_(n) {
  var s = '';
  while (n > 0) {
    var rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
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

  var geschrieben = 0, skipNichtFreigegeben = 0, skipBereitsGeschrieben = 0, errors = 0;
  var nowIso = new Date().toISOString();

  for (var r = 1; r < werte.length; r++) {
    var row = werte[r];
    var inRot = row[c.rot] === true || String(row[c.rot]).toLowerCase() === 'true';
    var revStat = String(row[c.revStat] || '').trim();
    var bereitsGeschrieben = String(row[c.geschrieben] || '').trim();

    if (!inRot) continue;
    if (revStat !== 'freigegeben') { skipNichtFreigegeben++; continue; }
    if (bereitsGeschrieben !== '') { skipBereitsGeschrieben++; continue; }

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
  Logger.log('Übersprungen (nicht freigegeben): ' + skipNichtFreigegeben);
  Logger.log('Übersprungen (bereits geschrieben — Idempotenz): ' + skipBereitsGeschrieben);
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

  var nAltDistraktoren = altOptionen.filter(function (o) { return !(o && o.korrekt); }).length;

  // Korrekt-Hash pre — JSON.stringify als Delimiter (kollisions-sicher gegen '||' in Texten).
  var korrektPre = JSON.stringify(altOptionen
    .filter(function (o) { return o && o.korrekt; })
    .map(function (o) { return String(o.text || ''); }));

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
          + ') fuer alt-Distraktoren (' + nAltDistraktoren + ')' };
      }
      // Distraktor: nur Text ersetzen, alle anderen Felder beibehalten
      var neu = Object.assign({}, opt);
      neu.text = String(neueDistraktoren[distrIdx]);
      neueOptionen.push(neu);
      distrIdx++;
    }
  }

  // Korrekt-Hash post (Sanity-Check)
  var korrektPost = JSON.stringify(neueOptionen
    .filter(function (o) { return o && o.korrekt; })
    .map(function (o) { return String(o.text || ''); }));
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

  // Einfärben: FLAG = hellrot, STICHPROBE = hellgelb.
  // getRangeList = 1 API-Call pro Farbe statt 1 pro Zeile (relevant ab > 50 Zeilen).
  if (flagZeilen.length > 0 || stichprobeZeilen.length > 0) {
    var lastColLetter = colIndexToA1_(headers.length);
    if (flagZeilen.length > 0) {
      var flagRanges = flagZeilen.map(function (z) { return 'A' + z + ':' + lastColLetter + z; });
      tab.getRangeList(flagRanges).setBackground('#fde0e0');
    }
    if (stichprobeZeilen.length > 0) {
      var stichRanges = stichprobeZeilen.map(function (z) { return 'A' + z + ':' + lastColLetter + z; });
      tab.getRangeList(stichRanges).setBackground('#fff4cc');
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

  // Erst alle freizugebenden Zeilen sammeln, dann mit getRangeList in einem
  // API-Call schreiben (Alle bekommen denselben Wert 'freigegeben' → setValue
  // auf RangeList ist atomisch genug). Skaliert auf 700+ Zeilen ohne Latenz-Spike.
  var zeilenZuFreigeben = [];
  for (var r = 1; r < werte.length; r++) {
    var inRot = werte[r][rotCol] === true || String(werte[r][rotCol]).toLowerCase() === 'true';
    if (!inRot) continue;
    var ckr = String(werte[r][statCol] || '').trim().toUpperCase();
    if (ckr !== 'OK') continue; // FLAG + STICHPROBE muss LP manuell setzen
    var rev = String(werte[r][revStatCol] || '').trim();
    if (rev !== '') continue;   // bereits gesetzt
    zeilenZuFreigeben.push(r + 1);
  }
  if (zeilenZuFreigeben.length > 0) {
    var revStatLetter = colIndexToA1_(revStatCol + 1);
    var ranges = zeilenZuFreigeben.map(function (z) {
      return revStatLetter + z + ':' + revStatLetter + z;
    });
    tab.getRangeList(ranges).setValue('freigegeben');
  }
  Logger.log('=== Fill-Down Review-Status ===');
  Logger.log('Auf freigegeben gesetzt (OK, kein STICHPROBE/FLAG, bislang leer): ' + zeilenZuFreigeben.length);
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
