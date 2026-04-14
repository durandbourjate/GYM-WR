/**
 * Generierung von Musterlösungs-Texten für FiBu-Fragetypen.
 * Extrahiert aus FragenEditor.tsx — reine Funktionen ohne Komponentenabhängigkeiten.
 */
import type {
  BuchungssatzZeile, TKontoDefinition, Kontenaufgabe,
  BilanzERLoesung, KontoMitSaldo,
} from '../types/fragen.ts'
import { kontoLabel } from './kontenrahmen.ts'

/** Schweizer Zahlenformat mit Apostroph (5'000) */
export function chf(betrag: number): string {
  return betrag.toLocaleString('de-CH')
}

/** Buchungssatz → Musterlösung-Text */
export function generiereMuserloesungBuchungssatz(buchungen: BuchungssatzZeile[]): string {
  return buchungen.map((b, i) => {
    const prefix = buchungen.length > 1 ? `Buchung ${i + 1}: ` : ''
    return prefix + `Soll ${kontoLabel(b.sollKonto)} CHF ${chf(b.betrag)}, Haben ${kontoLabel(b.habenKonto)} CHF ${chf(b.betrag)}`
  }).join('\n')
}

/** T-Konto → Musterlösung-Text */
export function generiereMuserloesungTKonto(konten: TKontoDefinition[]): string {
  return konten.map(k => {
    const label = kontoLabel(k.kontonummer)
    const sollSumme = (k.anfangsbestand && k.saldo.seite === 'soll' ? k.anfangsbestand : 0)
      + k.eintraege.filter(e => e.seite === 'soll').reduce((s, e) => s + e.betrag, 0)
    const habenSumme = (k.anfangsbestand && k.saldo.seite === 'haben' ? k.anfangsbestand : 0)
      + k.eintraege.filter(e => e.seite === 'haben').reduce((s, e) => s + e.betrag, 0)
    return `${label}: Soll ${chf(sollSumme)} / Haben ${chf(habenSumme)} → Saldo ${chf(k.saldo.betrag)} (${k.saldo.seite === 'soll' ? 'Soll' : 'Haben'})`
  }).join('\n')
}

/** Kontenbestimmung → Musterlösung-Text */
export function generiereMuserloesungKontenbestimmung(aufgaben: Kontenaufgabe[]): string {
  return aufgaben.map((a, i) => {
    const antworten = a.erwarteteAntworten.map(ea => {
      const teile: string[] = []
      if (ea.kontonummer) teile.push(kontoLabel(ea.kontonummer))
      if (ea.kategorie) teile.push(ea.kategorie)
      if (ea.seite) teile.push(ea.seite === 'soll' ? 'Soll' : 'Haben')
      return teile.join(', ')
    }).join(' / ')
    return `${i + 1}. ${a.text}: ${antworten}`
  }).join('\n')
}

/** Bilanz/ER → Musterlösung-Text */
export function generiereMuserloesungBilanzER(loesung: BilanzERLoesung, kontenMitSaldi: KontoMitSaldo[]): string {
  const teile: string[] = []

  if (loesung.bilanz) {
    const b = loesung.bilanz
    const aktivTeile = b.aktivSeite.gruppen.map(g => {
      const summe = g.konten.reduce((s, nr) => {
        const km = kontenMitSaldi.find(k => k.kontonummer === nr)
        return s + (km?.saldo ?? 0)
      }, 0)
      return `${g.label} ${chf(summe)}`
    }).join(', ')
    const passivTeile = b.passivSeite.gruppen.map(g => {
      const summe = g.konten.reduce((s, nr) => {
        const km = kontenMitSaldi.find(k => k.kontonummer === nr)
        return s + (km?.saldo ?? 0)
      }, 0)
      return `${g.label} ${chf(summe)}`
    }).join(', ')
    teile.push(`Aktiven: ${aktivTeile} | Passiven: ${passivTeile} | Summe: ${chf(b.bilanzsumme)}`)
  }

  if (loesung.erfolgsrechnung) {
    const er = loesung.erfolgsrechnung
    const stufenText = er.stufen.map(s => `${s.label}: ${chf(s.zwischentotal)}`).join(', ')
    teile.push(`ER: ${stufenText}`)
  }

  return teile.join('\n')
}
