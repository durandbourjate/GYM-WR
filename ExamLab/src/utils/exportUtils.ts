import type { PruefungsKorrektur, SchuelerAbgabe } from '../types/korrektur.ts'
import type { Frage, MCFrage, ZuordnungFrage, LueckentextFrage, RichtigFalschFrage, BerechnungFrage, PDFAnnotation } from '../types/fragen.ts'
import type { Antwort } from '../types/antworten.ts'
import type { SchuelerStatus } from '../types/monitoring.ts'
import type { PruefungsConfig } from '../types/pruefung.ts'
import { effektivePunkte, berechneNote } from './korrekturUtils.ts'

/**
 * Exportiert Korrektur-Daten als CSV (Semikolon-getrennt, UTF-8 BOM für Excel).
 * Spalten: Name; E-Mail; [Frage-IDs mit Max-Punkten]; Total; Max; Note
 */
export function exportiereAlsCSV(korrektur: PruefungsKorrektur, fragen: Frage[]): string {
  if (korrektur.schueler.length === 0) return ''

  // Alle Frage-IDs aus den Bewertungen sammeln (konsistente Reihenfolge)
  const frageIds = ermittleFrageIds(korrektur)

  // Fragen-Map für Titel-Lookup
  const fragenMap = new Map(fragen.map((f) => [f.id, f]))

  // Header-Zeile: Name; E-Mail; Frage1 (max X); Frage2 (max Y); ...; Total; Max; Note
  const header = [
    'Name',
    'E-Mail',
    ...frageIds.map((id) => {
      const frage = fragenMap.get(id)
      const maxPkt = korrektur.schueler[0]?.bewertungen[id]?.maxPunkte ?? frage?.punkte ?? 0
      return `${id} (max ${maxPkt})`
    }),
    'Total',
    'Max',
    'Note',
  ]

  // Daten-Zeilen
  const zeilen = korrektur.schueler.map((schueler) => {
    const punkteProFrage = frageIds.map((id) => {
      const bewertung = schueler.bewertungen[id]
      return bewertung ? String(effektivePunkte(bewertung)) : '0'
    })

    const total = frageIds.reduce((sum, id) => {
      const bewertung = schueler.bewertungen[id]
      return sum + (bewertung ? effektivePunkte(bewertung) : 0)
    }, 0)

    const maxPunkte = frageIds.reduce((sum, id) => {
      const bewertung = schueler.bewertungen[id]
      return sum + (bewertung?.maxPunkte ?? 0)
    }, 0)

    const note = berechneNote(total, maxPunkte)

    return [
      escapeCSV(schueler.name),
      escapeCSV(schueler.email),
      ...punkteProFrage,
      String(total),
      String(maxPunkte),
      String(note),
    ]
  })

  // CSV zusammenbauen (Semikolon als Trennzeichen, europäischer Standard)
  const csvZeilen = [header.join(';'), ...zeilen.map((z) => z.join(';'))]
  return csvZeilen.join('\n')
}

/**
 * Löst einen CSV-Download im Browser aus.
 * Fügt UTF-8 BOM hinzu für korrekte Excel-Darstellung.
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Alle eindeutigen Frage-IDs aus den Bewertungen ermitteln (stabile Reihenfolge) */
function ermittleFrageIds(korrektur: PruefungsKorrektur): string[] {
  const ids = new Set<string>()
  for (const schueler of korrektur.schueler) {
    for (const id of Object.keys(schueler.bewertungen)) {
      ids.add(id)
    }
  }
  return Array.from(ids)
}

/**
 * Exportiert Teilnahme-Übersicht als CSV (für BeendetPhase, vor der Korrektur).
 * Spalten: Name; E-Mail; Klasse; Status; Startzeit; Abgabezeit; Beantwortet; Gesamt; Unterbrechungen
 */
export function exportiereTeilnahmeCSV(
  config: PruefungsConfig,
  schuelerStatus: SchuelerStatus[],
): string {
  if (schuelerStatus.length === 0) return ''

  const header = [
    'Name',
    'E-Mail',
    'Klasse',
    'Status',
    'Startzeit',
    'Abgabezeit',
    'Beantwortet',
    'Gesamt',
    'Unterbrechungen',
  ]

  const statusLabel: Record<string, string> = {
    'aktiv': 'Aktiv',
    'inaktiv': 'Inaktiv',
    'abgegeben': 'Abgegeben',
    'nicht-gestartet': 'Nicht erschienen',
    'beendet-lp': 'Erzwungen beendet',
  }

  const formatZeit = (iso: string | null): string => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const zeilen = schuelerStatus
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
    .map((s) => [
      escapeCSV(s.name || ''),
      escapeCSV(s.email),
      escapeCSV(s.klasse || ''),
      statusLabel[s.status] || s.status,
      formatZeit(s.startzeit),
      formatZeit(s.abgabezeit),
      String(s.beantworteteFragen),
      String(s.gesamtFragen),
      String(s.unterbrechungen?.length ?? 0),
    ])

  const titelZeile = `Prüfung: ${escapeCSV(config.titel || config.id)}`
  const csvZeilen = [titelZeile, header.join(';'), ...zeilen.map((z) => z.join(';'))]
  return csvZeilen.join('\n')
}

// ============================================================================
// Detaillierter Ergebnis-Export (mit Antworttext + Punkten pro Frage)
// ============================================================================

/**
 * Konvertiert eine SuS-Antwort in lesbaren Text für den CSV-Export.
 * Behandelt alle 11 Fragetypen.
 */
export function antwortAlsText(antwort: Antwort | undefined, frage: Frage): string {
  if (!antwort) return '(keine Antwort)'

  switch (antwort.typ) {
    case 'mc': {
      // Gewählte Optionen-Texte anzeigen
      const mcFrage = frage as MCFrage
      if (!mcFrage.optionen) return antwort.gewaehlteOptionen.join(', ')
      const labels = antwort.gewaehlteOptionen.map((optId) => {
        const opt = mcFrage.optionen.find((o) => o.id === optId)
        return opt?.text ?? optId
      })
      return labels.join(', ')
    }

    case 'freitext': {
      // HTML-Tags entfernen, auf 500 Zeichen kürzen
      const rein = antwort.text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
      return rein.length > 500 ? rein.slice(0, 497) + '...' : rein
    }

    case 'lueckentext': {
      // Lücken in Reihenfolge der Frage anzeigen
      const ltFrage = frage as LueckentextFrage
      if (!ltFrage.luecken) return Object.values(antwort.eintraege).join(', ')
      return ltFrage.luecken
        .map((l) => antwort.eintraege[l.id] ?? '')
        .join(', ')
    }

    case 'zuordnung': {
      // "Links → Rechts" Paare
      const zFrage = frage as ZuordnungFrage
      if (!zFrage.paare) {
        return Object.entries(antwort.zuordnungen)
          .map(([k, v]) => `${k} → ${v}`)
          .join(', ')
      }
      return Object.entries(antwort.zuordnungen)
        .map(([linksId, rechtsId]) => {
          const paar = zFrage.paare.find((p) => p.links === linksId)
          return `${paar?.links ?? linksId} → ${rechtsId}`
        })
        .join(', ')
    }

    case 'richtigfalsch': {
      // "R, F, R, ..." in Aussagen-Reihenfolge
      const rfFrage = frage as RichtigFalschFrage
      if (!rfFrage.aussagen) {
        return Object.entries(antwort.bewertungen)
          .map(([, v]) => v ? 'R' : 'F')
          .join(', ')
      }
      return rfFrage.aussagen
        .map((a) => antwort.bewertungen[a.id] === true ? 'R' : antwort.bewertungen[a.id] === false ? 'F' : '–')
        .join(', ')
    }

    case 'berechnung': {
      // Ergebnisse mit Labels
      const bFrage = frage as BerechnungFrage
      const teile = bFrage.ergebnisse?.map((e) => {
        const wert = antwort.ergebnisse[e.id] ?? ''
        return `${e.label}: ${wert}${e.einheit ? ' ' + e.einheit : ''}`
      }) ?? Object.entries(antwort.ergebnisse).map(([k, v]) => `${k}: ${v}`)
      const text = teile.join(', ')
      if (antwort.rechenweg) return `${text} | Rechenweg: ${antwort.rechenweg.slice(0, 200)}`
      return text
    }

    case 'buchungssatz': {
      // "Soll Kto/Betrag / Haben Kto/Betrag" pro Buchung
      return antwort.buchungen.map((b) =>
        `Soll ${b.sollKonto} ${b.betrag} / Haben ${b.habenKonto} ${b.betrag}`
      ).join('; ')
    }

    case 'tkonto': {
      // Kurzform pro Konto: "Konto: L1+L2 | R1+R2"
      return antwort.konten.map((k) => {
        const links = k.eintraegeLinks.map((e) => `${e.gegenkonto} ${e.betrag}`).join('+')
        const rechts = k.eintraegeRechts.map((e) => `${e.gegenkonto} ${e.betrag}`).join('+')
        const label = k.beschriftungLinks || k.id
        return `${label}: ${links || '–'} | ${rechts || '–'}`
      }).join('; ')
    }

    case 'kontenbestimmung': {
      // Aufgabe-ID → Antworten
      return Object.entries(antwort.aufgaben).map(([aufgId, aufg]) => {
        const teile = aufg.antworten.map((a) => {
          const parts: string[] = []
          if (a.kontonummer) parts.push(a.kontonummer)
          if (a.kategorie) parts.push(a.kategorie)
          if (a.seite) parts.push(a.seite)
          return parts.join('/')
        })
        return `${aufgId}: ${teile.join(', ')}`
      }).join('; ')
    }

    case 'bilanzstruktur': {
      // Vereinfachte Zusammenfassung
      const teile: string[] = []
      if (antwort.bilanz) {
        const lAnz = antwort.bilanz.linkeSeite.gruppen.reduce((s, g) => s + g.konten.length, 0)
        const rAnz = antwort.bilanz.rechteSeite.gruppen.reduce((s, g) => s + g.konten.length, 0)
        teile.push(`Bilanz: ${lAnz}+${rAnz} Konten`)
        if (antwort.bilanz.bilanzsummeLinks != null) teile.push(`Summe ${antwort.bilanz.bilanzsummeLinks}`)
      }
      if (antwort.erfolgsrechnung) {
        const stufen = antwort.erfolgsrechnung.stufen.length
        teile.push(`ER: ${stufen} Stufen`)
        if (antwort.erfolgsrechnung.gewinnVerlust != null) teile.push(`G/V ${antwort.erfolgsrechnung.gewinnVerlust}`)
      }
      return teile.join(', ') || '(leer)'
    }

    case 'visualisierung': {
      if (antwort.bildLink) return '(Zeichnung vorhanden — siehe Anhang)'
      if (antwort.daten) {
        try {
          const commands = JSON.parse(antwort.daten)
          return `(Zeichnung: ${Array.isArray(commands) ? commands.length : '?'} Elemente)`
        } catch { return '(Zeichnung vorhanden)' }
      }
      return '(keine Eingabe)'
    }

    case 'pdf': {
      const pdfAntwort = antwort as { typ: 'pdf'; annotationen: PDFAnnotation[] }
      const count = pdfAntwort.annotationen?.length ?? 0
      return count > 0 ? `(${count} PDF-Annotationen vorhanden)` : '(keine Annotationen)'
    }

    default:
      return '(unbekannter Typ)'
  }
}

/** Kürzt Fragetext auf maxLen Zeichen für Spalten-Header */
function kuerzeFragetext(text: string, maxLen: number = 40): string {
  const rein = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return rein.length > maxLen ? rein.slice(0, maxLen - 1) + '…' : rein
}

/**
 * Detaillierter Ergebnis-Export mit Antworttext UND Punkten pro Frage.
 * Spalten: Name; E-Mail; Klasse; [Frage X (Antwort); Frage X (Punkte)]; Total; Max; Note; LP-Kommentar
 * Zeile 1: Prüfungstitel, Datum, Klasse (Metadaten)
 * Zeile 2: Spaltenüberschriften
 * Zeilen 3+: Daten (eine pro SuS)
 */
export function exportiereErgebnisseAlsCSV(
  korrektur: PruefungsKorrektur,
  fragen: Frage[],
  abgaben: Record<string, SchuelerAbgabe>,
): string {
  if (korrektur.schueler.length === 0) return ''

  const frageIds = ermittleFrageIds(korrektur)
  const fragenMap = new Map(fragen.map((f) => [f.id, f]))

  // Zeile 1: Meta-Info
  const metaZeile = `Prüfung: ${escapeCSV(korrektur.pruefungTitel)};Datum: ${korrektur.datum};Klasse: ${escapeCSV(korrektur.klasse)}`

  // Zeile 2: Spalten-Header (je Frage: Antwort + Punkte)
  const header: string[] = ['Name', 'E-Mail', 'Klasse']
  for (const id of frageIds) {
    const frage = fragenMap.get(id)
    const fragetext = frage ? kuerzeFragetext(getFragetext(frage)) : id
    const maxPkt = korrektur.schueler[0]?.bewertungen[id]?.maxPunkte ?? frage?.punkte ?? 0
    header.push(escapeCSV(`${fragetext} (Antwort)`))
    header.push(escapeCSV(`${fragetext} (${maxPkt}P)`))
  }
  header.push('Total', 'Max', 'Note', 'LP-Kommentar')

  // Daten-Zeilen
  const zeilen = korrektur.schueler
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((schueler) => {
      const abgabe = abgaben[schueler.email]
      const zelle: string[] = [
        escapeCSV(schueler.name),
        escapeCSV(schueler.email),
        escapeCSV(schueler.klasse || korrektur.klasse || ''),
      ]

      // Kommentare sammeln (LP-Kommentare aus allen Fragen)
      const kommentare: string[] = []

      for (const id of frageIds) {
        const frage = fragenMap.get(id)
        const bewertung = schueler.bewertungen[id]
        const antwort = abgabe?.antworten?.[id]

        // Antworttext
        const antwortText = frage ? antwortAlsText(antwort, frage) : '–'
        zelle.push(escapeCSV(antwortText))

        // Punkte
        const punkte = bewertung ? effektivePunkte(bewertung) : 0
        zelle.push(String(punkte))

        // LP-Kommentar sammeln
        if (bewertung?.lpKommentar) {
          const kurzId = frage ? kuerzeFragetext(getFragetext(frage), 20) : id
          kommentare.push(`${kurzId}: ${bewertung.lpKommentar}`)
        }
      }

      const total = frageIds.reduce((sum, id) => {
        const bew = schueler.bewertungen[id]
        return sum + (bew ? effektivePunkte(bew) : 0)
      }, 0)

      const maxPunkte = frageIds.reduce((sum, id) => {
        const bew = schueler.bewertungen[id]
        return sum + (bew?.maxPunkte ?? 0)
      }, 0)

      const note = schueler.noteOverride ?? berechneNote(total, maxPunkte)

      zelle.push(String(total))
      zelle.push(String(maxPunkte))
      zelle.push(String(note))
      zelle.push(escapeCSV(kommentare.join(' | ')))

      return zelle
    })

  const csvZeilen = [metaZeile, header.join(';'), ...zeilen.map((z) => z.join(';'))]
  return csvZeilen.join('\n')
}

/** Extrahiert den Fragetext aus einer Frage (verschiedene Feld-Namen je Typ) */
function getFragetext(frage: Frage): string {
  if ('fragetext' in frage && frage.fragetext) return frage.fragetext
  if ('aufgabentext' in frage && frage.aufgabentext) return frage.aufgabentext
  if ('geschaeftsfall' in frage && frage.geschaeftsfall) return frage.geschaeftsfall
  if ('kontext' in frage && frage.kontext) return frage.kontext
  return frage.id
}

/** CSV-Feld escapen: Semikolon, Anführungszeichen, Zeilenumbrüche */
function escapeCSV(wert: string): string {
  if (wert.includes(';') || wert.includes('"') || wert.includes('\n')) {
    return `"${wert.replace(/"/g, '""')}"`
  }
  return wert
}
