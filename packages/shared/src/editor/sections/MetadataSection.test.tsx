/**
 * Cluster D Phase 0 — Tests für die Status-RadioGroup in MetadataSection.
 *
 * Fokussiert auf das neue Status-Feld (Draft / Sammlung). Andere MetadataSection-
 * Felder (Fach, Bloom, Tags, …) sind hier nicht abgedeckt.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MetadataSection from './MetadataSection'
import { EditorProvider } from '../EditorContext'
import type { EditorConfig, EditorServices } from '../types'

// --- Test-Provider ---------------------------------------------------------

function renderInProvider(ui: React.ReactNode) {
  const config: EditorConfig = {
    benutzer: { email: 'lp@example.test', fachschaft: 'wr' },
    verfuegbareGefaesse: ['SF', 'EF', 'EWR', 'GF'],
    verfuegbareSemester: ['1', '2', '3', '4'],
    zeigeFiBuTypen: false,
    features: { kiAssistent: false, anhangUpload: false, bewertungsraster: false, sharing: false, poolSync: false, performance: false },
  }
  const services: EditorServices = {
    istKIVerfuegbar: () => false,
    istUploadVerfuegbar: () => false,
  }
  return render(
    <EditorProvider config={config} services={services}>{ui}</EditorProvider>,
  )
}

function makeKiStub() {
  return {
    ladeKiAktion: null,
    ergebnisse: {},
    ausfuehren: vi.fn(),
    verwerfen: vi.fn(),
    verfuegbar: false,
    offeneKIFeedbacks: [],
    markiereWichtig: vi.fn(),
    reset: vi.fn(),
    alleOffenenFeedbacks: vi.fn(() => []),
  } as unknown as React.ComponentProps<typeof MetadataSection>['ki']
}

function baseProps(overrides: Partial<React.ComponentProps<typeof MetadataSection>> = {}) {
  return {
    istNeu: true,
    fragetext: '',
    fachbereich: 'VWL' as const,
    setFachbereich: vi.fn(),
    bloom: 'K2' as const,
    setBloom: vi.fn(),
    thema: '',
    setThema: vi.fn(),
    unterthema: '',
    setUnterthema: vi.fn(),
    tags: '',
    setTags: vi.fn(),
    zeitbedarf: 5,
    setZeitbedarf: vi.fn(),
    zeitbedarfManuell: false,
    setZeitbedarfManuell: vi.fn(),
    punkte: 1,
    setPunkte: vi.fn(),
    semester: [] as string[],
    setSemester: vi.fn(),
    gefaesse: ['SF'] as string[],
    setGefaesse: vi.fn(),
    geteilt: 'privat' as const,
    setGeteilt: vi.fn(),
    berechtigungen: [],
    setBerechtigungen: vi.fn(),
    ki: makeKiStub(),
    ...overrides,
  } as React.ComponentProps<typeof MetadataSection>
}

// --- Tests -----------------------------------------------------------------

describe('MetadataSection — Status-RadioGroup (Cluster D Phase 0)', () => {
  it('rendert Status-RadioGroup, Default "sammlung" für Legacy-Frage (undefined)', () => {
    renderInProvider(
      <MetadataSection {...baseProps({ status: undefined, setStatus: vi.fn() })} />,
    )
    const sammlungRadio = screen.getByRole('radio', { name: 'Sammlung' }) as HTMLInputElement
    const draftRadio = screen.getByRole('radio', { name: 'Entwurf' }) as HTMLInputElement
    expect(sammlungRadio.checked).toBe(true)
    expect(draftRadio.checked).toBe(false)
  })

  it('zeigt Entwurf gesetzt wenn status="draft"', () => {
    renderInProvider(
      <MetadataSection {...baseProps({ status: 'draft', setStatus: vi.fn() })} />,
    )
    const draftRadio = screen.getByRole('radio', { name: 'Entwurf' }) as HTMLInputElement
    expect(draftRadio.checked).toBe(true)
  })

  it('switched von Entwurf zu Sammlung (Click → setStatus)', () => {
    const setStatus = vi.fn()
    renderInProvider(
      <MetadataSection {...baseProps({ status: 'draft', setStatus })} />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Sammlung' }))
    expect(setStatus).toHaveBeenCalledWith('sammlung')
  })

  it('switched von Sammlung zu Entwurf (Click → setStatus)', () => {
    const setStatus = vi.fn()
    renderInProvider(
      <MetadataSection {...baseProps({ status: 'sammlung', setStatus })} />,
    )
    fireEvent.click(screen.getByRole('radio', { name: 'Entwurf' }))
    expect(setStatus).toHaveBeenCalledWith('draft')
  })

  it('rendert KEINE RadioGroup wenn setStatus nicht übergeben wurde (Opt-In für Hosts ohne Status-Support)', () => {
    renderInProvider(
      <MetadataSection {...baseProps()} />,
    )
    expect(screen.queryByRole('radio', { name: 'Sammlung' })).toBeNull()
    expect(screen.queryByRole('radio', { name: 'Entwurf' })).toBeNull()
  })
})
