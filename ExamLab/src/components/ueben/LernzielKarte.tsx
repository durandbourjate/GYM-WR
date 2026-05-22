// ExamLab/src/components/ueben/LernzielKarte.tsx
import { ArrowLeft, Trophy, CircleCheck, Circle, Flag } from 'lucide-react'
import type { Lernziel } from '@shared/types/fragen-core'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'
import { lernzielStatus } from '../../utils/ueben/mastery'
import type { LernzielStatus } from '../../types/ueben/fortschritt'
import { bloomLabel } from '../../utils/fachUtils'
import { formatiereRelativeZeit } from '../../utils/ueben/relativeZeit'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  lernziel: Lernziel
  fortschritte: Record<string, FragenFortschritt>
  onUeben: (lernziel: Lernziel) => void
  onZurueck: () => void
}

// ─── Berechnungen (exportiert für Tests) ─────────────────────────────────────

export interface KartenDaten {
  total: number
  buckets: { gemeistert: number; gefestigt: number; ueben: number; neu: number }
  status: LernzielStatus
  nichtSicher: number
  letzterVersuch: string | null
}

export function berechneKartenDaten(
  lernziel: Lernziel,
  fortschritte: Record<string, FragenFortschritt>,
): KartenDaten {
  const ids = lernziel.fragenIds ?? []
  const buckets = { gemeistert: 0, gefestigt: 0, ueben: 0, neu: 0 }
  let letzterVersuch: string | null = null

  for (const id of ids) {
    const fp = fortschritte[id]
    // mastery defensiv normalisieren — Backend liefert type-fremde Werte (S118):
    // numerischer String (Test-Seeder) oder '' (leere Zelle) → sonst Rogue-Bucket.
    const roh = fp?.mastery
    const stufe = roh === 'gemeistert' || roh === 'gefestigt' || roh === 'ueben' ? roh : 'neu'
    buckets[stufe]++
    if (fp?.letzterVersuch && (!letzterVersuch || fp.letzterVersuch > letzterVersuch)) {
      letzterVersuch = fp.letzterVersuch
    }
  }

  return {
    total: ids.length,
    buckets,
    status: lernzielStatus(lernziel, fortschritte),
    nichtSicher: buckets.neu + buckets.ueben,
    letzterVersuch,
  }
}

// ─── Hilfsfunktionen ─────────────────────────────────────────────────────────

/** Status-Icon analog zu LernzieleAkkordeon — gleiche Farblogik */
function StatusIcon({ status }: { status: LernzielStatus }) {
  if (status === 'gemeistert') return <CircleCheck className="w-5 h-5 text-green-500" aria-label="gemeistert" />
  if (status === 'gefestigt') return <Circle className="w-5 h-5 fill-blue-500 text-blue-500" aria-label="gefestigt" />
  if (status === 'inArbeit') return <Circle className="w-5 h-5 fill-yellow-500 text-yellow-500" aria-label="in Arbeit" />
  return <Flag className="w-5 h-5 text-slate-400" aria-label="offen" />
}

/** Statuswort als lesbarer Text */
function statusLabel(status: LernzielStatus): string {
  switch (status) {
    case 'gemeistert': return 'Gemeistert'
    case 'gefestigt': return 'Gefestigt'
    case 'inArbeit': return 'In Arbeit'
    default: return 'Offen'
  }
}

// ─── Hauptkomponente ─────────────────────────────────────────────────────────

export function LernzielKarte({ lernziel, fortschritte, onUeben, onZurueck }: Props) {
  const { total, buckets, status, nichtSicher, letzterVersuch } = berechneKartenDaten(lernziel, fortschritte)

  const gemeistertPct = total > 0 ? (buckets.gemeistert / total) * 100 : 0
  const gefestigtPct  = total > 0 ? (buckets.gefestigt / total) * 100 : 0
  const uebenPct      = total > 0 ? (buckets.ueben / total) * 100 : 0

  const alleNeu = total > 0 && nichtSicher === total

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* Zurück-Affordanz */}
      <button
        onClick={onZurueck}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors self-start"
        aria-label="Zurück zur Lernziel-Liste"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück
      </button>

      {/* Breadcrumb */}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {lernziel.fach}
        <span className="mx-1 text-slate-300 dark:text-slate-600">›</span>
        {lernziel.thema}
        {lernziel.unterthema && (
          <>
            <span className="mx-1 text-slate-300 dark:text-slate-600">›</span>
            {lernziel.unterthema}
          </>
        )}
      </p>

      {/* Hauptkarte */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-4">

        {/* Lernziel-Text */}
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
          {lernziel.text}
        </p>

        {/* Bloom-Badge + Status-Zeile */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            {lernziel.bloom}{bloomLabel(lernziel.bloom) ? ` ${bloomLabel(lernziel.bloom)}` : ''}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <StatusIcon status={status} />
            <span className={
              status === 'gemeistert' ? 'text-green-600 dark:text-green-400 font-medium' :
              status === 'gefestigt' ? 'text-blue-600 dark:text-blue-400 font-medium' :
              status === 'inArbeit' ? 'text-yellow-600 dark:text-yellow-500 font-medium' :
              'text-slate-500 dark:text-slate-400'
            }>
              {statusLabel(status)}
            </span>
            {status === 'gemeistert' && (
              <Trophy className="w-4 h-4 text-amber-400" aria-label="Meilenstein: Lernziel gemeistert" />
            )}
          </span>
        </div>

        {/* Fortschrittsbalken + X / Y gemeistert */}
        {total > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
              {gemeistertPct > 0 && <div className="bg-green-500 h-2" style={{ width: `${gemeistertPct}%` }} />}
              {gefestigtPct > 0  && <div className="bg-blue-400 h-2"  style={{ width: `${gefestigtPct}%` }} />}
              {uebenPct > 0      && <div className="bg-yellow-400 h-2" style={{ width: `${uebenPct}%` }} />}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {buckets.gemeistert} / {total} gemeistert
            </p>
          </div>
        )}

        {/* 4-Stufen-Aufschlüsselung */}
        {total > 0 && (
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Gemeistert</span>
              <span className="ml-auto font-mono text-slate-700 dark:text-slate-200">{buckets.gemeistert}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Gefestigt</span>
              <span className="ml-auto font-mono text-slate-700 dark:text-slate-200">{buckets.gefestigt}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">In Arbeit</span>
              <span className="ml-auto font-mono text-slate-700 dark:text-slate-200">{buckets.ueben}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <span className="text-slate-600 dark:text-slate-300">Offen</span>
              <span className="ml-auto font-mono text-slate-700 dark:text-slate-200">{buckets.neu}</span>
            </div>
          </div>
        )}

        {/* Empfehlungs-Banner */}
        {total > 0 && (
          <div className={`rounded-lg px-3 py-2 text-xs ${
            alleNeu
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          }`}>
            {alleNeu
              ? `Leg los — ${total} Fragen warten`
              : `${nichtSicher} Fragen noch nicht sicher — dranbleiben.`
            }
          </div>
        )}

        {/* Zuletzt geübt */}
        {letzterVersuch && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Zuletzt geübt: {formatiereRelativeZeit(letzterVersuch)}
          </p>
        )}

        {/* Üben-Button + Hinweis bei keinen Fragen */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => onUeben(lernziel)}
            disabled={total === 0}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Üben
          </button>
          {total === 0 && (
            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              Noch keine Fragen mit diesem Lernziel verknüpft
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

export default LernzielKarte
