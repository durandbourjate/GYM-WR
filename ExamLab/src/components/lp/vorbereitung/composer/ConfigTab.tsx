import type { PruefungsConfig } from '../../../../types/pruefung.ts'
import GrunddatenSection from './config/GrunddatenSection'
import PruefungsparameterSection from './config/PruefungsparameterSection'
import OptionenSection from './config/OptionenSection'
import RechtschreibpruefungSection from './config/RechtschreibpruefungSection'
import MaterialienSection from './materialien/MaterialienSection'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
  /** Berechnete Gesamtpunkte aus Fragen (wenn verfügbar) */
  berechnetePunkte?: number
}

export default function ConfigTab({ pruefung, updatePruefung, toggleFachbereich, berechnetePunkte }: Props) {
  return (
    <div className="space-y-6">
      <GrunddatenSection
        pruefung={pruefung}
        updatePruefung={updatePruefung}
        toggleFachbereich={toggleFachbereich}
      />
      <PruefungsparameterSection
        pruefung={pruefung}
        updatePruefung={updatePruefung}
        berechnetePunkte={berechnetePunkte}
      />
      <OptionenSection pruefung={pruefung} updatePruefung={updatePruefung} />
      <RechtschreibpruefungSection pruefung={pruefung} updatePruefung={updatePruefung} />
      <MaterialienSection
        materialien={pruefung.materialien ?? []}
        setMaterialien={(m) => updatePruefung({ materialien: m })}
      />
    </div>
  )
}
