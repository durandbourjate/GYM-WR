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
    expect(state.commands[0].id).toBe(`s5`);
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
    const state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: mkStift('s1') });
    const next = canvasReducer(state, { type: 'DELETE_BY_ID', id: 'doesnotexist' });
    expect(next).toBe(state);
  });

  it('MOVE_SELECTED ohne Selektion → no-op', () => {
    const next = canvasReducer(initialState, { type: 'MOVE_SELECTED', dx: 5, dy: 5 });
    expect(next).toBe(initialState);
  });

  it('UPDATE_COMMAND erhält id+typ aus Original (auch bei updates-override)', () => {
    const cmd = mkStift('s1');
    const state = canvasReducer(initialState, { type: 'ADD_COMMAND', command: cmd });
    const updated = canvasReducer(state, {
      type: 'UPDATE_COMMAND',
      id: 's1',
      updates: { id: 'fake', typ: 'linie', farbe: '#f00' } as Partial<DrawCommand>,
    });
    expect(updated.commands[0].id).toBe('s1');
    expect(updated.commands[0].typ).toBe('stift');
    if (updated.commands[0].typ === 'stift') {
      expect(updated.commands[0].farbe).toBe('#f00');
    }
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
