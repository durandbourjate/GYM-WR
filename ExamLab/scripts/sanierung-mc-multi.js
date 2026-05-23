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
