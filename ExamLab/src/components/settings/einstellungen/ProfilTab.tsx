import { useState, useEffect } from 'react'
import { useStammdatenStore } from '../../../store/stammdatenStore'
import type { Stammdaten, LPProfil } from '../../../types/stammdaten'
import { CheckboxChip } from './sharedFelder'

export default function ProfilTab({ email, stammdaten, profil }: { email: string; stammdaten: Stammdaten; profil: LPProfil | null }) {
  const { speichereLPProfil } = useStammdatenStore()
  const [gewaehlteKurse, setGewaehlteKurse] = useState<string[]>(profil?.kursIds ?? [])
  const [gewaehlteFachschaften, setGewaehlteFachschaften] = useState<string[]>(profil?.fachschaftIds ?? [])
  const [gewaehlteGefaesse, setGewaehlteGefaesse] = useState<string[]>(profil?.gefaesse ?? [])
  const [speicherStatus, setSpeicherStatus] = useState<'idle' | 'laeuft' | 'gespeichert' | 'fehler'>('idle')

  // Wenn Profil geladen wird, State aktualisieren
  useEffect(() => {
    if (profil) {
      setGewaehlteKurse(profil.kursIds ?? [])
      setGewaehlteFachschaften(profil.fachschaftIds ?? [])
      setGewaehlteGefaesse(profil.gefaesse ?? [])
    }
  }, [profil])

  const speichern = async () => {
    setSpeicherStatus('laeuft')
    const neuesProfil: LPProfil = {
      email,
      kursIds: gewaehlteKurse,
      fachschaftIds: gewaehlteFachschaften,
      gefaesse: gewaehlteGefaesse,
    }
    const ok = await speichereLPProfil(neuesProfil)
    setSpeicherStatus(ok ? 'gespeichert' : 'fehler')
    if (ok) setTimeout(() => setSpeicherStatus('idle'), 2000)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Mein Profil</h3>

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
      <button
        onClick={speichern}
        disabled={speicherStatus === 'laeuft'}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
          speicherStatus === 'laeuft'
            ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-wait'
            : speicherStatus === 'gespeichert'
            ? 'bg-green-600 text-white'
            : 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100'
        }`}
      >
        {speicherStatus === 'laeuft' ? 'Speichern...' : speicherStatus === 'gespeichert' ? '✓ Gespeichert' : 'Profil speichern'}
      </button>
      {speicherStatus === 'fehler' && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Fehler beim Speichern. {useStammdatenStore.getState().fehler ? `Details: ${useStammdatenStore.getState().fehler}` : 'Bitte erneut versuchen.'}
        </p>
      )}
    </div>
  )
}
