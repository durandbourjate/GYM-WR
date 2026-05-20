import { create } from 'zustand'
import type { Favorit } from '../types/favorit'
import { useStammdatenStore } from './stammdatenStore'
import { useToastStore } from '@gymhofwil/shared'

// Re-Export für Backwards-Compat (9+ Konsumenten importieren von hier)
export type { Favorit } from '../types/favorit'

/** Selector: Favoriten sortiert nach sortierung-Feld */
export function selectFavoritenSortiert(state: { favoriten: Favorit[] }): Favorit[] {
  return [...state.favoriten].sort((a, b) => a.sortierung - b.sortierung)
}

interface FavoritenStore {
  favoriten: Favorit[]
  ladeStatus: 'idle' | 'laeuft' | 'fertig' | 'fehler'

  // Actions
  ladeAusBackend: () => Promise<void>
  toggleFavorit: (fav: Omit<Favorit, 'sortierung'> & { sortierung?: number }) => Promise<void>
  istFavorit: (ziel: string) => boolean
  updateSortierung: (zielReihenfolge: string[]) => Promise<void>
  entferneFavorit: (ziel: string) => Promise<void>
  reset: () => void
}

/**
 * Cluster E.3: Backend-Sync via stammdatenStore.lpProfil.favoriten
 * (kein eigener Persist mehr). Optimistic-Update + Server-Refetch bei Error.
 */
export const useFavoritenStore = create<FavoritenStore>()((set, get) => ({
  favoriten: [],
  ladeStatus: 'idle',

  ladeAusBackend: async () => {
    set({ ladeStatus: 'laeuft' })
    const profil = useStammdatenStore.getState().lpProfil
    set({ favoriten: profil?.favoriten ?? [], ladeStatus: 'fertig' })
  },

  toggleFavorit: async (fav) => {
    const { favoriten } = get()
    const exists = favoriten.find(f => f.ziel === fav.ziel)
    const maxSort = favoriten.reduce((max, f) => Math.max(max, f.sortierung), -1)
    const next: Favorit[] = exists
      ? favoriten.filter(f => f.ziel !== fav.ziel)
      : [...favoriten, { ...fav, sortierung: fav.sortierung ?? maxSort + 1 }]

    // Optimistic: Frontend sofort
    set({ favoriten: next })

    // Persist (skip in Demo-Mode wenn kein lpProfil)
    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add(
        'error',
        'Favorit konnte nicht synchronisiert werden — wird neu geladen',
      )
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  istFavorit: (ziel) => get().favoriten.some(f => f.ziel === ziel),

  updateSortierung: async (zielReihenfolge) => {
    const { favoriten } = get()
    const next = favoriten.map(f => ({
      ...f,
      sortierung: zielReihenfolge.indexOf(f.ziel),
    }))
    set({ favoriten: next })

    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add(
        'error',
        'Reihenfolge konnte nicht synchronisiert werden — wird neu geladen',
      )
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  entferneFavorit: async (ziel) => {
    const next = get().favoriten.filter(f => f.ziel !== ziel)
    set({ favoriten: next })

    const { lpProfil, speichereLPProfil, ladeLPProfil } = useStammdatenStore.getState()
    if (!lpProfil) return

    const ok = await speichereLPProfil({ ...lpProfil, favoriten: next })
    if (!ok) {
      useToastStore.getState().add(
        'error',
        'Favorit konnte nicht entfernt werden — wird neu geladen',
      )
      await ladeLPProfil(lpProfil.email)
      await get().ladeAusBackend()
    }
  },

  reset: () => set({ favoriten: [], ladeStatus: 'idle' }),
}))
