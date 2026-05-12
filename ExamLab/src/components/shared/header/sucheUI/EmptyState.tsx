import { Search } from 'lucide-react'
import { TYPO } from '../../../../styles/typografie'

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-4 py-6 text-center">
      <Search
        className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2"
        aria-hidden="true"
      />
      <p className={TYPO.body}>Nichts gefunden für „{query}"</p>
      <p className={`${TYPO.caption} text-slate-500`}>Versuche andere Begriffe.</p>
    </div>
  )
}
