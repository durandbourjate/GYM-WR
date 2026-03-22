/**
 * Hook für Panel-Resize per Drag.
 * Extrahiert aus FragenEditor.tsx — wiederverwendbar für alle Slide-in-Panels.
 */
import { useState, useCallback, useEffect, useRef } from 'react'

export function usePanelResize(
  initialBreite = 1008,
  minBreite = 480,
  maxAnteil = 0.9,
): {
  panelBreite: number
  handleZiehStart: (e: React.MouseEvent) => void
} {
  const [panelBreite, setPanelBreite] = useState(initialBreite)
  const ziehtRef = useRef(false)
  const startXRef = useRef(0)
  const startBreiteRef = useRef(0)

  const handleZiehStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    ziehtRef.current = true
    startXRef.current = e.clientX
    startBreiteRef.current = panelBreite
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [panelBreite])

  useEffect(() => {
    function handleMauseBewegung(e: MouseEvent): void {
      if (!ziehtRef.current) return
      const maxBreite = window.innerWidth * maxAnteil
      // Panel ist rechts → nach links ziehen = grösser
      const delta = startXRef.current - e.clientX
      const neueBreite = Math.min(maxBreite, Math.max(minBreite, startBreiteRef.current + delta))
      setPanelBreite(neueBreite)
    }

    function handleMauseLos(): void {
      if (!ziehtRef.current) return
      ziehtRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMauseBewegung)
    document.addEventListener('mouseup', handleMauseLos)
    return () => {
      document.removeEventListener('mousemove', handleMauseBewegung)
      document.removeEventListener('mouseup', handleMauseLos)
    }
  }, [minBreite, maxAnteil])

  return { panelBreite, handleZiehStart }
}
