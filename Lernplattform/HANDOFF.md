# Lernplattform — HANDOFF

## Aktueller Stand

**Branch:** `main`
**Phase:** Shared Fragenbank Migration + Erster Browser-Test (04.04.2026)
**Status:** TSC OK, 92 LP-Tests + 193 Pruefung-Tests grün, Build OK
**Apps Script:** Bereitgestellt (04.04.2026 abends)

### Architektur
- **Ein Format:** Kanonisch aus `@shared/types/fragen` (discriminated union)
- **Eine Fragenbank:** `FRAGENBANK_ID` = Prüfungstool-Sheet (Gym-Gruppen), eigenes Sheet (Familie)
- **Ein Editor:** SharedFragenEditor mit allen Features (KI, Anhänge, Sharing, Lernziele)
- **Kein Adapter:** Keine Konvertierung zwischen LP und Prüfungstool-Format
- **CSS:** Identisch mit Prüfungstool (input-field, slate-Farben, Kontrast)

### Letzte Commits (main)

| Commit | Beschreibung |
|--------|-------------|
| 708d4a6 | fix(LP): CSS identisch mit Prüfungstool |
| 140fd40 | fix(LP): Header NICHT lowercasen (camelCase) |
| 8f65199 | fix(LP): UI — Aufträge-Typo, Login Toggle + Hilfe |
| 22471a1 | feat(LP): EditorProvider mit allen Features |
| 9d87de3 | feat(LP): Backend liest aus gemeinsamer Fragenbank |
| d0d08d6 | refactor(LP): Shared Fragenbank-Format — 42 Dateien |

---

## Offene Bugs (Priorität 1 — nächste Session)

### A) Kritische Bugs (blockieren Nutzung)

| # | Bug | Details |
|---|-----|---------|
| 1 | **SuS sieht keine Gruppen** | wr.test@stud.gymhofwil.ch → "Keine Gruppen" obwohl in Test-Gruppe hinzugefügt. Zurück-Button funktioniert hier auch nicht. |
| 2 | **MC-Optionen zeigen UUID** | Im Editor werden bei MC-Optionen die IDs (z.B. "ecb...9bc3–4734–88ea–82aba1b2a3f5") angezeigt statt nur der Text. Gleich bei Lückentext korrekten Antworten. |
| 3 | **LP-Dashboard Startscreen leer** | Nach Gruppen-Auswahl als LP: leerer Screen. Erst nach Klick auf "Admin" kommt das Dashboard. |

### B) UI-Bugs (funktioniert aber sieht falsch aus)

| # | Bug | Details |
|---|-----|---------|
| 4 | **Freitextfelder zu schmal** | Fragetext, Musterlösung — nur wenige cm breit statt volle Editor-Breite |
| 5 | **Umlaute in Tabs/Labels** | "Faecher" → "Fächer", "pruefen" → "prüfen", weitere |
| 6 | **Fragenbank-Filter fehlen** | Prüfungstool hat Filter (Fach, Thema, Typ, Suche) — LP Fragenbank hat nur Fach-Filter |
| 7 | **Dashboard-Auswahlmenü** | Übungspools haben Unterthema, Schwierigkeit, Fragetyp als Buttons — LP hat nur Dropdowns. User wünscht Buttons wie in Pools. Suchfunktion fehlt. |
| 8 | **Übersicht-Tab leer** | Admin → Übersicht zeigt nichts (keine Mitglieder-Fortschritte) |

### C) Architektur/Konzept

| # | Thema | Details |
|---|-------|---------|
| 9 | **Übungspools-Lernziele weg?** | User meldet dass Lernziele in Übungspools verschwunden sind. NICHT in dieser Session angefasst — separat prüfen ob Deployment-Artefakt oder anderer Bug. |
| 10 | **Kopfzeile: Home, Hilfe, Lernziele** | LP soll gleiche Kopfzeile wie Übungspools haben (Home, Hilfe, Lernziele-Button) |
| 11 | **Backend KI/Upload/Lernziele** | Endpoints im EditorProvider vorbereitet, fehlen im Apps Script Backend |
| 12 | **speichereFrage → FRAGENBANK_ID** | Speichert noch ins alte Gruppen-Sheet, muss auf gemeinsame Fragenbank umgestellt werden |

---

## Was in dieser Session erledigt wurde

1. ✅ Phase 5b: AdminFragenbank + SharedFragenEditor (6 Tasks)
2. ✅ Tailwind v4 Fixes (Scroll, @source, CI)
3. ✅ **Shared Format Migration** — 42 Dateien, LP nutzt shared Frage-Typ, frageAdapter gelöscht
4. ✅ **Backend liest aus FRAGENBANK_ID** (gemeinsame Fragenbank)
5. ✅ EditorProvider mit allen Features
6. ✅ UI-Fixes (Aufträge-Typo, Login Toggle+Hilfe)
7. ✅ CSS identisch mit Prüfungstool (input-field, slate-Farben)

---

## Verifikation

```bash
cd Lernplattform && npx tsc -b && npx vitest run && npm run build
cd Pruefung && npx tsc -b && npx vitest run
```

---

## Nächste Session — Empfohlene Reihenfolge

1. Bug 2 fixen (MC-UUID-Anzeige) — wahrscheinlich Option.id statt Option.text im Editor
2. Bug 1 fixen (SuS-Gruppen) — Backend-Debug nötig
3. Bug 3 fixen (LP-Startscreen) — Navigation/Routing
4. Bug 4 fixen (Feldbreiten) — CSS
5. Bug 5 fixen (Umlaute) — Texte durchsuchen
6. Bug 6+7 (Filter + Auswahlmenü) — grösseres Feature, Übungspools-UI als Vorbild
