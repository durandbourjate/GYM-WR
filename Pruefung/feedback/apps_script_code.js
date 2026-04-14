/**
 * ExamLab — Apps Script für Problemmeldungen
 *
 * Container-bound an das Google Sheet "ExamLab Problemmeldungen".
 * Empfängt Feedback aus der ExamLab Web-App (FeedbackModal.tsx)
 * via Image-Ping (GET) und schreibt es in das aktive Sheet.
 *
 * Trennt nach "ort" (Ursprung der Meldung) in eigene Tabellenblätter:
 *   - "Pruefen"          — Meldungen aus dem Prüfen-Bereich
 *   - "Ueben"            — Meldungen aus dem Üben-Bereich
 *   - "Fragensammlung"   — Meldungen aus der Fragensammlung
 *   - "Editor"           — Meldungen aus dem Frage-Editor
 *   - "App"              — Allgemeine App-Meldungen (Login, Settings, etc.)
 *   - "Sonstige"         — Fallback für unbekannte ort-Werte
 *
 * SETUP siehe README.md im selben Verzeichnis.
 */

var SPALTEN = [
  'Zeitstempel',
  'Rolle',          // 'lp' | 'sus'
  'Ort',            // z.B. 'frage-pruefen', 'ueben-dashboard', 'editor', ...
  'Modus',          // 'pruefen' | 'ueben' | 'fragensammlung'
  'Typ',            // 'problem' | 'wunsch'
  'Kategorie',      // z.B. 'Fachlicher Fehler', 'Bedienung/UX', ...
  'Kommentar',
  'Frage-ID',
  'Fragetext',
  'Fragetyp',
  'Prüfung-ID',
  'Gruppe-ID',
  'Bildschirm',
  'App-Version',
  'E-Mail',
  'Zusatzinfo',
];

function ortZuTab_(ort) {
  var o = String(ort || '').toLowerCase();
  if (o.indexOf('pruef') >= 0 && o.indexOf('frag') < 0) return 'Pruefen';
  if (o.indexOf('frage-pruefen') >= 0) return 'Pruefen';
  if (o.indexOf('frage-ueben') >= 0) return 'Ueben';
  if (o.indexOf('ueben') >= 0) return 'Ueben';
  if (o.indexOf('fragensammlung') >= 0) return 'Fragensammlung';
  if (o.indexOf('editor') >= 0) return 'Editor';
  if (o.indexOf('app') >= 0 || o.indexOf('login') >= 0 || o.indexOf('settings') >= 0) return 'App';
  return 'Sonstige';
}

function holeOderErstelleTab_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SPALTEN);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SPALTEN.length).setFontWeight('bold');
    // Spaltenbreiten
    sheet.setColumnWidth(1, 150);  // Zeitstempel
    sheet.setColumnWidth(7, 350);  // Kommentar
    sheet.setColumnWidth(9, 300);  // Fragetext
  }
  return sheet;
}

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var now = new Date();
    var ts = Utilities.formatDate(now, 'Europe/Zurich', 'yyyy-MM-dd HH:mm:ss');
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var tabName = ortZuTab_(p.ort);
    var sheet = holeOderErstelleTab_(ss, tabName);
    sheet.appendRow([
      ts,
      p.rolle || '',
      p.ort || '',
      p.modus || '',
      p.typ || '',
      p.category || '',
      p.comment || '',
      p.frageId || '',
      p.frageText || '',
      p.frageTyp || '',
      p.pruefungId || '',
      p.gruppeId || '',
      p.bildschirm || '',
      p.appVersion || '',
      p.email || '',
      p.zusatzinfo || '',
    ]);

    return ContentService
      .createTextOutput('OK')
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService
      .createTextOutput('ERROR: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Einmalig manuell ausführen, um alle Tabs vorab anzulegen.
 * Optional — Tabs werden auch automatisch beim ersten Eintrag erstellt.
 */
function setupTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Pruefen', 'Ueben', 'Fragensammlung', 'Editor', 'App', 'Sonstige'].forEach(function(name) {
    holeOderErstelleTab_(ss, name);
  });
  Logger.log('Tabs bereit. Standard-Tab "Tabellenblatt1" kannst du manuell löschen.');
}
