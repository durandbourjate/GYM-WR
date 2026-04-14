// ============================================================
// BWL Finanzbuchhaltung (FIBU) – Einführung in die doppelte Buchhaltung
// Kapitel 1–5, 7, 8, 12, 13 (HEP Einführung in die Finanzbuchhaltung)
// Pool für SF GYM1–GYM2, Zyklus 1
// ============================================================

window.POOL_META = {
  id: "bwl_fibu",
  title: "Finanzbuchhaltung (FIBU)",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM1–GYM2",
  lernziele: [
    "Ich kann die Aufgaben und Grundsätze der Finanzbuchhaltung erklären. (K2)",
    "Ich kann eine korrekt gegliederte Bilanz erstellen und die Bilanzgleichung anwenden. (K3)",
    "Ich kann Geschäftsfälle in Buchungssätze übersetzen und auf T-Konten verbuchen. (K3)",
    "Ich kann die vier Kontentypen (Aktiv, Passiv, Aufwand, Ertrag) unterscheiden und ihre Buchungsregeln anwenden. (K3)",
    "Ich kann die Erfolgsrechnung (ein- und zweistufig) erstellen und den Jahreserfolg ermitteln. (K3)",
    "Ich kann die Konten des Eigentümers (Eigenkapital, Privat) korrekt führen. (K3)",
    "Ich kann Warenkonten inkl. Bestandesänderung führen und die dreistufige Erfolgsrechnung erstellen. (K3)",
    "Ich kann Wertberichtigungen (Abschreibungen, Delkredere) und Rechnungsabgrenzungen verbuchen. (K3)"
  ]
};

window.TOPICS = {
  "grundlagen":        {label: "Grundlagen der Buchhaltung", short: "Grundlagen", lernziele: [
    "Ich kann die Aufgaben der Finanzbuchhaltung aufzählen und erklären. (K1)",
    "Ich kann die gesetzliche Buchführungspflicht gemäss OR 957 erklären. (K2)",
    "Ich kann die wichtigsten Grundsätze ordnungsmässiger Buchführung (GoB) nennen und erläutern. (K2)",
    "Ich kann den Aufbau des KMU-Kontenrahmens (Kontenklassen 1–9) beschreiben. (K2)",
    "Ich kann Journal, Hauptbuch und Kontierung unterscheiden und ihre Funktion erklären. (K2)"
  ]},
  "bilanz":            {label: "Bilanz, Inventar & Bewertung", short: "Bilanz", lernziele: [
    "Ich kann Aktiven und Passiven korrekt gliedern (Umlauf-/Anlagevermögen, kurz-/langfristiges FK, EK). (K2)",
    "Ich kann eine Bilanz aus gegebenen Konten korrekt erstellen. (K3)",
    "Ich kann das Inventar als Grundlage der Bilanz erklären. (K2)",
    "Ich kann das Niederstwertprinzip bei der Bewertung von Aktiven anwenden. (K3)"
  ]},
  "kontentypen":       {label: "Die vier Kontentypen – Zu- und Abnahmen", short: "Kontentypen", lernziele: [
    "Ich kann die vier Kontentypen (Aktivkonto, Passivkonto, Aufwandkonto, Ertragskonto) unterscheiden. (K2)",
    "Ich kann für jeden Kontentyp angeben, auf welcher Seite (Soll/Haben) Zunahmen und Abnahmen stehen. (K3)",
    "Ich kann konkrete Konten dem richtigen Kontentyp zuordnen. (K2)",
    "Ich kann bei einem Geschäftsfall bestimmen, welches Konto im Soll und welches im Haben steht. (K3)"
  ]},
  "buchungssatz":      {label: "Buchungssätze & Bilanzkonten", short: "Buchungssätze", lernziele: [
    "Ich kann Geschäftsfälle in korrekte Buchungssätze (Soll an Haben) übersetzen. (K3)",
    "Ich kann die Buchungsregeln für Aktiv- und Passivkonten anwenden. (K3)",
    "Ich kann T-Konten mit Anfangsbestand, Zugängen, Abgängen und Saldo korrekt führen. (K3)",
    "Ich kann Eröffnungs- und Abschlussbuchungen erstellen. (K3)"
  ]},
  "erfolgsrechnung":   {label: "Erfolgsrechnung & Erfolgskonten", short: "Erfolgsrechnung", lernziele: [
    "Ich kann Aufwand und Ertrag definieren und Beispiele nennen. (K1)",
    "Ich kann erfolgswirksame von erfolgsunwirksamen Geschäftsfällen unterscheiden. (K2)",
    "Ich kann die Buchungsregeln für Aufwand- und Ertragskonten anwenden. (K3)",
    "Ich kann die ein- und zweistufige Erfolgsrechnung erstellen und interpretieren. (K3)",
    "Ich kann den Jahreserfolg (Gewinn/Verlust) ins Eigenkapital verbuchen. (K3)"
  ]},
  "eigentuemer":       {label: "Konten des Eigentümers", short: "Eigentümer", lernziele: [
    "Ich kann die Funktion des Eigenkapitalkontos und des Privatkontos erklären. (K2)",
    "Ich kann typische Geschäftsfälle auf dem Privatkonto verbuchen. (K3)",
    "Ich kann das Zusammenspiel von Privatkonto, Eigenkapitalkonto und Erfolgsrechnung erklären. (K2)"
  ]},
  "warenkonten":       {label: "Warenkonten & dreistufige Erfolgsrechnung", short: "Warenkonten", lernziele: [
    "Ich kann Wareneinkauf und Warenverkauf korrekt verbuchen (inkl. Rabatte, Skonti, Bezugsspesen). (K3)",
    "Ich kann das Konto Warenvorrat führen und die Bestandesänderung verbuchen. (K3)",
    "Ich kann die dreistufige Erfolgsrechnung (Bruttogewinn, Betriebsgewinn, Jahresgewinn) erstellen. (K3)",
    "Ich kann die Warenkalkulation (Einstandspreis bis Bruttoverkaufspreis) durchführen. (K3)"
  ]},
  "wertberichtigungen": {label: "Wertberichtigungen & Abschreibungen", short: "Wertberichtigungen", lernziele: [
    "Ich kann lineare und degressive Abschreibungen berechnen und verbuchen. (K3)",
    "Ich kann direkte und indirekte Abschreibungen unterscheiden und anwenden. (K3)",
    "Ich kann die Veräusserung von Anlagevermögen verbuchen. (K3)",
    "Ich kann das Delkredere (Wertberichtigung auf Debitoren) berechnen und verbuchen. (K3)"
  ]},
  "abgrenzungen":      {label: "Rechnungsabgrenzungen & Rückstellungen", short: "Abgrenzungen", lernziele: [
    "Ich kann die Notwendigkeit von Rechnungsabgrenzungen erklären. (K2)",
    "Ich kann transitorische Aktiven und Passiven verbuchen und im Folgejahr auflösen. (K3)",
    "Ich kann Rückstellungen von transitorischen Passiven unterscheiden. (K2)",
    "Ich kann Rückstellungen bilden, auflösen und korrekt verbuchen. (K3)"
  ]}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: grundlagen – Grundlagen der Buchhaltung
  // ============================================================

  {
    id: "g01", topic: "grundlagen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche der folgenden Aufgaben gehört NICHT zu den Hauptaufgaben der Finanzbuchhaltung?",
    options: [
      {v: "A", t: "Planung von Marketingkampagnen"},
      {v: "B", t: "Grundlage zur Berechnung der Steuern"},
      {v: "C", t: "Ausweis von Gewinn und Verlust"},
      {v: "D", t: "Übersicht über Forderungen und Schulden"}
    ],
    correct: "A",
    explain: "Die Hauptaufgaben der Finanzbuchhaltung sind: Ausweis von Gewinn und Verlust, Übersicht über Forderungen und Schulden, Beweismittel bei Streitigkeiten, Kalkulationsgrundlage für die Preisgestaltung sowie Grundlage zur Steuerberechnung. Marketing gehört nicht dazu."
  },
  {
    id: "g02", topic: "grundlagen", type: "multi", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche der folgenden Aufgaben gehören zu den Hauptaufgaben der Finanzbuchhaltung? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ausweis von Gewinn und Verlust"},
      {v: "B", t: "Beweismittel bei Streitigkeiten"},
      {v: "C", t: "Personalrekrutierung"},
      {v: "D", t: "Kalkulationsgrundlage für die Preisgestaltung"}
    ],
    correct: ["A", "B", "D"],
    explain: "Ausweis von Gewinn/Verlust, Beweismittel bei Streitigkeiten und Kalkulationsgrundlage gehören zu den fünf Hauptaufgaben. Personalrekrutierung ist keine Aufgabe der Buchhaltung."
  },
  {
    id: "g03", topic: "grundlagen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Ab welchem Jahresumsatz besteht in der Schweiz eine umfassende Buchführungspflicht für Einzelunternehmen und Personengesellschaften?",
    options: [
      {v: "A", t: "CHF 100'000"},
      {v: "B", t: "CHF 500'000"},
      {v: "C", t: "CHF 250'000"},
      {v: "D", t: "CHF 1'000'000"}
    ],
    correct: "B",
    explain: "Gemäss Art. 957 Abs. 1 OR sind Einzelunternehmen und Personengesellschaften ab einem Jahresumsatz von CHF 500'000 zur ordnungsgemässen Buchführung verpflichtet. Juristische Personen sind unabhängig vom Umsatz buchführungspflichtig."
  },
  {
    id: "g04", topic: "grundlagen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Juristische Personen (z.B. eine AG oder GmbH) sind unabhängig vom Umsatz immer buchführungspflichtig.",
    correct: true,
    explain: "Richtig. Gemäss Art. 957 Abs. 1 OR sind alle juristischen Personen buchführungspflichtig – unabhängig von ihrem Jahresumsatz."
  },
  {
    id: "g05", topic: "grundlagen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Der Grundsatz «Keine Buchung ohne {0}» besagt, dass jede Buchung durch ein Dokument (z.B. Rechnung, Kontoauszug) nachgewiesen werden muss.",
    blanks: [
      {answer: "Beleg", alts: ["Beleg", "Dokument"]}
    ],
    explain: "Der Belegprinzip ist ein zentraler Grundsatz der Buchhaltung: Jeder Geschäftsfall muss durch einen Beleg (Rechnung, Quittung, Kontoauszug) nachgewiesen werden können."
  },
  {
    id: "g06", topic: "grundlagen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welcher Grundsatz der Buchführung besagt, dass Aktiven im Zweifelsfall eher zu tief und Passiven eher zu hoch bewertet werden sollen?",
    options: [
      {v: "A", t: "Grundsatz der Periodenabgrenzung"},
      {v: "B", t: "Vorsichtsprinzip"},
      {v: "C", t: "Grundsatz der Stetigkeit"},
      {v: "D", t: "Grundsatz der Klarheit"}
    ],
    correct: "B",
    explain: "Das Vorsichtsprinzip (Imparitätsprinzip) verlangt eine vorsichtige Bewertung: Verluste werden erfasst, sobald sie wahrscheinlich sind, Gewinne erst, wenn sie realisiert sind. Aktiven werden im Zweifelsfall tiefer, Passiven höher bewertet."
  },
  {
    id: "g07", topic: "grundlagen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was verbietet das Bruttoprinzip (Verrechnungsverbot)?",
    options: [
      {v: "A", t: "Die Verwendung von Fremdwährungen in der Buchhaltung"},
      {v: "B", t: "Die Bildung von Rückstellungen"},
      {v: "C", t: "Die Verrechnung von Aufwand- und Ertragspositionen miteinander"},
      {v: "D", t: "Die Verwendung von Abkürzungen im Journal"}
    ],
    correct: "C",
    explain: "Das Bruttoprinzip (Verrechnungsverbot) besagt, dass Aktiven und Passiven sowie Aufwände und Erträge nicht miteinander verrechnet werden dürfen, sondern separat ausgewiesen werden müssen."
  },
  {
    id: "g08", topic: "grundlagen", type: "fill", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die 9 Kontenklassen des KMU-Kontenrahmens gliedern sich wie folgt: Klasse 1 = {0}, Klasse 2 = {1}, Klassen 3–8 = Erfolgskonten, Klasse 9 = Abschlusskonten.",
    blanks: [
      {answer: "Aktiven", alts: ["Vermögen"]},
      {answer: "Passiven", alts: ["Schulden und Eigenkapital"]}
    ],
    explain: "Im KMU-Kontenrahmen sind Klasse 1 die Aktiven (Vermögenswerte) und Klasse 2 die Passiven (Fremd- und Eigenkapital). Die Klassen 3–8 umfassen die Erfolgskonten (Erträge und Aufwände)."
  },
  {
    id: "g09", topic: "grundlagen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist der Unterschied zwischen dem Journal und dem Hauptbuch?",
    options: [
      {v: "A", t: "Das Journal ordnet chronologisch, das Hauptbuch nach Konten"},
      {v: "B", t: "Das Journal enthält nur Bilanzkonten, das Hauptbuch auch Erfolgskonten"},
      {v: "C", t: "Es gibt keinen Unterschied – beides sind Synonyme"},
      {v: "D", t: "Das Journal ordnet nach Konten, das Hauptbuch nach Datum"}
    ],
    correct: "A",
    explain: "Das Journal (Grundbuch) erfasst alle Geschäftsfälle in chronologischer Reihenfolge. Das Hauptbuch ordnet dieselben Buchungen nach Konten (alle Buchungen eines Kontos zusammen). Der Ablauf ist: Belege → Journal → Hauptbuch."
  },
  {
    id: "g10", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Einzelunternehmer mit CHF 400'000 Jahresumsatz führt lediglich ein Kassenbuch und eine Aufstellung der Vermögenslage. Ist dies gesetzeskonform?",
    options: [
      {v: "A", t: "Nein, Einzelunternehmen sind grundsätzlich von der Buchführungspflicht befreit"},
      {v: "B", t: "Ja, da er unter CHF 500'000 liegt, genügt eine vereinfachte Buchführung (Einnahmen-/Ausgabenrechnung und Vermögensaufstellung)"},
      {v: "C", t: "Ja, aber nur wenn das Unternehmen weniger als 5 Mitarbeitende hat"},
      {v: "D", t: "Nein, jeder Unternehmer muss eine vollständige doppelte Buchhaltung führen"}
    ],
    correct: "B",
    explain: "Gemäss Art. 957 Abs. 2 OR genügt für Einzelunternehmen mit weniger als CHF 500'000 Jahresumsatz eine vereinfachte Buchführung: eine Einnahmen-/Ausgabenrechnung sowie eine Vermögensaufstellung (Inventar)."
  },
  {
    id: "g11", topic: "grundlagen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Grundsätze gehören zu den Grundsätzen ordnungsmässiger Buchführung (GoB)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Vollständigkeit und wahrheitsgetreue Erfassung"},
      {v: "B", t: "Gewinnmaximierungsprinzip"},
      {v: "C", t: "Vorsichtsprinzip"},
      {v: "D", t: "Stetigkeit (Kontinuität)"}
    ],
    correct: ["A", "C", "D"],
    explain: "Vollständigkeit, Vorsichtsprinzip und Stetigkeit gehören zu den GoB. Ein Gewinnmaximierungsprinzip gibt es in der Buchführung nicht – dieses ist ein betriebswirtschaftliches Ziel."
  },
  {
    id: "g12", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Unternehmen wechselt jedes Jahr die Bewertungsmethode für seine Vorräte, um den Gewinn möglichst günstig darzustellen. Welcher Grundsatz wird dadurch verletzt?",
    options: [
      {v: "A", t: "Grundsatz der Stetigkeit (Kontinuität)"},
      {v: "B", t: "Belegprinzip"},
      {v: "C", t: "Grundsatz der Wesentlichkeit"},
      {v: "D", t: "Grundsatz der Klarheit"}
    ],
    correct: "A",
    explain: "Der Grundsatz der Stetigkeit verlangt, dass einmal gewählte Bewertungs- und Darstellungsmethoden über mehrere Jahre beibehalten werden. Ein jährlicher Methodenwechsel zur Gewinnoptimierung verstösst klar gegen dieses Prinzip."
  },
  {
    id: "g13", topic: "grundlagen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Der Kontenrahmen ist für jedes Unternehmen verbindlich und darf nicht angepasst werden.",
    correct: false,
    explain: "Falsch. Der Kontenrahmen (z.B. KMU-Kontenrahmen) ist eine Empfehlung bzw. ein Muster. Jedes Unternehmen wählt daraus die für seine Zwecke nötigen Konten aus und erstellt seinen individuellen Kontenplan."
  },

  // ============================================================
  // TOPIC: bilanz – Bilanz, Inventar & Bewertung
  // ============================================================

  {
    id: "b01", topic: "bilanz", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was zeigt die Bilanz?",
    options: [
      {v: "A", t: "Die Zahlungsströme eines Unternehmens"},
      {v: "B", t: "Die Umsatzentwicklung über ein Jahr"},
      {v: "C", t: "Die Vermögenswerte und die Finanzierung eines Unternehmens an einem bestimmten Stichtag"},
      {v: "D", t: "Den Gewinn oder Verlust einer Periode"}
    ],
    correct: "C",
    explain: "Die Bilanz ist eine Gegenüberstellung von Aktiven (Vermögen) und Passiven (Finanzierung durch Fremd- und Eigenkapital) an einem bestimmten Stichtag (Bilanzstichtag)."
  },
  {
    id: "b02", topic: "bilanz", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die linke Seite der Bilanz heisst {0} und zeigt das Vermögen. Die rechte Seite heisst {1} und zeigt die Finanzierung.",
    blanks: [
      {answer: "Aktiven", alts: ["Aktiva", "Aktivseite"]},
      {answer: "Passiven", alts: ["Passiva", "Passivseite"]}
    ],
    explain: "Die Bilanz ist zweiseitig aufgebaut: Links stehen die Aktiven (Vermögenswerte), rechts die Passiven (Fremdkapital und Eigenkapital als Finanzierungsquellen)."
  },
  {
    id: "b03", topic: "bilanz", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_bilanzstruktur_01.svg", alt: "Diagramm: Aufbau der Bilanz mit Aktiven und Passiven"},
    q: "Nach welchem Prinzip werden die Aktiven in der Bilanz geordnet?",
    options: [
      {v: "A", t: "Nach dem Fälligkeitsprinzip (kurzfristig vor langfristig)"},
      {v: "B", t: "Nach dem Liquiditätsprinzip (flüssig vor weniger flüssig)"},
      {v: "C", t: "Nach Anschaffungswert (teuerste zuerst)"},
      {v: "D", t: "Alphabetisch nach Kontoname"}
    ],
    correct: "B",
    explain: "Die Aktiven werden nach dem Liquiditätsprinzip (Flüssigkeitsprinzip) geordnet: Zuerst die am schnellsten in Geld umwandelbaren Positionen (Kasse, Bank), dann die weniger liquiden (Immobilien)."
  },
  {
    id: "b04", topic: "bilanz", type: "multi", diff: 1, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Positionen gehören zum Umlaufvermögen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kasse"},
      {v: "B", t: "Immobilien"},
      {v: "C", t: "Debitoren"},
      {v: "D", t: "Warenvorrat"}
    ],
    correct: ["A", "C", "D"],
    explain: "Zum Umlaufvermögen gehören Vermögensteile, die innerhalb eines Jahres in Geld umgewandelt werden: Kasse, Bank, Debitoren (Forderungen), Warenvorrat, Wertschriften. Immobilien gehören zum Anlagevermögen."
  },
  {
    id: "b05", topic: "bilanz", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist das Eigenkapital in der Bilanz?",
    options: [
      {v: "A", t: "Der Jahresgewinn des Unternehmens"},
      {v: "B", t: "Das Bargeld, das der Eigentümer ins Unternehmen eingelegt hat"},
      {v: "C", t: "Die Summe aller Schulden des Unternehmens"},
      {v: "D", t: "Die Differenz zwischen Aktiven und Fremdkapital – also die rechnerische Schuld gegenüber dem Eigentümer"}
    ],
    correct: "D",
    explain: "Das Eigenkapital ist die Differenz zwischen den Aktiven (Vermögen) und dem Fremdkapital (Schulden an Dritte). Es stellt die rechnerische Schuld des Unternehmens gegenüber dem Geschäftseigentümer dar."
  },
  {
    id: "b06", topic: "bilanz", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen hat folgende Bilanzpositionen: Kasse CHF 5'000, Bank CHF 25'000, Debitoren CHF 15'000, Warenvorrat CHF 30'000, Mobilien CHF 10'000, Fahrzeuge CHF 40'000, Kreditoren CHF 20'000, Hypothek CHF 60'000. Berechne das Eigenkapital und die Bilanzsumme.",
    rows: [
      {label: "Bilanzsumme (Total Aktiven)", answer: 125000, tolerance: 0, unit: "CHF"},
      {label: "Eigenkapital", answer: 45000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Aktiven: 5'000 + 25'000 + 15'000 + 30'000 + 10'000 + 40'000 = 125'000 CHF. Fremdkapital: 20'000 + 60'000 = 80'000 CHF. Eigenkapital = Aktiven – Fremdkapital = 125'000 – 80'000 = 45'000 CHF. Die Bilanzsumme ist das Total der Aktiven (= Total der Passiven) = 125'000 CHF."
  },
  {
    id: "b07", topic: "bilanz", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Debitoren sind Schulden des Unternehmens gegenüber Lieferanten.",
    correct: false,
    explain: "Falsch. Debitoren (Forderungen aus Lieferungen und Leistungen) sind Guthaben des Unternehmens bei Kunden. Schulden gegenüber Lieferanten heissen Kreditoren."
  },
  {
    id: "b08", topic: "bilanz", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Nach welchem Prinzip werden die Passiven in der Bilanz geordnet?",
    options: [
      {v: "A", t: "Alphabetisch"},
      {v: "B", t: "Nach Höhe des Betrags (grösster zuerst)"},
      {v: "C", t: "Liquiditätsprinzip"},
      {v: "D", t: "Fälligkeitsprinzip (kurzfristige vor langfristigen Schulden)"}
    ],
    correct: "D",
    explain: "Die Passiven werden nach dem Fälligkeitsprinzip geordnet: Zuerst die kurzfristigen Schulden (z.B. Kreditoren), dann die langfristigen (z.B. Hypotheken), zuletzt das Eigenkapital."
  },
  {
    id: "b09", topic: "bilanz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen hat Maschinen für CHF 80'000 gekauft. Der aktuelle Marktwert beträgt CHF 65'000. Zu welchem Wert erscheinen die Maschinen in der Bilanz?",
    options: [
      {v: "A", t: "CHF 80'000 plus Teuerungszuschlag"},
      {v: "B", t: "CHF 72'500 (Durchschnitt)"},
      {v: "C", t: "CHF 80'000 (Anschaffungswert)"},
      {v: "D", t: "CHF 65'000 (Marktwert, da tiefer)"}
    ],
    correct: "D",
    explain: "Gemäss dem Niederstwertprinzip wird der tiefere der beiden Werte (Anschaffungswert oder Marktwert) angesetzt. Da der Marktwert von CHF 65'000 tiefer ist als der Anschaffungswert von CHF 80'000, werden die Maschinen mit CHF 65'000 bilanziert."
  },
  {
    id: "b10", topic: "bilanz", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Bilanzsumme der Aktivseite muss immer gleich gross sein wie die Bilanzsumme der Passivseite.",
    correct: true,
    explain: "Richtig. Das ist die Bilanzgleichung: Aktiven = Passiven. Jeder Vermögenswert muss durch Fremd- oder Eigenkapital finanziert sein, daher müssen beide Seiten identisch sein."
  },
  {
    id: "b11", topic: "bilanz", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Aussage zur Bilanz ist korrekt?",
    options: [
      {v: "A", t: "Die Bilanz zeigt nur die Schulden eines Unternehmens"},
      {v: "B", t: "Die Bilanz wird monatlich erstellt und zeigt den Umsatz"},
      {v: "C", t: "Die Bilanz zeigt die Situation über eine ganze Periode (Stromgrösse)"},
      {v: "D", t: "Die Bilanz zeigt die Situation an einem bestimmten Stichtag (Bestandesgrösse)"}
    ],
    correct: "D",
    explain: "Die Bilanz ist eine Momentaufnahme (Bestandesgrösse) an einem bestimmten Stichtag. Die Erfolgsrechnung hingegen zeigt die Entwicklung über eine Periode (Stromgrössen: Aufwände und Erträge)."
  },
  {
    id: "b12", topic: "bilanz", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche der folgenden Aussagen zum Inventar sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Inventar ist eine detaillierte, art-, mengen- und wertmässige Aufstellung aller Vermögensteile und Schulden"},
      {v: "B", t: "Das Inventar wird mindestens einmal jährlich am Bilanzstichtag erstellt"},
      {v: "C", t: "Das Inventar und die Bilanz zeigen exakt die gleichen Informationen"},
      {v: "D", t: "Das Inventar bildet die Grundlage für die Bilanzerstellung"}
    ],
    correct: ["A", "B", "D"],
    explain: "Das Inventar ist detaillierter als die Bilanz (mit Mengen, Einzelwerten), wird mindestens jährlich erstellt und dient als Grundlage für die Bilanz. Die Bilanz fasst die Inventarinformationen zusammen."
  },
  {
    id: "b13", topic: "bilanz", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_bilanzstruktur_02.svg", alt: "Bilanzstruktur mit Flüssigkeits- und Fälligkeitsprinzip"},
    q: "Betrachte die Bilanzstruktur in der Abbildung. Welches Prinzip bestimmt die Reihenfolge auf der Aktivseite?",
    options: [
      {v: "A", t: "Das Alphabetprinzip – nach Kontobezeichnung"},
      {v: "B", t: "Das Fälligkeitsprinzip – von kurzfristig nach langfristig"},
      {v: "C", t: "Das Wertprinzip – vom grössten zum kleinsten Betrag"},
      {v: "D", t: "Das Flüssigkeitsprinzip – vom flüssigsten zum am wenigsten flüssigen Vermögenswert"}
    ],
    correct: "D",
    explain: "Die Aktivseite wird nach dem Flüssigkeitsprinzip geordnet: Oben steht das Umlaufvermögen (flüssig, < 1 Jahr), unten das Anlagevermögen (weniger flüssig, > 1 Jahr)."
  },
  {
    id: "b14", topic: "bilanz", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_bilanzstruktur_02.svg", alt: "Bilanzstruktur mit Flüssigkeits- und Fälligkeitsprinzip"},
    q: "Betrachte die Bilanzstruktur. Welches Prinzip bestimmt die Reihenfolge auf der Passivseite?",
    options: [
      {v: "A", t: "Das Alphabetprinzip"},
      {v: "B", t: "Das Fälligkeitsprinzip – von kurzfristig nach langfristig fällig"},
      {v: "C", t: "Das Grössenprinzip – vom grössten zum kleinsten Betrag"},
      {v: "D", t: "Das Flüssigkeitsprinzip"}
    ],
    correct: "B",
    explain: "Die Passivseite wird nach dem Fälligkeitsprinzip geordnet: Oben steht das kurzfristige Fremdkapital (< 1 Jahr), dann das langfristige Fremdkapital (> 1 Jahr), zuunterst das Eigenkapital (unbefristet)."
  },
  {
    id: "b15", topic: "bilanz", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_bilanzstruktur_02.svg", alt: "Bilanzstruktur mit Flüssigkeits- und Fälligkeitsprinzip"},
    q: "Welche Konten gehören gemäss der Bilanzstruktur zum Umlaufvermögen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kasse und Bank"},
      {v: "B", t: "Debitoren und Warenvorrat"},
      {v: "C", t: "Fahrzeuge und Immobilien"},
      {v: "D", t: "Mobilien und Maschinen"}
    ],
    correct: ["A", "B"],
    explain: "Umlaufvermögen (< 1 Jahr): Kasse, Bank, Debitoren, Warenvorrat. Fahrzeuge, Immobilien, Mobilien und Maschinen sind Anlagevermögen (> 1 Jahr)."
  },

  // ============================================================
  // TOPIC: kontentypen – Die vier Kontentypen
  // ============================================================

  {
    id: "k01", topic: "kontentypen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_kontentypen_01.svg", alt: "Übersicht der Kontentypen mit T-Konto-Darstellung"},
    q: "Welche vier Kontentypen gibt es in der doppelten Buchhaltung?",
    options: [
      {v: "A", t: "Aktivkonten, Passivkonten, Aufwandkonten, Ertragskonten"},
      {v: "B", t: "Bargeldkonten, Kreditkonten, Gewinnkonten, Verlustkonten"},
      {v: "C", t: "Soll-Konten, Haben-Konten, Journal-Konten, Bilanzkonten"},
      {v: "D", t: "Eröffnungskonten, Schlusskonten, Erfolgskonten, Bilanzkonten"}
    ],
    correct: "A",
    explain: "Die vier Kontentypen sind: Aktivkonten (Vermögen), Passivkonten (Fremd- und Eigenkapital), Aufwandkonten (Werteverzehr) und Ertragskonten (Wertezuwachs). Aktiv- und Passivkonten sind Bilanzkonten, Aufwand- und Ertragskonten sind Erfolgskonten."
  },
  {
    id: "k02", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Auf welcher Seite stehen Zunahmen bei einem Aktivkonto?",
    options: [
      {v: "A", t: "Aktivkonten haben keine festen Seiten"},
      {v: "B", t: "Im Soll oder im Haben – je nach Geschäftsfall"},
      {v: "C", t: "Im Haben (rechts)"},
      {v: "D", t: "Im Soll (links)"}
    ],
    correct: "D",
    explain: "Bei Aktivkonten stehen Zunahmen im Soll (links) und Abnahmen im Haben (rechts). Der Anfangsbestand steht ebenfalls im Soll."
  },
  {
    id: "k03", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Auf welcher Seite stehen Zunahmen bei einem Passivkonto?",
    options: [
      {v: "A", t: "Im Soll (links)"},
      {v: "B", t: "Passivkonten haben nur eine Sollseite"},
      {v: "C", t: "Im Soll und im Haben gleichzeitig"},
      {v: "D", t: "Im Haben (rechts)"}
    ],
    correct: "D",
    explain: "Bei Passivkonten stehen Zunahmen im Haben (rechts) und Abnahmen im Soll (links). Der Anfangsbestand steht ebenfalls im Haben. Passivkonten verhalten sich spiegelbildlich zu Aktivkonten."
  },
  {
    id: "k04", topic: "kontentypen", type: "fill", diff: 1, tax: "K2",
 reviewed:false,
    q: "Aufwandkonten nehmen auf der {0}-Seite zu, Ertragskonten nehmen auf der {1}-Seite zu.",
    blanks: [
      {answer: "Soll", alts: ["linken"]},
      {answer: "Haben", alts: ["rechten"]}
    ],
    explain: "Aufwandkonten verhalten sich wie Aktivkonten: Zunahmen im Soll (links). Ertragskonten verhalten sich wie Passivkonten: Zunahmen im Haben (rechts)."
  },
  {
    id: "k05", topic: "kontentypen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Aufwandkonten verhalten sich bezüglich Soll und Haben gleich wie Aktivkonten.",
    correct: true,
    explain: "Richtig. Sowohl Aktiv- als auch Aufwandkonten nehmen auf der Sollseite (links) zu und auf der Habenseite (rechts) ab. Merksatz: Aktiv- und Aufwandkonten sind «Soll-Konten»."
  },
  {
    id: "k06", topic: "kontentypen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Ertragskonten verhalten sich bezüglich Soll und Haben gleich wie Passivkonten.",
    correct: true,
    explain: "Richtig. Sowohl Passiv- als auch Ertragskonten nehmen auf der Habenseite (rechts) zu und auf der Sollseite (links) ab. Merksatz: Passiv- und Ertragskonten sind «Haben-Konten»."
  },
  {
    id: "k07", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Zu welchem Kontentyp gehört das Konto «Bank»?",
    options: [
      {v: "A", t: "Aktivkonto"},
      {v: "B", t: "Ertragskonto"},
      {v: "C", t: "Aufwandkonto"},
      {v: "D", t: "Passivkonto"}
    ],
    correct: "A",
    explain: "Das Bankkonto zeigt das Guthaben des Unternehmens bei der Bank. Es gehört zum Vermögen → Aktivkonto."
  },
  {
    id: "k08", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Zu welchem Kontentyp gehört das Konto «Kreditoren»?",
    options: [
      {v: "A", t: "Aktivkonto"},
      {v: "B", t: "Ertragskonto"},
      {v: "C", t: "Passivkonto"},
      {v: "D", t: "Aufwandkonto"}
    ],
    correct: "C",
    explain: "Kreditoren sind Verbindlichkeiten gegenüber Lieferanten. Sie stehen auf der rechten Bilanzseite → Passivkonto."
  },
  {
    id: "k09", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Zu welchem Kontentyp gehört das Konto «Lohnaufwand»?",
    options: [
      {v: "A", t: "Ertragskonto"},
      {v: "B", t: "Aufwandkonto"},
      {v: "C", t: "Passivkonto"},
      {v: "D", t: "Aktivkonto"}
    ],
    correct: "B",
    explain: "Lohnaufwand erfasst die Kosten für Mitarbeiterlöhne. Löhne sind Werteverzehr → Aufwandkonto."
  },
  {
    id: "k10", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Zu welchem Kontentyp gehört das Konto «Warenverkauf»?",
    options: [
      {v: "A", t: "Aufwandkonto"},
      {v: "B", t: "Aktivkonto"},
      {v: "C", t: "Passivkonto"},
      {v: "D", t: "Ertragskonto"}
    ],
    correct: "D",
    explain: "Warenverkauf erfasst die Erlöse aus dem Verkauf von Waren. Erlöse sind Wertezuwachs → Ertragskonto."
  },
  {
    id: "k11", topic: "kontentypen", type: "multi", diff: 1, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Konten sind Aktivkonten? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kasse"},
      {v: "B", t: "Hypothek"},
      {v: "C", t: "Debitoren"},
      {v: "D", t: "Fahrzeuge"}
    ],
    correct: ["A", "C", "D"],
    explain: "Kasse, Debitoren und Fahrzeuge gehören zum Vermögen des Unternehmens → Aktivkonten. Die Hypothek ist eine langfristige Schuld → Passivkonto."
  },
  {
    id: "k12", topic: "kontentypen", type: "multi", diff: 1, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Konten sind Passivkonten? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kreditoren"},
      {v: "B", t: "Eigenkapital"},
      {v: "C", t: "Warenvorrat"},
      {v: "D", t: "Darlehen"}
    ],
    correct: ["A", "B", "D"],
    explain: "Kreditoren (kurzfristiges FK), Eigenkapital und Darlehen (langfristiges FK) stehen auf der Passivseite der Bilanz → Passivkonten. Der Warenvorrat gehört zum Vermögen → Aktivkonto."
  },
  {
    id: "k13", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Debitoren» nimmt ab. Auf welcher Seite wird diese Abnahme gebucht?",
    options: [
      {v: "A", t: "Im Haben, weil Debitoren ein Aktivkonto ist und Abnahmen bei Aktivkonten im Haben stehen"},
      {v: "B", t: "Im Soll, weil Abnahmen bei allen Konten im Soll stehen"},
      {v: "C", t: "Im Haben, weil eine Abnahme immer eine Gutschrift ist"},
      {v: "D", t: "Im Soll, weil Debitoren ein Passivkonto ist"}
    ],
    correct: "A",
    explain: "Debitoren ist ein Aktivkonto. Bei Aktivkonten stehen Abnahmen im Haben (rechts). Beispiel: Ein Kunde bezahlt seine Rechnung → Bank (Soll) an Debitoren (Haben)."
  },
  {
    id: "k14", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Hypothek» nimmt ab (Teilrückzahlung). Auf welcher Seite wird diese Abnahme gebucht?",
    options: [
      {v: "A", t: "Im Soll, weil alle Abnahmen im Soll stehen"},
      {v: "B", t: "Im Haben, weil Hypothek ein Passivkonto ist"},
      {v: "C", t: "Im Haben, weil Rückzahlungen immer im Haben gebucht werden"},
      {v: "D", t: "Im Soll, weil Hypothek ein Passivkonto ist und Abnahmen bei Passivkonten im Soll stehen"}
    ],
    correct: "D",
    explain: "Hypothek ist ein Passivkonto. Bei Passivkonten stehen Abnahmen im Soll (links). Buchungssatz: Hypothek (Soll) an Bank (Haben)."
  },
  {
    id: "k15", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Mietaufwand» nimmt zu (Miete wird bezahlt). Auf welcher Seite wird die Zunahme gebucht?",
    options: [
      {v: "A", t: "Im Soll, weil alle Konten im Soll zunehmen"},
      {v: "B", t: "Im Haben, weil Mietaufwand ein Passivkonto ist"},
      {v: "C", t: "Im Haben, weil Ausgaben immer im Haben stehen"},
      {v: "D", t: "Im Soll, weil Aufwandkonten im Soll zunehmen"}
    ],
    correct: "D",
    explain: "Mietaufwand ist ein Aufwandkonto. Aufwandkonten nehmen im Soll (links) zu – genau wie Aktivkonten."
  },
  {
    id: "k16", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Honorarertrag» nimmt zu (Rechnung an Kunden). Auf welcher Seite wird die Zunahme gebucht?",
    options: [
      {v: "A", t: "Im Soll, weil alle Zunahmen im Soll stehen"},
      {v: "B", t: "Im Haben, weil Honorarertrag ein Aktivkonto ist"},
      {v: "C", t: "Im Soll, weil Einnahmen immer im Soll stehen"},
      {v: "D", t: "Im Haben, weil Ertragskonten im Haben zunehmen"}
    ],
    correct: "D",
    explain: "Honorarertrag ist ein Ertragskonto. Ertragskonten nehmen im Haben (rechts) zu – genau wie Passivkonten."
  },
  {
    id: "k17", topic: "kontentypen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Kreditoren» nimmt zu (neue Lieferantenrechnung). Die Zunahme wird im {0} gebucht, weil Kreditoren ein {1} ist.",
    blanks: [
      {answer: "Haben", alts: ["rechts"]},
      {answer: "Passivkonto", alts: ["passives Konto"]}
    ],
    explain: "Kreditoren ist ein Passivkonto. Bei Passivkonten stehen Zunahmen im Haben (rechts)."
  },
  {
    id: "k18", topic: "kontentypen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Fahrzeuge» nimmt zu (Kauf eines Lieferwagens). Die Zunahme wird im {0} gebucht, weil Fahrzeuge ein {1} ist.",
    blanks: [
      {answer: "Soll", alts: ["links"]},
      {answer: "Aktivkonto", alts: ["aktives Konto"]}
    ],
    explain: "Fahrzeuge ist ein Aktivkonto. Bei Aktivkonten stehen Zunahmen im Soll (links)."
  },
  {
    id: "k19", topic: "kontentypen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Bei welchen Kontentypen stehen Zunahmen im Soll (links)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Aktivkonten"},
      {v: "B", t: "Passivkonten"},
      {v: "C", t: "Aufwandkonten"},
      {v: "D", t: "Ertragskonten"}
    ],
    correct: ["A", "C"],
    explain: "Aktivkonten und Aufwandkonten nehmen im Soll (links) zu. Passivkonten und Ertragskonten nehmen im Haben (rechts) zu. Merksatz: Aktiv/Aufwand = Soll-Zunahme, Passiv/Ertrag = Haben-Zunahme."
  },
  {
    id: "k20", topic: "kontentypen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Bei welchen Kontentypen stehen Zunahmen im Haben (rechts)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Aktivkonten"},
      {v: "B", t: "Passivkonten"},
      {v: "C", t: "Aufwandkonten"},
      {v: "D", t: "Ertragskonten"}
    ],
    correct: ["B", "D"],
    explain: "Passivkonten und Ertragskonten nehmen im Haben (rechts) zu. Aktivkonten und Aufwandkonten nehmen im Soll (links) zu."
  },
  {
    id: "k21", topic: "kontentypen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche zwei Kontentypen gehören zu den Bilanzkonten (Bestandeskonten)?",
    options: [
      {v: "A", t: "Passivkonten und Ertragskonten"},
      {v: "B", t: "Aktivkonten und Aufwandkonten"},
      {v: "C", t: "Aufwandkonten und Ertragskonten"},
      {v: "D", t: "Aktivkonten und Passivkonten"}
    ],
    correct: "D",
    explain: "Bilanzkonten (Bestandeskonten) sind Aktivkonten und Passivkonten. Sie haben einen Anfangsbestand und werden von Jahr zu Jahr übertragen. Aufwand- und Ertragskonten sind Erfolgskonten und starten jedes Jahr bei null."
  },
  {
    id: "k22", topic: "kontentypen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Konten sind Aufwandkonten? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Lohnaufwand"},
      {v: "B", t: "Warenverkauf"},
      {v: "C", t: "Mietaufwand"},
      {v: "D", t: "Abschreibungen"}
    ],
    correct: ["A", "C", "D"],
    explain: "Lohnaufwand, Mietaufwand und Abschreibungen sind Aufwandkonten (Werteverzehr). Warenverkauf ist ein Ertragskonto."
  },
  {
    id: "k23", topic: "kontentypen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Konten sind Ertragskonten? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Warenverkauf"},
      {v: "B", t: "Finanzertrag"},
      {v: "C", t: "Wareneinkauf"},
      {v: "D", t: "Honorarertrag"}
    ],
    correct: ["A", "B", "D"],
    explain: "Warenverkauf, Finanzertrag und Honorarertrag sind Ertragskonten. Wareneinkauf ist ein Aufwandkonto."
  },
  {
    id: "k24", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto «Eigenkapital» nimmt zu. Auf welcher Seite wird gebucht?",
    options: [
      {v: "A", t: "Im Haben, weil es ein Ertragskonto ist"},
      {v: "B", t: "Im Soll, weil es Kapital des Eigentümers ist"},
      {v: "C", t: "Im Haben, weil Eigenkapital ein Passivkonto ist"},
      {v: "D", t: "Im Soll, weil alle Zunahmen im Soll stehen"}
    ],
    correct: "C",
    explain: "Das Eigenkapital ist ein Passivkonto (rechte Bilanzseite). Zunahmen bei Passivkonten stehen im Haben (rechts)."
  },
  {
    id: "k25", topic: "kontentypen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Das Konto «Wareneinkauf» ist ein Aktivkonto, weil Waren zum Vermögen gehören.",
    correct: false,
    explain: "Falsch. Wareneinkauf ist ein Aufwandkonto (Werteverzehr). Es erfasst die eingekauften Waren als Aufwand. Der Warenvorrat (Lagerbestand) hingegen ist ein Aktivkonto."
  },
  {
    id: "k26", topic: "kontentypen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Das Konto «Darlehen» (Bankdarlehen, das das Unternehmen aufgenommen hat) ist ein Passivkonto.",
    correct: true,
    explain: "Richtig. Ein aufgenommenes Darlehen ist eine Schuld des Unternehmens gegenüber der Bank und steht auf der Passivseite der Bilanz → Passivkonto."
  },
  {
    id: "k27", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Beim Geschäftsfall «Wareneinkauf auf Rechnung» nehmen zwei Konten zu. Welche Kontentypen sind betroffen?",
    options: [
      {v: "A", t: "Aktivkonto (Soll-Zunahme) und Passivkonto (Haben-Zunahme)"},
      {v: "B", t: "Aufwandkonto (Soll-Zunahme) und Passivkonto (Haben-Zunahme)"},
      {v: "C", t: "Aufwandkonto (Soll-Zunahme) und Aktivkonto (Haben-Abnahme)"},
      {v: "D", t: "Ertragskonto (Haben-Zunahme) und Passivkonto (Soll-Abnahme)"}
    ],
    correct: "B",
    explain: "Wareneinkauf (Aufwandkonto) nimmt zu → Soll. Kreditoren (Passivkonto) nehmen zu → Haben."
  },
  {
    id: "k28", topic: "kontentypen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Aufwandkonto nimmt ab (z.B. Gutschrift). Diese Abnahme wird im {0} gebucht – also auf der gleichen Seite wie Zunahmen bei {1}.",
    blanks: [
      {answer: "Haben", alts: ["rechts"]},
      {answer: "Ertragskonten", alts: ["Passivkonten", "Ertragskonto"]}
    ],
    explain: "Aufwandkonten nehmen im Haben ab. Das ist dieselbe Seite, auf der Ertragskonten und Passivkonten zunehmen."
  },
  {
    id: "k29", topic: "kontentypen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welcher Geschäftsfall bewirkt eine Zunahme im Soll und eine Zunahme im Haben, ohne dass ein Erfolgskonto betroffen ist?",
    options: [
      {v: "A", t: "Kauf von Mobilien auf Rechnung (Bilanzverlängerung)"},
      {v: "B", t: "Mietaufwand per Bank bezahlt"},
      {v: "C", t: "Lohnzahlung per Bank"},
      {v: "D", t: "Verkauf von Waren auf Rechnung"}
    ],
    correct: "A",
    explain: "Kauf von Mobilien auf Rechnung: Mobilien (Aktivkonto) nimmt zu im Soll, Kreditoren (Passivkonto) nimmt zu im Haben. Beide sind Bilanzkonten – kein Erfolgskonto betroffen."
  },
  {
    id: "k30", topic: "kontentypen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Geschäftsfall bewirkt eine Zunahme eines Aufwandkontos und eine Abnahme eines Aktivkontos. Was kann man daraus schliessen?",
    options: [
      {v: "A", t: "Der Geschäftsfall ist erfolgsunwirksam"},
      {v: "B", t: "Der Geschäftsfall ist erfolgswirksam – der Gewinn steigt"},
      {v: "C", t: "Der Geschäftsfall ist erfolgswirksam – der Gewinn sinkt"},
      {v: "D", t: "Die Bilanzsumme steigt auf beiden Seiten"}
    ],
    correct: "C",
    explain: "Wenn ein Aufwandkonto zunimmt, ist der Geschäftsfall erfolgswirksam. Aufwand reduziert den Gewinn."
  },
  {
    id: "k31", topic: "kontentypen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Kombination von Kontentypen bewirkt eine Zunahme des Gewinns?",
    options: [
      {v: "A", t: "Aktivkonto nimmt zu (Soll), Ertragskonto nimmt zu (Haben)"},
      {v: "B", t: "Passivkonto nimmt ab (Soll), Aktivkonto nimmt ab (Haben)"},
      {v: "C", t: "Aktivkonto nimmt zu (Soll), Passivkonto nimmt zu (Haben)"},
      {v: "D", t: "Aufwandkonto nimmt zu (Soll), Aktivkonto nimmt ab (Haben)"}
    ],
    correct: "A",
    explain: "Wenn ein Ertragskonto zunimmt (Haben), steigt der Gewinn. Beispiel: Debitoren (Aktivkonto, Soll) an Warenverkauf (Ertragskonto, Haben)."
  },
  {
    id: "k32", topic: "kontentypen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Zu welchem Kontentyp gehört «Wertberichtigung Fahrzeuge» (bei indirekter Abschreibung)?",
    options: [
      {v: "A", t: "Aktivkonto"},
      {v: "B", t: "Aufwandkonto"},
      {v: "C", t: "Passivkonto"},
      {v: "D", t: "Minus-Aktivkonto (Korrekturkonto zur Aktivseite)"}
    ],
    correct: "D",
    explain: "Wertberichtigungskonten sind Minus-Aktivkonten (Korrekturkonten). Sie stehen auf der Aktivseite der Bilanz, verhalten sich aber wie Passivkonten: Zunahmen im Haben, Abnahmen im Soll."
  },
  {
    id: "k33", topic: "kontentypen", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche der folgenden Aussagen sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Erfolgskonten haben keinen Anfangsbestand – sie starten jedes Jahr bei null"},
      {v: "B", t: "Bilanzkonten werden über den Jahreswechsel vorgetragen (Anfangsbestand)"},
      {v: "C", t: "Aufwandkonten werden am Jahresende über die Bilanz abgeschlossen"},
      {v: "D", t: "Ertragskonten werden am Jahresende über die Erfolgsrechnung abgeschlossen"}
    ],
    correct: ["A", "B", "D"],
    explain: "Erfolgskonten starten bei null (A) und werden über die Erfolgsrechnung abgeschlossen (D). Bilanzkonten werden vorgetragen (B). Aufwandkonten werden über die Erfolgsrechnung abgeschlossen, nicht über die Bilanz (C ist falsch)."
  },

  // --- Bildgestützte Fragen: Kontentypen visuell ---
  {
    id: "k34", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_kontentypen_02.svg", alt: "Vier leere T-Konten mit Fragezeichen statt Plus/Minus"},
    q: "Betrachte die vier T-Konten in der Abbildung. Bei welchem Kontentyp steht das (+) auf der Soll-Seite (links)?",
    options: [
      {v: "A", t: "Bei allen vier Kontentypen"},
      {v: "B", t: "Nur beim Aktivkonto"},
      {v: "C", t: "Beim Aktivkonto und beim Aufwandskonto"},
      {v: "D", t: "Beim Passivkonto und beim Ertragskonto"}
    ],
    correct: "C",
    explain: "Aktivkonten und Aufwandskonten nehmen im Soll (links) zu (+). Passivkonten und Ertragskonten nehmen im Haben (rechts) zu (+)."
  },
  {
    id: "k35", topic: "kontentypen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_kontentypen_02.svg", alt: "Vier leere T-Konten mit Fragezeichen statt Plus/Minus"},
    q: "Schau dir die vier T-Konten an. Wo steht der Anfangsbestand (AB) beim Aktivkonto?",
    options: [
      {v: "A", t: "Im Haben (rechts)"},
      {v: "B", t: "In der Mitte"},
      {v: "C", t: "Im Soll (links)"},
      {v: "D", t: "Es gibt keinen Anfangsbestand"}
    ],
    correct: "C",
    explain: "Der Anfangsbestand steht bei Aktivkonten im Soll (links) – also auf derselben Seite wie die Zunahmen. Bei Passivkonten steht der AB im Haben (rechts)."
  },
  {
    id: "k36", topic: "kontentypen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_kontentypen_02.svg", alt: "Vier leere T-Konten mit Fragezeichen statt Plus/Minus"},
    q: "Aufwandskonten und Ertragskonten haben keinen Anfangsbestand – sie starten jedes Jahr bei null.",
    correct: true,
    explain: "Richtig. Erfolgskonten (Aufwand und Ertrag) werden am Jahresende über die Erfolgsrechnung abgeschlossen und starten im neuen Jahr bei null. Nur Bilanzkonten (Aktiv und Passiv) haben einen Anfangsbestand."
  },
  {
    id: "k37", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_konten_zuordnung_01.svg", alt: "12 Konten zum Zuordnen auf verschiedene Kontentypen"},
    q: "Betrachte die Zuordnungsübersicht. Welche Konten gehören zum Typ «Passivkonto» (cyan)?",
    options: [
      {v: "A", t: "Kreditoren, Eigenkapital, Wareneinkauf, Darlehen"},
      {v: "B", t: "Hypothek, Debitoren, Eigenkapital, Darlehen"},
      {v: "C", t: "Kasse, Debitoren, Fahrzeuge, Eigenkapital"},
      {v: "D", t: "Hypothek, Kreditoren, Eigenkapital, Darlehen"}
    ],
    correct: "D",
    explain: "Passivkonten zeigen Schulden und Eigenkapital: Hypothek (langfristiges FK), Kreditoren (kurzfristiges FK), Eigenkapital und Darlehen (langfristiges FK). Debitoren sind ein Aktivkonto."
  },
  {
    id: "k38", topic: "kontentypen", type: "multi", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_konten_zuordnung_01.svg", alt: "12 Konten zum Zuordnen auf verschiedene Kontentypen"},
    q: "Welche Konten aus der Abbildung gehören zum Typ «Aufwandskonto» (magenta)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Lohnaufwand"},
      {v: "B", t: "Mietaufwand"},
      {v: "C", t: "Wareneinkauf"},
      {v: "D", t: "Finanzertrag"}
    ],
    correct: ["A", "B", "C"],
    explain: "Lohnaufwand, Mietaufwand und Wareneinkauf sind Aufwandskonten (Werteverzehr). Finanzertrag ist ein Ertragskonto."
  },
  {
    id: "k39", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_02.svg", alt: "T-Konten Mietaufwand und Bank mit Fragezeichen"},
    q: "Die Abbildung zeigt den Geschäftsfall «Miete CHF 4'500 per Bank bezahlt». Auf welcher Seite wird der Betrag beim Konto Mietaufwand eingetragen?",
    options: [
      {v: "A", t: "Im Haben (rechts), weil es ein Passivkonto ist"},
      {v: "B", t: "Im Haben (rechts), weil Geld abfliesst"},
      {v: "C", t: "Im Soll (links), weil Aufwandskonten im Soll zunehmen"},
      {v: "D", t: "Im Soll (links), weil es ein Aktivkonto ist"}
    ],
    correct: "C",
    explain: "Mietaufwand ist ein Aufwandskonto (magenta). Aufwandskonten nehmen im Soll (links) zu. Bank ist ein Aktivkonto (gelb) und nimmt im Haben (rechts) ab."
  },
  {
    id: "k40", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_03.svg", alt: "T-Konten Debitoren und Warenverkauf mit Fragezeichen"},
    q: "Die Abbildung zeigt den Geschäftsfall «Warenverkauf auf Rechnung CHF 8'000». Auf welcher Seite steht der Betrag beim Konto Warenverkauf?",
    options: [
      {v: "A", t: "Im Soll (links), weil der Betrag zunimmt"},
      {v: "B", t: "Im Haben (rechts), weil Ertragskonten im Haben zunehmen"},
      {v: "C", t: "Im Haben (rechts), weil Geld eingeht"},
      {v: "D", t: "Im Soll (links), weil es ein Aktivkonto ist"}
    ],
    correct: "B",
    explain: "Warenverkauf ist ein Ertragskonto (grün). Ertragskonten nehmen im Haben (rechts) zu. Debitoren (gelb, Aktivkonto) nehmen im Soll (links) zu."
  },
  {
    id: "k41", topic: "kontentypen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_04.svg", alt: "T-Konten Darlehen und Bank mit Fragezeichen"},
    q: "Die Abbildung zeigt den Geschäftsfall «Rückzahlung Darlehen CHF 20'000 per Bank». Welche Aussage stimmt?",
    options: [
      {v: "A", t: "Darlehen: 20'000 im Haben (Zunahme Passivkonto). Bank: 20'000 im Soll (Zunahme Aktivkonto)."},
      {v: "B", t: "Darlehen: 20'000 im Soll (Zunahme). Bank: 20'000 im Haben (Zunahme)."},
      {v: "C", t: "Darlehen: 20'000 im Soll (Abnahme Passivkonto). Bank: 20'000 im Haben (Abnahme Aktivkonto)."},
      {v: "D", t: "Darlehen: 20'000 im Haben (Abnahme). Bank: 20'000 im Soll (Abnahme)."}
    ],
    correct: "C",
    explain: "Darlehen ist ein Passivkonto (cyan, AB rechts). Abnahmen bei Passivkonten stehen im Soll (links). Bank ist ein Aktivkonto (gelb, AB links). Abnahmen bei Aktivkonten stehen im Haben (rechts). Bilanzverkürzung."
  },
  {
    id: "k42", topic: "kontentypen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_04.svg", alt: "T-Konten Darlehen und Bank mit Fragezeichen"},
    q: "Betrachte die T-Konten in der Abbildung. Nach der Rückzahlung von CHF 20'000 beträgt der Saldo des Kontos Darlehen CHF {0} und der Saldo des Kontos Bank CHF {1}.",
    blanks: [
      {answer: "80000", alts: ["80'000", "80 000"]},
      {answer: "55000", alts: ["55'000", "55 000"]}
    ],
    explain: "Darlehen: AB 100'000 (Haben) – 20'000 (Soll) = Saldo 80'000. Bank: AB 75'000 (Soll) – 20'000 (Haben) = Saldo 55'000."
  },

  // ============================================================
  // TOPIC: buchungssatz – Buchungssätze & Bilanzkonten
  // ============================================================

  {
    id: "s01", topic: "buchungssatz", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Wie lautet die Grundstruktur eines Buchungssatzes?",
    options: [
      {v: "A", t: "Aufwand an Ertrag"},
      {v: "B", t: "Haben an Soll"},
      {v: "C", t: "Aktiven an Passiven"},
      {v: "D", t: "Soll an Haben"}
    ],
    correct: "D",
    explain: "Ein Buchungssatz gibt an, welches Konto im Soll (links) und welches im Haben (rechts) belastet wird. Die Struktur ist immer: Soll an Haben (z.B. Kasse an Eigenkapital)."
  },
  {
    id: "s02", topic: "buchungssatz", type: "fill", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_buchungsregeln_01.svg", alt: "Übersicht der Kontentypen mit Buchungsseiten"},
    q: "Bei einem Aktivkonto stehen Zunahmen auf der {0}-Seite und Abnahmen auf der {1}-Seite.",
    blanks: [
      {answer: "Soll", alts: ["linken", "Sollseite"]},
      {answer: "Haben", alts: ["rechten", "Habenseite"]}
    ],
    explain: "Aktivkonten folgen der Bilanzlogik: Der Anfangsbestand und Zunahmen stehen links (Soll), Abnahmen und der Saldo stehen rechts (Haben)."
  },
  {
    id: "s03", topic: "buchungssatz", type: "fill", diff: 1, tax: "K2",
 reviewed:false,
    q: "Bei einem Passivkonto stehen Zunahmen auf der {0}-Seite und Abnahmen auf der {1}-Seite.",
    blanks: [
      {answer: "Haben", alts: ["rechten", "Habenseite"]},
      {answer: "Soll", alts: ["linken", "Sollseite"]}
    ],
    explain: "Passivkonten spiegeln die rechte Bilanzseite: Der Anfangsbestand und Zunahmen stehen rechts (Haben), Abnahmen und der Saldo stehen links (Soll)."
  },
  {
    id: "s04", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Ein Kunde bezahlt eine offene Rechnung von CHF 5'000 per Banküberweisung. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Debitoren an Bank"},
      {v: "B", t: "Bank an Debitoren"},
      {v: "C", t: "Kasse an Debitoren"},
      {v: "D", t: "Bank an Kreditoren"}
    ],
    correct: "B",
    explain: "Der Kunde zahlt: Das Bankkonto nimmt zu (Aktivkonto → Soll) und die Forderung gegenüber dem Kunden (Debitoren) nimmt ab (Aktivkonto → Haben). Buchungssatz: Bank an Debitoren CHF 5'000."
  },
  {
    id: "s05", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen nimmt ein langfristiges Darlehen bei der Bank auf. CHF 100'000 werden dem Bankkonto gutgeschrieben. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Darlehen 100'000"},
      {v: "B", t: "Bank an Eigenkapital 100'000"},
      {v: "C", t: "Eigenkapital an Bank 100'000"},
      {v: "D", t: "Darlehen an Bank 100'000"}
    ],
    correct: "A",
    explain: "Die Bank (Aktivkonto) nimmt zu → Soll. Das Darlehen (Passivkonto/langfristiges Fremdkapital) nimmt ebenfalls zu → Haben. Buchungssatz: Bank an Darlehen 100'000."
  },
  {
    id: "s06", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen kauft neue Büromöbel für CHF 8'000. Die Rechnung wird noch nicht bezahlt. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Mobilien an Bank 8'000"},
      {v: "B", t: "Mobilien an Kreditoren 8'000"},
      {v: "C", t: "Mobilien an Kasse 8'000"},
      {v: "D", t: "Kreditoren an Mobilien 8'000"}
    ],
    correct: "B",
    explain: "Die Mobilien (Aktivkonto) nehmen zu → Soll. Die Kreditoren (Passivkonto, Verbindlichkeit gegenüber Lieferant) nehmen zu → Haben. Buchungssatz: Mobilien an Kreditoren 8'000."
  },
  {
    id: "s07", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bezahlt eine Lieferantenrechnung von CHF 3'000 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Aufwand an Bank 3'000"},
      {v: "B", t: "Kreditoren an Kasse 3'000"},
      {v: "C", t: "Bank an Kreditoren 3'000"},
      {v: "D", t: "Kreditoren an Bank 3'000"}
    ],
    correct: "D",
    explain: "Die Kreditoren (Passivkonto) nehmen ab → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Buchungssatz: Kreditoren an Bank 3'000."
  },
  {
    id: "s08", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen kauft einen Lieferwagen für CHF 45'000 und bezahlt bar. Buchungssatz: {0} an {1} 45'000.",
    blanks: [
      {answer: "Fahrzeuge", alts: ["Fahrzeug", "Fahrzeugkonto"]},
      {answer: "Kasse", alts: ["Kassa"]}
    ],
    explain: "Der Lieferwagen (Aktivkonto Fahrzeuge) nimmt zu → Soll. Die Kasse (Aktivkonto) nimmt ab → Haben. Es handelt sich um einen Aktivtausch: Die Bilanzsumme verändert sich nicht."
  },
  {
    id: "s09", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen zahlt CHF 50'000 der Hypothekarschuld per Bank zurück. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Eigenkapital an Bank 50'000"},
      {v: "B", t: "Bank an Hypothek 50'000"},
      {v: "C", t: "Hypothek an Eigenkapital 50'000"},
      {v: "D", t: "Hypothek an Bank 50'000"}
    ],
    correct: "D",
    explain: "Die Hypothek (Passivkonto) nimmt ab → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Buchungssatz: Hypothek an Bank 50'000. Aktiven und Passiven nehmen gleichermassen ab (Bilanzverkürzung)."
  },
  {
    id: "s10", topic: "buchungssatz", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Geschäftsfälle bewirken einen Aktivtausch (die Bilanzsumme bleibt gleich)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Bareinzahlung auf das Bankkonto"},
      {v: "B", t: "Kauf von Mobilien auf Rechnung"},
      {v: "C", t: "Kunde bezahlt offene Rechnung per Bank"},
      {v: "D", t: "Aufnahme eines Darlehens, Gutschrift auf Bankkonto"}
    ],
    correct: ["A", "C"],
    explain: "Aktivtausch: Nur Aktivkonten betroffen, ein Konto nimmt zu, das andere ab. A) Kasse nimmt ab, Bank nimmt zu. C) Debitoren nehmen ab, Bank nimmt zu. B) ist eine Bilanzverlängerung (Aktiven + Passiven steigen), D) ebenfalls."
  },
  {
    id: "s11", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Wie lautet der Abschlussbuchungssatz für ein Aktivkonto (z.B. Kasse)?",
    options: [
      {v: "A", t: "Erfolgsrechnung an Kasse"},
      {v: "B", t: "Schlussbilanz an Kasse"},
      {v: "C", t: "Kasse an Schlussbilanz"},
      {v: "D", t: "Kasse an Eröffnungsbilanz"}
    ],
    correct: "B",
    explain: "Aktivkonten werden abgeschlossen mit: Schlussbilanz an Aktivkonto. Der Saldo des Aktivkontos wird auf die Habenseite geschrieben und in die Schlussbilanz übertragen."
  },
  {
    id: "s12", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Wie lautet der Eröffnungsbuchungssatz für ein Aktivkonto (z.B. Bank)?",
    options: [
      {v: "A", t: "Bank an Eröffnungsbilanz"},
      {v: "B", t: "Bank an Schlussbilanz"},
      {v: "C", t: "Eröffnungsbilanz an Bank"},
      {v: "D", t: "Erfolgsrechnung an Bank"}
    ],
    correct: "A",
    explain: "Aktivkonten werden eröffnet mit: Aktivkonto an Eröffnungsbilanz. Der Anfangsbestand wird auf die Sollseite des Aktivkontos gebucht."
  },
  {
    id: "s13", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Abschlussbuchung für ein Passivkonto (z.B. Kreditoren) lautet: {0} an {1}.",
    blanks: [
      {answer: "Kreditoren", alts: ["Passivkonto"]},
      {answer: "Schlussbilanz", alts: ["SB", "Schlussbilanz"]}
    ],
    explain: "Passivkonten werden abgeschlossen mit: Passivkonto an Schlussbilanz. Der Saldo wird auf die Sollseite geschrieben und in die Schlussbilanz (Habenseite) übertragen."
  },
  {
    id: "s14", topic: "buchungssatz", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Konto Bank hat folgende Bewegungen: Anfangsbestand CHF 30'000, Zugänge (Soll) CHF 85'000, Abgänge (Haben) CHF 72'000. Berechne den Saldo (Endbestand).",
    rows: [
      {label: "Saldo Konto Bank", answer: 43000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Bank ist ein Aktivkonto. Saldo = Soll-Total – Haben-Total = (30'000 + 85'000) – 72'000 = 115'000 – 72'000 = 43'000 CHF."
  },
  {
    id: "s15", topic: "buchungssatz", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Lieferant gewährt ein Darlehen von CHF 5'000, das mit der offenen Lieferantenrechnung verrechnet wird (Schuldenumwandlung). Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Darlehen 5'000"},
      {v: "B", t: "Darlehen an Kreditoren 5'000"},
      {v: "C", t: "Kreditoren an Bank 5'000"},
      {v: "D", t: "Kreditoren an Darlehen 5'000"}
    ],
    correct: "D",
    explain: "Die kurzfristige Schuld (Kreditoren) nimmt ab → Soll. Dafür entsteht eine langfristige Schuld (Darlehen) → Haben. Es handelt sich um einen Passivtausch: Kreditoren an Darlehen 5'000. Die Bilanzsumme bleibt gleich."
  },
  {
    id: "s16", topic: "buchungssatz", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Geschäftsfall bewirkt gleichzeitig eine Zunahme der Aktiven und eine Zunahme der Passiven. Welcher Bilanzeffekt liegt vor?",
    options: [
      {v: "A", t: "Bilanzverkürzung"},
      {v: "B", t: "Passivtausch"},
      {v: "C", t: "Bilanzverlängerung"},
      {v: "D", t: "Aktivtausch"}
    ],
    correct: "C",
    explain: "Wenn sowohl Aktiven als auch Passiven zunehmen, spricht man von einer Bilanzverlängerung: Die Bilanzsumme steigt. Beispiel: Kauf von Mobilien auf Rechnung (Mobilien ↑, Kreditoren ↑)."
  },
  {
    id: "s17", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Der Eigentümer legt CHF 20'000 aus seinem Privatvermögen bar in die Unternehmung ein. Buchungssatz: {0} an {1} 20'000.",
    blanks: [
      {answer: "Kasse", alts: ["Kassa"]},
      {answer: "Eigenkapital", alts: ["EK"]}
    ],
    explain: "Die Kasse (Aktivkonto) nimmt zu → Soll. Das Eigenkapital (Passivkonto) nimmt zu → Haben. Es handelt sich um eine Bilanzverlängerung."
  },
  {
    id: "s18", topic: "buchungssatz", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Die abgekürzte Eröffnungsbuchung für alle Konten lautet:",
    options: [
      {v: "A", t: "Aktiven an Passiven"},
      {v: "B", t: "Passiven an Aktiven"},
      {v: "C", t: "Eröffnungsbilanz an Schlussbilanz"},
      {v: "D", t: "Schlussbilanz an Eröffnungsbilanz"}
    ],
    correct: "A",
    explain: "Die abgekürzte Eröffnungsbuchung fasst alle Eröffnungsbuchungen zusammen: Aktiven an Passiven. Alle Aktivkonten werden im Soll eröffnet, alle Passivkonten im Haben. Die abgekürzte Abschlussbuchung lautet umgekehrt: Passiven an Aktiven."
  },
  {
    id: "s19", topic: "buchungssatz", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Das Konto Kreditoren zeigt: Anfangsbestand CHF 18'000 (Haben), Zahlungen an Lieferanten CHF 45'000 (Soll), neue Rechnungen CHF 52'000 (Haben). Berechne den Saldo.",
    rows: [
      {label: "Saldo Konto Kreditoren", answer: 25000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Kreditoren ist ein Passivkonto. Soll: 45'000. Haben: 18'000 + 52'000 = 70'000. Saldo (Haben-Überschuss): 70'000 – 45'000 = 25'000 CHF."
  },

  // --- Neue Buchungssatz-Fragen ---
  {
    id: "s20", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen hebt CHF 2'000 bar von der Bank ab. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Kasse 2'000"},
      {v: "B", t: "Aufwand an Bank 2'000"},
      {v: "C", t: "Kasse an Bank 2'000"},
      {v: "D", t: "Kasse an Eigenkapital 2'000"}
    ],
    correct: "C",
    explain: "Die Kasse (Aktivkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Buchungssatz: Kasse an Bank 2'000. Aktivtausch."
  },
  {
    id: "s21", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen zahlt CHF 1'500 aus der Kasse auf das Bankkonto ein. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Eigenkapital 1'500"},
      {v: "B", t: "Kasse an Bank 1'500"},
      {v: "C", t: "Bank an Kasse 1'500"},
      {v: "D", t: "Kreditoren an Bank 1'500"}
    ],
    correct: "C",
    explain: "Die Bank (Aktivkonto) nimmt zu → Soll. Die Kasse (Aktivkonto) nimmt ab → Haben. Buchungssatz: Bank an Kasse 1'500. Aktivtausch."
  },
  {
    id: "s22", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bezahlt die Stromrechnung von CHF 800 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Energieaufwand an Bank 800"},
      {v: "B", t: "Energieaufwand an Kreditoren 800"},
      {v: "C", t: "Bank an Energieaufwand 800"},
      {v: "D", t: "Kreditoren an Bank 800"}
    ],
    correct: "A",
    explain: "Der Energieaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Erfolgswirksam: Gewinn sinkt."
  },
  {
    id: "s23", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen erhält eine Zinsgutschrift von CHF 500 auf das Bankkonto. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Finanzertrag 500"},
      {v: "B", t: "Finanzertrag an Bank 500"},
      {v: "C", t: "Finanzaufwand an Bank 500"},
      {v: "D", t: "Bank an Finanzaufwand 500"}
    ],
    correct: "A",
    explain: "Die Bank (Aktivkonto) nimmt zu → Soll. Der Finanzertrag (Ertragskonto) nimmt zu → Haben. Erfolgswirksam: Gewinn steigt."
  },
  {
    id: "s24", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bezahlt die Büromiete von CHF 4'500 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Mietaufwand an Bank 4'500"},
      {v: "B", t: "Mietaufwand an Kreditoren 4'500"},
      {v: "C", t: "Bank an Mietaufwand 4'500"},
      {v: "D", t: "Raumaufwand an Eigenkapital 4'500"}
    ],
    correct: "A",
    explain: "Der Mietaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s25", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen erhält eine Lieferantenrechnung für Werbematerial über CHF 3'200. Buchungssatz: {0} an {1} 3'200.",
    blanks: [
      {answer: "Werbeaufwand", alts: ["Marketingaufwand", "Übriger Aufwand"]},
      {answer: "Kreditoren", alts: ["Verbindlichkeiten"]}
    ],
    explain: "Der Werbeaufwand (Aufwandkonto) nimmt zu → Soll. Die Kreditoren (Passivkonto) nehmen zu → Haben. Die Rechnung ist noch nicht bezahlt."
  },
  {
    id: "s26", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen überweist die Sozialversicherungsbeiträge von CHF 5'600 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Sozialversicherungsaufwand 5'600"},
      {v: "B", t: "Sozialversicherungsaufwand an Bank 5'600"},
      {v: "C", t: "Sozialversicherungsaufwand an Kreditoren 5'600"},
      {v: "D", t: "Lohnaufwand an Bank 5'600"}
    ],
    correct: "B",
    explain: "Der Sozialversicherungsaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s27", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Kunde bezahlt eine offene Rechnung von CHF 7'000 bar. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Kasse an Warenverkauf 7'000"},
      {v: "B", t: "Bank an Debitoren 7'000"},
      {v: "C", t: "Debitoren an Kasse 7'000"},
      {v: "D", t: "Kasse an Debitoren 7'000"}
    ],
    correct: "D",
    explain: "Die Kasse (Aktivkonto) nimmt zu → Soll. Die Debitoren (Aktivkonto) nehmen ab → Haben. Aktivtausch, erfolgsunwirksam."
  },
  {
    id: "s28", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bezahlt die Telefonrechnung von CHF 350 bar. Buchungssatz: {0} an {1} 350.",
    blanks: [
      {answer: "Verwaltungsaufwand", alts: ["Telefonaufwand", "Übriger Aufwand"]},
      {answer: "Kasse", alts: ["Kassa"]}
    ],
    explain: "Der Verwaltungsaufwand (Aufwandkonto) nimmt zu → Soll. Die Kasse (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s29", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen erhält Mieteinnahmen von CHF 2'400 auf das Bankkonto. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Mietaufwand 2'400"},
      {v: "B", t: "Mietertrag an Bank 2'400"},
      {v: "C", t: "Bank an Mietertrag 2'400"},
      {v: "D", t: "Mietaufwand an Bank 2'400"}
    ],
    correct: "C",
    explain: "Die Bank (Aktivkonto) nimmt zu → Soll. Der Mietertrag (Ertragskonto) nimmt zu → Haben."
  },
  {
    id: "s30", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bezahlt Bankzinsen von CHF 1'200. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Finanzertrag an Bank 1'200"},
      {v: "B", t: "Finanzaufwand an Bank 1'200"},
      {v: "C", t: "Bank an Finanzaufwand 1'200"},
      {v: "D", t: "Finanzaufwand an Kreditoren 1'200"}
    ],
    correct: "B",
    explain: "Der Finanzaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s31", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen kauft einen Computer für CHF 2'500 per Bank. Buchungssatz: {0} an {1} 2'500.",
    blanks: [
      {answer: "Mobilien", alts: ["Informatik", "EDV"]},
      {answer: "Bank", alts: ["Bankkonto"]}
    ],
    explain: "Die Mobilien (Aktivkonto) nehmen zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Aktivtausch."
  },
  {
    id: "s32", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen nimmt einen Bankkredit von CHF 50'000 auf. Der Betrag wird dem Bankkonto gutgeschrieben. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bankkredit an Bank 50'000"},
      {v: "B", t: "Eigenkapital an Bank 50'000"},
      {v: "C", t: "Bank an Bankkredit 50'000"},
      {v: "D", t: "Bank an Eigenkapital 50'000"}
    ],
    correct: "C",
    explain: "Die Bank (Aktivkonto) nimmt zu → Soll. Der Bankkredit (Passivkonto) nimmt zu → Haben. Bilanzverlängerung."
  },
  {
    id: "s33", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen stellt einem Kunden für Beratungsleistungen CHF 6'000 in Rechnung. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Debitoren an Bank 6'000"},
      {v: "B", t: "Bank an Honorarertrag 6'000"},
      {v: "C", t: "Debitoren an Honorarertrag 6'000"},
      {v: "D", t: "Honorarertrag an Debitoren 6'000"}
    ],
    correct: "C",
    explain: "Debitoren (Aktivkonto) nehmen zu → Soll. Honorarertrag (Ertragskonto) nimmt zu → Haben."
  },
  {
    id: "s34", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen zahlt die Versicherungsprämie von CHF 6'000 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Kreditoren an Bank 6'000"},
      {v: "B", t: "Bank an Versicherungsaufwand 6'000"},
      {v: "C", t: "Versicherungsaufwand an Kreditoren 6'000"},
      {v: "D", t: "Versicherungsaufwand an Bank 6'000"}
    ],
    correct: "D",
    explain: "Der Versicherungsaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s35", topic: "buchungssatz", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen verkauft Dienstleistungen für CHF 9'500. Der Kunde bezahlt sofort per Bank. Buchungssatz: {0} an {1} 9'500.",
    blanks: [
      {answer: "Bank", alts: ["Bankkonto"]},
      {answer: "Dienstleistungsertrag", alts: ["Honorarertrag", "Ertrag"]}
    ],
    explain: "Bank (Aktivkonto) nimmt zu → Soll. Dienstleistungsertrag (Ertragskonto) nimmt zu → Haben."
  },
  {
    id: "s36", topic: "buchungssatz", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen wandelt eine kurzfristige Bankschuld von CHF 30'000 in ein langfristiges Darlehen um. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bankkredit an Darlehen 30'000"},
      {v: "B", t: "Bank an Darlehen 30'000"},
      {v: "C", t: "Bankkredit an Bank 30'000"},
      {v: "D", t: "Darlehen an Bankkredit 30'000"}
    ],
    correct: "A",
    explain: "Der kurzfristige Bankkredit (Passivkonto) nimmt ab → Soll. Das langfristige Darlehen (Passivkonto) nimmt zu → Haben. Passivtausch."
  },
  {
    id: "s37", topic: "buchungssatz", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Geschäftsfälle bewirken eine Bilanzverkürzung? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Rückzahlung eines Darlehens per Bank"},
      {v: "B", t: "Bezahlung der Kreditoren per Bank"},
      {v: "C", t: "Kauf von Mobilien auf Rechnung"},
      {v: "D", t: "Barbezug vom Bankkonto"}
    ],
    correct: ["A", "B"],
    explain: "Bilanzverkürzung: Aktiven und Passiven nehmen gleichzeitig ab. A) Bank ↓ (Aktiv), Darlehen ↓ (Passiv). B) Bank ↓ (Aktiv), Kreditoren ↓ (Passiv). C) Bilanzverlängerung. D) Aktivtausch."
  },
  {
    id: "s38", topic: "buchungssatz", type: "fill", diff: 1, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen kauft Briefmarken (Büromaterial) für CHF 150 bar. Buchungssatz: {0} an {1} 150.",
    blanks: [
      {answer: "Verwaltungsaufwand", alts: ["Büromaterialaufwand", "Übriger Aufwand"]},
      {answer: "Kasse", alts: ["Kassa"]}
    ],
    explain: "Der Verwaltungsaufwand (Aufwandkonto) nimmt zu → Soll. Die Kasse (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "s39", topic: "buchungssatz", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen erhält eine Steuerrechnung über CHF 12'000. Die Zahlung erfolgt erst später. Wie lautet der Buchungssatz beim Rechnungseingang?",
    options: [
      {v: "A", t: "Steueraufwand an Bank 12'000"},
      {v: "B", t: "Kreditoren an Steueraufwand 12'000"},
      {v: "C", t: "Steueraufwand an Kreditoren 12'000"},
      {v: "D", t: "Bank an Steueraufwand 12'000"}
    ],
    correct: "C",
    explain: "Der Steueraufwand (Aufwandkonto) nimmt zu → Soll. Die Kreditoren (Passivkonto) nehmen zu → Haben (offene Rechnung). Bei späterer Bezahlung: Kreditoren an Bank."
  },
  {
    id: "s40", topic: "buchungssatz", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Bestimme den Endbestand (Saldo) des Kontos Debitoren: Anfangsbestand CHF 42'000, neue Rechnungen an Kunden CHF 180'000, Zahlungseingänge CHF 165'000, Debitorenverlust CHF 3'000.",
    rows: [
      {label: "Saldo Konto Debitoren", answer: 54000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Debitoren ist ein Aktivkonto. Soll: 42'000 (AB) + 180'000 (neue Rechnungen) = 222'000. Haben: 165'000 (Zahlungen) + 3'000 (Verlust) = 168'000. Saldo: 222'000 – 168'000 = 54'000 CHF."
  },
  {
    id: "s41", topic: "buchungssatz", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche der folgenden Geschäftsfälle sind erfolgswirksam? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Wareneinkauf auf Rechnung"},
      {v: "B", t: "Bareinzahlung auf das Bankkonto"},
      {v: "C", t: "Zinsgutschrift der Bank"},
      {v: "D", t: "Kauf von Mobilien per Bank"}
    ],
    correct: ["A", "C"],
    explain: "A) Wareneinkauf (Aufwandkonto) → erfolgswirksam. C) Finanzertrag (Ertragskonto) → erfolgswirksam. B) Aktivtausch → erfolgsunwirksam. D) Aktivtausch → erfolgsunwirksam."
  },
  {
    id: "s42", topic: "buchungssatz", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welchen Bilanzeffekt hat der Geschäftsfall «Lohnzahlung per Bank»?",
    options: [
      {v: "A", t: "Aktivtausch"},
      {v: "B", t: "Bilanzverkürzung (Aktiven und Passiven sinken)"},
      {v: "C", t: "Keiner der vier klassischen Bilanzeffekte – es ist eine erfolgswirksame Buchung, die nur die Aktivseite reduziert"},
      {v: "D", t: "Bilanzverlängerung"}
    ],
    correct: "C",
    explain: "Lohnaufwand (Aufwandkonto, Soll) an Bank (Aktivkonto, Haben). Die Bank sinkt, aber kein Passivkonto ist direkt betroffen. Stattdessen sinkt der Gewinn (und damit letztlich das Eigenkapital). Daher kein klassischer Bilanzeffekt der vier Grundtypen."
  },
  {
    id: "s43", topic: "buchungssatz", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_01.svg", alt: "T-Konten Fahrzeuge und Bank – Kauf Fahrzeug per Bank"},
    q: "Schau dir die T-Konten in der Abbildung an. Ein Fahrzeug wird für CHF 30'000 per Bank gekauft. Wo wird der Betrag eingetragen?",
    options: [
      {v: "A", t: "Fahrzeuge: 30'000 im Soll (Zunahme). Bank: 30'000 im Haben (Abnahme)."},
      {v: "B", t: "Fahrzeuge: 30'000 im Haben (Abnahme). Bank: 30'000 im Soll (Zunahme)."},
      {v: "C", t: "Fahrzeuge: 30'000 im Haben (Zunahme). Bank: 30'000 im Soll (Abnahme)."},
      {v: "D", t: "Fahrzeuge: 30'000 im Soll (Abnahme). Bank: 30'000 im Haben (Zunahme)."}
    ],
    correct: "A",
    explain: "Beide Konten sind Aktivkonten (gelbe Überschrift). Fahrzeuge nimmt zu → Soll (links). Bank nimmt ab → Haben (rechts). Aktivtausch."
  },
  {
    id: "s44", topic: "buchungssatz", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_tkonto_geschaeftsfall_01.svg", alt: "T-Konten Fahrzeuge und Bank – Kauf Fahrzeug per Bank"},
    q: "Berechne die neuen Salden der beiden Konten nach dem Kauf des Fahrzeugs für CHF 30'000.",
    rows: [
      {label: "Saldo Fahrzeuge", answer: 80000, tolerance: 0, unit: "CHF"},
      {label: "Saldo Bank", answer: 50000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Fahrzeuge: AB 50'000 + 30'000 = 80'000 CHF. Bank: AB 80'000 – 30'000 = 50'000 CHF."
  },
  {
    id: "s45", topic: "buchungssatz", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_saldo_berechnen_01.svg", alt: "T-Konten Bank und Kreditoren mit mehreren Buchungen – Saldo berechnen"},
    q: "Berechne die Schlussbestände (Saldi) der beiden Konten in der Abbildung.",
    rows: [
      {label: "Saldo Bank", answer: 43000, tolerance: 0, unit: "CHF"},
      {label: "Saldo Kreditoren", answer: 30000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Bank (Aktivkonto): Soll = 45'000 + 15'000 + 8'000 + 22'000 = 90'000. Haben = 30'000 + 12'000 + 5'000 = 47'000. Saldo = 90'000 – 47'000 = 43'000. Kreditoren (Passivkonto): Haben = 32'000 + 14'000 + 9'000 = 55'000. Soll = 18'000 + 7'000 = 25'000. Saldo = 55'000 – 25'000 = 30'000."
  },

  // ============================================================
  // TOPIC: erfolgsrechnung – Erfolgsrechnung & Erfolgskonten
  // ============================================================

  {
    id: "e01", topic: "erfolgsrechnung", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist Aufwand?",
    options: [
      {v: "A", t: "Der Werteverzehr (Kosten der Inputs) im Produktionsprozess"},
      {v: "B", t: "Die Wertvermehrung durch den Produktionsprozess"},
      {v: "C", t: "Die Einnahmen aus Verkäufen"},
      {v: "D", t: "Der Bestand an flüssigen Mitteln"}
    ],
    correct: "A",
    explain: "Aufwand (Aufwände) bezeichnet den Werteverzehr im Produktionsprozess, also die Kosten der eingesetzten Produktionsfaktoren (z.B. Löhne, Material, Miete)."
  },
  {
    id: "e02", topic: "erfolgsrechnung", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Wenn die Erträge grösser sind als die Aufwände, erzielt das Unternehmen einen {0}. Wenn die Aufwände grösser sind, entsteht ein {1}.",
    blanks: [
      {answer: "Gewinn", alts: ["Jahresgewinn", "Unternehmensgewinn"]},
      {answer: "Verlust", alts: ["Jahresverlust"]}
    ],
    explain: "Erfolg = Erträge – Aufwände. Ist das Ergebnis positiv, liegt ein Gewinn vor; ist es negativ, ein Verlust."
  },
  {
    id: "e03", topic: "erfolgsrechnung", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "In welcher Hinsicht unterscheiden sich Erfolgskonten von Bilanzkonten?",
    options: [
      {v: "A", t: "Erfolgskonten haben keinen Anfangsbestand – sie beginnen jedes Jahr bei null"},
      {v: "B", t: "Erfolgskonten haben immer einen Anfangsbestand aus dem Vorjahr"},
      {v: "C", t: "Erfolgskonten gehören nicht zum System der doppelten Buchhaltung"},
      {v: "D", t: "Erfolgskonten werden nie abgeschlossen"}
    ],
    correct: "A",
    explain: "Bilanzkonten sind Bestandeskonten mit Anfangsbestand (Übertrag aus Vorjahr). Erfolgskonten (Aufwand/Ertrag) sind Stromgrössen und starten jedes Geschäftsjahr bei null."
  },
  {
    id: "e04", topic: "erfolgsrechnung", type: "fill", diff: 1, tax: "K2",
 reviewed:false,
    q: "Aufwandkonten nehmen auf der {0}-Seite zu und werden am Jahresende auf der {1}-Seite saldiert.",
    blanks: [
      {answer: "Soll", alts: ["linken"]},
      {answer: "Haben", alts: ["rechten"]}
    ],
    explain: "Aufwandkonten verhalten sich wie Aktivkonten: Zunahmen im Soll (links), Saldo und Abnahmen im Haben (rechts)."
  },
  {
    id: "e05", topic: "erfolgsrechnung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen zahlt Löhne von CHF 12'000 per Bank. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Personalaufwand an Kreditoren 12'000"},
      {v: "B", t: "Lohnaufwand an Kasse 12'000"},
      {v: "C", t: "Lohnaufwand an Bank 12'000"},
      {v: "D", t: "Bank an Lohnaufwand 12'000"}
    ],
    correct: "C",
    explain: "Der Lohnaufwand (Aufwandkonto) nimmt zu → Soll. Die Bank (Aktivkonto) nimmt ab → Haben. Buchungssatz: Lohnaufwand an Bank 12'000. Dieser Geschäftsfall ist erfolgswirksam (der Gewinn sinkt)."
  },
  {
    id: "e06", topic: "erfolgsrechnung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen stellt einem Kunden eine Rechnung über CHF 8'000 für erbrachte Dienstleistungen. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Honorarertrag 8'000"},
      {v: "B", t: "Debitoren an Kreditoren 8'000"},
      {v: "C", t: "Debitoren an Honorarertrag 8'000"},
      {v: "D", t: "Honorarertrag an Debitoren 8'000"}
    ],
    correct: "C",
    explain: "Die Forderung (Debitoren, Aktivkonto) nimmt zu → Soll. Der Ertrag (Honorarertrag, Ertragskonto) nimmt zu → Haben. Buchungssatz: Debitoren an Honorarertrag 8'000. Dieser Geschäftsfall ist erfolgswirksam (der Gewinn steigt)."
  },
  {
    id: "e07", topic: "erfolgsrechnung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welcher der folgenden Geschäftsfälle ist erfolgsunwirksam (beeinflusst den Jahresgewinn NICHT)?",
    options: [
      {v: "A", t: "Kunde bezahlt offene Rechnung per Bank"},
      {v: "B", t: "Zinsgutschrift auf dem Bankkonto"},
      {v: "C", t: "Lohnzahlung per Bank"},
      {v: "D", t: "Zahlung von Miete per Bank"}
    ],
    correct: "A",
    explain: "Wenn ein Kunde per Bank bezahlt, werden nur Bilanzkonten berührt (Bank nimmt zu, Debitoren nehmen ab). Kein Erfolgskonto ist betroffen, daher ist der Vorgang erfolgsunwirksam. Die anderen Vorgänge betreffen je ein Erfolgskonto."
  },
  {
    id: "e08", topic: "erfolgsrechnung", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Buchungssätze sind erfolgswirksam? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Lohnaufwand an Bank"},
      {v: "B", t: "Bank an Debitoren"},
      {v: "C", t: "Debitoren an Warenverkauf"},
      {v: "D", t: "Mobilien an Kreditoren"}
    ],
    correct: ["A", "C"],
    explain: "A) Lohnaufwand (Aufwandkonto) → erfolgswirksam (Gewinn sinkt). C) Warenverkauf (Ertragskonto) → erfolgswirksam (Gewinn steigt). B) und D) betreffen nur Bilanzkonten → erfolgsunwirksam."
  },
  {
    id: "e09", topic: "erfolgsrechnung", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Abschlussbuchung für ein Aufwandkonto (z.B. Lohnaufwand) lautet: {0} an {1}.",
    blanks: [
      {answer: "Erfolgsrechnung", alts: ["ER"]},
      {answer: "Lohnaufwand", alts: ["Aufwandkonto"]}
    ],
    explain: "Aufwandkonten werden abgeschlossen mit: Erfolgsrechnung an Aufwandkonto. Der Saldo des Aufwandkontos wird in die Erfolgsrechnung (Sollseite) übertragen."
  },
  {
    id: "e10", topic: "erfolgsrechnung", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Abschlussbuchung für ein Ertragskonto (z.B. Warenverkauf) lautet: {0} an {1}.",
    blanks: [
      {answer: "Warenverkauf", alts: ["Ertragskonto"]},
      {answer: "Erfolgsrechnung", alts: ["ER"]}
    ],
    explain: "Ertragskonten werden abgeschlossen mit: Ertragskonto an Erfolgsrechnung. Der Saldo wird auf die Habenseite der Erfolgsrechnung übertragen."
  },
  {
    id: "e11", topic: "erfolgsrechnung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen schliesst das Jahr mit einem Gewinn von CHF 35'000 ab. Wie wird der Gewinn ins Eigenkapital verbucht?",
    options: [
      {v: "A", t: "Erfolgsrechnung an Eigenkapital 35'000"},
      {v: "B", t: "Eigenkapital an Gewinn 35'000"},
      {v: "C", t: "Gewinn an Eigenkapital 35'000"},
      {v: "D", t: "Eigenkapital an Erfolgsrechnung 35'000"}
    ],
    correct: "A",
    explain: "Der Jahresgewinn wird verbucht mit: Erfolgsrechnung an Eigenkapital. Die Erfolgsrechnung wird im Soll belastet (=abgeschlossen), das Eigenkapital nimmt im Haben zu."
  },
  {
    id: "e12", topic: "erfolgsrechnung", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen hat folgende Erfolgskonten: Warenverkauf CHF 350'000, Lohnaufwand CHF 120'000, Mietaufwand CHF 36'000, Abschreibungen CHF 15'000, Finanzaufwand CHF 8'000, Finanzertrag CHF 4'000. Berechne den Jahresgewinn.",
    rows: [
      {label: "Total Erträge", answer: 354000, tolerance: 0, unit: "CHF"},
      {label: "Total Aufwände", answer: 179000, tolerance: 0, unit: "CHF"},
      {label: "Jahresgewinn", answer: 175000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Erträge: 350'000 + 4'000 = 354'000. Aufwände: 120'000 + 36'000 + 15'000 + 8'000 = 179'000. Jahresgewinn = 354'000 – 179'000 = 175'000 CHF."
  },
  {
    id: "e13", topic: "erfolgsrechnung", type: "mc", diff: 3, tax: "K2",
 reviewed:false,
    q: "Was versteht man unter «neutralem Erfolg» in der zweistufigen Erfolgsrechnung?",
    options: [
      {v: "A", t: "Der Erfolg aus dem Kerngeschäft"},
      {v: "B", t: "Erträge und Aufwände, die betriebsfremd, ausserordentlich oder periodenfremd sind"},
      {v: "C", t: "Der Steueraufwand des Unternehmens"},
      {v: "D", t: "Der Erfolg, der weder Gewinn noch Verlust darstellt"}
    ],
    correct: "B",
    explain: "Neutraler Erfolg umfasst Aufwände und Erträge, die nicht zum eigentlichen Geschäftszweck gehören (betriebsfremd), einmalig/ausserordentlich oder periodenfremd sind. Beispiele: Gewinn aus Liegenschaftsverkauf, Steueraufwand."
  },
  {
    id: "e14", topic: "erfolgsrechnung", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Zweistufige Erfolgsrechnung: Warenverkauf CHF 395'000, Warenaufwand CHF 175'000, Lohnaufwand CHF 80'000, Sozialversicherungsaufwand CHF 15'000, Verwaltungsaufwand CHF 25'000, Abschreibungen CHF 15'000, Finanzaufwand CHF 10'000, Steueraufwand CHF 13'000, Gewinn aus Liegenschaftsverkauf CHF 20'000. Berechne Betriebsgewinn und Jahresgewinn.",
    rows: [
      {label: "Betriebsgewinn (1. Stufe)", answer: 75000, tolerance: 0, unit: "CHF"},
      {label: "Jahresgewinn (2. Stufe)", answer: 82000, tolerance: 0, unit: "CHF"}
    ],
    explain: "1. Stufe: Betriebserträge 395'000 – Betriebsaufwände (175'000 + 80'000 + 15'000 + 25'000 + 15'000 + 10'000) = 395'000 – 320'000 = 75'000 (Betriebsgewinn). 2. Stufe: Neutraler Erfolg = 20'000 – 13'000 = 7'000. Jahresgewinn = 75'000 + 7'000 = 82'000 CHF."
  },
  {
    id: "e15", topic: "erfolgsrechnung", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Ertragskonten nehmen auf der Habenseite (rechts) zu und auf der Sollseite (links) ab.",
    correct: true,
    explain: "Richtig. Ertragskonten verhalten sich spiegelbildlich zu Aufwandkonten: Zunahmen stehen im Haben (rechts), Abnahmen und der Saldo im Soll (links)."
  },
  {
    id: "e16", topic: "erfolgsrechnung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Miete von CHF 3'000 wird per Bank bezahlt. Gleichzeitig wird eine Gutschrift für überzahlte Miete von CHF 500 auf das Mietaufwandkonto gebucht. Welcher Netto-Aufwand wird in der Erfolgsrechnung ausgewiesen?",
    options: [
      {v: "A", t: "CHF 3'000"},
      {v: "B", t: "CHF 2'500"},
      {v: "C", t: "CHF 3'500"},
      {v: "D", t: "CHF 500"}
    ],
    correct: "B",
    explain: "Mietaufwand (Soll): CHF 3'000, Gutschrift (Haben): CHF 500. Saldo des Aufwandkontos: 3'000 – 500 = 2'500 CHF. Dieser Netto-Aufwand erscheint in der Erfolgsrechnung."
  },
  {
    id: "e17", topic: "erfolgsrechnung", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Ein Jahresverlust von CHF 10'000 wird ins Eigenkapital verbucht. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Eigenkapital an Bank 10'000"},
      {v: "B", t: "Verlust an Eigenkapital 10'000"},
      {v: "C", t: "Eigenkapital an Erfolgsrechnung 10'000"},
      {v: "D", t: "Erfolgsrechnung an Eigenkapital 10'000"}
    ],
    correct: "C",
    explain: "Bei einem Verlust nimmt das Eigenkapital ab. Buchungssatz: Eigenkapital an Erfolgsrechnung 10'000. Das Eigenkapital wird im Soll belastet (nimmt ab), die Erfolgsrechnung im Haben gutgeschrieben (abgeschlossen)."
  },

  // ============================================================
  // TOPIC: eigentuemer – Konten des Eigentümers
  // ============================================================

  {
    id: "p01", topic: "eigentuemer", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was zeigt das Eigenkapitalkonto?",
    options: [
      {v: "A", t: "Den Jahresgewinn des Unternehmens"},
      {v: "B", t: "Die kurzfristigen Schulden des Unternehmens"},
      {v: "C", t: "Den Kassenbestand des Unternehmens"},
      {v: "D", t: "Die Schuld des Unternehmens gegenüber dem Geschäftseigentümer"}
    ],
    correct: "D",
    explain: "Das Eigenkapital ist die rechnerische Schuld des Unternehmens gegenüber dem Geschäftseigentümer. Es zeigt, wie viel Kapital der Eigentümer dem Unternehmen zur Verfügung gestellt hat (inklusive einbehaltener Gewinne)."
  },
  {
    id: "p02", topic: "eigentuemer", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was ist das Privatkonto?",
    options: [
      {v: "A", t: "Ein Aufwandkonto für Geschäftsspesen"},
      {v: "B", t: "Das Bankkonto des Eigentümers"},
      {v: "C", t: "Ein Sparkonto des Unternehmens"},
      {v: "D", t: "Ein Unterkonto des Eigenkapitalkontos für private Bezüge und Einlagen des Eigentümers"}
    ],
    correct: "D",
    explain: "Das Privatkonto ist ein Unterkonto des Eigenkapitalkontos. Es erfasst laufende Privatbezüge (Entnahmen) und Privateinlagen des Eigentümers während des Geschäftsjahres."
  },
  {
    id: "p03", topic: "eigentuemer", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Der Eigentümer bezieht CHF 4'000 bar aus der Geschäftskasse für private Zwecke. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Kasse an Privat 4'000"},
      {v: "B", t: "Privat an Kasse 4'000"},
      {v: "C", t: "Lohnaufwand an Kasse 4'000"},
      {v: "D", t: "Eigenkapital an Kasse 4'000"}
    ],
    correct: "B",
    explain: "Der Privatbezug belastet das Privatkonto im Soll (wie ein Aktivkonto). Die Kasse nimmt ab → Haben. Buchungssatz: Privat an Kasse 4'000."
  },
  {
    id: "p04", topic: "eigentuemer", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Dem Eigentümer wird ein monatlicher Eigenlohn von CHF 6'000 gutgeschrieben. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bank an Eigenkapital 6'000"},
      {v: "B", t: "Eigenkapital an Privat 6'000"},
      {v: "C", t: "Privat an Bank 6'000"},
      {v: "D", t: "Lohnaufwand an Privat 6'000"}
    ],
    correct: "D",
    explain: "Der Eigenlohn ist ein Aufwand des Unternehmens. Buchungssatz: Lohnaufwand an Privat 6'000. Der Aufwand steigt (Soll), das Privatkonto wird im Haben gutgeschrieben (der Eigentümer hat etwas zugute)."
  },
  {
    id: "p05", topic: "eigentuemer", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am Jahresende zeigt das Privatkonto: Sollseite CHF 52'000 (Privatbezüge), Habenseite CHF 72'000 (Eigenlohn). Der Habensaldo beträgt CHF 20'000. Wie wird das Privatkonto abgeschlossen?",
    options: [
      {v: "A", t: "Erfolgsrechnung an Privat 20'000"},
      {v: "B", t: "Privat an Eigenkapital 20'000 (Überschuss wird dem EK gutgeschrieben)"},
      {v: "C", t: "Eigenkapital an Privat 20'000 (Überschuss wird vom EK abgezogen)"},
      {v: "D", t: "Privat an Erfolgsrechnung 20'000"}
    ],
    correct: "B",
    explain: "Der Habensaldo von CHF 20'000 bedeutet, dass der Eigentümer weniger bezogen hat als sein Eigenlohn. Der Überschuss kommt dem Eigenkapital zugute: Privat an Eigenkapital 20'000."
  },
  {
    id: "p06", topic: "eigentuemer", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Der Jahresgewinn wird direkt auf das Privatkonto verbucht.",
    correct: false,
    explain: "Falsch. Der Jahresgewinn wird auf das Eigenkapitalkonto verbucht (Erfolgsrechnung an Eigenkapital), nicht auf das Privatkonto. Das Privatkonto erfasst nur laufende Privatbezüge und -einlagen."
  },
  {
    id: "p07", topic: "eigentuemer", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Geschäft bezahlt die private Krankenkassenprämie des Eigentümers von CHF 400 per Bank. Buchungssatz: {0} an {1} 400.",
    blanks: [
      {answer: "Privat", alts: ["Privatkonto"]},
      {answer: "Bank", alts: ["Bankkonto"]}
    ],
    explain: "Private Ausgaben, die über das Geschäft laufen, werden über das Privatkonto gebucht: Privat an Bank 400. Das Privatkonto wird im Soll belastet (Privatbezug), die Bank nimmt im Haben ab."
  },
  {
    id: "p08", topic: "eigentuemer", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Eigenkapital am 1.1.: CHF 120'000. Während des Jahres: Privatbezüge CHF 60'000, Eigenlohn CHF 72'000, Jahresgewinn CHF 45'000. Berechne das Eigenkapital am 31.12.",
    rows: [
      {label: "Saldo Privatkonto (Haben-Überschuss)", answer: 12000, tolerance: 0, unit: "CHF"},
      {label: "Eigenkapital am 31.12.", answer: 177000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Privatkonto: Haben (Eigenlohn) 72'000 – Soll (Bezüge) 60'000 = Habensaldo 12'000 (kommt zum EK). EK am 31.12. = 120'000 + 12'000 (Privatsaldo) + 45'000 (Gewinn) = 177'000 CHF."
  },
  {
    id: "p09", topic: "eigentuemer", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Vorgänge werden über das Privatkonto gebucht? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Eigentümer bezahlt seine private Telefonrechnung über das Geschäftskonto"},
      {v: "B", t: "Das Unternehmen zahlt die Büromiete"},
      {v: "C", t: "Dem Eigentümer wird ein monatlicher Eigenlohn gutgeschrieben"},
      {v: "D", t: "Der Eigentümer entnimmt Waren für den Privatgebrauch"}
    ],
    correct: ["A", "C", "D"],
    explain: "Über das Privatkonto laufen: private Zahlungen über das Geschäft (A), Eigenlohn (C) und Warenentnahmen für privat (D). Die Büromiete (B) ist ein Geschäftsaufwand und wird über Raumaufwand gebucht."
  },
  {
    id: "p10", topic: "eigentuemer", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Am Jahresende zeigt das Privatkonto einen Sollsaldo von CHF 8'000. Was bedeutet das?",
    options: [
      {v: "A", t: "Das Unternehmen hat 8'000 Verlust gemacht"},
      {v: "B", t: "Der Eigentümer hat mehr bezogen als ihm gutgeschrieben wurde – das Eigenkapital wird um 8'000 reduziert"},
      {v: "C", t: "Der Eigentümer hat weniger bezogen als sein Eigenlohn – das Eigenkapital wird um 8'000 erhöht"},
      {v: "D", t: "Der Eigentümer schuldet dem Unternehmen 8'000"}
    ],
    correct: "B",
    explain: "Ein Sollsaldo auf dem Privatkonto bedeutet: Die Privatbezüge übersteigen die Gutschriften (Eigenlohn). Abschlussbuchung: Eigenkapital an Privat 8'000 – das Eigenkapital wird reduziert."
  },

  // ============================================================
  // TOPIC: warenkonten – Warenkonten & dreistufige Erfolgsrechnung
  // ============================================================

  {
    id: "w01", topic: "warenkonten", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was zeigt das Konto Wareneinkauf?",
    options: [
      {v: "A", t: "Den Einstandswert der eingekauften Waren"},
      {v: "B", t: "Den Gewinn aus dem Warenhandel"},
      {v: "C", t: "Den Verkaufserlös aus Warenverkäufen"},
      {v: "D", t: "Den Bestand an Waren im Lager"}
    ],
    correct: "A",
    explain: "Das Konto Wareneinkauf ist ein Aufwandkonto und zeigt den Einstandswert der eingekauften Waren (Einkaufspreis nach Abzug von Rabatten/Skonti und Zurechnung von Bezugsspesen)."
  },
  {
    id: "w02", topic: "warenkonten", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen kauft Waren für CHF 15'000 auf Rechnung. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Wareneinkauf an Kreditoren 15'000"},
      {v: "B", t: "Wareneinkauf an Bank 15'000"},
      {v: "C", t: "Kreditoren an Wareneinkauf 15'000"},
      {v: "D", t: "Warenvorrat an Kreditoren 15'000"}
    ],
    correct: "A",
    explain: "Der Wareneinkauf (Aufwandkonto) nimmt zu → Soll. Die Verbindlichkeit gegenüber dem Lieferanten (Kreditoren, Passivkonto) nimmt zu → Haben. Buchungssatz: Wareneinkauf an Kreditoren 15'000."
  },
  {
    id: "w03", topic: "warenkonten", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Der Lieferant gewährt einen Rabatt von CHF 1'500 auf die Warenlieferung. Wie wird der Rabatt verbucht?",
    options: [
      {v: "A", t: "Rabatt an Wareneinkauf 1'500"},
      {v: "B", t: "Wareneinkauf an Kreditoren 1'500"},
      {v: "C", t: "Kasse an Wareneinkauf 1'500"},
      {v: "D", t: "Kreditoren an Wareneinkauf 1'500"}
    ],
    correct: "D",
    explain: "Der Rabatt reduziert sowohl die Schuld (Kreditoren) als auch den Aufwand (Wareneinkauf). Kreditoren nimmt ab → Soll, Wareneinkauf nimmt ab → Haben. Buchungssatz: Kreditoren an Wareneinkauf 1'500."
  },
  {
    id: "w04", topic: "warenkonten", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Bezugsspesen (Fracht) von CHF 600 für eine Warenlieferung werden bar bezahlt. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Bezugsspesen an Kasse 600"},
      {v: "B", t: "Wareneinkauf an Kasse 600"},
      {v: "C", t: "Wareneinkauf an Kreditoren 600"},
      {v: "D", t: "Kasse an Wareneinkauf 600"}
    ],
    correct: "B",
    explain: "Bezugsspesen erhöhen den Einstandswert der Waren und werden direkt auf dem Konto Wareneinkauf verbucht: Wareneinkauf an Kasse 600."
  },
  {
    id: "w05", topic: "warenkonten", type: "mc", diff: 1, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen verkauft Waren für CHF 25'000 auf Rechnung. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Debitoren an Warenverkauf 25'000"},
      {v: "B", t: "Warenverkauf an Debitoren 25'000"},
      {v: "C", t: "Bank an Warenverkauf 25'000"},
      {v: "D", t: "Warenverkauf an Kreditoren 25'000"}
    ],
    correct: "A",
    explain: "Die Forderung (Debitoren, Aktivkonto) nimmt zu → Soll. Der Warenverkauf (Ertragskonto) nimmt zu → Haben. Buchungssatz: Debitoren an Warenverkauf 25'000."
  },
  {
    id: "w06", topic: "warenkonten", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am Jahresende ergibt die Inventur einen Warenvorrat von CHF 42'000. Der Anfangsbestand betrug CHF 35'000. Wie wird die Bestandeszunahme verbucht?",
    options: [
      {v: "A", t: "Warenvorrat an Erfolgsrechnung 7'000"},
      {v: "B", t: "Wareneinkauf an Warenvorrat 7'000"},
      {v: "C", t: "Warenvorrat an Warenverkauf 7'000"},
      {v: "D", t: "Warenvorrat an Wareneinkauf 7'000"}
    ],
    correct: "D",
    explain: "Bestandeszunahme: Endbestand (42'000) – Anfangsbestand (35'000) = 7'000 Zunahme. Warenvorrat (Aktivkonto) nimmt zu → Soll. Wareneinkauf (Aufwandkonto) nimmt ab → Haben. Buchungssatz: Warenvorrat an Wareneinkauf 7'000."
  },
  {
    id: "w07", topic: "warenkonten", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am Jahresende ergibt die Inventur einen Warenvorrat von CHF 28'000. Der Anfangsbestand betrug CHF 35'000. Wie wird die Bestandesabnahme verbucht?",
    options: [
      {v: "A", t: "Wareneinkauf an Warenvorrat 7'000"},
      {v: "B", t: "Warenvorrat an Erfolgsrechnung 7'000"},
      {v: "C", t: "Warenverkauf an Warenvorrat 7'000"},
      {v: "D", t: "Warenvorrat an Wareneinkauf 7'000"}
    ],
    correct: "A",
    explain: "Bestandesabnahme: Endbestand (28'000) – Anfangsbestand (35'000) = –7'000 (Abnahme). Wareneinkauf nimmt zu → Soll. Warenvorrat nimmt ab → Haben. Buchungssatz: Wareneinkauf an Warenvorrat 7'000."
  },
  {
    id: "w08", topic: "warenkonten", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Der Eigentümer entnimmt Waren im Einstandswert von CHF 200 für den Privatgebrauch. Buchungssatz: {0} an {1} 200.",
    blanks: [
      {answer: "Privat", alts: ["Eigenverbrauch", "Privatbezug"]},
      {answer: "Wareneinkauf", alts: ["WE"]}
    ],
    explain: "Die Warenentnahme für private Zwecke wird zum Einstandspreis verbucht: Privat an Wareneinkauf 200. Der Wareneinkauf wird im Haben reduziert, das Privatkonto im Soll belastet."
  },
  {
    id: "w09", topic: "warenkonten", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Dreistufige Erfolgsrechnung: Warenverkauf (Nettoumsatz) CHF 500'000, Wareneinkauf CHF 300'000, Bestandesabnahme Warenvorrat CHF 10'000. Berechne den Warenaufwand und den Bruttogewinn.",
    rows: [
      {label: "Warenaufwand (Einstandswert der verkauften Waren)", answer: 310000, tolerance: 0, unit: "CHF"},
      {label: "Bruttogewinn", answer: 190000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Warenaufwand = Wareneinkauf + Bestandesabnahme = 300'000 + 10'000 = 310'000 CHF. Bruttogewinn = Warenverkauf – Warenaufwand = 500'000 – 310'000 = 190'000 CHF."
  },
  {
    id: "w10", topic: "warenkonten", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Warenkalkulation: Katalogpreis CHF 10'000, Rabatt 20%, Skonto 2%, Bezugsspesen CHF 350. Berechne den Einstandspreis.",
    rows: [
      {label: "Nettozieleinkaufspreis (nach Rabatt)", answer: 8000, tolerance: 0, unit: "CHF"},
      {label: "Nettobareinkaufspreis (nach Skonto)", answer: 7840, tolerance: 0, unit: "CHF"},
      {label: "Einstandspreis", answer: 8190, tolerance: 0, unit: "CHF"}
    ],
    explain: "NZEP = 10'000 – 20% = 8'000. NBEP = 8'000 – 2% = 7'840. Einstandspreis = 7'840 + 350 = 8'190 CHF."
  },
  {
    id: "w11", topic: "warenkonten", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Positionen reduzieren den Wareneinkauf (Haben-Buchung auf Wareneinkauf)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Lieferantenrabatt"},
      {v: "B", t: "Bezugsspesen"},
      {v: "C", t: "Lieferantenskonto"},
      {v: "D", t: "Rücksendung an Lieferant"}
    ],
    correct: ["A", "C", "D"],
    explain: "Rabatte, Skonti und Rücksendungen reduzieren den Wareneinkauf (Haben-Buchung). Bezugsspesen hingegen erhöhen den Wareneinkauf (Soll-Buchung), da sie den Einstandswert vergrössern."
  },
  {
    id: "w12", topic: "warenkonten", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Kunde sendet fehlerhafte Waren im Wert von CHF 2'000 zurück. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Warenverkauf an Debitoren 2'000"},
      {v: "B", t: "Debitoren an Warenverkauf 2'000"},
      {v: "C", t: "Warenverkauf an Kasse 2'000"},
      {v: "D", t: "Wareneinkauf an Debitoren 2'000"}
    ],
    correct: "A",
    explain: "Der Warenverkauf (Ertragskonto) wird im Soll belastet (reduziert). Die Debitoren (Forderung) nehmen im Haben ab. Buchungssatz: Warenverkauf an Debitoren 2'000."
  },
  {
    id: "w13", topic: "warenkonten", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_dreistufige_er_01.svg", alt: "Schema der dreistufigen Erfolgsrechnung mit drei Berechnungsstufen"},
    q: "Dreistufige ER: Warenverkauf CHF 800'000, Warenaufwand CHF 480'000, Lohnaufwand CHF 150'000, Mietaufwand CHF 48'000, Abschreibungen CHF 20'000, Finanzaufwand CHF 12'000, Steueraufwand CHF 18'000, ausserordentlicher Ertrag CHF 5'000. Berechne alle drei Stufen.",
    rows: [
      {label: "Bruttogewinn (1. Stufe)", answer: 320000, tolerance: 0, unit: "CHF"},
      {label: "Betriebsgewinn (2. Stufe)", answer: 90000, tolerance: 0, unit: "CHF"},
      {label: "Jahresgewinn (3. Stufe)", answer: 77000, tolerance: 0, unit: "CHF"}
    ],
    explain: "1. Stufe: 800'000 – 480'000 = 320'000 (Bruttogewinn). 2. Stufe: 320'000 – 150'000 – 48'000 – 20'000 – 12'000 = 90'000 (Betriebsgewinn). 3. Stufe: 90'000 + 5'000 – 18'000 = 77'000 (Jahresgewinn)."
  },
  {
    id: "w14", topic: "warenkonten", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Das Konto Warenvorrat ist ein Aktivkonto (Bestandeskonto) und zeigt den Lagerwert der Waren am Bilanzstichtag.",
    correct: true,
    explain: "Richtig. Das Konto Warenvorrat gehört zum Umlaufvermögen (Aktivkonto). Der Endbestand wird durch eine Inventur ermittelt und zum Einstandspreis bewertet."
  },
  {
    id: "w15", topic: "warenkonten", type: "fill", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Saldo des Kontos Wareneinkauf nach der Verbuchung der Bestandesänderung zeigt den {0} der verkauften Waren, auch genannt {1}.",
    blanks: [
      {answer: "Einstandswert", alts: ["Einstandspreis"]},
      {answer: "Warenaufwand", alts: ["Wareneinsatz"]}
    ],
    explain: "Nach Verbuchung der Bestandesänderung zeigt der Saldo des Kontos Wareneinkauf den Einstandswert der verkauften Waren, auch Warenaufwand (oder Wareneinsatz) genannt. Dieser geht in die 1. Stufe der dreistufigen Erfolgsrechnung ein."
  },
  {
    id: "w16", topic: "warenkonten", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen erzielt einen Warenverkauf von CHF 600'000 und einen Warenaufwand von CHF 390'000. Berechne den Bruttogewinnzuschlag und die Bruttogewinnquote (auf ganze Prozent gerundet).",
    rows: [
      {label: "Bruttogewinn", answer: 210000, tolerance: 0, unit: "CHF"},
      {label: "Bruttogewinnzuschlag (gerundet)", answer: 54, tolerance: 1, unit: "%"},
      {label: "Bruttogewinnquote (gerundet)", answer: 35, tolerance: 1, unit: "%"}
    ],
    explain: "Bruttogewinn = 600'000 – 390'000 = 210'000. Bruttogewinnzuschlag = (210'000 × 100) / 390'000 ≈ 53.8% ≈ 54%. Bruttogewinnquote = (210'000 × 100) / 600'000 = 35%."
  },

  // ============================================================
  // TOPIC: wertberichtigungen – Wertberichtigungen & Abschreibungen
  // ============================================================

  {
    id: "v01", topic: "wertberichtigungen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Warum müssen Anlagevermögenswerte abgeschrieben werden?",
    options: [
      {v: "A", t: "Um die Bilanzsumme möglichst hoch zu halten"},
      {v: "B", t: "Weil das Gesetz keine Bilanzierung von Anlagevermögen erlaubt"},
      {v: "C", t: "Weil sie durch Alterung und Nutzung an Wert verlieren"},
      {v: "D", t: "Um den Gewinn künstlich zu erhöhen"}
    ],
    correct: "C",
    explain: "Anlagevermögen (Fahrzeuge, Maschinen, Gebäude) verliert durch Alterung, Abnutzung und technische Überholung an Wert. Abschreibungen erfassen diesen Wertverlust buchmässig."
  },
  {
    id: "v02", topic: "wertberichtigungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was ist der Unterschied zwischen direkter und indirekter Abschreibung?",
    options: [
      {v: "A", t: "Direkt: Abschreibung nur für Maschinen. Indirekt: Abschreibung nur für Immobilien."},
      {v: "B", t: "Direkt: Abschreibung erfolgt jährlich. Indirekt: Abschreibung erfolgt monatlich."},
      {v: "C", t: "Es gibt keinen Unterschied."},
      {v: "D", t: "Direkt: Abschreibung wird direkt vom Aktivkonto abgezogen. Indirekt: Abschreibung wird auf einem separaten Wertberichtigungskonto erfasst."}
    ],
    correct: "D",
    explain: "Bei der direkten Abschreibung wird der Buchwert direkt auf dem Aktivkonto reduziert (Abschreibungen an Aktivkonto). Bei der indirekten Abschreibung bleibt der Anschaffungswert auf dem Aktivkonto stehen, und die kummulierten Abschreibungen werden auf einem separaten Wertberichtigungskonto gesammelt."
  },
  {
    id: "v03", topic: "wertberichtigungen", type: "fill", diff: 1, tax: "K3",
 reviewed:false,
    q: "Die direkte Abschreibung auf Maschinen von CHF 10'000 wird wie folgt verbucht: {0} an {1} 10'000.",
    blanks: [
      {answer: "Abschreibungen", alts: ["Abschreibungsaufwand"]},
      {answer: "Maschinen", alts: ["Maschinenkonto"]}
    ],
    explain: "Direkte Abschreibung: Abschreibungen (Aufwandkonto, Soll) an Maschinen (Aktivkonto, Haben). Der Buchwert der Maschinen sinkt direkt."
  },
  {
    id: "v04", topic: "wertberichtigungen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die indirekte Abschreibung auf Fahrzeuge von CHF 8'000 wird wie folgt verbucht: {0} an {1} 8'000.",
    blanks: [
      {answer: "Abschreibungen", alts: ["Abschreibungsaufwand"]},
      {answer: "Wertberichtigung Fahrzeuge", alts: ["WB Fahrzeuge"]}
    ],
    explain: "Indirekte Abschreibung: Abschreibungen (Aufwandkonto, Soll) an Wertberichtigung Fahrzeuge (Minus-Aktivkonto, Haben). Der Anschaffungswert bleibt auf dem Fahrzeugkonto sichtbar."
  },
  {
    id: "v05", topic: "wertberichtigungen", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Eine Maschine wurde für CHF 50'000 angeschafft. Die Nutzungsdauer beträgt 10 Jahre. Berechne die jährliche lineare Abschreibung und den Buchwert nach 3 Jahren.",
    rows: [
      {label: "Jährliche lineare Abschreibung", answer: 5000, tolerance: 0, unit: "CHF"},
      {label: "Buchwert nach 3 Jahren", answer: 35000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Lineare Abschreibung = 50'000 / 10 = 5'000 CHF pro Jahr. Buchwert nach 3 Jahren = 50'000 – (3 × 5'000) = 35'000 CHF."
  },
  {
    id: "v06", topic: "wertberichtigungen", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Ein Fahrzeug wurde für CHF 60'000 angeschafft und wird degressiv mit 25% vom Buchwert abgeschrieben. Berechne die Abschreibung und den Buchwert für die ersten 3 Jahre.",
    rows: [
      {label: "Abschreibung Jahr 1", answer: 15000, tolerance: 0, unit: "CHF"},
      {label: "Buchwert nach Jahr 1", answer: 45000, tolerance: 0, unit: "CHF"},
      {label: "Abschreibung Jahr 2", answer: 11250, tolerance: 0, unit: "CHF"},
      {label: "Buchwert nach Jahr 2", answer: 33750, tolerance: 0, unit: "CHF"},
      {label: "Abschreibung Jahr 3", answer: 8438, tolerance: 2, unit: "CHF"}
    ],
    explain: "Degressive Abschreibung: Immer 25% vom aktuellen Buchwert. Jahr 1: 60'000 × 25% = 15'000 → BW 45'000. Jahr 2: 45'000 × 25% = 11'250 → BW 33'750. Jahr 3: 33'750 × 25% = 8'437.50 ≈ 8'438 → BW 25'312."
  },
  {
    id: "v07", topic: "wertberichtigungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Fahrzeug mit einem Buchwert von CHF 12'000 wird für CHF 15'000 verkauft. Wie wird der Verkaufsgewinn verbucht?",
    options: [
      {v: "A", t: "Bank an Fahrzeuge 15'000"},
      {v: "B", t: "Abschreibungen an Fahrzeuge 3'000"},
      {v: "C", t: "Bank an Fahrzeuge 12'000 und Bank an a.o. Ertrag 3'000"},
      {v: "D", t: "Fahrzeuge an Bank 15'000"}
    ],
    correct: "C",
    explain: "Der Verkaufspreis (CHF 15'000) übersteigt den Buchwert (CHF 12'000) um CHF 3'000. Bank erhält 15'000 (Soll), Fahrzeuge wird um 12'000 ausgebucht (Haben), der Gewinn von 3'000 wird als a.o. Ertrag erfasst (Haben)."
  },
  {
    id: "v08", topic: "wertberichtigungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was ist das Delkredere?",
    options: [
      {v: "A", t: "Ein Aufwandkonto für Warenrücksendungen"},
      {v: "B", t: "Ein Passivkonto für langfristige Schulden"},
      {v: "C", t: "Ein Minus-Aktivkonto (Wertberichtigung) für mutmassliche Debitorenverluste"},
      {v: "D", t: "Ein Ertragskonto für Zinseinkünfte"}
    ],
    correct: "C",
    explain: "Das Delkredere ist ein Minus-Aktivkonto (Korrekturkonto zu den Debitoren). Es erfasst die geschätzten, wahrscheinlichen Verluste aus offenen Forderungen. Debitoren minus Delkredere = Nettowert der Forderungen."
  },
  {
    id: "v09", topic: "wertberichtigungen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Delkredere soll auf 5% des Debitorenbestands (CHF 80'000) angepasst werden. Der bisherige Delkredere-Bestand beträgt CHF 2'000. Erhöhung um CHF 2'000. Buchungssatz: {0} an {1} 2'000.",
    blanks: [
      {answer: "Debitorenverluste", alts: ["Debitorenverlust"]},
      {answer: "Delkredere", alts: ["DK"]}
    ],
    explain: "Soll-Delkredere: 5% von 80'000 = 4'000. Bestehend: 2'000. Erhöhung: 2'000. Buchungssatz: Debitorenverluste (Aufwandkonto) an Delkredere (Minus-Aktivkonto) 2'000."
  },
  {
    id: "v10", topic: "wertberichtigungen", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Debitorenbestand beträgt CHF 120'000. Das Delkredere soll 5% betragen. Der bisherige Delkredere-Stand beträgt CHF 8'000. Berechne den Soll-Bestand und die nötige Anpassung.",
    rows: [
      {label: "Soll-Bestand Delkredere (5%)", answer: 6000, tolerance: 0, unit: "CHF"},
      {label: "Anpassungsbetrag (– = Auflösung)", answer: -2000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Soll-Bestand: 5% von 120'000 = 6'000. Ist-Bestand: 8'000. Differenz: 6'000 – 8'000 = –2'000 (Auflösung). Buchungssatz: Delkredere an Debitorenverluste 2'000. Das Delkredere wird reduziert, der Aufwand gutgeschrieben."
  },
  {
    id: "v11", topic: "wertberichtigungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Debitor kann seine Schuld von CHF 3'000 definitiv nicht bezahlen (Verlustschein). Wie wird der tatsächliche Verlust verbucht?",
    options: [
      {v: "A", t: "Bank an Debitorenverluste 3'000"},
      {v: "B", t: "Debitorenverluste an Debitoren 3'000"},
      {v: "C", t: "Delkredere an Debitoren 3'000"},
      {v: "D", t: "Debitoren an Debitorenverluste 3'000"}
    ],
    correct: "B",
    explain: "Der tatsächliche Verlust wird verbucht mit: Debitorenverluste (Aufwandkonto) an Debitoren (Aktivkonto) 3'000. Die Forderung wird ausgebucht, der Verlust als Aufwand erfasst."
  },
  {
    id: "v12", topic: "wertberichtigungen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zur linearen Abschreibung sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der jährliche Abschreibungsbetrag ist immer gleich hoch"},
      {v: "B", t: "Die Abschreibung wird vom Anschaffungswert berechnet"},
      {v: "C", t: "Der Buchwert sinkt jedes Jahr um denselben Betrag"},
      {v: "D", t: "Die Abschreibung wird vom aktuellen Buchwert berechnet"}
    ],
    correct: ["A", "B", "C"],
    explain: "Bei der linearen Abschreibung ist der jährliche Betrag konstant (A), wird vom Anschaffungswert berechnet (B), und der Buchwert sinkt gleichmässig (C). D trifft auf die degressive Abschreibung zu."
  },
  {
    id: "v13", topic: "wertberichtigungen", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Bei der indirekten Abschreibung kann der ursprüngliche Anschaffungswert eines Aktivums jederzeit in der Bilanz abgelesen werden.",
    correct: true,
    explain: "Richtig. Das ist der Hauptvorteil der indirekten Abschreibung: Der Anschaffungswert bleibt auf dem Aktivkonto stehen, und die kumulierten Abschreibungen stehen auf dem separaten Wertberichtigungskonto. Buchwert = Aktivkonto – Wertberichtigung."
  },

  // ============================================================
  // TOPIC: abgrenzungen – Rechnungsabgrenzungen & Rückstellungen
  // ============================================================

  {
    id: "a01", topic: "abgrenzungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Warum sind Rechnungsabgrenzungen am Jahresende nötig?",
    options: [
      {v: "A", t: "Um das Eigenkapital zu erhöhen"},
      {v: "B", t: "Um die Bilanzsumme möglichst hoch auszuweisen"},
      {v: "C", t: "Um Steuern zu sparen"},
      {v: "D", t: "Um Aufwände und Erträge der richtigen Geschäftsperiode zuzuordnen (Periodengerechtigkeit)"}
    ],
    correct: "D",
    explain: "Rechnungsabgrenzungen stellen sicher, dass Aufwände und Erträge in der Periode erfasst werden, in der sie wirtschaftlich angefallen sind (Grundsatz der Periodengerechtigkeit)."
  },
  {
    id: "a02", topic: "abgrenzungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/fibu/fibu_abgrenzungen_01.svg", alt: "Übersicht: Transitorische Aktiven, Transitorische Passiven und Rückstellungen"},
    q: "Was sind Transitorische Aktiven (TA)?",
    options: [
      {v: "A", t: "Vorauserhaltene Erträge oder noch nicht bezahlte Aufwände"},
      {v: "B", t: "Vorausbezahlte Aufwände oder noch nicht erhaltene Erträge, die ins neue Jahr gehören"},
      {v: "C", t: "Rückstellungen für zukünftige Ausgaben"},
      {v: "D", t: "Langfristige Vermögenswerte"}
    ],
    correct: "B",
    explain: "Transitorische Aktiven entstehen, wenn ein Aufwand im alten Jahr bezahlt wurde, aber (teilweise) das neue Jahr betrifft (vorausbezahlter Aufwand), oder wenn ein Ertrag im alten Jahr entstanden ist, aber noch nicht eingegangen ist (noch nicht erhaltener Ertrag)."
  },
  {
    id: "a03", topic: "abgrenzungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was sind Transitorische Passiven (TP)?",
    options: [
      {v: "A", t: "Kurzfristige Schulden"},
      {v: "B", t: "Vorausbezahlte Aufwände"},
      {v: "C", t: "Noch nicht bezahlte Aufwände des alten Jahres oder vorauserhaltene Erträge"},
      {v: "D", t: "Abschreibungen auf Anlagevermögen"}
    ],
    correct: "C",
    explain: "Transitorische Passiven entstehen, wenn ein Aufwand des alten Jahres noch nicht bezahlt wurde (noch nicht bezahlter Aufwand), oder wenn ein Ertrag im alten Jahr erhalten wurde, aber das neue Jahr betrifft (vorauserhaltener Ertrag)."
  },
  {
    id: "a04", topic: "abgrenzungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am 1. Oktober bezahlt das Unternehmen die Versicherungsprämie von CHF 12'000 für ein ganzes Jahr (Okt.–Sept.) per Bank. Am 31.12. muss abgegrenzt werden. Wie lautet die Abgrenzungsbuchung?",
    options: [
      {v: "A", t: "Transitorische Aktiven an Versicherungsaufwand 3'000"},
      {v: "B", t: "Transitorische Aktiven an Versicherungsaufwand 9'000"},
      {v: "C", t: "Transitorische Passiven an Versicherungsaufwand 9'000"},
      {v: "D", t: "Versicherungsaufwand an Transitorische Aktiven 9'000"}
    ],
    correct: "B",
    explain: "Von den CHF 12'000 betreffen nur 3 Monate (Okt.–Dez.) das alte Jahr = CHF 3'000. Die restlichen 9 Monate (Jan.–Sept.) = CHF 9'000 gehören ins neue Jahr. Abgrenzung: TA an Versicherungsaufwand 9'000. Der Aufwand im alten Jahr wird auf 3'000 korrigiert."
  },
  {
    id: "a05", topic: "abgrenzungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am 31.12. ist der Dezemberlohn von CHF 15'000 noch nicht bezahlt. Wie lautet die Abgrenzungsbuchung?",
    options: [
      {v: "A", t: "Transitorische Aktiven an Lohnaufwand 15'000"},
      {v: "B", t: "Lohnaufwand an Bank 15'000"},
      {v: "C", t: "Lohnaufwand an Transitorische Passiven 15'000"},
      {v: "D", t: "Transitorische Passiven an Lohnaufwand 15'000"}
    ],
    correct: "C",
    explain: "Der Lohnaufwand gehört ins alte Jahr (Dezember), ist aber noch nicht bezahlt. Der Aufwand muss erfasst werden: Lohnaufwand an TP 15'000. Die TP zeigt die noch offene Verpflichtung."
  },
  {
    id: "a06", topic: "abgrenzungen", type: "fill", diff: 2, tax: "K3",
 reviewed:false,
    q: "Am 1. Juli hat das Unternehmen CHF 6'000 Miete für 12 Monate im Voraus erhalten. Am 31.12. muss für die verbleibenden 6 Monate abgegrenzt werden. Buchungssatz: {0} an {1} 3'000.",
    blanks: [
      {answer: "Mietertrag", alts: ["Immobilienertrag"]},
      {answer: "Transitorische Passiven", alts: ["TP"]}
    ],
    explain: "Vom erhaltenen Mietertrag von CHF 6'000 betreffen 6 Monate (Juli–Dez.) das alte Jahr = CHF 3'000. Die anderen 6 Monate (Jan.–Juni) = CHF 3'000 gehören ins neue Jahr. Abgrenzung: Mietertrag an TP 3'000."
  },
  {
    id: "a07", topic: "abgrenzungen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist der Hauptunterschied zwischen Transitorischen Passiven und Rückstellungen?",
    options: [
      {v: "A", t: "TP betreffen nur Aufwände, Rückstellungen nur Erträge"},
      {v: "B", t: "Bei TP sind Betrag und Fälligkeit bekannt, bei Rückstellungen sind Betrag oder Fälligkeit unsicher"},
      {v: "C", t: "Es gibt keinen Unterschied"},
      {v: "D", t: "TP sind kurzfristig, Rückstellungen immer langfristig"}
    ],
    correct: "B",
    explain: "Bei Transitorischen Passiven sind Betrag und Fälligkeit bekannt (z.B. offener Dezemberlohn). Bei Rückstellungen ist der Betrag und/oder die Fälligkeit der Zahlung unsicher (z.B. hängiger Rechtsstreit, Garantieansprüche)."
  },
  {
    id: "a08", topic: "abgrenzungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Unternehmen bildet eine Rückstellung von CHF 20'000 für einen hängigen Rechtsstreit. Wie lautet der Buchungssatz?",
    options: [
      {v: "A", t: "Prozessaufwand an Rückstellungen 20'000"},
      {v: "B", t: "Rückstellungen an Bank 20'000"},
      {v: "C", t: "Bank an Rückstellungen 20'000"},
      {v: "D", t: "Rückstellungen an Prozessaufwand 20'000"}
    ],
    correct: "A",
    explain: "Die Bildung einer Rückstellung: Aufwandkonto (Soll) an Rückstellungen (Passivkonto, Haben). Es entsteht ein Aufwand im alten Jahr und eine Verbindlichkeit mit unsicherem Betrag/Zeitpunkt."
  },
  {
    id: "a09", topic: "abgrenzungen", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Rechtsstreit wird im Folgejahr beigelegt. Das Unternehmen zahlt CHF 15'000 (weniger als die Rückstellung von CHF 20'000). Wie wird die Auflösung der Rückstellung verbucht?",
    options: [
      {v: "A", t: "Prozessaufwand an Bank 15'000"},
      {v: "B", t: "Rückstellungen an Bank 15'000 und Rückstellungen an a.o. Ertrag 5'000"},
      {v: "C", t: "Bank an Rückstellungen 15'000"},
      {v: "D", t: "Rückstellungen an Bank 20'000"}
    ],
    correct: "B",
    explain: "Die Rückstellung von CHF 20'000 wird aufgelöst: CHF 15'000 werden bezahlt (Rückstellungen an Bank 15'000). Die Differenz von CHF 5'000 (nicht benötigter Teil) wird als ausserordentlicher Ertrag erfasst: Rückstellungen an a.o. Ertrag 5'000."
  },
  {
    id: "a10", topic: "abgrenzungen", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Am 1. September nimmt das Unternehmen ein Darlehen von CHF 100'000 zu 3% Jahreszins auf. Die Zinsen werden halbjährlich am 28.2. und 31.8. bezahlt. Am 31.12. muss abgegrenzt werden. Berechne den aufgelaufenen Zins für 4 Monate (Sept.–Dez.).",
    rows: [
      {label: "Aufgelaufener Zins (4 Monate)", answer: 1000, tolerance: 0, unit: "CHF"},
    ],
    explain: "Jahreszins: 100'000 × 3% = 3'000 CHF. Monatszins: 3'000 / 12 = 250 CHF. Für 4 Monate (Sept.–Dez.): 4 × 250 = 1'000 CHF. Abgrenzungsbuchung: Finanzaufwand an TP 1'000."
  },
  {
    id: "a11", topic: "abgrenzungen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Situationen erfordern eine Transitorische Aktive (TA)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Versicherungsprämie für Januar–Dezember im Voraus bezahlt (Bilanzstichtag 30.6.)"},
      {v: "B", t: "Dezemberlohn noch nicht bezahlt am 31.12."},
      {v: "C", t: "Zinsgutschrift der Bank für das 4. Quartal noch nicht erhalten am 31.12."},
      {v: "D", t: "Miete für Januar des Folgejahres bereits im Dezember erhalten"}
    ],
    correct: ["A", "C"],
    explain: "TA = vorausbezahlter Aufwand oder noch nicht erhaltener Ertrag. A) Vorausbezahlte Versicherung. C) Noch nicht erhaltener Zinsertrag. B) erfordert eine TP (noch nicht bezahlter Aufwand). D) erfordert ebenfalls eine TP (vorauserhaltener Ertrag)."
  },
  {
    id: "a12", topic: "abgrenzungen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Transitorische Buchungen werden nur am Jahresende vorgenommen und im Folgejahr wieder aufgelöst.",
    correct: true,
    explain: "Richtig. Transitorische Buchungen werden am Bilanzstichtag (Jahresende) erfasst und nach der Bilanzeröffnung im neuen Jahr durch Gegenbuchungen (Stornobuchungen) wieder aufgelöst."
  },
  {
    id: "a13", topic: "abgrenzungen", type: "fill", diff: 3, tax: "K3",
 reviewed:false,
    q: "Die Auflösung einer Transitorischen Aktive von CHF 9'000 (vorausbezahlte Versicherung) im neuen Jahr lautet: {0} an {1} 9'000.",
    blanks: [
      {answer: "Versicherungsaufwand", alts: ["Aufwand"]},
      {answer: "Transitorische Aktiven", alts: ["TA"]}
    ],
    explain: "Die Gegenbuchung im neuen Jahr: Versicherungsaufwand an TA 9'000. Der Aufwand wird im neuen Jahr erfasst, die TA wird aufgelöst."
  },

  // ══════════════════════════════════════════
  // NEUE FRAGETYPEN: Buchungssatz
  // ══════════════════════════════════════════
  {
    id: "bs01", topic: "buchungssatz", type: "buchungssatz", diff: 1, tax: "K3", reviewed: false,
    q: "Buchen Sie: Barverkauf von Waren für CHF 800.–",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"},
      {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [
      {soll: "1000", haben: "3200", betrag: 800}
    ],
    explain: "Barverkauf: Kasse (Aktivkonto) nimmt zu → Soll. Warenertrag (Ertragskonto) nimmt zu → Haben."
  },
  {
    id: "bs02", topic: "buchungssatz", type: "buchungssatz", diff: 1, tax: "K3", reviewed: false,
    q: "Buchen Sie: Wareneinkauf auf Kredit für CHF 2'500.–",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"},
      {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [
      {soll: "4200", haben: "2000", betrag: 2500}
    ],
    explain: "Wareneinkauf auf Kredit: Warenaufwand (Aufwandskonto) nimmt zu → Soll. Kreditoren (Passivkonto) nehmen zu → Haben."
  },
  {
    id: "bs03", topic: "buchungssatz", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Ein Kunde bezahlt seine Rechnung von CHF 1'200.– per Banküberweisung.",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"},
      {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [
      {soll: "1020", haben: "1100", betrag: 1200}
    ],
    explain: "Debitorenzahlung per Bank: Bank (Aktivkonto) nimmt zu → Soll. Debitoren (Aktivkonto) nehmen ab → Haben."
  },
  {
    id: "bs04", topic: "buchungssatz", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Wir bezahlen die Lieferantenrechnung von CHF 3'000.– bar.",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"},
      {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [
      {soll: "2000", haben: "1000", betrag: 3000}
    ],
    explain: "Kreditorenzahlung bar: Kreditoren (Passivkonto) nehmen ab → Soll. Kasse (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "bs05", topic: "buchungssatz", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Warenverkauf auf Rechnung CHF 4'000.– und gleichzeitiger Barkauf von Material CHF 600.–",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"},
      {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [
      {soll: "1100", haben: "3200", betrag: 4000},
      {soll: "4200", haben: "1000", betrag: 600}
    ],
    explain: "Zwei Buchungen: 1) Verkauf auf Rechnung: Debitoren/Warenertrag 4'000. 2) Barkauf: Warenaufwand/Kasse 600."
  },
  {
    id: "bs06", topic: "erfolgsrechnung", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Banküberweisung der Monatsmiete CHF 1'500.–",
    konten: [
      {nr: "1000", name: "Kasse"},
      {nr: "1020", name: "Bank"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "6000", name: "Mietaufwand"},
      {nr: "6500", name: "Lohnaufwand"},
      {nr: "3200", name: "Warenertrag"}
    ],
    correct: [
      {soll: "6000", haben: "1020", betrag: 1500}
    ],
    explain: "Miete: Mietaufwand (Aufwandskonto) nimmt zu → Soll. Bank (Aktivkonto) nimmt ab → Haben."
  },

  // ══════════════════════════════════════════
  // NEUE FRAGETYPEN: Kontenbestimmung
  // ══════════════════════════════════════════
  {
    id: "kb01", topic: "kontentypen", type: "kontenbestimmung", diff: 1, tax: "K2", reviewed: false,
    q: "Bestimmen Sie für jeden Geschäftsfall die betroffenen Konten und die Buchungsseite (Soll/Haben).",
    konten: [
      {nr: "1000", name: "Kasse", kategorie: "aktiv"},
      {nr: "1020", name: "Bank", kategorie: "aktiv"},
      {nr: "1100", name: "Debitoren", kategorie: "aktiv"},
      {nr: "2000", name: "Kreditoren", kategorie: "passiv"},
      {nr: "3200", name: "Warenertrag", kategorie: "ertrag"},
      {nr: "4200", name: "Warenaufwand", kategorie: "aufwand"}
    ],
    aufgaben: [
      {text: "Barverkauf von Waren CHF 500", correct: [
        {konto: "1000", seite: "soll"},
        {konto: "3200", seite: "haben"}
      ]},
      {text: "Wareneinkauf auf Kredit CHF 1'200", correct: [
        {konto: "4200", seite: "soll"},
        {konto: "2000", seite: "haben"}
      ]}
    ],
    explain: "Barverkauf: Kasse nimmt zu (Soll), Warenertrag nimmt zu (Haben). Wareneinkauf: Warenaufwand nimmt zu (Soll), Kreditoren nehmen zu (Haben)."
  },
  {
    id: "kb02", topic: "kontentypen", type: "kontenbestimmung", diff: 2, tax: "K3", reviewed: false,
    q: "Bestimmen Sie die Buchungsseite für folgende Geschäftsfälle.",
    konten: [
      {nr: "1000", name: "Kasse", kategorie: "aktiv"},
      {nr: "1020", name: "Bank", kategorie: "aktiv"},
      {nr: "1100", name: "Debitoren", kategorie: "aktiv"},
      {nr: "2000", name: "Kreditoren", kategorie: "passiv"},
      {nr: "2400", name: "Bankdarlehen", kategorie: "passiv"},
      {nr: "6000", name: "Mietaufwand", kategorie: "aufwand"},
      {nr: "3200", name: "Warenertrag", kategorie: "ertrag"}
    ],
    aufgaben: [
      {text: "Überweisung der Miete per Bank CHF 1'800", correct: [
        {konto: "6000", seite: "soll"},
        {konto: "1020", seite: "haben"}
      ]},
      {text: "Rückzahlung des Bankdarlehens per Bank CHF 5'000", correct: [
        {konto: "2400", seite: "soll"},
        {konto: "1020", seite: "haben"}
      ]},
      {text: "Kunde bezahlt Rechnung bar CHF 750", correct: [
        {konto: "1000", seite: "soll"},
        {konto: "1100", seite: "haben"}
      ]}
    ],
    explain: "Miete: Aufwand/Bank. Darlehensrückzahlung: Passiv nimmt ab → Soll, Aktiv nimmt ab → Haben. Debitorenzahlung bar: Kasse/Debitoren."
  },

  // ══════════════════════════════════════════
  // NEUE FRAGETYPEN: T-Konto
  // ══════════════════════════════════════════
  {
    id: "tk01", topic: "buchungssatz", type: "tkonto", diff: 2, tax: "K3", reviewed: false,
    q: "Führen Sie das T-Konto «Kasse» nach folgenden Geschäftsfällen. Bestimmen Sie den Saldo.",
    geschaeftsfaelle: [
      "Barverkauf von Waren CHF 600",
      "Barzahlung an Lieferant CHF 400",
      "Bareinzahlung eines Kunden CHF 300"
    ],
    konten: [{
      nr: "1000", name: "Kasse", ab: 2000,
      correctSoll: [
        {gegen: "3200", betrag: 600, gf: 1},
        {gegen: "1100", betrag: 300, gf: 3}
      ],
      correctHaben: [
        {gegen: "2000", betrag: 400, gf: 2}
      ],
      correctSaldo: {seite: "soll", betrag: 2500}
    }],
    gegenkonten: [
      {nr: "3200", name: "Warenertrag"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "1100", name: "Debitoren"},
      {nr: "4200", name: "Warenaufwand"},
      {nr: "6000", name: "Mietaufwand"}
    ],
    explain: "AB 2'000 + 600 (Barverkauf) + 300 (Kundenzahlung) = 2'900 Soll. Abzüglich 400 (Lieferant) = Saldo 2'500 Soll."
  },
  {
    id: "tk02", topic: "buchungssatz", type: "tkonto", diff: 2, tax: "K3", reviewed: false,
    q: "Führen Sie das T-Konto «Bank» und bestimmen Sie den Saldo.",
    geschaeftsfaelle: [
      "Kundenzahlung per Bank CHF 1'500",
      "Mietzahlung per Bank CHF 800",
      "Lohnzahlung per Bank CHF 3'200"
    ],
    konten: [{
      nr: "1020", name: "Bank", ab: 5000,
      correctSoll: [
        {gegen: "1100", betrag: 1500, gf: 1}
      ],
      correctHaben: [
        {gegen: "6000", betrag: 800, gf: 2},
        {gegen: "6500", betrag: 3200, gf: 3}
      ],
      correctSaldo: {seite: "soll", betrag: 2500}
    }],
    gegenkonten: [
      {nr: "1100", name: "Debitoren"},
      {nr: "6000", name: "Mietaufwand"},
      {nr: "6500", name: "Lohnaufwand"},
      {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"}
    ],
    explain: "AB 5'000 + 1'500 (Kundenzahlung) = 6'500 Soll. Abzüglich 800 (Miete) + 3'200 (Lohn) = Saldo 2'500 Soll."
  },

  // ══════════════════════════════════════════
  // NEUE FRAGETYPEN: Bilanz
  // ══════════════════════════════════════════
  {
    id: "bi01", topic: "bilanz", type: "bilanz", diff: 2, tax: "K3", reviewed: false,
    q: "Erstellen Sie die Schlussbilanz aus folgenden Konten. Ordnen Sie jedes Konto der richtigen Seite zu und berechnen Sie die Bilanzsumme.",
    modus: "bilanz",
    kontenMitSaldi: [
      {nr: "1000", name: "Kasse", saldo: 5000},
      {nr: "1020", name: "Bank", saldo: 15000},
      {nr: "1500", name: "Maschinen", saldo: 30000},
      {nr: "2000", name: "Kreditoren", saldo: 12000},
      {nr: "2400", name: "Bankdarlehen", saldo: 20000},
      {nr: "2800", name: "Eigenkapital", saldo: 18000}
    ],
    correct: {
      aktiven: ["1000", "1020", "1500"],
      passiven: ["2000", "2400", "2800"],
      bilanzsumme: 50000
    },
    explain: "Aktiven: Kasse 5'000 + Bank 15'000 + Maschinen 30'000 = 50'000. Passiven: Kreditoren 12'000 + Bankdarlehen 20'000 + EK 18'000 = 50'000."
  },
  {
    id: "bi02", topic: "bilanz", type: "bilanz", diff: 1, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Konten der korrekten Bilanzseite zu und berechnen Sie die Bilanzsumme.",
    modus: "bilanz",
    kontenMitSaldi: [
      {nr: "1000", name: "Kasse", saldo: 3000},
      {nr: "1100", name: "Debitoren", saldo: 7000},
      {nr: "2000", name: "Kreditoren", saldo: 4000},
      {nr: "2800", name: "Eigenkapital", saldo: 6000}
    ],
    correct: {
      aktiven: ["1000", "1100"],
      passiven: ["2000", "2800"],
      bilanzsumme: 10000
    },
    explain: "Aktiven: Kasse 3'000 + Debitoren 7'000 = 10'000. Passiven: Kreditoren 4'000 + Eigenkapital 6'000 = 10'000."
  },

  // ══════════════════════════════════════════
  // NEUE FRAGETYPEN: Aufgabengruppe
  // ══════════════════════════════════════════
  {
    id: "ag01", topic: "buchungssatz", type: "gruppe", diff: 2, tax: "K3", reviewed: false,
    q: "Die Schreinerei Müller hat am 15. Januar folgende Geschäftsfälle:",
    context: "Anfangsbestand Kasse: CHF 10'000. Anfangsbestand Bank: CHF 25'000.",
    teil: [
      {
        sub: "a", type: "buchungssatz",
        q: "Buchen Sie: Barverkauf von Holzprodukten CHF 1'500.",
        konten: [
          {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
          {nr: "3200", name: "Warenertrag"}, {nr: "4200", name: "Warenaufwand"}
        ],
        correct: [{soll: "1000", haben: "3200", betrag: 1500}],
        explain: "Kasse/Warenertrag 1'500."
      },
      {
        sub: "b", type: "mc",
        q: "Wie verändert sich die Bilanzsumme durch den Barverkauf?",
        options: [
          {v: "A", t: "Sie nimmt zu"},
          {v: "B", t: "Sie bleibt gleich"},
          {v: "C", t: "Sie nimmt ab"}
        ],
        correct: "A",
        explain: "Erfolgswirksamer Geschäftsfall: Kasse nimmt zu (Aktiven ↑), Warenertrag erhöht den Gewinn → Eigenkapital ↑ (Passiven ↑). Bilanzsumme nimmt zu."
      },
      {
        sub: "c", type: "calc",
        q: "Wie hoch ist der neue Kassenbestand nach dem Barverkauf?",
        rows: [{label: "Kassenbestand", answer: 11500, tolerance: 0, unit: "CHF"}],
        explain: "10'000 + 1'500 = 11'500 CHF."
      }
    ],
    explain: "Ein erfolgswirksamer Geschäftsfall verändert die Bilanzsumme. Der Barverkauf erhöht Kasse und Eigenkapital (via Warenertrag)."
  },
  {
    id: "ag02", topic: "erfolgsrechnung", type: "gruppe", diff: 2, tax: "K3", reviewed: false,
    q: "Analysieren Sie die folgenden Geschäftsfälle der Bäckerei Huber:",
    context: "Warenvorrat per 1.1.: CHF 8'000. Kasse: CHF 5'000.",
    teil: [
      {
        sub: "a", type: "tf",
        q: "Die Zahlung einer Lieferantenrechnung ist ein erfolgswirksamer Geschäftsfall.",
        correct: false,
        explain: "Falsch. Die Zahlung einer Lieferantenrechnung (Kreditoren/Bank) ist ein Aktivtausch bzw. Aktiv-Passiv-Minderung — erfolgsneutral."
      },
      {
        sub: "b", type: "buchungssatz",
        q: "Buchen Sie: Wareneinkauf bar CHF 2'000.",
        konten: [
          {nr: "1000", name: "Kasse"}, {nr: "4200", name: "Warenaufwand"},
          {nr: "2000", name: "Kreditoren"}, {nr: "3200", name: "Warenertrag"}
        ],
        correct: [{soll: "4200", haben: "1000", betrag: 2000}],
        explain: "Warenaufwand/Kasse 2'000."
      },
      {
        sub: "c", type: "fill",
        q: "Der Wareneinkauf erhöht den {0} und reduziert das {1}.",
        blanks: [
          {answer: "Aufwand", alts: ["Warenaufwand"]},
          {answer: "Eigenkapital", alts: ["EK"]}
        ],
        explain: "Aufwand erhöht sich → Eigenkapital sinkt (via Erfolgsrechnung)."
      }
    ],
    explain: "Erfolgswirksame Geschäftsfälle (Aufwand/Ertrag) verändern die Bilanzsumme und das Eigenkapital. Reine Bilanzbuchungen sind erfolgsneutral."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Erfolgsrechnung
  // ══════════════════════════════════════════
  {
    id: "bs07", topic: "erfolgsrechnung", type: "buchungssatz", diff: 1, tax: "K3", reviewed: false,
    q: "Buchen Sie: Lohnzahlung per Bank CHF 4'500.–",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "6000", name: "Mietaufwand"}, {nr: "6500", name: "Lohnaufwand"},
      {nr: "3200", name: "Warenertrag"}, {nr: "6800", name: "Zinsaufwand"}
    ],
    correct: [{soll: "6500", haben: "1020", betrag: 4500}],
    explain: "Lohnzahlung: Lohnaufwand (Aufwandskonto) nimmt zu → Soll. Bank (Aktivkonto) nimmt ab → Haben."
  },
  {
    id: "bs08", topic: "erfolgsrechnung", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Zinsgutschrift der Bank CHF 120.–",
    konten: [
      {nr: "1020", name: "Bank"}, {nr: "3400", name: "Zinsertrag"},
      {nr: "6800", name: "Zinsaufwand"}, {nr: "6500", name: "Lohnaufwand"},
      {nr: "1000", name: "Kasse"}, {nr: "2800", name: "Eigenkapital"}
    ],
    correct: [{soll: "1020", haben: "3400", betrag: 120}],
    explain: "Zinsgutschrift: Bank nimmt zu → Soll. Zinsertrag (Ertragskonto) nimmt zu → Haben."
  },
  {
    id: "bs09", topic: "erfolgsrechnung", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Barzahlung der Stromrechnung CHF 350.–",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "6200", name: "Energieaufwand"}, {nr: "6000", name: "Mietaufwand"},
      {nr: "2000", name: "Kreditoren"}, {nr: "3200", name: "Warenertrag"}
    ],
    correct: [{soll: "6200", haben: "1000", betrag: 350}],
    explain: "Stromrechnung bar: Energieaufwand nimmt zu → Soll. Kasse nimmt ab → Haben."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Warenkonten
  // ══════════════════════════════════════════
  {
    id: "bs10", topic: "warenkonten", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Warenverkauf auf Rechnung CHF 6'000.–",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"}, {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"}, {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [{soll: "1100", haben: "3200", betrag: 6000}],
    explain: "Verkauf auf Rechnung: Debitoren (Aktivkonto) nehmen zu → Soll. Warenertrag nimmt zu → Haben."
  },
  {
    id: "bs11", topic: "warenkonten", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Wareneinkauf per Banküberweisung CHF 3'800.–",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"}, {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"}, {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [{soll: "4200", haben: "1020", betrag: 3800}],
    explain: "Wareneinkauf per Bank: Warenaufwand nimmt zu → Soll. Bank nimmt ab → Haben."
  },
  {
    id: "bs12", topic: "warenkonten", type: "buchungssatz", diff: 3, tax: "K3", reviewed: false,
    q: "Buchen Sie: Warenrücksendung an Lieferant (Gutschrift) CHF 500.–",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "1100", name: "Debitoren"}, {nr: "2000", name: "Kreditoren"},
      {nr: "3200", name: "Warenertrag"}, {nr: "4200", name: "Warenaufwand"}
    ],
    correct: [{soll: "2000", haben: "4200", betrag: 500}],
    explain: "Warenrücksendung: Kreditoren (Passivkonto) nehmen ab → Soll. Warenaufwand wird korrigiert (nimmt ab) → Haben."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Eigentümer
  // ══════════════════════════════════════════
  {
    id: "bs13", topic: "eigentuemer", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Der Eigentümer entnimmt CHF 2'000.– bar für private Zwecke.",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1020", name: "Bank"},
      {nr: "2800", name: "Eigenkapital"}, {nr: "2850", name: "Privat"},
      {nr: "3200", name: "Warenertrag"}, {nr: "6500", name: "Lohnaufwand"}
    ],
    correct: [{soll: "2850", haben: "1000", betrag: 2000}],
    explain: "Privatbezug: Privat (Unterkonto EK) nimmt zu → Soll. Kasse nimmt ab → Haben."
  },
  {
    id: "bs14", topic: "eigentuemer", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Der Eigentümer bringt sein privates Fahrzeug (Wert CHF 15'000.–) in die Firma ein.",
    konten: [
      {nr: "1000", name: "Kasse"}, {nr: "1500", name: "Fahrzeuge"},
      {nr: "2800", name: "Eigenkapital"}, {nr: "2850", name: "Privat"},
      {nr: "1020", name: "Bank"}, {nr: "2400", name: "Bankdarlehen"}
    ],
    correct: [{soll: "1500", haben: "2800", betrag: 15000}],
    explain: "Sacheinlage: Fahrzeuge (Aktivkonto) nimmt zu → Soll. Eigenkapital nimmt zu → Haben."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Wertberichtigungen
  // ══════════════════════════════════════════
  {
    id: "bs15", topic: "wertberichtigungen", type: "buchungssatz", diff: 2, tax: "K3", reviewed: false,
    q: "Buchen Sie: Abschreibung auf Maschinen CHF 4'000.– (direkte Methode).",
    konten: [
      {nr: "1500", name: "Maschinen"}, {nr: "1510", name: "WB Maschinen"},
      {nr: "6800", name: "Abschreibungen"}, {nr: "1020", name: "Bank"},
      {nr: "2800", name: "Eigenkapital"}, {nr: "3200", name: "Warenertrag"}
    ],
    correct: [{soll: "6800", haben: "1500", betrag: 4000}],
    explain: "Direkte Abschreibung: Abschreibungen (Aufwand) nimmt zu → Soll. Maschinen (Aktiven) nimmt ab → Haben."
  },
  {
    id: "bs16", topic: "wertberichtigungen", type: "buchungssatz", diff: 3, tax: "K3", reviewed: false,
    q: "Buchen Sie: Abschreibung auf Mobiliar CHF 2'500.– (indirekte Methode).",
    konten: [
      {nr: "1520", name: "Mobiliar"}, {nr: "1521", name: "WB Mobiliar"},
      {nr: "6800", name: "Abschreibungen"}, {nr: "1020", name: "Bank"},
      {nr: "2800", name: "Eigenkapital"}, {nr: "3200", name: "Warenertrag"}
    ],
    correct: [{soll: "6800", haben: "1521", betrag: 2500}],
    explain: "Indirekte Abschreibung: Abschreibungen (Aufwand) → Soll. Wertberichtigung Mobiliar (Minusaktivkonto) nimmt zu → Haben. Das Mobiliar-Konto bleibt unverändert."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Abgrenzungen
  // ══════════════════════════════════════════
  {
    id: "bs17", topic: "abgrenzungen", type: "buchungssatz", diff: 3, tax: "K3", reviewed: false,
    q: "Buchen Sie: Am 31.12. sind CHF 3'000.– Miete für Januar–März des Folgejahres vorausbezahlt. Bilden Sie die Transitorische Aktive.",
    konten: [
      {nr: "1300", name: "Trans. Aktiven"}, {nr: "2300", name: "Trans. Passiven"},
      {nr: "6000", name: "Mietaufwand"}, {nr: "1020", name: "Bank"},
      {nr: "2800", name: "Eigenkapital"}, {nr: "3200", name: "Warenertrag"}
    ],
    correct: [{soll: "1300", haben: "6000", betrag: 3000}],
    explain: "Vorausbezahlte Miete: Transitorische Aktiven (Aktivkonto) nimmt zu → Soll. Mietaufwand wird korrigiert (nimmt ab) → Haben."
  },
  {
    id: "bs18", topic: "abgrenzungen", type: "buchungssatz", diff: 3, tax: "K3", reviewed: false,
    q: "Buchen Sie: Am 31.12. sind CHF 1'800.– Zinsen auf dem Bankdarlehen aufgelaufen, aber noch nicht bezahlt. Bilden Sie die Transitorische Passive.",
    konten: [
      {nr: "1300", name: "Trans. Aktiven"}, {nr: "2300", name: "Trans. Passiven"},
      {nr: "6800", name: "Zinsaufwand"}, {nr: "1020", name: "Bank"},
      {nr: "2400", name: "Bankdarlehen"}, {nr: "3400", name: "Zinsertrag"}
    ],
    correct: [{soll: "6800", haben: "2300", betrag: 1800}],
    explain: "Aufgelaufene Zinsen: Zinsaufwand nimmt zu → Soll. Transitorische Passiven (Passivkonto) nimmt zu → Haben."
  },

  // ══════════════════════════════════════════
  // BUCHUNGSSÄTZE — Zusammengesetzte (schwer)
  // ══════════════════════════════════════════
  {
    id: "bs19", topic: "buchungssatz", type: "buchungssatz", diff: 3, tax: "K3", reviewed: false,
    q: "Buchen Sie: Verkauf einer alten Maschine (Buchwert CHF 8'000) für CHF 6'000.– auf Rechnung. Buchen Sie den Verlust separat.",
    konten: [
      {nr: "1100", name: "Debitoren"}, {nr: "1500", name: "Maschinen"},
      {nr: "3800", name: "Ausserord. Ertrag"}, {nr: "6900", name: "Ausserord. Aufwand"},
      {nr: "1020", name: "Bank"}, {nr: "3200", name: "Warenertrag"}
    ],
    correct: [
      {soll: "1100", haben: "1500", betrag: 6000},
      {soll: "6900", haben: "1500", betrag: 2000}
    ],
    explain: "Verkauf unter Buchwert: 1) Debitoren/Maschinen 6'000 (Verkaufserlös). 2) Ausserordentlicher Aufwand/Maschinen 2'000 (Buchverlust = 8'000 − 6'000)."
  },

  // ══════════════════════════════════════════
  // KONTENBESTIMMUNG — weitere
  // ══════════════════════════════════════════
  {
    id: "kb03", topic: "kontentypen", type: "kontenbestimmung", diff: 1, tax: "K2", reviewed: false,
    q: "Welches Konto wird belastet (Soll) und welches wird erkannt (Haben)?",
    konten: [
      {nr: "1000", name: "Kasse", kategorie: "aktiv"},
      {nr: "1020", name: "Bank", kategorie: "aktiv"},
      {nr: "1100", name: "Debitoren", kategorie: "aktiv"},
      {nr: "2000", name: "Kreditoren", kategorie: "passiv"},
      {nr: "2800", name: "Eigenkapital", kategorie: "passiv"},
      {nr: "6500", name: "Lohnaufwand", kategorie: "aufwand"},
      {nr: "3200", name: "Warenertrag", kategorie: "ertrag"}
    ],
    aufgaben: [
      {text: "Lohnzahlung per Bank CHF 5'000", correct: [
        {konto: "6500", seite: "soll"},
        {konto: "1020", seite: "haben"}
      ]},
      {text: "Bareinzahlung auf das Bankkonto CHF 2'000", correct: [
        {konto: "1020", seite: "soll"},
        {konto: "1000", seite: "haben"}
      ]},
      {text: "Warenverkauf bar CHF 900", correct: [
        {konto: "1000", seite: "soll"},
        {konto: "3200", seite: "haben"}
      ]}
    ],
    explain: "Lohn: Aufwand/Bank. Bareinzahlung: Aktivtausch Bank/Kasse. Warenverkauf: Kasse/Warenertrag."
  },
  {
    id: "kb04", topic: "kontentypen", type: "kontenbestimmung", diff: 2, tax: "K3", reviewed: false,
    q: "Bestimmen Sie Konto und Buchungsseite für diese Geschäftsfälle.",
    konten: [
      {nr: "1020", name: "Bank", kategorie: "aktiv"},
      {nr: "1500", name: "Maschinen", kategorie: "aktiv"},
      {nr: "2000", name: "Kreditoren", kategorie: "passiv"},
      {nr: "2400", name: "Bankdarlehen", kategorie: "passiv"},
      {nr: "6800", name: "Abschreibungen", kategorie: "aufwand"},
      {nr: "3400", name: "Zinsertrag", kategorie: "ertrag"}
    ],
    aufgaben: [
      {text: "Kauf einer Maschine auf Kredit CHF 12'000", correct: [
        {konto: "1500", seite: "soll"},
        {konto: "2000", seite: "haben"}
      ]},
      {text: "Abschreibung auf Maschinen CHF 3'000 (direkt)", correct: [
        {konto: "6800", seite: "soll"},
        {konto: "1500", seite: "haben"}
      ]},
      {text: "Rückzahlung Bankdarlehen per Bank CHF 10'000", correct: [
        {konto: "2400", seite: "soll"},
        {konto: "1020", seite: "haben"}
      ]}
    ],
    explain: "Maschinenkauf: Aktiv nimmt zu / Passiv nimmt zu. Abschreibung: Aufwand / Aktiv nimmt ab. Darlehensrückzahlung: Passiv nimmt ab / Aktiv nimmt ab."
  },
  {
    id: "kb05", topic: "erfolgsrechnung", type: "kontenbestimmung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie den Geschäftsfällen das korrekte Konto und die Buchungsseite zu.",
    konten: [
      {nr: "1000", name: "Kasse", kategorie: "aktiv"},
      {nr: "1020", name: "Bank", kategorie: "aktiv"},
      {nr: "2000", name: "Kreditoren", kategorie: "passiv"},
      {nr: "6000", name: "Mietaufwand", kategorie: "aufwand"},
      {nr: "6200", name: "Energieaufwand", kategorie: "aufwand"},
      {nr: "6500", name: "Lohnaufwand", kategorie: "aufwand"},
      {nr: "3200", name: "Warenertrag", kategorie: "ertrag"},
      {nr: "3600", name: "Dienstleistungsertrag", kategorie: "ertrag"}
    ],
    aufgaben: [
      {text: "Barverkauf einer Dienstleistung CHF 800", correct: [
        {konto: "1000", seite: "soll"},
        {konto: "3600", seite: "haben"}
      ]},
      {text: "Stromrechnung auf Kredit CHF 450", correct: [
        {konto: "6200", seite: "soll"},
        {konto: "2000", seite: "haben"}
      ]}
    ],
    explain: "Barverkauf DL: Kasse/DL-Ertrag. Stromrechnung: Energieaufwand/Kreditoren."
  },

  // ══════════════════════════════════════════
  // T-KONTEN — weitere
  // ══════════════════════════════════════════
  {
    id: "tk03", topic: "buchungssatz", type: "tkonto", diff: 2, tax: "K3", reviewed: false,
    q: "Führen Sie das T-Konto «Kreditoren» und bestimmen Sie den Saldo.",
    geschaeftsfaelle: [
      "Wareneinkauf auf Kredit CHF 4'000",
      "Zahlung an Lieferant per Bank CHF 2'500",
      "Warenrücksendung (Gutschrift) CHF 300"
    ],
    konten: [{
      nr: "2000", name: "Kreditoren", ab: 6000,
      correctSoll: [
        {gegen: "1020", betrag: 2500, gf: 2},
        {gegen: "4200", betrag: 300, gf: 3}
      ],
      correctHaben: [
        {gegen: "4200", betrag: 4000, gf: 1}
      ],
      correctSaldo: {seite: "haben", betrag: 7200}
    }],
    gegenkonten: [
      {nr: "1020", name: "Bank"}, {nr: "4200", name: "Warenaufwand"},
      {nr: "1000", name: "Kasse"}, {nr: "3200", name: "Warenertrag"},
      {nr: "1100", name: "Debitoren"}
    ],
    explain: "AB 6'000 (Haben) + 4'000 (Wareneinkauf, Haben) = 10'000. Abzüglich 2'500 (Zahlung, Soll) + 300 (Rücksendung, Soll) = Saldo 7'200 Haben."
  },
  {
    id: "tk04", topic: "buchungssatz", type: "tkonto", diff: 3, tax: "K3", reviewed: false,
    q: "Führen Sie das T-Konto «Debitoren» und bestimmen Sie den Saldo.",
    geschaeftsfaelle: [
      "Warenverkauf auf Rechnung CHF 8'000",
      "Kunde bezahlt per Bank CHF 5'500",
      "Debitorenverlust (uneinbringliche Forderung) CHF 500"
    ],
    konten: [{
      nr: "1100", name: "Debitoren", ab: 3000,
      correctSoll: [
        {gegen: "3200", betrag: 8000, gf: 1}
      ],
      correctHaben: [
        {gegen: "1020", betrag: 5500, gf: 2},
        {gegen: "6700", betrag: 500, gf: 3}
      ],
      correctSaldo: {seite: "soll", betrag: 5000}
    }],
    gegenkonten: [
      {nr: "3200", name: "Warenertrag"}, {nr: "1020", name: "Bank"},
      {nr: "6700", name: "Debitorenverluste"}, {nr: "1000", name: "Kasse"},
      {nr: "2000", name: "Kreditoren"}
    ],
    explain: "AB 3'000 + 8'000 (Verkauf) = 11'000 Soll. Abzüglich 5'500 (Zahlung) + 500 (Verlust) = Saldo 5'000 Soll."
  },
  {
    id: "tk05", topic: "erfolgsrechnung", type: "tkonto", diff: 2, tax: "K3", reviewed: false,
    q: "Führen Sie das T-Konto «Warenaufwand» und bestimmen Sie den Saldo.",
    geschaeftsfaelle: [
      "Wareneinkauf bar CHF 1'200",
      "Wareneinkauf auf Kredit CHF 3'500",
      "Warenrücksendung an Lieferant CHF 400"
    ],
    konten: [{
      nr: "4200", name: "Warenaufwand",
      correctSoll: [
        {gegen: "1000", betrag: 1200, gf: 1},
        {gegen: "2000", betrag: 3500, gf: 2}
      ],
      correctHaben: [
        {gegen: "2000", betrag: 400, gf: 3}
      ],
      correctSaldo: {seite: "soll", betrag: 4300}
    }],
    gegenkonten: [
      {nr: "1000", name: "Kasse"}, {nr: "2000", name: "Kreditoren"},
      {nr: "1020", name: "Bank"}, {nr: "3200", name: "Warenertrag"}
    ],
    explain: "Einkauf bar 1'200 + Einkauf Kredit 3'500 = 4'700 Soll. Abzüglich Rücksendung 400 = Saldo 4'300 Soll."
  },

  // ══════════════════════════════════════════
  // BILANZ — weitere
  // ══════════════════════════════════════════
  {
    id: "bi03", topic: "bilanz", type: "bilanz", diff: 2, tax: "K3", reviewed: false,
    q: "Erstellen Sie die Schlussbilanz und berechnen Sie die Bilanzsumme.",
    modus: "bilanz",
    kontenMitSaldi: [
      {nr: "1000", name: "Kasse", saldo: 2000},
      {nr: "1020", name: "Bank", saldo: 18000},
      {nr: "1100", name: "Debitoren", saldo: 5000},
      {nr: "1500", name: "Maschinen", saldo: 40000},
      {nr: "2000", name: "Kreditoren", saldo: 15000},
      {nr: "2400", name: "Bankdarlehen", saldo: 25000},
      {nr: "2800", name: "Eigenkapital", saldo: 25000}
    ],
    correct: {
      aktiven: ["1000", "1020", "1100", "1500"],
      passiven: ["2000", "2400", "2800"],
      bilanzsumme: 65000
    },
    explain: "Aktiven: Kasse 2'000 + Bank 18'000 + Debitoren 5'000 + Maschinen 40'000 = 65'000. Passiven: Kreditoren 15'000 + Bankdarlehen 25'000 + EK 25'000 = 65'000."
  },
  {
    id: "bi04", topic: "bilanz", type: "bilanz", diff: 3, tax: "K3", reviewed: false,
    q: "Erstellen Sie die Schlussbilanz. Achtung: Es sind auch Wertberichtigungskonten dabei!",
    modus: "bilanz",
    kontenMitSaldi: [
      {nr: "1020", name: "Bank", saldo: 12000},
      {nr: "1100", name: "Debitoren", saldo: 8000},
      {nr: "1500", name: "Maschinen", saldo: 50000},
      {nr: "1510", name: "WB Maschinen", saldo: -10000},
      {nr: "2000", name: "Kreditoren", saldo: 18000},
      {nr: "2800", name: "Eigenkapital", saldo: 42000}
    ],
    correct: {
      aktiven: ["1020", "1100", "1500", "1510"],
      passiven: ["2000", "2800"],
      bilanzsumme: 60000
    },
    explain: "Aktiven: Bank 12'000 + Debitoren 8'000 + Maschinen 50'000 − WB Maschinen 10'000 = 60'000. Passiven: Kreditoren 18'000 + EK 42'000 = 60'000. Die WB ist ein Minusaktivkonto und steht auf der Aktivseite (mit negativem Betrag)."
  },

  // ══════════════════════════════════════════
  // AUFGABENGRUPPEN — weitere
  // ══════════════════════════════════════════
  {
    id: "ag03", topic: "warenkonten", type: "gruppe", diff: 2, tax: "K3", reviewed: false,
    q: "Die Gärtnerei Blüm hat im März folgende Geschäftsfälle:",
    context: "Anfangsbestand Warenvorrat: CHF 12'000. Bank: CHF 30'000.",
    teil: [
      {
        sub: "a", type: "buchungssatz",
        q: "Buchen Sie: Wareneinkauf auf Kredit CHF 5'000.",
        konten: [
          {nr: "4200", name: "Warenaufwand"}, {nr: "2000", name: "Kreditoren"},
          {nr: "1020", name: "Bank"}, {nr: "3200", name: "Warenertrag"}
        ],
        correct: [{soll: "4200", haben: "2000", betrag: 5000}],
        explain: "Warenaufwand/Kreditoren 5'000."
      },
      {
        sub: "b", type: "buchungssatz",
        q: "Buchen Sie: Warenverkauf bar CHF 8'500.",
        konten: [
          {nr: "1000", name: "Kasse"}, {nr: "1100", name: "Debitoren"},
          {nr: "3200", name: "Warenertrag"}, {nr: "4200", name: "Warenaufwand"}
        ],
        correct: [{soll: "1000", haben: "3200", betrag: 8500}],
        explain: "Kasse/Warenertrag 8'500."
      },
      {
        sub: "c", type: "calc",
        q: "Berechnen Sie den Bruttogewinn (Warenertrag − Warenaufwand).",
        rows: [{label: "Bruttogewinn", answer: 3500, tolerance: 0, unit: "CHF"}],
        explain: "8'500 (Ertrag) − 5'000 (Aufwand) = 3'500 CHF Bruttogewinn."
      }
    ],
    explain: "Der Bruttogewinn ist die Differenz zwischen Warenertrag und Warenaufwand — die erste Stufe der dreistufigen Erfolgsrechnung."
  },
  {
    id: "ag04", topic: "wertberichtigungen", type: "gruppe", diff: 3, tax: "K3", reviewed: false,
    q: "Zum Jahresabschluss sind folgende Abschreibungen zu verbuchen:",
    context: "Maschinen: Anschaffungswert CHF 60'000, bisherige Abschreibungen CHF 20'000. Abschreibungssatz: 20% linear vom Anschaffungswert.",
    teil: [
      {
        sub: "a", type: "calc",
        q: "Berechnen Sie den Buchwert der Maschinen vor der Abschreibung.",
        rows: [{label: "Buchwert", answer: 40000, tolerance: 0, unit: "CHF"}],
        explain: "60'000 − 20'000 = 40'000 CHF."
      },
      {
        sub: "b", type: "calc",
        q: "Berechnen Sie den Abschreibungsbetrag (20% vom Anschaffungswert).",
        rows: [{label: "Abschreibung", answer: 12000, tolerance: 0, unit: "CHF"}],
        explain: "60'000 × 20% = 12'000 CHF."
      },
      {
        sub: "c", type: "buchungssatz",
        q: "Buchen Sie die Abschreibung (direkte Methode).",
        konten: [
          {nr: "6800", name: "Abschreibungen"}, {nr: "1500", name: "Maschinen"},
          {nr: "1510", name: "WB Maschinen"}, {nr: "1020", name: "Bank"}
        ],
        correct: [{soll: "6800", haben: "1500", betrag: 12000}],
        explain: "Direkte Abschreibung: Abschreibungen/Maschinen 12'000."
      },
      {
        sub: "d", type: "calc",
        q: "Wie hoch ist der Buchwert nach der Abschreibung?",
        rows: [{label: "Neuer Buchwert", answer: 28000, tolerance: 0, unit: "CHF"}],
        explain: "40'000 − 12'000 = 28'000 CHF."
      }
    ],
    explain: "Lineare Abschreibung: Jedes Jahr wird ein fester Prozentsatz des Anschaffungswerts abgeschrieben. Nach dieser Abschreibung beträgt der Buchwert noch CHF 28'000."
  },
  {
    id: "ag05", topic: "abgrenzungen", type: "gruppe", diff: 3, tax: "K3", reviewed: false,
    q: "Am 31. Dezember sind folgende Abgrenzungen vorzunehmen:",
    context: "Am 1. Oktober wurde die Jahresversicherung von CHF 6'000 bezahlt (bereits verbucht als Versicherungsaufwand/Bank).",
    teil: [
      {
        sub: "a", type: "calc",
        q: "Welcher Anteil der Versicherung betrifft das Folgejahr (Jan–Sep)?",
        rows: [{label: "Anteil Folgejahr", answer: 4500, tolerance: 0, unit: "CHF"}],
        explain: "9/12 × 6'000 = 4'500 CHF (Jan–Sep)."
      },
      {
        sub: "b", type: "buchungssatz",
        q: "Buchen Sie die Transitorische Aktive per 31.12.",
        konten: [
          {nr: "1300", name: "Trans. Aktiven"}, {nr: "2300", name: "Trans. Passiven"},
          {nr: "6100", name: "Versicherungsaufwand"}, {nr: "1020", name: "Bank"}
        ],
        correct: [{soll: "1300", haben: "6100", betrag: 4500}],
        explain: "Transitorische Aktiven/Versicherungsaufwand 4'500."
      },
      {
        sub: "c", type: "tf",
        q: "Im neuen Jahr wird die TA aufgelöst: Versicherungsaufwand an Transitorische Aktiven.",
        correct: true,
        explain: "Richtig. Im Folgejahr wird die TA aufgelöst und der Aufwand dem neuen Jahr belastet."
      }
    ],
    explain: "Vorausbezahlte Aufwände müssen periodengerecht abgegrenzt werden. Der Anteil für das Folgejahr wird als Transitorische Aktive erfasst."
  },

  // ===== INTERAKTIVE FRAGETYPEN =====
  {
    id: "beschriftung01", topic: "bilanz", type: "bildbeschriftung", diff: 2, tax: "K2", reviewed: false,
    q: "Beschrifte die sechs Bereiche der Bilanz.",
    img: { src: "img/bwl/fibu/fibu_bilanz_beschriftung.svg", alt: "T-förmige Bilanzstruktur ohne Beschriftungen" },
    labels: [
      { id: "l1", text: "Umlaufvermögen (UV)", x: 27, y: 38 },
      { id: "l2", text: "Anlagevermögen (AV)", x: 27, y: 68 },
      { id: "l3", text: "Fremdkapital kurzfristig (FKk)", x: 73, y: 32 },
      { id: "l4", text: "Fremdkapital langfristig (FKl)", x: 73, y: 51 },
      { id: "l5", text: "Eigenkapital (EK)", x: 73, y: 71 },
      { id: "l6", text: "Bilanzsumme = Aktiven = Passiven", x: 50, y: 86 }
    ],
    explain: "Bilanz: Links Aktiven (UV oben, AV unten), rechts Passiven (FK oben, EK unten). UV = Kasse, Bank, Debitoren, Vorräte. AV = Maschinen, Gebäude, Fahrzeuge. FKk = Kreditoren, kurzfr. Darlehen. FKl = Hypothek. EK = Eigenkapital, Gewinnvortrag."
  },
  {
    id: "dragdrop01", topic: "bilanz", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
    q: "Ordne die folgenden Konten der richtigen Bilanzseite zu.",
    img: { src: "img/bwl/fibu/fibu_konten_dragdrop.svg", alt: "Vier Bilanzpositionen: Umlaufverm., Anlageverm., Fremdkapital, Eigenkapital" },
    zones: [
      { id: "uv", x: 2.5, y: 14, w: 22, h: 82 },
      { id: "av", x: 26, y: 14, w: 22, h: 82 },
      { id: "fk", x: 49.5, y: 14, w: 22, h: 82 },
      { id: "ek", x: 73, y: 14, w: 25, h: 82 }
    ],
    labels: [
      { id: "lb1", text: "Kasse", zone: "uv" },
      { id: "lb2", text: "Bank", zone: "uv" },
      { id: "lb3", text: "Debitoren", zone: "uv" },
      { id: "lb4", text: "Maschinen", zone: "av" },
      { id: "lb5", text: "Fahrzeuge", zone: "av" },
      { id: "lb6", text: "Mobiliar", zone: "av" },
      { id: "lb7", text: "Kreditoren", zone: "fk" },
      { id: "lb8", text: "Hypothek", zone: "fk" },
      { id: "lb9", text: "Darlehen (langfristig)", zone: "fk" },
      { id: "lb10", text: "Eigenkapital", zone: "ek" },
      { id: "lb11", text: "Gewinnvortrag", zone: "ek" }
    ],
    explain: "UV: Liquide Mittel + kurzfr. Forderungen (Kasse, Bank, Debitoren). AV: Langfr. Vermögenswerte (Maschinen, Fahrzeuge, Mobiliar). FK: Schulden (Kreditoren kurz, Hypothek/Darlehen lang). EK: Eigenkapital + Gewinnvortrag."
  }

];
