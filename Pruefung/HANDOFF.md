# HANDOFF.md — Prüfungsplattform

> Digitale Prüfungsplattform für Wirtschaft & Recht am Gymnasium Hofwil.
> Stack: React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap
> Spec: `Pruefung/Pruefungsplattform_Spec_v2.md`

## Aktueller Stand

**Phase 1 abgeschlossen + UI-Überarbeitung** (16.03.2026)

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
│   ├── App.tsx                          — Routing nach Phase (start/pruefung/uebersicht/abgegeben)
│   ├── index.css                        — Tailwind + Tiptap-Styles + Dark-Mode-Kontrast
│   ├── main.tsx
│   ├── types/
│   │   ├── fragen.ts                    — FrageBase, MCFrage, FreitextFrage, LueckentextFrage, etc.
│   │   ├── pruefung.ts                  — PruefungsConfig, PruefungsAbschnitt
│   │   └── antworten.ts                 — PruefungsAbgabe, Antwort-Union-Typ
│   ├── store/
│   │   ├── pruefungStore.ts             — Zustand-Store (Antworten, Navigation, Phase)
│   │   └── themeStore.ts                — Light/Dark/System Mode mit Persist
│   ├── data/
│   │   ├── demoFragen.ts                — 7 Demo-Fragen
│   │   └── demoPruefung.ts              — Demo-PruefungsConfig (45 Min, 3 Abschnitte)
│   ├── services/
│   │   ├── autoSave.ts                  — IndexedDB Backup
│   │   └── remoteSave.ts                — Mock für Phase 2 (Google Sheets)
│   ├── components/
│   │   ├── Layout.tsx                   — Header (mit allen Buttons) + Sidebar + Main
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
├── Pruefungsplattform_Spec_v2.md        — Gesamtspezifikation
├── Auftrag_Pruefungsplattform_Phase1.md — Phase-1-Auftrag (erledigt)
└── HANDOFF.md                           — Dieses Dokument
```

## Nächste Schritte (Phase 2)

Gemäss Spec v2, Abschnitt 12:
1. Google Sheets Struktur anlegen (Fragenbank, Klassenliste, Antworten)
2. Google Apps Script: Authentifizierung + Fragen laden + Antworten speichern
3. React-App: Google OAuth Login + Rollenunterscheidung (SuS/LP)
4. Remote-Save aktivieren (remoteSave.ts → echtes Apps Script)
5. SEB-Konfiguration + User-Agent-Check
6. Heartbeat-Monitoring

## Commits

| Commit | Beschreibung |
|--------|-------------|
| `de498e7` | Phase 1: Projekt-Setup, MC+Freitext+Lückentext, Auto-Save, Demo-Modus (35 Dateien) |
| `70624b5` | UI-Überarbeitung: Kontrast, neutrales Farbschema, Header-Buttons, Freitext-Features (14 Dateien) |
