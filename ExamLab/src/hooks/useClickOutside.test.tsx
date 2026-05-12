import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useClickOutside } from './useClickOutside'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('useClickOutside', () => {
  it('ruft callback bei mousedown ausserhalb', () => {
    const cb = vi.fn()
    const wrapper = document.createElement('div')
    document.body.appendChild(wrapper)
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(wrapper)
      useClickOutside(ref, cb)
    })
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(cb).toHaveBeenCalled()
  })

  it('ruft callback NICHT bei mousedown innerhalb', () => {
    const cb = vi.fn()
    const wrapper = document.createElement('div')
    const child = document.createElement('span')
    wrapper.appendChild(child)
    document.body.appendChild(wrapper)
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(wrapper)
      useClickOutside(ref, cb)
    })
    child.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(cb).not.toHaveBeenCalled()
  })
})
