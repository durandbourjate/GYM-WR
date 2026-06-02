/** Geometry helpers for a11y overlay positioning on %-coordinate images. */

export interface Punkt {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  breite: number
  hoehe: number
}

/**
 * Computes the axis-aligned bounding box of a polygon given in %-coordinates.
 * Guard: empty array → all zeros.
 */
export function boundingBox(punkte: Punkt[]): BoundingBox {
  if (punkte.length === 0) {
    return { x: 0, y: 0, breite: 0, hoehe: 0 }
  }
  let minX = punkte[0].x
  let maxX = punkte[0].x
  let minY = punkte[0].y
  let maxY = punkte[0].y
  for (const p of punkte) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  return {
    x: minX,
    y: minY,
    breite: maxX - minX,
    hoehe: maxY - minY,
  }
}

/**
 * Computes the centroid of a polygon as the average of its vertices.
 * Note: assumes roughly convex regions; for typical hotspot shapes this is adequate.
 * Guard: empty array → { x: 50, y: 50 } (center of image).
 */
export function zentroid(punkte: Punkt[]): Punkt {
  if (punkte.length === 0) {
    return { x: 50, y: 50 }
  }
  const sumX = punkte.reduce((acc, p) => acc + p.x, 0)
  const sumY = punkte.reduce((acc, p) => acc + p.y, 0)
  return {
    x: sumX / punkte.length,
    y: sumY / punkte.length,
  }
}

/**
 * Maps a %-coordinate point to a 3×3 grid phrase.
 * Vertical: y < 33.33 → 'oben', < 66.66 → 'Mitte', else 'unten'.
 * Horizontal: x < 33.33 → 'links', < 66.66 → 'Mitte', else 'rechts'.
 * If both axes are Mitte, returns just 'Mitte'.
 */
export function positionsPhrase(p: Punkt): string {
  const vertikal = p.y < 33.33 ? 'oben' : p.y < 66.66 ? 'Mitte' : 'unten'
  const horizontal = p.x < 33.33 ? 'links' : p.x < 66.66 ? 'Mitte' : 'rechts'
  if (vertikal === 'Mitte' && horizontal === 'Mitte') {
    return 'Mitte'
  }
  if (vertikal === 'Mitte') {
    return horizontal
  }
  if (horizontal === 'Mitte') {
    return vertikal
  }
  return `${vertikal} ${horizontal}`
}
