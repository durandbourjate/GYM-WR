import { create } from 'zustand'
import type { FragenFortschritt, MasteryStufe, ThemenFortschritt, SessionEintrag } from '../../types/ueben/fortschritt'
import type { Frage } from '../../types/ueben/fragen'
import type { Lernziel } from '@shared/types/fragen'
import { aktualisiereFortschritt } from '../../utils/ueben/mastery'
import { db } from '../../utils/ueben/indexedDB'
import { uebenFortschrittAdapter } from '../../adapters/ueben/appsScriptAdapter'
import { useUebenSettingsStore } from './settingsStore'
import { useUebenGruppenStore } from './gruppenStore'

const STORAGE_KEY = 'ueben-fortschritt'
const SYNC_QUEUE_KEY = 'ueben-fortschritt-sync-queue'
const SYNC_DEBOUNCE_MS = 5000

/** Pendente Antworten für Backend-Sync */
interface PendenteAntwort {
  fragenId: string
  korrekt: boolean
  sessionId: string
}

let syncTimer: ReturnType<typeof setTimeout> | null = null

/** Queue aus localStorage laden */
function ladeSyncQueue(): PendenteAntwort[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/** Queue in localStorage speichern */
function speichereSyncQueue(queue: PendenteAntwort[]) {
  try { localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue)) } catch { /* quota */ }
}

/** Queue zum Backend senden und leeren */
async function flushSyncQueue(gruppeId: string, email: string): Promise<void> {
  const queue = ladeSyncQueue()
  if (queue.length === 0) return

  try {
    const erfolg = await uebenFortschrittAdapter.speichereFortschritt(gruppeId, email, queue)
    if (erfolg) {
      localStorage.removeItem(SYNC_QUEUE_KEY)
      console.log(`[Fortschritt] ${queue.length} Antworten zum Backend gesynced`)
    }
  } catch (err) {
    console.warn('[Fortschritt] Backend-Sync fehlgeschlagen, Queue bleibt erhalten:', err)
  }
}

/** Debounced Sync starten */
function scheduleSyncFlush(gruppeId: string, email: string) {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    flushSyncQueue(gruppeId, email)
    syncTimer = null
  }, SYNC_DEBOUNCE_MS)
}

interface UebenFortschrittState {
  fortschritte: Record<string, FragenFortschritt>

  antwortVerarbeiten: (fragenId: string, email: string, korrekt: boolean, sessionId: string) => void
  ladeFortschritt: () => Promise<void>
  getMastery: (fragenId: string) => MasteryStufe
  getFortschritt: (fragenId: string) => FragenFortschritt | null
  getThemenFortschritt: (fragen: Frage[]) => ThemenFortschritt

  // Admin-Daten (Gruppen-Fortschritt aller SuS)
  gruppenFortschritt: Record<string, FragenFortschritt[]>
  gruppenSessions: Record<string, SessionEintrag[]>
  lernziele: Lernziel[]

  // Admin-Actions
  ladeGruppenFortschritt: (gruppeId: string) => Promise<void>
  ladeLernziele: (gruppeId: string) => Promise<void>

  // Selektoren
  getFortschrittFuerSuS: (gruppeId: string, email: string) => FragenFortschritt[]
  getSessionsFuerSuS: (gruppeId: string, email: string) => SessionEintrag[]
}

function speichereInLocalStorage(fortschritte: Record<string, FragenFortschritt>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fortschritte))
  } catch {
    // localStorage voll — graceful degradation
  }
  // Zusätzlich in IndexedDB speichern (fire-and-forget)
  db.setFortschritt(fortschritte).catch(() => {})
}

export const useUebenFortschrittStore = create<UebenFortschrittState>((set, get) => ({
  fortschritte: {},

  antwortVerarbeiten: (fragenId, email, korrekt, sessionId) => {
    const aktuell = get().fortschritte[fragenId] || {
      fragenId,
      email,
      versuche: 0,
      richtig: 0,
      richtigInFolge: 0,
      sessionIds: [],
      letzterVersuch: '',
      mastery: 'neu' as MasteryStufe,
    }

    const schwellwerte = useUebenSettingsStore.getState().einstellungen?.masterySchwellwerte
    const aktualisiert = aktualisiereFortschritt(aktuell, korrekt, sessionId, schwellwerte)
    const neueFortschritte = { ...get().fortschritte, [fragenId]: aktualisiert }

    set({ fortschritte: neueFortschritte })
    speichereInLocalStorage(neueFortschritte)

    // Backend-Sync: Antwort in Queue legen + debounced senden
    const queue = ladeSyncQueue()
    queue.push({ fragenId, korrekt, sessionId })
    speichereSyncQueue(queue)

    // Gruppe + Email für den Sync holen
    const aktiveGruppe = useUebenGruppenStore.getState().aktiveGruppe
    if (aktiveGruppe?.id && email) {
      scheduleSyncFlush(aktiveGruppe.id, email)
    }
  },

  ladeFortschritt: async () => {
    // IndexedDB zuerst versuchen
    try {
      const idbData = await db.getFortschritt()
      if (idbData && Object.keys(idbData).length > 0) {
        set({ fortschritte: idbData })
        return
      }
    } catch { /* Fallback auf localStorage */ }

    // Fallback: localStorage
    try {
      const gespeichert = localStorage.getItem(STORAGE_KEY)
      if (!gespeichert) return
      const parsed = JSON.parse(gespeichert) as Record<string, FragenFortschritt>
      set({ fortschritte: parsed })
      // Migration zu IndexedDB
      db.setFortschritt(parsed).catch(() => {})
    } catch { /* Korrupte Daten — ignorieren */ }
  },

  getMastery: (fragenId) => {
    return get().fortschritte[fragenId]?.mastery || 'neu'
  },

  getFortschritt: (fragenId) => {
    return get().fortschritte[fragenId] || null
  },

  getThemenFortschritt: (fragen) => {
    if (fragen.length === 0) return { fach: '', thema: '', gesamt: 0, neu: 0, ueben: 0, gefestigt: 0, gemeistert: 0, quote: 0 }

    const fortschritte = get().fortschritte
    let neu = 0, ueben = 0, gefestigt = 0, gemeistert = 0

    for (const f of fragen) {
      const mastery = fortschritte[f.id]?.mastery || 'neu'
      switch (mastery) {
        case 'neu': neu++; break
        case 'ueben': ueben++; break
        case 'gefestigt': gefestigt++; break
        case 'gemeistert': gemeistert++; break
      }
    }

    const gesamt = fragen.length
    const quote = gesamt > 0 ? ((gefestigt + gemeistert) / gesamt) * 100 : 0

    return {
      fach: fragen[0].fach,
      thema: fragen[0].thema,
      gesamt,
      neu,
      ueben,
      gefestigt,
      gemeistert,
      quote,
    }
  },

  // Admin-Daten
  gruppenFortschritt: {},
  gruppenSessions: {},
  lernziele: [],

  ladeGruppenFortschritt: async (gruppeId) => {
    if (get().gruppenFortschritt[gruppeId]) return // gecacht
    try {
      const { fortschritte, sessions } = await uebenFortschrittAdapter.ladeGruppenFortschritt(gruppeId)
      set({
        gruppenFortschritt: { ...get().gruppenFortschritt, [gruppeId]: fortschritte },
        gruppenSessions: { ...get().gruppenSessions, [gruppeId]: sessions },
      })
    } catch (e) {
      console.error('Gruppen-Fortschritt laden fehlgeschlagen:', e)
    }
  },

  ladeLernziele: async (gruppeId) => {
    try {
      const lernziele = await uebenFortschrittAdapter.ladeLernziele(gruppeId)
      set({ lernziele })
    } catch (e) {
      console.error('Lernziele laden fehlgeschlagen:', e)
    }
  },

  getFortschrittFuerSuS: (gruppeId, email) => {
    return (get().gruppenFortschritt[gruppeId] || []).filter(fp => fp.email === email)
  },

  getSessionsFuerSuS: (gruppeId, email) => {
    return (get().gruppenSessions[gruppeId] || []).filter(s => s.email === email)
  },
}))
