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
}

// === FRAGE (Basis) ===
export interface FrageBase {
  id: string;
  version: number;
  erstelltAm: string;
  geaendertAm: string;

  // Inhaltliche Zuordnung
  fachbereich: Fachbereich;
  thema: string;
  unterthema?: string;
  lehrplanziel?: string;
  semester: string[];
  gefaesse: Gefaess[];

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
  anhaenge?: FrageAnhang[];

  // Zeitbedarf
  /** Geschätzter Zeitbedarf in Minuten (vorausgefüllt, editierbar) */
  zeitbedarf?: number;

  // Herkunft
  quelle?: 'pool' | 'papier' | 'manuell' | 'ki-generiert';
  quellReferenz?: string;

  // Sharing / Zusammenarbeit
  autor?: string;  // E-Mail der erstellenden LP
  geteilt?: 'privat' | 'schule';  // Standard: privat; 'schule' = sichtbar für alle @gymhofwil.ch
  geteiltVon?: string;  // Anzeigename bei geteilten Fragen

  // Pool-Sync (importierte Fragen aus Übungspools)
  poolId?: string                     // Compound-Key '{pool}:{frage}', z.B. 'vwl_bip:d01'
  poolGeprueft?: boolean              // Review-Status in Pool-Quelle
  pruefungstauglich?: boolean         // Separat abgesegnet im Prüfungstool
  poolContentHash?: string            // SHA-256 für Änderungserkennung
  poolUpdateVerfuegbar?: boolean      // true wenn Pool-Version neuer
  poolVersion?: import('./pool').PoolFrageSnapshot
  lernzielIds?: string[]              // Referenzen auf Lernziel-Einträge
}

export type Fachbereich = 'VWL' | 'BWL' | 'Recht' | 'Informatik';
export type Gefaess = 'SF' | 'EF' | 'EWR' | 'GF';
export type BloomStufe = 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6';

export interface Bewertungskriterium {
  beschreibung: string;
  punkte: number;
  stichworte?: string[];
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
}

export interface MCOption {
  id: string;
  text: string;
  korrekt: boolean;
  feedback?: string;
}

export interface FreitextFrage extends FrageBase {
  typ: 'freitext';
  fragetext: string;
  laenge: 'kurz' | 'mittel' | 'lang';
  maxZeichen?: number;
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
  }[];
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
  werkzeuge: ('stift' | 'linie' | 'pfeil' | 'text' | 'rechteck')[];
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

export interface SollHabenZeile {
  id: string
  sollKonten: BuchungsKonto[]
  habenKonten: BuchungsKonto[]
  buchungstext?: string
}

export interface BuchungssatzFrage extends FrageBase {
  typ: 'buchungssatz'
  geschaeftsfall: string
  buchungen: SollHabenZeile[]
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
  saldo: number
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

export interface AufgabengruppeFrage extends FrageBase {
  typ: 'aufgabengruppe'
  kontext: string
  kontextAnhaenge?: FrageAnhang[]
  teilaufgabenIds: string[]
}

// === PDF-ANNOTATION ===

export type PDFAnnotationsWerkzeug = 'highlighter' | 'kommentar' | 'freihand' | 'label'
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

export type PDFAnnotation =
  | PDFHighlightAnnotation
  | PDFKommentarAnnotation
  | PDFFreihandAnnotation
  | PDFLabelAnnotation

export interface PDFFrage extends FrageBase {
  typ: 'pdf'
  fragetext: string
  pdfDriveFileId?: string
  pdfBase64?: string
  pdfUrl?: string
  pdfDateiname: string
  seitenAnzahl: number
  kategorien?: PDFKategorie[]
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  musterloesungAnnotationen?: PDFAnnotation[]
}

export type Frage = MCFrage | FreitextFrage | ZuordnungFrage | LueckentextFrage | VisualisierungFrage | RichtigFalschFrage | BerechnungFrage | BuchungssatzFrage | TKontoFrage | KontenbestimmungFrage | BilanzERFrage | AufgabengruppeFrage | PDFFrage;
