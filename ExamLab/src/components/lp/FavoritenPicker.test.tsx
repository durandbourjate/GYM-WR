import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FavoritenPicker } from './FavoritenPicker'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useStammdatenStore } from '../../store/stammdatenStore'

describe('FavoritenPicker', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({
      stammdaten: { ...useStammdatenStore.getState().stammdaten, admins: ['lp@test.ch'] },
      lpProfil: null,
    })
  })

  it('rendert nichts wenn open=false', () => {
    const { container } = render(<FavoritenPicker open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('rendert Einstellungen- und Hilfe-Tabs aus Registry', () => {
    render(<FavoritenPicker open onClose={() => {}} />)
    expect(screen.getByText('Mein Profil')).toBeTruthy()
    expect(screen.getByText('Erste Schritte')).toBeTruthy()
  })

  it('zeigt "Bereits Favorit" Status für existierende Favoriten', () => {
    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'profil', label: 'Mein Profil', sortierung: 0 }],
    })
    render(<FavoritenPicker open onClose={() => {}} />)
    expect(screen.getByText(/Bereits Favorit/i)).toBeTruthy()
  })

  it('Klick auf Hinzufügen-Button triggert toggleFavorit', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<FavoritenPicker open onClose={() => {}} />)
    const firstAdd = screen.getAllByRole('button', { name: /Hinzufügen/i })[0]
    fireEvent.click(firstAdd)
    expect(toggleSpy).toHaveBeenCalled()
  })

  it('Filter-Eingabe reduziert die Liste', () => {
    render(<FavoritenPicker open onClose={() => {}} />)
    const input = screen.getByRole('textbox', { name: /Suche/i })
    fireEvent.change(input, { target: { value: 'profil' } })
    expect(screen.getByText('Mein Profil')).toBeTruthy()
    expect(screen.queryByText('Erste Schritte')).toBeNull()
  })
})
