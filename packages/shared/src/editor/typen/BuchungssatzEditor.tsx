import type { BuchungssatzZeile, KontenauswahlConfig } from '../../types/fragen'
import { Abschnitt } from '../components/EditorBausteine'
import KontenSelect from '../components/KontenSelect'
import { sucheKonten } from '../kontenrahmen'

interface BuchungssatzEditorProps {
  geschaeftsfall: string
  setGeschaeftsfall: (v: string) => void
  buchungen: BuchungssatzZeile[]
  setBuchungen: (b: BuchungssatzZeile[]) => void
  kontenauswahl: KontenauswahlConfig
  setKontenauswahl: (k: KontenauswahlConfig) => void
  /** Optionaler Inhalt rechts im Abschnitt-Header (z.B. KI-Buttons) */
  titelRechts?: React.ReactNode
  /** Optionaler Inhalt rechts im Kontenauswahl-Header (z.B. KI-Button) */
  kontenauswahlTitelRechts?: React.ReactNode
}

const MAX_BUCHUNGEN = 20

export default function BuchungssatzEditor({
  geschaeftsfall, setGeschaeftsfall,
  buchungen, setBuchungen,
  kontenauswahl, setKontenauswahl,
  titelRechts,
  kontenauswahlTitelRechts,
}: BuchungssatzEditorProps) {

  // --- Buchung CRUD ---

  function addBuchung(): void {
    if (buchungen.length >= MAX_BUCHUNGEN) return
    const nextId = String(Date.now())
    setBuchungen([...buchungen, {
      id: nextId,
      sollKonto: '',
      habenKonto: '',
      betrag: 0,
    }])
  }

  function removeBuchung(index: number): void {
    if (buchungen.length <= 1) return
    setBuchungen(buchungen.filter((_, i) => i !== index))
  }

  function updateBuchung(index: number, partial: Partial<BuchungssatzZeile>): void {
    const neu = [...buchungen]
    neu[index] = { ...neu[index], ...partial }
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
      <Abschnitt titel="Kontenauswahl" titelRechts={kontenauswahlTitelRechts}>
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

              {/* Soll-Konto */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Soll
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-[2] min-w-0">
                    <KontenSelect
                      value={buchung.sollKonto}
                      onChange={(nummer) => updateBuchung(bIdx, { sollKonto: nummer })}
                      config={kontenauswahl}
                      placeholder="Soll-Konto wählen..."
                    />
                  </div>
                </div>
              </div>

              {/* Haben-Konto */}
              <div className="mb-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Haben
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-[2] min-w-0">
                    <KontenSelect
                      value={buchung.habenKonto}
                      onChange={(nummer) => updateBuchung(bIdx, { habenKonto: nummer })}
                      config={kontenauswahl}
                      placeholder="Haben-Konto wählen..."
                    />
                  </div>
                </div>
              </div>

              {/* Betrag */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Betrag (CHF)
                </label>
                <input
                  type="number"
                  value={buchung.betrag || ''}
                  onChange={(e) => updateBuchung(bIdx, { betrag: parseFloat(e.target.value) || 0 })}
                  placeholder="Betrag (CHF)"
                  className="input-field-narrow w-36 text-right font-mono"
                  min={0}
                  step={0.01}
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
