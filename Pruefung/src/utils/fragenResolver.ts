import type { Frage, AufgabengruppeFrage, InlineTeilaufgabe } from '../types/fragen.ts'
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
        if (frage.typ === 'aufgabengruppe') {
          const ag = frage as AufgabengruppeFrage

          // Neues Format: Inline-Teilaufgaben → als Pseudo-Fragen in alleFragen
          if (ag.teilaufgaben && ag.teilaufgaben.length > 0) {
            for (const ta of ag.teilaufgaben) {
              if (!hinzugefuegt.has(ta.id)) {
                alleFragen.push(inlineTeilaufgabeAlsFrage(ta, ag))
                hinzugefuegt.add(ta.id)
              }
            }
          }

          // Legacy-Format: ID-Referenzen auflösen
          if (ag.teilaufgabenIds && ag.teilaufgabenIds.length > 0) {
            for (const tid of ag.teilaufgabenIds) {
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
  }
  return { navigationsFragen, alleFragen }
}

/**
 * Konvertiert eine InlineTeilaufgabe in ein Frage-ähnliches Objekt für alleFragen.
 * SuS-Komponenten können es via alleFragen.find(id) finden.
 */
function inlineTeilaufgabeAlsFrage(ta: InlineTeilaufgabe, parent: AufgabengruppeFrage): Frage {
  return {
    // FrageBase Pflichtfelder (vom Parent übernommen)
    id: ta.id,
    typ: ta.typ as Frage['typ'],
    version: parent.version,
    erstelltAm: parent.erstelltAm,
    geaendertAm: parent.geaendertAm,
    fachbereich: parent.fachbereich,
    fach: parent.fach,
    thema: parent.thema,
    unterthema: parent.unterthema ?? '',
    bloom: parent.bloom,
    semester: parent.semester,
    gefaesse: parent.gefaesse,
    tags: parent.tags,
    punkte: ta.punkte,
    zeitbedarf: 0,
    musterlosung: '',
    bewertungsraster: [],
    verwendungen: [],
    quelle: parent.quelle,
    autor: parent.autor,
    // Typ-spezifische Felder
    fragetext: ta.fragetext,
    ...(ta.optionen ? { optionen: ta.optionen } : {}),
    ...(ta.mehrfachauswahl != null ? { mehrfachauswahl: ta.mehrfachauswahl, zufallsreihenfolge: false } : {}),
    ...(ta.aussagen ? { aussagen: ta.aussagen } : {}),
    ...(ta.laenge ? { laenge: ta.laenge } : {}),
    ...(ta.textMitLuecken != null ? { textMitLuecken: ta.textMitLuecken } : {}),
    ...(ta.luecken ? { luecken: ta.luecken } : {}),
    ...(ta.paare ? { paare: ta.paare } : {}),
    ...(ta.ergebnisse ? { ergebnisse: ta.ergebnisse } : {}),
    ...(ta.rechenwegErforderlich != null ? { rechenwegErforderlich: ta.rechenwegErforderlich } : {}),
    ...(ta.elemente ? { elemente: ta.elemente } : {}),
    ...(ta.teilpunkte != null ? { teilpunkte: ta.teilpunkte } : {}),
  } as Frage
}
