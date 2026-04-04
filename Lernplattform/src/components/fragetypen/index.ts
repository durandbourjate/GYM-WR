import type { ComponentType } from 'react'
import type { Frage } from '../../types/fragen'
import type { AntwortTyp } from '../../types/antworten'
import MCFrage from './MCFrage'
import MultiFrage from './MultiFrage'
import TFFrage from './TFFrage'
import FillFrage from './FillFrage'
import CalcFrage from './CalcFrage'
import SortFrage from './SortFrage'
import SortierungFrage from './SortierungFrage'
import ZuordnungFrage from './ZuordnungFrage'
import OpenFrage from './OpenFrage'
import FormelFrage from './FormelFrage'
import PdfFrage from './PdfFrage'
import BuchungssatzFrage from './BuchungssatzFrage'
import TKontoFrage from './TKontoFrage'
import BilanzFrage from './BilanzFrage'
import KontenbestimmungFrage from './KontenbestimmungFrage'
import HotspotFrage from './HotspotFrage'
import BildbeschriftungFrage from './BildbeschriftungFrage'
import DragDropBildFrage from './DragDropBildFrage'
import GruppeFrage from './GruppeFrage'
import ZeichnenFrage from './ZeichnenFrage'
import AudioFrage from './AudioFrage'
import CodeFrage from './CodeFrage'

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
  open: OpenFrage,
  formel: FormelFrage,
  pdf: PdfFrage,
  buchungssatz: BuchungssatzFrage,
  tkonto: TKontoFrage,
  bilanz: BilanzFrage,
  kontenbestimmung: KontenbestimmungFrage,
  hotspot: HotspotFrage,
  bildbeschriftung: BildbeschriftungFrage,
  dragdrop_bild: DragDropBildFrage,
  gruppe: GruppeFrage,
  zeichnen: ZeichnenFrage,
  audio: AudioFrage,
  code: CodeFrage,
  // Shared Typ-Namen (kanonisch) → gleiche Komponenten
  richtigfalsch: TFFrage,
  lueckentext: FillFrage,
  berechnung: CalcFrage,
  freitext: OpenFrage,
  visualisierung: ZeichnenFrage,
  bilanzstruktur: BilanzFrage,
  aufgabengruppe: GruppeFrage,
}
