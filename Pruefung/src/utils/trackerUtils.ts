/**
 * Client-seitige Berechnungen für den Prüfungstracker.
 */
import type { TrackerPruefungSummary, TrackerDaten, PruefungsStatus, NotenStandKurs, FehlenderSchueler, FragenPerformance } from '../types/tracker.ts'

/** Leitet den Prüfungsstatus aus den Tracker-Daten ab */
export function bestimmePruefungsStatus(s: TrackerPruefungSummary): PruefungsStatus {
  if (s.korrekturStatus === 'fertig') return 'korrigiert'
  if (s.beendetUm) return 'beendet'
  if (s.freigeschaltet) return 'aktiv'
  return 'entwurf'
}

/** Status-Label für Anzeige */
export function statusLabel(status: PruefungsStatus): string {
  switch (status) {
    case 'entwurf': return 'Entwurf'
    case 'aktiv': return 'Aktiv'
    case 'beendet': return 'Beendet'
    case 'korrigiert': return 'Korrigiert'
  }
}

/** Status-Farbe (Tailwind-Klassen für den Punkt) */
export function statusFarbe(status: PruefungsStatus): string {
  switch (status) {
    case 'entwurf': return 'bg-slate-400'
    case 'aktiv': return 'bg-blue-500'
    case 'beendet': return 'bg-amber-500'
    case 'korrigiert': return 'bg-green-500'
  }
}

/** Korrektur-Label */
export function korrekturLabel(s: TrackerPruefungSummary): string {
  switch (s.korrekturStatus) {
    case 'keine-daten': return 'Noch nicht korrigiert'
    case 'offen': return 'Korrektur offen'
    case 'teilweise': return `${s.korrigiertAnzahl}/${s.korrigiertGesamt} korrigiert`
    case 'fertig': return '✓ Fertig'
  }
}

/** Sammelt alle fehlenden SuS über alle Prüfungen mit Prüfungsinfo */
export function berechneFehlendeSuS(tracker: TrackerDaten): (FehlenderSchueler & { pruefungId: string; pruefungTitel: string; datum: string })[] {
  const ergebnis: (FehlenderSchueler & { pruefungId: string; pruefungTitel: string; datum: string })[] = []
  for (const p of tracker.pruefungen) {
    if (!p.beendetUm) continue // nur beendete Prüfungen
    for (const sus of p.nichtErschienen) {
      ergebnis.push({
        ...sus,
        pruefungId: p.pruefungId,
        pruefungTitel: p.titel,
        datum: p.datum,
      })
    }
  }
  return ergebnis
}

/**
 * Berechnet den Noten-Stand pro Kurs basierend auf MiSDV Art. 4.
 *
 * Regeln (vereinfacht):
 * - SF/EF ≤3 L/Woche: min. 3 Noten pro Schuljahr
 * - SF/EF >3 L/Woche: min. 4 Noten pro Schuljahr
 * - GYM1 zusätzlich: min. 2 Noten bis Ende Semester 1 (Standortbestimmung)
 */
export function berechneNotenStand(tracker: TrackerDaten): NotenStandKurs[] {
  // Nur summative, korrigierte Prüfungen zählen
  const summative = tracker.pruefungen.filter(
    (p) => p.typ === 'summativ' && p.durchschnittNote !== null
  )

  // Gruppiere nach Kurs (klasse + gefaess)
  const kursMap = new Map<string, { gefaess: string; anzahl: number }>()
  for (const p of summative) {
    const key = `${p.klasse} ${p.gefaess}`
    const existing = kursMap.get(key) || { gefaess: p.gefaess, anzahl: 0 }
    existing.anzahl++
    kursMap.set(key, existing)
  }

  const ergebnis: NotenStandKurs[] = []

  for (const [kurs, data] of kursMap) {
    // Bestimme Vorgabe anhand Gefäss
    // SF: 3-4 L/Wo → min 3-4 Noten/Jahr
    // EF: 2 L/Wo → min 3 Noten/Jahr
    // EWR/GF: 2-3 L/Wo → min 3 Noten/Jahr
    const istSFhoch = data.gefaess === 'SF' // SF hat i.d.R. 3-4 L/Wo
    const minNoten = istSFhoch ? 4 : 3
    const diff = data.anzahl - minNoten

    let status: 'ok' | 'warning' | 'critical'
    if (diff >= 0) status = 'ok'
    else if (diff === -1) status = 'warning'
    else status = 'critical'

    ergebnis.push({
      kursId: kurs.toLowerCase().replace(/\s+/g, '-'),
      kurs,
      gefaess: data.gefaess,
      semester: 'SJ',
      vorhandeneNoten: data.anzahl,
      erforderlicheNoten: minNoten,
      status,
      naechsterTermin: 'Jahreszeugnis',
    })
  }

  // Sortieren: kritische zuerst
  ergebnis.sort((a, b) => {
    const prio = { critical: 0, warning: 1, ok: 2 }
    return prio[a.status] - prio[b.status] || a.kurs.localeCompare(b.kurs)
  })

  return ergebnis
}

/**
 * Aggregiert Fragen-Performance über alle Prüfungen.
 * Berechnet pro frageId: ∅ Lösungsquote, Anzahl Verwendungen, Gesamt-N.
 */
export function aggregiereFragenPerformance(tracker: TrackerDaten): Map<string, FragenPerformance> {
  const map = new Map<string, FragenPerformance>()

  for (const p of tracker.pruefungen) {
    if (!p.fragenStats) continue
    for (const [frageId, stat] of Object.entries(p.fragenStats)) {
      let perf = map.get(frageId)
      if (!perf) {
        perf = {
          frageId,
          anzahlVerwendungen: 0,
          gesamtN: 0,
          durchschnittLoesungsquote: 0,
          durchschnittTrennschaerfe: null,
          verwendungen: [],
        }
        map.set(frageId, perf)
      }
      perf.anzahlVerwendungen++
      perf.gesamtN += stat.n
      perf.verwendungen.push({
        pruefungId: p.pruefungId,
        pruefungTitel: p.titel,
        datum: p.datum,
        loesungsquote: stat.loesungsquote,
        n: stat.n,
        trennschaerfe: stat.trennschaerfe ?? null,
      })
    }
  }

  // ∅ Lösungsquote + ∅ Trennschärfe berechnen (gewichtet nach n)
  for (const perf of map.values()) {
    if (perf.gesamtN > 0) {
      let gewLQ = 0
      let gewTS = 0
      let tsN = 0
      for (const v of perf.verwendungen) {
        gewLQ += v.loesungsquote * v.n
        if (v.trennschaerfe != null) {
          gewTS += v.trennschaerfe * v.n
          tsN += v.n
        }
      }
      perf.durchschnittLoesungsquote = Math.round(gewLQ / perf.gesamtN)
      perf.durchschnittTrennschaerfe = tsN > 0 ? Math.round((gewTS / tsN) * 100) / 100 : null
    }
  }

  return map
}

/** Farbe für Lösungsquote (Tailwind-Klassen) */
export function loesungsquoteFarbe(quote: number): string {
  if (quote >= 70) return 'text-green-600 dark:text-green-400'
  if (quote >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

/** Hintergrundfarbe für Lösungsquote */
export function loesungsquoteBgFarbe(quote: number): string {
  if (quote >= 70) return 'bg-green-500'
  if (quote >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

/** Demo-Tracker-Daten für den Demo-Modus */
export function erstelleDemoTrackerDaten(): TrackerDaten {
  return {
    pruefungen: [
      {
        pruefungId: 'demo-1',
        titel: 'VWL-Test Konjunktur',
        klasse: '28bc29fs',
        gefaess: 'SF',
        fachbereiche: ['VWL'],
        semester: 'S1',
        datum: '2026-03-10',
        typ: 'summativ',
        gesamtpunkte: 30,
        freigeschaltet: true,
        beendetUm: '2026-03-10T10:45:00Z',
        teilnehmerGesamt: 24,
        eingereicht: 22,
        nichtErschienen: [
          { email: 'mueller.anna@stud.gymhofwil.ch', name: 'Müller Anna', klasse: '28b' },
          { email: 'weber.luca@stud.gymhofwil.ch', name: 'Weber Luca', klasse: '29f' },
        ],
        korrekturStatus: 'fertig',
        korrigiertAnzahl: 22,
        korrigiertGesamt: 22,
        durchschnittNote: 4.3,
        bestandenRate: 85,
        fragenStats: {
          'demo-mc-1': { loesungsquote: 82, durchschnittPunkte: 2.5, maxPunkte: 3, n: 22 },
          'demo-ft-1': { loesungsquote: 65, durchschnittPunkte: 3.9, maxPunkte: 6, n: 22 },
          'demo-lt-1': { loesungsquote: 91, durchschnittPunkte: 1.8, maxPunkte: 2, n: 22 },
          'demo-zu-1': { loesungsquote: 45, durchschnittPunkte: 1.8, maxPunkte: 4, n: 22 },
        },
      },
      {
        pruefungId: 'demo-2',
        titel: 'Recht-Prüfung OR AT',
        klasse: '27a28f',
        gefaess: 'SF',
        fachbereiche: ['Recht'],
        semester: 'S1',
        datum: '2026-03-15',
        typ: 'summativ',
        gesamtpunkte: 40,
        freigeschaltet: true,
        beendetUm: '2026-03-15T11:30:00Z',
        teilnehmerGesamt: 18,
        eingereicht: 17,
        nichtErschienen: [
          { email: 'schmid.tim@stud.gymhofwil.ch', name: 'Schmid Tim', klasse: '27a' },
        ],
        korrekturStatus: 'teilweise',
        korrigiertAnzahl: 10,
        korrigiertGesamt: 17,
        durchschnittNote: null,
        bestandenRate: null,
      },
      {
        pruefungId: 'demo-3',
        titel: 'BWL Strategie & Führung',
        klasse: '28bc29fs',
        gefaess: 'SF',
        fachbereiche: ['BWL'],
        semester: 'S1',
        datum: '2026-02-20',
        typ: 'summativ',
        gesamtpunkte: 35,
        freigeschaltet: true,
        beendetUm: '2026-02-20T10:00:00Z',
        teilnehmerGesamt: 24,
        eingereicht: 24,
        nichtErschienen: [],
        korrekturStatus: 'fertig',
        korrigiertAnzahl: 24,
        korrigiertGesamt: 24,
        durchschnittNote: 4.7,
        bestandenRate: 92,
      },
    ],
    aktualisiert: new Date().toISOString(),
  }
}
