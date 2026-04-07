import { uebenApiClient } from '../../services/ueben/apiClient'
import type { Gruppe, Mitglied } from '../../types/ueben/gruppen'
import type { CodeLoginResponse } from '../../types/ueben/auth'
import type { GruppenService } from '../../services/ueben/interfaces'
import { defaultEinstellungen, type GruppenEinstellungen } from '../../types/ueben/settings'

class AppsScriptGruppenAdapter implements GruppenService {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      if (!stored) return undefined
      return JSON.parse(stored).sessionToken
    } catch {
      return undefined
    }
  }

  private getEmail(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      return stored ? JSON.parse(stored).email : undefined
    } catch { return undefined }
  }

  async ladeGruppen(email: string): Promise<Gruppe[]> {
    const response = await uebenApiClient.post<{ success: boolean; data: Gruppe[] }>(
      'lernplattformLadeGruppen',
      { email },
      this.getToken()
    )
    return response?.data || []
  }

  async erstelleGruppe(
    gruppe: Omit<Gruppe, 'fragebankSheetId' | 'analytikSheetId'>
  ): Promise<Gruppe> {
    const response = await uebenApiClient.post<{ success: boolean; data: Gruppe }>(
      'lernplattformErstelleGruppe',
      { ...gruppe },
      this.getToken()
    )
    if (!response?.data) throw new Error('Gruppe konnte nicht erstellt werden')
    return response.data
  }

  async ladeMitglieder(gruppeId: string): Promise<Mitglied[]> {
    const response = await uebenApiClient.post<{ success: boolean; data: Mitglied[] }>(
      'lernplattformLadeMitglieder',
      { gruppeId, email: this.getEmail() },
      this.getToken()
    )
    return response?.data || []
  }

  async einladen(gruppeId: string, email: string, name: string): Promise<void> {
    await uebenApiClient.post(
      'lernplattformEinladen',
      { gruppeId, mitgliedEmail: email, adminEmail: this.getEmail(), name },
      this.getToken()
    )
  }

  async entfernen(gruppeId: string, email: string): Promise<void> {
    await uebenApiClient.post(
      'lernplattformEntfernen',
      { gruppeId, mitgliedEmail: email, adminEmail: this.getEmail() },
      this.getToken()
    )
  }

  async umbenneGruppe(gruppeId: string, neuerName: string): Promise<void> {
    const response = await uebenApiClient.post<{ success: boolean; error?: string }>(
      'lernplattformUmbenneGruppe',
      { gruppeId, neuerName, adminEmail: this.getEmail() },
      this.getToken()
    )
    if (response && !response.success) throw new Error(response.error || 'Umbenennen fehlgeschlagen')
  }

  async aendereRolle(gruppeId: string, mitgliedEmail: string, neueRolle: 'admin' | 'lernend'): Promise<void> {
    const response = await uebenApiClient.post<{ success: boolean; error?: string }>(
      'lernplattformAendereRolle',
      { gruppeId, mitgliedEmail, neueRolle, adminEmail: this.getEmail() },
      this.getToken()
    )
    if (response && !response.success) throw new Error(response.error || 'Rolle ändern fehlgeschlagen')
  }

  async generiereCode(gruppeId: string, email: string): Promise<string> {
    const response = await uebenApiClient.post<{ success: boolean; data: { code: string } }>(
      'lernplattformGeneriereCode',
      { gruppeId, mitgliedEmail: email, adminEmail: this.getEmail() },
      this.getToken()
    )
    if (!response?.data?.code) throw new Error('Code konnte nicht generiert werden')
    return response.data.code
  }

  async validiereCode(code: string): Promise<CodeLoginResponse> {
    const response = await uebenApiClient.post<{
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

  async ladeEinstellungen(gruppeId: string): Promise<GruppenEinstellungen> {
    const response = await uebenApiClient.post<{ success: boolean; data: GruppenEinstellungen }>(
      'lernplattformLadeEinstellungen', { gruppeId }, this.getToken()
    )
    return response?.data || defaultEinstellungen('gym')
  }

  async speichereEinstellungen(gruppeId: string, einstellungen: GruppenEinstellungen, email: string): Promise<void> {
    const response = await uebenApiClient.post<{ success: boolean; error?: string }>(
      'lernplattformSpeichereEinstellungen', { gruppeId, einstellungen, email }, this.getToken()
    )
    if (response && !response.success) throw new Error(response.error || 'Speichern fehlgeschlagen')
  }
}

export const uebenGruppenAdapter = new AppsScriptGruppenAdapter()

// --- Fragen-Adapter: Lädt Fragen aus Google Sheets via Apps Script ---

import type { Frage, FragenFilter } from '../../types/ueben/fragen'
import type { FragenService } from '../../services/ueben/interfaces'

class AppsScriptFragenAdapter implements FragenService {
  private cache: Map<string, Frage[]> = new Map()

  async ladeFragen(gruppeId: string, filter?: FragenFilter): Promise<Frage[]> {
    let fragen = this.cache.get(gruppeId)
    if (!fragen) {
      const token = this.getToken()
      const response = await uebenApiClient.post<{ success: boolean; data: Frage[] }>(
        'lernplattformLadeFragen', { gruppeId }, token
      )
      fragen = response?.data || []
      this.cache.set(gruppeId, fragen)
    }
    let result = [...fragen]
    if (filter?.fach) result = result.filter(f => f.fach === filter.fach)
    if (filter?.thema) result = result.filter(f => f.thema === filter.thema)
    if (filter?.schwierigkeit) result = result.filter(f => f.schwierigkeit === filter.schwierigkeit)
    return result
  }

  async ladeThemen(gruppeId: string, fach?: string): Promise<string[]> {
    const fragen = await this.ladeFragen(gruppeId)
    let gefiltert = fragen
    if (fach) gefiltert = gefiltert.filter(f => f.fach === fach)
    return [...new Set(gefiltert.map(f => f.thema))]
  }

  async speichereFrage(gruppeId: string, frage: Frage): Promise<{ success: boolean; id: string }> {
    const token = this.getToken()
    const email = this.getEmail()
    const response = await uebenApiClient.post<{ success: boolean; id: string }>(
      'lernplattformSpeichereFrage',
      { gruppeId, frage, email },
      token
    )
    if (!response?.success) throw new Error('Frage speichern fehlgeschlagen')
    this.invalidateCache(gruppeId)
    return response
  }

  async loescheFrage(gruppeId: string, frageId: string, fachbereich: string): Promise<boolean> {
    const token = this.getToken()
    const email = this.getEmail()
    const response = await uebenApiClient.post<{ success: boolean }>(
      'lernplattformLoescheFrage',
      { gruppeId, frageId, fachbereich, email },
      token
    )
    if (!response?.success) throw new Error('Frage löschen fehlgeschlagen')
    this.invalidateCache(gruppeId)
    return true
  }

  invalidateCache(gruppeId?: string) {
    if (gruppeId) this.cache.delete(gruppeId)
    else this.cache.clear()
  }

  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      return stored ? JSON.parse(stored).sessionToken : undefined
    } catch { return undefined }
  }

  private getEmail(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      return stored ? JSON.parse(stored).email : undefined
    } catch { return undefined }
  }
}

export const uebenFragenAdapter: FragenService = new AppsScriptFragenAdapter()

// --- Fortschritt-Adapter: Gruppen-Fortschritt + Lernziele ---

import type { Lernziel } from '@shared/types/fragen'
import type { FragenFortschritt, SessionEintrag } from '../../types/ueben/fortschritt'
import type { FortschrittService } from '../../services/ueben/interfaces'

class AppsScriptFortschrittAdapter implements FortschrittService {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      return stored ? JSON.parse(stored).sessionToken : undefined
    } catch { return undefined }
  }

  private getEmail(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      return stored ? JSON.parse(stored).email : undefined
    } catch { return undefined }
  }

  async ladeGruppenFortschritt(gruppeId: string): Promise<{
    fortschritte: FragenFortschritt[]
    sessions: SessionEintrag[]
  }> {
    const response = await uebenApiClient.post<{
      success: boolean
      data: { fortschritte: FragenFortschritt[]; sessions: SessionEintrag[] }
      error?: string
    }>('lernplattformLadeGruppenFortschritt', { gruppeId, email: this.getEmail() }, this.getToken())

    if (!response?.success) throw new Error(response?.error || 'Fortschritt laden fehlgeschlagen')
    return response.data
  }

  async ladeLernziele(gruppeId: string): Promise<Lernziel[]> {
    const response = await uebenApiClient.post<{
      success: boolean
      data: Lernziel[]
      error?: string
    }>('lernplattformLadeLernzieleV2', { gruppeId, email: this.getEmail() }, this.getToken())

    return response?.data || []
  }

  async speichereFortschritt(
    gruppeId: string,
    email: string,
    fortschritte: { fragenId: string; korrekt: boolean; sessionId: string }[],
  ): Promise<boolean> {
    if (fortschritte.length === 0) return true
    const response = await uebenApiClient.post<{ success: boolean; error?: string }>(
      'lernplattformSpeichereFortschritt',
      { gruppeId, email, fortschritte },
      this.getToken()
    )
    return response?.success ?? false
  }

  async speichereLernziel(gruppeId: string, lernziel: Lernziel): Promise<{ id: string }> {
    const response = await uebenApiClient.post<{
      success: boolean
      data: { id: string }
      error?: string
    }>('lernplattformSpeichereLernziel', { gruppeId, lernziel, email: this.getEmail() }, this.getToken())

    if (!response?.success) throw new Error(response?.error || 'Lernziel speichern fehlgeschlagen')
    return response.data
  }
}

export const uebenFortschrittAdapter: FortschrittService = new AppsScriptFortschrittAdapter()

// ──────────────────────────────────────────────
// Themen-Sichtbarkeit Adapter
// ──────────────────────────────────────────────

import type { ThemenFreischaltung, ThemenStatus, AktivierungsTyp } from '../../types/ueben/themenSichtbarkeit'

class AppsScriptThemenSichtbarkeitAdapter {
  private getToken(): string | undefined {
    try {
      const stored = localStorage.getItem('ueben-auth')
      if (!stored) return undefined
      return JSON.parse(stored).sessionToken
    } catch {
      return undefined
    }
  }

  async ladeFreischaltungen(gruppeId: string): Promise<ThemenFreischaltung[]> {
    const response = await uebenApiClient.post<{ success: boolean; data: ThemenFreischaltung[] }>(
      'lernplattformLadeThemenSichtbarkeit',
      { gruppeId },
      this.getToken()
    )
    return response?.data || []
  }

  async setzeStatus(
    gruppeId: string,
    fach: string,
    thema: string,
    status: ThemenStatus,
    aktiviertVon: string,
    typ: AktivierungsTyp = 'manuell',
    unterthemen?: string[],
  ): Promise<boolean> {
    const response = await uebenApiClient.post<{ success: boolean }>(
      'lernplattformSetzeThemenStatus',
      { gruppeId, fach, thema, status, aktiviertVon, typ, ...(unterthemen ? { unterthemen } : {}) },
      this.getToken()
    )
    return response?.success ?? false
  }
}

export const uebenThemenSichtbarkeitAdapter = new AppsScriptThemenSichtbarkeitAdapter()
