import { useState, useEffect } from 'react'
import { useUebenSettingsStore } from '../../../../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../../../../store/ueben/gruppenStore'
import { useUebenAuthStore } from '../../../../store/ueben/authStore'
import { uebenGruppenAdapter, uebenFragenAdapter } from '../../../../adapters/ueben/appsScriptAdapter'

interface FachGruppe {
  fach: string
  anzahl: number
  themen: { thema: string; anzahl: number }[]
}

export default function FaecherTab() {
  const { einstellungen, aktualisiereEinstellungen } = useUebenSettingsStore()
  const { aktiveGruppe } = useUebenGruppenStore()
  const { user } = useUebenAuthStore()
  const [fachGruppen, setFachGruppen] = useState<FachGruppe[]>([])
  const [ausgeklappt, setAusgeklappt] = useState<Set<string>>(new Set())
  const [laden, setLaden] = useState(true)
  const [speichern, setSpeichern] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [fehlerText, setFehlerText] = useState('')

  useEffect(() => {
    if (!aktiveGruppe) return
    setLaden(true)
    uebenFragenAdapter.ladeFragen(aktiveGruppe.id).then((fragen) => {
      // Fächer und Themen gruppieren
      const map: Record<string, Record<string, number>> = {}
      for (const f of fragen) {
        if (!map[f.fach]) map[f.fach] = {}
        if (!map[f.fach][f.thema]) map[f.fach][f.thema] = 0
        map[f.fach][f.thema]++
      }
      const gruppen: FachGruppe[] = Object.entries(map).map(([fach, themenMap]) => ({
        fach,
        anzahl: Object.values(themenMap).reduce((s, n) => s + n, 0),
        themen: Object.entries(themenMap).map(([thema, anzahl]) => ({ thema, anzahl })),
      }))
      setFachGruppen(gruppen)
      setLaden(false)
    }).catch(() => setLaden(false))
  }, [aktiveGruppe])

  if (!einstellungen || !aktiveGruppe) {
    return <p className="text-sm text-slate-400">Keine Einstellungen geladen.</p>
  }

  const alleFaecher = fachGruppen.map(g => g.fach)

  // Leere sichtbareFaecher = alle sichtbar
  const fachSichtbar = (fach: string) =>
    einstellungen.sichtbareFaecher.length === 0 || einstellungen.sichtbareFaecher.includes(fach)

  const themaSichtbar = (fach: string, thema: string) => {
    const sichtbareThemenFuerFach = einstellungen.sichtbareThemen[fach]
    return !sichtbareThemenFuerFach || sichtbareThemenFuerFach.length === 0 || sichtbareThemenFuerFach.includes(thema)
  }

  const toggleFach = (fach: string) => {
    const aktuellSichtbar = fachSichtbar(fach)
    let neueList: string[]
    if (aktuellSichtbar) {
      // Ausblenden: Alle ausser diesem
      neueList = alleFaecher.filter(f => f !== fach)
    } else {
      // Einblenden: Hinzufügen
      neueList = einstellungen.sichtbareFaecher.length === 0
        ? alleFaecher // war "alle", jetzt explizit alle ausser dem gerade eingeblendeten
        : [...einstellungen.sichtbareFaecher, fach]
      // Wenn alle sichtbar: zurück zu leerer Liste
      if (neueList.length === alleFaecher.length) neueList = []
    }
    aktualisiereEinstellungen({ sichtbareFaecher: neueList })
  }

  const toggleThema = (fach: string, thema: string) => {
    const gruppe = fachGruppen.find(g => g.fach === fach)
    if (!gruppe) return
    const alleThemen = gruppe.themen.map(t => t.thema)
    const aktuellSichtbar = themaSichtbar(fach, thema)
    const aktuelleListe = einstellungen.sichtbareThemen[fach] || []

    let neueListe: string[]
    if (aktuellSichtbar) {
      neueListe = aktuelleListe.length === 0
        ? alleThemen.filter(t => t !== thema)
        : aktuelleListe.filter(t => t !== thema)
    } else {
      neueListe = aktuelleListe.length === 0
        ? alleThemen
        : [...aktuelleListe, thema]
      if (neueListe.length === alleThemen.length) neueListe = []
    }

    aktualisiereEinstellungen({
      sichtbareThemen: { ...einstellungen.sichtbareThemen, [fach]: neueListe },
    })
  }

  const toggleAusgeklappt = (fach: string) => {
    setAusgeklappt(prev => {
      const next = new Set(prev)
      if (next.has(fach)) next.delete(fach)
      else next.add(fach)
      return next
    })
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
    return <p className="text-sm text-slate-400">Fragen werden geladen…</p>
  }

  if (fachGruppen.length === 0) {
    return <p className="text-sm text-slate-400">Keine Fragen gefunden.</p>
  }

  return (
    <div className="space-y-3">
      {fachGruppen.map(({ fach, anzahl, themen }) => (
        <div key={fach} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Fach-Zeile */}
          <div className="flex items-center gap-3 p-4">
            <input
              type="checkbox"
              checked={fachSichtbar(fach)}
              onChange={() => toggleFach(fach)}
              className="w-4 h-4 rounded"
              id={`fach-${fach}`}
            />
            <label
              htmlFor={`fach-${fach}`}
              className="flex-1 font-medium dark:text-white cursor-pointer"
            >
              {fach} <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">— {anzahl} Fragen</span>
            </label>
            <button
              onClick={() => toggleAusgeklappt(fach)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs"
            >
              {ausgeklappt.has(fach) ? '▲' : '▼'}
            </button>
          </div>

          {/* Themen */}
          {ausgeklappt.has(fach) && (
            <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-3 space-y-2 pt-2">
              {themen.map(({ thema, anzahl: tAnzahl }) => (
                <div key={thema} className="flex items-center gap-3 pl-6">
                  <input
                    type="checkbox"
                    checked={themaSichtbar(fach, thema)}
                    onChange={() => toggleThema(fach, thema)}
                    className="w-4 h-4 rounded"
                    id={`thema-${fach}-${thema}`}
                  />
                  <label
                    htmlFor={`thema-${fach}-${thema}`}
                    className="text-sm dark:text-slate-300 cursor-pointer"
                  >
                    {thema} <span className="text-slate-400 font-normal">({tAnzahl})</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
