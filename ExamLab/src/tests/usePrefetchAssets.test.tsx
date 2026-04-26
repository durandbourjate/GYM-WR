import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { usePrefetchAssets } from '../hooks/usePrefetchAssets'

function HookHost({ urls }: { urls: readonly string[] }) {
  usePrefetchAssets(urls)
  return null
}

function prefetchTags(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll('link[rel="prefetch"]'))
}

describe('usePrefetchAssets', () => {
  afterEach(() => {
    cleanup()
    document.head.querySelectorAll('link[rel="prefetch"]').forEach((el) => el.remove())
  })

  it('fügt für jede URL ein link[rel=prefetch] in document.head', () => {
    render(<HookHost urls={['https://example.com/a.pdf', 'https://example.com/b.pdf']} />)
    const tags = prefetchTags()
    expect(tags.map((t) => t.href)).toEqual([
      'https://example.com/a.pdf',
      'https://example.com/b.pdf',
    ])
    // Kein as-Attribut (Spec: PDFs sind keine documents)
    expect(tags[0].hasAttribute('as')).toBe(false)
  })

  it('Cleanup beim Unmount entfernt die Tags', () => {
    const { unmount } = render(<HookHost urls={['https://example.com/a.pdf']} />)
    expect(prefetchTags()).toHaveLength(1)
    unmount()
    expect(prefetchTags()).toHaveLength(0)
  })

  it('URL-Wechsel entfernt alte Tags und fügt neue ein', () => {
    const { rerender } = render(<HookHost urls={['https://example.com/a.pdf']} />)
    expect(prefetchTags().map((t) => t.href)).toEqual(['https://example.com/a.pdf'])
    rerender(<HookHost urls={['https://example.com/b.pdf']} />)
    expect(prefetchTags().map((t) => t.href)).toEqual(['https://example.com/b.pdf'])
  })

  it('zwei Komponenten mit derselben URL: Tag bleibt nach dem ersten Unmount', () => {
    const { unmount: u1 } = render(<HookHost urls={['https://example.com/a.pdf']} />)
    const { unmount: u2 } = render(<HookHost urls={['https://example.com/a.pdf']} />)
    expect(prefetchTags()).toHaveLength(1) // Refcount-Dedup
    u1()
    expect(prefetchTags()).toHaveLength(1) // u2 hält den Refcount
    u2()
    expect(prefetchTags()).toHaveLength(0)
  })

  it('leeres Array fügt nichts ein und crashed nicht', () => {
    render(<HookHost urls={[]} />)
    expect(prefetchTags()).toHaveLength(0)
  })

  it('falsy URLs (leerer String) werden gefiltert', () => {
    render(<HookHost urls={['', 'https://example.com/a.pdf']} />)
    const tags = prefetchTags()
    expect(tags.map((t) => t.href)).toEqual(['https://example.com/a.pdf'])
  })
})
