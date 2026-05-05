import { describe, it, expect, beforeEach } from 'vitest'
import { useDraftStore } from './draftStore'

beforeEach(() => {
  // Reset Store-State zwischen Tests
  useDraftStore.setState({ aktiveDrafts: new Map() })
})

describe('draftStore', () => {
  it('registriere legt neuen Eintrag mit Defaults an', () => {
    useDraftStore.getState().registriere('editor-1')
    const drafts = useDraftStore.getState().aktiveDrafts
    expect(drafts.has('editor-1')).toBe(true)
    expect(drafts.get('editor-1')).toEqual({ editorId: 'editor-1', istDirty: false, status: 'sammlung' })
  })

  it('registriere ist idempotent — überschreibt existing nicht', () => {
    useDraftStore.getState().registriere('editor-1')
    useDraftStore.getState().setzeDirty('editor-1', true)
    useDraftStore.getState().registriere('editor-1') // sollte nichts überschreiben
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.istDirty).toBe(true)
  })

  it('setzeDirty updated istDirty-Flag', () => {
    useDraftStore.getState().registriere('editor-1')
    useDraftStore.getState().setzeDirty('editor-1', true)
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.istDirty).toBe(true)
  })

  it('setzeDirty NoOp bei unbekannter editorId', () => {
    useDraftStore.getState().setzeDirty('unbekannt', true)
    expect(useDraftStore.getState().aktiveDrafts.has('unbekannt')).toBe(false)
  })

  it('setzeStatus updated status', () => {
    useDraftStore.getState().registriere('editor-1')
    useDraftStore.getState().setzeStatus('editor-1', 'draft')
    expect(useDraftStore.getState().aktiveDrafts.get('editor-1')?.status).toBe('draft')
  })

  it('setzeStatus NoOp bei unbekannter editorId', () => {
    useDraftStore.getState().setzeStatus('unbekannt', 'draft')
    expect(useDraftStore.getState().aktiveDrafts.has('unbekannt')).toBe(false)
  })

  it('abmelde entfernt Eintrag', () => {
    useDraftStore.getState().registriere('editor-1')
    useDraftStore.getState().abmelde('editor-1')
    expect(useDraftStore.getState().aktiveDrafts.has('editor-1')).toBe(false)
  })

  it('abmelde idempotent bei unbekannter editorId', () => {
    expect(() => useDraftStore.getState().abmelde('unbekannt')).not.toThrow()
  })

  it('hatDirty returnt false wenn keine aktiven Drafts', () => {
    expect(useDraftStore.getState().hatDirty()).toBe(false)
  })

  it('hatDirty returnt false wenn alle aktiven Drafts sauber sind', () => {
    useDraftStore.getState().registriere('e1')
    useDraftStore.getState().registriere('e2')
    expect(useDraftStore.getState().hatDirty()).toBe(false)
  })

  it('hatDirty returnt true wenn mind. ein Draft dirty', () => {
    useDraftStore.getState().registriere('e1')
    useDraftStore.getState().registriere('e2')
    useDraftStore.getState().setzeDirty('e2', true)
    expect(useDraftStore.getState().hatDirty()).toBe(true)
  })

  it('Map-Mutation immutable: new Map per setzeDirty', () => {
    useDraftStore.getState().registriere('e1')
    const before = useDraftStore.getState().aktiveDrafts
    useDraftStore.getState().setzeDirty('e1', true)
    const after = useDraftStore.getState().aktiveDrafts
    expect(before).not.toBe(after) // referenzielle Inequality (neue Map)
  })
})
