import { useState, useEffect, useRef, useCallback } from 'react'
import { kalibrierungApi, type KalibrierungsEinstellungen } from '../../../services/kalibrierungApi'

export default function KalibrierungsEinstellungen({ email }: { email: string }) {
  const [konfig, setKonfig] = useState<KalibrierungsEinstellungen | null>(null)
  const [saving, setSaving] = useState(false)
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)
  const [saveFehler, setSaveFehler] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    kalibrierungApi.ladeEinstellungen(email).then(k => {
      if (k) setKonfig(k)
      else setLadeFehler('Einstellungen konnten nicht geladen werden')
    }).catch(() => setLadeFehler('Netzwerkfehler beim Laden'))
  }, [email])

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
  }, [])

  if (ladeFehler) return <p className="text-sm text-red-500">{ladeFehler}</p>
  if (!konfig) return <p className="text-slate-500 dark:text-slate-400">Lädt…</p>

  const update = useCallback((patch: Partial<KalibrierungsEinstellungen>) => {
    if (!konfig) return
    const neu = { ...konfig, ...patch }
    setKonfig(neu)
    setSaveFehler(null)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaving(true)
      kalibrierungApi.speichereEinstellungen(email, neu)
        .then(ok => { if (!ok) setSaveFehler('Speichern fehlgeschlagen — bitte erneut versuchen') })
        .finally(() => setSaving(false))
    }, 500)
  }, [email, konfig])

  async function bulkLoeschen(status: string) {
    if (!confirm(`Alle Einträge mit Status "${status}" löschen?`)) return
    await kalibrierungApi.bulkLoesche(email, { status })
  }

  async function bulkLoeschenAeltere(tage: number) {
    if (!confirm(`Alle Einträge älter als ${tage} Tage löschen?`)) return
    const iso = new Date(Date.now() - tage * 86400 * 1000).toISOString()
    await kalibrierungApi.bulkLoesche(email, { aelter_als: iso })
  }

  return (
    <div className="space-y-6">
      {/* Quota-Warn-Banner */}
      {konfig.zeigeQuotaWarnung && (
        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-700">
          KI-Kalibrierung wurde wegen API-Quota automatisch deaktiviert. Bitte prüfe deine Anthropic-Kosten bevor du wieder aktivierst.
        </div>
      )}

      {/* Master-Toggle */}
      <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={konfig.global}
          onChange={e => update({ global: e.target.checked })}
        />
        <span className="font-medium dark:text-white">KI-Kalibrierung aktiv</span>
        <span className="text-xs text-slate-500 ml-auto dark:text-slate-400">
          Kill-Switch: stoppt Few-Shot + Logging
        </span>
      </label>

      {/* Pro-Aktion */}
      <fieldset disabled={!konfig.global} className={konfig.global ? '' : 'opacity-50'}>
        <legend className="text-sm font-semibold mb-2 dark:text-white">Aktiv für Aktionen</legend>
        {(
          ['generiereMusterloesung', 'klassifiziereFrage', 'bewertungsrasterGenerieren', 'korrigiereFreitext'] as const
        ).map(a => (
          <label key={a} className="flex items-center gap-2 py-1 dark:text-slate-200">
            <input
              type="checkbox"
              checked={konfig.aktionenAktiv[a]}
              onChange={e =>
                update({ aktionenAktiv: { ...konfig.aktionenAktiv, [a]: e.target.checked } })
              }
            />
            <span>{aktionLabel(a)}</span>
          </label>
        ))}
      </fieldset>

      {/* Werte */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600 dark:text-slate-300">Minimum Beispiele</span>
          <input
            type="number"
            min={0}
            max={20}
            value={konfig.minBeispiele}
            onChange={e => update({ minBeispiele: parseInt(e.target.value, 10) || 0 })}
            className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600 dark:text-slate-300">Beispiele pro KI-Call</span>
          <select
            value={konfig.beispielAnzahl}
            onChange={e => update({ beispielAnzahl: parseInt(e.target.value, 10) })}
            className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm"
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </label>
      </div>

      {/* Aufräumen */}
      <div className="space-y-2 border-t pt-4 dark:border-slate-700">
        <h4 className="text-sm font-semibold dark:text-white">Aufräumen</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => bulkLoeschen('ignoriert')}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200"
          >
            Alle ignorierten löschen
          </button>
          <button
            onClick={() => bulkLoeschenAeltere(180)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200"
          >
            Älter als 180 Tage löschen
          </button>
        </div>
      </div>

      {/* Ansatz-3 Placeholder */}
      <div className="space-y-2 border-t pt-4 opacity-60 dark:border-slate-700">
        <h4 className="text-sm font-semibold dark:text-white">Ausblick: Teilen (noch nicht verfügbar)</h4>
        <label className="flex items-center gap-2 dark:text-slate-200">
          <input type="checkbox" disabled /> Mit Fachschaft teilen
        </label>
        <label className="flex items-center gap-2 dark:text-slate-200">
          <input type="checkbox" disabled /> Schulweit teilen
        </label>
      </div>

      {saveFehler && (
        <div className="p-2 rounded border border-red-300 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {saveFehler}
        </div>
      )}
      {saving && (
        <p className="text-xs text-slate-400 dark:text-slate-500">Speichern…</p>
      )}
    </div>
  )
}

function aktionLabel(a: string): string {
  const map: Record<string, string> = {
    generiereMusterloesung: 'Musterlösung generieren',
    klassifiziereFrage: 'Frage klassifizieren (Fach/Thema/Bloom)',
    bewertungsrasterGenerieren: 'Bewertungsraster generieren',
    korrigiereFreitext: 'Freitext-Korrektur (Punkte/Begründung)',
  }
  return map[a] ?? a
}
