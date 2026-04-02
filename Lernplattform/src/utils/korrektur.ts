import type { Frage, AntwortTyp } from '../types/fragen'

export function pruefeAntwort(frage: Frage, antwort: AntwortTyp): boolean {
  switch (antwort.typ) {
    case 'mc':
      return antwort.gewaehlt === frage.korrekt

    case 'multi': {
      const korrekt = frage.korrekt as string[]
      const gewaehlt = [...antwort.gewaehlt].sort()
      return korrekt.length === gewaehlt.length &&
        [...korrekt].sort().every((k, i) => k === gewaehlt[i])
    }

    case 'tf': {
      const aussagen = frage.aussagen || []
      return aussagen.every((a, i) =>
        antwort.bewertungen[String(i)] === a.korrekt
      )
    }

    case 'fill': {
      const luecken = frage.luecken || []
      return luecken.every(l =>
        (antwort.eintraege[l.id] || '').trim().toLowerCase() === l.korrekt.trim().toLowerCase()
      )
    }

    case 'calc': {
      const soll = parseFloat(frage.korrekt as string)
      const ist = parseFloat(antwort.wert)
      if (isNaN(soll) || isNaN(ist)) return false
      const toleranz = frage.toleranz ?? 0
      return Math.abs(soll - ist) <= toleranz
    }

    case 'sort': {
      const elemente = frage.elemente || []
      return elemente.every(e =>
        antwort.zuordnungen[e.text] === e.kategorie
      )
    }

    case 'sortierung': {
      const korrekt = frage.reihenfolge || []
      return korrekt.length === antwort.reihenfolge.length &&
        korrekt.every((k, i) => k === antwort.reihenfolge[i])
    }

    case 'zuordnung': {
      const paare = frage.paare || []
      return paare.every(p => antwort.paare[p.links] === p.rechts)
    }

    default:
      return false
  }
}
