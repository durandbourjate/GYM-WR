import { useMemo } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { ZuordnungFrage as ZuordnungFrageType } from '../../types/fragen.ts'
import type { Antwort } from '../../types/antworten.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { istEingabeLeer } from '../../utils/ueben/leereEingabenDetektor.ts'

interface Props {
  frage: ZuordnungFrageType
  modus?: 'aufgabe' | 'loesung'
  antwort?: Antwort | null
}

export default function ZuordnungFrage({ frage, modus = 'aufgabe', antwort: antwortProp }: Props) {
  if (modus === 'loesung') {
    return <ZuordnungLoesung frage={frage} antwort={antwortProp ?? null} />
  }
  return <ZuordnungAufgabe frage={frage} />
}

function ZuordnungAufgabe({ frage }: { frage: ZuordnungFrageType }) {
  const { antwort, onAntwort, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)

  const zuordnungen: Record<string, string> =
    antwort?.typ === 'zuordnung' ? antwort.zuordnungen : {}

  const violettOutline = !feedbackSichtbar && istEingabeLeer(frage, antwort, 'gesamt')
    ? 'border-violet-400 dark:border-violet-500 ring-1 ring-violet-300 dark:ring-violet-600/40'
    : 'border-transparent'

  // Rechte Seite: eindeutige Kategorien ermitteln, dann optional mischen.
  // Dedup ist wichtig für N:1-Zuordnungen (z.B. 6 Behauptungen → 2 Kategorien),
  // sonst erscheint "Absolute Armut" mehrfach im Dropdown.
  // Sortiert stabil (frage.id-seed), damit die Reihenfolge KEIN Hinweis auf die
  // Lösung gibt (sonst wäre Reihenfolge = Reihenfolge der paare-Liste).
  const rechteOptionen = useMemo(() => {
    const alleRechts = (frage.paare ?? []).map((p) => p.rechts)
    const eindeutig = Array.from(new Set(alleRechts))
    const shuffled = [...eindeutig]
    // Seed-basierter Fisher-Yates — immer mischen, nicht nur bei zufallsreihenfolge,
    // damit die natürliche Reihenfolge der paare keine Hinweise gibt.
    const seedBasis = frage.zufallsreihenfolge !== false ? frage.id : `${frage.id}-stable`
    let seed = seedBasis.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 16807 + 0) % 2147483647
      const j = seed % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [frage.id, frage.paare, frage.zufallsreihenfolge])

  // Linke Seite ebenfalls mischen wenn aktiviert
  const linkeElemente = useMemo(() => {
    const elemente = (frage.paare ?? []).map((p) => p.links)
    if (frage.zufallsreihenfolge) {
      const shuffled = [...elemente]
      // Anderer Seed damit Links und Rechts nicht gleich gemischt werden
      let seed = frage.id.split('').reduce((acc, c) => acc + c.charCodeAt(0) * 2, 0) + 42
      for (let i = shuffled.length - 1; i > 0; i--) {
        seed = (seed * 16807 + 0) % 2147483647
        const j = seed % (i + 1)
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
    return elemente
  }, [frage.id, frage.paare, frage.zufallsreihenfolge])

  function handleAuswahl(linksWert: string, rechtsWert: string) {
    if (disabled) return

    const neueZuordnungen = { ...zuordnungen }
    if (rechtsWert === '') {
      delete neueZuordnungen[linksWert]
    } else {
      neueZuordnungen[linksWert] = rechtsWert
    }
    onAntwort({ typ: 'zuordnung', zuordnungen: neueZuordnungen })
  }

  const alleZugeordnet = linkeElemente.every((l) => !!zuordnungen[l])

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
          {(frage.paare ?? []).length} Zuordnungen
        </span>
      </div>

      {/* Fragetext (sticky: bleibt beim Scrollen sichtbar) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Zuordnungs-Tabelle */}
      <div data-testid="zuordnung-input-area" className={`flex flex-col gap-3 rounded-xl border ${violettOutline} p-1`}>
        {linkeElemente.map((links, index) => {
          const aktuelleZuordnung = zuordnungen[links] ?? ''

          return (
            <div
              key={links}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${aktuelleZuordnung
                  ? 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  : !disabled
                    ? 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-800'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }
                ${disabled ? 'opacity-75' : ''}
              `}
            >
              {/* Nummer */}
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                {index + 1}
              </span>

              {/* Linker Begriff */}
              <span className="flex-1 text-slate-800 dark:text-slate-100 font-medium">
                {links}
              </span>

              {/* Pfeil */}
              <span className="text-slate-400 dark:text-slate-500 text-lg flex-shrink-0">
                →
              </span>

              {/* Dropdown für rechte Seite */}
              <select
                value={aktuelleZuordnung}
                onChange={(e) => handleAuswahl(links, e.target.value)}
                disabled={disabled}
                className={`flex-1 max-w-[50%] px-3 py-2 rounded-lg border text-sm transition-colors
                  ${aktuelleZuordnung
                    ? 'border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-900/15 text-slate-800 dark:text-slate-100'
                    : 'border-violet-400 dark:border-violet-500 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }
                  ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <option value="">— auswählen —</option>
                {rechteOptionen.map((rechts) => (
                  // Alle Optionen immer wählbar (N:1-Zuordnungen möglich).
                  // Kein Vergeben-Marker — würde Lösung verraten.
                  <option key={rechts} value={rechts}>
                    {rechts}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* Fortschrittsanzeige */}
      <div className="flex justify-end text-xs text-slate-500 dark:text-slate-400">
        <span className={alleZugeordnet ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
          {Object.keys(zuordnungen).length} von {linkeElemente.length} zugeordnet
          {alleZugeordnet && ' \u2713'}
        </span>
      </div>

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

function ZuordnungLoesung({ frage, antwort }: { frage: ZuordnungFrageType; antwort: Antwort | null }) {
  const zuordnungen: Record<string, string> =
    antwort?.typ === 'zuordnung' ? antwort.zuordnungen : {}

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
          {(frage.paare ?? []).length} Zuordnungen
        </span>
      </div>

      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.fragetext) }}
      />

      {/* Zuordnungs-Lösungs-Ansicht */}
      <div className="flex flex-col gap-3">
        {(frage.paare ?? []).map((paar, index) => {
          const susRechts = zuordnungen[paar.links]
          const hatGeantwortet = typeof susRechts === 'string' && susRechts !== ''
          const istKorrekt = hatGeantwortet && susRechts === paar.rechts

          const rahmenClass = istKorrekt
            ? 'border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-600 bg-red-50 dark:bg-red-950/20'

          return (
            <div
              key={paar.links}
              data-testid="zuordnung-zeile"
              className={`flex flex-col gap-2 p-4 rounded-xl border-2 ${rahmenClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {index + 1}
                </span>
                <span className="flex-1 text-slate-800 dark:text-slate-100 font-medium">
                  {paar.links}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-lg flex-shrink-0">→</span>
                <div className="flex-1 max-w-[50%] flex flex-col gap-0.5 leading-tight">
                  {istKorrekt ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-400">
                      <span aria-hidden>{'\u2713'}</span>
                      {paar.rechts}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">
                        Korrekt: {paar.rechts}
                      </span>
                      <span className="text-sm text-red-700 dark:text-red-400">
                        {hatGeantwortet ? (
                          <>Deine Antwort: {susRechts}</>
                        ) : (
                          <em className="text-slate-500 italic">Nicht zugeordnet</em>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {paar.erklaerung && (
                <div className="pl-10 pr-2 border-l-2 border-slate-300 dark:border-slate-600 ml-4 text-xs italic text-slate-600 dark:text-slate-400">
                  {'\u{1F4A1}'} {paar.erklaerung}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
