import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import KlassenlistenTab from './KlassenlistenTab'

const mockEintraege = [
  { vorname: 'Anna', name: 'Müller', email: 'anna.m@stud.gymhofwil.ch', klasse: '28c', kurs: 'WR-SF' },
  { vorname: 'Ben', name: 'Schmidt', email: 'ben.s@stud.gymhofwil.ch', klasse: '27a' },
  { vorname: 'Clara', name: 'Weber', email: 'clara.w@stud.gymhofwil.ch', klasse: '28c' },
]

let mockDaten: typeof mockEintraege | null = mockEintraege
let mockLadeStatus: 'idle' | 'laden' | 'fertig' | 'fehler' = 'fertig'

vi.mock('../../../store/klassenlistenStore', () => ({
  useKlassenlistenStore: (selector: (s: { daten: typeof mockEintraege | null; ladeStatus: typeof mockLadeStatus; lade: ReturnType<typeof vi.fn> }) => unknown) =>
    selector({ daten: mockDaten, ladeStatus: mockLadeStatus, lade: vi.fn() }),
}))

vi.mock('../../../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } | null }) => unknown) =>
    selector({ user: { email: 'lp@gymhofwil.ch' } }),
}))

vi.mock('../../../hooks/useTestdatenSichtbar', () => ({
  useTestdatenSichtbar: () => true,
}))

vi.mock('../../../utils/testdaten/filter', () => ({
  filtereTestdatenWennDeaktiviert: <T,>(items: T[]) => items,
}))

beforeEach(() => {
  mockDaten = mockEintraege
  mockLadeStatus = 'fertig'
})

describe('KlassenlistenTab (Cluster C.2)', () => {
  it('zeigt alle Eintraege ohne Filter', () => {
    render(<MemoryRouter><KlassenlistenTab /></MemoryRouter>)
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Müller')).toBeInTheDocument()
    expect(screen.getByText('Ben')).toBeInTheDocument()
    expect(screen.getByText('Clara')).toBeInTheDocument()
  })

  it('Pre-Fill via ?suche= URL-Param', () => {
    render(<MemoryRouter initialEntries={['/einstellungen?tab=klassenlisten&suche=Anna']}><KlassenlistenTab /></MemoryRouter>)
    const input = screen.getByPlaceholderText(/uche.*chüler/i) as HTMLInputElement
    expect(input.value).toBe('Anna')
  })

  it('Highlight via ?schueler= URL-Param', () => {
    render(<MemoryRouter initialEntries={['/einstellungen?tab=klassenlisten&schueler=anna.m@stud.gymhofwil.ch']}><KlassenlistenTab /></MemoryRouter>)
    const annaRow = screen.getByText('Anna').closest('tr')
    expect(annaRow?.className).toMatch(/bg-violet/)
  })

  it('Skeleton bei ladeStatus=laden', () => {
    mockLadeStatus = 'laden'
    const { container } = render(<MemoryRouter><KlassenlistenTab /></MemoryRouter>)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('Empty-State wenn alle gefiltert', () => {
    render(<MemoryRouter initialEntries={['/einstellungen?tab=klassenlisten&suche=XYZ999']}><KlassenlistenTab /></MemoryRouter>)
    expect(screen.getByText(/Keine Schüler/i)).toBeInTheDocument()
  })

  it('Zähler zeigt gefiltert / total', () => {
    render(<MemoryRouter><KlassenlistenTab /></MemoryRouter>)
    expect(screen.getByText(/3 von 3/)).toBeInTheDocument()
  })
})
