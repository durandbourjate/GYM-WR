import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import FeedbackBox from './FeedbackBox'
import { resolveAssetUrl } from '../../utils/assetUrl'

export default function PdfFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Typ-Narrowing auf PDFFrage (shared discriminated union)
  if (frage.typ !== 'pdf') return null
  const pdf = frage

  const [text, setText] = useState('')
  const [selbstbewertung, setSelbstbewertung] = useState<'korrekt' | 'teilweise' | 'falsch' | null>(null)

  const handleAbsenden = () => {
    if (!text.trim() || disabled) return
    onAntwort({ typ: 'pdf', text: text.trim() })
  }

  const handleSelbstbewertung = (bewertung: 'korrekt' | 'teilweise' | 'falsch') => {
    setSelbstbewertung(bewertung)
    onAntwort({ typ: 'pdf', text: text.trim(), selbstbewertung: bewertung })
  }

  return (
    <div className="space-y-3">
      {/* PDF-Viewer — kein sandbox-Attribut (Regel #16 bilder-in-pools.md) */}
      {pdf.pdfUrl && (
        <div className="rounded-xl border-2 border-gray-200 dark:border-gray-600 overflow-hidden">
          <iframe
            src={resolveAssetUrl(pdf.pdfUrl)}
            title="PDF-Material"
            className="w-full"
            style={{ height: '500px' }}
          />
        </div>
      )}

      {/* Antwort-Bereich (Freitext) */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        autoFocus
        rows={5}
        placeholder="Deine Antwort..."
        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-y text-base min-h-[120px] focus:border-slate-500 focus:outline-none"
      />

      {!disabled && text.trim() && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px]">
          Prüfen
        </button>
      )}

      {feedbackSichtbar && (
        <div className="space-y-3">
          {frage.musterlosung && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/20 text-slate-800 dark:text-slate-200">
              <p className="font-medium text-sm mb-1">Musterantwort:</p>
              <p className="text-sm">{frage.musterlosung}</p>
            </div>
          )}

          {!selbstbewertung && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Wie hast du abgeschnitten?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelbstbewertung('korrekt')}
                  className="flex-1 py-3 rounded-xl border-2 border-green-300 text-green-700 dark:text-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium min-h-[48px]"
                >
                  Korrekt
                </button>
                <button
                  onClick={() => handleSelbstbewertung('teilweise')}
                  className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 dark:text-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 font-medium min-h-[48px]"
                >
                  Teilweise
                </button>
                <button
                  onClick={() => handleSelbstbewertung('falsch')}
                  className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-700 dark:text-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium min-h-[48px]"
                >
                  Falsch
                </button>
              </div>
            </div>
          )}

          {selbstbewertung && korrekt !== null && (
            <FeedbackBox korrekt={korrekt} erklaerung={frage.musterlosung} />
          )}
        </div>
      )}
    </div>
  )
}
