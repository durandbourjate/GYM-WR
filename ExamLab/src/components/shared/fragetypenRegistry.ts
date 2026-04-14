import type { ComponentType } from 'react'
import type { Frage } from '../../types/fragen.ts'

// Alle Fragetyp-Komponenten (Prüfen + Üben via useFrageAdapter)
import MCFrage from '../fragetypen/MCFrage.tsx'
import FreitextFrage from '../fragetypen/FreitextFrage.tsx'
import LueckentextFrage from '../fragetypen/LueckentextFrage.tsx'
import ZuordnungFrage from '../fragetypen/ZuordnungFrage.tsx'
import RichtigFalschFrage from '../fragetypen/RichtigFalschFrage.tsx'
import BerechnungFrage from '../fragetypen/BerechnungFrage.tsx'
import BuchungssatzFrage from '../fragetypen/BuchungssatzFrage.tsx'
import TKontoFrageComponent from '../fragetypen/TKontoFrage.tsx'
import KontenbestimmungFrageComponent from '../fragetypen/KontenbestimmungFrage.tsx'
import BilanzERFrageComponent from '../fragetypen/BilanzERFrage.tsx'
import AufgabengruppeFrageComponent from '../fragetypen/AufgabengruppeFrage.tsx'
import ZeichnenFrage from '../fragetypen/ZeichnenFrage.tsx'
import PDFFrage from '../fragetypen/PDFFrage.tsx'
import SortierungFrageComponent from '../fragetypen/SortierungFrage.tsx'
import HotspotFrageComponent from '../fragetypen/HotspotFrage.tsx'
import BildbeschriftungFrageComponent from '../fragetypen/BildbeschriftungFrage.tsx'
import AudioFrageComponent from '../fragetypen/AudioFrage.tsx'
import DragDropBildFrageComponent from '../fragetypen/DragDropBildFrage.tsx'
import CodeFrageComponent from '../fragetypen/CodeFrageComponent.tsx'
import FormelFrageComponent from '../fragetypen/FormelFrageComponent.tsx'

/**
 * Einheitliche Registry aller Fragetyp-Komponenten.
 * Gilt für Prüfen- UND Üben-Modus (beide via useFrageAdapter).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FRAGETYP_KOMPONENTEN: Record<string, ComponentType<{ frage: Frage | any }>> = {
  mc: MCFrage,
  freitext: FreitextFrage,
  lueckentext: LueckentextFrage,
  zuordnung: ZuordnungFrage,
  richtigfalsch: RichtigFalschFrage,
  berechnung: BerechnungFrage,
  buchungssatz: BuchungssatzFrage,
  tkonto: TKontoFrageComponent,
  kontenbestimmung: KontenbestimmungFrageComponent,
  bilanzstruktur: BilanzERFrageComponent,
  sortierung: SortierungFrageComponent,
  hotspot: HotspotFrageComponent,
  bildbeschriftung: BildbeschriftungFrageComponent,
  dragdrop_bild: DragDropBildFrageComponent,
  code: CodeFrageComponent,
  formel: FormelFrageComponent,
  visualisierung: ZeichnenFrage,
  audio: AudioFrageComponent,
  pdf: PDFFrage,
  aufgabengruppe: AufgabengruppeFrageComponent,
}
