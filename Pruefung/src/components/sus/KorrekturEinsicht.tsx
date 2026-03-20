import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { KorrekturDetailDaten, KorrekturDetailBewertung } from '../../services/apiService.ts'
import AudioPlayer from '../AudioPlayer.tsx'
import MediaAnhang from '../MediaAnhang.tsx'
import { formatDatum } from '../../utils/zeit.ts'
import { driveStreamUrl } from '../../utils/mediaUtils.ts'
import ThemeToggle from '../ThemeToggle.tsx'

interface Props {
  pruefungId: string
  onZurueck: () => void
}

/** Symbol für Bewertung */
function bewertungsSymbol(punkte: number, maxPunkte: number): string {
  if (maxPunkte === 0) return '—'
  if (punkte === maxPunkte) return '✓'
  if (punkte === 0) return '✗'
  return '~'
}

function bewertungsSymbolFarbe(punkte: number, maxPunkte: number): string {
  if (maxPunkte === 0) return 'text-slate-400'
  if (punkte === maxPunkte) return 'text-green-600 dark:text-green-400'
  if (punkte === 0) return 'text-red-600 dark:text-red-400'
  return 'text-amber-600 dark:text-amber-400'
}

export default function KorrekturEinsicht({ pruefungId, onZurueck }: Props) {
  const user = useAuthStore((s) => s.user)
  const [daten, setDaten] = useState<KorrekturDetailDaten | null>(null)
  const [laden, setLaden] = useState(true)
  const [fehler, setFehler] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLaden(true)
    apiService.ladeKorrekturDetail(pruefungId, user.email).then((result) => {
      if (result) {
        setDaten(result)
      } else {
        setFehler('Korrektur konnte nicht geladen werden.')
      }
      setLaden(false)
    })
  }, [user, pruefungId])

  if (laden) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-slate-400 dark:text-slate-500">Lade Korrektur...</span>
      </div>
    )
  }

  if (fehler || !daten) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
        <span className="text-red-500">{fehler || 'Fehler beim Laden'}</span>
        <button onClick={onZurueck} className="text-sm underline text-slate-500 cursor-pointer">Zurück</button>
      </div>
    )
  }

  const prozent = daten.maxPunkte > 0 ? Math.round(daten.gesamtPunkte / daten.maxPunkte * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onZurueck}
              className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              title="Zurück zur Liste"
            >
              ← Zurück
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{daten.titel}</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {daten.datum ? formatDatum(daten.datum) : ''} {daten.klasse && `· ${daten.klasse}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                {daten.gesamtPunkte} / {daten.maxPunkte} Pkt.
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({prozent}%)</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Gesamt-Audio-Kommentar */}
        {daten.audioGesamtkommentarId && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">Audio-Kommentar der Lehrperson:</span>
            <AudioPlayer src={driveStreamUrl(daten.audioGesamtkommentarId)} />
          </div>
        )}

        {/* Fragen */}
        {daten.fragen.map((frage, idx) => {
          const bewertung = daten.bewertungen[frage.id]
          if (!bewertung) return null

          return (
            <FrageKarte
              key={frage.id}
              index={idx + 1}
              frage={frage}
              bewertung={bewertung}
            />
          )
        })}
      </main>
    </div>
  )
}

interface FrageKarteProps {
  index: number
  frage: KorrekturDetailDaten['fragen'][0]
  bewertung: KorrekturDetailBewertung
}

function FrageKarte({ index, frage, bewertung }: FrageKarteProps) {
  const symbol = bewertungsSymbol(bewertung.punkte, bewertung.maxPunkte)
  const symbolFarbe = bewertungsSymbolFarbe(bewertung.punkte, bewertung.maxPunkte)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 dark:text-slate-500">Frage {index}</span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${symbolFarbe}`}>{symbol}</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            {bewertung.punkte} / {bewertung.maxPunkte}
          </span>
        </div>
      </div>

      {/* Fragetext */}
      {frage.fragetext && (
        <p className="text-sm text-slate-700 dark:text-slate-200 mb-3 whitespace-pre-wrap">{frage.fragetext}</p>
      )}

      {/* Frage-Anhänge */}
      {frage.anhaenge && frage.anhaenge.length > 0 && (
        <div className="space-y-2 mb-3">
          {frage.anhaenge.map((a) => (
            <MediaAnhang key={a.id} anhang={a} />
          ))}
        </div>
      )}

      {/* Kommentar LP */}
      {(bewertung.lpKommentar || bewertung.kiFeedback) && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 px-3 py-2 mt-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Kommentar</span>
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">
            {bewertung.lpKommentar || bewertung.kiFeedback}
          </p>
        </div>
      )}

      {/* Audio-Kommentar */}
      {bewertung.audioKommentarId && (
        <div className="mt-2">
          <AudioPlayer src={driveStreamUrl(bewertung.audioKommentarId)} kompakt />
        </div>
      )}
    </div>
  )
}
