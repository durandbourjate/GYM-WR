import { Hourglass } from 'lucide-react'

/**
 * TagsTab — Container für die Tag-Verwaltung im Einstellungen-Panel
 * (Cluster H Phase 2 C3).
 *
 * Lädt beim Mount alle Tags via `useTagsStore.ladeAlleTags`. Admins können
 * zusätzlich archivierte Tags einblenden (Zustand wird hochgereicht in die
 * Liste, das Re-Lade-Verhalten dort getriggert).
 *
 * Cluster H Phase 2 Polish P1: triggert auch `fragensammlungStore.ladeSummaries`
 * wenn Summaries noch nicht geladen sind. Sonst zeigt der Tab bei Direkt-Navigation
 * (Bookmark) alle Tags mit „0 Fragen", weil Verwendungs-Anzahl aus Summaries
 * berechnet wird.
 */
import { useEffect, useState } from 'react'
import { useTagsStore } from '../../../../store/tagsStore'
import { useFragensammlungStore } from '../../../../store/fragensammlungStore'
import { useIstAdmin } from '../../../../hooks/useIstAdmin'
import { TagsListe } from './TagsListe'

interface Props {
  email: string
}

export function TagsTab({ email }: Props) {
  const istAdmin = useIstAdmin()
  const ladeAlleTags = useTagsStore((s) => s.ladeAlleTags)
  const ladend = useTagsStore((s) => s.ladend)
  const fehler = useTagsStore((s) => s.fehler)
  const geladen = useTagsStore((s) => s.geladen)
  // P1: Summaries-Status für Verwendungs-Anzeige in TagsListe.
  const fragensammlungStatus = useFragensammlungStore((s) => s.status)
  const ladeSummaries = useFragensammlungStore((s) => s.ladeSummaries)
  const [zeigeArchivierte, setZeigeArchivierte] = useState(false)

  useEffect(() => {
    void ladeAlleTags({ email, inkludiereArchivierte: istAdmin && zeigeArchivierte })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, istAdmin, zeigeArchivierte])

  // P1: Summaries triggern, wenn der Tab direkt aufgerufen wird (Bookmark) und
  // Summaries noch nicht geladen sind. Status-`idle` = noch nie geladen,
  // `fehler` = letzter Versuch fehlgeschlagen → Retry. `summary_laden` würden
  // wir doppelt triggern, aber `ladeSummaries` macht eigene Idempotenz-Guard.
  useEffect(() => {
    if (!email) return
    if (fragensammlungStatus === 'idle' || fragensammlungStatus === 'fehler') {
      void ladeSummaries(email)
    }
  }, [email, fragensammlungStatus, ladeSummaries])

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        Tags
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Verwalte alle Tags der Fragensammlung. Neue Tags entstehen direkt im Frage-Editor;
        hier kannst du sie umbenennen, einfärben{istAdmin ? ', mergen oder archivieren' : ''}.
      </p>

      {ladend && !geladen && (
        <p className="text-sm text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" aria-hidden="true" /> Lade Tags…</p>
      )}
      {fehler && (
        <p className="text-sm text-red-700 dark:text-red-300">Fehler beim Laden: {fehler}</p>
      )}
      {geladen && (
        <TagsListe
          email={email}
          istAdmin={istAdmin}
          zeigeArchivierte={zeigeArchivierte}
          onToggleArchivierte={setZeigeArchivierte}
        />
      )}
    </div>
  )
}
