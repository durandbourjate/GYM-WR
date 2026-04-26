import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useEditorNeighborPrefetch } from '../hooks/useEditorNeighborPrefetch'

const ladeDetailMock = vi.fn(async () => null)

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: {
    getState: () => ({ ladeDetail: ladeDetailMock }),
  },
}))

vi.mock('../services/preWarmApi', () => ({
  PRE_WARM_ENABLED: true,
}))

interface Props {
  currentFrageId: string | null
  previous: { id: string; fachbereich: string } | null
  next: { id: string; fachbereich: string } | null
  email: string
}
function HookHost(p: Props) {
  useEditorNeighborPrefetch(p)
  return null
}

describe('useEditorNeighborPrefetch', () => {
  beforeEach(() => {
    ladeDetailMock.mockClear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ruft ladeDetail für previous und next nach 300 ms Debounce', async () => {
    render(
      <HookHost
        currentFrageId="f10"
        previous={{ id: 'f9', fachbereich: 'BWL' }}
        next={{ id: 'f11', fachbereich: 'BWL' }}
        email="lp@x.ch"
      />,
    )
    expect(ladeDetailMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)
    expect(ladeDetailMock).toHaveBeenCalledTimes(2)
    expect(ladeDetailMock).toHaveBeenCalledWith('lp@x.ch', 'f9', 'BWL')
    expect(ladeDetailMock).toHaveBeenCalledWith('lp@x.ch', 'f11', 'BWL')
  })

  it('previous=null: nur next wird geladen', async () => {
    render(
      <HookHost
        currentFrageId="f1"
        previous={null}
        next={{ id: 'f2', fachbereich: 'VWL' }}
        email="lp@x.ch"
      />,
    )
    await vi.advanceTimersByTimeAsync(300)
    expect(ladeDetailMock).toHaveBeenCalledTimes(1)
    expect(ladeDetailMock).toHaveBeenCalledWith('lp@x.ch', 'f2', 'VWL')
  })

  it('next=null: nur previous wird geladen', async () => {
    render(
      <HookHost
        currentFrageId="f99"
        previous={{ id: 'f98', fachbereich: 'Recht' }}
        next={null}
        email="lp@x.ch"
      />,
    )
    await vi.advanceTimersByTimeAsync(300)
    expect(ladeDetailMock).toHaveBeenCalledTimes(1)
  })

  it('schneller Wechsel vor Debounce-Ablauf: nur letzter Stand triggert', async () => {
    const { rerender } = render(
      <HookHost
        currentFrageId="f1"
        previous={null}
        next={{ id: 'f2', fachbereich: 'BWL' }}
        email="lp@x.ch"
      />,
    )
    await vi.advanceTimersByTimeAsync(100)
    rerender(
      <HookHost
        currentFrageId="f5"
        previous={{ id: 'f4', fachbereich: 'BWL' }}
        next={{ id: 'f6', fachbereich: 'BWL' }}
        email="lp@x.ch"
      />,
    )
    await vi.advanceTimersByTimeAsync(100)
    expect(ladeDetailMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(300)
    // Nach Debounce: nur f4 + f6 geladen, NICHT f2
    const calls = (ladeDetailMock.mock.calls as unknown as [string, string, string][]).map((c) => c[1])
    expect(calls).toContain('f4')
    expect(calls).toContain('f6')
    expect(calls).not.toContain('f2')
  })

  it('currentFrageId=null: kein Prefetch', async () => {
    render(
      <HookHost
        currentFrageId={null}
        previous={{ id: 'f1', fachbereich: 'BWL' }}
        next={{ id: 'f2', fachbereich: 'BWL' }}
        email="lp@x.ch"
      />,
    )
    await vi.advanceTimersByTimeAsync(500)
    expect(ladeDetailMock).not.toHaveBeenCalled()
  })

  it('email leer: kein Prefetch (verhindert anonyme Backend-Calls)', async () => {
    render(
      <HookHost
        currentFrageId="f1"
        previous={null}
        next={{ id: 'f2', fachbereich: 'BWL' }}
        email=""
      />,
    )
    await vi.advanceTimersByTimeAsync(500)
    expect(ladeDetailMock).not.toHaveBeenCalled()
  })

  it('Unmount vor Debounce-Ablauf: kein Aufruf, kein Crash', async () => {
    const { unmount } = render(
      <HookHost
        currentFrageId="f1"
        previous={null}
        next={{ id: 'f2', fachbereich: 'BWL' }}
        email="lp@x.ch"
      />,
    )
    unmount()
    await vi.advanceTimersByTimeAsync(500)
    expect(ladeDetailMock).not.toHaveBeenCalled()
  })
})
