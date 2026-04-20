import { useState, useCallback, useRef, useEffect } from 'react'
import type { HotspotBereich } from '../../types/fragen'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  bereiche: HotspotBereich[]
  setBereiche: React.Dispatch<React.SetStateAction<HotspotBereich[]>>
  mehrfachauswahl: boolean
  setMehrfachauswahl: (v: boolean) => void
}

type DragState = { bereichId: string; startX: number; startY: number } | null

/** Bounding-Box aus Polygon-Punkten (für Render + Drag-Anzeige). */
function bbox(punkte: { x: number; y: number }[]): { x: number; y: number; b: number; h: number } {
  if (!Array.isArray(punkte) || punkte.length === 0) return { x: 0, y: 0, b: 0, h: 0 }
  const xs = punkte.map(p => p.x), ys = punkte.map(p => p.y)
  const minX = Math.min(...xs), minY = Math.min(...ys)
  return { x: minX, y: minY, b: Math.max(...xs) - minX, h: Math.max(...ys) - minY }
}

export default function HotspotEditor({ bildUrl, setBildUrl, bereiche, setBereiche, mehrfachauswahl, setMehrfachauswahl }: Props) {
  const [ersteEcke, setErsteEcke] = useState<{ x: number; y: number } | null>(null)
  const [editLabel, setEditLabel] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function bildKoordinaten(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const container = containerRef.current
    if (!container) return null
    const rect = container.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    }
  }

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag) return
    // Nur auf Container-Hintergrund reagieren, nicht auf Bereiche
    const target = e.target as HTMLElement
    if (target.closest('[data-bereich]')) return

    const p = bildKoordinaten(e)
    if (!p) return

    if (!ersteEcke) {
      setErsteEcke(p)
    } else {
      const minX = Math.min(ersteEcke.x, p.x)
      const minY = Math.min(ersteEcke.y, p.y)
      const breite = Math.abs(p.x - ersteEcke.x)
      const hoehe = Math.abs(p.y - ersteEcke.y)
      // Als 4-Punkt-Polygon speichern (TL, TR, BR, BL)
      const neuerBereich: HotspotBereich = {
        id: `b${Date.now()}`,
        form: 'rechteck',
        punkte: [
          { x: minX, y: minY },
          { x: minX + breite, y: minY },
          { x: minX + breite, y: minY + hoehe },
          { x: minX, y: minY + hoehe },
        ],
        label: `Bereich ${bereiche.length + 1}`,
        punktzahl: 1,
      }
      setBereiche(prev => [...prev, neuerBereich])
      setErsteEcke(null)
      setEditLabel(neuerBereich.id)
    }
  }, [ersteEcke, bereiche.length, setBereiche, drag])

  function handleBereichEntfernen(id: string) {
    setBereiche(prev => prev.filter(b => b.id !== id))
  }

  function handleLabelAendern(id: string, label: string) {
    setBereiche(prev => prev.map(b => (b.id === id ? { ...b, label } : b)))
  }

  function handlePunktzahlAendern(id: string, punktzahl: number) {
    setBereiche(prev => prev.map(b => (b.id === id ? { ...b, punktzahl } : b)))
  }

  function handleBereichPointerDown(bereich: HotspotBereich, e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    const p = bildKoordinaten(e)
    if (!p) return
    setDrag({ bereichId: bereich.id, startX: p.x, startY: p.y })
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  useEffect(() => {
    if (!drag) return
    let lastX = drag.startX, lastY = drag.startY
    function onMove(e: PointerEvent) {
      const p = bildKoordinaten(e)
      if (!p) return
      const dx = p.x - lastX, dy = p.y - lastY
      lastX = p.x; lastY = p.y
      setBereiche(prev => prev.map(b => {
        if (b.id !== drag!.bereichId) return b
        return { ...b, punkte: b.punkte.map(pt => ({
          x: Math.max(0, Math.min(100, pt.x + dx)),
          y: Math.max(0, Math.min(100, pt.y + dy)),
        })) }
      }))
    }
    function onUp() { setDrag(null) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, setBereiche])

  return (
    <div className="space-y-4">
      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="hotspot" />

      {bildUrl && (
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            {ersteEcke
              ? 'Klicke auf die zweite Ecke des Rechtecks'
              : 'Klicke aufs Bild für neuen Bereich, Bereich ziehen zum Verschieben'}
          </p>
          <div ref={containerRef} className="relative block w-full max-w-2xl cursor-crosshair" onClick={handleBildKlick}>
            <img
              src={resolvePoolBildUrl(bildUrl)}
              alt="Hotspot-Vorschau"
              className="block w-full h-auto rounded-lg select-none"
              style={{ objectFit: 'contain', maxHeight: '400px' }}
              draggable={false}
            />

            {ersteEcke && (
              <div
                className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-violet-500 border-2 border-white shadow-md pointer-events-none"
                style={{ left: `${ersteEcke.x}%`, top: `${ersteEcke.y}%` }}
              />
            )}

            {/* Polygone als SVG-Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {bereiche.map((bereich) => (
                <polygon
                  key={bereich.id}
                  points={bereich.punkte.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="rgba(139,92,246,0.2)"
                  stroke="#8b5cf6"
                  strokeWidth="0.4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {/* Bounding-Box-Div pro Bereich für Drag + Label-Nummer */}
            {bereiche.map((bereich, i) => {
              const bb = bbox(bereich.punkte)
              return (
                <div
                  key={bereich.id}
                  data-bereich={bereich.id}
                  onPointerDown={(e) => handleBereichPointerDown(bereich, e)}
                  className="absolute cursor-move"
                  style={{
                    left: `${bb.x}%`,
                    top: `${bb.y}%`,
                    width: `${bb.b}%`,
                    height: `${bb.h}%`,
                    touchAction: 'none',
                  }}
                >
                  <span className="absolute -top-5 left-0 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1 rounded shadow pointer-events-none">
                    {i + 1}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bereiche.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Definierte Bereiche ({bereiche.length})
          </p>
          <div className="space-y-2">
            {bereiche.map((bereich, i) => (
              <div key={bereich.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={bereich.label}
                    onChange={(e) => handleLabelAendern(bereich.id, e.target.value)}
                    autoFocus={editLabel === bereich.id}
                    onFocus={() => setEditLabel(null)}
                    className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-slate-500 focus:outline-none"
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    value={bereich.punktzahl}
                    onChange={(e) => handlePunktzahlAendern(bereich.id, Number(e.target.value))}
                    min={0}
                    step={0.5}
                    className="w-16 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-slate-500 focus:outline-none text-center"
                    title="Punkte"
                  />
                  <span className="text-xs text-slate-400">Pkt</span>
                  <button
                    onClick={() => handleBereichEntfernen(bereich.id)}
                    className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
                    title="Bereich entfernen"
                  >
                    {'\u2715'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={mehrfachauswahl}
          onChange={(e) => setMehrfachauswahl(e.target.checked)}
          className="rounded border-slate-300 dark:border-slate-600"
        />
        <span className="text-sm text-slate-700 dark:text-slate-200">
          Mehrfachauswahl (SuS kann mehrere Bereiche anklicken)
        </span>
      </label>
    </div>
  )
}
