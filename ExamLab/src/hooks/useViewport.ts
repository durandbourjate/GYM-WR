import { useEffect, useState } from 'react'

export type ViewportTier = 'desktop' | 'schmal' | 'phone'

function leseTier(): ViewportTier {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia('(min-width: 900px)').matches) return 'desktop'
  if (window.matchMedia('(min-width: 600px)').matches) return 'schmal'
  return 'phone'
}

export function useViewport(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>(() => leseTier())

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    function pruefe() {
      if (timeout) return
      timeout = setTimeout(() => {
        setTier(leseTier())
        timeout = null
      }, 150)
    }
    const mq900 = window.matchMedia('(min-width: 900px)')
    const mq600 = window.matchMedia('(min-width: 600px)')
    mq900.addEventListener('change', pruefe)
    mq600.addEventListener('change', pruefe)
    return () => {
      if (timeout) clearTimeout(timeout)
      mq900.removeEventListener('change', pruefe)
      mq600.removeEventListener('change', pruefe)
    }
  }, [])

  return tier
}
