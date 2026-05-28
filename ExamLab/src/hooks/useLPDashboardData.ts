import { useCallback, useEffect, useState } from 'react'
import { apiService } from '../services/apiService'
import { useStammdatenStore } from '../store/stammdatenStore'
import { useFavoritenStore } from '../store/favoritenStore'
import { useFragensammlungStore } from '../store/fragensammlungStore'
import { useConfigsListStore } from '../store/configsListStore'
import { useToast } from '@gymhofwil/shared'
import { schreibeGespeicherteAnzahl } from '../utils/skeletonAnzahl'
import { erstelleDemoTrackerDaten } from '../utils/trackerUtils'
import { syncEinrichtungsPruefung, syncEinrichtungsUebung } from '../utils/lpEinrichtungSync'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import type { PruefungsConfig } from '../types/pruefung'
import type { TrackerDaten, TrackerPruefungSummary } from '../types/tracker'

export interface UseLPDashboardDataResult {
  configs: PruefungsConfig[]
  configsLadeStatus: 'laden' | 'fertig'
  trackerLadeStatus: 'laden' | 'fertig'
  trackerDaten: TrackerDaten | null
  backendFehler: boolean
  findeTrackerSummary: (pruefungId: string) => TrackerPruefungSummary | undefined
  reload: () => Promise<void>
}

/** Demo-Konfigurationen für den Demo-Modus — Einrichtungsprüfung + Einführungsübung */
function demoConfigs(): PruefungsConfig[] {
  return [einrichtungsPruefung, einrichtungsUebung]
}

/**
 * Lädt LP-Configs + Tracker-Daten + Sync von Einrichtungsprüfung/-übung.
 * Vorher: inline in LPStartseite (5 useState + 95-Z-useEffect + handleZurueck-Reload-Pfad).
 *
 * Quelle (byte-identisch): `LPStartseite.tsx` Z. 129-132+136 (5 useState),
 * Z. 300-394 (95-Z-useEffect), Z. 459-475 (`handleZurueck`-Reload-Pfad),
 * Z. 482-485 (`findeTrackerSummary`), Z. 1041-1043 (`demoConfigs`).
 *
 * `reload()` wird von `handleZurueck` aufgerufen — Reload-Pfad OHNE Sync (analog Z. 463-475).
 */
export function useLPDashboardData(opts: {
  user: { email: string } | null
  istDemoModus: boolean
}): UseLPDashboardDataResult {
  const { user, istDemoModus } = opts
  const toast = useToast()

  const [configs, setConfigs] = useState<PruefungsConfig[]>([])
  const [configsLadeStatus, setConfigsLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [trackerLadeStatus, setTrackerLadeStatus] = useState<'laden' | 'fertig'>('laden')
  const [backendFehler, setBackendFehler] = useState(false)
  const [trackerDaten, setTrackerDaten] = useState<TrackerDaten | null>(null)

  // Alle Prüfungs-Configs + Tracker-Daten laden — byte-identisch zu LPStartseite.tsx Z. 300-394
  useEffect(() => {
    let abgebrochen = false
    let syncTimeoutId: ReturnType<typeof setTimeout> | null = null

    async function lade(): Promise<void> {
      if (!user) return

      if (istDemoModus || !apiService.istKonfiguriert()) {
        // Demo-Daten
        const demo = demoConfigs()
        setConfigs(demo)
        useConfigsListStore.getState().setConfigs(demo)
        setTrackerDaten(erstelleDemoTrackerDaten())
        setConfigsLadeStatus('fertig')
        setTrackerLadeStatus('fertig')
        return
      }

      // Stammdaten + LP-Profil parallel laden (Fire-and-forget, blockiert nicht)
      const { ladeStammdaten, ladeLPProfil } = useStammdatenStore.getState()
      ladeStammdaten(user.email)
      ladeLPProfil(user.email).then(() => {
        // Cluster E.3: Hydrate favoritenStore aus LPProfil.favoriten (Server-State)
        useFavoritenStore.getState().ladeAusBackend()
      })

      // Configs + Fragensammlung-Summaries parallel laden (schnell ~3-5s)
      // TrackerDaten separat im Hintergrund (langsam ~6-8s, blockiert UI nicht)
      useFragensammlungStore.getState().lade(user.email)
      let configResult: PruefungsConfig[] | null = null
      try {
        configResult = await apiService.ladeAlleConfigs(user.email)
      } catch (err) {
        console.warn('[LP] ladeAlleConfigs Exception:', err)
        configResult = null
      }

      if (abgebrochen) return  // Guard nach await

      if (configResult) {
        setConfigs(configResult)
        useConfigsListStore.getState().setConfigs(configResult)
        setBackendFehler(false)
        // Persist Anzahl summativ/formativ für layout-akkurates Skeleton beim nächsten Login
        const summativeAnzahl = configResult.filter(c => c.typ !== 'formativ').length
        const formativeAnzahl = configResult.filter(c => c.typ === 'formativ').length
        schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl', summativeAnzahl)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl', formativeAnzahl)
        // Einrichtungsprüfung/-übung: nur einmal pro Browser-Session syncen
        // WICHTIG: Verzögert + seriell um Backend nicht zu überlasten (Session 91 Fix)
        // Nicht starten wenn LP gerade eine Durchführung hat (SuS-Saves haben Priorität)
        const SYNC_DONE_KEY = 'examlab-sync-done'
        const istDurchfuehrung = window.location.search.includes('id=')
        if (!sessionStorage.getItem(SYNC_DONE_KEY) && !istDurchfuehrung) {
          // 10s Verzögerung damit Dashboard-Laden + LP-Monitoring Vorrang haben
          syncTimeoutId = setTimeout(async () => {
            if (abgebrochen) return  // Guard am Anfang des Timeout-Bodies
            try {
              // Seriell: erst Prüfung, dann Übung (nicht parallel!)
              await syncEinrichtungsPruefung(user.email, (msg) => toast.warning(msg))
              if (abgebrochen) return
              await syncEinrichtungsUebung(user.email, (msg) => toast.warning(msg))
              if (abgebrochen) return
              sessionStorage.setItem(SYNC_DONE_KEY, '1')
              const neueConfigs = await apiService.ladeAlleConfigs(user.email)
              if (abgebrochen) return
              if (neueConfigs) {
                setConfigs(neueConfigs)
                useConfigsListStore.getState().setConfigs(neueConfigs)
              }
            } catch (err) {
              console.warn('[LP] Sync fehlgeschlagen, wird beim nächsten Mount erneut versucht:', err)
            }
          }, 10_000)
        }
      } else {
        console.warn("[LP] Configs nicht ladbar — Composer bleibt nutzbar")
        setConfigs([])
        setBackendFehler(true)
      }

      if (abgebrochen) return  // Guard vor letztem State-Setter

      // Dashboard sofort interaktiv zeigen (Tracker lädt im Hintergrund)
      setConfigsLadeStatus("fertig")

      // TrackerDaten im Hintergrund nachladen (non-blocking, ~6-8s)
      apiService.ladeTrackerDaten(user.email)
        .then(trackerResult => {
          if (abgebrochen) return
          if (trackerResult) setTrackerDaten(trackerResult)
          setTrackerLadeStatus('fertig')
        })
        .catch(err => {
          if (abgebrochen) return
          console.warn('[LP] Tracker-Laden fehlgeschlagen:', err)
          setTrackerLadeStatus('fertig')
        })
    }
    lade()

    return () => {
      abgebrochen = true
      if (syncTimeoutId !== null) clearTimeout(syncTimeoutId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- toast ist Modul-Singleton (useToast.ts toastApi), Identity stabil; deps byte-identisch zur Quelle LPStartseite Z. 394
  }, [user, istDemoModus])

  const reload = useCallback(async () => {
    setConfigsLadeStatus('laden')
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      const result = await apiService.ladeAlleConfigs(user.email)
      if (result) {
        setConfigs(result)
        useConfigsListStore.getState().setConfigs(result)
        setBackendFehler(false)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-summative-anzahl', result.filter(c => c.typ !== 'formativ').length)
        schreibeGespeicherteAnzahl('examlab-lp-letzte-formative-anzahl', result.filter(c => c.typ === 'formativ').length)
      } else {
        setBackendFehler(true)
      }
      setConfigsLadeStatus('fertig')
    } else {
      const demo = demoConfigs()
      setConfigs(demo)
      useConfigsListStore.getState().setConfigs(demo)
      setBackendFehler(false)
      setConfigsLadeStatus('fertig')
    }
  }, [user, istDemoModus])

  const findeTrackerSummary = useCallback((pruefungId: string): TrackerPruefungSummary | undefined => {
    if (!trackerDaten) return undefined
    return trackerDaten.pruefungen.find((p) => p.pruefungId === pruefungId)
  }, [trackerDaten])

  return {
    configs,
    configsLadeStatus,
    trackerLadeStatus,
    trackerDaten,
    backendFehler,
    findeTrackerSummary,
    reload,
  }
}
