# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

---

## Offene Punkte

Keine offenen Punkte.

---

## Letzte Sessions

### 24.03.2026 (Session 2) — Backup-Export als Excel (v1.1, PT-1)

Neuer "Backup exportieren"-Button in BeendetPhase + KorrekturDashboard. Generiert `.xlsx` mit:
- **Tab "Übersicht":** Name, E-Mail, Klasse, Total, Max, Note, dann pro Frage: Punkte + Kommentar
- **Tab pro SuS:** Frage, Typ, Antwort, Punkte, Max, Kommentar
- Effektive Bewertung: `lpPunkte ?? kiPunkte`, `lpKommentar ?? kiFeedback`

**Neue Dateien:** `src/utils/backupExport.ts`, `src/version.ts`
**Neue Dependency:** `xlsx` (SheetJS, lazy-loaded)
**Geänderte Dateien:** BeendetPhase.tsx (Props erweitert + Button), DurchfuehrenDashboard.tsx (fragen/abgaben durchreichen), KorrekturDashboard.tsx (Button), LPHeader.tsx (Versionsticker)

**Spec:** `docs/superpowers/specs/2026-03-24-backup-export-design.md`

### 24.03.2026 — PDF-Annotation (Neuer Fragetyp)

Neuer Fragetyp `pdf` mit PDF.js-Rendering, 4 Annotationswerkzeugen (Highlighter, Kommentar, Freihand, Label), LP-Kategorien, globalem Undo/Redo und KI-Korrektur.

**Neue Dateien:** `src/components/fragetypen/pdf/` (8 Dateien: PDFTypes, usePDFRenderer, usePDFAnnotations, PDFToolbar, PDFSeite, PDFKommentarPopover, PDFKategorieChooser, PDFViewer) + PDFFrage.tsx, PDFEditor.tsx, PDFKorrektur.tsx

**Wichtig:**
- Apps Script Code manuell kopieren + neue Bereitstellung!
- Neue Dependency: `pdfjs-dist` (~500KB, lazy-loaded)
- Max. 2 PDF-Fragen pro Prüfung (IndexedDB-Quota-Schutz)
- Google Drive Upload: Aktuell nur Base64-Fallback, Drive-Upload als TODO

### 23.03.2026 — Zeichnen-Fragetyp

Neuer Fragetyp `visualisierung` (Untertyp `zeichnen`) mit HTML5 Canvas, 7 Werkzeugen, Hintergrundbild, LP-Editor und KI-Korrektur. Keine neuen Dependencies.

**Neue Dateien:** `src/components/fragetypen/zeichnen/` (5 Dateien) + ZeichnenFrage.tsx, ZeichnenEditor.tsx, ZeichnenKorrektur.tsx

### 23.03.2026 (Session 2) — Bugfixes + Features

- **Bug B1:** Lobby-Button — try/catch + Loading-State in VorbereitungPhase.tsx
- **Bug B2:** Side-Panel abgeschnitten — `top-[53px]` statt `inset-y-0`
- **F2:** SuS einzeln an-/abwählen + Suchfeld in TeilnehmerListe
- **F3:** Optionales Bemerkungsfeld im BeendenDialog
- **F4:** LP-Kommentare pro SuS in SusDetailPanel

### 24.03.2026 — Tool-Synergien + Variablen-Harmonisierung

4 zentrale Google Sheets + Apps Script als Gateway. Alle 3 Tools lesen über dieselbe API.
- **S1:** Zentrale Kurs-Verwaltung (4 neue GET-Endpoints)
- **S2:** Prüfung ↔ Planer Bridge (Badges, Noten-Stand)
- **S3:** Pool-Statistiken im Composer (Lösungsquote, Trennschärfe)
- **S4a:** Zentrale Lernziel-DB
- KLASSENLISTEN_ID entfernt, kursId-Format vereinfacht, geschlecht-Feld ergänzt

### 23.03.2026 (Nacht) — Kontrast, Korrektur-Freigabe, Trennschärfe

- Light Mode Kontrast (CSS-Variable-Override für WCAG AA/AAA)
- 2-stufige Korrektur-Freigabe (Einsicht + PDF separat)
- Punkt-biseriale Korrelation als Trennschärfe (pro Frage + über Durchführungen)

### 22–23.03.2026 — Farbkonzept, FiBu-UX, Demo-Fixes

- 3-Schichten-Farbmodell (Neutral/Funktional/Fachbereich)
- FiBu-Konten-Highlighting (KONTO_KATEGORIEN Map, ~40 Konten)
- Demo-Modus Session-Persistenz
- Teilfragen-Status (erst grün wenn alle Teile beantwortet)

---

## Feature-Übersicht (alle erledigt)

| # | Feature | Datum |
|---|---------|-------|
| 1–7 | Basis (Auth, Fragen, Abgabe, Timer, Monitoring, AutoSave) | 17.03. |
| 8–14 | Warteraum, CSV-Export, Statistiken, Zeitzuschläge, Dark Mode, Login | 18.03. |
| 15–17 | Erweitertes Monitoring, Fragen-Dashboard, LP↔SuS Chat | 18.03. |
| 18–31 | UI/UX, Dateianhänge, KI-Assistent, SuS-Vorschau, Organisation | 19.03. |
| 32+ | FiBu-Fragetypen (5 Typen), Aufgabengruppen, Pool-Sync, RückSync | 20–21.03. |
| 33+ | Farbkonzept, Trennschärfe, Korrektur-Freigabe, Tool-Synergien | 22–24.03. |
| 34+ | Zeichnen-Fragetyp, PDF-Annotation | 23–24.03. |
| 35 | Backup-Export als Excel (Übersicht + SuS-Tabs) | 24.03. |

---

## Environment-Variablen

| Variable | Beschreibung | Wo setzen |
|----------|-------------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client-ID | `.env.local` / GitHub Secrets |
| `VITE_APPS_SCRIPT_URL` | Apps Script Web-App URL | `.env.local` / GitHub Secrets |

Ohne diese Variablen: **Demo-Modus** (Schülercode + Demo-Prüfung).

## Google Workspace Setup

Alle 7 Teile erledigt (OAuth, Sheets, Apps Script, GitHub Actions, E2E, Fragenbank, KI-Korrektur). Details: `Google_Workspace_Setup.md`

---

## Verzeichnisstruktur

```
Pruefung/
├── src/
│   ├── App.tsx                    — Auth-Gate + Rollen-Routing
│   ├── types/                     — fragen, pool, pruefung, antworten, auth, korrektur, monitoring
│   ├── store/                     — pruefungStore, authStore, themeStore
│   ├── data/                      — Demo-Daten + kontenrahmen-kmu.json
│   ├── hooks/                     — Audio, Focus, Monitoring, UX, Tab, Resize, Filter
│   ├── services/
│   │   ├── apiClient.ts           — Shared HTTP-Schicht
│   │   ├── apiService.ts          — Barrel-Re-Export
│   │   ├── api/                   — 8 Domain-Module (pruefung, fragenbank, korrektur, pool, etc.)
│   │   ├── synergyApi.ts          — Tool-Synergien API-Client
│   │   ├── poolSync.ts            — Pool-Synchronisation
│   │   ├── autoSave.ts            — IndexedDB Backup
│   │   └── retryQueue.ts          — Retry-Queue
│   ├── components/
│   │   ├── lp/                    — LP-Ansicht (Startseite, Composer, Fragenbank, Editor, Korrektur, Durchführung)
│   │   │   ├── frageneditor/      — 15+ Editor-Komponenten (MC, Freitext, FiBu, etc.)
│   │   │   ├── composer/          — Abschnitte, Vorschau, Analyse
│   │   │   └── fragenbrowser/     — Header, Zeilen, Karten, Badges
│   │   ├── sus/                   — SuS-Ansicht (KorrekturListe, KorrekturEinsicht)
│   │   ├── fragetypen/            — 13 Fragetyp-Komponenten (MC, Freitext, FiBu×5, Zeichnen, PDF, etc.)
│   │   │   ├── zeichnen/          — Canvas-Engine, Pointer-Events, Toolbar
│   │   │   └── pdf/               — PDF.js-Viewer, Annotations, Toolbar
│   │   └── shared/                — KontenSelect, Audio, Media, Timer, etc.
│   └── utils/                     — Pool-Converter, Korrektur, Export, Kontenrahmen, Validierung, etc.
├── seb/                           — SEB-Konfiguration
├── Google_Workspace_Setup.md
├── Pruefungsplattform_Spec_v2.md
└── HANDOFF.md
```

*Detaillierte Session-Logs früherer Versionen: siehe Git-History.*
