import type { HotspotBereich, DragDropBildZielzone } from '../../types/fragen'
import type { Punkt } from './polygon'

const KREIS_POLYGON_PUNKTE = 12

/**
 * Konvertiert eine Alt-Format-Hotspot-Zone ins neue Polygon-Format.
 * Idempotent: wenn bereits `punkte[]` vorhanden, wird unverändert zurückgegeben.
 *
 * Alt-Format:
 *  - Rechteck: { form: 'rechteck', koordinaten: { x, y, breite, hoehe }, ... }
 *  - Kreis:    { form: 'kreis',    koordinaten: { x, y, radius },        ... }
 * Feld `punkte` (number) wird zu `punktzahl` umbenannt.
 */
export function migriereHotspotBereichAlt(alt: any): HotspotBereich {
  if (Array.isArray(alt.punkte) && alt.punkte.length >= 3) {
    return alt as HotspotBereich
  }

  const k = alt.koordinaten ?? {}
  let form: 'rechteck' | 'polygon'
  let punkte: Punkt[]

  if (alt.form === 'kreis') {
    form = 'polygon'
    punkte = kreisZuPolygon(k.x ?? 50, k.y ?? 50, k.radius ?? 5, KREIS_POLYGON_PUNKTE)
  } else {
    form = 'rechteck'
    punkte = rechteckZuPolygon(k.x ?? 0, k.y ?? 0, k.breite ?? 0, k.hoehe ?? 0)
  }

  return {
    id: alt.id,
    form,
    punkte,
    label: alt.label ?? '',
    punktzahl:
      typeof alt.punktzahl === 'number' ? alt.punktzahl
      : typeof alt.punkte === 'number' ? alt.punkte
      : 1,
  } as HotspotBereich
}

/**
 * Konvertiert eine Alt-Format-DragDrop-Zielzone ins neue Polygon-Format.
 * Idempotent. Hebt Pre-Bundle-J-`korrektesLabel` auf das neue
 * `korrekteLabels: string[]` Format.
 * Alt-Format: { position: { x, y, breite, hoehe }, korrektesLabel?, id }
 */
export function migriereDragDropZielzoneAlt(alt: any): DragDropBildZielzone {
  if (Array.isArray(alt.punkte) && alt.punkte.length >= 3 && Array.isArray(alt.korrekteLabels)) {
    return alt as DragDropBildZielzone
  }

  const p = alt.position ?? {}
  const korrekteLabels: string[] = Array.isArray(alt.korrekteLabels)
    ? alt.korrekteLabels.map((s: unknown) => String(s ?? ''))
    : alt.korrektesLabel
      ? [String(alt.korrektesLabel)]
      : []
  return {
    id: alt.id,
    form: 'rechteck',
    punkte: Array.isArray(alt.punkte) && alt.punkte.length >= 3
      ? alt.punkte
      : rechteckZuPolygon(p.x ?? 0, p.y ?? 0, p.breite ?? 0, p.hoehe ?? 0),
    korrekteLabels,
  }
}

/**
 * True wenn die Zone das neue Format hat (punkte[] mit ≥3 Punkten).
 * Genutzt im Frontend-Error-Boundary für die Migrations-Fenster-Übergangs-Phase.
 */
export function istZoneWohlgeformt(zone: any): boolean {
  return Array.isArray(zone?.punkte) && zone.punkte.length >= 3
}

// --- interne Helfer ---

function rechteckZuPolygon(x: number, y: number, b: number, h: number): Punkt[] {
  return [
    { x, y },
    { x: x + b, y },
    { x: x + b, y: y + h },
    { x, y: y + h },
  ]
}

function kreisZuPolygon(cx: number, cy: number, r: number, n: number): Punkt[] {
  const punkte: Punkt[] = []
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / n
    punkte.push({
      x: cx + r * Math.cos(theta),
      y: cy + r * Math.sin(theta),
    })
  }
  return punkte
}
