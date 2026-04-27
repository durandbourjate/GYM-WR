/**
 * G.f.2 — FragenBrowser Skeleton-Tests
 *
 * Verifiziert dass FragenBrowser <FragenListeSkeleton> (8 Karten) zeigt,
 * wenn ladeStatus === 'laden' — d.h. storeStatus in {'idle','summary_laden'}
 * und kein Demo-Modus und apiService.istKonfiguriert() === true.
 *
 * Zwei Render-Modi werden geprüft: inline (Seitenkomponente) + overlay (default).
 *
 * Sub-Komponenten werden gemockt um den Test-Aufwand minimal zu halten —
 * die Skeleton-Logik liegt direkt in FragenBrowser selbst (Z. 334 / Z. 505).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import FragenBrowser from '../components/lp/fragenbank/FragenBrowser'

// --- apiService: konfiguriert, kein Demo ---
vi.mock('../services/apiService', () => ({
  apiService: {
    istKonfiguriert: () => true,
    ladeTrackerDaten: vi.fn().mockResolvedValue(null),
    speichereFrage: vi.fn(),
    loescheFrage: vi.fn(),
    dupliziereFrage: vi.fn(),
  },
}))

// --- authStore: echter LP, kein Demo-Modus ---
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { email: string } | null; istDemoModus: boolean }) => unknown) =>
    selector({ user: { email: 'test@gymhofwil.ch' }, istDemoModus: false }),
}))

// --- fragenbankStore: status='idle' → ladeStatus wird 'laden' ---
vi.mock('../store/fragenbankStore', () => ({
  useFragenbankStore: Object.assign(
    (selector: (s: { summaries: []; fragen: []; status: 'idle' }) => unknown) =>
      selector({ summaries: [], fragen: [], status: 'idle' }),
    {
      getState: () => ({
        getDetail: () => null,
        ladeDetail: vi.fn(),
        lade: vi.fn(),
        setFragen: vi.fn(),
        aktualisiereFrage: vi.fn(),
        entferneFrage: vi.fn(),
        fuegeFragenHinzu: vi.fn(),
        summaries: [],
        fragen: [],
      }),
    },
  ),
}))

// --- Schwere Sub-Komponenten mocken (werden nur bei ladeStatus='fertig' gerendert) ---
vi.mock('../components/lp/fragenbank/fragenbrowser/FragenBrowserHeader', () => ({
  default: () => <div data-testid="fragen-browser-header-mock" />,
}))

vi.mock('../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe', () => ({
  default: () => <div data-testid="virtualisierte-fragen-liste-mock" />,
}))

vi.mock('../components/lp/frageneditor/FragenEditor', () => ({
  default: () => <div data-testid="fragen-editor-mock" />,
}))

vi.mock('../components/lp/fragenbank/FragenImport', () => ({
  default: () => <div data-testid="fragen-import-mock" />,
}))

vi.mock('../components/lp/fragenbank/ExcelImport', () => ({
  default: () => <div data-testid="excel-import-mock" />,
}))

vi.mock('../components/lp/korrektur/BatchExportDialog', () => ({
  default: () => <div data-testid="batch-export-mock" />,
}))

// ResizableSidebar: Children durchlassen (wird im overlay-Modus gebraucht)
vi.mock('@shared/ui/ResizableSidebar', () => ({
  ResizableSidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-sidebar-mock">{children}</div>
  ),
}))

// --- Hooks die Side-Effects haben ---
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}))

vi.mock('../hooks/useEditorNeighborPrefetch', () => ({
  useEditorNeighborPrefetch: vi.fn(),
}))

// demoFragen nicht nötig (Demo-Modus aus), aber Import muss auflösen
vi.mock('../data/demoFragen', () => ({
  demoFragen: [],
}))

// --- Hilfsfunktionen die im Hook/Util-Pfad gebraucht werden ---
vi.mock('../utils/trackerUtils', () => ({
  erstelleDemoTrackerDaten: vi.fn(() => []),
  aggregiereFragenPerformance: vi.fn(() => new Map()),
}))

// ---

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('FragenBrowser G.f.2 Skeleton', () => {
  it('zeigt FragenListeSkeleton im inline-Modus wenn ladeStatus === laden', () => {
    const { container } = render(
      <FragenBrowser
        onHinzufuegen={() => {}}
        onSchliessen={() => {}}
        bereitsVerwendet={[]}
        inline
      />,
    )
    const karten = container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]')
    expect(karten.length).toBe(8)
    // Alter Lade-Text soll nicht mehr erscheinen
    expect(container.textContent).not.toContain('Fragensammlung wird geladen...')
  })

  it('zeigt FragenListeSkeleton im overlay-Modus wenn ladeStatus === laden', () => {
    const { container } = render(
      <FragenBrowser
        onHinzufuegen={() => {}}
        onSchliessen={() => {}}
        bereitsVerwendet={[]}
      />,
    )
    const karten = container.querySelectorAll('[data-testid="fragen-liste-skeleton-karte"]')
    expect(karten.length).toBe(8)
    expect(container.textContent).not.toContain('Fragensammlung wird geladen...')
  })
})
