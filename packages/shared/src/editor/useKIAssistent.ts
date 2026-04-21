/**
 * KI-Assistent Hook — abstrahiert.
 * Nutzt EditorServices statt direktem apiService.
 */
import { useState, useCallback } from 'react'
import { useEditorServices, useEditorConfig } from './EditorContext'

export type AktionKey =
  | 'generiereFragetext'
  | 'verbessereFragetext'
  | 'generiereMusterloesung'
  | 'pruefeMusterloesung'
  | 'generiereOptionen'
  | 'generierePaare'
  | 'pruefePaare'
  | 'generiereAussagen'
  | 'pruefeAussagen'
  | 'generiereLuecken'
  | 'pruefeLueckenAntworten'
  | 'berechneErgebnis'
  | 'pruefeToleranz'
  | 'bewertungsrasterGenerieren'
  | 'bewertungsrasterVerbessern'
  | 'klassifiziereFrage'
  | 'analysierePruefung'
  | 'importiereFragen'
  | 'generiereFrageZuLernziel'
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
  const services = useEditorServices()
  const config = useEditorConfig()
  const [ladeAktion, setLadeAktion] = useState<AktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<AktionKey, AktionErgebnis>>>({})

  const ausfuehren = useCallback(async (aktion: AktionKey, daten: Record<string, unknown>) => {
    if (!services.kiAssistent || !config.benutzer.email) return
    setLadeAktion(aktion)
    setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: undefined }))

    try {
      const response = await services.kiAssistent(aktion, daten)
      if (!response) {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in response.ergebnis && typeof response.ergebnis.error === 'string') {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: response.ergebnis.error as string } }))
      } else {
        // Nur das ergebnis-Feld speichern — feedbackId wird für Task 13 (Feedback-Loop) gebraucht
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: response.ergebnis, fehler: null } }))
      }
    } catch {
      setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeAktion(null)
    }
  }, [services, config.benutzer.email])

  function verwerfen(aktion: AktionKey): void {
    setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => {
      const neu = { ...prev }
      delete neu[aktion]
      return neu
    })
  }

  const verfuegbar = services.istKIVerfuegbar()

  return { ladeAktion, ergebnisse, ausfuehren, verwerfen, verfuegbar }
}
