import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { KorrekturDetailDaten, KorrekturDetailBewertung } from '../../services/apiService.ts'
import AudioPlayer from '../AudioPlayer.tsx'
import MediaAnhang from '../MediaAnhang.tsx'
import FeedbackButton from '../shared/FeedbackButton.tsx'
import { formatDatum } from '../../utils/zeit.ts'
import { driveStreamUrl } from '../../utils/mediaUtils.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import Tooltip from '../ui/Tooltip.tsx'

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
            >
              <Tooltip text="Zurück zur Liste"><span>← Zurück</span></Tooltip>
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
            {daten.pdfFreigegeben && (
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <Tooltip text="Korrektur als PDF drucken/speichern"><span>PDF</span></Tooltip>
              </button>
            )}
            <FeedbackButton
              variant="icon"
              context={{ rolle: 'sus', ort: 'einsicht-allgemein', pruefungId, modus: 'pruefen', bildschirm: 'einsicht' }}
            />
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
              antwort={daten.antworten[frage.id]}
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
  antwort: unknown
}

function FrageKarte({ index, frage, bewertung, antwort }: FrageKarteProps) {
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
      {(frage.fragetext || frage.aufgabentext || frage.geschaeftsfall) && (
        <p className="text-sm text-slate-700 dark:text-slate-200 mb-3 whitespace-pre-wrap">
          {frage.fragetext || frage.aufgabentext || frage.geschaeftsfall}
        </p>
      )}

      {/* Frage-Anhänge */}
      {frage.anhaenge && frage.anhaenge.length > 0 && (
        <div className="space-y-2 mb-3">
          {frage.anhaenge.map((a) => (
            <MediaAnhang key={a.id} anhang={a} />
          ))}
        </div>
      )}

      {/* MC-Optionen mit Korrektur-Icons */}
      {frage.typ === 'mc' && frage.optionen && (
        <MCKorrektur
          optionen={frage.optionen}
          korrekteOptionen={frage.korrekteOptionen ?? []}
          gewaehlte={(antwort as { typ: 'mc'; gewaehlteOptionen: string[] } | null)?.gewaehlteOptionen ?? []}
        />
      )}

      {/* R/F-Aussagen mit Korrektur-Icons */}
      {frage.typ === 'richtigfalsch' && frage.aussagen && (
        <RFKorrektur
          aussagen={frage.aussagen}
          antworten={(antwort as { typ: 'richtigfalsch'; antworten: Record<string, boolean> } | null)?.antworten ?? {}}
        />
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

      {/* Feedback-Link */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
        <FeedbackButton
          variant="link"
          label="Rückmeldung zu dieser Frage"
          context={{
            rolle: 'sus',
            ort: 'einsicht-frage',
            frageId: frage.id,
            frageText: frage.fragetext || frage.aufgabentext || frage.geschaeftsfall || '',
            modus: 'pruefen',
            bildschirm: 'einsicht-frage',
          }}
        />
      </div>
    </div>
  )
}

/** MC-Korrektur: Optionen mit ✓/✗ im Radio-Icon */
function MCKorrektur({ optionen, korrekteOptionen, gewaehlte }: {
  optionen: { id: string; text: string }[]
  korrekteOptionen: string[]
  gewaehlte: string[]
}) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      {optionen.map((opt) => {
        const istGewaehlt = gewaehlte.includes(opt.id)
        const istKorrekt = korrekteOptionen.includes(opt.id)
        // Status: gewählt+korrekt, gewählt+falsch, nicht gewählt+korrekt, nicht gewählt+falsch
        const gewaehltKorrekt = istGewaehlt && istKorrekt
        const gewaehltFalsch = istGewaehlt && !istKorrekt
        const nichtGewaehltKorrekt = !istGewaehlt && istKorrekt

        const borderClass = gewaehltKorrekt
          ? 'border-green-500 bg-green-50 dark:bg-green-900/15'
          : gewaehltFalsch
            ? 'border-red-500 bg-red-50 dark:bg-red-900/15'
            : nichtGewaehltKorrekt
              ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-700'
              : 'border-slate-200 dark:border-slate-700'

        const radioClass = gewaehltKorrekt
          ? 'border-green-600 bg-green-600 dark:border-green-400 dark:bg-green-400'
          : gewaehltFalsch
            ? 'border-red-600 bg-red-600 dark:border-red-400 dark:bg-red-400'
            : nichtGewaehltKorrekt
              ? 'border-green-400 dark:border-green-500'
              : 'border-slate-300 dark:border-slate-600'

        return (
          <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 ${borderClass}`}>
            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${radioClass}`}>
              {gewaehltKorrekt && <span className="text-white dark:text-slate-900">✓</span>}
              {gewaehltFalsch && <span className="text-white dark:text-slate-900">✗</span>}
              {nichtGewaehltKorrekt && <span className="text-green-600 dark:text-green-400">✓</span>}
            </span>
            <div className="flex-1">
              <span className="font-semibold text-slate-500 dark:text-slate-400 mr-2">{opt.id.toUpperCase()})</span>
              <span className="text-slate-800 dark:text-slate-100">{opt.text}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** R/F-Korrektur: Aussagen mit farbigen R/F-Buttons */
function RFKorrektur({ aussagen, antworten }: {
  aussagen: { id: string; text: string; korrekt: boolean }[]
  antworten: Record<string, boolean>
}) {
  return (
    <div className="space-y-2 mb-3">
      {aussagen.map((a) => {
        const susAntwort = antworten[a.id]
        const hatGeantwortet = susAntwort !== undefined
        const istRichtig = hatGeantwortet && susAntwort === a.korrekt

        return (
          <div key={a.id} className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div className="flex-1 text-sm text-slate-700 dark:text-slate-200">{a.text}</div>
            <div className="flex gap-1.5">
              {/* R-Button */}
              <span className={`px-2.5 py-1 rounded text-xs font-semibold border-2 ${
                hatGeantwortet && susAntwort === true
                  ? istRichtig
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500'
                    : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500'
                  : !hatGeantwortet && a.korrekt
                    ? 'border-green-300 text-green-600 dark:border-green-600 dark:text-green-400'
                    : 'border-slate-200 text-slate-400 dark:border-slate-600 dark:text-slate-500'
              }`}>
                R{hatGeantwortet && susAntwort === true && (istRichtig ? ' ✓' : ' ✗')}
              </span>
              {/* F-Button */}
              <span className={`px-2.5 py-1 rounded text-xs font-semibold border-2 ${
                hatGeantwortet && susAntwort === false
                  ? istRichtig
                    ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-500'
                    : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-500'
                  : !hatGeantwortet && !a.korrekt
                    ? 'border-green-300 text-green-600 dark:border-green-600 dark:text-green-400'
                    : 'border-slate-200 text-slate-400 dark:border-slate-600 dark:text-slate-500'
              }`}>
                F{hatGeantwortet && susAntwort === false && (istRichtig ? ' ✓' : ' ✗')}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
