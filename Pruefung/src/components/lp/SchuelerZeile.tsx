import type { SchuelerStatus } from '../../types/monitoring.ts'

interface Props {
  schueler: SchuelerStatus
  aufgeklappt: boolean
  onToggle: () => void
}

export default function SchuelerZeile({ schueler, aufgeklappt, onToggle }: Props) {
  const fortschrittProzent = schueler.gesamtFragen > 0
    ? Math.round((schueler.beantworteteFragen / schueler.gesamtFragen) * 100)
    : 0

  const hatProbleme = schueler.unterbrechungen.length > 0 || schueler.netzwerkFehler > 2

  return (
    <div className={`border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${hatProbleme ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}>
      {/* Hauptzeile */}
      <button
        onClick={onToggle}
        className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] gap-2 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left items-center"
      >
        {/* Name */}
        <div className="flex items-center gap-2">
          <StatusPunkt status={schueler.status} />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {schueler.name}
          </span>
          {hatProbleme && (
            <span className="text-amber-500 text-xs" title="Hat Unterbrechungen oder Netzwerkfehler">⚠</span>
          )}
          {!schueler.sebVersion && schueler.status !== 'nicht-gestartet' && (
            <span className="text-xs px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded" title="Kein SEB erkannt">
              kein SEB
            </span>
          )}
        </div>

        {/* Status (Desktop) */}
        <div className="hidden md:block">
          <StatusBadge status={schueler.status} />
        </div>

        {/* Fortschritt (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                fortschrittProzent === 100
                  ? 'bg-green-500'
                  : fortschrittProzent > 50
                    ? 'bg-slate-600 dark:bg-slate-300'
                    : 'bg-slate-400 dark:bg-slate-500'
              }`}
              style={{ width: `${fortschrittProzent}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums min-w-[3rem]">
            {schueler.beantworteteFragen}/{schueler.gesamtFragen}
          </span>
        </div>

        {/* Letzter Save (Desktop) */}
        <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
          {schueler.letzterSave ? zeitFormatiert(schueler.letzterSave) : '—'}
        </div>

        {/* Heartbeat (Desktop) */}
        <div className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
          {schueler.letzterHeartbeat ? zeitFormatiert(schueler.letzterHeartbeat) : '—'}
        </div>

        {/* Mobile: Status + Fortschritt kompakt */}
        <div className="md:hidden flex items-center gap-2">
          <StatusBadge status={schueler.status} />
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {schueler.beantworteteFragen}/{schueler.gesamtFragen}
          </span>
        </div>

        {/* Detail-Toggle */}
        <div className="hidden md:flex justify-center">
          <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform ${aufgeklappt ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Detail-Panel (aufgeklappt) */}
      {aufgeklappt && (
        <div className="px-4 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <DetailWert label="E-Mail" wert={schueler.email || '—'} />
            <DetailWert label="Startzeit" wert={schueler.startzeit ? new Date(schueler.startzeit).toLocaleTimeString('de-CH') : '—'} />
            <DetailWert label="Abgabezeit" wert={schueler.abgabezeit ? new Date(schueler.abgabezeit).toLocaleTimeString('de-CH') : '—'} />
            <DetailWert label="Browser" wert={schueler.browserInfo || '—'} />
            <DetailWert label="Heartbeats" wert={String(schueler.heartbeats)} />
            <DetailWert label="Auto-Saves" wert={String(schueler.autoSaveCount)} />
            <DetailWert label="Netzwerkfehler" wert={String(schueler.netzwerkFehler)} hervorheben={schueler.netzwerkFehler > 2} />
            <DetailWert label="SEB-Version" wert={schueler.sebVersion || 'Kein SEB'} hervorheben={!schueler.sebVersion && schueler.status !== 'nicht-gestartet'} />
          </div>

          {/* Unterbrechungen */}
          {schueler.unterbrechungen.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                Unterbrechungen ({schueler.unterbrechungen.length})
              </h4>
              <div className="space-y-1">
                {schueler.unterbrechungen.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      u.typ === 'focus-verloren' ? 'bg-amber-400' :
                      u.typ === 'heartbeat-ausfall' ? 'bg-red-400' :
                      'bg-orange-400'
                    }`} />
                    <span className="tabular-nums">{new Date(u.zeitpunkt).toLocaleTimeString('de-CH')}</span>
                    <span>
                      {u.typ === 'focus-verloren' && `Fokus verloren (${u.dauer_sekunden}s)`}
                      {u.typ === 'heartbeat-ausfall' && 'Heartbeat-Ausfall'}
                      {u.typ === 'seb-warnung' && 'SEB-Warnung'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Farbiger Status-Punkt */
function StatusPunkt({ status }: { status: SchuelerStatus['status'] }) {
  const klassen: Record<string, string> = {
    'aktiv': 'bg-green-500 animate-pulse',
    'inaktiv': 'bg-amber-500',
    'abgegeben': 'bg-slate-400 dark:bg-slate-500',
    'nicht-gestartet': 'bg-gray-300 dark:bg-gray-600',
  }

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${klassen[status] || 'bg-gray-300'}`}
      title={status}
    />
  )
}

/** Status-Badge mit Text */
function StatusBadge({ status }: { status: SchuelerStatus['status'] }) {
  const config: Record<string, { label: string; klasse: string }> = {
    'aktiv': {
      label: 'Aktiv',
      klasse: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    },
    'inaktiv': {
      label: 'Inaktiv',
      klasse: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    },
    'abgegeben': {
      label: 'Abgegeben',
      klasse: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    },
    'nicht-gestartet': {
      label: 'Nicht gestartet',
      klasse: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
    },
  }

  const c = config[status] || config['nicht-gestartet']

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${c.klasse}`}>
      {c.label}
    </span>
  )
}

/** Detail-Wert im aufgeklappten Panel */
function DetailWert({ label, wert, hervorheben }: { label: string; wert: string; hervorheben?: boolean }) {
  return (
    <div>
      <span className="block text-slate-400 dark:text-slate-500 mb-0.5">{label}</span>
      <span className={`block font-medium ${
        hervorheben
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-slate-700 dark:text-slate-200'
      } break-all`}>
        {wert}
      </span>
    </div>
  )
}

/** Formatiert einen ISO-Timestamp relativ (z.B. "vor 5s", "10:34:12") */
function zeitFormatiert(isoString: string): string {
  const jetzt = Date.now()
  const zeit = new Date(isoString).getTime()
  const diffSekunden = Math.round((jetzt - zeit) / 1000)

  if (diffSekunden < 10) return 'gerade eben'
  if (diffSekunden < 60) return `vor ${diffSekunden}s`
  if (diffSekunden < 3600) return `vor ${Math.round(diffSekunden / 60)} Min.`

  return new Date(isoString).toLocaleTimeString('de-CH')
}
