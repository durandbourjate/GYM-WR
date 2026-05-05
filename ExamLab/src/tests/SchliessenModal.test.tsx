import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SchliessenModal from '@shared/editor/components/SchliessenModal'

describe('SchliessenModal', () => {
  const onVerwerfen = vi.fn()
  const onAbbrechen = vi.fn()
  const onAlsEntwurfBehalten = vi.fn()

  beforeEach(() => {
    onVerwerfen.mockReset()
    onAbbrechen.mockReset()
    onAlsEntwurfBehalten.mockReset()
  })

  it('rendert null wenn open=false', () => {
    const { container } = render(
      <SchliessenModal open={false} variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('rendert "Frage ist unvollständig" bei variante=unvollstaendig', () => {
    render(
      <SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
        onAlsEntwurfBehalten={onAlsEntwurfBehalten} />
    )
    expect(screen.getByText(/frage ist unvollständig/i)).toBeInTheDocument()
  })

  it('rendert "Änderungen noch nicht gesichert" bei variante=sync-pending', () => {
    render(<SchliessenModal open variante="sync-pending" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen} />)
    expect(screen.getByText(/änderungen noch nicht gesichert/i)).toBeInTheDocument()
  })

  it('Variante unvollstaendig: 3 Buttons (Abbrechen + Verwerfen + Als Entwurf behalten)', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
      onAlsEntwurfBehalten={onAlsEntwurfBehalten} />)
    expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /verwerfen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /als entwurf behalten/i })).toBeInTheDocument()
  })

  it('Variante sync-pending: 2 Buttons (Abbrechen + Trotzdem schliessen)', () => {
    render(<SchliessenModal open variante="sync-pending" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen} />)
    expect(screen.getByRole('button', { name: /abbrechen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /trotzdem schliessen/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /als entwurf/i })).not.toBeInTheDocument()
  })

  it('Variante unvollstaendig OHNE onAlsEntwurfBehalten: kein Entwurf-Button', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen} />)
    expect(screen.queryByRole('button', { name: /als entwurf/i })).not.toBeInTheDocument()
  })

  it('Klick auf Abbrechen ruft onAbbrechen', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
      onAlsEntwurfBehalten={onAlsEntwurfBehalten} />)
    fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }))
    expect(onAbbrechen).toHaveBeenCalledTimes(1)
  })

  it('Klick auf Verwerfen (unvollstaendig) ruft onVerwerfen', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
      onAlsEntwurfBehalten={onAlsEntwurfBehalten} />)
    fireEvent.click(screen.getByRole('button', { name: /verwerfen/i }))
    expect(onVerwerfen).toHaveBeenCalledTimes(1)
  })

  it('Klick auf Trotzdem-Schliessen (sync-pending) ruft onVerwerfen', () => {
    render(<SchliessenModal open variante="sync-pending" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen} />)
    fireEvent.click(screen.getByRole('button', { name: /trotzdem schliessen/i }))
    expect(onVerwerfen).toHaveBeenCalledTimes(1)
  })

  it('Klick auf Als-Entwurf-behalten ruft onAlsEntwurfBehalten', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
      onAlsEntwurfBehalten={onAlsEntwurfBehalten} />)
    fireEvent.click(screen.getByRole('button', { name: /als entwurf behalten/i }))
    expect(onAlsEntwurfBehalten).toHaveBeenCalledTimes(1)
  })

  it('ESC-Taste ruft onAbbrechen', () => {
    render(<SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
      onAlsEntwurfBehalten={onAlsEntwurfBehalten} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onAbbrechen).toHaveBeenCalledTimes(1)
  })

  it('Backdrop-Click ruft onAbbrechen', () => {
    const { container } = render(
      <SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
        onAlsEntwurfBehalten={onAlsEntwurfBehalten} />
    )
    const backdrop = container.querySelector('[role="dialog"]') as HTMLElement
    fireEvent.click(backdrop) // click direkt auf backdrop = e.target === e.currentTarget
    expect(onAbbrechen).toHaveBeenCalledTimes(1)
  })

  it('hat aria-modal="true" + role="dialog"', () => {
    const { container } = render(
      <SchliessenModal open variante="unvollstaendig" onVerwerfen={onVerwerfen} onAbbrechen={onAbbrechen}
        onAlsEntwurfBehalten={onAlsEntwurfBehalten} />
    )
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
