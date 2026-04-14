import { useEffect, useState, useMemo, useCallback } from 'react'
import { useAuthStore } from '../../../store/authStore'
import { useUebenGruppenStore } from '../../../store/ueben/gruppenStore'
import { uebenFragenAdapter } from '../../../adapters/ueben/appsScriptAdapter'
import type { Frage } from '../../../types/ueben/fragen'
import { getFachFarbe } from '../../../utils/ueben/fachFarben'
import { useUebenKontext } from '../../../hooks/ueben/useUebenKontext'

interface Props {
  onKindKlick: (email: string, name: string) => void
  onFachKlick?: (fach: string) => void
}

export default function AdminUebersicht({ onKindKlick, onFachKlick }: Props) {
  const { mitglieder, aktiveGruppe } = useUebenGruppenStore()
  const { fachFarben } = useUebenKontext()
  const lernende = mitglieder.filter(m => m.rolle !== 'admin')
  const admins = mitglieder.filter(m => m.rolle === 'admin')

  // Fragen laden für Statistiken
  const [fragen, setFragen] = useState<Frage[]>([])
  const [laden, setLaden] = useState(false)

  const ladeFragen = useCallback(async () => {
    if (!aktiveGruppe) return
    setLaden(true)
    try {
      const result = await uebenFragenAdapter.ladeFragen(aktiveGruppe.id)
      setFragen(result)
    } catch { /* ignorieren */ }
    finally { setLaden(false) }
  }, [aktiveGruppe])

  useEffect(() => { ladeFragen() }, [ladeFragen])

  // Fragen-Statistiken nach Fach gruppiert
  const fachStats = useMemo(() => {
    const stats: Record<string, { fach: string; anzahl: number; themen: Set<string>; typen: Set<string> }> = {}
    const istDemo = useAuthStore.getState().istDemoModus
    for (const f of fragen) {
      // Einrichtungsfragen ausblenden (Tutorial-Fragen) — ausser im Demo-Modus
      const tags = (f.tags || []) as (string | { name: string })[]
      if (!istDemo) {
        if (tags.some(t => (typeof t === 'string' ? t : t.name) === 'einrichtung' || (typeof t === 'string' ? t : t.name) === 'einführung')) continue
        if (f.thema === 'Einrichtung' || f.thema === 'Einrichtungstest' || f.thema === 'Einführung') continue
      }

      if (!stats[f.fach]) stats[f.fach] = { fach: f.fach, anzahl: 0, themen: new Set(), typen: new Set() }
      stats[f.fach].anzahl++
      if (f.thema) stats[f.fach].themen.add(f.thema)
      stats[f.fach].typen.add(f.typ)
    }
    return Object.values(stats).sort((a, b) => b.anzahl - a.anzahl)
  }, [fragen])

  if (mitglieder.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-4xl mb-3">&#128101;</p>
        <p>Noch keine Mitglieder in dieser Gruppe.</p>
        <p className="text-sm mt-1">Mitglieder können im Tab «Einstellungen» hinzugefügt werden.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gruppen-Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <h3 className="font-semibold dark:text-white mb-2">{aktiveGruppe?.name}</h3>
        <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>{lernende.length} Lernende</span>
          <span>{admins.length} Admin{admins.length !== 1 ? 's' : ''}</span>
          <span>{fragen.length} Fragen</span>
        </div>
      </div>

      {/* Fragen-Statistiken nach Fach */}
      {!laden && fachStats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Fragensammlung
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {fachStats.map(stat => {
              const farbe = getFachFarbe(stat.fach, fachFarben)
              return (
                <button
                  key={stat.fach}
                  onClick={() => onFachKlick?.(stat.fach)}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: farbe }}
                    />
                    <span className="font-medium dark:text-white">{stat.fach}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>{stat.anzahl} Fragen</span>
                      <span>{stat.themen.size} Themen</span>
                      <span>{stat.typen.size} Typen</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-600 text-lg">›</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {laden && (
        <p className="text-sm text-slate-400">Statistiken werden geladen...</p>
      )}

      {/* Lernende */}
      {lernende.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Lernende ({lernende.length})
          </h4>
          <div className="space-y-2">
            {lernende.map((mitglied) => (
              <button
                key={mitglied.email}
                onClick={() => onKindKlick(mitglied.email, mitglied.name)}
                className="w-full text-left bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700 min-h-[48px]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium dark:text-white">{mitglied.name}</span>
                    <span className="text-xs text-slate-400 ml-2">{mitglied.email}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">&#8250;</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Admins */}
      {admins.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Admins ({admins.length})
          </h4>
          <div className="space-y-2">
            {admins.map((mitglied) => (
              <div
                key={mitglied.email}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700"
              >
                <span className="font-medium dark:text-white">{mitglied.name}</span>
                <span className="text-xs text-slate-400 ml-2">{mitglied.email}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
