import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// --- Mocks (vor Komponenten-Import) ----------------------------------------

const pruefeAntwortJetzt = vi.fn()
const naechsteFrage = vi.fn()
const beendeSession = vi.fn()
const zuErgebnis = vi.fn()

let storeState: Record<string, unknown> = {}

vi.mock('../../store/ueben/uebungsStore', () => ({
  useUebenUebungsStore: () => storeState,
}))

vi.mock('../../hooks/ueben/useSuSNavigation', () => ({
  useSuSNavigation: () => ({ zuErgebnis }),
}))

// FrageRenderer rendern wir nicht — keine Apps-Script-Calls, kein Store-Pull
vi.mock('../FrageRenderer', () => ({
  default: () => <div data-testid="frage-renderer">FrageRenderer-Mock</div>,
}))

// Prefetch-Hook irrelevant für Tastatur-Tests
vi.mock('../../hooks/usePrefetchAssets', () => ({
  usePrefetchAssets: () => {},
}))

// Tochter-Komponenten — keine Bedeutung für Tastatur-Logik, render-stubs reichen
vi.mock('./uebung/QuizHeader', () => ({
  default: () => <div data-testid="quiz-header" />,
}))
vi.mock('./uebung/QuizNavigation', () => ({
  default: () => <div data-testid="quiz-nav" />,
}))
vi.mock('./uebung/QuizActions', () => ({
  default: () => <div data-testid="quiz-actions" />,
}))
vi.mock('./uebung/SelbstbewertungsDialog', () => ({
  default: () => <div data-testid="sb-dialog" />,
}))

import UebungsScreen from './UebungsScreen'

// --- Helpers ---------------------------------------------------------------

function basisFrage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q1',
    typ: 'mc',
    fragetext: 'F?',
    fachbereich: 'BWL',
    bloom: 'K2',
    punkte: 1,
    schwierigkeit: 2,
    ...overrides,
  }
}

function basisSession(frage: ReturnType<typeof basisFrage>, overrides: Record<string, unknown> = {}) {
  return {
    fach: 'BWL',
    thema: 'T',
    score: 0,
    fragen: [frage],
    aktuelleFrageIndex: 0,
    antworten: {} as Record<string, unknown>,
    zwischenstande: {},
    beendet: false,
    gruppeId: 'g1',
    ...overrides,
  }
}

function setupStore(opts: {
  frage: ReturnType<typeof basisFrage> | null
  session: ReturnType<typeof basisSession> | null
  feedbackSichtbar?: boolean
}) {
  const { frage, session, feedbackSichtbar = false } = opts
  storeState = {
    session,
    feedbackSichtbar,
    naechsteFrage,
    vorherigeFrage: vi.fn(),
    ueberspringen: vi.fn(),
    toggleUnsicher: vi.fn(),
    istUnsicher: () => false,
    istSessionFertig: () => false,
    beendeSession,
    aktuelleFrage: () => frage,
    kannZurueck: () => false,
    pruefeAntwortJetzt,
    selbstbewertenById: vi.fn(),
    speichertPruefung: false,
    pruefFehler: null,
    letzteMusterloesung: null,
    letzteAntwortKorrekt: null,
  }
}

function renderScreen() {
  return render(
    <MemoryRouter>
      <UebungsScreen />
    </MemoryRouter>,
  )
}

// --- Tests ------------------------------------------------------------------

describe('UebungsScreen Tastatur Bundle H Phase 5', () => {
  beforeEach(() => {
    pruefeAntwortJetzt.mockReset()
    naechsteFrage.mockReset()
    beendeSession.mockReset()
    zuErgebnis.mockReset()
  })

  afterEach(() => {
    storeState = {}
  })

  it('Enter ohne fokussiertes Eingabe-Element triggert pruefeAntwortJetzt', () => {
    const frage = basisFrage()
    setupStore({ frage, session: basisSession(frage) })
    renderScreen()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(pruefeAntwortJetzt).toHaveBeenCalledWith('q1')
  })

  it('Enter in Tiptap-data-no-enter-submit-Wrapper blockiert Submit', () => {
    const frage = basisFrage()
    setupStore({ frage, session: basisSession(frage) })
    const { container } = renderScreen()
    // Künstlichen Wrapper als Target nachbilden
    const wrapper = document.createElement('div')
    wrapper.setAttribute('data-no-enter-submit', '')
    container.appendChild(wrapper)
    fireEvent.keyDown(wrapper, { key: 'Enter' })
    expect(pruefeAntwortJetzt).not.toHaveBeenCalled()
  })

  it('Cmd+Enter in textarea triggert Submit (Whitelist-Override)', () => {
    const frage = basisFrage()
    setupStore({ frage, session: basisSession(frage) })
    const { container } = renderScreen()
    const ta = document.createElement('textarea')
    container.appendChild(ta)
    fireEvent.keyDown(ta, { key: 'Enter', metaKey: true })
    expect(pruefeAntwortJetzt).toHaveBeenCalledWith('q1')
  })

  it('Lückentext mit offenen Lücken: Enter zeigt Hinweis, kein pruefeAntwortJetzt', () => {
    const frage = basisFrage({
      typ: 'lueckentext',
      luecken: [
        { id: 'l0', korrekteAntworten: ['x'], caseSensitive: false },
        { id: 'l1', korrekteAntworten: ['y'], caseSensitive: false },
      ],
      textMitLuecken: 'A {0} B {1}',
    })
    setupStore({ frage, session: basisSession(frage) })
    renderScreen()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(pruefeAntwortJetzt).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(/Noch 2 Lücken offen/)
  })

  it('Lückentext-Hinweis verschwindet nach 3s', () => {
    vi.useFakeTimers()
    try {
      const frage = basisFrage({
        typ: 'lueckentext',
        luecken: [{ id: 'l0', korrekteAntworten: ['x'], caseSensitive: false }],
        textMitLuecken: 'A {0}',
      })
      setupStore({ frage, session: basisSession(frage) })
      renderScreen()
      fireEvent.keyDown(window, { key: 'Enter' })
      expect(screen.getByRole('status')).toHaveTextContent(/Noch 1 Lücke offen/)
      act(() => {
        vi.advanceTimersByTime(3100)
      })
      expect(screen.queryByRole('status')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('Enter wenn feedbackSichtbar triggert naechsteFrage', () => {
    const frage = basisFrage()
    setupStore({ frage, session: basisSession(frage), feedbackSichtbar: true })
    renderScreen()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(naechsteFrage).toHaveBeenCalled()
    expect(pruefeAntwortJetzt).not.toHaveBeenCalled()
  })
})
