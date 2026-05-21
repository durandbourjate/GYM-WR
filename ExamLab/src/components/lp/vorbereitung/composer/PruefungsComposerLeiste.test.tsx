import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PruefungsComposerLeiste from './PruefungsComposerLeiste'

const baseProps = {
  titel: 'Test-Prüfung',
  typ: 'summativ' as const,
  aktiverTab: 'config',
  onTabChange: vi.fn(),
  gesamtFragen: 3,
  speichertGerade: false,
  speichernDeaktiviert: false,
  onSpeichern: vi.fn(),
  onLoeschen: vi.fn(),
}

describe('PruefungsComposerLeiste', () => {
  it('zeigt den Prüfungstitel', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.getByText('Test-Prüfung')).toBeInTheDocument()
  })

  it('zeigt die Editor-Tabs inkl. Fragenzahl', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.getByRole('tab', { name: 'Einstellungen' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Abschnitte & Fragen (3)' })).toBeInTheDocument()
  })

  it('Speichern-Button ruft onSpeichern', () => {
    const onSpeichern = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onSpeichern={onSpeichern} />)
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(onSpeichern).toHaveBeenCalled()
  })

  it('blendet Duplizieren aus, wenn kein onDuplizieren übergeben wird', () => {
    render(<PruefungsComposerLeiste {...baseProps} />)
    expect(screen.queryByRole('button', { name: 'Duplizieren' })).not.toBeInTheDocument()
  })

  it('zeigt Duplizieren und ruft den Callback', () => {
    const onDuplizieren = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onDuplizieren={onDuplizieren} />)
    fireEvent.click(screen.getByRole('button', { name: 'Duplizieren' }))
    expect(onDuplizieren).toHaveBeenCalled()
  })

  it('Löschen-Button ruft onLoeschen', () => {
    const onLoeschen = vi.fn()
    render(<PruefungsComposerLeiste {...baseProps} onLoeschen={onLoeschen} />)
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }))
    expect(onLoeschen).toHaveBeenCalled()
  })

  it('blendet Löschen aus, wenn kein onLoeschen übergeben wird', () => {
    const { onLoeschen, ...ohneLoeschen } = baseProps
    void onLoeschen
    render(<PruefungsComposerLeiste {...ohneLoeschen} />)
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()
  })

  it('Speichern ist deaktiviert wenn speichernDeaktiviert=true', () => {
    render(<PruefungsComposerLeiste {...baseProps} speichernDeaktiviert />)
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
  })
})
