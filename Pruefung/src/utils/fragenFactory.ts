/**
 * Konstruktion von Frage-Objekten aus Basisdaten + typ-spezifischen Daten.
 * Extrahiert aus FragenEditor.tsx — handleSpeichern switch-Statement.
 */
import type {
  Frage, Fachbereich, BloomStufe, FrageAnhang,
  MCFrage, FreitextFrage, LueckentextFrage, ZuordnungFrage,
  RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage,
  TKontoFrage, TKontoDefinition, TKontoBewertung,
  KontenbestimmungFrage, Kontenaufgabe,
  BilanzERFrage, KontoMitSaldo, BilanzERLoesung, BilanzERBewertung,
  BuchungssatzZeile, KontenauswahlConfig,
  MCOption, Bewertungskriterium,
  AufgabengruppeFrage, InlineTeilaufgabe,
  VisualisierungFrage, CanvasConfig,
  PDFFrage, PDFKategorie, PDFAnnotationsWerkzeug, PDFAnnotation,
  SortierungFrage, HotspotFrage, HotspotBereich,
  BildbeschriftungFrage, BildbeschriftungLabel,
  AudioFrage, DragDropBildFrage, DragDropBildZielzone,
  CodeFrage, FormelFrage,
} from '../types/fragen.ts'
import { parseLuecken } from '../components/lp/frageneditor/editorUtils.ts'
import {
  generiereMuserloesungBuchungssatz,
  generiereMuserloesungTKonto,
  generiereMuserloesungKontenbestimmung,
  generiereMuserloesungBilanzER,
} from './musterloesungGenerierung.ts'

/** Gemeinsame Basis-Felder (typ-unabhängig) */
export interface FrageBasis {
  id: string
  version: number
  erstelltAm: string
  geaendertAm: string
  fachbereich: Fachbereich
  fach: string
  thema: string
  unterthema?: string
  semester: string[]
  gefaesse: string[]
  bloom: BloomStufe
  tags: (string | import('../types/tags').Tag)[]
  punkte: number
  musterlosung: string
  bewertungsraster: Bewertungskriterium[]
  zeitbedarf: number
  verwendungen: Frage['verwendungen']
  quelle: Frage['quelle']
  anhaenge?: FrageAnhang[]
  autor?: string
  geteilt: 'privat' | 'fachschaft' | 'schule'
  berechtigungen?: import('../types/auth').Berechtigung[]
}

/** Typ-spezifische Daten — discriminated union */
export type TypSpezifischeDaten =
  | { typ: 'mc'; fragetext: string; optionen: MCOption[]; mehrfachauswahl: boolean; erklaerungSichtbar?: boolean }
  | { typ: 'freitext'; fragetext: string; laenge: 'kurz' | 'mittel' | 'lang'; placeholder: string; minWoerter?: number; maxWoerter?: number }
  | { typ: 'lueckentext'; fragetext: string; textMitLuecken: string; luecken: LueckentextFrage['luecken'] }
  | { typ: 'zuordnung'; fragetext: string; paare: { links: string; rechts: string }[] }
  | { typ: 'richtigfalsch'; fragetext: string; aussagen: RichtigFalschFrage['aussagen']; erklaerungSichtbar?: boolean }
  | { typ: 'berechnung'; fragetext: string; ergebnisse: BerechnungFrage['ergebnisse']; rechenwegErforderlich: boolean; hilfsmittel: string }
  | { typ: 'buchungssatz'; geschaeftsfall: string; buchungen: BuchungssatzZeile[]; kontenauswahl: KontenauswahlConfig }
  | { typ: 'tkonto'; aufgabentext: string; geschaeftsfaelle: string[]; konten: TKontoDefinition[]; kontenauswahl: KontenauswahlConfig; bewertungsoptionen: TKontoBewertung }
  | { typ: 'kontenbestimmung'; aufgabentext: string; modus: KontenbestimmungFrage['modus']; aufgaben: Kontenaufgabe[]; kontenauswahl: KontenauswahlConfig }
  | { typ: 'bilanzstruktur'; aufgabentext: string; modus: BilanzERFrage['modus']; kontenMitSaldi: KontoMitSaldo[]; loesung: BilanzERLoesung; bewertungsoptionen: BilanzERBewertung }
  | { typ: 'aufgabengruppe'; kontext: string; teilaufgabenIds: string[]; teilaufgaben?: InlineTeilaufgabe[] }
  | { typ: 'visualisierung'; untertyp?: VisualisierungFrage['untertyp']; fragetext?: string; canvasConfig?: CanvasConfig; musterloesungBild?: string }
  | { typ: 'pdf'; fragetext: string; pdfDriveFileId?: string; pdfBase64?: string; pdfUrl?: string; pdfDateiname: string; seitenAnzahl: number; kategorien?: PDFKategorie[]; erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]; musterloesungAnnotationen?: PDFAnnotation[] }
  | { typ: 'sortierung'; fragetext: string; elemente: string[]; teilpunkte: boolean }
  | { typ: 'hotspot'; fragetext: string; bildUrl: string; bereiche: HotspotBereich[]; mehrfachauswahl: boolean }
  | { typ: 'bildbeschriftung'; fragetext: string; bildUrl: string; beschriftungen: BildbeschriftungLabel[] }
  | { typ: 'audio'; fragetext: string; maxDauerSekunden?: number }
  | { typ: 'dragdrop_bild'; fragetext: string; bildUrl: string; zielzonen: DragDropBildZielzone[]; labels: string[] }
  | { typ: 'code'; fragetext: string; sprache: string; starterCode: string; musterLoesungCode: string }
  | { typ: 'formel'; fragetext: string; korrekteFormel: string; vergleichsModus: 'exakt' }

/** Erstellt ein vollständiges Frage-Objekt aus Basisdaten + typ-spezifischen Daten */
export function erstelleFrageObjekt(basis: FrageBasis, typDaten: TypSpezifischeDaten): Frage {
  switch (typDaten.typ) {
    case 'mc':
      return {
        ...basis,
        typ: 'mc',
        fragetext: typDaten.fragetext.trim(),
        optionen: typDaten.optionen.filter((o) => o.text.trim()),
        mehrfachauswahl: typDaten.mehrfachauswahl,
        zufallsreihenfolge: true,
        ...(typDaten.erklaerungSichtbar ? { erklaerungSichtbar: true } : {}),
      } as MCFrage

    case 'freitext':
      return {
        ...basis,
        typ: 'freitext',
        fragetext: typDaten.fragetext.trim(),
        laenge: typDaten.laenge,
        hilfstextPlaceholder: typDaten.placeholder.trim() || undefined,
        minWoerter: typDaten.minWoerter,
        maxWoerter: typDaten.maxWoerter,
      } as FreitextFrage

    case 'lueckentext':
      return {
        ...basis,
        typ: 'lueckentext',
        fragetext: typDaten.fragetext.trim(),
        textMitLuecken: typDaten.textMitLuecken.trim(),
        luecken: typDaten.luecken.length > 0 ? typDaten.luecken : parseLuecken(typDaten.textMitLuecken),
      } as LueckentextFrage

    case 'zuordnung':
      return {
        ...basis,
        typ: 'zuordnung',
        fragetext: typDaten.fragetext.trim(),
        paare: typDaten.paare.filter((p) => p.links.trim() && p.rechts.trim()),
        zufallsreihenfolge: true,
      } as ZuordnungFrage

    case 'richtigfalsch':
      return {
        ...basis,
        typ: 'richtigfalsch',
        fragetext: typDaten.fragetext.trim(),
        aussagen: typDaten.aussagen.filter((a) => a.text.trim()).map((a) => ({
          ...a,
          text: a.text.trim(),
        })),
        ...(typDaten.erklaerungSichtbar ? { erklaerungSichtbar: true } : {}),
      } as RichtigFalschFrage

    case 'berechnung':
      return {
        ...basis,
        typ: 'berechnung',
        fragetext: typDaten.fragetext.trim(),
        ergebnisse: typDaten.ergebnisse.filter((e) => e.label.trim()),
        rechenwegErforderlich: typDaten.rechenwegErforderlich,
        hilfsmittel: typDaten.hilfsmittel.trim() || undefined,
      } as BerechnungFrage

    case 'buchungssatz':
      return {
        ...basis,
        typ: 'buchungssatz',
        geschaeftsfall: typDaten.geschaeftsfall.trim(),
        buchungen: typDaten.buchungen,
        kontenauswahl: typDaten.kontenauswahl,
        musterlosung: generiereMuserloesungBuchungssatz(typDaten.buchungen),
      } as BuchungssatzFrage

    case 'tkonto':
      return {
        ...basis,
        typ: 'tkonto',
        aufgabentext: typDaten.aufgabentext.trim(),
        geschaeftsfaelle: typDaten.geschaeftsfaelle.filter(gf => gf.trim()),
        konten: typDaten.konten,
        kontenauswahl: typDaten.kontenauswahl,
        bewertungsoptionen: typDaten.bewertungsoptionen,
        musterlosung: generiereMuserloesungTKonto(typDaten.konten),
      } as TKontoFrage

    case 'kontenbestimmung':
      return {
        ...basis,
        typ: 'kontenbestimmung',
        aufgabentext: typDaten.aufgabentext.trim(),
        modus: typDaten.modus,
        aufgaben: typDaten.aufgaben.filter(a => a.text.trim()),
        kontenauswahl: typDaten.kontenauswahl,
        musterlosung: generiereMuserloesungKontenbestimmung(typDaten.aufgaben.filter(a => a.text.trim())),
      } as KontenbestimmungFrage

    case 'bilanzstruktur':
      return {
        ...basis,
        typ: 'bilanzstruktur',
        aufgabentext: typDaten.aufgabentext.trim(),
        modus: typDaten.modus,
        kontenMitSaldi: typDaten.kontenMitSaldi.filter(k => k.kontonummer),
        loesung: typDaten.loesung,
        bewertungsoptionen: typDaten.bewertungsoptionen,
        musterlosung: generiereMuserloesungBilanzER(typDaten.loesung, typDaten.kontenMitSaldi),
      } as BilanzERFrage

    case 'aufgabengruppe':
      return {
        ...basis,
        typ: 'aufgabengruppe',
        kontext: typDaten.kontext.trim(),
        ...(typDaten.teilaufgaben && typDaten.teilaufgaben.length > 0
          ? { teilaufgaben: typDaten.teilaufgaben }
          : {}),
        ...(typDaten.teilaufgabenIds && typDaten.teilaufgabenIds.length > 0
          ? { teilaufgabenIds: typDaten.teilaufgabenIds }
          : {}),
      } as AufgabengruppeFrage

    case 'visualisierung':
      return {
        ...basis,
        typ: 'visualisierung',
        untertyp: typDaten.untertyp || 'zeichnen',
        fragetext: typDaten.fragetext?.trim() || '',
        canvasConfig: typDaten.canvasConfig,
        musterloesungBild: typDaten.musterloesungBild,
      } as VisualisierungFrage

    case 'pdf':
      return {
        ...basis,
        typ: 'pdf',
        fragetext: typDaten.fragetext.trim(),
        pdfDriveFileId: typDaten.pdfDriveFileId,
        pdfBase64: typDaten.pdfBase64,
        pdfDateiname: typDaten.pdfDateiname,
        seitenAnzahl: typDaten.seitenAnzahl,
        kategorien: typDaten.kategorien,
        erlaubteWerkzeuge: typDaten.erlaubteWerkzeuge,
        musterloesungAnnotationen: typDaten.musterloesungAnnotationen,
      } as PDFFrage

    case 'sortierung':
      return {
        ...basis,
        typ: 'sortierung',
        fragetext: typDaten.fragetext.trim(),
        elemente: typDaten.elemente.filter(e => e.trim()),
        teilpunkte: typDaten.teilpunkte,
      } as SortierungFrage

    case 'hotspot':
      return {
        ...basis,
        typ: 'hotspot',
        fragetext: typDaten.fragetext.trim(),
        bildUrl: typDaten.bildUrl.trim(),
        bereiche: typDaten.bereiche,
        mehrfachauswahl: typDaten.mehrfachauswahl,
      } as HotspotFrage

    case 'bildbeschriftung':
      return {
        ...basis,
        typ: 'bildbeschriftung',
        fragetext: typDaten.fragetext.trim(),
        bildUrl: typDaten.bildUrl.trim(),
        beschriftungen: typDaten.beschriftungen,
      } as BildbeschriftungFrage

    case 'audio':
      return {
        ...basis,
        typ: 'audio',
        fragetext: typDaten.fragetext.trim(),
        maxDauerSekunden: typDaten.maxDauerSekunden,
      } as AudioFrage

    case 'dragdrop_bild':
      return {
        ...basis,
        typ: 'dragdrop_bild',
        fragetext: typDaten.fragetext.trim(),
        bildUrl: typDaten.bildUrl.trim(),
        zielzonen: typDaten.zielzonen,
        labels: typDaten.labels.filter(l => l.trim()),
      } as DragDropBildFrage

    case 'code':
      return {
        ...basis,
        typ: 'code',
        fragetext: typDaten.fragetext.trim(),
        sprache: typDaten.sprache,
        starterCode: typDaten.starterCode.trim() || undefined,
        musterLoesung: typDaten.musterLoesungCode.trim() || undefined,
      } as CodeFrage

    case 'formel':
      return {
        ...basis,
        typ: 'formel',
        fragetext: typDaten.fragetext.trim(),
        korrekteFormel: typDaten.korrekteFormel.trim(),
        vergleichsModus: typDaten.vergleichsModus,
      } as FormelFrage
  }
}
