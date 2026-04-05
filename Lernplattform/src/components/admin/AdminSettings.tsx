import { useState } from 'react'
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

  return (
    <div className="space-y-5">
      {/* Sub-Tab-Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setAktiv(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${aktiv === id ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab-Inhalt */}
      {aktiv === 'allgemein' && <AllgemeinTab />}
      {aktiv === 'faecher' && <FaecherTab />}
      {aktiv === 'farben' && <FarbenTab />}
      {aktiv === 'mitglieder' && <MitgliederTab />}
    </div>
  )
}
