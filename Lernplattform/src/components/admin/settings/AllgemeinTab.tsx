import { useState } from 'react'
import { useSettingsStore } from '../../../store/settingsStore'
import { useGruppenStore } from '../../../store/gruppenStore'
import { useAuthStore } from '../../../store/authStore'
import { gruppenAdapter } from '../../../adapters/appsScriptAdapter'

export default function AllgemeinTab() {
  const { einstellungen, aktualisiereEinstellungen } = useSettingsStore()
  const { aktiveGruppe } = useGruppenStore()
  const { user } = useAuthStore()
  const [speichern, setSpeichern] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [fehlerText, setFehlerText] = useState('')

  if (!einstellungen || !aktiveGruppe) {
    return <p className="text-sm text-gray-400">Keine Einstellungen geladen.</p>
  }

  const handleSpeichern = async () => {
    if (!user?.email) return
    setSpeichern('laden')
    setFehlerText('')
    try {
      await gruppenAdapter.speichereEinstellungen(aktiveGruppe.id, einstellungen, user.email)
      setSpeichern('ok')
      setTimeout(() => setSpeichern('idle'), 2000)
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
      setSpeichern('fehler')
    }
  }

  return (
    <div className="space-y-6">
      {/* Gruppeninfo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 space-y-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gruppenname</p>
          <p className="font-medium dark:text-white">{aktiveGruppe.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Typ</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aktiveGruppe.typ === 'familie' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'}`}>
            {aktiveGruppe.typ === 'familie' ? 'Familie' : 'Gymnasium'}
          </span>
        </div>
      </div>

      {/* Anrede */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium dark:text-white mb-3">Anrede</p>
        <div className="flex gap-2">
          {(['sie', 'du'] as const).map((wert) => (
            <button
              key={wert}
              onClick={() => aktualisiereEinstellungen({ anrede: wert })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${einstellungen.anrede === wert ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {wert === 'sie' ? 'Sie' : 'Du'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback-Stil */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p className="text-sm font-medium dark:text-white mb-3">Feedback-Stil</p>
        <div className="flex gap-2">
          {([{ id: 'sachlich', label: 'Sachlich' }, { id: 'ermutigend', label: 'Ermutigend' }] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => aktualisiereEinstellungen({ feedbackStil: id })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${einstellungen.feedbackStil === id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Speichern */}
      <button
        onClick={handleSpeichern}
        disabled={speichern === 'laden'}
        className="w-full bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg py-3 font-medium disabled:opacity-50 min-h-[44px] hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
      >
        {speichern === 'laden' ? 'Wird gespeichert…' : speichern === 'ok' ? 'Gespeichert ✓' : 'Speichern'}
      </button>
      {speichern === 'fehler' && (
        <p className="text-sm text-red-500">{fehlerText}</p>
      )}
    </div>
  )
}
