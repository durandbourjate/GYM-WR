import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FragetypIcon } from './FragetypIcon'
import { FRAGETYP_ICON_MAP, type Fragetyp } from './fragetypIconMap'

const ALLE_TYPEN: Fragetyp[] = [
  'mc', 'freitext', 'lueckentext', 'zuordnung', 'visualisierung',
  'richtigfalsch', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung',
  'bilanzstruktur', 'aufgabengruppe', 'pdf', 'sortierung', 'hotspot',
  'bildbeschriftung', 'audio', 'dragdrop_bild', 'code', 'formel',
]

describe('FragetypIcon', () => {
  it('hat einen MAP-Eintrag für alle 20 Fragetypen', () => {
    for (const t of ALLE_TYPEN) {
      expect(FRAGETYP_ICON_MAP[t]).toBeDefined()
    }
    expect(Object.keys(FRAGETYP_ICON_MAP).sort()).toEqual([...ALLE_TYPEN].sort())
  })

  it('rendert für jeden Typ ein SVG', () => {
    for (const t of ALLE_TYPEN) {
      const { container } = render(<FragetypIcon typ={t} />)
      expect(container.querySelector('svg')).toBeTruthy()
    }
  })

  it('reicht className durch (Lucide mergt eigene Default-Klassen)', () => {
    const { container } = render(<FragetypIcon typ="mc" className="w-5 h-5 text-slate-500" />)
    const cls = container.querySelector('svg')?.getAttribute('class') ?? ''
    expect(cls).toContain('w-5 h-5 text-slate-500')
  })

  it('Custom-Icons reichen className unverändert durch (kein Klassen-Merge)', () => {
    const { container } = render(<FragetypIcon typ="freitext" className="w-4 h-4" />)
    const cls = container.querySelector('svg')?.getAttribute('class')
    expect(cls).toBe('w-4 h-4')
  })

  it('rendert nichts wenn Typ unbekannt (graceful fallback)', () => {
    const { container } = render(<FragetypIcon typ={'unknown-typ' as Fragetyp} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
