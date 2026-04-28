import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PflichtfeldDialog } from '@shared/index'

describe('PflichtfeldDialog', () => {
  it('zeigt Klartext-Liste der Pflicht-leer-Felder', () => {
    render(
      <PflichtfeldDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        pflichtLeerFelder={['Frage-Text', 'Mind. 2 Optionen']}
      />,
    )
    expect(screen.getByText('Frage-Text')).toBeInTheDocument()
    expect(screen.getByText('Mind. 2 Optionen')).toBeInTheDocument()
  })

  it('Default-Fokus auf Abbrechen', () => {
    render(
      <PflichtfeldDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        pflichtLeerFelder={['x']}
      />,
    )
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus()
  })

  it('Speichern-Button: explizites Label', () => {
    render(
      <PflichtfeldDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        pflichtLeerFelder={['x']}
      />,
    )
    expect(
      screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }),
    ).toBeInTheDocument()
  })

  it('Speichern-Klick ruft onSpeichern', () => {
    const onSpeichern = vi.fn()
    render(
      <PflichtfeldDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={onSpeichern}
        pflichtLeerFelder={['x']}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }),
    )
    expect(onSpeichern).toHaveBeenCalledOnce()
  })

  it('Esc ruft onAbbrechen', () => {
    const onAbbrechen = vi.fn()
    render(
      <PflichtfeldDialog
        open
        onAbbrechen={onAbbrechen}
        onSpeichern={vi.fn()}
        pflichtLeerFelder={['x']}
      />,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onAbbrechen).toHaveBeenCalled()
  })

  it('open=false rendert nichts', () => {
    const { container } = render(
      <PflichtfeldDialog
        open={false}
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        pflichtLeerFelder={[]}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
