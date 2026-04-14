import { useState } from 'react'
import type { GeraetTyp } from '../types/lockdown'

export function erkenneGeraet(): GeraetTyp {
  const ua = navigator.userAgent
  // iPad mit Desktop-UA erkennen (iPadOS 13+)
  if (/iPad|iPhone|iPod/.test(ua)) return 'tablet'
  if (navigator.maxTouchPoints > 1 && /Mac/.test(ua)) return 'tablet'
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet'
  return 'laptop'
}

function vollbildMoeglich(): boolean {
  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen
  )
}

export function useGeraetErkennung() {
  const [geraet] = useState<GeraetTyp>(erkenneGeraet)
  const [vollbildUnterstuetzt] = useState(vollbildMoeglich)

  return { geraet, vollbildUnterstuetzt }
}
