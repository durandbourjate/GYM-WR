import type { PoolFrage, PoolFrageSnapshot } from '../../types/pool'

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

  if ('options' in poolFrage && poolFrage.options !== undefined) snapshot.optionen = poolFrage.options
  if ('correct' in poolFrage && poolFrage.correct !== undefined) snapshot.korrekt = poolFrage.correct
  if (poolFrage.explain !== undefined) snapshot.erklaerung = poolFrage.explain
  if ('sample' in poolFrage && poolFrage.sample !== undefined) snapshot.musterlosung = poolFrage.sample

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
