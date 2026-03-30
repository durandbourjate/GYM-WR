import { useState, useCallback, useRef, useEffect } from 'react'
import type { PDFRenderState, PDFSeitenInfo, PDFTextItem } from './PDFTypes.ts'

type PDFjsLib = typeof import('pdfjs-dist')
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy
type TextItem = import('pdfjs-dist/types/src/display/api').TextItem

let pdfjsLib: PDFjsLib | null = null

async function ladePDFjs(): Promise<PDFjsLib> {
  if (pdfjsLib) return pdfjsLib
  const lib = await import('pdfjs-dist')
  const workerSrc = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  lib.GlobalWorkerOptions.workerSrc = workerSrc.default
  pdfjsLib = lib
  return lib
}

export function usePDFRenderer() {
  const [state, setState] = useState<PDFRenderState>({ status: 'idle', seitenAnzahl: 0 })
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const seitenInfoCache = useRef<Map<number, PDFSeitenInfo>>(new Map())
  // Laufende Render-Tasks pro Canvas tracken, um Race Conditions zu vermeiden
  const renderTasksRef = useRef<WeakMap<HTMLCanvasElement, { cancel: () => void }>>(new WeakMap())

  const ladePDF = useCallback(async (quelle: { base64?: string; url?: string }) => {
    setState({ status: 'loading', seitenAnzahl: 0 })
    try {
      const lib = await ladePDFjs()
      const daten = quelle.base64
        ? Uint8Array.from(atob(quelle.base64), c => c.charCodeAt(0))
        : undefined
      const doc = await lib.getDocument(daten ? { data: daten } : { url: quelle.url! }).promise
      docRef.current = doc
      seitenInfoCache.current.clear()
      setState({ status: 'ready', seitenAnzahl: doc.numPages })
    } catch (e) {
      setState({ status: 'error', seitenAnzahl: 0, fehler: String(e) })
      // Re-throw damit die Fallback-Kette in PDFFrage weitergeht
      throw e
    }
  }, [])

  const rendereSeite = useCallback(async (
    seitenNr: number,
    canvas: HTMLCanvasElement,
    zoom: number,
  ): Promise<PDFSeitenInfo | null> => {
    const doc = docRef.current
    if (!doc) return null

    // Defensiv: Zoom auf gültigen Bereich begrenzen (verhindert Spiegelung durch negative/extreme Werte)
    const safeZoom = Math.max(0.25, Math.min(3, zoom))
    const page = await doc.getPage(seitenNr + 1)
    const viewport = page.getViewport({ scale: safeZoom * window.devicePixelRatio })

    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`
    canvas.style.height = `${viewport.height / window.devicePixelRatio}px`

    const ctx = canvas.getContext('2d')!
    // Vorherigen Render-Task auf diesem Canvas abbrechen (verhindert "Cannot use the same canvas" Error)
    const vorherigerTask = renderTasksRef.current.get(canvas)
    if (vorherigerTask) {
      vorherigerTask.cancel()
    }
    const renderTask = page.render({ canvasContext: ctx, viewport, canvas })
    renderTasksRef.current.set(canvas, renderTask)
    try {
      await renderTask.promise
    } catch (e: unknown) {
      // RenderingCancelled ist erwartet wenn ein neuer Render gestartet wurde
      if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'RenderingCancelledException') return null
      throw e
    } finally {
      // Nur aufräumen wenn dies noch der aktuelle Task ist
      if (renderTasksRef.current.get(canvas) === renderTask) {
        renderTasksRef.current.delete(canvas)
      }
    }

    const textContent = await page.getTextContent()
    let offset = 0
    const textItems: PDFTextItem[] = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => {
        const ti: PDFTextItem = {
          str: item.str,
          startOffset: offset,
          endOffset: offset + item.str.length,
          transform: item.transform,
        }
        offset += item.str.length
        return ti
      })

    const info: PDFSeitenInfo = {
      breite: viewport.width / window.devicePixelRatio,
      hoehe: viewport.height / window.devicePixelRatio,
      textItems,
    }
    seitenInfoCache.current.set(seitenNr, info)
    return info
  }, [])

  const holeSeitenInfo = useCallback((seitenNr: number) => {
    return seitenInfoCache.current.get(seitenNr) ?? null
  }, [])

  useEffect(() => {
    return () => {
      docRef.current?.destroy()
      docRef.current = null
    }
  }, [])

  return { state, ladePDF, rendereSeite, holeSeitenInfo }
}
