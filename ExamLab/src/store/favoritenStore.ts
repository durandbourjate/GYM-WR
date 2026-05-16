import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { iconStringToCanonicalKey } from '../components/ui/icons/NavIcon'

/**
 * Erweitertes Favoriten-Modell: App-Orte (Routes) + Inhalte (Prüfungen/Übungen/Fragen)
 * Ersetzt das alte AppOrt-basierte System aus lpNavigationStore.
 */
export interface Favorit {
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage' | 'einstellungen-tab' | 'hilfe-tab'
  ziel: string       // Route-Pfad ('/fragensammlung') oder Config-ID ('abc123')
  label: string      // Anzeigename
  /** Lucide-Component-Name als String (canonical Form seit #4 17.05.2026).
   *  Persist-Migration v1→v2 konvertiert alte Emoji-Strings einmalig. */
  icon?: string
  sortierung: number // Drag & Drop Reihenfolge
}

/** Selector: Favoriten sortiert nach sortierung-Feld */
export function selectFavoritenSortiert(state: { favoriten: Favorit[] }): Favorit[] {
  return [...state.favoriten].sort((a, b) => a.sortierung - b.sortierung)
}

interface FavoritenStore {
  favoriten: Favorit[]

  // Actions
  toggleFavorit: (fav: Omit<Favorit, 'sortierung'> & { sortierung?: number }) => void
  istFavorit: (ziel: string) => boolean
  updateSortierung: (zielReihenfolge: string[]) => void
  entferneFavorit: (ziel: string) => void
  reset: () => void
}

export const useFavoritenStore = create<FavoritenStore>()(
  persist(
    (set, get) => ({
      favoriten: [],

      toggleFavorit: (fav) => {
        const { favoriten } = get()
        const exists = favoriten.find(f => f.ziel === fav.ziel)
        if (exists) {
          set({ favoriten: favoriten.filter(f => f.ziel !== fav.ziel) })
        } else {
          const maxSort = favoriten.reduce((max, f) => Math.max(max, f.sortierung), -1)
          set({
            favoriten: [
              ...favoriten,
              { ...fav, sortierung: fav.sortierung ?? maxSort + 1 },
            ],
          })
        }
      },

      istFavorit: (ziel) => {
        return get().favoriten.some(f => f.ziel === ziel)
      },

      updateSortierung: (zielReihenfolge) => {
        const { favoriten } = get()
        const updated = favoriten.map(f => ({
          ...f,
          sortierung: zielReihenfolge.indexOf(f.ziel),
        }))
        set({ favoriten: updated })
      },

      entferneFavorit: (ziel) => {
        set({ favoriten: get().favoriten.filter(f => f.ziel !== ziel) })
      },

      reset: () => set({ favoriten: [] }),
    }),
    {
      name: 'examlab-favoriten',
      version: 2,
      /** v1 → v2 (17.05.2026): icon-Strings von Emoji auf Lucide-Component-Name umstellen.
       *  Defensiv: unbekannte Strings (z.B. User-Custom) bleiben unverändert — Render-Helper
       *  in NavIcon.tsx kann beide Formen lesen. */
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as { favoriten?: Favorit[] }
        if (version < 2 && Array.isArray(state.favoriten)) {
          state.favoriten = state.favoriten.map((f) => {
            if (!f.icon) return f
            const key = iconStringToCanonicalKey(f.icon)
            return key ? { ...f, icon: key } : f
          })
        }
        return state as FavoritenStore
      },
      // Migration: Alte AppOrt[] aus 'lp-favoriten' übernehmen
      onRehydrateStorage: () => (state) => {
        if (!state || state.favoriten.length > 0) return
        try {
          const alteDaten = localStorage.getItem('lp-favoriten')
          if (!alteDaten) return
          const alte = JSON.parse(alteDaten) as Array<{
            titel?: string
            screen?: string
            params?: { configId?: string; tab?: string }
          }>
          if (!Array.isArray(alte) || alte.length === 0) return

          const migriert: Favorit[] = alte.map((a, i) => ({
            typ: (a.params?.configId ? (a.screen as Favorit['typ']) : 'ort') || 'ort',
            ziel: a.params?.configId ?? `/${a.screen ?? 'pruefung'}`,
            label: a.titel || '',
            sortierung: i,
          }))
          state.favoriten = migriert
          // Alte Daten aufräumen
          localStorage.removeItem('lp-favoriten')
        } catch { /* Migration fehlgeschlagen — ignorieren */ }
      },
    }
  )
)
