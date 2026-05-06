import type { FrageAnhang, Fachbereich, BloomStufe } from '../../types/fragen-storage'
import { POOL_IMG_BASE_URL, genId } from './konstanten'

/** Mappt den Pool-Fach-String auf einen Fachbereich-Enum */
export function mapFachbereich(fach: string): Fachbereich {
  const f = fach.toLowerCase().trim()
  if (f.includes('vwl') || f.includes('volkswirt')) return 'VWL'
  if (f.includes('bwl') || f.includes('betriebswirt')) return 'BWL'
  if (f.includes('recht') || f.includes('law')) return 'Recht'
  // "W&R" / "WR" / "Wirtschaft und Recht" — kein eindeutiger Fachbereich, Default BWL
  if (f === 'w&r' || f === 'wr' || f === 'wirtschaft und recht' || f === 'wirtschaft & recht') return 'BWL'
  // Informatik: exakt matchen (nicht 'in' allein, das matched z.B. "Einfuehrung")
  if (f === 'in' || f === 'informatik' || f.startsWith('info')) return 'Informatik'
  // Fallback: Allgemein (nicht VWL — das wäre irreführend)
  return 'Allgemein'
}

/** Mappt die Pool-Taxonomie (K1–K6 oder Bloom-Namen) auf BloomStufe */
export function mapBloom(tax: string): BloomStufe {
  const t = tax.trim().toUpperCase()
  if (t === 'K1' || t === 'ERINNERN' || t === 'WISSEN') return 'K1'
  if (t === 'K2' || t === 'VERSTEHEN' || t === 'VERSTEHEN') return 'K2'
  if (t === 'K3' || t === 'ANWENDEN') return 'K3'
  if (t === 'K4' || t === 'ANALYSIEREN' || t === 'ANALYSE') return 'K4'
  if (t === 'K5' || t === 'BEWERTEN' || t === 'EVALUATION') return 'K5'
  if (t === 'K6' || t === 'ERSCHAFFEN' || t === 'SYNTHETISIEREN') return 'K6'
  // Fallback: K2
  return 'K2'
}

/** Konvertiert ein Pool-Bild zu einem FrageAnhang mit externeUrl */
export function konvertierePoolBild(img: { src: string; alt?: string }): FrageAnhang {
  const dateiname = img.src.split('/').pop() || 'bild.svg'
  const ext = dateiname.split('.').pop()?.toLowerCase() || 'svg'
  const mimeMap: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' }
  return {
    id: `pool-img-${genId().slice(0, 8)}`,
    dateiname,
    mimeType: mimeMap[ext] || 'image/svg+xml',
    groesseBytes: 0,
    driveFileId: '',
    beschreibung: img.alt || '',
    externeUrl: POOL_IMG_BASE_URL + img.src,
  }
}
