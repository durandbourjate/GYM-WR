import { useEffect, useRef } from 'react'
import { usePruefungStore } from '../store/pruefungStore.ts'
import { useAuthStore } from '../store/authStore.ts'
import { apiService } from '../services/apiService.ts'
import { saveToIndexedDB } from '../services/autoSave.ts'
import { enqueue, processQueue } from '../services/retryQueue.ts'
import type { Antwort } from '../types/antworten.ts'
import type { LockdownMeta } from '../services/pruefungApi.ts'

/** Optionale Callbacks für Lockdown-Integration */
export interface MonitoringLockdownCallbacks {
  /** Gibt aktuelle Lockdown-Metadaten für Heartbeat zurück */
  getLockdownMeta?: () => LockdownMeta | undefined
  /** Wird bei Tab-Wechsel (visibilitychange) aufgerufen */
  onTabWechsel?: (dauerSekunden: number) => void
  /** Wird aufgerufen wenn Backend eine Entsperrung signalisiert */
  onEntsperrt?: () => void
  /** Wird aufgerufen wenn Backend eine Kontrollstufen-Änderung signalisiert */
  onKontrollStufeOverride?: (stufe: string) => void
}

/**
 * Zentraler Monitoring-Hook für die Prüfungsphase.
 * Verwaltet: Auto-Save (lokal + remote), Heartbeat, Focus-Detection.
 * Wird in Layout.tsx eingebunden.
 */
export function usePruefungsMonitoring(lockdownCallbacks?: MonitoringLockdownCallbacks): void {
  const config = usePruefungStore((s) => s.config)
  const fragen = usePruefungStore((s) => s.fragen)
  const antworten = usePruefungStore((s) => s.antworten)
  const startzeit = usePruefungStore((s) => s.startzeit)
  const abgegeben = usePruefungStore((s) => s.abgegeben)
  const remoteSaveVersion = usePruefungStore((s) => s.remoteSaveVersion)
  const setLetzterSave = usePruefungStore((s) => s.setLetzterSave)
  const incrementAutoSaveCount = usePruefungStore((s) => s.incrementAutoSaveCount)
  const incrementRemoteSaveVersion = usePruefungStore((s) => s.incrementRemoteSaveVersion)
  const incrementHeartbeats = usePruefungStore((s) => s.incrementHeartbeats)
  const incrementNetzwerkFehler = usePruefungStore((s) => s.incrementNetzwerkFehler)
  const setVerbindungsstatus = usePruefungStore((s) => s.setVerbindungsstatus)
  const addUnterbrechung = usePruefungStore((s) => s.addUnterbrechung)
  const setBeendetUm = usePruefungStore((s) => s.setBeendetUm)

  const user = useAuthStore((s) => s.user)
  const istDemoModus = useAuthStore((s) => s.istDemoModus)

  // Refs für stale-closure Schutz in Intervals
  const antwortenRef = useRef(antworten)
  antwortenRef.current = antworten
  const remoteSaveVersionRef = useRef(remoteSaveVersion)
  remoteSaveVersionRef.current = remoteSaveVersion

  // Refs für Lockdown-Callbacks (stale-closure Schutz)
  const lockdownCallbacksRef = useRef(lockdownCallbacks)
  lockdownCallbacksRef.current = lockdownCallbacks

  const backendVerfuegbar = apiService.istKonfiguriert() && !istDemoModus && !!user?.email

  // === 1. IndexedDB Auto-Save (alle 15s) ===
  useEffect(() => {
    if (!config || abgegeben) return

    const interval = setInterval(() => {
      saveToIndexedDB(config.id, antwortenRef.current, startzeit)
      setLetzterSave(new Date().toISOString())
      incrementAutoSaveCount()
    }, 15000)

    return () => clearInterval(interval)
  }, [config, abgegeben, startzeit, setLetzterSave, incrementAutoSaveCount])

  // === 2. Remote-Save (alle 30s, konfigurierbar) ===
  useEffect(() => {
    if (!config || abgegeben || !backendVerfuegbar || !user) return

    const intervallMs = (config.autoSaveIntervallSekunden || 30) * 1000

    const interval = setInterval(async () => {
      try {
        setVerbindungsstatus('syncing')
        const neueVersion = remoteSaveVersionRef.current + 1
        const requestId = crypto.randomUUID()

        const erfolg = await apiService.speichereAntworten({
          pruefungId: config.id,
          email: user.email,
          antworten: antwortenRef.current as Record<string, Antwort>,
          version: neueVersion,
          istAbgabe: false,
          gesamtFragen: fragen?.length || 0,
          requestId,
        })

        if (erfolg) {
          incrementRemoteSaveVersion()
          setVerbindungsstatus('online')
          setLetzterSave(new Date().toISOString())
          incrementAutoSaveCount()
        } else {
          setVerbindungsstatus('offline')
          incrementNetzwerkFehler()
          // In Retry-Queue einfügen
          enqueue({
            pruefungId: config.id,
            email: user.email,
            antworten: antwortenRef.current as Record<string, Antwort>,
            version: neueVersion,
            istAbgabe: false,
            requestId,
          })
        }
      } catch {
        // Netzwerkfehler: nie werfen, nur Status setzen
        setVerbindungsstatus('offline')
        incrementNetzwerkFehler()
      }
    }, intervallMs)

    return () => clearInterval(interval)
  }, [config, abgegeben, backendVerfuegbar, user, fragen, setVerbindungsstatus, incrementRemoteSaveVersion, setLetzterSave, incrementAutoSaveCount, incrementNetzwerkFehler])

  // === 3. Heartbeat (alle 10s, konfigurierbar) + Beenden-Signal ===
  useEffect(() => {
    if (!config || abgegeben || !backendVerfuegbar || !user) return

    const intervallMs = (config.heartbeatIntervallSekunden || 10) * 1000

    const interval = setInterval(async () => {
      try {
        const state = usePruefungStore.getState()
        const aktuelleFrageIndex = state.aktuelleFrageIndex
        const beantworteteFragen = Object.keys(state.antworten).length
        const lockdownMeta = lockdownCallbacksRef.current?.getLockdownMeta?.()
        const response = await apiService.heartbeat(config.id, user.email, aktuelleFrageIndex, beantworteteFragen, lockdownMeta)
        if (response.success) {
          incrementHeartbeats()
          setVerbindungsstatus('online')
          // Beenden-Signal vom Backend?
          if (response.beendetUm && !abgegeben) {
            setBeendetUm(response.beendetUm, response.restzeitMinuten)
          }
          // LP-Entsperrung via Heartbeat
          if (response.entsperrt) {
            lockdownCallbacksRef.current?.onEntsperrt?.()
          }
          // LP-Kontrollstufen-Override via Heartbeat
          if (response.kontrollStufeOverride) {
            lockdownCallbacksRef.current?.onKontrollStufeOverride?.(response.kontrollStufeOverride)
          }
        } else {
          addUnterbrechung({
            zeitpunkt: new Date().toISOString(),
            dauer_sekunden: 0,
            typ: 'heartbeat-ausfall',
          })
        }
      } catch {
        // Netzwerkfehler: nie werfen, nur Status setzen
        setVerbindungsstatus('offline')
        incrementNetzwerkFehler()
      }
    }, intervallMs)

    return () => clearInterval(interval)
  }, [config, abgegeben, backendVerfuegbar, user, incrementHeartbeats, addUnterbrechung, setBeendetUm])

  // === 4. Focus-Detection (visibilitychange) ===
  useEffect(() => {
    if (!config || abgegeben) return

    let verborgenSeit: number | null = null

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'hidden') {
        verborgenSeit = Date.now()
      } else if (document.visibilityState === 'visible' && verborgenSeit !== null) {
        const dauerSekunden = Math.round((Date.now() - verborgenSeit) / 1000)
        verborgenSeit = null

        // Nur relevante Unterbrechungen loggen (>2s, keine Mikro-Fokuswechsel)
        if (dauerSekunden >= 2) {
          addUnterbrechung({
            zeitpunkt: new Date().toISOString(),
            dauer_sekunden: dauerSekunden,
            typ: 'focus-verloren',
          })
          // Lockdown-Verstoss registrieren wenn aktiv
          lockdownCallbacksRef.current?.onTabWechsel?.(dauerSekunden)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [config, abgegeben, addUnterbrechung])

  // === 5. Online/Offline Browser-Events ===
  useEffect(() => {
    if (!config || abgegeben) return

    function handleOnline(): void {
      setVerbindungsstatus('online')
      // Retry-Queue verarbeiten wenn wieder online
      if (backendVerfuegbar) {
        processQueue()
      }
    }

    function handleOffline(): void {
      setVerbindungsstatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initialen Status setzen
    if (!navigator.onLine) {
      setVerbindungsstatus('offline')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [config, abgegeben, setVerbindungsstatus])
}
