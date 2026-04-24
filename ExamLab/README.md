# ExamLab — Gymnasium Hofwil

Digitale Prüfungs- und Übungsplattform für alle Fachschaften am Gymnasium Hofwil (Münchenbuchsee BE). Drei Bereiche: **Prüfen** (summative Prüfungen), **Üben** (formative Übungen + Selbststudium) und **Fragensammlung** (zentrale Fragenverwaltung) — vollständig im Browser.

## Features

**Für Schülerinnen und Schüler**
- 20 Fragetypen: Multiple Choice, Freitext (Rich Text), Lückentext, Zuordnung, Richtig/Falsch, Berechnung, Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER, Aufgabengruppe, PDF-Annotation, Zeichnen/Visualisierung, Sortierung, Hotspot, Bildbeschriftung, Audio-Aufnahme, Drag & Drop (Bild), Code-Editor, Formel (LaTeX)
- Automatisches Speichern (lokal + remote) — kein Datenverlust
- Timer mit Countdown oder Open-End (Stoppuhr), Fortschrittsanzeige pro Abschnitt
- Offline-fähig (PWA): Antworten werden bei Reconnect nachgesendet
- Light/Dark Mode
- Korrektur-Einsicht: MC-Optionen mit ✓/✗-Icons, R/F mit farbigen Kreisen, Punkte, Kommentare und Audio-Feedback
- Visuelles Leitsystem: Leere Felder violett umrahmt (Handlungsbedarf), ausgefüllte neutral, Auswahl-Entscheidungen mit grünem/rotem Kreis-Icon
- FiBu-Farbsystem: Konten-Kategoriefarben nach Lehrmittel (Aktiv=gelb, Passiv=rot, Aufwand=blau, Ertrag=grün)
- Audio/Video-Player mit Abspiel-Limit: LP kann festlegen, wie oft Materialien abgespielt werden dürfen
- Formel-Editor mit Live-Vorschau: Eingabe von LaTeX-Formeln mit sofortiger visueller Rückmeldung, Symbolleiste für häufige Zeichen
- Code-Editor mit Syntax-Highlighting: 7 Sprachen (Python, JavaScript, SQL, HTML, CSS, Java, TypeScript), Zeilennummern

**Für Lehrpersonen**
- Prüfungs-Composer: Prüfungen und Übungen erstellen und bearbeiten (Einstellungen, Abschnitte, Fragensammlung)
- 4-Phasen-Workflow: Vorbereitung → Lobby → Live-Monitoring → Ergebnisse/Korrektur
- Üben-Modus: Formative Übungen ohne Punkte/Noten, Kontrollstufe "Locker", Open-End
- SuS-Selbststudium: Gruppen, Mastery-System (4 Stufen), Dauerbaustellen-Konzept
- Kurs-basierte Teilnehmer-Auswahl (pro Gefäss, mit Dedup bei Mehrfach-Kursen)
- Prüfungs-Analyse: Taxonomie-Verteilung (K1-K6), Fragetypen-Mix, Zeitbedarf vs. Dauer, Themen-Abdeckung
- KI-Assistent: Fragetext, Musterlösung, MC-Optionen, Zuordnungspaare, R/F-Aussagen, Lücken, Berechnungsergebnisse, FiBu-Aufgaben und Bewertungsraster (mit Niveaustufen) generieren oder prüfen lassen
- KI-Korrektur: Kriterienbasierte Bewertung (pro Kriterium Punkte + Kurzkommentar) mit manueller Übersteuerung + individuelles Feedback per E-Mail
- Audio-Korrektur: Audio-Feedback pro Frage und gesamt
- Live-Monitoring: Fortschritt, Heartbeat, Inaktivitäts-Warnstufen, SEB-Status, Lockdown-Verstösse, Geräteerkennung, Entsperren-Button — alles in Echtzeit
- Fragensammlung: Fragen nach Fach, Thema, Unterthema, Typ, Bloom-Stufe, Pool-Status, Anhänge (📎) filtern
- Fragen-Statistiken: Lösungsquoten und Verwendungen pro Frage über alle Prüfungen (📊 Badges)
- Pool-Brücke: Bidirektionaler Sync mit Übungspools (Import + Rück-Sync via GitHub API)
- Open-End-Modus: Prüfung ohne Zeitlimit, LP beendet manuell (optional mit Restzeit)
- Prüfungstracker: Fehlende SuS, Nachprüfungen, Noten-Stand pro Kurs (MiSDV)
- Ergebnis-Export: Detaillierter CSV mit Antworten + Punkten (wie Google Forms) + individuelle SuS-PDFs
- In-App Hilfe: Anleitung, FAQ und Tipps direkt in der Plattform
- Zeitzuschläge (Nachteilsausgleich) pro SuS mit frei wählbarer Minutenzahl
- Auto-Korrektur: MC, R/F, Lückentext, Zuordnung, Berechnung, Sortierung, Hotspot, Bildbeschriftung, Drag & Drop (Bild), Formel (LaTeX) werden sofort automatisch bewertet
- Korrektur-Workflow: Auto-Geprüft bei LP-Aktion, Status-Tracking, Freigabe-Banner, Schutz vor Freigabe bei fehlenden Punkten
- Material-Panel: Split-Screen (55%) oder Overlay, unterstützt PDF, Video, Audio, Links, Rich-Text
- SEB-Integration: Auto-Config-Download, harte Durchsetzung, LP-Ausnahmen, SuS-Anleitung
- Zeichnen-Toolbar: 6 Werkzeuge (Stift, Linie, Pfeil, Rechteck, Ellipse, Text) mit Dropdown-Menüs (Stärke, Stil gestrichelt/durchgehend, Farben 3×3 Grid). Selektierte Elemente nachträglich bearbeitbar (Farbe, Grösse, Rotation).
- Soft-Lockdown (4 Stufen): SEB-unabhängige Sicherheit — Keine (für Übungen), Locker (Logging mit Verstoss-Zähler, ohne Sperre), Standard (Copy/Paste-Block, Vollbild, 3 Verstösse = Sperre), Streng (Sofort-Pause). Automatische iPad-Erkennung mit Downgrade.
- Multi-Prüfungs-Dashboard: Mehrere Prüfungen parallel in einem Tab überwachen (`?ids=a,b`). Live-Zusammenfassung + Einzelansicht.
- Wörterzähler: Min/Max-Wortlimit für Freitext-Fragen konfigurierbar, Warnung bei Unter-/Überschreitung
- Inline-Choice: Pro Lücke im Lückentext können Dropdown-Optionen definiert werden (SuS wählen statt tippen)
- Rechtschreibprüfung steuerbar: Browser-Spellcheck pro Prüfung aktivierbar/deaktivierbar
- Rich-Text-Panel: Materialien als formatierter Rich-Text direkt in der Plattform pflegen
- Medien-Einbettung: Bilder und Videos direkt in Fragetexte einbetten
- Audio-Aufnahme als Fragetyp: SuS nehmen Audio auf (Aussprache, mündliche Erklärung)
- LaTeX in Aufgaben: Formeln im Fragentext mit `$...$` (inline) und `$$...$$` (Block) — automatisches Rendering
- Code-Blöcke in Aufgaben: Syntax-Highlighting im Fragentext (7 Sprachen: Python, JavaScript, SQL, HTML, CSS, Java, TypeScript)
- Fragetypen-Menü kategorisiert: 6 Kategorien (Text & Sprache, Auswahl, Bilder & Medien, MINT, Buchhaltung, Struktur) + Suchfeld
- Bild-Upload: Für Hotspot, Bildbeschriftung und Drag & Drop (Bild) — Drag & Drop Upload oder URL, max 5 MB
- Aufgabengruppe mit Inline-Teilaufgaben: Teilaufgaben direkt im Editor erstellen (alle Fragetypen wählbar), mit eigenem Fragetext, Punkten, Musterlösung und Bewertungsraster
- Bewertungsraster mit Niveaustufen: 12 Standard-Vorlagen (5 fachübergreifend + 4 WR + 3 andere Fachschaften), Fachbereich-Filter, aufklappbare Niveaustufen pro Kriterium, Punkte-Skalierung, eigene Vorlagen speicherbar
- Erklärung-Sichtbarkeit: R/F + MC-Optionen mit Erklärungsfeld + Toggle ob SuS diese in der Korrektur-Einsicht sehen
- Sortierung mit Drag & Drop: Elemente per Drag & Drop oder Pfeil-Buttons sortieren
- PDF-Freihand selektierbar: Freihand-Zeichnungen in PDF-Annotation mit Auswahl-Tool verschieben und Farbe ändern

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
| Formeln | KaTeX (LaTeX) |
| Code | CodeMirror 6 |
| Tests | Vitest + @testing-library/react |
| Backend | Google Apps Script |
| Daten | Google Sheets + Drive |
| Auth | Google Identity Services (OAuth 2.0) |
| Deploy | GitHub Pages via GitHub Actions |

## Schnellstart

### Lokal entwickeln

```bash
cd ExamLab
npm install
npm run dev
```

Öffne `http://localhost:5174/GYM-WR-DUY/ExamLab/`

Ohne Backend-Konfiguration startet die App im **Demo-Modus** mit der Einrichtungsprüfung (alle 20 Fragetypen inkl. Zeichnen + PDF). Kontrollstufe ist auf "Keine" gesetzt (kein Lockdown).

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
| `/ExamLab/` | Login → Demo-Modus |
| `/ExamLab/?id=abc` | Login → Prüfung `abc` laden |
| LP ohne `?id=` | LP-Startseite (Prüfungen verwalten, Composer) |
| LP mit `?id=abc` | Live-Monitoring für Prüfung `abc` |
| LP mit `?ids=abc,def` | Multi-Dashboard: mehrere Prüfungen parallel überwachen |

## Verzeichnisstruktur

```
src/
├── components/
│   ├── lp/
│   │   ├── korrektur/         KorrekturDashboard + Sub-Komponenten (Noten, Analyse, Aktionen)
│   │   ├── durchfuehrung/     DurchfuehrenDashboard, AktivPhase, LobbyPhase, Monitoring
│   │   ├── vorbereitung/      VorbereitungPhase, PruefungsComposer, KursAuswahl + composer/
│   │   ├── fragenbank/        FragenBrowser, FragenImport, Pool-Sync + fragenbrowser/
│   │   ├── frageneditor/      Fragen-Editor mit allen Typen
│   │   └── ...                LPStartseite, LPHeader, HilfeSeite, TrackerSection
│   ├── fragetypen/            20 Typen: MC, Freitext, Lückentext, Zuordnung, R/F, Berechnung + 4 FiBu + Aufgabengruppe + PDF + Zeichnen + Sortierung + Hotspot + Bildbeschriftung + Audio + Drag&Drop + Code + LaTeX
│   └── ...                    Login, Layout, FrageRenderer, AbgabeBestaetigung, etc.
├── services/                  API, Auth, SEB, Auto-Save, Retry-Queue
├── store/                     Zustand Stores (Prüfung, Auth, Theme)
├── hooks/                     Monitoring, UX, Tab-Konflikt, Lockdown, LP-Nachrichten, EditableList
├── types/                     TypeScript Interfaces
├── data/                      Demo-Daten
└── utils/                     Hilfsfunktionen (fragenResolver, korrekturUtils, autoKorrektur)
seb/                           SEB-Konfiguration
```

## Safe Exam Browser (SEB) & Soft-Lockdown

**SEB (harte Sicherheit):**
- Erkennung via User-Agent (automatisch)
- SEB-Konfigurationsvorlage in `seb/GymHofwil_Pruefung_Konfig.xml`
- Anleitung: [`seb/README.md`](seb/README.md)
- Wenn `sebErforderlich: true` gesetzt, wird ohne SEB der Start blockiert

**Soft-Lockdown (4 Stufen, SEB-unabhängig):**

| Stufe | Beschreibung |
|-------|-------------|
| Keine | Keine Einschränkungen (für Übungen und Einrichtungstests) |
| Locker | Logging mit Verstoss-Zähler (sichtbar im Monitoring), keine Sperre |
| Standard | Copy/Paste-Block, Vollbild, Rechtsklick/DevTools gesperrt, 3 Verstösse = Sperre |
| Streng | Sofort-Pause bei Vollbild-Verlust, SEB empfohlen |

- Automatische Geräteerkennung: iPads werden auf Standard heruntergestuft (kein Vollbild möglich)
- LP sieht Verstösse, Gerät und Kontrollstufe live im Monitoring
- Bei Sperre: LP kann SuS über Entsperren-Button freischalten
- Kontrollstufe wird in der Vorbereitung gewählt (Segmented Control)

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [`HANDOFF.md`](HANDOFF.md) | Aktueller Entwicklungsstand, Architektur, offene Tasks |
| [`Google_Workspace_Setup.md`](Google_Workspace_Setup.md) | Backend-Einrichtung Schritt für Schritt |
| [`seb/README.md`](seb/README.md) | SEB-Konfiguration |

## Lizenz

Internes Projekt des Gymnasiums Hofwil. Nicht zur Weiterverbreitung bestimmt.
