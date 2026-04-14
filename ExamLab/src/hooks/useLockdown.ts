import { useState, useEffect, useCallback, useRef } from 'react'
import type { KontrollStufe, Verstoss, LockdownState, GeraetTyp } from '../types/lockdown'
import { useGeraetErkennung } from './useGeraetErkennung'

function berechneEffektiveStufe(stufe: KontrollStufe, geraet: GeraetTyp): KontrollStufe {
  if (stufe === 'keine') return 'keine'
  if (geraet === 'tablet' && stufe === 'streng') return 'standard'
  return stufe
}

interface UseLockdownOptions {
  kontrollStufe: KontrollStufe
  maxVerstoesse?: number
  aktiv: boolean
  istDemoModus?: boolean
}

export function useLockdown({ kontrollStufe, maxVerstoesse = 3, aktiv, istDemoModus = false }: UseLockdownOptions) {
  const { geraet, vollbildUnterstuetzt } = useGeraetErkennung()
  const effektiv = berechneEffektiveStufe(kontrollStufe, geraet)

  const [verstossZaehler, setVerstossZaehler] = useState(0)
  const [gesperrt, setGesperrt] = useState(false)
  const [verstoesse, setVerstoesse] = useState<Verstoss[]>([])
  const [vollbildAktiv, setVollbildAktiv] = useState(false)
  const letzterSyncIndex = useRef(0)
  const schonfristBisRef = useRef(0) // Schonfrist nach Entsperrung

  // Verstoss registrieren
  const registriereVerstoss = useCallback((typ: Verstoss['typ'], dauer?: number) => {
    if (!aktiv || gesperrt) return
    if (effektiv === 'keine') return // keine: komplett deaktiviert
    if (Date.now() < schonfristBisRef.current) return // Schonfrist nach LP-Entsperrung

    const verstoss: Verstoss = {
      zeitpunkt: new Date().toISOString(),
      typ,
      ...(dauer !== undefined ? { dauer_sekunden: dauer } : {}),
    }
    setVerstoesse(prev => [...prev, verstoss])

    // B55: Relevante Verstösse zählen (Tab-Wechsel, Vollbild-Verlust, Split-View)
    const zaehlt = typ === 'tab-wechsel' || typ === 'vollbild-verlassen' || typ === 'split-view'
    if (zaehlt) {
      setVerstossZaehler(prev => {
        const neu = prev + 1
        // Locker oder Demo-Modus: Zähler hochzählen (für Logging), aber KEINE Sperre
        if (!istDemoModus && effektiv !== 'locker' && neu >= maxVerstoesse) setGesperrt(true)
        return neu
      })
    }
  }, [aktiv, gesperrt, effektiv, maxVerstoesse])

  // LP-Entsperrung (mit 5s Schonfrist + Vollbild-Wiederherstellung)
  const entsperre = useCallback(() => {
    setGesperrt(false)
    setVerstossZaehler(0)
    // 5s Schonfrist: Keine Verstösse nach Entsperrung registrieren,
    // damit SuS Zeit hat ins Vollbild zurückzukehren
    schonfristBisRef.current = Date.now() + 5000
    // Vollbild automatisch wiederherstellen (wenn nötig)
    if (vollbildUnterstuetzt && (effektiv === 'standard' || effektiv === 'streng')) {
      const el = document.documentElement
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {})
      } else {
        const webkitEl = el as unknown as { webkitRequestFullscreen?: () => Promise<void> }
        if (webkitEl.webkitRequestFullscreen) webkitEl.webkitRequestFullscreen().catch(() => {})
      }
    }
  }, [vollbildUnterstuetzt, effektiv])

  // Globales Event für temporäre Schonfrist (z.B. Audio-Aufnahme braucht getUserMedia,
  // welches den Vollbild-Modus unterbricht → kein Verstoss registrieren)
  useEffect(() => {
    function handleSchonfrist(e: Event) {
      const ms = (e as CustomEvent).detail?.ms ?? 5000
      schonfristBisRef.current = Date.now() + ms
    }
    window.addEventListener('lockdown-schonfrist', handleSchonfrist)
    return () => window.removeEventListener('lockdown-schonfrist', handleSchonfrist)
  }, [])

  // Verstoesse seit letztem Sync (für Heartbeat)
  const neueVerstoesseSeitLetztemSync = useCallback(() => {
    const neue = verstoesse.slice(letzterSyncIndex.current)
    letzterSyncIndex.current = verstoesse.length
    return neue
  }, [verstoesse])

  // Vollbild starten
  const starteVollbild = useCallback(async (): Promise<boolean> => {
    if (!vollbildUnterstuetzt) return false
    try {
      const el = document.documentElement
      if (el.requestFullscreen) {
        await el.requestFullscreen()
      } else {
        const webkitEl = el as unknown as { webkitRequestFullscreen?: () => Promise<void> }
        if (webkitEl.webkitRequestFullscreen) await webkitEl.webkitRequestFullscreen()
      }
      return true
    } catch {
      return false
    }
  }, [vollbildUnterstuetzt])

  // === Copy/Paste blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker') return

    function blockiere(e: Event) {
      e.preventDefault()
      registriereVerstoss('copy-versuch')
    }

    document.addEventListener('copy', blockiere)
    document.addEventListener('paste', blockiere)
    document.addEventListener('cut', blockiere)
    return () => {
      document.removeEventListener('copy', blockiere)
      document.removeEventListener('paste', blockiere)
      document.removeEventListener('cut', blockiere)
    }
  }, [aktiv, effektiv, registriereVerstoss])

  // === Rechtsklick blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker') return

    function blockiere(e: Event) { e.preventDefault() }
    document.addEventListener('contextmenu', blockiere)
    return () => document.removeEventListener('contextmenu', blockiere)
  }, [aktiv, effektiv])

  // === DevTools-Shortcuts blockieren (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker') return

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'F12') { e.preventDefault(); return }
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault(); return
      }
      if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault(); return
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [aktiv, effektiv])

  // === Vollbild-Überwachung (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker' || !vollbildUnterstuetzt) return

    function handleFullscreenChange() {
      const istVollbild = !!document.fullscreenElement
      setVollbildAktiv(istVollbild)
      if (!istVollbild) {
        registriereVerstoss('vollbild-verlassen')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [aktiv, effektiv, vollbildUnterstuetzt, registriereVerstoss])

  // === Split-View-Erkennung (iPad, Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker' || geraet !== 'tablet') return

    const originalBreite = window.innerWidth

    function handleResize() {
      if (window.innerWidth < originalBreite * 0.9) {
        registriereVerstoss('split-view')
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [aktiv, effektiv, geraet, registriereVerstoss])

  // === iPad CSS-Massnahmen (Standard + Streng) ===
  useEffect(() => {
    if (!aktiv || effektiv === 'keine' || effektiv === 'locker') return

    const body = document.body
    body.style.setProperty('-webkit-touch-callout', 'none')
    body.style.setProperty('user-select', 'none')
    body.style.setProperty('-webkit-user-select', 'none')

    return () => {
      body.style.removeProperty('-webkit-touch-callout')
      body.style.removeProperty('user-select')
      body.style.removeProperty('-webkit-user-select')
    }
  }, [aktiv, effektiv])

  const state: LockdownState = {
    kontrollStufe,
    effektiveKontrollStufe: effektiv,
    geraet,
    vollbildAktiv,
    vollbildUnterstuetzt,
    verstossZaehler,
    maxVerstoesse,
    gesperrt,
    verstoesse,
  }

  return {
    ...state,
    registriereVerstoss,
    entsperre,
    starteVollbild,
    neueVerstoesseSeitLetztemSync,
  }
}
