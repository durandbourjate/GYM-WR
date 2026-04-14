/**
 * Shared Bild-Upload-Komponente für Hotspot, Bildbeschriftung, DragDrop.
 * Unterstützt: URL-Eingabe ODER Datei-Upload (Drag&Drop / Klick).
 * Upload geht über EditorServices.uploadAnhang (Dependency Injection).
 */
import { useRef, useState, useCallback } from 'react'
import { useEditorServices } from '../EditorContext'
import { resolvePoolBildUrl } from '../utils/poolBildUrl'

const MAX_GROESSE = 5 * 1024 * 1024 // 5 MB
const ERLAUBTE_TYPEN = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

interface Props {
  bildUrl: string
  setBildUrl: (url: string) => void
  /** Optionale Drive-File-ID (wird beim Upload gesetzt) */
  bildDriveFileId?: string
  setBildDriveFileId?: (id: string | undefined) => void
}

export default function BildUpload({ bildUrl: rawBildUrl, setBildUrl, bildDriveFileId, setBildDriveFileId }: Props) {
  // Relative Pool-Pfade (img/...) zu absoluten URLs auflösen
  const bildUrl = resolvePoolBildUrl(rawBildUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [ladetHoch, setLadetHoch] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const services = useEditorServices()
  const backendVerfuegbar = services.istUploadVerfuegbar()

  const handleUpload = useCallback(async (datei: File) => {
    setFehler(null)

    // Validierung
    if (!ERLAUBTE_TYPEN.includes(datei.type)) {
      setFehler('Nur Bilder erlaubt (PNG, JPG, GIF, WebP, SVG).')
      return
    }
    if (datei.size > MAX_GROESSE) {
      setFehler(`Datei zu gross (max. ${Math.round(MAX_GROESSE / 1024 / 1024)} MB).`)
      return
    }

    if (!backendVerfuegbar || !services.uploadAnhang) {
      // Demo-Modus: Bild als Data-URL laden (kein Drive-Upload)
      const reader = new FileReader()
      reader.onload = () => {
        setBildUrl(reader.result as string)
        setBildDriveFileId?.(undefined)
      }
      reader.readAsDataURL(datei)
      return
    }

    // Upload zu Google Drive
    setLadetHoch(true)
    try {
      const result = await services.uploadAnhang('bild-upload', datei)
      if (result && 'error' in result) {
        // Backend hat einen Fehler zurückgegeben
        console.error('[BildUpload] Backend-Fehler:', result.error)
        setFehler(`Upload fehlgeschlagen: ${result.error}`)
      } else if (result?.driveFileId) {
        // Drive-Preview-URL generieren
        const previewUrl = `https://lh3.googleusercontent.com/d/${result.driveFileId}`
        setBildUrl(previewUrl)
        setBildDriveFileId?.(result.driveFileId)
      } else {
        console.error('[BildUpload] Upload fehlgeschlagen, result:', result)
        setFehler('Upload fehlgeschlagen. Bitte erneut versuchen oder Bild-URL eingeben.')
      }
    } catch (err) {
      console.error('[BildUpload] Netzwerkfehler:', err)
      setFehler('Upload fehlgeschlagen (Netzwerkfehler). Bitte erneut versuchen.')
    } finally {
      setLadetHoch(false)
    }
  }, [backendVerfuegbar, setBildUrl, setBildDriveFileId, services])

  const handleDateiWaehlen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const datei = e.target.files?.[0]
    if (datei) handleUpload(datei)
    if (inputRef.current) inputRef.current.value = ''
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const datei = e.dataTransfer.files[0]
    if (datei) handleUpload(datei)
  }, [handleUpload])

  const handleEntfernen = useCallback(() => {
    setBildUrl('')
    setBildDriveFileId?.(undefined)
    setFehler(null)
  }, [setBildUrl, setBildDriveFileId])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
        Bild {bildDriveFileId && <span className="text-xs text-green-600 dark:text-green-400">(hochgeladen ✓)</span>}
      </label>

      {/* Upload-Zone (wenn kein Bild) */}
      {!bildUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
            ${dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-violet-500 bg-violet-50 dark:bg-[#2d2040] hover:border-violet-600 dark:hover:border-violet-400'
            }
            ${ladetHoch ? 'opacity-60 pointer-events-none' : ''}
          `}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleDateiWaehlen}
          />
          {ladetHoch ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400">Wird hochgeladen...</span>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                📷 Bild hierher ziehen oder klicken zum Auswählen
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                PNG, JPG, GIF, WebP, SVG · max. 5 MB
              </p>
            </>
          )}
        </div>
      )}

      {/* URL-Eingabe als Alternative + Bild-Aktionen */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 dark:text-slate-500">oder</span>
        <input
          type="text"
          value={bildUrl.startsWith('data:') ? '' : bildUrl}
          onChange={(e) => {
            setBildUrl(e.target.value)
            setBildDriveFileId?.(undefined)
          }}
          className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
          placeholder="Bild-URL einfügen (https://...)"
        />
        {bildUrl && bildUrl.startsWith('data:') && (
          <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">(Bild geladen)</span>
        )}
        {bildUrl && (
          <button
            type="button"
            onClick={handleEntfernen}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 whitespace-nowrap cursor-pointer"
          >
            Bild entfernen
          </button>
        )}
      </div>

      {/* Fehler */}
      {fehler && (
        <p className="text-xs text-red-600 dark:text-red-400">{fehler}</p>
      )}
    </div>
  )
}
