import type { Frage } from '../../types/fragen-storage'
import { mockCoreFrage } from '@shared/test-helpers/frageCoreMocks'

/**
 * Storage-Variante des Mock-Helpers. Delegiert an `mockCoreFrage` und liefert
 * eine Storage-Frage (strukturell kompatibel — Storage's `tags: (string | Tag)[]`
 * akzeptiert leere Arrays von Core's `string[]`).
 *
 * Verwendung: Tests in `ExamLab/src/`. Tests in `packages/shared/` nutzen
 * direkt `mockCoreFrage`.
 */
export function mockFrage<T extends Frage['typ']>(
  typ: T,
  overrides?: Partial<Extract<Frage, { typ: T }>>
): Extract<Frage, { typ: T }> {
  // Core liefert mit tags: string[]. Storage akzeptiert (string | Tag)[]
  // strukturell — leeres Array ist zuweisbar. Sub-Type-Felder sind identisch.
  const core = mockCoreFrage(typ, overrides as never)
  return core as unknown as Extract<Frage, { typ: T }> /* Defensive: Core→Storage Layer-Boundary, tags-Type ist breiter */
}
