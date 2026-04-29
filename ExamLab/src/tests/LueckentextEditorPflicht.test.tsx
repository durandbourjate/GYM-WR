import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LueckentextEditor } from '@shared/index'
import type { LueckentextFrage } from '@shared/types/fragen-core'

const baseLuecken: LueckentextFrage['luecken'] = [
  { id: '1', korrekteAntworten: ['Antwort'], caseSensitive: false },
]

function renderEditor(opts: {
  feldStatusLuecken?: 'pflicht-leer' | 'empfohlen-leer' | 'ok'
  feldStatusTextMitLuecken?: 'pflicht-leer' | 'empfohlen-leer' | 'ok'
  modus?: 'freitext' | 'dropdown'
} = {}) {
  return render(
    <LueckentextEditor
      textMitLuecken="Text mit {{1}}"
      setTextMitLuecken={vi.fn()}
      luecken={baseLuecken}
      setLuecken={vi.fn()}
      lueckentextModus={opts.modus ?? 'freitext'}
      setLueckentextModus={vi.fn()}
      feldStatusLuecken={opts.feldStatusLuecken}
      feldStatusTextMitLuecken={opts.feldStatusTextMitLuecken}
    />,
  )
}

describe('LueckentextEditor — Violett-Migration', () => {
  it('Modus-Toggle Freitext aktiv nutzt Violett (kein Indigo)', () => {
    renderEditor({ modus: 'freitext' })
    const freitextBtn = screen.getByRole('button', { name: 'Freitext' })
    expect(freitextBtn.className).toContain('bg-violet-600')
    expect(freitextBtn.className).not.toContain('indigo')
  })

  it('Modus-Toggle Dropdown aktiv nutzt Violett (kein Indigo)', () => {
    renderEditor({ modus: 'dropdown' })
    const dropdownBtn = screen.getByRole('button', { name: 'Dropdown' })
    expect(dropdownBtn.className).toContain('bg-violet-600')
    expect(dropdownBtn.className).not.toContain('indigo')
  })

  it('Freitext-Pill nutzt Violett (kein Indigo)', () => {
    renderEditor()
    const pill = screen.getByText('Freitext', { selector: 'span' })
    expect(pill.className).toContain('bg-violet-100')
    expect(pill.className).toContain('text-violet-700')
    expect(pill.className).not.toContain('indigo')
  })

  it('Dropdown-Pill nutzt Violett (kein Emerald)', () => {
    renderEditor()
    const pill = screen.getByText('Dropdown', { selector: 'span' })
    expect(pill.className).toContain('bg-violet-100')
    expect(pill.className).toContain('text-violet-700')
    expect(pill.className).not.toContain('emerald')
  })
})

describe('LueckentextEditor — Pflichtfeld-Outline', () => {
  it('feldStatusLuecken=pflicht-leer → Lücken-Container hat violett-Border', () => {
    renderEditor({ feldStatusLuecken: 'pflicht-leer' })
    const section = screen.getByTestId('lueckentext-luecken-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusLuecken=ok → Lücken-Container neutral', () => {
    renderEditor({ feldStatusLuecken: 'ok' })
    const section = screen.getByTestId('lueckentext-luecken-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusTextMitLuecken=pflicht-leer → textarea hat violett-Border', () => {
    renderEditor({ feldStatusTextMitLuecken: 'pflicht-leer' })
    const ta = screen.getByTestId('lueckentext-textarea')
    expect(ta.className).toContain('border-violet-400')
  })

  it('feldStatusTextMitLuecken=undefined → textarea ohne violett-Border', () => {
    renderEditor()
    const ta = screen.getByTestId('lueckentext-textarea')
    expect(ta.className).not.toContain('border-violet-400')
  })
})
