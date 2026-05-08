import type { PDFTextRange, PDFSeitenInfo } from '../PDFTypes.ts'

// --- ID-Helper ---

export function erzeugeId(): string {
  return crypto.randomUUID()
}

// --- Span-Rect-Helpers ---

/** Get bounding rects of text-layer spans that overlap an offset range */
export function findeSpanRects(
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
export function leseTextauswahl(container: HTMLDivElement): PDFTextRange | null {
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

// --- Relative-Rect-Helpers ---

export interface SimpleRect { x: number; y: number; w: number; h: number }

/** Get span rects relative to container, using DOM measurements */
export function findeSpanRectsRelativ(
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
export function berechneFallbackRects(
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
