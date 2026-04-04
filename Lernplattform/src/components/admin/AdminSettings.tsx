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
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setAktiv(id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${aktiv === id ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
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
