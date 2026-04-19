import type { MediaQuelle } from '../types/mediaQuelle'

export const POOL_BASE_URL = 'https://durandbourjate.github.io/GYM-WR-DUY/Uebungen/Uebungspools/'

/**
 * App-Resolver wird injiziert — die konkrete BASE_URL-Auflösung lebt in
 * `ExamLab/src/utils/assetUrl.ts::toAssetUrl` und soll nicht dupliziert werden.
 * Konsumenten in ExamLab importieren `toAssetUrl` und reichen es als 2. Arg durch.
 */
export type AppAssetResolver = (appPfad: string) => string

export function mediaQuelleZuImgSrc(quelle: MediaQuelle, appResolver: AppAssetResolver): string {
  switch (quelle.typ) {
    case 'drive':
      return `https://lh3.googleusercontent.com/d/${quelle.driveFileId}`
    case 'pool':
      return POOL_BASE_URL + quelle.poolPfad
    case 'app':
      return appResolver(quelle.appPfad)
    case 'extern':
      return quelle.url
    case 'inline':
      return `data:${quelle.mimeType};base64,${quelle.base64}`
  }
}

export function mediaQuelleZuIframeSrc(quelle: MediaQuelle, appResolver: AppAssetResolver): string {
  switch (quelle.typ) {
    case 'drive':
      return `https://drive.google.com/file/d/${quelle.driveFileId}/preview`
    case 'pool':
      return POOL_BASE_URL + quelle.poolPfad
    case 'app':
      return appResolver(quelle.appPfad)
    case 'extern':
      return quelle.url
    case 'inline':
      return `data:${quelle.mimeType};base64,${quelle.base64}`
  }
}
