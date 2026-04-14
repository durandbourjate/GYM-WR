import { useState, useCallback } from 'react'
import type { SchuelerStatus, PruefungsNachricht } from '../../../types/monitoring.ts'
import type { Antwort } from '../../../types/antworten.ts'
import type { Frage } from '../../../types/fragen.ts'
import { apiService } from '../../../services/apiService.ts'
import BeendenDialog from './BeendenDialog.tsx'

interface Props {
  schueler: SchuelerStatus
  aufgeklappt: boolean
  onToggle: () => void
  zeitverlaengerung?: number // Zusätzliche Minuten (Nachteilsausgleich)
  antworten?: Record<string, Antwort> // Antworten des Schülers (frageId → Antwort)
  fragen?: Frage[] // Fragen der Prüfung (für Metadaten)
  pruefungId?: string // Prüfungs-ID für Nachrichten
  lpEmail?: string // E-Mail der LP für Nachrichten
  nachrichten?: PruefungsNachricht[] // Bereits geladene Nachrichten für diesen Schüler
  onNachrichtGesendet?: () => void // Callback nach erfolgreichem Senden
}

export default function SchuelerZeile({ schueler, aufgeklappt, onToggle, zeitverlaengerung, antworten, fragen, pruefungId, lpEmail, nachrichten, onNachrichtGesendet }: Props) {
  const [zeigBeendenDialog, setZeigBeendenDialog] = useState(false)

  // Fortschritt: Bei abgegebenen SuS ohne gesamtFragen (Backend-Lücke) als abgeschlossen zeigen
  const istAbgegeben = schueler.status === 'abgegeben'
  const fortschrittProzent = schueler.gesamtFragen > 0
    ? Math.round((schueler.beantworteteFragen / schueler.gesamtFragen) * 100)
    : istAbgegeben ? 100 : 0

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
          {zeitverlaengerung && zeitverlaengerung > 0 && (
            <span
              className="text-xs px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"
            >
              +{zeitverlaengerung} Min.
            </span>
          )}
          {pruefungId && lpEmail && (schueler.status === 'aktiv' || schueler.status === 'inaktiv') && (
            <button
              onClick={(e) => { e.stopPropagation(); setZeigBeendenDialog(true) }}
              className="text-xs px-1.5 py-0.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            >
              Beenden
            </button>
          )}
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
            {schueler.gesamtFragen > 0 ? `${schueler.beantworteteFragen}/${schueler.gesamtFragen}` : istAbgegeben ? '✓' : '—'}
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
            {schueler.gesamtFragen > 0 ? `${schueler.beantworteteFragen}/${schueler.gesamtFragen}` : istAbgegeben ? '✓' : '—'}
          </span>
        </div>

        {/* Detail-Toggle */}
        <div className="hidden md:flex justify-center">
          <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform duration-200 ${aufgeklappt ? 'rotate-180' : ''}`}>
            ▼
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

          {/* Fragen-Fortschritt */}
          {fragen && fragen.length > 0 && (
            <FragenFortschritt fragen={fragen} antworten={antworten} />
          )}

          {/* Nachrichten an SuS */}
          {pruefungId && lpEmail && (
            <NachrichtenBereich
              pruefungId={pruefungId}
              lpEmail={lpEmail}
              susEmail={schueler.email}
              nachrichten={nachrichten}
              onNachrichtGesendet={onNachrichtGesendet}
            />
          )}
        </div>
      )}

      {/* BeendenDialog für einzelnen SuS */}
      {zeigBeendenDialog && pruefungId && lpEmail && (
        <BeendenDialog
          pruefungId={pruefungId}
          lpEmail={lpEmail}
          einzelnerSuS={{ email: schueler.email, name: schueler.name }}
          onBeendet={() => { setZeigBeendenDialog(false); onNachrichtGesendet?.() }}
          onAbbrechen={() => setZeigBeendenDialog(false)}
        />
      )}
    </div>
  )
}

/** Typ-Label für Frage-Badges */
const FRAGE_TYP_LABELS: Record<string, string> = {
  mc: 'MC',
  freitext: 'Freitext',
  zuordnung: 'Zuordnung',
  lueckentext: 'Lückentext',
  visualisierung: 'Visualisierung',
  richtigfalsch: 'R/F',
  berechnung: 'Berechnung',
}

/** Fragen-Fortschritt im aufgeklappten Detail-Panel */
function FragenFortschritt({ fragen, antworten }: { fragen: Frage[]; antworten?: Record<string, Antwort> }) {
  const beantwortet = antworten ? Object.keys(antworten).length : 0

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
        Fragen-Fortschritt ({beantwortet}/{fragen.length})
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {fragen.map((frage) => {
          const antwort = antworten?.[frage.id]
          const istBeantwortet = !!antwort
          return (
            <div
              key={frage.id}
              className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                istBeantwortet
                  ? 'bg-green-50 dark:bg-green-900/15 border border-green-200 dark:border-green-800/40'
                  : 'bg-slate-100 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/40'
              }`}
            >
              {/* Status-Icon */}
              <span className={`flex-shrink-0 mt-0.5 ${istBeantwortet ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {istBeantwortet ? '✓' : '—'}
              </span>

              <div className="min-w-0 flex-1">
                {/* Frage-ID + Typ-Badge */}
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                    {frage.id}
                  </span>
                  <span className="flex-shrink-0 px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] leading-none">
                    {FRAGE_TYP_LABELS[frage.typ] || frage.typ}
                  </span>
                </div>

                {/* Antwort-Vorschau */}
                {antwort && (
                  <div className="mt-0.5 text-slate-500 dark:text-slate-400 truncate">
                    <AntwortVorschau antwort={antwort} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Nachrichten-Bereich im Detail-Panel (LP → SuS) */
function NachrichtenBereich({
  pruefungId,
  lpEmail,
  susEmail,
  nachrichten,
  onNachrichtGesendet,
}: {
  pruefungId: string
  lpEmail: string
  susEmail: string
  nachrichten?: PruefungsNachricht[]
  onNachrichtGesendet?: () => void
}) {
  const [text, setText] = useState('')
  const [sendet, setSendet] = useState(false)

  // Nachrichten für diesen Schüler filtern (direkt + Broadcast)
  const relevante = (nachrichten ?? []).filter(
    (n) => n.an === susEmail || n.an === '*'
  )

  const handleSenden = useCallback(async () => {
    const nachricht = text.trim()
    if (!nachricht || sendet) return

    setSendet(true)
    const ok = await apiService.sendeNachricht(pruefungId, lpEmail, susEmail, nachricht)
    setSendet(false)

    if (ok) {
      setText('')
      onNachrichtGesendet?.()
    }
  }, [text, sendet, pruefungId, lpEmail, susEmail, onNachrichtGesendet])

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
        Nachricht an Schüler/in
      </h4>

      {/* Bisherige Nachrichten */}
      {relevante.length > 0 && (
        <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
          {relevante.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1.5 rounded"
            >
              <span className="text-slate-400 dark:text-slate-500 tabular-nums flex-shrink-0">
                {new Date(n.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="break-words min-w-0">
                {n.an === '*' && <span className="text-blue-500 dark:text-blue-400 mr-1" title="Broadcast">[Alle]</span>}
                {n.text}
              </span>
              {n.gelesen && (
                <span className="text-green-500 flex-shrink-0" title="Gelesen">✓</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Eingabefeld */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSenden() }}
          placeholder="Nachricht eingeben..."
          className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500"
          disabled={sendet}
        />
        <button
          onClick={handleSenden}
          disabled={!text.trim() || sendet}
          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-700 dark:bg-slate-600 rounded hover:bg-slate-800 dark:hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {sendet ? '...' : 'Senden'}
        </button>
      </div>
    </div>
  )
}

/** Kompakte Vorschau einer Antwort */
function AntwortVorschau({ antwort }: { antwort: Antwort }) {
  switch (antwort.typ) {
    case 'mc':
      return <span>Gewählt: {antwort.gewaehlteOptionen.join(', ') || '—'}</span>
    case 'freitext': {
      const text = antwort.text || ''
      return <span>{text.length > 50 ? text.slice(0, 50) + '…' : text || '—'}</span>
    }
    case 'zuordnung': {
      const anzahl = Object.keys(antwort.zuordnungen).length
      return <span>{anzahl} Zuordnung{anzahl !== 1 ? 'en' : ''}</span>
    }
    case 'lueckentext': {
      const anzahl = Object.keys(antwort.eintraege).length
      return <span>{anzahl} Lücke{anzahl !== 1 ? 'n' : ''} ausgefüllt</span>
    }
    case 'richtigfalsch': {
      const anzahl = Object.keys(antwort.bewertungen).length
      return <span>{anzahl} Aussage{anzahl !== 1 ? 'n' : ''} bewertet</span>
    }
    case 'berechnung': {
      const anzahl = Object.keys(antwort.ergebnisse).length
      const hatRechenweg = !!antwort.rechenweg
      return <span>{anzahl} Ergebnis{anzahl !== 1 ? 'se' : ''}{hatRechenweg ? ' + Rechenweg' : ''}</span>
    }
    case 'visualisierung':
      return <span>{antwort.bildLink ? 'Bild vorhanden' : 'Daten vorhanden'}</span>
    default:
      return <span>—</span>
  }
}

/** Farbiger Status-Punkt */
function StatusPunkt({ status }: { status: SchuelerStatus['status'] }) {
  const klassen: Record<string, string> = {
    'aktiv': 'bg-green-500 animate-pulse',
    'inaktiv': 'bg-amber-500',
    'abgegeben': 'bg-slate-400 dark:bg-slate-500',
    'nicht-gestartet': 'bg-gray-300 dark:bg-gray-600',
    'beendet-lp': 'bg-red-400 dark:bg-red-500',
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
    'beendet-lp': {
      label: 'Beendet (LP)',
      klasse: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
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
