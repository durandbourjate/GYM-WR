// ExamLab/src/components/fragetypen/pdf/seite/usePDFDrawing.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { usePDFDrawing } from './usePDFDrawing.ts'
import type { PDFTextAnnotation, PDFFreihandAnnotation, PDFSeitenInfo } from '../PDFTypes.ts'

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
    document.body.appendChild(div)
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
  beforeEach(() => {
    // Body zwischen Tests leeren — sonst finden Tests stale-divs aus früheren setupHook-Aufrufen
    document.body.innerHTML = ''
  })

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
    const punkte = JSON.parse(lastCall[1].zeichnungsDaten as string) as { x: number; y: number }[]
    // FP-Toleranz: 0.1 + 0.2 != 0.3 exakt (Bundle U Pattern)
    expect(punkte).toHaveLength(2)
    expect(punkte[0].x).toBeCloseTo(0.2, 10)
    expect(punkte[0].y).toBeCloseTo(0.2, 10)
    expect(punkte[1].x).toBeCloseTo(0.3, 10)
    expect(punkte[1].y).toBeCloseTo(0.3, 10)
  })

  it('Drag-End räumt dragRef + data-drag-orig-punkte auf', () => {
    const { result, onEdit } = setupHook({ selectedAnnotation: 'f1' })
    act(() => { result.current.handleDrawStart(fakePointerEvent(60, 80, 'f1')) })
    act(() => { result.current.handleDrawMove(fakePointerEvent(120, 160, null)) })

    // Während Drag aktiv: data-drag-orig-punkte gesetzt
    const dragDivVorEnd = document.querySelector('[data-drag-orig-punkte]')
    expect(dragDivVorEnd).not.toBeNull()

    onEdit.mockClear()
    act(() => { result.current.handleDrawEnd() })

    // Nach End: data-drag-orig-punkte entfernt
    const dragDivNachEnd = document.querySelector('[data-drag-orig-punkte]')
    expect(dragDivNachEnd).toBeNull()

    // Folge-Move darf onEdit nicht mehr triggern (dragRef = null)
    act(() => { result.current.handleDrawMove(fakePointerEvent(180, 240, null)) })
    expect(onEdit).not.toHaveBeenCalled()
  })
})
