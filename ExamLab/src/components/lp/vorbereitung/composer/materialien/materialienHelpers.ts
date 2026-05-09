/** Formatiert Dateigrösse menschenlesbar */
export function formatGroesse(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const MAX_MATERIAL_GROESSE = 10 * 1024 * 1024 // 10 MB
export const ERLAUBTE_TYPEN = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'video/mp4', 'video/webm', 'video/ogg']
