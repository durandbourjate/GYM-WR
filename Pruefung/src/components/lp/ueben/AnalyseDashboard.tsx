/**
 * Analyse-Dashboard für den Üben-Modus.
 * Zeigt Statistiken über Übungsfortschritt der SuS.
 * Grundstruktur — Details werden iterativ ergänzt.
 */
export default function AnalyseDashboard() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Analyse</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Übungsfortschritt und Lernstatistiken der Lernenden.
          </p>
        </div>

        {/* Übersichts-Karten */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">—</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aktive Lernende</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">—</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Übungssessions (letzte 7 Tage)</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="text-2xl font-bold text-slate-800 dark:text-white">—</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Durchschnittliche Mastery-Quote</div>
          </div>
        </div>

        {/* Platzhalter-Bereiche */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Fortschritt nach Fachbereich</h3>
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            Wird geladen sobald SuS-Daten verfügbar sind.
            <br />
            <span className="text-xs mt-2 inline-block">
              Zeigt: Mastery-Verteilung (neu/üben/gefestigt/gemeistert) pro Fach und Thema
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Schwierigste Fragen</h3>
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            Zeigt Fragen mit der niedrigsten Lösungsquote über alle SuS.
            <br />
            <span className="text-xs mt-2 inline-block">
              Basis: Übungs-Fortschrittsdaten der aktiven Gruppe
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Individuelle Stärken & Schwächen</h3>
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            Detailansicht pro SuS: Welche Themen beherrscht, wo Lücken bestehen.
            <br />
            <span className="text-xs mt-2 inline-block">
              Basis: Mastery-Status pro SuS und Thema aus dem Fortschritt-Store
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
