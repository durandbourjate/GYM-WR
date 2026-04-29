import { describe, expect, it } from 'vitest'
import { konvertierePoolFrage } from './poolConverter'
import type { PoolFrageDragDropBild, PoolMeta, PoolTopic } from '../types/pool'

describe('Pool-Konverter — DragDrop-Bild Multi-Label (Bundle J)', () => {
  it('alle Pool-Labels mit zone-Match landen in zone.korrekteLabels', () => {
    const poolFrage: PoolFrageDragDropBild = {
      id: 'q1',
      topic: 'default',
      type: 'dragdrop_bild',
      tax: 'K2',
      diff: 1,
      q: 'Test',
      img: { src: 'test.svg' },
      zones: [{ id: 'z1', x: 0, y: 0, w: 50, h: 50 }],
      labels: [
        { id: 'l1', text: '4P', zone: 'z1' },
        { id: 'l2', text: 'Marketing-Mix', zone: 'z1' },
        { id: 'l3', text: 'Distraktor' },
      ],
    }
    const poolMeta: PoolMeta = { id: 'pm', fach: 'BWL', title: 'Test', lernziele: [] }
    const topics: Record<string, PoolTopic> = {
      default: { label: 'Test', short: 'T', lernziele: [] },
    }
    const out = konvertierePoolFrage(poolFrage, poolMeta, topics)
    expect(out.typ).toBe('dragdrop_bild')
    if (out.typ !== 'dragdrop_bild') throw new Error('expected dragdrop_bild')
    expect(out.zielzonen[0].korrekteLabels).toEqual(['4P', 'Marketing-Mix'])
    expect(out.labels).toHaveLength(3)
    expect(out.labels[0].id).toBe('l1')
    expect(out.labels[2].text).toBe('Distraktor')
  })
})
