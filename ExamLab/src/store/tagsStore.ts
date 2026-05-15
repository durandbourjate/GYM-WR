/**
 * Tags-Store: Zustand-Cache + Selektoren für Tag-Objekt-Modell (Cluster H Phase 0).
 *
 * Lädt einmal via apiListTags, hält im Memory-Cache, exportiert getById/getByIds/getByName-Lookups.
 * Lokale Mutations (upsertLokal/entferneLokal) für optimistic updates nach API-Calls.
 */
import { create } from 'zustand'
import type { Tag } from '@shared/types/tag'
import { listeTags } from '../services/tagsApi'

interface TagsState {
  tags: Tag[]
  geladen: boolean
  ladend: boolean
  fehler: string | null
  ladeAlleTags: (opts?: { inkludiereArchivierte?: boolean }) => Promise<void>
  upsertLokal: (tag: Tag) => void
  entferneLokal: (id: string) => void
  getById: (id: string) => Tag | undefined
  getByIds: (ids: string[]) => Tag[]
  getByName: (name: string) => Tag | undefined
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  geladen: false,
  ladend: false,
  fehler: null,

  ladeAlleTags: async (opts) => {
    if (get().ladend) return
    set({ ladend: true, fehler: null })
    try {
      const tags = await listeTags(opts)
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
    const map = new Map(get().tags.map((t) => [t.id, t]))
    return ids.map((id) => map.get(id)).filter((t): t is Tag => Boolean(t))
  },

  getByName: (name) => {
    const lower = name.toLowerCase()
    return get().tags.find((t) => t.name.toLowerCase() === lower)
  },
}))
