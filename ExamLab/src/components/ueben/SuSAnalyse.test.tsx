import { describe, test, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import SuSAnalyse from './SuSAnalyse'

// Mock alle Store-Hooks und den Adapter
vi.mock('../../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: () => ({ aktiveGruppe: { id: 'g1', name: 'Gruppe' } }),
}))
vi.mock('../../store/ueben/fortschrittStore', () => ({
  useUebenFortschrittStore: () => ({
    fortschritte: {},
    getThemenFortschritt: () => ({ quote: 0, gesamt: 0 }),
  }),
}))
vi.mock('../../hooks/ueben/useUebenKontext', () => ({
  useUebenKontext: () => ({ fachFarben: {} }),
}))
vi.mock('../../store/ueben/themenSichtbarkeitStore', () => ({
  useThemenSichtbarkeitStore: () => ({ freischaltungen: [], getStatus: () => 'aktiv' }),
}))
vi.mock('../../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: () => new Promise(() => { /* never resolves — Timer steht im Vordergrund */ }),
  },
}))
vi.mock('../../store/authStore', () => ({
  useAuthStore: { getState: () => ({ istDemoModus: false }) },
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SuSAnalyse — Timer-Cleanup', () => {
  test('15s-setTimeout wird beim Unmount ge-cleared', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = render(<SuSAnalyse />)
    // Beim Mount: setTimeout(15000) wird gestartet
    unmount()
    // Beim Unmount: cleanup soll clearTimeout aufrufen
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })
})
