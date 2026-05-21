// ExamLab/src/components/ueben/dashboard/themaDetailHelpers.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Chip } from './themaDetailHelpers'

describe('Chip', () => {
  const baseProps = {
    label: 'Testlabel',
    aktiv: false,
    farbe: '#3b82f6',
    onClick: vi.fn(),
  }

  describe('ohne onLernzieleKlick', () => {
    it('rendert den Label-Text', () => {
      render(<Chip {...baseProps} />)
      expect(screen.getByText('Testlabel')).toBeInTheDocument()
    })

    it('rendert KEIN Flag-Icon', () => {
      render(<Chip {...baseProps} />)
      expect(screen.queryByRole('button', { name: 'Lernziele' })).toBeNull()
    })

    it('ruft onClick beim Klick auf den Chip-Körper auf', () => {
      const onClick = vi.fn()
      render(<Chip {...baseProps} onClick={onClick} />)
      fireEvent.click(screen.getByText('Testlabel'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('mit onLernzieleKlick und lernzieleAnzahl: 0', () => {
    it('rendert KEIN Flag-Icon wenn lernzieleAnzahl === 0', () => {
      render(
        <Chip
          {...baseProps}
          onLernzieleKlick={vi.fn()}
          lernzieleAnzahl={0}
        />
      )
      expect(screen.queryByRole('button', { name: 'Lernziele' })).toBeNull()
    })
  })

  describe('mit onLernzieleKlick und lernzieleAnzahl > 0', () => {
    it('rendert das Flag-Icon-Affordance', () => {
      render(
        <Chip
          {...baseProps}
          onLernzieleKlick={vi.fn()}
          lernzieleAnzahl={3}
        />
      )
      expect(screen.getByRole('button', { name: 'Lernziele' })).toBeInTheDocument()
    })

    it('Klick auf Flag ruft onLernzieleKlick auf', () => {
      const onLernzieleKlick = vi.fn()
      const onClick = vi.fn()
      render(
        <Chip
          {...baseProps}
          onClick={onClick}
          onLernzieleKlick={onLernzieleKlick}
          lernzieleAnzahl={3}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
      expect(onLernzieleKlick).toHaveBeenCalledTimes(1)
    })

    it('Klick auf Flag ruft NICHT den Chip-onClick auf (stopPropagation)', () => {
      const onLernzieleKlick = vi.fn()
      const onClick = vi.fn()
      render(
        <Chip
          {...baseProps}
          onClick={onClick}
          onLernzieleKlick={onLernzieleKlick}
          lernzieleAnzahl={3}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Lernziele' }))
      expect(onClick).not.toHaveBeenCalled()
    })

    it('Klick auf Chip-Körper (Label) ruft onClick auf', () => {
      const onClick = vi.fn()
      render(
        <Chip
          {...baseProps}
          onClick={onClick}
          onLernzieleKlick={vi.fn()}
          lernzieleAnzahl={3}
        />
      )
      fireEvent.click(screen.getByText('Testlabel'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('Klick auf Chip-Körper ruft NICHT onLernzieleKlick auf', () => {
      const onLernzieleKlick = vi.fn()
      render(
        <Chip
          {...baseProps}
          onLernzieleKlick={onLernzieleKlick}
          lernzieleAnzahl={3}
        />
      )
      fireEvent.click(screen.getByText('Testlabel'))
      expect(onLernzieleKlick).not.toHaveBeenCalled()
    })
  })

  describe('label als ReactNode', () => {
    it('akzeptiert ReactNode als Label (z.B. JSX)', () => {
      render(
        <Chip
          {...baseProps}
          label={<span data-testid="node-label">Node-Label</span>}
        />
      )
      expect(screen.getByTestId('node-label')).toBeInTheDocument()
    })
  })

  describe('title-prop', () => {
    it('zeigt title-Attribut wenn angegeben', () => {
      const { container } = render(
        <Chip
          {...baseProps}
          title="Mein Tooltip"
        />
      )
      // Der Toggle-Button sollte title="Mein Tooltip" haben
      const toggleBtn = container.querySelector('[title="Mein Tooltip"]')
      expect(toggleBtn).not.toBeNull()
    })
  })
})
