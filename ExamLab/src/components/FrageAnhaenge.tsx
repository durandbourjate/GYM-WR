import { useState } from 'react'
import type { FrageAnhang } from '../types/fragen.ts'
import MediaAnhang from './MediaAnhang.tsx'
import Tooltip from './ui/Tooltip.tsx'

interface Props {
  anhaenge: FrageAnhang[]
}

/** Zeigt Anhänge einer Frage an (alle Medientypen) */
export default function FrageAnhaenge({ anhaenge }: Props) {
  const [lightboxId, setLightboxId] = useState<string | null>(null)

  if (!anhaenge || anhaenge.length === 0) return null

  const lightboxAnhang = lightboxId ? anhaenge.find((a) => a.id === lightboxId) : null

  return (
    <>
      <div className="space-y-3 mt-3">
        {anhaenge.map((a) => (
          <MediaAnhang
            key={a.id}
            anhang={a}
            bildSz="w800"
            onLightbox={setLightboxId}
          />
        ))}
      </div>

      {/* Lightbox (nur Bilder) */}
      {lightboxAnhang && lightboxAnhang.mimeType.startsWith('image/') && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxId(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxId(null)}
            className="absolute top-4 right-4 w-10 h-10 text-white text-2xl bg-black/40 rounded-full hover:bg-black/60 transition-colors cursor-pointer flex items-center justify-center"
          >
            <Tooltip text="Schliessen" position="left"><span>×</span></Tooltip>
          </button>
          <img
            src={`https://drive.google.com/thumbnail?id=${lightboxAnhang.driveFileId}&sz=w1600`}
            alt={lightboxAnhang.beschreibung || lightboxAnhang.dateiname}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
