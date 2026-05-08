// ExamLab/src/utils/batchExportLogic.ts
import type { Frage } from '../types/fragen-storage'
import { apiService } from '../services/apiService'
import { konvertiereZuPoolFormat } from './poolExporter'

export interface PoolEintrag {
  id: string
  file: string
  fach: string
  title: string
}

export interface FrageZuweisung {
  frageId: string
  poolId: string
  topic: string
}

export interface SendeErgebnis {
  frageId: string
  erfolg: boolean
  poolId?: string
  poolContentHash?: string
  fehler?: string
}

interface ErstelleAutoZuweisungenArgs {
  gewaehlteIds: Set<string>
  exportierbar: Frage[]
  pools: PoolEintrag[]
}

interface AutoZuweisungenResult {
  zuweisungen: Map<string, FrageZuweisung>
  benoetigteTopicPools: string[]
}

/**
 * Erstellt Auto-Zuweisungen basierend auf Fachbereich-Match.
 * Pure: keine State-Mutationen, keine Side-Effects.
 *
 * Liefert benoetigteTopicPools: Liste der Pool-IDs für die der Caller
 * topics (state-mutiert) noch laden sollte.
 */
export function erstelleAutoZuweisungen(args: ErstelleAutoZuweisungenArgs): AutoZuweisungenResult {
  const { gewaehlteIds, exportierbar, pools } = args
  const zuweisungen = new Map<string, FrageZuweisung>()
  const benoetigteTopicPools = new Set<string>()

  for (const id of gewaehlteIds) {
    const frage = exportierbar.find(f => f.id === id)
    if (!frage) continue
    const passenderPool = pools.find(p => p.fach?.toLowerCase() === frage.fachbereich?.toLowerCase())
    zuweisungen.set(id, {
      frageId: id,
      poolId: passenderPool?.id || '',
      topic: '',
    })
    if (passenderPool) benoetigteTopicPools.add(passenderPool.id)
  }

  return { zuweisungen, benoetigteTopicPools: Array.from(benoetigteTopicPools) }
}

interface FuehreBatchExportArgs {
  zuweisungen: Map<string, FrageZuweisung>
  fragen: Frage[]
  pools: PoolEintrag[]
  email: string
  onFortschritt: (gesendet: number, gesamt: number) => void
}

interface BatchExportResult {
  ergebnisse: SendeErgebnis[]
  erfolgreiche: Array<{ frageId: string; poolId: string; poolContentHash: string }>
}

/**
 * Führt Batch-Export der Zuweisungen aus. Gruppiert nach Pool-Datei,
 * macht eine API-Anfrage pro Pool.
 *
 * Pure-async: kein direktes setState. onFortschritt-Callback liefert
 * Progress-Updates. Caller verbindet das Result mit setErgebnisse +
 * onErfolg-Callback + Phase-Übergang.
 */
export async function fuehreBatchExportAus(args: FuehreBatchExportArgs): Promise<BatchExportResult> {
  const { zuweisungen, fragen, pools, email, onFortschritt } = args
  const gesamt = zuweisungen.size
  onFortschritt(0, gesamt)
  const alleErgebnisse: SendeErgebnis[] = []

  // Gruppiere nach Pool-Datei
  const nachPool = new Map<string, Array<{ frage: Frage; zuweisung: FrageZuweisung }>>()
  for (const [frageId, zuw] of zuweisungen) {
    const frage = fragen.find(f => f.id === frageId)
    if (!frage) continue
    const pool = pools.find(p => p.id === zuw.poolId)
    if (!pool) continue
    const datei = pool.file || pool.id + '.js'
    if (!nachPool.has(datei)) nachPool.set(datei, [])
    nachPool.get(datei)!.push({ frage, zuweisung: zuw })
  }

  let gesendet = 0
  for (const [poolDatei, eintraege] of nachPool) {
    try {
      const aenderungen = eintraege.map(({ frage, zuweisung }) => {
        const exported = konvertiereZuPoolFormat(frage, zuweisung.topic)
        exported.reviewed = false
        return {
          poolFrageId: null as string | null,
          typ: 'export' as const,
          felder: exported as unknown as Record<string, unknown>,
          _frageId: frage.id,
        }
      })

      const result = await apiService.schreibePoolAenderung(
        email,
        poolDatei,
        aenderungen.map(({ _frageId: _, ...rest }) => rest),
      )

      if (result?.erfolg) {
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

    gesendet += eintraege.length
    onFortschritt(gesendet, gesamt)
  }

  const erfolgreiche = alleErgebnisse
    .filter(e => e.erfolg)
    .map(e => ({
      frageId: e.frageId,
      poolId: e.poolId!,
      poolContentHash: e.poolContentHash!,
    }))

  return { ergebnisse: alleErgebnisse, erfolgreiche }
}
