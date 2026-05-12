import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const stammdatenStub = { kurse: [{ id: 'sf-wr-29c', name: 'SF WR 29c', fach: 'WR', fachschaft: 'WR', gefaess: 'SF', klassen: ['29c'] }], fachschaften: [], gefaesse: [] }
const lpProfilStubKeinTestdaten = { email: 'wr@test.ch', kursIds: ['sf-wr-29c'], testdatenSichtbar: false }
const lpProfilStubMitTestdaten = { ...lpProfilStubKeinTestdaten, testdatenSichtbar: true }

const configsStub = [
  { id: 'p1', titel: 'Bilanz', typ: 'summativ', klasse: '29c' } as any,
  { id: 'u1', titel: 'Übung A', typ: 'formativ', klasse: '29c' } as any,
  { id: 'test-p2', titel: 'Test-Pruefung', typ: 'summativ', klasse: 'test-klasse-01' } as any,
]
const fragenStub = [
  { id: 'f1', fragetext: 'Was ist Bilanz?', tags: [], thema: 'BWL' } as any,
  { id: 'test-f2', fragetext: 'Test-Frage', tags: [], thema: 'BWL' } as any,
]

let lpProfilCurrent: typeof lpProfilStubKeinTestdaten = lpProfilStubKeinTestdaten

vi.mock('../store/stammdatenStore', () => ({
  useStammdatenStore: (sel: any) => sel({
    stammdaten: stammdatenStub,
    lpProfil: lpProfilCurrent,
    istAdmin: () => false,
  }),
}))
vi.mock('../store/configsListStore', () => ({
  useConfigsListStore: (sel: any) => sel({ configs: configsStub, istGeladen: true }),
}))
vi.mock('../store/fragensammlungStore', () => ({
  useFragensammlungStore: (sel: any) => sel({ summaries: fragenStub }),
}))
vi.mock('../store/authStore', () => ({
  useAuthStore: (sel: any) => sel({ user: { email: 'wr@test.ch', rolle: 'lp' } }),
}))
vi.mock('../utils/tabRegistry', async () => {
  const actual = await vi.importActual<typeof import('../utils/tabRegistry')>('../utils/tabRegistry')
  return actual
})

import { useSucheIndex } from './useSucheIndex'

describe('useSucheIndex', () => {
  beforeEach(() => {
    lpProfilCurrent = lpProfilStubKeinTestdaten
  })

  it('liefert alle 6 Quellen', () => {
    const { result } = renderHook(() => useSucheIndex())
    expect(result.current.einstellungenTabs.length).toBeGreaterThan(0)
    expect(result.current.hilfeTabs.length).toBeGreaterThan(0)
    expect(result.current.kurse).toHaveLength(1)
    expect(result.current.pruefungen).toHaveLength(1)
    expect(result.current.uebungen).toHaveLength(1)
    expect(result.current.fragen).toHaveLength(1)
  })

  it('Cluster F: testdatenSichtbar=false filtert test-prefixed Records', () => {
    lpProfilCurrent = lpProfilStubKeinTestdaten
    const { result } = renderHook(() => useSucheIndex())
    // test-p2 (Pruefung mit klasse=test-klasse-01) ist gefiltert
    expect(result.current.pruefungen.map(p => p.id)).toEqual(['p1'])
    // test-f2 (Frage mit id-prefix 'test-') ist gefiltert
    expect(result.current.fragen.map(f => f.id)).toEqual(['f1'])
  })

  it('Cluster F: testdatenSichtbar=true zeigt alle Records', () => {
    lpProfilCurrent = lpProfilStubMitTestdaten
    const { result } = renderHook(() => useSucheIndex())
    expect(result.current.pruefungen.map(p => p.id).sort()).toEqual(['p1', 'test-p2'])
    expect(result.current.fragen.map(f => f.id).sort()).toEqual(['f1', 'test-f2'])
  })
})
