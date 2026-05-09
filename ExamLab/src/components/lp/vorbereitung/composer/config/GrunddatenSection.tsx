import type { PruefungsConfig } from '../../../../../types/pruefung.ts'
import { Section, Field } from '../ComposerUI.tsx'
import { useStammdatenStore } from '../../../../../store/stammdatenStore.ts'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
}

export default function GrunddatenSection({ pruefung, updatePruefung, toggleFachbereich }: Props) {
  const { stammdaten } = useStammdatenStore()

  // Fachbereich-Optionen aus Stammdaten: alle Fachbereiche die in Fachschaften definiert sind
  const fachbereichOptionen = (() => {
    const tags: { name: string; farbe: string }[] = []
    for (const fs of stammdaten.fachschaften) {
      if (fs.fachbereichTags) {
        for (const t of fs.fachbereichTags) {
          if (!tags.some(existing => existing.name === t.name)) tags.push(t)
        }
      } else {
        // Fachschaft ohne Tags: Kürzel als Fachbereich
        if (!tags.some(existing => existing.name === fs.kuerzel)) {
          tags.push({ name: fs.kuerzel, farbe: '#6b7280' })
        }
      }
    }
    // Fallback wenn keine Stammdaten: VWL, BWL, Recht
    return tags.length > 0 ? tags : [
      { name: 'VWL', farbe: '#f97316' },
      { name: 'BWL', farbe: '#3b82f6' },
      { name: 'Recht', farbe: '#22c55e' },
    ]
  })()

  return (
    <Section titel="Grunddaten">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Titel" span={2}>
          <input
            type="text"
            value={pruefung.titel}
            onChange={(e) => updatePruefung({ titel: e.target.value })}
            placeholder={pruefung.typ === 'formativ' ? 'z.B. Übung VWL — Markt' : 'z.B. Prüfung VWL/Recht — Markt & Verträge'}
            className="input-field"
          />
        </Field>

        <Field label="Klasse">
          <input
            type="text"
            value={pruefung.klasse}
            onChange={(e) => updatePruefung({ klasse: e.target.value, erlaubteKlasse: e.target.value })}
            placeholder="z.B. 29c WR (SF)"
            className="input-field"
          />
        </Field>

        <Field label="Datum">
          <input
            type="date"
            value={pruefung.datum}
            onChange={(e) => updatePruefung({ datum: e.target.value })}
            className="input-field"
          />
        </Field>

        <Field label="Gefäss">
          <select
            value={pruefung.gefaess}
            onChange={(e) => updatePruefung({ gefaess: e.target.value })}
            className="input-field"
          >
            <option value="SF">SF (Schwerpunktfach)</option>
            <option value="EF">EF (Ergänzungsfach)</option>
            <option value="EWR">EWR (Einführung W&R)</option>
            <option value="GF">GF (Grundlagenfach)</option>
          </select>
        </Field>

        <Field label="Zeitpunkt">
          <select
            value={pruefung.semester}
            onChange={(e) => updatePruefung({ semester: e.target.value })}
            className="input-field"
          >
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Fach */}
      <div className="mt-4">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
          Fach
        </label>
        <div className="flex gap-2 flex-wrap">
          {fachbereichOptionen.map((fb) => {
            const aktiv = pruefung.fachbereiche.includes(fb.name)
            return (
              <button
                key={fb.name}
                onClick={() => toggleFachbereich(fb.name)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                  aktiv
                    ? 'text-white font-medium'
                    : 'bg-slate-50 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                }`}
                style={aktiv ? { backgroundColor: fb.farbe + 'dd', borderColor: fb.farbe } : undefined}
              >
                {fb.name}
              </button>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
