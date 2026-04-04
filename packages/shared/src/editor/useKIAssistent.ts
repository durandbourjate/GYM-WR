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
      const result = await services.kiAssistent(aktion, daten)
      if (!result) {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in result && typeof result.error === 'string') {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: result.error as string } }))
      } else {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: result, fehler: null } }))
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
