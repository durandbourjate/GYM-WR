import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MCEditor } from '@shared/index'
import type { MCOption } from '@shared/types/fragen-core'

const baseOptionen: MCOption[] = [
  { id: 'a', text: 'Option A', korrekt: true },
  { id: 'b', text: 'Option B', korrekt: false },
]

function renderEditor(feldStatusOptionen?: 'pflicht-leer' | 'empfohlen-leer' | 'ok') {
  return render(
    <MCEditor
      optionen={baseOptionen}
      setOptionen={vi.fn()}
      mehrfachauswahl={false}
      setMehrfachauswahl={vi.fn()}
      feldStatusOptionen={feldStatusOptionen}
    />,
  )
}

describe('MCEditor — Pflichtfeld-Outline', () => {
  it('feldStatusOptionen=pflicht-leer → Container hat violett-Border', () => {
    renderEditor('pflicht-leer')
    const section = screen.getByTestId('mc-optionen-section')
    expect(section.className).toContain('border-violet-400')
    expect(section.className).toContain('ring-violet-300')
  })

  it('feldStatusOptionen=ok → Container hat neutralen Border (kein Violett)', () => {
    renderEditor('ok')
    const section = screen.getByTestId('mc-optionen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })

  it('feldStatusOptionen=undefined → Container hat neutralen Border (kein Violett)', () => {
    renderEditor(undefined)
    const section = screen.getByTestId('mc-optionen-section')
    expect(section.className).toContain('border-slate-200')
    expect(section.className).not.toContain('border-violet-400')
  })
})
