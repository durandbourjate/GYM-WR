import { useState, useEffect } from 'react'
import type { PruefungsConfig } from '../types/pruefung.ts'
import type { Frage } from '../types/fragen.ts'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { istImSEB } from '../services/sebService.ts'
import { erkenneGeraet } from '../hooks/useGeraetErkennung.ts'
import { formatDatum } from '../utils/zeit.ts'
import ThemeToggle from './ThemeToggle.tsx'

interface Props {
  config: PruefungsConfig
  fragen: Frage[]
  alleFragen?: Frage[]
  wiederhergestellt: boolean
  wurdeZurueckgesetzt?: boolean
}

export default function Startbildschirm({ config, fragen, alleFragen, wiederhergestellt, wurdeZurueckgesetzt }: Props) {
  const pruefungStarten = usePruefungStore((s) => s.pruefungStarten)
  const setPhase = usePruefungStore((s) => s.setPhase)
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Warteraum: Polling bis freigeschaltet === true
  const [istFreigeschaltet, setIstFreigeschaltet] = useState(
    istDemoModus || config.freigeschaltet
  )

  // SEB-Ausnahme: LP hat für diesen SuS eine Ausnahme erteilt
  const [hatSebAusnahme, setHatSebAusnahme] = useState(false)
  // Heartbeat erfolgreich: Verbindung zum Server steht
  const [heartbeatErfolgreich, setHeartbeatErfolgreich] = useState(false)
  // Phase: LP hat Lobby eröffnet (freigeschaltet im Backend)
  const [lobbyOffen, setLobbyOffen] = useState(false)
  // SuS hat Ausnahme bei LP angefragt
  const [ausnahmeAngefragt, setAusnahmeAngefragt] = useState(false)

  // Warteraum-Polling: Heartbeat senden (damit LP den SuS in der Lobby sieht)
  // + Freischaltung prüfen + SEB-Ausnahme prüfen — alles in einem Intervall
  useEffect(() => {
    if (istFreigeschaltet || istDemoModus || !user) return

    // Sofort einen initialen Heartbeat senden
    if (apiService.istKonfiguriert()) {
      apiService.heartbeat(config.id, user.email).then((response) => {
        console.log('[Warteraum] Heartbeat-Response:', JSON.stringify({ success: response.success, phase: response.phase }))
        setHeartbeatErfolgreich(true)
        const phase = response.phase
        // Backend gibt 'lobby' wenn freigeschaltet, 'vorbereitung' wenn nicht
        if (phase === 'lobby' || phase === 'aktiv' || phase === 'live') {
          console.log('[Warteraum] Freischaltung erkannt! Phase:', phase)
          setLobbyOffen(true)
          setIstFreigeschaltet(true)
        }
        if (response.sebAusnahme) setHatSebAusnahme(true)
      }).catch((err) => {
        console.warn('[Warteraum] Heartbeat-Fehler:', err?.message || err)
      })
    }

    // Nur Heartbeat für Warteraum-Polling — enthält Phase + SEB-Ausnahme
    const interval = setInterval(async () => {
      if (!user || !apiService.istKonfiguriert()) return

      try {
        const response = await apiService.heartbeat(config.id, user.email)
        if (response) {
          console.log('[Warteraum] Poll-Response:', JSON.stringify({ success: response.success, phase: response.phase }))
          setHeartbeatErfolgreich(true)
          const phase = response.phase
          // Backend gibt 'lobby' wenn freigeschaltet, 'vorbereitung' wenn nicht
          if (phase === 'lobby' || phase === 'aktiv' || phase === 'live') {
            console.log('[Warteraum] Freischaltung erkannt! Phase:', phase)
            setLobbyOffen(true)
            setIstFreigeschaltet(true)
          }
          if (response.sebAusnahme) setHatSebAusnahme(true)
        }
      } catch {
        // Netzwerkfehler — nächster Poll versucht es erneut
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [istFreigeschaltet, istDemoModus, config.id, user])

  // Initiale SEB-Ausnahme prüfen (E-Mail bereits in sebAusnahmen?)
  useEffect(() => {
    if (!config.sebErforderlich || !user) return
    if (config.sebAusnahmen?.includes(user.email)) {
      setHatSebAusnahme(true)
    }
  }, [config.sebErforderlich, config.sebAusnahmen, user])

  async function handleStart() {
    // Vollbild bei Standard/Streng auf Laptop
    const stufe = config.kontrollStufe || 'standard'
    const geraet = erkenneGeraet()
    if (stufe !== 'keine' && stufe !== 'locker' && geraet === 'laptop') {
      try {
        const el = document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
        else if ((el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (el as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
        }
      } catch { /* SuS hat abgelehnt — wird via fullscreenchange geloggt */ }
    }

    if (wiederhergestellt) {
      setPhase('pruefung')
    } else {
      pruefungStarten(config, fragen, alleFragen)
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
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {user && (
            <button
              onClick={abmelden}
              title="Abmelden"
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Abmelden
            </button>
          )}
          <ThemeToggle />
        </div>

        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 p-8">
          {/* Warteraum-Header */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full bg-blue-200 dark:bg-blue-800/20 animate-ping opacity-20" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
              Warteraum
            </p>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {config.titel}
            </h1>
            {heartbeatErfolgreich && lobbyOffen ? (
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                ● Verbunden — warte auf Freischaltung durch Lehrperson
              </p>
            ) : heartbeatErfolgreich ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                ● Server erreichbar — Warteraum noch nicht geöffnet
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 animate-pulse">
                ○ Verbinde mit Prüfungsserver…
              </p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Die Seite aktualisiert sich automatisch.
            </p>
          </div>

          {/* Prüfungsinfos */}
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
      {/* Abmelden + Theme-Toggle oben rechts */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {user && (
          <button
            onClick={abmelden}
            title="Abmelden"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            Abmelden
          </button>
        )}
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

        {/* SEB-Blockierung (hard block) + Ausnahme-Anfrage */}
        {sebBlockiert && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 space-y-2">
            <p>Diese Prüfung erfordert den <strong>Safe Exam Browser (SEB)</strong>.</p>
            <p>Bitte starten Sie die Prüfung über die SEB-Datei Ihrer Lehrperson.</p>
            {ausnahmeAngefragt ? (
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-amber-700 dark:text-amber-300">
                <span>⏳</span>
                <span>Ausnahme angefragt — warten Sie auf die Freigabe durch die Lehrperson.</span>
              </div>
            ) : (
              <button
                onClick={() => setAusnahmeAngefragt(true)}
                className="w-full mt-1 px-3 py-2 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              >
                🙋 SEB-Ausnahme bei Lehrperson anfragen
              </button>
            )}
          </div>
        )}

        {/* SEB-Warnung (Ausnahme erteilt, aber nicht im SEB) */}
        {sebWarnung && (
          <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            Die Lehrperson hat dir eine <strong>SEB-Ausnahme</strong> erteilt. Du kannst die Prüfung im normalen Browser starten.
          </div>
        )}

        {/* Reset-Hinweis (LP hat Prüfung zurückgesetzt) */}
        {wurdeZurueckgesetzt && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            Diese Prüfung wurde von der Lehrperson zurückgesetzt. Ihre vorherigen Antworten wurden gelöscht.
          </div>
        )}

        {/* Wiederherstellungs-Hinweis */}
        {wiederhergestellt && !wurdeZurueckgesetzt && (
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
