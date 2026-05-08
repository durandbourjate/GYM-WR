import type { Frage } from '../../types/ueben/fragen'
import type { LoesungsMap } from '../../types/ueben/loesung'
import { ladeLoesungenApi } from '../../services/uebenLoesungsApi'

interface PreloadUser {
  email: string
  sessionToken?: string
}

interface LadeLoesungenViaPreloadArgs {
  block: Frage[]
  gruppeId: string
  fachbereich: string
  user: PreloadUser | null | undefined
}

/**
 * Lädt Musterlösungen aller Fragen (inkl. Teilaufgaben) im Block via
 * separatem Endpoint (Bundle Ü). Bei fehlendem User oder API-Fehler:
 * leere Map zurück (Caller fällt auf Server-Korrektur pro Frage zurück).
 *
 * Pure-async: kein Store-Zugriff, kein dynamic-import. Caller injiziert
 * `user` aus authStore.
 */
export async function ladeLoesungenViaPreload(
  args: LadeLoesungenViaPreloadArgs,
): Promise<LoesungsMap> {
  const { block, gruppeId, fachbereich, user } = args
  if (!user?.sessionToken) return {}

  const fragenIds = block.map((f) => f.id)
  for (const f of block) {
    const ta = (f as Frage & { teilaufgaben?: Frage[] }).teilaufgaben
    if (Array.isArray(ta)) for (const t of ta) fragenIds.push(t.id)
  }

  try {
    return await ladeLoesungenApi({
      gruppeId,
      fragenIds,
      email: user.email,
      token: user.sessionToken,
      fachbereich,
    })
  } catch (e) {
    console.warn('[uebungsStore] Lösungs-Preload fehlgeschlagen:', e)
    return {}
  }
}
