import { useState } from 'react'
import type { InlineTeilaufgabe, MCOption } from '../../types/fragen'
import { typLabel } from '../fachUtils'
import { Abschnitt } from '../components/EditorBausteine'
import MCEditor from './MCEditor'
import FreitextEditor from './FreitextEditor'
import RichtigFalschEditor from './RichtigFalschEditor'
import BewertungsrasterEditor from './BewertungsrasterEditor'
import type { FrageTyp } from '../editorUtils'

/** Alle Typen ausser aufgabengruppe (kein rekursives Verschachteln) */
const TEILAUFGABE_TYPEN: FrageTyp[] = [
  'freitext', 'mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung',
  'sortierung', 'hotspot', 'bildbeschriftung', 'dragdrop_bild',
  'code', 'formel', 'audio',
  'visualisierung', 'pdf',
  'buchungssatz', 'tkonto', 'kontenbestimmung', 'bilanzstruktur',
]

interface Props {
  kontext: string
  setKontext: (v: string) => void
  teilaufgaben: InlineTeilaufgabe[]
  setTeilaufgaben: (t: InlineTeilaufgabe[]) => void
  teilaufgabenIds?: string[]
  setTeilaufgabenIds?: (ids: string[]) => void
  titelRechts?: React.ReactNode
  parentId?: string
}

function neueTeilaufgabe(typ: string, parentId: string, index: number): InlineTeilaufgabe {
  const buchstabe = String.fromCharCode(97 + index)
  const id = `${parentId}_${buchstabe}`
  const basis: InlineTeilaufgabe = { id, typ, fragetext: '', punkte: 1, bewertungsraster: [{ beschreibung: '', punkte: 1 }] }

  switch (typ) {
    case 'mc': return { ...basis, punkte: 2, optionen: [
      { id: 'a', text: '', korrekt: true }, { id: 'b', text: '', korrekt: false }, { id: 'c', text: '', korrekt: false },
    ], mehrfachauswahl: false }
    case 'richtigfalsch': return { ...basis, aussagen: [
      { id: '1', text: '', korrekt: true }, { id: '2', text: '', korrekt: false },
    ]}
    case 'freitext': return { ...basis, punkte: 3, laenge: 'mittel' as const }
    case 'berechnung': return { ...basis, punkte: 2, ergebnisse: [{ id: '1', label: 'Ergebnis', korrekt: 0, toleranz: 0 }] }
    case 'sortierung': return { ...basis, punkte: 2, elemente: ['', ''], teilpunkte: true }
    case 'code': return { ...basis, punkte: 3, sprache: 'python', starterCode: '' }
    default: return basis
  }
}

export default function AufgabengruppeEditor({
  kontext, setKontext,
  teilaufgaben, setTeilaufgaben,
  teilaufgabenIds,
  titelRechts, parentId = 'ag',
}: Props) {
  const [offenIndex, setOffenIndex] = useState<number | null>(null)
  const [typFilter, setTypFilter] = useState('')
  const istLegacy = (!teilaufgaben || teilaufgaben.length === 0) && teilaufgabenIds && teilaufgabenIds.length > 0

  function handleHinzufuegen(typ: string) {
    const ta = neueTeilaufgabe(typ, parentId, teilaufgaben.length)
    setTeilaufgaben([...teilaufgaben, ta])
    setOffenIndex(teilaufgaben.length)
    setTypFilter('')
  }

  function handleEntfernen(index: number) {
    setTeilaufgaben(teilaufgaben.filter((_, i) => i !== index))
    if (offenIndex === index) setOffenIndex(null)
    else if (offenIndex !== null && offenIndex > index) setOffenIndex(offenIndex - 1)
  }

  function handleUpdate(index: number, updates: Partial<InlineTeilaufgabe>) {
    const neu = [...teilaufgaben]
    neu[index] = { ...neu[index], ...updates }
    setTeilaufgaben(neu)
  }

  function handleVerschieben(index: number, richtung: 'hoch' | 'runter') {
    const ziel = richtung === 'hoch' ? index - 1 : index + 1
    if (ziel < 0 || ziel >= teilaufgaben.length) return
    const neu = [...teilaufgaben]
    ;[neu[index], neu[ziel]] = [neu[ziel], neu[index]]
    neu.forEach((ta, i) => { ta.id = `${parentId}_${String.fromCharCode(97 + i)}` })
    setTeilaufgaben(neu)
    setOffenIndex(ziel)
  }

  // Gefilterte Typen fuer den Hinzufuegen-Dialog
  const filterText = typFilter.toLowerCase()
  const gefilterteTypen = filterText
    ? TEILAUFGABE_TYPEN.filter(t => typLabel(t).toLowerCase().includes(filterText))
    : TEILAUFGABE_TYPEN

  return (
    <>
      {/* Kontext */}
      <Abschnitt titel="Kontext / Ausgangslage *" titelRechts={titelRechts}>
        <textarea
          value={kontext}
          onChange={(e) => setKontext(e.target.value)}
          rows={5}
          placeholder="Gemeinsamer Kontext fuer alle Teilaufgaben (z.B. Fallbeispiel, Geschaeftsfall, Textquelle)..."
          className="input-field resize-y"
        />
      </Abschnitt>

      {istLegacy && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300">
          Diese Aufgabengruppe verwendet das alte ID-Format ({teilaufgabenIds?.length} verknuepfte Fragen).
        </div>
      )}

      {/* Teilaufgaben */}
      <Abschnitt titel={`Teilaufgaben (${teilaufgaben.length})`}>
        {teilaufgaben.length === 0 && !istLegacy && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">Fuegen Sie mindestens eine Teilaufgabe hinzu.</p>
        )}

        <div className="space-y-3">
          {teilaufgaben.map((ta, i) => (
            <div key={ta.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Collapsed Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50"
                onClick={() => setOffenIndex(offenIndex === i ? null : i)}
              >
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 w-6">{String.fromCharCode(97 + i)})</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{typLabel(ta.typ)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 truncate">{ta.fragetext || '(kein Text)'}</span>
                <span className="text-xs text-slate-400">{ta.punkte} P.</span>
                <span className="text-xs text-slate-400">{offenIndex === i ? '\u25B2' : '\u25BC'}</span>
              </div>

              {/* Expanded Content */}
              {offenIndex === i && (
                <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                  <TeilaufgabeInlineEditor
                    ta={ta}
                    onUpdate={(u) => handleUpdate(i, u)}
                  />

                  {/* Verschieben / Loeschen */}
                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => handleVerschieben(i, 'hoch')} disabled={i === 0}
                      className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">{'\u2191'}</button>
                    <button onClick={() => handleVerschieben(i, 'runter')} disabled={i === teilaufgaben.length - 1}
                      className="px-2 py-1 text-xs rounded bg-slate-100 dark:bg-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed">{'\u2193'}</button>
                    <div className="flex-1" />
                    <button onClick={() => handleEntfernen(i)}
                      className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer">
                      Teilaufgabe entfernen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Neue Teilaufgabe */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">+ Teilaufgabe hinzufuegen:</span>
            <input
              type="text"
              value={typFilter}
              onChange={(e) => setTypFilter(e.target.value)}
              placeholder="Typ suchen..."
              className="flex-1 px-2 py-1 text-xs border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {gefilterteTypen.map((typ) => (
              <button key={typ} onClick={() => handleHinzufuegen(typ)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                {typLabel(typ)}
              </button>
            ))}
          </div>
        </div>

        {teilaufgaben.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Gesamtpunkte: <strong>{teilaufgaben.reduce((sum, ta) => sum + (ta.punkte ?? 0), 0)}</strong>
          </p>
        )}
      </Abschnitt>
    </>
  )
}

// ========== Vollstaendiger Inline-Editor pro Teilaufgabe ==========

interface TeilaufgabeInlineEditorProps {
  ta: InlineTeilaufgabe
  onUpdate: (updates: Partial<InlineTeilaufgabe>) => void
}

function TeilaufgabeInlineEditor({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div className="space-y-4">
      {/* Fragetext */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Fragetext *</label>
        <textarea
          value={ta.fragetext}
          onChange={(e) => onUpdate({ fragetext: e.target.value })}
          rows={3}
          placeholder="Fragetext (Markdown unterstuetzt)..."
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-y"
        />
      </div>

      {/* Punkte */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Punkte:</label>
        <input type="number" min={0.5} step={0.5} value={ta.punkte}
          onChange={(e) => onUpdate({ punkte: Number(e.target.value) || 1 })}
          className="w-20 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
      </div>

      {/* Typ-spezifischer Editor */}
      <TypSpezifischerEditor ta={ta} onUpdate={onUpdate} />

      {/* Musterloesung */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Musterloesung</label>
        <textarea
          value={ta.musterlosung ?? ''}
          onChange={(e) => onUpdate({ musterlosung: e.target.value || undefined })}
          rows={2}
          placeholder="Erwartete Loesung..."
          className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-y"
        />
      </div>

      {/* Bewertungsraster */}
      <BewertungsrasterEditor
        bewertungsraster={ta.bewertungsraster ?? [{ beschreibung: '', punkte: 1 }]}
        setBewertungsraster={(r) => onUpdate({ bewertungsraster: r })}
      />
    </div>
  )
}

// ========== Typ-spezifische Editoren (nutzen bestehende Komponenten) ==========

function TypSpezifischerEditor({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  switch (ta.typ) {
    case 'mc':
      return (
        <MCEditor
          optionen={ta.optionen ?? []}
          setOptionen={(o) => onUpdate({ optionen: o as MCOption[] })}
          mehrfachauswahl={ta.mehrfachauswahl ?? false}
          setMehrfachauswahl={(v) => onUpdate({ mehrfachauswahl: v })}
          erklaerungSichtbar={ta.erklaerungSichtbar}
          setErklaerungSichtbar={(v) => onUpdate({ erklaerungSichtbar: v })}
        />
      )

    case 'richtigfalsch':
      return (
        <RichtigFalschEditor
          aussagen={ta.aussagen ?? [{ id: '1', text: '', korrekt: true }, { id: '2', text: '', korrekt: false }]}
          setAussagen={(a) => onUpdate({ aussagen: a })}
          erklaerungSichtbar={ta.erklaerungSichtbar}
          setErklaerungSichtbar={(v) => onUpdate({ erklaerungSichtbar: v })}
        />
      )

    case 'freitext':
      return (
        <FreitextEditor
          laenge={(ta.laenge ?? 'mittel') as 'kurz' | 'mittel' | 'lang'}
          setLaenge={(v) => onUpdate({ laenge: v })}
          placeholder={ta.hilfstextPlaceholder ?? ''}
          setPlaceholder={(v) => onUpdate({ hilfstextPlaceholder: v || undefined })}
          minWoerter={ta.minWoerter}
          setMinWoerter={(v) => onUpdate({ minWoerter: v })}
          maxWoerter={ta.maxWoerter}
          setMaxWoerter={(v) => onUpdate({ maxWoerter: v })}
        />
      )

    case 'zuordnung':
      return <ZuordnungMini ta={ta} onUpdate={onUpdate} />
    case 'berechnung':
      return <BerechnungMini ta={ta} onUpdate={onUpdate} />
    case 'sortierung':
      return <SortierungMini ta={ta} onUpdate={onUpdate} />
    case 'lueckentext':
      return <LueckentextMini ta={ta} onUpdate={onUpdate} />
    case 'code':
      return <CodeMini ta={ta} onUpdate={onUpdate} />
    case 'formel':
      return <FormelMini ta={ta} onUpdate={onUpdate} />
    case 'audio':
      return <AudioMini ta={ta} onUpdate={onUpdate} />
    case 'hotspot':
    case 'bildbeschriftung':
    case 'dragdrop_bild':
      return <BildMini ta={ta} onUpdate={onUpdate} />
    case 'visualisierung':
    case 'pdf':
      return <HinweisMini text={`${typLabel(ta.typ)}-Editor: Fuer komplexe Konfiguration (Bild-Upload, PDF-Upload, Zeichenwerkzeuge) erstellen Sie diese Frage als eigenstaendige Frage und verlinken Sie sie per ID.`} />
    default:
      return <HinweisMini text={`Typ "${typLabel(ta.typ)}": Grundlegende Optionen werden ueber Fragetext und Musterloesung konfiguriert.`} />
  }
}

// ========== Kompakte Mini-Editoren fuer Typen ohne eigene Komponente ==========

function ZuordnungMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  const paare = (ta.paare ?? []) as { links: string; rechts: string }[]
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Zuordnungspaare:</label>
      {paare.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="text" value={p.links} onChange={(e) => { const n = [...paare]; n[i] = { ...n[i], links: e.target.value }; onUpdate({ paare: n }) }}
            placeholder="Links" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          <span className="text-xs text-slate-400">{'\u2192'}</span>
          <input type="text" value={p.rechts} onChange={(e) => { const n = [...paare]; n[i] = { ...n[i], rechts: e.target.value }; onUpdate({ paare: n }) }}
            placeholder="Rechts" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {paare.length > 1 && <button onClick={() => onUpdate({ paare: paare.filter((_, j) => j !== i) })} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">x</button>}
        </div>
      ))}
      <button onClick={() => onUpdate({ paare: [...paare, { links: '', rechts: '' }] })} className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Paar</button>
    </div>
  )
}

function BerechnungMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  const ergebnisse = (ta.ergebnisse ?? []) as { id: string; label: string; korrekt: number; toleranz: number }[]
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Erwartete Ergebnisse:</label>
      {ergebnisse.map((erg, i) => (
        <div key={erg.id} className="flex items-center gap-2">
          <input type="text" value={erg.label} onChange={(e) => { const n = [...ergebnisse]; n[i] = { ...n[i], label: e.target.value }; onUpdate({ ergebnisse: n }) }}
            placeholder="Label" className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          <input type="number" value={erg.korrekt} onChange={(e) => { const n = [...ergebnisse]; n[i] = { ...n[i], korrekt: Number(e.target.value) }; onUpdate({ ergebnisse: n }) }}
            className="w-24 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" placeholder="Korrekt" />
          <input type="number" value={erg.toleranz} onChange={(e) => { const n = [...ergebnisse]; n[i] = { ...n[i], toleranz: Number(e.target.value) }; onUpdate({ ergebnisse: n }) }}
            className="w-16 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" placeholder="+/-" title="Toleranz" />
        </div>
      ))}
      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
        <input type="checkbox" checked={!!ta.rechenwegErforderlich} onChange={(e) => onUpdate({ rechenwegErforderlich: e.target.checked })} className="rounded" />
        Rechenweg erforderlich
      </label>
    </div>
  )
}

function SortierungMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  const elemente = (ta.elemente ?? []) as string[]
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Elemente in korrekter Reihenfolge:</label>
      {elemente.map((el, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4">{i + 1}.</span>
          <input type="text" value={el} onChange={(e) => { const n = [...elemente]; n[i] = e.target.value; onUpdate({ elemente: n }) }}
            className="flex-1 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
          {elemente.length > 2 && <button onClick={() => onUpdate({ elemente: elemente.filter((_, j) => j !== i) })} className="text-red-400 cursor-pointer text-xs">x</button>}
        </div>
      ))}
      <button onClick={() => onUpdate({ elemente: [...elemente, ''] })} className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer">+ Element</button>
    </div>
  )
}

function LueckentextMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Text mit Luecken (geschweifte Klammern um Loesungswort)</label>
      <textarea value={ta.textMitLuecken as string ?? ''} onChange={(e) => onUpdate({ textMitLuecken: e.target.value })}
        rows={3} placeholder="Der [Bundesrat] ist die [Exekutive] der Schweiz."
        className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-y" />
    </div>
  )
}

function CodeMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Sprache:</label>
        <select value={ta.sprache as string ?? 'python'} onChange={(e) => onUpdate({ sprache: e.target.value })}
          className="px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600">
          {['python', 'javascript', 'typescript', 'sql', 'html', 'css', 'java'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Starter-Code (optional):</label>
        <textarea value={ta.starterCode as string ?? ''} onChange={(e) => onUpdate({ starterCode: e.target.value })}
          rows={3} className="w-full mt-1 px-2 py-1.5 text-sm font-mono border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 resize-y" />
      </div>
    </div>
  )
}

function FormelMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Korrekte Formel (LaTeX):</label>
        <input type="text" value={ta.korrekteFormel as string ?? ''} onChange={(e) => onUpdate({ korrekteFormel: e.target.value })}
          placeholder="z.B. a^2 + b^2 = c^2" className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
      </div>
    </div>
  )
}

function AudioMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Max. Dauer (Sek.):</label>
      <input type="number" min={10} max={600} step={10} value={ta.maxDauerSekunden as number ?? ''} placeholder="unbegrenzt"
        onChange={(e) => onUpdate({ maxDauerSekunden: e.target.value ? Number(e.target.value) : undefined })}
        className="w-28 px-2 py-1 text-sm border rounded bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
    </div>
  )
}

function BildMini({ ta, onUpdate }: TeilaufgabeInlineEditorProps) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Bild-URL:</label>
      <input type="text" value={ta.bildUrl as string ?? ''} onChange={(e) => onUpdate({ bildUrl: e.target.value })}
        placeholder="https://..." className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" />
      <p className="text-xs text-slate-400 mt-1">Fuer Bild-Upload: erstellen Sie diese Frage als eigenstaendige Frage mit dem Bild-Upload-Tool.</p>
    </div>
  )
}

function HinweisMini({ text }: { text: string }) {
  return <p className="text-xs text-slate-500 dark:text-slate-400 italic p-2 bg-slate-50 dark:bg-slate-800/40 rounded">{text}</p>
}
