// ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.test.ts
import { describe, it, expect } from 'vitest'
import type { CanvasConfig } from '../../../types/fragen-storage'
import { GROESSE_PRESETS } from './ZeichnenTypes'
import { berechneDimensionen } from './useCanvasSetup'

describe('berechneDimensionen', () => {
  it('preset=auto + Hintergrundbild → naturalWidth/Height', () => {
    const config: CanvasConfig = {
      breite: 0,
      hoehe: 0,
      koordinatensystem: false,
      werkzeuge: [],
      groessePreset: 'auto',
    }
    const img = { naturalWidth: 1200, naturalHeight: 800 } as HTMLImageElement
    expect(berechneDimensionen(config, img)).toEqual({ breite: 1200, hoehe: 800 })
  })

  it('preset != auto + valid Preset → GROESSE_PRESETS[preset]', () => {
    const config: CanvasConfig = {
      breite: 0,
      hoehe: 0,
      koordinatensystem: false,
      werkzeuge: [],
      groessePreset: 'mittel',
    }
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })

  it('preset undefined + custom breite/hoehe → custom Dimensionen', () => {
    const config: CanvasConfig = {
      breite: 1024,
      hoehe: 768,
      koordinatensystem: false,
      werkzeuge: [],
    }
    expect(berechneDimensionen(config, null)).toEqual({ breite: 1024, hoehe: 768 })
  })

  it('kein Preset, keine Dimensionen → Fallback mittel', () => {
    const config: CanvasConfig = {
      breite: 0,
      hoehe: 0,
      koordinatensystem: false,
      werkzeuge: [],
    }
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })

  it('preset=auto + kein Hintergrundbild → Fallback mittel', () => {
    const config: CanvasConfig = {
      breite: 0,
      hoehe: 0,
      koordinatensystem: false,
      werkzeuge: [],
      groessePreset: 'auto',
    }
    expect(berechneDimensionen(config, null)).toEqual(GROESSE_PRESETS['mittel'])
  })
})
