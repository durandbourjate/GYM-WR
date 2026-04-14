import type { Antwort, Selbstbewertung } from '../types/antworten.ts'

/**
 * Alias-Mapping: Üben-interne Typnamen → kanonische Antwort-Typen.
 * Ermöglicht die Normalisierung von Legacy-Üben-Antworten auf das
 * vereinheitlichte Antwort-Schema aus src/types/antworten.ts.
 */
const ALIAS_MAP: Record<string, string> = {
  multi: 'mc',
  tf: 'richtigfalsch',
  fill: 'lueckentext',
  calc: 'berechnung',
  sort: 'sortierung',
  open: 'freitext',
  zeichnen: 'visualisierung',
  bilanz: 'bilanzstruktur',
  gruppe: 'aufgabengruppe',
}

/**
 * Normalisiert eine rohe Antwort (z.B. aus dem Üben-Store oder einem älteren
 * Datenformat) auf den kanonischen Antwort-Typ.
 *
 * Behandelt:
 * - Typ-Aliase (multi → mc, open → freitext, etc.)
 * - Abweichende Feldnamen (gewaehlt → gewaehlteOptionen, wert → ergebnisse, etc.)
 * - Fehlende optionale Felder mit sinnvollen Standardwerten
 */
export function normalizeAntwort(raw: unknown): Antwort {
  if (!raw || typeof raw !== 'object' || !('typ' in raw)) return raw as Antwort

  const r = raw as Record<string, unknown>
  const typ = ALIAS_MAP[r.typ as string] ?? (r.typ as string)

  switch (typ) {
    case 'mc': {
      // Prüfungs-Format: gewaehlteOptionen (string[])
      if ('gewaehlteOptionen' in r) return { ...r, typ: 'mc' } as Antwort
      // Üben-Format (MCAntwort): gewaehlt (string), MultiAntwort: gewaehlt (string[])
      const gewaehlt = r.gewaehlt
      return {
        typ: 'mc',
        gewaehlteOptionen: Array.isArray(gewaehlt) ? gewaehlt : [gewaehlt as string],
      }
    }

    case 'freitext':
      return {
        typ: 'freitext',
        text: (r.text as string) ?? '',
        formatierung: r.formatierung as string | undefined,
        selbstbewertung: r.selbstbewertung as Selbstbewertung | undefined,
      }

    case 'richtigfalsch':
      return {
        typ: 'richtigfalsch',
        bewertungen: (r.bewertungen as Record<string, boolean>) ?? {},
      }

    case 'lueckentext':
      return {
        typ: 'lueckentext',
        eintraege: (r.eintraege as Record<string, string>) ?? {},
      }

    case 'berechnung': {
      if ('ergebnisse' in r) {
        return {
          typ: 'berechnung',
          ergebnisse: r.ergebnisse as Record<string, string>,
          rechenweg: r.rechenweg as string | undefined,
        }
      }
      // Üben-Format: wert (string) oder werte (Record<string, string>)
      const ergebnisse = (r.werte as Record<string, string>) ?? { default: (r.wert as string) ?? '' }
      return {
        typ: 'berechnung',
        ergebnisse,
        rechenweg: r.rechenweg as string | undefined,
      }
    }

    case 'hotspot': {
      // Üben-Format: klicks (HotspotAntwort), Prüfungs-Format: klicks (umbenannt von geklickt)
      const klicks = (r.klicks ?? r.geklickt ?? []) as { x: number; y: number }[]
      return { typ: 'hotspot', klicks }
    }

    case 'visualisierung': {
      // Üben-Format: datenUrl, Prüfungs-Format: daten
      const daten = (r.daten ?? r.datenUrl ?? '') as string
      return {
        typ: 'visualisierung',
        daten,
        bildLink: r.bildLink as string | undefined,
        selbstbewertung: r.selbstbewertung as Selbstbewertung | undefined,
      }
    }

    case 'bildbeschriftung': {
      // Üben-Format: texte (BildbeschriftungAntwort), Prüfungs-Format: eintraege
      const eintraege = (r.eintraege ?? r.texte ?? {}) as Record<string, string>
      return { typ: 'bildbeschriftung', eintraege }
    }

    case 'buchungssatz': {
      // Prüfungs-Format: buchungen[].sollKonto / habenKonto
      if ('buchungen' in r && Array.isArray(r.buchungen) && r.buchungen[0]?.sollKonto !== undefined) {
        return { ...r, typ: 'buchungssatz' } as Antwort
      }
      // Üben-Format: zeilen[].soll / haben
      const zeilen = (r.zeilen ?? r.buchungen ?? []) as Array<Record<string, unknown>>
      const buchungen = zeilen.map((z, i) => ({
        id: (z.id as string) ?? `b${i}`,
        sollKonto: (z.sollKonto ?? z.soll ?? '') as string,
        habenKonto: (z.habenKonto ?? z.haben ?? '') as string,
        betrag: (z.betrag as number) ?? 0,
      }))
      return { typ: 'buchungssatz', buchungen }
    }

    case 'aufgabengruppe': {
      const teilAntworten: Record<string, Antwort> = {}
      const raw_teil = (r.teilAntworten ?? {}) as Record<string, unknown>
      for (const [key, val] of Object.entries(raw_teil)) {
        teilAntworten[key] = normalizeAntwort(val)
      }
      return { typ: 'aufgabengruppe', teilAntworten }
    }

    default:
      return { ...r, typ } as Antwort
  }
}
