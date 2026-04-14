import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { KorrekturListeEintrag } from '../../services/apiService.ts'
import { formatDatum } from '../../utils/zeit.ts'

interface Props {
  onWaehle: (pruefungId: string) => void
}

/**
 * Liste der freigegebenen Korrekturen für SuS.
 * Wird innerhalb von SuSStartseite gerendert — Header kommt von dort.
 */
export default function KorrekturListe({ onWaehle }: Props) {
  const user = useAuthStore((s) => s.user)
  const [korrekturen, setKorrekturen] = useState<KorrekturListeEintrag[]>([])
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLaden(true)
    apiService.ladeKorrekturenFuerSuS(user.email).then((result) => {
      if (result) {
        setKorrekturen(result)
      } else {
        setFehler('Korrekturen konnten nicht geladen werden.')
      }
      setLaden(false)
    })
  }, [user])

  return (
    <div className="space-y-3">
        {laden && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            Lade Korrekturen...
          </div>
        )}

        {fehler && (
          <div className="text-center py-12 text-red-500">{fehler}</div>
        )}

        {!laden && !fehler && korrekturen.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-400 dark:text-slate-500">
              Keine freigegebenen Korrekturen vorhanden.
            </p>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 max-w-sm mx-auto space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Wenn Sie eine Prüfung ablegen möchten, verwenden Sie den <strong>Prüfungslink</strong> Ihrer Lehrperson.
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Korrigierte Prüfungen erscheinen hier automatisch, sobald die Lehrperson die Einsicht freigibt.
              </p>
            </div>
          </div>
        )}

        {korrekturen.map((k) => (
          <button
            key={k.pruefungId}
            onClick={() => onWaehle(k.pruefungId)}
            className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-slate-800 dark:text-slate-100">{k.titel}</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {k.datum ? formatDatum(k.datum) : ''} {k.klasse && `· ${k.klasse}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                  {k.gesamtPunkte} / {k.maxPunkte}
                </span>
                {k.note !== undefined && (
                  <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                    k.note >= 4
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {k.note.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
    </div>
  )
}
