export interface PruefungsConfig {
  id: string;
  titel: string;

  // Zuordnung
  klasse: string;
  gefaess: 'SF' | 'EF' | 'EWR';
  semester: string;
  fachbereiche: string[];
  datum: string;

  // Prüfungsparameter
  typ: 'summativ' | 'formativ';
  modus: 'pruefung' | 'uebung';
  dauerMinuten: number;
  gesamtpunkte: number;

  // Authentifizierung
  erlaubteKlasse: string;
  erlaubteEmails?: string[];

  // SEB-Konfiguration
  sebErforderlich: boolean;
  sebCustomUserAgent?: string;

  // Fragen
  abschnitte: PruefungsAbschnitt[];

  // Navigation & Darstellung
  zufallsreihenfolgeFragen: boolean;
  ruecknavigation: boolean;
  zeitanzeigeTyp: 'countdown' | 'verstricheneZeit' | 'keine';

  // Warteraum / Freischaltung
  freigeschaltet: boolean;

  // Zeitzuschläge (Nachteilsausgleich: E-Mail → zusätzliche Minuten)
  zeitverlaengerungen?: Record<string, number>;

  // Auto-Save
  autoSaveIntervallSekunden: number;
  heartbeatIntervallSekunden: number;

  // KI-Korrektur
  korrektur: {
    aktiviert: boolean;
    modus: 'sofort' | 'batch';
    systemPrompt?: string;
  };

  // Feedback
  feedback: {
    zeitpunkt: 'sofort' | 'nach-review' | 'manuell';
    format: 'in-app-und-pdf' | 'pdf' | 'in-app';
    detailgrad: 'nur-punkte' | 'punkte-und-kommentar' | 'vollstaendig';
  };

  vorlageVon?: string;

  // Materialien (Gesetze, PDFs, Hilfsmittel)
  materialien?: PruefungsMaterial[];

  // Notenberechnung
  notenConfig?: NotenConfig;
}

export interface NotenConfig {
  /** Punkte für Note 6 (Default: gesamtpunkte) — kann heruntergesetzt werden */
  punkteFuerSechs: number;
  /** Rundungsgenauigkeit: 0.1 (Zehntel), 0.25 (Viertel), 0.5 (Halbe), 1 (Ganze) */
  rundung: 0.1 | 0.25 | 0.5 | 1;
}

export interface PruefungsMaterial {
  id: string;
  titel: string;
  typ: 'pdf' | 'text' | 'link';
  /** URL für PDF oder Link */
  url?: string;
  /** Inline-Inhalt für Typ 'text' */
  inhalt?: string;
}

export interface PruefungsAbschnitt {
  titel: string;
  beschreibung?: string;
  fragenIds: string[];
  punkteOverrides?: Record<string, number>;
}
