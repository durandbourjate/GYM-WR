/**
 * Tests für FragenSelektionBar.tsx (Cluster D Phase 2).
 *
 * Echter Store wird verwendet (Phase-1a-Tests zeigen: ist schneller + zuverlässig
 * als vi.mock). beforeEach leert die Selektion.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import FragenSelektionBar from './FragenSelektionBar'
import { useFragenSelectionStore } from '../../../../store/fragenSelectionStore.ts'

beforeEach(() => {
  useFragenSelectionStore.getState().leereSelektion()
})

describe('FragenSelektionBar', () => {
  it('rendert nichts wenn keine Selektion', () => {
    const { container } = render(
      <FragenSelektionBar
        sichtbareIds={['a', 'b']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('zeigt Anzahl ausgewählter Fragen wenn ≥1 selektiert', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b']))
    const { getByText, getByRole } = render(
      <FragenSelektionBar
        sichtbareIds={['a', 'b']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    expect(getByText('2')).toBeTruthy()
    // M-4 (Cluster D): „Fragen" ist in eigenem span (hidden sm:inline) — kombinierter Text via Region.
    expect(getByRole('region', { name: /Frage-Auswahl-Aktionen/ }).textContent).toContain('ausgewählt')
  })

  it('zeigt sichtbar-Diff wenn selektierte IDs nicht alle im Filter sichtbar sind', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b', 'c']))
    const { getByText } = render(
      <FragenSelektionBar
        sichtbareIds={['a']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    expect(getByText(/davon 1 im Filter sichtbar/)).toBeTruthy()
  })

  it('zeigt keinen sichtbar-Diff wenn alle selektierten im Filter sichtbar sind', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b']))
    const { queryByText } = render(
      <FragenSelektionBar
        sichtbareIds={['a', 'b', 'c']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    expect(queryByText(/im Filter sichtbar/)).toBeNull()
  })

  it('"Auswahl aufheben" leert Selektion', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a']))
    const { getByLabelText } = render(
      <FragenSelektionBar
        sichtbareIds={['a']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    fireEvent.click(getByLabelText('Auswahl aufheben'))
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(0)
  })

  it('"Auf Filter beschränken" ruft beschraenkeAufFilter mit sichtbareIds', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b', 'c']))
    const { getByText } = render(
      <FragenSelektionBar
        sichtbareIds={['a', 'c']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    fireEvent.click(getByText('Auf Filter beschränken'))
    expect(Array.from(useFragenSelectionStore.getState().selektiert).sort()).toEqual(['a', 'c'])
  })

  it('"Bearbeiten"-Click ruft onOeffneEditor', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a']))
    const onOeffneEditor = vi.fn()
    const { getByText } = render(
      <FragenSelektionBar
        sichtbareIds={['a']}
        onOeffneEditor={onOeffneEditor}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    fireEvent.click(getByText('Bearbeiten'))
    expect(onOeffneEditor).toHaveBeenCalledTimes(1)
  })

  it('"Löschen"-Click ruft onOeffneLoeschConfirm', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a']))
    const onOeffneLoeschConfirm = vi.fn()
    const { getByText } = render(
      <FragenSelektionBar
        sichtbareIds={['a']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={onOeffneLoeschConfirm}
      />,
    )
    fireEvent.click(getByText('Löschen'))
    expect(onOeffneLoeschConfirm).toHaveBeenCalledTimes(1)
  })

  it('M-6: ESC-Key leert die Selektion', () => {
    useFragenSelectionStore.getState().setzeSelektion(new Set(['a', 'b', 'c']))
    render(
      <FragenSelektionBar
        sichtbareIds={['a', 'b']}
        onOeffneEditor={vi.fn()}
        onOeffneLoeschConfirm={vi.fn()}
      />,
    )
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(3)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useFragenSelectionStore.getState().selektiert.size).toBe(0)
  })
})
