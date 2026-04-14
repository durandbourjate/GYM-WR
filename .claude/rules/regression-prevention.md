# Regression Prevention — Pflichtworkflow

> **HARD-STOP-REGELN** (nicht verhandelbar, keine Ausnahmen):
> 1. **KEIN Commit auf `main`.** Immer Feature/Fix-Branch.
> 2. **KEIN Merge ohne Browser-Test.** "Mach weiter" = "weiter testen", nicht "weiter mergen".
> 3. **KEIN Browser-Test ohne schriftlichen Test-Plan.** Erst Plan, dann klicken.
> 4. **KEINE Security-Phase ueberspringen.** Phase 4 ist Pflicht, nicht optional.
> 5. **KEIN Raten.** Immer zuerst im Browser verifizieren, dann Code aendern.

## Phase 0: Session-Start (VOR allem anderen)

Jede neue Session beginnt mit diesen Schritten — keine Ausnahmen:

1. **HANDOFF.md lesen** — Was ist der aktuelle Stand? Was steht an?
2. **Arbeitsplan erstellen** — Konkrete Liste: Was wird heute gemacht, in welcher Reihenfolge?
3. **Test-Plan schreiben** (wenn Tests anstehen) — Pro Bug/Feature:
   - Was genau testen?
   - Erwartetes Verhalten (vorher/nachher)?
   - Welche Regressions-Risiken?
   - Welche Security-Aspekte pruefen?
4. **Erst dann** Browser/Tabs oeffnen und arbeiten.

**Token-Budget:** Session-Start (Handoff lesen + Plan) darf max. 5% der Tokens brauchen. Keine ueberfluessigen Screenshots, kein Explorieren ohne Plan.

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
cd ExamLab && npx tsc -b    # TypeScript (CI-aequivalent)
npx vitest run                # Alle Tests
npm run build                 # Build-Test
```

Alle 3 muessen gruen sein BEVOR im Browser getestet wird.

## Phase 3: E2E-Browser-Test (Chrome-in-Chrome)

### 3.0 Test-Plan schreiben (PFLICHT, VOR dem Testen)

Bevor ein Tab geoeffnet wird, muss ein schriftlicher Test-Plan im Chat stehen:

```
## Test-Plan: [Bug/Feature-Name]

### Zu testende Aenderungen
| # | Aenderung | Erwartetes Verhalten | Regressions-Risiko |
|---|-----------|---------------------|-------------------|
| 1 | ... | ... | ... |

### Security-Check fuer diese Aenderung
- [ ] Leakt die Aenderung Loesungsdaten? → Wie pruefen?
- [ ] Ermoelicht sie Rollen-Bypass? → Wie pruefen?
- [ ] Erleichtert sie Fraud? → Wie pruefen?
- [ ] Schwaecht sie bestehende Sicherheit? → Wie pruefen?

### Betroffene kritische Pfade (aus 1.3)
- [ ] Pfad X → Was genau pruefen?

### Regressions-Tests (verwandte Funktionen)
- [ ] ...
```

Ohne diesen Plan: KEIN Testen starten. Das verhindert planloses Durchklicken.

### Setup

- **Echte Logins, KEIN Demo-Modus.** Tests im Demo-Modus sind wertlos — sie testen nicht das Backend, keine API-Calls, keine Authentifizierung, keine Datenbank-Interaktion.
- **Chrome-in-Chrome Tab-Gruppe:** Claude erstellt eine Tab-Gruppe (`tabs_context_mcp` mit `createIfEmpty: true`). Der User loggt Claude in den Tabs ein (LP + SuS). Claude testet erst NACHDEM der User die Logins gemacht hat.
- **Ablauf:**
  1. Claude erstellt Tab-Gruppe und sagt dem User Bescheid
  2. User gibt 2 Tabs in die Gruppe (oder Claude erstellt sie) und loggt ein:
     - Tab 1: LP = wr.test@gymhofwil.ch
     - Tab 2: SuS = wr.test@stud.gymhofwil.ch
  3. User meldet "kannst loslegen"
  4. Claude testet gemaess Test-Plan
- **Kontrollstufe: Locker** (damit Logging/Konsole/Netzwerk pruefbar)
- **Test-Pruefung:** "Einrichtungspruefung — Lerne ExamLab kennen" (enthaelt alle Fragetypen)
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

### Merge-Gate (HARD-STOP)

Bevor `git merge` auf `main` ausgefuehrt wird, muessen ALLE diese Bedingungen erfuellt sein:

- [ ] Browser-Test durchgefuehrt (Phase 3) — mit dokumentiertem Ergebnis
- [ ] Security-Verifikation durchgefuehrt (Phase 4) — mit dokumentiertem Ergebnis
- [ ] LP hat explizit "Merge OK" oder "Freigabe" geschrieben
- [ ] HANDOFF.md ist aktualisiert

**Wenn auch nur ein Punkt fehlt: NICHT mergen.** Stattdessen melden was fehlt.

### Ablauf

1. **Claude meldet: "Bereit fuer LP-Test"** — mit Zusammenfassung:
   - Was geaendert wurde
   - Browser-Test-Ergebnisse (bestanden/fehlgeschlagen)
   - Security-Check-Ergebnisse
   - Offene Punkte / Risiken
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
- Ohne schriftlichen Test-Plan testen
- Ohne Security-Check (Phase 4) mergen
- Ohne LP-Freigabe mergen
- Raten statt im Browser verifizieren
- Security-Massnahmen implementieren die Kernfunktionalitaet blockieren
- Deployen waehrend aktiver Pruefungen
- Session-Start mit Browser-Aktionen bevor Handoff gelesen und Plan erstellt ist
- Planlos durch die Pruefung klicken statt gezielt Bug-spezifisch zu testen
