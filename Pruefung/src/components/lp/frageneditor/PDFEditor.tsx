/**
 * LP-Editor für den PDF-Fragetyp.
 * Konfiguriert PDF-Upload, erlaubte Werkzeuge, Kategorien und Musterlösung.
 */
import { useRef, useState, useEffect } from 'react'
import type { PDFKategorie, PDFAnnotationsWerkzeug, PDFAnnotation } from '../../../types/fragen.ts'
import { STANDARD_HIGHLIGHT_FARBEN } from '../../fragetypen/pdf/PDFTypes.ts'
import { usePDFRenderer } from '../../fragetypen/pdf/usePDFRenderer.ts'
import { Abschnitt, Feld } from './EditorBausteine.tsx'

interface PDFEditorProps {
  pdfBase64: string
  setPdfBase64: (v: string) => void
  pdfDriveFileId: string
  setPdfDriveFileId: (v: string) => void
  pdfDateiname: string
  setPdfDateiname: (v: string) => void
  seitenAnzahl: number
  setSeitenAnzahl: (v: number) => void
  kategorien: PDFKategorie[]
  setKategorien: React.Dispatch<React.SetStateAction<PDFKategorie[]>>
  erlaubteWerkzeuge: PDFAnnotationsWerkzeug[]
  setErlaubteWerkzeuge: React.Dispatch<React.SetStateAction<PDFAnnotationsWerkzeug[]>>
  musterloesungAnnotationen: PDFAnnotation[]
  setMusterloesungAnnotationen: React.Dispatch<React.SetStateAction<PDFAnnotation[]>>
}

const ALLE_WERKZEUGE: { key: PDFAnnotationsWerkzeug; label: string }[] = [
  { key: 'highlighter', label: 'Highlighter' },
  { key: 'kommentar', label: 'Kommentar' },
  { key: 'freihand', label: 'Freihand' },
  { key: 'label', label: 'Label' },
]

const MAX_DATEIGROESSE = 10 * 1024 * 1024 // 10 MB

interface KategorienVorlage {
  label: string
  kategorien: Omit<PDFKategorie, 'id'>[]
}

const KATEGORIEN_VORLAGEN: KategorienVorlage[] = [
  {
    label: 'Stilmittel (Deutsch)',
    kategorien: [
      { label: 'Metapher', farbe: STANDARD_HIGHLIGHT_FARBEN[0], beschreibung: 'Bildliche Übertragung' },
      { label: 'Anapher', farbe: STANDARD_HIGHLIGHT_FARBEN[1], beschreibung: 'Wiederholung am Satzanfang' },
      { label: 'Alliteration', farbe: STANDARD_HIGHLIGHT_FARBEN[2], beschreibung: 'Gleichlautende Anfangsbuchstaben' },
      { label: 'Hyperbel', farbe: STANDARD_HIGHLIGHT_FARBEN[3], beschreibung: 'Übertreibung' },
      { label: 'Ironie', farbe: STANDARD_HIGHLIGHT_FARBEN[4], beschreibung: 'Gegenteil des Gemeinten' },
    ],
  },
  {
    label: 'Argumentationstypen',
    kategorien: [
      { label: 'Faktenargument', farbe: STANDARD_HIGHLIGHT_FARBEN[0], beschreibung: 'Auf Tatsachen gestützt' },
      { label: 'Autoritätsargument', farbe: STANDARD_HIGHLIGHT_FARBEN[1], beschreibung: 'Berufung auf Experten' },
      { label: 'Wertargument', farbe: STANDARD_HIGHLIGHT_FARBEN[2], beschreibung: 'Auf Werte/Normen gestützt' },
      { label: 'Analogieargument', farbe: STANDARD_HIGHLIGHT_FARBEN[3], beschreibung: 'Vergleich mit ähnlichem Fall' },
    ],
  },
  {
    label: 'Rechtsgrundlagen',
    kategorien: [
      { label: 'Tatbestandsmerkmal', farbe: STANDARD_HIGHLIGHT_FARBEN[0], beschreibung: 'Voraussetzung der Norm' },
      { label: 'Rechtsfolge', farbe: STANDARD_HIGHLIGHT_FARBEN[1], beschreibung: 'Konsequenz bei Erfüllung' },
      { label: 'Ausnahme', farbe: STANDARD_HIGHLIGHT_FARBEN[2], beschreibung: 'Ausnahmeregelung' },
      { label: 'Verweis', farbe: STANDARD_HIGHLIGHT_FARBEN[3], beschreibung: 'Verweis auf andere Norm' },
    ],
  },
]

function erzeugeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export default function PDFEditor({
  pdfBase64, setPdfBase64,
  pdfDriveFileId, setPdfDriveFileId,
  pdfDateiname, setPdfDateiname,
  seitenAnzahl, setSeitenAnzahl,
  kategorien, setKategorien,
  erlaubteWerkzeuge, setErlaubteWerkzeuge,
  musterloesungAnnotationen, setMusterloesungAnnotationen,
}: PDFEditorProps) {
  const dateiInput = useRef<HTMLInputElement>(null)
  const [uploadFehler, setUploadFehler] = useState<string | null>(null)
  const [verworfeneAnnotationen, setVerworfeneAnnotationen] = useState<number>(0)

  const pdf = usePDFRenderer()

  // Load PDF preview when base64 is available
  useEffect(() => {
    if (pdfBase64) {
      void pdf.ladePDF({ base64: pdfBase64 })
    }
  }, []) // Only on mount — subsequent uploads handle loading explicitly

  function handleDateiAuswahl(datei: File): void {
    setUploadFehler(null)

    if (datei.type !== 'application/pdf') {
      setUploadFehler('Nur PDF-Dateien sind erlaubt.')
      return
    }

    if (datei.size > MAX_DATEIGROESSE) {
      setUploadFehler('Datei ist zu gross (max. 10 MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove "data:application/pdf;base64," prefix
      const base64 = result.split(',')[1] ?? result
      setPdfBase64(base64)
      setPdfDateiname(datei.name)
      // TODO: Integrate with uploadApi.ts for Google Drive upload
      setPdfDriveFileId('')

      // Load PDF to get page count
      void pdf.ladePDF({ base64 }).then(() => {
        // Page count is set via the pdf.state reactive update
      })
    }
    reader.onerror = () => {
      setUploadFehler('Fehler beim Lesen der Datei.')
    }
    reader.readAsDataURL(datei)
  }

  // Update seitenAnzahl when PDF loads successfully
  useEffect(() => {
    if (pdf.state.status === 'ready' && pdf.state.seitenAnzahl > 0) {
      const neueSeitenAnzahl = pdf.state.seitenAnzahl

      // Check if we need to discard annotations on pages that no longer exist
      if (seitenAnzahl > 0 && neueSeitenAnzahl < seitenAnzahl && musterloesungAnnotationen.length > 0) {
        const ungueltige = musterloesungAnnotationen.filter((a) => a.seite >= neueSeitenAnzahl)
        if (ungueltige.length > 0) {
          setMusterloesungAnnotationen((prev) => prev.filter((a) => a.seite < neueSeitenAnzahl))
          setVerworfeneAnnotationen(ungueltige.length)
        }
      }

      setSeitenAnzahl(neueSeitenAnzahl)
    }
  }, [pdf.state.status, pdf.state.seitenAnzahl])

  function handleWerkzeugToggle(werkzeug: PDFAnnotationsWerkzeug): void {
    setErlaubteWerkzeuge((prev) => {
      if (prev.includes(werkzeug)) {
        // At least 1 must remain checked
        if (prev.length <= 1) return prev
        return prev.filter((w) => w !== werkzeug)
      }
      return [...prev, werkzeug]
    })
  }

  function handleKategorieHinzu(): void {
    const farbeIndex = kategorien.length % STANDARD_HIGHLIGHT_FARBEN.length
    setKategorien((prev) => [
      ...prev,
      { id: erzeugeId(), label: '', farbe: STANDARD_HIGHLIGHT_FARBEN[farbeIndex], beschreibung: '' },
    ])
  }

  function handleKategorieEntfernen(id: string): void {
    setKategorien((prev) => prev.filter((k) => k.id !== id))
  }

  function handleKategorieAendern(id: string, feld: keyof PDFKategorie, wert: string): void {
    setKategorien((prev) => prev.map((k) =>
      k.id === id ? { ...k, [feld]: wert } : k
    ))
  }

  function handleVorlageAnwenden(vorlage: KategorienVorlage): void {
    setKategorien(vorlage.kategorien.map((k) => ({ ...k, id: erzeugeId() })))
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault()
    const datei = e.dataTransfer.files[0]
    if (datei) handleDateiAuswahl(datei)
  }

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault()
  }

  const labelAktiv = erlaubteWerkzeuge.includes('label')

  return (
    <Abschnitt titel="PDF-Konfiguration">
      <div className="space-y-5">

        {/* 1. PDF Upload */}
        <Feld label="PDF-Datei">
          {pdfBase64 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pdfDateiname}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {seitenAnzahl > 0 ? `${seitenAnzahl} Seite${seitenAnzahl !== 1 ? 'n' : ''}` : 'Wird geladen...'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPdfBase64('')
                    setPdfDriveFileId('')
                    setPdfDateiname('')
                    setSeitenAnzahl(0)
                    setVerworfeneAnnotationen(0)
                  }}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Entfernen
                </button>
              </div>

              {/* Warning about discarded annotations */}
              {verworfeneAnnotationen > 0 && (
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {verworfeneAnnotationen} Annotation{verworfeneAnnotationen !== 1 ? 'en' : ''} auf nicht mehr vorhandenen Seiten wurden entfernt.
                  </p>
                </div>
              )}

              {/* Replace PDF */}
              <button
                type="button"
                onClick={() => dateiInput.current?.click()}
                className="btn-secondary text-sm"
              >
                PDF ersetzen
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => dateiInput.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
              >
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  PDF hierher ziehen oder klicken zum Auswählen
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Nur .pdf, max. 10 MB
                </p>
              </div>
              {uploadFehler && (
                <p className="text-xs text-red-600 dark:text-red-400">{uploadFehler}</p>
              )}
              {pdf.state.status === 'error' && (
                <p className="text-xs text-red-600 dark:text-red-400">PDF konnte nicht geladen werden: {pdf.state.fehler}</p>
              )}
            </div>
          )}
          <input
            ref={dateiInput}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const datei = e.target.files?.[0]
              if (datei) handleDateiAuswahl(datei)
              e.target.value = ''
            }}
          />
        </Feld>

        {/* 2. Werkzeug Checkboxes */}
        <Feld label="Erlaubte Werkzeuge">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {ALLE_WERKZEUGE.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={erlaubteWerkzeuge.includes(key)}
                  onChange={() => handleWerkzeugToggle(key)}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>
          {erlaubteWerkzeuge.length <= 1 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Mindestens ein Werkzeug muss aktiviert sein.
            </p>
          )}
        </Feld>

        {/* 3. Kategorien Editor (visible when 'label' werkzeug is active) */}
        {labelAktiv && (
          <Feld label="Kategorien für Label-Werkzeug">
            <div className="space-y-3">
              {/* Vorlagen dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    const vorlage = KATEGORIEN_VORLAGEN.find((v) => v.label === e.target.value)
                    if (vorlage) handleVorlageAnwenden(vorlage)
                  }}
                  className="input-field text-sm"
                >
                  <option value="" disabled>Vorlage wählen...</option>
                  {KATEGORIEN_VORLAGEN.map((v) => (
                    <option key={v.label} value={v.label}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Category list */}
              {kategorien.map((kat) => (
                <div key={kat.id} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <input
                    type="text"
                    value={kat.label}
                    onChange={(e) => handleKategorieAendern(kat.id, 'label', e.target.value)}
                    placeholder="Kategorie-Name"
                    className="input-field flex-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    {STANDARD_HIGHLIGHT_FARBEN.map((farbe) => (
                      <button
                        key={farbe}
                        type="button"
                        onClick={() => handleKategorieAendern(kat.id, 'farbe', farbe)}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          kat.farbe === farbe
                            ? 'border-slate-800 dark:border-slate-200 scale-110'
                            : 'border-transparent hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: farbe }}
                        title={farbe}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={kat.beschreibung ?? ''}
                    onChange={(e) => handleKategorieAendern(kat.id, 'beschreibung', e.target.value)}
                    placeholder="Beschreibung (optional)"
                    className="input-field w-40 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleKategorieEntfernen(kat.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-1"
                    title="Kategorie entfernen"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleKategorieHinzu}
                className="btn-secondary text-sm"
              >
                + Kategorie hinzufügen
              </button>
            </div>
          </Feld>
        )}

      </div>
    </Abschnitt>
  )
}
