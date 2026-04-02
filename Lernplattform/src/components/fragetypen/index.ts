import type { ComponentType } from 'react'
import type { Frage, AntwortTyp } from '../../types/fragen'
import MCFrage from './MCFrage'
import MultiFrage from './MultiFrage'
import TFFrage from './TFFrage'
import FillFrage from './FillFrage'
import CalcFrage from './CalcFrage'
import SortFrage from './SortFrage'
import SortierungFrage from './SortierungFrage'
import ZuordnungFrage from './ZuordnungFrage'

export interface FrageKomponenteProps {
  frage: Frage
  onAntwort: (antwort: AntwortTyp) => void
  disabled: boolean
  feedbackSichtbar: boolean
  korrekt: boolean | null
}

export const FRAGETYP_KOMPONENTEN: Record<string, ComponentType<FrageKomponenteProps>> = {
  mc: MCFrage,
  multi: MultiFrage,
  tf: TFFrage,
  fill: FillFrage,
  calc: CalcFrage,
  sort: SortFrage,
  sortierung: SortierungFrage,
  zuordnung: ZuordnungFrage,
}
