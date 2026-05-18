import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOpenFavorit } from './useOpenFavorit'
import { useLPNavigationStore } from '../store/lpUIStore'

/**
 * Unit-Tests für useOpenFavorit (Cluster E.5 Spawn-Task, 17.05.2026).
 * Browser-Integrationspfade laufen über Favoriten.test.tsx — hier nur API-Contract.
 */
describe('useOpenFavorit — resolveFavorit', () => {
  beforeEach(() => {
    // Reset relevante lpUIStore-Felder vor jedem Test
    useLPNavigationStore.setState({ zeigHilfe: false, zeigEinstellungen: false, einstellungenTab: null })
  })

  it("typ='ort' → navigate to ziel (raw path)", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'ort', ziel: '/fragensammlung', label: 'X', sortierung: 0 })
    expect(r).toEqual({ kind: 'navigate', to: '/fragensammlung' })
  })

  it("typ='frage' → navigate to /fragensammlung/{ziel}", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'frage', ziel: 'abc-123', label: 'X', sortierung: 0 })
    expect(r).toEqual({ kind: 'navigate', to: '/fragensammlung/abc-123' })
  })

  it("typ='pruefung' → navigate to /pruefung?id={ziel}", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'pruefung', ziel: 'p1', label: 'X', sortierung: 0 })
    expect(r).toEqual({ kind: 'navigate', to: '/pruefung?id=p1' })
  })

  it("typ='uebung' → navigate to /uebung?id={ziel}", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'uebung', ziel: 'u1', label: 'X', sortierung: 0 })
    expect(r).toEqual({ kind: 'navigate', to: '/uebung?id=u1' })
  })

  it("typ='einstellungen-tab' → action setzt zeigEinstellungen=true + tab", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'einstellungen-tab', ziel: 'tags', label: 'X', sortierung: 0 })
    expect(r.kind).toBe('action')
    if (r.kind === 'action') act(() => r.onClick())
    const state = useLPNavigationStore.getState()
    expect(state.zeigEinstellungen).toBe(true)
    expect(state.einstellungenTab).toBe('tags')
  })

  it("typ='einstellungen-tab' mit 'ki-kalibrierung' → setzt 'ki-kalibrierung' direkt (kein Drift-Mapping mehr)", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'einstellungen-tab', ziel: 'ki-kalibrierung', label: 'X', sortierung: 0 })
    if (r.kind === 'action') act(() => r.onClick())
    expect(useLPNavigationStore.getState().einstellungenTab).toBe('ki-kalibrierung')
  })

  it("typ='hilfe-tab' → action setzt initialHilfeKategorie + toggelt Hilfe (von false → true)", () => {
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'hilfe-tab', ziel: 'einstieg', label: 'X', sortierung: 0 })
    expect(r.kind).toBe('action')
    if (r.kind === 'action') act(() => r.onClick())
    expect(result.current.initialHilfeKategorie).toBe('einstieg')
    expect(useLPNavigationStore.getState().zeigHilfe).toBe(true)
  })

  it("typ='hilfe-tab' bei zeigHilfe=true → nur Kategorie wechseln, kein Toggle", () => {
    useLPNavigationStore.setState({ zeigHilfe: true })
    const { result } = renderHook(() => useOpenFavorit())
    const r = result.current.resolveFavorit({ typ: 'hilfe-tab', ziel: 'support', label: 'X', sortierung: 0 })
    if (r.kind === 'action') act(() => r.onClick())
    expect(result.current.initialHilfeKategorie).toBe('support')
    // zeigHilfe darf nicht zurück auf false geschaltet werden
    expect(useLPNavigationStore.getState().zeigHilfe).toBe(true)
  })

  it('setInitialHilfeKategorie(undefined) reset den Wert', () => {
    const { result } = renderHook(() => useOpenFavorit())
    act(() => result.current.setInitialHilfeKategorie('xy'))
    expect(result.current.initialHilfeKategorie).toBe('xy')
    act(() => result.current.setInitialHilfeKategorie(undefined))
    expect(result.current.initialHilfeKategorie).toBe(undefined)
  })
})
