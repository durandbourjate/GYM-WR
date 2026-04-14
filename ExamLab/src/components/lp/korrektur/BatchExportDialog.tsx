// Pruefung/src/components/lp/BatchExportDialog.tsx
// Batch-Export: Mehrere Fragen gleichzeitig in Pools exportieren

import { useState, useEffect, useMemo } from 'react'
import type { Frage } from '../../../types/fragen'
import { ladePoolIndex, ladePoolConfig } from '../../../services/poolSync'
import { konvertiereZuPoolFormat } from '../../../utils/poolExporter'
import { apiService } from '../../../services/apiService'
import { useAuthStore } from '../../../store/authStore'
import { fachbereichFarbe, typLabel } from '../../../utils/fachUtils'

interface Props {
  fragen: Frage[]
  onSchliessen: () => void
  onErfolg: (updates: Array<{ frageId: string; poolId: string; poolContentHash: string }>) => void
}

interface PoolEintrag {
  id: string
  file: string
  fach: string
  title: string
}

type Phase = 'auswahl' | 'zuweisung' | 'senden' | 'fertig' | 'fehler'

interface FrageZuweisung {
  frageId: string
  poolId: string
  topic: string
}

interface SendeErgebnis {
  frageId: string
  erfolg: boolean
  poolId?: string
  poolContentHash?: string
  fehler?: string
}

export default function BatchExportDialog({ fragen, onSchliessen, onErfolg }: Props) {
  const email = useAuthStore(s => s.user?.email) || ''

  // Nur exportierbare Fragen (kein poolId, kein visualisierung)
  const exportierbar = useMemo(() =>
    fragen.filter(f => !f.poolId && f.typ !== 'visualisierung'),
    [fragen],
  )

  const [phase, setPhase] = useState<Phase>('auswahl')
  const [gewaehlteIds, setGewaehlteIds] = useState<Set<string>>(new Set())

  // Pool-Daten
  const [pools, setPools] = useState<PoolEintrag[]>([])
  const [poolTopics, setPoolTopics] = useState<Record<string, Record<string, { label: string }>>>({})
  const [poolsLaden, setPoolsLaden] = useState(true)

  // Zuweisungen (pro Frage: welcher Pool + Topic)
  const [zuweisungen, setZuweisungen] = useState<Map<string, FrageZuweisung>>(new Map())

  // Bulk-Zuweisung
  const [bulkPool, setBulkPool] = useState('')
  const [bulkTopic, setBulkTopic] = useState('')

  // Ergebnisse
  const [ergebnisse, setErgebnisse] = useState<SendeErgebnis[]>([])
  const [fortschritt, setFortschritt] = useState({ gesendet: 0, gesamt: 0 })
  const [fehlerText, setFehlerText] = useState('')

  // Pool-Index laden
  useEffect(() => {
    ladePoolIndex().then(index => {
      setPools(index as PoolEintrag[])
      setPoolsLaden(false)
    }).catch(() => {
      setFehlerText('Pool-Index konnte nicht geladen werden')
      setPoolsLaden(false)
    })
  }, [])

  // Topics laden wenn ein neuer Pool ausgewählt wird
  async function ladeTopicsFuerPool(poolId: string): Promise<void> {
    if (poolTopics[poolId]) return // bereits geladen
    const pool = pools.find(p => p.id === poolId)
    if (!pool) return
    try {
      const config = await ladePoolConfig(pool.file || pool.id + '.js')
      setPoolTopics(prev => ({ ...prev, [poolId]: config.topics }))
    } catch {
      setPoolTopics(prev => ({ ...prev, [poolId]: {} }))
    }
  }

  function toggleFrage(id: string): void {
    setGewaehlteIds(prev => {
      const neu = new Set(prev)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })
  }

  function alleAuswaehlen(): void {
    setGewaehlteIds(new Set(exportierbar.map(f => f.id)))
  }

  function keineAuswaehlen(): void {
    setGewaehlteIds(new Set())
  }

  // Zur Zuweisungs-Phase wechseln
  function weiterZuZuweisung(): void {
    // Auto-Zuweisungen basierend auf Fachbereich
    const neueZuweisungen = new Map<string, FrageZuweisung>()
    for (const id of gewaehlteIds) {
      const frage = exportierbar.find(f => f.id === id)
      if (!frage) continue
      const passenderPool = pools.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
      neueZuweisungen.set(id, {
        frageId: id,
        poolId: passenderPool?.id || '',
        topic: '',
      })
      // Topics vorladen
      if (passenderPool) ladeTopicsFuerPool(passenderPool.id)
    }
    setZuweisungen(neueZuweisungen)
    setPhase('zuweisung')
  }

  function setzePoolFuerFrage(frageId: string, poolId: string): void {
    setZuweisungen(prev => {
      const neu = new Map(prev)
      neu.set(frageId, { frageId, poolId, topic: '' })
      return neu
    })
    if (poolId) ladeTopicsFuerPool(poolId)
  }

  function setzeTopicFuerFrage(frageId: string, topic: string): void {
    setZuweisungen(prev => {
      const neu = new Map(prev)
      const alt = neu.get(frageId)
      if (alt) neu.set(frageId, { ...alt, topic })
      return neu
    })
  }

  // Bulk-Zuweisung anwenden
  function bulkZuweisungAnwenden(): void {
    if (!bulkPool) return
    ladeTopicsFuerPool(bulkPool)
    setZuweisungen(prev => {
      const neu = new Map(prev)
      for (const [id, zuw] of neu) {
        neu.set(id, { ...zuw, poolId: bulkPool, topic: bulkTopic })
      }
      return neu
    })
  }

  // Prüfe ob alle Zuweisungen komplett
  const alleZugewiesen = useMemo(() => {
    for (const zuw of zuweisungen.values()) {
      if (!zuw.poolId || !zuw.topic) return false
    }
    return zuweisungen.size > 0
  }, [zuweisungen])

  // Batch-Export durchführen
  async function handleExport(): Promise<void> {
    setPhase('senden')
    const gesamt = zuweisungen.size
    setFortschritt({ gesendet: 0, gesamt })
    const alleErgebnisse: SendeErgebnis[] = []

    // Gruppiere nach Pool-Datei
    const nachPool = new Map<string, Array<{ frage: Frage; zuweisung: FrageZuweisung }>>()
    for (const [frageId, zuw] of zuweisungen) {
      const frage = exportierbar.find(f => f.id === frageId)
      if (!frage) continue
      const pool = pools.find(p => p.id === zuw.poolId)
      if (!pool) continue
      const datei = pool.file || pool.id + '.js'
      if (!nachPool.has(datei)) nachPool.set(datei, [])
      nachPool.get(datei)!.push({ frage, zuweisung: zuw })
    }

    // Pro Pool-Datei eine API-Anfrage
    for (const [poolDatei, eintraege] of nachPool) {
      try {
        const aenderungen = eintraege.map(({ frage, zuweisung }) => {
          const exported = konvertiereZuPoolFormat(frage, zuweisung.topic)
          exported.reviewed = false
          return {
            poolFrageId: null as string | null,
            typ: 'export' as const,
            felder: exported as unknown as Record<string, unknown>,
            _frageId: frage.id, // Hilfsfeld für Zuordnung
          }
        })

        const result = await apiService.schreibePoolAenderung(
          email,
          poolDatei,
          aenderungen.map(({ _frageId: _, ...rest }) => rest),
        )

        if (result?.erfolg) {
          // Ergebnisse zuordnen
          const exportierteIdValues = Object.values(result.exportierteIds)
          const hashValues = Object.values(result.neueHashes)
          const poolName = poolDatei.replace('.js', '')

          for (let i = 0; i < eintraege.length; i++) {
            alleErgebnisse.push({
              frageId: eintraege[i].frage.id,
              erfolg: true,
              poolId: poolName + ':' + (exportierteIdValues[i] || ''),
              poolContentHash: hashValues[i] || '',
            })
          }
        } else {
          // Alle Fragen dieser Pool-Datei als fehlgeschlagen markieren
          for (const { frage } of eintraege) {
            alleErgebnisse.push({
              frageId: frage.id,
              erfolg: false,
              fehler: result?.fehler?.join(', ') || 'Unbekannter Fehler',
            })
          }
        }
      } catch (e) {
        for (const { frage } of eintraege) {
          alleErgebnisse.push({
            frageId: frage.id,
            erfolg: false,
            fehler: e instanceof Error ? e.message : 'Netzwerkfehler',
          })
        }
      }

      setFortschritt(prev => ({ ...prev, gesendet: prev.gesendet + eintraege.length }))
    }

    setErgebnisse(alleErgebnisse)
    const erfolgreiche = alleErgebnisse.filter(e => e.erfolg)
    if (erfolgreiche.length > 0) {
      onErfolg(erfolgreiche.map(e => ({
        frageId: e.frageId,
        poolId: e.poolId!,
        poolContentHash: e.poolContentHash!,
      })))
    }
    setPhase(alleErgebnisse.some(e => !e.erfolg) ? 'fehler' : 'fertig')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-bold dark:text-white">
            Batch-Export in Pools
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {phase === 'auswahl' && `${exportierbar.length} exportierbare Fragen (ohne Pool-ID)`}
            {phase === 'zuweisung' && `${gewaehlteIds.size} Fragen — Pool & Topic zuweisen`}
            {phase === 'senden' && `Exportiere ${fortschritt.gesendet}/${fortschritt.gesamt}...`}
            {phase === 'fertig' && `${ergebnisse.filter(e => e.erfolg).length} Fragen erfolgreich exportiert`}
            {phase === 'fehler' && 'Export teilweise fehlgeschlagen'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* === Phase 1: Fragen auswählen === */}
          {phase === 'auswahl' && (
            <>
              {poolsLaden ? (
                <div className="py-8 text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Pools werden geladen...</p>
                </div>
              ) : exportierbar.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Keine exportierbaren Fragen gefunden. Nur Fragen ohne Pool-ID können exportiert werden.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={alleAuswaehlen} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Alle auswählen
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <button onClick={keineAuswaehlen} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                      Keine
                    </button>
                    <span className="text-xs text-gray-400 ml-auto">
                      {gewaehlteIds.size} ausgewählt
                    </span>
                  </div>
                  <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                    {exportierbar.map(f => {
                      const fragetext = 'fragetext' in f ? (f as { fragetext: string }).fragetext : ''
                      return (
                        <label
                          key={f.id}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            gewaehlteIds.has(f.id)
                              ? 'border-gray-800 dark:border-gray-300 bg-gray-50 dark:bg-gray-800'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={gewaehlteIds.has(f.id)}
                            onChange={() => toggleFrage(f.id)}
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-gray-500">{f.id}</span>
                              <span className={`px-1 py-0.5 text-[10px] rounded ${fachbereichFarbe(f.fachbereich)}`}>
                                {f.fachbereich}
                              </span>
                              <span className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {typLabel(f.typ)}
                              </span>
                              <span className="text-[10px] text-gray-400">{f.bloom}</span>
                            </div>
                            {fragetext && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                                {fragetext.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 120)}
                              </p>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* === Phase 2: Pool & Topic zuweisen === */}
          {phase === 'zuweisung' && (
            <>
              {/* Bulk-Zuweisung */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Alle auf einmal zuweisen:
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkPool}
                    onChange={e => { setBulkPool(e.target.value); setBulkTopic(''); if (e.target.value) ladeTopicsFuerPool(e.target.value) }}
                    className="flex-1 p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">— Pool —</option>
                    {pools.map(p => (
                      <option key={p.id} value={p.id}>{p.fach} · {p.title}</option>
                    ))}
                  </select>
                  <select
                    value={bulkTopic}
                    onChange={e => setBulkTopic(e.target.value)}
                    className="flex-1 p-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    disabled={!bulkPool || !poolTopics[bulkPool]}
                  >
                    <option value="">— Topic —</option>
                    {bulkPool && poolTopics[bulkPool] && Object.entries(poolTopics[bulkPool]).map(([key, t]) => (
                      <option key={key} value={key}>{t.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={bulkZuweisungAnwenden}
                    disabled={!bulkPool}
                    className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
                  >
                    Anwenden
                  </button>
                </div>
              </div>

              {/* Einzelne Zuweisungen */}
              <div className="space-y-2">
                {Array.from(zuweisungen.entries()).map(([frageId, zuw]) => {
                  const frage = exportierbar.find(f => f.id === frageId)
                  if (!frage) return null
                  const fragetext = 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : ''
                  const istKomplett = !!zuw.poolId && !!zuw.topic

                  return (
                    <div key={frageId} className={`p-3 rounded-lg border transition-colors ${
                      istKomplett
                        ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-gray-500">{frage.id}</span>
                        <span className={`px-1 py-0.5 text-[10px] rounded ${fachbereichFarbe(frage.fachbereich)}`}>
                          {frage.fachbereich}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1">
                          {fragetext?.replace(/\*\*/g, '').replace(/\n/g, ' ').slice(0, 80)}
                        </span>
                        {istKomplett && <span className="text-green-600 dark:text-green-400 text-sm">✓</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={zuw.poolId}
                          onChange={e => setzePoolFuerFrage(frageId, e.target.value)}
                          className="flex-1 p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">— Pool —</option>
                          {pools.map(p => (
                            <option key={p.id} value={p.id}>{p.fach} · {p.title}</option>
                          ))}
                        </select>
                        <select
                          value={zuw.topic}
                          onChange={e => setzeTopicFuerFrage(frageId, e.target.value)}
                          className="flex-1 p-1.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          disabled={!zuw.poolId || !poolTopics[zuw.poolId]}
                        >
                          <option value="">— Topic —</option>
                          {zuw.poolId && poolTopics[zuw.poolId] && Object.entries(poolTopics[zuw.poolId]).map(([key, t]) => (
                            <option key={key} value={key}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* === Phase 3: Senden === */}
          {phase === 'senden' && (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exportiere Fragen... ({fortschritt.gesendet}/{fortschritt.gesamt})
              </p>
              <div className="w-48 mx-auto mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 dark:bg-gray-300 transition-all duration-300 rounded-full"
                  style={{ width: `${fortschritt.gesamt > 0 ? (fortschritt.gesendet / fortschritt.gesamt) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* === Phase 4: Fertig === */}
          {phase === 'fertig' && (
            <div className="py-8 text-center">
              <div className="text-4xl mb-3">✓</div>
              <p className="text-sm dark:text-gray-300">
                {ergebnisse.filter(e => e.erfolg).length} Fragen erfolgreich in Pools exportiert.
              </p>
              <p className="text-xs text-gray-400 mt-2">Änderungen sind in ~2 Min. auf GitHub Pages sichtbar.</p>
            </div>
          )}

          {/* === Phase 5: Fehler (teilweise) === */}
          {phase === 'fehler' && (
            <div className="py-4">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠</div>
                <p className="text-sm dark:text-gray-300">
                  {ergebnisse.filter(e => e.erfolg).length} erfolgreich,{' '}
                  {ergebnisse.filter(e => !e.erfolg).length} fehlgeschlagen.
                </p>
              </div>
              {fehlerText && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">{fehlerText}</p>
              )}
              <div className="space-y-1">
                {ergebnisse.filter(e => !e.erfolg).map(e => (
                  <div key={e.frageId} className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                    <span className="text-red-600 dark:text-red-400">✗</span>
                    <span className="font-mono text-xs">{e.frageId}</span>
                    <span className="text-xs text-red-500">{e.fehler}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex justify-end gap-2 shrink-0">
          {phase === 'auswahl' && (
            <>
              <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                Abbrechen
              </button>
              <button
                onClick={weiterZuZuweisung}
                disabled={gewaehlteIds.size === 0 || poolsLaden}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Weiter ({gewaehlteIds.size} Fragen)
              </button>
            </>
          )}
          {phase === 'zuweisung' && (
            <>
              <button onClick={() => setPhase('auswahl')} className="px-4 py-2 text-sm rounded border dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                Zurück
              </button>
              <button
                onClick={handleExport}
                disabled={!alleZugewiesen}
                className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 cursor-pointer"
              >
                Exportieren ({zuweisungen.size} Fragen)
              </button>
            </>
          )}
          {(phase === 'fertig' || phase === 'fehler') && (
            <button onClick={onSchliessen} className="px-4 py-2 text-sm rounded bg-gray-800 text-white hover:bg-gray-700 cursor-pointer">
              Schliessen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
