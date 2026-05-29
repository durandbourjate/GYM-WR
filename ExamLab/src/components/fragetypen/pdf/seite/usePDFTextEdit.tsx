// ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx
import { useState, useCallback, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { PDFAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'
// PDFTextAnnotation-Import nicht nötig — Discriminated-Union narrow nach werkzeug-Filter.

interface UsePDFTextEditParams {
  readOnly: boolean | undefined
  seitenInfo: PDFSeitenInfo | null
  annotationen: PDFAnnotation[]
  containerRef: RefObject<HTMLDivElement | null>
  onAnnotationEditieren: ((id: string, updates: Partial<PDFAnnotation>) => void) | undefined
}

interface UsePDFTextEditResult {
  istEditierend: boolean
  handleDoubleClick: (e: React.MouseEvent) => void
  beendeEdit: () => void
  editOverlay: ReactNode
}

export function usePDFTextEdit(params: UsePDFTextEditParams): UsePDFTextEditResult {
  const { readOnly, seitenInfo, annotationen, containerRef, onAnnotationEditieren } = params

  const [editierendeAnnotation, setEditierendeAnnotation] = useState<{
    id: string; text: string; cssX: number; cssY: number; farbe: string; groesse: number
  } | null>(null)
  const textEditInputRef = useRef<HTMLInputElement>(null)

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (readOnly || !onAnnotationEditieren || !seitenInfo) return
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

    // Nach `ann.werkzeug !== 'text'`-Filter narrowed TypeScript zu PDFTextAnnotation (Discriminated-Union).
    // Byte-identisch zu Original — keine Casts.
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
  }, [readOnly, onAnnotationEditieren, seitenInfo, annotationen, containerRef])

  const handleTextEditSave = useCallback(() => {
    if (!editierendeAnnotation || !onAnnotationEditieren) return
    const text = editierendeAnnotation.text.trim()
    if (text) {
      onAnnotationEditieren(editierendeAnnotation.id, { text })
    }
    setEditierendeAnnotation(null)
  }, [editierendeAnnotation, onAnnotationEditieren])

  const beendeEdit = useCallback(() => {
    if (editierendeAnnotation) {
      setEditierendeAnnotation(null)
    }
  }, [editierendeAnnotation])

  const editOverlay = editierendeAnnotation ? (
    <input
      ref={textEditInputRef}
      type="text"
      inputMode="text"
      autoComplete="off"
      aria-label="Text-Anmerkung bearbeiten"
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
  ) : null

  return {
    istEditierend: editierendeAnnotation !== null,
    handleDoubleClick,
    beendeEdit,
    editOverlay,
  }
}
