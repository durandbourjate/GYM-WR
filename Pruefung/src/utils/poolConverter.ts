// Pruefung/src/utils/poolConverter.ts
// Konvertiert Pool-Frageformate ins ExamLab-Format

import type { PoolFrage, PoolMeta, PoolTopic, PoolFrageSnapshot } from '../types/pool'
import type {
  Frage,
  FrageAnhang,
  Fachbereich,
  BloomStufe,
  MCFrage,
  FreitextFrage,
  ZuordnungFrage,
  LueckentextFrage,
  RichtigFalschFrage,
  BerechnungFrage,
  SortierungFrage,
  FormelFrage,
  HotspotFrage,
  HotspotBereich,
  BildbeschriftungFrage,
  DragDropBildFrage,
  CodeFrage,
  VisualisierungFrage,
  BilanzERFrage,
  AufgabengruppeFrage,
  BuchungssatzFrage,
  TKontoFrage,
  KontenbestimmungFrage,
} from '../types/fragen'

const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

// === HILFSFUNKTIONEN ===

/** Mappt den Pool-Fach-String auf einen Fachbereich-Enum */
export function mapFachbereich(fach: string): Fachbereich {
  const f = fach.toLowerCase().trim()
  if (f.includes('vwl') || f.includes('volkswirt')) return 'VWL'
  if (f.includes('bwl') || f.includes('betriebswirt')) return 'BWL'
  if (f.includes('recht') || f.includes('law')) return 'Recht'
  // "W&R" / "WR" / "Wirtschaft und Recht" — kein eindeutiger Fachbereich, Default BWL
  if (f === 'w&r' || f === 'wr' || f === 'wirtschaft und recht' || f === 'wirtschaft & recht') return 'BWL'
  // Informatik: exakt matchen (nicht 'in' allein, das matched z.B. "Einfuehrung")
  if (f === 'in' || f === 'informatik' || f.startsWith('info')) return 'Informatik'
  // Fallback: Allgemein (nicht VWL — das wäre irreführend)
  return 'Allgemein'
}

/** Mappt die Pool-Taxonomie (K1–K6 oder Bloom-Namen) auf BloomStufe */
export function mapBloom(tax: string): BloomStufe {
  const t = tax.trim().toUpperCase()
  if (t === 'K1' || t === 'ERINNERN' || t === 'WISSEN') return 'K1'
  if (t === 'K2' || t === 'VERSTEHEN' || t === 'VERSTEHEN') return 'K2'
  if (t === 'K3' || t === 'ANWENDEN') return 'K3'
  if (t === 'K4' || t === 'ANALYSIEREN' || t === 'ANALYSE') return 'K4'
  if (t === 'K5' || t === 'BEWERTEN' || t === 'EVALUATION') return 'K5'
  if (t === 'K6' || t === 'ERSCHAFFEN' || t === 'SYNTHETISIEREN') return 'K6'
  // Fallback: K2
  return 'K2'
}

/** Berechnet die Standardpunktzahl für einen Fragetyp */
export function berechnePunkte(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc':
      return 1
    case 'tf':
      return 1
    case 'multi':
      return 2
    case 'fill':
      return pf.blanks?.length ?? 1
    case 'calc':
      return (pf.rows?.length ?? 1) * 2
    case 'sort':
      return Math.ceil((pf.items?.length ?? 2) / 2)
    case 'open':
      return 4
    case 'sortierung':
      return Math.max(2, (pf.items?.length ?? 3))
    case 'formel':
      return 2
    case 'hotspot':
      return pf.hotspots?.length ?? 1
    case 'bildbeschriftung':
      return pf.labels?.length ?? 2
    case 'dragdrop_bild':
      return pf.labels?.length ?? 2
    case 'code':
      return 4
    case 'zeichnen':
      return 3
    case 'buchungssatz':
      return ((pf as any).correct?.length ?? 1) * 2
    case 'tkonto':
      return ((pf as any).geschaeftsfaelle?.length ?? 1) * 2
    case 'kontenbestimmung':
      return ((pf as any).aufgaben?.length ?? 1) * 2
    case 'bilanz':
      return ((pf as any).kontenMitSaldi?.length ?? 4)
    case 'gruppe':
      return ((pf as any).teil?.length ?? 1) * 2
    default:
      return 1
  }
}

/** Schätzt den Zeitbedarf in Minuten für eine Pool-Frage */
export function schaetzeZeitbedarf(pf: PoolFrage): number {
  switch (pf.type) {
    case 'mc':
      return 1
    case 'tf':
      return 1
    case 'multi':
      return 2
    case 'fill':
      return Math.max(1, Math.ceil((pf.blanks?.length ?? 1) * 0.5))
    case 'calc':
      return (pf.rows?.length ?? 1) * 3
    case 'sort':
      return Math.max(1, Math.ceil((pf.items?.length ?? 2) * 0.5))
    case 'open':
      return 5
    case 'sortierung':
      return Math.max(2, (pf.items?.length ?? 3))
    case 'formel':
      return 3
    case 'hotspot':
      return 2
    case 'bildbeschriftung':
      return Math.max(2, (pf.labels?.length ?? 2))
    case 'dragdrop_bild':
      return Math.max(2, (pf.labels?.length ?? 2))
    case 'code':
      return 5
    case 'zeichnen':
      return 4
    case 'buchungssatz':
      return ((pf as any).correct?.length ?? 1) * 3
    case 'tkonto':
      return ((pf as any).geschaeftsfaelle?.length ?? 1) * 3
    case 'kontenbestimmung':
      return ((pf as any).aufgaben?.length ?? 1) * 2
    case 'bilanz':
      return 5
    case 'gruppe':
      return ((pf as any).teil?.length ?? 1) * 3
    default:
      return 2
  }
}

/** Erzeugt eine UUID v4 (kryptografisch einfach, ohne externe Abhängigkeit) */
function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Erstellt das ISO-Datum für jetzt */
function jetzt(): string {
  return new Date().toISOString()
}

/** Konvertiert ein Pool-Bild zu einem FrageAnhang mit externeUrl */
export function konvertierePoolBild(img: { src: string; alt?: string }): FrageAnhang {
  const dateiname = img.src.split('/').pop() || 'bild.svg'
  const ext = dateiname.split('.').pop()?.toLowerCase() || 'svg'
  const mimeMap: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' }
  return {
    id: `pool-img-${genId().slice(0, 8)}`,
    dateiname,
    mimeType: mimeMap[ext] || 'image/svg+xml',
    groesseBytes: 0,
    driveFileId: '',
    beschreibung: img.alt || '',
    externeUrl: POOL_IMG_BASE_URL + img.src,
  }
}

// === SNAPSHOT ===

/**
 * Erzeugt einen PoolFrageSnapshot für Änderungserkennung.
 * Wird beim Import und beim Update-Vergleich verwendet.
 */
export function erzeugeSnapshot(poolFrage: PoolFrage): PoolFrageSnapshot {
  const snapshot: PoolFrageSnapshot = {
    fragetext: poolFrage.q,
    typ: poolFrage.type,
    bloom: poolFrage.tax || 'K2',
    schwierigkeit: poolFrage.diff || 2,
  }

  if (poolFrage.options !== undefined) snapshot.optionen = poolFrage.options
  if (poolFrage.correct !== undefined) snapshot.korrekt = poolFrage.correct
  if (poolFrage.explain !== undefined) snapshot.erklaerung = poolFrage.explain
  if (poolFrage.sample !== undefined) snapshot.musterlosung = poolFrage.sample

  // Typ-spezifische Felder
  if (poolFrage.type === 'fill' && poolFrage.blanks !== undefined) {
    snapshot.spezifisch = poolFrage.blanks
  } else if (poolFrage.type === 'calc' && poolFrage.rows !== undefined) {
    snapshot.spezifisch = poolFrage.rows
  } else if (poolFrage.type === 'sort') {
    snapshot.spezifisch = { categories: poolFrage.categories, items: poolFrage.items }
  } else if (poolFrage.type === 'sortierung') {
    snapshot.spezifisch = { items: poolFrage.items, correct: poolFrage.correct }
  } else if (poolFrage.type === 'hotspot') {
    snapshot.spezifisch = { hotspots: poolFrage.hotspots, correct: poolFrage.correct }
  } else if (poolFrage.type === 'bildbeschriftung') {
    snapshot.spezifisch = { labels: poolFrage.labels }
  } else if (poolFrage.type === 'dragdrop_bild') {
    snapshot.spezifisch = { zones: poolFrage.zones, labels: poolFrage.labels }
  } else if (poolFrage.type === 'formel') {
    snapshot.spezifisch = { correct: poolFrage.correct, hints: poolFrage.hints }
  } else if (poolFrage.type === 'code') {
    snapshot.spezifisch = { sprache: poolFrage.sprache, starterCode: poolFrage.starterCode }
  }

  return snapshot
}

// === HAUPTKONVERTIERUNG ===

/**
 * Konvertiert eine Pool-Frage ins ExamLab-Format.
 *
 * @param poolFrage  - Die Rohfrage aus dem Pool
 * @param poolMeta   - Pool-Metadaten (id, title, fach)
 * @param topics     - Topic-Map für Thema-Lookup
 * @param lernzielIds - Zugeordnete Lernziel-IDs (vom Caller)
 * @returns          Fertige Frage im ExamLab-Format
 */
export function konvertierePoolFrage(
  poolFrage: PoolFrage,
  poolMeta: PoolMeta,
  topics: Record<string, PoolTopic>,
  lernzielIds: string[] = [],
): Frage {
  const now = jetzt()
  const topic = topics[poolFrage.topic]
  // Pool-Titel = Thema, Topic-Label = Unterthema
  const thema = poolMeta.title || topic?.label || poolFrage.topic
  const unterthema = topic?.label ?? poolFrage.topic

  // Basis-Felder die alle konvertierten Fragen teilen
  const basis = {
    id: genId(),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,

    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
    unterthema,
    semester: [] as string[],
    gefaesse: [] as string[],

    bloom: mapBloom(poolFrage.tax),
    tags: [poolFrage.topic, `diff:${poolFrage.diff}`],

    punkte: berechnePunkte(poolFrage),
    musterlosung: poolFrage.explain ?? poolFrage.sample ?? '',
    bewertungsraster: [] as import('../types/fragen').Bewertungskriterium[],

    schwierigkeit: poolFrage.diff,
    verwendungen: [] as import('../types/fragen').Verwendung[],

    zeitbedarf: schaetzeZeitbedarf(poolFrage),

    // Herkunft
    quelle: 'pool' as const,
    quellReferenz: `Pool: ${poolMeta.title}`,

    // Sharing — Pool-Fragen sind für alle LP sichtbar
    autor: 'pool-import',
    geteilt: 'schule' as const,

    // Pool-Sync Felder
    poolId: `${poolMeta.id}:${poolFrage.id}`,
    poolGeprueft: poolFrage.reviewed ?? false,
    pruefungstauglich: false,
    poolContentHash: '',
    poolUpdateVerfuegbar: false,
    lernzielIds,

    // Pool-Bilder als Anhänge
    ...(poolFrage.img ? { anhaenge: [konvertierePoolBild(poolFrage.img)] } : {}),
  }

  switch (poolFrage.type) {
    // -------------------------------------------------------
    // mc → MCFrage (einzeln, mehrfachauswahl: false)
    // -------------------------------------------------------
    case 'mc': {
      const optionen = (poolFrage.options ?? []).map((opt) => ({
        id: genId(),
        text: opt.t,
        korrekt: opt.v === poolFrage.correct,
        feedback: undefined as string | undefined,
      }))
      const frage: MCFrage = {
        ...basis,
        typ: 'mc',
        fragetext: poolFrage.q,
        optionen,
        mehrfachauswahl: false,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // multi → MCFrage (mehrfach, mehrfachauswahl: true)
    // -------------------------------------------------------
    case 'multi': {
      const korrektSet = new Set(
        Array.isArray(poolFrage.correct) ? (poolFrage.correct as string[]) : [],
      )
      const optionen = (poolFrage.options ?? []).map((opt) => ({
        id: genId(),
        text: opt.t,
        korrekt: korrektSet.has(opt.v),
        feedback: undefined as string | undefined,
      }))
      const frage: MCFrage = {
        ...basis,
        typ: 'mc',
        fragetext: poolFrage.q,
        optionen,
        mehrfachauswahl: true,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // tf → RichtigFalschFrage (einzelne Aussage aus q + correct)
    // -------------------------------------------------------
    case 'tf': {
      const frage: RichtigFalschFrage = {
        ...basis,
        typ: 'richtigfalsch',
        fragetext: poolFrage.q,
        aussagen: [
          {
            id: genId(),
            text: poolFrage.q,
            korrekt: poolFrage.correct === true,
            erklaerung: poolFrage.explain,
          },
        ],
      }
      return frage
    }

    // -------------------------------------------------------
    // fill → LueckentextFrage
    // blanks.answer + blanks.alts → korrekteAntworten
    // -------------------------------------------------------
    case 'fill': {
      const luecken = (poolFrage.blanks ?? []).map((blank) => ({
        id: genId(),
        korrekteAntworten: [blank.answer, ...(blank.alts ?? [])],
        caseSensitive: false,
      }))
      const frage: LueckentextFrage = {
        ...basis,
        typ: 'lueckentext',
        fragetext: poolFrage.q,
        textMitLuecken: poolFrage.q,
        luecken,
      }
      return frage
    }

    // -------------------------------------------------------
    // calc → BerechnungFrage
    // rows → ergebnisse (answer→korrekt, tolerance→toleranz, unit→einheit)
    // -------------------------------------------------------
    case 'calc': {
      const ergebnisse = (poolFrage.rows ?? []).map((row) => ({
        id: genId(),
        label: row.label,
        korrekt: row.answer,
        toleranz: row.tolerance,
        einheit: row.unit,
      }))
      const frage: BerechnungFrage = {
        ...basis,
        typ: 'berechnung',
        fragetext: poolFrage.q,
        ergebnisse,
        rechenwegErforderlich: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // sort → ZuordnungFrage
    // items × categories → paare (item.t = links, categories[item.cat] = rechts)
    // -------------------------------------------------------
    case 'sort': {
      const cats = poolFrage.categories ?? []
      const paare = (poolFrage.items ?? []).map((item) => {
        if (typeof item === 'string') return { links: item, rechts: '' }
        return { links: item.t, rechts: cats[item.cat] ?? '' }
      })
      const frage: ZuordnungFrage = {
        ...basis,
        typ: 'zuordnung',
        fragetext: poolFrage.q,
        paare,
        zufallsreihenfolge: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // open → FreitextFrage (sample → musterlosung)
    // -------------------------------------------------------
    case 'open': {
      const frage: FreitextFrage = {
        ...basis,
        // Überschreibe musterlosung mit sample (falls vorhanden)
        musterlosung: poolFrage.sample ?? poolFrage.explain ?? '',
        typ: 'freitext',
        fragetext: poolFrage.q,
        laenge: berechnePunkte(poolFrage) <= 2 ? 'kurz' : berechnePunkte(poolFrage) <= 4 ? 'mittel' : 'lang',
      }
      return frage
    }

    // -------------------------------------------------------
    // sortierung → SortierungFrage
    // items: string[] in korrekter Reihenfolge
    // -------------------------------------------------------
    case 'sortierung': {
      // items können als string[] oder {t,cat}[] kommen — normalisieren
      const elemente = (poolFrage.items ?? []).map(item =>
        typeof item === 'string' ? item : item.t
      )
      const frage: SortierungFrage = {
        ...basis,
        typ: 'sortierung',
        fragetext: poolFrage.q,
        elemente,
        teilpunkte: true,
      }
      return frage
    }

    // -------------------------------------------------------
    // formel → FormelFrage (LaTeX-basiert)
    // -------------------------------------------------------
    case 'formel': {
      const frage: FormelFrage = {
        ...basis,
        typ: 'formel',
        fragetext: poolFrage.q,
        korrekteFormel: (typeof poolFrage.correct === 'string' ? poolFrage.correct : '') || '',
        vergleichsModus: 'exakt',
      }
      return frage
    }

    // -------------------------------------------------------
    // hotspot → HotspotFrage
    // hotspots[].{x,y,r,label} + correct: number[] (Indices)
    // -------------------------------------------------------
    case 'hotspot': {
      const korrektIndices = new Set(
        Array.isArray(poolFrage.correct) ? (poolFrage.correct as number[]) : []
      )
      const bereiche: HotspotBereich[] = (poolFrage.hotspots ?? []).map((hs, idx) => ({
        id: genId(),
        form: 'kreis' as const,
        koordinaten: {
          x: hs.x,
          y: hs.y,
          radius: hs.r ?? 8,
        },
        label: hs.label || `Bereich ${idx + 1}`,
        punkte: korrektIndices.has(idx) ? 1 : 0,
      }))
      const bildUrl = poolFrage.img ? POOL_IMG_BASE_URL + poolFrage.img.src : ''
      const frage: HotspotFrage = {
        ...basis,
        typ: 'hotspot',
        fragetext: poolFrage.q,
        bildUrl,
        bereiche,
        mehrfachauswahl: korrektIndices.size > 1,
      }
      return frage
    }

    // -------------------------------------------------------
    // bildbeschriftung → BildbeschriftungFrage
    // labels[].{id,text,x,y} → beschriftungen
    // -------------------------------------------------------
    case 'bildbeschriftung': {
      const beschriftungen = (poolFrage.labels ?? []).map(lbl => ({
        id: lbl.id || genId(),
        position: { x: lbl.x ?? 50, y: lbl.y ?? 50 },
        korrekt: [lbl.text ?? ''],
      }))
      const bildUrl = poolFrage.img ? POOL_IMG_BASE_URL + poolFrage.img.src : ''
      const frage: BildbeschriftungFrage = {
        ...basis,
        typ: 'bildbeschriftung',
        fragetext: poolFrage.q,
        bildUrl,
        beschriftungen,
      }
      return frage
    }

    // -------------------------------------------------------
    // dragdrop_bild → DragDropBildFrage
    // zones[].{id,x,y,w,h} + labels[].{id,text,zone}
    // -------------------------------------------------------
    case 'dragdrop_bild': {
      const zielzonen = (poolFrage.zones ?? []).map(zone => ({
        id: zone.id || genId(),
        position: { x: zone.x, y: zone.y, breite: zone.w, hoehe: zone.h },
        // Finde das erste korrekte Label für diese Zone
        korrektesLabel: (poolFrage.labels ?? []).find(l => l.zone === zone.id)?.text ?? '',
      }))
      const labelTexte = (poolFrage.labels ?? []).map(l => l.text ?? '')
      const bildUrl = poolFrage.img ? POOL_IMG_BASE_URL + poolFrage.img.src : ''
      const frage: DragDropBildFrage = {
        ...basis,
        typ: 'dragdrop_bild',
        fragetext: poolFrage.q,
        bildUrl,
        zielzonen,
        labels: labelTexte,
      }
      return frage
    }

    // -------------------------------------------------------
    // code → CodeFrage
    // -------------------------------------------------------
    case 'code': {
      const frage: CodeFrage = {
        ...basis,
        typ: 'code',
        fragetext: poolFrage.q,
        sprache: poolFrage.sprache ?? 'python',
        starterCode: poolFrage.starterCode,
        musterLoesung: poolFrage.sample,
      }
      return frage
    }

    // zeichnen → VisualisierungFrage
    case 'zeichnen': {
      const frage: VisualisierungFrage = {
        ...basis,
        typ: 'visualisierung',
        untertyp: 'zeichnen',
        fragetext: poolFrage.q,
      }
      return frage
    }

    // bilanz → BilanzERFrage
    case 'bilanz': {
      const frage: BilanzERFrage = {
        ...basis,
        typ: 'bilanzstruktur',
        aufgabentext: poolFrage.q,
        modus: (poolFrage as any).modus ?? 'bilanz',
        kontenMitSaldi: (poolFrage as any).kontenMitSaldi ?? [],
        loesung: (poolFrage as any).correct ?? {},
        bewertungsoptionen: {
          seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
          kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true,
          bilanzsummeOderGewinn: true, mehrstufigkeit: false,
        },
      }
      return frage
    }

    // buchungssatz → BuchungssatzFrage
    case 'buchungssatz': {
      const frage: BuchungssatzFrage = {
        ...basis,
        typ: 'buchungssatz',
        geschaeftsfall: poolFrage.q,
        buchungen: (poolFrage as any).correct ?? [],
        kontenauswahl: { modus: 'eingeschraenkt' as const, konten: (poolFrage as any).konten ?? [] },
      }
      return frage
    }

    // tkonto → TKontoFrage
    case 'tkonto': {
      const frage: TKontoFrage = {
        ...basis,
        typ: 'tkonto',
        aufgabentext: poolFrage.q,
        geschaeftsfaelle: (poolFrage as any).geschaeftsfaelle ?? [],
        konten: (poolFrage as any).konten ?? [],
        kontenauswahl: { modus: 'voll' },
        bewertungsoptionen: {
          beschriftungSollHaben: true, kontenkategorie: true,
          zunahmeAbnahme: true, buchungenKorrekt: true, saldoKorrekt: true,
        },
      }
      return frage
    }

    // kontenbestimmung → KontenbestimmungFrage
    case 'kontenbestimmung': {
      const frage: KontenbestimmungFrage = {
        ...basis,
        typ: 'kontenbestimmung',
        aufgabentext: poolFrage.q,
        modus: 'gemischt',
        aufgaben: (poolFrage as any).aufgaben ?? [],
        kontenauswahl: { modus: 'voll' },
      }
      return frage
    }

    // gruppe → AufgabengruppeFrage (Teilaufgaben inline)
    case 'gruppe': {
      const teilaufgaben = ((poolFrage as any).teil ?? []).map((teil: any) => ({
        id: genId(),
        typ: teil.type ?? 'freitext',
        fragetext: teil.q ?? '',
        punkte: berechnePunkte({ ...poolFrage, type: teil.type } as PoolFrage),
        ...teil,
      }))
      const frage: AufgabengruppeFrage = {
        ...basis,
        typ: 'aufgabengruppe',
        kontext: `${poolFrage.q}${(poolFrage as any).context ? '\n\n' + (poolFrage as any).context : ''}`,
        teilaufgaben,
      }
      return frage
    }

    default: {
      // Unbekannter Typ → als Freitext importieren (statt Error werfen)
      console.warn(`[poolConverter] Unbekannter Pool-Typ "${poolFrage.type}" → Freitext-Fallback`)
      const frage: FreitextFrage = {
        ...basis,
        typ: 'freitext',
        fragetext: poolFrage.q,
        laenge: 'mittel',
      }
      return frage
    }
  }
}
