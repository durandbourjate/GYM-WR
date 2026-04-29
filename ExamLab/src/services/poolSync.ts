// Pruefung/src/services/poolSync.ts
// Sync-Service: Fetcht Pool-Configs von GitHub Pages und berechnet Deltas

import type {
  PoolConfig,
  PoolFrage,
  PoolIndexEintrag,
  Lernziel,
  PoolSyncErgebnis,
} from '../types/pool'
import type {
  Frage,
  MCFrage,
  RichtigFalschFrage,
  LueckentextFrage,
  BerechnungFrage,
  ZuordnungFrage,
} from '../types/fragen-storage'
import type { PoolFrageSnapshot } from '../types/pool'
import { konvertierePoolFrage, erzeugeSnapshot, konvertierePoolBild } from '../utils/poolConverter'

// === KONSTANTEN ===

const POOL_BASE_URL =
  (import.meta.env.VITE_POOL_BASE_URL as string | undefined) ??
  'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/config'

// === INDEX ===

/**
 * Lädt den Pool-Index von GitHub Pages.
 * Gibt ein leeres Array zurück wenn der Fetch fehlschlägt.
 */
export async function ladePoolIndex(): Promise<PoolIndexEintrag[]> {
  const url = `${POOL_BASE_URL}/index.json`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Pool-Index konnte nicht geladen werden (${res.status}): ${url}`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error(`Pool-Index hat unerwartetes Format: kein Array`)
  }
  return data as PoolIndexEintrag[]
}

// === POOL-CONFIG LADEN ===

/**
 * Lädt und parst eine einzelne Pool-JS-Config-Datei von GitHub Pages.
 * Wirft einen Fehler wenn:
 * - Der Fetch fehlschlägt
 * - Die Antwort eine HTML-Fehlerseite ist
 * - Die JS-Datei keine gültigen POOL_META / QUESTIONS enthält
 */
export async function ladePoolConfig(dateiname: string): Promise<PoolConfig> {
  const url = `${POOL_BASE_URL}/${dateiname}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Pool-Config nicht ladbar (${res.status}): ${url}`)
  }

  const jsText = await res.text()

  // Schutz: GitHub Pages liefert bei 404 manchmal eine HTML-Seite
  if (jsText.trimStart().startsWith('<!')) {
    throw new Error(`Pool-Config ist eine HTML-Seite (404/Fehler): ${dateiname}`)
  }

  // Sandbox-Objekt simuliert globales `window` für die Pool-Skripte,
  // die ihre Daten via `window.POOL_META = ...` etc. exportieren
  const sandbox: Record<string, unknown> = {}

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('window', jsText)
    fn(sandbox)
  } catch (err) {
    throw new Error(
      `Pool-Config konnte nicht ausgeführt werden (${dateiname}): ${String(err)}`,
    )
  }

  const meta = sandbox['POOL_META'] as PoolConfig['meta'] | undefined
  const topics = (sandbox['TOPICS'] ?? {}) as PoolConfig['topics']
  const questions = sandbox['QUESTIONS'] as PoolFrage[] | undefined

  // Validierung
  if (!meta?.id) {
    throw new Error(`Pool-Config hat keine gültige POOL_META.id: ${dateiname}`)
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`Pool-Config hat keine Fragen (QUESTIONS leer oder fehlt): ${dateiname}`)
  }

  return { meta, topics, questions }
}

// === CONTENT-HASH ===

/**
 * Berechnet einen SHA-256-Hash über die inhaltlichen Felder einer Pool-Frage.
 * Wird für Änderungserkennung beim Sync verwendet.
 */
export async function berechneContentHash(frage: PoolFrage): Promise<string> {
  const inhalt = {
    q: frage.q,
    type: frage.type,
    explain: frage.explain,
    options: frage.options,
    correct: frage.correct,
    blanks: frage.blanks,
    rows: frage.rows,
    categories: frage.categories,
    items: frage.items,
    sample: frage.sample,
    img: frage.img,
  }

  const json = JSON.stringify(inhalt)
  const encoded = new TextEncoder().encode(json)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// === LERNZIELE ===

/**
 * Extrahiert alle Lernziel-Objekte aus einer PoolConfig.
 * - Pool-Level: config.meta.lernziele → ID: {poolId}_pool_{index}
 * - Topic-Level: config.topics[key].lernziele → ID: {poolId}_{key}_{index}
 * Bloom-Stufe wird per Regex (K[1-6]) am Textende erkannt.
 */
export function extrahiereLernziele(config: PoolConfig): Lernziel[] {
  const poolId = config.meta.id
  const fach = config.meta.fach
  const lernziele: Lernziel[] = []

  // Pool-Level Lernziele
  for (let i = 0; i < (config.meta.lernziele?.length ?? 0); i++) {
    const text = config.meta.lernziele[i]
    lernziele.push({
      id: `${poolId}_pool_${i}`,
      fach,
      poolId,
      thema: config.meta.title,
      text,
      bloom: extrahiereBloom(text),
      aktiv: true,
    })
  }

  // Topic-Level Lernziele
  for (const [key, topic] of Object.entries(config.topics ?? {})) {
    for (let i = 0; i < (topic.lernziele?.length ?? 0); i++) {
      const text = topic.lernziele[i]
      lernziele.push({
        id: `${poolId}_${key}_${i}`,
        fach,
        poolId,
        thema: topic.label,
        text,
        bloom: extrahiereBloom(text),
        aktiv: true,
      })
    }
  }

  return lernziele
}

/** Extrahiert Bloom-Stufe (K1–K6) aus einem Lernziel-Text per Regex. */
function extrahiereBloom(text: string): string {
  const match = /\(?(K[1-6])\)?[\s.]*$/i.exec(text)
  return match ? match[1].toUpperCase() : 'K2'
}

// === LERNZIEL-ZUORDNUNG ===

/**
 * Findet passende Lernziel-IDs für eine Pool-Frage anhand von poolId und topic.
 * Gibt zuerst topic-spezifische, dann pool-globale IDs zurück.
 */
export function findeLernzielIds(
  poolId: string,
  topic: string,
  lernziele: Lernziel[],
): string[] {
  // Topic-spezifische Lernziele
  const topicIds = lernziele
    .filter((lz) => lz.poolId === poolId && lz.id.startsWith(`${poolId}_${topic}_`))
    .map((lz) => lz.id)

  if (topicIds.length > 0) return topicIds

  // Fallback: Pool-globale Lernziele
  return lernziele
    .filter((lz) => lz.poolId === poolId && lz.id.startsWith(`${poolId}_pool_`))
    .map((lz) => lz.id)
}

// === DELTA-BERECHNUNG ===

/** Ergebnis der Delta-Berechnung über alle Pools */
export interface DeltaErgebnis {
  neueFragen: Frage[]
  aktualisierteFragen: Frage[]
  unveraendert: number
  lernziele: Lernziel[]
  ergebnisse: PoolSyncErgebnis[]
}

/**
 * Berechnet den Delta zwischen Pool-Configs und bestehenden Fragen im Store.
 *
 * @param poolConfigs        - Array aller geladenen Pool-Configs
 * @param bestehendeFragenMap - Map von poolId (compound '{pool}:{frage}') → bestehende Frage
 * @returns DeltaErgebnis mit neuen, geänderten und unveränderten Fragen
 */
export async function berechneDelta(
  poolConfigs: PoolConfig[],
  bestehendeFragenMap: Map<string, Frage>,
): Promise<DeltaErgebnis> {
  const neueFragen: Frage[] = []
  const aktualisierteFragen: Frage[] = []
  let unveraendertGesamt = 0
  const alleLernziele: Lernziel[] = []
  const ergebnisse: PoolSyncErgebnis[] = []

  for (const config of poolConfigs) {
    const poolLernziele = extrahiereLernziele(config)
    alleLernziele.push(...poolLernziele)

    let neu = 0
    let aktualisiert = 0
    let unveraendert = 0

    for (const poolFrage of config.questions) {
      const compoundId = `${config.meta.id}:${poolFrage.id}`
      const hash = await berechneContentHash(poolFrage)
      const bestehendeFrageOpt = bestehendeFragenMap.get(compoundId)

      if (!bestehendeFrageOpt) {
        // Neu: noch nicht in ExamLab
        const lernzielIds = findeLernzielIds(config.meta.id, poolFrage.topic, poolLernziele)
        const neueFrage = konvertierePoolFrage(poolFrage, config.meta, config.topics, lernzielIds)
        // Hash nachträglich setzen (konvertierePoolFrage setzt '' als Platzhalter)
        neueFrage.poolContentHash = hash
        neueFragen.push(neueFrage)
        neu++
      } else if (bestehendeFrageOpt.poolContentHash !== hash) {
        // Geändert: Hash stimmt nicht überein → Update verfügbar markieren
        const aktualisierteVersion: Frage = {
          ...bestehendeFrageOpt,
          poolUpdateVerfuegbar: true,
          poolVersion: erzeugeSnapshot(poolFrage),
          poolContentHash: hash,
        }
        // Pool-Bild als Anhang hinzufügen falls noch nicht vorhanden
        if (poolFrage.img) {
          const bestehendeAnhaenge = bestehendeFrageOpt.anhaenge ?? []
          const bildSchonVorhanden = bestehendeAnhaenge.some(
            (a) => a.externeUrl && a.externeUrl.endsWith(poolFrage.img!.src),
          )
          if (!bildSchonVorhanden) {
            aktualisierteVersion.anhaenge = [...bestehendeAnhaenge, konvertierePoolBild(poolFrage.img)]
          }
        }
        aktualisierteFragen.push(aktualisierteVersion)
        aktualisiert++
      } else {
        // Unverändert
        unveraendert++
      }
    }

    unveraendertGesamt += unveraendert
    ergebnisse.push({
      poolId: config.meta.id,
      poolTitle: config.meta.title,
      neu,
      aktualisiert,
      unveraendert,
    })
  }

  return {
    neueFragen,
    aktualisierteFragen,
    unveraendert: unveraendertGesamt,
    lernziele: alleLernziele,
    ergebnisse,
  }
}

// === RÜCK-SYNC DIFF ===

export interface RueckSyncDiffFeld {
  feld: string        // Anzeigename (z.B. "Fragetext", "Erklärung")
  poolFeld: string    // Pool-Feldname (z.B. "q", "explain")
  alt: unknown        // Wert im Pool (aus Snapshot)
  neu: unknown        // Aktueller Wert in ExamLab
}

/**
 * Vergleicht eine bearbeitete Frage mit ihrem Pool-Snapshot.
 * Gibt nur geänderte Felder zurück (für Feld-für-Feld-Dialog).
 */
export function berechneRueckSyncDiff(frage: Frage, snapshot: PoolFrageSnapshot): RueckSyncDiffFeld[] {
  const diffs: RueckSyncDiffFeld[] = []

  // Fragetext
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  if (fragetext !== snapshot.fragetext) {
    diffs.push({ feld: 'Fragetext', poolFeld: 'q', alt: snapshot.fragetext, neu: fragetext })
  }

  // Erklärung/Musterlösung
  const snapshotErklaerung = snapshot.musterlosung || snapshot.erklaerung || ''
  if (frage.musterlosung !== snapshotErklaerung) {
    diffs.push({
      feld: 'Erklärung',
      poolFeld: frage.typ === 'freitext' ? 'sample' : 'explain',
      alt: snapshotErklaerung,
      neu: frage.musterlosung,
    })
  }

  // Bloom-Stufe
  if (snapshot.bloom && frage.bloom !== snapshot.bloom) {
    diffs.push({ feld: 'Bloom-Stufe', poolFeld: 'tax', alt: snapshot.bloom, neu: frage.bloom })
  }

  // Schwierigkeit
  if (snapshot.schwierigkeit !== undefined && frage.schwierigkeit !== snapshot.schwierigkeit) {
    diffs.push({ feld: 'Schwierigkeit', poolFeld: 'diff', alt: snapshot.schwierigkeit, neu: frage.schwierigkeit })
  }

  // Optionen (MC, Richtig/Falsch)
  if (snapshot.optionen && JSON.stringify(getOptionen(frage)) !== JSON.stringify(snapshot.optionen)) {
    diffs.push({ feld: 'Optionen', poolFeld: 'options', alt: snapshot.optionen, neu: getOptionen(frage) })
  }

  // Korrekte Antwort
  if (snapshot.korrekt !== undefined && JSON.stringify(getKorrekt(frage)) !== JSON.stringify(snapshot.korrekt)) {
    diffs.push({ feld: 'Korrekte Antwort', poolFeld: 'correct', alt: snapshot.korrekt, neu: getKorrekt(frage) })
  }

  // Typ-spezifische Daten (Lücken, Berechnungen, Zuordnungen)
  if (snapshot.spezifisch !== undefined) {
    const aktuellesSpez = getSpezifisch(frage)
    if (JSON.stringify(aktuellesSpez) !== JSON.stringify(snapshot.spezifisch)) {
      diffs.push({ feld: 'Typ-spezifische Daten', poolFeld: 'spezifisch', alt: snapshot.spezifisch, neu: aktuellesSpez })
    }
  }

  return diffs
}

// Hilfsfunktionen für Vergleich

function getOptionen(frage: Frage): unknown[] | undefined {
  if (frage.typ === 'mc') return (frage as MCFrage).optionen.map(o => ({ text: o.text, korrekt: o.korrekt }))
  if (frage.typ === 'richtigfalsch') return (frage as RichtigFalschFrage).aussagen.map(a => ({ text: a.text, korrekt: a.korrekt }))
  return undefined
}

function getKorrekt(frage: Frage): unknown {
  if (frage.typ === 'mc') {
    const mc = frage as MCFrage
    if (mc.mehrfachauswahl) return mc.optionen.filter(o => o.korrekt).map((_, i) => String.fromCharCode(65 + i))
    return String.fromCharCode(65 + mc.optionen.findIndex(o => o.korrekt))
  }
  if (frage.typ === 'richtigfalsch') return (frage as RichtigFalschFrage).aussagen[0]?.korrekt
  return undefined
}

function getSpezifisch(frage: Frage): unknown {
  switch (frage.typ) {
    case 'lueckentext': return (frage as LueckentextFrage).luecken
    case 'berechnung': return (frage as BerechnungFrage).ergebnisse
    case 'zuordnung': return (frage as ZuordnungFrage).paare
    default: return undefined
  }
}
