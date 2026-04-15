import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { TabKaskadeConfig, L1Tab } from './types'

interface Input {
  kurse: { id: string; label: string }[]
  onWaehleKurs?: (id: string) => void
}

export function baueSuSConfigAusRoute(pathname: string, navigate: (to: string) => void, input: Input): TabKaskadeConfig {
  const { kurse, onWaehleKurs } = input

  let aktivL1: TabKaskadeConfig['aktivL1'] = null
  let aktivL2: TabKaskadeConfig['aktivL2'] = null
  let aktivL3: string | null = null

  if (pathname.startsWith('/sus/pruefen')) {
    aktivL1 = 'pruefung'
    aktivL2 = pathname.includes('/ergebnisse') ? 'ergebnisse' : 'offen'
  } else if (pathname.startsWith('/sus/ueben')) {
    aktivL1 = 'uebung'
    if (pathname.includes('/fortschritt')) aktivL2 = 'fortschritt'
    else if (pathname.includes('/ergebnisse')) aktivL2 = 'ergebnisse'
    else aktivL2 = 'themen'
    const kursMatch = pathname.match(/\/kurs\/([^/?]+)/)
    if (kursMatch) aktivL3 = kursMatch[1]
  }

  const l1Tabs: L1Tab[] = [
    {
      id: 'pruefung',
      label: 'Prüfen',
      onClick: () => navigate('/sus/pruefen'),
      l2: [
        { id: 'offen', label: 'Offen', onClick: () => navigate('/sus/pruefen') },
        { id: 'ergebnisse', label: 'Ergebnisse', onClick: () => navigate('/sus/pruefen/ergebnisse') },
      ],
    },
    {
      id: 'uebung',
      label: 'Üben',
      onClick: () => navigate('/sus/ueben'),
      l2: [
        {
          id: 'themen',
          label: 'Themen',
          onClick: () => navigate('/sus/ueben'),
          l3: aktivL3
            ? {
                mode: 'single',
                items: kurse.map((k) => ({ id: k.id, label: k.label })),
                selectedIds: [aktivL3],
                onSelect: (ids) => {
                  if (ids[0]) {
                    onWaehleKurs?.(ids[0])
                    navigate(`/sus/ueben/kurs/${ids[0]}`)
                  }
                },
              }
            : undefined,
        },
        { id: 'fortschritt', label: 'Fortschritt', onClick: () => navigate('/sus/ueben/fortschritt') },
        { id: 'ergebnisse', label: 'Ergebnisse', onClick: () => navigate('/sus/ueben/ergebnisse') },
      ],
    },
  ]

  return { l1Tabs, aktivL1, aktivL2 }
}

export function useTabKaskadeConfigSuS(input: Input): TabKaskadeConfig {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return useMemo(() => baueSuSConfigAusRoute(pathname, navigate, input), [pathname, navigate, input])
}
