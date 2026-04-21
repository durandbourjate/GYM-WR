/**
 * Tests für useKIAssistent — Rückgabe-Shape { ergebnis, feedbackId? }
 * TDD-Step 12.1: Failing Test (schlägt fehl bis useKIAssistent.ts angepasst ist)
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useKIAssistent } from '@shared/editor/useKIAssistent'
import { EditorProvider } from '@shared/editor/EditorContext'
import type { EditorConfig, EditorServices } from '@shared/editor/types'

const baseConfig: EditorConfig = {
  benutzer: { email: 'test@gymhofwil.ch' },
  verfuegbareGefaesse: [],
  verfuegbareSemester: [],
  zeigeFiBuTypen: false,
  lpListe: [],
  features: {
    kiAssistent: true,
    anhangUpload: false,
    bewertungsraster: false,
    sharing: false,
    poolSync: false,
    performance: false,
  },
}

function makeWrapper(services: EditorServices) {
  return ({ children }: { children: ReactNode }) => (
    <EditorProvider config={baseConfig} services={services}>
      {children}
    </EditorProvider>
  )
}

describe('useKIAssistent — offeneKIFeedbacks-Lifecycle + Race-Handling', () => {
  it('ausfuehren mit feedbackId-Response fügt Eintrag in offeneKIFeedbacks hinzu', async () => {
    const mockKI = vi.fn().mockResolvedValue({
      ergebnis: { fachbereich: 'VWL' },
      feedbackId: 'fb_lifecycle_1',
    })
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    expect(result.current.offeneKIFeedbacks).toHaveLength(1)
    expect(result.current.offeneKIFeedbacks[0]).toEqual({
      aktion: 'klassifiziereFrage',
      feedbackId: 'fb_lifecycle_1',
      wichtig: false,
    })
  })

  it('Mehrfach-Klick derselben Aktion: alter feedbackId wird via markiereFeedbackAlsIgnoriert geschlossen', async () => {
    let callCount = 0
    const mockKI = vi.fn().mockImplementation(() => {
      callCount++
      return Promise.resolve({
        ergebnis: { fachbereich: 'BWL' },
        feedbackId: `fb_race_${callCount}`,
      })
    })
    const mockIgnoriert = vi.fn().mockResolvedValue(undefined)
    const services: EditorServices = {
      kiAssistent: mockKI,
      markiereFeedbackAlsIgnoriert: mockIgnoriert,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    // Erster Aufruf
    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })
    expect(result.current.offeneKIFeedbacks[0].feedbackId).toBe('fb_race_1')

    // Zweiter Aufruf derselben Aktion → alter Eintrag wird als ignoriert markiert
    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    expect(mockIgnoriert).toHaveBeenCalledWith('fb_race_1')
    // Neuer Eintrag ersetzt alten
    expect(result.current.offeneKIFeedbacks).toHaveLength(1)
    expect(result.current.offeneKIFeedbacks[0].feedbackId).toBe('fb_race_2')
  })

  it('markiereWichtig setzt wichtig nur auf den Eintrag der betreffenden Aktion', async () => {
    const mockKI = vi.fn()
      .mockResolvedValueOnce({ ergebnis: { a: 1 }, feedbackId: 'fb_w_1' })
      .mockResolvedValueOnce({ ergebnis: { b: 2 }, feedbackId: 'fb_w_2' })
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
      await result.current.ausfuehren('generiereMusterloesung', {})
    })

    act(() => {
      result.current.markiereWichtig('klassifiziereFrage', true)
    })

    const klass = result.current.offeneKIFeedbacks.find(f => f.aktion === 'klassifiziereFrage')
    const muster = result.current.offeneKIFeedbacks.find(f => f.aktion === 'generiereMusterloesung')
    expect(klass?.wichtig).toBe(true)
    expect(muster?.wichtig).toBe(false)
  })

  it('alleOffenenFeedbacks liefert Array; reset leert offeneKIFeedbacks und ergebnisse', async () => {
    const mockKI = vi.fn().mockResolvedValue({ ergebnis: { x: 1 }, feedbackId: 'fb_reset_1' })
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    expect(result.current.alleOffenenFeedbacks()).toHaveLength(1)
    expect(Object.keys(result.current.ergebnisse)).toHaveLength(1)

    act(() => {
      result.current.reset()
    })

    expect(result.current.alleOffenenFeedbacks()).toHaveLength(0)
    expect(Object.keys(result.current.ergebnisse)).toHaveLength(0)
  })
})

describe('useKIAssistent — Rückgabe-Shape { ergebnis, feedbackId }', () => {
  it('extrahiert ergebnis aus neuem Response-Shape', async () => {
    const mockKI = vi.fn().mockResolvedValue({
      ergebnis: { fachbereich: 'VWL', bloom: 'K2' },
      feedbackId: 'fb_test_1234',
    })
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    // Hook soll `.ergebnis` extrahieren, nicht das ganze Response-Objekt
    expect(result.current.ergebnisse['klassifiziereFrage']?.daten).toEqual({
      fachbereich: 'VWL',
      bloom: 'K2',
    })
  })

  it('behandelt null-Rückgabe korrekt', async () => {
    const mockKI = vi.fn().mockResolvedValue(null)
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    expect(result.current.ergebnisse['klassifiziereFrage']?.daten).toBeNull()
    expect(result.current.ergebnisse['klassifiziereFrage']?.fehler).toBe('Keine Antwort vom Server')
  })

  it('speichert feedbackId NICHT in ergebnisse.daten', async () => {
    const mockKI = vi.fn().mockResolvedValue({
      ergebnis: { typ: 'mc' },
      feedbackId: 'fb_xyz',
    })
    const services: EditorServices = {
      kiAssistent: mockKI,
      istKIVerfuegbar: () => true,
      istUploadVerfuegbar: () => false,
    }
    const { result } = renderHook(() => useKIAssistent(), { wrapper: makeWrapper(services) })

    await act(async () => {
      await result.current.ausfuehren('klassifiziereFrage', {})
    })

    // feedbackId soll NICHT in daten landen
    expect((result.current.ergebnisse['klassifiziereFrage']?.daten as Record<string, unknown>)?.feedbackId).toBeUndefined()
    expect(result.current.ergebnisse['klassifiziereFrage']?.daten).toEqual({ typ: 'mc' })
  })
})
