import { useState, useMemo } from 'react'
import type { TrackerDaten } from '../../types/tracker.ts'
import { berechneFehlendeSuS, berechneNotenStand } from '../../utils/trackerUtils.ts'
import FehlendeSuSPanel from './durchfuehrung/FehlendeSuSPanel.tsx'
import NotenStandPanel from './durchfuehrung/NotenStandPanel.tsx'

interface Props {
  trackerDaten: TrackerDaten
}

/**
 * Container-Komponente für den Prüfungstracker.
 * Zeigt zwei einklappbare Sektionen: Fehlende SuS und Noten-Stand.
 */
export default function TrackerSection({ trackerDaten }: Props) {
  const [sektionen, setSektionen] = useState<{ fehlende: boolean; noten: boolean }>({
    fehlende: true,
    noten: true,
  })

  const fehlendeSuS = useMemo(() => berechneFehlendeSuS(trackerDaten), [trackerDaten])
  const notenStand = useMemo(() => berechneNotenStand(trackerDaten), [trackerDaten])

  function toggleSektion(key: 'fehlende' | 'noten'): void {
    setSektionen((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Zusammenfassung oben
  const anzahlPruefungen = trackerDaten.pruefungen.length
  const anzahlBeendet = trackerDaten.pruefungen.filter((p) => p.beendetUm).length
  const anzahlKorrigiert = trackerDaten.pruefungen.filter((p) => p.korrekturStatus === 'fertig').length

  // Aggregierte Korrektur-Fortschrittszahlen (Fragen-Ebene)
  const korrekturFortschritt = useMemo(() => {
    let korrigiert = 0
    let gesamt = 0
    for (const p of trackerDaten.pruefungen) {
      if (p.beendetUm && p.korrigiertGesamt > 0) {
        korrigiert += p.korrigiertAnzahl
        gesamt += p.korrigiertGesamt
      }
    }
    return { korrigiert, gesamt }
  }, [trackerDaten])

  return (
    <div className="space-y-4">
      {/* Zusammenfassung */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-3">
          Tracker-Zusammenfassung
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <KennzahlBox label="Prüfungen" wert={anzahlPruefungen} />
          <KennzahlBox label="Beendet" wert={anzahlBeendet} />
          <KennzahlBox label="Korrigiert" wert={anzahlKorrigiert} />
          <KennzahlBox
            label="Korrektur-Fortschritt"
            wert={korrekturFortschritt.korrigiert}
            suffix={korrekturFortschritt.gesamt > 0 ? ` von ${korrekturFortschritt.gesamt}` : undefined}
            akzent={korrekturFortschritt.gesamt > 0 && korrekturFortschritt.korrigiert < korrekturFortschritt.gesamt}
          />
          <KennzahlBox label="Fehlende SuS" wert={fehlendeSuS.length} akzent={fehlendeSuS.length > 0} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Aktualisiert: {new Date(trackerDaten.aktualisiert).toLocaleString('de-CH')}
        </p>
      </div>

      {/* Sektion: Fehlende SuS */}
      <AkkordeonSektion
        titel="Fehlende SuS"
        badge={fehlendeSuS.length > 0 ? String(fehlendeSuS.length) : undefined}
        badgeFarbe={fehlendeSuS.length > 0 ? 'amber' : undefined}
        offen={sektionen.fehlende}
        onToggle={() => toggleSektion('fehlende')}
      >
        <FehlendeSuSPanel fehlende={fehlendeSuS} />
      </AkkordeonSektion>

      {/* Sektion: Noten-Stand */}
      <AkkordeonSektion
        titel="Noten-Stand pro Kurs"
        badge={notenStand.some((n) => n.status === 'critical') ? '!' : undefined}
        badgeFarbe={notenStand.some((n) => n.status === 'critical') ? 'red' : notenStand.some((n) => n.status === 'warning') ? 'amber' : undefined}
        offen={sektionen.noten}
        onToggle={() => toggleSektion('noten')}
      >
        <NotenStandPanel notenStand={notenStand} />
      </AkkordeonSektion>
    </div>
  )
}

/** Einzelne Kennzahl-Box in der Zusammenfassung */
function KennzahlBox({ label, wert, suffix, akzent }: { label: string; wert: number; suffix?: string; akzent?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${akzent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>
        {wert}{suffix && <span className="text-base font-normal text-slate-500 dark:text-slate-400">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

/** Einklappbare Sektion (Akkordeon) */
function AkkordeonSektion({
  titel,
  badge,
  badgeFarbe,
  offen,
  onToggle,
  children,
}: {
  titel: string
  badge?: string
  badgeFarbe?: 'amber' | 'red'
  offen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const badgeKlassen =
    badgeFarbe === 'red'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      : badgeFarbe === 'amber'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{titel}</h3>
          {badge && (
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${badgeKlassen}`}>
              {badge}
            </span>
          )}
        </div>
        <span className="text-slate-400 dark:text-slate-500 text-sm">
          {offen ? '−' : '+'}
        </span>
      </button>
      {offen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}
