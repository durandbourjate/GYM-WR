import { Fragment } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { KontenbestimmungFrage as KontenbestimmungFrageType, Kontenaufgabe } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import KontenSelect from '../shared/KontenSelect.tsx'

interface Props {
  frage: KontenbestimmungFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

interface AufgabeAntwort {
  antworten: { kontonummer?: string; kategorie?: string; seite?: string }[]
}

/** Liest bestehende Antworten aus dem Store */
function vonAntwort(
  antwort: { typ: 'kontenbestimmung'; aufgaben: Record<string, AufgabeAntwort> } | undefined,
  aufgaben: Kontenaufgabe[]
): Record<string, AufgabeAntwort> {
  if (antwort) return antwort.aufgaben

  // Leere Antworten initialisieren
  const leer: Record<string, AufgabeAntwort> = {}
  for (const a of (aufgaben ?? [])) {
    leer[a.id] = { antworten: (a.erwarteteAntworten ?? []).map(() => ({})) }
  }
  return leer
}

export default function KontenbestimmungFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <KontenbestimmungLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <KontenbestimmungAufgabe frage={frage} />
}

function KontenbestimmungAufgabe({ frage }: { frage: KontenbestimmungFrageType }) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const gespeicherteAntwort =
    antwort?.typ === 'kontenbestimmung' ? antwort : undefined

  const aufgabenAntworten = vonAntwort(gespeicherteAntwort, frage.aufgaben ?? [])

  function aktualisiere(neueAufgaben: Record<string, AufgabeAntwort>) {
    const a = { typ: 'kontenbestimmung' as const, aufgaben: neueAufgaben }
    if (speichereZwischenstand) {
      speichereZwischenstand(a)
    } else {
      onAntwort(a)
    }
  }

  function antwortPruefen() {
    onAntwort({ typ: 'kontenbestimmung' as const, aufgaben: aufgabenAntworten })
  }

  function aendereAntwort(
    aufgabeId: string,
    antwortIdx: number,
    feld: 'kontonummer' | 'kategorie' | 'seite',
    wert: string
  ) {
    const kopie = { ...aufgabenAntworten }
    const aufgabe = kopie[aufgabeId] ?? { antworten: [] }
    const antwortKopie = [...aufgabe.antworten]
    antwortKopie[antwortIdx] = { ...antwortKopie[antwortIdx], [feld]: wert }
    kopie[aufgabeId] = { antworten: antwortKopie }
    aktualisiere(kopie)
  }

  const readOnly = disabled
  const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
  const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
  const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'

  // Laufende Zeilennummer
  let zeileNr = 0

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
          Kontenbestimmung
        </span>
      </div>

      {/* Aufgabentext (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Tabelle */}
      <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
              <th className="px-3 py-2 text-left font-medium w-8">#</th>
              <th className="px-3 py-2 text-left font-medium">Geschaeftsfall</th>
              {zeigeKonto && <th className="px-3 py-2 text-left font-medium min-w-[180px]">Konto</th>}
              {zeigeKategorie && <th className="px-3 py-2 text-left font-medium w-32">Kategorie</th>}
              {zeigeSeite && <th className="px-3 py-2 text-left font-medium w-28">Buchungsseite</th>}
            </tr>
          </thead>
          <tbody>
            {(frage.aufgaben ?? []).map((aufgabe) => {
              const antwortDaten = aufgabenAntworten[aufgabe.id] ?? { antworten: [] }
              const zeilen = (aufgabe.erwarteteAntworten ?? []).length

              return (aufgabe.erwarteteAntworten ?? []).map((_, aIdx) => {
                zeileNr++
                const antwort = antwortDaten.antworten[aIdx] ?? {}

                return (
                  <tr key={`${aufgabe.id}-${aIdx}`} className="border-t border-slate-100 dark:border-slate-700">
                    {/* Nummer + Text nur bei erster Zeile der Aufgabe */}
                    {aIdx === 0 && (
                      <>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 align-top" rowSpan={zeilen}>
                          {zeileNr}
                        </td>
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-100 align-top" rowSpan={zeilen}>
                          {aufgabe.text}
                        </td>
                      </>
                    )}

                    {/* Konto */}
                    {zeigeKonto && (
                      <td className="px-3 py-1.5">
                        <KontenSelect
                          value={antwort.kontonummer ?? ''}
                          onChange={(nr) => aendereAntwort(aufgabe.id, aIdx, 'kontonummer', nr)}
                          config={frage.kontenauswahl}
                          placeholder="Konto..."
                          disabled={readOnly}
                        />
                      </td>
                    )}

                    {/* Kategorie */}
                    {zeigeKategorie && (
                      <td className="px-3 py-1.5">
                        <select
                          value={antwort.kategorie ?? ''}
                          onChange={(e) => aendereAntwort(aufgabe.id, aIdx, 'kategorie', e.target.value)}
                          disabled={readOnly}
                          className={`min-h-[44px] w-full rounded-md border px-2 py-2
                            text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${antwort.kategorie
                              ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                              : readOnly ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100' : 'border-violet-400 bg-white text-slate-900 dark:border-violet-500 dark:bg-slate-700 dark:text-slate-100'
                            }`}
                        >
                          <option value="">--</option>
                          <option value="aktiv">Aktiv</option>
                          <option value="passiv">Passiv</option>
                          <option value="aufwand">Aufwand</option>
                          <option value="ertrag">Ertrag</option>
                        </select>
                      </td>
                    )}

                    {/* Buchungsseite */}
                    {zeigeSeite && (
                      <td className="px-3 py-1.5">
                        <select
                          value={antwort.seite ?? ''}
                          onChange={(e) => aendereAntwort(aufgabe.id, aIdx, 'seite', e.target.value)}
                          disabled={readOnly}
                          className={`min-h-[44px] w-full rounded-md border px-2 py-2
                            text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
                            disabled:cursor-not-allowed disabled:opacity-50
                            ${antwort.seite
                              ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                              : readOnly ? 'border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100' : 'border-violet-400 bg-white text-slate-900 dark:border-violet-500 dark:bg-slate-700 dark:text-slate-100'
                            }`}
                        >
                          <option value="">--</option>
                          <option value="soll">Soll</option>
                          <option value="haben">Haben</option>
                        </select>
                      </td>
                    )}
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </div>

      {/* Prüfen-Button (nur Üben-Modus, wenn noch nicht beantwortet) */}
      {speichereZwischenstand && !disabled && (
        <button
          type="button"
          onClick={antwortPruefen}
          className="min-h-[48px] self-end px-6 py-2.5 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 font-medium text-sm hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          Antwort prüfen
        </button>
      )}

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}

const KATEGORIE_LABEL: Record<string, string> = {
  aktiv: 'Aktiv', passiv: 'Passiv', aufwand: 'Aufwand', ertrag: 'Ertrag',
}
const SEITE_LABEL: Record<string, string> = { soll: 'Soll', haben: 'Haben' }

function KontenbestimmungLoesung({ frage, antwort }: { frage: KontenbestimmungFrageType; antwort: Antwort | null }) {
  const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
  const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
  const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'

  const aufgabenAntworten = antwort?.typ === 'kontenbestimmung' ? antwort.aufgaben : {}

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
          Kontenbestimmung
        </span>
      </div>

      {/* Aufgabentext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Pro Aufgabe eine Karte */}
      <div className="flex flex-col gap-3">
        {(frage.aufgaben ?? []).map((aufgabe, aufgabeIndex) => {
          const eingabe = aufgabenAntworten[aufgabe.id]?.antworten ?? []
          const erwartet = aufgabe.erwarteteAntworten ?? []

          // Pro-Zeile-Check: position-based (einfacher als korrektur.ts, aber 99% der Fälle gleich)
          const zeilenStatus = erwartet.map((e, i) => {
            const ez = eingabe[i] ?? {}
            const kontoOk = !zeigeKonto || (ez.kontonummer ?? '') === (e.kontonummer ?? '')
            const kategorieOk = !zeigeKategorie || (ez.kategorie ?? '') === (e.kategorie ?? '')
            const seiteOk = !zeigeSeite || (ez.seite ?? '') === (e.seite ?? '')
            return { kontoOk, kategorieOk, seiteOk, istKorrekt: kontoOk && kategorieOk && seiteOk }
          })

          const aufgabeKorrekt = erwartet.length > 0 && zeilenStatus.every((z) => z.istKorrekt)
          const rahmen = aufgabeKorrekt
            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-600 bg-red-50 dark:bg-red-950/20'

          return (
            <div
              key={aufgabe.id}
              data-aufgabe-status={aufgabeKorrekt ? 'korrekt' : 'falsch'}
              className={`border-2 rounded-xl p-4 ${rahmen}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {aufgabeIndex + 1}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{aufgabe.text}</span>
                </div>
                <span className={`text-xs font-bold ${aufgabeKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {aufgabeKorrekt ? '\u2713 Korrekt' : '\u2717 Falsch'}
                </span>
              </div>

              {/* Tabelle: Ist vs. Soll pro Zeile */}
              <div className="ml-10 mt-2 overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400">
                      <th className="text-left pb-1 pr-3 font-medium">&nbsp;</th>
                      {zeigeKonto && <th className="text-left pb-1 pr-3 font-medium">Konto</th>}
                      {zeigeKategorie && <th className="text-left pb-1 pr-3 font-medium">Kategorie</th>}
                      {zeigeSeite && <th className="text-left pb-1 pr-3 font-medium">Seite</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {erwartet.map((e, i) => {
                      const ez = eingabe[i] ?? {}
                      const s = zeilenStatus[i]
                      return (
                        <Fragment key={i}>
                          <tr>
                            <td className="pr-3 text-slate-500 dark:text-slate-400 align-top py-0.5">Deine Antwort:</td>
                            {zeigeKonto && (
                              <td className={`pr-3 py-0.5 font-mono ${s.kontoOk ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {ez.kontonummer || <em className="text-slate-500 italic">leer</em>}
                              </td>
                            )}
                            {zeigeKategorie && (
                              <td className={`pr-3 py-0.5 ${s.kategorieOk ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {ez.kategorie ? (KATEGORIE_LABEL[ez.kategorie] ?? ez.kategorie) : <em className="text-slate-500 italic">leer</em>}
                              </td>
                            )}
                            {zeigeSeite && (
                              <td className={`pr-3 py-0.5 ${s.seiteOk ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {ez.seite ? (SEITE_LABEL[ez.seite] ?? ez.seite) : <em className="text-slate-500 italic">leer</em>}
                              </td>
                            )}
                          </tr>
                          {!s.istKorrekt && (
                            <tr className="border-b border-slate-200 dark:border-slate-600">
                              <td className="pr-3 text-slate-500 dark:text-slate-400 align-top py-0.5">Korrekt:</td>
                              {zeigeKonto && (
                                <td className="pr-3 py-0.5 font-mono font-semibold text-green-700 dark:text-green-400">
                                  {e.kontonummer || '\u2013'}
                                </td>
                              )}
                              {zeigeKategorie && (
                                <td className="pr-3 py-0.5 font-semibold text-green-700 dark:text-green-400">
                                  {e.kategorie ? (KATEGORIE_LABEL[e.kategorie] ?? e.kategorie) : '\u2013'}
                                </td>
                              )}
                              {zeigeSeite && (
                                <td className="pr-3 py-0.5 font-semibold text-green-700 dark:text-green-400">
                                  {e.seite ? (SEITE_LABEL[e.seite] ?? e.seite) : '\u2013'}
                                </td>
                              )}
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {aufgabe.erklaerung && (
                <div className="ml-10 mt-2 pl-2.5 border-l-2 border-slate-300 dark:border-slate-600 text-xs italic text-slate-600 dark:text-slate-400">
                  {'\u{1F4A1}'} {aufgabe.erklaerung}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
