import type { PruefungsConfig } from '../types/pruefung.ts'
import { DEMO_KURS_ID, DEMO_PRUEFUNG_ID } from './demoConfig.ts'

export const einrichtungsPruefung: PruefungsConfig = {
  id: DEMO_PRUEFUNG_ID,
  titel: 'Einführungsprüfung — Lerne ExamLab kennen',

  klasse: DEMO_KURS_ID,
  gefaess: 'SF',
  semester: 'S5',
  fachbereiche: ['VWL', 'BWL', 'Recht'],
  datum: '2026-03-24',

  typ: 'summativ',
  modus: 'pruefung',
  dauerMinuten: 30,
  zeitModus: 'open-end',
  gesamtpunkte: 61,

  erlaubteKlasse: '',  // Offen für alle Klassen

  sebErforderlich: false,
  kontrollStufe: 'standard',

  abschnitte: [
    {
      titel: 'Teil A: Orientierung & Auswahl',
      beschreibung: 'Schauen Sie sich auf der Prüfungsoberfläche um. Beantworten Sie die Fragen, indem Sie das Tool erkunden.',
      fragenIds: ['einr-mc-orientierung', 'einr-mc-uielemente', 'einr-rf-toolfunktionen', 'einr-sort-planeten', 'einr-hs-europa'],
    },
    {
      titel: 'Teil B: Texteingabe & Sprache',
      beschreibung: 'Testen Sie die verschiedenen Eingabemöglichkeiten: Freitext, Lückentext, Formel und Audio-Aufnahme.',
      fragenIds: ['einr-ft-formatierung', 'einr-lt-hofwil', 'einr-ft-morgen', 'einr-formel-pythagoras', 'einr-audio-vorstellen'],
    },
    {
      titel: 'Teil C: Zuordnung & Bilder',
      beschreibung: 'Testen Sie Zuordnungsaufgaben, Bildbeschriftungen und Drag & Drop.',
      fragenIds: ['einr-zu-emojis', 'einr-be-pizza', 'einr-bb-zelle', 'einr-dd-kontinente'],
    },
    {
      titel: 'Teil D: Zeichnen, PDF & Code',
      beschreibung: 'Testen Sie die Zeichenwerkzeuge, PDF-Annotation und den Code-Editor.',
      fragenIds: ['einr-vis-smiley', 'einr-pdf-witz', 'einr-code-python'],
    },
    {
      titel: 'Teil E: Buchhaltung',
      beschreibung: 'Spezielle Eingabefelder für Buchhaltung testen. Die Lösungen stehen in der Aufgabenstellung — geben Sie sie einfach ein.',
      fragenIds: ['einr-bs-eis', 'einr-tk-kasse', 'einr-kb-einfach', 'einr-bilanz-einfach'],
    },
    {
      titel: 'Teil F: Material & Features',
      beschreibung: 'Nutzen Sie das Materialpanel und entdecken Sie Features des Tools!',
      fragenIds: ['einr-ag-material', 'einr-mc-features'],
    },
  ],

  materialien: [
    {
      id: 'mat-witzsammlung',
      titel: 'Amtliche Witzsammlung der Schweiz (Ausgabe 2026)',
      typ: 'pdf',
      url: './materialien/witzsammlung.pdf',
    },
    {
      id: 'mat-or-auszug',
      titel: 'OR-Auszug: Kaufvertrag (Art. 184–215)',
      typ: 'pdf',
      url: './materialien/or_auszug.pdf',
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
