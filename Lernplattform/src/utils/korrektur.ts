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

    // Selbstbewertete Typen: Ergebnis basiert auf Nutzer-Eingabe
    case 'open':
      return antwort.selbstbewertung === 'korrekt'

    case 'pdf':
      return antwort.selbstbewertung === 'korrekt'

    case 'zeichnen':
      return antwort.selbstbewertung === 'korrekt'

    case 'audio':
      return antwort.selbstbewertung === 'korrekt'

    case 'code':
      return antwort.selbstbewertung === 'korrekt'

    // Formel: normalisierter String-Vergleich
    case 'formel': {
      const soll = normalisiereLatex(frage.korrekt as string || '')
      const ist = normalisiereLatex(antwort.latex)
      return soll === ist
    }

    default:
      return false
  }
}

/** LaTeX normalisieren fuer Vergleich: Leerzeichen, Backslash-Varianten */
function normalisiereLatex(s: string): string {
  return s
    .replace(/\s+/g, '')           // Alle Leerzeichen entfernen
    .replace(/\\cdot/g, '\\times') // cdot und times gleichwertig
    .replace(/\*\*/g, '^')         // ** als Potenz
    .toLowerCase()
}
