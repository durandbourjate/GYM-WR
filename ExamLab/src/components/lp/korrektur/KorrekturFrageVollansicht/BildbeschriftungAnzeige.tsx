import { Check, X } from 'lucide-react'
import type { BildbeschriftungFrage } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import { toAssetUrl } from '../../../../utils/assetUrl'
import { ermittleBildQuelle } from '@shared/utils/mediaQuelleResolver'
import { mediaQuelleZuImgSrc } from '@shared/utils/mediaQuelleUrl'

/** Bildbeschriftung-Antwort mit Bild + Labels an Positionen */
export default function BildbeschriftungAnzeige({ frage, antwort }: { frage: BildbeschriftungFrage; antwort: Extract<Antwort, { typ: 'bildbeschriftung' }> | undefined }) {
  const bildQuelle = ermittleBildQuelle(frage)
  const bildSrc = bildQuelle ? mediaQuelleZuImgSrc(bildQuelle, toAssetUrl) : null
  return (
    <div className="mt-2">
      {bildSrc && (
        <div className="relative inline-block">
          <img src={bildSrc} alt="Bildbeschriftung" className="max-w-full rounded" />
          {/* Labels an ihren Positionen */}
          {frage.beschriftungen.map((label, i) => {
            const eingabe = antwort?.eintraege?.[label.id] ?? ''
            const korrekt = label.korrekt.some(k => k.toLowerCase() === eingabe.toLowerCase())
            return (
              <div key={label.id} className="absolute" style={{ left: `${label.position.x}%`, top: `${label.position.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${
                  !eingabe ? 'bg-slate-200/80 dark:bg-slate-600/80 border-slate-300 dark:border-slate-500'
                  : korrekt ? 'bg-green-100/90 dark:bg-green-900/60 border-green-400 dark:border-green-700'
                  : 'bg-red-100/90 dark:bg-red-900/60 border-red-400 dark:border-red-700'
                }`}>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{i + 1}</span>
                  <span className="text-slate-700 dark:text-slate-200">{eingabe || '—'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Textliste als Fallback / Zusatzinfo */}
      <div className="rounded bg-slate-50 dark:bg-slate-700/50 px-3 py-2 mt-2 space-y-0.5">
        {frage.beschriftungen.map((label, i) => {
          const eingabe = antwort?.eintraege?.[label.id] ?? ''
          const korrekt = label.korrekt.some(k => k.toLowerCase() === eingabe.toLowerCase())
          return (
            <div key={label.id} className="text-sm flex items-center gap-2">
              <span className="shrink-0 inline-flex items-center">{eingabe ? (korrekt ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <X className="w-3.5 h-3.5" aria-hidden="true" />) : '—'}</span>
              <span className="text-slate-500 dark:text-slate-400">{label.label || `Label ${i + 1}`}:</span>
              <span className="text-slate-700 dark:text-slate-200">{eingabe || 'Keine Eingabe'}</span>
              {!korrekt && eingabe && <span className="text-xs text-slate-400">Erwartet: {label.korrekt.join(' / ')}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
