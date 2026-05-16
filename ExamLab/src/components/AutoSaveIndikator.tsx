import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import { usePruefungStore } from '../store/pruefungStore.ts'

export default function AutoSaveIndikator() {
  const autoSaveCount = usePruefungStore((s) => s.autoSaveCount)
  const [sichtbar, setSichtbar] = useState(false)
  const prevCount = useRef(autoSaveCount)

  useEffect(() => {
    if (autoSaveCount > prevCount.current) {
      setSichtbar(true)
      const timer = setTimeout(() => setSichtbar(false), 2000)
      prevCount.current = autoSaveCount
      return () => clearTimeout(timer)
    }
  }, [autoSaveCount])

  return (
    <span
      className={`text-xs font-medium text-green-600 dark:text-green-400 transition-opacity duration-300 inline-flex items-center gap-1 ${
        sichtbar ? 'opacity-100' : 'opacity-0'
      }`}
    >
      Gespeichert <Check className="w-3 h-3" aria-hidden="true" />
    </span>
  )
}
