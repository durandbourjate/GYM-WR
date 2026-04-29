import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RichtigFalschEditor } from '@shared/index'
import type { RichtigFalschFrage } from '@shared/types/fragen-core'

const baseAussagen: RichtigFalschFrage['aussagen'] = [
  { id: '1', text: 'Erste Aussage', korrekt: true },
  { id: '2', text: 'Zweite Aussage', korrekt: false },
]

function renderEditor(feldStatusAussagen?: 'pflicht-leer' | 'empfohlen-leer' | 'ok') {
  return render(
    <RichtigFalschEditor
      aussagen={baseAussagen}
      setAussagen={vi.fn()}
      feldStatusAussagen={feldStatusAussagen}
    />,
  )
}

describe('RichtigFalschEditor — Pflichtfeld-Outline', () => {
  it('feldStatusAussagen=pflicht-leer → Container hat violett-Border', () => {
    renderEditor('pflicht-leer')
    const section = screen.getByTestId('rf-aussagen-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusAussagen=ok → Container hat neutralen Border (kein Violett)', () => {
    renderEditor('ok')
    const section = screen.getByTestId('rf-aussagen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusAussagen=undefined → Container hat neutralen Border (kein Violett)', () => {
    renderEditor(undefined)
    const section = screen.getByTestId('rf-aussagen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
