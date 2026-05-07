// ExamLab/src/components/fragetypen/zeichnen/useCanvasSetup.ts
import { useEffect, useRef, useState } from 'react'
import type { CanvasConfig } from '../../../types/fragen-storage'
import { GROESSE_PRESETS } from './ZeichnenTypes'

/**
 * Berechnet logische Canvas-Dimensionen aus CanvasConfig.
 * Pure function — exportiert für Vitest-Coverage.
 *
 * Reihenfolge:
 *   1. preset='auto' + Hintergrundbild → naturalWidth/naturalHeight
 *   2. preset!='auto' und valid → GROESSE_PRESETS[preset]
 *   3. config.breite + config.hoehe → custom
 *   4. Fallback → GROESSE_PRESETS['mittel']
 */
export function berechneDimensionen(
  canvasConfig: CanvasConfig,
  hintergrundbild: HTMLImageElement | null,
): { breite: number; hoehe: number } {
  const preset = canvasConfig.groessePreset

  if (preset === 'auto' && hintergrundbild) {
    return { breite: hintergrundbild.naturalWidth, hoehe: hintergrundbild.naturalHeight }
  }

  if (preset && preset !== 'auto' && GROESSE_PRESETS[preset]) {
    return GROESSE_PRESETS[preset]
  }

  if (canvasConfig.breite && canvasConfig.hoehe) {
    return { breite: canvasConfig.breite, hoehe: canvasConfig.hoehe }
  }

  return GROESSE_PRESETS['mittel']
}

interface UseCanvasSetupResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  hintergrundbild: HTMLImageElement | null
  logischeBreite: number
  logischeHoehe: number
}

/**
 * Bündelt Canvas-Refs + Hintergrundbild-Loading + Dimensions-Berechnung.
 *
 * Byte-identische Behavior-Kontrakt mit Source ZeichnenCanvas.tsx Z. 123-145.
 */
export function useCanvasSetup({ canvasConfig }: { canvasConfig: CanvasConfig }): UseCanvasSetupResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hintergrundbild, setHintergrundbild] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!canvasConfig.hintergrundbild) {
      setHintergrundbild(null)
      return
    }
    const img = new Image()
    img.onload = () => setHintergrundbild(img)
    img.src = canvasConfig.hintergrundbild
  }, [canvasConfig.hintergrundbild])

  const { breite: logischeBreite, hoehe: logischeHoehe } = berechneDimensionen(canvasConfig, hintergrundbild)

  return { canvasRef, containerRef, hintergrundbild, logischeBreite, logischeHoehe }
}
