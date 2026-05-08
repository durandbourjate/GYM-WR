import { describe, it, expect } from 'vitest'
import { cursorFuerTool } from './cursorFuerTool'
import type { Tool } from './ZeichnenTypes'

describe('cursorFuerTool', () => {
  it('mappt jedes Werkzeug auf den korrekten CSS-Cursor', () => {
    const erwartet: Record<Tool, string> = {
      auswahl: 'default',
      stift: 'crosshair',
      linie: 'crosshair',
      pfeil: 'crosshair',
      rechteck: 'crosshair',
      ellipse: 'crosshair',
      text: 'text',
      radierer: 'cell',
    }
    for (const [tool, cursor] of Object.entries(erwartet) as [Tool, string][]) {
      expect(cursorFuerTool(tool)).toBe(cursor)
    }
  })

  it('liefert default für unbekannte Werkzeuge (Fallback)', () => {
    expect(cursorFuerTool('unbekannt' as Tool)).toBe('default')
  })
})
