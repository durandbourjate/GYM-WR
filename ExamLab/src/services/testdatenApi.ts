import { postJson } from './apiClient'

export type SeedMode = 'initial' | 'reset'

export interface SeedStatistik {
  mode: SeedMode
  callerEmail?: string
  stammdatenErgaenzt?: boolean
  klasseAngelegt?: boolean
  kursAngelegt?: boolean
  testLpAngelegt?: boolean
  testSuSAngelegt?: number
  testPruefungenAngelegt?: number
  testAntwortenAngelegt?: number
  testKorrekturenAngelegt?: number
  testUebungenAngelegt?: number
  testSessionsAngelegt?: number
  testFortschrittAngelegt?: number
  geloeschtBeiReset?: Record<string, number | boolean>
  hinweis?: string
  /** ISO-Timestamp des erfolgreichen Seeds (Spawn-Task 17.05.2026). */
  letzterSeedAm?: string
}

export interface LetzterSeedResponse {
  success: boolean
  error?: string
  /** ISO-Timestamp oder leerer String (= noch nie geseedet bzw. nach Backend-Reset). */
  letzterSeedAm?: string
}

export interface SeedResponse {
  success: boolean
  error?: string
  statistik?: SeedStatistik
  dauerMs?: number
}

/**
 * Admin-only Testdaten-Seed/Reset.
 *
 * Backend-Call ist blocking + LockService-geschützt (5s Timeout) — erwartete Dauer ~30s bei initialem Seed.
 * Frontend sollte Loading-State + Disable-Button zeigen.
 *
 * Spec: docs/superpowers/specs/2026-05-11-cluster-f-testdaten-infrastruktur-design.md §5.1
 * Plan: docs/superpowers/plans/2026-05-11-cluster-f-testdaten-f2-backend.md
 */
export async function apiAdminSeedTestdaten(opts: { email: string; mode: SeedMode }): Promise<SeedResponse> {
  const result = await postJson<SeedResponse>('apiAdminSeedTestdaten', { email: opts.email, mode: opts.mode })
  return result ?? { success: false, error: 'Keine Antwort vom Backend' }
}

/**
 * Read-Endpoint fuer den ISO-Timestamp des letzten erfolgreichen Seed/Reset.
 *
 * Auth: alle zugelassenen LPs (nicht nur Admin). Wird im TestdatenTab fuer die
 * „zuletzt: <Datum>"-Anzeige genutzt. Backend speichert in ScriptProperties
 * (TESTDATEN_LETZTER_SEED_AM). Bei nicht-existentem Backend-Endpoint (alter Deploy)
 * fallback auf leeren String — UI rendert dann nur „Initialisiert" ohne Zeitangabe.
 */
export async function apiTestdatenLetzterSeed(opts: { email: string }): Promise<LetzterSeedResponse> {
  const result = await postJson<LetzterSeedResponse>('apiTestdatenLetzterSeed', { email: opts.email })
  return result ?? { success: false, error: 'Keine Antwort vom Backend' }
}
