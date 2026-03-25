// Re-export shared types from canonical location
export type {
  PDFFrage, PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFTextAnnotation, PDFKategorie,
  PDFAnnotationsWerkzeug, PDFToolbarWerkzeug, PDFTextRange,
} from '../../../types/fragen.ts'

// Component-local types
export interface PDFRenderState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  seitenAnzahl: number
  fehler?: string
}

export interface PDFSeitenInfo {
  breite: number
  hoehe: number
  textItems: PDFTextItem[]
}

export interface PDFTextItem {
  str: string
  startOffset: number
  endOffset: number
  transform: number[]
}

export const ZOOM_STUFEN = [0.75, 1, 1.25, 1.5] as const
export type ZoomStufe = typeof ZOOM_STUFEN[number]

export const STANDARD_HIGHLIGHT_FARBEN = [
  '#fde047', '#86efac', '#93c5fd', '#fca5a5',
  '#c4b5fd', '#fdba74', '#67e8f9', '#f9a8d4',
] as const
