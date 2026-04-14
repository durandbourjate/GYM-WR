import { useState, useRef, useCallback } from 'react'
import DOMPurify from 'dompurify'
import type { PruefungsMaterial } from '../types/pruefung.ts'
import AudioPlayer from './AudioPlayer.tsx'
import Tooltip from './ui/Tooltip.tsx'

export type MaterialModus = 'split' | 'overlay'

interface MaterialPanelProps {
  materialien: PruefungsMaterial[]
  modus: MaterialModus
  onSchliessen: () => void
  onModusWechsel: (modus: MaterialModus) => void
}

/**
 * Panel für Prüfungs-Materialien (Gesetze, PDFs, Links).
 * Zwei Modi:
 * - split: Seitliches Panel neben dem Fragenbereich (nur Desktop)
 * - overlay: Vollbild-Overlay über dem Fragenbereich (Mobile + Desktop)
 * SEB-kompatibel: PDFs werden in einem iframe eingebettet, Links öffnen nicht in neuem Tab.
 */
export default function MaterialPanel({ materialien, modus, onSchliessen, onModusWechsel }: MaterialPanelProps) {
  const [aktivesId, setAktivesId] = useState<string | null>(
    materialien.length === 1 ? materialien[0].id : null
  )
  // Resize-State für Split-Modus (Breite in px, null = Standard 55%)
  const [splitBreite, setSplitBreite] = useState<number | null>(null)
  const resizingRef = useRef(false)
  const startXRef = useRef(0)
  const startBreiteRef = useRef(0)

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    resizingRef.current = true
    startXRef.current = e.clientX
    const panel = (e.target as HTMLElement).closest('[data-material-panel]')
    startBreiteRef.current = panel?.getBoundingClientRect().width ?? 500

    const handleMove = (ev: PointerEvent) => {
      if (!resizingRef.current) return
      // Panel wächst nach links → kleinerer clientX = grössere Breite
      const diff = startXRef.current - ev.clientX
      const neueBreite = Math.max(300, Math.min(window.innerWidth * 0.8, startBreiteRef.current + diff))
      setSplitBreite(neueBreite)
    }
    const handleUp = () => {
      resizingRef.current = false
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const aktivesMaterial = materialien.find((m) => m.id === aktivesId)

  // Split-Modus: Seitliches Panel ohne Backdrop
  if (modus === 'split') {
    return (
      <div
        data-material-panel
        className="h-full min-h-0 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative"
        style={{ width: splitBreite ? `${splitBreite}px` : '55%', minWidth: 300 }}
      >
        {/* Resize-Handle am linken Rand */}
        <div
          onPointerDown={handleResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/30 active:bg-indigo-500/50 z-10 transition-colors"
          title="Breite anpassen"
        />
        {/* Header — kompakt im Split-Modus */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Material
          </h2>
          <div className="flex items-center gap-1">
            {/* Schliessen-Button */}
            <button
              onClick={onSchliessen}
              className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Tooltip text="Schliessen">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Tooltip>
            </button>
          </div>
        </div>

        {/* Material-Tabs (wenn mehrere) */}
        {materialien.length > 1 && (
          <div className="flex gap-1 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0">
            {materialien.map((mat) => (
              <button
                key={mat.id}
                onClick={() => setAktivesId(mat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer
                  ${mat.id === aktivesId
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span className="mr-1">{typIcon(mat.typ)}</span>
                {mat.titel}
              </button>
            ))}
          </div>
        )}

        {/* Inhalt — flex flex-col durchgehend damit Höhe via flex-1 fliesst (nicht h-full/percentage) */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!aktivesMaterial ? (
            <div className="overflow-auto flex-1 min-h-0">
              <MaterialAuswahl materialien={materialien} onWaehlen={setAktivesId} />
            </div>
          ) : (
            <MaterialInhalt material={aktivesMaterial} />
          )}
        </div>
      </div>
    )
  }

  // Overlay-Modus: Vollbild mit Backdrop (bisheriges Verhalten)
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
          <div className="flex items-center gap-1">
            {/* Split-Button (nur auf Desktop sichtbar) */}
            <button
              onClick={() => onModusWechsel('split')}
              className="hidden md:flex w-8 h-8 items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Tooltip text="Split-Ansicht">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m0 0H5a2 2 0 01-2-2V5a2 2 0 012-2h4m0 18h10a2 2 0 002-2V5a2 2 0 00-2-2H9" />
                </svg>
              </Tooltip>
            </button>
            {/* Schliessen-Button */}
            <button
              onClick={onSchliessen}
              className="w-8 h-8 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Tooltip text="Schliessen">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Tooltip>
            </button>
          </div>
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

        {/* Inhalt — flex flex-col durchgehend */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!aktivesMaterial ? (
            <MaterialAuswahl materialien={materialien} onWaehlen={setAktivesId} />
          ) : (
            <MaterialInhalt material={aktivesMaterial} />
          )}
        </div>
      </div>
    </div>
  )
}

/** Auswahl-Ansicht wenn kein Material aktiv ist */
function MaterialAuswahl({ materialien, onWaehlen }: { materialien: PruefungsMaterial[], onWaehlen: (id: string) => void }) {
  return (
    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
      <p className="text-sm mb-4">Wähle ein Material aus:</p>
      <div className="space-y-2">
        {materialien.map((mat) => (
          <button
            key={mat.id}
            onClick={() => onWaehlen(mat.id)}
            className="w-full px-4 py-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{typIcon(mat.typ)}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{mat.titel}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                {mat.typ === 'pdf' ? 'PDF' : mat.typ === 'text' ? 'Text' : mat.typ === 'richtext' ? 'Rich-Text' : mat.typ === 'dateiUpload' ? 'Datei' : mat.typ === 'videoEmbed' ? 'Video' : 'Link'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Zeigt den Inhalt eines einzelnen Materials */
function MaterialInhalt({ material }: { material: PruefungsMaterial }) {
  // Audio-Dateien
  if (material.typ === 'dateiUpload' && material.mimeType?.startsWith('audio/') && material.url) {
    return (
      <div className="p-6 flex flex-col items-center gap-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {material.titel}
        </h3>
        <AudioPlayer src={material.url} />
      </div>
    )
  }

  // Video-Dateien (Upload)
  if (material.typ === 'dateiUpload' && material.mimeType?.startsWith('video/') && material.url) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {material.titel}
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <video
            src={material.url}
            controls
            className="max-w-full max-h-full rounded"
          >
            Video nicht unterstützt.
          </video>
        </div>
      </div>
    )
  }

  // Video-Embed (YouTube, Vimeo, nanoo.tv)
  if (material.typ === 'videoEmbed' && material.embedUrl) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {material.titel}
        </div>
        <iframe
          src={material.embedUrl}
          className="flex-1 min-h-0 w-full border-0"
          title={material.titel}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // PDF / Datei-Upload (Bilder, PDFs)
  const materialUrl = material.url || (material.driveFileId ? `https://drive.google.com/file/d/${material.driveFileId}/view` : '')
  if ((material.typ === 'pdf' || material.typ === 'dateiUpload') && materialUrl) {
    let embedUrl = convertToEmbedUrl(materialUrl)
    // Lokale PDFs: Toolbar ausblenden (kein Download/Print für SuS)
    // Google Drive Preview hat eigene Toolbar-Steuerung
    if (!embedUrl.includes('drive.google.com')) {
      embedUrl += (embedUrl.includes('#') ? '&' : '#') + 'toolbar=0&navpanes=0'
    }

    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 shrink-0 flex items-center justify-between">
          <span>{material.titel}</span>
          <a
            href={materialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
          >
            In neuem Tab öffnen ↗
          </a>
        </div>
        <iframe
          src={embedUrl}
          className="flex-1 min-h-0 w-full border-0"
          title={material.titel}
        />
      </div>
    )
  }

  if (material.typ === 'richtext' && material.inhalt) {
    return (
      <div className="overflow-y-auto flex-1 min-h-0">
        <div
          className="prose prose-sm dark:prose-invert max-w-none p-4 md:p-6"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(material.inhalt) }}
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
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 text-xs text-slate-500 dark:text-slate-400 shrink-0">
          {material.titel}
        </div>
        <iframe
          src={material.url}
          className="flex-1 min-h-0 w-full border-0"
          title={material.titel}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    )
  }

  // Debug: Warum konnte kein Inhalt angezeigt werden?
  console.warn('[MaterialPanel] Kein Inhalt für Material:', {
    id: material.id,
    titel: material.titel,
    typ: material.typ,
    url: material.url,
    driveFileId: material.driveFileId,
    inhalt: material.inhalt ? '(vorhanden)' : undefined,
    embedUrl: material.embedUrl,
    mimeType: material.mimeType,
  })

  return (
    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
      <p>Kein Inhalt verfügbar.</p>
      <p className="text-xs mt-2 text-slate-400 dark:text-slate-500">
        Typ: {material.typ} · {material.url ? 'URL vorhanden' : material.driveFileId ? 'Drive-ID vorhanden' : 'Keine Quelle'}
      </p>
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
    case 'richtext': return '\u{1F5B9}'
    case 'link': return '\u{1F517}'
    case 'dateiUpload': return '\u{1F4CE}'
    case 'videoEmbed': return '\u{1F3AC}'
  }
}
