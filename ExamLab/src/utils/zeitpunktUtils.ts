/**
 * Zeitpunkt-Utilities — erzeugt aus einem Zeitpunkt-Modell die Liste
 * der verfügbaren Zeitpunkte (z.B. ['S1','S2',...,'S8']).
 *
 * Eingeführt in Bundle 12 K-4 (15.04.2026). Ersetzt die hartcodierte
 * Semester-Logik in PruefungFragenEditor.tsx.
 */
import type { SchulConfig, ZeitpunktModell, ZeitpunktModus } from '../types/schulConfig'

/** Präfix pro Modus — wird für das Kürzel verwendet (z.B. "S1", "Q1", "SJ1"). */
const MODUS_PRAEFIX: Record<ZeitpunktModus, string> = {
  schuljahr: 'SJ',
  semester: 'S',
  quartal: 'Q',
}

/** Menschenlesbares Label pro Modus (Singular). */
export function zeitpunktModusLabel(modus: ZeitpunktModus): string {
  switch (modus) {
    case 'schuljahr': return 'Schuljahr'
    case 'semester': return 'Semester'
    case 'quartal': return 'Quartal'
  }
}

/** Erzeugt die Zeitpunkt-Kürzel-Liste für ein Modell (z.B. ['S1','S2',...,'S8']). */
export function generateZeitpunkte(modell: ZeitpunktModell): string[] {
  const praefix = MODUS_PRAEFIX[modell.modus]
  return Array.from({ length: modell.anzahl }, (_, i) => `${praefix}${i + 1}`)
}

/**
 * Liefert das aktive Zeitpunkt-Modell aus der SchulConfig.
 * Fallback auf `semesterModell` (Legacy) wenn `zeitpunktModell` fehlt.
 */
export function zeitpunktModellAusConfig(
  config: SchulConfig,
  variante: 'regel' | 'taf' = 'regel',
): ZeitpunktModell {
  const neu = config.zeitpunktModell?.[variante]
  if (neu) return neu
  const legacy = config.semesterModell?.[variante]
  return {
    modus: 'semester',
    anzahl: legacy?.anzahl ?? 8,
  }
}
