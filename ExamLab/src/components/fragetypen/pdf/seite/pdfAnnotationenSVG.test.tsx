// ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { renderSVGOverlay } from './pdfAnnotationenSVG.tsx'
import type {
  PDFSeitenInfo,
  PDFKommentarAnnotation, PDFFreihandAnnotation, PDFTextAnnotation,
  PDFHighlightAnnotation, PDFLabelAnnotation,
} from '../PDFTypes.ts'

const seitenInfo: PDFSeitenInfo = {
  breite: 600, hoehe: 800,
  textItems: [
    { str: 'hello', startOffset: 0, endOffset: 5, transform: [1, 0, 0, 12, 50, 700] },
  ],
}

function renderSvg(nodes: React.ReactNode[]) {
  return render(<svg width={600} height={800}>{nodes}</svg>)
}

describe('renderSVGOverlay', () => {
  it('rendert nichts bei leeren Annotationen', () => {
    const { container } = renderSvg(renderSVGOverlay([], seitenInfo, null, 1))
    expect(container.querySelectorAll('[data-annotation-id]')).toHaveLength(0)
  })
})

describe('Highlight-Renderer', () => {
  const ann: PDFHighlightAnnotation = {
    id: 'h1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'highlighter',
    textRange: { startOffset: 0, endOffset: 5, text: 'hello' }, farbe: '#FEF08A',
  }
  it('rendert via Fallback-Rects wenn textLayer null ist', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1))
    const rect = container.querySelector('[data-annotation-id="h1"]')
    expect(rect).toBeTruthy()
    expect(rect?.getAttribute('fill')).toBe('#FEF08A')
  })
})

describe('Label-Renderer', () => {
  const ann: PDFLabelAnnotation = {
    id: 'l1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'label',
    textRange: { startOffset: 0, endOffset: 5, text: 'hello' },
    kategorieId: 'kategorie-uuid', farbe: '#3b82f6',
  }
  it('rendert Rect + Badge mit Kategorie-ID-Slice', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1))
    expect(container.querySelectorAll('[data-annotation-id="l1"]').length).toBeGreaterThan(0)
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('kategori') // 8-char-slice
  })
})

describe('Kommentar-Renderer', () => {
  const ann: PDFKommentarAnnotation = {
    id: 'k1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'kommentar',
    position: { x: 0.5, y: 0.5 }, kommentarText: 'Hi',
  }
  it('rendert circle + text bei position', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1))
    const g = container.querySelector('[data-annotation-id="k1"]')
    expect(g?.querySelector('circle')).toBeTruthy()
    expect(g?.querySelector('text')?.textContent).toBe('💬')
  })
})

describe('Freihand-Renderer', () => {
  const ann: PDFFreihandAnnotation = {
    id: 'f1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'freihand',
    zeichnungsDaten: JSON.stringify([{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }]),
    farbe: '#000',
  }
  it('rendert path mit M+L Commands', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1))
    const path = container.querySelector('path[data-annotation-id="f1"]')
    expect(path?.getAttribute('d')).toMatch(/^M\d+,\d+ L\d+,\d+/)
  })
  it('rendert Bounding-Box bei selected=true', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1, 'f1'))
    const dashedRect = container.querySelector('rect[stroke-dasharray="4,2"]')
    expect(dashedRect).toBeTruthy()
  })
})

describe('Text-Annotation-Renderer', () => {
  const ann: PDFTextAnnotation = {
    id: 't1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'text',
    position: { x: 0.5, y: 0.5 }, text: 'Notiz', farbe: '#000',
    groesse: 18, fett: false,
  }
  it('rendert text-Element mit korrektem fontSize', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1))
    const text = container.querySelector('text[data-annotation-id="t1"]')
    expect(text?.getAttribute('font-size')).toBe('18')
    expect(text?.textContent).toBe('Notiz')
  })
  it('rendert Selektions-Rahmen bei selected=true', () => {
    const { container } = renderSvg(renderSVGOverlay([ann], seitenInfo, null, 1, 't1'))
    const dashedRect = container.querySelector('rect[stroke-dasharray="4,2"]')
    expect(dashedRect).toBeTruthy()
  })
})
