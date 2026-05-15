/**
 * Tags-API: CRUD-Endpoints für Tag-Objekt-Modell (Cluster H Phase 0).
 *
 * Alle Endpoints sind LP-only und brauchen `email` im Payload (Backend-Auth-Gate).
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
export async function listeTags(params: {
  email: string
  inkludiereArchivierte?: boolean
}): Promise<Tag[]> {
  const r = await postJson<ApiResponse & { tags?: Tag[] }>('apiListTags', {
    email: params.email,
    inkludiereArchivierte: params.inkludiereArchivierte ?? false,
  })
  const u = unwrap(r, 'apiListTags')
  return u.tags ?? []
}

/** Tag erstellen (idempotent: existierte=true wenn Name-Match auf existierenden Tag). */
export async function erstelleTag(params: {
  email: string
  name: string
  farbe?: TagFarbe
}): Promise<{ tag: Tag; existierte: boolean }> {
  const r = await postJson<ApiResponse & { tag?: Tag; existierte?: boolean }>('apiCreateTag', params)
  const u = unwrap(r, 'apiCreateTag')
  if (!u.tag) throw new Error('apiCreateTag: tag fehlt in Antwort')
  return { tag: u.tag, existierte: Boolean(u.existierte) }
}

/** Tag-Felder aktualisieren (name und/oder farbe). */
export async function aktualisiereTag(params: {
  email: string
  id: string
  name?: string
  farbe?: TagFarbe
}): Promise<Tag> {
  const r = await postJson<ApiResponse & { tag?: Tag }>('apiUpdateTag', params)
  const u = unwrap(r, 'apiUpdateTag')
  if (!u.tag) throw new Error('apiUpdateTag: tag fehlt in Antwort')
  return u.tag
}

/** Tag soft-archivieren (bleibt in DB, wird default ausgeblendet). Admin-only. */
export async function archiviereTag(params: { email: string; id: string }): Promise<void> {
  const r = await postJson<ApiResponse>('apiArchiveTag', params)
  unwrap(r, 'apiArchiveTag')
}

/** Mehrere Tags in einen Master-Tag mergen. Admin-only. Backend rewrites tagIds in Fragen. */
export async function mergeTags(params: {
  email: string
  masterId: string
  mergedIds: string[]
}): Promise<{ fragenAktualisiert: number }> {
  const r = await postJson<ApiResponse & { fragenAktualisiert?: number }>('apiMergeTags', params)
  const u = unwrap(r, 'apiMergeTags')
  return { fragenAktualisiert: Number(u.fragenAktualisiert ?? 0) }
}

/** Tag permanent löschen (nur wenn 0 Fragen-Verweise — Backend wirft sonst). Admin-only. */
export async function hardDeleteTag(params: { email: string; id: string }): Promise<void> {
  const r = await postJson<ApiResponse>('apiHardDeleteTag', params)
  unwrap(r, 'apiHardDeleteTag')
}

/** One-Shot-Migration: tags: string[] → Tag-Objekte (idempotent, im Backend lockgesichert). Admin-only. */
export async function migriereTagsZuObjects(params: {
  email: string
}): Promise<{ neueTags: number; fragenAktualisiert: number; dauerMs: number }> {
  const r = await postJson<ApiResponse & { neueTags?: number; fragenAktualisiert?: number; dauerMs?: number }>(
    'apiMigriereTagsZuObjects',
    params,
  )
  const u = unwrap(r, 'apiMigriereTagsZuObjects')
  return {
    neueTags: Number(u.neueTags ?? 0),
    fragenAktualisiert: Number(u.fragenAktualisiert ?? 0),
    dauerMs: Number(u.dauerMs ?? 0),
  }
}
