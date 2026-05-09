import type {
  Frage,
  HotspotFrage,
  HotspotBereich,
  BildbeschriftungFrage,
  DragDropBildFrage,
} from '../../types/fragen-storage'
import type { MediaQuelle } from '@shared/types/mediaQuelle'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'

function mimeTypeAusEndung(pfad: string): string {
  const lower = pfad.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

function poolBildQuelle(src: string): MediaQuelle {
  return { typ: 'pool', poolPfad: src, mimeType: mimeTypeAusEndung(src) }
}

export function konvertiereBild(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    // -------------------------------------------------------
    // hotspot → HotspotFrage
    // hotspots[].{x,y,r,label} + correct: number[] (Indices)
    // -------------------------------------------------------
    case 'hotspot': {
      const korrektIndices = new Set(
        Array.isArray(poolFrage.correct) ? (poolFrage.correct as number[]) : []
      )
      const bereiche: HotspotBereich[] = (poolFrage.hotspots ?? []).map((hs, idx) => {
        // Pool-Hotspots sind Kreise → 12-Punkt-Polygon-Approximation
        const r = hs.r ?? 8
        const polygonPunkte = Array.from({ length: 12 }, (_, i) => {
          const t = (2 * Math.PI * i) / 12
          return { x: hs.x + r * Math.cos(t), y: hs.y + r * Math.sin(t) }
        })
        return {
          id: genId(),
          form: 'polygon' as const,
          punkte: polygonPunkte,
          label: hs.label || `Bereich ${idx + 1}`,
          punktzahl: korrektIndices.has(idx) ? 1 : 0,
        }
      })
      if (!poolFrage.img) throw new Error('Hotspot-PoolFrage benötigt img')
      const frage: HotspotFrage = {
        ...basis,
        typ: 'hotspot',
        fragetext: poolFrage.q,
        bild: poolBildQuelle(poolFrage.img.src),
        bereiche,
        mehrfachauswahl: korrektIndices.size > 1,
      }
      return frage
    }

    // -------------------------------------------------------
    // bildbeschriftung → BildbeschriftungFrage
    // labels[].{id,text,x,y} → beschriftungen
    // -------------------------------------------------------
    case 'bildbeschriftung': {
      const beschriftungen = (poolFrage.labels ?? []).map(lbl => ({
        id: lbl.id || genId(),
        position: { x: lbl.x ?? 50, y: lbl.y ?? 50 },
        korrekt: [lbl.text ?? ''],
      }))
      if (!poolFrage.img) throw new Error('Bildbeschriftung-PoolFrage benötigt img')
      const frage: BildbeschriftungFrage = {
        ...basis,
        typ: 'bildbeschriftung',
        fragetext: poolFrage.q,
        bild: poolBildQuelle(poolFrage.img.src),
        beschriftungen,
      }
      return frage
    }

    // -------------------------------------------------------
    // dragdrop_bild → DragDropBildFrage
    // zones[].{id,x,y,w,h} + labels[].{id,text,zone}
    // -------------------------------------------------------
    case 'dragdrop_bild': {
      const poolLabels = poolFrage.labels ?? []
      const zielzonen = (poolFrage.zones ?? []).map(zone => ({
        id: zone.id || genId(),
        form: 'rechteck' as const,
        punkte: [
          { x: zone.x, y: zone.y },
          { x: zone.x + zone.w, y: zone.y },
          { x: zone.x + zone.w, y: zone.y + zone.h },
          { x: zone.x, y: zone.y + zone.h },
        ],
        // Bundle J: alle Pool-Labels mit zone-Match landen in korrekteLabels (Multi-Label-Synonyme)
        korrekteLabels: poolLabels
          .filter(l => l.zone === zone.id)
          .map(l => (l.text ?? '').trim())
          .filter(t => t.length > 0),
      }))
      const labels = poolLabels.map(l => ({
        id: l.id ?? genId(),
        text: l.text ?? '',
      }))
      if (!poolFrage.img) throw new Error('DragDrop-Bild-PoolFrage benötigt img')
      const frage: DragDropBildFrage = {
        ...basis,
        typ: 'dragdrop_bild',
        fragetext: poolFrage.q,
        bild: poolBildQuelle(poolFrage.img.src),
        zielzonen,
        labels,
      }
      return frage
    }
  }
  throw new Error(`konvertiereBild called with non-bild type: ${(poolFrage as { type: string }).type}`)
}
