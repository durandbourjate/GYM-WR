import { usePruefungStore } from '../store/pruefungStore.ts'
import { formatUhrzeit } from '../utils/zeit.ts'

export default function VerbindungsStatus() {
  const status = usePruefungStore((s) => s.verbindungsstatus)
  const letzterSave = usePruefungStore((s) => s.letzterSave)

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          status === 'online'
            ? 'bg-green-500'
            : status === 'syncing'
              ? 'bg-blue-500 animate-pulse'
              : 'bg-orange-500'
        }`}
      />
      <span>
        {status === 'online' ? 'Online' : status === 'syncing' ? 'Speichert...' : 'Offline'}
      </span>
      {letzterSave && (
        <span className="text-slate-400 dark:text-slate-500">
          · {formatUhrzeit(letzterSave)}
        </span>
      )}
    </div>
  )
}
