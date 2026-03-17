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
cd Pruefung
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
cd Pruefung
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

In `Pruefung/.env.local`:

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
  working-directory: Pruefung
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
cd Pruefung
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
