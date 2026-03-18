import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsConfig } from '../../types/pruefung.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import PruefungsComposer from './PruefungsComposer.tsx'

/** Startseite für Lehrpersonen: Prüfungen verwalten + erstellen */
export default function LPStartseite() {
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [backendFehler, setBackendFehler] = useState(false)
  const [ansicht, setAnsicht] = useState<'liste' | 'composer'>('liste')
  const [editConfig, setEditConfig] = useState<PruefungsConfig | null>(null)

  // Alle Prüfungs-Configs laden
  useEffect(() => {
    async function lade(): Promise<void> {
      if (!user) return

      if (istDemoModus || !apiService.istKonfiguriert()) {
        // Demo-Daten
        setConfigs(demoConfigs())
        setLadeStatus('fertig')
        return
      }

      const result = await apiService.ladeAlleConfigs(user.email)
      if (result) {
        setConfigs(result)
        setBackendFehler(false)
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }
      setLadeStatus("fertig")
    }
    lade()
  }, [user, istDemoModus])

  function handleNeue(): void {
    setEditConfig(null)
    setAnsicht('composer')
  }

  function handleBearbeiten(config: PruefungsConfig): void {
    setEditConfig(config)
    setAnsicht('composer')
  }

  function handleZurueck(): void {
    setAnsicht('liste')
    // Configs neu laden
    setLadeStatus('laden')
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      apiService.ladeAlleConfigs(user.email).then((result) => {
        if (result) setConfigs(result)
        setLadeStatus('fertig')
      })
    } else {
      setConfigs(demoConfigs())
      setLadeStatus('fertig')
    }
  }

  function pruefungsUrl(id: string): string {
    const base = window.location.origin + window.location.pathname
    return `${base}?id=${id}`
  }

  if (ansicht === 'composer') {
    return <PruefungsComposer config={editConfig} onZurueck={handleZurueck} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Prüfungsplattform
            </h1>
            {user && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {user.name} · Lehrperson
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNeue}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              + Neue Prüfung
            </button>
            <button
              onClick={abmelden}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Abmelden
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {ladeStatus === 'laden' && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-12">
            Prüfungen werden geladen...
          </p>
        )}

        {ladeStatus === "fertig" && backendFehler && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            Backend nicht erreichbar — bestehende Prüfungen konnten nicht geladen werden.
            Der Composer ist trotzdem nutzbar.
          </div>
        )}

        {ladeStatus === 'fertig' && configs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Noch keine Prüfungen
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Erstellen Sie Ihre erste digitale Prüfung.
            </p>
            <button
              onClick={handleNeue}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
            >
              + Neue Prüfung erstellen
            </button>
          </div>
        )}

        {ladeStatus === 'fertig' && configs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">
              Meine Prüfungen ({configs.length})
            </h2>
            {configs.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {c.titel}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span>{c.klasse}</span>
                    <span>·</span>
                    <span>{c.datum}</span>
                    <span>·</span>
                    <span>{c.dauerMinuten} Min.</span>
                    <span>·</span>
                    <span>{c.gesamtpunkte} P.</span>
                    <span>·</span>
                    <span>{c.abschnitte.reduce((s, a) => s + a.fragenIds.length, 0)} Fragen</span>
                    {c.fachbereiche.map((fb) => (
                      <span
                        key={fb}
                        className={`px-1.5 py-0.5 text-xs rounded ${
                          fb === 'VWL' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                          fb === 'BWL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          fb === 'Recht' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {fb}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Monitoring-Link */}
                  <a
                    href={`${window.location.pathname}?id=${c.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Live-Monitoring"
                  >
                    Monitoring
                  </a>
                  {/* Korrektur-Link */}
                  <a
                    href={`${window.location.pathname}?id=${c.id}&ansicht=korrektur`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="KI-Korrektur & Feedback"
                  >
                    Korrektur
                  </a>
                  {/* Bearbeiten */}
                  <button
                    onClick={() => handleBearbeiten(c)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Bearbeiten
                  </button>
                  {/* URL kopieren */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pruefungsUrl(c.id))
                      alert('Prüfungs-URL kopiert!')
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    title="Prüfungs-URL für SuS kopieren"
                  >
                    URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

/** Demo-Konfigurationen für den Demo-Modus */
function demoConfigs(): PruefungsConfig[] {
  return [
    {
      id: 'demo',
      titel: 'Demo-Prüfung WR — Wirtschaft & Recht',
      klasse: '28abcd WR',
      gefaess: 'SF',
      semester: 'S4',
      fachbereiche: ['VWL', 'BWL', 'Recht'],
      datum: '2026-03-16',
      typ: 'summativ',
      modus: 'pruefung',
      dauerMinuten: 45,
      gesamtpunkte: 24,
      erlaubteKlasse: '28abcd WR',
      sebErforderlich: false,
      abschnitte: [
        { titel: 'Teil A: Multiple Choice', fragenIds: ['vwl-mc-001', 'bwl-mc-001', 'recht-mc-001'] },
        { titel: 'Teil B: Freitext', fragenIds: ['bwl-ft-001', 'vwl-ft-001', 'recht-ft-001'] },
        { titel: 'Teil C: Lückentext', fragenIds: ['recht-lt-001'] },
        { titel: 'Teil D: Zuordnung', fragenIds: ['bwl-zu-001'] },
      ],
      zufallsreihenfolgeFragen: false,
      ruecknavigation: true,
      zeitanzeigeTyp: 'countdown',
      autoSaveIntervallSekunden: 30,
      heartbeatIntervallSekunden: 10,
      korrektur: { aktiviert: false, modus: 'batch' },
      feedback: { zeitpunkt: 'nach-review', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
    },
  ]
}
