import { useState } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder.ts'
import AudioPlayer from './AudioPlayer.tsx'
import Tooltip from './ui/Tooltip.tsx'

interface Props {
  /** Wird aufgerufen wenn Aufnahme gespeichert werden soll */
  onSpeichern: (blob: Blob) => Promise<void>
  /** Bestehende Audio-File-ID (zum Anzeigen eines Players) */
  bestehendeAudioId?: string
  kompakt?: boolean
}

export default function AudioRecorder({ onSpeichern, bestehendeAudioId, kompakt = false }: Props) {
  const { status, audioUrl, dauer, fehler, startRecording, stopRecording, verwerfen } = useAudioRecorder()
  const [speichert, setSpeichert] = useState(false)

  // Bestehender Audio-Kommentar
  if (status === 'idle' && bestehendeAudioId) {
    return (
      <div className="flex items-center gap-2">
        <AudioPlayer
          src={`https://drive.google.com/uc?id=${bestehendeAudioId}&export=download`}
          kompakt={kompakt}
        />
        <button
          type="button"
          onClick={startRecording}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline cursor-pointer"
        >
          <Tooltip text="Neue Aufnahme"><span>Ersetzen</span></Tooltip>
        </button>
      </div>
    )
  }

  // Idle: Mikrofon-Button
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={startRecording}
        className={`${kompakt ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'} flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors cursor-pointer`}
      >
        <Tooltip text="Audio-Kommentar aufnehmen"><span>🎤</span></Tooltip>
      </button>
    )
  }

  // Recording: Pulsierender Indikator
  if (status === 'recording') {
    return (
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs text-red-600 dark:text-red-400 tabular-nums">
          {Math.floor(dauer / 60)}:{(dauer % 60).toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={stopRecording}
          className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer"
        >
          Stopp
        </button>
      </div>
    )
  }

  // Preview: Player + Speichern/Verwerfen
  if (status === 'preview' && audioUrl) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <AudioPlayer src={audioUrl} kompakt={kompakt} />
        <button
          type="button"
          onClick={async () => {
            setSpeichert(true)
            const resp = await fetch(audioUrl)
            const blob = await resp.blob()
            await onSpeichern(blob)
            verwerfen()
            setSpeichert(false)
          }}
          disabled={speichert}
          className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
        >
          {speichert ? 'Speichert...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={verwerfen}
          disabled={speichert}
          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 underline cursor-pointer"
        >
          Verwerfen
        </button>
      </div>
    )
  }

  // Fehler
  if (status === 'fehler') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-500">{fehler}</span>
        <button type="button" onClick={startRecording} className="text-xs underline text-slate-500 cursor-pointer">
          Erneut versuchen
        </button>
      </div>
    )
  }

  return null
}
