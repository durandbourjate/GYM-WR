import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DoppelteLabelDialog } from '@shared/index'

describe('DoppelteLabelDialog', () => {
  const beispielDoppelte = [
    { label: 'Aktiva', zonenIndices: [0, 2] },
    { label: 'Passiva', zonenIndices: [1, 3, 4] },
  ]

  it('zeigt Liste der doppelten Labels mit Zonen-Indices', () => {
    render(
      <DoppelteLabelDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        doppelteLabels={beispielDoppelte}
      />,
    )
    expect(screen.getByText(/« Aktiva ».*Zone\(n\) #0, #2/)).toBeInTheDocument()
    expect(screen.getByText(/« Passiva ».*Zone\(n\) #1, #3, #4/)).toBeInTheDocument()
  })

  it('Esc ruft onAbbrechen', () => {
    const onAbbrechen = vi.fn()
    render(
      <DoppelteLabelDialog
        open
        onAbbrechen={onAbbrechen}
        onSpeichern={vi.fn()}
        doppelteLabels={beispielDoppelte}
      />,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onAbbrechen).toHaveBeenCalled()
  })

  it('Speichern-Klick triggert callback', () => {
    const onSpeichern = vi.fn()
    render(
      <DoppelteLabelDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={onSpeichern}
        doppelteLabels={beispielDoppelte}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: /Speichern \(nicht prüfungstauglich\)/i }),
    )
    expect(onSpeichern).toHaveBeenCalledOnce()
  })

  it('open=false rendert nichts', () => {
    const { container } = render(
      <DoppelteLabelDialog
        open={false}
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        doppelteLabels={beispielDoppelte}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('Default-Fokus auf Abbrechen', () => {
    render(
      <DoppelteLabelDialog
        open
        onAbbrechen={vi.fn()}
        onSpeichern={vi.fn()}
        doppelteLabels={beispielDoppelte}
      />,
    )
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toHaveFocus()
  })
})
