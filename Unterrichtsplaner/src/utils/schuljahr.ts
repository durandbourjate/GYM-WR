/**
 * Schuljahr-Ableitung aus dem Datum.
 * Konvention: ab Juli (getMonth() >= 6) zählt das neue Schuljahr.
 * SJ 25/26 → Startjahr 2025, Endjahr 2026.
 */

/** Startjahr des aktuellen Schuljahres (SJ 25/26 → 2025). */
export function aktuellesSchuljahrStartjahr(now: Date = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
}

/** Endjahr des aktuellen Schuljahres (SJ 25/26 → 2026). */
export function aktuellesSchuljahrEndjahr(now: Date = new Date()): number {
  return aktuellesSchuljahrStartjahr(now) + 1;
}
