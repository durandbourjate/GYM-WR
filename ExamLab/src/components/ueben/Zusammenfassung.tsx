import { useState } from 'react'
import { useUebenUebungsStore } from '../../store/ueben/uebungsStore'
import { berechneSterne, sterneText } from '../../utils/ueben/gamification'
import { useUebenKontext } from '../../hooks/ueben/useUebenKontext'
import { t } from '../../utils/ueben/anrede'

interface Props {
  onZurueck: () => void
  onNochmal: () => void
}

export default function Zusammenfassung({ onZurueck, onNochmal }: Props) {
  const { session, berechneErgebnis } = useUebenUebungsStore()
  const { anrede } = useUebenKontext()
  const [reviewOffen, setReviewOffen] = useState(false)

  // Fallback-UI wenn Session bereits aufgeräumt wurde (z.B. Race Condition)
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 text-center mb-4">
          <h2 className="text-xl font-bold mb-2 dark:text-white">Übung abgeschlossen</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Die Ergebnisse wurden gespeichert.</p>
          <button
            onClick={onZurueck}
            className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px] text-base"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    )
  }

  const ergebnis = berechneErgebnis()
  const quoteGerundet = Math.round(ergebnis.quote)
  const sterne = berechneSterne(quoteGerundet)
  const unsichereAnzahl = session.unsicher.size
  const uebersprungenAnzahl = session.uebersprungen.size

  const motivationsText = quoteGerundet >= 80
    ? 'Hervorragend!'
    : quoteGerundet >= 60
    ? 'Gut gemacht!'
    : quoteGerundet >= 40
    ? 'Weiter üben, du wirst besser!'
    : 'Nicht aufgeben, Übung macht den Meister!'

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Score-Karte */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-8 text-center mb-4">
        <div className="text-4xl mb-2 tracking-widest">
          {sterneText(sterne)}
        </div>

        <h2 className="text-2xl font-bold mb-1 dark:text-white">
          {ergebnis.richtig} von {ergebnis.anzahlFragen} richtig
        </h2>

        <p className="text-slate-500 dark:text-slate-400 mb-4">{motivationsText}</p>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all ${quoteGerundet >= 80 ? 'bg-green-500' : quoteGerundet >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${quoteGerundet}%` }}
          />
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          {session.modus === 'mix' ? '🔀 Gemischte Übung' : session.modus === 'repetition' ? '🔄 Repetition' : `${session.fach} — ${session.thema}`}
        </p>
        {session.quellen && session.quellen.length > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {session.quellen.map(q => q.thema).join(', ')}
          </p>
        )}

        {/* Statistik-Badges */}
        <div className="flex justify-center gap-3 mt-3">
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {ergebnis.richtig} richtig
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {ergebnis.falsch} falsch
          </span>
          {uebersprungenAnzahl > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              {uebersprungenAnzahl} übersprungen
            </span>
          )}
          {unsichereAnzahl > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {unsichereAnzahl} unsicher
            </span>
          )}
        </div>
      </div>

      {/* Review (aufklappbar) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm mb-4">
        <button
          onClick={() => setReviewOffen(!reviewOffen)}
          className="w-full p-4 flex items-center justify-between text-left min-h-[48px]"
        >
          <span className="font-medium dark:text-white">Alle Fragen &amp; Lösungen</span>
          <span className={`text-slate-400 transition-transform ${reviewOffen ? 'rotate-180' : ''}`}>&#9660;</span>
        </button>

        {reviewOffen && (
          <div className="px-4 pb-4 space-y-3">
            {ergebnis.details.map((d, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border-l-4 ${
                  d.uebersprungen
                    ? 'border-slate-300 bg-slate-50 dark:bg-slate-700/50'
                    : d.korrekt
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 flex-shrink-0 text-sm ${
                    d.uebersprungen ? 'text-slate-400' : d.korrekt ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {d.uebersprungen ? '—' : d.korrekt ? '\u2713' : '\u2717'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm dark:text-slate-300">{d.frage}</p>
                    {d.unsicher && (
                      <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        unsicher
                      </span>
                    )}
                    {d.erklaerung && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{d.erklaerung}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Aktionen */}
      <div className="space-y-2">
        <button
          onClick={onNochmal}
          className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-xl py-3 font-medium min-h-[48px] text-base hover:bg-slate-900 dark:hover:bg-slate-100"
        >
          {t('nochmal', anrede)}
        </button>
        <button
          onClick={onZurueck}
          className="w-full bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl py-3 font-medium min-h-[48px] text-base"
        >
          Zurück zum Dashboard
        </button>
      </div>
    </div>
  )
}
