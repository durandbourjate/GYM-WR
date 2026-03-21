# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

## Aktueller Stand

**Phase 5g: FiBu UI-Fixes** (21.03.2026) — FiBu-Editor Design-Korrekturen ✅

### Session 21.03.2026 — FiBu UI-Fixes

#### Design-Korrekturen (3 Commits)
- **KontenSelect Dropdown**: Highlight von Blau auf neutrales Slate geändert, Konten-Kategoriefarben (aktiv=amber, passiv=blau, aufwand=rot, ertrag=grün) als Zeilen-Hintergrund + Badge
- **BilanzEREditor**: Aktiven-Seite amber-Hintergrund, Passiven-Seite blau-Hintergrund in Musterlösung; Bewertungsoptionen in Bewertungsraster integriert (kein separater Abschnitt)
- **TKontoEditor**: Bewertungsoptionen in Bewertungsraster integriert via `extraContent`-Prop in BewertungsrasterEditor
- **FragenEditor**: Musterlösung-Textfeld für FiBu-Typen ausgeblendet, KI-Buttons (`titelRechts`) an alle FiBu-Editoren, `overscroll-contain` auf Scroll-Container
- **input-field-narrow CSS**: Neue Utility-Klasse ohne `w-full` — behebt Bug wo `input-field` mit `@apply w-full` explizite Breiten (`w-24`, `w-28`, `w-36`) überschrieb. Betroffen: KontenbestimmungEditor, TKontoEditor, BuchungssatzEditor, BerechnungEditor, RichtigFalschEditor, ConfigTab
- **Alle focus-Ringe**: Von Blau auf Slate (neutrales Farbschema)

### Session 21.03.2026 — FiBu-Fragetypen & Aufgabengruppe

#### Neue Fragetypen
- **Buchungssatz**: Geschäftsfälle → Soll/Haben mit Konten-Dropdowns (KMU-Kontenrahmen), compound entries, Auto-Korrektur
- **T-Konto**: T-Form-Layout, 5 Bewertungskriterien (Beschriftung, Kategorie, Zunahme/Abnahme, Buchungen, Saldo), Auto-Korrektur
- **Kontenbestimmung**: Tabelle Geschäftsfall → Konto/Kategorie/Seite, 3 Modi (konto_bestimmen, kategorie_bestimmen, gemischt), Auto-Korrektur
- **Bilanz/ER**: Zweispalten-Bilanz + mehrstufige Erfolgsrechnung, 8 Bewertungskriterien, Auto-Korrektur
- **Aufgabengruppe** (generisch): Bündelt Teilaufgaben unter gemeinsamem Kontext, Rekursionsschutz, fächerübergreifend nutzbar

#### Shared Infrastructure
- `src/data/kontenrahmen-kmu.json`: 76 Konten des Schweizer KMU-Kontenrahmen
- `src/utils/kontenrahmen.ts`: Such-, Filter-, Label-Funktionen
- `src/components/shared/KontenSelect.tsx`: Wiederverwendbare Konto-Auswahl (eingeschränkt/voll)
- `src/utils/fibuAutoKorrektur.ts`: Regelbasierte Auto-Korrektur für alle FiBu-Typen

#### KI-Aktionen (7 neue)
generiereKontenauswahl, generiereBuchungssaetze, pruefeBuchungssaetze, generiereTKonten, generiereKontenaufgaben, generiereBilanzStruktur, generiereFallbeispiel

#### Integration
Alle Typen integriert in: Layout.tsx, FragenEditor.tsx, VorschauTab.tsx, KorrekturSchuelerZeile.tsx, FragenBrowser.tsx, apps-script-code.js

#### Musterlösung-Autogenerierung
Beim Speichern von FiBu-Fragen wird das `musterlosung`-Textfeld automatisch aus den strukturierten Daten generiert (Schweizer Zahlenformat mit Apostroph). Vier Helper-Funktionen in FragenEditor.tsx: `generiereMuserloesungBuchungssatz`, `generiereMuserloesungTKonto`, `generiereMuserloesungKontenbestimmung`, `generiereMuserloesungBilanzER`.

#### Hinweise
- Nach Code-Änderungen in apps-script-code.js: In Apps Script Editor kopieren + neue Bereitstellung
- FragenEditor.tsx ist auf ~1680 Zeilen gewachsen — Kandidat für Split bei nächstem Feature
- KI-Buttons (KIFiBuButtons.tsx) sind erstellt, aber noch nicht in die Editor-Rendering-Blöcke eingebaut

### Änderungen (21.03.2026) — T-Konto-Fragetyp

**T-Konto-Fragetyp** (3 Tasks) — Neuer FiBu-Fragetyp für T-Konten-Buchungen:
- **Task 7 — Student Component:** `TKontoFrage.tsx` mit T-Form-Layout (Soll/Haben), KontenSelect für Gegenkonten, optionale Beschriftungs-Dropdowns, Kontenkategorie-Dropdown, Anfangsbestand (vorgegeben oder editierbar), Saldo-Eingabe. Registriert in `Layout.tsx`.
- **Task 8 — Editor Component:** `TKontoEditor.tsx` mit Aufgabentext, Geschäftsfälle-Liste, Kontenauswahl (voll/eingeschränkt), 5 Bewertungsoptionen (Checkboxen), Musterlösung mit T-Konto-Karten (Kontonummer, Anfangsbestand, Einträge, Saldo). Registriert in `FragenEditor.tsx` inkl. State, Validierung, Save-Case, Type-Selector.
- **Task 9 — Integration:** VorschauTab (Zeitschätzung + TKontoVorschau), KorrekturSchuelerZeile (antwortAlsText), FragenBrowser (Typ-Filter), apps-script-code.js (row-to-object + getTypDaten + fragetext-Mapping), fibuAutoKorrektur.ts (`korrigiereTKonto` mit 4 Bewertungskriterien: Beschriftung, Kontenkategorie, Buchungen, Saldo).
- **Typen:** `TKontoFrage`, `TKontoDefinition`, `TKontoBewertung`, `TKontoEintrag` (in fragen.ts), Antwort-Typ `tkonto` (in antworten.ts) — waren bereits definiert.
- **Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen

### Änderungen (21.03.2026) — Pool-Rück-Sync

**Pool-Rück-Sync** (8 Tasks) — Bidirektionaler Sync: Änderungen an Pool-Fragen zurückschreiben + neue Fragen in Pools exportieren:
- **poolExporter.ts:** Reverse Type Mapping (Prüfungstool → Pool-Format), 7 Typen (mc/multi/tf/fill/calc/sort/open)
- **berechneRueckSyncDiff:** Feld-für-Feld Vergleich (Fragetext, Erklärung, Bloom, Schwierigkeit, Optionen, Korrekt, Spezifisch)
- **RueckSyncDialog.tsx:** Zwei-Modus-Dialog — Update mit Feld-Checkboxen / Export mit Pool+Topic-Wahl
- **FragenEditor Buttons:** "↑ An Pool" (Update bestehender Pool-Frage) + "↑ In Pool exportieren" (neue Frage)
- **FragenBrowser:** "↑ Pool-Export" Batch-Button (Platzhalter für Phase 2)
- **Apps Script Backend:** `schreibePoolAenderung` Endpoint — GitHub Contents API (GET/PUT), JS-Parsing mit Bracket-Depth-Counting, SHA-256 Content-Hash identisch zum Frontend
- **GitHub API:** Fine-Grained PAT als Apps Script Script Property (`GITHUB_TOKEN`), repo contents read/write Scope
- **Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen
- **Wichtig:** `GITHUB_TOKEN` muss als Script Property konfiguriert werden (Projekteinstellungen → Skripteigenschaften)

### Änderungen (21.03.2026) — Bugfixes + Pool-Fragen-Korrekturen

**3 Code-Bugfixes** (kritisch):
- **RueckSyncDialog nicht klickbar:** Dialog war innerhalb des `pointer-events-none` Containers von FragenEditor gerendert → Buttons (Abbrechen, Senden) nicht klickbar. Fix: Dialog via React Fragment (`<>...</>`) ausserhalb des Containers gerendert (`FragenEditor.tsx`)
- **Pool-Sync erkennt Bild-Änderungen nicht:** `img`-Feld fehlte im SHA-256 Content-Hash → Pools mit geänderten Bildern wurden als "up to date" angezeigt. Fix: `img` in `berechneContentHash` (poolSync.ts) + `berechnePoolContentHash` (apps-script-code.js) + `extrahiereFrageFelder` hinzugefügt
- **144 Updates angezeigt aber kein Übernehmen-Button:** `PoolSyncDialog` speicherte nur `neueFragen`, nicht `aktualisierteFragen` → Button nur bei neuen Fragen sichtbar. Fix: `aktualisierteFragen` gespeichert + gesendet, Button zeigt bei neuen ODER aktualisierten Fragen, Backend schreibt `anhaenge` bei Updates

**4 Pool-Fragen korrigiert** (SuS-Meldungen):
- `vwl_sozialpolitik.js` s02: 3. Säule = "Individuelle Ergänzung" statt "Deckung des Komfortbedarfs"
- `vwl_staatsverschuldung.js` a06: Prozentangaben aus MC-Optionen entfernt (veraltet)
- `vwl_steuern.js` q13: "Staatseinnahmen (Fiskalquote)" statt "Steuereinnahmen", Erklärung präzisiert
- `vwl_staatsverschuldung.js` e03: Kreuzakzeptanz für Einkommen/Vermögen-Lücken

**Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen (img-Hash + anhaenge-Sync)

### Änderungen (21.03.2026) — Bugfix Pool-Sync

**Pool-Sync Bugfixes** (kritisch):
- **CORE BUG:** Bestehende Fragenbank-Tabs (VWL, BWL, Recht) hatten keine Pool-Spalten (`poolId`, `poolContentHash`, etc.) — `importierePoolFragen` erstellte diese nur für NEUE Tabs. Fix: Auto-Migration in `apps-script-code.js` fügt fehlende Spalten automatisch hinzu
- **17 Pool-Dateien repariert:** Fehlende Kommas nach `tax: "K1"` vor `reviewed:false` → SyntaxError. Plus fehlende `id` in `POOL_META` → Validierungsfehler. Betroffen: alle BWL, Recht, vwl_geld, vwl_konjunktur Pools
- **Batch-Import:** Statt alle ~2062 Fragen in einem API-Call → 50er-Batches (Apps Script 6-Min-Timeout)
- **Progressbar:** Fortschrittsanzeige mit Prozent während Import
- **Abbruch-Button:** Import jederzeit abbrechbar (ref-basierter Abort zwischen Batches)
- **Fragenbank-Cache:** `handleOeffneSyncDialog()` lädt Fragenbank IMMER frisch (nicht aus Cache), damit Delta-Berechnung korrekt ist
- **Abmelden-Button:** Ganz rechts in Header verschoben (war vor ThemeToggle)
- **Sichtbarkeitsfilter:** `parseFrage()` fehlte `quelle`-Feld → Pool-Fragen hatten `quelle: undefined` → wurden vom Sichtbarkeitsfilter ausgeblendet. Fix: `quelle` in `parseFrage()` base-Objekt + `quelle === 'pool'` als dritte Bedingung im Filter
- **Pool-Converter:** `geteilt` von `'privat'` auf `'schule'` geändert (Pool-Fragen sollen für alle LP sichtbar sein)

### Änderungen (20.03.2026 Nacht)

**Pool-Brücke** (12 Tasks):
- Pool-Sync: 26 Übungspools von GitHub Pages → Fragenbank importieren (Batch via Apps Script)
- Pool-Converter: 7 Pool-Typen → 6 Prüfungstypen (mc→MC, multi→MC, tf→RichtigFalsch, fill→Lückentext, calc→Berechnung, sort→Zuordnung, open→Freitext)
- Zwei Review-Flags: `poolGeprueft` (aus Pool-Quelle) + `pruefungstauglich` (LP-Absegnung im Editor)
- Badges im FragenBrowser: Pool/ungeprüft (rot), Pool ✓ (gelb), Prüfungstauglich (grün), Update (blau pulsierend)
- Filter: Quelle (Alle/Eigene/Pool), Pool-Status (Ungeprüft/Pool ✓/Prüfungstauglich/Update)
- Update-Vergleich: Aufklappbarer Side-by-side-Vergleich im Editor, Übernehmen/Ignorieren/Manuell anpassen
- Lernziel-Datenbank: Lernziele aus Pools in separatem Sheet, KI-Generierung zu Lernzielen (🎯 Button)
- 4 neue Backend-Endpoints: `importierePoolFragen`, `importiereLernziele`, `ladeLernziele`, `generiereFrageZuLernziel`
- Content-Hashing (SHA-256) für Delta-Erkennung bei wiederholtem Sync
- `reviewed` Feld zu allen 2179 Fragen in 26 Pool-Configs hinzugefügt
- **Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen

### Frühere Änderungen (20.03.2026 Abend)

**Runde 1** (Commit `4b45cd3`):
- Prüfung löschen: Button im Composer + Bestätigungsdialog + Backend-Endpoint `loeschePruefung`
- FragenEditor Breite auf 1008px angeglichen (wie FragenBrowser)
- Fragen in AbschnitteTab klickbar (öffnet Editor, Bearbeiten-Button entfernt)
- BewertungsrasterEditor: KI-Buttons auf Titel-Höhe, Vorlage-Controls als separate Zeile darunter

**Runde 2** (Commit `ca0857a`):
- ThemeToggle aus FragenEditor entfernt (duplizierte den Toggle in LPHeader)
- Zuordnungs-Felder neu sortiert: Links Fachbereich/Thema/Unterthema/Tags, Rechts Bloom/Zeit/Punkte
- GF (Grundlagenfach) als Gefäss hinzugefügt — in `Gefaess`-Typ, FragenEditor-Buttons, ConfigTab-Select
- Neuer Toggle `zufallsreihenfolgeOptionen` in PruefungsConfig + ConfigTab (MC/SC/R-F Optionen mischen)
- Freitext-Optionen (erwartete Länge) Sektion aus FragenEditor entfernt

**Runde 3**:
- BerechnungEditor Layout-Fix: responsive Breiten (Bezeichnung w-36, Hilfsmittel flex)
- Panel-Flow: `pointer-events-none` Wrapper + `pointer-events-auto` Kinder → Header bleibt klickbar über Overlays
- LPHeader z-60, FragenEditor z-55, Panels z-50 → Header-Buttons (inkl. ThemeToggle) immer erreichbar
- FragenEditor: ESC schliesst Editor (capture-Phase), "Abbrechen" → "← Zurück"
- Duplizieren-Button im Composer-Header (neben Speichern)
- GF zu Gefäss-Filter auf LPStartseite hinzugefügt

**Runde 4**:
- BerechnungEditor: `overflow-hidden` entfernt → alle 4 Eingabefelder (Bezeichnung, Ergebnis, Toleranz, Einheit) sichtbar
- Scroll-Fix alle Panels (FragenBrowser, FragenEditor, HilfeSeite): `onWheel={stopPropagation}` + `overflow-hidden` → Scrollen im Header-Bereich scrollt nicht mehr den Hintergrund
- Auto-Submit-Bestätigung: Bottom-Banner durch prominenten Vollbild-Dialog ersetzt (wie AbgabeDialog-Erfolg, mit Checkmark-Icon)

### Offene Punkte (noch nicht umgesetzt)
- **Pool-Rück-Sync End-to-End-Test:** GitHub API-Calls noch nicht live getestet (GITHUB_TOKEN als Script Property konfiguriert, aber kein realer Rück-Sync durchgeführt)
- **Pool-Rück-Sync Batch-Export:** Batch-Dialog für Export mehrerer Fragen (Button platziert, Logik Phase 2)
- **Prüfungs-Durchführung erweitern:** Open-End-Modus, LP-kontrolliertes Beenden, Zeitverlängerung live
- **Apps Script Deployment nötig:** `apps-script-code.js` muss nach jedem Push in Apps Script Editor kopiert + neue Bereitstellung erstellt werden (aktuell: img-Hash + anhaenge-Sync ausstehend)

### Was funktioniert
- **E2E-Flow getestet:** Login → Prüfung laden → Ausfüllen → Abgabe → Antwort-Datei in Google Drive ✅
- Startbildschirm mit Prüfungsinfo + Sitzungswiederherstellung
- **6 Fragetypen:** MC (Einzel-/Mehrfachauswahl), Freitext (Tiptap), Lückentext, Zuordnung, Richtig/Falsch, Berechnung
- Fragennavigation mit Kacheln (✓ beantwortet, ? unsicher, — offen)
- Timer mit Countdown + Warnungen (15 Min. orange, 5 Min. rot)
- Auto-Save: LocalStorage (sofort) + IndexedDB (15s) + Remote via Apps Script (30s, konfigurierbar)
- Light/Dark Mode: System-Erkennung + manueller Toggle
- Abgabe-Dialog mit Bestätigung + Statusübersicht + Sende-Status + Retry
- 10 Demo-Fragen (3 MC, 3 Freitext, 1 Lückentext, 1 Zuordnung, 1 Richtig/Falsch, 1 Berechnung) in 4 Abschnitten
- GitHub Actions Deploy (mit Env-Variablen für Backend)
- Login-Screen (Google OAuth + Schülercode mit E-Mail + Demo-Modus)
- Auth-Store (Session via sessionStorage, Rollen-Erkennung aus E-Mail-Domain)
- API-Service (Apps Script Backend, CORS-sicher mit `text/plain`)
- URL-basierte Prüfungs-ID (`?id=PRUEFUNGS_ID` → lädt Config vom Backend)
- Monitoring-Hook (Auto-Save, Remote-Save, Heartbeat, Focus-Detection, Online/Offline)
- SEB-Erkennung (User-Agent-Check + Warnbanner) + SEB-Konfigurationsvorlage (`seb/`)
- LP-Monitoring-Dashboard (Live-Übersicht aller SuS)
- **LP-Startseite:** Prüfungen verwalten, Monitoring/Bearbeiten/URL-Links
- **Prüfungs-Composer:** 3-Tab-Editor (Einstellungen, Abschnitte & Fragen, Vorschau)
- **Fragenbank-Browser:** Slide-over mit Filtern (Fachbereich, Typ, Bloom, Freitext-Suche)
- **Fragenbank-Editor:** Alle 6 Fragetypen erstellen/bearbeiten + in Google Sheets speichern
- Rollen-Routing (LP ohne `?id=` → LPStartseite/Composer, mit `?id=` → Monitoring)
- Zuordnung, Abschnitt-Header, Fortschrittsbalken, FragenÜbersicht
- Abgabe-Zusammenfassung (Read-only, druckbar)
- Tab-Konflikterkennung, Error Boundary, Sticky Fragetext
- Retry-Queue (IndexedDB, fehlgeschlagene Saves bei Reconnect nachsenden)
- Zeitablauf-Auto-Abgabe, beforeunload-Warnung, Tastaturnavigation
- **Audio/Video-Anhänge (20.03.2026):**
  - Fragen können jetzt Audio- und Video-Dateien als Anhänge haben (Upload bis 5MB/25MB)
  - URL-Einbettung für YouTube, Vimeo, nanoo.tv (kein Upload nötig)
  - MediaAnhang-Komponente als zentraler Renderer (Bild/Audio/Video/Embed/PDF)
  - AnhangEditor erweitert: MIME-Filter, Grössenlimits, URL-Button
- **Audio-Korrektur (20.03.2026):**
  - Browser MediaRecorder API (WebM/Opus, MP4-Fallback für Safari)
  - AudioRecorder-Komponente: Aufnehmen → Anhören → Speichern/Verwerfen
  - Pro Frage + Gesamt-Audio-Kommentar im KorrekturDashboard
  - Audio-Dateien werden als Base64 zu Google Drive hochgeladen
- **SuS-Korrektur-Einsicht (20.03.2026):**
  - LP kann Korrektur "freigeben" → Toggle-Button im KorrekturDashboard
  - SuS sehen freigegebene Korrekturen als Liste (KorrekturListe)
  - Detailansicht pro Prüfung: Fragen, Punkte, Kommentare, Audio-Feedback
  - Symbole: ✓ (volle Punkte), ~ (Teilpunkte), ✗ (0 Punkte)
  - 3 neue Backend-Endpoints: korrekturFreigeben, ladeKorrekturenFuerSuS, ladeKorrekturDetail
- **UI/UX-Verbesserungen (20.03.2026):**
  - LPHeader: Shared Header für alle LP-Ansichten (Startseite, Composer, Monitoring, Korrektur)
  - ESC schliesst Panels, direkte Umschaltung Fragenbank ↔ Hilfe
  - FragenBrowser 50% breiter (672→1008px), Hilfe 50% breiter (768→1152px)
  - Fragenbank-Klickverhalten: Klick → Editor öffnen, +/– Buttons für Hinzufügen/Entfernen
  - Ziel-Leiste zeigt aktuelle Prüfung/Abschnitt im FragenBrowser
  - BerechnungEditor Layout-Fix (Ergebnis/Toleranz breiter, Hilfsmittel schmaler)
  - BewertungsrasterEditor als eigene Komponente extrahiert + KI-Buttons
  - Prüfung duplizieren auf LP-Startseite
  - Audio-Aufnahme im AnhangEditor (MediaRecorder → WebM → File)
  - Materialien erweitert: Audio/Video-Upload + Video-Embed (YouTube/Vimeo/nanoo.tv)
  - Alle Buttons in einheitlichem neutralen Style
- **Code-Review-Cleanup (17.03.2026):**
  - XSS-Schutz: DOMPurify für alle `dangerouslySetInnerHTML`-Stellen
  - Stale-Closure-Fix: `useRef` für Timer/Intervall-Callbacks
  - Zustand Persist: `partialize` (config/fragen ausgeschlossen) + Schema-Migration (Version 2)
  - IndexedDB-Cleanup nach erfolgreicher Abgabe
  - Custom Bestätigungsdialog statt `confirm()` im Composer
  - SEB-Warnung nicht mehr schliessbar (State-Bereinigung)
  - Debug-Logs entfernt aus apiService.ts
  - remoteSave.ts gelöscht (toter Code)
  - Shared Utils: `fachbereich.ts` (fachbereichFarbe, typLabel, bloomLabel)
  - eslint-disable-Stellen: 2 gefixt (Zustand-Actions in Deps), 5 dokumentiert

### Auth-Flow
1. Kein User → LoginScreen (Google-Button / Schülercode mit E-Mail / Demo)
2. Google Login → JWT dekodiert → E-Mail-Domain bestimmt Rolle (SuS/LP)
3. Schülercode-Login → E-Mail-Eingabe (auto-Ergänzung `@stud.gymhofwil.ch`) + Name + 4-stelliger Code
4. Session in sessionStorage (überlebt Reload, nicht Tab-Schliessung)
5. Wenn `VITE_APPS_SCRIPT_URL` gesetzt + `?id=...` in URL → Prüfung vom Backend laden
6. Sonst → Demo-Prüfung (wie bisher)

### Technische Hinweise
- **CORS:** Apps Script beantwortet keine OPTIONS-Preflight-Requests → POST-Requests verwenden `Content-Type: text/plain` statt `application/json`
- **Session-Restore:** Bei erkannter vorheriger Sitzung wird immer der Startbildschirm gezeigt (User entscheidet ob fortsetzen)
- **Layout-Fallback:** Bei fehlenden Prüfungsdaten wird "Zurück zum Start"-Button statt weisser Bildschirm gezeigt

### UI-Design-Entscheide (vom User bestätigt)
- **Neutrales Farbschema:** Weiss/Grau/Schwarz als Basis, kein Blau für Buttons
- **Fachbereich-Farben:** Nur dezent in Badges (VWL orange, BWL blau, Recht grün)
- **Navigation-Icons:** ✓ grün (beantwortet), ? amber (unsicher), neutral (offen)
- **Alle Buttons in Kopfzeile:** ← Zurück | 3/7 | Weiter → | Unsicher | Abgeben | ☀/🌙
- **Freitext:** Auto-Focus, Überschrift-Button (H2), --> → Autokorrektur
- **Hoher Kontrast:** Besonders wichtig bei Prüfungen (Lesbarkeit)
- **Sortierung:** Nur durch Lehrperson (Abschnitte in PruefungsConfig), SuS nicht

### Offene User-Wünsche (für spätere Iterationen)
- ~~Buchhaltungs-Fragetyp~~ ✅ (Session 21.03.2026 — 4 FiBu-Typen + Aufgabengruppe)
- Tablet-/Smartphone-Optimierung: grundsätzlich responsive, aber noch nicht spezifisch getestet
- Skalierung/Kollaboration: Apps für andere LP nutzbar machen (grösserer Umbau)

## Verzeichnisstruktur

```
Pruefung/
├── src/
│   ├── App.tsx                          — Auth-Gate + Rollen-Routing (LP→Dashboard, SuS→Prüfung)
│   ├── index.css                        — Tailwind + Tiptap-Styles + Dark-Mode-Kontrast
│   ├── main.tsx
│   ├── types/
│   │   ├── fragen.ts                    — FrageBase, MC, Freitext, Lückentext, Zuordnung, R/F, Berechnung + FiBu (Buchungssatz, TKonto, Kontenbestimmung, BilanzER, Aufgabengruppe)
│   │   ├── pool.ts                      — Pool-spezifische Typen (PoolConfig, Lernziel, PoolSyncErgebnis)
│   │   ├── pruefung.ts                  — PruefungsConfig, PruefungsAbschnitt
│   │   ├── antworten.ts                 — PruefungsAbgabe, Antwort-Union-Typ (inkl. FiBu-Antworten)
│   │   ├── auth.ts                      — AuthUser, Rolle
│   │   ├── korrektur.ts                 — FragenBewertung, SchuelerKorrektur, PruefungsKorrektur
│   │   └── monitoring.ts                — SchuelerStatus, MonitoringDaten
│   ├── store/
│   │   ├── pruefungStore.ts             — Zustand-Store (Antworten, Navigation, Phase)
│   │   ├── authStore.ts                 — Auth-State: User, Demo, Login/Logout
│   │   └── themeStore.ts                — Light/Dark/System Mode mit Persist
│   ├── data/
│   │   ├── demoFragen.ts                — 8 Demo-Fragen (inkl. Zuordnung)
│   │   ├── demoPruefung.ts              — Demo-PruefungsConfig (45 Min, 4 Abschnitte)
│   │   ├── demoMonitoring.ts            — Demo-Monitoring-Daten für LP-Dashboard
│   │   └── kontenrahmen-kmu.json        — 76 KMU-Konten (Schweizer Kontenrahmen, statisch)
│   ├── hooks/
│   │   ├── useAudioRecorder.ts         — MediaRecorder Hook (WebM/Opus, MP4-Fallback)
│   │   ├── useFocusTrap.ts             — Keyboard-Focus-Trap für Modals/Dialoge
│   │   ├── usePruefungsMonitoring.ts    — Zentraler Monitoring-Hook
│   │   ├── usePruefungsUX.ts           — beforeunload, Tastaturnavigation
│   │   └── useTabKonflikt.ts           — BroadcastChannel Tab-Erkennung
│   ├── services/
│   │   ├── autoSave.ts                  — IndexedDB Backup
│   │   ├── sebService.ts               — SEB User-Agent Erkennung
│   │   ├── retryQueue.ts              — IndexedDB Retry-Queue für fehlgeschlagene Saves
│   │   ├── authService.ts              — Google Identity Services Wrapper
│   │   ├── apiService.ts               — Apps Script API Client (text/plain CORS-Fix)
│   │   └── poolSync.ts                 — Pool-Fetch, Parse, Delta-Berechnung, Content-Hash
│   ├── components/
│   │   ├── lp/
│   │   │   ├── LPHeader.tsx              — Shared LP-Header (ESC, Panels, Abmelden, ThemeToggle)
│   │   │   ├── LPStartseite.tsx         — LP-Startseite: Prüfungen verwalten + erstellen + duplizieren
│   │   │   ├── PruefungsComposer.tsx    — 4-Tab-Editor (Einstellungen, Abschnitte, Vorschau, Analyse) + Autosave
│   │   │   ├── FragenBrowser.tsx        — Slide-over: Fragenbank + Direktes Hinzufügen/Entfernen + Resize + Pool-Badges/Filter
│   │   │   ├── PoolSyncDialog.tsx       — Sync-UI: Pools laden, Delta-Vorschau, Batch-Import (neu + aktualisierte Fragen)
│   │   │   ├── RueckSyncDialog.tsx     — Rück-Sync: Update bestehender Pool-Fragen / Export neuer Fragen via GitHub API
│   │   │   ├── HilfeSeite.tsx           — In-App Hilfe mit Akkordeon-Sektionen + Resize
│   │   │   ├── composer/
│   │   │   │   ├── AbschnitteTab.tsx    — Abschnitte mit Fragen-Details (Badges, Bloom, Punkte, Zeit)
│   │   │   │   ├── VorschauTab.tsx      — Inline Schülervorschau (MC/Freitext/Lückentext/Zuordnung)
│   │   │   │   └── AnalyseTab.tsx       — Taxonomie, Fragetypen-Mix, Zeitschätzung, KI-Analyse
│   │   │   ├── frageneditor/           — Aufgesplitteter FragenEditor
│   │   │   │   ├── FragenEditor.tsx    — Hauptkomponente (~1680 Z., Ausnahme dokumentiert)
│   │   │   │   ├── editorUtils.ts      — FrageTyp (11 Typen), generiereFrageId(), parseLuecken()
│   │   │   │   ├── EditorBausteine.tsx — Abschnitt + Feld UI-Wrapper
│   │   │   │   ├── MCEditor.tsx        — MC-Optionen-Editor
│   │   │   │   ├── FreitextEditor.tsx  — Freitext-Editor
│   │   │   │   ├── LueckentextEditor.tsx — Lückentext-Editor
│   │   │   │   ├── ZuordnungEditor.tsx — Zuordnung-Editor
│   │   │   │   ├── RichtigFalschEditor.tsx — Richtig/Falsch-Editor
│   │   │   │   ├── BerechnungEditor.tsx — Berechnung-Editor
│   │   │   │   ├── BuchungssatzEditor.tsx — Buchungssatz-Editor (Geschäftsfall, Buchungen, Kontenauswahl)
│   │   │   │   ├── TKontoEditor.tsx    — T-Konto-Editor (5 Bewertungsoptionen, Musterlösung-Cards)
│   │   │   │   ├── KontenbestimmungEditor.tsx — Kontenbestimmung-Editor (3 Modi)
│   │   │   │   ├── BilanzEREditor.tsx  — Bilanz/ER-Editor (Konten mit Saldi, 8 Bewertungsoptionen)
│   │   │   │   ├── AufgabengruppeEditor.tsx — Aufgabengruppe-Editor (Kontext + Teilaufgaben-IDs)
│   │   │   │   ├── KIFiBuButtons.tsx   — KI-Buttons für FiBu-Typen (4 exportierte Komponenten)
│   │   │   │   ├── BewertungsrasterEditor.tsx — Bewertungsraster-Editor (extrahiert)
│   │   │   │   ├── PoolUpdateVergleich.tsx — Side-by-side Update-Vergleich (Pool vs. aktuell)
│   │   │   │   └── useKIAssistent.ts  — KI-Assistent Hook (25 Aktionen inkl. 7 FiBu-Aktionen)
│   │   │   ├── KorrekturDashboard.tsx   — KI-Korrektur: Review + Feedback
│   │   │   ├── KorrekturSchuelerZeile.tsx — Aufklappbare SuS-Zeile mit Bewertungen
│   │   │   ├── KorrekturFrageZeile.tsx   — Einzelne Frage: KI-Vorschlag + LP-Override
│   │   │   ├── SuSVorschau.tsx          — Fullscreen SuS-Vorschau (Preview aus Schüler-Sicht)
│   │   │   ├── MonitoringDashboard.tsx  — LP-Dashboard: Live-Übersicht aller SuS
│   │   │   └── SchuelerZeile.tsx        — Einzelne SuS-Zeile mit Detail-Panel
│   │   ├── sus/
│   │   │   ├── KorrekturListe.tsx      — SuS: Liste freigegebener Korrekturen
│   │   │   └── KorrekturEinsicht.tsx   — SuS: Detailansicht einer korrigierten Prüfung
│   │   ├── shared/
│   │   │   └── KontenSelect.tsx        — Konten-Auswahl (eingeschränkt/voll, Kategorie-Badges)
│   │   ├── AudioPlayer.tsx             — Wiederverwendbarer Mini-Audio-Player
│   │   ├── AudioRecorder.tsx           — Audio-Aufnahme UI (Mikrofon → Preview → Speichern)
│   │   ├── MediaAnhang.tsx             — Zentraler Medien-Renderer (Bild/Audio/Video/Embed/PDF)
│   │   ├── ErrorBoundary.tsx            — Fängt Rendering-Fehler, Recovery-UI
│   │   ├── LoginScreen.tsx              — Google OAuth + Schülercode (mit E-Mail) + Demo
│   │   ├── Layout.tsx                   — Header + Sidebar (mit User-Info) + Main
│   │   ├── Startbildschirm.tsx          — Prüfungsinfo + Start-Button
│   │   ├── FragenNavigation.tsx         — Kacheln mit Icons + Legende + fachbereichFarbe()
│   │   ├── FragenUebersicht.tsx         — Alle Fragen mit Status + Fortschritt pro Abschnitt
│   │   ├── AbgabeZusammenfassung.tsx   — Read-only Antworten-Review, druckbar
│   │   ├── Timer.tsx                    — Countdown mit Warnstufen
│   │   ├── VerbindungsStatus.tsx        — Online/Offline-Indikator
│   │   ├── AutoSaveIndikator.tsx        — "Gespeichert ✓" Fade-Animation
│   │   ├── AbgabeDialog.tsx             — Abgabe mit Sende-Status, Retry, Meta-Daten
│   │   ├── ThemeToggle.tsx              — ☀/🌙 Button
│   │   └── fragetypen/
│   │       ├── MCFrage.tsx              — MC mit neutraler Selektion
│   │       ├── FreitextFrage.tsx        — Tiptap + Heading + ArrowReplace + Auto-Focus
│   │       ├── LueckentextFrage.tsx     — Inline-Inputs
│   │       ├── ZuordnungFrage.tsx      — Dropdown-Zuordnung mit Fortschritt
│   │       ├── RichtigFalschFrage.tsx  — Richtig/Falsch-Buttons pro Aussage
│   │       ├── BerechnungFrage.tsx     — Numerische Eingabe + Rechenweg
│   │       ├── BuchungssatzFrage.tsx   — Buchungssatz-Eingabe (Soll/Haben, compound)
│   │       ├── TKontoFrage.tsx         — T-Konto-Darstellung (CSS-Grid, Gegenkonten)
│   │       ├── KontenbestimmungFrage.tsx — Kontenbestimmung-Tabelle (3 Modi)
│   │       ├── BilanzERFrage.tsx       — Bilanz + ER mehrstufig (komplexester SuS-Typ)
│   │       └── AufgabengruppeFrage.tsx — Aufgabengruppe (rendert Teilaufgaben, Rekursionsschutz)
│   └── utils/
│       ├── poolConverter.ts            — Typ-Konvertierung Pool→Prüfungstool (7→6 Typen) + konvertierePoolBild (exported)
│       ├── poolExporter.ts            — Reverse Type Mapping Prüfungstool→Pool-Format (7 Typen) + Diff-Berechnung
│       ├── abschnitte.ts               — findeAbschnitt(), berechneAbschnittFortschritt()
│       ├── fachbereich.ts              — Shared: fachbereichFarbe(), typLabel() (11 Typen), bloomLabel()
│       ├── kontenrahmen.ts             — alleKonten, findKonto(), sucheKonten(), kontoLabel(), kontenNachKategorie()
│       ├── fibuAutoKorrektur.ts       — Regelbasierte Auto-Korrektur für alle FiBu-Typen (4 Korrekturfunktionen)
│       ├── korrekturUtils.ts          — berechneNote(), effektivePunkte(), Statistiken
│       ├── exportUtils.ts              — CSV-Export (Semicolon, BOM für Excel)
│       ├── markdown.ts                  — Einfacher Markdown→HTML Renderer
│       ├── mediaUtils.ts               — MIME-Helpers, URL-Parsing (YouTube/Vimeo/nanoo), Drive-URLs
│       ├── zeitbedarf.ts               — Zeitbedarfs-Schätzung pro Fragetyp
│       └── zeit.ts                      — Timer-Hilfsfunktionen
├── seb/
│   ├── GymHofwil_Pruefung_Konfig.xml   — SEB-Konfigurationsvorlage (Import in SEB Config Tool)
│   └── README.md                        — SEB-Anleitung (URL anpassen, exportieren, verteilen)
├── .env.example                         — Template für Environment-Variablen
├── Google_Workspace_Setup.md            — Anleitung: OAuth + Sheets + Apps Script + Composer-Endpoints
├── Pruefungsplattform_Spec_v2.md        — Gesamtspezifikation
├── Auftrag_Pruefungsplattform_Phase1.md — Phase-1-Auftrag (erledigt)
└── HANDOFF.md                           — Dieses Dokument
```

## Environment-Variablen

| Variable | Beschreibung | Wo setzen |
|----------|-------------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client-ID | `.env.local` (lokal) / GitHub Secrets (prod) |
| `VITE_APPS_SCRIPT_URL` | Apps Script Web-App URL | `.env.local` (lokal) / GitHub Secrets (prod) |

Ohne diese Variablen funktioniert die App im **Demo-Modus** (Schülercode + Demo-Prüfung).

## Google Workspace Setup (Stand 17.03.2026)

| Teil | Status | Details |
|------|--------|---------|
| 1: OAuth Client-ID | ✅ erledigt | Client-ID in `.env.local` + GitHub Secrets |
| 2: Google Sheets | ✅ erledigt | Fragenbank, Klassenlisten, Configs, Antworten-Ordner angelegt |
| 3: Apps Script | ✅ erledigt | Deployed, Berechtigungen autorisiert, URL in `.env.local` |
| 4: GitHub Actions | ✅ erledigt | Secrets `VITE_GOOGLE_CLIENT_ID` + `VITE_APPS_SCRIPT_URL` gesetzt |
| 5: End-to-End-Test | ✅ erledigt | Login → Laden → Ausfüllen → Abgabe → Datei in Drive |
| 6: Fragenbank+Composer | ✅ erledigt | Login → Frage erstellen → Speichern → Prüfung zusammenstellen (17.03.2026) |
| 7: KI-Korrektur | ✅ erledigt | Backend deployed, API-Key gesetzt, alle Endpoints funktionieren |

## Nächste Schritte

### Erledigt (18.03.2026)
- W4-W6 Code-Review ✅, KI-Korrektur ✅, UI-Fixes ✅, 4 neue Features ✅

### Neue Features (18.03.2026)
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 8 | Warteraum + Freischaltung | ✅ | `freigeschaltet` in Config, Polling im Startbildschirm, LP-Freigabe im Monitoring |
| 9 | CSV-Export | ✅ | `exportUtils.ts`, Button im KorrekturDashboard (Semicolon-CSV mit BOM) |
| 10 | Fragen-Statistiken | ✅ | Aufklappbare Fragen-Analyse mit Lösungsquote-Balken |
| 11 | Zeitzuschläge | ✅ | `zeitverlaengerungen` in Config, Timer-Integration, Composer-UI, Badge in Monitoring |
| 12 | Dark Mode Fix | ✅ | Neutrales Grau, 3-Wege-Toggle, `@custom-variant dark` für Tailwind v4 |
| 13 | Login-Vereinfachung | ✅ | Name aus E-Mail, "Schüler-ID", Backend-Validierung |
| 14 | Monitoring robust | ✅ | Backend-Daten-Mapping mit Defaults, Zurück-Buttons auf Fehlerscreens |

### Priorität 2+3 Features (18.03.2026)
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 15 | Erweitertes LP-Monitoring | ✅ | Antwort-Einsicht pro SuS (Fragen-Fortschritt + Kurzvorschau) |
| 16 | Fragen-Dashboard | ✅ | SuS/Fragen Toggle im Monitoring (aggregierter Fortschritt pro Frage) |
| 17 | LP-zu-SuS Chat | ✅ | Nachrichten senden/empfangen während Prüfung (Einzel + Broadcast) |

### UI-Verbesserungen (19.03.2026)
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 18 | Datum formatiert | ✅ | `formatDatum()` in zeit.ts, "Mi 01. April 2026" statt rohes Date |
| 19 | Bewertungsraster Layout | ✅ | Kriterium flex-1, Punkte w-14, Spalten-Header |
| 20 | Klickbare Fragen | ✅ | Frage-IDs in AbschnitteTab klickbar → öffnet Fragenbank |
| 21 | Fragenbank-Button | ✅ | In LP-Startseite Header neben "+ Neue Prüfung" |
| 22 | SuS-Vorschau | ✅ | Fullscreen-Preview aus SuS-Sicht mit VORSCHAU-Banner |
| 23 | Prüfungsorganisation | ✅ | Suchfeld, Filter-Chips (Fachbereich/Typ/Gefäss), Sortierung, "Zuletzt"-Sektion |

### Neue Features (19.03.2026)
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 24 | Dateianhänge | ✅ | FrageAnhang Type, AnhangEditor (Drag&Drop), FrageAnhaenge (Lightbox), uploadAnhang Endpoint |
| 25 | KI-Assistent im Editor | ✅ | KIAssistentPanel: Fragetext generieren/verbessern, Musterlösung prüfen, MC-Optionen generieren |
| 26 | Datumformatierung | ✅ | formatDatum() in zeit.ts, alle Ansichten |
| 27 | Bewertungsraster Layout | ✅ | Kriterium flex-1, Punkte w-14 |
| 28 | Klickbare Fragen | ✅ | Frage-IDs in AbschnitteTab öffnen Fragenbank |
| 29 | Fragenbank-Button LP-Header | ✅ | Neben "+ Neue Prüfung" |
| 30 | SuS-Vorschau | ✅ | Fullscreen-Preview mit VORSCHAU-Banner |
| 31 | Prüfungsorganisation | ✅ | Suche, Filter, Sortierung, "Zuletzt"-Sektion |

### Session 19.03.2026 (Abend)
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 32 | KI-Buttons vereinheitlicht | ✅ | Alle Fragetypen: Generieren + Prüfen & Verbessern, Tooltips überall, Musterlösung-Generierung |
| 33 | Backend KI-Prompts (10 neue) | ✅ | generiereMusterloesung, generierePaare/pruefePaare, generiereAussagen/pruefeAussagen, generiereLuecken/pruefeLueckenAntworten, berechneErgebnis/pruefeToleranz, analysierePruefung |
| 34 | Analyse-Tab im Composer | ✅ | 4. Tab: Taxonomie-Verteilung, Fragetypen-Mix, Zeitschätzung, KI-Analyse per Button |
| 35 | Zeitbedarf pro Frage | ✅ | Neues Feld in FrageBase, vorausgefüllt (Typ+Bloom+Länge), editierbar, Summe im Analyse-Tab |
| 36 | Fragenansicht im Composer | ✅ | AbschnitteTab zeigt Fachbereich-Badge, Typ, Bloom, Punkte, Zeitbedarf, Thema/Tags wie Fragenbank |
| 37 | Schweizer Notenskala | ✅ | Note 1-6 (halbe Noten), Farbcodierung grün/rot, LP-Override möglich, Median in Statistiken |
| 38 | Fragen-Import via KI | ✅ | Text einfügen → KI erkennt Fragen → Vorschau mit Checkboxen → selektiv importieren |
| 39 | Fragen-Sharing | ✅ | autor/geteilt-Felder, Privat/Schule-Toggle, Filter "Alle/Meine" in Fragenbank |
| 40 | Hilfe/FAQ-Seite | ✅ | In-App Hilfe mit Akkordeon-Sektionen, Bloom-Taxonomie-Erklärung, Onboarding für neue LP |
| 41 | Sichtbarkeit-Button Fix | ✅ | Privat/Schule-Toggle: flex-1 auf beide Buttons, kein weisser Zwischenbereich mehr |
| 42 | BerechnungEditor Layout Fix | ✅ | Header-Spacer für Lösch-Button nur anzeigen wenn >1 Ergebnis vorhanden |
| 43 | Einklappbare Abschnitte | ✅ | Abschnitt-Komponente mit einklappbar/standardOffen Props; Fragetyp + Zuordnung eingeklappt bei Bearbeitung, Anhänge + Bewertungsraster standardmässig zu |
| 44 | KI-Klassifizierung | ✅ | "KI klassifizieren"-Button in Zuordnung-Abschnitt: füllt Fachbereich, Thema, Unterthema, Bloom, Tags aus Fragetext |
| 45 | Sichtbarkeit-Button neutral | ✅ | Privat/Schule-Toggle: `bg-slate-800` statt blau, `w-48` fixe Breite |
| 46 | Bewertungsraster-Vorlagen editierbar | ✅ | Alle Vorlagen löschbar + editierbar, Defaults als Startvorschläge |
| 47 | Autosave (3s Debounce) | ✅ | `useRef` für Previous-State-Vergleich, `handleSpeichernIntern()` wiederverwendbar |
| 48 | Direktes Hinzufügen/Entfernen | ✅ | Klick auf Frage in Browser = direkt hinzufügen/entfernen, "In Prüfung"-Badge |
| 49 | Vorschau inline Schüleransicht | ✅ | MC mit A/B/C/D, Freitext mit Textarea, Lückentext mit Inputs, Zusammenfassungsleiste |
| 50 | Header schlank + Buttons einheitlich | ✅ | `py-2`, Reihenfolge: Neue Prüfung → Fragenbank → Hilfe → ThemeToggle → Abmelden, Ghost-Buttons |
| 51 | Overlays unter Header | ✅ | Dynamische Header-Höhe-Messung, alle Panels starten unter Header |
| 52 | Resize-Handle überall | ✅ | FragenBrowser, FragenEditor, HilfeSeite: Drag-to-Resize |
| 53 | Bilder in Vorschau | ✅ | Anhänge inline angezeigt, `bildGroesse` Feld (klein/mittel/gross) auf FrageAnhang |
| 54 | Material-Upload zu Drive | ✅ | Datei vom Computer hochladen → Base64 → Apps Script → Google Drive |
| 55 | Drive-Ordner getrennt | ✅ | 3 Ordner: Anhänge (`1Ql4...`), Materialien (`1yBq...`), SuS-Uploads (`1pQd...`) |
| 56 | Berechnung Layout-Fix | ✅ | Header-Spacer nur bei >1 Ergebnis |
| 57 | initialEditFrageId | ✅ | "Bearbeiten" in AbschnitteTab öffnet FragenBrowser + Editor direkt |

### Session 20.03.2026 — UI/UX-Verbesserungen
| # | Feature | Status | Beschreibung |
|---|---------|--------|-------------|
| 58 | LPHeader (Shared) | ✅ | Einheitlicher Header für alle LP-Ansichten mit ESC-Handler, Panel-Toggles |
| 59 | Panel-Breiten & ThemeToggle | ✅ | FragenBrowser 672→1008px, Hilfe 768→1152px, ThemeToggle aus Panels entfernt |
| 60 | BerechnungEditor Layout | ✅ | Hilfsmittel w-64, Ergebnis/Toleranz flex-1 |
| 61 | BewertungsrasterEditor | ✅ | Aus FragenEditor extrahiert (~210 Z.), KI-Buttons (generieren/verbessern) |
| 62 | Prüfung duplizieren | ✅ | "Duplizieren"-Button auf LP-Startseite, Titel + "(Kopie)" |
| 63 | Fragenbank Klickverhalten | ✅ | Klick → Editor, +/– Buttons, grüner Rahmen für "in Prüfung" |
| 64 | Ziel-Leiste | ✅ | Grüne Info-Leiste im FragenBrowser zeigt Ziel-Prüfung/Abschnitt |
| 65 | Audio-Aufnahme | ✅ | AudioRecorder im AnhangEditor (Blob → File) |
| 66 | Materialien Audio/Video/Embed | ✅ | `videoEmbed` Typ, Audio/Video-Upload, YouTube/Vimeo/nanoo.tv Embed |
| 67 | Bewertungsraster KI (Backend) | ✅ | 2 neue Cases in apps-script-code.js: bewertungsrasterGenerieren/Verbessern |

### Offen (User-Wünsche für spätere Iterationen)
- Pool-Rück-Sync End-to-End-Test (GITHUB_TOKEN konfiguriert, Live-Test ausstehend)
- Pool-Rück-Sync Batch-Export (Button platziert, Logik noch nicht implementiert)
- Prüfungs-Durchführung erweitern (Open-End-Modus, LP-kontrolliertes Beenden)
- ~~Buchhaltungs-Fragetyp~~ ✅ (4 FiBu-Typen + Aufgabengruppe implementiert)
- Kollaboratives Korrigieren (mehrere LP korrigieren dieselbe Prüfung — Architektur-Klärung nötig)
- Tablet/Smartphone-Optimierung (responsive by design, spezifische Tests ausstehend)

### Backend-Hinweis
`apps-script-code.js` enthält den kompletten Apps Script Code. Nach Änderungen: Code kopieren → Apps Script Editor → Bereitstellung aktualisieren (Stift → Neue Version). Die Spalten `freigeschaltet` und `zeitverlaengerungen` müssen im Configs-Sheet vorhanden sein.

## Commits

| Commit | Beschreibung |
|--------|-------------|
| `de498e7` | Phase 1: Projekt-Setup, MC+Freitext+Lückentext, Auto-Save, Demo-Modus (35 Dateien) |
| `70624b5` | UI-Überarbeitung: Kontrast, neutrales Farbschema, Header-Buttons, Freitext-Features (14 Dateien) |
| *pending* | Phase 2a: Google OAuth Login, Auth-Store, API-Service, LoginScreen, URL-Param (10 Dateien) |
| *pending* | Phase 2b: Monitoring-Hook, SEB-Erkennung, Focus-Detection, Heartbeat, Remote-Save (4 Dateien) |
| *pending* | Phase 2c: LP-Monitoring-Dashboard, GitHub Actions Env-Vars, Rollen-Routing (8 Dateien) |
| `c95d83d` | Phase 2d: ZuordnungFrage, verbesserte Abgabe mit Meta-Daten, Retry-Queue (6 Dateien) |
| `44ec263` | Phase 2e: Zeitablauf-Remote-Abgabe, beforeunload, Tastaturnavigation, Startbildschirm (5 Dateien) |
| `f77a1ca` | Phase 2f: Abschnitt-Header, Fortschrittsbalken, FragenÜbersicht, Abgabe-Zusammenfassung (6 Dateien) |
| `6a46c8e` | Phase 2g: Tab-Konflikterkennung, Error Boundary, Sticky Fragetext (8 Dateien) |
| `705380f` | Fix: Demo/Abmelden setzt Prüfungszustand zurück |
| `569f81a` | HANDOFF: Google Workspace Setup (Teil 1-4) erledigt |
| `d1a3d00` | Phase 3: CORS-Fix, E-Mail bei Schülercode-Login, Session-Restore robuster (5 Dateien) |
| `33cbc2c` | README für Prüfungsplattform erstellt |
| *pending* | Phase 4: SEB-Konfiguration + Prüfungs-Composer + README (LP-Startseite, 3-Tab-Editor, FragenBrowser, API-Endpoints) |
| `eb2c085` | HANDOFF: Backend getestet, Nächste Schritte aktualisiert |
| `65e9e42` | speichereFrage-Endpoint in Apps Script Doku ergänzt |
| `0c9f0f0` | 2 neue Fragetypen (Richtig/Falsch + Berechnung), FragenEditor, Backend-Fixes |
| `a6aaeb1` | FragenBrowser: Redesign für Skalierbarkeit mit vielen Fragen |
| *pending* | Code-Review-Cleanup: Shared Utils, Debug-Logs, toter Code, Custom-Dialoge, eslint-Fixes |
| `77cd9b1` | UI-Fixes, einklappbare Abschnitte, KI-Klassifizierung |
| `d3d89ba` | Material-Dateiupload zu Google Drive |
| `34898cb` | UX-Verbesserungen (6 Fixes) |
| `1ab2ff7` | Sichtbarkeit-Button fix + Bewertungsraster-Vorlagen |
| `fdef587` | Autosave, direktes Hinzufügen/Entfernen, Vorschau-Fix |
| `8f7fa78` | Header schlank + einheitliche Buttons + z-index Fix |
| `cf8646b` | Overlays unter Header, Resize überall, Bilder in Vorschau |
| `da76399` | Drive-Ordner für Anhänge + Materialien getrennt |
| `ec44621` | SuS-Uploads Ordner-ID hinzugefügt |
| `cc6b3e1` | Pool-Rück-Sync: Bidirektionaler Sync — Änderungen zurückschreiben + Export in Pools |
| `274ad39` | Pool-Bilder + Bugfixes: externeUrl für Pool-SVGs, Prüfungstauglich-Toggle, z-index Fix |
| `15b5121` | Fix: RueckSyncDialog aus pointer-events-none Container + img im Content-Hash |
| `64585bb` | Fix: Pool-Sync Updates übernehmen — Button + Backend-Anhaenge |
| `1119985` | Fix: 4 Pool-Fragen korrigiert (SuS-Meldungen) |
