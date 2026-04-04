import { useState } from 'react'
import type { FrageKomponenteProps } from './index'
import type { TKontoFrage as TKontoFrageTyp } from '../../types/fragen'
import FeedbackBox from './FeedbackBox'
import KontenSelect from './shared/KontenSelect'

interface EintragState {
  gegen: string
  betrag: string
}

interface KontoState {
  soll: EintragState[]
  haben: EintragState[]
  saldoSeite: 'soll' | 'haben' | ''
  saldoBetrag: string
}

export default function TKontoFrage({ frage, onAntwort, disabled, feedbackSichtbar, korrekt }: FrageKomponenteProps) {
  // Type narrowing
  if (frage.typ !== 'tkonto') return null
  const tkFrage = frage as TKontoFrageTyp

  const kontenDef = tkFrage.konten || []
  const geschaeftsfaelle = tkFrage.geschaeftsfaelle || []
  // Gegenkonten aus kontenauswahl extrahieren
  const kontenauswahl = tkFrage.kontenauswahl
  const gegenkonten = (kontenauswahl?.konten || []).map(k => ({ nr: k, name: k }))

  const [kontenState, setKontenState] = useState<Record<string, KontoState>>(() => {
    const init: Record<string, KontoState> = {}
    for (const k of kontenDef) {
      init[k.kontonummer] = {
        soll: [{ gegen: '', betrag: '' }],
        haben: [{ gegen: '', betrag: '' }],
        saldoSeite: '',
        saldoBetrag: '',
      }
    }
    return init
  })

  const updateEintrag = (kontoNr: string, seite: 'soll' | 'haben', index: number, feld: 'gegen' | 'betrag', wert: string) => {
    if (disabled) return
    const neu = { ...kontenState }
    const eintraege = [...neu[kontoNr][seite]]
    eintraege[index] = { ...eintraege[index], [feld]: wert }
    neu[kontoNr] = { ...neu[kontoNr], [seite]: eintraege }
    setKontenState(neu)
  }

  const addEintrag = (kontoNr: string, seite: 'soll' | 'haben') => {
    if (disabled) return
    const neu = { ...kontenState }
    neu[kontoNr] = { ...neu[kontoNr], [seite]: [...neu[kontoNr][seite], { gegen: '', betrag: '' }] }
    setKontenState(neu)
  }

  const updateSaldo = (kontoNr: string, feld: 'saldoSeite' | 'saldoBetrag', wert: string) => {
    if (disabled) return
    const neu = { ...kontenState }
    neu[kontoNr] = { ...neu[kontoNr], [feld]: wert }
    setKontenState(neu)
  }

  const handleAbsenden = () => {
    if (disabled) return
    const konten: Record<string, { soll: { gegen: string; betrag: number }[]; haben: { gegen: string; betrag: number }[]; saldo: { seite: 'soll' | 'haben'; betrag: number } }> = {}
    for (const [nr, state] of Object.entries(kontenState)) {
      konten[nr] = {
        soll: state.soll.filter(e => e.gegen && e.betrag).map(e => ({ gegen: e.gegen, betrag: parseFloat(e.betrag) || 0 })),
        haben: state.haben.filter(e => e.gegen && e.betrag).map(e => ({ gegen: e.gegen, betrag: parseFloat(e.betrag) || 0 })),
        saldo: { seite: (state.saldoSeite || 'soll') as 'soll' | 'haben', betrag: parseFloat(state.saldoBetrag) || 0 },
      }
    }
    onAntwort({ typ: 'tkonto', konten })
  }

  return (
    <div className="space-y-4">
      {/* Geschäftsfälle */}
      {geschaeftsfaelle.length > 0 && (
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          <p className="font-medium mb-1 dark:text-white">Geschaeftsfaelle:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {geschaeftsfaelle.map((gf, i) => <li key={i}>{gf}</li>)}
          </ol>
        </div>
      )}

      {/* T-Konto-Karten */}
      {kontenDef.map((konto) => {
        const state = kontenState[konto.kontonummer]
        if (!state) return null

        return (
          <div key={konto.kontonummer} className="border-2 border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
            {/* Konto-Titel */}
            <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 font-medium text-sm dark:text-white text-center border-b-2 border-gray-300 dark:border-gray-600">
              {konto.kontonummer}
            </div>

            <div className="grid grid-cols-2 divide-x-2 divide-gray-300 dark:divide-gray-600">
              {/* Soll-Seite */}
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Soll</p>
                {konto.anfangsbestand !== undefined && (
                  <div className="flex gap-1 text-xs text-gray-500 dark:text-gray-400 italic px-1">
                    <span className="flex-1">AB</span>
                    <span>{konto.anfangsbestand.toLocaleString('de-CH')}</span>
                  </div>
                )}
                {state.soll.map((e, i) => (
                  <div key={i} className="flex gap-1">
                    <div className="flex-1">
                      <KontenSelect konten={gegenkonten} value={e.gegen} onChange={(v) => updateEintrag(konto.kontonummer, 'soll', i, 'gegen', v)} disabled={disabled} placeholder="Gegenkonto" />
                    </div>
                    <input type="number" value={e.betrag} onChange={(ev) => updateEintrag(konto.kontonummer, 'soll', i, 'betrag', ev.target.value)} disabled={disabled} placeholder="CHF" className="w-20 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-right min-h-[44px]" />
                  </div>
                ))}
                {!disabled && !feedbackSichtbar && (
                  <button onClick={() => addEintrag(konto.kontonummer, 'soll')} className="text-xs text-blue-500">+ Zeile</button>
                )}
              </div>

              {/* Haben-Seite */}
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">Haben</p>
                {state.haben.map((e, i) => (
                  <div key={i} className="flex gap-1">
                    <div className="flex-1">
                      <KontenSelect konten={gegenkonten} value={e.gegen} onChange={(v) => updateEintrag(konto.kontonummer, 'haben', i, 'gegen', v)} disabled={disabled} placeholder="Gegenkonto" />
                    </div>
                    <input type="number" value={e.betrag} onChange={(ev) => updateEintrag(konto.kontonummer, 'haben', i, 'betrag', ev.target.value)} disabled={disabled} placeholder="CHF" className="w-20 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-right min-h-[44px]" />
                  </div>
                ))}
                {!disabled && !feedbackSichtbar && (
                  <button onClick={() => addEintrag(konto.kontonummer, 'haben')} className="text-xs text-blue-500">+ Zeile</button>
                )}
              </div>
            </div>

            {/* Saldo */}
            <div className="border-t-2 border-gray-300 dark:border-gray-600 p-2 flex gap-2 items-center">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Saldo:</span>
              <select value={state.saldoSeite} onChange={(e) => updateSaldo(konto.kontonummer, 'saldoSeite', e.target.value)} disabled={disabled} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs min-h-[44px]">
                <option value="">Seite</option>
                <option value="soll">Soll</option>
                <option value="haben">Haben</option>
              </select>
              <input type="number" value={state.saldoBetrag} onChange={(e) => updateSaldo(konto.kontonummer, 'saldoBetrag', e.target.value)} disabled={disabled} placeholder="CHF" className="w-24 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-xs text-right min-h-[44px]" />
            </div>
          </div>
        )
      })}

      {!disabled && !feedbackSichtbar && (
        <button onClick={handleAbsenden} className="w-full bg-blue-500 text-white rounded-xl py-3 font-medium min-h-[48px]">
          Pruefen
        </button>
      )}

      {feedbackSichtbar && korrekt !== null && <FeedbackBox korrekt={korrekt} erklaerung={tkFrage.musterlosung} />}
    </div>
  )
}
