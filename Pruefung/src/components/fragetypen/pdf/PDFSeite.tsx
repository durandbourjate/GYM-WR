import { useRef, useEffect, useState, useCallback } from 'react'
import type {
  PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFKategorie,
  PDFToolbarWerkzeug, PDFTextRange,
} from './PDFTypes.ts'
import type { PDFSeitenInfo, PDFTextItem, ZoomStufe } from './PDFTypes.ts'
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
    const eo = so + content.length
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
  kategorien, aktiveKategorieId, onAnnotationHinzufuegen, onAnnotationLoeschen, readOnly,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const zeichenCanvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const [seitenInfo, setSeitenInfo] = useState<PDFSeitenInfo | null>(null)

  // Popover state
  const [kommentarPopover, setKommentarPopover] = useState<{ x: number; y: number } | null>(null)
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
      const target = e.target as HTMLElement
      const annotId = target.closest('[data-annotation-id]')?.getAttribute('data-annotation-id')
      if (annotId) onAnnotationLoeschen(annotId)
      return
    }

    if (aktivesWerkzeug !== 'kommentar' || !seitenInfo) return
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
  }, [readOnly, aktivesWerkzeug, seitenInfo, onAnnotationLoeschen])

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

  // --- Freehand drawing ---
  const handleDrawStart = useCallback((e: React.MouseEvent) => {
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
  }, [readOnly, aktivesWerkzeug, seitenInfo, aktiveFarbe])

  const handleDrawMove = useCallback((e: React.MouseEvent) => {
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
  }, [seitenInfo])

  const handleDrawEnd = useCallback(() => {
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
    annotationen, seitenInfo, textLayerRef.current, zoom
  ) : null

  // Container dimensions
  const breite = seitenInfo?.breite ?? 600
  const hoehe = seitenInfo?.hoehe ?? 800

  // Cursor based on active tool
  const cursor = readOnly ? 'default'
    : aktivesWerkzeug === 'highlighter' || aktivesWerkzeug === 'label' ? 'text'
    : aktivesWerkzeug === 'kommentar' ? 'crosshair'
    : aktivesWerkzeug === 'freihand' ? 'crosshair'
    : aktivesWerkzeug === 'radierer' ? 'pointer'
    : 'default'

  return (
    <div
      ref={containerRef}
      className="relative mx-auto border border-slate-200 dark:border-slate-700 shadow-sm bg-white"
      style={{ width: breite, height: hoehe, cursor }}
      onClick={handleClick}
      onMouseUp={handleMouseUp}
      onMouseDown={handleDrawStart}
      onMouseMove={handleDrawMove}
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
        style={{ pointerEvents: aktivesWerkzeug === 'freihand' ? 'auto' : 'none' }}
        onMouseUp={handleDrawEnd}
      />

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
        elements.push(renderFreihand(ann, seitenInfo))
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

  return (
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
