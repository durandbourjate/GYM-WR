import { useState } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import type {
  AufgabengruppeFrage as AufgabengruppeFrageType,
  Frage,
  MCFrage as MCFrageType,
  FreitextFrage as FreitextFrageType,
  LueckentextFrage as LueckentextFrageType,
  ZuordnungFrage as ZuordnungFrageType,
  RichtigFalschFrage as RichtigFalschFrageType,
  BerechnungFrage as BerechnungFrageType,
  BuchungssatzFrage as BuchungssatzFrageType,
  TKontoFrage as TKontoFrageType,
  KontenbestimmungFrage as KontenbestimmungFrageType,
  BilanzERFrage as BilanzERFrageType,
} from '../../types/fragen.ts'
import MCFrage from './MCFrage.tsx'
import FreitextFrage from './FreitextFrage.tsx'
import LueckentextFrage from './LueckentextFrage.tsx'
import ZuordnungFrage from './ZuordnungFrage.tsx'
import RichtigFalschFrage from './RichtigFalschFrage.tsx'
import BerechnungFrage from './BerechnungFrage.tsx'
import BuchungssatzFrage from './BuchungssatzFrage.tsx'
import TKontoFrageComponent from './TKontoFrage.tsx'
import KontenbestimmungFrageComponent from './KontenbestimmungFrage.tsx'
import BilanzERFrageComponent from './BilanzERFrage.tsx'
import MediaAnhang from '../MediaAnhang.tsx'
import FrageAnhaenge from '../FrageAnhaenge.tsx'

interface Props {
  frage: AufgabengruppeFrageType
}

const BUCHSTABEN = 'abcdefghijklmnopqrstuvwxyz'

export default function AufgabengruppeFrage({ frage }: Props) {
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const [kontextOffen, setKontextOffen] = useState(true)

  const teilaufgaben = frage.teilaufgabenIds
    .map((id) => alleFragen.find((f) => f.id === id))
    .filter((f): f is Frage => f != null)

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
          {teilaufgaben.length} Teilaufgaben
        </span>
      </div>

      {/* Kontext (einklappbar, startet offen) */}
      <div className="bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setKontextOffen(!kontextOffen)}
          className="w-full flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        >
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Kontext / Ausgangslage
          </span>
          <span className={`text-xs text-slate-400 dark:text-slate-500 transition-transform duration-200 ${kontextOffen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {kontextOffen && (
          <div className="px-4 pb-4">
            <div className="text-base leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
              {frage.kontext}
            </div>
            {frage.kontextAnhaenge && frage.kontextAnhaenge.length > 0 && (
              <div className="mt-3 space-y-2">
                {frage.kontextAnhaenge.map((a) => (
                  <MediaAnhang
                    key={a.id}
                    anhang={a}
                    bildSz={a.bildGroesse === 'klein' ? 'w200' : a.bildGroesse === 'gross' ? 'w800' : 'w400'}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teilaufgaben */}
      <div className="space-y-6">
        {teilaufgaben.map((tf, i) => {
          // Rekursionsschutz: keine verschachtelten Aufgabengruppen
          if (tf.typ === 'aufgabengruppe') {
            return (
              <div key={tf.id} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                Verschachtelte Aufgabengruppen sind nicht erlaubt.
              </div>
            )
          }

          return (
            <div key={tf.id} className="border-l-2 border-slate-300 dark:border-slate-600 pl-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {BUCHSTABEN[i]})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({tf.punkte} {tf.punkte === 1 ? 'Punkt' : 'Punkte'})
                </span>
              </div>
              {renderTeilaufgabe(tf)}
              <FrageAnhaenge anhaenge={tf.anhaenge ?? []} />
            </div>
          )
        })}
      </div>

      {/* Hinweis bei abgegebener Prüfung */}
      {abgegeben && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
          Prüfung abgegeben — Antworten können nicht mehr geändert werden.
        </p>
      )}
    </div>
  )
}

/** Rendert eine einzelne Teilaufgabe mit dem passenden Fragetyp-Komponenten */
function renderTeilaufgabe(frage: Frage) {
  switch (frage.typ) {
    case 'mc':
      return <MCFrage frage={frage as MCFrageType} />
    case 'freitext':
      return <FreitextFrage frage={frage as FreitextFrageType} />
    case 'lueckentext':
      return <LueckentextFrage frage={frage as LueckentextFrageType} />
    case 'zuordnung':
      return <ZuordnungFrage frage={frage as ZuordnungFrageType} />
    case 'richtigfalsch':
      return <RichtigFalschFrage frage={frage as RichtigFalschFrageType} />
    case 'berechnung':
      return <BerechnungFrage frage={frage as BerechnungFrageType} />
    case 'buchungssatz':
      return <BuchungssatzFrage frage={frage as BuchungssatzFrageType} />
    case 'tkonto':
      return <TKontoFrageComponent frage={frage as TKontoFrageType} />
    case 'kontenbestimmung':
      return <KontenbestimmungFrageComponent frage={frage as KontenbestimmungFrageType} />
    case 'bilanzstruktur':
      return <BilanzERFrageComponent frage={frage as BilanzERFrageType} />
    default:
      return (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-center text-sm">
          Fragetyp wird nicht unterstützt.
        </div>
      )
  }
}
