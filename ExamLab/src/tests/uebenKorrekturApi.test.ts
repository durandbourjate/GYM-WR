import { describe, it, expect, beforeEach, vi } from 'vitest'
import { uebenApiClient } from '../services/ueben/apiClient'
import { pruefeAntwortApi } from '../services/uebenKorrekturApi'
import type { Antwort } from '../types/antworten'

describe('uebenKorrekturApi.pruefeAntwortApi', () => {
  const basisParams = {
    gruppeId: 'test-gruppe',
    frageId: 'f1',
    antwort: { typ: 'mc', gewaehlteOptionen: ['o1'] } as Antwort,
    email: 'sus@stud.gymhofwil.ch',
    token: 'session-token-xyz',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('ruft lernplattformPruefeAntwort mit korrektem Payload', async () => {
    const postSpy = vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: true,
      korrekt: true,
      musterlosung: 'A ist korrekt',
    } as unknown as null)

    const result = await pruefeAntwortApi(basisParams)

    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(postSpy).toHaveBeenCalledWith(
      'lernplattformPruefeAntwort',
      {
        gruppeId: 'test-gruppe',
        frageId: 'f1',
        antwort: { typ: 'mc', gewaehlteOptionen: ['o1'] },
        email: 'sus@stud.gymhofwil.ch',
      },
      'session-token-xyz',
    )
    expect(result.success).toBe(true)
    expect(result.korrekt).toBe(true)
    expect(result.musterlosung).toBe('A ist korrekt')
  })

  it('wirft bei success:false mit Backend-Error', async () => {
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: false,
      error: 'Rate limit exceeded',
    } as unknown as null)

    await expect(pruefeAntwortApi(basisParams)).rejects.toThrow('Rate limit exceeded')
  })

  it('wirft bei null-Response (Netzwerk-Fehler)', async () => {
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue(null)
    await expect(pruefeAntwortApi(basisParams)).rejects.toThrow('Prüfung fehlgeschlagen')
  })

  it('liefert Selbstbewertungs-Resultat unverändert zurück', async () => {
    vi.spyOn(uebenApiClient, 'post').mockResolvedValue({
      success: true,
      selbstbewertung: true,
      musterlosung: 'Lang-Musterlösung…',
    } as unknown as null)

    const result = await pruefeAntwortApi(basisParams)
    expect(result.selbstbewertung).toBe(true)
    expect(result.korrekt).toBeUndefined()
    expect(result.musterlosung).toBe('Lang-Musterlösung…')
  })
})
