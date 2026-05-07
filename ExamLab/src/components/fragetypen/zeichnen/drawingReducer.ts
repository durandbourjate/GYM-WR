import type { DrawCommand, CanvasState, Point, CommandId } from './ZeichnenTypes';
import { MAX_UNDO_TIEFE } from './ZeichnenTypes';

// ============================================================
// Reducer-Aktionen
// ============================================================

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

// ============================================================
// Initialer Zustand
// ============================================================

export const initialState: CanvasState = {
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

export function verschiebeCommand(cmd: DrawCommand, dx: number, dy: number): DrawCommand {
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

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
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
