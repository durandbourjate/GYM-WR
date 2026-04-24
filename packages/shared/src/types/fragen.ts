import type { MediaQuelle } from './mediaQuelle'

// === ANHANG ===
export interface FrageAnhang {
  id: string
  dateiname: string
  mimeType: string
  groesseBytes: number
  driveFileId: string
  beschreibung?: string
  /** Bildgrösse für Inline-Anzeige in Vorschau */
  bildGroesse?: 'klein' | 'mittel' | 'gross'
  url?: string       // YouTube/Vimeo/nanoo.tv URL (nur bei URL-Embeds)
  externeUrl?: string // Direkter Bild-Link (z.B. Pool-Bilder auf GitHub Pages)
  /** Neue kanonische Media-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  quelle?: MediaQuelle
}

// === FRAGE (Basis) ===
export interface FrageBase {
  id: string;
  version: number;
  erstelltAm: string;
  geaendertAm: string;

  // Inhaltliche Zuordnung
  fachbereich: Fachbereich;
  fach: string;
  thema: string;
  unterthema?: string;
  lehrplanziel?: string;
  semester: string[];
  gefaesse: string[];

  // Taxonomie
  bloom: BloomStufe;
  tags: string[];

  // Bewertung
  punkte: number;
  musterlosung: string;
  bewertungsraster: Bewertungskriterium[];

  // Metadaten aus Verwendung
  schwierigkeit?: number;
  streuung?: number;
  verwendungen: Verwendung[];

  // Anhänge (Bilder, PDFs)
  anhaenge?: FrageAnhang[]

  // Medien-Einbettung (Audio/Video direkt in der Frage)
  medienEinbettung?: {
    url: string              // Drive URL oder direkte URL
    typ: 'audio' | 'video'
    maxAbspielungen?: number  // undefined = unbegrenzt
    autoplay?: boolean
  };

  // Zeitbedarf
  /** Geschätzter Zeitbedarf in Minuten (vorausgefüllt, editierbar) */
  zeitbedarf?: number;

  // Herkunft
  quelle?: 'pool' | 'papier' | 'manuell' | 'ki-generiert';
  quellReferenz?: string;

  // Sharing / Zusammenarbeit (Google-Docs-Modell)
  autor?: string;  // E-Mail der erstellenden LP (= Inhaber)
  berechtigungen?: unknown[];  // Rechte-Array (Pruefung-intern: Berechtigung[])
  geteilt?: 'privat' | 'fachschaft' | 'schule';  // Legacy/abgeleitet
  geteiltVon?: string;  // Anzeigename bei geteilten Fragen
  _recht?: unknown;  // Vom Backend berechnet (nicht gespeichert)

  // Pool-Sync (importierte Fragen aus Übungspools)
  poolId?: string                     // Compound-Key '{pool}:{frage}', z.B. 'vwl_bip:d01'
  poolGeprueft?: boolean              // Review-Status in Pool-Quelle
  pruefungstauglich?: boolean         // Separat abgesegnet in ExamLab
  poolContentHash?: string            // SHA-256 für Änderungserkennung
  poolUpdateVerfuegbar?: boolean      // true wenn Pool-Version neuer
  poolVersion?: unknown               // PoolFrageSnapshot (Pruefung-intern)
  lernzielIds?: string[]              // Referenzen auf Lernziel-Einträge
}

export type Fachbereich = 'VWL' | 'BWL' | 'Recht' | 'Informatik' | 'Allgemein';
export type Gefaess = 'SF' | 'EF' | 'EWR' | 'GF';
export type BloomStufe = 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6';

export interface Niveaustufe {
  punkte: number;        // z.B. 3, 2, 1, 0
  beschreibung: string;  // z.B. "Schlüssige Argumentation mit mehreren Belegen"
}

export interface Bewertungskriterium {
  beschreibung: string;
  punkte: number;
  stichworte?: string[];
  niveaustufen?: Niveaustufe[];  // Optionale Abstufungen für präzisere Bewertung
}

export interface Verwendung {
  datum: string;
  pruefungId: string;
  klasse: string;
  typ: 'summativ' | 'formativ';
  durchschnitt?: number;
  n?: number;
}

// === FRAGETYPEN ===

export interface MCFrage extends FrageBase {
  typ: 'mc';
  fragetext: string;
  optionen: MCOption[];
  mehrfachauswahl: boolean;
  zufallsreihenfolge: boolean;
  /** Erklärungen in der Korrektur-Einsicht den SuS zeigen (Default: false = nur LP) */
  erklaerungSichtbar?: boolean;
}

export interface MCOption {
  id: string;
  text: string;
  korrekt: boolean;
  feedback?: string;
  /** Erklärung warum diese Option richtig/falsch ist (für LP + optional SuS) */
  erklaerung?: string;
}

export interface FreitextFrage extends FrageBase {
  typ: 'freitext';
  fragetext: string;
  laenge: 'kurz' | 'mittel' | 'lang';
  maxZeichen?: number;
  minWoerter?: number;
  maxWoerter?: number;
  hilfstextPlaceholder?: string;
}

export interface ZuordnungFrage extends FrageBase {
  typ: 'zuordnung';
  fragetext: string;
  paare: { links: string; rechts: string }[];
  zufallsreihenfolge: boolean;
}

export interface LueckentextFrage extends FrageBase {
  typ: 'lueckentext';
  fragetext: string;
  textMitLuecken: string;
  luecken: {
    id: string;
    korrekteAntworten: string[];
    caseSensitive: boolean;
    dropdownOptionen?: string[]  // wenn gesetzt und nicht leer → Dropdown statt Texteingabe
    /** Teilerklärung (C9): warum dieser Begriff erwartet wird. */
    erklaerung?: string;
  }[];
  lueckentextModus?: 'freitext' | 'dropdown';  // NEU — default 'freitext' via Normalizer
}

export interface VisualisierungFrage extends FrageBase {
  typ: 'visualisierung';
  untertyp: 'zeichnen' | 'diagramm-manipulieren' | 'schema-erstellen';
  fragetext: string;
  ausgangsdiagramm?: DiagrammConfig;
  canvasConfig?: CanvasConfig;
  musterloesungBild?: string;
}

export interface DiagrammConfig {
  typ: 'angebot-nachfrage' | 'konjunkturzyklus' | 'bilanz' | 'custom';
  achsen?: { x: string; y: string };
  elemente?: DiagrammElement[];
}

export interface DiagrammElement {
  typ: string;
  label: string;
  daten: unknown;
}

export interface CanvasConfig {
  breite: number;
  hoehe: number;
  koordinatensystem: boolean;
  achsenBeschriftung?: { x: string; y: string };
  werkzeuge: ('stift' | 'linie' | 'pfeil' | 'text' | 'rechteck' | 'ellipse')[];
  hintergrundbild?: string;
  hintergrundbildId?: string;
  groessePreset?: 'klein' | 'mittel' | 'gross' | 'auto';
  radierer?: boolean;
  farben?: string[];
}

export interface RichtigFalschFrage extends FrageBase {
  typ: 'richtigfalsch';
  fragetext: string;
  aussagen: {
    id: string;
    text: string;
    korrekt: boolean;
    erklaerung?: string;
  }[];
  /** Erklärungen in der Korrektur-Einsicht den SuS zeigen (Default: false = nur LP) */
  erklaerungSichtbar?: boolean;
}

export interface BerechnungFrage extends FrageBase {
  typ: 'berechnung';
  fragetext: string;
  /** Erwartete numerische Ergebnisse (mehrere Teilresultate möglich) */
  ergebnisse: {
    id: string;
    label: string;
    korrekt: number;
    toleranz: number;
    einheit?: string;
  }[];
  /** Rechenweg soll gezeigt werden? */
  rechenwegErforderlich: boolean;
  hilfsmittel?: string;
}

// === SHARED FIBU ===

export type Kontenkategorie = 'aktiv' | 'passiv' | 'aufwand' | 'ertrag'

export interface KontenauswahlConfig {
  modus: 'eingeschraenkt' | 'voll'
  konten?: string[]
  /** Kategorie-Farben in Konten-Dropdown anzeigen (Aktiv=gelb, Passiv=rot, Aufwand=blau, Ertrag=grün) */
  zeigeKategoriefarben?: boolean
}

// === BUCHUNGSSATZ ===

export interface BuchungsKonto {
  kontonummer: string
  betrag: number
}

/** U2: Vereinfachter Buchungssatz — "Soll-Konto an Haben-Konto Betrag" */
export interface BuchungssatzZeile {
  id: string
  sollKonto: string
  habenKonto: string
  betrag: number
  /** Teilerklärung (C9): Geschäftsvorfall-bezogene Begründung pro Buchung. */
  erklaerung?: string
}

/** @deprecated Altes Format — nur noch für Referenz */
export interface SollHabenZeile {
  id: string
  sollKonten: BuchungsKonto[]
  habenKonten: BuchungsKonto[]
  buchungstext?: string
}

export interface BuchungssatzFrage extends FrageBase {
  typ: 'buchungssatz'
  geschaeftsfall: string
  buchungen: BuchungssatzZeile[]
  kontenauswahl: KontenauswahlConfig
}

// === T-KONTO ===

export interface TKontoEintrag {
  seite: 'soll' | 'haben'
  gegenkonto: string
  betrag: number
  buchungstext?: string
}

export interface TKontoDefinition {
  id: string
  kontonummer: string
  anfangsbestand?: number
  anfangsbestandVorgegeben: boolean
  eintraege: TKontoEintrag[]
  saldo: { betrag: number; seite: 'soll' | 'haben' }
}

export interface TKontoBewertung {
  beschriftungSollHaben: boolean
  kontenkategorie: boolean
  zunahmeAbnahme: boolean
  buchungenKorrekt: boolean
  saldoKorrekt: boolean
}

export interface TKontoFrage extends FrageBase {
  typ: 'tkonto'
  aufgabentext: string
  geschaeftsfaelle?: string[]
  konten: TKontoDefinition[]
  kontenauswahl: KontenauswahlConfig
  bewertungsoptionen: TKontoBewertung
}

// === KONTENBESTIMMUNG ===

export interface KontenAntwort {
  kontonummer?: string
  kategorie?: Kontenkategorie
  seite?: 'soll' | 'haben'
}

export interface Kontenaufgabe {
  id: string
  text: string
  erwarteteAntworten: KontenAntwort[]
  /** Teilerklärung (C9): warum diese Kategorie/Konto korrekt ist. */
  erklaerung?: string
}

export interface KontenbestimmungFrage extends FrageBase {
  typ: 'kontenbestimmung'
  aufgabentext: string
  modus: 'konto_bestimmen' | 'kategorie_bestimmen' | 'gemischt'
  aufgaben: Kontenaufgabe[]
  kontenauswahl: KontenauswahlConfig
}

// === BILANZ / ERFOLGSRECHNUNG ===

export interface KontoMitSaldo {
  kontonummer: string
  name?: string
  saldo: number
  /** Teilerklärung (C9): Einordnung in Bilanz/ER. ID = kontonummer. */
  erklaerung?: string
}

export interface BilanzGruppe {
  label: string
  konten: string[]
}

export interface BilanzStruktur {
  aktivSeite: { label: string; gruppen: BilanzGruppe[] }
  passivSeite: { label: string; gruppen: BilanzGruppe[] }
  bilanzsumme: number
}

export interface ERStufe {
  label: string
  aufwandKonten: string[]
  ertragKonten: string[]
  zwischentotal: number
}

export interface ERStruktur {
  stufen: ERStufe[]
}

export interface BilanzERLoesung {
  bilanz?: BilanzStruktur
  erfolgsrechnung?: ERStruktur
}

export interface BilanzERBewertung {
  seitenbeschriftung: boolean
  gruppenbildung: boolean
  gruppenreihenfolge: boolean
  kontenreihenfolge: boolean
  betraegeKorrekt: boolean
  zwischentotale: boolean
  bilanzsummeOderGewinn: boolean
  mehrstufigkeit: boolean
}

export interface BilanzERFrage extends FrageBase {
  typ: 'bilanzstruktur'
  aufgabentext: string
  modus: 'bilanz' | 'erfolgsrechnung' | 'beides'
  kontenMitSaldi: KontoMitSaldo[]
  loesung: BilanzERLoesung
  bewertungsoptionen: BilanzERBewertung
}

// === AUFGABENGRUPPE ===

/** Inline-Teilaufgabe innerhalb einer Aufgabengruppe — vollständige Frage minus Metadaten */
export interface InlineTeilaufgabe {
  id: string                    // z.B. "{parentId}_a"
  typ: string                   // alle Fragetypen ausser 'aufgabengruppe'
  fragetext: string
  punkte: number
  musterlosung?: string
  bewertungsraster?: Bewertungskriterium[]
  anhaenge?: FrageAnhang[]

  // MC
  optionen?: MCOption[]
  mehrfachauswahl?: boolean
  zufallsreihenfolge?: boolean
  erklaerungSichtbar?: boolean
  // Richtig/Falsch
  aussagen?: { id: string; text: string; korrekt: boolean; erklaerung?: string }[]
  // Freitext
  laenge?: 'kurz' | 'mittel' | 'lang'
  maxZeichen?: number
  minWoerter?: number
  maxWoerter?: number
  hilfstextPlaceholder?: string
  // Lückentext
  textMitLuecken?: string
  luecken?: LueckentextFrage['luecken']
  // Zuordnung
  paare?: { links: string; rechts: string }[]
  // Berechnung
  ergebnisse?: BerechnungFrage['ergebnisse']
  rechenwegErforderlich?: boolean
  hilfsmittel?: string
  // Sortierung
  elemente?: string[]
  teilpunkte?: boolean
  // Hotspot
  bildUrl?: string
  bereiche?: HotspotBereich[]
  // Bildbeschriftung
  beschriftungen?: BildbeschriftungLabel[]
  // DragDrop Bild
  zielzonen?: DragDropBildZielzone[]
  labels?: string[]
  // Code
  sprache?: string
  starterCode?: string
  musterLoesung?: string
  // Formel
  korrekteFormel?: string
  vergleichsModus?: string
  // Audio
  maxDauerSekunden?: number
  // PDF
  pdfBase64?: string
  pdfDriveFileId?: string
  pdfUrl?: string
  pdfDateiname?: string
  seitenAnzahl?: number
  kategorien?: PDFKategorie[]
  erlaubteWerkzeuge?: PDFAnnotationsWerkzeug[]
  // Visualisierung/Zeichnen
  untertyp?: string
  canvasConfig?: CanvasConfig
  musterloesungBild?: string
  // FiBu (Buchungssatz, TKonto, etc.) — typ-spezifische Felder als generisches Objekt
  // Wird bei Bedarf erweitert
  [key: string]: unknown
}

export interface AufgabengruppeFrage extends FrageBase {
  typ: 'aufgabengruppe'
  kontext: string
  kontextAnhaenge?: FrageAnhang[]
  /** Inline-Teilaufgaben (neues Format) */
  teilaufgaben?: InlineTeilaufgabe[]
  /** Legacy: Referenzen auf externe Frage-IDs (altes Format) */
  teilaufgabenIds?: string[]
}

// === PDF-ANNOTATION ===

export type PDFAnnotationsWerkzeug = 'highlighter' | 'kommentar' | 'freihand' | 'label' | 'text'
export type PDFToolbarWerkzeug = PDFAnnotationsWerkzeug | 'radierer' | 'auswahl'

export interface PDFKategorie {
  id: string
  label: string
  farbe: string
  beschreibung?: string
}

export interface PDFTextRange {
  startOffset: number
  endOffset: number
  text: string
}

interface PDFAnnotationBase {
  id: string
  seite: number
  zeitstempel: string
}

export interface PDFHighlightAnnotation extends PDFAnnotationBase {
  werkzeug: 'highlighter'
  textRange: PDFTextRange
  farbe: string
}

export interface PDFKommentarAnnotation extends PDFAnnotationBase {
  werkzeug: 'kommentar'
  position: { x: number; y: number }
  kommentarText: string
}

export interface PDFFreihandAnnotation extends PDFAnnotationBase {
  werkzeug: 'freihand'
  zeichnungsDaten: string
  farbe: string
}

export interface PDFLabelAnnotation extends PDFAnnotationBase {
  werkzeug: 'label'
  textRange: PDFTextRange
  kategorieId: string
  farbe: string
}

export interface PDFTextAnnotation extends PDFAnnotationBase {
  werkzeug: 'text'
  position: { x: number; y: number }
  text: string
  farbe: string
  groesse: number // Font-Grösse in px
  fett: boolean
  rotation?: 0 | 90 | 180 | 270
}

export type PDFAnnotation =
  | PDFHighlightAnnotation
  | PDFKommentarAnnotation
  | PDFFreihandAnnotation
  | PDFLabelAnnotation
  | PDFTextAnnotation

export interface PDFFrage extends FrageBase {
  typ: 'pdf'
  fragetext: string
  pdfDriveFileId?: string
  pdfBase64?: string
  pdfUrl?: string
  pdfDateiname: string
  /** Neue kanonische PDF-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  pdf?: MediaQuelle
  seitenAnzahl: number
  kategorien?: PDFKategorie[]
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  musterloesungAnnotationen?: PDFAnnotation[]
}

// === SORTIERUNG ===

export interface SortierungFrage extends FrageBase {
  typ: 'sortierung'
  fragetext: string
  elemente: string[]        // korrekte Reihenfolge (LP definiert)
  teilpunkte: boolean       // Teilpunkte pro korrektem Element
}

// === HOTSPOT ===

export interface HotspotBereich {
  id: string
  form: 'rechteck' | 'polygon'           // nur Editor-UX, Korrektur ignoriert
  punkte: { x: number; y: number }[]     // Prozent 0-100, ≥3 Punkte (Rechteck = 4)
  label: string
  punktzahl: number                      // Punkte-Wert für Korrektur
  /** Teilerklärung (C9): Begründung warum Bereich korrekt / Distraktor ist. */
  erklaerung?: string
}

export interface HotspotFrage extends FrageBase {
  typ: 'hotspot'
  fragetext: string
  bildUrl: string
  /** @deprecated Phase 6 entfernt. Jetzt verwenden: `bild`. */
  bildDriveFileId?: string
  /** Neue kanonische Bild-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  bild?: MediaQuelle
  bereiche: HotspotBereich[]
  mehrfachauswahl: boolean
}

// === BILDBESCHRIFTUNG ===

export interface BildbeschriftungLabel {
  id: string
  position: { x: number; y: number }  // Prozent 0-100
  korrekt: string[]                     // akzeptierte Antworten
  /** S137: Konsistent zu LueckentextFrage — Default=false (case-insensitive). */
  caseSensitive?: boolean
  /** Teilerklärung (C9): was an dieser Stelle zu beschriften ist und warum. */
  erklaerung?: string
}

export interface BildbeschriftungFrage extends FrageBase {
  typ: 'bildbeschriftung'
  fragetext: string
  bildUrl: string
  /** @deprecated Phase 6 entfernt. Jetzt verwenden: `bild`. */
  bildDriveFileId?: string
  /** Neue kanonische Bild-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  bild?: MediaQuelle
  beschriftungen: BildbeschriftungLabel[]
}

// === AUDIO-AUFNAHME ===

export interface AudioFrage extends FrageBase {
  typ: 'audio'
  fragetext: string
  maxDauerSekunden?: number  // optionales Aufnahme-Zeitlimit
}

// === DRAG & DROP AUF BILDER ===

export interface DragDropBildZielzone {
  id: string
  form: 'rechteck' | 'polygon'
  punkte: { x: number; y: number }[]   // Prozent 0-100, ≥3 Punkte (Rechteck = 4)
  korrektesLabel: string
  /** Teilerklärung (C9): welches Label hierhin gehört und warum. */
  erklaerung?: string
}

export interface DragDropBildFrage extends FrageBase {
  typ: 'dragdrop_bild'
  fragetext: string
  bildUrl: string
  /** @deprecated Phase 6 entfernt. Jetzt verwenden: `bild`. */
  bildDriveFileId?: string
  /** Neue kanonische Bild-Referenz (Dual-Write Phase 3-5, Pflicht ab Phase 6). */
  bild?: MediaQuelle
  zielzonen: DragDropBildZielzone[]
  labels: string[]  // Pool von Labels (kann Distraktoren enthalten)
}

// === CODE-EDITOR ===

export interface CodeFrage extends FrageBase {
  typ: 'code'
  fragetext: string
  sprache: string        // 'python' | 'javascript' | 'sql' | 'html' | 'css' | 'java'
  starterCode?: string   // Vorgabe-Code
  musterLoesung?: string // LP-Musterlösung (Code)
}

// === FORMEL-EDITOR (LaTeX) ===

export interface FormelFrage extends FrageBase {
  typ: 'formel'
  fragetext: string
  korrekteFormel: string       // LaTeX der korrekten Formel
  vergleichsModus: 'exakt'     // 'symbolisch' reserviert für später
  toleranz?: number
}

export type Frage = MCFrage | FreitextFrage | ZuordnungFrage | LueckentextFrage | VisualisierungFrage | RichtigFalschFrage | BerechnungFrage | BuchungssatzFrage | TKontoFrage | KontenbestimmungFrage | BilanzERFrage | AufgabengruppeFrage | PDFFrage | SortierungFrage | HotspotFrage | BildbeschriftungFrage | AudioFrage | DragDropBildFrage | CodeFrage | FormelFrage;

// === LERNZIELE ===

export interface Lernziel {
  id: string
  fach: string
  poolId?: string
  thema: string
  text: string
  bloom: string
  aktiv?: boolean
  fragenIds?: string[]
}

// === PERFORMANCE-TRACKING ===

export interface FragenPerformance {
  frageId: string
  anzahlVerwendungen: number
  gesamtN: number
  durchschnittLoesungsquote: number  // 0-100
  durchschnittTrennschaerfe: number | null
  verwendungen: { pruefungId: string; pruefungTitel: string; datum: string; loesungsquote: number; n: number; trennschaerfe?: number | null }[]
}
