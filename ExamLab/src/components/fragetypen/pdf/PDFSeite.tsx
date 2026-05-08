import { useRef, useEffect, useState, useCallback } from 'react'
import type {
  PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFTextAnnotation, PDFKategorie,
  PDFToolbarWerkzeug, PDFTextRange,
} from './PDFTypes.ts'
import type { PDFSeitenInfo, ZoomStufe } from './PDFTypes.ts'
import type { usePDFRenderer } from './usePDFRenderer.ts'
import { PDFKommentarPopover } from './PDFKommentarPopover.tsx'
import { PDFKategorieChooser } from './PDFKategorieChooser.tsx'
import { erzeugeId, leseTextauswahl } from './seite/pdfSelection.ts'
import { renderSVGOverlay } from './seite/pdfAnnotationenSVG.tsx'
import { usePDFTextEdit } from './seite/usePDFTextEdit.tsx'

interface Props {
  seitenNr: number
  zoom: ZoomStufe
  renderer: ReturnType<typeof usePDFRenderer>
  annotationen: PDFAnnotation[]
  aktivesWerkzeug: PDFToolbarWerkzeug
  aktiveFarbe: string
  kategorien?: PDFKategorie[]
  aktiveKategorieId?: string
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationLoeschen: (id: string) => void
  onAnnotationEditieren?: (id: string, updates: Partial<PDFAnnotation>) => void
  textRotation?: 0 | 90 | 180 | 270
  textGroesse?: number
  textFett?: boolean
  selectedAnnotation?: string | null
  onSelectedAnnotationChange?: (id: string | null) => void
  readOnly?: boolean
}

export function PDFSeite({
  seitenNr, zoom, renderer, annotationen, aktivesWerkzeug, aktiveFarbe,
  kategorien, aktiveKategorieId: _aktiveKategorieId, onAnnotationHinzufuegen, onAnnotationLoeschen,
  onAnnotationEditieren, textRotation = 0, textGroesse = 18, textFett = false,
  selectedAnnotation: selectedAnnotationProp, onSelectedAnnotationChange, readOnly,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const zeichenCanvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [seitenInfo, setSeitenInfo] = useState<PDFSeitenInfo | null>(null)

  // Popover state
  const [kommentarPopover, setKommentarPopover] = useState<{ x: number; y: number } | null>(null)
  // Text-Annotation Overlay
  const [textOverlay, setTextOverlay] = useState<{
    sichtbar: boolean; relX: number; relY: number; cssX: number; cssY: number; text: string
  }>({ sichtbar: false, relX: 0, relY: 0, cssX: 0, cssY: 0, text: '' })
  const textInputRef = useRef<HTMLInputElement>(null)
  // Auswahl: vom Parent gesteuert
  const selectedAnnotation = selectedAnnotationProp ?? null
  const setSelectedAnnotation = onSelectedAnnotationChange ?? (() => {})
  // Drag-State für Verschieben von Text-Annotationen
  const dragRef = useRef<{ annotId: string; startRelX: number; startRelY: number; origX: number; origY: number } | null>(null)
  const [kategorieChooser, setKategorieChooser] = useState<{
    x: number; y: number; textRange: PDFTextRange
  } | null>(null)

  // Freehand drawing state
  const istZeichnung = useRef(false)
  const zeichnungsPfad = useRef<{ x: number; y: number }[]>([])

  // --- Text-Edit-Hook (Doppelklick auf Text-Annotation) ---
  const {
    istEditierend,
    handleDoubleClick,
    beendeEdit,
    editOverlay,
  } = usePDFTextEdit({
    readOnly, seitenInfo, annotationen, containerRef, onAnnotationEditieren,
  })

  // --- PDF rendering ---
  useEffect(() => {
    const canvas = pdfCanvasRef.current
    if (!canvas) return
    let abgebrochen = false

    renderer.rendereSeite(seitenNr, canvas, zoom).then(info => {
      if (!abgebrochen && info) setSeitenInfo(info)
    })

    return () => { abgebrochen = true }
  }, [seitenNr, zoom, renderer])

  // --- Resize drawing canvas when seitenInfo changes ---
  useEffect(() => {
    const canvas = zeichenCanvasRef.current
    if (!canvas || !seitenInfo) return
    canvas.width = seitenInfo.breite * window.devicePixelRatio
    canvas.height = seitenInfo.hoehe * window.devicePixelRatio
    canvas.style.width = `${seitenInfo.breite}px`
    canvas.style.height = `${seitenInfo.hoehe}px`
  }, [seitenInfo])

  // --- Text layer rendering ---
  const textLayerSpans = seitenInfo?.textItems.map(item => {
    const left = item.transform[4] * zoom
    const fontSize = Math.abs(item.transform[3]) * zoom
    // PDF y-axis is bottom-up; transform[5] is baseline from bottom
    const top = seitenInfo.hoehe - item.transform[5] * zoom
    return (
      <span
        key={item.startOffset}
        data-offset={item.startOffset}
        className="absolute whitespace-pre text-transparent select-text"
        style={{
          left, top: top - fontSize, fontSize,
          lineHeight: `${fontSize}px`,
        }}
      >
        {item.str}
      </span>
    )
  })

  // --- Selection handler (highlight / label) ---
  const handleMouseUp = useCallback(() => {
    if (readOnly || !textLayerRef.current) return
    if (aktivesWerkzeug !== 'highlighter' && aktivesWerkzeug !== 'label') return

    const textRange = leseTextauswahl(textLayerRef.current)
    if (!textRange) return

    if (aktivesWerkzeug === 'highlighter') {
      const annotation: PDFHighlightAnnotation = {
        id: erzeugeId(), seite: seitenNr, zeitstempel: new Date().toISOString(),
        werkzeug: 'highlighter', textRange, farbe: aktiveFarbe,
      }
      onAnnotationHinzufuegen(annotation)
      window.getSelection()?.removeAllRanges()
    } else if (aktivesWerkzeug === 'label' && kategorien?.length) {
      // Show category chooser
      const sel = window.getSelection()
      if (!sel?.rangeCount) return
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      setKategorieChooser({
        x: rect.left - containerRect.left,
        y: rect.bottom - containerRect.top + 4,
        textRange,
      })
    }
  }, [readOnly, aktivesWerkzeug, aktiveFarbe, seitenNr, kategorien, onAnnotationHinzufuegen])

  // --- Category selection callback ---
  const handleKategorieSelect = useCallback((kategorieId: string) => {
    if (!kategorieChooser) return
    const kat = kategorien?.find(k => k.id === kategorieId)
    const annotation: PDFLabelAnnotation = {
      id: erzeugeId(), seite: seitenNr, zeitstempel: new Date().toISOString(),
      werkzeug: 'label', textRange: kategorieChooser.textRange,
      kategorieId, farbe: kat?.farbe ?? aktiveFarbe,
    }
    onAnnotationHinzufuegen(annotation)
    setKategorieChooser(null)
    window.getSelection()?.removeAllRanges()
  }, [kategorieChooser, kategorien, seitenNr, aktiveFarbe, onAnnotationHinzufuegen])

  // --- Comment placement ---
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (readOnly) return

    // Radierer: check if clicked on an annotation element
    if (aktivesWerkzeug === 'radierer') {
      let node: Element | null = e.target as Element
      let annotId: string | null = null
      while (node && node !== e.currentTarget) {
        annotId = node.getAttribute('data-annotation-id')
        if (annotId) break
        node = node.parentElement
      }
      if (annotId) onAnnotationLoeschen(annotId)
      return
    }

    // Auswahl: Text-Annotation anklicken → selektieren/deselektieren
    if (aktivesWerkzeug === 'auswahl') {
      // Bearbeitungsmodus beenden bei Klick ausserhalb
      if (istEditierend) {
        beendeEdit()
      }
      let node: Element | null = e.target as Element
      let annotId: string | null = null
      while (node && node !== e.currentTarget) {
        annotId = node.getAttribute('data-annotation-id')
        if (annotId) break
        node = node.parentElement
      }
      if (annotId) {
        setSelectedAnnotation(annotId === selectedAnnotation ? null : annotId)
      } else {
        setSelectedAnnotation(null)
      }
      return
    }

    if (!seitenInfo) return

    // Text-Werkzeug: Input-Overlay an Klickposition
    if (aktivesWerkzeug === 'text') {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const relX = (e.clientX - containerRect.left) / seitenInfo.breite
      const relY = (e.clientY - containerRect.top) / seitenInfo.hoehe
      const cssX = e.clientX - containerRect.left
      const cssY = e.clientY - containerRect.top
      setTextOverlay({ sichtbar: true, relX, relY, cssX, cssY, text: '' })
      // iOS: focus() muss im synchronen Event-Stack aufgerufen werden für Tastatur
      // Zuerst sofort (falls Input schon im DOM), dann nach Render
      textInputRef.current?.focus()
      requestAnimationFrame(() => textInputRef.current?.focus())
      return
    }

    if (aktivesWerkzeug !== 'kommentar') return
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const relX = (e.clientX - containerRect.left) / seitenInfo.breite
    const relY = (e.clientY - containerRect.top) / seitenInfo.hoehe

    setKommentarPopover({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    })

    // Store relative position in a data attribute for later use
    containerRef.current?.setAttribute('data-kommentar-rel', JSON.stringify({ x: relX, y: relY }))
  }, [readOnly, aktivesWerkzeug, seitenInfo, onAnnotationLoeschen, istEditierend, beendeEdit, selectedAnnotation])

  const handleKommentarSave = useCallback((text: string) => {
    const relStr = containerRef.current?.getAttribute('data-kommentar-rel')
    if (!relStr) return
    const pos = JSON.parse(relStr) as { x: number; y: number }

    const annotation: PDFKommentarAnnotation = {
      id: erzeugeId(), seite: seitenNr, zeitstempel: new Date().toISOString(),
      werkzeug: 'kommentar', position: pos, kommentarText: text,
    }
    onAnnotationHinzufuegen(annotation)
    setKommentarPopover(null)
    containerRef.current?.removeAttribute('data-kommentar-rel')
  }, [seitenNr, onAnnotationHinzufuegen])

  // Text-Annotation speichern
  const handleTextSave = useCallback(() => {
    if (!textOverlay.sichtbar || !textOverlay.text.trim()) {
      setTextOverlay(prev => ({ ...prev, sichtbar: false }))
      return
    }
    const annotation: PDFTextAnnotation = {
      id: erzeugeId(),
      seite: seitenNr,
      zeitstempel: new Date().toISOString(),
      werkzeug: 'text',
      position: { x: textOverlay.relX, y: textOverlay.relY },
      text: textOverlay.text.trim(),
      farbe: aktiveFarbe,
      groesse: textGroesse,
      fett: textFett,
      rotation: textRotation || undefined,
    }
    onAnnotationHinzufuegen(annotation)
    setTextOverlay({ sichtbar: false, relX: 0, relY: 0, cssX: 0, cssY: 0, text: '' })
  }, [textOverlay, seitenNr, aktiveFarbe, textRotation, textGroesse, textFett, onAnnotationHinzufuegen])

  // --- Freehand drawing ---
  const handleDrawStart = useCallback((e: React.PointerEvent) => {
    // Drag: Selektierte Text-Annotation verschieben
    if (!readOnly && aktivesWerkzeug === 'auswahl' && selectedAnnotation && seitenInfo) {
      let node: Element | null = e.target as Element
      let annotId: string | null = null
      while (node && node !== e.currentTarget) {
        annotId = node.getAttribute('data-annotation-id')
        if (annotId) break
        node = node.parentElement
      }
      if (annotId === selectedAnnotation) {
        const ann = annotationen.find(a => a.id === selectedAnnotation)
        if (ann?.werkzeug === 'text' || ann?.werkzeug === 'freihand') {
          const containerRect = containerRef.current?.getBoundingClientRect()
          if (containerRect) {
            const startRelX = (e.clientX - containerRect.left) / seitenInfo.breite
            const startRelY = (e.clientY - containerRect.top) / seitenInfo.hoehe
            if (ann.werkzeug === 'text') {
              dragRef.current = {
                annotId: selectedAnnotation,
                startRelX,
                startRelY,
                origX: (ann as PDFTextAnnotation).position.x,
                origY: (ann as PDFTextAnnotation).position.y,
              }
            } else {
              // Freihand: Startpunkt merken, Punkte werden beim Drop verschoben
              dragRef.current = {
                annotId: selectedAnnotation,
                startRelX,
                startRelY,
                origX: 0,
                origY: 0,
              }
            }
            e.preventDefault()
            return
          }
        }
      }
    }
    if (readOnly || aktivesWerkzeug !== 'freihand' || !seitenInfo) return
    istZeichnung.current = true
    const rect = zeichenCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / seitenInfo.breite
    const y = (e.clientY - rect.top) / seitenInfo.hoehe
    zeichnungsPfad.current = [{ x, y }]

    const ctx = zeichenCanvasRef.current?.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio
    ctx.beginPath()
    ctx.strokeStyle = aktiveFarbe
    ctx.lineWidth = 2 * dpr
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr)
  }, [readOnly, aktivesWerkzeug, seitenInfo, aktiveFarbe, selectedAnnotation, annotationen])

  const handleDrawMove = useCallback((e: React.PointerEvent) => {
    // Drag: Annotation verschieben (Text oder Freihand)
    if (dragRef.current && seitenInfo) {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const relX = (e.clientX - containerRect.left) / seitenInfo.breite
      const relY = (e.clientY - containerRect.top) / seitenInfo.hoehe
      const dx = relX - dragRef.current.startRelX
      const dy = relY - dragRef.current.startRelY
      const ann = annotationen.find(a => a.id === dragRef.current!.annotId)
      if (ann?.werkzeug === 'freihand') {
        // Freihand: alle Punkte verschieben
        try {
          const punkte = JSON.parse((ann as PDFFreihandAnnotation).zeichnungsDaten) as { x: number; y: number }[]
          // Beim ersten Move die Originalpunkte merken
          if (dragRef.current.origX === 0 && dragRef.current.origY === 0) {
            dragRef.current.origX = punkte[0]?.x ?? 0
            dragRef.current.origY = punkte[0]?.y ?? 0
            // Original-Punkte in einem data-Attribut zwischenspeichern
            containerRef.current?.setAttribute('data-drag-orig-punkte', (ann as PDFFreihandAnnotation).zeichnungsDaten)
          }
          const origPunkteStr = containerRef.current?.getAttribute('data-drag-orig-punkte')
          if (origPunkteStr) {
            const origPunkte = JSON.parse(origPunkteStr) as { x: number; y: number }[]
            const verschoben = origPunkte.map(p => ({ x: p.x + dx, y: p.y + dy }))
            onAnnotationEditieren?.(dragRef.current.annotId, {
              zeichnungsDaten: JSON.stringify(verschoben),
            } as Partial<PDFAnnotation>)
          }
        } catch { /* JSON-Parse-Fehler ignorieren */ }
      } else {
        // Text: Position verschieben
        onAnnotationEditieren?.(dragRef.current.annotId, {
          position: { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy },
        } as Partial<PDFAnnotation>)
      }
      return
    }
    if (!istZeichnung.current || !seitenInfo) return
    const rect = zeichenCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / seitenInfo.breite
    const y = (e.clientY - rect.top) / seitenInfo.hoehe
    zeichnungsPfad.current.push({ x, y })

    const ctx = zeichenCanvasRef.current?.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio
    ctx.lineTo((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr)
    ctx.stroke()
  }, [seitenInfo, onAnnotationEditieren])

  const handleDrawEnd = useCallback(() => {
    // Drag-Ende
    if (dragRef.current) {
      containerRef.current?.removeAttribute('data-drag-orig-punkte')
      dragRef.current = null
      return
    }
    if (!istZeichnung.current || zeichnungsPfad.current.length < 2) {
      istZeichnung.current = false
      return
    }
    istZeichnung.current = false

    const annotation: PDFFreihandAnnotation = {
      id: erzeugeId(), seite: seitenNr, zeitstempel: new Date().toISOString(),
      werkzeug: 'freihand', zeichnungsDaten: JSON.stringify(zeichnungsPfad.current),
      farbe: aktiveFarbe,
    }
    onAnnotationHinzufuegen(annotation)

    // Clear temp drawing canvas
    const ctx = zeichenCanvasRef.current?.getContext('2d')
    if (ctx && zeichenCanvasRef.current) {
      ctx.clearRect(0, 0, zeichenCanvasRef.current.width, zeichenCanvasRef.current.height)
    }
  }, [seitenNr, aktiveFarbe, onAnnotationHinzufuegen])

  // --- Render SVG overlay content ---
  const svgContent = seitenInfo ? renderSVGOverlay(
    annotationen, seitenInfo, textLayerRef.current, zoom, selectedAnnotation
  ) : null

  // Container dimensions
  const breite = seitenInfo?.breite ?? 600
  const hoehe = seitenInfo?.hoehe ?? 800

  // Cursor based on active tool
  const cursor = readOnly ? 'default'
    : aktivesWerkzeug === 'highlighter' || aktivesWerkzeug === 'label' ? 'text'
    : aktivesWerkzeug === 'text' ? 'text'
    : aktivesWerkzeug === 'kommentar' ? 'crosshair'
    : aktivesWerkzeug === 'freihand' ? 'crosshair'
    : aktivesWerkzeug === 'radierer' ? 'pointer'
    : 'default'

  return (
    <div
      ref={containerRef}
      className="relative mx-auto border border-slate-200 dark:border-slate-700 shadow-sm bg-white"
      style={{ width: breite, height: hoehe, cursor, touchAction: readOnly || aktivesWerkzeug === 'auswahl' ? undefined : 'none' }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseUp={handleMouseUp}
      onPointerDown={handleDrawStart}
      onPointerMove={handleDrawMove}
    >
      {/* Layer 1: PDF canvas */}
      <canvas ref={pdfCanvasRef} className="absolute inset-0" />

      {/* Layer 2: Text layer */}
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ mixBlendMode: 'multiply' }}
      >
        {textLayerSpans}
      </div>

      {/* Layer 3: SVG overlay for annotations */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={breite} height={hoehe}
        viewBox={`0 0 ${breite} ${hoehe}`}
      >
        {svgContent}
      </svg>

      {/* Layer 4: Drawing canvas (freehand) */}
      <canvas
        ref={zeichenCanvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: aktivesWerkzeug === 'freihand' ? 'auto' : 'none', touchAction: 'none' }}
        onPointerUp={handleDrawEnd}
      />

      {/* Text-Eingabe-Overlay */}
      {textOverlay.sichtbar && (
        <input
          ref={textInputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={textOverlay.text}
          onChange={(e) => setTextOverlay(prev => ({ ...prev, text: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleTextSave() }
            if (e.key === 'Escape') { e.preventDefault(); setTextOverlay(prev => ({ ...prev, sichtbar: false })) }
            e.stopPropagation()
          }}
          onBlur={() => setTimeout(handleTextSave, 150)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: textOverlay.cssX,
            top: textOverlay.cssY,
            fontSize: `${textGroesse}px`,
            fontFamily: 'sans-serif',
            fontWeight: textFett ? 'bold' : 'normal',
            color: aktiveFarbe,
            background: 'rgba(255,255,255,0.9)',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            padding: '4px 8px',
            minWidth: '120px',
            outline: 'none',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
          placeholder="Text eingeben..."
        />
      )}

      {/* Text-Annotation bearbeiten (Doppelklick) */}
      {editOverlay}

      {/* Löschen-Button für selektierte Text-Annotation */}
      {selectedAnnotation && (() => {
        const ann = annotationen.find(a => a.id === selectedAnnotation && a.werkzeug === 'text') as PDFTextAnnotation | undefined
        if (!ann || !seitenInfo) return null
        const px = ann.position.x * seitenInfo.breite
        const py = ann.position.y * seitenInfo.hoehe
        return (
          <button
            type="button"
            style={{ position: 'absolute', left: px - 8, top: py - (ann.groesse || 18) - 24, zIndex: 25 }}
            className="px-2 py-1 text-xs text-red-600 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-700 rounded shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={(e) => {
              e.stopPropagation()
              onAnnotationLoeschen(ann.id)
              setSelectedAnnotation(null)
            }}
          >
            ✕ Löschen
          </button>
        )
      })()}

      {/* Popover: comment */}
      {kommentarPopover && (
        <PDFKommentarPopover
          position={kommentarPopover}
          onSave={handleKommentarSave}
          onCancel={() => setKommentarPopover(null)}
        />
      )}

      {/* Popover: category chooser */}
      {kategorieChooser && kategorien && (
        <PDFKategorieChooser
          kategorien={kategorien}
          position={{ x: kategorieChooser.x, y: kategorieChooser.y }}
          onSelect={handleKategorieSelect}
          onCancel={() => {
            setKategorieChooser(null)
            window.getSelection()?.removeAllRanges()
          }}
        />
      )}
    </div>
  )
}
