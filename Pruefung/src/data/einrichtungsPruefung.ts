import type { PruefungsConfig } from '../types/pruefung.ts'

export const einrichtungsPruefung: PruefungsConfig = {
  id: 'einrichtung-sf-wr-27a28f',
  titel: 'Einrichtungsprüfung — Lerne das Prüfungstool kennen',

  klasse: 'sf-wr-27a28f',
  gefaess: 'SF',
  semester: 'S5',
  fachbereiche: ['VWL', 'BWL', 'Recht'],
  datum: '2026-03-24',

  typ: 'formativ',
  modus: 'uebung',
  dauerMinuten: 30,
  zeitModus: 'open-end',
  gesamtpunkte: 40,

  erlaubteKlasse: 'sf-wr-27a28f',

  sebErforderlich: false,

  abschnitte: [
    {
      titel: 'Teil A: Ankommen & Orientierung',
      beschreibung: 'Schauen Sie sich auf der Prüfungsoberfläche um. Beantworten Sie die Fragen, indem Sie das Tool erkunden.',
      fragenIds: ['einr-mc-orientierung', 'einr-mc-uielemente', 'einr-rf-toolfunktionen'],
    },
    {
      titel: 'Teil B: Texteingabe',
      beschreibung: 'Testen Sie die verschiedenen Eingabemöglichkeiten: Freitext mit Formatierung und Lückentext.',
      fragenIds: ['einr-ft-formatierung', 'einr-lt-hofwil', 'einr-ft-morgen'],
    },
    {
      titel: 'Teil C: Auswahl & Rechnen',
      beschreibung: 'Testen Sie Zuordnungsaufgaben und numerische Eingaben mit Rechenweg.',
      fragenIds: ['einr-zu-emojis', 'einr-be-pizza'],
    },
    {
      titel: 'Teil D: Zeichnen & PDF',
      beschreibung: 'Testen Sie die Zeichenwerkzeuge und die PDF-Annotation. Lassen Sie Ihrer Kreativität freien Lauf!',
      fragenIds: ['einr-vis-smiley', 'einr-pdf-witz'],
    },
    {
      titel: 'Teil E: Buchhaltung — Eingabefelder testen',
      beschreibung: 'Diese Aufgaben testen spezielle Eingabefelder für Buchhaltung. Die Lösungen stehen in der Aufgabenstellung — geben Sie sie einfach ein, um die Felder kennenzulernen.',
      fragenIds: ['einr-bs-eis', 'einr-tk-kasse', 'einr-kb-einfach', 'einr-bilanz-einfach'],
    },
    {
      titel: 'Teil F: Material & Features',
      beschreibung: 'Zum Abschluss: Nutzen Sie das Materialpanel und entdecken Sie versteckte Features des Tools!',
      fragenIds: ['einr-ag-material', 'einr-mc-features'],
    },
  ],

  materialien: [
    {
      id: 'mat-witzsammlung',
      titel: 'Amtliche Witzsammlung der Schweiz (Ausgabe 2026)',
      typ: 'pdf',
      dateiname: 'witzsammlung.pdf',
    },
  ],

  zufallsreihenfolgeFragen: false,
  zufallsreihenfolgeOptionen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'verstricheneZeit',

  freigeschaltet: false,
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
