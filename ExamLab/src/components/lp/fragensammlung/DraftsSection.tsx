// ExamLab/src/components/lp/fragensammlung/DraftsSection.tsx
//
// Bundle 3 Phase D — Drafts-Sektion oberhalb der Fragensammlung in FragenBrowser.
// Zeigt alle Fragen mit `status === 'draft'` als klickbare Items. Klick öffnet
// den Editor für die jeweilige Frage. Eigene vs. geteilte Drafts werden über
// einen kleinen Owner-Hinweis differenziert (Suffix bei `autor !== ownEmail`).
// Sektion ist ein-/ausklappbar (Default: aufgeklappt, persisted in localStorage).

import { useState, type ReactElement } from 'react'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { Frage } from '../../../types/fragen-storage'

const STORAGE_KEY = 'examlab.draftsSection.aufgeklappt'

interface Props {
  /** Bereits gefilterte Drafts (status === 'draft'). */
  drafts: Frage[]
  /** Callback bei Klick auf einen Draft — öffnet Editor mit dieser Frage. */
  onClickDraft: (frage: Frage) => void
  /** Eigene E-Mail für Owner-Differenzierung (eigener vs geteilter Draft). */
  ownEmail: string
  /** Optional: Callback bei Klick auf das Trash-Icon — öffnet LoeschBestaetigungsDialog. */
  onLoeschen?: (frage: Frage) => void
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
 * Sektion ist ein-/ausklappbar (Default: aufgeklappt). State in localStorage.
 * Returnt `null` wenn keine Drafts vorhanden (keine leere Sektion zeigen).
 */
export default function DraftsSection({ drafts, onClickDraft, ownEmail, onLoeschen }: Props): ReactElement | null {
  const [aufgeklappt, setAufgeklappt] = useState<boolean>(() => {
    try {
      const gespeichert = localStorage.getItem(STORAGE_KEY)
      return gespeichert === null ? true : gespeichert === '1'
    } catch {
      return true
    }
  })

  function toggle() {
    setAufgeklappt((vorher) => {
      const neu = !vorher
      try { localStorage.setItem(STORAGE_KEY, neu ? '1' : '0') } catch { /* ignore */ }
      return neu
    })
  }

  if (drafts.length === 0) return null

  return (
    <section
      className="border-b border-slate-200 dark:border-slate-700"
      data-testid="drafts-section"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={aufgeklappt}
        aria-controls="drafts-liste"
        className="sticky top-0 z-10 w-full flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
      >
        {aufgeklappt
          ? <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden />
          : <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden />}
        <span>Entwürfe ({drafts.length})</span>
      </button>
      {aufgeklappt && (
        // max-h cap + internal scroll: verhindert dass viele Drafts den Card-Container
        // überfüllen und die Hauptliste sowie das Page-Scroll blockieren (Bug-Report 15.05.2026).
        <ul id="drafts-liste" className="space-y-1 px-4 py-2 max-h-[40vh] overflow-y-auto">
          {drafts.map((draft) => {
            const titel = draft.thema?.trim() ? draft.thema : 'Ohne Titel'
            const istGeteilt = draft.autor && draft.autor !== ownEmail
            const textSnippet = snippet(('fragetext' in draft ? (draft as { fragetext?: string }).fragetext : ''))
            return (
              <li key={draft.id} className="flex items-stretch gap-1 rounded-md bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <button
                  type="button"
                  onClick={() => onClickDraft(draft)}
                  className="flex-1 min-w-0 text-left px-3 py-2 cursor-pointer"
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
                {onLoeschen && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onLoeschen(draft) }}
                    title="Entwurf löschen"
                    aria-label="Entwurf löschen"
                    className="px-3 flex items-center text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-r-md transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
