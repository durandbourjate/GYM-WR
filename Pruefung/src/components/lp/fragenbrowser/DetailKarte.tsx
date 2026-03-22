import { fachbereichFarbe, typLabel } from '../../../utils/fachbereich.ts'
import { loesungsquoteFarbe } from '../../../utils/trackerUtils.ts'
import type { Frage } from '../../../types/fragen.ts'
import type { FragenPerformance } from '../../../types/tracker.ts'
import PoolBadges from './PoolBadges.tsx'

interface Props {
  frage: Frage
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  onLoeschen: () => void
  performance?: FragenPerformance
}

/** Detaillierte Karte mit Fragetext-Vorschau */
export default function DetailKarte({ frage, istInPruefung, onToggle, onEdit, onLoeschen, performance }: Props) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''

  return (
    <div
      onClick={onEdit}
      className={`p-3 rounded-lg border transition-colors cursor-pointer group
        ${istInPruefung
          ? 'border-l-4 border-l-green-500 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* +/- Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer
            ${istInPruefung
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          title={istInPruefung ? 'Aus Prüfung entfernen' : 'Zur Prüfung hinzufügen'}
        >
          {istInPruefung ? '\u2013' : '+'}
        </button>
        <div className="flex-1 min-w-0">
          {/* ID + Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {frage.id}
            </span>
            <span className={`px-1.5 py-0.5 text-xs rounded ${fachbereichFarbe(frage.fachbereich)}`}>
              {frage.fachbereich}
            </span>
            <PoolBadges frage={frage} />
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {typLabel(frage.typ)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {frage.bloom} · {frage.punkte}P.
            </span>
            {istInPruefung && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-medium">
                ✓ In Prüfung
              </span>
            )}
          </div>

          {/* Fragetext (gekürzt) */}
          {fragetext && (
            <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">
              {fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 200)}
            </p>
          )}

          {/* Thema + Tags + Sharing */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {frage.thema}{frage.unterthema ? ` \u203A ${frage.unterthema}` : ''}
            </span>
            {frage.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
            {frage.geteilt === 'schule' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                Geteilt{frage.geteiltVon ? ` \u00B7 ${frage.geteiltVon}` : ''}
              </span>
            )}
          </div>

          {/* Fragen-Statistiken */}
          {performance && (
            <div className="mt-1">
              <span className={`text-xs ${loesungsquoteFarbe(performance.durchschnittLoesungsquote)}`}>
                {'\u{1F4CA}'} {performance.durchschnittLoesungsquote}% · {performance.anzahlVerwendungen}\u00D7 verwendet · {performance.gesamtN} SuS
              </span>
            </div>
          )}
        </div>
        {/* Löschen-Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onLoeschen() }}
          className="self-start p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
          title="Frage löschen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  )
}
