/**
 * Exportiert die Einrichtungsprüfung (Fragen + Config) als JSON-Datei
 * für den generischen import-fragen.mjs Importer.
 *
 * Verwendung:
 *   node scripts/export-einrichtung.mjs
 *   → Erzeugt scripts/data/einrichtungspruefung.json
 */

import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const jetzt = '2026-03-24T00:00:00.000Z'
const autor = 'yannick.durand@gymhofwil.ch'
const baseTags = ['einrichtung', 'test']
const alleSemester = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8']
const alleGefaesse = ['SF', 'EF', 'EWR', 'GF']

const base = (id, typ, fb, punkte, extra = {}) => ({
  id, typ, version: 1, erstelltAm: jetzt, geaendertAm: jetzt,
  fachbereich: fb, thema: 'Einrichtung', bloom: 'K1',
  semester: alleSemester, gefaesse: alleGefaesse,
  tags: baseTags, punkte, zeitbedarf: 2,
  verwendungen: [], quelle: 'manuell', autor,
  ...extra,
})

const fragen = [
  base('einr-mc-orientierung', 'mc', 'VWL', 1, {
    unterthema: 'Orientierung',
    musterlosung: 'Die Prüfung hat 16 Fragen.',
    bewertungsraster: [{ beschreibung: 'Korrekte Antwort gewählt', punkte: 1 }],
    fragetext: 'Schauen Sie sich die Prüfungsoberfläche an. **Wie viele Fragen** hat diese Testprüfung insgesamt? Tipp: Schauen Sie auf die Navigationsleiste am unteren Bildschirmrand.',
    optionen: [
      { id: 'a', text: '10 Fragen', korrekt: false },
      { id: 'b', text: '16 Fragen', korrekt: true },
      { id: 'c', text: '20 Fragen', korrekt: false },
      { id: 'd', text: '25 Fragen', korrekt: false },
    ],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  }),
  base('einr-mc-uielemente', 'mc', 'BWL', 2, {
    unterthema: 'UI-Elemente',
    musterlosung: 'Sichtbar: Timer, Fortschrittsbalken, Navigationsleiste. Nicht sichtbar: Druckknopf.',
    bewertungsraster: [
      { beschreibung: 'Alle 3 korrekten Elemente gewählt', punkte: 2 },
      { beschreibung: '2 korrekte Elemente gewählt', punkte: 1 },
    ],
    fragetext: 'Welche der folgenden Elemente sehen Sie **auf Ihrem Bildschirm**? (Mehrere Antworten möglich)',
    optionen: [
      { id: 'a', text: 'Eine Stoppuhr oder einen Timer (oben)', korrekt: true },
      { id: 'b', text: 'Einen Fortschrittsbalken', korrekt: true },
      { id: 'c', text: 'Eine Navigationsleiste mit Fragennummern (unten)', korrekt: true },
      { id: 'd', text: 'Einen Druckknopf zum Ausdrucken der Prüfung', korrekt: false },
    ],
    mehrfachauswahl: true, zufallsreihenfolge: false,
  }),
  base('einr-rf-toolfunktionen', 'richtigfalsch', 'Recht', 4, {
    unterthema: 'Tool-Funktionen', bloom: 'K2', zeitbedarf: 3,
    musterlosung: '1: Richtig. 2: Richtig. 3: Falsch. 4: Richtig.',
    bewertungsraster: [
      { beschreibung: 'Alle 4 korrekt', punkte: 4 },
      { beschreibung: '3 korrekt', punkte: 3 },
      { beschreibung: '2 korrekt', punkte: 2 },
      { beschreibung: '1 korrekt', punkte: 1 },
    ],
    fragetext: 'Beurteilen Sie die folgenden Aussagen über das ExamLab als **richtig** oder **falsch**.',
    aussagen: [
      { id: '1', text: 'Man kann zwischen Fragen vor- und zurücknavigieren.', korrekt: true, erklaerung: 'Rücknavigation ist aktiviert.' },
      { id: '2', text: 'Die Antworten werden automatisch gespeichert (AutoSave).', korrekt: true, erklaerung: 'AutoSave alle 30 Sekunden.' },
      { id: '3', text: 'Man muss die Fragen zwingend in der vorgegebenen Reihenfolge lösen.', korrekt: false, erklaerung: 'Man kann über die Nav-Leiste springen.' },
      { id: '4', text: 'Es gibt einen Dark Mode (dunkles Farbschema).', korrekt: true, erklaerung: 'Über das Zahnrad-Symbol.' },
    ],
  }),
  base('einr-ft-formatierung', 'freitext', 'VWL', 2, {
    unterthema: 'Textformatierung',
    musterlosung: 'Ein Satz mit einem fetten und einem kursiven Wort.',
    bewertungsraster: [
      { beschreibung: 'Ein Wort fett', punkte: 1 },
      { beschreibung: 'Ein Wort kursiv', punkte: 1 },
    ],
    fragetext: 'Schreiben Sie einen kurzen Satz. Formatieren Sie ein Wort **fett** und ein Wort *kursiv*.\n\n💡 Nutzen Sie Ctrl+B (fett) und Ctrl+I (kursiv).',
    laenge: 'kurz', hilfstextPlaceholder: 'Schreiben Sie hier...',
  }),
  base('einr-lt-hofwil', 'lueckentext', 'Recht', 3, {
    unterthema: 'Lückentext',
    musterlosung: 'Hofwil, Münchenbuchsee, Bern',
    bewertungsraster: [
      { beschreibung: 'Alle 3 Lücken korrekt', punkte: 3 },
      { beschreibung: '2 Lücken korrekt', punkte: 2 },
      { beschreibung: '1 Lücke korrekt', punkte: 1 },
    ],
    fragetext: 'Ergänzen Sie die Lücken.',
    textMitLuecken: 'Das Gymnasium {{1}} liegt in der Gemeinde {{2}} im Kanton {{3}}.',
    luecken: [
      { id: '1', korrekteAntworten: ['Hofwil'], caseSensitive: false },
      { id: '2', korrekteAntworten: ['Münchenbuchsee', 'Muenchenbuchsee'], caseSensitive: false },
      { id: '3', korrekteAntworten: ['Bern'], caseSensitive: false },
    ],
  }),
  base('einr-ft-morgen', 'freitext', 'BWL', 3, {
    unterthema: 'Texteditor', zeitbedarf: 4,
    musterlosung: 'Individuelle Antwort mit mind. 3 Sätzen und einer Aufzählung.',
    bewertungsraster: [
      { beschreibung: 'Mind. 3 Sätze', punkte: 1 },
      { beschreibung: 'Aufzählungsliste verwendet', punkte: 1 },
      { beschreibung: 'Text lesbar', punkte: 1 },
    ],
    fragetext: 'Beschreiben Sie in **3–5 Sätzen**, was Sie heute Morgen gemacht haben. Verwenden Sie eine **Aufzählungsliste**.',
    laenge: 'lang', hilfstextPlaceholder: 'Heute Morgen habe ich:\n• ...',
  }),
  base('einr-zu-emojis', 'zuordnung', 'VWL', 4, {
    unterthema: 'Zuordnung',
    musterlosung: '🎓→Bildung, 🏔️→Berge, 🧀→Käse, 🕐→Uhren',
    bewertungsraster: [
      { beschreibung: 'Alle 4 korrekt', punkte: 4 },
      { beschreibung: '3 korrekt', punkte: 3 },
      { beschreibung: '2 korrekt', punkte: 2 },
      { beschreibung: '1 korrekt', punkte: 1 },
    ],
    fragetext: 'Ordnen Sie die Emojis den passenden Begriffen zu.',
    paare: [
      { links: '🎓 Emoji 1', rechts: 'Bildung' },
      { links: '🏔️ Emoji 2', rechts: 'Berge' },
      { links: '🧀 Emoji 3', rechts: 'Käse' },
      { links: '🕐 Emoji 4', rechts: 'Uhren' },
    ],
    zufallsreihenfolge: true,
  }),
  base('einr-be-pizza', 'berechnung', 'BWL', 3, {
    unterthema: 'Berechnung', bloom: 'K3', zeitbedarf: 3,
    musterlosung: '3×18.50=55.50. +10%=61.05.',
    bewertungsraster: [
      { beschreibung: 'Zwischentotal korrekt (55.50)', punkte: 1 },
      { beschreibung: 'Gesamttotal korrekt (61.05)', punkte: 1 },
      { beschreibung: 'Rechenweg nachvollziehbar', punkte: 1 },
    ],
    fragetext: 'Eine Pizza kostet **CHF 18.50**. Sie bestellen **3 Pizzas** und geben **10% Trinkgeld**.\n\nBerechnen Sie den Gesamtbetrag.',
    ergebnisse: [
      { id: '1', label: 'Pizzas ohne Trinkgeld', korrekt: 55.50, toleranz: 0, einheit: 'CHF' },
      { id: '2', label: 'Gesamtbetrag mit Trinkgeld', korrekt: 61.05, toleranz: 0.05, einheit: 'CHF' },
    ],
    rechenwegErforderlich: true,
  }),
  base('einr-vis-smiley', 'visualisierung', 'Recht', 2, {
    unterthema: 'Zeichenwerkzeuge', zeitbedarf: 3,
    musterlosung: 'Ein erkennbarer Smiley mit mind. 2 Werkzeugen.',
    bewertungsraster: [
      { beschreibung: 'Smiley erkennbar', punkte: 1 },
      { beschreibung: 'Mind. 2 Werkzeuge', punkte: 1 },
    ],
    fragetext: 'Zeichnen Sie einen **Smiley** 😊. Testen Sie mind. **2 verschiedene Werkzeuge**.',
    untertyp: 'zeichnen',
    canvasConfig: { breite: 600, hoehe: 400 },
  }),
  base('einr-pdf-witz', 'pdf', 'VWL', 3, {
    unterthema: 'PDF-Annotation', bloom: 'K2', zeitbedarf: 4,
    musterlosung: 'Gelbe Markierung + Kommentar auf mind. 2 Seiten.',
    bewertungsraster: [
      { beschreibung: 'Text gelb markiert', punkte: 1 },
      { beschreibung: 'Kommentar hinzugefügt', punkte: 1 },
      { beschreibung: 'Mind. 2 Seiten besucht', punkte: 1 },
    ],
    fragetext: 'Arbeiten Sie mit dem PDF (Witzsammlung):\n1. Blättern Sie durch (mind. 2 Seiten)\n2. Markieren Sie Ihren Lieblingswitz **gelb**\n3. Fügen Sie einen **Kommentar** hinzu',
    pdfDateiname: 'witzsammlung.pdf',
    seitenAnzahl: 5,
    kategorien: [
      { id: 'lustig', label: 'Lustig', farbe: '#FFEB3B' },
      { id: 'okay', label: 'Okay', farbe: '#90CAF9' },
    ],
    erlaubteWerkzeuge: ['highlight', 'comment', 'freehand'],
  }),
  base('einr-bs-eis', 'buchungssatz', 'BWL', 2, {
    unterthema: 'Buchungssatz-Eingabe', zeitbedarf: 3,
    musterlosung: 'Soll: 4200 CHF 5 / Haben: 1000 CHF 5',
    bewertungsraster: [
      { beschreibung: 'Soll-Konto korrekt (4200)', punkte: 1 },
      { beschreibung: 'Haben-Konto korrekt (1000)', punkte: 1 },
    ],
    geschaeftsfall: '**Übungsaufgabe:** Eiskauf CHF 5.00 bar.\n\n📋 **Lösung:** Soll: 4200 (Warenaufwand) CHF 5.00 / Haben: 1000 (Kasse) CHF 5.00',
    buchungen: [{ id: 'bs-eis', sollKonten: [{ kontonummer: '4200', betrag: 5 }], habenKonten: [{ kontonummer: '1000', betrag: 5 }], buchungstext: 'Eiskauf bar' }],
    kontenauswahl: { modus: 'eingeschraenkt', konten: ['1000', '1020', '2000', '3200', '4200', '5200'] },
  }),
  base('einr-tk-kasse', 'tkonto', 'BWL', 2, {
    unterthema: 'T-Konto-Eingabe', zeitbedarf: 3,
    musterlosung: 'Kasse AB 100, Haben 30, Saldo 70.',
    bewertungsraster: [
      { beschreibung: 'Anfangsbestand korrekt', punkte: 1 },
      { beschreibung: 'Abgang auf Haben-Seite', punkte: 1 },
    ],
    aufgabentext: '**Übungsaufgabe T-Konto:** AB CHF 100. Abgang CHF 30 auf Haben-Seite (Gegenkonto: 4200).',
    geschaeftsfaelle: ['Einkauf bar: CHF 30 aus der Kasse.'],
    konten: [{ id: 'tk-1000', kontonummer: '1000', anfangsbestand: 100, anfangsbestandVorgegeben: true, eintraege: [{ seite: 'haben', gegenkonto: '4200', betrag: 30, buchungstext: 'Einkauf bar' }], saldo: { betrag: 70, seite: 'soll' } }],
    kontenauswahl: { modus: 'eingeschraenkt', konten: ['1000', '1020', '2000', '4200', '5200'] },
    bewertungsoptionen: { beschriftungSollHaben: false, kontenkategorie: false, zunahmeAbnahme: false, buchungenKorrekt: true, saldoKorrekt: false },
  }),
  base('einr-kb-einfach', 'kontenbestimmung', 'BWL', 2, {
    unterthema: 'Kontenbestimmung-Eingabe',
    musterlosung: 'Kasse=Aktiv, Mietaufwand=Aufwand.',
    bewertungsraster: [
      { beschreibung: 'Kasse korrekt Aktiv', punkte: 1 },
      { beschreibung: 'Mietaufwand korrekt Aufwand', punkte: 1 },
    ],
    aufgabentext: '**Übung:** Kasse = Aktivkonto, Mietaufwand = Aufwandkonto. Tippen Sie es ein!',
    modus: 'kategorie_bestimmen',
    aufgaben: [
      { id: 'kb-kasse', text: 'Kasse (1000) — Tipp: Aktivkonto', erwarteteAntworten: [{ kontonummer: '1000', kategorie: 'aktiv' }] },
      { id: 'kb-miete', text: 'Mietaufwand (6000) — Tipp: Aufwandkonto', erwarteteAntworten: [{ kontonummer: '6000', kategorie: 'aufwand' }] },
    ],
    kontenauswahl: { modus: 'eingeschraenkt', konten: ['1000', '1020', '2000', '3200', '4200', '5200', '6000'] },
  }),
  base('einr-bilanz-einfach', 'bilanzstruktur', 'BWL', 2, {
    unterthema: 'Bilanz-Eingabe', zeitbedarf: 3,
    musterlosung: 'Aktiven: Kasse+Bank=200. Passiven: Kreditoren+EK=200.',
    bewertungsraster: [
      { beschreibung: 'Konten korrekt zugeordnet', punkte: 1 },
      { beschreibung: 'Bilanzsumme stimmt (200)', punkte: 1 },
    ],
    aufgabentext: '**Übung:** Kasse+Bank = Aktiven (links). Kreditoren+EK = Passiven (rechts).',
    modus: 'bilanz',
    kontenMitSaldi: [{ kontonummer: '1000', saldo: 50 }, { kontonummer: '1020', saldo: 150 }, { kontonummer: '2000', saldo: 80 }, { kontonummer: '2800', saldo: 120 }],
    loesung: {
      bilanz: {
        aktivSeite: { label: 'Aktiven', gruppen: [{ label: 'Umlaufvermögen', konten: ['1000', '1020'] }] },
        passivSeite: { label: 'Passiven', gruppen: [{ label: 'Fremdkapital', konten: ['2000'] }, { label: 'Eigenkapital', konten: ['2800'] }] },
        bilanzsumme: 200,
      },
    },
    bewertungsoptionen: { seitenbeschriftung: false, gruppenbildung: false, gruppenreihenfolge: false, kontenreihenfolge: false, betraegeKorrekt: true, zwischentotale: false, bilanzsummeOderGewinn: true, mehrstufigkeit: false },
  }),
  base('einr-ag-material-mc', 'mc', 'Recht', 1, {
    unterthema: 'Materialpanel', bloom: 'K2',
    musterlosung: 'Art. 5 — Die Schulglocke.',
    bewertungsraster: [{ beschreibung: 'Korrekte Antwort', punkte: 1 }],
    fragetext: 'Öffnen Sie das **Materialpanel** und schlagen Sie nach: Wie lautet der Titel von **Art. 5** (Seite 3)?',
    optionen: [
      { id: 'a', text: 'Der Taschenrechner', korrekt: false },
      { id: 'b', text: 'Die Schulglocke', korrekt: true },
      { id: 'c', text: 'Das Klassenzimmer', korrekt: false },
      { id: 'd', text: 'Der Sportlehrer', korrekt: false },
    ],
    mehrfachauswahl: false, zufallsreihenfolge: false,
  }),
  base('einr-ag-material-freitext', 'freitext', 'Recht', 2, {
    unterthema: 'Materialpanel', bloom: 'K2', zeitbedarf: 3,
    musterlosung: 'Individuelle Umschreibung eines Witzes.',
    bewertungsraster: [
      { beschreibung: 'Witz umgeschrieben', punkte: 1 },
      { beschreibung: 'In eigenen Worten', punkte: 1 },
    ],
    fragetext: 'Wählen Sie einen Witz aus dem Material und schreiben Sie ihn **in eigenen Worten** um.',
    laenge: 'kurz', hilfstextPlaceholder: 'Mein umgeschriebener Witz: ...',
  }),
  base('einr-ag-material', 'aufgabengruppe', 'Recht', 3, {
    unterthema: 'Aufgabengruppe', bloom: 'K2', zeitbedarf: 5,
    musterlosung: 'Siehe Teilaufgaben.',
    bewertungsraster: [
      { beschreibung: 'MC korrekt', punkte: 1 },
      { beschreibung: 'Freitext geschrieben', punkte: 2 },
    ],
    kontext: '**Aufgabengruppe: Material nutzen**\n\nÖffnen Sie das Materialpanel (📄-Symbol oben rechts). Dort finden Sie die «Amtliche Witzsammlung der Schweiz».',
    teilaufgabenIds: ['einr-ag-material-mc', 'einr-ag-material-freitext'],
  }),
  base('einr-mc-features', 'mc', 'VWL', 2, {
    unterthema: 'Features', bloom: 'K2', zeitbedarf: 3,
    musterlosung: 'Alle 4 Features funktionieren.',
    bewertungsraster: [
      { beschreibung: 'Alle 4 angekreuzt', punkte: 2 },
      { beschreibung: '2–3 angekreuzt', punkte: 1 },
    ],
    fragetext: '**Feature-Check!** Probieren Sie aus:\n- Dark Mode (Mond/Sonnen-Symbol)\n- Frage markieren (Stern/Flagge)\n- Ctrl+Enter (nächste Frage)\n- Material-Panel öffnen/schliessen\n\nKreuzen Sie an, was funktioniert hat:',
    optionen: [
      { id: 'a', text: 'Dark Mode umschalten', korrekt: true },
      { id: 'b', text: 'Frage markieren', korrekt: true },
      { id: 'c', text: 'Ctrl+Enter für nächste Frage', korrekt: true },
      { id: 'd', text: 'Material-Panel öffnen/schliessen', korrekt: true },
    ],
    mehrfachauswahl: true, zufallsreihenfolge: false,
  }),
]

const config = {
  id: 'einrichtung-sf-wr-27a28f',
  titel: 'Einrichtungsprüfung — Lerne das ExamLab kennen',
  klasse: 'sf-wr-27a28f',
  gefaess: 'SF',
  semester: 'S5',
  fachbereiche: ['VWL', 'BWL', 'Recht'],
  datum: '2026-03-24',
  typ: 'formativ',
  modus: 'uebung',
  dauerMinuten: 30,
  zeitModus: 'open-end',
  gesamtpunkte: 40,
  erlaubteKlasse: '—',
  sebErforderlich: false,
  abschnitte: [
    { titel: 'Teil A: Ankommen & Orientierung', beschreibung: 'Erkunden Sie die Prüfungsoberfläche.', fragenIds: ['einr-mc-orientierung', 'einr-mc-uielemente', 'einr-rf-toolfunktionen'] },
    { titel: 'Teil B: Texteingabe', beschreibung: 'Testen Sie Freitext und Lückentext.', fragenIds: ['einr-ft-formatierung', 'einr-lt-hofwil', 'einr-ft-morgen'] },
    { titel: 'Teil C: Auswahl & Rechnen', beschreibung: 'Zuordnung und Berechnung.', fragenIds: ['einr-zu-emojis', 'einr-be-pizza'] },
    { titel: 'Teil D: Zeichnen & PDF', beschreibung: 'Zeichenwerkzeuge und PDF-Annotation.', fragenIds: ['einr-vis-smiley', 'einr-pdf-witz'] },
    { titel: 'Teil E: Buchhaltung — Eingabefelder', beschreibung: 'FiBu-Eingabefelder testen. Lösungen stehen in der Aufgabe.', fragenIds: ['einr-bs-eis', 'einr-tk-kasse', 'einr-kb-einfach', 'einr-bilanz-einfach'] },
    { titel: 'Teil F: Material & Features', beschreibung: 'Materialpanel und versteckte Features.', fragenIds: ['einr-ag-material', 'einr-mc-features'] },
  ],
  materialien: [{ id: 'mat-witzsammlung', titel: 'Amtliche Witzsammlung der Schweiz (Ausgabe 2026)', typ: 'pdf', dateiname: 'witzsammlung.pdf' }],
  zufallsreihenfolgeFragen: false,
  zufallsreihenfolgeOptionen: false,
  ruecknavigation: true,
  zeitanzeigeTyp: 'verstricheneZeit',
  freigeschaltet: false,
  autoSaveIntervallSekunden: 30,
  heartbeatIntervallSekunden: 10,
  korrektur: { aktiviert: true, modus: 'batch', freigegeben: false },
  feedback: { zeitpunkt: 'manuell', format: 'in-app-und-pdf', detailgrad: 'vollstaendig' },
}

const output = { fragen, config }
const outPath = resolve(__dirname, 'data', 'einrichtungspruefung.json')
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✅ ${fragen.length} Fragen + 1 Config → ${outPath}`)
