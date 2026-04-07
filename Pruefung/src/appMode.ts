// Unified Build: Kein Dual-Build mehr. Rolle bestimmt Routing zur Laufzeit.
// APP_MODE wird nur noch für Abwärtskompatibilität beibehalten.
export type AppMode = 'pruefung' | 'lernen'
export const APP_MODE: AppMode = 'pruefung'
export const istPruefung = true
export const istUeben = false
