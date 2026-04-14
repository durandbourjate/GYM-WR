import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
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
      <TabBar
        tabs={TABS}
        activeTab={aktiv}
        onTabChange={(id) => setAktiv(id as SettingsTab)}
        size="sm"
      />

      {/* Tab-Inhalt */}
      {aktiv === 'allgemein' && <AllgemeinTab />}
      {aktiv === 'faecher' && <FaecherTab />}
      {aktiv === 'farben' && <FarbenTab />}
      {aktiv === 'mitglieder' && <MitgliederTab />}
    </div>
  )
}
