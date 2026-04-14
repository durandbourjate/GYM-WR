/**
 * Google Apps Script — Übungspool: Problemmeldungen + Analytics
 *
 * Dieses Script verarbeitet ZWEI Arten von Requests über denselben Endpoint:
 * 1. Problemmeldungen → doGet (GET, Image-Ping) → Blatt «Problemmeldungen»
 * 2. Analytics-Events  → doPost (POST, fetch)   → Blätter «Events» und «Sessions»
 */

// ── KONFIGURATION ──
const SHEET_EVENTS = 'Events';
const SHEET_SESSIONS = 'Sessions';
const SHEET_REPORTS = 'Problemmeldungen';
const SHEET_PRUEFUNG_FEEDBACK = 'ExamLab-Problemmeldungen';

/**
 * Einmalig ausführen: Erstellt die Analytics-Blätter im bestehenden Sheet.
 */
function setupAnalyticsSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let evSheet = ss.getSheetByName(SHEET_EVENTS);
  if (!evSheet) {
    evSheet = ss.insertSheet(SHEET_EVENTS);
  }
  evSheet.getRange(1, 1, 1, 12).setValues([[
    'timestamp', 'event', 'session_id', 'pool',
    'frage_id', 'topic', 'type', 'diff', 'correct',
    'skipped', 'antwort', 'zeit_ms'
  ]]);
  evSheet.setFrozenRows(1);
  evSheet.getRange(1, 1, 1, 12).setFontWeight('bold');

  let sessSheet = ss.getSheetByName(SHEET_SESSIONS);
  if (!sessSheet) {
    sessSheet = ss.insertSheet(SHEET_SESSIONS);
  }
  sessSheet.getRange(1, 1, 1, 8).setValues([[
    'timestamp', 'session_id', 'pool',
    'score', 'max_score', 'prozent', 'dauer_s',
    'anzahl_fragen'
  ]]);
  sessSheet.setFrozenRows(1);
  sessSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
}

/**
 * POST-Endpoint — Analytics-Events von pool.html (via fetch POST)
 */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const now = new Date();
    const ts = Utilities.formatDate(now, 'Europe/Zurich', 'yyyy-MM-dd HH:mm:ss');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const evt = d.evt || '';

    if (evt === 'answer' || evt === 'skip') {
      const sheet = ss.getSheetByName(SHEET_EVENTS);
      if (sheet) {
        sheet.appendRow([
          ts,
          evt,
          d.sid || '',
          d.pool || '',
          d.qid || '',
          d.topic || '',
          d.qtype || '',
          d.diff || '',
          d.correct || '',
          evt === 'skip' ? 'true' : 'false',
          d.answer || '',
          d.zeit || ''
        ]);
      }
    }
    else if (evt === 'session_end') {
      const sheet = ss.getSheetByName(SHEET_SESSIONS);
      if (sheet) {
        const pct = d.max > 0 ? Math.round((d.score / d.max) * 100) : 0;
        sheet.appendRow([
          ts,
          d.sid || '',
          d.pool || '',
          d.score || 0,
          d.max || 0,
          pct,
          d.dauer || '',
          d.count || ''
        ]);
      }
    }

    return ContentService
      .createTextOutput('OK')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService
      .createTextOutput('ERR: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * GET-Endpoint — Problemmeldungen von pool.html (via Image-Ping GET)
 */
function doGet(e) {
  try {
    const params = e.parameter;
    const now = new Date();
    const ts = Utilities.formatDate(now, 'Europe/Zurich', 'yyyy-MM-dd HH:mm:ss');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (params.source === 'pruefung') {
      // ExamLab-Feedback → eigener Tab
      let sheet = ss.getSheetByName(SHEET_PRUEFUNG_FEEDBACK);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_PRUEFUNG_FEEDBACK);
        sheet.appendRow([
          'Zeitstempel', 'Rolle', 'Ort', 'Modus', 'Typ', 'Kategorie', 'Kommentar',
          'Frage-ID', 'Fragetext', 'Fragetyp', 'Prüfung-ID', 'Gruppe-ID',
          'Bildschirm', 'App-Version', 'Zusatzinfo'
        ]);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, 15).setFontWeight('bold');
        sheet.setColumnWidth(1, 150);  // Zeitstempel
        sheet.setColumnWidth(7, 350);  // Kommentar
        sheet.setColumnWidth(9, 300);  // Fragetext
      }
      sheet.appendRow([
        ts,
        params.rolle || '',
        params.ort || '',
        params.modus || '',
        params.typ || '',
        params.category || '',
        params.comment || '',
        params.frageId || '',
        params.frageText || '',
        params.frageTyp || '',
        params.pruefungId || '',
        params.gruppeId || '',
        params.bildschirm || '',
        params.appVersion || '',
        params.zusatzinfo || ''
      ]);
    } else if (params.pool && params.qid && (params.cat || params.category)) {
      // Übungspool-Problemmeldungen → bestehender Tab
      const sheet = ss.getSheetByName(SHEET_REPORTS);
      if (sheet) {
        sheet.appendRow([
          ts,
          params.pool || '',
          params.qid || '',
          params.topic || '',
          params.qtext || params.text || '',
          params.cat || params.category || '',
          params.desc || params.comment || ''
        ]);
      }
    }

    return ContentService
      .createTextOutput('OK')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService
      .createTextOutput('ERR: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
