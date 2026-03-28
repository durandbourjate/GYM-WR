/**
 * Shared Bild-Upload-Komponente für Hotspot, Bildbeschriftung, DragDrop.
 * Unterstützt: URL-Eingabe ODER Datei-Upload (Drag&Drop / Klick).
 * Upload geht über bestehende uploadAnhang-Infrastruktur → Google Drive.
 */
import { useRef, useState, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { uploadAnhang } from '../../../services/uploadApi.ts'
import { apiService } from '../../../services/apiService.ts'

const MAX_GROESSE = 5 * 1024 * 1024 // 5 MB
const ERLAUBTE_TYPEN = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']

interface Props {
  bildUrl: string
  setBildUrl: (url: string) => void
  /** Optionale Drive-File-ID (wird beim Upload gesetzt) */
  bildDriveFileId?: string
  setBildDriveFileId?: (id: string | undefined) => void
}

export default function BildUpload({ bildUrl, setBildUrl, bildDriveFileId, setBildDriveFileId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [ladetHoch, setLadetHoch] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)
  const backendVerfuegbar = apiService.istKonfiguriert() && !istDemoModus

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

    if (!backendVerfuegbar) {
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
      const result = await uploadAnhang(user?.email ?? '', 'bild-upload', datei)
      if (result?.driveFileId) {
        // Drive-Preview-URL generieren
        const previewUrl = `https://drive.google.com/uc?id=${result.driveFileId}&export=view`
        setBildUrl(previewUrl)
        setBildDriveFileId?.(result.driveFileId)
      } else {
        setFehler('Upload fehlgeschlagen. Bitte erneut versuchen.')
      }
    } catch {
      setFehler('Upload fehlgeschlagen (Netzwerkfehler).')
    } finally {
      setLadetHoch(false)
    }
  }, [backendVerfuegbar, user?.email, setBildUrl, setBildDriveFileId])

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

      {/* Vorschau wenn Bild vorhanden */}
      {bildUrl && (
        <div className="relative inline-block">
          <img
            src={bildUrl}
            alt="Vorschau"
            className="max-h-48 rounded-lg border border-slate-200 dark:border-slate-700"
            style={{ objectFit: 'contain' }}
          />
          <button
            type="button"
            onClick={handleEntfernen}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 cursor-pointer shadow"
            title="Bild entfernen"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload-Zone (wenn kein Bild) */}
      {!bildUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
            ${dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
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

      {/* URL-Eingabe als Alternative */}
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
      </div>

      {/* Fehler */}
      {fehler && (
        <p className="text-xs text-red-600 dark:text-red-400">{fehler}</p>
      )}
    </div>
  )
}
