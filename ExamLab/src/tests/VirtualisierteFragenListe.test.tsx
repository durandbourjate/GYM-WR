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
const scrollToIndexSpy = vi.fn()
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 100,
        size: 100,
      })),
    measureElement: () => {},
    scrollToIndex: scrollToIndexSpy,
  }),
}))

beforeEach(() => {
  scrollToIndexSpy.mockClear()
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
    const { getByText } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(['BWL']),
    })
    expect(getByText('BWL')).toBeTruthy()
  })

  it('ruft toggleGruppe mit Gruppe-Key bei Header-Klick', async () => {
    const toggle = vi.fn()
    const ga: GruppierteAnzeige[] = [
      { key: 'BWL', label: 'BWL', fragen: [] },
    ]
    const { getByRole } = await renderListe({
      gruppierteAnzeige: ga,
      gruppierung: 'fachbereich',
      aufgeklappteGruppen: new Set(),
      toggleGruppe: toggle,
    })
    fireEvent.click(getByRole('button', { name: /BWL/ }))
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
