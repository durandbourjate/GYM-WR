import { useState } from 'react'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { SchuelerStatus } from '../../../types/monitoring'
import type { Frage } from '../../../types/fragen-storage'
import type { SchuelerAbgabe, PruefungsKorrektur } from '../../../types/korrektur'
import { exportiereBackupXlsx } from '../../../utils/backupExport'

interface Props {
  config: PruefungsConfig
  schuelerStatus: SchuelerStatus[]
  fragen: Frage[]
  abgaben: Record<string, SchuelerAbgabe>
  korrektur?: PruefungsKorrektur
  onExportieren?: () => void
  onNeueDurchfuehrung?: () => void
}

export default function BeendetPhase({ config, schuelerStatus, fragen, abgaben, korrektur, onNeueDurchfuehrung }: Props) {
  const [backupLaden, setBackupLaden] = useState(false)
  const [resetBestaetigung, setResetBestaetigung] = useState(false)
  const abgegeben = schuelerStatus.filter((s) => s.status === 'abgegeben')
  const erzwungen = schuelerStatus.filter((s) => s.status === 'beendet-lp')
  const nichtErschienen = schuelerStatus.filter((s) => s.status === 'nicht-gestartet')
  const gesamtTeilnehmer = config.teilnehmer?.length ?? schuelerStatus.length

  return (
    <div className="space-y-6">
      {/* Zusammenfassung */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Teilnehmer" wert={gesamtTeilnehmer} />
        <StatBox label="Abgegeben" wert={abgegeben.length} suffix={`(${Math.round((abgegeben.length / Math.max(gesamtTeilnehmer, 1)) * 100)}%)`} farbe="text-green-600 dark:text-green-400" />
        <StatBox label="Erzwungen" wert={erzwungen.length} farbe="text-amber-600 dark:text-amber-400" />
        <StatBox label="Nicht erschienen" wert={nichtErschienen.length} farbe="text-slate-500 dark:text-slate-400" />
      </div>

      {/* SuS-Liste */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Abgabe</th>
              <th className="px-3 py-2">Zeit+</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {schuelerStatus
              .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
              .map((s) => (
                <tr key={s.email}>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{s.name || s.email}</td>
                  <td className="px-3 py-2 text-xs">
                    {s.status === 'abgegeben' && <span className="text-green-600 dark:text-green-400">✅ Abgegeben</span>}
                    {s.status === 'beendet-lp' && <span className="text-amber-600 dark:text-amber-400">⚠️ Erzwungen</span>}
                    {s.status === 'nicht-gestartet' && <span className="text-slate-400">⚪ Nicht erschienen</span>}
                    {s.status === 'aktiv' && <span className="text-blue-600 dark:text-blue-400">🔵 Noch aktiv</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    {s.abgabezeit
                      ? new Date(s.abgabezeit).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {(config.zeitverlaengerungen?.[s.email] ?? 0) > 0 ? (
                      <span className="px-1.5 py-0.5 bg-blue-600 dark:bg-blue-700 text-white rounded font-bold">
                        ⏱ +{config.zeitverlaengerungen![s.email]}′
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        {fragen.length > 0 && (
          <button
            type="button"
            disabled={backupLaden}
            onClick={async () => {
              setBackupLaden(true)
              try {
                await exportiereBackupXlsx({ config, fragen, abgaben, korrektur })
              } catch (e) {
                console.error('[Export] Fehlgeschlagen:', e)
                alert('Export fehlgeschlagen. Bitte erneut versuchen.')
              } finally {
                setBackupLaden(false)
              }
            }}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            {backupLaden ? 'Exportiert…' : '📥 Excel Export'}
          </button>
        )}

        {/* Neue Durchführung starten */}
        {onNeueDurchfuehrung && (
          <>
            {!resetBestaetigung ? (
              <button
                type="button"
                onClick={() => setResetBestaetigung(true)}
                className="px-4 py-2 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 cursor-pointer"
              >
                🔄 Neue Durchführung starten
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  Lobby wird geleert, alte Daten gelöscht. Fortfahren?
                </span>
                <button
                  type="button"
                  onClick={() => { onNeueDurchfuehrung(); setResetBestaetigung(false) }}
                  className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer font-medium"
                >
                  Ja, zurücksetzen
                </button>
                <button
                  type="button"
                  onClick={() => setResetBestaetigung(false)}
                  className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, wert, suffix, farbe }: {
  label: string
  wert: number
  suffix?: string
  farbe?: string
}) {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{label}</p>
      <p className={`text-xl font-bold ${farbe ?? 'text-slate-800 dark:text-slate-100'}`}>
        {wert}
        {suffix && <span className="text-xs font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  )
}
