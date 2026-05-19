/**
 * Tests für useFragenBatchEdit (Cluster D Cleanup SP-3, 16.05.2026).
 *
 * Pattern: vi.mock auf Modul-Pfade mit shared mutable Refs (analog usePruefungsRecovery.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// ─── Module-Level mutable State (geschlossen in vi.mock-Factories) ───
const bulkUpdateMock = vi.fn()
const bulkLoescheMock = vi.fn()
const ladeMock = vi.fn()
const leereSelektionMock = vi.fn()
const toastAddMock = vi.fn()

const selektierteIdsRef: { current: string[] } = { current: [] }

vi.mock('../../../services/fragenBulkApi.ts', () => ({
  bulkUpdateFragen: (...args: unknown[]) => bulkUpdateMock(...args),
  bulkLoescheFragen: (...args: unknown[]) => bulkLoescheMock(...args),
}))

vi.mock('../../../store/fragenSelectionStore.ts', () => ({
  useSelektierteIds: () => selektierteIdsRef.current,
  useFragenSelectionStore: (selector: (s: unknown) => unknown) =>
    selector({ leereSelektion: leereSelektionMock }),
}))

vi.mock('../../../store/fragensammlungStore.ts', () => ({
  useFragensammlungStore: Object.assign(
    (_selector: (s: unknown) => unknown) => undefined,
    {
      getState: () => ({ lade: ladeMock }),
    },
  ),
}))

vi.mock('@gymhofwil/shared', async (importOriginal) => {
  const original = await importOriginal<typeof import('@gymhofwil/shared')>()
  return {
    ...original,
    useToastStore: (selector: (s: unknown) => unknown) =>
      selector({ add: toastAddMock }),
  }
})

import { useFragenBatchEdit } from './useFragenBatchEdit'

beforeEach(() => {
  bulkUpdateMock.mockReset().mockResolvedValue({ erfolgreich: 0, affectedIds: [], fehlgeschlagen: [] })
  bulkLoescheMock.mockReset().mockResolvedValue({ erfolgreich: 0, affectedIds: [], fehlgeschlagen: [] })
  ladeMock.mockReset().mockResolvedValue(undefined)
  leereSelektionMock.mockReset()
  toastAddMock.mockReset()
  selektierteIdsRef.current = []
})

describe('useFragenBatchEdit — Initial State', () => {
  it('initialisiert alle Open-Flags auf false und pendingPatch/Modus auf Default', () => {
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    expect(result.current.batchEditorOffen).toBe(false)
    expect(result.current.batchConfirmOffen).toBe(false)
    expect(result.current.loeschConfirmOffen).toBe(false)
    expect(result.current.pendingPatch).toBeNull()
    expect(result.current.pendingTagsModus).toBe('hinzufuegen')
    expect(result.current.sichtbareSelektierteCount).toBe(0)
  })

  it('sichtbareSelektierteCount = Schnittmenge selektiert ∩ gefilterterer', () => {
    selektierteIdsRef.current = ['a', 'b', 'c', 'd']
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: ['a', 'c', 'x'] }))
    expect(result.current.sichtbareSelektierteCount).toBe(2)
  })
})

describe('useFragenBatchEdit — Editor → Confirm Flow', () => {
  it('onEditorBatchSave setzt pendingPatch + tagsModus, schliesst Editor, öffnet Confirm', () => {
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.setBatchEditorOffen(true) })
    expect(result.current.batchEditorOffen).toBe(true)

    act(() => {
      result.current.onEditorBatchSave({ fachbereich: 'VWL', tagsErsetzen: ['t1'] }, 'ersetzen')
    })
    expect(result.current.batchEditorOffen).toBe(false)
    expect(result.current.batchConfirmOffen).toBe(true)
    expect(result.current.pendingPatch).toEqual({ fachbereich: 'VWL', tagsErsetzen: ['t1'] })
    expect(result.current.pendingTagsModus).toBe('ersetzen')
  })

  it('onAbbrechenConfirm schliesst Confirm + cleared pendingPatch', () => {
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => {
      result.current.onEditorBatchSave({ bloom: 'K3' }, 'hinzufuegen')
    })
    expect(result.current.batchConfirmOffen).toBe(true)

    act(() => { result.current.onAbbrechenConfirm() })
    expect(result.current.batchConfirmOffen).toBe(false)
    expect(result.current.pendingPatch).toBeNull()
  })

  it('onAbbrechenLoesch schliesst nur loeschConfirm', () => {
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.setLoeschConfirmOffen(true) })
    expect(result.current.loeschConfirmOffen).toBe(true)
    act(() => { result.current.onAbbrechenLoesch() })
    expect(result.current.loeschConfirmOffen).toBe(false)
  })
})

describe('useFragenBatchEdit — bulkUpdateFragen Flow', () => {
  it('onBatchUpdateBestaetigen ruft bulkUpdateFragen, leereSelektion, toast.success, lade(force=true)', async () => {
    selektierteIdsRef.current = ['f1', 'f2']
    bulkUpdateMock.mockResolvedValue({ erfolgreich: 2, affectedIds: ['f1', 'f2'], fehlgeschlagen: [] })
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ bloom: 'K2' }, 'hinzufuegen') })

    await act(async () => { await result.current.onBatchUpdateBestaetigen() })
    expect(bulkUpdateMock).toHaveBeenCalledWith(['f1', 'f2'], { bloom: 'K2' }, 'lp@test')
    expect(toastAddMock).toHaveBeenCalledWith('success', expect.stringContaining('2 Fragen aktualisiert'))
    expect(leereSelektionMock).toHaveBeenCalledTimes(1)
    expect(ladeMock).toHaveBeenCalledWith('lp@test', true)
    await waitFor(() => expect(result.current.batchConfirmOffen).toBe(false))
    expect(result.current.pendingPatch).toBeNull()
  })

  it('warning-toast wenn fehlgeschlagen.length > 0', async () => {
    selektierteIdsRef.current = ['f1', 'f2', 'f3']
    bulkUpdateMock.mockResolvedValue({ erfolgreich: 2, affectedIds: ['f1', 'f2'], fehlgeschlagen: ['f3'] })
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ status: 'sammlung' }, 'hinzufuegen') })

    await act(async () => { await result.current.onBatchUpdateBestaetigen() })
    expect(toastAddMock).toHaveBeenCalledWith('warning', expect.stringContaining('1 fehlgeschlagen'))
  })

  it('error-toast wenn bulkUpdateFragen throws', async () => {
    selektierteIdsRef.current = ['f1']
    bulkUpdateMock.mockRejectedValue(new Error('Backend kaputt'))
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ bloom: 'K1' }, 'hinzufuegen') })

    await act(async () => { await result.current.onBatchUpdateBestaetigen() })
    expect(toastAddMock).toHaveBeenCalledWith('error', expect.stringContaining('Backend kaputt'))
    expect(leereSelektionMock).not.toHaveBeenCalled()
  })

  it('no-op wenn email undefined', async () => {
    selektierteIdsRef.current = ['f1']
    const { result } = renderHook(() => useFragenBatchEdit({ email: undefined, gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ bloom: 'K1' }, 'hinzufuegen') })

    await act(async () => { await result.current.onBatchUpdateBestaetigen() })
    expect(bulkUpdateMock).not.toHaveBeenCalled()
  })

  it('SP-2 useRef-Guard verhindert Double-Submit: zwei parallele Calls → nur 1 Backend-Call', async () => {
    selektierteIdsRef.current = ['f1']
    let resolveFirst: (v: { erfolgreich: number, affectedIds: string[], fehlgeschlagen: string[] }) => void
    bulkUpdateMock.mockImplementation(() => new Promise((res) => { resolveFirst = res }))
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ bloom: 'K1' }, 'hinzufuegen') })

    // Erster Call: startet aber resolved noch nicht
    let p1: Promise<void> | undefined
    act(() => { p1 = result.current.onBatchUpdateBestaetigen() })
    // Zweiter Call: muss durch useRef-Guard sofort returnen
    let p2: Promise<void> | undefined
    act(() => { p2 = result.current.onBatchUpdateBestaetigen() })

    expect(bulkUpdateMock).toHaveBeenCalledTimes(1)

    // Promises cleanen
    await act(async () => {
      resolveFirst!({ erfolgreich: 1, affectedIds: ['f1'], fehlgeschlagen: [] })
      await p1
      await p2
    })
  })
})

describe('useFragenBatchEdit — bulkLoescheFragen Flow', () => {
  it('onBatchLoeschen ruft bulkLoescheFragen, leereSelektion, toast, lade(force=true)', async () => {
    selektierteIdsRef.current = ['f1', 'f2']
    bulkLoescheMock.mockResolvedValue({ erfolgreich: 2, affectedIds: ['f1', 'f2'], fehlgeschlagen: [] })
    const { result } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.setLoeschConfirmOffen(true) })

    await act(async () => { await result.current.onBatchLoeschen() })
    expect(bulkLoescheMock).toHaveBeenCalledWith(['f1', 'f2'], 'lp@test')
    expect(toastAddMock).toHaveBeenCalledWith('success', expect.stringContaining('Papierkorb'))
    expect(leereSelektionMock).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.loeschConfirmOffen).toBe(false))
  })

  it('no-op wenn email undefined', async () => {
    selektierteIdsRef.current = ['f1']
    const { result } = renderHook(() => useFragenBatchEdit({ email: undefined, gefilterteIds: [] }))
    await act(async () => { await result.current.onBatchLoeschen() })
    expect(bulkLoescheMock).not.toHaveBeenCalled()
  })
})

describe('useFragenBatchEdit — SP-4 mountedRef', () => {
  it('unmount während async-Pfad: kein toast/leereSelektion mehr nach unmount', async () => {
    selektierteIdsRef.current = ['f1']
    let resolveBackend: (v: { erfolgreich: number, affectedIds: string[], fehlgeschlagen: string[] }) => void
    bulkUpdateMock.mockImplementation(() => new Promise((res) => { resolveBackend = res }))
    const { result, unmount } = renderHook(() => useFragenBatchEdit({ email: 'lp@test', gefilterteIds: [] }))
    act(() => { result.current.onEditorBatchSave({ bloom: 'K1' }, 'hinzufuegen') })

    let p: Promise<void> | undefined
    act(() => { p = result.current.onBatchUpdateBestaetigen() })

    // Unmount BEVOR Backend resolved → mountedRef.current = false
    unmount()

    await act(async () => {
      resolveBackend!({ erfolgreich: 1, affectedIds: ['f1'], fehlgeschlagen: [] })
      await p
    })

    // Nach unmount: KEIN toastAdd, KEIN leereSelektion, KEIN lade
    expect(toastAddMock).not.toHaveBeenCalled()
    expect(leereSelektionMock).not.toHaveBeenCalled()
    expect(ladeMock).not.toHaveBeenCalled()
  })
})
