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

describe('TagPicker', () => {
  it('rendert übergebene Tag-Liste', () => {
    const { getByText } = render(
      <TagPicker tagIds={[]} onChange={vi.fn()} alleTags={[mkTag('t1', 'aktuell')]} onErstelleNeu={vi.fn()} />,
    )
    expect(getByText('aktuell')).toBeTruthy()
  })

  it('Quick-Erstellen zeigt Button bei keinem Treffer', () => {
    const { getByPlaceholderText, queryByText } = render(
      <TagPicker tagIds={[]} onChange={vi.fn()} alleTags={[]} onErstelleNeu={vi.fn()} />,
    )
    fireEvent.change(getByPlaceholderText(/Tag suchen/), { target: { value: 'neu' } })
    expect(queryByText(/"neu" anlegen/)).toBeTruthy()
  })

  it('toggleTag fügt hinzu wenn nicht ausgewählt', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker
        tagIds={[]}
        onChange={onChange}
        alleTags={[mkTag('t1', 'aktuell')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    const checkbox = container.querySelector('input[type="checkbox"]')!
    fireEvent.click(checkbox)
    expect(onChange).toHaveBeenCalledWith(['t1'])
  })

  it('maxTags-Limit verhindert weitere Auswahl', () => {
    const onChange = vi.fn()
    const { container } = render(
      <TagPicker
        tagIds={['t1', 't2']}
        onChange={onChange}
        alleTags={[mkTag('t1', 'a'), mkTag('t2', 'b'), mkTag('t3', 'c')]}
        onErstelleNeu={vi.fn()}
        maxTags={2}
      />,
    )
    const checkboxen = container.querySelectorAll('input[type="checkbox"]')
    fireEvent.click(checkboxen[2]) // t3 versucht
    expect(onChange).not.toHaveBeenCalled()
  })

  it('Liste ist alphabetisch sortiert (de, case-insensitive)', () => {
    // P2: Store-Reihenfolge ist zufällig (Insertion-Order). User erwartet alphabetisch.
    const { container } = render(
      <TagPicker
        tagIds={[]}
        onChange={vi.fn()}
        alleTags={[mkTag('t1', 'Zebra'), mkTag('t2', 'apfel'), mkTag('t3', 'Ästhetik'), mkTag('t4', 'Mango')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    const labels = Array.from(container.querySelectorAll('label span')).map((s) => s.textContent)
    // erwartete Reihenfolge mit `de`, sensitivity:'base': apfel, Ästhetik, Mango, Zebra
    expect(labels).toEqual(['apfel', 'Ästhetik', 'Mango', 'Zebra'])
  })

  it('Liste bleibt alphabetisch nach Filtern via Suche', () => {
    const { container, getByPlaceholderText } = render(
      <TagPicker
        tagIds={[]}
        onChange={vi.fn()}
        alleTags={[mkTag('t1', 'Zebra'), mkTag('t2', 'apfel'), mkTag('t3', 'Aprikose'), mkTag('t4', 'Ananas')]}
        onErstelleNeu={vi.fn()}
      />,
    )
    fireEvent.change(getByPlaceholderText(/Tag suchen/), { target: { value: 'a' } })
    const labels = Array.from(container.querySelectorAll('label span')).map((s) => s.textContent)
    // Alle vier enthalten "a" (case-insensitive). Erwartet: Ananas, apfel, Aprikose, Zebra
    expect(labels).toEqual(['Ananas', 'apfel', 'Aprikose', 'Zebra'])
  })

  it('onErstelleNeu wird mit getrimmtem Namen aufgerufen', async () => {
    const onErstelle = vi.fn().mockResolvedValue(mkTag('neu', 'neuer-tag'))
    const onChange = vi.fn()
    const { getByPlaceholderText, getByText } = render(
      <TagPicker tagIds={[]} onChange={onChange} alleTags={[]} onErstelleNeu={onErstelle} />,
    )
    fireEvent.change(getByPlaceholderText(/Tag suchen/), { target: { value: '  neuer-tag  ' } })
    fireEvent.click(getByText(/"neuer-tag" anlegen/))
    await new Promise((r) => setTimeout(r, 0))
    expect(onErstelle).toHaveBeenCalledWith('neuer-tag')
    expect(onChange).toHaveBeenCalledWith(['neu'])
  })
})
