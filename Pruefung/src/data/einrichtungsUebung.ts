import type { PruefungsConfig } from '../types/pruefung.ts'
import { DEMO_KURS_ID } from './demoConfig.ts'

export const einrichtungsUebung: PruefungsConfig = {
  id: 'einrichtung-uebung',
  titel: 'Einführungsübung — Lerne ExamLab kennen',

  klasse: DEMO_KURS_ID,
  gefaess: 'SF',
  semester: 'S5',
  fachbereiche: ['VWL', 'BWL', 'Recht'],
  datum: '2026-04-05',

  typ: 'formativ',
  modus: 'uebung',
  dauerMinuten: 30,
  zeitModus: 'open-end',
  gesamtpunkte: 59,

  erlaubteKlasse: '',  // Offen für alle Klassen

  sebErforderlich: false,
  kontrollStufe: 'locker',

  abschnitte: [
    {
      titel: 'Teil A: Orientierung in der Übung',
      beschreibung: 'Schauen Sie sich auf der Übungsoberfläche um. Beantworten Sie die Fragen, indem Sie ExamLab erkunden.',
      fragenIds: ['ueb-mc-orientierung', 'ueb-mc-uielemente', 'ueb-rf-toolfunktionen'],
    },
    {
      titel: 'Teil B: Texteingabe testen',
      beschreibung: 'Testen Sie die verschiedenen Eingabemöglichkeiten: Freitext, Lückentext und Zuordnung.',
      fragenIds: ['ueb-ft-formatierung', 'ueb-lt-hofwil', 'ueb-zu-emojis'],
    },
    {
      titel: 'Teil C: Mastery-System & Features',
      beschreibung: 'Lernen Sie das Mastery-System von ExamLab Üben kennen und testen Sie die wichtigsten Features.',
      fragenIds: ['ueb-mc-mastery', 'ueb-mc-features'],
    },
    {
      titel: 'Teil D: Weitere Fragetypen kennenlernen',
      beschreibung: 'Testen Sie Berechnung, Sortierung, Buchhaltung und Zeichnen.',
      fragenIds: ['ueb-be-rechnung', 'ueb-sort-wochentage', 'ueb-bs-einkauf', 'ueb-tk-bank', 'ueb-bilanz-einfach', 'ueb-kb-kategorien', 'ueb-vis-smiley'],
    },
    {
      titel: 'Teil E: Spezielle Fragetypen',
      beschreibung: 'Testen Sie PDF-Annotation, Hotspot, Bildbeschriftung, Audio, DragDrop, Code und Formel.',
      fragenIds: ['ueb-pdf-witz', 'ueb-sort-planeten', 'ueb-hs-europa', 'ueb-bb-zelle', 'ueb-audio-vorstellen', 'ueb-dd-kontinente', 'ueb-code-python', 'ueb-formel-pythagoras'],
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
