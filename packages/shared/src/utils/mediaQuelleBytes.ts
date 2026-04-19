import type { MediaQuelle } from '../types/mediaQuelle'
import { mediaQuelleZuImgSrc, type AppAssetResolver } from './mediaQuelleUrl'

/**
 * Liefert den Binär-Inhalt der MediaQuelle als ArrayBuffer — für pdf.js,
 * Audio-Decoding, oder andere Konsumenten, die Bytes brauchen.
 *
 * Fallback-Strategie:
 * - inline → base64-decode lokal (kein Netzwerk)
 * - drive/pool/app/extern → fetch() der aufgelösten URL
 *
 * Fehler werden als Exception geworfen (400/404/Netzwerk). Caller sollte
 * Fallback-UI zeigen.
 */
export async function mediaQuelleZuArrayBuffer(
  quelle: MediaQuelle,
  appResolver: AppAssetResolver,
): Promise<ArrayBuffer> {
  if (quelle.typ === 'inline') {
    const binaryString = atob(quelle.base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)
    return bytes.buffer
  }
  const url = mediaQuelleZuImgSrc(quelle, appResolver)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MediaQuelle fetch failed: ${res.status} ${res.statusText} (${url})`)
  return res.arrayBuffer()
}
