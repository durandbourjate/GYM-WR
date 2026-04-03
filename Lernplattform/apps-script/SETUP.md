# Lernplattform — Apps Script Setup (Schritt-für-Schritt)

> Zeitaufwand: ca. 10–15 Minuten. Kein Code schreiben nötig, nur Copy-Paste + Klicken.

---

## Schritt 1: Gruppen-Registry Sheet erstellen

Das ist das zentrale Sheet, in dem alle Gruppen (Klassen, Familien) registriert werden.

1. Öffne [Google Sheets](https://sheets.google.com) und erstelle ein **neues leeres Dokument**
2. Benenne es: **Lernplattform: Gruppen-Registry**
3. Kopiere die folgende Zeile und füge sie in **Zelle A1** ein (Ctrl+V / Cmd+V). Google Sheets verteilt die Werte automatisch auf die Spalten A–F:

   ```
   id	name	typ	adminEmail	fragenbankSheetId	analytikSheetId
   ```

   > **Wichtig:** Die Werte sind Tab-getrennt. Falls sie alle in einer Zelle landen: Benutze stattdessen "Daten → Text in Spalten aufteilen" oder trage sie manuell ein: A1=id, B1=name, C1=typ, D1=adminEmail, E1=fragenbankSheetId, F1=analytikSheetId

4. **Sheet-ID kopieren:** Schau in die URL-Leiste. Du siehst etwas wie:
   ```
   https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit
   ```
   Der Teil zwischen `/d/` und `/edit` ist die ID → kopiere ihn (hier: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`)

5. **Diesen Wert merken** — du brauchst ihn gleich in Schritt 2.

---

## Schritt 2: Apps Script Projekt erstellen

1. Öffne [Google Apps Script](https://script.google.com) → Klick auf **"Neues Projekt"**
2. Oben links steht "Unbenanntes Projekt" — klicke drauf und benenne es: **Lernplattform Backend**
3. Du siehst eine Datei `Code.gs` mit dem Inhalt `function myFunction() { }` — **lösche den gesamten Inhalt**
4. Öffne die Datei `lernplattform-backend.js` (im Repo unter `Lernplattform/apps-script/`) und **kopiere den gesamten Inhalt**
5. **Füge ihn in `Code.gs` ein** (ersetze den gelöschten Inhalt)
6. Suche ganz oben im Code diese Zeile:
   ```javascript
   const GRUPPEN_REGISTRY_ID = '';
   ```
7. **Ersetze die leeren Anführungszeichen** mit der Sheet-ID aus Schritt 1:
   ```javascript
   const GRUPPEN_REGISTRY_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ';
   ```
8. **Speichern** (Ctrl+S / Cmd+S)

---

## Schritt 3: Bereitstellen als Web-App

1. Im Apps Script Editor: Klicke oben rechts auf **"Bereitstellen"** → **"Neue Bereitstellung"**
2. Links oben im Dialog: Klicke auf das **Zahnrad-Icon** → wähle **"Web-App"**
3. Fülle aus:
   - **Beschreibung:** `Lernplattform v1.0`
   - **Ausführen als:** `Ich (deine E-Mail)`
   - **Zugriff:** `Alle` (wichtig! Sonst können Kinder mit Code-Login nicht zugreifen)
4. Klicke **"Bereitstellen"**
5. Google fragt nach Berechtigungen:
   - Klicke **"Zugriff autorisieren"**
   - Wähle dein Google-Konto
   - Falls "Diese App wurde nicht von Google überprüft" → Klicke **"Erweitert"** → **"Lernplattform Backend (unsicher) aufrufen"**
   - Klicke **"Zulassen"**
6. Du siehst jetzt die **Web-App-URL** — sie sieht so aus:
   ```
   https://script.google.com/macros/s/AKfycbw.../exec
   ```
7. **Kopiere diese URL** — du brauchst sie im nächsten Schritt.

> **Tipp:** Du kannst die URL jederzeit unter "Bereitstellen → Bereitstellungen verwalten" wiederfinden.

---

## Schritt 4: Frontend konfigurieren

1. Öffne ein Terminal und navigiere zum Lernplattform-Ordner:
   ```bash
   cd "Pfad/zum/Repo/Lernplattform"
   ```

2. Erstelle eine Datei `.env.local` (wird von Git ignoriert):
   ```bash
   echo 'VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbwl6-YLhmDm7QDNMiEXy9Pv56PonzRMxtEA2OHl6tWBpb-VL_9x9lunqd-oA_L200maqw/exec' > .env.local
   ```
   Ersetze `DEINE_URL_HIER` mit der URL aus Schritt 3.

   Die Datei sollte so aussehen:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbw.../exec
   ```

3. Falls der Dev-Server läuft: **stoppen und neu starten** (damit die neue .env gelesen wird):
   ```bash
   npm run dev
   ```

---

## Schritt 5: Testen ob das Backend funktioniert

1. Öffne die Web-App-URL direkt im Browser (die URL aus Schritt 3):
   ```
   https://script.google.com/macros/s/AKfycbw.../exec
   ```
   Du solltest sehen:
   ```json
   {"status":"ok","app":"lernplattform","version":"1.0"}
   ```
   → Backend läuft!

2. Falls du eine Fehlermeldung siehst:
   - **"Script function not found: doGet"** → Code wurde nicht richtig eingefügt, prüfe Schritt 2
   - **"Authorization is required"** → Berechtigungen nicht erteilt, wiederhole Schritt 3.5
   - **"TypeError"** → GRUPPEN_REGISTRY_ID ist falsch, prüfe die Sheet-ID

---

## Schritt 6: Erste Gruppe erstellen (optional, aber empfohlen)

Sobald das Backend läuft, kannst du eine Gruppe anlegen. Am einfachsten via Terminal:

```bash
curl -X POST "DEINE_URL_HIER" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformErstelleGruppe","name":"SF WR 29c","typ":"gym","adminEmail":"yannick.durand@gymhofwil.ch"}'
```

Das erstellt automatisch:
- Einen Eintrag in der Gruppen-Registry
- Ein neues Google Sheet "Lernplattform: SF WR 29c" mit 5 Tabs:
  - **Fragen** (leer — Pool-Import kommt separat)
  - **Mitglieder** (leer — hier SuS eintragen)
  - **Auftraege** (leer)
  - **Fortschritt** (wird automatisch beim Üben befüllt)
  - **Sessions** (wird automatisch befüllt)

Du kannst das neue Sheet in Google Drive finden und öffnen.

---

## Sheets-Struktur (Übersicht)

```
Gruppen-Registry (1 zentrales Sheet)
├── id | name | typ | adminEmail | fragenbankSheetId | analytikSheetId

Pro Gruppe wird automatisch ein Sheet erstellt:
├── Tab "Fragen":       id | fach | thema | typ | schwierigkeit | ... | daten
├── Tab "Mitglieder":   email | name | rolle | code | beigetreten
├── Tab "Auftraege":    id | titel | fach | thema | deadline | aktiv
├── Tab "Fortschritt":  email | fragenId | versuche | richtig | richtigInFolge | mastery | ...
└── Tab "Sessions":     sessionId | email | thema | fach | datum | ergebnis
```

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| 404 bei Web-App-URL | Falsche URL — prüfe ob du die `/exec`-URL hast (nicht `/dev`) |
| "Script function not found" | Code nicht richtig eingefügt — öffne Code.gs und prüfe ob `function doPost` vorhanden ist |
| "Gruppe nicht gefunden" | GRUPPEN_REGISTRY_ID leer oder falsche Sheet-ID |
| "Zugriff verweigert" auf Sheet | Das Apps Script muss unter deinem Account laufen (Schritt 3: "Ausführen als: Ich") |
| Fragen werden nicht geladen | Aktuell werden Pool-Fragen noch lokal via JSON geladen, nicht aus Sheets — das ist Phase 7g |
| Neue Bereitstellung nötig | Nach Code-Änderungen: "Bereitstellen → Bereitstellungen verwalten → Neue Version → Bereitstellen" |

---

## Alle Endpoints (Referenz)

| Aktion | Beschreibung |
|--------|-------------|
| `lernplattformLogin` | OAuth-Login, gibt Token + Gruppen zurück |
| `lernplattformValidiereToken` | Session-Token prüfen |
| `lernplattformCodeLogin` | Login mit 6-stelligem Code (für Kinder) |
| `lernplattformGeneriereCode` | Code für Mitglied generieren (Admin) |
| `lernplattformLadeGruppen` | Alle Gruppen für eine E-Mail |
| `lernplattformErstelleGruppe` | Neue Gruppe + automatische Sheet-Erstellung |
| `lernplattformLadeMitglieder` | Mitglieder einer Gruppe laden |
| `lernplattformEinladen` | Mitglied hinzufügen |
| `lernplattformEntfernen` | Mitglied entfernen |
| `lernplattformLadeFragen` | Fragen laden (mit optionalem Filter) |
| `lernplattformSpeichereFortschritt` | Übungsergebnis + Mastery speichern |
| `lernplattformLadeFortschritt` | Fortschritts-Daten für ein Mitglied |
| `lernplattformLadeAuftraege` | Aufträge einer Gruppe |
| `lernplattformSpeichereAuftrag` | Auftrag erstellen oder aktualisieren |
