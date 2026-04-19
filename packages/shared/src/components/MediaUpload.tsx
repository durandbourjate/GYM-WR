import { useRef, useState } from 'react'
import { useEditorServices } from '../editor/EditorContext'
import type { MediaQuelle } from '../types/mediaQuelle'

interface Props {
  quelle: MediaQuelle | null
  setQuelle: (q: MediaQuelle | null) => void
  akzeptiereMimeTypes: string[]
  label: string
  maxGroesse?: number
}

function mimeVonUrl(url: string): string {
  const lower = url.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

function extrahiereDriveId(url: string): string | null {
  const lh3 = url.match(/lh3\.googleusercontent\.com\/d\/([^/?#]+)/)
  if (lh3) return lh3[1]
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)
  if (drive) return drive[1]
  return null
}

export default function MediaUpload({
  quelle,
  setQuelle,
  akzeptiereMimeTypes,
  label,
  maxGroesse = 5 * 1024 * 1024,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fehler, setFehler] = useState<string | null>(null)
  const [ladetHoch, setLadetHoch] = useState(false)
  const services = useEditorServices()

  async function handleDatei(datei: File) {
    setFehler(null)
    if (datei.size > maxGroesse) {
      setFehler(`Datei zu gross (max. ${Math.round(maxGroesse / 1024 / 1024)} MB).`)
      return
    }
    const mimeType = datei.type || 'application/octet-stream'

    if (services.istUploadVerfuegbar() && services.uploadAnhang) {
      setLadetHoch(true)
      try {
        const result = await services.uploadAnhang(label.toLowerCase() + '-upload', datei)
        if (result && 'error' in result) {
          setFehler(`Upload fehlgeschlagen: ${result.error}`)
        } else if (result?.driveFileId) {
          setQuelle({ typ: 'drive', driveFileId: result.driveFileId, mimeType, dateiname: datei.name })
        }
      } catch {
        setFehler('Upload fehlgeschlagen (Netzwerk).')
      } finally {
        setLadetHoch(false)
      }
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] ?? result
      setQuelle({ typ: 'inline', base64, mimeType, dateiname: datei.name })
    }
    reader.readAsDataURL(datei)
  }

  function handleUrlEingabe(url: string) {
    if (!url.trim()) {
      setQuelle(null)
      return
    }
    const driveId = extrahiereDriveId(url)
    if (driveId) {
      setQuelle({ typ: 'drive', driveFileId: driveId, mimeType: mimeVonUrl(url) })
      return
    }
    setQuelle({ typ: 'extern', url, mimeType: mimeVonUrl(url) })
  }

  if (quelle) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {quelle.dateiname ?? `(${quelle.typ})`}
          </p>
          <p className="text-xs text-slate-500">
            {quelle.typ} · {quelle.mimeType}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setQuelle(null)}
          className="text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          Entfernen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={(e) => {
          e.preventDefault()
          const d = e.dataTransfer.files[0]
          if (d) handleDatei(d)
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-violet-500 bg-violet-50 dark:bg-[#2d2040] rounded-lg p-4 text-center cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          accept={akzeptiereMimeTypes.join(',')}
          className="hidden"
          onChange={(e) => {
            const d = e.target.files?.[0]
            if (d) handleDatei(d)
            e.target.value = ''
          }}
        />
        {ladetHoch ? 'Wird hochgeladen…' : `${label} hierher ziehen oder klicken`}
      </div>
      <input
        type="text"
        placeholder="oder URL einfügen (https://…)"
        onBlur={(e) => handleUrlEingabe(e.target.value)}
        className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
      />
      {fehler && <p className="text-xs text-red-600">{fehler}</p>}
    </div>
  )
}
