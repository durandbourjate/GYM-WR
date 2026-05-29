/**
 * Tags-Store: Zustand-Cache + Selektoren für Tag-Objekt-Modell (Cluster H Phase 0).
 *
 * Lädt einmal via apiListTags, hält im Memory-Cache, exportiert getById/getByIds/getByName-Lookups.
 * Lokale Mutations (upsertLokal/entferneLokal) für optimistic updates nach API-Calls.
 */
import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'
import type { Tag } from '@shared/types/tag'
import { listeTags } from '../services/tagsApi'

interface TagsState {
  tags: Tag[]
  geladen: boolean
  ladend: boolean
  fehler: string | null
  ladeAlleTags: (params: { email: string; inkludiereArchivierte?: boolean }) => Promise<void>
  upsertLokal: (tag: Tag) => void
  entferneLokal: (id: string) => void
  getById: (id: string) => Tag | undefined
  getByIds: (ids: string[]) => Tag[]
  getByName: (name: string) => Tag | undefined
}

/**
 * Modul-lokaler Memo-Cache fuer die id→Tag-Map, gekeyed auf die `tags`-Array-Reference.
 *
 * Hintergrund: `getByIds` wird pro Frage in heissen Such-/Filter-Pfaden aufgerufen
 * (sucheAdapter.indexFragen/indexFragenVolltext, useFragenFilter). Eine `new Map(...)`
 * pro Aufruf ist bei 20k Fragen O(n×m). Da die `tags`-Reference nur bei echter
 * Mutation wechselt (Zustand setzt `tags` immer auf ein neues Array), koennen wir
 * die Map cachen und nur bei Reference-Wechsel neu aufbauen.
 *
 * Identisches Muster wie `useTagsByIds` (Map aus tags), nur store-level statt im Hook.
 */
let tagsByIdCache: { ref: Tag[]; map: Map<string, Tag> } | null = null

function getTagsByIdMap(tags: Tag[]): Map<string, Tag> {
  if (!tagsByIdCache || tagsByIdCache.ref !== tags) {
    tagsByIdCache = { ref: tags, map: new Map(tags.map((t) => [t.id, t])) }
  }
  return tagsByIdCache.map
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  geladen: false,
  ladend: false,
  fehler: null,

  ladeAlleTags: async (params) => {
    if (get().ladend) return
    set({ ladend: true, fehler: null })
    try {
      const tags = await listeTags(params)
      set({ tags, geladen: true, ladend: false })
    } catch (e) {
      set({ fehler: String(e), ladend: false })
    }
  },

  upsertLokal: (tag) => set((state) => {
    const idx = state.tags.findIndex((t) => t.id === tag.id)
    if (idx >= 0) {
      const neu = [...state.tags]
      neu[idx] = tag
      return { tags: neu }
    }
    return { tags: [...state.tags, tag] }
  }),

  entferneLokal: (id) => set((state) => ({
    tags: state.tags.filter((t) => t.id !== id),
  })),

  getById: (id) => get().tags.find((t) => t.id === id),

  getByIds: (ids) => {
    const map = getTagsByIdMap(get().tags)
    return ids.map((id) => map.get(id)).filter((t): t is Tag => Boolean(t))
  },

  getByName: (name) => {
    const lower = name.toLowerCase()
    return get().tags.find((t) => t.name.toLowerCase() === lower)
  },
}))

/**
 * Memoisierter Hook: subscribed an tagsStore.tags + Auflösung via getByIds.
 *
 * Vorteil ggü. direkter `useTagsStore.getState().getByIds(ids)` (non-reactive)
 * oder `useTagsStore(useShallow(s => s.getByIds(ids)))` (re-runs selector
 * jeden Render, allokiert neues Array): Hier re-evaluieren wir nur bei
 * Aenderung der tags-Reference oder der ids-Liste. Re-Render bei Tag-Rename
 * funktioniert (tags-Reference wechselt). Stabile Reference fuer
 * memoization-Konsumenten.
 *
 * Spawn-Task 17.05.2026 (Cluster H Phase 0).
 */
export function useTagsByIds(ids: string[] | undefined): Tag[] {
  const tags = useTagsStore(useShallow((s) => s.tags))
  const key = (ids ?? []).join(',')
  return useMemo(() => {
    if (!ids || ids.length === 0) return []
    const map = new Map(tags.map((t) => [t.id, t]))
    return ids.map((id) => map.get(id)).filter((t): t is Tag => Boolean(t))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, key])
}
