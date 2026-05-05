import { fachbereichFarbe, typLabel } from '../../../../utils/fachUtils.ts'
import { loesungsquoteFarbe } from '../../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary, FrageBase } from '../../../../types/fragen-storage'
import type { EffektivesRecht } from '../../../../types/auth.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import PoolBadges from './PoolBadges.tsx'

interface Props {
  frage: Frage | FrageSummary
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  onLoeschen: () => void
  onDuplizieren?: () => void
  performance?: FragenPerformance
}

function rechteBadge(recht?: EffektivesRecht): { label: string; farbe: string } | null {
  if (!recht || recht === 'inhaber') return null
  if (recht === 'bearbeiter') return { label: 'Bearbeiter', farbe: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' }
  return { label: 'Betrachter', farbe: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' }
}

/** Detaillierte Karte mit Fragetext-Vorschau */
export default function DetailKarte({ frage, istInPruefung, onToggle, onEdit, onLoeschen, onDuplizieren, performance }: Props) {
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
        >
          {istInPruefung ? '\u2013' : '+'}
        </button>
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            {(frage.lernzielIds?.length ?? 0) > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded" title={`${frage.lernzielIds!.length} Lernziel${frage.lernzielIds!.length !== 1 ? 'e' : ''} zugeordnet`}>
                🏁 {frage.lernzielIds!.length}
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
            {frage.tags.slice(0, 3).map((tag) => {
              const tagName = typeof tag === 'string' ? tag : tag.name
              return (
                <span
                  key={tagName}
                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
                >
                  {tagName}
                </span>
              )
            })}
            {frage.geteilt === 'schule' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                Geteilt{frage.geteiltVon ? ` \u00B7 ${frage.geteiltVon}` : ''}
              </span>
            )}
            {(() => {
              const badge = rechteBadge((frage as FrageBase)._recht)
              return badge ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.farbe}`}>
                  {badge.label}
                </span>
              ) : null
            })()}
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
        {/* Aktions-Buttons */}
        <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplizieren && (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplizieren() }}
              className="p-1.5 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onLoeschen() }}
            className="p-1.5 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
