// ExamLab/src/components/ueben/LernzielKarte.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { berechneKartenDaten, LernzielKarte } from './LernzielKarte'
import type { Lernziel } from '@shared/types/fragen-core'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

// ─── Mock-Daten ───────────────────────────────────────────────────────────────

function mockLernziel(overrides?: Partial<Lernziel>): Lernziel {
  return {
    id: 'lz-1',
    fach: 'BWL',
    thema: 'Marketing',
    text: 'Der Schüler kann die Marketingmix-Instrumente erklären.',
    bloom: 'K2',
    ...overrides,
  }
}

function mockFortschritt(mastery: FragenFortschritt['mastery'], letzterVersuch: string): FragenFortschritt {
  return {
    fragenId: 'x',
    email: 'test@test.ch',
    versuche: 1,
    richtig: 1,
    richtigInFolge: 1,
    sessionIds: ['s1'],
    letzterVersuch,
    mastery,
  }
}

// ─── berechneKartenDaten (pure function) ──────────────────────────────────────

describe('berechneKartenDaten', () => {
  it('zählt 4 Fragen korrekt in Buckets auf', () => {
    const lernziel = mockLernziel({ fragenIds: ['a', 'b', 'c', 'd'] })
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('gemeistert', '2026-05-01T10:00:00.000Z'),
      b: mockFortschritt('gefestigt', '2026-05-02T10:00:00.000Z'),
      c: mockFortschritt('ueben', '2026-04-30T10:00:00.000Z'),
      // d ist nicht vorhanden → neu
    }

    const result = berechneKartenDaten(lernziel, fortschritte)

    expect(result.buckets).toEqual({ gemeistert: 1, gefestigt: 1, ueben: 1, neu: 1 })
    expect(result.total).toBe(4)
    expect(result.nichtSicher).toBe(2) // neu + ueben
  })

  it('letzterVersuch ist der grösste Timestamp der vorhandenen Fortschritte', () => {
    const lernziel = mockLernziel({ fragenIds: ['a', 'b', 'c', 'd'] })
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('gemeistert', '2026-05-01T10:00:00.000Z'),
      b: mockFortschritt('gefestigt', '2026-05-02T10:00:00.000Z'), // grösster
      c: mockFortschritt('ueben', '2026-04-30T10:00:00.000Z'),
    }

    const result = berechneKartenDaten(lernziel, fortschritte)

    expect(result.letzterVersuch).toBe('2026-05-02T10:00:00.000Z')
  })

  it('letzterVersuch ist null wenn keine Fortschritte vorhanden', () => {
    const lernziel = mockLernziel({ fragenIds: ['a', 'b'] })
    const result = berechneKartenDaten(lernziel, {})
    expect(result.letzterVersuch).toBeNull()
  })

  it('total ist 0 bei leeren fragenIds', () => {
    const lernziel = mockLernziel({ fragenIds: [] })
    const result = berechneKartenDaten(lernziel, {})
    expect(result.total).toBe(0)
  })

  it('total ist 0 bei fehlendem fragenIds', () => {
    const lernziel = mockLernziel({ fragenIds: undefined })
    const result = berechneKartenDaten(lernziel, {})
    expect(result.total).toBe(0)
  })

  it('alle Fragen ohne Fortschritt → alles neu', () => {
    const lernziel = mockLernziel({ fragenIds: ['a', 'b', 'c'] })
    const result = berechneKartenDaten(lernziel, {})
    expect(result.buckets).toEqual({ gemeistert: 0, gefestigt: 0, ueben: 0, neu: 3 })
    expect(result.nichtSicher).toBe(3)
    expect(result.letzterVersuch).toBeNull()
  })
})

// ─── LernzielKarte (Render-Tests) ─────────────────────────────────────────────

describe('LernzielKarte', () => {
  const baseProps = {
    lernziel: mockLernziel({ fragenIds: ['a', 'b', 'c'] }),
    fortschritte: {} as Record<string, FragenFortschritt>,
    onUeben: vi.fn(),
    onZurueck: vi.fn(),
  }

  it('zeigt Trophy bei Status gemeistert', () => {
    // Alle 3 Fragen gemeistert → status = gemeistert
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('gemeistert', '2026-05-01T10:00:00.000Z'),
      b: mockFortschritt('gemeistert', '2026-05-01T10:00:00.000Z'),
      c: mockFortschritt('gemeistert', '2026-05-01T10:00:00.000Z'),
    }
    const { container } = render(
      <LernzielKarte {...baseProps} fortschritte={fortschritte} />
    )
    // Lucide Trophy rendert als svg.lucide-trophy
    expect(container.querySelector('svg.lucide-trophy')).toBeTruthy()
  })

  it('zeigt KEIN Trophy bei Status inArbeit', () => {
    // 1 von 3 geübt, Rest neu → inArbeit
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('ueben', '2026-05-01T10:00:00.000Z'),
    }
    const { container } = render(
      <LernzielKarte {...baseProps} fortschritte={fortschritte} />
    )
    expect(container.querySelector('svg.lucide-trophy')).toBeFalsy()
  })

  it('Üben-Button ist disabled bei total === 0', () => {
    const lernzielOhneFragen = mockLernziel({ fragenIds: [] })
    render(
      <LernzielKarte
        {...baseProps}
        lernziel={lernzielOhneFragen}
      />
    )
    const btn = screen.getByRole('button', { name: /üben/i })
    expect(btn).toBeDisabled()
  })

  it('Üben-Button ist aktiv wenn Fragen vorhanden', () => {
    render(<LernzielKarte {...baseProps} />)
    const btn = screen.getByRole('button', { name: /üben/i })
    expect(btn).not.toBeDisabled()
  })

  it('zeigt Lernziel-Text und Bloom-Badge mit Label', () => {
    render(<LernzielKarte {...baseProps} />)
    expect(screen.getByText(/Marketingmix/)).toBeInTheDocument()
    // Badge zeigt Code + deutsches Label, z.B. „K2 Verstehen"
    expect(screen.getByText(/K2 Verstehen/)).toBeInTheDocument()
  })

  it('zeigt Breadcrumb fach › thema', () => {
    const { container } = render(<LernzielKarte {...baseProps} />)
    // Breadcrumb-Element prüfen (p.text-xs mit fach und thema)
    const breadcrumb = container.querySelector('p.text-xs')
    expect(breadcrumb?.textContent).toContain('BWL')
    expect(breadcrumb?.textContent).toContain('Marketing')
    expect(breadcrumb?.textContent).toContain('›')
  })

  it('zeigt Hinweis bei keinen Fragen', () => {
    const lernzielOhneFragen = mockLernziel({ fragenIds: [] })
    render(
      <LernzielKarte
        {...baseProps}
        lernziel={lernzielOhneFragen}
      />
    )
    expect(screen.getByText(/keine Fragen/i)).toBeInTheDocument()
  })

  it('zeigt Zuletzt-geübt wenn letzterVersuch vorhanden', () => {
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('ueben', '2026-05-01T10:00:00.000Z'),
    }
    render(<LernzielKarte {...baseProps} fortschritte={fortschritte} />)
    expect(screen.getByText(/Zuletzt geübt/)).toBeInTheDocument()
  })

  it('zeigt KEIN Zuletzt-geübt wenn kein Fortschritt', () => {
    render(<LernzielKarte {...baseProps} fortschritte={{}} />)
    expect(screen.queryByText(/Zuletzt geübt/)).not.toBeInTheDocument()
  })

  it('zeigt Einstiegs-Banner wenn noch nie geübt (alle neu)', () => {
    // fragenIds vorhanden aber keine Fortschritte → nichtSicher === total
    render(<LernzielKarte {...baseProps} fortschritte={{}} />)
    expect(screen.getByText(/Leg los/i)).toBeInTheDocument()
  })

  it('zeigt Standard-Empfehlung wenn nicht alle neu', () => {
    const fortschritte: Record<string, FragenFortschritt> = {
      a: mockFortschritt('ueben', '2026-05-01T10:00:00.000Z'),
    }
    render(<LernzielKarte {...baseProps} fortschritte={fortschritte} />)
    // 2 von 3 noch nicht sicher (b und c neu, a ueben → alle 3 nichtSicher),
    // aber es gibt einen Fortschritt → muss letzterVersuch gesetzt sein
    // Tatsächlich: a=ueben, b=neu, c=neu → nichtSicher=3 === total=3 → Einstiegs-Banner
    // Für Standard-Empfehlung brauche ich: nichtSicher < total
    // a=gefestigt, b=ueben, c=neu → nichtSicher=2, total=3 → Standard
    const fortschritteGemischt: Record<string, FragenFortschritt> = {
      a: mockFortschritt('gefestigt', '2026-05-01T10:00:00.000Z'),
      b: mockFortschritt('ueben', '2026-05-01T10:00:00.000Z'),
    }
    render(<LernzielKarte {...baseProps} fortschritte={fortschritteGemischt} />)
    expect(screen.getByText(/nicht sicher/i)).toBeInTheDocument()
  })
})
