// ExamLab/src/components/ueben/dashboard/ThemaDetailView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemaDetailView } from './ThemaDetailView'
import type { ThemenInfo } from '../../../hooks/ueben/useThemenKomputationen'
import type { Frage } from '../../../types/ueben/fragen'

// Minimale Frage-Fixtures
function macheFrage(id: string, unterthema?: string): Frage {
  return {
    id,
    typ: 'mc',
    frage: `Frage ${id}`,
    schwierigkeit: 1,
    unterthema,
  } as unknown as Frage
}

const fragen: Frage[] = [
  macheFrage('f1', 'Grundlagen'),
  macheFrage('f2', 'Grundlagen'),
  macheFrage('f3', 'Vertiefung'),
]

const themaDetail: ThemenInfo = {
  fach: 'BWL',
  thema: 'Marketing',
  unterthemen: ['Grundlagen', 'Vertiefung'],
  fragen,
  fortschritt: { fach: 'BWL', thema: 'Marketing', gesamt: 3, gemeistert: 0, gefestigt: 0, ueben: 0, neu: 3, quote: 0 },
}

const basisProps = {
  themaDetail,
  gefilterteFragen: fragen,
  unterthemaFilter: new Set(['Grundlagen', 'Vertiefung']),
  schwierigkeitFilter: new Set([1]),
  typFilter: new Set(['mc']),
  onToggleUnterthema: vi.fn(),
  onToggleSchwierigkeit: vi.fn(),
  onToggleTyp: vi.fn(),
  onToggleAlleUnterthemen: vi.fn(),
  onToggleAlleSchwierigkeiten: vi.fn(),
  onToggleAlleTypen: vi.fn(),
  onZurueck: vi.fn(),
  onStarte: vi.fn(),
  fachFarben: {},
}

describe('ThemaDetailView — Unterthema-Lernziele-Icons', () => {
  describe('ohne onUnterthemaLernziele (Standard)', () => {
    it('rendert KEIN Lernziele-Flag-Icon auf Unterthema-Chips', () => {
      render(<ThemaDetailView {...basisProps} />)
      // Der "Lernziele"-Button (aria-label="Lernziele") sollte nicht vorhanden sein
      expect(screen.queryByRole('button', { name: 'Lernziele' })).toBeNull()
    })
  })

  describe('mit onUnterthemaLernziele und lernzieleProUnterthema', () => {
    const onUnterthemaLernziele = vi.fn()
    const lernzieleProUnterthema = { Grundlagen: 3, Vertiefung: 0 }

    it('zeigt Flag-Icon nur bei Unterthemen mit lernzieleAnzahl > 0', () => {
      render(
        <ThemaDetailView
          {...basisProps}
          onUnterthemaLernziele={onUnterthemaLernziele}
          lernzieleProUnterthema={lernzieleProUnterthema}
        />,
      )
      // Genau ein Flag-Icon-Button erwartet (nur "Grundlagen" hat 3, "Vertiefung" hat 0)
      const flagButtons = screen.getAllByRole('button', { name: 'Lernziele' })
      expect(flagButtons).toHaveLength(1)
    })

    it('Klick auf Flag-Icon ruft onUnterthemaLernziele mit dem richtigen Unterthema-Namen auf', () => {
      const handler = vi.fn()
      render(
        <ThemaDetailView
          {...basisProps}
          onUnterthemaLernziele={handler}
          lernzieleProUnterthema={lernzieleProUnterthema}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('Grundlagen')
    })

    it('Klick auf Chip-Körper ruft onToggleUnterthema auf, nicht onUnterthemaLernziele', () => {
      const handler = vi.fn()
      const toggleUnterthema = vi.fn()
      render(
        <ThemaDetailView
          {...basisProps}
          onToggleUnterthema={toggleUnterthema}
          onUnterthemaLernziele={handler}
          lernzieleProUnterthema={lernzieleProUnterthema}
        />,
      )
      // "Grundlagen" erscheint als Label im Chip-Körper-Button
      fireEvent.click(screen.getByRole('button', { name: /Grundlagen/ }))
      expect(toggleUnterthema).toHaveBeenCalledWith('Grundlagen')
      expect(handler).not.toHaveBeenCalled()
    })

    it('Unterthema ohne Lernziele ("Vertiefung") hat kein Flag-Icon', () => {
      render(
        <ThemaDetailView
          {...basisProps}
          onUnterthemaLernziele={onUnterthemaLernziele}
          lernzieleProUnterthema={lernzieleProUnterthema}
        />,
      )
      // Nur ein Flag-Button total — gehört zu "Grundlagen"
      expect(screen.getAllByRole('button', { name: 'Lernziele' })).toHaveLength(1)
    })
  })

  describe('Schwierigkeit- und Fragetyp-Chips erhalten NIE ein Lernziele-Icon', () => {
    it('kein Flag-Icon auf Schwierigkeit-Chips, auch wenn lernzieleProUnterthema gesetzt', () => {
      render(
        <ThemaDetailView
          {...basisProps}
          onUnterthemaLernziele={vi.fn()}
          lernzieleProUnterthema={{ Grundlagen: 5, Vertiefung: 5 }}
        />,
      )
      // Alle Flag-Buttons sollten nur von Unterthema-Chips stammen.
      // Schwierigkeit-Chips und Typ-Chips haben keinen "Lernziele"-Button.
      // Im Fixture gibt es 2 Unterthemen mit je 5 Lernzielen → 2 Flag-Buttons erwartet.
      const flagButtons = screen.getAllByRole('button', { name: 'Lernziele' })
      expect(flagButtons).toHaveLength(2)

      // Zusätzlich: kein Flag-Icon direkt neben den Schwierigkeit-Labels
      const einfachBtn = screen.getByRole('button', { name: /Einfach/ })
      // Der Schwierigkeit-Chip-Bereich enthält keinen "Lernziele"-Button als direkten Nachbarn
      // Wir prüfen, dass kein Sibling-Button mit name="Lernziele" existiert
      const chipWrapper = einfachBtn.closest('span')
      expect(chipWrapper?.querySelector('[aria-label="Lernziele"]')).toBeNull()
    })
  })
})
