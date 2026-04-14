import { useEffect, useRef, useState } from 'react'
import { useThemenSichtbarkeitStore } from '../../store/ueben/themenSichtbarkeitStore'

export interface DeepLinkZiel {
  fach: string
  thema: string
  unterthema?: string
}

/**
 * Liest Deep-Link-Parameter (?fach=...&thema=...&unterthema=...) aus der URL,
 * aktiviert das Thema automatisch und gibt das Ziel zurück,
 * damit das Dashboard direkt dorthin navigieren kann.
 *
 * Bereinigt die URL nach erfolgreicher Aktivierung (history.replaceState).
 * Läuft nur einmal pro Page-Load.
 */
export function useDeepLinkAktivierung(
  gruppeId: string | undefined,
  email: string | undefined,
  istAngemeldet: boolean
): DeepLinkZiel | null {
  const verarbeitet = useRef(false)
  const { setzeStatus } = useThemenSichtbarkeitStore()
  const [ziel, setZiel] = useState<DeepLinkZiel | null>(null)

  useEffect(() => {
    if (verarbeitet.current || !gruppeId || !email || !istAngemeldet) return

    const params = new URLSearchParams(window.location.search)
    const fach = params.get('fach')
    const thema = params.get('thema')

    if (!fach || !thema) return

    verarbeitet.current = true

    const unterthema = params.get('unterthema') || undefined
    setZiel({ fach, thema, unterthema })

    // Thema aktivieren (async, Fehler still schlucken)
    setzeStatus(gruppeId, fach, thema, 'aktiv', email, 'deeplink')
      .then(erfolg => {
        if (erfolg) {
          console.log(`[DeepLink] Thema aktiviert: ${fach} / ${thema}${unterthema ? ` / ${unterthema}` : ''}`)
        } else {
          console.warn(`[DeepLink] Thema-Aktivierung fehlgeschlagen: ${fach} / ${thema}`)
        }
      })
      .catch(err => {
        console.warn('[DeepLink] Fehler bei Thema-Aktivierung:', err)
      })

    // URL bereinigen (fach/thema/unterthema entfernen, andere Params behalten)
    params.delete('fach')
    params.delete('thema')
    params.delete('unterthema')
    const neueUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    window.history.replaceState({}, '', neueUrl)
  }, [gruppeId, email, istAngemeldet, setzeStatus])

  return ziel
}
