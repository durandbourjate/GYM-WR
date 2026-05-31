# Spec: Excel-Raster-Import in den Unterrichtsplaner einbinden

**Datum:** 2026-05-30
**Status:** Design (zur Umsetzung freigegeben)
**Branch:** `feature/excel-import-einbinden`

## Problem

`Unterrichtsplaner/src/components/ExcelImport.tsx` (386 Z.) ist ein vollständiger,
funktionierender Modal-Wizard zum Import eines Excel-Rasters (Kurse × Wochen mit
Lektionstiteln) in die Planer-Wochendaten. Er ist aber **toter Code**: nirgends
importiert oder gemountet (`grep -rn "ExcelImport" src` matcht nur die Datei selbst).
Das Feature geht damit ungenutzt verloren.

Zusätzlich besteht eine **latente Korrektheits-Falle**: Der Wizard liest seine
Kurs-/Wochen-Listen aus den **statischen, hardcodierten** `COURSES` (`data/courses.ts`,
Cols 2–35) und `WEEKS` (`data/weeks.ts`). Die Live-Anzeige des Planers nutzt jedoch
**dynamische, pro-Instanz** Kurse (`usePlannerData()` → `plannerSettings.courses` →
`configToCourses`, wobei selbst-definierte Kurse Cols **100+** erhalten). Beide
indexieren `weekData[w].lessons` per `col`. Für einen Planer mit eigenen Kursen würde
der Import deshalb in Cols 2–35 schreiben, während die Anzeige Cols 100+ liest →
**„Import erfolgreich, aber nichts erscheint"** (genau die Klasse Bug, vor der
`code-quality.md` § „as any versteckt Daten-Mapping-Bugs" und § „Dynamischer
Object-Key" warnen). Nur ein Legacy-Planer (Fallback auf `COURSES`) funktioniert
zufällig.

## Ziel / Nicht-Ziel

**Ziel:** Das vorhandene Feature generisch lauffähig machen — für **jeden** Planer
korrekt, nicht nur Legacy. Minimaler, klar abgegrenzter Eingriff (YAGNI).

**Nicht-Ziel (bewusst zurückgestellt):**
- **Evento-Import** (Kurse/Schülerlisten aus dem Schulsystem, JSON/CSV, app-übergreifend
  ExamLab+Planer): anderes Feature, anderer Quelltyp, Format noch unbekannt → eigener
  Brainstorm→Spec→Plan-Zyklus, sobald das Exportformat vorliegt. Siehe Memory
  `project-evento-import`.
- **Modal-Theming:** Der Wizard nutzt hardcodierte Dark-Slate-Farben (`bg-slate-800`
  etc.) statt der CSS-Theme-Variablen → im Light-Mode optisch fremd, aber funktional
  und lesbar. Feinschliff später.
- **Fremdformat-Heuristiken** (Evento/andere Exporte): das flexible manuelle
  Spalten/Zeilen-Mapping deckt beliebige Raster ab; die Auto-Erkennung ist nur
  Vorbelegung.

## Ansatz (gewählt: B)

**B — mounten + an dynamische Daten anschliessen.** Button + Modal in der bestehenden
SettingsPanel-Sektion mounten UND die statischen Quellen im Wizard durch
`usePlannerData()` ersetzen.

Verworfen — **A (nur mounten):** minimaler Diff, aber funktioniert nur für
Legacy-Planer; bei eigenen Kursen schreibt der Import ins Leere (still kaputt).
Widerspricht „generisch lauffähig". Zudem: die geplante Evento-Richtung speist Kurse
künftig noch stärker dynamisch in `plannerSettings.courses` → der Importer muss
ohnehin aus der dynamischen Quelle lesen. B ist zukunftskonsistent.

## Architektur

### Mount-Punkt

`SettingsPanel.tsx`, Sektion **„💾 Daten & Sammlung"** (existiert bereits, enthält
Export/Import für *Konfiguration* und *Planerdaten* per JSON). Dort eine neue Unterzeile
**„Stundenplan-Raster (Excel)"** mit Button **„📊 Excel importieren"**.

- Lokaler State `const [showExcelImport, setShowExcelImport] = useState(false)`.
- Button setzt `true`; Render `{showExcelImport && <ExcelImport onClose={() => setShowExcelImport(false)} />}`.
- Der Modal bringt sein eigenes Overlay (`fixed inset-0 …`) mit → keine weitere
  Layout-Verdrahtung. `pushUndo()` / `setWeekData` / `updateLessonDetail` sind im
  Wizard bereits enthalten.

### Korrektheits-Fix im Wizard (Kern der Aufgabe)

`ExcelImport.tsx` bezieht Kurse/Wochen statt aus `COURSES`/`WEEKS` aus
`usePlannerData()`. Betroffen sind **vier** Stellen:

1. **Auto-Mapping Spalten** (`autoMapColumns`, ~Z. 99): Schleife `for (const c of COURSES)`
   → über die dynamischen `courses`.
2. **Spalten-Dropdown** (~Z. 249–251): `{COURSES.map(...)}` → `{courses.map(...)}`.
3. **Vorschau-Label** (~Z. 330): `COURSES.find(c => c.col === p.col)` → `courses.find(...)`.
4. **`WEEK_ORDER`** (Modul-Top, ~Z. 14 `WEEKS.map(w => w.w)`): für Zeilen-Dropdown
   (~Z. 276) und Validierung (~Z. 130) → aus den dynamischen `weeks` ableiten (innerhalb
   der Komponente via `useMemo`, da `usePlannerData` ein Hook ist).

`configToCourses` liefert `Course`-Objekte mit denselben Feldern (`col`, `cls`, `day`,
`typ`, `les`), die der Wizard nutzt → die JSX-Templates (`{c.cls} {c.day} {c.typ}
({c.les}L)`) bleiben unverändert.

### Verhalten bei leerer Kursliste

Neuer Planer ohne konfigurierte Kurse → `courses = []` → Spalten-Dropdown leer.
Erwartet und korrekt (man kann nicht in nicht-existente Kurse importieren). Im
Upload-Schritt ein kleiner Hinweis, falls `courses.length === 0`: „Erst Kurse in den
Einstellungen anlegen, dann importieren." (rein additiv, blockiert nichts).

**Analog für Wochen (Review-Ergänzung):** Nach Umstellung von `WEEK_ORDER` auf die
dynamischen `weeks` (`usePlannerData()` leitet sie pro Instanz via `generateWeekIds`
aus `activeMeta` ab — nur der konfigurierte KW-Bereich) werden Zeilen mit einer KW
**ausserhalb** dieses Bereichs von `autoMapRows` still auf `null` gesetzt (= übersprungen).
Das ist die gewünschte Semantik (gleiche Begründung wie leere Kurse), aber eine
Verhaltensänderung gegenüber dem heutigen statischen Voll-Kalender-`WEEK_ORDER`. Falls
`mappedRows === 0`, denselben Hinweis-Mechanismus nutzen. **Invariante:** Zeilen-Validierung
(`usePlannerData().weeks[].w`) und Schreib-Ziel (`weekData` via `weekMap.get(item.weekW)`)
teilen denselben KW-Schlüsselraum, da beide aus derselben aktiven Instanz stammen → eine
KW, die validiert, ist im `weekData` auflösbar.

## Datenfluss

```
Datei-Upload (.xlsx/.xls)
  → import('xlsx') (lazy, bereits so — kein Bundle-Impact aufs Haupt-Bundle)
  → XLSX.read → sheet_to_json (Grid string[][])
  → autoMapColumns / autoMapRows  [gegen DYNAMISCHE courses/weeks]
  → manuelles Mapping (Dropdowns)  [DYNAMISCHE Optionen]
  → generatePreview (liest weekData für isNew-Status)
  → executeImport: pushUndo() → setWeekData(neu) + updateLessonDetail(blockType)
  → Done (Undo-Hinweis Ctrl+Z)
```

Keine Änderung am Schreib-Pfad (war schon korrekt `col`-basiert).

## Fehlerbehandlung

Bestehend im Wizard belassen/prüfen: `XLSX.read` in `reader.onload` — defensiver
try/catch ergänzen, falls nicht vorhanden (korrupte/Nicht-Excel-Datei → Toast statt
Silent-Fail; vgl. `code-quality.md` § Error-Handling, `safety-pwa.md`). Kein `alert()`
(CI-Gate `lint:no-alert`). Import ist über `pushUndo()` reversibel.

## Sicherheit / Datenschutz

- Reiner Client-Import lokaler Dateien (kein Netzwerk, kein Backend). xlsx läuft lazy
  im Worker-freien Main-Thread wie bisher.
- xlsx-High-CVE-Angriffsfläche unverändert (Feature war als Code schon da; mounten
  ändert die Dependency nicht). Ablösung von xlsx ist Migrations-gekoppelt (separat).
- Kein localStorage-Persist sensibler Daten, keine LP/SuS-Rollenfrage (Planer ist
  reines LP-Werkzeug).

## Tests

**Unit (vitest + jsdom, Planer hat das Setup):**
- `detectLessonType`: Stichproben pro Branch (Ferien→6, Prüfung→4, Event→5, IN→3,
  BWL→1, Recht/VWL→2, Default→0).
- Auto-Mapping mit **dynamischen** Kursen: ein Mock-`courses`-Set mit Cols 100+ →
  Header-Matching ordnet korrekt der dynamischen `col` zu (Regression gegen die
  ursprüngliche statische Annahme).
  - **Extraktionsziel (Review-Präzisierung):** Die `autoMapColumns`/`autoMapRows`-Closures
    sind NICHT rein (rufen `setColMappings`/`setRowMappings`, lesen Komponenten-State). Die
    extrahierbaren, regressions-relevanten **reinen** Kerne sind (a) das **Header→col-Matching**
    (nimmt `header: string` + `courses: Course[]`, gibt `col | null`) und (b) das **KW-Parsing**
    (nimmt `firstCell: string` + erlaubte Wochen, gibt `weekW | null`). Diese beiden in
    `utils/` ziehen und direkt testen.
  - **Abgrenzung was der Unit-Test beweist:** Er deckt den **Mapping**-Pfad ab (Header→dynamische
    `col`). Der eigentliche Bug „schreibt in Cols 2–35, Anzeige liest 100+" manifestiert sich
    im **Schreib**-Pfad (`executeImport` → `week.lessons[item.col]`), den der Unit-Test nicht
    ausführt. Der End-to-End-Schreibbeweis ist der **Browser-Test mit eigenen Kursen** (unten).

**Browser-Verifikation (Pflicht vor Merge):**
- Echte Test-xlsx (Kurse×Wochen-Raster) hochladen → Auto-Map prüfen → manuell
  korrigieren → Vorschau → importieren → Raster zeigt die Titel an den richtigen
  Kurs/KW-Zellen → Undo (Ctrl+Z) macht rückgängig.
- Einmal mit einem Planer mit **eigenen Kursen** (Cols 100+) — der eigentliche
  Regressions-Beweis, dass B den „schreibt ins Leere"-Bug behebt.
- Light/Dark beide kurz sichten (Theming ist zurückgestellt, aber darf nicht
  unbrauchbar sein).

## Betroffene Dateien

- `Unterrichtsplaner/src/components/SettingsPanel.tsx` — Button + State + Modal-Mount
  (additiv in bestehender Sektion).
- `Unterrichtsplaner/src/components/ExcelImport.tsx` — 4 Stellen statisch→dynamisch;
  optional try/catch + Leer-Hinweis.
- `Unterrichtsplaner/src/components/ExcelImport.test.tsx` (neu) — Unit-Tests.

## Risiken

- **Gering.** Additiver Mount; der einzige Verhaltens-Eingriff ist Quelle-statisch→
  dynamisch, beweisbar über den Browser-Test mit eigenen Kursen.
- `usePlannerData()` ist ein Hook → der Wizard muss ihn auf Top-Level aufrufen (tut er
  als Function-Component bereits; nur Felder ergänzen). Keine Hook-Reihenfolge-Falle,
  da kein Early-Return vor den Hooks (vgl. `code-quality.md` § Hooks-vor-Early-Return).
