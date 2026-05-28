import {
  ListChecks, ToggleLeft, Calculator, Sigma, FileText, AudioLines,
  ArrowUpDown, Code, Image as ImageIcon, Move, MousePointerClick, ArrowRightLeft,
  Package, Columns2, Brush, FileSearch,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Frage } from '@shared/types/fragen-core'
import { IconAbc, IconAB, IconAn, IconTKonto } from './CustomIcons'

/** Discriminator-Type aus Discriminated Union (Single source of truth). */
export type Fragetyp = Frage['typ']

/** Mapping aller Fragetyp-Discriminator-Strings auf Icon-Komponenten.
 *  TS-Compiler erzwingt Vollständigkeit: neue Fragetypen MÜSSEN hier ergänzt werden.
 *
 *  Hinweis: Lucide-react v1.x fügt SVG-Klassen "lucide lucide-<name>" automatisch hinzu;
 *  übergebene className wird angehängt. Custom-Icons (IconAbc etc.) machen das nicht.
 *
 *  Liegt in einer separaten Datei, weil React-Fast-Refresh nur funktioniert wenn
 *  Component-Files ausschliesslich Components exportieren (`only-export-components`-Rule).
 */
export const FRAGETYP_ICON_MAP: Record<Fragetyp, ComponentType<LucideProps>> = {
  mc:              ListChecks,
  richtigfalsch:   ToggleLeft,
  berechnung:      Calculator,
  formel:          Sigma,
  pdf:             FileText,
  audio:           AudioLines,
  sortierung:      ArrowUpDown,
  code:            Code,
  bildbeschriftung: ImageIcon,
  dragdrop_bild:   Move,
  hotspot:         MousePointerClick,
  zuordnung:       ArrowRightLeft,
  aufgabengruppe:  Package,
  bilanzstruktur:  Columns2,
  visualisierung:  Brush,
  kontenbestimmung: FileSearch,
  freitext:        IconAbc,
  lueckentext:     IconAB,
  buchungssatz:    IconAn,
  tkonto:          IconTKonto,
}
