import { highlight } from '../../../../utils/highlight'
import { TYPO } from '../../../../styles/typografie'
import { ICON_MAP } from '../../../../types/suche'
import type { SucheTreffer } from '../../../../types/suche'

export function TrefferZeile({
  treffer,
  aktiv,
  onClick,
}: {
  treffer: SucheTreffer
  aktiv: boolean
  onClick: () => void
}) {
  const IconComp = ICON_MAP[treffer.iconKey ?? 'default']
  return (
    <li
      onClick={onClick}
      role="option"
      aria-selected={aktiv}
      className={`px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer flex items-center gap-3 ${
        aktiv ? 'bg-violet-100 dark:bg-violet-900/40 ring-1 ring-violet-300' : ''
      }`}
    >
      <IconComp className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className={`${TYPO.body} truncate`}>
          {highlight(treffer.titel, treffer.highlightStellen, 'titel')}
        </div>
        {treffer.subTitel && (
          <div className={`${TYPO.caption} truncate text-slate-500`}>
            {highlight(treffer.subTitel, treffer.highlightStellen, 'subTitel')}
          </div>
        )}
      </div>
    </li>
  )
}
