# CLAUDE.md — GYM-WR-DUY

Digitale Werkzeuge für den W&R-Unterricht am Gymnasium Hofwil (Münchenbuchsee BE).
Lehrer: DUY. Fächer: Wirtschaft & Recht (SF, EWR, EF), Informatik. Klassenlehrer 27a.

## Repo-Struktur

```
Unterrichtsplaner/   → React/TS/Vite PWA (Semesterplaner)
ExamLab/            → React/TS/Vite PWA (ExamLab: Prüfen + Üben + Fragensammlung)
Uebungen/            → Übungspools (pool.html + config/*.js) + Informatik-Material
Projektdateien/      → Claude-Projektanweisungen (nicht deployed)
```

## Konventionen

- **Sprache:** Schweizer Hochdeutsch. Schweizer Institutionen/Beispiele (SNB, SECO, BFS, CHF).
- **Farbcode:** VWL = orange (#f97316), BWL = blau (#3b82f6), Recht = grün (#22c55e), IN = grau (#6b7280)
- **Lehrplan:** Kantonaler Lehrplan 17, Kanton Bern. Taxonomie K1–K6 (Bloom).

## Git & Deploy

```bash
git add -A && git commit -m "vX.XX: Beschreibung" && git push
```

- Deploy via GitHub Actions: Push to `main` → Build Unterrichtsplaner + ExamLab → Combine mit Uebungen → GitHub Pages
- **Deployed:** Unterrichtsplaner/dist + ExamLab (aus ExamLab/dist) + Uebungen + index.html
- **Nicht deployed:** Projektdateien/, CLAUDE.md, Dev-Docs

## Klassenbezeichnungen

- Zahl = Maturjahrgang (27 = Matura 2027), Buchstabe = Klasse (a–d Regel, f/s = TaF)
- Kursbezeichnungen im Stundenplan: `WR!` = SF, `WR` = EWR, `WR!!` = EF
- TaF = 5-jähriges Gymnasium mit Phasenmodell (4 Phasen/Jahr, nicht durchgehend)

## Entwicklungsprozess

Drei Schichten, automatisch geladen:
1. **Superpowers-Skills** — Generischer Prozess (Brainstorming → Plan → TDD → Verify)
2. **`.claude/rules/`** — Projektspezifische Regeln (Regression Prevention, Security, Design, Qualität)
3. **Memory** — Gelerntes aus vergangenen Sessions (Feedback, Projektkontext)

Bei Features: Brainstorming → Plan → Umsetzung → Qualitäts-Checkliste → Browser-Test → Merge-Gate
Bei Bugfixes: Systematic Debugging → Fix → Qualitäts-Checkliste → Browser-Test → Merge-Gate
Bei Fehlern: Lernschleife → Rule-File ergänzen

## Referenzen

- Schulkontext (Stundenplan, IW, Lehrplan): @.claude/rules/schulkontext.md
- Unterrichtsplaner-Entwicklung: Unterrichtsplaner/CLAUDE.md + HANDOFF.md
- Übungspools-Entwicklung: Uebungen/Uebungspools/CLAUDE.md
- ExamLab-Entwicklung: ExamLab/HANDOFF.md + Pruefungsplattform_Spec_v2.md
