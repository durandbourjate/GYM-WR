import { useEffect, useState } from 'react'
import { useUebenSettingsStore } from '../../../../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../../../../store/ueben/gruppenStore'
import { useAuthStore } from '../../../../store/authStore'
import { useUebenAuthStore } from '../../../../store/ueben/authStore'
import { uebenGruppenAdapter, uebenFragenAdapter } from '../../../../adapters/ueben/appsScriptAdapter'
import { DEFAULT_MASTERY_SCHWELLWERTE } from '../../../../types/ueben/settings'

export default function AllgemeinTab() {
  const { einstellungen, aktualisiereEinstellungen } = useUebenSettingsStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { user } = useUebenAuthStore()
  const [speichern, setSpeichern] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [fehlerText, setFehlerText] = useState('')
  // Gruppenname bearbeiten
  const [nameBearbeiten, setNameBearbeiten] = useState(false)
  const [neuerName, setNeuerName] = useState('')
  const [nameStatus, setNameStatus] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [nameFehler, setNameFehler] = useState('')
  // Themen für Fokusthema-Dropdown laden
  const [verfuegbareThemen, setVerfuegbareThemen] = useState<{ fach: string; thema: string }[]>([])
  useEffect(() => {
    if (!aktiveGruppe) return
    const istDemo = useAuthStore.getState().istDemoModus
    uebenFragenAdapter.ladeFragen(aktiveGruppe.id).then(fragen => {
      const map = new Map<string, string>()
      for (const f of fragen) {
        const tags = (f.tags || []) as (string | { name: string })[]
        if (!istDemo) {
          if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung' || (typeof t === 'string' ? t : t.name) === 'einführung')) continue
          if (f.thema === 'Einrichtung' || f.thema === 'Einrichtungstest' || f.thema === 'Einführung') continue
        }
        const key = `${f.fach}|${f.thema}`
        if (!map.has(key)) map.set(key, f.fach)
      }
      setVerfuegbareThemen(
        [...map.entries()].map(([key, fach]) => ({ fach, thema: key.split('|')[1] }))
          .sort((a, b) => a.fach.localeCompare(b.fach) || a.thema.localeCompare(b.thema))
      )
    })
  }, [aktiveGruppe])

  if (!einstellungen || !aktiveGruppe) {
    return <p className="text-sm text-slate-400">Keine Einstellungen geladen.</p>
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

  const handleNameSpeichern = async () => {
    const name = neuerName.trim()
    if (!name || !aktiveGruppe) return
    setNameStatus('laden')
    setNameFehler('')
    try {
      await uebenGruppenAdapter.umbenneGruppe(aktiveGruppe.id, name)
      // Lokalen State aktualisieren
      useUebenGruppenStore.setState(s => ({
        aktiveGruppe: s.aktiveGruppe ? { ...s.aktiveGruppe, name } : null,
        gruppen: s.gruppen.map(g => g.id === aktiveGruppe.id ? { ...g, name } : g),
      }))
      setNameBearbeiten(false)
      setNameStatus('ok')
      setTimeout(() => setNameStatus('idle'), 2000)
    } catch (e) {
      setNameFehler(e instanceof Error ? e.message : 'Umbenennen fehlgeschlagen')
      setNameStatus('fehler')
    }
  }

  const fokus = einstellungen.fokusThema
  const fokusKey = fokus ? `${fokus.fach}|${fokus.thema}` : ''

  return (
    <div className="space-y-6">
      {/* Gruppeninfo */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 space-y-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Gruppenname</p>
          {nameBearbeiten ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={neuerName}
                onChange={e => setNeuerName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNameSpeichern() }}
                className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:border-slate-500"
                autoFocus
              />
              <button
                onClick={handleNameSpeichern}
                disabled={!neuerName.trim() || nameStatus === 'laden'}
                className="px-3 py-2 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg text-sm font-medium min-h-[44px] disabled:opacity-50 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
              >
                {nameStatus === 'laden' ? '…' : '✓'}
              </button>
              <button
                onClick={() => { setNameBearbeiten(false); setNameFehler('') }}
                className="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm min-h-[44px]"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-medium dark:text-white">{aktiveGruppe.name}</p>
              <button
                onClick={() => { setNeuerName(aktiveGruppe.name); setNameBearbeiten(true); setNameStatus('idle') }}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✏️
              </button>
              {nameStatus === 'ok' && <span className="text-xs text-green-500">Gespeichert ✓</span>}
            </div>
          )}
          {nameFehler && <p className="text-xs text-red-500 mt-1">{nameFehler}</p>}
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Typ</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aktiveGruppe.typ === 'familie' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'}`}>
            {aktiveGruppe.typ === 'familie' ? 'Familie' : 'Gymnasium'}
          </span>
        </div>
      </div>

      {/* Anrede */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
        <p className="text-sm font-medium dark:text-white mb-3">Anrede</p>
        <div className="flex gap-2">
          {(['sie', 'du'] as const).map((wert) => (
            <button
              key={wert}
              onClick={() => aktualisiereEinstellungen({ anrede: wert })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${einstellungen.anrede === wert ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
              {wert === 'sie' ? 'Sie' : 'Du'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback-Stil */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
        <p className="text-sm font-medium dark:text-white mb-3">Feedback-Stil</p>
        <div className="flex gap-2">
          {([{ id: 'sachlich', label: 'Sachlich' }, { id: 'ermutigend', label: 'Ermutigend' }] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => aktualisiereEinstellungen({ feedbackStil: id })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium min-h-[44px] transition-colors ${einstellungen.feedbackStil === id ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Fokusthema */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
        <p className="text-sm font-medium dark:text-white mb-1">Fokusthema</p>
        <p className="text-xs text-slate-400 mb-3">Wird den SuS prominent empfohlen. Optional.</p>
        <select
          value={fokusKey}
          onChange={e => {
            if (!e.target.value) {
              aktualisiereEinstellungen({ fokusThema: undefined })
            } else {
              const [fach, thema] = e.target.value.split('|')
              aktualisiereEinstellungen({ fokusThema: { fach, thema } })
            }
          }}
          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
        >
          <option value="">Kein Fokusthema</option>
          {verfuegbareThemen.map(t => (
            <option key={`${t.fach}|${t.thema}`} value={`${t.fach}|${t.thema}`}>
              {t.fach} — {t.thema}
            </option>
          ))}
        </select>
      </div>

      {/* Mastery-Schwellwerte */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
        <div>
          <p className="text-sm font-medium dark:text-white mb-1">Mastery-Schwellwerte</p>
          <p className="text-xs text-slate-400">Bestimmt, ab wann Fragen als "gefestigt" oder "gemeistert" gelten.</p>
        </div>
        {([
          { key: 'gefestigt' as const, label: 'Gefestigt ab', suffix: 'richtig in Folge', min: 2, max: 10 },
          { key: 'gemeistert' as const, label: 'Gemeistert ab', suffix: 'richtig in Folge', min: 3, max: 15 },
          { key: 'gemeistertMinSessions' as const, label: 'Gemeistert erfordert mind.', suffix: 'verschiedene Sessions', min: 1, max: 5 },
        ]).map(({ key, label, suffix, min, max }) => {
          const wert = einstellungen.masterySchwellwerte?.[key] ?? DEFAULT_MASTERY_SCHWELLWERTE[key]
          return (
            <div key={key} className="flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300 w-44 shrink-0">{label}</label>
              <input
                type="range"
                min={min}
                max={max}
                value={wert}
                onChange={e => aktualisiereEinstellungen({
                  masterySchwellwerte: {
                    ...DEFAULT_MASTERY_SCHWELLWERTE,
                    ...einstellungen.masterySchwellwerte,
                    [key]: Number(e.target.value),
                  },
                })}
                className="flex-1 accent-slate-600 dark:accent-slate-400"
              />
              <span className="text-sm font-mono text-slate-700 dark:text-slate-300 w-6 text-center">{wert}</span>
              <span className="text-xs text-slate-400 w-32 shrink-0">{suffix}</span>
            </div>
          )
        })}
      </div>

      {/* Max aktuelle Themen */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
        <h4 className="font-medium mb-1">Maximale aktuelle Themen</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Wie viele Themen dürfen gleichzeitig als «aktuell» markiert sein?
          Bei Überschreitung wird das älteste automatisch freigegeben.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={20}
            value={einstellungen.maxAktiveThemen ?? 5}
            onChange={e => aktualisiereEinstellungen({ maxAktiveThemen: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="text-sm font-mono w-8 text-center">
            {einstellungen.maxAktiveThemen ?? 5}
          </span>
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
