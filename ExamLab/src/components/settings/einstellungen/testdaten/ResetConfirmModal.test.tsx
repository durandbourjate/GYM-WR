import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ResetConfirmModal from './ResetConfirmModal'

describe('ResetConfirmModal', () => {
  it('rendert nicht wenn offen=false', () => {
    render(<ResetConfirmModal offen={false} onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.queryByText('Testdaten zurücksetzen?')).not.toBeInTheDocument()
  })

  it('rendert Titel + Body + 2 Buttons wenn offen=true', () => {
    render(<ResetConfirmModal offen onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.getByText('Testdaten zurücksetzen?')).toBeInTheDocument()
    expect(screen.getByText(/Echtdaten sind nicht betroffen/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Endgültig zurücksetzen' })).toBeInTheDocument()
  })

  it('feuert onAbbrechen bei Click', () => {
    const onAbbrechen = vi.fn()
    render(<ResetConfirmModal offen onAbbrechen={onAbbrechen} onBestaetigen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onAbbrechen).toHaveBeenCalledOnce()
  })

  it('feuert onBestaetigen bei Click', () => {
    const onBestaetigen = vi.fn()
    render(<ResetConfirmModal offen onAbbrechen={() => {}} onBestaetigen={onBestaetigen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig zurücksetzen' }))
    expect(onBestaetigen).toHaveBeenCalledOnce()
  })

  it('disabled Buttons wenn loading=true', () => {
    render(<ResetConfirmModal offen loading onAbbrechen={() => {}} onBestaetigen={() => {}} />)
    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDisabled()
    // Cluster H Phase 3 / Reset-Timeout-UX (17.05.2026): Button-Label wechselt
    // zu "Wird zurückgesetzt…" wenn loading=true (mit Loader-Spinner).
    expect(screen.getByRole('button', { name: /Wird zurückgesetzt/ })).toBeDisabled()
  })
})
