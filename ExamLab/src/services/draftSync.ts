/**
 * draftSync.ts — Bundle 3 Phase B.2
 *
 * Hybrid IDB+Server-Sync für Editor-Auto-Save mit:
 *   - 1s-Debouncer für IDB-Write (lokale Backup-Persistenz)
 *   - 10s-Debouncer für Server-Save
 *   - 4-Stufen-Retry: 5xx exp.backoff (1s→2s→4s, max 3 retries),
 *     401 eskalieren (kein LP-Auth-Refresh existiert), 429 Retry-After,
 *     4xx eskalieren
 *   - BroadcastChannel-Multi-Tab-Sync (jsdom-stub-fähig)
 *   - Subscribe-Pattern für UI-Status pro frageId
 *
 * Public API: tippeFrage, finalisiere, subscribe, resetForTesting.
 *
 * Hinweis: Im LP-Auth gibt es aktuell keinen `sessionWiederherstellen`-Hook
 * (wie im SuS-Üben). 401 wird daher direkt eskaliert (Plan-STOP-Signal).
 * TODO: Wenn LP-Auth später Refresh-Token bekommt, hier 401-Retry ergänzen.
 */
import { set as idbSet } from 'idb-keyval'
import { speichereFrageMitStatus } from './fragenbankApi'
import type { Frage } from '../types/fragen-storage'

export type SyncStatus =
  | 'sauber'
  | 'sync-läuft'
  | 'entwurf'
  | 'verbindungsproblem'
  | 'server-down'

export interface DraftSyncState {
  status: SyncStatus
  /** Letzter vom Server bestimmter Status (nach erfolgreichem Save) */
  pruefungstauglich?: boolean
}

// === Konstanten ===
const IDB_DEBOUNCE_MS = 1_000
const SERVER_DEBOUNCE_MS = 10_000
const MAX_RETRIES = 3
const RETRY_BACKOFF_MS = [1_000, 2_000, 4_000]
const CHANNEL_NAME = 'bundle3-drafts'

// === Modul-State (per frageId gescopt) ===
interface PerFrageState {
  email: string
  frage: Frage
  idbTimer?: ReturnType<typeof setTimeout>
  serverTimer?: ReturnType<typeof setTimeout>
  retryTimer?: ReturnType<typeof setTimeout>
  state: DraftSyncState
  subscribers: Set<(state: DraftSyncState) => void>
}

const stateByFrageId = new Map<string, PerFrageState>()

// === BroadcastChannel — nur einmal pro Modul-Init ===
let channel: BroadcastChannel | null = null

function ensureChannel(): BroadcastChannel | null {
  if (channel !== null) return channel
  if (typeof BroadcastChannel === 'undefined') return null
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = handleBroadcastMessage
    return channel
  } catch {
    return null
  }
}

function handleBroadcastMessage(ev: MessageEvent): void {
  const data = ev.data as
    | { type?: string; frageId?: string; status?: SyncStatus | 'entwurf'; pruefungstauglich?: boolean }
    | undefined
  if (!data || data.type !== 'draft-updated' || !data.frageId) return
  // subscribe() legt einen entry an, sobald irgendein UI-Element subscribed.
  // Kommen wir hier ohne entry an, gibt es keinen Subscriber → kein State zu updaten.
  const entry = stateByFrageId.get(data.frageId)
  if (!entry) return
  const newState: DraftSyncState = {
    status: (data.status as SyncStatus) ?? entry.state.status,
    pruefungstauglich: data.pruefungstauglich ?? entry.state.pruefungstauglich,
  }
  entry.state = newState
  notifySubscribers(data.frageId, newState)
}

// === Helper ===
function getOrCreate(frageId: string, email = '', frage?: Frage): PerFrageState {
  let entry = stateByFrageId.get(frageId)
  if (!entry) {
    entry = {
      email,
      frage: frage ?? ({ id: frageId } as unknown as Frage),
      state: { status: 'sauber' },
      subscribers: new Set(),
    }
    stateByFrageId.set(frageId, entry)
  } else {
    if (email) entry.email = email
    if (frage) entry.frage = frage
  }
  return entry
}

function setState(frageId: string, patch: Partial<DraftSyncState>): void {
  const entry = stateByFrageId.get(frageId)
  if (!entry) return
  entry.state = { ...entry.state, ...patch }
  notifySubscribers(frageId, entry.state)
}

function notifySubscribers(frageId: string, state: DraftSyncState): void {
  const entry = stateByFrageId.get(frageId)
  if (!entry) return
  for (const cb of entry.subscribers) {
    try {
      cb(state)
    } catch {
      // Subscriber-Fehler nicht propagieren
    }
  }
}

function broadcastUpdate(frageId: string, state: DraftSyncState): void {
  const ch = ensureChannel()
  if (!ch) return
  try {
    ch.postMessage({
      type: 'draft-updated',
      frageId,
      status: state.status,
      pruefungstauglich: state.pruefungstauglich,
    })
  } catch {
    // postMessage kann in Edge-Cases failen — silent
  }
}

// === Server-Sync mit Retry ===
async function syncToServer(frageId: string, retryCount = 0): Promise<void> {
  const entry = stateByFrageId.get(frageId)
  if (!entry || !entry.email) return

  setState(frageId, { status: 'sync-läuft' })

  const result = await speichereFrageMitStatus(entry.email, entry.frage)

  if (result.success) {
    const newStatus: SyncStatus = result.status === 'draft' ? 'entwurf' : 'sauber'
    setState(frageId, {
      status: newStatus,
      pruefungstauglich: result.status === 'sammlung',
    })
    broadcastUpdate(frageId, stateByFrageId.get(frageId)!.state)
    return
  }

  const status = result.errorStatus ?? 0
  const isRetryable5xxOrNetwork = status === 0 || (status >= 500 && status < 600)
  const is429 = status === 429
  const is401 = status === 401

  // 4xx (außer 401/429) → direkt eskalieren
  if (!isRetryable5xxOrNetwork && !is429 && !is401) {
    setState(frageId, { status: 'server-down' })
    return
  }

  // 401 → kein LP-Refresh-Hook → eskalieren (siehe TODO im Header)
  if (is401) {
    setState(frageId, { status: 'server-down' })
    return
  }

  // Max Retries erreicht
  if (retryCount >= MAX_RETRIES) {
    setState(frageId, { status: 'server-down' })
    return
  }

  // Wartezeit bestimmen
  let delayMs: number
  if (is429) {
    setState(frageId, { status: 'verbindungsproblem' })
    delayMs = (result.retryAfterSeconds ?? 5) * 1_000
  } else {
    // 5xx / Network: bleibt 'sync-läuft' während Backoff
    delayMs = RETRY_BACKOFF_MS[retryCount] ?? 4_000
  }

  // Retry planen
  if (entry.retryTimer) clearTimeout(entry.retryTimer)
  entry.retryTimer = setTimeout(() => {
    entry.retryTimer = undefined
    void syncToServer(frageId, retryCount + 1)
  }, delayMs)
}

// === Public API ===

/**
 * Registriere Editor-Tippen für eine Frage. Triggert nach 1s IDB-Update,
 * nach 10s Server-Sync. Konsekutive Calls resetten beide Debouncer.
 */
export function tippeFrage(email: string, frage: Frage): void {
  const frageId = frage.id
  if (!frageId) return
  const entry = getOrCreate(frageId, email, frage)
  entry.email = email
  entry.frage = frage

  // BroadcastChannel sicherstellen (Lazy)
  ensureChannel()

  // IDB-Debouncer reset
  if (entry.idbTimer) clearTimeout(entry.idbTimer)
  entry.idbTimer = setTimeout(() => {
    entry.idbTimer = undefined
    void idbSet(`draft:${frageId}`, entry.frage)
  }, IDB_DEBOUNCE_MS)

  // Server-Debouncer reset
  if (entry.serverTimer) clearTimeout(entry.serverTimer)
  entry.serverTimer = setTimeout(() => {
    entry.serverTimer = undefined
    void syncToServer(frageId, 0)
  }, SERVER_DEBOUNCE_MS)
}

/**
 * Erzwingt sofortigen Server-Sync (ohne Debounce) und resolved nach
 * Server-Bestätigung. Verwendet von Schliessen-Modal vor unmount/close.
 * Throws bei Server-Fehler nach Retry-Eskalation.
 */
export async function finalisiere(email: string, frage: Frage): Promise<void> {
  const frageId = frage.id
  if (!frageId) throw new Error('finalisiere: frage.id fehlt')
  const entry = getOrCreate(frageId, email, frage)
  entry.email = email
  entry.frage = frage

  // Pending Debouncer canceln — wir saven jetzt sofort
  if (entry.idbTimer) {
    clearTimeout(entry.idbTimer)
    entry.idbTimer = undefined
  }
  if (entry.serverTimer) {
    clearTimeout(entry.serverTimer)
    entry.serverTimer = undefined
  }

  // IDB-Save sofort (best-effort, Fehler nicht propagieren)
  try {
    await idbSet(`draft:${frageId}`, frage)
  } catch {
    // IDB-Fehler tolerieren — Hauptpfad ist Server
  }

  // Server-Save sofort
  ensureChannel()
  setState(frageId, { status: 'sync-läuft' })
  const result = await speichereFrageMitStatus(email, frage)

  if (!result.success) {
    setState(frageId, { status: 'server-down' })
    throw new Error(`finalisiere: Server-Save fehlgeschlagen (status=${result.errorStatus ?? 0})`)
  }

  const newStatus: SyncStatus = result.status === 'draft' ? 'entwurf' : 'sauber'
  setState(frageId, {
    status: newStatus,
    pruefungstauglich: result.status === 'sammlung',
  })
  broadcastUpdate(frageId, stateByFrageId.get(frageId)!.state)
}

/**
 * Subscribe-Pattern für UI: callback bekommt aktuellen DraftSyncState pro frageId.
 * Returnt unsubscribe-Function.
 */
export function subscribe(
  frageId: string,
  cb: (state: DraftSyncState) => void,
): () => void {
  const entry = getOrCreate(frageId)
  entry.subscribers.add(cb)
  // BroadcastChannel sicherstellen, damit Multi-Tab-Updates funktionieren
  ensureChannel()
  return () => {
    entry.subscribers.delete(cb)
  }
}

/**
 * Test-only: räumt interne Debouncer + State auf.
 */
export function resetForTesting(): void {
  for (const entry of stateByFrageId.values()) {
    if (entry.idbTimer) clearTimeout(entry.idbTimer)
    if (entry.serverTimer) clearTimeout(entry.serverTimer)
    if (entry.retryTimer) clearTimeout(entry.retryTimer)
  }
  stateByFrageId.clear()
  if (channel) {
    try {
      channel.close()
    } catch {
      // close kann in Stub failen
    }
    channel = null
  }
}
