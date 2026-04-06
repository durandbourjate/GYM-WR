import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

interface Props {
  onSchliessen: () => void
}

type EinstellungenTab = 'kurse' | 'lp' | 'uebungen'

/**
 * Einstellungen-Panel: Slide-over Panel je nach Rolle.
 * - Admin: LP hinzufügen/verwalten
 * - LP: Kurse konfigurieren
 * - Übungen: Übungs-Einstellungen
 */
export default function EinstellungenPanel({ onSchliessen }: Props) {
  const user = useAuthStore(s => s.user)
  const istAdmin = user?.email === 'yannick.durand@gymhofwil.ch' // TODO: aus Config
  const [tab, setTab] = useState<EinstellungenTab>(istAdmin ? 'lp' : 'kurse')

  const tabs: { key: EinstellungenTab; label: string; sichtbar: boolean }[] = [
    { key: 'lp', label: 'Lehrpersonen', sichtbar: istAdmin },
    { key: 'kurse', label: 'Kurse', sichtbar: true },
    { key: 'uebungen', label: 'Übungen', sichtbar: true },
  ]

  const sichtbareTabs = tabs.filter(t => t.sichtbar)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onSchliessen} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Einstellungen</h2>
          <button onClick={onSchliessen} className="w-8 h-8 text-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex gap-4 border-b border-slate-200 dark:border-slate-700">
          {sichtbareTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t.key
                  ? 'border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'lp' && istAdmin && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Lehrpersonen verwalten</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Hier können weitere Lehrpersonen hinzugefügt werden, die ExamLab nutzen dürfen.
              </p>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                Wird in einer nächsten Version implementiert.
              </div>
            </div>
          )}

          {tab === 'kurse' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Kurse konfigurieren</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Kurse definieren die Zuordnung von Klassen zu Fächern und Gefässen.
              </p>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                Wird in einer nächsten Version implementiert.
              </div>
            </div>
          )}

          {tab === 'uebungen' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4">Übungs-Einstellungen</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Einstellungen für den Übungsmodus (Mastery-Schwellwerte, Standard-Filter etc.).
              </p>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                Wird in einer nächsten Version implementiert.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
