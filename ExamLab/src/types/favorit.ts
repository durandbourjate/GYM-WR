/**
 * Favorit — Account-verknüpfter Eintrag in LPProfil.favoriten (cross-device).
 * Diskriminator `typ` unterscheidet App-Orte von Inhalten.
 * Cluster E.3 (17.05.2026): aus favoritenStore.ts extrahiert, um circular import
 * `stammdaten.ts ← favoritenStore.ts ← stammdaten.ts` zu vermeiden.
 */
export interface Favorit {
  typ: 'ort' | 'pruefung' | 'uebung' | 'frage' | 'einstellungen-tab' | 'hilfe-tab'
  ziel: string       // Route-Pfad oder Config-ID
  label: string      // Anzeigename
  icon?: string      // Lucide-Component-Name (canonical seit v2 17.05.2026)
  sortierung: number
}
