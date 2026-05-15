import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TagPicker } from './TagPicker'
import type { Tag } from '../../types/tag'

const mkTag = (id: string, name: string): Tag => ({
  id,
  name,
  farbe: 'slate',
  archiviert: false,
  erstelltAm: '',
  erstelltVon: '',
})

function openDropdown(container: HTMLElement) {
  const input = container.querySelector('input[type="text"]') as HTMLInputElement
  fireEvent.focus(input)
  return input
}

describe('TagPicker (Combobox-Stil)', () => {
  it('rendert Dropdown-Vorschläge nach Focus', () => {
    const { container, getByText, queryByText } = render(
      <TagPicker tagIds={[]} onChange={vi.fn()} alleTags={[mkTag('t1', 'aktuell')]} onErstelleNeu={vi.fn()} />,
    )
    // Vor Focus: Dropdown zu, Tag nicht sichtbar.
    expect(queryByText('aktuell')).toBeNull()
    openDropdown(container)
    expect(getByText('aktuell')).toBeTruthy()
  })

  it('Selektierte Tags erscheinen als Chips, nicht im Dropdown', () => {
    const { container, getByText, queryByText } = render(
      <TagPicker
        tagIds={['t1']}
        onChange={vi.fn()}
        alleTags={[mkTag('t1', 'aktuell'), mkTag('t2', 'wirtschaft')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    // Chip „aktuell" sofort sichtbar.
    expect(getByText('aktuell')).toBeTruthy()
    // Dropdown geschlossen, „wirtschaft" nicht sichtbar.
    expect(queryByText('wirtschaft')).toBeNull()
    openDropdown(container)
    // Nach Focus: nur unselected „wirtschaft" im Dropdown, „aktuell" bleibt nur als Chip.
    expect(getByText('wirtschaft')).toBeTruthy()
  })

  it('Klick auf Vorschlag fügt Tag hinzu', () => {
    const onChange = vi.fn()
    const { container, getByText } = render(
      <TagPicker tagIds={[]} onChange={onChange} alleTags={[mkTag('t1', 'aktuell')]} onErstelleNeu={vi.fn()} />,
    )
    openDropdown(container)
    fireEvent.click(getByText('aktuell'))
    expect(onChange).toHaveBeenCalledWith(['t1'])
  })

  it('Klick auf Chip-X entfernt Tag', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker
        tagIds={['t1']}
        onChange={onChange}
        alleTags={[mkTag('t1', 'aktuell')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    const xButton = container.querySelector('button[aria-label="Tag aktuell entfernen"]') as HTMLButtonElement
    fireEvent.click(xButton)
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('Quick-Erstellen via Dropdown-Button bei keinem Treffer', () => {
    const { container, queryByText } = render(
      <TagPicker tagIds={[]} onChange={vi.fn()} alleTags={[]} onErstelleNeu={vi.fn()} />,
    )
    const input = openDropdown(container)
    fireEvent.change(input, { target: { value: 'neu' } })
    expect(queryByText(/„neu" anlegen/)).toBeTruthy()
  })

  it('Enter mit nicht-exaktem Match löst Quick-Erstellen aus', async () => {
    const neuerTag = mkTag('neu', 'neuer-tag')
    const onErstelle = vi.fn().mockResolvedValue(neuerTag)
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker tagIds={[]} onChange={onChange} alleTags={[]} onErstelleNeu={onErstelle} />,
    )
    const input = openDropdown(container)
    fireEvent.change(input, { target: { value: '  neuer-tag  ' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await new Promise((r) => setTimeout(r, 0))
    expect(onErstelle).toHaveBeenCalledWith('neuer-tag')
    expect(onChange).toHaveBeenCalledWith(['neu'])
  })

  it('Enter mit exaktem Match fügt vorhandenen Tag hinzu', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker
        tagIds={[]}
        onChange={onChange}
        alleTags={[mkTag('t1', 'aktuell')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    const input = openDropdown(container)
    fireEvent.change(input, { target: { value: 'aktuell' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith(['t1'])
  })

  it('Backspace bei leerem Input entfernt letzten Chip', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker
        tagIds={['t1', 't2']}
        onChange={onChange}
        alleTags={[mkTag('t1', 'a'), mkTag('t2', 'b')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    const input = openDropdown(container)
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(onChange).toHaveBeenCalledWith(['t1'])
  })

  it('maxTags-Limit blockiert weitere Auswahl', () => {
    const onChange = vi.fn()
    const { container, getByText } = render(
      <TagPicker
        tagIds={['t1', 't2']}
        onChange={onChange}
        alleTags={[mkTag('t1', 'a'), mkTag('t2', 'b'), mkTag('t3', 'c')]}
        onErstelleNeu={vi.fn()}
        maxTags={2}
      />,
    )
    openDropdown(container)
    fireEvent.click(getByText('c'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Dropdown-Liste alphabetisch sortiert (de, case-insensitive)', () => {
    const { container } = render(
      <TagPicker
        tagIds={[]}
        onChange={vi.fn()}
        alleTags={[mkTag('t1', 'Zebra'), mkTag('t2', 'apfel'), mkTag('t3', 'Ästhetik'), mkTag('t4', 'Mango')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    openDropdown(container)
    // Im Dropdown stehen die Tag-Namen als <span> innerhalb von <button>.
    const buttons = Array.from(container.querySelectorAll('div.absolute button > span'))
    const labels = buttons.map((s) => s.textContent)
    expect(labels).toEqual(['apfel', 'Ästhetik', 'Mango', 'Zebra'])
  })

  it('Esc schliesst Dropdown', () => {
    const { container, getByText, queryByText } = render(
      <TagPicker tagIds={[]} onChange={vi.fn()} alleTags={[mkTag('t1', 'aktuell')]} onErstelleNeu={vi.fn()} />,
    )
    openDropdown(container)
    expect(getByText('aktuell')).toBeTruthy()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(queryByText('aktuell')).toBeNull()
  })
})
