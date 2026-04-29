import type {
  Frage, FrageBase,
  MCFrage, FreitextFrage, ZuordnungFrage, LueckentextFrage, VisualisierungFrage,
  RichtigFalschFrage, BerechnungFrage, BuchungssatzFrage, TKontoFrage,
  KontenbestimmungFrage, BilanzERFrage, AufgabengruppeFrage, PDFFrage,
  SortierungFrage, HotspotFrage, BildbeschriftungFrage, AudioFrage,
  DragDropBildFrage, CodeFrage, FormelFrage,
} from '../types/fragen-core'

type FrageTyp = Frage['typ']

// Skalare Defaults — Arrays werden in `baseDefaults()` separat erzeugt, damit jeder
// Mock-Aufruf eigene Array-Instanzen bekommt (kein Shared-Reference-Bug).
const FRAGE_BASE_DEFAULTS: Omit<FrageBase, 'tags' | 'semester' | 'gefaesse' | 'verwendungen' | 'bewertungsraster'> = {
  id: 'test-frage',
  version: 1,
  erstelltAm: new Date(0).toISOString(),
  geaendertAm: new Date(0).toISOString(),
  fachbereich: 'BWL',
  fach: 'Test',
  thema: 'Test',
  bloom: 'K1',
  punkte: 1,
  musterlosung: '',
}

function baseDefaults(): FrageBase {
  return {
    ...FRAGE_BASE_DEFAULTS,
    bewertungsraster: [],
    tags: [],
    semester: [],
    gefaesse: [],
    verwendungen: [],
  }
}

// Defaults validated against fragen-core.ts (29.04.2026). All required fields
// (no `?:`) for each Sub-Type are included with the exact field names from the
// type definitions.
const SUB_DEFAULTS: { [K in FrageTyp]: Omit<Extract<Frage, { typ: K }>, keyof FrageBase | 'typ'> } = {
  mc: { fragetext: 'Test-Frage', optionen: [], mehrfachauswahl: false, zufallsreihenfolge: false } as Omit<MCFrage, keyof FrageBase | 'typ'>,
  freitext: { fragetext: 'Test-Frage', laenge: 'kurz' } as Omit<FreitextFrage, keyof FrageBase | 'typ'>,
  zuordnung: { fragetext: 'Test-Frage', paare: [], zufallsreihenfolge: false } as Omit<ZuordnungFrage, keyof FrageBase | 'typ'>,
  lueckentext: { fragetext: 'Test-Frage', textMitLuecken: '', luecken: [], lueckentextModus: 'freitext' } as Omit<LueckentextFrage, keyof FrageBase | 'typ'>,
  visualisierung: { fragetext: 'Test-Frage', untertyp: 'zeichnen' } as Omit<VisualisierungFrage, keyof FrageBase | 'typ'>,
  richtigfalsch: { fragetext: 'Test-Frage', aussagen: [] } as Omit<RichtigFalschFrage, keyof FrageBase | 'typ'>,
  berechnung: { fragetext: 'Test-Frage', ergebnisse: [], rechenwegErforderlich: false } as Omit<BerechnungFrage, keyof FrageBase | 'typ'>,
  buchungssatz: { geschaeftsfall: 'Test', buchungen: [], kontenauswahl: { modus: 'voll' } } as Omit<BuchungssatzFrage, keyof FrageBase | 'typ'>,
  tkonto: {
    aufgabentext: 'Test',
    konten: [],
    kontenauswahl: { modus: 'voll' },
    bewertungsoptionen: {
      beschriftungSollHaben: false,
      kontenkategorie: false,
      zunahmeAbnahme: false,
      buchungenKorrekt: true,
      saldoKorrekt: true,
    },
  } as Omit<TKontoFrage, keyof FrageBase | 'typ'>,
  kontenbestimmung: {
    aufgabentext: 'Test',
    modus: 'kategorie_bestimmen',
    aufgaben: [],
    kontenauswahl: { modus: 'voll' },
  } as Omit<KontenbestimmungFrage, keyof FrageBase | 'typ'>,
  bilanzstruktur: {
    aufgabentext: 'Test',
    modus: 'bilanz',
    kontenMitSaldi: [],
    loesung: {},
    bewertungsoptionen: {
      seitenbeschriftung: false,
      gruppenbildung: false,
      gruppenreihenfolge: false,
      kontenreihenfolge: false,
      betraegeKorrekt: true,
      zwischentotale: false,
      bilanzsummeOderGewinn: true,
      mehrstufigkeit: false,
    },
  } as Omit<BilanzERFrage, keyof FrageBase | 'typ'>,
  aufgabengruppe: { kontext: 'Test', teilaufgaben: [] } as Omit<AufgabengruppeFrage, keyof FrageBase | 'typ'>,
  pdf: {
    fragetext: 'Test',
    pdfDateiname: 'test.pdf',
    seitenAnzahl: 1,
    erlaubteWerkzeuge: [],
  } as Omit<PDFFrage, keyof FrageBase | 'typ'>,
  sortierung: { fragetext: 'Test', elemente: [], teilpunkte: false } as Omit<SortierungFrage, keyof FrageBase | 'typ'>,
  hotspot: { fragetext: 'Test', bildUrl: '/test.svg', bereiche: [], mehrfachauswahl: false } as Omit<HotspotFrage, keyof FrageBase | 'typ'>,
  bildbeschriftung: { fragetext: 'Test', bildUrl: '/test.svg', beschriftungen: [] } as Omit<BildbeschriftungFrage, keyof FrageBase | 'typ'>,
  audio: { fragetext: 'Test', maxDauerSekunden: 60 } as Omit<AudioFrage, keyof FrageBase | 'typ'>,
  dragdrop_bild: { fragetext: 'Test', bildUrl: '/test.svg', zielzonen: [], labels: [] } as Omit<DragDropBildFrage, keyof FrageBase | 'typ'>,
  code: { fragetext: 'Test', sprache: 'python', starterCode: '' } as Omit<CodeFrage, keyof FrageBase | 'typ'>,
  formel: { fragetext: 'Test', korrekteFormel: '', vergleichsModus: 'exakt' } as Omit<FormelFrage, keyof FrageBase | 'typ'>,
}

/**
 * Erzeugt eine vollständig typisierte Mock-Frage für Tests im Core/Editor-Layer.
 * Defaults sind generisch und deterministisch — Tests setzen nur die test-relevanten
 * Felder via `overrides`.
 *
 * Verwendung: Tests in `packages/shared/src/editor/`. ExamLab-Tests verwenden
 * `mockFrage` aus `ExamLab/src/__tests__/helpers/frageStorageMocks.ts`.
 *
 * Defensive-Tests die `null`/`undefined`/`{}` an typed-Funktionen uebergeben, nutzen
 * `as unknown as Frage` (mit Kommentar) direkt, NICHT diesen Helper.
 */
export function mockCoreFrage<T extends FrageTyp>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }> {
  const base = baseDefaults()
  const subDefaults = SUB_DEFAULTS[typ]
  return {
    ...base,
    ...subDefaults,
    typ,
    ...(overrides ?? {}),
  } as unknown as Extract<Frage, { typ: T }> /* Defensive: TS kann Spread-Result nicht zur diskriminierten Union narrowen */
}
