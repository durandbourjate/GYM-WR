import { describe, it, expect } from 'vitest'
import { SELBSTBEWERTBARE_TYPEN, istSelbstbewertbar } from './fragetypGruppen'
import type { Frage } from '../../types/ueben/fragen'

describe('fragetypGruppen', () => {
  describe('SELBSTBEWERTBARE_TYPEN', () => {
    it('enthält die 5 selbstbewertbaren Frage-Typen', () => {
      expect(SELBSTBEWERTBARE_TYPEN).toEqual(['freitext', 'visualisierung', 'pdf', 'audio', 'code'])
    })
  })

  describe('istSelbstbewertbar', () => {
    it('liefert true für alle 5 selbstbewertbaren Typen', () => {
      const selbst: Frage['typ'][] = ['freitext', 'visualisierung', 'pdf', 'audio', 'code']
      for (const t of selbst) {
        expect(istSelbstbewertbar(t)).toBe(true)
      }
    })

    it('liefert false für nicht-selbstbewertbare Typen', () => {
      const nichtSelbst: Frage['typ'][] = ['mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'sortierung', 'berechnung', 'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur', 'hotspot', 'bildbeschriftung', 'dragdrop_bild', 'formel', 'aufgabengruppe']
      for (const t of nichtSelbst) {
        expect(istSelbstbewertbar(t)).toBe(false)
      }
    })
  })
})
