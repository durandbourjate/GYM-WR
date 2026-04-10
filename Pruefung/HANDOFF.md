# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Session 73 — Üben-Fragetyp-Crashes + Korrektur-Guard (10.04.2026)

### Stand
Branch `fix/ueben-fragetypen-korrektur`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **FiBu-Normalisierung (React Error #31)** | |
| F1 | Shared `normalizeKonten()` + `normalizeLabels()` Utility erstellt | normalizeKonten.ts (neu) |
| F2 | KontenbestimmungFrage: `konten.map(k => ({nr:k, name:k}))` → `normalizeKonten()` | KontenbestimmungFrage.tsx |
| F3 | BuchungssatzFrage: gleiche Normalisierung | BuchungssatzFrage.tsx |
| F4 | TKontoFrage: gleiche Normalisierung für Gegenkonten | TKontoFrage.tsx |
| **DragDrop-Labels (React Error #31)** | |
| D1 | Labels-Array normalisiert: Objekte `{id,text,zone}` → Strings | DragDropBildFrage.tsx |
| **Bilanz UX** | |
| B1 | `KontoMitSaldo.name?` Feld hinzugefügt + in BilanzFrage angezeigt | fragen.ts (shared + pruefung), BilanzFrage.tsx |
| **Hotspot UX** | |
| H1 | `maxKlicks` Fallback auf 1 bei fehlenden Bereiche-Daten | HotspotFrage.tsx |
| **Korrektur-Guard** | |
| K1 | try/catch um Korrektur-Daten-Laden (verhindert Crash bei API-Fehler) | useKorrekturDaten.ts |

### Neue Dateien (1)
- `src/utils/ueben/normalizeKonten.ts` — Shared Normalisierung für Konten + Labels

### Nicht gefixt (braucht Live-Test mit echten Daten)
- Bildbeschriftung/Hotspot: Code korrekt, Problem ist fehlende Daten in Pool-Konvertierung
- Zeichnen: `musterloesungBild` wird korrekt gerendert wenn vorhanden, Daten fehlen
- Aufgabengruppe: `teilaufgaben`-Loading braucht Backend-Verifikation
- Backup-Export "Keine Daten": Timing-Problem, braucht Live-Test

### Verifiziert
- ✅ tsc + 209 Tests + Build
- ✅ App startet ohne Console-Errors im Browser-Preview

---

## Session 72 — Editor-Crashes + Dropdown-Fix + Cleanup (10.04.2026)

### Stand
Branch `fix/editor-array-undefined-crashes`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Editor-Crashes (Session 1 aus IMPROVEMENT_PLAN)** | |
| E1 | `tags.join()` Crash gefixt: `(frage?.tags ?? []).join()` | SharedFragenEditor.tsx |
| E2 | 14 Array-Felder mit `?? []` abgesichert (luecken, optionen, paare, aussagen, ergebnisse, buchungen, konten, aufgaben, elemente, bereiche, beschriftungen, zielzonen, labels, kontenMitSaldi) | SharedFragenEditor.tsx |
| E3 | DragDropBildEditor: 3 unsichere `labels`-Zugriffe gefixt | DragDropBildEditor.tsx |
| **Dropdown-Bug** | |
| D1 | `alleStats` (ungefiltert) hinzugefügt — Fach/Typ-Dropdowns zeigen immer alle Optionen | useFragenFilter.ts, FragenBrowserHeader.tsx, FragenBrowser.tsx |
| **Cleanup** | |
| C1 | 191 macOS-Duplikat-Dateien (`" 2.svg"`) gelöscht | pool-bilder/ |
| C2 | 8 alte `lernen/`-Verzeichnisse + `AppLernen.tsx` gelöscht (toter Code nach Rename Session 68) | src/ |

### Verifiziert im Browser (Preview)
- ✅ App startet ohne Fehler
- ✅ Fragensammlung-Editor: Alle 6 crash-gefährdeten Typen (Lückentext, Bildbeschriftung, DragDrop, Hotspot, Kontenbestimmung, T-Konto) wechselbar ohne Crash
- ✅ Keine Console-Errors

### Offen (nächste Session)
- Session 2: Üben-Modus Fragetyp-Crashes + Korrektur-Bug
- Session 3: Navigation & Kopfzeile
- Session 4: Einstellungen + Stammdaten + Hardcoded-Audit
- Session 5: UX-Polish + Analyse-Verbesserungen
- Session 6: Performance + Erweiterte Features

---

## Session 71 — Grosses Bugfix & Feature-Paket (07.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅. 11 Commits in dieser Session.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Bugfixes (8)** | |
| B1 | Doppelte Header-Bar bei SuS Korrektur-Liste entfernt | KorrekturListe.tsx |
| B2 | Demo LP: Übungen-Tab + Fragensammlung laden korrekt (Mock-Gruppen) | UebungsToolView.tsx, LPStartseite.tsx |
| B3 | Demo SuS: Übungen hängt nicht mehr (IST_DEMO prüft auch Haupt-Auth) | AppUeben.tsx |
| B4 | SuS Abmelden-Bug: ladeStatus 'fertig' nach Logout (nicht 'idle') | authStore.ts (ueben) |
| B5 | "Fuer" → "Für" + Aufträge-Filter aus Kontext befüllt | AdminAuftraege.tsx |
| B6 | Skeleton-Header im Suspense-Fallback (kein Ladeblitz) | SuSStartseite.tsx |
| B7 | Bloom-Guard: analyseUtils crasht nicht mehr bei undefined bloom | analyseUtils.ts |
| B8 | ThemenSichtbarkeit: Header-Migration + robustes Lesen (leere fach/thema gefixt) | apps-script-code.js |
| **Features (12)** | |
| F1 | Unterthemen einzeln aktivierbar (Checkboxen, Auto-Aktivierung, immer sichtbar) | AdminThemensteuerung.tsx, themenSichtbarkeit.ts, themenSichtbarkeitStore.ts |
| F2 | Multi-Prüfungs-Dashboard per Button (Checkbox-Dialog) | LPStartseite.tsx |
| F3 | Teilen-Link pro Prüfung/Übung (🔗 Button in PruefungsKarte) | LPStartseite.tsx |
| F4 | Lernziel-Panel: 3-stufiges Akkordeon (Fach → Thema → Unterthema → LZ) | LernzieleAkkordeon.tsx (neu), AppShell.tsx |
| F5 | Metadaten-Rubrik: "Zuordnung" → "Metadaten", vor Fragetyp, mit Lernziel-Checkboxen | MetadataSection.tsx, SharedFragenEditor.tsx, fragenFactory.ts |
| F6 | Übungs-Einsicht für SuS: Session-Historie (localStorage) + Ergebnisse-Tab | UebungsEinsicht.tsx (neu), uebungsStore.ts, Dashboard.tsx |
| F7 | Lernziel-Zuordnung: lernzielIds in FrageBasis persistierbar | SharedFragenEditor.tsx, fragenFactory.ts |
| F8 | Fortschritt-Sync zum Backend: Debounced Queue (5s) | fortschrittStore.ts, appsScriptAdapter.ts |
| F9 | SuS-Dashboard: Unterthemen-Filter (nur aktive Unterthemen anzeigen) | Dashboard.tsx |
| F10 | LP Themen-Badge: "z.T. aktiv" bei partieller Unterthemen-Aktivierung | AdminThemensteuerung.tsx |
| F11 | Themen-Karten: 🏁 Button + Mini-Modal mit Lernzielen pro Thema | ThemaKarte.tsx, Dashboard.tsx |
| F12 | Lernziele-Import: 316 Pool-Lernziele mit thema+unterthema ins Backend | scripts/importLernziele.mjs, apps-script-code.js |

### Neue Dateien (3)
- `src/components/ueben/LernzieleAkkordeon.tsx` — Akkordeon-Modal + Mini-Modal für Lernziele
- `src/components/ueben/UebungsEinsicht.tsx` — Session-Historie + Detail-Ansicht
- `scripts/importLernziele.mjs` — Pool-Lernziele Import-Script

### Typ-Erweiterungen
- `ThemenFreischaltung.unterthemen?: string[]` — Granulare Unterthemen-Aktivierung
- `Lernziel.unterthema?: string` — Unterthema-Zuordnung (Pool-Topic = ExamLab-Unterthema)
- `FrageBasis.lernzielIds?: string[]` — Lernziel-Zuordnung pro Frage
- `GespeichertesErgebnis` — Persistierte Session-Ergebnisse für Übungs-Einsicht

### ⚠ Apps Script Deploy nötig
- `lernplattformSetzeThemenStatus`: unterthemen-Parameter + Header-Migration
- `lernplattformLadeThemenSichtbarkeit`: unterthemen-Feld + Header-Migration
- `lernplattformSpeichereFortschritt`: wird jetzt vom Frontend aufgerufen (debounced)
- `importiereLernziele`: unterthema-Spalte + Migration
- `lernplattformLadeLernzieleV2`: gibt unterthema-Feld zurück
- 316 Lernziele bereits importiert (Re-Import bei Bedarf via `node scripts/importLernziele.mjs`)

### Verifiziert im Browser
- ✅ LP Themensteuerung: Unterthemen-Checkboxen, z.T. aktiv Badge
- ✅ SuS Dashboard: Themen-Karten mit AKTUELL-Badge
- ✅ SuS Lernziel-Panel: 316 Lernziele im Akkordeon
- ✅ LP Prüfungen: 🔗 Link-Button
- ✅ SuS Ergebnisse-Tab sichtbar

### Offen (nächste Session)
- **Lernziele bei LP**: 🏁 Buttons auch in LP-Ansicht (Themensteuerung, Fragenbank)
- **Lernziele-Vollständigkeit**: Nicht alle Pools/Topics haben Lernziele definiert
- **Fortschritt-Sync verifizieren**: Debounced Queue im Live-Betrieb testen

---

## Session 70 — Strategische Features + Bugfixes (07.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Bugfixes** | |
| B1 | LP Übungen-Tab: Status-Filter (Aktiv/Archiviert/Alle) hinzugefügt | LPStartseite.tsx |
| B2 | SuS Logout: Räumt alle Stores auf (Üben-Auth + Gruppen + Prüfungs-Auth) | SuSStartseite.tsx, AppShell.tsx |
| B3 | SuS-Startseite: Lobby-Prüfungen anzeigen (phase='lobby' → "Warteraum", 'aktiv' → "Bereit") | apps-script-code.js, AktivePruefungen.tsx |
| **Phase 1: LP-Einstellungen** | |
| 1A | Gruppenname editierbar (Inline-Edit + Backend-Endpoint) | AllgemeinTab.tsx, apps-script-code.js, appsScriptAdapter.ts |
| 1B | Rollen verwalten (Admin↔Lernend Toggle, letzter-Admin-Schutz) | MitgliederTab.tsx, apps-script-code.js, appsScriptAdapter.ts |
| 1C | Mastery-Schwellwerte konfigurierbar (Gefestigt/Gemeistert/Min-Sessions Slider) | AllgemeinTab.tsx, mastery.ts, settings.ts, fortschrittStore.ts |
| **Phase 2: Freie Übungszusammenstellung** | |
| 2A | Cross-Topic Logik: erstelleMixBlock + erstelleRepetitionsBlock | blockBuilder.ts, uebungsStore.ts, uebung.ts |
| 2B | Cross-Topic UI: MixSessionDialog + "Gemischte Übung"/"Repetition" Buttons im Dashboard | MixSessionDialog.tsx (neu), Dashboard.tsx, Zusammenfassung.tsx |
| **Phase 3: SuS-Hilfe** | |
| 3 | SuS-Hilfe als Slide-over Panel (7 Kategorien, ersetzt altes Dropdown) | SuSHilfePanel.tsx (neu), AppShell.tsx |
| **Housekeeping** | |
| H1 | HANDOFF.md gekürzt (1300+ → 267 Zeilen, Sessions 20–64 als Archiv) | HANDOFF.md |

### Neue Dateien (2)
- `src/components/ueben/MixSessionDialog.tsx` — Multi-Select Themen-Picker für gemischte Sessions
- `src/components/ueben/SuSHilfePanel.tsx` — 7-Kategorien Hilfe-Panel

### Apps Script — Neue Endpoints
- `lernplattformUmbenneGruppe` — Gruppenname ändern (Admin)
- `lernplattformAendereRolle` — Mitglied-Rolle ändern (Admin, letzter-Admin-Schutz)
- `ladeAktivePruefungenFuerSuS` erweitert: gibt auch Lobby-Configs zurück (phase='lobby')

### ⚠ Apps Script Deploy nötig
3 neue/geänderte Endpoints. User muss Code im Apps Script Editor ersetzen + neue Bereitstellung.

### Verifiziert
- ✅ V1: Einrichtungsübung (23 Fragen, FiBu, Materialien)
- ✅ V2: Themensteuerung (Aktivieren/Abschliessen, Deep-Link kopieren)
- ✅ V3: SuS-Dashboard (Empfehlungen, Filter, "Mein Fortschritt")
- ✅ V5: Aktive Prüfungen (Endpoint 200 OK)
- ✅ V6: Deep-Links navigiert SuS direkt zum Thema
- ✅ SuS-Startseite: Lobby-Prüfungen mit "Warteraum" angezeigt

---

## Session 69 — Paket A-C: Lernsteuerung + Navigation + Bugfixes (07.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.
**Fragenbank: 2398 Fragen** (2360 Pool + 38 manuell).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Paket A: Lernsteuerung (8 Phasen)** | |
| A1 | Themen-Sichtbarkeit: 3 Stufen (nicht_freigeschaltet/aktiv/abgeschlossen), FIFO max 3, Backend-Tab + Store + Adapter | themenSichtbarkeit.ts, themenSichtbarkeitStore.ts, appsScriptAdapter.ts, apps-script-code.js |
| A2 | Dashboard: ThemaKarte-Komponente, Sichtbarkeitsfilter, "Alle Themen anzeigen"-Toggle | Dashboard.tsx, ThemaKarte.tsx |
| A3 | Deep-Links: `?fach=...&thema=...` aktiviert Thema + navigiert direkt, Aufträge-Store localStorage→Backend | useDeepLinkAktivierung.ts, AppUeben.tsx, auftragStore.ts, apps-script-code.js |
| A4 | LP Themensteuerung: Admin-Tab mit Aktivieren/Abschliessen, ausklappbare Unterthemen, Deep-Link-URL kopieren | AdminThemensteuerung.tsx, AdminDashboard.tsx |
| A5 | Recency-gewichtete Mastery: >30d 1 Stufe runter, >90d → üben, 10 Tests | mastery.ts, apps-script-code.js, masteryRecency.test.ts |
| A6 | "Für dich empfohlen": LP-Aufträge > Fokus > aktive Themen > Dauerbaustellen > Festigung, EmpfehlungsKarte | empfehlungen.ts, blockBuilder.ts, EmpfehlungsKarte.tsx, Dashboard.tsx |
| A7 | LP Analyse-Dashboard: KursHeatmap, KlassenLuecken, SuSUebersicht mit echten Daten | AnalyseDashboard.tsx, analyse/*.tsx |
| A8 | SuS-Analyse: Level, Streak, Meilensteine, Themen-Übersicht, Tab "Mein Fortschritt" | SuSAnalyse.tsx, gamification.ts, Dashboard.tsx |
| **Paket B: Navigation & Einstieg** | |
| B1 | Deep-Links navigieren direkt zur Thema-Detailansicht + Unterthema-Filter | useDeepLinkAktivierung.ts, Dashboard.tsx |
| B2 | SuS-Suchfeld: Freitextsuche über Themen, Fächer, Unterthemen, Fragetexte | Dashboard.tsx |
| **Paket C: Admin & Daten** | |
| C1 | Fokusthema-Dropdown in Einstellungen (LP wählt Schwerpunkt) | AllgemeinTab.tsx, settings.ts |
| C2 | LernzielAnzeige-Komponente (Mastery-Status pro Lernziel) | LernzielAnzeige.tsx |
| **Bugfixes & UX** | |
| F1 | Einrichtungsübung: Eingebaute Config+Fragen als Fallback (kein Backend-Dependency) | App.tsx, DurchfuehrenDashboard.tsx |
| F2 | FiBu-Dropdowns: Kontenrahmen-Daten beim App-Start initialisiert | App.tsx |
| F3 | LP-Auswertung: 23/23 statt 12/13, keine Punkte im Übungsmodus | DurchfuehrenDashboard.tsx |
| F4 | Sync-Guard: Backend-Check entfernt, nur localStorage-Guard | LPStartseite.tsx |
| F5 | Fachbereich-Fix: 'Allgemein'→'VWL', 'Informatik'→'BWL' in Einrichtungsübung | einrichtungsUebungFragen.ts |
| F6 | Materialien in Einrichtungsübung (Witzsammlung + OR-Auszug) | einrichtungsUebung.ts |
| F7 | Demo-Hinweis entfernt ("wird geladen" statt "Demo-Modus") | DurchfuehrenDashboard.tsx |
| **Naming & UX** | |
| N1 | index.html Titel → "ExamLab — Gymnasium Hofwil" | index.html |
| N2 | E-Mail-Absender + Footer → "ExamLab" | apps-script-code.js |
| N3 | erlaubteKlasse entfernt (Einrichtung offen für alle) | einrichtungsPruefung.ts, einrichtungsUebung.ts |
| N4 | Backend-Kommentare: Prüfungstool → ExamLab (10 Stellen) | apps-script-code.js, diverse |
| N5 | Home-Button: "Zurück zu ExamLab" nach Prüfungsabgabe | AbgabeBestaetigung.tsx |
| N6 | SuS-Startseite: ExamLab-Titel klickbar als Home-Link | SuSStartseite.tsx |
| N7 | Aktive Prüfungen auf SuS-Startseite (Backend-Endpoint + Polling) | AktivePruefungen.tsx, apps-script-code.js |

### Neue Dateien (26)
- `src/types/ueben/themenSichtbarkeit.ts`
- `src/store/ueben/themenSichtbarkeitStore.ts`
- `src/hooks/ueben/useDeepLinkAktivierung.ts`
- `src/components/ueben/ThemaKarte.tsx`
- `src/components/ueben/EmpfehlungsKarte.tsx`
- `src/components/ueben/SuSAnalyse.tsx`
- `src/components/ueben/LernzielAnzeige.tsx`
- `src/components/ueben/admin/AdminThemensteuerung.tsx`
- `src/components/lp/ueben/analyse/KursHeatmap.tsx`
- `src/components/lp/ueben/analyse/KlassenLuecken.tsx`
- `src/components/lp/ueben/analyse/SuSUebersicht.tsx`
- `src/components/sus/AktivePruefungen.tsx`
- `src/__tests__/themenSichtbarkeit.test.ts`
- `src/__tests__/masteryRecency.test.ts`

### Apps Script — Neue Endpoints
- `lernplattformLadeThemenSichtbarkeit` — Themen-Sichtbarkeit laden
- `lernplattformSetzeThemenStatus` — Themen-Status setzen (FIFO)
- `ladeAktivePruefungenFuerSuS` — Aktive Prüfungen für SuS (Startseite)
- Erweiterte Aufträge-Endpoints (status, zielEmails, erstelltVon, Auto-Tab)
- `berechneMasteryMitRecency_()` — Recency-gewichtete Mastery

### ⚠ Apps Script Deploy
Deployed am 07.04.2026: 3 neue Endpoints, E-Mail-Absender → "ExamLab", Kommentare aktualisiert.

### Zu verifizieren (nach Deploy)
- Einrichtungsübung: Alle 23 Fragen korrekt (Texte, FiBu-Dropdowns, Materialien)
- Themensteuerung: Aktivieren/Abschliessen, Deep-Link kopieren
- SuS-Dashboard: Sichtbarkeitsfilter, Empfehlungen, Mein Fortschritt
- LP-Analyse: Heatmap, Lücken, SuS-Übersicht (braucht echte Daten)
- Aktive Prüfungen auf SuS-Startseite (Polling)
- Deep-Links: `?fach=...&thema=...` aktiviert + navigiert

### Offene Wünsche
- LP-Reconnect nach Logout während Prüfung: Noch nicht getestet
- Gruppenname editierbar + Rollenverwaltung: Braucht neue Backend-Endpoints

---

## Session 68 — Tech-Verbesserungen + Bug-Fixes (07.04.2026)

### Stand
Branch `main`. tsc ✅ | 193 Tests ✅ | Build ✅.
**Fragenbank: 2398 Fragen** (2360 Pool + 38 manuell).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **T2: Tooltip-Migration** | |
| T2a | 85 Stellen: `title=` → `<Tooltip>` Komponente oder entfernt (redundant bei sichtbarem Text) | 43 Dateien |
| T2b | ~70 Stellen bewusst nicht migriert: Overflow-Tooltips, Status-Badges, Toolbar-Buttons, Drag-Handles | — |
| T2c | ZeichnenToolbar: 10 Stellen (7× Tooltip, 3× title entfernt) | ZeichnenToolbar.tsx |
| T2d | PDFToolbar: 18 Stellen (12× Tooltip, 6× title entfernt) | PDFToolbar.tsx |
| T2e | PDFKategorieChooser: 1 Stelle | PDFKategorieChooser.tsx |
| **T3: Drag & Drop Composer** | |
| T3a | @dnd-kit installiert (core, sortable, utilities) | package.json |
| T3b | Fragen per Drag & Drop sortierbar (pro Aufgabengruppe, nicht zwischen Gruppen) | AbschnitteTab.tsx, PruefungsComposer.tsx |
| T3c | Drag-Handle (6-Punkt-Raster) + DragOverlay + Touch-Support (iPad: PointerSensor + TouchSensor) | AbschnitteTab.tsx |
| T3d | Hoch/Runter-Buttons bleiben als Accessibility-Fallback | AbschnitteTab.tsx |
| **T4: Variablen-Renaming** | |
| T4a | `AppLernen` → `AppUeben` (Datei + Komponente) | 4 Dateien umbenannt |
| T4b | Alle Stores: `useLernen*` → `useUeben*`, Adapter: `lernen*` → `ueben*` | 47 Dateien |
| T4c | Typen: `LernenAuthUser` → `UebenAuthUser`, `LernenRolle` → `UebenRolle` | types/lernen/ |
| T4d | API-Client: `lernenApiClient` → `uebenApiClient`, localStorage-Keys aktualisiert | apiClient.ts, authStore.ts |
| T4e | `istLernen` → `istUeben` in appMode.ts | appMode.ts |
| T4f | Kommentare bereinigt: "Prüfungstool" → "ExamLab", "Lernplattform" → "Üben" (21 Stellen) | 15 Dateien |
| T4g | UI-Texte: Einrichtungsprüfung "Lerne das Prüfungstool kennen" → "Lerne ExamLab kennen" | einrichtungsFragen.ts |
| **Bug-Fixes** | |
| B1 | "Prüfung wird geladen" → kontextabhängig (Prüfung/Übung) | App.tsx, AbgabeDialog.tsx, Layout.tsx |
| B2 | Doppelter Fragetext bei Aufgabengruppen im Üben-Modus | UebungsScreen.tsx |
| B3 | FiBu-Dropdown leer: Fallback auf alle Konten wenn `konten` undefined | KontenSelect.tsx |
| B4 | NaN in Auswertung: `Number.isFinite()` Guards bei Punkteberechnung | korrekturUtils.ts, KorrekturSchuelerZeile.tsx, KorrekturPDFAnsicht.tsx, useKorrekturDaten.ts |
| B5 | Einrichtungsfragen: Dark Mode "Zahnrad" → "Mond-Symbol (🌙) unten links" | einrichtungsFragen.ts |
| **Einrichtungsübung repariert** | |
| E1 | 10 Fragen-Datenstrukturen repariert (Berechnung, Sortierung, FiBu, Zeichnen etc.) | einrichtungsUebungFragen.ts |
| E2 | MC Frageanzahl: Optionen auf 16/20/23/30 korrigiert (23 = korrekt) | einrichtungsUebungFragen.ts |
| **UI-Texte aktualisiert (beide Dateien)** | |
| U1 | "Navigationsleiste unten" → "Sidebar links" / "Header (X/23)" | einrichtungsFragen.ts, einrichtungsUebungFragen.ts |
| U2 | "Fortschrittsbalken" → "Seitenzahl wie «1/23» (oben Mitte)" | einrichtungsFragen.ts, einrichtungsUebungFragen.ts |
| U3 | "Materialpanel rechte Seite / Dokument-Symbol oben rechts" → "«📄 Material»-Button in Sidebar links oben" | einrichtungsFragen.ts |
| **Restposten** | |
| R1 | Übungs-Auswertung: Punktevergabe bei formativen Übungen ausgeblendet (`istFormativ`) | KorrekturFrageZeile, KorrekturSchuelerZeile, KorrekturFragenAnsicht, KorrekturDashboard |
| R2 | localStorage-Migration: `lernplattform-*` → `ueben-*` (4 Keys, automatisch beim App-Start) | storageMigration.ts (neu), authStore.ts |
| **Verzeichnis-Renaming** | |
| V1 | 8 Verzeichnisse: `lernen/` → `ueben/` (components, store, types, hooks, services, context, utils, adapters) | 102 Dateien |
| V2 | 57 Import-Pfade aktualisiert | diverse |

### Nicht geändert (bewusst)
- `lernziel`/`Lernziel`, `Lernende`/`lernend` (Fachbegriffe)
- Apps Script Endpoint-Strings (`lernplattformLogin` etc. — Backend-Kompatibilität)

### Technische Schulden
Tooltip-Migration + Verzeichnis-Renaming komplett ✅. Einzig verbleibend:

| # | Aufgabe | Prio |
|---|---------|------|
| 1 | **Analyse-Dashboard** mit echten Daten (aktuell nur Platzhalter) | mittel |

---

## Session 67/67a — Performance + Datenbereinigung + Features (06.–07.04.2026)

### Stand
Branch `main`. tsc ✅ | 193 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Performance: Progressive Loading** | |
| P1 | Summary/Detail-Split: `ladeFragenbankSummary` (~440 KB, ~8-12s) + `ladeFrageDetail` (on-demand) | fragenbankStore, fragenbankApi, apiClient, FragenBrowser, etc. |
| P2 | Batch-Import/Delete Endpoints | apps-script-code.js |
| P3 | Cache-TTL 5→30 Min, Summary-Cache | apps-script-code.js |
| **Datenbereinigung** | |
| D1 | Vollständiger Re-Import aller 27 Pools (2360 Fragen) | reimport-pools.mjs, test-import.mjs |
| D2 | poolConverter: alle 20 Typen korrekt | poolConverter.ts, pool.ts |
| D3–D5 | speichereFrage, getTypDaten, Recht-Pools Komma-Fixes | apps-script-code.js, config/recht_*.js |
| **UI-Fixes** | |
| U1–U8 | Typ-Filter dynamisch, Einrichtungsfragen gefiltert, summativ/formativ entfernt, SuS-Logout-Bug | diverse |
| **Sicherheit** | |
| S1 | Session-Lock: Neuer Login invalidiert alten Token | apps-script-code.js |

### Progressive Loading — Flow
1. LP Login → `ladeSummaries()` (~440 KB, ~8-12s) → UI sofort interaktiv
2. Filter, Suche, Gruppierung arbeiten auf Summary-Daten
3. Background-Prefetch: `ladeAlleDetails()` lädt volle Fragen (90s Timeout)
4. Klick auf Frage → Detail aus Cache oder on-demand via `ladeFrageDetail`

---

## Session 66 Gesamt — ExamLab Overhaul (05.–06.04.2026)

### Stand
Branch `main`. tsc ✅ | 193 Tests ✅ | Build ✅. **URL: /ExamLab/ (unified build).**

### Architektur-Änderungen
- **Unified Build:** Kein Dual-Build mehr. Ein Build unter `/ExamLab/`. Alte URLs `/Pruefung/` und `/Lernplattform/` leiten per Redirect um.
- **Rollen-Routing:** LP → LPStartseite, SuS ohne ID → SuSStartseite (Üben/Prüfen-Auswahl), SuS mit ID → Prüfung
- **Pool-Themen-Migration:** 2178 Pool-Fragen im Backend aktualisiert: `thema` = Pool-Titel, `unterthema` = Topic-Label
- **Kein `VITE_APP_MODE` mehr:** `main.tsx` lädt immer `App.tsx`, Base-Path: Production = `/GYM-WR-DUY/ExamLab/`, Dev = `/`

### Alle Änderungen (Session 65 + 66a–c)

| Bereich | Zusammenfassung |
|---------|----------------|
| **ExamLab Brand** | "ExamLab" Name, 3-Tab-Nav (Prüfen \| Üben \| Fragensammlung), PWA-Manifest, volle Breite |
| **Unified URL** | /ExamLab/ als einzige URL, SuS-Startseite mit Üben/Prüfen-Auswahl, Redirects |
| **Formativ Auto-Config** | Typ-Dropdown ausgeblendet, Punkte bei formativ ausgeblendet, Default 'locker' |
| **Einstellungen-Panel** | ⚙-Button im LP-Header, Slide-over mit Tabs (Grundstruktur) |
| **Analyse-Tab** | Grundstruktur in Üben (Platzhalter-Daten) |
| **Schule/Privat Toggle** | Filter in Fragensammlung |
| **Einführungsübung** | 23 Fragen, alle Fragetypen, Auto-Sync |
| **Tooltip-Komponente** | CSS-only, wiederverwendbar |
| **Filter-Layout** | 2-zeilig, kaskadierend (Fach→Thema→Unterthema) |
| **Theme Toggle** | 2-Stufen (System ↔ manuell), konsistente Icons |
| **Bug-Fixes** | Modus-Filter, Kontrollstufe-Default, SuS-Gruppen, Login-Bridge Race Condition, Dynamic Import Recovery |

### Fusion: Lernplattform → Prüfungstool (Session 59–63)

| Phase | Status | Beschreibung |
|-------|--------|-------------|
| 0 | ✅ | Build-System: appMode.ts, Dual-Build, deploy.yml |
| 1 | ✅ | Types + Utils migrieren (8 Types + 11 Utils + idb-keyval) |
| 2 | ✅ | Stores + Services migrieren (7 Stores + 3 Services + 1 Adapter + 2 Hooks + 1 Context) |
| 3 | ✅ | UI migrieren (49 Komponenten + AppLernen verdrahtet + fachFarben) |
| 4 | ✅ | E2E-Browser-Test |
| 5 | ✅ | Backend: LP-Backend ins Prüfungs-Apps-Script gemergt (5654→7510 Zeilen) |
| 6 | ✅ | Cleanup: Lernplattform/ gelöscht, Dateien nach Pruefung/ verschoben |

---

## Offene Punkte

- **SEB / iPad** — SEB weiterhin deaktiviert (`sebErforderlich: false`)
- **Tier 2 Features (später):** Diktat, GeoGebra/Desmos, Randomisierte Zahlenvarianten, Code-Ausführung (Sandbox)
- **TaF Phasen-UI** — klassenTyp-Feld vorhanden, UI für Phasen-Auswahl noch nicht (auf nächstes SJ verschoben)
- **Monitoring-Verzögerung ~28s** — Abwarten, aktuell akzeptabel

### Verbesserungsplan (55 Punkte, 6 Sessions) — 10.04.2026

> Detaillierter Plan: **`IMPROVEMENT_PLAN.md`** (gleiches Verzeichnis)
> Basiert auf User-Testing vom 10.04.2026.

| Session | Branch | Inhalt | Status |
|---------|--------|--------|--------|
| **1** | `fix/editor-array-undefined-crashes` | Fragensammlung-Editor Crashes: 6 Fragetypen (Lückentext, Bildbeschriftung, DragDrop, Hotspot, Kontenbestimmung, T-Konto) + Dropdown-Vereinheitlichung | offen |
| **2** | `fix/ueben-fragetypen-korrektur` | Üben-Modus Crashes: 9 Fragetypen (FiBu, Bilanz, DragDrop, Hotspot, Zeichnen, Aufgabengruppe) + Korrektur-Loading-Bug + Backup-Export | offen |
| **3** | `feature/navigation-breadcrumbs` | Navigation & Kopfzeile: Zurück-Stack, Breadcrumbs, persistente Kopfzeile, Favoriten, Loading-Skeleton | offen |
| **4** | `feature/einstellungen-stammdaten` | Einstellungen-Menü: Stammdaten-System, LP-Profil, Hardcoded-Audit, Prüfungs-Einstellungen | offen |
| **5** | `feature/ux-polish` | UX-Polish: Analyse-Tab, Vorschau, Drag-Handles, Fragetyp-Labels, SuS-Üben UX | offen |
| **6** | `feature/performance-features` | Performance (~25s Laden), Problem-Melden-Kontext, Excel-Import, Prefetching, Lernziele | offen |

**Reihenfolge:** 1 → 2 → 3 → 4 → 5 → 6 (1+3 oder 1+4 können parallel)
**Priorität bei Zeitmangel:** Sessions 1–3 sind kritisch, Session 4 architektonisch wichtig.

### Strategische Features (alle erledigt ✅ Session 70)
- ~~Einstellungen-Panel~~ ✅ Gruppenname editierbar, Rollen verwalten, Mastery-Schwellwerte
- ~~Freie Übungszusammenstellung~~ ✅ Cross-Topic-Mix + Repetitions-Modus
- ~~SuS-Hilfe erweitern~~ ✅ 7-Kategorien Slide-over Panel

---

## Archiv (Sessions 20–64, 26.03.–05.04.2026)

> 45 Sessions komprimiert. Detaillierte Änderungslisten entfernt. Bei Bedarf via `git log` nachvollziehbar.

### Meilensteine

| Datum | Session | Meilenstein |
|-------|---------|-------------|
| 26.03. | 20–22 | Root-Cause-Fixes, Live-Test Bugfixes, Scroll-Bug |
| 27.03. | 23–29 | 16 Bugfixes aus Live-Test, Toolbar-Redesign, Zeichnen-Features, Multi-Teacher Phase 1–4, Sicherheit, Autokorrektur |
| 28.03. | 30–32 | Plattform-Öffnung für alle Fachschaften, Demo-Prüfungs-Bugs, LP-Editor UX |
| 30.03. | 33–37 | Übungspools Fragetypen, Security-Audit, iPad-Tests, ROOT CAUSE Fixes |
| 31.03. | 38–44 | E2E-Tests, Security Hardening, Staging-Umgebung, Workflow-Umstellung, 8 Bugfixes |
| 01.04. | 45–49 | Batch-Writes, Request-Queue, Re-Entry-Schutz, Übungspools TYPE_HANDLERS + 8 neue Fragetypen |
| 02.04. | 51–53 | Browser-Tests + 75 neue Pool-Fragen, Bewertungsraster-Vertiefung, Lernplattform Design |
| 04.04. | 55–58 | Shared Editor Phase 1–5a (EditorProvider, Typ-Editoren, SharedFragenEditor) |
| 05.04. | 59–64 | Fusion Phase 1–6 (Lernplattform → Prüfungstool), Übungstool A–F komplett, Prompt Injection Schutz |

### Security (alle erledigt ✅)
- Rollen-Bypass via sessionStorage → restoreSession() validiert E-Mail-Domain
- Timer-Manipulation → Server-seitige Validierung bei Abgabe
- Rate Limiting → 4 SuS-Endpoints (10-15/min)
- Cross-Exam Token Reuse → verhindert
- Demo-Modus Bypass → istDemoModus nur in React-State
- Prompt Injection → Alle Inputs in `<user_data>` gewrappt
- pruefung-state in localStorage → persist.clearStorage() nach Abgabe
- Session-Lock → Neuer Login invalidiert alten Token
