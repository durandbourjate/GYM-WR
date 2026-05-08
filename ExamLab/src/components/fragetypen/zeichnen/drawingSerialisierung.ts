import type { DrawCommand, Point } from './ZeichnenTypes';
import { vereinfachePunkte } from './drawingGeometrie';

export function rundePoint(p: Point): Point {
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
