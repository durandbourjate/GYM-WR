import { useState, useEffect, useCallback, useRef } from 'react'
import { apiService } from '../../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe, FragenBewertung } from '../../../types/korrektur.ts'
import type { Frage } from '../../../types/fragen.ts'
import { exportiereAlsCSV, exportiereErgebnisseAlsCSV, downloadCSV } from '../../../utils/exportUtils.ts'
import { exportiereBackupXlsx } from '../../../utils/backupExport.ts'

interface KorrekturActionsOptions {
  pruefungId: string
  userEmail: string
  korrektur: PruefungsKorrektur | null
  setKorrektur: React.Dispatch<React.SetStateAction<PruefungsKorrektur | null>>
  abgaben: Record<string, SchuelerAbgabe>
  fragen: Frage[]
  queueSave: (data: import('../../../types/korrektur.ts').KorrekturZeileUpdate) => void
}

export function useKorrekturActions({
  pruefungId, userEmail, korrektur, setKorrektur, abgaben, fragen, queueSave,
}: KorrekturActionsOptions) {
  const [batchLaeuft, setBatchLaeuft] = useState(false)
  const [aktionLaeuft, setAktionLaeuft] = useState<string | null>(null)
  const [backupLaden, setBackupLaden] = useState(false)
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'senden' | 'fertig'>('idle')
  const [feedbackErgebnis, setFeedbackErgebnis] = useState<{ erfolg: string[]; fehler: string[] } | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Polling für Batch-Fortschritt
  useEffect(() => {
    if (!batchLaeuft || !userEmail) return

    pollingRef.current = setInterval(async () => {
      const fortschritt = await apiService.ladeKorrekturFortschritt(pruefungId, userEmail)
      if (!fortschritt) return

      if (fortschritt.status === 'fertig' || fortschritt.status === 'fehler') {
        setBatchLaeuft(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        const result = await apiService.ladeKorrektur(pruefungId, userEmail)
        if (result) setKorrektur(result)
      } else {
        setKorrektur((prev) => prev ? {
          ...prev,
          batchStatus: fortschritt.status as PruefungsKorrektur['batchStatus'],
          batchFortschritt: fortschritt.fortschritt,
        } : prev)
      }
    }, 3000)

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [batchLaeuft, userEmail, pruefungId, setKorrektur])

  const handleBewertungUpdate = useCallback((schuelerEmail: string, frageId: string, updates: {
    lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null; kiPunkte?: number | null; kiBegruendung?: string | null; quelle?: FragenBewertung['quelle']
  }) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        schueler: prev.schueler.map((s) => {
          if (s.email !== schuelerEmail) return s
          const bewertung = s.bewertungen[frageId]
          if (!bewertung) return s
          // null → undefined für optionale Felder (audioKommentarId)
          const cleanUpdates = { ...updates } as Record<string, unknown>
          if (cleanUpdates.audioKommentarId === null) cleanUpdates.audioKommentarId = undefined
          const neueBewertungen = { ...s.bewertungen, [frageId]: { ...bewertung, ...cleanUpdates } as FragenBewertung }
          const alleGeprueft = Object.values(neueBewertungen).every((b) => b.geprueft)
          const neuerStatus = alleGeprueft ? 'review-fertig' as const : s.korrekturStatus === 'review-fertig' ? 'offen' as const : s.korrekturStatus
          return { ...s, bewertungen: neueBewertungen, korrekturStatus: neuerStatus }
        }),
      }
    })
    queueSave({ pruefungId, schuelerEmail, frageId, ...updates })
  }, [pruefungId, queueSave, setKorrektur])

  const handleNoteOverride = useCallback((schuelerEmail: string, noteOverride: number | null) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return { ...prev, schueler: prev.schueler.map((s) => s.email !== schuelerEmail ? s : { ...s, noteOverride }) }
    })
    queueSave({ pruefungId, schuelerEmail, frageId: '__note_override__', lpPunkte: noteOverride })
  }, [pruefungId, queueSave, setKorrektur])

  const handleAudioUpload = useCallback(async (schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> => {
    if (!userEmail) return null
    return apiService.uploadAudioKommentar(userEmail, pruefungId, schuelerEmail, frageId, blob)
  }, [pruefungId, userEmail])

  const handleGesamtAudioUpdate = useCallback((email: string, audioId: string) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return { ...prev, schueler: prev.schueler.map((s) => s.email === email ? { ...s, audioGesamtkommentarId: audioId } : s) }
    })
    queueSave({ pruefungId, schuelerEmail: email, frageId: '_gesamt', audioKommentarId: audioId })
  }, [pruefungId, queueSave, setKorrektur])

  async function handleStarteKorrektur(): Promise<void> {
    if (!userEmail) return
    setAktionLaeuft('ki')
    setBatchLaeuft(true)
    setKorrektur((prev) => prev ? { ...prev, batchStatus: 'laeuft', batchFortschritt: { erledigt: 0, gesamt: 1 } } : prev)
    const result = await apiService.starteKorrektur(pruefungId, userEmail)
    if (!result?.success) {
      setBatchLaeuft(false)
      setKorrektur((prev) => prev ? { ...prev, batchStatus: 'fehler', batchFehler: result?.fehler ?? 'Unbekannter Fehler' } : prev)
    }
  }

  async function handleFeedbackSenden(): Promise<void> {
    if (!userEmail || !korrektur) return
    setFeedbackStatus('senden')
    const emails = korrektur.schueler.filter((s) => s.korrekturStatus !== 'versendet').map((s) => s.email)
    const result = await apiService.generiereUndSendeFeedback({ pruefungId, schuelerEmails: emails }, userEmail)
    setFeedbackErgebnis(result)
    setFeedbackStatus('fertig')
  }

  function handleCSVExport(): void {
    if (!korrektur) return
    downloadCSV(exportiereAlsCSV(korrektur, fragen), `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Ergebnisse.csv`)
  }

  function handleDetailExport(): void {
    if (!korrektur) return
    downloadCSV(exportiereErgebnisseAlsCSV(korrektur, fragen, abgaben), `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Detailliert.csv`)
  }

  async function handleBackupExport(): Promise<void> {
    if (!korrektur || !fragen.length) return
    setBackupLaden(true)
    try {
      await exportiereBackupXlsx({
        config: { titel: korrektur.pruefungTitel, id: pruefungId } as import('../../../types/pruefung').PruefungsConfig,
        fragen, abgaben, korrektur,
      })
    } catch (e) {
      console.error('[Backup] Export fehlgeschlagen:', e)
    } finally {
      setBackupLaden(false)
    }
  }

  return {
    batchLaeuft, aktionLaeuft, setAktionLaeuft,
    backupLaden,
    feedbackDialog, setFeedbackDialog,
    feedbackStatus, setFeedbackStatus,
    feedbackErgebnis,
    handleBewertungUpdate, handleNoteOverride,
    handleAudioUpload, handleGesamtAudioUpdate,
    handleStarteKorrektur, handleFeedbackSenden,
    handleCSVExport, handleDetailExport, handleBackupExport,
  }
}
