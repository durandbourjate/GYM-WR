# SEB-Konfiguration — Prüfungsplattform Gymnasium Hofwil

## Dateien

| Datei | Beschreibung |
|-------|-------------|
| `GymHofwil_Pruefung.seb` | SEB-Konfiguration (verschlüsselt, für Schüler) |
| `GymHofwil_Pruefung_Konfig.xml` | Klartext-Vorlage zum Importieren in SEB Config Tool |
| `README.md` | Diese Anleitung |

## Wichtig: .seb-Datei erstellen

Die `.seb`-Datei muss mit dem **SEB Config Tool** erstellt werden (nicht von Hand). Die XML-Vorlage kann dort importiert und als verschlüsselte `.seb`-Datei exportiert werden.

### Schritt-für-Schritt

1. **SEB Config Tool** herunterladen und installieren:
   - macOS: [safeexambrowser.org/download](https://safeexambrowser.org/download_en.html)
   - Windows: Im SEB-Installationspaket enthalten

2. **XML-Vorlage importieren:**
   - SEB Config Tool öffnen
   - File → Open → `GymHofwil_Pruefung_Konfig.xml` wählen
   - Die Einstellungen werden geladen

3. **Start-URL anpassen:**
   - Unter «General» → «Start URL» die Prüfungs-URL eingeben:
     - Produktion: `https://durandbourjate.github.io/GYM-WR-DUY/Pruefung/?id=PRUEFUNGS_ID`
     - Ersetze `PRUEFUNGS_ID` mit der effektiven ID aus dem Configs-Sheet

4. **Passwort setzen (optional):**
   - Unter «General» → «Settings Password» ein Admin-Passwort setzen
   - Verhindert, dass SuS die SEB-Config ändern

5. **Exportieren:**
   - File → Save As → `.seb`-Datei speichern
   - Option: «Encrypt with settings password» aktivieren

6. **Verteilen:**
   - Die `.seb`-Datei per LearningView / Teams / E-Mail an SuS senden
   - SuS doppelklicken die Datei → SEB startet automatisch mit der Prüfung

## SEB-Einstellungen (Erklärung)

### Sicherheit
- **URL-Filter:** Nur `durandbourjate.github.io` und Google-Services erlaubt
- **Rechtsklick:** Deaktiviert
- **Taskbar/Dock:** Versteckt (kein Alt+Tab möglich)
- **Zwischenablage:** Nur innerhalb der Prüfung (kein Copy-Paste von aussen)
- **Screenshots:** Blockiert
- **Spell-Check:** Deaktiviert (damit nicht die Antworten korrigiert werden)
- **Navigation:** Zurück/Vorwärts deaktiviert (nur innerhalb der App navigieren)

### Erlaubte URLs
- `*.github.io` — Prüfungsplattform
- `*.googleapis.com` — Google API (OAuth, Sheets)
- `*.google.com` — Google Login
- `accounts.google.com` — OAuth-Flow
- `script.google.com` — Apps Script Backend

### Entwicklung & Test
- Für lokale Tests: Start-URL auf `http://localhost:5174/?id=...` ändern
- Oder: `sebErforderlich: false` in der PruefungsConfig setzen
