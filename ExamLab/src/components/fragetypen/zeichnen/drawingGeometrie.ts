import type { DrawCommand, Point, CommandId } from './ZeichnenTypes';

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
export function vereinfachePunkte(punkte: Point[], toleranz = 0.8): Point[] {
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

export function findeCommandBeiPunkt(commands: DrawCommand[], punkt: Point): CommandId | null {
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
// Bounding-Box berechnen (für Selektion)
// ============================================================

export function berechneBoundingBox(
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
