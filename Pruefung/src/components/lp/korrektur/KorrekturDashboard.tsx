import { useState } from 'react'
import { TabBar } from '../../ui/TabBar'
import { useAuthStore } from '../../../store/authStore.ts'
import { apiService } from '../../../services/apiService.ts'
import { useKorrekturAutoSave } from '../../../hooks/useKorrekturAutoSave.ts'
import { useKorrekturDaten } from './useKorrekturDaten.ts'
import { useKorrekturActions } from './useKorrekturActions.ts'
import { formatDatum } from '../../../utils/zeit.ts'
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
  config?: import('../../../types/pruefung').PruefungsConfig
}

export default function KorrekturDashboard({ pruefungId, eingebettet = false, config: configProp }: Props) {
  const istFormativ = configProp?.typ === 'formativ'
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const { queueSave, updateKorrekturRef } = useKorrekturAutoSave({
    pruefungId,
    email: user?.email ?? '',
    enabled: !istDemoModus && !!user,
  })

  // Daten-Hook
  const daten = useKorrekturDaten({
    pruefungId,
    userEmail: user?.email ?? '',
    queueSave,
    updateKorrekturRef,
  })

  // Actions-Hook
  const actions = useKorrekturActions({
    pruefungId,
    userEmail: user?.email ?? '',
    korrektur: daten.korrektur,
    setKorrektur: daten.setKorrektur,
    abgaben: daten.abgaben,
    fragen: daten.fragen,
    queueSave,
  })

  // Lokaler UI-State
  const [korrekturModus, setKorrekturModus] = useState<'schueler' | 'frage'>('schueler')
  const [susNavIndex, setSusNavIndex] = useState(0)
  const [analyseOffen, setAnalyseOffen] = useState(false)
  const [notenConfigOffen, setNotenConfigOffen] = useState(false)
  const [zeigFragenbank, setZeigFragenbank] = useState(false)
  const [zeigHilfe, setZeigHilfe] = useState(false)
  const [pdfSchuelerEmail, setPdfSchuelerEmail] = useState<string | null>(null)

  const { korrektur, fragen, abgaben, ladeStatus, sortierteSchueler, autoErgebnisseAlle,
    notenConfig, setNotenConfig, einsichtFreigegeben, setEinsichtFreigegeben,
    pdfFreigegeben, setPdfFreigegeben, sortierung, setSortierung,
    bewertungenOhnePunkte, stats, fragenStats, maxPunkte } = daten

  const { batchLaeuft, aktionLaeuft, setAktionLaeuft,
    feedbackDialog, setFeedbackDialog, feedbackStatus, setFeedbackStatus, feedbackErgebnis,
    handleBewertungUpdate, handleNoteOverride, handleAudioUpload, handleGesamtAudioUpdate,
    handleStarteKorrektur, handleFeedbackSenden, handleCSVExport, handleDetailExport } = actions

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
      batchLaeuft={batchLaeuft}
      aktionLaeuft={aktionLaeuft}
      setAktionLaeuft={setAktionLaeuft}
      einsichtFreigegeben={einsichtFreigegeben}
      setEinsichtFreigegeben={setEinsichtFreigegeben}
      pdfFreigegeben={pdfFreigegeben}
      setPdfFreigegeben={setPdfFreigegeben}
      onStarteKorrektur={handleStarteKorrektur}
      onFeedbackOeffnen={() => setFeedbackDialog(true)}
      onCSVExport={handleCSVExport}
      onDetailExport={handleDetailExport}
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
          titel={`${istFormativ ? 'Auswertung' : 'Korrektur'}: ${korrektur?.pruefungTitel ?? pruefungId}`}
          untertitel={korrektur ? `${korrektur.klasse} · ${korrektur.datum ? formatDatum(korrektur.datum) : ''} · ${korrektur.schueler.length} SuS` : undefined}
          zurueck={() => { window.location.href = window.location.pathname }}
          statusText={
            (korrektur?.batchStatus === 'laeuft' || batchLaeuft)
              ? `Korrektur läuft... ${korrektur?.batchFortschritt ? `${korrektur.batchFortschritt.erledigt}/${korrektur.batchFortschritt.gesamt}` : ''}`
            : korrektur?.batchStatus === 'fehler'
              ? `Fehler: ${korrektur.batchFehler}`
            : undefined
          }
          aktionsButtons={aktionsLeiste}
          onFragensammlung={() => { setZeigHilfe(false); setZeigFragenbank(!zeigFragenbank) }}
          onHilfe={() => { setZeigFragenbank(false); setZeigHilfe(!zeigHilfe) }}
          fragensammlungOffen={zeigFragenbank}
          hilfeOffen={zeigHilfe}
        />
      )}

      {eingebettet && (
        <div className="flex flex-wrap items-center gap-2 mb-4">{aktionsLeiste}</div>
      )}

      <main className={eingebettet ? '' : 'p-6'}>
        {/* Statistik-Leiste */}
        {stats && korrektur && korrektur.schueler.length > 0 && !istFormativ && (
          <div className="grid gap-3 mb-6 grid-cols-2 md:grid-cols-6">
            <StatKarte label="Durchschnitt" wert={`${stats.durchschnitt} Pkt.`} />
            <StatKarte label="Median" wert={`${stats.median} Pkt.`} />
            <StatKarte label="∅ Note" wert={stats.durchschnittNote.toFixed(1)} />
            <StatKarte label="Median Note" wert={stats.medianNote.toFixed(1)} />
            <StatKarte label="Bestanden" wert={`${stats.bestanden}/${stats.bestanden + stats.durchgefallen}`} />
            <StatKarte label="Durchgefallen" wert={String(stats.durchgefallen)} highlight={stats.durchgefallen > 0} />
          </div>
        )}

        {/* Notenskala (nicht bei formativen Übungen) */}
        {!istFormativ && korrektur && korrektur.schueler.length > 0 && (
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

        {/* Warnung: Fragen als geprüft markiert, aber ohne Punkte (nicht bei formativen Übungen) */}
        {!istFormativ && korrektur && korrektur.schueler.length > 0 && (() => {
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
          <TabBar
            tabs={[
              { id: 'schueler', label: 'SuS-Ansicht' },
              { id: 'frage', label: 'Fragen-Ansicht' },
            ]}
            activeTab={korrekturModus}
            onTabChange={(id) => setKorrekturModus(id as 'schueler' | 'frage')}
            size="sm"
          />
          {korrekturModus === 'schueler' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sortierung:</span>
              {(['name', 'punkte', 'status'] as const).map((s) => (
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
            <p className="text-sm text-slate-400 dark:text-slate-500">Starten Sie die Autokorrektur, sobald alle SuS abgegeben haben.</p>
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
                userEmail={user?.email}
                onBewertungUpdate={handleBewertungUpdate}
                onNoteOverride={handleNoteOverride}
                onAudioUpload={handleAudioUpload}
                onGesamtAudioUpdate={handleGesamtAudioUpdate}
                onPDF={() => setPdfSchuelerEmail(sortierteSchueler[susNavIndex].email)}
                defaultOffen={true}
                istFormativ={istFormativ}
              />
            )}
          </div>
        ) : korrektur ? (
          <KorrekturFragenAnsicht fragen={fragen} korrektur={korrektur} abgaben={abgaben} notenConfig={notenConfig} onBewertungUpdate={handleBewertungUpdate} istFormativ={istFormativ} />
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
