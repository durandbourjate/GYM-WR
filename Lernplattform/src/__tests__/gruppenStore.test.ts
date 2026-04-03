import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adapters/appsScriptAdapter', () => ({
  gruppenAdapter: {
    ladeGruppen: vi.fn(),
    ladeMitglieder: vi.fn(),
    erstelleGruppe: vi.fn(),
    einladen: vi.fn(),
    generiereCode: vi.fn(),
  },
}))

import { useGruppenStore } from '../store/gruppenStore'
import { gruppenAdapter } from '../adapters/appsScriptAdapter'
import type { Gruppe } from '../types/gruppen'

const testGruppe: Gruppe = {
  id: 'familie-test',
  name: 'Familie Test',
  typ: 'familie',
  adminEmail: 'papa@gmail.com',
  fragebankSheetId: 'sheet-1',
  analytikSheetId: 'sheet-2',
  mitglieder: ['papa@gmail.com', 'kind@gmail.com'],
}

describe('gruppenStore', () => {
  beforeEach(() => {
    useGruppenStore.setState({
      gruppen: [],
      aktiveGruppe: null,
      mitglieder: [],
      ladeStatus: 'idle',
    })
    vi.clearAllMocks()
  })

  it('laedt Gruppen fuer E-Mail', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])
    vi.mocked(gruppenAdapter.ladeMitglieder).mockResolvedValue([])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    const state = useGruppenStore.getState()
    expect(state.gruppen).toHaveLength(1)
    expect(state.gruppen[0].id).toBe('familie-test')
  })

  it('setzt aktive Gruppe automatisch wenn nur eine vorhanden', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])
    vi.mocked(gruppenAdapter.ladeMitglieder).mockResolvedValue([])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    expect(useGruppenStore.getState().aktiveGruppe?.id).toBe('familie-test')
  })

  it('setzt aktive Gruppe NICHT automatisch wenn mehrere vorhanden', async () => {
    const zweiteGruppe: Gruppe = { ...testGruppe, id: 'schule-test', name: 'Schule' }
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe, zweiteGruppe])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')

    expect(useGruppenStore.getState().aktiveGruppe).toBeNull()
  })

  it('wechselt aktive Gruppe', async () => {
    vi.mocked(gruppenAdapter.ladeGruppen).mockResolvedValue([testGruppe])
    vi.mocked(gruppenAdapter.ladeMitglieder).mockResolvedValue([
      { email: 'kind@gmail.com', name: 'Kind', rolle: 'lernend', beigetreten: '2026-04-02' },
    ])

    await useGruppenStore.getState().ladeGruppen('papa@gmail.com')
    await useGruppenStore.getState().waehleGruppe('familie-test')

    const state = useGruppenStore.getState()
    expect(state.aktiveGruppe?.id).toBe('familie-test')
    expect(state.mitglieder).toHaveLength(1)
  })

  it('erkennt Admin-Rolle aus Gruppen-Daten', () => {
    useGruppenStore.setState({ aktiveGruppe: testGruppe })

    const istAdmin = useGruppenStore.getState().istAdmin('papa@gmail.com')
    const istNichtAdmin = useGruppenStore.getState().istAdmin('kind@gmail.com')

    expect(istAdmin).toBe(true)
    expect(istNichtAdmin).toBe(false)
  })
})
