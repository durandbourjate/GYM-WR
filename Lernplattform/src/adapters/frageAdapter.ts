/**
 * Type-Adapter: Konvertiert zwischen LP-Frage (flach) und Shared-Frage (Inheritance-basiert).
 *
 * LP hat ein einziges Frage-Interface mit optionalen Feldern pro Typ.
 * Shared hat discriminated unions (MCFrage, FreitextFrage, etc.) mit FrageBase.
 */
import type { Frage as SharedFrage, Fachbereich, BloomStufe, MCOption, Bewertungskriterium } from '@shared/types/fragen'
import type { Frage as LernFrage } from '../types/fragen'

// === Typ-Mapping LP ↔ Shared ===

const TYP_LP_ZU_SHARED: Record<string, string> = {
  mc: 'mc',
  multi: 'mc',
  tf: 'richtigfalsch',
  fill: 'lueckentext',
  calc: 'berechnung',
  sort: 'sortierung',
  sortierung: 'sortierung',
  open: 'freitext',
  zeichnen: 'visualisierung',
  bilanz: 'bilanzstruktur',
  gruppe: 'aufgabengruppe',
  // Identische Bezeichnungen (kein Mapping nötig):
  // buchungssatz, tkonto, kontenbestimmung, hotspot,
  // bildbeschriftung, dragdrop_bild, formel, pdf, audio, code, zuordnung
}

const TYP_SHARED_ZU_LP: Record<string, string> = {
  richtigfalsch: 'tf',
  lueckentext: 'fill',
  berechnung: 'calc',
  freitext: 'open',
  visualisierung: 'zeichnen',
  bilanzstruktur: 'bilanz',
  aufgabengruppe: 'gruppe',
  // mc → mc oder multi: Spezialfall, wird über mehrfachauswahl entschieden
}

// Gültige Fachbereiche für Shared
const GUELTIGE_FACHBEREICHE = new Set<string>(['VWL', 'BWL', 'Recht', 'Informatik', 'Allgemein'])

function mapFachbereich(fach: string): Fachbereich {
  if (GUELTIGE_FACHBEREICHE.has(fach)) return fach as Fachbereich
  // Fallback-Mapping
  if (fach.toLowerCase().includes('vwl')) return 'VWL'
  if (fach.toLowerCase().includes('bwl')) return 'BWL'
  if (fach.toLowerCase().includes('recht')) return 'Recht'
  if (fach.toLowerCase().includes('in')) return 'Informatik'
  return 'Allgemein'
}

function mapBloom(taxonomie?: string): BloomStufe {
  if (taxonomie && /^K[1-6]$/.test(taxonomie)) return taxonomie as BloomStufe
  return 'K1'
}

// === LP → Shared ===

/** Konvertiert eine Lernplattform-Frage ins Shared-Format */
export function toSharedFrage(lf: LernFrage): SharedFrage {
  const sharedTyp = TYP_LP_ZU_SHARED[lf.typ] || lf.typ
  const now = new Date().toISOString()

  // Gemeinsame Basis-Felder
  const base = {
    id: lf.id,
    version: 1,
    erstelltAm: now,
    geaendertAm: now,
    fachbereich: mapFachbereich(lf.fach),
    fach: lf.fach,
    thema: lf.thema,
    bloom: mapBloom(lf.taxonomie),
    tags: lf.tags || [],
    punkte: 1,
    musterlosung: lf.musterantwort || lf.erklaerung || '',
    bewertungsraster: [] as Bewertungskriterium[],
    verwendungen: [],
    semester: [],
    gefaesse: [],
    schwierigkeit: lf.schwierigkeit,
    pruefungstauglich: lf.pruefungstauglich,
  }

  switch (sharedTyp) {
    case 'mc': {
      const istMulti = lf.typ === 'multi'
      const korrektSet = new Set(
        Array.isArray(lf.korrekt) ? lf.korrekt.map(String) : [String(lf.korrekt)]
      )
      const optionen: MCOption[] = (lf.optionen || []).map((text, i) => ({
        id: String(i + 1),
        text,
        korrekt: korrektSet.has(text),
      }))
      return {
        ...base,
        typ: 'mc' as const,
        fragetext: lf.frage,
        optionen,
        mehrfachauswahl: istMulti,
        zufallsreihenfolge: false,
      }
    }

    case 'richtigfalsch':
      return {
        ...base,
        typ: 'richtigfalsch' as const,
        fragetext: lf.frage,
        aussagen: (lf.aussagen || []).map((a, i) => ({
          id: String(i + 1),
          text: a.text,
          korrekt: a.korrekt,
        })),
      }

    case 'lueckentext':
      return {
        ...base,
        typ: 'lueckentext' as const,
        fragetext: lf.frage,
        textMitLuecken: lf.frage,
        luecken: (lf.luecken || []).map(l => ({
          id: l.id,
          korrekteAntworten: l.optionen && l.optionen.length > 0
            ? l.optionen
            : [l.korrekt],
          caseSensitive: false,
        })),
      }

    case 'freitext':
      return {
        ...base,
        typ: 'freitext' as const,
        fragetext: lf.frage,
        laenge: 'mittel' as const,
        musterlosung: lf.musterantwort || '',
      }

    case 'berechnung': {
      // LP kann calcZeilen haben (Pool-Format) oder einzelnes korrekt/toleranz
      const ergebnisse = lf.calcZeilen && lf.calcZeilen.length > 0
        ? lf.calcZeilen.map((z, i) => ({
            id: String(i + 1),
            label: z.label,
            korrekt: z.answer,
            toleranz: z.tolerance,
            einheit: z.unit,
          }))
        : [{
            id: '1',
            label: 'Ergebnis',
            korrekt: Array.isArray(lf.korrekt) ? Number(lf.korrekt[0]) || 0 : Number(lf.korrekt) || 0,
            toleranz: lf.toleranz || 0,
            einheit: lf.einheit,
          }]
      return {
        ...base,
        typ: 'berechnung' as const,
        fragetext: lf.frage,
        ergebnisse,
        rechenwegErforderlich: false,
      }
    }

    case 'sortierung':
      return {
        ...base,
        typ: 'sortierung' as const,
        fragetext: lf.frage,
        elemente: lf.reihenfolge || [],
        teilpunkte: true,
      }

    case 'zuordnung':
      return {
        ...base,
        typ: 'zuordnung' as const,
        fragetext: lf.frage,
        paare: lf.paare || [],
        zufallsreihenfolge: true,
      }

    case 'visualisierung':
      return {
        ...base,
        typ: 'visualisierung' as const,
        untertyp: 'zeichnen' as const,
        fragetext: lf.frage,
      }

    case 'bilanzstruktur':
      return {
        ...base,
        typ: 'bilanzstruktur' as const,
        aufgabentext: lf.frage,
        modus: (lf.bilanzModus === 'erfolgsrechnung' ? 'erfolgsrechnung' : 'bilanz') as 'bilanz' | 'erfolgsrechnung' | 'beides',
        kontenMitSaldi: (lf.kontenMitSaldi || []).map(k => ({
          kontonummer: k.nr,
          saldo: k.saldo,
        })),
        loesung: {},
        bewertungsoptionen: {
          seitenbeschriftung: true,
          gruppenbildung: true,
          gruppenreihenfolge: false,
          kontenreihenfolge: false,
          betraegeKorrekt: true,
          zwischentotale: false,
          bilanzsummeOderGewinn: true,
          mehrstufigkeit: false,
        },
      }

    case 'aufgabengruppe':
      return {
        ...base,
        typ: 'aufgabengruppe' as const,
        kontext: lf.kontext || lf.frage,
        teilaufgaben: (lf.teil || []).map(t => ({
          id: `${lf.id}_${t.sub}`,
          typ: TYP_LP_ZU_SHARED[t.type] || t.type,
          fragetext: t.q,
          punkte: 1,
        })),
      }

    // Identische Typen — nur Basis-Felder mappen
    case 'buchungssatz':
      return {
        ...base,
        typ: 'buchungssatz' as const,
        geschaeftsfall: lf.frage,
        buchungen: (lf.buchungssatzKorrekt || []).map((b, i) => ({
          id: String(i + 1),
          sollKonto: b.soll,
          habenKonto: b.haben,
          betrag: b.betrag,
        })),
        kontenauswahl: { modus: 'voll' as const },
      }

    case 'tkonto':
      return {
        ...base,
        typ: 'tkonto' as const,
        aufgabentext: lf.frage,
        geschaeftsfaelle: lf.geschaeftsfaelle,
        konten: (lf.tkontoKonten || []).map(k => ({
          id: k.nr,
          kontonummer: k.nr,
          anfangsbestand: k.ab,
          anfangsbestandVorgegeben: k.ab !== undefined,
          eintraege: [
            ...(k.correctSoll || []).map(e => ({ seite: 'soll' as const, gegenkonto: e.gegen, betrag: e.betrag })),
            ...(k.correctHaben || []).map(e => ({ seite: 'haben' as const, gegenkonto: e.gegen, betrag: e.betrag })),
          ],
          saldo: k.correctSaldo || { betrag: 0, seite: 'soll' as const },
        })),
        kontenauswahl: { modus: 'voll' as const },
        bewertungsoptionen: {
          beschriftungSollHaben: true,
          kontenkategorie: false,
          zunahmeAbnahme: false,
          buchungenKorrekt: true,
          saldoKorrekt: true,
        },
      }

    case 'kontenbestimmung':
      return {
        ...base,
        typ: 'kontenbestimmung' as const,
        aufgabentext: lf.frage,
        modus: 'konto_bestimmen' as const,
        aufgaben: (lf.aufgaben || []).map((a, i) => ({
          id: String(i + 1),
          text: a.text,
          erwarteteAntworten: (a.correct || []).map(c => ({
            kontonummer: c.konto,
            seite: c.seite,
          })),
        })),
        kontenauswahl: { modus: 'voll' as const },
      }

    case 'hotspot':
      return {
        ...base,
        typ: 'hotspot' as const,
        fragetext: lf.frage,
        bildUrl: lf.bild?.src || '',
        bereiche: (lf.hotspots || []).map((h, i) => ({
          id: String(i + 1),
          form: 'kreis' as const,
          koordinaten: { x: h.x, y: h.y, radius: h.r },
          label: h.label,
          punkte: 1,
        })),
        mehrfachauswahl: true,
      }

    case 'bildbeschriftung':
      return {
        ...base,
        typ: 'bildbeschriftung' as const,
        fragetext: lf.frage,
        bildUrl: lf.bild?.src || '',
        beschriftungen: (lf.labels || []).map(l => ({
          id: l.id,
          position: { x: l.x, y: l.y },
          korrekt: [l.text],
        })),
      }

    case 'dragdrop_bild':
      return {
        ...base,
        typ: 'dragdrop_bild' as const,
        fragetext: lf.frage,
        bildUrl: lf.bild?.src || '',
        zielzonen: (lf.zones || []).map(z => ({
          id: z.id,
          position: { x: z.x, y: z.y, breite: z.w, hoehe: z.h },
          korrektesLabel: (lf.dragLabels || []).find(dl => dl.zone === z.id)?.text || '',
        })),
        labels: (lf.dragLabels || []).map(dl => dl.text),
      }

    case 'formel':
      return {
        ...base,
        typ: 'formel' as const,
        fragetext: lf.frage,
        korrekteFormel: String(lf.korrekt || ''),
        vergleichsModus: 'exakt' as const,
      }

    case 'pdf':
      return {
        ...base,
        typ: 'pdf' as const,
        fragetext: lf.frage,
        pdfUrl: lf.pdfUrl,
        pdfDateiname: '',
        seitenAnzahl: 1,
        erlaubteWerkzeuge: ['freihand', 'text', 'highlighter'],
      }

    case 'audio':
      return {
        ...base,
        typ: 'audio' as const,
        fragetext: lf.frage,
        maxDauerSekunden: lf.maxAufnahmeDauer,
      }

    case 'code':
      return {
        ...base,
        typ: 'code' as const,
        fragetext: lf.frage,
        sprache: lf.sprache || 'python',
        starterCode: lf.starterCode,
      }

    default:
      // Fallback: als Freitext behandeln
      return {
        ...base,
        typ: 'freitext' as const,
        fragetext: lf.frage,
        laenge: 'mittel' as const,
      }
  }
}

// === Shared → LP ===

/** Konvertiert eine Shared-Frage zurück ins LP-Format. Optional: Original-LP-Frage für LP-eigene Felder. */
export function fromSharedFrage(sf: SharedFrage, original?: LernFrage): LernFrage {
  // LP-Typ bestimmen
  let lpTyp = TYP_SHARED_ZU_LP[sf.typ] || sf.typ
  // Spezialfall: mc mit mehrfachauswahl → multi
  if (sf.typ === 'mc' && 'mehrfachauswahl' in sf && sf.mehrfachauswahl) {
    lpTyp = 'multi'
  }

  // Basis-Felder
  const result: LernFrage = {
    id: sf.id,
    fach: sf.fachbereich || sf.fach || original?.fach || 'Allgemein',
    thema: sf.thema || original?.thema || '',
    typ: lpTyp as LernFrage['typ'],
    schwierigkeit: (sf.schwierigkeit as 1 | 2 | 3) || original?.schwierigkeit || 2,
    frage: 'fragetext' in sf ? (sf as { fragetext: string }).fragetext : ('aufgabentext' in sf ? (sf as { aufgabentext: string }).aufgabentext : ''),
    uebung: original?.uebung ?? true,
    pruefungstauglich: sf.pruefungstauglich ?? original?.pruefungstauglich ?? false,
    taxonomie: sf.bloom || original?.taxonomie,
    erklaerung: original?.erklaerung,
    tags: sf.tags?.length ? sf.tags : original?.tags,
    // LP-eigene Felder aus Original bewahren
    stufe: original?.stufe,
    lernziel: original?.lernziel,
  }

  // Typ-spezifische Felder
  switch (sf.typ) {
    case 'mc': {
      const mc = sf as import('@shared/types/fragen').MCFrage
      result.optionen = mc.optionen.map(o => o.text)
      const korrekte = mc.optionen.filter(o => o.korrekt).map(o => o.text)
      result.korrekt = mc.mehrfachauswahl ? korrekte : korrekte[0]
      break
    }

    case 'richtigfalsch': {
      const rf = sf as import('@shared/types/fragen').RichtigFalschFrage
      result.aussagen = rf.aussagen.map(a => ({
        text: a.text,
        korrekt: a.korrekt,
      }))
      break
    }

    case 'lueckentext': {
      const lt = sf as import('@shared/types/fragen').LueckentextFrage
      result.luecken = lt.luecken.map(l => ({
        id: l.id,
        korrekt: l.korrekteAntworten[0] || '',
        optionen: l.korrekteAntworten.length > 1 ? l.korrekteAntworten : undefined,
      }))
      break
    }

    case 'freitext': {
      result.musterantwort = sf.musterlosung || undefined
      break
    }

    case 'berechnung': {
      const b = sf as import('@shared/types/fragen').BerechnungFrage
      if (b.ergebnisse.length === 1) {
        result.korrekt = [b.ergebnisse[0].korrekt]
        result.toleranz = b.ergebnisse[0].toleranz
        result.einheit = b.ergebnisse[0].einheit
      } else {
        result.calcZeilen = b.ergebnisse.map(e => ({
          label: e.label,
          answer: e.korrekt,
          tolerance: e.toleranz,
          unit: e.einheit,
        }))
      }
      break
    }

    case 'sortierung': {
      const s = sf as import('@shared/types/fragen').SortierungFrage
      result.reihenfolge = s.elemente
      break
    }

    case 'zuordnung': {
      const z = sf as import('@shared/types/fragen').ZuordnungFrage
      result.paare = z.paare
      break
    }

    case 'visualisierung': {
      // zeichnen → LP
      break
    }

    case 'bilanzstruktur': {
      const bi = sf as import('@shared/types/fragen').BilanzERFrage
      result.bilanzModus = bi.modus === 'erfolgsrechnung' ? 'erfolgsrechnung' : 'bilanz'
      result.kontenMitSaldi = bi.kontenMitSaldi.map(k => ({
        nr: k.kontonummer,
        name: '', // LP hat name, shared nicht im kontenMitSaldi
        saldo: k.saldo,
      }))
      break
    }

    case 'aufgabengruppe': {
      const ag = sf as import('@shared/types/fragen').AufgabengruppeFrage
      result.kontext = ag.kontext
      if (ag.teilaufgaben) {
        result.teil = ag.teilaufgaben.map((t, i) => ({
          sub: String.fromCharCode(97 + i), // a, b, c, ...
          type: (TYP_SHARED_ZU_LP[t.typ] || t.typ) as Exclude<LernFrage['typ'], 'gruppe'>,
          q: t.fragetext,
        }))
      }
      break
    }

    // Für FiBu-Typen und Bild-Typen: Original-Felder bewahren wenn vorhanden
    default: {
      if (original) {
        // Typ-spezifische Felder aus Original kopieren
        const typFelder = [
          'konten', 'buchungssatzKorrekt', 'tkontoKonten', 'gegenkonten',
          'geschaeftsfaelle', 'bilanzKorrekt', 'aufgaben',
          'bild', 'hotspots', 'labels', 'zones', 'dragLabels',
          'pdfUrl', 'sprache', 'starterCode', 'maxAufnahmeDauer',
          'hinweise', 'musterbild',
        ] as const
        for (const feld of typFelder) {
          if (original[feld] !== undefined) {
            (result as unknown as Record<string, unknown>)[feld] = original[feld]
          }
        }
      }
      break
    }
  }

  return result
}
