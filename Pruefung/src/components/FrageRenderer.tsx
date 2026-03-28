import MCFrage from './fragetypen/MCFrage.tsx'
import FreitextFrage from './fragetypen/FreitextFrage.tsx'
import LueckentextFrage from './fragetypen/LueckentextFrage.tsx'
import ZuordnungFrage from './fragetypen/ZuordnungFrage.tsx'
import RichtigFalschFrage from './fragetypen/RichtigFalschFrage.tsx'
import BerechnungFrage from './fragetypen/BerechnungFrage.tsx'
import BuchungssatzFrage from './fragetypen/BuchungssatzFrage.tsx'
import TKontoFrageComponent from './fragetypen/TKontoFrage.tsx'
import KontenbestimmungFrageComponent from './fragetypen/KontenbestimmungFrage.tsx'
import BilanzERFrageComponent from './fragetypen/BilanzERFrage.tsx'
import AufgabengruppeFrageComponent from './fragetypen/AufgabengruppeFrage.tsx'
import ZeichnenFrage from './fragetypen/ZeichnenFrage.tsx'
import PDFFrage from './fragetypen/PDFFrage.tsx'
import SortierungFrageComponent from './fragetypen/SortierungFrage.tsx'
import HotspotFrageComponent from './fragetypen/HotspotFrage.tsx'
import BildbeschriftungFrageComponent from './fragetypen/BildbeschriftungFrage.tsx'
import AudioFrageComponent from './fragetypen/AudioFrage.tsx'
import DragDropBildFrageComponent from './fragetypen/DragDropBildFrage.tsx'
import MedienPlayer from './shared/MedienPlayer.tsx'
import type {
  Frage,
  MCFrage as MCFrageType,
  FreitextFrage as FreitextFrageType,
  LueckentextFrage as LueckentextFrageType,
  ZuordnungFrage as ZuordnungFrageType,
  RichtigFalschFrage as RichtigFalschFrageType,
  BerechnungFrage as BerechnungFrageType,
  BuchungssatzFrage as BuchungssatzFrageType,
  TKontoFrage as TKontoFrageType,
  KontenbestimmungFrage as KontenbestimmungFrageType,
  BilanzERFrage as BilanzERFrageType,
  AufgabengruppeFrage as AufgabengruppeFrageType,
  VisualisierungFrage as VisualisierungFrageType,
  PDFFrage as PDFFrageTyp,
  SortierungFrage as SortierungFrageType,
  HotspotFrage as HotspotFrageType,
  BildbeschriftungFrage as BildbeschriftungFrageType,
  AudioFrage as AudioFrageType,
  DragDropBildFrage as DragDropBildFrageType,
} from '../types/fragen.ts'

interface FrageRendererProps {
  frage: Frage
}

/** Rendert die passende Fragetyp-Komponente basierend auf frage.typ */
export default function FrageRenderer({ frage }: FrageRendererProps) {
  const medienEinbettung = frage.medienEinbettung

  const fragInhalt = (() => {
  switch (frage.typ) {
    case 'mc':
      return <MCFrage frage={frage as MCFrageType} />
    case 'freitext':
      return <FreitextFrage frage={frage as FreitextFrageType} />
    case 'lueckentext':
      return <LueckentextFrage frage={frage as LueckentextFrageType} />
    case 'zuordnung':
      return <ZuordnungFrage frage={frage as ZuordnungFrageType} />
    case 'richtigfalsch':
      return <RichtigFalschFrage frage={frage as RichtigFalschFrageType} />
    case 'berechnung':
      return <BerechnungFrage frage={frage as BerechnungFrageType} />
    case 'buchungssatz':
      return <BuchungssatzFrage frage={frage as BuchungssatzFrageType} />
    case 'tkonto':
      return <TKontoFrageComponent frage={frage as TKontoFrageType} />
    case 'kontenbestimmung':
      return <KontenbestimmungFrageComponent frage={frage as KontenbestimmungFrageType} />
    case 'bilanzstruktur':
      return <BilanzERFrageComponent frage={frage as BilanzERFrageType} />
    case 'aufgabengruppe':
      return <AufgabengruppeFrageComponent frage={frage as AufgabengruppeFrageType} />
    case 'visualisierung':
      if ((frage as VisualisierungFrageType).untertyp === 'zeichnen') {
        return <ZeichnenFrage frage={frage as VisualisierungFrageType} />
      }
      return (
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-center">
          Visualisierungs-Untertyp «{(frage as VisualisierungFrageType).untertyp}» wird in einer späteren Phase implementiert.
        </div>
      )
    case 'pdf':
      return <PDFFrage frage={frage as PDFFrageTyp} />
    case 'sortierung':
      return <SortierungFrageComponent frage={frage as SortierungFrageType} />
    case 'hotspot':
      return <HotspotFrageComponent frage={frage as HotspotFrageType} />
    case 'bildbeschriftung':
      return <BildbeschriftungFrageComponent frage={frage as BildbeschriftungFrageType} />
    case 'audio':
      return <AudioFrageComponent frage={frage as AudioFrageType} />
    case 'dragdrop_bild':
      return <DragDropBildFrageComponent frage={frage as DragDropBildFrageType} />
    default:
      return (
        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-center">
          Fragetyp «{(frage as { typ: string }).typ}» wird in einer späteren Phase implementiert.
        </div>
      )
  }
  })()

  // Medien-Einbettung vor dem Frageinhalt rendern
  if (medienEinbettung) {
    return (
      <div className="flex flex-col gap-4">
        <MedienPlayer
          url={medienEinbettung.url}
          typ={medienEinbettung.typ}
          maxAbspielungen={medienEinbettung.maxAbspielungen}
          autoplay={medienEinbettung.autoplay}
        />
        {fragInhalt}
      </div>
    )
  }

  return fragInhalt
}
