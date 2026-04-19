import type { MediaQuelle } from '../types/mediaQuelle'
import { mediaQuelleZuImgSrc, mediaQuelleZuIframeSrc, type AppAssetResolver } from '../utils/mediaQuelleUrl'
import { istBild, istAudio, istVideo, istPDF } from '../editor/utils/mediaUtils'

interface Props {
  quelle: MediaQuelle
  appResolver: AppAssetResolver
  alt?: string
  className?: string
  hoehe?: number
}

export default function MediaAnzeige({ quelle, appResolver, alt, className, hoehe = 400 }: Props) {
  if (istBild(quelle.mimeType)) {
    return (
      <img
        src={mediaQuelleZuImgSrc(quelle, appResolver)}
        alt={alt ?? quelle.dateiname ?? ''}
        className={className}
      />
    )
  }
  if (istPDF(quelle.mimeType)) {
    return (
      <iframe
        src={mediaQuelleZuIframeSrc(quelle, appResolver)}
        title={alt ?? quelle.dateiname ?? 'PDF'}
        className={className}
        style={{ width: '100%', height: hoehe, border: 0 }}
      />
    )
  }
  if (istAudio(quelle.mimeType)) {
    return <audio src={mediaQuelleZuImgSrc(quelle, appResolver)} controls className={className} />
  }
  if (istVideo(quelle.mimeType)) {
    return (
      <video
        src={mediaQuelleZuImgSrc(quelle, appResolver)}
        controls
        className={className}
        style={{ maxHeight: hoehe }}
      />
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700">
      📎 Datei: {quelle.dateiname ?? quelle.mimeType}
    </span>
  )
}
