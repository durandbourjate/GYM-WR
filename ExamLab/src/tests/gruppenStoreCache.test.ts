import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Gruppe, Mitglied } from '../types/ueben/gruppen'

const ladeGruppenMock = vi.fn<(email: string) => Promise<Gruppe[]>>()
const ladeMitgliederMock = vi.fn<(gruppeId: string) => Promise<Mitglied[]>>()

vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenGruppenAdapter: {
    ladeGruppen: (email: string) => ladeGruppenMock(email),
    ladeMitglieder: (gruppeId: string) => ladeMitgliederMock(gruppeId),
  },
}))

import { useUebenGruppenStore } from '../store/ueben/gruppenStore'
import {
  clearGruppenCache,
  setCachedGruppen,
  setCachedMitglieder,
  getCachedGruppen,
} from '../services/gruppenCache'

const g1: Gruppe = {
  id: 'g1', name: 'Klasse 27a', typ: 'gym', adminEmail: 'lp@gymhofwil.ch',
  fragebankSheetId: 's1', analytikSheetId: 'a1', mitglieder: [],
}
const m1: Mitglied[] = [
  { email: 'a@stud.gymhofwil.ch', name: 'A.', rolle: 'lernend', beigetreten: '2026-04-01' },
]

describe('G.d.2 — gruppenStore Cache-Erweiterung', () => {
  beforeEach(async () => {
    await clearGruppenCache()
    try { localStorage.removeItem('ueben-letzte-gruppe-id') } catch {/* */}
    useUebenGruppenStore.setState({ gruppen: [], aktiveGruppe: null, mitglieder: [], ladeStatus: 'idle' })
    ladeGruppenMock.mockReset()
    ladeMitgliederMock.mockReset()
  })

  it('ladeGruppen() Cache-Hit: keine API-Calls, Auto-Select läuft trotzdem', async () => {
    await setCachedGruppen([g1])
    await setCachedMitglieder('g1', m1)
    ladeGruppenMock.mockResolvedValue([])
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch')

    expect(ladeGruppenMock).not.toHaveBeenCalled()
    expect(ladeMitgliederMock).not.toHaveBeenCalled()
    const state = useUebenGruppenStore.getState()
    expect(state.gruppen).toEqual([g1])
    // Auto-Select bei genau 1 Gruppe:
    expect(state.aktiveGruppe?.id).toBe('g1')
    expect(state.mitglieder).toEqual(m1)
  })

  it('ladeGruppen() Cache-Miss: API + Cache-Write', async () => {
    ladeGruppenMock.mockResolvedValue([g1])
    ladeMitgliederMock.mockResolvedValue(m1)

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch')

    expect(ladeGruppenMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(ladeMitgliederMock).toHaveBeenCalledWith('g1')
    expect(await getCachedGruppen()).toEqual([g1])
  })

  it('ladeGruppen({force:true}) ignoriert Cache', async () => {
    await setCachedGruppen([g1])
    ladeGruppenMock.mockResolvedValue([{ ...g1, name: 'NEUER NAME' }])
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().ladeGruppen('lp@gymhofwil.ch', { force: true })

    expect(ladeGruppenMock).toHaveBeenCalledTimes(1)
    expect(useUebenGruppenStore.getState().gruppen[0].name).toBe('NEUER NAME')
  })

  it('waehleGruppe() Cache-Hit: keine ladeMitglieder-API-Call', async () => {
    useUebenGruppenStore.setState({ gruppen: [g1], aktiveGruppe: null, mitglieder: [], ladeStatus: 'fertig' })
    await setCachedMitglieder('g1', m1)
    ladeMitgliederMock.mockResolvedValue([])

    await useUebenGruppenStore.getState().waehleGruppe('g1')

    expect(ladeMitgliederMock).not.toHaveBeenCalled()
    expect(useUebenGruppenStore.getState().mitglieder).toEqual(m1)
  })

  it('reset() leert State + awaitet clearGruppenCache', async () => {
    await setCachedGruppen([g1])
    useUebenGruppenStore.setState({ gruppen: [g1], aktiveGruppe: g1, mitglieder: m1, ladeStatus: 'fertig' })

    await useUebenGruppenStore.getState().reset()

    const state = useUebenGruppenStore.getState()
    expect(state.gruppen).toEqual([])
    expect(state.aktiveGruppe).toBeNull()
    expect(state.mitglieder).toEqual([])
    expect(state.ladeStatus).toBe('idle')
    expect(await getCachedGruppen()).toBeNull()
  })
})
