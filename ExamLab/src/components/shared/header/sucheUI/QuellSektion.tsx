import { TrefferZeile } from './TrefferZeile'
import { TYPO } from '../../../../styles/typografie'
import { QUELL_LABEL } from '../../../../types/suche'
import type { SucheTreffer, SucheQuelle } from '../../../../types/suche'

export function QuellSektion({
  quelle,
  treffer,
  gesamtCount,
  activeFlatIndex,
  flatOffset,
  onTrefferKlick,
  onAlleAnzeigen,
}: {
  quelle: SucheQuelle
  treffer: SucheTreffer[]
  gesamtCount: number
  activeFlatIndex: number
  flatOffset: number
  onTrefferKlick: (t: SucheTreffer) => void
  onAlleAnzeigen: (q: SucheQuelle) => void
}) {
  return (
    <section>
      <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <h3 className={`${TYPO.caption} uppercase text-slate-600 dark:text-slate-300`}>
          {QUELL_LABEL[quelle]}
        </h3>
        {gesamtCount > 5 && (
          <span className={`${TYPO.caption} text-slate-500`}>{gesamtCount}</span>
        )}
      </div>
      <ul role="listbox">
        {treffer.map((t, i) => (
          <TrefferZeile
            key={t.id}
            treffer={t}
            aktiv={activeFlatIndex === flatOffset + i}
            onClick={() => onTrefferKlick(t)}
          />
        ))}
      </ul>
      {gesamtCount > 5 && (
        <button
          onClick={() => onAlleAnzeigen(quelle)}
          className={`${TYPO.caption} block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-violet-700 dark:text-violet-300`}
        >
          Alle {gesamtCount} Treffer in {QUELL_LABEL[quelle].toLowerCase()} →
        </button>
      )}
    </section>
  )
}
