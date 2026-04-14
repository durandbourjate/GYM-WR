export type KontrollStufe = 'keine' | 'locker' | 'standard' | 'streng'
export type GeraetTyp = 'laptop' | 'tablet' | 'unbekannt'

export interface Verstoss {
  zeitpunkt: string
  typ: 'tab-wechsel' | 'copy-versuch' | 'vollbild-verlassen' | 'split-view'
  dauer_sekunden?: number
}

export interface LockdownState {
  kontrollStufe: KontrollStufe
  effektiveKontrollStufe: KontrollStufe
  geraet: GeraetTyp
  vollbildAktiv: boolean
  vollbildUnterstuetzt: boolean
  verstossZaehler: number
  maxVerstoesse: number
  gesperrt: boolean
  verstoesse: Verstoss[]
}
