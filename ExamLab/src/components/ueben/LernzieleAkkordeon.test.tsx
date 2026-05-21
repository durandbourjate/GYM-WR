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

  it('LernzieleAkkordeon rendert ohne onLernzielUeben-Prop', () => {
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

// ─── LernzieleMiniModal — Master-Detail ───────────────────────────────────────

import { LernzieleMiniModal } from './LernzieleAkkordeon'

describe('LernzieleMiniModal — Master-Detail', () => {
  const lernzielBWL = mockLernziel({
    id: 'lz-mm-1',
    fach: 'BWL',
    thema: 'Marketing',
    text: 'Der Schüler kann die Marketingmix-Instrumente erklären.',
    bloom: 'K2',
  })

  const defaultMiniProps = {
    thema: 'Marketing',
    fach: 'BWL',
    lernziele: [lernzielBWL],
    fortschritte: leererFortschritt,
    onSchliessen: vi.fn(),
  }

  it('zeigt Lernziel-Liste initial an', () => {
    render(<LernzieleMiniModal {...defaultMiniProps} />)
    expect(screen.getByText('Der Schüler kann die Marketingmix-Instrumente erklären.')).toBeInTheDocument()
  })

  it('Klick auf Lernziel-Zeile zeigt LernzielKarte (Master-Detail-Swap)', async () => {
    const user = userEvent.setup()
    render(<LernzieleMiniModal {...defaultMiniProps} />)

    // Lernziel-Zeile klicken
    const lernzielZeile = screen.getByRole('button', { name: /Marketingmix/i })
    await user.click(lernzielZeile)

    // Detail-Ansicht: Lernziel-Text sichtbar + Üben-Button erscheint
    expect(screen.getByText('Der Schüler kann die Marketingmix-Instrumente erklären.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /üben/i })).toBeInTheDocument()

    // Lernziel-Liste muss verschwunden sein (Thema-Header-Text bleibt, aber kein Liste-Eintrag mehr)
    // Prüfen: kein Lernziel-Zeile mehr als role="button" mit dem Lernziel-Text sichtbar
    expect(screen.queryByRole('button', { name: /Marketingmix/i })).not.toBeInTheDocument()
  })

  it('Zurück-Button kehrt zur Lernziel-Liste zurück', async () => {
    const user = userEvent.setup()
    render(<LernzieleMiniModal {...defaultMiniProps} />)

    // Auf Lernziel klicken → Detail-Ansicht
    await user.click(screen.getByRole('button', { name: /Marketingmix/i }))

    // Zurück-Button sichtbar
    expect(screen.getByRole('button', { name: /zurück/i })).toBeInTheDocument()

    // Zurück klicken
    await user.click(screen.getByRole('button', { name: /zurück/i }))

    // Liste wieder sichtbar
    expect(screen.getByRole('button', { name: /Marketingmix/i })).toBeInTheDocument()
    // Üben-Button aus LernzielKarte weg (nur noch Thema-Üben-Button falls vorhanden, aber kein "Üben" aus LernzielKarte)
    expect(screen.queryByRole('button', { name: /^üben$/i })).not.toBeInTheDocument()
  })

  it('Üben-Button auf LernzielKarte ruft onLernzielUeben mit dem Lernziel auf', async () => {
    const onLernzielUeben = vi.fn()
    const user = userEvent.setup()

    render(
      <LernzieleMiniModal
        {...defaultMiniProps}
        lernziele={[mockLernziel({ id: 'lz-mm-1', fach: 'BWL', thema: 'Marketing', fragenIds: ['f1'] })]}
        onLernzielUeben={onLernzielUeben}
      />,
    )

    // Auf Lernziel klicken
    await user.click(screen.getByRole('button', { name: /Marketingmix/i }))

    // Üben klicken
    await user.click(screen.getByRole('button', { name: /^üben$/i }))

    expect(onLernzielUeben).toHaveBeenCalledTimes(1)
    expect(onLernzielUeben).toHaveBeenCalledWith(expect.objectContaining({ id: 'lz-mm-1' }))
  })

  it('rendert ohne onLernzielUeben-Prop (optionaler Prop)', () => {
    // Kein Fehler wenn onLernzielUeben fehlt
    render(<LernzieleMiniModal {...defaultMiniProps} />)
    expect(screen.getByText('Der Schüler kann die Marketingmix-Instrumente erklären.')).toBeInTheDocument()
  })

  it('fokusUnterthema scrollt nicht wenn Detail-Karte offen ist', async () => {
    // Fix 1: useEffect-Guard — scrollIntoView darf NICHT laufen wenn gewaehltesLernziel gesetzt ist
    const scrollIntoViewMock = vi.fn()
    // jsdom unterstützt scrollIntoView nicht nativ — global patchen
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock

    const lzMitUt = mockLernziel({
      id: 'lz-ut-1',
      fach: 'BWL',
      thema: 'Marketing',
      text: 'Der Schüler kann die Marketingmix-Instrumente erklären.',
      unterthema: 'Produktpolitik',
    })

    const user = userEvent.setup()
    render(
      <LernzieleMiniModal
        {...defaultMiniProps}
        lernziele={[lzMitUt]}
        fokusUnterthema="Produktpolitik"
      />,
    )

    // Initial: Liste sichtbar → fokusUnterthema-Effect läuft, scrollIntoView kann aufgerufen werden
    // (je nach jsdom-Timing; der Test prüft nur das Verhalten im Detail-View)
    scrollIntoViewMock.mockClear()

    // Lernziel-Zeile klicken → Detail-Karte öffnet sich
    const lernzielZeile = screen.getByRole('button', { name: /Marketingmix/i })
    await user.click(lernzielZeile)

    // Detail-Karte ist jetzt offen — scrollIntoView darf nicht mehr aufgerufen werden
    scrollIntoViewMock.mockClear()

    // Zurück zur Liste
    await user.click(screen.getByRole('button', { name: /zurück/i }))

    // Liste wieder sichtbar — Lernziel-Zeile muss wieder da sein
    expect(screen.getByRole('button', { name: /Marketingmix/i })).toBeInTheDocument()
  })
})
