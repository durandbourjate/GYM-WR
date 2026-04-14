import type { Frage, AufgabengruppeFrage } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'

/**
 * Prüft ob eine Frage vollständig beantwortet ist.
 * Bei Fragetypen mit Teilfragen (R/F, Lückentext, Berechnung, Zuordnung)
 * müssen ALLE Teile ausgefüllt sein, damit die Frage als grün/beantwortet gilt.
 * Bei Aufgabengruppen werden die Antworten der Teilaufgaben geprüft.
 */
export function istVollstaendigBeantwortet(
  frage: Frage,
  antwort: Antwort | undefined,
  alleFragen?: Frage[],
  alleAntworten?: Record<string, Antwort>
): boolean {
  // Aufgabengruppe: Prüfe ob ALLE Teilaufgaben beantwortet sind
  if (frage.typ === 'aufgabengruppe') {
    const gruppe = frage as AufgabengruppeFrage
    if (!alleAntworten || !alleFragen) return false

    // Neues Format: Inline-Teilaufgaben
    if (gruppe.teilaufgaben && gruppe.teilaufgaben.length > 0) {
      return gruppe.teilaufgaben.every(ta => {
        const teilFrage = alleFragen.find(f => f.id === ta.id)
        if (!teilFrage) return true
        return istVollstaendigBeantwortet(teilFrage, alleAntworten[ta.id])
      })
    }

    // Legacy-Format: ID-Referenzen
    if (!gruppe.teilaufgabenIds || gruppe.teilaufgabenIds.length === 0) return true
    return gruppe.teilaufgabenIds.every(teilId => {
      const teilFrage = alleFragen.find(f => f.id === teilId)
      if (!teilFrage) return true
      return istVollstaendigBeantwortet(teilFrage, alleAntworten[teilId])
    })
  }

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
        b.sollKonto && b.habenKonto && b.betrag > 0
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

    case 'sortierung':
      // Reihenfolge muss gesetzt sein
      return antwort.reihenfolge.length > 0

    case 'hotspot':
      // Mindestens ein Klick
      return antwort.klicks.length > 0

    case 'bildbeschriftung': {
      if (frage.typ !== 'bildbeschriftung') return true
      // Alle Labels muessen ausgefuellt sein
      const bbFrage = frage as import('../types/fragen.ts').BildbeschriftungFrage
      const anzahlLabels = bbFrage.beschriftungen.length
      const ausgefuellt = Object.values(antwort.eintraege).filter(v => v.trim() !== '').length
      return ausgefuellt >= anzahlLabels
    }

    case 'audio':
      // Audio-Aufnahme muss URL haben
      return !!(antwort.aufnahmeUrl && antwort.aufnahmeUrl.length > 0)

    case 'dragdrop_bild': {
      if (frage.typ !== 'dragdrop_bild') return true
      // Alle Zielzonen muessen zugeordnet sein
      const ddFrage = frage as import('../types/fragen.ts').DragDropBildFrage
      const anzahlZonen = ddFrage.zielzonen.length
      const zugeordnet = Object.keys(antwort.zuordnungen).length
      return zugeordnet >= anzahlZonen
    }

    case 'code':
      // Code darf nicht leer sein
      return antwort.code.trim().length > 0

    case 'formel':
      // LaTeX darf nicht leer sein
      return antwort.latex.trim().length > 0

    default:
      // Alle anderen Typen: Existenz reicht
      return true
  }
}
