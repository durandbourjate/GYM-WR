import { useState } from 'react'
import Tooltip from './ui/Tooltip.tsx'

/**
 * Hilfe-Button für SuS während der Prüfungsdurchführung.
 * Erklärt Navigation, Funktionen und Bedienung — ohne inhaltliche Hinweise.
 */
export default function SuSHilfeButton() {
  const [offen, setOffen] = useState(false)

  return (
    <>
      <Tooltip text="Hilfe zur Bedienung">
        <button
          onClick={() => setOffen(true)}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        </svg>
        </button>
      </Tooltip>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOffen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Hilfe zur Bedienung</h2>
              <button onClick={() => setOffen(false)} className="text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 text-xl cursor-pointer">&times;</button>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Navigation</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>← Zurück / Weiter →</strong> — Zwischen Fragen wechseln</li>
                  <li><strong>Tastatur:</strong> Pfeiltasten ← → oder Ctrl+Enter für Weiter</li>
                  <li><strong>Seitenleiste (links):</strong> Direkt zu einer Frage springen</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Fragen-Status</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li><span className="inline-block w-3 h-3 rounded border-2 border-violet-400 mr-1" /> <strong>Violett</strong> — Noch nicht beantwortet</li>
                  <li><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300 mr-1" /> <strong>Grün ✓</strong> — Beantwortet</li>
                  <li><span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-400 mr-1" /> <strong>Gelb ?</strong> — Als unsicher markiert</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Wichtige Buttons</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>? Unsicher</strong> — Frage zum Nachschauen markieren</li>
                  <li><strong>Material</strong> — Begleitmaterial (PDF, Texte) öffnen</li>
                  <li><strong>Abgeben</strong> — Prüfung einreichen (mit Bestätigung)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Auto-Save</h3>
                <p>Ihre Antworten werden <strong>automatisch gespeichert</strong>. Das grüne «Gespeichert ✓» zeigt, dass alles sicher ist. Bei Verbindungsproblemen werden Antworten lokal zwischengespeichert und bei Reconnect nachgesendet.</p>
              </section>

              <section>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Tipps</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sie können jederzeit zwischen Fragen wechseln</li>
                  <li>Beantworten Sie zuerst die einfachen Fragen</li>
                  <li>Markieren Sie unsichere Fragen mit ? und kommen Sie später zurück</li>
                  <li>Prüfen Sie vor dem Abgeben den Fortschrittsbalken</li>
                </ul>
              </section>
            </div>

            <button
              onClick={() => setOffen(false)}
              className="mt-5 w-full px-4 py-2 text-sm font-medium bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  )
}
