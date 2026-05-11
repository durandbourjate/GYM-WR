import { describe, it, expect, vi } from 'vitest'
import { optimisticDelete } from './optimisticDelete'

describe('optimisticDelete', () => {
  it('Happy Path: optimisticRemove → backendCall → onSuccess', async () => {
    const optimisticRemove = vi.fn()
    const backendCall = vi.fn().mockResolvedValue(undefined)
    const rollback = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await optimisticDelete({ optimisticRemove, backendCall, rollback, onSuccess, onError })

    expect(optimisticRemove).toHaveBeenCalledOnce()
    expect(backendCall).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(rollback).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it('Error-Pfad: backendCall throws → rollback + onError mit Original-Error', async () => {
    const error = new Error('network')
    const optimisticRemove = vi.fn()
    const backendCall = vi.fn().mockRejectedValue(error)
    const rollback = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    await optimisticDelete({ optimisticRemove, backendCall, rollback, onSuccess, onError })

    expect(optimisticRemove).toHaveBeenCalledOnce()
    expect(rollback).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(error)
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('Call-Reihenfolge: remove vor backend, rollback vor onError', async () => {
    const order: string[] = []
    await optimisticDelete({
      optimisticRemove: () => { order.push('remove') },
      backendCall: async () => { order.push('backend'); throw new Error('x') },
      rollback: () => { order.push('rollback') },
      onSuccess: () => { order.push('success') },
      onError: () => { order.push('error') },
    })
    expect(order).toEqual(['remove', 'backend', 'rollback', 'error'])
  })

  it('Non-Error-Throw wird in Error gewrappt', async () => {
    const onError = vi.fn()
    await optimisticDelete({
      optimisticRemove: () => {},
      backendCall: async () => { throw 'string-error' },
      rollback: () => {},
      onSuccess: () => {},
      onError,
    })
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
    expect((onError.mock.calls[0][0] as Error).message).toBe('string-error')
  })
})
