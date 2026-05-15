/**
 * Cluster D Phase 3b — Tests für BatchTagPicker.
 *
 * Pure-UI-Tests: Radio-Auswahl, Modus-Wechsel, Slot-Render-Prop-Vermittlung,
 * violet-Wrapper-Sichtbarkeit.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BatchTagPicker from './BatchTagPicker'

describe('BatchTagPicker', () => {
  it('Default-Modus ist hinzufuegen (Radio "Hinzufügen" checked)', () => {
    render(
      <BatchTagPicker
        tagIds={[]}
        setTagIds={vi.fn()}
        modus="hinzufuegen"
        setModus={vi.fn()}
        tagPickerSlot={(p) => <div data-testid="slot">slot tagIds={p.tagIds.join(',')}</div>}
      />,
    )
    expect(screen.getByRole('radio', { name: /Hinzufügen/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Ersetzen/i })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Entfernen/i })).not.toBeChecked()
  })

  it('Modus-Wechsel zu Ersetzen ruft setModus("ersetzen")', () => {
    const setModus = vi.fn()
    render(
      <BatchTagPicker
        tagIds={[]}
        setTagIds={vi.fn()}
        modus="hinzufuegen"
        setModus={setModus}
        tagPickerSlot={() => null}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: /Ersetzen/i }))
    expect(setModus).toHaveBeenCalledWith('ersetzen')
  })

  it('Modus-Wechsel zu Entfernen ruft setModus("entfernen")', () => {
    const setModus = vi.fn()
    render(
      <BatchTagPicker
        tagIds={[]}
        setTagIds={vi.fn()}
        modus="hinzufuegen"
        setModus={setModus}
        tagPickerSlot={() => null}
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: /Entfernen/i }))
    expect(setModus).toHaveBeenCalledWith('entfernen')
  })

  it('tagPickerSlot bekommt tagIds + onChange weitergegeben', () => {
    const setTagIds = vi.fn()
    const slot = vi.fn().mockReturnValue(<div data-testid="slot" />)
    render(
      <BatchTagPicker
        tagIds={['t1']}
        setTagIds={setTagIds}
        modus="hinzufuegen"
        setModus={vi.fn()}
        tagPickerSlot={slot}
      />,
    )
    expect(slot).toHaveBeenCalledWith(expect.objectContaining({ tagIds: ['t1'], onChange: setTagIds }))
  })

  it('violet-Wrapper-Ring ist auf dem äusseren Container sichtbar', () => {
    const { container } = render(
      <BatchTagPicker
        tagIds={[]}
        setTagIds={vi.fn()}
        modus="hinzufuegen"
        setModus={vi.fn()}
        tagPickerSlot={() => null}
      />,
    )
    const outer = container.firstChild as HTMLElement
    expect(outer).toHaveClass('ring-1')
    expect(outer.className).toContain('ring-violet-300')
  })

  it('rendert "Tags"-Label oben', () => {
    render(
      <BatchTagPicker
        tagIds={[]}
        setTagIds={vi.fn()}
        modus="hinzufuegen"
        setModus={vi.fn()}
        tagPickerSlot={() => null}
      />,
    )
    expect(screen.getByText('Tags')).toBeTruthy()
  })
})
