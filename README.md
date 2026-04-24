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

### ExamLab (ehemals Prüfungstool)

Digitale Prüfungs- und Übungsplattform mit drei Bereichen: **Prüfen** | **Üben** | **Fragensammlung**.

**[→ Live öffnen](https://durandbourjate.github.io/GYM-WR-DUY/ExamLab/)** · [Quellcode](./ExamLab/)

- React 19 + TypeScript + Vite + Zustand + Tailwind CSS v4 + Tiptap (PWA)
- **20 Fragetypen:** MC, Freitext, Lückentext, Zuordnung, R/F, Berechnung, 4× FiBu, Aufgabengruppe, Zeichnen, PDF-Annotation, Sortierung, Hotspot, Bildbeschriftung, Audio, Drag & Drop, Code, Formel (LaTeX)
- **Prüfen:** 4-Phasen-Workflow, Kurs-basierte Auswahl, Live-Monitoring, KI-Korrektur, Soft-Lockdown (4 Stufen), SEB-Integration, Multi-Prüfungs-Dashboard
- **Üben:** Formative Übungen ohne Punkte/Noten, SuS-Selbststudium mit Mastery-System (4 Stufen), Gruppenbasiert
- **Fragensammlung:** Zentrale Fragenverwaltung mit Fach/Thema/Unterthema-Filter, Pool-Sync (bidirektional, 27 Übungspools)
- **Favoriten & Direktlinks:** Account-verknüpfte Favoriten (Backend-Persistenz), Hash-basierte Direktlinks (#/pruefung/id), Dropdown mit Schnellzugriff
- KI-Assistent, Bewertungsraster mit Niveaustufen, Excel-Export, SuS-PDFs
- Light/Dark Mode (2-Stufen-Toggle: System ↔ manuell)
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
