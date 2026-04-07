import { useEffect, useState } from 'react'
import { getJson, istKonfiguriert } from '../../services/apiClient'

interface AktivePruefung {
  id: string
  titel: string
  typ: string
  modus: string
  datum: string
  phase: 'lobby' | 'aktiv'
  fachbereiche: string[]
  klasse: string
}

interface AktivePruefungenProps {
  email: string
}

/**
 * Zeigt aktive Prüfungen/Übungen die der SuS betreten kann.
 * - phase='lobby': SuS ist in Teilnehmerliste, Prüfung noch nicht freigeschaltet → Warteraum
 * - phase='aktiv': Prüfung freigeschaltet → direkt starten
 * Pollt alle 30 Sekunden.
 */
export default function AktivePruefungen({ email }: AktivePruefungenProps) {
  const [pruefungen, setPruefungen] = useState<AktivePruefung[]>([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!email || !istKonfiguriert()) {
      setLaden(false)
      return
    }

    let aktiv = true

    const lade = async () => {
      try {
        const response = await getJson<{ success: boolean; data: AktivePruefung[] }>(
          'ladeAktivePruefungenFuerSuS',
          { email }
        )
        if (aktiv && response?.data) {
          setPruefungen(response.data)
        }
      } catch {
        // Still fehlschlagen — kein Backend-Zugang oder alter Deploy
      }
      if (aktiv) setLaden(false)
    }

    lade()
    const interval = setInterval(lade, 30000)

    return () => {
      aktiv = false
      clearInterval(interval)
    }
  }, [email])

  if (laden || pruefungen.length === 0) return null

  return (
    <div className="w-full max-w-2xl mb-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-3">
        Aktive Prüfungen & Übungen
      </h3>
      <div className="space-y-2">
        {pruefungen.map(p => {
          const istLobby = p.phase === 'lobby'
          return (
            <a
              key={p.id}
              href={`?id=${p.id}`}
              className={`block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 transition-all ${
                istLobby
                  ? 'border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md'
                  : 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{p.typ === 'formativ' ? '📚' : '📝'}</span>
                    <span className="font-medium dark:text-white text-sm">{p.titel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{p.typ === 'formativ' ? 'Übung' : 'Prüfung'}</span>
                    {p.klasse && <span>· {p.klasse}</span>}
                    {p.fachbereiche.length > 0 && (
                      <span>· {p.fachbereiche.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {istLobby ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Warteraum</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Bereit</span>
                    </>
                  )}
                  <span className="text-slate-400 text-lg">→</span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
