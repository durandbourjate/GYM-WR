import type { FragenFortschritt } from '../../types/ueben/fortschritt'

/**
 * Mergt den vom Backend geladenen Fortschritt in den lokalen Stand.
 *
 * Pro Frage gewinnt der Eintrag mit mehr `versuche`: so überschreibt der
 * Backend-Stand veraltete lokale Daten (z.B. nach Browser-Wechsel), während
 * noch nicht gesyncte lokale Antworten — die mehr Versuche haben als das
 * Backend kennt — erhalten bleiben. Bei Gleichstand gewinnt das Backend,
 * da es die autoritative Quelle ist.
 */
export function mergeFortschritte(
  lokal: Record<string, FragenFortschritt>,
  backend: FragenFortschritt[],
): Record<string, FragenFortschritt> {
  const merged: Record<string, FragenFortschritt> = { ...lokal }
  for (const b of backend) {
    const l = merged[b.fragenId]
    if (!l || b.versuche >= l.versuche) {
      merged[b.fragenId] = b
    }
  }
  return merged
}
