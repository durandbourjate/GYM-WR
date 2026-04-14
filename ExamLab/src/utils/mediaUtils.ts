// Re-Export aus shared package
export {
  MAX_GROESSE_STANDARD, MAX_GROESSE_VIDEO,
  maxGroesseFuerMimeType, formatGroesse,
  istBild, istAudio, istVideo, istEmbed, istPDF,
  AKZEPTIERTE_MIME_TYPES,
  parseVideoUrl,
  driveStreamUrl, drivePreviewUrl, driveViewUrl,
} from '@shared/editor/utils/mediaUtils'
export type { EmbedInfo } from '@shared/editor/utils/mediaUtils'
