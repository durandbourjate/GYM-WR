import { apiService } from '../../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../../types/korrektur.ts'
import type { Frage } from '../../../types/fragen.ts'

interface Props {
  pruefungId: string
  userEmail: string
  korrektur: PruefungsKorrektur | null
  abgaben: Record<string, SchuelerAbgabe>
  fragen: Frage[]
  batchLaeuft: boolean
  aktionLaeuft: string | null
  setAktionLaeuft: (v: string | null) => void
  einsichtFreigegeben: boolean
  setEinsichtFreigegeben: (v: boolean) => void
  pdfFreigegeben: boolean
  setPdfFreigegeben: (v: boolean) => void
  backupLaden: boolean
  onStarteKorrektur: () => void
  onFeedbackOeffnen: () => void
  onCSVExport: () => void
  onDetailExport: () => void
  onBackupExport: () => void
  onPDFOeffnen: () => void
}

export default function KorrekturAktionsLeiste({
  pruefungId, userEmail, korrektur, abgaben, fragen,
  batchLaeuft, aktionLaeuft, setAktionLaeuft,
  einsichtFreigegeben, setEinsichtFreigegeben,
  pdfFreigegeben, setPdfFreigegeben,
  backupLaden,
  onStarteKorrektur, onFeedbackOeffnen, onCSVExport, onDetailExport, onBackupExport, onPDFOeffnen,
}: Props) {
  return (
    <>
      {(korrektur?.batchStatus === 'laeuft' || batchLaeuft) && (
        <span className="text-sm text-amber-600 dark:text-amber-400">
          KI korrigiert... {korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}
        </span>
      )}
      {korrektur?.batchStatus === 'idle' && (
        <button onClick={onStarteKorrektur} disabled={aktionLaeuft === 'ki'} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer disabled:opacity-50">
          {aktionLaeuft === 'ki' ? 'Wird gestartet...' : 'KI-Korrektur starten'}
        </button>
      )}
      {korrektur?.batchStatus === 'fertig' && (
        <button onClick={onFeedbackOeffnen} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
          Feedback senden
        </button>
      )}
      {korrektur && (
        <button
          type="button"
          disabled={aktionLaeuft === 'einsicht'}
          onClick={async () => {
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
          title={einsichtFreigegeben ? 'Einsicht für SuS sperren' : 'Einsicht für SuS freigeben'}
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
        <button onClick={onCSVExport} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer" title="Ergebnisse als CSV exportieren (nur Punkte)">
          CSV Export
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && Object.keys(abgaben).length > 0 && (
        <button onClick={onDetailExport} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer" title="Detaillierter Export mit Antworten und Punkten pro Frage">
          Excel-Export (Detailliert)
        </button>
      )}
      {korrektur && fragen.length > 0 && (
        <button onClick={onBackupExport} disabled={backupLaden} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer" title="Vollständiges Backup als Excel (Übersicht + Tab pro SuS)">
          {backupLaden ? 'Exportiert…' : '📥 Backup (.xlsx)'}
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && (
        <button
          onClick={onPDFOeffnen}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          title="Einzelne Korrektur-PDFs nacheinander anzeigen und drucken"
        >
          Korrektur-PDFs
        </button>
      )}
    </>
  )
}
