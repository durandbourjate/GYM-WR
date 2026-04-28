import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ZuordnungEditor } from '@shared/index'

const basePaare = [
  { links: 'A', rechts: '1' },
  { links: 'B', rechts: '2' },
]

function renderEditor(feldStatusPaare?: 'pflicht-leer' | 'empfohlen-leer' | 'ok') {
  return render(
    <ZuordnungEditor
      paare={basePaare}
      setPaare={vi.fn()}
      feldStatusPaare={feldStatusPaare}
    />,
  )
}

describe('ZuordnungEditor — Pflichtfeld-Outline', () => {
  it('feldStatusPaare=pflicht-leer → Container hat violett-Border', () => {
    renderEditor('pflicht-leer')
    const section = screen.getByTestId('zuordnung-paare-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusPaare=ok → Container neutral', () => {
    renderEditor('ok')
    const section = screen.getByTestId('zuordnung-paare-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusPaare=undefined → Container neutral', () => {
    renderEditor(undefined)
    const section = screen.getByTestId('zuordnung-paare-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
