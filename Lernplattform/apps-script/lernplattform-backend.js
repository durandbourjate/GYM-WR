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
// Dynamisch: Alle Tabs im Fragenbank-Sheet ausser System-Tabs
const FRAGENBANK_SYSTEM_TABS = ['Mitglieder', 'Lernziele', 'AuditLog', 'Konfiguration', 'Meta'];
// Fachbereich-Mapping: Unklare Tab-Namen auf saubere Bezeichnungen mappen
const FACHBEREICH_MAPPING = { 'Allgemein': 'Andere', 'Wirtschaft & Recht': 'Andere' };

// Themen-Mapping: poolId-Prefix → Thema-Titel (generiert aus Pool-Configs)
// Damit: bisheriges thema → unterthema, Pool-Titel → thema
var THEMEN_MAPPING = {
  "bwl_einfuehrung": "Einführung BWL",
  "bwl_fibu": "Finanzbuchhaltung (FIBU)",
  "bwl_marketing": "Markt- und Leistungsanalyse",
  "bwl_stratfuehrung": "Strategische Unternehmensführung",
  "bwl_unternehmensmodell": "Unternehmensmodell",
  "recht_arbeitsrecht": "Arbeitsrecht",
  "recht_einfuehrung": "Einführung Recht",
  "recht_einleitungsartikel": "Rechtsquellen und Rechtsgrundsätze",
  "recht_grundrechte": "Menschenrechte und Grundrechte",
  "recht_mietrecht": "Mietrecht",
  "recht_or_at": "OR AT",
  "recht_personenrecht": "Personenrecht",
  "recht_prozessrecht": "Prozessrecht",
  "recht_sachenrecht": "Sachenrecht",
  "recht_strafrecht": "Strafrecht",
  "vwl_arbeitslosigkeit": "Arbeitslosigkeit & Armut",
  "vwl_beduerfnisse": "Bedürfnisse, Knappheit & Produktionsfaktoren",
  "vwl_bip": "Bruttoinlandprodukt (BIP)",
  "vwl_geld": "Geld, Geldpolitik und Finanzmärkte",
  "vwl_konjunktur": "Konjunktur und Konjunkturpolitik",
  "vwl_markteffizienz": "Markteffizienz",
  "vwl_menschenbild": "Ökonomisches Menschenbild",
  "vwl_sozialpolitik": "Sozialpolitik und Sozialversicherungen",
  "vwl_staatsverschuldung": "Staatsverschuldung",
  "vwl_steuern": "Steuern und Staatseinnahmen",
  "vwl_wachstum": "Wirtschaftswachstum"
};

function getFragenbankTabs_() {
  var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
  var sheets = fragenbank.getSheets();
  var tabs = [];
  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (FRAGENBANK_SYSTEM_TABS.indexOf(name) === -1) {
      tabs.push(name);
    }
  }
  return tabs;
}

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

// === AUTH-HELPER: Admin/Mitglied-Check ===

/**
 * Prüft ob der Anfragende Admin einer Gruppe ist.
 * Validiert Token + Email-Bindung + Admin-Rolle.
 * @returns {{ email: string, gruppe: object }} oder null
 */
function istGruppenAdmin_(body, gruppeId) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) return null;

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return null;

  // Gruppen-Ersteller ist immer Admin
  if (gruppe.adminEmail === email) return { email: email, gruppe: gruppe };

  // Im Mitglieder-Tab als Admin eingetragen?
  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var mitgSheet = ss.getSheetByName('Mitglieder');
    if (!mitgSheet) return null;
    var daten = mitgSheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var emailIdx = headers.indexOf('email');
    var rolleIdx = headers.indexOf('rolle');
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][emailIdx]).toLowerCase().trim() === email && String(daten[i][rolleIdx]) === 'admin') {
        return { email: email, gruppe: gruppe };
      }
    }
  } catch(e) {}
  return null;
}

/**
 * Prüft ob der Anfragende Mitglied einer Gruppe ist (Admin oder normales Mitglied).
 * @returns {{ email: string, gruppe: object, rolle: string }} oder null
 */
function istGruppenMitglied_(body, gruppeId) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) return null;

  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return null;

  if (gruppe.adminEmail === email) return { email: email, gruppe: gruppe, rolle: 'admin' };

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var mitgSheet = ss.getSheetByName('Mitglieder');
    if (!mitgSheet) return null;
    var daten = mitgSheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var emailIdx = headers.indexOf('email');
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][emailIdx]).toLowerCase().trim() === email) {
        return { email: email, gruppe: gruppe, rolle: String(daten[i][headers.indexOf('rolle')] || 'mitglied') };
      }
    }
  } catch(e) {}
  return null;
}

// === AUDIT-LOGGING ===

/**
 * Loggt sensible Aktionen in den AuditLog-Tab im Registry-Sheet.
 * Darf nie die Hauptaktion blockieren.
 */
function auditLog_(aktion, email, details) {
  try {
    var ss = SpreadsheetApp.openById(GRUPPEN_REGISTRY_ID);
    var sheet = ss.getSheetByName('AuditLog');
    if (!sheet) {
      sheet = ss.insertSheet('AuditLog');
      sheet.appendRow(['timestamp', 'aktion', 'email', 'details']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date().toISOString(), aktion, email, JSON.stringify(details)]);
  } catch(e) { /* Logging darf nie die Hauptaktion blockieren */ }
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
      var rlLogin = rateLimitCheck_('login', body.email || 'anon', 20, 600);
      if (rlLogin.blocked) return jsonResponse({ success: false, error: rlLogin.error });
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

    case 'lernplattformLoescheFrage':
      return lernplattformLoescheFrage(body);

    // === FORTSCHRITT ===

    case 'lernplattformSpeichereFortschritt':
      return lernplattformSpeichereFortschritt(body);

    case 'lernplattformLadeFortschritt':
      return lernplattformLadeFortschritt(body);

    case 'lernplattformLadeGruppenFortschritt':
      return lernplattformLadeGruppenFortschritt(body);

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

    // === KI / UPLOAD / LERNZIELE ===

    case 'lernplattformKIAssistent':
      return lernplattformKIAssistent(body);

    case 'lernplattformUploadAnhang':
      return lernplattformUploadAnhang(body);

    case 'lernplattformLadeLernziele':
      return lernplattformLadeLernziele(body);

    case 'lernplattformLadeLernzieleV2':
      return lernplattformLadeLernzieleV2(body);

    case 'lernplattformSpeichereLernziel':
      return lernplattformSpeichereLernziel(body);

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
  var mitgliedEmail = (body.mitgliedEmail || body.email || '').toLowerCase().trim();

  // Auth + Admin-Check
  var adminBody = { email: body.adminEmail || body.email, token: body.token, sessionToken: body.sessionToken };
  var auth = istGruppenAdmin_(adminBody, gruppeId);
  if (!auth) {
    auditLog_('generiereCode:DENIED', (body.adminEmail || body.email || ''), { gruppeId: gruppeId, mitglied: mitgliedEmail });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }

  var gruppe = auth.gruppe;

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
        auditLog_('generiereCode', auth.email, { gruppeId: gruppeId, mitglied: mitgliedEmail });
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

  // Auth + Mitglied-Check (jedes Mitglied darf die Liste sehen)
  var auth = istGruppenMitglied_(body, gruppeId);
  if (!auth) return jsonResponse({ success: false, error: 'Keine Berechtigung' });

  var gruppe = auth.gruppe;

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
  var email = (body.mitgliedEmail || body.email || '').toLowerCase().trim();
  var name = body.name || '';

  // Auth + Admin-Check
  var adminBody = { email: body.adminEmail || body.email, token: body.token, sessionToken: body.sessionToken };
  var auth = istGruppenAdmin_(adminBody, gruppeId);
  if (!auth) {
    auditLog_('einladen:DENIED', (body.adminEmail || body.email || ''), { gruppeId: gruppeId, mitglied: email });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }

  var gruppe = auth.gruppe;
  auditLog_('einladen', auth.email, { gruppeId: gruppeId, mitglied: email, name: name });

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
  var email = (body.mitgliedEmail || body.email || '').toLowerCase().trim();

  // Auth + Admin-Check
  var adminBody = { email: body.adminEmail || body.email, token: body.token, sessionToken: body.sessionToken };
  var auth = istGruppenAdmin_(adminBody, gruppeId);
  if (!auth) {
    auditLog_('entfernen:DENIED', (body.adminEmail || body.email || ''), { gruppeId: gruppeId, mitglied: email });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }

  var gruppe = auth.gruppe;
  auditLog_('entfernen', auth.email, { gruppeId: gruppeId, mitglied: email });

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
    var fragenbankTabs = getFragenbankTabs_();

    for (var t = 0; t < fragenbankTabs.length; t++) {
      var tabName = fragenbankTabs[t];
      var sheet = fragenbank.getSheetByName(tabName);
      if (!sheet) continue;

      var daten = sheet.getDataRange().getValues();
      if (daten.length < 2) continue;

      // Headers NICHT lowercasen — Prüfungstool-Sheet hat camelCase (typDaten, erstelltAm etc.)
      var headers = daten[0].map(function(h) { return String(h).trim(); });

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
  // Fachbereich-Mapping anwenden (z.B. "Allgemein" → "Andere")
  var mappedFachbereich = FACHBEREICH_MAPPING[fachbereich] || fachbereich;
  var mappedFach = FACHBEREICH_MAPPING[row.fach] || row.fach;
  var base = {
    id: row.id,
    version: Number(row.version) || 1,
    erstelltAm: row.erstelltAm || new Date().toISOString(),
    geaendertAm: row.geaendertAm || new Date().toISOString(),
    fachbereich: mappedFachbereich,
    fach: mappedFach || mappedFachbereich,
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
    schwierigkeit: Number(row.schwierigkeit) || 2, // Default: Mittel
    poolId: row.poolId || '',
    pruefungstauglich: row.pruefungstauglich === 'true',
    lernzielIds: (row.lernzielIds || '').split(',').filter(Boolean),
  };

  // Themen-Hierarchie aus poolId ableiten (Pool-Titel → thema, bisheriges thema → unterthema)
  // IMMER anwenden wenn poolId matcht (auch wenn unterthema schon gesetzt)
  if (base.poolId) {
    var parts = base.poolId.split('_');
    // Pool-Prefix: alle Teile ausser dem letzten (Frage-ID)
    var poolPrefix = parts.slice(0, -1).join('_');
    var poolThema = THEMEN_MAPPING[poolPrefix];
    if (poolThema) {
      // Bisheriges Thema → Unterthema (wenn nicht identisch mit Pool-Titel und noch nicht gesetzt)
      if (base.thema && base.thema !== poolThema && !base.unterthema) {
        base.unterthema = base.thema;
      }
      base.thema = poolThema; // Pool-Titel → Thema (IMMER)
    }
  }

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
  var gruppeId = body.gruppeId;
  var frage = body.frage;
  if (!frage || !frage.id) {
    return jsonResponse({ success: false, error: 'Frage-Daten fehlen' });
  }

  // Auth + Admin-Check (über Helper)
  var auth = istGruppenAdmin_(body, gruppeId);
  if (!auth) return jsonResponse({ success: false, error: 'Keine Berechtigung (nur Admin)' });
  var gruppe = auth.gruppe;

  // Fachbereich bestimmt den Tab in der Fragenbank
  var fachbereich = frage.fachbereich || frage.fach || '';

  // Familie-Gruppen: weiterhin eigenes Sheet nutzen
  if (gruppe.typ === 'familie' && gruppe.fragebankSheetId) {
    return speichereFrageInGruppenSheet_(gruppe, frage);
  }

  // Gym-Gruppen: Gemeinsame Fragenbank (wie Prüfungstool)
  try {
    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var sheet = fragenbank.getSheetByName(fachbereich);
    if (!sheet) {
      // Tab existiert noch nicht → automatisch erstellen
      sheet = fragenbank.insertSheet(fachbereich);
    }

    var daten = sheet.getDataRange().getValues();
    // Headers NICHT lowercasen — Prüfungstool-Sheet hat camelCase
    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');

    // Wert für eine Spalte vorbereiten (Arrays/Objekte → JSON)
    function wert(key) {
      var val = frage[key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    }

    // geaendertAm aktualisieren
    frage.geaendertAm = new Date().toISOString();
    if (!frage.erstelltAm) frage.erstelltAm = frage.geaendertAm;
    if (!frage.version) frage.version = 1;

    // Bestehende Zeile suchen
    var gefunden = false;
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][idIdx]) === frage.id) {
        // Update: Jede Spalte anhand der vorhandenen Header setzen
        var zeilenIdx = i + 1; // 1-basiert
        for (var h = 0; h < headers.length; h++) {
          var key = headers[h];
          if (!key) continue;
          sheet.getRange(zeilenIdx, h + 1).setValue(wert(key));
        }
        gefunden = true;
        break;
      }
    }

    if (!gefunden) {
      // Neue Zeile: Reihenfolge muss den Header-Spalten entsprechen
      var neueZeile = headers.map(function(key) { return wert(key); });
      sheet.appendRow(neueZeile);
    }

    return jsonResponse({ success: true, id: frage.id });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

/**
 * Frage ins Gruppen-eigene Sheet speichern (für Familie-Gruppen).
 */
function speichereFrageInGruppenSheet_(gruppe, frage) {
  var spalten = [
    'id', 'fach', 'thema', 'typ', 'schwierigkeit', 'taxonomie',
    'frage', 'erklaerung', 'uebung', 'pruefungstauglich',
    'optionen', 'korrekt', 'aussagen', 'luecken', 'toleranz',
    'einheit', 'kategorien', 'elemente', 'reihenfolge', 'daten'
  ];

  function wert(key) {
    var val = frage[key];
    if (val === undefined || val === null) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  }

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
    var sheet = ss.getSheetByName('Fragen');
    if (!sheet) {
      sheet = ss.insertSheet('Fragen');
      sheet.appendRow(spalten);
    }

    var daten = sheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');

    var gefunden = false;
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][idIdx]) === frage.id) {
        var zeilenIdx = i + 1;
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
      var neueZeile = spalten.map(function(key) { return wert(key); });
      sheet.appendRow(neueZeile);
    }

    return jsonResponse({ success: true, id: frage.id });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message });
  }
}

/**
 * Frage löschen (nur Admin der Gruppe).
 * Gym-Gruppen: Löscht aus FRAGENBANK_ID (Fach-Tab).
 * Familie-Gruppen: Löscht aus Gruppen-Sheet.
 */
function lernplattformLoescheFrage(body) {
  var gruppeId = body.gruppeId;
  var frageId = body.frageId;
  var fachbereich = body.fachbereich;

  if (!frageId) {
    return jsonResponse({ success: false, error: 'frageId fehlt' });
  }

  // Auth + Admin-Check (über Helper)
  var auth = istGruppenAdmin_(body, gruppeId);
  if (!auth) return jsonResponse({ success: false, error: 'Keine Berechtigung (nur Admin)' });
  var gruppe = auth.gruppe;

  try {
    var ss, sheet;
    if (gruppe.typ === 'familie' && gruppe.fragebankSheetId) {
      ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);
      sheet = ss.getSheetByName('Fragen');
    } else {
      if (!fachbereich) {
        return jsonResponse({ success: false, error: 'fachbereich fehlt' });
      }
      ss = SpreadsheetApp.openById(FRAGENBANK_ID);
      sheet = ss.getSheetByName(fachbereich);
    }

    if (!sheet) return jsonResponse({ success: false, error: 'Sheet/Tab nicht gefunden' });

    var daten = sheet.getDataRange().getValues();
    var headers = daten[0].map(function(h) { return String(h).trim(); });
    var idIdx = headers.indexOf('id');

    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][idIdx]) === frageId) {
        sheet.deleteRow(i + 1); // 1-basiert
        return jsonResponse({ success: true, id: frageId });
      }
    }

    return jsonResponse({ success: false, error: 'Frage nicht gefunden: ' + frageId });
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

// ============================================================
// KI-ASSISTENT
// ============================================================

/**
 * KI-Assistent für den SharedFragenEditor.
 * Benötigt ANTHROPIC_API_KEY in Script Properties.
 */
function lernplattformKIAssistent(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var aktion = body.aktion;
  var daten = body.daten || {};

  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResponse({ success: false, error: 'KI nicht konfiguriert (ANTHROPIC_API_KEY fehlt in Script Properties)' });
  }

  var systemPrompt = 'Du bist ein Assistent für Lehrpersonen am Gymnasium Hofwil (Kanton Bern). Du erstellst und verbesserst Prüfungsfragen für den Unterricht. Antworte IMMER mit validem JSON.';
  var userPrompt = '';

  switch (aktion) {
    case 'generiereFragetext':
      userPrompt = 'Erstelle eine Prüfungsfrage.\nFachbereich: ' + (daten.fachbereich || '') +
        '\nThema: ' + (daten.thema || '') + '\nUnterthema: ' + (daten.unterthema || '') +
        '\nFragetyp: ' + (daten.typ || 'mc') + '\nTaxonomie (Bloom): ' + (daten.bloom || 'K2') +
        '\n\nAntwort als JSON: {"fragetext": "...", "musterlosung": "..."}';
      break;
    case 'verbessereFragetext':
      userPrompt = 'Prüfe und verbessere diesen Fragetext:\n\n' + (daten.fragetext || '') +
        '\n\nAntwort als JSON: {"fragetext": "...", "aenderungen": "..."}';
      break;
    case 'generiereMusterloesung':
      userPrompt = 'Erstelle eine Musterlösung für diese Frage:\n\n' + (daten.fragetext || '') +
        '\nFragetyp: ' + (daten.typ || '') + '\nFachbereich: ' + (daten.fachbereich || '') +
        '\n\nAntwort als JSON: {"musterlosung": "..."}';
      break;
    case 'pruefeMusterloesung':
      userPrompt = 'Prüfe diese Musterlösung auf Korrektheit:\nFrage: ' + (daten.fragetext || '') +
        '\nMusterlösung: ' + (daten.musterlosung || '') +
        '\n\nAntwort als JSON: {"bewertung": "...", "verbesserteLosung": "..."}';
      break;
    case 'generiereFrageZuLernziel':
      userPrompt = 'Erstelle eine Prüfungsfrage basierend auf diesem Lernziel:\n\n' +
        'Lernziel: ' + (daten.lernziel || '') + '\nBloom-Stufe: ' + (daten.bloom || 'K2') +
        '\nThema: ' + (daten.thema || '') + '\nFragetyp: ' + (daten.fragetyp || 'mc') +
        '\n\nAntwort als JSON: {"fragetext": "...", "musterlosung": "..."}';
      break;
    default:
      return jsonResponse({ success: false, error: 'Unbekannte KI-Aktion: ' + aktion });
  }

  try {
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      }),
      muteHttpExceptions: true
    });

    var result = JSON.parse(response.getContentText());
    if (result.error) {
      return jsonResponse({ success: false, error: result.error.message || 'API-Fehler' });
    }

    var textAntwort = result.content && result.content[0] ? result.content[0].text : '';
    var jsonMatch = textAntwort.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return jsonResponse({ success: false, error: 'KI-Antwort enthält kein JSON' });
    }

    var kiDaten = JSON.parse(jsonMatch[0]);
    return jsonResponse({ success: true, data: kiDaten });
  } catch (e) {
    return jsonResponse({ success: false, error: 'KI-Fehler: ' + e.message });
  }
}

// ============================================================
// UPLOAD (Anhänge an Google Drive)
// ============================================================

/**
 * Datei-Anhang an Google Drive hochladen.
 */
function lernplattformUploadAnhang(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var frageId = body.frageId;
  var dateiname = body.dateiname;
  var mimeType = body.mimeType || 'application/octet-stream';
  var base64 = body.base64;

  if (!frageId || !dateiname || !base64) {
    return jsonResponse({ success: false, error: 'Fehlende Upload-Daten' });
  }

  var erlaubteMimeTypes = [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'
  ];
  if (erlaubteMimeTypes.indexOf(mimeType) === -1) {
    return jsonResponse({ success: false, error: 'Dateityp nicht erlaubt: ' + mimeType });
  }

  try {
    var ordnerName = 'Übungstool-Anhänge';
    var ordner;
    var ordnerSuche = DriveApp.getFoldersByName(ordnerName);
    if (ordnerSuche.hasNext()) {
      ordner = ordnerSuche.next();
    } else {
      ordner = DriveApp.createFolder(ordnerName);
    }

    var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, dateiname);
    var datei = ordner.createFile(blob);
    datei.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return jsonResponse({
      success: true,
      data: {
        id: datei.getId(),
        name: dateiname,
        mimeType: mimeType,
        url: 'https://drive.google.com/file/d/' + datei.getId() + '/view',
        groesse: blob.getBytes().length
      }
    });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Upload fehlgeschlagen: ' + e.message });
  }
}

// ============================================================
// LERNZIELE
// ============================================================

/**
 * Lernziele aus der Fragenbank laden (aus lernzielIds-Spalte).
 */
function lernplattformLadeLernziele(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var fachbereich = body.fachbereich || '';

  try {
    var fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    var alleTabs = getFragenbankTabs_();
    var tabs = fachbereich && alleTabs.indexOf(fachbereich) >= 0
      ? [fachbereich]
      : alleTabs;

    var lernziele = [];
    var gesehen = {};

    for (var t = 0; t < tabs.length; t++) {
      var sheet = fragenbank.getSheetByName(tabs[t]);
      if (!sheet) continue;

      var daten = sheet.getDataRange().getValues();
      if (daten.length < 2) continue;

      var headers = daten[0].map(function(h) { return String(h).trim(); });
      var lzIdx = headers.indexOf('lernzielIds');
      var themaIdx = headers.indexOf('thema');
      var bloomIdx = headers.indexOf('bloom');

      if (lzIdx < 0) continue;

      for (var i = 1; i < daten.length; i++) {
        var lzRaw = String(daten[i][lzIdx] || '');
        if (!lzRaw) continue;

        var ids = lzRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        for (var j = 0; j < ids.length; j++) {
          var lzId = ids[j];
          if (gesehen[lzId]) continue;
          gesehen[lzId] = true;

          lernziele.push({
            id: lzId,
            text: lzId,
            thema: String(daten[i][themaIdx] || ''),
            bloom: String(daten[i][bloomIdx] || 'K2'),
            fachbereich: tabs[t]
          });
        }
      }
    }

    return jsonResponse({ success: true, data: lernziele });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziele laden: ' + e.message });
  }
}

// ============================================================
// GRUPPEN-FORTSCHRITT + LERNZIELE V2
// ============================================================

/**
 * Lädt den Fortschritt aller SuS einer Gruppe (nur für Admins).
 */
function lernplattformLadeGruppenFortschritt(body) {
  var auth = istGruppenAdmin_(body, body.gruppeId);
  if (!auth) {
    auditLog_('ladeGruppenFortschritt:DENIED', (body.email || ''), { gruppeId: body.gruppeId });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }

  var gruppe = auth.gruppe;

  try {
    var ss = SpreadsheetApp.openById(gruppe.fragebankSheetId);

    // Mitglieder-Emails laden (für Filterung bei geteiltem Sheet)
    var mitgSheet = ss.getSheetByName('Mitglieder');
    var mitgliederEmails = [];
    if (mitgSheet) {
      var mitgDaten = mitgSheet.getDataRange().getValues();
      var mitgHeaders = mitgDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
      var mitgEmailIdx = mitgHeaders.indexOf('email');
      for (var m = 1; m < mitgDaten.length; m++) {
        mitgliederEmails.push(String(mitgDaten[m][mitgEmailIdx] || '').toLowerCase().trim());
      }
    }

    // Fortschritt laden + nach Mitgliedern filtern
    var fortschrittSheet = ss.getSheetByName('Fortschritt');
    var fortschritte = [];
    if (fortschrittSheet) {
      var fpDaten = fortschrittSheet.getDataRange().getValues();
      if (fpDaten.length >= 2) {
        var fpHeaders = fpDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
        for (var i = 1; i < fpDaten.length; i++) {
          var fpEmail = String(fpDaten[i][0]).toLowerCase().trim();
          if (mitgliederEmails.length > 0 && mitgliederEmails.indexOf(fpEmail) === -1) continue;
          var sessionIdsRaw = String(fpDaten[i][fpHeaders.indexOf('sessionids')] || '');
          fortschritte.push({
            email: fpEmail,
            fragenId: String(fpDaten[i][fpHeaders.indexOf('fragenid')]),
            versuche: Number(fpDaten[i][fpHeaders.indexOf('versuche')]),
            richtig: Number(fpDaten[i][fpHeaders.indexOf('richtig')]),
            richtigInFolge: Number(fpDaten[i][fpHeaders.indexOf('richtiginfolge')]),
            mastery: String(fpDaten[i][fpHeaders.indexOf('mastery')]),
            letzterVersuch: String(fpDaten[i][fpHeaders.indexOf('letzterversuch')]),
            sessionIds: sessionIdsRaw ? sessionIdsRaw.split(',').map(function(s) { return s.trim(); }) : [],
          });
        }
      }
    }

    // Sessions laden + nach Mitgliedern filtern
    var sessionsSheet = ss.getSheetByName('Sessions');
    var sessions = [];
    if (sessionsSheet) {
      var sesDaten = sessionsSheet.getDataRange().getValues();
      if (sesDaten.length >= 2) {
        var sesHeaders = sesDaten[0].map(function(h) { return String(h).toLowerCase().trim(); });
        for (var j = 1; j < sesDaten.length; j++) {
          var sesEmail = String(sesDaten[j][sesHeaders.indexOf('email')] || '').toLowerCase().trim();
          if (mitgliederEmails.length > 0 && mitgliederEmails.indexOf(sesEmail) === -1) continue;
          sessions.push({
            sessionId: String(sesDaten[j][sesHeaders.indexOf('sessionid')]),
            email: sesEmail,
            fach: String(sesDaten[j][sesHeaders.indexOf('fach')] || ''),
            thema: String(sesDaten[j][sesHeaders.indexOf('thema')] || ''),
            datum: String(sesDaten[j][sesHeaders.indexOf('datum')] || ''),
            anzahlFragen: Number(sesDaten[j][sesHeaders.indexOf('anzahlfragen')] || 0),
            richtig: Number(sesDaten[j][sesHeaders.indexOf('richtig')] || 0),
          });
        }
      }
    }

    auditLog_('ladeGruppenFortschritt', auth.email, { gruppeId: body.gruppeId, anzahlSuS: mitgliederEmails.length, anzahlFortschritte: fortschritte.length });
    return jsonResponse({ success: true, data: { fortschritte: fortschritte, sessions: sessions } });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Gruppenfortschritt laden: ' + e.message });
  }
}

/**
 * Lädt Lernziele aus dediziertem Lernziele-Tab.
 * Gym: aus FRAGENBANK_ID, Familie: aus Gruppen-Sheet.
 */
function lernplattformLadeLernzieleV2(body) {
  var email = (body.email || '').toLowerCase().trim();
  if (!validiereSessionToken_(body.token || body.sessionToken, email)) {
    return jsonResponse({ success: false, error: 'Nicht authentifiziert' });
  }

  var gruppeId = body.gruppeId;
  var gruppen = alleGruppenLaden_();
  var gruppe = gruppen.find(function(g) { return g.id === gruppeId; });
  if (!gruppe) return jsonResponse({ success: false, error: 'Gruppe nicht gefunden' });

  try {
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragebankSheetId : FRAGENBANK_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var lzSheet = ss.getSheetByName('Lernziele');

    if (!lzSheet) return jsonResponse({ success: true, data: [] });

    var daten = lzSheet.getDataRange().getValues();
    if (daten.length < 2) return jsonResponse({ success: true, data: [] });

    var headers = daten[0].map(function(h) { return String(h).toLowerCase().trim(); });
    var lernziele = [];

    for (var i = 1; i < daten.length; i++) {
      var fragenIdsRaw = String(daten[i][headers.indexOf('fragenids')] || '');
      lernziele.push({
        id: String(daten[i][headers.indexOf('id')]),
        text: String(daten[i][headers.indexOf('text')]),
        fach: String(daten[i][headers.indexOf('fach')]),
        thema: String(daten[i][headers.indexOf('thema')] || ''),
        bloom: String(daten[i][headers.indexOf('bloom')] || 'K2'),
        fragenIds: fragenIdsRaw ? fragenIdsRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [],
      });
    }

    return jsonResponse({ success: true, data: lernziele });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziele V2 laden: ' + e.message });
  }
}

/**
 * Speichert ein Lernziel (Upsert). Nur Admins.
 */
function lernplattformSpeichereLernziel(body) {
  var auth = istGruppenAdmin_(body, body.gruppeId);
  if (!auth) {
    auditLog_('speichereLernziel:DENIED', (body.email || ''), { gruppeId: body.gruppeId });
    return jsonResponse({ success: false, error: 'Keine Berechtigung' });
  }

  var gruppe = auth.gruppe;
  var lz = body.lernziel;
  if (!lz || !lz.id || !lz.text || !lz.fach) {
    return jsonResponse({ success: false, error: 'Lernziel-Daten unvollständig' });
  }

  try {
    var sheetId = gruppe.typ === 'familie' ? gruppe.fragebankSheetId : FRAGENBANK_ID;
    var ss = SpreadsheetApp.openById(sheetId);
    var lzSheet = ss.getSheetByName('Lernziele');

    // Tab erstellen falls nicht vorhanden
    if (!lzSheet) {
      lzSheet = ss.insertSheet('Lernziele');
      lzSheet.appendRow(['id', 'text', 'fach', 'thema', 'bloom', 'fragenIds']);
      lzSheet.setFrozenRows(1);
    }

    var daten = lzSheet.getDataRange().getValues();
    var fragenIdsStr = (lz.fragenIds || []).join(', ');

    // Bestehend → Update
    for (var i = 1; i < daten.length; i++) {
      if (String(daten[i][0]) === lz.id) {
        var zeile = i + 1;
        lzSheet.getRange(zeile, 1, 1, 6).setValues([[lz.id, lz.text, lz.fach, lz.thema || '', lz.bloom || 'K2', fragenIdsStr]]);
        auditLog_('speichereLernziel:UPDATE', auth.email, { gruppeId: body.gruppeId, lernzielId: lz.id });
        return jsonResponse({ success: true, data: { id: lz.id } });
      }
    }

    // Neu → Append
    lzSheet.appendRow([lz.id, lz.text, lz.fach, lz.thema || '', lz.bloom || 'K2', fragenIdsStr]);
    auditLog_('speichereLernziel:CREATE', auth.email, { gruppeId: body.gruppeId, lernzielId: lz.id });
    return jsonResponse({ success: true, data: { id: lz.id } });
  } catch (e) {
    return jsonResponse({ success: false, error: 'Lernziel speichern: ' + e.message });
  }
}
