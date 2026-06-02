import { useCallback, useState } from 'react'

/** Lokale aria-live="polite"-Ansage (eine Instanz pro aktiver Frage; kein globaler Singleton).
 *  Gibt Daten zurück; der Konsument rendert:
 *  <div aria-live="polite" aria-atomic="true" className="sr-only">{ansageText}</div> */
export function useSrAnsage() {
  const [ansageText, setAnsageText] = useState('')
  const ansage = useCallback((t: string) => setAnsageText(t), [])
  return { ansage, ansageText }
}
