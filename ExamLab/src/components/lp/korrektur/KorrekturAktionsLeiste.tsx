import { apiService } from '../../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../../types/korrektur.ts'
interface Props {
  pruefungId: string
  userEmail: string
  korrektur: PruefungsKorrektur | null
  abgaben: Record<string, SchuelerAbgabe>
  batchLaeuft: boolean
  aktionLaeuft: string | null
  setAktionLaeuft: (v: string | null) => void
  einsichtFreigegeben: boolean
  setEinsichtFreigegeben: (v: boolean) => void
  pdfFreigegeben: boolean
  setPdfFreigegeben: (v: boolean) => void
  onStarteKorrektur: () => void
  onFeedbackOeffnen: () => void
  onCSVExport: () => void
  onDetailExport: () => void
  onPDFOeffnen: () => void
  /** U7: Anzahl Bewertungen ohne Punkte (geprüft aber lpPunkte+kiPunkte null) */
  bewertungenOhnePunkte?: number
}

export default function KorrekturAktionsLeiste({
  pruefungId, userEmail, korrektur, abgaben,
  batchLaeuft, aktionLaeuft, setAktionLaeuft,
  einsichtFreigegeben, setEinsichtFreigegeben,
  pdfFreigegeben, setPdfFreigegeben,
  onStarteKorrektur, onFeedbackOeffnen, onCSVExport, onDetailExport, onPDFOeffnen,
  bewertungenOhnePunkte = 0,
}: Props) {
  // U7: Prüfe ob alle Bewertungen vollständig bepunktet sind
  const hatFehlendePunkte = bewertungenOhnePunkte > 0
  const punkteWarnung = hatFehlendePunkte ? `⚠ ${bewertungenOhnePunkte} Bewertungen ohne Punkte` : ''
  return (
    <>
      {(korrektur?.batchStatus === 'laeuft' || batchLaeuft) && (
        <span className="text-sm text-amber-600 dark:text-amber-400">
          Korrektur läuft... {korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}
        </span>
      )}
      {korrektur?.batchStatus === 'idle' && (
        <button onClick={onStarteKorrektur} disabled={aktionLaeuft === 'ki'} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50">
          {aktionLaeuft === 'ki' ? 'Wird gestartet...' : 'Autokorrektur starten'}
        </button>
      )}
      {korrektur?.batchStatus === 'fertig' && (
        <button
          onClick={() => {
            if (hatFehlendePunkte && !window.confirm(`${punkteWarnung}. Trotzdem Feedback senden?`)) return
            onFeedbackOeffnen()
          }}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          title={hatFehlendePunkte ? punkteWarnung : undefined}
        >
          Feedback senden
        </button>
      )}
      {korrektur && (
        <button
          type="button"
          disabled={aktionLaeuft === 'einsicht' || (hatFehlendePunkte && !einsichtFreigegeben)}
          onClick={async () => {
            // U7: Warnung wenn Punkte fehlen und Freigabe versucht wird
            if (hatFehlendePunkte && !einsichtFreigegeben) return
            setAktionLaeuft('einsicht')
            const neuerWert = !einsichtFreigegeben
            const ok = await apiService.korrekturFreigeben(pruefungId, neuerWert, userEmail, 'einsicht')
            if (ok) {
              setEinsichtFreigegeben(neuerWert)
              if (!neuerWert && pdfFreigegeben) {
                await apiService.korrekturFreigeben(pruefungId, false, userEmail, 'pdf')
                setPdfFreigegeben(false)
              }
            }
            setAktionLaeuft(null)
          }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
            einsichtFreigegeben
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={hatFehlendePunkte && !einsichtFreigegeben ? punkteWarnung : einsichtFreigegeben ? 'Einsicht für SuS sperren' : 'Einsicht für SuS freigeben'}
        >
          {aktionLaeuft === 'einsicht' ? 'Wird gespeichert...' : einsichtFreigegeben ? '✓ Einsicht' : 'Einsicht freigeben'}
        </button>
      )}
      {korrektur && einsichtFreigegeben && (
        <button
          type="button"
          disabled={aktionLaeuft === 'pdf'}
          onClick={async () => {
            setAktionLaeuft('pdf')
            const neuerWert = !pdfFreigegeben
            const ok = await apiService.korrekturFreigeben(pruefungId, neuerWert, userEmail, 'pdf')
            if (ok) setPdfFreigegeben(neuerWert)
            setAktionLaeuft(null)
          }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
            pdfFreigegeben
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={pdfFreigegeben ? 'PDF-Download für SuS sperren' : 'PDF-Download für SuS freigeben'}
        >
          {aktionLaeuft === 'pdf' ? 'Wird gespeichert...' : pdfFreigegeben ? '✓ PDF-Download' : 'PDF freigeben'}
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && (
        <button
          onClick={() => {
            if (hatFehlendePunkte && !window.confirm(`${punkteWarnung}. Trotzdem exportieren?`)) return
            onCSVExport()
          }}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          title={hatFehlendePunkte ? punkteWarnung : 'Ergebnisse als CSV exportieren (nur Punkte)'}
        >
          CSV Export
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && Object.keys(abgaben).length > 0 && (
        <button
          onClick={() => {
            if (hatFehlendePunkte && !window.confirm(`${punkteWarnung}. Trotzdem exportieren?`)) return
            onDetailExport()
          }}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          title={hatFehlendePunkte ? punkteWarnung : 'Detaillierter Export mit Antworten und Punkten pro Frage'}
        >
          Excel-Export (Detailliert)
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && (
        <button
          onClick={onPDFOeffnen}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Korrektur-PDFs
        </button>
      )}
    </>
  )
}
