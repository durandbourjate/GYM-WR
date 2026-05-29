/**
 * GYM-Stufen-Formatierung für Sonderwochen (gymLevel: string | string[]).
 * Aus SpecialWeeksEditor.tsx ausgelagert, damit die Component-Datei nur Components
 * exportiert (React Fast Refresh / only-export-components).
 */

/** Normalisiert gymLevel auf string[]. */
export function normalizeGymLevel(gl?: string | string[]): string[] {
  if (!gl) return [];
  return Array.isArray(gl) ? gl : [gl];
}

/** Formatiert ein gymLevel-Array für die Header-Anzeige (kommagetrennt). */
export function formatGymLevel(gl?: string | string[]): string {
  const arr = normalizeGymLevel(gl);
  if (arr.length === 0) return '';
  return arr.join(', ');
}
