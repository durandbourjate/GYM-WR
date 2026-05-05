/**
 * Tests für DraftsSection — Bundle 3 Phase D.
 * Verifiziert Render-Logik (leerer State, Header mit Anzahl, Owner-Hinweis,
 * Klick-Handler, "Ohne Titel"-Fallback, Snippet-Rendering).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DraftsSection from '../components/lp/fragensammlung/DraftsSection'
import type { Frage } from '../types/fragen-storage'

interface MockOverrides {
  id?: string
  thema?: string
  fragetext?: string
  status?: 'draft' | 'sammlung'
  autor?: string
}

function mockDraft(overrides: MockOverrides = {}): Frage {
  return {
    id: 'd1',
    typ: 'mc',
    fachbereich: 'BWL',
    thema: 'Test',
    fragetext: 'Frage?',
    punkte: 1,
    status: 'draft',
    autor: 'lp@gymhofwil.ch',
    optionen: [],
    tags: [],
    ...overrides,
  } as unknown as Frage /* Defensive: Test-Mock, baut nur die im Test geprüften Felder */
}

describe('DraftsSection', () => {
  it('returnt null wenn drafts leer', () => {
    const { container } = render(
      <DraftsSection drafts={[]} onClickDraft={vi.fn()} ownEmail="lp@gymhofwil.ch" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('rendert Header mit Anzahl', () => {
    render(
      <DraftsSection
        drafts={[mockDraft({}), mockDraft({ id: 'd2' })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    expect(screen.getByText(/entwürfe \(2\)/i)).toBeInTheDocument()
  })

  it('rendert thema jedes Drafts', () => {
    render(
      <DraftsSection
        drafts={[mockDraft({ thema: 'Bilanz' })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    expect(screen.getByText('Bilanz')).toBeInTheDocument()
  })

  it('rendert "Ohne Titel" bei leerem thema', () => {
    render(
      <DraftsSection
        drafts={[mockDraft({ thema: '' })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    expect(screen.getByText(/ohne titel/i)).toBeInTheDocument()
  })

  it('Klick ruft onClickDraft mit dem Draft', () => {
    const onClick = vi.fn()
    const draft = mockDraft({})
    render(<DraftsSection drafts={[draft]} onClickDraft={onClick} ownEmail="lp@gymhofwil.ch" />)
    fireEvent.click(screen.getByRole('button', { name: /test/i }))
    expect(onClick).toHaveBeenCalledWith(draft)
  })

  it('zeigt Owner-Hinweis bei geteilten Drafts (autor !== ownEmail)', () => {
    render(
      <DraftsSection
        drafts={[mockDraft({ autor: 'kollege@gymhofwil.ch' })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    expect(screen.getByText(/geteilt von kollege/i)).toBeInTheDocument()
  })

  it('zeigt KEINEN Owner-Hinweis bei eigenen Drafts', () => {
    render(
      <DraftsSection
        drafts={[mockDraft({ autor: 'lp@gymhofwil.ch' })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    expect(screen.queryByText(/geteilt von/i)).not.toBeInTheDocument()
  })

  it('rendert Fragetext-Snippet truncated', () => {
    const longText = 'a'.repeat(150)
    render(
      <DraftsSection
        drafts={[mockDraft({ fragetext: longText })]}
        onClickDraft={vi.fn()}
        ownEmail="lp@gymhofwil.ch"
      />
    )
    // thema bleibt sichtbar; snippet enthält die ersten 80 Zeichen + …
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText(/a{80}…/)).toBeInTheDocument()
  })
})
