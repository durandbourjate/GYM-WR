import { useState, useMemo } from 'react'
import type { ThemaQuelle } from '../../types/ueben/uebung'
import { getFachFarbe } from '../../utils/ueben/fachFarben'

interface ThemenInfo {
  fach: string
  thema: string
  anzahl: number
}

interface Props {
  themen: ThemenInfo[]
  fachFarben: Record<string, string>
  onStarte: (quellen: ThemaQuelle[]) => void
  onSchliessen: () => void
}

/**
 * Dialog für gemischte Übung: SuS wählt mehrere Themen aus verschiedenen Fächern.
 */
export default function MixSessionDialog({ themen, fachFarben, onStarte, onSchliessen }: Props) {
  const [auswahl, setAuswahl] = useState<Set<string>>(new Set())

  const faecher = useMemo(() => {
    const map = new Map<string, ThemenInfo[]>()
    for (const t of themen) {
      if (!map.has(t.fach)) map.set(t.fach, [])
      map.get(t.fach)!.push(t)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [themen])

  const toggleThema = (key: string) => {
    setAuswahl(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleFach = (fach: string) => {
    const fachThemen = themen.filter(t => t.fach === fach).map(t => `${t.fach}|${t.thema}`)
    const alleAusgewaehlt = fachThemen.every(k => auswahl.has(k))
    setAuswahl(prev => {
      const next = new Set(prev)
      for (const k of fachThemen) {
        if (alleAusgewaehlt) next.delete(k)
        else next.add(k)
      }
      return next
    })
  }

  const ausgewaehlteQuellen: ThemaQuelle[] = [...auswahl].map(k => {
    const [fach, thema] = k.split('|')
    return { fach, thema }
  })

  const gesamtFragen = themen
    .filter(t => auswahl.has(`${t.fach}|${t.thema}`))
    .reduce((sum, t) => sum + t.anzahl, 0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onSchliessen}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold dark:text-white">Gemischte Übung</h2>
          <p className="text-sm text-slate-400 mt-1">Wähle Themen aus verschiedenen Fächern für eine gemischte Session (max. 10 Fragen).</p>
        </div>

        {/* Themen-Liste */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {faecher.map(([fach, fachThemen]) => {
            const farbe = getFachFarbe(fach, fachFarben)
            const fachKeys = fachThemen.map(t => `${t.fach}|${t.thema}`)
            const alleAusgewaehlt = fachKeys.every(k => auswahl.has(k))
            const einigeAusgewaehlt = fachKeys.some(k => auswahl.has(k))

            return (
              <div key={fach}>
                <button
                  onClick={() => toggleFach(fach)}
                  className="flex items-center gap-2 mb-2 cursor-pointer group"
                >
                  <span
                    className="w-3 h-3 rounded-sm border-2 flex items-center justify-center text-[8px]"
                    style={{
                      borderColor: farbe,
                      backgroundColor: alleAusgewaehlt ? farbe : 'transparent',
                      color: alleAusgewaehlt ? 'white' : farbe,
                    }}
                  >
                    {alleAusgewaehlt ? '✓' : einigeAusgewaehlt ? '–' : ''}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: farbe }}>{fach}</span>
                  <span className="text-xs text-slate-400">({fachThemen.length} Themen)</span>
                </button>

                <div className="ml-5 space-y-1">
                  {fachThemen.map(t => {
                    const key = `${t.fach}|${t.thema}`
                    const istAktiv = auswahl.has(key)
                    return (
                      <button
                        key={key}
                        onClick={() => toggleThema(key)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                          istAktiv
                            ? 'bg-slate-100 dark:bg-slate-700'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center text-[9px] shrink-0"
                          style={{
                            borderColor: istAktiv ? farbe : '#94a3b8',
                            backgroundColor: istAktiv ? farbe : 'transparent',
                            color: 'white',
                          }}
                        >
                          {istAktiv ? '✓' : ''}
                        </span>
                        <span className="flex-1 dark:text-slate-200 truncate">{t.thema}</span>
                        <span className="text-xs text-slate-400 shrink-0">{t.anzahl} Fragen</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {auswahl.size} Themen · {gesamtFragen} Fragen verfügbar
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSchliessen}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onStarte(ausgewaehlteQuellen)}
              disabled={auswahl.size < 2}
              className="px-4 py-2 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors min-h-[44px]"
            >
              Übung starten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
