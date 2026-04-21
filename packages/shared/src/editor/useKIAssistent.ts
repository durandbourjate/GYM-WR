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

/** Offener KI-Feedback-Eintrag (noch nicht bestätigt/ignoriert) */
export interface OffenerKIFeedback {
  aktion: AktionKey
  feedbackId: string
  wichtig: boolean
}

/** Hook: KI-Assistent-Logik (API-Aufrufe, Lade-/Ergebnisstatus, Feedback-Lifecycle) */
export function useKIAssistent() {
  const services = useEditorServices()
  const config = useEditorConfig()
  const [ladeAktion, setLadeAktion] = useState<AktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<AktionKey, AktionErgebnis>>>({})
  const [offeneKIFeedbacks, setOffeneKIFeedbacks] = useState<OffenerKIFeedback[]>([])

  const ausfuehren = useCallback(async (aktion: AktionKey, daten: Record<string, unknown>) => {
    if (!services.kiAssistent || !config.benutzer.email) return

    // Race-Handling (Spec B2): alter offener Eintrag derselben Aktion → fire-and-forget ignorieren
    setOffeneKIFeedbacks(prev => {
      const alt = prev.find(f => f.aktion === aktion)
      if (alt && services.markiereFeedbackAlsIgnoriert) {
        services.markiereFeedbackAlsIgnoriert(alt.feedbackId).catch((err: unknown) =>
          console.warn('[Kalibrierung] markiereFeedbackAlsIgnoriert fehlgeschlagen:', err)
        )
      }
      return prev.filter(f => f.aktion !== aktion)
    })

    setLadeAktion(aktion)
    setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: undefined }))

    try {
      const response = await services.kiAssistent(aktion, daten)
      if (!response) {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in response.ergebnis && typeof response.ergebnis.error === 'string') {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: response.ergebnis.error as string } }))
      } else {
        setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: response.ergebnis, fehler: null } }))
        // feedbackId-Tracking für Kalibrierungs-Feedback-Loop
        if (response.feedbackId) {
          setOffeneKIFeedbacks(prev => [...prev, { aktion, feedbackId: response.feedbackId!, wichtig: false }])
        }
      }
    } catch {
      setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => ({ ...prev, [aktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeAktion(null)
    }
  }, [services, config.benutzer.email])

  /** Ergebnis verwerfen + offenen Feedback-Eintrag als ignoriert markieren */
  function verwerfen(aktion: AktionKey): void {
    const fb = offeneKIFeedbacks.find(f => f.aktion === aktion)
    if (fb && services.markiereFeedbackAlsIgnoriert) {
      services.markiereFeedbackAlsIgnoriert(fb.feedbackId).catch((err: unknown) =>
        console.warn('[Kalibrierung] verwerfen: markiereFeedbackAlsIgnoriert fehlgeschlagen:', err)
      )
    }
    setOffeneKIFeedbacks(prev => prev.filter(f => f.aktion !== aktion))
    setErgebnisse((prev: Partial<Record<AktionKey, AktionErgebnis>>) => {
      const neu = { ...prev }
      delete neu[aktion]
      return neu
    })
  }

  /** Stern-Markierung: wichtig-Flag auf Eintrag der Aktion setzen */
  function markiereWichtig(aktion: AktionKey, wert: boolean): void {
    setOffeneKIFeedbacks(prev => prev.map(f => f.aktion === aktion ? { ...f, wichtig: wert } : f))
  }

  /** Snapshot aller offenen Feedback-Einträge (z.B. für Save-Handler) */
  function alleOffenenFeedbacks(): OffenerKIFeedback[] {
    return offeneKIFeedbacks
  }

  /** Nach Save: alle Einträge leeren */
  function reset(): void {
    setOffeneKIFeedbacks([])
    setErgebnisse({})
  }

  const verfuegbar = services.istKIVerfuegbar()

  return {
    ladeAktion,
    ergebnisse,
    ausfuehren,
    verwerfen,
    verfuegbar,
    offeneKIFeedbacks,
    markiereWichtig,
    alleOffenenFeedbacks,
    reset,
  }
}
