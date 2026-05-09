import type { PruefungsConfig } from '../../../../types/pruefung.ts'
import { Section, Field, Toggle } from './ComposerUI.tsx'
import { downloadSebDatei } from '../../../../utils/sebConfigGenerator.ts'
import { useStammdatenStore } from '../../../../store/stammdatenStore.ts'
import MaterialienSection from './materialien/MaterialienSection'

interface Props {
  pruefung: PruefungsConfig
  updatePruefung: (partial: Partial<PruefungsConfig>) => void
  toggleFachbereich: (fb: string) => void
  /** Berechnete Gesamtpunkte aus Fragen (wenn verfügbar) */
  berechnetePunkte?: number
}

export default function ConfigTab({ pruefung, updatePruefung, toggleFachbereich, berechnetePunkte }: Props) {
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
    <div className="space-y-6">
      {/* Grunddaten */}
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

      {/* Prüfungsparameter */}
      <Section titel={pruefung.typ === 'formativ' ? 'Übungsparameter' : 'Prüfungsparameter'}>
        {/* Zeitmodus */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Zeitmodus</label>
          <div className="flex gap-1">
            {(['countdown', 'open-end'] as const).map((m) => (
              <button
                key={m}
                onClick={() => updatePruefung({ zeitModus: m })}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer
                  ${(pruefung.zeitModus ?? 'countdown') === m
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
              >
                {m === 'countdown' ? 'Countdown' : 'Open-End'}
              </button>
            ))}
          </div>
          {(pruefung.zeitModus ?? 'countdown') === 'open-end' && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Kein Zeitlimit. Beenden Sie die {pruefung.typ === 'formativ' ? 'Übung' : 'Prüfung'} manuell im Monitoring.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(pruefung.zeitModus ?? 'countdown') !== 'open-end' && (
          <Field label="Dauer (Minuten)">
            <input
              type="number"
              value={pruefung.dauerMinuten}
              onChange={(e) => updatePruefung({ dauerMinuten: parseInt(e.target.value) || 0 })}
              min={5}
              max={300}
              className="input-field"
            />
          </Field>
          )}

          {/* Typ-Dropdown ausgeblendet — wird automatisch über den Modus (Prüfen/Üben) gesetzt */}

          {pruefung.typ !== 'formativ' && (
          <Field label="Gesamtpunkte">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={berechnetePunkte ?? pruefung.gesamtpunkte}
                onChange={(e) => updatePruefung({ gesamtpunkte: parseInt(e.target.value) || 0 })}
                readOnly={berechnetePunkte !== undefined}
                min={0}
                className={`input-field ${berechnetePunkte !== undefined ? 'bg-slate-50 dark:bg-slate-700/50' : ''}`}
              />
              {berechnetePunkte !== undefined && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">auto</span>
              )}
            </div>
          </Field>
          )}
        </div>
      </Section>

      {/* Optionen */}
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

      {/* Rechtschreibprüfung */}
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

      {/* Materialien (Gesetze, PDFs, Hilfsmittel) */}
      <MaterialienSection
        materialien={pruefung.materialien ?? []}
        setMaterialien={(m) => updatePruefung({ materialien: m })}
      />
    </div>
  )
}
