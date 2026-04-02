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
