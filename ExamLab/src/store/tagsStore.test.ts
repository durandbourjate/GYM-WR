import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTagsStore } from './tagsStore'
import type { Tag } from '@shared/types/tag'

vi.mock('../services/tagsApi', () => ({
  listeTags: vi.fn().mockResolvedValue([
    { id: 't1', name: 'aktuell', farbe: 'slate', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
    { id: 't2', name: 'schwer', farbe: 'red', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' },
  ]),
}))

describe('tagsStore', () => {
  beforeEach(() => {
    useTagsStore.setState({ tags: [], geladen: false, ladend: false, fehler: null })
  })

  it('ladeAlleTags füllt Store', async () => {
    await useTagsStore.getState().ladeAlleTags()
    expect(useTagsStore.getState().tags).toHaveLength(2)
    expect(useTagsStore.getState().geladen).toBe(true)
  })

  it('getById findet Tag', async () => {
    await useTagsStore.getState().ladeAlleTags()
    const tag = useTagsStore.getState().getById('t1')
    expect(tag?.name).toBe('aktuell')
  })

  it('getById gibt undefined für unbekannte id', async () => {
    await useTagsStore.getState().ladeAlleTags()
    expect(useTagsStore.getState().getById('xxx')).toBeUndefined()
  })

  it('getByIds filtert orphans raus', async () => {
    await useTagsStore.getState().ladeAlleTags()
    const result = useTagsStore.getState().getByIds(['t1', 'orphan', 't2'])
    expect(result.map((t) => t.id)).toEqual(['t1', 't2'])
  })

  it('getByName ist case-insensitive', async () => {
    await useTagsStore.getState().ladeAlleTags()
    expect(useTagsStore.getState().getByName('AKTUELL')?.id).toBe('t1')
  })

  it('upsertLokal fügt neuen hinzu', async () => {
    await useTagsStore.getState().ladeAlleTags()
    const neu: Tag = { id: 't3', name: 'neu', farbe: 'sky', archiviert: false, erstelltAm: '2026-01-02', erstelltVon: 'a@b' }
    useTagsStore.getState().upsertLokal(neu)
    expect(useTagsStore.getState().tags).toHaveLength(3)
    expect(useTagsStore.getState().getById('t3')?.name).toBe('neu')
  })

  it('upsertLokal updated existierenden', async () => {
    await useTagsStore.getState().ladeAlleTags()
    const aktualisiert: Tag = { id: 't1', name: 'aktualisiert', farbe: 'pink', archiviert: false, erstelltAm: '2026-01-01', erstelltVon: 'a@b' }
    useTagsStore.getState().upsertLokal(aktualisiert)
    expect(useTagsStore.getState().tags).toHaveLength(2)
    expect(useTagsStore.getState().getById('t1')?.name).toBe('aktualisiert')
  })

  it('entferneLokal entfernt nach id', async () => {
    await useTagsStore.getState().ladeAlleTags()
    useTagsStore.getState().entferneLokal('t1')
    expect(useTagsStore.getState().tags).toHaveLength(1)
  })
})
