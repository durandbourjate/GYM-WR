import { fachbereichFarbe, typLabel } from '../../../../utils/fachbereich.ts'
import { loesungsquoteBgFarbe } from '../../../../utils/trackerUtils.ts'
import type { Frage } from '../../../../types/fragen.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import type { Gruppierung } from './gruppenHelfer.ts'
import PoolBadges from './PoolBadges.tsx'

interface Props {
  frage: Frage
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  zeigeGruppierung: Gruppierung
  performance?: FragenPerformance
}

/** Kompakte Zeile für grosse Listen */
export default function KompaktZeile({ frage, istInPruefung, onToggle, onEdit, zeigeGruppierung, performance }: Props) {
  return (
    <div
      onClick={onEdit}
      className={`flex items-center gap-2 px-5 py-1.5 text-sm border-b transition-colors cursor-pointer
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
        title={istInPruefung ? 'Aus Prüfung entfernen' : 'Zur Prüfung hinzufügen'}
      >
        {istInPruefung ? '\u2013' : '+'}
      </button>

      {/* ID */}
      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-28 truncate shrink-0">
        {frage.id}
      </span>

      {/* Fachbereich-Badge (nur wenn nicht nach Fachbereich gruppiert) */}
      {zeigeGruppierung !== 'fachbereich' && (
        <span className={`px-1 py-0.5 text-[10px] rounded shrink-0 ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
      )}
      <PoolBadges frage={frage} />

      {/* Typ */}
      <span className="text-[10px] px-1 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded shrink-0">
        {typLabel(frage.typ)}
      </span>

      {/* Bloom + Punkte */}
      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
        {frage.bloom} · {frage.punkte}P.
      </span>

      {/* Thema */}
      <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
        {frage.thema}{frage.unterthema ? ` \u203A ${frage.unterthema}` : ''}
      </span>

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
