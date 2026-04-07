import { useState, useEffect } from 'react'
import { useUebenSettingsStore } from '../../../../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../../../../store/ueben/gruppenStore'
import { useUebenAuthStore } from '../../../../store/ueben/authStore'
import { uebenGruppenAdapter, uebenFragenAdapter } from '../../../../adapters/ueben/appsScriptAdapter'
import { getFachFarbe } from '../../../../utils/ueben/fachFarben'

const STANDARD_FARBEN: Record<string, string> = {
  VWL: '#f97316',
  BWL: '#3b82f6',
  Recht: '#22c55e',
  Informatik: '#6b7280',
}

function getStandardFarbe(fach: string): string {
  return STANDARD_FARBEN[fach] || '#6b7280'
}

export default function FarbenTab() {
  const { einstellungen, aktualisiereEinstellungen } = useUebenSettingsStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { user } = useUebenAuthStore()
  const [sichtbareFaecher, setSichtbareFaecher] = useState<string[]>([])
  const [laden, setLaden] = useState(true)
  const [speichern, setSpeichern] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [fehlerText, setFehlerText] = useState('')

  useEffect(() => {
    if (!aktiveGruppe) return
    setLaden(true)
    uebenFragenAdapter.ladeFragen(aktiveGruppe.id).then((fragen) => {
      const alleFaecher = [...new Set(fragen.map(f => f.fach))]
      setSichtbareFaecher(alleFaecher)
      setLaden(false)
    }).catch(() => setLaden(false))
  }, [aktiveGruppe])

  if (!einstellungen || !aktiveGruppe) {
    return <p className="text-sm text-slate-400">Keine Einstellungen geladen.</p>
  }

  const farbeFuerFach = (fach: string) =>
    getFachFarbe(fach, einstellungen.fachFarben)

  const setzefarbe = (fach: string, farbe: string) => {
    aktualisiereEinstellungen({
      fachFarben: { ...einstellungen.fachFarben, [fach]: farbe },
    })
  }

  const resetFarbe = (fach: string) => {
    const { [fach]: _entfernt, ...rest } = einstellungen.fachFarben
    aktualisiereEinstellungen({ fachFarben: rest })
  }

  const handleSpeichern = async () => {
    if (!user?.email) return
    setSpeichern('laden')
    setFehlerText('')
    try {
      await uebenGruppenAdapter.speichereEinstellungen(aktiveGruppe.id, einstellungen, user.email)
      setSpeichern('ok')
      setTimeout(() => setSpeichern('idle'), 2000)
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
      setSpeichern('fehler')
    }
  }

  if (laden) {
    return <p className="text-sm text-slate-400">Fächer werden geladen…</p>
  }

  if (sichtbareFaecher.length === 0) {
    return <p className="text-sm text-slate-400">Keine Fächer gefunden.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Farben pro Fach anpassen. Klicke auf das Farbfeld um eine Farbe zu wählen.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {sichtbareFaecher.map((fach) => {
          const aktuellefarbe = farbeFuerFach(fach)
          const istGeaendert = einstellungen.fachFarben[fach] !== undefined
          return (
            <div key={fach} className="flex items-center gap-4 p-4">
              {/* Farbwähler */}
              <input
                type="color"
                value={aktuellefarbe}
                onChange={(e) => setzefarbe(fach, e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-slate-600 p-0.5"
                title={`Farbe für ${fach}`}
              />

              {/* Name */}
              <span className="flex-1 font-medium dark:text-white">{fach}</span>

              {/* Vorschau-Badge */}
              <span
                style={{ backgroundColor: aktuellefarbe, color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}
              >
                {fach}
              </span>

              {/* Reset */}
              {istGeaendert && (
                <button
                  onClick={() => resetFarbe(fach)}
                  className="text-xs text-slate-400 hover:text-red-500 min-h-[44px] px-2"
                >
                  Zuruecksetzen
                </button>
              )}
              {!istGeaendert && (
                <span className="text-xs text-slate-300 dark:text-slate-600 px-2">
                  Standard ({getStandardFarbe(fach)})
                </span>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={handleSpeichern}
        disabled={speichern === 'laden'}
        className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg py-3 font-medium disabled:opacity-50 min-h-[44px] hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors mt-4"
      >
        {speichern === 'laden' ? 'Wird gespeichert…' : speichern === 'ok' ? 'Gespeichert ✓' : 'Speichern'}
      </button>
      {speichern === 'fehler' && (
        <p className="text-sm text-red-500">{fehlerText}</p>
      )}
    </div>
  )
}
