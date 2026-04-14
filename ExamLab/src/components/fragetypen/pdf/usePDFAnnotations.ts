import { useState, useCallback } from 'react'
import type { PDFAnnotation } from './PDFTypes.ts'

interface UndoEintrag {
  typ: 'hinzufuegen' | 'loeschen' | 'editieren'
  annotation: PDFAnnotation
  vorher?: PDFAnnotation
}

const MAX_UNDO = 50

export function usePDFAnnotations(initialAnnotationen?: PDFAnnotation[]) {
  const [annotationen, setAnnotationen] = useState<PDFAnnotation[]>(initialAnnotationen ?? [])
  const [undoStack, setUndoStack] = useState<UndoEintrag[]>([])
  const [redoStack, setRedoStack] = useState<UndoEintrag[]>([])

  const pushUndo = useCallback((eintrag: UndoEintrag) => {
    setUndoStack(prev => {
      const next = [...prev, eintrag]
      return next.length > MAX_UNDO ? next.slice(1) : next
    })
    setRedoStack([])
  }, [])

  const hinzufuegen = useCallback((annotation: PDFAnnotation) => {
    setAnnotationen(prev => [...prev, annotation])
    pushUndo({ typ: 'hinzufuegen', annotation })
  }, [pushUndo])

  const loeschen = useCallback((id: string) => {
    let geloescht: PDFAnnotation | undefined
    setAnnotationen(prev => {
      geloescht = prev.find(a => a.id === id)
      return prev.filter(a => a.id !== id)
    })
    if (geloescht) pushUndo({ typ: 'loeschen', annotation: geloescht })
  }, [pushUndo])

  const editieren = useCallback((id: string, updates: Partial<PDFAnnotation>) => {
    let vorher: PDFAnnotation | undefined
    setAnnotationen(prev => prev.map(a => {
      if (a.id !== id) return a
      vorher = a
      return { ...a, ...updates } as PDFAnnotation
    }))
    if (vorher) {
      pushUndo({ typ: 'editieren', annotation: { ...vorher, ...updates } as PDFAnnotation, vorher })
    }
  }, [pushUndo])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const eintrag = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      setRedoStack(r => [...r, eintrag])

      switch (eintrag.typ) {
        case 'hinzufuegen':
          setAnnotationen(a => a.filter(x => x.id !== eintrag.annotation.id))
          break
        case 'loeschen':
          setAnnotationen(a => [...a, eintrag.annotation])
          break
        case 'editieren':
          if (eintrag.vorher) {
            setAnnotationen(a => a.map(x => x.id === eintrag.vorher!.id ? eintrag.vorher! : x))
          }
          break
      }
      return rest
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const eintrag = prev[prev.length - 1]
      const rest = prev.slice(0, -1)

      setUndoStack(u => [...u, eintrag])

      switch (eintrag.typ) {
        case 'hinzufuegen':
          setAnnotationen(a => [...a, eintrag.annotation])
          break
        case 'loeschen':
          setAnnotationen(a => a.filter(x => x.id !== eintrag.annotation.id))
          break
        case 'editieren':
          setAnnotationen(a => a.map(x => x.id === eintrag.annotation.id ? eintrag.annotation : x))
          break
      }
      return rest
    })
  }, [])

  const allesLoeschen = useCallback(() => {
    // Leeren und Undo/Redo zurücksetzen (nicht einzeln undo-fähig)
    setAnnotationen([])
    setUndoStack([])
    setRedoStack([])
  }, [])

  const kannUndo = undoStack.length > 0
  const kannRedo = redoStack.length > 0

  const fuerSeite = useCallback((seitenNr: number) => {
    return annotationen.filter(a => a.seite === seitenNr)
  }, [annotationen])

  return {
    annotationen, setAnnotationen,
    hinzufuegen, loeschen, editieren,
    allesLoeschen,
    undo, redo, kannUndo, kannRedo,
    fuerSeite,
  }
}
