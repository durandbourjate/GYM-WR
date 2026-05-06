import { describe, it, expect, beforeEach } from 'vitest'
import { useDraftStore } from './draftStore'

beforeEach(() => {
  // Reset Store-State zwischen Tests
  useDraftStore.setState({ aktiveDrafts: new Map() })
})

describe('draftStore', () => {
  it('register legt neuen Eintrag mit Defaults an', () => {
    useDraftStore.getState().register('editor-1')
    const drafts = useDraftStore.getState().aktiveDrafts
    expect(drafts.has('editor-1')).toBe(true)
    expect(drafts.get('editor-1')).toEqual({ editorId: 'editor-1', istDirty: false, status: 'sammlung' })
  })

  it('register ist idempotent — überschreibt existing nicht', () => {
    useDraftStore.getState().register('editor-1')
    useDraftStore.getState().setDirty('editor-1', true)
    useDraftStore.getState().register('editor-1') // sollte nichts überschreiben
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.istDirty).toBe(true)
  })

  it('setDirty updated istDirty-Flag', () => {
    useDraftStore.getState().register('editor-1')
    useDraftStore.getState().setDirty('editor-1', true)
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.istDirty).toBe(true)
  })

  it('setDirty NoOp bei unbekannter editorId', () => {
    useDraftStore.getState().setDirty('unbekannt', true)
    expect(useDraftStore.getState().aktiveDrafts.has('unbekannt')).toBe(false)
  })

  it('setStatus updated status', () => {
    useDraftStore.getState().register('editor-1')
    useDraftStore.getState().setStatus('editor-1', 'draft')
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.status).toBe('draft')
  })

  it('setStatus NoOp bei unbekannter editorId', () => {
    useDraftStore.getState().setStatus('unbekannt', 'draft')
    expect(useDraftStore.getState().aktiveDrafts.has('unbekannt')).toBe(false)
  })

  it('unregister entfernt Eintrag', () => {
    useDraftStore.getState().register('editor-1')
    useDraftStore.getState().unregister('editor-1')
    expect(useDraftStore.getState().aktiveDrafts.has('editor-1')).toBe(false)
  })

  it('unregister idempotent bei unbekannter editorId', () => {
    expect(() => useDraftStore.getState().unregister('unbekannt')).not.toThrow()
  })

  it('hatDirty returnt false wenn keine aktiven Drafts', () => {
    expect(useDraftStore.getState().hatDirty()).toBe(false)
  })

  it('hatDirty returnt false wenn alle aktiven Drafts sauber sind', () => {
    useDraftStore.getState().register('e1')
    useDraftStore.getState().register('e2')
    expect(useDraftStore.getState().hatDirty()).toBe(false)
  })

  it('hatDirty returnt true wenn mind. ein Draft dirty', () => {
    useDraftStore.getState().register('e1')
    useDraftStore.getState().register('e2')
    useDraftStore.getState().setDirty('e2', true)
    expect(useDraftStore.getState().hatDirty()).toBe(true)
  })

  it('Map-Mutation immutable: new Map per setDirty', () => {
    useDraftStore.getState().register('e1')
    const before = useDraftStore.getState().aktiveDrafts
    useDraftStore.getState().setDirty('e1', true)
    const after = useDraftStore.getState().aktiveDrafts
    expect(before).not.toBe(after) // referenzielle Inequality (neue Map)
  })
})
