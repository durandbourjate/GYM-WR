import { useState, useEffect, useRef, useCallback } from 'react'
import type { PDFFrage, PDFAnnotation } from '../../../types/fragen.ts'
import type { FragenBewertung } from '../../../types/korrektur.ts'
import { effektivePunkte } from '../../../utils/korrekturUtils.ts'
import { apiService } from '../../../services/apiService.ts'
import { kiAssistent } from '../../../services/uploadApi.ts'
import { usePDFRenderer } from '../../fragetypen/pdf/usePDFRenderer.ts'
import { PDFViewer } from '../../fragetypen/pdf/PDFViewer.tsx'
import AudioRecorder from '../../AudioRecorder.tsx'

interface Props {
  pruefungId: string
  frageId: string
  fragetext: string
  maxPunkte: number
  frage: PDFFrage
  annotationen: PDFAnnotation[]
  bewertung: FragenBewertung
  schuelerEmail: string
  onUpdate: (updates: { lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean; audioKommentarId?: string | null }) => void
  onAudioUpload: (frageId: string, blob: Blob) => Promise<string | null>
}

/** Lokaler Speicherschlüssel für Textkommentar */
function kommentarKey(pruefungId: string, frageId: string, email: string): string {
  return `korrektur-kommentar-${pruefungId}-${frageId}-${email}`
}

/** Zählt Annotationen nach Werkzeugtyp */
function zaehleAnnotationen(annotationen: PDFAnnotation[]): Record<string, number> {
  const counts: Record<string, number> = {
    highlighter: 0,
    label: 0,
    kommentar: 0,
    freihand: 0,
    text: 0,
  }
  for (const a of annotationen) {
    if (a.werkzeug in counts) {
      counts[a.werkzeug]++
    }
  }
  return counts
}

export default function PDFKorrektur({
  pruefungId,
  frageId,
  fragetext: _fragetext,
  maxPunkte,
  frage,
  annotationen,
  bewertung,
  schuelerEmail,
  onUpdate,
  onAudioUpload,
}: Props) {
  // PDF laden
  const renderer = usePDFRenderer()
  const [geladenesPdf, setGeladenesPdf] = useState<string | null>(null)

  // PDF aus Drive nachladen wenn Base64 fehlt, oder per URL laden als Fallback
  useEffect(() => {
    if (frage.pdfBase64) return // Bereits vorhanden
    const driveId = frage.pdfDriveFileId || frage.anhaenge?.find(a => a.mimeType === 'application/pdf')?.driveFileId
    if (driveId && apiService.istKonfiguriert()) {
      apiService.ladeDriveFile(driveId, schuelerEmail).then((result) => {
        if (result?.base64) {
          setGeladenesPdf(result.base64)
        }
      })
    } else if (frage.pdfUrl && !driveId) {
      // Fallback: PDF per URL laden und als Base64 konvertieren (z.B. Einrichtungsprüfung)
      fetch(frage.pdfUrl)
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            if (base64) setGeladenesPdf(base64)
          }
          reader.readAsDataURL(blob)
        })
        .catch(err => console.error('[PDFKorrektur] PDF per URL laden fehlgeschlagen:', err))
    }
  }, [frage.pdfDriveFileId, frage.pdfBase64, frage.pdfUrl, frage.anhaenge, schuelerEmail])

  const effectivePdf = frage.pdfBase64 || geladenesPdf

  useEffect(() => {
    if (effectivePdf) {
      renderer.ladePDF({ base64: effectivePdf })
    }
  }, [effectivePdf, renderer.ladePDF])

  // Annotation counts
  const counts = zaehleAnnotationen(annotationen)

  // Textkommentar aus localStorage laden
  const lsKey = kommentarKey(pruefungId, frageId, schuelerEmail)
  const [kommentar, setKommentar] = useState<string>(() => {
    try {
      return localStorage.getItem(lsKey) ?? ''
    } catch {
      return ''
    }
  })

  // Debounce-Timer für localStorage
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleKommentarChange = useCallback((wert: string) => {
    setKommentar(wert)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      try {
        if (wert) {
          localStorage.setItem(lsKey, wert)
        } else {
          localStorage.removeItem(lsKey)
        }
      } catch {
        // localStorage voll — ignorieren
      }
      onUpdate({ lpKommentar: wert || null })
    }, 500)
  }, [lsKey, onUpdate])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // KI-Vorschlag
  const [kiLaedt, setKiLaedt] = useState(false)
  const [kiVorschlagGeladen, setKiVorschlagGeladen] = useState(false)
  const [kiPunkte, setKiPunkte] = useState<number | null>(null)
  const [kiBegruendung, setKiBegruendung] = useState<string | null>(null)
  const [kiFehler, setKiFehler] = useState(false)

  async function handleKiVorschlag(): Promise<void> {
    setKiLaedt(true)
    setKiFehler(false)

    const annotationenText = annotationen.map((a) => {
      let detail = ''
      if (a.werkzeug === 'kommentar') detail = a.kommentarText
      else if (a.werkzeug === 'text') detail = a.text
      else if (a.werkzeug === 'highlighter' || a.werkzeug === 'label') detail = a.textRange?.text || ''
      return `[${a.werkzeug} S.${a.seite}] ${detail || '(visuell)'}`
    }).join('\n')

    const ergebnis = await kiAssistent(schuelerEmail, 'korrigierePDF', {
      fragetext: frage.fragetext,
      musterlosung: frage.musterlosung || '',
      bewertungsraster: JSON.stringify(frage.bewertungsraster || []),
      maxPunkte: String(maxPunkte),
      annotationenAnzahl: String(annotationen.length),
      annotationenDetail: annotationenText,
      erlaubteWerkzeuge: JSON.stringify(frage.erlaubteWerkzeuge || []),
    })

    setKiLaedt(false)

    if (ergebnis && !ergebnis.fehler) {
      const punkte = typeof ergebnis.punkte === 'number' ? ergebnis.punkte : null
      setKiPunkte(punkte)
      const text = (ergebnis.begruendung || ergebnis.feedback || null) as string | null
      setKiBegruendung(text)
      setKiVorschlagGeladen(true)
    } else {
      setKiFehler(true)
    }
  }

  function handleKiUebernehmen(): void {
    if (kiPunkte !== null) {
      onUpdate({ lpPunkte: kiPunkte })
    }
    if (kiBegruendung) {
      handleKommentarChange(kiBegruendung)
    }
  }

  // Punkte-Eingabewert
  const aktuellePunkte = effektivePunkte(bewertung)
  const punkteWert = bewertung.lpPunkte ?? bewertung.kiPunkte ?? ''

  return (
    <div className="space-y-3">
      {/* Zwei-Spalten-Layout: PDF links, Sidebar rechts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Linke Seite: PDF mit Annotationen */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            PDF mit Annotationen:
          </p>
          {renderer.state.status === 'loading' && (
            <div className="rounded border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-6 text-center">
              <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm text-slate-400 dark:text-slate-500">PDF wird geladen...</span>
            </div>
          )}
          {renderer.state.status === 'error' && (
            <div className="rounded border border-dashed border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-6 text-center">
              <p className="text-sm text-red-500 dark:text-red-400 italic">
                PDF konnte nicht geladen werden
              </p>
            </div>
          )}
          {renderer.state.status === 'ready' && (
            <PDFViewer
              renderer={renderer}
              seitenAnzahl={renderer.state.seitenAnzahl}
              zoom={1}
              annotationen={annotationen}
              aktivesWerkzeug="auswahl"
              aktiveFarbe="#ffeb3b"
              kategorien={frage.kategorien}
              onAnnotationHinzufuegen={() => {}}
              onAnnotationLoeschen={() => {}}
              readOnly
            />
          )}
          {renderer.state.status === 'idle' && !effectivePdf && (
            <div className="rounded border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-6 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                Kein PDF vorhanden
              </p>
            </div>
          )}
        </div>

        {/* Rechte Sidebar */}
        <div className="space-y-3">
          {/* Zusammenfassung der Annotationen */}
          <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Annotationen ({annotationen.length} total):
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {counts.highlighter > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-yellow-300" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {counts.highlighter} Markierung{counts.highlighter !== 1 ? 'en' : ''}
                  </span>
                </div>
              )}
              {counts.label > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {counts.label} Label{counts.label !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {counts.kommentar > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {counts.kommentar} Kommentar{counts.kommentar !== 1 ? 'e' : ''}
                  </span>
                </div>
              )}
              {counts.freihand > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {counts.freihand} Freihand
                  </span>
                </div>
              )}
              {annotationen.length === 0 && (
                <p className="col-span-2 text-slate-400 dark:text-slate-500 italic">
                  Keine Annotationen vorhanden
                </p>
              )}
            </div>
          </div>

          {/* Textkommentar */}
          <div>
            <label
              htmlFor={`pk-kommentar-${frageId}`}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1"
            >
              Korrektur-Kommentar:
            </label>
            <textarea
              id={`pk-kommentar-${frageId}`}
              rows={3}
              value={kommentar}
              placeholder="Kommentar zur PDF-Bearbeitung..."
              onChange={(e) => {
            handleKommentarChange(e.target.value)
            // Auto-Geprüft bei Kommentar
            if (e.target.value.trim()) onUpdate({ geprueft: true })
          }}
              className="w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500 resize-none"
            />
          </div>

          {/* KI-Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleKiVorschlag}
              disabled={kiLaedt || kiVorschlagGeladen}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium transition-colors cursor-pointer
                ${kiVorschlagGeladen
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                }`}
            >
              {kiLaedt ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  Generiere...
                </>
              ) : (
                <>KI-Vorschlag</>
              )}
            </button>
          </div>

          {/* KI-Fehler */}
          {kiFehler && (
            <div className="rounded bg-red-50 dark:bg-red-900/15 border border-red-200/50 dark:border-red-700/30 px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-xs text-red-700 dark:text-red-300">
                KI-Vorschlag konnte nicht generiert werden.
              </p>
              <button
                onClick={() => { setKiFehler(false); setKiVorschlagGeladen(false) }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                Erneut
              </button>
            </div>
          )}

          {/* KI-Ergebnis */}
          {kiVorschlagGeladen && kiPunkte !== null && (
            <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/50 dark:border-amber-700/30 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Vorschlag: {kiPunkte} / {maxPunkte} Punkte
                </span>
                <button
                  onClick={handleKiUebernehmen}
                  className="text-xs px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                >
                  Übernehmen
                </button>
              </div>
              {kiBegruendung && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {kiBegruendung}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bewertungszeile: Punkte | = X Pkt. | 🎤 Audio | ☑ Geprüft */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`pk-punkte-${frageId}`} className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Punkte:
          </label>
          <input
            id={`pk-punkte-${frageId}`}
            type="number"
            min={0}
            max={maxPunkte}
            step={0.5}
            value={punkteWert}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') {
                onUpdate({ lpPunkte: null })
              } else {
                const val = parseFloat(raw)
                if (!isNaN(val) && val >= 0 && val <= maxPunkte) {
                  // Auto-Geprüft bei Punkte-Änderung
                  onUpdate({ lpPunkte: val, geprueft: true })
                }
              }
            }}
            className={`w-16 rounded border bg-white dark:bg-slate-700 px-2 py-1 text-sm text-slate-800 dark:text-slate-100 tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-violet-500 ${punkteWert === '' ? 'border-violet-500 bg-violet-50 dark:bg-[#2d2040]' : 'border-slate-300 dark:border-slate-600'}`}
          />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            / {maxPunkte}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">=</span>
          <span className={`text-sm font-semibold tabular-nums ${
            aktuellePunkte === maxPunkte
              ? 'text-green-600 dark:text-green-400'
              : aktuellePunkte === 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-700 dark:text-slate-200'
          }`}>
            {aktuellePunkte} Pkt.
          </span>
        </div>

        {/* Audio + Geprüft (rechts, zusammen) */}
        <div className="flex items-center gap-2 ml-auto">
          <AudioRecorder
            bestehendeAudioId={bewertung.audioKommentarId}
            kompakt
            onSpeichern={async (blob) => {
              const driveId = await onAudioUpload(frageId, blob)
              if (driveId) {
                // Auto-Geprüft bei Audio-Kommentar
                onUpdate({ audioKommentarId: driveId, geprueft: true })
              }
            }}
          />
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bewertung.geprueft}
              onChange={(e) => onUpdate({ geprueft: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-green-600 focus:ring-green-500 dark:bg-slate-700 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">Geprüft</span>
          </label>
        </div>
      </div>
    </div>
  )
}
