// ============================================================
// PRÜFUNGSPLATTFORM WR — GOOGLE APPS SCRIPT (KOMPLETT)
// Gymnasium Hofwil — Stand 18.03.2026
// ============================================================
// Diesen gesamten Code im Apps Script Editor als Code.gs einfügen.
// Danach: Bereitstellen → Bereitstellungen verwalten → Neue Version → Bereitstellen
// ============================================================

// === KONFIGURATION ===
const FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
const CONFIGS_ID = '1QpcC44Ly7BUTLgUkVQtdqjTUDXmgdWdVD8ajjzsd7tE';
const ANTWORTEN_ORDNER_ID = '1PAF1SUnR7nQ175muXn4iQERdQLJ-UnQQ';
const ANTWORTEN_MASTER_ID = '1r4CAoCkE0VxON4MbviqHlklSL3qJRe0uZO7bgPoo1KI';
const ANHAENGE_ORDNER_ID = '1Ql4XuKmxyNW9ZIGsn4getcaB4FhLbjtm';       // LP-Anhänge bei Fragen (Bilder, PDFs)
const MATERIALIEN_ORDNER_ID = '1yBqm-9iKOcp8QptnISmwKaZGbR63mF5V';    // LP-Materialien bei Prüfungen (Gesetze etc.)
const SUS_UPLOADS_ORDNER_ID = '1pQdSujvdzTp5MAbBdJU3ipiaG3zstyu8';     // SuS-Uploads während Prüfung (im Antworten-Ordner)
const LP_DOMAIN = 'gymhofwil.ch';
const SUS_DOMAIN = 'stud.gymhofwil.ch';
const LERNZIELE_TAB = 'Lernziele';

// Zentrale Daten-Sheets (Synergien)
const KURSE_SHEET_ID = '1inmEds_g48-lTFCqo9NUqAcxhDxF2mFSoBM5fO6uJng';       // User muss ID einsetzen
const STUNDENPLAN_SHEET_ID = '1mesBOmPuLewvnY5iNb4iD2zNDUn8-ruK5HE0DsKwUSs';
const SCHULJAHR_SHEET_ID = '1LG52G7uqBMxQDVBeYXLb4jSa20Mjs1OBCKkd4bU3yjM';
const LEHRPLAN_SHEET_ID = '1x3p_-_GjP25JvmCASh2TQSg0EhE0BD3MtHIy2xpo3Xo';

// === WEB-APP ENDPOINTS ===

function doGet(e) {
  const action = e.parameter.action;
  const email = e.parameter.email;

  if (!email || (!email.endsWith('@' + LP_DOMAIN) && !email.endsWith('@' + SUS_DOMAIN))) {
    return jsonResponse({ error: 'Nicht autorisiert' });
  }

  switch (action) {
    case 'ladePruefung':
      return ladePruefung(e.parameter.id, email);
    case 'ladeAlleConfigs':
      return ladeAlleConfigs(email);
    case 'ladeFragenbank':
      return ladeFragenbank(email);
    case 'monitoring':
      return ladeMonitoring(e.parameter.id, email);
    case 'ladeKorrektur':
      return ladeKorrektur(e.parameter.id, email);
    case 'ladeAbgaben':
      return ladeAbgaben(e.parameter.id, email);
    case 'korrekturFortschritt':
      return ladeKorrekturFortschritt(e.parameter.id, email);
    case 'ladeKorrekturStatus':
      return ladeKorrekturStatusEndpoint(e.parameter.id || e.parameter.pruefungId, email);
    case 'ladeNachrichten':
      return ladeNachrichtenEndpoint(e.parameter.id, email);
    case 'ladeDriveFile': {
      // PDF/Datei aus Google Drive als Base64 laden (für PDF.js im Browser)
      const fileId = e.parameter.fileId;
      if (!fileId) return jsonResponse({ error: 'fileId fehlt' });
      try {
        const file = DriveApp.getFileById(fileId);
        const blob = file.getBlob();
        const base64 = Utilities.base64Encode(blob.getBytes());
        return jsonResponse({ base64: base64, mimeType: blob.getContentType(), name: file.getName() });
      } catch (err) {
        return jsonResponse({ error: 'Datei nicht gefunden oder kein Zugriff: ' + err.message });
      }
    }
    case 'ladeKlassenlisten': {
      // Nur LP darf Klassenlisten laden
      if (!email || !email.endsWith('@' + LP_DOMAIN)) {
        return jsonResponse({ error: 'Nur LP kann Klassenlisten laden' });
      }
      try {
        const ss = SpreadsheetApp.openById(KURSE_SHEET_ID);
        const sheets = ss.getSheets();
        const result = [];
        for (const sheet of sheets) {
          const sheetName = sheet.getName();
          // Überspringe Meta-Tab "Kurse" und versteckte/Template-Tabs
          if (sheetName === 'Kurse' || sheetName.startsWith('_') || sheetName === 'Template') continue;
          const data = getSheetData(sheet);
          if (!data || data.length === 0) continue;
          // SuS-Tabs: Spalten name, vorname, email, klasse, schuelerID, geschlecht
          for (const row of data) {
            const emailVal = String(row.email || '').trim().toLowerCase();
            if (!emailVal || !emailVal.includes('@')) continue;
            result.push({
              klasse: String(row.klasse || '').trim(),
              kurs: sheetName,
              name: String(row.name || '').trim(),
              vorname: String(row.vorname || '').trim(),
              email: emailVal,
              geschlecht: String(row.geschlecht || '').trim(),
            });
          }
        }
        return jsonResponse({ success: true, klassenlisten: result });
      } catch (err) {
        return jsonResponse({ error: 'Klassenlisten nicht ladbar: ' + String(err) });
      }
    }
    case 'ladeKurse': return ladeKurseEndpoint({ email: e.parameter.email });
    case 'ladeKursDetails': return ladeKursDetailsEndpoint({ email: e.parameter.email, kursId: e.parameter.kursId });
    case 'ladeSchuljahr': return ladeSchuljahrEndpoint({ email: e.parameter.email });
    case 'ladeLehrplan': return ladeLehrplanEndpoint({ email: e.parameter.email, fach: e.parameter.fach, gefaess: e.parameter.gefaess });
    default:
      return jsonResponse({ error: 'Unbekannte Aktion' });
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;

  switch (action) {
    case 'speichereAntworten':
      return speichereAntworten(body);
    case 'heartbeat':
      return heartbeat(body);
    case 'speichereConfig':
      return speichereConfig(body);
    case 'speichereFrage':
      return speichereFrage(body);
    case 'loescheFrage':
      return loescheFrage(body);
    case 'starteKorrektur':
      return starteKorrekturEndpoint(body);
    case 'speichereKorrekturZeile':
      return speichereKorrekturZeile(body);
    case 'generiereUndSendeFeedback':
      return generiereUndSendeFeedbackEndpoint(body);
    case 'validiereSchuelercode':
      return validiereSchuelercode(body);
    case 'schalteFrei':
      return schalteFreiEndpoint(body);
    case 'sendeNachricht':
      return sendeNachrichtEndpoint(body);
    case 'uploadAnhang':
      return uploadAnhang(body);
    case 'uploadMaterial':
      return uploadMaterial(body);
    case 'loeschePruefung':
      return loeschePruefung(body);
    case 'kiAssistent':
      return kiAssistentEndpoint(body);
    case 'korrekturFreigeben':
      return korrekturFreigebenEndpoint(body);
    case 'ladeKorrekturenFuerSuS':
      return ladeKorrekturenFuerSuSEndpoint(body);
    case 'ladeKorrekturDetail':
      return ladeKorrekturDetailEndpoint(body);
    case 'importierePoolFragen':
      return importierePoolFragen(body);
    case 'importiereLernziele':
      return importiereLernziele(body);
    case 'importiereLehrplanziele':
      return importiereLehrplanzieleEndpoint(body);
    case 'ladeLernziele':
      return ladeLernziele(body);
    case 'schreibePoolAenderung':
      return schreibePoolAenderung(body);
    case 'beendePruefung':
      return beendePruefungEndpoint(body);
    case 'resetPruefung':
      return resetPruefungEndpoint(body);
    case 'sebAusnahmeErlauben':
      return sebAusnahmeErlauben(body);
    case 'entsperreSuS':
      return entsperreSuSEndpoint(body);
    case 'setzeKontrollStufe':
      return setzeKontrollStufeEndpoint(body);
    case 'ladeTrackerDaten':
      return ladeTrackerDatenEndpoint(body);
    case 'setzeTeilnehmer': {
      const email = body.email;
      if (!email || !email.endsWith('@' + LP_DOMAIN)) {
        return jsonResponse({ error: 'Nur LP darf Teilnehmer setzen' });
      }
      const pruefungId = body.pruefungId;
      const teilnehmer = body.teilnehmer; // Array<Teilnehmer>
      if (!pruefungId || !Array.isArray(teilnehmer)) {
        return jsonResponse({ error: 'pruefungId und teilnehmer[] erforderlich' });
      }
      try {
        const ss = SpreadsheetApp.openById(CONFIGS_ID);
        const sheet = ss.getSheetByName('Configs');
        if (!sheet) return jsonResponse({ error: 'Configs-Sheet nicht gefunden' });
        const data = getSheetData(sheet);
        const rowIndex = data.findIndex(r => r.id === pruefungId);
        if (rowIndex < 0) return jsonResponse({ error: 'Prüfung nicht gefunden' });

        // Teilnehmer-Spalte finden oder erstellen
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        let teilnehmerCol = headers.indexOf('teilnehmer');
        if (teilnehmerCol < 0) {
          teilnehmerCol = headers.length;
          sheet.getRange(1, teilnehmerCol + 1).setValue('teilnehmer');
        }

        // Teilnehmer als JSON speichern
        sheet.getRange(rowIndex + 2, teilnehmerCol + 1).setValue(JSON.stringify(teilnehmer));

        // erlaubteEmails synchronisieren
        const emailsCol = headers.indexOf('erlaubteEmails');
        if (emailsCol >= 0) {
          const emails = teilnehmer.map(t => t.email);
          sheet.getRange(rowIndex + 2, emailsCol + 1).setValue(JSON.stringify(emails));
        }

        // erlaubteKlasse synchronisieren
        const klasseCol = headers.indexOf('erlaubteKlasse');
        if (klasseCol >= 0) {
          const klassen = [...new Set(teilnehmer.map(t => t.klasse))];
          sheet.getRange(rowIndex + 2, klasseCol + 1).setValue(klassen.length === 1 ? klassen[0] : '');
        }

        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: 'Teilnehmer setzen fehlgeschlagen: ' + String(err) });
      }
    }
    case 'sendeEinladungen': {
      const email = body.email;
      if (!email || !email.endsWith('@' + LP_DOMAIN)) {
        return jsonResponse({ error: 'Nur LP darf Einladungen senden' });
      }
      const { pruefungId, pruefungTitel, pruefungUrl, empfaenger } = body;
      // empfaenger: Array<{ email: string, name: string, vorname: string }>
      if (!pruefungId || !pruefungTitel || !pruefungUrl || !Array.isArray(empfaenger)) {
        return jsonResponse({ error: 'Pflichtfelder fehlen' });
      }
      const ergebnisse = [];
      for (const emp of empfaenger) {
        try {
          MailApp.sendEmail({
            to: emp.email,
            subject: `Prüfung: ${pruefungTitel}`,
            htmlBody: `
              <p>Hallo ${emp.vorname},</p>
              <p>Du wurdest zur folgenden Prüfung eingeladen:</p>
              <p><strong>${pruefungTitel}</strong></p>
              <p>Öffne diesen Link wenn die Lehrperson die Prüfung freigibt:</p>
              <p><a href="${pruefungUrl}">${pruefungUrl}</a></p>
              <p>Viel Erfolg!</p>
            `,
          });
          ergebnisse.push({ email: emp.email, erfolg: true });
        } catch (err) {
          ergebnisse.push({ email: emp.email, erfolg: false, fehler: String(err) });
        }
      }
      return jsonResponse({ success: true, ergebnisse });
    }
    default:
      return jsonResponse({ error: 'Unbekannte Aktion' });
  }
}

// === ANHANG UPLOAD ===

function uploadAnhang(body) {
  try {
    var email = body.email;
    var frageId = body.frageId;
    var dateiname = body.dateiname;
    var mimeType = body.mimeType;
    var groesseBytes = body.groesseBytes;
    var base64Data = body.base64Data;

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!base64Data || !dateiname) {
      return jsonResponse({ error: 'Keine Dateidaten' });
    }
    if (groesseBytes > 5 * 1024 * 1024) {
      return jsonResponse({ error: 'Datei zu gross (max. 5 MB)' });
    }

    // Base64 dekodieren und als Blob erstellen
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, dateiname);

    // Direkt in den Anhänge-Ordner speichern
    var anhaengeOrdner = DriveApp.getFolderById(ANHAENGE_ORDNER_ID);
    var file = anhaengeOrdner.createFile(blob);

    // Öffentlich lesbar machen (für SuS während Prüfung)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var anhang = {
      id: Utilities.getUuid(),
      dateiname: dateiname,
      mimeType: mimeType,
      groesseBytes: groesseBytes,
      driveFileId: file.getId(),
    };

    return jsonResponse({ success: true, ...anhang });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === MATERIAL UPLOAD ===

function uploadMaterial(body) {
  try {
    var email = body.email;
    var dateiname = body.dateiname;
    var mimeType = body.mimeType;
    var groesseBytes = body.groesseBytes;
    var base64Data = body.base64Data;

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!base64Data || !dateiname) {
      return jsonResponse({ error: 'Keine Dateidaten' });
    }
    if (groesseBytes > 10 * 1024 * 1024) {
      return jsonResponse({ error: 'Datei zu gross (max. 10 MB)' });
    }

    // Base64 dekodieren und als Blob erstellen
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, dateiname);

    // Direkt in den Materialien-Ordner speichern
    var materialOrdner = DriveApp.getFolderById(MATERIALIEN_ORDNER_ID);
    var file = materialOrdner.createFile(blob);

    // Öffentlich lesbar machen (für SuS während Prüfung)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = file.getId();
    var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

    return jsonResponse({
      success: true,
      driveFileId: fileId,
      url: previewUrl,
      dateiname: dateiname,
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === HILFSFUNKTIONEN ===

function getOrCreateAntwortenSheet(pruefungId) {
  var tabName = 'Antworten_' + pruefungId;

  // 1. Master-Spreadsheet: Tab suchen oder erstellen
  if (ANTWORTEN_MASTER_ID) {
    var ss = SpreadsheetApp.openById(ANTWORTEN_MASTER_ID);
    var sheet = ss.getSheetByName(tabName);
    if (sheet) return sheet;

    // Tab erstellen
    sheet = ss.insertSheet(tabName);
    var headers = ['email', 'name', 'version', 'antworten', 'letzterSave', 'istAbgabe', 'letzterHeartbeat', 'heartbeats', 'beantworteteFragen', 'gesamtFragen'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return sheet;
  }

  // 2. Fallback: alte Methode (DriveApp-Ordner) für Migration
  try {
    var ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    var files = ordner.getFilesByName(tabName);
    if (files.hasNext()) {
      return SpreadsheetApp.open(files.next()).getSheets()[0];
    }
  } catch (e) { /* DriveApp nicht verfügbar */ }

  return null;
}

// Hilfsfunktion: Antworten-Sheet finden (Alias für Abwärtskompatibilität)
function findeAntwortenSheet(pruefungId) {
  return getOrCreateAntwortenSheet(pruefungId);
}


function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  // Header normalisieren: kursID → kursId, schuelerID → schuelerId
  const headers = data[0].map(h => {
    var s = String(h).trim();
    if (s === 'kursID') return 'kursId';
    if (s === 'schuelerID') return 'schuelerId';
    return s;
  });
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : '';
    });
    return obj;
  });
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('[safeJsonParse] Parse-Fehler für Wert (erste 200 Zeichen): ' + String(str).substring(0, 200) + ' — Fehler: ' + e.message);
    return fallback;
  }
}

/**
 * Stellt sicher, dass alle Schlüssel aus rowData als Spaltenheader existieren.
 * Fehlende Spalten werden automatisch am Ende hinzugefügt.
 * Gibt die aktualisierten Headers zurück.
 */
function ensureColumns(sheet, headers, rowData) {
  var headerSet = {};
  for (var i = 0; i < headers.length; i++) {
    headerSet[headers[i]] = true;
  }
  var keys = Object.keys(rowData);
  var added = [];
  for (var j = 0; j < keys.length; j++) {
    var key = keys[j];
    if (rowData[key] !== undefined && !headerSet[key]) {
      var nextCol = headers.length + 1;
      sheet.getRange(1, nextCol).setValue(key).setFontWeight('bold');
      headers.push(key);
      headerSet[key] = true;
      added.push(key);
    }
  }
  if (added.length > 0) {
    console.log('[ensureColumns] Neue Spalten hinzugefügt: ' + added.join(', '));
  }
  return headers;
}

// === SYNERGY ENDPOINTS (Zentrale Kurs-Verwaltung) ===

function ladeKurseEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var sheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName('Kurse');
    if (!sheet) return jsonResponse({ kurse: [] });
    var data = getSheetData(sheet);
    var kurse = data.filter(function(r) { return r.lpEmail === email && r.aktiv !== 'false'; });
    return jsonResponse({ kurse: kurse });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}

function ladeKursDetailsEndpoint(body) {
  try {
    var email = body.email;
    var kursId = body.kursId;
    if (!email || !kursId) return jsonResponse({ error: 'Parameter fehlen' });

    // Kurs-Meta laden
    var kurseSheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName('Kurse');
    var kursMeta = getSheetData(kurseSheet).find(function(r) { return r.kursId === kursId; });
    if (!kursMeta) return jsonResponse({ error: 'Kurs nicht gefunden' });

    // SuS-Liste: Tab mit kursId suchen (Tab-Name = kursId)
    var susSheet = SpreadsheetApp.openById(KURSE_SHEET_ID).getSheetByName(kursId);
    var sus = susSheet ? getSheetData(susSheet) : [];

    // Stundenplan (Tab "Stundenplan": kursId, wochentag, lektionen, zeit, raum, halbklasse, semester, phasen, raum_s1, raum_s2, bemerkung)
    var spSheet = SpreadsheetApp.openById(STUNDENPLAN_SHEET_ID).getSheetByName('Stundenplan');
    if (!spSheet) spSheet = SpreadsheetApp.openById(STUNDENPLAN_SHEET_ID).getSheets()[0];
    var stundenplan = spSheet ? getSheetData(spSheet).filter(function(r) { return r.kursId === kursId; }) : [];

    // TaF-Phasen (global, nicht kursId-spezifisch: phase, startKW, endKW, schuljahr, bemerkung)
    var phasenSheet = SpreadsheetApp.openById(SCHULJAHR_SHEET_ID).getSheetByName('TaF-Phasen');
    var phasen = phasenSheet ? getSheetData(phasenSheet) : [];

    return jsonResponse({
      kurs: kursMeta,
      schueler: sus,
      stundenplan: stundenplan,
      phasen: phasen
    });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}

function ladeSchuljahrEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var ss = SpreadsheetApp.openById(SCHULJAHR_SHEET_ID);

    var ferienSheet = ss.getSheetByName('Ferien');
    var ferien = ferienSheet ? getSheetData(ferienSheet) : [];

    var swSheet = ss.getSheetByName('Sonderwochen');
    var sonderwochen = swSheet ? getSheetData(swSheet) : [];

    var semSheet = ss.getSheetByName('Semester');
    var semester = semSheet ? getSheetData(semSheet) : [];

    var phasenSheet = ss.getSheetByName('TaF-Phasen');
    var phasen = phasenSheet ? getSheetData(phasenSheet) : [];

    return jsonResponse({ ferien: ferien, sonderwochen: sonderwochen, semester: semester, phasen: phasen });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}

function ladeLehrplanEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var fach = body.fach || null;
    var gefaess = body.gefaess || null;
    var ss = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID);

    var lzSheet = ss.getSheetByName('Lehrplanziele');
    var lz = lzSheet ? getSheetData(lzSheet) : [];
    if (fach) lz = lz.filter(function(r) { return r.fach === fach; });
    if (gefaess) lz = lz.filter(function(r) { return r.gefaess === gefaess; });

    // Beurteilungsregeln (label, deadline, minNoten, semester, stufe, wochenlektionen, bemerkung)
    var brSheet = ss.getSheetByName('Beurteilungsregeln');
    var regeln = brSheet ? getSheetData(brSheet) : [];

    return jsonResponse({ lehrplanziele: lz, beurteilungsregeln: regeln });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// === PRÜFUNG LADEN ===

function ladePruefung(pruefungId, email) {
  try {
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configData = getSheetData(configSheet);
    const configRow = configData.find(row => row.id === pruefungId);

    if (!configRow) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    const istLP = email.endsWith('@' + LP_DOMAIN);
    const erlaubteKlasse = configRow.erlaubteKlasse || '';
    const klasseGesetzt = erlaubteKlasse && erlaubteKlasse !== '—' && erlaubteKlasse !== '-';

    if (!istLP && klasseGesetzt) {
      // erlaubteKlasse enthält eine Klasse (z.B. "29c") — wir müssen den passenden Kurs-Tab finden
      const kurseSS = SpreadsheetApp.openById(KURSE_SHEET_ID);
      const kurseMetaSheet = kurseSS.getSheetByName('Kurse');
      const kurseData = kurseMetaSheet ? getSheetData(kurseMetaSheet) : [];
      // Suche Kurs, dessen klassen-Feld die erlaubteKlasse enthält
      const passenderKurs = kurseData.find(k => {
        const klassen = String(k.klassen || '').split(',').map(s => s.trim());
        return klassen.includes(erlaubteKlasse);
      });
      if (!passenderKurs) {
        return jsonResponse({ error: 'Klassenliste nicht gefunden (kein Kurs für Klasse ' + erlaubteKlasse + ')' });
      }
      const klassenSheet = kurseSS.getSheetByName(passenderKurs.kursId);
      if (!klassenSheet) {
        return jsonResponse({ error: 'SuS-Tab nicht gefunden: ' + passenderKurs.kursId });
      }
      const klassenData = getSheetData(klassenSheet);
      const susEintrag = klassenData.find(row => row.email === email);
      if (!susEintrag) {
        return jsonResponse({ error: 'Kein Zugang zu dieser Prüfung' });
      }
    }

    const config = {
      id: configRow.id,
      titel: configRow.titel,
      klasse: configRow.klasse,
      gefaess: configRow.gefaess,
      semester: configRow.semester,
      fachbereiche: (configRow.fachbereiche || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
      datum: configRow.datum,
      typ: configRow.typ,
      modus: configRow.modus || 'pruefung',
      zeitModus: configRow.zeitModus || 'countdown',
      dauerMinuten: Number(configRow.dauerMinuten),
      gesamtpunkte: Number(configRow.gesamtpunkte),
      erlaubteKlasse: configRow.erlaubteKlasse,
      sebErforderlich: configRow.sebErforderlich === 'true',
      abschnitte: JSON.parse(configRow.abschnitte || '[]'),
      zeitanzeigeTyp: configRow.zeitanzeigeTyp || 'countdown',
      ruecknavigation: configRow.ruecknavigation !== 'false',
      autoSaveIntervallSekunden: Number(configRow.autoSaveIntervallSekunden) || 30,
      heartbeatIntervallSekunden: Number(configRow.heartbeatIntervallSekunden) || 10,
      zufallsreihenfolgeFragen: configRow.zufallsreihenfolgeFragen === 'true',
      freigeschaltet: configRow.freigeschaltet === 'true',
      zeitverlaengerungen: safeJsonParse(configRow.zeitverlaengerungen, {}),
      sebAusnahmen: safeJsonParse(configRow.sebAusnahmen, []),
      teilnehmer: safeJsonParse(configRow.teilnehmer, []),
      materialien: safeJsonParse(configRow.materialien, []),
      beendetUm: configRow.beendetUm || undefined,
      durchfuehrungId: configRow.durchfuehrungId || undefined,
      materialien: safeJsonParse(configRow.materialien, []),
      korrektur: { aktiviert: false, modus: 'batch' },
      feedback: { zeitpunkt: 'nach-review', format: 'pdf', detailgrad: 'vollstaendig' },
    };

    const fragenIds = config.abschnitte.flatMap(a => a.fragenIds);
    const fragen = ladeFragen(fragenIds);
    return jsonResponse({ config, fragen });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === FRAGEN LADEN ===

function ladeFragen(fragenIds) {
  const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  const tabs = ['VWL', 'BWL', 'Recht', 'Informatik'];
  const alleFragen = [];

  // Erste Runde: Direkte Fragen laden
  for (const tab of tabs) {
    const sheet = fragenbank.getSheetByName(tab);
    if (!sheet) continue;
    const data = getSheetData(sheet);
    for (const row of data) {
      if (fragenIds.includes(row.id)) {
        alleFragen.push(parseFrage(row, tab));
      }
    }
  }

  // Zweite Runde: Teilaufgaben aus Aufgabengruppen nachladen
  const teilaufgabenIds = [];
  for (const frage of alleFragen) {
    if (frage.typ === 'aufgabengruppe' && frage.teilaufgabenIds) {
      for (const tid of frage.teilaufgabenIds) {
        if (!alleFragen.some(f => f.id === tid) && !teilaufgabenIds.includes(tid)) {
          teilaufgabenIds.push(tid);
        }
      }
    }
  }

  if (teilaufgabenIds.length > 0) {
    for (const tab of tabs) {
      const sheet = fragenbank.getSheetByName(tab);
      if (!sheet) continue;
      const data = getSheetData(sheet);
      for (const row of data) {
        if (teilaufgabenIds.includes(row.id)) {
          alleFragen.push(parseFrage(row, tab));
        }
      }
    }
  }

  return alleFragen;
}

function parseFrage(row, fachbereich) {
  const base = {
    id: row.id,
    version: Number(row.version) || 1,
    erstelltAm: row.erstelltAm || new Date().toISOString(),
    geaendertAm: row.geaendertAm || new Date().toISOString(),
    fachbereich: fachbereich,
    thema: row.thema || '',
    unterthema: row.unterthema || '',
    semester: (row.semester || '').split(',').map(s => s.trim()).filter(Boolean),
    gefaesse: (row.gefaesse || '').split(',').map(s => s.trim()).filter(Boolean),
    bloom: row.bloom || 'K1',
    tags: (row.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    punkte: Number(row.punkte) || 1,
    musterlosung: row.musterlosung || '',
    bewertungsraster: safeJsonParse(row.bewertungsraster, []),
    anhaenge: safeJsonParse(row.anhaenge, []),
    verwendungen: [],
    quelle: row.quelle || 'manuell',
    autor: row.autor || '',
    geteilt: row.geteilt || 'privat',
    geteiltVon: row.geteiltVon || '',
    poolId: row.poolId || '',
    poolGeprueft: row.poolGeprueft === 'true',
    pruefungstauglich: row.pruefungstauglich === 'true',
    poolContentHash: row.poolContentHash || '',
    poolUpdateVerfuegbar: row.poolUpdateVerfuegbar === 'true',
    poolVersion: safeJsonParse(row.poolVersion, undefined),
    lernzielIds: (row.lernzielIds || '').split(',').filter(Boolean),
  };

  // Typ-spezifische Felder aus typDaten-Spalte laden (falls vorhanden)
  const typDaten = safeJsonParse(row.typDaten, {});

  switch (row.typ) {
    case 'mc':
      return {
        ...base,
        typ: 'mc',
        fragetext: row.fragetext || '',
        optionen: typDaten.optionen || safeJsonParse(row.optionen, []),
        mehrfachauswahl: typDaten.mehrfachauswahl || row.mehrfachauswahl === 'true',
        zufallsreihenfolge: typDaten.zufallsreihenfolge || row.zufallsreihenfolge === 'true',
      };
    case 'freitext':
      return {
        ...base,
        typ: 'freitext',
        fragetext: row.fragetext || '',
        laenge: typDaten.laenge || row.laenge || 'mittel',
        maxZeichen: row.maxZeichen ? Number(row.maxZeichen) : undefined,
        hilfstextPlaceholder: typDaten.hilfstextPlaceholder || row.hilfstextPlaceholder || '',
      };
    case 'lueckentext':
      return {
        ...base,
        typ: 'lueckentext',
        fragetext: row.fragetext || '',
        textMitLuecken: typDaten.textMitLuecken || row.textMitLuecken || '',
        luecken: typDaten.luecken || safeJsonParse(row.luecken, []),
      };
    case 'zuordnung':
      return {
        ...base,
        typ: 'zuordnung',
        fragetext: row.fragetext || '',
        paare: typDaten.paare || safeJsonParse(row.paare, []),
        zufallsreihenfolge: typDaten.zufallsreihenfolge || false,
      };
    case 'richtigfalsch':
      return {
        ...base,
        typ: 'richtigfalsch',
        fragetext: row.fragetext || '',
        aussagen: typDaten.aussagen || safeJsonParse(row.aussagen, []),
      };
    case 'berechnung':
      return {
        ...base,
        typ: 'berechnung',
        fragetext: row.fragetext || '',
        ergebnisse: typDaten.ergebnisse || safeJsonParse(row.ergebnisse, []),
        rechenwegErforderlich: typDaten.rechenwegErforderlich || false,
        hilfsmittel: typDaten.hilfsmittel || '',
      };
    case 'buchungssatz':
      return {
        ...base,
        typ: 'buchungssatz',
        geschaeftsfall: row.fragetext || '',
        buchungen: typDaten.buchungen || [],
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
      };
    case 'tkonto':
      return {
        ...base,
        typ: 'tkonto',
        aufgabentext: row.fragetext || '',
        geschaeftsfaelle: typDaten.geschaeftsfaelle || [],
        konten: typDaten.konten || [],
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
        bewertungsoptionen: typDaten.bewertungsoptionen || {
          beschriftungSollHaben: true, kontenkategorie: true,
          zunahmeAbnahme: true, buchungenKorrekt: true, saldoKorrekt: true
        },
      };
    case 'kontenbestimmung':
      return {
        ...base,
        typ: 'kontenbestimmung',
        aufgabentext: row.fragetext || '',
        modus: typDaten.modus || 'gemischt',
        aufgaben: typDaten.aufgaben || [],
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
      };
    case 'bilanzstruktur':
      return {
        ...base,
        typ: 'bilanzstruktur',
        aufgabentext: row.fragetext || '',
        modus: typDaten.modus || 'bilanz',
        kontenMitSaldi: typDaten.kontenMitSaldi || [],
        loesung: typDaten.loesung || {},
        bewertungsoptionen: typDaten.bewertungsoptionen || {
          seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
          kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true,
          bilanzsummeOderGewinn: true, mehrstufigkeit: true,
        },
      };
    case 'aufgabengruppe':
      return {
        ...base,
        typ: 'aufgabengruppe',
        kontext: row.fragetext || '',
        teilaufgabenIds: typDaten.teilaufgabenIds || [],
        kontextAnhaenge: typDaten.kontextAnhaenge || [],
      };
    case 'visualisierung':
      return {
        ...base,
        typ: 'visualisierung',
        fragetext: row.fragetext || '',
        untertyp: typDaten.untertyp || row.untertyp || 'zeichnen',
        breite: typDaten.breite || 800,
        hoehe: typDaten.hoehe || 400,
        hintergrundBild: typDaten.hintergrundBild || '',
        werkzeuge: typDaten.werkzeuge || ['stift', 'linie', 'text', 'radierer'],
      };
    case 'pdf':
      return {
        ...base,
        typ: 'pdf',
        fragetext: row.fragetext || '',
        pdfDriveFileId: typDaten.pdfDriveFileId || row.pdfDriveFileId || '',
        pdfUrl: typDaten.pdfUrl || row.pdfUrl || '',
        pdfBase64: typDaten.pdfBase64 || '',
        pdfDateiname: typDaten.pdfDateiname || row.pdfDateiname || '',
        seitenAnzahl: typDaten.seitenAnzahl || Number(row.seitenAnzahl) || 0,
        kategorien: typDaten.kategorien || [],
        erlaubteWerkzeuge: typDaten.erlaubteWerkzeuge || ['highlighter', 'kommentar', 'freihand'],
      };
    default:
      return { ...base, typ: row.typ, fragetext: row.fragetext || '' };
  }
}

// === ANTWORTEN SPEICHERN ===

function speichereAntworten(body) {
  try {
    const { pruefungId, email, antworten, version, istAbgabe, gesamtFragen, requestId } = body;
    if (!pruefungId || !email || !antworten) {
      return jsonResponse({ error: 'Fehlende Daten' });
    }

    // Beantwortete Fragen zählen
    var beantwortetCount = 0;
    if (typeof antworten === 'object') {
      var keys = Object.keys(antworten);
      for (var i = 0; i < keys.length; i++) {
        var val = antworten[keys[i]];
        if (val !== null && val !== undefined && val !== '') {
          beantwortetCount++;
        }
      }
    }

    let sheet = getOrCreateAntwortenSheet(pruefungId);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = getSheetData(sheet);
    const existingRow = data.findIndex(row => row.email === email);

    // Idempotenz-Check: Gleiche requestId = bereits verarbeitet
    if (requestId && existingRow >= 0 && data[existingRow].letzteRequestId === requestId) {
      return jsonResponse({ success: true, message: 'Bereits verarbeitet (idempotent)' });
    }

    const rowData = {
      email: email,
      version: version,
      antworten: JSON.stringify(antworten),
      letzterSave: new Date().toISOString(),
      istAbgabe: istAbgabe ? 'true' : 'false',
      beantworteteFragen: beantwortetCount,
      gesamtFragen: gesamtFragen || 0,
      letzteRequestId: requestId || '',
    };

    // Fehlende Spalten automatisch hinzufügen
    headers = ensureColumns(sheet, headers, rowData);

    if (existingRow >= 0) {
      const altVersion = Number(data[existingRow].version) || 0;
      if (version <= altVersion && !istAbgabe) {
        return jsonResponse({ success: true, message: 'Version nicht neuer' });
      }
      const rowIndex = existingRow + 2;
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      const newRow = headers.map(h => rowData[h] || '');
      sheet.appendRow(newRow);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === HEARTBEAT ===

function heartbeat(body) {
  try {
    const { pruefungId, email, timestamp } = body;
    const sheet = getOrCreateAntwortenSheet(pruefungId);
    const data = getSheetData(sheet);
    let existingRow = data.findIndex(row => row.email === email);

    // Neue Zeile anlegen falls SuS noch nicht im Sheet (Warteraum-Heartbeat)
    if (existingRow < 0) {
      const hdrs = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const newRow = hdrs.map(h => {
        switch (h) {
          case 'email': return email;
          case 'name': return body.name || email;
          case 'letzterHeartbeat': return timestamp || new Date().toISOString();
          case 'heartbeats': return 1;
          case 'version': return 0;
          case 'istAbgabe': return 'false';
          case 'gesperrt': return 'false';
          case 'verstossZaehler': return 0;
          case 'verstoesse': return '[]';
          case 'geraet': return '';
          case 'vollbild': return 'false';
          case 'kontrollStufe': return '';
          case 'autoSaveCount': return 0;
          default: return '';
        }
      });
      sheet.appendRow(newRow);
      // Zeile wurde angelegt → success zurückgeben
      return jsonResponse({ success: true });
    }

    if (existingRow >= 0) {
      const rowIndex = existingRow + 2;
      let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const heartbeatCol = headers.indexOf('letzterHeartbeat');
      const countCol = headers.indexOf('heartbeats');
      if (heartbeatCol >= 0) {
        sheet.getRange(rowIndex, heartbeatCol + 1).setValue(timestamp);
      }
      if (countCol >= 0) {
        const current = Number(sheet.getRange(rowIndex, countCol + 1).getValue()) || 0;
        sheet.getRange(rowIndex, countCol + 1).setValue(current + 1);
      }

      // aktuelleFrage-Spalte aktualisieren (falls vom Client mitgesendet)
      if (body.aktuelleFrage !== undefined) {
        let aktFrageCol = headers.indexOf('aktuelleFrage');
        if (aktFrageCol < 0) {
          aktFrageCol = headers.length;
          sheet.getRange(1, aktFrageCol + 1).setValue('aktuelleFrage');
          headers.push('aktuelleFrage');
        }
        sheet.getRange(rowIndex, aktFrageCol + 1).setValue(body.aktuelleFrage);
      }

      // beantworteteFragen-Spalte aktualisieren (falls vom Client mitgesendet)
      if (body.beantworteteFragen !== undefined) {
        let beantwortetCol = headers.indexOf('beantworteteFragen');
        if (beantwortetCol < 0) {
          beantwortetCol = headers.length;
          sheet.getRange(1, beantwortetCol + 1).setValue('beantworteteFragen');
          headers.push('beantworteteFragen');
        }
        sheet.getRange(rowIndex, beantwortetCol + 1).setValue(body.beantworteteFragen);
      }

      // autoSaveCount-Spalte aktualisieren (falls vom Client mitgesendet)
      if (body.autoSaveCount !== undefined) {
        let asCCol = headers.indexOf('autoSaveCount');
        if (asCCol < 0) {
          asCCol = headers.length;
          sheet.getRange(1, asCCol + 1).setValue('autoSaveCount');
          headers.push('autoSaveCount');
        }
        sheet.getRange(rowIndex, asCCol + 1).setValue(body.autoSaveCount);
      }

      // Lockdown-Metadaten speichern (falls vom Client mitgesendet)
      if (body.lockdownMeta) {
        var lockdownFelder = {
          geraet: body.lockdownMeta.geraet || '',
          vollbild: String(body.lockdownMeta.vollbild),
          kontrollStufe: body.lockdownMeta.kontrollStufe || '',
          verstossZaehler: body.lockdownMeta.verstossZaehler || 0,
          gesperrt: String(body.lockdownMeta.gesperrt)
        };
        // Fehlende Spalten automatisch hinzufügen
        headers = ensureColumns(sheet, headers, lockdownFelder);
        var lockdownKeys = Object.keys(lockdownFelder);
        for (var lk = 0; lk < lockdownKeys.length; lk++) {
          var col = headers.indexOf(lockdownKeys[lk]);
          if (col >= 0) {
            sheet.getRange(rowIndex, col + 1).setValue(lockdownFelder[lockdownKeys[lk]]);
          }
        }
        // Verstoesse append (nicht überschreiben)
        if (body.lockdownMeta.neusteVerstoesse && body.lockdownMeta.neusteVerstoesse.length > 0) {
          var verstCol = headers.indexOf('verstoesse');
          if (verstCol < 0) {
            verstCol = headers.length;
            sheet.getRange(1, verstCol + 1).setValue('verstoesse').setFontWeight('bold');
            headers.push('verstoesse');
          }
          var bestehende = safeJsonParse(sheet.getRange(rowIndex, verstCol + 1).getValue(), []);
          var alle = bestehende.concat(body.lockdownMeta.neusteVerstoesse);
          sheet.getRange(rowIndex, verstCol + 1).setValue(JSON.stringify(alle));
        }
      }

      // Entsperrt-Flag prüfen und zurücksetzen (LP hat SuS entsperrt)
      var entsperrt = false;
      var entsperrtCol = headers.indexOf('entsperrt');
      if (entsperrtCol >= 0) {
        if (sheet.getRange(rowIndex, entsperrtCol + 1).getValue() === 'true') {
          entsperrt = true;
          sheet.getRange(rowIndex, entsperrtCol + 1).setValue('');
        }
      }

      // KontrollStufe-Override prüfen
      var kontrollStufeOverride = null;
      var ksoCol = headers.indexOf('kontrollStufeOverride');
      if (ksoCol >= 0) {
        var ksoVal = sheet.getRange(rowIndex, ksoCol + 1).getValue();
        if (ksoVal) {
          kontrollStufeOverride = String(ksoVal);
        }
      }

      // Beenden-Signal prüfen (individuell → global)
      var beendetUm = null;
      var restzeitMinutenWert = null;

      // 1. Individuell (aus Antworten-Sheet)
      const beendetUmColIdx = headers.indexOf('beendetUm');
      if (beendetUmColIdx >= 0) {
        const val = sheet.getRange(rowIndex, beendetUmColIdx + 1).getValue();
        if (val) {
          beendetUm = val;
          const rzmColIdx = headers.indexOf('restzeitMinuten');
          if (rzmColIdx >= 0) {
            restzeitMinutenWert = sheet.getRange(rowIndex, rzmColIdx + 1).getValue() || null;
          }
        }
      }

      // 2. Global (aus Configs-Sheet) falls kein individuelles + SEB-Ausnahme + Phase prüfen
      var sebAusnahme = false;
      var pruefungFreigeschaltet = false;
      if (!beendetUm) {
        const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
        if (configSheet) {
          const configHeaders = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];
          const configBeendetCol = configHeaders.indexOf('beendetUm');
          const configData = configSheet.getDataRange().getValues();
          const configIdCol = configHeaders.indexOf('id');
          for (var i = 1; i < configData.length; i++) {
            if (configData[i][configIdCol] === pruefungId) {
              if (configBeendetCol >= 0 && configData[i][configBeendetCol]) {
                beendetUm = configData[i][configBeendetCol];
                const configRzmCol = configHeaders.indexOf('restzeitMinuten');
                if (configRzmCol >= 0) {
                  restzeitMinutenWert = configData[i][configRzmCol] || null;
                }
              }
              // SEB-Ausnahme prüfen
              const sebAusnahmenCol = configHeaders.indexOf('sebAusnahmen');
              if (sebAusnahmenCol >= 0) {
                var ausnahmen = safeJsonParse(configData[i][sebAusnahmenCol], []);
                if (ausnahmen.indexOf(email) >= 0) {
                  sebAusnahme = true;
                }
              }
              // Freischaltung prüfen (für Phase-Info an SuS)
              const freiCol = configHeaders.indexOf('freigeschaltet');
              if (freiCol >= 0 && configData[i][freiCol] === 'true') {
                pruefungFreigeschaltet = true;
              }
              break;
            }
          }
        }
      } else {
        // beendetUm aus Antworten-Sheet gefunden, trotzdem SEB-Ausnahme prüfen
        const configSheet2 = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
        if (configSheet2) {
          const ch2 = configSheet2.getRange(1, 1, 1, configSheet2.getLastColumn()).getValues()[0];
          const cd2 = configSheet2.getDataRange().getValues();
          const ci2 = ch2.indexOf('id');
          const sa2 = ch2.indexOf('sebAusnahmen');
          const fr2 = ch2.indexOf('freigeschaltet');
          if (sa2 >= 0 || fr2 >= 0) {
            for (var j = 1; j < cd2.length; j++) {
              if (cd2[j][ci2] === pruefungId) {
                if (sa2 >= 0) {
                  var ausn2 = safeJsonParse(cd2[j][sa2], []);
                  if (ausn2.indexOf(email) >= 0) sebAusnahme = true;
                }
                if (fr2 >= 0 && cd2[j][fr2] === 'true') {
                  pruefungFreigeschaltet = true;
                }
                break;
              }
            }
          }
        }
      }

      return jsonResponse({
        success: true,
        ...(beendetUm ? { beendetUm: beendetUm, restzeitMinuten: restzeitMinutenWert } : {}),
        ...(sebAusnahme ? { sebAusnahme: true } : {}),
        ...(kontrollStufeOverride ? { kontrollStufeOverride: kontrollStufeOverride } : {}),
        ...(entsperrt ? { entsperrt: true } : {}),
        ...(pruefungFreigeschaltet ? { phase: 'lobby' } : { phase: 'vorbereitung' })
      });
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === SEB-AUSNAHME ERLAUBEN (LP erteilt Ausnahme für einzelne SuS) ===

function sebAusnahmeErlauben(body) {
  try {
    const { pruefungId, email, susEmail } = body;

    // Auth: nur LP
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ success: false, error: 'nicht_autorisiert' });
    }
    if (!pruefungId || !susEmail) {
      return jsonResponse({ success: false, error: 'Fehlende Parameter' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];
    const data = configSheet.getDataRange().getValues();
    const idCol = headers.indexOf('id');

    // sebAusnahmen-Spalte finden oder erstellen
    var ausnahmenCol = headers.indexOf('sebAusnahmen');
    if (ausnahmenCol < 0) {
      ausnahmenCol = headers.length;
      configSheet.getRange(1, ausnahmenCol + 1).setValue('sebAusnahmen');
    }

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === pruefungId) {
        var bestehende = safeJsonParse(data[i][ausnahmenCol], []);
        if (bestehende.indexOf(susEmail) < 0) {
          bestehende.push(susEmail);
        }
        configSheet.getRange(i + 1, ausnahmenCol + 1).setValue(JSON.stringify(bestehende));
        return jsonResponse({ success: true });
      }
    }

    return jsonResponse({ success: false, error: 'Prüfung nicht gefunden' });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === PRÜFUNG BEENDEN (LP-kontrolliert) ===

function beendePruefungEndpoint(body) {
  try {
    const { pruefungId, email, modus, restzeitMinuten, einzelneSuS } = body;

    // Auth: nur LP
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ success: false, error: 'nicht_autorisiert' });
    }

    const beendetUm = modus === 'restzeit'
      ? new Date(Date.now() + (restzeitMinuten || 5) * 60000).toISOString()
      : new Date().toISOString();

    if (einzelneSuS && einzelneSuS.length > 0) {
      // Individuelles Beenden: in Antworten-Sheet pro SuS
      const sheet = getOrCreateAntwortenSheet(pruefungId);
      if (!sheet) return jsonResponse({ success: false, error: 'pruefung_nicht_gefunden' });

      // Spalten-Migration: beendetUm + restzeitMinuten hinzufügen falls fehlend
      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var beendetUmCol = headers.indexOf('beendetUm') + 1;
      var restzeitCol = headers.indexOf('restzeitMinuten') + 1;
      if (beendetUmCol === 0) {
        beendetUmCol = headers.length + 1;
        sheet.getRange(1, beendetUmCol).setValue('beendetUm');
      }
      if (restzeitCol === 0) {
        restzeitCol = (beendetUmCol === headers.length + 1 ? headers.length + 2 : headers.length + 1);
        sheet.getRange(1, restzeitCol).setValue('restzeitMinuten');
      }

      var emailCol = headers.indexOf('email') + 1;
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (einzelneSuS.includes(data[i][emailCol - 1])) {
          sheet.getRange(i + 1, beendetUmCol).setValue(beendetUm);
          if (modus === 'restzeit') {
            sheet.getRange(i + 1, restzeitCol).setValue(restzeitMinuten);
          }
        }
      }
    } else {
      // Globales Beenden: in Configs-Sheet
      var configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
      if (!configSheet) return jsonResponse({ success: false, error: 'configs_nicht_gefunden' });

      var headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];
      var idCol = headers.indexOf('id') + 1;

      // Spalten-Migration
      var beendetUmCol = headers.indexOf('beendetUm') + 1;
      var restzeitCol = headers.indexOf('restzeitMinuten') + 1;
      if (beendetUmCol === 0) {
        beendetUmCol = headers.length + 1;
        configSheet.getRange(1, beendetUmCol).setValue('beendetUm');
      }
      if (restzeitCol === 0) {
        restzeitCol = (beendetUmCol === headers.length + 1 ? headers.length + 2 : headers.length + 1);
        configSheet.getRange(1, restzeitCol).setValue('restzeitMinuten');
      }

      var data = configSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][idCol - 1] === pruefungId) {
          configSheet.getRange(i + 1, beendetUmCol).setValue(beendetUm);
          if (modus === 'restzeit') {
            configSheet.getRange(i + 1, restzeitCol).setValue(restzeitMinuten);
          }
          break;
        }
      }
    }

    // Server-seitiges Safety-Net: Bei Modus "sofort" alle aktiven SuS als abgegeben markieren
    if (modus === 'sofort') {
      try {
        var antSheet = getOrCreateAntwortenSheet(pruefungId);
        if (antSheet) {
          var antHeaders = antSheet.getRange(1, 1, 1, antSheet.getLastColumn()).getValues()[0];
          var istAbgabeCol = antHeaders.indexOf('istAbgabe');
          var abgabezeitCol = antHeaders.indexOf('abgabezeit');
          if (istAbgabeCol >= 0) {
            var antData = antSheet.getDataRange().getValues();
            for (var j = 1; j < antData.length; j++) {
              // Nur aktive SuS markieren (die noch nicht abgegeben haben)
              if (antData[j][istAbgabeCol] !== 'true') {
                sheet = antSheet; // Referenz für getRange
                antSheet.getRange(j + 1, istAbgabeCol + 1).setValue('true');
                if (abgabezeitCol >= 0) {
                  antSheet.getRange(j + 1, abgabezeitCol + 1).setValue(beendetUm);
                }
              }
            }
          }
        }
      } catch (e) {
        // Safety-Net Fehler nicht blockierend — Hauptoperation war erfolgreich
        console.log('Safety-Net Markierung fehlgeschlagen: ' + e.message);
      }
    }

    return jsonResponse({ success: true, beendetUm: beendetUm });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// === PRÜFUNG ZURÜCKSETZEN (für neue Durchführung) ===

function resetPruefungEndpoint(body) {
  try {
    var pruefungId = body.pruefungId;
    var email = body.email;

    // Auth: nur LP
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ success: false, error: 'nicht_autorisiert' });
    }
    if (!pruefungId) {
      return jsonResponse({ success: false, error: 'pruefungId erforderlich' });
    }

    // 1. Config zurücksetzen: beendetUm löschen, freigeschaltet=false, teilnehmer=[], sebAusnahmen=[]
    var configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    if (!configSheet) return jsonResponse({ success: false, error: 'configs_nicht_gefunden' });

    var headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];
    var idCol = headers.indexOf('id');
    var data = configSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][idCol] === pruefungId) {
        // freigeschaltet → false
        var freiCol = headers.indexOf('freigeschaltet');
        if (freiCol >= 0) configSheet.getRange(i + 1, freiCol + 1).setValue(false);

        // beendetUm → leer
        var beendetCol = headers.indexOf('beendetUm');
        if (beendetCol >= 0) configSheet.getRange(i + 1, beendetCol + 1).setValue('');

        // restzeitMinuten → leer
        var restzeitCol = headers.indexOf('restzeitMinuten');
        if (restzeitCol >= 0) configSheet.getRange(i + 1, restzeitCol + 1).setValue('');

        // teilnehmer → []
        var teilnehmerCol = headers.indexOf('teilnehmer');
        if (teilnehmerCol >= 0) configSheet.getRange(i + 1, teilnehmerCol + 1).setValue('[]');

        // sebAusnahmen → []
        var sebCol = headers.indexOf('sebAusnahmen');
        if (sebCol >= 0) configSheet.getRange(i + 1, sebCol + 1).setValue('[]');

        // durchfuehrungId → neue UUID (damit SuS stale State erkennen)
        var dfIdCol = headers.indexOf('durchfuehrungId');
        if (dfIdCol < 0) {
          // Spalte automatisch anlegen
          dfIdCol = headers.length;
          configSheet.getRange(1, dfIdCol + 1).setValue('durchfuehrungId').setFontWeight('bold');
        }
        configSheet.getRange(i + 1, dfIdCol + 1).setValue(Utilities.getUuid());

        break;
      }
    }

    // 2. Antworten-Sheet leeren (alle Zeilen ausser Header)
    if (ANTWORTEN_MASTER_ID) {
      var masterSS = SpreadsheetApp.openById(ANTWORTEN_MASTER_ID);
      var antwortenSheet = masterSS.getSheetByName('Antworten_' + pruefungId);
      if (antwortenSheet && antwortenSheet.getLastRow() > 1) {
        antwortenSheet.deleteRows(2, antwortenSheet.getLastRow() - 1);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// === FRAGE SPEICHERN (Fragenbank) ===

function speichereFrage(body) {
  try {
    const { email, frage } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!frage || !frage.id || !frage.typ || !frage.fachbereich) {
      return jsonResponse({ error: 'Ungültige Frage-Daten' });
    }

    const tabName = frage.fachbereich;
    const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    let sheet = fragenbank.getSheetByName(tabName);
    if (!sheet) {
      return jsonResponse({ error: 'Fachbereich-Tab "' + tabName + '" nicht gefunden' });
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = getSheetData(sheet);

    const rowData = {
      id: frage.id,
      typ: frage.typ,
      version: String(frage.version || 1),
      erstelltAm: frage.erstelltAm || new Date().toISOString(),
      geaendertAm: new Date().toISOString(),
      thema: frage.thema || '',
      unterthema: frage.unterthema || '',
      semester: (frage.semester || []).join(','),
      gefaesse: (frage.gefaesse || []).join(','),
      bloom: frage.bloom || 'K1',
      tags: (frage.tags || []).join(','),
      punkte: String(frage.punkte || 0),
      musterlosung: frage.musterlosung || '',
      bewertungsraster: JSON.stringify(frage.bewertungsraster || []),
      fragetext: frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || frage.kontext || '',
      quelle: frage.quelle || 'manuell',
      anhaenge: JSON.stringify(frage.anhaenge || []),
      typDaten: JSON.stringify(getTypDaten(frage)),
      autor: frage.autor || email,
      geteilt: frage.geteilt || 'privat',
      geteiltVon: frage.geteiltVon || '',
    };

    // Fehlende Spalten automatisch hinzufügen
    headers = ensureColumns(sheet, headers, rowData);

    const existingRow = data.findIndex(row => row.id === frage.id);
    if (existingRow >= 0) {
      const rowIndex = existingRow + 2;
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      const newRow = headers.map(h => rowData[h] || '');
      sheet.appendRow(newRow);
    }

    return jsonResponse({ success: true, id: frage.id });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === Frage aus Fragenbank löschen ===

function loescheFrage(body) {
  try {
    var email = body.email;
    var frageId = body.frageId;
    var fachbereich = body.fachbereich;

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!frageId || !fachbereich) {
      return jsonResponse({ error: 'frageId und fachbereich erforderlich' });
    }

    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var sheet = fragenbank.getSheetByName(fachbereich);
    if (!sheet) {
      return jsonResponse({ error: 'Fachbereich-Tab "' + fachbereich + '" nicht gefunden' });
    }

    var data = getSheetData(sheet);
    var rowIndex = data.findIndex(function(row) { return row.id === frageId; });
    if (rowIndex < 0) {
      return jsonResponse({ error: 'Frage nicht gefunden: ' + frageId });
    }

    // Zeile löschen (rowIndex + 2 wegen Header-Zeile und 0-basiertem Index)
    sheet.deleteRow(rowIndex + 2);

    return jsonResponse({ success: true, id: frageId });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function getTypDaten(frage) {
  switch (frage.typ) {
    case 'mc':
      return { optionen: frage.optionen, mehrfachauswahl: frage.mehrfachauswahl, zufallsreihenfolge: frage.zufallsreihenfolge };
    case 'freitext':
      return { laenge: frage.laenge, hilfstextPlaceholder: frage.hilfstextPlaceholder };
    case 'lueckentext':
      return { textMitLuecken: frage.textMitLuecken, luecken: frage.luecken };
    case 'zuordnung':
      return { paare: frage.paare, zufallsreihenfolge: frage.zufallsreihenfolge };
    case 'richtigfalsch':
      return { aussagen: frage.aussagen };
    case 'berechnung':
      return { ergebnisse: frage.ergebnisse, rechenwegErforderlich: frage.rechenwegErforderlich, hilfsmittel: frage.hilfsmittel };
    case 'buchungssatz':
      return { buchungen: frage.buchungen, kontenauswahl: frage.kontenauswahl };
    case 'tkonto':
      return {
        geschaeftsfaelle: frage.geschaeftsfaelle,
        konten: frage.konten,
        kontenauswahl: frage.kontenauswahl,
        bewertungsoptionen: frage.bewertungsoptionen,
      };
    case 'kontenbestimmung':
      return { modus: frage.modus, aufgaben: frage.aufgaben, kontenauswahl: frage.kontenauswahl };
    case 'bilanzstruktur':
      return {
        modus: frage.modus,
        kontenMitSaldi: frage.kontenMitSaldi,
        loesung: frage.loesung,
        bewertungsoptionen: frage.bewertungsoptionen,
      };
    case 'aufgabengruppe':
      return { teilaufgabenIds: frage.teilaufgabenIds, kontextAnhaenge: frage.kontextAnhaenge };
    case 'pdf':
      return {
        pdfDriveFileId: frage.pdfDriveFileId,
        pdfUrl: frage.pdfUrl,
        pdfDateiname: frage.pdfDateiname,
        seitenAnzahl: frage.seitenAnzahl,
        kategorien: frage.kategorien,
        erlaubteWerkzeuge: frage.erlaubteWerkzeuge,
      };
    case 'visualisierung':
      return {
        untertyp: frage.untertyp,
        breite: frage.breite || (frage.canvasConfig && frage.canvasConfig.breite),
        hoehe: frage.hoehe || (frage.canvasConfig && frage.canvasConfig.hoehe),
        hintergrundBild: frage.hintergrundBild || (frage.canvasConfig && frage.canvasConfig.hintergrundbild),
        werkzeuge: frage.werkzeuge || (frage.canvasConfig && frage.canvasConfig.werkzeuge),
        radierer: frage.radierer !== undefined ? frage.radierer : (frage.canvasConfig && frage.canvasConfig.radierer),
      };
    default:
      return {};
  }
}

// === ALLE CONFIGS LADEN (LP-Dashboard) ===

function ladeAlleConfigs(email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);

    const configs = data.map(row => ({
      id: row.id,
      titel: row.titel,
      klasse: row.klasse,
      gefaess: row.gefaess,
      semester: row.semester,
      fachbereiche: (row.fachbereiche || '').split(',').map(s => s.trim()).filter(Boolean),
      datum: row.datum,
      typ: row.typ,
      modus: row.modus || 'pruefung',
      dauerMinuten: Number(row.dauerMinuten),
      zeitModus: row.zeitModus || 'countdown',
      gesamtpunkte: Number(row.gesamtpunkte),
      erlaubteKlasse: row.erlaubteKlasse,
      sebErforderlich: row.sebErforderlich === 'true',
      abschnitte: safeJsonParse(row.abschnitte, []),
      zeitanzeigeTyp: row.zeitanzeigeTyp || 'countdown',
      ruecknavigation: row.ruecknavigation !== 'false',
      zufallsreihenfolgeFragen: row.zufallsreihenfolgeFragen === 'true',
      autoSaveIntervallSekunden: Number(row.autoSaveIntervallSekunden) || 30,
      heartbeatIntervallSekunden: Number(row.heartbeatIntervallSekunden) || 10,
      freigeschaltet: row.freigeschaltet === 'true',
      zeitverlaengerungen: safeJsonParse(row.zeitverlaengerungen, {}),
      teilnehmer: safeJsonParse(row.teilnehmer, []),
      materialien: safeJsonParse(row.materialien, []),
      beendetUm: row.beendetUm || undefined,
      korrektur: { aktiviert: false, modus: 'batch' },
      feedback: { zeitpunkt: 'nach-review', format: 'pdf', detailgrad: 'vollstaendig' },
    }));

    return jsonResponse({ configs });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === FRAGENBANK LADEN (Composer) ===

function ladeFragenbank(email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    const tabs = ['VWL', 'BWL', 'Recht', 'Informatik'];
    const alleFragen = [];

    for (const tab of tabs) {
      const sheet = fragenbank.getSheetByName(tab);
      if (!sheet) continue;
      const data = getSheetData(sheet);
      for (const row of data) {
        if (row.id) {
          const frage = parseFrage(row, tab);
          // Sichtbarkeitsfilter: eigene Fragen immer, geteilte wenn 'schule', Pool-Fragen immer
          const istEigene = !frage.autor || frage.autor === email;
          const istGeteilt = frage.geteilt === 'schule';
          const istPool = frage.quelle === 'pool';
          if (istEigene || istGeteilt || istPool) {
            // Bei geteilten Fragen den Autor-Namen als geteiltVon setzen
            if (!istEigene && istGeteilt && frage.autor) {
              frage.geteiltVon = frage.autor.split('@')[0];
            }
            alleFragen.push(frage);
          }
        }
      }
    }

    return jsonResponse({ fragen: alleFragen });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === CONFIG SPEICHERN (Composer) ===

function speichereConfig(body) {
  try {
    const { email, config } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!config || !config.id || !config.titel) {
      return jsonResponse({ error: 'Ungültige Config-Daten' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);
    var headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];

    // rowData nur mit Feldern befüllen, die in config vorhanden sind.
    // Verhindert, dass ein partielles Update bestehende Daten überschreibt.
    var rowData = { id: config.id, titel: config.titel };

    // Feld-Mapping: config-Key → Serialisierung
    var feldMapping = {
      klasse:                     function(v) { return v || ''; },
      gefaess:                    function(v) { return v || 'SF'; },
      semester:                   function(v) { return v || ''; },
      fachbereiche:               function(v) { return (v || []).join(','); },
      datum:                      function(v) { return v || ''; },
      typ:                        function(v) { return v || 'summativ'; },
      modus:                      function(v) { return v || 'pruefung'; },
      dauerMinuten:               function(v) { return String(v || 45); },
      gesamtpunkte:               function(v) { return String(v || 0); },
      erlaubteKlasse:             function(v) { return v || config.klasse || ''; },
      sebErforderlich:            function(v) { return v ? 'true' : 'false'; },
      abschnitte:                 function(v) { return JSON.stringify(v || []); },
      zeitanzeigeTyp:             function(v) { return v || 'countdown'; },
      ruecknavigation:            function(v) { return v !== false ? 'true' : 'false'; },
      zufallsreihenfolgeFragen:   function(v) { return v ? 'true' : 'false'; },
      autoSaveIntervallSekunden:  function(v) { return String(v || 30); },
      heartbeatIntervallSekunden: function(v) { return String(v || 10); },
      freigeschaltet:             function(v) { return v ? 'true' : 'false'; },
      zeitverlaengerungen:        function(v) { return JSON.stringify(v || {}); },
      sebAusnahmen:               function(v) { return JSON.stringify(v || []); },
      materialien:                function(v) { return JSON.stringify(v); },
      zeitModus:                  function(v) { return v || 'countdown'; },
      kontrollStufe:              function(v) { return v || 'standard'; },
      teilnehmer:                 function(v) { return JSON.stringify(v || []); },
      beendetUm:                  function(v) { return v || ''; },
      durchfuehrungId:            function(v) { return v || ''; },
      zufallsreihenfolgeOptionen: function(v) { return v ? 'true' : 'false'; },
    };

    for (var key in feldMapping) {
      if (config[key] !== undefined) {
        rowData[key] = feldMapping[key](config[key]);
      }
    }

    // Fehlende Spalten automatisch hinzufügen
    headers = ensureColumns(configSheet, headers, rowData);

    const existingRow = data.findIndex(row => row.id === config.id);
    if (existingRow >= 0) {
      const rowIndex = existingRow + 2;
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          configSheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      const newRow = headers.map(h => rowData[h] || '');
      configSheet.appendRow(newRow);
    }

    return jsonResponse({ success: true, id: config.id });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === PRÜFUNG LÖSCHEN ===

function loeschePruefung(body) {
  try {
    const { email, pruefungId } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!pruefungId) {
      return jsonResponse({ error: 'Keine Prüfungs-ID angegeben' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);

    const rowIndex = data.findIndex(row => row.id === pruefungId);
    if (rowIndex < 0) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    // Zeile löschen (rowIndex + 2 wegen Header-Zeile und 1-basiertem Index)
    configSheet.deleteRow(rowIndex + 2);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === ENTSPERRE SUS (LP-Aktion) ===

function entsperreSuSEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var pruefungId = body.pruefungId;
    var schuelerEmail = body.schuelerEmail;
    if (!pruefungId || !schuelerEmail) {
      return jsonResponse({ error: 'pruefungId und schuelerEmail erforderlich' });
    }

    var sheet = findeAntwortenSheet(pruefungId);
    if (!sheet) return jsonResponse({ error: 'Antworten-Sheet nicht gefunden' });

    var data = getSheetData(sheet);
    var rowIdx = data.findIndex(function(r) { return r.email === schuelerEmail; });
    if (rowIdx < 0) return jsonResponse({ error: 'SuS nicht gefunden' });

    var rowIndex = rowIdx + 2;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // entsperrt-Flag setzen (wird im nächsten Heartbeat gelesen und zurückgesetzt)
    headers = ensureColumns(sheet, headers, { entsperrt: 'true', gesperrt: 'false', verstossZaehler: '0' });
    var entsperrtCol = headers.indexOf('entsperrt');
    if (entsperrtCol >= 0) sheet.getRange(rowIndex, entsperrtCol + 1).setValue('true');
    var gesperrtCol = headers.indexOf('gesperrt');
    if (gesperrtCol >= 0) sheet.getRange(rowIndex, gesperrtCol + 1).setValue('false');
    var vzCol = headers.indexOf('verstossZaehler');
    if (vzCol >= 0) sheet.getRange(rowIndex, vzCol + 1).setValue(0);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === SETZE KONTROLLSTUFE (LP-Aktion) ===

function setzeKontrollStufeEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var pruefungId = body.pruefungId;
    var schuelerEmail = body.schuelerEmail;
    var stufe = body.stufe;
    if (!pruefungId || !schuelerEmail || !stufe) {
      return jsonResponse({ error: 'pruefungId, schuelerEmail und stufe erforderlich' });
    }
    if (['locker', 'standard', 'streng'].indexOf(stufe) < 0) {
      return jsonResponse({ error: 'Ungültige Kontrollstufe: ' + stufe });
    }

    var sheet = findeAntwortenSheet(pruefungId);
    if (!sheet) return jsonResponse({ error: 'Antworten-Sheet nicht gefunden' });

    var data = getSheetData(sheet);
    var rowIdx = data.findIndex(function(r) { return r.email === schuelerEmail; });
    if (rowIdx < 0) return jsonResponse({ error: 'SuS nicht gefunden' });

    var rowIndex = rowIdx + 2;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    headers = ensureColumns(sheet, headers, { kontrollStufeOverride: stufe });
    var ksoCol = headers.indexOf('kontrollStufeOverride');
    if (ksoCol >= 0) sheet.getRange(rowIndex, ksoCol + 1).setValue(stufe);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === MONITORING LADEN (LP Live-Übersicht) ===

function ladeMonitoring(pruefungId, email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!pruefungId) {
      return jsonResponse({ error: 'Keine Prüfungs-ID angegeben' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configData = getSheetData(configSheet);
    const configRow = configData.find(row => row.id === pruefungId);
    if (!configRow) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    // Globales beendetUm aus Configs-Sheet prüfen
    const globalBeendetUm = configRow.beendetUm || null;

    const schueler = [];
    const sheet = findeAntwortenSheet(pruefungId);

    if (sheet) {
      const data = getSheetData(sheet);
      for (const row of data) {
        // Status: abgegeben > beendet-lp (individuell oder global) > aktiv > nicht-gestartet
        var susBeendetUm = row.beendetUm || globalBeendetUm;
        schueler.push({
          email: row.email || '',
          name: row.name || row.email || '',
          klasse: row.klasse || '',
          status: row.istAbgabe === 'true' ? 'abgegeben' : (susBeendetUm ? 'beendet-lp' : (row.letzterHeartbeat ? 'aktiv' : 'nicht-gestartet')),
          letzterSave: row.letzterSave || '',
          letzterHeartbeat: row.letzterHeartbeat || '',
          heartbeats: Number(row.heartbeats) || 0,
          version: Number(row.version) || 0,
          istAbgegeben: row.istAbgabe === 'true',
          aktuelleFrage: row.aktuelleFrage !== undefined && row.aktuelleFrage !== ''
            ? Number(row.aktuelleFrage)
            : null,
          beantworteteFragen: Number(row.beantworteteFragen) || 0,
          gesamtFragen: Number(row.gesamtFragen) || 0,
          abgabezeit: row.abgabezeit || null,
          startzeit: row.startzeit || null,
          netzwerkFehler: Number(row.netzwerkFehler) || 0,
          autoSaveCount: Number(row.autoSaveCount) || 0,
          unterbrechungen: safeJsonParse(row.unterbrechungen, []),
          // Lockdown-Felder
          geraet: row.geraet || 'unbekannt',
          vollbild: row.vollbild === 'true',
          kontrollStufe: row.kontrollStufe || '',
          verstossZaehler: Number(row.verstossZaehler) || 0,
          gesperrt: row.gesperrt === 'true',
          verstoesse: safeJsonParse(row.verstoesse, []),
        });
      }
    }

    return jsonResponse({
      pruefungId: pruefungId,
      titel: configRow.titel,
      schueler: schueler,
      aktualisiert: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// ============================================================
// KI-KORREKTUR + SCHÜLERCODE-VALIDIERUNG (Teil 6)
// ============================================================

// === CLAUDE API ===

// === POOL-IMPORT (Fragen aus Übungspools) ===

function importierePoolFragen(body) {
  try {
    var email = body.email;
    var fragen = body.fragen || [];

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!fragen.length) {
      return jsonResponse({ error: 'Keine Fragen zum Importieren' });
    }

    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var importiert = 0;
    var aktualisiert = 0;
    var fehler = [];

    // Standard-Headers für neue Tabs (gleiche Reihenfolge wie bestehende Tabs)
    var standardHeaders = [
      'id', 'typ', 'version', 'erstelltAm', 'geaendertAm',
      'thema', 'unterthema', 'semester', 'gefaesse', 'bloom', 'tags',
      'punkte', 'musterlosung', 'bewertungsraster', 'fragetext', 'quelle',
      'anhaenge', 'typDaten', 'autor', 'geteilt', 'geteiltVon',
      'poolId', 'poolGeprueft', 'pruefungstauglich', 'poolContentHash',
      'poolUpdateVerfuegbar', 'poolVersion', 'lernzielIds'
    ];

    for (var i = 0; i < fragen.length; i++) {
      var frage = fragen[i];
      try {
        var tabName = frage.fachbereich;
        if (!tabName) {
          fehler.push('Frage ' + (frage.id || i) + ': Kein Fachbereich');
          continue;
        }

        var sheet = fragenbank.getSheetByName(tabName);
        if (!sheet) {
          // Neuen Tab erstellen mit Standard-Headers
          sheet = fragenbank.insertSheet(tabName);
          sheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
          sheet.getRange(1, 1, 1, standardHeaders.length).setFontWeight('bold');
        }

        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });

        // Fehlende Pool-Spalten zu bestehendem Tab hinzufügen
        var poolSpalten = ['poolId', 'poolGeprueft', 'pruefungstauglich', 'poolContentHash', 'poolUpdateVerfuegbar', 'poolVersion', 'lernzielIds'];
        var spaltenHinzugefuegt = false;
        for (var ps = 0; ps < poolSpalten.length; ps++) {
          if (headers.indexOf(poolSpalten[ps]) === -1) {
            var neueSpalte = headers.length + 1;
            sheet.getRange(1, neueSpalte).setValue(poolSpalten[ps]).setFontWeight('bold');
            headers.push(poolSpalten[ps]);
            spaltenHinzugefuegt = true;
          }
        }

        var data = getSheetData(sheet);

        // Prüfe ob poolId bereits existiert
        var existingIdx = -1;
        for (var j = 0; j < data.length; j++) {
          if (data[j].poolId === frage.poolId) {
            existingIdx = j;
            break;
          }
        }

        if (existingIdx >= 0) {
          // Nur Pool-Sync-Felder aktualisieren (Inhalt bleibt unverändert)
          var rowIndex = existingIdx + 2;
          var syncFelder = {
            poolUpdateVerfuegbar: frage.poolUpdateVerfuegbar ? 'true' : 'false',
            poolVersion: JSON.stringify(frage.poolVersion || {}),
            poolGeprueft: frage.poolGeprueft ? 'true' : 'false',
            poolContentHash: frage.poolContentHash || '',
            anhaenge: JSON.stringify(frage.anhaenge || [])
          };
          for (var feld in syncFelder) {
            var colIdx = headers.indexOf(feld);
            if (colIdx >= 0) {
              sheet.getRange(rowIndex, colIdx + 1).setValue(syncFelder[feld]);
            }
          }
          aktualisiert++;
        } else {
          // Neue Frage: vollständige Zeile einfügen
          var rowData = {
            id: frage.id || Utilities.getUuid(),
            typ: frage.typ || 'freitext',
            version: String(frage.version || 1),
            erstelltAm: frage.erstelltAm || new Date().toISOString(),
            geaendertAm: new Date().toISOString(),
            thema: frage.thema || '',
            unterthema: frage.unterthema || '',
            semester: (frage.semester || []).join(','),
            gefaesse: (frage.gefaesse || []).join(','),
            bloom: frage.bloom || 'K1',
            tags: (frage.tags || []).join(','),
            punkte: String(frage.punkte || 0),
            musterlosung: frage.musterlosung || '',
            bewertungsraster: JSON.stringify(frage.bewertungsraster || []),
            fragetext: frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || frage.kontext || '',
            quelle: frage.quelle || 'pool',
            anhaenge: JSON.stringify(frage.anhaenge || []),
            typDaten: JSON.stringify(getTypDaten(frage)),
            autor: frage.autor || email,
            geteilt: frage.geteilt || 'privat',
            geteiltVon: frage.geteiltVon || '',
            poolId: frage.poolId || '',
            poolGeprueft: frage.poolGeprueft ? 'true' : 'false',
            pruefungstauglich: frage.pruefungstauglich ? 'true' : 'false',
            poolContentHash: frage.poolContentHash || '',
            poolUpdateVerfuegbar: frage.poolUpdateVerfuegbar ? 'true' : 'false',
            poolVersion: JSON.stringify(frage.poolVersion || {}),
            lernzielIds: (frage.lernzielIds || []).join(',')
          };

          var newRow = headers.map(function(h) { return rowData[h] || ''; });
          sheet.appendRow(newRow);
          importiert++;
        }
      } catch (err) {
        fehler.push('Frage ' + (frage.id || i) + ': ' + err.message);
      }
    }

    return jsonResponse({ erfolg: true, importiert: importiert, aktualisiert: aktualisiert, fehler: fehler });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === LERNZIELE (Pool-Brücke) ===

function importiereLernziele(body) {
  try {
    var email = body.email;
    var lernziele = body.lernziele || [];

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!lernziele.length) {
      return jsonResponse({ error: 'Keine Lernziele zum Importieren' });
    }

    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var sheet = fragenbank.getSheetByName(LERNZIELE_TAB);

    // Tab erstellen falls nicht vorhanden
    var lernzielHeaders = ['id', 'fach', 'poolId', 'thema', 'text', 'bloom', 'aktiv'];
    if (!sheet) {
      sheet = fragenbank.insertSheet(LERNZIELE_TAB);
      sheet.getRange(1, 1, 1, lernzielHeaders.length).setValues([lernzielHeaders]);
      sheet.getRange(1, 1, 1, lernzielHeaders.length).setFontWeight('bold');
    }

    var data = getSheetData(sheet);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
    var neu = 0;
    var aktualisiert = 0;

    for (var i = 0; i < lernziele.length; i++) {
      var lz = lernziele[i];
      if (!lz.id) continue;

      var rowData = {
        id: lz.id,
        fach: lz.fach || '',
        poolId: lz.poolId || '',
        thema: lz.thema || '',
        text: lz.text || '',
        bloom: lz.bloom || '',
        aktiv: lz.aktiv !== false ? 'true' : 'false'
      };

      // Suche nach bestehender Zeile
      var existingIdx = -1;
      for (var j = 0; j < data.length; j++) {
        if (data[j].id === lz.id) {
          existingIdx = j;
          break;
        }
      }

      if (existingIdx >= 0) {
        // Update bestehende Zeile
        var rowIndex = existingIdx + 2;
        headers.forEach(function(header, colIndex) {
          if (rowData[header] !== undefined) {
            sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
          }
        });
        aktualisiert++;
      } else {
        // Neue Zeile anhängen
        var newRow = headers.map(function(h) { return rowData[h] || ''; });
        sheet.appendRow(newRow);
        // data-Array aktualisieren für spätere Duplikat-Erkennung im selben Batch
        data.push(rowData);
        neu++;
      }
    }

    return jsonResponse({ erfolg: true, neu: neu, aktualisiert: aktualisiert });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function importiereLehrplanzieleEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    var ziele = body.lehrplanziele || [];
    if (ziele.length === 0) return jsonResponse({ error: 'Keine Lernziele übergeben' });

    var ss = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID);
    var sheet = ss.getSheetByName('Lehrplanziele');
    if (!sheet) {
      sheet = ss.insertSheet('Lehrplanziele');
      sheet.getRange(1, 1, 1, 9).setValues([['id', 'ebene', 'parentId', 'fach', 'gefaess', 'semester', 'thema', 'text', 'bloom']]);
    }

    var existing = getSheetData(sheet);
    var existingIds = {};
    for (var ei = 0; ei < existing.length; ei++) {
      existingIds[existing[ei].id] = ei;
    }
    var neu = 0, aktualisiert = 0;

    for (var i = 0; i < ziele.length; i++) {
      var z = ziele[i];
      if (!z.id) continue;
      var rowValues = [[z.id, z.ebene || 'fein', z.parentId || '', z.fach || '', z.gefaess || '', z.semester || '', z.thema || '', z.text || '', z.bloom || '']];

      if (existingIds[z.id] !== undefined) {
        // Update: Zeile finden und überschreiben
        var rowIdx = existingIds[z.id];
        sheet.getRange(rowIdx + 2, 1, 1, 9).setValues(rowValues);
        aktualisiert++;
      } else {
        sheet.appendRow(rowValues[0]);
        existingIds[z.id] = existing.length + neu;
        neu++;
      }
    }

    return jsonResponse({ erfolg: true, neu: neu, aktualisiert: aktualisiert });
  } catch (e) {
    return jsonResponse({ error: e.message });
  }
}

function ladeLernziele(body) {
  try {
    var email = body.email;
    var fachFilter = body.fach || '';

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    // Zuerst: Zentrale Lehrplan-DB versuchen (bevorzugt)
    try {
      var lehrplanSheet = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID).getSheetByName('Lehrplanziele');
      if (lehrplanSheet) {
        var lpData = getSheetData(lehrplanSheet);
        if (lpData.length > 0) {
          var lernziele = [];
          for (var li = 0; li < lpData.length; li++) {
            var lpRow = lpData[li];
            if (fachFilter && lpRow.fach !== fachFilter) continue;
            lernziele.push({
              id: lpRow.id,
              fach: lpRow.fach || '',
              poolId: '',
              thema: lpRow.thema || '',
              text: lpRow.text || '',
              bloom: lpRow.bloom || '',
              ebene: lpRow.ebene || '',
              aktiv: true
            });
          }
          return jsonResponse({ lernziele: lernziele });
        }
      }
    } catch (e) { /* Lehrplan-Sheet nicht konfiguriert — Fallback auf Pool-Lernziele */ }

    // Fallback: Pool-Lernziele aus Fragenbank (bisherige Logik)
    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var sheet = fragenbank.getSheetByName(LERNZIELE_TAB);

    if (!sheet) {
      return jsonResponse({ lernziele: [] });
    }

    var data = getSheetData(sheet);
    var lernziele = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      if (fachFilter && row.fach !== fachFilter) continue;
      lernziele.push({
        id: row.id,
        fach: row.fach || '',
        poolId: row.poolId || '',
        thema: row.thema || '',
        text: row.text || '',
        bloom: row.bloom || '',
        aktiv: row.aktiv !== 'false'
      });
    }

    return jsonResponse({ lernziele: lernziele });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === KI-ASSISTENT (Frageneditor) ===

function kiAssistentEndpoint(body) {
  try {
    var email = body.email;
    var aktion = body.aktion;
    var daten = body.daten || {};

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!aktion) {
      return jsonResponse({ error: 'Keine Aktion angegeben' });
    }

    var systemPrompt = 'Du bist Assistent für einen Gymnasiallehrer (Wirtschaft & Recht, Kanton Bern, Lehrplan 17). ' +
      'Verwende Schweizer Hochdeutsch. ' +
      'Antworte IMMER als valides JSON-Objekt (kein Markdown, kein erklärender Text davor oder danach).';

    var userPrompt = '';
    var result;

    switch (aktion) {

      case 'generiereFragetext':
        userPrompt = 'Generiere eine Prüfungsfrage für das Gymnasium.\n' +
          'Fachbereich: ' + (daten.fachbereich || 'Wirtschaft & Recht') + '\n' +
          'Thema: ' + (daten.thema || '') + '\n' +
          (daten.unterthema ? 'Unterthema: ' + daten.unterthema + '\n' : '') +
          'Fragetyp: ' + (daten.typ || 'freitext') + '\n' +
          'Bloom-Stufe: ' + (daten.bloom || 'K2') + '\n\n' +
          'Antworte als JSON: { "fragetext": "...", "musterlosung": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'verbessereFragetext':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Verbessere den folgenden Prüfungsfrage-Text bezüglich Klarheit, Präzision und Grammatik. ' +
          'Korrigiere allfällige Fehler und mache die Frage unmissverständlich.\n\n' +
          'Originaler Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "fragetext": "..." , "aenderungen": "kurze Zusammenfassung der Änderungen" }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefeMusterloesung':
        if (!daten.fragetext || !daten.musterlosung) return jsonResponse({ error: 'Fragetext und Musterlösung nötig' });
        userPrompt = 'Prüfe ob die Musterlösung zur Frage korrekt und vollständig ist.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Musterlösung:\n' + daten.musterlosung + '\n\n' +
          'Antworte als JSON: { "korrekt": true/false, "bewertung": "...", "verbesserteLosung": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereOptionen':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Generiere 4 Multiple-Choice-Optionen für die folgende Frage. ' +
          'Genau eine Option soll korrekt sein, die anderen 3 sollen plausible Distraktoren sein.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "optionen": [{ "text": "...", "korrekt": true/false }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereDistraktoren':
        if (!daten.fragetext || !daten.korrekteAntwort) return jsonResponse({ error: 'Fragetext und korrekte Antwort nötig' });
        userPrompt = 'Generiere 3 plausible, aber falsche Antwortmöglichkeiten (Distraktoren) für diese MC-Frage.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Korrekte Antwort: ' + daten.korrekteAntwort + '\n\n' +
          'Antworte als JSON: { "distraktoren": ["...", "...", "..."] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereMusterloesung':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Erstelle eine vollständige Musterlösung für die folgende Prüfungsfrage. ' +
          'Berücksichtige die Bloom-Stufe ' + (daten.bloom || 'K2') + ' und den Fachbereich ' + (daten.fachbereich || 'Wirtschaft & Recht') + '. ' +
          'Bei Freitext-Fragen: formuliere eine Antwort die der erwarteten Länge und Tiefe entspricht. ' +
          'Bei MC/R-F/Zuordnung/Lückentext: beschreibe die korrekten Antworten und erkläre kurz warum.\n\n' +
          'Fragetyp: ' + (daten.typ || 'freitext') + '\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "musterlosung": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generierePaare':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Generiere 4–6 Zuordnungspaare für die folgende Prüfungsfrage. ' +
          'Jedes Paar besteht aus einem linken und einem rechten Element, die inhaltlich zusammengehören.\n\n' +
          'Fachbereich: ' + (daten.fachbereich || 'Wirtschaft & Recht') + '\n' +
          'Thema: ' + (daten.thema || '') + '\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "paare": [{ "links": "...", "rechts": "..." }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefePaare':
        if (!daten.fragetext || !daten.paare) return jsonResponse({ error: 'Fragetext und Paare nötig' });
        userPrompt = 'Prüfe die folgenden Zuordnungspaare auf Konsistenz, Eindeutigkeit und fachliche Korrektheit. ' +
          'Stelle sicher, dass jedes linke Element genau einem rechten Element zugeordnet werden kann und keine Mehrdeutigkeiten bestehen.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Paare:\n' + JSON.stringify(daten.paare) + '\n\n' +
          'Antworte als JSON: { "bewertung": "...", "verbesserungen": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereAussagen':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Generiere 4–6 Richtig-/Falsch-Aussagen zur folgenden Prüfungsfrage. ' +
          'Mische richtige und falsche Aussagen (nicht alle gleich). ' +
          'Begründe jeweils kurz, warum die Aussage richtig oder falsch ist.\n\n' +
          'Fachbereich: ' + (daten.fachbereich || 'Wirtschaft & Recht') + '\n' +
          'Thema: ' + (daten.thema || '') + '\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "aussagen": [{ "text": "...", "korrekt": true/false, "erklaerung": "..." }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefeAussagen':
        if (!daten.fragetext || !daten.aussagen) return jsonResponse({ error: 'Fragetext und Aussagen nötig' });
        userPrompt = 'Prüfe die folgenden Richtig-/Falsch-Aussagen auf Ausgewogenheit, Eindeutigkeit und fachliche Korrektheit. ' +
          'Achte darauf, dass die Aussagen nicht mehrdeutig formuliert sind und die Balance zwischen richtig und falsch stimmt.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Aussagen:\n' + JSON.stringify(daten.aussagen) + '\n\n' +
          'Antworte als JSON: { "bewertung": "...", "verbesserungen": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereLuecken':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Erstelle einen Lückentext für die folgende Prüfungsfrage. ' +
          'Setze Lücken an sinnvollen Stellen (Schlüsselbegriffe, wichtige Fachbegriffe). ' +
          'Verwende {{1}}, {{2}}, {{3}} usw. als Platzhalter. ' +
          'Gib für jede Lücke die korrekten Antworten an (inkl. Synonyme und alternative Schreibweisen).\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n' +
          (daten.textMitLuecken ? 'Basistext:\n' + daten.textMitLuecken + '\n' : '') + '\n' +
          'Antworte als JSON: { "textMitLuecken": "...", "luecken": [{ "id": "1", "korrekteAntworten": ["antwort1", "synonym"] }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefeLueckenAntworten':
        if (!daten.textMitLuecken || !daten.luecken) return jsonResponse({ error: 'Text mit Lücken und Lücken-Array nötig' });
        userPrompt = 'Prüfe ob für die folgenden Lücken alle gültigen Antwortvarianten erfasst sind. ' +
          'Ergänze fehlende Synonyme, alternative Schreibweisen und gleichwertige Formulierungen.\n\n' +
          'Text mit Lücken:\n' + daten.textMitLuecken + '\n\n' +
          'Aktuelle Lücken-Antworten:\n' + JSON.stringify(daten.luecken) + '\n\n' +
          'Antworte als JSON: { "bewertung": "...", "ergaenzteAntworten": [{ "id": "1", "korrekteAntworten": ["erweiterte", "liste"] }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'berechneErgebnis':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Löse die folgende Rechenaufgabe Schritt für Schritt. ' +
          'Gib das numerische Ergebnis (oder mehrere Teilergebnisse) mit passenden Einheiten und einer sinnvollen Toleranz an.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Antworte als JSON: { "ergebnisse": [{ "label": "...", "korrekt": 42.5, "toleranz": 0.5, "einheit": "CHF" }, ...], "rechenweg": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefeToleranz':
        if (!daten.fragetext || !daten.ergebnisse) return jsonResponse({ error: 'Fragetext und Ergebnisse nötig' });
        userPrompt = 'Prüfe ob die angegebenen Toleranzbereiche für die folgende Rechenaufgabe sinnvoll sind. ' +
          'Berücksichtige den Aufgabentyp, die Grössenordnung der Ergebnisse und übliche Rundungsregeln.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Ergebnisse mit Toleranzen:\n' + JSON.stringify(daten.ergebnisse) + '\n\n' +
          'Antworte als JSON: { "bewertung": "...", "empfohleneToleranz": "..." }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'bewertungsrasterGenerieren':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Erstelle ein Bewertungsraster für die folgende Prüfungsfrage.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n' +
          'Fragetyp: ' + (daten.typ || 'freitext') + '\n' +
          'Fachbereich: ' + (daten.fachbereich || '?') + '\n' +
          'Bloom-Stufe: ' + (daten.bloom || '?') + '\n' +
          'Punkte: ' + (daten.punkte || '?') + '\n' +
          (daten.musterlosung ? 'Musterlösung:\n' + daten.musterlosung + '\n' : '') + '\n' +
          'Erstelle ein Bewertungsraster mit konkreten, messbaren Kriterien. ' +
          'Die Summe der Kriterien-Punkte muss exakt ' + (daten.punkte || '?') + ' ergeben.\n\n' +
          'Antworte als JSON: { "kriterien": [{ "beschreibung": "...", "punkte": 1 }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'bewertungsrasterVerbessern':
        if (!daten.fragetext || !daten.bewertungsraster) return jsonResponse({ error: 'Fragetext und Bewertungsraster fehlen' });
        userPrompt = 'Prüfe und verbessere das folgende Bewertungsraster.\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n' +
          'Fragetyp: ' + (daten.typ || 'freitext') + '\n' +
          'Fachbereich: ' + (daten.fachbereich || '?') + '\n' +
          'Bloom-Stufe: ' + (daten.bloom || '?') + '\n' +
          'Punkte: ' + (daten.punkte || '?') + '\n' +
          (daten.musterlosung ? 'Musterlösung:\n' + daten.musterlosung + '\n' : '') + '\n' +
          'Aktuelles Bewertungsraster:\n' + JSON.stringify(daten.bewertungsraster) + '\n\n' +
          'Prüfe: Sind die Kriterien messbar und eindeutig? Stimmt die Punkteverteilung? Fehlen wichtige Aspekte? ' +
          'Vorschläge für Verbesserungen machen.\n\n' +
          'Antworte als JSON: { "bewertung": "Freitext-Analyse des Rasters", "verbesserteKriterien": [{ "beschreibung": "...", "punkte": 1 }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'klassifiziereFrage':
        if (!daten.fragetext) return jsonResponse({ error: 'Fragetext fehlt' });
        userPrompt = 'Klassifiziere die folgende Prüfungsfrage für den W&R-Unterricht am Schweizer Gymnasium (Lehrplan 17, Kanton Bern).\n\n' +
          'Fragetext:\n' + daten.fragetext + '\n\n' +
          'Bestimme:\n' +
          '1. Fachbereich: "VWL", "BWL" oder "Recht"\n' +
          '2. Thema: Das übergeordnete Thema (z.B. "Marktgleichgewicht", "Vertragsrecht", "Unternehmensformen")\n' +
          '3. Unterthema: Ein spezifischeres Unterthema (z.B. "Angebot & Nachfrage", "Mängelrechte")\n' +
          '4. Bloom-Stufe: K1 (Wissen), K2 (Verstehen), K3 (Anwenden), K4 (Analysieren), K5 (Bewerten), K6 (Erschaffen)\n' +
          '5. Tags: 3–5 relevante Schlagwörter als Array\n\n' +
          'Antworte als JSON: { "fachbereich": "VWL"|"BWL"|"Recht", "thema": "...", "unterthema": "...", "bloom": "K1"-"K6", "tags": ["...", "..."] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'importiereFragen':
        if (!daten.text) return jsonResponse({ error: 'Text zum Importieren fehlt' });
        userPrompt = 'Analysiere den folgenden Text und extrahiere alle identifizierbaren Prüfungsfragen. ' +
          'Für jede Frage bestimme den Typ (mc, freitext, zuordnung, lueckentext, richtigfalsch, berechnung), ' +
          'die Bloom-Stufe (K1–K6), eine sinnvolle Punktzahl und die vollständige Frage.\n\n' +
          'Fachbereich: ' + (daten.fachbereich || 'Wirtschaft & Recht') + '\n' +
          (daten.thema ? 'Thema: ' + daten.thema + '\n' : '') +
          'Standard-Bloom-Stufe (falls nicht erkennbar): ' + (daten.bloom || 'K2') + '\n\n' +
          'Text:\n' + daten.text + '\n\n' +
          'Regeln:\n' +
          '- Wenn MC-Optionen (a, b, c, d) erkennbar sind: typ = "mc", mit optionen-Array\n' +
          '- Wenn Richtig/Falsch-Aussagen erkennbar: typ = "richtigfalsch"\n' +
          '- Wenn Zuordnungspaare erkennbar: typ = "zuordnung"\n' +
          '- Sonst: typ = "freitext"\n' +
          '- Für jede Frage eine Musterlösung erstellen\n\n' +
          'Antworte als JSON: { "fragen": [{ "typ": "mc"|"freitext"|"zuordnung"|"richtigfalsch"|"berechnung", ' +
          '"fragetext": "...", "bloom": "K1"-"K6", "punkte": 1-10, "musterlosung": "...", ' +
          '"optionen": [{"text": "...", "korrekt": true/false}] (nur bei MC), ' +
          '"paare": [{"links": "...", "rechts": "..."}] (nur bei Zuordnung), ' +
          '"aussagen": [{"text": "...", "korrekt": true/false, "erklaerung": "..."}] (nur bei R/F) ' +
          '}, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt, 4096);
        return jsonResponse({ success: true, ergebnis: result });

      case 'analysierePruefung':
        if (!daten.pruefung || !daten.pruefung.fragen) return jsonResponse({ error: 'Prüfungsdaten mit Fragen nötig' });
        userPrompt = 'Analysiere die folgende Prüfung umfassend:\n\n' +
          'Prüfung: ' + JSON.stringify(daten.pruefung) + '\n\n' +
          'Analysiere folgende Aspekte:\n' +
          '1. Bloom-Taxonomie-Verteilung (K1–K6): Wie viele Fragen auf welcher Stufe?\n' +
          '2. Fragetypen-Mix: Verteilung der verschiedenen Fragetypen\n' +
          '3. Zeitschätzung: Geschätzte Bearbeitungszeit pro Frage und gesamt vs. verfügbare Zeit (' + (daten.pruefung.dauerMinuten || '?') + ' Min.)\n' +
          '4. Themenabdeckung: Sind alle relevanten Themen abgedeckt?\n' +
          '5. Schwierigkeitsbalance: Ist die Schwierigkeit ausgewogen?\n' +
          '6. Verbesserungsvorschläge: Konkrete Empfehlungen\n\n' +
          'Antworte als JSON: { "taxonomie": { "K1": 0, "K2": 0, "K3": 0, "K4": 0, "K5": 0, "K6": 0 }, ' +
          '"typenMix": { "mc": 0, "freitext": 0, ... }, ' +
          '"zeitschaetzung": { "gesamt": 0, "proFrage": [{ "frageNr": 1, "minuten": 0 }, ...] }, ' +
          '"themenAbdeckung": "...", "schwierigkeitsBalance": "...", "verbesserungen": ["...", "..."] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt, 2048);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereFrageZuLernziel':
        if (!daten.lernziel) return jsonResponse({ error: 'Lernziel fehlt' });
        userPrompt = 'Generiere eine Prüfungsfrage für das Schweizer Gymnasium (Kanton Bern, Lehrplan 17).\n\n' +
          'Lernziel:\n' + daten.lernziel + '\n\n' +
          'Bloom-Stufe: ' + (daten.bloom || 'K2') + '\n' +
          (daten.thema ? 'Thema: ' + daten.thema + '\n' : '') +
          'Fragetyp: ' + (daten.fragetyp || 'freitext') + '\n\n' +
          'Wichtig:\n' +
          '- Verwende Schweizer Kontext (CHF, Schweizer Institutionen wie SNB, SECO, BFS)\n' +
          '- Die Frage muss das Lernziel prüfen\n' +
          '- Schwierigkeit passend zur Bloom-Stufe\n\n' +
          'Antworte als JSON mit folgender Struktur:\n' +
          '{\n' +
          '  "fragetext": "...",\n' +
          '  "musterlosung": "...",\n' +
          '  "punkte": <Zahl>,\n' +
          (daten.fragetyp === 'mc' ?
            '  "optionen": [{ "text": "...", "korrekt": true/false }, ...]\n' :
            daten.fragetyp === 'richtigfalsch' ?
            '  "aussagen": [{ "text": "...", "korrekt": true/false, "erklaerung": "..." }, ...]\n' :
            daten.fragetyp === 'zuordnung' ?
            '  "paare": [{ "links": "...", "rechts": "..." }, ...]\n' :
            daten.fragetyp === 'lueckentext' ?
            '  "textMitLuecken": "Text mit {{1}}, {{2}} ...", "luecken": [{ "id": "1", "korrekteAntworten": ["..."] }, ...]\n' :
            daten.fragetyp === 'berechnung' ?
            '  "ergebnisse": [{ "label": "...", "korrekt": 0, "toleranz": 0, "einheit": "CHF" }], "rechenwegErforderlich": true\n' :
            '') +
          '}';
        result = rufeClaudeAuf(systemPrompt, userPrompt, 1536);
        return jsonResponse({ success: true, ergebnis: result });

      // === Buchhaltung / FiBu ===

      case 'generiereKontenauswahl':
        if (!daten.geschaeftsfall) return jsonResponse({ error: 'Geschäftsfall fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte für den Schweizer KMU-Kontenrahmen. ' +
          'Gegeben ist ein Geschäftsfall. Schlage 8–12 relevante Konten vor (die korrekten + plausible Distraktoren).\n\n' +
          'Geschäftsfall:\n' + daten.geschaeftsfall + '\n\n' +
          'Antworte als JSON: { "konten": [{ "nummer": "1000", "name": "Kasse" }, ...] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereBuchungssaetze':
        if (!daten.geschaeftsfall) return jsonResponse({ error: 'Geschäftsfall fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Erstelle die korrekten Buchungssätze (Soll/Haben mit Kontonummern und Beträgen) für den gegebenen Geschäftsfall. ' +
          'Verwende den Schweizer KMU-Kontenrahmen.\n\n' +
          'Geschäftsfall:\n' + daten.geschaeftsfall + '\n\n' +
          'Antworte als JSON: { "buchungen": [{ "sollKonten": [{ "kontonummer": "1000", "betrag": 500 }], "habenKonten": [{ "kontonummer": "2000", "betrag": 500 }], "buchungstext": "..." }] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'pruefeBuchungssaetze':
        if (!daten.geschaeftsfall || !daten.buchungen) return jsonResponse({ error: 'Geschäftsfall und Buchungen nötig' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Prüfe die folgenden Buchungssätze auf fachliche Korrektheit (Soll/Haben-Logik, Kontenrahmen, Beträge).\n\n' +
          'Geschäftsfall:\n' + daten.geschaeftsfall + '\n\n' +
          'Buchungen:\n' + JSON.stringify(daten.buchungen) + '\n\n' +
          'Antworte als JSON: { "korrekt": true/false, "bewertung": "...", "korrigiert": [{ "sollKonten": [...], "habenKonten": [...], "buchungstext": "..." }] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereTKonten':
        if (!daten.aufgabentext) return jsonResponse({ error: 'Aufgabentext fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Erstelle T-Konten für den gegebenen Aufgabentext. ' +
          'Verwende den Schweizer KMU-Kontenrahmen.\n\n' +
          'Aufgabe:\n' + daten.aufgabentext + '\n\n' +
          'Antworte als JSON: { "konten": [{ "kontonummer": "1000", "name": "Kasse", "anfangsbestand": 5000, "eintraege": [{ "seite": "soll", "gegenkonto": "2000", "betrag": 500 }], "saldo": { "betrag": 5500, "seite": "soll" } }] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereKontenaufgaben':
        if (!daten.aufgabentext) return jsonResponse({ error: 'Aufgabentext fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Erstelle 6–10 Geschäftsfälle zur Kontenbestimmung. ' +
          'Für jeden Geschäftsfall: welches Konto, welche Kategorie (aktiv/passiv/aufwand/ertrag), welche Buchungsseite (Soll/Haben).\n\n' +
          'Thema:\n' + daten.aufgabentext + '\n\n' +
          'Antworte als JSON: { "aufgaben": [{ "text": "Barverkauf von Waren", "erwarteteAntworten": [{ "kontonummer": "1000", "kategorie": "aktiv", "seite": "soll" }, { "kontonummer": "3200", "kategorie": "ertrag", "seite": "haben" }] }] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt, 1536);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereBilanzStruktur':
        if (!daten.aufgabentext) return jsonResponse({ error: 'Aufgabentext fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Erstelle eine ' +
          (daten.modus === 'erfolgsrechnung' ? 'mehrstufige Erfolgsrechnung' : 'Bilanz') +
          ' basierend auf dem Aufgabentext. Verwende den Schweizer KMU-Kontenrahmen.\n\n' +
          'Aufgabe:\n' + daten.aufgabentext + '\n\n' +
          (daten.modus === 'erfolgsrechnung' ?
            'Antworte als JSON: { "erfolgsrechnung": { "stufen": [{ "label": "Bruttogewinn", "aufwandKonten": ["4200"], "ertragKonten": ["3200"], "zwischentotal": 50000 }] } }' :
            'Antworte als JSON: { "bilanz": { "aktivSeite": { "label": "Aktiven", "gruppen": [{ "label": "Umlaufvermögen", "positionen": [{ "konto": "1000", "name": "Kasse", "betrag": 5000 }] }] }, "passivSeite": { "label": "Passiven", "gruppen": [{ "label": "Fremdkapital", "positionen": [{ "konto": "2000", "name": "Kreditoren", "betrag": 3000 }] }] }, "bilanzsumme": 100000 } }');
        result = rufeClaudeAuf(systemPrompt, userPrompt, 1536);
        return jsonResponse({ success: true, ergebnis: result });

      case 'generiereFallbeispiel':
        if (!daten.thema) return jsonResponse({ error: 'Thema fehlt' });
        userPrompt = 'Du bist ein Buchhaltungsexperte. Erstelle ein vollständiges Fallbeispiel mit Geschäftsfällen für das Thema. ' +
          'Verwende Schweizer KMU-Kontenrahmen und CHF.\n\n' +
          'Thema: ' + daten.thema + '\n' +
          (daten.schwierigkeit ? 'Schwierigkeit: ' + daten.schwierigkeit + '\n' : '') +
          '\nAntworte als JSON: { "titel": "...", "beschreibung": "Ausgangslage des Unternehmens", "geschaeftsfaelle": [{ "nr": 1, "text": "...", "loesung": { "sollKonten": [{ "kontonummer": "1000", "betrag": 500 }], "habenKonten": [{ "kontonummer": "2000", "betrag": 500 }] } }] }';
        result = rufeClaudeAuf(systemPrompt, userPrompt, 2048);
        return jsonResponse({ success: true, ergebnis: result });

      case 'korrigiereZeichnung': {
        var bild = daten.bild;           // base64 PNG (without data:image/png;base64, prefix)
        var fragetext = daten.fragetext;
        var musterloesungBild = daten.musterloesungBild || null;
        var maxPunkte = daten.maxPunkte || 1;

        var sysPrompt = 'Du bist ein erfahrener Prüfungskorrektor an einem Schweizer Gymnasium. ' +
          'Bewerte die folgende Zeichnung/Beschriftung eines Schülers. ' +
          'Antworte ausschliesslich als JSON: { "punkte": number, "begruendung": string }';

        var userPrompt = 'Frage: ' + fragetext + '\n' +
          'Maximale Punkte: ' + maxPunkte + '\n' +
          (musterloesungBild ? 'Eine Musterlösung ist als zweites Bild beigefügt.\n' : '') +
          'Bewerte Vollständigkeit, Korrektheit und Qualität.';

        // Build messages with image content blocks
        var content = [
          { type: 'text', text: userPrompt },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: bild } }
        ];
        if (musterloesungBild) {
          content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: musterloesungBild } });
        }

        var ergebnis = rufeClaudeAufMitBild(sysPrompt, [{ role: 'user', content: content }]);

        // Clamp points to [0, maxPunkte]
        if (ergebnis && typeof ergebnis.punkte === 'number') {
          ergebnis.punkte = Math.max(0, Math.min(maxPunkte, ergebnis.punkte));
        }
        // Truncate reasoning to 500 chars
        if (ergebnis && ergebnis.begruendung && ergebnis.begruendung.length > 500) {
          ergebnis.begruendung = ergebnis.begruendung.substring(0, 497) + '...';
        }

        return jsonResponse({ success: true, ergebnis: ergebnis || { punkte: 0, begruendung: 'KI-Vorschlag konnte nicht generiert werden.' } });
      }

      case 'korrigierePDFAnnotation':
        return korrigierePDFAnnotation(daten);

      default:
        return jsonResponse({ error: 'Unbekannte KI-Aktion: ' + aktion });
    }

  } catch (err) {
    return jsonResponse({ error: 'KI-Assistent Fehler: ' + err.message });
  }
}

function rufeClaudeAuf(systemPrompt, userPrompt, maxTokens) {
  maxTokens = maxTokens || 1024;
  const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY nicht als Script Property gesetzt');
  }

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    payload: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  if (status !== 200) {
    throw new Error('Claude API ' + status + ': ' + response.getContentText().substring(0, 200));
  }

  const result = JSON.parse(response.getContentText());
  const text = result.content[0].text;
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

function korrigierePDFAnnotation(params) {
  const { pdfBilder, annotationen, musterloesungAnnotationen, bewertungsraster, maxPunkte } = params;

  const prompt = `Du bist Korrektur-Assistent für eine Prüfung am Gymnasium Hofwil.

Aufgabe: Bewerte die PDF-Annotationen eines Schülers.

Bewertungsraster:
${JSON.stringify(bewertungsraster)}

Musterlösung (Annotationen):
${JSON.stringify(musterloesungAnnotationen)}

Schüler-Annotationen:
${JSON.stringify(annotationen)}

Maximale Punktzahl: ${maxPunkte}

Antworte mit JSON: { "punkte": <number>, "begruendung": "<text>" }`;

  const messages = [{
    role: 'user',
    content: [
      ...pdfBilder.map(bild => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: bild }
      })),
      { type: 'text', text: prompt }
    ]
  }];

  const sysPrompt = 'Du bist ein erfahrener Prüfungskorrektor an einem Schweizer Gymnasium. ' +
    'Antworte ausschliesslich als JSON: { "punkte": number, "begruendung": string }';

  return rufeClaudeAufMitBild(sysPrompt, messages);
}

function rufeClaudeAufMitBild(systemPrompt, messages) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    Logger.log('ANTHROPIC_API_KEY nicht gesetzt');
    return null;
  }

  var payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  };

  try {
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var json = JSON.parse(response.getContentText());
    if (json.error) {
      Logger.log('Claude API Fehler: ' + JSON.stringify(json.error));
      return null;
    }

    var textContent = json.content.find(function(c) { return c.type === 'text'; });
    if (!textContent) return null;

    // Extract JSON from response (Claude sometimes wraps in markdown code blocks)
    var cleaned = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      Logger.log('JSON-Parse-Fehler bei KI-Antwort: ' + cleaned);
      return { punkte: 0, begruendung: 'KI-Vorschlag konnte nicht generiert werden.' };
    }
  } catch (e) {
    Logger.log('API-Aufruf fehlgeschlagen: ' + e.message);
    return null;
  }
}

// === AUTO-KORREKTUR (deterministische Fragetypen) ===

function autoBewerteAntwort(frage, antwort) {
  if (!antwort) return { punkte: 0, begruendung: 'Keine Antwort', quelle: 'auto' };

  switch (frage.typ) {
    case 'mc': {
      const korrekte = (frage.optionen || []).filter(o => o.korrekt).map(o => o.id);
      const gewaehlt = antwort.gewaehlteOptionen || [];
      const alleKorrekt = korrekte.every(id => gewaehlt.includes(id));
      const keineFalschen = gewaehlt.every(id => korrekte.includes(id));
      const richtig = alleKorrekt && keineFalschen;
      return { punkte: richtig ? frage.punkte : 0, begruendung: richtig ? 'Alle Optionen korrekt' : 'Falsche/fehlende Optionen', quelle: 'auto' };
    }
    case 'richtigfalsch': {
      const aussagen = frage.aussagen || [];
      let korrekt = 0;
      for (const a of aussagen) {
        if (antwort.bewertungen && antwort.bewertungen[a.id] === a.korrekt) korrekt++;
      }
      const punkte = aussagen.length > 0 ? Math.round(frage.punkte * korrekt / aussagen.length * 2) / 2 : 0;
      return { punkte, begruendung: korrekt + '/' + aussagen.length + ' korrekt', quelle: 'auto' };
    }
    case 'zuordnung': {
      const paare = frage.paare || [];
      let korrekt = 0;
      for (const p of paare) {
        if (antwort.zuordnungen && antwort.zuordnungen[p.links] === p.rechts) korrekt++;
      }
      const punkte = paare.length > 0 ? Math.round(frage.punkte * korrekt / paare.length * 2) / 2 : 0;
      return { punkte, begruendung: korrekt + '/' + paare.length + ' korrekt zugeordnet', quelle: 'auto' };
    }
    case 'lueckentext': {
      const luecken = frage.luecken || [];
      let korrekt = 0;
      for (const l of luecken) {
        const eingabe = (antwort.eintraege && antwort.eintraege[l.id] || '').toLowerCase().trim();
        const akzeptiert = (l.korrekteAntworten || [l.korrekt]).map(a => a.toLowerCase().trim());
        if (akzeptiert.includes(eingabe)) korrekt++;
      }
      const punkte = luecken.length > 0 ? Math.round(frage.punkte * korrekt / luecken.length * 2) / 2 : 0;
      return { punkte, begruendung: korrekt + '/' + luecken.length + ' Lücken korrekt', quelle: 'auto' };
    }
    case 'berechnung': {
      const ergebnisse = frage.ergebnisse || [];
      let korrekt = 0;
      for (const e of ergebnisse) {
        const eingabe = parseFloat(antwort.ergebnisse && antwort.ergebnisse[e.id] || '');
        if (!isNaN(eingabe) && Math.abs(eingabe - e.korrekt) <= (e.toleranz || 0)) korrekt++;
      }
      const punkte = ergebnisse.length > 0 ? Math.round(frage.punkte * korrekt / ergebnisse.length * 2) / 2 : 0;
      return { punkte, begruendung: korrekt + '/' + ergebnisse.length + ' Ergebnisse korrekt', quelle: 'auto' };
    }
    case 'freitext':
      return null; // → KI-Korrektur nötig
    default:
      return { punkte: 0, begruendung: 'Unbekannter Fragetyp', quelle: 'auto' };
  }
}

// === BATCH-KORREKTUR ORCHESTRATOR ===

function starteKorrekturEndpoint(body) {
  try {
    const { pruefungId, email } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const statusSheet = findOrCreateKorrekturSheet(pruefungId);
    setKorrekturStatus(statusSheet, 'laeuft', 0, 1);
    batchKorrektur(pruefungId, email, statusSheet);
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, fehler: error.message });
  }
}

function batchKorrektur(pruefungId, lpEmail, korrekturSheet) {
  const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
  const configData = getSheetData(configSheet);
  const configRow = configData.find(row => row.id === pruefungId);
  if (!configRow) throw new Error('Prüfung nicht gefunden');

  const abschnitte = safeJsonParse(configRow.abschnitte, []);
  const fragenIds = abschnitte.flatMap(a => a.fragenIds);
  const fragen = ladeFragen(fragenIds);
  const fragenMap = {};
  for (const f of fragen) fragenMap[f.id] = f;

  const antwortenSheet = getOrCreateAntwortenSheet(pruefungId);
  if (!antwortenSheet) {
    setKorrekturStatus(korrekturSheet, 'fehler', 0, 0);
    return;
  }
  const antwortenData = getSheetData(antwortenSheet);
  const gesamt = antwortenData.length * fragenIds.length;
  let erledigt = 0;
  const korrekturZeilen = [];

  for (const sus of antwortenData) {
    const antworten = safeJsonParse(sus.antworten, {});

    for (const frageId of fragenIds) {
      const frage = fragenMap[frageId];
      if (!frage) { erledigt++; continue; }

      const antwort = antworten[frageId];
      const autoBewertung = autoBewerteAntwort(frage, antwort);

      if (autoBewertung !== null) {
        korrekturZeilen.push({
          email: sus.email, name: sus.name || sus.email, frageId: frageId,
          fragenTyp: frage.typ, maxPunkte: frage.punkte,
          kiPunkte: autoBewertung.punkte, lpPunkte: '',
          kiBegruendung: autoBewertung.begruendung, kiFeedback: '',
          lpKommentar: '', quelle: autoBewertung.quelle, geprueft: autoBewertung.quelle === 'auto' ? 'true' : 'false', status: autoBewertung.quelle === 'auto' ? 'auto-bewertet' : 'ki-bewertet',
        });
      } else {
        try {
          const systemPrompt = buildKorrekturPrompt(frage);
          const userPrompt = antwort ? antwort.text || '(keine Antwort)' : '(keine Antwort)';
          const kiResult = rufeClaudeAuf(systemPrompt, userPrompt);

          korrekturZeilen.push({
            email: sus.email, name: sus.name || sus.email, frageId: frageId,
            fragenTyp: frage.typ, maxPunkte: frage.punkte,
            kiPunkte: Number(kiResult.punkte) || 0, lpPunkte: '',
            kiBegruendung: kiResult.begruendung || '', kiFeedback: kiResult.feedback || '',
            lpKommentar: '', quelle: 'ki', geprueft: 'false', status: 'ki-bewertet',
          });
        } catch (err) {
          korrekturZeilen.push({
            email: sus.email, name: sus.name || sus.email, frageId: frageId,
            fragenTyp: frage.typ, maxPunkte: frage.punkte,
            kiPunkte: '', lpPunkte: '',
            kiBegruendung: 'API-Fehler: ' + err.message, kiFeedback: '',
            lpKommentar: '', quelle: 'fehler', geprueft: 'false', status: 'offen',
          });
        }
      }

      erledigt++;
      if (erledigt % 10 === 0) {
        setKorrekturStatus(korrekturSheet, 'laeuft', erledigt, gesamt);
      }
    }
  }

  var headers = ['email', 'name', 'frageId', 'fragenTyp', 'maxPunkte', 'kiPunkte', 'lpPunkte', 'kiBegruendung', 'kiFeedback', 'lpKommentar', 'quelle', 'geprueft', 'status'];
  korrekturSheet.clear();
  korrekturSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  // ensureColumns für Zukunftssicherheit: Falls korrekturZeilen zusätzliche Schlüssel enthalten
  if (korrekturZeilen.length > 0) {
    headers = ensureColumns(korrekturSheet, headers, korrekturZeilen[0]);
  }

  if (korrekturZeilen.length > 0) {
    const rows = korrekturZeilen.map(z => headers.map(h => z[h] || ''));
    korrekturSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  setKorrekturStatus(korrekturSheet, 'fertig', erledigt, gesamt);
}

function buildKorrekturPrompt(frage) {
  const raster = (frage.bewertungsraster || [])
    .map(b => '- ' + b.beschreibung + ' (' + b.punkte + ' P.)')
    .join('\n');

  return 'Du bist Korrektor für eine Gymnasialprüfung im Fach Wirtschaft und Recht ' +
    '(Kanton Bern, Lehrplan 17). Bewerte die folgende Antwort anhand des Bewertungsrasters. ' +
    'Sei fair aber streng. Verwende Schweizer Hochdeutsch.\n\n' +
    'Frage: ' + (frage.fragetext || '') + '\n' +
    'Maximalpunktzahl: ' + frage.punkte + '\n' +
    'Musterlösung: ' + (frage.musterlosung || '(keine)') + '\n' +
    'Bewertungsraster:\n' + (raster || '(keines)') + '\n\n' +
    'Antworte ausschliesslich im JSON-Format:\n' +
    '{"punkte": <number>, "begruendung": "<kurze Begründung für die LP>", "feedback": "<konstruktives Feedback für den/die SuS>"}';
}

// === KORREKTUR HILFSFUNKTIONEN ===

function getOrCreateKorrekturSheet(pruefungId) {
  var tabName = 'Korrektur_' + pruefungId;

  if (ANTWORTEN_MASTER_ID) {
    var ss = SpreadsheetApp.openById(ANTWORTEN_MASTER_ID);
    var sheet = ss.getSheetByName(tabName);
    if (sheet) return sheet;

    sheet = ss.insertSheet(tabName);
    var headers = ['email', 'name', 'klasse'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return sheet;
  }

  // Fallback
  try {
    var ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    var files = ordner.getFilesByName(tabName);
    if (files.hasNext()) return SpreadsheetApp.open(files.next()).getSheets()[0];
  } catch (e) {}
  return null;
}

// Alias für Abwärtskompatibilität
function findOrCreateKorrekturSheet(pruefungId) {
  return getOrCreateKorrekturSheet(pruefungId);
}

function setKorrekturStatus(sheet, status, erledigt, gesamt) {
  sheet.getRange('Z1').setValue(JSON.stringify({ status, erledigt, gesamt, timestamp: new Date().toISOString() }));
}

function ladeKorrektur(pruefungId, email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Korrektur_' + pruefungId)
      : null;

    if (!sheet) {
      const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
      const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);
      return jsonResponse({
        pruefungId,
        pruefungTitel: configRow ? configRow.titel : pruefungId,
        datum: configRow ? configRow.datum : '',
        klasse: configRow ? configRow.klasse : '',
        schueler: [],
        batchStatus: 'idle',
        letzteAktualisierung: new Date().toISOString(),
      });
    }
    const data = getSheetData(sheet);
    const statusJson = safeJsonParse(sheet.getRange('Z1').getValue(), { status: 'idle' });
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);

    const schuelerMap = {};
    for (const row of data) {
      if (!row.email) continue;
      if (!schuelerMap[row.email]) {
        schuelerMap[row.email] = {
          email: row.email, name: row.name || row.email,
          bewertungen: {}, gesamtPunkte: 0, maxPunkte: 0, korrekturStatus: 'offen',
        };
      }
      const b = {
        frageId: row.frageId, fragenTyp: row.fragenTyp || '',
        maxPunkte: Number(row.maxPunkte) || 0,
        kiPunkte: row.kiPunkte !== '' ? Number(row.kiPunkte) : null,
        lpPunkte: row.lpPunkte !== '' ? Number(row.lpPunkte) : null,
        kiBegruendung: row.kiBegruendung || null,
        kiFeedback: row.kiFeedback || null,
        lpKommentar: row.lpKommentar || null,
        quelle: row.quelle || 'auto',
        geprueft: row.geprueft === 'true',
      };
      schuelerMap[row.email].bewertungen[row.frageId] = b;
      const eff = b.lpPunkte !== null ? b.lpPunkte : (b.kiPunkte !== null ? b.kiPunkte : 0);
      schuelerMap[row.email].gesamtPunkte += eff;
      schuelerMap[row.email].maxPunkte += b.maxPunkte;
    }

    for (const s of Object.values(schuelerMap)) {
      const bewertungen = Object.values(s.bewertungen);
      if (bewertungen.every(b => b.geprueft)) {
        s.korrekturStatus = 'review-fertig';
      } else if (bewertungen.some(b => b.quelle === 'ki' || b.quelle === 'auto')) {
        s.korrekturStatus = 'ki-bewertet';
      }
    }

    return jsonResponse({
      pruefungId,
      pruefungTitel: configRow ? configRow.titel : pruefungId,
      datum: configRow ? configRow.datum : '',
      klasse: configRow ? configRow.klasse : '',
      schueler: Object.values(schuelerMap),
      batchStatus: statusJson.status || 'idle',
      batchFortschritt: statusJson.erledigt !== undefined ? { erledigt: statusJson.erledigt, gesamt: statusJson.gesamt } : undefined,
      letzteAktualisierung: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function ladeAbgaben(pruefungId, email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Antworten_' + pruefungId)
      : null;
    if (!sheet) return jsonResponse({ abgaben: {} });

    const data = getSheetData(sheet);
    const abgaben = {};

    for (const row of data) {
      abgaben[row.email] = {
        email: row.email,
        name: row.name || row.email,
        antworten: safeJsonParse(row.antworten, {}),
        abgabezeit: row.letzterSave || '',
      };
    }

    return jsonResponse({ abgaben });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function ladeKorrekturFortschritt(pruefungId, email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Korrektur_' + pruefungId)
      : null;
    if (!sheet) return jsonResponse({ status: 'idle', fortschritt: { erledigt: 0, gesamt: 0 } });
    const statusJson = safeJsonParse(sheet.getRange('Z1').getValue(), { status: 'idle', erledigt: 0, gesamt: 0 });

    return jsonResponse({
      status: statusJson.status,
      fortschritt: { erledigt: statusJson.erledigt || 0, gesamt: statusJson.gesamt || 0 },
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

/**
 * Korrektur-Status einer Prüfung laden: Wie viele Zeilen sind geprüft vs. offen?
 * Gibt { korrigiert, offen, gesamt } zurück.
 */
function ladeKorrekturStatusEndpoint(pruefungId, email) {
  try {
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!pruefungId) {
      return jsonResponse({ error: 'Keine Prüfungs-ID angegeben' });
    }

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Korrektur_' + pruefungId)
      : null;
    if (!sheet) {
      return jsonResponse({ korrigiert: 0, offen: 0, gesamt: 0 });
    }
    const data = getSheetData(sheet);
    var korrigiert = 0;
    var offen = 0;
    for (var i = 0; i < data.length; i++) {
      if (data[i].geprueft === 'true' || data[i].geprueft === true) {
        korrigiert++;
      } else {
        offen++;
      }
    }
    return jsonResponse({ korrigiert: korrigiert, offen: offen, gesamt: data.length });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function speichereKorrekturZeile(body) {
  try {
    const { email, pruefungId, schuelerEmail, frageId } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Korrektur_' + pruefungId)
      : null;
    if (!sheet) return jsonResponse({ error: 'Korrektur-Sheet nicht gefunden' });
    const data = getSheetData(sheet);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowIndex = data.findIndex(r => r.email === schuelerEmail && r.frageId === frageId);
    if (rowIndex < 0) return jsonResponse({ error: 'Zeile nicht gefunden' });

    const row = rowIndex + 2;
    if (body.lpPunkte !== undefined) {
      const col = headers.indexOf('lpPunkte');
      if (col >= 0) sheet.getRange(row, col + 1).setValue(body.lpPunkte !== null ? body.lpPunkte : '');
    }
    if (body.lpKommentar !== undefined) {
      const col = headers.indexOf('lpKommentar');
      if (col >= 0) sheet.getRange(row, col + 1).setValue(body.lpKommentar || '');
    }
    if (body.geprueft !== undefined) {
      const col = headers.indexOf('geprueft');
      if (col >= 0) sheet.getRange(row, col + 1).setValue(body.geprueft ? 'true' : 'false');
    }
    if (body.audioKommentarId !== undefined) {
      let col = headers.indexOf('audioKommentarId');
      if (col < 0) {
        // Spalte hinzufügen
        col = headers.length;
        sheet.getRange(1, col + 1).setValue('audioKommentarId');
      }
      sheet.getRange(row, col + 1).setValue(body.audioKommentarId || '');
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === FEEDBACK PDF + E-MAIL ===

function generiereUndSendeFeedbackEndpoint(body) {
  try {
    const { email, pruefungId, schuelerEmails } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);
    if (!configRow) return jsonResponse({ error: 'Prüfung nicht gefunden' });

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Korrektur_' + pruefungId)
      : null;
    if (!sheet) return jsonResponse({ error: 'Korrektur nicht gefunden' });

    const data = getSheetData(sheet);
    const erfolg = [];
    const fehler = [];

    for (const susEmail of schuelerEmails) {
      try {
        const zeilen = data.filter(r => r.email === susEmail);
        if (zeilen.length === 0) { fehler.push(susEmail); continue; }

        const susName = zeilen[0].name || susEmail;
        const html = buildFeedbackHtml(configRow, zeilen, susName);

        const blob = HtmlService.createHtmlOutput(html).getBlob().setName(
          'Feedback_' + configRow.titel.replace(/[^a-zA-Z0-9äöüÄÖÜ ]/g, '') + '_' + susName.replace(/[^a-zA-Z0-9äöüÄÖÜ ]/g, '') + '.pdf'
        ).getAs('application/pdf');

        const pdfOrdner = findOrCreatePdfOrdner();
        pdfOrdner.createFile(blob);

        GmailApp.sendEmail(susEmail,
          'Feedback: ' + configRow.titel,
          'Im Anhang findest du das Feedback zu deiner Prüfung «' + configRow.titel + '».\n\nBei Fragen wende dich bitte an deine Lehrperson.',
          { attachments: [blob], name: 'Prüfungsplattform WR — Gymnasium Hofwil' }
        );

        erfolg.push(susEmail);
      } catch (err) {
        fehler.push(susEmail);
        Logger.log('Feedback-Fehler für ' + susEmail + ': ' + err.message);
      }
    }

    return jsonResponse({ erfolg, fehler });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function buildFeedbackHtml(configRow, zeilen, susName) {
  let totalPunkte = 0;
  let totalMax = 0;
  let fragenHtml = '';

  for (const z of zeilen) {
    const eff = z.lpPunkte !== '' ? Number(z.lpPunkte) : (z.kiPunkte !== '' ? Number(z.kiPunkte) : 0);
    const max = Number(z.maxPunkte) || 0;
    totalPunkte += eff;
    totalMax += max;

    const feedback = z.lpKommentar || z.kiFeedback || '';
    fragenHtml += '<div style="margin-bottom:12px;padding:8px;border:1px solid #e2e8f0;border-radius:6px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
        '<span style="font-weight:600;font-size:13px;">' + z.frageId + ' (' + z.fragenTyp + ')</span>' +
        '<span style="font-weight:700;font-size:14px;">' + eff + ' / ' + max + '</span>' +
      '</div>' +
      (feedback ? '<p style="font-size:12px;color:#475569;margin:4px 0 0;">' + feedback + '</p>' : '') +
    '</div>';
  }

  const note = totalMax > 0 ? Math.round((1 + 5 * totalPunkte / totalMax) * 2) / 2 : 1;

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1e293b}' +
    'h1{font-size:18px;margin-bottom:4px}h2{font-size:14px;color:#64748b;margin-top:20px;margin-bottom:8px}' +
    '.total{font-size:20px;font-weight:700;text-align:center;padding:12px;background:#f1f5f9;border-radius:8px;margin:16px 0}' +
    '</style></head><body>' +
    '<h1>Feedback: ' + configRow.titel + '</h1>' +
    '<p style="color:#64748b;font-size:13px">' + susName + ' · ' + (configRow.klasse || '') + ' · ' + (configRow.datum || '') + '</p>' +
    '<div class="total">Gesamtpunkte: ' + totalPunkte + ' / ' + totalMax + ' · Note: ' + note.toFixed(1) + '</div>' +
    '<h2>Einzelbewertungen</h2>' +
    fragenHtml +
    '<p style="color:#94a3b8;font-size:11px;margin-top:20px;text-align:center">Generiert von der Prüfungsplattform WR — Gymnasium Hofwil</p>' +
    '</body></html>';
}

function findOrCreatePdfOrdner() {
  const antworten = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const iter = antworten.getFoldersByName('Feedback-PDFs');
  if (iter.hasNext()) return iter.next();
  return antworten.createFolder('Feedback-PDFs');
}

// === PRÜFUNG FREISCHALTEN ===

function schalteFreiEndpoint(body) {
  try {
    const { pruefungId, email } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }
    if (!pruefungId) {
      return jsonResponse({ error: 'Keine Prüfungs-ID' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];
    const rowIndex = data.findIndex(row => row.id === pruefungId);

    if (rowIndex < 0) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    const col = headers.indexOf('freigeschaltet');
    if (col >= 0) {
      configSheet.getRange(rowIndex + 2, col + 1).setValue('true');
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === SCHÜLERCODE VALIDIERUNG ===

function validiereSchuelercode(body) {
  try {
    const { email, code } = body;
    if (!email || !code) return jsonResponse({ success: false, error: 'E-Mail und Code erforderlich' });

    const kurseSS = SpreadsheetApp.openById(KURSE_SHEET_ID);
    const sheets = kurseSS.getSheets();

    for (const sheet of sheets) {
      const sheetName = sheet.getName();
      // Überspringe Meta-Tab "Kurse"
      if (sheetName === 'Kurse' || sheetName.startsWith('_') || sheetName === 'Template') continue;
      const data = getSheetData(sheet);
      const eintrag = data.find(r => r.email === email && String(r.schuelerCode || r.schuelerID || '') === String(code));
      if (eintrag) {
        return jsonResponse({
          success: true,
          name: eintrag.name || '',
          vorname: eintrag.vorname || '',
          klasse: eintrag.klasse || sheetName,
        });
      }
    }

    return jsonResponse({ success: false, error: 'Code ungültig oder E-Mail nicht in Klassenliste.' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// === NACHRICHTEN (LP → SuS) ===

/**
 * Nachrichten-Sheet finden oder erstellen.
 * Speichert Nachrichten als Tab im Master-Spreadsheet.
 */
function getOrCreateNachrichtenSheet(pruefungId) {
  var tabName = 'Nachrichten_' + pruefungId;

  if (ANTWORTEN_MASTER_ID) {
    var ss = SpreadsheetApp.openById(ANTWORTEN_MASTER_ID);
    var sheet = ss.getSheetByName(tabName);
    if (sheet) return sheet;

    sheet = ss.insertSheet(tabName);
    var headers = ['id', 'pruefungId', 'von', 'an', 'typ', 'inhalt', 'zeitstempel', 'gelesen'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    return sheet;
  }

  // Fallback
  try {
    var ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    var files = ordner.getFilesByName(tabName);
    if (files.hasNext()) return SpreadsheetApp.open(files.next()).getSheets()[0];
  } catch (e) {}
  return null;
}

// Alias für Abwärtskompatibilität
function findOrCreateNachrichtenSheet(pruefungId) {
  return getOrCreateNachrichtenSheet(pruefungId);
}

/**
 * Nachricht von LP an SuS senden (POST)
 * Body: { pruefungId, von, an, text }
 */
function sendeNachrichtEndpoint(body) {
  try {
    const { pruefungId, von, an, text } = body;

    if (!pruefungId || !von || !an || !text) {
      return jsonResponse({ error: 'Fehlende Parameter' });
    }

    // Nur LP darf senden
    if (!von.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur Lehrpersonen können Nachrichten senden' });
    }

    const sheet = findOrCreateNachrichtenSheet(pruefungId);
    const id = new Date().getTime().toString() + '_' + Math.random().toString(36).substr(2, 5);
    const zeitpunkt = new Date().toISOString();

    sheet.appendRow([id, von, an, text, zeitpunkt, false]);

    return jsonResponse({ success: true, id: id });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

/**
 * Nachrichten für eine Person laden (GET)
 * Parameter: id (pruefungId), email
 * Gibt Nachrichten zurück, die an diese E-Mail oder an '*' (Broadcast) gerichtet sind.
 * LP sieht alle Nachrichten (auch an andere SuS).
 */
function ladeNachrichtenEndpoint(pruefungId, email) {
  try {
    if (!pruefungId) {
      return jsonResponse({ error: 'Fehlende Prüfungs-ID' });
    }

    const sheet = ANTWORTEN_MASTER_ID
      ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID).getSheetByName('Nachrichten_' + pruefungId)
      : null;

    // Kein Nachrichten-Sheet vorhanden → leeres Array
    if (!sheet) {
      return jsonResponse({ nachrichten: [] });
    }
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ nachrichten: [] });
    }

    const headers = data[0];
    const istLP = email.endsWith('@' + LP_DOMAIN);
    const nachrichten = [];

    for (var i = 1; i < data.length; i++) {
      var row = {};
      for (var j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }

      // LP sieht alle Nachrichten, SuS nur ihre eigenen + Broadcasts
      if (istLP || row.an === email || row.an === '*') {
        nachrichten.push({
          id: row.id || '',
          von: row.von || '',
          an: row.an || '',
          text: row.text || '',
          zeitpunkt: row.zeitpunkt || '',
          gelesen: row.gelesen === true || row.gelesen === 'true',
        });
      }
    }

    return jsonResponse({ nachrichten: nachrichten });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === KORREKTUR FREIGEBEN (LP → SuS-Einsicht aktivieren) ===

function korrekturFreigebenEndpoint(body) {
  try {
    const { email, pruefungId, freigegeben, typ } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];

    const rowIndex = data.findIndex(r => r.id === pruefungId);
    if (rowIndex < 0) return jsonResponse({ error: 'Prüfung nicht gefunden' });

    // 2-stufige Freigabe: typ = 'einsicht' (default) oder 'pdf'
    const spaltenName = typ === 'pdf' ? 'korrekturPdfFreigegeben' : 'korrekturFreigegeben';
    let col = headers.indexOf(spaltenName);
    if (col < 0) {
      col = headers.length;
      configSheet.getRange(1, col + 1).setValue(spaltenName);
    }
    configSheet.getRange(rowIndex + 2, col + 1).setValue(freigegeben ? 'true' : 'false');

    // Bei Einsicht-Freigabe: SuS per E-Mail benachrichtigen
    let benachrichtigt = 0;
    if (freigegeben && typ !== 'pdf') {
      try {
        const configRow = data[rowIndex];
        const titel = configRow.titel || pruefungId;
        const teilnehmer = safeJsonParse(configRow.teilnehmer, []);
        const appUrl = ScriptApp.getService().getUrl().replace('/exec', '').replace('/dev', '');
        // Basis-URL aus der Deployment-URL ableiten (GitHub Pages)
        const pruefungUrl = 'https://durandbourjate.github.io/GYM-WR-DUY/Pruefung/';

        for (const sus of teilnehmer) {
          if (!sus.email) continue;
          try {
            MailApp.sendEmail({
              to: sus.email,
              subject: 'Korrektur verfügbar: ' + titel,
              htmlBody: '<p>Hallo ' + (sus.vorname || sus.name || '') + '</p>' +
                '<p>Die Korrektur für <strong>' + titel + '</strong> ist verfügbar.</p>' +
                '<p><a href="' + pruefungUrl + '">Jetzt einsehen →</a></p>' +
                '<p style="color:#888;font-size:12px">Öffne den Link und melde dich mit deinem Schulkonto an, um deine Korrektur einzusehen.</p>',
            });
            benachrichtigt++;
          } catch (mailErr) {
            console.log('Mail-Fehler für ' + sus.email + ': ' + mailErr.message);
          }
        }
      } catch (notifyErr) {
        console.log('Benachrichtigung fehlgeschlagen: ' + notifyErr.message);
        // Freigabe war erfolgreich, Benachrichtigung ist optional
      }
    }

    return jsonResponse({ success: true, benachrichtigt: benachrichtigt });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === KORREKTUREN FÜR SUS LADEN (Liste freigegebener Prüfungen) ===

function ladeKorrekturenFuerSuSEndpoint(body) {
  try {
    const { email: schuelerEmail } = body;
    if (!schuelerEmail) return jsonResponse({ error: 'E-Mail fehlt' });

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configs = getSheetData(configSheet);
    const masterSS = ANTWORTEN_MASTER_ID ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID) : null;

    const ergebnis = [];
    for (const configRow of configs) {
      if (configRow.korrekturFreigegeben !== 'true') continue;

      const pruefungId = configRow.id;
      const sheet = masterSS ? masterSS.getSheetByName('Korrektur_' + pruefungId) : null;
      if (!sheet) continue;
      const data = getSheetData(sheet);
      const zeilen = data.filter(r => r.email === schuelerEmail);
      if (zeilen.length === 0) continue;

      // Punkte aggregieren
      let gesamtPunkte = 0;
      let maxPunkte = 0;
      for (const z of zeilen) {
        const lp = z.lpPunkte !== '' && z.lpPunkte !== undefined ? Number(z.lpPunkte) : null;
        const ki = z.kiPunkte !== '' && z.kiPunkte !== undefined ? Number(z.kiPunkte) : null;
        const punkte = lp !== null ? lp : (ki !== null ? ki : 0);
        gesamtPunkte += punkte;
        maxPunkte += Number(z.maxPunkte) || 0;
      }

      ergebnis.push({
        pruefungId,
        titel: configRow.titel || pruefungId,
        datum: configRow.datum || '',
        klasse: configRow.klasse || '',
        gesamtPunkte,
        maxPunkte,
      });
    }

    return jsonResponse({ success: true, korrekturen: ergebnis });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === KORREKTUR-DETAIL FÜR SUS LADEN (einzelne Prüfung) ===

function ladeKorrekturDetailEndpoint(body) {
  try {
    const { email: schuelerEmail, pruefungId } = body;
    if (!schuelerEmail || !pruefungId) return jsonResponse({ error: 'Parameter fehlen' });

    // Prüfen ob Korrektur freigegeben
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);
    if (!configRow) return jsonResponse({ error: 'Prüfung nicht gefunden' });
    if (configRow.korrekturFreigegeben !== 'true') {
      return jsonResponse({ error: 'Korrektur nicht freigegeben' });
    }

    // Korrektur-Daten laden
    const masterSS = ANTWORTEN_MASTER_ID ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID) : null;
    const korrekturSheet = masterSS ? masterSS.getSheetByName('Korrektur_' + pruefungId) : null;
    if (!korrekturSheet) return jsonResponse({ error: 'Korrektur nicht gefunden' });
    const korrekturData = getSheetData(korrekturSheet);
    const zeilen = korrekturData.filter(r => r.email === schuelerEmail);
    if (zeilen.length === 0) return jsonResponse({ error: 'Keine Daten gefunden' });

    // Bewertungen zusammenbauen
    const bewertungen = {};
    let gesamtPunkte = 0;
    let maxPunkte = 0;
    let audioGesamtkommentarId = null;

    for (const z of zeilen) {
      if (z.frageId === '_gesamt') {
        audioGesamtkommentarId = z.audioKommentarId || null;
        continue;
      }

      const lp = z.lpPunkte !== '' && z.lpPunkte !== undefined ? Number(z.lpPunkte) : null;
      const ki = z.kiPunkte !== '' && z.kiPunkte !== undefined ? Number(z.kiPunkte) : null;
      const punkte = lp !== null ? lp : (ki !== null ? ki : 0);
      const max = Number(z.maxPunkte) || 0;
      gesamtPunkte += punkte;
      maxPunkte += max;

      bewertungen[z.frageId] = {
        frageId: z.frageId,
        punkte: punkte,
        maxPunkte: max,
        lpKommentar: z.lpKommentar || null,
        kiFeedback: z.kiFeedback || null,
        audioKommentarId: z.audioKommentarId || null,
      };
    }

    // Antworten laden
    const antwortSheet = masterSS ? masterSS.getSheetByName('Antworten_' + pruefungId) : null;
    const antworten = {};
    if (antwortSheet) {
      const antwortData = getSheetData(antwortSheet);
      const susAntwort = antwortData.find(r => r.email === schuelerEmail);
      if (susAntwort && susAntwort.antworten) {
        const parsed = safeJsonParse(susAntwort.antworten, {});
        Object.assign(antworten, parsed);
      }
    }

    // Fragen laden (für Fragetext-Anzeige)
    const fragenSheet = SpreadsheetApp.openById(FRAGENBANK_ID).getSheets()[0];
    const fragenData = getSheetData(fragenSheet);
    const fragen = [];
    const frageIds = Object.keys(bewertungen);
    for (const fd of fragenData) {
      if (frageIds.includes(fd.id)) {
        fragen.push(safeJsonParse(fd.json || fd.daten, null) || { id: fd.id, typ: 'freitext', fragetext: fd.id });
      }
    }

    return jsonResponse({
      success: true,
      titel: configRow.titel || pruefungId,
      datum: configRow.datum || '',
      klasse: configRow.klasse || '',
      fragen,
      antworten,
      bewertungen,
      gesamtPunkte,
      maxPunkte,
      audioGesamtkommentarId,
      pdfFreigegeben: configRow.korrekturPdfFreigegeben === 'true',
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === GitHub API Helpers ===

function githubApiRequest(method, path, payload) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN nicht konfiguriert');

  var options = {
    method: method,
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GymHofwil-Pruefungsplattform'
    },
    muteHttpExceptions: true
  };

  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }

  var url = 'https://api.github.com' + path;
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());

  if (code >= 400) {
    throw new Error('GitHub API ' + code + ': ' + (body.message || 'Unbekannter Fehler'));
  }

  return body;
}

function githubGetFile(pfad) {
  return githubApiRequest('GET', '/repos/durandbourjate/GYM-WR-DUY/contents/' + pfad);
}

function githubPutFile(pfad, content, sha, message) {
  return githubApiRequest('PUT', '/repos/durandbourjate/GYM-WR-DUY/contents/' + pfad, {
    message: message,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    sha: sha,
    branch: 'main'
  });
}

// === Pool-JS-Parsing ===

/**
 * Findet ein Frage-Objekt im JS-String anhand der ID.
 * Gibt {start, end, text} Positionen zurück.
 */
function findeFrageImJS(jsContent, frageId) {
  var idPattern = new RegExp('id:\\s*["\']' + frageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']');
  var idMatch = idPattern.exec(jsContent);
  if (!idMatch) return null;

  // Rückwärts zum öffnenden { suchen
  var start = idMatch.index;
  while (start > 0 && jsContent[start] !== '{') start--;

  // Vorwärts zum schliessenden } mit Bracket-Matching
  var depth = 0;
  var end = start;
  for (var i = start; i < jsContent.length; i++) {
    if (jsContent[i] === '{') depth++;
    if (jsContent[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  return { start: start, end: end, text: jsContent.substring(start, end) };
}

/**
 * Ersetzt ein einzelnes Feld innerhalb eines Frage-Objekt-Strings.
 * Verwendet Bracket-Depth-Counting für Arrays/Objects.
 */
function ersetzeFeldImObjekt(objektText, feldName, neuerWert) {
  var feldPattern = new RegExp(feldName + ':\\s*');
  var match = feldPattern.exec(objektText);

  if (!match) {
    // Feld existiert nicht → vor dem letzten } einfügen
    var letzteKlammer = objektText.lastIndexOf('}');
    var vorher = objektText.substring(0, letzteKlammer).trimEnd();
    var komma = vorher.endsWith(',') ? '' : ',';
    return vorher + komma + '\n    ' + feldName + ': ' + serialisiereWert(neuerWert) + '\n  }';
  }

  var wertStart = match.index + match[0].length;
  var wertEnde = findeWertEnde(objektText, wertStart);
  return objektText.substring(0, wertStart) + serialisiereWert(neuerWert) + objektText.substring(wertEnde);
}

/**
 * Findet das Ende eines JS-Werts ab einer Position.
 * Bracket-Depth-Counting für verschachtelte Arrays/Objects.
 */
function findeWertEnde(text, start) {
  var ch = text.charAt(start);

  // String: suche schliessendes "
  if (ch === '"') {
    for (var i = start + 1; i < text.length; i++) {
      if (text.charAt(i) === '\\') { i++; continue; }
      if (text.charAt(i) === '"') return i + 1;
    }
    return text.length;
  }

  // Array oder Object: Bracket-Depth-Counting
  if (ch === '[' || ch === '{') {
    var close = ch === '[' ? ']' : '}';
    var depth = 0;
    for (var i = start; i < text.length; i++) {
      if (text.charAt(i) === '"') {
        for (i++; i < text.length; i++) {
          if (text.charAt(i) === '\\') { i++; continue; }
          if (text.charAt(i) === '"') break;
        }
        continue;
      }
      if (text.charAt(i) === ch) depth++;
      if (text.charAt(i) === close) { depth--; if (depth === 0) return i + 1; }
    }
    return text.length;
  }

  // Number, Boolean: bis zum nächsten Trennzeichen
  for (var i = start; i < text.length; i++) {
    if (',\n\r}'.indexOf(text.charAt(i)) >= 0) return i;
  }
  return text.length;
}

function serialisiereWert(wert) {
  if (typeof wert === 'string') return JSON.stringify(wert);
  if (typeof wert === 'number' || typeof wert === 'boolean') return String(wert);
  if (Array.isArray(wert)) {
    if (wert.length === 0) return '[]';
    if (typeof wert[0] === 'string') return '[' + wert.map(function(v) { return JSON.stringify(v); }).join(', ') + ']';
    var items = wert.map(function(item) {
      var pairs = Object.keys(item).map(function(k) { return k + ': ' + serialisiereWert(item[k]); });
      return '      {' + pairs.join(', ') + '}';
    });
    return '[\n' + items.join(',\n') + '\n    ]';
  }
  return JSON.stringify(wert);
}

/**
 * Berechnet SHA-256 Content-Hash.
 * WICHTIG: Exakt gleiche Logik wie berechneContentHash() im Frontend (poolSync.ts).
 */
function berechnePoolContentHash(frage) {
  var obj = {};
  obj.q = frage.q;
  obj.type = frage.type;
  obj.explain = frage.explain;
  obj.options = frage.options;
  obj.correct = frage.correct;
  obj.blanks = frage.blanks;
  obj.rows = frage.rows;
  obj.categories = frage.categories;
  obj.items = frage.items;
  obj.sample = frage.sample;
  obj.img = frage.img;
  var hashInput = JSON.stringify(obj);
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hashInput, Utilities.Charset.UTF_8);
  return rawHash.map(function(b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

/**
 * Extrahiert Frage-Felder aus einem JS-Objekt-String (für Hash nach Update).
 */
function extrahiereFrageFelder(objektText) {
  var felder = {};
  var feldNamen = ['q', 'type', 'explain', 'options', 'correct', 'blanks', 'rows', 'categories', 'items', 'sample', 'img'];
  for (var i = 0; i < feldNamen.length; i++) {
    var name = feldNamen[i];
    var pattern = new RegExp(name + ':\\s*');
    var match = pattern.exec(objektText);
    if (match) {
      var start = match.index + match[0].length;
      var ch = objektText.charAt(start);
      if (ch === '"') {
        var end = start + 1;
        while (end < objektText.length && !(objektText.charAt(end) === '"' && objektText.charAt(end - 1) !== '\\')) end++;
        try { felder[name] = JSON.parse(objektText.substring(start, end + 1)); } catch(e) {}
      } else if (ch === '[') {
        var depth = 0; var end = start;
        for (var j = start; j < objektText.length; j++) {
          if (objektText.charAt(j) === '[') depth++;
          if (objektText.charAt(j) === ']') { depth--; if (depth === 0) { end = j + 1; break; } }
        }
        try { felder[name] = JSON.parse(objektText.substring(start, end).replace(/(\w+)\s*:/g, '"$1":')); } catch(e) {}
      } else if (ch === 't' || ch === 'f') {
        felder[name] = ch === 't';
      } else if (!isNaN(parseInt(ch))) {
        felder[name] = parseFloat(objektText.substring(start).match(/[\d.]+/)[0]);
      }
    }
  }
  return felder;
}

/**
 * Generiert eine neue Frage-ID für Export.
 */
function generiereNeueFrageId(jsContent, topicKey) {
  var prefix = topicKey.charAt(0);
  var idPattern = new RegExp('id:\\s*["\'](' + prefix + '\\d+)["\']', 'g');
  var maxNum = 0;
  var match;
  while ((match = idPattern.exec(jsContent)) !== null) {
    var num = parseInt(match[1].substring(prefix.length), 10);
    if (num > maxNum) maxNum = num;
  }
  var neueNummer = maxNum + 1;
  return prefix + (neueNummer < 10 ? '0' : '') + neueNummer;
}

// === Pool-Rück-Sync Hauptfunktion ===

function schreibePoolAenderung(body) {
  var email = body.email;
  if (!email || !email.endsWith('@gymhofwil.ch')) {
    return jsonResponse({ erfolg: false, fehler: ['Nicht autorisiert'] });
  }

  var poolDatei = body.poolDatei;
  var aenderungen = body.aenderungen;

  if (!poolDatei || !aenderungen || !aenderungen.length) {
    return jsonResponse({ erfolg: false, fehler: ['Fehlende Parameter'] });
  }

  try {
    // 1. Pool-Datei von GitHub laden
    var pfad = 'Uebungen/Uebungspools/config/' + poolDatei;
    var githubFile = githubGetFile(pfad);
    var jsContent = Utilities.newBlob(Utilities.base64Decode(githubFile.content)).getDataAsString('UTF-8');
    var sha = githubFile.sha;

    var modifizierterContent = jsContent;
    var aktualisiert = 0;
    var exportiert = 0;
    var fehler = [];
    var neueHashes = {};
    var exportierteIds = {};

    for (var a = 0; a < aenderungen.length; a++) {
      var aenderung = aenderungen[a];
      try {
        if (aenderung.typ === 'update') {
          // Bestehende Frage aktualisieren
          var fragePos = findeFrageImJS(modifizierterContent, aenderung.poolFrageId);
          if (!fragePos) {
            fehler.push('Frage ' + aenderung.poolFrageId + ' nicht gefunden im Pool');
            continue;
          }

          var objektText = fragePos.text;

          // Felder einzeln ersetzen
          var felderKeys = Object.keys(aenderung.felder);
          for (var f = 0; f < felderKeys.length; f++) {
            var feld = felderKeys[f];
            if (feld === 'spezifisch') continue;
            objektText = ersetzeFeldImObjekt(objektText, feld, aenderung.felder[feld]);
          }

          modifizierterContent = modifizierterContent.substring(0, fragePos.start) + objektText + modifizierterContent.substring(fragePos.end);

          // Hash aus dem VOLLSTÄNDIGEN aktualisierten Frage-Objekt berechnen
          var aktualisiertePos = findeFrageImJS(modifizierterContent, aenderung.poolFrageId);
          var volleFelder = aktualisiertePos ? extrahiereFrageFelder(aktualisiertePos.text) : aenderung.felder;
          neueHashes[aenderung.poolFrageId] = berechnePoolContentHash(volleFelder);
          aktualisiert++;

        } else if (aenderung.typ === 'export') {
          // Neue Frage am Ende des QUESTIONS-Arrays einfügen
          var felder = aenderung.felder;

          var neueId = felder.id || generiereNeueFrageId(modifizierterContent, felder.topic || 'x');
          felder.id = neueId;

          var neueFrageStr = serialisiereNeuePoolFrage(felder);

          // Vor dem letzten ]; einfügen
          var arrayEndPattern = /\n\s*\];?\s*$/;
          var arrayEndMatch = modifizierterContent.match(arrayEndPattern);
          if (!arrayEndMatch) {
            fehler.push('QUESTIONS-Array-Ende nicht gefunden');
            continue;
          }

          var insertPos = modifizierterContent.length - arrayEndMatch[0].length;
          var vorInsert = modifizierterContent.substring(0, insertPos).trimEnd();
          var brauchtKomma = !vorInsert.endsWith(',') && !vorInsert.endsWith('[');

          modifizierterContent = vorInsert + (brauchtKomma ? ',' : '') + '\n' + neueFrageStr + arrayEndMatch[0];

          neueHashes[neueId] = berechnePoolContentHash(felder);
          exportierteIds[aenderung.poolFrageId || 'new'] = neueId;
          exportiert++;
        }
      } catch (e) {
        fehler.push((aenderung.poolFrageId || 'export') + ': ' + e.message);
      }
    }

    if (aktualisiert === 0 && exportiert === 0) {
      return jsonResponse({ erfolg: false, fehler: fehler.length ? fehler : ['Keine Änderungen angewendet'] });
    }

    // 2. Commit via GitHub API
    var message = 'Pool-Sync: ' + poolDatei.replace('.js', '') + ' — ' +
      (aktualisiert > 0 ? aktualisiert + ' aktualisiert' : '') +
      (aktualisiert > 0 && exportiert > 0 ? ', ' : '') +
      (exportiert > 0 ? exportiert + ' neu' : '');

    var result = githubPutFile(pfad, modifizierterContent, sha, message);

    return jsonResponse({
      erfolg: true,
      aktualisiert: aktualisiert,
      exportiert: exportiert,
      commitSha: result.content.sha,
      neueHashes: neueHashes,
      exportierteIds: exportierteIds,
      fehler: fehler
    });

  } catch (e) {
    if (e.message && e.message.indexOf('409') >= 0) {
      return jsonResponse({ erfolg: false, fehler: ['Pool wurde extern geändert. Bitte zuerst Pool-Sync (vorwärts) durchführen.'] });
    }
    return jsonResponse({ erfolg: false, fehler: [e.message || 'Unbekannter Fehler'] });
  }
}

function serialisiereNeuePoolFrage(felder) {
  var lines = [];
  lines.push('  {id: "' + felder.id + '", topic: "' + (felder.topic || '') + '", type: "' + (felder.type || 'mc') + '", diff: ' + (felder.diff || 2) + ', tax: "' + (felder.tax || 'K2') + '", reviewed: ' + (felder.reviewed || false) + ',');
  lines.push('    q: ' + JSON.stringify(felder.q || '') + ',');

  if (felder.options) {
    lines.push('    options: [');
    felder.options.forEach(function(o, i) {
      var comma = i < felder.options.length - 1 ? ',' : '';
      lines.push('      {v: "' + o.v + '", t: ' + JSON.stringify(o.t) + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.correct !== undefined) {
    if (Array.isArray(felder.correct)) {
      lines.push('    correct: [' + felder.correct.map(function(c) { return '"' + c + '"'; }).join(', ') + '],');
    } else if (typeof felder.correct === 'boolean') {
      lines.push('    correct: ' + felder.correct + ',');
    } else {
      lines.push('    correct: "' + felder.correct + '",');
    }
  }

  if (felder.blanks) {
    lines.push('    blanks: [');
    felder.blanks.forEach(function(b, i) {
      var alts = b.alts && b.alts.length ? ', alts: [' + b.alts.map(function(a) { return JSON.stringify(a); }).join(', ') + ']' : '';
      var comma = i < felder.blanks.length - 1 ? ',' : '';
      lines.push('      {answer: ' + JSON.stringify(b.answer) + alts + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.rows) {
    lines.push('    rows: [');
    felder.rows.forEach(function(r, i) {
      var unit = r.unit ? ', unit: "' + r.unit + '"' : '';
      var comma = i < felder.rows.length - 1 ? ',' : '';
      lines.push('      {label: ' + JSON.stringify(r.label) + ', answer: ' + r.answer + ', tolerance: ' + r.tolerance + unit + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.categories) {
    lines.push('    categories: [' + felder.categories.map(function(c) { return JSON.stringify(c); }).join(', ') + '],');
  }

  if (felder.items) {
    lines.push('    items: [');
    felder.items.forEach(function(item, i) {
      var comma = i < felder.items.length - 1 ? ',' : '';
      lines.push('      {t: ' + JSON.stringify(item.t) + ', cat: ' + item.cat + '}' + comma);
    });
    lines.push('    ],');
  }

  if (felder.sample) lines.push('    sample: ' + JSON.stringify(felder.sample) + ',');
  if (felder.explain) lines.push('    explain: ' + JSON.stringify(felder.explain));

  // Letztes Komma entfernen
  var last = lines[lines.length - 1];
  if (last.endsWith(',')) lines[lines.length - 1] = last.slice(0, -1);

  lines.push('  }');
  return lines.join('\n');
}

// ==========================================
// Prüfungstracker — Aggregierte Übersicht
// ==========================================

/**
 * Lädt aggregierte Tracker-Daten für alle Prüfungen einer LP.
 * Pro Prüfung: Teilnahme-Counts, Korrektur-Status, Noten-Durchschnitt.
 * Performance: Nur beendete Prüfungen werden tief gelesen (Antworten/Korrektur-Sheets).
 */
function ladeTrackerDatenEndpoint(body) {
  try {
    var email = body.email;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    // 1. Alle Configs laden
    var configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    var rows = getSheetData(configSheet);
    var masterSS = ANTWORTEN_MASTER_ID ? SpreadsheetApp.openById(ANTWORTEN_MASTER_ID) : null;

    var pruefungen = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var pruefungId = row.id;
      if (!pruefungId) continue;

      var teilnehmer = safeJsonParse(row.teilnehmer, []);
      var beendetUm = row.beendetUm || null;
      var freigeschaltet = row.freigeschaltet === 'true';

      var summary = {
        pruefungId: pruefungId,
        titel: row.titel || pruefungId,
        klasse: row.klasse || '',
        gefaess: row.gefaess || '',
        fachbereiche: (row.fachbereiche || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
        semester: row.semester || '',
        datum: row.datum || '',
        typ: row.typ || 'summativ',
        gesamtpunkte: Number(row.gesamtpunkte) || 0,
        freigeschaltet: freigeschaltet,
        beendetUm: beendetUm,
        teilnehmerGesamt: teilnehmer.length,
        eingereicht: 0,
        nichtErschienen: [],
        korrekturStatus: 'keine-daten',
        korrigiertAnzahl: 0,
        korrigiertGesamt: 0,
        durchschnittNote: null,
        bestandenRate: null,
        fragenStats: {}
      };

      // 2. Nur für beendete Prüfungen: Antworten-Sheet lesen
      if (beendetUm && teilnehmer.length > 0) {
        try {
          var antwortenSheet = masterSS ? masterSS.getSheetByName('Antworten_' + pruefungId) : null;
          if (antwortenSheet) {
            var antwortenData = getSheetData(antwortenSheet);

            // Emails die abgegeben haben
            var abgegebeneEmails = {};
            for (var j = 0; j < antwortenData.length; j++) {
              var aRow = antwortenData[j];
              if (aRow.email && aRow.istAbgabe === 'true') {
                abgegebeneEmails[aRow.email.toLowerCase()] = true;
              }
            }
            summary.eingereicht = Object.keys(abgegebeneEmails).length;

            // Fehlende SuS ermitteln
            var fehlende = [];
            for (var k = 0; k < teilnehmer.length; k++) {
              var tn = teilnehmer[k];
              if (!abgegebeneEmails[tn.email.toLowerCase()]) {
                fehlende.push({
                  email: tn.email,
                  name: (tn.vorname || '') + ' ' + (tn.name || ''),
                  klasse: tn.klasse || ''
                });
              }
            }
            summary.nichtErschienen = fehlende;
          }
        } catch (e) {
          // Antworten-Sheet nicht gefunden — normal für alte Prüfungen
        }
      }

      // 3. Korrektur-Sheet lesen (nur wenn beendet)
      if (beendetUm) {
        try {
          var korrekturSheet = masterSS ? masterSS.getSheetByName('Korrektur_' + pruefungId) : null;
          if (korrekturSheet) {

            // Status aus Z1 lesen
            var statusZelle = korrekturSheet.getRange('Z1').getValue();
            var statusObj = safeJsonParse(statusZelle, {});

            if (statusObj.status === 'fertig') {
              summary.korrekturStatus = 'fertig';
            } else if (statusObj.status === 'laeuft') {
              summary.korrekturStatus = 'teilweise';
            } else {
              summary.korrekturStatus = 'offen';
            }

            // Korrektur-Daten lesen für Noten-Berechnung
            var korrekturData = getSheetData(korrekturSheet);
            if (korrekturData.length > 0) {
              var korrigiertSet = {};
              var notenSumme = 0;
              var notenAnzahl = 0;
              var bestandenCount = 0;

              for (var m = 0; m < korrekturData.length; m++) {
                var kRow = korrekturData[m];
                if (!kRow.email) continue;
                korrigiertSet[kRow.email] = true;

                // Note berechnen wenn Punkte vorhanden
                var punkte = Number(kRow.gesamtPunkte || kRow.lpPunkte || kRow.kiPunkte || 0);
                var maxPkt = Number(kRow.maxPunkte || summary.gesamtpunkte || 1);
                if (maxPkt > 0 && punkte >= 0) {
                  var note = 1 + 5 * (punkte / maxPkt);
                  note = Math.min(6, Math.max(1, note));
                  // Auf 0.5 runden
                  note = Math.round(note * 2) / 2;
                  notenSumme += note;
                  notenAnzahl++;
                  if (note >= 4) bestandenCount++;
                }
              }

              summary.korrigiertAnzahl = Object.keys(korrigiertSet).length;
              summary.korrigiertGesamt = summary.teilnehmerGesamt || summary.korrigiertAnzahl;

              if (summary.korrigiertAnzahl > 0 && summary.korrigiertGesamt > 0) {
                if (summary.korrigiertAnzahl >= summary.korrigiertGesamt) {
                  summary.korrekturStatus = 'fertig';
                } else if (summary.korrekturStatus === 'keine-daten') {
                  summary.korrekturStatus = 'teilweise';
                }
              }

              if (notenAnzahl > 0) {
                summary.durchschnittNote = Math.round((notenSumme / notenAnzahl) * 10) / 10;
                summary.bestandenRate = Math.round((bestandenCount / notenAnzahl) * 100);
              }

              // Per-Frage-Stats aus Korrektur-Daten berechnen
              // Korrektur-Zeilen haben Spalten: frageId, maxPunkte, kiPunkte, lpPunkte
              // Gruppiere nach frageId und berechne Lösungsquote
              var fragenAgg = {};
              for (var fs = 0; fs < korrekturData.length; fs++) {
                var fsRow = korrekturData[fs];
                var fId = fsRow.frageId;
                if (!fId) continue;
                var fPunkte = Number(fsRow.lpPunkte || fsRow.kiPunkte || 0);
                var fMax = Number(fsRow.maxPunkte || 1);
                if (!fragenAgg[fId]) {
                  fragenAgg[fId] = { sumPunkte: 0, maxPunkte: fMax, n: 0 };
                }
                fragenAgg[fId].sumPunkte += fPunkte;
                fragenAgg[fId].n++;
              }
              // Trennschärfe: Punkt-biseriale Korrelation (Part-Whole) pro Frage
              // Schritt 1: Gesamtpunkte pro SuS berechnen
              var susScores = {}; // email → {gesamt, fragen: {frageId: punkte}}
              for (var fs2 = 0; fs2 < korrekturData.length; fs2++) {
                var r2 = korrekturData[fs2];
                if (!r2.frageId || !r2.email) continue;
                if (!susScores[r2.email]) susScores[r2.email] = { gesamt: 0, fragen: {} };
                var p2 = Number(r2.lpPunkte || r2.kiPunkte || 0);
                susScores[r2.email].fragen[r2.frageId] = p2;
                susScores[r2.email].gesamt += p2;
              }
              var susEmails = Object.keys(susScores);

              var fragenStatsObj = {};
              for (var fKey in fragenAgg) {
                var fa = fragenAgg[fKey];
                var avgP = fa.n > 0 ? fa.sumPunkte / fa.n : 0;
                var stat = {
                  loesungsquote: fa.maxPunkte > 0 ? Math.round((avgP / fa.maxPunkte) * 100) : 0,
                  durchschnittPunkte: Math.round(avgP * 10) / 10,
                  maxPunkte: fa.maxPunkte,
                  n: fa.n,
                  trennschaerfe: null
                };
                // Trennschärfe nur bei >= 5 SuS berechnen
                if (susEmails.length >= 5) {
                  var paare = [];
                  for (var se = 0; se < susEmails.length; se++) {
                    var sd = susScores[susEmails[se]];
                    if (sd.fragen[fKey] === undefined) continue;
                    paare.push({ x: sd.fragen[fKey], y: sd.gesamt - sd.fragen[fKey] });
                  }
                  if (paare.length >= 5) {
                    var n_ = paare.length, sX = 0, sY = 0, sXY = 0, sX2 = 0, sY2 = 0;
                    for (var pi = 0; pi < n_; pi++) {
                      sX += paare[pi].x; sY += paare[pi].y;
                      sXY += paare[pi].x * paare[pi].y;
                      sX2 += paare[pi].x * paare[pi].x; sY2 += paare[pi].y * paare[pi].y;
                    }
                    var denom = Math.sqrt((n_ * sX2 - sX * sX) * (n_ * sY2 - sY * sY));
                    if (denom > 0) {
                      stat.trennschaerfe = Math.round(((n_ * sXY - sX * sY) / denom) * 100) / 100;
                    }
                  }
                }
                fragenStatsObj[fKey] = stat;
              }
              summary.fragenStats = fragenStatsObj;
            }
          }
        } catch (e) {
          // Korrektur-Sheet nicht gefunden — normal
        }
      }

      pruefungen.push(summary);
    }

    // 4. Noten-Stand: Beurteilungsregeln aus Lehrplan-Sheet laden
    var notenStand = [];
    try {
      var lehrplanSS = SpreadsheetApp.openById(LEHRPLAN_SHEET_ID);
      var regelSheet = lehrplanSS.getSheetByName('Beurteilungsregeln');
      if (regelSheet) {
        var regelData = getSheetData(regelSheet);
        for (var r = 0; r < regelData.length; r++) {
          var regel = regelData[r];
          if (!regel.gefaess || !regel.semester) continue;
          var minNoten = Number(regel.minNoten) || 0;

          // Zähle summative Prüfungen mit Noten für dieses Gefäss+Semester
          var vorhandene = 0;
          for (var p = 0; p < pruefungen.length; p++) {
            var pr = pruefungen[p];
            if (pr.gefaess === regel.gefaess && pr.semester === regel.semester &&
                pr.typ === 'summativ' && pr.durchschnittNote !== null) {
              vorhandene++;
            }
          }

          var diff = vorhandene - minNoten;
          var status = diff >= 0 ? 'ok' : (diff === -1 ? 'warning' : 'critical');

          notenStand.push({
            kursId: (regel.gefaess + '-' + regel.semester).toLowerCase(),
            kurs: regel.gefaess + ' ' + regel.semester,
            gefaess: regel.gefaess,
            semester: regel.semester,
            vorhandeneNoten: vorhandene,
            erforderlicheNoten: minNoten,
            status: status,
            naechsterTermin: regel.bemerkung || ''
          });
        }
      }
    } catch (e) {
      // Lehrplan-Sheet existiert noch nicht oder Beurteilungsregeln-Tab fehlt — ignorieren
    }

    return jsonResponse({
      pruefungen: pruefungen,
      notenStand: notenStand,
      aktualisiert: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// autorisiereBerechtigungen entfernt — DriveApp-Write-Permissions nicht mehr nötig
