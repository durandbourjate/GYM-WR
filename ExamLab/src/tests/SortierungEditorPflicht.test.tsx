import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SortierungEditor } from '@shared/index'

const baseElemente = ['Erster', 'Zweiter', 'Dritter']

function renderEditor(opts?: {
  feldStatus?: 'pflicht-leer' | 'empfohlen-leer' | 'ok'
  setElemente?: (...args: unknown[]) => void
  setTeilpunkte?: (v: boolean) => void
  elemente?: string[]
}) {
  const setElemente = opts?.setElemente ?? vi.fn()
  return render(
    <SortierungEditor
      elemente={opts?.elemente ?? baseElemente}
      setElemente={setElemente as React.Dispatch<React.SetStateAction<string[]>>}
      teilpunkte={false}
      setTeilpunkte={opts?.setTeilpunkte ?? vi.fn()}
      feldStatusElemente={opts?.feldStatus}
    />,
  )
}

describe('SortierungEditor — MC-Pattern (Inputs statt Textarea)', () => {
  it('rendert pro Element ein Input statt einer Textarea', () => {
    renderEditor()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(baseElemente.length)
    expect((inputs[0] as HTMLInputElement).value).toBe('Erster')
    expect((inputs[1] as HTMLInputElement).value).toBe('Zweiter')
  })

  it('+ Element fuegt einen leeren Eintrag hinzu', () => {
    const setElemente = vi.fn()
    renderEditor({ setElemente })
    fireEvent.click(screen.getByRole('button', { name: /Element hinzufügen/i }))
    expect(setElemente).toHaveBeenCalledWith([...baseElemente, ''])
  })

  it('✕ entfernt einen Eintrag', () => {
    const setElemente = vi.fn()
    renderEditor({ setElemente })
    fireEvent.click(screen.getByRole('button', { name: /Element 2 entfernen/i }))
    expect(setElemente).toHaveBeenCalledWith(['Erster', 'Dritter'])
  })

  it('Input-Aenderung ruft setElemente mit aktualisiertem Array', () => {
    const setElemente = vi.fn()
    renderEditor({ setElemente })
    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: 'Geaendert' } })
    expect(setElemente).toHaveBeenCalledWith(['Geaendert', 'Zweiter', 'Dritter'])
  })

  it('Drag-Handle hat aria-label="Verschieben"', () => {
    renderEditor()
    const handles = screen.getAllByRole('button', { name: 'Verschieben' })
    expect(handles).toHaveLength(baseElemente.length)
  })

  it.todo('Drag-Reorder vertauscht zwei Eintraege im setElemente-Call')
})

describe('SortierungEditor — Bulk-Paste-Modal', () => {
  it('Bulk-Knopf oeffnet das Modal', () => {
    renderEditor()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Bulk einfügen/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('SortierungEditor — Pflichtfeld-Outline', () => {
  it('feldStatusElemente=pflicht-leer → violetter Border auf Section-Container', () => {
    renderEditor({ feldStatus: 'pflicht-leer' })
    const section = screen.getByTestId('sortierung-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusElemente=ok → neutraler Border', () => {
    renderEditor({ feldStatus: 'ok' })
    const section = screen.getByTestId('sortierung-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusElemente=undefined → neutraler Border', () => {
    renderEditor()
    const section = screen.getByTestId('sortierung-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
