import { Circle, Clock, Smartphone, Laptop, AlertTriangle, X, ArrowLeft, Loader2, Check, Play } from 'lucide-react'
import type { PruefungsConfig } from '../../../types/pruefung'
import type { SchuelerStatus } from '../../../types/monitoring'

interface Props {
  config: PruefungsConfig
  schuelerStatus: SchuelerStatus[]
  onFreischalten: () => void
  onZurueck: () => void
  onAkzeptieren: (email: string, name: string) => void
  onEntfernen: (email: string) => void
  freischaltenLaedt?: boolean
}

export default function LobbyPhase({ config, schuelerStatus, onFreischalten, onZurueck, onAkzeptieren, onEntfernen, freischaltenLaedt }: Props) {
  const teilnehmer = config.teilnehmer ?? []
  const teilnehmerEmails = new Set(teilnehmer.map((t) => t.email))

  // Kürzlich = Heartbeat in den letzten 60 Sekunden (nicht nur irgendwann)
  const jetztMs = Date.now()
  const istKuerzlich = (hb: string | null | undefined): boolean => {
    if (!hb) return false
    const diff = jetztMs - new Date(hb).getTime()
    return diff < 60_000 // 60 Sekunden
  }

  // Bereit = kürzlicher Heartbeat und in Teilnehmerliste
  const bereite = schuelerStatus.filter(
    (s) => istKuerzlich(s.letzterHeartbeat as string | null) && teilnehmerEmails.has(s.email),
  )
  // Unerwartete = kürzlicher Heartbeat aber nicht in Teilnehmerliste
  const unerwartete = schuelerStatus.filter(
    (s) => istKuerzlich(s.letzterHeartbeat as string | null) && !teilnehmerEmails.has(s.email),
  )
  // Ausstehend = in Teilnehmerliste aber kein kürzlicher Heartbeat
  const ausstehende = teilnehmer.filter(
    (t) => !schuelerStatus.some((s) => s.email === t.email && istKuerzlich(s.letzterHeartbeat as string | null)),
  )

  const fortschritt = teilnehmer.length > 0
    ? Math.round((bereite.length / teilnehmer.length) * 100)
    : 0

  const handleLinkKopieren = () => {
    const url = `${window.location.origin}${window.location.pathname}?id=${config.id}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-4">
      {/* Fortschrittsbalken */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            Bereit: <strong>{bereite.length}</strong> / {teilnehmer.length}
          </span>
          <span className="text-slate-500 dark:text-slate-400">{fortschritt}%</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${fortschritt}%` }}
          />
        </div>
      </div>

      {/* SuS-Liste */}
      <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
        {/* Bereite SuS */}
        {bereite.map((s) => (
          <div key={s.email} className="flex items-center gap-2 px-3 py-2">
            <Circle className="w-3 h-3 fill-green-500 text-green-500" aria-label="bereit" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{s.name}</span>
            {/* Zeitzuschlag inline */}
            {(config.zeitverlaengerungen?.[s.email] ?? 0) > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-600 dark:bg-blue-700 text-white rounded font-bold inline-flex items-center gap-1" title={`+${config.zeitverlaengerungen![s.email]} Min. Zeitzuschlag`}>
                <Clock className="w-3 h-3" /> +{config.zeitverlaengerungen![s.email]}′
              </span>
            )}
            {/* Gerät-Icon */}
            <span title={s.geraet === 'tablet' ? 'Tablet' : s.geraet === 'laptop' ? 'Laptop' : 'Gerät unbekannt'} className="text-slate-500 dark:text-slate-400">
              {s.geraet === 'tablet' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
            </span>
            {/* Kontrollstufe-Icon (nicht bei formativen Übungen) */}
            {config.typ !== 'formativ' && (
              <>
                {s.kontrollStufe === 'locker' && <Circle className="w-3 h-3 fill-green-500 text-green-500" aria-label="Kontrollstufe: Locker" />}
                {s.kontrollStufe === 'standard' && <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" aria-label="Kontrollstufe: Standard" />}
                {s.kontrollStufe === 'streng' && <Circle className="w-3 h-3 fill-red-500 text-red-500" aria-label="Kontrollstufe: Streng" />}
              </>
            )}
            {/* SEB-Badge (nicht bei formativen Übungen) */}
            {config.typ !== 'formativ' && s.sebVersion && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium" title={`SEB ${s.sebVersion}`}>
                SEB
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">{s.klasse ?? '—'}</span>
            <span className="text-xs text-green-600 dark:text-green-400">bereit</span>
            <button
              type="button"
              onClick={() => onEntfernen(s.email)}
              className="text-xs px-1.5 py-0.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer inline-flex items-center"
              aria-label="Entfernen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Ausstehende SuS */}
        {ausstehende.map((t) => (
          <div key={t.email} className="flex items-center gap-3 px-3 py-2 opacity-60">
            <Circle className="w-3 h-3 text-slate-400" aria-label="ausstehend" />
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.name}, {t.vorname}</span>
            {(config.zeitverlaengerungen?.[t.email] ?? 0) > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-600 dark:bg-blue-700 text-white rounded font-bold inline-flex items-center gap-1" title={`+${config.zeitverlaengerungen![t.email]} Min. Zeitzuschlag`}>
                <Clock className="w-3 h-3" /> +{config.zeitverlaengerungen![t.email]}′
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.klasse}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">ausstehend</span>
            <button
              type="button"
              onClick={() => onEntfernen(t.email)}
              className="text-xs px-1.5 py-0.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer inline-flex items-center"
              aria-label="Entfernen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Unerwartete SuS */}
        {unerwartete.map((s) => (
          <div key={s.email} className="flex items-center gap-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/10">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="unerwartet" />
            <span className="flex-1 text-sm text-amber-800 dark:text-amber-200">{s.name || s.email}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400">unerwartet</span>
            <button
              type="button"
              onClick={() => onAkzeptieren(s.email, s.name)}
              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer"
            >
              Akzeptieren
            </button>
          </div>
        ))}

        {/* Leere Lobby */}
        {bereite.length === 0 && ausstehende.length === 0 && unerwartete.length === 0 && (
          <div className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
            Noch keine Teilnehmer in der Lobby.
          </div>
        )}
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onZurueck}
          className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Vorbereitung
        </button>

        <button
          type="button"
          onClick={onFreischalten}
          disabled={freischaltenLaedt || config.freigeschaltet}
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors inline-flex items-center gap-2 ${
            freischaltenLaedt || config.freigeschaltet
              ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
          }`}
        >
          {freischaltenLaedt ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Wird freigeschaltet...</>
          ) : config.freigeschaltet ? (
            <><Check className="w-4 h-4" /> Freigeschaltet</>
          ) : (
            <><Play className="w-4 h-4" /> Freischalten</>
          )}
        </button>
      </div>

      {/* Prüfungs-Link */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex-1 font-mono truncate">
          {window.location.origin}{window.location.pathname}?id={config.id}
        </span>
        <button
          type="button"
          onClick={handleLinkKopieren}
          className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
        >
          Kopieren
        </button>
      </div>
    </div>
  )
}
