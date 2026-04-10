import { fachbereichFarbe, typLabel } from '../../../../utils/fachUtils.ts'
import { loesungsquoteBgFarbe } from '../../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary, FrageBase } from '../../../../types/fragen.ts'
import type { EffektivesRecht } from '../../../../types/auth.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import type { Gruppierung } from './gruppenHelfer.ts'
import PoolBadges from './PoolBadges.tsx'

interface Props {
  frage: Frage | FrageSummary
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  onDuplizieren?: () => void
  zeigeGruppierung: Gruppierung
  performance?: FragenPerformance
}

function rechteBadge(recht?: EffektivesRecht): { label: string; farbe: string } | null {
  if (!recht || recht === 'inhaber') return null
  if (recht === 'bearbeiter') return { label: 'B', farbe: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' }
  return { label: 'L', farbe: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' }
}

/** Kompakte Zeile für grosse Listen */
export default function KompaktZeile({ frage, istInPruefung, onToggle, onEdit, onDuplizieren, zeigeGruppierung, performance }: Props) {
  return (
    <div
      onClick={onEdit}
      className={`flex items-center gap-2 px-5 py-1.5 text-sm border-b transition-colors cursor-pointer group
        ${istInPruefung
          ? 'border-l-4 border-l-green-500 border-b-slate-100 dark:border-b-slate-700/50 bg-green-50/50 dark:bg-green-900/10'
          : 'border-l-4 border-l-transparent border-b-slate-100 dark:border-b-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
        }`}
    >
      {/* +/- Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={`w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center shrink-0 transition-colors cursor-pointer
          ${istInPruefung
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
      >
        {istInPruefung ? '\u2013' : '+'}
      </button>

      {/* Fachbereich-Badge (nur wenn nicht nach Fachbereich gruppiert) */}
      {zeigeGruppierung !== 'fachbereich' && (
        <span className={`px-1 py-0.5 text-[10px] rounded shrink-0 ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
      )}
      <PoolBadges frage={frage} />
      {(() => {
        const badge = rechteBadge((frage as FrageBase)._recht)
        return badge ? (
          <span className={`text-[10px] px-1 py-0.5 rounded shrink-0 ${badge.farbe}`} title={badge.label === 'B' ? 'Bearbeiter' : 'Betrachter'}>
            {badge.label}
          </span>
        ) : null
      })()}

      {/* Typ */}
      <span className="text-[10px] px-1 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded shrink-0">
        {typLabel(frage.typ)}
      </span>

      {/* Bloom + Punkte */}
      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
        {frage.bloom} · {frage.punkte}P.
      </span>

      {/* Lernziele */}
      {(frage.lernzielIds?.length ?? 0) > 0 && (
        <span className="text-[10px] px-1 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded shrink-0" title={`${frage.lernzielIds!.length} Lernziel${frage.lernzielIds!.length !== 1 ? 'e' : ''}`}>
          🏁{frage.lernzielIds!.length}
        </span>
      )}

      {/* Thema */}
      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
        {frage.thema}{frage.unterthema ? ` \u203A ${frage.unterthema}` : ''}
      </span>

      {onDuplizieren && (
        <button
          onClick={(e) => { e.stopPropagation(); onDuplizieren() }}
          className="p-0.5 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
      )}
      {performance && (
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${loesungsquoteBgFarbe(performance.durchschnittLoesungsquote)}`}
          title={`\u00D8 ${performance.durchschnittLoesungsquote}% L\u00F6sungsquote (${performance.anzahlVerwendungen} Pr\u00FCfungen)`}
        />
      )}
      {istInPruefung && (
        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded shrink-0 font-medium">
          ✓ In Prüfung
        </span>
      )}
    </div>
  )
}
