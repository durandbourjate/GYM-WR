/**
 * KI-Assistent Hook — abstrahiert.
 * Nutzt EditorServices statt direktem apiService.
 */
import { useState, useCallback } from 'react'
import { useEditorServices, useEditorConfig } from './EditorContext'

export type KiAktionKey =
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

export interface KiAktionErgebnis {
  daten: Record<string, unknown> | null
  fehler: string | null
}

/** Offener KI-Feedback-Eintrag (noch nicht bestätigt/ignoriert) */
export interface OffenerKIFeedback {
  kiAktion: KiAktionKey
  feedbackId: string
  wichtig: boolean
}

/** Hook: KI-Assistent-Logik (API-Aufrufe, Lade-/Ergebnisstatus, Feedback-Lifecycle) */
export function useKIAssistent() {
  const services = useEditorServices()
  const config = useEditorConfig()
  const [ladeKiAktion, setLadeKiAktion] = useState<KiAktionKey | null>(null)
  const [ergebnisse, setErgebnisse] = useState<Partial<Record<KiAktionKey, KiAktionErgebnis>>>({})
  const [offeneKIFeedbacks, setOffeneKIFeedbacks] = useState<OffenerKIFeedback[]>([])

  const ausfuehren = useCallback(async (kiAktion: KiAktionKey, daten: Record<string, unknown>) => {
    if (!services.kiAssistent || !config.benutzer.email) return

    // Race-Handling (Spec B2): alter offener Eintrag derselben Aktion → fire-and-forget ignorieren
    setOffeneKIFeedbacks(prev => {
      const alt = prev.find(f => f.kiAktion === kiAktion)
      if (alt && services.markiereFeedbackAlsIgnoriert) {
        services.markiereFeedbackAlsIgnoriert(alt.feedbackId).catch((err: unknown) =>
          console.warn('[Kalibrierung] markiereFeedbackAlsIgnoriert fehlgeschlagen:', err)
        )
      }
      return prev.filter(f => f.kiAktion !== kiAktion)
    })

    setLadeKiAktion(kiAktion)
    setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => ({ ...prev, [kiAktion]: undefined }))

    try {
      const response = await services.kiAssistent(kiAktion, daten)
      if (!response) {
        setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => ({ ...prev, [kiAktion]: { daten: null, fehler: 'Keine Antwort vom Server' } }))
      } else if ('error' in response.ergebnis && typeof response.ergebnis.error === 'string') {
        setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => ({ ...prev, [kiAktion]: { daten: null, fehler: response.ergebnis.error as string } }))
      } else {
        setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => ({ ...prev, [kiAktion]: { daten: response.ergebnis, fehler: null } }))
        // feedbackId-Tracking für Kalibrierungs-Feedback-Loop
        if (response.feedbackId) {
          setOffeneKIFeedbacks(prev => [...prev, { kiAktion, feedbackId: response.feedbackId!, wichtig: false }])
        }
      }
    } catch {
      setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => ({ ...prev, [kiAktion]: { daten: null, fehler: 'Netzwerkfehler' } }))
    } finally {
      setLadeKiAktion(null)
    }
  }, [services, config.benutzer.email])

  /** Ergebnis verwerfen + offenen Feedback-Eintrag als ignoriert markieren */
  function verwerfen(kiAktion: KiAktionKey): void {
    const fb = offeneKIFeedbacks.find(f => f.kiAktion === kiAktion)
    if (fb && services.markiereFeedbackAlsIgnoriert) {
      services.markiereFeedbackAlsIgnoriert(fb.feedbackId).catch((err: unknown) =>
        console.warn('[Kalibrierung] verwerfen: markiereFeedbackAlsIgnoriert fehlgeschlagen:', err)
      )
    }
    setOffeneKIFeedbacks(prev => prev.filter(f => f.kiAktion !== kiAktion))
    setErgebnisse((prev: Partial<Record<KiAktionKey, KiAktionErgebnis>>) => {
      const neu = { ...prev }
      delete neu[kiAktion]
      return neu
    })
  }

  /** Stern-Markierung: wichtig-Flag auf Eintrag der Aktion setzen */
  function markiereWichtig(kiAktion: KiAktionKey, wert: boolean): void {
    setOffeneKIFeedbacks(prev => prev.map(f => f.kiAktion === kiAktion ? { ...f, wichtig: wert } : f))
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
    ladeKiAktion,
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
