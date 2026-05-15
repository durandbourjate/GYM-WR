/**
 * BatchLoeschConfirmModal — Cluster D Phase 4 Confirm-Dialog für Bulk-Soft-Delete (15.05.2026).
 *
 * Soft-Delete schiebt die Fragen in den Papierkorb (Backend `apiBulkLoescheFragen`).
 * Yellow-Warnung wenn `sichtbarCount < anzahl`.
 */
import BaseDialog from '../../ui/BaseDialog'
import Button from '../../ui/Button'

interface Props {
  anzahl: number
  sichtbarCount: number
  onLoeschen: () => void
  onAbbrechen: () => void
}

export default function BatchLoeschConfirmModal({
  anzahl,
  sichtbarCount,
  onLoeschen,
  onAbbrechen,
}: Props) {
  const nichtSichtbar = Math.max(0, anzahl - sichtbarCount)
  const titel = `${anzahl} ${anzahl === 1 ? 'Frage' : 'Fragen'} löschen?`

  return (
    <BaseDialog
      open
      onClose={onAbbrechen}
      title={titel}
      maxWidth="md"
      footer={
        <>
          <Button variant="ghost" onClick={onAbbrechen}>Abbrechen</Button>
          <Button variant="danger" onClick={onLoeschen}>Löschen</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <p>
          {anzahl} {anzahl === 1 ? 'Frage wird' : 'Fragen werden'} in den Papierkorb verschoben (Soft-Delete).
        </p>
        {nichtSichtbar > 0 && (
          <p className="text-yellow-600 dark:text-yellow-300">
            {nichtSichtbar} davon {nichtSichtbar === 1 ? 'ist' : 'sind'} im aktuellen Filter nicht sichtbar.
          </p>
        )}
      </div>
    </BaseDialog>
  )
}
