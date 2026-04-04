/**
 * LP-Editor für den Zeichnen-Fragetyp (visualisierung/zeichnen).
 * Konfiguriert Canvas-Grösse, Hintergrundbild, Werkzeuge, Farben,
 * Koordinatensystem und optionale Musterlösung.
 */
import { useRef, useState } from 'react'
import type { CanvasConfig } from '../../types/fragen'
import { useEditorConfig, useEditorServices } from '../EditorContext'
import { Abschnitt, Feld } from '../components/EditorBausteine'

type GroessePreset = 'klein' | 'mittel' | 'gross' | 'auto' | 'benutzerdefiniert'

interface ZeichnenEditorProps {
  canvasConfig: CanvasConfig
  onCanvasConfigChange: (config: CanvasConfig) => void
  musterloesungBild?: string
  onMusterloesungBildChange: (bild: string | undefined) => void
}

const PRESET_ABMESSUNGEN: Record<Exclude<GroessePreset, 'auto' | 'benutzerdefiniert'>, { breite: number; hoehe: number }> = {
  klein: { breite: 600, hoehe: 400 },
  mittel: { breite: 800, hoehe: 600 },
  gross: { breite: 1200, hoehe: 800 },
}

const ALLE_WERKZEUGE: { key: CanvasConfig['werkzeuge'][number]; label: string }[] = [
  { key: 'stift', label: 'Stift' },
  { key: 'linie', label: 'Linie' },
  { key: 'pfeil', label: 'Pfeil' },
  { key: 'rechteck', label: 'Rechteck' },
  { key: 'ellipse', label: 'Ellipse' },
  { key: 'text', label: 'Text' },
]

const ALLE_FARBEN: { key: string; label: string; klasse: string }[] = [
  { key: '#000000', label: 'Schwarz', klasse: 'bg-black' },
  { key: '#ef4444', label: 'Rot', klasse: 'bg-red-500' },
  { key: '#3b82f6', label: 'Blau', klasse: 'bg-blue-500' },
  { key: '#22c55e', label: 'Grün', klasse: 'bg-green-500' },
]

export default function ZeichnenEditor({
  canvasConfig,
  onCanvasConfigChange,
  musterloesungBild,
  onMusterloesungBildChange,
}: ZeichnenEditorProps) {
  const hintergrundbild_Input = useRef<HTMLInputElement>(null)
  const musterloesungInput = useRef<HTMLInputElement>(null)

  const [uploadLaeuft, setUploadLaeuft] = useState(false)
  const [uploadFehler, setUploadFehler] = useState<string | null>(null)
  const [musterUploadLaeuft, setMusterUploadLaeuft] = useState(false)

  const { benutzer } = useEditorConfig()
  const services = useEditorServices()

  // Bestimme aktiven Preset aus canvasConfig
  const aktiverPreset: GroessePreset = (() => {
    const p = canvasConfig.groessePreset
    if (p === 'auto') return 'auto'
    if (p === 'klein' || p === 'mittel' || p === 'gross') return p
    if (!p) {
      // Prüfe ob Abmessungen einem Preset entsprechen
      for (const [name, dim] of Object.entries(PRESET_ABMESSUNGEN)) {
        if (canvasConfig.breite === dim.breite && canvasConfig.hoehe === dim.hoehe) {
          return name as GroessePreset
        }
      }
    }
    return 'benutzerdefiniert'
  })()

  function handlePresetWechsel(preset: GroessePreset): void {
    if (preset === 'benutzerdefiniert') {
      onCanvasConfigChange({ ...canvasConfig, groessePreset: undefined })
    } else if (preset === 'auto') {
      onCanvasConfigChange({ ...canvasConfig, groessePreset: 'auto' })
    } else {
      const dim = PRESET_ABMESSUNGEN[preset]
      onCanvasConfigChange({ ...canvasConfig, groessePreset: preset, breite: dim.breite, hoehe: dim.hoehe })
    }
  }

  function handleBreiteAendern(wert: number): void {
    onCanvasConfigChange({ ...canvasConfig, groessePreset: undefined, breite: Math.max(100, wert) })
  }

  function handleHoeheAendern(wert: number): void {
    onCanvasConfigChange({ ...canvasConfig, groessePreset: undefined, hoehe: Math.max(100, wert) })
  }

  async function handleHintergrundUpload(datei: File): Promise<void> {
    setUploadLaeuft(true)
    setUploadFehler(null)
    try {
      if (!services.istUploadVerfuegbar() || !services.uploadAnhang) {
        setUploadFehler('Upload nicht verfügbar.')
        return
      }
      const ergebnis = await services.uploadAnhang('zeichnen-hintergrund', datei)
      if (!ergebnis?.driveFileId) {
        setUploadFehler('Upload fehlgeschlagen. Bitte erneut versuchen.')
        return
      }
      const url = `https://drive.google.com/uc?id=${ergebnis.driveFileId}&export=view`
      const neueConfig: CanvasConfig = {
        ...canvasConfig,
        hintergrundbild: url,
        hintergrundbildId: ergebnis.driveFileId,
      }
      // Bei Auto-Preset: Dimensionen aus Bild lesen
      if (aktiverPreset === 'auto') {
        const img = new Image()
        img.onload = () => {
          onCanvasConfigChange({
            ...neueConfig,
            breite: img.naturalWidth || canvasConfig.breite,
            hoehe: img.naturalHeight || canvasConfig.hoehe,
          })
        }
        img.onerror = () => onCanvasConfigChange(neueConfig)
        img.src = url
      } else {
        onCanvasConfigChange(neueConfig)
      }
    } finally {
      setUploadLaeuft(false)
    }
  }

  function handleHintergrundEntfernen(): void {
    onCanvasConfigChange({ ...canvasConfig, hintergrundbild: undefined, hintergrundbildId: undefined })
  }

  function handleWerkzeugToggle(werkzeug: CanvasConfig['werkzeuge'][number]): void {
    const aktuelle = canvasConfig.werkzeuge ?? []
    const neu = aktuelle.includes(werkzeug)
      ? aktuelle.filter((w) => w !== werkzeug)
      : [...aktuelle, werkzeug]
    onCanvasConfigChange({ ...canvasConfig, werkzeuge: neu })
  }

  function handleFarbeToggle(farbe: string): void {
    const aktuelle = canvasConfig.farben ?? []
    const neu = aktuelle.includes(farbe)
      ? aktuelle.filter((f) => f !== farbe)
      : [...aktuelle, farbe]
    onCanvasConfigChange({ ...canvasConfig, farben: neu })
  }

  function handleKoordinatensystemToggle(aktiv: boolean): void {
    onCanvasConfigChange({
      ...canvasConfig,
      koordinatensystem: aktiv,
      achsenBeschriftung: aktiv ? (canvasConfig.achsenBeschriftung ?? { x: 'x', y: 'y' }) : undefined,
    })
  }

  async function handleMusterloesungUpload(datei: File): Promise<void> {
    setMusterUploadLaeuft(true)
    try {
      if (!services.istUploadVerfuegbar() || !services.uploadAnhang) return
      const ergebnis = await services.uploadAnhang('zeichnen-musterloesung', datei)
      if (ergebnis?.driveFileId) {
        onMusterloesungBildChange(`https://drive.google.com/uc?id=${ergebnis.driveFileId}&export=view`)
      }
    } finally {
      setMusterUploadLaeuft(false)
    }
  }

  // benutzer.email wird hier nicht direkt genutzt, aber für zukünftige Erweiterungen verfügbar
  void benutzer

  return (
    <Abschnitt titel="Zeichnen-Konfiguration">
      <div className="space-y-5">

        {/* Canvas-Grösse */}
        <Feld label="Canvas-Grösse">
          <div className="space-y-2">
            <select
              value={aktiverPreset}
              onChange={(e) => handlePresetWechsel(e.target.value as GroessePreset)}
              className="input-field"
            >
              <option value="klein">Klein (600x400)</option>
              <option value="mittel">Mittel (800x600)</option>
              <option value="gross">Gross (1200x800)</option>
              <option value="auto">Auto (aus Bild)</option>
              <option value="benutzerdefiniert">Benutzerdefiniert</option>
            </select>
            {aktiverPreset === 'benutzerdefiniert' && (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Breite (px)</label>
                  <input
                    type="number"
                    min={100}
                    value={canvasConfig.breite}
                    onChange={(e) => handleBreiteAendern(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Höhe (px)</label>
                  <input
                    type="number"
                    min={100}
                    value={canvasConfig.hoehe}
                    onChange={(e) => handleHoeheAendern(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
            )}
            {aktiverPreset === 'auto' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abmessungen werden aus dem Hintergrundbild übernommen.
              </p>
            )}
          </div>
        </Feld>

        {/* Hintergrundbild */}
        <Feld label="Hintergrundbild (optional)">
          {canvasConfig.hintergrundbild ? (
            <div className="flex items-start gap-3">
              <img
                src={canvasConfig.hintergrundbild}
                alt="Hintergrundbild Vorschau"
                className="w-24 h-16 object-cover rounded border border-slate-200 dark:border-slate-600"
              />
              <button
                type="button"
                onClick={handleHintergrundEntfernen}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                disabled={uploadLaeuft || !services.istUploadVerfuegbar()}
                onClick={() => hintergrundbild_Input.current?.click()}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {uploadLaeuft ? 'Wird hochgeladen...' : 'Bild hochladen (PNG, JPG, SVG)'}
              </button>
              {uploadFehler && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadFehler}</p>
              )}
              <input
                ref={hintergrundbild_Input}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const datei = e.target.files?.[0]
                  if (datei) void handleHintergrundUpload(datei)
                  e.target.value = ''
                }}
              />
            </div>
          )}
        </Feld>

        {/* Verfügbare Werkzeuge */}
        <Feld label="Verfügbare Werkzeuge">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ALLE_WERKZEUGE.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(canvasConfig.werkzeuge ?? []).includes(key)}
                  onChange={() => handleWerkzeugToggle(key)}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
        </Feld>

        {/* Radierer */}
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={canvasConfig.radierer !== false}
              onChange={(e) => onCanvasConfigChange({ ...canvasConfig, radierer: e.target.checked })}
              className="rounded"
            />
            Radierer verfügbar
          </label>
        </div>

        {/* Farben */}
        <Feld label="Verfügbare Farben">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ALLE_FARBEN.map(({ key, label, klasse }) => (
              <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(canvasConfig.farben ?? []).includes(key)}
                  onChange={() => handleFarbeToggle(key)}
                  className="rounded"
                />
                <span className={`inline-block w-3 h-3 rounded-full ${klasse}`} />
                {label}
              </label>
            ))}
          </div>
        </Feld>

        {/* Koordinatensystem */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={canvasConfig.koordinatensystem}
              onChange={(e) => handleKoordinatensystemToggle(e.target.checked)}
              className="rounded"
            />
            Koordinatensystem anzeigen
          </label>
          {canvasConfig.koordinatensystem && (
            <div className="ml-6 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400">x-Achse:</label>
                <input
                  type="text"
                  value={canvasConfig.achsenBeschriftung?.x ?? 'x'}
                  onChange={(e) => onCanvasConfigChange({
                    ...canvasConfig,
                    achsenBeschriftung: { x: e.target.value, y: canvasConfig.achsenBeschriftung?.y ?? 'y' },
                  })}
                  className="input-field w-28"
                  placeholder="x"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-slate-500 dark:text-slate-400">y-Achse:</label>
                <input
                  type="text"
                  value={canvasConfig.achsenBeschriftung?.y ?? 'y'}
                  onChange={(e) => onCanvasConfigChange({
                    ...canvasConfig,
                    achsenBeschriftung: { x: canvasConfig.achsenBeschriftung?.x ?? 'x', y: e.target.value },
                  })}
                  className="input-field w-28"
                  placeholder="y"
                />
              </div>
            </div>
          )}
        </div>

        {/* Musterlösung */}
        <Feld label="Musterlösung (optionales Referenzbild)">
          {musterloesungBild ? (
            <div className="flex items-start gap-3">
              <img
                src={musterloesungBild}
                alt="Musterlösung Vorschau"
                className="w-24 h-16 object-cover rounded border border-slate-200 dark:border-slate-600"
              />
              <button
                type="button"
                onClick={() => onMusterloesungBildChange(undefined)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Entfernen
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                disabled={musterUploadLaeuft || !services.istUploadVerfuegbar()}
                onClick={() => musterloesungInput.current?.click()}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {musterUploadLaeuft ? 'Wird hochgeladen...' : 'Musterlösung hochladen (PNG, JPG)'}
              </button>
              <input
                ref={musterloesungInput}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const datei = e.target.files?.[0]
                  if (datei) void handleMusterloesungUpload(datei)
                  e.target.value = ''
                }}
              />
            </div>
          )}
        </Feld>

      </div>
    </Abschnitt>
  )
}
