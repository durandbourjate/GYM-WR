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
      expect(out.punkte).toEqual([{ x: 0.1, y: 0.2 }, { x: 10, y: 0.1 }]);
    }
  });

  it('linie: rundet von+bis ohne Vereinfachung', () => {
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
