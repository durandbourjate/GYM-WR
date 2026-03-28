// Pruefung/src/utils/poolConverter.ts
// Konvertiert Pool-Frageformate ins Prüfungstool-Format

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
} from '../types/fragen'

const POOL_IMG_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

// === HILFSFUNKTIONEN ===

/** Mappt den Pool-Fach-String auf einen Fachbereich-Enum */
export function mapFachbereich(fach: string): Fachbereich {
  const f = fach.toLowerCase()
  if (f.includes('vwl') || f.includes('volkswirt')) return 'VWL'
  if (f.includes('bwl') || f.includes('betriebswirt')) return 'BWL'
  if (f.includes('recht') || f.includes('law')) return 'Recht'
  if (f.includes('in') || f.includes('informatik') || f.includes('info')) return 'Informatik'
  // Fallback: VWL
  return 'VWL'
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
  }

  return snapshot
}

// === HAUPTKONVERTIERUNG ===

/**
 * Konvertiert eine Pool-Frage ins Prüfungstool-Format.
 *
 * @param poolFrage  - Die Rohfrage aus dem Pool
 * @param poolMeta   - Pool-Metadaten (id, title, fach)
 * @param topics     - Topic-Map für Thema-Lookup
 * @param lernzielIds - Zugeordnete Lernziel-IDs (vom Caller)
 * @returns          Fertige Frage im Prüfungstool-Format
 */
export function konvertierePoolFrage(
  poolFrage: PoolFrage,
  poolMeta: PoolMeta,
  topics: Record<string, PoolTopic>,
  lernzielIds: string[] = [],
): Frage {
  const now = jetzt()
  const topic = topics[poolFrage.topic]
  const thema = topic?.label ?? poolFrage.topic

  // Basis-Felder die alle konvertierten Fragen teilen
  const basis = {
    id: genId(),
    version: 1,
    erstelltAm: now,
    geaendertAm: now,

    fachbereich: mapFachbereich(poolMeta.fach),
    fach: poolMeta.fach || 'Allgemein',
    thema,
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
      const paare = (poolFrage.items ?? []).map((item) => ({
        links: item.t,
        rechts: cats[item.cat] ?? '',
      }))
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

    default: {
      // Exhaustive check — TypeScript sollte hier nie ankommen
      const _exhaustive: never = poolFrage.type
      throw new Error(`Unbekannter Pool-Fragetyp: ${_exhaustive}`)
    }
  }
}
