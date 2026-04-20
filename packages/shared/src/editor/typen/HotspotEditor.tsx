import { useState, useCallback, useRef, useEffect } from 'react'
import type { HotspotBereich } from '../../types/fragen'
import BildMitGenerator from '../components/BildMitGenerator'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'
import ZonenOverlay from '../components/ZonenOverlay'

interface Props {
  bildUrl: string
  setBildUrl: (v: string) => void
  bereiche: HotspotBereich[]
  setBereiche: React.Dispatch<React.SetStateAction<HotspotBereich[]>>
  mehrfachauswahl: boolean
  setMehrfachauswahl: (v: boolean) => void
}

type Modus = 'rechteck' | 'polygon'
type Drag =
  | { kind: 'flaeche'; zoneId: string; lastX: number; lastY: number }
  | { kind: 'punkt'; zoneId: string; punktIndex: number }
  | null

const HIT_RADIUS_ERSTER_PUNKT = 2.5 // Prozent — Klick in diesem Radius schliesst Polygon

/** Rechteck-Constraint: Punkt 0=TL, 1=TR, 2=BR, 3=BL. Beim Eck-Drag Nachbarn mitziehen. */
function rechteckEckeDrag(punkte: { x: number; y: number }[], punktIndex: number, neu: { x: number; y: number }): { x: number; y: number }[] {
  if (punkte.length !== 4) return punkte
  const neuePunkte = punkte.map(p => ({ ...p }))
  neuePunkte[punktIndex] = neu
  // Nachbar-Indices: der eine teilt x, der andere teilt y.
  // Reihenfolge TL(0)→TR(1)→BR(2)→BL(3):
  //   0 teilt x mit 3 (BL), teilt y mit 1 (TR)
  //   1 teilt x mit 2 (BR), teilt y mit 0 (TL)
  //   2 teilt x mit 1 (TR), teilt y mit 3 (BL)
  //   3 teilt x mit 0 (TL), teilt y mit 2 (BR)
  const xNachbar = [3, 2, 1, 0][punktIndex]
  const yNachbar = [1, 0, 3, 2][punktIndex]
  neuePunkte[xNachbar] = { ...neuePunkte[xNachbar], x: neu.x }
  neuePunkte[yNachbar] = { ...neuePunkte[yNachbar], y: neu.y }
  return neuePunkte
}

export default function HotspotEditor({ bildUrl, setBildUrl, bereiche, setBereiche, mehrfachauswahl, setMehrfachauswahl }: Props) {
  const [modus, setModus] = useState<Modus>('rechteck')
  const [ersteEcke, setErsteEcke] = useState<{ x: number; y: number } | null>(null)
  const [polyPunkte, setPolyPunkte] = useState<{ x: number; y: number }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState<string | null>(null)
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

  // ESC bricht aktuelles Zeichnen ab
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setErsteEcke(null); setPolyPunkte([]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function polygonAbschliessen() {
    if (polyPunkte.length < 3) { setPolyPunkte([]); return }
    const neu: HotspotBereich = {
      id: `b${Date.now()}`,
      form: 'polygon',
      punkte: polyPunkte,
      label: `Bereich ${bereiche.length + 1}`,
      punktzahl: 1,
    }
    setBereiche(prev => [...prev, neu])
    setPolyPunkte([])
    setSelectedId(neu.id)
    setEditLabel(neu.id)
  }

  const handleBildKlick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Während aktivem Drag keine Klicks
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
        const neu: HotspotBereich = {
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
        setBereiche(prev => [...prev, neu])
        setErsteEcke(null)
        setSelectedId(neu.id)
        setEditLabel(neu.id)
      }
    } else {
      // Polygon-Modus: Klick auf ersten Punkt schliesst (wenn ≥3 Punkte)
      if (polyPunkte.length >= 3) {
        const erster = polyPunkte[0]
        if (Math.hypot(p.x - erster.x, p.y - erster.y) < HIT_RADIUS_ERSTER_PUNKT) {
          polygonAbschliessen()
          return
        }
      }
      setPolyPunkte(prev => [...prev, p])
    }
  }, [modus, ersteEcke, polyPunkte, drag, bereiche.length, setBereiche])

  function handleBildDoppelKlick() {
    if (modus === 'polygon' && polyPunkte.length >= 3) polygonAbschliessen()
  }

  // Zone-Fläche PointerDown → Drag-Start für gesamtes Polygon
  function handleZonePointerDown(zoneId: string, e: React.PointerEvent) {
    e.stopPropagation()
    const p = bildKoordinaten(e)
    if (!p) return
    setSelectedId(zoneId)
    setDrag({ kind: 'flaeche', zoneId, lastX: p.x, lastY: p.y })
    ;(e.currentTarget as Element as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  // Punkt-PointerDown → Drag-Start für einzelnen Punkt
  function handlePunktPointerDown(zoneId: string, punktIndex: number, e: React.PointerEvent) {
    e.stopPropagation()
    setSelectedId(zoneId)
    setDrag({ kind: 'punkt', zoneId, punktIndex })
    ;(e.currentTarget as Element as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  function handlePunktDoppelKlick(zoneId: string, punktIndex: number) {
    // Punkt löschen, aber mindestens 3 Punkte im Polygon halten
    setBereiche(prev => prev.map(b => {
      if (b.id !== zoneId) return b
      if (b.punkte.length <= 3) return b
      return { ...b, punkte: b.punkte.filter((_, i) => i !== punktIndex) }
    }))
  }

  function handleKantenKlick(zoneId: string, nachPunktIndex: number) {
    // Neuen Punkt zwischen nachPunktIndex und nachPunktIndex+1 einfügen (mittig).
    setBereiche(prev => prev.map(b => {
      if (b.id !== zoneId) return b
      const i = nachPunktIndex
      const next = (i + 1) % b.punkte.length
      const mx = (b.punkte[i].x + b.punkte[next].x) / 2
      const my = (b.punkte[i].y + b.punkte[next].y) / 2
      const neu = [...b.punkte.slice(0, i + 1), { x: mx, y: my }, ...b.punkte.slice(i + 1)]
      // Sobald Rechteck zu 5+ Punkten wird, Form → 'polygon' (nicht mehr axis-aligned)
      return { ...b, form: 'polygon', punkte: neu }
    }))
  }

  // Globale Pointer-Handler für aktiven Drag
  useEffect(() => {
    if (!drag) return
    function onMove(e: PointerEvent) {
      const p = bildKoordinaten(e)
      if (!p) return
      setBereiche(prev => prev.map(b => {
        if (b.id !== drag!.zoneId) return b
        if (drag!.kind === 'flaeche') {
          const dx = p.x - drag!.lastX, dy = p.y - drag!.lastY
          drag!.lastX = p.x; drag!.lastY = p.y
          return { ...b, punkte: b.punkte.map(pt => ({
            x: Math.max(0, Math.min(100, pt.x + dx)),
            y: Math.max(0, Math.min(100, pt.y + dy)),
          })) }
        } else {
          // Einzel-Punkt
          if (b.form === 'rechteck' && b.punkte.length === 4) {
            return { ...b, punkte: rechteckEckeDrag(b.punkte, drag!.punktIndex, p) }
          }
          return { ...b, punkte: b.punkte.map((pt, i) => i === drag!.punktIndex ? p : pt) }
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
  }, [drag, setBereiche])

  function handleBereichEntfernen(id: string) {
    setBereiche(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function handleLabelAendern(id: string, label: string) {
    setBereiche(prev => prev.map(b => (b.id === id ? { ...b, label } : b)))
  }

  function handlePunktzahlAendern(id: string, punktzahl: number) {
    setBereiche(prev => prev.map(b => (b.id === id ? { ...b, punktzahl } : b)))
  }

  // Mausbewegung für Polygon-Vorschau
  function handleMouseMove(e: React.MouseEvent) {
    const p = bildKoordinaten(e)
    if (p) setMausPosition(p)
  }

  // Defensiv: Bereiche im Alt-Format (ohne Array-punkte) nicht rendern, sondern anzeigen als Hinweis
  const istWohlgeformt = (b: HotspotBereich) => Array.isArray((b as any).punkte) && (b as any).punkte.length >= 3
  const sichereBereiche = (bereiche ?? []).filter(istWohlgeformt)
  const anzahlAlt = (bereiche ?? []).length - sichereBereiche.length
  const zonen = sichereBereiche.map(b => ({ id: b.id, punkte: b.punkte, label: b.label, akzent: 'violett' as const }))

  return (
    <div className="space-y-4">
      <BildMitGenerator bildUrl={bildUrl} setBildUrl={setBildUrl} fragetyp="hotspot" />

      {bildUrl && (
        <>
          {/* Toolbar */}
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
              Bereiche: {bereiche.length}
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              {modus === 'rechteck'
                ? (ersteEcke ? 'Klicke auf die zweite Ecke des Rechtecks' : 'Klicke auf zwei Ecken — Zone ziehen zum Verschieben, Ecke ziehen zum Resize')
                : (polyPunkte.length === 0
                    ? 'Klicke mehrere Punkte — Doppelklick oder Klick auf den ersten Punkt schliesst das Polygon. ESC bricht ab.'
                    : `${polyPunkte.length} Punkt${polyPunkte.length !== 1 ? 'e' : ''} gesetzt. Doppelklick oder Klick auf ersten Punkt schliesst.`)
              }
            </p>
            <div
              ref={containerRef}
              className="relative block w-full max-w-2xl cursor-crosshair"
              onClick={handleBildKlick}
              onDoubleClick={handleBildDoppelKlick}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setMausPosition(null)}
            >
              <img
                src={resolvePoolBildUrl(bildUrl)}
                alt="Hotspot-Vorschau"
                className="block w-full h-auto rounded-lg select-none"
                style={{ objectFit: 'contain', maxHeight: '400px' }}
                draggable={false}
              />

              {/* Vorschau der ersten Rechteck-Ecke */}
              {modus === 'rechteck' && ersteEcke && (
                <div
                  className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-violet-500 border-2 border-white shadow-md pointer-events-none"
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

              {/* Zahlen-Badges über den Zonen (HTML, damit Text nicht skaliert wird) */}
              {sichereBereiche.map((bereich, i) => {
                const xs = bereich.punkte.map(p => p.x), ys = bereich.punkte.map(p => p.y)
                const minX = Math.min(...xs), minY = Math.min(...ys)
                return (
                  <span
                    key={bereich.id + '-badge'}
                    className="absolute text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1 rounded shadow pointer-events-none"
                    style={{ left: `${minX}%`, top: `calc(${minY}% - 1.25rem)` }}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
          {anzahlAlt > 0 && (
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-300">
              ⚠ {anzahlAlt} Bereich{anzahlAlt > 1 ? 'e' : ''} hat noch das alte Zonen-Format und wird nicht angezeigt.
              Öffne Einstellungen → Admin → Zonen-Migration und führe die Migration für das betroffene Fach aus.
            </div>
          )}
        </>
      )}

      {(bereiche ?? []).length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Definierte Bereiche ({(bereiche ?? []).length})
          </p>
          <div className="space-y-2">
            {(bereiche ?? []).map((bereich, i) => (
              <div
                key={bereich.id}
                className={`p-2 rounded-lg border ${
                  selectedId === bereich.id
                    ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                onClick={() => setSelectedId(bereich.id)}
              >
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
                  <span className="text-xs text-slate-400 px-1">
                    {bereich.form === 'rechteck' ? '□' : '⬡'} {Array.isArray(bereich.punkte) ? bereich.punkte.length : '?'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleBereichEntfernen(bereich.id) }}
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
