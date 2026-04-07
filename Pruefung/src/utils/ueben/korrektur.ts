/**
 * Korrektur-Logik für ExamLab Üben.
 * Arbeitet mit dem shared Frage-Format (kanonisch, discriminated union).
 */
import type { Frage } from '../../types/ueben/fragen'
import type { AntwortTyp } from '../../types/ueben/antworten'

export function pruefeAntwort(frage: Frage, antwort: AntwortTyp): boolean {
  switch (frage.typ) {
    case 'mc': {
      if (!('gewaehlt' in antwort)) return false
      if (frage.mehrfachauswahl) {
        // Multi: alle korrekten Optionen müssen gewählt sein
        const korrekte = frage.optionen.filter(o => o.korrekt).map(o => o.id)
        const gewaehlt = Array.isArray(antwort.gewaehlt) ? [...antwort.gewaehlt].sort() : [antwort.gewaehlt]
        return korrekte.length === gewaehlt.length &&
          [...korrekte].sort().every((k, i) => k === gewaehlt[i])
      }
      // Single: die gewählte Option muss korrekt sein
      const gewaehlt = 'gewaehlt' in antwort ? String(antwort.gewaehlt) : ''
      const korrektOpt = frage.optionen.find(o => o.korrekt)
      return korrektOpt ? gewaehlt === korrektOpt.id || gewaehlt === korrektOpt.text : false
    }

    case 'richtigfalsch': {
      if (!('bewertungen' in antwort)) return false
      return frage.aussagen.every(a =>
        antwort.bewertungen[a.id] === a.korrekt
      )
    }

    case 'lueckentext': {
      if (!('eintraege' in antwort)) return false
      return frage.luecken.every(l => {
        const eingabe = (antwort.eintraege[l.id] || '').trim()
        return l.korrekteAntworten.some(ka =>
          l.caseSensitive ? eingabe === ka.trim() : eingabe.toLowerCase() === ka.trim().toLowerCase()
        )
      })
    }

    case 'berechnung': {
      if (!('wert' in antwort) && !('werte' in antwort)) return false
      if (frage.ergebnisse.length === 1) {
        const soll = frage.ergebnisse[0].korrekt
        const ist = parseFloat('wert' in antwort ? String(antwort.wert) : '0')
        if (isNaN(ist)) return false
        return Math.abs(soll - ist) <= frage.ergebnisse[0].toleranz
      }
      // Mehrere Ergebnisse
      const werte = 'werte' in antwort ? (antwort as { werte?: Record<string, string> }).werte : undefined
      if (!werte) return false
      return frage.ergebnisse.every(e => {
        const ist = parseFloat(werte[e.id] || '0')
        if (isNaN(ist)) return false
        return Math.abs(e.korrekt - ist) <= e.toleranz
      })
    }

    case 'sortierung': {
      if (!('reihenfolge' in antwort)) return false
      return frage.elemente.length === antwort.reihenfolge.length &&
        frage.elemente.every((e, i) => e === antwort.reihenfolge[i])
    }

    case 'zuordnung': {
      if (!('paare' in antwort)) return false
      return frage.paare.every(p => antwort.paare[p.links] === p.rechts)
    }

    case 'buchungssatz': {
      if (!('zeilen' in antwort)) return false
      const korrektZeilen = frage.buchungen
      const eingabeZeilen = antwort.zeilen || []
      if (korrektZeilen.length !== eingabeZeilen.length) return false
      const genutzt = new Set<number>()
      return korrektZeilen.every(kz =>
        eingabeZeilen.some((ez, i) => {
          if (genutzt.has(i)) return false
          if (ez.soll === kz.sollKonto && ez.haben === kz.habenKonto && Math.abs(ez.betrag - kz.betrag) < 0.01) {
            genutzt.add(i)
            return true
          }
          return false
        })
      )
    }

    case 'tkonto': {
      if (!('konten' in antwort)) return false
      return frage.konten.every(konto => {
        const eingabe = antwort.konten[konto.kontonummer]
        if (!eingabe) return false
        const korrektSoll = konto.eintraege.filter(e => e.seite === 'soll')
        const korrektHaben = konto.eintraege.filter(e => e.seite === 'haben')
        const sollOk = korrektSoll.length === eingabe.soll.length &&
          korrektSoll.every(ks =>
            eingabe.soll.some(es => es.gegen === ks.gegenkonto && Math.abs(es.betrag - ks.betrag) < 0.01)
          )
        const habenOk = korrektHaben.length === eingabe.haben.length &&
          korrektHaben.every(kh =>
            eingabe.haben.some(eh => eh.gegen === kh.gegenkonto && Math.abs(eh.betrag - kh.betrag) < 0.01)
          )
        const saldoOk = eingabe.saldo.seite === konto.saldo.seite &&
          Math.abs(eingabe.saldo.betrag - konto.saldo.betrag) < 0.01
        return sollOk && habenOk && saldoOk
      })
    }

    case 'bilanzstruktur': {
      if (!('aktiven' in antwort)) return false
      const loesung = frage.loesung
      if (!loesung?.bilanz) return false
      // Vereinfachte Prüfung: Bilanzsumme korrekt
      return Math.abs(antwort.bilanzsumme - frage.loesung.bilanz!.bilanzsumme) < 0.01
    }

    case 'kontenbestimmung': {
      if (!('zuordnungen' in antwort)) return false
      const kbZuordnungen = antwort.zuordnungen as { konto: string; seite: 'soll' | 'haben' }[][]
      return frage.aufgaben.every((aufgabe, i) => {
        const eingabe = kbZuordnungen[i] || []
        if (aufgabe.erwarteteAntworten.length !== eingabe.length) return false
        return aufgabe.erwarteteAntworten.every(ea =>
          eingabe.some((ez: { konto: string; seite: string }) => ez.konto === (ea.kontonummer || '') && ez.seite === ea.seite)
        )
      })
    }

    case 'hotspot': {
      if (!('klicks' in antwort)) return false
      return frage.bereiche.length === antwort.klicks.length &&
        frage.bereiche.every(b =>
          antwort.klicks.some(k => {
            const r = b.koordinaten.radius || 10
            return Math.hypot(b.koordinaten.x - k.x, b.koordinaten.y - k.y) < r
          })
        )
    }

    case 'bildbeschriftung': {
      if (!('texte' in antwort)) return false
      return frage.beschriftungen.every(b =>
        b.korrekt.some(ka =>
          (antwort.texte[b.id] || '').trim().toLowerCase() === ka.trim().toLowerCase()
        )
      )
    }

    case 'dragdrop_bild': {
      if (!('zuordnungen' in antwort)) return false
      const ddZuordnungen = antwort.zuordnungen as Record<string, string>
      return frage.zielzonen.every(z =>
        ddZuordnungen[z.korrektesLabel] === z.id ||
        frage.labels.some(l => l === z.korrektesLabel && ddZuordnungen[l] === z.id)
      )
    }

    // Selbstbewertete Typen
    case 'freitext':
    case 'pdf':
    case 'visualisierung':
    case 'audio':
    case 'code':
      return 'selbstbewertung' in antwort && antwort.selbstbewertung === 'korrekt'

    case 'aufgabengruppe': {
      if (!('teilAntworten' in antwort)) return false
      const teilaufgaben = frage.teilaufgaben || []
      return teilaufgaben.length > 0 && Object.keys(antwort.teilAntworten).length === teilaufgaben.length
    }

    case 'formel': {
      if (!('latex' in antwort)) return false
      const soll = normalisiereLatex(frage.korrekteFormel)
      const ist = normalisiereLatex(antwort.latex)
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
