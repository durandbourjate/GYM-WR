import { useState, useRef, useEffect, useCallback } from 'react'
import type { PruefungsConfig } from '../types/pruefung.ts'

interface Options {
  pruefung: PruefungsConfig
  /** Speicher-Aktion. Wird vom Hook nach Debounce aufgerufen, nicht synchron. */
  onSave: () => Promise<boolean>
  /** Debounce-Verzögerung in ms (default 3000). */
  delayMs?: number
}

interface AutoSaveResult {
  autoSaveStatus: 'idle' | 'gespeichert'
  /** Nach erfolgreichem manuellem Save: markiert den übergebenen Zustand als „bereits gespeichert" — verhindert Auto-Save direkt danach. */
  markAsSaved: (zustand: PruefungsConfig) => void
  /** Cancel pending Auto-Save Timer. Aufruf vor manuellem Save → verhindert Race. */
  cancelTimer: () => void
}

/**
 * Auto-Save-Hook für PruefungsComposer mit Debounce + JSON-basierter
 * Diff-Erkennung. Refs (`vorherigeJsonRef`, `timerRef`, `hasChangedRef`)
 * sind intern; nur stabile Callbacks `markAsSaved` + `cancelTimer` werden
 * exposed.
 *
 * Closure-Ref-Pattern für `onSave`: Aufrufer kann eine stets-aktuelle
 * Funktion übergeben, ohne dass der useEffect bei jedem Render neu
 * triggert (sonst würde Debounce zurückgesetzt).
 */
export function useAutoSavePruefung({ pruefung, onSave, delayMs = 3000 }: Options): AutoSaveResult {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'gespeichert'>('idle')

  const vorherigeJsonRef = useRef(JSON.stringify(pruefung))
  const hasChangedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stabile onSave-Reference via Ref — useEffect deps bleiben minimal.
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  useEffect(() => {
    const aktuellerJSON = JSON.stringify(pruefung)
    if (aktuellerJSON === vorherigeJsonRef.current) return

    // Beim allerersten Unterschied merken, dass sich etwas geändert hat
    if (!hasChangedRef.current) {
      hasChangedRef.current = true
      vorherigeJsonRef.current = aktuellerJSON
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      if (!pruefung.titel.trim()) return

      await onSaveRef.current()
      // vorherigeJsonRef wird über markAsSaved() im Save-Pfad aktualisiert
      setAutoSaveStatus('gespeichert')
      setTimeout(() => setAutoSaveStatus('idle'), 2000)
    }, delayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pruefung])

  const markAsSaved = useCallback((zustand: PruefungsConfig) => {
    vorherigeJsonRef.current = JSON.stringify(zustand)
  }, [])

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return { autoSaveStatus, markAsSaved, cancelTimer }
}
