# ExamLab Problemmeldungen — Setup

Eigenes Google Sheet + Apps Script für ExamLab-Feedback. Trennt sauber von den Übungspool-Analytics.

## Setup

### 1. Neues Google Sheet erstellen
- Drive → Neu → Google Sheets
- **Name:** `ExamLab Problemmeldungen`

### 2. Apps Script anlegen
- Im Sheet: **Erweiterungen → Apps Script**
- Default-Datei `Code.gs` öffnen
- Inhalt komplett ersetzen mit `apps_script_code.js` (gleiches Verzeichnis hier im Repo)
- **Speichern**

### 3. (Optional) Tabs vorab erstellen
- Im Apps Script Editor: Funktion `setupTabs` wählen → ▶️ Ausführen
- Beim ersten Aufruf nach Berechtigungen fragen → erlauben
- Erstellt 6 Tabs: `Pruefen`, `Ueben`, `Fragensammlung`, `Editor`, `App`, `Sonstige`
- Wird übersprungen — Tabs werden auch automatisch beim ersten Eintrag angelegt

### 4. Bereitstellen
- **Bereitstellen → Neue Bereitstellung**
- Typ: **Web-App**
- Beschreibung: `ExamLab Feedback v1`
- Ausführen als: **Ich (yannick.durand@gymhofwil.ch)**
- Zugriff: **Jeder** (anonyme Image-Ping)
- **Bereitstellen** → Berechtigungen erlauben
- **Web-App-URL kopieren** (Form: `https://script.google.com/macros/s/AKfycb…/exec`)

### 5. URL im Frontend hinterlegen
- Datei `Pruefung/src/components/shared/FeedbackModal.tsx` öffnen
- Konstante `FEEDBACK_ENDPOINT` mit der neuen URL ersetzen
- Commit + push → GitHub Actions baut + deployt

### 6. Test
- ExamLab öffnen → irgendeine Frage → Feedback-Button
- Problem oder Wunsch melden
- Im Sheet: Tab `Pruefen` (oder passender) sollte einen Eintrag haben

## Spaltenstruktur (16 Spalten)

| # | Spalte | Inhalt |
|---|--------|--------|
| 1 | Zeitstempel | yyyy-MM-dd HH:mm:ss (Europe/Zurich) |
| 2 | Rolle | `lp` oder `sus` |
| 3 | Ort | z.B. `frage-pruefen`, `ueben-dashboard`, `editor` |
| 4 | Modus | `pruefen` / `ueben` / `fragensammlung` |
| 5 | Typ | `problem` / `wunsch` |
| 6 | Kategorie | z.B. "Fachlicher Fehler", "Bedienung/UX" |
| 7 | Kommentar | Freitext der LP/SuS |
| 8 | Frage-ID | falls Meldung zu konkreter Frage |
| 9 | Fragetext | Auszug der Frage (max. 200 Zeichen) |
| 10 | Fragetyp | mc, freitext, buchungssatz, … |
| 11 | Prüfung-ID | falls aus Prüfungs-Kontext |
| 12 | Gruppe-ID | falls aus Üben-Kontext |
| 13 | Bildschirm | UI-Position |
| 14 | App-Version | Build-Datum |
| 15 | E-Mail | (aktuell leer — Privacy) |
| 16 | Zusatzinfo | Freie Metadaten |

## Routing (Ort → Tab)

Der Apps Script ordnet jede Meldung anhand des `ort`-Werts einem Tab zu:
- `frage-pruefen` / `pruef…` → **Pruefen**
- `frage-ueben` / `ueben…` → **Ueben**
- `fragensammlung…` → **Fragensammlung**
- `editor…` → **Editor**
- `app…` / `login` / `settings` → **App**
- alles andere → **Sonstige**

Erweiterung: `ortZuTab_()` in `apps_script_code.js` anpassen.

## Updates am Apps Script

Wenn Spalten oder Routing geändert werden:
1. Code im Apps Script Editor aktualisieren
2. **Speichern**
3. **Bereitstellen → Bereitstellungen verwalten → Bearbeiten (Stift) → Neue Version → Bereitstellen**
4. URL bleibt gleich — kein Frontend-Update nötig

## Migration vom alten Endpoint

Der alte Endpoint (`AKfycby9-…`, geteilt mit Übungspool-Analytics) war nie für ExamLab redeployed worden — die Reports der LP gingen ins Leere. Mit diesem neuen Sheet startet das Reporting frisch.

Falls die alten Reports wiederherstellbar wären (sie sind es nicht — `doGet` schrieb nichts ohne entsprechenden Branch), würde das alte Sheet `uebungspool_analyse` den Tab `Pruefung-Feedback` enthalten. Tut es laut Test nicht.
