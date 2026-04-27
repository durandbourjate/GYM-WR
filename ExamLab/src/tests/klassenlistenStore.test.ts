import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { KlassenlistenEintrag } from '../services/klassenlistenApi'

// API-Schicht mocken — wir testen den Store, nicht das echte Backend
const ladeMock = vi.fn<(email: string) => Promise<KlassenlistenEintrag[]>>()
vi.mock('../services/apiService', () => ({
  apiService: { ladeKlassenlisten: (email: string) => ladeMock(email) },
}))

const sample: KlassenlistenEintrag[] = [
  { klasse: '27a', email: 'a@stud.gymhofwil.ch', name: 'A.', vorname: 'Alex' },
]

import { useKlassenlistenStore } from '../store/klassenlistenStore'
import { clearKlassenlistenCache, setCachedKlassenlisten } from '../services/klassenlistenCache'

describe('G.d.2 — klassenlistenStore', () => {
  beforeEach(async () => {
    await clearKlassenlistenCache()
    useKlassenlistenStore.setState({ daten: null, ladeStatus: 'idle' })
    ladeMock.mockReset()
  })

  it('lade() Cache-Hit: liest aus IDB, ruft API NICHT', async () => {
    await setCachedKlassenlisten(sample)
    ladeMock.mockResolvedValue([])
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().daten).toEqual(sample)
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fertig')
    expect(ladeMock).not.toHaveBeenCalled()
  })

  it('lade() Cache-Miss: API-Call + schreibt Cache', async () => {
    ladeMock.mockResolvedValue(sample)
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(ladeMock).toHaveBeenCalledWith('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().daten).toEqual(sample)
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fertig')
    // Cache muss jetzt befüllt sein:
    const { getCachedKlassenlisten } = await import('../services/klassenlistenCache')
    expect(await getCachedKlassenlisten()).toEqual(sample)
  })

  it('lade({force:true}) ignoriert Cache, ruft IMMER API', async () => {
    await setCachedKlassenlisten(sample)
    ladeMock.mockResolvedValue([{ ...sample[0], name: 'NEU' }])
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch', { force: true })
    expect(ladeMock).toHaveBeenCalledTimes(1)
    expect(useKlassenlistenStore.getState().daten?.[0].name).toBe('NEU')
  })

  it('reset() leert State + awaitet clearKlassenlistenCache', async () => {
    await setCachedKlassenlisten(sample)
    useKlassenlistenStore.setState({ daten: sample, ladeStatus: 'fertig' })
    await useKlassenlistenStore.getState().reset()
    expect(useKlassenlistenStore.getState().daten).toBeNull()
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('idle')
    const { getCachedKlassenlisten } = await import('../services/klassenlistenCache')
    expect(await getCachedKlassenlisten()).toBeNull()
  })

  it('lade() API-Fehler: ladeStatus="fehler", State bleibt', async () => {
    ladeMock.mockRejectedValue(new Error('Backend down'))
    await useKlassenlistenStore.getState().lade('lp@gymhofwil.ch')
    expect(useKlassenlistenStore.getState().ladeStatus).toBe('fehler')
    expect(useKlassenlistenStore.getState().daten).toBeNull()
  })
})
