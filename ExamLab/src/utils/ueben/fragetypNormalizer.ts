/**
 * Normalisiert Frage-Daten für den Üben-Modus.
 * Stellt sicher, dass alle erwarteten Felder vorhanden sind,
 * auch wenn das Backend unvollständige Daten liefert.
 */
import type { Frage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, HotspotFrage, BildbeschriftungFrage, DragDropBildFrage } from '../../types/ueben/fragen'

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
      return normalisiereDragDrop(frage as DragDropBildFrage) as Frage
    default:
      return frage
  }
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
      ...b,
      koordinaten: {
        x: normalisiereKoordinate(b.koordinaten?.x),
        y: normalisiereKoordinate(b.koordinaten?.y),
        radius: typeof b.koordinaten?.radius === 'number' ? b.koordinaten.radius : 5,
      },
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

function normalisiereDragDrop(f: DragDropBildFrage): DragDropBildFrage {
  return {
    ...f,
    zielzonen: Array.isArray(f.zielzonen) ? f.zielzonen.map(z => ({
      id: z.id || `zone-${Math.random().toString(36).slice(2, 8)}`,
      position: {
        x: normalisiereKoordinate(z.position?.x),
        y: normalisiereKoordinate(z.position?.y),
        breite: typeof z.position?.breite === 'number' ? z.position.breite : 20,
        hoehe: typeof z.position?.hoehe === 'number' ? z.position.hoehe : 10,
      },
      korrektesLabel: z.korrektesLabel || '',
    })) : [],
    labels: Array.isArray(f.labels) ? f.labels.map(l => typeof l === 'string' ? l : String(l)) : [],
  }
}
