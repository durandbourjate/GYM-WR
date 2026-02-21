# CHANGELOG: Neuer Pool «Strafrecht – Grundlagen, Strafbarkeit und Strafzumessung»

**Datum:** 2026-02-21
**Typ:** Neuer Pool
**Fachbereich:** Recht
**Stufe:** SF GYM3–GYM4

## Zusammenfassung

Neuer Übungspool zum Strafrecht mit 96 Fragen in 10 Topics. Basiert auf dem LearningView-Export (Strafrecht_2026_02_20.docx), dem Theorieskript und ergänzenden Materialien (Massnahmen, Strafvollzugsformen, Mehrere TäterInnen, NZZ-Artikel «Carlos»).

## Verteilungstabelle (Topics × Schwierigkeit)

| Topic | Label | diff 1 | diff 2 | diff 3 | Total |
|-------|-------|--------|--------|--------|-------|
| zweck | Zweck & Grundsätze | 3 | 4 | 3 | 10 |
| strafarten | Strafarten & Deliktsarten | 4 | 4 | 3 | 11 |
| vollzug | Strafvollzug | 3 | 5 | 3 | 11 |
| massnahmen | Massnahmen & Verwahrung | 3 | 3 | 2 | 8 |
| tatbestand | Tatbestandsmässigkeit | 3 | 4 | 2 | 9 |
| verfahren | Verfahrensaspekte | 3 | 3 | 3 | 9 |
| rechtfertigung | Rechtfertigung & Schuld | 4 | 4 | 3 | 11 |
| taeter | Mehrere Tatbeteiligte | 3 | 3 | 2 | 8 |
| strafzumessung | Strafzumessung | 3 | 4 | 2 | 9 |
| jugend | Jugendstrafrecht & SVG | 4 | 4 | 2 | 10 |
| **Total** | | **33** | **38** | **25** | **96** |

## Fragetypen-Statistik

| Typ | Anzahl | Anteil |
|-----|--------|--------|
| mc (Multiple Choice) | 53 | 55% |
| tf (Richtig/Falsch) | 24 | 25% |
| fill (Lückentext) | 11 | 11% |
| multi (Mehrfachauswahl) | 8 | 8% |
| **Total** | **96** | **100%** |

## Bilder (SVG)

| Datei | Frage | Beschreibung |
|-------|-------|-------------|
| `strafrecht_deliktsarten_01.svg` | s03 | Drei Deliktsarten nach Schweregrad |
| `strafrecht_sanktionen_01.svg` | m01 | Strafrechtliche Sanktionen: Strafen vs. Massnahmen |
| `strafrecht_pruefschema_01.svg` | t01 | Dreistufiges Prüfschema der Strafbarkeit |
| `strafrecht_beteiligungsformen_01.svg` | a01 | Beteiligungsformen bei mehreren Tatbeteiligten |

## Dateien und Zielordner

| Datei | Zielordner im Repo |
|-------|-------------------|
| `recht_strafrecht.js` | `Uebungen/Uebungspools/config/` |
| `strafrecht_deliktsarten_01.svg` | `Uebungen/Uebungspools/img/recht/strafrecht/` |
| `strafrecht_sanktionen_01.svg` | `Uebungen/Uebungspools/img/recht/strafrecht/` |
| `strafrecht_pruefschema_01.svg` | `Uebungen/Uebungspools/img/recht/strafrecht/` |
| `strafrecht_beteiligungsformen_01.svg` | `Uebungen/Uebungspools/img/recht/strafrecht/` |
| `index.html` (aktualisiert) | `Uebungen/Uebungspools/` |

## Neuer Eintrag für index.html (POOLS-Array)

```javascript
{
  id: "recht_strafrecht",
  fach: "Recht",
  title: "Strafrecht – Grundlagen, Strafbarkeit und Strafzumessung",
  meta: "SF GYM3–GYM4",
  questions: 96,
  topics: 10
}
```

## Commit-Message

```
Neuer Pool: Strafrecht – Grundlagen, Strafbarkeit und Strafzumessung (96 Fragen, 10 Topics, 4 SVGs)
```

## Live-URL (nach Push)

```
https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/pool.html?pool=recht_strafrecht
```

## Deep-Links (Topic-Keys)

```
pool.html?pool=recht_strafrecht&topic=zweck
pool.html?pool=recht_strafrecht&topic=strafarten
pool.html?pool=recht_strafrecht&topic=vollzug
pool.html?pool=recht_strafrecht&topic=massnahmen
pool.html?pool=recht_strafrecht&topic=tatbestand
pool.html?pool=recht_strafrecht&topic=verfahren
pool.html?pool=recht_strafrecht&topic=rechtfertigung
pool.html?pool=recht_strafrecht&topic=taeter
pool.html?pool=recht_strafrecht&topic=strafzumessung
pool.html?pool=recht_strafrecht&topic=jugend
```
