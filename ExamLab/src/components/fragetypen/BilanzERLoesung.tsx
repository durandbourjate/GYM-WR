import { Check, X } from 'lucide-react'
import type { BilanzERFrage as BilanzERFrageType } from '../../types/fragen-storage'
import type { Antwort as StoreAntwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { kontoLabel, findKonto } from '../../utils/kontenrahmen.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'

export function BilanzERLoesung({ frage, antwort }: { frage: BilanzERFrageType; antwort: StoreAntwort | null }) {
  const susBilanz = antwort?.typ === 'bilanzstruktur' ? antwort.bilanz : undefined
  const susER = antwort?.typ === 'bilanzstruktur' ? antwort.erfolgsrechnung : undefined

  const zeigtBilanz = frage.modus === 'bilanz' || frage.modus === 'beides'
  const zeigtER = frage.modus === 'erfolgsrechnung' || frage.modus === 'beides'

  const korrektBilanzsumme = frage.loesung?.bilanz?.bilanzsumme ?? 0
  const susBilanzsumme = susBilanz?.bilanzsummeLinks ?? susBilanz?.bilanzsummeRechts ?? 0
  const bilanzsummeKorrekt =
    !zeigtBilanz || Math.abs(susBilanzsumme - korrektBilanzsumme) < 0.01

  // ER-Check: Gewinn/Verlust-Vergleich mit letztem zwischentotal oder Summe ertrag-aufwand
  const korrektGewinn = frage.loesung?.erfolgsrechnung
    ? erwarteterGewinnVerlust(frage)
    : 0
  const susGewinn = susER?.gewinnVerlust ?? 0
  const gewinnKorrekt =
    !zeigtER || Math.abs(susGewinn - korrektGewinn) < 0.01

  const gesamtKorrekt = bilanzsummeKorrekt && gewinnKorrekt
  const rahmen = gesamtKorrekt
    ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
    : 'border-red-600 bg-red-50 dark:bg-red-950/20'

  const saldoMap: Record<string, number> = {}
  const erklaerungMap: Record<string, string | undefined> = {}
  const nameMap: Record<string, string | undefined> = {}
  for (const k of frage.kontenMitSaldi ?? []) {
    saldoMap[k.kontonummer] = k.saldo
    erklaerungMap[k.kontonummer] = k.erklaerung
    nameMap[k.kontonummer] = k.name
  }

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
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Gesamtkorrektur-Rahmen */}
      <div className={`border-2 rounded-xl p-4 ${rahmen}`}>
        {/* Bilanz-Teil */}
        {zeigtBilanz && frage.loesung?.bilanz && (
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-300">
              Korrekte Bilanz
            </div>
            <div className="grid grid-cols-2 gap-0 border border-slate-300 dark:border-slate-600 rounded overflow-hidden">
              {/* Header: Aktiva | Passiva */}
              <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-300 dark:border-slate-600">
                {frage.loesung.bilanz.aktivSeite.label}
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {frage.loesung.bilanz.passivSeite.label}
              </div>
              {/* Gruppen parallel */}
              <BilanzSeiteRender seite={frage.loesung.bilanz.aktivSeite} saldoMap={saldoMap} nameMap={nameMap} rechts={false} />
              <BilanzSeiteRender seite={frage.loesung.bilanz.passivSeite} saldoMap={saldoMap} nameMap={nameMap} rechts={true} />
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Bilanzsumme: <span className="font-semibold text-green-700 dark:text-green-400">
                  {korrektBilanzsumme.toFixed(2)}
                </span>
              </span>
              <span className={`text-xs font-semibold ${bilanzsummeKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                <span className="inline-flex items-center gap-1">Deine Bilanzsumme: {susBilanzsumme.toFixed(2)} {bilanzsummeKorrekt ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</span>
              </span>
            </div>
          </div>
        )}

        {/* ER-Teil */}
        {zeigtER && frage.loesung?.erfolgsrechnung && (
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-600 dark:text-slate-300">
              Korrekte Erfolgsrechnung
            </div>
            <div className="flex flex-col gap-2 border border-slate-300 dark:border-slate-600 rounded p-3">
              {frage.loesung.erfolgsrechnung.stufen.map((stufe, i) => (
                <div key={i}>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{stufe.label}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 mb-0.5">Aufwand:</div>
                      {(stufe.aufwandKonten ?? []).map((nr) => (
                        <KontoZeileAnzeige key={nr} nr={nr} saldoMap={saldoMap} nameMap={nameMap} negativ />
                      ))}
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 mb-0.5">Ertrag:</div>
                      {(stufe.ertragKonten ?? []).map((nr) => (
                        <KontoZeileAnzeige key={nr} nr={nr} saldoMap={saldoMap} nameMap={nameMap} />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-right text-slate-600 dark:text-slate-400 border-t pt-1 border-slate-200 dark:border-slate-700">
                    Zwischentotal: <span className="font-semibold text-green-700 dark:text-green-400">{stufe.zwischentotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Erwarteter Gewinn/Verlust: <span className="font-semibold text-green-700 dark:text-green-400">
                  {korrektGewinn.toFixed(2)}
                </span>
              </span>
              <span className={`text-xs font-semibold ${gewinnKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                <span className="inline-flex items-center gap-1">Dein Ergebnis: {susGewinn.toFixed(2)} {gewinnKorrekt ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Konto-Erklaerungen (aus kontenMitSaldi.erklaerung) */}
      {(frage.kontenMitSaldi ?? []).some((k) => !!k.erklaerung) && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Erlaeuterungen zu Konten</div>
          {(frage.kontenMitSaldi ?? []).map((k) => {
            if (!k.erklaerung) return null
            return (
              <div
                key={k.kontonummer}
                className="pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400"
              >
                {'\u{1F4A1}'} <strong>{k.kontonummer}{k.name ? ` ${k.name}` : ''}:</strong> {k.erklaerung}
              </div>
            )
          })}
        </div>
      )}

      {/* Musterloesung */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={gesamtKorrekt ? 'korrekt' : 'falsch'}>
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
    </div>
  )
}

/** Erwarteter Gewinn/Verlust: letzte Stufe zwischentotal ODER Ertrag-Summe - Aufwand-Summe */
function erwarteterGewinnVerlust(frage: BilanzERFrageType): number {
  const er = frage.loesung?.erfolgsrechnung
  if (!er || er.stufen.length === 0) return 0
  // Wenn letzte Stufe mehrstufig angelegt ist, ihr zwischentotal ist das Endergebnis
  const letzte = er.stufen[er.stufen.length - 1]
  return letzte.zwischentotal
}

function BilanzSeiteRender({
  seite, saldoMap, nameMap, rechts,
}: {
  seite: { label: string; gruppen: { label: string; konten: string[] }[] }
  saldoMap: Record<string, number>
  nameMap: Record<string, string | undefined>
  rechts: boolean
}) {
  return (
    <div className={`${rechts ? '' : 'border-r border-slate-300 dark:border-slate-600'} px-3 py-2 text-xs`}>
      {seite.gruppen.map((g, gi) => (
        <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
          <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{g.label}</div>
          {g.konten.map((nr) => (
            <KontoZeileAnzeige key={nr} nr={nr} saldoMap={saldoMap} nameMap={nameMap} />
          ))}
        </div>
      ))}
    </div>
  )
}

function KontoZeileAnzeige({
  nr, saldoMap, nameMap, negativ = false,
}: {
  nr: string
  saldoMap: Record<string, number>
  nameMap: Record<string, string | undefined>
  negativ?: boolean
}) {
  const saldo = saldoMap[nr]
  const name = nameMap[nr] ?? kontoLabel(nr) ?? findKonto(nr)?.name
  const betrag = saldo != null ? (negativ ? -saldo : saldo).toFixed(2) : '-'
  return (
    <div className="flex justify-between text-slate-700 dark:text-slate-300 leading-tight">
      <span className="font-mono">
        {nr}{name ? ` ${name}` : ''}
      </span>
      <span className="font-mono">{betrag}</span>
    </div>
  )
}
