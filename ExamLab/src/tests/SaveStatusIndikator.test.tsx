import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveStatusIndikator } from '@shared/index'

describe('SaveStatusIndikator', () => {
  it('rendert "Gespeichert" bei status=sauber', () => {
    render(<SaveStatusIndikator status="sauber" />)
    expect(screen.getByText(/gespeichert/i)).toBeInTheDocument()
  })

  it('rendert "Speichert…" bei status=sync-läuft', () => {
    render(<SaveStatusIndikator status="sync-läuft" />)
    expect(screen.getByText(/speichert/i)).toBeInTheDocument()
  })

  it('rendert "Entwurf" bei status=entwurf ohne fehlendePflichtfelder', () => {
    render(<SaveStatusIndikator status="entwurf" />)
    expect(screen.getByText(/entwurf/i)).toBeInTheDocument()
    // Keine Liste wenn fehlendePflichtfelder leer/undefined
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('rendert Pflichtfeld-Liste bei status=entwurf mit fehlendePflichtfelder', () => {
    render(<SaveStatusIndikator status="entwurf" fehlendePflichtfelder={['fragetext', 'punkte']} />)
    expect(screen.getByText('fragetext')).toBeInTheDocument()
    expect(screen.getByText('punkte')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
  })

  it('rendert "Verbindungsproblem" bei status=verbindungsproblem', () => {
    render(<SaveStatusIndikator status="verbindungsproblem" />)
    expect(screen.getByText(/verbindungsproblem/i)).toBeInTheDocument()
  })

  it('rendert "Server nicht erreichbar" bei status=server-down', () => {
    render(<SaveStatusIndikator status="server-down" />)
    expect(screen.getByText(/server nicht erreichbar/i)).toBeInTheDocument()
  })

  it('rendert "Erneut versuchen"-Button bei server-down + onErneutVersuchen', () => {
    const onTry = vi.fn()
    render(<SaveStatusIndikator status="server-down" onErneutVersuchen={onTry} />)
    expect(screen.getByRole('button', { name: /erneut versuchen/i })).toBeInTheDocument()
  })

  it('rendert KEINEN Button wenn onErneutVersuchen fehlt bei server-down', () => {
    render(<SaveStatusIndikator status="server-down" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('Button-Click ruft onErneutVersuchen', () => {
    const onTry = vi.fn()
    render(<SaveStatusIndikator status="server-down" onErneutVersuchen={onTry} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onTry).toHaveBeenCalledTimes(1)
  })

  it('hat aria-live="polite" für Screen-Reader-Update', () => {
    const { container } = render(<SaveStatusIndikator status="sauber" />)
    const status = container.querySelector('[role="status"]')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
