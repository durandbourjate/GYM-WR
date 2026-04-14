import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useUebenSettingsStore } from '../../../store/ueben/settingsStore'
import AllgemeinTab from './settings/AllgemeinTab'
import FaecherTab from './settings/FaecherTab'
import FarbenTab from './settings/FarbenTab'
import MitgliederTab from './settings/MitgliederTab'

type SettingsTab = 'allgemein' | 'faecher' | 'farben' | 'mitglieder'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'allgemein', label: 'Allgemein' },
  { id: 'faecher', label: 'Fächer' },
  { id: 'farben', label: 'Farben' },
  { id: 'mitglieder', label: 'Mitglieder' },
]

export default function AdminSettings() {
  const [aktiv, setAktiv] = useState<SettingsTab>('allgemein')
  const saveFehler = useUebenSettingsStore(s => s.saveFehler)
  const speichertGerade = useUebenSettingsStore(s => s.speichertGerade)
  const resetSaveFehler = useUebenSettingsStore(s => s.resetSaveFehler)

  return (
    <div className="space-y-5">
      {/* Save-Fehler-Banner */}
      {saveFehler && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700">
          <div className="flex-1 text-sm text-red-700 dark:text-red-300">
            <strong>Einstellung konnte nicht gespeichert werden:</strong> {saveFehler}
          </div>
          <button
            onClick={resetSaveFehler}
            className="text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100 text-sm shrink-0"
            title="Schliessen"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Tab-Navigation + Speicher-Indikator */}
      <div className="flex items-center justify-between gap-3">
        <TabBar
          tabs={TABS}
          activeTab={aktiv}
          onTabChange={(id) => setAktiv(id as SettingsTab)}
          size="sm"
        />
        {speichertGerade && (
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0" title="Wird gespeichert">
            Speichern…
          </span>
        )}
      </div>

      {/* Tab-Inhalt */}
      {aktiv === 'allgemein' && <AllgemeinTab />}
      {aktiv === 'faecher' && <FaecherTab />}
      {aktiv === 'farben' && <FarbenTab />}
      {aktiv === 'mitglieder' && <MitgliederTab />}
    </div>
  )
}
