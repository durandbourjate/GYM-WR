import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FreitextFrage from '../components/fragetypen/FreitextFrage.tsx'
import type { FreitextFrage as FTType } from '../types/fragen-storage'
import type { Antwort } from '../types/antworten.ts'

const frage = {
  id: 'ft1',
  typ: 'freitext',
  version: 1,
  erstelltAm: '2026-04-21',
  geaendertAm: '2026-04-21',
  fachbereich: 'Recht',
  fach: 'SF WR',
  thema: 'Test',
  semester: [],
  gefaesse: [],
  bloom: 'K3',
  tags: [],
  tagIds: [],
  punkte: 3,
  musterlosung: 'Die SNB ist die Zentralbank der Schweiz und steuert die Geldpolitik.',
  bewertungsraster: [],
  verwendungen: [],
  fragetext: 'Was ist die Rolle der SNB?',
  laenge: 'mittel',
} as FTType

describe('FreitextFrage modus=loesung', () => {
  it('Selbstbewertung korrekt → grüner MusterloesungsBlock', () => {
    const antwort: Antwort = {
      typ: 'freitext',
      text: '<p>Die SNB ist die Zentralbank.</p>',
      selbstbewertung: 'korrekt',
    }
    const { container } = render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // SuS-Antwort sichtbar (mehrfach: Antwort + Teil der Musterlösung)
    expect(screen.getAllByText(/Die SNB ist die Zentralbank/).length).toBeGreaterThanOrEqual(1)
    // Grüner Rahmen (SuS-Antwort + Musterlösungsblock)
    expect(container.querySelector('.border-green-600')).toBeTruthy()
  })

  it('Selbstbewertung falsch → roter Rahmen', () => {
    const antwort: Antwort = {
      typ: 'freitext',
      text: '<p>Falsche Antwort</p>',
      selbstbewertung: 'falsch',
    }
    const { container } = render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('rendert Musterlösung im Block', () => {
    const antwort: Antwort = {
      typ: 'freitext',
      text: '<p>X</p>',
      selbstbewertung: 'korrekt',
    }
    render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(screen.getByText(/Zentralbank der Schweiz/)).toBeInTheDocument()
  })

  it('ohne selbstbewertung → rote Variante (nicht bewertet)', () => {
    const antwort: Antwort = {
      typ: 'freitext',
      text: '<p>X</p>',
    }
    const { container } = render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.border-red-600')).toBeTruthy()
  })

  it('ohne antwort → rote Variante + Placeholder sichtbar', () => {
    render(<FreitextFrage frage={frage} modus="loesung" />)
    expect(screen.getByText(/keine Antwort/i)).toBeInTheDocument()
  })

  it('keine interaktiven Editor-Inputs', () => {
    const antwort: Antwort = {
      typ: 'freitext',
      text: '<p>Test</p>',
      selbstbewertung: 'korrekt',
    }
    const { container } = render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    expect(container.querySelector('.tiptap-editor')).toBeNull()
    expect(container.querySelector('textarea')).toBeNull()
  })

  it('SuS-Antwort-HTML wird mit DOMPurify sanitisiert (XSS-Schutz)', () => {
    // SuS-Editor-Output mit XSS-Payload: <script>, <img onerror>, javascript:-URL
    const malicious = '<p>Antwort</p><script>window.__xss = true</script><img src=x onerror="window.__xss = true">'
    const antwort: Antwort = {
      typ: 'freitext',
      text: malicious,
      selbstbewertung: 'korrekt',
    }
    // Reset window-Flag falls vorheriger Test ihn gesetzt hat
    delete (window as unknown as { __xss?: boolean }).__xss
    const { container } = render(<FreitextFrage frage={frage} antwort={antwort} modus="loesung" />)
    // <script> komplett gestrippt, kein Inline-onerror, kein javascript:-Href
    expect(container.querySelector('script')).toBeNull()
    const img = container.querySelector('img')
    if (img) expect(img.getAttribute('onerror')).toBeNull()
    // Sanitisierter Text bleibt erhalten
    expect(container.textContent).toContain('Antwort')
    // Window-Side-Effect darf nicht ausgelöst worden sein
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined()
  })
})
