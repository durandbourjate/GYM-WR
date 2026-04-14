interface Props {
  fach: string
  thema: string
  fortschritt: number
  gesamt: number
  score: number
  schwierigkeit: number
  typ: string
}

const SCHWIERIGKEIT = ['', 'Einfach', 'Mittel', 'Schwer']
const SCHWIERIGKEIT_FARBE = [
  '',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
]

export default function QuizHeader({ fach, thema, fortschritt, gesamt, score, schwierigkeit, typ }: Props) {
  const pct = gesamt > 0 ? (fortschritt / gesamt) * 100 : 0

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {fach} — {thema}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{score} Pkt.</span>
          <span className="text-sm font-medium dark:text-white">
            {fortschritt}/{gesamt}
          </span>
        </div>
      </div>
      <div className="h-1 bg-slate-200 dark:bg-slate-700">
        <div
          className="h-1 bg-slate-600 dark:bg-slate-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Badges */}
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${SCHWIERIGKEIT_FARBE[schwierigkeit] || ''}`}>
          {SCHWIERIGKEIT[schwierigkeit] || `Stufe ${schwierigkeit}`}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500 uppercase">{typ}</span>
      </div>
    </div>
  )
}
