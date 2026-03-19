# Prüfungsplattform — Gymnasium Hofwil

Digitale Prüfungsplattform für den Wirtschaft-&-Recht-Unterricht am Gymnasium Hofwil (Münchenbuchsee BE). Ermöglicht das Erstellen, Durchführen und Auswerten von Prüfungen — vollständig im Browser.

## Features

**Für Schülerinnen und Schüler**
- 6 Fragetypen: Multiple Choice, Freitext (Rich Text), Lückentext, Zuordnung, Richtig/Falsch, Berechnung
- Automatisches Speichern (lokal + remote) — kein Datenverlust
- Timer mit Countdown, Fortschrittsanzeige pro Abschnitt
- Offline-fähig (PWA): Antworten werden bei Reconnect nachgesendet
- Light/Dark Mode

**Für Lehrpersonen**
- Prüfungs-Composer: Prüfungen erstellen und bearbeiten (Einstellungen, Abschnitte, Fragenbank)
- Prüfungs-Analyse: Taxonomie-Verteilung (K1-K6), Fragetypen-Mix, Zeitbedarf vs. Dauer, Themen-Abdeckung
- KI-Assistent: Fragetext, Musterlösung, MC-Optionen, Zuordnungspaare, R/F-Aussagen, Lücken und Berechnungsergebnisse generieren oder prüfen lassen
- KI-Korrektur: Automatische Bewertung mit manueller Übersteuerung + individuelles Feedback per E-Mail
- Live-Monitoring: Fortschritt, Heartbeat, SEB-Status aller SuS in Echtzeit
- Fragenbank: Fragen nach Fachbereich, Typ, Bloom-Stufe filtern
- In-App Hilfe: Anleitung, FAQ und Tipps direkt in der Plattform
- Zeitzuschläge (Nachteilsausgleich) pro SuS konfigurierbar
- SEB-Integration: Safe Exam Browser Konfiguration mitgeliefert

**Backend**
- Google Sheets als Datenbank (Fragenbank, Klassenlisten, Configs, Antworten)
- Google Apps Script als API (kein eigener Server nötig)
- Google OAuth für Schul-Login (@gymhofwil.ch / @stud.gymhofwil.ch)
- Schülercode-Login als Fallback (Name + Code + E-Mail)

## Tech Stack

| | |
|-|-|
| Frontend | React 19, TypeScript, Vite |
| State | Zustand (mit Persist) |
| Styling | Tailwind CSS v4 |
| Rich Text | Tiptap |
| Backend | Google Apps Script |
| Daten | Google Sheets + Drive |
| Auth | Google Identity Services (OAuth 2.0) |
| Deploy | GitHub Pages via GitHub Actions |

## Schnellstart

### Lokal entwickeln

```bash
cd Pruefung
npm install
npm run dev
```

Öffne `http://localhost:5174/GYM-WR-DUY/Pruefung/`

Ohne Backend-Konfiguration startet die App im **Demo-Modus** mit 10 Beispielfragen.

### Mit Backend (Google Workspace)

1. `.env.local` erstellen:
   ```
   VITE_GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   ```

2. Vollständige Anleitung: [`Google_Workspace_Setup.md`](Google_Workspace_Setup.md)

### Produktion (GitHub Pages)

Push auf `main` löst GitHub Actions aus → Build → Deploy auf GitHub Pages.

Environment-Variablen werden über GitHub Secrets gesetzt:
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_APPS_SCRIPT_URL`

## Prüfungsablauf

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  LP erstellt │     │  SuS öffnen  │     │  LP sieht    │
│  Prüfung im  │────▶│  Prüfungs-URL│────▶│  Monitoring  │
│  Composer    │     │  + Login     │     │  Dashboard   │
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │ Startbild-  │
                    │ schirm      │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Prüfung     │  Auto-Save alle 30s
                    │ bearbeiten  │──────────────────────▶ Google Sheets
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Abgabe +    │
                    │ Zusammen-   │──────────────────────▶ Antworten-Sheet
                    │ fassung     │
                    └─────────────┘
```

### URL-Schema

| URL | Ansicht |
|-----|---------|
| `/Pruefung/` | Login → Demo-Modus |
| `/Pruefung/?id=abc` | Login → Prüfung `abc` laden |
| LP ohne `?id=` | LP-Startseite (Prüfungen verwalten, Composer) |
| LP mit `?id=abc` | Live-Monitoring für Prüfung `abc` |

## Verzeichnisstruktur

```
src/
├── components/
│   ├── lp/                    LP-Komponenten (Composer, Monitoring)
│   ├── fragetypen/            MC, Freitext, Lückentext, Zuordnung, Richtig/Falsch, Berechnung
│   └── ...                    Login, Layout, Timer, Abgabe, etc.
├── services/                  API, Auth, SEB, Auto-Save, Retry-Queue
├── store/                     Zustand Stores (Prüfung, Auth, Theme)
├── hooks/                     Monitoring, UX, Tab-Konflikt
├── types/                     TypeScript Interfaces
├── data/                      Demo-Daten
└── utils/                     Hilfsfunktionen
seb/                           SEB-Konfiguration
```

## Safe Exam Browser (SEB)

Die Plattform unterstützt den Safe Exam Browser:
- Erkennung via User-Agent (automatisch)
- SEB-Konfigurationsvorlage in `seb/GymHofwil_Pruefung_Konfig.xml`
- Anleitung: [`seb/README.md`](seb/README.md)

Wenn `sebErforderlich: true` in der Prüfungs-Config gesetzt ist, wird ohne SEB eine Warnung angezeigt und der Start blockiert.

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [`HANDOFF.md`](HANDOFF.md) | Aktueller Entwicklungsstand, Architektur, offene Tasks |
| [`Google_Workspace_Setup.md`](Google_Workspace_Setup.md) | Backend-Einrichtung Schritt für Schritt |
| [`Pruefungsplattform_Spec_v2.md`](Pruefungsplattform_Spec_v2.md) | Gesamtspezifikation |
| [`seb/README.md`](seb/README.md) | SEB-Konfiguration |

## Lizenz

Internes Projekt des Gymnasiums Hofwil. Nicht zur Weiterverbreitung bestimmt.
