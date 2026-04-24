import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProblemmeldungZeile from './ProblemmeldungZeile'
import type { Problemmeldung } from '../../../types/problemmeldung'

const base: Problemmeldung = {
  id: 'm1', zeitstempel: new Date().toISOString(), typ: 'problem', category: 'Test',
  comment: 'Test-Kommentar', rolle: 'sus', frageId: 'f1', frageText: '', frageTyp: 'mc',
  modus: 'pruefen', pruefungId: '', gruppeId: '', ort: '', appVersion: '',
  inhaberEmail: 'lp@x.ch', inhaberAktiv: true, istPoolFrage: false,
  recht: 'inhaber', erledigt: false,
}

describe('ProblemmeldungZeile', () => {
  it('Legacy-Row (leere id): Toggle disabled mit Tooltip', () => {
    const toggle = vi.fn()
    render(<ProblemmeldungZeile meldung={{ ...base, id: '' }} toggleErledigt={toggle} onOeffne={() => {}} istAdmin={false} />)
    const cb = screen.getByRole('checkbox')
    expect(cb).toBeDisabled()
    expect(cb.getAttribute('title')).toMatch(/Legacy-Eintrag/i)
  })
  it('nicht-Admin ohne Inhaber/Bearbeiter: Toggle disabled', () => {
    const toggle = vi.fn()
    render(<ProblemmeldungZeile meldung={{ ...base, recht: 'betrachter' }} toggleErledigt={toggle} onOeffne={() => {}} istAdmin={false} />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })
  it('Admin darf immer togglen', () => {
    const toggle = vi.fn()
    render(<ProblemmeldungZeile meldung={{ ...base, recht: 'betrachter' }} toggleErledigt={toggle} onOeffne={() => {}} istAdmin={true} />)
    expect(screen.getByRole('checkbox')).not.toBeDisabled()
  })
  it('Toggle löst onChange mit invertiertem Wert aus', () => {
    const toggle = vi.fn()
    render(<ProblemmeldungZeile meldung={base} toggleErledigt={toggle} onOeffne={() => {}} istAdmin={false} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(toggle).toHaveBeenCalledWith('m1', true)
  })
  it('ehemaliger Inhaber wird angezeigt', () => {
    render(<ProblemmeldungZeile meldung={{ ...base, inhaberAktiv: false }} toggleErledigt={() => {}} onOeffne={() => {}} istAdmin={true} />)
    expect(screen.getByText(/ehemaliger Inhaber/)).toBeInTheDocument()
  })
})
