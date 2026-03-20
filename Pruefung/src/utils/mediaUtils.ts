// Grössenlimits
export const MAX_GROESSE_STANDARD = 5 * 1024 * 1024  // 5 MB (Bild/PDF/Audio)
export const MAX_GROESSE_VIDEO = 25 * 1024 * 1024     // 25 MB (Video)

export function maxGroesseFuerMimeType(mimeType: string): number {
  return mimeType.startsWith('video/') ? MAX_GROESSE_VIDEO : MAX_GROESSE_STANDARD
}

export function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// MIME-Type Helpers
export function istBild(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function istAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function istVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/') && mimeType !== 'video/embed'
}

export function istEmbed(mimeType: string): boolean {
  return mimeType === 'video/embed'
}

export function istPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

// Akzeptierte MIME-Types für Datei-Upload
export const AKZEPTIERTE_MIME_TYPES = 'image/*,application/pdf,audio/*,video/*'

// URL-Parsing
export interface EmbedInfo {
  plattform: 'youtube' | 'vimeo' | 'nanoo' | 'unbekannt'
  embedUrl: string
  titel: string
}

export function parseVideoUrl(url: string): EmbedInfo | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) {
    return {
      plattform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      titel: `YouTube Video ${ytMatch[1]}`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return {
      plattform: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      titel: `Vimeo Video ${vimeoMatch[1]}`,
    }
  }

  // nanoo.tv (generisch)
  if (url.includes('nanoo.tv')) {
    const embedUrl = url.includes('/link/') ? url.replace('/link/', '/embed/') : url
    return {
      plattform: 'nanoo',
      embedUrl,
      titel: 'nanoo.tv Video',
    }
  }

  return null
}

// Drive-URLs für Medien
export function driveStreamUrl(driveFileId: string): string {
  return `https://drive.google.com/uc?id=${driveFileId}&export=download`
}

export function drivePreviewUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${driveFileId}/preview`
}

export function driveViewUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${driveFileId}/view`
}
