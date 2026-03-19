import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../types/korrektur.ts'
import type { Frage } from '../../types/fragen.ts'
import { berechneStatistiken, berechneFragenStatistiken } from '../../utils/korrekturUtils.ts'
import type { FragenStatistik } from '../../utils/korrekturUtils.ts'
import { exportiereAlsCSV, downloadCSV } from '../../utils/exportUtils.ts'
import { formatDatum } from '../../utils/zeit.ts'
import ThemeToggle from '../ThemeToggle.tsx'
import KorrekturSchuelerZeile from './KorrekturSchuelerZeile.tsx'

interface Props {
  pruefungId: string
}

type Sortierung = 'name' | 'punkte' | 'status'

export default function KorrekturDashboard({ pruefungId }: Props) {
  const user = useAuthStore((s) => s.user)
  const abmelden = useAuthStore((s) => s.abmelden)

  const [korrektur, setKorrektur] = useState<PruefungsKorrektur | null>(null)
  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [batchLaeuft, setBatchLaeuft] = useState(false)
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'senden' | 'fertig'>('idle')
  const [feedbackErgebnis, setFeedbackErgebnis] = useState<{ erfolg: string[]; fehler: string[] } | null>(null)
  const [analyseOffen, setAnalyseOffen] = useState(false)
  const [analyseSortierung, setAnalyseSortierung] = useState<'frageId' | 'loesungsquote' | 'durchschnitt'>('frageId')
  const [analyseSortierungAsc, setAnalyseSortierungAsc] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Daten laden
  useEffect(() => {
    if (!user) return

    async function lade(): Promise<void> {
      // Korrektur + Abgaben + Fragen parallel laden
      const [korrekturResult, abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeKorrektur(pruefungId, user!.email),
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])

      if (korrekturResult) {
        setKorrektur(korrekturResult)
      }
      if (abgabenResult) {
        setAbgaben(abgabenResult)
      }
      if (pruefungResult) {
        setFragen(pruefungResult.fragen)
      }
      setLadeStatus(korrekturResult || abgabenResult ? 'fertig' : 'fehler')
    }
    lade()
  }, [user, pruefungId])

  // Polling für Batch-Fortschritt
  useEffect(() => {
    if (!batchLaeuft || !user) return

    pollingRef.current = setInterval(async () => {
      const fortschritt = await apiService.ladeKorrekturFortschritt(pruefungId, user!.email)
      if (!fortschritt) return

      if (fortschritt.status === 'fertig' || fortschritt.status === 'fehler') {
        setBatchLaeuft(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
        // Korrektur-Daten neu laden
        const result = await apiService.ladeKorrektur(pruefungId, user!.email)
        if (result) setKorrektur(result)
      } else if (korrektur) {
        setKorrektur((prev) => prev ? {
          ...prev,
          batchStatus: fortschritt.status as PruefungsKorrektur['batchStatus'],
          batchFortschritt: fortschritt.fortschritt,
        } : prev)
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [batchLaeuft, user, pruefungId, korrektur])

  // Note Override aktualisieren
  const handleNoteOverride = useCallback((schuelerEmail: string, noteOverride: number | null) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        schueler: prev.schueler.map((s) => {
          if (s.email !== schuelerEmail) return s
          return { ...s, noteOverride }
        }),
      }
    })

    // Ans Backend senden
    if (user) {
      apiService.speichereKorrekturZeile({
        pruefungId,
        schuelerEmail,
        frageId: '__note_override__',
        lpPunkte: noteOverride,
      }, user.email)
    }
  }, [pruefungId, user])

  // Bewertung aktualisieren (einzelne Frage eines SuS)
  const handleBewertungUpdate = useCallback((schuelerEmail: string, frageId: string, updates: {
    lpPunkte?: number | null
    lpKommentar?: string | null
    geprueft?: boolean
  }) => {
    // Lokal sofort aktualisieren
    setKorrektur((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        schueler: prev.schueler.map((s) => {
          if (s.email !== schuelerEmail) return s
          const bewertung = s.bewertungen[frageId]
          if (!bewertung) return s
          return {
            ...s,
            bewertungen: {
              ...s.bewertungen,
              [frageId]: { ...bewertung, ...updates },
            },
          }
        }),
      }
    })

    // Ans Backend senden (fire-and-forget, kein await nötig)
    if (user) {
      apiService.speichereKorrekturZeile({
        pruefungId,
        schuelerEmail,
        frageId,
        ...updates,
      }, user.email)
    }
  }, [pruefungId, user])

  // KI-Korrektur starten
  async function handleStarteKorrektur(): Promise<void> {
    if (!user) return
    setBatchLaeuft(true)
    setKorrektur((prev) => prev ? { ...prev, batchStatus: 'laeuft', batchFortschritt: { erledigt: 0, gesamt: 1 } } : prev)
    const result = await apiService.starteKorrektur(pruefungId, user.email)
    if (!result?.success) {
      setBatchLaeuft(false)
      setKorrektur((prev) => prev ? { ...prev, batchStatus: 'fehler', batchFehler: result?.fehler ?? 'Unbekannter Fehler' } : prev)
    }
  }

  // Feedback versenden
  async function handleFeedbackSenden(): Promise<void> {
    if (!user || !korrektur) return
    setFeedbackStatus('senden')
    const emails = korrektur.schueler
      .filter((s) => s.korrekturStatus !== 'versendet')
      .map((s) => s.email)

    const result = await apiService.generiereUndSendeFeedback(
      { pruefungId, schuelerEmails: emails },
      user.email,
    )
    setFeedbackErgebnis(result)
    setFeedbackStatus('fertig')
  }

  // Sortierte Schüler-Liste
  const sortierteSchueler = [...(korrektur?.schueler ?? [])].sort((a, b) => {
    switch (sortierung) {
      case 'name': return a.name.localeCompare(b.name)
      case 'punkte': return b.gesamtPunkte - a.gesamtPunkte
      case 'status': return a.korrekturStatus.localeCompare(b.korrekturStatus)
      default: return 0
    }
  })

  const stats = korrektur ? berechneStatistiken(korrektur.schueler) : null

  // Fragen-Statistiken berechnen und sortieren
  const fragenStats: FragenStatistik[] = korrektur ? berechneFragenStatistiken(korrektur) : []
  const sortiertFragenStats = [...fragenStats].sort((a, b) => {
    let cmp = 0
    switch (analyseSortierung) {
      case 'frageId': cmp = a.frageId.localeCompare(b.frageId); break
      case 'loesungsquote': cmp = a.loesungsquote - b.loesungsquote; break
      case 'durchschnitt': cmp = a.durchschnittPunkte - b.durchschnittPunkte; break
    }
    return analyseSortierungAsc ? cmp : -cmp
  })

  function handleAnalyseSortierung(spalte: 'frageId' | 'loesungsquote' | 'durchschnitt'): void {
    if (analyseSortierung === spalte) {
      setAnalyseSortierungAsc((prev) => !prev)
    } else {
      setAnalyseSortierung(spalte)
      setAnalyseSortierungAsc(spalte === 'frageId')
    }
  }

  // CSV-Export
  function handleCSVExport(): void {
    if (!korrektur) return
    const csv = exportiereAlsCSV(korrektur, fragen)
    const dateiname = `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Ergebnisse.csv`
    downloadCSV(csv, dateiname)
  }

  // Zurück-Navigation
  function zurueck(): void {
    window.location.href = window.location.pathname
  }

  if (ladeStatus === 'laden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Korrektur wird geladen...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={zurueck}
              className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            >
              ← Zurück
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Korrektur: {korrektur?.pruefungTitel ?? pruefungId}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {korrektur?.klasse} · {korrektur?.datum ? formatDatum(korrektur.datum) : ''}
                {korrektur && ` · ${korrektur.schueler.length} SuS`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Batch-Button / Fortschritt */}
            {korrektur?.batchStatus === 'idle' && (
              <button
                onClick={handleStarteKorrektur}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                KI-Korrektur starten
              </button>
            )}
            {(korrektur?.batchStatus === 'laeuft' || batchLaeuft) && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
                KI korrigiert...
                {korrektur?.batchFortschritt && (
                  <span className="tabular-nums">
                    {korrektur.batchFortschritt.erledigt}/{korrektur.batchFortschritt.gesamt}
                  </span>
                )}
              </div>
            )}
            {korrektur?.batchStatus === 'fertig' && (
              <button
                onClick={() => setFeedbackDialog(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Feedback senden
              </button>
            )}
            {korrektur?.batchStatus === 'fehler' && (
              <span className="text-sm text-red-600 dark:text-red-400">
                Fehler: {korrektur.batchFehler}
              </span>
            )}
            {korrektur && korrektur.schueler.length > 0 && (
              <button
                onClick={handleCSVExport}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Ergebnisse als CSV exportieren"
              >
                CSV Export
              </button>
            )}
            <button
              onClick={abmelden}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
            >
              Abmelden
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Statistik-Leiste */}
        {stats && korrektur && korrektur.schueler.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
            <StatKarte label="Durchschnitt" wert={`${stats.durchschnitt} Pkt.`} />
            <StatKarte label="∅ Note" wert={stats.durchschnittNote.toFixed(1)} />
            <StatKarte label="Median Note" wert={stats.medianNote.toFixed(1)} />
            <StatKarte label="Median" wert={`${stats.median} Pkt.`} />
            <StatKarte label="Bestanden" wert={`${stats.bestanden}/${korrektur.schueler.length}`} />
            <StatKarte label="Durchgefallen" wert={String(stats.durchgefallen)} highlight={stats.durchgefallen > 0} />
          </div>
        )}

        {/* Fragen-Analyse (Toggle) */}
        {korrektur && korrektur.schueler.length > 0 && fragenStats.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setAnalyseOffen((prev) => !prev)}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span className={`inline-block transition-transform ${analyseOffen ? 'rotate-90' : ''}`}>&#9654;</span>
              Fragen-Analyse
            </button>
            {analyseOffen && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                      <th
                        className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                        onClick={() => handleAnalyseSortierung('frageId')}
                      >
                        Frage-ID {analyseSortierung === 'frageId' && (analyseSortierungAsc ? '↑' : '↓')}
                      </th>
                      <th className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium">Typ</th>
                      <th
                        className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none text-right"
                        onClick={() => handleAnalyseSortierung('durchschnitt')}
                      >
                        Punkte {analyseSortierung === 'durchschnitt' && (analyseSortierungAsc ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none"
                        onClick={() => handleAnalyseSortierung('loesungsquote')}
                      >
                        Losungsquote {analyseSortierung === 'loesungsquote' && (analyseSortierungAsc ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortiertFragenStats.map((stat) => {
                      const farbe = stat.loesungsquote > 70
                        ? 'text-green-700 dark:text-green-400'
                        : stat.loesungsquote >= 40
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                      const barFarbe = stat.loesungsquote > 70
                        ? 'bg-green-500 dark:bg-green-400'
                        : stat.loesungsquote >= 40
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'bg-red-500 dark:bg-red-400'
                      return (
                        <tr key={stat.frageId} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                          <td className="px-4 py-2 font-mono text-slate-800 dark:text-slate-200">{stat.frageId}</td>
                          <td className="px-4 py-2 text-slate-500 dark:text-slate-400 capitalize">{stat.fragenTyp}</td>
                          <td className="px-4 py-2 text-right text-slate-800 dark:text-slate-200 tabular-nums">
                            {stat.durchschnittPunkte} / {stat.maxPunkte}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${barFarbe}`}
                                  style={{ width: `${Math.min(stat.loesungsquote, 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium tabular-nums w-12 text-right ${farbe}`}>
                                {stat.loesungsquote}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sortierung */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-500 dark:text-slate-400">Sortierung:</span>
          {(['name', 'punkte', 'status'] as Sortierung[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortierung(s)}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors cursor-pointer
                ${sortierung === s
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200'
                  : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }
              `}
            >
              {s === 'name' ? 'Name' : s === 'punkte' ? 'Punkte ↓' : 'Status'}
            </button>
          ))}
        </div>

        {/* Kein Daten-Hinweis */}
        {(!korrektur || korrektur.schueler.length === 0) && ladeStatus === 'fertig' && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Noch keine Korrektur-Daten vorhanden.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Starten Sie die KI-Korrektur, sobald alle SuS abgegeben haben.
            </p>
          </div>
        )}

        {/* Schüler-Liste */}
        <div className="space-y-2">
          {sortierteSchueler.map((schueler) => (
            <KorrekturSchuelerZeile
              key={schueler.email}
              schueler={schueler}
              abgabe={abgaben[schueler.email]}
              fragen={fragen}
              onBewertungUpdate={handleBewertungUpdate}
              onNoteOverride={handleNoteOverride}
            />
          ))}
        </div>
      </main>

      {/* Feedback-Dialog */}
      {feedbackDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
            {feedbackStatus === 'idle' && (
              <>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Feedback versenden?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
                  PDFs werden generiert und an {korrektur?.schueler.filter((s) => s.korrekturStatus !== 'versendet').length} SuS per E-Mail versendet.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setFeedbackDialog(false); setFeedbackStatus('idle') }}
                    className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium text-sm"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleFeedbackSenden}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 rounded-lg transition-colors cursor-pointer font-medium text-sm"
                  >
                    Senden
                  </button>
                </div>
              </>
            )}
            {feedbackStatus === 'senden' && (
              <div className="text-center py-4">
                <div className="w-10 h-10 mx-auto mb-3 border-4 border-slate-200 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
                <p className="text-sm text-slate-600 dark:text-slate-300">PDFs werden erstellt und versendet...</p>
              </div>
            )}
            {feedbackStatus === 'fertig' && feedbackErgebnis && (
              <>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Versand abgeschlossen</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                  ✓ {feedbackErgebnis.erfolg.length} erfolgreich versendet
                </p>
                {feedbackErgebnis.fehler.length > 0 && (
                  <p className="text-sm text-red-700 dark:text-red-400 mb-1">
                    ✗ {feedbackErgebnis.fehler.length} fehlgeschlagen
                  </p>
                )}
                <button
                  onClick={() => { setFeedbackDialog(false); setFeedbackStatus('idle') }}
                  className="mt-4 w-full py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg cursor-pointer font-medium text-sm"
                >
                  Schliessen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatKarte({ label, wert, highlight }: { label: string; wert: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-red-50 dark:bg-red-900/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>{wert}</div>
    </div>
  )
}
