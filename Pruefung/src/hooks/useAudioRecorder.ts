import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioRecorderState {
  status: 'idle' | 'recording' | 'preview' | 'uploading' | 'done' | 'fehler'
  audioBlob: Blob | null
  audioUrl: string | null
  dauer: number       // Sekunden
  fehler: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  verwerfen: () => void
}

export function useAudioRecorder(): AudioRecorderState {
  const [status, setStatus] = useState<AudioRecorderState['status']>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [dauer, setDauer] = useState(0)
  const [fehler, setFehler] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startZeitRef = useRef<number>(0)

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // Guard gegen Doppelklick waehrend Permission-Popup offen ist
  const isStartingRef = useRef(false)

  const startRecording = useCallback(async () => {
    if (isStartingRef.current) return // Bereits am Starten (z.B. Permission-Popup offen)
    isStartingRef.current = true
    try {
      setFehler(null)
      chunksRef.current = []
      setStatus('recording') // Sofort Status setzen → Button verschwindet

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Format: WebM/Opus (Chrome/Firefox) oder MP4 (Safari)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        setStatus('preview')

        // Stream stoppen
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }

      recorder.start() // Ohne timeslice — ondataavailable feuert einmal bei stop
      startZeitRef.current = Date.now()

      // Timer für Dauer-Anzeige
      timerRef.current = setInterval(() => {
        setDauer(Math.floor((Date.now() - startZeitRef.current) / 1000))
      }, 500)
    } catch (err) {
      const msg = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Mikrofon-Zugriff wurde verweigert. Bitte Berechtigung erteilen.'
        : 'Mikrofon konnte nicht gestartet werden.'
      setFehler(msg)
      setStatus('fehler')
    } finally {
      isStartingRef.current = false
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const verwerfen = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDauer(0)
    setStatus('idle')
  }, [audioUrl])

  return { status, audioBlob, audioUrl, dauer, fehler, startRecording, stopRecording, verwerfen }
}
