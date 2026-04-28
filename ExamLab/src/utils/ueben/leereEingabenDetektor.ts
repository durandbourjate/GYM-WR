import type { Frage } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'

/**
 * Identifiziert eine spezifische Eingabe-Zone:
 * - 'gesamt' = die ganze Frage (für Single-Zone-Typen wie MC, Freitext, Berechnung-Wrapper, Lückentext-Wrapper)
 * - { typ: 'lueckenIndex', idx: number } = Lückentext-Lücke
 * - { typ: 'markerIndex', idx: number } = Bildbeschriftung-Marker
 * - { typ: 'paarIndex', idx: number } = Zuordnung-Paar
 * - { typ: 'aussageIndex', idx: number } = Richtigfalsch-Aussage
 * - { typ: 'ergebnisIndex', idx: number } = Berechnung-Ergebnis
 */
export type ZoneId =
  | 'gesamt'
  | { typ: 'lueckenIndex'; idx: number }
  | { typ: 'markerIndex'; idx: number }
  | { typ: 'paarIndex'; idx: number }
  | { typ: 'aussageIndex'; idx: number }
  | { typ: 'ergebnisIndex'; idx: number }

/**
 * Prüft, ob eine spezifische Eingabe-Zone einer SuS-Antwort leer ist.
 * Wird verwendet, um die Violett-Outline ("noch zu füllen"-Hinweis) auf
 * leeren Eingabe-Zonen im SuS-Üben/Prüfen-Modus zu rendern.
 *
 * Defensive: bei null/undefined antwort oder mismatch frage.typ+zone → true (leer).
 */
export function istEingabeLeer(
  frage: Frage,
  antwort: Antwort | null | undefined,
  zone: ZoneId,
): boolean {
  if (!antwort) return true

  switch (frage.typ) {
    case 'mc': {
      if (zone !== 'gesamt') return true
      if (antwort.typ !== 'mc') return true
      return (antwort.gewaehlteOptionen ?? []).length === 0
    }

    case 'richtigfalsch': {
      if (antwort.typ !== 'richtigfalsch') return true
      const bewertungen = antwort.bewertungen ?? {}
      const aussagen = frage.aussagen ?? []
      if (zone === 'gesamt') {
        // Leer wenn nicht alle Aussagen bewertet sind
        return aussagen.some(a => !(a.id in bewertungen))
      }
      if (typeof zone === 'object' && zone.typ === 'aussageIndex') {
        const aussage = aussagen[zone.idx]
        if (!aussage) return true
        return !(aussage.id in bewertungen)
      }
      return true
    }

    case 'lueckentext': {
      if (antwort.typ !== 'lueckentext') return true
      const eintraege = antwort.eintraege ?? {}
      const luecken = frage.luecken ?? []
      if (zone === 'gesamt') {
        if (luecken.length === 0) return true
        return luecken.some(l => !(eintraege[l.id]?.trim()))
      }
      if (typeof zone === 'object' && zone.typ === 'lueckenIndex') {
        const luecke = luecken[zone.idx]
        if (!luecke) return true
        return !(eintraege[luecke.id]?.trim())
      }
      return true
    }

    case 'zuordnung': {
      if (antwort.typ !== 'zuordnung') return true
      const zuordnungen = antwort.zuordnungen ?? {}
      const paare = frage.paare ?? []
      if (zone === 'gesamt') {
        if (paare.length === 0) return true
        return paare.some(p => !zuordnungen[p.links])
      }
      if (typeof zone === 'object' && zone.typ === 'paarIndex') {
        const paar = paare[zone.idx]
        if (!paar) return true
        return !zuordnungen[paar.links]
      }
      return true
    }

    case 'bildbeschriftung': {
      if (antwort.typ !== 'bildbeschriftung') return true
      const eintraege = antwort.eintraege ?? {}
      const beschriftungen = frage.beschriftungen ?? []
      if (zone === 'gesamt') {
        if (beschriftungen.length === 0) return true
        return beschriftungen.some(b => !(eintraege[b.id]?.trim()))
      }
      if (typeof zone === 'object' && zone.typ === 'markerIndex') {
        const marker = beschriftungen[zone.idx]
        if (!marker) return true
        return !(eintraege[marker.id]?.trim())
      }
      return true
    }

    case 'dragdrop_bild': {
      if (zone !== 'gesamt') return true
      if (antwort.typ !== 'dragdrop_bild') return true
      return Object.keys(antwort.zuordnungen ?? {}).length === 0
    }

    case 'freitext': {
      if (zone !== 'gesamt') return true
      if (antwort.typ !== 'freitext') return true
      const text = antwort.text ?? ''
      // HTML-Strip für Tiptap-Output: leerer Editor = '<p></p>'
      const stripped = text.replace(/<[^>]*>/g, '').trim()
      return stripped.length === 0
    }

    case 'berechnung': {
      if (antwort.typ !== 'berechnung') return true
      const ergebnisse = antwort.ergebnisse ?? {}
      const fragErgebnisse = frage.ergebnisse ?? []
      if (zone === 'gesamt') {
        if (fragErgebnisse.length === 0) return true
        return fragErgebnisse.some(e => !(ergebnisse[e.id]?.trim()))
      }
      if (typeof zone === 'object' && zone.typ === 'ergebnisIndex') {
        const erg = fragErgebnisse[zone.idx]
        if (!erg) return true
        return !(ergebnisse[erg.id]?.trim())
      }
      return true
    }

    default:
      // Andere Fragetypen (FiBu, Audio, PDF, ...) — kein Outline-Support, fail-safe leer
      return true
  }
}
