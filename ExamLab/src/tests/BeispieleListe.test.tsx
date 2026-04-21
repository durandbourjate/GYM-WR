/**
 * Tests für BeispieleListe — Filter, Stern-Toggle, Löschen
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BeispieleListe from '../components/settings/kiKalibrierung/BeispieleListe'
import * as kalibrierungApiModule from '../services/kalibrierungApi'

vi.mock('../services/kalibrierungApi', () => ({
  kalibrierungApi: {
    listeFeedbacks: vi.fn(),
    aktualisiereFeedback: vi.fn(),
    loescheFeedback: vi.fn(),
  }
}))

// DiffModal mocken damit kein rendering-Problem entsteht
vi.mock('../components/settings/kiKalibrierung/DiffModal', () => ({
  default: () => null,
}))

const mockEintrag = {
  feedbackId: 'fb_test_001',
  zeitstempel: '2026-04-21T10:00:00Z',
  aktion: 'generiereMusterloesung',
  fachbereich: 'VWL',
  bloom: 'K2',
  inputJson: { fragetext: 'Was ist das BIP?' },
  kiOutputJson: { loesung: 'KI-Vorschlag' },
  finaleVersionJson: { loesung: 'LP-Endversion' },
  diffScore: 0.2,
  status: 'geschlossen' as const,
  qualifiziert: true,
  wichtig: false,
  aktiv: true,
}

describe('BeispieleListe', () => {
  const api = kalibrierungApiModule.kalibrierungApi

  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.listeFeedbacks as ReturnType<typeof vi.fn>).mockResolvedValue({ eintraege: [mockEintrag], gesamt: 1 })
  })

  it('ruft listeFeedbacks beim Mount mit Default-Filter', async () => {
    render(<BeispieleListe email="test@gymhofwil.ch" />)
    await waitFor(() => expect(api.listeFeedbacks).toHaveBeenCalled())
    // Default-Filter ist status='qualifiziert' → wird als Frontend-Nachfilter behandelt
    // Backend-Call enthält KEIN status-Feld
    const call = (api.listeFeedbacks as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call[0]).toBe('test@gymhofwil.ch')
    expect(call[1].status).toBeUndefined()
  })

  it('filtert nach Aktion und resettet Seite', async () => {
    render(<BeispieleListe email="test@gymhofwil.ch" />)
    await waitFor(() => expect(api.listeFeedbacks).toHaveBeenCalled())
    const aktionSelect = screen.getByDisplayValue('Alle Aktionen') as HTMLSelectElement
    fireEvent.change(aktionSelect, { target: { value: 'klassifiziereFrage' } })
    await waitFor(() => {
      const calls = (api.listeFeedbacks as ReturnType<typeof vi.fn>).mock.calls
      const letzterCall = calls[calls.length - 1]
      expect(letzterCall[1].aktion).toBe('klassifiziereFrage')
      expect(letzterCall[2]).toBe(0) // Seite zurückgesetzt
    })
  })

  it('ruft aktualisiereFeedback bei Stern-Toggle', async () => {
    ;(api.aktualisiereFeedback as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    render(<BeispieleListe email="test@gymhofwil.ch" />)
    await waitFor(() => expect(screen.getByText('Was ist das BIP?')).toBeInTheDocument())

    const sternButton = screen.getByTitle('Als wichtig markieren')
    fireEvent.click(sternButton)

    await waitFor(() => {
      expect(api.aktualisiereFeedback).toHaveBeenCalledWith(
        'test@gymhofwil.ch',
        'fb_test_001',
        { wichtig: true }
      )
    })
  })

  it('ruft loescheFeedback nach Confirm bei Löschen', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    ;(api.loescheFeedback as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    render(<BeispieleListe email="test@gymhofwil.ch" />)
    await waitFor(() => expect(screen.getByText('Was ist das BIP?')).toBeInTheDocument())

    const loeschButton = screen.getByTitle('Löschen')
    fireEvent.click(loeschButton)

    await waitFor(() => {
      expect(api.loescheFeedback).toHaveBeenCalledWith('test@gymhofwil.ch', 'fb_test_001')
    })
  })
})
