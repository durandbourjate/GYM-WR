import { useEffect, useState } from 'react'

/**
 * Erkennt ob die Prüfung in mehreren Tabs geöffnet ist.
 * Nutzt BroadcastChannel API (mit localStorage-Fallback).
 * Gibt `true` zurück wenn ein Konflikt erkannt wird.
 */
export function useTabKonflikt(pruefungId: string | null): boolean {
  const [konflikt, setKonflikt] = useState(false)

  useEffect(() => {
    if (!pruefungId) return

    const channelName = `pruefung-tab-${pruefungId}`

    // BroadcastChannel: Moderne Browser
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(channelName)
      const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      // Beim Öffnen: Ping senden
      channel.postMessage({ type: 'ping', tabId })

      channel.onmessage = (event) => {
        if (event.data?.type === 'ping' && event.data.tabId !== tabId) {
          // Ein anderer Tab hat sich gemeldet → Konflikt
          setKonflikt(true)
          // Pong zurücksenden damit der andere Tab auch weiss
          channel.postMessage({ type: 'pong', tabId })
        }
        if (event.data?.type === 'pong' && event.data.tabId !== tabId) {
          setKonflikt(true)
        }
        if (event.data?.type === 'close' && event.data.tabId !== tabId) {
          // Anderer Tab wurde geschlossen → Konflikt aufheben
          setKonflikt(false)
        }
      }

      // Beim Schliessen: close senden
      const handleBeforeUnload = () => {
        channel.postMessage({ type: 'close', tabId })
      }
      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        channel.postMessage({ type: 'close', tabId })
        channel.close()
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }

    // Fallback: localStorage-basiert (für ältere Browser)
    const storageKey = `pruefung-tab-aktiv-${pruefungId}`
    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Prüfe ob bereits ein Tab aktiv ist
    try {
      const existing = localStorage.getItem(storageKey)
      if (existing) {
        const data = JSON.parse(existing)
        // Wenn der andere Tab in den letzten 5 Sekunden aktiv war
        if (Date.now() - data.timestamp < 5000) {
          setKonflikt(true)
        }
      }
    } catch { /* ignore */ }

    // Eigene Präsenz regelmässig aktualisieren
    const updatePresence = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ tabId, timestamp: Date.now() }))
      } catch { /* ignore */ }
    }
    updatePresence()
    const interval = setInterval(updatePresence, 2000)

    // Storage-Event: anderer Tab schreibt
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.tabId !== tabId) {
            setKonflikt(true)
          }
        } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      try {
        const current = localStorage.getItem(storageKey)
        if (current) {
          const data = JSON.parse(current)
          if (data.tabId === tabId) {
            localStorage.removeItem(storageKey)
          }
        }
      } catch { /* ignore */ }
    }
  }, [pruefungId])

  return konflikt
}
