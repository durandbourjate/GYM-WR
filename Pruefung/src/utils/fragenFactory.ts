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
  AufgabengruppeFrage,
  VisualisierungFrage, CanvasConfig,
  PDFFrage, PDFKategorie, PDFAnnotationsWerkzeug, PDFAnnotation,
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
  | { typ: 'mc'; fragetext: string; optionen: MCOption[]; mehrfachauswahl: boolean }
  | { typ: 'freitext'; fragetext: string; laenge: 'kurz' | 'mittel' | 'lang'; placeholder: string }
  | { typ: 'lueckentext'; fragetext: string; textMitLuecken: string; luecken: LueckentextFrage['luecken'] }
  | { typ: 'zuordnung'; fragetext: string; paare: { links: string; rechts: string }[] }
  | { typ: 'richtigfalsch'; fragetext: string; aussagen: RichtigFalschFrage['aussagen'] }
  | { typ: 'berechnung'; fragetext: string; ergebnisse: BerechnungFrage['ergebnisse']; rechenwegErforderlich: boolean; hilfsmittel: string }
  | { typ: 'buchungssatz'; geschaeftsfall: string; buchungen: BuchungssatzZeile[]; kontenauswahl: KontenauswahlConfig }
  | { typ: 'tkonto'; aufgabentext: string; geschaeftsfaelle: string[]; konten: TKontoDefinition[]; kontenauswahl: KontenauswahlConfig; bewertungsoptionen: TKontoBewertung }
  | { typ: 'kontenbestimmung'; aufgabentext: string; modus: KontenbestimmungFrage['modus']; aufgaben: Kontenaufgabe[]; kontenauswahl: KontenauswahlConfig }
  | { typ: 'bilanzstruktur'; aufgabentext: string; modus: BilanzERFrage['modus']; kontenMitSaldi: KontoMitSaldo[]; loesung: BilanzERLoesung; bewertungsoptionen: BilanzERBewertung }
  | { typ: 'aufgabengruppe'; kontext: string; teilaufgabenIds: string[] }
  | { typ: 'visualisierung'; untertyp?: VisualisierungFrage['untertyp']; fragetext?: string; canvasConfig?: CanvasConfig; musterloesungBild?: string }
  | { typ: 'pdf'; fragetext: string; pdfDriveFileId?: string; pdfBase64?: string; pdfUrl?: string; pdfDateiname: string; seitenAnzahl: number; kategorien?: PDFKategorie[]; erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]; musterloesungAnnotationen?: PDFAnnotation[] }

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
      } as MCFrage

    case 'freitext':
      return {
        ...basis,
        typ: 'freitext',
        fragetext: typDaten.fragetext.trim(),
        laenge: typDaten.laenge,
        hilfstextPlaceholder: typDaten.placeholder.trim() || undefined,
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
        teilaufgabenIds: typDaten.teilaufgabenIds,
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
  }
}
