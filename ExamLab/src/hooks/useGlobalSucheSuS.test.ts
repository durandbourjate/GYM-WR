/**
 * Cluster C.2 §10 Privacy-Pflicht-Test (17.05.2026).
 *
 * Verifiziert dass useGlobalSucheSuS.ts NICHT auf den schueler-Adapter zugreift.
 * SuS dürfen keine anderen Schüler in der Suche sehen — Privacy-Invariant.
 *
 * Test scheitert wenn:
 *   - useGlobalSucheSuS.ts importiert `indexSchueler` aus sucheAdapter
 *   - useGlobalSucheSuS.ts referenziert das schueler-Quelle-Pattern
 *   - klassenlistenStore wird im SuS-Hook angerufen
 *
 * Architektur-Konvention: SuS-Hook nutzt eigenen gruppenStore-only-Pfad ohne
 * Berührung mit sucheAdapter.ts (= Pfad der die schueler-Quelle enthält).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname_ = dirname(__filename)

const hookSource = readFileSync(
  join(__dirname_, 'useGlobalSucheSuS.ts'),
  'utf-8',
)

describe('useGlobalSucheSuS — Privacy-Guard (Cluster C.2)', () => {
  it('importiert KEIN indexSchueler aus sucheAdapter (Privacy-Invariant)', () => {
    expect(hookSource).not.toMatch(/indexSchueler/)
  })

  it('importiert KEIN useKlassenlistenStore (Schüler-Datenquelle)', () => {
    expect(hookSource).not.toMatch(/useKlassenlistenStore|klassenlistenStore/)
  })

  it('importiert KEIN sucheAdapter (potenzieller Vektor für Schüler-Adapter)', () => {
    // Defense-in-Depth: SuS-Hook MUSS eigenen Adapter-Pfad nutzen
    expect(hookSource).not.toMatch(/from\s+['"].*sucheAdapter['"]/)
  })
})
