import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TestdatenTab from './TestdatenTab'
import type { Stammdaten, LPProfil } from '../../../types/stammdaten'

const speichereLPProfil = vi.fn()
const istAdminFn = vi.fn(() => false)
const toastAdd = vi.fn()

const storeState = { stammdaten: null as Stammdaten | null, lpProfil: null as LPProfil | null }

vi.mock('../../../store/stammdatenStore', () => ({
  useStammdatenStore: (sel?: any) => {
    const state = { stammdaten: storeState.stammdaten, lpProfil: storeState.lpProfil, speichereLPProfil, istAdmin: istAdminFn }
    return sel ? sel(state) : state
  },
}))

vi.mock('../../../store/toastStore', () => ({
  useToastStore: Object.assign(
    (sel?: any) => (sel ? sel({ add: toastAdd }) : { add: toastAdd }),
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

  it('zeigt Status „nicht initialisiert" wenn Marker fehlen', () => {
    storeState.stammdaten = echteSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.getByText(/Noch nicht erzeugt/)).toBeInTheDocument()
  })

  it('zeigt Status „initialisiert" wenn Marker vorhanden', () => {
    storeState.stammdaten = initSD
    storeState.lpProfil = { email: 'lp@x.ch', kursIds: [], fachschaftIds: [], gefaesse: [] }
    render(<TestdatenTab email="lp@x.ch" />)
    expect(screen.getByText(/Initialisiert/)).toBeInTheDocument()
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
