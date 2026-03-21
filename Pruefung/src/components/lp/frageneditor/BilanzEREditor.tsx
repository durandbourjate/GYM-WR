import type { BilanzERFrage, KontoMitSaldo, BilanzERLoesung, BilanzERBewertung, BilanzStruktur, BilanzGruppe, ERStruktur, ERStufe } from '../../../types/fragen.ts'
import { Abschnitt } from './EditorBausteine.tsx'
import KontenSelect from '../../shared/KontenSelect.tsx'
import { kontoLabel } from '../../../utils/kontenrahmen.ts'

interface BilanzEREditorProps {
  aufgabentext: string
  setAufgabentext: (v: string) => void
  modus: BilanzERFrage['modus']
  setModus: (m: BilanzERFrage['modus']) => void
  kontenMitSaldi: KontoMitSaldo[]
  setKontenMitSaldi: (k: KontoMitSaldo[]) => void
  loesung: BilanzERLoesung
  setLoesung: (l: BilanzERLoesung) => void
  titelRechts?: React.ReactNode
}

export default function BilanzEREditor({
  aufgabentext, setAufgabentext,
  modus, setModus,
  kontenMitSaldi, setKontenMitSaldi,
  loesung, setLoesung,
  titelRechts,
}: BilanzEREditorProps) {

  const zeigeBilanz = modus === 'bilanz' || modus === 'beides'
  const zeigeER = modus === 'erfolgsrechnung' || modus === 'beides'
  // Verfügbare Konten-Nummern für Auswahl in der Musterlösung
  const verfuegbareKonten = kontenMitSaldi.map(k => k.kontonummer)

  return (
    <div className="space-y-4">
      {/* Aufgabentext */}
      <Abschnitt titel="Aufgabentext" titelRechts={titelRechts}>
        <textarea
          value={aufgabentext}
          onChange={(e) => setAufgabentext(e.target.value)}
          placeholder="Erstellen Sie anhand der folgenden Kontensaldi eine Bilanz..."
          rows={3}
          className="input-field w-full"
        />
      </Abschnitt>

      {/* Modus */}
      <Abschnitt titel="Modus">
        <div className="flex gap-4">
          {(['bilanz', 'erfolgsrechnung', 'beides'] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="bilanzERModus"
                checked={modus === m}
                onChange={() => setModus(m)}
                className="accent-slate-700 dark:accent-slate-300"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {m === 'bilanz' ? 'Nur Bilanz' : m === 'erfolgsrechnung' ? 'Nur ER' : 'Beides'}
              </span>
            </label>
          ))}
        </div>
      </Abschnitt>

      {/* Konten mit Saldi */}
      <Abschnitt titel="Konten mit Saldi" titelRechts={
        <button
          type="button"
          onClick={() => setKontenMitSaldi([...kontenMitSaldi, { kontonummer: '', saldo: 0 }])}
          className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
        >
          + Konto
        </button>
      }>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Diese Konten werden den SuS als Ausgangsdaten angezeigt.
        </p>
        <div className="space-y-1.5">
          {kontenMitSaldi.map((konto, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <KontenSelect
                  value={konto.kontonummer}
                  onChange={(nr) => {
                    const neu = [...kontenMitSaldi]
                    neu[idx] = { ...neu[idx], kontonummer: nr }
                    setKontenMitSaldi(neu)
                  }}
                  config={{ modus: 'voll' }}
                  placeholder="Konto wählen..."
                />
              </div>
              <input
                type="number"
                value={konto.saldo || ''}
                onChange={(e) => {
                  const neu = [...kontenMitSaldi]
                  neu[idx] = { ...neu[idx], saldo: parseFloat(e.target.value) || 0 }
                  setKontenMitSaldi(neu)
                }}
                placeholder="Saldo"
                min="0"
                step="0.01"
                className="min-h-[44px] w-32 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
              />
              {kontenMitSaldi.length > 1 && (
                <button
                  type="button"
                  onClick={() => setKontenMitSaldi(kontenMitSaldi.filter((_, i) => i !== idx))}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                  title="Konto entfernen"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </Abschnitt>

      {/* Musterlösung */}
      <Abschnitt titel="Musterlösung" einklappbar standardOffen={true}>
        {zeigeBilanz && (
          <BilanzMusterloesung
            bilanz={loesung.bilanz}
            onBilanzChange={(b) => setLoesung({ ...loesung, bilanz: b })}
            verfuegbareKonten={verfuegbareKonten}
          />
        )}
        {zeigeER && (
          <ERMusterloesung
            er={loesung.erfolgsrechnung}
            onERChange={(e) => setLoesung({ ...loesung, erfolgsrechnung: e })}
            verfuegbareKonten={verfuegbareKonten}
          />
        )}
      </Abschnitt>
    </div>
  )
}

/* ─── Bilanz/ER Bewertungsoptionen (für Einbettung im Bewertungsraster) ─── */

function CheckboxOption({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-slate-700 dark:accent-slate-300"
      />
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
    </label>
  )
}

export function BilanzERBewertungsoptionen({ bewertungsoptionen, setBewertungsoptionen, modus }: {
  bewertungsoptionen: BilanzERBewertung
  setBewertungsoptionen: (b: BilanzERBewertung) => void
  modus: BilanzERFrage['modus']
}) {
  return (
    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        Bilanz/ER Bewertungsoptionen
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <CheckboxOption label="Seitenbeschriftung (Aktiven/Passiven korrekt)" checked={bewertungsoptionen.seitenbeschriftung}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, seitenbeschriftung: v })} />
        <CheckboxOption label="Gruppenbildung (UV, AV, kf. FK, lf. FK, EK)" checked={bewertungsoptionen.gruppenbildung}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, gruppenbildung: v })} />
        <CheckboxOption label="Gruppenreihenfolge" checked={bewertungsoptionen.gruppenreihenfolge}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, gruppenreihenfolge: v })} />
        <CheckboxOption label="Kontenreihenfolge innerhalb Gruppen" checked={bewertungsoptionen.kontenreihenfolge}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, kontenreihenfolge: v })} />
        <CheckboxOption label="Beträge korrekt" checked={bewertungsoptionen.betraegeKorrekt}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, betraegeKorrekt: v })} />
        <CheckboxOption label="Zwischentotale" checked={bewertungsoptionen.zwischentotale}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, zwischentotale: v })} />
        <CheckboxOption label="Bilanzsumme / Gewinn/Verlust" checked={bewertungsoptionen.bilanzsummeOderGewinn}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, bilanzsummeOderGewinn: v })} />
        <CheckboxOption
          label="Mehrstufigkeit (nur ER)"
          checked={bewertungsoptionen.mehrstufigkeit}
          onChange={(v) => setBewertungsoptionen({ ...bewertungsoptionen, mehrstufigkeit: v })}
          disabled={modus === 'bilanz'}
        />
      </div>
    </div>
  )
}

/* ─── Bilanz-Musterlösung ─── */

function leereBilanzStruktur(): BilanzStruktur {
  return {
    aktivSeite: { label: 'Aktiven', gruppen: [{ label: 'Umlaufvermögen', konten: [] }] },
    passivSeite: { label: 'Passiven', gruppen: [{ label: 'Kurzfristiges Fremdkapital', konten: [] }] },
    bilanzsumme: 0,
  }
}

function BilanzMusterloesung({ bilanz, onBilanzChange, verfuegbareKonten }: {
  bilanz?: BilanzStruktur
  onBilanzChange: (b: BilanzStruktur) => void
  verfuegbareKonten: string[]
}) {
  const b = bilanz ?? leereBilanzStruktur()

  function updateSeite(seite: 'aktiv' | 'passiv', gruppen: BilanzGruppe[]) {
    if (seite === 'aktiv') onBilanzChange({ ...b, aktivSeite: { ...b.aktivSeite, gruppen } })
    else onBilanzChange({ ...b, passivSeite: { ...b.passivSeite, gruppen } })
  }

  return (
    <div className="space-y-3 mb-4">
      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bilanz-Musterlösung</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Aktiven — dezent blau hinterlegt */}
        <GruppenEditor
          label="Aktiven"
          gruppen={b.aktivSeite.gruppen}
          onChange={(g) => updateSeite('aktiv', g)}
          verfuegbareKonten={verfuegbareKonten}
          bgClass="bg-blue-50/40 dark:bg-blue-900/10"
        />
        {/* Passiven — dezent grau hinterlegt */}
        <GruppenEditor
          label="Passiven"
          gruppen={b.passivSeite.gruppen}
          onChange={(g) => updateSeite('passiv', g)}
          verfuegbareKonten={verfuegbareKonten}
          bgClass="bg-slate-50/60 dark:bg-slate-700/15"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bilanzsumme:</span>
        <input
          type="number"
          value={b.bilanzsumme || ''}
          onChange={(e) => onBilanzChange({ ...b, bilanzsumme: parseFloat(e.target.value) || 0 })}
          placeholder="CHF"
          min="0"
          step="0.01"
          className="min-h-[36px] w-32 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  )
}

/* ─── Gruppen-Editor (für Bilanz-Musterlösung) ─── */

function GruppenEditor({ label, gruppen, onChange, verfuegbareKonten, bgClass }: {
  label: string
  gruppen: BilanzGruppe[]
  onChange: (g: BilanzGruppe[]) => void
  verfuegbareKonten: string[]
  bgClass?: string
}) {
  function addGruppe() {
    onChange([...gruppen, { label: '', konten: [] }])
  }

  function removeGruppe(idx: number) {
    if (gruppen.length <= 1) return
    onChange(gruppen.filter((_, i) => i !== idx))
  }

  function updateGruppeLabel(idx: number, l: string) {
    const neu = [...gruppen]
    neu[idx] = { ...neu[idx], label: l }
    onChange(neu)
  }

  function addKonto(gruppeIdx: number) {
    const neu = [...gruppen]
    neu[gruppeIdx] = { ...neu[gruppeIdx], konten: [...neu[gruppeIdx].konten, ''] }
    onChange(neu)
  }

  function removeKonto(gruppeIdx: number, kontoIdx: number) {
    const neu = [...gruppen]
    neu[gruppeIdx] = { ...neu[gruppeIdx], konten: neu[gruppeIdx].konten.filter((_, i) => i !== kontoIdx) }
    onChange(neu)
  }

  function updateKonto(gruppeIdx: number, kontoIdx: number, nr: string) {
    const neu = [...gruppen]
    const konten = [...neu[gruppeIdx].konten]
    konten[kontoIdx] = nr
    neu[gruppeIdx] = { ...neu[gruppeIdx], konten }
    onChange(neu)
  }

  return (
    <div className={`rounded-lg border border-slate-200 dark:border-slate-600 p-2 ${bgClass ?? ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
        <button type="button" onClick={addGruppe}
          className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">
          + Gruppe
        </button>
      </div>

      <div className="space-y-2">
        {gruppen.map((gruppe, gi) => (
          <div key={gi} className="bg-white/60 dark:bg-slate-700/30 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <input
                type="text"
                value={gruppe.label}
                onChange={(e) => updateGruppeLabel(gi, e.target.value)}
                placeholder="Gruppenname"
                className="min-h-[32px] flex-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
              />
              {gruppen.length > 1 && (
                <button type="button" onClick={() => removeGruppe(gi)}
                  className="min-h-[32px] min-w-[24px] text-slate-400 hover:text-red-500 transition-colors text-xs" title="Gruppe entfernen">
                  ×
                </button>
              )}
            </div>

            {/* Konten in der Gruppe */}
            <div className="space-y-0.5 ml-2">
              {gruppe.konten.map((nr, ki) => (
                <div key={ki} className="flex items-center gap-1">
                  <select
                    value={nr}
                    onChange={(e) => updateKonto(gi, ki, e.target.value)}
                    className="min-h-[32px] flex-1 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="">Konto...</option>
                    {verfuegbareKonten.map(n => (
                      <option key={n} value={n}>{n} {kontoLabel(n)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeKonto(gi, ki)}
                    className="min-h-[32px] min-w-[20px] text-slate-400 hover:text-red-500 text-xs" title="Entfernen">
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addKonto(gi)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
                + Konto
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── ER-Musterlösung ─── */

function leereERStruktur(): ERStruktur {
  return { stufen: [{ label: 'Bruttogewinn', aufwandKonten: [], ertragKonten: [], zwischentotal: 0 }] }
}

function ERMusterloesung({ er, onERChange, verfuegbareKonten }: {
  er?: ERStruktur
  onERChange: (e: ERStruktur) => void
  verfuegbareKonten: string[]
}) {
  const s = er ?? leereERStruktur()

  function addStufe() {
    onERChange({ stufen: [...s.stufen, { label: '', aufwandKonten: [], ertragKonten: [], zwischentotal: 0 }] })
  }

  function removeStufe(idx: number) {
    if (s.stufen.length <= 1) return
    onERChange({ stufen: s.stufen.filter((_, i) => i !== idx) })
  }

  function updateStufe(idx: number, updates: Partial<ERStufe>) {
    const neu = [...s.stufen]
    neu[idx] = { ...neu[idx], ...updates }
    onERChange({ stufen: neu })
  }

  function addKontoZuStufe(stufeIdx: number, seite: 'aufwand' | 'ertrag') {
    const neu = [...s.stufen]
    const key = seite === 'aufwand' ? 'aufwandKonten' : 'ertragKonten'
    neu[stufeIdx] = { ...neu[stufeIdx], [key]: [...neu[stufeIdx][key], ''] }
    onERChange({ stufen: neu })
  }

  function removeKontoVonStufe(stufeIdx: number, seite: 'aufwand' | 'ertrag', kontoIdx: number) {
    const neu = [...s.stufen]
    const key = seite === 'aufwand' ? 'aufwandKonten' : 'ertragKonten'
    neu[stufeIdx] = { ...neu[stufeIdx], [key]: neu[stufeIdx][key].filter((_, i) => i !== kontoIdx) }
    onERChange({ stufen: neu })
  }

  function updateKontoInStufe(stufeIdx: number, seite: 'aufwand' | 'ertrag', kontoIdx: number, nr: string) {
    const neu = [...s.stufen]
    const key = seite === 'aufwand' ? 'aufwandKonten' : 'ertragKonten'
    const konten = [...neu[stufeIdx][key]]
    konten[kontoIdx] = nr
    neu[stufeIdx] = { ...neu[stufeIdx], [key]: konten }
    onERChange({ stufen: neu })
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">ER-Musterlösung</h4>

      {s.stufen.map((stufe, si) => (
        <div key={si} className="rounded-lg border border-slate-200 dark:border-slate-600 p-2">
          <div className="flex items-center gap-1 mb-2">
            <input
              type="text"
              value={stufe.label}
              onChange={(e) => updateStufe(si, { label: e.target.value })}
              placeholder="Stufenbezeichnung (z.B. Bruttogewinn)"
              className="min-h-[32px] flex-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
            />
            <input
              type="number"
              value={stufe.zwischentotal || ''}
              onChange={(e) => updateStufe(si, { zwischentotal: parseFloat(e.target.value) || 0 })}
              placeholder="Total"
              className="min-h-[32px] w-24 rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none placeholder:text-slate-400"
            />
            {s.stufen.length > 1 && (
              <button type="button" onClick={() => removeStufe(si)}
                className="min-h-[32px] min-w-[24px] text-slate-400 hover:text-red-500 text-xs" title="Stufe entfernen">
                ×
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Aufwand */}
            <div className="bg-red-50/50 dark:bg-red-900/10 rounded p-1.5">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">Aufwand</span>
              <div className="space-y-0.5 mt-1">
                {stufe.aufwandKonten.map((nr, ki) => (
                  <div key={ki} className="flex items-center gap-1">
                    <select value={nr} onChange={(e) => updateKontoInStufe(si, 'aufwand', ki, e.target.value)}
                      className="min-h-[28px] flex-1 rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px] text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none">
                      <option value="">Konto...</option>
                      {verfuegbareKonten.map(n => <option key={n} value={n}>{n} {kontoLabel(n)}</option>)}
                    </select>
                    <button type="button" onClick={() => removeKontoVonStufe(si, 'aufwand', ki)}
                      className="text-slate-400 hover:text-red-500 text-xs">×</button>
                  </div>
                ))}
                <button type="button" onClick={() => addKontoZuStufe(si, 'aufwand')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">+ Konto</button>
              </div>
            </div>

            {/* Ertrag */}
            <div className="bg-green-50/50 dark:bg-green-900/10 rounded p-1.5">
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">Ertrag</span>
              <div className="space-y-0.5 mt-1">
                {stufe.ertragKonten.map((nr, ki) => (
                  <div key={ki} className="flex items-center gap-1">
                    <select value={nr} onChange={(e) => updateKontoInStufe(si, 'ertrag', ki, e.target.value)}
                      className="min-h-[28px] flex-1 rounded border border-slate-300 bg-white px-1 py-0.5 text-[11px] text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-slate-400 focus:outline-none">
                      <option value="">Konto...</option>
                      {verfuegbareKonten.map(n => <option key={n} value={n}>{n} {kontoLabel(n)}</option>)}
                    </select>
                    <button type="button" onClick={() => removeKontoVonStufe(si, 'ertrag', ki)}
                      className="text-slate-400 hover:text-red-500 text-xs">×</button>
                  </div>
                ))}
                <button type="button" onClick={() => addKontoZuStufe(si, 'ertrag')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">+ Konto</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addStufe}
        className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer">
        + Stufe
      </button>
    </div>
  )
}
