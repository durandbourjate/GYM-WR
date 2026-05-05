import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearDraftIDBCache } from './draftCache'

vi.mock('idb-keyval', () => ({
  keys: vi.fn(),
  del: vi.fn().mockResolvedValue(undefined),
}))

import { keys as idbKeys, del as idbDel } from 'idb-keyval'

beforeEach(() => {
  vi.mocked(idbKeys).mockReset()
  vi.mocked(idbDel).mockReset().mockResolvedValue(undefined)
})

describe('clearDraftIDBCache', () => {
  it('löscht nur Keys mit draft:-Prefix', async () => {
    vi.mocked(idbKeys).mockResolvedValueOnce([
      'draft:f1',
      'draft:f2',
      'lp-fragen-bwl',
      'lp-fortschritt',
      'draft:f3',
    ])
    await clearDraftIDBCache()
    expect(idbDel).toHaveBeenCalledTimes(3)
    expect(idbDel).toHaveBeenCalledWith('draft:f1')
    expect(idbDel).toHaveBeenCalledWith('draft:f2')
    expect(idbDel).toHaveBeenCalledWith('draft:f3')
  })

  it('Non-string Keys (z.B. number) werden ignoriert', async () => {
    vi.mocked(idbKeys).mockResolvedValueOnce(['draft:f1', 42, 'lp-foo'] as IDBValidKey[])
    await clearDraftIDBCache()
    expect(idbDel).toHaveBeenCalledTimes(1)
    expect(idbDel).toHaveBeenCalledWith('draft:f1')
  })

  it('NoOp wenn keine draft-Keys vorhanden', async () => {
    vi.mocked(idbKeys).mockResolvedValueOnce(['lp-fragen-bwl', 'lp-fortschritt'])
    await clearDraftIDBCache()
    expect(idbDel).not.toHaveBeenCalled()
  })

  it('await tx.oncomplete: del-Promise wird awaited', async () => {
    let delResolve: () => void = () => {}
    vi.mocked(idbDel).mockImplementationOnce(() => new Promise<void>((res) => { delResolve = res }))
    vi.mocked(idbKeys).mockResolvedValueOnce(['draft:f1'])
    const promise = clearDraftIDBCache()
    // Promise sollte noch nicht resolved sein
    let resolved = false
    promise.then(() => { resolved = true })
    await new Promise(r => setTimeout(r, 0))
    expect(resolved).toBe(false)
    delResolve()
    await promise
    expect(resolved).toBe(true)
  })

  it('Fehler in keys() wird geschluckt (kein throw)', async () => {
    vi.mocked(idbKeys).mockRejectedValueOnce(new Error('IDB unavailable'))
    await expect(clearDraftIDBCache()).resolves.toBeUndefined()
  })

  it('Fehler in del() wird geschluckt (kein throw)', async () => {
    vi.mocked(idbKeys).mockResolvedValueOnce(['draft:f1', 'draft:f2'])
    vi.mocked(idbDel).mockRejectedValueOnce(new Error('IDB locked'))
    await expect(clearDraftIDBCache()).resolves.toBeUndefined()
    // Erster del() failt → try/catch schluckt → kein 2. del() (sequenziell bricht ab)
  })
})
