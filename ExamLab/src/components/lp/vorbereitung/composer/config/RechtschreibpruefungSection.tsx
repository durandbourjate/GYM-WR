import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import { Section, Toggle } from '../ComposerUI.tsx'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
}

export default function RechtschreibpruefungSection({ pruefung, updatePruefung }: Props) {
  return (
    <Section titel="Rechtschreibprüfung">
      <div className="space-y-3">
        <Toggle
          label="Rechtschreibprüfung aktiviert"
          beschreibung="Browser-Rechtschreibkorrektur für Freitext-Eingaben (für Diktate deaktivieren)"
          aktiv={pruefung.rechtschreibpruefung !== false}
          onChange={(v) => updatePruefung({ rechtschreibpruefung: v })}
        />
        {pruefung.rechtschreibpruefung !== false && (
          <div className="ml-8">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Sprache
            </label>
            <select
              value={pruefung.rechtschreibSprache ?? 'de'}
              onChange={(e) => updatePruefung({ rechtschreibSprache: e.target.value as 'de' | 'fr' | 'en' | 'it' })}
              className="input-field w-48"
            >
              <option value="de">Deutsch (de)</option>
              <option value="fr">Français (fr)</option>
              <option value="en">English (en)</option>
              <option value="it">Italiano (it)</option>
            </select>
          </div>
        )}
      </div>
    </Section>
  )
}
