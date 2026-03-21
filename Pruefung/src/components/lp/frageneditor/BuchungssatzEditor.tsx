import type { SollHabenZeile, BuchungsKonto, KontenauswahlConfig } from '../../../types/fragen.ts'
import { Abschnitt } from './EditorBausteine.tsx'
import KontenSelect from '../../shared/KontenSelect.tsx'
import { sucheKonten } from '../../../utils/kontenrahmen.ts'

interface BuchungssatzEditorProps {
  geschaeftsfall: string
  setGeschaeftsfall: (v: string) => void
  buchungen: SollHabenZeile[]
  setBuchungen: (b: SollHabenZeile[]) => void
  kontenauswahl: KontenauswahlConfig
  setKontenauswahl: (k: KontenauswahlConfig) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
}

const MAX_BUCHUNGEN = 20

export default function BuchungssatzEditor({
  geschaeftsfall, setGeschaeftsfall,
  buchungen, setBuchungen,
  kontenauswahl, setKontenauswahl,
  titelRechts,
}: BuchungssatzEditorProps) {

  // --- Buchung CRUD ---

  function addBuchung(): void {
    if (buchungen.length >= MAX_BUCHUNGEN) return
    const nextId = String(Date.now())
    setBuchungen([...buchungen, {
      id: nextId,
      sollKonten: [{ kontonummer: '', betrag: 0 }],
      habenKonten: [{ kontonummer: '', betrag: 0 }],
    }])
  }

  function removeBuchung(index: number): void {
    if (buchungen.length <= 1) return
    setBuchungen(buchungen.filter((_, i) => i !== index))
  }

  function updateBuchung(index: number, partial: Partial<SollHabenZeile>): void {
    const neu = [...buchungen]
    neu[index] = { ...neu[index], ...partial }
    setBuchungen(neu)
  }

  // --- Konto-Zeilen CRUD ---

  function updateKonto(
    buchungIdx: number,
    seite: 'sollKonten' | 'habenKonten',
    kontoIdx: number,
    partial: Partial<BuchungsKonto>,
  ): void {
    const neu = [...buchungen]
    const konten = [...neu[buchungIdx][seite]]
    konten[kontoIdx] = { ...konten[kontoIdx], ...partial }
    neu[buchungIdx] = { ...neu[buchungIdx], [seite]: konten }
    setBuchungen(neu)
  }

  function addKonto(buchungIdx: number, seite: 'sollKonten' | 'habenKonten'): void {
    const neu = [...buchungen]
    const konten = [...neu[buchungIdx][seite], { kontonummer: '', betrag: 0 }]
    neu[buchungIdx] = { ...neu[buchungIdx], [seite]: konten }
    setBuchungen(neu)
  }

  function removeKonto(buchungIdx: number, seite: 'sollKonten' | 'habenKonten', kontoIdx: number): void {
    const neu = [...buchungen]
    const konten = neu[buchungIdx][seite]
    if (konten.length <= 1) return
    neu[buchungIdx] = { ...neu[buchungIdx], [seite]: konten.filter((_, i) => i !== kontoIdx) }
    setBuchungen(neu)
  }

  // --- Kontenauswahl-Modus ---

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

  // Alle verfügbaren Konten (für Eingeschränkt-Auswahl)
  const alleKonten = sucheKonten('')

  return (
    <>
      {/* Geschäftsfall */}
      <Abschnitt titel="Geschäftsfall" titelRechts={titelRechts}>
        <textarea
          value={geschaeftsfall}
          onChange={(e) => setGeschaeftsfall(e.target.value)}
          placeholder="Beschreiben Sie den Geschäftsfall, zu dem die SuS Buchungssätze erstellen sollen..."
          rows={3}
          className="input-field w-full resize-y"
        />
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
      </Abschnitt>

      {/* Musterlösung: Buchungen */}
      <Abschnitt titel="Musterlösung — Buchungen">
        <div className="space-y-4">
          {buchungen.map((buchung, bIdx) => (
            <div
              key={buchung.id}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-3"
            >
              {/* Buchung-Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Buchung {bIdx + 1}
                </span>
                {buchungen.length > 1 && (
                  <button
                    onClick={() => removeBuchung(bIdx)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm cursor-pointer px-1"
                    title="Buchung entfernen"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              {/* Soll-Seite */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Soll
                </label>
                <div className="space-y-1">
                  {buchung.sollKonten.map((konto, kIdx) => (
                    <KontoZeile
                      key={kIdx}
                      konto={konto}
                      config={kontenauswahl}
                      onChangeKonto={(nummer) => updateKonto(bIdx, 'sollKonten', kIdx, { kontonummer: nummer })}
                      onChangeBetrag={(betrag) => updateKonto(bIdx, 'sollKonten', kIdx, { betrag })}
                      onRemove={buchung.sollKonten.length > 1 ? () => removeKonto(bIdx, 'sollKonten', kIdx) : undefined}
                    />
                  ))}
                </div>
                {buchung.sollKonten.length < 5 && (
                  <button
                    onClick={() => addKonto(bIdx, 'sollKonten')}
                    className="mt-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    + Soll-Konto
                  </button>
                )}
              </div>

              {/* Haben-Seite */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Haben
                </label>
                <div className="space-y-1">
                  {buchung.habenKonten.map((konto, kIdx) => (
                    <KontoZeile
                      key={kIdx}
                      konto={konto}
                      config={kontenauswahl}
                      onChangeKonto={(nummer) => updateKonto(bIdx, 'habenKonten', kIdx, { kontonummer: nummer })}
                      onChangeBetrag={(betrag) => updateKonto(bIdx, 'habenKonten', kIdx, { betrag })}
                      onRemove={buchung.habenKonten.length > 1 ? () => removeKonto(bIdx, 'habenKonten', kIdx) : undefined}
                    />
                  ))}
                </div>
                {buchung.habenKonten.length < 5 && (
                  <button
                    onClick={() => addKonto(bIdx, 'habenKonten')}
                    className="mt-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    + Haben-Konto
                  </button>
                )}
              </div>

              {/* Buchungstext */}
              <div>
                <input
                  type="text"
                  value={buchung.buchungstext ?? ''}
                  onChange={(e) => updateBuchung(bIdx, { buchungstext: e.target.value || undefined })}
                  placeholder="Buchungstext (optional)"
                  className="input-field w-full text-sm"
                />
              </div>
            </div>
          ))}
        </div>

        {buchungen.length < MAX_BUCHUNGEN && (
          <button
            onClick={addBuchung}
            className="mt-3 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            + Buchung hinzufügen
          </button>
        )}
      </Abschnitt>
    </>
  )
}

/* ─── Konto-Zeile (Soll/Haben) ─── */

function KontoZeile({
  konto,
  config,
  onChangeKonto,
  onChangeBetrag,
  onRemove,
}: {
  konto: BuchungsKonto
  config: KontenauswahlConfig
  onChangeKonto: (nummer: string) => void
  onChangeBetrag: (betrag: number) => void
  onRemove?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <KontenSelect
          value={konto.kontonummer}
          onChange={onChangeKonto}
          config={config}
          placeholder="Konto wählen..."
        />
      </div>
      <input
        type="number"
        value={konto.betrag || ''}
        onChange={(e) => onChangeBetrag(parseFloat(e.target.value) || 0)}
        placeholder="Betrag"
        className="input-field w-28 text-right font-mono"
        min={0}
        step={0.01}
      />
      {onRemove ? (
        <button
          onClick={onRemove}
          className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
          title="Zeile entfernen"
        >
          x
        </button>
      ) : (
        <span className="w-7 shrink-0" />
      )}
    </div>
  )
}
