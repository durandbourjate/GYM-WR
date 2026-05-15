/**
 * Cluster D Phase 3a — Banner für den Batch-Edit-Modus.
 *
 * Wird oben im SharedFragenEditor gerendert wenn `batchMode` gesetzt ist.
 * Zeigt Anzahl betroffener Fragen + optionalen „nur N sichtbar"-Hinweis,
 * wenn die Selektion über den aktuellen Filter hinausreicht.
 */

interface Props {
  /** Gesamtzahl der selektierten Fragen (kann > sichtbareCount sein). */
  count: number
  /** Anzahl der Fragen die aktuell durch Filter sichtbar sind. */
  sichtbareCount: number
}

export default function BatchEditorBanner({ count, sichtbareCount }: Props) {
  const zeigeSichtbarHinweis = sichtbareCount < count
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg p-3 mb-4 text-violet-900 dark:text-violet-100"
    >
      <strong>Batch-Bearbeitung von {count} Fragen</strong>
      {zeigeSichtbarHinweis && (
        <span className="text-xs text-violet-700 dark:text-violet-300 ml-2">
          (nur {sichtbareCount} im aktuellen Filter sichtbar)
        </span>
      )}
      <p className="text-xs mt-1">
        Geänderte Felder werden bei allen {count} Fragen angewendet.
        Felder ohne <span className="text-violet-600 dark:text-violet-300">violetten Rand</span> sind in Batch nicht änderbar.
      </p>
    </div>
  )
}
