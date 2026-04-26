import type { FrageAnhang } from '../types/fragen'
import { drivePreviewUrl, istPDF } from './mediaUtils'

/**
 * Bundle G.b — Extrahiert PDF-Prefetch-URLs aus einer Anhang-Liste.
 *
 * Liefert maximal **eine** URL: die drivePreviewUrl des ersten PDF-Anhangs.
 * Andere Mime-Types (Bild/Audio/Video) werden ignoriert (siehe Spec G.b).
 * Anhänge ohne driveFileId werden ignoriert.
 */
export function pdfPrefetchUrls(anhaenge: readonly FrageAnhang[] | undefined): string[] {
  if (!anhaenge || anhaenge.length === 0) return []
  const ersterPdf = anhaenge.find((a) => istPDF(a.mimeType) && Boolean(a.driveFileId))
  if (!ersterPdf) return []
  return [drivePreviewUrl(ersterPdf.driveFileId)]
}
