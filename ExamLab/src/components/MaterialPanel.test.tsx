import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import MaterialPanel from './MaterialPanel'
import type { PruefungsMaterial } from '../types/pruefung'

describe('MaterialPanel — iframe Sandbox-Strategie', () => {
  test('iframe für externe Link-Materialien hat sandbox="allow-scripts" (kein same-origin)', () => {
    const material: PruefungsMaterial = {
      id: 'm1',
      titel: 'Test-Link',
      typ: 'link',
      url: 'https://example.com',
    }
    const { container } = render(
      <MaterialPanel
        materialien={[material]}
        modus="overlay"
        onSchliessen={vi.fn()}
        onModusWechsel={vi.fn()}
      />
    )
    const iframe = container.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts')
  })
})
