import { useState, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'

export type KiAktionKey =
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

export interface KiAktionErgebnis {
  daten: Record<string, unknown> | null
  fehler: string | null
}

/** Hook: KI-Assistent-Logik (API-Aufrufe, Lade-/Ergebnisstatus) */
export function useKIAssistent() {
  const user = useAuthStore((s) => s.user)
  const [ladeKiAktion, setLadeKiAktion] = useState<KiAktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<KiAktionKey, KiAktionErgebnis>>>({})

  const ausfuehren = useCallback(async (kiAktion: KiAktionKey, daten: Record<string, unknown>) => {
    if (!user?.email) return
    setLadeKiAktion(kiAktion)
    setErgebnisse((prev) => ({ ...prev, [kiAktion]: undefined }))

    try {
      const result = await apiService.kiAssistent(user.email, kiAktion, daten)
      if (!result) {
        setErgebnisse((prev) => ({ ...prev, [kiAktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in result && typeof result.error === 'string') {
        setErgebnisse((prev) => ({ ...prev, [kiAktion]: { daten: null, fehler: result.error as string } }))
      } else {
        setErgebnisse((prev) => ({ ...prev, [kiAktion]: { daten: result, fehler: null } }))
      }
    } catch {
      setErgebnisse((prev) => ({ ...prev, [kiAktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeKiAktion(null)
    }
  }, [user?.email])

  function verwerfen(kiAktion: KiAktionKey): void {
    setErgebnisse((prev) => {
      const neu = { ...prev }
      delete neu[kiAktion]
      return neu
    })
  }

  const verfuegbar = apiService.istKonfiguriert()

  return { ladeKiAktion, ergebnisse, ausfuehren, verwerfen, verfuegbar }
}
