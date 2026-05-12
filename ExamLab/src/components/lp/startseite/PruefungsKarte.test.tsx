import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PruefungsKarte } from './PruefungsKarte'
import type { PruefungsConfig } from '../../../types/pruefung'

const mockStammdatenStore = vi.hoisted(() => ({ lpProfil: null as { testdatenSichtbar?: boolean } | null }))
const mockFavoritenStore = vi.hoisted(() => ({
  toggleFavorit: vi.fn(),
  istFavorit: () => false,
}))

vi.mock('../../../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: typeof mockStammdatenStore) => unknown) => sel(mockStammdatenStore),
}))

vi.mock('../../../store/favoritenStore', () => ({
  useFavoritenStore: (sel: (s: typeof mockFavoritenStore) => unknown) => sel(mockFavoritenStore),
}))

const mkConfig = (over: Partial<PruefungsConfig>): PruefungsConfig => ({
  id: 'p1', titel: 'Echte Prüfung', klasse: '29c', gefaess: 'SF', semester: 'HS25',
  fachbereiche: ['WR'], datum: '2026-05-12', typ: 'summativ', modus: 'pruefung',
  dauerMinuten: 60, zeitModus: 'countdown', gesamtpunkte: 30, erlaubteKlasse: '29c',
  sebErforderlich: false, abschnitte: [],
  ...over,
} as PruefungsConfig)

const noop = () => {}

describe('PruefungsKarte — TestBadge', () => {
  it('zeigt TestBadge wenn Config Test-Marker via id-Prefix hat + testdatenSichtbar=true', () => {
    mockStammdatenStore.lpProfil = { testdatenSichtbar: true }
    render(<PruefungsKarte config={mkConfig({ id: 'test-p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('zeigt TestBadge wenn Config Test-Marker via klasse hat + testdatenSichtbar=true', () => {
    mockStammdatenStore.lpProfil = { testdatenSichtbar: true }
    render(<PruefungsKarte config={mkConfig({ id: 'p1', klasse: 'test-klasse-01' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('KEIN TestBadge wenn echte Config (kein Test-Marker)', () => {
    mockStammdatenStore.lpProfil = { testdatenSichtbar: true }
    render(<PruefungsKarte config={mkConfig({ id: 'p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })

  it('KEIN TestBadge wenn Toggle aus', () => {
    mockStammdatenStore.lpProfil = { testdatenSichtbar: false }
    render(<PruefungsKarte config={mkConfig({ id: 'test-p1' })} onBearbeiten={noop} onDuplizieren={noop} />)
    expect(screen.queryByText('Test')).not.toBeInTheDocument()
  })
})
