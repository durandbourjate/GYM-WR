// ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  erzeugeId, findeSpanRects, leseTextauswahl,
  findeSpanRectsRelativ, berechneFallbackRects,
} from './pdfSelection.ts'
import type { PDFTextRange, PDFSeitenInfo } from '../PDFTypes.ts'

describe('erzeugeId', () => {
  it('liefert UUID-Format', () => {
    const id = erzeugeId()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })
})

describe('findeSpanRects', () => {
  function setupContainer(spans: { offset: number; text: string }[]): HTMLDivElement {
    const container = document.createElement('div')
    spans.forEach(({ offset, text }) => {
      const span = document.createElement('span')
      span.dataset.offset = String(offset)
      span.textContent = text
      // Mock getBoundingClientRect mit deterministischen Werten:
      Object.defineProperty(span, 'getBoundingClientRect', {
        value: () => ({ left: offset * 10, top: 0, width: text.length * 10, height: 16, right: 0, bottom: 0, x: 0, y: 0, toJSON() { return {} } }),
      })
      container.appendChild(span)
    })
    document.body.appendChild(container)
    return container
  }

  it('liefert nur überlappende Spans', () => {
    const container = setupContainer([
      { offset: 0, text: 'foo' },   // 0-3
      { offset: 3, text: 'bar' },   // 3-6
      { offset: 6, text: 'baz' },   // 6-9
    ])
    const rects = findeSpanRects(container, 2, 7)
    expect(rects).toHaveLength(3) // foo (0-3 overlaps 2-7), bar (3-6 fully inside), baz (6-9 overlaps)
  })

  it('liefert leeres Array bei Out-of-Bounds', () => {
    const container = setupContainer([{ offset: 0, text: 'foo' }])
    const rects = findeSpanRects(container, 100, 200)
    expect(rects).toHaveLength(0)
  })
})

describe('leseTextauswahl', () => {
  beforeEach(() => {
    // Reset selection
    const sel = window.getSelection()
    sel?.removeAllRanges()
  })

  it('liefert null bei collapsed selection', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    expect(leseTextauswahl(container)).toBeNull()
  })

  it('liefert null wenn keine getSelection', () => {
    const container = document.createElement('div')
    const orig = window.getSelection
    window.getSelection = () => null
    expect(leseTextauswahl(container)).toBeNull()
    window.getSelection = orig
  })

  // Note: Vollständiger Selection-Test mit Range nicht zuverlässig in jsdom
  // → Browser-E2E deckt End-to-End-Pfad ab.
})

describe('findeSpanRectsRelativ', () => {
  it('liefert relative Positionen zu Container', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 100, top: 50, width: 600, height: 800, right: 0, bottom: 0, x: 0, y: 0, toJSON() { return {} } }),
    })
    const span = document.createElement('span')
    span.dataset.offset = '0'
    span.textContent = 'hi'
    Object.defineProperty(span, 'getBoundingClientRect', {
      value: () => ({ left: 110, top: 60, width: 20, height: 16, right: 0, bottom: 0, x: 0, y: 0, toJSON() { return {} } }),
    })
    container.appendChild(span)
    document.body.appendChild(container)
    const rects = findeSpanRectsRelativ(container, 0, 2, 600, 800)
    expect(rects).toEqual([{ x: 10, y: 10, w: 20, h: 16 }])
  })

  it('liefert leeres Array bei keinen überlappenden Spans', () => {
    const container = document.createElement('div')
    Object.defineProperty(container, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 100, right: 0, bottom: 0, x: 0, y: 0, toJSON() { return {} } }),
    })
    document.body.appendChild(container)
    expect(findeSpanRectsRelativ(container, 0, 5, 100, 100)).toEqual([])
  })
})

describe('berechneFallbackRects', () => {
  const seitenInfo: PDFSeitenInfo = {
    breite: 600,
    hoehe: 800,
    textItems: [
      { str: 'hello', startOffset: 0, endOffset: 5, transform: [1, 0, 0, 12, 50, 700] },
      { str: 'world', startOffset: 5, endOffset: 10, transform: [1, 0, 0, 12, 50, 680] },
      { str: 'far', startOffset: 100, endOffset: 103, transform: [1, 0, 0, 12, 50, 660] },
    ],
  }

  it('liefert Rect für Text in Range', () => {
    const range: PDFTextRange = { startOffset: 0, endOffset: 5, text: 'hello' }
    const rects = berechneFallbackRects(range, seitenInfo)
    expect(rects).toHaveLength(1)
    expect(rects[0]).toMatchObject({ x: 50, w: 5 * 12 * 0.6, h: 12 })
    expect(rects[0].y).toBe(800 - 700 - 12) // hoehe - transform[5] - fontSize
  })

  it('liefert mehrere Rects bei Range über mehrere TextItems', () => {
    const range: PDFTextRange = { startOffset: 2, endOffset: 8, text: 'lloworl' }
    const rects = berechneFallbackRects(range, seitenInfo)
    expect(rects).toHaveLength(2)
  })

  it('überspringt TextItems vor Range', () => {
    const range: PDFTextRange = { startOffset: 100, endOffset: 103, text: 'far' }
    const rects = berechneFallbackRects(range, seitenInfo)
    expect(rects).toHaveLength(1)
    expect(rects[0].x).toBe(50)
  })

  it('liefert leeres Array bei Range außerhalb aller TextItems', () => {
    const range: PDFTextRange = { startOffset: 200, endOffset: 300, text: '' }
    expect(berechneFallbackRects(range, seitenInfo)).toEqual([])
  })
})
