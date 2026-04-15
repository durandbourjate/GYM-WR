import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TabKaskadeConfig, L1Tab, L2Tab } from './types'

interface Input {
  kurse: { id: string; label: string }[]
  pruefungen: { id: string; titel: string }[]
  aktivePruefungen: string[]
  onWaehleAktivePruefungen?: (ids: string[]) => void
  onWaehleKurs?: (id: string) => void
}

export function baueLPConfigAusRoute(
  pathname: string,
  navigate: (to: string) => void,
  input: Input,
): TabKaskadeConfig {
  const { kurse, pruefungen, aktivePruefungen, onWaehleAktivePruefungen, onWaehleKurs } = input

  let aktivL1: TabKaskadeConfig['aktivL1'] = null
  let aktivL2: TabKaskadeConfig['aktivL2'] = null
  let aktivL3: string | null = null

  if (pathname.startsWith('/favoriten')) aktivL1 = 'favoriten'
  else if (pathname.startsWith('/pruefung')) {
    aktivL1 = 'pruefung'
    aktivL2 = pathname.includes('/analyse') ? 'analyse' : 'durchfuehren'
  } else if (pathname.startsWith('/uebung')) {
    aktivL1 = 'uebung'
    if (pathname.includes('/durchfuehren')) aktivL2 = 'durchfuehren'
    else if (pathname.includes('/analyse')) aktivL2 = 'analyse'
    else aktivL2 = 'uebungen'
    const kursMatch = pathname.match(/\/kurs\/([^/?]+)/)
    if (kursMatch) aktivL3 = kursMatch[1]
  } else if (pathname.startsWith('/fragensammlung')) aktivL1 = 'fragensammlung'

  const uebungenL2: L2Tab = {
    id: 'uebungen',
    label: 'Übungen',
    onClick: () => navigate('/uebung'),
    l3: aktivL3
      ? {
          mode: 'single',
          items: kurse.map((k) => ({ id: k.id, label: k.label })),
          selectedIds: [aktivL3],
          onSelect: (ids) => {
            if (ids[0]) {
              onWaehleKurs?.(ids[0])
              navigate(`/uebung/kurs/${ids[0]}`)
            }
          },
        }
      : undefined,
  }

  const durchfPruefenL2: L2Tab = {
    id: 'durchfuehren',
    label: 'Durchführen',
    onClick: () => navigate('/pruefung/durchfuehren'),
    l3:
      aktivePruefungen.length > 0
        ? {
            mode: 'multi',
            items: pruefungen.map((p) => ({ id: p.id, label: p.titel })),
            selectedIds: aktivePruefungen,
            onSelect: (ids) => onWaehleAktivePruefungen?.(ids),
          }
        : undefined,
  }

  const l1Tabs: L1Tab[] = [
    { id: 'favoriten', label: 'Favoriten', onClick: () => navigate('/favoriten') },
    {
      id: 'pruefung',
      label: 'Prüfen',
      onClick: () => navigate('/pruefung'),
      l2: [durchfPruefenL2, { id: 'analyse', label: 'Analyse', onClick: () => navigate('/pruefung/analyse') }],
    },
    {
      id: 'uebung',
      label: 'Üben',
      onClick: () => navigate('/uebung'),
      l2: [
        { id: 'durchfuehren', label: 'Durchführen', onClick: () => navigate('/uebung/durchfuehren') },
        uebungenL2,
        { id: 'analyse', label: 'Analyse', onClick: () => navigate('/uebung/analyse') },
      ],
    },
    { id: 'fragensammlung', label: 'Fragensammlung', onClick: () => navigate('/fragensammlung') },
  ]

  return { l1Tabs, aktivL1, aktivL2 }
}

export function useTabKaskadeConfigLP(input: Input): TabKaskadeConfig {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return useMemo(() => baueLPConfigAusRoute(pathname, navigate, input), [pathname, navigate, input])
}
