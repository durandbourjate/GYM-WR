import type { TKontoDefinition, TKontoBewertung, KontenauswahlConfig } from '../../types/fragen-core'
import { Abschnitt } from '../components/EditorBausteine'
import KontenSelect from '../components/KontenSelect'
import { sucheKonten } from '../kontenrahmen'

interface TKontoEditorProps {
  aufgabentext: string
  setAufgabentext: (v: string) => void
  geschaeftsfaelle: string[]
  setGeschaeftsfaelle: (v: string[]) => void
  konten: TKontoDefinition[]
  setKonten: (k: TKontoDefinition[]) => void
  kontenauswahl: KontenauswahlConfig
  setKontenauswahl: (k: KontenauswahlConfig) => void
  titelRechts?: React.ReactNode
}

const MAX_KONTEN = 10
const MAX_EINTRAEGE = 20

export default function TKontoEditor({
  aufgabentext, setAufgabentext,
  geschaeftsfaelle, setGeschaeftsfaelle,
  konten, setKonten,
  kontenauswahl, setKontenauswahl,
  titelRechts,
}: TKontoEditorProps) {

  // --- Geschäftsfälle CRUD ---

  function addGeschaeftsfall(): void {
    setGeschaeftsfaelle([...geschaeftsfaelle, ''])
  }

  function removeGeschaeftsfall(idx: number): void {
    setGeschaeftsfaelle(geschaeftsfaelle.filter((_, i) => i !== idx))
  }

  function updateGeschaeftsfall(idx: number, text: string): void {
    const neu = [...geschaeftsfaelle]
    neu[idx] = text
    setGeschaeftsfaelle(neu)
  }

  // --- T-Konto CRUD ---

  function addKonto(): void {
    if (konten.length >= MAX_KONTEN) return
    setKonten([...konten, {
      id: String(Date.now()),
      kontonummer: '',
      anfangsbestandVorgegeben: false,
      eintraege: [],
      saldo: { betrag: 0, seite: 'soll' },
    }])
  }

  function removeKonto(idx: number): void {
    if (konten.length <= 1) return
    setKonten(konten.filter((_, i) => i !== idx))
  }

  function updateKonto(idx: number, partial: Partial<TKontoDefinition>): void {
    const neu = [...konten]
    neu[idx] = { ...neu[idx], ...partial }
    setKonten(neu)
  }

  // --- Einträge CRUD ---

  function addEintrag(kontoIdx: number): void {
    const k = konten[kontoIdx]
    const eintraege = k.eintraege || []
    if (eintraege.length >= MAX_EINTRAEGE) return
    const neu = [...konten]
    neu[kontoIdx] = {
      ...k,
      eintraege: [...eintraege, { seite: 'soll', gegenkonto: '', betrag: 0 }],
    }
    setKonten(neu)
  }

  function removeEintrag(kontoIdx: number, eintragIdx: number): void {
    const neu = [...konten]
    const k = neu[kontoIdx]
    neu[kontoIdx] = {
      ...k,
      eintraege: (k.eintraege || []).filter((_, i) => i !== eintragIdx),
    }
    setKonten(neu)
  }

  function updateEintrag(kontoIdx: number, eintragIdx: number, partial: Partial<TKontoDefinition['eintraege'][0]>): void {
    const neu = [...konten]
    const k = neu[kontoIdx]
    const eintraege = [...(k.eintraege || [])]
    eintraege[eintragIdx] = { ...eintraege[eintragIdx], ...partial }
    neu[kontoIdx] = { ...k, eintraege }
    setKonten(neu)
  }

  // --- Kontenauswahl ---

  function toggleKontenModus(): void {
    if (kontenauswahl.modus === 'voll') {
      setKontenauswahl({ modus: 'eingeschraenkt', konten: [] })
    } else {
      setKontenauswahl({ modus: 'voll' })
    }
  }

  function toggleEingeschraenktesKonto(nummer: string): void {
    const aktuelle = kontenauswahl.konten ?? []
    if (aktuelle.includes(nummer)) {
      setKontenauswahl({ ...kontenauswahl, konten: aktuelle.filter(k => k !== nummer) })
    } else {
      setKontenauswahl({ ...kontenauswahl, konten: [...aktuelle, nummer] })
    }
  }

  const alleKonten = sucheKonten('')

  return (
    <>
      {/* Aufgabentext */}
      <Abschnitt titel="Aufgabentext" titelRechts={titelRechts}>
        <textarea
          value={aufgabentext}
          onChange={(e) => setAufgabentext(e.target.value)}
          placeholder="Beschreiben Sie die Aufgabenstellung für die T-Konten..."
          rows={3}
          className="input-field w-full resize-y"
        />
      </Abschnitt>

      {/* Geschäftsfälle */}
      <Abschnitt titel="Geschäftsfälle (optional)">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Einzelne Geschäftsfälle, die von den SuS verbucht werden sollen.
        </p>
        <div className="space-y-2">
          {geschaeftsfaelle.map((gf, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-2.5 w-5 shrink-0 text-right">
                {idx + 1}.
              </span>
              <textarea
                value={gf}
                onChange={(e) => updateGeschaeftsfall(idx, e.target.value)}
                rows={2}
                placeholder="Geschäftsfall beschreiben..."
                className="input-field flex-1 resize-y text-sm"
              />
              <button
                onClick={() => removeGeschaeftsfall(idx)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm cursor-pointer px-1 mt-2"
                title="Geschäftsfall entfernen"
              >
                x
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addGeschaeftsfall}
          className="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          + Geschäftsfall hinzufügen
        </button>
      </Abschnitt>

      {/* Kontenauswahl */}
      <Abschnitt titel="Kontenauswahl">
        <div className="flex items-center gap-4 mb-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={kontenauswahl.modus === 'voll'}
              onChange={() => toggleKontenModus()}
              className="accent-slate-700 dark:accent-slate-300"
            />
            Alle Konten (Autocomplete)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={kontenauswahl.modus === 'eingeschraenkt'}
              onChange={() => toggleKontenModus()}
              className="accent-slate-700 dark:accent-slate-300"
            />
            Eingeschränkte Auswahl
          </label>
        </div>

        {kontenauswahl.modus === 'eingeschraenkt' && (
          <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Konten auswählen, die den SuS zur Verfügung stehen ({kontenauswahl.konten?.length ?? 0} gewählt):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {alleKonten.map(k => (
                <label
                  key={k.nummer}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer py-0.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-1"
                >
                  <input
                    type="checkbox"
                    checked={kontenauswahl.konten?.includes(k.nummer) ?? false}
                    onChange={() => toggleEingeschraenktesKonto(k.nummer)}
                    className="rounded"
                  />
                  <span className="font-mono text-xs">{k.nummer}</span>
                  <span className="truncate">{k.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Kategoriefarben-Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <input
            type="checkbox"
            checked={kontenauswahl.zeigeKategoriefarben !== false}
            onChange={() => setKontenauswahl({ ...kontenauswahl, zeigeKategoriefarben: kontenauswahl.zeigeKategoriefarben === false ? true : false })}
            className="rounded"
          />
          Konten-Kategoriefarben anzeigen
          <span className="text-xs text-slate-400 dark:text-slate-500">(Aktiv=gelb, Passiv=rot, Aufwand=blau, Ertrag=grün)</span>
        </label>
      </Abschnitt>

      {/* Musterlösung: T-Konten */}
      <Abschnitt titel="Musterlösung — T-Konten">
        <div className="space-y-4">
          {konten.map((konto, kIdx) => (
            <div
              key={konto.id}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-3"
            >
              {/* Konto-Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  T-Konto {kIdx + 1}
                </span>
                {konten.length > 1 && (
                  <button
                    onClick={() => removeKonto(kIdx)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm cursor-pointer px-1"
                    title="T-Konto entfernen"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              {/* Kontonummer */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Kontonummer
                </label>
                <div className="max-w-xs">
                  <KontenSelect
                    value={konto.kontonummer}
                    onChange={(nr) => updateKonto(kIdx, { kontonummer: nr })}
                    config={{ modus: 'voll' }}
                    placeholder="Konto wählen..."
                  />
                </div>
              </div>

              {/* Anfangsbestand */}
              <div className="mb-3 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={konto.anfangsbestand !== undefined}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateKonto(kIdx, { anfangsbestand: 0 })
                      } else {
                        const { anfangsbestand: _, ...rest } = konto
                        updateKonto(kIdx, { ...rest, anfangsbestand: undefined } as Partial<TKontoDefinition>)
                      }
                    }}
                    className="rounded"
                  />
                  Anfangsbestand
                </label>
                {konto.anfangsbestand !== undefined && (
                  <>
                    <input
                      type="number"
                      value={konto.anfangsbestand || ''}
                      onChange={(e) => updateKonto(kIdx, { anfangsbestand: parseFloat(e.target.value) || 0 })}
                      placeholder="Betrag"
                      className="input-field-narrow w-28 text-right font-mono"
                      min={0}
                      step={0.01}
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={konto.anfangsbestandVorgegeben}
                        onChange={(e) => updateKonto(kIdx, { anfangsbestandVorgegeben: e.target.checked })}
                        className="rounded"
                      />
                      Vorgegeben (sichtbar für SuS)
                    </label>
                  </>
                )}
              </div>

              {/* Einträge (Musterlösung) */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Buchungseinträge (Musterlösung)
                </label>
                <div className="space-y-1">
                  {(konto.eintraege || []).map((eintrag, eIdx) => (
                    <div key={eIdx} className="flex items-center gap-2">
                      <select
                        value={eintrag.seite}
                        onChange={(e) => updateEintrag(kIdx, eIdx, { seite: e.target.value as 'soll' | 'haben' })}
                        className="input-field-narrow w-24"
                      >
                        <option value="soll">Soll</option>
                        <option value="haben">Haben</option>
                      </select>
                      <div className="flex-1 min-w-0">
                        <KontenSelect
                          value={eintrag.gegenkonto}
                          onChange={(nr) => updateEintrag(kIdx, eIdx, { gegenkonto: nr })}
                          config={{ modus: 'voll' }}
                          placeholder="Gegenkonto..."
                        />
                      </div>
                      <input
                        type="number"
                        value={eintrag.betrag || ''}
                        onChange={(e) => updateEintrag(kIdx, eIdx, { betrag: parseFloat(e.target.value) || 0 })}
                        placeholder="Betrag"
                        className="input-field-narrow w-28 text-right font-mono"
                        min={0}
                        step={0.01}
                      />
                      <button
                        onClick={() => removeEintrag(kIdx, eIdx)}
                        className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
                        title="Eintrag entfernen"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                {(konto.eintraege || []).length < MAX_EINTRAEGE && (
                  <button
                    onClick={() => addEintrag(kIdx)}
                    className="mt-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    + Eintrag hinzufügen
                  </button>
                )}
              </div>

              {/* Saldo */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Saldo:</label>
                <input
                  type="number"
                  value={konto.saldo.betrag || ''}
                  onChange={(e) => updateKonto(kIdx, { saldo: { ...konto.saldo, betrag: parseFloat(e.target.value) || 0 } })}
                  placeholder="Betrag"
                  className="input-field-narrow w-28 text-right font-mono"
                  min={0}
                  step={0.01}
                />
                <select
                  value={konto.saldo.seite}
                  onChange={(e) => updateKonto(kIdx, { saldo: { ...konto.saldo, seite: e.target.value as 'soll' | 'haben' } })}
                  className="input-field-narrow w-24"
                >
                  <option value="soll">Soll</option>
                  <option value="haben">Haben</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {konten.length < MAX_KONTEN && (
          <button
            onClick={addKonto}
            className="mt-3 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            + T-Konto hinzufügen
          </button>
        )}
      </Abschnitt>
    </>
  )
}

/* ─── T-Konto Bewertungsoptionen (für Einbettung im Bewertungsraster) ─── */

export function TKontoBewertungsoptionen({ bewertungsoptionen, setBewertungsoptionen }: {
  bewertungsoptionen: TKontoBewertung
  setBewertungsoptionen: (b: TKontoBewertung) => void
}) {
  return (
    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
        T-Konto Bewertungsoptionen
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        Welche Aspekte sollen die SuS bearbeiten und bewertet werden?
      </p>
      <div className="space-y-2">
        {([
          ['beschriftungSollHaben', 'Beschriftung Soll/Haben', 'SuS müssen die Seiten korrekt beschriften'],
          ['kontenkategorie', 'Kontenkategorie', 'SuS bestimmen aktiv/passiv/aufwand/ertrag'],
          ['zunahmeAbnahme', 'Zunahme/Abnahme', 'SuS ordnen korrekt zu'],
          ['buchungenKorrekt', 'Buchungen korrekt', 'Gegenkonten + Beträge werden geprüft'],
          ['saldoKorrekt', 'Saldo korrekt', 'Betrag + Seite des Saldos werden geprüft'],
        ] as const).map(([key, label, hinweis]) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={bewertungsoptionen[key]}
              onChange={(e) => setBewertungsoptionen({ ...bewertungsoptionen, [key]: e.target.checked })}
              className="mt-0.5 rounded accent-slate-700 dark:accent-slate-300"
            />
            <div>
              <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                {label}
              </span>
              <p className="text-xs text-slate-400 dark:text-slate-500">{hinweis}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
