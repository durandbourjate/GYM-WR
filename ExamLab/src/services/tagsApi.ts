/**
 * Tags-API: CRUD-Endpoints für Tag-Objekt-Modell (Cluster H Phase 0).
 *
 * Memory S130-Pattern: postJson<T>-Cast ist Lüge, manuelles unwrap via Helper.
 * Backend-Cases: apiListTags, apiCreateTag, apiUpdateTag, apiArchiveTag,
 * apiMergeTags, apiHardDeleteTag, apiMigriereTagsZuObjects.
 */
import { postJson } from './apiClient'
import type { Tag, TagFarbe } from '@shared/types/tag'

interface ApiResponse {
  success?: boolean
  error?: string
  [key: string]: unknown
}

/**
 * Wirft Error bei null-Response oder success:false.
 * Gibt sonst das Response-Objekt zurück.
 */
function unwrap<T extends ApiResponse>(response: T | null, action: string): T {
  if (!response) throw new Error(`${action}: keine Antwort vom Server`)
  if (response.success === false) throw new Error(response.error || `${action}: fehlgeschlagen`)
  return response
}

/** Liste aller Tags (default: nur nicht-archivierte). */
export async function listeTags(opts?: { inkludiereArchivierte?: boolean }): Promise<Tag[]> {
  const r = await postJson<ApiResponse & { tags?: Tag[] }>('apiListTags', {
    inkludiereArchivierte: opts?.inkludiereArchivierte ?? false,
  })
  const u = unwrap(r, 'apiListTags')
  return u.tags ?? []
}

/** Tag erstellen (idempotent: existierte=true wenn Name-Match auf existierenden Tag). */
export async function erstelleTag(input: { name: string; farbe?: TagFarbe }): Promise<{ tag: Tag; existierte: boolean }> {
  const r = await postJson<ApiResponse & { tag?: Tag; existierte?: boolean }>('apiCreateTag', input)
  const u = unwrap(r, 'apiCreateTag')
  if (!u.tag) throw new Error('apiCreateTag: tag fehlt in Antwort')
  return { tag: u.tag, existierte: Boolean(u.existierte) }
}

/** Tag-Felder aktualisieren (name und/oder farbe). */
export async function aktualisiereTag(input: { id: string; name?: string; farbe?: TagFarbe }): Promise<Tag> {
  const r = await postJson<ApiResponse & { tag?: Tag }>('apiUpdateTag', input)
  const u = unwrap(r, 'apiUpdateTag')
  if (!u.tag) throw new Error('apiUpdateTag: tag fehlt in Antwort')
  return u.tag
}

/** Tag soft-archivieren (bleibt in DB, wird default ausgeblendet). */
export async function archiviereTag(id: string): Promise<void> {
  const r = await postJson<ApiResponse>('apiArchiveTag', { id })
  unwrap(r, 'apiArchiveTag')
}

/** Mehrere Tags in einen Master-Tag mergen. Backend rewrites tagIds in Fragen. */
export async function mergeTags(input: { masterId: string; mergedIds: string[] }): Promise<{ fragenAktualisiert: number }> {
  const r = await postJson<ApiResponse & { fragenAktualisiert?: number }>('apiMergeTags', input)
  const u = unwrap(r, 'apiMergeTags')
  return { fragenAktualisiert: Number(u.fragenAktualisiert ?? 0) }
}

/** Tag permanent löschen (nur wenn 0 Fragen-Verweise — Backend wirft sonst). */
export async function hardDeleteTag(id: string): Promise<void> {
  const r = await postJson<ApiResponse>('apiHardDeleteTag', { id })
  unwrap(r, 'apiHardDeleteTag')
}

/** One-Shot-Migration: tags: string[] → Tag-Objekte (idempotent, im Backend lockgesichert). */
export async function migriereTagsZuObjects(): Promise<{ neueTags: number; fragenAktualisiert: number; dauerMs: number }> {
  const r = await postJson<ApiResponse & { neueTags?: number; fragenAktualisiert?: number; dauerMs?: number }>(
    'apiMigriereTagsZuObjects',
    {},
  )
  const u = unwrap(r, 'apiMigriereTagsZuObjects')
  return {
    neueTags: Number(u.neueTags ?? 0),
    fragenAktualisiert: Number(u.fragenAktualisiert ?? 0),
    dauerMs: Number(u.dauerMs ?? 0),
  }
}
