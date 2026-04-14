import { useState, useRef, useCallback } from 'react'
import { useFocusTrap } from '../../../hooks/useFocusTrap'
import { useAuthStore } from '../../../store/authStore'
import { fachbereichFarbe, typLabel } from '../../../utils/fachUtils'
import { parseExcelDatei, exportiereVorlage } from '../../../utils/excelImport'
import type { ImportZeile } from '../../../utils/excelImport'
import type { Frage } from '../../../types/fragen'

interface Props {
  onImportiert: (fragen: Frage[]) => void
  onSchliessen: () => void
  /** Bestehende Frage-IDs für Duplikat-Erkennung */
  bestehendeIds?: Set<string>
}

type Status = 'upload' | 'laden' | 'sheetWahl' | 'vorschau' | 'importieren' | 'fertig' | 'fehler'

/** Modal für Excel-Import von Fragen in die Fragenbank */
export default function ExcelImport({ onImportiert, onSchliessen, bestehendeIds }: Props) {
  const user = useAuthStore((s) => s.user)
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  useFocusTrap(panelRef)

  const [status, setStatus] = useState<Status>('upload')
  const [fehler, setFehler] = useState('')
  const [dateiName, setDateiName] = useState('')

  // Sheet-Auswahl
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [gewaehltesSheet, setGewaehltesSheet] = useState('')
  const [dateiBuffer, setDateiBuffer] = useState<File | null>(null)

  // Vorschau
  const [zeilen, setZeilen] = useState<ImportZeile[]>([])

  // Import-Fortschritt
  const [fortschritt, setFortschritt] = useState({ gesamt: 0, fertig: 0, fehler: 0 })

  // Drag & Drop
  const [dragAktiv, setDragAktiv] = useState(false)

  const handleDatei = useCallback(async (datei: File) => {
    if (!datei.name.match(/\.xlsx?$/i)) {
      setFehler('Bitte eine .xlsx oder .xls Datei wählen.')
      setStatus('fehler')
      return
    }

    setDateiName(datei.name)
    setDateiBuffer(datei)
    setStatus('laden')
    setFehler('')

    try {
      const result = await parseExcelDatei(datei)

      if (result.fehler) {
        setFehler(result.fehler)
        setStatus('fehler')
        return
      }

      // Mehrere Sheets → Auswahl anbieten
      if (result.sheetNames.length > 1) {
        setSheetNames(result.sheetNames)
        setGewaehltesSheet(result.sheetNames[0])
        // Erste Sheet-Daten schon geladen
        markiereDuplikate(result.zeilen)
        setZeilen(result.zeilen)
        setStatus('sheetWahl')
        return
      }

      markiereDuplikate(result.zeilen)
      setZeilen(result.zeilen)
      setStatus('vorschau')
    } catch {
      setFehler('Fehler beim Lesen der Datei. Ist die Datei beschädigt?')
      setStatus('fehler')
    }
  }, [bestehendeIds])

  const handleSheetWechsel = useCallback(async (sheet: string) => {
    setGewaehltesSheet(sheet)
    if (!dateiBuffer) return
    setStatus('laden')

    try {
      const result = await parseExcelDatei(dateiBuffer, sheet)
      if (result.fehler) {
        setFehler(result.fehler)
        setStatus('fehler')
        return
      }
      markiereDuplikate(result.zeilen)
      setZeilen(result.zeilen)
      setStatus('sheetWahl')
    } catch {
      setFehler('Fehler beim Laden des Sheets.')
      setStatus('fehler')
    }
  }, [dateiBuffer, bestehendeIds])

  function markiereDuplikate(zeilen: ImportZeile[]) {
    if (!bestehendeIds) return
    for (const z of zeilen) {
      if (z.frage && bestehendeIds.has(z.frage.id)) {
        z.validierung.meldungen.push('ID existiert bereits (wird aktualisiert)')
        if (z.validierung.status === 'ok') z.validierung.status = 'warnung'
      }
    }
  }

  function toggleZeile(idx: number) {
    setZeilen(prev => prev.map((z, i) => i === idx ? { ...z, ausgewaehlt: !z.ausgewaehlt } : z))
  }

  function toggleAlle() {
    const valide = zeilen.filter(z => z.validierung.status !== 'fehler')
    const alleAn = valide.every(z => z.ausgewaehlt)
    setZeilen(prev => prev.map(z =>
      z.validierung.status !== 'fehler' ? { ...z, ausgewaehlt: !alleAn } : z
    ))
  }

  async function handleImportieren() {
    const ausgewaehlte = zeilen.filter(z => z.ausgewaehlt && z.frage)
    if (ausgewaehlte.length === 0) return

    // Autor setzen
    const fragen = ausgewaehlte.map(z => ({
      ...z.frage!,
      autor: user?.email || z.frage!.autor,
    }))

    setFortschritt({ gesamt: fragen.length, fertig: 0, fehler: 0 })
    setStatus('importieren')

    // Import direkt an Parent delegieren (der ruft speichereFrage pro Frage auf)
    onImportiert(fragen)
    setFortschritt({ gesamt: fragen.length, fertig: fragen.length, fehler: 0 })
    setStatus('fertig')
  }

  const ausgewaehltAnzahl = zeilen.filter(z => z.ausgewaehlt && z.frage).length
  const fehlerAnzahl = zeilen.filter(z => z.validierung.status === 'fehler').length
  const warnungAnzahl = zeilen.filter(z => z.validierung.status === 'warnung').length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[80px]">
      <div className="absolute inset-0 bg-black/50" onClick={onSchliessen} />

      <div
        ref={panelRef}
        className="relative w-full max-w-3xl max-h-[calc(100vh-100px)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Excel-Import
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dateiName || 'Fragen aus XLSX-Datei importieren'}
            </p>
          </div>
          <button
            onClick={onSchliessen}
            className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-auto px-6 py-4 space-y-4">

          {/* Upload-Phase */}
          {(status === 'upload' || status === 'fehler') && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragAktiv(true) }}
                onDragLeave={() => setDragAktiv(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragAktiv(false)
                  const datei = e.dataTransfer.files[0]
                  if (datei) handleDatei(datei)
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragAktiv
                    ? 'border-slate-600 bg-slate-50 dark:border-slate-400 dark:bg-slate-700'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
              >
                <div className="text-3xl mb-2">📊</div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  XLSX-Datei hierher ziehen oder klicken
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  .xlsx oder .xls · Pflichtfelder: typ, fachbereich, thema, bloom, punkte, fragetext
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const datei = e.target.files?.[0]
                    if (datei) handleDatei(datei)
                  }}
                />
              </div>

              {/* Vorlage herunterladen */}
              <div className="text-center">
                <button
                  onClick={() => exportiereVorlage()}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Vorlage herunterladen (.xlsx)
                </button>
              </div>

              {fehler && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{fehler}</p>
                </div>
              )}
            </>
          )}

          {/* Laden */}
          {status === 'laden' && (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto mb-4 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300">Datei wird analysiert...</p>
            </div>
          )}

          {/* Sheet-Auswahl (bei mehreren Tabs) */}
          {status === 'sheetWahl' && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">Sheet:</span>
                {sheetNames.map(name => (
                  <button
                    key={name}
                    onClick={() => handleSheetWechsel(name)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                      name === gewaehltesSheet
                        ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-800 dark:border-slate-200'
                        : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              {renderVorschau()}
            </>
          )}

          {/* Vorschau */}
          {status === 'vorschau' && renderVorschau()}

          {/* Importieren */}
          {status === 'importieren' && (
            <div className="text-center py-12">
              <div className="w-10 h-10 mx-auto mb-4 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Importiere {fortschritt.fertig}/{fortschritt.gesamt} Fragen...
              </p>
              <div className="w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3">
                <div
                  className="h-full bg-slate-800 dark:bg-slate-200 rounded-full transition-all"
                  style={{ width: `${fortschritt.gesamt > 0 ? (fortschritt.fertig / fortschritt.gesamt * 100) : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Fertig */}
          {status === 'fertig' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {fortschritt.fertig} Frage{fortschritt.fertig !== 1 ? 'n' : ''} importiert
              </p>
              {fortschritt.fehler > 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {fortschritt.fehler} Fehler
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {(status === 'vorschau' || status === 'sheetWahl') && (
              <>
                {zeilen.length} Zeilen · {ausgewaehltAnzahl} ausgewählt
                {fehlerAnzahl > 0 && <span className="text-red-500"> · {fehlerAnzahl} Fehler</span>}
                {warnungAnzahl > 0 && <span className="text-amber-500"> · {warnungAnzahl} Warnungen</span>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status === 'fertig' ? (
              <button
                onClick={onSchliessen}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Schliessen
              </button>
            ) : (
              <>
                <button
                  onClick={status === 'vorschau' || status === 'sheetWahl'
                    ? () => { setStatus('upload'); setZeilen([]); setFehler('') }
                    : onSchliessen
                  }
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  {status === 'vorschau' || status === 'sheetWahl' ? '← Zurück' : 'Abbrechen'}
                </button>

                {(status === 'vorschau' || status === 'sheetWahl') && (
                  <button
                    onClick={handleImportieren}
                    disabled={ausgewaehltAnzahl === 0}
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {ausgewaehltAnzahl} Frage{ausgewaehltAnzahl !== 1 ? 'n' : ''} importieren
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  function renderVorschau() {
    return (
      <>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {zeilen.length} Zeile{zeilen.length !== 1 ? 'n' : ''} erkannt
          </p>
          <button
            onClick={toggleAlle}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            {zeilen.filter(z => z.validierung.status !== 'fehler').every(z => z.ausgewaehlt) ? 'Alle abwählen' : 'Alle wählen'}
          </button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-auto">
          {zeilen.map((zeile, idx) => (
            <div
              key={idx}
              onClick={() => zeile.validierung.status !== 'fehler' && toggleZeile(idx)}
              className={`p-3 rounded-lg border transition-colors ${
                zeile.validierung.status === 'fehler'
                  ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 opacity-60'
                  : zeile.ausgewaehlt
                    ? 'border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-700 cursor-pointer'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  zeile.validierung.status === 'fehler'
                    ? 'border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/30'
                    : zeile.ausgewaehlt
                      ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200'
                      : 'border-slate-400 dark:border-slate-500'
                }`}>
                  {zeile.validierung.status === 'fehler'
                    ? <span className="text-red-500 text-xs">✕</span>
                    : zeile.ausgewaehlt && <span className="text-white dark:text-slate-800 text-xs">✓</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] text-slate-400">Z.{zeile.zeilenNr}</span>
                    {zeile.frage && (
                      <>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(zeile.frage.fachbereich)}`}>
                          {zeile.frage.fachbereich}
                        </span>
                        <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                          {typLabel(zeile.frage.typ)}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {zeile.frage.bloom} · {zeile.frage.punkte}P.
                        </span>
                      </>
                    )}
                    {/* Validierungs-Status */}
                    {zeile.validierung.status === 'warnung' && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">⚠</span>
                    )}
                    {zeile.validierung.status === 'fehler' && (
                      <span className="text-xs text-red-600 dark:text-red-400">❌</span>
                    )}
                  </div>

                  {/* Fragetext */}
                  <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
                    {(zeile.frage as { fragetext?: string })?.fragetext || zeile.rohdaten.fragetext || '(kein Fragetext)'}
                  </p>

                  {/* Validierungsmeldungen */}
                  {zeile.validierung.meldungen.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {zeile.validierung.meldungen.map((m, mi) => (
                        <p key={mi} className={`text-xs ${
                          zeile.validierung.status === 'fehler'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {m}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )
  }
}
