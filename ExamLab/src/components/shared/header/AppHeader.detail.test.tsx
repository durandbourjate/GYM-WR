// ExamLab/src/components/shared/header/AppHeader.detail.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AppHeader } from './AppHeader'

function mockMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q === '(min-width: 900px)' || q === '(min-width: 600px)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }))
}

describe('AppHeader — Detail-Modus', () => {
  beforeEach(() => { mockMatchMedia() })

  function rend(extra: Partial<Parameters<typeof AppHeader>[0]> = {}) {
    return render(
      <MemoryRouter>
        <AppHeader
          rolle="lp"
          benutzerName="LP"
          theme="light"
          onThemeToggle={vi.fn()}
          onHilfe={vi.fn()}
          feedbackContext={{ rolle: 'lp', ort: '/test' }}
          onAbmelden={vi.fn()}
          kaskadeConfig={{ l1Tabs: [], aktivL1: null }}
          suchen=""
          onSuchen={vi.fn()}
          sucheErgebnis={{ gruppen: [], istLadend: false }}
          {...extra}
        />
      </MemoryRouter>,
    )
  }

  it('rendert Zurück-Button wenn onZurueck gesetzt', () => {
    const onZurueck = vi.fn()
    rend({ onZurueck })
    fireEvent.click(screen.getByRole('button', { name: /zurück/i }))
    expect(onZurueck).toHaveBeenCalled()
  })

  it('rendert Breadcrumbs wenn breadcrumbs gesetzt', () => {
    rend({ breadcrumbs: [{ label: 'Prüfungen' }, { label: 'Einrichtungsprüfung' }] })
    expect(screen.getByText('Prüfungen')).toBeInTheDocument()
    expect(screen.getByText('Einrichtungsprüfung')).toBeInTheDocument()
  })

  it('rendert aktionsButtons rechts', () => {
    rend({ aktionsButtons: <button>Speichern</button> })
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument()
  })

  it('rendert statusText als grüne Meldung', () => {
    rend({ statusText: 'Gespeichert' })
    expect(screen.getByText('Gespeichert')).toBeInTheDocument()
  })
})
