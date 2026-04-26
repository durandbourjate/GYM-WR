import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'

vi.mock('../services/preWarmApi', () => ({
  PRE_WARM_ENABLED: false,
}))

// Hook nach dem Mock importieren (Reihenfolge wichtig)
import { usePrefetchAssets } from '../hooks/usePrefetchAssets'

function HookHost({ urls }: { urls: readonly string[] }) {
  usePrefetchAssets(urls)
  return null
}

describe('usePrefetchAssets — Kill-Switch (PRE_WARM_ENABLED=false)', () => {
  afterEach(() => {
    cleanup()
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((el) => el.remove())
  })

  it('fügt keine prefetch-Tags ein wenn PRE_WARM_ENABLED=false', () => {
    render(<HookHost urls={['https://example.com/a.pdf']} />)
    expect(document.head.querySelectorAll('link[rel="prefetch"]').length).toBe(0)
  })
})
