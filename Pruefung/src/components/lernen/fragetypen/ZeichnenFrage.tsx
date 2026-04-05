import { useRef, useEffect, useState, useCallback } from 'react'
import type { FrageKomponenteProps } from './index'
import type { VisualisierungFrage } from '../../../types/lernen/fragen'
import FeedbackBox from './FeedbackBox'
import { resolveAssetUrl } from '../../../utils/lernen/assetUrl'

export default function ZeichnenFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'visualisierung' && (frage.typ as string) !== 'zeichnen') return null
  const vizFrage = frage as VisualisierungFrage

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [farbe, setFarbe] = useState('#000000')
  const [dicke, setDicke] = useState(3)
  const [hatGezeichnet, setHatGezeichnet] = useState(false)
  const [selbstbewertung, setSelbstbewertung] = useState<'korrekt' | 'teilweise' | 'falsch' | null>(null)

  // Canvas initialisieren
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const getPos = useCallback((e: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  // Pointer Events über Refs (Regel #9)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || disabled) return

    const onDown = (e: PointerEvent) => {
      isDrawing.current = true
      lastPoint.current = getPos(e)
      canvas.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      if (!isDrawing.current || !lastPoint.current) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = farbe
      ctx.lineWidth = dicke
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      lastPoint.current = pos
      if (!hatGezeichnet) setHatGezeichnet(true)
    }

    const onUp = () => {
      isDrawing.current = false
      lastPoint.current = null
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointerleave', onUp)

    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onUp)
    }
  }, [disabled, farbe, dicke, getPos, hatGezeichnet])

  const loeschen = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHatGezeichnet(false)
  }

  const handleAbsenden = () => {
    if (!hatGezeichnet || disabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const datenUrl = canvas.toDataURL('image/png')
    onAntwort({ typ: 'zeichnen', datenUrl })
  }

  const handleSelbstbewertung = (bewertung: 'korrekt' | 'teilweise' | 'falsch') => {
    setSelbstbewertung(bewertung)
    const canvas = canvasRef.current
    if (!canvas) return
    onAntwort({ typ: 'zeichnen', datenUrl: canvas.toDataURL('image/png'), selbstbewertung: bewertung })
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex gap-2 items-center flex-wrap">
        <input type="color" value={farbe} onChange={(e) => setFarbe(e.target.value)} disabled={disabled} className="w-10 h-10 rounded cursor-pointer" title="Farbe" />
        <select value={dicke} onChange={(e) => setDicke(Number(e.target.value))} disabled={disabled} className="p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm min-h-[44px]">
          <option value={1}>Fein</option>
          <option value={3}>Normal</option>
          <option value={6}>Dick</option>
        </select>
        <button onClick={loeschen} disabled={disabled} className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px] dark:text-white">
          Alles loeschen
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white"
        style={{ touchAction: 'none', height: 400 }}
      />

      {!disabled && hatGezeichnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && (
        <div className="space-y-3">
          {vizFrage.musterloesungBild && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Musterloesung:</p>
              <img src={resolveAssetUrl(vizFrage.musterloesungBild)} alt="Musterloesung" className="w-full rounded-xl border border-slate-200 dark:border-slate-600" />
            </div>
          )}

          {!selbstbewertung && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Wie hast du abgeschnitten?</p>
              <div className="flex gap-2">
                <button onClick={() => handleSelbstbewertung('korrekt')} className="flex-1 py-3 rounded-xl border-2 border-green-300 text-green-700 dark:text-green-300 dark:border-green-600 font-medium min-h-[48px]">Korrekt</button>
                <button onClick={() => handleSelbstbewertung('teilweise')} className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-600 font-medium min-h-[48px]">Teilweise</button>
                <button onClick={() => handleSelbstbewertung('falsch')} className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-700 dark:text-red-300 dark:border-red-600 font-medium min-h-[48px]">Falsch</button>
              </div>
            </div>
          )}

          {selbstbewertung && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={vizFrage.musterlosung} />}
        </div>
      )}
    </div>
  )
}
