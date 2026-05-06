import { create } from 'zustand'

export type DraftStatus = 'draft' | 'sammlung' | 'sync-pending'

export interface AktiverDraft {
  editorId: string
  istDirty: boolean
  status: DraftStatus
}

interface DraftStore {
  aktiveDrafts: Map<string, AktiverDraft>
  register: (editorId: string) => void
  setDirty: (editorId: string, dirty: boolean) => void
  setStatus: (editorId: string, status: DraftStatus) => void
  unregister: (editorId: string) => void
  hatDirty: () => boolean
}

export const useDraftStore = create<DraftStore>((set, get) => ({
  aktiveDrafts: new Map(),
  register: (editorId) => set((state) => {
    if (state.aktiveDrafts.has(editorId)) return state
    const next = new Map(state.aktiveDrafts)
    next.set(editorId, { editorId, istDirty: false, status: 'sammlung' })
    return { aktiveDrafts: next }
  }),
  setDirty: (editorId, dirty) => set((state) => {
    const existing = state.aktiveDrafts.get(editorId)
    if (!existing) return state
    const next = new Map(state.aktiveDrafts)
    next.set(editorId, { ...existing, istDirty: dirty })
    return { aktiveDrafts: next }
  }),
  setStatus: (editorId, status) => set((state) => {
    const existing = state.aktiveDrafts.get(editorId)
    if (!existing) return state
    const next = new Map(state.aktiveDrafts)
    next.set(editorId, { ...existing, status })
    return { aktiveDrafts: next }
  }),
  unregister: (editorId) => set((state) => {
    if (!state.aktiveDrafts.has(editorId)) return state
    const next = new Map(state.aktiveDrafts)
    next.delete(editorId)
    return { aktiveDrafts: next }
  }),
  hatDirty: () => {
    for (const d of get().aktiveDrafts.values()) {
      if (d.istDirty) return true
    }
    return false
  },
}))
