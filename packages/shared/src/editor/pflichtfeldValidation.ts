import type {
  Frage,
  MCFrage, RichtigFalschFrage, LueckentextFrage, SortierungFrage,
  ZuordnungFrage, BildbeschriftungFrage, DragDropBildFrage, HotspotFrage,
  FreitextFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage,
  KontenbestimmungFrage, BilanzERFrage, VisualisierungFrage, PDFFrage,
  CodeFrage, FormelFrage, AufgabengruppeFrage,
} from '../types/fragen-core'
import { ermittleBildQuelle, ermittlePdfQuelle } from '../utils/mediaQuelleResolver'

export type FeldStatus = 'pflicht-leer' | 'empfohlen-leer' | 'ok'

export interface ValidationResult {
  pflichtErfuellt: boolean
  empfohlenErfuellt: boolean
  felderStatus: Record<string, FeldStatus>
  pflichtLeerFelder: string[]
  empfohlenLeerFelder: string[]
}

const DEFAULT_OK: ValidationResult = {
  pflichtErfuellt: true,
  empfohlenErfuellt: true,
  felderStatus: {},
  pflichtLeerFelder: [],
  empfohlenLeerFelder: [],
}

const DEFAULT_KONSERVATIV: ValidationResult = {
  ...DEFAULT_OK,
  empfohlenErfuellt: false,
}

function strNonEmpty(s: unknown): boolean {
  return typeof s === 'string' && s.trim().length > 0
}

export function validierePflichtfelder(frage: Frage | null | undefined): ValidationResult {
  if (!frage || typeof frage !== 'object') return DEFAULT_OK
  try {
    switch (frage.typ) {
      case 'mc': return validiereMC(frage)
      case 'richtigfalsch': return validiereRichtigFalsch(frage)
      case 'lueckentext': return validiereLueckentext(frage)
      case 'sortierung': return validiereSortierung(frage)
      case 'zuordnung': return validiereZuordnung(frage)
      case 'bildbeschriftung': return validiereBildbeschriftung(frage)
      case 'dragdrop_bild': return validiereDragDropBild(frage)
      case 'hotspot': return validiereHotspot(frage)
      case 'freitext': return validiereFreitext(frage)
      case 'berechnung': return validiereBerechnung(frage)
      case 'buchungssatz': return validiereBuchungssatz(frage)
      case 'tkonto': return validiereTKonto(frage)
      case 'kontenbestimmung': return validiereKontenbestimmung(frage)
      case 'bilanzstruktur': return validiereBilanzstruktur(frage)
      case 'visualisierung':
        return validiereVisualisierung(frage)
      case 'pdf': return validierePDF(frage)
      case 'code': return validiereCode(frage)
      case 'formel': return validiereFormel(frage)
      case 'aufgabengruppe': return validiereAufgabengruppe(frage)
      case 'audio': return DEFAULT_OK
      default: {
        // 'zeichnen' war Legacy-Variante von 'visualisierung' — TypeScript fängt
        // den Case nicht in der Frage-Union ab; default deckt unbekannte Strings.
        const unbekannterTyp = (frage as { typ?: unknown }).typ
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${String(unbekannterTyp)}`)
        return DEFAULT_KONSERVATIV
      }
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_OK
  }
}

function validiereRichtigFalsch(frage: RichtigFalschFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : []
  const mitText = aussagen.filter(a => strNonEmpty(a?.text))
  const mind2 = mitText.length >= 2
  const alleKorrektGeflaggt =
    aussagen.length > 0 && aussagen.every(a => a?.korrekt === true || a?.korrekt === false)
  const erklaerungenAlle = aussagen.length > 0 && aussagen.every(a => strNonEmpty(a?.erklaerung))

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 Aussagen mit Text')
  if (!alleKorrektGeflaggt) pflichtLeer.push('Jede Aussage richtig/falsch markieren')

  const empfohlenLeer: string[] = []
  if (!erklaerungenAlle) empfohlenLeer.push('Erklärung pro Aussage')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      aussagen: mind2 && alleKorrektGeflaggt ? 'ok' : 'pflicht-leer',
      erklaerungen: erklaerungenAlle ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}

function validiereLueckentext(frage: LueckentextFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const text = typeof frage.textMitLuecken === 'string' ? frage.textMitLuecken : ''
  const platzhalterOk = /\{\d+\}|\{\{\d+\}\}/.test(text)
  const luecken = Array.isArray(frage.luecken) ? frage.luecken : []
  const modus = frage.lueckentextModus === 'dropdown' ? 'dropdown' : 'freitext'

  const allLueckenOk =
    luecken.length > 0 &&
    luecken.every(l => {
      if (modus === 'freitext') {
        const antworten = Array.isArray(l?.korrekteAntworten) ? l.korrekteAntworten : []
        return antworten.some(a => strNonEmpty(a))
      }
      const dropdown = Array.isArray(l?.dropdownOptionen) ? l.dropdownOptionen : []
      const korrekt = Array.isArray(l?.korrekteAntworten) ? l.korrekteAntworten : []
      return dropdown.length >= 2 && korrekt.some(a => strNonEmpty(a))
    })

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!platzhalterOk) pflichtLeer.push('Lücken-Platzhalter im Text ({{1}})')
  if (!allLueckenOk) {
    pflichtLeer.push(
      modus === 'freitext'
        ? 'Pro Lücke mind. 1 korrekte Antwort'
        : 'Pro Lücke mind. 2 Dropdown-Optionen + 1 korrekt markiert',
    )
  }

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      textMitLuecken: platzhalterOk ? 'ok' : 'pflicht-leer',
      luecken: allLueckenOk ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereSortierung(frage: SortierungFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const elemente = Array.isArray(frage.elemente) ? frage.elemente : []
  const mind2 = elemente.filter(e => strNonEmpty(e)).length >= 2

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 Elemente mit Text')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      elemente: mind2 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereZuordnung(frage: ZuordnungFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const paare = Array.isArray(frage.paare) ? frage.paare : []
  const vollstaendig = paare.filter(p => strNonEmpty(p?.links) && strNonEmpty(p?.rechts))
  const mind2 = vollstaendig.length >= 2

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 vollständige Paare')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      paare: mind2 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereBildbeschriftung(frage: BildbeschriftungFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = ermittleBildQuelle(frage) !== null
  const beschriftungen = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : []
  const allBeschOk =
    beschriftungen.length > 0 &&
    beschriftungen.every(b => {
      const pos = b?.position
      const posOk = pos && typeof pos.x === 'number' && typeof pos.y === 'number'
      const korrekt = Array.isArray(b?.korrekt) ? b.korrekt : []
      const hatAntwort = korrekt.some(k => strNonEmpty(k))
      return posOk && hatAntwort
    })

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!bildOk) pflichtLeer.push('Bild-URL')
  if (!allBeschOk) pflichtLeer.push('Mind. 1 Beschriftung mit Position + korrekt-Antwort')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      bildUrl: bildOk ? 'ok' : 'pflicht-leer',
      beschriftungen: allBeschOk ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereDragDropBild(frage: DragDropBildFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = ermittleBildQuelle(frage) !== null
  const zielzonen = Array.isArray(frage.zielzonen) ? frage.zielzonen : []
  const labelsRaw: unknown[] = Array.isArray(frage.labels) ? frage.labels : [] // Defensive: Legacy-Daten können string[] statt DragDropBildLabel[] enthalten
  const labels: string[] = labelsRaw
    .map(l => (typeof l === 'string' ? l.trim() : typeof (l as { text?: unknown })?.text === 'string' ? (l as { text: string }).text.trim() : ''))
    .filter(l => l.length > 0)
  const mind1Zone =
    zielzonen.length > 0 &&
    zielzonen.every(z =>
      Array.isArray(z?.korrekteLabels) &&
      z.korrekteLabels.length > 0 &&
      z.korrekteLabels.every(l => strNonEmpty(l)),
    )
  const alleLabelsImPool =
    mind1Zone &&
    zielzonen.every(z =>
      z.korrekteLabels.every(l => labels.includes(l.trim())),
    )

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!bildOk) pflichtLeer.push('Bild-URL')
  if (!mind1Zone) pflichtLeer.push('Mind. 1 Zielzone mit Korrekt-Label')
  if (mind1Zone && !alleLabelsImPool) pflichtLeer.push('Alle Korrekt-Labels müssen im Labels-Pool sein')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      bildUrl: bildOk ? 'ok' : 'pflicht-leer',
      zielzonen: mind1Zone && alleLabelsImPool ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereHotspot(frage: HotspotFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = ermittleBildQuelle(frage) !== null
  const frageCompat = frage as unknown as { hotspots?: unknown[] } // Defensive: legacy 'hotspots' alias vor Kanonisierung zu 'bereiche'
  const bereiche = Array.isArray(frage.bereiche)
    ? frage.bereiche
    : Array.isArray(frageCompat.hotspots)
      ? frageCompat.hotspots
      : []
  const mind1 = bereiche.length >= 1

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!bildOk) pflichtLeer.push('Bild-URL')
  if (!mind1) pflichtLeer.push('Mind. 1 Bereich')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      bildUrl: bildOk ? 'ok' : 'pflicht-leer',
      bereiche: mind1 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereFreitext(frage: FreitextFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const frageCompat = frage as unknown as { musterloesung?: string; bewertungskriterien?: unknown[] } // Defensive: Legacy-Tippfehler-Aliases aus alten Datensätzen
  const musterOk = strNonEmpty(frage.musterlosung) || strNonEmpty(frageCompat.musterloesung)
  const rasterOk =
    (Array.isArray(frage.bewertungsraster) && frage.bewertungsraster.length > 0) ||
    (Array.isArray(frageCompat.bewertungskriterien) && frageCompat.bewertungskriterien.length > 0)
  const empfohlenOk = musterOk || rasterOk

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')

  const empfohlenLeer: string[] = []
  if (!empfohlenOk) empfohlenLeer.push('Musterlösung oder Bewertungsraster')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      musterloesung: empfohlenOk ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}

function validiereBerechnung(frage: BerechnungFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const ergebnisse = Array.isArray(frage.ergebnisse) ? frage.ergebnisse : []
  const mind1Ergebnis =
    ergebnisse.length > 0 &&
    ergebnisse.every(e => {
      const eCompat = e as unknown as { korrekteAntwort?: unknown; ergebnis?: unknown } // Defensive: Legacy-Feldnamen aus älteren Frage-Versionen
      const wert: unknown = e?.korrekt ?? eCompat?.korrekteAntwort ?? eCompat?.ergebnis
      return wert !== undefined && wert !== null && wert !== ''
    })
  const allFelderEmpfohlen =
    ergebnisse.length > 0 &&
    ergebnisse.every(e => typeof e?.toleranz === 'number' && strNonEmpty(e?.einheit))
  const frageCompat = frage as unknown as { erklaerung?: string } // Defensive: erklaerung existiert nicht auf BerechnungFrage-Typ, aber in älteren Datensätzen
  const erklaerungEmpfohlen = strNonEmpty(frageCompat.erklaerung)

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind1Ergebnis) pflichtLeer.push('Mind. 1 Ergebnis mit korrekter Antwort')

  const empfohlenLeer: string[] = []
  if (!allFelderEmpfohlen) empfohlenLeer.push('Toleranz + Einheit pro Ergebnis')
  if (!erklaerungEmpfohlen) empfohlenLeer.push('Erklärung')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      ergebnisse: mind1Ergebnis ? 'ok' : 'pflicht-leer',
      toleranz: allFelderEmpfohlen ? 'ok' : 'empfohlen-leer',
      erklaerung: erklaerungEmpfohlen ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}

function validiereBuchungssatz(frage: BuchungssatzFrage): ValidationResult {
  const frageCompat = frage as unknown as { fragetext?: string } // Defensive: Legacy 'fragetext'-Alias aus älteren Datensätzen
  const fragetextOk = strNonEmpty(frageCompat.fragetext) || strNonEmpty(frage.geschaeftsfall)
  const buchungen = Array.isArray(frage.buchungen) ? frage.buchungen : []
  const mind1 = buchungen.filter(b => strNonEmpty(b?.sollKonto) || strNonEmpty(b?.habenKonto)).length >= 1

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Geschäftsfall / Frage-Text')
  if (!mind1) pflichtLeer.push('Mind. 1 Buchung mit Konto')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      geschaeftsfall: fragetextOk ? 'ok' : 'pflicht-leer',
      buchungen: mind1 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereTKonto(frage: TKontoFrage): ValidationResult {
  const frageCompat = frage as unknown as { tkAufgabentext?: string } // Defensive: Legacy 'tkAufgabentext'-Alias aus älteren Datensätzen
  const aufgabentextOk = strNonEmpty(frage.aufgabentext) || strNonEmpty(frageCompat.tkAufgabentext)
  const konten = Array.isArray(frage.konten) ? frage.konten : []
  const mind1 = konten.filter(k => strNonEmpty(k?.kontonummer)).length >= 1

  const pflichtLeer: string[] = []
  if (!aufgabentextOk) pflichtLeer.push('Aufgabentext')
  if (!mind1) pflichtLeer.push('Mind. 1 T-Konto mit Kontonummer')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      aufgabentext: aufgabentextOk ? 'ok' : 'pflicht-leer',
      konten: mind1 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereKontenbestimmung(frage: KontenbestimmungFrage): ValidationResult {
  const aufgabentextOk = strNonEmpty(frage.aufgabentext)
  const aufgaben = Array.isArray(frage.aufgaben) ? frage.aufgaben : []
  const mind1 = aufgaben.filter(a => strNonEmpty(a?.text)).length >= 1

  const pflichtLeer: string[] = []
  if (!aufgabentextOk) pflichtLeer.push('Aufgabentext')
  if (!mind1) pflichtLeer.push('Mind. 1 Aufgabe mit Text')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      aufgabentext: aufgabentextOk ? 'ok' : 'pflicht-leer',
      aufgaben: mind1 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereBilanzstruktur(frage: BilanzERFrage): ValidationResult {
  const aufgabentextOk = strNonEmpty(frage.aufgabentext)
  const konten = Array.isArray(frage.kontenMitSaldi) ? frage.kontenMitSaldi : []
  const mind1 =
    konten.filter(k => {
      const kCompat = k as unknown as { betrag?: unknown } // Defensive: Legacy 'betrag'-Alias aus älteren Frage-Versionen
      const wert: unknown = k?.saldo ?? kCompat?.betrag
      return strNonEmpty(k?.kontonummer) && wert !== undefined && wert !== null && wert !== ''
    }).length >= 1

  const pflichtLeer: string[] = []
  if (!aufgabentextOk) pflichtLeer.push('Aufgabentext')
  if (!mind1) pflichtLeer.push('Mind. 1 Konto mit Saldo/Betrag')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      aufgabentext: aufgabentextOk ? 'ok' : 'pflicht-leer',
      kontenMitSaldi: mind1 ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereVisualisierung(frage: VisualisierungFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const konfigOk =
    (frage.canvasConfig && typeof frage.canvasConfig === 'object') ||
    (frage.ausgangsdiagramm && typeof frage.ausgangsdiagramm === 'object')

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!konfigOk) pflichtLeer.push('Canvas- oder Diagramm-Konfiguration')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      konfig: konfigOk ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validierePDF(frage: PDFFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const pdfOk = ermittlePdfQuelle(frage) !== null
  const frageCompat = frage as unknown as { pdfErlaubteWerkzeuge?: unknown[] } // Defensive: Legacy 'pdfErlaubteWerkzeuge'-Alias aus älteren Frage-Versionen
  const werkzeugeRaw = Array.isArray(frageCompat.pdfErlaubteWerkzeuge)
    ? frageCompat.pdfErlaubteWerkzeuge
    : Array.isArray(frage.erlaubteWerkzeuge)
      ? frage.erlaubteWerkzeuge
      : []
  const werkzeugeOk = werkzeugeRaw.length >= 1

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!pdfOk) pflichtLeer.push('PDF (Drive-ID oder URL)')
  if (!werkzeugeOk) pflichtLeer.push('Mind. 1 erlaubtes Werkzeug')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      pdf: pdfOk ? 'ok' : 'pflicht-leer',
      werkzeuge: werkzeugeOk ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validiereCode(frage: CodeFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const sprachenOk = strNonEmpty(frage.sprache)
  const frageCompat = frage as unknown as { musterloesung?: string; testCases?: unknown[] } // Defensive: Legacy-Feldnamen aus älteren Frage-Versionen
  const musterOk = strNonEmpty(frage.musterLoesung) || strNonEmpty(frageCompat.musterloesung)
  const testCases = Array.isArray(frageCompat.testCases) ? frageCompat.testCases : []
  const empfohlenOk = musterOk || testCases.length > 0

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!sprachenOk) pflichtLeer.push('Sprache')

  const empfohlenLeer: string[] = []
  if (!empfohlenOk) empfohlenLeer.push('Musterlösung oder Testfälle')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      sprache: sprachenOk ? 'ok' : 'pflicht-leer',
      musterloesung: empfohlenOk ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}

function validiereFormel(frage: FormelFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const formelOk = strNonEmpty(frage.korrekteFormel)
  const toleranzOk = typeof frage.toleranz === 'number'
  const frageCompat = frage as unknown as { erklaerung?: string } // Defensive: erklaerung nicht auf FormelFrage-Typ, aber in Daten vorhanden
  const erklaerungOk = strNonEmpty(frageCompat.erklaerung)

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!formelOk) pflichtLeer.push('Korrekte Formel')

  const empfohlenLeer: string[] = []
  if (!toleranzOk) empfohlenLeer.push('Toleranz')
  if (!erklaerungOk) empfohlenLeer.push('Erklärung')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      korrekteFormel: formelOk ? 'ok' : 'pflicht-leer',
      toleranz: toleranzOk ? 'ok' : 'empfohlen-leer',
      erklaerung: erklaerungOk ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}

function validiereAufgabengruppe(frage: AufgabengruppeFrage, ebene = 0): ValidationResult {
  if (ebene >= 3) {
    console.warn('[pflichtfeldValidation] Aufgabengruppen-Tiefe > 3, pass-through')
    return DEFAULT_OK
  }
  const frageCompat = frage as unknown as { fragetext?: string } // Defensive: Legacy 'fragetext'-Alias, AufgabengruppeFrage verwendet 'kontext'
  const fragetextOk = strNonEmpty(frageCompat.fragetext) || strNonEmpty(frage.kontext)
  const teilaufgaben = Array.isArray(frage.teilaufgaben) ? frage.teilaufgaben : []
  if (teilaufgaben.length === 0) {
    return {
      pflichtErfuellt: false,
      empfohlenErfuellt: true,
      felderStatus: { fragetext: fragetextOk ? 'ok' : 'pflicht-leer' },
      pflichtLeerFelder: [...(fragetextOk ? [] : ['Frage-Text']), 'Mind. 1 Teilaufgabe'],
      empfohlenLeerFelder: [],
    }
  }
  const sub = teilaufgaben.map(t =>
    t?.typ === 'aufgabengruppe'
      ? validiereAufgabengruppe(t as unknown as AufgabengruppeFrage, ebene + 1) // Defensive: InlineTeilaufgabe.typ ist string, kein Discriminated-Union-Mitglied
      : validierePflichtfelder(t as unknown as Frage), // Defensive: InlineTeilaufgabe ist kein Frage-Union-Mitglied, aber strukturell kompatibel für Validierung
  )
  return {
    pflichtErfuellt: fragetextOk && sub.every(s => s.pflichtErfuellt),
    empfohlenErfuellt: sub.every(s => s.empfohlenErfuellt),
    felderStatus: { fragetext: fragetextOk ? 'ok' : 'pflicht-leer' },
    pflichtLeerFelder: [
      ...(fragetextOk ? [] : ['Frage-Text']),
      ...sub.flatMap(s => s.pflichtLeerFelder),
    ],
    empfohlenLeerFelder: sub.flatMap(s => s.empfohlenLeerFelder),
  }
}

function validiereMC(frage: MCFrage): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
  const mind2 = optionen.filter(o => strNonEmpty(o?.text)).length >= 2
  const eineKorrekt = optionen.some(o => o?.korrekt === true)
  const erklaerungenAlle = optionen.length > 0 && optionen.every(o => strNonEmpty(o?.erklaerung))

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!mind2) pflichtLeer.push('Mind. 2 Optionen mit Text')
  if (!eineKorrekt) pflichtLeer.push('Mind. 1 korrekte Option markiert')

  const empfohlenLeer: string[] = []
  if (!erklaerungenAlle) empfohlenLeer.push('Erklärung pro Option')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: empfohlenLeer.length === 0,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      optionen: mind2 && eineKorrekt ? 'ok' : 'pflicht-leer',
      erklaerungen: erklaerungenAlle ? 'ok' : 'empfohlen-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: empfohlenLeer,
  }
}
