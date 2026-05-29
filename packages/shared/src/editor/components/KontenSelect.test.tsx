import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import KontenSelect from './KontenSelect'

/**
 * a11y-Regression: combobox `role-has-required-aria-props` (aria-controls).
 *
 * Das <input role="combobox"> muss via aria-controls auf die Listbox zeigen, die es
 * öffnet. Die Listbox (<ul role="listbox">) wird nur bei open gerendert → aria-controls
 * ist konditional (geschlossen: kein dangling reference).
 */

beforeEach(() => {
  // jsdom implementiert scrollIntoView nicht — der Highlight-Scroll-Effect ruft es beim Öffnen
  Element.prototype.scrollIntoView = vi.fn() as unknown as Element['scrollIntoView']
})

afterEach(cleanup)

describe('KontenSelect — combobox a11y', () => {
  it('verdrahtet aria-controls auf die geöffnete Listbox (und nicht im geschlossenen Zustand)', () => {
    render(<KontenSelect value="" onChange={() => {}} config={{ modus: 'voll' }} />)

    const input = screen.getByRole('combobox')
    // geschlossen: keine Listbox → kein dangling aria-controls
    expect(input.getAttribute('aria-controls')).toBeNull()

    fireEvent.focus(input)

    const listbox = screen.getByRole('listbox')
    expect(listbox.id).toBeTruthy()
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
  })
})
