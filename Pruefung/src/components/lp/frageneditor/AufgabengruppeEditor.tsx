import { useState } from 'react'
import type { InlineTeilaufgabe, MCOption } from '../../../types/fragen.ts'
import { typLabel } from '../../../utils/fachUtils.ts'
import { Abschnitt } from './EditorBausteine.tsx'

/** Erlaubte Typen für Teilaufgaben (kein Aufgabengruppe, kein PDF, kein Zeichnen) */
const TEILAUFGABE_TYPEN = [
  'mc', 'freitext', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung', 'sortierung',
] as const
type TeilaufgabeTyp = typeof TEILAUFGABE_TYPEN[number]

interface Props {
  kontext: string
  setKontext: (v: string) => void
  teilaufgaben: InlineTeilaufgabe[]
  setTeilaufgaben: (t: InlineTeilaufgabe[]) => void
  /** Legacy: für alte Fragen mit ID-Verknüpfung */
  teilaufgabenIds?: string[]
  setTeilaufgabenIds?: (ids: string[]) => void
  titelRechts?: React.ReactNode
  parentId?: string
}

/** Erstellt eine leere Teilaufgabe mit Defaults */
function neueTeilaufgabe(typ: TeilaufgabeTyp, parentId: string, index: number): InlineTeilaufgabe {
  const buchstabe = String.fromCharCode(97 + index) // a, b, c, ...
  const id = `${parentId}_${buchstabe}`
  const basis: InlineTeilaufgabe = { id, typ, fragetext: '', punkte: 1 }

  switch (typ) {
    case 'mc':
      return { ...basis, punkte: 2, optionen: [
        { id: 'a', text: '', korrekt: true },
        { id: 'b', text: '', korrekt: false },
        { id: 'c', text: '', korrekt: false },
      ], mehrfachauswahl: false }
    case 'richtigfalsch':
      return { ...basis, aussagen: [
        { id: '1', text: '', korrekt: true },
        { id: '2', text: '', korrekt: false },
      ]}
    case 'freitext':
      return { ...basis, punkte: 3, laenge: 'mittel' }
    case 'lueckentext':
      return { ...basis, punkte: 2, textMitLuecken: '', luecken: [] }
    case 'zuordnung':
      return { ...basis, punkte: 2, paare: [{ links: '', rechts: '' }] }
    case 'berechnung':
      return { ...basis, punkte: 2, ergebnisse: [{ id: '1', label: 'Ergebnis', korrekt: 0, toleranz: 0 }], rechenwegErforderlich: false }
    case 'sortierung':
      return { ...basis, punkte: 2, elemente: ['', ''], teilpunkte: true }
    default:
      return basis
  }
}

export default function AufgabengruppeEditor({
  kontext, setKontext,
  teilaufgaben, setTeilaufgaben,
  teilaufgabenIds, setTeilaufgabenIds: _setTeilaufgabenIds,
  titelRechts, parentId = 'ag',
}: Props) {
  const [offenIndex, setOffenIndex] = useState<number | null>(null)
  const istLegacy = (!teilaufgaben || teilaufgaben.length === 0) && teilaufgabenIds && teilaufgabenIds.length > 0

  function handleHinzufuegen(typ: TeilaufgabeTyp) {
    const ta = neueTeilaufgabe(typ, parentId, teilaufgaben.length)
    setTeilaufgaben([...teilaufgaben, ta])
    setOffenIndex(teilaufgaben.length)
  }

  function handleEntfernen(index: number) {
    setTeilaufgaben(teilaufgaben.filter((_, i) => i !== index))
    if (offenIndex === index) setOffenIndex(null)
    else if (offenIndex !== null && offenIndex > index) setOffenIndex(offenIndex - 1)
  }

  function handleAktualisieren(index: number, updates: Partial<InlineTeilaufgabe>) {
    const neu = [...teilaufgaben]
    neu[index] = { ...neu[index], ...updates }
    setTeilaufgaben(neu)
  }

  function handleVerschieben(index: number, richtung: 'hoch' | 'runter') {
    const ziel = richtung === 'hoch' ? index - 1 : index + 1
    if (ziel < 0 || ziel >= teilaufgaben.length) return
    const neu = [...teilaufgaben]
    ;[neu[index], neu[ziel]] = [neu[ziel], neu[index]]
    // IDs aktualisieren (Buchstaben)
    neu.forEach((ta, i) => { ta.id = `${parentId}_${String.fromCharCode(97 + i)}` })
    setTeilaufgaben(neu)
    setOffenIndex(ziel)
  }

  return (
    <>
      {/* Kontext */}
      <Abschnitt titel="Kontext / Ausgangslage *" titelRechts={titelRechts}>
        <textarea
          value={kontext}
          onChange={(e) => setKontext(e.target.value)}
          rows={5}
          placeholder="Gemeinsamer Kontext für alle Teilaufgaben (z.B. Fallbeispiel, Geschäftsfall, Textquelle)..."
          className="input-field resize-y"
        />
      </Abschnitt>

      {/* Legacy-Hinweis */}
      {istLegacy && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          Diese Aufgabengruppe verwendet das alte ID-Format ({teilaufgabenIds?.length} verknüpfte Fragen). Fügen Sie inline Teilaufgaben hinzu, um zum neuen Format zu wechseln.
        </div>
      )}

      {/* Teilaufgaben */}
      <Abschnitt titel={`Teilaufgaben (${teilaufgaben.length})`}>
        {teilaufgaben.length === 0 && !istLegacy && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Fügen Sie mindestens eine Teilaufgabe hinzu.
          </p>
        )}

        {/* Teilaufgaben-Liste */}
        <div className="space-y-2">
          {teilaufgaben.map((ta, i) => (
            <div key={ta.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Header (immer sichtbar) */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 cursor-pointer"
                onClick={() => setOffenIndex(offenIndex === i ? null : i)}
              >
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 w-6">
                  {String.fromCharCode(97 + i)})
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {typLabel(ta.typ)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">
                  {ta.fragetext || '(kein Text)'}
                </span>
                <span className="text-xs text-slate-400">{ta.punkte} P.</span>
                <span className="text-xs text-slate-400">{offenIndex === i ? '▲' : '▼'}</span>
              </div>

              {/* Inhalt (einklappbar) */}
              {offenIndex === i && (
                <div className="p-3 space-y-3 border-t border-slate-200 dark:border-slate-700">
                  {/* Fragetext */}
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Fragetext</label>
                    <textarea
                      value={ta.fragetext}
                      onChange={(e) => handleAktualisieren(i, { fragetext: e.target.value })}
                      rows={2}
                      placeholder="Fragetext..."
                      className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 resize-y"
                    />
                  </div>

                  {/* Punkte */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500 dark:text-slate-400">Punkte:</label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={ta.punkte}
                      onChange={(e) => handleAktualisieren(i, { punkte: Number(e.target.value) || 1 })}
                      className="w-20 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Typ-spezifischer Mini-Editor */}
                  <TeilaufgabeTypEditor teilaufgabe={ta} onUpdate={(u) => handleAktualisieren(i, u)} />

                  {/* Aktions-Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => handleVerschieben(i, 'hoch')} disabled={i === 0}
                      className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">↑</button>
                    <button onClick={() => handleVerschieben(i, 'runter')} disabled={i === teilaufgaben.length - 1}
                      className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">↓</button>
                    <div className="flex-1" />
                    <button onClick={() => handleEntfernen(i)}
                      className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer">
                      Entfernen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Neue Teilaufgabe hinzufügen */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">+ Teilaufgabe:</span>
          {TEILAUFGABE_TYPEN.map((typ) => (
            <button
              key={typ}
              onClick={() => handleHinzufuegen(typ)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              {typLabel(typ)}
            </button>
          ))}
        </div>

        {/* Gesamtpunkte */}
        {teilaufgaben.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Gesamtpunkte: <strong>{teilaufgaben.reduce((sum, ta) => sum + ta.punkte, 0)}</strong>
          </p>
        )}
      </Abschnitt>
    </>
  )
}

// ============ Mini-Editoren für Teilaufgaben-Typen ============

interface TeilaufgabeTypEditorProps {
  teilaufgabe: InlineTeilaufgabe
  onUpdate: (updates: Partial<InlineTeilaufgabe>) => void
}

function TeilaufgabeTypEditor({ teilaufgabe: ta, onUpdate }: TeilaufgabeTypEditorProps) {
  switch (ta.typ) {
    case 'mc': return <MCMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'richtigfalsch': return <RFMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'freitext': return <FreitextMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'zuordnung': return <ZuordnungMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'berechnung': return <BerechnungMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'sortierung': return <SortierungMiniEditor ta={ta} onUpdate={onUpdate} />
    case 'lueckentext': return <LueckentextMiniEditor ta={ta} onUpdate={onUpdate} />
    default: return <p className="text-xs text-slate-400">Keine weiteren Optionen für diesen Typ.</p>
  }
}

// --- MC Mini-Editor ---
function MCMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  const optionen = ta.optionen ?? []
  function updateOpt(i: number, part: Partial<MCOption>) {
    const neu = [...optionen]
    neu[i] = { ...neu[i], ...part }
    onUpdate({ optionen: neu })
  }
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
        <input type="checkbox" checked={ta.mehrfachauswahl ?? false} onChange={(e) => onUpdate({ mehrfachauswahl: e.target.checked })} className="rounded" />
        Mehrfachauswahl
      </label>
      {optionen.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <button onClick={() => updateOpt(i, { korrekt: !opt.korrekt })}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer text-xs
              ${opt.korrekt ? 'bg-green-500 border-green-500 text-white' : 'border-slate-400'}`}>
            {opt.korrekt ? '✓' : ''}
          </button>
          <input type="text" value={opt.text} onChange={(e) => updateOpt(i, { text: e.target.value })}
            placeholder={`Option ${opt.id}`} className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {optionen.length > 2 && (
            <button onClick={() => onUpdate({ optionen: optionen.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 cursor-pointer text-xs">×</button>
          )}
        </div>
      ))}
      {optionen.length < 6 && (
        <button onClick={() => onUpdate({ optionen: [...optionen, { id: String.fromCharCode(97 + optionen.length), text: '', korrekt: false }] })}
          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Option</button>
      )}
    </div>
  )
}

// --- R/F Mini-Editor ---
function RFMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  const aussagen = ta.aussagen ?? []
  function updateA(i: number, part: Partial<typeof aussagen[0]>) {
    const neu = [...aussagen]
    neu[i] = { ...neu[i], ...part }
    onUpdate({ aussagen: neu })
  }
  return (
    <div className="space-y-2">
      {aussagen.map((a, i) => (
        <div key={a.id} className="flex items-center gap-2">
          <button onClick={() => updateA(i, { korrekt: !a.korrekt })}
            className={`px-1.5 py-0.5 text-xs rounded-full border-2 font-bold shrink-0 cursor-pointer
              ${a.korrekt ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            {a.korrekt ? 'R' : 'F'}
          </button>
          <input type="text" value={a.text} onChange={(e) => updateA(i, { text: e.target.value })}
            placeholder={`Aussage ${i + 1}`} className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {aussagen.length > 2 && (
            <button onClick={() => onUpdate({ aussagen: aussagen.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 cursor-pointer text-xs">×</button>
          )}
        </div>
      ))}
      {aussagen.length < 8 && (
        <button onClick={() => onUpdate({ aussagen: [...aussagen, { id: String(aussagen.length + 1), text: '', korrekt: true }] })}
          className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Aussage</button>
      )}
    </div>
  )
}

// --- Freitext Mini-Editor ---
function FreitextMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  return (
    <div>
      <label className="text-xs text-slate-500 dark:text-slate-400">Erwartete Länge</label>
      <select value={ta.laenge ?? 'mittel'} onChange={(e) => onUpdate({ laenge: e.target.value as 'kurz' | 'mittel' | 'lang' })}
        className="mt-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
        <option value="kurz">Kurz (1-3 Sätze)</option>
        <option value="mittel">Mittel (1 Absatz)</option>
        <option value="lang">Lang (mehrere Absätze)</option>
      </select>
    </div>
  )
}

// --- Zuordnung Mini-Editor ---
function ZuordnungMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  const paare = ta.paare ?? []
  function updatePaar(i: number, feld: 'links' | 'rechts', wert: string) {
    const neu = [...paare]
    neu[i] = { ...neu[i], [feld]: wert }
    onUpdate({ paare: neu })
  }
  return (
    <div className="space-y-2">
      {paare.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={p.links} onChange={(e) => updatePaar(i, 'links', e.target.value)}
            placeholder="Links" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          <span className="text-xs text-slate-400">→</span>
          <input type="text" value={p.rechts} onChange={(e) => updatePaar(i, 'rechts', e.target.value)}
            placeholder="Rechts" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {paare.length > 1 && (
            <button onClick={() => onUpdate({ paare: paare.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 cursor-pointer text-xs">×</button>
          )}
        </div>
      ))}
      <button onClick={() => onUpdate({ paare: [...paare, { links: '', rechts: '' }] })}
        className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Paar</button>
    </div>
  )
}

// --- Berechnung Mini-Editor ---
function BerechnungMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  const ergebnisse = ta.ergebnisse ?? []
  return (
    <div className="space-y-2">
      {ergebnisse.map((erg, i) => (
        <div key={erg.id} className="flex items-center gap-2">
          <input type="text" value={erg.label} onChange={(e) => {
            const neu = [...ergebnisse]; neu[i] = { ...neu[i], label: e.target.value }; onUpdate({ ergebnisse: neu })
          }} placeholder="Label" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          <input type="number" value={erg.korrekt} onChange={(e) => {
            const neu = [...ergebnisse]; neu[i] = { ...neu[i], korrekt: Number(e.target.value) }; onUpdate({ ergebnisse: neu })
          }} placeholder="Korrekt" className="w-24 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          <input type="number" value={erg.toleranz} onChange={(e) => {
            const neu = [...ergebnisse]; neu[i] = { ...neu[i], toleranz: Number(e.target.value) }; onUpdate({ ergebnisse: neu })
          }} placeholder="±" className="w-16 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" title="Toleranz" />
        </div>
      ))}
      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
        <input type="checkbox" checked={ta.rechenwegErforderlich ?? false} onChange={(e) => onUpdate({ rechenwegErforderlich: e.target.checked })} className="rounded" />
        Rechenweg erforderlich
      </label>
    </div>
  )
}

// --- Sortierung Mini-Editor ---
function SortierungMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  const elemente = ta.elemente ?? []
  return (
    <div className="space-y-2">
      <label className="text-xs text-slate-500 dark:text-slate-400">Elemente in korrekter Reihenfolge:</label>
      {elemente.map((el, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
          <input type="text" value={el} onChange={(e) => {
            const neu = [...elemente]; neu[i] = e.target.value; onUpdate({ elemente: neu })
          }} placeholder={`Element ${i + 1}`} className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {elemente.length > 2 && (
            <button onClick={() => onUpdate({ elemente: elemente.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600 cursor-pointer text-xs">×</button>
          )}
        </div>
      ))}
      <button onClick={() => onUpdate({ elemente: [...elemente, ''] })}
        className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Element</button>
    </div>
  )
}

// --- Lückentext Mini-Editor ---
function LueckentextMiniEditor({ ta, onUpdate }: { ta: InlineTeilaufgabe; onUpdate: (u: Partial<InlineTeilaufgabe>) => void }) {
  return (
    <div>
      <label className="text-xs text-slate-500 dark:text-slate-400">Text mit Lücken (geschweifte Klammern um Lösungswort)</label>
      <textarea
        value={ta.textMitLuecken ?? ''}
        onChange={(e) => onUpdate({ textMitLuecken: e.target.value })}
        rows={3}
        placeholder="Der [Bundesrat] ist die [Exekutive] der Schweiz."
        className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-y"
      />
    </div>
  )
}
