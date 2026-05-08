// ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts
import { useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import type {
  PDFAnnotation, PDFFreihandAnnotation, PDFTextAnnotation, PDFSeitenInfo,
  PDFToolbarWerkzeug,
} from '../PDFTypes.ts'
import { erzeugeId } from './pdfSelection.ts'

interface UsePDFDrawingParams {
  readOnly: boolean | undefined
  aktivesWerkzeug: PDFToolbarWerkzeug
  seitenNr: number
  aktiveFarbe: string
  seitenInfo: PDFSeitenInfo | null
  annotationen: PDFAnnotation[]
  selectedAnnotation: string | null
  containerRef: RefObject<HTMLDivElement | null>
  zeichenCanvasRef: RefObject<HTMLCanvasElement | null>
  onAnnotationHinzufuegen: (a: PDFAnnotation) => void
  onAnnotationEditieren: ((id: string, updates: Partial<PDFAnnotation>) => void) | undefined
}

interface UsePDFDrawingResult {
  handleDrawStart: (e: React.PointerEvent) => void
  handleDrawMove: (e: React.PointerEvent) => void
  handleDrawEnd: () => void
}

export function usePDFDrawing(params: UsePDFDrawingParams): UsePDFDrawingResult {
  const {
    readOnly, aktivesWerkzeug, seitenNr, aktiveFarbe, seitenInfo,
    annotationen, selectedAnnotation, containerRef, zeichenCanvasRef,
    onAnnotationHinzufuegen, onAnnotationEditieren,
  } = params

  // Drag-State
  const dragRef = useRef<{ annotId: string; startRelX: number; startRelY: number; origX: number; origY: number } | null>(null)
  // Freehand drawing state
  const istZeichnung = useRef(false)
  const zeichnungsPfad = useRef<{ x: number; y: number }[]>([])

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
  }, [readOnly, aktivesWerkzeug, seitenInfo, aktiveFarbe, selectedAnnotation, annotationen, containerRef, zeichenCanvasRef])

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
  }, [seitenInfo, onAnnotationEditieren, annotationen, containerRef, zeichenCanvasRef])

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
  }, [seitenNr, aktiveFarbe, onAnnotationHinzufuegen, containerRef, zeichenCanvasRef])

  return { handleDrawStart, handleDrawMove, handleDrawEnd }
}
