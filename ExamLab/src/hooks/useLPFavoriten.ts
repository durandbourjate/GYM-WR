import { useMemo } from 'react'
import type { PruefungsConfig } from '../types/pruefung'
import type { Favorit } from '../store/favoritenStore'

export interface UseLPFavoritenResult {
  favoritenConfigIds: Set<string>
  favoritenConfigs: PruefungsConfig[]
  favoritenPruefungen: PruefungsConfig[]
  favoritenUebungen: PruefungsConfig[]
}

/**
 * Berechnet die Favoriten-Listen für die LPStartseite.
 *
 * Quelle (byte-identisch): `LPStartseite.tsx` Z. 219-229.
 * - `favoritenConfigIds`: Set aller Favoriten mit typ=pruefung|uebung
 * - `favoritenConfigs`: existierende Configs, sortiert nach datum desc
 * - `favoritenPruefungen` / `favoritenUebungen`: getrennt nach typ === 'formativ'
 */
export function useLPFavoriten(
  configs: PruefungsConfig[],
  favoriten: Favorit[]
): UseLPFavoritenResult {
  const favoritenConfigIds = useMemo(() => new Set(
    favoriten.filter(f => f.typ === 'pruefung' || f.typ === 'uebung').map(f => f.ziel)
  ), [favoriten])

  const favoritenConfigs = useMemo(() => {
    if (favoritenConfigIds.size === 0) return []
    return configs.filter(c => favoritenConfigIds.has(c.id)).sort((a, b) => b.datum.localeCompare(a.datum))
  }, [configs, favoritenConfigIds])

  const favoritenPruefungen = useMemo(() => favoritenConfigs.filter(c => c.typ !== 'formativ'), [favoritenConfigs])
  const favoritenUebungen = useMemo(() => favoritenConfigs.filter(c => c.typ === 'formativ'), [favoritenConfigs])

  return { favoritenConfigIds, favoritenConfigs, favoritenPruefungen, favoritenUebungen }
}
