// ExamLab/src/components/lp/fragenbank/DraftsSection.tsx
//
// Bundle 3 Phase D — Drafts-Sektion oberhalb der Fragensammlung in FragenBrowser.
// Zeigt alle Fragen mit `status === 'draft'` als klickbare Items. Klick öffnet
// den Editor für die jeweilige Frage. Eigene vs. geteilte Drafts werden über
// einen kleinen Owner-Hinweis differenziert (Suffix bei `autor !== ownEmail`).

import type { ReactElement } from 'react'
import type { Frage } from '../../../types/fragen-storage'

interface Props {
  /** Bereits gefilterte Drafts (status === 'draft'). */
  drafts: Frage[]
  /** Callback bei Klick auf einen Draft — öffnet Editor mit dieser Frage. */
  onClickDraft: (frage: Frage) => void
  /** Eigene E-Mail für Owner-Differenzierung (eigener vs geteilter Draft). */
  ownEmail: string
}

/** Schneidet Fragetext-Snippet auf max. ~80 Zeichen + Ellipsis. */
function snippet(text: string | undefined): string {
  if (!text) return ''
  const flach = text.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()
  if (flach.length <= 80) return flach
  return flach.slice(0, 80) + '…'
}

/** Liefert User-Lokal (alles vor `@`) für Owner-Suffix. */
function lokalTeil(email: string): string {
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

/**
 * DraftsSection — listet Drafts mit Klick-Handler und Owner-Hinweis.
 * Returnt `null` wenn keine Drafts vorhanden (keine leere Sektion zeigen).
 */
export default function DraftsSection({ drafts, onClickDraft, ownEmail }: Props): ReactElement | null {
  if (drafts.length === 0) return null

  return (
    <section
      className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700"
      data-testid="drafts-section"
    >
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
        ✏️ Entwürfe ({drafts.length})
      </h3>
      <ul className="space-y-1">
        {drafts.map((draft) => {
          const titel = draft.thema?.trim() ? draft.thema : 'Ohne Titel'
          const istGeteilt = draft.autor && draft.autor !== ownEmail
          const textSnippet = snippet(('fragetext' in draft ? (draft as { fragetext?: string }).fragetext : ''))
          return (
            <li key={draft.id}>
              <button
                type="button"
                onClick={() => onClickDraft(draft)}
                className="w-full text-left px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {titel}
                  </span>
                  {istGeteilt && draft.autor && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      · geteilt von {lokalTeil(draft.autor)}
                    </span>
                  )}
                </div>
                {textSnippet && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {textSnippet}
                  </p>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
