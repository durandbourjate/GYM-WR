# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

## Aktueller Stand

**Phase 2a: Google OAuth + Auth-Flow** (17.03.2026)

### Was funktioniert
- Startbildschirm mit Prüfungsinfo + Sitzungswiederherstellung
- 3 Fragetypen: MC (Einzel-/Mehrfachauswahl), Freitext (Tiptap), Lückentext
- Fragennavigation mit Kacheln (✓ beantwortet, ? unsicher, — offen)
- Timer mit Countdown + Warnungen (15 Min. orange, 5 Min. rot)
- Auto-Save: LocalStorage (sofort) + IndexedDB (15s) + Remote-Mock
- Light/Dark Mode: System-Erkennung + manueller Toggle
- Abgabe-Dialog mit Bestätigung + Statusübersicht
- 7 Demo-Fragen (3 MC, 3 Freitext, 1 Lückentext)
- GitHub Actions Deploy
- **NEU: Login-Screen** (Google OAuth + Schülercode-Fallback + Demo-Modus)
- **NEU: Auth-Store** (Session via sessionStorage, Rollen-Erkennung aus E-Mail-Domain)
- **NEU: API-Service** (Interface für Google Apps Script Backend)
- **NEU: URL-basierte Prüfungs-ID** (`?id=PRUEFUNGS_ID` → lädt Config vom Backend)
- **NEU: User-Info** in Sidebar und Abgabe-Bestätigung

### Auth-Flow
1. Kein User → LoginScreen (Google-Button / Schülercode / Demo)
2. Google Login → JWT dekodiert → E-Mail-Domain bestimmt Rolle (SuS/LP)
3. Session in sessionStorage (überlebt Reload, nicht Tab-Schliessung)
4. Wenn `VITE_APPS_SCRIPT_URL` gesetzt + `?id=...` in URL → Prüfung vom Backend laden
5. Sonst → Demo-Prüfung (wie bisher)

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
│   ├── App.tsx                          — Auth-Gate + Routing + URL-Param (?id=)
│   ├── index.css                        — Tailwind + Tiptap-Styles + Dark-Mode-Kontrast
│   ├── main.tsx
│   ├── types/
│   │   ├── fragen.ts                    — FrageBase, MCFrage, FreitextFrage, LueckentextFrage, etc.
│   │   ├── pruefung.ts                  — PruefungsConfig, PruefungsAbschnitt
│   │   ├── antworten.ts                 — PruefungsAbgabe, Antwort-Union-Typ
│   │   └── auth.ts                      — AuthUser, Rolle (NEU)
│   ├── store/
│   │   ├── pruefungStore.ts             — Zustand-Store (Antworten, Navigation, Phase)
│   │   ├── authStore.ts                 — Auth-State: User, Demo, Login/Logout (NEU)
│   │   └── themeStore.ts                — Light/Dark/System Mode mit Persist
│   ├── data/
│   │   ├── demoFragen.ts                — 7 Demo-Fragen
│   │   └── demoPruefung.ts              — Demo-PruefungsConfig (45 Min, 3 Abschnitte)
│   ├── services/
│   │   ├── autoSave.ts                  — IndexedDB Backup
│   │   ├── remoteSave.ts                — Mock für Remote-Save (Phase 1)
│   │   ├── authService.ts              — Google Identity Services Wrapper (NEU)
│   │   └── apiService.ts               — Apps Script API Client (NEU)
│   ├── components/
│   │   ├── LoginScreen.tsx              — Google OAuth + Schülercode + Demo (NEU)
│   │   ├── Layout.tsx                   — Header + Sidebar (mit User-Info) + Main
│   │   ├── Startbildschirm.tsx          — Prüfungsinfo + Start-Button
│   │   ├── FragenNavigation.tsx         — Kacheln mit Icons + Legende + fachbereichFarbe()
│   │   ├── FragenUebersicht.tsx         — Alle Fragen mit Status
│   │   ├── Timer.tsx                    — Countdown mit Warnstufen
│   │   ├── VerbindungsStatus.tsx        — Online/Offline-Indikator
│   │   ├── AutoSaveIndikator.tsx        — "Gespeichert ✓" Fade-Animation
│   │   ├── AbgabeDialog.tsx             — Bestätigungsdialog mit Icons
│   │   ├── ThemeToggle.tsx              — ☀/🌙 Button
│   │   └── fragetypen/
│   │       ├── MCFrage.tsx              — MC mit neutraler Selektion
│   │       ├── FreitextFrage.tsx        — Tiptap + Heading + ArrowReplace + Auto-Focus
│   │       └── LueckentextFrage.tsx     — Inline-Inputs
│   └── utils/
│       ├── markdown.ts                  — Einfacher Markdown→HTML Renderer
│       └── zeit.ts                      — Timer-Hilfsfunktionen
├── .env.example                         — Template für Environment-Variablen (NEU)
├── Google_Workspace_Setup.md            — Anleitung: OAuth + Sheets + Apps Script (NEU)
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

## Nächste Schritte (Phase 2b)

Der User muss zuerst die **Google_Workspace_Setup.md** abarbeiten:
1. Google Cloud Projekt + OAuth Client-ID erstellen
2. Google Sheets anlegen (Fragenbank, Klassenlisten, Configs)
3. Apps Script deployen
4. `.env.local` mit Client-ID + Apps Script URL befüllen
5. GitHub Actions Secrets setzen

Danach in der App:
1. Remote-Save aktivieren (apiService statt remoteSave-Mock im Auto-Save-Zyklus)
2. Heartbeat-Monitoring (alle 10s an Apps Script)
3. SEB-Erkennung (User-Agent-Check)
4. GitHub Actions Workflow anpassen (Env-Variablen im Build)

## Commits

| Commit | Beschreibung |
|--------|-------------|
| `de498e7` | Phase 1: Projekt-Setup, MC+Freitext+Lückentext, Auto-Save, Demo-Modus (35 Dateien) |
| `70624b5` | UI-Überarbeitung: Kontrast, neutrales Farbschema, Header-Buttons, Freitext-Features (14 Dateien) |
| *pending* | Phase 2a: Google OAuth Login, Auth-Store, API-Service, LoginScreen, URL-Param (10 Dateien) |
