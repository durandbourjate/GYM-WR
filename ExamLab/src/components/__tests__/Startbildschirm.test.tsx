import { describe, it, expect } from 'vitest'
import componentSource from '../Startbildschirm.tsx?raw'

describe('Startbildschirm — Warteraum-Polling', () => {
  it('Hebel D: Warteraum-Polling auf 3000ms', () => {
    // Positive Match: setInterval mit 3000ms und zugehörigem return () => clearInterval
    // Pattern: }, 3000) gefolgt von newline + return () => clearInterval
    expect(componentSource).toMatch(/}\s*,\s*3000\s*\)\s*\n\s*return\s*\(\s*\)\s*=>\s*clearInterval/)

    // Negative Match: Das alte 5000ms-Polling vor clearInterval sollte NICHT mehr existieren
    // Pattern: }, 5000) gefolgt von newline + return () => clearInterval
    // (Dies war der alte Heartbeat-Polling, sollte durch 3000 ersetzt sein)
    expect(componentSource).not.toMatch(/}\s*,\s*5000\s*\)\s*\n\s*return\s*\(\s*\)\s*=>\s*clearInterval/)
  })
})
