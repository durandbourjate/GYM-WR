import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

interface Props {
  email: string
  zuschlagMin: number
  basisEndeMs: number
  jetzt: number
  istAktiv: boolean
  onAendern: (email: string, minuten: number) => void
}

/**
 * Inline-Editor + Anzeige für Zeitzuschlag (Nachteilsausgleich).
 * 4 Render-Branches: kein-Zuschlag → +5 Button / Editor / Overtime-Countdown / Zuschlag-Anzeige.
 */
export function ZeitzuschlagInline({ email, zuschlagMin, basisEndeMs, jetzt, istAktiv, onAendern }: Props) {
  const [zeigEditor, setZeigEditor] = useState(false)
  const [editWert, setEditWert] = useState(zuschlagMin)

  useEffect(() => {
    setEditWert(zuschlagMin)
  }, [zuschlagMin])

  if (zuschlagMin === 0) {
    return (
      <button
        type="button"
        onClick={() => onAendern(email, 5)}
        className="text-xs px-1.5 py-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded cursor-pointer transition-colors"
      >
        +5
      </button>
    )
  }

  const persoenlichesEndeMs = basisEndeMs + zuschlagMin * 60 * 1000
  const istInOvertime = istAktiv && jetzt >= basisEndeMs && jetzt < persoenlichesEndeMs
  const restSekunden = istInOvertime ? Math.ceil((persoenlichesEndeMs - jetzt) / 1000) : 0

  if (zeigEditor) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={editWert}
          onChange={(e) => setEditWert(parseInt(e.target.value) || 0)}
          min={0}
          max={120}
          className="w-12 px-1 py-0.5 text-xs text-center border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onAendern(email, editWert)
              setZeigEditor(false)
            } else if (e.key === 'Escape') {
              setEditWert(zuschlagMin)
              setZeigEditor(false)
            }
          }}
          onBlur={() => {
            onAendern(email, editWert)
            setZeigEditor(false)
          }}
        />
        <span className="text-xs text-slate-400">′</span>
      </div>
    )
  }

  if (istInOvertime) {
    const min = Math.floor(restSekunden / 60)
    const sek = restSekunden % 60
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs font-mono text-amber-600 dark:text-amber-400 inline-flex items-center gap-1" title={`+${zuschlagMin} Min. Zuschlag — Restzeit`}>
          <Timer className="w-3 h-3" aria-hidden="true" /> {min}:{sek.toString().padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={() => onAendern(email, zuschlagMin + 5)}
          className="text-[10px] px-1 py-0.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded cursor-pointer transition-colors"
        >
          +5
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setZeigEditor(true)}
        className="text-xs px-2 py-0.5 bg-blue-600 dark:bg-blue-700 text-white rounded font-bold cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors inline-flex items-center gap-1"
        title={`+${zuschlagMin} Min. Zeitzuschlag — klicken zum Bearbeiten`}
      >
        <Timer className="w-3 h-3" aria-hidden="true" /> +{zuschlagMin}′
      </button>
      <button
        type="button"
        onClick={() => onAendern(email, zuschlagMin + 5)}
        className="text-[10px] px-1 py-0.5 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 rounded cursor-pointer transition-colors"
      >
        +5
      </button>
    </div>
  )
}
