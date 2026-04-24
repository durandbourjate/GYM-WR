import type { Problemmeldung } from '../../../types/problemmeldung'
import { priorisiereDeepLink } from './filterLogik'

interface Props {
  meldung: Problemmeldung
  toggleErledigt: (id: string, neuerWert: boolean) => Promise<void> | void
  onOeffne: (ziel: ReturnType<typeof priorisiereDeepLink>) => void
  istAdmin: boolean
}

function formatRelativ(isoStr: string): string {
  if (!isoStr) return ''
  const ts = new Date(isoStr).getTime()
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'eben'
  if (min < 60) return `vor ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `vor ${d} d`
  return new Date(isoStr).toLocaleDateString('de-CH')
}

export default function ProblemmeldungZeile({ meldung, toggleErledigt, onOeffne, istAdmin }: Props) {
  const ziel = priorisiereDeepLink(meldung)
  const isLegacy = !meldung.id
  const kannToggle = !isLegacy && (istAdmin || meldung.recht === 'inhaber' || meldung.recht === 'bearbeiter')

  const typIcon = meldung.typ === 'problem' ? '🔴' : '💡'

  return (
    <div className={`border-l-4 ${meldung.erledigt ? 'border-slate-300 opacity-60' : meldung.typ === 'problem' ? 'border-red-400' : 'border-amber-400'} bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 mb-2`}>
      <div className="flex items-start gap-3">
        <label className={`flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5 ${kannToggle ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
          <input
            type="checkbox"
            checked={meldung.erledigt}
            disabled={!kannToggle}
            onChange={e => toggleErledigt(meldung.id, e.target.checked)}
            title={isLegacy ? 'Legacy-Eintrag, Backfill nötig' : !kannToggle ? 'Keine Berechtigung' : 'Als erledigt markieren'}
            className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="text-[10px] leading-none text-slate-500 dark:text-slate-400 select-none">erledigt</span>
        </label>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{typIcon} {meldung.category}</span>
            <span>·</span>
            <span>{formatRelativ(meldung.zeitstempel)}</span>
            <span>·</span>
            <span>Rolle: {meldung.rolle || '—'}</span>
            {meldung.modus && <><span>·</span><span>Modus: {meldung.modus}</span></>}
            {meldung.frageTyp && <><span>·</span><span>Fragetyp: {meldung.frageTyp}</span></>}
            {!meldung.inhaberAktiv && meldung.inhaberEmail && (
              <><span>·</span><span className="text-amber-600 dark:text-amber-400">ehemaliger Inhaber</span></>
            )}
            {meldung.istPoolFrage && <><span>·</span><span>Pool-Frage</span></>}
          </div>
          {meldung.comment && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">{meldung.comment}</p>
          )}
          {meldung.frageText && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic truncate">„{meldung.frageText}"</p>
          )}
        </div>
        {ziel && (
          <button
            onClick={() => onOeffne(ziel)}
            className="flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            → Öffnen
          </button>
        )}
      </div>
    </div>
  )
}
