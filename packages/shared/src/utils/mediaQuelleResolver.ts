import type { MediaQuelle } from '../types/mediaQuelle'
import { bildQuelleAus, pdfQuelleAus, anhangQuelleAus } from './mediaQuelleMigrator'

/**
 * Einheitlicher Read-Pfad: bevorzugt das neue kanonische Feld,
 * fällt auf Migrator über Alt-Felder zurück.
 *
 * Zweck: Konsumenten (SuS-Fragetypen, Korrektur, DruckAnsicht) schreiben
 * `const q = ermittleBildQuelle(frage)` statt `frage.bild ?? bildQuelleAus(frage)`
 * und bleiben stabil durch den Dual-Write→Phase-6-Cleanup-Übergang.
 */

interface AltBildFrage {
  bild?: MediaQuelle
  bildUrl?: string
  bildDriveFileId?: string
}

export function ermittleBildQuelle(frage: AltBildFrage): MediaQuelle | null {
  if (frage.bild) return frage.bild
  return bildQuelleAus(frage)
}

interface AltPdfFrage {
  pdf?: MediaQuelle
  pdfBase64?: string
  pdfDriveFileId?: string
  pdfUrl?: string
  pdfDateiname?: string
}

export function ermittlePdfQuelle(frage: AltPdfFrage): MediaQuelle | null {
  if (frage.pdf) return frage.pdf
  return pdfQuelleAus(frage)
}

interface AltAnhang {
  id: string
  quelle?: MediaQuelle
  driveFileId?: string
  base64?: string
  url?: string
  mimeType?: string
  dateiname?: string
}

export function ermittleAnhangQuelle(anhang: AltAnhang): MediaQuelle | null {
  if (anhang.quelle) return anhang.quelle
  return anhangQuelleAus(anhang)
}
