import type { MediaQuelle } from '../types/mediaQuelle'

function extrahiereDriveId(url: string): string | null {
  const lh3 = url.match(/lh3\.googleusercontent\.com\/d\/([^/?#]+)/)
  if (lh3) return lh3[1]
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (drive) return drive[1]
  const driveOpen = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (driveOpen) return driveOpen[1]
  return null
}

function mimeTypeFuerEndung(pfad: string | undefined): string {
  if (!pfad) return 'application/octet-stream'
  const lower = pfad.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.m4a')) return 'audio/mp4'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.webm')) return 'video/webm'
  if (lower.endsWith('.mp4')) return 'video/mp4'
  return 'application/octet-stream'
}

function klassifiziereRelativenPfad(cleaned: string): 'pool' | 'app' {
  if (cleaned.startsWith('img/') || cleaned.startsWith('pool-bilder/')) return 'pool'
  return 'app'
}

interface AltBildFrage {
  bildUrl?: string
  bildDriveFileId?: string
}

export function bildQuelleAus(frage: AltBildFrage): MediaQuelle | null {
  if (frage.bildDriveFileId) {
    return { typ: 'drive', driveFileId: frage.bildDriveFileId, mimeType: 'image/png' }
  }
  const url = frage.bildUrl
  if (!url || typeof url !== 'string' || !url.length) return null

  if (url.startsWith('data:')) {
    const match = url.match(/^data:([^;]+);base64,(.+)$/)
    if (match) return { typ: 'inline', base64: match[2], mimeType: match[1] }
    return null
  }

  const driveId = extrahiereDriveId(url)
  if (driveId) return { typ: 'drive', driveFileId: driveId, mimeType: mimeTypeFuerEndung(url) || 'image/png' }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { typ: 'extern', url, mimeType: mimeTypeFuerEndung(url) }
  }

  const cleaned = url.replace(/^\.?\//, '')
  const typ = klassifiziereRelativenPfad(cleaned)
  if (typ === 'pool') {
    return { typ: 'pool', poolPfad: cleaned, mimeType: mimeTypeFuerEndung(cleaned) }
  }
  return { typ: 'app', appPfad: cleaned, mimeType: mimeTypeFuerEndung(cleaned) }
}

interface AltPDFFrage {
  pdfBase64?: string
  pdfDriveFileId?: string
  pdfUrl?: string
  pdfDateiname?: string
}

export function pdfQuelleAus(frage: AltPDFFrage): MediaQuelle | null {
  const dateiname = frage.pdfDateiname

  if (frage.pdfBase64) {
    return { typ: 'inline', base64: frage.pdfBase64, mimeType: 'application/pdf', dateiname }
  }
  if (frage.pdfDriveFileId) {
    return { typ: 'drive', driveFileId: frage.pdfDriveFileId, mimeType: 'application/pdf', dateiname }
  }
  const url = frage.pdfUrl
  if (!url) return null

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const driveId = extrahiereDriveId(url)
    if (driveId) return { typ: 'drive', driveFileId: driveId, mimeType: 'application/pdf', dateiname }
    return { typ: 'extern', url, mimeType: 'application/pdf', dateiname }
  }

  const cleaned = url.replace(/^\.?\//, '')
  const typ = klassifiziereRelativenPfad(cleaned)
  if (typ === 'pool') {
    return { typ: 'pool', poolPfad: cleaned, mimeType: 'application/pdf', dateiname }
  }
  return { typ: 'app', appPfad: cleaned, mimeType: 'application/pdf', dateiname }
}

interface AltFrageAnhang {
  id: string
  driveFileId?: string
  base64?: string
  url?: string
  mimeType?: string
  dateiname?: string
}

export function anhangQuelleAus(anhang: AltFrageAnhang): MediaQuelle | null {
  const dateiname = anhang.dateiname
  const mimeType = anhang.mimeType || mimeTypeFuerEndung(dateiname)

  if (anhang.driveFileId) {
    return { typ: 'drive', driveFileId: anhang.driveFileId, mimeType, dateiname }
  }
  if (anhang.base64) {
    return { typ: 'inline', base64: anhang.base64, mimeType, dateiname }
  }
  if (anhang.url) {
    if (anhang.url.startsWith('http://') || anhang.url.startsWith('https://')) {
      const driveId = extrahiereDriveId(anhang.url)
      if (driveId) return { typ: 'drive', driveFileId: driveId, mimeType, dateiname }
      return { typ: 'extern', url: anhang.url, mimeType, dateiname }
    }
    const cleaned = anhang.url.replace(/^\.?\//, '')
    const typ = klassifiziereRelativenPfad(cleaned)
    if (typ === 'pool') return { typ: 'pool', poolPfad: cleaned, mimeType, dateiname }
    return { typ: 'app', appPfad: cleaned, mimeType, dateiname }
  }
  return null
}
