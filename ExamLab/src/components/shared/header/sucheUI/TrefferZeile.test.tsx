import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { TrefferZeile } from './TrefferZeile'
import type { SucheTreffer } from '../../../../types/suche'

const treffer: SucheTreffer = {
  quelle: 'frage',
  id: 'f1',
  titel: 'Bilanz Analyse',
  subTitel: 'BWL',
  highlightStellen: [{ start: 0, end: 6, feld: 'titel' }],
  navigation: { route: '/fragensammlung/f1' },
  score: 100,
  iconKey: 'frage',
}

describe('TrefferZeile', () => {
  it('rendert Titel + Subtitel + Highlight', () => {
    const { container, getByText } = render(
      <TrefferZeile treffer={treffer} aktiv={false} onClick={() => {}} />,
    )
    expect(getByText('BWL')).toBeTruthy()
    expect(container.querySelector('mark')?.textContent).toBe('Bilanz')
  })

  it('aktiv-Klasse setzt Ring', () => {
    const { container } = render(
      <TrefferZeile treffer={treffer} aktiv={true} onClick={() => {}} />,
    )
    expect(container.querySelector('li')?.className).toContain('ring-1')
  })

  it('onClick wird gerufen', () => {
    const onClick = vi.fn()
    const { container } = render(
      <TrefferZeile treffer={treffer} aktiv={false} onClick={onClick} />,
    )
    fireEvent.click(container.querySelector('li')!)
    expect(onClick).toHaveBeenCalled()
  })

  it('aria-selected reflektiert aktiv', () => {
    const { container } = render(
      <TrefferZeile treffer={treffer} aktiv={true} onClick={() => {}} />,
    )
    expect(container.querySelector('li')?.getAttribute('aria-selected')).toBe('true')
  })
})
