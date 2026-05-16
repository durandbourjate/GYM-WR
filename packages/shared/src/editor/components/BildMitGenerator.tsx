/**
 * Wrapper um BildUpload + BildGeneratorPanel.
 * Zeigt Tabs: "Hochladen" | "KI generieren"
 * Beide führen zum gleichen Ergebnis: bildUrl wird gesetzt.
 */
import { useState } from 'react'
import { Paperclip, Bot } from 'lucide-react'
import BildUpload from './BildUpload'
import BildGeneratorPanel from './BildGeneratorPanel'

type BildModus = 'upload' | 'ki'

interface Props {
  bildUrl: string
  setBildUrl: (url: string) => void
  bildDriveFileId?: string
  setBildDriveFileId?: (id: string | undefined) => void
  /** Fragetyp für kontextspezifische KI-Generierung */
  fragetyp?: 'bildbeschriftung' | 'hotspot' | 'dragdrop_bild'
}

export default function BildMitGenerator({ bildUrl, setBildUrl, bildDriveFileId, setBildDriveFileId, fragetyp }: Props) {
  const [modus, setModus] = useState<BildModus>('upload')

  // Wenn bereits ein Bild vorhanden, direkt den Upload-Tab (zeigt Vorschau)
  if (bildUrl) {
    return <BildUpload bildUrl={bildUrl} setBildUrl={setBildUrl} bildDriveFileId={bildDriveFileId} setBildDriveFileId={setBildDriveFileId} />
  }

  return (
    <div className="space-y-3">
      {/* Tab-Umschalter */}
      <div className="flex items-center gap-1 border-b dark:border-slate-700 pb-1">
        <button
          onClick={() => setModus('upload')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors inline-flex items-center gap-1.5 ${
            modus === 'upload'
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> Hochladen
        </button>
        <button
          onClick={() => setModus('ki')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors inline-flex items-center gap-1.5 ${
            modus === 'ki'
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Bot className="w-3.5 h-3.5" aria-hidden="true" /> KI generieren
        </button>
      </div>

      {/* Content */}
      {modus === 'upload' && (
        <BildUpload bildUrl={bildUrl} setBildUrl={setBildUrl} bildDriveFileId={bildDriveFileId} setBildDriveFileId={setBildDriveFileId} />
      )}
      {modus === 'ki' && (
        <BildGeneratorPanel
          onBildGeneriert={(url) => {
            setBildUrl(url)
            // Nach Generierung automatisch zum Upload-Tab (zeigt Vorschau)
          }}
          fragetyp={fragetyp}
        />
      )}
    </div>
  )
}
