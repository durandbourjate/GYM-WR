import { describe, expect, it } from 'vitest'
import { konvertierePoolFrage } from './poolConverter'

describe('Pool-Konverter — DragDrop-Bild Multi-Label (Bundle J)', () => {
  it('alle Pool-Labels mit zone-Match landen in zone.korrekteLabels', () => {
    const poolFrage = {
      type: 'dragdrop_bild',
      tax: 'K2',
      diff: 1,
      points: 1,
      time_min: 1,
      q: 'Test',
      img: { src: 'test.svg' },
      zones: [{ id: 'z1', x: 0, y: 0, w: 50, h: 50 }],
      labels: [
        { id: 'l1', text: '4P', zone: 'z1' },
        { id: 'l2', text: 'Marketing-Mix', zone: 'z1' },
        { id: 'l3', text: 'Distraktor' },
      ],
    }
    const poolMeta = { id: 'pm', fach: 'BWL', title: 'Test', version: 1 } as any
    const topics = { default: { id: 'default', label: 'Test', topic: 'default' } } as any
    const out = konvertierePoolFrage({ ...poolFrage, topic: 'default' } as any, poolMeta, topics)
    expect(out.typ).toBe('dragdrop_bild')
    expect((out as any).zielzonen[0].korrekteLabels).toEqual(['4P', 'Marketing-Mix'])
    expect((out as any).labels).toHaveLength(3)
    expect((out as any).labels[0].id).toBe('l1')
    expect((out as any).labels[2].text).toBe('Distraktor')
  })
})
