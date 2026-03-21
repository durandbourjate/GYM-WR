// ============================================================
// PRÜFUNGSPLATTFORM WR — GOOGLE APPS SCRIPT (KOMPLETT)
// Gymnasium Hofwil — Stand 18.03.2026
// ============================================================
// Diesen gesamten Code im Apps Script Editor als Code.gs einfügen.
// Danach: Bereitstellen → Bereitstellungen verwalten → Neue Version → Bereitstellen
// ============================================================

// === KONFIGURATION ===
const FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs';
const KLASSENLISTEN_ID = '1tCLVobfVPXIu52aP_xsziCLKuVfZ7cNwp77g1yKCtCM';
const CONFIGS_ID = '1QpcC44Ly7BUTLgUkVQtdqjTUDXmgdWdVD8ajjzsd7tE';
const ANTWORTEN_ORDNER_ID = '1PAF1SUnR7nQ175muXn4iQERdQLJ-UnQQ';
const ANHAENGE_ORDNER_ID = '1Ql4XuKmxyNW9ZIGsn4getcaB4FhLbjtm';       // LP-Anhänge bei Fragen (Bilder, PDFs)
const MATERIALIEN_ORDNER_ID = '1yBqm-9iKOcp8QptnISmwKaZGbR63mF5V';    // LP-Materialien bei Prüfungen (Gesetze etc.)
const SUS_UPLOADS_ORDNER_ID = '1pQdSujvdzTp5MAbBdJU3ipiaG3zstyu8';     // SuS-Uploads während Prüfung (im Antworten-Ordner)
const LP_DOMAIN = 'gymhofwil.ch';
const SUS_DOMAIN = 'stud.gymhofwil.ch';
const LERNZIELE_TAB = 'Lernziele';

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
    case 'ladeNachrichten':
      return ladeNachrichtenEndpoint(e.parameter.id, email);
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
    case 'ladeLernziele':
      return ladeLernziele(body);
    case 'schreibePoolAenderung':
      return schreibePoolAenderung(body);
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

function findOrCreateAntwortenSheet(sheetName, pruefungId) {
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next()).getSheets()[0];
  }

  const ss = SpreadsheetApp.create(sheetName);
  const sheet = ss.getSheets()[0];
  const headers = ['email', 'name', 'version', 'antworten', 'letzterSave', 'istAbgabe', 'letzterHeartbeat', 'heartbeats'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  const file = DriveApp.getFileById(ss.getId());
  ordner.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return sheet;
}

function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0].map(h => String(h).trim());
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
  } catch {
    return fallback;
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
    if (!istLP) {
      const klassenSheet = SpreadsheetApp.openById(KLASSENLISTEN_ID).getSheetByName(configRow.erlaubteKlasse);
      if (!klassenSheet) {
        return jsonResponse({ error: 'Klassenliste nicht gefunden' });
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
      fachbereiche: [],
      datum: configRow.datum,
      typ: configRow.typ,
      modus: configRow.modus,
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
    default:
      return { ...base, typ: row.typ, fragetext: row.fragetext || '' };
  }
}

// === ANTWORTEN SPEICHERN ===

function speichereAntworten(body) {
  try {
    const { pruefungId, email, antworten, version, istAbgabe } = body;
    if (!pruefungId || !email || !antworten) {
      return jsonResponse({ error: 'Fehlende Daten' });
    }

    const sheetName = 'Antworten_' + pruefungId;
    let sheet = findOrCreateAntwortenSheet(sheetName, pruefungId);
    const data = getSheetData(sheet);
    const existingRow = data.findIndex(row => row.email === email);

    const rowData = {
      email: email,
      version: version,
      antworten: JSON.stringify(antworten),
      letzterSave: new Date().toISOString(),
      istAbgabe: istAbgabe ? 'true' : 'false',
    };

    if (existingRow >= 0) {
      const altVersion = Number(data[existingRow].version) || 0;
      if (version <= altVersion && !istAbgabe) {
        return jsonResponse({ success: true, message: 'Version nicht neuer' });
      }
      const rowIndex = existingRow + 2;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
    const sheetName = 'Antworten_' + pruefungId;
    const sheet = findOrCreateAntwortenSheet(sheetName, pruefungId);
    const data = getSheetData(sheet);
    const existingRow = data.findIndex(row => row.email === email);

    if (existingRow >= 0) {
      const rowIndex = existingRow + 2;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const heartbeatCol = headers.indexOf('letzterHeartbeat');
      const countCol = headers.indexOf('heartbeats');
      if (heartbeatCol >= 0) {
        sheet.getRange(rowIndex, heartbeatCol + 1).setValue(timestamp);
      }
      if (countCol >= 0) {
        const current = Number(sheet.getRange(rowIndex, countCol + 1).getValue()) || 0;
        sheet.getRange(rowIndex, countCol + 1).setValue(current + 1);
      }
    }

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
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

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
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
      fragetext: frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || '',
      quelle: frage.quelle || 'manuell',
      anhaenge: JSON.stringify(frage.anhaenge || []),
      typDaten: JSON.stringify(getTypDaten(frage)),
      autor: frage.autor || email,
      geteilt: frage.geteilt || 'privat',
      geteiltVon: frage.geteiltVon || '',
    };

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
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];

    const rowData = {
      id: config.id,
      titel: config.titel,
      klasse: config.klasse || '',
      gefaess: config.gefaess || 'SF',
      semester: config.semester || '',
      fachbereiche: (config.fachbereiche || []).join(','),
      datum: config.datum || '',
      typ: config.typ || 'summativ',
      modus: config.modus || 'pruefung',
      dauerMinuten: String(config.dauerMinuten || 45),
      gesamtpunkte: String(config.gesamtpunkte || 0),
      erlaubteKlasse: config.erlaubteKlasse || config.klasse || '',
      sebErforderlich: config.sebErforderlich ? 'true' : 'false',
      abschnitte: JSON.stringify(config.abschnitte || []),
      zeitanzeigeTyp: config.zeitanzeigeTyp || 'countdown',
      ruecknavigation: config.ruecknavigation !== false ? 'true' : 'false',
      zufallsreihenfolgeFragen: config.zufallsreihenfolgeFragen ? 'true' : 'false',
      autoSaveIntervallSekunden: String(config.autoSaveIntervallSekunden || 30),
      heartbeatIntervallSekunden: String(config.heartbeatIntervallSekunden || 10),
      freigeschaltet: config.freigeschaltet ? 'true' : 'false',
      zeitverlaengerungen: JSON.stringify(config.zeitverlaengerungen || {}),
    };

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

    const sheetName = 'Antworten_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);
    const schueler = [];

    if (files.hasNext()) {
      const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
      const data = getSheetData(sheet);
      for (const row of data) {
        schueler.push({
          email: row.email || '',
          name: row.name || row.email || '',
          status: row.istAbgabe === 'true' ? 'abgegeben' : (row.letzterHeartbeat ? 'aktiv' : 'nicht-gestartet'),
          letzterSave: row.letzterSave || '',
          letzterHeartbeat: row.letzterHeartbeat || '',
          heartbeats: Number(row.heartbeats) || 0,
          version: Number(row.version) || 0,
          istAbgegeben: row.istAbgabe === 'true',
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
            fragetext: frage.fragetext || frage.geschaeftsfall || frage.aufgabentext || '',
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

function ladeLernziele(body) {
  try {
    var email = body.email;
    var fachFilter = body.fach || '';

    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

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

  const sheetName = 'Antworten_' + pruefungId;
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);
  if (!files.hasNext()) {
    setKorrekturStatus(korrekturSheet, 'fehler', 0, 0);
    return;
  }

  const antwortenSheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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
          lpKommentar: '', quelle: autoBewertung.quelle, geprueft: 'false', status: 'ki-bewertet',
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

  const headers = ['email', 'name', 'frageId', 'fragenTyp', 'maxPunkte', 'kiPunkte', 'lpPunkte', 'kiBegruendung', 'kiFeedback', 'lpKommentar', 'quelle', 'geprueft', 'status'];
  korrekturSheet.clear();
  korrekturSheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

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

function findOrCreateKorrekturSheet(pruefungId) {
  const sheetName = 'Korrektur_' + pruefungId;
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next()).getSheets()[0];
  }

  const ss = SpreadsheetApp.create(sheetName);
  const sheet = ss.getSheets()[0];
  const file = DriveApp.getFileById(ss.getId());
  ordner.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return sheet;
}

function setKorrekturStatus(sheet, status, erledigt, gesamt) {
  sheet.getRange('Z1').setValue(JSON.stringify({ status, erledigt, gesamt, timestamp: new Date().toISOString() }));
}

function ladeKorrektur(pruefungId, email) {
  try {
    if (!email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const sheetName = 'Korrektur_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);

    if (!files.hasNext()) {
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

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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

    const sheetName = 'Antworten_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);
    if (!files.hasNext()) return jsonResponse({ abgaben: {} });

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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

    const sheetName = 'Korrektur_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);
    if (!files.hasNext()) return jsonResponse({ status: 'idle', fortschritt: { erledigt: 0, gesamt: 0 } });

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
    const statusJson = safeJsonParse(sheet.getRange('Z1').getValue(), { status: 'idle', erledigt: 0, gesamt: 0 });

    return jsonResponse({
      status: statusJson.status,
      fortschritt: { erledigt: statusJson.erledigt || 0, gesamt: statusJson.gesamt || 0 },
    });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

function speichereKorrekturZeile(body) {
  try {
    const { email, pruefungId, schuelerEmail, frageId } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const sheetName = 'Korrektur_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);
    if (!files.hasNext()) return jsonResponse({ error: 'Korrektur-Sheet nicht gefunden' });

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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

    const sheetName = 'Korrektur_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);
    if (!files.hasNext()) return jsonResponse({ error: 'Korrektur nicht gefunden' });

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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

    const klassenlisten = SpreadsheetApp.openById(KLASSENLISTEN_ID);
    const sheets = klassenlisten.getSheets();

    for (const sheet of sheets) {
      const data = getSheetData(sheet);
      const eintrag = data.find(r => r.email === email && String(r.schuelerCode) === String(code));
      if (eintrag) {
        return jsonResponse({
          success: true,
          name: eintrag.name || '',
          vorname: eintrag.vorname || '',
          klasse: eintrag.klasse || sheet.getName(),
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
 * Speichert Nachrichten in einem eigenen Sheet pro Prüfung.
 */
function findOrCreateNachrichtenSheet(pruefungId) {
  const sheetName = 'Nachrichten_' + pruefungId;
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next()).getSheets()[0];
  }

  const ss = SpreadsheetApp.create(sheetName);
  const sheet = ss.getSheets()[0];
  const headers = ['id', 'von', 'an', 'text', 'zeitpunkt', 'gelesen'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  const file = DriveApp.getFileById(ss.getId());
  ordner.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return sheet;
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

    const sheetName = 'Nachrichten_' + pruefungId;
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const files = ordner.getFilesByName(sheetName);

    // Kein Nachrichten-Sheet vorhanden → leeres Array
    if (!files.hasNext()) {
      return jsonResponse({ nachrichten: [] });
    }

    const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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
    const { email, pruefungId, freigegeben } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];

    const rowIndex = data.findIndex(r => r.id === pruefungId);
    if (rowIndex < 0) return jsonResponse({ error: 'Prüfung nicht gefunden' });

    // korrekturFreigegeben-Spalte suchen oder anlegen
    let col = headers.indexOf('korrekturFreigegeben');
    if (col < 0) {
      col = headers.length;
      configSheet.getRange(1, col + 1).setValue('korrekturFreigegeben');
    }
    configSheet.getRange(rowIndex + 2, col + 1).setValue(freigegeben ? 'true' : 'false');

    return jsonResponse({ success: true });
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
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);

    const ergebnis = [];
    for (const configRow of configs) {
      if (configRow.korrekturFreigegeben !== 'true') continue;

      const pruefungId = configRow.id;
      const sheetName = 'Korrektur_' + pruefungId;
      const files = ordner.getFilesByName(sheetName);
      if (!files.hasNext()) continue;

      const sheet = SpreadsheetApp.open(files.next()).getSheets()[0];
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
    const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
    const korrekturFiles = ordner.getFilesByName('Korrektur_' + pruefungId);
    if (!korrekturFiles.hasNext()) return jsonResponse({ error: 'Korrektur nicht gefunden' });

    const korrekturSheet = SpreadsheetApp.open(korrekturFiles.next()).getSheets()[0];
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
    const antwortFiles = ordner.getFilesByName('Antworten_' + pruefungId);
    const antworten = {};
    if (antwortFiles.hasNext()) {
      const antwortSheet = SpreadsheetApp.open(antwortFiles.next()).getSheets()[0];
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
