// ExamLab/src/components/fragetypen/tkonto/TKontoLoesungAnsicht.tsx
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { Antwort } from '../../../types/antworten.ts'
import { renderMarkdown } from '../../../utils/markdown.ts'
import { fachbereichFarbe } from '../../../utils/fachUtils.ts'
import { kontoLabel } from '../../../utils/kontenrahmen.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'
import { bewerteKonto } from './tkontoUtils'
import type { EintragStatus } from './tkontoUtils'

interface Props {
  frage: TKontoFrageType
  antwort: Antwort | null
}

export default function TKontoLoesungAnsicht({ frage, antwort }: Props) {
  const susKonten = antwort?.typ === 'tkonto' ? antwort.konten : []
  const konten = frage.konten ?? []
  // Vorab-Gesamtstatus für MusterloesungsBlock-Variante
  const alleKontenKorrekt = konten.every((konto, kontoIdx) => {
    const sus = susKonten.find((s) => s.id === konto.id) ?? susKonten[kontoIdx]
    return bewerteKonto(konto, sus).kontoKorrekt
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          T-Konto
        </span>
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Pro Konto eine T-Konto-Karte */}
      <div className="flex flex-col gap-4">
        {konten.map((konto, kontoIdx) => {
          const sus = susKonten.find((s) => s.id === konto.id) ?? susKonten[kontoIdx]
          const { linksStatus, rechtsStatus, saldoBalanciert, kontoKorrekt } = bewerteKonto(konto, sus)
          const rahmen = kontoKorrekt
            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-600 bg-red-50 dark:bg-red-950/20'

          return (
            <div key={konto.id} className={`border-2 rounded-xl p-4 ${rahmen}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Konto {konto.kontonummer}
                  {kontoLabel(konto.kontonummer) && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                      — {kontoLabel(konto.kontonummer)}
                    </span>
                  )}
                </span>
                <span className={`text-xs font-bold ${kontoKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {kontoKorrekt ? '✓ Korrekt' : '✗ Falsch'}
                </span>
              </div>

              {/* T-Konto-Tabelle: Soll links, Haben rechts */}
              <div className="grid grid-cols-2 gap-0 border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-300 dark:border-slate-600">
                  Soll
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Haben
                </div>
                {Array.from({ length: Math.max(linksStatus.length, rechtsStatus.length, 1) }).map((_, i) => {
                  const l = linksStatus[i]
                  const r = rechtsStatus[i]
                  return (
                    <div key={i} className="contents">
                      <div className="px-3 py-1 text-xs border-r border-t border-slate-200 dark:border-slate-700">
                        {l ? <EintragBadge status={l} /> : <span className="text-slate-400">&nbsp;</span>}
                      </div>
                      <div className="px-3 py-1 text-xs border-t border-slate-200 dark:border-slate-700">
                        {r ? <EintragBadge status={r} /> : <span className="text-slate-400">&nbsp;</span>}
                      </div>
                    </div>
                  )
                })}
                {sus?.saldo && (
                  <div className="contents">
                    <div className={`px-3 py-1 text-xs border-r border-t-2 border-slate-400 dark:border-slate-500 ${saldoBalanciert ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-semibold`}>
                      Saldo: {(sus.saldo.betragLinks ?? 0).toFixed(2)}
                    </div>
                    <div className={`px-3 py-1 text-xs border-t-2 border-slate-400 dark:border-slate-500 ${saldoBalanciert ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-semibold`}>
                      Saldo: {(sus.saldo.betragRechts ?? 0).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Erwarteter Saldo */}
              {konto.saldo && (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Erwarteter Saldo: <span className="font-semibold text-green-700 dark:text-green-400">
                    {Number(konto.saldo.betrag ?? 0).toFixed(2)} ({konto.saldo.seite === 'soll' ? 'links' : 'rechts'})
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Musterloesung */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={alleKontenKorrekt ? 'korrekt' : 'falsch'} label="Musterloesung">
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
    </div>
  )
}

function EintragBadge({ status }: { status: EintragStatus }) {
  if (status.art === 'korrekt') {
    return (
      <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-400">
        <span className="font-mono">{status.gegenkonto}</span>
        <span className="font-mono">{Number(status.betrag ?? 0).toFixed(2)}</span>
        <span aria-hidden>{'✓'}</span>
      </span>
    )
  }
  if (status.art === 'fehlend') {
    return (
      <span className="inline-flex items-center gap-2 text-red-700 dark:text-red-400">
        <span className="font-mono font-semibold">{status.gegenkonto}</span>
        <span className="font-mono font-semibold">{Number(status.betrag ?? 0).toFixed(2)}</span>
        <em className="text-xs not-italic text-red-700 dark:text-red-400">(fehlt)</em>
      </span>
    )
  }
  // 'falsch' = überflüssig
  return (
    <span className="inline-flex items-center gap-2 text-red-700 dark:text-red-400 line-through">
      <span className="font-mono">{status.gegenkonto}</span>
      <span className="font-mono">{Number(status.betrag ?? 0).toFixed(2)}</span>
      <em className="text-xs not-italic no-underline">({status.hinweis})</em>
    </span>
  )
}
