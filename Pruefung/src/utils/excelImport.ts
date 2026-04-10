/**
 * Excel-Import Utility — parst XLSX-Dateien und konvertiert Zeilen in Frage-Objekte.
 * Lazy-loaded `xlsx` Library (gleich wie backupExport.ts).
 */
import type { Frage, Fachbereich, BloomStufe } from '../types/fragen'
import { generiereFrageId } from '../components/lp/frageneditor/editorUtils'

// --- Spalten-Definition ---

/** Pflichtfelder für einen gültigen Import */
const PFLICHT_SPALTEN = ['typ', 'fachbereich', 'thema', 'bloom', 'punkte', 'fragetext'] as const

/** Alle erkannten Spalten (Header-Zeile) */
const BEKANNTE_SPALTEN = [
  'id', 'typ', 'fachbereich', 'fach', 'thema', 'unterthema', 'bloom', 'punkte',
  'fragetext', 'musterlosung', 'bewertungsraster', 'tags', 'semester', 'gefaesse',
  'schwierigkeit', 'quelle', 'typDaten', 'lernzielIds', 'zeitbedarf',
] as const

const GUELTIGE_TYPEN = new Set([
  'mc', 'freitext', 'lueckentext', 'zuordnung', 'richtigfalsch', 'berechnung',
  'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur', 'aufgabengruppe',
  'visualisierung', 'pdf', 'sortierung', 'hotspot', 'bildbeschriftung',
  'audio', 'dragdrop_bild', 'code', 'formel',
])

const GUELTIGE_FACHBEREICHE = new Set(['VWL', 'BWL', 'Recht', 'Informatik', 'Allgemein'])
const GUELTIGE_BLOOM = new Set(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'])

// --- Typen ---

export interface ImportValidierung {
  status: 'ok' | 'warnung' | 'fehler'
  meldungen: string[]
}

export interface ImportZeile {
  zeilenNr: number
  rohdaten: Record<string, string>
  frage: Frage | null
  validierung: ImportValidierung
  ausgewaehlt: boolean
}

export interface ExcelParseResult {
  sheetNames: string[]
  zeilen: ImportZeile[]
  spaltenMapping: Record<string, string>
  fehler?: string
}

// --- Parsing ---

/** Parst eine XLSX-Datei und gibt die Sheet-Namen + Zeilen zurück */
export async function parseExcelDatei(
  datei: File,
  sheetName?: string
): Promise<ExcelParseResult> {
  const XLSX = await import('xlsx')

  const buffer = await datei.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const sheetNames = wb.SheetNames
  if (sheetNames.length === 0) {
    return { sheetNames: [], zeilen: [], spaltenMapping: {}, fehler: 'Keine Sheets in der Datei gefunden.' }
  }

  const aktuellerSheet = sheetName || sheetNames[0]
  const ws = wb.Sheets[aktuellerSheet]
  if (!ws) {
    return { sheetNames, zeilen: [], spaltenMapping: {}, fehler: `Sheet "${aktuellerSheet}" nicht gefunden.` }
  }

  // Sheet als Array-of-Arrays lesen
  const daten = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
  if (daten.length < 2) {
    return { sheetNames, zeilen: [], spaltenMapping: {}, fehler: 'Sheet enthält keine Daten (min. Header + 1 Zeile).' }
  }

  // Header-Zeile → Spalten-Mapping
  const headerZeile = daten[0].map(h => String(h).trim().toLowerCase())
  const spaltenMapping: Record<string, string> = {}
  for (const [idx, header] of headerZeile.entries()) {
    const normalized = normalisiereHeader(header)
    if (normalized) {
      spaltenMapping[normalized] = String(idx)
    }
  }

  // Pflichtfelder prüfen
  const fehlendePflicht = PFLICHT_SPALTEN.filter(s => !(s in spaltenMapping))
  if (fehlendePflicht.length > 0) {
    return {
      sheetNames,
      zeilen: [],
      spaltenMapping,
      fehler: `Pflichtfelder fehlen in Header-Zeile: ${fehlendePflicht.join(', ')}. Erkannte Spalten: ${Object.keys(spaltenMapping).join(', ') || 'keine'}`
    }
  }

  // Datenzeilen parsen
  const zeilen: ImportZeile[] = []
  for (let i = 1; i < daten.length; i++) {
    const row = daten[i]
    // Leere Zeilen überspringen
    if (!row || row.every(cell => !String(cell).trim())) continue

    const rohdaten: Record<string, string> = {}
    for (const [spalte, idxStr] of Object.entries(spaltenMapping)) {
      const idx = parseInt(idxStr)
      rohdaten[spalte] = String(row[idx] ?? '').trim()
    }

    const { frage, validierung } = parseZeile(rohdaten, i + 1)
    zeilen.push({
      zeilenNr: i + 1,
      rohdaten,
      frage,
      validierung,
      ausgewaehlt: validierung.status !== 'fehler',
    })
  }

  return { sheetNames, zeilen, spaltenMapping }
}

/** Normalisiert einen Header-String auf den internen Spaltennamen */
function normalisiereHeader(header: string): string | null {
  const lower = header.toLowerCase().replace(/[^a-zäöü0-9]/g, '')
  const mapping: Record<string, string> = {
    id: 'id', typ: 'typ', type: 'typ',
    fachbereich: 'fachbereich', fach: 'fach',
    thema: 'thema', topic: 'thema',
    unterthema: 'unterthema', subtopic: 'unterthema',
    bloom: 'bloom', bloomstufe: 'bloom', taxonomie: 'bloom',
    punkte: 'punkte', points: 'punkte', maxpunkte: 'punkte',
    fragetext: 'fragetext', frage: 'fragetext', question: 'fragetext', text: 'fragetext',
    musterlosung: 'musterlosung', musterlsung: 'musterlosung', lsung: 'musterlosung', solution: 'musterlosung',
    bewertungsraster: 'bewertungsraster', rubric: 'bewertungsraster',
    tags: 'tags',
    semester: 'semester',
    gefaesse: 'gefaesse', gefsse: 'gefaesse', container: 'gefaesse',
    schwierigkeit: 'schwierigkeit', difficulty: 'schwierigkeit',
    quelle: 'quelle', source: 'quelle',
    typdaten: 'typDaten', typedata: 'typDaten',
    lernzielids: 'lernzielIds', lernziele: 'lernzielIds',
    zeitbedarf: 'zeitbedarf', time: 'zeitbedarf',
  }
  return mapping[lower] ?? (BEKANNTE_SPALTEN.includes(lower as typeof BEKANNTE_SPALTEN[number]) ? lower : null)
}

/** Parst eine einzelne Zeile in ein Frage-Objekt mit Validierung */
function parseZeile(
  daten: Record<string, string>,
  zeilenNr: number
): { frage: Frage | null; validierung: ImportValidierung } {
  void zeilenNr // wird für zukünftige Fehlermeldungen gebraucht
  const meldungen: string[] = []
  let hatFehler = false

  // Pflichtfelder
  const typ = daten.typ?.toLowerCase() || ''
  const fachbereich = daten.fachbereich || ''
  const thema = daten.thema || ''
  const bloom = daten.bloom?.toUpperCase() || ''
  const punkteStr = daten.punkte || ''
  const fragetext = daten.fragetext || ''

  if (!typ) { meldungen.push('Typ fehlt'); hatFehler = true }
  else if (!GUELTIGE_TYPEN.has(typ)) { meldungen.push(`Unbekannter Typ: ${typ}`); hatFehler = true }

  if (!fachbereich) { meldungen.push('Fachbereich fehlt'); hatFehler = true }
  else if (!GUELTIGE_FACHBEREICHE.has(fachbereich)) { meldungen.push(`Ungültiger Fachbereich: ${fachbereich}`); hatFehler = true }

  if (!thema) { meldungen.push('Thema fehlt'); hatFehler = true }
  if (!bloom) { meldungen.push('Bloom fehlt'); hatFehler = true }
  else if (!GUELTIGE_BLOOM.has(bloom)) { meldungen.push(`Ungültige Bloom-Stufe: ${bloom}`); hatFehler = true }

  const punkte = parseFloat(punkteStr)
  if (!punkteStr || isNaN(punkte)) { meldungen.push('Punkte ungültig'); hatFehler = true }

  if (!fragetext) { meldungen.push('Fragetext fehlt'); hatFehler = true }

  if (hatFehler) {
    return { frage: null, validierung: { status: 'fehler', meldungen } }
  }

  // ID: Benutzer-ID oder auto-generiert
  const id = daten.id || generiereFrageId(fachbereich, typ)
  if (!daten.id) meldungen.push('ID automatisch generiert')

  // Optionale Felder
  const semester = parseKommaListe(daten.semester)
  const gefaesse = parseKommaListe(daten.gefaesse)
  const tags = parseKommaListe(daten.tags)
  const lernzielIds = parseKommaListe(daten.lernzielIds)
  const schwierigkeit = daten.schwierigkeit ? parseFloat(daten.schwierigkeit) : undefined
  const zeitbedarf = daten.zeitbedarf ? parseFloat(daten.zeitbedarf) : undefined

  // JSON-Felder
  const bewertungsraster = parseJsonFeld(daten.bewertungsraster, [])
  const typDaten = parseJsonFeld(daten.typDaten, null)

  const jetzt = new Date().toISOString()

  // Basis-Frage zusammenbauen
  const basis = {
    id,
    version: 1,
    erstelltAm: jetzt,
    geaendertAm: jetzt,
    fachbereich: fachbereich as Fachbereich,
    fach: daten.fach || fachbereich,
    thema,
    unterthema: daten.unterthema || undefined,
    semester: semester.length > 0 ? semester : [],
    gefaesse: gefaesse.length > 0 ? gefaesse : ['SF'],
    bloom: bloom as BloomStufe,
    tags,
    punkte,
    musterlosung: daten.musterlosung || '',
    bewertungsraster,
    verwendungen: [],
    quelle: (daten.quelle || 'manuell') as 'pool' | 'papier' | 'manuell' | 'ki-generiert',
    geteilt: 'privat' as const,
    schwierigkeit,
    zeitbedarf,
    lernzielIds: lernzielIds.length > 0 ? lernzielIds : undefined,
  }

  // Typ-spezifische Felder (aus typDaten oder Defaults)
  const frage = baueFrage(typ, basis, fragetext, typDaten)

  if (meldungen.length > 0) {
    return { frage, validierung: { status: 'warnung', meldungen } }
  }
  return { frage, validierung: { status: 'ok', meldungen: [] } }
}

/** Baut ein vollständiges Frage-Objekt je nach Typ */
function baueFrage(
  typ: string,
  basis: Record<string, unknown>,
  fragetext: string,
  typDaten: Record<string, unknown> | null
): Frage {
  const td = typDaten || {}

  switch (typ) {
    case 'mc':
      return {
        ...basis, typ: 'mc', fragetext,
        optionen: (td.optionen as unknown[]) ?? [],
        mehrfachauswahl: (td.mehrfachauswahl as boolean) ?? false,
        zufallsreihenfolge: (td.zufallsreihenfolge as boolean) ?? true,
      } as Frage
    case 'freitext':
      return {
        ...basis, typ: 'freitext', fragetext,
        laenge: (td.laenge as string) ?? 'mittel',
      } as Frage
    case 'lueckentext':
      return {
        ...basis, typ: 'lueckentext', fragetext,
        textMitLuecken: (td.textMitLuecken as string) ?? fragetext,
        luecken: (td.luecken as unknown[]) ?? [],
      } as Frage
    case 'zuordnung':
      return {
        ...basis, typ: 'zuordnung', fragetext,
        paare: (td.paare as unknown[]) ?? [],
        zufallsreihenfolge: (td.zufallsreihenfolge as boolean) ?? true,
      } as Frage
    case 'richtigfalsch':
      return {
        ...basis, typ: 'richtigfalsch', fragetext,
        aussagen: (td.aussagen as unknown[]) ?? [],
      } as Frage
    case 'berechnung':
      return {
        ...basis, typ: 'berechnung', fragetext,
        ergebnisse: (td.ergebnisse as unknown[]) ?? [{
          id: '1', label: 'Ergebnis',
          korrekt: (td.korrekteAntwort as number) ?? 0,
          toleranz: (td.toleranz as number) ?? 0,
          einheit: (td.einheit as string) ?? '',
        }],
        rechenwegErforderlich: (td.rechenwegErforderlich as boolean) ?? false,
      } as Frage
    default:
      // Alle anderen Typen: fragetext + typDaten direkt mergen
      return {
        ...basis, typ, fragetext, ...td,
      } as Frage
  }
}

// --- Hilfsfunktionen ---

function parseKommaListe(wert: string | undefined): string[] {
  if (!wert) return []
  return wert.split(',').map(s => s.trim()).filter(Boolean)
}

function parseJsonFeld<T>(wert: string | undefined, fallback: T): T {
  if (!wert) return fallback
  try {
    return JSON.parse(wert)
  } catch {
    return fallback
  }
}

// --- Template-Export ---

/** Erzeugt eine leere XLSX-Vorlage mit korrekten Headers + Beispielzeile */
export async function exportiereVorlage(): Promise<void> {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const headers = [
    'typ', 'fachbereich', 'fach', 'thema', 'unterthema', 'bloom', 'punkte',
    'fragetext', 'musterlosung', 'tags', 'semester', 'gefaesse', 'schwierigkeit',
    'quelle', 'typDaten', 'lernzielIds', 'zeitbedarf',
  ]

  const beispiel = [
    'mc', 'VWL', 'VWL', 'Markt & Preisbildung', 'Angebot und Nachfrage', 'K2', '2',
    'Was passiert mit dem Gleichgewichtspreis, wenn die Nachfrage steigt?',
    'Der Gleichgewichtspreis steigt.',
    'Markt, Preisbildung', 'H1, H2', 'SF', '',
    'manuell',
    '{"optionen":[{"id":"a","text":"Der Preis steigt","korrekt":true},{"id":"b","text":"Der Preis sinkt","korrekt":false},{"id":"c","text":"Der Preis bleibt gleich","korrekt":false}],"mehrfachauswahl":false,"zufallsreihenfolge":true}',
    '', '3',
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, beispiel])

  // Spaltenbreiten
  ws['!cols'] = headers.map(h => ({ wch: h === 'fragetext' || h === 'typDaten' ? 50 : h === 'musterlosung' ? 30 : 15 }))

  XLSX.utils.book_append_sheet(wb, ws, 'Fragen')

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ExamLab_Import_Vorlage.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
