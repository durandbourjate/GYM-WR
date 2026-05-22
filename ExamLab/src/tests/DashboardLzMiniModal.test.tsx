// ExamLab/src/tests/DashboardLzMiniModal.test.tsx
//
// Integrationstest: LernzieleMiniModal öffnet sich korrekt, AUCH wenn der
// Thema-Detail-Zweig (ThemaDetailView) aktiv ist.
//
// Dieser Test fixiert den kritischen Bug, bei dem lzMiniModal nur im
// Themen-Übersicht-Arm des Ternary lag, sodass ein Klick auf den Unterthema-
// Flag-Icon in ThemaDetailView zwar setState setzte, aber keinen sichtbaren
// Consumer hatte (der <LernzieleMiniModal>-Block war unmounted).
//
// Fix-Commit: feat(lernziele): Unterthema-Lernziele-Icon — Mini-Modal ...

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ─── Stores & Hooks — minimal mocken ─────────────────────────────────────────
// Dashboard-Stores werden ohne Selektor gerufen: `const { user } = useUebenAuthStore()`
// Daher müssen die Mocks das State-Objekt direkt zurückgeben (kein Selektor-Pattern).

vi.mock('../store/ueben/authStore', () => ({
  useUebenAuthStore: () => ({ user: { vorname: 'Test', email: 'test@stud.example.com' } }),
}))

vi.mock('../store/ueben/gruppenStore', () => ({
  useUebenGruppenStore: () => ({ aktiveGruppe: { id: 'gruppe-1', name: 'Testklasse' } }),
}))

vi.mock('../store/ueben/uebungsStore', () => ({
  useUebenUebungsStore: () => ({
    starteSession: vi.fn(),
    starteLernzielSession: vi.fn().mockResolvedValue(true),
  }),
}))

vi.mock('../store/ueben/fortschrittStore', () => ({
  useUebenFortschrittStore: () => ({
    getThemenFortschritt: vi.fn().mockReturnValue({ gesamt: 1, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 1, quote: 0 }),
    fortschritte: {},
    lernziele: [
      {
        id: 'lz-ut-1',
        fach: 'BWL',
        thema: 'Marketing',
        unterthema: 'Produktpolitik',
        text: 'Der Schüler kann die Produktpolitik erklären.',
        bloom: 'K2',
        aktiv: true,
      },
    ],
    ladeFortschritt: vi.fn(),
  }),
}))

vi.mock('../store/ueben/auftragStore', () => ({
  useUebenAuftragStore: () => ({ auftraege: [], ladeAuftraege: vi.fn() }),
}))

vi.mock('../store/ueben/navigationStore', () => ({
  useUebenNavigationStore: Object.assign(
    () => ({ deepLinkThema: null, setDeepLinkThema: vi.fn() }),
    { getState: () => ({ setDeepLinkThema: vi.fn() }) },
  ),
}))

vi.mock('../store/ueben/themenSichtbarkeitStore', () => ({
  useThemenSichtbarkeitStore: () => ({
    freischaltungen: [],
    getStatus: vi.fn().mockReturnValue('aktiv'),
    getAktiveUnterthemen: vi.fn().mockReturnValue(undefined),
    ladeFreischaltungen: vi.fn(),
  }),
}))

vi.mock('../store/ueben/settingsStore', () => ({
  useUebenSettingsStore: () => ({ einstellungen: null }),
}))

// useToast — shared-Package
vi.mock('@gymhofwil/shared', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn() }),
}))

// Context-Hook
vi.mock('../hooks/ueben/useUebenKontext', () => ({
  useUebenKontext: () => ({ sichtbareFaecher: ['BWL'], fachFarben: {} }),
}))

vi.mock('../hooks/ueben/useSuSNavigation', () => ({
  useSuSNavigation: () => ({ openUebung: vi.fn() }),
}))

// useDashboardLoad — stellt alleFragen bereit, setzt laden=false
vi.mock('../hooks/ueben/useDashboardLoad', () => ({
  useDashboardLoad: () => ({
    alleFragen: [
      {
        id: 'f-1',
        typ: 'mc',
        frage: 'Testfrage',
        fach: 'BWL',
        thema: 'Marketing',
        unterthema: 'Produktpolitik',
        schwierigkeit: 1,
      },
    ],
    laden: false,
  }),
}))

// useThemenKomputationen — stellt themaDetail bereit, sodass der Detail-Zweig aktiv ist.
// Das ist der zentrale Schalter: aktiv themaDetail = ThemaDetailView wird gerendert,
// NICHT die Themen-Übersicht.
const mockThemaDetail = {
  fach: 'BWL',
  thema: 'Marketing',
  unterthemen: ['Produktpolitik'],
  fragen: [
    {
      id: 'f-1',
      typ: 'mc',
      frage: 'Testfrage',
      fach: 'BWL',
      thema: 'Marketing',
      unterthema: 'Produktpolitik',
      schwierigkeit: 1,
    },
  ],
  fortschritt: { fach: 'BWL', thema: 'Marketing', gesamt: 1, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 1, quote: 0 },
}

vi.mock('../hooks/ueben/useThemenKomputationen', () => ({
  useThemenKomputationen: () => ({
    themenMap: { BWL: [mockThemaDetail] },
    verfuegbareFaecher: ['BWL'],
    themenSektionen: { aktuelle: [], faecherSortiert: [['BWL', [mockThemaDetail]]], weitere: [] },
    themaDetail: mockThemaDetail,
    gefilterteFragen: mockThemaDetail.fragen,
    empfehlungen: [],
  }),
}))

// Adapter + PreWarm — fire-and-forget, kein Rückgabewert nötig
vi.mock('../adapters/ueben/appsScriptAdapter', () => ({
  uebenFragenAdapter: {
    ladeFragen: vi.fn().mockResolvedValue([]),
    getCachedFragen: vi.fn().mockReturnValue(null),
  },
}))

vi.mock('../services/preWarmApi', () => ({
  preWarmFragen: vi.fn().mockResolvedValue(undefined),
}))

// Store-Auth für useTagsStore (intern in useThemenKomputationen — wird hier weggemockt)
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: null }) => unknown) => selector({ user: null }),
}))

vi.mock('../store/tagsStore', () => ({
  useTagsStore: (selector: (s: { tags: [] }) => unknown) => selector({ tags: [] }),
}))

// matchMedia + scrollIntoView — jsdom-Pflicht
beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  // jsdom unterstützt scrollIntoView nicht nativ — global patchen
  // (gleicher Patch wie in LernzieleAkkordeon.test.tsx)
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// Lazy-Import: Mocks müssen vor dem Modul-Init wirken
async function ladeDashboard() {
  const Modul = await import('../components/ueben/Dashboard')
  return Modul.default
}

// ─── Test ─────────────────────────────────────────────────────────────────────

describe('Dashboard — LernzieleMiniModal in beiden Ternary-Zweigen (Integrationstest)', () => {
  // Hilfsfunktion: Dashboard rendern und in den Detail-Zweig navigieren.
  // Dashboard nutzt lokalen State `aktivesThema` (Initialwert: null) als Guard.
  // Wir klicken auf die "Marketing"-ThemaKarte, damit oeffneThema() den State setzt.
  // Danach ist `aktivesThema && themaDetail` wahr → ThemaDetailView wird gerendert.
  async function renderUndNavigiereZuDetail() {
    const Dashboard = await ladeDashboard()
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/sus/ueben']}>
          <Dashboard />
        </MemoryRouter>,
      )
    })

    // Übersicht: ThemaKarte "Marketing" klicken → oeffneThema setzt aktivesThema
    const themaKarte = screen.getByRole('button', { name: /Marketing/i })
    await act(async () => {
      fireEvent.click(themaKarte)
    })

    return screen
  }

  it('öffnet LernzieleMiniModal aus ThemaDetailView (Unterthema-Flag-Icon), obwohl Detail-Zweig aktiv ist', async () => {
    // ARRANGE + NAVIGATE: Dashboard mit aktivem themaDetail (Detail-Zweig ist aktiv)
    await renderUndNavigiereZuDetail()

    // ASSERT: ThemaDetailView ist sichtbar (nicht die Themen-Übersicht).
    // ThemaDetailView zeigt den Thema-Titel "Marketing" als heading.
    expect(screen.getByRole('heading', { name: /Marketing/i })).toBeInTheDocument()

    // ASSERT: Der Flag-Icon-Button für das Unterthema "Produktpolitik" ist vorhanden.
    // ThemaDetailView rendert ihn, weil lernzieleProUnterthema["Produktpolitik"] = 1
    // (aus fortschrittStore-Mock: 1 Lernziel mit unterthema='Produktpolitik').
    const flagButton = screen.getByRole('button', { name: 'Lernziele' })
    expect(flagButton).toBeInTheDocument()

    // Vor dem Klick: Modal-Inhalt darf noch nicht im DOM sein.
    expect(screen.queryByText('Der Schüler kann die Produktpolitik erklären.')).not.toBeInTheDocument()
    // Das Modal hat einen "Schliessen"-Button — vor Öffnung nicht vorhanden.
    expect(screen.queryByRole('button', { name: 'Schliessen' })).not.toBeInTheDocument()

    // ACT: Klick auf den Flag-Icon-Button → setLzMiniModal({ fach, thema, fokusUnterthema })
    await act(async () => {
      fireEvent.click(flagButton)
    })

    // ASSERT: LernzieleMiniModal ist jetzt sichtbar.
    // Das Modal enthält den Lernziel-Text aus dem gemockten lernziele-Array.
    // (Vor dem Fix: dieser Text war nie im DOM, weil der Modal-Block im
    // Übersicht-Arm lag — unmounted während Detail-Arm aktiv ist.)
    expect(screen.getByText('Der Schüler kann die Produktpolitik erklären.')).toBeInTheDocument()

    // Das Modal zeigt auch den "Schliessen"-Button.
    expect(screen.getByRole('button', { name: 'Schliessen' })).toBeInTheDocument()
  })

  it('LernzieleMiniModal schliesst sich wieder wenn Schliessen-Button geklickt wird', async () => {
    await renderUndNavigiereZuDetail()

    // Modal öffnen über Flag-Icon
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
    })

    // Modal ist offen
    expect(screen.getByText('Der Schüler kann die Produktpolitik erklären.')).toBeInTheDocument()

    // Schliessen klicken
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Schliessen' }))
    })

    // Modal ist weg — Detail-View bleibt aber aktiv
    expect(screen.queryByText('Der Schüler kann die Produktpolitik erklären.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Schliessen' })).not.toBeInTheDocument()
    // ThemaDetailView ist noch da
    expect(screen.getByRole('heading', { name: /Marketing/i })).toBeInTheDocument()
  })
})
