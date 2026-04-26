import { useEffect } from 'react'
import { PRE_WARM_ENABLED } from '../services/preWarmApi'

const REF_KEY = 'examlabPrefetchRefcount'

function findTag(url: string): HTMLLinkElement | null {
  return document.head.querySelector<HTMLLinkElement>(
    `link[rel="prefetch"][href="${CSS.escape(url)}"]`,
  )
}

function addRef(url: string): void {
  const existing = findTag(url)
  if (existing) {
    const current = Number(existing.dataset[REF_KEY] ?? '1')
    existing.dataset[REF_KEY] = String(current + 1)
    return
  }
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  link.dataset[REF_KEY] = '1'
  document.head.appendChild(link)
}

function releaseRef(url: string): void {
  const tag = findTag(url)
  if (!tag) return
  const current = Number(tag.dataset[REF_KEY] ?? '1')
  if (current <= 1) {
    tag.remove()
  } else {
    tag.dataset[REF_KEY] = String(current - 1)
  }
}

/**
 * Bundle G.b — Browser-Prefetch via `<link rel="prefetch">`.
 *
 * Fügt für jede URL ein `<link rel="prefetch">` in `document.head` ein.
 * Refcount-basiert: zwei Komponenten mit derselben URL teilen sich ein Tag.
 * Beim Unmount oder URL-Wechsel werden die Refs sauber freigegeben.
 *
 * Falsy URLs (leerer String) werden gefiltert.
 *
 * **WICHTIG für Aufrufer:** Das `urls`-Array MUSS `useMemo`-stabilisiert sein.
 * Inline-Erzeugung (z.B. `pdfPrefetchUrls(frage.anhaenge)` direkt im JSX)
 * erzeugt pro Render eine neue Array-Identity → useEffect feuert ständig →
 * Add+Release-Loop. Siehe Task 5/6/7 im Plan: alle Aufrufer wickeln den
 * URL-Build in `useMemo` ein.
 */
export function usePrefetchAssets(urls: readonly string[]): void {
  useEffect(() => {
    if (!PRE_WARM_ENABLED) return
    const filtered = urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    for (const url of filtered) addRef(url)
    return () => {
      for (const url of filtered) releaseRef(url)
    }
  }, [urls])
}
