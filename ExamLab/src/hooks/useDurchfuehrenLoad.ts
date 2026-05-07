import { useEffect, useState, useRef } from 'react'
import { apiService } from '../services/apiService'
import { preWarmKorrektur } from '../services/preWarmApi'
import { demoFragen } from '../data/demoFragen'
import { einrichtungsPruefung } from '../data/einrichtungsPruefung'
import { einrichtungsUebung } from '../data/einrichtungsUebung'
import { einrichtungsUebungFragen } from '../data/einrichtungsUebungFragen'
import type { PruefungsConfig } from '../types/pruefung'
import type { PruefungsPhase } from '../types/monitoring'
import type { Frage } from '../types/fragen-storage'
import type { SchuelerAbgabe } from '../types/korrektur'

const eingebauteVersionen: Record<string, { config: PruefungsConfig; fragen: Frage[] }> = {
  'einrichtung-uebung': { config: einrichtungsUebung, fragen: einrichtungsUebungFragen },
  [einrichtungsPruefung.id]: { config: einrichtungsPruefung, fragen: demoFragen },
}

export interface UseDurchfuehrenLoadResult {
  abgaben: Record<string, SchuelerAbgabe>
  setAbgaben: React.Dispatch<React.SetStateAction<Record<string, SchuelerAbgabe>>>
  fragen: Frage[]
  setFragen: React.Dispatch<React.SetStateAction<Frage[]>>
  config: PruefungsConfig | null
  setConfig: React.Dispatch<React.SetStateAction<PruefungsConfig | null>>
  abgabenGeladenRef: React.MutableRefObject<boolean>
}

/**
 * Lädt Abgaben + Fragen + Config einmalig (Once-Flag) und aktualisiert Config periodisch
 * in Vorbereitung/Lobby. Demo-Modus initialisiert mit einrichtungsPruefung.
 * Bei eingebauten Versionen (einrichtungsUebung etc.) wird die eingebaute Config + Fragen verwendet.
 *
 * Vorher: inline in DurchfuehrenDashboard (Once-Load + Demo-Setup + Periodic-Config-Refresh).
 */
export function useDurchfuehrenLoad(opts: {
  user: { email: string } | null
  pruefungId: string | null
  istDemoModus: boolean
  phase: PruefungsPhase
  urlTab: string | null
  setActiveTab: (tab: 'vorbereitung' | 'lobby' | 'live' | 'auswertung') => void
}): UseDurchfuehrenLoadResult {
  const { user, pruefungId, istDemoModus, phase, urlTab, setActiveTab } = opts

  const [abgaben, setAbgaben] = useState<Record<string, SchuelerAbgabe>>({})
  const [fragen, setFragen] = useState<Frage[]>([])
  const [config, setConfig] = useState<PruefungsConfig | null>(null)
  const abgabenGeladenRef = useRef(false)

  // E5: Once-Load Abgaben + Fragen + Config
  useEffect(() => {
    if (abgabenGeladenRef.current || !user) return
    async function ladeAbgabenUndFragen() {
      if (istDemoModus || !apiService.istKonfiguriert() || !pruefungId || pruefungId === 'demo') {
        setFragen(demoFragen)
        abgabenGeladenRef.current = true
        return
      }
      const [abgabenResult, pruefungResult] = await Promise.all([
        apiService.ladeAbgaben(pruefungId, user!.email),
        apiService.ladePruefung(pruefungId, user!.email),
      ])
      if (abgabenResult) setAbgaben(abgabenResult)

      if (pruefungResult && eingebauteVersionen[pruefungId]) {
        const eingebaut = eingebauteVersionen[pruefungId]
        pruefungResult.config = {
          ...eingebaut.config,
          freigeschaltet: pruefungResult.config.freigeschaltet,
          durchfuehrungId: pruefungResult.config.durchfuehrungId,
          beendetUm: pruefungResult.config.beendetUm,
          teilnehmer: pruefungResult.config.teilnehmer,
        }
        pruefungResult.fragen = eingebaut.fragen
      }

      if (pruefungResult?.fragen) setFragen(pruefungResult.fragen)
      if (pruefungResult?.config) {
        setConfig(pruefungResult.config)
        if (pruefungResult.config.beendetUm && pruefungResult.config.freigeschaltet && !urlTab) {
          setActiveTab('auswertung')
          if (user?.email && pruefungId) {
            void preWarmKorrektur(pruefungId, user.email)
          }
        }
      }
      abgabenGeladenRef.current = true
    }
    ladeAbgabenUndFragen()
  }, [user, istDemoModus, pruefungId, urlTab, setActiveTab])

  // E6: Demo-Modus Config-Setup
  useEffect(() => {
    if (!user || !pruefungId) return
    if (istDemoModus || pruefungId === 'demo') {
      setConfig({ ...einrichtungsPruefung, freigeschaltet: true })
    }
  }, [user, pruefungId, istDemoModus])

  // E7: Periodic Config in Vorbereitung/Lobby
  useEffect(() => {
    if (!user || !pruefungId || istDemoModus || pruefungId === 'demo') return
    if (phase !== 'vorbereitung' && phase !== 'lobby') return
    const ladeConfig = async () => {
      try {
        const found = await apiService.ladeEinzelConfig(pruefungId, user.email)
        if (found) setConfig(found)
      } catch { /* ignore */ }
    }
    const intervallMs = phase === 'lobby' ? 5000 : 30000
    const interval = setInterval(ladeConfig, intervallMs)
    return () => clearInterval(interval)
  }, [user, pruefungId, istDemoModus, phase])

  return { abgaben, setAbgaben, fragen, setFragen, config, setConfig, abgabenGeladenRef }
}
