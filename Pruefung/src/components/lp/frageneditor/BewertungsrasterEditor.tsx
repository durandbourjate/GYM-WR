import { useState } from 'react'
import type { Bewertungskriterium } from '../../../types/fragen.ts'
import { Abschnitt } from './EditorBausteine.tsx'

// === Bewertungsraster-Vorlagen ===

interface BewertungsrasterVorlage {
  id: string
  name: string
  kriterien: Array<{ beschreibung: string; punkte: number }>
  builtin?: boolean
}

const DEFAULT_VORLAGEN: BewertungsrasterVorlage[] = [
  {
    id: '__freitext_standard',
    name: 'Freitext Standard',
    kriterien: [
      { beschreibung: 'Inhalt', punkte: 2 },
      { beschreibung: 'Argumentation', punkte: 2 },
      { beschreibung: 'Sprache', punkte: 1 },
    ],
  },
  {
    id: '__berechnung_standard',
    name: 'Berechnung Standard',
    kriterien: [
      { beschreibung: 'Lösungsweg', punkte: 2 },
      { beschreibung: 'Ergebnis', punkte: 1 },
      { beschreibung: 'Einheit', punkte: 0.5 },
    ],
  },
  {
    id: '__analyse_standard',
    name: 'Analyse Standard',
    kriterien: [
      { beschreibung: 'Sachkenntnis', punkte: 2 },
      { beschreibung: 'Analyse', punkte: 2 },
      { beschreibung: 'Bewertung', punkte: 1 },
      { beschreibung: 'Darstellung', punkte: 1 },
    ],
  },
]

const VORLAGEN_KEY = 'bewertungsraster-vorlagen'

function ladeVorlagen(): BewertungsrasterVorlage[] {
  try {
    const raw = localStorage.getItem(VORLAGEN_KEY)
    if (raw === null) {
      localStorage.setItem(VORLAGEN_KEY, JSON.stringify(DEFAULT_VORLAGEN))
      return DEFAULT_VORLAGEN.map((v) => ({ ...v }))
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v: unknown): v is BewertungsrasterVorlage =>
        typeof v === 'object' && v !== null && 'id' in v && 'name' in v && 'kriterien' in v
    )
  } catch {
    return []
  }
}

function speichereVorlagen(vorlagen: BewertungsrasterVorlage[]): void {
  localStorage.setItem(VORLAGEN_KEY, JSON.stringify(vorlagen))
}

function resetVorlagenZuDefaults(): BewertungsrasterVorlage[] {
  const kopie = DEFAULT_VORLAGEN.map((v) => ({ ...v, kriterien: v.kriterien.map((k) => ({ ...k })) }))
  speichereVorlagen(kopie)
  return kopie
}

interface BewertungsrasterEditorProps {
  bewertungsraster: Bewertungskriterium[]
  setBewertungsraster: (raster: Bewertungskriterium[]) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  kiButtons?: React.ReactNode
  /** Typ-spezifische Bewertungsoptionen, die oberhalb des Rasters angezeigt werden */
  extraContent?: React.ReactNode
}

export default function BewertungsrasterEditor({ bewertungsraster, setBewertungsraster, kiButtons, extraContent }: BewertungsrasterEditorProps) {
  const [vorlagen, setVorlagen] = useState<BewertungsrasterVorlage[]>(ladeVorlagen)

  return (
    <Abschnitt
      titel="Bewertungsraster"
      einklappbar
      standardOffen={false}
      titelRechts={kiButtons}
    >
      <div className="space-y-2">
        {/* Typ-spezifische Bewertungsoptionen */}
        {extraContent}

        {/* Vorlage-Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value=""
            onChange={(e) => {
              const vorlage = vorlagen.find((v) => v.id === e.target.value)
              if (vorlage) {
                setBewertungsraster(vorlage.kriterien.map((k) => ({ ...k })))
              }
            }}
            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Vorlage laden"
          >
            <option value="">Vorlage laden...</option>
            {vorlagen.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <button
            onClick={() => {
              const gueltig = bewertungsraster.filter((k) => k.beschreibung.trim())
              if (gueltig.length === 0) return
              const name = window.prompt('Name der Vorlage:')
              if (!name?.trim()) return
              const neue: BewertungsrasterVorlage = {
                id: `custom_${Date.now()}`,
                name: name.trim(),
                kriterien: gueltig.map((k) => ({ beschreibung: k.beschreibung, punkte: k.punkte })),
              }
              const aktualisiert = [...vorlagen, neue]
              setVorlagen(aktualisiert)
              speichereVorlagen(aktualisiert)
            }}
            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
            title="Aktuelles Bewertungsraster als Vorlage speichern"
          >
            Speichern
          </button>
          {vorlagen.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const id = e.target.value
                if (!id) return
                const vorlage = vorlagen.find((v) => v.id === id)
                if (vorlage && window.confirm(`Vorlage "${vorlage.name}" löschen?`)) {
                  const aktualisiert = vorlagen.filter((v) => v.id !== id)
                  setVorlagen(aktualisiert)
                  speichereVorlagen(aktualisiert)
                }
              }}
              className="text-[11px] px-1.5 py-0.5 rounded border border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 cursor-pointer"
              title="Vorlage löschen"
            >
              <option value="">Löschen...</option>
              {vorlagen.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              if (window.confirm('Alle Vorlagen auf die 3 Standard-Vorlagen zurücksetzen?')) {
                const defaults = resetVorlagenZuDefaults()
                setVorlagen(defaults)
              }
            }}
            className="text-[11px] px-1.5 py-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
            title="Standard-Vorlagen wiederherstellen"
          >
            Zurücksetzen
          </button>
        </div>

        {/* Spalten-Header */}
        {bewertungsraster.length > 0 && (
          <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="flex-1">Kriterium</span>
            <span className="w-14 text-center">Pkt.</span>
            <span className="w-7" />
          </div>
        )}
        {bewertungsraster.map((kriterium, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              value={kriterium.beschreibung}
              onChange={(e) => {
                const neu = [...bewertungsraster]
                neu[i] = { ...neu[i], beschreibung: e.target.value }
                setBewertungsraster(neu)
              }}
              placeholder="Kriterium..."
              className="input-field flex-1 min-w-0"
            />
            <input
              type="number"
              value={kriterium.punkte}
              onChange={(e) => {
                const neu = [...bewertungsraster]
                neu[i] = { ...neu[i], punkte: parseFloat(e.target.value) || 0 }
                setBewertungsraster(neu)
              }}
              min={0}
              step={0.5}
              className="px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 text-center shrink-0" style={{ width: "56px" }}
              title="Punkte für dieses Kriterium"
            />
            <button
              onClick={() => setBewertungsraster(bewertungsraster.filter((_, j) => j !== i))}
              className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0 mt-1"
            >×</button>
          </div>
        ))}
        <button
          onClick={() => setBewertungsraster([...bewertungsraster, { beschreibung: '', punkte: 1 }])}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          + Kriterium hinzufügen
        </button>
      </div>
    </Abschnitt>
  )
}
