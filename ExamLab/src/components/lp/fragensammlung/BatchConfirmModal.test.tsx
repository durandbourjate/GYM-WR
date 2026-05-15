/**
 * Tests für BatchConfirmModal (Cluster D Phase 4, 15.05.2026).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import BatchConfirmModal, { tagsModusAusPatch } from './BatchConfirmModal'
import type { FragenBulkPatch } from '@shared/types/fragen-core'

describe('tagsModusAusPatch', () => {
  it('returnt "ersetzen" wenn tagsErsetzen gesetzt', () => {
    expect(tagsModusAusPatch({ tagsErsetzen: ['t1'] })).toBe('ersetzen')
  })
  it('returnt "entfernen" wenn tagsEntfernen gesetzt', () => {
    expect(tagsModusAusPatch({ tagsEntfernen: ['t1'] })).toBe('entfernen')
  })
  it('returnt "hinzufuegen" default (auch ohne Tag-Felder)', () => {
    expect(tagsModusAusPatch({ tagsHinzufuegen: ['t1'] })).toBe('hinzufuegen')
    expect(tagsModusAusPatch({})).toBe('hinzufuegen')
  })
})

describe('BatchConfirmModal', () => {
  it('zeigt Anzahl der zu bearbeitenden Fragen im Body', () => {
    const { getByText } = render(
      <BatchConfirmModal
        patch={{}}
        anzahl={5}
        sichtbarCount={5}
        tagsModus="hinzufuegen"
        tagNamen={[]}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(getByText(/5/, { selector: 'strong' })).toBeTruthy()
    expect(getByText(/Fragen werden/).textContent).toContain('5')
  })

  it('zeigt yellow-Warnung wenn sichtbarCount < anzahl', () => {
    const { getByText } = render(
      <BatchConfirmModal
        patch={{}}
        anzahl={10}
        sichtbarCount={3}
        tagsModus="hinzufuegen"
        tagNamen={[]}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    expect(getByText(/Achtung: 7 davon/).className).toContain('yellow')
  })

  it('rendert ueberschriebene-Sektion mit Skalar- und Array-Feldern', () => {
    const patch: FragenBulkPatch = {
      fachbereich: 'VWL',
      bloom: 'K3',
      status: 'sammlung',
      gefaesse: ['G1', 'G2'],
      semester: ['1S', '2S'],
      lernzielIds: ['lz1', 'lz2', 'lz3'],
    }
    const { getByTestId, getByText } = render(
      <BatchConfirmModal
        patch={patch}
        anzahl={5}
        sichtbarCount={5}
        tagsModus="hinzufuegen"
        tagNamen={[]}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const section = getByTestId('batch-confirm-ueberschriebene')
    expect(section.textContent).toContain('Fachbereich')
    expect(section.textContent).toContain('VWL')
    expect(section.textContent).toContain('Bloom-Stufe')
    expect(section.textContent).toContain('K3')
    expect(section.textContent).toContain('Anwenden')
    expect(section.textContent).toContain('Status')
    expect(section.textContent).toContain('Sammlung')
    expect(section.textContent).toContain('Gefässe')
    expect(section.textContent).toContain('G1, G2')
    expect(section.textContent).toContain('Semester')
    expect(section.textContent).toContain('1S, 2S')
    expect(section.textContent).toContain('Lernziele')
    expect(getByText(/3 Lernziele/)).toBeTruthy()
  })

  it('rendert grüne Tags-HINZUFÜGEN-Sektion im Modus "hinzufuegen"', () => {
    const { getByTestId, queryByTestId } = render(
      <BatchConfirmModal
        patch={{ tagsHinzufuegen: ['t1', 't2'] }}
        anzahl={5}
        sichtbarCount={5}
        tagsModus="hinzufuegen"
        tagNamen={['Algebra', 'Geometrie']}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const section = getByTestId('batch-confirm-tags-hinzufuegen')
    expect(section.className).toContain('emerald')
    expect(section.textContent).toContain('HINZUGEFÜGT')
    expect(section.textContent).toContain('+ Algebra')
    expect(section.textContent).toContain('+ Geometrie')
    expect(queryByTestId('batch-confirm-tags-ersetzen')).toBeNull()
    expect(queryByTestId('batch-confirm-tags-entfernen')).toBeNull()
  })

  it('rendert rote Tags-ERSETZEN-Sektion im Modus "ersetzen" inkl. Warn-Text', () => {
    const { getByTestId } = render(
      <BatchConfirmModal
        patch={{ tagsErsetzen: ['t1'] }}
        anzahl={3}
        sichtbarCount={3}
        tagsModus="ersetzen"
        tagNamen={['NurNochDieserTag']}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const section = getByTestId('batch-confirm-tags-ersetzen')
    expect(section.className).toContain('red')
    expect(section.textContent).toContain('ERSETZT')
    expect(section.textContent).toContain('bestehenden Tags')
    expect(section.textContent).toContain('NurNochDieserTag')
  })

  it('rendert orange Tags-ENTFERNEN-Sektion im Modus "entfernen"', () => {
    const { getByTestId } = render(
      <BatchConfirmModal
        patch={{ tagsEntfernen: ['t1'] }}
        anzahl={3}
        sichtbarCount={3}
        tagsModus="entfernen"
        tagNamen={['AltTag']}
        onBestaetigen={vi.fn()}
        onAbbrechen={vi.fn()}
      />,
    )
    const section = getByTestId('batch-confirm-tags-entfernen')
    expect(section.className).toContain('orange')
    expect(section.textContent).toContain('ENTFERNT')
    expect(section.textContent).toContain('AltTag')
  })

  it('"Endgültig anwenden"-Click ruft onBestaetigen', () => {
    const onBestaetigen = vi.fn()
    const { getByText } = render(
      <BatchConfirmModal
        patch={{ fachbereich: 'VWL' }}
        anzahl={1}
        sichtbarCount={1}
        tagsModus="hinzufuegen"
        tagNamen={[]}
        onBestaetigen={onBestaetigen}
        onAbbrechen={vi.fn()}
      />,
    )
    fireEvent.click(getByText('Endgültig anwenden'))
    expect(onBestaetigen).toHaveBeenCalledTimes(1)
  })

  it('"Abbrechen"-Click ruft onAbbrechen', () => {
    const onAbbrechen = vi.fn()
    const { getByText } = render(
      <BatchConfirmModal
        patch={{ fachbereich: 'VWL' }}
        anzahl={1}
        sichtbarCount={1}
        tagsModus="hinzufuegen"
        tagNamen={[]}
        onBestaetigen={vi.fn()}
        onAbbrechen={onAbbrechen}
      />,
    )
    fireEvent.click(getByText('Abbrechen'))
    expect(onAbbrechen).toHaveBeenCalledTimes(1)
  })
})
