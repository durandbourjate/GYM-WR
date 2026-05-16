import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dropdown from './Dropdown'

const OPTS = [
  { value: '', label: 'Alle Fächer' },
  { value: 'VWL', label: 'VWL', count: 10 },
  { value: 'BWL', label: 'BWL', count: 20 },
  { value: 'Recht', label: 'Recht', count: 5 },
] as const

describe('Dropdown', () => {
  it('zeigt initial nur den Trigger, kein Panel', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    expect(screen.getByRole('button', { name: 'Fach' })).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('öffnet Panel bei Trigger-Click', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('ruft onChange bei Option-Click + schliesst Panel', () => {
    const onChange = vi.fn()
    render(<Dropdown value="" onChange={onChange} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const bwlOption = screen.getAllByRole('option').find((o) => o.textContent?.includes('BWL'))!
    fireEvent.click(bwlOption)
    expect(onChange).toHaveBeenCalledWith('BWL')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('zeigt Count in Option, wenn vorhanden', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const bwlOption = screen.getByRole('option', { name: /BWL/ })
    expect(bwlOption.textContent).toMatch(/20/)
  })

  it('rendert Trigger-Label aus aktiver Option', () => {
    render(<Dropdown value="VWL" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    expect(screen.getByRole('button', { name: 'Fach' }).textContent).toContain('VWL')
  })

  it('fallback Trigger-Label auf placeholderLabel wenn value leer', () => {
    render(
      <Dropdown
        value=""
        onChange={() => {}}
        options={[...OPTS]}
        ariaLabel="Fach"
        placeholderLabel="Bitte wählen"
      />,
    )
    expect(screen.getByRole('button', { name: 'Fach' }).textContent).toContain('Alle Fächer')
  })

  it('markiert die aktive Option als aria-selected', () => {
    render(<Dropdown value="BWL" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const bwl = screen.getAllByRole('option').find((o) => o.textContent?.includes('BWL'))!
    expect(bwl.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowDown im offenen Panel verschiebt Fokus', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const wrapper = screen.getByRole('button', { name: 'Fach' }).parentElement!
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' })
    // Fokus rutscht von 0 auf 1
    expect(screen.getAllByRole('option')[1].className).toMatch(/bg-slate-100/)
  })

  it('Enter im offenen Panel wählt fokussierte Option', () => {
    const onChange = vi.fn()
    render(<Dropdown value="" onChange={onChange} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const wrapper = screen.getByRole('button', { name: 'Fach' }).parentElement!
    fireEvent.keyDown(wrapper, { key: 'ArrowDown' }) // VWL
    fireEvent.keyDown(wrapper, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('VWL')
  })

  it('Escape schliesst das Panel', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const wrapper = screen.getByRole('button', { name: 'Fach' }).parentElement!
    fireEvent.keyDown(wrapper, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('Typeahead (Buchstabe) springt zu Option mit passendem Anfang', () => {
    render(<Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />)
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    const wrapper = screen.getByRole('button', { name: 'Fach' }).parentElement!
    fireEvent.keyDown(wrapper, { key: 'r' })
    // Springt zu "Recht" (index 3)
    expect(screen.getAllByRole('option')[3].className).toMatch(/bg-slate-100/)
  })

  it('rendert icon-Slot vor Label, wenn icon-prop gesetzt', () => {
    const optsMitIcons = [
      { value: 'x', label: 'X', icon: <span data-testid="icon-x">●</span> },
    ]
    render(<Dropdown value="" onChange={() => {}} options={optsMitIcons} ariaLabel="Test" />)
    fireEvent.click(screen.getByRole('button', { name: 'Test' }))
    expect(screen.getByTestId('icon-x')).toBeInTheDocument()
  })

  it('Click ausserhalb schliesst Panel', () => {
    render(
      <div>
        <Dropdown value="" onChange={() => {}} options={[...OPTS]} ariaLabel="Fach" />
        <button>Außerhalb</button>
      </div>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fach' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('Außerhalb'))
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})
