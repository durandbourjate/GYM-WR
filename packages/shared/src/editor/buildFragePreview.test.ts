import { describe, it, expect } from 'vitest'
import { buildFragePreview } from './buildFragePreview'
import type {
  MCFrage,
  FreitextFrage,
  LueckentextFrage,
  ZuordnungFrage,
  RichtigFalschFrage,
  BerechnungFrage,
  BuchungssatzFrage,
  TKontoFrage,
  KontenbestimmungFrage,
  BilanzERFrage,
  HotspotFrage,
  BildbeschriftungFrage,
  DragDropBildFrage,
  SortierungFrage,
  AufgabengruppeFrage,
  VisualisierungFrage,
  PDFFrage,
  CodeFrage,
  FormelFrage,
} from '../types/fragen-core'

describe('buildFragePreview', () => {
  it('mc: legt optionen + mehrfachauswahl an basis ab', () => {
    const f = buildFragePreview({
      typ: 'mc',
      fragetext: 'Q',
      optionen: [{ id: 'a', text: 'A', korrekt: true }],
      mehrfachauswahl: false,
    }) as unknown as MCFrage
    expect(f.typ).toBe('mc')
    expect(f.fragetext).toBe('Q')
    expect(f.optionen).toHaveLength(1)
    expect(f.mehrfachauswahl).toBe(false)
  })

  it('freitext: legt musterlosung + bewertungsraster ab', () => {
    const f = buildFragePreview({
      typ: 'freitext',
      fragetext: 'Erklären Sie',
      musterlosung: 'Antwort',
      bewertungsraster: [{ beschreibung: 'X', punkte: 1 }],
    }) as unknown as FreitextFrage
    expect(f.typ).toBe('freitext')
    expect(f.musterlosung).toBe('Antwort')
    expect(f.bewertungsraster).toHaveLength(1)
  })

  it('lueckentext: legt textMitLuecken + luecken + lueckentextModus ab', () => {
    const f = buildFragePreview({
      typ: 'lueckentext',
      fragetext: 'Text',
      textMitLuecken: 'Hallo {{1}}',
      luecken: [{ id: '1', korrekteAntworten: ['Welt'] }],
      lueckentextModus: 'freitext',
    }) as unknown as LueckentextFrage
    expect(f.typ).toBe('lueckentext')
    expect(f.textMitLuecken).toBe('Hallo {{1}}')
    expect(f.luecken).toHaveLength(1)
    expect(f.lueckentextModus).toBe('freitext')
  })

  it('zuordnung: legt paare ab', () => {
    const f = buildFragePreview({
      typ: 'zuordnung',
      fragetext: 'Ordne zu',
      paare: [{ links: 'L', rechts: 'R' }],
    }) as unknown as ZuordnungFrage
    expect(f.typ).toBe('zuordnung')
    expect(f.paare).toHaveLength(1)
  })

  it('richtigfalsch: legt aussagen ab', () => {
    const f = buildFragePreview({
      typ: 'richtigfalsch',
      fragetext: 'R/F',
      aussagen: [{ id: '1', text: 'X', korrekt: true }],
    }) as unknown as RichtigFalschFrage
    expect(f.typ).toBe('richtigfalsch')
    expect(f.aussagen).toHaveLength(1)
  })

  it('berechnung: legt ergebnisse ab', () => {
    const f = buildFragePreview({
      typ: 'berechnung',
      fragetext: 'Rechnung',
      ergebnisse: [{ id: '1', label: 'E', korrekt: 42, toleranz: 0 }],
    }) as unknown as BerechnungFrage
    expect(f.typ).toBe('berechnung')
    expect(f.ergebnisse).toHaveLength(1)
  })

  it('buchungssatz: nutzt geschaeftsfall als fragetext + legt buchungen ab', () => {
    const f = buildFragePreview({
      typ: 'buchungssatz',
      fragetext: 'irrelevant',
      geschaeftsfall: 'GF-Text',
      buchungen: [{ id: '1', sollKonto: '1000', habenKonto: '2000', betrag: 100 }],
    }) as unknown as BuchungssatzFrage & { fragetext: string }
    expect(f.typ).toBe('buchungssatz')
    expect(f.fragetext).toBe('GF-Text')
    expect(f.geschaeftsfall).toBe('GF-Text')
    expect(f.buchungen).toHaveLength(1)
  })

  it('tkonto: mappt tkAufgabentext → aufgabentext und tkKonten → konten', () => {
    const f = buildFragePreview({
      typ: 'tkonto',
      fragetext: '',
      tkAufgabentext: 'TK-Aufgabe',
      tkKonten: [{ id: '1', kontonummer: '1000' }],
    }) as unknown as TKontoFrage
    expect(f.typ).toBe('tkonto')
    expect(f.aufgabentext).toBe('TK-Aufgabe')
    expect(f.konten).toHaveLength(1)
  })

  it('kontenbestimmung: mappt kbAufgabentext → aufgabentext und kbAufgaben → aufgaben', () => {
    const f = buildFragePreview({
      typ: 'kontenbestimmung',
      fragetext: '',
      kbAufgabentext: 'KB-Aufgabe',
      kbAufgaben: [{ id: '1', text: 'X', erwarteteAntworten: [] }],
    }) as unknown as KontenbestimmungFrage
    expect(f.typ).toBe('kontenbestimmung')
    expect(f.aufgabentext).toBe('KB-Aufgabe')
    expect(f.aufgaben).toHaveLength(1)
  })

  it('bilanzstruktur: mappt biAufgabentext → aufgabentext und biKontenMitSaldi → kontenMitSaldi', () => {
    const f = buildFragePreview({
      typ: 'bilanzstruktur',
      fragetext: '',
      biAufgabentext: 'BI-Aufgabe',
      biKontenMitSaldi: [{ kontonummer: '1000', saldo: 100 }],
    }) as unknown as BilanzERFrage
    expect(f.typ).toBe('bilanzstruktur')
    expect(f.aufgabentext).toBe('BI-Aufgabe')
    expect(f.kontenMitSaldi).toHaveLength(1)
  })

  it('hotspot: legt bild + bereiche ab', () => {
    const f = buildFragePreview({
      typ: 'hotspot',
      fragetext: 'Klicke',
      bildUrl: 'img/x.png',
      hsBereiche: [{ id: '1', x: 10, y: 10, radius: 5 }],
    }) as unknown as HotspotFrage
    expect(f.typ).toBe('hotspot')
    expect(f.bild).toBeTruthy()
    expect(f.bereiche).toHaveLength(1)
  })

  it('hotspot: schreibt zusätzlich bild: MediaQuelle aus bildUrl (Phase 6.b Dual-Write)', () => {
    const f = buildFragePreview({
      typ: 'hotspot',
      fragetext: 'q',
      bildUrl: 'img/foo.svg',
      hsBereiche: [],
    }) as unknown as HotspotFrage
    expect(f.bild).toEqual({ typ: 'pool', poolPfad: 'img/foo.svg', mimeType: 'image/svg+xml' })
  })

  it('bildbeschriftung: legt bild + beschriftungen ab', () => {
    const f = buildFragePreview({
      typ: 'bildbeschriftung',
      fragetext: 'Beschrifte',
      bildUrl: 'img/x.png',
      bbBeschriftungen: [{ id: '1', text: 'A', x: 0, y: 0 }],
    }) as unknown as BildbeschriftungFrage
    expect(f.typ).toBe('bildbeschriftung')
    expect(f.bild).toBeTruthy()
    expect(f.beschriftungen).toHaveLength(1)
  })

  it('dragdrop_bild: legt bild + zielzonen + labels ab', () => {
    const f = buildFragePreview({
      typ: 'dragdrop_bild',
      fragetext: 'Ziehe',
      bildUrl: 'img/x.png',
      ddZielzonen: [{ id: 'z1', korrektesLabel: 'A' }],
      ddLabels: [{ id: 'l1', text: 'A' }],
    }) as unknown as DragDropBildFrage
    expect(f.typ).toBe('dragdrop_bild')
    expect(f.bild).toBeTruthy()
    expect(f.zielzonen).toHaveLength(1)
    expect(f.labels).toHaveLength(1)
  })

  it('sortierung: legt elemente ab', () => {
    const f = buildFragePreview({
      typ: 'sortierung',
      fragetext: 'Sortiere',
      sortElemente: ['A', 'B', 'C'],
    }) as unknown as SortierungFrage
    expect(f.typ).toBe('sortierung')
    expect(f.elemente).toEqual(['A', 'B', 'C'])
  })

  it('aufgabengruppe: mappt agKontext → kontext und agTeilaufgaben → teilaufgaben', () => {
    const f = buildFragePreview({
      typ: 'aufgabengruppe',
      fragetext: '',
      agKontext: 'Kontext',
      agTeilaufgaben: [{ id: '1', frage: 'X' }],
    }) as unknown as AufgabengruppeFrage
    expect(f.typ).toBe('aufgabengruppe')
    expect(f.kontext).toBe('Kontext')
    expect(f.teilaufgaben).toHaveLength(1)
  })

  it('visualisierung: legt canvasConfig ab', () => {
    const cfg = { breite: 800, hoehe: 600, werkzeuge: ['stift'] }
    const f = buildFragePreview({
      typ: 'visualisierung',
      fragetext: 'Zeichne',
      canvasConfig: cfg,
    }) as unknown as VisualisierungFrage
    expect(f.typ).toBe('visualisierung')
    expect(f.canvasConfig).toBe(cfg)
  })

  it('pdf: legt pdf + erlaubteWerkzeuge ab', () => {
    const f = buildFragePreview({
      typ: 'pdf',
      fragetext: 'PDF',
      pdfDriveFileId: 'abc',
      pdfUrl: 'https://x.pdf',
      pdfBase64: '',
      pdfErlaubteWerkzeuge: ['highlighter'],
    }) as unknown as PDFFrage
    expect(f.typ).toBe('pdf')
    expect(f.pdf).toEqual({ typ: 'drive', driveFileId: 'abc', mimeType: 'application/pdf', dateiname: undefined })
    expect(f.erlaubteWerkzeuge).toEqual(['highlighter'])
  })

  it('pdf: schreibt zusätzlich pdf: MediaQuelle aus pdfDriveFileId (Phase 6.b Dual-Write)', () => {
    const f = buildFragePreview({
      typ: 'pdf',
      fragetext: 'q',
      pdfDriveFileId: 'fileXYZ',
      pdfErlaubteWerkzeuge: ['highlighter'],
    }) as unknown as PDFFrage
    expect(f.pdf).toEqual({ typ: 'drive', driveFileId: 'fileXYZ', mimeType: 'application/pdf', dateiname: undefined })
  })

  it('code: mappt codeSprache → sprache und codeMusterLoesungCode → musterLoesung', () => {
    const f = buildFragePreview({
      typ: 'code',
      fragetext: 'Schreibe',
      codeSprache: 'python',
      codeMusterLoesungCode: 'print("hi")',
    }) as unknown as CodeFrage
    expect(f.typ).toBe('code')
    expect(f.sprache).toBe('python')
    expect(f.musterLoesung).toBe('print("hi")')
  })

  it('formel: mappt formelKorrekteFormel → korrekteFormel', () => {
    const f = buildFragePreview({
      typ: 'formel',
      fragetext: 'Formel',
      formelKorrekteFormel: 'a^2+b^2',
    }) as unknown as FormelFrage
    expect(f.typ).toBe('formel')
    expect(f.korrekteFormel).toBe('a^2+b^2')
  })

  it('id default: "preview" wenn nicht übergeben', () => {
    const f = buildFragePreview({ typ: 'mc', fragetext: 'Q' }) as unknown as MCFrage
    expect(f.id).toBe('preview')
  })

  it('id explizit: durchgereicht', () => {
    const f = buildFragePreview({ id: 'q-42', typ: 'mc', fragetext: 'Q' }) as unknown as MCFrage
    expect(f.id).toBe('q-42')
  })

  it('unbekannter typ: nur basis (id, typ, fragetext)', () => {
    // Defensive: Test prüft Verhalten bei nicht-konformem `typ` (default-Branch in buildFragePreview).
    const f = buildFragePreview({ typ: 'unbekannt', fragetext: 'X' }) as unknown as {
      typ: string
      fragetext: string
      id: string
      optionen?: unknown
      luecken?: unknown
    }
    expect(f.typ).toBe('unbekannt')
    expect(f.fragetext).toBe('X')
    // Keine typ-spezifischen Felder
    expect(f.optionen).toBeUndefined()
    expect(f.luecken).toBeUndefined()
  })
})
