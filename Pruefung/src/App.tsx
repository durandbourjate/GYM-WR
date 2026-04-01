import { useEffect, useState } from 'react'
import { usePruefungStore } from './store/pruefungStore.ts'
import { useAuthStore } from './store/authStore.ts'
import { einrichtungsPruefung } from './data/einrichtungsPruefung.ts'
import { demoFragen } from './data/demoFragen.ts'
import { apiService } from './services/apiService.ts'
import { clearIndexedDB } from './services/autoSave.ts'
import { clearQueue } from './services/retryQueue.ts'
import { resolveFragenFuerPruefung } from './utils/fragenResolver.ts'
import type { Frage } from './types/fragen.ts'
import type { PruefungsConfig } from './types/pruefung.ts'
import LoginScreen from './components/LoginScreen.tsx'
import Startbildschirm from './components/Startbildschirm.tsx'
import Layout from './components/Layout.tsx'
import FragenUebersicht from './components/FragenUebersicht.tsx'
import AbgabeBestaetigung from './components/AbgabeBestaetigung.tsx'
import DurchfuehrenDashboard from './components/lp/durchfuehrung/DurchfuehrenDashboard.tsx'
import { MultiDurchfuehrenDashboard } from './components/lp/durchfuehrung/MultiDurchfuehrenDashboard.tsx'
import LPStartseite from './components/lp/LPStartseite.tsx'
import ThemeToggle from './components/ThemeToggle.tsx'
import KorrekturListe from './components/sus/KorrekturListe.tsx'
import KorrekturEinsicht from './components/sus/KorrekturEinsicht.tsx'

// Theme-Store importieren damit er initialisiert wird
import './store/themeStore.ts'

// Hinweis: Eingebaute Prüfungen (EINGEBAUTE_PRUEFUNGEN) wurden entfernt.
// Alle Prüfungen laufen jetzt über den normalen Backend-Datenfluss (Google Sheets).
// Im Demo-Modus wird die einrichtungsPruefung aus data/einrichtungsPruefung.ts verwendet.

export default function App() {
  // Build-Timestamp für Versions-Verifikation
  useEffect(() => {
    console.log('[Pruefung] Build:', __BUILD_TIMESTAMP__)
  }, [])

  // Notfall-Reset: ?reset=true löscht alles und leitet zum Login weiter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reset') === 'true') {
      // Alles löschen
      try {
        // Alle pruefung-state Keys löschen
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('pruefung-') || key.startsWith('auth-')) {
            localStorage.removeItem(key)
          }
        })
        // IndexedDB löschen
        indexedDB.deleteDatabase('pruefung-backup')
        indexedDB.deleteDatabase('pruefung-retry-queue')
        // Service Worker deregistrieren
        navigator.serviceWorker?.getRegistrations().then(regs =>
          regs.forEach(r => r.unregister())
        )
      } catch { /* ignore */ }
      // Zur sauberen URL weiterleiten
      window.location.href = window.location.pathname
      return
    }
  }, [])

  const phase = usePruefungStore((s) => s.phase)
  const config = usePruefungStore((s) => s.config)
  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  const [pruefungsConfig, setPruefungsConfig] = useState<PruefungsConfig | null>(null)
  const [pruefungsFragen, setPruefungsFragen] = useState<Frage[]>([])
  const [pruefungsAlleFragen, setPruefungsAlleFragen] = useState<Frage[]>([])
  const [wiederhergestellt, setWiederhergestellt] = useState(false)
  const [ladeFehler, setLadeFehler] = useState<string | null>(null)
  const [korrekturId, setKorrekturId] = useState<string | null>(null)
  const [wurdeZurueckgesetzt, setWurdeZurueckgesetzt] = useState(false)

  // Prüfungs-ID aus URL lesen (?id=... oder ?ids=a,b,c für Multi-Modus)
  const urlParams = new URLSearchParams(window.location.search)
  const pruefungIdAusUrl = urlParams.get('id')
  const pruefungIdsAusUrl = urlParams.get('ids')?.split(',').filter(Boolean) ?? []

  // Prüfung laden wenn User eingeloggt ist
  useEffect(() => {
    if (!user) return

    async function ladePruefung(): Promise<void> {
      const storeFragen = usePruefungStore.getState().fragen
      const storeAbgegeben = usePruefungStore.getState().abgegeben
      const storeAntworten = usePruefungStore.getState().antworten

      // SICHERHEIT: Wenn Backend verfuegbar → IMMER Backend-Check bei Reload
      // Verhindert dass localStorage-State ohne Backend-Bestaetigung vertraut wird
      // (z.B. SuS hat abgegeben aber Backend-Save schlug fehl → muss nochmal abgeben koennen)
      // Session-Recovery NUR wenn kein Backend oder Demo-Modus
      if (config && config.id === pruefungIdAusUrl && phase !== 'start' && !storeAbgegeben && storeFragen && storeFragen.length > 0
          && (!apiService.istKonfiguriert() || istDemoModus)) {
        setWiederhergestellt(true)
        usePruefungStore.getState().setPhase('start')
        return
      }

      // Recovery nach Reload: phase ist 'pruefung' aber config fehlt (nicht persistiert)
      // → config+fragen vom Backend laden OHNE antworten zurückzusetzen
      // Wichtig: Nur Recovery wenn gespeicherte pruefungId zur URL passt
      const storePruefungId = usePruefungStore.getState().config?.id
      if (!config && phase === 'pruefung' && Object.keys(storeAntworten).length > 0 && pruefungIdAusUrl && apiService.istKonfiguriert() && !istDemoModus && (!storePruefungId || storePruefungId === pruefungIdAusUrl)) {
        try {
          const result = await apiService.ladePruefung(pruefungIdAusUrl, user!.email)
          if (result) {
            // SICHERHEIT: Prüfung beendet oder bereits abgegeben → Abgabe-Screen zeigen
            if (result.istAbgegeben || result.istBeendet) {
              console.log(`[App] Prüfung ${result.istBeendet ? 'beendet' : 'abgegeben'} (Backend) — Abgabe-Screen anzeigen`)
              usePruefungStore.getState().pruefungAbgeben()
              return
            }
            const { navigationsFragen, alleFragen } = resolveFragenFuerPruefung(result.config, result.fragen)
            // setConfigUndFragen statt pruefungStarten — behält antworten bei
            usePruefungStore.getState().setConfigUndFragen(result.config, navigationsFragen, alleFragen)
            if (result.config.durchfuehrungId) {
              usePruefungStore.getState().setDurchfuehrungId(result.config.durchfuehrungId)
            }
            setPruefungsConfig(result.config)
            setPruefungsFragen(navigationsFragen)
            setPruefungsAlleFragen(alleFragen)
            setWiederhergestellt(true)
            console.log('[App] Recovery nach Reload — config+fragen wiederhergestellt, antworten beibehalten')
            return
          }
        } catch (error) {
          console.error('[App] Recovery nach Reload fehlgeschlagen:', error)
          // Weiter zum normalen Ladevorgang — Layout.tsx hat eigene Recovery-Logik als Fallback
        }
      }

      // Backend konfiguriert + Prüfungs-ID vorhanden + kein Demo → vom Backend laden
      if (apiService.istKonfiguriert() && pruefungIdAusUrl && !istDemoModus) {
        try {
          const result = await apiService.ladePruefung(pruefungIdAusUrl, user!.email)
          if (result) {
            // SICHERHEIT: Prüfung beendet oder bereits abgegeben → Abgabe-Screen zeigen
            if ((result.istAbgegeben || result.istBeendet) && user!.rolle !== 'lp') {
              console.log(`[App] Prüfung ${result.istBeendet ? 'beendet' : 'abgegeben'} (Backend) — Abgabe-Screen anzeigen`)
              // Config setzen damit AbgabeBestaetigung rendern kann (ohne Config → ewiger Loading-Screen)
              const { navigationsFragen, alleFragen } = resolveFragenFuerPruefung(result.config, result.fragen)
              setPruefungsConfig(result.config)
              setPruefungsFragen(navigationsFragen)
              setPruefungsAlleFragen(alleFragen)
              usePruefungStore.getState().pruefungAbgeben()
              return
            }

            // durchfuehrungId-Check: Wenn LP die Prüfung zurückgesetzt hat, stale State löschen
            const storeDfId = usePruefungStore.getState().durchfuehrungId
            const backendDfId = result.config.durchfuehrungId
            if (backendDfId && storeDfId && backendDfId !== storeDfId) {
              console.log('[App] Prüfung wurde zurückgesetzt (durchfuehrungId geändert). State wird gelöscht.')
              usePruefungStore.getState().zuruecksetzen()
              try { localStorage.removeItem(`pruefung-state-${pruefungIdAusUrl}`) } catch { /* ignore */ }
              clearIndexedDB(pruefungIdAusUrl).catch(() => {})
              clearQueue().catch(() => {})
              setWurdeZurueckgesetzt(true)
            }

            const { navigationsFragen, alleFragen } = resolveFragenFuerPruefung(result.config, result.fragen)
            setPruefungsConfig(result.config)
            setPruefungsFragen(navigationsFragen)
            setPruefungsAlleFragen(alleFragen)

            // durchfuehrungId im Store speichern für zukünftige Vergleiche
            if (backendDfId) {
              usePruefungStore.getState().setDurchfuehrungId(backendDfId)
            }

            // Wenn Store noch State einer ANDEREN Prüfung hat (z.B. Demo → echte Prüfung), aufräumen
            if (config && config.id !== result.config.id) {
              console.log('[App] Andere Prüfung im Store als URL — State wird gelöscht.')
              usePruefungStore.getState().zuruecksetzen()
            }

            if (config && config.id === result.config.id && phase !== 'start' && !wurdeZurueckgesetzt) {
              setWiederhergestellt(true)
              usePruefungStore.getState().setPhase('start')
            }
            return
          }
        } catch (error) {
          console.error('[App] Backend-Fehler beim Laden:', error)
          // Nicht crashen — Fehler anzeigen, aber NICHT auf eingebaute Prüfungen zurückfallen
          // (sonst umgeht der Schüler die Freischaltung)
        }

        setLadeFehler('Prüfung konnte nicht geladen werden. Bitte URL prüfen oder Lehrperson kontaktieren.')
        return
      }

      // Fallback: Im Demo-Modus die Demo-Prüfung laden
      const resolvedConfig = { ...einrichtungsPruefung, freigeschaltet: true }
      const { navigationsFragen, alleFragen } = resolveFragenFuerPruefung(resolvedConfig, demoFragen)
      setPruefungsConfig(resolvedConfig)
      setPruefungsFragen(navigationsFragen)
      setPruefungsAlleFragen(alleFragen)

      if (config && config.id === resolvedConfig.id && phase !== 'start') {
        setWiederhergestellt(true)
        usePruefungStore.getState().setPhase('start')
      }
    }

    ladePruefung()
  // eslint-disable-next-line react-hooks/exhaustive-deps — config/phase absichtlich ausgeschlossen: Laden nur bei User/URL-Wechsel, nicht bei State-Aenderung
  }, [user, istDemoModus, pruefungIdAusUrl])

  // Auth-Gate: Kein User → Login-Screen
  if (!user) {
    return <LoginScreen />
  }

  // LP-Modus: mit ?ids= → Multi-Dashboard, mit ?id= → Durchführen, ohne → Startseite
  if (user.rolle === 'lp') {
    if (pruefungIdsAusUrl.length > 1) {
      return <MultiDurchfuehrenDashboard pruefungIds={pruefungIdsAusUrl} />
    }
    if (pruefungIdAusUrl) {
      return <DurchfuehrenDashboard pruefungId={pruefungIdAusUrl} />
    }
    return <LPStartseite />
  }

  // SuS ohne Prüfungs-ID: Korrektur-Einsicht
  if (user.rolle === 'sus' && !pruefungIdAusUrl && !istDemoModus && apiService.istKonfiguriert()) {
    if (korrekturId) {
      return <KorrekturEinsicht pruefungId={korrekturId} onZurueck={() => setKorrekturId(null)} />
    }
    return <KorrekturListe onWaehle={setKorrekturId} />
  }

  // Ladefehler
  if (ladeFehler) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xl">!</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{ladeFehler}</p>
          <button
            onClick={() => { setLadeFehler(null); useAuthStore.getState().abmelden() }}
            className="px-4 py-2 text-sm bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Zurück zum Login
          </button>
        </div>
      </div>
    )
  }

  // Prüfung wird geladen
  if (!pruefungsConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Prüfung wird geladen...</p>
      </div>
    )
  }

  // Routing nach Phase
  switch (phase) {
    case 'start':
      return (
        <Startbildschirm
          config={pruefungsConfig}
          fragen={pruefungsFragen}
          alleFragen={pruefungsAlleFragen}
          wiederhergestellt={wiederhergestellt}
          wurdeZurueckgesetzt={wurdeZurueckgesetzt}
        />
      )
    case 'pruefung':
      return <Layout />
    case 'uebersicht':
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          <FragenUebersicht />
        </div>
      )
    case 'abgegeben':
      return <AbgabeBestaetigung />
    default:
      return null
  }
}
