// ExamLab/src/utils/batchExportLogic.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Frage } from '../types/fragen-storage'

vi.mock('../services/apiService', () => ({
  apiService: {
    schreibePoolAenderung: vi.fn(),
  },
}))
vi.mock('./poolExporter', () => ({
  konvertiereZuPoolFormat: vi.fn((f: Frage) => ({
    id: f.id,
    fragetext: 'mock-fragetext',
  })),
}))

import {
  erstelleAutoZuweisungen,
  fuehreBatchExportAus,
  type PoolEintrag,
} from './batchExportLogic'
import { apiService } from '../services/apiService'

const mkFrage = (overrides: Record<string, unknown> = {}): Frage => ({
  id: 'q1',
  typ: 'mc',
  fachbereich: 'wr',
  bloom: 'k1',
  fragetext: 'Test',
  ...overrides,
} as unknown as Frage)

const mkPool = (overrides: Partial<PoolEintrag> = {}): PoolEintrag => ({
  id: 'wr',
  file: 'wr.js',
  fach: 'wr',
  title: 'Wirtschaft & Recht',
  ...overrides,
})

describe('erstelleAutoZuweisungen', () => {
  it('matching fachbereich → poolId set + benoetigteTopicPools enthält pool', () => {
    const frage = mkFrage({ id: 'q1', fachbereich: 'wr' })
    const pool = mkPool({ id: 'wr', fach: 'wr' })
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['q1']),
      exportierbar: [frage],
      pools: [pool],
    })
    expect(result.zuweisungen.get('q1')).toEqual({ frageId: 'q1', poolId: 'wr', topic: '' })
    expect(result.benoetigteTopicPools).toEqual(['wr'])
  })

  it('no matching pool → empty poolId, kein TopicPool', () => {
    const frage = mkFrage({ id: 'q1', fachbereich: 'recht' })
    const pool = mkPool({ id: 'wr', fach: 'wr' })
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['q1']),
      exportierbar: [frage],
      pools: [pool],
    })
    expect(result.zuweisungen.get('q1')).toEqual({ frageId: 'q1', poolId: '', topic: '' })
    expect(result.benoetigteTopicPools).toEqual([])
  })

  it('gewaehlteIds nicht in exportierbar → übersprungen, kein crash', () => {
    const result = erstelleAutoZuweisungen({
      gewaehlteIds: new Set(['ghost']),
      exportierbar: [mkFrage({ id: 'q1' })],
      pools: [mkPool()],
    })
    expect(result.zuweisungen.size).toBe(0)
    expect(result.benoetigteTopicPools).toEqual([])
  })
})

describe('fuehreBatchExportAus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('empty zuweisungen → leere Result + onFortschritt(0,0) aufgerufen', async () => {
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map(),
      fragen: [],
      pools: [],
      email: 'lp@test',
      onFortschritt,
    })
    expect(result.ergebnisse).toEqual([])
    expect(result.erfolgreiche).toEqual([])
    expect(onFortschritt).toHaveBeenCalledWith(0, 0)
  })

  it('1 Frage success → 1 erfolgreich, korrekt zugeordnete poolId/hash', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: true,
      aktualisiert: 0,
      exportiert: 1,
      commitSha: 'sha-abc',
      exportierteIds: { '0': 'wr-001' },
      neueHashes: { '0': 'hash-abc' },
      fehler: [],
    })
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 'topic1' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt,
    })
    expect(result.ergebnisse).toHaveLength(1)
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1',
      erfolg: true,
      poolId: 'wr:wr-001',
      poolContentHash: 'hash-abc',
    })
    expect(result.erfolgreiche).toEqual([{
      frageId: 'q1', poolId: 'wr:wr-001', poolContentHash: 'hash-abc',
    }])
  })

  it('2 Fragen same pool → 1 API-Aufruf mit 2 änderungen, 2 erfolgreiche, onFortschritt-Reihenfolge [[0,2], [2,2]]', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: true,
      aktualisiert: 0,
      exportiert: 2,
      commitSha: 'sha-xy',
      exportierteIds: { '0': 'wr-001', '1': 'wr-002' },
      neueHashes: { '0': 'hash-1', '1': 'hash-2' },
      fehler: [],
    })
    const onFortschritt = vi.fn()
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([
        ['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }],
        ['q2', { frageId: 'q2', poolId: 'wr', topic: 't' }],
      ]),
      fragen: [mkFrage({ id: 'q1' }), mkFrage({ id: 'q2' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt,
    })
    expect(apiService.schreibePoolAenderung).toHaveBeenCalledTimes(1)
    expect(result.ergebnisse).toHaveLength(2)
    expect(result.ergebnisse.every(e => e.erfolg)).toBe(true)
    expect(onFortschritt.mock.calls).toEqual([[0, 2], [2, 2]])
  })

  it('API result.erfolg=false → alle markiert fehlgeschlagen mit fehler-Text', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockResolvedValue({
      erfolg: false,
      aktualisiert: 0,
      exportiert: 0,
      commitSha: '',
      exportierteIds: {},
      neueHashes: {},
      fehler: ['Pool gesperrt'],
    })
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt: vi.fn(),
    })
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1', erfolg: false, fehler: 'Pool gesperrt',
    })
    expect(result.erfolgreiche).toEqual([])
  })

  it('API throws → catch-Pfad, alle als Netzwerkfehler markiert', async () => {
    vi.mocked(apiService.schreibePoolAenderung).mockRejectedValue(new Error('boom'))
    const result = await fuehreBatchExportAus({
      zuweisungen: new Map([['q1', { frageId: 'q1', poolId: 'wr', topic: 't' }]]),
      fragen: [mkFrage({ id: 'q1' })],
      pools: [mkPool({ id: 'wr', file: 'wr.js' })],
      email: 'lp@test',
      onFortschritt: vi.fn(),
    })
    expect(result.ergebnisse[0]).toMatchObject({
      frageId: 'q1', erfolg: false, fehler: 'boom',
    })
  })
})
