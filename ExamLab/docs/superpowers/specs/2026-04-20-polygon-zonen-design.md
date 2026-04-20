# Polygon-Zonen für Bild-Fragetypen — Design-Spec

**Datum:** 2026-04-20
**Scope:** ExamLab (Frontend + Apps-Script-Backend + Pool-Dateien)
**Fragetypen:** Hotspot, DragDrop-Bild
**Status:** Design — wartet auf Plan

---

## Motivation

Aktuell können LP bei Hotspot-Fragen Bereiche nur als Rechteck oder Kreis definieren. Das reicht für viele Fälle nicht: unregelmässige Objekte (Länder auf Karten, Diagramm-Segmente, Bildteile ohne rechteckige Grenzen) brauchen eine präzisere Form-Definition. DragDrop-Bild-Zielzonen sind aktuell ausschliesslich rechteckig — dasselbe Problem.

Ziel: LP kann Zonen frei als Polygon (≥3 Punkte) oder weiterhin als Rechteck definieren. Intern werden alle Zonen als Polygon gespeichert, was den Korrektur-Code über Frontend, Backend und LP-Ansicht deutlich vereinfacht (ein Algorithmus statt formabhängiger Verzweigungen an 6 Stellen).

Gleichzeitig: saubere Umstellung ohne Alt-Feld-Support im Code (kein Dual-Read, keine Kreis-Logik mehr). Bestehende Daten werden in einem Fenster migriert; danach gibt es nur noch das neue Format.

## Scope

**Im Scope:**
- Hotspot-Fragen (`HotspotFrage.bereiche`)
- DragDrop-Bild-Fragen (`DragDropBildFrage.zielzonen`)
- Apps-Script-Backend (Read/Write/Korrektur/Migration)
- Pool-Dateien im Git-Repo (`Uebungen/**/pool-*.js`)

**Nicht im Scope:**
- Bildbeschriftung (bleibt Punkt-basiert; LP-Drag zum Platzieren von Punkten existiert bereits seit S125)
- Zeichnen-Frage (Canvas-basiert, keine Zonen)
- PDF-Annotation (andere Fragearchitektur)

## Datenmodell

### Einheitlicher Zonentyp

```ts
// types/fragen.ts
export interface HotspotBereich {
  id: string
  form: 'rechteck' | 'polygon'          // nur Editor-UX, Korrektur ignoriert
  punkte: { x: number; y: number }[]    // Prozent 0-100, ≥3 Punkte (Rechteck = 4)
  label: string
  punkte_wert: number                   // früher „punkte"; umbenannt um Kollision zu vermeiden
}

export interface DragDropBildZielzone {
  id: string
  form: 'rechteck' | 'polygon'
  punkte: { x: number; y: number }[]
  korrektesLabel: string
}
```

**Wichtig:**
- Alt-Felder (`koordinaten.{x,y,breite,hoehe,radius}`) werden komplett aus dem Typ entfernt
- `form: 'kreis'` existiert nicht mehr
- Feldname `punkte` (Array) in `HotspotBereich` würde mit dem Feld `punkte` (number) kollidieren — deshalb wird letzteres zu `punkte_wert` umbenannt (Konsequenz: Editor-UI-Label „Punkte", Backend-Key, Frontend-Render alle mit anpassen)

### Migrations-Mapping

Einmalige Konversion bestehender Daten — grob, da LP im Anschluss alle Zonen ohnehin manuell durchgeht:

| Alt | Neu |
|-----|-----|
| `form: 'rechteck', koordinaten: {x, y, breite, hoehe}` | `form: 'rechteck', punkte: [(x,y), (x+b,y), (x+b,y+h), (x,y+h)]` |
| `form: 'kreis', koordinaten: {x, y, radius}` | `form: 'polygon', punkte: 12 Punkte auf Kreis, 30° Winkelabstand, erster bei (x+r, y)` |
| DragDrop-Zielzone `{x, y, breite, hoehe}` | `form: 'rechteck', punkte: 4 Ecken (wie oben)` |

Alt-Feld `koordinaten` wird bei der Migration aus `typDaten` entfernt (Backend) bzw. aus Pool-Objekten gelöscht (Git-Repo).

## Editor-UX

### Toolbar über Bild (neu)

```
[□ Rechteck]  [⬡ Polygon]                    Bereiche: 3
```

- Zwei Modus-Buttons, Rechteck aktiv per Default
- Anzeige der Anzahl Bereiche rechts

### Rechteck-Modus

- 1. Klick auf Bild = erste Ecke (violetter Punkt sichtbar als Vorschau)
- 2. Klick = zweite Ecke → Rechteck wird angelegt als 4-Punkt-Polygon mit `form: 'rechteck'`
- Bestehendes Rechteck:
  - 4 Ecken-Handles (kleine violette Quadrate)
  - Drag an Ecke: dieser Punkt wandert mit der Maus, die beiden angrenzenden Punkte bewegen sich mit (axis-aligned Constraint bleibt erhalten)
  - Drag auf Fläche: ganzes Rechteck verschieben, alle 4 Punkte +Δ
- ESC bricht das aktuelle Zeichnen ab

### Polygon-Modus

- Jeder Klick auf Bild = neuer Punkt
- Während Zeichnen sichtbar: bisherige Punkte + dashed Vorschau-Linie zur Maus
- **Abschluss**: Doppelklick auf Bild ODER Klick auf ersten Punkt (erster Punkt wird beim Cursor-Nahen vergrössert — klar klickbar)
- **Abbruch**: ESC oder Wechsel des Modus → nicht-fertige Punkte verworfen
- Mindestens 3 Punkte, sonst wird Polygon verworfen
- Bestehendes Polygon:
  - Jeder Punkt = kreisförmiger Handle, Drag verschiebt den einzelnen Punkt
  - Drag auf Fläche (zwischen Punkten) = gesamtes Polygon verschieben, alle Punkte +Δ
  - Doppelklick auf Punkt = Punkt löschen (nur wenn aktueller Polygon-Umfang ≥4 Punkte)
  - Hover auf Kante = Plus-Icon erscheint mittig, Klick fügt neuen Punkt zwischen den beiden Kanten-Endpunkten ein

### Visuelle States

| State | Darstellung |
|-------|-------------|
| Ruhe | Umriss violett 2px, Füllung `rgba(139,92,246,0.2)` |
| Hover | Füllung intensiver `rgba(139,92,246,0.35)` |
| Selected (zuletzt geklickt) | Handles sichtbar, Label-Nummer hervorgehoben |
| Andere Zonen während aktivem Zeichnen | Gedimmt `rgba(139,92,246,0.05)` |

### Bereichs-Liste unter Bild

Pro Zeile:
- Nummer
- Label-Input (Text)
- Punkte-Wert-Input (number, nur Hotspot)
- Delete-Button (×)

**Keine** x/y/breite/höhe/radius-Inputs mehr (bisher vorhanden, werden komplett entfernt).

### Geltungsbereich

Dieses UX gilt gleichermassen für `HotspotEditor` und `DragDropBildEditor`. Unterschied nur:
- Hotspot: Punkte-Wert-Input
- DragDrop: Label-zu-Zone-Zuordnung (statt Punkte-Wert)

## Korrektur-Logik

### Ein Algorithmus: Point-in-Polygon (Ray-Casting)

```ts
// utils/ueben/polygon.ts (neu)
export function istPunktInPolygon(p: {x: number, y: number}, polygon: {x: number, y: number}[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    const intersect = ((yi > p.y) !== (yj > p.y))
      && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}
```

Apps-Script-Port derselben Funktion als `istPunktInPolygon_` in `apps-script-code.js`.

### Hotspot-Korrektur

```
für jeden SuS-Klickpunkt:
  für jeden bereich in frage.bereiche (nur punkte_wert > 0):
    wenn istPunktInPolygon(klick, bereich.punkte):
      wenn !mehrfachauswahl UND bereits Treffer: stop
      punkte += bereich.punkte_wert
      break (ein Klick zählt maximal einen Bereich)
  wenn kein Treffer UND Klick in Distraktor-Zone (punkte_wert === 0):
    fehler += 1
```

Pool-Konvention bleibt wie S125: Distraktoren haben `punkte_wert === 0`, treffen darf man sie nicht.

### DragDrop-Bild-Korrektur

```
für jedes SuS-Drop (label, position):
  für jede zielzone:
    wenn istPunktInPolygon(position, zielzone.punkte):
      wenn label === zielzone.korrektesLabel:
        punkte += 1
      // sonst: kein Punkt, aber auch kein Fehler (falsche Zone = keine Punkte)
      break
  // wenn keine Zone trifft: Label verworfen, keine Punkte
```

### Betroffene Code-Stellen

Alle werden auf `istPunktInPolygon` reduziert, `form === 'kreis'` / `Math.hypot` / `form === 'rechteck'` verschwinden komplett:

- `src/utils/ueben/korrektur.ts` (SuS-Frontend-Korrektur)
- `src/utils/autoKorrektur.ts` (LP-Auto-Korrektur in Korrektur-Ansicht)
- `apps-script-code.js` (Server-Korrektur-Endpoint `lernplattformPruefeAntwort`)
- `src/components/lp/korrektur/KorrekturFrageVollansicht.tsx` (LP-Ansicht Treffer/Miss-Visualisierung)

### Backend-Bereinigung für SuS

`bereinigeFrageFuerSuSUeben_` in `apps-script-code.js`: Hotspot-Lösungsfelder werden weiterhin entfernt (SuS darf Zonen-Position nicht sehen). Die Feldnamen im Sperrlisten-Konstanten-Block werden angepasst (`koordinaten` → `punkte`, `form` bleibt weil harmlos).

## Rendering

### SuS-Ansicht

- **Keine** sichtbaren Zonen-Umrisse (Security — SuS darf Lösung nicht kennen)
- SuS klickt auf Bild (Hotspot) oder droppt Label (DragDrop) an eine Position
- Treffer-Evaluation via `istPunktInPolygon` geschieht erst bei „Antwort prüfen"
- **Keine visuelle Änderung** gegenüber heute

### Editor-Ansicht

- SVG-Overlay über Bild (`<svg>` absolut positioniert, `viewBox="0 0 100 100"`, 100%×100%)
- Jede Zone als `<polygon points="x1,y1 x2,y2 ...">`
  - Fill `rgba(139,92,246,0.2)`, Stroke `#8b5cf6` 2px (CSS-Klasse)
- Handles als `<circle r="1.5" fill="#8b5cf6" stroke="white">` pro Punkt — **nur bei selected Zone** sichtbar
- Label-Nummer als `<text>` am Polygon-Schwerpunkt (arithmetisches Mittel der Punkte)
- Grund für SVG statt CSS-Divs: Polygon-Clipping in HTML-Divs ist aufwändig (clip-path oder Transform-Tricks); SVG ist der saubere Weg und skaliert responsive mit dem Bild

### LP-Korrektur-Ansicht

- SVG-Overlay wie Editor, aber read-only (keine Handles, keine Drag-Interaktion)
- Korrekte Zonen grün-transparent, Distraktoren rot-transparent
- SuS-Klickpunkte als Kreuz/Kreis mit ✓/✗-Indikator
- Ersetzt bisherige kreis-/rechteck-spezifische Rendering-Pfade in `KorrekturFrageVollansicht.tsx` (Code-Reduktion)

### Performance

Typische Frage: 4–12 Zonen × 4–15 Punkte. Rendering-Last vernachlässigbar. Point-in-Polygon läuft nur bei Antwort-Check, nicht im Render-Pfad.

## Migration

### Datenquellen

1. **Google-Sheets-Fragenbank** (Apps-Script-Backend): 4 Tabs (VWL/BWL/Recht/Informatik) — Hotspot + DragDrop-Bild
2. **Pool-Dateien im Git-Repo**: `Uebungen/**/pool-*.js`
3. **LP-eigene Prüfungen**: weitere Sheet-Tabs pro LP (via Apps-Script mit erfasst)

### Strategie: „Saubere Rakete" — kein Frontend-Dual-Read

Bewusste Abkehr vom Dual-Read-Pattern (wie in MediaQuelle S125 verwendet). Grund: dort folgt Phase 6 als Aufräum-Session; hier soll sie entfallen. Trade-off: mehr Sorgfalt in der Migrations-Choreographie, Null Altlast danach.

### Deploy-Choreographie (striktly in dieser Reihenfolge, ein Fenster abends)

```
Schritt 1 — Apps-Script erweiterten Stand deployen
  ├─ Neuer Migrator-Endpoint `admin:migriereZonen` (Dry-Run-Default)
  ├─ Backend-Read liefert noch Alt-Format (Frontend ist noch alt)
  └─ Korrektur-Pfade kennen weiterhin Alt-Format (Brücken-Stand)

Schritt 2 — Backup aller Fragenbank-Sheets
  └─ Drive → „Kopie erstellen" mit Suffix `-backup-YYYY-MM-DD`
  └─ Verifiziere 4 Tabs in Backup-Datei

Schritt 3 — Dry-Run gegen BWL (kleinstes Hotspot-Volumen)
  └─ POST { action: 'admin:migriereZonen', dryRun: true, sheetName: 'BWL' }
  └─ Summary: erste 20 Einträge reviewen — Polygon-Punkte plausibel?
  └─ Spot-Check: 2 konkrete Fragen im neuen Format inspizieren

Schritt 4 — Live-Migration Schritt-für-Schritt
  └─ BWL (live) → Frontend-Spot-Check im Browser via Staging → OK?
  └─ Recht (live) → Spot-Check → OK?
  └─ VWL (live) → Spot-Check → OK?
  └─ Informatik (live) → Spot-Check → OK?
  └─ Idempotenz: zweiter Run auf BWL = 0 neue Updates

Schritt 5 — Pool-Dateien im Git migrieren
  └─ Node-Script `scripts/migriere-zonen-in-pools.mjs`
  └─ Liest alle `Uebungen/**/pool-*.js`, ersetzt Alt-Format in-place
  └─ Git-Diff reviewen (Stichproben pro Pool-Datei)
  └─ Committen

Schritt 6 — Apps-Script Read-Pfad + Korrektur auf Neu-Format
  └─ Zweiter Apps-Script-Deploy
  └─ parseFrage liefert nur noch punkte[] + form, keine Alt-Felder
  └─ Korrektur-Endpoint ruft istPunktInPolygon_

Schritt 7 — Frontend auf Staging deployen, E2E-Test
  └─ Feature-Branch → preview → GitHub-Actions deployed nach /staging/
  └─ Echte LP + SuS-Logins, siehe Test-Plan unten
  └─ Bei Erfolg: Merge main, Push

Schritt 8 — Feinkorrektur durch LP (eigene Sessions danach)
  └─ LP geht migrierte Hotspot-Fragen einzeln durch
  └─ Ehemalige Kreise (12-Punkt-Polygon) → wahrscheinlich auf freie Polygon-Form anpassen
  └─ Nicht-optimale Rechtecke ebenfalls
```

### Migrator-Endpoint (Apps-Script)

```
action: 'admin:migriereZonen'
params: {
  callerEmail: string,
  dryRun?: boolean (default true),
  sheetName?: string (default alle Sheets)
}
response: {
  success: boolean,
  dryRun: boolean,
  tabs: [{ name, rows, aktualisiert, uebersprungen, fehler }],
  summary: [{ sheet, frageId, typ, alt, neu }]  // erste 50 Einträge
}
```

- Iteriere alle Hotspot- und DragDrop-Bild-Fragen
- Pro Frage: Alt-Felder lesen, `punkte[]` berechnen, `form` setzen, Alt-Feld `koordinaten` aus `typDaten` entfernen, speichern
- **Idempotent**: wenn `punkte[]` bereits vorhanden und wohlgeformt (`Array.isArray(p) && p.length >= 3`), Frage überspringen → keine doppelte Migration bei wiederholten Runs

### Pool-Migrations-Script

`scripts/migriere-zonen-in-pools.mjs` (Node, ES-Module):
- Globbt `Uebungen/**/pool-*.js`
- Parst mit `Function`-Constructor-Pattern (lokal sicher, wie `tmp/repair-hotspots.mjs` aus S125)
- Konvertiert Hotspot-Bereiche + DragDrop-Zielzonen
- Schreibt in-place zurück, formatiert mit `prettier` wenn möglich
- Loggt Pro-Datei-Statistik

### Frontend-Error-Boundary (Auffangnetz für Migrations-Tag)

In `HotspotFrage.tsx`, `DragDropBildFrage.tsx` + entsprechende Editoren:

```ts
const ungueltig = frage.bereiche.some(b => !Array.isArray(b.punkte) || b.punkte.length < 3)
if (ungueltig) {
  return <Fehler-Banner title="Frage konnte nicht geladen werden">
    Bitte LP informieren — diese Frage wurde nicht korrekt migriert.
  </Fehler-Banner>
}
```

Nur an der Render-Stelle, kein Normalizer im Code-Körper. Dient ausschliesslich dem Migrations-Fenster.

### Rollback-Plan

1. Apps-Script: alte Bereitstellung reaktivieren (Deployment-Manager)
2. Fragenbank-Sheets: Backup-Kopien wiederherstellen (Drive-Versions-Historie ODER manueller Sheet-Replace)
3. Pool-Dateien: `git revert <migration-commit>` + Push
4. Frontend: alte Main-Commit-Version redeployen

Worst Case: 1 Stunde Arbeit, keine Datenverluste (weil Backups + Git-Historie).

## Tests

### Unit-Tests (Vitest)

**`utils/ueben/polygon.test.ts`** (neu):
- Rechteck (4 Punkte): Punkt innen, Punkt ausserhalb, Punkt auf Kante, Punkt auf Vertex
- Dreieck (3 Punkte): innen, ausserhalb, auf Kante
- Konvexes Hexagon: innen, ausserhalb
- Konkaves L-Polygon: Punkt in L-Ausbuchtung (wichtig, da Ray-Casting das korrekt behandeln muss)
- Degenerate: 3 kollineare Punkte → `false` für alle Test-Punkte
- Degenerate: leeres Polygon → `false`

**`utils/ueben/korrektur.test.ts`** (erweitern):
- Hotspot-Polygon: Treffer in Zielzone → korrekt
- Hotspot-Polygon: Miss → keine Punkte
- Hotspot-Pool-Filter: Treffer in `punkte_wert === 0`-Distraktor → Fehler
- Hotspot-Rechteck-Form (4-Punkt-Polygon): verhält sich identisch zu Polygon-Form
- Hotspot mit Mehrfachauswahl: alle Treffer summieren
- Hotspot ohne Mehrfachauswahl: nur erster Treffer zählt

**`utils/autoKorrektur.test.ts`** (erweitern):
- DragDrop-Polygon-Zielzone: Label in Zone + korrektes Label → Punkt
- DragDrop-Polygon-Zielzone: Label in Zone + falsches Label → kein Punkt
- DragDrop: Label ausserhalb aller Zonen → kein Punkt

### Integrations-Tests (Vitest + Testing Library)

**`packages/shared/src/editor/typen/HotspotEditor.test.tsx`** (erweitern — aktuell existiert keine Test-Datei dafür, wird neu angelegt):
- Modus-Toggle: Klick auf „Polygon" wechselt Zeichen-Modus
- Rechteck-Erstellung: 2 Klicks → Zone mit `form: 'rechteck'` + 4 Punkten
- Polygon-Erstellung: 4 Klicks + Doppelklick → Zone mit `form: 'polygon'` + 4 Punkten
- Polygon-Erstellung: Klick auf ersten Punkt schliesst
- Polygon-Verwerfen: 2 Klicks + Doppelklick → kein neuer Bereich (<3 Punkte)
- Polygon-Verwerfen: ESC während Zeichnen → kein neuer Bereich
- Punkt löschen: Doppelklick auf Punkt bei 4 Punkten → 3 Punkte, Doppelklick bei 3 Punkten → unverändert
- Punkt einfügen: Klick auf Kanten-Plus-Icon → Punkt zwischen zwei benachbarten Vertices
- Fläche-Drag: alle Punkte um Δ verschoben
- Rechteck-Eck-Drag: axis-aligned Constraint (zwei Nachbarn bewegen sich mit)

**`packages/shared/src/editor/typen/DragDropBildEditor.test.tsx`** (analog, mit Label-Feld statt Punkte-Wert)

### Migrations-Tests

**`apps-script-code.test.js`** (Node-Harness für Apps-Script-Funktionen, bestehender Pattern):
- `mq_konvertiereZone_({form:'rechteck', koordinaten:{x:10,y:20,breite:30,hoehe:40}})` → 4 Ecken-Punkte, form: 'rechteck'
- `mq_konvertiereZone_({form:'kreis', koordinaten:{x:50,y:50,radius:10}})` → 12 Punkte, alle auf Radius 10
- Idempotenz: Input bereits im Neu-Format → unverändert zurück

**`scripts/migriere-zonen-in-pools.test.mjs`** (neu):
- Fixture-Pool-Datei mit Alt-Format → konvertierter Output passt zu erwarteter Struktur

### E2E im Staging (manuell, echte Logins)

Nach Migration-Fenster, vor Main-Merge:

**LP-Pfad:**
1. 1 migrierte Hotspot-Frage in Fragensammlung öffnen → Editor zeigt Bereiche als Polygone, Handles funktionieren
2. Bereich ändern (Punkt verschieben, Polygon-Punkt einfügen), speichern, Seite neu laden → Änderungen persistiert
3. Neue Hotspot-Frage mit Polygon-Modus erstellen (4 Klicks + Doppelklick) → Speichern, Neu-Laden, Frage intakt
4. Neue Hotspot-Frage mit Rechteck-Modus (2 Klicks) → Speichern, Neu-Laden, Rechteck-Handles funktionieren
5. DragDrop-Bild analog: 1 migrierte Zielzone + neue Zielzone

**SuS-Pfad:**
1. Dieselbe migrierte Hotspot-Frage im Üben-Modus öffnen
2. Klick in Zielzone → Treffer, richtige Punkte
3. Klick ausserhalb → keine Punkte
4. Klick in Distraktor (wenn vorhanden) → Fehler
5. DragDrop-Bild: Label in Zone droppen → korrekte Bewertung

**Security-Check** (gemäss `regression-prevention.md` Phase 4):
- SuS-Response enthält keine Zonen-Koordinaten mehr (nach `bereinigeFrageFuerSuSUeben_`-Update)
- Test-Plan pro Änderung schriftlich im Chat bevor Browser-Test startet

### Test-Sollzustand vor Merge

- Alle existierenden Vitest-Tests grün (438+ wie Stand S127, plus neue)
- `tsc -b` grün
- `npm run build` grün
- Staging-E2E durchgespielt mit dokumentiertem Ergebnis
- LP-Freigabe explizit

## Offene Punkte für den Implementierungs-Plan

Der Plan wird folgende Entscheidungen konkretisieren:

1. **Reihenfolge der Tasks**: ob Types-Umstellung + Editor + Korrektur parallel auf Feature-Branch oder sequenziell
2. **Backend-Korrektur-Endpoint-Name**: bleibt `lernplattformPruefeAntwort` oder neuer Endpoint?
3. **Feldname `punkte_wert`**: final? Oder anderer Name um UI-Verwirrung („Punkte" vs. „Punkte-Koordinaten") zu vermeiden?
4. **Pool-Migrations-Script**: Ausführungsort (lokal beim Entwickler, CI-Run, oder ad-hoc)?
5. **Migrations-Fenster**: konkretes Datum/Uhrzeit abstimmen (abends, wenn keine aktiven LP-Sessions)

## Referenzen

- Bestehende Memory: `project_bildfragen_qualitaet.md` (Pool-Inhalts-Audit nötig), `feedback_sorgfalt.md`
- Rules: `.claude/rules/code-quality.md`, `.claude/rules/regression-prevention.md`, `.claude/rules/deployment-workflow.md`, `.claude/rules/bilder-in-pools.md`
- Vorlage für Migrations-Choreographie: `docs/superpowers/plans/2026-04-19-mediaquelle-unification.md` (Phase 5)
- Vorlage für Pool-Re-Import-Pattern: `tmp/repair-hotspots.mjs` (S125)
