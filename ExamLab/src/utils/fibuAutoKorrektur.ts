import type { BuchungssatzFrage, BuchungssatzZeile, TKontoFrage, TKontoEintrag, KontenbestimmungFrage, BilanzERFrage } from '../types/fragen'
import type { Antwort } from '../types/antworten'
import { findKonto } from './kontenrahmen'

export interface KorrekturErgebnis {
  erreichtePunkte: number
  maxPunkte: number
  details: KorrekturDetail[]
}

export interface KorrekturDetail {
  bezeichnung: string
  korrekt: boolean
  erreicht: number
  max: number
  kommentar?: string
}

/** U2: Auto-correct a Buchungssatz answer (vereinfachtes Format) */
export function korrigiereBuchungssatz(
  frage: BuchungssatzFrage,
  antwortBuchungen: {
    id: string
    sollKonto: string
    habenKonto: string
    betrag: number
  }[]
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const punkteProBuchung = frage.punkte / Math.max(1, frage.buchungen.length)

  // Match each expected Buchung to the best submitted one (order-independent)
  const verwendeteAntworten = new Set<number>()

  for (let i = 0; i < frage.buchungen.length; i++) {
    const erwartet = frage.buchungen[i]
    let bestMatch = -1
    let bestScore = 0

    for (let j = 0; j < antwortBuchungen.length; j++) {
      if (verwendeteAntworten.has(j)) continue
      const score = bewerteBuchungVereinfacht(erwartet, antwortBuchungen[j])
      if (score > bestScore) {
        bestScore = score
        bestMatch = j
      }
    }

    if (bestMatch >= 0) {
      verwendeteAntworten.add(bestMatch)
    }

    const erreicht = bestScore * punkteProBuchung
    const eingabe = bestMatch >= 0 ? antwortBuchungen[bestMatch] : undefined
    details.push({
      bezeichnung: `Buchung ${i + 1}`,
      korrekt: bestScore >= 0.99,
      erreicht: Math.round(erreicht * 100) / 100,
      max: Math.round(punkteProBuchung * 100) / 100,
      kommentar: bestScore < 0.99
        ? !eingabe ? 'Buchung fehlt'
          : [
              eingabe.sollKonto !== erwartet.sollKonto ? 'Soll-Konto falsch' : '',
              eingabe.habenKonto !== erwartet.habenKonto ? 'Haben-Konto falsch' : '',
              eingabe.betrag !== erwartet.betrag ? 'Betrag falsch' : '',
            ].filter(Boolean).join(', ')
        : undefined,
    })
  }

  const erreichtePunkte = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreichtePunkte * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

/** Score: 1/3 je Soll-Konto, Haben-Konto, Betrag */
function bewerteBuchungVereinfacht(
  erwartet: BuchungssatzZeile,
  eingabe: { sollKonto: string; habenKonto: string; betrag: number }
): number {
  if (!eingabe) return 0
  let score = 0
  if (eingabe.sollKonto === erwartet.sollKonto) score += 1 / 3
  if (eingabe.habenKonto === erwartet.habenKonto) score += 1 / 3
  if (eingabe.betrag === erwartet.betrag) score += 1 / 3
  return score
}

// === T-KONTO AUTO-KORREKTUR ===

/** Bewerte T-Konto-Einträge: Vergleich Musterlösung vs. Eingabe (reihenfolge-unabhängig) */
function bewerteTKontoEintraege(
  erwartet: TKontoEintrag[],
  eingabe: {
    eintraegeLinks: { gegenkonto: string; betrag: number }[]
    eintraegeRechts: { gegenkonto: string; betrag: number }[]
  }
): number {
  if (erwartet.length === 0) {
    return (eingabe.eintraegeLinks.length === 0 && eingabe.eintraegeRechts.length === 0) ? 1 : 0
  }

  // Flache Liste aller Eingabe-Einträge mit Seite
  const eingabeListe = [
    ...eingabe.eintraegeLinks.map(e => ({ seite: 'links' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
    ...eingabe.eintraegeRechts.map(e => ({ seite: 'rechts' as const, gegenkonto: e.gegenkonto, betrag: e.betrag })),
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

  // Aktive Kriterien zählen
  const aktivKriterien = [opts.beschriftungSollHaben, opts.kontenkategorie,
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

    // Beschriftung Soll/Haben
    if (opts.beschriftungSollHaben) {
      const korrekt = eingabe.beschriftungLinks === 'Soll' && eingabe.beschriftungRechts === 'Haben'
      details.push({
        bezeichnung: `T-Konto ${i + 1}: Beschriftung`,
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
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

// === KONTENBESTIMMUNG AUTO-KORREKTUR ===

/** Auto-Korrektur für Kontenbestimmung-Fragen */
export function korrigiereKontenbestimmung(
  frage: KontenbestimmungFrage,
  antwortAufgaben: Record<string, { antworten: { kontonummer?: string; kategorie?: string; seite?: string }[] }>
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const punkteProAufgabe = frage.punkte / Math.max(1, frage.aufgaben.length)

  for (const aufgabe of frage.aufgaben) {
    const eingabe = antwortAufgaben[aufgabe.id]
    if (!eingabe || eingabe.antworten.length === 0) {
      details.push({ bezeichnung: aufgabe.text, korrekt: false, erreicht: 0, max: Math.round(punkteProAufgabe * 100) / 100 })
      continue
    }

    let korrektCount = 0
    const total = aufgabe.erwarteteAntworten.length

    for (let i = 0; i < total; i++) {
      const erwartet = aufgabe.erwarteteAntworten[i]
      const antwort = eingabe.antworten[i]
      if (!antwort) continue

      let teilKorrekt = true
      if (erwartet.kontonummer && antwort.kontonummer !== erwartet.kontonummer) teilKorrekt = false
      if (erwartet.kategorie && antwort.kategorie !== erwartet.kategorie) teilKorrekt = false
      if (erwartet.seite && antwort.seite !== erwartet.seite) teilKorrekt = false

      if (teilKorrekt) korrektCount++
    }

    const score = total > 0 ? korrektCount / total : 0
    details.push({
      bezeichnung: aufgabe.text,
      korrekt: score >= 0.99,
      erreicht: Math.round(score * punkteProAufgabe * 100) / 100,
      max: Math.round(punkteProAufgabe * 100) / 100,
    })
  }

  return {
    erreichtePunkte: Math.round(details.reduce((s, d) => s + d.erreicht, 0) * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}

// === BILANZ/ER AUTO-KORREKTUR ===

type BilanzAntwortSeite = {
  label: string
  gruppen: { label: string; konten: { nr: string; betrag: number }[] }[]
}

type BilanzAntwort = {
  bilanz?: {
    linkeSeite: BilanzAntwortSeite
    rechteSeite: BilanzAntwortSeite
    bilanzsummeLinks?: number
    bilanzsummeRechts?: number
  }
  erfolgsrechnung?: {
    stufen: { label: string; konten: { nr: string; betrag: number }[]; zwischentotal?: number }[]
    gewinnVerlust?: number
  }
}

/** Normalisiert einen String für Vergleiche (lowercase, trimmed) */
function norm(s: string): string {
  return s.toLowerCase().trim()
}

/** Prüft ob zwei Konten-Sets die gleichen Nummern enthalten (reihenfolge-unabhängig) */
function kontenSetGleich(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const sortA = [...a].sort()
  const sortB = [...b].sort()
  return sortA.every((v, i) => v === sortB[i])
}

/** Prüft ob zwei Arrays in gleicher Reihenfolge sind */
function gleicheReihenfolge(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

/** Auto-Korrektur für Bilanz/ER-Fragen */
export function korrigiereBilanzER(
  frage: BilanzERFrage,
  antwort: BilanzAntwort
): KorrekturErgebnis {
  const details: KorrekturDetail[] = []
  const opts = frage.bewertungsoptionen
  const aktivKriterien = Object.values(opts).filter(Boolean).length
  const punkteProKriterium = frage.punkte / Math.max(1, aktivKriterien)

  const loesung = frage.loesung

  // Bilanz-Prüfungen
  if (loesung.bilanz && (frage.modus === 'bilanz' || frage.modus === 'beides')) {
    const ab = antwort.bilanz
    const lb = loesung.bilanz

    // Seitenbeschriftung
    if (opts.seitenbeschriftung) {
      const korrekt = ab
        ? (norm(ab.linkeSeite.label) === norm(lb.aktivSeite.label) && norm(ab.rechteSeite.label) === norm(lb.passivSeite.label))
        : false
      details.push({
        bezeichnung: 'Bilanz: Seitenbeschriftung',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
        kommentar: korrekt ? undefined : `Erwartet: ${lb.aktivSeite.label} / ${lb.passivSeite.label}`,
      })
    }

    // Gruppenbildung
    if (opts.gruppenbildung) {
      let korrekt = false
      if (ab) {
        const erwarteteAktivGruppen = lb.aktivSeite.gruppen.map(g => norm(g.label))
        const eingabeLinksGruppen = ab.linkeSeite.gruppen.map(g => norm(g.label))
        const erwartetePassivGruppen = lb.passivSeite.gruppen.map(g => norm(g.label))
        const eingabeRechtsGruppen = ab.rechteSeite.gruppen.map(g => norm(g.label))
        korrekt = kontenSetGleich(erwarteteAktivGruppen, eingabeLinksGruppen)
          && kontenSetGleich(erwartetePassivGruppen, eingabeRechtsGruppen)
      }
      details.push({
        bezeichnung: 'Bilanz: Gruppenbildung',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Gruppenreihenfolge
    if (opts.gruppenreihenfolge) {
      let korrekt = false
      if (ab) {
        const erwAktiv = lb.aktivSeite.gruppen.map(g => norm(g.label))
        const einAktiv = ab.linkeSeite.gruppen.map(g => norm(g.label))
        const erwPassiv = lb.passivSeite.gruppen.map(g => norm(g.label))
        const einPassiv = ab.rechteSeite.gruppen.map(g => norm(g.label))
        korrekt = gleicheReihenfolge(erwAktiv, einAktiv) && gleicheReihenfolge(erwPassiv, einPassiv)
      }
      details.push({
        bezeichnung: 'Bilanz: Gruppenreihenfolge',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Kontenreihenfolge innerhalb Gruppen
    if (opts.kontenreihenfolge) {
      let korrekt = false
      if (ab) {
        korrekt = true
        // Prüfe Aktiv-Seite
        for (let i = 0; i < lb.aktivSeite.gruppen.length && korrekt; i++) {
          const erwGruppe = lb.aktivSeite.gruppen[i]
          const einGruppe = ab.linkeSeite.gruppen.find(g => norm(g.label) === norm(erwGruppe.label))
          if (einGruppe) {
            const einNrs = einGruppe.konten.map(k => k.nr)
            if (!gleicheReihenfolge(erwGruppe.konten, einNrs)) korrekt = false
          }
        }
        // Prüfe Passiv-Seite
        for (let i = 0; i < lb.passivSeite.gruppen.length && korrekt; i++) {
          const erwGruppe = lb.passivSeite.gruppen[i]
          const einGruppe = ab.rechteSeite.gruppen.find(g => norm(g.label) === norm(erwGruppe.label))
          if (einGruppe) {
            const einNrs = einGruppe.konten.map(k => k.nr)
            if (!gleicheReihenfolge(erwGruppe.konten, einNrs)) korrekt = false
          }
        }
      }
      details.push({
        bezeichnung: 'Bilanz: Kontenreihenfolge',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Beträge korrekt
    if (opts.betraegeKorrekt) {
      let korrekt = false
      if (ab) {
        const kontenSaldi = new Map(frage.kontenMitSaldi.map(k => [k.kontonummer, k.saldo]))
        korrekt = true
        const alleEingabeKonten = [
          ...ab.linkeSeite.gruppen.flatMap(g => g.konten),
          ...ab.rechteSeite.gruppen.flatMap(g => g.konten),
        ]
        for (const k of alleEingabeKonten) {
          if (k.nr && kontenSaldi.has(k.nr) && k.betrag !== kontenSaldi.get(k.nr)) {
            korrekt = false
            break
          }
        }
      }
      details.push({
        bezeichnung: 'Bilanz: Beträge korrekt',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Zwischentotale (Gruppensummen)
    if (opts.zwischentotale) {
      // Vereinfacht: Prüfe ob die Konten in den Gruppen stimmen (= indirekte Prüfung)
      let korrekt = false
      if (ab) {
        const kontenSaldi = new Map(frage.kontenMitSaldi.map(k => [k.kontonummer, k.saldo]))
        korrekt = true
        for (const gruppe of [...ab.linkeSeite.gruppen, ...ab.rechteSeite.gruppen]) {
          const summe = gruppe.konten.reduce((s, k) => s + (kontenSaldi.get(k.nr) ?? k.betrag), 0)
          const eingabeSumme = gruppe.konten.reduce((s, k) => s + k.betrag, 0)
          if (Math.abs(summe - eingabeSumme) > 0.01) {
            korrekt = false
            break
          }
        }
      }
      details.push({
        bezeichnung: 'Bilanz: Zwischentotale',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Bilanzsumme
    if (opts.bilanzsummeOderGewinn) {
      const korrekt = ab
        ? (ab.bilanzsummeLinks === lb.bilanzsumme && ab.bilanzsummeRechts === lb.bilanzsumme)
        : false
      details.push({
        bezeichnung: 'Bilanz: Bilanzsumme',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
        kommentar: korrekt ? undefined : `Erwartet: ${lb.bilanzsumme}`,
      })
    }
  }

  // ER-Prüfungen
  if (loesung.erfolgsrechnung && (frage.modus === 'erfolgsrechnung' || frage.modus === 'beides')) {
    const ae = antwort.erfolgsrechnung
    const le = loesung.erfolgsrechnung

    // Mehrstufigkeit
    if (opts.mehrstufigkeit) {
      const korrekt = ae ? ae.stufen.length === le.stufen.length : false
      details.push({
        bezeichnung: 'ER: Mehrstufigkeit',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
        kommentar: korrekt ? undefined : `Erwartet: ${le.stufen.length} Stufen`,
      })
    }

    // Seitenbeschriftung (Stufen-Labels)
    if (opts.seitenbeschriftung) {
      let korrekt = false
      if (ae && ae.stufen.length === le.stufen.length) {
        korrekt = le.stufen.every((s, i) => norm(ae.stufen[i]?.label || '') === norm(s.label))
      }
      details.push({
        bezeichnung: 'ER: Stufenbezeichnungen',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Gruppenbildung (Konten in den richtigen Stufen)
    if (opts.gruppenbildung) {
      let korrekt = false
      if (ae) {
        korrekt = true
        for (let i = 0; i < le.stufen.length && korrekt; i++) {
          const erwStufe = le.stufen[i]
          const einStufe = ae.stufen[i]
          if (!einStufe) { korrekt = false; break }
          const erwKonten = [...erwStufe.aufwandKonten, ...erwStufe.ertragKonten].sort()
          const einKonten = einStufe.konten.map(k => k.nr).sort()
          if (!kontenSetGleich(erwKonten, einKonten)) korrekt = false
        }
      }
      details.push({
        bezeichnung: 'ER: Konten-Zuordnung',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Beträge korrekt
    if (opts.betraegeKorrekt) {
      let korrekt = false
      if (ae) {
        const kontenSaldi = new Map(frage.kontenMitSaldi.map(k => [k.kontonummer, k.saldo]))
        korrekt = true
        for (const stufe of ae.stufen) {
          for (const k of stufe.konten) {
            if (k.nr && kontenSaldi.has(k.nr) && k.betrag !== kontenSaldi.get(k.nr)) {
              korrekt = false
              break
            }
          }
          if (!korrekt) break
        }
      }
      details.push({
        bezeichnung: 'ER: Beträge korrekt',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Zwischentotale
    if (opts.zwischentotale) {
      let korrekt = false
      if (ae && ae.stufen.length === le.stufen.length) {
        korrekt = le.stufen.every((s, i) => {
          const einStufe = ae.stufen[i]
          return einStufe?.zwischentotal != null && einStufe.zwischentotal === s.zwischentotal
        })
      }
      details.push({
        bezeichnung: 'ER: Zwischentotale',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }

    // Gewinn/Verlust (bilanzsummeOderGewinn option)
    if (opts.bilanzsummeOderGewinn) {
      // Berechne erwarteten Gewinn/Verlust aus der letzten Stufe
      const letzteStufe = le.stufen[le.stufen.length - 1]
      const korrekt = ae?.gewinnVerlust != null && ae.gewinnVerlust === letzteStufe.zwischentotal
      details.push({
        bezeichnung: 'ER: Gewinn/Verlust',
        korrekt,
        erreicht: korrekt ? punkteProKriterium : 0,
        max: punkteProKriterium,
      })
    }
  }

  const erreichtePunkte = details.reduce((s, d) => s + d.erreicht, 0)
  return {
    erreichtePunkte: Math.round(erreichtePunkte * 100) / 100,
    maxPunkte: frage.punkte,
    details,
  }
}
