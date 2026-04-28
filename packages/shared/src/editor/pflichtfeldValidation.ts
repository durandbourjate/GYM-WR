import type { Frage } from '../types/fragen'

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
    switch ((frage as any).typ) {
      case 'mc':
        return validiereMC(frage as any)
      case 'richtigfalsch':
        return validiereRichtigFalsch(frage as any)
      case 'lueckentext':
        return validiereLueckentext(frage as any)
      case 'sortierung':
        return validiereSortierung(frage as any)
      case 'zuordnung':
        return validiereZuordnung(frage as any)
      case 'bildbeschriftung':
        return validiereBildbeschriftung(frage as any)
      case 'dragdrop_bild':
        return validiereDragDropBild(frage as any)
      case 'hotspot':
        return validiereHotspot(frage as any)
      case 'freitext':
        return validiereFreitext(frage as any)
      case 'berechnung':
        return validiereBerechnung(frage as any)
      case 'buchungssatz':
        return validiereBuchungssatz(frage as any)
      case 'tkonto':
        return validiereTKonto(frage as any)
      case 'kontenbestimmung':
        return validiereKontenbestimmung(frage as any)
      case 'bilanzstruktur':
        return validiereBilanzstruktur(frage as any)
      case 'visualisierung':
      case 'zeichnen':
        return validiereVisualisierung(frage as any)
      case 'pdf':
        return validierePDF(frage as any)
      case 'code':
        return validiereCode(frage as any)
      case 'formel':
        return validiereFormel(frage as any)
      case 'aufgabengruppe':
        return validiereAufgabengruppe(frage as any)
      case 'audio':
        return DEFAULT_OK
      default:
        console.warn(`[pflichtfeldValidation] Unbekannter typ: ${(frage as any).typ}`)
        return DEFAULT_KONSERVATIV
    }
  } catch (err) {
    console.error('[pflichtfeldValidation] crash:', err)
    return DEFAULT_OK
  }
}

function validiereRichtigFalsch(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : []
  const mitText = aussagen.filter((a: any) => strNonEmpty(a?.text))
  const mind2 = mitText.length >= 2
  const alleKorrektGeflaggt =
    aussagen.length > 0 && aussagen.every((a: any) => a?.korrekt === true || a?.korrekt === false)
  const erklaerungenAlle = aussagen.length > 0 && aussagen.every((a: any) => strNonEmpty(a?.erklaerung))

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

function validiereLueckentext(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const text = typeof frage.textMitLuecken === 'string' ? frage.textMitLuecken : ''
  const platzhalterOk = /\{\d+\}|\{\{\d+\}\}/.test(text)
  const luecken = Array.isArray(frage.luecken) ? frage.luecken : []
  const modus = frage.lueckentextModus === 'dropdown' ? 'dropdown' : 'freitext'

  const allLueckenOk =
    luecken.length > 0 &&
    luecken.every((l: any) => {
      if (modus === 'freitext') {
        const antworten = Array.isArray(l?.korrekteAntworten) ? l.korrekteAntworten : []
        return antworten.some((a: any) => strNonEmpty(a))
      }
      const dropdown = Array.isArray(l?.dropdownOptionen) ? l.dropdownOptionen : []
      const korrekt = Array.isArray(l?.korrekteAntworten) ? l.korrekteAntworten : []
      return dropdown.length >= 2 && korrekt.some((a: any) => strNonEmpty(a))
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

function validiereSortierung(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const elemente = Array.isArray(frage.elemente) ? frage.elemente : []
  const mind2 = elemente.filter((e: any) => strNonEmpty(e)).length >= 2

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

function validiereZuordnung(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const paare = Array.isArray(frage.paare) ? frage.paare : []
  const vollstaendig = paare.filter((p: any) => strNonEmpty(p?.links) && strNonEmpty(p?.rechts))
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

function validiereBildbeschriftung(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = strNonEmpty(frage.bildUrl)
  const beschriftungen = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : []
  const allBeschOk =
    beschriftungen.length > 0 &&
    beschriftungen.every((b: any) => {
      const pos = b?.position
      const posOk = pos && typeof pos.x === 'number' && typeof pos.y === 'number'
      const korrekt = Array.isArray(b?.korrekt) ? b.korrekt : []
      const hatAntwort = korrekt.some((k: any) => strNonEmpty(k))
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

function validiereDragDropBild(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = strNonEmpty(frage.bildUrl)
  const zielzonen = Array.isArray(frage.zielzonen) ? frage.zielzonen : []
  const labelsRaw = Array.isArray(frage.labels) ? frage.labels : []
  const labels: string[] = labelsRaw
    .map((l: any) => (typeof l === 'string' ? l.trim() : typeof l?.text === 'string' ? l.text.trim() : ''))
    .filter((l: string) => l.length > 0)
  const mind1Zone =
    zielzonen.length > 0 &&
    zielzonen.every((z: any) =>
      Array.isArray(z?.korrekteLabels) &&
      z.korrekteLabels.length > 0 &&
      z.korrekteLabels.every((l: unknown) => strNonEmpty(l)),
    )
  const alleLabelsImPool =
    mind1Zone &&
    zielzonen.every((z: any) =>
      (z.korrekteLabels as string[]).every((l) => labels.includes(l.trim())),
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

function validiereHotspot(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const bildOk = strNonEmpty(frage.bildUrl)
  const bereiche = Array.isArray(frage.bereiche)
    ? frage.bereiche
    : Array.isArray((frage as any).hotspots)
      ? (frage as any).hotspots
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

function validiereFreitext(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const musterOk = strNonEmpty(frage.musterlosung) || strNonEmpty(frage.musterloesung)
  const rasterOk =
    (Array.isArray(frage.bewertungsraster) && frage.bewertungsraster.length > 0) ||
    (Array.isArray((frage as any).bewertungskriterien) && (frage as any).bewertungskriterien.length > 0)
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

function validiereBerechnung(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const ergebnisse = Array.isArray(frage.ergebnisse) ? frage.ergebnisse : []
  const mind1Ergebnis =
    ergebnisse.length > 0 &&
    ergebnisse.every((e: any) => {
      const wert = e?.korrekt ?? e?.korrekteAntwort ?? e?.ergebnis
      return wert !== undefined && wert !== null && wert !== ''
    })
  const allFelderEmpfohlen =
    ergebnisse.length > 0 &&
    ergebnisse.every((e: any) => typeof e?.toleranz === 'number' && strNonEmpty(e?.einheit))
  const erklaerungEmpfohlen = strNonEmpty(frage.erklaerung)

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

function validiereBuchungssatz(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext) || strNonEmpty(frage.geschaeftsfall)
  const buchungen = Array.isArray(frage.buchungen) ? frage.buchungen : []
  const mind1 = buchungen.filter((b: any) => strNonEmpty(b?.sollKonto) || strNonEmpty(b?.habenKonto)).length >= 1

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

function validiereTKonto(frage: any): ValidationResult {
  const aufgabentextOk = strNonEmpty(frage.aufgabentext) || strNonEmpty(frage.tkAufgabentext)
  const konten = Array.isArray(frage.konten) ? frage.konten : []
  const mind1 = konten.filter((k: any) => strNonEmpty(k?.kontonummer)).length >= 1

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

function validiereKontenbestimmung(frage: any): ValidationResult {
  const aufgabentextOk = strNonEmpty(frage.aufgabentext)
  const aufgaben = Array.isArray(frage.aufgaben) ? frage.aufgaben : []
  const mind1 = aufgaben.filter((a: any) => strNonEmpty(a?.text)).length >= 1

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

function validiereBilanzstruktur(frage: any): ValidationResult {
  const aufgabentextOk = strNonEmpty(frage.aufgabentext)
  const konten = Array.isArray(frage.kontenMitSaldi) ? frage.kontenMitSaldi : []
  const mind1 =
    konten.filter((k: any) => {
      const wert = k?.saldo ?? k?.betrag
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

function validiereVisualisierung(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const untertypOk = strNonEmpty(frage.untertyp)
  const konfigOk =
    (frage.canvasConfig && typeof frage.canvasConfig === 'object') ||
    (frage.ausgangsdiagramm && typeof frage.ausgangsdiagramm === 'object')

  const pflichtLeer: string[] = []
  if (!fragetextOk) pflichtLeer.push('Frage-Text')
  if (!untertypOk) pflichtLeer.push('Untertyp')
  if (!konfigOk) pflichtLeer.push('Canvas- oder Diagramm-Konfiguration')

  return {
    pflichtErfuellt: pflichtLeer.length === 0,
    empfohlenErfuellt: true,
    felderStatus: {
      fragetext: fragetextOk ? 'ok' : 'pflicht-leer',
      untertyp: untertypOk ? 'ok' : 'pflicht-leer',
      konfig: konfigOk ? 'ok' : 'pflicht-leer',
    },
    pflichtLeerFelder: pflichtLeer,
    empfohlenLeerFelder: [],
  }
}

function validierePDF(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const pdfOk = strNonEmpty(frage.pdfDriveFileId) || strNonEmpty(frage.pdfUrl) || strNonEmpty(frage.pdfBase64)
  const werkzeugeRaw = Array.isArray(frage.pdfErlaubteWerkzeuge)
    ? frage.pdfErlaubteWerkzeuge
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

function validiereCode(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const sprachenOk = strNonEmpty(frage.sprache)
  const musterOk = strNonEmpty(frage.musterLoesung) || strNonEmpty(frage.musterloesung)
  const testCases = Array.isArray(frage.testCases) ? frage.testCases : []
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

function validiereFormel(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const formelOk = strNonEmpty(frage.korrekteFormel)
  const toleranzOk = typeof frage.toleranz === 'number'
  const erklaerungOk = strNonEmpty(frage.erklaerung)

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

function validiereAufgabengruppe(frage: any, ebene = 0): ValidationResult {
  if (ebene >= 3) {
    console.warn('[pflichtfeldValidation] Aufgabengruppen-Tiefe > 3, pass-through')
    return DEFAULT_OK
  }
  const fragetextOk = strNonEmpty(frage.fragetext) || strNonEmpty(frage.kontext)
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
  const sub = teilaufgaben.map((t: any) =>
    t?.typ === 'aufgabengruppe' ? validiereAufgabengruppe(t, ebene + 1) : validierePflichtfelder(t),
  )
  return {
    pflichtErfuellt: fragetextOk && sub.every((s: ValidationResult) => s.pflichtErfuellt),
    empfohlenErfuellt: sub.every((s: ValidationResult) => s.empfohlenErfuellt),
    felderStatus: { fragetext: fragetextOk ? 'ok' : 'pflicht-leer' },
    pflichtLeerFelder: [
      ...(fragetextOk ? [] : ['Frage-Text']),
      ...sub.flatMap((s: ValidationResult) => s.pflichtLeerFelder),
    ],
    empfohlenLeerFelder: sub.flatMap((s: ValidationResult) => s.empfohlenLeerFelder),
  }
}

function validiereMC(frage: any): ValidationResult {
  const fragetextOk = strNonEmpty(frage.fragetext)
  const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
  const mind2 = optionen.filter((o: any) => strNonEmpty(o?.text)).length >= 2
  const eineKorrekt = optionen.some((o: any) => o?.korrekt === true)
  const erklaerungenAlle = optionen.length > 0 && optionen.every((o: any) => strNonEmpty(o?.erklaerung))

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
