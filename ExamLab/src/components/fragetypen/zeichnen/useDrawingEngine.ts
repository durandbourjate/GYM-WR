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
export { zeichneCommand } from './drawingRendering';
