import { useStammdatenStore } from '../store/stammdatenStore'

/**
 * DRY-Selektor für den globalen Sichtbarkeit-Toggle aus dem LP-Profil (F.3 Cluster).
 * Konsumiert von F.4 Read-Pfad-Filtern + TestBadge-Konsumenten.
 */
export function useTestdatenSichtbar(): boolean {
  return useStammdatenStore(s => s.lpProfil?.testdatenSichtbar ?? false)
}
