export type Selbstbewertung = 'korrekt' | 'teilweise' | 'falsch'

export interface PruefungsAbgabe {
  pruefungId: string;
  email: string;
  name: string;
  schuelerId?: string;

  startzeit: string;
  abgabezeit: string;

  antworten: Record<string, Antwort>;

  meta: {
    sebVersion?: string;
    browserInfo: string;
    autoSaveCount: number;
    netzwerkFehler: number;
    heartbeats: number;
    unterbrechungen: Unterbrechung[];
  };
}

export interface Unterbrechung {
  zeitpunkt: string;
  dauer_sekunden: number;
  typ: 'heartbeat-ausfall' | 'focus-verloren' | 'seb-warnung' | 'tab-wechsel' | 'copy-versuch' | 'vollbild-verlassen' | 'split-view';
}

export type Antwort =
  | { typ: 'mc'; gewaehlteOptionen: string[] }
  | { typ: 'freitext'; text: string; formatierung?: string; selbstbewertung?: Selbstbewertung }
  | { typ: 'zuordnung'; zuordnungen: Record<string, string> }
  | { typ: 'lueckentext'; eintraege: Record<string, string> }
  | { typ: 'visualisierung'; daten: string; bildLink?: string; selbstbewertung?: Selbstbewertung }
  | { typ: 'richtigfalsch'; bewertungen: Record<string, boolean> }
  | { typ: 'berechnung'; ergebnisse: Record<string, string>; rechenweg?: string }
  | { typ: 'buchungssatz'; buchungen: {
      id: string;
      sollKonto: string;
      habenKonto: string;
      betrag: number;
    }[] }
  | { typ: 'tkonto'; konten: {
      id: string;
      beschriftungLinks?: string;
      beschriftungRechts?: string;
      kontenkategorie?: string;
      eintraegeLinks: { gegenkonto: string; betrag: number }[];
      eintraegeRechts: { gegenkonto: string; betrag: number }[];
      saldo?: { betragLinks: number; betragRechts: number };
    }[] }
  | { typ: 'kontenbestimmung'; aufgaben: Record<string, {
      antworten: { kontonummer?: string; kategorie?: string; seite?: string }[];
    }> }
  | { typ: 'bilanzstruktur'; bilanz?: {
      linkeSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
      rechteSeite: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] };
      bilanzsummeLinks?: number;
      bilanzsummeRechts?: number;
    };
    erfolgsrechnung?: {
      stufen: { label: string; konten: { nr: string; betrag: number }[]; zwischentotal?: number }[];
      gewinnVerlust?: number;
    } }
  | { typ: 'pdf'; annotationen?: import('./fragen').PDFAnnotation[]; text?: string; selbstbewertung?: Selbstbewertung }
  | { typ: 'sortierung'; reihenfolge: string[] }
  | { typ: 'hotspot'; klicks: { x: number; y: number }[] }
  | { typ: 'bildbeschriftung'; eintraege: Record<string, string> }
  | { typ: 'audio'; aufnahmeUrl?: string; dauer?: number; selbstbewertung?: Selbstbewertung }
  | { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> }
  | { typ: 'code'; code: string; sprache?: string; selbstbewertung?: Selbstbewertung }
  | { typ: 'aufgabengruppe'; teilAntworten: Record<string, Antwort> }
  | { typ: 'formel'; latex: string };
