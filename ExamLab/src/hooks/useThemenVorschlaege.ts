import { useMemo } from 'react'
import { useFragenbankStore } from '../store/fragenbankStore'

/**
 * Liefert dedupliziertes, alphabetisch sortiertes Array aller Themen
 * der Fragensammlung im gegebenen Fachbereich. Leere Themen werden gefiltert.
 *
 * Verwendung: HTML <datalist> für Themen-Autocomplete im Frageneditor.
 */
export function useThemenVorschlaege(fachbereich: string | undefined): string[] {
  const summaries = useFragenbankStore((s) => s.summaries)
  return useMemo(() => {
    if (!fachbereich) return []
    const themen = new Set<string>()
    for (const s of summaries) {
      if (s.fachbereich === fachbereich && s.thema && s.thema.trim()) {
        themen.add(s.thema.trim())
      }
    }
    return Array.from(themen).sort((a, b) => a.localeCompare(b, 'de'))
  }, [summaries, fachbereich])
}
