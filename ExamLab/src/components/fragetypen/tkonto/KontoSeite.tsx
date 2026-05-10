// ExamLab/src/components/fragetypen/tkonto/KontoSeite.tsx
import KontenSelect from '../../shared/KontenSelect.tsx'
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { KontoEingabe } from './tkontoUtils'
import { brd } from './tkontoUtils'

interface KontoSeiteProps {
  seite: 'links' | 'rechts'
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: () => void
  onZeileEntfernen: (zeileIdx: number) => void
}

export default function KontoSeite({
  seite, konto, def, bewertungsoptionen, hatGeschaeftsfaelle,
  kontenauswahl, readOnly,
  onFeldAendern, onEintragAendern, onZeileHinzufuegen, onZeileEntfernen,
}: KontoSeiteProps) {
  const opts = bewertungsoptionen
  const istLinks = seite === 'links'

  // Felder pro Seite auswählen
  const zunahmeAbnahme = istLinks ? konto.zunahmeAbnahmeLinks : konto.zunahmeAbnahmeRechts
  const zunahmeAbnahmeFeld: keyof KontoEingabe = istLinks ? 'zunahmeAbnahmeLinks' : 'zunahmeAbnahmeRechts'
  const anfangsbestand = istLinks ? konto.anfangsbestandLinks : konto.anfangsbestandRechts
  const anfangsbestandFeld: keyof KontoEingabe = istLinks ? 'anfangsbestandLinks' : 'anfangsbestandRechts'
  const eintraege = istLinks ? konto.eintraegeLinks : konto.eintraegeRechts
  const saldo = istLinks ? konto.saldoLinks : konto.saldoRechts
  const saldoFeld: keyof KontoEingabe = istLinks ? 'saldoLinks' : 'saldoRechts'
  const defaultBeschriftung = istLinks ? 'Soll' : 'Haben'

  // Cell-Borders: ersetzen die heutigen Row-Container-Borders aus 4 separaten Grids in TKontoFrage.tsx Z. 292/357/397/512
  // Heute: Kopfzeile-Grid hat `border-b-2 border-slate-800` → migriert auf cell-bottom-border
  //        AB-Grid hat `border-b border-slate-200` → migriert auf cell-bottom-border
  //        Buchungen-Grid: keine row-border
  //        Saldo-Grid hat `border-t-2 border-slate-800 mt-1 pt-2` → migriert auf cell-top-border
  const seitenBorderRight = istLinks ? 'border-r border-slate-800 dark:border-slate-300' : ''
  const padX = istLinks ? 'pr-2' : 'pl-2'

  return (
    <>
      {/* Kopfzeile: Beschriftung + Z/A — bottom-border 2px (war border-b-2 auf Grid-Container).
          Ticket 3: Soll/Haben-Beschriftung ist immer fix (links=Soll, rechts=Haben).
          opts.beschriftungSollHaben wird ignoriert (Field bleibt im Schema, Backwards-Compat). */}
      <div className={`pb-1.5 ${padX} ${seitenBorderRight} border-b-2 border-b-slate-800 dark:border-b-slate-300`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{defaultBeschriftung}</span>
          {opts.zunahmeAbnahme && (
            <select
              value={zunahmeAbnahme}
              onChange={(e) => onFeldAendern(zunahmeAbnahmeFeld, e.target.value)}
              disabled={readOnly}
              className={`min-h-[28px] text-xs rounded border bg-white px-1 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300 focus:outline-none disabled:opacity-50 ${brd(zunahmeAbnahme, readOnly)}`}
            >
              <option value="">+/−</option>
              <option value="+Zunahme">(+) Zunahme</option>
              <option value="-Abnahme">(−) Abnahme</option>
            </select>
          )}
        </div>
      </div>

      {/* Anfangsbestand-Zelle — bottom-border 1px slate-200 (war border-b auf Grid-Container) */}
      {def.anfangsbestand !== undefined && (
        <div className={`py-1.5 ${padX} ${seitenBorderRight} border-b border-b-slate-200 dark:border-b-slate-700`}>
          {istLinks && def.anfangsbestandVorgegeben ? (
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300 px-1">
              <span className="text-xs italic">AB</span>
              <span className="font-mono">{def.anfangsbestand.toLocaleString('de-CH')}</span>
            </div>
          ) : (!istLinks && def.anfangsbestandVorgegeben) ? null : (
            <div className="flex items-center gap-1">
              <span className="text-xs italic text-slate-400 dark:text-slate-500">AB</span>
              <input
                type="number"
                value={anfangsbestand}
                onChange={(e) => onFeldAendern(anfangsbestandFeld, e.target.value)}
                disabled={readOnly}
                placeholder="0"
                className={`min-h-[36px] flex-1 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(anfangsbestand, readOnly)}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Buchungszeilen-Map — keine row-border (war Grid-Container ohne border) */}
      <div className={`${padX} ${seitenBorderRight} py-2 space-y-1.5`}>
        {eintraege.map((z, zIdx) => (
          <div key={z.id} className="flex items-center gap-1">
            {hatGeschaeftsfaelle && (
              <input
                type="number"
                value={z.gfNr}
                onChange={(e) => onEintragAendern(zIdx, 'gfNr', e.target.value)}
                disabled={readOnly}
                placeholder="#"
                min="1"
                className={`min-h-[36px] w-10 rounded border bg-white px-1 py-1 text-xs text-center text-slate-700 dark:bg-slate-700 dark:text-slate-200 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(z.gfNr, readOnly)}`}
                title="Geschäftsfall-Nr."
              />
            )}
            <div className="flex-1 min-w-0">
              <KontenSelect
                value={z.gegenkonto}
                onChange={(nr) => onEintragAendern(zIdx, 'gegenkonto', nr)}
                config={kontenauswahl}
                placeholder="Gegenkonto"
                disabled={readOnly}
                zeigeKategoriefarben={false}
              />
            </div>
            <input
              type="number"
              value={z.betrag}
              onChange={(e) => onEintragAendern(zIdx, 'betrag', e.target.value)}
              disabled={readOnly}
              placeholder="CHF"
              min="0"
              step="0.01"
              className={`min-h-[36px] w-24 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(z.betrag, readOnly)}`}
            />
            {!readOnly && eintraege.length > 1 && (
              <button type="button" onClick={() => onZeileEntfernen(zIdx)}
                className="min-h-[36px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors" title="Entfernen">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button type="button" onClick={onZeileHinzufuegen}
            className="mt-1 min-h-[36px] flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Zeile
          </button>
        )}
      </div>

      {/* Saldo-Zelle — top-border 2px slate-800 + mt-1 pt-2 (war border-t-2 auf Grid-Container) */}
      <div className={`${padX} ${seitenBorderRight} border-t-2 border-t-slate-800 dark:border-t-slate-300 mt-1 pt-2`}>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo</span>
          <input
            type="number"
            value={saldo}
            onChange={(e) => onFeldAendern(saldoFeld, e.target.value)}
            disabled={readOnly}
            placeholder="CHF"
            min="0"
            step="0.01"
            className={`min-h-[36px] w-24 rounded border bg-white px-2 py-1 text-sm text-right text-slate-900 dark:bg-slate-700 dark:text-slate-100 focus:outline-none disabled:opacity-50 placeholder:text-slate-400 ${brd(saldo, readOnly)}`}
          />
        </div>
      </div>
    </>
  )
}
