import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BulkPasteModal } from '@shared/index'

describe('BulkPasteModal', () => {
  it('open=false rendert nichts', () => {
    const { container } = render(
      <BulkPasteModal open={false} onClose={vi.fn()} onUebernehmen={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('rendert textarea, 2 Radios und 2 Buttons', () => {
    render(<BulkPasteModal open onClose={vi.fn()} onUebernehmen={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Anhängen/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Ersetzen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Übernehmen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abbrechen/i })).toBeInTheDocument()
  })

  it('Default-Modus = "append" (Anhängen) ist selektiert', () => {
    render(<BulkPasteModal open onClose={vi.fn()} onUebernehmen={vi.fn()} />)
    const append = screen.getByRole('radio', { name: /Anhängen/i }) as HTMLInputElement
    const replace = screen.getByRole('radio', { name: /Ersetzen/i }) as HTMLInputElement
    expect(append.checked).toBe(true)
    expect(replace.checked).toBe(false)
  })

  it('ESC ruft onClose', () => {
    const onClose = vi.fn()
    render(<BulkPasteModal open onClose={onClose} onUebernehmen={vi.fn()} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Backdrop-Click ruft onClose', () => {
    const onClose = vi.fn()
    render(<BulkPasteModal open onClose={onClose} onUebernehmen={vi.fn()} />)
    const backdrop = screen.getByRole('dialog')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('Übernehmen sendet Zeilen-Array (getrimmt, leere weg) im Default-Modus append', () => {
    const onUebernehmen = vi.fn()
    render(<BulkPasteModal open onClose={vi.fn()} onUebernehmen={onUebernehmen} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '  Apfel  \n\nBirne\n  Kirsche\n  \n' } })
    fireEvent.click(screen.getByRole('button', { name: /Übernehmen/i }))
    expect(onUebernehmen).toHaveBeenCalledWith(['Apfel', 'Birne', 'Kirsche'], 'append')
  })

  it('Modus-Wechsel auf Ersetzen → Übernehmen sendet "replace"', () => {
    const onUebernehmen = vi.fn()
    render(<BulkPasteModal open onClose={vi.fn()} onUebernehmen={onUebernehmen} />)
    fireEvent.click(screen.getByRole('radio', { name: /Ersetzen/i }))
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'Eins\nZwei' } })
    fireEvent.click(screen.getByRole('button', { name: /Übernehmen/i }))
    expect(onUebernehmen).toHaveBeenCalledWith(['Eins', 'Zwei'], 'replace')
  })

  it('Abbrechen-Button ruft onClose', () => {
    const onClose = vi.fn()
    render(<BulkPasteModal open onClose={onClose} onUebernehmen={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
