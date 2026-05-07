import { useState } from 'react'
import { useFavoritenStore } from '../../../store/favoritenStore'
import { formatDatum } from '../../../utils/zeit'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { bestimmePruefungsStatus, statusLabel, statusFarbe, korrekturLabel } from '../../../utils/trackerUtils'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { TrackerPruefungSummary } from '../../../types/tracker'

/** Prüfungskarte — wiederverwendbar für Zuletzt-Sektion und Hauptliste */
export function PruefungsKarte({ config: c, onBearbeiten, onDuplizieren, trackerSummary }: {
  config: PruefungsConfig
  onBearbeiten: (c: PruefungsConfig) => void
  onDuplizieren: (c: PruefungsConfig) => void
  trackerSummary?: TrackerPruefungSummary
}) {
  const toggleFavorit = useFavoritenStore(s => s.toggleFavorit)
  const istFavoritFn = useFavoritenStore(s => s.istFavorit)
  const istFav = istFavoritFn(c.id)
  const [linkKopiert, setLinkKopiert] = useState(false)
  const kopiereLink = async () => {
    const screen = c.typ === 'formativ' ? 'uebung' : 'pruefung'
    const url = `${window.location.origin}${window.location.pathname}#/${screen}/${c.id}`
    try { await navigator.clipboard.writeText(url) } catch {
      const input = document.createElement('input')
      input.value = url; document.body.appendChild(input); input.select()
      document.execCommand('copy'); document.body.removeChild(input)
    }
    setLinkKopiert(true); setTimeout(() => setLinkKopiert(false), 2000)
  }
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <button
          onClick={() => toggleFavorit({ typ: c.typ === 'formativ' ? 'uebung' : 'pruefung', ziel: c.id, label: c.titel })}
          className="mt-0.5 text-lg leading-none cursor-pointer hover:scale-110 transition-transform shrink-0"
          title={istFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
        >
          {istFav ? '⭐' : '☆'}
        </button>
        <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{c.titel}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
          <span>{c.klasse}</span>
          <span>·</span>
          <span>{formatDatum(c.datum)}</span>
          <span>·</span>
          <span>{c.dauerMinuten} Min.</span>
          <span>·</span>
          <span>{c.gesamtpunkte} P.</span>
          <span>·</span>
          <span>{c.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)} Fragen</span>
          {c.fachbereiche.map((fb) => {
            const farbe = getFachFarbe(fb, {})
            return (
              <span
                key={fb}
                className="px-1.5 py-0.5 text-xs rounded"
                style={{ backgroundColor: farbe + '20', color: farbe }}
              >
                {fb}
              </span>
            )
          })}
        </div>
        {trackerSummary && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <TrackerBadge summary={trackerSummary} />
          </div>
        )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`${window.location.pathname}?id=${c.id}`}
          className={c.beendetUm
            ? 'px-4 py-2 text-xs font-medium text-white dark:text-slate-800 bg-slate-800 dark:bg-slate-200 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors'
            : 'px-4 py-2 text-xs font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 transition-colors'}
        >
          {c.beendetUm ? 'Auswerten' : c.typ === 'formativ' ? 'Übung starten' : 'Prüfung starten'}
        </a>
        <button
          onClick={kopiereLink}
          className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
          title="SuS-Link kopieren"
        >
          {linkKopiert ? '✓' : '🔗'}
        </button>
        <button
          onClick={() => onDuplizieren(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Duplizieren
        </button>
        <button
          onClick={() => onBearbeiten(c)}
          className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          Bearbeiten
        </button>
      </div>
    </div>
  )
}

/** Tracker-Badges für eine Prüfungskarte: Teilnahme, Korrektur, Durchschnitt, Status */
function TrackerBadge({ summary: s }: { summary: TrackerPruefungSummary }) {
  const status = bestimmePruefungsStatus(s)
  return (
    <>
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <span className={`w-2 h-2 rounded-full ${statusFarbe(status)}`} />
        {statusLabel(status)}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {s.eingereicht}/{s.teilnehmerGesamt} eingereicht
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {korrekturLabel(s)}
      </span>
      {s.durchschnittNote !== null && (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          &#216; {s.durchschnittNote.toFixed(1)}
        </span>
      )}
    </>
  )
}
