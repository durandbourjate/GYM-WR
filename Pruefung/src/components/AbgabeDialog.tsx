import { useState, useRef } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap.ts'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { clearIndexedDB } from '../services/autoSave.ts'
import { sebVersion, browserInfo } from '../services/sebService.ts'
import { formatUhrzeit } from '../utils/zeit.ts'
import type { PruefungsAbgabe } from '../types/antworten.ts'
import { istVollstaendigBeantwortet } from '../utils/antwortStatus.ts'

interface Props {
  onSchliessen: () => void
}

type AbgabeStatus = 'bereit' | 'senden' | 'erfolg' | 'fehler'

export default function AbgabeDialog({ onSchliessen }: Props) {
  const fragen = usePruefungStore((s) => s.fragen)
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const antworten = usePruefungStore((s) => s.antworten)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const config = usePruefungStore((s) => s.config)
  const startzeit = usePruefungStore((s) => s.startzeit)
  const autoSaveCount = usePruefungStore((s) => s.autoSaveCount)
  const heartbeats = usePruefungStore((s) => s.heartbeats)
  const netzwerkFehler = usePruefungStore((s) => s.netzwerkFehler)
  const unterbrechungen = usePruefungStore((s) => s.unterbrechungen)
  const pruefungAbgeben = usePruefungStore((s) => s.pruefungAbgeben)

  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [status, setStatus] = useState<AbgabeStatus>('bereit')
  const [abgabezeit, setAbgabezeit] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)

  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef)

  const beantwortet = fragen.filter((f) => istVollstaendigBeantwortet(f, antworten[f.id], alleFragen, antworten)).length
  const unbeantwortet = fragen.length - beantwortet
  const markiert = fragen.filter((f) => !!markierungen[f.id]).length

  /** Erstellt das vollständige Abgabe-Objekt mit allen Meta-Daten */
  function erstelleAbgabeObjekt(): PruefungsAbgabe {
    return {
      pruefungId: config?.id ?? 'demo',
      email: user?.email ?? '',
      name: user?.name ?? 'Unbekannt',
      schuelerId: user?.schuelerId,
      startzeit: startzeit ?? new Date().toISOString(),
      abgabezeit: new Date().toISOString(),
      antworten,
      meta: {
        sebVersion: sebVersion(),
        browserInfo: browserInfo(),
        autoSaveCount,
        netzwerkFehler,
        heartbeats,
        unterbrechungen,
      },
    }
  }

  async function handleAbgabe() {
    setStatus('senden')
    const abgabe = erstelleAbgabeObjekt()
    setAbgabezeit(abgabe.abgabezeit)

    // Lokal als abgegeben markieren (auch wenn Remote fehlschlägt)
    pruefungAbgeben()

    // Vollbild verlassen (Prüfung ist vorbei)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})

    // Abgabe-Daten in localStorage sichern als Fallback
    try {
      localStorage.setItem(`pruefung-abgabe-${abgabe.pruefungId}`, JSON.stringify(abgabe))
    } catch {
      // localStorage voll — ignorieren
    }

    // An Backend senden (nur wenn konfiguriert und kein Demo-Modus)
    if (apiService.istKonfiguriert() && !istDemoModus) {
      // Abgabe mit mehreren Retries — Datenverlust verhindern
      const abgabePayload = {
        pruefungId: abgabe.pruefungId,
        email: abgabe.email,
        antworten: abgabe.antworten,
        version: -1, // -1 = finale Abgabe
        istAbgabe: true,
        gesamtFragen: fragen.length,
      }
      const backoffs = [0, 2000, 5000, 10000] // sofort, 2s, 5s, 10s
      let erfolg = false
      for (const wartezeit of backoffs) {
        if (wartezeit > 0) await new Promise(r => setTimeout(r, wartezeit))
        erfolg = await apiService.speichereAntworten(abgabePayload)
        if (erfolg) break
      }

      if (erfolg) {
        setStatus('erfolg')
        // IndexedDB-Backup nach erfolgreicher Abgabe leeren
        clearIndexedDB(abgabe.pruefungId)
        // localStorage-Daten aufräumen (Datenschutz: personenbezogene Daten entfernen)
        try {
          localStorage.removeItem(`pruefung-abgabe-${abgabe.pruefungId}`)
          localStorage.removeItem(`pruefung-state-${abgabe.pruefungId}`)
        } catch { /* ignorieren */ }
      } else {
        setStatus('fehler')
      }
    } else {
      // Demo-Modus oder kein Backend → direkt Erfolg
      setStatus('erfolg')
      clearIndexedDB(abgabe.pruefungId)
    }
  }

  async function handleRetry() {
    setStatus('senden')
    setRetryCount((c) => c + 1)

    const erfolg = await apiService.speichereAntworten({
      pruefungId: config?.id ?? 'demo',
      email: user?.email ?? '',
      antworten,
      version: -1,
      istAbgabe: true,
      gesamtFragen: fragen.length,
    })

    if (erfolg) {
      setStatus('erfolg')
      clearIndexedDB(config?.id ?? 'demo')
    } else {
      setStatus('fehler')
    }
  }

  // === Erfolgs-Anzeige ===
  if (status === 'erfolg') {
    return (
      <div ref={dialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 dark:bg-slate-300 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Prüfung abgegeben
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Erfolgreich abgegeben um {formatUhrzeit(abgabezeit)} Uhr.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Sie können das Fenster schliessen.
          </p>
        </div>
      </div>
    )
  }

  // === Fehler-Anzeige (Retry möglich) ===
  if (status === 'fehler') {
    return (
      <div ref={dialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            Abgabe gespeichert — Übertragung ausstehend
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Ihre Antworten sind lokal gesichert. Die Übertragung an den Server hat nicht geklappt.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
            Abgabezeit: {formatUhrzeit(abgabezeit)} Uhr {retryCount > 0 && `(${retryCount}× versucht)`}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 rounded-xl transition-colors cursor-pointer font-medium"
            >
              Erneut versuchen
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Die Prüfung wurde lokal als abgegeben markiert. Ihre Lehrperson wird informiert.
          </p>
        </div>
      </div>
    )
  }

  // === Senden-Anzeige ===
  if (status === 'senden') {
    return (
      <div ref={dialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Prüfung wird abgegeben…
          </h2>
        </div>
      </div>
    )
  }

  // === Bestätigungs-Dialog ===
  return (
    <div ref={dialogRef} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Prüfung abgeben?
        </h2>

        {/* Status */}
        <div className="space-y-2 mb-6">
          <StatusZeile
            label="Beantwortet"
            wert={`${beantwortet} von ${fragen.length}`}
            icon={'\u2713'}
            farbe="text-green-700 dark:text-green-400"
          />
          {unbeantwortet > 0 && (
            <StatusZeile
              label="Nicht beantwortet"
              wert={`${unbeantwortet}`}
              icon={'\u2717'}
              farbe="text-red-700 dark:text-red-400"
            />
          )}
          {markiert > 0 && (
            <StatusZeile
              label="Als unsicher markiert"
              wert={`${markiert}`}
              icon="?"
              farbe="text-amber-700 dark:text-amber-400"
            />
          )}
        </div>

        {/* Warnung */}
        {unbeantwortet > 0 && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            Achtung: Sie haben {unbeantwortet} {unbeantwortet === 1 ? 'Frage' : 'Fragen'} nicht beantwortet!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSchliessen}
            className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium"
          >
            Zurück
          </button>
          <button
            onClick={handleAbgabe}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 rounded-xl transition-colors cursor-pointer font-medium"
          >
            Definitiv abgeben
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusZeile({
  label,
  wert,
  icon,
  farbe,
}: {
  label: string
  wert: string
  icon: string
  farbe: string
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <span className={`font-bold ${farbe}`}>{icon}</span>
        {label}
      </span>
      <span className={`font-semibold ${farbe}`}>{wert}</span>
    </div>
  )
}
