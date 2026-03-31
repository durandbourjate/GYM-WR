# Regression Prevention — Pflichtworkflow (ab Session 39)

## Phase 1: Analyse & Planung (VOR jeder Code-Aenderung)

### 1.1 Bug/Feature klar definieren

- Was genau soll sich aendern?
- Was darf sich NICHT aendern?
- **Funktionalitaet bewahren:** Keine zu breiten/strikten Sicherheitsloesungen die wichtige Funktionen blockieren. Beispiel: Rate Limiting das normale Nutzung verhindert, Validierung die legitime Daten ablehnt, CSP die benoetigte Ressourcen blockiert.

### 1.2 Impact-Analyse (PFLICHT)

Bevor eine Funktion/Datei geaendert wird:

```bash
# Alle Aufrufer der betroffenen Funktion finden
grep -rn "funktionsname" src/
```

- **Shared Code** (apiClient, pruefungApi, Stores, Utils): ALLE Aufrufer identifizieren
- **Komponenten**: Pruefen ob Props sich aendern und wer sie nutzt
- **Backend (apps-script-code.js)**: Alle Aktionen pruefen die betroffene Hilfsfunktionen nutzen
- Ergebnis der Impact-Analyse als Kommentar im Chat dokumentieren

### 1.3 Kritische Pfade identifizieren

Diese 5 Pfade brechen am haeufigsten. Bei JEDER Aenderung pruefen ob sie betroffen sind:

| # | Kritischer Pfad | Beteiligte Dateien |
|---|----------------|-------------------|
| 1 | **SuS laedt Pruefung** | pruefungApi.ts, apiClient.ts, pruefungStore.ts, App.tsx |
| 2 | **SuS Heartbeat + Auto-Save** | pruefungApi.ts, apiClient.ts, Timer.tsx, apps-script-code.js |
| 3 | **SuS Abgabe** | AbgabeDialog.tsx, pruefungApi.ts, apps-script-code.js |
| 4 | **LP Monitoring** | usePruefungsMonitoring.ts, SchuelerZeile.tsx, apps-script-code.js |
| 5 | **LP Korrektur + Auto-Korrektur** | useKorrekturDaten.ts, korrekturUtils.ts, KorrekturFrageVollansicht.tsx |

### 1.4 Security/Privacy/Fraud-Check

Vor der Implementierung pruefen:
- Kann die Aenderung Loesungsdaten leaken?
- Kann die Aenderung Rollen-Bypass ermoeglichen?
- Kann die Aenderung Fraud erleichtern (Timer, Antwort-Injection)?
- Wird die Aenderung bestehende Sicherheitsmassnahmen abschwaechen?

### 1.5 Plan dokumentieren

Plan im Chat dokumentieren BEVOR Code geschrieben wird. Kein Raten, kein Ausprobieren.

## Phase 2: Implementierung (Feature Branch)

1. `git checkout -b fix/beschreibung` oder `feature/beschreibung`
2. Minimale Aenderung — nur was noetig ist, kein Verschlimmbessern
3. Lokale Pruefung:

```bash
cd Pruefung && npx tsc -b    # TypeScript (CI-aequivalent)
npx vitest run                # Alle Tests
npm run build                 # Build-Test
```

Alle 3 muessen gruen sein BEVOR im Browser getestet wird.

## Phase 3: E2E-Browser-Test (Chrome-in-Chrome)

### Setup

- **Kontrollstufe: Locker** (damit Logging/Konsole/Netzwerk pruefbar)
- **Test-Pruefung:** "Einrichtungspruefung — Lerne das Pruefungstool kennen" (enthaelt alle Fragetypen)
- **Test-Accounts:** LP = wr.test@gymhofwil.ch, SuS = wr.test@stud.gymhofwil.ch
- LP muss den Test-SuS in der Lobby hinzufuegen

### LP-Testpfad

1. Dashboard → Kurs-Auswahl → Pruefung laden
2. Lobby → Test-SuS hinzufuegen → Live schalten
3. Monitoring pruefen: SuS sichtbar, Fortschritt, Status, Frage-Nummer
4. Material oeffnen (PDF im iframe)
5. Nach SuS-Abgabe: Auswertung → Auto-Korrektur → Manuelle Korrektur

### SuS-Testpfad

**Immer testen: Betroffene Fragetypen + verwandte Fragetypen mit gleichen Charakteristiken.**

Verwandtschaftsgruppen (wenn einer betroffen → alle der Gruppe testen):

| Gruppe | Fragetypen | Gemeinsames Merkmal |
|--------|-----------|---------------------|
| **Bild/Medien** | PDF-Annotation, Hotspot, Bildbeschriftung, DragDrop-Bild, Zeichnen | Canvas, Bild-Rendering, Touch |
| **Material/Anhaenge** | Alle mit verlinktem Material (Bilder, PDFs) | iframe, CSP, Drive-URLs |
| **Audio/Video** | Audio-Aufnahme | MediaRecorder, Codec, Blob |
| **Spezial-Editoren** | Code-Editor, Formel-Editor | Externe Libraries, Keyboard-Events |
| **Sortierung/DnD** | Sortierung, DragDrop-Bild | Drag-Events, Touch-Kompatibilitaet |
| **FiBu** | Buchungssatz, T-Konto, Bilanz/ER, Kontenbestimmung | Tabellarische Eingabe |
| **Standard** | MC, R/F, Freitext, Lueckentext, Zuordnung, Berechnung | Selten betroffen |

**Uebliche Verdaechtige (besonders gruendlich testen):**
- PDF-Annotation (Werkzeuge: Stift, Textmarker, Textfeld, Kommentar, Radierer, Farbe, Zoom)
- Audio-Aufnahme (Aufnahme + Playback)
- Sortierung (Drag & Drop)
- DragDrop-Bild (Labels platzieren)
- Aufgaben mit Material (Bilder, PDFs — haeufig Probleme mit Verlinkung/Anzeige)
- Zeichnen/Stifteingabe (Werkzeuge: Stift, Farbe, Groesse, Radierer, Rueckgaengig)
- Code-Editor (Tippen, Syntax-Highlighting)
- Formel-Editor (LaTeX-Eingabe, Operatoren)

**Immer pruefen (egal welche Aenderung):**
- Navigation (Sidebar, Weiter/Zurueck, Unsicher-Markierung)
- Timer + Auto-Save Indikator ("Gespeichert")
- Abgabe-Dialog → Bestaetigungsseite
- Material oeffnen (Anhaenge, externe PDFs)

### Nach dem Test pruefen

- Console: keine Errors (nur erwartete Warnings)
- Network: alle API-Calls 200 (kein 401/403/500)
- Antworten im Backend korrekt gespeichert (Heartbeat-Daten intakt)

## Phase 4: Security-Verifikation

Nach jeder Aenderung diese Checkliste durchgehen:

- [ ] SuS-Response enthaelt KEINE Loesungsfelder (korrekt, musterlosung, bewertungsraster, korrekteAntworten, toleranz)
- [ ] LP-Response enthaelt ALLE Felder (korrekt, musterlosung, etc.)
- [ ] Session-Token wird bei ALLEN API-Calls mitgesendet (GET + POST)
- [ ] `restoreSession()` validiert Rolle aus E-Mail-Domain
- [ ] `speichereAntworten` blockiert bei status=beendet
- [ ] Drive-File-Zugriff nur aus erlaubten Ordnern
- [ ] IDOR-Schutz: Token muss zur angefragten E-Mail passen
- [ ] Rate Limiting funktioniert (ohne legitime Nutzung zu blockieren)
- [ ] Keine neuen localStorage-Persistierungen von sensitiven Daten
- [ ] Kein neuer Code der Fraud erleichtert

## Phase 5: Review & Merge

1. **Claude meldet: "Bereit fuer LP-Test"** — mit Zusammenfassung was geaendert wurde
2. **LP testet im Browser** (deployed via `npm run preview` oder Feature-Branch)
3. **Erst nach LP-Freigabe:**
   - `git checkout main && git merge feature/...`
   - HANDOFF.md aktualisieren
   - `git push`
4. Apps Script Deploy nur wenn Backend geaendert (User muss manuell deployen)
5. Branch aufraeumen: `git branch -d feature/...`

## Spezialregeln

### Shared Functions aendern

Wenn `apiClient.ts`, `pruefungApi.ts`, `korrekturUtils.ts` oder `apps-script-code.js` geaendert werden:
- JEDEN einzelnen Aufrufer durchgehen
- Pruefen ob die Aenderung fuer LP UND SuS korrekt ist
- Pruefen ob die Aenderung fuer ALLE Fragetypen korrekt ist

### Neue Felder/Parameter hinzufuegen

- Default-Werte definieren (Backwards Compatibility)
- Pruefen ob bestehende Aufrufer das neue Feld ignorieren koennen
- Backend UND Frontend gleichzeitig anpassen (nicht nur eins)

### CSS/Layout aendern

- Light Mode UND Dark Mode pruefen
- Desktop UND Mobile/iPad pruefen (mindestens visuell)
- Sticky-Elemente und overflow-Verhalten auf iOS beachten

### NIE

- Direkt auf `main` committen
- Ohne Browser-Test mergen
- Raten statt im Browser verifizieren
- Security-Massnahmen implementieren die Kernfunktionalitaet blockieren
- Deployen waehrend aktiver Pruefungen
