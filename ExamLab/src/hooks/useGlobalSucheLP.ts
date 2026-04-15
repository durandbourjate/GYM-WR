/**
 * Globale Suche für LP-Bereich.
 *
 * Scope-Guard: Nur LP-seitige Daten werden indiziert.
 * Sensible Felder (musterlosung, korrekt, etc.) werden nie durchsucht.
 *
 * Aktuelle Datenquellen:
 *   - Fragensammlung: useFragenbankStore → summaries[] (fragetext, thema, fach)
 *   - Prüfungen: kein zentraler Zustand-Store — TODO: integrieren sobald verfügbar
 *   - Kurse/Übungen: kein zentraler Zustand-Store — TODO: integrieren sobald verfügbar
 */

import { useMemo } from 'react'
import { useFragenbankStore } from '../store/fragenbankStore'
import type { SucheErgebnis, SucheGruppe, Treffer } from './useGlobalSuche.shared'
import { machtMatch } from './useGlobalSuche.shared'

interface Ctx {
  /** Aktueller LP-Modus ('pruefung' | 'uebung' | 'fragensammlung') */
  l1?: string | null
  /** Sub-Tab oder Ansicht */
  l2?: string | null
  /** Kontext-ID (z.B. aktive Kurs-ID oder Thema-ID) */
  l3?: string | null
}

const MAX_TREFFER = 5

export function useGlobalSucheLP(
  such: string,
  kontext: Ctx,
  onNavigate: (path: string) => void,
): SucheErgebnis {
  // Fragensammlung: Summaries sind leichtgewichtig und enthalten keine sensiblen Felder.
  // FrageSummary enthält: id, fragetext, thema, fach, fachbereich — kein musterlosung/korrekt.
  const summaries = useFragenbankStore((s) => s.summaries)

  // TODO(LP-Prüfungen): Kein zentraler Zustand-Store für die Prüfungsliste vorhanden.
  // Prüfungen werden pro Route via pruefungApi.ts geladen und in lokalem React-State gehalten.
  // Sobald ein Store verfügbar ist, hier integrieren.

  // TODO(LP-Kurse/Übungen): Kein zentraler Zustand-Store für Übungskurse vorhanden.
  // Üben-Konfigurationen werden ebenfalls pro Route geladen.

  return useMemo(() => {
    if (!such.trim()) return { gruppen: [], istLadend: false }

    // --- Fragensammlung durchsuchen ---
    const frageTreffer: Treffer[] = []
    for (const s of summaries) {
      if (frageTreffer.length >= MAX_TREFFER) break
      if (machtMatch(such, s.fragetext, s.thema, s.fach, s.fachbereich)) {
        frageTreffer.push({
          id: s.id,
          kategorie: 'frage',
          titel: s.fragetext.length > 80 ? s.fragetext.slice(0, 80) + '…' : s.fragetext,
          meta: [s.fach, s.thema].filter(Boolean).join(' · '),
          onOpen: () => onNavigate(`/fragensammlung?frage=${s.id}`),
        })
      }
    }

    // --- Kontext-Gruppe: Bei Fragensammlung-Modus Treffer im aktiven Kontext hervorheben ---
    const gruppen: SucheGruppe[] = []

    if (kontext.l1 === 'fragensammlung' && kontext.l3 && frageTreffer.length > 0) {
      // Kontext-gefilterte Treffer (Fragen die zum aktiven Thema/Fach passen)
      const kontextTreffer = frageTreffer.filter(
        (t) => t.meta?.includes(kontext.l3 as string),
      )
      if (kontextTreffer.length > 0) {
        gruppen.push({
          id: 'fragensammlung-kontext',
          label: 'Im aktuellen Kontext',
          kontextTag: kontext.l3,
          treffer: kontextTreffer,
        })
      }
    }

    if (frageTreffer.length > 0) {
      gruppen.push({
        id: 'fragensammlung',
        label: 'Fragensammlung',
        treffer: frageTreffer,
      })
    }

    return { gruppen, istLadend: false }
  }, [such, summaries, kontext.l1, kontext.l3, onNavigate])
}
