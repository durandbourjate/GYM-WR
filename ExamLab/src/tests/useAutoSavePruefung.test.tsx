/**
 * Integration-Tests: useAutoSavePruefung.ts
 *
 * Debounce-basierter Auto-Save-Hook (JSON-Diff-Erkennung). Fixiert das
 * Daten-Integritäts-Verhalten beim Editieren:
 *  - Eine Änderung löst nach `delayMs` genau EINEN Save aus (debounced).
 *  - Schnelle Folge-Änderungen verlieren den letzten Stand nicht: nur der
 *    letzte Timer überlebt, und onSave liest stets die aktuellste Closure.
 *  - markAsSaved verhindert einen redundanten Auto-Save direkt nach manuellem
 *    Speichern; cancelTimer bricht einen schwebenden Auto-Save ab (Race-Schutz).
 *  - Leerer Titel blockt den Auto-Save (Pflichtfeld-Guard).
 *
 * Fake-Timer steuern den Debounce; onSave ist ein Spy.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSavePruefung } from '../hooks/useAutoSavePruefung'
import type { PruefungsConfig } from '../types/pruefung'

function makePruefung(overrides: Partial<PruefungsConfig> = {}): PruefungsConfig {
  return { id: 'p1', titel: 'Meine Prüfung', ...overrides } as unknown as PruefungsConfig
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('useAutoSavePruefung — Debounce', () => {
  it('erste Änderung "armiert" nur (kein Save), zweite Änderung triggert nach delayMs genau einen Save', async () => {
    const onSave = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const { rerender } = renderHook(
      ({ pruefung }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      { initialProps: { pruefung: makePruefung({ titel: 'A' }) } },
    )

    // Erster Unterschied → hasChanged wird nur gesetzt, KEIN Timer.
    rerender({ pruefung: makePruefung({ titel: 'AB' }) })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onSave).not.toHaveBeenCalled()

    // Zweite (echte) Änderung → Debounce-Timer.
    rerender({ pruefung: makePruefung({ titel: 'ABC' }) })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('Save feuert nicht vor Ablauf des Debounce', async () => {
    const onSave = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const { rerender } = renderHook(
      ({ pruefung }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      { initialProps: { pruefung: makePruefung({ titel: 'A' }) } },
    )
    rerender({ pruefung: makePruefung({ titel: 'A1' }) }) // armiert
    rerender({ pruefung: makePruefung({ titel: 'A2' }) }) // Timer startet

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2999)
    })
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('schnelle Folge-Änderungen: nur EIN Save, und er sieht den AKTUELLSTEN onSave (kein Verlust des letzten Stands)', async () => {
    let letzterGespeicherterTitel = ''
    const { rerender } = renderHook(
      ({ pruefung, onSave }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      {
        initialProps: {
          pruefung: makePruefung({ titel: 'A' }),
          onSave: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
        },
      },
    )

    // armieren
    rerender({
      pruefung: makePruefung({ titel: 'A1' }),
      onSave: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    })

    // Vier schnelle Tipp-Änderungen; jede aktualisiert die onSave-Closure
    // (onSaveRef) auf den jeweils neuesten Titel.
    for (const titel of ['Hallo', 'Hallo W', 'Hallo Wel', 'Hallo Welt']) {
      const onSave = vi.fn<() => Promise<boolean>>().mockImplementation(async () => {
        letzterGespeicherterTitel = titel
        return true
      })
      rerender({ pruefung: makePruefung({ titel }), onSave })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500) // < delayMs → Timer wird je neu gesetzt
      })
    }

    // Jetzt den Debounce ablaufen lassen.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    // Genau ein effektiver Save, mit dem zuletzt getippten Stand.
    expect(letzterGespeicherterTitel).toBe('Hallo Welt')
  })

  it('Auto-Save wird geblockt, wenn der Titel leer/whitespace ist (Pflichtfeld-Guard)', async () => {
    const onSave = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const { rerender } = renderHook(
      ({ pruefung }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      { initialProps: { pruefung: makePruefung({ titel: 'Start' }) } },
    )
    rerender({ pruefung: makePruefung({ titel: '   ' }) }) // armiert (Diff)
    rerender({ pruefung: makePruefung({ titel: '' }) })    // Timer, aber leerer Titel

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('useAutoSavePruefung — markAsSaved / cancelTimer', () => {
  it('cancelTimer bricht einen schwebenden Auto-Save ab (Race-Schutz vor manuellem Save)', async () => {
    const onSave = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const { result, rerender } = renderHook(
      ({ pruefung }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      { initialProps: { pruefung: makePruefung({ titel: 'A' }) } },
    )
    rerender({ pruefung: makePruefung({ titel: 'A1' }) }) // armiert
    rerender({ pruefung: makePruefung({ titel: 'A2' }) }) // Timer läuft

    act(() => {
      result.current.cancelTimer()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('markAsSaved aktualisiert die Diff-Baseline: ein erneuter Render mit demselben Stand triggert keinen Save', async () => {
    const onSave = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const stand = makePruefung({ titel: 'Gespeichert' })
    const { result, rerender } = renderHook(
      ({ pruefung }) => useAutoSavePruefung({ pruefung, onSave, delayMs: 3000 }),
      { initialProps: { pruefung: makePruefung({ titel: 'Init' }) } },
    )
    // armieren mit dem Stand
    rerender({ pruefung: stand })

    // Manueller Save erfolgt extern → markAsSaved setzt Baseline auf `stand`.
    act(() => {
      result.current.markAsSaved(stand)
    })

    // Re-render mit exakt demselben Stand → JSON identisch zur Baseline → kein Save.
    rerender({ pruefung: makePruefung({ titel: 'Gespeichert' }) })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onSave).not.toHaveBeenCalled()
  })
})
