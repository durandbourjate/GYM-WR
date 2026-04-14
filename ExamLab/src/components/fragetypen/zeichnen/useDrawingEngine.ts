import { useReducer, useCallback, useRef } from 'react';
import type { DrawCommand, CanvasState, Point, CommandId } from './ZeichnenTypes';
import { MAX_UNDO_TIEFE, generiereCommandId } from './ZeichnenTypes';

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
// Reducer-Aktionen
// ============================================================

type CanvasAction =
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

// ============================================================
// Initialer Zustand
// ============================================================

const initialState: CanvasState = {
  commands: [],
  redoStack: [],
  aktiverCommand: null,
  selektierterCommand: null,
};

// ============================================================
// Hilfsfunktionen für MOVE_SELECTED
// ============================================================

function verschiebePoint(p: Point, dx: number, dy: number): Point {
  return { ...p, x: Math.round((p.x + dx) * 10) / 10, y: Math.round((p.y + dy) * 10) / 10 };
}

function verschiebeCommand(cmd: DrawCommand, dx: number, dy: number): DrawCommand {
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

// ============================================================
// Reducer
// ============================================================

function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_COMMAND': {
      let neueCommands = [...state.commands, action.command];
      if (neueCommands.length > MAX_UNDO_TIEFE) {
        neueCommands = neueCommands.slice(neueCommands.length - MAX_UNDO_TIEFE);
      }
      return {
        ...state,
        commands: neueCommands,
        redoStack: [],
        aktiverCommand: null,
      };
    }

    case 'SET_AKTIVER':
      return { ...state, aktiverCommand: action.command };

    case 'UNDO': {
      if (state.commands.length === 0) return state;
      const neueCommands = state.commands.slice(0, -1);
      const letzter = state.commands[state.commands.length - 1];
      return {
        ...state,
        commands: neueCommands,
        redoStack: [...state.redoStack, letzter],
        selektierterCommand: null,
      };
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const wiederhergestellt = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        commands: [...state.commands, wiederhergestellt],
        redoStack: state.redoStack.slice(0, -1),
      };
    }

    case 'CLEAR':
      return { ...initialState };

    case 'SELECT':
      return { ...state, selektierterCommand: action.id };

    case 'DELETE_SELECTED': {
      if (state.selektierterCommand === null) return state;
      const zuLoeschen = state.commands.find(c => c.id === state.selektierterCommand);
      if (!zuLoeschen) return { ...state, selektierterCommand: null };
      return {
        ...state,
        commands: state.commands.filter(c => c.id !== state.selektierterCommand),
        redoStack: [...state.redoStack, zuLoeschen],
        selektierterCommand: null,
      };
    }

    case 'DELETE_BY_ID': {
      const zuLoeschen = state.commands.find(c => c.id === action.id);
      if (!zuLoeschen) return state;
      return {
        ...state,
        commands: state.commands.filter(c => c.id !== action.id),
        redoStack: [...state.redoStack, zuLoeschen],
        selektierterCommand: state.selektierterCommand === action.id ? null : state.selektierterCommand,
      };
    }

    case 'MOVE_SELECTED': {
      if (state.selektierterCommand === null) return state;
      const { dx, dy } = action;
      return {
        ...state,
        commands: state.commands.map(cmd =>
          cmd.id === state.selektierterCommand ? verschiebeCommand(cmd, dx, dy) : cmd
        ),
      };
    }

    case 'UPDATE_COMMAND': {
      const idx = state.commands.findIndex(c => c.id === action.id);
      if (idx === -1) return state;
      const aktuell = state.commands[idx];
      const aktualisiert = { ...aktuell, ...action.updates, id: aktuell.id, typ: aktuell.typ } as DrawCommand;
      const neueCommands = [...state.commands];
      neueCommands[idx] = aktualisiert;
      return { ...state, commands: neueCommands };
    }

    case 'LOAD':
      return {
        ...initialState,
        commands: action.commands,
      };

    default:
      return state;
  }
}

// ============================================================
// RDP-Algorithmus (Ramer-Douglas-Peucker)
// ============================================================

function punktZuLinieAbstand(punkt: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const laenge = Math.sqrt(dx * dx + dy * dy);

  // Degenerierter Fall: Start == End → euklidischer Abstand
  if (laenge === 0) {
    const adx = punkt.x - start.x;
    const ady = punkt.y - start.y;
    return Math.sqrt(adx * adx + ady * ady);
  }

  // Senkrechter Abstand zum Liniensegment
  return Math.abs(dy * punkt.x - dx * punkt.y + end.x * start.y - end.y * start.x) / laenge;
}

// Toleranz 0.8: Kompromiss — genug Vereinfachung für Speicher, behält aber Stift-Details bei iPad-Stylus
function vereinfachePunkte(punkte: Point[], toleranz = 0.8): Point[] {
  if (punkte.length <= 2) return punkte;

  const start = punkte[0];
  const end = punkte[punkte.length - 1];

  let maxDist = 0;
  let maxIdx = 0;

  for (let i = 1; i < punkte.length - 1; i++) {
    const dist = punktZuLinieAbstand(punkte[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > toleranz) {
    const links = vereinfachePunkte(punkte.slice(0, maxIdx + 1), toleranz);
    const rechts = vereinfachePunkte(punkte.slice(maxIdx), toleranz);
    return [...links.slice(0, -1), ...rechts];
  }

  return [start, end];
}

// ============================================================
// Hit-Testing
// ============================================================

function punktAbstandZuSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const laenge2 = dx * dx + dy * dy;

  if (laenge2 === 0) {
    const adx = p.x - a.x;
    const ady = p.y - a.y;
    return Math.sqrt(adx * adx + ady * ady);
  }

  // Parameter t: Projektion von p auf Segment [a, b]
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / laenge2));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const restDx = p.x - projX;
  const restDy = p.y - projY;
  return Math.sqrt(restDx * restDx + restDy * restDy);
}

function findeCommandBeiPunkt(commands: DrawCommand[], punkt: Point): CommandId | null {
  // Grössere Toleranz für Touch-Geräte (Finger vs. Maus)
  const istTouch = 'ontouchstart' in window
  const TOLERANZ_PX = istTouch ? 16 : 8;

  for (let i = commands.length - 1; i >= 0; i--) {
    const cmd = commands[i];

    switch (cmd.typ) {
      case 'rechteck':
      case 'ellipse': {
        const minX = Math.min(cmd.von.x, cmd.bis.x);
        const maxX = Math.max(cmd.von.x, cmd.bis.x);
        const minY = Math.min(cmd.von.y, cmd.bis.y);
        const maxY = Math.max(cmd.von.y, cmd.bis.y);
        if (punkt.x >= minX && punkt.x <= maxX && punkt.y >= minY && punkt.y <= maxY) {
          return cmd.id;
        }
        break;
      }

      case 'text': {
        // Näherung: Breite = groesse * 0.6 * Zeichen-Anzahl, Höhe = groesse
        const textBreite = cmd.groesse * 0.6 * cmd.text.length;
        const textHoehe = cmd.groesse;
        // Bei Rotation: Klickpunkt relativ zum Text-Ursprung zurückdrehen
        let testX = punkt.x;
        let testY = punkt.y;
        if (cmd.rotation) {
          const rad = -(cmd.rotation * Math.PI) / 180;
          const dx = punkt.x - cmd.position.x;
          const dy = punkt.y - cmd.position.y;
          testX = cmd.position.x + dx * Math.cos(rad) - dy * Math.sin(rad);
          testY = cmd.position.y + dx * Math.sin(rad) + dy * Math.cos(rad);
        }
        if (
          testX >= cmd.position.x &&
          testX <= cmd.position.x + textBreite &&
          testY >= cmd.position.y - textHoehe &&
          testY <= cmd.position.y
        ) {
          return cmd.id;
        }
        break;
      }

      case 'linie':
      case 'pfeil': {
        const abstand = punktAbstandZuSegment(punkt, cmd.von, cmd.bis);
        if (abstand <= TOLERANZ_PX) return cmd.id;
        break;
      }

      case 'stift':
      case 'radierer': {
        for (let j = 0; j < cmd.punkte.length - 1; j++) {
          const abstand = punktAbstandZuSegment(punkt, cmd.punkte[j], cmd.punkte[j + 1]);
          if (abstand <= TOLERANZ_PX) return cmd.id;
        }
        // Einzelpunkt-Prüfung falls nur 1 Punkt
        if (cmd.punkte.length === 1) {
          const dp = cmd.punkte[0];
          const dx = punkt.x - dp.x;
          const dy = punkt.y - dp.y;
          if (Math.sqrt(dx * dx + dy * dy) <= TOLERANZ_PX) return cmd.id;
        }
        break;
      }
    }
  }

  return null;
}

// ============================================================
// Pfeil-Hilfsfunktion
// ============================================================

function zeichnePfeilspitze(
  ctx: CanvasRenderingContext2D,
  von: Point,
  bis: Point,
  breite: number
): void {
  const winkel = Math.atan2(bis.y - von.y, bis.x - von.x);
  const pfeilLaenge = Math.max(10, breite * 4);
  const pfeilBreite = Math.max(6, breite * 2.5);

  ctx.beginPath();
  ctx.moveTo(bis.x, bis.y);
  ctx.lineTo(
    bis.x - pfeilLaenge * Math.cos(winkel - Math.PI / 7),
    bis.y - pfeilLaenge * Math.sin(winkel - Math.PI / 7)
  );
  ctx.lineTo(
    bis.x - pfeilLaenge * Math.cos(winkel + Math.PI / 7),
    bis.y - pfeilLaenge * Math.sin(winkel + Math.PI / 7)
  );
  ctx.closePath();

  // Pfeilspitze füllen (gleiche Farbe wie Linie)
  ctx.fillStyle = ctx.strokeStyle as string;
  ctx.fill();

  // Pfeilbreite für Linienende anpassen (damit Linie nicht über Spitze hinausragt)
  void pfeilBreite; // Verwendung über pfeilLaenge bereits abgedeckt
}

// ============================================================
// Einzelnen Command zeichnen
// ============================================================

function zeichneCommand(ctx: CanvasRenderingContext2D, cmd: DrawCommand): void {
  ctx.save();

  switch (cmd.typ) {
    case 'stift': {
      if (cmd.punkte.length === 0) break;
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cmd.punkte[0].x, cmd.punkte[0].y);
      for (let i = 1; i < cmd.punkte.length; i++) {
        ctx.lineTo(cmd.punkte[i].x, cmd.punkte[i].y);
      }
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'linie': {
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cmd.von.x, cmd.von.y);
      ctx.lineTo(cmd.bis.x, cmd.bis.y);
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'pfeil': {
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);

      // Linie zeichnen
      ctx.beginPath();
      ctx.moveTo(cmd.von.x, cmd.von.y);
      ctx.lineTo(cmd.bis.x, cmd.bis.y);
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);

      // Pfeilspitze zeichnen
      zeichnePfeilspitze(ctx, cmd.von, cmd.bis, cmd.breite);
      break;
    }

    case 'rechteck': {
      const x = Math.min(cmd.von.x, cmd.bis.x);
      const y = Math.min(cmd.von.y, cmd.bis.y);
      const w = Math.abs(cmd.bis.x - cmd.von.x);
      const h = Math.abs(cmd.bis.y - cmd.von.y);

      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      if (cmd.gefuellt) {
        ctx.fillStyle = cmd.farbe;
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.strokeStyle = cmd.farbe;
        ctx.lineWidth = cmd.breite;
        ctx.strokeRect(x, y, w, h);
      }
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'ellipse': {
      const cx = (cmd.von.x + cmd.bis.x) / 2;
      const cy = (cmd.von.y + cmd.bis.y) / 2;
      const rx = Math.abs(cmd.bis.x - cmd.von.x) / 2;
      const ry = Math.abs(cmd.bis.y - cmd.von.y) / 2;
      ctx.strokeStyle = cmd.farbe;
      ctx.lineWidth = cmd.breite;
      if (cmd.gestrichelt) ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
      if (cmd.gefuellt) { ctx.fillStyle = cmd.farbe; ctx.fill(); }
      ctx.stroke();
      if (cmd.gestrichelt) ctx.setLineDash([]);
      break;
    }

    case 'text': {
      ctx.fillStyle = cmd.farbe;
      ctx.font = `${cmd.fett ? 'bold ' : ''}${cmd.groesse}px sans-serif`;
      ctx.textBaseline = 'alphabetic';
      if (cmd.rotation) {
        ctx.save();
        ctx.translate(cmd.position.x, cmd.position.y);
        ctx.rotate((cmd.rotation * Math.PI) / 180);
        ctx.fillText(cmd.text, 0, 0);
        ctx.restore();
      } else {
        ctx.fillText(cmd.text, cmd.position.x, cmd.position.y);
      }
      break;
    }

    case 'radierer': {
      if (cmd.punkte.length === 0) break;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = cmd.breite;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cmd.punkte[0].x, cmd.punkte[0].y);
      for (let i = 1; i < cmd.punkte.length; i++) {
        ctx.lineTo(cmd.punkte[i].x, cmd.punkte[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
  }

  ctx.restore();
}

// ============================================================
// Bounding-Box berechnen (für Selektion)
// ============================================================

function berechneBoundingBox(
  cmd: DrawCommand
): { x: number; y: number; breite: number; hoehe: number } | null {
  const PADDING = 6;

  switch (cmd.typ) {
    case 'stift':
    case 'radierer': {
      if (cmd.punkte.length === 0) return null;
      const xs = cmd.punkte.map(p => p.x);
      const ys = cmd.punkte.map(p => p.y);
      const minX = Math.min(...xs) - PADDING;
      const minY = Math.min(...ys) - PADDING;
      const maxX = Math.max(...xs) + PADDING;
      const maxY = Math.max(...ys) + PADDING;
      return { x: minX, y: minY, breite: maxX - minX, hoehe: maxY - minY };
    }

    case 'linie':
    case 'pfeil': {
      const minX = Math.min(cmd.von.x, cmd.bis.x) - PADDING;
      const minY = Math.min(cmd.von.y, cmd.bis.y) - PADDING;
      const maxX = Math.max(cmd.von.x, cmd.bis.x) + PADDING;
      const maxY = Math.max(cmd.von.y, cmd.bis.y) + PADDING;
      return { x: minX, y: minY, breite: maxX - minX, hoehe: maxY - minY };
    }

    case 'rechteck':
    case 'ellipse': {
      const minX = Math.min(cmd.von.x, cmd.bis.x) - PADDING;
      const minY = Math.min(cmd.von.y, cmd.bis.y) - PADDING;
      const maxX = Math.max(cmd.von.x, cmd.bis.x) + PADDING;
      const maxY = Math.max(cmd.von.y, cmd.bis.y) + PADDING;
      return { x: minX, y: minY, breite: maxX - minX, hoehe: maxY - minY };
    }

    case 'text': {
      const textBreite = cmd.groesse * 0.6 * cmd.text.length;
      return {
        x: cmd.position.x - PADDING,
        y: cmd.position.y - cmd.groesse - PADDING,
        breite: textBreite + PADDING * 2,
        hoehe: cmd.groesse + PADDING * 2,
      };
    }
  }
}

// ============================================================
// Vollständiges Canvas rendern
// ============================================================

function renderCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  hintergrundbild: HTMLImageElement | null | undefined,
  breite: number,
  hoehe: number
): void {
  ctx.clearRect(0, 0, breite, hoehe);

  if (hintergrundbild) {
    ctx.drawImage(hintergrundbild, 0, 0, breite, hoehe);
  }

  // Alle abgeschlossenen Commands zeichnen
  state.commands.forEach(cmd => zeichneCommand(ctx, cmd));

  // Aktiver (noch nicht abgeschlossener) Command zeichnen
  if (state.aktiverCommand) {
    zeichneCommand(ctx, state.aktiverCommand);
  }

  // Selektion: gestrichelter blauer Rahmen um selektierten Command
  if (state.selektierterCommand !== null) {
    const selektiert = state.commands.find(c => c.id === state.selektierterCommand);
    if (selektiert) {
      const bb = berechneBoundingBox(selektiert);
      if (bb) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(bb.x, bb.y, bb.breite, bb.hoehe);
        ctx.restore();
      }
    }
  }
}

// ============================================================
// Punkte runden (für Serialisierung)
// ============================================================

function rundePoint(p: Point): Point {
  const gerundet: Point = {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10,
  };
  if (p.druck !== undefined) {
    gerundet.druck = Math.round(p.druck * 100) / 100;
  }
  return gerundet;
}

function serializiereCommand(cmd: DrawCommand): DrawCommand {
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

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const allesLoeschen = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

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

  // Öffentliche Hit-Testing-Funktion (für Auswahl-Werkzeug in der Toolbar-Komponente)
  // Nicht im Interface, aber intern nutzbar → über state + Hilfsfunktion
  // Hinweis: findeCommandBeiPunkt ist als benannte Export-Funktion verfügbar (s.u.)

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

// ============================================================
// Hilfsfunktionen als benannte Exporte (für Komponenten)
// ============================================================

export { findeCommandBeiPunkt, vereinfachePunkte, zeichneCommand };
