import { useState, useEffect } from 'react'
import { useStammdatenStore } from '../../../store/stammdatenStore'
import type { Stammdaten, LPProfil } from '../../../types/stammdaten'
import { CheckboxChip } from './sharedFelder'
import { useSpeicherStatus } from '../../../hooks/useSpeicherStatus'
import SpeicherButton from './SpeicherButton'
import { TYPO } from '../../../styles/typografie'
import { TabStarToggle } from '../../lp/TabStarToggle'

export default function ProfilTab({ email, stammdaten, profil }: { email: string; stammdaten: Stammdaten; profil: LPProfil | null }) {
  const { speichereLPProfil } = useStammdatenStore()
  const [gewaehlteKurse, setGewaehlteKurse] = useState<string[]>(profil?.kursIds ?? [])
  const [gewaehlteFachschaften, setGewaehlteFachschaften] = useState<string[]>(profil?.fachschaftIds ?? [])
  const [gewaehlteGefaesse, setGewaehlteGefaesse] = useState<string[]>(profil?.gefaesse ?? [])
  const { status: speicherStatus, speichern: runSpeichern } = useSpeicherStatus()

  // Wenn Profil geladen wird, State aktualisieren
  useEffect(() => {
    if (profil) {
      setGewaehlteKurse(profil.kursIds ?? [])
      setGewaehlteFachschaften(profil.fachschaftIds ?? [])
      setGewaehlteGefaesse(profil.gefaesse ?? [])
    }
  }, [profil])

  const speichern = () => {
    const neuesProfil: LPProfil = {
      email,
      kursIds: gewaehlteKurse,
      fachschaftIds: gewaehlteFachschaften,
      gefaesse: gewaehlteGefaesse,
    }
    void runSpeichern(() => speichereLPProfil(neuesProfil))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`${TYPO.h1} text-slate-800 dark:text-slate-100`}>Mein Profil</h2>
        <TabStarToggle tabId="profil" surface="einstellungen" label="Mein Profil" icon="User" />
      </div>

      {/* Fachschaften */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fachschaften</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.fachschaften.map(fs => (
            <CheckboxChip
              key={fs.id}
              label={fs.name}
              checked={gewaehlteFachschaften.includes(fs.id)}
              onChange={checked => {
                setGewaehlteFachschaften(prev =>
                  checked ? [...prev, fs.id] : prev.filter(id => id !== fs.id)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Kurse */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Meine Kurse</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.kurse.map(k => (
            <CheckboxChip
              key={k.id}
              label={k.name}
              checked={gewaehlteKurse.includes(k.id)}
              onChange={checked => {
                setGewaehlteKurse(prev =>
                  checked ? [...prev, k.id] : prev.filter(id => id !== k.id)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Gefässe */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gefässe</label>
        <div className="flex flex-wrap gap-2">
          {stammdaten.gefaesse.map(g => (
            <CheckboxChip
              key={g}
              label={g}
              checked={gewaehlteGefaesse.includes(g)}
              onChange={checked => {
                setGewaehlteGefaesse(prev =>
                  checked ? [...prev, g] : prev.filter(id => id !== g)
                )
              }}
            />
          ))}
        </div>
      </div>

      {/* Speichern */}
      <SpeicherButton status={speicherStatus} idleLabel="Profil speichern" onClick={speichern} />
      {speicherStatus === 'fehler' && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Fehler beim Speichern. {useStammdatenStore.getState().fehler ? `Details: ${useStammdatenStore.getState().fehler}` : 'Bitte erneut versuchen.'}
        </p>
      )}
    </div>
  )
}
