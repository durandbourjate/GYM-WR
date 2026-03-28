export interface Teilnehmer {
  email: string
  name: string
  vorname: string
  klasse: string
  quelle: 'klassenliste' | 'manuell'
  einladungGesendet?: boolean
}

export interface PruefungsConfig {
  id: string;
  titel: string;

  // Zuordnung
  klasse: string;
  gefaess: string;
  semester: string;
  fachbereiche: string[];
  fach?: string;
  klassenTyp?: 'regel' | 'taf';
  datum: string;

  // Prüfungsparameter
  typ: 'summativ' | 'formativ';
  modus: 'pruefung' | 'uebung';
  dauerMinuten: number;
  zeitModus: 'countdown' | 'open-end';
  gesamtpunkte: number;

  // Authentifizierung
  erlaubteKlasse: string;
  erlaubteEmails?: string[];

  // SEB-Konfiguration
  sebErforderlich: boolean;
  sebCustomUserAgent?: string;
  sebAusnahmen?: string[];  // E-Mails von SuS mit LP-Ausnahme (dürfen ohne SEB)

  // Fragen
  abschnitte: PruefungsAbschnitt[];

  // Navigation & Darstellung
  zufallsreihenfolgeFragen: boolean;
  zufallsreihenfolgeOptionen: boolean;
  ruecknavigation: boolean;
  zeitanzeigeTyp: 'countdown' | 'verstricheneZeit' | 'keine';

  // Warteraum / Freischaltung
  freigeschaltet: boolean;

  // Teilnehmer (Workflow)
  teilnehmer?: Teilnehmer[];
  beendetUm?: string; // ISO-Zeitstempel

  // Zeitzuschläge (Nachteilsausgleich: E-Mail → zusätzliche Minuten)
  zeitverlaengerungen?: Record<string, number>;

  // Auto-Save
  autoSaveIntervallSekunden: number;
  heartbeatIntervallSekunden: number;

  // Korrektur
  korrektur: {
    aktiviert: boolean;
    modus: 'sofort' | 'batch';
    systemPrompt?: string;
    freigegeben?: boolean;  // Legacy (Rückwärtskompatibilität)
    einsichtFreigegeben?: boolean;  // SuS können Korrektur im Tool ansehen
    pdfFreigegeben?: boolean;       // SuS können Korrektur-PDF herunterladen
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

  // Durchführungs-ID (wird bei Reset neu generiert — erkennt stale State)
  durchfuehrungId?: string;

  // Soft-Lockdown: Kontrollstufe (Default: 'standard')
  kontrollStufe?: 'keine' | 'locker' | 'standard' | 'streng';

  // Rechtschreibprüfung (Default: true — Browser-Verhalten)
  rechtschreibpruefung?: boolean;
  rechtschreibSprache?: 'de' | 'fr' | 'en' | 'it';

  // Multi-Teacher: Ersteller der Prüfung
  erstelltVon?: string;
  berechtigungen?: import('./auth').Berechtigung[];
  _recht?: import('./auth').EffektivesRecht;  // Vom Backend berechnet
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
  typ: 'pdf' | 'text' | 'richtext' | 'link' | 'dateiUpload' | 'videoEmbed';
  /** URL für PDF oder Link */
  url?: string;
  /** Inline-Inhalt für Typ 'text' */
  inhalt?: string;
  /** Dateiname bei Typ 'dateiUpload' */
  dateiname?: string;
  /** Drive File ID bei Typ 'dateiUpload' */
  driveFileId?: string;
  /** MIME-Typ bei Datei-Upload (audio/*, video/*) */
  mimeType?: string;
  /** Embed-URL bei Typ 'videoEmbed' (YouTube, Vimeo, nanoo.tv) */
  embedUrl?: string;
}

export interface PruefungsAbschnitt {
  titel: string;
  beschreibung?: string;
  fragenIds: string[];
  punkteOverrides?: Record<string, number>;
}
