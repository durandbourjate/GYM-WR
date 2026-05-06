import type { BilanzERFrage } from '../../types/fragen-storage'
import { norm, kontenSetGleich, gleicheReihenfolge } from './util'
import type { KorrekturErgebnis, KorrekturDetail } from './types'

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
