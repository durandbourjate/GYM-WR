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

export type Frage = MCFrage | FreitextFrage | ZuordnungFrage | LueckentextFrage | VisualisierungFrage | RichtigFalschFrage | BerechnungFrage;
