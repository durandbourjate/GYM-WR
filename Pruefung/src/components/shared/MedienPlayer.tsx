import { useState, useRef, useCallback } from 'react'

interface MedienPlayerProps {
  url: string
  typ: 'audio' | 'video'
  maxAbspielungen?: number
  autoplay?: boolean
}

/**
 * Shared Audio/Video Player mit optionalem Abspiel-Limit.
 * Wenn maxAbspielungen gesetzt: Zählt Abspielungen, deaktiviert nach Limit.
 */
export default function MedienPlayer({ url, typ, maxAbspielungen, autoplay }: MedienPlayerProps) {
  const [abspielungen, setAbspielungen] = useState(0)
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null)

  const limitErreicht = maxAbspielungen !== undefined && abspielungen >= maxAbspielungen

  const handleEnded = useCallback(() => {
    setAbspielungen(prev => prev + 1)
  }, [])

  // Wenn Limit erreicht: Pause erzwingen
  const handlePlay = useCallback(() => {
    if (limitErreicht && mediaRef.current) {
      mediaRef.current.pause()
    }
  }, [limitErreicht])

  if (typ === 'audio') {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          controls
          autoPlay={autoplay && !limitErreicht}
          preload="metadata"
          className={`w-full ${limitErreicht ? 'pointer-events-none opacity-50' : ''}`}
          onEnded={handleEnded}
          onPlay={handlePlay}
        >
          <source src={url} />
          Audio nicht unterstuetzt.
        </audio>
        {maxAbspielungen !== undefined && (
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400">
            {limitErreicht
              ? 'Maximale Abspielungen erreicht'
              : `Noch ${maxAbspielungen - abspielungen}x abspielen`}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        controls
        autoPlay={autoplay && !limitErreicht}
        preload="metadata"
        className={`w-full max-h-96 ${limitErreicht ? 'pointer-events-none opacity-50' : ''}`}
        onEnded={handleEnded}
        onPlay={handlePlay}
      >
        <source src={url} />
        Video nicht unterstuetzt.
      </video>
      {maxAbspielungen !== undefined && (
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400">
          {limitErreicht
            ? 'Maximale Abspielungen erreicht'
            : `Noch ${maxAbspielungen - abspielungen}x abspielen`}
        </div>
      )}
    </div>
  )
}
