import { useEffect, useRef, useState } from 'react'
import { preWarmKorrektur } from '../services/preWarmApi'
import type { PruefungsPhase } from '../types/monitoring'

export type DurchfuehrenTab = 'vorbereitung' | 'lobby' | 'live' | 'auswertung'

const TAB_REIHENFOLGE: DurchfuehrenTab[] = ['vorbereitung', 'lobby', 'live', 'auswertung']

export function phaseZuTab(phase: PruefungsPhase): DurchfuehrenTab {
  switch (phase) {
    case 'vorbereitung': return 'vorbereitung'
    case 'lobby': return 'lobby'
    case 'aktiv': return 'live'
    case 'beendet': return 'auswertung'
  }
}

export function tabIndex(tab: DurchfuehrenTab): number {
  return TAB_REIHENFOLGE.indexOf(tab)
}

export function istTabVerfuegbar(tab: DurchfuehrenTab, phase: PruefungsPhase): boolean {
  const aktuellerTabIndex = tabIndex(phaseZuTab(phase))
  const zielIndex = tabIndex(tab)
  if (tab === 'auswertung') return true
  return zielIndex <= aktuellerTabIndex
}

export function normalisiereUrlTab(raw: string | null): DurchfuehrenTab | null {
  if (!raw) return null
  if (raw === 'ergebnisse' || raw === 'korrektur') return 'auswertung'
  if (TAB_REIHENFOLGE.includes(raw as DurchfuehrenTab)) return raw as DurchfuehrenTab
  return null
}

export interface UseDurchfuehrenPhasenTabResult {
  activeTab: DurchfuehrenTab
  setActiveTab: React.Dispatch<React.SetStateAction<DurchfuehrenTab>>
  wechsleTab: (tab: DurchfuehrenTab) => void
}

/**
 * Verwaltet activeTab + Phase→Tab Auto-Forward + URL-Sync + preWarmKorrektur-Trigger.
 *
 * Vorher: inline in DurchfuehrenDashboard + Top-Level-Functions
 * (phaseZuTab/tabIndex/istTabVerfuegbar/normalisiereUrlTab). Top-Level-Functions wurden
 * hier ko-lokalisiert exportiert.
 */
export function useDurchfuehrenPhasenTab(opts: {
  phase: PruefungsPhase
  urlTab: DurchfuehrenTab | null
  user: { email: string } | null
  pruefungId: string | null
}): UseDurchfuehrenPhasenTabResult {
  const { phase, urlTab, user, pruefungId } = opts

  const [activeTab, setActiveTab] = useState<DurchfuehrenTab>(urlTab ?? 'vorbereitung')
  const letztePhaseRef = useRef<PruefungsPhase>('vorbereitung')

  // E8: Phase-Wechsel → Tab Auto-Forward + preWarmKorrektur bei beendet
  useEffect(() => {
    const neuerTab = phaseZuTab(phase)
    if (tabIndex(neuerTab) > tabIndex(phaseZuTab(letztePhaseRef.current))) {
      setActiveTab(neuerTab)
      if (phase === 'beendet' && user?.email && pruefungId) {
        void preWarmKorrektur(pruefungId, user.email)
      }
    }
    letztePhaseRef.current = phase
  }, [phase, user, pruefungId])

  // wechsleTab: Tab + URL aktualisieren + preWarmKorrektur bei auswertung
  const wechsleTab = (tab: DurchfuehrenTab) => {
    if (!istTabVerfuegbar(tab, phase)) return
    setActiveTab(tab)
    if (tab === 'auswertung' && user?.email && pruefungId) {
      void preWarmKorrektur(pruefungId, user.email)
    }
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }

  return { activeTab, setActiveTab, wechsleTab }
}
