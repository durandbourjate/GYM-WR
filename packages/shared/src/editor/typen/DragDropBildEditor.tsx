import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { DragDropBildZielzone, DragDropBildLabel } from '../../types/fragen-core'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'
import ZonenOverlay from '../components/ZonenOverlay'
import type { FeldStatus } from '../pflichtfeldValidation'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  zielzonen: DragDropBildZielzone[]
  setZielzonen: React.Dispatch<React.SetStateAction<DragDropBildZielzone[]>>
  labels: DragDropBildLabel[]
  setLabels: React.Dispatch<React.SetStateAction<DragDropBildLabel[]>>
  /** Pflichtfeld-Status der Zielzonen-Section (Bundle H Phase 6) */
  feldStatusZielzonen?: FeldStatus
}

function pflichtCls(status: FeldStatus | undefined): string {
  return status === 'pflicht-leer'
    ? 'border border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40 rounded-lg p-3'
    : 'border border-slate-200 dark:border-slate-700 rounded-lg p-3'
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

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().slice(0, 8)
  return Math.random().toString(36).slice(2, 10)
}

/** Mini Chip-Input: Enter fügt Chip hinzu, x entfernt. */
function ChipInput({
  chips,
  onAdd,
  onRemove,
  placeholder,
  testId,
  chipTestIdPrefix,
}: {
  chips: string[]
  onAdd: (text: string) => void
  onRemove: (index: number) => void
  placeholder?: string
  testId: string
  chipTestIdPrefix?: string
}) {
  const [text, setText] = useState('')
  function commit() {
    const t = text.trim()
    if (!t) return
    onAdd(t)
    setText('')
  }
  return (
    <div className="flex flex-wrap gap-1 px-2 py-1 border rounded bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 min-h-[36px]">
      {chips.map((c, i) => (
        <span
          key={`${c}-${i}`}
          data-testid={chipTestIdPrefix ? `${chipTestIdPrefix}${c}` : undefined}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200"
        >
          {c}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-violet-500 hover:text-violet-700 dark:hover:text-violet-300"
            title="Entfernen"
          >
            ×
          </button>
        </span>
      ))}
      <input
        data-testid={testId}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 min-w-[120px] px-1 text-sm bg-transparent text-slate-700 dark:text-white outline-none"
      />
    </div>
  )
}

export default function DragDropBildEditor({ bildUrl, setBildUrl, zielzonen, setZielzonen, labels, setLabels, feldStatusZielzonen }: Props) {
  const [modus, setModus] = useState<Modus>('rechteck')
  const [ersteEcke, setErsteEcke] = useState<{ x: number; y: number } | null>(null)
  const [polyPunkte, setPolyPunkte] = useState<{ x: number; y: number }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
        e.preventDefault()
        setZielzonen(prev => prev.filter(z => z.id !== selectedId))
        setSelectedId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, setZielzonen])

  function polygonAbschliessen() {
    if (polyPunkte.length < 3) { setPolyPunkte([]); return }
    const neu: DragDropBildZielzone = {
      id: `z${Date.now()}`,
      form: 'polygon',
      punkte: polyPunkte,
      korrekteLabels: [`Label ${zielzonen.length + 1}`],
    }
    setZielzonen(prev => [...prev, neu])
    setPolyPunkte([])
    setSelectedId(neu.id)
  }

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag) return
    // SVG-Children (polygon/circle/path für existing Zonen + Punkte) blocken den Klick —
    // das ZonenOverlay-`<svg>`-Element selbst (transparenter Hintergrund) muss
    // aber durchklicken, damit neue Zonen auf leerem Bild gezeichnet werden können.
    if (e.target instanceof SVGElement && e.target.tagName !== 'svg') return
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
          korrekteLabels: [`Label ${zielzonen.length + 1}`],
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

  // Bundle J: Multi-Label per Zone (Synonyme)
  const updateZoneLabels = useCallback((zoneId: string, korrekteLabels: string[]) => {
    setZielzonen(prev => prev.map(z => z.id === zoneId ? { ...z, korrekteLabels } : z))
  }, [setZielzonen])

  // Bundle 2: Zonenname (label, optional)
  const updateZoneLabel = useCallback((zoneId: string, label: string | undefined) => {
    setZielzonen(prev => prev.map(z => z.id === zoneId ? { ...z, label } : z))
  }, [setZielzonen])

  const handleZoneLoeschen = useCallback((id: string) => {
    setZielzonen(prev => prev.filter(z => z.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [setZielzonen, selectedId])

  // Pool-Operations: Duplikate erlaubt
  const addPoolLabel = useCallback((text: string) => {
    setLabels(prev => [...prev, { id: genId(), text }])
  }, [setLabels])

  const removePoolLabel = useCallback((index: number) => {
    setLabels(prev => prev.filter((_, i) => i !== index))
  }, [setLabels])

  // Konsistenz-Hinweise
  const konsistenzHinweise = useMemo(() => {
    const zonenTexte = new Map<string, number>()
    for (const z of zielzonen) {
      for (const l of (z.korrekteLabels ?? [])) {
        const k = l.trim().toLowerCase()
        if (!k) continue
        zonenTexte.set(k, (zonenTexte.get(k) ?? 0) + 1)
      }
    }
    const poolTexte = new Map<string, number>()
    for (const l of labels) {
      const k = (l.text ?? '').trim().toLowerCase()
      if (!k) continue
      poolTexte.set(k, (poolTexte.get(k) ?? 0) + 1)
    }
    const hinweise: Array<{ text: string; level: 'warn' | 'info' }> = []
    let zoneIndex = 0
    for (const z of zielzonen) {
      zoneIndex++
      for (const text of (z.korrekteLabels ?? [])) {
        const k = text.trim().toLowerCase()
        if (!k) continue
        const poolCnt = poolTexte.get(k) ?? 0
        const zonenCnt = zonenTexte.get(k) ?? 0
        if (poolCnt < zonenCnt) {
          hinweise.push({ text: `Zone ${zoneIndex} akzeptiert '${text}', Pool hat ${poolCnt} (gebraucht: ${zonenCnt})`, level: 'warn' })
        }
      }
    }
    for (const [text, cnt] of poolTexte) {
      if (!zonenTexte.has(text)) hinweise.push({ text: `Pool-Token '${text}' (${cnt}×) passt zu keiner Zone (Distraktor)`, level: 'info' })
    }
    return hinweise
  }, [zielzonen, labels])

  function handleMouseMove(e: React.MouseEvent) {
    const p = bildKoordinaten(e)
    if (p) setMausPosition(p)
  }

  const istWohlgeformt = (z: DragDropBildZielzone) => Array.isArray(z.punkte) && z.punkte.length >= 3
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
                ? (ersteEcke ? 'Klicke auf die zweite Ecke des Rechtecks' : 'Klicke auf zwei Ecken — Zone ziehen zum Verschieben. Delete/Backspace löscht markierte Zone.')
                : (polyPunkte.length === 0
                    ? 'Klicke mehrere Punkte — Doppelklick oder Klick auf ersten Punkt schliesst. Delete/Backspace löscht markierte Zone.'
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
        <div data-testid="dnd-zielzonen-section" className={`space-y-2 ${pflichtCls(feldStatusZielzonen)}`}>
          <h5 className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Zielzonen ({(zielzonen ?? []).length}) — pro Zone akzeptierte Label-Synonyme
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
              <div className="flex items-start gap-2">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full shrink-0 mt-1">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={zone.label ?? ''}
                    onChange={(e) => updateZoneLabel(zone.id, e.target.value || undefined)}
                    placeholder="Zonenname (optional, z.B. 'Aktiva')"
                    data-testid={`zone-${zone.id}-label-input`}
                    className="w-full text-sm px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                  <ChipInput
                    chips={zone.korrekteLabels ?? []}
                    onAdd={(t) => updateZoneLabels(zone.id, [...(zone.korrekteLabels ?? []), t])}
                    onRemove={(idx) => updateZoneLabels(zone.id, (zone.korrekteLabels ?? []).filter((_, i) => i !== idx))}
                    placeholder="Korrekte Labels (Enter zum Hinzufügen)"
                    testId={`zone-${zone.id}-chip-input`}
                    chipTestIdPrefix={`zone-${zone.id}-chip-`}
                  />
                </div>
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
          Label-Pool (Duplikate erlaubt für Multi-Zone-Tokens)
        </label>
        <div className="mt-1">
          <ChipInput
            chips={labels.map(l => l.text)}
            onAdd={addPoolLabel}
            onRemove={removePoolLabel}
            placeholder="Pool-Token (Enter)"
            testId="pool-chip-input"
            chipTestIdPrefix="pool-chip-"
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Pro Zone müssen genug passende Tokens im Pool sein. Zusätzliche Tokens dienen als Distraktoren.
        </p>
      </div>

      {konsistenzHinweise.length > 0 && (
        <div data-testid="dnd-konsistenz" className="space-y-1">
          {konsistenzHinweise.map((h, i) => (
            <div
              key={i}
              className={`text-xs p-2 rounded border ${
                h.level === 'warn'
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-amber-300'
                  : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
              }`}
            >
              {h.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
