import { usePruefungStore } from '../store/pruefungStore.ts'
import { fachbereichFarbe } from '../utils/fachUtils.ts'
import { berechneAbschnittFortschritt } from '../utils/abschnitte.ts'
import { istVollstaendigBeantwortet } from '../utils/antwortStatus.ts'

export default function FragenUebersicht() {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const antworten = usePruefungStore((s) => s.antworten)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const navigiere = usePruefungStore((s) => s.navigiere)
  const setPhase = usePruefungStore((s) => s.setPhase)

  if (!config) return null

  const markiert = fragen.filter((f) => !!markierungen[f.id]).length
  const { abschnitte: fortschrittAbschnitte, gesamtBeantwortet, gesamtFragen } =
    berechneAbschnittFortschritt(config, alleFragen, antworten)
  const gesamtProzent = gesamtFragen > 0 ? (gesamtBeantwortet / gesamtFragen) * 100 : 0

  let globalIdx = 0

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Übersicht
      </h2>

      {/* Gesamt-Fortschritt */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-slate-600 dark:text-slate-300">
            {gesamtBeantwortet} von {gesamtFragen} Fragen beantwortet
            {markiert > 0 && <span className="text-amber-600 dark:text-amber-400"> · {markiert} unsicher</span>}
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{Math.round(gesamtProzent)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              gesamtProzent === 100
                ? 'bg-green-500 dark:bg-green-400'
                : 'bg-slate-500 dark:bg-slate-400'
            }`}
            style={{ width: `${gesamtProzent}%` }}
          />
        </div>
      </div>

      {/* Abschnitte */}
      {config.abschnitte.map((abschnitt, abschnittIdx) => {
        const startIdx = globalIdx
        const fortschritt = fortschrittAbschnitte[abschnittIdx]
        const abschnittProzent = fortschritt.gesamt > 0 ? (fortschritt.beantwortet / fortschritt.gesamt) * 100 : 0

        return (
          <div key={abschnitt.titel} className="mb-6">
            {/* Abschnitt-Header mit Fortschritt */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {abschnitt.titel}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {fortschritt.beantwortet}/{fortschritt.gesamt} · {fortschritt.punkte} P.
              </span>
            </div>

            {/* Mini-Fortschrittsbalken pro Abschnitt */}
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  abschnittProzent === 100
                    ? 'bg-green-500 dark:bg-green-400'
                    : abschnittProzent > 0
                      ? 'bg-slate-400 dark:bg-slate-500'
                      : ''
                }`}
                style={{ width: `${abschnittProzent}%` }}
              />
            </div>

            {/* Beschreibung */}
            {abschnitt.beschreibung && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 italic">
                {abschnitt.beschreibung}
              </p>
            )}

            {/* Fragen-Liste */}
            <div className="flex flex-col gap-2">
              {abschnitt.fragenIds.map((frageId, i) => {
                const idx = startIdx + i
                if (i === abschnitt.fragenIds.length - 1) globalIdx = idx + 1
                const frage = fragen[idx]
                if (!frage) return null
                const istBeantwortet = frage ? istVollstaendigBeantwortet(frage, antworten[frageId], alleFragen, antworten) : !!antworten[frageId]
                const istMarkiert = !!markierungen[frageId]
                const antwort = antworten[frageId]

                // Detail-Info je nach Fragetyp
                let detailInfo = ''
                if (antwort?.typ === 'freitext' && antwort.text) {
                  const plainText = antwort.text.replace(/<[^>]*>/g, '').trim()
                  const woerter = plainText ? plainText.split(/\s+/).length : 0
                  detailInfo = `${woerter} Wörter`
                } else if (antwort?.typ === 'zuordnung') {
                  const zugeordnet = Object.keys(antwort.zuordnungen).length
                  detailInfo = `${zugeordnet} zugeordnet`
                } else if (antwort?.typ === 'mc') {
                  detailInfo = `${antwort.gewaehlteOptionen.length} gewählt`
                } else if (antwort?.typ === 'lueckentext') {
                  const ausgefuellt = Object.values(antwort.eintraege).filter((v) => v.trim()).length
                  detailInfo = `${ausgefuellt} ausgefüllt`
                }

                // Status-Icon und -Farbe
                let statusIcon: string
                let statusColor: string
                if (istMarkiert) {
                  statusIcon = '?'
                  statusColor = 'text-amber-700 dark:text-amber-400'
                } else if (istBeantwortet) {
                  statusIcon = '\u2713'
                  statusColor = 'text-slate-500 dark:text-slate-400'
                } else {
                  // Offen: violett hervorgehoben
                  statusIcon = '!'
                  statusColor = 'text-violet-700 dark:text-violet-400'
                }

                return (
                  <button
                    key={frageId}
                    onClick={() => { navigiere(idx); setPhase('pruefung') }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 ${statusColor}`}>
                      {statusIcon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {idx + 1}.
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${fachbereichFarbe(frage.fachbereich)}`}>
                          {frage.fachbereich}
                        </span>
                        <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
                          {frage.thema}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
                      <div>{frage.punkte} P.</div>
                      {detailInfo && <div className="text-slate-400 dark:text-slate-500">{detailInfo}</div>}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <button
        onClick={() => setPhase('pruefung')}
        className="mt-4 px-5 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors font-medium cursor-pointer"
      >
        Zurück zur Prüfung
      </button>
    </div>
  )
}
