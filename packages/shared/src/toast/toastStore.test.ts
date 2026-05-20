import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useToastStore, DEFAULT_TOAST_AUTO_HIDE_MS } from './toastStore'

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
    vi.useRealTimers()
  })

  it('add() liefert id und legt Toast in Liste', () => {
    const id = useToastStore.getState().add('error', 'Boom')
    expect(typeof id).toBe('string')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0].variant).toBe('error')
    expect(useToastStore.getState().toasts[0].message).toBe('Boom')
  })

  it('error ist standardmässig sticky, success/info/warning nicht', () => {
    const errId = useToastStore.getState().add('error', 'X')
    const sucId = useToastStore.getState().add('success', 'Y')
    const infId = useToastStore.getState().add('info', 'Z')
    const warId = useToastStore.getState().add('warning', 'W')
    const t = useToastStore.getState().toasts
    expect(t.find(x => x.id === errId)?.sticky).toBe(true)
    expect(t.find(x => x.id === sucId)?.sticky).toBe(false)
    expect(t.find(x => x.id === infId)?.sticky).toBe(false)
    expect(t.find(x => x.id === warId)?.sticky).toBe(false)
  })

  it('add() respektiert opts.sticky und opts.autoHideMs', () => {
    useToastStore.getState().add('error', 'X', { sticky: false })
    useToastStore.getState().add('info', 'Y', { sticky: true })
    const t = useToastStore.getState().toasts
    expect(t[0].sticky).toBe(false)
    expect(t[1].sticky).toBe(true)
  })

  it('dismiss(id) entfernt Toast aus Liste', () => {
    const id = useToastStore.getState().add('error', 'X')
    useToastStore.getState().add('info', 'Y')
    useToastStore.getState().dismiss(id)
    const t = useToastStore.getState().toasts
    expect(t).toHaveLength(1)
    expect(t[0].variant).toBe('info')
  })

  it('clear() entfernt alle Toasts', () => {
    useToastStore.getState().add('error', 'X')
    useToastStore.getState().add('info', 'Y')
    useToastStore.getState().clear()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('non-sticky Toast verschwindet nach DEFAULT_TOAST_AUTO_HIDE_MS', async () => {
    vi.useFakeTimers()
    useToastStore.getState().add('success', 'Y')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS - 1)
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('sticky Toast verschwindet NICHT nach Auto-Hide-Zeit', () => {
    vi.useFakeTimers()
    useToastStore.getState().add('error', 'X')
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS * 5)
    expect(useToastStore.getState().toasts).toHaveLength(1)
  })

  it('manuelles dismiss greift auch bei laufendem Auto-Hide-Timer', () => {
    vi.useFakeTimers()
    const id = useToastStore.getState().add('success', 'X')
    useToastStore.getState().dismiss(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
    vi.advanceTimersByTime(DEFAULT_TOAST_AUTO_HIDE_MS * 2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('autoHideMs override greift', () => {
    vi.useFakeTimers()
    useToastStore.getState().add('info', 'X', { autoHideMs: 1000 })
    vi.advanceTimersByTime(999)
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(2)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
