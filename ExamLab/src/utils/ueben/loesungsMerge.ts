import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap, LoesungsSlice } from '../../types/ueben/loesung'

/**
 * Merged einen LoesungsSlice in eine Frage-Kopie. Mutiert NICHT die
 * Original-Frage; liefert ein neues Objekt mit kombinierten Feldern.
 *
 * Listen-Felder (optionen[], luecken[], etc.): Merge per id — der
 * gemischte Client-Array wird um die Lösungs-Attribute ergänzt.
 * Reihenfolgen-kritische Felder (elemente[], paare[]) werden aus
 * dem Slice übernommen (überschreibt gemischte Client-Version).
 */
export function mergeLoesungInFrage(frage: Frage, slice: LoesungsSlice | undefined): Frage {
  if (!slice) return frage
  const merged: Record<string, unknown> = { ...frage }

  // Top-level einfache Felder (gemeinsam + typSpezifisch)
  if (slice.musterlosung !== undefined) merged.musterlosung = slice.musterlosung
  if (slice.bewertungsraster !== undefined) merged.bewertungsraster = slice.bewertungsraster
  if (slice.korrekteFormel !== undefined) merged.korrekteFormel = slice.korrekteFormel
  if (slice.korrekt !== undefined) merged.korrekt = slice.korrekt
  if (slice.buchungen !== undefined) merged.buchungen = slice.buchungen
  if (slice.korrektBuchung !== undefined) merged.korrektBuchung = slice.korrektBuchung
  if (slice.sollEintraege !== undefined) merged.sollEintraege = slice.sollEintraege
  if (slice.habenEintraege !== undefined) merged.habenEintraege = slice.habenEintraege
  if (slice.loesung !== undefined) merged.loesung = slice.loesung

  // Reihenfolgen-kritisch: Lösung überschreibt Mischung
  if (slice.elemente !== undefined) merged.elemente = slice.elemente
  if (slice.paare !== undefined) merged.paare = slice.paare

  // Listen-Felder per id mergen
  type IdItem = { id?: string }
  const mergeById = (base: unknown, patches: IdItem[] | undefined): unknown => {
    if (!Array.isArray(base) || !patches) return base
    const patchMap = new Map<string, IdItem>()
    for (const p of patches) if (p && p.id) patchMap.set(p.id, p)
    return base.map((item: unknown) => {
      if (typeof item !== 'object' || item === null) return item
      const withId = item as IdItem
      const patch = withId.id ? patchMap.get(withId.id) : undefined
      return patch ? { ...withId, ...patch } : item
    })
  }

  if (slice.optionen) merged.optionen = mergeById(merged.optionen, slice.optionen)
  if (slice.aussagen) merged.aussagen = mergeById(merged.aussagen, slice.aussagen)
  if (slice.luecken) merged.luecken = mergeById(merged.luecken, slice.luecken)
  if (slice.ergebnisse) merged.ergebnisse = mergeById(merged.ergebnisse, slice.ergebnisse)
  if (slice.konten) merged.konten = mergeById(merged.konten, slice.konten)
  if (slice.bilanzEintraege) merged.bilanzEintraege = mergeById(merged.bilanzEintraege, slice.bilanzEintraege)
  if (slice.aufgaben) merged.aufgaben = mergeById(merged.aufgaben, slice.aufgaben)
  if (slice.labels) merged.labels = mergeById(merged.labels, slice.labels)
  if (slice.beschriftungen) merged.beschriftungen = mergeById(merged.beschriftungen, slice.beschriftungen)
  if (slice.zielzonen) merged.zielzonen = mergeById(merged.zielzonen, slice.zielzonen)
  if (slice.bereiche) merged.bereiche = mergeById(merged.bereiche, slice.bereiche)
  if (slice.hotspots) merged.hotspots = mergeById(merged.hotspots, slice.hotspots)

  return merged as unknown as Frage
}

/**
 * Merged die Lösungs-Map in die Frage-Liste. Aufgabengruppen erhalten
 * sowohl ihren eigenen Slice als auch die Slices ihrer Teilaufgaben
 * (flache Map-Lookup).
 */
export function mergeLoesungen(
  fragen: Frage[],
  loesungen: LoesungsMap,
): { fragen: Frage[]; preloaded: Record<string, boolean> } {
  const preloaded: Record<string, boolean> = {}
  const merged = fragen.map((f) => {
    const frageSlice = loesungen[f.id]
    preloaded[f.id] = frageSlice !== undefined
    let out = mergeLoesungInFrage(f, frageSlice)
    const outWithTa = out as Frage & { teilaufgaben?: Frage[] }
    if (Array.isArray(outWithTa.teilaufgaben)) {
      outWithTa.teilaufgaben = outWithTa.teilaufgaben.map((ta: Frage) => {
        const taSlice = loesungen[ta.id]
        preloaded[ta.id] = taSlice !== undefined
        return mergeLoesungInFrage(ta, taSlice)
      })
      out = outWithTa
    }
    return out
  })
  return { fragen: merged, preloaded }
}
