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

// --- Helpers ---

function erzeugeId(): string {
  return crypto.randomUUID()
}

/** Get bounding rects of text-layer spans that overlap an offset range */
function findeSpanRects(
  container: HTMLDivElement,
  startOffset: number,
  endOffset: number,
): DOMRect[] {
  const spans = container.querySelectorAll<HTMLSpanElement>('span[data-offset]')
  const rects: DOMRect[] = []
  for (const span of spans) {
    const so = Number(span.dataset.offset)
    const eo = so + (span.textContent?.length ?? 0)
    if (eo <= startOffset || so >= endOffset) continue
    rects.push(span.getBoundingClientRect())
  }
  return rects
}

/** Read selection offsets from text-layer spans */
function leseTextauswahl(container: HTMLDivElement): PDFTextRange | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null

  const range = sel.getRangeAt(0)
  // Walk through the range to find start/end offsets
  const spans = container.querySelectorAll<HTMLSpanElement>('span[data-offset]')
  let startOffset = -1
  let endOffset = -1
  let text = ''

  for (const span of spans) {
    const so = Number(span.dataset.offset)
    const content = span.textContent ?? ''
    if (!range.intersectsNode(span)) continue

    // Compute overlap within this span
    let localStart = 0
    let localEnd = content.length
    if (span.contains(range.startContainer) || range.startContainer === span) {
      localStart = range.startContainer === span
        ? range.startOffset
        : range.startOffset
    }
    if (span.contains(range.endContainer) || range.endContainer === span) {
      localEnd = range.endContainer === span
        ? range.endOffset
        : range.endOffset
    }

    const spanStart = so + localStart
    const spanEnd = so + localEnd
    if (startOffset === -1) startOffset = spanStart
    endOffset = spanEnd
    text += content.slice(localStart, localEnd)
  }

  if (startOffset === -1 || endOffset === -1 || startOffset >= endOffset) return null
  return { startOffset, endOffset, text }
}

// --- Component ---

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
  // Edit state for existing text annotations (double-click to edit)
  const [editierendeAnnotation, setEditierendeAnnotation] = useState<{
    id: string; text: string; cssX: number; cssY: number; farbe: string; groesse: number
  } | null>(null)
  const textEditInputRef = useRef<HTMLInputElement>(null)
  const [kategorieChooser, setKategorieChooser] = useState<{
    x: number; y: number; textRange: PDFTextRange
  } | null>(null)

  // Freehand drawing state
  const istZeichnung = useRef(false)
  const zeichnungsPfad = useRef<{ x: number; y: number }[]>([])

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
      if (editierendeAnnotation) {
        setEditierendeAnnotation(null)
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
  }, [readOnly, aktivesWerkzeug, seitenInfo, onAnnotationLoeschen, editierendeAnnotation, selectedAnnotation])

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

  // --- Doppelklick: Text-Annotation editieren ---
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (readOnly || !onAnnotationEditieren || !seitenInfo) return
    // closest() kann bei SVG-Elementen browserübergreifend unzuverlässig sein,
    // daher manuell das DOM hoch traversieren (SVG → HTML Grenze beachten)
    let node: Element | null = e.target as Element
    let annotId: string | null = null
    while (node && node !== e.currentTarget) {
      annotId = node.getAttribute('data-annotation-id')
      if (annotId) break
      node = node.parentElement
    }
    if (!annotId) return

    const ann = annotationen.find(a => a.id === annotId)
    if (!ann || ann.werkzeug !== 'text') return

    e.stopPropagation()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const cssX = ann.position.x * seitenInfo.breite
    const cssY = ann.position.y * seitenInfo.hoehe

    setEditierendeAnnotation({
      id: ann.id,
      text: ann.text,
      cssX,
      cssY,
      farbe: ann.farbe,
      groesse: ann.groesse || 18,
    })
    setTimeout(() => textEditInputRef.current?.focus(), 30)
  }, [readOnly, onAnnotationEditieren, seitenInfo, annotationen])

  const handleTextEditSave = useCallback(() => {
    if (!editierendeAnnotation || !onAnnotationEditieren) return
    const text = editierendeAnnotation.text.trim()
    if (text) {
      onAnnotationEditieren(editierendeAnnotation.id, { text })
    }
    setEditierendeAnnotation(null)
  }, [editierendeAnnotation, onAnnotationEditieren])

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
      {editierendeAnnotation && (
        <input
          ref={textEditInputRef}
          type="text"
          inputMode="text"
          autoComplete="off"
          value={editierendeAnnotation.text}
          onChange={(e) => setEditierendeAnnotation(prev => prev ? { ...prev, text: e.target.value } : null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextEditSave() }
            if (e.key === 'Escape') { e.preventDefault(); setEditierendeAnnotation(null) }
            e.stopPropagation()
          }}
          onBlur={() => setTimeout(handleTextEditSave, 150)}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: editierendeAnnotation.cssX,
            top: editierendeAnnotation.cssY - editierendeAnnotation.groesse,
            fontSize: `${editierendeAnnotation.groesse}px`,
            fontFamily: 'sans-serif',
            color: editierendeAnnotation.farbe,
            background: 'rgba(255,255,255,0.9)',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            padding: '2px 6px',
            minWidth: '120px',
            outline: 'none',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
      )}

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

// --- SVG overlay rendering ---

function renderSVGOverlay(
  annotationen: PDFAnnotation[],
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  zoom: ZoomStufe,
  selectedAnnotationId?: string | null,
): React.ReactNode[] {
  const elements: React.ReactNode[] = []

  for (const ann of annotationen) {
    switch (ann.werkzeug) {
      case 'highlighter':
        elements.push(...renderHighlight(ann, seitenInfo, textLayer, zoom))
        break
      case 'label':
        elements.push(...renderLabel(ann, seitenInfo, textLayer, zoom))
        break
      case 'kommentar':
        elements.push(renderKommentarMarker(ann, seitenInfo))
        break
      case 'freihand':
        elements.push(renderFreihand(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
      case 'text':
        elements.push(renderTextAnnotation(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
    }
  }

  return elements
}

function renderHighlight(
  ann: PDFHighlightAnnotation,
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  _zoom: ZoomStufe,
): React.ReactNode[] {
  // Use text items to compute approximate rects if no DOM available
  const rects = textLayer
    ? findeSpanRectsRelativ(textLayer, ann.textRange.startOffset, ann.textRange.endOffset,
        seitenInfo.breite, seitenInfo.hoehe)
    : berechneFallbackRects(ann.textRange, seitenInfo)

  return rects.map((r, i) => (
    <rect
      key={`hl-${ann.id}-${i}`}
      data-annotation-id={ann.id}
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill={ann.farbe} fillOpacity={0.35}
      className="pointer-events-auto cursor-pointer"
    />
  ))
}

function renderLabel(
  ann: PDFLabelAnnotation,
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  _zoom: ZoomStufe,
): React.ReactNode[] {
  const rects = textLayer
    ? findeSpanRectsRelativ(textLayer, ann.textRange.startOffset, ann.textRange.endOffset,
        seitenInfo.breite, seitenInfo.hoehe)
    : berechneFallbackRects(ann.textRange, seitenInfo)

  const nodes: React.ReactNode[] = rects.map((r, i) => (
    <rect
      key={`lbl-${ann.id}-${i}`}
      data-annotation-id={ann.id}
      x={r.x} y={r.y} width={r.w} height={r.h}
      fill={ann.farbe} fillOpacity={0.25}
      stroke={ann.farbe} strokeWidth={1}
      className="pointer-events-auto cursor-pointer"
    />
  ))

  // Add a small badge at the start of the first rect
  if (rects.length > 0) {
    const first = rects[0]
    nodes.push(
      <g key={`lbl-badge-${ann.id}`} data-annotation-id={ann.id}
        className="pointer-events-auto cursor-pointer">
        <rect x={first.x} y={first.y - 14} width={50} height={14}
          rx={3} fill={ann.farbe} />
        <text x={first.x + 4} y={first.y - 3}
          fontSize={9} fill="white" fontWeight="bold">
          {ann.kategorieId.slice(0, 8)}
        </text>
      </g>
    )
  }

  return nodes
}

function renderKommentarMarker(
  ann: PDFKommentarAnnotation,
  seitenInfo: PDFSeitenInfo,
): React.ReactNode {
  const cx = ann.position.x * seitenInfo.breite
  const cy = ann.position.y * seitenInfo.hoehe
  return (
    <g key={`kom-${ann.id}`} data-annotation-id={ann.id}
      className="pointer-events-auto cursor-pointer">
      <circle cx={cx} cy={cy} r={8} fill="#3b82f6" fillOpacity={0.8} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fill="white">
        💬
      </text>
    </g>
  )
}

function renderFreihand(
  ann: PDFFreihandAnnotation,
  seitenInfo: PDFSeitenInfo,
  selected = false,
): React.ReactNode {
  let punkte: { x: number; y: number }[]
  try {
    punkte = JSON.parse(ann.zeichnungsDaten)
  } catch {
    return null
  }
  if (punkte.length < 2) return null

  const d = punkte
    .map((p, i) => {
      const px = p.x * seitenInfo.breite
      const py = p.y * seitenInfo.hoehe
      return i === 0 ? `M${px},${py}` : `L${px},${py}`
    })
    .join(' ')

  // Bounding Box für Selection-Rahmen
  const nodes: React.ReactNode[] = []

  if (selected) {
    const xs = punkte.map(p => p.x * seitenInfo.breite)
    const ys = punkte.map(p => p.y * seitenInfo.hoehe)
    const minX = Math.min(...xs) - 4
    const minY = Math.min(...ys) - 4
    const maxX = Math.max(...xs) + 4
    const maxY = Math.max(...ys) + 4
    nodes.push(
      <rect
        key={`fh-sel-${ann.id}`}
        x={minX} y={minY} width={maxX - minX} height={maxY - minY}
        fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4,2" rx={3}
        className="pointer-events-none"
      />
    )
  }

  nodes.push(
    <path
      key={`fh-${ann.id}`}
      data-annotation-id={ann.id}
      d={d}
      fill="none"
      stroke={ann.farbe}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-auto cursor-pointer"
    />
  )

  return <g key={`fh-g-${ann.id}`}>{nodes}</g>
}

function renderTextAnnotation(
  ann: PDFTextAnnotation,
  seitenInfo: PDFSeitenInfo,
  selected = false,
): React.ReactNode {
  const px = ann.position.x * seitenInfo.breite
  const py = ann.position.y * seitenInfo.hoehe
  const fontSize = ann.groesse || 18

  return (
    <g key={`txt-${ann.id}`} data-annotation-id={ann.id}>
      {/* Selektions-Rahmen */}
      {selected && (
        <rect
          x={px - 4}
          y={py - fontSize - 2}
          width={fontSize * 0.6 * ann.text.length + 8}
          height={fontSize + 6}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4,2"
          rx={3}
          transform={ann.rotation ? `rotate(${ann.rotation}, ${px}, ${py})` : undefined}
        />
      )}
      <text
        data-annotation-id={ann.id}
        x={px}
        y={py}
        fill={ann.farbe}
        fontSize={fontSize}
        fontFamily="sans-serif"
        fontWeight={ann.fett ? 'bold' : 'normal'}
        className="pointer-events-auto cursor-pointer"
        style={{ userSelect: 'none' }}
        transform={ann.rotation ? `rotate(${ann.rotation}, ${px}, ${py})` : undefined}
      >
        {ann.text}
      </text>
    </g>
  )
}

// --- Rect helpers ---

interface SimpleRect { x: number; y: number; w: number; h: number }

/** Get span rects relative to container, using DOM measurements */
function findeSpanRectsRelativ(
  container: HTMLDivElement,
  startOffset: number,
  endOffset: number,
  _containerBreite: number,
  _containerHoehe: number,
): SimpleRect[] {
  const containerRect = container.getBoundingClientRect()
  const domRects = findeSpanRects(container, startOffset, endOffset)
  return domRects.map(r => ({
    x: r.left - containerRect.left,
    y: r.top - containerRect.top,
    w: r.width,
    h: r.height,
  }))
}

/** Fallback: approximate rects from text item transforms when DOM not available */
function berechneFallbackRects(
  textRange: PDFTextRange,
  seitenInfo: PDFSeitenInfo,
): SimpleRect[] {
  const rects: SimpleRect[] = []
  for (const item of seitenInfo.textItems) {
    if (item.endOffset <= textRange.startOffset || item.startOffset >= textRange.endOffset) continue
    const fontSize = Math.abs(item.transform[3])
    const x = item.transform[4]
    const y = seitenInfo.hoehe - item.transform[5]
    rects.push({ x, y: y - fontSize, w: item.str.length * fontSize * 0.6, h: fontSize })
  }
  return rects
}
