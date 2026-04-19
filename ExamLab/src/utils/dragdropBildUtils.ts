/**
 * Kanonisches Speicherformat für DragDrop-Bild-Antworten:
 *   zuordnungen: { [labelText]: zoneId }
 *
 * Ein Label kann in maximal einer Zone liegen; eine Zone kann beliebig viele Labels halten.
 * Dieses Format unterstützt Mehrfach-Labels pro Zone (S118-Refactor) und ist konsistent mit
 * DragDropBildFrage.tsx (SuS-Store) und utils/ueben/korrektur.ts (Übungs-Korrektur).
 */

/** Alle Labels, die in der gegebenen Zone platziert wurden. */
export function labelsInZone(zuordnungen: Record<string, string> | undefined, zoneId: string): string[] {
  if (!zuordnungen) return []
  return Object.entries(zuordnungen)
    .filter(([, zId]) => zId === zoneId)
    .map(([label]) => label)
}

/** Prüft, ob in der Zone mindestens ein Label mit dem korrekten Text liegt (case-insensitive). */
export function zoneKorrektBelegt(
  zuordnungen: Record<string, string> | undefined,
  zoneId: string,
  korrektesLabel: string,
): boolean {
  const soll = korrektesLabel.trim().toLowerCase()
  return labelsInZone(zuordnungen, zoneId).some(l => l.trim().toLowerCase() === soll)
}
