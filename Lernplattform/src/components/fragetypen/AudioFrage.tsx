import { useRef, useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'

export default function AudioFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf AudioFrage (shared discriminated union)
  if (frage.typ !== 'audio') return null
  const audio = frage

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const [aufnahmeAktiv, setAufnahmeAktiv] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [selbstbewertung, setSelbstbewertung] = useState<'korrekt' | 'teilweise' | 'falsch' | null>(null)

  const maxDauer = audio.maxDauerSekunden || 120 // Default 2 Minuten

  const startAufnahme = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder
      chunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        // Data-URL für Antwort
        const reader = new FileReader()
        reader.onloadend = () => {
          if (reader.result) {
            onAntwort({ typ: 'audio', datenUrl: reader.result as string })
          }
        }
        reader.readAsDataURL(blob)
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setAufnahmeAktiv(true)
      setFehler(null)

      // Auto-Stop nach maxDauer
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop()
          setAufnahmeAktiv(false)
        }
      }, maxDauer * 1000)

    } catch {
      setFehler('Mikrofon-Zugriff verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.')
    }
  }

  const stopAufnahme = () => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
      setAufnahmeAktiv(false)
    }
  }

  const handleSelbstbewertung = (bewertung: 'korrekt' | 'teilweise' | 'falsch') => {
    setSelbstbewertung(bewertung)
    onAntwort({ typ: 'audio', datenUrl: audioUrl || '', selbstbewertung: bewertung })
  }

  return (
    <div className="space-y-3">
      {fehler && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {fehler}
        </div>
      )}

      {!audioUrl && !disabled && (
        <div className="flex justify-center">
          {!aufnahmeAktiv ? (
            <button onClick={startAufnahme} className="px-6 py-4 rounded-full bg-red-500 text-white font-medium min-h-[48px] flex items-center gap-2 hover:bg-red-600">
              <span className="w-4 h-4 rounded-full bg-white" />
              Aufnahme starten
            </button>
          ) : (
            <button onClick={stopAufnahme} className="px-6 py-4 rounded-full bg-gray-700 text-white font-medium min-h-[48px] flex items-center gap-2 animate-pulse">
              <span className="w-4 h-4 rounded-sm bg-red-500" />
              Aufnahme stoppen
            </button>
          )}
        </div>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio src={audioUrl} controls className="w-full" />
          {!disabled && !feedbackSichtbar && (
            <button onClick={() => { setAudioUrl(null); chunks.current = [] }} className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
              Neu aufnehmen
            </button>
          )}
        </div>
      )}

      {feedbackSichtbar && (
        <div className="space-y-3">
          {frage.musterlosung && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/20 text-slate-800 dark:text-slate-200">
              <p className="font-medium text-sm mb-1">Musterantwort:</p>
              <p className="text-sm">{frage.musterlosung}</p>
            </div>
          )}

          {!selbstbewertung && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Wie hast du abgeschnitten?</p>
              <div className="flex gap-2">
                <button onClick={() => handleSelbstbewertung('korrekt')} className="flex-1 py-3 rounded-xl border-2 border-green-300 text-green-700 dark:text-green-300 dark:border-green-600 font-medium min-h-[48px]">Korrekt</button>
                <button onClick={() => handleSelbstbewertung('teilweise')} className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-600 font-medium min-h-[48px]">Teilweise</button>
                <button onClick={() => handleSelbstbewertung('falsch')} className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-700 dark:text-red-300 dark:border-red-600 font-medium min-h-[48px]">Falsch</button>
              </div>
            </div>
          )}

          {selbstbewertung && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
        </div>
      )}
    </div>
  )
}
