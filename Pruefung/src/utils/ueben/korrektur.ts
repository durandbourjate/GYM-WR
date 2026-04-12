/**
 * Korrektur-Logik für ExamLab Üben.
 * Arbeitet mit dem shared Frage-Format (kanonisch, discriminated union).
 */
import type { Frage } from '../../types/ueben/fragen'
import type { Antwort } from '../../types/antworten'
import { normalizeAntwort } from '../normalizeAntwort'

export function pruefeAntwort(frage: Frage, antwort: Antwort | unknown): boolean {
  // Normalisierung: konvertiert Legacy-Üben-Felder (gewaehlt, wert, etc.)
  // auf das kanonische Antwort-Schema (gewaehlteOptionen, ergebnisse, etc.)
  const a = normalizeAntwort(antwort)

  switch (frage.typ) {
    case 'mc': {
      if (a.typ !== 'mc') return false
      const gewaehlteOptionen = a.gewaehlteOptionen
      if (frage.mehrfachauswahl) {
        // Multi: alle korrekten Optionen müssen gewählt sein
        const korrekte = frage.optionen.filter(o => o.korrekt).map(o => o.id)
        const gewaehlt = [...gewaehlteOptionen].sort()
        return korrekte.length === gewaehlt.length &&
          [...korrekte].sort().every((k, i) => k === gewaehlt[i])
      }
      // Single: die gewählte Option muss korrekt sein
      const gewaehlt = gewaehlteOptionen[0] ?? ''
      const korrektOpt = frage.optionen.find(o => o.korrekt)
      return korrektOpt ? gewaehlt === korrektOpt.id || gewaehlt === korrektOpt.text : false
    }

    case 'richtigfalsch': {
      if (a.typ !== 'richtigfalsch') return false
      return frage.aussagen.every(aus =>
        a.bewertungen[aus.id] === aus.korrekt
      )
    }

    case 'lueckentext': {
      if (a.typ !== 'lueckentext') return false
      return frage.luecken.every(l => {
        const eingabe = (a.eintraege[l.id] || '').trim()
        return l.korrekteAntworten.some(ka =>
          l.caseSensitive ? eingabe === ka.trim() : eingabe.toLowerCase() === ka.trim().toLowerCase()
        )
      })
    }

    case 'berechnung': {
      if (a.typ !== 'berechnung') return false
      const ergebnisse = a.ergebnisse
      if (frage.ergebnisse.length === 1) {
        const soll = frage.ergebnisse[0].korrekt
        // Einzel-Ergebnis: nimm den ersten Wert aus ergebnisse (Schlüssel 'default' oder erster Eintrag)
        const istStr = ergebnisse['default'] ?? Object.values(ergebnisse)[0] ?? ''
        const ist = parseFloat(istStr)
        if (isNaN(ist)) return false
        return Math.abs(soll - ist) <= frage.ergebnisse[0].toleranz
      }
      // Mehrere Ergebnisse: ID → Wert-Mapping
      return frage.ergebnisse.every(e => {
        const ist = parseFloat(ergebnisse[e.id] || '0')
        if (isNaN(ist)) return false
        return Math.abs(e.korrekt - ist) <= e.toleranz
      })
    }

    case 'sortierung': {
      if (a.typ !== 'sortierung') return false
      return frage.elemente.length === a.reihenfolge.length &&
        frage.elemente.every((e, i) => e === a.reihenfolge[i])
    }

    case 'zuordnung': {
      if (a.typ !== 'zuordnung') return false
      return frage.paare.every(p => a.zuordnungen[p.links] === p.rechts)
    }

    case 'buchungssatz': {
      if (a.typ !== 'buchungssatz') return false
      const korrektZeilen = frage.buchungen
      const eingabeZeilen = a.buchungen || []
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
      return frage.konten.every(konto => {
        const eingabe = a.konten.find(k => k.id === konto.id)
        if (!eingabe) return false
        const korrektLinks = konto.eintraege.filter(e => e.seite === 'soll')
        const korrektRechts = konto.eintraege.filter(e => e.seite === 'haben')
        const linksOk = korrektLinks.length === eingabe.eintraegeLinks.length &&
          korrektLinks.every(ks =>
            eingabe.eintraegeLinks.some(es => es.gegenkonto === ks.gegenkonto && Math.abs(es.betrag - ks.betrag) < 0.01)
          )
        const rechtsOk = korrektRechts.length === eingabe.eintraegeRechts.length &&
          korrektRechts.every(kh =>
            eingabe.eintraegeRechts.some(eh => eh.gegenkonto === kh.gegenkonto && Math.abs(eh.betrag - kh.betrag) < 0.01)
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
      return frage.aufgaben.every((aufgabe, i) => {
        // Kanonisches Format: aufgaben ist Record<string, { antworten: [...] }>
        const eingabe = Object.values(a.aufgaben)[i]?.antworten ?? []
        if (aufgabe.erwarteteAntworten.length !== eingabe.length) return false
        return aufgabe.erwarteteAntworten.every(ea =>
          eingabe.some((ez: { kontonummer?: string; seite?: string }) => ez.kontonummer === (ea.kontonummer || '') && ez.seite === ea.seite)
        )
      })
    }

    case 'hotspot': {
      if (a.typ !== 'hotspot') return false
      return frage.bereiche.length === a.klicks.length &&
        frage.bereiche.every(b =>
          a.klicks.some(k => {
            const r = b.koordinaten.radius || 10
            return Math.hypot(b.koordinaten.x - k.x, b.koordinaten.y - k.y) < r
          })
        )
    }

    case 'bildbeschriftung': {
      if (a.typ !== 'bildbeschriftung') return false
      return frage.beschriftungen.every(b =>
        b.korrekt.some(ka =>
          (a.eintraege[b.id] || '').trim().toLowerCase() === ka.trim().toLowerCase()
        )
      )
    }

    case 'dragdrop_bild': {
      if (a.typ !== 'dragdrop_bild') return false
      return frage.zielzonen.every(z =>
        a.zuordnungen[z.korrektesLabel] === z.id ||
        frage.labels.some(l => l === z.korrektesLabel && a.zuordnungen[l] === z.id)
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
      const teilaufgaben = frage.teilaufgaben || []
      return teilaufgaben.length > 0 && Object.keys(a.teilAntworten).length === teilaufgaben.length
    }

    case 'formel': {
      if (a.typ !== 'formel') return false
      const soll = normalisiereLatex(frage.korrekteFormel)
      const ist = normalisiereLatex(a.latex)
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
