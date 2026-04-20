import { useState, useEffect } from 'react'
import { useFrageAdapter } from '../../hooks/useFrageAdapter.ts'
import type { BilanzERFrage as BilanzERFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachUtils.ts'
import { kontoLabel, findKonto } from '../../utils/kontenrahmen.ts'

interface Props { frage: BilanzERFrageType }

function neueId(): string { return crypto.randomUUID() }

/* ─── Interne Typen ─── */
interface KontoZeile { id: string; nr: string; betrag: string }
interface GruppeEingabe { id: string; label: string; konten: KontoZeile[] }
interface SeiteEingabe { label: string; gruppen: GruppeEingabe[] }
interface BilanzEingabe { linkeSeite: SeiteEingabe; rechteSeite: SeiteEingabe; bilanzsummeLinks: string; bilanzsummeRechts: string }
interface StufeEingabe { id: string; label: string; konten: KontoZeile[]; zwischentotal: string }
interface ERFeldEingabe { stufen: StufeEingabe[]; gewinnVerlust: string }

const leereKZ = (): KontoZeile => ({ id: neueId(), nr: '', betrag: '' })
const leereGruppe = (): GruppeEingabe => ({ id: neueId(), label: '', konten: [leereKZ()] })
const leereSeite = (label: string): SeiteEingabe => ({ label, gruppen: [leereGruppe()] })
const leereBilanz = (): BilanzEingabe => ({ linkeSeite: leereSeite(''), rechteSeite: leereSeite(''), bilanzsummeLinks: '', bilanzsummeRechts: '' })
const leereStufe = (): StufeEingabe => ({ id: neueId(), label: '', konten: [leereKZ()], zwischentotal: '' })
const leereER = (): ERFeldEingabe => ({ stufen: [leereStufe()], gewinnVerlust: '' })

/** Standard-Kontenhauptgruppen KMU (Schweiz) */
const KONTENHAUPTGRUPPEN = [
  'Umlaufvermögen', 'Anlagevermögen',
  'Kurzfristiges Fremdkapital', 'Langfristiges Fremdkapital', 'Eigenkapital',
  'Betrieblicher Ertrag aus Lieferungen und Leistungen', 'Übriger betrieblicher Ertrag',
  'Materialaufwand', 'Personalaufwand', 'Übriger Betriebsaufwand', 'Abschreibungen',
]

// CSS Klassen-Helfer
const inputSm = 'min-h-[36px] rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50'
const numInput = `${inputSm} text-right placeholder:text-slate-400`
const btnRemove = 'min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors'
const btnAdd = 'mt-1 min-h-[36px] flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100 transition-opacity'

/* ─── Konvertierung Store ↔ Eingabe ─── */
function zuAntwort(bilanz: BilanzEingabe | null, er: ERFeldEingabe | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = { typ: 'bilanzstruktur' }
  if (bilanz) {
    const mapS = (s: SeiteEingabe) => ({ label: s.label, gruppen: s.gruppen.map(g => ({ label: g.label, konten: g.konten.map(k => ({ nr: k.nr, betrag: parseFloat(k.betrag) || 0 })) })) })
    res.bilanz = { linkeSeite: mapS(bilanz.linkeSeite), rechteSeite: mapS(bilanz.rechteSeite), bilanzsummeLinks: bilanz.bilanzsummeLinks ? parseFloat(bilanz.bilanzsummeLinks) || undefined : undefined, bilanzsummeRechts: bilanz.bilanzsummeRechts ? parseFloat(bilanz.bilanzsummeRechts) || undefined : undefined }
  }
  if (er) {
    res.erfolgsrechnung = { stufen: er.stufen.map(s => ({ label: s.label, konten: s.konten.map(k => ({ nr: k.nr, betrag: parseFloat(k.betrag) || 0 })), zwischentotal: s.zwischentotal ? parseFloat(s.zwischentotal) || undefined : undefined })), gewinnVerlust: er.gewinnVerlust ? parseFloat(er.gewinnVerlust) || undefined : undefined }
  }
  return res
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Antwort = any

function vonAntwortBilanz(a?: Antwort): BilanzEingabe {
  if (!a?.bilanz) return leereBilanz()
  const mapS = (s: { label: string; gruppen: { label: string; konten: { nr: string; betrag: number }[] }[] }): SeiteEingabe => ({
    label: s.label,
    gruppen: s.gruppen.length > 0 ? s.gruppen.map(g => ({ id: neueId(), label: g.label, konten: g.konten.length > 0 ? g.konten.map(k => ({ id: neueId(), nr: k.nr, betrag: k.betrag ? String(k.betrag) : '' })) : [leereKZ()] })) : [leereGruppe()],
  })
  return { linkeSeite: mapS(a.bilanz.linkeSeite), rechteSeite: mapS(a.bilanz.rechteSeite), bilanzsummeLinks: a.bilanz.bilanzsummeLinks ? String(a.bilanz.bilanzsummeLinks) : '', bilanzsummeRechts: a.bilanz.bilanzsummeRechts ? String(a.bilanz.bilanzsummeRechts) : '' }
}

function vonAntwortER(a?: Antwort): ERFeldEingabe {
  if (!a?.erfolgsrechnung) return leereER()
  return {
    stufen: a.erfolgsrechnung.stufen.length > 0 ? a.erfolgsrechnung.stufen.map((s: { label: string; konten: { nr: string; betrag: number }[]; zwischentotal?: number }) => ({ id: neueId(), label: s.label, konten: s.konten.length > 0 ? s.konten.map((k: { nr: string; betrag: number }) => ({ id: neueId(), nr: k.nr, betrag: k.betrag ? String(k.betrag) : '' })) : [leereKZ()], zwischentotal: s.zwischentotal ? String(s.zwischentotal) : '' })) : [leereStufe()],
    gewinnVerlust: a.erfolgsrechnung.gewinnVerlust ? String(a.erfolgsrechnung.gewinnVerlust) : '',
  }
}

/* ─── Hauptkomponente ─── */
export default function BilanzERFrage({ frage }: Props) {
  const { antwort, onAntwort, speichereZwischenstand, disabled, feedbackSichtbar, korrekt } = useFrageAdapter(frage.id)
  const gespeichert = antwort?.typ === 'bilanzstruktur' ? antwort : undefined
  const zeigeBilanz = frage.modus === 'bilanz' || frage.modus === 'beides'
  const zeigeER = frage.modus === 'erfolgsrechnung' || frage.modus === 'beides'

  // Lokaler State statt Neuberechnung bei jedem Render (verhindert Cursor-Sprung bei Inputs)
  const [bilanz, setBilanzLokal] = useState<BilanzEingabe | null>(() => zeigeBilanz ? vonAntwortBilanz(gespeichert) : null)
  const [er, setERLokal] = useState<ERFeldEingabe | null>(() => zeigeER ? vonAntwortER(gespeichert) : null)

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const g = antwort?.typ === 'bilanzstruktur' ? antwort : undefined
    setBilanzLokal(zeigeBilanz ? vonAntwortBilanz(g) : null)
    setERLokal(zeigeER ? vonAntwortER(g) : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  const speichern = (b: BilanzEingabe | null, e: ERFeldEingabe | null) => {
    setBilanzLokal(b)
    setERLokal(e)
    if (speichereZwischenstand) {
      speichereZwischenstand(zuAntwort(b, e))
    } else {
      onAntwort(zuAntwort(b, e))
    }
  }

  const antwortPruefen = () => {
    onAntwort(zuAntwort(bilanz, er))
  }
  const readOnly = disabled
  const verfuegbar = (frage.kontenMitSaldi ?? []).map(k => k.kontonummer)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>{frage.fachbereich}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{frage.bloom}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Bilanz/ER</span>
      </div>
      <div className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700" dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }} />
      <KontenTabelle konten={frage.kontenMitSaldi} />
      {zeigeBilanz && bilanz && <BilanzUI bilanz={bilanz} onChange={b => speichern(b, er)} readOnly={readOnly} konten={verfuegbar} />}
      {zeigeER && er && <ERUI er={er} onChange={e => speichern(bilanz, e)} readOnly={readOnly} konten={verfuegbar} />}

      {/* Prüfen-Button (nur Üben-Modus, wenn noch nicht beantwortet) */}
      {speichereZwischenstand && !disabled && (
        <button
          type="button"
          onClick={antwortPruefen}
          className="min-h-[48px] self-end px-6 py-2.5 rounded-xl bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800 font-medium text-sm hover:bg-slate-900 dark:hover:bg-slate-100 transition-colors"
        >
          Antwort prüfen
        </button>
      )}

      {/* Feedback (Üben-Modus) */}
      {feedbackSichtbar && korrekt !== null && (
        <div className={`mt-4 p-3 rounded-lg ${korrekt ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {korrekt ? '\u2713 Richtig!' : '\u2717 Leider falsch.'}
          {frage.musterlosung && <p className="mt-1 text-sm">{frage.musterlosung}</p>}
        </div>
      )}
    </div>
  )
}

/* ─── Kategorie-Badge-Farben (Lehrmittel) ─── */
const kategorieBadge: Record<string, string> = {
  aktiv:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  passiv:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  aufwand: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ertrag:  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

const kategorieLabel: Record<string, string> = {
  aktiv: 'Aktiven', passiv: 'Passiven', aufwand: 'Aufwand', ertrag: 'Ertrag',
}

/* ─── Konten-Referenztabelle ─── */
function KontenTabelle({ konten }: { konten: { kontonummer: string; saldo: number }[] }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Verfügbare Konten</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600">
            <th className="text-left px-2 py-1 font-medium">Nr.</th>
            <th className="text-left px-2 py-1 font-medium">Konto</th>
            <th className="text-left px-2 py-1 font-medium">Kontenklasse</th>
            <th className="text-left px-2 py-1 font-medium">Kontenhauptgruppe</th>
            <th className="text-right px-2 py-1 font-medium">Saldo (CHF)</th>
          </tr>
        </thead>
        <tbody>
          {konten.map(k => {
            const konto = findKonto(k.kontonummer)
            return (
              <tr key={k.kontonummer} className="border-b border-slate-100 dark:border-slate-700/50">
                <td className="px-2 py-1 font-mono text-slate-700 dark:text-slate-200">{k.kontonummer}</td>
                <td className="px-2 py-1 text-slate-700 dark:text-slate-200">{konto?.name ?? k.kontonummer}</td>
                <td className="px-2 py-1">
                  {konto && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${kategorieBadge[konto.kategorie] ?? ''}`}>
                      {kategorieLabel[konto.kategorie] ?? konto.kategorie}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">{konto?.gruppe ?? ''}</td>
                <td className="px-2 py-1 text-right font-mono text-slate-700 dark:text-slate-200">{k.saldo.toLocaleString('de-CH', { minimumFractionDigits: 2 })}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Konto-Auswahl-Zeile (wiederverwendbar) ─── */
function KontoRow({ konto, konten, readOnly, onNrChange, onBetragChange, onRemove, canRemove }: {
  konto: KontoZeile; konten: string[]; readOnly: boolean
  onNrChange: (nr: string) => void; onBetragChange: (v: string) => void
  onRemove: () => void; canRemove: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <select value={konto.nr} onChange={e => onNrChange(e.target.value)} disabled={readOnly}
        className={`${inputSm} flex-1 min-w-0 truncate ${!readOnly && !konto.nr ? 'border-violet-400 dark:border-violet-500' : ''}`}>
        <option value="">Konto...</option>
        {konten.map(nr => <option key={nr} value={nr}>{nr} {kontoLabel(nr)}</option>)}
      </select>
      <input type="number" value={konto.betrag} onChange={e => onBetragChange(e.target.value)} disabled={readOnly}
        placeholder="CHF" min="0" step="0.01" className={`${numInput} w-24 ${!readOnly && !konto.betrag ? 'border-violet-400 dark:border-violet-500' : ''}`} />
      {!readOnly && canRemove && (
        <button type="button" onClick={onRemove} className={btnRemove}>×</button>
      )}
    </div>
  )
}

/* ─── Bilanz-Editor (SuS) ─── */
function BilanzUI({ bilanz, onChange, readOnly, konten }: { bilanz: BilanzEingabe; onChange: (b: BilanzEingabe) => void; readOnly: boolean; konten: string[] }) {
  const dc = (): BilanzEingabe => JSON.parse(JSON.stringify(bilanz))

  function updateSeite(seite: 'links' | 'rechts', fn: (s: SeiteEingabe) => void) {
    const k = dc(); fn(seite === 'links' ? k.linkeSeite : k.rechteSeite); onChange(k)
  }

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Bilanz</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BilanzSeiteUI seite={bilanz.linkeSeite} bilanzsumme={bilanz.bilanzsummeLinks} readOnly={readOnly} konten={konten}
          onUpdate={fn => updateSeite('links', fn)} onBsChange={v => { const k = dc(); k.bilanzsummeLinks = v; onChange(k) }} />
        <BilanzSeiteUI seite={bilanz.rechteSeite} bilanzsumme={bilanz.bilanzsummeRechts} readOnly={readOnly} konten={konten}
          onUpdate={fn => updateSeite('rechts', fn)} onBsChange={v => { const k = dc(); k.bilanzsummeRechts = v; onChange(k) }} />
      </div>
    </div>
  )
}

/* ─── Bilanz-Seite ─── */
function BilanzSeiteUI({ seite, bilanzsumme, readOnly, konten, onUpdate, onBsChange }: {
  seite: SeiteEingabe; bilanzsumme: string; readOnly: boolean; konten: string[]
  onUpdate: (fn: (s: SeiteEingabe) => void) => void; onBsChange: (v: string) => void
}) {
  // Farbe erst nach SuS-Auswahl
  const labelWert = seite.label
  const farbe = labelWert === 'Aktiven'
    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10'
    : labelWert === 'Passiven'
      ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
      : labelWert === 'Aufwand'
        ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
        : labelWert === 'Ertrag'
          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'

  return (
    <div className={`rounded-lg border p-3 min-w-0 overflow-hidden ${farbe}`}>
      <select value={seite.label} onChange={e => onUpdate(s => { s.label = e.target.value })} disabled={readOnly}
        className={`${inputSm} w-full font-bold mb-3 ${!readOnly && !seite.label ? 'border-violet-400 dark:border-violet-500' : ''}`}>
        <option value="">-- Seite wählen --</option>
        <option value="Aktiven">Aktiven</option>
        <option value="Passiven">Passiven</option>
        <option value="Aufwand">Aufwand</option>
        <option value="Ertrag">Ertrag</option>
      </select>

      <div className="space-y-3">
        {seite.gruppen.map((gruppe, gi) => (
          <div key={gruppe.id} className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-2">
            <div className="flex items-center gap-1 mb-2">
              <select value={gruppe.label} onChange={e => onUpdate(s => { s.gruppen[gi].label = e.target.value })} disabled={readOnly}
                className={`${inputSm} flex-1 min-w-0 truncate font-medium ${!readOnly && !gruppe.label ? 'border-violet-400 dark:border-violet-500' : ''}`}>
                <option value="">Kontenhauptgruppe...</option>
                {KONTENHAUPTGRUPPEN.map(khg => <option key={khg} value={khg}>{khg}</option>)}
              </select>
              {!readOnly && (
                <>
                  <button type="button" onClick={() => onUpdate(s => { if (gi > 0) [s.gruppen[gi], s.gruppen[gi-1]] = [s.gruppen[gi-1], s.gruppen[gi]] })} disabled={gi === 0}
                    className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => onUpdate(s => { if (gi < s.gruppen.length-1) [s.gruppen[gi], s.gruppen[gi+1]] = [s.gruppen[gi+1], s.gruppen[gi]] })} disabled={gi === seite.gruppen.length - 1}
                    className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">↓</button>
                  {seite.gruppen.length > 1 && (
                    <button type="button" onClick={() => onUpdate(s => { s.gruppen.splice(gi, 1) })} className={btnRemove}>×</button>
                  )}
                </>
              )}
            </div>
            <div className="space-y-1">
              {gruppe.konten.map((konto, ki) => (
                <KontoRow key={konto.id} konto={konto} konten={konten} readOnly={readOnly}
                  onNrChange={nr => onUpdate(s => { s.gruppen[gi].konten[ki].nr = nr })}
                  onBetragChange={v => onUpdate(s => { s.gruppen[gi].konten[ki].betrag = v })}
                  onRemove={() => onUpdate(s => { s.gruppen[gi].konten.splice(ki, 1) })}
                  canRemove={gruppe.konten.length > 1} />
              ))}
            </div>
            {!readOnly && <button type="button" onClick={() => onUpdate(s => { s.gruppen[gi].konten.push(leereKZ()) })} className={btnAdd}>+ Konto</button>}
          </div>
        ))}
      </div>

      {!readOnly && <button type="button" onClick={() => onUpdate(s => { s.gruppen.push(leereGruppe()) })} className={btnAdd}>+ Gruppe</button>}

      {/* D2: Bilanzsumme unter den Betrag-Feldern ausgerichtet */}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-end gap-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Bilanzsumme:</span>
        <input type="number" value={bilanzsumme} onChange={e => onBsChange(e.target.value)} disabled={readOnly}
          placeholder="CHF" min="0" step="0.01" className={`${numInput} w-24 font-bold ${!readOnly && !bilanzsumme ? 'border-violet-400 dark:border-violet-500' : ''}`} />
      </div>
    </div>
  )
}

/* ─── ER-Editor (SuS) ─── */
function ERUI({ er, onChange, readOnly, konten }: { er: ERFeldEingabe; onChange: (e: ERFeldEingabe) => void; readOnly: boolean; konten: string[] }) {
  const dc = (): ERFeldEingabe => JSON.parse(JSON.stringify(er))

  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Erfolgsrechnung</h3>
      <div className="space-y-3">
        {er.stufen.map((stufe, si) => (
          <div key={stufe.id} className="rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 p-3">
            <div className="flex items-center gap-2 mb-2">
              <input type="text" value={stufe.label} onChange={e => { const k = dc(); k.stufen[si].label = e.target.value; onChange(k) }} disabled={readOnly}
                placeholder="Stufe (z.B. Bruttogewinn)" className={`${inputSm} flex-1 font-medium placeholder:text-slate-400`} />
              {!readOnly && er.stufen.length > 1 && (
                <button type="button" onClick={() => { const k = dc(); k.stufen.splice(si, 1); onChange(k) }} className={btnRemove}>×</button>
              )}
            </div>
            <div className="space-y-1">
              {stufe.konten.map((konto, ki) => (
                <KontoRow key={konto.id} konto={konto} konten={konten} readOnly={readOnly}
                  onNrChange={nr => { const k = dc(); k.stufen[si].konten[ki].nr = nr; onChange(k) }}
                  onBetragChange={v => { const k = dc(); k.stufen[si].konten[ki].betrag = v; onChange(k) }}
                  onRemove={() => { const k = dc(); k.stufen[si].konten.splice(ki, 1); onChange(k) }}
                  canRemove={stufe.konten.length > 1} />
              ))}
            </div>
            {!readOnly && <button type="button" onClick={() => { const k = dc(); k.stufen[si].konten.push(leereKZ()); onChange(k) }} className={btnAdd}>+ Konto</button>}
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Zwischentotal:</span>
              <input type="number" value={stufe.zwischentotal} onChange={e => { const k = dc(); k.stufen[si].zwischentotal = e.target.value; onChange(k) }} disabled={readOnly}
                placeholder="CHF" step="0.01" className={`${numInput} w-28`} />
            </div>
          </div>
        ))}
      </div>
      {!readOnly && (
        <button type="button" onClick={() => { const k = dc(); k.stufen.push(leereStufe()); onChange(k) }}
          className="mt-2 min-h-[44px] flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          + Stufe
        </button>
      )}
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Gewinn/Verlust:</span>
        <input type="number" value={er.gewinnVerlust} onChange={e => { const k = dc(); k.gewinnVerlust = e.target.value; onChange(k) }} disabled={readOnly}
          placeholder="CHF" step="0.01" className={`${numInput} w-32 font-bold`} />
      </div>
    </div>
  )
}
