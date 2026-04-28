/**
 * SharedFragenEditor — Generischer Editor-Hub für Prüfungsfragen.
 * Wird von Host-Apps (Pruefung, Lernplattform) mit EditorProvider + Slots genutzt.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useEditorConfig, useEditorServices } from './EditorContext'
import { useFocusTrap } from './hooks/useFocusTrap'
import { ResizableSidebar } from '../ui/ResizableSidebar'
import { defaultFachbereich } from './fachUtils'
import { validiereFrage } from './fragenValidierung'
import { validierePflichtfelder } from './pflichtfeldValidation'
import { buildFragePreview } from './buildFragePreview'
import PflichtfeldDialog from './components/PflichtfeldDialog'
import DoppelteLabelDialog from './components/DoppelteLabelDialog'
import PruefungstauglichBadge from './components/PruefungstauglichBadge'
import { erstelleFrageObjekt } from './fragenFactory'
import type { FrageBasis, TypSpezifischeDaten } from './fragenFactory'
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
  SortierungFrage, HotspotFrage, HotspotBereich, BildbeschriftungFrage, BildbeschriftungLabel,
  AudioFrage, DragDropBildFrage, DragDropBildZielzone,
  CodeFrage, FormelFrage, Lernziel,
} from '../types/fragen'
import type { Berechtigung } from '../types/auth'
import type { FrageTyp } from './editorUtils'
import { generiereFrageId } from './editorUtils'
import FrageTypAuswahl from './components/FrageTypAuswahl'
import { Abschnitt } from './components/EditorBausteine'
import BewertungsrasterEditor from './typen/BewertungsrasterEditor'
import { TKontoBewertungsoptionen } from './typen/TKontoEditor'
import { BilanzERBewertungsoptionen } from './typen/BilanzEREditor'
import { useKIAssistent } from './useKIAssistent'
import { InlineAktionButton, ErgebnisAnzeige } from './ki/KIBausteine'
import { baueTeilerklaerungsKontext, type TeilerklaerungsKontext } from './musterloesungKontext'
import { berechneZeitbedarf } from './zeitbedarf'
import type { FragenPerformance } from '../types/fragen'

// Sections (shared)
import MetadataSection from './sections/MetadataSection'
import FragetextSection from './sections/FragetextSection'
import TypEditorDispatcher from './sections/TypEditorDispatcher'
import MusterloesungSection from './sections/MusterloesungSection'

// Default-Komponente für Anhang (wenn kein Slot übergeben)
import DefaultAnhangEditor from './components/AnhangEditor'


/** Optionale Metadaten die beim Speichern mitgesendet werden (KI-Kalibrierungs-Loop) */
export interface SpeichernMeta {
  /** Offene KI-Feedbacks die noch nicht übernommen/verworfen wurden */
  offeneKIFeedbacks?: Array<{ aktion: string; feedbackId: string; wichtig: boolean }>
}

export interface SharedFragenEditorProps {
  /** Bestehende Frage zum Bearbeiten, oder null für neue */
  frage: Frage | null
  onSpeichern: (frage: Frage, meta?: SpeichernMeta) => void
  onAbbrechen: () => void
  /** Frage löschen (optional — nur bei bestehenden Fragen, mit Bestätigung) */
  onLoeschen?: (frage: Frage) => void
  /** Aggregierte Performance-Daten für diese Frage (optional) */
  performance?: FragenPerformance
  /** Zur vorherigen Frage wechseln (optional — zeigt Pfeil-Button). undefined = Button ausgeblendet. */
  onVorherigeFrage?: () => void
  /** Zur nächsten Frage wechseln (optional — zeigt Pfeil-Button). undefined = Button ausgeblendet. */
  onNaechsteFrage?: () => void

  // === Slot-Props (Host-spezifische UI) ===

  /** Anhang-Editor Slot (optional) */
  anhangEditorSlot?: (props: {
    anhaenge: FrageAnhang[]
    neueAnhaenge: File[]
    onAnhangHinzu: (file: File) => void
    onAnhangEntfernen: (id: string) => void
    onNeuenAnhangEntfernen: (idx: number) => void
    onUrlAnhangHinzu: (anhang: FrageAnhang) => void
  }) => React.ReactNode

  /** Berechtigungen-Editor Slot (optional) */
  berechtigungenSlot?: (props: {
    berechtigungen: Berechtigung[]
    onChange: (b: Berechtigung[]) => void
  }) => React.ReactNode

  /** Pool-Info Block Slot (optional, z.B. pruefungstauglich-Toggle) */
  poolInfoSlot?: (props: {
    frage: Frage | null
    typ: string
    onSpeichern: (frage: Frage, meta?: SpeichernMeta) => void
  }) => React.ReactNode

  /** Pool-Sync Header-Buttons Slot (optional) */
  poolSyncSlot?: (props: {
    frage: Frage | null
    typ: string
    onRueckSync: () => void
  }) => React.ReactNode

  /** Kompakte "Geteilt mit"-Statusanzeige in der Kopfzeile (Bundle 12 K-2, 15.04.2026).
   *  Wird links vom "Zurück"-Button gerendert. Host gibt typischerweise den
   *  BerechtigungenEditor im readOnly-Modus oder eine eigene Zusammenfassung. */
  berechtigungenHeaderSlot?: (props: {
    berechtigungen: Berechtigung[]
    geteilt: 'privat' | 'fachschaft' | 'schule'
  }) => React.ReactNode

  /** PDF-Editor Komponente (optional) */
  PDFEditorComponent?: React.ComponentType<any>

  /** Rück-Sync Dialog Slot (optional) */
  rueckSyncSlot?: (props: {
    offen: boolean
    onSchliessen: () => void
    onErfolg: (updates: Partial<Frage>) => void
  }) => React.ReactNode
}

/** Generischer Vollbild-Editor für Prüfungs-/Übungsfragen. Host wrapped mit EditorProvider. */
export default function SharedFragenEditor({
  frage, onSpeichern, onAbbrechen, onLoeschen, performance,
  onVorherigeFrage, onNaechsteFrage,
  anhangEditorSlot, berechtigungenSlot, poolInfoSlot, poolSyncSlot,
  berechtigungenHeaderSlot,
  PDFEditorComponent, rueckSyncSlot,
}: SharedFragenEditorProps) {
  const config = useEditorConfig()
  const services = useEditorServices()

  // Grunddaten
  const [typ, setTypRaw] = useState<FrageTyp>(frage?.typ as FrageTyp ?? 'mc')

  // Beim Typ-Wechsel: Standard-Bewertungsraster setzen (nur bei neuen Fragen)
  function setTyp(neuerTyp: FrageTyp) {
    setTypRaw(neuerTyp)
    if (frage) return // Bestehende Frage: Raster nicht überschreiben
    const defaults: Record<string, Bewertungskriterium[]> = {
      mc: [{ beschreibung: 'Korrekte Antwort(en)', punkte: 1 }],
      richtigfalsch: [{ beschreibung: 'Korrekte Bewertung', punkte: 1 }],
      freitext: [{ beschreibung: 'Inhalt & Sachkenntnis', punkte: 2 }, { beschreibung: 'Argumentation', punkte: 2 }, { beschreibung: 'Sprache & Darstellung', punkte: 1 }],
      lueckentext: [{ beschreibung: 'Korrekte Lücken', punkte: 2 }],
      zuordnung: [{ beschreibung: 'Korrekte Zuordnung', punkte: 2 }],
      berechnung: [{ beschreibung: 'Lösungsweg', punkte: 2 }, { beschreibung: 'Ergebnis', punkte: 1 }],
      sortierung: [{ beschreibung: 'Korrekte Reihenfolge', punkte: 2 }],
      hotspot: [{ beschreibung: 'Korrekte Position', punkte: 2 }],
      bildbeschriftung: [{ beschreibung: 'Korrekte Beschriftungen', punkte: 2 }],
      dragdrop_bild: [{ beschreibung: 'Korrekte Zuordnung', punkte: 2 }],
      code: [{ beschreibung: 'Funktionalität', punkte: 2 }, { beschreibung: 'Codequalität', punkte: 1 }],
      formel: [{ beschreibung: 'Korrekte Formel', punkte: 2 }],
      audio: [{ beschreibung: 'Inhalt & Verständlichkeit', punkte: 2 }],
      visualisierung: [{ beschreibung: 'Zeichnung korrekt', punkte: 2 }],
      pdf: [{ beschreibung: 'Annotation vollständig', punkte: 2 }],
      buchungssatz: [{ beschreibung: 'Konten korrekt', punkte: 1 }, { beschreibung: 'Betrag korrekt', punkte: 1 }],
      tkonto: [{ beschreibung: 'Buchungen korrekt', punkte: 2 }, { beschreibung: 'Saldo korrekt', punkte: 1 }],
      kontenbestimmung: [{ beschreibung: 'Korrekte Konten', punkte: 2 }],
      bilanzstruktur: [{ beschreibung: 'Korrekte Zuordnung', punkte: 2 }],
      aufgabengruppe: [{ beschreibung: '', punkte: 1 }],
    }
    const raster = defaults[neuerTyp] ?? [{ beschreibung: '', punkte: 1 }]
    setBewertungsraster(raster)
  }
  const [fachbereich, setFachbereich] = useState<Fachbereich>(frage?.fachbereich ?? defaultFachbereich(config.benutzer.fachschaft) as Fachbereich)
  const [thema, setThema] = useState(frage?.thema ?? '')
  const [unterthema, setUnterthema] = useState(frage?.unterthema ?? '')
  const [bloom, setBloom] = useState<BloomStufe>(frage?.bloom ?? 'K2')
  const [punkte, setPunkte] = useState(frage?.punkte ?? 1)
  const [tags, setTags] = useState((frage?.tags ?? []).join(', '))
  const [semester, setSemester] = useState<string[]>(frage?.semester ?? [])
  const [gefaesse, setGefaesse] = useState<string[]>(frage?.gefaesse ?? ['SF'])

  // Gemeinsam
  const [fragetext, setFragetext] = useState(
    frage && 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  )
  const [musterlosung, setMusterlosung] = useState(frage?.musterlosung ?? '')
  const [bewertungsraster, setBewertungsraster] = useState<Bewertungskriterium[]>(
    frage?.bewertungsraster ?? [{ beschreibung: '', punkte: 1 }]
  )

  // Punkte automatisch aus Bewertungsraster berechnen (nur gefüllte Kriterien)
  const bewertungsrasterGefuellt = bewertungsraster.filter((b) => b.beschreibung.trim())
  useEffect(() => {
    if (bewertungsrasterGefuellt.length > 0) {
      const summe = bewertungsrasterGefuellt.reduce((sum, k) => sum + k.punkte, 0)
      setPunkte(summe)
    }
  }, [bewertungsraster]) // eslint-disable-line react-hooks/exhaustive-deps

  // MC-spezifisch
  const [optionen, setOptionen] = useState<MCOption[]>(
    frage?.typ === 'mc' ? ((frage as MCFrage).optionen ?? [
      { id: 'a', text: '', korrekt: true },
      { id: 'b', text: '', korrekt: false },
      { id: 'c', text: '', korrekt: false },
      { id: 'd', text: '', korrekt: false },
    ]) : [
      { id: 'a', text: '', korrekt: true },
      { id: 'b', text: '', korrekt: false },
      { id: 'c', text: '', korrekt: false },
      { id: 'd', text: '', korrekt: false },
    ]
  )
  const [mehrfachauswahl, setMehrfachauswahl] = useState(
    frage?.typ === 'mc' ? (frage as MCFrage).mehrfachauswahl : false
  )

  // Freitext-spezifisch
  const [laenge, setLaenge] = useState<'kurz' | 'mittel' | 'lang'>(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).laenge : 'mittel'
  )
  const [placeholder, setPlaceholder] = useState(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).hilfstextPlaceholder ?? '' : ''
  )
  const [minWoerter, setMinWoerter] = useState<number | undefined>(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).minWoerter : undefined
  )
  const [maxWoerter, setMaxWoerter] = useState<number | undefined>(
    frage?.typ === 'freitext' ? (frage as FreitextFrage).maxWoerter : undefined
  )

  // Lückentext-spezifisch
  const [textMitLuecken, setTextMitLuecken] = useState(
    frage?.typ === 'lueckentext' ? (frage as LueckentextFrage).textMitLuecken : ''
  )
  const [luecken, setLuecken] = useState<LueckentextFrage['luecken']>(
    frage?.typ === 'lueckentext'
      // Defensive: einzelne Lücken können ohne korrekteAntworten aus Pool-/Alt-Daten kommen
      ? ((frage as LueckentextFrage).luecken ?? []).map(l => ({
          ...l,
          korrekteAntworten: Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : [],
        }))
      : []
  )
  const [lueckentextModus, setLueckentextModus] = useState<'freitext' | 'dropdown'>(
    frage?.typ === 'lueckentext'
      ? ((frage as LueckentextFrage).lueckentextModus ?? 'freitext')
      : 'freitext'
  )

  // Zuordnung-spezifisch
  const [paare, setPaare] = useState(
    frage?.typ === 'zuordnung' ? ((frage as ZuordnungFrage).paare ?? [
      { links: '', rechts: '' },
      { links: '', rechts: '' },
    ]) : [
      { links: '', rechts: '' },
      { links: '', rechts: '' },
    ]
  )

  // Richtig/Falsch-spezifisch
  const [aussagen, setAussagen] = useState<RichtigFalschFrage['aussagen']>(
    frage?.typ === 'richtigfalsch' ? ((frage as RichtigFalschFrage).aussagen ?? [
      { id: '1', text: '', korrekt: true },
      { id: '2', text: '', korrekt: false },
      { id: '3', text: '', korrekt: true },
    ]) : [
      { id: '1', text: '', korrekt: true },
      { id: '2', text: '', korrekt: false },
      { id: '3', text: '', korrekt: true },
    ]
  )
  const [erklaerungSichtbar, setErklaerungSichtbar] = useState(
    frage?.typ === 'richtigfalsch' ? (frage as RichtigFalschFrage).erklaerungSichtbar ?? false
    : frage?.typ === 'mc' ? ((frage as MCFrage).erklaerungSichtbar ?? false)
    : false
  )

  // Berechnung-spezifisch
  const [ergebnisse, setErgebnisse] = useState<BerechnungFrage['ergebnisse']>(
    frage?.typ === 'berechnung' ? ((frage as BerechnungFrage).ergebnisse ?? [
      { id: '1', label: 'Ergebnis', korrekt: 0, toleranz: 0, einheit: '' },
    ]) : [
      { id: '1', label: 'Ergebnis', korrekt: 0, toleranz: 0, einheit: '' },
    ]
  )
  const [rechenwegErforderlich, setRechenwegErforderlich] = useState(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).rechenwegErforderlich : true
  )
  const [hilfsmittel, setHilfsmittel] = useState(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).hilfsmittel ?? '' : ''
  )

  // Buchungssatz-spezifisch
  const [geschaeftsfall, setGeschaeftsfall] = useState(
    frage?.typ === 'buchungssatz' ? (frage as BuchungssatzFrage).geschaeftsfall : ''
  )
  const [buchungen, setBuchungen] = useState<BuchungssatzZeile[]>(
    frage?.typ === 'buchungssatz' ? ((frage as BuchungssatzFrage).buchungen ?? [
      { id: '1', sollKonto: '', habenKonto: '', betrag: 0 },
    ]) : [
      { id: '1', sollKonto: '', habenKonto: '', betrag: 0 },
    ]
  )
  const [kontenauswahl, setKontenauswahl] = useState<KontenauswahlConfig>(
    frage?.typ === 'buchungssatz' ? (frage as BuchungssatzFrage).kontenauswahl
    : frage?.typ === 'tkonto' ? (frage as TKontoFrage).kontenauswahl
    : { modus: 'voll' }
  )

  // T-Konto-spezifisch
  const [tkAufgabentext, setTkAufgabentext] = useState(
    frage?.typ === 'tkonto' ? (frage as TKontoFrage).aufgabentext : ''
  )
  const [tkGeschaeftsfaelle, setTkGeschaeftsfaelle] = useState<string[]>(
    frage?.typ === 'tkonto' ? (frage as TKontoFrage).geschaeftsfaelle ?? [] : []
  )
  const [tkKonten, setTkKonten] = useState<TKontoDefinition[]>(
    frage?.typ === 'tkonto' ? (frage as TKontoFrage).konten ?? [
      { id: '1', kontonummer: '', anfangsbestandVorgegeben: false, eintraege: [], saldo: { betrag: 0, seite: 'soll' } },
    ] : [
      { id: '1', kontonummer: '', anfangsbestandVorgegeben: false, eintraege: [], saldo: { betrag: 0, seite: 'soll' } },
    ]
  )
  const [tkBewertungsoptionen, setTkBewertungsoptionen] = useState<TKontoBewertung>(
    frage?.typ === 'tkonto' ? (frage as TKontoFrage).bewertungsoptionen : {
      beschriftungSollHaben: true,
      kontenkategorie: true,
      zunahmeAbnahme: true,
      buchungenKorrekt: true,
      saldoKorrekt: true,
    }
  )

  // Kontenbestimmung-spezifisch
  const [kbAufgabentext, setKbAufgabentext] = useState(
    frage?.typ === 'kontenbestimmung' ? (frage as KontenbestimmungFrage).aufgabentext : ''
  )
  const [kbModus, setKbModus] = useState<KontenbestimmungFrage['modus']>(
    frage?.typ === 'kontenbestimmung' ? (frage as KontenbestimmungFrage).modus : 'gemischt'
  )
  const [kbAufgaben, setKbAufgaben] = useState<Kontenaufgabe[]>(
    frage?.typ === 'kontenbestimmung' ? (frage as KontenbestimmungFrage).aufgaben ?? [
      { id: '1', text: '', erwarteteAntworten: [{}] },
    ] : [
      { id: '1', text: '', erwarteteAntworten: [{}] },
    ]
  )
  const [kbKontenauswahl, setKbKontenauswahl] = useState<KontenauswahlConfig>(
    frage?.typ === 'kontenbestimmung' ? (frage as KontenbestimmungFrage).kontenauswahl : { modus: 'voll' }
  )

  // Bilanz/ER-spezifisch
  const [biAufgabentext, setBiAufgabentext] = useState(
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).aufgabentext : ''
  )
  const [biModus, setBiModus] = useState<BilanzERFrage['modus']>(
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).modus : 'bilanz'
  )
  const [biKontenMitSaldi, setBiKontenMitSaldi] = useState<KontoMitSaldo[]>(
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).kontenMitSaldi ?? [{ kontonummer: '', saldo: 0 }] : [{ kontonummer: '', saldo: 0 }]
  )
  const [biLoesung, setBiLoesung] = useState<BilanzERLoesung>(
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).loesung : {}
  )
  const [biBewertungsoptionen, setBiBewertungsoptionen] = useState<BilanzERBewertung>(
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).bewertungsoptionen : {
      seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
      kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true,
      bilanzsummeOderGewinn: true, mehrstufigkeit: true,
    }
  )

  // Aufgabengruppe-spezifisch
  const [agKontext, setAgKontext] = useState(
    frage?.typ === 'aufgabengruppe' ? (frage as AufgabengruppeFrage).kontext : ''
  )
  const [agTeilaufgabenIds, setAgTeilaufgabenIds] = useState<string[]>(
    frage?.typ === 'aufgabengruppe' ? ((frage as AufgabengruppeFrage).teilaufgabenIds ?? []) : []
  )
  const [agTeilaufgaben, setAgTeilaufgaben] = useState<InlineTeilaufgabe[]>(
    frage?.typ === 'aufgabengruppe' ? ((frage as AufgabengruppeFrage).teilaufgaben ?? []) : []
  )

  // Visualisierung/Zeichnen-spezifisch
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>(
    frage?.typ === 'visualisierung' ? ((frage as VisualisierungFrage).canvasConfig ?? {
      breite: 800, hoehe: 600, koordinatensystem: false,
      werkzeuge: ['stift', 'linie', 'pfeil', 'rechteck', 'text'],
      groessePreset: 'mittel', radierer: true,
      farben: ['#000000', '#ef4444', '#3b82f6', '#22c55e'],
    }) : {
      breite: 800, hoehe: 600, koordinatensystem: false,
      werkzeuge: ['stift', 'linie', 'pfeil', 'rechteck', 'text'],
      groessePreset: 'mittel', radierer: true,
      farben: ['#000000', '#ef4444', '#3b82f6', '#22c55e'],
    }
  )
  const [musterloesungBild, setMusterloesungBild] = useState<string | undefined>(
    frage?.typ === 'visualisierung' ? (frage as VisualisierungFrage).musterloesungBild : undefined
  )

  // PDF-spezifisch
  const [pdfBase64, setPdfBase64] = useState(
    frage?.typ === 'pdf' ? (frage as PDFFrage).pdfBase64 ?? '' : ''
  )
  const [pdfDriveFileId, setPdfDriveFileId] = useState(
    frage?.typ === 'pdf' ? (frage as PDFFrage).pdfDriveFileId || '' : ''
  )
  const [pdfUrl, setPdfUrl] = useState(
    frage?.typ === 'pdf' ? (frage as PDFFrage).pdfUrl ?? '' : ''
  )
  const [pdfDateiname, setPdfDateiname] = useState(
    frage?.typ === 'pdf' ? (frage as PDFFrage).pdfDateiname : ''
  )
  const [pdfSeitenAnzahl, setPdfSeitenAnzahl] = useState(
    frage?.typ === 'pdf' ? (frage as PDFFrage).seitenAnzahl : 0
  )
  const [pdfKategorien, setPdfKategorien] = useState<PDFKategorie[]>(
    frage?.typ === 'pdf' ? (frage as PDFFrage).kategorien ?? [] : []
  )
  const [pdfErlaubteWerkzeuge, setPdfErlaubteWerkzeuge] = useState<PDFAnnotationsWerkzeug[]>(
    frage?.typ === 'pdf' ? (frage as PDFFrage).erlaubteWerkzeuge : ['highlighter', 'kommentar', 'freihand', 'label']
  )
  const [pdfMusterloesungAnnotationen, setPdfMusterloesungAnnotationen] = useState<PDFAnnotation[]>(
    frage?.typ === 'pdf' ? (frage as PDFFrage).musterloesungAnnotationen ?? [] : []
  )

  // Sortierung-spezifisch
  const [sortElemente, setSortElemente] = useState<string[]>(
    frage?.typ === 'sortierung' ? (frage as SortierungFrage).elemente ?? [] : []
  )
  const [sortTeilpunkte, setSortTeilpunkte] = useState(
    frage?.typ === 'sortierung' ? (frage as SortierungFrage).teilpunkte : true
  )

  // Gemeinsamer Bild-State für alle Bild-Fragetypen (Hotspot, Bildbeschriftung, DragDrop-Bild)
  const BILD_FRAGETYPEN = ['hotspot', 'bildbeschriftung', 'dragdrop_bild'] as const
  const [bildUrl, setBildUrl] = useState(() => {
    if (frage && (BILD_FRAGETYPEN as readonly string[]).includes(frage.typ)) {
      return (frage as { bildUrl?: string }).bildUrl ?? ''
    }
    return ''
  })

  // Hotspot-spezifisch
  const [hsBereiche, setHsBereiche] = useState<HotspotBereich[]>(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).bereiche ?? [] : []
  )
  const [hsMehrfachauswahl, setHsMehrfachauswahl] = useState(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).mehrfachauswahl : false
  )

  // Bildbeschriftung-spezifisch
  const [bbBeschriftungen, setBbBeschriftungen] = useState<BildbeschriftungLabel[]>(
    frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).beschriftungen ?? [] : []
  )

  // Audio-spezifisch
  const [audioMaxDauer, setAudioMaxDauer] = useState<number | undefined>(
    frage?.typ === 'audio' ? (frage as AudioFrage).maxDauerSekunden : undefined
  )

  // DragDrop-Bild-spezifisch
  const [ddZielzonen, setDdZielzonen] = useState<DragDropBildZielzone[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).zielzonen ?? [] : []
  )
  const [ddLabels, setDdLabels] = useState<string[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).labels ?? [] : []
  )

  // Code-spezifisch
  const [codeSprache, setCodeSprache] = useState(
    frage?.typ === 'code' ? (frage as CodeFrage).sprache : 'python'
  )
  const [codeStarterCode, setCodeStarterCode] = useState(
    frage?.typ === 'code' ? (frage as CodeFrage).starterCode ?? '' : ''
  )
  const [codeMusterLoesungCode, setCodeMusterLoesungCode] = useState(
    frage?.typ === 'code' ? (frage as CodeFrage).musterLoesung ?? '' : ''
  )

  // Formel-spezifisch
  const [formelKorrekteFormel, setFormelKorrekteFormel] = useState(
    frage?.typ === 'formel' ? (frage as FormelFrage).korrekteFormel : ''
  )
  const [formelVergleichsModus, setFormelVergleichsModus] = useState<'exakt'>(
    'exakt'
  )

  // Zeitbedarf
  const [zeitbedarf, setZeitbedarf] = useState<number>(
    frage?.zeitbedarf ?? berechneZeitbedarf(
      (frage?.typ ?? 'mc') as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung',
      frage?.bloom ?? 'K2',
      frage?.typ === 'freitext' ? { laenge: (frage as FreitextFrage).laenge } : undefined,
    )
  )
  const [zeitbedarfManuell, setZeitbedarfManuell] = useState(!!frage?.zeitbedarf)

  // Sharing (Google-Docs-Modell)
  const [geteilt, setGeteilt] = useState<'privat' | 'fachschaft' | 'schule'>(frage?.geteilt ?? 'privat')
  const [berechtigungen, setBerechtigungen] = useState<Berechtigung[]>((frage?.berechtigungen as Berechtigung[] | undefined) ?? [])

  // Anhänge
  const [anhaenge, setAnhaenge] = useState<FrageAnhang[]>(frage?.anhaenge ?? [])
  const [neueAnhaenge, setNeueAnhaenge] = useState<File[]>([])

  // Validierung
  const [fehler, setFehler] = useState<string[]>([])
  const [speicherLaeuft, setSpeicherLaeuft] = useState(false)

  // Pool-Rück-Sync
  const [rueckSyncOffen, setRueckSyncOffen] = useState(false)

  // KI-Assistent
  const ki = useKIAssistent()

  // C9 Task 24 — Teilerklärungs-Kontext für MusterloesungSection (Sub-Arrays im KI-Request + Writeback).
  // Nur für Fragetypen mit Sub-Struktur + IDs (Zuordnung hat keine IDs, FiBu rendert kein MusterloesungSection).
  const teilerklaerungsKontext = useMemo<TeilerklaerungsKontext | undefined>(() => {
    switch (typ) {
      case 'mc':
        return baueTeilerklaerungsKontext<MCOption>({
          feld: 'optionen',
          items: optionen,
          getId: (o) => o.id,
          getLabel: (o) => `${o.id.toUpperCase()}: ${(o.text || '').slice(0, 60) || '(leer)'}`,
          getErklaerung: (o) => o.erklaerung,
          setzeErklaerung: (o, e) => ({ ...o, erklaerung: e }),
          setItems: (u) => setOptionen((prev) => u(prev)),
        })
      case 'richtigfalsch':
        return baueTeilerklaerungsKontext<RichtigFalschFrage['aussagen'][number]>({
          feld: 'aussagen',
          items: aussagen,
          getId: (a) => a.id,
          getLabel: (a, i) => `#${i + 1}: ${(a.text || '').slice(0, 60) || '(leer)'}`,
          getErklaerung: (a) => a.erklaerung,
          setzeErklaerung: (a, e) => ({ ...a, erklaerung: e }),
          setItems: (u) => setAussagen((prev) => u(prev)),
        })
      case 'lueckentext':
        return baueTeilerklaerungsKontext<LueckentextFrage['luecken'][number]>({
          feld: 'luecken',
          items: luecken,
          getId: (l) => l.id,
          getLabel: (l, i) => `Lücke ${i + 1}: ${(l.korrekteAntworten[0] || '').slice(0, 40) || '(leer)'}`,
          getErklaerung: (l) => l.erklaerung,
          setzeErklaerung: (l, e) => ({ ...l, erklaerung: e }),
          setItems: (u) => setLuecken((prev) => u(prev)),
        })
      case 'hotspot':
        return baueTeilerklaerungsKontext<HotspotBereich>({
          feld: 'bereiche',
          items: hsBereiche,
          getId: (b) => b.id,
          getLabel: (b, i) => `Bereich ${i + 1}: ${(b.label || '').slice(0, 40) || '(leer)'}`,
          getErklaerung: (b) => b.erklaerung,
          setzeErklaerung: (b, e) => ({ ...b, erklaerung: e }),
          setItems: (u) => setHsBereiche((prev) => u(prev)),
        })
      case 'bildbeschriftung':
        return baueTeilerklaerungsKontext<BildbeschriftungLabel>({
          feld: 'beschriftungen',
          items: bbBeschriftungen,
          getId: (b) => b.id,
          getLabel: (b, i) => `Stelle ${i + 1}: ${(b.korrekt[0] || '').slice(0, 40) || '(leer)'}`,
          getErklaerung: (b) => b.erklaerung,
          setzeErklaerung: (b, e) => ({ ...b, erklaerung: e }),
          setItems: (u) => setBbBeschriftungen((prev) => u(prev)),
        })
      case 'dragdrop_bild':
        return baueTeilerklaerungsKontext<DragDropBildZielzone>({
          feld: 'zielzonen',
          items: ddZielzonen,
          getId: (z) => z.id,
          getLabel: (z, i) => `Zone ${i + 1}: ${(z.korrektesLabel || '').slice(0, 40) || '(leer)'}`,
          getErklaerung: (z) => z.erklaerung,
          setzeErklaerung: (z, e) => ({ ...z, erklaerung: e }),
          setItems: (u) => setDdZielzonen((prev) => u(prev)),
        })
      default:
        return undefined
    }
  }, [typ, optionen, aussagen, luecken, hsBereiche, bbBeschriftungen, ddZielzonen])

  // Lernziel-Generierung + Zuordnung
  const [lernziele, setLernziele] = useState<Lernziel[]>([])
  const [lernzieleLadend, setLernzieleLadend] = useState(false)
  const [zeigLernzielDialog, setZeigLernzielDialog] = useState(false)
  const [gewaehlterLernzielId, setGewaehlterLernzielId] = useState('')
  const [lernzielIds, setLernzielIds] = useState<string[]>(frage?.lernzielIds ?? [])

  // Auto-Load: Lernziele beim Editor-Öffnen laden
  useEffect(() => {
    if (!services.ladeLernziele || lernziele.length > 0) return
    let abgebrochen = false
    setLernzieleLadend(true)
    services.ladeLernziele(config.benutzer?.email ?? '', fachbereich)
      .then(lz => { if (!abgebrochen && lz) setLernziele(lz) })
      .catch(e => console.warn('[SharedFragenEditor] Lernziele laden fehlgeschlagen:', e))
      .finally(() => { if (!abgebrochen) setLernzieleLadend(false) })
    return () => { abgebrochen = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Nur einmal beim Mount laden

  // Neues Lernziel erstellen + lokal hinzufügen
  async function handleNeuLernzielErstellen(lernziel: Omit<Lernziel, 'id'>): Promise<string | null> {
    if (!services.speichereLernziel) return null
    const id = await services.speichereLernziel(lernziel)
    if (id) {
      setLernziele(prev => [...prev, { ...lernziel, id } as Lernziel])
    }
    return id
  }

  const panelRef = useRef<HTMLDivElement>(null)
  const fragetextRef = useRef<HTMLTextAreaElement>(null)
  const musterloeRef = useRef<HTMLTextAreaElement>(null)
  useFocusTrap(panelRef)

  // Header-Höhe messen, damit Overlay unterhalb des Headers beginnt
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const h = document.querySelector('header')?.getBoundingClientRect()?.height ?? 0
    setHeaderH(h)
  }, [])

  // Bundle H Phase 2 — Pflichtfeld + Doppellabel-Dialog State
  const [pflichtDialogOpen, setPflichtDialogOpen] = useState(false)
  const [doppelDialogOpen, setDoppelDialogOpen] = useState(false)

  // Minimal-Preview der aktuellen Frage für Validator (nur typ-spezifische Felder relevant).
  // Switch ausgelagert nach buildFragePreview.ts (DRY + LOC-Reduktion).
  const aktuelleFrage = useMemo(() => buildFragePreview({
    id: frage?.id,
    typ, fragetext,
    optionen, mehrfachauswahl,
    musterlosung, bewertungsraster,
    textMitLuecken, luecken, lueckentextModus,
    paare, aussagen, ergebnisse,
    geschaeftsfall, buchungen,
    tkAufgabentext, tkKonten,
    kbAufgabentext, kbAufgaben,
    biAufgabentext, biKontenMitSaldi,
    agKontext, agTeilaufgaben,
    canvasConfig,
    pdfDriveFileId, pdfUrl, pdfBase64, pdfErlaubteWerkzeuge,
    sortElemente,
    bildUrl, hsBereiche, bbBeschriftungen, ddZielzonen, ddLabels,
    codeSprache, codeMusterLoesungCode,
    formelKorrekteFormel,
  }), [
    typ, fragetext, optionen, mehrfachauswahl, musterlosung, bewertungsraster,
    textMitLuecken, luecken, lueckentextModus, paare, aussagen, ergebnisse,
    geschaeftsfall, buchungen, tkAufgabentext, tkKonten, kbAufgabentext, kbAufgaben,
    biAufgabentext, biKontenMitSaldi, agKontext, agTeilaufgaben, canvasConfig,
    pdfDriveFileId, pdfUrl, pdfBase64, pdfErlaubteWerkzeuge, sortElemente,
    bildUrl, hsBereiche, bbBeschriftungen, ddZielzonen, ddLabels,
    codeSprache, codeMusterLoesungCode, formelKorrekteFormel, frage?.id,
  ])

  const validation = useMemo(
    () => validierePflichtfelder(aktuelleFrage),
    [aktuelleFrage],
  )

  // DnD-Bild: doppelte Zone-Labels detektieren (Korrektur-Bug-Marker)
  const doppelteLabels = useMemo(() => {
    if (typ !== 'dragdrop_bild') return []
    const map = new Map<string, number[]>()
    ddZielzonen.forEach((z, i) => {
      const l = (z.korrektesLabel ?? '').trim()
      if (!l) return
      if (!map.has(l)) map.set(l, [])
      map.get(l)!.push(i)
    })
    return [...map.entries()]
      .filter(([, idx]) => idx.length > 1)
      .map(([label, zonenIndices]) => ({ label, zonenIndices }))
  }, [typ, ddZielzonen])

  async function handleSpeichern(): Promise<void> {
    const errs = validiereFrage({
      typ, thema, fragetext, punkte,
      optionen, mehrfachauswahl, textMitLuecken,
      paare, aussagen, ergebnisse,
      geschaeftsfall, buchungen,
      tkAufgabentext, tkKonten,
      kbAufgabentext, kbAufgaben,
      biAufgabentext, biKontenMitSaldi,
      agKontext: agKontext, agTeilaufgabenIds,
      korrekteFormel: formelKorrekteFormel,
    })
    if (errs.length > 0) {
      setFehler(errs)
      return
    }
    setFehler([])

    // Bundle H Phase 2 — Doppellabel-Bug VOR Pflichtfeld checken (Korrektur-Bug ist gravierender)
    if (doppelteLabels.length > 0) {
      setDoppelDialogOpen(true)
      return
    }
    if (!validation.pflichtErfuellt) {
      setPflichtDialogOpen(true)
      return
    }
    await speichereJetzt()
  }

  async function speichereJetzt(): Promise<void> {
    setSpeicherLaeuft(true)

    const jetzt = new Date().toISOString()
    const tagListe = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const id = frage?.id ?? generiereFrageId(fachbereich, typ)

    // Neue Anhänge hochladen (über EditorServices)
    let alleAnhaenge = [...anhaenge]
    if (neueAnhaenge.length > 0 && services.istUploadVerfuegbar()) {
      for (const datei of neueAnhaenge) {
        try {
          const ergebnis = await services.uploadAnhang?.(id, datei) ?? null
          if (ergebnis && 'error' in ergebnis) {
            console.warn(`[SharedFragenEditor] Upload fehlgeschlagen für ${datei.name}: ${ergebnis.error}`)
          } else if (ergebnis) {
            alleAnhaenge.push(ergebnis)
          } else {
            console.warn(`[SharedFragenEditor] Upload fehlgeschlagen für: ${datei.name}`)
          }
        } catch (err) {
          console.error(`[SharedFragenEditor] Upload-Fehler für ${datei.name}:`, err)
        }
      }
      setAnhaenge(alleAnhaenge)
      setNeueAnhaenge([])
    }

    const basis: FrageBasis = {
      id,
      version: frage ? frage.version + 1 : 1,
      erstelltAm: frage?.erstelltAm ?? jetzt,
      geaendertAm: jetzt,
      fachbereich,
      fach: frage?.fach ?? fachbereich,
      thema: thema.trim(),
      unterthema: unterthema.trim() || undefined,
      semester,
      gefaesse,
      bloom,
      tags: tagListe,
      punkte,
      musterlosung: musterlosung.trim(),
      bewertungsraster: bewertungsraster.filter((b) => b.beschreibung.trim()),
      zeitbedarf: zeitbedarfManuell ? zeitbedarf : berechneZeitbedarf(
        typ as 'mc' | 'freitext' | 'lueckentext' | 'zuordnung' | 'richtigfalsch' | 'berechnung' | 'visualisierung',
        bloom,
        typ === 'freitext' ? { laenge } : undefined,
      ),
      verwendungen: frage?.verwendungen ?? [],
      quelle: frage?.quelle ?? 'manuell' as const,
      anhaenge: alleAnhaenge.length > 0 ? alleAnhaenge : undefined,
      autor: frage?.autor ?? config.benutzer.email,
      geteilt,
      berechtigungen: berechtigungen.length > 0 ? berechtigungen : undefined,
      lernzielIds: lernzielIds.length > 0 ? lernzielIds : undefined,
      pruefungstauglich: validation.pflichtErfuellt && validation.empfohlenErfuellt,
    }

    // Typ-spezifische Daten zusammenstellen
    let typDaten: TypSpezifischeDaten
    switch (typ) {
      case 'mc':
        typDaten = { typ: 'mc', fragetext, optionen, mehrfachauswahl, erklaerungSichtbar }; break
      case 'freitext':
        typDaten = { typ: 'freitext', fragetext, laenge, placeholder, minWoerter, maxWoerter }; break
      case 'lueckentext':
        typDaten = { typ: 'lueckentext', fragetext, textMitLuecken, luecken, lueckentextModus }; break
      case 'zuordnung':
        typDaten = { typ: 'zuordnung', fragetext, paare }; break
      case 'richtigfalsch':
        typDaten = { typ: 'richtigfalsch', fragetext, aussagen, erklaerungSichtbar }; break
      case 'berechnung':
        typDaten = { typ: 'berechnung', fragetext, ergebnisse, rechenwegErforderlich, hilfsmittel }; break
      case 'buchungssatz':
        typDaten = { typ: 'buchungssatz', geschaeftsfall, buchungen, kontenauswahl }; break
      case 'tkonto':
        typDaten = { typ: 'tkonto', aufgabentext: tkAufgabentext, geschaeftsfaelle: tkGeschaeftsfaelle, konten: tkKonten, kontenauswahl, bewertungsoptionen: tkBewertungsoptionen }; break
      case 'kontenbestimmung':
        typDaten = { typ: 'kontenbestimmung', aufgabentext: kbAufgabentext, modus: kbModus, aufgaben: kbAufgaben, kontenauswahl: kbKontenauswahl }; break
      case 'bilanzstruktur':
        typDaten = { typ: 'bilanzstruktur', aufgabentext: biAufgabentext, modus: biModus, kontenMitSaldi: biKontenMitSaldi, loesung: biLoesung, bewertungsoptionen: biBewertungsoptionen }; break
      case 'aufgabengruppe':
        typDaten = { typ: 'aufgabengruppe', kontext: agKontext, teilaufgabenIds: agTeilaufgabenIds, teilaufgaben: agTeilaufgaben }; break
      case 'visualisierung':
        typDaten = { typ: 'visualisierung', fragetext, canvasConfig, musterloesungBild }; break
      case 'pdf':
        typDaten = {
          typ: 'pdf', fragetext,
          pdfDriveFileId: pdfDriveFileId || undefined,
          pdfBase64: pdfBase64 || undefined,
          pdfUrl: pdfUrl || undefined,
          pdfDateiname, seitenAnzahl: pdfSeitenAnzahl,
          kategorien: pdfKategorien.length > 0 ? pdfKategorien : undefined,
          erlaubteWerkzeuge: pdfErlaubteWerkzeuge,
          musterloesungAnnotationen: pdfMusterloesungAnnotationen.length > 0 ? pdfMusterloesungAnnotationen : undefined,
        }; break
      case 'sortierung':
        typDaten = { typ: 'sortierung', fragetext, elemente: sortElemente, teilpunkte: sortTeilpunkte }; break
      case 'hotspot':
        typDaten = { typ: 'hotspot', fragetext, bildUrl, bereiche: hsBereiche, mehrfachauswahl: hsMehrfachauswahl }; break
      case 'bildbeschriftung':
        typDaten = { typ: 'bildbeschriftung', fragetext, bildUrl, beschriftungen: bbBeschriftungen }; break
      case 'audio':
        typDaten = { typ: 'audio', fragetext, maxDauerSekunden: audioMaxDauer }; break
      case 'dragdrop_bild':
        typDaten = { typ: 'dragdrop_bild', fragetext, bildUrl, zielzonen: ddZielzonen, labels: ddLabels }; break
      case 'code':
        typDaten = { typ: 'code', fragetext, sprache: codeSprache, starterCode: codeStarterCode, musterLoesungCode: codeMusterLoesungCode }; break
      case 'formel':
        typDaten = { typ: 'formel', fragetext, korrekteFormel: formelKorrekteFormel, vergleichsModus: formelVergleichsModus }; break
      default:
        setSpeicherLaeuft(false)
        return
    }

    const neueFrage = erstelleFrageObjekt(basis, typDaten)
    setSpeicherLaeuft(false)
    const feedbacks = ki.alleOffenenFeedbacks()
    await onSpeichern(neueFrage, { offeneKIFeedbacks: feedbacks.length > 0 ? feedbacks : undefined })
    ki.reset()
  }

  return (
    <>
    <ResizableSidebar
      mode="overlay"
      onClose={onAbbrechen}
      topOffset={headerH}
      storageKey="frageneditor-breite"
    >
      <div ref={panelRef} className="flex flex-col h-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {frage ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
            </h2>
            <PruefungstauglichBadge
              pruefungstauglich={validation.pflichtErfuellt && validation.empfohlenErfuellt}
              empfohlenLeerFelder={validation.empfohlenLeerFelder}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation zwischen Fragen (nur Fragensammlung — optional) */}
            {(onVorherigeFrage || onNaechsteFrage) && (
              <div className="flex items-center gap-0.5 mr-1">
                <button
                  onClick={onVorherigeFrage}
                  disabled={!onVorherigeFrage}
                  title="Vorherige Frage"
                  aria-label="Vorherige Frage"
                  className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ‹
                </button>
                <button
                  onClick={onNaechsteFrage}
                  disabled={!onNaechsteFrage}
                  title="Nächste Frage"
                  aria-label="Nächste Frage"
                  className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  ›
                </button>
              </div>
            )}
            {/* Kompakte Geteilt-mit-Anzeige (Host-Slot, Bundle 12 K-2) */}
            {berechtigungenHeaderSlot?.({ berechtigungen, geteilt })}
            {/* Pool-Sync Buttons (Host-Slot) */}
            {poolSyncSlot?.({ frage, typ, onRueckSync: () => setRueckSyncOffen(true) })}
            <button
              onClick={onAbbrechen}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <button
              onClick={handleSpeichern}
              disabled={speicherLaeuft}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {speicherLaeuft ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* Fehler */}
        {fehler.length > 0 && (
          <div className="mx-5 mt-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            {fehler.map((f, i) => (
              <p key={i} className="text-sm text-red-700 dark:text-red-300">{f}</p>
            ))}
          </div>
        )}

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5 overscroll-contain" style={{ overflowY: 'auto', minHeight: 0 }}>

          {/* Pool-Info (Host-Slot) */}
          {poolInfoSlot?.({ frage, typ, onSpeichern })}

          {/* Metadaten (vor Fragetyp — LP wählt zuerst Fach/Thema/Bloom/Lernziele) */}
          <MetadataSection
            istNeu={!frage}
            fragenId={frage?.id}
            fragetext={fragetext}
            fachbereich={fachbereich} setFachbereich={setFachbereich}
            bloom={bloom} setBloom={setBloom}
            thema={thema} setThema={setThema}
            unterthema={unterthema} setUnterthema={setUnterthema}
            tags={tags} setTags={setTags}
            zeitbedarf={zeitbedarf} setZeitbedarf={setZeitbedarf}
            zeitbedarfManuell={zeitbedarfManuell} setZeitbedarfManuell={setZeitbedarfManuell}
            punkte={punkte} setPunkte={setPunkte}
            bewertungsrasterAktiv={bewertungsrasterGefuellt.length > 0}
            semester={semester} setSemester={setSemester}
            gefaesse={gefaesse} setGefaesse={setGefaesse}
            geteilt={geteilt} setGeteilt={setGeteilt}
            berechtigungen={berechtigungen} setBerechtigungen={setBerechtigungen}
            ki={ki}
            performance={performance}
            berechtigungenEditor={berechtigungenSlot?.({ berechtigungen, onChange: setBerechtigungen })}
            lernziele={lernziele} setLernziele={setLernziele}
            zeigLernzielDialog={zeigLernzielDialog} setZeigLernzielDialog={setZeigLernzielDialog}
            gewaehlterLernzielId={gewaehlterLernzielId} setGewaehlterLernzielId={setGewaehlterLernzielId}
            lernzielIds={lernzielIds} setLernzielIds={setLernzielIds}
            onNeuLernzielErstellen={services.speichereLernziel ? handleNeuLernzielErstellen : undefined}
            lernzieleLadend={lernzieleLadend}
          />

          {/* Fragetyp wählen — kategorisiert */}
          <Abschnitt titel="Fragetyp" einklappbar standardOffen={!frage}>
            <FrageTypAuswahl typ={typ} setTyp={setTyp} gesperrt={!!frage} />
          </Abschnitt>

          {/* Fragetext */}
          <FragetextSection
            fragetext={fragetext} setFragetext={setFragetext}
            musterlosung={musterlosung} setMusterlosung={setMusterlosung}
            fragetextRef={fragetextRef}
            fachbereich={fachbereich} thema={thema} unterthema={unterthema}
            typ={typ} bloom={bloom}
            ki={ki}
            lernziele={lernziele} setLernziele={setLernziele}
            zeigLernzielDialog={zeigLernzielDialog} setZeigLernzielDialog={setZeigLernzielDialog}
            gewaehlterLernzielId={gewaehlterLernzielId} setGewaehlterLernzielId={setGewaehlterLernzielId}
          />

          {/* Anhänge (Host-Slot oder Default) */}
          {anhangEditorSlot ? anhangEditorSlot({
            anhaenge,
            neueAnhaenge,
            onAnhangHinzu: (file) => setNeueAnhaenge((prev) => [...prev, file]),
            onAnhangEntfernen: (id) => setAnhaenge((prev) => prev.filter((a) => a.id !== id)),
            onNeuenAnhangEntfernen: (idx) => setNeueAnhaenge((prev) => prev.filter((_, i) => i !== idx)),
            onUrlAnhangHinzu: (anhang) => setAnhaenge((prev) => [...prev, anhang]),
          }) : (
            <DefaultAnhangEditor
              anhaenge={anhaenge}
              neueAnhaenge={neueAnhaenge}
              onAnhangHinzu={(file) => setNeueAnhaenge((prev) => [...prev, file])}
              onAnhangEntfernen={(id) => setAnhaenge((prev) => prev.filter((a) => a.id !== id))}
              onNeuenAnhangEntfernen={(idx) => setNeueAnhaenge((prev) => prev.filter((_, i) => i !== idx))}
              onUrlAnhangHinzu={(anhang) => setAnhaenge((prev) => [...prev, anhang])}
            />
          )}

          {/* Typ-spezifische Editoren */}
          <TypEditorDispatcher
            typ={typ}
            fragetext={fragetext}
            fachbereich={fachbereich}
            thema={thema}
            ki={ki}
            validation={validation}
            PDFEditorComponent={PDFEditorComponent}
            laenge={laenge} setLaenge={setLaenge}
            placeholder={placeholder} setPlaceholder={setPlaceholder}
            minWoerter={minWoerter} setMinWoerter={setMinWoerter}
            maxWoerter={maxWoerter} setMaxWoerter={setMaxWoerter}
            optionen={optionen} setOptionen={setOptionen}
            mehrfachauswahl={mehrfachauswahl} setMehrfachauswahl={setMehrfachauswahl}
            textMitLuecken={textMitLuecken} setTextMitLuecken={setTextMitLuecken}
            luecken={luecken} setLuecken={setLuecken}
            lueckentextModus={lueckentextModus} setLueckentextModus={setLueckentextModus}
            paare={paare} setPaare={setPaare}
            aussagen={aussagen} setAussagen={setAussagen}
            erklaerungSichtbar={erklaerungSichtbar} setErklaerungSichtbar={setErklaerungSichtbar}
            ergebnisse={ergebnisse} setErgebnisse={setErgebnisse}
            rechenwegErforderlich={rechenwegErforderlich} setRechenwegErforderlich={setRechenwegErforderlich}
            hilfsmittel={hilfsmittel} setHilfsmittel={setHilfsmittel}
            geschaeftsfall={geschaeftsfall} setGeschaeftsfall={setGeschaeftsfall}
            buchungen={buchungen} setBuchungen={setBuchungen}
            kontenauswahl={kontenauswahl} setKontenauswahl={setKontenauswahl}
            tkAufgabentext={tkAufgabentext} setTkAufgabentext={setTkAufgabentext}
            tkGeschaeftsfaelle={tkGeschaeftsfaelle} setTkGeschaeftsfaelle={setTkGeschaeftsfaelle}
            tkKonten={tkKonten} setTkKonten={setTkKonten}
            kbAufgabentext={kbAufgabentext} setKbAufgabentext={setKbAufgabentext}
            kbModus={kbModus} setKbModus={setKbModus}
            kbAufgaben={kbAufgaben} setKbAufgaben={setKbAufgaben}
            kbKontenauswahl={kbKontenauswahl} setKbKontenauswahl={setKbKontenauswahl}
            biAufgabentext={biAufgabentext} setBiAufgabentext={setBiAufgabentext}
            biModus={biModus} setBiModus={setBiModus}
            biKontenMitSaldi={biKontenMitSaldi} setBiKontenMitSaldi={setBiKontenMitSaldi}
            biLoesung={biLoesung} setBiLoesung={setBiLoesung}
            agKontext={agKontext} setAgKontext={setAgKontext}
            agTeilaufgabenIds={agTeilaufgabenIds} setAgTeilaufgabenIds={setAgTeilaufgabenIds}
            agTeilaufgaben={agTeilaufgaben} setAgTeilaufgaben={setAgTeilaufgaben}
            canvasConfig={canvasConfig} setCanvasConfig={setCanvasConfig}
            musterloesungBild={musterloesungBild} setMusterloesungBild={setMusterloesungBild}
            email={config.benutzer.email}
            pdfBase64={pdfBase64} setPdfBase64={setPdfBase64}
            pdfDriveFileId={pdfDriveFileId} setPdfDriveFileId={setPdfDriveFileId}
            pdfUrl={pdfUrl} setPdfUrl={setPdfUrl}
            pdfDateiname={pdfDateiname} setPdfDateiname={setPdfDateiname}
            pdfSeitenAnzahl={pdfSeitenAnzahl} setPdfSeitenAnzahl={setPdfSeitenAnzahl}
            pdfKategorien={pdfKategorien} setPdfKategorien={setPdfKategorien}
            pdfErlaubteWerkzeuge={pdfErlaubteWerkzeuge} setPdfErlaubteWerkzeuge={setPdfErlaubteWerkzeuge}
            pdfMusterloesungAnnotationen={pdfMusterloesungAnnotationen} setPdfMusterloesungAnnotationen={setPdfMusterloesungAnnotationen}
            sortElemente={sortElemente} setSortElemente={setSortElemente}
            sortTeilpunkte={sortTeilpunkte} setSortTeilpunkte={setSortTeilpunkte}
            bildUrl={bildUrl} setBildUrl={setBildUrl}
            hsBereiche={hsBereiche} setHsBereiche={setHsBereiche}
            hsMehrfachauswahl={hsMehrfachauswahl} setHsMehrfachauswahl={setHsMehrfachauswahl}
            bbBeschriftungen={bbBeschriftungen} setBbBeschriftungen={setBbBeschriftungen}
            audioMaxDauer={audioMaxDauer} setAudioMaxDauer={setAudioMaxDauer}
            ddZielzonen={ddZielzonen} setDdZielzonen={setDdZielzonen}
            ddLabels={ddLabels} setDdLabels={setDdLabels}
            codeSprache={codeSprache} setCodeSprache={setCodeSprache}
            codeStarterCode={codeStarterCode} setCodeStarterCode={setCodeStarterCode}
            codeMusterLoesungCode={codeMusterLoesungCode} setCodeMusterLoesungCode={setCodeMusterLoesungCode}
            formelKorrekteFormel={formelKorrekteFormel} setFormelKorrekteFormel={setFormelKorrekteFormel}
            formelVergleichsModus={formelVergleichsModus} setFormelVergleichsModus={setFormelVergleichsModus}
          />

          {/* Musterlösung (nicht bei Aufgabengruppe — dort pro Teilaufgabe) */}
          {typ !== 'aufgabengruppe' && (
            <MusterloesungSection
              typ={typ}
              fragetext={fragetext}
              fachbereich={fachbereich}
              bloom={bloom}
              musterlosung={musterlosung}
              setMusterlosung={setMusterlosung}
              musterloeRef={musterloeRef}
              ki={ki}
              teilerklaerungsKontext={teilerklaerungsKontext}
            />
          )}

          {/* Bewertungsraster (nicht bei Aufgabengruppe — dort pro Teilaufgabe) */}
          {typ !== 'aufgabengruppe' && (
            <>
              <BewertungsrasterEditor
                bewertungsraster={bewertungsraster}
                setBewertungsraster={setBewertungsraster}
                fachbereich={fachbereich}
                fragePunkte={punkte}
                extraContent={
                  typ === 'tkonto' ? (
                    <TKontoBewertungsoptionen
                      bewertungsoptionen={tkBewertungsoptionen}
                      setBewertungsoptionen={setTkBewertungsoptionen}
                    />
                  ) : typ === 'bilanzstruktur' ? (
                    <BilanzERBewertungsoptionen
                      bewertungsoptionen={biBewertungsoptionen}
                      setBewertungsoptionen={setBiBewertungsoptionen}
                      modus={biModus}
                    />
                  ) : undefined
                }
                kiButtons={ki.verfuegbar ? (
                  <>
                    <InlineAktionButton
                      label="KI generieren"
                      tooltip="Bewertungsraster basierend auf Frage generieren"
                      disabled={!fragetext.trim() || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'bewertungsrasterGenerieren'}
                      onClick={() => ki.ausfuehren('bewertungsrasterGenerieren', {
                        fragetext, typ, fachbereich, bloom, punkte, musterlosung
                      })}
                    />
                    <InlineAktionButton
                      label="KI verbessern"
                      tooltip="Bestehendes Bewertungsraster prüfen und verbessern"
                      disabled={bewertungsraster.filter(k => k.beschreibung.trim()).length === 0 || ki.ladeAktion !== null}
                      ladend={ki.ladeAktion === 'bewertungsrasterVerbessern'}
                      onClick={() => ki.ausfuehren('bewertungsrasterVerbessern', {
                        fragetext, typ, fachbereich, bloom, punkte, musterlosung,
                        bewertungsraster: bewertungsraster.filter(k => k.beschreibung.trim())
                      })}
                    />
                  </>
                ) : undefined}
              />
              {ki.ergebnisse.bewertungsrasterGenerieren && (
                <div className="mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.bewertungsrasterGenerieren}
                    vorschauKey="kriterien"
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.bewertungsrasterGenerieren?.daten
                      if (d && Array.isArray(d.kriterien)) {
                        setBewertungsraster(d.kriterien as Bewertungskriterium[])
                      }
                      ki.verwerfen('bewertungsrasterGenerieren')
                    }}
                    onVerwerfen={() => ki.verwerfen('bewertungsrasterGenerieren')}
                    wichtig={ki.offeneKIFeedbacks.find(f => f.aktion === 'bewertungsrasterGenerieren')?.wichtig ?? false}
                    onWichtigToggle={() => {
                      const cur = ki.offeneKIFeedbacks.find(f => f.aktion === 'bewertungsrasterGenerieren')
                      ki.markiereWichtig('bewertungsrasterGenerieren', !(cur?.wichtig ?? false))
                    }}
                  />
                </div>
              )}
              {ki.ergebnisse.bewertungsrasterVerbessern && (
                <div className="mt-2">
                  <ErgebnisAnzeige
                    ergebnis={ki.ergebnisse.bewertungsrasterVerbessern}
                    vorschauKey="bewertung"
                    zusatzKey="verbesserteKriterien"
                    onUebernehmen={() => {
                      const d = ki.ergebnisse.bewertungsrasterVerbessern?.daten
                      if (d && Array.isArray(d.verbesserteKriterien)) {
                        setBewertungsraster(d.verbesserteKriterien as Bewertungskriterium[])
                      }
                      ki.verwerfen('bewertungsrasterVerbessern')
                    }}
                    onVerwerfen={() => ki.verwerfen('bewertungsrasterVerbessern')}
                  />
                </div>
              )}
            </>
          )}

          {/* Frage löschen (nur bei bestehenden Fragen, mit Bestätigung) */}
          {frage && onLoeschen && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  if (confirm(`Frage "${(frage as { fragetext?: string }).fragetext?.substring(0, 60) || frage.id}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                    onLoeschen(frage)
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
              >
                🗑 Frage löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </ResizableSidebar>

    {/* Rück-Sync Dialog (Host-Slot) */}
    {frage && rueckSyncOffen && rueckSyncSlot?.({
      offen: rueckSyncOffen,
      onSchliessen: () => setRueckSyncOffen(false),
      onErfolg: (updates) => {
        const aktualisiert = { ...frage, ...updates, geaendertAm: new Date().toISOString() }
        onSpeichern(aktualisiert as Frage)
        setRueckSyncOffen(false)
      },
    })}

    {/* Bundle H Phase 2 — Pflichtfeld-Confirm-Dialog */}
    <PflichtfeldDialog
      open={pflichtDialogOpen}
      pflichtLeerFelder={validation.pflichtLeerFelder}
      onAbbrechen={() => setPflichtDialogOpen(false)}
      onSpeichern={async () => {
        setPflichtDialogOpen(false)
        await speichereJetzt()
      }}
    />

    {/* Bundle H Phase 2 — Doppellabel-Confirm-Dialog (DnD-Bild) */}
    <DoppelteLabelDialog
      open={doppelDialogOpen}
      doppelteLabels={doppelteLabels}
      onAbbrechen={() => setDoppelDialogOpen(false)}
      onSpeichern={async () => {
        setDoppelDialogOpen(false)
        if (!validation.pflichtErfuellt) {
          setPflichtDialogOpen(true)
          return
        }
        await speichereJetzt()
      }}
    />
    </>
  )
}
