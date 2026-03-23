# Stifteingabe / Zeichnen — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neuer Fragetyp `visualisierung` (Untertyp `zeichnen`) mit HTML5 Canvas, Werkzeugleiste, Hintergrundbild, LP-Editor, Korrektur-Ansicht und KI-Korrekturvorschlag.

**Architecture:** Native HTML5 Canvas mit Command-Stack (DrawCommand[]) für Undo/Redo. Pointer Events API für Touch/Maus/Stift. Bestehende Zustand-Store-Patterns für Auto-Save. Apps Script Backend für KI-Korrektur via Claude Vision.

**Tech Stack:** React 19, TypeScript, HTML5 Canvas 2D API, Pointer Events API, Zustand, Tailwind CSS v4, Apps Script + Claude Sonnet (Vision)

**Spec:** `Pruefung/docs/superpowers/specs/2026-03-23-stifteingabe-zeichnen-design.md`

---

## File Structure

### Neue Dateien

| Datei | Verantwortung | ~Zeilen |
|-------|--------------|---------|
| `src/components/fragetypen/zeichnen/ZeichnenTypes.ts` | Typen: DrawCommand, Point, CanvasState, Tool | ~60 |
| `src/components/fragetypen/zeichnen/useDrawingEngine.ts` | Hook: Command-Stack, Undo/Redo, Render-Loop | ~350 |
| `src/components/fragetypen/zeichnen/usePointerEvents.ts` | Hook: Touch/Maus/Stift normalisiert, Hit-Testing | ~200 |
| `src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | Canvas-Rendering, Toolbar-Integration | ~300 |
| `src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx` | Werkzeugleiste (horizontal/vertikal) | ~180 |
| `src/components/fragetypen/ZeichnenFrage.tsx` | SuS-Ansicht (Haupt-Komponente) | ~150 |
| `src/components/lp/frageneditor/ZeichnenEditor.tsx` | LP-Editor (Config, Hintergrundbild, Musterlösung) | ~200 |
| `src/components/lp/ZeichnenKorrektur.tsx` | LP-Korrektur (Annotation, Text, Audio, KI) | ~250 |

### Bestehende Dateien (Änderungen)

| Datei | Änderung |
|-------|----------|
| `src/types/fragen.ts:132-158` | CanvasConfig erweitern (neue optionale Felder), musterloesungBild auf VisualisierungFrage |
| `src/components/Layout.tsx:401-432` | `case 'visualisierung'` hinzufügen |
| `src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx:105-568` | `case 'visualisierung'` hinzufügen |
| `src/utils/fragenFactory.ts:62-176` | `case 'visualisierung'` hinzufügen |
| `src/utils/exportUtils.ts:298-300` | visualisierung-Export verbessern |
| `src/components/lp/KorrekturFrageZeile.tsx` | ZeichnenKorrektur für visualisierung-Fragen rendern |
| `src/components/lp/KorrekturPDFAnsicht.tsx` | PNG-Bild für Zeichnungen in PDF einbetten |
| `Pruefung/apps-script-code.js:1723-1973` | `case 'korrigiereZeichnung'` + `rufeClaudeAufMitBild()` hinzufügen |

---

## Task 1: Typen & Datenmodell

**Files:**
- Modify: `src/types/fragen.ts:132-158`
- Create: `src/components/fragetypen/zeichnen/ZeichnenTypes.ts`

- [ ] **Step 1: CanvasConfig erweitern in fragen.ts**

In `src/types/fragen.ts`, die bestehende `CanvasConfig` (Zeile 152-158) erweitern:

```typescript
export interface CanvasConfig {
  breite: number;
  hoehe: number;
  koordinatensystem: boolean;
  achsenBeschriftung?: { x: string; y: string };
  werkzeuge: ('stift' | 'linie' | 'pfeil' | 'text' | 'rechteck')[];
  // Neue Felder:
  hintergrundbild?: string;
  hintergrundbildId?: string;
  groessePreset?: 'klein' | 'mittel' | 'gross' | 'auto';
  radierer?: boolean;
  farben?: string[];
}
```

Und `musterloesungBild` auf `VisualisierungFrage` (Zeile 132-137):

```typescript
export interface VisualisierungFrage extends FrageBase {
  typ: 'visualisierung';
  untertyp: 'zeichnen' | 'diagramm-manipulieren' | 'schema-erstellen';
  fragetext: string;
  ausgangsdiagramm?: DiagrammConfig;
  canvasConfig?: CanvasConfig;
  musterloesungBild?: string;
}
```

- [ ] **Step 2: ZeichnenTypes.ts erstellen**

Erstelle `src/components/fragetypen/zeichnen/ZeichnenTypes.ts`:

```typescript
// Punkt auf dem Canvas
export interface Point {
  x: number;
  y: number;
  druck?: number; // 0.0-1.0, nur bei Stifteingabe
}

// Eindeutige ID pro Command (Timestamp-basiert)
export type CommandId = string;

// Alle Zeichenbefehle als Discriminated Union
export type DrawCommand =
  | { id: CommandId; typ: 'stift'; punkte: Point[]; farbe: string; breite: number }
  | { id: CommandId; typ: 'linie'; von: Point; bis: Point; farbe: string; breite: number }
  | { id: CommandId; typ: 'pfeil'; von: Point; bis: Point; farbe: string; breite: number }
  | { id: CommandId; typ: 'rechteck'; von: Point; bis: Point; farbe: string; breite: number; gefuellt: boolean }
  | { id: CommandId; typ: 'text'; position: Point; text: string; farbe: string; groesse: number }
  | { id: CommandId; typ: 'radierer'; punkte: Point[]; breite: number };

// Aktives Werkzeug
export type Tool = 'auswahl' | 'stift' | 'linie' | 'pfeil' | 'rechteck' | 'text' | 'radierer';

// Canvas-Gesamtzustand
export interface CanvasState {
  commands: DrawCommand[];
  redoStack: DrawCommand[];
  aktiverCommand: DrawCommand | null;
  selektierterCommand: CommandId | null;
}

// Toolbar-Orientierung
export type ToolbarLayout = 'horizontal' | 'vertikal';

// Standard-Farben
export const STANDARD_FARBEN = ['#000000', '#ef4444', '#3b82f6', '#22c55e'];

// Grössen-Presets
export const GROESSE_PRESETS: Record<string, { breite: number; hoehe: number }> = {
  klein: { breite: 600, hoehe: 400 },
  mittel: { breite: 800, hoehe: 600 },
  gross: { breite: 1200, hoehe: 800 },
};

// Max Undo-Tiefe
export const MAX_UNDO_TIEFE = 50;

// Command-ID generieren
export function generiereCommandId(): CommandId {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
```

- [ ] **Step 3: TypeScript-Check**

Run: `cd Pruefung && npx tsc --noEmit`
Expected: 0 Fehler

- [ ] **Step 4: Commit**

```bash
git add src/types/fragen.ts src/components/fragetypen/zeichnen/ZeichnenTypes.ts
git commit -m "feat: Zeichnen-Fragetyp — Typen & Datenmodell"
```

---

## Task 2: Drawing Engine Hook

**Files:**
- Create: `src/components/fragetypen/zeichnen/useDrawingEngine.ts`

- [ ] **Step 1: State-Management + Command-Operationen**

Erstelle `useDrawingEngine.ts` mit dem Hook-Interface und den State-Operationen. Verwende `useReducer` für komplexen State:

```typescript
import { useReducer, useCallback, useRef } from 'react';
import type { DrawCommand, CanvasState, Point, CommandId } from './ZeichnenTypes';
import { MAX_UNDO_TIEFE, generiereCommandId } from './ZeichnenTypes';

interface UseDrawingEngineOptions {
  hintergrundbild?: HTMLImageElement | null;
  breite: number;
  hoehe: number;
}

interface UseDrawingEngineReturn {
  state: CanvasState;
  addCommand: (cmd: Omit<DrawCommand, 'id'>) => void;
  updateAktiverCommand: (cmd: DrawCommand | null) => void;
  undo: () => void;
  redo: () => void;
  allesLoeschen: () => void;
  selektiere: (id: CommandId | null) => void;
  loescheSelektierten: () => void;
  verschiebeSelektierten: (dx: number, dy: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  serialisiere: () => string;
  ladeDaten: (json: string) => void;
  exportierePNG: (canvas: HTMLCanvasElement) => string;
  kannUndo: boolean;
  kannRedo: boolean;
}

// Reducer-Actions:
type CanvasAction =
  | { type: 'ADD_COMMAND'; command: DrawCommand }
  | { type: 'SET_AKTIVER'; command: DrawCommand | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'SELECT'; id: CommandId | null }
  | { type: 'DELETE_SELECTED' }
  | { type: 'MOVE_SELECTED'; dx: number; dy: number }
  | { type: 'LOAD'; commands: DrawCommand[] };
```

Implementiere den Reducer:
- `ADD_COMMAND`: Push auf commands[], redoStack leeren. Wenn commands.length > MAX_UNDO_TIEFE, ältesten entfernen.
- `UNDO`: Pop letzten von commands[] → push auf redoStack[]
- `REDO`: Pop letzten von redoStack[] → push auf commands[]
- `CLEAR`: commands = [], redoStack = []
- `DELETE_SELECTED`: Filtere selektierten Command aus commands[], push alten State auf redoStack
- `MOVE_SELECTED`: Command klonen, Positionen um dx/dy verschieben (je nach typ)

- [ ] **Step 2: Render-Funktionen**

Im selben File, nach dem Reducer:

```typescript
// Einzelnen Command zeichnen
function zeichneCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void {
  switch (cmd.typ) {
    case 'stift': // ctx.beginPath(), moveTo, lineTo für jeden Punkt, stroke()
    case 'linie': // ctx.beginPath(), moveTo(von), lineTo(bis), stroke()
    case 'pfeil': // Wie Linie + Pfeilspitze (Dreieck am Ende)
    case 'rechteck': // ctx.strokeRect oder fillRect
    case 'text': // ctx.fillText
    case 'radierer': // ctx.globalCompositeOperation = 'destination-out', dann wie Stift
  }
}

// Gesamten Canvas rendern
function render(ctx, state, hintergrundbild, breite, hoehe) {
  ctx.clearRect(0, 0, breite, hoehe);
  if (hintergrundbild) ctx.drawImage(hintergrundbild, 0, 0, breite, hoehe);
  state.commands.forEach(cmd => zeichneCommand(ctx, cmd));
  if (state.aktiverCommand) zeichneCommand(ctx, state.aktiverCommand);
  // Selektion: Bounding-Box zeichnen wenn selektierterCommand !== null
}
```

- [ ] **Step 3: Hit-Testing + Serialisierung + RDP**

Im selben File:

**Hit-Testing:**
```typescript
function findeCommandBeiPunkt(commands: DrawCommand[], punkt: Point): CommandId | null {
  // Rückwärts iterieren (oberstes zuerst)
  for (let i = commands.length - 1; i >= 0; i--) {
    const cmd = commands[i];
    switch (cmd.typ) {
      case 'rechteck': // Punkt in Bounding-Box?
      case 'text': // Punkt in Text-Bounding-Box? (ctx.measureText)
      case 'linie': case 'pfeil': // Abstand Punkt zu Linie < 8px?
      case 'stift': case 'radierer': // Punkt nahe an einem Strich-Punkt? (Toleranz 8px)
    }
  }
  return null;
}
```

**RDP-Algorithmus:**
```typescript
function vereinfachePunkte(punkte: Point[], toleranz = 1.5): Point[] {
  if (punkte.length <= 2) return punkte;
  let maxDist = 0, maxIdx = 0;
  const start = punkte[0], end = punkte[punkte.length - 1];
  for (let i = 1; i < punkte.length - 1; i++) {
    const dist = punktZuLinieAbstand(punkte[i], start, end);
    if (dist > maxDist) { maxDist = dist; maxIdx = i; }
  }
  if (maxDist > toleranz) {
    const links = vereinfachePunkte(punkte.slice(0, maxIdx + 1), toleranz);
    const rechts = vereinfachePunkte(punkte.slice(maxIdx), toleranz);
    return [...links.slice(0, -1), ...rechts];
  }
  return [start, end];
}
```

**Serialisierung:** `serialisiere()` = JSON.stringify(commands) mit Punkt-Rundung auf 1 Dezimalstelle.
**Export:** `exportierePNG(canvas)` = `canvas.toDataURL('image/png')`.
**Laden:** `ladeDaten(json)` = JSON.parse in try/catch → dispatch LOAD.

**Hinweis:** Skalier-Handles (resize) für selektierte Elemente werden in v2 implementiert. In v1: Auswahl = verschieben + löschen.

- [ ] **Step 4: TypeScript-Check**

Run: `cd Pruefung && npx tsc --noEmit`
Expected: 0 Fehler

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/zeichnen/useDrawingEngine.ts
git commit -m "feat: Zeichnen — Drawing Engine Hook (Command-Stack, Undo/Redo, Render)"
```

---

## Task 3: Pointer Events Hook

**Files:**
- Create: `src/components/fragetypen/zeichnen/usePointerEvents.ts`

- [ ] **Step 1: usePointerEvents Hook erstellen**

Hook-Verantwortung: Canvas-Events normalisieren, Koordinaten umrechnen (Display → logisch), Pointer-Typ erkennen (Maus/Touch/Stift), Touch-Action-Steuerung.

```typescript
import { useEffect, useCallback, useRef } from 'react';
import type { Point, Tool } from './ZeichnenTypes';

interface UsePointerEventsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  aktivesTool: Tool;
  breite: number;  // Logische Canvas-Breite
  hoehe: number;   // Logische Canvas-Höhe
  disabled: boolean;
  onStart: (punkt: Point, pointerType: string) => void;
  onMove: (punkt: Point, pointerType: string) => void;
  onEnd: (punkt: Point, pointerType: string) => void;
}
```

Implementiere:
- `pointerdown/pointermove/pointerup` Event-Listener auf Canvas
- Koordinaten-Umrechnung: `event.offsetX / displayBreite * logischeBreite`
- `touch-action: none` auf Canvas-Element (verhindert Scroll-Hijacking)
- `event.pressure` auslesen für Stift-Drucksensitivität
- `event.pointerType` weiterreichen ('mouse' | 'touch' | 'pen')
- Cleanup: removeEventListener in useEffect-Cleanup

- [ ] **Step 2: TypeScript-Check**

Run: `cd Pruefung && npx tsc --noEmit`
Expected: 0 Fehler

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/zeichnen/usePointerEvents.ts
git commit -m "feat: Zeichnen — Pointer Events Hook (Touch/Maus/Stift)"
```

---

## Task 4: Toolbar-Komponente

**Files:**
- Create: `src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx`

- [ ] **Step 1: ZeichnenToolbar erstellen**

Props:
```typescript
interface ZeichnenToolbarProps {
  aktivesTool: Tool;
  onToolChange: (tool: Tool) => void;
  aktiveFarbe: string;
  onFarbeChange: (farbe: string) => void;
  verfuegbareWerkzeuge: string[];  // Aus CanvasConfig
  verfuegbareFarben: string[];
  radiererAktiv: boolean;
  layout: ToolbarLayout;
  onLayoutToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAllesLoeschen: () => void;
  kannUndo: boolean;
  kannRedo: boolean;
  disabled: boolean;  // true wenn abgegeben
}
```

Implementiere:
- Tool-Buttons in gruppiertem Container (`flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-md p-0.5`)
- Aktives Tool: `bg-white dark:bg-slate-600 shadow-sm`
- Farb-Kreise: 22×22px, aktive mit `ring-2 ring-blue-500`
- Undo/Redo Buttons mit disabled-State (`opacity-40`)
- "Alles löschen" Button (rot, rechts/unten)
- Layout-Toggle Button (⇅/⇆)
- `layout === 'vertikal'`: `flex-col` statt `flex-row`, Tool-Gruppen untereinander
- Dark Mode: `dark:` Klassen auf allen Elementen
- Touch-Targets: min 44×44px auf allen Buttons
- Keyboard: Tab-Navigation zwischen Tools

- [ ] **Step 2: TypeScript-Check**

Run: `cd Pruefung && npx tsc --noEmit`
Expected: 0 Fehler

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/zeichnen/ZeichnenToolbar.tsx
git commit -m "feat: Zeichnen — Toolbar-Komponente (horizontal/vertikal)"
```

---

## Task 5: Canvas-Komponente

**Files:**
- Create: `src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`

- [ ] **Step 1: ZeichnenCanvas erstellen**

Verantwortung: Canvas-Element rendern, Drawing Engine + Pointer Events integrieren, Hintergrundbild laden, Text-Eingabe-Overlay.

Props:
```typescript
interface ZeichnenCanvasProps {
  canvasConfig: CanvasConfig;
  initialDaten?: string;  // JSON-String aus gespeicherter Antwort
  onDatenChange: (daten: string) => void;  // Debounced callback
  onPNGExport: (png: string) => void;      // Callback für PNG
  disabled: boolean;
}
```

Implementiere:
- `<canvas>` Element mit logischer Breite/Höhe
- CSS: `width: 100%; max-width: ${breite}px` für responsive Skalierung
- `devicePixelRatio` Handling: Canvas-Attribut-Grösse = logisch × DPR, CSS-Grösse = logisch
- Hintergrundbild laden via `new Image()` + `onload` → an Drawing Engine übergeben
- Pointer Events Hook anbinden → Tool-spezifische Handler:
  - **Auswahl:** onStart = hitTest → selektiere, onMove = verschiebe, onEnd = fixiere
  - **Stift/Radierer:** onStart = neuer Command, onMove = Punkt hinzufügen, onEnd = Command finalisieren
  - **Linie/Pfeil/Rechteck:** onStart = Startpunkt, onMove = Preview (aktiverCommand), onEnd = Command finalisieren
  - **Text:** onClick = Textfeld-Overlay anzeigen (HTML `<input>` über Canvas positioniert), Enter = Text-Command erstellen
- Render-Loop: `requestAnimationFrame` bei aktiverCommand, sonst nur bei State-Änderung
- Keyboard-Events: Ctrl+Z (Undo), Ctrl+Y (Redo), Delete (lösche Selektion), Escape (deselektiere)
- Auto-Resize: `ResizeObserver` für Container-Grössenänderung → CSS-Breite anpassen

- [ ] **Step 2: TypeScript-Check**

Run: `cd Pruefung && npx tsc --noEmit`
Expected: 0 Fehler

- [ ] **Step 3: Commit**

```bash
git add src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx
git commit -m "feat: Zeichnen — Canvas-Komponente (Rendering, Events, Text-Overlay)"
```

---

## Task 6: SuS-Ansicht (ZeichnenFrage)

**Files:**
- Create: `src/components/fragetypen/ZeichnenFrage.tsx`
- Modify: `src/components/Layout.tsx:401-432`

- [ ] **Step 1: ZeichnenFrage Komponente erstellen**

Pattern: Wie FreitextFrage.tsx — Store-Integration, Debounced Auto-Save, Fragenwechsel-Sync.

```typescript
import { usePruefungStore } from '../../store/pruefungStore';
import type { VisualisierungFrage } from '../../types/fragen';
import { ZeichnenCanvas } from './zeichnen/ZeichnenCanvas';
import { ZeichnenToolbar } from './zeichnen/ZeichnenToolbar';
import { STANDARD_FARBEN, GROESSE_PRESETS } from './zeichnen/ZeichnenTypes';
import type { Tool, ToolbarLayout } from './zeichnen/ZeichnenTypes';

interface Props {
  frage: VisualisierungFrage;
}
```

Implementiere:
- Store: `antworten`, `setAntwort`, `abgegeben` aus usePruefungStore
- Toolbar-State: `aktivesTool`, `aktiveFarbe`, `toolbarLayout` (auto + localStorage)
- Auto-Layout: `window.innerWidth / window.innerHeight > 1.2 ? 'horizontal' : 'vertikal'`
- Debounced Save (2s): Commands-JSON → `setAntwort(frage.id, { typ: 'visualisierung', daten })`
- PNG-Export: Nur bei Fragenwechsel, Abgabe, oder 10s Inaktivität → `bildLink`
- Fragenwechsel-Sync: `useEffect([frage.id])` → Canvas mit gespeicherten Daten laden
- Layout: Badges → Fragetext → Toolbar → Canvas → Status-Zeile
- Readonly wenn `abgegeben`: Toolbar ausblenden, Canvas disabled
- Datengrösse-Check: Warnung bei >40'000 Zeichen, Fallback bei >50'000

- [ ] **Step 2: Layout.tsx — Case hinzufügen**

In `src/components/Layout.tsx`, nach dem Import-Block (Zeile ~27) hinzufügen:
```typescript
import ZeichnenFrage from './fragetypen/ZeichnenFrage';
```

Im Switch (Zeile ~430, vor `default`):
```typescript
case 'visualisierung':
  if ((frage as VisualisierungFrage).untertyp === 'zeichnen') {
    return <ZeichnenFrage frage={frage as VisualisierungFrage} />
  }
  return (
    <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-center">
      Visualisierungs-Untertyp «{(frage as VisualisierungFrage).untertyp}» wird in einer späteren Phase implementiert.
    </div>
  )
```

- [ ] **Step 3: TypeScript-Check + Build**

Run: `cd Pruefung && npx tsc --noEmit && npm run build`
Expected: 0 Fehler

- [ ] **Step 4: Commit**

```bash
git add src/components/fragetypen/ZeichnenFrage.tsx src/components/Layout.tsx
git commit -m "feat: Zeichnen — SuS-Ansicht + Layout-Routing"
```

---

## Task 7: LP-Editor (ZeichnenEditor)

**Files:**
- Create: `src/components/lp/frageneditor/ZeichnenEditor.tsx`
- Modify: `src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx`
- Modify: `src/utils/fragenFactory.ts`

- [ ] **Step 1: ZeichnenEditor erstellen**

Konfigurationsfelder:
1. Canvas-Grösse: Dropdown (Klein/Mittel/Gross/Auto/Benutzerdefiniert) + optionale Breite/Höhe-Felder
2. Hintergrundbild: Upload-Button → `uploadMaterial()` → Vorschau + Entfernen-Button. Formate: PNG, JPG, SVG.
3. Verfügbare Werkzeuge: Checkboxes (Stift, Linie, Pfeil, Rechteck, Text, Radierer)
4. Farben: Checkboxes für Schwarz/Rot/Blau/Grün
5. Koordinatensystem: Toggle + Achsenbeschriftung (x/y Inputs)
6. Musterlösung: Upload-Button oder "Auf Canvas zeichnen"-Button → ZeichnenCanvas im Editor-Modus
7. Vorschau: Button öffnet Canvas-Preview im SuS-Modus

Props: Erhält canvasConfig-State + Setter vom TypEditorDispatcher.

- [ ] **Step 2: TypEditorDispatcher erweitern**

In `TypEditorDispatcher.tsx`, neuen Case für `typ === 'visualisierung'` hinzufügen. State-Props für canvasConfig (breite, hoehe, werkzeuge, farben, hintergrundbild, etc.) + Setter.

- [ ] **Step 3: fragenFactory.ts erweitern**

In `erstelleFrageObjekt()`, neuen Case hinzufügen:
```typescript
case 'visualisierung':
  return {
    ...basis,
    typ: 'visualisierung',
    untertyp: typDaten.untertyp || 'zeichnen',
    fragetext: typDaten.fragetext?.trim() || '',
    canvasConfig: typDaten.canvasConfig,
    musterloesungBild: typDaten.musterloesungBild,
  } as VisualisierungFrage;
```

- [ ] **Step 4: TypeScript-Check + Build**

Run: `cd Pruefung && npx tsc --noEmit && npm run build`
Expected: 0 Fehler

- [ ] **Step 5: Commit**

```bash
git add src/components/lp/frageneditor/ZeichnenEditor.tsx src/components/lp/frageneditor/sections/TypEditorDispatcher.tsx src/utils/fragenFactory.ts
git commit -m "feat: Zeichnen — LP-Editor + Factory + Dispatcher"
```

---

## Task 8: Korrektur-Ansicht

**Files:**
- Create: `src/components/lp/ZeichnenKorrektur.tsx`
- Modify: `src/components/lp/KorrekturFrageZeile.tsx`
- Modify: `src/components/lp/KorrekturPDFAnsicht.tsx`
- Modify: `src/utils/exportUtils.ts`

- [ ] **Step 1: ZeichnenKorrektur erstellen**

Erstelle `src/components/lp/ZeichnenKorrektur.tsx` (neben den bestehenden Korrektur-Komponenten).

Vier Korrektur-Wege in einer Komponente:

1. **Bild-Anzeige:** SuS-Zeichnung als PNG laden (aus `bildLink` oder on-the-fly aus `daten` rendern via off-screen Canvas)
2. **Textfeld-Kommentar:** `<textarea>` für LP-Feedback-Text
3. **Sprachkommentar:** Bestehende Audio-Upload-Komponente wiederverwenden (uploadAudioKommentar)
4. **Bild-Annotation:** ZeichnenCanvas im Overlay-Modus über dem SuS-Bild. Standardfarbe Rot. LP-Annotationen separat in localStorage (`korrektur-annotation-{pruefungId}-{frageId}-{email}`)
5. **KI-Vorschlag:** Button "KI-Vorschlag" → `kiAssistent(email, 'korrigiereZeichnung', { bild, fragetext, musterloesungBild, maxPunkte })` → Ergebnis anzeigen (Punkte + Begründung) → "Übernehmen"-Button. **Rate-Limit:** State `kiVorschlagGeladen: boolean` — Button nach erfolgreichem Aufruf deaktiviert. "Erneut"-Option nur bei Fehler.
6. **Punktefeld:** Numerisches Input, ggf. vorausgefüllt von KI

- [ ] **Step 2: KorrekturFrageZeile.tsx — Routing zu ZeichnenKorrektur**

In `KorrekturFrageZeile.tsx` den Dispatcher erweitern, so dass bei `frage.typ === 'visualisierung'` die `ZeichnenKorrektur`-Komponente gerendert wird (anstelle der Standard-Textanzeige). Pattern analog zu den bestehenden Fragetyp-spezifischen Darstellungen.

- [ ] **Step 3: KorrekturPDFAnsicht.tsx — PNG in PDF einbetten**

In `KorrekturPDFAnsicht.tsx` den Case für `visualisierung` erweitern: SuS-Zeichnung als `<img>` Element mit dem base64-PNG aus `bildLink` einbetten. Falls `bildLink` nicht vorhanden, aus `daten` on-the-fly rendern.

- [ ] **Step 4: exportUtils.ts verbessern**

In `antwortAlsText()` (Zeile ~298), den visualisierung-Case erweitern:
```typescript
case 'visualisierung': {
  if (antwort.bildLink) return '(Zeichnung vorhanden — siehe Anhang)'
  if (antwort.daten) {
    try {
      const commands = JSON.parse(antwort.daten);
      return `(Zeichnung: ${commands.length} Elemente)`;
    } catch { return '(Zeichnung vorhanden)'; }
  }
  return '(keine Eingabe)';
}
```

- [ ] **Step 3: TypeScript-Check + Build**

Run: `cd Pruefung && npx tsc --noEmit && npm run build`
Expected: 0 Fehler

- [ ] **Step 4: Commit**

```bash
git add src/components/lp/ZeichnenKorrektur.tsx src/components/lp/KorrekturFrageZeile.tsx src/components/lp/KorrekturPDFAnsicht.tsx src/utils/exportUtils.ts
git commit -m "feat: Zeichnen — Korrektur-Ansicht (Text, Audio, Annotation, KI, PDF)"
```

---

## Task 9: Apps Script — KI-Korrektur

**Files:**
- Modify: `apps-script-code.js`

- [ ] **Step 1: korrigiereZeichnung Aktion hinzufügen**

Im `kiAssistentEndpoint` Switch-Block (nach den bestehenden Cases):

```javascript
case 'korrigiereZeichnung': {
  var bild = daten.bild;           // base64 PNG
  var fragetext = daten.fragetext;
  var musterloesungBild = daten.musterloesungBild || null;
  var maxPunkte = daten.maxPunkte || 1;

  var sysPrompt = 'Du bist ein erfahrener Prüfungskorrektor an einem Schweizer Gymnasium. ' +
    'Bewerte die folgende Zeichnung/Beschriftung eines Schülers. ' +
    'Antworte ausschliesslich als JSON: { "punkte": number, "begruendung": string }';

  var userPrompt = 'Frage: ' + fragetext + '\n' +
    'Maximale Punkte: ' + maxPunkte + '\n' +
    (musterloesungBild ? 'Eine Musterlösung ist als zweites Bild beigefügt.\n' : '') +
    'Bewerte Vollständigkeit, Korrektheit und Qualität.';

  // Claude Vision API mit Bild(ern)
  var messages = [{
    role: 'user',
    content: [
      { type: 'text', text: userPrompt },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: bild } }
    ]
  }];

  if (musterloesungBild) {
    messages[0].content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: musterloesungBild }
    });
  }

  var ergebnis = rufeClaudeAufMitBild(sysPrompt, messages);

  // Punkte clampen auf [0, maxPunkte]
  if (ergebnis && typeof ergebnis.punkte === 'number') {
    ergebnis.punkte = Math.max(0, Math.min(maxPunkte, ergebnis.punkte));
  }
  // Begründung kürzen auf 500 Zeichen
  if (ergebnis && ergebnis.begruendung && ergebnis.begruendung.length > 500) {
    ergebnis.begruendung = ergebnis.begruendung.substring(0, 497) + '...';
  }

  return jsonResponse({ success: true, ergebnis: ergebnis });
}
```

- [ ] **Step 2: rufeClaudeAufMitBild Funktion erstellen**

Die bestehende `rufeClaudeAuf` sendet nur Text. Für Vision brauchen wir eine Variante die `content`-Arrays mit Bildern unterstützt. Füge diese Funktion in `apps-script-code.js` hinzu (neben der bestehenden `rufeClaudeAuf`):

```javascript
function rufeClaudeAufMitBild(systemPrompt, messages) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  var payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  };

  try {
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var json = JSON.parse(response.getContentText());
    if (json.error) {
      Logger.log('Claude API Fehler: ' + JSON.stringify(json.error));
      return null;
    }

    var textContent = json.content.find(function(c) { return c.type === 'text'; });
    if (!textContent) return null;

    // JSON aus Antwort extrahieren (Claude gibt manchmal Text drumherum)
    var cleaned = textContent.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      Logger.log('JSON-Parse-Fehler bei KI-Antwort: ' + cleaned);
      return { punkte: 0, begruendung: 'KI-Vorschlag konnte nicht generiert werden.' };
    }
  } catch (e) {
    Logger.log('API-Aufruf fehlgeschlagen: ' + e.message);
    return null;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add Pruefung/apps-script-code.js
git commit -m "feat: Zeichnen — Apps Script KI-Korrektur (korrigiereZeichnung + Vision)"
```

**⚠️ Wichtig:** Nach dem Push muss der User den Code manuell in den Apps Script Editor kopieren und eine neue Bereitstellung erstellen.

---

## Task 10: Integration & Manueller Test

- [ ] **Step 1: Vollständiger Build**

```bash
cd Pruefung && npx tsc --noEmit && npm run build
```
Expected: 0 Fehler, Build erfolgreich

- [ ] **Step 2: Dev-Server starten und manuell testen**

```bash
cd Pruefung && npm run dev
```

Testplan:
1. LP-Ansicht: Neue Prüfung → Frage hinzufügen → Typ "Visualisierung/Zeichnen" wählen
2. Canvas-Config: Grösse-Preset wählen, Hintergrundbild hochladen, Werkzeuge einschränken
3. Vorschau: Canvas testen (Stift, Formen, Text, Farben, Undo/Redo)
4. SuS-Ansicht: Demo-Modus → Zeichnen-Frage → alle Tools testen
5. Toolbar-Toggle: Horizontal ↔ Vertikal
6. Fragenwechsel: Zur nächsten Frage und zurück → Zeichnung muss erhalten sein
7. Abgabe: Nach Abgabe → Canvas readonly, Toolbar weg
8. Korrektur: LP sieht SuS-Zeichnung → Text-Kommentar → KI-Vorschlag testen
9. Keyboard: Ctrl+Z, Ctrl+Y, Delete, Escape
10. Dark Mode: Canvas bleibt weiss, Toolbar adaptiert, Farben unverändert
11. Datengrösse: Viele Freihand-Striche zeichnen → Warnung bei >40k Zeichen prüfen
12. PNG-Export-Timing: PNG nur bei Fragenwechsel/Abgabe/10s Inaktivität (nicht bei jedem Auto-Save)
13. PDF-Export: Korrektur-PDF enthält SuS-Zeichnung als Bild
14. KI-Rate-Limit: Button nach Aufruf deaktiviert, "Erneut" nur bei Fehler
15. Responsive: Fenster verkleinern → Canvas skaliert, Toolbar wechselt Layout

- [ ] **Step 3: Finaler Commit + Push**

```bash
git add -A && git commit -m "feat: Zeichnen-Fragetyp komplett (SuS + LP + Korrektur + KI)" && git push
```

- [ ] **Step 4: HANDOFF.md aktualisieren**

Neue Session dokumentieren mit:
- Alle neuen Dateien auflisten
- Alle geänderten Dateien auflisten
- Hinweis: Apps Script manuell deployen
