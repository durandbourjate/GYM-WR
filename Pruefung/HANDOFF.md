# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

## Aktueller Stand

**Phase 4: Composer & SEB** (17.03.2026) — Backend getestet & funktioniert ✅

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
- Textfeld-Höhe: User möchte testen ob auto-grow oder begrenzter Bereich mit Scrollen besser ist
- Tablet-/Smartphone-Optimierung: grundsätzlich responsive, aber noch nicht spezifisch getestet

## Verzeichnisstruktur

```
Pruefung/
├── src/
│   ├── App.tsx                          — Auth-Gate + Rollen-Routing (LP→Dashboard, SuS→Prüfung)
│   ├── index.css                        — Tailwind + Tiptap-Styles + Dark-Mode-Kontrast
│   ├── main.tsx
│   ├── types/
│   │   ├── fragen.ts                    — FrageBase, MCFrage, FreitextFrage, LueckentextFrage, etc.
│   │   ├── pruefung.ts                  — PruefungsConfig, PruefungsAbschnitt
│   │   ├── antworten.ts                 — PruefungsAbgabe, Antwort-Union-Typ
│   │   ├── auth.ts                      — AuthUser, Rolle
│   │   └── monitoring.ts                — SchuelerStatus, MonitoringDaten
│   ├── store/
│   │   ├── pruefungStore.ts             — Zustand-Store (Antworten, Navigation, Phase)
│   │   ├── authStore.ts                 — Auth-State: User, Demo, Login/Logout
│   │   └── themeStore.ts                — Light/Dark/System Mode mit Persist
│   ├── data/
│   │   ├── demoFragen.ts                — 8 Demo-Fragen (inkl. Zuordnung)
│   │   ├── demoPruefung.ts              — Demo-PruefungsConfig (45 Min, 4 Abschnitte)
│   │   └── demoMonitoring.ts            — Demo-Monitoring-Daten für LP-Dashboard
│   ├── hooks/
│   │   ├── useFocusTrap.ts             — Keyboard-Focus-Trap für Modals/Dialoge
│   │   ├── usePruefungsMonitoring.ts    — Zentraler Monitoring-Hook
│   │   ├── usePruefungsUX.ts           — beforeunload, Tastaturnavigation
│   │   └── useTabKonflikt.ts           — BroadcastChannel Tab-Erkennung
│   ├── services/
│   │   ├── autoSave.ts                  — IndexedDB Backup
│   │   ├── sebService.ts               — SEB User-Agent Erkennung
│   │   ├── retryQueue.ts              — IndexedDB Retry-Queue für fehlgeschlagene Saves
│   │   ├── authService.ts              — Google Identity Services Wrapper
│   │   └── apiService.ts               — Apps Script API Client (text/plain CORS-Fix)
│   ├── components/
│   │   ├── lp/
│   │   │   ├── LPStartseite.tsx         — LP-Startseite: Prüfungen verwalten + erstellen
│   │   │   ├── PruefungsComposer.tsx    — 3-Tab-Editor (Einstellungen, Abschnitte, Vorschau)
│   │   │   ├── FragenBrowser.tsx        — Slide-over: Fragenbank durchsuchen + filtern
│   │   │   ├── frageneditor/           — Aufgesplitteter FragenEditor (vorher 949 Zeilen)
│   │   │   │   ├── FragenEditor.tsx    — Hauptkomponente (~290 Z.)
│   │   │   │   ├── editorUtils.ts      — FrageTyp, generiereFrageId(), parseLuecken()
│   │   │   │   ├── EditorBausteine.tsx — Abschnitt + Feld UI-Wrapper
│   │   │   │   ├── MCEditor.tsx        — MC-Optionen-Editor
│   │   │   │   ├── FreitextEditor.tsx  — Freitext-Editor
│   │   │   │   ├── LueckentextEditor.tsx — Lückentext-Editor
│   │   │   │   ├── ZuordnungEditor.tsx — Zuordnung-Editor
│   │   │   │   ├── RichtigFalschEditor.tsx — Richtig/Falsch-Editor
│   │   │   │   └── BerechnungEditor.tsx — Berechnung-Editor
│   │   │   ├── MonitoringDashboard.tsx  — LP-Dashboard: Live-Übersicht aller SuS
│   │   │   └── SchuelerZeile.tsx        — Einzelne SuS-Zeile mit Detail-Panel
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
│   │       └── BerechnungFrage.tsx     — Numerische Eingabe + Rechenweg
│   └── utils/
│       ├── abschnitte.ts               — findeAbschnitt(), berechneAbschnittFortschritt()
│       ├── fachbereich.ts              — Shared: fachbereichFarbe(), typLabel(), bloomLabel()
│       ├── markdown.ts                  — Einfacher Markdown→HTML Renderer
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

## Nächste Schritte

### Sofort
1. SEB-Datei im SEB Config Tool erstellen (XML aus `seb/` importieren → URL anpassen → .seb exportieren)
2. Composer E2E testen (Prüfung erstellen → Fragen zuordnen → Speichern → mit `?id=` öffnen)
3. Tablet-/Smartphone-Tests

### Code-Review-Rückstand (erledigt 18.03.2026)
4. ~~**W4: Schülercode-Validierung**~~ ✅ — `validiereSchuelercode` in apiService + LoginScreen Backend-Check mit Fallback
5. ~~**W5: Focus-Trap für Modals**~~ ✅ — Custom `useFocusTrap` Hook (ohne Dependency), integriert in AbgabeDialog, PruefungsComposer, FragenBrowser, FragenEditor
6. ~~**W6: FragenEditor Split**~~ ✅ — 949→290 Zeilen, aufgeteilt in `frageneditor/` (8 Dateien: editorUtils, EditorBausteine, MC/Freitext/Lückentext/Zuordnung/RichtigFalsch/BerechnungEditor)

### Später
7. KI-Korrektur (Claude API für Freitext-Bewertung)
8. Textfeld-Höhe testen (auto-grow vs. begrenzter Bereich)

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
