import { useState } from 'react'
import type { FrageAnhang } from '../types/fragen.ts'
import { istBild, istAudio, istVideo, istEmbed, istPDF, driveStreamUrl, drivePreviewUrl, driveViewUrl } from '../utils/mediaUtils.ts'

interface Props {
  anhang: FrageAnhang
  /** Bildgrösse für Thumbnails (nur bei Bildern) */
  bildSz?: string
  /** Lightbox-Callback (nur bei Bildern) */
  onLightbox?: (id: string) => void
}

export default function MediaAnhang({ anhang, bildSz = 'w400', onLightbox }: Props) {
  const [fehler, setFehler] = useState(false)

  if (fehler) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm text-slate-500 dark:text-slate-400">
        Medium konnte nicht geladen werden.{' '}
        {anhang.driveFileId && (
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-700 dark:hover:text-slate-200"
          >
            In Drive öffnen
          </a>
        )}
      </div>
    )
  }

  // Bild
  if (istBild(anhang.mimeType)) {
    const thumbnailUrl = anhang.externeUrl || `https://drive.google.com/thumbnail?id=${anhang.driveFileId}&sz=${bildSz}`
    return (
      <div className="group">
        <button
          type="button"
          onClick={() => onLightbox?.(anhang.id)}
          className="block w-full cursor-pointer"
          title={anhang.beschreibung || anhang.dateiname}
        >
          <img
            src={thumbnailUrl}
            alt={anhang.beschreibung || anhang.dateiname}
            className="max-w-full rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm group-hover:shadow-md transition-shadow"
            loading="lazy"
            onError={() => setFehler(true)}
          />
        </button>
        {anhang.beschreibung && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">{anhang.beschreibung}</p>
        )}
      </div>
    )
  }

  // Audio
  if (istAudio(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <audio
          controls
          preload="metadata"
          className="w-full"
          onError={() => setFehler(true)}
        >
          <source src={driveStreamUrl(anhang.driveFileId)} type={anhang.mimeType} />
        </audio>
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">🎵 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // Video-Embed (YouTube/Vimeo/nanoo)
  if (istEmbed(anhang.mimeType) && anhang.url) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={anhang.url}
            title={anhang.beschreibung || anhang.dateiname}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onError={() => setFehler(true)}
          />
        </div>
        {anhang.beschreibung && (
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30">
            <span className="text-xs text-slate-600 dark:text-slate-300 italic">{anhang.beschreibung}</span>
          </div>
        )}
      </div>
    )
  }

  // Video (Drive-Upload)
  if (istVideo(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={drivePreviewUrl(anhang.driveFileId)}
            title={anhang.dateiname}
            className="absolute inset-0 w-full h-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">🎬 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // PDF (wie bisher)
  if (istPDF(anhang.mimeType)) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
        <iframe
          src={drivePreviewUrl(anhang.driveFileId)}
          title={anhang.dateiname}
          className="w-full h-64 border-0"
          allow="autoplay"
        />
        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
          <span className="text-xs text-slate-600 dark:text-slate-300 truncate">📄 {anhang.dateiname}</span>
          <a
            href={driveViewUrl(anhang.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline shrink-0 ml-2"
          >
            Öffnen
          </a>
        </div>
      </div>
    )
  }

  // Unbekannter Typ: Fallback
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm text-slate-500">
      📎 {anhang.dateiname}
      {anhang.driveFileId && (
        <a href={driveViewUrl(anhang.driveFileId)} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
          Öffnen
        </a>
      )}
    </div>
  )
}
