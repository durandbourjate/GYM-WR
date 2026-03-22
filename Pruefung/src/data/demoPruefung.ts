import type { PruefungsConfig } from '../types/pruefung.ts'

export const demoPruefung: PruefungsConfig = {
  id: 'demo',
  titel: 'Musterprüfung W&R — Alle Fragetypen',

  klasse: 'Testklasse',
  gefaess: 'SF',
  semester: 'S4',
  fachbereiche: ['VWL', 'BWL', 'Recht'],
  datum: '2026-03-22',

  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 60,
  zeitModus: 'countdown',
  gesamtpunkte: 50,

  erlaubteKlasse: 'Testklasse',

  sebErforderlich: false,

  abschnitte: [
    {
      titel: 'Teil A: Multiple Choice & Richtig/Falsch',
      beschreibung: 'Beantworten Sie alle Fragen. Bei Mehrfachauswahl-Fragen können mehrere Antworten korrekt sein. Bei Richtig/Falsch beurteilen Sie jede Aussage einzeln.',
      fragenIds: ['demo-mc-konjunktur', 'demo-mc-vertrag', 'demo-rf-geldpolitik'],
    },
    {
      titel: 'Teil B: Kurzantworten',
      beschreibung: 'Ergänzen Sie die Lücken, ordnen Sie die Begriffe zu und lösen Sie die Berechnungsaufgabe. Zeigen Sie bei Berechnungen den Rechenweg.',
      fragenIds: ['demo-lt-normenhierarchie', 'demo-zu-rechtsformen', 'demo-be-erfolgsrechnung'],
    },
    {
      titel: 'Teil C: Freitext',
      beschreibung: 'Beantworten Sie die Fragen in eigenen Worten. Achten Sie auf eine klare Struktur und verwenden Sie die Fachbegriffe korrekt.',
      fragenIds: ['demo-ft-bip', 'demo-ft-kaufvertrag'],
    },
    {
      titel: 'Teil D: Finanzbuchhaltung',
      beschreibung: 'Verwenden Sie den Kontenplan KMU. Buchen Sie sauber mit Kontonummer und Betrag. Beachten Sie die Buchungsregeln (Soll an Haben).',
      fragenIds: ['demo-bs-geschaeftsfaelle', 'demo-tk-bank', 'demo-kb-gemischt', 'demo-bilanz-einfach'],
    },
    {
      titel: 'Teil E: Fallbeispiel',
      beschreibung: 'Lesen Sie das Fallbeispiel aufmerksam durch und beantworten Sie alle Teilaufgaben.',
      fragenIds: ['demo-ag-gmbh'],
    },
  ],

  materialien: [
    {
      id: 'mat-kontenplan',
      titel: 'Kontenplan KMU (Auszug)',
      typ: 'text',
      inhalt: '1000 Kasse | 1020 Bank | 1100 Debitoren | 2000 Kreditoren | 2100 Bankdarlehen | 2800 Eigenkapital | 3200 Warenertrag | 4200 Warenaufwand | 5200 Personalaufwand | 6000 Mietaufwand',
    },
  ],

  zufallsreihenfolgeFragen: false,
  zufallsreihenfolgeOptionen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'countdown',

  freigeschaltet: true,
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 10,

  korrektur: {
    aktiviert: true,
    modus: 'batch',
    freigegeben: false,
  },

  feedback: {
    zeitpunkt: 'manuell',
    format: 'in-app-und-pdf',
    detailgrad: 'vollstaendig',
  },
}
