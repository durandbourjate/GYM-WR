import { useState, useEffect } from 'react'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Frage } from '../types/fragen.ts'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { istImSEB } from '../services/sebService.ts'
import { formatDatum } from '../utils/zeit.ts'
import ThemeToggle from './ThemeToggle.tsx'

interface Props {
  config: PruefungsConfig
  fragen: Frage[]
  wiederhergestellt: boolean
}

export default function Startbildschirm({ config, fragen, wiederhergestellt }: Props) {
  const pruefungStarten = usePruefungStore((s) => s.pruefungStarten)
  const setPhase = usePruefungStore((s) => s.setPhase)
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Warteraum: Polling bis freigeschaltet === true
  const [istFreigeschaltet, setIstFreigeschaltet] = useState(
    istDemoModus || config.freigeschaltet
  )

  // SEB-Ausnahme: LP hat für diesen SuS eine Ausnahme erteilt
  const [hatSebAusnahme, setHatSebAusnahme] = useState(false)

  useEffect(() => {
    // Kein Polling nötig wenn bereits freigeschaltet oder Demo-Modus
    if (istFreigeschaltet || istDemoModus) return

    const interval = setInterval(async () => {
      if (!user) return
      const result = await apiService.ladePruefung(config.id, user.email)
      if (result?.config.freigeschaltet) {
        setIstFreigeschaltet(true)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [istFreigeschaltet, istDemoModus, config.id, user])

  // SEB-Ausnahme per Heartbeat-Polling prüfen
  useEffect(() => {
    if (!config.sebErforderlich || istImSEB() || hatSebAusnahme || istDemoModus || !user) return

    // Initiale Prüfung: E-Mail bereits in sebAusnahmen?
    if (config.sebAusnahmen?.includes(user.email)) {
      setHatSebAusnahme(true)
      return
    }

    const interval = setInterval(async () => {
      if (!user) return
      const response = await apiService.heartbeat(config.id, user.email)
      if (response.sebAusnahme) {
        setHatSebAusnahme(true)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [config.sebErforderlich, config.id, config.sebAusnahmen, hatSebAusnahme, istDemoModus, user])

  function handleStart() {
    if (wiederhergestellt) {
      setPhase('pruefung')
    } else {
      pruefungStarten(config, fragen)
    }
  }

  const gesamtFragen = config.abschnitte.reduce((sum, a) => sum + a.fragenIds.length, 0)

  // Punkte pro Abschnitt berechnen
  function punkteFuerAbschnitt(fragenIds: string[]): number {
    return fragenIds.reduce((sum, id) => {
      const frage = fragen.find((f) => f.id === id)
      return sum + (frage?.punkte ?? 0)
    }, 0)
  }

  // SEB-Blockierung: aktiv wenn SEB erforderlich, nicht im SEB und keine Ausnahme
  const sebBlockiert = config.sebErforderlich && !istImSEB() && !hatSebAusnahme
  // SEB-Warnung (gelb): Hat Ausnahme, aber nicht im SEB
  const sebWarnung = config.sebErforderlich && !istImSEB() && hatSebAusnahme

  // Warteraum anzeigen wenn Prüfung noch nicht freigeschaltet
  if (!istFreigeschaltet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          {/* Warte-Animation mit Puls */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-200 dark:bg-blue-800/20 animate-ping opacity-30" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {config.titel}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">
              Die Lehrperson hat die Prüfung noch nicht freigegeben.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Die Seite aktualisiert sich automatisch.
            </p>
          </div>

          {/* Prüfungsinfos weiterhin sichtbar */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <InfoCard label="Klasse" wert={config.klasse} />
            <InfoCard label="Dauer" wert={config.zeitModus === 'open-end' ? 'Open-End' : `${config.dauerMinuten} Min.`} />
            <InfoCard label="Datum" wert={formatDatum(config.datum)} />
          </div>

          {user && (
            <p className="text-center text-sm text-slate-400 dark:text-slate-500">
              Angemeldet als {user.name}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
      {/* Theme-Toggle oben rechts */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
        {/* Titel */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 dark:bg-slate-200 rounded-2xl flex items-center justify-center">
            <span className="text-white dark:text-slate-800 text-2xl font-bold">WR</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            {config.titel}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {config.klasse} · {formatDatum(config.datum)}
          </p>
          {user && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Angemeldet als {user.name}
            </p>
          )}
        </div>

        {/* SEB-Blockierung (hard block) */}
        {sebBlockiert && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 space-y-1">
            <p>Diese Prüfung erfordert den <strong>Safe Exam Browser (SEB)</strong>.</p>
            <p>Bitte starte die Prüfung über die SEB-Datei deiner Lehrperson.</p>
          </div>
        )}

        {/* SEB-Warnung (Ausnahme erteilt, aber nicht im SEB) */}
        {sebWarnung && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            Die Lehrperson hat dir eine <strong>SEB-Ausnahme</strong> erteilt. Du kannst die Prüfung im normalen Browser starten.
          </div>
        )}

        {/* Wiederherstellungs-Hinweis */}
        {wiederhergestellt && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            Gespeicherte Sitzung gefunden. Ihre bisherigen Antworten werden wiederhergestellt.
          </div>
        )}

        {/* Infos */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <InfoCard label="Dauer" wert={config.zeitModus === 'open-end' ? 'Kein Zeitlimit' : `${config.dauerMinuten} Minuten`} />
          <InfoCard label="Fragen" wert={`${gesamtFragen}`} />
          <InfoCard label="Punkte" wert={`${config.gesamtpunkte}`} />
          <InfoCard label="Typ" wert={config.typ === 'summativ' ? 'Summativ' : 'Formativ'} />
        </div>

        {/* Abschnitte mit Punkten */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Aufbau</h3>
          <div className="space-y-1.5">
            {config.abschnitte.map((a) => {
              const punkte = punkteFuerAbschnitt(a.fragenIds)
              return (
                <div
                  key={a.titel}
                  className="flex justify-between text-sm text-slate-700 dark:text-slate-300 py-1.5 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <span>{a.titel}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {a.fragenIds.length} {a.fragenIds.length === 1 ? 'Frage' : 'Fragen'} · {punkte} P.
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hinweise */}
        <div className="mb-8 text-sm text-slate-500 dark:text-slate-400 space-y-1">
          {config.ruecknavigation && (
            <p>Alle Fragen können in beliebiger Reihenfolge beantwortet werden.</p>
          )}
          <p>Antworten werden automatisch gespeichert.</p>
          <p>Navigation: Pfeiltasten oder Ctrl + Pfeiltasten</p>
        </div>

        {/* Start-Button */}
        <button
          onClick={handleStart}
          disabled={sebBlockiert}
          className={`w-full py-3 text-lg font-semibold rounded-xl transition-colors
            ${sebBlockiert
              ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 cursor-pointer'
            }
          `}
        >
          {wiederhergestellt ? 'Sitzung fortsetzen' : 'Prüfung starten'}
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</div>
      <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{wert}</div>
    </div>
  )
}
