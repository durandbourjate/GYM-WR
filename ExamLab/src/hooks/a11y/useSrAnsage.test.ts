import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSrAnsage } from './useSrAnsage.ts'

describe('useSrAnsage', () => {
  it('ansage() setzt ansageText', () => {
    const { result } = renderHook(() => useSrAnsage())
    expect(result.current.ansageText).toBe('')
    act(() => result.current.ansage('«Konjunktur» in Zone 2 platziert'))
    expect(result.current.ansageText).toBe('«Konjunktur» in Zone 2 platziert')
  })
})
