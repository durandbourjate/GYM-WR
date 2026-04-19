/**
 * Kanonische Media-Referenz für Bilder, PDFs und Anhänge.
 *
 * Discriminated Union: Der Compiler erzwingt bei `switch(quelle.typ)` die
 * vollständige Abdeckung aller Varianten. Neue Medien-Quellen erweitern
 * den Union-Type — Render-Code crasht zur Compile-Zeit, bevor ein Bug
 * produktiv wird.
 *
 * Ersetzt die früheren parallelen Felder (Phase 6 entfernt):
 *   Bild:   bildUrl + bildDriveFileId
 *   PDF:    pdfBase64 + pdfDriveFileId + pdfUrl + pdfDateiname
 *   Anhang: {base64, driveFileId, url, mimeType, dateiname} vermischt
 *
 * Varianten:
 *   drive  — Google Drive File-ID (Backend-uploaded)
 *   pool   — Uebungen/Uebungspools/-Pfad (GitHub Pages, Cross-Site)
 *   app    — ExamLab/public/-Pfad (lokales App-Asset, via BASE_URL)
 *   extern — Beliebige absolute http(s)-URL
 *   inline — Base64-encoded (Demo, klein; limit ~5MB wegen Sheet-Cell)
 */
export type MediaQuelle =
  | { typ: 'drive'; driveFileId: string; mimeType: string; dateiname?: string }
  | { typ: 'pool'; poolPfad: string; mimeType: string; dateiname?: string }
  | { typ: 'app'; appPfad: string; mimeType: string; dateiname?: string }
  | { typ: 'extern'; url: string; mimeType: string; dateiname?: string }
  | { typ: 'inline'; base64: string; mimeType: string; dateiname?: string }

export function istDriveQuelle(q: MediaQuelle): q is Extract<MediaQuelle, { typ: 'drive' }> {
  return q.typ === 'drive'
}
export function istPoolQuelle(q: MediaQuelle): q is Extract<MediaQuelle, { typ: 'pool' }> {
  return q.typ === 'pool'
}
export function istAppQuelle(q: MediaQuelle): q is Extract<MediaQuelle, { typ: 'app' }> {
  return q.typ === 'app'
}
export function istExternQuelle(q: MediaQuelle): q is Extract<MediaQuelle, { typ: 'extern' }> {
  return q.typ === 'extern'
}
export function istInlineQuelle(q: MediaQuelle): q is Extract<MediaQuelle, { typ: 'inline' }> {
  return q.typ === 'inline'
}
