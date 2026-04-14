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

export const ZOOM_STUFEN = [0.75, 1, 1.25, 1.5, 2, 3] as const
export type ZoomStufe = typeof ZOOM_STUFEN[number]

export const STANDARD_HIGHLIGHT_FARBEN = [
  '#FEF08A', // Gelb Pastell (Default für Markieren)
  '#FBCFE8', // Rosa Pastell
  '#BAE6FD', // Hellblau Pastell
  '#BBF7D0', // Hellgrün Pastell
  '#000000', // Schwarz
  '#DC2626', // Rot kräftig
  '#2563EB', // Blau kräftig
  '#16A34A', // Grün kräftig
  '#F59E0B', // Orange/Amber
] as const
