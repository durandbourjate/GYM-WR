import { useState, useEffect } from 'react'
import { usePruefungStore } from '../../store/pruefungStore.ts'
import type { TKontoFrage as TKontoFrageType } from '../../types/fragen.ts'
import { renderMarkdown } from '../../utils/markdown.ts'
import { fachbereichFarbe } from '../../utils/fachbereich.ts'
import { kontoLabel } from '../../utils/kontenrahmen.ts'
import KontenSelect from '../shared/KontenSelect.tsx'

interface Props {
  frage: TKontoFrageType
}

function neueId(): string {
  return crypto.randomUUID()
}

interface EintragZeile {
  id: string
  gegenkonto: string
  betrag: string
  gfNr: string // Geschäftsfall-Nummer
}

interface KontoEingabe {
  id: string
  beschriftungLinks: string
  beschriftungRechts: string
  kontenkategorie: string
  anfangsbestandLinks: string
  anfangsbestandRechts: string
  eintraegeLinks: EintragZeile[]
  eintraegeRechts: EintragZeile[]
  saldoBetrag: string
  saldoSeite: 'links' | 'rechts'
}

function leereZeile(): EintragZeile {
  return { id: neueId(), gegenkonto: '', betrag: '', gfNr: '' }
}

function leereKontoEingabe(id: string): KontoEingabe {
  return {
    id,
    beschriftungLinks: '',
    beschriftungRechts: '',
    kontenkategorie: '',
    anfangsbestandLinks: '',
    anfangsbestandRechts: '',
    eintraegeLinks: [leereZeile()],
    eintraegeRechts: [leereZeile()],
    saldoBetrag: '',
    saldoSeite: 'links',
  }
}

/** Konvertiert die interne Eingabe ins Antwort-Format für den Store */
function zuAntwort(konten: KontoEingabe[]) {
  return {
    typ: 'tkonto' as const,
    konten: konten.map((k) => ({
      id: k.id,
      beschriftungLinks: k.beschriftungLinks || undefined,
      beschriftungRechts: k.beschriftungRechts || undefined,
      kontenkategorie: k.kontenkategorie || undefined,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({
        gegenkonto: e.gegenkonto,
        betrag: parseFloat(e.betrag) || 0,
        gfNr: e.gfNr ? parseInt(e.gfNr) : undefined,
      })),
      saldo: k.saldoBetrag ? {
        betrag: parseFloat(k.saldoBetrag) || 0,
        seite: k.saldoSeite,
      } : undefined,
    })),
  }
}

/** Initialisiert die Konten aus einer bestehenden Antwort */
function vonAntwort(
  antwort: Extract<ReturnType<typeof zuAntwort>, { typ: 'tkonto' }> | undefined,
  frageDefs: TKontoFrageType['konten'],
): KontoEingabe[] {
  return frageDefs.map((def) => {
    const eingabe = antwort?.konten.find((k) => k.id === def.id)
    if (!eingabe) return leereKontoEingabe(def.id)
    return {
      id: def.id,
      beschriftungLinks: eingabe.beschriftungLinks ?? '',
      beschriftungRechts: eingabe.beschriftungRechts ?? '',
      kontenkategorie: eingabe.kontenkategorie ?? '',
      anfangsbestandLinks: '',
      anfangsbestandRechts: '',
      eintraegeLinks: eingabe.eintraegeLinks.length > 0
        ? eingabe.eintraegeLinks.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      eintraegeRechts: eingabe.eintraegeRechts.length > 0
        ? eingabe.eintraegeRechts.map((e) => ({ id: neueId(), gegenkonto: e.gegenkonto, betrag: e.betrag ? String(e.betrag) : '', gfNr: e.gfNr ? String(e.gfNr) : '' }))
        : [leereZeile()],
      saldoBetrag: eingabe.saldo ? String(eingabe.saldo.betrag) : '',
      saldoSeite: eingabe.saldo?.seite ?? 'links',
    }
  })
}

export default function TKontoFrage({ frage }: Props) {
  const antworten = usePruefungStore((s) => s.antworten)
  const setAntwort = usePruefungStore((s) => s.setAntwort)
  const abgegeben = usePruefungStore((s) => s.abgegeben)

  const aktuelleAntwort = antworten[frage.id]
  const gespeicherteAntwort =
    aktuelleAntwort?.typ === 'tkonto' ? aktuelleAntwort : undefined

  // Lokaler State statt Neuberechnung bei jedem Render (verhindert Cursor-Sprung bei Inputs)
  const [konten, setKontenLokal] = useState<KontoEingabe[]>(() =>
    vonAntwort(gespeicherteAntwort as ReturnType<typeof zuAntwort> | undefined, frage.konten)
  )

  // Bei Fragenwechsel: State neu initialisieren
  useEffect(() => {
    const a = antworten[frage.id]
    const gespeichert = a?.typ === 'tkonto' ? a : undefined
    setKontenLokal(vonAntwort(gespeichert as ReturnType<typeof zuAntwort> | undefined, frage.konten))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frage.id])

  function aktualisiere(neueKonten: KontoEingabe[]) {
    setKontenLokal(neueKonten)
    setAntwort(frage.id, zuAntwort(neueKonten))
  }

  function deepCopy(): KontoEingabe[] {
    return konten.map((k) => ({
      ...k,
      eintraegeLinks: k.eintraegeLinks.map((e) => ({ ...e })),
      eintraegeRechts: k.eintraegeRechts.map((e) => ({ ...e })),
    }))
  }

  function eintragAendern(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen[zeileIdx] = { ...zeilen[zeileIdx], [feld]: wert }
    aktualisiere(kopie)
  }

  function zeileHinzufuegen(kontoIdx: number, seite: 'links' | 'rechts') {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    zeilen.push(leereZeile())
    aktualisiere(kopie)
  }

  function zeileEntfernen(kontoIdx: number, seite: 'links' | 'rechts', zeileIdx: number) {
    const kopie = deepCopy()
    const zeilen = seite === 'links' ? kopie[kontoIdx].eintraegeLinks : kopie[kontoIdx].eintraegeRechts
    if (zeilen.length <= 1) return
    zeilen.splice(zeileIdx, 1)
    aktualisiere(kopie)
  }

  function feldAendern(kontoIdx: number, feld: keyof KontoEingabe, wert: string) {
    const kopie = deepCopy()
    const k = kopie[kontoIdx]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(k as any)[feld] = wert
    aktualisiere(kopie)
  }

  const readOnly = abgegeben
  const opts = frage.bewertungsoptionen
  const hatGeschaeftsfaelle = frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${fachbereichFarbe(frage.fachbereich)}`}>
          {frage.fachbereich}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {frage.bloom}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {frage.punkte} {frage.punkte === 1 ? 'Punkt' : 'Punkte'}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          T-Konto
        </span>
      </div>

      {/* Aufgabentext (sticky) */}
      <div
        className="text-base leading-relaxed text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 sticky top-14 z-10"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(frage.aufgabentext) }}
      />

      {/* Geschäftsfälle */}
      {frage.geschaeftsfaelle && frage.geschaeftsfaelle.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Geschäftsfälle</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {frage.geschaeftsfaelle.map((gf, i) => (
              <li key={i}>{gf}</li>
            ))}
          </ol>
        </div>
      )}

      {/* T-Konten */}
      <div className="flex flex-col gap-6">
        {konten.map((konto, kIdx) => {
          const def = frage.konten[kIdx]
          return (
            <div key={konto.id} className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              {/* Konto-Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {kontoLabel(def.kontonummer)}
                </span>
              </div>

              {/* Kontenkategorie */}
              {opts.kontenkategorie && (
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Kontenkategorie</label>
                    {konto.kontenkategorie && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        konto.kontenkategorie === 'aktiv' ? 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700' :
                        konto.kontenkategorie === 'passiv' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/15 dark:text-red-300 dark:border-red-800' :
                        konto.kontenkategorie === 'aufwand' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/15 dark:text-blue-300 dark:border-blue-800' :
                        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/15 dark:text-green-300 dark:border-green-800'
                      }`}>
                        {konto.kontenkategorie.charAt(0).toUpperCase() + konto.kontenkategorie.slice(1)}
                      </span>
                    )}
                  </div>
                  <select
                    value={konto.kontenkategorie}
                    onChange={(e) => feldAendern(kIdx, 'kontenkategorie', e.target.value)}
                    disabled={readOnly}
                    className="mt-1 min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- wählen --</option>
                    <option value="aktiv">Aktiv</option>
                    <option value="passiv">Passiv</option>
                    <option value="aufwand">Aufwand</option>
                    <option value="ertrag">Ertrag</option>
                  </select>
                </div>
              )}

              {/* T-Form */}
              <div className="px-4 py-3">
                {/* Kopfzeile Soll / Haben */}
                <div className="grid grid-cols-2 border-b-2 border-slate-800 dark:border-slate-300">
                  <div className="pb-1 pr-2 border-r border-slate-800 dark:border-slate-300">
                    {opts.beschriftungSollHaben ? (
                      <select
                        value={konto.beschriftungLinks}
                        onChange={(e) => feldAendern(kIdx, 'beschriftungLinks', e.target.value)}
                        disabled={readOnly}
                        className="text-xs font-bold uppercase tracking-wider bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 disabled:opacity-50"
                      >
                        <option value="">-- Seite --</option>
                        <option value="Soll">Soll</option>
                        <option value="Haben">Haben</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Soll</span>
                    )}
                  </div>
                  <div className="pb-1 pl-2">
                    {opts.beschriftungSollHaben ? (
                      <select
                        value={konto.beschriftungRechts}
                        onChange={(e) => feldAendern(kIdx, 'beschriftungRechts', e.target.value)}
                        disabled={readOnly}
                        className="text-xs font-bold uppercase tracking-wider bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-200 disabled:opacity-50"
                      >
                        <option value="">-- Seite --</option>
                        <option value="Soll">Soll</option>
                        <option value="Haben">Haben</option>
                      </select>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Haben</span>
                    )}
                  </div>
                </div>

                {/* Anfangsbestand */}
                {def.anfangsbestand !== undefined && (
                  <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="py-1.5 pr-2 border-r border-slate-800 dark:border-slate-300">
                      {def.anfangsbestandVorgegeben ? (
                        <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 px-1">
                          <span className="text-xs italic">AB</span>
                          <span className="font-mono">{def.anfangsbestand.toLocaleString('de-CH')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">AB</span>
                          <input
                            type="number"
                            value={konto.anfangsbestandLinks}
                            onChange={(e) => feldAendern(kIdx, 'anfangsbestandLinks', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="min-h-[36px] flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                          />
                        </div>
                      )}
                    </div>
                    <div className="py-1.5 pl-2">
                      {!def.anfangsbestandVorgegeben && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs italic text-slate-400 dark:text-slate-500">AB</span>
                          <input
                            type="number"
                            value={konto.anfangsbestandRechts}
                            onChange={(e) => feldAendern(kIdx, 'anfangsbestandRechts', e.target.value)}
                            disabled={readOnly}
                            placeholder="0"
                            className="min-h-[36px] flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Buchungszeilen */}
                <div className="grid grid-cols-2">
                  {/* Linke Seite */}
                  <div className="pr-2 border-r border-slate-800 dark:border-slate-300 py-2 space-y-1.5">
                    {konto.eintraegeLinks.map((z, zIdx) => (
                      <div key={z.id} className="flex items-center gap-1">
                        {hatGeschaeftsfaelle && (
                          <input
                            type="number"
                            value={z.gfNr}
                            onChange={(e) => eintragAendern(kIdx, 'links', zIdx, 'gfNr', e.target.value)}
                            disabled={readOnly}
                            placeholder="#"
                            min="1"
                            className="min-h-[36px] w-10 rounded border border-slate-300 bg-white px-1 py-1 text-xs text-center text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                            title="Geschäftsfall-Nr."
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <KontenSelect
                            value={z.gegenkonto}
                            onChange={(nr) => eintragAendern(kIdx, 'links', zIdx, 'gegenkonto', nr)}
                            config={frage.kontenauswahl}
                            placeholder="Gegenkonto"
                            disabled={readOnly}
                          />
                        </div>
                        <input
                          type="number"
                          value={z.betrag}
                          onChange={(e) => eintragAendern(kIdx, 'links', zIdx, 'betrag', e.target.value)}
                          disabled={readOnly}
                          placeholder="CHF"
                          min="0"
                          step="0.01"
                          className="min-h-[36px] w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                        />
                        {!readOnly && konto.eintraegeLinks.length > 1 && (
                          <button type="button" onClick={() => zeileEntfernen(kIdx, 'links', zIdx)}
                            className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" title="Entfernen">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <button type="button" onClick={() => zeileHinzufuegen(kIdx, 'links')}
                        className="mt-1 min-h-[36px] flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        + Zeile
                      </button>
                    )}
                  </div>

                  {/* Rechte Seite */}
                  <div className="pl-2 py-2 space-y-1.5">
                    {konto.eintraegeRechts.map((z, zIdx) => (
                      <div key={z.id} className="flex items-center gap-1">
                        {hatGeschaeftsfaelle && (
                          <input
                            type="number"
                            value={z.gfNr}
                            onChange={(e) => eintragAendern(kIdx, 'rechts', zIdx, 'gfNr', e.target.value)}
                            disabled={readOnly}
                            placeholder="#"
                            min="1"
                            className="min-h-[36px] w-10 rounded border border-slate-300 bg-white px-1 py-1 text-xs text-center text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                            title="Geschäftsfall-Nr."
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <KontenSelect
                            value={z.gegenkonto}
                            onChange={(nr) => eintragAendern(kIdx, 'rechts', zIdx, 'gegenkonto', nr)}
                            config={frage.kontenauswahl}
                            placeholder="Gegenkonto"
                            disabled={readOnly}
                          />
                        </div>
                        <input
                          type="number"
                          value={z.betrag}
                          onChange={(e) => eintragAendern(kIdx, 'rechts', zIdx, 'betrag', e.target.value)}
                          disabled={readOnly}
                          placeholder="CHF"
                          min="0"
                          step="0.01"
                          className="min-h-[36px] w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                        />
                        {!readOnly && konto.eintraegeRechts.length > 1 && (
                          <button type="button" onClick={() => zeileEntfernen(kIdx, 'rechts', zIdx)}
                            className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" title="Entfernen">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {!readOnly && (
                      <button type="button" onClick={() => zeileHinzufuegen(kIdx, 'rechts')}
                        className="mt-1 min-h-[36px] flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        + Zeile
                      </button>
                    )}
                  </div>
                </div>

                {/* Saldo */}
                <div className="grid grid-cols-2 border-t-2 border-slate-800 dark:border-slate-300 pt-2 mt-1">
                  <div className="pr-2 border-r border-slate-800 dark:border-slate-300">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo</span>
                  </div>
                  <div className="pl-2" />
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <input
                    type="number"
                    value={konto.saldoBetrag}
                    onChange={(e) => feldAendern(kIdx, 'saldoBetrag', e.target.value)}
                    disabled={readOnly}
                    placeholder="Betrag"
                    min="0"
                    step="0.01"
                    className="min-h-[36px] w-28 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-right text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 placeholder:text-slate-400"
                  />
                  <select
                    value={konto.saldoSeite}
                    onChange={(e) => feldAendern(kIdx, 'saldoSeite', e.target.value)}
                    disabled={readOnly}
                    className="min-h-[36px] rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="links">Links (Soll)</option>
                    <option value="rechts">Rechts (Haben)</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
