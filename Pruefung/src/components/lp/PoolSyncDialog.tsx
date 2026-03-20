// Pruefung/src/components/lp/PoolSyncDialog.tsx
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { ladePoolIndex, ladePoolConfig, berechneDelta } from '../../services/poolSync'
import { apiService } from '../../services/apiService'
import type { Frage } from '../../types/fragen'
import type { PoolConfig, PoolSyncErgebnis, Lernziel } from '../../types/pool'

interface Props {
  offen: boolean
  onSchliessen: () => void
  bestehendeFragen: Frage[]
  onImportAbgeschlossen: () => void
}

type SyncPhase = 'idle' | 'laden' | 'vorschau' | 'importieren' | 'fertig' | 'fehler'

/** Batch-Grösse für den Import (Apps Script Timeout-Schutz) */
const BATCH_GROESSE = 50

export default function PoolSyncDialog({ offen, onSchliessen, bestehendeFragen, onImportAbgeschlossen }: Props) {
  const user = useAuthStore(s => s.user)
  const [phase, setPhase] = useState<SyncPhase>('idle')
  const [fortschritt, setFortschritt] = useState('')
  const [fortschrittProzent, setFortschrittProzent] = useState(0)
  const [ergebnisse, setErgebnisse] = useState<PoolSyncErgebnis[]>([])
  const [neuAnzahl, setNeuAnzahl] = useState(0)
  const [updateAnzahl, setUpdateAnzahl] = useState(0)
  const [unveraendertAnzahl, setUnveraendertAnzahl] = useState(0)
  const [fehlerText, setFehlerText] = useState('')
  const [importDaten, setImportDaten] = useState<{ neueFragen: Frage[]; lernziele: Lernziel[] } | null>(null)

  const startSync = useCallback(async () => {
    setPhase('laden')
    setFehlerText('')
    setFortschrittProzent(0)

    try {
      // 1. Index laden
      setFortschritt('Lade Pool-Index...')
      const index = await ladePoolIndex()

      // 2. Alle Pools laden
      const configs: PoolConfig[] = []
      const poolFehler: PoolSyncErgebnis[] = []

      for (let i = 0; i < index.length; i++) {
        const eintrag = index[i]
        setFortschritt(`Lade Pool ${i + 1}/${index.length}: ${eintrag.title}...`)
        setFortschrittProzent(Math.round(((i + 1) / index.length) * 100))
        try {
          const config = await ladePoolConfig(eintrag.file)
          configs.push(config)
        } catch (e) {
          poolFehler.push({
            poolId: eintrag.id,
            poolTitle: eintrag.title,
            neu: 0, aktualisiert: 0, unveraendert: 0,
            fehler: e instanceof Error ? e.message : String(e),
          })
        }
      }

      // 3. Delta berechnen
      setFortschritt('Berechne Änderungen...')
      setFortschrittProzent(100)
      const fragenMap = new Map(
        bestehendeFragen
          .filter(f => f.poolId)
          .map(f => [f.poolId!, f])
      )
      const delta = await berechneDelta(configs, fragenMap)

      // Ergebnis setzen
      setErgebnisse([...delta.ergebnisse, ...poolFehler])
      setNeuAnzahl(delta.neueFragen.length)
      setUpdateAnzahl(delta.aktualisierteFragen.length)
      setUnveraendertAnzahl(delta.unveraendert)
      setImportDaten({ neueFragen: delta.neueFragen, lernziele: delta.lernziele })

      setPhase('vorschau')
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : String(e))
      setPhase('fehler')
    }
  }, [bestehendeFragen])

  const handleImport = useCallback(async () => {
    if (!importDaten || !user) return
    setPhase('importieren')
    setFortschrittProzent(0)

    try {
      const { neueFragen, lernziele } = importDaten
      const totalBatches = Math.ceil(neueFragen.length / BATCH_GROESSE)
      let importiertGesamt = 0

      // Fragen in Batches importieren
      for (let batch = 0; batch < totalBatches; batch++) {
        const start = batch * BATCH_GROESSE
        const end = Math.min(start + BATCH_GROESSE, neueFragen.length)
        const batchFragen = neueFragen.slice(start, end)

        setFortschritt(`Importiere Fragen ${start + 1}–${end} von ${neueFragen.length}...`)
        setFortschrittProzent(Math.round(((batch + 1) / (totalBatches + 1)) * 100))

        const fragenResult = await apiService.importierePoolFragen(user.email, batchFragen)
        if (!fragenResult?.erfolg) {
          throw new Error(`Batch ${batch + 1} fehlgeschlagen (Fragen ${start + 1}–${end})`)
        }
        importiertGesamt += fragenResult.importiert
      }

      // Lernziele importieren
      setFortschritt('Importiere Lernziele...')
      setFortschrittProzent(95)
      await apiService.importiereLernziele(lernziele)

      setFortschrittProzent(100)
      setNeuAnzahl(importiertGesamt)
      setPhase('fertig')
      onImportAbgeschlossen()
    } catch (e) {
      setFehlerText(e instanceof Error ? e.message : String(e))
      setPhase('fehler')
    }
  }, [importDaten, user, onImportAbgeschlossen])

  if (!offen) return null

  const zeigeProgressbar = phase === 'laden' || phase === 'importieren'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Pools synchronisieren</h2>

        {phase === 'idle' && (
          <div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Übungspools von GitHub Pages laden und mit der Fragenbank abgleichen.
              Neue Fragen werden importiert, geänderte Fragen als "Update verfügbar" markiert.
            </p>
            <div className="flex gap-3">
              <button onClick={startSync}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 cursor-pointer">
                Synchronisierung starten
              </button>
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer">
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {zeigeProgressbar && (
          <div className="py-8">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
              <div
                className="bg-slate-700 dark:bg-slate-300 h-3 rounded-full transition-all duration-300"
                style={{ width: `${fortschrittProzent}%` }}
              />
            </div>
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">{fortschritt}</p>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">{fortschrittProzent}%</p>
          </div>
        )}

        {phase === 'vorschau' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{neuAnzahl}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Neue Fragen</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{updateAnzahl}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Updates verfügbar</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{unveraendertAnzahl}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Unverändert</div>
              </div>
            </div>

            {/* Pro-Pool Aufschlüsselung */}
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                Details pro Pool ({ergebnisse.length} Pools)
              </summary>
              <div className="mt-2 max-h-48 overflow-auto">
                {ergebnisse.map(e => (
                  <div key={e.poolId} className="flex items-center gap-2 py-1 text-sm border-b border-slate-100 dark:border-slate-700">
                    <span className="flex-1 dark:text-slate-300">{e.poolTitle}</span>
                    {e.fehler ? (
                      <span className="text-red-500 text-xs">{e.fehler}</span>
                    ) : (
                      <>
                        {e.neu > 0 && <span className="text-slate-700 dark:text-slate-300 font-medium">+{e.neu}</span>}
                        {e.aktualisiert > 0 && <span className="text-slate-600 dark:text-slate-400">↻{e.aktualisiert}</span>}
                        {e.neu === 0 && e.aktualisiert === 0 && <span className="text-slate-400">✓</span>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>

            <div className="flex gap-3">
              {neuAnzahl > 0 && (
                <button onClick={handleImport}
                  className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 cursor-pointer">
                  {neuAnzahl} Fragen importieren
                </button>
              )}
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer">
                {neuAnzahl === 0 ? 'Schliessen' : 'Abbrechen'}
              </button>
            </div>
          </div>
        )}

        {phase === 'fertig' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-lg font-medium dark:text-white mb-2">Synchronisierung abgeschlossen</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              {neuAnzahl} Fragen importiert, {updateAnzahl} Updates markiert
            </p>
            <button onClick={onSchliessen}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 cursor-pointer">
              Schliessen
            </button>
          </div>
        )}

        {phase === 'fehler' && (
          <div>
            <p className="text-red-500 mb-4">{fehlerText}</p>
            <div className="flex gap-3">
              <button onClick={startSync}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 cursor-pointer">
                Erneut versuchen
              </button>
              <button onClick={onSchliessen}
                className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer">
                Schliessen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
