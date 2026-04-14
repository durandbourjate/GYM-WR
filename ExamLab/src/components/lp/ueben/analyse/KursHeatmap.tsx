import { useMemo } from 'react'
import type { FragenFortschritt, MasteryStufe } from '../../../../types/ueben/fortschritt'
import type { Frage } from '../../../../types/ueben/fragen'

interface KursHeatmapProps {
  fragen: Frage[]
  fortschritte: FragenFortschritt[]
  mitgliederNamen: Record<string, string> // email → name
  onSuSKlick?: (email: string, name: string) => void
}

interface ZellenDaten {
  masteryScore: number
  mastery: MasteryStufe
  anzahl: number
}

const MASTERY_FARBEN: Record<MasteryStufe, { bg: string; text: string }> = {
  neu: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
  ueben: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300' },
  gefestigt: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300' },
  gemeistert: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300' },
}

function scoreZuMastery(score: number): MasteryStufe {
  if (score >= 87.5) return 'gemeistert'
  if (score >= 50) return 'gefestigt'
  if (score > 0) return 'ueben'
  return 'neu'
}

export default function KursHeatmap({ fragen, fortschritte, mitgliederNamen, onSuSKlick }: KursHeatmapProps) {
  // Themen extrahieren (aus Fragen)
  const themen = useMemo(() => {
    const set = new Map<string, string>()
    for (const f of fragen) {
      const key = f.thema || 'Allgemein'
      if (!set.has(key)) set.set(key, f.fach || '')
    }
    return [...set.entries()].map(([thema, fach]) => ({ thema, fach })).sort((a, b) => a.thema.localeCompare(b.thema))
  }, [fragen])

  // SuS-Liste (nur lernende mit Fortschritt)
  const susEmails = useMemo(() => {
    const emails = new Set(fortschritte.map(fp => fp.email))
    return [...emails].sort((a, b) => {
      const nameA = mitgliederNamen[a] || a
      const nameB = mitgliederNamen[b] || b
      return nameA.localeCompare(nameB)
    })
  }, [fortschritte, mitgliederNamen])

  // Heatmap-Daten: email → thema → ZellenDaten
  const heatmap = useMemo(() => {
    const map: Record<string, Record<string, ZellenDaten>> = {}

    // Fragen pro Thema
    const themaFragen: Record<string, string[]> = {}
    for (const f of fragen) {
      const t = f.thema || 'Allgemein'
      if (!themaFragen[t]) themaFragen[t] = []
      themaFragen[t].push(f.id)
    }

    for (const email of susEmails) {
      map[email] = {}
      const susFp = fortschritte.filter(fp => fp.email === email)
      const fpMap: Record<string, FragenFortschritt> = {}
      for (const fp of susFp) fpMap[fp.fragenId] = fp

      for (const { thema } of themen) {
        const ids = themaFragen[thema] || []
        if (ids.length === 0) continue

        let totalScore = 0
        for (const id of ids) {
          const fp = fpMap[id]
          if (!fp) continue
          switch (fp.mastery) {
            case 'gemeistert': totalScore += 100; break
            case 'gefestigt': totalScore += 75; break
            case 'ueben': totalScore += 25; break
          }
        }
        const avg = totalScore / ids.length
        map[email][thema] = {
          masteryScore: avg,
          mastery: scoreZuMastery(avg),
          anzahl: ids.length,
        }
      }
    }

    return map
  }, [fragen, fortschritte, susEmails, themen])

  if (susEmails.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        Noch keine Fortschrittsdaten vorhanden.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 font-medium text-slate-500 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-800 min-w-[120px]">
              SuS
            </th>
            {themen.map(({ thema }) => (
              <th key={thema} className="py-2 px-1 font-medium text-slate-500 dark:text-slate-400 text-center min-w-[60px]">
                <span className="block truncate max-w-[80px]" title={thema}>{thema}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {susEmails.map(email => {
            const name = mitgliederNamen[email] || email.split('@')[0]
            return (
              <tr key={email} className="border-t border-slate-100 dark:border-slate-700">
                <td className="py-1.5 px-2 sticky left-0 bg-white dark:bg-slate-800">
                  <button
                    onClick={() => onSuSKlick?.(email, name)}
                    className="text-left font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white truncate max-w-[120px] block"
                    title={name}
                  >
                    {name}
                  </button>
                </td>
                {themen.map(({ thema }) => {
                  const zelle = heatmap[email]?.[thema]
                  if (!zelle) {
                    return <td key={thema} className="py-1.5 px-1 text-center text-slate-300 dark:text-slate-600">—</td>
                  }
                  const { bg, text } = MASTERY_FARBEN[zelle.mastery]
                  return (
                    <td key={thema} className="py-1.5 px-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded ${bg} ${text} font-mono`}>
                        {Math.round(zelle.masteryScore)}%
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
