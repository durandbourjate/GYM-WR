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
