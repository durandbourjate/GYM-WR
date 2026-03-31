# Regression Prevention — Pflichtworkflow

## Vor jeder Code-Änderung

### 1. Impact-Analyse (PFLICHT)

Bevor eine Funktion/Datei geändert wird:

```bash
# Alle Aufrufer der betroffenen Funktion finden
grep -rn "funktionsname" src/
```

- **Shared Code** (apiClient, pruefungApi, Stores, Utils): ALLE Aufrufer identifizieren
- **Komponenten**: Prüfen ob Props sich ändern und wer sie nutzt
- **Backend (apps-script-code.js)**: Alle Aktionen prüfen die betroffene Hilfsfunktionen nutzen
- Ergebnis der Impact-Analyse als Kommentar im Chat dokumentieren

### 2. Kritische Pfade identifizieren

Diese 5 Pfade brechen am häufigsten. Bei JEDER Änderung prüfen ob sie betroffen sind:

| # | Kritischer Pfad | Beteiligte Dateien |
|---|----------------|-------------------|
| 1 | **SuS lädt Prüfung** | pruefungApi.ts, apiClient.ts, pruefungStore.ts, App.tsx |
| 2 | **SuS Heartbeat + Auto-Save** | pruefungApi.ts, apiClient.ts, Timer.tsx, apps-script-code.js |
| 3 | **SuS Abgabe** | AbgabeDialog.tsx, pruefungApi.ts, apps-script-code.js |
| 4 | **LP Monitoring** | usePruefungsMonitoring.ts, SchuelerZeile.tsx, apps-script-code.js |
| 5 | **LP Korrektur + Auto-Korrektur** | useKorrekturDaten.ts, korrekturUtils.ts, KorrekturFrageVollansicht.tsx |

### 3. Security-Invarianten (NIE brechen)

Diese Bedingungen MÜSSEN nach jeder Änderung weiterhin gelten:

- [ ] SuS-Response enthält KEINE Lösungsfelder (korrekt, musterlosung, bewertungsraster, korrekteAntworten, toleranz)
- [ ] LP-Response enthält ALLE Felder (korrekt, musterlosung, etc.)
- [ ] Session-Token wird bei ALLEN API-Calls mitgesendet (GET + POST)
- [ ] `restoreSession()` validiert Rolle aus E-Mail-Domain
- [ ] `speichereAntworten` blockiert bei status=beendet
- [ ] Drive-File-Zugriff nur aus erlaubten Ordnern
- [ ] IDOR-Schutz: Token muss zur angefragten E-Mail passen

## Nach jeder Code-Änderung

### 4. Test-Reihenfolge (PFLICHT)

```bash
# 1. TypeScript-Kompilierung (CI-äquivalent)
cd Pruefung && npx tsc -b

# 2. Alle Tests
npx vitest run

# 3. Build-Test (fängt Import-Fehler etc.)
npm run build
```

Alle 3 müssen grün sein BEVOR im Browser getestet wird.

### 5. Browser-Verifikation

Bei Änderungen an kritischen Pfaden (siehe Tabelle oben): Chrome-in-Chrome Test.
NICHT RATEN — immer im Browser verifizieren.

Minimaler Check:
- LP kann Monitoring öffnen und sieht SuS
- SuS kann Prüfung laden und Fragen beantworten
- Auto-Save funktioniert ("Gespeichert ✓")
- Abgabe funktioniert

## Spezialregeln

### Shared Functions ändern

Wenn `apiClient.ts`, `pruefungApi.ts`, `korrekturUtils.ts` oder `apps-script-code.js` geändert werden:
- JEDEN einzelnen Aufrufer durchgehen
- Prüfen ob die Änderung für LP UND SuS korrekt ist
- Prüfen ob die Änderung für ALLE Fragetypen korrekt ist

### Neue Felder/Parameter hinzufügen

- Default-Werte definieren (Backwards Compatibility)
- Prüfen ob bestehende Aufrufer das neue Feld ignorieren können
- Backend UND Frontend gleichzeitig anpassen (nicht nur eins)

### CSS/Layout ändern

- Light Mode UND Dark Mode prüfen
- Desktop UND Mobile/iPad prüfen (mindestens visuell)
- Sticky-Elemente und overflow-Verhalten auf iOS beachten
