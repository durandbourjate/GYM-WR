export interface Auftrag {
  id: string
  gruppeId: string
  erstelltVon: string
  zielEmail: string[]
  titel: string
  filter: {
    fach?: string
    thema?: string
    tags?: string[]
    maxFragen?: number
  }
  frist?: string
  status: 'aktiv' | 'abgeschlossen' | 'archiviert'
  erstelltAm: string
}

export interface Empfehlung {
  typ: 'auftrag' | 'luecke' | 'festigung'
  titel: string
  beschreibung: string
  fach: string
  thema: string
  auftragId?: string
}
