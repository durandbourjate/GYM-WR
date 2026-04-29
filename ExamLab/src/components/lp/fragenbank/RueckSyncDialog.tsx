// Pruefung/src/components/lp/RueckSyncDialog.tsx
// Zwei-Modus-Dialog: Update bestehender Pool-Fragen / Export neuer Fragen

import { useState, useEffect } from 'react'
import type { Frage } from '../../../types/fragen-storage'
import type { RueckSyncDiffFeld } from '../../../services/poolSync'
import { berechneRueckSyncDiff, ladePoolIndex, ladePoolConfig } from '../../../services/poolSync'
import { konvertiereZuPoolFormat } from '../../../utils/poolExporter'
import { apiService } from '../../../services/apiService'
import { useAuthStore } from '../../../store/authStore'

type Phase = 'diff' | 'pool-wahl' | 'senden' | 'fertig' | 'fehler'

interface Props {
  frage: Frage
  offen: boolean
  onSchliessen: () => void
  onErfolg: (aktualiserteFrage: Partial<Frage>) => void
}

interface PoolEintrag {
  id: string
  file: string
  fach: string
  title: string
}

export default function RueckSyncDialog({ frage, offen, onSchliessen, onErfolg }: Props) {
  const email = useAuthStore(s => s.user?.email) || ''
  const istUpdate = !!frage.poolId

  // Update-Mode State
  const [diffs, setDiffs] = useState<RueckSyncDiffFeld[]>([])
  const [gewaehlteFelder, setGewaehlteFelder] = useState<Set<string>>(new Set())

  // Export-Mode State
  const [pools, setPools] = useState<PoolEintrag[]>([])
  const [gewaehlterPool, setGewaehlterPool] = useState('')
  const [gewaehltesTopic, setGewaehltesTopic] = useState('')
  const [poolTopics, setPoolTopics] = useState<Record<string, { label: string }>>({})

  // Shared State
  const [phase, setPhase] = useState<Phase>(istUpdate ? 'diff' : 'pool-wahl')
  const [fehlerText, setFehlerText] = useState('')
  const [ergebnis, setErgebnis] = useState<{ aktualisiert: number; exportiert: number } | null>(null)

  // Diff berechnen (Update-Modus)
  useEffect(() => {
    if (!offen || !istUpdate || !frage.poolVersion) return
    const d = berechneRueckSyncDiff(frage, frage.poolVersion)
    setDiffs(d)
    setGewaehlteFelder(new Set(d.map(f => f.poolFeld)))
  }, [offen, frage, istUpdate])

  // Pool-Liste laden (Export-Modus)
  useEffect(() => {
    if (!offen || istUpdate) return
    ladePoolIndex().then(index => {
      setPools(index as PoolEintrag[])
      const passend = index.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
      if (passend) setGewaehlterPool(passend.id)
    }).catch(() => setFehlerText('Pool-Index konnte nicht geladen werden'))
  }, [offen, istUpdate, frage.fachbereich])

  // Topics laden wenn Pool gewählt (Export-Modus)
  useEffect(() => {
    if (!gewaehlterPool || istUpdate) return
    const pool = pools.find(p => p.id === gewaehlterPool)
    if (!pool) return
    const datei = pool.file || pool.id + '.js'
    ladePoolConfig(datei).then(config => {
      setPoolTopics(config.topics)
    }).catch(() => setPoolTopics({}))
  }, [gewaehlterPool, pools, istUpdate])

  const toggleFeld = (feld: string) => {
    setGewaehlteFelder(prev => {
      const neu = new Set(prev)
      if (neu.has(feld)) neu.delete(feld)
      else neu.add(feld)
      return neu
    })
  }

  const handleSenden = async () => {
    setPhase('senden')
    try {
      if (istUpdate) {
        // Update: Gewählte Felder senden
        const poolId = frage.poolId!
        const [poolName, frageId] = poolId.split(':')
        const poolDatei = poolName + '.js'

        const felder: Record<string, unknown> = {}
        for (const diff of diffs) {
          if (gewaehlteFelder.has(diff.poolFeld)) {
            if (diff.poolFeld === 'spezifisch') {
              const exported = konvertiereZuPoolFormat(frage, '', frageId)
              if (exported.blanks) felder.blanks = exported.blanks
              if (exported.rows) felder.rows = exported.rows
              if (exported.items) { felder.items = exported.items; felder.categories = exported.categories }
              if (exported.options) felder.options = exported.options
            } else {
              felder[diff.poolFeld] = diff.neu
            }
          }
        }
        if (frage.poolGeprueft !== undefined) felder.reviewed = frage.poolGeprueft

        const result = await apiService.schreibePoolAenderung(email, poolDatei, [{
          poolFrageId: frageId,
          typ: 'update',
          felder,
        }])

        if (!result?.erfolg) {
          setFehlerText(result?.fehler?.join(', ') || 'Unbekannter Fehler')
          setPhase('fehler')
          return
        }

        setErgebnis({ aktualisiert: result.aktualisiert, exportiert: 0 })
        onErfolg({
          poolContentHash: result.neueHashes[frageId] || frage.poolContentHash,
          poolUpdateVerfuegbar: false,
        })

      } else {
        // Export: Neue Frage in Pool
        const pool = pools.find(p => p.id === gewaehlterPool)
        if (!pool) { setFehlerText('Kein Pool gewählt'); setPhase('fehler'); return }

        const exported = konvertiereZuPoolFormat(frage, gewaehltesTopic)
        exported.reviewed = false

        const result = await apiService.schreibePoolAenderung(email, pool.file || pool.id + '.js', [{
          poolFrageId: null,
          typ: 'export',
          felder: exported as unknown as Record<string, unknown>,
        }])

        if (!result?.erfolg) {
          setFehlerText(result?.fehler?.join(', ') || 'Unbekannter Fehler')
          setPhase('fehler')
          return
        }

        const neuePoolId = Object.values(result.exportierteIds)[0]
        setErgebnis({ aktualisiert: 0, exportiert: result.exportiert })
        onErfolg({
          poolId: pool.id + ':' + neuePoolId,
          quelle: 'pool',
          poolContentHash: Object.values(result.neueHashes)[0],
        })
      }

      setPhase('fertig')
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : 'Netzwerkfehler')
      setPhase('fehler')
    }
  }

  if (!offen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">

        {/* Header */}
        <h2 className="text-lg font-bold mb-4 dark:text-white">
          {istUpdate ? 'Änderungen an Pool zurückschreiben' : 'Frage in Pool exportieren'}
        </h2>

        {/* Update-Modus: Diff-Vorschau */}
        {phase === 'diff' && istUpdate && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Pool: <strong>{frage.poolId?.split(':')[0]}</strong> · Frage: <strong>{frage.poolId?.split(':')[1]}</strong>
            </p>
            {diffs.length === 0 ? (
              <p className="text-gray-500 py-4">Keine Unterschiede zum Pool gefunden.</p>
            ) : (
              <div className="space-y-3">
                {diffs.map(d => (
                  <label key={d.poolFeld} className="flex items-start gap-3 p-3 rounded border dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={gewaehlteFelder.has(d.poolFeld)}
                      onChange={() => toggleFeld(d.poolFeld)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm dark:text-white">{d.feld}</div>
                      <div className="text-xs text-gray-400 line-through mt-1 break-words">
                        {typeof d.alt === 'string' ? d.alt : JSON.stringify(d.alt)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400 mt-1 break-words">
                        {typeof d.neu === 'string' ? d.neu : JSON.stringify(d.neu)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Abbrechen</button>
              <button
                onClick={handleSenden}
                disabled={gewaehlteFelder.size === 0}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Zurückschreiben ({gewaehlteFelder.size} Felder)
              </button>
            </div>
          </>
        )}

        {/* Export-Modus: Pool + Topic Wahl */}
        {phase === 'pool-wahl' && !istUpdate && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Ziel-Pool</label>
                <select
                  value={gewaehlterPool}
                  onChange={e => { setGewaehlterPool(e.target.value); setGewaehltesTopic('') }}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="">— Pool wählen —</option>
                  {pools.map(p => (
                    <option key={p.id} value={p.id}>{p.fach} · {p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Topic</label>
                <select
                  value={gewaehltesTopic}
                  onChange={e => setGewaehltesTopic(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  disabled={!gewaehlterPool}
                >
                  <option value="">— Topic wählen —</option>
                  {Object.entries(poolTopics).map(([key, topic]) => (
                    <option key={key} value={key}>{topic.label}</option>
                  ))}
                </select>
              </div>
              {/* Vorschau */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm">
                <div className="font-medium mb-2 dark:text-white">Vorschau (Pool-Format)</div>
                <div className="text-xs dark:text-gray-300"><strong>Typ:</strong> {frage.typ}</div>
                <div className="text-xs dark:text-gray-300"><strong>Bloom:</strong> {frage.bloom}</div>
                <div className="text-xs dark:text-gray-300"><strong>Fragetext:</strong> {('fragetext' in frage ? (frage as { fragetext?: string }).fragetext?.substring(0, 100) : '')}...</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">Abbrechen</button>
              <button
                onClick={handleSenden}
                disabled={!gewaehlterPool || !gewaehltesTopic}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40"
              >
                Exportieren
              </button>
            </div>
          </>
        )}

        {/* Senden */}
        {phase === 'senden' && (
          <div className="py-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {istUpdate ? 'Schreibe Änderungen an Pool...' : 'Exportiere Frage in Pool...'}
            </p>
          </div>
        )}

        {/* Fertig */}
        {phase === 'fertig' && ergebnis && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-sm dark:text-gray-300">
              {ergebnis.aktualisiert > 0 && `${ergebnis.aktualisiert} Felder zurückgeschrieben.`}
              {ergebnis.exportiert > 0 && 'Frage exportiert.'}
            </p>
            <p className="text-xs text-gray-400 mt-2">Änderungen sind in ~2 Min. auf GitHub Pages sichtbar.</p>
            <button onClick={onSchliessen} className="mt-4 px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700">
              Schliessen
            </button>
          </div>
        )}

        {/* Fehler */}
        {phase === 'fehler' && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">✗</div>
            <p className="text-sm text-red-600 dark:text-red-400">{fehlerText}</p>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300">Schliessen</button>
              <button onClick={() => setPhase(istUpdate ? 'diff' : 'pool-wahl')} className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700">
                Nochmal versuchen
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
