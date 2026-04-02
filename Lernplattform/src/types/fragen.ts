export type FrageTyp =
  | 'mc' | 'multi' | 'tf' | 'fill' | 'calc'
  | 'sort' | 'sortierung' | 'zuordnung'

export interface Frage {
  id: string
  fach: string
  thema: string
  stufe?: string
  lernziel?: string
  typ: FrageTyp
  schwierigkeit: 1 | 2 | 3
  taxonomie?: string
  frage: string
  erklaerung?: string
  tags?: string[]
  uebung: boolean
  pruefungstauglich: boolean
  // Typ-spezifische Felder
  optionen?: string[]
  korrekt?: string | string[]
  aussagen?: { text: string; korrekt: boolean }[]
  luecken?: { id: string; korrekt: string; optionen?: string[] }[]
  toleranz?: number
  einheit?: string
  kategorien?: string[]
  elemente?: { text: string; kategorie: string }[]
  reihenfolge?: string[]
  paare?: { links: string; rechts: string }[]
}

export interface FragenFilter {
  fach?: string
  thema?: string
  stufe?: string
  tags?: string[]
  schwierigkeit?: number
  nurUebung?: boolean
}

export type AntwortTyp =
  | MCAntwort | MultiAntwort | TFAntwort | FillAntwort
  | CalcAntwort | SortAntwort | SortierungAntwort | ZuordnungAntwort

export interface MCAntwort {
  typ: 'mc'
  gewaehlt: string
}

export interface MultiAntwort {
  typ: 'multi'
  gewaehlt: string[]
}

export interface TFAntwort {
  typ: 'tf'
  bewertungen: Record<string, boolean>
}

export interface FillAntwort {
  typ: 'fill'
  eintraege: Record<string, string>
}

export interface CalcAntwort {
  typ: 'calc'
  wert: string
}

export interface SortAntwort {
  typ: 'sort'
  zuordnungen: Record<string, string>
}

export interface SortierungAntwort {
  typ: 'sortierung'
  reihenfolge: string[]
}

export interface ZuordnungAntwort {
  typ: 'zuordnung'
  paare: Record<string, string>
}
