import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFavoritenStore, selectFavoritenSortiert } from './favoritenStore'
import { useStammdatenStore } from './stammdatenStore'
import { useToastStore } from './toastStore'

describe('favoritenStore', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({ lpProfil: null })
  })

  it('fügt einen Ort-Favoriten hinzu', async () => {
    await useFavoritenStore.getState().toggleFavorit({
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

  it('entfernt einen bestehenden Favoriten per Toggle', async () => {
    const fav = { typ: 'ort' as const, ziel: '/fragensammlung', label: 'Fragensammlung' }
    await useFavoritenStore.getState().toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    await useFavoritenStore.getState().toggleFavorit(fav)
    expect(useFavoritenStore.getState().favoriten).toHaveLength(0)
  })

  it('sortiert Favoriten nach sortierung', async () => {
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 2 })
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    const sorted = selectFavoritenSortiert(useFavoritenStore.getState())
    expect(sorted[0].label).toBe('B')
    expect(sorted[1].label).toBe('A')
  })

  it('aktualisiert Sortierung per updateSortierung', async () => {
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 })
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B', sortierung: 1 })
    await useFavoritenStore.getState().updateSortierung(['/b', '/a'])
    const sorted = selectFavoritenSortiert(useFavoritenStore.getState())
    expect(sorted[0].ziel).toBe('/b')
    expect(sorted[1].ziel).toBe('/a')
  })

  it('prüft istFavorit korrekt', async () => {
    await useFavoritenStore.getState().toggleFavorit({ typ: 'pruefung', ziel: 'abc123', label: 'Test' })
    expect(useFavoritenStore.getState().istFavorit('abc123')).toBe(true)
    expect(useFavoritenStore.getState().istFavorit('xyz789')).toBe(false)
  })

  it('entfernt Favorit per entferneFavorit', async () => {
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B' })
    await useFavoritenStore.getState().entferneFavorit('/a')
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(useFavoritenStore.getState().favoriten[0].ziel).toBe('/b')
  })

  it('vergibt automatisch aufsteigende Sortierung', async () => {
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/b', label: 'B' })
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/c', label: 'C' })
    const { favoriten } = useFavoritenStore.getState()
    expect(favoriten[0].sortierung).toBe(0)
    expect(favoriten[1].sortierung).toBe(1)
    expect(favoriten[2].sortierung).toBe(2)
  })
})

describe('favoritenStore — Backend-Sync (Cluster E.3)', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({ lpProfil: null })
  })

  it('ladeAusBackend hydratet aus stammdatenStore.lpProfil', async () => {
    useStammdatenStore.setState({
      lpProfil: {
        email: 'lp@test.ch',
        kursIds: [],
        fachschaftIds: [],
        gefaesse: [],
        favoriten: [{ typ: 'ort', ziel: '/a', label: 'A', sortierung: 0 }],
      },
    })
    await useFavoritenStore.getState().ladeAusBackend()
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(useFavoritenStore.getState().favoriten[0].ziel).toBe('/a')
    expect(useFavoritenStore.getState().ladeStatus).toBe('fertig')
  })

  it('ladeAusBackend bei fehlendem lpProfil setzt leere Liste', async () => {
    await useFavoritenStore.getState().ladeAusBackend()
    expect(useFavoritenStore.getState().favoriten).toEqual([])
    expect(useFavoritenStore.getState().ladeStatus).toBe('fertig')
  })

  it('toggleFavorit Demo-Mode: kein lpProfil → kein speichereLPProfil-Call', async () => {
    const speichereSpy = vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil')
    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })
    expect(useFavoritenStore.getState().favoriten).toHaveLength(1)
    expect(speichereSpy).not.toHaveBeenCalled()
  })

  it('toggleFavorit mit lpProfil ruft speichereLPProfil mit komplettem Profil + neuer Liste', async () => {
    const lpProfil = {
      email: 'lp@test.ch',
      kursIds: ['k1'],
      fachschaftIds: ['f1'],
      gefaesse: ['SF'],
      favoriten: [],
    }
    useStammdatenStore.setState({ lpProfil })
    const speichereSpy = vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil').mockResolvedValue(true)

    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })

    expect(speichereSpy).toHaveBeenCalledOnce()
    const arg = speichereSpy.mock.calls[0][0]
    expect(arg.kursIds).toEqual(['k1'])  // andere Felder erhalten
    expect(arg.favoriten).toHaveLength(1)
    expect(arg.favoriten?.[0].ziel).toBe('/a')
  })

  it('toggleFavorit bei Save-Fehler triggert Toast + Refetch', async () => {
    const lpProfil = { email: 'lp@test.ch', kursIds: [], fachschaftIds: [], gefaesse: [], favoriten: [] }
    useStammdatenStore.setState({ lpProfil })
    vi.spyOn(useStammdatenStore.getState(), 'speichereLPProfil').mockResolvedValue(false)
    const ladeLPSpy = vi.spyOn(useStammdatenStore.getState(), 'ladeLPProfil').mockResolvedValue()
    const toastSpy = vi.spyOn(useToastStore.getState(), 'add')

    await useFavoritenStore.getState().toggleFavorit({ typ: 'ort', ziel: '/a', label: 'A' })

    expect(toastSpy).toHaveBeenCalledWith('error', expect.stringContaining('nicht synchronisiert'))
    expect(ladeLPSpy).toHaveBeenCalledWith('lp@test.ch')
  })
})
