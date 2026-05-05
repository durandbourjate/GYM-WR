/**
 * Tests für PapierkorbView — Bundle 3 Phase E.
 * Verifiziert: Mount-Load, Empty-State, Liste, Header-Anzahl, Auto-Delete-Warning,
 * Wiederherstellen + Endgültig-Löschen Buttons mit confirm-Dialog, Fehler-Banner.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../services/draftApi', () => ({
  listePapierkorb: vi.fn(),
  stelleWiederHer: vi.fn(),
  hardDeleteFrage: vi.fn(),
}))

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } | null }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch' } }),
}))

import PapierkorbView from '../components/lp/papierkorb/PapierkorbView'
import { listePapierkorb, stelleWiederHer, hardDeleteFrage } from '../services/draftApi'

interface MockOverrides {
  id?: string
  thema?: string
  fragetext?: string
  geloescht_am?: string
  fachbereich?: string
}

function mockFrage(overrides: MockOverrides = {}) {
  return {
    id: 'f1',
    typ: 'mc',
    fachbereich: 'BWL',
    thema: 'Test',
    fragetext: '?',
    punkte: 1,
    geloescht_am: new Date().toISOString(),
    autor: 'lp@gymhofwil.ch',
    optionen: [],
    tags: [],
    ...overrides,
  } as unknown as Parameters<typeof stelleWiederHer>[0] extends infer T ? T : never
  // ^ Defensive: Test-Mock, baut nur die im Test geprüften Felder
}

beforeEach(() => {
  vi.mocked(listePapierkorb).mockReset().mockResolvedValue([])
  vi.mocked(stelleWiederHer).mockReset().mockResolvedValue({ success: true, id: 'f1' })
  vi.mocked(hardDeleteFrage).mockReset().mockResolvedValue({ success: true })
})

describe('PapierkorbView', () => {
  it('ruft listePapierkorb beim mount mit eigener email', async () => {
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(listePapierkorb).toHaveBeenCalledWith({ email: 'lp@gymhofwil.ch' }),
    )
  })

  it('zeigt empty-state bei leerem Papierkorb', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([])
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(screen.getByText(/papierkorb ist leer/i)).toBeInTheDocument(),
    )
  })

  it('listet Fragen mit Thema', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([
      mockFrage({ thema: 'Bilanz-Test' }) as never,
    ])
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(screen.getByText('Bilanz-Test')).toBeInTheDocument(),
    )
  })

  it('zeigt Header mit Anzahl', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([
      mockFrage({}) as never,
      mockFrage({ id: 'f2' }) as never,
    ])
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(screen.getByText(/papierkorb \(2\)/i)).toBeInTheDocument(),
    )
  })

  it('zeigt Warning bei >83 Tage altem Eintrag (≤7 Tage bis Auto-Delete)', async () => {
    const altesGeloescht = new Date(
      Date.now() - 85 * 24 * 60 * 60 * 1000,
    ).toISOString()
    vi.mocked(listePapierkorb).mockResolvedValueOnce([
      mockFrage({ geloescht_am: altesGeloescht }) as never,
    ])
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(screen.getByText(/endgültig gelöscht/i)).toBeInTheDocument(),
    )
  })

  it('Wiederherstellen-Button ruft stelleWiederHer + entfernt Eintrag', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([mockFrage({}) as never])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<PapierkorbView />)
    await waitFor(() => screen.getByText('Test'))
    fireEvent.click(
      screen.getByRole('button', { name: /wiederherstellen/i }),
    )
    await waitFor(() =>
      expect(stelleWiederHer).toHaveBeenCalledWith({
        email: 'lp@gymhofwil.ch',
        frageId: 'f1',
        fachbereich: 'BWL',
      }),
    )
    await waitFor(() =>
      expect(screen.queryByText('Test')).not.toBeInTheDocument(),
    )
  })

  it('Endgültig-löschen-Button ruft hardDeleteFrage', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([mockFrage({}) as never])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<PapierkorbView />)
    await waitFor(() => screen.getByText('Test'))
    fireEvent.click(
      screen.getByRole('button', { name: /endgültig löschen/i }),
    )
    await waitFor(() =>
      expect(hardDeleteFrage).toHaveBeenCalledWith({
        email: 'lp@gymhofwil.ch',
        frageId: 'f1',
        fachbereich: 'BWL',
      }),
    )
  })

  it('confirm=false → API NICHT gerufen', async () => {
    vi.mocked(listePapierkorb).mockResolvedValueOnce([mockFrage({}) as never])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<PapierkorbView />)
    await waitFor(() => screen.getByText('Test'))
    fireEvent.click(
      screen.getByRole('button', { name: /wiederherstellen/i }),
    )
    expect(stelleWiederHer).not.toHaveBeenCalled()
  })

  it('Fehler bei lade → Error-Banner + Retry-Button', async () => {
    vi.mocked(listePapierkorb).mockRejectedValueOnce(new Error('Network fail'))
    render(<PapierkorbView />)
    await waitFor(() =>
      expect(screen.getByText(/fehler/i)).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: /erneut/i }),
    ).toBeInTheDocument()
  })
})
