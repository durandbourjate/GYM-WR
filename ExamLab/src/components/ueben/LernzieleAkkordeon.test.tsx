// ExamLab/src/components/ueben/LernzieleAkkordeon.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LernzieleAkkordeon from './LernzieleAkkordeon'
import type { Lernziel } from '../../types/pool'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'

// ─── Mock-Daten ───────────────────────────────────────────────────────────────

function mockLernziel(overrides?: Partial<Lernziel>): Lernziel {
  return {
    id: 'lz-1',
    fach: 'BWL',
    thema: 'Marketing',
    text: 'Der Schüler kann die Marketingmix-Instrumente erklären.',
    bloom: 'K2',
    aktiv: true,
    ...overrides,
  }
}

const leererFortschritt: Record<string, FragenFortschritt> = {}

// ─── LernzieleAkkordeon — Master-Detail ──────────────────────────────────────

describe('LernzieleAkkordeon — Master-Detail', () => {
  const lernziel1 = mockLernziel({
    id: 'lz-1',
    fach: 'BWL',
    thema: 'Marketing',
    text: 'Der Schüler kann die Marketingmix-Instrumente erklären.',
    bloom: 'K2',
  })

  const defaultProps = {
    lernziele: [lernziel1],
    fortschritte: leererFortschritt,
    onSchliessen: vi.fn(),
    onThemaUeben: vi.fn(),
    onLernzielUeben: vi.fn(),
  }

  async function renderUndAufklappen() {
    const user = userEvent.setup()
    render(<LernzieleAkkordeon {...defaultProps} />)

    // Fach aufklappen
    const fachButton = screen.getByRole('button', { name: /BWL/ })
    await user.click(fachButton)

    // Thema aufklappen
    const themaButton = screen.getByRole('button', { name: /Marketing/ })
    await user.click(themaButton)

    // Lernziel-Zeile sollte jetzt sichtbar sein
    return user
  }

  it('zeigt Lernziel-Zeile nach Aufklappen von Fach und Thema', async () => {
    await renderUndAufklappen()
    expect(screen.getByText('Der Schüler kann die Marketingmix-Instrumente erklären.')).toBeInTheDocument()
  })

  it('Klick auf Lernziel-Zeile zeigt LernzielKarte (Master-Detail-Swap)', async () => {
    const user = await renderUndAufklappen()

    // Lernziel-Zeile klicken
    const lernzielZeile = screen.getByRole('button', { name: /Marketingmix/ })
    await user.click(lernzielZeile)

    // Detail-Ansicht muss erscheinen: Lernziel-Text + Üben-Button
    expect(screen.getByText('Der Schüler kann die Marketingmix-Instrumente erklären.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /üben/i })).toBeInTheDocument()

    // Fach-Liste muss verschwunden sein
    expect(screen.queryByRole('button', { name: /BWL/ })).not.toBeInTheDocument()
  })

  it('Klick auf Zurück kehrt zur Fach-Liste zurück', async () => {
    const user = await renderUndAufklappen()

    const lernzielZeile = screen.getByRole('button', { name: /Marketingmix/ })
    await user.click(lernzielZeile)

    // LernzielKarte-spezifische Elemente sind sichtbar
    expect(screen.getByRole('button', { name: /zurück/i })).toBeInTheDocument()
    // Fach-Liste ist verschwunden
    expect(screen.queryByRole('button', { name: /BWL/ })).not.toBeInTheDocument()

    // Zurück klicken
    const zurueckButton = screen.getByRole('button', { name: /zurück/i })
    await user.click(zurueckButton)

    // Fach-Liste wieder sichtbar
    expect(screen.getByRole('button', { name: /BWL/ })).toBeInTheDocument()

    // Zurück-Button (LernzielKarte) verschwunden
    expect(screen.queryByRole('button', { name: /zurück zur lernziel/i })).not.toBeInTheDocument()
  })

  it('Üben-Button auf LernzielKarte ruft onLernzielUeben mit dem Lernziel auf', async () => {
    const onLernzielUeben = vi.fn()
    const user = userEvent.setup()

    render(
      <LernzieleAkkordeon
        {...defaultProps}
        onLernzielUeben={onLernzielUeben}
        lernziele={[mockLernziel({ id: 'lz-1', fragenIds: ['f1'] })]}
      />,
    )

    // Aufklappen
    await user.click(screen.getByRole('button', { name: /BWL/ }))
    await user.click(screen.getByRole('button', { name: /Marketing/ }))

    // Auf Lernziel klicken
    await user.click(screen.getByRole('button', { name: /Marketingmix/ }))

    // Üben klicken
    await user.click(screen.getByRole('button', { name: /üben/i }))

    expect(onLernzielUeben).toHaveBeenCalledTimes(1)
    expect(onLernzielUeben).toHaveBeenCalledWith(expect.objectContaining({ id: 'lz-1' }))
  })

  it('Lernziel-Zeile ist per Tastatur (Enter) navigierbar', async () => {
    const user = userEvent.setup()
    render(<LernzieleAkkordeon {...defaultProps} />)

    // Aufklappen
    await user.click(screen.getByRole('button', { name: /BWL/ }))
    await user.click(screen.getByRole('button', { name: /Marketing/ }))

    // Lernziel-Zeile via Tastatur aktivieren
    const lernzielZeile = screen.getByRole('button', { name: /Marketingmix/ })
    lernzielZeile.focus()
    await user.keyboard('{Enter}')

    // Detail-Ansicht muss erscheinen
    expect(screen.getByRole('button', { name: /zurück/i })).toBeInTheDocument()
  })

  it('LernzieleMiniModal wird nicht verändert (keine LernzielKarte statt Mini-Modal)', () => {
    // Smoke-Test: LernzieleAkkordeon ohne onLernzielUeben prop rendert fehlerfrei
    render(
      <LernzieleAkkordeon
        lernziele={[lernziel1]}
        fortschritte={leererFortschritt}
        onSchliessen={vi.fn()}
        onThemaUeben={vi.fn()}
        // onLernzielUeben absichtlich weggelassen (optional prop)
      />,
    )
    // Modal-Titel muss vorhanden sein
    expect(screen.getByText(/alle lernziele/i)).toBeInTheDocument()
  })
})
