import { useState } from 'react'
import { useUebenUebungsStore, type GespeichertesErgebnis } from '../../store/ueben/uebungsStore'

/**
 * Übungs-Einsicht: Zeigt vergangene Session-Ergebnisse.
 * SuS können ihre abgeschlossenen Übungen nachschauen (Richtig/Falsch + Musterlösung).
 */
export default function UebungsEinsicht() {
  const historie = useUebenUebungsStore(s => s.historie)
  const [gewaehlteSession, setGewaehlteSession] = useState<GespeichertesErgebnis | null>(null)

  if (gewaehlteSession) {
    return <SessionDetail ergebnis={gewaehlteSession} onZurueck={() => setGewaehlteSession(null)} />
  }

  if (historie.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p className="text-3xl mb-3">📋</p>
        <p className="font-medium dark:text-white">Noch keine abgeschlossenen Übungen</p>
        <p className="text-sm mt-1">Abgeschlossene Übungen erscheinen hier automatisch.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Letzte Übungen ({historie.length})
      </h3>
      {historie.map(e => {
        const quoteGerundet = Math.round(e.quote)
        const datum = new Date(e.datum)
        const dauerMin = Math.round(e.dauer / 60000)
        return (
          <button
            key={e.sessionId}
            onClick={() => setGewaehlteSession(e)}
            className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">
                  {e.fach} — {e.thema}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {datum.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}{e.anzahlFragen} Fragen
                  {dauerMin > 0 && ` · ${dauerMin} Min.`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`text-sm font-semibold tabular-nums ${
                  quoteGerundet >= 80 ? 'text-green-600 dark:text-green-400' :
                  quoteGerundet >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {e.richtig}/{e.anzahlFragen}
                </span>
                <span className="text-xs text-slate-400 ml-1">({quoteGerundet}%)</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/** Detail-Ansicht einer einzelnen Session */
function SessionDetail({ ergebnis, onZurueck }: { ergebnis: GespeichertesErgebnis; onZurueck: () => void }) {
  const quoteGerundet = Math.round(ergebnis.quote)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onZurueck} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <span className="text-lg dark:text-white">&#8592;</span>
        </button>
        <div>
          <h3 className="font-semibold dark:text-white">{ergebnis.fach} — {ergebnis.thema}</h3>
          <p className="text-xs text-slate-400">
            {new Date(ergebnis.datum).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`ml-auto text-lg font-bold ${
          quoteGerundet >= 80 ? 'text-green-600' : quoteGerundet >= 50 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {quoteGerundet}%
        </span>
      </div>

      {/* Zusammenfassung */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{ergebnis.richtig}</p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70">Richtig</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{ergebnis.anzahlFragen - ergebnis.richtig}</p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70">Falsch</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
          <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{ergebnis.anzahlFragen}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      {/* Fragen-Details */}
      <div className="space-y-2">
        {ergebnis.details.map((d, i) => (
          <div key={d.frageId} className={`rounded-xl border p-4 ${
            d.korrekt
              ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
              : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
          }`}>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm shrink-0">{d.korrekt ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm dark:text-white">
                  <span className="text-slate-400 mr-1">{i + 1}.</span>
                  {d.frage}
                </p>
                {d.unsicher && <span className="text-xs text-amber-500 mt-1 inline-block">⚠ Als unsicher markiert</span>}
                {!d.korrekt && d.erklaerung && (
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                    <span className="font-medium">Musterlösung: </span>{d.erklaerung}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
