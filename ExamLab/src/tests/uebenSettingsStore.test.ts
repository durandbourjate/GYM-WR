import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useUebenSettingsStore } from '../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../store/ueben/gruppenStore'
import { useUebenAuthStore } from '../store/ueben/authStore'
import { uebenGruppenAdapter } from '../adapters/ueben/appsScriptAdapter'
import type { GruppenEinstellungen } from '../types/ueben/settings'

const basisEinstellungen: GruppenEinstellungen = {
  anrede: 'sie',
  feedbackStil: 'sachlich',
  sichtbareFaecher: [],
  sichtbareThemen: {},
  fachFarben: {},
  maxAktiveThemen: 5,
}

describe('useUebenSettingsStore — Persistenz', () => {
  let speichereSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    // Store auf Ausgangszustand zurücksetzen
    useUebenSettingsStore.setState({
      einstellungen: null,
      ladeStatus: 'idle',
      saveFehler: null,
      speichertGerade: false,
    })
    useUebenGruppenStore.setState({
      aktiveGruppe: { id: 'test-gruppe', typ: 'gym', name: 'Test' },
    } as Parameters<typeof useUebenGruppenStore.setState>[0])
    useUebenAuthStore.setState({
      user: { email: 'lp@test.ch', name: 'LP' },
    } as Parameters<typeof useUebenAuthStore.setState>[0])

    speichereSpy = vi.spyOn(uebenGruppenAdapter, 'speichereEinstellungen')
      .mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
    speichereSpy.mockRestore()
  })

  it('setzeEinstellungen löst KEINEN Backend-Save aus (Load-Pfad)', async () => {
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    await vi.advanceTimersByTimeAsync(1000)
    expect(speichereSpy).not.toHaveBeenCalled()
  })

  it('aktualisiereEinstellungen: In-Memory sofort, Backend-Save nach Debounce', async () => {
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 7 })

    // In-Memory: sofort
    expect(useUebenSettingsStore.getState().einstellungen?.maxAktiveThemen).toBe(7)
    // Backend: noch nicht
    expect(speichereSpy).not.toHaveBeenCalled()

    // Nach Debounce
    await vi.advanceTimersByTimeAsync(500)
    expect(speichereSpy).toHaveBeenCalledTimes(1)
    expect(speichereSpy).toHaveBeenCalledWith(
      'test-gruppe',
      expect.objectContaining({ maxAktiveThemen: 7 }),
      'lp@test.ch',
    )
  })

  it('Mehrere schnelle Updates → ein einziger Save mit letztem Wert', async () => {
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 6 })
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 7 })
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 8 })

    await vi.advanceTimersByTimeAsync(500)
    expect(speichereSpy).toHaveBeenCalledTimes(1)
    expect(speichereSpy).toHaveBeenCalledWith(
      'test-gruppe',
      expect.objectContaining({ maxAktiveThemen: 8 }),
      'lp@test.ch',
    )
  })

  it('abbrecheSave verhindert ausstehenden Save', async () => {
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 9 })
    useUebenSettingsStore.getState().abbrecheSave()

    await vi.advanceTimersByTimeAsync(1000)
    expect(speichereSpy).not.toHaveBeenCalled()
  })

  it('Backend-Fehler landet in saveFehler', async () => {
    speichereSpy.mockRejectedValueOnce(new Error('Keine Berechtigung'))
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 7 })

    await vi.advanceTimersByTimeAsync(500)
    // Promise-Kette ausrollen
    await vi.runAllTimersAsync()

    expect(useUebenSettingsStore.getState().saveFehler).toBe('Keine Berechtigung')
    expect(useUebenSettingsStore.getState().speichertGerade).toBe(false)
    // In-Memory-Wert bleibt (kein Rollback)
    expect(useUebenSettingsStore.getState().einstellungen?.maxAktiveThemen).toBe(7)
  })

  it('resetSaveFehler löscht die Fehlermeldung', () => {
    useUebenSettingsStore.setState({ saveFehler: 'irgendwas' })
    useUebenSettingsStore.getState().resetSaveFehler()
    expect(useUebenSettingsStore.getState().saveFehler).toBeNull()
  })

  it('Kein Save wenn kein User oder keine Gruppe', async () => {
    useUebenAuthStore.setState({ user: null } as Parameters<typeof useUebenAuthStore.setState>[0])
    useUebenSettingsStore.getState().setzeEinstellungen(basisEinstellungen)
    useUebenSettingsStore.getState().aktualisiereEinstellungen({ maxAktiveThemen: 7 })

    await vi.advanceTimersByTimeAsync(1000)
    expect(speichereSpy).not.toHaveBeenCalled()
    // Optimistic Update bleibt trotzdem erhalten
    expect(useUebenSettingsStore.getState().einstellungen?.maxAktiveThemen).toBe(7)
  })
})
