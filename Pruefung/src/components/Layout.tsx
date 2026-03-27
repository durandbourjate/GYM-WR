import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { resolveFragenFuerPruefung } from '../utils/fragenResolver.ts'
import { usePruefungsMonitoring } from '../hooks/usePruefungsMonitoring.ts'
import { usePruefungsUX } from '../hooks/usePruefungsUX.ts'
import { useTabKonflikt } from '../hooks/useTabKonflikt.ts'
import { useLockdown } from '../hooks/useLockdown.ts'
import { useLPNachrichten } from '../hooks/useLPNachrichten.ts'
import { VerstossOverlay } from './VerstossOverlay.tsx'
import { SperreOverlay } from './SperreOverlay.tsx'
import { istImSEB } from '../services/sebService.ts'
import type { KontrollStufe, Verstoss } from '../types/lockdown.ts'
import Timer from './Timer.tsx'
import VerbindungsStatus from './VerbindungsStatus.tsx'
import AutoSaveIndikator from './AutoSaveIndikator.tsx'
import FragenNavigation from './FragenNavigation.tsx'
import AbgabeDialog from './AbgabeDialog.tsx'
import ThemeToggle from './ThemeToggle.tsx'
import MaterialPanel, { type MaterialModus } from './MaterialPanel.tsx'
import FrageRenderer from './FrageRenderer.tsx'
import { findeAbschnitt } from '../utils/abschnitte.ts'
import { istVollstaendigBeantwortet } from '../utils/antwortStatus.ts'
import FrageAnhaenge from './FrageAnhaenge.tsx'

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const alleFragen = usePruefungStore((s) => s.alleFragen)
  const aktuelleFrageIndex = usePruefungStore((s) => s.aktuelleFrageIndex)
  const antworten = usePruefungStore((s) => s.antworten)
  const markierungen = usePruefungStore((s) => s.markierungen)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const naechsteFrage = usePruefungStore((s) => s.naechsteFrage)
  const vorherigeFrage = usePruefungStore((s) => s.vorherigeFrage)
  const toggleMarkierung = usePruefungStore((s) => s.toggleMarkierung)
  const [zeigAbgabeDialog, setZeigAbgabeDialog] = useState(false)
  const [materialModus, setMaterialModus] = useState<'aus' | MaterialModus>('aus')
  const [tabKonfliktGeschlossen, setTabKonfliktGeschlossen] = useState(false)
  const [zeitAbgelaufen, setZeitAbgelaufen] = useState(false)
  const [kontrollStufeOverride, setKontrollStufeOverride] = useState<KontrollStufe | null>(null)
  const beendetUm = usePruefungStore((s) => s.beendetUm)
  const restzeitMinuten = usePruefungStore((s) => s.restzeitMinuten)
  const multiTabWarnung = usePruefungStore((s) => s.multiTabWarnung)

  // Tab-Konflikterkennung (client-seitig + server-seitig)
  const tabKonflikt = useTabKonflikt(config?.id ?? null)
  const istTabKonflikt = tabKonflikt || multiTabWarnung

  // Lockdown: Copy/Paste, Vollbild, DevTools, Verstoss-Zähler
  const kontrollStufe = (kontrollStufeOverride || (config?.kontrollStufe as KontrollStufe) || 'keine') as KontrollStufe
  const lockdown = useLockdown({
    kontrollStufe,
    aktiv: !!config && !abgegeben,
  })

  // Monitoring: Auto-Save (lokal + remote), Heartbeat, Focus-Detection, Online/Offline
  // Lockdown-Daten werden im Heartbeat mitgesendet, Tab-Wechsel als Verstoss registriert
  usePruefungsMonitoring({
    getLockdownMeta: () => {
      if (!config || abgegeben) return undefined
      return {
        geraet: lockdown.geraet,
        vollbild: lockdown.vollbildAktiv,
        kontrollStufe: lockdown.effektiveKontrollStufe,
        verstossZaehler: lockdown.verstossZaehler,
        gesperrt: lockdown.gesperrt,
        neusteVerstoesse: lockdown.neueVerstoesseSeitLetztemSync(),
      }
    },
    onTabWechsel: (dauerSekunden) => {
      lockdown.registriereVerstoss('tab-wechsel', dauerSekunden)
    },
    onEntsperrt: () => {
      lockdown.entsperre()
    },
    onKontrollStufeOverride: (stufe) => {
      setKontrollStufeOverride(stufe as KontrollStufe)
    },
  })

  // Verstoss-Overlay State
  const [zeigeVerstossOverlay, setZeigeVerstossOverlay] = useState(false)
  const [letzterVerstoss, setLetzterVerstoss] = useState<Verstoss | null>(null)
  const vorherigerZaehler = useRef(0)

  // Bei neuem Verstoss (der zählt): Overlay zeigen
  useEffect(() => {
    if (lockdown.verstossZaehler > vorherigerZaehler.current && lockdown.verstossZaehler < lockdown.maxVerstoesse) {
      setLetzterVerstoss(lockdown.verstoesse[lockdown.verstoesse.length - 1])
      setZeigeVerstossOverlay(true)
    }
    vorherigerZaehler.current = lockdown.verstossZaehler
  }, [lockdown.verstossZaehler, lockdown.maxVerstoesse, lockdown.verstoesse])

  // Vollbild verlassen wenn Prüfung abgegeben (manuell, Auto-Abgabe, oder LP beendet)
  useEffect(() => {
    if (abgegeben && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }, [abgegeben])

  // UX: beforeunload-Warnung, Tastaturnavigation, Escape
  const handleAbgabeDialogSchliessen = useCallback(() => setZeigAbgabeDialog(false), [])
  const handleAbgabeDialogOeffnen = useCallback(() => setZeigAbgabeDialog(true), [])
  usePruefungsUX({
    onAbgabeDialogOeffnen: handleAbgabeDialogOeffnen,
    onAbgabeDialogSchliessen: handleAbgabeDialogSchliessen,
  })

  // LP-Nachrichten für SuS
  const { ungelesenNachrichten, schliesseNachricht } = useLPNachrichten({
    pruefungId: config?.id,
    email: user?.email,
    enabled: !!user && !!config && !abgegeben,
  })

  // Prüfungs-ID aus URL für Recovery
  const pruefungIdAusUrl = useMemo(() => new URLSearchParams(window.location.search).get('id'), [])

  // Recovery: config/fragen fehlen nach Reload (werden nicht persistiert)
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'loading' | 'failed'>('idle')
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    if (config && fragen.length > 0) return // Alles vorhanden
    if (recoveryAttempted.current) return // Schon versucht
    if (!pruefungIdAusUrl || !user?.email) {
      setRecoveryStatus('failed')
      return
    }

    recoveryAttempted.current = true
    setRecoveryStatus('loading')

    const timeout = setTimeout(() => {
      setRecoveryStatus('failed')
    }, 10000)

    apiService.ladePruefung(pruefungIdAusUrl, user.email)
      .then((result) => {
        clearTimeout(timeout)
        if (result) {
          const { navigationsFragen, alleFragen: resolvedAlle } = resolveFragenFuerPruefung(result.config, result.fragen)
          usePruefungStore.getState().setConfigUndFragen(result.config, navigationsFragen, resolvedAlle)
          // durchfuehrungId aktualisieren falls nötig
          if (result.config.durchfuehrungId) {
            usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
          }
          console.log('[Layout] Recovery erfolgreich — config+fragen wiederhergestellt')
        } else {
          setRecoveryStatus('failed')
        }
      })
      .catch((err) => {
        clearTimeout(timeout)
        console.error('[Layout] Recovery fehlgeschlagen:', err)
        setRecoveryStatus('failed')
      })

    return () => clearTimeout(timeout)
  }, [config, fragen, pruefungIdAusUrl, user])

  if (!config || fragen.length === 0) {
    // Recovery läuft oder noch nicht gestartet
    if (recoveryStatus !== 'failed') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-slate-300 dark:border-slate-600 border-t-slate-700 dark:border-t-slate-300 rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">Sitzung wird wiederhergestellt...</p>
          </div>
        </div>
      )
    }

    // Recovery fehlgeschlagen
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-2">Prüfungsdaten konnten nicht wiederhergestellt werden.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Ihre bisherigen Antworten gehen beim Zurücksetzen verloren.</p>
          <button
            onClick={() => {
              if (window.confirm('Alle bisherigen Antworten gehen verloren. Fortfahren?')) {
                usePruefungStore.getState().zuruecksetzen()
                window.location.reload()
              }
            }}
            className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zurück zum Start
          </button>
        </div>
      </div>
    )
  }

  const aktuelleFrage = fragen[aktuelleFrageIndex]
  const istMarkiert = aktuelleFrage ? !!markierungen[aktuelleFrage.id] : false

  // Abschnitt-Kontext für aktuelle Frage
  const abschnittInfo = findeAbschnitt(config, aktuelleFrageIndex, fragen)

  // Fortschritt: Anzahl beantworteter Fragen (mit korrekter Aufgabengruppen-Prüfung)
  const beantwortetAnzahl = fragen.filter((f) => istVollstaendigBeantwortet(f, antworten[f.id], alleFragen, antworten)).length
  const fortschrittProzent = fragen.length > 0 ? (beantwortetAnzahl / fragen.length) * 100 : 0

  /** Header-Button: aus → split (Desktop) / overlay (Mobile), split/overlay → aus */
  const handleMaterialToggle = useCallback(() => {
    if (materialModus === 'aus') {
      // Mobile (< 768px) immer Overlay, Desktop startet im Split-Modus
      const istMobile = window.innerWidth < 768
      setMaterialModus(istMobile ? 'overlay' : 'split')
    } else {
      setMaterialModus('aus')
    }
  }, [materialModus])

  /** Moduswechsel innerhalb des Panels (Split ↔ Overlay) */
  const handleMaterialModusWechsel = useCallback((neuerModus: MaterialModus) => {
    setMaterialModus(neuerModus)
  }, [])

  const materialOffen = materialModus !== 'aus'
  const istSplitModus = materialModus === 'split'

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* SEB-Warnung */}
      {/* SEB-Warnung — absichtlich nicht schliessbar */}
      {config.sebErforderlich && !istImSEB() && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Diese Prüfung sollte im Safe Exam Browser (SEB) geschrieben werden. Du verwendest einen normalen Browser.
          </p>
        </div>
      )}

      {/* Tab-Konflikt-Warnung (client-seitig oder server-seitig) */}
      {istTabKonflikt && !tabKonfliktGeschlossen && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-300 dark:border-red-700 px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Achtung:</strong> {multiTabWarnung
              ? 'Diese Prüfung wurde in einem neueren Tab geöffnet. Ihr Fortschritt wurde dort übernommen. Bitte dort weiterarbeiten.'
              : 'Diese Prüfung ist in einem anderen Tab geöffnet. Bitte nur in einem Tab arbeiten.'}
          </p>
          <button
            onClick={() => setTabKonfliktGeschlossen(true)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-lg leading-none cursor-pointer"
            title="Warnung schliessen"
          >
            &times;
          </button>
        </div>
      )}

      {/* LP-Nachrichten */}
      {ungelesenNachrichten.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-300 dark:border-blue-700 px-4 py-2 space-y-1">
          {ungelesenNachrichten.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200 min-w-0">
                <span className="flex-shrink-0 font-medium">Lehrperson:</span>
                <span className="break-words min-w-0">{n.text}</span>
                <span className="flex-shrink-0 text-xs text-blue-500 dark:text-blue-400 tabular-nums mt-0.5">
                  {new Date(n.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => schliesseNachricht(n.id)}
                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 text-lg leading-none flex-shrink-0 cursor-pointer"
                title="Nachricht schliessen"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header — kompakt: Timer, Counter, Material, Abgeben, Theme */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-2 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-2">
          {/* Links: Timer + AutoSave */}
          <div className="flex items-center gap-2">
            <AutoSaveIndikator />
            <Timer onZeitAbgelaufen={() => setZeitAbgelaufen(true)} />
          </div>

          {/* Mitte: Frage-Counter */}
          <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums font-medium">
            {aktuelleFrageIndex + 1} / {fragen.length}
          </span>

          {/* Rechts: Material + Abgeben + Status + Theme */}
          <div className="flex items-center gap-1.5">
            {/* Material-Button (nur wenn Materialien vorhanden) */}
            {config.materialien && config.materialien.length > 0 && (
              <button
                onClick={handleMaterialToggle}
                title={materialOffen ? 'Material schliessen' : 'Material anzeigen'}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]
                  ${materialOffen
                    ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Material</span>
              </button>
            )}

            {!abgegeben && (
              <button
                onClick={() => setZeigAbgabeDialog(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 transition-colors cursor-pointer min-h-[44px] sm:min-h-0 sm:py-1.5 sm:text-xs"
              >
                Abgeben
              </button>
            )}

            <VerbindungsStatus />
            <ThemeToggle />
          </div>
        </div>
        {/* Fortschrittsbalken */}
        <div className="mt-1.5 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-500 dark:bg-slate-400 transition-all duration-500"
            style={{ width: `${fortschrittProzent}%` }}
          />
        </div>
      </header>

      {/* Main — Split-Layout wenn Material im Split-Modus offen */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Linke Seite: Sidebar + Fragenbereich */}
        <div className="flex min-w-0 flex-1 transition-all duration-200">
          {/* Sidebar Navigation */}
          <aside className={`hidden md:block bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-auto ${istSplitModus ? 'w-44' : 'w-56'} shrink-0`}>
            {user && (
              <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                {user.email && user.email !== 'demo@example.com' && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                )}
              </div>
            )}
            <FragenNavigation />
          </aside>

          {/* Fragenbereich */}
          <main className={`flex-1 overflow-auto min-w-0 ${istSplitModus ? 'p-3 md:p-5' : 'p-4 md:p-8'}`}>
            <div className={istSplitModus ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}>
              {/* Navigation über der Frage: Zurück / Frage X von Y / Weiter + Unsicher */}
              <div className="mb-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={vorherigeFrage}
                    disabled={aktuelleFrageIndex === 0}
                    title="Vorherige Frage"
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[44px] flex items-center gap-1"
                  >
                    <span>&larr;</span>
                    <span className="hidden sm:inline">Zurück</span>
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-300 tabular-nums font-semibold">
                    Frage {aktuelleFrageIndex + 1} von {fragen.length}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Unsicher-Toggle links neben Weiter */}
                    {aktuelleFrage && (
                      <button
                        onClick={() => toggleMarkierung(aktuelleFrage.id)}
                        title={istMarkiert ? 'Markierung entfernen' : 'Als unsicher markieren'}
                        className={`px-3 py-2.5 text-sm rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]
                          ${istMarkiert
                            ? 'bg-amber-100 border-amber-400 text-amber-800 font-semibold dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300'
                            : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }
                        `}
                      >
                        <span>?</span>
                        <span className="hidden sm:inline">{istMarkiert ? 'Markiert \u2713' : 'Unsicher'}</span>
                      </button>
                    )}
                    <button
                      onClick={naechsteFrage}
                      disabled={aktuelleFrageIndex === fragen.length - 1}
                      title="Nächste Frage"
                      className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[44px] flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Weiter</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Abschnitt-Header */}
              {abschnittInfo && abschnittInfo.istErsteFrage && (
                <div className="mb-5 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {abschnittInfo.abschnitt.titel}
                  </h2>
                  {abschnittInfo.abschnitt.beschreibung && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {abschnittInfo.abschnitt.beschreibung}
                    </p>
                  )}
                </div>
              )}

              {/* Abschnitt-Kontext (kompakt, wenn nicht erste Frage) */}
              {abschnittInfo && !abschnittInfo.istErsteFrage && (
                <div className="mb-3 text-xs text-slate-400 dark:text-slate-500">
                  {abschnittInfo.abschnitt.titel} · Frage {abschnittInfo.positionImAbschnitt + 1} von {abschnittInfo.abschnitt.fragenIds.length}
                </div>
              )}

              {aktuelleFrage && (
                <div key={aktuelleFrage.id}>
                  <FrageRenderer frage={aktuelleFrage} />
                  <FrageAnhaenge anhaenge={aktuelleFrage.anhaenge ?? []} />
                </div>
              )}

              {/* Mobile Navigation (Kacheln) */}
              <div className="md:hidden mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <FragenNavigation />
              </div>
            </div>
          </main>
        </div>

        {/* Material-Panel im Split-Modus (rechts neben dem Fragenbereich) */}
        {istSplitModus && config.materialien && config.materialien.length > 0 && (
          <MaterialPanel
            materialien={config.materialien}
            modus="split"
            onSchliessen={() => setMaterialModus('aus')}
            onModusWechsel={handleMaterialModusWechsel}
          />
        )}
      </div>

      {/* Beenden-Banner (LP hat Prüfung beendet, SuS hat noch Restzeit) */}
      {beendetUm && !abgegeben && restzeitMinuten && restzeitMinuten > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-300 dark:border-amber-700 px-4 py-2 text-center">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Die Lehrperson hat die Prüfung beendet. Du hast noch {restzeitMinuten} Minuten Zeit zum Abschliessen.
          </p>
        </div>
      )}

      {/* Zeitablauf-Dialog (prominent, zentriert — wie AbgabeDialog-Erfolg) */}
      {zeitAbgelaufen && abgegeben && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 dark:bg-slate-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              {beendetUm ? 'Prüfung beendet' : 'Zeit abgelaufen'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-1">
              {beendetUm
                ? 'Die Lehrperson hat die Prüfung beendet. Ihre Antworten wurden automatisch abgegeben.'
                : 'Ihre Prüfung wurde automatisch abgegeben.'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Alle Antworten wurden gespeichert. Sie können das Fenster schliessen.
            </p>
          </div>
        </div>
      )}

      {/* Abgabe-Dialog */}
      {zeigAbgabeDialog && (
        <AbgabeDialog onSchliessen={() => setZeigAbgabeDialog(false)} />
      )}

      {/* Material-Panel im Overlay-Modus */}
      {materialModus === 'overlay' && config.materialien && config.materialien.length > 0 && (
        <MaterialPanel
          materialien={config.materialien}
          modus="overlay"
          onSchliessen={() => setMaterialModus('aus')}
          onModusWechsel={handleMaterialModusWechsel}
        />
      )}

      {/* Lockdown: Sperre-Overlay (höchste Priorität, aber nicht wenn LP beendet hat oder SuS abgegeben) */}
      {lockdown.gesperrt && !beendetUm && !abgegeben && <SperreOverlay />}

      {/* Lockdown: Verstoss-Warnung */}
      {zeigeVerstossOverlay && letzterVerstoss && !lockdown.gesperrt && (
        <VerstossOverlay
          verstoss={letzterVerstoss}
          verstossZaehler={lockdown.verstossZaehler}
          maxVerstoesse={lockdown.maxVerstoesse}
          onZurueck={() => setZeigeVerstossOverlay(false)}
        />
      )}
    </div>
  )
}
