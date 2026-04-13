# HANDOFF.md — ExamLab (ehemals Prüfungsplattform)

> ExamLab — Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil.
> Domain: examlab.ch (noch nicht aktiv, GitHub Pages vorerst)
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap + KaTeX + CodeMirror 6 + Vitest

---

## Session 96 — A1: Deep Links, Home-Startseite & React Router (13.04.2026)

### Stand
Auf Branch `feature/a1-deep-links-router`. tsc ✅ | 216 Tests ✅ | Build ✅. **Browser-Test ✅ (Demo-Modus, P1-P4).**

### Kontext
Feature A1 aus HANDOFF: Echte Deep Links + App-Strukturverzeichnis. Hash-basiertes LP-Routing wurde durch React Router (BrowserRouter) ersetzt. Neue Home-Startseite für LP mit Favoriten, offenen Korrekturen, anstehenden/letzten Prüfungen und Übungen. Erweitertes Favoriten-System mit App-Orten + Drag & Drop Sortierung.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Phase 1 — React Router Foundation** | |
| P1.1 | `react-router-dom` installiert | package.json |
| P1.2 | `404.html` für GitHub Pages BrowserRouter + Decoder in index.html | 404.html, index.html, deploy.yml |
| P1.3 | BrowserRouter-Shell mit AuthGuard + Hash-Migration | router/Router.tsx, router/AuthGuard.tsx, router/hashMigration.ts, main.tsx |
| **Phase 2 — LP Hash-Routing ablösen** | |
| P2 | `useLPNavigation` Hook (useNavigate-basiert), `useLPRouteSync` Hook (URL→Store), Hash-Funktionen aus lpNavigationStore entfernt | hooks/useLPNavigation.ts, hooks/useLPRouteSync.ts, store/lpNavigationStore.ts, LPStartseite.tsx, LPHeader.tsx |
| **Phase 3 — Home + Favoriten** | |
| P3.1 | Neuer `favoritenStore` mit erweitertem Favorit-Modell (typ/ziel/label/sortierung), Migration von alten AppOrt[], 7 Tests | store/favoritenStore.ts + .test.ts |
| P3.2 | Home-Dashboard mit 5 Sektionen (Favoriten, offene Korrekturen, anstehende/letzte Prüfungen/Übungen) | components/lp/Home.tsx, router/Router.tsx |
| P3.3 | FavoritenTab in Einstellungen mit @dnd-kit Drag & Drop Sortierung | components/settings/FavoritenTab.tsx, EinstellungenPanel.tsx |
| **Phase 4 — SuS-Üben Routes** | |
| P4 | `useUebenNavigationStore.navigiere()` durch `useSuSNavigation` Hook ersetzt (useNavigate), `useSuSRouteSync` Hook (URL→Store), 9 SuS-Routes in Router.tsx, Modus in SuSStartseite aus URL, navigationStore entkernt | hooks/ueben/useSuSNavigation.ts, hooks/ueben/useSuSRouteSync.ts, router/Router.tsx, AppUeben.tsx, SuSStartseite.tsx, Dashboard.tsx, UebungsScreen.tsx, AppShell.tsx, navigationStore.ts |

### Neue Dateien (11)
- `404.html` — GitHub Pages SPA-Redirect (Repo-Root)
- `src/router/Router.tsx` — BrowserRouter mit LP/SuS-Routes
- `src/router/AuthGuard.tsx` — Rollen-basierter Route-Guard
- `src/router/hashMigration.ts` — Einmalige #/... → /... Migration
- `src/hooks/useLPNavigation.ts` — LP-Navigation via useNavigate()
- `src/hooks/useLPRouteSync.ts` — URL → lpNavigationStore Sync
- `src/hooks/ueben/useSuSNavigation.ts` — SuS-Navigation via useNavigate()
- `src/hooks/ueben/useSuSRouteSync.ts` — URL → navigationStore Sync
- `src/store/favoritenStore.ts` — Erweiterter Favoriten-Store
- `src/components/lp/Home.tsx` — Home-Dashboard
- `src/components/settings/FavoritenTab.tsx` — Favoriten-Verwaltung

### Geänderte Dateien (7)
- `Pruefung/index.html` — 404-Decoder + CSP unsafe-inline
- `Pruefung/src/main.tsx` — AppRouter statt App
- `Pruefung/src/store/lpNavigationStore.ts` — Hash-Funktionen entfernt, EinstellungenTab + 'favoriten'
- `Pruefung/src/components/lp/LPStartseite.tsx` — hashchange-Listener → useLPRouteSync, useLPNavigation
- `Pruefung/src/components/lp/LPHeader.tsx` — FavoritenDropdown: Hash → Pfad-URLs
- `Pruefung/src/components/settings/EinstellungenPanel.tsx` — FavoritenTab hinzugefügt
- `.github/workflows/deploy.yml` — 404.html kopieren

### Browser-Test (Demo-Modus, localhost)

| Test | Ergebnis |
|------|----------|
| `/` → Redirect `/login` (unauthentifiziert) | ✅ |
| Demo-Login → Redirect `/home` | ✅ (Fix: LoginScreen navigate nach Login) |
| Home-Dashboard 5 Sektionen | ✅ (Fix: Favoriten Infinite-Loop mit useMemo) |
| Tab Prüfen → URL `/pruefung` | ✅ |
| Tab Üben → URL `/uebung` | ✅ |
| Browser Back/Forward | ✅ |
| Test mit echtem Backend (GitHub Pages) | ⬜ Ausstehend |
| **SuS-Üben Routes (P4)** | |
| `/sus/ueben` → Dashboard (Demo) | ✅ |
| Tab Prüfen → URL `/sus/pruefen` | ✅ |
| Tab Üben → URL `/sus/ueben` | ✅ |
| Browser Back/Forward (SuS) | ✅ |

### Noch offen (eigene Sessions, nicht blockierend für Merge)

| # | Thema | Beschreibung | Abhängigkeit |
|---|-------|-------------|-------------|
| P5.1 | **lpNavigationStore → lpUIStore** | Umbenennen, Favoriten-Code entfernen (ist jetzt in favoritenStore), nur UI-State behalten | — |
| P5.2 | **?ids= Legacy entfernen** | Multi-Monitoring unter `/pruefung/monitoring` statt `?ids=` | P5.1 |
| P5.3 | **Route-Tests** | Unit-Tests für Auth Guard, Rollen-Mismatch, Hash-Migration | — |

### Kontext für nächste Sessions
- **Spec:** `docs/superpowers/specs/2026-04-13-deep-links-home-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-13-deep-links-home.md`
- **Branch:** `feature/a1-deep-links-router` (13 Commits, gepusht)
- **Architektur:** BrowserRouter in `src/router/Router.tsx`, App.tsx unverändert (rendert SuS-Flow). LP-Routes nutzen `useLPRouteSync` + `useLPNavigation`, SuS-Routes nutzen `useSuSRouteSync` + `useSuSNavigation` für URL↔Store Bridge.
- **Wichtig:** `lpNavigationStore` hat NOCH alten Favoriten-Code (parallel zu neuem `favoritenStore`). P5.1 räumt das auf.
- **Wichtig:** `selectFavoritenSortiert` darf NICHT als Zustand-Selector verwendet werden (erzeugt neues Array → Infinite Loop). Immer `useMemo` verwenden.
- **Wichtig:** `navigationStore` (Üben) enthält nur noch `aktuellerScreen` (via Route-Sync) + `deepLinkThema`. `navigiere/zurueck/screenHistory` entfernt.

### Manuelle Schritte nach Merge
- ✅ Apps Script: Kein neues Deploy nötig (nur Frontend-Änderungen)
- ⚠️ Bestehende Lesezeichen mit `#/pruefung/...` werden automatisch migriert (hashMigration.ts)

---

## Session 95 — FiBu-Musterlösungen repariert (13.04.2026)

### Stand
Auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅. **14 FiBu-Fragen im Google Sheet repariert.**

### Kontext
Diagnose ergab: 14 von 41 spezialisierten FiBu-Fragen in der Fragensammlung (Google Sheet) hatten Musterlösungen im falschen Datenformat. Die Fragen waren in einer früheren Session mit Legacy-Feldnamen erstellt worden (`correct` statt `erwarteteAntworten`, `nr` statt `kontonummer`, `correctSoll/Haben` statt `eintraege`, fehlende `loesung` bei Bilanzfragen).

### Erledigte Arbeiten

| # | Änderung | Betroffene Fragen |
|---|----------|-------------------|
| R1 | **Kontenbestimmung (5x):** `correct[]` → `erwarteteAntworten[]`, `konto` → `kontonummer`, `id` ergänzt | Z281, Z282, Z302, Z303, Z304 |
| R2 | **T-Konto (5x):** `correctSoll/Haben` → `eintraege[]`, `nr` → `kontonummer`, `ab` → `anfangsbestand`, Saldo berechnet, `bewertungsoptionen` ergänzt | Z283, Z284, Z305, Z306, Z307 |
| R3 | **Bilanzstruktur (4x):** `nr` → `kontonummer` in kontenMitSaldi, `loesung` generiert (Bilanzgruppen nach CH-KMU-Kontenrahmen), `bewertungsoptionen` ergänzt | Z285, Z286, Z308, Z309 |
| R4 | **Sync-Version bumped (v4→v5):** Einrichtungsfragen Re-Sync zum Sheet erzwungen (harmlos, Daten waren bereits korrekt) | LPStartseite.tsx |

### Geänderte Dateien (1 Code + Sheet-Daten)
- `Pruefung/src/components/lp/LPStartseite.tsx` — Sync-Key v4→v5
- `Pruefung/scripts/diagnose-fibu-fragen.js` — Diagnose-Script (nicht deployed)
- `Pruefung/scripts/repair-fibu-fragen.js` — Repair-Script (nicht deployed)
- **Google Sheet BWL-Tab:** 14 Zeilen typDaten-Spalte aktualisiert

### Offene Punkte

| # | Thema | Status |
|---|-------|--------|
| F1 | **Buchungssatz-Bewertung** | ✅ ERLEDIGT — typDaten repariert (war Legacy-Format) |
| F4 | **Bilanz/ER Musterlösung** | ✅ ERLEDIGT — loesung + kontenMitSaldi repariert |
| E1/E2 | **Editor-Crashes (Null-Guards)** | Deployed, Browser-Test ausstehend |
| B1 | **Bild-Upload fehlgeschlagen** | Offen — Konsole prüfen |
| B2 | **Audio iPhone-Trigger** | Offen — iPhone-spezifisch |
| B3 | **Abgabe-Timeout** | Offen — Apps Script Execution Log prüfen |
| B4 | **Fachkürzel stimmen nicht** | Offen — PDF-Abgleich mit stammdaten.ts |

---

## Session 94 — FiBu-Fixes + Dashboard-Filter + Black Screen (12.04.2026)

### Stand
Auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Kontext
Ausführliche Testphase durch User deckte FiBu-Probleme, Dashboard-Filter-Regression und wiederkehrenden schwarzen Bildschirm auf. 6 Fixes in 7 Dateien.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **T-Konto Layout (User-Wunsch)** | |
| L1 | **Zunahme/Abnahme pro Seite:** Neue Felder `zunahmeAbnahmeLinks/Rechts`, je ein Dropdown pro T-Konto-Seite statt eines einzelnen in der Kopfzeile | TKontoFrage.tsx |
| L2 | **Kontenkategorie in Kopfzeile:** Dropdown aus separatem Abschnitt in die Kopfzeile (neben Kontoname) verschoben | TKontoFrage.tsx |
| L3 | **Soll/Haben + Zunahme/Abnahme aus Header entfernt:** Die alten zentral platzierten Dropdowns gelöscht, Felder als Legacy beibehalten | TKontoFrage.tsx |
| **Korrektur-Bug** | |
| K1 | **T-Konto Üben-Korrektur:** `k.id === konto.kontonummer` → `k.id === konto.id`. Antwort-ID matcht Definition-ID, nicht Kontonummer. | korrektur.ts |
| **Dashboard** | |
| D1 | **Themen-Filter repariert:** `nicht_freigeschaltet` aus Default-Filter entfernt. Wurde in S93 irrtümlich hinzugefügt → Toggle-Button hatte keine Wirkung mehr. | Dashboard.tsx |
| **Schwarzer Bildschirm (GELÖST)** | |
| S1 | **Fallback-Dashboard:** Wenn `aktuellerScreen === 'uebung'` aber `session === null`, wird Dashboard statt leerer Seite gezeigt. | AppUeben.tsx |
| S2 | **Auto-Beendigung:** Root Cause gefunden — nach letzter Frage wurde `aktuelleFrageIndex` über Array-Ende erhöht, `aktuelleFrage()` gab null zurück → `return null` → schwarzer Bildschirm. Fix: `useEffect` in UebungsScreen erkennt session ohne frage und ruft `beendeSession()` + `navigiere('ergebnis')` auf. **Im Browser verifiziert.** | UebungsScreen.tsx |
| **Editor-Crashes** | |
| E1 | **TKontoEditor Null-Guards:** `konto.eintraege` kann undefined sein (unvollständige Backend-Daten) → `(konto.eintraege \|\| [])` in map/filter/length | TKontoEditor.tsx |
| E2 | **KontenbestimmungEditor Null-Guards:** `aufgabe.erwarteteAntworten` kann undefined sein → Null-Guards in map/filter/length + CRUD-Funktionen | KontenbestimmungEditor.tsx |

### Geänderte Dateien (8)
- `Pruefung/src/components/fragetypen/TKontoFrage.tsx` — Layout-Umbau: Zunahme/Abnahme pro Seite, Kontenkategorie in Kopfzeile
- `Pruefung/src/utils/ueben/korrektur.ts` — T-Konto ID-Matching Fix
- `Pruefung/src/components/ueben/Dashboard.tsx` — Filter-Toggle repariert
- `Pruefung/src/AppUeben.tsx` — Schwarzer-Bildschirm-Fallback (session===null)
- `Pruefung/src/components/ueben/UebungsScreen.tsx` — Auto-beende Session wenn keine Frage mehr (Root Cause schwarzer Bildschirm)
- `packages/shared/src/editor/typen/TKontoEditor.tsx` — Null-Guards
- `packages/shared/src/editor/typen/KontenbestimmungEditor.tsx` — Null-Guards

### Zusätzlich erledigt
- **T4:** Alte Branches aufgeräumt (3 lokal + 1 remote, alle gemergt)
- **A4:** Als erledigt markiert (war bereits zuvor abgeschlossen)
- **Manuelle Schritte:** User hat `einrichtung-demo` und `sf-wr-27a28f` Configs gelöscht

### Offene Punkte aus Browser-Tests (brauchen weitere Untersuchung)

| # | Thema | Status |
|---|-------|--------|
| F1 | **Buchungssatz falsche Bewertung** | Wahrscheinlich fehlende Musterlösung in Fragensammlung. `frage.buchungen` leer → `0 !== N` → immer falsch. **FiBu-Musterlösungen in Fragensammlung prüfen.** |
| F2 | **3 Einrichtungsprüfungen sichtbar** | Alte Backend-Daten (sf-wr-27a28f, demo). User hat Configs gelöscht — nach Reload sollten nur noch `einrichtung-pruefung` und `einrichtung-uebung` sichtbar sein. |
| F3 | **61 vs 59 Punkte** | Gewollt — einrichtungsPruefung hat 2 Fragen/Punkte mehr als einrichtungsUebung (unterschiedliche Fragen-Sets). |
| F4 | **Bilanz/ER Musterlösung unvollständig** | Nur Umlaufvermögen + kf. FK angewählt, keine Konten. Beträge ohne Konten. **Im Frageneditor korrigieren.** |
| F5 | **Bild-Upload fehlgeschlagen (B1)** | Weiterhin offen — Konsole prüfen. |
| F6 | **Audio iPhone-Trigger (B2)** | Weiterhin offen — iPhone-spezifisch. |
| F7 | **Abgabe-Timeout (B3)** | Weiterhin offen — Apps Script Execution Log prüfen. |
| F8 | **Fachkürzel stimmen nicht (B4)** | Weiterhin offen — PDF-Abgleich mit stammdaten.ts. |

---

## Session 93 — Browser-Test Bugfixes (12.04.2026)

### Stand
Gemergt auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅. **Browser-Tests laufen.**

### Kontext
Ausführlicher Browser-Test durch User deckte diverse Bugs auf. 7 Fixes in 15 Dateien.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **FiBu Sofortiger Lösungsabgleich (KRITISCH)** | |
| F1 | **speichereZwischenstand im Adapter:** Neues Feld in `FrageAdapterResult`. Im Üben-Modus: Zwischenstand ohne Korrektur, im Prüfungsmodus: null (onAntwort reicht). | useFrageAdapter.ts |
| F2 | **speichereZwischenstandById im Store:** Speichert in `session.zwischenstande` ohne Korrektur/Locking | uebungsStore.ts, uebung.ts |
| F3 | **4 FiBu-Fragetypen migriert:** Feldänderungen → speichereZwischenstand, expliziter "Antwort prüfen"-Button → onAntwort | BuchungssatzFrage, TKontoFrage, BilanzERFrage, KontenbestimmungFrage |
| **Schwarzer Bildschirm (Race Condition)** | |
| B1 | **Zusammenfassung sofort bei session.beendet:** Rendering-Guard erweitert — Zusammenfassung wird auch gezeigt wenn session.beendet aber Screen noch 'uebung' | AppUeben.tsx |
| **Gesperrte Themen Regression** | |
| G1 | **Dashboard-Filter erweitert:** `nicht_freigeschaltet` wird jetzt in sichtbareThemenListe aufgenommen (mit Overlay) | Dashboard.tsx |
| **UI-Fixes** | |
| U1 | **Einstellungsbutton in Durchführen:** onEinstellungen Prop + EinstellungenPanel im DurchfuehrenDashboard | DurchfuehrenDashboard.tsx |
| U2 | **SuS-Einladen:** Manuelles Hinzufügen-Feld auch vor Kurse-Laden sichtbar | VorbereitungPhase.tsx |
| U3 | **Lernziele-Tab Links:** deepLinkThema in NavigationStore, Dashboard konsumiert Thema | AppShell.tsx, navigationStore.ts, Dashboard.tsx |
| U4 | **LernzieleAkkordeon:** Verschachtelter button→span (valides HTML) | LernzieleAkkordeon.tsx |

### Geänderte Dateien (15)
- `Pruefung/src/hooks/useFrageAdapter.ts` — speichereZwischenstand
- `Pruefung/src/store/ueben/uebungsStore.ts` — speichereZwischenstandById
- `Pruefung/src/types/ueben/uebung.ts` — zwischenstande Feld
- `Pruefung/src/components/fragetypen/BuchungssatzFrage.tsx` — Zwischenstand + Prüfen-Button
- `Pruefung/src/components/fragetypen/TKontoFrage.tsx` — Zwischenstand + Prüfen-Button
- `Pruefung/src/components/fragetypen/BilanzERFrage.tsx` — Zwischenstand + Prüfen-Button
- `Pruefung/src/components/fragetypen/KontenbestimmungFrage.tsx` — Zwischenstand + Prüfen-Button
- `Pruefung/src/AppUeben.tsx` — Race Condition Fix
- `Pruefung/src/components/ueben/Dashboard.tsx` — Gesperrte Themen + deepLinkThema
- `Pruefung/src/components/ueben/LernzieleAkkordeon.tsx` — Verschachtelter Button Fix
- `Pruefung/src/components/ueben/layout/AppShell.tsx` — deepLinkThema setzen
- `Pruefung/src/store/ueben/navigationStore.ts` — deepLinkThema State
- `Pruefung/src/store/lpNavigationStore.ts` — Revert: Default bleibt durchfuehren
- `Pruefung/src/components/lp/durchfuehrung/DurchfuehrenDashboard.tsx` — Einstellungen-Button + Panel
- `Pruefung/src/components/lp/vorbereitung/VorbereitungPhase.tsx` — ladeStatus-Guard entfernt

### Manuelle Schritte
- ✅ Configs-Sheet: `einrichtung-demo` und `sf-wr-27a28f` Configs gelöscht (User, S94)
- ✅ Apps Script: Kein neues Deploy nötig (nur Frontend-Änderungen)

---

## Offene Punkte (priorisiert)

### Architektur / Feature (vor Implementierung Konzept nötig)

| # | Thema | Beschreibung | Abhängigkeit |
|---|-------|-------------|-------------|
| A1 | **Echte Deep Links + App-Strukturverzeichnis** | Jeder Ort in der App braucht eine echte URL (`#/uebung/themen`, `#/uebung/durchfuehren`, etc.) die in neuem Tab funktioniert. Dazu: Strukturverzeichnis in Einstellungen mit Favoriten-Funktion. Kein Quick-Fix — braucht vollständiges Hash-Routing-Konzept. **Eigene Session, sauber planen.** | — |
| A2 | **KI-Bild-Generator Backend** | `generiereFrageBild` Endpoint in apps-script-code.js (Claude API Call). Frontend steht bereits (BildGeneratorPanel + BildMitGenerator). | Apps Script Deploy |
| A3 | **KI-Zusammenfassung Audio-Rückmeldungen** | Neues Feature: Audio-Antworten per KI zu strukturierter Rückmeldung zusammenfassen. Konzept erstellen. | A2 (Claude API Pattern) |
| ~~A4~~ | ~~Entwicklungsprozess strukturieren~~ | **Erledigt** (S94). Superpowers-Skills + Rules + Memory = 3-Schichten-Architektur. |

### Bugs (reproduzierbar, brauchen Debugging)

| # | Bug | Symptom | Nächster Schritt |
|---|-----|---------|-----------------|
| B1 | **Bild-Upload fehlgeschlagen** | LP Frageneditor: "Upload fehlgeschlagen. Bitte erneut versuchen oder Bild-URL eingeben." | Konsole öffnen → `[BildUpload] Upload fehlgeschlagen, result:` lesen → Backend-Fehler identifizieren |
| B2 | **Audio iPhone-Trigger** | 19s Aufnahme speichert nur 4s. iPhone wird beim ersten Mal getriggert, bei erneutem Aufnehmen nicht mehr. | iPhone-spezifisch: `recorder.onstart`-Timing (S92 A3) verifizieren, ggf. MediaRecorder-Settings |
| B3 | **Abgabe-Timeout** | Sowohl Prüfung als auch Übung: "Abgabe gespeichert, Übertragung ausstehend". LP-Erzwingen-Beenden funktioniert, Antworten kommen an. | Apps Script Execution Log prüfen — Timeout bei grossen Payloads? Save-Resilienz (S92) wirkt teilweise. |
| B4 | **Fachkürzel stimmen nicht** | Bei Prüfung/Übung durchführen sind Fachkürzel nicht wie im hochgeladenen Dokument. | PDF `Kuerzelliste_25_26.pdf` liegt vor. Abgleich mit Lehrplan Sek II → `stammdaten.ts` korrigieren. |

### Verbesserungen (kein Bug, aber gewünscht)

| # | Verbesserung | Beschreibung |
|---|-------------|-------------|
| V1 | **Bilanzstruktur: Erfolg-Eingabe** | Gewinn/Verlust soll in Bilanzstruktur eingegeben werden können. ER-Feld existiert (`gewinnVerlust` in ERFeldEingabe), Korrektur-Logik prüfen. |
| ~~V2~~ | ~~Bilanzstruktur vs. Kontenbestimmung~~ | **Geklärt:** Kontenbestimmung bleibt als eigener Fragetyp. Kein Zusammenlegen. FiBu-Typen sollen in Prüfung und Übung identisch funktionieren (mit Adapter-Hook S91 + Prüfen-Button S93 umgesetzt). |
| V3 | **Testdaten-Generator** | Für `wr.test` (Mastery-System + Tracking testen) |
| V4 | **Fachkürzel bei neue Prüfung/Übung** | Offizielle Kürzel im Erstellungs-Dialog |
| V5 | **Lernziele-Tab einklappbar** | UX-Verbesserung Einstellungen |
| V6 | **Resizable Sidebar** | LP-Dashboard |
| V7 | **Favoriten erweitern** | Mehr Orte als Favoriten setzbar (hängt mit A1 zusammen) |
| V8 | **Ähnliche Fragen erkennen** | Duplikat-Erkennung in Fragensammlung |

### Technische Schulden

| # | Thema | Status |
|---|-------|--------|
| T1 | **62 SVGs visuell prüfen** | Neutrale Bilder erstellt (S87), noch nicht alle im Browser verifiziert |
| T2 | **Excel-Import Feinschliff** | S6D teilweise aus Session 79, Feinschliff offen |
| T3 | **Prefetching** | S6E: requestIdleCallback für Detail-Prefetch (teilimplementiert) |
| ~~T4~~ | ~~Alte Remote-Branches aufräumen~~ | **Erledigt** (S94). 3 lokale + 1 remote Branch gelöscht. Nur noch main + gh-pages. |

### Browser-Tests (ausstehend aus früheren Sessions)

| # | Test | Session | Status |
|---|------|---------|--------|
| BT1 | Session 93 Fixes (FiBu Prüfen-Button, Gesperrte Themen, Zusammenfassung) | S93 | ⬜ Läuft |
| BT2 | Kontenbestimmung im Browser (nach Frontend-Build) | S87 | ⬜ |
| BT3 | Buchungssatz + T-Konto Dropdowns (shared KontenSelect) | S87 | ⬜ |
| BT4 | Favoriten: Backend-Sync + Direktlinks | S86 | ⬜ |
| BT5 | LP Profil speichern (Auth-Fix) | S88 | ⬜ |
| BT6 | Lernziele-Tab: CRUD im Browser | S88 | ⬜ |
| BT7 | Bild-Editor: Upload + KI-Tab sichtbar | S88 | ⬜ |

---

## Session 92 — Save-Resilienz + IDs + Quick-Fixes (12.04.2026)

### Stand
Branch `fix/session91-save-resilienz`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Kontext
Beim Testen der Einführungsübung scheiterte die Abgabe reproduzierbar wenn alle 23 Fragen (inkl. Audio ~304KB) beantwortet waren. Root Cause: Die Einrichtungs-Sync (48 Fragen, ~15 parallele Backend-Requests) überlädt Apps Script → nachfolgende SuS-Saves kommen nicht an. Bestätigt durch Apps Script Execution Log: 335s-doGet + 11-Min-Lücke.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Save-Resilienz (KRITISCH)** | |
| R1 | **Sync entschärft:** Fragen seriell statt 5er-Batches parallel, 200ms Pause, 10s Startverzögerung, nicht bei aktiver Durchführung | LPStartseite.tsx |
| R2 | **Retry + Timeout:** 60s Timeout bei Abgabe (statt 30s), `postBool` mit optionalem `timeoutMs` | apiClient.ts, pruefungApi.ts |
| R3 | **postBoolDirekt:** Neue Funktion ohne Write-Queue (für zukünftige Nutzung) | apiClient.ts |
| R4 | **Chunk-Load-Retry:** `lazyMitRetry()` — bei fehlgeschlagenem dynamischem Import auto-reload | LPStartseite.tsx |
| **ID-Konsistenz** | |
| I1 | **Einrichtungsprüfung ID:** `einrichtung-demo` → `einrichtung-pruefung` (konsistent mit `einrichtung-uebung`) | demoConfig.ts |
| I2 | **Test-Kurs:** `DEMO_KURS_ID = 'test'` (statt `'demo'`, passt zum Test-Kurs mit wr.test) | demoConfig.ts |
| I3 | **Sync-Guard v4:** Hochgezählt damit Re-Sync mit neuen IDs getriggert wird | LPStartseite.tsx |
| **Quick-Fixes** | |
| Q1 | **Deep-Links:** `#/uebung` ohne Sub-Tab → `uebungsTab: 'uebungen'` (nicht 'durchfuehren') | lpNavigationStore.ts |
| Q2 | **Lernziel-Label:** "Übungspools" entfernt aus UI-Text | LernzielWaehler.tsx |
| Q3 | **Audio NaN-Fix:** `dauer: ... \|\| 0` Fallback | AudioFrage.tsx |
| **Audio-Optimierung** | |
| A1 | **Drive-Upload:** Audio-Antwort wird sofort als Drive-File hochgeladen, nur URL im JSON (~50 Bytes statt ~304KB) | AudioFrage.tsx, uploadApi.ts |
| A2 | **Fallback:** Bei Upload-Fehler oder Demo-Modus → inline Base64 wie bisher | AudioFrage.tsx |
| A3 | **iPhone-Fix:** `startZeitRef` bei `recorder.onstart` setzen (nicht bei Button-Click) | AudioFrage.tsx |
| Q4 | **Bild-Upload Logging:** Fehlerdetails in Konsole bei fehlgeschlagenem Upload | BildUpload.tsx |

### Geänderte Dateien (9)
- `Pruefung/src/components/lp/LPStartseite.tsx` — Sync seriell + verzögert, lazyMitRetry, Sync-Guard v4
- `Pruefung/src/services/apiClient.ts` — postBool mit timeoutMs, postBoolDirekt
- `Pruefung/src/services/pruefungApi.ts` — 60s Timeout bei Abgabe
- `Pruefung/src/services/uploadApi.ts` — uploadAudioAntwort (NEU)
- `Pruefung/src/data/demoConfig.ts` — einrichtung-pruefung + test
- `Pruefung/src/store/lpNavigationStore.ts` — Deep-Link Default-Tab Fix
- `Pruefung/src/components/fragetypen/AudioFrage.tsx` — Drive-Upload, NaN-Fix, onstart-Timing
- `packages/shared/src/editor/components/LernzielWaehler.tsx` — Label
- `packages/shared/src/editor/components/BildUpload.tsx` — Logging

### Manuelle Schritte nach Merge
- ⬜ Alte Backend-Configs löschen: `einrichtung-demo` und `sf-wr-27a28f` aus Configs-Sheet entfernen
- ⬜ Apps Script NICHT neu deployen nötig (nur Frontend-Änderungen)
- ⬜ Browser-Test: Einführungsübung mit allen 23 Fragen inkl. Audio abgeben

### Noch offen (nächste Session)
- Bilanzstruktur beim selbstständigen Üben: Klären ob `kontenbestimmung` durch `bilanzstruktur` ersetzt werden soll (59 Dateien betroffen)
- Testdaten-Generator für wr.test (Mastery-System + Tracking testen)
- Features: Fachkürzel bei neue Prüfung/Übung, Lernziele-Tab einklappbar, Resizable Sidebar, Favoriten erweitern, Ähnliche Fragen erkennen
- Bild-Upload "fehlgeschlagen" — Root Cause im Backend prüfen (jetzt mit Logging)

---

## Session 91 — Code-Vereinfachung: Adapter-Hook Refactoring (12.04.2026)

### Stand
Branch `refactor/code-vereinfachung` gemergt auf `main`. tsc ✅ | 209 Tests ✅ | Build ✅. **Noch NICHT im Browser getestet (LP + SuS).**

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Shared UI Components** | |
| U1 | **BaseDialog:** Shared Overlay mit Focus-Trap, ESC, Backdrop-Click, a11y (aria-labelledby) | ui/BaseDialog.tsx (NEU) |
| U2 | **Button:** 4 Varianten (primary/secondary/danger/ghost), 3 Grössen, Loading, Icon | ui/Button.tsx (NEU) |
| U3 | **Dialog-Migrationen:** AbgabeDialog, BeendenDialog, FeedbackDialog, Layout-Zeitablauf, PruefungsComposer (2 Dialoge) → BaseDialog | 5 Dateien |
| **Unified Antwort Type** | |
| T1 | **Kanonischer Typ:** `Antwort` in types/antworten.ts — Selbstbewertung optional, hotspot.klicks (war geklickt), audio/pdf erweitert, aufgabengruppe-Variante | types/antworten.ts |
| T2 | **Normalizer:** `normalizeAntwort()` — konvertiert 10+ Legacy-Alias-Typen (tf→richtigfalsch, fill→lueckentext, calc→berechnung, etc.) + Feld-Mapping | utils/normalizeAntwort.ts (NEU) |
| T3 | **pruefeAntwort:** Akzeptiert unified Antwort, normalisiert intern | utils/ueben/korrektur.ts |
| T4 | **uebungsStore:** `beantworteById(frageId, antwort)` + `toggleUnsicherById(frageId)`, delegiert beantworte() intern | store/ueben/uebungsStore.ts |
| T5 | **types/ueben/antworten.ts gelöscht** — AntwortTyp existiert nicht mehr | GELÖSCHT |
| **Adapter-Hook Pattern** | |
| A1 | **FrageModeContext:** `'pruefung' \| 'ueben'` Provider, in App.tsx + AppUeben.tsx gewrappt | context/FrageModeContext.tsx (NEU) |
| A2 | **useFrageAdapter:** Unified Interface (antwort, onAntwort, disabled, feedbackSichtbar, korrekt, markiertAlsUnsicher, toggleUnsicher). Beide Stores unconditional aufgerufen (Rules of Hooks). | hooks/useFrageAdapter.ts (NEU) |
| A3 | **Alle 20 Fragetypen migriert:** usePruefungStore → useFrageAdapter. Feedback-Sektion hinzugefügt (feedbackSichtbar && korrekt). | 20 Dateien in fragetypen/ |
| **Unified Dispatcher** | |
| D1 | **fragetypenRegistry:** Eine Map für alle 20 Typen + Alias-Mappings | shared/fragetypenRegistry.ts (NEU) |
| D2 | **FrageRenderer:** Switch → Registry-Lookup | FrageRenderer.tsx |
| D3 | **UebungsScreen:** Nutzt shared FrageRenderer statt lokaler FRAGETYP_KOMPONENTEN | ueben/UebungsScreen.tsx |
| D4 | **26 Duplikat-Dateien gelöscht:** Gesamtes ueben/fragetypen/ Verzeichnis | GELÖSCHT |
| **Cleanup** | |
| C1 | **LoginLayout:** Shared Card-Layout für beide LoginScreens | shared/LoginLayout.tsx (NEU) |
| C2 | **BildContainer:** Verschoben von ueben/fragetypen/shared/ nach shared/ | shared/BildContainer.tsx |
| C3 | **korrekturStatusFarbe:** Umbenannt (war statusFarbe, Namenskollision mit trackerUtils) | korrekturUtils.ts |

### Statistiken
- **77 Dateien** geändert, **3312 Zeilen gelöscht**, **1227 hinzugefügt** (netto ~2085 weniger)
- **26 Duplikat-Dateien** eliminiert
- **11 Commits** auf Feature-Branch

### Geänderte Dateien (Schlüsseldateien)
- `src/components/ui/BaseDialog.tsx` — NEU: Shared Dialog
- `src/components/ui/Button.tsx` — NEU: Shared Button
- `src/context/FrageModeContext.tsx` — NEU: Modus-Provider
- `src/hooks/useFrageAdapter.ts` — NEU: Adapter-Hook
- `src/components/shared/fragetypenRegistry.ts` — NEU: Unified Registry
- `src/utils/normalizeAntwort.ts` — NEU: Antwort-Normalizer
- `src/components/shared/LoginLayout.tsx` — NEU: Login-Card-Layout
- `src/types/antworten.ts` — Erweitert (Selbstbewertung, klicks, aufgabengruppe)
- `src/store/ueben/uebungsStore.ts` — beantworteById, toggleUnsicherById
- `src/utils/ueben/korrektur.ts` — Unified Antwort akzeptiert
- `src/components/FrageRenderer.tsx` — Registry statt Switch
- `src/components/ueben/UebungsScreen.tsx` — Shared FrageRenderer
- `src/components/fragetypen/*.tsx` — Alle 20 auf useFrageAdapter
- `src/components/AbgabeDialog.tsx` — BaseDialog
- `src/App.tsx` — FrageModeProvider
- `src/AppUeben.tsx` — FrageModeProvider

### Architektur-Entscheide
- **Adapter-Hook statt Wrapper-Pattern:** useFrageAdapter(frageId) abstrahiert Store-Zugriff komplett. Fragetypen sind reine Presentation-Komponenten.
- **Rules-of-Hooks-konform:** Beide Stores werden IMMER aufgerufen, nur das Ergebnis des aktiven Modus wird zurückgegeben.
- **Normalizer statt Typ-Vereinheitlichung zur Laufzeit:** Legacy-Daten (localStorage, alte Sessions) werden beim Laden normalisiert.
- **3 Dialoge NICHT migriert:** FeedbackModal (eigenes Design), MixSessionDialog (Scrolling), SuSHilfePanel (Side-Panel) — inkompatibel mit BaseDialog.

### Noch offene Browser-Tests ⚠️
**KRITISCH: Übungsmodus ist Hauptrisiko** — State-Anbindung komplett umgebaut.

| # | Test | Modus | Fokus |
|---|------|-------|-------|
| B1 | MC beantworten → Antwort bleibt nach Navigation | Prüfung | Store-Persistenz |
| B2 | Freitext eingeben → bleibt nach Hin-und-Her | Prüfung | Store-Persistenz |
| B3 | Unsicher-Markierung setzen/entfernen | Prüfung | toggleMarkierung |
| B4 | AbgabeDialog öffnet/schliesst korrekt | Prüfung | BaseDialog-Migration |
| B5 | MC beantworten → sofortiges Feedback (grün/rot) | Üben | useFrageAdapter + feedbackSichtbar |
| B6 | Zuordnung/Lückentext/RF → Feedback | Üben | Verschiedene Typen |
| B7 | Navigation Weiter/Zurück | Üben | Session-State |
| B8 | Session beenden → Ergebnis-Übersicht | Üben | beantworteById |
| B9 | FiBu-Fragetypen (Buchungssatz, TKonto) | Beide | Komplexe Antwort-Strukturen |
| B10 | Dialoge öffnen/schliessen (ESC, Backdrop) | Beide | BaseDialog |

### Design-Docs
- Spec: `docs/superpowers/specs/2026-04-12-examlab-code-vereinfachung-design.md`
- Plan: `docs/superpowers/plans/2026-04-12-examlab-code-vereinfachung.md`

---

## Session 90 — Deep Links + Fachkürzel + Performance S6 (11.04.2026)

### Stand
Branch `feature/deep-links-fachkuerzel`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Deep Links (IMPROVEMENT_PLAN B7)** | |
| D1 | **Hash-Router erweitert:** Neue Routen `#/einstellungen/{tab}`, `#/fragensammlung/{frageId}`, `#/pruefung/{id}/korrektur`, `#/pruefung/{id}/monitoring` | lpNavigationStore.ts |
| D2 | **Einstellungen Deep Link:** `initialTab`-Prop, Hash-Reset beim Schliessen | EinstellungenPanel.tsx, LPStartseite.tsx |
| D3 | **Fragensammlung Deep Link:** `deepLinkFrageId` → `initialEditFrageId` an FragenBrowser | LPStartseite.tsx |
| D4 | **Korrektur/Monitoring Deep Link:** Redirect zu `?id=` DurchfuehrenDashboard | LPStartseite.tsx |
| D5 | **Store-Erweiterung:** `EinstellungenTab` exportiert, `deepLinkFrageId`, `deepLinkComposerTab`, `einstellungenTab` State-Felder | lpNavigationStore.ts |
| **Fachkürzel (IMPROVEMENT_PLAN U3)** | |
| F1 | **Offizielle Kürzel:** Alle Fächer aus Kürzelliste SJ2025/26 in DEFAULT_STAMMDATEN (37 Fächer, 16 Fachschaften) | stammdaten.ts |
| F2 | **FACHKUERZEL_MAP:** Mapping offizielles Kürzel → {fachId, gefaess} (42 Einträge: GF, SF, EF) | stammdaten.ts |
| F3 | **LP_KUERZEL_MAP:** Lehrpersonen-Kürzel → Name (WR/IN-Fachschaft) | stammdaten.ts |
| F4 | **Abwärtskompatibilität:** FACHSCHAFT_ZU_FACH unterstützt alte (DE, FR) und neue (D, F) Kürzel | fachUtils.ts |
| F5 | **Gefäss TAF hinzugefügt:** `gefaesse: [..., 'TAF']` | stammdaten.ts |
| F6 | **Fachschaften mit SF/EF-Fächern:** faecherIds erweitert (z.B. WR → [wr, wr-sf, wr-ef]) | stammdaten.ts |

### Deep Link Routen (vollständig)

| Route | Ziel |
|-------|------|
| `#/pruefung` | LP Prüfungs-Dashboard |
| `#/pruefung/tracker` | LP Prüfungs-Tracker |
| `#/pruefung/{configId}` | LP Prüfungs-Composer |
| `#/pruefung/{configId}/korrektur` | → Redirect zu ?id= (DurchfuehrenDashboard) |
| `#/pruefung/{configId}/monitoring` | → Redirect zu ?id= (DurchfuehrenDashboard) |
| `#/uebung` | LP Übungs-Dashboard |
| `#/uebung/durchfuehren` | LP Üben-Durchführen |
| `#/uebung/analyse` | LP Üben-Analyse |
| `#/uebung/{configId}` | LP Übungs-Composer |
| `#/fragensammlung` | LP Fragensammlung |
| `#/fragensammlung/{frageId}` | Frage direkt im Editor öffnen |
| `#/einstellungen` | Einstellungen-Panel |
| `#/einstellungen/profil` | Profil-Tab |
| `#/einstellungen/lernziele` | Lernziele-Tab |
| `#/einstellungen/admin` | Admin-Tab |

### Fachkürzel-Schema (offiziell, Gym Hofwil)

| Suffix | Gefäss | Beispiele |
|--------|--------|-----------|
| (keins) | GF | D, F, E, M, WR, IN, BG, MU, SP |
| `!` | SF | WR!, BG!, MU!, PPP!, S!, BC! |
| `!!` | EF | WR!!, IN!!, G!!, GG!!, P!!, PH!!, SP!! |
| `+` / `-FF` | FF | E+, M+, MU+, TH-FF, CH-FF, VO-FF |
| `t` | TAF | BGt, MUt, SPt, THWt |

### Geänderte Dateien (4)
- `Pruefung/src/store/lpNavigationStore.ts` — Deep Links: bauHash, navigiereZuHash, neue State-Felder
- `Pruefung/src/components/lp/LPStartseite.tsx` — Deep Link Integration (Einstellungen, Fragensammlung, Korrektur)
- `Pruefung/src/components/settings/EinstellungenPanel.tsx` — initialTab-Prop, Import EinstellungenTab
- `Pruefung/src/types/stammdaten.ts` — 37 Fächer, 16 Fachschaften, FACHKUERZEL_MAP, LP_KUERZEL_MAP
- `Pruefung/src/utils/fachUtils.ts` — FACHSCHAFT_ZU_FACH Abwärtskompatibilität (alte + neue Kürzel)

### Performance-Optimierungen (IMPROVEMENT_PLAN S6A–C)

| # | Änderung | Dateien |
|---|----------|---------|
| **S6A: Performance LP-Laden** | |
| P1 | **TrackerDaten non-blocking:** Aus Promise.all raus, lädt im Hintergrund (~6-8s schneller) | LPStartseite.tsx |
| P2 | **React.lazy für 5 Komponenten:** PruefungsComposer (153KB), FragenBrowser, HilfeSeite, EinstellungenPanel (24KB), AnalyseDashboard (11KB) | LPStartseite.tsx |
| P3 | **configVorlagen extrahiert:** leereUebung/leerePruefung in eigene Datei (Tree-Shaking für PruefungsComposer) | configVorlagen.ts (NEU), PruefungsComposer.tsx |
| P4 | **Bundle-Reduktion:** App-Chunk 1629KB → 1477KB (-153KB), PruefungsComposer als eigener Chunk | — |
| **S6B: SuS-Skeleton** | |
| P5 | **Login-Bridge Skeleton:** Header + Spinner statt leerer Text ("Verbinde...") | SuSStartseite.tsx |
| **S6C: Problem-Melden Kontext** | |
| P6 | **LP-Header:** Dynamischer Kontext aus NavigationStore (modus, ansicht, appVersion) | LPHeader.tsx |
| P7 | **Üben-AppShell:** Screen-Name + gruppeId + appVersion automatisch mitschicken | AppShell.tsx |

### Erwartete Ladezeit-Verbesserung
- **Vorher:** ~25s bis Dashboard interaktiv (TrackerDaten + Summaries + Configs blockierend)
- **Nachher:** ~3-5s bis Dashboard interaktiv (nur Configs blockiert, Tracker + Details im Hintergrund)
- Tracker-Badges erscheinen nachträglich (progressive enhancement)

### Geänderte Dateien (9)
- `Pruefung/src/store/lpNavigationStore.ts` — Deep Links
- `Pruefung/src/components/lp/LPStartseite.tsx` — Lazy imports, non-blocking Tracker, Deep Links
- `Pruefung/src/components/lp/LPHeader.tsx` — FeedbackButton dynamischer Kontext
- `Pruefung/src/components/lp/vorbereitung/PruefungsComposer.tsx` — configVorlagen-Import
- `Pruefung/src/components/lp/vorbereitung/configVorlagen.ts` — NEU: Extrahierte Vorlagen
- `Pruefung/src/components/settings/EinstellungenPanel.tsx` — initialTab-Prop
- `Pruefung/src/components/sus/SuSStartseite.tsx` — Login-Bridge Skeleton
- `Pruefung/src/components/ueben/layout/AppShell.tsx` — FeedbackButton Kontext
- `Pruefung/src/types/stammdaten.ts` — Fachkürzel + FACHKUERZEL_MAP
- `Pruefung/src/utils/fachUtils.ts` — Abwärtskompatible Kürzel

### Noch offen
- Browser-Test: Deep Links, Performance, Fachkürzel im Browser verifizieren
- Apps Script: Kein Deploy nötig (nur Frontend-Änderungen)
- Excel-Import S6D: Session 79 teilweise, Feinschliff offen
- Prefetching S6E: requestIdleCallback für Detail-Prefetch (bereits teilimplementiert)
- KI-Bild-Generator Backend: generiereFrageBild fehlt noch

---

## Session 88 — IMPROVEMENT_PLAN v2: S1–S5 (11.04.2026)

### Stand
Branch `fix/session88-bugfixes`. tsc ✅ | 209 Tests ✅ | Build ✅. 5 Commits.

### Erledigte Arbeiten (5 Sessions in 1)

| Session | # | Änderung | Dateien |
|---------|---|----------|---------|
| **S1: Bug-Fixes** ||||
|| B1 | **LP Profil speichern:** Zentraler Auth-Check prüfte `body.email`, Store sendet `callerEmail` → akzeptiert jetzt beides | apps-script-code.js |
|| B2 | **Buchungssatz Normalizer:** `case 'buchungssatz'` neu → `kontenauswahl` Default `{ modus: 'voll' }` | fragetypNormalizer.ts |
|| B3 | **Bilanzstruktur Normalizer:** Fallbacks für `nr/nummer/konto`, `betrag`, `bezeichnung/kontoname` | fragetypNormalizer.ts |
|| B4 | **Leerer Bildschirm:** Race Condition behoben + Fallback-UI | AppUeben.tsx, Zusammenfassung.tsx |
| **S2: UX-Fixes** ||||
|| B5 | **Gesperrte Themen:** 2-Klick-System → persistentes Overlay mit "Freiwillig üben"-Button | ThemaKarte.tsx |
|| B6 | **Demo-Kurs:** `sf-wr-27a28f` → generisches `'demo'` | demoConfig.ts |
|| U1 | **SuS-Header:** Rolle unter ExamLab-Titel (wie LP), "Schüler/in" bzw. "Admin" | AppShell.tsx |
| **S3: SuS-Navigation** ||||
|| F1 | **Tabs Üben/Prüfen:** SuS-App startet direkt im Üben-Tab (kein Start-Screen) | SuSStartseite.tsx, AppShell.tsx, AppUeben.tsx |
|| F1 | **Auto-Load Gruppe:** Letzte Gruppe in localStorage, auto-select bei Login | gruppenStore.ts |
|| F4 | **Favoriten:** `toggleFavoritById` akzeptiert `screen`-Parameter | lpNavigationStore.ts |
| **S4: Lernziel-Editor** ||||
|| F3 | **Lernziele-Tab:** Neuer Tab in Einstellungen mit vollständigem CRUD | LernzielTab.tsx (NEU), EinstellungenPanel.tsx |
|| F3 | **Backend:** `aktualisiereLernziel` + `loescheLernziel` Endpoints | apps-script-code.js |
|| U2 | **KI-Button-Klärung:** "🎯 Lernziel" → "🤖 KI: Frage aus Lernziel" | FragetextSection.tsx |
| **S5: Bild-Editor** ||||
|| F2 | **BildMitGenerator:** Tab-Umschalter "Hochladen" / "KI generieren" | BildMitGenerator.tsx (NEU) |
|| F2 | **BildGeneratorPanel:** KI-SVG-Generierung aus Textbeschreibung | BildGeneratorPanel.tsx (NEU) |
|| F2 | **3 Bild-Editoren umgestellt:** Bildbeschriftung, Hotspot, DragDrop nutzen BildMitGenerator | 3 Editor-Dateien |

### Neue Dateien (3)
- `Pruefung/src/components/settings/LernzielTab.tsx` — Lernziel-CRUD-Editor
- `packages/shared/src/editor/components/BildGeneratorPanel.tsx` — KI-SVG-Generierung
- `packages/shared/src/editor/components/BildMitGenerator.tsx` — Upload/KI Tab-Wrapper

### Geänderte Dateien (15)
- `Pruefung/apps-script-code.js` — LP-Auth Fix + 2 neue Endpoints (aktualisiereLernziel, loescheLernziel)
- `Pruefung/src/utils/ueben/fragetypNormalizer.ts` — Buchungssatz + Bilanz Normalizer
- `Pruefung/src/AppUeben.tsx` — Race Condition Fix + onModusWechsel Prop
- `Pruefung/src/components/ueben/Zusammenfassung.tsx` — Fallback-UI
- `Pruefung/src/components/ueben/ThemaKarte.tsx` — Persistentes Overlay
- `Pruefung/src/data/demoConfig.ts` — Demo-Kurs generisch
- `Pruefung/src/components/ueben/layout/AppShell.tsx` — Tabs + Rolle unter Titel
- `Pruefung/src/components/sus/SuSStartseite.tsx` — Direkt Üben-Tab, kein Start-Screen
- `Pruefung/src/store/ueben/gruppenStore.ts` — Letzte Gruppe in localStorage
- `Pruefung/src/store/lpNavigationStore.ts` — toggleFavoritById mit screen-Param
- `Pruefung/src/components/settings/EinstellungenPanel.tsx` — Lernziele-Tab
- `packages/shared/src/editor/sections/FragetextSection.tsx` — Button umbenannt
- `packages/shared/src/editor/typen/BildbeschriftungEditor.tsx` — BildMitGenerator
- `packages/shared/src/editor/typen/HotspotEditor.tsx` — BildMitGenerator
- `packages/shared/src/editor/typen/DragDropBildEditor.tsx` — BildMitGenerator

### Noch zu testen (Browser mit Login)
⬜ LP Profil speichern (B1 Fix)
⬜ SuS-Üben Buchungssatz Dropdowns (B2)
⬜ SuS-Üben Bilanzstruktur (B3 — Daten im Sheet ggf. reparieren)
⬜ SuS-Üben Serie beenden → Ergebnis-Screen (B4)
⬜ Gesperrte Themen Overlay (B5)
⬜ SuS-Header Rolle + Tabs (U1, F1)
⬜ Lernziele-Tab: CRUD im Browser (F3)
⬜ Bild-Editor: Upload + KI-Tab sichtbar (F2 — KI-Backend noch nicht deployed)
⬜ Alle offenen Tests aus Session 87

### Offene Punkte (nicht in dieser Session)
- B7: Deep Links (Hash-Router 3-Segment) — verschoben auf S6
- B8: 62 SVGs visuell prüfen — mit neuem Bild-Editor einfacher
- U3: Fachkürzel — User liefert Dokument mit Lehrplan-Kürzeln
- F2: Backend-Endpoint `generiereFrageBild` (Claude API) — muss in apps-script-code.js implementiert werden
- S6: Tests + Architektur + Cleanup

### Hinweise für nächste Session
- ✅ Branch `fix/session88-bugfixes` auf `main` gemergt + gepusht (GitHub Actions baut)
- ⬜ Apps Script muss neu deployed werden (LP-Auth Fix + 2 neue Lernziel-Endpoints)
- ⬜ Browser-Tests durchführen (9 Punkte oben)
- KI-Bild-Generator: Frontend steht, Backend-Endpoint `generiereFrageBild` fehlt noch (Claude API Call in apps-script-code.js)
- IMPROVEMENT_PLAN: S1–S5 erledigt, S6 (Deep Links, Fachkürzel, Tests, Cleanup) offen
- User liefert Dokument mit notenrelevanten Fachkürzeln gemäss Lehrplan (für U3)

---

## Session 87 — Browser-Tests + Bild-Fragetypen Reparatur (10.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅. Apps Script deployed (3×).

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Browser-Tests (9 Punkte)** | |
| T1 | ✅ Kontenbestimmung (Üben): BUG gefunden — leere Konto-Dropdowns | 3 Üben-Komponenten |
| T2 | ✅ Bildbeschriftung (Üben): BUG gefunden — beschriftungen=[] im Sheet | apps-script-code.js |
| T3 | ✅ DragDrop-Bild (Üben): BUG gefunden — labels="[object Object]", zielzonen=[] | apps-script-code.js |
| T4 | ✅ Hotspot (Üben): OK — funktioniert korrekt | — |
| T5 | ✅ Gesperrte Themen → freiwilliges Üben: OK | — |
| T6 | ✅ Üben-Analyse ohne Endlos-Spinner: OK | — |
| T7 | ✅ LP Analyse-Tab: OK (Heatmap, Lücken, Lernende) | — |
| T8 | ✅ LP LernzielWähler im Frageneditor: OK (100 Lernziele) | — |
| T9 | ✅ LP Druckansicht neue Fragetypen: OK (T-Konto, Kontenbestimmung, Code, Bildbeschriftung) | — |
| **Code-Fixes** | |
| F1 | **KontenSelect shared:** 3 Üben-FiBu-Komponenten nutzen jetzt den shared KontenSelect mit `config`-Prop (voller KMU-Kontenrahmen) statt lokalem mit leerem `konten`-Array | KontenbestimmungFrage.tsx, BuchungssatzFrage.tsx, TKontoFrage.tsx |
| F2 | **lernplattformSpeichereFrage:** Berechnet `typDaten` via `getTypDaten()` vor dem Speichern (verhindert leere typDaten bei ExamLab-Format-Objekten) | apps-script-code.js |
| F3 | **importierePoolFragen:** Schreibt bei Updates jetzt auch `typDaten`, `fragetext`, `musterlosung`, `bildUrl` (vorher nur Sync-Felder) | apps-script-code.js |
| F4 | **normalizeLabels:** Defensiver gegen Objekt-Input ({text, name}) | normalizeKonten.ts |
| **SVG-Reparatur (62 Bilder)** | |
| S1 | Alle 62 Bild-Fragetyp-SVGs (bildbeschriftung, dragdrop_bild, hotspot) neutral erstellt — ohne Lösungstext | 62 SVG-Dateien in img/ |
| S2 | Nur Grundstruktur: Diagramme, Achsen, Nummern/Buchstaben als Marker | BWL: 13, Recht: 21, VWL: 28 |
| **Daten-Reparatur** | |
| R1 | Repair-Script: Liest Pool-JS-Dateien, konvertiert korrekt, importiert via API | scripts/repair-bild-fragen.mjs |
| R2 | 62 Bild-Fragen im Fragenbank-Sheet mit korrekten typDaten aktualisiert | — |

### Geänderte Dateien (Code)
- `Pruefung/src/components/ueben/fragetypen/KontenbestimmungFrage.tsx` — shared KontenSelect
- `Pruefung/src/components/ueben/fragetypen/BuchungssatzFrage.tsx` — shared KontenSelect
- `Pruefung/src/components/ueben/fragetypen/TKontoFrage.tsx` — shared KontenSelect
- `Pruefung/src/utils/ueben/normalizeKonten.ts` — normalizeLabels defensiver
- `Pruefung/apps-script-code.js` — 3 Fixes (lernplattformSpeichereFrage, importierePoolFragen, typDaten)
- `Pruefung/scripts/repair-bild-fragen.mjs` — NEU: Repair-Script für Bild-Fragen

### Geänderte Dateien (SVGs) — 62 Stück
- `Uebungen/Uebungspools/img/bwl/**/*.svg` (13 Dateien)
- `Uebungen/Uebungspools/img/recht/**/*.svg` (21 Dateien)
- `Uebungen/Uebungspools/img/vwl/**/*.svg` (28 Dateien)

### Verifiziert im Browser (Chrome-in-Chrome)
- ✅ Bildbeschriftung: Neutrales SVG + 6 Marker + 6 Eingabefelder
- ✅ DragDrop-Bild: Korrekte Label-Texte + neutrale Zonen (kein [object Object])
- ✅ Hotspot: Klick + Feedback + Erklärung
- ✅ Gesperrte Themen: FIBU (abgeschlossen) weiterhin zugänglich
- ✅ Ergebnisse/Fortschritt: Kein Endlos-Spinner
- ✅ LP Analyse-Tab: Heatmap, Lücken, Lernende
- ✅ LernzielWähler: 100 Lernziele im Dropdown
- ✅ Druckansicht: Alle neuen Fragetypen korrekt

### Noch zu testen (nächste Session)
⬜ Kontenbestimmung im Browser (braucht neuen Frontend-Build — GitHub Actions)
⬜ Buchungssatz + T-Konto Dropdowns (gleicher Fix wie Kontenbestimmung)
⬜ SVGs visuell prüfen (neue neutrale Bilder nach GitHub Pages Deploy)
⬜ Favoriten: Backend-Sync + Direktlinks im Browser testen

### Hinweise für nächste Session
- Alles auf `main`, keine offenen Feature-Branches
- Apps Script wurde 3× deployed (typDaten-Fix + importierePoolFragen-Fix)
- 62 SVGs sind neutral — keine Lösungstexte mehr im Bild
- Repair-Script `scripts/repair-bild-fragen.mjs` kann wiederverwendet werden falls Daten nochmal kaputt gehen
- Alte Remote-Branches können aufgeräumt werden (10 Stück, alle gemergt)

---

## Session 86 — Block G2: Favoriten Account-verknüpft + Direktlinks (10.04.2026)

### Stand
Branch `feature/favoriten-g2`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| G2-1 | **AppOrt-Datenmodell:** Interface mit id, titel, screen, params, erstelltAm | `src/types/stammdaten.ts` |
| G2-2 | **LPProfil erweitert:** `favoriten?: AppOrt[]` Feld (backwards-kompatibel) | `src/types/stammdaten.ts` |
| G2-3 | **Navigation Store umgebaut:** `favoriten: AppOrt[]`, `toggleFavoritById()`, `istFavorit()`, Backend-Sync-Hook, Hash-Router (`navigiereZuHash`, `aktualisiereHash`, `bauHash`) | `src/store/lpNavigationStore.ts` |
| G2-4 | **Migration:** Alte `string[]`-Favoriten in localStorage werden automatisch zu `AppOrt[]` konvertiert | `src/store/lpNavigationStore.ts` |
| G2-5 | **Hash-Router:** URL-Schema `#/pruefung/id`, `#/uebung/id`, `#/fragensammlung`, `#/pruefung/tracker`. Browser Back/Forward funktioniert, Hash wird bei Navigation aktualisiert | `src/components/lp/LPStartseite.tsx` |
| G2-6 | **Backend-Sync:** Nach Login werden Backend-Favoriten aus LP-Profil geladen + lokal gemergt. Jede Änderung wird async ins LP-Profil zurückgeschrieben | `src/components/lp/LPStartseite.tsx` |
| G2-7 | **Favoriten-Dropdown:** ⭐-Button im Header, Dropdown mit allen Favoriten, Link-kopieren (🔗), Entfernen (✕), Klick navigiert direkt | `src/components/lp/LPHeader.tsx` |
| G2-8 | **Direktlinks in Karten:** `kopiereLink` nutzt Hash-URLs (`#/pruefung/id`) statt Query-Parameter (`?id=`) | `src/components/lp/LPStartseite.tsx` |
| G2-9 | **Hilfe aktualisiert:** Neuer Abschnitt "Favoriten & Direktlinks" in HilfeSeite | `src/components/lp/HilfeSeite.tsx` |

### Geänderte Dateien (5)
- `src/types/stammdaten.ts` — AppOrt Interface + favoriten? in LPProfil
- `src/store/lpNavigationStore.ts` — Komplett umgebaut (AppOrt[], Hash-Router, Backend-Sync)
- `src/components/lp/LPStartseite.tsx` — Hash-Router-Init, Backend-Sync, PruefungsKarte angepasst
- `src/components/lp/LPHeader.tsx` — FavoritenDropdown-Komponente hinzugefügt
- `src/components/lp/HilfeSeite.tsx` — Favoriten & Direktlinks Abschnitt

### URL-Schema
```
#/pruefung                    → Dashboard Prüfen
#/pruefung/tracker            → Analyse-Tab
#/pruefung/{configId}         → Composer für Prüfung
#/uebung                     → Dashboard Üben
#/uebung/durchfuehren        → Durchführung-Tab
#/uebung/analyse             → Analyse-Tab
#/uebung/{configId}          → Composer für Übung
#/fragensammlung              → Fragensammlung-Tab
```

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ✅ Preview: ⭐-Button im Header mit Tooltip "Favoriten (N)"
- ✅ Preview: ☆ auf Karte klicken → Favorit gesetzt, ⭐ FAVORITEN-Sektion erscheint
- ✅ Preview: Dropdown öffnet mit Favoriten-Einträgen (📋 + Titel)
- ✅ Preview: Keine Konsolen-Fehler
- ⬜ Browser-Test mit echtem Login: Backend-Sync (Favoriten in LP-Profil gespeichert)
- ⬜ Browser-Test: Direktlink kopieren + in neuem Tab öffnen → Config öffnet
- ⬜ Browser-Test: Favoriten nach Re-Login noch vorhanden (Backend-Persistenz)

### Ausstehend
- Alle Feature-Blöcke (A–G2) abgeschlossen. Nur noch Browser-Tests ausstehend.

---

## Session 85 — Block E: LernzielWähler (10.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| E1 | **LernzielWähler-Komponente:** Multi-Select mit Suchfeld (ab 5+ LZ), Fach→Thema-Gruppierung (einklappbar), Bloom-Badges, lila Chips für gewählte LZ | `packages/shared/src/editor/components/LernzielWaehler.tsx` (NEU) |
| E2 | **Neues Lernziel erstellen:** Inline-Formular (Fach, Bloom, Thema, Text) im Wähler. Erstellt im Backend + sofort auswählbar | LernzielWaehler.tsx |
| E3 | **MetadataSection:** Einfache Checkbox-Liste ersetzt durch LernzielWähler | MetadataSection.tsx |
| E4 | **Auto-Load:** Lernziele beim Editor-Öffnen automatisch laden (useEffect, nicht mehr nur bei KI-Button) | SharedFragenEditor.tsx |
| E5 | **EditorServices erweitert:** `speichereLernziel` Typ + PruefungFragenEditor-Verdrahtung | types.ts, PruefungFragenEditor.tsx |
| E6 | **Backend:** `speichereLernziel`-Aktion (LP-only, schreibt in Lehrplanziele-Sheet) | apps-script-code.js |
| E7 | **API:** `speichereLernziel()` Funktion | poolApi.ts |

### Neue Dateien (1)
- `packages/shared/src/editor/components/LernzielWaehler.tsx` — 328 Zeilen

### Geänderte Dateien (6)
- `packages/shared/src/editor/sections/MetadataSection.tsx` — LernzielWähler statt Checkbox-Liste
- `packages/shared/src/editor/SharedFragenEditor.tsx` — Auto-Load + handleNeuLernzielErstellen
- `packages/shared/src/editor/types.ts` — speichereLernziel in EditorServices
- `Pruefung/src/components/lp/frageneditor/PruefungFragenEditor.tsx` — speichereLernziel Service
- `Pruefung/src/services/poolApi.ts` — speichereLernziel API-Funktion
- `Pruefung/apps-script-code.js` — speichereLernzielEndpoint Aktion

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ✅ Preview: LernzielWähler im Frageneditor sichtbar
- ✅ Preview: "Neues Lernziel"-Formular öffnet korrekt
- ✅ Preview: Keine Konsolen-Fehler
- ⬜ Browser-Test mit echtem Login: Lernziele laden + zuordnen
- ⬜ Browser-Test: Neues Lernziel erstellen + Backend-Speicherung

### Ausstehend (Folge-Sessions)
- ~~**Block G2:** Favoriten Account-verknüpft + Direktlinks~~ ✅ Session 86

---

## Session 84 — Blöcke D, F, G: Analyse + Druckansicht + Gesperrte Themen (10.04.2026)

### Stand
Branch `feature/blocks-D-E-F-G`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Block D: Analyse-Tab** | |
| D1 | Zeitbedarf: Gestapelter Balken (1 Balken, Segmente pro Frage mit Hover-Tooltip) statt N einzelne Balken + Legende darunter | AnalyseTab.tsx |
| D2 | Taxonomie: Alle Fragenummern sichtbar (kein 7er-Limit mehr) + title-Tooltip | AnalyseTab.tsx |
| D3 | Üben-Analyse: 15s Timeout + Skeleton-Loading + Fehlermeldung + Retry-Button statt endlosem Spinner | SuSAnalyse.tsx |
| **Block F: Druckansicht** | |
| F1 | Hotspot druckbar: Bild + Anweisung "Markiere N Stellen" | DruckAnsicht.tsx |
| F2 | Bildbeschriftung druckbar: Bild mit nummerierten Markern + Antwortlinien | DruckAnsicht.tsx |
| F3 | DragDrop-Bild druckbar: Bild mit Zielzonen (A,B,C) + Begriffe-Liste zum Zuordnen | DruckAnsicht.tsx |
| F4 | Zeichnen: Leerer Zeichenbereich mit Rahmen statt "nur digital" | DruckAnsicht.tsx |
| **Block G: Gesperrte Themen** | |
| G1 | Gesperrte Themen: 1. Klick → Info-Hinweis, 2. Klick → Freiwilliges Üben starten | ThemaKarte.tsx |
| G2 | `freiwillig` Flag in UebungsSession — Fortschritt wird NICHT gespeichert | uebung.ts, uebungsStore.ts |
| G3 | Dashboard `handleStarte` erkennt gesperrte Themen und setzt `freiwillig=true` | Dashboard.tsx |

### Geänderte Dateien (8)
- `src/components/lp/vorbereitung/composer/AnalyseTab.tsx` — Gestapelter Zeitbedarf + Taxonomie ohne Limit
- `src/components/ueben/SuSAnalyse.tsx` — Timeout + Skeleton + Fehlerbehandlung
- `src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` — 4 neue Druck-Renderer
- `src/components/ueben/ThemaKarte.tsx` — Doppelklick für freiwilliges Üben
- `src/components/ueben/Dashboard.tsx` — freiwillig-Flag bei gesperrten Themen
- `src/types/ueben/uebung.ts` — `freiwillig?` Feld in UebungsSession
- `src/store/ueben/uebungsStore.ts` — `freiwillig` Parameter + kein Fortschritt-Speichern

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: Gestapelter Zeitbedarf-Balken im Analyse-Tab
- ⬜ Browser-Test: Alle Taxonomie-Nummern sichtbar
- ⬜ Browser-Test: Üben-Analyse lädt ohne Endlos-Spinner
- ⬜ Browser-Test: Druckansicht Hotspot/Bildbeschriftung/DragDrop/Zeichnen
- ⬜ Browser-Test: Gesperrte Themen: 2× klicken → freiwilliges Üben startet
- ⬜ Browser-Test: Freiwilliges Üben → Fortschritt nicht im Backend gespeichert

### Ausstehend (Folge-Sessions)
- **Block E:** Lernziele-UX — LernzielWähler mit DB-Suche + neue Lernziele erstellen (eigene Session)
- **Block G2:** Favoriten Account-verknüpft + Direktlinks (eigene Session)

---

## Session 83 — Üben-Fragetypen Daten-Normalisierung (Block B) (10.04.2026)

### Stand
Branch `fix/ueben-fragetypen-shared`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Daten-Normalisierung** | |
| N1 | `fragetypNormalizer.ts` (neu): Normalisiert alle 6 Üben-Fragetyp-Daten vor dem Rendern | fragetypNormalizer.ts |
| N2 | UebungsScreen: `normalisiereFrageDaten(frage)` vor Komponenten-Rendering | UebungsScreen.tsx |
| **T-Konto** | |
| T1 | Fallback: Wenn `kontenauswahl.konten` leer → automatisch aus `konten`-Definitionen ableiten | fragetypNormalizer.ts |
| **Kontenbestimmung** | |
| K1 | `erwarteteAntworten` mit `|| [{}]` abgesichert (kein map-Crash mehr) | KontenbestimmungFrage.tsx |
| K2 | `korrektZeilen` mit `|| []` abgesichert | KontenbestimmungFrage.tsx |
| **Bildbeschriftung** | |
| B1 | `beschriftungen` Array normalisiert (id, position, korrekt sichergestellt) | fragetypNormalizer.ts |
| **DragDrop-Bild** | |
| D1 | `zielzonen` + `labels` normalisiert (position, korrektesLabel, String-Labels) | fragetypNormalizer.ts |
| **Bilanz** | |
| BL1 | `saldo` Type-Guard: `toLocaleString()` nur auf echtem Number | BilanzFrage.tsx |
| BL2 | `kontenMitSaldi` normalisiert (name, saldo als Number) | fragetypNormalizer.ts |
| **Hotspot** | |
| H1 | Koordinaten-Normalisierung: Werte 0-1 → 0-100 (Prozent) automatisch skaliert | fragetypNormalizer.ts |
| H2 | `bereiche.koordinaten.radius` Fallback auf 5 | fragetypNormalizer.ts |

### Neue Dateien (1)
- `src/utils/ueben/fragetypNormalizer.ts` — Daten-Normalisierung für alle 6 Fragetypen

### Geänderte Dateien (3)
- `src/components/ueben/UebungsScreen.tsx` — Normalisierung vor Rendering
- `src/components/ueben/fragetypen/KontenbestimmungFrage.tsx` — Defensive Guards
- `src/components/ueben/fragetypen/BilanzFrage.tsx` — saldo Type-Guard

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: T-Konto Dropdowns gefüllt
- ⬜ Browser-Test: Kontenbestimmung kein map-Error
- ⬜ Browser-Test: Bildbeschriftung Felder sichtbar
- ⬜ Browser-Test: DragDrop Zonen klickbar
- ⬜ Browser-Test: Bilanz Toggle einzeln
- ⬜ Browser-Test: Hotspot Positionen korrekt

### Hinweis
Die Normalisierung löst Daten-Qualitäts-Probleme. Falls im Browser-Test noch Probleme auftreten, liegt es an den **Quell-Daten** (Pool-Konvertierung oder Apps Script). In dem Fall müssen die Daten in den Sheets/Pools geprüft werden.

---

## Session 82 — Browser-Test Bugfixes Block A+C (10.04.2026)

### Stand
Branch `fix/browser-test-bugs-blockAC`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Block A: Navigation & Header** | |
| A1 | Doppelte Header eliminiert: LPStartseite rendert Header NUR im Dashboard-Modus, Composer hat eigenen Header | LPStartseite.tsx |
| A2 | ExamLab-Titel immer klickbar (LP): `onHome` auch auf Dashboard, Composer bekommt `onHome={onZurueck}` | LPStartseite.tsx, PruefungsComposer.tsx |
| A3 | SuS Prüfen-Header: ExamLab als klickbarer Home-Button + Breadcrumbs ("ExamLab › Prüfungen & Korrekturen") | SuSStartseite.tsx |
| A4 | SuS-Üben AppShell: ExamLab-Titel klickbar → zurück zur SuS-Startseite. `onExamLabHome` Prop durch AppUeben → AppShell | AppShell.tsx, AppUeben.tsx |
| **Block C: Einstellungen-Panel** | |
| C1 | Z-Index Fix: `z-50` → `z-[70]` (über Header z-[60]) + `mt-14` Top-Offset (Panel unter Header) | EinstellungenPanel.tsx |
| C2 | Speichern-Fehler: Detaillierte Fehlermeldung statt generisch — zeigt Backend-Error im UI | stammdatenStore.ts, EinstellungenPanel.tsx |

### Geänderte Dateien (7)
- `src/components/lp/LPStartseite.tsx` — Header nur im Dashboard, onHome immer, composerBreadcrumbs entfernt
- `src/components/lp/LPHeader.tsx` — (unverändert, nutzt onHome korrekt)
- `src/components/lp/vorbereitung/PruefungsComposer.tsx` — `onHome={onZurueck}` hinzugefügt
- `src/components/sus/SuSStartseite.tsx` — Prüfen-Header mit ExamLab-Button + Breadcrumbs
- `src/components/ueben/layout/AppShell.tsx` — `onExamLabHome` Prop, ExamLab als Button
- `src/AppUeben.tsx` — `onZurueck` an AppShell weitergeleitet (nicht mehr _onZurueck)
- `src/components/settings/EinstellungenPanel.tsx` — z-[70] + mt-14 + detaillierte Fehlermeldung
- `src/store/stammdatenStore.ts` — Fehlerdetails aus Backend in Store.fehler

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: Kein doppelter Header im Composer
- ⬜ Browser-Test: ExamLab klickbar auf LP-Dashboard + Composer + SuS-Prüfen + SuS-Üben
- ⬜ Browser-Test: Einstellungen-Panel nicht mehr hinter Header
- ⬜ Browser-Test: Speichern-Fehler zeigt Details

### Bugfix-Plan (Folge-Blöcke)
- **Block B:** Üben-Fragetypen → Prüfungs-Komponenten wiederverwenden (6 Typen)
- **Block D:** Analyse-Tab (gestapelter Zeitbedarf-Balken, Taxonomie-Limit, Üben-Analyse Performance)
- **Block E:** Lernziele-UX (Position → Metadaten, DB-Auswahl, Suchfunktion)
- **Block F:** Druckansicht (4 Typen druckbar machen)
- **Block G:** Favoriten erweitern (Direktlinks, Account-verknüpft) + Gesperrte Themen

---

## Session 81 — Store-Migration + LP-Favoriten + Stammdaten-Erstbefüllung (10.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Store-Migration** | |
| S1 | LPStartseite: 10 useState-Hooks (ansicht, modus, vorherigerModus, listenTab, uebungsTab, zeigHilfe, zeigEinstellungen, composerKey) → useLPNavigationStore migriert | LPStartseite.tsx |
| S2 | lpNavigationStore erweitert: listenTab, uebungsTab, zeigHilfe, zeigEinstellungen, composerKey, neuerComposerKey(), toggleHilfe() | lpNavigationStore.ts |
| **LP-Favoriten** | |
| F1 | ⭐-Button auf jeder PruefungsKarte (☆/⭐ Toggle, localStorage-persistiert) | LPStartseite.tsx |
| F2 | Favoriten-Sektion (amber-farbig) vor "Zuletzt" in Prüfungen-Liste und in Übungen-Liste | LPStartseite.tsx |
| F3 | Favoriten-State im lpNavigationStore: favoriten[], toggleFavorit(), istFavorit() | lpNavigationStore.ts |
| **Stammdaten-Erstbefüllung** | |
| D1 | Auto-Befüllung: Wenn Backend keine Stammdaten hat und LP ein Admin ist → DEFAULT_STAMMDATEN automatisch ins Backend schreiben | stammdatenStore.ts |

### Geänderte Dateien (3)
- `src/components/lp/LPStartseite.tsx` — Store-Migration + Favoriten-Button + Favoriten-Sektionen
- `src/store/lpNavigationStore.ts` — Erweitert um Sub-Tabs, UI-Panels, Favoriten
- `src/store/stammdatenStore.ts` — Auto-Befüllung mit Defaults

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: ⭐-Button auf Prüfungskarten sichtbar + Toggle funktioniert
- ⬜ Browser-Test: Favoriten-Sektion erscheint wenn Favoriten gesetzt
- ⬜ Browser-Test: Modus/Tab-Wechsel funktioniert weiterhin nach Store-Migration

### Offen (Folge-Sessions)
- Browser-Tests für Session 79–81 Features
- Weitere UX-Verbesserungen nach User-Feedback

---

## Session 80 — Admin-CRUD + LP-Profil Auto-Load + Fach/Punkte (10.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Kurse/Fächer/Fachschaften CRUD** | |
| C1 | Admin-Tab komplett umgebaut: Kurse, Fächer, Fachschaften jetzt editierbar (hinzufügen/entfernen) | EinstellungenPanel.tsx |
| C2 | InlineKursEditor: Name, Fach, Fachschaft-Dropdown, Gefäss-Dropdown, Klassen-Input | EinstellungenPanel.tsx |
| C3 | InlineTextEditor: Generischer Kürzel+Name Editor für Fächer/Fachschaften | EinstellungenPanel.tsx |
| C4 | Speichern sendet jetzt alle Stammdaten (inkl. Kurse, Fächer, Fachschaften) ans Backend | EinstellungenPanel.tsx |
| **LP-Profil Auto-Load** | |
| P1 | Stammdaten + LP-Profil werden beim LP-Login parallel geladen (Fire-and-forget) | LPStartseite.tsx |
| P2 | Kein extra Klick auf Einstellungen nötig — Stammdaten sofort verfügbar | LPStartseite.tsx |
| **Fach-Label + Gesamtpunkte** | |
| F1 | "Fachbereiche" → "Fach" umbenannt im ConfigTab | ConfigTab.tsx |
| F2 | Fach-Optionen dynamisch aus Stammdaten (statt hardcoded VWL/BWL/Recht) | ConfigTab.tsx |
| F3 | Fach-Buttons mit Fachbereich-Farben aus Stammdaten (style-basiert) | ConfigTab.tsx |
| F4 | Gesamtpunkte auto-berechnet aus Fragen-Summe (readonly + "auto" Label) | ConfigTab.tsx, PruefungsComposer.tsx |

### Geänderte Dateien (4)
- `src/components/settings/EinstellungenPanel.tsx` — CRUD für Kurse/Fächer/Fachschaften
- `src/components/lp/LPStartseite.tsx` — Stammdaten + LP-Profil Auto-Load
- `src/components/lp/vorbereitung/composer/ConfigTab.tsx` — Fach-Label + dynamische Optionen + Punkte-Auto
- `src/components/lp/vorbereitung/PruefungsComposer.tsx` — berechnetePunkte Logik

### Verifiziert
- ✅ tsc -b grün
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: CRUD in Admin-Einstellungen
- ⬜ Browser-Test: Fach-Buttons im ConfigTab mit Stammdaten-Farben
- ⬜ Browser-Test: Gesamtpunkte auto-berechnet

### Offen (Folge-Sessions)
- LP-Favoriten (⭐-Button, Favoriten-Dropdown)
- Store-Migration LPStartseite useState → lpNavigationStore
- Stammdaten-Tab initial befüllen (manuelle Erstbefüllung via Admin-UI)

---

## Session 79 — Excel-Import + Lernziele überall (10.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Excel-Import (IMPROVEMENT_PLAN 6D)** | |
| E1 | `excelImport.ts` (neu, ~280 Z.): Parser-Utility (XLSX → Frage[], Validierung, Spalten-Mapping, Vorlage-Export) | excelImport.ts |
| E2 | `ExcelImport.tsx` (neu, ~310 Z.): Import-Dialog (Drag&Drop Upload, Sheet-Auswahl, Vorschau mit Validierung, Duplikat-Erkennung, Fortschrittsbalken) | ExcelImport.tsx |
| E3 | Button "Excel-Import" in FragenBrowserHeader (neben "Import via KI") | FragenBrowserHeader.tsx |
| E4 | Verdrahtung in FragenBrowser: `zeigExcelImport` State + ExcelImport-Overlay (inline + overlay) | FragenBrowser.tsx |
| **Lernziele überall (IMPROVEMENT_PLAN 6F)** | |
| L1 | AdminThemensteuerung: 🏁 Button pro Thema mit Lernziele-Anzahl, LernzieleMiniModal-Integration | AdminThemensteuerung.tsx |
| L2 | AdminThemensteuerung: Lernziele laden beim Mount via `fortschrittStore.ladeLernziele()` | AdminThemensteuerung.tsx |
| L3 | AdminFragenbank: Lernziel-Chips (🏁 N) pro Frage, Lernziele-Filter (Alle/Mit/Ohne), lzMap-Tooltip | AdminFragenbank.tsx |
| L4 | DetailKarte: 🏁-Badge mit Anzahl zugeordneter Lernziele (violett) | DetailKarte.tsx |
| L5 | KompaktZeile: 🏁-Badge mit Anzahl zugeordneter Lernziele (violett) | KompaktZeile.tsx |

### Neue Dateien (2)
- `src/utils/excelImport.ts` — Excel-Parser + Template-Export
- `src/components/lp/fragenbank/ExcelImport.tsx` — Import-Dialog

### Geänderte Dateien (6)
- `src/components/lp/fragenbank/FragenBrowser.tsx` — ExcelImport-Import + State + Overlay
- `src/components/lp/fragenbank/fragenbrowser/FragenBrowserHeader.tsx` — onExcelImport Prop + Button
- `src/components/lp/fragenbank/fragenbrowser/DetailKarte.tsx` — Lernziel-Badge
- `src/components/lp/fragenbank/fragenbrowser/KompaktZeile.tsx` — Lernziel-Badge
- `src/components/ueben/admin/AdminThemensteuerung.tsx` — Lernziele laden + 🏁 Button + Modal
- `src/components/ueben/admin/AdminFragenbank.tsx` — Lernziele laden + Filter + Chips

### Verifiziert
- ✅ tsc -b grün (0 Errors)
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: Excel-Import-Dialog + Vorlage + Re-Import
- ⬜ Browser-Test: 🏁 Buttons in AdminThemensteuerung sichtbar
- ⬜ Browser-Test: Lernziel-Filter in AdminFragenbank
- ⬜ Browser-Test: Lernziel-Badges in Fragensammlung (Detail + Kompakt)

### IMPROVEMENT_PLAN Status
- ✅ Session 1–5: Komplett erledigt
- ✅ Session 6A–C, E: Erledigt (Session 78)
- ✅ Session 6D: Excel-Import (diese Session)
- ✅ Session 6F: Lernziele überall (diese Session)
- **IMPROVEMENT_PLAN vollständig abgeschlossen.**

### Offen (Folge-Sessions)
- Kurse/Fächer/Fachschaften CRUD im Admin-Tab (aktuell nur Anzeige)
- LP-Profil automatisch laden beim Login
- Stammdaten-Tab initial befüllen
- LP-Favoriten (⭐-Button, Favoriten-Dropdown)
- Store-Migration LPStartseite useState → lpNavigationStore
- Prüfung/Übung bearbeiten: "Fachbereiche" → "Fach", Gesamtpunkte auto

---

## Session 78 — Performance + Problem-Melden (10.04.2026)

### Stand
Branch `feature/performance-features` (basiert auf `feature/ux-polish-session5`). tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **IndexedDB-Cache (Performance)** | |
| P1 | `fragenbankCache.ts` (neu, 125 Z.): IndexedDB Cache-Layer mit 3 Stores (summaries, details, meta), 10min TTL, silent error handling | fragenbankCache.ts |
| P2 | Stale-While-Revalidate in `fragenbankStore.ts`: Cache zuerst → sofort anzeigen → Server im Hintergrund revalidieren ohne UI-Flicker | fragenbankStore.ts |
| P3 | Cache-Invalidierung: `_cacheInvalid` Flag in `aktualisiereFrage`, `entferneFrage`, `fuegeFragenHinzu`; `clearFragenbankCache()` in `reset()` | fragenbankStore.ts |
| **LP-Skeleton + Sync-Guard** | |
| P4 | `LPSkeleton.tsx` (neu, ~50 Z.): Pulsierendes Dashboard-Skeleton (Header + Tabs + 6 Karten) | LPSkeleton.tsx |
| P5 | Skeleton-Einbindung: `if (ladeStatus !== 'fertig' && ansicht !== 'composer') return <LPSkeleton />` | LPStartseite.tsx |
| P6 | Sync-Guard: `sessionStorage` Flag, Einrichtungs-Sync nur einmal pro Browser-Session | LPStartseite.tsx |
| P7 | Prefetch-Trigger: `requestIdleCallback` / `setTimeout(2s)` für Fragenbank-Details | LPStartseite.tsx |
| **SuS-Skeleton** | |
| P8 | Karten-Platzhalter (4 Cards, responsive Grid) im SuS-Loading-Skeleton | SuSStartseite.tsx |
| **FeedbackContext** | |
| P9 | `FeedbackContext` erweitert: `frageTyp`, `modus`, `bildschirm`, `appVersion`, `gruppeId` | FeedbackModal.tsx |
| P10 | `appVersion` aus `__BUILD_TIMESTAMP__` (bereits in vite.config.ts definiert) | FeedbackModal.tsx |
| P11 | 5 Verwendungsstellen: LPHeader, AppShell, KorrekturFragenAnsicht, KorrekturEinsicht, Startbildschirm | 5 Dateien |

### Neue Dateien (2)
- `src/services/fragenbankCache.ts` — IndexedDB Cache-Layer für Fragenbank
- `src/components/lp/LPSkeleton.tsx` — LP Dashboard Loading Skeleton

### Geänderte Dateien (8)
- `src/store/fragenbankStore.ts` — SWR-Cache + Invalidierung + Cache-Clear bei Logout
- `src/components/lp/LPStartseite.tsx` — Skeleton + Sync-Guard + Prefetch
- `src/components/sus/SuSStartseite.tsx` — Karten-Skeleton
- `src/components/shared/FeedbackModal.tsx` — Erweiterte Context-Felder im Payload
- `src/components/lp/LPHeader.tsx` — FeedbackButton modus/bildschirm
- `src/components/ueben/layout/AppShell.tsx` — FeedbackButton modus/bildschirm
- `src/components/lp/korrektur/KorrekturFragenAnsicht.tsx` — FeedbackButton frageTyp/modus/bildschirm
- `src/components/sus/KorrekturEinsicht.tsx` — FeedbackButton modus/bildschirm
- `src/components/Startbildschirm.tsx` — FeedbackButton modus/bildschirm

### Verifiziert
- ✅ tsc -b grün (0 Errors)
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ⬜ Browser-Test: LP-Ladezeit messen (Erstaufruf vs. Zweitaufruf mit Cache)
- ⬜ Browser-Test: Skeleton sichtbar beim Laden
- ⬜ Browser-Test: Problem-Melden Payload enthält neue Felder

### Offen (Folge-Sessions)
- Branch auf main mergen (nach User-Test + Freigabe aller Feature-Branches)
- Excel-Import (IMPROVEMENT_PLAN Session 6D) — eigene Session
- Lernziele überall (IMPROVEMENT_PLAN Session 6F) — eigene Session

---

## Session 77 — B2: Druckbare Ansicht (10.04.2026)

### Stand
Branch `feature/ux-polish-session5`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| B2a | `DruckAnsicht.tsx` (neu, 420 Z.): Fullscreen-Overlay mit professionellem Prüfungsblatt — Schulname aus `useSchulConfig`, Name/Vorname/Klasse-Felder, Metadaten, Abschnitte, Footer | DruckAnsicht.tsx |
| B2b | 20 Fragetyp-Renderer: MC (○/□), R/F (Tabelle), Freitext (liniert), Lückentext (Blanks), Zuordnung, Berechnung, Buchungssatz (Soll/Haben-Tabelle), T-Konto (Vorlagen), Kontenbestimmung, Bilanz/ER (Struktur), Aufgabengruppe (rekursiv), Sortierung, Code, Formel, Zeichnen/Hotspot/Bildbeschriftung/DragDrop/Audio/PDF → "nur digital" Hinweis | DruckAnsicht.tsx |
| B2c | Bilder inline (`<img>` via Drive-Thumbnail), Audio/Video/PDF-Embeds → Texthinweis | DruckAnsicht.tsx |
| B2d | Print-CSS: Seitenumbrüche zwischen Abschnitten, Fragen nicht zerrissen, linierte Antwortfelder | index.css |
| B2e | Button "Druckbare Ansicht" neben "Interaktive SuS-Vorschau" im VorschauTab | VorschauTab.tsx |
| B2f | `formatFragetext()` in `textFormatierung.tsx` extrahiert (shared zwischen VorschauTab + DruckAnsicht) | textFormatierung.tsx, VorschauTab.tsx |
| B2g | z-Index Fix: Overlay `z-[70]` statt `z-50` (LP-Header hat `z-[60]`) | DruckAnsicht.tsx |

### Neue Dateien (2)
- `src/components/lp/vorbereitung/composer/DruckAnsicht.tsx` — Druckbare Prüfungsansicht (420 Z.)
- `src/utils/textFormatierung.tsx` — Extrahierte `formatFragetext()` Utility (27 Z.)

### Geänderte Dateien (2)
- `src/components/lp/vorbereitung/composer/VorschauTab.tsx` — Button + Import + State (+15 Z., lokale formatFragetext entfernt)
- `src/index.css` — Print-CSS für DruckAnsicht (+15 Z.)

### Verifiziert
- ✅ tsc -b grün (0 Errors)
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ✅ Button sichtbar im Browser (Demo-LP → Bearbeiten → Vorschau)
- ✅ DruckAnsicht öffnet sich als Overlay mit Name-Feldern, Abschnitten, MC-Fragen
- ⬜ Noch nicht getestet: Alle 20 Fragetypen visuell im Browser (vom User geplant)
- ⬜ Noch nicht getestet: Druckvorschau Cmd+P (Seitenumbrüche, weiss/schwarz)

### Offen (Folge-Sessions)
- F5 vollständig: Lernziele-Crosslinking in LP-Ansichten (Themensteuerung, Fragenbank)
- Session 6 aus IMPROVEMENT_PLAN: Performance + Erweiterte Features
- Branch auf main mergen (nach User-Test + Freigabe)

---

## Session 76 — UX-Polish + Analyse-Verbesserungen (10.04.2026)

### Stand
Branch `feature/ux-polish-session5`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Analyse-Tab (A1–A7 aus IMPROVEMENT_PLAN)** | |
| A1 | Farbcode-Legende (grün=OK, amber=Warnung, rot=Überschreitung, blau=KI) | AnalyseTab.tsx |
| A2 | Zeitbedarf-Balken pro Frage (Nummer, Anteil-Balken, Minutenzahl + Fragetyp) | AnalyseTab.tsx |
| A3 | Frage-Nummern in Taxonomie-Balken eingeblendet (max. 8, dann …) | AnalyseTab.tsx, analyseUtils.ts |
| A4 | Frage-Nummern unter Fragetypen-Mix-Karten ("Fr. 1, 3, 5") | AnalyseTab.tsx, analyseUtils.ts |
| A5 | TYP_LABELS dedupliziert → nutzt `typLabel()` aus fachUtils.ts (alle 20 Typen) | analyseUtils.ts |
| A6 | "Gesch. Zeit" → "Zeitbedarf" in MiniCard | AnalyseTab.tsx |
| A7 | Themen-Normalisierung (Trim + erster Buchstabe gross) | analyseUtils.ts |
| **Layout (C1)** | |
| C1 | Abschnitt-Header: Pfeile (↑↓) + Löschen (×) einheitlich rechts | AbschnitteTab.tsx |
| **CSS-Fixes (E1)** | |
| E1 | Hover-Fix: `dark:hover:bg-slate-750` → `dark:hover:bg-slate-700` (gültige Tailwind-Klasse) | TrackerSection.tsx |
| **SuS-Üben UX (F1–F5)** | |
| F1 | `cursor-pointer` explizit auf EmpfehlungsKarte | EmpfehlungsKarte.tsx |
| F2 | Repetition-Button disabled + Tooltip wenn keine Fortschrittsdaten | Dashboard.tsx |
| F3 | Gesperrte Themen anklickbar: Klick zeigt Info-Overlay (3s) statt disabled | ThemaKarte.tsx |
| F4 | Fragetyp-Abkürzungen → volle Namen (MC→Multiple Choice etc.) + title-Tooltips | Dashboard.tsx |
| F5 | 🏁 Lernziele-Button auch bei gesperrten Themen sichtbar | ThemaKarte.tsx |
| **Material-Sidebar (D1)** | |
| D1 | Vollbild-Button im Split-Modus entfernt (Overlay→Split bleibt) | MaterialPanel.tsx |

### Verifiziert
- ✅ tsc -b grün (0 Errors)
- ✅ 209 Tests grün
- ✅ Build erfolgreich

---

## Session 75 — Einstellungen + Stammdaten + Hardcoded-Audit (10.04.2026)

### Stand
Branch `feature/einstellungen-stammdaten`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Stammdaten-System (neu)** | |
| S1 | `Stammdaten`-Typen: Admins, Klassen, Kurse, Fächer, Gefässe, Fachschaften | stammdaten.ts (neu) |
| S2 | `DEFAULT_STAMMDATEN` mit Gym-Hofwil-Daten (DUY-Kurse, 16 Fächer, Fachbereich-Tags) | stammdaten.ts (neu) |
| S3 | `stammdatenStore.ts` — Zustand Store mit Laden/Speichern + Admin-Check | stammdatenStore.ts (neu) |
| S4 | 4 Apps Script Endpoints: ladeStammdaten, speichereStammdaten, ladeLPProfil, speichereLPProfil | apps-script-code.js |
| S5 | Stammdaten-Tab + LP-Profile-Tab im CONFIGS-Sheet (Key-Value mit JSON) | apps-script-code.js |
| **Hardcoded-Audit** | |
| H1 | `demoConfig.ts` erstellt: DEMO_KURS_ID, DEMO_PRUEFUNG_ID, DEMO_AUTOR_EMAIL | demoConfig.ts (neu) |
| H2 | `einrichtungsPruefung.ts`: hardcoded `sf-wr-27a28f` → `DEMO_KURS_ID` | einrichtungsPruefung.ts |
| H3 | `einrichtungsUebung.ts`: hardcoded `sf-wr-27a28f` → `DEMO_KURS_ID` | einrichtungsUebung.ts |
| H4 | `demoKorrektur.ts`: hardcoded kursId + pruefungId → `DEMO_KURS_ID` / `DEMO_PRUEFUNG_ID` | demoKorrektur.ts |
| H5 | `einrichtungsFragen.ts` + `einrichtungsUebungFragen.ts`: Autor → `DEMO_AUTOR_EMAIL` | einrichtungsFragen.ts, einrichtungsUebungFragen.ts |
| H6 | Test-Datei: hardcoded Email → `test-lp@gymhofwil.ch` | themenSichtbarkeit.test.ts |
| **Einstellungen-Panel (Umbau)** | |
| E1 | Komplett umgebaut: "Mein Profil" (Fachschaften, Kurse, Gefässe wählen) + "Admin" (Stammdaten verwalten) | EinstellungenPanel.tsx |
| E2 | Admin-Check: `stammdaten.admins.includes(email)` statt hardcoded | EinstellungenPanel.tsx |
| E3 | "Pool-Themen migrieren"-Button entfernt | EinstellungenPanel.tsx |
| E4 | CheckboxChip + SettingsField Shared Components | EinstellungenPanel.tsx |
| **Stammdaten-Integration** | |
| I1 | `fachUtils.ts`: `fachschaftZuFach()` + `schulFachbereiche()` mit Stammdaten-Fallback | fachUtils.ts |
| I2 | `useFragenFilter.ts`: `SCHUL_FACHBEREICHE` aus `schulFachbereiche()` statt hardcoded Set | useFragenFilter.ts |

### Neue Dateien (3)
- `src/data/demoConfig.ts` — Demo-Konstanten (DEMO_KURS_ID, DEMO_PRUEFUNG_ID, DEMO_AUTOR_EMAIL)
- `src/types/stammdaten.ts` — Stammdaten-Typen + DEFAULT_STAMMDATEN
- `src/store/stammdatenStore.ts` — Stammdaten Zustand Store

### ⚠ Apps Script Deploy nötig
- `ladeStammdaten`: Liest Key-Value-Paare aus neuem "Stammdaten"-Tab
- `speichereStammdaten`: Nur Admins, schreibt in "Stammdaten"-Tab
- `ladeLPProfil`: Liest LP-Profil aus "LP-Profile"-Tab
- `speichereLPProfil`: Speichert LP-Profil in "LP-Profile"-Tab
- **Tabs werden automatisch erstellt** beim ersten Schreibzugriff

### Verifiziert
- ✅ tsc -b grün (0 Errors)
- ✅ 209 Tests grün
- ✅ Build erfolgreich
- ✅ Kein `yannick.durand@gymhofwil.ch` mehr in Source (nur in demoConfig.ts + DEFAULT_STAMMDATEN)
- ✅ Kein `sf-wr-27a28f` mehr in Source (nur in demoConfig.ts + DEFAULT_STAMMDATEN)

### Offen (Folge-Sessions)
- Prüfung/Übung bearbeiten: "Fachbereiche" → "Fach", Gesamtpunkte auto-berechnen
- Kurse CRUD im Admin-Tab (aktuell nur Anzeige)
- Fächer/Fachschaften CRUD im Admin-Tab (aktuell nur Anzeige)
- LP-Profil laden beim Login (automatisch)
- Stammdaten-Tab initial befüllen (manuell oder Import-Script)

---

## Session 74 — Navigation & Kopfzeile (10.04.2026)

### Stand
Branch `feature/navigation-breadcrumbs`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten

| # | Änderung | Dateien |
|---|----------|---------|
| **Persistente Kopfzeile** | |
| N1 | Composer rendert jetzt INNERHALB des Layouts (Header bleibt sichtbar) | LPStartseite.tsx |
| N2 | Breadcrumbs im Header: "ExamLab › Prüfen › Prüfungstitel" | LPHeader.tsx |
| N3 | ExamLab-Titel klickbar → zurück zum Dashboard (onHome Prop) | LPHeader.tsx |
| N4 | Zurück-Button im Composer zeigt Tabs nicht (korrekt) | LPHeader.tsx |
| **LP Navigation Store** | |
| N5 | `lpNavigationStore.ts` erstellt (Zustand, History-Stack, Breadcrumbs, sessionStorage) | lpNavigationStore.ts (neu) |
| **SuS-Navigation** | |
| N6 | ExamLab-Link: `<a href>` → `<button onClick>`, navigiert zum Start statt weg | SuSStartseite.tsx |

### Neue Dateien (1)
- `src/store/lpNavigationStore.ts` — LP Navigation Store (noch nicht vollständig integriert, Grundlage für weitere Refactoring)

### Verifiziert im Browser (Preview)
- ✅ Composer: Header mit Breadcrumbs sichtbar
- ✅ ExamLab-Klick → Dashboard
- ✅ Zurück-Button → Dashboard
- ✅ Keine Console-Errors
- ✅ SuS ExamLab-Link navigiert zum Start

### Nicht umgesetzt (Folge-Sessions)
- LP-Favoriten (⭐-Button): Grundstruktur geplant, nicht implementiert
- Vollständige Store-Migration: `LPStartseite` useState → lpNavigationStore

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

## Session 89 — Improvement Plan S1–S5 (11.04.2026)

### Stand
Branch `main`. tsc ✅ | 209 Tests ✅ | Build ✅.

### Erledigte Arbeiten (5 von 6 Sessions)

| # | Änderung | Dateien |
|---|----------|---------|
| **S1: Editor-Crashes** | 6 Typ-Editoren defensiv mit `?? []` abgesichert (Schicht 2) | LueckentextEditor, BildbeschriftungEditor, DragDropBildEditor, HotspotEditor, KontenbestimmungEditor, TKontoEditor |
| **S1: Dropdowns** | Reset-Labels vereinheitlicht ("Alle Fächer", "Alle Typen", etc.) | FragenBrowserHeader.tsx |
| **S2: KontenSelect** | Defensive Normalisierung von konten-Objekten ({nr,name}→string) | KontenSelect.tsx (shared) |
| **S2: HotspotFrage** | Rechteck-basierter Hit-Test statt nur Radius-Check | HotspotFrage.tsx (ueben) |
| **S2: GruppeFrage** | Leere-Teilaufgaben-Hinweis statt stiller leerer Render | GruppeFrage.tsx (ueben) |
| **S2: Korrektur** | Defensive Filter + Name-Fallback bei abgabenResult | useKorrekturDaten.ts |
| **S3: Breadcrumbs** | Composer übergibt Breadcrumbs aus NavigationStore an LPHeader | PruefungsComposer.tsx |
| **S3: SuS-Nav** | ExamLab-Titel im SuS-Prüfen-Header klickbar (→ Üben) | SuSStartseite.tsx |
| **S4** | Bereits vollständig implementiert (Stammdaten, Profil, Admin-Panel, istAdmin) | — |
| **S5: Drag-Handle** | Drag-Handle von links nach rechts verschoben (neben Pfeile/Löschen) | AbschnitteTab.tsx |

### Hinweise
- SharedFragenEditor hatte bereits `?? []` in allen useState-Initialisierern (Schicht 1)
- LP Navigation Store mit History-Stack, Breadcrumbs, Favoriten, Hash-Router war vollständig implementiert
- typLabel() hatte bereits konsistente Gross-Labels (Multiple Choice, Kontenbestimmung, etc.)
- FeedbackModal hatte bereits erweiterte Kontext-Felder
- **S6 erledigt:** Performance (Session 90), Excel-Import (Session 79), Lernziele (Session 79) — IMPROVEMENT_PLAN komplett ✅

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
| **1** | `fix/editor-array-undefined-crashes` | Fragensammlung-Editor Crashes: 6 Fragetypen + Dropdown-Labels | ✅ erledigt (Session 89) |
| **2** | `fix/ueben-fragetypen-korrektur` | Üben-Modus: KontenSelect, Hotspot Hit-Test, Korrektur-Loading | ✅ erledigt (Session 89) |
| **3** | `feature/navigation-breadcrumbs` | Composer-Breadcrumbs, SuS ExamLab-Klick | ✅ erledigt (Session 89) |
| **4** | `feature/einstellungen-stammdaten` | Stammdaten-System, LP-Profil, Hardcoded-Audit | ✅ bereits erledigt (Session 66–70) |
| **5** | `feature/ux-polish` | Drag-Handle rechts, Labels konsistent | ✅ erledigt (Session 89) |
| **6** | `feature/performance-features` | Performance, Problem-Melden-Kontext, Excel-Import, Prefetching, Lernziele | ✅ erledigt (Sessions 67, 79, 90) |

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
