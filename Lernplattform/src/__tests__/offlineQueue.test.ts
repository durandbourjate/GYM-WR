import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock idb-keyval before importing the module
const store = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: (key: string) => Promise.resolve(store.get(key)),
  set: (key: string, val: unknown) => { store.set(key, val); return Promise.resolve() },
  clear: () => { store.clear(); return Promise.resolve() },
}))

import { enqueue, getQueue, clearQueue, removeFromQueue } from '../utils/offlineQueue'

describe('offlineQueue', () => {
  beforeEach(() => { store.clear() })

  it('enqueue und getQueue', async () => {
    await enqueue('test', { foo: 'bar' })
    const q = await getQueue()
    expect(q).toHaveLength(1)
    expect(q[0].action).toBe('test')
    expect(q[0].payload).toEqual({ foo: 'bar' })
  })

  it('removeFromQueue', async () => {
    await enqueue('a', {})
    await enqueue('b', {})
    const q = await getQueue()
    await removeFromQueue(q[0].id)
    expect(await getQueue()).toHaveLength(1)
  })

  it('clearQueue', async () => {
    await enqueue('a', {})
    await clearQueue()
    expect(await getQueue()).toHaveLength(0)
  })
})
