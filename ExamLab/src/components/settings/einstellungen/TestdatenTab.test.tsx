import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TestdatenTab from './TestdatenTab'
import { apiAdminSeedTestdaten } from '../../../services/testdatenApi'
import type { Stammdaten, LPProfil } from '../../../types/stammdaten'

vi.mock('../../../services/testdatenApi', () => ({
  apiAdminSeedTestdaten: vi.fn(),
}))

// Mock apiService für useTestdatenStatus — Default: keine Test-Prüfungen (initialisiert=false)
vi.mock('../../../services/apiService', () => ({
  apiService: {
    ladeAlleConfigs: vi.fn().mockResolvedValue([]),
  },
}))

const speichereLPProfil = vi.fn()
const istAdminFn = vi.fn(() => false)
const toastAdd = vi.fn()

const storeState = { stammdaten: null as Stammdaten | null, lpProfil: null as LPProfil | null }

interface MockStammdatenState {
  stammdaten: Stammdaten | null
  lpProfil: LPProfil | null
  speichereLPProfil: typeof speichereLPProfil
  istAdmin: typeof istAdminFn
}

vi.mock('../../../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: (s: MockStammdatenState) => unknown) => {
    const state: MockStammdatenState = { stammdaten: storeState.stammdaten, lpProfil: storeState.lpProfil, speichereLPProfil, istAdmin: istAdminFn }
    return sel(state)
  },
}))

interface MockToastState { add: typeof toastAdd }

vi.mock('../../../store/toastStore', () => ({
  useToastStore: Object.assign(
    (sel: (s: MockToastState) => unknown) => sel({ add: toastAdd }),
    { getState: () => ({ add: toastAdd }) },
  ),
}))

const echteSD: Stammdaten = {
  fachschaften: [], klassen: ['29c'],
  kurse: [{ id: 'sf-wr-29c', name: 'SF WR', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }],
  admins: [], gefaesse: [], faecher: [],
}
const initSD: Stammdaten = {
  ...echteSD,
  klassen: [...echteSD.klassen, 'test-klasse-01'],
  kurse: [...echteSD.kurse, { id: 'test-kurs-01', name: '[Test] Kurs', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['test-klasse-01'] }],
}

describe('TestdatenTab — Status + Toggle', () => {
  beforeEach(() => {
    storeState.stammdaten = null
    storeState.lpProfil = null
    speichereLPProfil.mockReset()
    toastAdd.mockReset()
    istAdminFn.mockImplementation(() => false)
  })

  it('zeigt Status „nicht initialisiert" wenn keine Test-Marker vorhanden (Stammdaten + Pruefungen leer)', async () => {
    storeState.stammdaten = echteSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    // Hook macht async apiService-Call → erst Loading, dann fertig
    await waitFor(() => expect(screen.getByText(/Noch nicht erzeugt/)).toBeInTheDocument())
  })

  it('zeigt Status „initialisiert" wenn Stammdaten-Marker vorhanden', async () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    await waitFor(() => expect(screen.getByText(/Initialisiert/)).toBeInTheDocument())
  })

  it('Toggle gespiegelt aus lpProfil.testdatenSichtbar (default false)', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    const checkbox = screen.getByLabelText(/Testdaten in meinen Listen anzeigen/) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('Toggle speichert testdatenSichtbar=true bei Click', async () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    speichereLPProfil.mockResolvedValue(true)
    render(<TestdatenTab email="lp@x.ch" />)
    fireEvent.click(screen.getByLabelText(/Testdaten in meinen Listen anzeigen/))
    await waitFor(() => expect(speichereLPProfil).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'lp@x.ch', testdatenSichtbar: true })
    ))
  })

  it('Toggle Fehler-Pfad: Toast mit error wird ausgelöst', async () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    speichereLPProfil.mockResolvedValue(false)
    render(<TestdatenTab email="lp@x.ch" />)
    fireEvent.click(screen.getByLabelText(/Testdaten in meinen Listen anzeigen/))
    await waitFor(() => expect(toastAdd).toHaveBeenCalledWith('error', expect.stringContaining('konnte nicht gespeichert')))
  })

  it('Admin-Sektion C nicht sichtbar bei non-Admin', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    istAdminFn.mockImplementation(() => false)
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.queryByRole('button', { name: /Erzeugen/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).not.toBeInTheDocument()
  })
})

describe('TestdatenTab — Admin-Sektion', () => {
  beforeEach(() => {
    speichereLPProfil.mockReset()
    toastAdd.mockReset()
    istAdminFn.mockImplementation(() => true)
    storeState.lpProfil = { email: 'admin@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    vi.mocked(apiAdminSeedTestdaten).mockReset()
  })

  it('Admin nicht-initialisiert: zeigt „Testdaten erzeugen"-Button + KEIN Reset', () => {
    storeState.stammdaten = echteSD
    render(<TestdatenTab email="admin@x.ch" />)
    expect(screen.getByRole('button', { name: /Testdaten erzeugen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).not.toBeInTheDocument()
  })

  it('Admin initialisiert: zeigt „Zurücksetzen"-Button + KEIN Erzeugen', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    expect(screen.getByRole('button', { name: /Zurücksetzen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Erzeugen/ })).not.toBeInTheDocument()
  })

  it('„Erzeugen" feuert apiAdminSeedTestdaten mit mode=initial', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: true, statistik: { mode: 'initial', testSuSAngelegt: 20 }, dauerMs: 30000 })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    await waitFor(() => expect(apiAdminSeedTestdaten).toHaveBeenCalledWith({ email: 'admin@x.ch', mode: 'initial' }))
  })

  it('„Zurücksetzen" öffnet ConfirmModal, nicht direkt API-Call', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    expect(apiAdminSeedTestdaten).not.toHaveBeenCalled()
  })

  it('Modal-Bestätigung feuert apiAdminSeedTestdaten mit mode=reset', async () => {
    storeState.stammdaten = initSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: true, statistik: { mode: 'reset' } })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    await waitFor(() => expect(apiAdminSeedTestdaten).toHaveBeenCalledWith({ email: 'admin@x.ch', mode: 'reset' }))
  })

  it('Modal „Abbrechen" macht keinen API-Call', () => {
    storeState.stammdaten = initSD
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(apiAdminSeedTestdaten).not.toHaveBeenCalled()
    expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument()
  })

  it('Erfolg zeigt Statistik nach Seed', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({
      success: true,
      statistik: { mode: 'initial', testSuSAngelegt: 20, testPruefungenAngelegt: 1 },
    })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    await waitFor(() => expect(screen.getByText(/20 SuS angelegt/)).toBeInTheDocument())
    expect(screen.getByText(/1 Prüfungen/)).toBeInTheDocument()
  })

  it('Fehler zeigt Error-Text', async () => {
    storeState.stammdaten = echteSD
    vi.mocked(apiAdminSeedTestdaten).mockResolvedValue({ success: false, error: 'LockService timeout' })
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Testdaten erzeugen/ }))
    await waitFor(() => expect(screen.getByText(/LockService timeout/)).toBeInTheDocument())
  })

  it('Doppel-Klick auf Erzeugen während Loading triggert nur 1 API-Call', async () => {
    storeState.stammdaten = echteSD
    let resolveSeed: ((r: Awaited<ReturnType<typeof apiAdminSeedTestdaten>>) => void) | undefined
    vi.mocked(apiAdminSeedTestdaten).mockImplementation(() => new Promise(r => { resolveSeed = r }))
    render(<TestdatenTab email="admin@x.ch" />)
    const btn = screen.getByRole('button', { name: /Testdaten erzeugen/ })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(apiAdminSeedTestdaten).toHaveBeenCalledTimes(1)
    resolveSeed?.({ success: true, statistik: { mode: 'initial' } })
  })

  it('Modal bleibt offen während Reset-Loading, schliesst erst nach Erfolg', async () => {
    storeState.stammdaten = initSD
    let resolveReset: ((r: Awaited<ReturnType<typeof apiAdminSeedTestdaten>>) => void) | undefined
    vi.mocked(apiAdminSeedTestdaten).mockImplementation(() => new Promise(r => { resolveReset = r }))
    render(<TestdatenTab email="admin@x.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /Zurücksetzen/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDisabled()
    resolveReset?.({ success: true, statistik: { mode: 'reset' } })
    await waitFor(() => expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument())
  })
})
