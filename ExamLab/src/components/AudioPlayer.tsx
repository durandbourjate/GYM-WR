import { useRef, useState } from 'react'
import Tooltip from './ui/Tooltip.tsx'

interface Props {
  src: string
  /** Kompakt-Modus (kleiner, inline) */
  kompakt?: boolean
}

export default function AudioPlayer({ src, kompakt = false }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [spielt, setSpielt] = useState(false)
  const [dauer, setDauer] = useState(0)
  const [position, setPosition] = useState(0)

  function togglePlay() {
    if (!audioRef.current) return
    if (spielt) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  function formatZeit(s: number): string {
    const min = Math.floor(s / 60)
    const sek = Math.floor(s % 60)
    return `${min}:${sek.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-2 ${kompakt ? 'text-xs' : 'text-sm'}`}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={() => setDauer(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setPosition(audioRef.current?.currentTime || 0)}
        onPlay={() => setSpielt(true)}
        onPause={() => setSpielt(false)}
        onEnded={() => { setSpielt(false); setPosition(0) }}
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`${kompakt ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors cursor-pointer`}
      >
        <Tooltip text={spielt ? 'Pause' : 'Abspielen'}><span>{spielt ? '⏸' : '▶'}</span></Tooltip>
      </button>
      <span className="text-slate-500 dark:text-slate-400 tabular-nums min-w-[3rem]">
        {formatZeit(position)} / {formatZeit(dauer)}
      </span>
    </div>
  )
}
