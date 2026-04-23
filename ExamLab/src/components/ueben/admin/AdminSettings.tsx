import { useEffect, useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useUebenSettingsStore } from '../../../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { useAuthStore } from '../../../store/authStore'
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
  const gruppen = useUebenGruppenStore(s => s.gruppen)
  const aktiveGruppe = useUebenGruppenStore(s => s.aktiveGruppe)
  const waehleGruppe = useUebenGruppenStore(s => s.waehleGruppe)
  const ladeGruppen = useUebenGruppenStore(s => s.ladeGruppen)
  const email = useAuthStore(s => s.user?.email)

  // Ticket 1 S137: Gruppen beim Settings-Mount initial laden — sonst bleibt das Kurs-Dropdown leer,
  // bis der User zuerst den Üben-Tab klickt. Wenn gruppen bereits geladen sind, Noop.
  useEffect(() => {
    if (email && gruppen.length === 0) void ladeGruppen(email)
  }, [email, gruppen.length, ladeGruppen])

  return (
    <div className="space-y-5">
      {/* Save-Fehler-Banner */}
      {aktiveGruppe && saveFehler && (
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

      {/* Kopfzeile: Kurs-Dropdown + Sub-Tabs + Speicher-Indikator */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={aktiveGruppe?.id ?? ''}
          onChange={(e) => {
            const id = e.target.value
            if (id) void waehleGruppe(id)
          }}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-slate-500 cursor-pointer shrink-0"
          title="Kurs wählen"
        >
          {!aktiveGruppe && <option value="" disabled>— Kurs wählen —</option>}
          {gruppen.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        {aktiveGruppe && (
          <>
            <TabBar
              tabs={TABS}
              activeTab={aktiv}
              onTabChange={(id) => setAktiv(id as SettingsTab)}
              size="sm"
            />
            {speichertGerade && (
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto shrink-0" title="Wird gespeichert">
                Speichern…
              </span>
            )}
          </>
        )}
      </div>

      {/* Ohne aktive Gruppe: Hinweis statt leerer Tabs */}
      {!aktiveGruppe && (
        <p className="text-sm text-slate-500 dark:text-slate-400 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          Bitte wähle oben einen Kurs aus, um dessen Einstellungen zu bearbeiten.
        </p>
      )}

      {/* Tab-Inhalt */}
      {aktiveGruppe && aktiv === 'allgemein' && <AllgemeinTab />}
      {aktiveGruppe && aktiv === 'faecher' && <FaecherTab />}
      {aktiveGruppe && aktiv === 'farben' && <FarbenTab />}
      {aktiveGruppe && aktiv === 'mitglieder' && <MitgliederTab />}
    </div>
  )
}
