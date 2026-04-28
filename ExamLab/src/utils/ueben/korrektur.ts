/**
 * Korrektur-Logik für ExamLab Üben.
 * Arbeitet mit dem shared Frage-Format (kanonisch, discriminated union).
 */
import type { Frage, FrageTyp } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import { normalizeAntwort } from '../normalizeAntwort'
import { istPunktInPolygon } from '../zonen/polygon'
import { normalisiereDragDropBild, normalisiereDragDropAntwort } from './fragetypNormalizer'

/**
 * Fragetypen, die nicht automatisch korrigiert werden können
 * und stattdessen durch SuS selbstbewertet werden müssen.
 */
const SELBSTBEWERTUNGS_TYPEN: ReadonlyArray<FrageTyp> = [
  'freitext',
  'visualisierung',
  'pdf',
  'audio',
  'code',
]

export function istSelbstbewertungstyp(typ: FrageTyp): boolean {
  return SELBSTBEWERTUNGS_TYPEN.includes(typ)
}

/**
 * S137 Ticket 8 Anpassung 1: Text-Antwort normalisieren — trim + Mehrfach-Leerzeichen kollabieren.
 * Aktiv für Lückentext + Bildbeschriftung (Frontend + Backend spiegeln).
 */
export function normalisiereTextAntwort(s: unknown): string {
  return String(s ?? '').trim().replace(/\s+/g, ' ')
}

export function pruefeAntwort(frage: Frage, antwort: Antwort | unknown): boolean {
  // Normalisierung: konvertiert Legacy-Üben-Felder (gewaehlt, wert, etc.)
  // auf das kanonische Antwort-Schema (gewaehlteOptionen, ergebnisse, etc.)
  const a = normalizeAntwort(antwort)

  switch (frage.typ) {
    case 'mc': {
      if (a.typ !== 'mc') return false
      // Defensive: Backend kann Pool-Daten bereinigt ausliefern (optionen fehlt)
      const optionen = Array.isArray(frage.optionen) ? frage.optionen : []
      if (optionen.length === 0) return false
      const gewaehlteOptionen = Array.isArray(a.gewaehlteOptionen) ? a.gewaehlteOptionen : []
      if (frage.mehrfachauswahl) {
        // Multi: alle korrekten Optionen müssen gewählt sein
        const korrekte = optionen.filter(o => o.korrekt).map(o => o.id)
        const gewaehlt = [...gewaehlteOptionen].sort()
        return korrekte.length === gewaehlt.length &&
          [...korrekte].sort().every((k, i) => k === gewaehlt[i])
      }
      // Single: die gewählte Option muss korrekt sein
      const gewaehlt = gewaehlteOptionen[0] ?? ''
      const korrektOpt = optionen.find(o => o.korrekt)
      return korrektOpt ? gewaehlt === korrektOpt.id || gewaehlt === korrektOpt.text : false
    }

    case 'richtigfalsch': {
      if (a.typ !== 'richtigfalsch') return false
      const aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : []
      const bewertungen = a.bewertungen ?? {}
      return aussagen.length > 0 && aussagen.every(aus =>
        bewertungen[aus.id] === aus.korrekt
      )
    }

    case 'lueckentext': {
      if (a.typ !== 'lueckentext') return false
      const luecken = Array.isArray(frage.luecken) ? frage.luecken : []
      const eintraege = a.eintraege ?? {}
      return luecken.length > 0 && luecken.every(l => pruefeLueckeEintrag(l, eintraege[l.id]))
    }

    case 'berechnung': {
      if (a.typ !== 'berechnung') return false
      const ergebnisse = a.ergebnisse ?? {}
      const sollErgebnisse = Array.isArray(frage.ergebnisse) ? frage.ergebnisse : []
      if (sollErgebnisse.length === 0) return false
      if (sollErgebnisse.length === 1) {
        const soll = sollErgebnisse[0].korrekt
        // Einzel-Ergebnis: nimm den ersten Wert aus ergebnisse (Schlüssel 'default' oder erster Eintrag)
        const istStr = ergebnisse['default'] ?? Object.values(ergebnisse)[0] ?? ''
        const ist = parseFloat(istStr)
        if (isNaN(ist)) return false
        return Math.abs(soll - ist) <= sollErgebnisse[0].toleranz
      }
      // Mehrere Ergebnisse: ID → Wert-Mapping
      return sollErgebnisse.every(e => {
        const ist = parseFloat(ergebnisse[e.id] || '0')
        if (isNaN(ist)) return false
        return Math.abs(e.korrekt - ist) <= e.toleranz
      })
    }

    case 'sortierung': {
      if (a.typ !== 'sortierung') return false
      const elemente = Array.isArray(frage.elemente) ? frage.elemente : []
      const reihenfolge = Array.isArray(a.reihenfolge) ? a.reihenfolge : []
      return elemente.length > 0 && elemente.length === reihenfolge.length &&
        elemente.every((e, i) => e === reihenfolge[i])
    }

    case 'zuordnung': {
      if (a.typ !== 'zuordnung') return false
      const paare = Array.isArray(frage.paare) ? frage.paare : []
      const zuordnungen = a.zuordnungen ?? {}
      return paare.length > 0 && paare.every(p => zuordnungen[p.links] === p.rechts)
    }

    case 'buchungssatz': {
      if (a.typ !== 'buchungssatz') return false
      const korrektZeilen = Array.isArray(frage.buchungen) ? frage.buchungen : []
      const eingabeZeilen = Array.isArray(a.buchungen) ? a.buchungen : []
      if (korrektZeilen.length === 0) return false
      if (korrektZeilen.length !== eingabeZeilen.length) return false
      const genutzt = new Set<number>()
      return korrektZeilen.every(kz =>
        eingabeZeilen.some((ez, i) => {
          if (genutzt.has(i)) return false
          if (ez.sollKonto === kz.sollKonto && ez.habenKonto === kz.habenKonto && Math.abs(ez.betrag - kz.betrag) < 0.01) {
            genutzt.add(i)
            return true
          }
          return false
        })
      )
    }

    case 'tkonto': {
      if (a.typ !== 'tkonto') return false
      const konten = Array.isArray(frage.konten) ? frage.konten : []
      const eingabeKonten = Array.isArray(a.konten) ? a.konten : []
      if (konten.length === 0) return false
      return konten.every(konto => {
        const eingabe = eingabeKonten.find(k => k.id === konto.id)
        if (!eingabe) return false
        const eintraege = Array.isArray(konto.eintraege) ? konto.eintraege : []
        const eingabeLinks = Array.isArray(eingabe.eintraegeLinks) ? eingabe.eintraegeLinks : []
        const eingabeRechts = Array.isArray(eingabe.eintraegeRechts) ? eingabe.eintraegeRechts : []
        const korrektLinks = eintraege.filter(e => e.seite === 'soll')
        const korrektRechts = eintraege.filter(e => e.seite === 'haben')
        const linksOk = korrektLinks.length === eingabeLinks.length &&
          korrektLinks.every(ks =>
            eingabeLinks.some(es => es.gegenkonto === ks.gegenkonto && Math.abs(es.betrag - ks.betrag) < 0.01)
          )
        const rechtsOk = korrektRechts.length === eingabeRechts.length &&
          korrektRechts.every(kh =>
            eingabeRechts.some(eh => eh.gegenkonto === kh.gegenkonto && Math.abs(eh.betrag - kh.betrag) < 0.01)
          )
        // Saldo-Prüfung: kanonisches Format hat betragLinks/betragRechts
        const saldo = eingabe.saldo
        const saldoOk = saldo
          ? Math.abs((saldo.betragLinks ?? 0) - (saldo.betragRechts ?? 0)) < 0.01
          : true
        return linksOk && rechtsOk && saldoOk
      })
    }

    case 'bilanzstruktur': {
      if (a.typ !== 'bilanzstruktur') return false
      const loesung = frage.loesung
      if (!loesung?.bilanz) return false
      // Vereinfachte Prüfung: Bilanzsumme korrekt
      // Kanonisches Format: bilanz.bilanzsummeLinks oder bilanzsummeRechts
      const bilanzsumme = a.bilanz?.bilanzsummeLinks ?? a.bilanz?.bilanzsummeRechts ?? 0
      return Math.abs(bilanzsumme - frage.loesung.bilanz!.bilanzsumme) < 0.01
    }

    case 'kontenbestimmung': {
      if (a.typ !== 'kontenbestimmung') return false
      const aufgaben = Array.isArray(frage.aufgaben) ? frage.aufgaben : []
      const eingabeAufgaben = a.aufgaben ?? {}
      if (aufgaben.length === 0) return false
      // Modus-aware: nur Felder prüfen die im aktiven Modus relevant sind.
      // S140 Ticket 6: vorher wurde `seite` immer gecheckt und `kategorie` nie → Kategorie-Modus zählte korrekt als falsch.
      const zeigeKonto = frage.modus === 'konto_bestimmen' || frage.modus === 'gemischt'
      const zeigeKategorie = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
      const zeigeSeite = frage.modus === 'kategorie_bestimmen' || frage.modus === 'gemischt'
      return aufgaben.every((aufgabe, i) => {
        // Kanonisches Format: aufgaben ist Record<string, { antworten: [...] }>
        const eingabe = Object.values(eingabeAufgaben)[i]?.antworten ?? []
        const erwartet = Array.isArray(aufgabe.erwarteteAntworten) ? aufgabe.erwarteteAntworten : []
        if (erwartet.length !== eingabe.length) return false
        return erwartet.every(ea =>
          eingabe.some((ez: { kontonummer?: string; kategorie?: string; seite?: string }) => {
            const kontoOk = !zeigeKonto || (ez.kontonummer ?? '') === (ea.kontonummer ?? '')
            const kategorieOk = !zeigeKategorie || (ez.kategorie ?? '') === (ea.kategorie ?? '')
            const seiteOk = !zeigeSeite || (ez.seite ?? '') === (ea.seite ?? '')
            return kontoOk && kategorieOk && seiteOk
          }),
        )
      })
    }

    case 'hotspot': {
      if (a.typ !== 'hotspot') return false
      const alle = Array.isArray(frage.bereiche) ? frage.bereiche : []
      const klicks = Array.isArray(a.klicks) ? a.klicks : []
      if (alle.length === 0 || klicks.length === 0) return false
      // Pool-Import-Konvention: alle Hotspots sind in bereiche[], nur der korrekte
      // hat punktzahl>0. LP-Editor: alle Bereiche haben punktzahl>0. Filter loest beides.
      const punkteBereiche = alle.filter(b => (b.punktzahl ?? 0) > 0)
      const zuPruefen = punkteBereiche.length > 0 ? punkteBereiche : alle
      function trifft(b: typeof alle[0], k: { x: number; y: number }): boolean {
        return istPunktInPolygon(k, b.punkte ?? [])
      }
      // Korrekt = alle punkte-Bereiche getroffen UND kein punkte=0-Bereich getroffen.
      const alleKorrekteGetroffen = zuPruefen.every(b => klicks.some(k => trifft(b, k)))
      if (!alleKorrekteGetroffen) return false
      const nichtKorrekte = alle.filter(b => !zuPruefen.includes(b))
      const falscheGetroffen = nichtKorrekte.some(b => klicks.some(k => trifft(b, k)))
      return !falscheGetroffen
    }

    case 'bildbeschriftung': {
      if (a.typ !== 'bildbeschriftung') return false
      const beschriftungen = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : []
      const eintraege = a.eintraege ?? {}
      return beschriftungen.length > 0 && beschriftungen.every(b => pruefeBeschriftungEintrag(b, eintraege[b.id]))
    }

    case 'dragdrop_bild': {
      if (a.typ !== 'dragdrop_bild') return false
      const f = normalisiereDragDropBild(frage)
      const norm = normalisiereDragDropAntwort(a, f)
      const labelMap = new Map(f.labels.map(l => [l.id, l]))
      return f.zielzonen.length > 0 && f.zielzonen.every(z => {
        const platzierteTexte = Object.entries(norm.zuordnungen)
          .filter(([, zid]) => zid === z.id)
          .map(([lid]) => (labelMap.get(lid)?.text ?? '').trim().toLowerCase())
          .filter(Boolean)
        const sollSet = new Set(z.korrekteLabels.map(s => s.trim().toLowerCase()))
        return platzierteTexte.some(t => sollSet.has(t))
      })
    }

    // Selbstbewertete Typen
    case 'freitext':
    case 'pdf':
    case 'visualisierung':
    case 'audio':
    case 'code':
      return 'selbstbewertung' in a && a.selbstbewertung === 'korrekt'

    case 'aufgabengruppe': {
      if (a.typ !== 'aufgabengruppe') return false
      const teilaufgaben = Array.isArray(frage.teilaufgaben) ? frage.teilaufgaben : []
      const teilAntworten = a.teilAntworten ?? {}
      return teilaufgaben.length > 0 && Object.keys(teilAntworten).length === teilaufgaben.length
    }

    case 'formel': {
      if (a.typ !== 'formel') return false
      const soll = normalisiereLatex(frage.korrekteFormel ?? '')
      const ist = normalisiereLatex(a.latex ?? '')
      if (!soll) return false
      return soll === ist
    }

    default:
      return false
  }
}

/**
 * S137: Einzelne Lücke prüfen — Mehrfach-Leerzeichen kollabieren, Default case-insensitive.
 * Nur wenn `caseSensitive === true` wird exakt verglichen. Undefined/false/null → insensitive.
 */
function pruefeLueckeEintrag(
  l: { korrekteAntworten: string[]; caseSensitive?: boolean },
  eintrag: unknown,
): boolean {
  const eingabe = normalisiereTextAntwort(eintrag)
  const korrekt = Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : []
  if (korrekt.length === 0) return false
  return korrekt.some(ka => {
    const k = normalisiereTextAntwort(ka)
    return l.caseSensitive === true ? eingabe === k : eingabe.toLowerCase() === k.toLowerCase()
  })
}

/**
 * S137 Ticket 8 Anpassung 4: Bildbeschriftung nutzt jetzt dieselbe case-sensitive-Logik wie Lückentext.
 * Default=false (case-insensitive), override durch `caseSensitive === true`.
 */
function pruefeBeschriftungEintrag(
  b: { korrekt: string[]; caseSensitive?: boolean },
  eintrag: unknown,
): boolean {
  const eingabe = normalisiereTextAntwort(eintrag)
  const korrekt = Array.isArray(b.korrekt) ? b.korrekt : []
  if (korrekt.length === 0) return false
  return korrekt.some(ka => {
    const k = normalisiereTextAntwort(ka)
    return b.caseSensitive === true ? eingabe === k : eingabe.toLowerCase() === k.toLowerCase()
  })
}

/**
 * S137 Ticket 8 Anpassung 3: Teilpunkt-Zähler für Label-Feedback.
 * Liefert { erzielt, max } für Multi-Element-Typen (R/F, Lückentext, Zuordnung, Sortierung, MC)
 * und `null` für Single-Element-Typen (Berechnung, Hotspot, Formel etc.) — dort ist
 * korrekt=binär und braucht nur „korrekt" / „leider falsch".
 */
export function bewerteAntwortDetails(
  frage: Frage,
  antwort: Antwort | unknown,
): { erzielt: number; max: number } | null {
  const a = normalizeAntwort(antwort)
  switch (frage.typ) {
    case 'richtigfalsch': {
      if (a.typ !== 'richtigfalsch') return null
      const aussagen = Array.isArray(frage.aussagen) ? frage.aussagen : []
      if (aussagen.length <= 1) return null
      const bew = a.bewertungen ?? {}
      const erzielt = aussagen.filter(aus => bew[aus.id] === aus.korrekt).length
      return { erzielt, max: aussagen.length }
    }
    case 'lueckentext': {
      if (a.typ !== 'lueckentext') return null
      const luecken = Array.isArray(frage.luecken) ? frage.luecken : []
      if (luecken.length <= 1) return null
      const eintraege = a.eintraege ?? {}
      const erzielt = luecken.filter(l => pruefeLueckeEintrag(l, eintraege[l.id])).length
      return { erzielt, max: luecken.length }
    }
    case 'bildbeschriftung': {
      if (a.typ !== 'bildbeschriftung') return null
      const beschr = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : []
      if (beschr.length <= 1) return null
      const eintraege = a.eintraege ?? {}
      const erzielt = beschr.filter(b => pruefeBeschriftungEintrag(b, eintraege[b.id])).length
      return { erzielt, max: beschr.length }
    }
    case 'zuordnung': {
      if (a.typ !== 'zuordnung') return null
      const paare = Array.isArray(frage.paare) ? frage.paare : []
      if (paare.length <= 1) return null
      const zu = a.zuordnungen ?? {}
      const erzielt = paare.filter(p => zu[p.links] === p.rechts).length
      return { erzielt, max: paare.length }
    }
    default:
      return null
  }
}

function normalisiereLatex(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/\\cdot/g, '\\times')
    .replace(/\*\*/g, '^')
    .toLowerCase()
}
