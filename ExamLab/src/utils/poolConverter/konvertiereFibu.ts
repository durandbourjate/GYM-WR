import type {
  Frage,
  BilanzERFrage,
  BuchungssatzFrage,
  TKontoFrage,
  KontenbestimmungFrage,
} from '../../types/fragen-storage'
import type { PoolFrage } from '../../types/pool'
import type { BasisFelder } from './index'
import { genId } from './konstanten'

export function konvertiereFibu(poolFrage: PoolFrage, basis: BasisFelder): Frage {
  switch (poolFrage.type) {
    // bilanz → BilanzERFrage
    // Pool-Format: { aktiven: string[], passiven: string[], bilanzsumme }
    // Storage-Format: BilanzERLoesung mit BilanzStruktur (aktivSeite/passivSeite/bilanzsumme)
    case 'bilanz': {
      const aktivKonten = poolFrage.correct?.aktiven ?? []
      const passivKonten = poolFrage.correct?.passiven ?? []
      const frage: BilanzERFrage = {
        ...basis,
        typ: 'bilanzstruktur',
        aufgabentext: poolFrage.q,
        modus: poolFrage.modus ?? 'bilanz',
        kontenMitSaldi: (poolFrage.kontenMitSaldi ?? []).map((k) => ({
          kontonummer: k.nr,
          name: k.name,
          saldo: k.saldo,
        })),
        loesung: {
          bilanz: {
            aktivSeite: { label: 'Aktiven', gruppen: [{ label: 'Aktiven', konten: aktivKonten }] },
            passivSeite: { label: 'Passiven', gruppen: [{ label: 'Passiven', konten: passivKonten }] },
            bilanzsumme: poolFrage.correct?.bilanzsumme ?? 0,
          },
        },
        bewertungsoptionen: {
          seitenbeschriftung: true, gruppenbildung: true, gruppenreihenfolge: true,
          kontenreihenfolge: true, betraegeKorrekt: true, zwischentotale: true,
          bilanzsummeOderGewinn: true, mehrstufigkeit: false,
        },
      }
      return frage
    }

    // buchungssatz → BuchungssatzFrage
    // Pool-Format: correct: [{soll, haben, betrag}], konten: [{nr, name}]
    // Storage-Format: buchungen: [{id, sollKonto, habenKonto, betrag}], kontenauswahl.konten: string[]
    case 'buchungssatz': {
      const frage: BuchungssatzFrage = {
        ...basis,
        typ: 'buchungssatz',
        geschaeftsfall: poolFrage.q,
        buchungen: (poolFrage.correct ?? []).map((b) => ({
          id: genId(),
          sollKonto: b.soll,
          habenKonto: b.haben,
          betrag: b.betrag,
        })),
        kontenauswahl: {
          modus: 'eingeschraenkt' as const,
          konten: (poolFrage.konten ?? []).map((k) => k.nr),
        },
      }
      return frage
    }

    // tkonto → TKontoFrage
    // Pool-Format: konten: [{nr, name, ab, correctSoll, correctHaben, correctSaldo}]
    // Storage-Format: konten: TKontoDefinition[] mit eintraege: TKontoEintrag[]
    case 'tkonto': {
      const frage: TKontoFrage = {
        ...basis,
        typ: 'tkonto',
        aufgabentext: poolFrage.q,
        geschaeftsfaelle: poolFrage.geschaeftsfaelle ?? [],
        konten: (poolFrage.konten ?? []).map((k) => ({
          id: genId(),
          kontonummer: k.nr,
          anfangsbestand: k.ab,
          anfangsbestandVorgegeben: k.ab !== undefined,
          eintraege: [
            ...(k.correctSoll ?? []).map((e) => ({
              seite: 'soll' as const,
              gegenkonto: e.gegen,
              betrag: e.betrag,
            })),
            ...(k.correctHaben ?? []).map((e) => ({
              seite: 'haben' as const,
              gegenkonto: e.gegen,
              betrag: e.betrag,
            })),
          ],
          saldo: k.correctSaldo ?? { betrag: 0, seite: 'soll' as const },
        })),
        kontenauswahl: {
          modus: 'eingeschraenkt' as const,
          konten: (poolFrage.gegenkonten ?? []).map((k) => k.nr),
        },
        bewertungsoptionen: {
          beschriftungSollHaben: true, kontenkategorie: true,
          zunahmeAbnahme: true, buchungenKorrekt: true, saldoKorrekt: true,
        },
      }
      return frage
    }

    // kontenbestimmung → KontenbestimmungFrage
    // Pool-Format: aufgaben: [{text, correct: [{konto, seite}]}]
    // Storage-Format: aufgaben: [{id, text, erwarteteAntworten: [{kontonummer, seite}]}]
    case 'kontenbestimmung': {
      const frage: KontenbestimmungFrage = {
        ...basis,
        typ: 'kontenbestimmung',
        aufgabentext: poolFrage.q,
        modus: 'gemischt',
        aufgaben: (poolFrage.aufgaben ?? []).map((a) => ({
          id: genId(),
          text: a.text,
          erwarteteAntworten: (a.correct ?? []).map((c) => ({
            kontonummer: c.konto,
            kategorie: c.kategorie,
            seite: c.seite,
          })),
        })),
        kontenauswahl: {
          modus: 'eingeschraenkt' as const,
          konten: (poolFrage.konten ?? []).map((k) => k.nr),
        },
      }
      return frage
    }
  }
  throw new Error(`konvertiereFibu called with non-fibu type: ${(poolFrage as { type: string }).type}`)
}
