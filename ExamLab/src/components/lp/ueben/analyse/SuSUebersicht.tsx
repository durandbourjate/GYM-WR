import { useMemo, useState } from 'react'
import type { FragenFortschritt, SessionEintrag } from '../../../../types/ueben/fortschritt'

interface SuSUebersichtProps {
  fortschritte: FragenFortschritt[]
  sessions: SessionEintrag[]
  mitgliederNamen: Record<string, string>
  onSuSKlick?: (email: string, name: string) => void
}

interface SuSZeile {
  email: string
  name: string
  masteryQuote: number  // 0–100
  anzahlVersuche: number
  letzteAktivitaet: string
  sessionAnzahl: number
}

type Sortierung = 'name' | 'mastery' | 'aktivitaet' | 'sessions'

export default function SuSUebersicht({ fortschritte, sessions, mitgliederNamen, onSuSKlick }: SuSUebersichtProps) {
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [absteigend, setAbsteigend] = useState(false)

  const zeilen = useMemo(() => {
    const emailSet = new Set([
      ...fortschritte.map(fp => fp.email),
      ...Object.keys(mitgliederNamen),
    ])

    const ergebnis: SuSZeile[] = []

    for (const email of emailSet) {
      const susFp = fortschritte.filter(fp => fp.email === email)
      const susSessions = sessions.filter(s => s.email === email)

      let totalScore = 0
      let totalFragen = 0
      let letzterVersuch = ''

      for (const fp of susFp) {
        totalFragen++
        switch (fp.mastery) {
          case 'gemeistert': totalScore += 100; break
          case 'gefestigt': totalScore += 75; break
          case 'ueben': totalScore += 25; break
        }
        if (fp.letzterVersuch > letzterVersuch) letzterVersuch = fp.letzterVersuch
      }

      ergebnis.push({
        email,
        name: mitgliederNamen[email] || email.split('@')[0],
        masteryQuote: totalFragen > 0 ? totalScore / totalFragen : 0,
        anzahlVersuche: susFp.reduce((sum, fp) => sum + fp.versuche, 0),
        letzteAktivitaet: letzterVersuch,
        sessionAnzahl: susSessions.length,
      })
    }

    return ergebnis
  }, [fortschritte, sessions, mitgliederNamen])

  const sortiert = useMemo(() => {
    const sorted = [...zeilen].sort((a, b) => {
      switch (sortierung) {
        case 'name': return a.name.localeCompare(b.name)
        case 'mastery': return a.masteryQuote - b.masteryQuote
        case 'aktivitaet': return a.letzteAktivitaet.localeCompare(b.letzteAktivitaet)
        case 'sessions': return a.sessionAnzahl - b.sessionAnzahl
      }
    })
    return absteigend ? sorted.reverse() : sorted
  }, [zeilen, sortierung, absteigend])

  const handleSort = (s: Sortierung) => {
    if (sortierung === s) setAbsteigend(!absteigend)
    else { setSortierung(s); setAbsteigend(s !== 'name') }
  }

  const sortIcon = (s: Sortierung) => sortierung === s ? (absteigend ? ' ↓' : ' ↑') : ''

  if (zeilen.length === 0) {
    return <div className="text-center py-6 text-slate-400 text-sm">Keine Mitglieder-Daten.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <th className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => handleSort('name')}>
              Name{sortIcon('name')}
            </th>
            <th className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => handleSort('mastery')}>
              Mastery{sortIcon('mastery')}
            </th>
            <th className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-center" onClick={() => handleSort('sessions')}>
              Sessions{sortIcon('sessions')}
            </th>
            <th className="py-2 px-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 text-right" onClick={() => handleSort('aktivitaet')}>
              Letzte Aktivität{sortIcon('aktivitaet')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortiert.map(z => (
            <tr key={z.email} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-2.5 px-2">
                <button
                  onClick={() => onSuSKlick?.(z.email, z.name)}
                  className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  {z.name}
                </button>
              </td>
              <td className="py-2.5 px-2 text-center">
                <MasteryBar quote={z.masteryQuote} />
              </td>
              <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400">
                {z.sessionAnzahl}
              </td>
              <td className="py-2.5 px-2 text-right text-slate-400 dark:text-slate-500 text-xs">
                {z.letzteAktivitaet ? formatDatum(z.letzteAktivitaet) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MasteryBar({ quote }: { quote: number }) {
  const pct = Math.round(quote)
  const farbe = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-400' : pct >= 25 ? 'bg-yellow-400' : 'bg-slate-300'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className={`${farbe} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

function formatDatum(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' })
  } catch { return '—' }
}
