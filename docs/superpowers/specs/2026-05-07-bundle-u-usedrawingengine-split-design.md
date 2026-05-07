# Bundle U — useDrawingEngine Pure-Logic-Cut

**Datum:** 2026-05-07
**Status:** Draft (vor Spec-Review)
**Vorgänger:** Bundle T.f (LPStartseite Hook+Komponenten-Extraktion, Merge `a84f1e4` 2026-05-07)
**Roadmap:** Phase 4 des Vereinfachungs-Audits ([`docs/superpowers/audits/2026-05-05-examlab-vereinfachung-audit.md`](../audits/2026-05-05-examlab-vereinfachung-audit.md), Bundle-U-Plan dort als „PDFSeite/useDrawingEngine/uebungsStore Hoch-Risiko-Splits" gerahmt).

## 1. Kontext

`ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts` (752 Zeilen) ist eines von drei verbleibenden Hoch-Risiko-Files aus dem Audit (zusammen mit `PDFSeite.tsx` 950 Z. und `uebungsStore.ts` 684 Z.). Bundle U wird **risiko-aufsteigend in eigenen Sessions** ausgeliefert — diese Spec deckt **nur** den niedrigsten Risiko-Vertreter ab, `useDrawingEngine`. PDFSeite und uebungsStore werden in eigenen Folge-Bundles (V/W) behandelt, ohne gemeinsame Master-Spec, weil die drei Files architektonisch verschieden sind und kein DRY-Gewinn entsteht.

`useDrawingEngine.ts` ist ein useReducer-basierter Hook mit 11 Action-Types, plus 4 thematisch eigenständige Pure-Function-Cluster (RDP-Algorithmus, Hit-Testing, Canvas-Rendering, Serialisierung). Der File ist intern bereits sauber per Section-Kommentar-Banner gegliedert. Es existieren **keine** Vitest-Tests — jede Verhalts-Drift bei Cut wäre nur durch Browser-E2E erkennbar.

Co-Location-Konvention für `zeichnen/`-Files ist durch Bundle T.d (Merge 2026-05-07) etabliert: `useCanvasSetup.ts`, `useStiftRendering.ts`, `useTextOverlay.ts`, `usePointerEvents.ts` liegen alle direkt in `src/components/fragetypen/zeichnen/`. Bundle U folgt dem Pattern.

## 2. Ziel

`useDrawingEngine.ts` von 752 Z. auf **~140 Z.** reduzieren (nur noch der React-Hook), 4 Pure-Logic-Sub-Files extrahieren, 3 davon mit Vitest-Tests versehen. Hotspot-Bilanz Code-Files (>500 Z., ohne data/test) **12 → 11**. Coverage-Lücke schliessen: erstmals Reducer-Tests, RDP/Hit-Testing-Tests, Serialisierungs-Tests.

## 3. Scope

### In Scope

| Sub | File | heute | nachher | Verantwortung |
|---|---|---:|---:|---|
| Modify | `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts` | 752 Z. | ~140 Z. | nur React-Hook (useReducer + 15× useCallback + Return-Object) |
| Modify | `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | 517 Z. | 517 Z. | 1 Zeile geändert (Import-Pfad für `findeCommandBeiPunkt`) |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts` | – | ~160 Z. | `CanvasAction`-Type, `initialState`, `verschiebePoint`, `verschiebeCommand`, `canvasReducer` |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts` | – | ~270 Z. | Vitest für alle 11 Action-Types + Edge-Cases (~15 Tests) |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts` | – | ~210 Z. | `vereinfachePunkte` (RDP), `punktZuLinieAbstand`, `punktAbstandZuSegment`, `findeCommandBeiPunkt`, `berechneBoundingBox` |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts` | – | ~250 Z. | Vitest für RDP, Hit-Testing pro Command-Typ, bbox (~15 Tests) |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts` | – | ~280 Z. | `zeichnePfeilspitze`, `zeichneCommand`, `renderCanvas` |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts` | – | ~30 Z. | `rundePoint`, `serializiereCommand` |
| New | `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts` | – | ~80 Z. | Vitest für Roundtrip + `druck`-Property + RDP-Vereinfachung-Coupling (~5 Tests) |

### Out of Scope

- `PDFSeite.tsx` (950 Z.) — separates Bundle V (oder analog), eigene Spec
- `uebungsStore.ts` (684 Z.) — separates Bundle W, eigene Spec
- `ZeichnenCanvas.tsx` weitere Änderungen — nur Import-Korrektur
- `ZeichnenToolbar.tsx`, `ZeichnenTypes.ts`, `useCanvasSetup`, `useStiftRendering`, `useTextOverlay`, `usePointerEvents` — alle unverändert, nur konsumiert
- Vitest für `drawingRendering.ts` — Canvas-2D-API-Mock-Aufwand zu hoch, abgedeckt durch Browser-E2E
- Verhaltensänderungen (auch keine Performance-Optimierungen wie Memoisierung)
- Apps Script / Backend / Wire-Vertrag / persistierter JSON-Vertrag — alle unangetastet
- `void pfeilBreite;` Z. 372 (Tot-Code-Indikator) — byte-identisch übernommen, Spawn-Task für später
- `exportierePNG` (Hook-Methode, 3 Zeilen `canvas.toDataURL`) — bleibt im Hook, kein eigenes Util

## 4. Architektur

### 4.1 Datei-Struktur

```
ExamLab/src/components/fragetypen/zeichnen/                  # existing Co-Located
├── ZeichnenCanvas.tsx                                       ← Modify (Z. 5: Import-Pfad)
├── ZeichnenToolbar.tsx                                      (existing, unverändert)
├── ZeichnenTypes.ts                                         (existing, unverändert)
├── useDrawingEngine.ts                                      ← Modify (752 → ~140 Z.)
├── useCanvasSetup.ts                                        (existing T.d, unverändert)
├── useCanvasSetup.test.ts                                   (existing T.d, unverändert)
├── useStiftRendering.ts                                     (existing T.d, unverändert)
├── useTextOverlay.ts                                        (existing T.d, unverändert)
├── useTextOverlay.test.tsx                                  (existing T.d, unverändert)
├── usePointerEvents.ts                                      (existing, unverändert)
├── drawingReducer.ts                                        ← New
├── drawingReducer.test.ts                                   ← New
├── drawingGeometrie.ts                                      ← New
├── drawingGeometrie.test.ts                                 ← New
├── drawingRendering.ts                                      ← New
├── drawingSerialisierung.ts                                 ← New
└── drawingSerialisierung.test.ts                            ← New
```

Pure-Logic-Files mit Prefix `drawing*` (nicht `use*`), weil sie keine Hooks sind. Co-located mit den Hooks aus T.d.

### 4.2 `drawingReducer.ts` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts
import type { DrawCommand, CanvasState, Point, CommandId } from './ZeichnenTypes';
import { MAX_UNDO_TIEFE } from './ZeichnenTypes';

export type CanvasAction =
  | { type: 'ADD_COMMAND'; command: DrawCommand }
  | { type: 'SET_AKTIVER'; command: DrawCommand | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'SELECT'; id: CommandId | null }
  | { type: 'DELETE_SELECTED' }
  | { type: 'DELETE_BY_ID'; id: CommandId }
  | { type: 'MOVE_SELECTED'; dx: number; dy: number }
  | { type: 'UPDATE_COMMAND'; id: CommandId; updates: Partial<DrawCommand> }
  | { type: 'LOAD'; commands: DrawCommand[] };

export const initialState: CanvasState = {
  commands: [],
  redoStack: [],
  aktiverCommand: null,
  selektierterCommand: null,
};

/** Verschiebt einen Point byte-identisch zur Source (Math.round * 10 / 10 für 0.1-Präzision). */
export function verschiebePoint(p: Point, dx: number, dy: number): Point { /* ... */ }

/** Verschiebt einen Command (typ-discriminiert über alle 7 Sub-Types). */
export function verschiebeCommand(cmd: DrawCommand, dx: number, dy: number): DrawCommand { /* ... */ }

/** Pure-Reducer für Canvas-State. Alle 11 Action-Types byte-identisch zur Source. */
export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState { /* ... */ }
```

**Migration für `useDrawingEngine.ts`:** `useReducer(canvasReducer, initialState)` — beides aus `./drawingReducer` importiert. `CanvasAction`-Type bleibt internal nur für Hook nötig.

### 4.3 `drawingGeometrie.ts` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts
import type { DrawCommand, Point, CommandId } from './ZeichnenTypes';

/**
 * RDP-Vereinfachung (Ramer-Douglas-Peucker) mit Toleranz 0.8px.
 * Kompromiss zwischen Speicher und Stift-Detail bei iPad-Stylus.
 *
 * Byte-identisch zur Source — auch das `Math.abs`-formelhafte Vorzeichen-Handling.
 */
export function vereinfachePunkte(punkte: Point[], toleranz?: number): Point[] { /* ... */ }

/**
 * Hit-Testing für Auswahl-Werkzeug. Iteriert von oben (zuletzt gezeichnet) nach unten.
 * Toleranz: 16px für Touch-Geräte, 8px für Maus.
 *
 * Discriminiert über alle 7 DrawCommand-Sub-Types.
 *
 * Byte-identisch zur Source — auch die Touch-Detection via `'ontouchstart' in window`.
 */
export function findeCommandBeiPunkt(commands: DrawCommand[], punkt: Point): CommandId | null { /* ... */ }

/**
 * Bounding-Box-Berechnung für Selektions-Rahmen.
 * Returns null bei `stift`/`radierer` ohne Punkte.
 */
export function berechneBoundingBox(
  cmd: DrawCommand,
): { x: number; y: number; breite: number; hoehe: number } | null { /* ... */ }

// Interne Helpers (nicht exportiert)
// - punktZuLinieAbstand: senkrechter Abstand Punkt zu Linie (für RDP)
// - punktAbstandZuSegment: Punkt-zu-Segment-Distanz mit t-Parameter-Clipping (für Hit-Testing)
```

**Migration:** `findeCommandBeiPunkt` wird bisher aus `useDrawingEngine.ts` Z. 752 re-exportiert. Konsumer (`ZeichnenCanvas.tsx` Z. 5) wechselt auf direkten Import aus `./drawingGeometrie`.

### 4.4 `drawingRendering.ts` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts
import type { DrawCommand, CanvasState, Point } from './ZeichnenTypes';
import { berechneBoundingBox } from './drawingGeometrie';

/**
 * Zeichnet einen einzelnen Command auf den Canvas-Context. Discriminiert über alle 7 Typen.
 *
 * Byte-identisch zur Source — incl.
 * - `ctx.save()`/`ctx.restore()`-Wrapping pro Command
 * - `globalCompositeOperation = 'destination-out'` für Radierer
 * - Pfeilspitzen-Geometrie (asin-Math, mit Pfeil-Länge clamped auf max(10, breite*4))
 * - Text-Rotation per `ctx.translate` + `ctx.rotate`
 * - `setLineDash` toggle für gestrichelt-Modus
 */
export function zeichneCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void { /* ... */ }

/**
 * Vollständiges Canvas-Rendering: Hintergrundbild → alle Commands → aktiver Command → Selektions-Rahmen.
 *
 * `clearRect` als ersten Schritt; Hintergrundbild mit `drawImage(0, 0, breite, hoehe)`;
 * Selektion als gestrichelter blauer Rahmen (#3b82f6, lineDash [5,4]) um bbox.
 */
export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  hintergrundbild: HTMLImageElement | null | undefined,
  breite: number,
  hoehe: number,
): void { /* ... */ }

// Interner Helper (nicht exportiert)
// - zeichnePfeilspitze: schliesst eine Pfeilspitze als gefülltes Triangle am Bis-Punkt
```

**Migration:** Konsument ist nur `useDrawingEngine.ts` (Hook-Methoden `render` und `renderMitPreview`). Keine externe Migration nötig. **Kein Vitest** — Canvas-2D-API ist in jsdom nicht verfügbar, Mock-Aufwand übersteigt Nutzen. Verhalten wird per Browser-E2E (Pfade in §7.1) verifiziert.

### 4.5 `drawingSerialisierung.ts` Service-API

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts
import type { DrawCommand, Point } from './ZeichnenTypes';
import { vereinfachePunkte } from './drawingGeometrie';

/**
 * Rundet einen Point auf 0.1-Präzision (Math.round * 10 / 10). Druck wird auf 0.01 gerundet.
 * Byte-identisch zur Source.
 */
export function rundePoint(p: Point): Point { /* ... */ }

/**
 * Serialisiert einen Command für JSON-Persistenz:
 * - `stift`: zuerst RDP-vereinfacht, dann Punkte gerundet
 * - `radierer`/`linie`/`pfeil`/`rechteck`/`ellipse`/`text`: nur Punkte/Position gerundet
 */
export function serializiereCommand(cmd: DrawCommand): DrawCommand { /* ... */ }
```

**Migration:** `useDrawingEngine.serialisiere`-Methode (Z. 700-703) ruft `stateRef.current.commands.map(serializiereCommand)`. Import nach `./drawingSerialisierung`.

### 4.6 `useDrawingEngine.ts` (nach Cut)

Bleibt als idiomatischer React-Hook (~140 Z.):

```typescript
import { useReducer, useCallback, useRef } from 'react';
import type { DrawCommand, CanvasState, CommandId } from './ZeichnenTypes';
import { generiereCommandId } from './ZeichnenTypes';
import { canvasReducer, initialState } from './drawingReducer';
import { renderCanvas, zeichneCommand } from './drawingRendering';
import { serializiereCommand } from './drawingSerialisierung';

interface UseDrawingEngineOptions { /* ... */ }
interface UseDrawingEngineReturn { /* ... */ }

export function useDrawingEngine(options: UseDrawingEngineOptions): UseDrawingEngineReturn {
  const { hintergrundbild, breite, hoehe } = options;
  const [state, dispatch] = useReducer(canvasReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 13 useCallback-Wrapper für Dispatch-Actions (byte-identisch zur Source)
  // 2 useCallback für render/renderMitPreview (rufen renderCanvas + optional zeichneCommand)
  // 1 useCallback für serialisiere (mappt commands über serializiereCommand)
  // 1 useCallback für ladeDaten (JSON-Parse + dispatch LOAD)
  // 1 useCallback für exportierePNG (canvas.toDataURL)

  return { state, /* ... 17 Methoden + 2 Booleans ... */ };
}
```

**Keine Re-Exports mehr.** Z. 752 (`export { findeCommandBeiPunkt, vereinfachePunkte, zeichneCommand }`) entfällt komplett. `vereinfachePunkte` und `zeichneCommand` waren ungenutzt und werden auch in der neuen Welt nicht von externen Consumern importiert — Dead-Surface ist beseitigt.

### 4.7 ZeichnenCanvas.tsx Migration

Eine Zeile geändert:

```diff
- import { useDrawingEngine, findeCommandBeiPunkt } from './useDrawingEngine'
+ import { useDrawingEngine } from './useDrawingEngine'
+ import { findeCommandBeiPunkt } from './drawingGeometrie'
```

Verwendung von `findeCommandBeiPunkt` bleibt unverändert.

## 5. Verhalten

### 5.1 Bewahrte Invarianten (byte-identisch)

| # | Invariante | Quelle | Migration |
|---|---|---|---|
| 1 | RDP-Toleranz 0.8 (Default) | Z. 217 | `drawingGeometrie.vereinfachePunkte` |
| 2 | Touch-Toleranz 16px / Maus 8px | Z. 269-270 | `drawingGeometrie.findeCommandBeiPunkt` |
| 3 | Touch-Detection via `'ontouchstart' in window` | Z. 269 | `drawingGeometrie` |
| 4 | bbox-PADDING 6px | Z. 509 | `drawingGeometrie.berechneBoundingBox` |
| 5 | Selektions-Farbe `#3b82f6` + lineDash [5,4] | Z. 587-588 | `drawingRendering.renderCanvas` |
| 6 | Pfeilspitzen-Geometrie (Math.PI/7-Winkel, max(10, breite*4)) | Z. 351-360 | `drawingRendering.zeichnePfeilspitze` |
| 7 | Radierer via `globalCompositeOperation='destination-out'` | Z. 484, 494 | `drawingRendering.zeichneCommand` |
| 8 | Text-Baseline `'alphabetic'` | Z. 469 | `drawingRendering.zeichneCommand` |
| 9 | Text-Rotation per translate+rotate (nicht setTransform) | Z. 470-475 | `drawingRendering.zeichneCommand` |
| 10 | rundePoint: Position auf 0.1, Druck auf 0.01 | Z. 600-608 | `drawingSerialisierung.rundePoint` |
| 11 | Stift-Serialisierung: vereinfachen → runden | Z. 614 | `drawingSerialisierung.serializiereCommand` |
| 12 | MAX_UNDO_TIEFE-Window beim ADD_COMMAND | Z. 99-101 | `drawingReducer.canvasReducer` |
| 13 | UNDO push letzten auf redoStack, REDO pop | Z. 113-132 | `drawingReducer.canvasReducer` |
| 14 | DELETE_BY_ID: löscht selektierten falls match | Z. 159-161 | `drawingReducer.canvasReducer` |
| 15 | UPDATE_COMMAND: erhält id+typ aus Original | Z. 178-179 | `drawingReducer.canvasReducer` |
| 16 | `void pfeilBreite;` Tot-Code-Indikator | Z. 372 | `drawingRendering` (byte-identisch übernommen) |
| 17 | `console.warn` bei JSON-Parse-Fehler in ladeDaten | Z. 709, 714 | bleibt im Hook |

### 5.2 Was bleibt in `useDrawingEngine.ts`

- `interface UseDrawingEngineOptions` + `interface UseDrawingEngineReturn`
- `useReducer`-Aufruf mit `canvasReducer` + `initialState`
- `stateRef`-Spiegel für stable Callback-Zugriff
- 13 useCallback für Dispatch-Wrapper (`addCommand`, `updateAktiverCommand`, `undo`, `redo`, `allesLoeschen`, `selektiere`, `loescheSelektierten`, `loescheById`, `verschiebeSelektierten`, `updateCommand`)
- 2 useCallback für Rendering (`render`, `renderMitPreview`) — rufen `renderCanvas` + optional `zeichneCommand`
- 1 useCallback `serialisiere` — mappt über `serializiereCommand`
- 1 useCallback `ladeDaten` — JSON.parse + dispatch LOAD + console.warn-Errorpfad
- 1 useCallback `exportierePNG` — `canvas.toDataURL('image/png')`
- Return-Object mit 13 Methoden + 4 Render/Persistenz-Methoden + `state`/`kannUndo`/`kannRedo`

### 5.3 Was wandert raus

| Cluster | Ziel-File | Source-Zeilen | Zeilen |
|---|---|---:|---:|
| CanvasAction-Type | `drawingReducer.ts` | 43-54 | ~12 |
| initialState | `drawingReducer.ts` | 60-65 | ~6 |
| verschiebePoint + verschiebeCommand | `drawingReducer.ts` | 71-89 | ~19 |
| canvasReducer | `drawingReducer.ts` | 95-194 | ~100 |
| RDP (punktZuLinieAbstand + vereinfachePunkte) | `drawingGeometrie.ts` | 200-241 | ~42 |
| Hit-Testing (punktAbstandZuSegment + findeCommandBeiPunkt) | `drawingGeometrie.ts` | 247-339 | ~93 |
| berechneBoundingBox | `drawingGeometrie.ts` | 506-552 | ~47 |
| zeichnePfeilspitze | `drawingRendering.ts` | 345-373 | ~29 |
| zeichneCommand | `drawingRendering.ts` | 379-500 | ~122 |
| renderCanvas | `drawingRendering.ts` | 558-594 | ~37 |
| rundePoint + serializiereCommand | `drawingSerialisierung.ts` | 600-628 | ~29 |
| Re-Export-Zeile (Z. 752) | _entfällt_ | 752 | -1 |
| **Cluster-Total** | – | – | ~536 Z. raus |

Hook bleibt: 752 Z. (heute) − 536 Z. (raus) − ~76 Z. (Imports/Helpers/Header weg) = ~140 Z.

## 6. Risiko-Analyse

### 6.1 Reducer-Cut bricht Action-Reihenfolge (Risiko: niedrig)

Der Reducer enthält 11 Action-Types und mehrere implizite Invarianten (z.B. `MOVE_SELECTED` setzt `selektierterCommand` nicht zurück, `DELETE_BY_ID` aber doch wenn match). Beim Cut bleiben alle Branches byte-identisch, aber Vitest-Coverage erlaubt erstmals Verifikation.

**Mitigation:** `drawingReducer.test.ts` deckt alle 11 Action-Types und folgende Edge-Cases:
- `ADD_COMMAND`-overflow auf MAX_UNDO_TIEFE
- `UNDO` auf leerem Commands-Array (no-op)
- `REDO` auf leerem redoStack (no-op)
- `DELETE_SELECTED` ohne Selektion (no-op)
- `DELETE_BY_ID` mit nicht-existenter ID (no-op)
- `MOVE_SELECTED` ohne Selektion (no-op)
- `UPDATE_COMMAND` mit nicht-existenter ID (no-op)
- `verschiebeCommand` für alle 7 Sub-Types

### 6.2 Hit-Testing-Touch-Toleranz (Risiko: niedrig)

`'ontouchstart' in window` wird beim Modul-Load **nicht** evaluiert — die Detection findet zur Aufruf-Zeit von `findeCommandBeiPunkt` statt. Beim Cut bleibt das byte-identisch.

**Mitigation:** `drawingGeometrie.test.ts` mockt `window.ontouchstart` (per `vi.stubGlobal` oder Object.defineProperty) und verifiziert beide Toleranz-Zweige. Hit-Testing pro Sub-Type:
- `rechteck`/`ellipse`: bbox-Inclusion
- `text` mit Rotation: rotated-Klick-Position-Check
- `linie`/`pfeil`: Segment-Distance < TOLERANZ_PX
- `stift`/`radierer`: jedes Polyline-Segment + Single-Punkt-Fallback

### 6.3 RDP byte-identisch trotz Refactor (Risiko: niedrig)

Die RDP-Implementierung verwendet rekursive Slices und collapse über `links.slice(0,-1)` + `rechts`. Off-by-one-Fehler beim Cut wäre für Auswahl-Werkzeug + Stift-Persistenz **toxisch**.

**Mitigation:**
- Source-Code wortwörtlich übernommen (kein Re-Implement)
- `drawingGeometrie.test.ts` Tests für RDP:
  - Linie mit 2 Punkten → unverändert
  - Gerade Linie mit 5 kollinearen Punkten → reduziert auf 2
  - Linie mit Knick > Toleranz → behält Knick-Punkt
  - Linie mit Mikro-Wackler < Toleranz → wackler entfernt

### 6.4 Cyclic Imports zwischen drawingGeometrie und drawingSerialisierung (Risiko: niedrig)

`drawingSerialisierung.serializiereCommand` ruft `vereinfachePunkte` aus `drawingGeometrie`. Das ist ein einseitiger Import (Geometrie → kein Import von Serialisierung), kein Zyklus.

**Mitigation:** Spec-Review prüft Import-Graph. `tsc -b` muss clean bleiben.

### 6.5 ZeichnenCanvas-Import-Korrektur (Risiko: niedrig)

Nur 1 Konsument (`ZeichnenCanvas.tsx` Z. 5) importiert `findeCommandBeiPunkt` aus `useDrawingEngine`. Bei Cut wandert der Import auf `./drawingGeometrie`. Verhalten unverändert.

**Mitigation:**
- Grep nach `from './useDrawingEngine'` und `from '.\\.\\./fragetypen/zeichnen/useDrawingEngine'` global im Repo nach Cut — muss auf 0 fallen für `findeCommandBeiPunkt`/`vereinfachePunkte`/`zeichneCommand`
- ZeichnenCanvas-Edit als atomarer Commit zusammen mit Hook-Slim-Down (Phase 5)

### 6.6 Browser-E2E ohne Reducer-Cut-Tests (Risiko: minimal)

Auch ohne Reducer-Tests könnte Reducer-Cut dem User schaden — Vitest-Tests sind hier extra-Sicherheit, nicht Pflicht. Browser-E2E (LP-Editor + SuS-Üben Zeichnen-Frage mit Stift+Linie+Pfeil+Rechteck+Ellipse+Text+Radierer+Auswahl+Undo+Redo+Speichern+Reload+PNG-Export) deckt alle 11 Reducer-Actions indirekt ab.

## 7. Test-Strategie

| File | Vitest? | Browser-E2E? |
|---|---|---|
| `drawingReducer.ts` | **JA** — 11 Action-Types + 6 Edge-Cases (~15 Tests) | indirekt via Hook |
| `drawingGeometrie.ts` | **JA** — RDP, Hit-Testing pro Typ, bbox (~15 Tests) | indirekt via Hook |
| `drawingRendering.ts` | **NEIN** — Canvas-2D-API in jsdom nicht verfügbar | ja (alle 7 Werkzeuge im LP-Editor + SuS-Üben) |
| `drawingSerialisierung.ts` | **JA** — Roundtrip, Druck-Property, Stift-RDP-Coupling (~5 Tests) | ja (Speichern + Reload) |
| `useDrawingEngine.ts` | – (keine eigenen Tests, durch Hook-Action-Mapping byte-identisch zu Reducer-Tests) | ja (komposit) |

### 7.1 Browser-E2E-Pfade (Bundle-U-spezifisch, mit echten Logins)

Per Memory-Regel `feedback_echte_logins` — kein Demo-Modus.

1. **LP-Editor öffnen + Zeichnen-Frage erstellen** → Canvas erscheint mit Default-Hintergrund (oder Bild falls hochgeladen)
2. **Alle 7 Werkzeuge** im LP-Editor: Stift / Linie / Pfeil / Rechteck / Ellipse / Text / Radierer — jedes Werkzeug einmal anwenden, alle Commands erscheinen visuell korrekt
3. **Auswahl-Werkzeug** Klick auf gezeichnetes Element → blauer gestrichelter Selektions-Rahmen sichtbar (Hit-Testing pro Typ)
4. **Verschieben** Selektiertes Element via Drag verschieben → Position aktualisiert
5. **Löschen via Tastatur** Delete-Taste auf Selektion → Element verschwindet
6. **Undo / Redo** je 3× → State korrekt rekonstruiert
7. **Alles löschen** Toolbar-Button → Canvas leer
8. **Speichern (Auto-Save)** Zeichnen → 400ms Pause → onDatenChange fired → Backend-Request mit serialisiertem JSON (sichtbar im Network-Tab)
9. **Reload** Frage schliessen + neu öffnen → JSON wird via `engine.ladeDaten` deserialisiert, alle Commands sichtbar
10. **SuS-Üben Zeichnen-Frage** öffnen → Hintergrundbild lädt, Werkzeuge funktional, Antwort-Speicher-Roundtrip ok
11. **PNG-Export** (falls über Toolbar verfügbar) → Datei mit korrektem Bild-Inhalt
12. **Console-Errors** 0 Errors über alle Pfade

Service-Worker-Cache vor E2E zurücksetzen (Memory-Regel `feedback_service_worker_cache_wire_bundle`, hier präventiv obwohl kein Wire-Vertrag berührt).

## 8. Definition of Done

Analog Bundle-S/L/T-Standard:

- `cd ExamLab && npx vitest run` grün — drift +35 Tests (15 reducer + 15 geometrie + 5 serialisierung)
- `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` clean (Output direkt prüfen, Lehre `feedback_tsc_b_exit_misleading`)
- `cd ExamLab && npm run lint:as-any` clean (Total 0 / Defensive 0 / Undokumentiert 0)
- `cd ExamLab && npm run lint:no-alert` clean
- `cd ExamLab && npm run lint:no-tests-dir` clean
- `cd ExamLab && npm run lint:musterloesung` clean (Baseline unverändert)
- `cd ExamLab && npx vite build` erfolgreich
- Browser-E2E auf staging mit echten LP+SuS-Logins, Pfade 1-12 ✓
- Code-Reviewer-Subagent APPROVED
- HANDOFF.md-Eintrag + Memory-Update mit Lehren

## 9. Implementations-Reihenfolge (Risiko-aufsteigend)

1. **Phase 1**: `drawingReducer.ts` + `drawingReducer.test.ts` (kleinster, klar testbarer Cut, byte-identisch übernommen). Hook konsumiert noch nichts → atomar.
2. **Phase 2**: `drawingGeometrie.ts` + `drawingGeometrie.test.ts` (pure-functions, mockt window.ontouchstart). Hook noch unverändert.
3. **Phase 3**: `drawingSerialisierung.ts` + `drawingSerialisierung.test.ts` (kleinster Cut, hängt von `drawingGeometrie.vereinfachePunkte` ab — Phase 2 muss vor 3).
4. **Phase 4**: `drawingRendering.ts` (kein Vitest, nur Cut). Hängt von `drawingGeometrie.berechneBoundingBox` ab — Phase 2 vor 4.
5. **Phase 5**: `useDrawingEngine.ts` slim (Imports umstellen, Re-Export-Zeile entfernen) + `ZeichnenCanvas.tsx` Z. 5 Import-Korrektur — atomarer Commit.
6. **Phase 6**: Lint-Gates + tsc + build verify.
7. **Phase 7**: Browser-E2E auf staging (User-manual).
8. **Phase 8**: Final Code-Reviewer + HANDOFF + Memory + Merge.

Reihenfolge bewahrt das Bundle-S/L/T.a-T.f-Pattern: Pure-Logic-Cuts zuerst (mit Tests), Hook-Slim-Down + Konsumer-Korrektur als atomarer Commit am Ende.
