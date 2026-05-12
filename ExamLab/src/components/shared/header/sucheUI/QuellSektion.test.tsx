import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { QuellSektion } from './QuellSektion'
import type { SucheTreffer } from '../../../../types/suche'

const treffer: SucheTreffer[] = [
  { quelle: 'frage', id: 'f1', titel: 'A', score: 100, navigation: { route: '/' } },
]

describe('QuellSektion', () => {
  it('rendert Label + Treffer', () => {
    const { getByText } = render(
      <QuellSektion
        quelle="frage"
        treffer={treffer}
        gesamtCount={1}
        activeFlatIndex={-1}
        flatOffset={0}
        onTrefferKlick={() => {}}
        onAlleAnzeigen={() => {}}
      />,
    )
    expect(getByText('Fragen')).toBeTruthy()
  })

  it('zeigt "Alle X Treffer"-Link bei gesamtCount > 5', () => {
    const { getByText } = render(
      <QuellSektion
        quelle="frage"
        treffer={treffer}
        gesamtCount={12}
        activeFlatIndex={-1}
        flatOffset={0}
        onTrefferKlick={() => {}}
        onAlleAnzeigen={() => {}}
      />,
    )
    expect(getByText(/Alle 12 Treffer in fragen/i)).toBeTruthy()
  })

  it('versteckt "Alle"-Link bei gesamtCount <= 5', () => {
    const { queryByText } = render(
      <QuellSektion
        quelle="frage"
        treffer={treffer}
        gesamtCount={3}
        activeFlatIndex={-1}
        flatOffset={0}
        onTrefferKlick={() => {}}
        onAlleAnzeigen={() => {}}
      />,
    )
    expect(queryByText(/Alle 3/)).toBeNull()
  })

  it('onAlleAnzeigen wird gerufen mit Quelle', () => {
    const fn = vi.fn()
    const { getByText } = render(
      <QuellSektion
        quelle="frage"
        treffer={treffer}
        gesamtCount={12}
        activeFlatIndex={-1}
        flatOffset={0}
        onTrefferKlick={() => {}}
        onAlleAnzeigen={fn}
      />,
    )
    fireEvent.click(getByText(/Alle 12/))
    expect(fn).toHaveBeenCalledWith('frage')
  })
})
