import { get, set, clear } from 'idb-keyval'
import type { Frage } from '../../types/ueben/fragen'
import type { FragenFortschritt } from '../../types/ueben/fortschritt'
import type { GruppenEinstellungen } from '../../types/ueben/settings'

const PREFIX = 'lp-'

export const db = {
  async getFragen(gruppeId: string): Promise<Frage[] | undefined> {
    return get(`${PREFIX}fragen-${gruppeId}`)
  },
  async setFragen(gruppeId: string, fragen: Frage[]): Promise<void> {
    await set(`${PREFIX}fragen-${gruppeId}`, fragen)
  },
  async getFortschritt(): Promise<Record<string, FragenFortschritt> | undefined> {
    return get(`${PREFIX}fortschritt`)
  },
  async setFortschritt(data: Record<string, FragenFortschritt>): Promise<void> {
    await set(`${PREFIX}fortschritt`, data)
  },
  async getEinstellungen(gruppeId: string): Promise<GruppenEinstellungen | undefined> {
    return get(`${PREFIX}settings-${gruppeId}`)
  },
  async setEinstellungen(gruppeId: string, data: GruppenEinstellungen): Promise<void> {
    await set(`${PREFIX}settings-${gruppeId}`, data)
  },
  async clearAll(): Promise<void> { await clear() },
}
