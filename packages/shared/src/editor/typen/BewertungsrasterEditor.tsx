import { useState } from 'react'
import type { Bewertungskriterium, Fachbereich, Niveaustufe } from '../../types/fragen'
import { Abschnitt } from '../components/EditorBausteine'
import {
  STANDARD_VORLAGEN,
  filtereVorlagenNachFachbereich,
  skaliereVorlage,
} from '../data/bewertungsrasterVorlagen'

// === Custom-Vorlagen (localStorage) ===

interface CustomVorlage {
  id: string
  name: string
  kriterien: Bewertungskriterium[]
}

const CUSTOM_VORLAGEN_KEY = 'bewertungsraster-vorlagen-custom'

function ladeCustomVorlagen(): CustomVorlage[] {
  try {
    const raw = localStorage.getItem(CUSTOM_VORLAGEN_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (v: unknown): v is CustomVorlage =>
        typeof v === 'object' && v !== null && 'id' in v && 'name' in v && 'kriterien' in v
    )
  } catch {
    return []
  }
}

function speichereCustomVorlagen(vorlagen: CustomVorlage[]): void {
  localStorage.setItem(CUSTOM_VORLAGEN_KEY, JSON.stringify(vorlagen))
}

// === Migration: Alte Vorlagen-Keys bereinigen ===

function migrierteAlteVorlagen(): void {
  const altKey = 'bewertungsraster-vorlagen'
  try {
    const alt = localStorage.getItem(altKey)
    if (alt) {
      // Alte Custom-Vorlagen (nicht-builtin) uebernehmen
      const parsed = JSON.parse(alt)
      if (Array.isArray(parsed)) {
        const customs = parsed.filter(
          (v: { builtin?: boolean; id?: string }) => !v.builtin && !v.id?.startsWith('__')
        )
        if (customs.length > 0) {
          const bestehend = ladeCustomVorlagen()
          const neueIds = new Set(bestehend.map(v => v.id))
          const zuMigrieren = customs.filter((v: { id: string }) => !neueIds.has(v.id))
          if (zuMigrieren.length > 0) {
            speichereCustomVorlagen([...bestehend, ...zuMigrieren])
          }
        }
      }
      localStorage.removeItem(altKey)
    }
  } catch {
    // Ignorieren — alter Key war korrupt
  }
}

// Einmalig beim Laden
migrierteAlteVorlagen()

// === Niveaustufen-Hilfe ===

function generiereDefaultNiveaustufen(maxPunkte: number): Niveaustufe[] {
  const stufen: Niveaustufe[] = []
  // Von maxPunkte runter bis 0 in 0.5- oder 1-Schritten
  if (maxPunkte <= 1) {
    stufen.push({ punkte: maxPunkte, beschreibung: '' })
    if (maxPunkte > 0.5) stufen.push({ punkte: maxPunkte / 2, beschreibung: '' })
    stufen.push({ punkte: 0, beschreibung: '' })
  } else {
    stufen.push({ punkte: maxPunkte, beschreibung: '' })
    const halb = Math.round(maxPunkte / 2 * 2) / 2
    if (halb > 0 && halb < maxPunkte) stufen.push({ punkte: halb, beschreibung: '' })
    stufen.push({ punkte: 0, beschreibung: '' })
  }
  return stufen
}

// === Props ===

interface BewertungsrasterEditorProps {
  bewertungsraster: Bewertungskriterium[]
  setBewertungsraster: (raster: Bewertungskriterium[]) => void
  /** Fachbereich fuer Vorlagen-Filterung */
  fachbereich?: Fachbereich
  /** Punkte der Frage (fuer Skalierung der Vorlagen) */
  fragePunkte?: number
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  kiButtons?: React.ReactNode
  /** Typ-spezifische Bewertungsoptionen, die oberhalb des Rasters angezeigt werden */
  extraContent?: React.ReactNode
}

export default function BewertungsrasterEditor({
  bewertungsraster,
  setBewertungsraster,
  fachbereich,
  fragePunkte,
  kiButtons,
  extraContent,
}: BewertungsrasterEditorProps) {
  const [customVorlagen, setCustomVorlagen] = useState<CustomVorlage[]>(ladeCustomVorlagen)
  const [offeneNiveaustufen, setOffeneNiveaustufen] = useState<Set<number>>(new Set())

  // Standard-Vorlagen nach Fachbereich filtern
  const standardVorlagen = filtereVorlagenNachFachbereich(fachbereich)

  // Vorlage laden (mit Skalierung)
  const ladeVorlage = (id: string) => {
    // Standard-Vorlage?
    const standard = STANDARD_VORLAGEN.find(v => v.id === id)
    if (standard) {
      const kriterien = fragePunkte ? skaliereVorlage(standard, fragePunkte) : standard.kriterien
      setBewertungsraster(kriterien.map(k => ({
        ...k,
        niveaustufen: k.niveaustufen?.map(n => ({ ...n })),
      })))
      return
    }
    // Custom-Vorlage?
    const custom = customVorlagen.find(v => v.id === id)
    if (custom) {
      setBewertungsraster(custom.kriterien.map(k => ({
        ...k,
        niveaustufen: k.niveaustufen?.map(n => ({ ...n })),
      })))
    }
  }

  // Custom-Vorlage speichern
  const speichereAlsVorlage = () => {
    const gueltig = bewertungsraster.filter(k => k.beschreibung.trim())
    if (gueltig.length === 0) return
    const name = window.prompt('Name der Vorlage:')
    if (!name?.trim()) return
    const neue: CustomVorlage = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      kriterien: gueltig.map(k => ({
        beschreibung: k.beschreibung,
        punkte: k.punkte,
        stichworte: k.stichworte,
        niveaustufen: k.niveaustufen?.map(n => ({ ...n })),
      })),
    }
    const aktualisiert = [...customVorlagen, neue]
    setCustomVorlagen(aktualisiert)
    speichereCustomVorlagen(aktualisiert)
  }

  // Custom-Vorlage loeschen
  const loescheVorlage = (id: string) => {
    const vorlage = customVorlagen.find(v => v.id === id)
    if (vorlage && window.confirm(`Vorlage "${vorlage.name}" loeschen?`)) {
      const aktualisiert = customVorlagen.filter(v => v.id !== id)
      setCustomVorlagen(aktualisiert)
      speichereCustomVorlagen(aktualisiert)
    }
  }

  // Niveaustufen toggle
  const toggleNiveaustufen = (index: number) => {
    setOffeneNiveaustufen(prev => {
      const neu = new Set(prev)
      if (neu.has(index)) neu.delete(index)
      else neu.add(index)
      return neu
    })
  }

  // Niveaustufen fuer ein Kriterium hinzufuegen
  const addNiveaustufen = (index: number) => {
    const neu = [...bewertungsraster]
    neu[index] = {
      ...neu[index],
      niveaustufen: generiereDefaultNiveaustufen(neu[index].punkte),
    }
    setBewertungsraster(neu)
    setOffeneNiveaustufen(prev => new Set(prev).add(index))
  }

  // Niveaustufen entfernen
  const removeNiveaustufen = (index: number) => {
    const neu = [...bewertungsraster]
    const { niveaustufen: _, ...rest } = neu[index]
    neu[index] = rest as Bewertungskriterium
    setBewertungsraster(neu)
  }

  // Niveaustufe aktualisieren
  const updateNiveaustufe = (kriteriumIdx: number, stufenIdx: number, feld: keyof Niveaustufe, wert: string | number) => {
    const neu = [...bewertungsraster]
    const stufen = [...(neu[kriteriumIdx].niveaustufen ?? [])]
    stufen[stufenIdx] = { ...stufen[stufenIdx], [feld]: wert }
    neu[kriteriumIdx] = { ...neu[kriteriumIdx], niveaustufen: stufen }
    setBewertungsraster(neu)
  }

  // Neue Niveaustufe hinzufuegen
  const addNiveaustufe = (kriteriumIdx: number) => {
    const neu = [...bewertungsraster]
    const stufen = [...(neu[kriteriumIdx].niveaustufen ?? [])]
    const minPunkte = stufen.length > 0 ? Math.min(...stufen.map(s => s.punkte)) : 0
    stufen.push({ punkte: Math.max(0, minPunkte - 0.5), beschreibung: '' })
    neu[kriteriumIdx] = { ...neu[kriteriumIdx], niveaustufen: stufen }
    setBewertungsraster(neu)
  }

  // Niveaustufe loeschen
  const removeNiveaustufe = (kriteriumIdx: number, stufenIdx: number) => {
    const neu = [...bewertungsraster]
    const stufen = (neu[kriteriumIdx].niveaustufen ?? []).filter((_, j) => j !== stufenIdx)
    neu[kriteriumIdx] = { ...neu[kriteriumIdx], niveaustufen: stufen.length > 0 ? stufen : undefined }
    setBewertungsraster(neu)
  }

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
          {/* Standard-Vorlagen Dropdown */}
          <select
            value=""
            onChange={(e) => ladeVorlage(e.target.value)}
            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Standard-Vorlage laden"
          >
            <option value="">Vorlage laden...</option>
            {/* Fachspezifisch zuerst, dann fachuebergreifend */}
            {standardVorlagen.filter(v => v.kategorie !== 'fachuebergreifend').length > 0 && (
              <optgroup label={fachbereich ?? 'Fachspezifisch'}>
                {standardVorlagen
                  .filter(v => v.kategorie !== 'fachuebergreifend')
                  .map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            )}
            <optgroup label="Fachuebergreifend">
              {standardVorlagen
                .filter(v => v.kategorie === 'fachuebergreifend')
                .map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </optgroup>
            {customVorlagen.length > 0 && (
              <optgroup label="Eigene Vorlagen">
                {customVorlagen.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </optgroup>
            )}
          </select>

          <button
            onClick={speichereAlsVorlage}
            className="text-[11px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
            title="Aktuelles Bewertungsraster als eigene Vorlage speichern"
          >
            Speichern
          </button>

          {customVorlagen.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && loescheVorlage(e.target.value)}
              className="text-[11px] px-1.5 py-0.5 rounded border border-red-300 dark:border-red-600 bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 cursor-pointer"
              title="Eigene Vorlage loeschen"
            >
              <option value="">Loeschen...</option>
              {customVorlagen.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          )}
        </div>

        {/* Spalten-Header */}
        {bewertungsraster.length > 0 && (
          <div className="flex gap-2 items-center text-xs text-slate-500 dark:text-slate-400">
            <span className="w-5" />
            <span className="flex-1">Kriterium</span>
            <span className="w-14 text-center">Pkt.</span>
            <span className="w-7" />
          </div>
        )}

        {/* Kriterien */}
        {bewertungsraster.map((kriterium, i) => {
          const hatNiveaustufen = kriterium.niveaustufen && kriterium.niveaustufen.length > 0
          const istOffen = offeneNiveaustufen.has(i)

          return (
            <div key={i} className="space-y-0.5">
              {/* Kriterium-Zeile */}
              <div className="flex gap-2 items-start">
                {/* Chevron fuer Niveaustufen */}
                <button
                  onClick={() => {
                    if (hatNiveaustufen) {
                      toggleNiveaustufen(i)
                    } else {
                      addNiveaustufen(i)
                    }
                  }}
                  className={`w-5 h-5 mt-2 text-xs shrink-0 cursor-pointer transition-colors ${
                    hatNiveaustufen
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                  }`}
                  title={hatNiveaustufen ? (istOffen ? 'Niveaustufen einklappen' : 'Niveaustufen anzeigen') : 'Niveaustufen hinzufuegen'}
                >
                  {hatNiveaustufen ? (istOffen ? '\u25BC' : '\u25B6') : '\u25C7'}
                </button>

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
                  className="px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 text-center shrink-0"
                  style={{ width: '56px' }}
                  title="Punkte fuer dieses Kriterium"
                />
                <button
                  onClick={() => {
                    setBewertungsraster(bewertungsraster.filter((_, j) => j !== i))
                    setOffeneNiveaustufen(prev => {
                      const neu = new Set<number>()
                      prev.forEach(idx => {
                        if (idx < i) neu.add(idx)
                        else if (idx > i) neu.add(idx - 1)
                      })
                      return neu
                    })
                  }}
                  className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0 mt-1"
                >
                  x
                </button>
              </div>

              {/* Niveaustufen (aufklappbar) */}
              {hatNiveaustufen && istOffen && (
                <div className="ml-7 pl-3 border-l-2 border-slate-200 dark:border-slate-600 space-y-1">
                  {kriterium.niveaustufen!.map((stufe, j) => (
                    <div key={j} className="flex gap-1.5 items-start">
                      <input
                        type="number"
                        value={stufe.punkte}
                        onChange={(e) => updateNiveaustufe(i, j, 'punkte', parseFloat(e.target.value) || 0)}
                        min={0}
                        max={kriterium.punkte}
                        step={0.5}
                        className="px-1 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-center shrink-0 focus:outline-none focus:ring-1 focus:ring-slate-400"
                        style={{ width: '40px' }}
                        title="Punkte fuer diese Stufe"
                      />
                      <span className="text-xs text-slate-400 mt-1 shrink-0">P:</span>
                      <input
                        type="text"
                        value={stufe.beschreibung}
                        onChange={(e) => updateNiveaustufe(i, j, 'beschreibung', e.target.value)}
                        placeholder="Beschreibung dieser Stufe..."
                        className="flex-1 min-w-0 px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                      <button
                        onClick={() => removeNiveaustufe(i, j)}
                        className="w-5 h-5 text-red-300 hover:text-red-500 cursor-pointer text-xs shrink-0 mt-0.5"
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      onClick={() => addNiveaustufe(i)}
                      className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      + Stufe
                    </button>
                    <button
                      onClick={() => removeNiveaustufen(i)}
                      className="text-[10px] text-red-300 dark:text-red-500 hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
                    >
                      Niveaustufen entfernen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button
          onClick={() => setBewertungsraster([...bewertungsraster, { beschreibung: '', punkte: 1 }])}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          + Kriterium hinzufuegen
        </button>
      </div>
    </Abschnitt>
  )
}
