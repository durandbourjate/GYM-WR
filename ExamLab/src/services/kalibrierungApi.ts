import { postJson } from './apiClient'

export type KalibrierungsEinstellungen = {
  global: boolean
  aktionenAktiv: {
    generiereMusterloesung: boolean
    klassifiziereFrage: boolean
    bewertungsrasterGenerieren: boolean
    korrigiereFreitext: boolean
  }
  minBeispiele: number
  beispielAnzahl: number
  zeigeQuotaWarnung?: boolean
  letzterQuotaFehler?: string
}

export type KIFeedbackEintragLP = {
  feedbackId: string
  zeitstempel: string
  aktion: string
  fachbereich: string
  bloom?: string
  inputJson: Record<string, unknown>
  kiOutputJson: Record<string, unknown>
  finaleVersionJson: Record<string, unknown>
  diffScore: number
  status: 'offen' | 'geschlossen' | 'ignoriert'
  qualifiziert: boolean
  wichtig: boolean
  aktiv: boolean
}

export type KalibrierungsStatistik = {
  aktionen: Record<string, {
    vorschlaege: number
    unveraendert: number
    leicht: number
    deutlich: number
    verworfen: number
    aktive: number
    wichtige: number
  }>
  zeitraum_tage: number
}

/**
 * Backend liefert immer `{ success, data }`. `postJson<T>` returnt das volle
 * Response-Objekt. Dieser Helper unwrappt `.data` und gibt null zurück wenn
 * `success` fehlt, data nicht vorhanden oder falscher Shape.
 */
async function unwrap<T>(
  result: { success?: boolean; data?: unknown } | null
): Promise<T | null> {
  if (!result || typeof result !== 'object') return null
  if (result.success === false) return null
  if (result.data === undefined || result.data === null) return null
  return result.data as T
}

export const kalibrierungApi = {
  ladeEinstellungen: async (email: string) => {
    const r = await postJson<{ success: boolean; data?: KalibrierungsEinstellungen }>(
      'kalibrierungsEinstellungen', { modus: 'laden', email }
    )
    return unwrap<KalibrierungsEinstellungen>(r)
  },

  speichereEinstellungen: async (email: string, konfig: KalibrierungsEinstellungen) => {
    const r = await postJson<{ success: boolean }>(
      'kalibrierungsEinstellungen', { modus: 'speichern', email, konfig }
    )
    return r?.success === true
  },

  listeFeedbacks: async (
    email: string,
    filter: Record<string, unknown> = {},
    seite = 0,
    proSeite = 50,
  ) => {
    const r = await postJson<{ success: boolean; data?: { eintraege: KIFeedbackEintragLP[]; gesamt: number } }>(
      'listeKIFeedbacks', { email, filter, seite, proSeite }
    )
    return unwrap<{ eintraege: KIFeedbackEintragLP[]; gesamt: number }>(r)
  },

  aktualisiereFeedback: async (
    email: string,
    feedbackId: string,
    changes: { wichtig?: boolean; aktiv?: boolean },
  ) => {
    const r = await postJson<{ success: boolean }>(
      'aktualisiereKIFeedback', { email, feedbackId, ...changes }
    )
    return r?.success === true
  },

  loescheFeedback: async (email: string, feedbackId: string) => {
    const r = await postJson<{ success: boolean }>(
      'loescheKIFeedback', { email, feedbackId }
    )
    return r?.success === true
  },

  bulkLoesche: async (email: string, filter: Record<string, unknown>) => {
    const r = await postJson<{ success: boolean; data?: { geloescht: number } }>(
      'bulkLoescheKIFeedbacks', { email, filter }
    )
    return unwrap<{ geloescht: number }>(r)
  },

  statistik: async (email: string, zeitraum_tage = 30) => {
    const r = await postJson<{ success: boolean; data?: KalibrierungsStatistik }>(
      'kalibrierungsStatistik', { email, zeitraum_tage }
    )
    return unwrap<KalibrierungsStatistik>(r)
  },
}
