/**
 * Tests für VirtualisierteFragenListe.tsx
 *
 * baueFlatItems-Tests sind pure Logik (keine React/jsdom-Dependencies).
 * Render-Tests verwenden gemockten useVirtualizer (jsdom hat keine Layout-Engine,
 * die Mock-Implementierung gibt alle Items als sichtbar zurück).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import {
  baueFlatItems,
} from '../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe'
import type { GruppierteAnzeige, FilterbareFrage } from '../hooks/useFragenFilter'

// Mock useVirtualizer auf Modul-Ebene: Render-Tests bekommen alle Items sichtbar.
// `mockFirstVisibleIndex` erlaubt Tests, den ersten sichtbaren Index zu konfigurieren —
// die Lane-Header-Logik leitet `aktiverHeaderItem` davon ab.
const scrollToIndexSpy = vi.fn()
let mockFirstVisibleIndex: number | null = null
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () => {
      const startIdx = mockFirstVisibleIndex ?? 0
      return Array.from({ length: Math.max(0, count - startIdx) }, (_, i) => {
        const index = startIdx + i
        return {
          index,
          key: index,
          start: index * 100,
          size: 100,
        }
      })
    },
    measureElement: () => {},
    scrollToIndex: scrollToIndexSpy,
  }),
}))

beforeEach(() => {
  scrollToIndexSpy.mockClear()
  mockFirstVisibleIndex = null
})

const f = (id: string): FilterbareFrage =>
  ({
    id,
    typ: 'multiple_choice',
    fachbereich: 'BWL',
    thema: 'X',
    unterthema: '',
    bloom: 'k1',
    punkte: 1,
    schwierigkeit: 'mittel',
    tags: [],
    fragetext: `Frage ${id}`,
  }) as unknown as FilterbareFrage

describe('baueFlatItems', () => {
  it('baut leeres Array bei leerer gruppierterAnzeige', () => {
    const result = baueFlatItems([], 'fachbereich', new Set())
    expect(result).toEqual([])
  })

  it('ohne Gruppierung: nur Frage-Items, keine Header', () => {
    const ga: GruppierteAnzeige[] = [
      { key: '__alle__', label: 'Alle', fragen: [f('1'), f('2')] },
    ]
    const result = baueFlatItems(ga, 'keine', new Set())
    expect(result.map(i => i.typ)).toEqual(['frage', 'frage'])
  })

  it('mit Gruppierung + alle aufgeklappt: Header + Fragen pro Gruppe', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2')] },
      { key: 'VWL', label: 'VWL', fragen: [f('3')] },
    ]
    const result = baueFlatItems(ga, 'fachbereich', new Set(['BWL', 'VWL']))
    expect(result.map(i => i.typ)).toEqual([
      'header',
      'frage',
      'frage',
      'header',
      'frage',
    ])
  })

  it('mit Gruppierung + Gruppe zugeklappt: nur Header der zugeklappten Gruppe', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2')] },
      { key: 'VWL', label: 'VWL', fragen: [f('3')] },
    ]
    // BWL zu, VWL auf
    const result = baueFlatItems(ga, 'fachbereich', new Set(['VWL']))
    expect(result.map(i => i.typ)).toEqual(['header', 'header', 'frage'])
  })

  it('Header-Item enthält gruppeKey, gruppeLabel, fragenAnzahl, istAufgeklappt', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'Betriebswirtschaft', fragen: [f('1'), f('2')] },
    ]
    const result = baueFlatItems(ga, 'fachbereich', new Set(['BWL']))
    const header = result[0]
    expect(header.typ).toBe('header')
    if (header.typ === 'header') {
      expect(header.gruppeKey).toBe('BWL')
      expect(header.gruppeLabel).toBe('Betriebswirtschaft')
      expect(header.fragenAnzahl).toBe(2)
      expect(header.istAufgeklappt).toBe(true)
    }
  })

  it('Frage-Item enthält frage und gruppeKey', () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1')] },
    ]
    const result = baueFlatItems(ga, 'fachbereich', new Set(['BWL']))
    const frageItem = result[1]
    expect(frageItem.typ).toBe('frage')
    if (frageItem.typ === 'frage') {
      expect(frageItem.frage.id).toBe('1')
      expect(frageItem.gruppeKey).toBe('BWL')
    }
  })
})

describe('VirtualisierteFragenListe (mit Virtualizer-Mock)', () => {
  // Lazy-import so Mock greift
  // (Top-import ist OK, vi.mock ist hoisted.)
  // Wir verwenden hier den Default-Export der Komponente.

  async function renderListe(props: {
    gruppierteAnzeige: GruppierteAnzeige[]
    gruppierung: 'keine' | 'fachbereich' | 'thema' | 'typ' | 'bloom'
    aufgeklappteGruppen: Set<string>
    kompaktModus?: boolean
    toggleGruppe?: (key: string) => void
    toggleFrageInPruefung?: (id: string) => void
    handleEditFrage?: (frage: FilterbareFrage) => void
    handleFrageDuplizieren?: (frage: FilterbareFrage) => void
    handleFrageLoeschen?: (frage: FilterbareFrage) => void
    scrollResetTrigger?: unknown
  }) {
    const { default: VirtualisierteFragenListe } = await import(
      '../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe'
    )
    return render(
      <VirtualisierteFragenListe
        gruppierteAnzeige={props.gruppierteAnzeige}
        gruppierung={props.gruppierung}
        aufgeklappteGruppen={props.aufgeklappteGruppen}
        kompaktModus={props.kompaktModus ?? true}
        bereitsVerwendetSet={new Set()}
        fragenStats={new Map()}
        toggleGruppe={props.toggleGruppe ?? vi.fn()}
        toggleFrageInPruefung={props.toggleFrageInPruefung ?? vi.fn()}
        handleEditFrage={props.handleEditFrage ?? vi.fn()}
        handleFrageDuplizieren={props.handleFrageDuplizieren ?? vi.fn()}
        handleFrageLoeschen={props.handleFrageLoeschen ?? vi.fn()}
        scrollResetTrigger={props.scrollResetTrigger ?? ''}
      />,
    )
  }

  it('rendert Header-Komponente für Header-Items', async () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1')] },
    ]
    const { getAllByText } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(['BWL']),
    })
    // Mit Lane-Header gibt es bei firstVisibleIndex=0 zwei Buttons mit "BWL" (Lane + virtual).
    expect(getAllByText('BWL').length).toBeGreaterThanOrEqual(1)
  })

  it('ruft toggleGruppe mit Gruppe-Key bei (virtuellem) Header-Klick', async () => {
    const toggle = vi.fn()
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [] },
    ]
    const { getAllByRole } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(),
      toggleGruppe: toggle,
    })
    // Klick auf den letzten BWL-Button (= virtueller Header, nicht Lane).
    const buttons = getAllByRole('button', { name: /BWL/ })
    fireEvent.click(buttons[buttons.length - 1])
    expect(toggle).toHaveBeenCalledWith('BWL')
  })

  it('rendert KompaktZeile für Frage-Items im Kompakt-Modus', async () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1')] },
    ]
    const { container } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(['BWL']),
      kompaktModus: true,
    })
    // KompaktZeile enthält "+/-"-Toggle-Button als erstes Element der Zeile
    expect(container.querySelector('[data-fragen-zeile]')?.textContent).toMatch(/X/)
  })

  it('Lane-Header: bei gruppierung="keine" wird kein Lane-Header gerendert', async () => {
    const ga: GruppierteAnzeige[] = [
      { key: '__alle__', label: 'Alle', fragen: [f('1'), f('2')] },
    ]
    const { queryByTestId } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'keine',
      aufgeklappteGruppen: new Set(),
    })
    expect(queryByTestId('lane-header')).toBeNull()
  })

  it('Lane-Header: zeigt aktive Gruppe wenn erstes sichtbares Item innerhalb der Gruppe liegt', async () => {
    const ga: GruppierteAnzeige[] = [
      // BWL: header bei flat-Index 0, fragen 1-3 bei flat-Index 1-3
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2'), f('3')] },
      // VWL: header bei flat-Index 4, fragen 4-6 bei flat-Index 5-7
      { key: 'VWL', label: 'VWL', fragen: [f('4'), f('5'), f('6')] },
    ]
    // Erstes sichtbares Item ist Index 2 → mitten in BWL-Fragen → Lane sollte BWL anzeigen.
    mockFirstVisibleIndex = 2
    const { getByTestId } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(['BWL', 'VWL']),
    })
    const lane = getByTestId('lane-header')
    expect(lane.textContent).toMatch(/BWL/)
  })

  it('Lane-Header: Klick ruft toggleGruppe mit aktivem Gruppe-Key', async () => {
    const toggle = vi.fn()
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1'), f('2')] },
      { key: 'VWL', label: 'VWL', fragen: [f('3'), f('4')] },
    ]
    // Erstes sichtbares Item ist Index 4 → VWL-Header (Index 3=ende BWL, Index 4=VWL-header)
    // Reihenfolge: 0=BWL-header, 1=f1, 2=f2, 3=VWL-header, 4=f3, 5=f4 → Index 4 → aktive=VWL
    mockFirstVisibleIndex = 4
    const { getByTestId } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(['BWL', 'VWL']),
      toggleGruppe: toggle,
    })
    fireEvent.click(getByTestId('lane-header'))
    expect(toggle).toHaveBeenCalledWith('VWL')
  })

  it('ruft virtualizer.scrollToIndex(0) bei scrollResetTrigger-Wechsel', async () => {
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [f('1')] },
    ]
    const { default: VirtualisierteFragenListe } = await import(
      '../components/lp/fragenbank/fragenbrowser/VirtualisierteFragenListe'
    )
    const { rerender } = render(
      <VirtualisierteFragenListe
        gruppierteAnzeige={ga}
        gruppierung="fachbereich"
        aufgeklappteGruppen={new Set(['BWL'])}
        kompaktModus={true}
        bereitsVerwendetSet={new Set()}
        fragenStats={new Map()}
        toggleGruppe={vi.fn()}
        toggleFrageInPruefung={vi.fn()}
        handleEditFrage={vi.fn()}
        handleFrageDuplizieren={vi.fn()}
        handleFrageLoeschen={vi.fn()}
        scrollResetTrigger="initial"
      />,
    )
    const callsNachInitial = scrollToIndexSpy.mock.calls.length
    rerender(
      <VirtualisierteFragenListe
        gruppierteAnzeige={ga}
        gruppierung="fachbereich"
        aufgeklappteGruppen={new Set(['BWL'])}
        kompaktModus={true}
        bereitsVerwendetSet={new Set()}
        fragenStats={new Map()}
        toggleGruppe={vi.fn()}
        toggleFrageInPruefung={vi.fn()}
        handleEditFrage={vi.fn()}
        handleFrageDuplizieren={vi.fn()}
        handleFrageLoeschen={vi.fn()}
        scrollResetTrigger="suchtext-eingegeben"
      />,
    )
    expect(scrollToIndexSpy.mock.calls.length).toBeGreaterThan(callsNachInitial)
    // Letzter Aufruf war scrollToIndex(0)
    const letzterCall = scrollToIndexSpy.mock.calls[scrollToIndexSpy.mock.calls.length - 1]
    expect(letzterCall[0]).toBe(0)
  })
})
