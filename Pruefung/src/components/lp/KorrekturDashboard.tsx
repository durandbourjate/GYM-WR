import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../../store/authStore.ts'
import { apiService } from '../../services/apiService.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../types/korrektur.ts'
import type { Frage } from '../../types/fragen.ts'
import { berechneStatistiken, berechneFragenStatistiken, berechneNote } from '../../utils/korrekturUtils.ts'
import type { FragenStatistik } from '../../utils/korrekturUtils.ts'
import type { NotenConfig } from '../../types/pruefung.ts'
import { exportiereAlsCSV, exportiereErgebnisseAlsCSV, downloadCSV } from '../../utils/exportUtils.ts'
import { exportiereBackupXlsx } from '../../utils/backupExport.ts'
import { formatDatum } from '../../utils/zeit.ts'
import LPHeader from './LPHeader.tsx'
import FragenBrowser from './FragenBrowser.tsx'
import HilfeSeite from './HilfeSeite.tsx'
import KorrekturSchuelerZeile from './KorrekturSchuelerZeile.tsx'
import KorrekturPDFAnsicht from './KorrekturPDFAnsicht.tsx'

interface Props {
  pruefungId: string
  eingebettet?: boolean
}

type Sortierung = 'name' | 'punkte' | 'status'

export default function KorrekturDashboard({ pruefungId, eingebettet = false }: Props) {
  const user = useAuthStore((s) => s.user)

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
  const [analyseSortierung, setAnalyseSortierung] = useState<'frageId' | 'loesungsquote' | 'durchschnitt' | 'trennschaerfe'>('frageId')
  const [analyseSortierungAsc, setAnalyseSortierungAsc] = useState(true)
  const [notenConfigOffen, setNotenConfigOffen] = useState(false)
  const [notenConfig, setNotenConfig] = useState<NotenConfig>({ punkteFuerSechs: 0, rundung: 0.5 })
  const [einsichtFreigegeben, setEinsichtFreigegeben] = useState(false)
  const [pdfFreigegeben, setPdfFreigegeben] = useState(false)
  const [zeigFragenbank, setZeigFragenbank] = useState(false)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [pdfSchuelerEmail, setPdfSchuelerEmail] = useState<string | null>(null)
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

      if (abgabenResult) {
        setAbgaben(abgabenResult)
      }
      if (pruefungResult) {
        setFragen(pruefungResult.fragen)
      }

      // Korrektur-Daten setzen — wenn leer, aus Abgaben synthetisieren
      if (korrekturResult && korrekturResult.schueler.length > 0) {
        setKorrektur(korrekturResult)
      } else if (abgabenResult && Object.keys(abgabenResult).length > 0) {
        // Kein Korrektur-Sheet vorhanden, aber Abgaben da → Platzhalter erzeugen
        const gesamtPunkte = pruefungResult?.config?.gesamtpunkte || 0
        const synthetisiert: PruefungsKorrektur = {
          pruefungId,
          pruefungTitel: pruefungResult?.config?.titel || pruefungId,
          datum: pruefungResult?.config?.datum || '',
          klasse: pruefungResult?.config?.klasse || '',
          schueler: Object.values(abgabenResult).map((abgabe) => ({
            email: abgabe.email,
            name: abgabe.name,
            klasse: '',
            bewertungen: Object.fromEntries(
              (pruefungResult?.fragen || []).map((f) => [f.id, {
                frageId: f.id,
                fragenTyp: f.typ,
                maxPunkte: f.punkte,
                kiPunkte: null,
                lpPunkte: null,
                kiBegruendung: null,
                kiFeedback: null,
                lpKommentar: null,
                quelle: 'manuell' as const,
                geprueft: false,
              }])
            ),
            gesamtPunkte: 0,
            maxPunkte: gesamtPunkte,
            korrekturStatus: 'offen' as const,
          })),
          batchStatus: 'idle',
          letzteAktualisierung: new Date().toISOString(),
        }
        setKorrektur(synthetisiert)
      } else if (korrekturResult) {
        setKorrektur(korrekturResult)
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

  // Audio-Kommentar hochladen
  const handleAudioUpload = useCallback(async (schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> => {
    if (!user) return null
    return apiService.uploadAudioKommentar(user.email, pruefungId, schuelerEmail, frageId, blob)
  }, [pruefungId, user])

  // Gesamt-Audio-Kommentar aktualisieren
  const handleGesamtAudioUpdate = useCallback((email: string, audioId: string) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        schueler: prev.schueler.map((s) =>
          s.email === email ? { ...s, audioGesamtkommentarId: audioId } : s
        ),
      }
    })
    // Ans Backend senden
    if (user) {
      apiService.speichereKorrekturZeile({
        pruefungId,
        schuelerEmail: email,
        frageId: '_gesamt',
        audioKommentarId: audioId,
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

  const stats = korrektur ? berechneStatistiken(korrektur.schueler, notenConfig) : null

  // Fragen-Statistiken berechnen und sortieren
  const fragenStats: FragenStatistik[] = korrektur ? berechneFragenStatistiken(korrektur) : []
  const sortiertFragenStats = [...fragenStats].sort((a, b) => {
    let cmp = 0
    switch (analyseSortierung) {
      case 'frageId': cmp = a.frageId.localeCompare(b.frageId); break
      case 'loesungsquote': cmp = a.loesungsquote - b.loesungsquote; break
      case 'durchschnitt': cmp = a.durchschnittPunkte - b.durchschnittPunkte; break
      case 'trennschaerfe': cmp = (a.trennschaerfe ?? -2) - (b.trennschaerfe ?? -2); break
    }
    return analyseSortierungAsc ? cmp : -cmp
  })

  function handleAnalyseSortierung(spalte: 'frageId' | 'loesungsquote' | 'durchschnitt' | 'trennschaerfe'): void {
    if (analyseSortierung === spalte) {
      setAnalyseSortierungAsc((prev) => !prev)
    } else {
      setAnalyseSortierung(spalte)
      setAnalyseSortierungAsc(spalte === 'frageId')
    }
  }

  // CSV-Export (nur Punkte)
  function handleCSVExport(): void {
    if (!korrektur) return
    const csv = exportiereAlsCSV(korrektur, fragen)
    const dateiname = `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Ergebnisse.csv`
    downloadCSV(csv, dateiname)
  }

  // Detaillierter CSV-Export (Antworten + Punkte, Excel-tauglich)
  function handleDetailExport(): void {
    if (!korrektur) return
    const csv = exportiereErgebnisseAlsCSV(korrektur, fragen, abgaben)
    const dateiname = `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Detailliert.csv`
    downloadCSV(csv, dateiname)
  }

  // Backup-Export (Excel mit Tabs)
  const [backupLaden, setBackupLaden] = useState(false)
  async function handleBackupExport(): Promise<void> {
    if (!korrektur || !fragen.length) return
    setBackupLaden(true)
    try {
      await exportiereBackupXlsx({
        config: { titel: korrektur.pruefungTitel, id: pruefungId } as import('../../types/pruefung').PruefungsConfig,
        fragen,
        abgaben,
        korrektur,
      })
    } catch (e) {
      console.error('[Backup] Export fehlgeschlagen:', e)
    } finally {
      setBackupLaden(false)
    }
  }

  // Zurück-Navigation
  function zurueck(): void {
    window.location.href = window.location.pathname
  }

  if (ladeStatus === 'laden') {
    return (
      <div className={eingebettet ? 'py-8 text-center' : 'min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900'}>
        <p className="text-slate-500 dark:text-slate-400">Korrektur wird geladen...</p>
      </div>
    )
  }

  // Aktions-Toolbar (für eingebetteten Modus und standalone)
  const aktionsButtons = (
    <>
      {(korrektur?.batchStatus === 'laeuft' || batchLaeuft) && (
        <span className="text-sm text-amber-600 dark:text-amber-400">
          KI korrigiert... {korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}
        </span>
      )}
      {korrektur?.batchStatus === 'idle' && (
        <button onClick={handleStarteKorrektur} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
          KI-Korrektur starten
        </button>
      )}
      {korrektur?.batchStatus === 'fertig' && (
        <button onClick={() => setFeedbackDialog(true)} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer">
          Feedback senden
        </button>
      )}
      {korrektur && (
        <button
          type="button"
          onClick={async () => {
            if (!user) return
            const neuerWert = !einsichtFreigegeben
            const ok = await apiService.korrekturFreigeben(pruefungId, neuerWert, user.email, 'einsicht')
            if (ok) {
              setEinsichtFreigegeben(neuerWert)
              // PDF-Freigabe zurücknehmen wenn Einsicht gesperrt wird
              if (!neuerWert && pdfFreigegeben) {
                await apiService.korrekturFreigeben(pruefungId, false, user.email, 'pdf')
                setPdfFreigegeben(false)
              }
            }
          }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            einsichtFreigegeben
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={einsichtFreigegeben ? 'Einsicht für SuS sperren' : 'Einsicht für SuS freigeben'}
        >
          {einsichtFreigegeben ? '✓ Einsicht' : 'Einsicht freigeben'}
        </button>
      )}
      {korrektur && einsichtFreigegeben && (
        <button
          type="button"
          onClick={async () => {
            if (!user) return
            const neuerWert = !pdfFreigegeben
            const ok = await apiService.korrekturFreigeben(pruefungId, neuerWert, user.email, 'pdf')
            if (ok) setPdfFreigegeben(neuerWert)
          }}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            pdfFreigegeben
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
          title={pdfFreigegeben ? 'PDF-Download für SuS sperren' : 'PDF-Download für SuS freigeben'}
        >
          {pdfFreigegeben ? '✓ PDF-Download' : 'PDF freigeben'}
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && (
        <button onClick={handleCSVExport} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer" title="Ergebnisse als CSV exportieren (nur Punkte)">
          CSV Export
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && Object.keys(abgaben).length > 0 && (
        <button onClick={handleDetailExport} className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer" title="Detaillierter Export mit Antworten und Punkten pro Frage">
          Excel-Export (Detailliert)
        </button>
      )}
      {korrektur && fragen.length > 0 && (
        <button onClick={handleBackupExport} disabled={backupLaden} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer" title="Vollständiges Backup als Excel (Übersicht + Tab pro SuS)">
          {backupLaden ? 'Exportiert…' : '📥 Backup (.xlsx)'}
        </button>
      )}
      {korrektur && korrektur.schueler.length > 0 && (
        <button
          onClick={() => {
            const sorted = [...korrektur.schueler].sort((a, b) => a.name.localeCompare(b.name))
            if (sorted.length > 0) setPdfSchuelerEmail(sorted[0].email)
          }}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          title="Einzelne Korrektur-PDFs nacheinander anzeigen und drucken"
        >
          Korrektur-PDFs
        </button>
      )}
    </>
  )

  return (
    <div className={eingebettet ? '' : 'min-h-screen bg-slate-50 dark:bg-slate-900'}>
      {/* Header nur im standalone-Modus */}
      {!eingebettet && (
        <LPHeader
          titel={`Korrektur: ${korrektur?.pruefungTitel ?? pruefungId}`}
          untertitel={korrektur ? `${korrektur.klasse} · ${korrektur.datum ? formatDatum(korrektur.datum) : ''} · ${korrektur.schueler.length} SuS` : undefined}
          zurueck={zurueck}
          statusText={
            (korrektur?.batchStatus === 'laeuft' || batchLaeuft)
              ? `KI korrigiert... ${korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}`
            : korrektur?.batchStatus === 'fehler'
              ? `Fehler: ${korrektur.batchFehler}`
            : undefined
          }
          ansichtsButtons={aktionsButtons}
          onFragenbank={() => { setZeigHilfe(false); setZeigFragenbank(!zeigFragenbank) }}
          onHilfe={() => { setZeigFragenbank(false); setZeigHilfe(!zeigHilfe) }}
          fragebankOffen={zeigFragenbank}
          hilfeOffen={zeigHilfe}
        />
      )}

      {/* Toolbar im eingebetteten Modus */}
      {eingebettet && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {aktionsButtons}
        </div>
      )}

      <main className={eingebettet ? '' : 'max-w-5xl mx-auto p-6'}>
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

        {/* Notenskala-Einstellungen */}
        {korrektur && korrektur.schueler.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setNotenConfigOffen((prev) => !prev)}
              className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span className={`inline-block transition-transform ${notenConfigOffen ? 'rotate-90' : ''}`}>&#9654;</span>
              Notenskala
            </button>
            {notenConfigOffen && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Punkte für Note 6
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={notenConfig.punkteFuerSechs || korrektur.schueler[0]?.maxPunkte || 0}
                        onChange={(e) => setNotenConfig((prev) => ({ ...prev, punkteFuerSechs: parseFloat(e.target.value) || 0 }))}
                        min={1}
                        max={korrektur.schueler[0]?.maxPunkte || 100}
                        step={0.5}
                        className="w-20 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        title="Benötigte Punkte für die Maximalnote 6"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        / {korrektur.schueler[0]?.maxPunkte || 0} Max.
                        {notenConfig.punkteFuerSechs > 0 && notenConfig.punkteFuerSechs < (korrektur.schueler[0]?.maxPunkte || 0) && (
                          <span className="ml-1">
                            ({Math.round(notenConfig.punkteFuerSechs / (korrektur.schueler[0]?.maxPunkte || 1) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Standard: Maximum. Heruntersetzen um eine «mildere» Skala zu verwenden.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Rundung
                    </label>
                    <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
                      {([0.1, 0.25, 0.5, 1] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setNotenConfig((prev) => ({ ...prev, rundung: r }))}
                          className={`flex-1 px-2 py-1.5 text-xs transition-colors cursor-pointer border-l first:border-l-0 border-slate-300 dark:border-slate-600
                            ${notenConfig.rundung === r
                              ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          title={`Auf ${r === 1 ? 'ganze' : r === 0.5 ? 'halbe' : r === 0.25 ? 'Viertel-' : 'Zehntel-'}Noten runden`}
                        >
                          {r === 1 ? 'Ganze' : r === 0.5 ? 'Halbe' : r === 0.25 ? 'Viertel' : 'Zehntel'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Vorschau der Notenskala */}
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Vorschau</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((pct) => {
                      const maxP = korrektur.schueler[0]?.maxPunkte || 1
                      const p = maxP * pct / 100
                      const note = berechneNote(p, maxP, notenConfig)
                      const farbe = note >= 4 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                      return (
                        <span key={pct}>
                          {pct}% → <span className={farbe}>{note.toFixed(notenConfig.rundung < 0.5 ? 2 : 1)}</span>
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Formel: Note = 1 + 5 × (Punkte / {notenConfig.punkteFuerSechs > 0 ? notenConfig.punkteFuerSechs : (korrektur.schueler[0]?.maxPunkte || '?')})
                  </p>
                </div>
              </div>
            )}
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
                        Lösungsquote {analyseSortierung === 'loesungsquote' && (analyseSortierungAsc ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-4 py-2 text-slate-500 dark:text-slate-400 font-medium cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none text-right"
                        onClick={() => handleAnalyseSortierung('trennschaerfe')}
                      >
                        Trennschärfe {analyseSortierung === 'trennschaerfe' && (analyseSortierungAsc ? '↑' : '↓')}
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
                          <td className="px-4 py-2 text-right">
                            {stat.trennschaerfe !== null ? (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                stat.trennschaerfe >= 0.4 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                stat.trennschaerfe >= 0.3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                stat.trennschaerfe >= 0.2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`} title={`Trennschärfe: ${stat.trennschaerfeLabel}`}>
                                {stat.trennschaerfe.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                            )}
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
              pruefungId={pruefungId}
              schueler={schueler}
              abgabe={abgaben[schueler.email]}
              fragen={fragen}
              notenConfig={notenConfig}
              onBewertungUpdate={handleBewertungUpdate}
              onNoteOverride={handleNoteOverride}
              onAudioUpload={handleAudioUpload}
              onGesamtAudioUpdate={handleGesamtAudioUpdate}
              onPDF={() => setPdfSchuelerEmail(schueler.email)}
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

      {/* Fragenbank + Hilfe Overlays nur im standalone-Modus */}
      {!eingebettet && zeigFragenbank && (
        <FragenBrowser
          onHinzufuegen={() => {}}
          onSchliessen={() => setZeigFragenbank(false)}
          bereitsVerwendet={[]}
        />
      )}
      {!eingebettet && zeigHilfe && (
        <HilfeSeite onSchliessen={() => setZeigHilfe(false)} />
      )}

      {/* PDF-Ansicht Overlay */}
      {pdfSchuelerEmail && korrektur && (() => {
        const pdfSchueler = korrektur.schueler.find((s) => s.email === pdfSchuelerEmail)
        if (!pdfSchueler) return null
        return (
          <KorrekturPDFAnsicht
            schueler={pdfSchueler}
            abgabe={abgaben[pdfSchuelerEmail]}
            fragen={fragen}
            korrektur={korrektur}
            notenConfig={notenConfig}
            onSchliessen={() => setPdfSchuelerEmail(null)}
          />
        )
      })()}
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
