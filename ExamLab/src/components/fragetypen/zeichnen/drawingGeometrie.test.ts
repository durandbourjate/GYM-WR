import { afterEach, describe, expect, it, vi } from 'vitest';
import { vereinfachePunkte, findeCommandBeiPunkt, berechneBoundingBox } from './drawingGeometrie';
import type { DrawCommand, Point } from './ZeichnenTypes';

const mkPoint = (x: number, y: number): Point => ({ x, y });

afterEach(() => {
  vi.unstubAllGlobals();
});

function withTouch(istTouch: boolean) {
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
      mkPoint(0, 0), mkPoint(5, 0.1), mkPoint(10, 0),
    ]);
    expect(result).toEqual([mkPoint(0, 0), mkPoint(10, 0)]);
  });

  it('Custom-Toleranz wird respektiert', () => {
    const points = [mkPoint(0, 0), mkPoint(5, 0.5), mkPoint(10, 0)];
    expect(vereinfachePunkte(points, 0.1)).toEqual(points);
    expect(vereinfachePunkte(points, 1.0)).toEqual([mkPoint(0, 0), mkPoint(10, 0)]);
  });
});

describe('findeCommandBeiPunkt (Hit-Testing)', () => {
  function mkRechteck(id: string, von: Point, bis: Point): DrawCommand {
    return { id, typ: 'rechteck', von, bis, farbe: '#000', breite: 2, gefuellt: false };
  }
  function mkLinie(id: string, von: Point, bis: Point): DrawCommand {
    return { id, typ: 'linie', von, bis, farbe: '#000', breite: 2 };
  }
  function mkText(id: string, position: Point, rotation: 0 | 90 | 180 | 270 = 0): DrawCommand {
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
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 5))).toBe('l1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 20))).toBeNull();
  });

  it('linie: Touch-Toleranz 16px', () => {
    withTouch(true);
    const cmds = [mkLinie('l1', mkPoint(0, 0), mkPoint(100, 0))];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 12))).toBe('l1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 20))).toBeNull();
  });

  it('text ohne Rotation: rechteck-bbox-Hit', () => {
    const cmds = [mkText('t1', mkPoint(50, 50))];
    expect(findeCommandBeiPunkt(cmds, mkPoint(60, 40))).toBe('t1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(100, 100))).toBeNull();
  });

  it('text mit Rotation: rotated bbox-Hit', () => {
    const cmds = [mkText('t1', mkPoint(50, 50), 90)];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 50))).toBe('t1');
  });

  it('stift: jedes Polyline-Segment getestet', () => {
    withTouch(false);
    const cmds = [mkStift('s1', [mkPoint(0, 0), mkPoint(50, 0), mkPoint(100, 100)])];
    expect(findeCommandBeiPunkt(cmds, mkPoint(25, 0))).toBe('s1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(75, 50))).toBe('s1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(200, 200))).toBeNull();
  });

  it('stift mit nur 1 Punkt: Single-Punkt-Fallback', () => {
    withTouch(false);
    const cmds = [mkStift('s1', [mkPoint(50, 50)])];
    expect(findeCommandBeiPunkt(cmds, mkPoint(53, 53))).toBe('s1');
    expect(findeCommandBeiPunkt(cmds, mkPoint(70, 70))).toBeNull();
  });

  it('iteriert von oben (zuletzt gezeichnet) zuerst', () => {
    const cmds = [
      mkRechteck('r1', mkPoint(0, 0), mkPoint(100, 100)),
      mkRechteck('r2', mkPoint(0, 0), mkPoint(100, 100)),
    ];
    expect(findeCommandBeiPunkt(cmds, mkPoint(50, 50))).toBe('r2');
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
    expect(bb).not.toBeNull();
    expect(bb!.x).toBe(44);
    expect(bb!.y).toBe(26);
    expect(bb!.hoehe).toBe(30);
    // Float-Approximation: 18 * 0.6 * 2 + 12 ≈ 33.6 (FP-Rundung)
    expect(bb!.breite).toBeCloseTo(33.6, 5);
  });
});
