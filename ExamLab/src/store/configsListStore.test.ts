import { describe, it, expect, beforeEach } from 'vitest'
import { useConfigsListStore } from './configsListStore'
import type { PruefungsConfig } from '../types/pruefung'

describe('useConfigsListStore', () => {
  beforeEach(() => {
    useConfigsListStore.setState({ configs: [], istGeladen: false })
  })

  it('initial leer + nicht geladen', () => {
    const s = useConfigsListStore.getState()
    expect(s.configs).toEqual([])
    expect(s.istGeladen).toBe(false)
  })

  it('setConfigs setzt Liste + istGeladen=true', () => {
    const configs = [{ id: 'p1', titel: 'X', typ: 'summativ' } as PruefungsConfig]
    useConfigsListStore.getState().setConfigs(configs)
    const s = useConfigsListStore.getState()
    expect(s.configs).toEqual(configs)
    expect(s.istGeladen).toBe(true)
  })

  it('reset setzt zurück', () => {
    useConfigsListStore.getState().setConfigs([{ id: 'p1' } as PruefungsConfig])
    useConfigsListStore.getState().reset()
    expect(useConfigsListStore.getState().istGeladen).toBe(false)
    expect(useConfigsListStore.getState().configs).toEqual([])
  })
})
