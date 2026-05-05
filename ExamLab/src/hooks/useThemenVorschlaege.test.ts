import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useThemenVorschlaege } from './useThemenVorschlaege'

vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: (selector: (s: { summaries: Array<{ thema: string; fachbereich: string }> }) => unknown) =>
    selector({
      summaries: [
        { thema: 'Konjunktur', fachbereich: 'VWL' },
        { thema: 'Konjunktur', fachbereich: 'VWL' }, // Duplikat
        { thema: 'Inflation', fachbereich: 'VWL' },
        { thema: 'Buchungssatz', fachbereich: 'BWL' },
        { thema: '', fachbereich: 'VWL' }, // leer, soll rausgefiltert werden
      ],
    }),
}))

describe('useThemenVorschlaege', () => {
  it('liefert Themen aus dem Fachbereich, dedupliziert + sortiert + leer-frei', () => {
    const { result } = renderHook(() => useThemenVorschlaege('VWL'))
    expect(result.current).toEqual(['Inflation', 'Konjunktur'])
  })

  it('liefert leeres Array wenn Fachbereich keine Treffer hat', () => {
    const { result } = renderHook(() => useThemenVorschlaege('Recht'))
    expect(result.current).toEqual([])
  })

  it('liefert leeres Array wenn fachbereich undefined', () => {
    const { result } = renderHook(() => useThemenVorschlaege(undefined))
    expect(result.current).toEqual([])
  })
})
