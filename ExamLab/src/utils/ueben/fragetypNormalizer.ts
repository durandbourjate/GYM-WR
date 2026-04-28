/**
 * Normalisiert Frage-Daten für den Üben-Modus.
 * Stellt sicher, dass alle erwarteten Felder vorhanden sind,
 * auch wenn das Backend unvollständige Daten liefert.
 */
import type { Frage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, HotspotFrage, BildbeschriftungFrage, DragDropBildFrage, DragDropBildLabel, DragDropBildZielzone, LueckentextFrage } from '../../types/ueben/fragen'
import { stabilId } from '../../../../packages/shared/src/utils/stabilId'

// BuchungssatzFrage-Typ aus shared fragen importieren
interface BuchungssatzFrageMinimal {
  typ: 'buchungssatz'
  buchungen?: unknown[]
  kontenauswahl?: { modus?: string; konten?: string[]; zeigeKategoriefarben?: boolean }
  [key: string]: unknown
}

/** Normalisiert eine Frage für die Üben-Komponente */
export function normalisiereFrageDaten(frage: Frage): Frage {
  switch (frage.typ) {
    case 'buchungssatz':
      return normalisiereBuchungssatz(frage as unknown as BuchungssatzFrageMinimal) as unknown as Frage
    case 'tkonto':
      return normalisiereTKonto(frage as TKontoFrage) as Frage
    case 'kontenbestimmung':
      return normalisiereKontenbestimmung(frage as KontenbestimmungFrage) as Frage
    case 'bilanzstruktur':
      return normalisiereBilanz(frage as BilanzERFrage) as Frage
    case 'hotspot':
      return normalisiereHotspot(frage as HotspotFrage) as Frage
    case 'bildbeschriftung':
      return normalisiereBildbeschriftung(frage as BildbeschriftungFrage) as Frage
    case 'dragdrop_bild':
      return normalisiereDragDropBild(frage as DragDropBildFrage) as Frage
    case 'lueckentext':
      return normalisiereLueckentext(frage as LueckentextFrage) as Frage
    case 'mc':
      return normalisiereMc(frage) as Frage
    case 'richtigfalsch':
      return normalisiereRichtigFalsch(frage as any) as Frage
    case 'sortierung':
      return normalisiereSortierung(frage as any) as Frage
    case 'zuordnung':
      return normalisiereZuordnung(frage as any) as Frage
    default:
      return frage
  }
}

function normalisiereSortierung(f: any): any {
  return { ...f, elemente: Array.isArray(f.elemente) ? f.elemente : [] }
}

function normalisiereZuordnung(f: any): any {
  const paare = Array.isArray(f.paare) ? f.paare : []
  const linksItems = Array.isArray(f.linksItems)
    ? f.linksItems
    : paare.map((p: any, i: number) => ({ id: p.id || `L${i}`, text: p.links }))
  const rechtsItems = Array.isArray(f.rechtsItems)
    ? f.rechtsItems
    : paare.map((p: any, i: number) => ({ id: p.id || `R${i}`, text: p.rechts }))
  return { ...f, paare, linksItems, rechtsItems }
}

function normalisiereMc(f: any): any {
  const optionen = Array.isArray(f.optionen) ? f.optionen : []
  return {
    ...f,
    optionen: optionen.map((o: any) => ({
      ...o,
      korrekt: typeof o.korrekt === 'boolean' ? o.korrekt : false,
    })),
  }
}

function normalisiereRichtigFalsch(f: any): any {
  const aussagen = Array.isArray(f.aussagen) ? f.aussagen : []
  return {
    ...f,
    aussagen: aussagen.map((a: any) => ({
      ...a,
      korrekt: typeof a.korrekt === 'boolean' ? a.korrekt : false,
    })),
  }
}

export function normalisiereLueckentext(f: LueckentextFrage): LueckentextFrage {
  const raw = Array.isArray(f.luecken) ? f.luecken : []
  const luecken = raw.map((l, index) => {
    const rohKorrekt = (l as { korrekteAntworten?: unknown; korrekt?: unknown; antwort?: unknown; alternativen?: unknown }).korrekteAntworten
      ?? (l as { korrekt?: unknown }).korrekt
      ?? (l as { antwort?: unknown }).antwort
    const alternativen = (l as { alternativen?: unknown }).alternativen
    const korrekteAntworten: string[] = Array.isArray(rohKorrekt)
      ? rohKorrekt.map(String)
      : typeof rohKorrekt === 'string'
        ? [rohKorrekt, ...(Array.isArray(alternativen) ? alternativen.map(String) : [])]
        : []
    return {
      ...l,
      id: l.id || `luecke-${index}`,
      korrekteAntworten,
      caseSensitive: l.caseSensitive ?? false,
    }
  })

  // Modus-Default: expliziter Wert > dropdownOptionen-Heuristik > 'freitext'
  const explizit = (f as { lueckentextModus?: unknown }).lueckentextModus
  let lueckentextModus: 'freitext' | 'dropdown'
  if (explizit === 'freitext' || explizit === 'dropdown') {
    lueckentextModus = explizit
  } else {
    const hatDropdowns = luecken.some(l => Array.isArray(l.dropdownOptionen) && l.dropdownOptionen.length > 0)
    lueckentextModus = hatDropdowns ? 'dropdown' : 'freitext'
  }

  return { ...f, luecken, lueckentextModus }
}

function normalisiereBuchungssatz(f: BuchungssatzFrageMinimal): BuchungssatzFrageMinimal {
  // Buchungen sicherstellen
  const buchungen = Array.isArray(f.buchungen) ? f.buchungen : []

  // Kontenauswahl: Fallback auf Vollmodus (KMU-Kontenrahmen) wenn nicht vorhanden
  let kontenauswahl = f.kontenauswahl
  if (!kontenauswahl || typeof kontenauswahl !== 'object') {
    kontenauswahl = { modus: 'voll' }
  }
  // Sicherstellen dass modus gesetzt ist
  if (!kontenauswahl.modus) {
    kontenauswahl = { ...kontenauswahl, modus: 'voll' }
  }

  return { ...f, buchungen, kontenauswahl }
}

function normalisiereTKonto(f: TKontoFrage): TKontoFrage {
  // Konten-Definitionen sicherstellen — Backend kann "nr" statt "kontonummer" liefern
  const rawKonten = Array.isArray(f.konten) ? f.konten : []
  const konten = rawKonten.map(k => {
    const raw = k as unknown as Record<string, unknown>
    return {
      ...k,
      id: k.id || String(raw.nr || ''),
      kontonummer: k.kontonummer || String(raw.nr || raw.name || ''),
    }
  })

  // Kontenauswahl: Null/undefined-Einträge filtern, dann ggf. Fallback
  let kontenauswahl = f.kontenauswahl
  const vorhandeneKonten = kontenauswahl?.konten?.filter((k): k is string => k != null && k !== undefined) ?? []
  if (!kontenauswahl || vorhandeneKonten.length === 0) {
    // Fallback: Alle definierten Konten als Auswahl-Optionen (mit nr+name als Objekte)
    const raw = rawKonten as unknown as Record<string, unknown>[]
    const kontenObjekte = raw.map(k => ({
      nr: String(k.nr || k.kontonummer || ''),
      name: String(k.name || k.nr || k.kontonummer || ''),
    })).filter(k => k.nr)
    // kontenauswahl.konten ist string[], aber normalizeKonten akzeptiert auch Objekte
    kontenauswahl = {
      ...kontenauswahl,
      konten: kontenObjekte as unknown as string[],
    }
    if (kontenObjekte.length === 0) {
      console.warn('[fragetypNormalizer] T-Konto ohne Konten-Definitionen:', f.id)
    }
  } else {
    kontenauswahl = { ...kontenauswahl, konten: vorhandeneKonten }
  }

  return {
    ...f,
    konten,
    geschaeftsfaelle: Array.isArray(f.geschaeftsfaelle) ? f.geschaeftsfaelle : [],
    kontenauswahl,
  }
}

function normalisiereKontenbestimmung(f: KontenbestimmungFrage): KontenbestimmungFrage {
  // Aufgaben sicherstellen
  const aufgaben = Array.isArray(f.aufgaben) ? f.aufgaben.map(a => ({
    ...a,
    erwarteteAntworten: Array.isArray(a.erwarteteAntworten) ? a.erwarteteAntworten : [{}],
  })) : []

  // Kontenauswahl sicherstellen
  let kontenauswahl = f.kontenauswahl
  if (!kontenauswahl || !Array.isArray(kontenauswahl.konten) || kontenauswahl.konten.length === 0) {
    console.warn('[fragetypNormalizer] Kontenbestimmung ohne Kontenauswahl:', f.id)
    kontenauswahl = { ...kontenauswahl, konten: [] }
  }

  return { ...f, aufgaben, kontenauswahl }
}

function normalisiereBilanz(f: BilanzERFrage): BilanzERFrage {
  // Konten normalisieren — Pool-Daten können alternative Feldnamen haben
  const rawKonten = Array.isArray(f.kontenMitSaldi) ? f.kontenMitSaldi : []
  const kontenMitSaldi = rawKonten.map(k => {
    const raw = k as unknown as Record<string, unknown>
    return {
      kontonummer: String(raw.kontonummer || raw.nr || raw.nummer || raw.konto || ''),
      name: String(raw.name || raw.bezeichnung || raw.kontoname || raw.kontonummer || raw.nr || ''),
      saldo: typeof raw.saldo === 'number' ? raw.saldo
        : typeof raw.betrag === 'number' ? raw.betrag
        : parseFloat(String(raw.saldo ?? raw.betrag ?? 0)) || 0,
    }
  })

  if (kontenMitSaldi.length === 0) {
    console.warn('[fragetypNormalizer] Bilanzstruktur ohne kontenMitSaldi:', f.id)
  }

  return {
    ...f,
    kontenMitSaldi,
    modus: f.modus || 'bilanz',
    loesung: f.loesung || { bilanz: undefined, erfolgsrechnung: undefined },
    bewertungsoptionen: f.bewertungsoptionen || {},
  }
}

/** Koordinaten normalisieren: Werte 0-1 → 0-100 (Prozent) */
function normalisiereKoordinate(wert: number | undefined): number {
  if (typeof wert !== 'number') return 0
  // Werte zwischen 0 und 1 (exklusiv) → auf 0-100 skalieren
  if (wert > 0 && wert < 1) return wert * 100
  return wert
}

function normalisiereHotspot(f: HotspotFrage): HotspotFrage {
  return {
    ...f,
    bereiche: Array.isArray(f.bereiche) ? f.bereiche.map(b => ({
      id: b.id,
      form: b.form === 'polygon' ? 'polygon' : 'rechteck',
      punkte: Array.isArray((b as any).punkte) && (b as any).punkte.every((p: any) => typeof p?.x === 'number' && typeof p?.y === 'number')
        ? (b as any).punkte.map((p: any) => ({ x: normalisiereKoordinate(p.x), y: normalisiereKoordinate(p.y) }))
        : [],
      label: b.label ?? '',
      punktzahl: typeof (b as any).punktzahl === 'number' ? (b as any).punktzahl : 1,
    })) : [],
  }
}

function normalisiereBildbeschriftung(f: BildbeschriftungFrage): BildbeschriftungFrage {
  return {
    ...f,
    beschriftungen: Array.isArray(f.beschriftungen) ? f.beschriftungen.map(b => ({
      id: b.id || `label-${Math.random().toString(36).slice(2, 8)}`,
      position: {
        x: normalisiereKoordinate(b.position?.x),
        y: normalisiereKoordinate(b.position?.y),
      },
      korrekt: Array.isArray(b.korrekt) ? b.korrekt : (typeof b.korrekt === 'string' ? [b.korrekt] : []),
    })) : [],
  }
}

export function normalisiereDragDropBild(frage: any): DragDropBildFrage {
  const labels: DragDropBildLabel[] = (frage.labels ?? []).map((l: any, i: number) => {
    if (typeof l === 'string') {
      return { id: stabilId(frage.id, l, i), text: l }
    }
    if (l && typeof l === 'object' && typeof l.text === 'string') {
      return { id: l.id ?? stabilId(frage.id, l.text, i), text: l.text }
    }
    return { id: stabilId(frage.id, '', i), text: '' }
  })
  const zielzonen: DragDropBildZielzone[] = (frage.zielzonen ?? []).map((z: any) => ({
    ...z,
    id: z.id || `zone-${Math.random().toString(36).slice(2, 8)}`,
    form: z.form === 'polygon' ? 'polygon' : 'rechteck',
    punkte: Array.isArray(z.punkte) && z.punkte.every((p: any) => typeof p?.x === 'number' && typeof p?.y === 'number')
      ? z.punkte.map((p: any) => ({ x: normalisiereKoordinate(p.x), y: normalisiereKoordinate(p.y) }))
      : [],
    korrekteLabels: Array.isArray(z.korrekteLabels) && z.korrekteLabels.length > 0
      ? z.korrekteLabels.map((s: string) => String(s))
      : z.korrektesLabel
        ? [String(z.korrektesLabel)]
        : [],
  }))
  return { ...frage, labels, zielzonen }
}

type DragDropBildAntwort = { typ: 'dragdrop_bild'; zuordnungen: Record<string, string> }

export function normalisiereDragDropAntwort(
  antwort: DragDropBildAntwort,
  frage: DragDropBildFrage,
): DragDropBildAntwort {
  const labelById = new Map(frage.labels.map(l => [l.id, l]))
  const labelByText = new Map<string, string>()
  for (const l of frage.labels) {
    const k = (l.text ?? '').trim().toLowerCase()
    if (k && !labelByText.has(k)) labelByText.set(k, l.id)
  }
  const out: Record<string, string> = {}
  for (const [key, zoneId] of Object.entries(antwort.zuordnungen ?? {})) {
    if (labelById.has(key)) {
      out[key] = zoneId
    } else {
      const id = labelByText.get(key.trim().toLowerCase())
      if (id) out[id] = zoneId
    }
  }
  return { ...antwort, zuordnungen: out }
}
