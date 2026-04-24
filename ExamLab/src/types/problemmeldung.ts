export type Recht = 'inhaber' | 'bearbeiter' | 'betrachter'

export interface Problemmeldung {
  id: string
  zeitstempel: string
  typ: 'problem' | 'wunsch'
  category: string
  comment: string
  rolle: 'lp' | 'sus' | ''
  frageId: string
  frageText: string
  frageTyp: string
  modus: 'pruefen' | 'ueben' | 'fragensammlung' | ''
  pruefungId: string
  gruppeId: string
  ort: string
  appVersion: string
  inhaberEmail: string
  inhaberAktiv: boolean
  istPoolFrage: boolean
  recht: Recht
  erledigt: boolean
}
