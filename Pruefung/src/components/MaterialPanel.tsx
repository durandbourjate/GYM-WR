import { useState } from 'react'
import type { PruefungsMaterial } from '../types/pruefung.ts'

interface MaterialPanelProps {
  materialien: PruefungsMaterial[]
  onSchliessen: () => void
}

/**
 * Seitliches Panel für Prüfungs-Materialien (Gesetze, PDFs, Links).
 * Wird als Overlay über dem Fragenbereich angezeigt, ohne die aktuelle Frage zu verlassen.
 * SEB-kompatibel: PDFs werden in einem iframe eingebettet, Links öffnen nicht in neuem Tab.
 */
export default function MaterialPanel({ materialien, onSchliessen }: MaterialPanelProps) {
  const [aktivesId, setAktivesId] = useState<string | null>(
    materialien.length === 1 ? materialien[0].id : null
  )

  const aktivesMaterial = materialien.find((m) => m.id === aktivesId)

  return (
    <div className="fixed inset-0 z-30 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onSchliessen}
      />

      {/* Panel (von rechts einschiebend) */}
      <div className="relative ml-auto w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Material
          </h2>
          <button
            onClick={onSchliessen}
            className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Schliessen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Material-Tabs (wenn mehrere) */}
        {materialien.length > 1 && (
          <div className="flex gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
            {materialien.map((mat) => (
              <button
                key={mat.id}
                onClick={() => setAktivesId(mat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer
                  ${mat.id === aktivesId
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="mr-1.5">{typIcon(mat.typ)}</span>
                {mat.titel}
              </button>
            ))}
          </div>
        )}

        {/* Inhalt */}
        <div className="flex-1 overflow-auto">
          {!aktivesMaterial ? (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm mb-4">Wähle ein Material aus:</p>
              <div className="space-y-2">
                {materialien.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => setAktivesId(mat.id)}
                    className="w-full px-4 py-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{typIcon(mat.typ)}</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{mat.titel}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                        {mat.typ === 'pdf' ? 'PDF' : mat.typ === 'text' ? 'Text' : 'Link'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MaterialInhalt material={aktivesMaterial} />
          )}
        </div>
      </div>
    </div>
  )
}

/** Zeigt den Inhalt eines einzelnen Materials */
function MaterialInhalt({ material }: { material: PruefungsMaterial }) {
  if (material.typ === 'pdf' && material.url) {
    // Google Drive Preview URL erstellen falls nötig
    const embedUrl = convertToEmbedUrl(material.url)

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {material.titel}
        </div>
        <iframe
          src={embedUrl}
          className="flex-1 w-full border-0"
          title={material.titel}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    )
  }

  if (material.typ === 'text' && material.inhalt) {
    return (
      <div className="p-4 md:p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          {material.titel}
        </h3>
        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {material.inhalt}
        </div>
      </div>
    )
  }

  if (material.typ === 'link' && material.url) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 shrink-0">
          <span>{material.titel}</span>
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 hover:underline ml-auto"
          >
            In neuem Tab öffnen ↗
          </a>
        </div>
        <iframe
          src={material.url}
          className="flex-1 w-full border-0"
          title={material.titel}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    )
  }

  return (
    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
      Kein Inhalt verfügbar.
    </div>
  )
}

/** Wandelt Google-Drive-Links in Preview-URLs um */
function convertToEmbedUrl(url: string): string {
  // Google Drive file link: https://drive.google.com/file/d/FILE_ID/view
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`
  }

  // Google Drive open link: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) {
    return `https://drive.google.com/file/d/${openMatch[1]}/preview`
  }

  // Bereits eine Preview-URL oder andere URL → direkt verwenden
  return url
}

/** Icon je nach Material-Typ */
function typIcon(typ: PruefungsMaterial['typ']): string {
  switch (typ) {
    case 'pdf': return '\u{1F4C4}'
    case 'text': return '\u{1F4DD}'
    case 'link': return '\u{1F517}'
  }
}
