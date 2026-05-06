export interface KorrekturErgebnis {
  erreichtePunkte: number
  maxPunkte: number
  details: KorrekturDetail[]
}

export interface KorrekturDetail {
  bezeichnung: string
  korrekt: boolean
  erreicht: number
  max: number
  kommentar?: string
}
