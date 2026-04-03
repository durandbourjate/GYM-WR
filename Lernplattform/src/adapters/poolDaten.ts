/**
 * Pool-Daten Adapter: Lädt konvertierte Pool-Fragen per Lazy Loading.
 * Die JSON-Dateien liegen in /pool-daten/ (public) und werden zur Laufzeit geladen.
 * Für Gym-SuS Gruppen — Kinder-Gruppen nutzen weiterhin MOCK_FRAGEN.
 */

import type { Frage, FragenFilter } from '../types/fragen'
import type { FragenService } from '../services/interfaces'

// Pool-IDs gruppiert nach Fach
const POOL_IDS: Record<string, string[]> = {
  VWL: [
    'vwl_arbeitslosigkeit', 'vwl_beduerfnisse', 'vwl_bip', 'vwl_geld',
    'vwl_konjunktur', 'vwl_markteffizienz', 'vwl_menschenbild',
    'vwl_sozialpolitik', 'vwl_staatsverschuldung', 'vwl_steuern', 'vwl_wachstum',
  ],
  BWL: [
    'bwl_einfuehrung', 'bwl_fibu', 'bwl_marketing',
    'bwl_stratfuehrung', 'bwl_unternehmensmodell',
  ],
  Recht: [
    'recht_arbeitsrecht', 'recht_einfuehrung', 'recht_einleitungsartikel',
    'recht_grundrechte', 'recht_mietrecht', 'recht_or_at',
    'recht_personenrecht', 'recht_prozessrecht', 'recht_sachenrecht',
    'recht_strafrecht',
  ],
}

// Cache: Pool-ID → Fragen (einmal geladen, dann im Speicher)
const fragenCache = new Map<string, Frage[]>()

async function ladePool(poolId: string): Promise<Frage[]> {
  if (fragenCache.has(poolId)) return fragenCache.get(poolId)!

  try {
    const base = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${base}pool-daten/${poolId}.json`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const fragen = await response.json() as Frage[]
    fragenCache.set(poolId, fragen)
    return fragen
  } catch (err) {
    console.warn(`Pool ${poolId} konnte nicht geladen werden:`, err)
    return []
  }
}

async function ladeAllePools(fach?: string): Promise<Frage[]> {
  const relevantePools = fach
    ? (POOL_IDS[fach] || [])
    : Object.values(POOL_IDS).flat()

  const ergebnisse = await Promise.all(relevantePools.map(ladePool))
  return ergebnisse.flat()
}

export class PoolFragenAdapter implements FragenService {
  async ladeFragen(_gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    let fragen = await ladeAllePools(filter?.fach)

    if (filter?.thema) fragen = fragen.filter(f => f.thema === filter.thema)
    if (filter?.schwierigkeit) fragen = fragen.filter(f => f.schwierigkeit === filter.schwierigkeit)
    if (filter?.nurUebung) fragen = fragen.filter(f => f.uebung)
    if (filter?.tags?.length) {
      fragen = fragen.filter(f => filter.tags!.some(t => f.tags?.includes(t)))
    }

    return fragen
  }

  async ladeThemen(_gruppeId: string, fach?: string): Promise<string[]> {
    const fragen = await ladeAllePools(fach)
    return [...new Set(fragen.map(f => f.thema))]
  }
}
