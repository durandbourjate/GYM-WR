import type { LucideIcon } from 'lucide-react'
import { File, FileText, HelpCircle, BookOpen, Repeat, Settings, GraduationCap } from 'lucide-react'
import type { TabDefinition } from '../utils/tabRegistry'
import type { KursDefinition } from './stammdaten'
import type { PruefungsConfig } from './pruefung'
import type { FrageSummary } from './fragen-storage'

export type SucheQuelle =
  | 'einstellungen-tab'
  | 'hilfe-tab'
  | 'kurs'
  | 'pruefung'
  | 'uebung'
  | 'frage'

export interface HighlightStelle {
  start: number
  end: number
  feld: 'titel' | 'subTitel'
}

export type SucheIconKey = 'einstellungen' | 'hilfe' | 'kurs' | 'pruefung' | 'uebung' | 'frage' | 'default'

export interface SucheTreffer {
  quelle: SucheQuelle
  id: string
  titel: string
  subTitel?: string
  highlightStellen?: HighlightStelle[]
  navigation: {
    route: string
    params?: Record<string, string>
  }
  score: number
  iconKey?: SucheIconKey
}

export type ProQuelleZahlen = Record<SucheQuelle, number>

export interface SucheErgebnis {
  treffer: SucheTreffer[]
  proQuelleSichtbar: ProQuelleZahlen
  proQuelleGesamt: ProQuelleZahlen
}

export interface SucheIndex {
  einstellungenTabs: TabDefinition[]
  hilfeTabs: TabDefinition[]
  kurse: KursDefinition[]
  pruefungen: PruefungsConfig[]
  uebungen: PruefungsConfig[]
  fragen: FrageSummary[]
}

export const QUELLEN_REIHENFOLGE: readonly SucheQuelle[] = [
  'einstellungen-tab',
  'hilfe-tab',
  'kurs',
  'pruefung',
  'uebung',
  'frage',
] as const

export const QUELL_LABEL: Record<SucheQuelle, string> = {
  'einstellungen-tab': 'Einstellungen',
  'hilfe-tab': 'Hilfe',
  kurs: 'Kurse',
  pruefung: 'Prüfungen',
  uebung: 'Übungen',
  frage: 'Fragen',
}

export const SCORE_BOUNDS = {
  TITEL_PREFIX: 100,
  ID_EXACT: 95,
  TITEL_SUBSTRING: 70,
  TAG_THEMA: 50,
  SUBTITEL: 30,
} as const

export const ICON_MAP: Record<SucheIconKey, LucideIcon> = {
  einstellungen: Settings,
  hilfe: BookOpen,
  kurs: GraduationCap,
  pruefung: FileText,
  uebung: Repeat,
  frage: HelpCircle,
  default: File,
}

function leereZahlen(): ProQuelleZahlen {
  return QUELLEN_REIHENFOLGE.reduce(
    (acc, q) => ({ ...acc, [q]: 0 }),
    {} as ProQuelleZahlen,
  )
}

export const LEERES_ERGEBNIS: SucheErgebnis = {
  treffer: [],
  proQuelleSichtbar: leereZahlen(),
  proQuelleGesamt: leereZahlen(),
}
