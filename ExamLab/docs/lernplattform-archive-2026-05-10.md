# Lernplattform-Archive — Setup-Doku (historisch, 10.05.2026)

> **Archiv-Header.** Dieser Inhalt stammt aus dem gelöschten Verzeichnis
> `ExamLab/apps-script-lernen/` (Pre-Fusion-Phase-6-Legacy, Commit `cf7d2eb`
> 05.04.2026). Die Quell-Files (`lernplattform-backend.js`, `SETUP.md`,
> `COPY-PASTE-HILFE.md`) wurden im Rahmen von Bundle „Legacy-Naming-Cleanup"
> Phase 3 (10.05.2026) entfernt, weil:
>
> 1. **Backend-Fusion abgeschlossen.** Die Lernplattform-Endpoints sind seit
>    Commit `cf7d2eb` (05.04.2026, "Lernplattform/ gelöscht, Dateien
>    verschoben") **vollständig in `ExamLab/apps-script-code.js` integriert**.
>    Es gibt nur **ein** Apps-Script-Projekt, nicht zwei. Der frühere
>    Standalone-Backend `lernplattform-backend.js` ist obsolet.
> 2. **Sheet-Prefix-Rename.** Was die Files als `'Lernplattform: '` benannt
>    haben, heißt im aktiven Backend seit Bundle „Legacy-Naming-Cleanup"
>    Phase 2 (10.05.2026) `'ExamLab: '`.
> 3. **Wire-Vertrag-Rename.** Die Action-Strings `lernplattform*` heißen
>    post-Phase-2 mit `ueben`-Präfix statt `lernplattform`-Präfix (z.B.
>    `lernplattformErstelleGruppe` → `uebenErstelleGruppe`,
>    `lernplattformGeneriereCode` → `uebenGeneriereCode`,
>    `lernplattformLogin` → `uebenLogin`).
>
> **Was hier noch operativ relevant ist** (post-Fusion-gültig):
> - **Gruppen-Registry-Sheet-Schema** (Header A1: `id | name | typ |
>   adminEmail | fragenbankSheetId | analytikSheetId`). Das aktive Backend
>   nutzt diesen Header weiterhin via Konstante `GRUPPEN_REGISTRY_ID` in
>   `apps-script-code.js:118`.
> - **Per-Gruppe-Sheet-Tab-Struktur** (`Fragen | Mitglieder | Auftraege |
>   Fortschritt | Sessions`). Wird vom aktiven Backend automatisch beim
>   `erstelleGruppe`-Endpoint angelegt.
> - **Endpoint-Konzepte** (Login mit Code, Mitglieder-Einladung,
>   Fortschritts-Speicherung). Die *Konzepte* sind aktuell — die
>   *Action-String-Namen* sind veraltet (siehe Punkt 3 oben).
>
> **Was hier NICHT mehr operativ ist:**
> - Anweisungen ein separates "Lernplattform Backend"-Apps-Script-Projekt zu
>   erstellen — es gibt nur das eine Hauptbackend (siehe
>   `Google_Workspace_Setup.md` Teil 3).
> - Verweise auf `Lernplattform/apps-script/`-Pfade — Verzeichnis existiert
>   nicht mehr.
> - `Lernplattform: `-Sheet-Namen → heute `ExamLab: ` (Phase 2.2).
> - `lernplattform*`-Action-Strings → heute ohne Präfix (Phase 2.4–2.9).

Die folgenden zwei Sections sind die Original-Inhalte der gelöschten Files,
unverändert übernommen für historische Nachvollziehbarkeit.

---

## Original: `apps-script-lernen/SETUP.md`

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

---

## Original: `apps-script-lernen/COPY-PASTE-HILFE.md`

# Copy-Paste Blöcke für das Setup

> Alle Inhalte hier sind bereit zum direkten Einfügen (Copy-Paste in Sheets oder Terminal).

---

## 1. Gruppen-Registry Header (→ in Zelle A1 einfügen)

```
id	name	typ	adminEmail	fragenbankSheetId	analytikSheetId
```

---

## 2. Code für Apps Script (→ gesamten Inhalt von Code.gs ersetzen)

Datei: `lernplattform-backend.js` — den gesamten Inhalt kopieren und in Code.gs einfügen.

---

## 3. .env.local Inhalt (→ als Datei im Lernplattform-Ordner speichern)

Nach dem Deployment die URL eintragen:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec
```

---

## 4. Test-Befehl (→ im Terminal ausführen)

Backend-Gesundheitscheck:

```bash
curl "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec"
```

Erwartete Antwort: `{"status":"ok","app":"lernplattform","version":"1.0"}`

---

## 5. Erste Gruppe erstellen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformErstelleGruppe","name":"SF WR 29c","typ":"gym","adminEmail":"yannick.durand@gymhofwil.ch"}'
```

---

## 6. Familie-Gruppe erstellen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformErstelleGruppe","name":"Familie Durand","typ":"familie","adminEmail":"yannick.durand@gymhofwil.ch"}'
```

---

## 7. Kind als Mitglied einladen (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformEinladen","gruppeId":"familie-durand","email":"kind1@familie.local","name":"Kind 1"}'
```

---

## 8. Code generieren für Kind (→ im Terminal ausführen)

```bash
curl -X POST "https://script.google.com/macros/s/HIER_DEPLOYMENT_ID/exec" \
  -H "Content-Type: text/plain" \
  -d '{"action":"lernplattformGeneriereCode","gruppeId":"familie-durand","email":"kind1@familie.local"}'
```

Antwort enthält den 6-stelligen Code (z.B. `{"success":true,"data":{"code":"HK7N3P"}}`).
