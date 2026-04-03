import type { Frage, AntwortTyp } from '../types/fragen'

export function pruefeAntwort(frage: Frage, antwort: AntwortTyp): boolean {
  switch (antwort.typ) {
    case 'mc':
      return antwort.gewaehlt === frage.korrekt

    case 'multi': {
      const korrekt = frage.korrekt as string[]
      const gewaehlt = [...antwort.gewaehlt].sort()
      return korrekt.length === gewaehlt.length &&
        [...korrekt].sort().every((k, i) => k === gewaehlt[i])
    }

    case 'tf': {
      const aussagen = frage.aussagen || []
      return aussagen.every((a, i) =>
        antwort.bewertungen[String(i)] === a.korrekt
      )
    }

    case 'fill': {
      const luecken = frage.luecken || []
      return luecken.every(l =>
        (antwort.eintraege[l.id] || '').trim().toLowerCase() === l.korrekt.trim().toLowerCase()
      )
    }

    case 'calc': {
      const soll = parseFloat(frage.korrekt as string)
      const ist = parseFloat(antwort.wert)
      if (isNaN(soll) || isNaN(ist)) return false
      const toleranz = frage.toleranz ?? 0
      return Math.abs(soll - ist) <= toleranz
    }

    case 'sort': {
      const elemente = frage.elemente || []
      return elemente.every(e =>
        antwort.zuordnungen[e.text] === e.kategorie
      )
    }

    case 'sortierung': {
      const korrekt = frage.reihenfolge || []
      return korrekt.length === antwort.reihenfolge.length &&
        korrekt.every((k, i) => k === antwort.reihenfolge[i])
    }

    case 'zuordnung': {
      const paare = frage.paare || []
      return paare.every(p => antwort.paare[p.links] === p.rechts)
    }

    // FiBu-Typen
    case 'buchungssatz': {
      const korrektZeilen = frage.buchungssatzKorrekt || []
      const eingabeZeilen = antwort.zeilen || []
      if (korrektZeilen.length !== eingabeZeilen.length) return false
      // Jede korrekte Zeile muss matchen (reihenfolge-unabhängig)
      const genutzt = new Set<number>()
      return korrektZeilen.every(kz =>
        eingabeZeilen.some((ez, i) => {
          if (genutzt.has(i)) return false
          if (ez.soll === kz.soll && ez.haben === kz.haben && Math.abs(ez.betrag - kz.betrag) < 0.01) {
            genutzt.add(i)
            return true
          }
          return false
        })
      )
    }

    case 'tkonto': {
      const tkontoKonten = frage.tkontoKonten || []
      return tkontoKonten.every(konto => {
        const eingabe = antwort.konten[konto.nr]
        if (!eingabe) return false
        // Soll-Einträge prüfen
        const sollOk = konto.correctSoll.length === eingabe.soll.length &&
          konto.correctSoll.every(ks =>
            eingabe.soll.some(es => es.gegen === ks.gegen && Math.abs(es.betrag - ks.betrag) < 0.01)
          )
        // Haben-Einträge prüfen
        const habenOk = konto.correctHaben.length === eingabe.haben.length &&
          konto.correctHaben.every(kh =>
            eingabe.haben.some(eh => eh.gegen === kh.gegen && Math.abs(eh.betrag - kh.betrag) < 0.01)
          )
        // Saldo prüfen
        const saldoOk = konto.correctSaldo &&
          eingabe.saldo.seite === konto.correctSaldo.seite &&
          Math.abs(eingabe.saldo.betrag - konto.correctSaldo.betrag) < 0.01
        return sollOk && habenOk && saldoOk
      })
    }

    case 'bilanz': {
      const bk = frage.bilanzKorrekt
      if (!bk) return false
      const aktivenOk = bk.aktiven.length === antwort.aktiven.length &&
        bk.aktiven.every(nr => antwort.aktiven.includes(nr))
      const passivenOk = bk.passiven.length === antwort.passiven.length &&
        bk.passiven.every(nr => antwort.passiven.includes(nr))
      const summeOk = Math.abs(antwort.bilanzsumme - bk.bilanzsumme) < 0.01
      return aktivenOk && passivenOk && summeOk
    }

    case 'kontenbestimmung': {
      const aufgaben = frage.aufgaben || []
      return aufgaben.every((aufgabe, i) => {
        const eingabe = antwort.zuordnungen[i] || []
        if (aufgabe.correct.length !== eingabe.length) return false
        return aufgabe.correct.every(kz =>
          eingabe.some(ez => ez.konto === kz.konto && ez.seite === kz.seite)
        )
      })
    }

    // Bild-Typen
    case 'hotspot': {
      const hotspots = frage.hotspots || []
      const korrektIdx = (frage.korrekt as number[]) || []
      const korrektHotspots = korrektIdx.map(i => hotspots[i]).filter(Boolean)
      // Jeder Klick muss einen korrekten Hotspot treffen (innerhalb Radius)
      return korrektHotspots.length === antwort.klicks.length &&
        korrektHotspots.every(hs =>
          antwort.klicks.some(k => Math.hypot(hs.x - k.x, hs.y - k.y) < hs.r)
        )
    }

    case 'bildbeschriftung': {
      const labels = frage.labels || []
      return labels.every(l =>
        (antwort.texte[l.id] || '').trim().toLowerCase() === l.text.trim().toLowerCase()
      )
    }

    case 'dragdrop_bild': {
      const dragLabels = frage.dragLabels || []
      return dragLabels.every(l => antwort.zuordnungen[l.id] === l.zone)
    }

    // Selbstbewertete Typen: Ergebnis basiert auf Nutzer-Eingabe
    case 'open':
      return antwort.selbstbewertung === 'korrekt'

    case 'pdf':
      return antwort.selbstbewertung === 'korrekt'

    case 'zeichnen':
      return antwort.selbstbewertung === 'korrekt'

    case 'audio':
      return antwort.selbstbewertung === 'korrekt'

    case 'code':
      return antwort.selbstbewertung === 'korrekt'

    // Formel: normalisierter String-Vergleich
    case 'formel': {
      const soll = normalisiereLatex(frage.korrekt as string || '')
      const ist = normalisiereLatex(antwort.latex)
      return soll === ist
    }

    default:
      return false
  }
}

/** LaTeX normalisieren fuer Vergleich: Leerzeichen, Backslash-Varianten */
function normalisiereLatex(s: string): string {
  return s
    .replace(/\s+/g, '')           // Alle Leerzeichen entfernen
    .replace(/\\cdot/g, '\\times') // cdot und times gleichwertig
    .replace(/\*\*/g, '^')         // ** als Potenz
    .toLowerCase()
}
