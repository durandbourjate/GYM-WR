export class ApiClient {
  private url: string
  private writeQueue: Promise<unknown> = Promise.resolve()

  constructor(url: string) {
    this.url = url
  }

  istKonfiguriert(): boolean {
    return !!this.url
  }

  async post<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    if (!this.url) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const body = JSON.stringify({
        action,
        ...(sessionToken ? { sessionToken } : {}),
        ...payload,
      })

      const response = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body,
        signal: controller.signal,
      })

      if (!response.ok) return null
      return await response.json() as T
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }

  async postQueued<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    const result = new Promise<T | null>((resolve) => {
      this.writeQueue = this.writeQueue.then(async () => {
        const res = await this.post<T>(action, payload, sessionToken, timeoutMs)
        resolve(res)
      }).catch(() => {
        resolve(null)
      })
    })
    return result
  }

  async get<T = unknown>(
    action: string,
    params: Record<string, string>,
    sessionToken?: string,
    timeoutMs = 30000
  ): Promise<T | null> {
    if (!this.url) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const urlParams = new URLSearchParams({ action, ...params })
      if (sessionToken) urlParams.set('sessionToken', sessionToken)

      const response = await fetch(`${this.url}?${urlParams}`, {
        signal: controller.signal,
      })

      if (!response.ok) return null
      return await response.json() as T
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

// Singleton-Instanz
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
export const apiClient = new ApiClient(APPS_SCRIPT_URL)
