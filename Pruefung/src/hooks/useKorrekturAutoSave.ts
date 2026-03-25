import { useRef, useCallback, useEffect } from 'react'
import type { KorrekturZeileUpdate } from '../types/korrektur.ts'
import { speichereKorrekturZeile } from '../services/korrekturApi.ts'
import { saveKorrekturToIndexedDB } from '../services/autoSave.ts'

interface AutoSaveOptions {
  pruefungId: string
  email: string
  enabled: boolean  // false in Demo-Modus
}

export function useKorrekturAutoSave({ pruefungId, email, enabled }: AutoSaveOptions) {
  const pendingRef = useRef<KorrekturZeileUpdate[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const korrekturRef = useRef<unknown>(null)  // für IndexedDB-Backup

  // Ref aktualisieren wenn sich Korrektur-Daten ändern (von aussen aufrufen)
  const updateKorrekturRef = useCallback((data: unknown) => {
    korrekturRef.current = data
  }, [])

  // IndexedDB-Backup alle 10s
  useEffect(() => {
    if (!enabled) return
    const interval = setInterval(() => {
      if (korrekturRef.current) {
        saveKorrekturToIndexedDB(pruefungId, korrekturRef.current)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [pruefungId, enabled])

  // Debounced Remote-Save (3s nach letzter Änderung)
  const queueSave = useCallback((update: KorrekturZeileUpdate) => {
    if (!enabled) return
    pendingRef.current.push(update)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const updates = [...pendingRef.current]
      pendingRef.current = []
      for (const u of updates) {
        await speichereKorrekturZeile(u, email)
      }
    }, 3000)
  }, [email, enabled])

  // Cleanup Timer bei Unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { queueSave, updateKorrekturRef }
}
