// ============================================================
// LERNPLATTFORM — GOOGLE APPS SCRIPT BACKEND
// Gymnasium Hofwil — Stand 03.04.2026
// ============================================================
// Separates Apps Script Projekt (NICHT im Prüfungstool-Script!)
// Diesen Code als Code.gs einfügen.
// Bereitstellen → Web-App → Zugriff: Alle (auch anonym)
// ============================================================

// === KONFIGURATION ===
const GRUPPEN_REGISTRY_ID = '1VH7Vu7JIKYLic2-wK2uSa2nXA7WVvStKOjUDi9cpWnI';
const FRAGENBANK_ID = '1ASSRv7mSpmyD22PAMUJ8iekHwuamYkHpy9E6yxWNIVs'; // Shared mit Prüfungstool
const LP_DOMAIN = 'gymhofwil.ch';
const SUS_DOMAIN = 'stud.gymhofwil.ch';
const FRAGENBANK_TABS = ['VWL', 'BWL', 'Recht', 'Informatik'];

// === HELPER: JSON-Response ===

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// === SESSION-TOKENS (CacheService, 3h TTL) ===

function generiereSessionToken_(email) {
  var token = Utilities.getUuid();
  var cache = CacheService.getScriptCache();
  var daten = JSON.stringify({
    email: email.toLowerCase(),
    ts: new Date().toISOString()
  });
  cache.put('lp_session_' + token, daten, 10800); // 3h
  return token;
}

function validiereSessionToken_(token, email) {
  if (!token || !email) return false;
  var cache = CacheService.getScriptCache();
  var raw = cache.get('lp_session_' + token);
  if (!raw) return false;
  try {
    var daten = JSON.parse(raw);
    return daten.email === email.toLowerCase();
  } catch (e) {
    return false;
  }
}

// === RATE LIMITING ===

function rateLimitCheck_(aktion, key, maxProFenster, fensterSekunden) {
  if (!key) return { blocked: false };
  var cache = CacheService.getScriptCache();
  var cacheKey = 'lp_rl_' + aktion + '_' + key.toLowerCase();
  var count = Number(cache.get(cacheKey)) || 0;
  if (count >= maxProFenster) {
    return { blocked: true, error: 'Zu viele Anfragen. Bitte warten.' };
  }
  cache.put(cacheKey, String(count + 1), fensterSekunden);
  return { blocked: false };
}

// === GRUPPEN-REGISTRY ===

function getGruppenRegistry_() {
  if (!GRUPPEN_REGISTRY_ID) return null;
  return SpreadsheetApp.openById(GRUPPEN_REGISTRY_ID).getSheetByName('Gruppen');
}

function alleGruppenLaden_() {
  var sheet = getGruppenRegistry_();
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var result = [];
  for (var i = 1; i < data.length; i++) {
    result.push({
      id: String(data[i][headers.indexOf('id')] || ''),
      name: String(data[i][headers.indexOf('name')] || ''),
      typ: String(data[i][headers.indexOf('typ')] || ''),
      adminEmail: String(data[i][headers.indexOf('adminemail')] || ''),
      fragebankSheetId: String(data[i][headers.indexOf('fragenbanksheetid')] || ''),
      analytikSheetId: String(data[i][headers.indexOf('analytiksheetid')] || ''),
    });
  }
  return result;
}

// === doPost — Zentraler Request-Dispatcher ===

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var action = body.action;

  // Rate Limiting für Auth-Aktionen
  if (action === 'lernplattformCodeLogin') {
    var rl = rateLimitCheck_('codeLogin', body.code || 'anon', 10, 300);
    if (rl.blocked) return jsonResponse({ success: false, error: rl.error });
  }

  switch (action) {

    // === AUTH ===

    case 'lernplattformLogin':
      return lernplattformLogin(body);

    case 'lernplattformValidiereToken':
      return lernplattformValidiereToken(body);

    case 'lernplattformCodeLogin':
      return lernplattformCodeLogin(body);

    case 'lernplattformGeneriereCode':
      return lernplattformGeneriereCode(body);

    // === GRUPPEN ===

    case 'lernplattformLadeGruppen':
      return lernplattformLadeGruppen(body);

    case 'lernplattformErstelleGruppe':
      return lernplattformErstelleGruppe(body);

    // === MITGLIEDER ===

    case 'lernplattformLadeMitglieder':
      return lernplattformLadeMitglieder(body);

    case 'lernplattformEinladen':
      return lernplattformEinladen(body);

    case 'lernplattformEntfernen':
      return lernplattformEntfernen(body);

    // === FRAGEN ===

    case 'lernplattformLadeFragen':
      return lernplattformLadeFragen(body);

    case 'lernplattformSpeichereFrage':
      return lernplattformSpeichereFrage(body);

    // === FORTSCHRITT ===

    case 'lernplattformSpeichereFortschritt':
      return lernplattformSpeichereFortschritt(body);

    case 'lernplattformLadeFortschritt':
      return lernplattformLadeFortschritt(body);

    // === AUFTRÄGE ===

    case 'lernplattformLadeAuftraege':
      return lernplattformLadeAuftraege(body);

    case 'lernplattformSpeichereAuftrag':
      return lernplattformSpeichereAuftrag(body);

    // === EINSTELLUNGEN ===

    case 'lernplattformLadeEinstellungen':
      return lernplattformLadeEinstellungen(body);

    case 'lernplattformSpeichereEinstellungen':
      return lernplattformSpeichereEinstellungen(body);

    default:
      return jsonResponse({ success: false, error: 'Unbekannte Aktion: ' + action });
  }
}

// === doGet (für einfache Gesundheitschecks) ===

function doGet() {
  return jsonResponse({ status: 'ok', app: 'lernplattform', version: '1.0' });
}

// ============================================================
// AUTH ENDPOINTS
// ============================================================

/**
 * Login mit Google OAuth E-Mail.
 * Generiert Session-Token, gibt Gruppen zurück.
 */
function lernplattformLogin(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!email) return jsonResponse({ success: false, error: 'E-Mail fehlt' });

  var token = generiereSessionToken_(email);

  // Gruppen für diese E-Mail laden
  var gruppen = alleGruppenLaden_().filter(function(g) {
    return g.adminEmail === email;
  });

  // Auch Gruppen laden wo E-Mail als Mitglied eingetragen ist
  var alleMitgliedGruppen = alleGruppenLaden_().filter(function(g) {
    if (g.adminEmail === email) return false; // Bereits oben
    // Mitglieder-Tab prüfen
    try {
      var ss = SpreadsheetApp.openById(g.fragebankSheetId);
      var mitgliederSheet = ss.getSheetByName('Mitglieder');
      if (!mitgliederSheet) return false;
      var daten = mitgliederSheet.getDataRange().getValues();
      return daten.some(function(row) {
        return String(row[0]).toLowerCase().trim() === email;
      });
    } catch (e) { return false; }
  });

  return jsonResponse({
    success: true,
    data: {
      sessionToken: token,
      gruppen: gruppen.concat(alleMitgliedGruppen)
    }
  });
}

/**
 * Session-Token validieren.
 */
function lernplattformValidiereToken(body) {
  var gueltig = validiereSessionToken_(body.sessionToken, body.email);
  return jsonResponse({ success: gueltig });
}

/**
 * Login mit 6-stelligem Code (für Kinder ohne E-Mail).
 */
function lernplattformCodeLogin(body) {
  var code = String(body.code || '').trim().toUpperCase();
  if (!code || code.length < 4) {
    return jsonResponse({ success: false, error: 'Ungültiger Code' });
  }

  // Alle Gruppen durchsuchen
  var gruppen = alleGruppenLaden_();
  for (var i = 0; i < gruppen.length; i++) {
    var g = gruppen[i];
    try {
      var ss = SpreadsheetApp.openById(g.fragebankSheetId);
      var mitgliederSheet = ss.getSheetByName('Mitglieder');
      if (!mitgliederSheet) continue;

      var daten = mitgliederSheet.getDataRange().getValues();
      var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
      var emailIdx = headers.indexOf('email');
      var nameIdx = headers.indexOf('name');
      var codeIdx = headers.indexOf('code');

      for (var j = 1; j < daten.length; j++) {
        if (String(daten[j][codeIdx]).trim().toUpperCase() === code) {
          var email = String(daten[j][emailIdx]).toLowerCase().trim();
          var name = String(daten[j][nameIdx]).trim();
          var token = generiereSessionToken_(email || 'code_' + code);

          return jsonResponse({
            success: true,
            data: {
              email: email || 'code_' + code,
              name: name,
              sessionToken: token,
              gruppeId: g.id,
              gruppeName: g.name
            }
          });
        }
      }
    } catch (e) { /* Gruppe nicht zugreifbar */ }
  }

  return jsonResponse({ success: false, error: 'Code nicht gefunden' });
}

/**
 * Code generieren für ein Mitglied (Admin-Aktion).
 */
function lernplattformGeneriereCode(body) {
  var gruppeId = body.gruppeId;
  var mitgliedEmail = (body.email || '').toLowerCase().trim();

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var mitgliederSheet = ss.getSheetByName('Mitglieder');
    if (!mitgliederSheet) return jsonResponse({ success: false, error: 'Mitglieder-Tab fehlt' });

    var daten = mitgliederSheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var emailIdx = headers.indexOf('email');
    var codeIdx = headers.indexOf('code');

    // Neuen Code generieren (6 Zeichen, alphanumerisch)
    var neuerCode = '';
    var zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne I, O, 0, 1 (Verwechslung)
    for (var k = 0; k < 6; k++) {
      neuerCode += zeichen.charAt(Math.floor(Math.random() * zeichen.length));
    }

    // Zeile finden und Code setzen
    for (var j = 1; j < daten.length; j++) {
      if (String(daten[j][emailIdx]).toLowerCase().trim() === mitgliedEmail) {
        mitgliederSheet.getRange(j + 1, codeIdx + 1).setValue(neuerCode);
        return jsonResponse({ success: true, data: { code: neuerCode } });
      }
    }

    return jsonResponse({ success: false, error: 'Mitglied nicht gefunden' });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// ============================================================
// GRUPPEN ENDPOINTS
// ============================================================

/**
 * Alle Gruppen laden für eine E-Mail (als Admin oder Mitglied).
 */
function lernplattformLadeGruppen(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!email) return jsonResponse({ success: false, error: 'E-Mail fehlt' });

  var alleGruppen = alleGruppenLaden_();

  // Admin-Gruppen
  var adminGruppen = alleGruppen.filter(function(g) {
    return g.adminEmail === email;
  });

  // Mitglied-Gruppen
  var mitgliedGruppen = alleGruppen.filter(function(g) {
    if (g.adminEmail === email) return false;
    try {
      var ss = SpreadsheetApp.openById(g.fragebankSheetId);
      var sheet = ss.getSheetByName('Mitglieder');
      if (!sheet) return false;
      var daten = sheet.getDataRange().getValues();
      return daten.some(function(row) {
        return String(row[0]).toLowerCase().trim() === email;
      });
    } catch (e) { return false; }
  });

  return jsonResponse({
    success: true,
    data: adminGruppen.concat(mitgliedGruppen)
  });
}

/**
 * Neue Gruppe erstellen (Admin-Aktion).
 * Erstellt automatisch Fragenbank-Sheet + Analytik-Tabs.
 */
function lernplattformErstelleGruppe(body) {
  var name = body.name;
  var typ = body.typ || 'gym'; // gym | familie
  var adminEmail = (body.adminEmail || '').toLowerCase().trim();

  if (!name || !adminEmail) {
    return jsonResponse({ success: false, error: 'Name und Admin-Email nötig' });
  }

  // Gruppen-ID generieren
  var id = name.toLowerCase()
    .replace(/[äàâ]/g, 'ae').replace(/[öòô]/g, 'oe').replace(/[üùû]/g, 'ue')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    .substring(0, 30);

  // Prüfen ob ID bereits existiert
  var bestehend = alleGruppenLaden_();
  if (bestehend.some(function(g) { return g.id === id; })) {
    id = id + '-' + Date.now().toString(36).substring(-4);
  }

  // Fragenbank-Sheet erstellen
  var fragenbankSS = SpreadsheetApp.create('Lernplattform: ' + name);
  var fragenbankId = fragenbankSS.getId();

  // Standard-Tabs erstellen
  var fragenSheet = fragenbankSS.getSheets()[0];
  fragenSheet.setName('Fragen');
  fragenSheet.getRange('A1:T1').setValues([[
    'id', 'fach', 'thema', 'typ', 'schwierigkeit', 'taxonomie',
    'frage', 'erklaerung', 'uebung', 'pruefungstauglich',
    'optionen', 'korrekt', 'aussagen', 'luecken', 'toleranz',
    'einheit', 'kategorien', 'elemente', 'reihenfolge', 'daten'
  ]]);

  var mitgliederSheet = fragenbankSS.insertSheet('Mitglieder');
  mitgliederSheet.getRange('A1:E1').setValues([['email', 'name', 'rolle', 'code', 'beigetreten']]);

  var auftraegeSheet = fragenbankSS.insertSheet('Auftraege');
  auftraegeSheet.getRange('A1:F1').setValues([['id', 'titel', 'fach', 'thema', 'deadline', 'aktiv']]);

  var fortschrittSheet = fragenbankSS.insertSheet('Fortschritt');
  fortschrittSheet.getRange('A1:H1').setValues([[
    'email', 'fragenId', 'versuche', 'richtig', 'richtigInFolge',
    'mastery', 'letzterVersuch', 'sessionIds'
  ]]);

  var sessionSheet = fragenbankSS.insertSheet('Sessions');
  sessionSheet.getRange('A1:F1').setValues([['sessionId', 'email', 'thema', 'fach', 'datum', 'ergebnis']]);

  // In Registry eintragen
  var registrySheet = getGruppenRegistry_();
  if (registrySheet) {
    registrySheet.appendRow([id, name, typ, adminEmail, fragenbankId, '']);
  }

  var neueGruppe = {
    id: id,
    name: name,
    typ: typ,
    adminEmail: adminEmail,
    fragebankSheetId: fragenbankId,
    analytikSheetId: '',
  };

  return jsonResponse({ success: true, data: neueGruppe });
}

// ============================================================
// MITGLIEDER ENDPOINTS
// ============================================================

function lernplattformLadeMitglieder(body) {
  var gruppeId = body.gruppeId;
  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Mitglieder');
    if (!sheet) return jsonResponse({ success: true, data: [] });

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var mitglieder = [];
    for (var i = 1; i < daten.length; i++) {
      mitglieder.push({
        email: String(daten[i][headers.indexOf('email')] || ''),
        name: String(daten[i][headers.indexOf('name')] || ''),
        rolle: String(daten[i][headers.indexOf('rolle')] || 'mitglied'),
        code: String(daten[i][headers.indexOf('code')] || ''),
        beigetreten: String(daten[i][headers.indexOf('beigetreten')] || ''),
      });
    }

    return jsonResponse({ success: true, data: mitglieder });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

function lernplattformEinladen(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();
  var name = body.name || '';

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Mitglieder');
    if (!sheet) return jsonResponse({ success: false, error: 'Mitglieder-Tab fehlt' });

    // Prüfen ob schon eingeladen
    var daten = sheet.getDataRange().getValues();
    var emailIdx = 0; // erste Spalte
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][emailIdx]).toLowerCase().trim() === email) {
        return jsonResponse({ success: false, error: 'Bereits eingeladen' });
      }
    }

    sheet.appendRow([email, name, 'mitglied', '', new Date().toISOString()]);
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

function lernplattformEntfernen(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Mitglieder');
    if (!sheet) return jsonResponse({ success: false, error: 'Mitglieder-Tab fehlt' });

    var daten = sheet.getDataRange().getValues();
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][0]).toLowerCase().trim() === email) {
        sheet.deleteRow(i + 1);
        return jsonResponse({ success: true });
      }
    }

    return jsonResponse({ success: false, error: 'Mitglied nicht gefunden' });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// ============================================================
// FRAGEN ENDPOINT
// ============================================================

/**
 * Fragen laden für eine Gruppe aus dem Fragenbank-Sheet der Gruppe.
 * Header-Zeile = Feldnamen. Werte die mit [ oder { beginnen werden als JSON geparst.
 */
/**
 * Fragen laden aus der GEMEINSAMEN Fragenbank (gleiche Datenquelle wie Prüfungstool).
 * Liest alle Fragen aus FRAGENBANK_ID, Tabs: VWL, BWL, Recht, Informatik.
 * Gibt Fragen im kanonischen shared-Format zurück (fragetext, fachbereich, bloom, typDaten).
 */
function lernplattformLadeFragen(body) {
  // gruppeId wird für Berechtigungsprüfung noch gebraucht, aber Fragen kommen aus der gemeinsamen Fragenbank
  var gruppeId = body.gruppeId;

  // Prüfe ob Gruppe existiert (für Familie-Gruppen → eigenes Sheet)
  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  // Familie-Gruppen: weiterhin eigenes Sheet nutzen (falls vorhanden)
  if (gruppe.typ === 'familie' && gruppe.fragebankSheetId) {
    return lernplattformLadeFragenAusGruppenSheet_(gruppe);
  }

  // Gym-Gruppen: Gemeinsame Fragenbank (wie Prüfungstool)
  try {
    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var alleFragen = [];

    for (var t = 0; t < FRAGENBANK_TABS.length; t++) {
      var tabName = FRAGENBANK_TABS[t];
      var sheet = fragenbank.getSheetByName(tabName);
      if (!sheet) continue;

      var daten = sheet.getDataRange().getValues();
      if (daten.length < 2) continue;

      var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });

      for (var i = 1; i < daten.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          var key = headers[j];
          var val = daten[i][j];
          if (!key || val === '' || val === null || val === undefined) continue;
          row[key] = String(val);
        }
        if (!row.id) continue;

        // Frage im kanonischen Format parsen (wie Prüfungstool parseFrage)
        var frage = parseFrageKanonisch_(row, tabName);
        alleFragen.push(frage);
      }
    }

    return jsonResponse({ success: true, data: alleFragen });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

/** Frage aus einer Sheet-Zeile im kanonischen Format parsen (shared mit Prüfungstool) */
function parseFrageKanonisch_(row, fachbereich) {
  var base = {
    id: row.id,
    version: Number(row.version) || 1,
    erstelltAm: row.erstelltAm || new Date().toISOString(),
    geaendertAm: row.geaendertAm || new Date().toISOString(),
    fachbereich: fachbereich,
    fach: row.fach || fachbereich,
    thema: row.thema || '',
    unterthema: row.unterthema || '',
    semester: (row.semester || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    gefaesse: (row.gefaesse || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    bloom: row.bloom || 'K1',
    tags: (row.tags || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean),
    punkte: Number(row.punkte) || 1,
    musterlosung: row.musterlosung || '',
    bewertungsraster: safeJsonParse_(row.bewertungsraster, []),
    anhaenge: safeJsonParse_(row.anhaenge, []),
    verwendungen: [],
    quelle: row.quelle || 'manuell',
    autor: row.autor || '',
    schwierigkeit: Number(row.schwierigkeit) || undefined,
    poolId: row.poolId || '',
    pruefungstauglich: row.pruefungstauglich === 'true',
    lernzielIds: (row.lernzielIds || '').split(',').filter(Boolean),
  };

  var typ = row.typ || 'mc';
  var typDaten = safeJsonParse_(row.typDaten, {});

  // Typ-spezifische Felder aus typDaten oder direkt aus Spalten
  switch (typ) {
    case 'mc':
      return Object.assign(base, {
        typ: 'mc',
        fragetext: row.fragetext || '',
        optionen: typDaten.optionen || safeJsonParse_(row.optionen, []),
        mehrfachauswahl: typDaten.mehrfachauswahl || row.mehrfachauswahl === 'true',
        zufallsreihenfolge: typDaten.zufallsreihenfolge || row.zufallsreihenfolge === 'true',
      });
    case 'freitext':
      return Object.assign(base, {
        typ: 'freitext',
        fragetext: row.fragetext || '',
        laenge: typDaten.laenge || row.laenge || 'mittel',
      });
    case 'lueckentext':
      return Object.assign(base, {
        typ: 'lueckentext',
        fragetext: row.fragetext || '',
        textMitLuecken: typDaten.textMitLuecken || row.textMitLuecken || '',
        luecken: typDaten.luecken || safeJsonParse_(row.luecken, []),
      });
    case 'richtigfalsch':
      return Object.assign(base, {
        typ: 'richtigfalsch',
        fragetext: row.fragetext || '',
        aussagen: typDaten.aussagen || safeJsonParse_(row.aussagen, []),
      });
    case 'berechnung':
      return Object.assign(base, {
        typ: 'berechnung',
        fragetext: row.fragetext || '',
        ergebnisse: typDaten.ergebnisse || safeJsonParse_(row.ergebnisse, []),
        rechenwegErforderlich: typDaten.rechenwegErforderlich || false,
      });
    case 'zuordnung':
      return Object.assign(base, {
        typ: 'zuordnung',
        fragetext: row.fragetext || '',
        paare: typDaten.paare || safeJsonParse_(row.paare, []),
        zufallsreihenfolge: typDaten.zufallsreihenfolge || false,
      });
    case 'sortierung':
      return Object.assign(base, {
        typ: 'sortierung',
        fragetext: row.fragetext || '',
        elemente: typDaten.elemente || safeJsonParse_(row.elemente, []),
        teilpunkte: typDaten.teilpunkte !== false,
      });
    case 'buchungssatz':
      return Object.assign(base, {
        typ: 'buchungssatz',
        geschaeftsfall: row.fragetext || typDaten.geschaeftsfall || '',
        buchungen: typDaten.buchungen || safeJsonParse_(row.buchungen, []),
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
      });
    case 'tkonto':
      return Object.assign(base, {
        typ: 'tkonto',
        aufgabentext: row.fragetext || typDaten.aufgabentext || '',
        konten: typDaten.konten || safeJsonParse_(row.konten, []),
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
        bewertungsoptionen: typDaten.bewertungsoptionen || {},
      });
    case 'kontenbestimmung':
      return Object.assign(base, {
        typ: 'kontenbestimmung',
        aufgabentext: row.fragetext || typDaten.aufgabentext || '',
        modus: typDaten.modus || 'konto_bestimmen',
        aufgaben: typDaten.aufgaben || safeJsonParse_(row.aufgaben, []),
        kontenauswahl: typDaten.kontenauswahl || { modus: 'voll' },
      });
    case 'bilanzstruktur':
      return Object.assign(base, {
        typ: 'bilanzstruktur',
        aufgabentext: row.fragetext || typDaten.aufgabentext || '',
        modus: typDaten.modus || 'bilanz',
        kontenMitSaldi: typDaten.kontenMitSaldi || safeJsonParse_(row.kontenMitSaldi, []),
        loesung: typDaten.loesung || safeJsonParse_(row.loesung, {}),
        bewertungsoptionen: typDaten.bewertungsoptionen || {},
      });
    case 'aufgabengruppe':
      return Object.assign(base, {
        typ: 'aufgabengruppe',
        kontext: row.fragetext || typDaten.kontext || '',
        teilaufgaben: typDaten.teilaufgaben || safeJsonParse_(row.teilaufgaben, []),
      });
    case 'visualisierung':
      return Object.assign(base, {
        typ: 'visualisierung',
        fragetext: row.fragetext || '',
        untertyp: typDaten.untertyp || 'zeichnen',
      });
    case 'hotspot':
      return Object.assign(base, {
        typ: 'hotspot',
        fragetext: row.fragetext || '',
        bildUrl: typDaten.bildUrl || row.bildUrl || '',
        bereiche: typDaten.bereiche || safeJsonParse_(row.bereiche, []),
        mehrfachauswahl: typDaten.mehrfachauswahl || false,
      });
    case 'bildbeschriftung':
      return Object.assign(base, {
        typ: 'bildbeschriftung',
        fragetext: row.fragetext || '',
        bildUrl: typDaten.bildUrl || row.bildUrl || '',
        beschriftungen: typDaten.beschriftungen || safeJsonParse_(row.beschriftungen, []),
      });
    case 'dragdrop_bild':
      return Object.assign(base, {
        typ: 'dragdrop_bild',
        fragetext: row.fragetext || '',
        bildUrl: typDaten.bildUrl || row.bildUrl || '',
        zielzonen: typDaten.zielzonen || safeJsonParse_(row.zielzonen, []),
        labels: typDaten.labels || safeJsonParse_(row.labels, []),
      });
    case 'pdf':
      return Object.assign(base, {
        typ: 'pdf',
        fragetext: row.fragetext || '',
        pdfUrl: typDaten.pdfUrl || row.pdfUrl || '',
        pdfDateiname: typDaten.pdfDateiname || '',
        seitenAnzahl: typDaten.seitenAnzahl || 1,
        erlaubteWerkzeuge: typDaten.erlaubteWerkzeuge || ['freihand', 'text'],
      });
    case 'audio':
      return Object.assign(base, {
        typ: 'audio',
        fragetext: row.fragetext || '',
        maxDauerSekunden: typDaten.maxDauerSekunden || undefined,
      });
    case 'code':
      return Object.assign(base, {
        typ: 'code',
        fragetext: row.fragetext || '',
        sprache: typDaten.sprache || row.sprache || 'python',
        starterCode: typDaten.starterCode || '',
      });
    case 'formel':
      return Object.assign(base, {
        typ: 'formel',
        fragetext: row.fragetext || '',
        korrekteFormel: typDaten.korrekteFormel || row.korrekteFormel || '',
        vergleichsModus: 'exakt',
      });
    default:
      return Object.assign(base, {
        typ: typ,
        fragetext: row.fragetext || '',
      });
  }
}

/** JSON sicher parsen */
function safeJsonParse_(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

/** Legacy: Fragen aus gruppenspezifischem Sheet laden (für Familie-Gruppen) */
function lernplattformLadeFragenAusGruppenSheet_(gruppe) {
  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Fragen');
    if (!sheet) return jsonResponse({ success: true, data: [] });

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var fragen = [];

    for (var i = 1; i < daten.length; i++) {
      var row = daten[i];
      var frage = {};
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        var val = row[j];
        if (!key || val === '' || val === null || val === undefined) continue;
        var strVal = String(val);
        if (strVal.charAt(0) === '[' || strVal.charAt(0) === '{') {
          try { frage[key] = JSON.parse(strVal); } catch (e) { frage[key] = strVal; }
        } else { frage[key] = strVal; }
      }
      fragen.push(frage);
    }

    return jsonResponse({ success: true, data: fragen });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

/**
 * Einzelne Frage speichern (Upsert: Update oder Insert).
 * Nur Admin der Gruppe darf Fragen speichern.
 */
function lernplattformSpeichereFrage(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var gruppeId = body.gruppeId;
  var frage = body.frage;
  if (!frage || !frage.id) {
    return jsonResponse({ success: false, error: 'Frage-Daten fehlen' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  // Admin-Check
  if (gruppe.adminEmail !== email) {
    return jsonResponse({ success: false, error: 'Keine Berechtigung (nur Admin)' });
  }

  if (!gruppe.fragebankSheetId) {
    return jsonResponse({ success: false, error: 'Fragenbank-Sheet nicht konfiguriert' });
  }

  // Spalten-Definition (Reihenfolge = Header-Reihenfolge im Sheet)
  var spalten = [
    'id', 'fach', 'thema', 'typ', 'schwierigkeit', 'taxonomie',
    'frage', 'erklaerung', 'uebung', 'pruefungstauglich',
    'optionen', 'korrekt', 'aussagen', 'luecken', 'toleranz',
    'einheit', 'kategorien', 'elemente', 'reihenfolge', 'daten'
  ];

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Fragen');

    // Tab erstellen falls nicht vorhanden
    if (!sheet) {
      sheet = ss.insertSheet('Fragen');
      sheet.appendRow(spalten);
    }

    var daten = sheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');

    // Wert für eine Spalte vorbereiten (Arrays/Objekte → JSON)
    function wert(key) {
      var val = frage[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    }

    // Bestehende Zeile suchen
    var gefunden = false;
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][idIdx]) === frage.id) {
        // Update: Jede Spalte einzeln setzen
        var zeilenIdx = i + 1; // 1-basiert
        for (var s = 0; s < spalten.length; s++) {
          var colIdx = headers.indexOf(spalten[s]);
          if (colIdx >= 0) {
            sheet.getRange(zeilenIdx, colIdx + 1).setValue(wert(spalten[s]));
          }
        }
        gefunden = true;
        break;
      }
    }

    if (!gefunden) {
      // Neue Zeile anhängen
      var neueZeile = spalten.map(function(key) { return wert(key); });
      sheet.appendRow(neueZeile);
    }

    return jsonResponse({ success: true, id: frage.id });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// ============================================================
// FORTSCHRITT ENDPOINTS
// ============================================================

/**
 * Fortschritt für ein Mitglied speichern (nach Übungs-Session).
 */
function lernplattformSpeichereFortschritt(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();
  var fortschritte = body.fortschritte || []; // Array von { fragenId, korrekt, sessionId }

  if (!email || !gruppeId || !fortschritte.length) {
    return jsonResponse({ success: false, error: 'Daten unvollständig' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Fortschritt');
    if (!sheet) return jsonResponse({ success: false, error: 'Fortschritt-Tab fehlt' });

    var daten = sheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });

    // Bestehende Fortschritte laden (als Map: email+fragenId → Zeilenindex)
    var bestehendeMap = {};
    for (var i = 1; i < daten.length; i++) {
      var key = String(daten[i][0]).toLowerCase() + '|' + String(daten[i][1]);
      bestehendeMap[key] = i;
    }

    var jetzt = new Date().toISOString();

    for (var f = 0; f < fortschritte.length; f++) {
      var eintrag = fortschritte[f];
      var mapKey = email + '|' + eintrag.fragenId;
      var bestehend = bestehendeMap[mapKey];

      if (bestehend !== undefined) {
        // Update: Versuche erhöhen, Mastery berechnen
        var row = daten[bestehend];
        var versuche = Number(row[headers.indexOf('versuche')]) + 1;
        var richtig = Number(row[headers.indexOf('richtig')]) + (eintrag.korrekt ? 1 : 0);
        var richtigInFolge = eintrag.korrekt
          ? Number(row[headers.indexOf('richtiginfolge')]) + 1
          : 0;
        var sessionIds = String(row[headers.indexOf('sessionids')] || '');
        if (eintrag.sessionId && sessionIds.indexOf(eintrag.sessionId) === -1) {
          sessionIds = sessionIds ? sessionIds + ',' + eintrag.sessionId : eintrag.sessionId;
        }
        var mastery = berechneMastery_(richtigInFolge);

        var zeilenIdx = bestehend + 1; // 1-basiert
        sheet.getRange(zeilenIdx, headers.indexOf('versuche') + 1).setValue(versuche);
        sheet.getRange(zeilenIdx, headers.indexOf('richtig') + 1).setValue(richtig);
        sheet.getRange(zeilenIdx, headers.indexOf('richtiginfolge') + 1).setValue(richtigInFolge);
        sheet.getRange(zeilenIdx, headers.indexOf('mastery') + 1).setValue(mastery);
        sheet.getRange(zeilenIdx, headers.indexOf('letzterversuch') + 1).setValue(jetzt);
        sheet.getRange(zeilenIdx, headers.indexOf('sessionids') + 1).setValue(sessionIds);
      } else {
        // Neuer Eintrag
        var mastery0 = eintrag.korrekt ? 'ueben' : 'neu';
        sheet.appendRow([
          email, eintrag.fragenId, 1, eintrag.korrekt ? 1 : 0,
          eintrag.korrekt ? 1 : 0, mastery0, jetzt, eintrag.sessionId || ''
        ]);
      }
    }

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

/**
 * Mastery berechnen basierend auf richtigInFolge.
 * neu → üben → gefestigt → gemeistert
 */
function berechneMastery_(richtigInFolge) {
  if (richtigInFolge >= 5) return 'gemeistert';
  if (richtigInFolge >= 3) return 'gefestigt';
  if (richtigInFolge >= 1) return 'ueben';
  return 'neu';
}

/**
 * Fortschritt laden für ein Mitglied (alle Fragen oder gefiltert).
 */
function lernplattformLadeFortschritt(body) {
  var gruppeId = body.gruppeId;
  var email = (body.email || '').toLowerCase().trim();

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Fortschritt');
    if (!sheet) return jsonResponse({ success: true, data: [] });

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var result = [];

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][0]).toLowerCase().trim() !== email) continue;
      result.push({
        fragenId: String(daten[i][headers.indexOf('fragenid')]),
        versuche: Number(daten[i][headers.indexOf('versuche')]),
        richtig: Number(daten[i][headers.indexOf('richtig')]),
        richtigInFolge: Number(daten[i][headers.indexOf('richtiginfolge')]),
        mastery: String(daten[i][headers.indexOf('mastery')]),
        letzterVersuch: String(daten[i][headers.indexOf('letzterversuch')]),
      });
    }

    return jsonResponse({ success: true, data: result });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// ============================================================
// AUFTRÄGE ENDPOINTS
// ============================================================

function lernplattformLadeAuftraege(body) {
  var gruppeId = body.gruppeId;

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Auftraege');
    if (!sheet) return jsonResponse({ success: true, data: [] });

    var daten = sheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var auftraege = [];

    for (var i = 1; i < daten.length; i++) {
      var aktiv = daten[i][headers.indexOf('aktiv')];
      auftraege.push({
        id: String(daten[i][headers.indexOf('id')]),
        titel: String(daten[i][headers.indexOf('titel')]),
        fach: String(daten[i][headers.indexOf('fach')]),
        thema: String(daten[i][headers.indexOf('thema')]),
        deadline: String(daten[i][headers.indexOf('deadline')]),
        aktiv: aktiv === true || aktiv === 'true' || aktiv === 'TRUE',
      });
    }

    return jsonResponse({ success: true, data: auftraege });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

function lernplattformSpeichereAuftrag(body) {
  var gruppeId = body.gruppeId;
  var auftrag = body.auftrag;
  if (!auftrag || !auftrag.id) {
    return jsonResponse({ success: false, error: 'Auftrag-Daten fehlen' });
  }

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Auftraege');
    if (!sheet) return jsonResponse({ success: false, error: 'Aufträge-Tab fehlt' });

    // Prüfen ob Update oder Neu
    var daten = sheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var idIdx = headers.indexOf('id');

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][idIdx]) === auftrag.id) {
        // Update
        var zeilenIdx = i + 1;
        sheet.getRange(zeilenIdx, headers.indexOf('titel') + 1).setValue(auftrag.titel || '');
        sheet.getRange(zeilenIdx, headers.indexOf('fach') + 1).setValue(auftrag.fach || '');
        sheet.getRange(zeilenIdx, headers.indexOf('thema') + 1).setValue(auftrag.thema || '');
        sheet.getRange(zeilenIdx, headers.indexOf('deadline') + 1).setValue(auftrag.deadline || '');
        sheet.getRange(zeilenIdx, headers.indexOf('aktiv') + 1).setValue(auftrag.aktiv !== false);
        return jsonResponse({ success: true });
      }
    }

    // Neu
    sheet.appendRow([
      auftrag.id, auftrag.titel || '', auftrag.fach || '',
      auftrag.thema || '', auftrag.deadline || '', auftrag.aktiv !== false
    ]);

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

// ============================================================
// EINSTELLUNGEN ENDPOINTS
// ============================================================

/**
 * Gruppeneinstellungen laden.
 * Liest die 'einstellungen'-Spalte aus der Registry.
 * Falls leer oder fehlend: Defaults basierend auf 'typ'-Spalte zurückgeben.
 */
function lernplattformLadeEinstellungen(body) {
  var gruppeId = body.gruppeId;
  if (!gruppeId) return jsonResponse({ success: false, error: 'gruppeId fehlt' });

  var sheet = getGruppenRegistry_();
  if (!sheet) return jsonResponse({ success: false, error: 'Registry nicht gefunden' });

  var daten = sheet.getDataRange().getValues();
  if (daten.length < 2) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var idIdx = headers.indexOf('id');
  var typIdx = headers.indexOf('typ');
  var einstellungenIdx = headers.indexOf('einstellungen');

  for (var i = 1; i < daten.length; i++) {
    if (String(daten[i][idIdx]).trim() !== gruppeId) continue;

    var typ = String(daten[i][typIdx] || 'gym').trim();

    // Defaults basierend auf Typ
    var defaults = typ === 'familie'
      ? { anrede: 'du', feedbackStil: 'ermutigend', sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {} }
      : { anrede: 'sie', feedbackStil: 'sachlich', sichtbareFaecher: [], sichtbareThemen: {}, fachFarben: {} };

    // 'einstellungen'-Spalte vorhanden und befüllt?
    if (einstellungenIdx >= 0) {
      var raw = String(daten[i][einstellungenIdx] || '').trim();
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          return jsonResponse({ success: true, data: parsed });
        } catch (e) {
          // Ungültiges JSON → Defaults verwenden
        }
      }
    }

    return jsonResponse({ success: true, data: defaults });
  }

  return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });
}

/**
 * Gruppeneinstellungen speichern (nur Admin).
 * Schreibt die Einstellungen als JSON-String in die 'einstellungen'-Spalte.
 * Erstellt die Spalte falls nötig.
 */
function lernplattformSpeichereEinstellungen(body) {
  var gruppeId = body.gruppeId;
  var einstellungen = body.einstellungen;
  var email = (body.email || '').toLowerCase().trim();

  if (!gruppeId || !einstellungen || !email) {
    return jsonResponse({ success: false, error: 'gruppeId, einstellungen und email sind Pflicht' });
  }

  var sheet = getGruppenRegistry_();
  if (!sheet) return jsonResponse({ success: false, error: 'Registry nicht gefunden' });

  var daten = sheet.getDataRange().getValues();
  if (daten.length < 2) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
  var idIdx = headers.indexOf('id');
  var adminEmailIdx = headers.indexOf('adminemail');
  var einstellungenIdx = headers.indexOf('einstellungen');

  for (var i = 1; i < daten.length; i++) {
    if (String(daten[i][idIdx]).trim() !== gruppeId) continue;

    // Admin-Prüfung
    var adminEmail = String(daten[i][adminEmailIdx] || '').toLowerCase().trim();
    if (adminEmail !== email) {
      return jsonResponse({ success: false, error: 'Keine Berechtigung: Nur Admin darf Einstellungen speichern' });
    }

    // 'einstellungen'-Spalte erstellen falls nicht vorhanden
    if (einstellungenIdx < 0) {
      var neueSpalteSpaltenNr = daten[0].length + 1;
      sheet.getRange(1, neueSpalteSpaltenNr).setValue('einstellungen');
      sheet.getRange(i + 1, neueSpalteSpaltenNr).setValue(JSON.stringify(einstellungen));
    } else {
      sheet.getRange(i + 1, einstellungenIdx + 1).setValue(JSON.stringify(einstellungen));
    }

    return jsonResponse({ success: true, data: { gespeichert: true } });
  }

  return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });
}
