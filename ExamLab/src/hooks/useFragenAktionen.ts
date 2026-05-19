import { useState, useCallback } from 'react'
import { apiService } from '../services/apiService.ts'
import { useFragensammlungStore } from '../store/fragensammlungStore.ts'
import { useToast } from '@gymhofwil/shared'
import { optimisticDelete } from '../utils/optimisticDelete'
import type { Frage, FrageSummary } from '../types/fragen-storage'

interface UseFragenAktionenOptions {
  user: { email: string } | null
  istDemoModus: boolean
  onFrageAktualisiert?: (frage: Frage) => void
}

interface LoeschKandidat {
  id: string
  fachbereich: string
  typ: string
  fragetext?: string
}

interface UseFragenAktionenResult {
  loeschKandidat: LoeschKandidat | null
  setLoeschKandidat: (frage: Frage | FrageSummary) => void
  abbrechenLoeschen: () => void
  bestaetigenLoeschen: () => Promise<void>
  importieren: (importierteFragen: Frage[]) => Promise<void>
  duplizieren: (frage: Frage | FrageSummary) => Promise<void>
}

export function useFragenAktionen({ user, istDemoModus, onFrageAktualisiert }: UseFragenAktionenOptions): UseFragenAktionenResult {
  const [loeschKandidat, setLoeschKandidatState] = useState<LoeschKandidat | null>(null)
  const toast = useToast()

  const setLoeschKandidat = useCallback((frage: Frage | FrageSummary) => {
    setLoeschKandidatState({
      id: frage.id,
      fachbereich: frage.fachbereich,
      typ: frage.typ,
      fragetext: 'fragetext' in frage ? (frage as { fragetext: string }).fragetext : '',
    })
  }, [])

  const abbrechenLoeschen = useCallback(() => {
    setLoeschKandidatState(null)
  }, [])

  const bestaetigenLoeschen = useCallback(async (): Promise<void> => {
    if (!loeschKandidat) return
    const store = useFragensammlungStore.getState()
    const frage = loeschKandidat
    const detailSnapshot = store.getDetail(frage.id)  // Snapshot für Rollback
    setLoeschKandidatState(null)

    // Demo-Modus oder offline: nur lokal entfernen, kein Backend, kein Rollback nötig
    if (!user || !apiService.istKonfiguriert() || istDemoModus) {
      store.entferneFrage(frage.id)
      return
    }

    await optimisticDelete({
      optimisticRemove: () => store.entferneFrage(frage.id),
      backendCall: async () => {
        const ok = await apiService.loescheFrage(user.email, frage.id, frage.fachbereich)
        if (!ok) throw new Error('Backend-Löschen fehlgeschlagen')
      },
      rollback: () => {
        if (detailSnapshot) store.fuegeFragenHinzu([detailSnapshot])
      },
      onSuccess: () => toast.success('Frage gelöscht'),
      onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
    })
  }, [loeschKandidat, user, istDemoModus, toast])

  const importieren = useCallback(async (importierteFragen: Frage[]): Promise<void> => {
    const { fuegeFragenHinzu } = useFragensammlungStore.getState()
    fuegeFragenHinzu(importierteFragen)

    // fragenMap im Composer synchronisieren
    for (const frage of importierteFragen) {
      onFrageAktualisiert?.(frage)
    }

    // Ans Backend senden (im Hintergrund)
    if (user && apiService.istKonfiguriert() && !istDemoModus) {
      for (const frage of importierteFragen) {
        const ok = await apiService.speichereFrage(user.email, frage)
        if (!ok) {
          console.warn(`[useFragenAktionen] Import: Backend-Speichern fehlgeschlagen für ${frage.id}`)
        }
      }
    }
  }, [user, istDemoModus, onFrageAktualisiert])

  const duplizieren = useCallback(async (frage: Frage | FrageSummary): Promise<void> => {
    if (!user) return

    if (istDemoModus || !apiService.istKonfiguriert()) {
      // Demo: Lokale Kopie erstellen
      const detail = useFragensammlungStore.getState().getDetail(frage.id)
      if (detail) {
        const kopie = { ...structuredClone(detail), id: `kopie-${Date.now()}`, autor: user.email } as Frage
        useFragensammlungStore.getState().fuegeFragenHinzu([kopie])
      }
      return
    }

    const neueId = await apiService.dupliziereFrage(user.email, frage.id)
    if (neueId) {
      // Fragensammlung neu laden um die Kopie anzuzeigen
      await useFragensammlungStore.getState().lade(user.email, true)
    }
  }, [user, istDemoModus])

  return { loeschKandidat, setLoeschKandidat, abbrechenLoeschen, bestaetigenLoeschen, importieren, duplizieren }
}
