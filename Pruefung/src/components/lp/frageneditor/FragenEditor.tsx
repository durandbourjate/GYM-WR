import { useState, useRef, useEffect } from 'react'
import { useAuthStore, ladeUndCacheLPs } from '../../../store/authStore.ts'
import type { LPInfo } from '../../../services/lpApi.ts'
import { apiService } from '../../../services/apiService.ts'
import { useFocusTrap } from '../../../hooks/useFocusTrap.ts'
import { usePanelResize } from '../../../hooks/usePanelResize.ts'
import { typLabel, defaultFachbereich } from '../../../utils/fachUtils.ts'
import { validiereFrage } from '../../../utils/fragenValidierung.ts'
import { erstelleFrageObjekt } from '../../../utils/fragenFactory.ts'
import type { FrageBasis, TypSpezifischeDaten } from '../../../utils/fragenFactory.ts'
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
  SortierungFrage, HotspotFrage, HotspotBereich, BildbeschriftungFrage, BildbeschriftungLabel,
  AudioFrage, DragDropBildFrage, DragDropBildZielzone,
  CodeFrage, FormelFrage,
} from '../../../types/fragen.ts'
import type { FrageTyp } from './editorUtils.ts'
import { generiereFrageId } from './editorUtils.ts'
import { Abschnitt } from './EditorBausteine.tsx'
import AnhangEditor from './AnhangEditor.tsx'
import BewertungsrasterEditor from './BewertungsrasterEditor.tsx'
import { TKontoBewertungsoptionen } from './TKontoEditor.tsx'
import { BilanzERBewertungsoptionen } from './BilanzEREditor.tsx'
import { useKIAssistent } from './KIAssistentPanel.tsx'
import { InlineAktionButton, ErgebnisAnzeige } from './KIBausteine.tsx'
import { berechneZeitbedarf } from '../../../utils/zeitbedarf.ts'
import { useSchulConfig } from '../../../store/schulConfigStore.ts'
import { istGueltigesGefaess } from '../../../utils/gefaessUtils.ts'
import type { Lernziel } from '../../../types/pool.ts'
import PoolUpdateVergleich from './PoolUpdateVergleich.tsx'
import RueckSyncDialog from '../fragenbank/RueckSyncDialog.tsx'

// Extrahierte Sections
import MetadataSection from './sections/MetadataSection.tsx'
import FragetextSection from './sections/FragetextSection.tsx'
import TypEditorDispatcher from './sections/TypEditorDispatcher.tsx'
import MusterloesungSection from './sections/MusterloesungSection.tsx'


interface Props {
  /** Bestehende Frage zum Bearbeiten, oder null für neue */
  frage: Frage | null
  onSpeichern: (frage: Frage) => void
  onAbbrechen: () => void
  /** Aggregierte Performance-Daten für diese Frage (optional) */
  performance?: import('../../../types/tracker.ts').FragenPerformance
}

/** Vollbild-Editor zum Erstellen und Bearbeiten von Prüfungsfragen */
export default function FragenEditor({ frage, onSpeichern, onAbbrechen, performance }: Props) {
  const user = useAuthStore((s) => s.user)
  const schulConfig = useSchulConfig((s) => s.config)

  // LP-Liste für BerechtigungenEditor (gecacht pro Session)
  const [lpListe, setLpListe] = useState<LPInfo[]>([])
  useEffect(() => {
    ladeUndCacheLPs().then(setLpListe)
  }, [])

  // Grunddaten
  const [typ, setTyp] = useState<FrageTyp>(frage?.typ as FrageTyp ?? 'mc')
  const [fachbereich, setFachbereich] = useState<Fachbereich>(frage?.fachbereich ?? defaultFachbereich(user?.fachschaft) as Fachbereich)
  const [thema, setThema] = useState(frage?.thema ?? '')
  const [unterthema, setUnterthema] = useState(frage?.unterthema ?? '')
  const [bloom, setBloom] = useState<BloomStufe>(frage?.bloom ?? 'K2')
  const [punkte, setPunkte] = useState(frage?.punkte ?? 1)
  const [tags, setTags] = useState(frage?.tags.join(', ') ?? '')
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
    frage?.typ === 'mc' ? (frage as MCFrage).optionen : [
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
  const [luecken, setLuecken] = useState(
    frage?.typ === 'lueckentext' ? (frage as LueckentextFrage).luecken : []
  )

  // Zuordnung-spezifisch
  const [paare, setPaare] = useState(
    frage?.typ === 'zuordnung' ? (frage as ZuordnungFrage).paare : [
      { links: '', rechts: '' },
      { links: '', rechts: '' },
    ]
  )

  // Richtig/Falsch-spezifisch
  const [aussagen, setAussagen] = useState<RichtigFalschFrage['aussagen']>(
    frage?.typ === 'richtigfalsch' ? (frage as RichtigFalschFrage).aussagen : [
      { id: '1', text: '', korrekt: true },
      { id: '2', text: '', korrekt: false },
      { id: '3', text: '', korrekt: true },
    ]
  )

  // Berechnung-spezifisch
  const [ergebnisse, setErgebnisse] = useState<BerechnungFrage['ergebnisse']>(
    frage?.typ === 'berechnung' ? (frage as BerechnungFrage).ergebnisse : [
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
    frage?.typ === 'buchungssatz' ? (frage as BuchungssatzFrage).buchungen : [
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
    frage?.typ === 'tkonto' ? (frage as TKontoFrage).konten : [
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
    frage?.typ === 'kontenbestimmung' ? (frage as KontenbestimmungFrage).aufgaben : [
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
    frage?.typ === 'bilanzstruktur' ? (frage as BilanzERFrage).kontenMitSaldi : [{ kontonummer: '', saldo: 0 }]
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
    frage?.typ === 'aufgabengruppe' ? (frage as AufgabengruppeFrage).teilaufgabenIds : []
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
    frage?.typ === 'sortierung' ? (frage as SortierungFrage).elemente : []
  )
  const [sortTeilpunkte, setSortTeilpunkte] = useState(
    frage?.typ === 'sortierung' ? (frage as SortierungFrage).teilpunkte : true
  )

  // Hotspot-spezifisch
  const [hsBildUrl, setHsBildUrl] = useState(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).bildUrl : ''
  )
  const [hsBereiche, setHsBereiche] = useState<HotspotBereich[]>(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).bereiche : []
  )
  const [hsMehrfachauswahl, setHsMehrfachauswahl] = useState(
    frage?.typ === 'hotspot' ? (frage as HotspotFrage).mehrfachauswahl : false
  )

  // Bildbeschriftung-spezifisch
  const [bbBildUrl, setBbBildUrl] = useState(
    frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).bildUrl : ''
  )
  const [bbBeschriftungen, setBbBeschriftungen] = useState<BildbeschriftungLabel[]>(
    frage?.typ === 'bildbeschriftung' ? (frage as BildbeschriftungFrage).beschriftungen : []
  )

  // Audio-spezifisch
  const [audioMaxDauer, setAudioMaxDauer] = useState<number | undefined>(
    frage?.typ === 'audio' ? (frage as AudioFrage).maxDauerSekunden : undefined
  )

  // DragDrop-Bild-spezifisch
  const [ddBildUrl, setDdBildUrl] = useState(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).bildUrl : ''
  )
  const [ddZielzonen, setDdZielzonen] = useState<DragDropBildZielzone[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).zielzonen : []
  )
  const [ddLabels, setDdLabels] = useState<string[]>(
    frage?.typ === 'dragdrop_bild' ? (frage as DragDropBildFrage).labels : []
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
  const [berechtigungen, setBerechtigungen] = useState<import('../../../types/auth').Berechtigung[]>(frage?.berechtigungen ?? [])

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

  // Lernziel-Generierung
  const [lernziele, setLernziele] = useState<Lernziel[]>([])
  const [zeigLernzielDialog, setZeigLernzielDialog] = useState(false)
  const [gewaehlterLernzielId, setGewaehlterLernzielId] = useState('')

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

  // Resizable Panel (extrahierter Hook)
  const { panelBreite, handleZiehStart } = usePanelResize(1008, 480, 0.9)

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
    setSpeicherLaeuft(true)

    const jetzt = new Date().toISOString()
    const tagListe = tags.split(',').map((t) => t.trim()).filter(Boolean)
    const id = frage?.id ?? generiereFrageId(fachbereich, typ)

    // Neue Anhänge hochladen
    let alleAnhaenge = [...anhaenge]
    if (neueAnhaenge.length > 0 && user && apiService.istKonfiguriert()) {
      for (const datei of neueAnhaenge) {
        try {
          const ergebnis = await apiService.uploadAnhang(user.email, id, datei)
          if (ergebnis) {
            alleAnhaenge.push(ergebnis)
          } else {
            console.warn(`[FragenEditor] Upload fehlgeschlagen für: ${datei.name}`)
          }
        } catch (err) {
          console.error(`[FragenEditor] Upload-Fehler für ${datei.name}:`, err)
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
      gefaesse: gefaesse.filter((g) => istGueltigesGefaess(g, schulConfig)),
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
      autor: frage?.autor ?? user?.email,
      geteilt,
      berechtigungen: berechtigungen.length > 0 ? berechtigungen : undefined,
    }

    // Typ-spezifische Daten zusammenstellen
    let typDaten: TypSpezifischeDaten
    switch (typ) {
      case 'mc':
        typDaten = { typ: 'mc', fragetext, optionen, mehrfachauswahl }; break
      case 'freitext':
        typDaten = { typ: 'freitext', fragetext, laenge, placeholder, minWoerter, maxWoerter }; break
      case 'lueckentext':
        typDaten = { typ: 'lueckentext', fragetext, textMitLuecken, luecken }; break
      case 'zuordnung':
        typDaten = { typ: 'zuordnung', fragetext, paare }; break
      case 'richtigfalsch':
        typDaten = { typ: 'richtigfalsch', fragetext, aussagen }; break
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
        typDaten = { typ: 'aufgabengruppe', kontext: agKontext, teilaufgabenIds: agTeilaufgabenIds }; break
      case 'visualisierung':
        typDaten = { typ: 'visualisierung', fragetext, canvasConfig, musterloesungBild }; break
      case 'pdf':
        typDaten = {
          typ: 'pdf', fragetext, pdfDriveFileId, pdfBase64: pdfBase64 || undefined,
          pdfDateiname, seitenAnzahl: pdfSeitenAnzahl,
          kategorien: pdfKategorien.length > 0 ? pdfKategorien : undefined,
          erlaubteWerkzeuge: pdfErlaubteWerkzeuge,
          musterloesungAnnotationen: pdfMusterloesungAnnotationen.length > 0 ? pdfMusterloesungAnnotationen : undefined,
        }; break
      case 'sortierung':
        typDaten = { typ: 'sortierung', fragetext, elemente: sortElemente, teilpunkte: sortTeilpunkte }; break
      case 'hotspot':
        typDaten = { typ: 'hotspot', fragetext, bildUrl: hsBildUrl, bereiche: hsBereiche, mehrfachauswahl: hsMehrfachauswahl }; break
      case 'bildbeschriftung':
        typDaten = { typ: 'bildbeschriftung', fragetext, bildUrl: bbBildUrl, beschriftungen: bbBeschriftungen }; break
      case 'audio':
        typDaten = { typ: 'audio', fragetext, maxDauerSekunden: audioMaxDauer }; break
      case 'dragdrop_bild':
        typDaten = { typ: 'dragdrop_bild', fragetext, bildUrl: ddBildUrl, zielzonen: ddZielzonen, labels: ddLabels }; break
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
    onSpeichern(neueFrage)
  }

  // ESC schliesst den Editor (stoppt Propagation, damit nicht die Fragenbank geschlossen wird)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onAbbrechen()
      }
    }
    document.addEventListener('keydown', handleKeyDown, true) // capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [onAbbrechen])

  return (
    <>
    <div className="fixed inset-0 z-[55] flex pointer-events-none">
      <div className="absolute left-0 right-0 bottom-0 bg-black/40 pointer-events-auto" style={{ top: headerH }} onClick={onAbbrechen} />

      <div ref={panelRef} className="absolute right-0 bottom-0 bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto overflow-hidden" style={{ top: headerH, width: panelBreite, maxWidth: '90vw' }} onWheel={(e) => e.stopPropagation()}>
        {/* Drag-Handle zum Resize */}
        <div
          onMouseDown={handleZiehStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-slate-400/50 active:bg-slate-400/70 transition-colors"
          title="Breite anpassen"
        />
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {frage ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
          </h2>
          <div className="flex items-center gap-2">
            {/* Pool-Rück-Sync Buttons */}
            {frage && frage.poolId && frage.poolVersion && (
              <button
                onClick={() => setRueckSyncOffen(true)}
                title="Änderungen an Pool zurückschreiben"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ↑ An Pool
              </button>
            )}
            {frage && !frage.poolId && frage.typ !== 'visualisierung' && (
              <button
                onClick={() => setRueckSyncOffen(true)}
                title="Frage in einen Übungspool exportieren"
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                ↑ In Pool exportieren
              </button>
            )}
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
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5 overscroll-contain">

          {/* Pool-Info für importierte Fragen */}
          {frage?.quelle === 'pool' && frage.poolId && (
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Importiert aus Pool: <strong>{frage.quellReferenz || frage.poolId}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const aktualisiert = { ...frage, pruefungstauglich: !frage.pruefungstauglich, geaendertAm: new Date().toISOString() }
                      onSpeichern(aktualisiert)
                    }}
                    className={frage.pruefungstauglich
                      ? 'px-3 py-1 text-sm bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/70 cursor-pointer'
                      : 'px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer'
                    }
                    title={frage.pruefungstauglich ? 'Klicken um Prüfungstauglichkeit aufzuheben' : 'Als prüfungstauglich markieren'}
                  >
                    {frage.pruefungstauglich ? '✓ Prüfungstauglich' : 'Prüfungstauglich ✓'}
                  </button>
                </div>
              </div>

              {frage.poolUpdateVerfuegbar && frage.poolVersion && (
                <PoolUpdateVergleich
                  frage={frage}
                  onUebernehmen={() => {
                    onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
                  }}
                  onIgnorieren={() => {
                    onSpeichern({ ...frage, poolUpdateVerfuegbar: false, geaendertAm: new Date().toISOString() })
                  }}
                />
              )}
            </div>
          )}

          {/* Fragetyp wählen */}
          <Abschnitt titel="Fragetyp" einklappbar standardOffen={!frage}>
            <div className="flex gap-2 flex-wrap">
              {(['freitext', 'mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung', 'sortierung', 'hotspot', 'bildbeschriftung', 'dragdrop_bild', 'code', 'formel', 'audio', 'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur', 'aufgabengruppe', 'visualisierung', 'pdf'] as FrageTyp[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTyp(t)}
                  disabled={!!frage}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer
                    ${typ === t
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }
                    ${frage ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                >
                  {typLabel(t)}
                </button>
              ))}
            </div>
          </Abschnitt>

          {/* Grunddaten / Zuordnung */}
          <MetadataSection
            istNeu={!frage}
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
            lpListe={lpListe} eigeneFachschaft={user?.fachschaft}
            ki={ki}
            performance={performance}
          />

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

          {/* Anhänge (Bilder, PDFs, Audio, Video, URLs) */}
          <AnhangEditor
            anhaenge={anhaenge}
            neueAnhaenge={neueAnhaenge}
            onAnhangHinzu={(file) => setNeueAnhaenge((prev) => [...prev, file])}
            onAnhangEntfernen={(id) => setAnhaenge((prev) => prev.filter((a) => a.id !== id))}
            onNeuenAnhangEntfernen={(idx) => setNeueAnhaenge((prev) => prev.filter((_, i) => i !== idx))}
            onUrlAnhangHinzu={(anhang) => setAnhaenge((prev) => [...prev, anhang])}
          />

          {/* Typ-spezifische Editoren */}
          <TypEditorDispatcher
            typ={typ}
            fragetext={fragetext}
            fachbereich={fachbereich}
            thema={thema}
            ki={ki}
            laenge={laenge} setLaenge={setLaenge}
            placeholder={placeholder} setPlaceholder={setPlaceholder}
            minWoerter={minWoerter} setMinWoerter={setMinWoerter}
            maxWoerter={maxWoerter} setMaxWoerter={setMaxWoerter}
            optionen={optionen} setOptionen={setOptionen}
            mehrfachauswahl={mehrfachauswahl} setMehrfachauswahl={setMehrfachauswahl}
            textMitLuecken={textMitLuecken} setTextMitLuecken={setTextMitLuecken}
            luecken={luecken} setLuecken={setLuecken}
            paare={paare} setPaare={setPaare}
            aussagen={aussagen} setAussagen={setAussagen}
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
            canvasConfig={canvasConfig} setCanvasConfig={setCanvasConfig}
            musterloesungBild={musterloesungBild} setMusterloesungBild={setMusterloesungBild}
            email={user?.email ?? ''}
            pdfBase64={pdfBase64} setPdfBase64={setPdfBase64}
            pdfDriveFileId={pdfDriveFileId} setPdfDriveFileId={setPdfDriveFileId}
            pdfDateiname={pdfDateiname} setPdfDateiname={setPdfDateiname}
            pdfSeitenAnzahl={pdfSeitenAnzahl} setPdfSeitenAnzahl={setPdfSeitenAnzahl}
            pdfKategorien={pdfKategorien} setPdfKategorien={setPdfKategorien}
            pdfErlaubteWerkzeuge={pdfErlaubteWerkzeuge} setPdfErlaubteWerkzeuge={setPdfErlaubteWerkzeuge}
            pdfMusterloesungAnnotationen={pdfMusterloesungAnnotationen} setPdfMusterloesungAnnotationen={setPdfMusterloesungAnnotationen}
            sortElemente={sortElemente} setSortElemente={setSortElemente}
            sortTeilpunkte={sortTeilpunkte} setSortTeilpunkte={setSortTeilpunkte}
            hsBildUrl={hsBildUrl} setHsBildUrl={setHsBildUrl}
            hsBereiche={hsBereiche} setHsBereiche={setHsBereiche}
            hsMehrfachauswahl={hsMehrfachauswahl} setHsMehrfachauswahl={setHsMehrfachauswahl}
            bbBildUrl={bbBildUrl} setBbBildUrl={setBbBildUrl}
            bbBeschriftungen={bbBeschriftungen} setBbBeschriftungen={setBbBeschriftungen}
            audioMaxDauer={audioMaxDauer} setAudioMaxDauer={setAudioMaxDauer}
            ddBildUrl={ddBildUrl} setDdBildUrl={setDdBildUrl}
            ddZielzonen={ddZielzonen} setDdZielzonen={setDdZielzonen}
            ddLabels={ddLabels} setDdLabels={setDdLabels}
            codeSprache={codeSprache} setCodeSprache={setCodeSprache}
            codeStarterCode={codeStarterCode} setCodeStarterCode={setCodeStarterCode}
            codeMusterLoesungCode={codeMusterLoesungCode} setCodeMusterLoesungCode={setCodeMusterLoesungCode}
            formelKorrekteFormel={formelKorrekteFormel} setFormelKorrekteFormel={setFormelKorrekteFormel}
            formelVergleichsModus={formelVergleichsModus} setFormelVergleichsModus={setFormelVergleichsModus}
          />

          {/* Musterlösung */}
          <MusterloesungSection
            typ={typ}
            fragetext={fragetext}
            fachbereich={fachbereich}
            bloom={bloom}
            musterlosung={musterlosung}
            setMusterlosung={setMusterlosung}
            musterloeRef={musterloeRef}
            ki={ki}
          />

          {/* Bewertungsraster */}
          <BewertungsrasterEditor
            bewertungsraster={bewertungsraster}
            setBewertungsraster={setBewertungsraster}
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
        </div>
      </div>

    </div>

    {/* Pool-Rück-Sync Dialog — ausserhalb des pointer-events-none Containers */}
    {frage && rueckSyncOffen && (
      <RueckSyncDialog
        frage={frage}
        offen={rueckSyncOffen}
        onSchliessen={() => setRueckSyncOffen(false)}
        onErfolg={(updates) => {
          const aktualisiert = { ...frage, ...updates, geaendertAm: new Date().toISOString() }
          onSpeichern(aktualisiert as Frage)
          setRueckSyncOffen(false)
        }}
      />
    )}
    </>
  )
}
