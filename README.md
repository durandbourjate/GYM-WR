# GYM-WR-DUY

Digitale Werkzeuge für den Wirtschaft-und-Recht-Unterricht am Gymnasium Hofwil (Kanton Bern).

## Projekte

### Unterrichtsplaner (v3.104)

Webbasierter Semesterplaner für Lektionen, Sequenzen und Prüfungen.

**[→ Live öffnen](https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/)** · [Quellcode](./Unterrichtsplaner/)

- React 19 + TypeScript + Vite + Zustand (PWA)
- 2 Zoom-Stufen: Jahresübersicht (Grid) und Wochendetail (Inline-Editing)
- Multi-Planer mit Tabs, Settings pro Instanz
- Sequenzen mit Blöcken und Reihen, Batch-Bearbeitung, Drag & Drop
- Materialsammlung mit Archiv-Hierarchie
- Ferien/Sonderwochen-Automatik, Schuljahr-Presets (JSON-basiert)
- Noten-Vorgaben-Tracking (MiSDV Art. 4)
- SOL-Tracking mit Summen-Badge
- Notizen-Spalte (aufklappbar, resizable)
- Stufenlose Zoom-Funktion (Texte, Icons, Badges skalieren proportional)
- Google Calendar Integration (OAuth, bidirektionaler Sync)
- LearningView-Farbschema (VWL orange, BWL blau, Recht grün)

### Prüfungsplattform (v1.1)

Digitale Prüfungsplattform für summative und formative Prüfungen.

**[→ Live öffnen](https://durandbourjate.github.io/GYM-WR-DUY/Pruefung/)** · [Quellcode](./Pruefung/)

- React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap (PWA)
- **13 Fragetypen:** Multiple Choice, Freitext, Lückentext, Zuordnung, Richtig/Falsch, Berechnung, Buchungssatz, T-Konto, Kontenbestimmung, Bilanz/ER, Aufgabengruppe, Zeichnen, PDF-Annotation
- **4-Phasen-Workflow:** Vorbereitung → Lobby → Aktiv → Beendet
- Kurs-basierte Teilnehmer-Auswahl (pro Gefäss/Kurs)
- Prüfungs-Composer mit Analyse-Tab (Taxonomie, Zeitbedarf, KI-Analyse)
- KI-Assistent: Fragen generieren/verbessern, Musterlösung, KI-Korrektur
- Fragenbank mit Pool-Sync (bidirektional, 27 Übungspools)
- Live-Monitoring mit Inaktivitäts-Warnung + LP-Beenden
- Open-End- und Countdown-Modus + individuelle Zeitzuschläge
- SEB-Integration (Safe Exam Browser)
- Backup-Export als Excel (.xlsx) mit Übersicht + Tab pro SuS
- Light/Dark Mode, Audio/Video-Anhänge, SuS-Korrektur-Einsicht
- Backend: Google Apps Script + Google Sheets + Google Drive

### Übungspools (27 Pools)

Interaktive Fragesammlungen für Selbststudium und LearningView-Integration.

**[→ Übersicht öffnen](https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/)** · [Quellcode](./Uebungen/Uebungspools/)

Modulare Architektur: `pool.html` (Template) + `config/*.js` (Inhalte).

| Fach | Pools | Themen |
|------|-------|--------|
| VWL | 11 | Bedürfnisse, Menschenbild, Markteffizienz, BIP, Konjunktur, Wachstum, Geld, Arbeitslosigkeit, Sozialpolitik, Steuern, Staatsverschuldung |
| Recht | 10 | Einführung, Einleitungsartikel, Grundrechte, Personenrecht, Sachenrecht, OR AT, Arbeitsrecht, Mietrecht, Strafrecht, Prozessrecht |
| BWL | 5 | Einführung, Unternehmensmodell, Strategie/Führung, Marketing, Fibu |
| Informatik | 1 | Kryptographie |

Unterstützt Multiple-Choice, Lückentext, Zuordnung, Kurzfälle. xAPI-kompatibel für LearningView-Iframe-Modus.

## Hosting

Alle Projekte werden via **GitHub Pages** direkt aus dem `main`-Branch deployed.

## Kontext

- **Schule:** Gymnasium Hofwil, Münchenbuchsee
- **Fach:** Wirtschaft und Recht (EWR, SF, EF)
- **Lehrplan:** Kantonaler Lehrplan 17 (Kanton Bern)
- **Plattform:** LearningView-Integration (Weblinks + iFrame/xAPI)
