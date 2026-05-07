import { useReducer, useCallback, useRef } from 'react';
import type { DrawCommand, CanvasState, Point, CommandId } from './ZeichnenTypes';
import { generiereCommandId } from './ZeichnenTypes';
import { canvasReducer, initialState } from './drawingReducer';
import { berechneBoundingBox, vereinfachePunkte } from './drawingGeometrie';

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

export { findeCommandBeiPunkt, vereinfachePunkte } from './drawingGeometrie';
export { zeichneCommand };  // local re-export of the in-file definition (Phase 4 will move it)
