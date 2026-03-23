# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

## Aktueller Stand

**Light Mode Kontrast + 2-stufige Korrektur-Freigabe + Trennschärfe** (23.03.2026, Nacht) ✅

### Session 23.03.2026 Nacht — Kontrast, Korrektur-Freigabe, Trennschärfe

#### Prüfungsplattform — Light Mode Kontrast
- **CSS-Variable-Override:** `html:not(.dark)` überschreibt `--color-slate-400` und `--color-slate-500` für WCAG AA/AAA Kontrast (7.1:1 bzw. 9.7:1 auf weiss). Gezielt nur 400/500 — rest bleibt unverändert (Prüfungsplattform nutzt `dark:`-Prefixes, Vollinversion würde das System brechen).

#### Prüfungsplattform — 2-stufige Korrektur-Freigabe
- **Stufe 1 — Einsicht:** LP gibt Tool-Einsicht frei → SuS sehen Korrektur im Tool
- **Stufe 2 — PDF:** LP gibt PDF-Download separat frei → SuS sehen PDF-Button
- **Zurücknehmbar:** Beide Stufen einzeln an/aus. Einsicht sperren → PDF wird automatisch gesperrt.
- **Geänderte Dateien:**
  - `types/pruefung.ts`: `einsichtFreigegeben` + `pdfFreigegeben` Felder
  - `services/korrekturApi.ts`: `typ`-Parameter ('einsicht' | 'pdf')
  - `components/lp/KorrekturDashboard.tsx`: 2 separate Toggle-Buttons
  - `components/sus/KorrekturEinsicht.tsx`: PDF-Button nur wenn `pdfFreigegeben`
  - `apps-script-code.js`: `korrekturPdfFreigegeben` Spalte + `pdfFreigegeben` im Response
- **Wichtig:** Apps Script Code muss manuell in den Editor kopiert + neue Bereitstellung erstellt werden!

#### Prüfungsplattform — Fragen-Statistiken: Trennschärfe
- **Punkt-biseriale Korrelation** (Part-Whole-Correction): Pearson-Korrelation zwischen Item-Score und Rest-Score (Gesamtscore ohne das Item)
- **Mindestens 5 SuS** nötig für sinnvolle Berechnung
- **Interpretation:** <0.2 schlecht (rot), 0.2-0.3 akzeptabel (amber), 0.3-0.4 gut (blau), ≥0.4 sehr gut (grün)
- **UI:** Farbiger Badge in der Fragen-Analyse-Tabelle, sortierbar
- **Geänderte Dateien:**
  - `utils/korrekturUtils.ts`: `berechneTrennschaerfe()`, erweitertes `FragenStatistik`-Interface
  - `components/lp/KorrekturDashboard.tsx`: Trennschärfe-Spalte mit Sortierung

#### Prüfungsplattform — Trennschärfe über mehrere Durchführungen
- **Backend (apps-script-code.js):** `ladeTrackerDaten` berechnet jetzt Trennschärfe pro Frage pro Prüfung (Pearson Part-Whole). Gespeichert als `trennschaerfe` in `fragenStats`.
- **Aggregation (trackerUtils.ts):** `aggregiereFragenPerformance()` berechnet gewichteten ∅ Trennschärfe über alle Prüfungen. Neues Feld `durchschnittTrennschaerfe` in `FragenPerformance`.
- **MetadataSection:** Zeigt ∅ Trennschärfe in der Zusammenfassung + pro Prüfung in der Detail-Tabelle (Spalte "TS").
- **Geänderte Dateien:** `apps-script-code.js`, `types/tracker.ts`, `utils/trackerUtils.ts`, `components/lp/frageneditor/sections/MetadataSection.tsx`

#### Übungspools — Mini-Fix
- **Pool.html Zeile 1673:** `explain` → `highlightKonten(explain)` — fehlende Konten-Highlighting in einem Feedback-Pfad

#### Unterrichtsplaner-Bugs L1–L7 (v3.89)
- **Alle bereits behoben** in früheren Sessions (v3.90–v3.102): L1 z-index ✓, L2 scroll ✓, L3 Sonderwochen ✓, L4 Ferien ✓, L5 Kontextmenü ✓, L6 Pfeil-Verschieben ✓, L7 Light/Dark Toggle ✓

---

**Demo-Modus Fixes + Übungspool UX** (23.03.2026, Abend) ✅

### Session 23.03.2026 Abend — Demo-Modus + Übungspool-Fixes

#### Prüfungstool — Demo-Modus
- **Session-Persistenz:** `demoStarten()` speichert jetzt User + Demo-Flag in `sessionStorage`. "Durchführen"-Link (Page-Reload) verliert Login nicht mehr.
- **Beenden-Button:** Im Demo-Modus setzt `onBeenden` jetzt `beendetUm` lokal auf Config → Phase wechselt korrekt von "aktiv" zu "beendet".
- **Fallback `pruefungId==='demo'`:** Alle Backend-Aufrufe im DurchfuehrenDashboard prüfen zusätzlich auf Demo-ID → funktioniert zuverlässig auch wenn Backend konfiguriert ist.
- **clearSession()** löscht jetzt auch `pruefung-demo` Key.

#### Übungspools — 3 Fixes
- **FiBu Auto-Badge False Positives:** Regex mit `\b`-Wortgrenzen + nur für BWL-Pools. "Mietvertrag" löst nicht mehr "Ertragskonto" aus.
- **Header-Scroll-Jitter:** Hysterese statt fixer Threshold (compact ab 60px, zurück unter 20px).
- **Unsicher-Button UX:** In Bottom-Row verschoben (neben "Problem melden"), dezentes Design mit Border. Erscheint bei allen Antworten (richtig + falsch), nicht nur bei richtigen.

---

**Light Mode Kontrast + Pool Konten-Highlighting** (23.03.2026, Nachmittag) ✅

### Session 23.03.2026 Nachmittag — Kontrast + Konten-Highlighting

#### Unterrichtsplaner — Light Mode Kontrast
- **CSS-Variablen-Fix:** `slate-500` dunkler (#64748b, war #94a3b8) → Kontrastverhältnis 4.6:1 statt 2.8:1
- **Gray-Palette:** gray-500/400/300 alle dunkler für WCAG AA auf weissem Hintergrund
- **text-gray-700 als Textfarbe:** 4 Stellen in Toolbar, NoteCell, SequencePanel auf text-gray-500 + opacity-50 geändert (war #e5e7eb = unsichtbar auf weiss)
- **Bekannter Stand:** Weitere Kontrast-Verbesserungen möglich (border-gray-700 als Border ist dezent aber akzeptabel, HoverPreview hat hardcodierte dark-Farben)

#### Übungspools — FiBu Konten-Highlighting
- **KONTO_KATEGORIEN Map:** ~40 Kontonamen + Kontentypen → Kontenkategorie (Aktiv/Passiv/Aufwand/Ertrag)
- **highlightKonten():** Regex-basierte Erkennung im Text, nur aktiv für BWL-Pools
- **Integriert in:** Fragetext, MC/Multi-Optionen, Lückentext-Teile, Zuordnungs-Kategorien und -Items, Erklärungen
- **CSS:** Dezentes Inline-Highlighting (gelb/rot/blau/grün Hintergrund) für Light + Dark Mode

---

**5 Fixes: Teilfragen, Demo, FiBu-Fachbegriffe, Kontrast, Pool-Farben** (23.03.2026) ✅

### Session 23.03.2026 — Bugfixes + FiBu-Verbesserungen

#### Bugfixes
- **Teilfragen-Status:** Fragen mit Teilaufgaben (R/F, Lückentext, Berechnung, Zuordnung) werden erst grün markiert wenn ALLE Teile beantwortet sind. Neue Utility `antwortStatus.ts` mit `istVollstaendigBeantwortet()`.
- **"Meine Antworten ansehen":** Button nur im Demo-Modus sichtbar. Im echten Prüfungsbetrieb steuert die LP die Korrektur-Einsicht.

#### FiBu-Fachbegriffe
- **Bilanz/ER SuS-Ansicht:** Placeholder `"Kontenhauptgruppe"` statt `"Gruppenname (z.B. Umlaufvermögen)"` — korrekte Fachterminologie.
- **Konten-Referenztabelle erweitert:** Zeigt neu Kontenklasse (farbige Badges: Aktiven=gelb, Passiven=rot, Aufwand=blau, Ertrag=grün) und Kontenhauptgruppe aus dem Kontenrahmen.
- **LP-Editor:** Gleiche Placeholder-Anpassungen.

#### Übungspools
- **FiBu-Kontenfarben:** Auto-Badges erkennen Kontenkategorien im Fragetext (Aktivkonto=gelb, Passivkonto=rot, etc.). Zusätzlich `fibu:`-Tag-System für explizite Zuordnung. CSS für Light + Dark Mode.

#### Unterrichtsplaner
- **Light Mode Kontrast:** Indigo-300/400 in der invertierten Palette dunkler gemacht für WCAG AA Kontrast (≥4.5:1 auf weissem Hintergrund).

---

**Farbkonzept + UX-Fixes** (22.03.2026, Abend-Session) ✅

### Session 22.03.2026 Abend — Farbkonzept, FiBu-UX, Demo-Fixes (9 Commits)

#### Farbkonzept (3-Schichten-Modell, verbindlich)
- **Schicht 1 — Fachbereich:** VWL=#f97316, BWL=#3b82f6, Recht=#22c55e, IN=#6b7280
- **Schicht 2 — FiBu (Lehrmittel):** Aktiv=gelb, Passiv=rot, Aufwand=blau, Ertrag=grün
- **Schicht 3 — UI-Funktionsfarben:** Ausgewählt=**Indigo** (#6366f1), Korrekt=grün, Falsch=rot, Unsicher=amber
- Mockups: `Projektdateien/design-mockups.html`
- Memory: `design_farbkonzept.md`

#### Prüfungstool
- **Cursor-Bug T-Konto/Buchungssatz/Bilanz behoben:** useState statt Neuberechnung bei jedem Render
- **Indigo statt Blau** für alle Auswahl-Highlights (MC, R/F, Zuordnung, Lückentext, Freitext, FiBu)
- **FiBu-Farb-Badges:** Kontenkategorie im T-Konto (gelb/rot/blau/grün nach Lehrmittel)
- **KontenSelect:** Kategorie-Farben an Lehrmittel angeglichen + LP-konfigurierbarer Toggle (`zeigeKategoriefarben`)
- **Geschäftsfall-Nummer (#):** Eingabefeld neben T-Konto-Einträgen
- **Buchungssatz/Bilanz neutral:** Soll/Haben grau (kein Farbhinweis), Bilanz nach SuS-Wahl (Aktiven=gelb, Passiven=rot)
- **Material-Button grün** statt blau, Unsicher-Button neben Weiter
- **Indigo-Hervorhebung** für alle ausgefüllten Felder (CSS :not(:placeholder-shown) + Komponenten-Level)
- **Detaillierte KorrekturEinsicht:** MC-Optionen mit ✓/✗ im Radio-Icon, R/F mit farbigen Buttons
- **3 Demo-Bugs gefixt:** LP Freischalten/Beenden simuliert, SuS Abmelden-Button auf Startbildschirm

#### Übungspools
- **COLOR_SCHEMES angeglichen:** Hex-Werte auf Design-System (#f97316, #3b82f6, #22c55e)
- **Informatik (IN)** hinzugefügt: #6b7280

#### Unterrichtsplaner
- **130 blue→indigo Ersetzungen** in 28 Komponenten (Fokus, Selektion, Buttons)
- **Indigo-Palette für Light Mode** in index.css (invertiert wie Slate/Gray)
- **0 verbleibende blue-Klassen** in .tsx-Dateien

---

**Grosse Feature-Session** (22.03.2026) ✅

### Session 22.03.2026 — 15 Features/Fixes, ~3'400 Zeilen

#### Neue Features
- **Prüfungstracker:** Tab auf LP-Startseite mit fehlenden SuS, Noten-Stand (MiSDV), Status-Badges pro Prüfung. Backend: `ladeTrackerDaten` Endpoint.
- **SuS-Korrektur-PDFs:** Druckbare Vollbild-Ansicht pro SuS (KorrekturPDFAnsicht.tsx). PDF-Button pro SuS + "Korrektur-PDFs" im Dashboard.
- **SEB-Vorbereitung:** SuS-Installationsanleitung, Auto-Config-Download (.seb-Datei mit Prüfungs-URL), harte Durchsetzung (Start blockiert, LP-Ausnahme pro SuS).
- **Fragen-Statistiken:** Per-Frage Lösungsquoten über alle Prüfungen. Badges in DetailKarte/KompaktZeile, aufklappbare Statistik im Editor.
- **Ergebnis-Export (detailliert):** CSV mit Antwort-Text + Punkten pro Frage/SuS (wie Google Forms).
- **Pool "Unsicher"-Markierung:** SuS markieren unsichere Fragen → werden am Ende wiederholt.
- **Pool: LZ-Filter + Schnellstart + Tags:** Lernziel-Filterung, 3 Schnellstart-Buttons (Einfach/Mittel+Schwer/Alle), Tag-Chips.
- **Materialien-Filter (📎):** Toggle in Fragenbank für Fragen mit Anhängen.
- **Musterprüfung:** Alle 11 Fragetypen, 16 Fragen, 50 Punkte, 8 Testschüler.
- **SuS-UX-Verbesserungen:** Navigation über der Frage, farbige Übersichts-Icons, Abgeben-Button hervorgehoben.

#### Bugfixes
- LP-E-Mail korrigiert (`yannick.durand@gymhofwil.ch`)
- Lernziele-Dropdown leer (fehlende email im API-Call)
- Build-Fix (unbenutzte Imports ZuordnungFrage/LueckentextFrage)
- Abschnitte-Klickbereich (ganze Kopfzeile klickbar)
- Textarea Touch-Resize (field-sizing:content für iPad)
- KI-Button für Kontenauswahl im Buchungssatz-Editor

#### Dokumentation
- HANDOFF, README, In-App Hilfe aktualisiert
- Roadmap Multi-LP + Synergie-Analyse (3 Tools)
- Variablen-Harmonisierung dokumentiert (Migrationsplan)
- Evento REST API: Bestätigt vom Schulinformatiker (Abklärung Zugang nötig)

#### iPad-Test-Feedback (22.03.2026)
- ✅ Textfeld Auto-Resize funktioniert
- ✅ Tastatur-Eingabe funktioniert
- 🔜 SuS-Navigation über der Frage (implementiert)
- 🔜 Übersichts-Icons farblich hervorgehoben
- 🔜 Abgeben-Button grün hervorgehoben
- 🔜 Unsicher-Button bei der Frage statt im Header

---

**Kleinere Fixes + Doku-Update** (22.03.2026) ✅

### Session 22.03.2026 — Fixes + Dokumentation
- **LP-E-Mail korrigiert:** `yannick.durand@gymhofwil.ch` statt alter E-Mail in `authStore.ts`
- **Fragetyp-Reihenfolge:** Freitext → MC → R/F → Lückentext → Zuordnung → Berechnung → FiBu → Aufgabengruppe (Freitext als Standard)
- **Dokumentation:** HANDOFF.md, README.md, HilfeSeite.tsx aktualisiert auf aktuellen Stand
- **Roadmap Multi-LP:** Neue Sektion im HANDOFF mit Feature-Sammlung für Skalierung

---

**fragenMap-Sync + Build-Fixes + DurchfuehrenDashboard** (22.03.2026) ✅

### Session 22.03.2026 — fragenMap-Sync + Refactoring DurchfuehrenDashboard

#### Bug-Fix: fragenMap-Sync zwischen Composer und FragenBrowser
- **Problem:** Neue/bearbeitete Fragen im FragenBrowser wurden nicht in der `fragenMap` des PruefungsComposers aktualisiert → Anzeige "nicht gefunden" im Abschnitte-Tab
- **Ursache:** `PruefungsComposer` und `FragenBrowser` laden die Fragenbank unabhängig. Nur FragenBrowser aktualisiert seine lokale Liste bei neuen Fragen.
- **Fix:** Neuer `onFrageAktualisiert`-Callback: FragenBrowser meldet Änderungen an Composer, der seine `fragenMap` sofort synchronisiert
- **Betroffene Dateien:** `FragenBrowser.tsx` (neuer Prop + Aufrufe bei Speichern/Import), `PruefungsComposer.tsx` (neuer Callback + Prop-Durchreichung)

#### Refactoring: DurchfuehrenDashboard ersetzt MonitoringDashboard + PhaseHeader
- `DurchfuehrenDashboard.tsx` (neu): Vereint Monitoring-Funktionalität mit Tab-basierter Navigation (Vorbereitung, Lobby, Live, Ergebnisse, Korrektur)
- `MonitoringDashboard.tsx` + `PhaseHeader.tsx`: Gelöscht (Funktionalität in DurchfuehrenDashboard integriert)
- `LPStartseite.tsx`: "Durchführen"/"Bearbeiten"-Buttons statt altem Layout
- `KorrekturDashboard.tsx`: Aufgeräumt
- `FragenBrowserHeader.tsx`: Filter-Verbesserungen

#### Build-Fixes
- Unbenutzte Variablen (`pruefungsUrl`, `abgaben`, `fragen`, `nachrichten`) bereinigt — Vite-Build scheiterte an `noUnusedLocals`

---

**Refactoring: Code-Strukturierung** (22.03.2026) ✅

### Session 22.03.2026 — Refactoring (3 Dateien, 5 Phasen)

Rein strukturelles Refactoring ohne Verhaltensänderungen.

| Datei | Vorher | Nachher | Reduktion |
|-------|--------|---------|-----------|
| FragenEditor.tsx | 1'705 Z. | 684 Z. | -60% |
| apiService.ts | 1'008 Z. | 55 Z. (Barrel) | -95% |
| FragenBrowser.tsx | 923 Z. | 381 Z. | -59% |

#### Phase 1: apiService.ts → Domain-Module
- `services/apiClient.ts` — Shared HTTP-Schicht (postJson, postBool, getJson, fileToBase64)
- 8 Domain-Module: pruefungApi, fragenbankApi, korrekturApi, poolApi, klassenlistenApi, uploadApi, nachrichtenApi, monitoringApi
- `apiService.ts` als Barrel-Re-Export (alle 27 Import-Stellen unverändert)

#### Phase 2: FragenEditor.tsx — Logik extrahiert
- `utils/musterloesungGenerierung.ts` — 5 reine FiBu-Musterlösungs-Generatoren
- `utils/fragenValidierung.ts` — `validiereFrage()` mit explizitem Parameter-Objekt
- `hooks/usePanelResize.ts` — Wiederverwendbarer Resize-Hook (auch in FragenBrowser)
- `utils/fragenFactory.ts` — `erstelleFrageObjekt()` Frage-Objekt-Konstruktion

#### Phase 3: FragenEditor.tsx — JSX-Sections extrahiert
- `frageneditor/sections/MetadataSection.tsx` — Fachbereich, Bloom, Thema, etc.
- `frageneditor/sections/FragetextSection.tsx` — Fragetext + KI-Buttons
- `frageneditor/sections/TypEditorDispatcher.tsx` — 11 Typ-Editoren + KI
- `frageneditor/sections/MusterloesungSection.tsx` — Musterlösung + KI

#### Phase 4: FragenBrowser.tsx refactored
- `hooks/useFragenFilter.ts` — Filter-/Sort-/Gruppen-Logik
- `fragenbrowser/KompaktZeile.tsx`, `DetailKarte.tsx`, `PoolBadges.tsx` — Sub-Komponenten
- `fragenbrowser/FragenBrowserHeader.tsx` — Header + Filter-Controls
- `fragenbrowser/gruppenHelfer.ts` — Gruppen-Utilities

#### Aufräumen
- `KlassenAuswahl.tsx` gelöscht (toter Code, ersetzt durch KursAuswahl)
- HANDOFF.md offene Punkte aktualisiert (veraltete Einträge korrigiert)

---

**Phase 5j: Kurs-basierte Teilnehmer-Auswahl + Bugfixes** (22.03.2026) ✅

### Session 22.03.2026 — Kurs-basierte Auswahl + Bugfixes

#### Umbau: Kurs-basierte statt Klasse-basierte Auswahl
- **Problem:** Prüfungen werden pro Kurs/Gefäss geschrieben (z.B. SF 28bc29fs), nicht pro Stammklasse. SuS können in mehreren Kursen vorkommen (z.B. 29f in EWR + SF).
- **Neues Konzept:** Sheet-Name = Kurs. Auswahl erfolgt per Kurs-Button, nicht per Klassen-Button.
- **`KursAuswahl.tsx`** (neu): Zeigt Kurs-Buttons mit SuS-Anzahl, aufklappbare Details nach Klasse, Alle/Keine-Buttons
- **`VorbereitungPhase.tsx`** (umgebaut): Gruppiert nach Kurs statt Klasse. Dedup-Logik: beim Abwählen eines Kurses werden SuS nur entfernt wenn kein anderer gewählter Kurs sie abdeckt.
- **`KlassenAuswahl.tsx`**: Nicht mehr verwendet (kann entfernt werden)

#### Bugfixes
- **"Zur Korrektur"-Button** (BeendetPhase): War `() => { /* TODO */ }`, navigiert jetzt zu `?ansicht=korrektur`
- **"Ergebnisse exportieren"-Button** (BeendetPhase): War `() => { /* TODO */ }`, erstellt jetzt Teilnahme-CSV (Name, Status, Zeiten, Fortschritt)
- **BeendenDialog Doppelklick**: `setLade(false)` lief vor Phasenwechsel → Button wurde re-enabled. Fix: `lade` bleibt true bei Erfolg.
- **TeilnehmerListe**: Von flacher Liste auf collapsible Klassen-Gruppen umgebaut
- **Klassenlisten Header-Erkennung**: Apps Script erkennt jetzt Spalten-Header automatisch (Klasse, E-Mail etc.) statt feste Positionen
- **SuS-Deduplizierung**: `gesehen`-Set verhindert Duplikate wenn SuS in mehreren Kurs-Sheets vorkommt

#### Neue/Geänderte Dateien
- `src/components/lp/KursAuswahl.tsx` (neu) — Kurs-basierte Auswahl-Buttons
- `src/components/lp/VorbereitungPhase.tsx` — Komplett auf Kurs-Logik umgebaut
- `src/components/lp/TeilnehmerListe.tsx` — Collapsible Klassen-Gruppen
- `src/components/lp/MonitoringDashboard.tsx` — onKorrektur + onExportieren implementiert
- `src/utils/exportUtils.ts` — `exportiereTeilnahmeCSV()` + `downloadCSV()`
- `src/components/lp/BeendenDialog.tsx` — Doppelklick-Fix
- `apps-script-code.js` — Header-Autoerkennung + `kurs: sheetName` Feld

---

**Phase 5i: Prüfungs-Workflow (Teilnehmer → Lobby → Aktiv → Beendet)** (21.03.2026) ✅

### Session 21.03.2026 — Prüfungs-Workflow

#### Neues Feature: 4-Phasen-Workflow im MonitoringDashboard

State-Machine mit 4 Phasen: `vorbereitung → lobby → aktiv → beendet`, deterministisch abgeleitet aus bestehendem State (kein neues Feld nötig).

**Phase-Ableitung (Priorität):**
1. `beendetUm` gesetzt → `beendet`
2. `freigeschaltet` → `aktiv`
3. `teilnehmer` vorhanden + mindestens 1 SuS eingeloggt → `lobby`
4. Sonst → `vorbereitung`

**Vorbereitung (`VorbereitungPhase.tsx`):**
- Klassenlisten von Google Sheets laden (neuer Endpoint `ladeKlassenlisten`)
- Klassen-Toggle (Checkboxen), individuelle De-/Selektion
- Manuelles Hinzufügen per E-Mail
- Einladungs-E-Mails senden (HTML-E-Mail via MailApp)
- Link kopieren, "Prüfung starten" → speichert Teilnehmer + setzt `freigeschaltet`

**Lobby (`LobbyPhase.tsx`):**
- Fortschrittsbalken (bereit/ausstehend/unerwartet)
- Unerwartete SuS werden der LP angezeigt (semi-offener Zugang)
- "Freischalten" und "Zurück"-Buttons

**Aktiv (`AktivPhase.tsx` + `ZusammenfassungsLeiste.tsx` + `SusDetailPanel.tsx`):**
- Live-Monitoring-Tabelle mit QuickFilter + Sortierung
- Inaktivitäts-Warnstufen: 🟡 1min, 🟠 3min, 🔴 5min (abgeleitet aus letzterHeartbeat/Save)
- Zusammenfassungsleiste: aktiv/abgegeben/ausstehend
- Slide-in Detail-Panel pro SuS mit Fragen-Grid + technische Stats
- BeendenDialog-Integration (Sofort/Restzeit, Einzel/Global)

**Beendet (`BeendetPhase.tsx`):**
- Zusammenfassungs-Grid (Teilnehmer, Abgegeben, Durchschnitt, Dauer)
- Status-Tabelle aller SuS
- Export- und Korrektur-Buttons (Platzhalter)

**SuS-Wartebildschirm (`Startbildschirm.tsx`):**
- Puls-Animation (🔒 + `animate-ping`) statt SVG-Lock
- Text: "Die Lehrperson hat die Prüfung noch nicht freigegeben."
- 3s-Polling bis `freigeschaltet === true`

**PhaseHeader (`PhaseHeader.tsx`):**
- Status-Badge mit phasenspezifischen Farben/Icons (⚙️🟡🟢⏹)
- Timer-Anzeige während aktiver Phase

#### Neue Komponenten (8 Dateien)
- `src/components/lp/PhaseHeader.tsx` — Status-Badge + Timer
- `src/components/lp/KlassenAuswahl.tsx` — Klassen-Grid mit Checkboxen
- `src/components/lp/TeilnehmerListe.tsx` — Scrollbare Teilnehmer-Liste
- `src/components/lp/VorbereitungPhase.tsx` — Orchestrierung Teilnehmer-Auswahl
- `src/components/lp/LobbyPhase.tsx` — Bereitschafts-Lobby
- `src/components/lp/AktivPhase.tsx` — Live-Monitoring mit Inaktivitäts-Warnung
- `src/components/lp/ZusammenfassungsLeiste.tsx` — Aktiv/Abgegeben/Ausstehend
- `src/components/lp/SusDetailPanel.tsx` — Slide-in Detail-Panel
- `src/components/lp/BeendetPhase.tsx` — Zusammenfassung nach Prüfungsende

#### Geänderte Dateien
- `src/types/pruefung.ts` — `Teilnehmer` Interface, `teilnehmer?` + `beendetUm?` in Config
- `src/types/monitoring.ts` — `aktuelleFrage: number | null`, `PruefungsPhase` Type
- `src/utils/phase.ts` — `bestimmePhase()`, `letzteAktivitaet()`, `inaktivitaetsStufe()`
- `src/services/apiService.ts` — 3 neue Methoden: `ladeKlassenlisten()`, `setzeTeilnehmer()`, `sendeEinladungen()`
- `src/hooks/usePruefungsMonitoring.ts` — Heartbeat sendet `aktuelleFrage`
- `src/components/lp/MonitoringDashboard.tsx` — Config-Laden, Phase-Router, Phase-Komponenten
- `src/components/Startbildschirm.tsx` — Puls-Animation im Warteraum
- `src/data/demoMonitoring.ts` — `aktuelleFrage` zu allen Demo-SuS
- `apps-script-code.js` — 3 neue Endpoints: `ladeKlassenlisten`, `setzeTeilnehmer`, `sendeEinladungen` + Heartbeat `aktuelleFrage` + Config `teilnehmer`/`beendetUm` + Monitoring `aktuelleFrage`/`klasse`

#### Specs & Pläne
- Spec: `docs/superpowers/specs/2026-03-21-pruefungs-workflow-design.md`
- Plan: `docs/superpowers/plans/2026-03-21-pruefungs-workflow.md`

#### Wichtig nach Push
- `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung erstellen
- Sheet "Klassenlisten" muss existieren (wird von `ladeKlassenlisten` gelesen)
- `KLASSENLISTEN_ID` in apps-script-code.js anpassen falls nötig

---

**Phase 5h: Open-End-Modus + LP-kontrolliertes Beenden** (21.03.2026) ✅

### Session 21.03.2026 — Open-End & LP-Beenden

#### Neues Feature: Open-End-Prüfungsmodus
- **`zeitModus: 'countdown' | 'open-end'`** in PruefungsConfig — LP wählt im Composer
- **Timer**: Open-End zeigt Stoppuhr aufwärts (+MM:SS), Countdown wie bisher
- **Startbildschirm**: Zeigt "Open-End" / "Kein Zeitlimit" statt Minutenangabe
- **ConfigTab**: Zeitmodus-Toggle, Dauer/Zeitanzeige nur bei Countdown sichtbar

#### Neues Feature: LP-kontrolliertes Beenden
- **BeendenDialog** (`src/components/lp/BeendenDialog.tsx`): Sofort oder mit Restzeit (1–60 Min.), global oder individuell
- **MonitoringDashboard**: "Beenden"-Button im Header (nur wenn aktive/inaktive SuS vorhanden)
- **SchuelerZeile**: "Beenden"-Button pro SuS (nur bei Status aktiv/inaktiv)
- **Heartbeat-Erweiterung**: Response enthält `beendetUm` + `restzeitMinuten`, Client erkennt Signal
- **Timer-Umschaltung**: Bei Restzeit-Modus wechselt Open-End-Stoppuhr zu Countdown
- **Nachteilsausgleich**: Bei Restzeit-Modus bekommen SuS mit Zeitverlängerung zusätzliche Minuten
- **Auto-Abgabe**: Wie bei Zeitablauf — localStorage + Remote-Speicherung
- **Layout-Banner**: Gelbes Banner "LP hat Prüfung beendet — Restzeit läuft" + angepasster Dialog-Text

#### Backend (Apps Script)
- **`beendePruefungEndpoint`**: Setzt `beendetUm` in Configs-Sheet (global) oder Antworten-Sheet (individuell)
- **Heartbeat**: Prüft individuelles → globales `beendetUm` und liefert es zurück
- **Config-Mapping**: `zeitModus` Feld hinzugefügt
- **Spalten-Migration**: `beendetUm` + `restzeitMinuten` Spalten werden automatisch angelegt
- **Wichtig nach Push:** `apps-script-code.js` in Apps Script Editor kopieren + neue Bereitstellung

#### Betroffene Dateien
- Types: `pruefung.ts` (zeitModus), `monitoring.ts` (HeartbeatResponse, beendet-lp Status)
- Utils: `zeit.ts` (berechneVerstricheneZeit, formatVerstricheneZeit)
- Store: `pruefungStore.ts` (beendetUm, restzeitMinuten, Version 3 Migration)
- Services: `apiService.ts` (heartbeat JSON-Response, beendePruefung Endpoint)
- Hooks: `usePruefungsMonitoring.ts` (beendetUm-Erkennung)
- Components: `Timer.tsx` (komplett überarbeitet), `Layout.tsx`, `Startbildschirm.tsx`
- LP-Components: `BeendenDialog.tsx` (neu), `MonitoringDashboard.tsx`, `SchuelerZeile.tsx`, `ConfigTab.tsx`
- Defaults: `PruefungsComposer.tsx`, `LPStartseite.tsx`, `demoPruefung.ts`
- Backend: `apps-script-code.js`
- Spec: `docs/superpowers/specs/2026-03-21-open-end-lp-beenden-design.md`
- Plan: `docs/superpowers/plans/2026-03-21-open-end-lp-beenden.md`

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
- FragenEditor.tsx ist auf ~1705 Zeilen gewachsen — Kandidat für Refactoring (Musterlösungs-Generierung + Speicher-Logik in Hooks extrahieren)
- KI-Buttons (KIFiBuButtons.tsx) sind in alle FiBu-Editoren via `titelRechts` eingebaut ✅

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
- **FragenBrowser:** "↑ Pool-Export" Batch-Button → öffnet BatchExportDialog
- **BatchExportDialog.tsx:** Batch-Export mehrerer Fragen in Pools — 2 Phasen (Auswahl → Pool/Topic-Zuweisung), Bulk-Zuweisung, Fortschrittsanzeige, gruppiert API-Calls pro Pool-Datei
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
- **Apps Script Deployment nötig:** `apps-script-code.js` muss nach jedem Push in Apps Script Editor kopiert + neue Bereitstellung erstellt werden

### Was funktioniert
- **E2E-Flow getestet:** Login → Prüfung laden → Ausfüllen → Abgabe → Antwort-Datei in Google Drive ✅
- Startbildschirm mit Prüfungsinfo + Sitzungswiederherstellung
- **11 Fragetypen:** MC (Einzel-/Mehrfachauswahl), Freitext (Tiptap), Lückentext, Zuordnung, Richtig/Falsch, Berechnung, Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER, Aufgabengruppe
- Fragennavigation mit Kacheln (✓ beantwortet, ? unsicher, — offen)
- Timer mit Countdown + Warnungen (15 Min. orange, 5 Min. rot)
- Auto-Save: LocalStorage (sofort) + IndexedDB (15s) + Remote via Apps Script (30s, konfigurierbar)
- Light/Dark Mode: System-Erkennung + manueller Toggle
- Abgabe-Dialog mit Bestätigung + Statusübersicht + Sende-Status + Retry
- **Musterprüfung:** 16 Demo-Fragen (alle 11 Typen inkl. FiBu + Aufgabengruppe), 5 Abschnitte, 50 P., 8 Testschüler
- GitHub Actions Deploy (mit Env-Variablen für Backend)
- Login-Screen (Google OAuth + Schülercode mit E-Mail + Demo-Modus)
- Auth-Store (Session via sessionStorage, Rollen-Erkennung aus E-Mail-Domain)
- API-Service (Apps Script Backend, CORS-sicher mit `text/plain`)
- URL-basierte Prüfungs-ID (`?id=PRUEFUNGS_ID` → lädt Config vom Backend)
- Monitoring-Hook (Auto-Save, Remote-Save, Heartbeat, Focus-Detection, Online/Offline)
- **SEB komplett:** User-Agent-Erkennung + Warnbanner + harte Durchsetzung (Start blockiert) + LP-Ausnahme pro SuS + Auto-Config-Download (.seb-Datei) + SuS-Installationsanleitung
- LP-Monitoring-Dashboard (Live-Übersicht aller SuS)
- **LP-Startseite:** Prüfungen verwalten, Durchführen/Bearbeiten-Buttons, Filter/Suche
- **Prüfungs-Composer:** 4-Tab-Editor (Einstellungen, Abschnitte & Fragen, Vorschau, Analyse) + Autosave
- **DurchfuehrenDashboard:** Tab-basiert (Vorbereitung → Lobby → Live → Ergebnisse → Korrektur)
- **4-Phasen-Workflow:** vorbereitung → lobby → aktiv → beendet (State-Machine, deterministische Ableitung)
- **Kurs-basierte Teilnehmer-Auswahl:** Pro Kurs/Gefäss statt Klasse, Dedup bei Mehrfach-Kursen
- **Fragenbank-Browser:** Slide-over mit Filtern (Fachbereich, Typ, Bloom, Freitext-Suche, Pool-Status, 📎 Anhang-Filter) + Fragen-Statistiken (📊 Lösungsquote, Verwendungen)
- **Fragenbank-Editor:** Alle 11 Fragetypen erstellen/bearbeiten + in Google Sheets speichern + Statistik-Box (aufklappbar)
- **Prüfungstracker:** Tab auf LP-Startseite — Fehlende SuS (gruppiert nach Prüfung), Noten-Stand pro Kurs (MiSDV), Status-Badges pro Prüfung
- **SuS-Korrektur-PDFs:** Druckbare Vollbild-Ansicht pro SuS (KorrekturPDFAnsicht.tsx), PDF-Button pro SuS + im Dashboard
- **Ergebnis-Export (detailliert):** CSV mit Antwort-Text + Punkten pro Frage/SuS (wie Google Forms)
- **SuS-UX:** Navigation (Weiter/Zurück + Unsicher) über der Frage, Abgeben-Button grün, Übersichts-Icons farbig
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

### Offene Aufgaben — Konsolidiert (Stand 23.03.2026 Nacht)

#### 🔴 Kurzfristig (nächste Sessions)

| # | Projekt | Aufgabe | Aufwand |
|---|---------|---------|--------|
| 1 | Prüfungstool | **Pool-Rück-Sync Live-Test** — GITHUB_TOKEN konfiguriert, End-to-End-Test noch offen | Klein |

#### 🟡 Mittelfristig (vor produktivem Einsatz)

| # | Projekt | Aufgabe |
|---|---------|---------|
| 2 | Prüfungstool | **Tablet/Smartphone-Tests** — responsive gebaut, spezifisch noch nicht getestet |
| 3 | Prüfungstool | **Evento REST-Zugang** beantragen → Klassenlisten-Sync (Schulinformatiker hat bestätigt, 22.03.) |
| 4 | Prüfungstool | **Pool-Fehlerquoten explizit filtern** — Sortier-/Filteroptionen in FragenBrowser nach Performance-Daten |

#### 🟢 Längerfristig (Roadmap)

| # | Projekt | Aufgabe |
|---|---------|---------|
| 8 | Alle | **Variablen-Harmonisierung** — `subjectArea`→`fachbereich`, `topicMain`→`thema` etc. (Prüfungstool ist Referenz) |
| 9 | Prüfungstool | **Kollaboratives Korrigieren** — mehrere LP korrigieren dieselbe Prüfung (Architektur-Klärung nötig) |
| 10 | Alle | **Skalierung/Multi-LP** — erst wenn alle Apps für DUY fertig stehen |
| 11 | Unterrichtsplaner | **Live-Sync / Cloud-Backend** — erst wenn Planer in definitiver Version |

#### ✅ Bereits erledigt (Referenz)

- ~~Buchhaltungs-Fragetyp~~ ✅ 4 FiBu-Typen + Aufgabengruppe (21.03.)
- ~~Pool-Rück-Sync + Batch-Export~~ ✅ (21.03.)
- ~~Open-End + LP-Beenden~~ ✅ Phase 5h (21.03.)
- ~~4-Phasen-Workflow~~ ✅ Phase 5i (21.03.)
- ~~Kurs-basierte Teilnehmer-Auswahl~~ ✅ Phase 5j (22.03.)
- ~~Prüfungstracker + SuS-PDFs + SEB + Statistiken + Excel-Export~~ ✅ (22.03.)
- ~~FiBu-Farben + Konten-Highlighting in Pools~~ ✅ (23.03.)
- ~~Demo-Modus Fixes (Session, Beenden, Fallback)~~ ✅ (23.03.)
- ~~Unsicher-Button~~ ✅ implementiert + UX verbessert (23.03.)
- ~~Materialien-Filter (📎 Toggle)~~ ✅ (22.03.)
- ~~SEB komplett~~ ✅ Auto-Config, harte Durchsetzung, LP-Ausnahme (22.03.)
- ~~Konten-Highlighting im Fragetext~~ ✅ war bereits integriert + Mini-Fix Zeile 1673 (23.03.)
- ~~Light Mode Kontrast (UP + Prüfung)~~ ✅ UP war bereits via CSS-Vars geschützt, Prüfung: 400/500-Override (23.03.)
- ~~2-stufige Korrektur-Freigabe~~ ✅ Einsicht + PDF getrennt, zurücknehmbar (23.03.)
- ~~Trennschärfe~~ ✅ Punkt-biseriale Korrelation mit Part-Whole-Correction (23.03.)
- ~~Unterrichtsplaner-Bugs L1–L7~~ ✅ Alle bereits in v3.90–v3.102 behoben (verifiziert 23.03.)
- ~~Trennschärfe über mehrere Durchführungen~~ ✅ Backend + Aggregation + MetadataSection (23.03.)

### Roadmap: Multi-LP / Skalierung (Sammlung)

Ideen und Features für die Erweiterung auf mehrere Lehrpersonen. **Noch nicht umsetzen** — erst wenn DUY-Version stabil steht.

| Bereich | Feature | Beschreibung | Priorität |
|---------|---------|-------------|-----------|
| **Auth** | Multi-LP-Zugang | Mehrere LP-E-Mails in Whitelist, nicht nur DUY. Aktuell hardcoded in `authStore.ts` | Hoch |
| **Auth** | Rollenverwaltung | Admin-Rolle (kann alles) vs. LP-Rolle (eigene Fragen/Prüfungen). Aktuell: alle LP sind gleich | Mittel |
| **Daten** | LP-eigene Fragenbanken | Jede LP sieht nur ihre eigenen Fragen, oder teilt explizit. Aktuell: eine gemeinsame Fragenbank | Hoch |
| **Daten** | Cloud-Backend | Hauptdaten in Google Sheets (kein localStorage für Kerndaten). Bei Skalierung: Supabase / Firebase als Alternative prüfen | Mittel |
| **Kurse** | LP-eigene Kursverwaltung | LP können eigene Kurse/Klassen anlegen, nicht nur die von DUY | Hoch |
| **Kurse** | Fächer/Gefässe erweitern | Aktuell nur W&R (SF/EF/EWR/GF). Für Multi-LP braucht es beliebige Fächer und Gefässe | Hoch |
| **Kurse** | Evento-Integration | CLX.Evento (Kanton Bern) hat REST API mit OAuth. **Schulinformatiker bestätigt: Schnittstelle vorhanden (22.03.2026).** Nächster Schritt: API-Zugang beantragen, verfügbare Endpunkte testen (Klassenlisten, Kurse, SuS-Daten). | Mittel |
| **Sharing** | Geteilte Fragenpools | Fragen zwischen LPs teilen (opt-in, mit Freigabe-Mechanismus) | Mittel |
| **UX** | Tablet/Smartphone | Gezieltes Testing + Optimierung für Touch-Geräte (SuS-Ansicht) | Mittel |
| **Infra** | Multi-Tenant Sheets | Separate Sheets/Tabs pro LP oder zentrale Struktur mit LP-Kennung | Hoch |
| **Demo** | Demo-Modus absichern | Demo-Modus für andere LP zum Testen: keine Daten speichern/löschen möglich | Mittel |

### Synergie-Analyse: Übungspools ↔ Prüfungstool ↔ Unterrichtsplaner

#### Ist-Zustand

| Verbindung | Status |
|-----------|--------|
| Pools → Prüfungstool | ✅ Bidirektionaler Sync (Import + Rück-Export, Content-Hashing, Batch) |
| Pools → Unterrichtsplaner | ❌ Keine Verbindung |
| Prüfungstool → Unterrichtsplaner | ❌ Keine Verbindung |

#### Gemeinsame Datenfelder (schon identisch, aber verschieden benannt)

| Konzept | Übungspools | Prüfungstool | Unterrichtsplaner | Harmonisierung? |
|---------|-------------|-------------|-------------------|----------------|
| Fachbereich | `fach: "VWL"` | `fachbereich: "VWL"` | `subjectArea: "VWL"` | → `fachbereich` |
| Bloom-Stufe | `tax: "K1"` | `bloom: "K1"` | (nur in Lehrplanzielen) | → `bloom` |
| Thema | `topic` + `TOPICS.label` | `thema`, `unterthema` | `topicMain`, `topicSub` | → `thema` / `unterthema` |
| Lernziele | `POOL_META.lernziele[]` | `lernzielIds[]` | `curriculumGoal` (String) | → zentrale DB |
| Farben | `COLOR_SCHEMES` | `fachbereichFarbe()` | `generateColorVariants()` | ✅ Schon identisch |
| Schwierigkeit | `diff: 1-3` | `schwierigkeit` | ❌ | → `schwierigkeit` |

**Empfehlung Variablen-Harmonisierung:** Ja, langfristig sinnvoll. Bei nächstem Refactoring der Pools (`fach` → `fachbereich`, `tax` → `bloom`, `diff` → `schwierigkeit`) und des Planers (`subjectArea` → `fachbereich`, `topicMain` → `thema`). Pool-Format ist schwieriger zu ändern (26 Config-Dateien), daher Mapping im Converter beibehalten und schrittweise migrieren.

#### Synergie 1: Gemeinsames Datenmodell Kurse/Klassen (Priorität: Hoch)

Aktuell pflegt jedes Tool Kurse separat. Ziel: **eine Quelle, drei Konsumenten.**

**Option A: Google Sheet "Kurse"** — Eine zentrale Sheets-Tab mit Kursen (ID, Label, Gefäss, Klassen, Fach, LP). Alle Tools lesen daraus.

**Option B: Evento-Integration** — CLX.Evento (Schulverwaltung Kanton Bern) hat eine REST API mit OAuth. Klassenlisten und Kurs-Zuordnungen könnten automatisch synchronisiert werden. Abklärung nötig: Hat Gym Hofwil API-Zugang? Welche Daten sind verfügbar (SuS, Kurse, LP)?

**Kurzfristig:** Shared Google Sheet als Brücke. **Langfristig:** Evento als Single Source of Truth.

#### Synergie 2: Prüfungstracker + Notenvorgaben (Priorität: Hoch)

Durchgeführte Prüfungen im Planer UND Prüfungstool tracken:

- **Prüfungstool → Planer:** Nach Durchführung wird Prüfung automatisch in der entsprechenden Lektion eingetragen (Datum, Titel, ∅ Note, Notenverteilung). Neues Feld `pruefungId` in Planer-`LessonDetail`.
- **Prüfungstracker im Prüfungstool:** Übersicht aller durchgeführten Prüfungen pro Kurs. Wer hat gefehlt? Wer braucht Nachprüfung? Erinnerungsfunktion für ausstehende Nachprüfungen.
- **Noten-Stand (shared):** Planer hat `AssessmentRule` (min. Noten pro Semester). Prüfungstool kennt die Ergebnisse. Gemeinsame Ansicht: "Kurs SF 27a: 2/4 Noten gesetzt, noch 2 nötig bis KW 4". Sichtbar in BEIDEN Apps.
- **Fehlende SuS:** Automatische Liste nach Prüfungsende. "3 SuS nicht erschienen → Nachprüfung organisieren?" mit Vorschlag für Datum.

#### Synergie 3: Zentrale Lernziel-Datenbank (Priorität: Hoch)

Lernziele existieren in allen drei Tools in verschiedenen Formaten. Ziel: **eine Datenbank, drei Konsumenten.**

- Pools: `POOL_META.lernziele[]` → verlinken auf zentrale IDs
- Prüfungstool: `lernzielIds[]` → schon da!
- Planer: `curriculumGoal` (Freitext) → erweitern auf IDs
- **Abdeckungs-Analyse:** "Lernziel X: 3× geübt (Pools), 2× geprüft, in Sequenz Y unterrichtet"
- Planer zeigt auch ab, was **unterrichtet** wurde (nicht nur was geprüft wurde)

#### Synergie 4: Pool- und Prüfungs-Statistiken verwerten (Priorität: Mittel)

- Pool-Analytics (anonym): Fehlerquoten, Schwierigkeit, Reaktionszeiten → ins Prüfungstool einspeisen
- Prüfungstool: Beim Hinzufügen einer Pool-Frage anzeigen: "⚠️ 68% Fehlerquote im Übungspool"
- Prüfungstool-Statistiken (nach Korrektur): Lösungsquoten → zurück in Pools (Schwierigkeit anpassen)
- Trennschärfe-Analyse über mehrere Durchführungen derselben Frage

#### Synergie 5: Gemeinsame Materialien-Bibliothek (Priorität: Mittel)

- Google Drive als zentrale Ablage für Bilder, Grafiken, PDFs
- Validierte Visualisierungen können in Pools, Prüfungen und Unterricht wiederverwendet werden
- Prüfungstool: Filter "Fragen mit Anhängen" in Fragenbank (noch zu implementieren)
- Planer: `materialLinks[]` → gleiche Drive-Ordner referenzieren

#### Synergie 6: Pools ↔ LearningView ↔ Prüfungstool (Priorität: Mittel)

SuS nutzen den Planer nicht — sie arbeiten mit **LearningView**, wo Übungspools als Aktivitäten eingebettet sind. Daher:
- Stoffverteilung → Pool-Empfehlung läuft über LearningView (nicht über Planer)
- Wichtig: Pools beim Sync mit Prüfungstool aktuell halten → dynamisches Wachstum
- Pools werden besser durch: neue Fragen aus Prüfungstool (Rück-Sync), Statistik-basierte Schwierigkeitsanpassung, LP-Review
- xAPI-Scores fliessen von Pools → LearningView (schon implementiert)

### Variablen-Harmonisierung (TODO)

Die drei Tools verwenden teilweise unterschiedliche Namen für dieselben Konzepte. Ziel: schrittweise vereinheitlichen, um Synergien zu erleichtern.

| Konzept | Übungspools (pool.html) | Prüfungstool (React) | Unterrichtsplaner (React) | Zielname |
|---------|------------------------|---------------------|--------------------------|----------|
| Fachbereich | `fach` | `fachbereich` ✅ | `subjectArea` | `fachbereich` |
| Bloom-Stufe | `tax` | `bloom` ✅ | — | `bloom` |
| Thema | `topic` / `TOPICS.label` | `thema` ✅ | `topicMain` | `thema` |
| Unterthema | — | `unterthema` ✅ | `topicSub` | `unterthema` |
| Schwierigkeit | `diff` | `schwierigkeit` ✅ | — | `schwierigkeit` |
| Fragetext | `q` | `fragetext` ✅ | — | `fragetext` |
| Erklärung | `explain` | `erklaerung` (im Pool-Import) | — | `erklaerung` |
| Korrekte Antwort | `correct` | `korrekt` / `korrekteAntworten` | — | `korrekt` |
| Frage-ID | `id` (kurz, z.B. "d01") | `id` (z.B. "vwl-ft-abc1") | — | `id` |

**Migrationsplan:**
1. **Prüfungstool** ist Referenz — Variablen dort sind schon gut benannt (deutsch, konsistent)
2. **Übungspools**: 26 Config-Dateien müssten angepasst werden → grösserer Aufwand. Vorerst Mapping im `poolConverter.ts` beibehalten. Bei Gelegenheit Batch-Migration (Script das alle Configs umschreibt)
3. **Unterrichtsplaner**: `subjectArea` → `fachbereich`, `topicMain` → `thema`, `topicSub` → `unterthema` beim nächsten Refactoring. Breaking Change für Export/Import-Format → Migration nötig
4. **Reihenfolge**: Erst Planer (weniger Dateien betroffen), dann Pools (26 Dateien, Script-basiert)

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
│   │   ├── useTabKonflikt.ts           — BroadcastChannel Tab-Erkennung
│   │   ├── usePanelResize.ts          — Wiederverwendbarer Panel-Resize-Hook
│   │   └── useFragenFilter.ts         — Filter-/Sort-/Gruppen-Logik für Fragenbank
│   ├── services/
│   │   ├── autoSave.ts                  — IndexedDB Backup
│   │   ├── sebService.ts               — SEB User-Agent Erkennung
│   │   ├── retryQueue.ts              — IndexedDB Retry-Queue für fehlgeschlagene Saves
│   │   ├── authService.ts              — Google Identity Services Wrapper
│   │   ├── apiService.ts               — Barrel-Re-Export (27 Import-Stellen unverändert)
│   │   ├── apiClient.ts               — Shared HTTP-Schicht (postJson, postBool, getJson, fileToBase64)
│   │   ├── api/                        — 8 Domain-Module
│   │   │   ├── pruefungApi.ts, fragenbankApi.ts, korrekturApi.ts, poolApi.ts
│   │   │   ├── klassenlistenApi.ts, uploadApi.ts, nachrichtenApi.ts, monitoringApi.ts
│   │   └── poolSync.ts                 — Pool-Fetch, Parse, Delta-Berechnung, Content-Hash
│   ├── components/
│   │   ├── lp/
│   │   │   ├── LPHeader.tsx              — Shared LP-Header (ESC, Panels, Abmelden, ThemeToggle)
│   │   │   ├── LPStartseite.tsx         — LP-Startseite: Prüfungen verwalten + erstellen + duplizieren
│   │   │   ├── PruefungsComposer.tsx    — 4-Tab-Editor (Einstellungen, Abschnitte, Vorschau, Analyse) + Autosave
│   │   │   ├── FragenBrowser.tsx        — Slide-over: Fragenbank + Direktes Hinzufügen/Entfernen + Resize + Pool-Badges/Filter
│   │   │   ├── fragenbrowser/
│   │   │   │   ├── FragenBrowserHeader.tsx — Header + Filter-Controls
│   │   │   │   ├── KompaktZeile.tsx       — Kompakte Frage-Zeile
│   │   │   │   ├── DetailKarte.tsx        — Detail-Ansicht einer Frage
│   │   │   │   ├── PoolBadges.tsx         — Pool-Status-Badges
│   │   │   │   └── gruppenHelfer.ts       — Gruppen-Utilities
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
│   │   │   │   ├── useKIAssistent.ts  — KI-Assistent Hook (25 Aktionen inkl. 7 FiBu-Aktionen)
│   │   │   │   ├── sections/
│   │   │   │   │   ├── MetadataSection.tsx     — Fachbereich, Bloom, Thema, Punkte etc.
│   │   │   │   │   ├── FragetextSection.tsx    — Fragetext + KI-Buttons
│   │   │   │   │   ├── TypEditorDispatcher.tsx — 11 Typ-Editoren Dispatch
│   │   │   │   │   └── MusterloesungSection.tsx — Musterlösung + KI
│   │   │   │   └── FormattierungsToolbar.tsx  — Formatierungs-Buttons (B/I/Liste/Code)
│   │   │   ├── KorrekturDashboard.tsx   — KI-Korrektur: Review + Feedback
│   │   │   ├── KorrekturSchuelerZeile.tsx — Aufklappbare SuS-Zeile mit Bewertungen
│   │   │   ├── KorrekturFrageZeile.tsx   — Einzelne Frage: KI-Vorschlag + LP-Override
│   │   │   ├── SuSVorschau.tsx          — Fullscreen SuS-Vorschau (Preview aus Schüler-Sicht)
│   │   │   ├── DurchfuehrenDashboard.tsx — LP-Dashboard: Tab-basiert (Vorbereitung/Lobby/Live/Ergebnisse/Korrektur)
│   │   │   ├── KursAuswahl.tsx           — Kurs-basierte Teilnehmer-Auswahl (ersetzt KlassenAuswahl)
│   │   │   ├── BatchExportDialog.tsx     — Batch-Export mehrerer Fragen in Pools
│   │   │   ├── TeilnehmerListe.tsx      — Scrollbare Teilnehmer-Liste
│   │   │   ├── VorbereitungPhase.tsx    — Teilnehmer-Auswahl + Einladungen
│   │   │   ├── LobbyPhase.tsx           — Bereitschafts-Lobby (bereit/ausstehend)
│   │   │   ├── AktivPhase.tsx           — Live-Monitoring mit Inaktivitäts-Warnung
│   │   │   ├── ZusammenfassungsLeiste.tsx — Aktiv/Abgegeben/Ausstehend Zähler
│   │   │   ├── SusDetailPanel.tsx       — Slide-in Detail-Panel pro SuS
│   │   │   ├── BeendetPhase.tsx         — Zusammenfassung nach Prüfungsende
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
│       ├── phase.ts                     — bestimmePhase(), letzteAktivitaet(), inaktivitaetsStufe()
│       ├── zeitbedarf.ts               — Zeitbedarfs-Schätzung pro Fragetyp
│       ├── zeit.ts                      — Timer-Hilfsfunktionen
│       ├── fragenValidierung.ts       — validiereFrage() mit explizitem Parameter-Objekt
│       ├── fragenFactory.ts           — erstelleFrageObjekt() Frage-Objekt-Konstruktion
│       └── musterloesungGenerierung.ts — 5 FiBu-Musterlösungs-Generatoren
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
→ Siehe konsolidierte Liste oben unter **"Offene Aufgaben — Konsolidiert"**

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
