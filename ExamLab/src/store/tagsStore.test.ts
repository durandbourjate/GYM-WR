import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTagsStore, useTagsByIds } from './tagsStore'
import * as tagsApi from '../services/tagsApi'
import type { Tag } from '@shared/types/tag'

vi.mock('../services/tagsApi', () => ({
  listeTags: vi.fn().mockResolvedValue([
    { id: 't1', name: 'aktuell', farbe: 'slate', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
    { id: 't2', name: 'schwer', farbe: 'red', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
  ]),
}))

// Spawn-Task 17.05.2026: Standard-Mock-Reset (Error-Cases ueberschreiben pro Test).
const DEFAULT_TAGS: Tag[] = [
  { id: 't1', name: 'aktuell', farbe: 'slate', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
  { id: 't2', name: 'schwer', farbe: 'red', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
]

describe('tagsStore', () => {
  beforeEach(() => {
    useTagsStore.setState({ tags: [], geladen: false, ladend: false, fehler: null })
    vi.mocked(tagsApi.listeTags).mockClear()
    vi.mocked(tagsApi.listeTags).mockResolvedValue(DEFAULT_TAGS)
  })

  it('ladeAlleTags füllt Store', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().tags).toHaveLength(2)
    expect(useTagsStore.getState().geladen).toBe(true)
  })

  it('getById findet Tag', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const tag = useTagsStore.getState().getById('t1')
    expect(tag?.name).toBe('aktuell')
  })

  it('getById gibt undefined für unbekannte id', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().getById('xxx')).toBeUndefined()
  })

  it('getByIds filtert orphans raus', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const result = useTagsStore.getState().getByIds(['t1', 'orphan', 't2'])
    expect(result.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('getByName ist case-insensitive', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().getByName('AKTUELL')?.id).toBe('t1')
  })

  it('upsertLokal fügt neuen hinzu', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const neu: Tag = { id: 't3', name: 'neu', farbe: 'sky', archiviert: false, erstelltAm: '2026-01-02', erstelltVon: 'a@b' }
    useTagsStore.getState().upsertLokal(neu)
    expect(useTagsStore.getState().tags).toHaveLength(3)
    expect(useTagsStore.getState().getById('t3')?.name).toBe('neu')
  })

  it('upsertLokal updated existierenden', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const aktualisiert: Tag = { id: 't1', name: 'aktualisiert', farbe: 'pink', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' }
    useTagsStore.getState().upsertLokal(aktualisiert)
    expect(useTagsStore.getState().tags).toHaveLength(2)
    expect(useTagsStore.getState().getById('t1')?.name).toBe('aktualisiert')
  })

  it('entferneLokal entfernt nach id', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    useTagsStore.getState().entferneLokal('t1')
    expect(useTagsStore.getState().tags).toHaveLength(1)
  })

  // === Spawn-Task 17.05.2026 — Error-Pfad + Re-entry + Edge-Cases ===

  it('ladeAlleTags: Error-Pfad setzt fehler + ladend=false', async () => {
    vi.mocked(tagsApi.listeTags).mockRejectedValueOnce(new Error('Network down'))
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const state = useTagsStore.getState()
    expect(state.tags).toHaveLength(0)
    expect(state.geladen).toBe(false)
    expect(state.ladend).toBe(false)
    expect(state.fehler).toContain('Network down')
  })

  it('ladeAlleTags: Re-entry-Guard verhindert parallele Calls', async () => {
    // Erster Call setzt ladend=true und stalled (Promise resolved nie)
    let resolveFirst: ((v: Tag[]) => void) | undefined
    vi.mocked(tagsApi.listeTags).mockImplementationOnce(
      () => new Promise<Tag[]>((res) => { resolveFirst = res }),
    )
    const firstCall = useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().ladend).toBe(true)

    // Zweiter Call waehrend ladend muss sofort returnen (no-op).
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(vi.mocked(tagsApi.listeTags)).toHaveBeenCalledTimes(1)

    // Cleanup: Promise abschliessen + first call await
    resolveFirst!(DEFAULT_TAGS)
    await firstCall
    expect(useTagsStore.getState().ladend).toBe(false)
  })

  it('getByIds: leeres Array liefert leeres Array', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().getByIds([])).toEqual([])
  })

  it('getByIds: nur-orphans liefert leeres Array', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().getByIds(['x', 'y'])).toEqual([])
  })

  it('getByIds: behaelt Reihenfolge der Input-IDs', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const result = useTagsStore.getState().getByIds(['t2', 't1'])
    expect(result.map((t) => t.id)).toEqual(['t2', 't1'])
  })

  it('getByName: leeres String returnt undefined wenn kein Tag mit name="" existiert', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(useTagsStore.getState().getByName('')).toBeUndefined()
  })

  it('getByName: trimmed-not — Whitespace im Query matched nicht', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    // Bewusster Test: kein trim() im Store, Caller muss vorher trimmen.
    expect(useTagsStore.getState().getByName(' aktuell ')).toBeUndefined()
  })

  it('upsertLokal auf leerem Store funktioniert', () => {
    const neu: Tag = { id: 'tn', name: 'first', farbe: 'sky', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' }
    useTagsStore.getState().upsertLokal(neu)
    expect(useTagsStore.getState().tags).toHaveLength(1)
  })

  it('entferneLokal: nicht-existente id ist no-op', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    const vor = useTagsStore.getState().tags.length
    useTagsStore.getState().entferneLokal('orphan')
    expect(useTagsStore.getState().tags).toHaveLength(vor)
  })

  it('ladeAlleTags zweimal nacheinander (sequentiell) laedt zweimal', async () => {
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(vi.mocked(tagsApi.listeTags)).toHaveBeenCalledTimes(1)
    await useTagsStore.getState().ladeAlleTags({ email: 'test@test' })
    expect(vi.mocked(tagsApi.listeTags)).toHaveBeenCalledTimes(2)
  })
})

// === Spawn-Task 17.05.2026 — useTagsByIds Hook ===

describe('useTagsByIds', () => {
  beforeEach(() => {
    useTagsStore.setState({ tags: [], geladen: false, ladend: false, fehler: null })
    vi.mocked(tagsApi.listeTags).mockClear()
    vi.mocked(tagsApi.listeTags).mockResolvedValue(DEFAULT_TAGS)
  })

  it('liefert leeres Array bei undefined ids', () => {
    const { result } = renderHook(() => useTagsByIds(undefined))
    expect(result.current).toEqual([])
  })

  it('liefert leeres Array bei leerem ids-Array', () => {
    const { result } = renderHook(() => useTagsByIds([]))
    expect(result.current).toEqual([])
  })

  it('liefert gefundene Tags in der angegebenen Reihenfolge', async () => {
    useTagsStore.setState({ tags: DEFAULT_TAGS, geladen: true })
    const { result } = renderHook(() => useTagsByIds(['t2', 't1']))
    expect(result.current.map((t) => t.id)).toEqual(['t2', 't1'])
  })

  it('filtert orphan-ids raus', () => {
    useTagsStore.setState({ tags: DEFAULT_TAGS, geladen: true })
    const { result } = renderHook(() => useTagsByIds(['t1', 'orphan']))
    expect(result.current.map((t) => t.id)).toEqual(['t1'])
  })

  it('referentielle Stabilitaet bei gleicher ids-Liste (memoization)', () => {
    useTagsStore.setState({ tags: DEFAULT_TAGS, geladen: true })
    const { result, rerender } = renderHook((ids: string[]) => useTagsByIds(ids), {
      initialProps: ['t1', 't2'],
    })
    const erste = result.current
    rerender(['t1', 't2'])
    expect(result.current).toBe(erste)
  })

  it('neue Reference bei geaenderter ids-Liste', () => {
    useTagsStore.setState({ tags: DEFAULT_TAGS, geladen: true })
    const { result, rerender } = renderHook((ids: string[]) => useTagsByIds(ids), {
      initialProps: ['t1'],
    })
    const erste = result.current
    rerender(['t2'])
    expect(result.current).not.toBe(erste)
    expect(result.current[0].id).toBe('t2')
  })
})
