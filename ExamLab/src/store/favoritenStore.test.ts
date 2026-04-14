import { describe, it, expect, beforeEach } from 'vitest'
import { useFavoritenStore, selectFavoritenSortiert } from './favoritenStore'

describe('favoritenStore', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
  })

  it('fügt einen Ort-Favoriten hinzu', () => {
    useFavoritenStore.getState().toggleFavorit({
      typ: 'ort',
      ziel: '/fragensammlung',
      label: 'Fragensammlung',
    })
    const { favoriten } = useFavoritenStore.getState()
    expect(favoriten).toHaveLength(1)
    expect(favoriten[0].typ).toBe('ort')
    expect(favoriten[0].ziel).toBe('/fragensammlung')
    expect(favoriten[0].label).toBe('Fragensammlung')
  })

  it('entfernt einen bestehenden Favoriten per Toggle', () => {
    const fav = { typ: 'ort' as const, ziel: '/fragensammlung', label: 'Fragensammlung' }
    useFavoritenStore.getState().toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    useFavoritenStore.getState().toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(0)
  })

  it('sortiert Favoriten nach sortierung', () => {
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 2 })
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    const sorted = selectFavoritenSortiert(useFavoritenStore.getState())
    expect(sorted[0].label).toBe('B')
    expect(sorted[1].label).toBe('A')
  })

  it('aktualisiert Sortierung per updateSortierung', () => {
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 })
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    useFavoritenStore.getState().updateSortierung(['/b', '/a'])
    const sorted = selectFavoritenSortiert(useFavoritenStore.getState())
    expect(sorted[0].ziel).toBe('/b')
    expect(sorted[1].ziel).toBe('/a')
  })

  it('prüft istFavorit korrekt', () => {
    useFavoritenStore.getState().toggleFavorit({ typ: 'pruefung', ziel: 'abc123', label: 'Test' })
    expect(useFavoritenStore.getState().istFavorit('abc123')).toBe(true)
    expect(useFavoritenStore.getState().istFavorit('xyz789')).toBe(false)
  })

  it('entfernt Favorit per entferneFavorit', () => {
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B' })
    useFavoritenStore.getState().entferneFavorit('/a')
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(useFavoritenStore.getState().favoriten[0].ziel).toBe('/b')
  })

  it('vergibt automatisch aufsteigende Sortierung', () => {
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B' })
    useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/c', label: 'C' })
    const { favoriten } = useFavoritenStore.getState()
    expect(favoriten[0].sortierung).toBe(0)
    expect(favoriten[1].sortierung).toBe(1)
    expect(favoriten[2].sortierung).toBe(2)
  })
})
