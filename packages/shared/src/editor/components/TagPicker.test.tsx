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
