import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { useKorrekturAutoSave } from '../../../hooks/useKorrekturAutoSave.ts'
import type { PruefungsKorrektur, SchuelerAbgabe } from '../../../types/korrektur.ts'
import type { Frage } from '../../../types/fragen.ts'
import { berechneStatistiken, berechneFragenStatistiken } from '../../../utils/korrekturUtils.ts'
import type { NotenConfig } from '../../../types/pruefung.ts'
import { exportiereAlsCSV, exportiereErgebnisseAlsCSV, downloadCSV } from '../../../utils/exportUtils.ts'
import { exportiereBackupXlsx } from '../../../utils/backupExport.ts'
import { formatDatum } from '../../../utils/zeit.ts'
import { autoKorrigiere, istAutoKorrigierbar } from '../../../utils/autoKorrektur.ts'
import type { KorrekturErgebnis } from '../../../utils/autoKorrektur.ts'
import LPHeader from '../LPHeader.tsx'
import FragenBrowser from '../fragenbank/FragenBrowser.tsx'
import HilfeSeite from '../HilfeSeite.tsx'
import KorrekturSchuelerZeile from './KorrekturSchuelerZeile.tsx'
import KorrekturFragenAnsicht from './KorrekturFragenAnsicht.tsx'
import KorrekturPDFAnsicht from './KorrekturPDFAnsicht.tsx'
import StatKarte from './StatKarte.tsx'
import FeedbackDialog from './FeedbackDialog.tsx'
import NotenConfigPanel from './NotenConfigPanel.tsx'
import FragenAnalysePanel from './FragenAnalysePanel.tsx'
import KorrekturAktionsLeiste from './KorrekturAktionsLeiste.tsx'

interface Props {
  pruefungId: string
  eingebettet?: boolean
}

type Sortierung = 'name' | 'punkte' | 'status'

export default function KorrekturDashboard({ pruefungId, eingebettet = false }: Props) {
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const { queueSave, updateKorrekturRef } = useKorrekturAutoSave({
    pruefungId,
    email: user?.email ?? '',
    enabled: !istDemoModus && !!user,
  })

  const [korrektur, setKorrektur] = useState<PruefungsKorrektur | null>(null)
  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const [ladeStatus, setLadeStatus] = useState<'laden' | 'fertig' | 'fehler'>('laden')
  const [korrekturModus, setKorrekturModus] = useState<'schueler' | 'frage'>('schueler')
  const [susNavIndex, setSusNavIndex] = useState(0)
  const [sortierung, setSortierung] = useState<Sortierung>('name')
  const [batchLaeuft, setBatchLaeuft] = useState(false)
  const [feedbackDialog, setFeedbackDialog] = useState(false)
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'senden' | 'fertig'>('idle')
  const [feedbackErgebnis, setFeedbackErgebnis] = useState<{ erfolg: string[]; fehler: string[] } | null>(null)
  const [analyseOffen, setAnalyseOffen] = useState(false)
  const [notenConfigOffen, setNotenConfigOffen] = useState(false)
  const [notenConfig, setNotenConfig] = useState<NotenConfig>({ punkteFuerSechs: 0, rundung: 0.5 })
  const [einsichtFreigegeben, setEinsichtFreigegeben] = useState(false)
  const [pdfFreigegeben, setPdfFreigegeben] = useState(false)
  const [zeigFragenbank, setZeigFragenbank] = useState(false)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [pdfSchuelerEmail, setPdfSchuelerEmail] = useState<string | null>(null)
  const [aktionLaeuft, setAktionLaeuft] = useState<string | null>(null)
  const [backupLaden, setBackupLaden] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Korrektur-Daten für IndexedDB-Backup aktuell halten
  useEffect(() => { updateKorrekturRef(korrektur) }, [korrektur, updateKorrekturRef])

  // Auto-Korrektur für alle SuS × Fragen berechnen
  const autoErgebnisseAlle = useMemo<Record<string, Record<string, KorrekturErgebnis | null>>>(() => {
    if (fragen.length === 0 || Object.keys(abgaben).length === 0) return {}
    const result: Record<string, Record<string, KorrekturErgebnis | null>> = {}
    for (const [email, abgabe] of Object.entries(abgaben)) {
      const schuelerErgebnisse: Record<string, KorrekturErgebnis | null> = {}
      for (const frage of fragen) {
        const antwort = abgabe.antworten[frage.id]
        schuelerErgebnisse[frage.id] = autoKorrigiere(frage, antwort)
      }
      result[email] = schuelerErgebnisse
    }
    return result
  }, [fragen, abgaben])

  // Auto-Korrektur-Ergebnisse in Bewertungen übernehmen (wenn kiPunkte noch null)
  useEffect(() => {
    if (Object.keys(autoErgebnisseAlle).length === 0) return

    setKorrektur((prev) => {
      if (!prev) return prev

      let hatAenderungen = false
      const aktualisierteSchueler = prev.schueler.map((s) => {
        const autoErgebnisse = autoErgebnisseAlle[s.email]
        if (!autoErgebnisse) return s

        let schuelerGeaendert = false
        const neueBewertungen = { ...s.bewertungen }

        for (const [frageId, ergebnis] of Object.entries(autoErgebnisse)) {
          if (!ergebnis) continue
          const bew = neueBewertungen[frageId]
          if (!bew) continue
          if (bew.kiPunkte === null && bew.lpPunkte === null) {
            neueBewertungen[frageId] = {
              ...bew,
              kiPunkte: ergebnis.erreichtePunkte,
              lpPunkte: ergebnis.erreichtePunkte, // B53: Punkte direkt zuweisen (deterministisch korrekt)
              quelle: 'auto' as const,
            }
            schuelerGeaendert = true
            hatAenderungen = true
          }
        }

        return schuelerGeaendert ? { ...s, bewertungen: neueBewertungen } : s
      })

      return hatAenderungen ? { ...prev, schueler: aktualisierteSchueler } : prev
    })
  }, [autoErgebnisseAlle])

  // Daten laden
  useEffect(() => {
    if (!user) return

    async function lade(): Promise<void> {
      const [korrekturResult, abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeKorrektur(pruefungId, user!.email),
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])

      if (abgabenResult) setAbgaben(abgabenResult)
      if (pruefungResult) setFragen(pruefungResult.fragen)

      if (korrekturResult && korrekturResult.schueler.length > 0) {
        setKorrektur(korrekturResult)
      } else if (abgabenResult && Object.keys(abgabenResult).length > 0) {
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

  // Auto-korrigierbare Fragen als geprüft markieren
  const autoGeprueftGesetzt = useRef(false)
  useEffect(() => {
    if (!korrektur || fragen.length === 0 || autoGeprueftGesetzt.current) return

    const autoFragen = fragen.filter((f) => istAutoKorrigierbar(f.typ))
    if (autoFragen.length === 0) { autoGeprueftGesetzt.current = true; return }

    const aenderungen: Array<{ schuelerEmail: string; frageId: string }> = []
    const aktualisierteSchueler = korrektur.schueler.map((schueler) => {
      let schuelerGeaendert = false
      const neueBewertungen = { ...schueler.bewertungen }
      for (const frage of autoFragen) {
        const bewertung = neueBewertungen[frage.id]
        if (bewertung && bewertung.geprueft) continue
        neueBewertungen[frage.id] = {
          ...(bewertung || { kiPunkte: null, lpPunkte: null, kommentar: '' }),
          geprueft: true,
        }
        schuelerGeaendert = true
        aenderungen.push({ schuelerEmail: schueler.email, frageId: frage.id })
      }
      return schuelerGeaendert ? { ...schueler, bewertungen: neueBewertungen } : schueler
    })

    autoGeprueftGesetzt.current = true
    if (aenderungen.length > 0) {
      setKorrektur({ ...korrektur, schueler: aktualisierteSchueler })
      for (const { schuelerEmail, frageId } of aenderungen) {
        queueSave({ pruefungId, schuelerEmail, frageId, geprueft: true })
      }
    }
  }, [korrektur, fragen, pruefungId, queueSave])

  // Polling für Batch-Fortschritt
  useEffect(() => {
    if (!batchLaeuft || !user) return

    pollingRef.current = setInterval(async () => {
      const fortschritt = await apiService.ladeKorrekturFortschritt(pruefungId, user!.email)
      if (!fortschritt) return

      if (fortschritt.status === 'fertig' || fortschritt.status === 'fehler') {
        setBatchLaeuft(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
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

    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [batchLaeuft, user, pruefungId, korrektur])

  // === Handler ===

  const handleNoteOverride = useCallback((schuelerEmail: string, noteOverride: number | null) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return { ...prev, schueler: prev.schueler.map((s) => s.email !== schuelerEmail ? s : { ...s, noteOverride }) }
    })
    queueSave({ pruefungId, schuelerEmail, frageId: '__note_override__', lpPunkte: noteOverride })
  }, [pruefungId, queueSave])

  const handleBewertungUpdate = useCallback((schuelerEmail: string, frageId: string, updates: {
    lpPunkte?: number | null; lpKommentar?: string | null; geprueft?: boolean
  }) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        schueler: prev.schueler.map((s) => {
          if (s.email !== schuelerEmail) return s
          const bewertung = s.bewertungen[frageId]
          if (!bewertung) return s
          const neueBewertungen = { ...s.bewertungen, [frageId]: { ...bewertung, ...updates } }
          const alleGeprueft = Object.values(neueBewertungen).every((b) => b.geprueft)
          const neuerStatus = alleGeprueft ? 'review-fertig' as const : s.korrekturStatus === 'review-fertig' ? 'offen' as const : s.korrekturStatus
          return { ...s, bewertungen: neueBewertungen, korrekturStatus: neuerStatus }
        }),
      }
    })
    queueSave({ pruefungId, schuelerEmail, frageId, ...updates })
  }, [pruefungId, queueSave])

  const handleAudioUpload = useCallback(async (schuelerEmail: string, frageId: string, blob: Blob): Promise<string | null> => {
    if (!user) return null
    return apiService.uploadAudioKommentar(user.email, pruefungId, schuelerEmail, frageId, blob)
  }, [pruefungId, user])

  const handleGesamtAudioUpdate = useCallback((email: string, audioId: string) => {
    setKorrektur((prev) => {
      if (!prev) return prev
      return { ...prev, schueler: prev.schueler.map((s) => s.email === email ? { ...s, audioGesamtkommentarId: audioId } : s) }
    })
    queueSave({ pruefungId, schuelerEmail: email, frageId: '_gesamt', audioKommentarId: audioId })
  }, [pruefungId, user])

  async function handleStarteKorrektur(): Promise<void> {
    if (!user) return
    setAktionLaeuft('ki')
    setBatchLaeuft(true)
    setKorrektur((prev) => prev ? { ...prev, batchStatus: 'laeuft', batchFortschritt: { erledigt: 0, gesamt: 1 } } : prev)
    const result = await apiService.starteKorrektur(pruefungId, user.email)
    if (!result?.success) {
      setBatchLaeuft(false)
      setKorrektur((prev) => prev ? { ...prev, batchStatus: 'fehler', batchFehler: result?.fehler ?? 'Unbekannter Fehler' } : prev)
    }
  }

  async function handleFeedbackSenden(): Promise<void> {
    if (!user || !korrektur) return
    setFeedbackStatus('senden')
    const emails = korrektur.schueler.filter((s) => s.korrekturStatus !== 'versendet').map((s) => s.email)
    const result = await apiService.generiereUndSendeFeedback({ pruefungId, schuelerEmails: emails }, user.email)
    setFeedbackErgebnis(result)
    setFeedbackStatus('fertig')
  }

  function handleCSVExport(): void {
    if (!korrektur) return
    downloadCSV(exportiereAlsCSV(korrektur, fragen), `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Ergebnisse.csv`)
  }

  function handleDetailExport(): void {
    if (!korrektur) return
    downloadCSV(exportiereErgebnisseAlsCSV(korrektur, fragen, abgaben), `${korrektur.pruefungTitel.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '')}_Detailliert.csv`)
  }

  async function handleBackupExport(): Promise<void> {
    if (!korrektur || !fragen.length) return
    setBackupLaden(true)
    try {
      await exportiereBackupXlsx({
        config: { titel: korrektur.pruefungTitel, id: pruefungId } as import('../../../types/pruefung').PruefungsConfig,
        fragen, abgaben, korrektur,
      })
    } catch (e) {
      console.error('[Backup] Export fehlgeschlagen:', e)
    } finally {
      setBackupLaden(false)
    }
  }

  // === Berechnete Werte ===

  const sortierteSchueler = [...(korrektur?.schueler ?? [])].sort((a, b) => {
    switch (sortierung) {
      case 'name': return a.name.localeCompare(b.name)
      case 'punkte': return b.gesamtPunkte - a.gesamtPunkte
      case 'status': return a.korrekturStatus.localeCompare(b.korrekturStatus)
      default: return 0
    }
  })

  // U7: Bewertungen ohne Punkte zählen (für Freigabe-/Export-Sperre)
  const bewertungenOhnePunkte = useMemo(() => {
    if (!korrektur) return 0
    let count = 0
    for (const s of korrektur.schueler) {
      for (const b of Object.values(s.bewertungen)) {
        if (b.lpPunkte === null && b.kiPunkte === null) count++
      }
    }
    return count
  }, [korrektur])

  const stats = korrektur ? berechneStatistiken(korrektur.schueler, notenConfig) : null
  const fragenStats = korrektur ? berechneFragenStatistiken(korrektur) : []
  const maxPunkte = korrektur?.schueler[0]?.maxPunkte || 0

  // === Render ===

  if (ladeStatus === 'laden') {
    return (
      <div className={eingebettet ? 'py-8 text-center' : 'min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900'}>
        <p className="text-slate-500 dark:text-slate-400">Korrektur wird geladen...</p>
      </div>
    )
  }

  const aktionsLeiste = (
    <KorrekturAktionsLeiste
      pruefungId={pruefungId}
      userEmail={user?.email ?? ''}
      korrektur={korrektur}
      abgaben={abgaben}
      fragen={fragen}
      batchLaeuft={batchLaeuft}
      aktionLaeuft={aktionLaeuft}
      setAktionLaeuft={setAktionLaeuft}
      einsichtFreigegeben={einsichtFreigegeben}
      setEinsichtFreigegeben={setEinsichtFreigegeben}
      pdfFreigegeben={pdfFreigegeben}
      setPdfFreigegeben={setPdfFreigegeben}
      backupLaden={backupLaden}
      onStarteKorrektur={handleStarteKorrektur}
      onFeedbackOeffnen={() => setFeedbackDialog(true)}
      onCSVExport={handleCSVExport}
      onDetailExport={handleDetailExport}
      onBackupExport={handleBackupExport}
      bewertungenOhnePunkte={bewertungenOhnePunkte}
      onPDFOeffnen={() => {
        if (!korrektur) return
        const sorted = [...korrektur.schueler].sort((a, b) => a.name.localeCompare(b.name))
        if (sorted.length > 0) setPdfSchuelerEmail(sorted[0].email)
      }}
    />
  )

  return (
    <div className={eingebettet ? '' : 'min-h-screen bg-slate-50 dark:bg-slate-900'}>
      {!eingebettet && (
        <LPHeader
          titel={`Korrektur: ${korrektur?.pruefungTitel ?? pruefungId}`}
          untertitel={korrektur ? `${korrektur.klasse} · ${korrektur.datum ? formatDatum(korrektur.datum) : ''} · ${korrektur.schueler.length} SuS` : undefined}
          zurueck={() => { window.location.href = window.location.pathname }}
          statusText={
            (korrektur?.batchStatus === 'laeuft' || batchLaeuft)
              ? `KI korrigiert... ${korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}`
            : korrektur?.batchStatus === 'fehler'
              ? `Fehler: ${korrektur.batchFehler}`
            : undefined
          }
          ansichtsButtons={aktionsLeiste}
          onFragenbank={() => { setZeigHilfe(false); setZeigFragenbank(!zeigFragenbank) }}
          onHilfe={() => { setZeigFragenbank(false); setZeigHilfe(!zeigHilfe) }}
          fragebankOffen={zeigFragenbank}
          hilfeOffen={zeigHilfe}
        />
      )}

      {eingebettet && (
        <div className="flex flex-wrap items-center gap-2 mb-4">{aktionsLeiste}</div>
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

        {/* Notenskala */}
        {korrektur && korrektur.schueler.length > 0 && (
          <NotenConfigPanel
            notenConfig={notenConfig}
            setNotenConfig={setNotenConfig}
            maxPunkte={maxPunkte}
            offen={notenConfigOffen}
            toggleOffen={() => setNotenConfigOffen((prev) => !prev)}
          />
        )}

        {/* Fragen-Analyse */}
        {korrektur && korrektur.schueler.length > 0 && fragenStats.length > 0 && (
          <FragenAnalysePanel
            fragenStats={fragenStats}
            offen={analyseOffen}
            toggleOffen={() => setAnalyseOffen((prev) => !prev)}
          />
        )}

        {/* Freigabe-Hinweis */}
        {korrektur && korrektur.schueler.length > 0 && !einsichtFreigegeben && korrektur.schueler.every((s) =>
          Object.values(s.bewertungen).every((b) => b.geprueft)
        ) && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Alle Korrekturen abgeschlossen</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{korrektur.schueler.length} SuS korrigiert. Ergebnisse können jetzt freigegeben werden.</p>
            </div>
            <button
              disabled={aktionLaeuft === 'freigabe'}
              onClick={async () => {
                if (!user) return
                setAktionLaeuft('freigabe')
                const ok = await apiService.korrekturFreigeben(pruefungId, true, user.email, 'einsicht')
                if (ok) setEinsichtFreigegeben(true)
                setAktionLaeuft(null)
              }}
              className="shrink-0 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {aktionLaeuft === 'freigabe' ? 'Wird freigegeben...' : 'Ergebnisse freigeben'}
            </button>
          </div>
        )}

        {/* Warnung: Fragen als geprüft markiert, aber ohne Punkte (U7) */}
        {korrektur && korrektur.schueler.length > 0 && (() => {
          let ohnePunkte = 0
          for (const s of korrektur.schueler) {
            for (const b of Object.values(s.bewertungen)) {
              if (b.geprueft && b.lpPunkte === null && b.kiPunkte === null) ohnePunkte++
            }
          }
          if (ohnePunkte === 0) return null
          return (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠ {ohnePunkte} {ohnePunkte === 1 ? 'Bewertung' : 'Bewertungen'} als geprüft markiert, aber ohne Punkte.
                Leere Punkte bedeuten: noch nicht beurteilt.
              </p>
            </div>
          )
        })()}

        {/* Modus-Toggle + Sortierung */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setKorrekturModus('schueler')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer border-r border-slate-300 dark:border-slate-600
                ${korrekturModus === 'schueler' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              SuS-Ansicht
            </button>
            <button
              onClick={() => setKorrekturModus('frage')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer
                ${korrekturModus === 'frage' ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              Fragen-Ansicht
            </button>
          </div>
          {korrekturModus === 'schueler' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sortierung:</span>
              {(['name', 'punkte', 'status'] as Sortierung[]).map((s) => (
                <button key={s} onClick={() => setSortierung(s)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                    sortierung === s ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-800 dark:border-slate-200' : 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {s === 'name' ? 'Name' : s === 'punkte' ? 'Punkte ↓' : 'Status'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Kein Daten-Hinweis */}
        {(!korrektur || korrektur.schueler.length === 0) && ladeStatus === 'fertig' && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Noch keine Korrektur-Daten vorhanden.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Starten Sie die KI-Korrektur, sobald alle SuS abgegeben haben.</p>
          </div>
        )}

        {/* Korrektur-Inhalt */}
        {korrekturModus === 'schueler' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
              <button onClick={() => setSusNavIndex((i) => Math.max(0, i - 1))} disabled={susNavIndex === 0}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default">
                ← Vorherige/r
              </button>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {sortierteSchueler[susNavIndex]?.name} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({susNavIndex + 1}/{sortierteSchueler.length})</span>
              </span>
              <button onClick={() => setSusNavIndex((i) => Math.min(sortierteSchueler.length - 1, i + 1))} disabled={susNavIndex === sortierteSchueler.length - 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default">
                Nächste/r →
              </button>
            </div>
            {sortierteSchueler[susNavIndex] && (
              <KorrekturSchuelerZeile
                key={sortierteSchueler[susNavIndex].email}
                pruefungId={pruefungId}
                schueler={sortierteSchueler[susNavIndex]}
                abgabe={abgaben[sortierteSchueler[susNavIndex].email]}
                fragen={fragen}
                autoErgebnisse={autoErgebnisseAlle[sortierteSchueler[susNavIndex].email] ?? {}}
                notenConfig={notenConfig}
                onBewertungUpdate={handleBewertungUpdate}
                onNoteOverride={handleNoteOverride}
                onAudioUpload={handleAudioUpload}
                onGesamtAudioUpdate={handleGesamtAudioUpdate}
                onPDF={() => setPdfSchuelerEmail(sortierteSchueler[susNavIndex].email)}
                defaultOffen={true}
              />
            )}
          </div>
        ) : korrektur ? (
          <KorrekturFragenAnsicht fragen={fragen} korrektur={korrektur} abgaben={abgaben} notenConfig={notenConfig} onBewertungUpdate={handleBewertungUpdate} />
        ) : null}
      </main>

      {/* Feedback-Dialog */}
      <FeedbackDialog
        offen={feedbackDialog}
        onSchliessen={() => { setFeedbackDialog(false); setFeedbackStatus('idle') }}
        onSenden={handleFeedbackSenden}
        status={feedbackStatus}
        ergebnis={feedbackErgebnis}
        anzahlEmpfaenger={korrektur?.schueler.filter((s) => s.korrekturStatus !== 'versendet').length ?? 0}
      />

      {/* Overlays */}
      {!eingebettet && zeigFragenbank && (
        <FragenBrowser onHinzufuegen={() => {}} onSchliessen={() => setZeigFragenbank(false)} bereitsVerwendet={[]} />
      )}
      {!eingebettet && zeigHilfe && (
        <HilfeSeite onSchliessen={() => setZeigHilfe(false)} />
      )}

      {/* PDF-Ansicht */}
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
