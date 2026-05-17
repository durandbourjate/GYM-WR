import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabStarToggle } from './TabStarToggle'
import { useFavoritenStore } from '../../store/favoritenStore'
import { useStammdatenStore } from '../../store/stammdatenStore'

describe('TabStarToggle', () => {
  beforeEach(() => {
    useFavoritenStore.getState().reset()
    useStammdatenStore.setState({ lpProfil: null })
  })

  it('rendert Outlined-Star wenn nicht Favorit', () => {
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" />)
    const button = screen.getByRole('button', { name: /Zu Favoriten hinzufügen/i })
    expect(button.querySelector('svg.lucide-star')).toBeTruthy()
    expect(button.querySelector('svg')?.classList.contains('fill-current')).toBe(false)
  })

  it('rendert Filled-Star wenn Favorit', () => {
    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'profil', label: 'Profil', sortierung: 0 }],
    })
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" />)
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg?.classList.contains('fill-current')).toBe(true)
  })

  it('toggelt Favorit beim Klick (einstellungen-Surface)', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<TabStarToggle tabId="profil" surface="einstellungen" label="Profil" icon="User" />)
    fireEvent.click(screen.getByRole('button'))
    expect(toggleSpy).toHaveBeenCalledWith({
      typ: 'einstellungen-tab', ziel: 'profil', label: 'Profil', icon: 'User',
    })
  })

  it('toggelt Favorit beim Klick (hilfe-Surface)', () => {
    const toggleSpy = vi.spyOn(useFavoritenStore.getState(), 'toggleFavorit')
    render(<TabStarToggle tabId="einstieg" surface="hilfe" label="Erste Schritte" />)
    fireEvent.click(screen.getByRole('button'))
    expect(toggleSpy).toHaveBeenCalledWith({
      typ: 'hilfe-tab', ziel: 'einstieg', label: 'Erste Schritte', icon: undefined,
    })
  })

  it('aria-label wechselt je nach Favorit-Zustand', () => {
    const { rerender } = render(<TabStarToggle tabId="x" surface="einstellungen" label="X" />)
    expect(screen.getByRole('button', { name: /Zu Favoriten hinzufügen/i })).toBeTruthy()

    useFavoritenStore.setState({
      favoriten: [{ typ: 'einstellungen-tab', ziel: 'x', label: 'X', sortierung: 0 }],
    })
    rerender(<TabStarToggle tabId="x" surface="einstellungen" label="X" />)
    expect(screen.getByRole('button', { name: /Aus Favoriten entfernen/i })).toBeTruthy()
  })
})
