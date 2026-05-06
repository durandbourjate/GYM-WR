import type { Frage, FrageAnhang } from '../../../../types/fragen-storage'
import type { Antwort } from '../../../../types/antworten'
import type { KorrekturErgebnis } from '../../../../utils/autoKorrektur'
import MediaAnhang from '../../../MediaAnhang.tsx'
import { frageHaupttext } from './util'
import MCAnzeige from './MCAnzeige'
import RFAnzeige from './RFAnzeige'
import FreitextAnzeige from './FreitextAnzeige'
import BerechnungAnzeige from './BerechnungAnzeige'
import LueckentextAnzeige from './LueckentextAnzeige'
import ZuordnungAnzeige from './ZuordnungAnzeige'
import BuchungssatzAnzeige from './BuchungssatzAnzeige'
import TKontoAnzeige from './TKontoAnzeige'
import KontenbestimmungAnzeige from './KontenbestimmungAnzeige'
import BilanzERAnzeige from './BilanzERAnzeige'
import FormelAnzeige from './FormelAnzeige'
import VisualisierungAnzeige from './VisualisierungAnzeige'
import PDFAnnotationAnzeige from './PDFAnnotationAnzeige'
import AudioAnzeige from './AudioAnzeige'
import CodeAnzeige from './CodeAnzeige'
import SortierungAnzeige from './SortierungAnzeige'
import HotspotAnzeige from './HotspotAnzeige'
import BildbeschriftungAnzeige from './BildbeschriftungAnzeige'
import DragDropBildAnzeige from './DragDropBildAnzeige'
import AutoKorrekturDetails from './AutoKorrekturDetails'
import MusterloesungBox from './MusterloesungBox'

interface Props {
  frage: Frage
  antwort: Antwort | undefined
  autoErgebnis: KorrekturErgebnis | null
}

/** Vollansicht einer Frage in der Korrektur-Ansicht */
export default function KorrekturFrageVollansicht({ frage, antwort, autoErgebnis }: Props) {
  const text = frageHaupttext(frage)

  // Anhänge aus Frage extrahieren (Bilder, PDFs)
  const anhaenge = 'anhaenge' in frage ? (frage as { anhaenge?: FrageAnhang[] }).anhaenge : undefined

  return (
    <div>
      {/* Fragetext */}
      <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-1">{text}</p>

      {/* Anhänge (Bilder, PDFs, Materialien) */}
      {anhaenge && anhaenge.length > 0 && (
        <div className="space-y-2 my-2">
          {anhaenge.map((a) => (
            <MediaAnhang key={a.id} anhang={a} />
          ))}
        </div>
      )}

      {/* Typ-spezifische Antwortdarstellung */}
      {frage.typ === 'mc' && (
        <MCAnzeige frage={frage} antwort={antwort?.typ === 'mc' ? antwort : undefined} />
      )}
      {frage.typ === 'richtigfalsch' && (
        <RFAnzeige frage={frage} antwort={antwort?.typ === 'richtigfalsch' ? antwort : undefined} />
      )}
      {frage.typ === 'freitext' && (
        <FreitextAnzeige antwort={antwort?.typ === 'freitext' ? antwort : undefined} />
      )}
      {frage.typ === 'berechnung' && (
        <BerechnungAnzeige frage={frage} antwort={antwort?.typ === 'berechnung' ? antwort : undefined} />
      )}
      {frage.typ === 'lueckentext' && (
        <LueckentextAnzeige frage={frage} antwort={antwort?.typ === 'lueckentext' ? antwort : undefined} />
      )}
      {frage.typ === 'zuordnung' && (
        <ZuordnungAnzeige frage={frage} antwort={antwort?.typ === 'zuordnung' ? antwort : undefined} />
      )}
      {frage.typ === 'buchungssatz' && (
        <BuchungssatzAnzeige antwort={antwort?.typ === 'buchungssatz' ? antwort : undefined} />
      )}
      {frage.typ === 'tkonto' && (
        <TKontoAnzeige antwort={antwort?.typ === 'tkonto' ? antwort : undefined} />
      )}
      {frage.typ === 'kontenbestimmung' && (
        <KontenbestimmungAnzeige frage={frage} antwort={antwort?.typ === 'kontenbestimmung' ? antwort : undefined} />
      )}
      {frage.typ === 'bilanzstruktur' && (
        <BilanzERAnzeige antwort={antwort?.typ === 'bilanzstruktur' ? antwort : undefined} />
      )}
      {frage.typ === 'formel' && (
        <FormelAnzeige antwort={antwort?.typ === 'formel' ? antwort : undefined} />
      )}
      {frage.typ === 'visualisierung' && (
        <VisualisierungAnzeige antwort={antwort?.typ === 'visualisierung' ? antwort : undefined} />
      )}
      {frage.typ === 'pdf' && (
        <PDFAnnotationAnzeige frage={frage} antwort={antwort?.typ === 'pdf' ? antwort : undefined} />
      )}
      {frage.typ === 'audio' && (
        <AudioAnzeige antwort={antwort?.typ === 'audio' ? antwort : undefined} />
      )}
      {frage.typ === 'code' && (
        <CodeAnzeige antwort={antwort?.typ === 'code' ? antwort : undefined} />
      )}
      {frage.typ === 'sortierung' && (
        <SortierungAnzeige antwort={antwort?.typ === 'sortierung' ? antwort : undefined} />
      )}
      {frage.typ === 'hotspot' && (
        <HotspotAnzeige frage={frage} antwort={antwort?.typ === 'hotspot' ? antwort : undefined} />
      )}
      {frage.typ === 'bildbeschriftung' && (
        <BildbeschriftungAnzeige frage={frage} antwort={antwort?.typ === 'bildbeschriftung' ? antwort : undefined} />
      )}
      {frage.typ === 'dragdrop_bild' && (
        <DragDropBildAnzeige frage={frage} antwort={antwort?.typ === 'dragdrop_bild' ? antwort : undefined} />
      )}

      {/* Auto-Korrektur-Details */}
      {autoErgebnis && <AutoKorrekturDetails ergebnis={autoErgebnis} frageTyp={frage.typ} />}

      {/* Musterlösung */}
      <MusterloesungBox frage={frage} />
    </div>
  )
}
