import type { Frage } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

/**
 * Prüft ob eine Frage vollständig beantwortet ist.
 * Bei Fragetypen mit Teilfragen (R/F, Lückentext, Berechnung, Zuordnung)
 * müssen ALLE Teile ausgefüllt sein, damit die Frage als grün/beantwortet gilt.
 */
export function istVollstaendigBeantwortet(frage: Frage, antwort: Antwort | undefined): boolean {
  if (!antwort) return false

  switch (antwort.typ) {
    case 'richtigfalsch': {
      if (frage.typ !== 'richtigfalsch') return true
      // Alle Aussagen müssen bewertet sein
      const anzahlAussagen = frage.aussagen.length
      const anzahlBewertet = Object.keys(antwort.bewertungen).length
      return anzahlBewertet >= anzahlAussagen
    }

    case 'lueckentext': {
      if (frage.typ !== 'lueckentext') return true
      // Alle Lücken müssen ausgefüllt sein (nicht leer)
      const anzahlLuecken = frage.luecken.length
      const ausgefuellt = Object.values(antwort.eintraege).filter(v => v.trim() !== '').length
      return ausgefuellt >= anzahlLuecken
    }

    case 'berechnung': {
      if (frage.typ !== 'berechnung') return true
      // Alle Ergebnisse müssen ausgefüllt sein
      const anzahlErgebnisse = frage.ergebnisse.length
      const beantwortet = Object.values(antwort.ergebnisse).filter(v => v.trim() !== '').length
      return beantwortet >= anzahlErgebnisse
    }

    case 'zuordnung': {
      if (frage.typ !== 'zuordnung') return true
      // Alle Paare müssen zugeordnet sein
      const anzahlPaare = frage.paare.length
      const zugeordnet = Object.keys(antwort.zuordnungen).length
      return zugeordnet >= anzahlPaare
    }

    case 'mc':
      // Mindestens eine Option muss gewählt sein
      return antwort.gewaehlteOptionen.length > 0

    case 'freitext':
      // Text darf nicht leer sein
      return antwort.text.replace(/<[^>]*>/g, '').trim().length > 0

    case 'buchungssatz': {
      // Mindestens eine Buchung mit Soll- und Haben-Konto ausgefüllt
      if (!antwort.buchungen || antwort.buchungen.length === 0) return false
      return antwort.buchungen.some(b =>
        b.sollKonten?.some(k => k.kontonummer && k.betrag > 0) &&
        b.habenKonten?.some(k => k.kontonummer && k.betrag > 0)
      )
    }

    case 'tkonto': {
      // Mindestens ein Konto mit einem Eintrag
      if (!antwort.konten || antwort.konten.length === 0) return false
      return antwort.konten.some(k =>
        (k.eintraegeLinks?.length > 0 || k.eintraegeRechts?.length > 0) || k.saldo != null
      )
    }

    case 'kontenbestimmung': {
      if (frage.typ !== 'kontenbestimmung') return true
      // Alle Aufgaben müssen eine Antwort haben
      const anzahlAufgaben = frage.aufgaben.length
      const beantwortet = Object.keys(antwort.aufgaben ?? {}).length
      return beantwortet >= anzahlAufgaben
    }

    case 'bilanzstruktur': {
      // Mindestens ein Konto muss zugeordnet sein
      const hatLinks = (antwort.bilanz?.linkeSeite?.gruppen ?? []).some((g: { konten: unknown[] }) => g.konten?.length > 0)
      const hatRechts = (antwort.bilanz?.rechteSeite?.gruppen ?? []).some((g: { konten: unknown[] }) => g.konten?.length > 0)
      return hatLinks || hatRechts
    }

    case 'visualisierung':
      // Zeichnung muss Daten haben
      return !!(antwort.daten && antwort.daten.length > 2)

    case 'pdf':
      // Mindestens eine Annotation
      return (antwort.annotationen ?? []).length > 0

    default:
      // Alle anderen Typen: Existenz reicht
      return true
  }
}
