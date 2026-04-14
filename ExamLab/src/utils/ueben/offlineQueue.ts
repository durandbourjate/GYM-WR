import { get, set } from 'idb-keyval'

interface QueueItem {
  id: string
  action: string
  payload: Record<string, unknown>
  timestamp: string
}

const QUEUE_KEY = 'lp-offline-queue'

export async function enqueue(action: string, payload: Record<string, unknown>): Promise<void> {
  const queue = await getQueue()
  queue.push({ id: crypto.randomUUID(), action, payload, timestamp: new Date().toISOString() })
  await set(QUEUE_KEY, queue)
}

export async function getQueue(): Promise<QueueItem[]> {
  return (await get(QUEUE_KEY)) || []
}

export async function clearQueue(): Promise<void> { await set(QUEUE_KEY, []) }

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue()
  await set(QUEUE_KEY, queue.filter(item => item.id !== id))
}
