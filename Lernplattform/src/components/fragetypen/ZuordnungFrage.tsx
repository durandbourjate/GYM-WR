import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import { seededShuffle } from '../../utils/shuffle'
import FeedbackBox from './FeedbackBox'

export default function ZuordnungFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf ZuordnungFrage (shared discriminated union)
  if (frage.typ !== 'zuordnung') return null
  const zuordnung = frage

  const originalPaare = zuordnung.paare || []
  const linksElemente = originalPaare.map(p => p.links)
  const [rechtsGemischt] = useState(() => seededShuffle(originalPaare.map(p => p.rechts), frage.id))
  const [paare, setPaare] = useState<Record<string, string>>({})
  const [aktivLinks, setAktivLinks] = useState<string | null>(null)

  const handleLinksKlick = (links: string) => {
    if (disabled) return
    setAktivLinks(aktivLinks === links ? null : links)
  }

  const handleRechtsKlick = (rechts: string) => {
    if (disabled || !aktivLinks) return
    setPaare(prev => ({ ...prev, [aktivLinks]: rechts }))
    setAktivLinks(null)
  }

  const alleZugeordnet = linksElemente.every(l => l in paare)

  const handleAbsenden = () => {
    if (!alleZugeordnet || disabled) return
    onAntwort({ typ: 'zuordnung', paare })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Tippe links, dann rechts um Paare zu bilden.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {linksElemente.map((links) => {
            const istAktiv = aktivLinks === links
            const zugeordnet = paare[links]
            const paar = originalPaare.find(p => p.links === links)
            const istKorrekt = feedbackSichtbar && zugeordnet === paar?.rechts
            const istFalsch = feedbackSichtbar && zugeordnet !== undefined && zugeordnet !== paar?.rechts

            return (
              <button
                key={links}
                onClick={() => handleLinksKlick(links)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border-2 min-h-[44px] text-sm transition-colors
                  ${istAktiv ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}
                  ${istKorrekt ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : ''}
                  ${istFalsch ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : ''}
                  ${!istAktiv && !istKorrekt && !istFalsch ? 'border-gray-200 dark:border-gray-600' : ''}
                  dark:text-white
                `}
              >
                {links}
                {zugeordnet && !feedbackSichtbar && (
                  <span className="block text-xs text-gray-400 mt-1">→ {zugeordnet}</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-2">
          {rechtsGemischt.map((rechts) => {
            const istVergeben = Object.values(paare).includes(rechts)
            return (
              <button
                key={rechts}
                onClick={() => handleRechtsKlick(rechts)}
                disabled={disabled || !aktivLinks}
                className={`w-full text-left p-3 rounded-lg border-2 min-h-[44px] text-sm transition-colors
                  ${istVergeben ? 'opacity-50' : ''}
                  ${aktivLinks ? 'border-gray-300 dark:border-gray-500 hover:border-blue-400' : 'border-gray-200 dark:border-gray-600'}
                  dark:text-white
                `}
              >
                {rechts}
              </button>
            )
          })}
        </div>
      </div>

      {!disabled && alleZugeordnet && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />}
    </div>
  )
}
