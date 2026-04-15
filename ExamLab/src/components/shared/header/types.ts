// ExamLab/src/components/shared/header/types.ts
export type L1Id = 'favoriten' | 'pruefung' | 'uebung' | 'fragensammlung'
export type L3Mode = 'single' | 'multi' | 'none'

export interface L3Item {
  id: string
  label: string
  meta?: string
}

export interface L3Config {
  mode: L3Mode
  items: L3Item[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onAddNew?: () => void
  addNewLabel?: string
}

export interface L2Tab {
  id: string
  label: string
  onClick: () => void
  l3?: L3Config
}

export interface L1Tab {
  id: L1Id | string
  label: string
  onClick: () => void
  l2?: L2Tab[]
}

export interface TabKaskadeConfig {
  l1Tabs: L1Tab[]
  aktivL1: L1Id | string | null
  aktivL2?: string | null
}

export type Rolle = 'lp' | 'sus'
