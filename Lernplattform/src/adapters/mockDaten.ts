import type { Frage } from '../types/fragen'

export const MOCK_FRAGEN: Frage[] = [
  // Mathe — Addition
  {
    id: 'math-add-1', fach: 'Mathe', thema: 'Addition', typ: 'mc',
    schwierigkeit: 1, frage: 'Was ist 7 + 5?',
    optionen: ['10', '11', '12', '13'], korrekt: '12',
    erklaerung: '7 + 5 = 12', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-2', fach: 'Mathe', thema: 'Addition', typ: 'calc',
    schwierigkeit: 1, frage: 'Berechne: 234 + 567',
    korrekt: '801', toleranz: 0, erklaerung: '234 + 567 = 801',
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-3', fach: 'Mathe', thema: 'Addition', typ: 'fill',
    schwierigkeit: 1, frage: 'Ergaenze: 15 + ___ = 23',
    luecken: [{ id: 'l1', korrekt: '8' }],
    erklaerung: '15 + 8 = 23', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-add-4', fach: 'Mathe', thema: 'Addition', typ: 'mc',
    schwierigkeit: 2, frage: 'Was ist 99 + 47?',
    optionen: ['136', '146', '156', '147'], korrekt: '146',
    uebung: true, pruefungstauglich: false,
  },
  // Mathe — Multiplikation
  {
    id: 'math-mul-1', fach: 'Mathe', thema: 'Multiplikation', typ: 'mc',
    schwierigkeit: 1, frage: 'Was ist 6 x 8?',
    optionen: ['42', '46', '48', '56'], korrekt: '48',
    erklaerung: '6 x 8 = 48', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'math-mul-2', fach: 'Mathe', thema: 'Multiplikation', typ: 'calc',
    schwierigkeit: 2, frage: 'Berechne: 12 x 15',
    korrekt: '180', toleranz: 0, uebung: true, pruefungstauglich: false,
  },
  // Deutsch — Wortarten
  {
    id: 'de-wort-1', fach: 'Deutsch', thema: 'Wortarten', typ: 'mc',
    schwierigkeit: 1, frage: 'Welche Wortart ist "schnell"?',
    optionen: ['Nomen', 'Verb', 'Adjektiv', 'Pronomen'], korrekt: 'Adjektiv',
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-wort-2', fach: 'Deutsch', thema: 'Wortarten', typ: 'sort',
    schwierigkeit: 2, frage: 'Ordne die Woerter den Wortarten zu.',
    kategorien: ['Nomen', 'Verb', 'Adjektiv'],
    elemente: [
      { text: 'Haus', kategorie: 'Nomen' },
      { text: 'laufen', kategorie: 'Verb' },
      { text: 'gross', kategorie: 'Adjektiv' },
      { text: 'Baum', kategorie: 'Nomen' },
    ],
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-wort-3', fach: 'Deutsch', thema: 'Wortarten', typ: 'tf',
    schwierigkeit: 1, frage: 'Richtig oder falsch?',
    aussagen: [
      { text: '"Tisch" ist ein Nomen.', korrekt: true },
      { text: '"rennen" ist ein Adjektiv.', korrekt: false },
      { text: '"schoen" ist ein Adjektiv.', korrekt: true },
    ],
    uebung: true, pruefungstauglich: false,
  },
  // Deutsch — Satzglieder
  {
    id: 'de-satz-1', fach: 'Deutsch', thema: 'Satzglieder', typ: 'zuordnung',
    schwierigkeit: 2, frage: 'Ordne die Satzglieder richtig zu.',
    paare: [
      { links: 'Wer/Was?', rechts: 'Subjekt' },
      { links: 'Was tut?', rechts: 'Praedikat' },
      { links: 'Wen/Was?', rechts: 'Akkusativobjekt' },
    ],
    uebung: true, pruefungstauglich: false,
  },
  {
    id: 'de-satz-2', fach: 'Deutsch', thema: 'Satzglieder', typ: 'sortierung',
    schwierigkeit: 2, frage: 'Bringe die Satzglieder in die richtige Reihenfolge fuer einen Aussagesatz.',
    reihenfolge: ['Subjekt', 'Praedikat', 'Objekt', 'Adverbiale'],
    uebung: true, pruefungstauglich: false,
  },
  // VWL — Markt (fuer Gym-Kontext)
  {
    id: 'vwl-markt-1', fach: 'VWL', thema: 'Markt und Preis', typ: 'mc',
    schwierigkeit: 1, taxonomie: 'K1',
    frage: 'Was passiert typischerweise mit dem Preis, wenn die Nachfrage steigt?',
    optionen: ['Er sinkt', 'Er steigt', 'Er bleibt gleich', 'Er wird negativ'],
    korrekt: 'Er steigt', uebung: true, pruefungstauglich: false,
  },
  {
    id: 'vwl-markt-2', fach: 'VWL', thema: 'Markt und Preis', typ: 'multi',
    schwierigkeit: 2, taxonomie: 'K2',
    frage: 'Welche Faktoren verschieben die Nachfragekurve nach rechts?',
    optionen: ['Steigende Einkommen', 'Hoehere Preise', 'Werbung', 'Neue Substitute'],
    korrekt: ['Steigende Einkommen', 'Werbung'],
    uebung: true, pruefungstauglich: false,
  },
]
