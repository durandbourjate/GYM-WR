import { useState, useRef, useCallback, useEffect } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { AudioFrage as AudioFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { uploadAudioAntwort } from '../../services/uploadApi.ts'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import { useAuthStore } from '../../store/authStore.ts'

interface Props {
  frage: AudioFrageType
}

export default function AudioFrage({ frage }: Props) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const bestehendeAufnahme = antwort?.typ === 'audio' ? antwort : null

  const [status, setStatus] = useState<'idle' | 'recording' | 'preview'>('idle')
  const [dauer, setDauer] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(bestehendeAufnahme?.aufnahmeUrl ?? null)
  const [fehler, setFehler] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startZeitRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const startRecording = useCallback(async () => {
    // Guard: Doppelklick verhindern (Permission-Dialog kann getUserMedia verzögern,
    // User klickt erneut → zwei Recorder parallel → Chunks gehen verloren)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      return
    }

    try {
      setFehler(null)
      setStatus('recording') // Sofort Status setzen → Button verschwindet → kein Doppelklick
      // getUserMedia kann den Vollbild-Modus unterbrechen (Browser-Permission-Dialog)
      // → Schonfrist setzen, damit kein Verstoss registriert wird
      window.dispatchEvent(new CustomEvent('lockdown-schonfrist', { detail: { ms: 8000 } }))
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // iOS Safari unterstützt kein WebM/Opus → Fallback auf MP4/AAC
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        // Auch leere Chunks akzeptieren — manche Browser senden size=0 zwischen echten Chunks
        chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach(t => t.stop())

        if (blob.size === 0) {
          setFehler('Aufnahme enthält keine Daten. Bitte erneut versuchen.')
          setStatus('idle')
          return
        }

        // URL.createObjectURL für lokale Wiedergabe (sofort)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setStatus('preview')

        const dauerSek = Math.round((Date.now() - startZeitRef.current) / 1000) || 0
        const pruefungId = usePruefungStore.getState().config?.id || ''
        const email = useAuthStore.getState().user?.email || ''
        const istDemo = useAuthStore.getState().istDemoModus

        // Sofort Drive-Upload starten (parallel zur Anzeige) — Payload ~300KB → Drive statt inline
        // Im Demo-Modus: Fallback auf inline Base64 (kein Backend verfügbar)
        if (pruefungId && email && !istDemo) {
          const driveUrl = await uploadAudioAntwort(pruefungId, email, frage.id, blob)
          if (driveUrl) {
            // Nur Drive-URL speichern (~50 Bytes statt ~300KB)
            onAntwort({ typ: 'audio', aufnahmeUrl: driveUrl, dauer: dauerSek })
            return
          }
          console.warn('[AudioFrage] Drive-Upload fehlgeschlagen, Fallback auf inline Base64')
        }

        // Fallback: Inline Base64 (Demo-Modus oder Upload-Fehler)
        const reader = new FileReader()
        reader.onload = () => {
          onAntwort({
            typ: 'audio',
            aufnahmeUrl: reader.result as string,
            dauer: dauerSek,
          })
        }
        reader.onerror = () => {
          setFehler('Audio konnte nicht gespeichert werden.')
        }
        reader.readAsDataURL(blob)
      }

      // Startzeit erst setzen wenn Recording tatsächlich läuft (iOS-Warmup beachten)
      recorder.onstart = () => {
        startZeitRef.current = Date.now()
      }

      // start() OHNE timeslice: ondataavailable feuert einmal bei stop().
      // timeslice (z.B. 1000ms) produziert auf manchen Browsern leere Chunks → blob.size === 0.
      recorder.start()
      setDauer(0)

      // Vollbild wiederherstellen falls nötig (getUserMedia kann es beenden)
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      }

      // Timer fuer Anzeige
      timerRef.current = setInterval(() => {
        const sek = Math.floor((Date.now() - startZeitRef.current) / 1000)
        setDauer(sek)

        // Auto-Stopp bei maxDauer
        if (frage.maxDauerSekunden && sek >= frage.maxDauerSekunden) {
          recorder.stop()
          if (timerRef.current) clearInterval(timerRef.current)
        }
      }, 250)
    } catch (err) {
      console.error('[AudioFrage] getUserMedia fehlgeschlagen:', err)
      setFehler('Mikrofon-Zugriff verweigert oder nicht verfügbar.')
      setStatus('idle')
      mediaRecorderRef.current = null
    }
  }, [frage.id, frage.maxDauerSekunden, onAntwort])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleNeuaufnahme = useCallback(() => {
    setAudioUrl(null)
    setStatus('idle')
    setDauer(0)
  }, [])

  const formatZeit = (sek: number): string => {
    const m = Math.floor(sek / 60)
    const s = sek % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        {frage.maxDauerSekunden && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            Max. {formatZeit(frage.maxDauerSekunden)}
          </span>
        )}
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Audio-Aufnahme */}
      <div className={`p-4 rounded-xl border ${
        !disabled && !bestehendeAufnahme
          ? 'border-2 border-violet-400 dark:border-violet-500'
          : 'border-slate-200 dark:border-slate-700'
      } bg-white dark:bg-slate-800`}>

        {/* Fehler */}
        {fehler && (
          <div className="text-sm text-red-600 dark:text-red-400 mb-3">{fehler}</div>
        )}

        {/* Idle: Aufnahme-Button */}
        {status === 'idle' && !audioUrl && !disabled && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <span className="w-3 h-3 rounded-full bg-white" />
            Aufnahme starten
          </button>
        )}

        {/* Recording: Pulsierender Indikator + Stopp */}
        {status === 'recording' && (
          <div className="flex items-center gap-4">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-lg font-mono text-red-600 dark:text-red-400 tabular-nums">
              {formatZeit(dauer)}
              {frage.maxDauerSekunden && (
                <span className="text-sm text-slate-400 dark:text-slate-500 ml-2">
                  / {formatZeit(frage.maxDauerSekunden)}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              Stopp
            </button>
          </div>
        )}

        {/* Preview / bestehende Aufnahme */}
        {(status === 'preview' || (status === 'idle' && audioUrl)) && audioUrl && (
          <div className="flex flex-col gap-3">
            <audio controls controlsList="nodownload noplaybackrate" src={audioUrl} className="w-full" preload="metadata" />
            {!disabled && (
              <button
                type="button"
                onClick={handleNeuaufnahme}
                className="self-start text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Neu aufnehmen
              </button>
            )}
          </div>
        )}

        {/* Abgegeben ohne Aufnahme */}
        {disabled && !audioUrl && (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            Keine Aufnahme vorhanden.
          </p>
        )}
      </div>

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}
