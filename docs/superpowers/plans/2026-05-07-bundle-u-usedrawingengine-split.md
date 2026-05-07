# Bundle U — useDrawingEngine Pure-Logic-Cut Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `useDrawingEngine.ts` (752 Z., **hoch-Risiko**) per 4 Pure-Logic-Sub-Files zerlegen, ohne Verhaltensänderung. Ziel: ~140 Z. im Hauptfile (nur React-Hook). Hotspot-Bilanz Code-Files (>500 Z., ohne data/test) **12 → 11**. Coverage-Lücke: erstmals Reducer/Geometrie/Serialisierungs-Tests (~35 neue Vitest-Tests).

**Architecture:** 4 thematisch getrennte Sub-Files (`drawingReducer.ts`, `drawingGeometrie.ts`, `drawingRendering.ts`, `drawingSerialisierung.ts`) co-located in existing `zeichnen/`-Folder analog Bundle T.d. Hook bleibt als idiomatischer React-Hook (useReducer + useCallback-Wrapper). Pure-Logic byte-identisch übernommen, kein Re-Implement.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest. Co-Location-Konvention aus Bundle T.d (Merge 2026-05-07).

**Spec:** [`docs/superpowers/specs/2026-05-07-bundle-u-usedrawingengine-split-design.md`](../specs/2026-05-07-bundle-u-usedrawingengine-split-design.md)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree:** `.worktrees/bundle-u-usedrawingengine` (von main `a84f1e4`)

**Branch:** `feature/bundle-u-usedrawingengine-split` (bereits angelegt; Spec auf Branch committed: `3adbb5e`)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log` — IMMER Output prüfen (Lehre `feedback_tsc_b_exit_misleading`)

**Vitest-Baseline:** **1357 passed | 4 todo** (gemessen 2026-05-07 nach `npm run setup`). Drift-Erwartung **+35** (15 reducer + 15 geometrie + 5 serialisierung) → **1392** nach Phase 4.

---

## File Map

### Neue Files

| Datei | Größe | Verantwortung |
|---|---:|---|
| `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts` | ~160 Z. | `CanvasAction`-Type, `initialState`, `verschiebePoint`, `verschiebeCommand`, `canvasReducer` |
| `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts` | ~270 Z. | 15 Vitest-Tests für alle 11 Action-Types + Edge-Cases + verschiebeCommand pro Sub-Type |
| `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts` | ~210 Z. | `vereinfachePunkte` (RDP), `punktZuLinieAbstand`, `punktAbstandZuSegment`, `findeCommandBeiPunkt`, `berechneBoundingBox` |
| `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts` | ~250 Z. | 15 Vitest-Tests (RDP, Hit-Testing pro DrawCommand-Typ, bbox) |
| `ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts` | ~280 Z. | `zeichnePfeilspitze`, `zeichneCommand`, `renderCanvas` (kein Vitest) |
| `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts` | ~30 Z. | `rundePoint`, `serializiereCommand` |
| `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts` | ~80 Z. | 5 Vitest-Tests (Roundtrip, Druck-Property, Stift-RDP-Coupling) |

### Geänderte Files

| Datei | Heute | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts` | 752 Z. | ~140 Z. | Pure-Logic raus, nur React-Hook bleibt; Re-Export-Zeile entfällt |
| `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx` | 517 Z. | 517 Z. | Z. 5 Import: `findeCommandBeiPunkt` aus `./drawingGeometrie` |

### Reihenfolge (Risiko-aufsteigend, Phase-Dependencies enforced)

1. **Phase 1**: `drawingReducer.ts` + Tests (kein Cross-File-Import → atomar)
2. **Phase 2**: `drawingGeometrie.ts` + Tests (RDP + Hit + bbox; Vorbedingung für Phase 3 + 4)
3. **Phase 3**: `drawingSerialisierung.ts` + Tests (importiert `vereinfachePunkte` aus Phase 2)
4. **Phase 4**: `drawingRendering.ts` (importiert `berechneBoundingBox` aus Phase 2; kein Test)
5. **Phase 5**: `useDrawingEngine.ts` slim + `ZeichnenCanvas.tsx` Z. 5 Import — atomarer Commit
6. **Phase 6**: Lint-Gates + Build verify
7. **Phase 7**: Browser-E2E auf staging (User-manual)
8. **Phase 8**: Final Code-Reviewer + HANDOFF + Memory + Merge

---

## Phase 0: Branch-Setup

### Task 0.1: Branch und Worktree sicherstellen

- [ ] **Step 1: cd in Worktree**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-u-usedrawingengine"
git status
```

Expected: `On branch feature/bundle-u-usedrawingengine-split`. Working tree clean (Spec ist bereits committed: `3adbb5e`).

(Memory-Regel `feedback_subagent_shell_context`: Implementer-Subagents müssen explizit `cd` ins Worktree-Verzeichnis machen — Master-Shell-Context wird nicht automatisch durchgegeben.)

- [ ] **Step 2: Vitest-Baseline verifizieren**

```bash
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: `Test Files  170 passed | 1 skipped (171)` und `Tests  1357 passed | 4 todo (1361)`.

---

## Phase 1: `drawingReducer.ts` (extract Reducer + Helpers)

### Task 1.1: drawingReducer.ts erstellen

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts`

- [ ] **Step 1: File schreiben (byte-identisch aus useDrawingEngine.ts Z. 43-194)**

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

function verschiebePoint(p: Point, dx: number, dy: number): Point {
  return { ...p, x: Math.round((p.x + dx) * 10) / 10, y: Math.round((p.y + dy) * 10) / 10 };
}

export function verschiebeCommand(cmd: DrawCommand, dx: number, dy: number): DrawCommand {
  // byte-identisch übernommen aus useDrawingEngine.ts Z. 75-89
  switch (cmd.typ) {
    case 'stift':
    case 'radierer':
      return { ...cmd, punkte: cmd.punkte.map(p => verschiebePoint(p, dx, dy)) };
    case 'linie':
    case 'pfeil':
      return { ...cmd, von: verschiebePoint(cmd.von, dx, dy), bis: verschiebePoint(cmd.bis, dx, dy) };
    case 'rechteck':
    case 'ellipse':
      return { ...cmd, von: verschiebePoint(cmd.von, dx, dy), bis: verschiebePoint(cmd.bis, dx, dy) };
    case 'text':
      return { ...cmd, position: verschiebePoint(cmd.position, dx, dy) };
  }
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  // byte-identisch übernommen aus useDrawingEngine.ts Z. 95-194
  // Alle 11 Action-Types: ADD_COMMAND (mit MAX_UNDO_TIEFE-Window), SET_AKTIVER, UNDO,
  // REDO, CLEAR, SELECT, DELETE_SELECTED, DELETE_BY_ID, MOVE_SELECTED, UPDATE_COMMAND, LOAD.
  // (Vollständiger Body: copy aus Source ohne Änderungen.)
  // ... 100 Zeilen ...
}
```

**Wichtig:** Body byte-identisch aus useDrawingEngine.ts kopieren. Keine Logik-Änderung. `verschiebePoint` bleibt nicht-exportiert (interner Helper); `verschiebeCommand` wird exportiert (Test-bar als Sub-Type-Discriminator).

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log
```

Expected: PASS (no errors related to drawingReducer.ts).

- [ ] **Step 3: Hook noch nicht anpassen** — Phase 1.3 macht das (vermeidet Inkonsistenz, falls Tests fehlschlagen).

### Task 1.2: drawingReducer.test.ts schreiben (15 Tests)

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts
import { describe, expect, it } from 'vitest';
import { canvasReducer, initialState, verschiebeCommand } from './drawingReducer';
import type { CanvasState, DrawCommand } from './ZeichnenTypes';
import { MAX_UNDO_TIEFE, generiereCommandId } from './ZeichnenTypes';

function mkStift(id?: string): DrawCommand {
  return {
    id: id ?? generiereCommandId(),
    typ: 'stift',
    punkte: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    farbe: '#000',
    breite: 2,
  };
}

function mkLinie(id?: string): DrawCommand {
  return {
    id: id ?? generiereCommandId(),
    typ: 'linie',
    von: { x: 0, y: 0 },
    bis: { x: 100, y: 100 },
    farbe: '#000',
    breite: 2,
  };
}

describe('canvasReducer', () => {
  it('ADD_COMMAND fügt Command an commands-Array', () => {
    const cmd = mkStift();
    const next = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd });
    expect(next.commands).toEqual([cmd]);
    expect(next.redoStack).toEqual([]);
    expect(next.aktiverCommand).toBeNull();
  });

  it('ADD_COMMAND respektiert MAX_UNDO_TIEFE-Window (slice älteste raus)', () => {
    let state: CanvasState = initialState;
    for (let i = 0; i < MAX_UNDO_TIEFE + 5; i++) {
      state = canvasReducer(state, { type: 'ADD_COMMAND', command: mkStift(`s${i}`) });
    }
    expect(state.commands.length).toBe(MAX_UNDO_TIEFE);
    expect(state.commands[0].id).toBe(`s5`); // erste 5 abgeschnitten
  });

  it('SET_AKTIVER setzt aktiverCommand', () => {
    const cmd = mkStift();
    const next = canvasReducer(initialState, { type: 'SET_AKTIVER', command: cmd });
    expect(next.aktiverCommand).toEqual(cmd);
  });

  it('UNDO auf leerem commands-Array → no-op', () => {
    const next = canvasReducer(initialState, { type: 'UNDO' });
    expect(next).toBe(initialState);
  });

  it('UNDO verschiebt letzten Command auf redoStack, clear Selektion', () => {
    const cmd1 = mkStift('s1');
    const cmd2 = mkStift('s2');
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd1 });
    state = canvasReducer(state, { type: 'ADD_COMMAND', command: cmd2 });
    state = canvasReducer(state, { type: 'SELECT', id: 's2' });
    const undone = canvasReducer(state, { type: 'UNDO' });
    expect(undone.commands).toEqual([cmd1]);
    expect(undone.redoStack).toEqual([cmd2]);
    expect(undone.selektierterCommand).toBeNull();
  });

  it('REDO auf leerem redoStack → no-op', () => {
    const next = canvasReducer(initialState, { type: 'REDO' });
    expect(next).toBe(initialState);
  });

  it('REDO verschiebt letzten Command von redoStack zurück zu commands', () => {
    const cmd = mkStift();
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd });
    state = canvasReducer(state, { type: 'UNDO' });
    const redone = canvasReducer(state, { type: 'REDO' });
    expect(redone.commands).toEqual([cmd]);
    expect(redone.redoStack).toEqual([]);
  });

  it('CLEAR setzt initialState zurück', () => {
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: mkStift() });
    state = canvasReducer(state, { type: 'SELECT', id: 'foo' });
    const cleared = canvasReducer(state, { type: 'CLEAR' });
    expect(cleared).toEqual(initialState);
  });

  it('SELECT setzt selektierterCommand', () => {
    const next = canvasReducer(initialState, { type: 'SELECT', id: 'abc' });
    expect(next.selektierterCommand).toBe('abc');
  });

  it('DELETE_SELECTED ohne Selektion → no-op', () => {
    const next = canvasReducer(initialState, { type: 'DELETE_SELECTED' });
    expect(next).toBe(initialState);
  });

  it('DELETE_SELECTED entfernt selektierten Command + push auf redoStack', () => {
    const cmd = mkStift('s1');
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd });
    state = canvasReducer(state, { type: 'SELECT', id: 's1' });
    const deleted = canvasReducer(state, { type: 'DELETE_SELECTED' });
    expect(deleted.commands).toEqual([]);
    expect(deleted.redoStack).toEqual([cmd]);
    expect(deleted.selektierterCommand).toBeNull();
  });

  it('DELETE_BY_ID entfernt nur den ID-Match', () => {
    const cmd1 = mkStift('s1');
    const cmd2 = mkStift('s2');
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd1 });
    state = canvasReducer(state, { type: 'ADD_COMMAND', command: cmd2 });
    const deleted = canvasReducer(state, { type: 'DELETE_BY_ID', id: 's1' });
    expect(deleted.commands).toEqual([cmd2]);
    expect(deleted.redoStack).toEqual([cmd1]);
  });

  it('DELETE_BY_ID mit nicht-existenter ID → no-op', () => {
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: mkStift('s1') });
    const next = canvasReducer(state, { type: 'DELETE_BY_ID', id: 'doesnotexist' });
    expect(next).toBe(state);
  });

  it('MOVE_SELECTED ohne Selektion → no-op', () => {
    const next = canvasReducer(initialState, { type: 'MOVE_SELECTED', dx: 5, dy: 5 });
    expect(next).toBe(initialState);
  });

  it('UPDATE_COMMAND erhält id+typ aus Original (auch bei updates-override)', () => {
    const cmd = mkStift('s1');
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd });
    const updated = canvasReducer(state, {
      type: 'UPDATE_COMMAND',
      id: 's1',
      updates: { id: 'fake', typ: 'linie', farbe: '#f00' } as Partial<DrawCommand>,
    });
    expect(updated.commands[0].id).toBe('s1');
    expect(updated.commands[0].typ).toBe('stift');
    expect(updated.commands[0].farbe).toBe('#f00');
  });

  it('LOAD ersetzt commands-Array, redo+aktiver+selektiert reset', () => {
    let state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: mkStift() });
    state = canvasReducer(state, { type: 'SELECT', id: 'foo' });
    const replacement = [mkStift('a'), mkLinie('b')];
    const loaded = canvasReducer(state, { type: 'LOAD', commands: replacement });
    expect(loaded.commands).toEqual(replacement);
    expect(loaded.redoStack).toEqual([]);
    expect(loaded.aktiverCommand).toBeNull();
    expect(loaded.selektierterCommand).toBeNull();
  });
});

describe('verschiebeCommand', () => {
  it('verschiebt stift-Punkte mit Math.round 0.1-Präzision', () => {
    const cmd = mkStift();
    const moved = verschiebeCommand(cmd, 5, 5);
    expect(moved.typ).toBe('stift');
    if (moved.typ === 'stift') {
      expect(moved.punkte).toEqual([{ x: 5, y: 5 }, { x: 15, y: 15 }]);
    }
  });

  it('verschiebt linie/pfeil/rechteck/ellipse von+bis', () => {
    const moved = verschiebeCommand(mkLinie(), 10, 0);
    expect(moved.typ).toBe('linie');
    if (moved.typ === 'linie') {
      expect(moved.von).toEqual({ x: 10, y: 0 });
      expect(moved.bis).toEqual({ x: 110, y: 100 });
    }
  });

  it('verschiebt text-position', () => {
    const cmd: DrawCommand = {
      id: 't1',
      typ: 'text',
      position: { x: 50, y: 50 },
      text: 'Hi',
      farbe: '#000',
      groesse: 18,
    };
    const moved = verschiebeCommand(cmd, -10, -10);
    expect(moved.typ).toBe('text');
    if (moved.typ === 'text') {
      expect(moved.position).toEqual({ x: 40, y: 40 });
    }
  });
});
```

- [ ] **Step 2: Tests laufen lassen**

```bash
cd ExamLab && npx vitest run drawingReducer 2>&1 | tail -20
```

Expected: `Tests  18 passed (18)` (15 reducer + 3 verschiebeCommand). Falls 15-18 erwartet, bei Test-Schreib-Drift Test-Anzahl im DoD-Counter (§8 Spec) und HANDOFF anpassen.

### Task 1.3: useDrawingEngine.ts auf neuen Reducer umstellen (Vorzieh-Cut)

- [ ] **Step 1: Hook-Imports anpassen**

Modify: `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts`

Z. 1-3 (Imports) ergänzen:
```typescript
import { canvasReducer, initialState, type CanvasAction } from './drawingReducer';
```

Z. 43-54 (CanvasAction-Type), Z. 60-65 (initialState), Z. 71-89 (verschiebePoint+verschiebeCommand), Z. 95-194 (canvasReducer) löschen.

(Section-Banner-Kommentare können bleiben oder wegfallen — hängt vom Stil. Empfehlung: Banner für „Reducer-Aktionen", „Initialer Zustand", „Reducer", „Hilfsfunktionen für MOVE_SELECTED" entfallen, weil Sektionen leer.)

- [ ] **Step 2: Verifikation**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected:
- tsc clean
- vitest: `Tests  1375 passed | 4 todo (1379)` (1357 baseline + 18 neue)

### Task 1.4: Phase 1 Commit

- [ ] **Step 1: Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-u-usedrawingengine"
git add ExamLab/src/components/fragetypen/zeichnen/drawingReducer.ts \
        ExamLab/src/components/fragetypen/zeichnen/drawingReducer.test.ts \
        ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
Bundle U Phase 1: drawingReducer extrahiert

- Reducer (canvasReducer + initialState + verschiebePoint + verschiebeCommand)
  byte-identisch nach drawingReducer.ts (~160 Z.)
- 18 Vitest-Tests (11 Action-Types + Edge-Cases + verschiebeCommand pro Typ)
- useDrawingEngine.ts importiert nun canvasReducer + initialState

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2: `drawingGeometrie.ts` (extract RDP + Hit-Testing + bbox)

### Task 2.1: drawingGeometrie.ts erstellen

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts`

- [ ] **Step 1: File schreiben (byte-identisch aus useDrawingEngine.ts Z. 197-339 + Z. 506-552)**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts
import type { DrawCommand, Point, CommandId } from './ZeichnenTypes';

// ============================================================
// RDP-Algorithmus (Ramer-Douglas-Peucker)
// ============================================================

function punktZuLinieAbstand(punkt: Point, start: Point, end: Point): number {
  // byte-identisch aus useDrawingEngine.ts Z. 200-213
  // ... 14 Zeilen ...
}

/** Toleranz 0.8: Kompromiss — genug Vereinfachung für Speicher, behält Stift-Details bei iPad-Stylus. */
export function vereinfachePunkte(punkte: Point[], toleranz = 0.8): Point[] {
  // byte-identisch aus useDrawingEngine.ts Z. 217-241
  // ... 25 Zeilen ...
}

// ============================================================
// Hit-Testing
// ============================================================

function punktAbstandZuSegment(p: Point, a: Point, b: Point): number {
  // byte-identisch aus useDrawingEngine.ts Z. 247-265
  // ... 19 Zeilen ...
}

export function findeCommandBeiPunkt(commands: DrawCommand[], punkt: Point): CommandId | null {
  // byte-identisch aus useDrawingEngine.ts Z. 267-339
  // Wichtig: Touch-Detection via 'ontouchstart' in window — wird zur Aufruf-Zeit evaluiert.
  // ... 73 Zeilen ...
}

// ============================================================
// Bounding-Box (für Selektion)
// ============================================================

export function berechneBoundingBox(
  cmd: DrawCommand,
): { x: number; y: number; breite: number; hoehe: number } | null {
  // byte-identisch aus useDrawingEngine.ts Z. 506-552
  // ... 47 Zeilen ...
}
```

**Wichtig:** Bodies byte-identisch kopieren. `punktZuLinieAbstand` und `punktAbstandZuSegment` bleiben nicht-exportiert (interne Helpers).

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
```

Expected: PASS.

### Task 2.2: drawingGeometrie.test.ts schreiben (15 Tests)

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { vereinfachePunkte, findeCommandBeiPunkt, berechneBoundingBox } from './drawingGeometrie';
import type { DrawCommand, Point } from './ZeichnenTypes';

const mkPoint = (x: number, y: number): Point => ({ x, y });

afterEach(() => {
  vi.unstubAllGlobals();
});

function withTouch(istTouch: boolean) {
  // 'ontouchstart' in window: simuliert via stubGlobal('ontouchstart', ...)
  if (istTouch) vi.stubGlobal('ontouchstart', null);
  // bei false nichts tun — afterEach räumt auf
}

describe('vereinfachePunkte (RDP)', () => {
  it('Linie mit ≤2 Punkten → unverändert', () => {
    expect(vereinfachePunkte([])).toEqual([]);
    expect(vereinfachePunkte([mkPoint(0, 0)])).toEqual([mkPoint(0, 0)]);
    expect(vereinfachePunkte([mkPoint(0, 0), mkPoint(10, 10)])).toEqual([mkPoint(0, 0), mkPoint(10, 10)]);
  });

  it('5 kollineare Punkte → reduziert auf [start, end]', () => {
    const result = vereinfachePunkte([
      mkPoint(0, 0), mkPoint(2, 2), mkPoint(4, 4), mkPoint(6, 6), mkPoint(10, 10),
    ]);
    expect(result).toEqual([mkPoint(0, 0), mkPoint(10, 10)]);
  });

  it('Linie mit Knick > Toleranz → behält Knick-Punkt', () => {
    const result = vereinfachePunkte([
      mkPoint(0, 0), mkPoint(5, 5), mkPoint(10, 0),
    ]);
    expect(result).toEqual([mkPoint(0, 0), mkPoint(5, 5), mkPoint(10, 0)]);
  });

  it('Mikro-Wackler unter Toleranz → wackler entfernt', () => {
    const result = vereinfachePunkte([
      mkPoint(0, 0), mkPoint(5, 0.1), mkPoint(10, 0),  // 0.1 < 0.8 toleranz
    ]);
    expect(result).toEqual([mkPoint(0, 0), mkPoint(10, 0)]);
  });

  it('Custom-Toleranz wird respektiert', () => {
    const points = [mkPoint(0, 0), mkPoint(5, 0.5), mkPoint(10, 0)];
    expect(vereinfachePunkte(points, 0.1)).toEqual(points); // 0.5 > 0.1 → behält
    expect(vereinfachePunkte(points, 1.0)).toEqual([mkPoint(0, 0), mkPoint(10, 0)]); // 0.5 < 1.0 → entfernt
  });
});

describe('findeCommandBeiPunkt (Hit-Testing)', () => {
  function mkRechteck(id: string, von: Point, bis: Point): DrawCommand {
    return { id, typ: 'rechteck', von, bis, farbe: '#000', breite: 2 };
  }
  function mkLinie(id: string, von: Point, bis: Point): DrawCommand {
    return { id, typ: 'linie', von, bis, farbe: '#000', breite: 2 };
  }
  function mkText(id: string, position: Point, rotation = 0): DrawCommand {
    return { id, typ: 'text', position, text: 'Hi', farbe: '#000', groesse: 18, rotation: rotation || undefined };
  }
  function mkStift(id: string, punkte: Point[]): DrawCommand {
    return { id, typ: 'stift', punkte, farbe: '#000', breite: 2 };
  }

  it('rechteck/ellipse: bbox-inclusion (innerhalb → match)', () => {
    const cmds = [mkRechteck('r1', mkPoint(0, 0), mkPoint(100, 100))];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 50))).toBe('r1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(200, 200))).toBeNull();
  });

  it('linie: Maus-Toleranz 8px', () => {
    withTouch(false);
    const cmds = [mkLinie('l1', mkPoint(0, 0), mkPoint(100, 0))];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 5))).toBe('l1'); // 5 < 8
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 20))).toBeNull(); // 20 > 8
  });

  it('linie: Touch-Toleranz 16px', () => {
    withTouch(true);
    const cmds = [mkLinie('l1', mkPoint(0, 0), mkPoint(100, 0))];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 12))).toBe('l1'); // 12 < 16
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 20))).toBeNull(); // 20 > 16
  });

  it('text ohne Rotation: rechteck-bbox-Hit', () => {
    const cmds = [mkText('t1', mkPoint(50, 50))];
    // textBreite = 18 * 0.6 * 2 = 21.6, textHoehe = 18 → bbox: x=50..71.6, y=32..50
    expect(findeCommandBeiPunkt(cmds, mkPoint(60, 40))).toBe('t1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(100, 100))).toBeNull();
  });

  it('text mit Rotation: rotated bbox-Hit', () => {
    const cmds = [mkText('t1', mkPoint(50, 50), 90)];
    // bei 90° rotiert um position: dasjenige Klick-Pixel wird invers gedreht
    // Punkt direkt am position-Ursprung → muss matchen
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 50))).toBe('t1');
  });

  it('stift: jedes Polyline-Segment getestet', () => {
    withTouch(false);
    const cmds = [mkStift('s1', [mkPoint(0, 0), mkPoint(50, 0), mkPoint(100, 100)])];
    expect(findeCommandBeiPunkt(cmds, mkPoint(25, 0))).toBe('s1'); // erstes Segment
    expect(findeCommandBeiPunkt(cmds, mkPoint(75, 50))).toBe('s1'); // zweites Segment
    expect(findeCommandBeiPunkt(cmds, mkPoint(200, 200))).toBeNull();
  });

  it('stift mit nur 1 Punkt: Single-Punkt-Fallback', () => {
    withTouch(false);
    const cmds = [mkStift('s1', [mkPoint(50, 50)])];
    expect(findeCommandBeiPunkt(cmds, mkPoint(53, 53))).toBe('s1'); // ~4px < 8
    expect(findeCommandBeiPunkt(cmds, mkPoint(70, 70))).toBeNull();
  });

  it('iteriert von oben (zuletzt gezeichnet) zuerst', () => {
    const cmds = [
      mkRechteck('r1', mkPoint(0, 0), mkPoint(100, 100)),
      mkRechteck('r2', mkPoint(0, 0), mkPoint(100, 100)),
    ];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 50))).toBe('r2'); // letzter im Array
  });

  it('keine commands → null', () => {
    expect(findeCommandBeiPunkt([], mkPoint(0, 0))).toBeNull();
  });
});

describe('berechneBoundingBox', () => {
  it('stift: min/max der Punkte plus PADDING', () => {
    const bb = berechneBoundingBox({
      id: 's1', typ: 'stift', punkte: [mkPoint(10, 10), mkPoint(50, 50)], farbe: '#000', breite: 2,
    });
    expect(bb).toEqual({ x: 4, y: 4, breite: 52, hoehe: 52 });
  });

  it('stift mit 0 Punkten → null', () => {
    expect(berechneBoundingBox({
      id: 's1', typ: 'stift', punkte: [], farbe: '#000', breite: 2,
    })).toBeNull();
  });

  it('linie: min/max von+bis plus PADDING', () => {
    const bb = berechneBoundingBox({
      id: 'l1', typ: 'linie', von: mkPoint(10, 10), bis: mkPoint(50, 50), farbe: '#000', breite: 2,
    });
    expect(bb).toEqual({ x: 4, y: 4, breite: 52, hoehe: 52 });
  });

  it('text: position-basiert mit Approximations-Breite', () => {
    const bb = berechneBoundingBox({
      id: 't1', typ: 'text', position: mkPoint(50, 50), text: 'Hi', farbe: '#000', groesse: 18,
    });
    // textBreite = 18 * 0.6 * 2 = 21.6; pad 6 → x=44, y=50-18-6=26, breite=21.6+12=33.6, hoehe=18+12=30
    expect(bb).toEqual({ x: 44, y: 26, breite: 33.6, hoehe: 30 });
  });
});
```

- [ ] **Step 2: Tests laufen lassen**

```bash
cd ExamLab && npx vitest run drawingGeometrie 2>&1 | tail -10
```

Expected: `Tests  18 passed (18)` (5 RDP + 9 Hit-Testing + 4 bbox = 18 in den oben definierten Tests; Spec-Schätzung war ~15, die 18 sind ok). Drift im DoD-Counter ggf. anpassen.

### Task 2.3: useDrawingEngine.ts auf drawingGeometrie umstellen

- [ ] **Step 1: Hook-Imports anpassen**

Modify: `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts`

Imports oben hinzufügen:
```typescript
import { berechneBoundingBox, vereinfachePunkte } from './drawingGeometrie';
// findeCommandBeiPunkt wird NICHT vom Hook benötigt — nur vom Konsument ZeichnenCanvas
```

Z. 197-241 (RDP), Z. 244-339 (Hit-Testing), Z. 506-552 (bbox) löschen. Section-Banner-Kommentare ggf. mit weg.

- [ ] **Step 2: Re-Export-Zeile noch nicht anfassen** — Phase 5 macht das atomar zusammen mit `findeCommandBeiPunkt`-Konsumer-Korrektur.

(Im Moment exportiert der Hook noch `findeCommandBeiPunkt, vereinfachePunkte, zeichneCommand` — `findeCommandBeiPunkt` und `vereinfachePunkte` müssten jetzt **aus drawingGeometrie** re-exportiert werden, damit ZeichnenCanvas-Z.5 weiter compiliert. Dafür Z. 752 anpassen:)

```typescript
// useDrawingEngine.ts Z. 752 (temporär in Phase 2)
export { findeCommandBeiPunkt, vereinfachePunkte } from './drawingGeometrie';
export { zeichneCommand } from './useDrawingEngine'; // bleibt, kommt in Phase 4 raus
```

- [ ] **Step 3: Verifikation**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: tsc clean. vitest: `Tests  1393 passed | 4 todo` (1375 + 18 neue).

### Task 2.4: Phase 2 Commit

- [ ] **Step 1: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.ts \
        ExamLab/src/components/fragetypen/zeichnen/drawingGeometrie.test.ts \
        ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
Bundle U Phase 2: drawingGeometrie extrahiert

- RDP (vereinfachePunkte + punktZuLinieAbstand) + Hit-Testing
  (findeCommandBeiPunkt + punktAbstandZuSegment) + berechneBoundingBox
  byte-identisch nach drawingGeometrie.ts (~210 Z.)
- 18 Vitest-Tests (RDP + Hit-Testing pro DrawCommand-Typ + bbox)
- Hook re-exportiert temporär findeCommandBeiPunkt/vereinfachePunkte aus
  drawingGeometrie, damit ZeichnenCanvas-Import weiter compiliert (atomare
  Korrektur in Phase 5)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 3: `drawingSerialisierung.ts` (extract rundePoint + serializiereCommand)

### Task 3.1: drawingSerialisierung.ts erstellen

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts`

- [ ] **Step 1: File schreiben (byte-identisch aus useDrawingEngine.ts Z. 600-628)**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts
import type { DrawCommand, Point } from './ZeichnenTypes';
import { vereinfachePunkte } from './drawingGeometrie';

export function rundePoint(p: Point): Point {
  // byte-identisch aus useDrawingEngine.ts Z. 600-608
  const gerundet: Point = {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
  };
  if (p.druck !== undefined) {
    gerundet.druck = Math.round(p.druck * 100) / 100;
  }
  return gerundet;
}

export function serializiereCommand(cmd: DrawCommand): DrawCommand {
  // byte-identisch aus useDrawingEngine.ts Z. 611-628
  switch (cmd.typ) {
    case 'stift': {
      const vereinfacht = vereinfachePunkte(cmd.punkte);
      return { ...cmd, punkte: vereinfacht.map(rundePoint) };
    }
    case 'radierer':
      return { ...cmd, punkte: cmd.punkte.map(rundePoint) };
    case 'linie':
    case 'pfeil':
      return { ...cmd, von: rundePoint(cmd.von), bis: rundePoint(cmd.bis) };
    case 'rechteck':
    case 'ellipse':
      return { ...cmd, von: rundePoint(cmd.von), bis: rundePoint(cmd.bis) };
    case 'text':
      return { ...cmd, position: rundePoint(cmd.position) };
  }
}
```

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
```

Expected: PASS.

### Task 3.2: drawingSerialisierung.test.ts schreiben (5 Tests)

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts`

- [ ] **Step 1: Test-File schreiben**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts
import { describe, expect, it } from 'vitest';
import { rundePoint, serializiereCommand } from './drawingSerialisierung';
import type { DrawCommand } from './ZeichnenTypes';

describe('rundePoint', () => {
  it('rundet x/y auf 0.1-Präzision', () => {
    expect(rundePoint({ x: 1.234, y: 5.678 })).toEqual({ x: 1.2, y: 5.7 });
    expect(rundePoint({ x: 0.05, y: 0.04 })).toEqual({ x: 0.1, y: 0 });
  });

  it('rundet druck auf 0.01-Präzision (falls vorhanden)', () => {
    expect(rundePoint({ x: 0, y: 0, druck: 0.123 })).toEqual({ x: 0, y: 0, druck: 0.12 });
  });

  it('lässt druck weg wenn undefined', () => {
    const out = rundePoint({ x: 0, y: 0 });
    expect(out).toEqual({ x: 0, y: 0 });
    expect('druck' in out).toBe(false);
  });
});

describe('serializiereCommand', () => {
  it('stift: vereinfacht Punkte (RDP) UND rundet sie', () => {
    // 5 kollineare Punkte (mit Mikro-Wacklern unter Toleranz 0.8)
    const cmd: DrawCommand = {
      id: 's1',
      typ: 'stift',
      punkte: [
        { x: 0.111, y: 0.222 },
        { x: 2.5, y: 0.5 },
        { x: 5.0, y: 0.3 },
        { x: 7.5, y: 0.7 },
        { x: 10.0, y: 0.1 },
      ],
      farbe: '#000',
      breite: 2,
    };
    const out = serializiereCommand(cmd);
    expect(out.typ).toBe('stift');
    if (out.typ === 'stift') {
      // RDP entfernt Mittelpunkte (Wackler < 0.8), bleibt: [start, end] gerundet
      expect(out.punkte).toEqual([{ x: 0.1, y: 0.2 }, { x: 10, y: 0.1 }]);
    }
  });

  it('linie/rechteck/ellipse: rundet von+bis ohne Vereinfachung', () => {
    const cmd: DrawCommand = {
      id: 'l1',
      typ: 'linie',
      von: { x: 1.234, y: 5.678 },
      bis: { x: 100.111, y: 200.999 },
      farbe: '#000',
      breite: 2,
    };
    const out = serializiereCommand(cmd);
    expect(out.typ).toBe('linie');
    if (out.typ === 'linie') {
      expect(out.von).toEqual({ x: 1.2, y: 5.7 });
      expect(out.bis).toEqual({ x: 100.1, y: 201 });
    }
  });

  it('text: rundet position', () => {
    const cmd: DrawCommand = {
      id: 't1', typ: 'text', position: { x: 12.345, y: 67.891 },
      text: 'Hi', farbe: '#000', groesse: 18,
    };
    const out = serializiereCommand(cmd);
    expect(out.typ).toBe('text');
    if (out.typ === 'text') {
      expect(out.position).toEqual({ x: 12.3, y: 67.9 });
    }
  });
});
```

- [ ] **Step 2: Tests laufen lassen**

```bash
cd ExamLab && npx vitest run drawingSerialisierung 2>&1 | tail
```

Expected: `Tests  6 passed (6)` (3 rundePoint + 3 serializiereCommand). Drift im DoD-Counter (Spec-Schätzung war ~5) anpassen.

### Task 3.3: useDrawingEngine.ts auf drawingSerialisierung umstellen

- [ ] **Step 1: Hook-Imports anpassen**

Modify: `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts`

Imports:
```typescript
import { serializiereCommand } from './drawingSerialisierung';
```

Z. 600-628 (rundePoint + serializiereCommand) löschen. Section-Banner mit weg.

- [ ] **Step 2: Verifikation**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: tsc clean. vitest: `Tests  1399 passed | 4 todo` (1393 + 6 neue).

### Task 3.4: Phase 3 Commit

- [ ] **Step 1: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.ts \
        ExamLab/src/components/fragetypen/zeichnen/drawingSerialisierung.test.ts \
        ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
Bundle U Phase 3: drawingSerialisierung extrahiert

- rundePoint + serializiereCommand byte-identisch nach
  drawingSerialisierung.ts (~30 Z.) — importiert vereinfachePunkte
  aus drawingGeometrie
- 6 Vitest-Tests (rundePoint Edge-Cases + serializiereCommand
  Stift-RDP-Coupling pro DrawCommand-Typ)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 4: `drawingRendering.ts` (extract Canvas-IO)

### Task 4.1: drawingRendering.ts erstellen

**Files:**
- Create: `ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts`

- [ ] **Step 1: File schreiben (byte-identisch aus useDrawingEngine.ts Z. 343-500 + Z. 558-594)**

```typescript
// ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts
import type { DrawCommand, CanvasState, Point } from './ZeichnenTypes';
import { berechneBoundingBox } from './drawingGeometrie';

// ============================================================
// Pfeil-Hilfsfunktion
// ============================================================

function zeichnePfeilspitze(
  ctx: CanvasRenderingContext2D,
  von: Point,
  bis: Point,
  breite: number,
): void {
  // byte-identisch aus useDrawingEngine.ts Z. 345-373
  // Wichtig: `void pfeilBreite;` Z. 372 byte-identisch übernehmen — Tot-Code-Indikator,
  // Cleanup als Spawn-Task (nicht hier).
  // ... 29 Zeilen ...
}

// ============================================================
// Einzelnen Command zeichnen
// ============================================================

export function zeichneCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void {
  // byte-identisch aus useDrawingEngine.ts Z. 379-500
  // Wichtig: ctx.save()/ctx.restore() pro Command, globalCompositeOperation für Radierer,
  // setLineDash-Toggle für gestrichelt, translate+rotate für Text-Rotation.
  // ... 122 Zeilen ...
}

// ============================================================
// Vollständiges Canvas rendern
// ============================================================

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  hintergrundbild: HTMLImageElement | null | undefined,
  breite: number,
  hoehe: number,
): void {
  // byte-identisch aus useDrawingEngine.ts Z. 558-594
  // Wichtig: clearRect → optional drawImage → state.commands.forEach(zeichneCommand)
  // → optional state.aktiverCommand → Selektions-Rahmen (#3b82f6, lineDash [5,4]).
  // ... 37 Zeilen ...
}
```

- [ ] **Step 2: tsc-Check**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
```

Expected: PASS.

### Task 4.2: useDrawingEngine.ts auf drawingRendering umstellen

- [ ] **Step 1: Hook-Imports anpassen**

Modify: `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts`

Imports:
```typescript
import { renderCanvas, zeichneCommand } from './drawingRendering';
```

Z. 343-373 (zeichnePfeilspitze), Z. 379-500 (zeichneCommand), Z. 558-594 (renderCanvas) löschen.

Re-Export-Zeile (Z. 752) zwischen-stand nach Phase 2:
```typescript
export { findeCommandBeiPunkt, vereinfachePunkte } from './drawingGeometrie';
export { zeichneCommand } from './useDrawingEngine'; // ← KAPUTT, müsste './drawingRendering' sein
```

Korrigieren:
```typescript
export { findeCommandBeiPunkt, vereinfachePunkte } from './drawingGeometrie';
export { zeichneCommand } from './drawingRendering';
```

- [ ] **Step 2: Verifikation**

```bash
cd ExamLab && npx tsc -b 2>&1 | tail
cd ExamLab && npx vitest run --reporter=dot 2>&1 | tail -5
```

Expected: tsc clean. vitest: `Tests  1399 passed` (kein Drift, drawingRendering hat keinen Test).

### Task 4.3: Phase 4 Commit

- [ ] **Step 1: Commit**

```bash
git add ExamLab/src/components/fragetypen/zeichnen/drawingRendering.ts \
        ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
Bundle U Phase 4: drawingRendering extrahiert

- zeichnePfeilspitze + zeichneCommand + renderCanvas byte-identisch
  nach drawingRendering.ts (~280 Z.) — importiert berechneBoundingBox
  aus drawingGeometrie
- Kein Vitest (Canvas-2D-API nicht in jsdom verfügbar; abgedeckt
  durch Browser-E2E in Phase 7)
- void pfeilBreite Tot-Code-Indikator byte-identisch übernommen,
  Cleanup als Spawn-Task

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 5: useDrawingEngine.ts slim + ZeichnenCanvas Import (atomar)

### Task 5.1: useDrawingEngine.ts auf finale Hook-Struktur reduzieren

**Files:**
- Modify: `ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts` (aktuell ~280 Z. nach Phase 1-4 → Ziel ~140 Z.)

- [ ] **Step 1: Hook-File auf finale Struktur**

Vollständiger File-Content:

```typescript
// ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
import { useReducer, useCallback, useRef } from 'react';
import type { DrawCommand, CanvasState, CommandId } from './ZeichnenTypes';
import { generiereCommandId } from './ZeichnenTypes';
import { canvasReducer, initialState } from './drawingReducer';
import { renderCanvas, zeichneCommand } from './drawingRendering';
import { serializiereCommand } from './drawingSerialisierung';

// ============================================================
// Optionen und Rückgabe-Interface
// ============================================================

interface UseDrawingEngineOptions {
  hintergrundbild?: HTMLImageElement | null;
  breite: number;
  hoehe: number;
}

interface UseDrawingEngineReturn {
  state: CanvasState;
  addCommand: (cmd: Omit<DrawCommand, 'id'>) => void;
  updateAktiverCommand: (cmd: DrawCommand | null) => void;
  updateCommand: (id: CommandId, updates: Partial<DrawCommand>) => void;
  undo: () => void;
  redo: () => void;
  allesLoeschen: () => void;
  selektiere: (id: CommandId | null) => void;
  loescheSelektierten: () => void;
  loescheById: (id: CommandId) => void;
  verschiebeSelektierten: (dx: number, dy: number) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  /** Rendert den Canvas-Inhalt + einen optionalen Preview-Command (z.B. Stift-Buffer).
   *  Wird für rAF-basiertes Echtzeit-Rendering während des Zeichnens genutzt,
   *  ohne dass der Preview im React-State liegt. */
  renderMitPreview: (ctx: CanvasRenderingContext2D, previewCommand: DrawCommand | null) => void;
  serialisiere: () => string;
  ladeDaten: (json: string) => void;
  exportierePNG: (canvas: HTMLCanvasElement) => string;
  kannUndo: boolean;
  kannRedo: boolean;
}

// ============================================================
// Haupt-Hook
// ============================================================

export function useDrawingEngine(options: UseDrawingEngineOptions): UseDrawingEngineReturn {
  const { hintergrundbild, breite, hoehe } = options;
  const [state, dispatch] = useReducer(canvasReducer, initialState);

  // Ref für stabile Zugriffe in Callbacks (ohne Re-Render-Abhängigkeit)
  const stateRef = useRef(state);
  stateRef.current = state;

  const addCommand = useCallback((cmd: Omit<DrawCommand, 'id'>) => {
    const mitId = { ...cmd, id: generiereCommandId() } as DrawCommand;
    dispatch({ type: 'ADD_COMMAND', command: mitId });
  }, []);

  const updateAktiverCommand = useCallback((cmd: DrawCommand | null) => {
    dispatch({ type: 'SET_AKTIVER', command: cmd });
  }, []);

  const undo = useCallback(() => { dispatch({ type: 'UNDO' }); }, []);
  const redo = useCallback(() => { dispatch({ type: 'REDO' }); }, []);
  const allesLoeschen = useCallback(() => { dispatch({ type: 'CLEAR' }); }, []);
  const selektiere = useCallback((id: CommandId | null) => {
    dispatch({ type: 'SELECT', id });
  }, []);
  const loescheSelektierten = useCallback(() => {
    dispatch({ type: 'DELETE_SELECTED' });
  }, []);
  const loescheById = useCallback((id: CommandId) => {
    dispatch({ type: 'DELETE_BY_ID', id });
  }, []);
  const verschiebeSelektierten = useCallback((dx: number, dy: number) => {
    dispatch({ type: 'MOVE_SELECTED', dx, dy });
  }, []);
  const updateCommand = useCallback((id: CommandId, updates: Partial<DrawCommand>) => {
    dispatch({ type: 'UPDATE_COMMAND', id, updates });
  }, []);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      renderCanvas(ctx, stateRef.current, hintergrundbild, breite, hoehe);
    },
    [hintergrundbild, breite, hoehe]
  );

  const renderMitPreview = useCallback(
    (ctx: CanvasRenderingContext2D, previewCommand: DrawCommand | null) => {
      renderCanvas(ctx, stateRef.current, hintergrundbild, breite, hoehe);
      if (previewCommand) {
        zeichneCommand(ctx, previewCommand);
      }
    },
    [hintergrundbild, breite, hoehe]
  );

  const serialisiere = useCallback((): string => {
    const serialisiert = stateRef.current.commands.map(serializiereCommand);
    return JSON.stringify(serialisiert);
  }, []);

  const ladeDaten = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as DrawCommand[];
      if (!Array.isArray(parsed)) {
        console.warn('useDrawingEngine.ladeDaten: Ungültiges Format — kein Array');
        return;
      }
      dispatch({ type: 'LOAD', commands: parsed });
    } catch (err) {
      console.warn('useDrawingEngine.ladeDaten: JSON-Parse fehlgeschlagen', err);
    }
  }, []);

  const exportierePNG = useCallback((canvas: HTMLCanvasElement): string => {
    return canvas.toDataURL('image/png');
  }, []);

  return {
    state,
    addCommand,
    updateAktiverCommand,
    updateCommand,
    undo,
    redo,
    allesLoeschen,
    selektiere,
    loescheSelektierten,
    loescheById,
    verschiebeSelektierten,
    render,
    renderMitPreview,
    serialisiere,
    ladeDaten,
    exportierePNG,
    kannUndo: state.commands.length > 0,
    kannRedo: state.redoStack.length > 0,
  };
}
```

**Wichtig:** Re-Exports (`findeCommandBeiPunkt`, `vereinfachePunkte`, `zeichneCommand`) werden hier komplett ENTFERNT. Konsumer muss in nächstem Schritt korrigiert werden.

### Task 5.2: ZeichnenCanvas.tsx Import korrigieren

- [ ] **Step 1: ZeichnenCanvas Z. 5 ändern**

Modify: `ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx`

```diff
- import { useDrawingEngine, findeCommandBeiPunkt } from './useDrawingEngine'
+ import { useDrawingEngine } from './useDrawingEngine'
+ import { findeCommandBeiPunkt } from './drawingGeometrie'
```

Verwendung von `findeCommandBeiPunkt` (Hit-Testing-Aufrufe in handleStart/handleEnd) bleibt unverändert.

- [ ] **Step 2: Verifikation Konsumer-Inventar**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-u-usedrawingengine"
grep -rn "from.*useDrawingEngine" --include="*.ts" --include="*.tsx" ExamLab/src
```

Expected: Nur **1 Match** (ZeichnenCanvas.tsx Z. 5: `import { useDrawingEngine } from './useDrawingEngine'`).

```bash
grep -rn "vereinfachePunkte\|zeichneCommand" --include="*.ts" --include="*.tsx" ExamLab/src | grep -v "drawingGeometrie\|drawingRendering\|drawingSerialisierung\|useDrawingEngine\|ZeichnenTypes" | head
```

Expected: 0 Matches (oder nur interne Verwendungen in den 3 neuen Files + Hook).

### Task 5.3: Verifikation Phase 5 + atomarer Commit

- [ ] **Step 1: Vollständige Verifikation**

```bash
cd ExamLab
npx tsc -b 2>&1 | tee /tmp/tsc.log | tail
npx vitest run --reporter=dot 2>&1 | tail -5
npm run lint:as-any 2>&1 | tail
npx vite build 2>&1 | tail -10
```

Expected:
- tsc: clean (Output prüfen!)
- vitest: `Tests  1399 passed | 4 todo` (oder die exakte Drift, je nach finalen Test-Counts)
- lint:as-any: clean
- vite build: erfolgreich

```bash
wc -l ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts
```

Expected: ~140 Z. (ggf. ±10).

- [ ] **Step 2: Atomarer Commit**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-u-usedrawingengine"
git add ExamLab/src/components/fragetypen/zeichnen/useDrawingEngine.ts \
        ExamLab/src/components/fragetypen/zeichnen/ZeichnenCanvas.tsx
git -c commit.gpgsign=false commit -m "$(cat <<'EOF'
Bundle U Phase 5: useDrawingEngine slim + ZeichnenCanvas-Import

- useDrawingEngine.ts 752 → ~140 Z. (Pure-Logic raus, nur Hook bleibt)
- Re-Exports (findeCommandBeiPunkt, vereinfachePunkte, zeichneCommand)
  entfallen komplett — vereinfachePunkte + zeichneCommand waren ungenutzt
  (Dead-Surface entfernt)
- ZeichnenCanvas.tsx Z. 5: findeCommandBeiPunkt aus drawingGeometrie
  importiert (statt aus useDrawingEngine)
- Hotspot-Bilanz Code-Files (>500 Z., ohne data/test): 12 → 11

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Phase 6: Lint-Gates + Build verify

### Task 6.1: Alle Lint-Gates durchlaufen

- [ ] **Step 1: Vier Lint-Gates**

```bash
cd ExamLab
npm run lint:as-any 2>&1 | tail
npm run lint:no-alert 2>&1 | tail
npm run lint:no-tests-dir 2>&1 | tail
npm run lint:musterloesung 2>&1 | tail
```

Expected:
- `lint:as-any`: `Total: 0 / Defensive: 0 / Undokumentiert: 0`
- `lint:no-alert`: 0 Treffer
- `lint:no-tests-dir`: keine `__tests__/`-Verzeichnisse
- `lint:musterloesung`: Baseline unverändert (gleiche Counts wie auf main)

- [ ] **Step 2: Vite Build**

```bash
cd ExamLab && npx vite build 2>&1 | tail -15
```

Expected: erfolgreich, PWA `generateSW` OK.

### Task 6.2: Hotspot-Bilanz verifizieren

- [ ] **Step 1: Files >500 Z. zählen**

```bash
cd ExamLab && find src -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | awk '$1 > 500 && $2 != "total"' | sort -rn | head -20
```

Expected: `useDrawingEngine.ts` NICHT mehr in der Liste (nur ~140 Z.). Anzahl Code-Files (ohne data/test, also `einrichtungs*`/`bewertungsraster*`/`autoKorrektur.test.ts` ausgenommen) **11** statt **12**.

---

## Phase 7: Browser-E2E auf staging (User-manual)

### Task 7.1: Staging-Deploy vorbereiten

- [ ] **Step 1: Branch zu preview pushen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/.worktrees/bundle-u-usedrawingengine"
git push origin feature/bundle-u-usedrawingengine-split
```

(Memory-Regel `feedback_preview_forcepush`: Vor Force-Push auf `origin/preview` IMMER `git log preview ^<local>` prüfen — gilt aber nur falls preview-Force-Push genutzt wird. Hier: nur Branch-Push, keine preview-Force-Push.)

- [ ] **Step 2: Preview-Branch updaten (falls genutzt)**

User entscheidet, ob staging via `preview`-Branch (+ GitHub-Pages-Auto-Deploy) oder via `examlab-staging.web.app` verifiziert wird. Falls preview:

```bash
git log preview..feature/bundle-u-usedrawingengine-split --oneline  # was kommt rein
git log feature/bundle-u-usedrawingengine-split..preview --oneline  # was preview-only hat
# Falls preview Work-in-Progress hat → User fragen, sonst:
git push --force-with-lease origin feature/bundle-u-usedrawingengine-split:preview
```

(Memory-Regel `feedback_preview_forcepush`: niemals Feature-Branch von main rebasen wenn preview WIP hat.)

### Task 7.2: Browser-E2E (User durchläuft 12 Pfade auf staging mit echten Logins)

(Memory-Regel `feedback_echte_logins`: kein Demo-Modus. Memory-Regel `feedback_service_worker_cache_wire_bundle`: SW-Cache vorab `unregister + caches.delete + reload` — präventiv.)

- [ ] **Pfad 1: LP-Editor öffnen + Zeichnen-Frage erstellen**
  - Auf staging einloggen (echter LP-Account), neue Frage „Zeichnen" erstellen
  - **Erwartung:** Canvas erscheint mit Default-Hintergrund (oder Bild falls hochgeladen). 0 Console-Errors.

- [ ] **Pfad 2: Alle 7 Werkzeuge im LP-Editor**
  - Stift / Linie / Pfeil / Rechteck / Ellipse / Text / Radierer — jedes Werkzeug einmal anwenden
  - **Erwartung:** Alle Commands erscheinen visuell korrekt (Pfeilspitzen-Geometrie, Text-Rendering, gestrichelt-Toggle).

- [ ] **Pfad 3: Auswahl-Werkzeug + Hit-Testing**
  - Auswahl aktivieren → Klick auf gezeichnetes Element jeder Sorte
  - **Erwartung:** Blauer gestrichelter Selektions-Rahmen sichtbar (Hit-Testing pro DrawCommand-Typ).

- [ ] **Pfad 4: Verschieben**
  - Selektiertes Element via Drag verschieben (Maus oder Touch)
  - **Erwartung:** Position aktualisiert byte-identisch zur Source.

- [ ] **Pfad 5: Tastatur-Delete**
  - Auswahl auf Element → Delete-Taste
  - **Erwartung:** Element verschwindet.

- [ ] **Pfad 6: Undo / Redo (je 3×)**
  - Strg/Cmd+Z mehrfach → Strg/Cmd+Shift+Z mehrfach
  - **Erwartung:** State korrekt rekonstruiert; Redo nach 3 Undos = vollständiger Original-State.

- [ ] **Pfad 7: Alles löschen**
  - Toolbar „Alles löschen"-Button
  - **Erwartung:** Canvas leer.

- [ ] **Pfad 8: Speichern (Auto-Save) + Network-Tab**
  - Zeichnen → 400ms Pause → Network-Tab beobachten
  - **Erwartung:** Save-Request feuert mit serialisiertem JSON (Stift-Punkte RDP-vereinfacht und gerundet).

- [ ] **Pfad 9: Reload + Persistenz-Roundtrip**
  - Frage schliessen → neu öffnen
  - **Erwartung:** JSON wird via `engine.ladeDaten` deserialisiert, alle Commands sichtbar (auch Stift mit RDP-vereinfachten Punkten).

- [ ] **Pfad 10: SuS-Üben Zeichnen-Frage**
  - SuS-Login → Üben-Modus → Zeichnen-Frage öffnen
  - **Erwartung:** Hintergrundbild lädt, Werkzeuge funktional, Antwort-Speicher-Roundtrip ok.

- [ ] **Pfad 11: PNG-Export** (falls Toolbar-Button verfügbar)
  - Toolbar „Als PNG"-Button
  - **Erwartung:** Datei mit korrektem Bild-Inhalt (oder Spec-Anmerkung: API-Methode aktuell evtl. nicht über UI erreichbar — siehe Spec-Reviewer-Empfehlung §7.1 Pfad 11).

- [ ] **Pfad 12: Console-Errors**
  - Console öffnen während aller Pfade
  - **Erwartung:** 0 Errors.

### Task 7.3: User-Bestätigung im Chat

- [ ] **Step 1: User berichtet Pfad-Status zurück**

User antwortet im Chat: „Pfade 1-12 ✅" oder mit Liste defekter Pfade. Bei Defekten → Hotfix-Iteration vor Phase 8.

---

## Phase 8: Final Code-Reviewer + HANDOFF + Memory + Merge

### Task 8.1: Code-Reviewer-Subagent

- [ ] **Step 1: Subagent dispatchen**

Use `superpowers:code-reviewer` Subagent mit Branch-Diff (`git diff main..feature/bundle-u-usedrawingengine-split -- ExamLab/src/`):

Verifikations-Punkte:
- byte-identisches Verhalten für 17 Invarianten aus Spec §5.1
- Reducer-Tests decken alle 11 Action-Types ab
- Geometrie-Tests verifizieren Touch-vs.-Maus-Toleranz beider Branches
- Serialisierungs-Tests verifizieren Stift-RDP-Coupling
- Hook bleibt idiomatisch (useReducer + useCallback-Wrapper, keine Logik im Hook)
- Re-Exports `vereinfachePunkte`/`zeichneCommand` sind komplett entfernt (Dead-Surface raus)
- ZeichnenCanvas-Import auf direkten Geometrie-Pfad korrigiert (kein indirekter Re-Export)
- `void pfeilBreite;` byte-identisch übernommen (Tot-Code-Indikator, Spawn-Task)
- Keine neuen `as any`-Drifts

APPROVED oder ❌ Issues → fix iterativ (max 3 Iterationen).

### Task 8.2: HANDOFF-Eintrag

- [ ] **Step 1: HANDOFF.md aktualisieren**

Modify: `ExamLab/HANDOFF.md`

Neuer Eintrag oben unter „Letzter Stand auf main" (analog T.f-Format):

```markdown
### Bundle U — useDrawingEngine Pure-Logic-Cut ✅ MERGED (2026-05-07)

Branch `feature/bundle-u-usedrawingengine-split`. Erstes Hoch-Risiko-Datei-Split der Phase 4 aus dem Vereinfachungs-Audit. **useDrawingEngine.ts 752 → ~140 Zeilen (-81%)** — Hotspot verlassen, Bilanz Code-Files (>500 Z., ohne data/test) **12 → 11**.

**Was geliefert (4 neue Files + 3 Test-Files + 1 Caller-Edit):**
- `drawingReducer.ts` (~160 Z.) — `canvasReducer` + `verschiebePoint`/`verschiebeCommand` byte-identisch
- `drawingReducer.test.ts` (~270 Z.) — 18 Vitest-Tests (alle 11 Action-Types + verschiebeCommand pro Sub-Type + Edge-Cases)
- `drawingGeometrie.ts` (~210 Z.) — `vereinfachePunkte` (RDP) + `findeCommandBeiPunkt` (Hit-Testing) + `berechneBoundingBox` byte-identisch
- `drawingGeometrie.test.ts` (~250 Z.) — 18 Vitest-Tests (RDP + Hit pro Typ + Touch/Maus-Toleranz + bbox)
- `drawingRendering.ts` (~280 Z.) — `zeichnePfeilspitze` + `zeichneCommand` + `renderCanvas` byte-identisch (kein Vitest, abgedeckt durch Browser-E2E)
- `drawingSerialisierung.ts` (~30 Z.) — `rundePoint` + `serializiereCommand` byte-identisch (importiert `vereinfachePunkte`)
- `drawingSerialisierung.test.ts` (~80 Z.) — 6 Vitest-Tests (rundePoint Edge-Cases + Stift-RDP-Coupling pro Typ)
- `ZeichnenCanvas.tsx` Z. 5: 1 Import-Zeile auf 2 (findeCommandBeiPunkt aus drawingGeometrie)

**Verifikation:**
- vitest **1399 passes** (drift +42 vs T.f-Baseline 1357) ✓ (oder exakte Drift)
- tsc -b clean (Output direkt geprüft) ✓
- 4 Lint-Gates clean ✓
- vite build erfolgreich, PWA generateSW OK ✓
- Browser-E2E auf staging mit echten LP+SuS-Logins, 12 Pfade ✓
- Final Code-Reviewer: **APPROVED for merge**

**Architektur-Patterns:**
- Pure-Logic-Cut nach Domain (Reducer / Geometrie / Rendering / Serialisierung) — Co-Located in `zeichnen/`
- Test-Hybrid: Vitest für jsdom-kompatible Pure-Logic, Browser-E2E für Canvas-2D-API (Master-Spec 4.2)
- Dead-Surface-Removal: ungenutzte Re-Exports (`vereinfachePunkte`, `zeichneCommand`) komplett entfernt
- Konsument-Korrektur statt Re-Export-Stub: `findeCommandBeiPunkt` direkt aus Geometrie-File (1 Konsument)

**Out of Scope (Spawn-Tasks für nächste Sessions):**
- Bundle V — `PDFSeite.tsx` Hoch-Risiko-Split (950 Z.)
- Bundle W — `uebungsStore.ts` Hoch-Risiko-Split (684 Z.)
- `void pfeilBreite;` Tot-Code-Cleanup in `drawingRendering.ts` Z. ~30
```

- [ ] **Step 2: HANDOFF commit**

```bash
git add ExamLab/HANDOFF.md
git -c commit.gpgsign=false commit -m "Bundle U: HANDOFF-Eintrag"
```

### Task 8.3: Merge auf main

- [ ] **Step 1: Final Push**

```bash
git push origin feature/bundle-u-usedrawingengine-split
```

- [ ] **Step 2: Merge auf main**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git checkout main
git pull origin main
git merge --no-ff feature/bundle-u-usedrawingengine-split -m "Merge Bundle U: useDrawingEngine Pure-Logic-Cut (752 → ~140 Z., -81%)"
git push origin main
```

- [ ] **Step 3: Branch löschen (lokal + remote)**

```bash
git branch -d feature/bundle-u-usedrawingengine-split
git push origin --delete feature/bundle-u-usedrawingengine-split
```

- [ ] **Step 4: Worktree entfernen**

```bash
cd "/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY"
git worktree remove .worktrees/bundle-u-usedrawingengine
```

### Task 8.4: Memory-Update

- [ ] **Step 1: Memory-Eintrag schreiben**

In `~/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/`:

Neuer File: `project_bundle_u_komplett.md` (Frontmatter analog T.f-Memory).

Update: `MEMORY.md` mit Eintrag analog T.f, max 1 Zeile, ~150 Zeichen:
```markdown
- **[Bundle U KOMPLETT auf main](project_bundle_u_komplett.md)** — 07.05.2026 Merge `<hash>`. useDrawingEngine 752 → ~140 Z. (-81%) via 4 Pure-Logic-Sub-Files. ...
```

Mindestens dokumentieren:
- Hotspot-Bilanz Code-Files: 12 → 11
- 4 neue Pure-Logic-Files + 3 Test-Files
- Test-Hybrid-Pattern bestätigt (jsdom-kompatibel: Vitest; Canvas-2D-API: nur Browser-E2E)
- Dead-Surface-Removal-Pattern (ungenutzte Re-Exports beseitigt, nicht via Stub erhalten)
- 17 Verhaltens-Invarianten byte-identisch übernommen
- Bundle V (PDFSeite) und W (uebungsStore) als nächste Hoch-Risiko-Splits offen

---

## Verifikations-Zusammenfassung (für Reviewer)

| Check | Status |
|---|---|
| useDrawingEngine.ts <500 Z. (Ziel ~140) | _ ✓ / ✗ |
| Hotspot-Bilanz Code-Files 12 → 11 | _ ✓ / ✗ |
| vitest +35–42 drift (1357 → 1392+) | _ ✓ / ✗ |
| tsc -b clean (Output geprüft) | _ ✓ / ✗ |
| 4 Lint-Gates clean | _ ✓ / ✗ |
| vite build erfolgreich | _ ✓ / ✗ |
| Browser-E2E 12 Pfade ✓ | _ ✓ / ✗ |
| Code-Reviewer APPROVED | _ ✓ / ✗ |
| HANDOFF + Memory-Update | _ ✓ / ✗ |
| Branch lokal+remote gelöscht + Worktree entfernt | _ ✓ / ✗ |
| Re-Exports (vereinfachePunkte, zeichneCommand) komplett raus | _ ✓ / ✗ |
| ZeichnenCanvas-Import auf drawingGeometrie korrigiert | _ ✓ / ✗ |
