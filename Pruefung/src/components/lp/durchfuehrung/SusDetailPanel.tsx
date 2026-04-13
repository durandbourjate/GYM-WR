import { useState, useMemo, useCallback } from 'react'
import type { SchuelerStatus } from '../../../types/monitoring'

interface Bemerkung {
  zeitpunkt: string
  text: string
  sus?: string
}

interface Props {
  schueler: SchuelerStatus
  pruefungId: string
  onSchliessen: () => void
}

function ladeBemerkungen(pruefungId: string): Bemerkung[] {
  try {
    return JSON.parse(localStorage.getItem(`pruefung-bemerkungen-${pruefungId}`) || '[]')
  } catch { return [] }
}

function speichereBemerkung(pruefungId: string, bemerkung: Bemerkung): void {
  try {
    const alle = ladeBemerkungen(pruefungId)
    alle.push(bemerkung)
    localStorage.setItem(`pruefung-bemerkungen-${pruefungId}`, JSON.stringify(alle))
  } catch { /* ignorieren */ }
}

export default function SusDetailPanel({ schueler, pruefungId, onSchliessen }: Props) {
  const [kommentar, setKommentar] = useState('')
  const [bemerkungsVersion, setBemerkungsVersion] = useState(0)

  const bemerkungen = useMemo(
    () => ladeBemerkungen(pruefungId).filter((b) => b.sus === schueler.email),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pruefungId, schueler.email, bemerkungsVersion],
  )

  const handleKommentarSpeichern = useCallback(() => {
    if (!kommentar.trim()) return
    speichereBemerkung(pruefungId, {
      zeitpunkt: new Date().toISOString(),
      text: kommentar.trim(),
      sus: schueler.email,
    })
    setKommentar('')
    setBemerkungsVersion((v) => v + 1)
  }, [kommentar, pruefungId, schueler.email])
  return (
    <div className="fixed top-[53px] bottom-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-lg z-[65] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">{schueler.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{schueler.email}</p>
          {schueler.klasse && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Klasse: {schueler.klasse}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onSchliessen}
          className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Status-Info */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Status</span>
            <p className="font-medium text-slate-700 dark:text-slate-200">{statusLabel(schueler.status)}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Login</span>
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {schueler.startzeit
                ? new Date(schueler.startzeit).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
                : '\u2014'}
            </p>
          </div>
        </div>

        {/* Fortschritt */}
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Fortschritt</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: schueler.gesamtFragen > 0 ? `${(schueler.beantworteteFragen / schueler.gesamtFragen) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {schueler.beantworteteFragen}/{schueler.gesamtFragen}
            </span>
          </div>
        </div>

        {/* Aktuelle Frage */}
        {schueler.aktuelleFrage !== null && schueler.aktuelleFrage !== undefined && (
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Aktuelle Frage</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Frage {schueler.aktuelleFrage + 1} von {schueler.gesamtFragen}
            </p>
          </div>
        )}

        {/* Fragen-Übersicht */}
        {schueler.gesamtFragen > 0 && (
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Fragen</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Array.from({ length: schueler.gesamtFragen }, (_, i) => {
                const istAktuell = schueler.aktuelleFrage === i
                const istBeantwortet = i < schueler.beantworteteFragen
                return (
                  <span
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center text-xs rounded
                      ${istAktuell
                        ? 'bg-blue-500 text-white font-bold'
                        : istBeantwortet
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Technische Details */}
        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Heartbeats</span>
            <span>{schueler.heartbeats}</span>
          </div>
          <div className="flex justify-between">
            <span>Auto-Saves</span>
            <span>{schueler.autoSaveCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Netzwerkfehler</span>
            <span className={schueler.netzwerkFehler > 0 ? 'text-red-500' : ''}>{schueler.netzwerkFehler}</span>
          </div>
          {schueler.unterbrechungen.length > 0 && (
            <div>
              <span>Unterbrechungen: {schueler.unterbrechungen.length}</span>
            </div>
          )}
        </div>

        {/* LP-Bemerkungen */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Bemerkungen</span>

          {bemerkungen.length > 0 && (
            <div className="mt-1 space-y-1">
              {bemerkungen.map((b, i) => (
                <div key={i} className="text-xs p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <span className="text-amber-600 dark:text-amber-400">
                    {new Date(b.zeitpunkt).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {' '}{b.text}
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-1">
            <input
              type="text"
              value={kommentar}
              onChange={(e) => setKommentar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleKommentarSpeichern()}
              placeholder="Bemerkung hinzufügen..."
              className="flex-1 text-xs px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
            <button
              type="button"
              onClick={handleKommentarSpeichern}
              disabled={!kommentar.trim()}
              className="px-2 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function statusLabel(status: SchuelerStatus['status']): string {
  switch (status) {
    case 'aktiv': return 'Aktiv'
    case 'inaktiv': return 'Inaktiv'
    case 'abgegeben': return 'Abgegeben'
    case 'nicht-gestartet': return 'Nicht gestartet'
    case 'beendet-lp': return 'Beendet (LP)'
    default: return status
  }
}
