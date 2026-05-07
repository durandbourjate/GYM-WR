import type { KontenbestimmungFrage, Kontenaufgabe, KontenauswahlConfig, KontenAntwort } from '../../types/fragen-core'
import { Abschnitt } from '../components/EditorBausteine'
import KontenSelect from '../components/KontenSelect'
import { sucheKonten } from '../kontenrahmen'

interface KontenbestimmungEditorProps {
  aufgabentext: string
  setAufgabentext: (v: string) => void
  modus: KontenbestimmungFrage['modus']
  setModus: (m: KontenbestimmungFrage['modus']) => void
  aufgaben: Kontenaufgabe[]
  setAufgaben: (a: Kontenaufgabe[]) => void
  kontenauswahl: KontenauswahlConfig
  setKontenauswahl: (k: KontenauswahlConfig) => void
  titelRechts?: React.ReactNode
}

const MAX_AUFGABEN = 30

export default function KontenbestimmungEditor({
  aufgabentext, setAufgabentext,
  modus, setModus,
  aufgaben, setAufgaben,
  kontenauswahl, setKontenauswahl,
  titelRechts,
}: KontenbestimmungEditorProps) {

  const zeigeKonto = modus === 'konto_bestimmen' || modus === 'gemischt'
  const zeigeKategorie = modus === 'kategorie_bestimmen' || modus === 'gemischt'
  const zeigeSeite = modus === 'kategorie_bestimmen' || modus === 'gemischt'

  // --- Aufgaben CRUD ---

  function addAufgabe(): void {
    if (aufgaben.length >= MAX_AUFGABEN) return
    setAufgaben([...aufgaben, {
      id: String(Date.now()),
      text: '',
      erwarteteAntworten: [{}],
    }])
  }

  function removeAufgabe(index: number): void {
    if (aufgaben.length <= 1) return
    setAufgaben(aufgaben.filter((_, i) => i !== index))
  }

  function updateAufgabeText(index: number, text: string): void {
    const neu = [...aufgaben]
    neu[index] = { ...neu[index], text }
    setAufgaben(neu)
  }

  function updateAntwort(aufgabeIdx: number, antwortIdx: number, partial: Partial<KontenAntwort>): void {
    const neu = [...aufgaben]
    const antworten = [...(neu[aufgabeIdx].erwarteteAntworten || [])]
    antworten[antwortIdx] = { ...antworten[antwortIdx], ...partial }
    neu[aufgabeIdx] = { ...neu[aufgabeIdx], erwarteteAntworten: antworten }
    setAufgaben(neu)
  }

  function addAntwort(aufgabeIdx: number): void {
    const neu = [...aufgaben]
    const antworten = [...(neu[aufgabeIdx].erwarteteAntworten || []), {}]
    neu[aufgabeIdx] = { ...neu[aufgabeIdx], erwarteteAntworten: antworten }
    setAufgaben(neu)
  }

  function removeAntwort(aufgabeIdx: number, antwortIdx: number): void {
    const neu = [...aufgaben]
    if ((neu[aufgabeIdx].erwarteteAntworten || []).length <= 1) return
    const antworten = (neu[aufgabeIdx].erwarteteAntworten || []).filter((_, i) => i !== antwortIdx)
    neu[aufgabeIdx] = { ...neu[aufgabeIdx], erwarteteAntworten: antworten }
    setAufgaben(neu)
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
          placeholder="Beschreiben Sie die Aufgabenstellung..."
          rows={3}
          className="input-field w-full resize-y"
        />
      </Abschnitt>

      {/* Modus */}
      <Abschnitt titel="Modus">
        <div className="flex items-center gap-4">
          {([
            ['konto_bestimmen', 'Konto bestimmen'],
            ['kategorie_bestimmen', 'Kategorie bestimmen'],
            ['gemischt', 'Gemischt'],
          ] as const).map(([wert, label]) => (
            <label key={wert} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                checked={modus === wert}
                onChange={() => setModus(wert)}
                className="accent-slate-700 dark:accent-slate-300"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          {modus === 'konto_bestimmen' && 'SuS bestimmen nur das Konto (Kontenauswahl).'}
          {modus === 'kategorie_bestimmen' && 'SuS bestimmen Kategorie (aktiv/passiv/aufwand/ertrag) und Buchungsseite (Soll/Haben).'}
          {modus === 'gemischt' && 'SuS bestimmen Konto, Kategorie und Buchungsseite.'}
        </p>
      </Abschnitt>

      {/* Kontenauswahl (nur wenn Konto-Spalte angezeigt) */}
      {zeigeKonto && (
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
              Eingeschraenkte Auswahl
            </label>
          </div>

          {kontenauswahl.modus === 'eingeschraenkt' && (
            <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Konten auswaehlen, die den SuS zur Verfuegung stehen ({kontenauswahl.konten?.length ?? 0} gewaehlt):
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
      )}

      {/* Aufgaben / Musterloesung */}
      <Abschnitt titel="Geschaeftsfaelle & Musterloesung">
        <div className="space-y-4">
          {aufgaben.map((aufgabe, aIdx) => (
            <div
              key={aufgabe.id}
              className="border border-slate-200 dark:border-slate-600 rounded-lg p-3"
            >
              {/* Aufgabe-Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Geschaeftsfall {aIdx + 1}
                </span>
                {aufgaben.length > 1 && (
                  <button
                    onClick={() => removeAufgabe(aIdx)}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm cursor-pointer px-1"
                    title="Aufgabe entfernen"
                  >
                    Entfernen
                  </button>
                )}
              </div>

              {/* Aufgabentext */}
              <input
                type="text"
                value={aufgabe.text}
                onChange={(e) => updateAufgabeText(aIdx, e.target.value)}
                placeholder="Geschaeftsfall beschreiben..."
                className="input-field w-full mb-3"
              />

              {/* Erwartete Antworten */}
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Erwartete Antworten
              </label>
              <div className="space-y-2">
                {(aufgabe.erwarteteAntworten || []).map((antwort, eIdx) => (
                  <div key={eIdx} className="flex items-center gap-2">
                    {zeigeKonto && (
                      <div className="flex-1 min-w-0">
                        <KontenSelect
                          value={antwort.kontonummer ?? ''}
                          onChange={(nr) => updateAntwort(aIdx, eIdx, { kontonummer: nr })}
                          config={kontenauswahl}
                          placeholder="Konto..."
                        />
                      </div>
                    )}
                    {zeigeKategorie && (
                      <select
                        value={antwort.kategorie ?? ''}
                        onChange={(e) => updateAntwort(aIdx, eIdx, { kategorie: e.target.value as KontenAntwort['kategorie'] })}
                        className="input-field-narrow w-28"
                      >
                        <option value="">Kategorie</option>
                        <option value="aktiv">Aktiv</option>
                        <option value="passiv">Passiv</option>
                        <option value="aufwand">Aufwand</option>
                        <option value="ertrag">Ertrag</option>
                      </select>
                    )}
                    {zeigeSeite && (
                      <select
                        value={antwort.seite ?? ''}
                        onChange={(e) => updateAntwort(aIdx, eIdx, { seite: e.target.value as KontenAntwort['seite'] })}
                        className="input-field-narrow w-24"
                      >
                        <option value="">Seite</option>
                        <option value="soll">Soll</option>
                        <option value="haben">Haben</option>
                      </select>
                    )}
                    {(aufgabe.erwarteteAntworten || []).length > 1 && (
                      <button
                        onClick={() => removeAntwort(aIdx, eIdx)}
                        className="w-7 h-7 text-red-400 hover:text-red-600 dark:hover:text-red-300 cursor-pointer text-sm shrink-0"
                        title="Antwort entfernen"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => addAntwort(aIdx)}
                className="mt-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                + Antwort hinzufuegen
              </button>
            </div>
          ))}
        </div>

        {aufgaben.length < MAX_AUFGABEN && (
          <button
            onClick={addAufgabe}
            className="mt-3 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            + Aufgabe hinzufuegen
          </button>
        )}
      </Abschnitt>
    </>
  )
}
