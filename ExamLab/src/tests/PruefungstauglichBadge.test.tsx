import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PruefungstauglichBadge } from '@shared/index'

describe('PruefungstauglichBadge', () => {
  it('rendert nichts wenn pruefungstauglich=true', () => {
    const { container } = render(
      <PruefungstauglichBadge pruefungstauglich empfohlenLeerFelder={[]} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('rendert roten Badge wenn pruefungstauglich=false', () => {
    render(
      <PruefungstauglichBadge pruefungstauglich={false} empfohlenLeerFelder={[]} />,
    )
    expect(screen.getByText(/Nicht prüfungstauglich/i)).toBeInTheDocument()
  })

  it('zeigt Liste der empfohlen-leeren Felder als klickbare Buttons', () => {
    render(
      <PruefungstauglichBadge
        pruefungstauglich={false}
        empfohlenLeerFelder={['Erklärung pro Option', 'Toleranz']}
      />,
    )
    expect(screen.getByRole('button', { name: 'Erklärung pro Option' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toleranz' })).toBeInTheDocument()
  })

  it('Klick auf einen Listen-Eintrag ruft onClickLeeresFeld(feldName)', () => {
    const onClick = vi.fn()
    render(
      <PruefungstauglichBadge
        pruefungstauglich={false}
        empfohlenLeerFelder={['Erklärung pro Option']}
        onClickLeeresFeld={onClick}
      />,
    )
    fireEvent.click(screen.getByText('Erklärung pro Option'))
    expect(onClick).toHaveBeenCalledWith('Erklärung pro Option')
  })
})
