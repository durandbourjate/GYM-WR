import { useState, useCallback, useRef, useEffect } from 'react'
import type { DragDropBildZielzone } from '../../types/fragen'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'
import ZonenOverlay from '../components/ZonenOverlay'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  zielzonen: DragDropBildZielzone[]
  setZielzonen: React.Dispatch<React.SetStateAction<DragDropBildZielzone[]>>
  labels: string[]
  setLabels: React.Dispatch<React.SetStateAction<string[]>>
}

type Modus = 'rechteck' | 'polygon'
type Drag =
  | { kind: 'flaeche'; zoneId: string; lastX: number; lastY: number }
  | { kind: 'punkt'; zoneId: string; punktIndex: number }
  | null

const HIT_RADIUS_ERSTER_PUNKT = 2.5

function rechteckEckeDrag(punkte: { x: number; y: number }[], punktIndex: number, neu: { x: number; y: number }): { x: number; y: number }[] {
  if (punkte.length !== 4) return punkte
  const neuePunkte = punkte.map(p => ({ ...p }))
  neuePunkte[punktIndex] = neu
  const xNachbar = [3, 2, 1, 0][punktIndex]
  const yNachbar = [1, 0, 3, 2][punktIndex]
  neuePunkte[xNachbar] = { ...neuePunkte[xNachbar], x: neu.x }
  neuePunkte[yNachbar] = { ...neuePunkte[yNachbar], y: neu.y }
  return neuePunkte
}

export default function DragDropBildEditor({ bildUrl, setBildUrl, zielzonen, setZielzonen, labels, setLabels }: Props) {
  const [modus, setModus] = useState<Modus>('rechteck')
  const [ersteEcke, setErsteEcke] = useState<{ x: number; y: number } | null>(null)
  const [polyPunkte, setPolyPunkte] = useState<{ x: number; y: number }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [labelsText, setLabelsText] = useState((labels ?? []).join(', '))
  const [drag, setDrag] = useState<Drag>(null)
  const [mausPosition, setMausPosition] = useState<{ x: number; y: number } | null>(null)
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setErsteEcke(null); setPolyPunkte([]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function polygonAbschliessen() {
    if (polyPunkte.length < 3) { setPolyPunkte([]); return }
    const neu: DragDropBildZielzone = {
      id: `z${Date.now()}`,
      form: 'polygon',
      punkte: polyPunkte,
      korrektesLabel: `Label ${zielzonen.length + 1}`,
    }
    setZielzonen(prev => [...prev, neu])
    setPolyPunkte([])
    setSelectedId(neu.id)
  }

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag) return
    const p = bildKoordinaten(e)
    if (!p) return

    if (modus === 'rechteck') {
      if (!ersteEcke) {
        setErsteEcke(p)
      } else {
        const minX = Math.min(ersteEcke.x, p.x)
        const minY = Math.min(ersteEcke.y, p.y)
        const breite = Math.abs(p.x - ersteEcke.x)
        const hoehe = Math.abs(p.y - ersteEcke.y)
        if (breite < 0.5 || hoehe < 0.5) { setErsteEcke(null); return }
        const neu: DragDropBildZielzone = {
          id: `z${Date.now()}`,
          form: 'rechteck',
          punkte: [
            { x: minX, y: minY },
            { x: minX + breite, y: minY },
            { x: minX + breite, y: minY + hoehe },
            { x: minX, y: minY + hoehe },
          ],
          korrektesLabel: `Label ${zielzonen.length + 1}`,
        }
        setZielzonen(prev => [...prev, neu])
        setErsteEcke(null)
        setSelectedId(neu.id)
      }
    } else {
      if (polyPunkte.length >= 3) {
        const erster = polyPunkte[0]
        if (Math.hypot(p.x - erster.x, p.y - erster.y) < HIT_RADIUS_ERSTER_PUNKT) {
          polygonAbschliessen()
          return
        }
      }
      setPolyPunkte(prev => [...prev, p])
    }
  }, [modus, ersteEcke, polyPunkte, drag, zielzonen.length, setZielzonen])

  function handleBildDoppelKlick() {
    if (modus === 'polygon' && polyPunkte.length >= 3) polygonAbschliessen()
  }

  function handleZonePointerDown(zoneId: string, e: React.PointerEvent) {
    e.stopPropagation()
    const p = bildKoordinaten(e)
    if (!p) return
    setSelectedId(zoneId)
    setDrag({ kind: 'flaeche', zoneId, lastX: p.x, lastY: p.y })
    ;(e.currentTarget as Element as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function handlePunktPointerDown(zoneId: string, punktIndex: number, e: React.PointerEvent) {
    e.stopPropagation()
    setSelectedId(zoneId)
    setDrag({ kind: 'punkt', zoneId, punktIndex })
    ;(e.currentTarget as Element as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function handlePunktDoppelKlick(zoneId: string, punktIndex: number) {
    setZielzonen(prev => prev.map(z => {
      if (z.id !== zoneId) return z
      if (z.punkte.length <= 3) return z
      return { ...z, punkte: z.punkte.filter((_, i) => i !== punktIndex) }
    }))
  }

  function handleKantenKlick(zoneId: string, nachPunktIndex: number) {
    setZielzonen(prev => prev.map(z => {
      if (z.id !== zoneId) return z
      const i = nachPunktIndex
      const next = (i + 1) % z.punkte.length
      const mx = (z.punkte[i].x + z.punkte[next].x) / 2
      const my = (z.punkte[i].y + z.punkte[next].y) / 2
      const neu = [...z.punkte.slice(0, i + 1), { x: mx, y: my }, ...z.punkte.slice(i + 1)]
      return { ...z, form: 'polygon', punkte: neu }
    }))
  }

  useEffect(() => {
    if (!drag) return
    function onMove(e: PointerEvent) {
      const p = bildKoordinaten(e)
      if (!p) return
      setZielzonen(prev => prev.map(z => {
        if (z.id !== drag!.zoneId) return z
        if (drag!.kind === 'flaeche') {
          const dx = p.x - drag!.lastX, dy = p.y - drag!.lastY
          drag!.lastX = p.x; drag!.lastY = p.y
          return { ...z, punkte: z.punkte.map(pt => ({
            x: Math.max(0, Math.min(100, pt.x + dx)),
            y: Math.max(0, Math.min(100, pt.y + dy)),
          })) }
        } else {
          if (z.form === 'rechteck' && z.punkte.length === 4) {
            return { ...z, punkte: rechteckEckeDrag(z.punkte, drag!.punktIndex, p) }
          }
          return { ...z, punkte: z.punkte.map((pt, i) => i === drag!.punktIndex ? p : pt) }
        }
      }))
    }
    function onUp() { setDrag(null) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, setZielzonen])

  const handleLabelAendern = useCallback((id: string, label: string) => {
    setZielzonen(prev => prev.map(z => z.id === id ? { ...z, korrektesLabel: label } : z))
  }, [setZielzonen])

  const handleZoneLoeschen = useCallback((id: string) => {
    setZielzonen(prev => prev.filter(z => z.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [setZielzonen, selectedId])

  const handleLabelsAktualisieren = useCallback((text: string) => {
    setLabelsText(text)
    setLabels(text.split(',').map(l => l.trim()).filter(Boolean))
  }, [setLabels])

  function handleMouseMove(e: React.MouseEvent) {
    const p = bildKoordinaten(e)
    if (p) setMausPosition(p)
  }

  // Defensiv: Zonen im Alt-Format (ohne Array-punkte) nicht rendern, sondern als Hinweis anzeigen
  const istWohlgeformt = (z: DragDropBildZielzone) => Array.isArray((z as any).punkte) && (z as any).punkte.length >= 3
  const sichereZonen = (zielzonen ?? []).filter(istWohlgeformt)
  const anzahlAlt = (zielzonen ?? []).length - sichereZonen.length
  const zonen = sichereZonen.map(z => ({ id: z.id, punkte: z.punkte, akzent: 'violett' as const }))

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Drag & Drop auf Bild
      </h4>

      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="dragdrop_bild" />

      {bildUrl && (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setModus('rechteck'); setPolyPunkte([]) }}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                modus === 'rechteck'
                  ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span aria-hidden>□</span> Rechteck
            </button>
            <button
              type="button"
              onClick={() => { setModus('polygon'); setErsteEcke(null) }}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                modus === 'polygon'
                  ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-100 font-medium'
                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <span aria-hidden>⬡</span> Polygon
            </button>
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
              Zielzonen: {zielzonen.length}
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {modus === 'rechteck'
                ? (ersteEcke ? 'Klicke auf die zweite Ecke des Rechtecks' : 'Klicke auf zwei Ecken — Zone ziehen zum Verschieben.')
                : (polyPunkte.length === 0
                    ? 'Klicke mehrere Punkte — Doppelklick oder Klick auf ersten Punkt schliesst.'
                    : `${polyPunkte.length} Punkt${polyPunkte.length !== 1 ? 'e' : ''} gesetzt.`)
              }
            </p>
            <div
              ref={containerRef}
              className="relative block w-full max-w-2xl cursor-crosshair border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden"
              onClick={handleBildKlick}
              onDoubleClick={handleBildDoppelKlick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setMausPosition(null)}
            >
              <img
                src={resolvePoolBildUrl(bildUrl)}
                alt="Drag & Drop Bild"
                className="block w-full h-auto"
                draggable={false}
              />

              {modus === 'rechteck' && ersteEcke && (
                <div
                  className="absolute w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                  style={{ left: `${ersteEcke.x}%`, top: `${ersteEcke.y}%` }}
                />
              )}

              <ZonenOverlay
                zonen={zonen}
                selectedId={selectedId}
                zeichnePunkte={modus === 'polygon' ? polyPunkte : undefined}
                mausPosition={modus === 'polygon' ? mausPosition : null}
                ersterPunktHitRadius={HIT_RADIUS_ERSTER_PUNKT}
                onZonePointerDown={handleZonePointerDown}
                onPunktPointerDown={handlePunktPointerDown}
                onPunktDoppelKlick={handlePunktDoppelKlick}
                onKantenKlick={handleKantenKlick}
              />

              {/* Zahlen-Badges */}
              {sichereZonen.map((zone, i) => {
                const xs = zone.punkte.map(p => p.x), ys = zone.punkte.map(p => p.y)
                const cx = xs.reduce((s, v) => s + v, 0) / xs.length
                const cy = ys.reduce((s, v) => s + v, 0) / ys.length
                return (
                  <span
                    key={zone.id + '-badge'}
                    className="absolute text-xs font-bold text-violet-800 dark:text-violet-200 bg-white/80 dark:bg-slate-800/80 px-1 rounded pointer-events-none"
                    style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
          {anzahlAlt > 0 && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-300">
              ⚠ {anzahlAlt} Zielzone{anzahlAlt > 1 ? 'n' : ''} ha{anzahlAlt > 1 ? 'ben' : 't'} noch das alte Zonen-Format und wird/werden nicht angezeigt.
              Öffne Einstellungen → Admin → Zonen-Migration.
            </div>
          )}
        </>
      )}

      {(zielzonen ?? []).length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Zielzonen ({(zielzonen ?? []).length})
          </h5>
          {(zielzonen ?? []).map((zone, i) => (
            <div
              key={zone.id}
              className={`p-2 rounded-lg border ${
                selectedId === zone.id
                  ? 'border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              onClick={() => setSelectedId(zone.id)}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={zone.korrektesLabel}
                  onChange={(e) => handleLabelAendern(zone.id, e.target.value)}
                  placeholder="Korrektes Label"
                  className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white"
                />
                <span className="text-xs text-slate-400 px-1">
                  {zone.form === 'rechteck' ? '□' : '⬡'} {Array.isArray(zone.punkte) ? zone.punkte.length : '?'}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleZoneLoeschen(zone.id) }}
                  className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
                  title="Zone loeschen"
                >
                  x
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Label-Pool (kommasepariert, inkl. Distraktoren)
        </label>
        <input
          type="text"
          value={labelsText}
          onChange={(e) => handleLabelsAktualisieren(e.target.value)}
          placeholder="Label 1, Label 2, Distraktor 1, ..."
          className="w-full mt-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Muss alle korrekten Labels der Zielzonen enthalten. Zusaetzliche Labels dienen als Distraktoren.
        </p>
      </div>

      {zielzonen.length > 0 && (labels ?? []).length > 0 && (
        (() => {
          const fehlend = zielzonen.filter(z => !(labels ?? []).includes(z.korrektesLabel))
          if (fehlend.length === 0) return null
          return (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
              Warnung: Folgende korrekte Labels fehlen im Pool: {fehlend.map(z => z.korrektesLabel).join(', ')}
            </div>
          )
        })()
      )}
    </div>
  )
}
