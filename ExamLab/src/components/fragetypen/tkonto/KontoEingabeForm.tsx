// ExamLab/src/components/fragetypen/tkonto/KontoEingabeForm.tsx
import KontoSeite from './KontoSeite.tsx'
import type { TKontoFrage as TKontoFrageType } from '../../../types/fragen-storage'
import type { KontoEingabe } from './tkontoUtils'
import { brd } from './tkontoUtils'
import { kontoLabel } from '../../../utils/kontenrahmen.ts'

interface KontoEingabeFormProps {
  konto: KontoEingabe
  def: TKontoFrageType['konten'][0]
  bewertungsoptionen: TKontoFrageType['bewertungsoptionen']
  hatGeschaeftsfaelle: boolean
  kontenauswahl: TKontoFrageType['kontenauswahl']
  readOnly: boolean
  onFeldAendern: (feld: keyof KontoEingabe, wert: string) => void
  onEintragAendern: (seite: 'links' | 'rechts', zeileIdx: number, feld: 'gegenkonto' | 'betrag' | 'gfNr', wert: string) => void
  onZeileHinzufuegen: (seite: 'links' | 'rechts') => void
  onZeileEntfernen: (seite: 'links' | 'rechts', zeileIdx: number) => void
}

export default function KontoEingabeForm({
  konto, def, bewertungsoptionen, hatGeschaeftsfaelle, kontenauswahl, readOnly,
  onFeldAendern, onEintragAendern, onZeileHinzufuegen, onZeileEntfernen,
}: KontoEingabeFormProps) {
  const opts = bewertungsoptionen
  return (
    <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Konto-Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {kontoLabel(def.kontonummer)}
          </span>
          {opts.kontenkategorie && (
            <>
              <select
                value={konto.kontenkategorie}
                onChange={(e) => onFeldAendern('kontenkategorie', e.target.value)}
                disabled={readOnly}
                className={`min-h-[32px] rounded border bg-white px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200 focus:outline-none disabled:opacity-50 ${brd(konto.kontenkategorie, readOnly)}`}
              >
                <option value="">Kategorie...</option>
                <option value="aktiv">Aktiv</option>
                <option value="passiv">Passiv</option>
                <option value="aufwand">Aufwand</option>
                <option value="ertrag">Ertrag</option>
              </select>
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
            </>
          )}
        </div>
      </div>

      {/* T-Form: Single Grid mit 4 Reihen (Kopfzeile, AB, Buchungen, Saldo) × 2 Spalten.
          KEINE row-borders auf Container — KontoSeite emittiert pro Cell die korrekten cell-borders. */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2">
          <KontoSeite
            seite="links"
            konto={konto} def={def}
            bewertungsoptionen={opts} hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={kontenauswahl} readOnly={readOnly}
            onFeldAendern={onFeldAendern}
            onEintragAendern={(zIdx, feld, wert) => onEintragAendern('links', zIdx, feld, wert)}
            onZeileHinzufuegen={() => onZeileHinzufuegen('links')}
            onZeileEntfernen={(zIdx) => onZeileEntfernen('links', zIdx)}
          />
          <KontoSeite
            seite="rechts"
            konto={konto} def={def}
            bewertungsoptionen={opts} hatGeschaeftsfaelle={hatGeschaeftsfaelle}
            kontenauswahl={kontenauswahl} readOnly={readOnly}
            onFeldAendern={onFeldAendern}
            onEintragAendern={(zIdx, feld, wert) => onEintragAendern('rechts', zIdx, feld, wert)}
            onZeileHinzufuegen={() => onZeileHinzufuegen('rechts')}
            onZeileEntfernen={(zIdx) => onZeileEntfernen('rechts', zIdx)}
          />
        </div>
      </div>
    </div>
  )
}
