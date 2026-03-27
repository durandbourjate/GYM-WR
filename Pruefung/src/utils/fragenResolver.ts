import type { Frage } from '../types/fragen.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'

/**
 * Löst Fragen für eine Prüfung auf.
 * Gibt zwei Arrays zurück:
 * - navigationsFragen: Nur die Top-Level-Fragen (1:1 mit fragenIds in abschnitte), für Navigation/Index
 * - alleFragen: Inkl. Teilaufgaben von Aufgabengruppen (für Lookup in AufgabengruppeFrage)
 */
export function resolveFragenFuerPruefung(config: PruefungsConfig, apiFragen: Frage[]): { navigationsFragen: Frage[]; alleFragen: Frage[] } {
  const fragenMap = new Map(apiFragen.map((f) => [f.id, f]))
  const navigationsFragen: Frage[] = []
  const alleFragen: Frage[] = []
  const hinzugefuegt = new Set<string>()

  for (const abschnitt of config.abschnitte) {
    for (const id of abschnitt.fragenIds) {
      const frage = fragenMap.get(id)
      if (frage && !hinzugefuegt.has(id)) {
        navigationsFragen.push(frage)
        alleFragen.push(frage)
        hinzugefuegt.add(id)
        // Aufgabengruppen: Teilaufgaben nur in alleFragen (nicht in Navigation)
        if (frage.typ === 'aufgabengruppe' && 'teilaufgabenIds' in frage) {
          for (const tid of (frage as { teilaufgabenIds: string[] }).teilaufgabenIds) {
            const teilfrage = fragenMap.get(tid)
            if (teilfrage && !hinzugefuegt.has(tid)) {
              alleFragen.push(teilfrage)
              hinzugefuegt.add(tid)
            }
          }
        }
      }
    }
  }
  return { navigationsFragen, alleFragen }
}
