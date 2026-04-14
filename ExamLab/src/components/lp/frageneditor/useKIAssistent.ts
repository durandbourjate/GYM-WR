import { useState, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'

export type AktionKey =
  // Bestehende Aktionen
  | 'generiereFragetext'
  | 'verbessereFragetext'
  | 'generiereMusterloesung'
  | 'pruefeMusterloesung'
  | 'generiereOptionen'
  // Zuordnung
  | 'generierePaare'
  | 'pruefePaare'
  // Richtig/Falsch
  | 'generiereAussagen'
  | 'pruefeAussagen'
  // Lückentext
  | 'generiereLuecken'
  | 'pruefeLueckenAntworten'
  // Berechnung
  | 'berechneErgebnis'
  | 'pruefeToleranz'
  // Bewertungsraster
  | 'bewertungsrasterGenerieren'
  | 'bewertungsrasterVerbessern'
  // Klassifizierung
  | 'klassifiziereFrage'
  // Prüfungs-Analyse
  | 'analysierePruefung'
  // Import
  | 'importiereFragen'
  // Pool-Brücke: Lernziel → Frage
  | 'generiereFrageZuLernziel'
  // Buchhaltung / FiBu
  | 'generiereKontenauswahl'
  | 'generiereBuchungssaetze'
  | 'pruefeBuchungssaetze'
  | 'generiereTKonten'
  | 'generiereKontenaufgaben'
  | 'generiereBilanzStruktur'
  | 'generiereFallbeispiel'

export interface AktionErgebnis {
  daten: Record<string, unknown> | null
  fehler: string | null
}

/** Hook: KI-Assistent-Logik (API-Aufrufe, Lade-/Ergebnisstatus) */
export function useKIAssistent() {
  const user = useAuthStore((s) => s.user)
  const [ladeAktion, setLadeAktion] = useState<AktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<AktionKey, AktionErgebnis>>>({})

  const ausfuehren = useCallback(async (aktion: AktionKey, daten: Record<string, unknown>) => {
    if (!user?.email) return
    setLadeAktion(aktion)
    setErgebnisse((prev) => ({ ...prev, [aktion]: undefined }))

    try {
      const result = await apiService.kiAssistent(user.email, aktion, daten)
      if (!result) {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in result && typeof result.error === 'string') {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: result.error as string } }))
      } else {
        setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: result, fehler: null } }))
      }
    } catch {
      setErgebnisse((prev) => ({ ...prev, [aktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeAktion(null)
    }
  }, [user?.email])

  function verwerfen(aktion: AktionKey): void {
    setErgebnisse((prev) => {
      const neu = { ...prev }
      delete neu[aktion]
      return neu
    })
  }

  const verfuegbar = apiService.istKonfiguriert()

  return { ladeAktion, ergebnisse, ausfuehren, verwerfen, verfuegbar }
}
