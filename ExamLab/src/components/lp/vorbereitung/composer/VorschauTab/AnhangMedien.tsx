import { useState } from 'react'
import type { FrageAnhang } from '../../../../../types/fragen-storage'
import MediaAnhang from '../../../../MediaAnhang.tsx'

/** Zeigt alle Medien-Anhänge inline an */
export default function AnhangMedien({ anhaenge }: { anhaenge: FrageAnhang[] }) {
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  if (!anhaenge || anhaenge.length === 0) return null

  const lightboxAnhang = lightboxId ? anhaenge.find((a) => a.id === lightboxId) : null

  return (
    <>
      <div className="space-y-2 mt-2">
        {anhaenge.map((a) => (
          <MediaAnhang
            key={a.id}
            anhang={a}
            bildSz={a.bildGroesse === 'klein' ? 'w200' : a.bildGroesse === 'gross' ? 'w800' : 'w400'}
            onLightbox={setLightboxId}
          />
        ))}
      </div>
      {lightboxAnhang && lightboxAnhang.mimeType.startsWith('image/') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={() => setLightboxId(null)}>
          <button type="button" onClick={() => setLightboxId(null)} className="absolute top-4 right-4 w-10 h-10 text-white text-2xl bg-black/40 rounded-full hover:bg-black/60 cursor-pointer flex items-center justify-center">×</button>
          <img
            src={`https://drive.google.com/thumbnail?id=${lightboxAnhang.driveFileId}&sz=w800`}
            alt={lightboxAnhang.beschreibung || lightboxAnhang.dateiname}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
