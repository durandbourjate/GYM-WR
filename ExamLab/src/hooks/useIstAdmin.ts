/**
 * useIstAdmin — Convenience-Hook für den Admin-Status der eingeloggten LP.
 *
 * Cluster H Phase 2 C2: konsumiert `user.adminRolle` aus `useAuthStore` und
 * liefert einen stabilen boolean. Wird primär in der Tag-Verwaltung (TagsListe)
 * für Berechtigungs-Gating der zerstörerischen Aktionen verwendet
 * (Archivieren / Mergen / Hard-Delete sind admin-only — siehe Spec §8).
 */
import { useAuthStore } from '../store/authStore'

export function useIstAdmin(): boolean {
  return useAuthStore((s) => s.user?.adminRolle ?? false)
}
