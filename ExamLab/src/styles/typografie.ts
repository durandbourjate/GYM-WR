/**
 * Zentrale Typografie-Skala (5-Tier-Hierarchie).
 *
 * Verwendung:
 *   import { TYPO } from '@/styles/typografie'
 *   <h1 className={TYPO.display}>Einstellungen</h1>
 *   <h2 className={TYPO.h1}>Mein Profil</h2>
 *
 * Tier-Regeln:
 * - display: genau 1× pro Top-Level-Seite (Page-Title, linke obere Ecke)
 * - h1:      Tab-Haupttitel / Section-Title
 * - h2:      Klar abgesetzte Sub-Sektionen, Dialog-Titel, Karten-Header
 * - body:    Default für Content
 * - caption: Small Labels, Form-Hints, Badge-Text
 */
export const TYPO = {
  display: 'text-2xl font-bold',          // 24 px / 700 — Page-Title
  h1:      'text-xl font-bold',           // 20 px / 700 — Tab-/Section-Title
  h2:      'text-lg font-semibold',       // 18 px / 600 — Sub-Section, Dialog-Title
  body:    'text-sm',                     // 14 px / 400 — Default-Content
  caption: 'text-xs font-medium',         // 12 px / 500 — Labels, Badges, Meta
} as const

export type TypoTier = keyof typeof TYPO
