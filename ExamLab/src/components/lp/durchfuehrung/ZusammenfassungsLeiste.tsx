import type { SchuelerStatus } from '../../../types/monitoring'

interface Props {
  schueler: SchuelerStatus[]
  gesamtTeilnehmer: number
}

export default function ZusammenfassungsLeiste({ schueler, gesamtTeilnehmer }: Props) {
  const aktiv = schueler.filter((s) => s.status === 'aktiv').length
  const abgegeben = schueler.filter((s) => s.status === 'abgegeben' || s.status === 'beendet-lp').length
  const ausstehend = gesamtTeilnehmer - schueler.filter((s) => s.status !== 'nicht-gestartet').length

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <span className="text-blue-600 dark:text-blue-400">
        {aktiv} aktiv
      </span>
      <span className="text-green-600 dark:text-green-400">
        {abgegeben} abgegeben
      </span>
      {ausstehend > 0 && (
        <span className="text-slate-500 dark:text-slate-400">
          {ausstehend} ausstehend
        </span>
      )}
    </div>
  )
}
