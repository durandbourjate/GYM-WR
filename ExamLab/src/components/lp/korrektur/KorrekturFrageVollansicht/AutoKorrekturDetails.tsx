import type { KorrekturErgebnis } from '../../../../utils/autoKorrektur'

/** Auto-Korrektur-Details */
export default function AutoKorrekturDetails({ ergebnis, frageTyp }: { ergebnis: KorrekturErgebnis; frageTyp: string }) {
  // MC und R/F werden bereits inline angezeigt → Details nur für andere Typen
  if (frageTyp === 'mc' || frageTyp === 'richtigfalsch') return null

  return (
    <div className="mt-2 space-y-0.5">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Auto-Korrektur: {ergebnis.erreichtePunkte}/{ergebnis.maxPunkte} Pkt.
      </span>
      {ergebnis.details.map((detail, i) => (
        <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
          detail.korrekt
            ? 'bg-green-50 dark:bg-green-900/15 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-300'
        }`}>
          <span className="shrink-0">{detail.korrekt ? '✓' : '✗'}</span>
          <span className="flex-1 truncate">{detail.bezeichnung}</span>
          <span className="tabular-nums shrink-0">{detail.erreicht}/{detail.max}</span>
          {detail.kommentar && (
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={detail.kommentar}>
              {detail.kommentar}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
