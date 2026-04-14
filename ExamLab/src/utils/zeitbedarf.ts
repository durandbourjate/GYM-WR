import type { BloomStufe } from '../types/fragen.ts'

type FrageTypKey = 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung'

/**
 * Richtwert-Tabelle: Minuten pro Fragetyp × Bloom-Stufe.
 * Freitext wird nach Länge differenziert (kurz/mittel/lang).
 */
const ZEITBEDARF: Record<string, Record<BloomStufe, number>> = {
  mc:                { K1: 1, K2: 1.5, K3: 2,   K4: 2.5, K5: 3,  K6: 3 },
  'freitext-kurz':   { K1: 2, K2: 3,   K3: 4,   K4: 5,   K5: 6,  K6: 7 },
  'freitext-mittel': { K1: 3, K2: 4,   K3: 6,   K4: 8,   K5: 10, K6: 12 },
  'freitext-lang':   { K1: 5, K2: 7,   K3: 9,   K4: 12,  K5: 15, K6: 18 },
  lueckentext:       { K1: 1, K2: 1.5, K3: 2,   K4: 2.5, K5: 3,  K6: 3 },
  zuordnung:         { K1: 1.5, K2: 2, K3: 2.5, K4: 3,   K5: 3.5, K6: 4 },
  richtigfalsch:     { K1: 1, K2: 1.5, K3: 2,   K4: 2.5, K5: 3,  K6: 3 },
  berechnung:        { K1: 2, K2: 3,   K3: 4,   K4: 5,   K5: 7,  K6: 8 },
}

/** Fallback für unbekannte Typen (z.B. visualisierung) */
const FALLBACK_MINUTEN = 5

/**
 * Berechnet den geschätzten Zeitbedarf einer Frage in Minuten.
 * Für Freitext wird die erwartete Antwortlänge berücksichtigt.
 */
export function berechneZeitbedarf(
  typ: FrageTypKey,
  bloom: BloomStufe,
  extras?: { laenge?: 'kurz' | 'mittel' | 'lang' },
): number {
  let schluessel: string = typ

  if (typ === 'freitext') {
    schluessel = `freitext-${extras?.laenge ?? 'mittel'}`
  }

  const tabelle = ZEITBEDARF[schluessel]
  if (!tabelle) return FALLBACK_MINUTEN

  return tabelle[bloom] ?? FALLBACK_MINUTEN
}
