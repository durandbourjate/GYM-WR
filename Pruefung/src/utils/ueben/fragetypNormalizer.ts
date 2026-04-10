/**
 * Normalisiert Frage-Daten für den Üben-Modus.
 * Stellt sicher, dass alle erwarteten Felder vorhanden sind,
 * auch wenn das Backend unvollständige Daten liefert.
 */
import type { Frage, TKontoFrage, KontenbestimmungFrage, BilanzERFrage, HotspotFrage, BildbeschriftungFrage, DragDropBildFrage } from '../../types/ueben/fragen'

/** Normalisiert eine Frage für die Üben-Komponente */
export function normalisiereFrageDaten(frage: Frage): Frage {
  switch (frage.typ) {
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

function normalisiereTKonto(f: TKontoFrage): TKontoFrage {
  // Konten-Definitionen sicherstellen
  const konten = Array.isArray(f.konten) ? f.konten : []

  // Kontenauswahl: Wenn leer → aus den definierten Konten selbst ableiten
  let kontenauswahl = f.kontenauswahl
  if (!kontenauswahl || !Array.isArray(kontenauswahl.konten) || kontenauswahl.konten.length === 0) {
    // Fallback: Alle definierten Konten als Auswahl-Optionen
    const kontenListe = konten.map(k => k.kontonummer)
    kontenauswahl = {
      ...kontenauswahl,
      konten: kontenListe,
    }
    if (kontenListe.length === 0) {
      console.warn('[fragetypNormalizer] T-Konto ohne Konten-Definitionen:', f.id)
    }
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
  return {
    ...f,
    kontenMitSaldi: Array.isArray(f.kontenMitSaldi) ? f.kontenMitSaldi.map(k => ({
      kontonummer: String(k.kontonummer || ''),
      name: k.name || '',
      saldo: typeof k.saldo === 'number' ? k.saldo : parseFloat(String(k.saldo)) || 0,
    })) : [],
    modus: f.modus || 'bilanz',
    loesung: f.loesung || { bilanz: undefined, erfolgsrechnung: undefined },
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
