import type {
  TKontoEintrag,
  TKontoFrage,
} from '../../types/fragen-storage'
import type { Antwort } from '../../types/antworten'
import { findKonto } from '../kontenrahmen'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

// === T-KONTO AUTO-KORREKTUR ===

/** Bewerte T-Konto-Einträge: Vergleich Musterlösung vs. Eingabe (reihenfolge-unabhängig) */
function bewerteTKontoEintraege(
  erwartet: TKontoEintrag[],
  eingabe: {
    eintraegeLinks: { gegenkonto: string; betrag: number }[]
    eintraegeRechts: { gegenkonto: string; betrag: number }[]
  }
): number {
  // Leere Platzhalter-Zeilen (Frontend-UI-Default { gegenkonto: '', betrag: 0 })
  // aus der Bewertung ausschliessen, sonst senkt jede nicht ausgefüllte Zeile die
  // Score via `Math.max(..., eingabeListe.length)` künstlich.
  const istLeer = (e: { gegenkonto: string; betrag: number }) =>
    !e.gegenkonto && !e.betrag

  if (erwartet.length === 0) {
    const echteEintraege = [...eingabe.eintraegeLinks, ...eingabe.eintraegeRechts].filter(e => !istLeer(e))
    return echteEintraege.length === 0 ? 1 : 0
  }

  // Flache Liste aller Eingabe-Einträge mit Seite (leere ignorieren)
  const eingabeListe = [
    ...eingabe.eintraegeLinks.filter(e => !istLeer(e)).map(e => ({ seite: 'links' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
    ...eingabe.eintraegeRechts.filter(e => !istLeer(e)).map(e => ({ seite: 'rechts' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
  ]

  let treffer = 0
  const verwendet = new Set<number>()

  for (const ek of erwartet) {
    const erwarteteSeite = ek.seite === 'soll' ? 'links' : 'rechts'
    for (let j = 0; j < eingabeListe.length; j++) {
      if (verwendet.has(j)) continue
      const eg = eingabeListe[j]
      if (eg.seite === erwarteteSeite && eg.gegenkonto === ek.gegenkonto && eg.betrag === ek.betrag) {
        treffer++
        verwendet.add(j)
        break
      }
    }
  }

  return treffer / Math.max(erwartet.length, eingabeListe.length)
}

/** Auto-Korrektur für T-Konto-Fragen */
export function korrigiereTKonto(
  frage: TKontoFrage,
  antwortKonten: Extract<Antwort, { typ: 'tkonto' }>['konten']
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const opts = frage.bewertungsoptionen

  // Aktive Kriterien zählen — beschriftungSollHaben ist seit Ticket 3 fix (links=Soll,
  // rechts=Haben) und wird nicht mehr als Bewertungs-Kriterium gezählt.
  const aktivKriterien = [opts.kontenkategorie,
    opts.zunahmeAbnahme, opts.buchungenKorrekt, opts.saldoKorrekt].filter(Boolean).length
  const punkteProKonto = frage.punkte / Math.max(1, frage.konten.length)
  const punkteProKriterium = punkteProKonto / Math.max(1, aktivKriterien)

  for (let i = 0; i < frage.konten.length; i++) {
    const erwartet = frage.konten[i]
    const eingabe = antwortKonten.find(k => k.id === erwartet.id)

    if (!eingabe) {
      details.push({ bezeichnung: `T-Konto ${i + 1}`, korrekt: false, erreicht: 0, max: punkteProKonto })
      continue
    }

    // Kontenkategorie
    if (opts.kontenkategorie) {
      const expected = findKonto(erwartet.kontonummer)?.kategorie
      const korrekt = eingabe.kontenkategorie === expected
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Kontenkategorie`,
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Buchungen korrekt
    if (opts.buchungenKorrekt) {
      const score = bewerteTKontoEintraege(erwartet.eintraege, eingabe)
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Buchungen`,
        korrekt: score >= 0.99,
        erreicht: score * punkteProKriterium,
        max: punkteProKriterium,
      })
    }

    // U3: Saldo korrekt — neues Format mit betragLinks/betragRechts
    if (opts.saldoKorrekt) {
      const erwartetBetrag = erwartet.saldo.betrag
      const erwartetSeite = erwartet.saldo.seite // 'soll' oder 'haben'
      const korrekt = eingabe.saldo && (
        (erwartetSeite === 'soll' && eingabe.saldo.betragLinks === erwartetBetrag && !eingabe.saldo.betragRechts) ||
        (erwartetSeite === 'haben' && eingabe.saldo.betragRechts === erwartetBetrag && !eingabe.saldo.betragLinks)
      )
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Saldo`,
        korrekt: !!korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }
  }

  const tkontoErreicht = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(tkontoErreicht * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
