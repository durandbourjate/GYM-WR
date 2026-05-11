/**
 * Generischer Optimistic-Delete-Pattern mit Error-Recovery.
 *
 * Ablauf:
 * 1. `optimisticRemove()` — UI sofort entfernt (vor Backend-Call)
 * 2. `await backendCall()` — Backend persistiert
 * 3a. Bei Erfolg: `onSuccess()` — z.B. Toast-Success
 * 3b. Bei Fehler: `rollback()` + `onError(err)` — z.B. Eintrag wieder einfügen + Toast-Error
 *
 * Caller injiziert Toast-API über `onSuccess`/`onError`, Helper bleibt entkoppelt.
 *
 * @example
 * const detail = useFragensammlungStore.getState().detailCache.get(id)
 * await optimisticDelete({
 *   optimisticRemove: () => store.entferneFrage(id),
 *   backendCall: () => apiService.loescheFrage(email, id, fachbereich),
 *   rollback: () => { if (detail) store.fuegeFragenHinzu([detail]) },
 *   onSuccess: () => toast.success('Entwurf gelöscht'),
 *   onError: () => toast.error('Konnte nicht gelöscht werden — bitte erneut versuchen'),
 * })
 */
export async function optimisticDelete({
  optimisticRemove,
  backendCall,
  rollback,
  onSuccess,
  onError,
}: {
  optimisticRemove: () => void
  backendCall: () => Promise<void>
  rollback: () => void
  onSuccess: () => void
  onError: (err: Error) => void
}): Promise<void> {
  optimisticRemove()
  try {
    await backendCall()
    onSuccess()
  } catch (err) {
    rollback()
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
