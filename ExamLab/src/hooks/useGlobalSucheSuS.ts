/**
 * Globale Suche für SuS-Bereich.
 *
 * Scope-Guard: NUR SuS-seitige Daten (ohne Lösungen).
 * Sensible Felder (musterlosung, korrekt, korrekteAntworten etc.) werden NIE indiziert.
 *
 * Aktuelle Datenquellen:
 *   - Gruppen/Kurse: useUebenGruppenStore → gruppen[] (id, name)
 *   - Prüfungen: kein zentraler Zustand-Store — TODO: integrieren sobald verfügbar
 *   - Themen: kein zentraler Zustand-Store für freigegebene Themen — TODO: fortschrittStore
 *
 * Einschränkungen (Scope-Guard):
 *   - Prüfungen: Nur mit status ∈ ['freigegeben', 'zurueckgegeben', 'abgeschlossen']
 *   - Themen: Nur freigegebene Themen (gesteuert durch useThemenSichtbarkeitStore)
 *   - Keine Lösungsfelder (INDEX_BLACKLIST)
 */

import { useMemo } from 'react'
import { useUebenGruppenStore } from '../store/ueben/gruppenStore'
import type { SucheErgebnis, SucheGruppe, Treffer } from './useGlobalSuche.shared'
import { machtMatch } from './useGlobalSuche.shared'

interface Ctx {
  /** Aktueller SuS-Screen ('dashboard' | 'uebung' | 'pruefung' | ...) */
  l1?: string | null
  /** Sub-Ansicht */
  l2?: string | null
  /** Aktive Kurs-ID oder Thema-ID */
  l3?: string | null
}

const MAX_TREFFER = 5

export function useGlobalSucheSuS(
  such: string,
  kontext: Ctx,
  onNavigate: (path: string) => void,
): SucheErgebnis {
  // SuS-Gruppen/Kurse: id + name — keine sensiblen Felder
  const gruppen = useUebenGruppenStore((s) => s.gruppen)

  // TODO(SuS-Prüfungen): Kein zentraler Zustand-Store für SuS-Prüfungen.
  // AktivePruefungen.tsx holt sie per API in lokalem React-State.
  // Wenn integriert: Nur status ∈ ['freigegeben', 'zurueckgegeben', 'abgeschlossen'] zeigen.

  // TODO(SuS-Themen): Freigegebene Themen liegen im useThemenSichtbarkeitStore,
  // aber ohne Fragetext-Index. Sobald ein Thema-Label-Store verfügbar ist, hier integrieren.
  // Nur freigegebene Themen (sichtbar=true) einbeziehen.

  return useMemo(() => {
    if (!such.trim()) return { gruppen: [], istLadend: false }

    // --- Gruppen/Kurse durchsuchen ---
    const kursTreffer: Treffer[] = []
    for (const g of gruppen) {
      if (kursTreffer.length >= MAX_TREFFER) break
      if (machtMatch(such, g.name, g.id)) {
        kursTreffer.push({
          id: g.id,
          kategorie: 'kurs',
          titel: g.name,
          meta: g.typ === 'familie' ? 'Familie' : 'Schulkurs',
          onOpen: () => onNavigate(`/sus/ueben/kurs/${g.id}`),
        })
      }
    }

    const sucheGruppen: SucheGruppe[] = []

    if (kursTreffer.length > 0) {
      sucheGruppen.push({
        id: 'kurse',
        label: 'Kurse',
        treffer: kursTreffer,
      })
    }

    return { gruppen: sucheGruppen, istLadend: false }
  }, [such, gruppen, kontext.l1, kontext.l3, onNavigate])
}
