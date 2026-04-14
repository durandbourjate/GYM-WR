# Google Workspace Setup — Prüfungsplattform

> Schritt-für-Schritt-Anleitung für die Einrichtung des Google-Backends.
> Geschätzte Dauer: 30–45 Minuten.

---

## Übersicht

Die Prüfungsplattform braucht drei Dinge aus Google:

| Was | Wozu | Wo |
|-----|------|----|
| **OAuth Client-ID** | Login mit Schul-E-Mail | Google Cloud Console |
| **Google Sheets** | Fragenbank, Klassenlisten, Antworten | Google Drive (gymhofwil.ch) |
| **Apps Script** | API zwischen App und Sheets | Google Apps Script |

---

## Teil 1: Google OAuth Client-ID erstellen

### 1.1 Google Cloud Projekt erstellen

1. Öffne die [Google Cloud Console](https://console.cloud.google.com/)
2. Melde dich mit deinem **@gymhofwil.ch**-Konto an
3. Oben links → Projektauswahl → **Neues Projekt**
   - Name: `Pruefungsplattform Hofwil`
   - Organisation: `gymhofwil.ch` (falls verfügbar)
4. Warte bis das Projekt erstellt ist (ca. 10s) → Projekt auswählen

### 1.2 OAuth-Zustimmungsbildschirm konfigurieren

1. Linkes Menü → **APIs & Dienste** → **OAuth-Zustimmungsbildschirm**
2. Wähle **Intern** (nur für Nutzer in der gymhofwil.ch-Organisation)
   - ⚠️ Falls "Intern" nicht verfügbar: Wähle "Extern" und füge Test-Nutzer manuell hinzu
3. Fülle aus:
   - **App-Name:** `Prüfungsplattform WR`
   - **Support-E-Mail:** deine @gymhofwil.ch-Adresse
   - **Autorisierte Domains:** `gymhofwil.ch`
   - **Entwickler-Kontaktdaten:** deine E-Mail
4. **Bereiche (Scopes):** Klicke "Bereiche hinzufügen"
   - Wähle: `email`, `profile`, `openid`
   - Das sind die einzigen nötigen Scopes (kein Drive-Zugriff etc.)
5. Speichern

### 1.3 OAuth Client-ID erstellen

1. Linkes Menü → **APIs & Dienste** → **Anmeldedaten**
2. **+ Anmeldedaten erstellen** → **OAuth-Client-ID**
3. Anwendungstyp: **Webanwendung**
4. Name: `Pruefungsplattform Frontend`
5. **Autorisierte JavaScript-Ursprünge:**
   ```
   http://localhost:5174
   https://durandbourjate.github.io
   ```
6. **Autorisierte Weiterleitungs-URIs:** (leer lassen — wir nutzen das Google-Popup, keine Weiterleitung)
7. **Erstellen** → **Client-ID kopieren**

Die Client-ID ist: `522991918024-8a9mgghp1eue65dkqj15ag0p1c0rgtv8.apps.googleusercontent.com`

### 1.4 Client-ID in der App eintragen

Erstelle im Pruefung-Ordner eine Datei `.env.local`:

```bash
cd ExamLab
cp .env.example .env.local
```

Trage die Client-ID ein:

```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=
```

Die `.env.local` wird **nicht** ins Repo committed (steht in `.gitignore`).

> **Für GitHub Pages (Produktion):** Die Client-ID muss als GitHub Actions Secret oder direkt im Build gesetzt werden. Dazu später mehr (→ Teil 4).

### 1.5 Testen

```bash
cd ExamLab
npm run dev
```

Öffne `http://localhost:5174/GYM-WR-DUY/Pruefung/`

- Du solltest den **Login-Screen** sehen
- Klicke auf **"Mit Google anmelden"**
- Melde dich mit deinem @gymhofwil.ch-Konto an
- Du wirst als **LP** (Lehrperson) erkannt
- Der Startbildschirm der Demo-Prüfung erscheint

---

## Teil 2: Google Sheets anlegen

### 2.1 Ordnerstruktur in Google Drive

Erstelle in deinem Google Drive (oder einem Team-Drive) diesen Ordner:

```
Prüfungsplattform/
├── Fragenbank                 (Google Sheet)
├── Klassenlisten              (Google Sheet)
├── Prüfungs-Configs           (Google Sheet)
├── Antworten/                 (Ordner für Prüfungs-Sheets)
└── Feedback-PDFs/             (Ordner für generierte PDFs)
```

### 2.2 Sheet: Fragenbank

Erstelle ein Google Sheet namens **"Fragenbank"** mit diesen Tabs (ein Tab pro Fachbereich):

**Tab: VWL**

| id | version | typ | fragetext | optionen | mehrfachauswahl | bloom | thema | unterthema | punkte | musterlosung | bewertungsraster | tags | semester | gefaesse | laenge | textMitLuecken | luecken |
|----|---------|-----|-----------|----------|-----------------|-------|-------|------------|--------|-------------|-----------------|------|----------|----------|--------|----------------|---------|
| vwl-mc-001 | 1 | mc | Was passiert bei einem **Angebotsüberschuss**? | [{"id":"a","text":"Preis sinkt","korrekt":true},{"id":"b","text":"Preis steigt","korrekt":false},...] | false | K2 | Marktgleichgewicht | Angebotsüberschuss | 1 | Bei einem Angebotsüberschuss... | [{"beschreibung":"Korrekte Antwort","punkte":1}] | Diagramm | S3,S4 | SF,EF | | | |
| vwl-ft-001 | 1 | freitext | Erklären Sie... | | | K3 | Konjunktur | Rezession | 4 | Eine Rezession ist... | [...] | Fallbeispiel | S3,S4 | SF | mittel | | |

**Spalten-Erklärung:**

- `optionen`, `bewertungsraster`, `luecken`: JSON-Strings in einer Zelle
- `semester`, `gefaesse`, `tags`: Komma-getrennte Werte (z.B. `S3,S4`)
- Leere Zellen für nicht relevante Felder (z.B. `optionen` bei Freitext)

Erstelle gleiche Tabs für: **BWL**, **Recht**, **Informatik**

> **Tipp:** Starte mit 5–10 Fragen aus bestehenden Papierprüfungen oder Übungspools. Mehr Fragen kommen mit der Zeit.

### 2.3 Sheet: Klassenlisten

Erstelle ein Google Sheet namens **"Klassenlisten"** mit einem Tab pro Kurs:

**Tab: 28bc29fs WR (SF)**

| email | name | vorname | schuelerCode | klasse |
|-------|------|---------|-------------|--------|
| anna.muster@stud.gymhofwil.ch | Muster | Anna | 1234 | 28b |
| beat.beispiel@stud.gymhofwil.ch | Beispiel | Beat | 5678 | 28c |

**Tab: 29c WR (SF)**

| email | name | vorname | schuelerCode | klasse |
|-------|------|---------|-------------|--------|
| ... | ... | ... | ... | 29c |

> **Befüllung:** Am einfachsten aus einem Evento-Export (Excel) kopieren. Schüler-Codes: Beliebige 4-stellige Zahl pro SuS (für Fallback-Login).

### 2.4 Sheet: Prüfungs-Configs

Erstelle ein Google Sheet namens **"Prüfungs-Configs"** mit einem Tab **"Configs"**:

| id | titel | klasse | gefaess | semester | datum | typ | modus | dauerMinuten | gesamtpunkte | erlaubteKlasse | sebErforderlich | abschnitte | zeitanzeigeTyp | ruecknavigation | autoSaveIntervallSekunden |
|----|-------|--------|---------|----------|-------|-----|-------|-------------|-------------|---------------|-----------------|------------|----------------|-----------------|--------------------------|
| demo | Demo-Prüfung WR | 28abcd WR | SF | S4 | 2026-04-01 | summativ | pruefung | 45 | 20 | 28bc29fs WR (SF) | false | [{"titel":"Teil A: MC","fragenIds":["vwl-mc-001","bwl-mc-001"]},...] | countdown | true | 30 |

- `abschnitte`: JSON-Array als String
- `erlaubteKlasse`: Muss mit einem Tab-Namen im Klassenlisten-Sheet übereinstimmen

### 2.5 Berechtigungen

- **Fragenbank + Configs:** Nur du (LP) hast Bearbeitungsrechte
- **Klassenlisten:** Nur du
- **Antworten-Sheets:** Werden automatisch vom Apps Script erstellt (pro Prüfung)
- Die SuS haben **keinen direkten Zugriff** auf die Sheets — nur das Apps Script liest/schreibt

---

## Teil 3: Google Apps Script erstellen

### 3.1 Neues Apps Script Projekt

1. Öffne [script.google.com](https://script.google.com)
2. **Neues Projekt** → Name: `Pruefungsplattform API`
3. Lösche den Inhalt von `Code.gs` und ersetze mit dem Code unten

### 3.2 Apps Script Code

```javascript
// === KONFIGURATION ===
const FRAGENBANK_ID = 'SHEET_ID_HIER_EINTRAGEN';  // Google Sheet ID der Fragenbank
const KLASSENLISTEN_ID = 'SHEET_ID_HIER_EINTRAGEN';  // Google Sheet ID der Klassenlisten
const CONFIGS_ID = 'SHEET_ID_HIER_EINTRAGEN';  // Google Sheet ID der Prüfungs-Configs
const ANTWORTEN_ORDNER_ID = 'ORDNER_ID_HIER_EINTRAGEN';  // Google Drive Ordner für Antworten-Sheets

// LP-Domain für Berechtigungsprüfung
const LP_DOMAIN = 'gymhofwil.ch';
const SUS_DOMAIN = 'stud.gymhofwil.ch';

// === WEB-APP ENDPOINTS ===

function doGet(e) {
  const action = e.parameter.action;
  const email = e.parameter.email;

  // Berechtigungsprüfung
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
    default:
      return jsonResponse({ error: 'Unbekannte Aktion' });
  }
}

// === PRÜFUNG LADEN ===

function ladePruefung(pruefungId, email) {
  try {
    // Config laden
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configData = getSheetData(configSheet);
    const configRow = configData.find(row => row.id === pruefungId);

    if (!configRow) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    // Berechtigung prüfen: E-Mail in Klassenliste?
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

    // Config aufbereiten
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
      korrektur: { aktiviert: false, modus: 'batch' },
      feedback: { zeitpunkt: 'nach-review', format: 'pdf', detailgrad: 'vollstaendig' },
    };

    // Fragen laden
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
    verwendungen: [],
  };

  switch (row.typ) {
    case 'mc':
      return {
        ...base,
        typ: 'mc',
        fragetext: row.fragetext || '',
        optionen: safeJsonParse(row.optionen, []),
        mehrfachauswahl: row.mehrfachauswahl === 'true',
        zufallsreihenfolge: row.zufallsreihenfolge === 'true',
      };
    case 'freitext':
      return {
        ...base,
        typ: 'freitext',
        fragetext: row.fragetext || '',
        laenge: row.laenge || 'mittel',
        maxZeichen: row.maxZeichen ? Number(row.maxZeichen) : undefined,
        hilfstextPlaceholder: row.hilfstextPlaceholder || '',
      };
    case 'lueckentext':
      return {
        ...base,
        typ: 'lueckentext',
        textMitLuecken: row.textMitLuecken || '',
        luecken: safeJsonParse(row.luecken, []),
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

    // Antworten-Sheet finden oder erstellen
    const sheetName = 'Antworten_' + pruefungId;
    let sheet = findOrCreateAntwortenSheet(sheetName, pruefungId);

    // Zeile für diesen SuS finden oder neue Zeile erstellen
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
      // Nur aktualisieren wenn Version höher
      const altVersion = Number(data[existingRow].version) || 0;
      if (version <= altVersion && !istAbgabe) {
        return jsonResponse({ success: true, message: 'Version nicht neuer' });
      }
      // Zeile aktualisieren (existingRow + 2: +1 für Header, +1 für 1-basiert)
      const rowIndex = existingRow + 2;
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      // Neue Zeile anfügen
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

// === HILFSFUNKTIONEN ===

function findOrCreateAntwortenSheet(sheetName, pruefungId) {
  // Suche nach existierendem Sheet im Antworten-Ordner
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next()).getSheets()[0];
  }

  // Neues Sheet erstellen
  const ss = SpreadsheetApp.create(sheetName);
  const sheet = ss.getSheets()[0];

  // Header setzen
  const headers = ['email', 'name', 'version', 'antworten', 'letzterSave', 'istAbgabe', 'letzterHeartbeat', 'heartbeats'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // In den richtigen Ordner verschieben
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

// === ALLE CONFIGS LADEN (LP-Dashboard / Composer) ===

function ladeAlleConfigs(email) {
  try {
    // Nur LPs dürfen alle Configs sehen
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
    // Nur LPs dürfen die Fragenbank sehen
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
          alleFragen.push(parseFrage(row, tab));
        }
      }
    }

    return jsonResponse({ fragen: alleFragen });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === CONFIG SPEICHERN (Composer → Configs-Sheet) ===

function speichereConfig(body) {
  try {
    const { email, config } = body;

    // Nur LPs dürfen Configs speichern
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    if (!config || !config.id || !config.titel) {
      return jsonResponse({ error: 'Ungültige Config-Daten' });
    }

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const data = getSheetData(configSheet);
    const headers = configSheet.getRange(1, 1, 1, configSheet.getLastColumn()).getValues()[0];

    // Config als flache Zeile vorbereiten
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
    };

    // Bestehende Zeile suchen (Update) oder neue Zeile anfügen
    const existingRow = data.findIndex(row => row.id === config.id);

    if (existingRow >= 0) {
      // Update
      const rowIndex = existingRow + 2; // +1 Header, +1 für 1-basiert
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          configSheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      // Neue Zeile
      const newRow = headers.map(h => rowData[h] || '');
      configSheet.appendRow(newRow);
    }

    return jsonResponse({ success: true, id: config.id });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// === FRAGE SPEICHERN (FragenEditor → Fragenbank-Sheet) ===

function speichereFrage(body) {
  try {
    const { email, frage } = body;

    // Nur LPs dürfen Fragen speichern
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    if (!frage || !frage.id || !frage.typ || !frage.fachbereich) {
      return jsonResponse({ error: 'Ungültige Frage-Daten' });
    }

    // Fachbereich → Sheet-Tab bestimmen
    const tabName = frage.fachbereich; // 'VWL', 'BWL', 'Recht', 'Informatik'
    const fragenbank = SpreadsheetApp.openById(FRAGENBANK_ID);
    let sheet = fragenbank.getSheetByName(tabName);

    if (!sheet) {
      return jsonResponse({ error: 'Fachbereich-Tab "' + tabName + '" nicht gefunden' });
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = getSheetData(sheet);

    // Frage als flache Zeile vorbereiten (typ-unabhängig)
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
      fragetext: frage.fragetext || '',
      quelle: frage.quelle || 'manuell',
      // Typ-spezifische Felder als JSON
      typDaten: JSON.stringify(getTypDaten(frage)),
    };

    // Bestehende Zeile suchen (Update) oder neue Zeile anfügen
    const existingRow = data.findIndex(row => row.id === frage.id);

    if (existingRow >= 0) {
      // Update
      const rowIndex = existingRow + 2; // +1 Header, +1 für 1-basiert
      headers.forEach((header, colIndex) => {
        if (rowData[header] !== undefined) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(rowData[header]);
        }
      });
    } else {
      // Neue Zeile
      const newRow = headers.map(h => rowData[h] || '');
      sheet.appendRow(newRow);
    }

    return jsonResponse({ success: true, id: frage.id });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}

// Typ-spezifische Felder extrahieren (werden als JSON in einer Spalte gespeichert)
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
    default:
      return {};
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

    // Config laden für Prüfungsinfo
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configData = getSheetData(configSheet);
    const configRow = configData.find(row => row.id === pruefungId);

    if (!configRow) {
      return jsonResponse({ error: 'Prüfung nicht gefunden' });
    }

    // Antworten-Sheet laden
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
```

### 3.3 Sheet-IDs eintragen

Die Sheet-ID findest du in der URL jedes Google Sheets:

```
https://docs.google.com/spreadsheets/d/DIESE_ID_HIER/edit
```

Trage die IDs oben im Script bei den `const`-Variablen ein:
- `FRAGENBANK_ID` → ID des Fragenbank-Sheets
- `KLASSENLISTEN_ID` → ID des Klassenlisten-Sheets
- `CONFIGS_ID` → ID des Prüfungs-Configs-Sheets
- `ANTWORTEN_ORDNER_ID` → ID des Antworten-Ordners

Die Ordner-ID findest du in der URL des Google Drive Ordners:
```
https://drive.google.com/drive/folders/DIESE_ID_HIER
```

### 3.4 Apps Script deployen

1. Im Apps Script Editor: **Bereitstellen** → **Neue Bereitstellung**
2. Typ: **Web-App**
3. Einstellungen:
   - **Beschreibung:** `Pruefungsplattform API v1`
   - **Ausführen als:** `Ich` (dein @gymhofwil.ch-Konto)
   - **Zugriff:** `Jeder innerhalb von gymhofwil.ch`
     - ⚠️ Falls nicht verfügbar: `Jeder` (dann ist die Domain-Prüfung im Code die Sicherheitsstufe)
4. **Bereitstellen** → **URL kopieren**

Die URL sieht so aus: `https://script.google.com/macros/s/AKfycb.../exec`

### 3.5 Apps Script URL in der App eintragen

In `ExamLab/.env.local`:

```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
```

### 3.6 Berechtigungen autorisieren

Beim ersten Aufruf des Apps Scripts musst du die Berechtigungen akzeptieren:

1. Im Apps Script Editor → **Ausführen** → Wähle `doGet`
2. Es erscheint ein Berechtigungsdialog
3. Klicke **Berechtigungen überprüfen** → Wähle dein Konto → **Zulassen**
4. Erforderliche Berechtigungen:
   - Google Sheets (lesen/schreiben)
   - Google Drive (Dateien erstellen/verschieben)

---

## Teil 4: GitHub Pages Deployment

### 4.1 Environment Variables für Produktion

Da `.env.local` nicht im Repo ist, müssen die Variablen im Build gesetzt werden.

**Option A: GitHub Actions Secrets (empfohlen)**

1. GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**
2. Füge hinzu:
   - `VITE_GOOGLE_CLIENT_ID` → deine Client-ID
   - `VITE_APPS_SCRIPT_URL` → deine Apps Script URL
3. In der GitHub Actions Workflow-Datei (`.github/workflows/deploy.yml`), beim Build-Step:

```yaml
- name: Build Pruefung
  working-directory: ExamLab
  env:
    VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
    VITE_APPS_SCRIPT_URL: ${{ secrets.VITE_APPS_SCRIPT_URL }}
  run: npm ci && npm run build
```

**Option B: Direkt in vite.config.ts (einfacher, aber Client-ID im Repo)**

Da die Client-ID kein Geheimnis ist (sie ist öffentlich im HTML sichtbar), kannst du sie auch direkt setzen:

```typescript
// In vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify('123456789-abcdefg.apps.googleusercontent.com'),
  },
  // ...
})
```

→ Die Apps Script URL sollte aber über Secrets gesetzt werden.

### 4.2 Authorisierte Domains aktualisieren

In der Google Cloud Console → OAuth Client-ID bearbeiten:

Stelle sicher, dass `https://durandbourjate.github.io` als autorisierter JavaScript-Ursprung eingetragen ist.

---

## Teil 5: Testen

### 5.1 Lokaler Test

```bash
cd ExamLab
npm run dev
```

1. **Login testen:** Mit @gymhofwil.ch anmelden → Rolle = LP
2. **Demo-Modus:** "Demo ohne Login" → funktioniert ohne Google
3. **Schülercode:** Name + 4-stelliger Code eingeben

### 5.2 End-to-End Test (nach Teil 2 + 3)

1. Trage 2–3 Test-Fragen in die Fragenbank ein
2. Erstelle eine Test-Config im Configs-Sheet
3. Öffne `http://localhost:5174/GYM-WR-DUY/Pruefung/?id=DEINE_CONFIG_ID`
4. Prüfe:
   - [x] Login funktioniert
   - [x] Fragen werden geladen
   - [x] Antworten werden im Antworten-Sheet gespeichert
   - [x] Heartbeat wird geschrieben

### 5.3 SuS-Test (mit Test-Schülerkonto)

1. Trage eine Test-E-Mail in die Klassenliste ein
2. Melde dich mit dieser @stud.gymhofwil.ch-Adresse an
3. Prüfe: Prüfung wird geladen, Antworten werden gespeichert

---

## Checkliste

- [ ] Google Cloud Projekt erstellt
- [ ] OAuth-Zustimmungsbildschirm konfiguriert (Intern)
- [ ] OAuth Client-ID erstellt
- [ ] Client-ID in `.env.local` eingetragen
- [ ] Login funktioniert lokal
- [ ] Fragenbank-Sheet erstellt (mit Test-Fragen)
- [ ] Klassenlisten-Sheet erstellt
- [ ] Prüfungs-Configs-Sheet erstellt
- [ ] Antworten-Ordner in Drive erstellt
- [ ] Apps Script deployed
- [ ] Apps Script URL in `.env.local` eingetragen
- [ ] End-to-End Test erfolgreich
- [ ] GitHub Actions Secrets gesetzt (für Produktion)
- [ ] Produktion auf GitHub Pages getestet

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| "Google-Login wird geladen..." bleibt stehen | GIS-Script blockiert? Prüfe Browser-Console. Ad-Blocker kann `accounts.google.com` blockieren. |
| "popup_closed_by_user" | Popup wurde geschlossen bevor Login abgeschlossen. Nochmals versuchen. |
| "Not a valid origin" | `localhost:5174` oder `github.io` nicht als autorisierter Ursprung in der Cloud Console. |
| "Nicht autorisiert" vom Apps Script | E-Mail-Domain stimmt nicht mit LP_DOMAIN/SUS_DOMAIN überein. |
| "Prüfung nicht gefunden" | Prüfungs-ID in der URL stimmt nicht mit einer Zeile im Configs-Sheet überein. |
| "Kein Zugang" | E-Mail nicht in der Klassenliste für diese Prüfung. |
| CORS-Fehler | Apps Script muss als Web-App deployed sein (nicht als API Executable). Zugriff muss korrekt gesetzt sein. |
| Antworten werden nicht gespeichert | Prüfe ob der Antworten-Ordner existiert und das Apps Script Schreibrechte hat. |

## Teil 6: KI-Korrektur (Claude API)

> Für die Einrichtung des Anthropic API-Keys siehe [docs/CLAUDE_API_SETUP.md](docs/CLAUDE_API_SETUP.md).

### 6.1 Neue Endpoints im Apps Script

Folgende Abschnitte zum bestehenden `doGet` und `doPost` in `Code.gs` hinzufügen:

**In `doGet` — neue Cases:**

```javascript
    case 'ladeKorrektur':
      return ladeKorrektur(e.parameter.id, email);
    case 'ladeAbgaben':
      return ladeAbgaben(e.parameter.id, email);
    case 'korrekturFortschritt':
      return ladeKorrekturFortschritt(e.parameter.id, email);
```

**In `doPost` — neue Cases:**

```javascript
    case 'starteKorrektur':
      return starteKorrekturEndpoint(body);
    case 'speichereKorrekturZeile':
      return speichereKorrekturZeile(body);
    case 'generiereUndSendeFeedback':
      return generiereUndSendeFeedbackEndpoint(body);
    case 'validiereSchuelercode':
      return validiereSchuelercode(body);
```

### 6.2 Claude API Caller

```javascript
// === CLAUDE API ===

function rufeClaudeAuf(systemPrompt, userPrompt) {
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
      max_tokens: 1024,
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

  // JSON aus Antwort extrahieren (Claude kann Markdown-Codeblocks verwenden)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
```

### 6.3 Auto-Korrektur (deterministische Fragetypen)

```javascript
// === AUTO-KORREKTUR ===

function autoBewerteAntwort(frage, antwort) {
  if (!antwort) return { punkte: 0, begruendung: 'Keine Antwort', quelle: 'auto' };

  switch (frage.typ) {
    case 'mc': {
      const korrekte = (frage.optionen || []).filter(o => o.korrekt).map(o => o.id);
      const gewaehlt = antwort.gewaehlteOptionen || [];
      const alleKorrekt = korrekte.every(id => gewaehlt.includes(id));
      const keineFalschen = gewaehlt.every(id => korrekte.includes(id));
      const richtig = alleKorrekt && keineFalschen;
      return {
        punkte: richtig ? frage.punkte : 0,
        begruendung: richtig ? 'Alle Optionen korrekt' : 'Falsche/fehlende Optionen',
        quelle: 'auto'
      };
    }

    case 'richtigfalsch': {
      const aussagen = frage.aussagen || [];
      let korrekt = 0;
      for (const a of aussagen) {
        if (antwort.bewertungen && antwort.bewertungen[a.id] === a.korrekt) korrekt++;
      }
      const punkte = aussagen.length > 0 ? Math.round(frage.punkte * korrekt / aussagen.length * 2) / 2 : 0;
      return {
        punkte,
        begruendung: korrekt + '/' + aussagen.length + ' korrekt',
        quelle: 'auto'
      };
    }

    case 'zuordnung': {
      const paare = frage.paare || [];
      let korrekt = 0;
      for (const p of paare) {
        if (antwort.zuordnungen && antwort.zuordnungen[p.links] === p.rechts) korrekt++;
      }
      const punkte = paare.length > 0 ? Math.round(frage.punkte * korrekt / paare.length * 2) / 2 : 0;
      return {
        punkte,
        begruendung: korrekt + '/' + paare.length + ' korrekt zugeordnet',
        quelle: 'auto'
      };
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
      return {
        punkte,
        begruendung: korrekt + '/' + luecken.length + ' Lücken korrekt',
        quelle: 'auto'
      };
    }

    case 'berechnung': {
      const ergebnisse = frage.ergebnisse || [];
      let korrekt = 0;
      for (const e of ergebnisse) {
        const eingabe = parseFloat(antwort.ergebnisse && antwort.ergebnisse[e.id] || '');
        if (!isNaN(eingabe) && Math.abs(eingabe - e.korrekt) <= (e.toleranz || 0)) korrekt++;
      }
      const punkte = ergebnisse.length > 0 ? Math.round(frage.punkte * korrekt / ergebnisse.length * 2) / 2 : 0;
      return {
        punkte,
        begruendung: korrekt + '/' + ergebnisse.length + ' Ergebnisse korrekt',
        quelle: 'auto'
      };
    }

    case 'freitext':
      return null; // → KI-Korrektur nötig

    default:
      return { punkte: 0, begruendung: 'Unbekannter Fragetyp', quelle: 'auto' };
  }
}
```

### 6.4 Batch-Korrektur Orchestrator

```javascript
// === BATCH-KORREKTUR ===

function starteKorrekturEndpoint(body) {
  try {
    const { pruefungId, email } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) {
      return jsonResponse({ error: 'Nur für Lehrpersonen' });
    }

    // Fortschritt-Tracking initialisieren
    const statusSheet = findOrCreateKorrekturSheet(pruefungId);
    setKorrekturStatus(statusSheet, 'laeuft', 0, 1);

    // Synchron ausführen (passt in 6-Min-Limit für <120 API-Calls)
    batchKorrektur(pruefungId, email, statusSheet);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, fehler: error.message });
  }
}

function batchKorrektur(pruefungId, lpEmail, korrekturSheet) {
  // 1. Config + Fragen laden
  const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
  const configData = getSheetData(configSheet);
  const configRow = configData.find(row => row.id === pruefungId);
  if (!configRow) throw new Error('Prüfung nicht gefunden');

  const abschnitte = safeJsonParse(configRow.abschnitte, []);
  const fragenIds = abschnitte.flatMap(a => a.fragenIds);
  const fragen = ladeFragen(fragenIds);
  const fragenMap = {};
  for (const f of fragen) fragenMap[f.id] = f;

  // 2. Antworten aller SuS laden
  const sheetName = 'Antworten_' + pruefungId;
  const ordner = DriveApp.getFolderById(ANTWORTEN_ORDNER_ID);
  const files = ordner.getFilesByName(sheetName);
  if (!files.hasNext()) {
    setKorrekturStatus(korrekturSheet, 'fehler', 0, 0);
    return;
  }

  const antwortenSheet = SpreadsheetApp.open(files.next()).getSheets()[0];
  const antwortenData = getSheetData(antwortenSheet);

  // 3. Gesamt-Anzahl berechnen
  const gesamt = antwortenData.length * fragenIds.length;
  let erledigt = 0;

  // 4. Pro SuS, pro Frage bewerten
  const korrekturZeilen = [];

  for (const sus of antwortenData) {
    const antworten = safeJsonParse(sus.antworten, {});

    for (const frageId of fragenIds) {
      const frage = fragenMap[frageId];
      if (!frage) { erledigt++; continue; }

      const antwort = antworten[frageId];
      const autoBewertung = autoBewerteAntwort(frage, antwort);

      if (autoBewertung !== null) {
        // Deterministische Bewertung
        korrekturZeilen.push({
          email: sus.email,
          name: sus.name || sus.email,
          frageId: frageId,
          fragenTyp: frage.typ,
          maxPunkte: frage.punkte,
          kiPunkte: autoBewertung.punkte,
          lpPunkte: '',
          kiBegruendung: autoBewertung.begruendung,
          kiFeedback: '',
          lpKommentar: '',
          quelle: autoBewertung.quelle,
          geprueft: 'false',
          status: 'ki-bewertet',
        });
      } else {
        // Freitext → Claude API
        try {
          const systemPrompt = buildKorrekturPrompt(frage);
          const userPrompt = antwort ? antwort.text || '(keine Antwort)' : '(keine Antwort)';
          const kiResult = rufeClaudeAuf(systemPrompt, userPrompt);

          korrekturZeilen.push({
            email: sus.email,
            name: sus.name || sus.email,
            frageId: frageId,
            fragenTyp: frage.typ,
            maxPunkte: frage.punkte,
            kiPunkte: Number(kiResult.punkte) || 0,
            lpPunkte: '',
            kiBegruendung: kiResult.begruendung || '',
            kiFeedback: kiResult.feedback || '',
            lpKommentar: '',
            quelle: 'ki',
            geprueft: 'false',
            status: 'ki-bewertet',
          });
        } catch (err) {
          korrekturZeilen.push({
            email: sus.email,
            name: sus.name || sus.email,
            frageId: frageId,
            fragenTyp: frage.typ,
            maxPunkte: frage.punkte,
            kiPunkte: '',
            lpPunkte: '',
            kiBegruendung: 'API-Fehler: ' + err.message,
            kiFeedback: '',
            lpKommentar: '',
            quelle: 'fehler',
            geprueft: 'false',
            status: 'offen',
          });
        }
      }

      erledigt++;
      if (erledigt % 10 === 0) {
        setKorrekturStatus(korrekturSheet, 'laeuft', erledigt, gesamt);
      }
    }
  }

  // 5. Korrektur-Sheet befüllen
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
```

### 6.5 Hilfs-Funktionen für Korrektur

```javascript
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
  // Status in Zelle Z1 schreiben (ausserhalb der Daten)
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
      // Noch keine Korrektur gestartet
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

    // Config laden
    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);

    // Zeilen nach SuS gruppieren
    const schuelerMap = {};
    for (const row of data) {
      if (!row.email) continue;
      if (!schuelerMap[row.email]) {
        schuelerMap[row.email] = {
          email: row.email,
          name: row.name || row.email,
          bewertungen: {},
          gesamtPunkte: 0,
          maxPunkte: 0,
          korrekturStatus: 'offen',
        };
      }
      const b = {
        frageId: row.frageId,
        fragenTyp: row.fragenTyp || '',
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

    // Status pro SuS bestimmen
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

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ error: error.message });
  }
}
```

### 6.6 PDF-Generierung + E-Mail-Versand

```javascript
// === FEEDBACK PDF + E-MAIL ===

function generiereUndSendeFeedbackEndpoint(body) {
  try {
    const { email, pruefungId, schuelerEmails } = body;
    if (!email || !email.endsWith('@' + LP_DOMAIN)) return jsonResponse({ error: 'Nur für Lehrpersonen' });

    const configSheet = SpreadsheetApp.openById(CONFIGS_ID).getSheetByName('Configs');
    const configRow = getSheetData(configSheet).find(r => r.id === pruefungId);
    if (!configRow) return jsonResponse({ error: 'Prüfung nicht gefunden' });

    // Korrektur-Daten laden
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

        // HTML → PDF via Google Doc
        const tempDoc = DocumentApp.create('Feedback_temp_' + Date.now());
        const tempBody = tempDoc.getBody();
        tempBody.appendParagraph(''); // Workaround: HtmlService nicht direkt in Doc
        tempDoc.saveAndClose();

        // Stattdessen: Blob direkt aus HTML erstellen
        const blob = HtmlService.createHtmlOutput(html).getBlob().setName(
          'Feedback_' + configRow.titel.replace(/[^a-zA-Z0-9äöüÄÖÜ ]/g, '') + '_' + susName.replace(/[^a-zA-Z0-9äöüÄÖÜ ]/g, '') + '.pdf'
        ).getAs('application/pdf');

        // Temp-Doc löschen
        DriveApp.getFileById(tempDoc.getId()).setTrashed(true);

        // PDF in Ordner speichern
        const pdfOrdner = findOrCreatePdfOrdner();
        pdfOrdner.createFile(blob);

        // E-Mail senden
        GmailApp.sendEmail(susEmail,
          'Feedback: ' + configRow.titel,
          'Im Anhang findest du das Feedback zu deiner Prüfung «' + configRow.titel + '».\n\nBei Fragen wende dich bitte an deine Lehrperson.',
          {
            attachments: [blob],
            name: 'Prüfungsplattform WR — Gymnasium Hofwil',
          }
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
```

### 6.7 Nach dem Einfügen

1. **Neues Deployment erstellen** (Bereitstellen → Neue Bereitstellung) — oder bestehende aktualisieren
2. **Berechtigungen neu autorisieren** (GmailApp benötigt zusätzliche Berechtigung für E-Mail-Versand)
3. **Claude API Key als Script Property setzen** (siehe [CLAUDE_API_SETUP.md](docs/CLAUDE_API_SETUP.md))
4. **Testen:** Im Apps Script Editor `testClaudeApi` ausführen

