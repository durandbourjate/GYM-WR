/**
 * Korrektur-Logik für ExamLab Üben.
 * Arbeitet mit dem shared Frage-Format (kanonisch, discriminated union).
 */
import type { Frage, FrageTyp } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import { normalizeAntwort } from '../normalizeAntwort'

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
      return luecken.length > 0 && luecken.every(l => {
        const eingabe = (eintraege[l.id] || '').trim()
        const korrekt = Array.isArray(l.korrekteAntworten) ? l.korrekteAntworten : []
        if (korrekt.length === 0) return false
        return korrekt.some(ka =>
          l.caseSensitive ? eingabe === ka.trim() : eingabe.toLowerCase() === ka.trim().toLowerCase()
        )
      })
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
      return aufgaben.every((aufgabe, i) => {
        // Kanonisches Format: aufgaben ist Record<string, { antworten: [...] }>
        const eingabe = Object.values(eingabeAufgaben)[i]?.antworten ?? []
        const erwartet = Array.isArray(aufgabe.erwarteteAntworten) ? aufgabe.erwarteteAntworten : []
        if (erwartet.length !== eingabe.length) return false
        return erwartet.every(ea =>
          eingabe.some((ez: { kontonummer?: string; seite?: string }) => ez.kontonummer === (ea.kontonummer || '') && ez.seite === ea.seite)
        )
      })
    }

    case 'hotspot': {
      if (a.typ !== 'hotspot') return false
      const bereiche = Array.isArray(frage.bereiche) ? frage.bereiche : []
      const klicks = Array.isArray(a.klicks) ? a.klicks : []
      return bereiche.length > 0 && bereiche.length === klicks.length &&
        bereiche.every(b =>
          klicks.some(k => {
            const r = b.koordinaten.radius || 10
            return Math.hypot(b.koordinaten.x - k.x, b.koordinaten.y - k.y) < r
          })
        )
    }

    case 'bildbeschriftung': {
      if (a.typ !== 'bildbeschriftung') return false
      const beschriftungen = Array.isArray(frage.beschriftungen) ? frage.beschriftungen : []
      const eintraege = a.eintraege ?? {}
      return beschriftungen.length > 0 && beschriftungen.every(b => {
        const korrekt = Array.isArray(b.korrekt) ? b.korrekt : []
        if (korrekt.length === 0) return false
        return korrekt.some(ka =>
          (eintraege[b.id] || '').trim().toLowerCase() === ka.trim().toLowerCase()
        )
      })
    }

    case 'dragdrop_bild': {
      if (a.typ !== 'dragdrop_bild') return false
      const zielzonen = Array.isArray(frage.zielzonen) ? frage.zielzonen : []
      const labels = Array.isArray(frage.labels) ? frage.labels : []
      const zuordnungen = a.zuordnungen ?? {}
      return zielzonen.length > 0 && zielzonen.every(z =>
        zuordnungen[z.korrektesLabel] === z.id ||
        labels.some(l => l === z.korrektesLabel && zuordnungen[l] === z.id)
      )
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

function normalisiereLatex(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/\\cdot/g, '\\times')
    .replace(/\*\*/g, '^')
    .toLowerCase()
}
