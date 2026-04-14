import type { SchuelerAbgabe, PruefungsKorrektur, FragenBewertung } from '../types/korrektur.ts'
import type { Antwort } from '../types/antworten.ts'
import { einrichtungsFragen } from './einrichtungsFragen.ts'
import { DEMO_KURS_ID, DEMO_PRUEFUNG_ID } from './demoConfig.ts'

/**
 * Demo-Abgaben und -Korrekturdaten für die LP-Ansicht im Demo-Modus.
 * Zeigt einer neuen LP, wie Korrektur und Auswertung aussehen.
 *
 * - Beispiel Beat: vollständig korrigiert (Note 4.8)
 * - Brunner Hans: abgegeben, noch nicht korrigiert (offen)
 */

const jetzt = new Date()
const vor = (minuten: number) => new Date(jetzt.getTime() - minuten * 60000).toISOString()

// Frage-Metadaten für schnellen Zugriff
const fragenMap = Object.fromEntries(
  einrichtungsFragen.map((f) => [f.id, f])
)

// === Demo-Antworten für Beispiel Beat (guter Schüler, ~80% korrekt) ===

function erstelleBeatAntworten(): Record<string, Antwort> {
  const antworten: Record<string, Antwort> = {}

  // A1: MC Single — korrekt (b)
  antworten['einr-mc-orientierung'] = {
    typ: 'mc',
    gewaehlteOptionen: ['b'],
  }

  // A2: MC Multiple — 3 von 3 korrekt (a, b, c), aber auch d gewählt (Fehler)
  antworten['einr-mc-uielemente'] = {
    typ: 'mc',
    gewaehlteOptionen: ['a', 'b', 'c'],
  }

  // A3: Richtig/Falsch — 3 von 4 korrekt
  antworten['einr-rf-toolfunktionen'] = {
    typ: 'richtigfalsch',
    bewertungen: { '1': true, '2': true, '3': true, '4': true }, // Aussage 3 falsch bewertet
  }

  // B1: Freitext kurz
  antworten['einr-ft-formatierung'] = {
    typ: 'freitext',
    text: 'Ich teste gerade **ExamLab** und finde es *spannend*.',
    formatierung: '<p>Ich teste gerade <strong>ExamLab</strong> und finde es <em>spannend</em>.</p>',
  }

  // B2: Lückentext — alle korrekt
  antworten['einr-lt-hofwil'] = {
    typ: 'lueckentext',
    eintraege: { '1': 'Hofwil', '2': 'Münchenbuchsee', '3': 'Bern' },
  }

  // B3: Freitext lang
  antworten['einr-ft-morgen'] = {
    typ: 'freitext',
    text: 'Heute Morgen habe ich:\n• Um 6:30 den Wecker ausgeschaltet\n• Geduscht und gefrühstückt\n• Mit dem Bus zur Schule gefahren\n\nDer Bus war heute pünktlich, was mich gefreut hat.',
  }

  // C1: Zuordnung — 3 von 4 korrekt
  antworten['einr-zu-emojis'] = {
    typ: 'zuordnung',
    zuordnungen: {
      '🎓 Emoji 1': 'Bildung',
      '🏔️ Emoji 2': 'Berge',
      '🧀 Emoji 3': 'Uhren',  // Falsch (Käse ↔ Uhren vertauscht)
      '🕐 Emoji 4': 'Käse',
    },
  }

  // C2: Berechnung — korrekt
  antworten['einr-be-pizza'] = {
    typ: 'berechnung',
    ergebnisse: { '1': '55.50', '2': '61.05' },
    rechenweg: '3 × 18.50 = 55.50\n10% von 55.50 = 5.55\n55.50 + 5.55 = 61.05',
  }

  // D1: Zeichnung — leerer Canvas-Daten-String (Demo)
  antworten['einr-vis-smiley'] = {
    typ: 'visualisierung',
    daten: JSON.stringify({ befehle: [], breite: 600, hoehe: 400 }),
  }

  // D2: PDF — minimale Annotation
  antworten['einr-pdf-witz'] = {
    typ: 'pdf',
    annotationen: [],
  }

  // E1: Buchungssatz — korrekt
  antworten['einr-bs-eis'] = {
    typ: 'buchungssatz',
    buchungen: [{ id: 'bs-eis', sollKonto: '4200', habenKonto: '1000', betrag: 5 }],
  }

  // E2: T-Konto
  antworten['einr-tk-kasse'] = {
    typ: 'tkonto',
    konten: [{
      id: 'tk-1000',
      eintraegeLinks: [],
      eintraegeRechts: [{ gegenkonto: '4200', betrag: 30 }],
      saldo: { betragLinks: 70, betragRechts: 0 },
    }],
  }

  // E3: Kontenbestimmung — korrekt
  antworten['einr-kb-einfach'] = {
    typ: 'kontenbestimmung',
    aufgaben: {
      'kb-kasse': { antworten: [{ kontonummer: '1000', kategorie: 'aktiv' }] },
      'kb-miete': { antworten: [{ kontonummer: '6000', kategorie: 'aufwand' }] },
    },
  }

  // E4: Bilanzstruktur
  antworten['einr-bilanz-einfach'] = {
    typ: 'bilanzstruktur',
    bilanz: {
      linkeSeite: { label: 'Aktiven', gruppen: [{ label: 'Umlaufvermögen', konten: [{ nr: '1000', betrag: 50 }, { nr: '1020', betrag: 150 }] }] },
      rechteSeite: { label: 'Passiven', gruppen: [{ label: 'Fremdkapital', konten: [{ nr: '2000', betrag: 80 }] }, { label: 'Eigenkapital', konten: [{ nr: '2800', betrag: 120 }] }] },
      bilanzsummeLinks: 200,
      bilanzsummeRechts: 200,
    },
  }

  // F1a: MC — korrekt
  antworten['einr-ag-material-mc'] = {
    typ: 'mc',
    gewaehlteOptionen: ['b'],
  }

  // F1b: Freitext
  antworten['einr-ag-material-freitext'] = {
    typ: 'freitext',
    text: 'Warum hat die Schulglocke nie Ferien? Weil sie ständig Prügel bekommt — und das auch noch regelmässig!',
  }

  // F2: MC Multiple (Features) — wenn vorhanden
  antworten['einr-mc-features'] = {
    typ: 'mc',
    gewaehlteOptionen: ['a', 'c'],
  }

  return antworten
}

// === Demo-Antworten für Brunner Hans (durchschnittlich, ~60%) ===

function erstelleHansAntworten(): Record<string, Antwort> {
  const antworten: Record<string, Antwort> = {}

  antworten['einr-mc-orientierung'] = { typ: 'mc', gewaehlteOptionen: ['b'] }
  antworten['einr-mc-uielemente'] = { typ: 'mc', gewaehlteOptionen: ['a', 'c'] } // b fehlt
  antworten['einr-rf-toolfunktionen'] = {
    typ: 'richtigfalsch',
    bewertungen: { '1': true, '2': false, '3': false, '4': true }, // 2 von 4 korrekt
  }
  antworten['einr-ft-formatierung'] = {
    typ: 'freitext',
    text: 'Hallo, das ist ein Test.',
  }
  antworten['einr-lt-hofwil'] = {
    typ: 'lueckentext',
    eintraege: { '1': 'Hofwil', '2': 'Bern', '3': 'Bern' }, // 2 falsch
  }
  antworten['einr-ft-morgen'] = {
    typ: 'freitext',
    text: 'Ich bin aufgestanden und zur Schule gegangen.',
  }
  antworten['einr-zu-emojis'] = {
    typ: 'zuordnung',
    zuordnungen: {
      '🎓 Emoji 1': 'Bildung',
      '🏔️ Emoji 2': 'Käse',
      '🧀 Emoji 3': 'Berge',
      '🕐 Emoji 4': 'Uhren',
    },
  }
  antworten['einr-be-pizza'] = {
    typ: 'berechnung',
    ergebnisse: { '1': '55.50', '2': '60.00' }, // Trinkgeld falsch
    rechenweg: '3 × 18.50 = 55.50\nTrinkgeld: ca. 5.00\nTotal: 60.00',
  }
  antworten['einr-vis-smiley'] = {
    typ: 'visualisierung',
    daten: JSON.stringify({ befehle: [], breite: 600, hoehe: 400 }),
  }
  antworten['einr-pdf-witz'] = { typ: 'pdf', annotationen: [] }
  antworten['einr-bs-eis'] = {
    typ: 'buchungssatz',
    buchungen: [{ id: 'bs-eis', sollKonto: '4200', habenKonto: '1020', betrag: 5 }],
  }
  antworten['einr-tk-kasse'] = {
    typ: 'tkonto',
    konten: [{
      id: 'tk-1000',
      eintraegeLinks: [],
      eintraegeRechts: [{ gegenkonto: '4200', betrag: 30 }],
      saldo: { betragLinks: 70, betragRechts: 0 },
    }],
  }
  antworten['einr-kb-einfach'] = {
    typ: 'kontenbestimmung',
    aufgaben: {
      'kb-kasse': { antworten: [{ kontonummer: '1000', kategorie: 'aktiv' }] },
      'kb-miete': { antworten: [{ kontonummer: '6000', kategorie: 'passiv' }] },
    },
  }
  antworten['einr-bilanz-einfach'] = {
    typ: 'bilanzstruktur',
    bilanz: {
      linkeSeite: { label: 'Aktiven', gruppen: [{ label: 'Umlaufvermögen', konten: [{ nr: '1000', betrag: 50 }, { nr: '1020', betrag: 150 }] }] },
      rechteSeite: { label: 'Passiven', gruppen: [{ label: 'Fremdkapital', konten: [{ nr: '2000', betrag: 80 }] }, { label: 'Eigenkapital', konten: [{ nr: '2800', betrag: 120 }] }] },
      bilanzsummeLinks: 200,
      bilanzsummeRechts: 200,
    },
  }
  antworten['einr-ag-material-mc'] = { typ: 'mc', gewaehlteOptionen: ['a'] } // Falsch
  antworten['einr-ag-material-freitext'] = {
    typ: 'freitext',
    text: 'Der Witz über die Schulglocke ist lustig weil sie immer geschlagen wird.',
  }
  antworten['einr-mc-features'] = { typ: 'mc', gewaehlteOptionen: ['a', 'b'] }

  return antworten
}

// === Bewertungen für Beat (korrigiert) ===

function erstelleBeatBewertungen(): Record<string, FragenBewertung> {
  const bewertungen: Record<string, FragenBewertung> = {}

  const beatPunkte: Record<string, { ki: number; lp: number; max: number; kommentar?: string }> = {
    'einr-mc-orientierung': { ki: 1, lp: 1, max: 1 },
    'einr-mc-uielemente': { ki: 2, lp: 2, max: 2 },
    'einr-rf-toolfunktionen': { ki: 3, lp: 3, max: 4 },
    'einr-ft-formatierung': { ki: 2, lp: 2, max: 2, kommentar: 'Formatierung korrekt angewendet.' },
    'einr-lt-hofwil': { ki: 3, lp: 3, max: 3 },
    'einr-ft-morgen': { ki: 3, lp: 3, max: 3, kommentar: 'Aufzählung korrekt, guter Text.' },
    'einr-zu-emojis': { ki: 3, lp: 3, max: 4 },
    'einr-be-pizza': { ki: 3, lp: 3, max: 3 },
    'einr-vis-smiley': { ki: 1, lp: 1, max: 2, kommentar: 'Nur ein Werkzeug erkennbar.' },
    'einr-pdf-witz': { ki: 1, lp: 2, max: 3, kommentar: 'Guter Kommentar, Markierung vorhanden.' },
    'einr-bs-eis': { ki: 2, lp: 2, max: 2 },
    'einr-tk-kasse': { ki: 2, lp: 2, max: 2 },
    'einr-kb-einfach': { ki: 2, lp: 2, max: 2 },
    'einr-bilanz-einfach': { ki: 2, lp: 2, max: 2 },
    'einr-ag-material-mc': { ki: 1, lp: 1, max: 1 },
    'einr-ag-material-freitext': { ki: 1, lp: 2, max: 2, kommentar: 'Kreative Umschreibung!' },
    'einr-mc-features': { ki: 1, lp: 1, max: 2 },
  }

  for (const [frageId, p] of Object.entries(beatPunkte)) {
    const frage = fragenMap[frageId]
    const istAuto = frage && ['mc', 'richtigfalsch', 'lueckentext', 'zuordnung', 'berechnung', 'kontenbestimmung'].includes(frage.typ)
    bewertungen[frageId] = {
      frageId,
      fragenTyp: frage?.typ || 'mc',
      maxPunkte: p.max,
      kiPunkte: p.ki,
      lpPunkte: p.lp,
      kiBegruendung: istAuto ? 'Automatisch korrigiert.' : 'KI-Bewertung basierend auf Musterlösung und Bewertungsraster.',
      kiFeedback: p.kommentar || (p.lp === p.max ? 'Korrekt gelöst.' : 'Teilweise korrekt.'),
      lpKommentar: p.kommentar || null,
      quelle: istAuto ? 'auto' : 'ki',
      geprueft: true,
    }
  }

  return bewertungen
}

// === Bewertungen für Hans (offen — noch nicht korrigiert) ===

function erstelleHansBewertungen(): Record<string, FragenBewertung> {
  const bewertungen: Record<string, FragenBewertung> = {}

  for (const frage of einrichtungsFragen) {
    if (frage.typ === 'aufgabengruppe') continue
    bewertungen[frage.id] = {
      frageId: frage.id,
      fragenTyp: frage.typ,
      maxPunkte: frage.punkte,
      kiPunkte: null,
      lpPunkte: null,
      kiBegruendung: null,
      kiFeedback: null,
      lpKommentar: null,
      quelle: 'manuell',
      geprueft: false,
    }
  }

  return bewertungen
}

// === Exportierte Funktionen ===

/** Demo-Abgaben für die Einrichtungsprüfung */
export function erstelleDemoAbgaben(): Record<string, SchuelerAbgabe> {
  return {
    'beat.beispiel@stud.gymhofwil.ch': {
      email: 'beat.beispiel@stud.gymhofwil.ch',
      name: 'Beispiel Beat',
      antworten: erstelleBeatAntworten(),
      abgabezeit: vor(3),
    },
    'hans.brunner@stud.gymhofwil.ch': {
      email: 'hans.brunner@stud.gymhofwil.ch',
      name: 'Brunner Hans',
      antworten: erstelleHansAntworten(),
      abgabezeit: vor(10),
    },
  }
}

/** Demo-Korrektur für die Einrichtungsprüfung */
export function erstelleDemoKorrektur(): PruefungsKorrektur {
  const beatBewertungen = erstelleBeatBewertungen()
  const beatGesamt = Object.values(beatBewertungen).reduce((s, b) => s + (b.lpPunkte ?? 0), 0)
  const maxPunkte = Object.values(beatBewertungen).reduce((s, b) => s + b.maxPunkte, 0)

  return {
    pruefungId: DEMO_PRUEFUNG_ID,
    pruefungTitel: 'Einführungsprüfung — Lerne ExamLab kennen',
    datum: '2026-03-24',
    klasse: DEMO_KURS_ID,
    schueler: [
      {
        email: 'beat.beispiel@stud.gymhofwil.ch',
        name: 'Beispiel Beat',
        klasse: 'Testklasse',
        bewertungen: beatBewertungen,
        gesamtPunkte: beatGesamt,
        maxPunkte,
        note: 4.8,
        korrekturStatus: 'review-fertig',
      },
      {
        email: 'hans.brunner@stud.gymhofwil.ch',
        name: 'Brunner Hans',
        klasse: 'Testklasse',
        bewertungen: erstelleHansBewertungen(),
        gesamtPunkte: 0,
        maxPunkte,
        korrekturStatus: 'offen',
      },
    ],
    batchStatus: 'idle',
    letzteAktualisierung: jetzt.toISOString(),
  }
}
