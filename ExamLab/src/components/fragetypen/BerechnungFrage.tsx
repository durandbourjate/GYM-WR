import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { BerechnungFrage as BerechnungFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { MusterloesungsBlock } from '@shared/ui/MusterloesungsBlock'

interface Props {
  frage: BerechnungFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function BerechnungFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <BerechnungLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <BerechnungAufgabe frage={frage} />
}

function BerechnungAufgabe({ frage }: { frage: BerechnungFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const ergebnisse: Record<string, string> =
    antwort?.typ === 'berechnung' ? antwort.ergebnisse : {}
  const rechenweg: string =
    antwort?.typ === 'berechnung' ? antwort.rechenweg ?? '' : ''

  function handleErgebnis(ergebnisId: string, wert: string) {
    if (disabled) return
    const neueErgebnisse = { ...ergebnisse, [ergebnisId]: wert }
    onAntwort({ typ: 'berechnung', ergebnisse: neueErgebnisse, rechenweg })
  }

  function handleRechenweg(text: string) {
    if (disabled) return
    onAntwort({ typ: 'berechnung', ergebnisse, rechenweg: text })
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
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          Berechnung
        </span>
        {frage.hilfsmittel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Hilfsmittel: {frage.hilfsmittel}
          </span>
        )}
      </div>

      {/* Fragetext (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Ergebnis-Eingaben */}
      <div className="flex flex-col gap-3">
        {(frage.ergebnisse ?? []).map((erg) => (
          <div key={erg.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              {erg.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={ergebnisse[erg.id] ?? ''}
                onChange={(e) => handleErgebnis(erg.id, e.target.value)}
                disabled={disabled}
                placeholder="Ergebnis eingeben..."
                className={`flex-1 px-3 py-2 text-base bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 text-slate-800 dark:text-slate-100 font-mono disabled:opacity-60 ${!disabled && !(ergebnisse[erg.id]) ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'}`}
              />
              {erg.einheit && (
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  {erg.einheit}
                </span>
              )}
            </div>
            {erg.toleranz > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Toleranz: ±{erg.toleranz} {erg.einheit ?? ''}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Rechenweg */}
      {frage.rechenwegErforderlich && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Rechenweg / Lösungsweg
          </label>
          <textarea
            value={rechenweg}
            onChange={(e) => handleRechenweg(e.target.value)}
            disabled={disabled}
            rows={6}
            placeholder="Zeigen Sie Ihren Rechenweg hier..."
            className={`w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 text-slate-800 dark:text-slate-100 resize-y disabled:opacity-60 ${!disabled && !rechenweg ? 'border-violet-400 dark:border-violet-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Beschreiben Sie Ihren Lösungsweg — auch Teilresultate zählen.
          </p>
        </div>
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

function istErgebnisKorrekt(soll: number, toleranz: number, eingabe: string): boolean {
  const trimmed = eingabe.trim()
  if (!trimmed) return false
  const ist = parseFloat(trimmed.replace(',', '.'))
  if (isNaN(ist)) return false
  return Math.abs(soll - ist) <= toleranz
}

function BerechnungLoesung({ frage, antwort }: { frage: BerechnungFrageType; antwort: Antwort | null }) {
  const ergebnisse: Record<string, string> =
    antwort?.typ === 'berechnung' ? antwort.ergebnisse : {}
  const rechenweg: string =
    antwort?.typ === 'berechnung' ? antwort.rechenweg ?? '' : ''

  const alleErgebnisse = frage.ergebnisse ?? []
  const alleKorrekt = alleErgebnisse.every((erg) =>
    istErgebnisKorrekt(erg.korrekt, erg.toleranz, ergebnisse[erg.id] ?? '')
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
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
          Berechnung
        </span>
      </div>

      {/* Fragetext */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Ergebnisse — Lösungs-Ansicht */}
      <div className="flex flex-col gap-3">
        {alleErgebnisse.map((erg) => {
          const eingabe = (ergebnisse[erg.id] ?? '').trim()
          const istKorrekt = istErgebnisKorrekt(erg.korrekt, erg.toleranz, eingabe)
          const rahmen = istKorrekt
            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-600 bg-red-50 dark:bg-red-950/20'
          return (
            <div key={erg.id} className={`border-2 rounded-xl p-4 ${rahmen}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{erg.label}</span>
                <span className={`text-xs font-bold ${istKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {istKorrekt ? '\u2713 Korrekt' : '\u2717 Falsch'}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col gap-0.5 leading-tight">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Deine Antwort:</span>
                  <span className={`text-base font-mono ${istKorrekt ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {eingabe ? (
                      <>{eingabe}{erg.einheit ? ` ${erg.einheit}` : ''}</>
                    ) : (
                      <em className="text-slate-500 italic">leer gelassen</em>
                    )}
                  </span>
                </div>
                {!istKorrekt && (
                  <div className="flex flex-col gap-0.5 leading-tight pl-3 border-l-2 border-slate-300 dark:border-slate-600">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Korrekt:</span>
                    <span className="text-base font-mono text-green-700 dark:text-green-400 font-semibold">
                      {erg.korrekt}{erg.einheit ? ` ${erg.einheit}` : ''}
                    </span>
                  </div>
                )}
              </div>
              {erg.toleranz > 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Toleranz: ±{erg.toleranz} {erg.einheit ?? ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Rechenweg (falls vorhanden) */}
      {rechenweg && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-500 dark:text-slate-400">
            Dein Rechenweg
          </div>
          <pre className="whitespace-pre-wrap text-sm font-mono text-slate-700 dark:text-slate-300">{rechenweg}</pre>
        </div>
      )}

      {/* Musterloesung */}
      {frage.musterlosung && (
        <MusterloesungsBlock variant={alleKorrekt ? 'korrekt' : 'falsch'}>
          <p>{frage.musterlosung}</p>
        </MusterloesungsBlock>
      )}
    </div>
  )
}
