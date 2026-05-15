/**
 * Tests für BatchLoeschConfirmModal (Cluster D Phase 4, 15.05.2026).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import BatchLoeschConfirmModal from './BatchLoeschConfirmModal'

describe('BatchLoeschConfirmModal', () => {
  it('zeigt Anzahl im Titel (Plural)', () => {
    const { getByRole } = render(
      <BatchLoeschConfirmModal
        anzahl={7}
        sichtbarCount={7}
        onLoeschen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(getByRole('dialog').textContent).toContain('7 Fragen löschen?')
  })

  it('zeigt Singular "Frage" wenn anzahl=1', () => {
    const { getByRole } = render(
      <BatchLoeschConfirmModal
        anzahl={1}
        sichtbarCount={1}
        onLoeschen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(getByRole('dialog').textContent).toContain('1 Frage löschen?')
  })

  it('zeigt yellow-Warnung wenn nichtSichtbar > 0', () => {
    const { getByText } = render(
      <BatchLoeschConfirmModal
        anzahl={10}
        sichtbarCount={3}
        onLoeschen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const warn = getByText(/7 davon/)
    expect(warn.className).toContain('yellow')
  })

  it('rendert keine yellow-Warnung wenn alle sichtbar', () => {
    const { queryByText } = render(
      <BatchLoeschConfirmModal
        anzahl={5}
        sichtbarCount={5}
        onLoeschen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(queryByText(/im aktuellen Filter nicht sichtbar/)).toBeNull()
  })

  it('"Löschen"-Button hat danger-Variant (rot)', () => {
    const { getByText } = render(
      <BatchLoeschConfirmModal
        anzahl={1}
        sichtbarCount={1}
        onLoeschen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const btn = getByText('Löschen').closest('button')!
    expect(btn.className).toContain('red')
  })

  it('"Löschen"-Click ruft onLoeschen', () => {
    const onLoeschen = vi.fn()
    const { getByText } = render(
      <BatchLoeschConfirmModal
        anzahl={1}
        sichtbarCount={1}
        onLoeschen={onLoeschen}
        onAbbrechen={vi.fn()}
      />,
    )
    fireEvent.click(getByText('Löschen'))
    expect(onLoeschen).toHaveBeenCalledTimes(1)
  })

  it('"Abbrechen"-Click ruft onAbbrechen', () => {
    const onAbbrechen = vi.fn()
    const { getByText } = render(
      <BatchLoeschConfirmModal
        anzahl={1}
        sichtbarCount={1}
        onLoeschen={vi.fn()}
        onAbbrechen={onAbbrechen}
      />,
    )
    fireEvent.click(getByText('Abbrechen'))
    expect(onAbbrechen).toHaveBeenCalledTimes(1)
  })
})
