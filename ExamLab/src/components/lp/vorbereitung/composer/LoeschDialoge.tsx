import BaseDialog from '../../../ui/BaseDialog'

interface Props {
  /** Abschnitt-Lösch-Dialog: aktiv wenn !== null */
  loeschDialog: { index: number; titel: string } | null
  onAbschnittAbbrechen: () => void
  onAbschnittBestaetigen: () => void

  /** Prüfung-Lösch-Dialog */
  zeigLoeschPruefung: boolean
  pruefungTyp: 'summativ' | 'formativ'
  pruefungTitel: string
  loescht: boolean
  onPruefungAbbrechen: () => void
  onPruefungLoeschen: () => void
}

export function LoeschDialoge({
  loeschDialog,
  onAbschnittAbbrechen,
  onAbschnittBestaetigen,
  zeigLoeschPruefung,
  pruefungTyp,
  pruefungTitel,
  loescht,
  onPruefungAbbrechen,
  onPruefungLoeschen,
}: Props): React.JSX.Element {
  return (
    <>
      <BaseDialog
        open={!!loeschDialog}
        onClose={onAbschnittAbbrechen}
        title="Abschnitt löschen?"
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={onAbschnittAbbrechen}
              className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm"
            >
              Abbrechen
            </button>
            <button
              onClick={onAbschnittBestaetigen}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm"
            >
              Löschen
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Abschnitt &laquo;{loeschDialog?.titel}&raquo; wirklich löschen? Die enthaltenen Fragen werden entfernt.
        </p>
      </BaseDialog>

      <BaseDialog
        open={zeigLoeschPruefung}
        onClose={onPruefungAbbrechen}
        title={pruefungTyp === 'formativ' ? 'Übung löschen?' : 'Prüfung löschen?'}
        maxWidth="sm"
        footer={
          <>
            <button
              onClick={onPruefungAbbrechen}
              disabled={loescht}
              className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm disabled:opacity-40"
            >
              Abbrechen
            </button>
            <button
              onClick={onPruefungLoeschen}
              disabled={loescht}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer font-medium text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loescht && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loescht ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
          &laquo;{pruefungTitel || (pruefungTyp === 'formativ' ? 'Unbenannte Übung' : 'Unbenannte Prüfung')}&raquo; unwiderruflich löschen?
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Die Konfiguration wird aus dem System entfernt. Bereits abgegebene Antworten bleiben in Google Drive erhalten.
        </p>
      </BaseDialog>
    </>
  )
}
