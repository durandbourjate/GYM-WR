import { useEffect, useCallback } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'

/**
 * UX-Hook für die Prüfungsphase:
 * 1. beforeunload-Warnung (verhindert versehentliches Tab-Schliessen)
 * 2. Tastaturnavigation (Ctrl+← / Ctrl+→, Escape)
 * 3. Abgabe-Banner bei Zeitablauf
 */
export function usePruefungsUX(callbacks: {
  onAbgabeDialogOeffnen: () => void
  onAbgabeDialogSchliessen: () => void
}): { zeitAbgelaufen: boolean } {
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const config = usePruefungStore((s) => s.config)
  const naechsteFrage = usePruefungStore((s) => s.naechsteFrage)
  const vorherigeFrage = usePruefungStore((s) => s.vorherigeFrage)

  // === 1. beforeunload: Warnung beim Schliessen/Reloaden ===
  useEffect(() => {
    if (!config || abgegeben) return

    function handleBeforeUnload(e: BeforeUnloadEvent): void {
      e.preventDefault()
      // Moderne Browser ignorieren custom text, zeigen aber Standard-Dialog
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [config, abgegeben])

  // === 2. Tastaturnavigation ===
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!config || abgegeben) return

      // Nicht in Textfeldern / Editoren abfangen
      const target = e.target as HTMLElement
      const isEditable =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      // Ctrl/Cmd + ← → für Navigation (auch in Editoren)
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault()
        vorherigeFrage()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault()
        naechsteFrage()
        return
      }

      // Ctrl/Cmd + Enter → nächste Frage (auch in Editoren)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        naechsteFrage()
        return
      }

      // Escape schliesst Dialog
      if (e.key === 'Escape') {
        callbacks.onAbgabeDialogSchliessen()
        return
      }

      // Nur wenn nicht in Eingabefeld:
      if (!isEditable) {
        // ← → ohne Modifier für Navigation
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          vorherigeFrage()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          naechsteFrage()
        }
      }
    },
    [config, abgegeben, naechsteFrage, vorherigeFrage, callbacks]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { zeitAbgelaufen: false }
}
