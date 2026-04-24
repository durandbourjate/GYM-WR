import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useResizableHandle } from '@shared/ui/useResizableHandle'
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
import BaseDialog from './ui/BaseDialog'
import ThemeToggle from './ThemeToggle.tsx'
import SuSHilfeButton from './SuSHilfeButton.tsx'
import MaterialPanel, { type MaterialModus } from './MaterialPanel.tsx'
import FrageRenderer from './FrageRenderer.tsx'
import { findeAbschnitt } from '../utils/abschnitte.ts'
import { istVollstaendigBeantwortet } from '../utils/antwortStatus.ts'
import FrageAnhaenge from './FrageAnhaenge.tsx'

// Einmalige Migration bei Modul-Import: alter Sidebar-Breite-Key (vor Hook-Refactor)
// → neuer Hook-Key mit Präfix. Nach einigen Wochen kann dieser Block entfernt werden.
if (typeof window !== 'undefined') {
  try {
    const alt = localStorage.getItem('pruefung-sidebar-breite')
    const neu = localStorage.getItem('sidebar-pruefung-sidebar-breite')
    if (alt !== null && neu === null) {
      localStorage.setItem('sidebar-pruefung-sidebar-breite', alt)
      localStorage.removeItem('pruefung-sidebar-breite')
    }
  } catch { /* ignore */ }
}

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

  // Demo-Modus (keine Sperre bei Verstössen, nur Warnung)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Lockdown: Copy/Paste, Vollbild, DevTools, Verstoss-Zähler
  const kontrollStufe = (kontrollStufeOverride || (config?.kontrollStufe as KontrollStufe) || 'keine') as KontrollStufe
  const lockdown = useLockdown({
    kontrollStufe,
    aktiv: !!config && !abgegeben,
    istDemoModus,
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

  // Sidebar-Breite: Resizable per Drag, persistiert in localStorage via shared Hook.
  // SuS-Sidebar sitzt links, Drag-Handle rechts am Rand → side='right' (Handle-Position).
  const { width: sidebarBreite, onPointerDown: handleSidebarResizeStart } = useResizableHandle({
    defaultWidth: 224, // w-56 = 14rem = 224px
    minWidth: 140,
    maxWidth: 320,
    side: 'right',
    storageKey: 'pruefung-sidebar-breite',
  })

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

  const materialOffen = materialModus !== 'aus'
  const istSplitModus = materialModus === 'split'

  return (
    <div className="h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
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
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header — Timer über Sidebar, Zurück neben Sidebar, Counter zentriert, Weiter/Abgeben rechts */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-2 py-1.5 sticky top-0 z-20">
        <div className="flex items-center">
          {/* === LINKS: Timer (über Sidebar-Breite) + Zurück (neben Sidebar) === */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Timer-Bereich: gleiche Breite wie Sidebar */}
            <div className="hidden md:flex items-center gap-1.5 shrink-0 pr-4" style={{ width: istSplitModus ? Math.min(sidebarBreite, 176) : sidebarBreite }}>
              <AutoSaveIndikator />
              <Timer onZeitAbgelaufen={() => setZeitAbgelaufen(true)} />
            </div>
            {/* Mobile: Timer inline */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <AutoSaveIndikator />
              <Timer onZeitAbgelaufen={() => setZeitAbgelaufen(true)} />
            </div>
            {/* Zurück — direkt neben der Sidebar */}
            <button
              onClick={vorherigeFrage}
              disabled={aktuelleFrageIndex === 0}
              className="px-2.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[44px] flex items-center gap-1"
            >
              <span>&larr;</span>
              <span className="hidden sm:inline">Zurück</span>
            </button>
          </div>

          {/* === MITTE: Counter + Online (zentriert) === */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums font-semibold whitespace-nowrap">
              {aktuelleFrageIndex + 1} / {fragen.length}
            </span>
            <VerbindungsStatus />
          </div>

          {/* === RECHTS: Unsicher + Weiter + Abgeben === */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
            {aktuelleFrage && (
              <button
                onClick={() => toggleMarkierung(aktuelleFrage.id)}
                className={`px-2 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer flex items-center gap-1 min-h-[44px]
                  ${istMarkiert
                    ? 'bg-amber-100 border-amber-400 text-amber-800 font-semibold dark:bg-amber-900/40 dark:border-amber-600 dark:text-amber-300'
                    : 'border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                <span>?</span>
                <span className="hidden lg:inline">{istMarkiert ? 'Markiert ✓' : 'Unsicher'}</span>
              </button>
            )}

            <button
              onClick={naechsteFrage}
              disabled={aktuelleFrageIndex === fragen.length - 1}
              className="px-3 py-1.5 text-sm font-medium text-white bg-slate-700 dark:bg-slate-200 dark:text-slate-800 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer min-h-[44px] flex items-center gap-1"
            >
              <span className="hidden sm:inline">Weiter</span>
              <span>&rarr;</span>
            </button>

            {!abgegeben && (
              <button
                onClick={() => setZeigAbgabeDialog(true)}
                className="px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 transition-colors cursor-pointer min-h-[44px]"
              >
                Abgeben
              </button>
            )}
          </div>
        </div>
        {/* Fortschrittsbalken */}
        <div className="mt-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
          <aside
            className="hidden md:flex md:flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 shrink-0 relative"
            style={{ width: istSplitModus ? Math.min(sidebarBreite, 176) : sidebarBreite }}
          >
            {/* Material-Button zuoberst */}
            {config.materialien && config.materialien.length > 0 && (
              <button
                onClick={handleMaterialToggle}
                className={`w-full mb-3 px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer flex items-center justify-center gap-1.5
                  ${materialOffen
                    ? 'bg-violet-100 border-violet-400 text-violet-800 font-medium dark:bg-violet-900/30 dark:border-violet-500 dark:text-violet-300'
                    : 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/20 dark:border-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40'
                  }
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {materialOffen ? 'Material schliessen' : 'Material'}
              </button>
            )}

            {user && (
              <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                {user.email && user.email !== 'demo@example.com' && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                )}
              </div>
            )}

            {/* Fragen-Navigation (scrollbar) */}
            <div className="flex-1 overflow-auto">
              <FragenNavigation />
            </div>

            {/* Sidebar-Fusszeile: Hilfe + Theme */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-1">
              <SuSHilfeButton />
              <ThemeToggle />
            </div>

            {/* Resize-Handle am rechten Rand */}
            <div
              onPointerDown={handleSidebarResizeStart}
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-violet-400 active:bg-violet-500 z-10 transition-colors"
              title="Sidebar-Breite anpassen"
            />
          </aside>

          {/* Fragenbereich — volle Breite nutzen */}
          <main className={`flex-1 overflow-auto min-w-0 ${istSplitModus ? 'px-3 py-3 md:px-4 md:py-4' : 'px-3 py-3 md:px-6 md:py-4'}`}>
            <div>
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
        <BaseDialog
          open={true}
          onClose={() => {}}
          title={beendetUm ? (config?.typ === 'formativ' ? 'Übung beendet' : 'Prüfung beendet') : 'Zeit abgelaufen'}
          maxWidth="md"
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 dark:bg-slate-300 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white dark:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-1">
              {beendetUm
                ? `Die Lehrperson hat die ${config?.typ === 'formativ' ? 'Übung' : 'Prüfung'} beendet. Ihre Antworten wurden automatisch abgegeben.`
                : `Ihre ${config?.typ === 'formativ' ? 'Übung' : 'Prüfung'} wurde automatisch abgegeben.`}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Alle Antworten wurden gespeichert. Sie können das Fenster schliessen.
            </p>
          </div>
        </BaseDialog>
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
