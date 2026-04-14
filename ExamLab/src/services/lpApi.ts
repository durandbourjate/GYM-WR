/**
 * LP-Verwaltung: Lädt Lehrpersonen-Liste vom Backend
 */

export interface LPInfo {
  email: string
  name: string
  kuerzel: string
  fachschaft: string
  fachschaften?: string[]
  rolle: 'admin' | 'lp'
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL

/**
 * Lädt alle aktiven Lehrpersonen vom Backend.
 * Wird einmal pro Session aufgerufen und im authStore gecached.
 */
export async function ladeLehrpersonen(callerEmail?: string): Promise<LPInfo[] | null> {
  if (!APPS_SCRIPT_URL) return null
  if (!callerEmail) {
    console.warn('[lpApi] ladeLehrpersonen ohne callerEmail aufgerufen — Backend braucht echte Email')
    return null
  }

  try {
    const url = `${APPS_SCRIPT_URL}?action=ladeLehrpersonen&email=${encodeURIComponent(callerEmail)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.lehrpersonen ?? null
  } catch (e) {
    console.warn('[lpApi] Lehrpersonen laden fehlgeschlagen:', e)
    return null
  }
}
