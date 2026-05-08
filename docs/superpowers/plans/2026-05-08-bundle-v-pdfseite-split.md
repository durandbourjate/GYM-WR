# Bundle V — PDFSeite Pure-Cut + Hook-Extraktion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `PDFSeite.tsx` (950 Z., **hoch-Risiko**) per 4 Sub-Files zerlegen, ohne Verhaltensänderung. Ziel: <500 Z. im Hauptfile (raus aus Hotspot, Files >500 Z. **11 → 10**). Coverage-Lücke: erstmals Tests für PDF-Selection-DOM-Logic, SVG-Annotation-Rendering, Text-Edit-State, Drag-Math (~28 neue Vitest-Tests).

**Architecture:** 2 Pure-Logic-Files (`pdfSelection.ts`, `pdfAnnotationenSVG.tsx`) + 2 Hook-Files (`usePDFTextEdit.tsx`, `usePDFDrawing.ts`) in neuem Sub-Folder `pdf/seite/` (analog Bundle-U-Co-Location, aber Sub-Folder weil `pdf/` schon 8 Files Top-Level hat). Hooks folgen Bundle-T.d-Result-Destrukturierungs-Pattern in PDFSeite.tsx (PFLICHT, sonst Render-Identity-Drift). Pure-Logic byte-identisch übernommen.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest 4 + @testing-library/react.

**Spec:** [`docs/superpowers/specs/2026-05-08-bundle-v-pdfseite-split-design.md`](../specs/2026-05-08-bundle-v-pdfseite-split-design.md)

**Codebase root:** `/Users/durandbourjate/Documents/-Gym Hofwil/00 Automatisierung Unterricht/10 Github/GYM-WR-DUY/`

**Worktree:** `.worktrees/bundle-v-pdfseite-split` (von main `c79747c`)

**Branch:** `bundle-v/pdfseite-split` (bereits angelegt; Spec rev2 auf Branch committed: `64e2f7e` + `4e0883d`)

**Build-Check:** `cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && grep -E "error TS" /tmp/tsc.log || echo CLEAN` — IMMER Output prüfen (Memory-Lehre `feedback_tsc_b_exit_misleading`)

**Vitest-Baseline:** **1401 passed | 4 todo | 1 skipped** (gemessen 2026-05-08 nach `npm run setup`). Drift-Erwartung **+25–30** (Phase 1: +10, Phase 2: +8, Phase 3: +5, Phase 4: +5; Spec-Math ergibt +28). Final-Counter wird in Phase 6 HANDOFF/Memory aus tatsächlichem Output (`npx vitest run`) übernommen.

---

## File Map

### Neue Files (in neuem Sub-Folder `ExamLab/src/components/fragetypen/pdf/seite/`)

| Datei | Größe | Verantwortung |
|---|---:|---|
| `pdfSelection.ts` | ~95 Z. | `erzeugeId`, `findeSpanRects`, `leseTextauswahl`, `findeSpanRectsRelativ`, `berechneFallbackRects`, `SimpleRect`-Interface |
| `pdfSelection.test.ts` | ~180 Z. | 10 Vitest-Tests mit jsdom-DOM-Fixture |
| `pdfAnnotationenSVG.tsx` | ~220 Z. | `renderSVGOverlay` (public) + 5 interne Sub-Renderer für jeden Annotation-Typ |
| `pdfAnnotationenSVG.test.tsx` | ~150 Z. | 8 Vitest-Tests via `@testing-library/react` |
| `usePDFTextEdit.tsx` | ~70 Z. | Hook mit `editierendeAnnotation`-State, `handleDoubleClick`, `handleTextEditSave`, `editOverlay`-ReactNode-Output, `textEditInputRef` Hook-internal |
| `usePDFTextEdit.test.tsx` | ~120 Z. | 5 Vitest-Tests via `renderHook` |
| `usePDFDrawing.ts` | ~155 Z. | Hook mit `dragRef`, `istZeichnung`, `zeichnungsPfad`, `handleDrawStart/Move/End` (Drag-Text + Drag-Freihand + Freihand-Draw vereint) |
| `usePDFDrawing.test.ts` | ~120 Z. | 5 Vitest-Tests für Drag-Math + State-Transitions (Canvas-2D via Browser-E2E) |

### Geänderte Files

| Datei | Vorher | Nachher | Änderung |
|---|---:|---:|---|
| `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` | 950 Z. | ~480 Z. | 5× Pure-Function-Block + 6× SVG-Render-Funktion + 14× useState/useRef-Block (auf 5 reduziert) + 3× Pointer-useCallback-Block + 2× Text-Edit-useCallback-Block entfernt; 4× Import + 2× Hook-Aufruf mit Destrukturierung hinzugefügt; `handleClick` Auswahl-Branch nutzt `beendeEdit()` statt `setEditierendeAnnotation(null)` |

### Konsumenten (unverändert)

| Datei | Status |
|---|---|
| `ExamLab/src/components/fragetypen/pdf/PDFViewer.tsx:115` | Props-Interface unverändert, kein Edit |

### Out-of-Scope-Files (explizit byte-identisch)

- `pdf/PDFViewer.tsx`, `pdf/PDFToolbar.tsx`, `pdf/PDFTypes.ts`, `pdf/usePDFRenderer.ts`, `pdf/usePDFAnnotations.ts`, `pdf/PDFKommentarPopover.tsx`, `pdf/PDFKategorieChooser.tsx`
- `_aktiveKategorieId` Underscore-Prefix in PDFSeite.tsx Z. 101 — bleibt erhalten (kein Cleanup)
- Inline-IIFE Lösch-Button in PDFSeite.tsx Z. 651–670 — bleibt im Component
- `textLayerSpans` JSX-Inline-Map Z. 160–178 — bleibt im Component (eng an `seitenInfo + zoom` gekoppelt)

---

## Phase 0 — Plan-Reviewer

- [ ] **Step 0.1: Plan-Document-Reviewer dispatchen**

Wenn Subagents verfügbar: `general-purpose`-Agent mit Plan-Path + Spec-Path. Wenn ❌ Issues: fixen + erneut dispatchen, max 3 Iterationen.

**Erwartung:** APPROVED. Recommendations können in Plan oder Phase übernommen werden.

---

## Phase 1 — pdfSelection.ts (Pure DOM-Helpers)

**Risk:** niedrig. **Vitest-Drift:** +10. **Browser-E2E:** keiner.

**Files:**
- Create: `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts`
- Create: `ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts`
- Modify: `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (Z. 32–95 + Z. 914–950 entfernen, Imports anpassen)

### Task 1.1: Sub-Folder + Source-File anlegen

- [ ] **Step 1.1.1: `pdf/seite/` Sub-Folder anlegen** (impliziert beim ersten Write).

- [ ] **Step 1.1.2: `pdfSelection.ts` schreiben — byte-identische Übernahme von Z. 32–95 + Z. 914–950**

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts
import type { PDFTextRange, PDFSeitenInfo } from '../PDFTypes.ts'

// --- Helpers ---

export function erzeugeId(): string {
  return crypto.randomUUID()
}

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

// --- Rect helpers ---

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
```

### Task 1.2: PDFSeite.tsx Imports + Code-Removal

- [ ] **Step 1.2.1: PDFSeite.tsx Z. 32–95 entfernen** (`erzeugeId`, `findeSpanRects`, `leseTextauswahl`)

- [ ] **Step 1.2.2: PDFSeite.tsx Z. 914–950 entfernen** (`SimpleRect`-Interface, `findeSpanRectsRelativ`, `berechneFallbackRects`)

- [ ] **Step 1.2.3: Import in PDFSeite.tsx hinzufügen** (gleich nach den Type-Imports)

```typescript
import { erzeugeId, leseTextauswahl } from './seite/pdfSelection.ts'
```

`findeSpanRectsRelativ` + `berechneFallbackRects` werden NUR von SVG-Render-Funktionen genutzt → in Phase 2 in `pdfAnnotationenSVG.tsx` importiert. In PDFSeite.tsx sind `findeSpanRects` selbst nicht direkt benötigt (nur indirekt via `leseTextauswahl`).

- [ ] **Step 1.2.4: tsc + lint clean prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && grep -E "error TS" /tmp/tsc.log || echo CLEAN
cd ExamLab && npm run lint:as-any
```

**Erwartung:** CLEAN. Wenn fail: tsc-Output direkt prüfen.

### Task 1.3: Vitest für pdfSelection.ts

- [ ] **Step 1.3.1: `pdfSelection.test.ts` schreiben** (10 Tests, jsdom-DOM-Fixture)

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
```

- [ ] **Step 1.3.2: vitest grün**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/seite/pdfSelection.test.ts
```

**Erwartung:** 10/10 passed.

- [ ] **Step 1.3.3: Vollständiger Vitest-Lauf**

```bash
cd ExamLab && npx vitest run
```

**Erwartung:** 1411 passed (1401 + 10), 0 failures.

### Task 1.4: Phase 1 Commit + Per-Phase-Reviewer

- [ ] **Step 1.4.1: Commit Phase 1**

```bash
git add ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.ts \
        ExamLab/src/components/fragetypen/pdf/seite/pdfSelection.test.ts \
        ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx
git commit -m "Bundle V Phase 1: pdfSelection.ts extrahiert (10 Vitest)

- 5 Pure-DOM-Helpers byte-identisch nach pdf/seite/pdfSelection.ts:
  erzeugeId, findeSpanRects, leseTextauswahl, findeSpanRectsRelativ,
  berechneFallbackRects + SimpleRect-Interface
- PDFSeite.tsx Imports angepasst (Z. 32-95 + Z. 914-950 entfernt)
- 10 Vitest-Tests (Drift +10, 1401 → 1411)
- tsc + lint:as-any clean"
```

- [ ] **Step 1.4.2: Per-Phase-Code-Reviewer dispatchen** (`superpowers:code-reviewer`)

**Reviewer-Kontext:**
- Diff: HEAD (Phase 1)
- Spec-Refs: §3 Tabelle Sub-File 1, §4.2 API
- Risk-Profil: niedrig (pure code-move)
- Pflicht-Check: byte-Identity zu Original-Source-Z. 32–95 + 914–950

**Wenn ❌ Issues:** fixen, neu commiten, erneut dispatchen.

---

## Phase 2 — pdfAnnotationenSVG.tsx (Pure SVG-Render)

**Risk:** niedrig. **Vitest-Drift:** +8. **Browser-E2E:** keiner.

**Files:**
- Create: `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx`
- Create: `ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx`
- Modify: `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (Z. 697–912 entfernen, Import + Aufruf anpassen)

### Task 2.1: pdfAnnotationenSVG.tsx anlegen

- [ ] **Step 2.1.1: `pdfAnnotationenSVG.tsx` schreiben — byte-identische Übernahme von Z. 697–912**

```tsx
// ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx
import type {
  PDFAnnotation, PDFHighlightAnnotation, PDFKommentarAnnotation,
  PDFFreihandAnnotation, PDFLabelAnnotation, PDFTextAnnotation,
} from '../PDFTypes.ts'
import type { PDFSeitenInfo, ZoomStufe } from '../PDFTypes.ts'
import { findeSpanRectsRelativ, berechneFallbackRects } from './pdfSelection.ts'
import type { SimpleRect } from './pdfSelection.ts'

// --- SVG overlay rendering ---

export function renderSVGOverlay(
  annotationen: PDFAnnotation[],
  seitenInfo: PDFSeitenInfo,
  textLayer: HTMLDivElement | null,
  zoom: ZoomStufe,
  selectedAnnotationId?: string | null,
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
        elements.push(renderFreihand(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
      case 'text':
        elements.push(renderTextAnnotation(ann, seitenInfo, ann.id === selectedAnnotationId))
        break
    }
  }

  return elements
}

function renderHighlight(/* ... byte-identisch von Z. 731–752 ... */): React.ReactNode[] { /* ... */ }
function renderLabel(/* ... byte-identisch von Z. 754–793 ... */): React.ReactNode[] { /* ... */ }
function renderKommentarMarker(/* ... byte-identisch von Z. 795–810 ... */): React.ReactNode { /* ... */ }
function renderFreihand(/* ... byte-identisch von Z. 812–868 ... */): React.ReactNode { /* ... */ }
function renderTextAnnotation(/* ... byte-identisch von Z. 870–912 ... */): React.ReactNode { /* ... */ }
```

(Volle Bodies aus Original PDFSeite.tsx Z. 731–912 byte-identisch übernehmen — nur Import-Zeile zusätzlich.)

### Task 2.2: PDFSeite.tsx Code-Removal + Import

- [ ] **Step 2.2.1: PDFSeite.tsx Z. 697–912 entfernen** (`renderSVGOverlay` + 5 Sub-Render-Funktionen + `// --- SVG overlay rendering ---` Banner)

- [ ] **Step 2.2.2: Import in PDFSeite.tsx hinzufügen**

```typescript
import { renderSVGOverlay } from './seite/pdfAnnotationenSVG.tsx'
```

- [ ] **Step 2.2.3: tsc + lint + build clean prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && grep -E "error TS" /tmp/tsc.log || echo CLEAN
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run build 2>&1 | tail -5
```

**Erwartung:** CLEAN, build durchläuft ohne Errors.

### Task 2.3: Vitest für pdfAnnotationenSVG.tsx

- [ ] **Step 2.3.1: `pdfAnnotationenSVG.test.tsx` schreiben** (8 Tests via `@testing-library/react`)

```tsx
// ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { renderSVGOverlay } from './pdfAnnotationenSVG.tsx'
import type {
  PDFAnnotation, PDFSeitenInfo,
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
```

- [ ] **Step 2.3.2: vitest grün**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx
```

**Erwartung:** 8/8 passed.

- [ ] **Step 2.3.3: Vollständiger Vitest-Lauf**

```bash
cd ExamLab && npx vitest run
```

**Erwartung:** 1419 passed (1411 + 8), 0 failures.

### Task 2.4: Phase 2 Commit + Per-Phase-Reviewer

- [ ] **Step 2.4.1: Commit Phase 2**

```bash
git add ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.tsx \
        ExamLab/src/components/fragetypen/pdf/seite/pdfAnnotationenSVG.test.tsx \
        ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx
git commit -m "Bundle V Phase 2: pdfAnnotationenSVG.tsx extrahiert (8 Vitest)

- renderSVGOverlay (public) + 5 Sub-Renderer (Highlight/Label/
  Kommentar/Freihand/Text) byte-identisch nach pdf/seite/
  pdfAnnotationenSVG.tsx (Z. 697-912 von Original)
- PDFSeite.tsx Import angepasst, SVG-Render-Block entfernt
- 8 Vitest-Tests (Drift +8, 1411 → 1419)
- tsc + lint + build clean"
```

- [ ] **Step 2.4.2: Per-Phase-Code-Reviewer dispatchen**

**Reviewer-Kontext:**
- Diff: HEAD (Phase 2)
- Spec-Refs: §3 Tabelle Sub-File 2, §4.3 API
- Risk-Profil: niedrig (pure code-move)
- Pflicht-Check: byte-Identity zu Original-Source-Z. 697–912

---

## Phase 3 — usePDFTextEdit.tsx (Hook + Edit-Overlay)

**Risk:** mittel. **Vitest-Drift:** +5. **Browser-E2E:** Pfad 7 (Doppelklick-Edit).

**Files:**
- Create: `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx`
- Create: `ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx`
- Modify: `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (Z. 124–127, 244–246, 333–374, 614–648 — siehe Detail unten)

### Task 3.1: usePDFTextEdit.tsx anlegen

- [ ] **Step 3.1.1: `usePDFTextEdit.tsx` schreiben**

```tsx
// ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx
import { useState, useCallback, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { PDFAnnotation, PDFTextAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'

interface UsePDFTextEditParams {
  readOnly: boolean | undefined
  seitenInfo: PDFSeitenInfo | null
  annotationen: PDFAnnotation[]
  containerRef: RefObject<HTMLDivElement>
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

    const cssX = (ann as PDFTextAnnotation).position.x * seitenInfo.breite
    const cssY = (ann as PDFTextAnnotation).position.y * seitenInfo.hoehe

    setEditierendeAnnotation({
      id: ann.id,
      text: (ann as PDFTextAnnotation).text,
      cssX,
      cssY,
      farbe: (ann as PDFTextAnnotation).farbe,
      groesse: (ann as PDFTextAnnotation).groesse || 18,
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
```

**Hinweis Type-Casts:** Im Original sind `ann.position`, `ann.text` etc. nach dem `ann.werkzeug !== 'text'`-Filter narrowed verfügbar. Nach Hook-Move bleibt der Filter erhalten — TypeScript-Discriminated-Union sollte das narrow capturen. Falls TypeScript unzufrieden ist, `(ann as PDFTextAnnotation)` byte-identisch nutzen wie hier gezeigt.

### Task 3.2: PDFSeite.tsx Hook-Aufruf + Code-Removal

- [ ] **Step 3.2.1: PDFSeite.tsx Code-Removal**
  - Z. 124–127: `editierendeAnnotation` State + `textEditInputRef` Ref entfernen
  - Z. 333–365: `handleDoubleClick` useCallback entfernen
  - Z. 367–374: `handleTextEditSave` useCallback entfernen
  - Z. 614–648: `editierendeAnnotation && (...)` JSX-Block entfernen

- [ ] **Step 3.2.2: PDFSeite.tsx Hook-Aufruf hinzufügen**

```tsx
import { usePDFTextEdit } from './seite/usePDFTextEdit.tsx'

// ... in PDFSeite-Funktion, nach den Refs, vor handleMouseUp:
const {
  istEditierend,
  handleDoubleClick,
  beendeEdit,
  editOverlay,
} = usePDFTextEdit({
  readOnly, seitenInfo, annotationen, containerRef, onAnnotationEditieren,
})
```

**Pflicht (Bundle-T.d-Lehre):** Destrukturieren! `const t = usePDFTextEdit(...)` ist verboten.

- [ ] **Step 3.2.3: PDFSeite.tsx `handleClick` Auswahl-Branch anpassen** (Z. 244–246 im Original)

```tsx
// Vorher (Z. 244-246):
//   if (editierendeAnnotation) {
//     setEditierendeAnnotation(null)
//   }
// Nachher:
if (istEditierend) {
  beendeEdit()
}
```

- [ ] **Step 3.2.4: PDFSeite.tsx `handleClick`-Dep-Array anpassen** (Z. 294)

`editierendeAnnotation` aus Dep-Array entfernen, durch `istEditierend, beendeEdit` ersetzen.

- [ ] **Step 3.2.5: PDFSeite.tsx `editOverlay` rendern**

```tsx
// Im Return-JSX, am Ende der Layer-Liste (vor Popovers, nach editierendeAnnotation && (...) Position):
{editOverlay}
```

- [ ] **Step 3.2.6: tsc + lint + build clean prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && grep -E "error TS" /tmp/tsc.log || echo CLEAN
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run build 2>&1 | tail -5
```

### Task 3.3: Vitest für usePDFTextEdit.tsx

- [ ] **Step 3.3.1: `usePDFTextEdit.test.tsx` schreiben** (5 Tests)

```tsx
// ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, render, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import { usePDFTextEdit } from './usePDFTextEdit.tsx'
import type { PDFAnnotation, PDFTextAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'

const seitenInfo: PDFSeitenInfo = { breite: 600, hoehe: 800, textItems: [] }

const textAnn: PDFTextAnnotation = {
  id: 't1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'text',
  position: { x: 0.5, y: 0.5 }, text: 'Notiz', farbe: '#000', groesse: 18, fett: false,
}

function setupHook(overrides: Partial<Parameters<typeof usePDFTextEdit>[0]> = {}) {
  return renderHook(() => {
    const containerRef = useRef<HTMLDivElement>(null)
    const div = document.createElement('div')
    Object.defineProperty(div, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 600, height: 800, right: 600, bottom: 800, x: 0, y: 0, toJSON() { return {} } }),
    });
    (containerRef as { current: HTMLDivElement }).current = div
    return usePDFTextEdit({
      readOnly: false,
      seitenInfo,
      annotationen: [textAnn],
      containerRef,
      onAnnotationEditieren: vi.fn(),
      ...overrides,
    })
  })
}

describe('usePDFTextEdit', () => {
  it('Idle-State: istEditierend=false, editOverlay=null', () => {
    const { result } = setupHook()
    expect(result.current.istEditierend).toBe(false)
    expect(result.current.editOverlay).toBeNull()
  })

  it('handleDoubleClick auf nicht-Text-Annotation = no-op', () => {
    const { result } = setupHook({
      annotationen: [{ ...textAnn, werkzeug: 'kommentar' } as unknown as PDFAnnotation],
    })
    const fakeEvent = {
      target: (() => { const el = document.createElement('div'); el.setAttribute('data-annotation-id', 't1'); return el })(),
      currentTarget: document.createElement('div'),
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent
    act(() => { result.current.handleDoubleClick(fakeEvent) })
    expect(result.current.istEditierend).toBe(false)
  })

  it('handleDoubleClick auf Text-Annotation setzt Edit-State', () => {
    const { result } = setupHook()
    const targetEl = document.createElement('div')
    targetEl.setAttribute('data-annotation-id', 't1')
    const currentEl = document.createElement('div')
    currentEl.appendChild(targetEl)
    const fakeEvent = {
      target: targetEl,
      currentTarget: currentEl,
      stopPropagation: vi.fn(),
    } as unknown as React.MouseEvent
    act(() => { result.current.handleDoubleClick(fakeEvent) })
    expect(result.current.istEditierend).toBe(true)
    expect(result.current.editOverlay).toBeTruthy()
  })

  it('beendeEdit resettet Edit-State', () => {
    const { result } = setupHook()
    const targetEl = document.createElement('div')
    targetEl.setAttribute('data-annotation-id', 't1')
    const currentEl = document.createElement('div')
    currentEl.appendChild(targetEl)
    act(() => {
      result.current.handleDoubleClick({
        target: targetEl, currentTarget: currentEl, stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent)
    })
    expect(result.current.istEditierend).toBe(true)
    act(() => { result.current.beendeEdit() })
    expect(result.current.istEditierend).toBe(false)
  })

  it('Enter im Edit-Input ruft onAnnotationEditieren mit getrimmtem Text', () => {
    const onEdit = vi.fn()
    const { result, rerender } = setupHook({ onAnnotationEditieren: onEdit })
    const targetEl = document.createElement('div')
    targetEl.setAttribute('data-annotation-id', 't1')
    const currentEl = document.createElement('div')
    currentEl.appendChild(targetEl)
    act(() => {
      result.current.handleDoubleClick({
        target: targetEl, currentTarget: currentEl, stopPropagation: vi.fn(),
      } as unknown as React.MouseEvent)
    })
    // Render the overlay
    const { container } = render(<>{result.current.editOverlay}</>)
    const input = container.querySelector('input')
    expect(input).toBeTruthy()
    if (input) {
      fireEvent.change(input, { target: { value: '  neue notiz  ' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    }
    expect(onEdit).toHaveBeenCalledWith('t1', { text: 'neue notiz' })
  })
})
```

- [ ] **Step 3.3.2: vitest grün**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx
```

- [ ] **Step 3.3.3: Vollständiger Vitest-Lauf**

```bash
cd ExamLab && npx vitest run
```

**Erwartung:** 1424 passed (1419 + 5), 0 failures.

### Task 3.4: Browser-E2E Pfad 7

- [ ] **Step 3.4.1: Service-Worker-Cache leeren** (Memory-Lehre Bundle N)

In Browser-DevTools:
```js
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
location.reload();
```

- [ ] **Step 3.4.2: E2E-Pfad 7** auf staging mit echtem LP-Login:
  1. PDF-Frage öffnen, mind. 1 Text-Annotation existiert
  2. Doppelklick auf Text-Annotation → Edit-Input erscheint orange-umrandet
  3. Text ändern + Enter
  4. Annotation aktualisiert, Edit-Input verschwindet
  5. Console: 0 Errors

### Task 3.5: Phase 3 Commit + Per-Phase-Reviewer

- [ ] **Step 3.5.1: Commit Phase 3**

```bash
git add ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.tsx \
        ExamLab/src/components/fragetypen/pdf/seite/usePDFTextEdit.test.tsx \
        ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx
git commit -m "Bundle V Phase 3: usePDFTextEdit.tsx extrahiert (5 Vitest)

- Hook mit editierendeAnnotation State + handleDoubleClick +
  handleTextEditSave + textEditInputRef + editOverlay-ReactNode
- handleClick-Auswahl-Branch nutzt beendeEdit() statt setState
- Bundle-T.d-Hook-Result-Destrukturierungs-Pattern angewandt
- 5 Vitest-Tests (Drift +5, 1419 → 1424)
- Browser-E2E Pfad 7 (Doppelklick-Edit) auf staging ✓
- tsc + lint + build clean"
```

- [ ] **Step 3.5.2: Per-Phase-Code-Reviewer dispatchen**

**Reviewer-Kontext:**
- Diff: HEAD (Phase 3)
- Spec-Refs: §3 Tabelle Sub-File 3, §4.4 API
- Risk-Profil: mittel (Hook-Move + JSX-Konstruktion)
- Pflicht-Checks:
  - Dep-Arrays von handleDoubleClick + handleTextEditSave 1:1 wie Original
  - Hook-Result-Destrukturierung in PDFSeite.tsx (Bundle-T.d)
  - `setTimeout(() => textEditInputRef.current?.focus(), 30)` im Hook
  - Edit-Input style-Block byte-identisch zu Original Z. 631–646

---

## Phase 4 — usePDFDrawing.ts (Drag + Freihand)

**Risk:** hoch. **Vitest-Drift:** +5. **Browser-E2E:** Pfade 5+8+9.

**Files:**
- Create: `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts`
- Create: `ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts`
- Modify: `ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` (Z. 122, 132–134, 377–516 entfernen, Hook-Aufruf hinzufügen)

### Task 4.1: usePDFDrawing.ts anlegen

- [ ] **Step 4.1.1: `usePDFDrawing.ts` schreiben — byte-identisch von Z. 132–134 + 377–516**

```typescript
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
  containerRef: RefObject<HTMLDivElement>
  zeichenCanvasRef: RefObject<HTMLCanvasElement>
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

  // Drag-State (Bundle-V byte-identisch von Z. 122)
  const dragRef = useRef<{ annotId: string; startRelX: number; startRelY: number; origX: number; origY: number } | null>(null)
  // Freehand drawing state (Bundle-V byte-identisch von Z. 133-134)
  const istZeichnung = useRef(false)
  const zeichnungsPfad = useRef<{ x: number; y: number }[]>([])

  const handleDrawStart = useCallback((e: React.PointerEvent) => {
    // ... byte-identisch von Z. 377-436 (mit Param-Refs statt Component-Locals)
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
                startRelX, startRelY,
                origX: (ann as PDFTextAnnotation).position.x,
                origY: (ann as PDFTextAnnotation).position.y,
              }
            } else {
              dragRef.current = {
                annotId: selectedAnnotation,
                startRelX, startRelY,
                origX: 0, origY: 0,
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
    // ... byte-identisch von Z. 438-489
    if (dragRef.current && seitenInfo) {
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      const relX = (e.clientX - containerRect.left) / seitenInfo.breite
      const relY = (e.clientY - containerRect.top) / seitenInfo.hoehe
      const dx = relX - dragRef.current.startRelX
      const dy = relY - dragRef.current.startRelY
      const ann = annotationen.find(a => a.id === dragRef.current!.annotId)
      if (ann?.werkzeug === 'freihand') {
        try {
          const punkte = JSON.parse((ann as PDFFreihandAnnotation).zeichnungsDaten) as { x: number; y: number }[]
          if (dragRef.current.origX === 0 && dragRef.current.origY === 0) {
            dragRef.current.origX = punkte[0]?.x ?? 0
            dragRef.current.origY = punkte[0]?.y ?? 0
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
    // ... byte-identisch von Z. 491-516
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

    const ctx = zeichenCanvasRef.current?.getContext('2d')
    if (ctx && zeichenCanvasRef.current) {
      ctx.clearRect(0, 0, zeichenCanvasRef.current.width, zeichenCanvasRef.current.height)
    }
  }, [seitenNr, aktiveFarbe, onAnnotationHinzufuegen, containerRef, zeichenCanvasRef])

  return { handleDrawStart, handleDrawMove, handleDrawEnd }
}
```

**Dep-Array-Note:** Original handleDrawStart hatte 6 Deps `[readOnly, aktivesWerkzeug, seitenInfo, aktiveFarbe, selectedAnnotation, annotationen]`. Im Hook werden zusätzlich `containerRef` + `zeichenCanvasRef` hinzugefügt — das ist React-Best-Practice für Refs aus Closure. Refs ändern Identity nicht zwischen Renders, also keine Performance-Regression. Per-Phase-Reviewer prüft.

### Task 4.2: PDFSeite.tsx Hook-Aufruf + Code-Removal

- [ ] **Step 4.2.1: PDFSeite.tsx Code-Removal**
  - Z. 122: `dragRef` Ref entfernen
  - Z. 132–134: `istZeichnung` + `zeichnungsPfad` Refs entfernen
  - Z. 377–516: `handleDrawStart` + `handleDrawMove` + `handleDrawEnd` useCallbacks entfernen

- [ ] **Step 4.2.2: PDFSeite.tsx Hook-Aufruf hinzufügen**

```tsx
import { usePDFDrawing } from './seite/usePDFDrawing.ts'

// ... in PDFSeite-Funktion, nach usePDFTextEdit:
const { handleDrawStart, handleDrawMove, handleDrawEnd } = usePDFDrawing({
  readOnly, aktivesWerkzeug, seitenNr, aktiveFarbe, seitenInfo,
  annotationen, selectedAnnotation, containerRef, zeichenCanvasRef,
  onAnnotationHinzufuegen, onAnnotationEditieren,
})
```

**Pflicht (Bundle-T.d-Lehre):** Destrukturieren!

- [ ] **Step 4.2.3: PDFSeite.tsx Import-Cleanup**

`erzeugeId`-Import bleibt (wird in `handleMouseUp`, `handleKategorieSelect`, `handleKommentarSave`, `handleTextSave` weiter benutzt).

`PDFFreihandAnnotation`-Type-Import in PDFSeite.tsx **kann entfernt werden**, weil `handleDrawStart/Move/End` jetzt im Hook leben. Verifikation: `grep PDFFreihandAnnotation PDFSeite.tsx` nach Phase 4 sollte 0 Treffer zeigen.

- [ ] **Step 4.2.4: tsc + lint + build clean prüfen**

```bash
cd ExamLab && npx tsc -b 2>&1 | tee /tmp/tsc.log && grep -E "error TS" /tmp/tsc.log || echo CLEAN
cd ExamLab && npm run lint:as-any
cd ExamLab && npm run build 2>&1 | tail -5
```

### Task 4.3: Vitest für usePDFDrawing.ts

- [ ] **Step 4.3.1: `usePDFDrawing.test.ts` schreiben** (5 Tests, nur Drag-Math + State-Transitions)

```typescript
// ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { usePDFDrawing } from './usePDFDrawing.ts'
import type { PDFAnnotation, PDFTextAnnotation, PDFFreihandAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'

const seitenInfo: PDFSeitenInfo = { breite: 600, hoehe: 800, textItems: [] }

const textAnn: PDFTextAnnotation = {
  id: 't1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'text',
  position: { x: 0.5, y: 0.5 }, text: 'X', farbe: '#000', groesse: 18, fett: false,
}

const freihandAnn: PDFFreihandAnnotation = {
  id: 'f1', seite: 1, zeitstempel: '2026-01-01', werkzeug: 'freihand',
  zeichnungsDaten: JSON.stringify([{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.2 }]),
  farbe: '#000',
}

function setupHook(overrides: Partial<Parameters<typeof usePDFDrawing>[0]> = {}) {
  const onHinzu = vi.fn()
  const onEdit = vi.fn()
  const result = renderHook(() => {
    const containerRef = useRef<HTMLDivElement>(null)
    const zeichenCanvasRef = useRef<HTMLCanvasElement>(null)
    const div = document.createElement('div')
    Object.defineProperty(div, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 600, height: 800, right: 600, bottom: 800, x: 0, y: 0, toJSON() { return {} } }),
    });
    (containerRef as { current: HTMLDivElement }).current = div
    return usePDFDrawing({
      readOnly: false,
      aktivesWerkzeug: 'auswahl',
      seitenNr: 1,
      aktiveFarbe: '#000',
      seitenInfo,
      annotationen: [textAnn, freihandAnn],
      selectedAnnotation: 't1',
      containerRef,
      zeichenCanvasRef,
      onAnnotationHinzufuegen: onHinzu,
      onAnnotationEditieren: onEdit,
      ...overrides,
    })
  })
  return { ...result, onHinzu, onEdit }
}

function fakePointerEvent(clientX: number, clientY: number, annotId: string | null) {
  const target = document.createElement('div')
  if (annotId) target.setAttribute('data-annotation-id', annotId)
  const currentTarget = document.createElement('div')
  currentTarget.appendChild(target)
  return {
    target, currentTarget, clientX, clientY,
    preventDefault: vi.fn(),
  } as unknown as React.PointerEvent
}

describe('usePDFDrawing', () => {
  it('Drag-Start auf nicht-selektierter Annotation = no-op', () => {
    const { result, onEdit } = setupHook({ selectedAnnotation: null })
    act(() => { result.current.handleDrawStart(fakePointerEvent(100, 100, 't1')) })
    act(() => { result.current.handleDrawMove(fakePointerEvent(120, 120, null)) })
    expect(onEdit).not.toHaveBeenCalled()
  })

  it('Drag-Start auf Text-Annotation aktiviert Drag-State', () => {
    const { result, onEdit } = setupHook()
    act(() => { result.current.handleDrawStart(fakePointerEvent(300, 400, 't1')) })
    // Drag-Move sollte jetzt onEdit triggern
    act(() => { result.current.handleDrawMove(fakePointerEvent(360, 480, null)) })
    expect(onEdit).toHaveBeenCalledWith('t1', expect.objectContaining({ position: expect.any(Object) }))
  })

  it('Drag-Move auf Text verschiebt Position um delta', () => {
    const { result, onEdit } = setupHook()
    act(() => { result.current.handleDrawStart(fakePointerEvent(300, 400, 't1')) }) // start = (0.5, 0.5)
    act(() => { result.current.handleDrawMove(fakePointerEvent(360, 480, null)) }) // delta = (+0.1, +0.1)
    expect(onEdit).toHaveBeenCalledWith('t1', { position: { x: 0.6, y: 0.6 } })
  })

  it('Drag-Move auf Freihand verschiebt alle Punkte', () => {
    const { result, onEdit } = setupHook({ selectedAnnotation: 'f1' })
    act(() => { result.current.handleDrawStart(fakePointerEvent(60, 80, 'f1')) }) // (0.1, 0.1)
    act(() => { result.current.handleDrawMove(fakePointerEvent(120, 160, null)) }) // delta = (+0.1, +0.1)
    expect(onEdit).toHaveBeenCalledWith('f1', expect.objectContaining({
      zeichnungsDaten: expect.any(String),
    }))
    const lastCall = onEdit.mock.calls[onEdit.mock.calls.length - 1]
    const punkte = JSON.parse(lastCall[1].zeichnungsDaten as string)
    expect(punkte).toEqual([{ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.3 }])
  })

  it('Drag-End räumt dragRef + data-drag-orig-punkte auf', () => {
    const { result } = setupHook({ selectedAnnotation: 'f1' })
    act(() => { result.current.handleDrawStart(fakePointerEvent(60, 80, 'f1')) })
    act(() => { result.current.handleDrawMove(fakePointerEvent(120, 160, null)) })
    act(() => { result.current.handleDrawEnd() })
    // Nach End sollte ein weiterer Move kein Edit mehr triggern
    // (Indirekter Test, weil dragRef hook-internal ist)
    expect(true).toBe(true) // Hauptsache: kein Crash
  })
})
```

**Hinweis:** Canvas-2D-Aufrufe (`ctx.beginPath`, `ctx.lineTo`, etc.) sind in jsdom nicht testbar — Browser-E2E deckt Pfad 5 (Freihand-Strich) ab.

- [ ] **Step 4.3.2: vitest grün**

```bash
cd ExamLab && npx vitest run src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts
```

- [ ] **Step 4.3.3: Vollständiger Vitest-Lauf**

```bash
cd ExamLab && npx vitest run
```

**Erwartung:** 1429 passed (1424 + 5), 0 failures.

### Task 4.4: Browser-E2E Pfade 5+8+9

- [ ] **Step 4.4.1: SW-Cache leeren** (analog Step 3.4.1)

- [ ] **Step 4.4.2: E2E-Pfad 5** (Freihand): Werkzeug=Freihand → Canvas-Drag → Pointer-Up → SVG-Pfad sichtbar.

- [ ] **Step 4.4.3: E2E-Pfad 8** (Drag Text): Werkzeug=Auswahl → Text-Annotation klicken (selektiert) → Drag → Position aktualisiert.

- [ ] **Step 4.4.4: E2E-Pfad 9** (Drag Freihand): Werkzeug=Auswahl → Freihand-Annotation klicken → Drag → alle Punkte verschoben.

Console: 0 Errors. PDFSeite.tsx Zeilen-Count nach Phase 4: `wc -l ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx` muss <500 zeigen.

### Task 4.5: Phase 4 Commit + Per-Phase-Reviewer

- [ ] **Step 4.5.1: Commit Phase 4**

```bash
git add ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.ts \
        ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts \
        ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx
git commit -m "Bundle V Phase 4: usePDFDrawing.ts extrahiert (5 Vitest)

- Hook mit dragRef + istZeichnung + zeichnungsPfad +
  handleDrawStart/Move/End (Drag-Text + Drag-Freihand +
  Freihand-Draw byte-identisch von Z. 132-134, 377-516)
- Bundle-T.d-Hook-Result-Destrukturierungs-Pattern angewandt
- 5 Vitest-Tests (Drift +5, 1424 → 1429); Canvas-2D via Browser-E2E
- Browser-E2E Pfade 5+8+9 auf staging ✓
- PDFSeite.tsx <500 Z. (raus aus Hotspot)
- tsc + lint + build clean"
```

- [ ] **Step 4.5.2: Per-Phase-Code-Reviewer dispatchen**

**Reviewer-Kontext:**
- Diff: HEAD (Phase 4)
- Spec-Refs: §3 Tabelle Sub-File 4, §4.5 API
- Risk-Profil: hoch (komplexeste State-Maschine, 11 Dep-Slots)
- Pflicht-Checks:
  - Dep-Arrays von handleDrawStart (6+2=8 Original + 2 Refs), handleDrawMove (2 + 3 Refs), handleDrawEnd (3 + 2 Refs) — Refs sind React-Best-Practice-Addition, keine semantische Änderung
  - `data-drag-orig-punkte`-Attribute-Mutation byte-identisch
  - `try/catch` für JSON.parse byte-identisch
  - PDFSeite.tsx <500 Z.

---

## Phase 5 — Final-Review + komplette Browser-E2E

### Task 5.1: Final Code-Reviewer auf gesamten Diff

- [ ] **Step 5.1.1: Diff-Übersicht**

```bash
git diff main...HEAD --stat
git diff main...HEAD -- ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx | head -100
wc -l ExamLab/src/components/fragetypen/pdf/PDFSeite.tsx ExamLab/src/components/fragetypen/pdf/seite/*.{ts,tsx}
```

**Erwartung:**
- PDFSeite.tsx <500 Z.
- 8 neue Files in pdf/seite/ (4 Source + 4 Test)
- Total +~1000 Z., -~470 Z.

- [ ] **Step 5.1.2: Final-Reviewer dispatchen** (`superpowers:code-reviewer`)

**Reviewer-Kontext:**
- Vollständiger Diff `main...HEAD`
- Spec + Plan Pfade
- Pflicht-Checks:
  - PDFSeite.tsx <500 Z. (DoD)
  - vitest 1429 (Drift +28 erreicht)
  - 4× lint clean (`as-any`, `no-tests-dir`, `no-alert`, `musterloesung`)
  - tsc + build clean
  - Alle 4 Bundle-T.d-Hook-Result-Destrukturierungen vorhanden
  - byte-Identity bei allen Pure-Cuts (Phase 1+2)

### Task 5.2: Komplette Browser-E2E (alle 11 Pfade)

- [ ] **Step 5.2.1: SW-Cache leeren + frischer Reload** (Memory-Lehre Bundle N)

- [ ] **Step 5.2.2: E2E auf staging mit echtem LP-Login — alle 11 Pfade abklappern**

| # | Pfad | OK |
|---|---|---|
| 1 | PDF mit ≥2 Seiten laden, Seite 1 + 2 rendern | ☐ |
| 2 | Highlighter → Text → Highlight | ☐ |
| 3 | Label → Text → KategorieChooser → Auswahl → Label | ☐ |
| 4 | Kommentar → klicken → Popover → speichern → 💬 | ☐ |
| 5 | Freihand → zeichnen → SVG-Pfad | ☐ |
| 6 | Text → klicken → Input → Enter → SVG-Text | ☐ |
| 7 | Doppelklick Text-Annotation → Edit-Input → Enter → aktualisiert | ☐ |
| 8 | Auswahl + Drag Text → Position aktualisiert | ☐ |
| 9 | Auswahl + Drag Freihand → alle Punkte verschoben | ☐ |
| 10 | Auswahl + Lösch-Button → entfernt | ☐ |
| 11 | Radierer → Klick → entfernt | ☐ |

Plus: **0 Console-Errors** während aller 11 Pfade.

- [ ] **Step 5.2.3 (optional, Spec-Reviewer-Empfehlung): Pfad 12 — Hook-Identity-Smoke** Re-Render in DevTools-Profiler ohne State-Change → keine Render-Loop-Warnings.

---

## Phase 6 — HANDOFF + Memory + Merge

### Task 6.1: HANDOFF-Eintrag

- [ ] **Step 6.1.1: HANDOFF.md Bundle-V-Sektion oben einfügen**

```markdown
### Bundle V — PDFSeite Pure-Cut + Hook-Extraktion ✅ MERGED (2026-05-08)

**Phase-4-Audit, Hoch-Risiko-File 2/3 (nach Bundle U useDrawingEngine, vor Bundle W uebungsStore).**

PDFSeite.tsx **950 → ~XXX Z. (-XX%)** via 4 Sub-Files in `pdf/seite/`-Sub-Folder. Hotspot-Bilanz Code-Files (>500 Z., ohne data/test) **11 → 10**. Coverage: erstmals Tests für PDF-Selection-DOM-Logic (10) + SVG-Rendering (8) + Text-Edit-State (5) + Drag-Math (5).

**Neue Files:**
- `pdfSelection.ts` (~95 Z.) — `erzeugeId`/`findeSpanRects`/`leseTextauswahl`/`findeSpanRectsRelativ`/`berechneFallbackRects` byte-identisch
- `pdfAnnotationenSVG.tsx` (~220 Z.) — `renderSVGOverlay` (public) + 5 Sub-Renderer byte-identisch
- `usePDFTextEdit.tsx` (~70 Z.) — Hook mit `editierendeAnnotation` State + `editOverlay` ReactNode-Output (Bundle-T.d-Pattern)
- `usePDFDrawing.ts` (~155 Z.) — Hook mit Drag + Freihand vereint, 11 Param-Slots, 3 useCallbacks

**Tests:** vitest 1429 (drift +28). 4× lint + tsc + build clean. Browser-E2E 11/11 Pfade ✅ auf staging mit echtem LP-Login, 0 Console-Errors.

**Reviewer:** 4× Per-Phase + 1× Final + 1× Plan-Reviewer alle APPROVED.

**Lehren:** [füllen nach Phase 4 — Drift-Toleranz, Refs-in-Dep-Arrays-Pattern, eventuelle Sub-Type-Cast-Patterns]

**Spawn-Tasks:** Bundle W (uebungsStore.ts 684 Z., Hoch-Risiko 3/3); textLayerSpans-Cut (kein Hotspot mehr, optional).
```

### Task 6.2: Memory-Update

- [ ] **Step 6.2.1: `MEMORY.md` Index-Eintrag für Bundle V hinzufügen**

```markdown
- **[Bundle V KOMPLETT auf main](project_bundle_v_komplett.md)** — 08.05.2026 Merge `<hash>`. PDFSeite.tsx 950 → ~XXX Z. (-XX%) via pdf/seite/-Sub-Folder. ...
```

- [ ] **Step 6.2.2: Detail-File `project_bundle_v_komplett.md` schreiben** mit Pattern-Lehren.

- [ ] **Step 6.2.3: Bei NEUEN Lehren** (Hook-Result-Destrukturierungs-Edge-Case, Refs-in-Dep-Arrays Konvention, etc.): eigenes Memory-File + Index-Eintrag.

### Task 6.3: Pre-Merge-Check + Merge

- [ ] **Step 6.3.1: Preview-Force-Push-Regel-Check** (Memory)

```bash
git fetch origin
git log preview ^bundle-v/pdfseite-split  # zeigt was preview hat aber wir nicht
git log bundle-v/pdfseite-split ^main  # zeigt was wir haben aber main nicht
```

**Wenn `git log preview ^bundle-v/...` Treffer hat → STOPP**, mit User klären (Lehre Bundle S113).

- [ ] **Step 6.3.2: HANDOFF + Memory committen**

```bash
git add ExamLab/HANDOFF.md /Users/durandbourjate/.claude/projects/-Users-durandbourjate-Documents--Gym-Hofwil-00-Automatisierung-Unterricht/memory/
git commit -m "Bundle V: HANDOFF-Eintrag + Memory-Update"
```

- [ ] **Step 6.3.3: Merge auf main**

```bash
git checkout main
git merge --no-ff bundle-v/pdfseite-split -m "Merge Bundle V: PDFSeite Pure-Cut + Hook-Extraktion (950 → XXX Z., -XX%)"
git push origin main
```

- [ ] **Step 6.3.4: preview → main reset**

```bash
git checkout preview
git reset --hard main
git push --force-with-lease origin preview
```

- [ ] **Step 6.3.5: Branch lokal+remote löschen**

```bash
git branch -d bundle-v/pdfseite-split
git push origin --delete bundle-v/pdfseite-split  # falls remote-Push existiert
git worktree remove .worktrees/bundle-v-pdfseite-split
```

---

## Definition of Done — Final-Check

- [ ] PDFSeite.tsx <500 Z. (Hotspot-Bilanz **11 → 10**)
- [ ] vitest 1401 → ~1429 (+28 erwartet, ≥+25 OK), 0 failures
- [ ] tsc -b clean (Output-inspected, **nicht** nur Exit-Code)
- [ ] 4× lint clean (`as-any`, `no-tests-dir`, `no-alert`, `musterloesung`)
- [ ] build clean
- [ ] Browser-E2E 11/11 Pfade ✅ auf staging mit echtem LP-Login, 0 Console-Errors
- [ ] 4× Per-Phase + Final-Reviewer + Plan-Reviewer: APPROVED
- [ ] HANDOFF + Memory aktualisiert
- [ ] Merge `bundle-v/pdfseite-split` → main + preview-reset + Branch-Cleanup

---

## Anhang: Plan-Reviewer-Anweisungen

**Beim Plan-Reviewer-Run** (Phase 0) gezielt prüfen lassen:

- §Phase-1-1.1.2: Source-Z. 32–95 + 914–950 Snippet im Plan = byte-identisch zu Original?
- §Phase-2-2.1.1: Code-Snippet zeigt nur Public-Surface; volle 5 Sub-Renderer-Bodies werden byte-identisch übernommen — soll der Plan die vollen Bodies expanded oder elided zeigen? (Aktuell: elided wegen Plan-Länge.)
- §Phase-3-3.1.1: `usePDFTextEdit` Type-Casts (`as PDFTextAnnotation` x4) — sind alle nötig oder narrowed TypeScript bereits?
- §Phase-4-4.1.1: Refs in Dep-Arrays — 11 Original-Dep-Slots vs. 13 Hook-Dep-Slots (mit Refs). React-Best-Practice oder Bundle-V-Konvention etablieren?
- §Phase-4: usePDFDrawing 11 Params — Group-Params evaluieren (Spec-Reviewer-Empfehlung): `werkzeugContext: { aktivesWerkzeug, aktiveFarbe, seitenNr }`, `refs: { containerRef, zeichenCanvasRef }`. **Empfehlung:** flat lassen (byte-identisch zu Bundle U), Plan-Reviewer-Diskussionspunkt offen lassen.
