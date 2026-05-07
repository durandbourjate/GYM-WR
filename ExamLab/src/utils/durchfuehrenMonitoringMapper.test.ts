import { describe, it, expect } from 'vitest'
import { mappeMonitoringResult } from './durchfuehrenMonitoringMapper'
import type { MonitoringDaten } from '../types/monitoring'

describe('mappeMonitoringResult', () => {
  it('returns leeres MonitoringDaten when raw is null', () => {
    const result = mappeMonitoringResult(null)
    expect(result).toEqual({ pruefungTitel: '', schueler: [], gesamtSus: 0 })
  })

  it('mapt minimalen Schueler korrekt', () => {
    const raw = {
      pruefungTitel: 'Test',
      schueler: [{ email: 'a@b.ch', name: 'Ana' }],
      gesamtSus: 1,
    } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.pruefungTitel).toBe('Test')
    expect(result.schueler).toHaveLength(1)
    expect(result.schueler[0]).toMatchObject({
      email: 'a@b.ch',
      name: 'Ana',
      status: 'nicht-gestartet',
      beantworteteFragen: 0,
      gesamtFragen: 0,
      heartbeats: 0,
      netzwerkFehler: 0,
      autoSaveCount: 0,
      verstossZaehler: 0,
      gesperrt: false,
      vollbild: false,
      unterbrechungen: [],
      verstoesse: [],
    })
  })

  it('erkennt status="abgegeben" via abgabezeit', () => {
    const raw = { schueler: [{ email: 'x', abgabezeit: '2026-05-06T10:00' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('erkennt status="abgegeben" via istAbgabe="true"', () => {
    const raw = { schueler: [{ email: 'x', istAbgabe: 'true' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('erkennt status="abgegeben" via istAbgegeben=true (boolean)', () => {
    const raw = { schueler: [{ email: 'x', istAbgegeben: true }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].status).toBe('abgegeben')
  })

  it('parst verstoesse als Array wenn String mit JSON', () => {
    const raw = { schueler: [{ email: 'x', verstoesse: '[{"typ":"tab"}]' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].verstoesse).toEqual([{ typ: 'tab' }])
  })

  it('parst verstoesse als leeres Array bei JSON-Parse-Error', () => {
    const raw = { schueler: [{ email: 'x', verstoesse: 'invalid-json' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].verstoesse).toEqual([])
  })

  it('berechnet gesamtSus aus schueler.length wenn nicht gesetzt', () => {
    const raw = { schueler: [{ email: 'a' }, { email: 'b' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.gesamtSus).toBe(2)
  })

  it('berechnet aktuelleFrage als number wenn string', () => {
    const raw = { schueler: [{ email: 'x', aktuelleFrage: '5' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].aktuelleFrage).toBe(5)
  })

  it('setzt aktuelleFrage auf null bei leerem String', () => {
    const raw = { schueler: [{ email: 'x', aktuelleFrage: '' }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0].aktuelleFrage).toBe(null)
  })

  it('mapt Lockdown-Felder (B19-Fix)', () => {
    const raw = { schueler: [{
      email: 'x',
      geraet: 'tablet',
      vollbild: 'true',
      kontrollStufe: 'streng',
      verstossZaehler: 3,
      gesperrt: true,
    }] } as unknown as MonitoringDaten
    const result = mappeMonitoringResult(raw)
    expect(result.schueler[0]).toMatchObject({
      geraet: 'tablet',
      vollbild: true,
      kontrollStufe: 'streng',
      verstossZaehler: 3,
      gesperrt: true,
    })
  })
})
