# GYM-WR-DUY

Digitale Werkzeuge für den Wirtschaft-und-Recht-Unterricht am Gymnasium Hofwil (Kanton Bern).

## Projekte

### Unterrichtsplaner (v3.70)

Semesterplaner für Lektionen, Sequenzen und Prüfungen.

**[→ Live öffnen](https://durandbourjate.github.io/GYM-WR-DUY/Unterrichtsplaner/)** · [Quellcode](./Unterrichtsplaner/)

- React + TypeScript + Vite + Zustand (PWA)
- Multi-Planer mit Tabs, Settings pro Instanz
- Sequenzen, Batch-Bearbeitung, Drag & Drop
- Materialsammlung mit Archiv-Hierarchie
- Ferien/Sonderwochen-Automatik, Schuljahr-Presets
- Noten-Vorgaben-Tracking (MiSDV Art. 4)
- Google Calendar Integration (OAuth, bidirektionaler Sync)
- LearningView-Farbschema (VWL orange, BWL blau, Recht grün)

### Übungspools (27 Pools)

Interaktive Fragesammlungen für Selbststudium und LearningView-Integration.

**[→ Übersicht öffnen](https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/)** · [Quellcode](./Uebungen/Uebungspools/)

Modulare Architektur: `pool.html` (Template) + `config/*.js` (Inhalte).

| Fach | Pools | Themen |
|------|-------|--------|
| VWL | 11 | Bedürfnisse, Menschenbild, BIP, Wachstum, Konjunktur, Arbeitslosigkeit, Geld, Steuern, Sozialpolitik, Staatsverschuldung, Markteffizienz |
| Recht | 10 | Einführung, Einleitungsartikel, Grundrechte, Personenrecht, OR AT, Sachenrecht, Mietrecht, Arbeitsrecht, Strafrecht, Prozessrecht |
| BWL | 5 | Einführung, Unternehmensmodell, Strategie & Führung, Marketing, Finanzbuchhaltung |
| Informatik | 1 | Kryptographie |

Unterstützt Multiple-Choice, Lückentext, Zuordnung, Kurzfälle. xAPI-kompatibel für LearningView-Iframe-Modus.

## Hosting

Alle Projekte werden via **GitHub Pages** direkt aus dem `main`-Branch deployed.

## Kontext

- **Schule:** Gymnasium Hofwil, Münchenbuchsee
- **Fach:** Wirtschaft und Recht (EWR, SF, EF)
- **Lehrplan:** Kantonaler Lehrplan 17 (Kanton Bern)
- **Plattform:** LearningView-Integration (Weblinks + iFrame/xAPI)
