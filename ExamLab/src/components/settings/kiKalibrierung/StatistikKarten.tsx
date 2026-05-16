import { useState, useEffect } from 'react'
import { Target, Check, AlertTriangle, X, Star } from 'lucide-react'
import { kalibrierungApi, type KalibrierungsStatistik, type KalibrierungsEinstellungen } from '../../../services/kalibrierungApi'

export default function StatistikKarten({ email }: { email: string }) {
  const [tage, setTage] = useState<number>(30)
  const [stats, setStats] = useState<KalibrierungsStatistik | null>(null)
  const [einst, setEinst] = useState<KalibrierungsEinstellungen | null>(null)
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)

  useEffect(() => {
    kalibrierungApi.statistik(email, tage)
      .then(s => { if (s) setStats(s); else setLadeFehler('Statistik konnte nicht geladen werden') })
      .catch(() => setLadeFehler('Netzwerkfehler beim Laden der Statistik'))
    kalibrierungApi.ladeEinstellungen(email)
      .then(e => { if (e) setEinst(e) })
      .catch(() => {})
  }, [email, tage])

  if (ladeFehler) return <p className="text-sm text-red-500">{ladeFehler}</p>
  if (!stats || !einst) return <p className="text-sm text-slate-500 dark:text-slate-400">Lädt…</p>

  // Defensive: Backend-Shape kann unerwartet sein (z.B. bei Version-Mismatch)
  const aktionenSafe = (stats.kiAktionen && typeof stats.kiAktionen === 'object') ? stats.kiAktionen : {}

  // B5-Onboarding: Wenn KI-Kalibrierung noch nie aktiviert wurde, klarer Call-to-Action
  const gesamtVorschlaege = Object.values(aktionenSafe).reduce((s, a) => s + (a?.vorschlaege ?? 0), 0)
  if (!einst.global && gesamtVorschlaege === 0) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
        <Target className="w-8 h-8 mx-auto text-slate-500 dark:text-slate-400" />
        <p className="font-semibold dark:text-white">KI-Kalibrierung ist noch nicht aktiv.</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Aktiviere sie im Einstellungen-Tab, damit die KI aus deinen Korrekturen lernen kann.
          Die ersten {einst.minBeispiele} Beispiele bilden die Basis — erst danach werden Vorschläge an deinen Stil angepasst.
        </p>
      </div>
    )
  }

  const unveraendertAbs = Object.values(aktionenSafe).reduce((s, a) => s + (a?.unveraendert ?? 0), 0)
  const rate = gesamtVorschlaege > 0 ? Math.round(100 * unveraendertAbs / gesamtVorschlaege) : 0

  const aktionsLabels: Record<string, string> = {
    generiereMusterloesung: 'Musterlösung',
    klassifiziereFrage: 'Klassifikation (Fach/Bloom)',
    bewertungsrasterGenerieren: 'Bewertungsraster',
    korrigiereFreitext: 'Freitext-Korrektur',
  }

  const pct = (x: number, ges: number) => ges > 0 ? Math.round(100 * x / ges) + '%' : '—'

  return (
    <div className="space-y-4">
      {/* Zeitraum-Toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 dark:text-slate-300">Zeitraum:</span>
        <select value={tage} onChange={e => setTage(parseInt(e.target.value, 10))}
          className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white text-sm">
          <option value={7}>7 Tage</option>
          <option value={30}>30 Tage</option>
          <option value={90}>90 Tage</option>
        </select>
      </div>

      {/* Globale Kennzahl */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        <p className="text-sm dark:text-slate-200">
          Akzeptanz-Trend: <strong className="text-lg">{rate}%</strong> unverändert übernommen
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
            ({unveraendertAbs} von {gesamtVorschlaege} Vorschlägen)
          </span>
        </p>
      </div>

      {/* Karten pro Aktion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(aktionenSafe).map(([a, s]) => (
          <div key={a} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
            <h4 className="font-semibold dark:text-white">{aktionsLabels[a] ?? a}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Letzte {tage} Tage: {s.vorschlaege} Vorschläge</p>
            <ul className="text-sm space-y-1 dark:text-slate-200">
              <li className="inline-flex items-center gap-1.5 w-full"><Check className="w-3.5 h-3.5 text-green-500" /> unverändert übernommen: {s.unveraendert} <span className="text-slate-400">({pct(s.unveraendert, s.vorschlaege)})</span></li>
              <li>≈ leicht angepasst: {s.leicht} <span className="text-slate-400">({pct(s.leicht, s.vorschlaege)})</span></li>
              <li className="inline-flex items-center gap-1.5 w-full"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> deutlich umgeschrieben: {s.deutlich} <span className="text-slate-400">({pct(s.deutlich, s.vorschlaege)})</span></li>
              <li className="inline-flex items-center gap-1.5 w-full"><X className="w-3.5 h-3.5 text-red-500" /> verworfen: {s.verworfen} <span className="text-slate-400">({pct(s.verworfen, s.vorschlaege)})</span></li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
              Aktive Trainings-Beispiele: <strong>{s.aktive}</strong>
              {s.aktive < einst.minBeispiele && s.vorschlaege > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-2">({s.aktive}/{einst.minBeispiele} bis Kalibrierung startet)</span>
              )}
              {s.wichtige > 0 && <span className="ml-2 inline-flex items-center gap-1">({s.wichtige} <Star className="w-3 h-3 text-yellow-500" />)</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Ansatz-3 Placeholder */}
      <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 opacity-60">
        <p className="text-sm dark:text-slate-300">
          Details zu Few-Shot-Verwendung (noch nicht verfügbar — benötigt Embedding-Infrastruktur, Ansatz 3)
        </p>
      </div>
    </div>
  )
}
