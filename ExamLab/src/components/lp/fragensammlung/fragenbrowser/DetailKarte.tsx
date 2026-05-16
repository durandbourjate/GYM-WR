import { Check, Copy, Target, Trash2 } from 'lucide-react'
import { fachbereichFarbe, typLabel } from '../../../../utils/fachUtils.ts'
import { loesungsquoteFarbe } from '../../../../utils/trackerUtils.ts'
import type { Frage, FrageSummary, FrageBase } from '../../../../types/fragen-storage'
import type { EffektivesRecht } from '../../../../types/auth.ts'
import type { FragenPerformance } from '../../../../types/tracker.ts'
import PoolBadges from './PoolBadges.tsx'
import { useShallow } from 'zustand/react/shallow'
import { useTagsStore } from '../../../../store/tagsStore'
import { useFragenSelectionStore } from '../../../../store/fragenSelectionStore.ts'
import { tagNamenFromStore } from '../../../../utils/frageTagNamen'
import { FragetypIcon, type Fragetyp } from '../../../ui/icons/FragetypIcon'

interface Props {
  frage: Frage | FrageSummary
  istInPruefung: boolean
  onToggle: () => void
  onEdit: () => void
  onLoeschen: () => void
  onDuplizieren?: () => void
  performance?: FragenPerformance
  /** IDs der aktuell gefilterten/sichtbaren Fragen — für Shift-Click Range-Toggle.
   *  Cluster D M-11 Spawn-Task (16.05.2026): UX-Konsistenz mit KompaktZeile. */
  sichtbareIds: string[]
}

function rechteBadge(recht?: EffektivesRecht): { label: string; farbe: string } | null {
  if (!recht || recht === 'inhaber') return null
  if (recht === 'bearbeiter') return { label: 'Bearbeiter', farbe: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' }
  return { label: 'Betrachter', farbe: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' }
}

/** Detaillierte Karte mit Fragetext-Vorschau */
export default function DetailKarte({ frage, istInPruefung, onToggle, onEdit, onLoeschen, onDuplizieren, performance, sichtbareIds }: Props) {
  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
  // Cluster H Phase 2: Tag-Namen via tagsStore-Hook (subscribed → Re-Render bei Tag-Rename).
  // useShallow ist Pflicht: Selector returnt neues Array → ohne shallow-Equality infinite re-render (React #185).
  const tagNamen = useTagsStore(useShallow(s => tagNamenFromStore(frage, s)))
  // Cluster D M-11: Checkbox-Konsistenz mit KompaktZeile.
  const selektiert = useFragenSelectionStore((s) => s.selektiert.has(frage.id))
  const toggleSelektion = useFragenSelectionStore((s) => s.toggle)

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
        {/* Selektions-Checkbox (Cluster D M-11 Spawn-Task) \u2014 analog KompaktZeile.
            stopPropagation gegen Edit-Trigger; Shift-Click via nativeEvent f\u00fcr Range-Toggle. */}
        <input
          type="checkbox"
          checked={selektiert}
          onClick={(e) => { e.stopPropagation() }}
          onChange={(e) => {
            const nativeEv = e.nativeEvent as MouseEvent
            const shift = typeof nativeEv.shiftKey === 'boolean' ? nativeEv.shiftKey : false
            toggleSelektion(frage.id, { shift, sichtbareIds })
          }}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500 shrink-0 cursor-pointer mt-2"
          aria-label={`Frage \u201e${frage.thema || frage.id}" ausw\u00e4hlen`}
        />
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
            {/* Typ (Icon + Label) — Cluster G Phase 5. Cast: FrageSummary.typ ist `string`, FragetypIcon hat graceful Fallback (return null). */}
            <FragetypIcon typ={frage.typ as Fragetyp} className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden />
            <span className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {typLabel(frage.typ)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {frage.bloom} · {frage.punkte}P.
            </span>
            {istInPruefung && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded font-medium inline-flex items-center gap-1">
                <Check className="w-3 h-3" aria-hidden="true" /> In Prüfung
              </span>
            )}
            {(frage.lernzielIds?.length ?? 0) > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded inline-flex items-center gap-1" title={`${frage.lernzielIds!.length} Lernziel${frage.lernzielIds!.length !== 1 ? 'e' : ''} zugeordnet`}>
                <Target className="w-3 h-3" aria-hidden="true" /> {frage.lernzielIds!.length}
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
            {tagNamen.slice(0, 3).map((tagName) => (
              <span
                key={tagName}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
              >
                {tagName}
              </span>
            ))}
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
        {/* Aktions-Buttons (immer sichtbar — touch-tauglich, grösser+kontrastreicher) */}
        <div className="flex flex-col gap-1 shrink-0">
          {onDuplizieren && (
            <button
              onClick={(e) => { e.stopPropagation(); onDuplizieren() }}
              title="Frage duplizieren"
              aria-label="Frage duplizieren"
              className="p-2 rounded-md text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:text-violet-300 dark:hover:bg-violet-900/30 transition-colors cursor-pointer"
            >
              <Copy className="w-[18px] h-[18px]" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onLoeschen() }}
            title="Frage löschen"
            aria-label="Frage löschen"
            className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-300 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  )
}
