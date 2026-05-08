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
    // Wrapper-Komponente: Hook in echtem React-Tree, sodass State-Updates
    // den editOverlay-Render durch den gleichen Tree neu auslösen.
    function Wrapper() {
      const containerRef = useRef<HTMLDivElement>(null)
      const div = document.createElement('div')
      Object.defineProperty(div, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 600, height: 800, right: 600, bottom: 800, x: 0, y: 0, toJSON() { return {} } }),
      });
      (containerRef as { current: HTMLDivElement }).current = div
      const r = usePDFTextEdit({
        readOnly: false, seitenInfo, annotationen: [textAnn], containerRef,
        onAnnotationEditieren: onEdit,
      })
      return (
        <div
          ref={(el) => {
            if (el && !el.dataset.init) {
              el.dataset.init = '1'
              const targetEl = document.createElement('div')
              targetEl.setAttribute('data-annotation-id', 't1')
              el.appendChild(targetEl)
              act(() => {
                r.handleDoubleClick({
                  target: targetEl, currentTarget: el, stopPropagation: vi.fn(),
                } as unknown as React.MouseEvent)
              })
            }
          }}
        >
          {r.editOverlay}
        </div>
      )
    }
    const { container } = render(<Wrapper />)
    const input = container.querySelector('input')
    expect(input).toBeTruthy()
    if (input) {
      fireEvent.change(input, { target: { value: '  neue notiz  ' } })
      fireEvent.keyDown(input, { key: 'Enter' })
    }
    expect(onEdit).toHaveBeenCalledWith('t1', { text: 'neue notiz' })
  })
})
