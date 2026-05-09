import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import { Section, Field, Toggle } from '../ComposerUI.tsx'
import { downloadSebDatei } from '../../../../../utils/sebConfigGenerator.ts'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
}

export default function OptionenSection({ pruefung, updatePruefung }: Props) {
  return (
    <Section titel="Optionen">
      <div className="space-y-3">
        <Toggle
          label="Rücknavigation erlaubt"
          beschreibung="SuS können zwischen Fragen vor- und zurücknavigieren"
          aktiv={pruefung.ruecknavigation}
          onChange={(v) => updatePruefung({ ruecknavigation: v })}
        />
        {pruefung.typ !== 'formativ' && (
          <>
            <Toggle
              label="SEB erforderlich"
              beschreibung="Prüfung nur im Safe Exam Browser erlaubt"
              aktiv={pruefung.sebErforderlich}
              onChange={(v) => updatePruefung({ sebErforderlich: v })}
            />
            {pruefung.sebErforderlich && (
              <button
                type="button"
                onClick={() => downloadSebDatei(pruefung.id, pruefung.titel)}
                className="ml-8 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                📥 SEB-Datei herunterladen
              </button>
            )}
          </>
        )}
        <Toggle
          label="Zufällige Fragenreihenfolge"
          beschreibung="Fragen innerhalb eines Abschnitts werden gemischt"
          aktiv={pruefung.zufallsreihenfolgeFragen}
          onChange={(v) => updatePruefung({ zufallsreihenfolgeFragen: v })}
        />
        <Toggle
          label="Zufällige Optionen-Reihenfolge"
          beschreibung="Antwortoptionen bei MC, Single Choice und R/F werden gemischt"
          aktiv={pruefung.zufallsreihenfolgeOptionen}
          onChange={(v) => updatePruefung({ zufallsreihenfolgeOptionen: v })}
        />
      </div>

      {(pruefung.zeitModus ?? 'countdown') !== 'open-end' && (
      <div className="mt-4">
        <Field label="Zeitanzeige">
          <select
            value={pruefung.zeitanzeigeTyp}
            onChange={(e) => updatePruefung({ zeitanzeigeTyp: e.target.value as 'countdown' | 'verstricheneZeit' | 'keine' })}
            className="input-field"
          >
            <option value="countdown">Countdown (verbleibende Zeit)</option>
            <option value="verstricheneZeit">Verstrichene Zeit</option>
            <option value="keine">Keine Zeitanzeige</option>
          </select>
        </Field>
      </div>
      )}
    </Section>
  )
}
