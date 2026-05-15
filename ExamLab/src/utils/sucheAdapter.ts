import { scoreFromMatch, findeHighlightStellen } from './sucheEngine'
import type { SucheTreffer, SucheIconKey } from '../types/suche'
import type { TabDefinition } from './tabRegistry'
import type { KursDefinition } from '../types/stammdaten'
import type { PruefungsConfig } from '../types/pruefung'
import type { FrageSummary } from '../types/fragen-storage'
import { tagNamenFuerFrage } from './frageTagNamen'

const ROUTE_BUILDERS = {
  einstellungenTab: (tab: TabDefinition) => tab.route,
  hilfeTab: (tab: TabDefinition) => `/einstellungen?hilfe=${encodeURIComponent(tab.id)}`,
  kurs: (_kursId: string) => '/pruefung',
  pruefung: (configId: string) => `/pruefung/${configId}`,
  uebung: (configId: string) => `/uebung/${configId}`,
  frage: (frageId: string) => `/fragensammlung/${frageId}`,
} as const

function tabZuTreffer(
  tab: TabDefinition,
  query: string,
  quelle: 'einstellungen-tab' | 'hilfe-tab',
): SucheTreffer | null {
  const score = scoreFromMatch(tab.titel, query, 'titel')
  if (score === 0) return null
  const iconKey: SucheIconKey = quelle === 'einstellungen-tab' ? 'einstellungen' : 'hilfe'
  const route = quelle === 'einstellungen-tab' ? ROUTE_BUILDERS.einstellungenTab(tab) : ROUTE_BUILDERS.hilfeTab(tab)
  return {
    quelle,
    id: tab.id,
    titel: tab.titel,
    highlightStellen: findeHighlightStellen(tab.titel, query, 'titel'),
    navigation: { route },
    score,
    iconKey,
  }
}

export function indexEinstellungenTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  return tabs
    .map(t => tabZuTreffer(t, query, 'einstellungen-tab'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexHilfeTabs(query: string, tabs: TabDefinition[]): SucheTreffer[] {
  return tabs
    .map(t => tabZuTreffer(t, query, 'hilfe-tab'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexKurse(query: string, kurse: KursDefinition[]): SucheTreffer[] {
  const treffer: SucheTreffer[] = []
  for (const k of kurse) {
    const titel = k.name || k.id
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const idScore = scoreFromMatch(k.id, query, 'id')
    const klassenText = k.klassen.join(' ')
    const klasseScore = klassenText ? scoreFromMatch(klassenText, query, 'tag') : 0
    const fachScore = k.fach ? scoreFromMatch(k.fach, query, 'tag') : 0
    const score = Math.max(titelScore, idScore, klasseScore, fachScore)
    if (score === 0) continue
    treffer.push({
      quelle: 'kurs',
      id: k.id,
      titel,
      subTitel: k.klassen.join(', ') || undefined,
      highlightStellen: findeHighlightStellen(titel, query, 'titel'),
      navigation: { route: ROUTE_BUILDERS.kurs(k.id) },
      score,
      iconKey: 'kurs',
    })
  }
  return treffer
}

function configZuTreffer(
  c: PruefungsConfig,
  query: string,
  quelle: 'pruefung' | 'uebung',
): SucheTreffer | null {
  const titel = c.titel || c.id
  const klasseStr = c.klasse || ''
  const fachStr = c.fach || ''
  const subTitel = [klasseStr, fachStr].filter(Boolean).join(' · ')
  const titelScore = scoreFromMatch(titel, query, 'titel')
  const subScore = subTitel ? scoreFromMatch(subTitel, query, 'subTitel') : 0
  const score = Math.max(titelScore, subScore)
  if (score === 0) return null
  const route = quelle === 'pruefung' ? ROUTE_BUILDERS.pruefung(c.id) : ROUTE_BUILDERS.uebung(c.id)
  return {
    quelle,
    id: c.id,
    titel,
    subTitel: subTitel || undefined,
    highlightStellen: [
      ...findeHighlightStellen(titel, query, 'titel'),
      ...(subTitel ? findeHighlightStellen(subTitel, query, 'subTitel') : []),
    ],
    navigation: { route },
    score,
    iconKey: quelle,
  }
}

export function indexPruefungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  return configs
    .filter(c => c.typ !== 'formativ')
    .map(c => configZuTreffer(c, query, 'pruefung'))
    .filter((t): t is SucheTreffer => t !== null)
}

export function indexUebungen(query: string, configs: PruefungsConfig[]): SucheTreffer[] {
  return configs
    .filter(c => c.typ === 'formativ')
    .map(c => configZuTreffer(c, query, 'uebung'))
    .filter((t): t is SucheTreffer => t !== null)
}

/**
 * Cluster H Phase 2: Tag-Namen für Such-Index. Nutzt `tagNamenFuerFrage`-Helper
 * (tagIds via tagsStore + Legacy-Fallback) und joined zu String.
 *
 * Pure-Helper-Kontext: `getState()` liefert keinen Re-Index bei Tag-Rename
 * mid-typing — akzeptiert, weil Suche bei nächstem Render mit neuem `index` neu läuft.
 */
function tagsAlsText(tagIds: string[] | undefined, legacy: FrageSummary['tags']): string {
  return tagNamenFuerFrage({ tagIds, tags: legacy }).join(' ')
}

export function indexFragen(query: string, fragen: FrageSummary[]): SucheTreffer[] {
  const treffer: SucheTreffer[] = []
  for (const f of fragen) {
    const titel = f.fragetext.length > 80 ? f.fragetext.slice(0, 77) + '…' : f.fragetext
    const titelScore = scoreFromMatch(titel, query, 'titel')
    const idScore = scoreFromMatch(f.id, query, 'id')
    const tagText = tagsAlsText(f.tagIds, f.tags)
    const tagScore = tagText ? scoreFromMatch(tagText, query, 'tag') : 0
    const themaScore = f.thema ? scoreFromMatch(f.thema, query, 'tag') : 0
    const score = Math.max(titelScore, idScore, tagScore, themaScore)
    if (score === 0) continue
    treffer.push({
      quelle: 'frage',
      id: f.id,
      titel,
      subTitel: f.thema || undefined,
      highlightStellen: findeHighlightStellen(titel, query, 'titel'),
      navigation: { route: ROUTE_BUILDERS.frage(f.id) },
      score,
      iconKey: 'frage',
    })
  }
  return treffer
}
