import { apiClient } from '../services/apiClient'
import type { Gruppe, Mitglied } from '../types/gruppen'
import type { CodeLoginResponse } from '../types/auth'
import type { GruppenService } from '../services/interfaces'

class AppsScriptGruppenAdapter implements GruppenService {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('lernplattform-auth')
      if (!stored) return undefined
      return JSON.parse(stored).sessionToken
    } catch {
      return undefined
    }
  }

  async ladeGruppen(email: string): Promise<Gruppe[]> {
    const response = await apiClient.post<{ success: boolean; data: Gruppe[] }>(
      'lernplattformLadeGruppen',
      { email },
      this.getToken()
    )
    return response?.data || []
  }

  async erstelleGruppe(
    gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>
  ): Promise<Gruppe> {
    const response = await apiClient.post<{ success: boolean; data: Gruppe }>(
      'lernplattformErstelleGruppe',
      { ...gruppe },
      this.getToken()
    )
    if (!response?.data) throw new Error('Gruppe konnte nicht erstellt werden')
    return response.data
  }

  async ladeMitglieder(gruppeId: string): Promise<Mitglied[]> {
    const response = await apiClient.post<{ success: boolean; data: Mitglied[] }>(
      'lernplattformLadeMitglieder',
      { gruppeId },
      this.getToken()
    )
    return response?.data || []
  }

  async einladen(gruppeId: string, email: string, name: string): Promise<void> {
    await apiClient.post(
      'lernplattformEinladen',
      { gruppeId, email, name },
      this.getToken()
    )
  }

  async entfernen(gruppeId: string, email: string): Promise<void> {
    await apiClient.post(
      'lernplattformEntfernen',
      { gruppeId, email },
      this.getToken()
    )
  }

  async generiereCode(gruppeId: string, email: string): Promise<string> {
    const response = await apiClient.post<{ success: boolean; data: { code: string } }>(
      'lernplattformGeneriereCode',
      { gruppeId, email },
      this.getToken()
    )
    if (!response?.data?.code) throw new Error('Code konnte nicht generiert werden')
    return response.data.code
  }

  async validiereCode(code: string): Promise<CodeLoginResponse> {
    const response = await apiClient.post<{
      success: boolean
      data: { email: string; name: string; sessionToken: string }
      error?: string
    }>('lernplattformCodeLogin', { code })

    return {
      erfolg: !!response?.success,
      email: response?.data?.email,
      name: response?.data?.name,
      fehler: response?.error,
    }
  }
}

export const gruppenAdapter = new AppsScriptGruppenAdapter()

// --- Fragen-Adapter: Pool-Daten für Gym, Mock für Kinder ---

import type { Frage, FragenFilter } from '../types/fragen'
import type { FragenService } from '../services/interfaces'
import { MOCK_FRAGEN } from './mockDaten'
import { PoolFragenAdapter } from './poolDaten'

class MockFragenAdapter implements FragenService {
  async ladeFragen(_gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    let fragen = [...MOCK_FRAGEN]
    if (filter?.fach) fragen = fragen.filter(f => f.fach === filter.fach)
    if (filter?.thema) fragen = fragen.filter(f => f.thema === filter.thema)
    if (filter?.schwierigkeit) fragen = fragen.filter(f => f.schwierigkeit === filter.schwierigkeit)
    if (filter?.nurUebung) fragen = fragen.filter(f => f.uebung)
    return fragen
  }

  async ladeThemen(_gruppeId: string, fach?: string): Promise<string[]> {
    let fragen: Frage[] = MOCK_FRAGEN
    if (fach) fragen = fragen.filter(f => f.fach === fach)
    return [...new Set(fragen.map(f => f.thema))]
  }
}

// Kombinations-Adapter: nutzt Pool-Daten + Mock-Kinder-Fragen
class KombinierterFragenAdapter implements FragenService {
  private poolAdapter = new PoolFragenAdapter()
  private mockAdapter = new MockFragenAdapter()

  async ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    // Pool-Fragen laden (Gym-SuS: VWL, BWL, Recht)
    const poolFragen = await this.poolAdapter.ladeFragen(gruppeId, filter)
    // Falls kein Fach-Filter oder Fach nicht in Pools → Mock dazu
    if (!filter?.fach || !['VWL', 'BWL', 'Recht'].includes(filter.fach)) {
      const mockFragen = await this.mockAdapter.ladeFragen(gruppeId, filter)
      return [...poolFragen, ...mockFragen]
    }
    return poolFragen
  }

  async ladeThemen(gruppeId: string, fach?: string): Promise<string[]> {
    const poolThemen = await this.poolAdapter.ladeThemen(gruppeId, fach)
    if (!fach || !['VWL', 'BWL', 'Recht'].includes(fach)) {
      const mockThemen = await this.mockAdapter.ladeThemen(gruppeId, fach)
      return [...new Set([...poolThemen, ...mockThemen])]
    }
    return poolThemen
  }
}

export const fragenAdapter: FragenService = new KombinierterFragenAdapter()
