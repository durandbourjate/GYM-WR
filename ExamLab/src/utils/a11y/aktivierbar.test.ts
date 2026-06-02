import { describe, it, expect, vi } from 'vitest'
import { aktivierbar } from './aktivierbar.ts'

function fakeKey(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as React.KeyboardEvent
}

describe('aktivierbar', () => {
  it('liefert role=button + tabIndex 0', () => {
    const p = aktivierbar(() => {})
    expect(p.role).toBe('button')
    expect(p.tabIndex).toBe(0)
  })
  it('Enter und Space lösen onAktivieren aus + preventDefault', () => {
    const fn = vi.fn()
    const p = aktivierbar(fn)
    const e1 = fakeKey('Enter')
    p.onKeyDown(e1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(e1.preventDefault).toHaveBeenCalled()
    const e2 = fakeKey(' ')
    p.onKeyDown(e2)
    expect(fn).toHaveBeenCalledTimes(2)
  })
  it('andere Tasten tun nichts', () => {
    const fn = vi.fn()
    aktivierbar(fn).onKeyDown(fakeKey('a'))
    expect(fn).not.toHaveBeenCalled()
  })
  it('disabled: tabIndex -1, keine Aktivierung', () => {
    const fn = vi.fn()
    const p = aktivierbar(fn, { disabled: true })
    expect(p.tabIndex).toBe(-1)
    p.onKeyDown(fakeKey('Enter'))
    expect(fn).not.toHaveBeenCalled()
  })
})
