import { useState, useEffect } from 'react'
import { useUebenSettingsStore } from '../../../../store/ueben/settingsStore'
import { useUebenGruppenStore } from '../../../../store/ueben/gruppenStore'
import { useUebenAuthStore } from '../../../../store/ueben/authStore'
import { uebenGruppenAdapter, uebenFragenAdapter } from '../../../../adapters/ueben/appsScriptAdapter'
import type { GruppenEinstellungen } from '../../../../types/ueben/settings'

interface FachGruppe {
  fach: string
  anzahl: number
  themen: { thema: string; anzahl: number }[]
}

export default function FaecherTab() {
  const { einstellungen, aktualisiereEinstellungen } = useUebenSettingsStore()
  const { aktiveGruppe, gruppen } = useUebenGruppenStore()
  const { user } = useUebenAuthStore()
  const [fachGruppen, setFachGruppen] = useState<FachGruppe[]>([])
  const [ausgeklappt, setAusgeklappt] = useState<Set<string>>(new Set())
  const [laden, setLaden] = useState(true)
  const [speichern, setSpeichern] = useState<'idle' | 'laden' | 'ok' | 'fehler'>('idle')
  const [fehlerText, setFehlerText] = useState('')
  // Bundle 13 I: Einstellungen pro Gruppe (für "Freigeschaltete Fächer pro Kurs")
  const [einstellungenProGruppe, setEinstellungenProGruppe] = useState<Record<string, GruppenEinstellungen>>({})

  // Lade Einstellungen aller Gruppen (für Fachfreischaltungs-Sektion)
  useEffect(() => {
    let abgebrochen = false
    ;(async () => {
      const entries = await Promise.all(gruppen.map(async g => {
        try {
          const e = await uebenGruppenAdapter.ladeEinstellungen(g.id)
          return [g.id, e] as const
        } catch {
          return null
        }
      }))
      if (abgebrochen) return
      const map: Record<string, GruppenEinstellungen> = {}
      for (const entry of entries) {
        if (entry) map[entry[0]] = entry[1]
      }
      setEinstellungenProGruppe(map)
    })()
    return () => { abgebrochen = true }
  }, [gruppen])

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

      {/* Bundle 13 I: Freigeschaltete Fächer pro Kurs */}
      {gruppen.length > 0 && alleFaecher.length > 0 && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
            Freigeschaltete Fächer pro Kurs
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Welche Fächer die SuS im jeweiligen Kurs sehen. Leer lassen = alle Fächer sichtbar.
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3 space-y-1">
            {gruppen.map(gruppe => {
              const gruppenEinst = einstellungenProGruppe[gruppe.id]
              const sichtbare = gruppenEinst?.sichtbareFaecher ?? []
              return (
                <div key={gruppe.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 min-w-[160px]">
                    {gruppe.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {!gruppenEinst ? (
                      <span className="text-xs text-slate-400 italic">Einstellungen werden geladen…</span>
                    ) : alleFaecher.map(fach => {
                      const aktiv = sichtbare.length === 0 || sichtbare.includes(fach)
                      return (
                        <button
                          key={fach}
                          onClick={async () => {
                            if (!user?.email) return
                            const neueListe = sichtbare.length === 0
                              ? alleFaecher.filter(f => f !== fach) // war "alle" → alle ausser diesem
                              : sichtbare.includes(fach)
                                ? sichtbare.filter(f => f !== fach)
                                : [...sichtbare, fach]
                            const normalisiert = neueListe.length === alleFaecher.length ? [] : neueListe
                            const neu: GruppenEinstellungen = { ...gruppenEinst, sichtbareFaecher: normalisiert }
                            // Optimistic
                            setEinstellungenProGruppe(prev => ({ ...prev, [gruppe.id]: neu }))
                            try {
                              await uebenGruppenAdapter.speichereEinstellungen(gruppe.id, neu, user.email)
                            } catch (err) {
                              console.error('[FaecherTab] Speichern fehlgeschlagen:', err)
                            }
                          }}
                          className={`filter-btn ${aktiv ? 'filter-btn-active' : ''}`}
                          title={aktiv ? `${fach} deaktivieren` : `${fach} aktivieren`}
                        >
                          {fach} {aktiv ? '✓' : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
