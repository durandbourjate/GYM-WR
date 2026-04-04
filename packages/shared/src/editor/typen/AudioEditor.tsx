interface Props {
  maxDauerSekunden: number | undefined
  setMaxDauerSekunden: (v: number | undefined) => void
}

/**
 * LP-Editor fuer Audio-Aufnahme-Fragen.
 * Einzige Einstellung: optionale maximale Aufnahmedauer.
 */
export default function AudioEditor({ maxDauerSekunden, setMaxDauerSekunden }: Props) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Audio-Aufnahme
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        SuS nehmen eine Audio-Antwort auf (Browser-Mikrofon). Korrektur erfolgt manuell.
      </p>
      <p className="text-xs text-amber-600 dark:text-amber-400">
        Hinweis: Auf Mac/iPhone kann Chrome einen Dialog anzeigen, der die Aufnahme ans iPhone weiterleitet (Continuity Camera). Dies ist ein Browser-Feature und kein Fehler.
      </p>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 dark:text-slate-300">
          Max. Dauer (Sekunden):
        </label>
        <input
          type="number"
          min={10}
          max={600}
          step={10}
          value={maxDauerSekunden ?? ''}
          onChange={(e) => {
            const val = e.target.value.trim()
            setMaxDauerSekunden(val ? parseInt(val, 10) : undefined)
          }}
          placeholder="unbegrenzt"
          className="w-28 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white"
        />
      </div>

      {maxDauerSekunden !== undefined && maxDauerSekunden > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Aufnahme stoppt automatisch nach {Math.floor(maxDauerSekunden / 60)}:{(maxDauerSekunden % 60).toString().padStart(2, '0')} Min.
        </p>
      )}
    </div>
  )
}
