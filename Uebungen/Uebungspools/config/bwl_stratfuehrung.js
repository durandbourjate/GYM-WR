// ============================================================
// Pool: Strategische Unternehmensführung
// Fach: BWL | Stufe: SF GYM1
// Kapitel: HEP Betriebswirtschaftslehre 2023, Kap. 3.1–3.7
// ============================================================

window.POOL_META = {
  title: "Strategische Unternehmensführung",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM1"
};

window.TOPICS = {
  "einfuehrung":    {label: "Einführung & strategische Planung",       short: "Einführung"},
  "grundsaetze":    {label: "Vision, Werte, Leitbild & CSR",           short: "Grundsätze"},
  "analyse_intern": {label: "Unternehmensanalyse & Fähigkeitsanalyse", short: "Intern"},
  "analyse_extern": {label: "Umweltanalyse & 5-Kräfte-Modell",        short: "Extern"},
  "swot":           {label: "SWOT-Analyse",                            short: "SWOT"},
  "strategie":      {label: "Strategien & Unternehmensziele",          short: "Strategien"},
  "konzept":        {label: "Unternehmenskonzept & Evaluation",        short: "Konzept"}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: einfuehrung (Kap. 3.1 + 3.3)
  // ============================================================

  {
    id: "e01", topic: "einfuehrung", type: "mc", diff: 1, tax: "K1",
    q: "Was ist die zentrale Aufgabe der strategischen Unternehmensführung?",
    options: [
      {v: "A", t: "Langfristig denken und handeln, um den Erfolg des Unternehmens zu sichern"},
      {v: "B", t: "Die täglichen Arbeitsabläufe der Mitarbeitenden organisieren"},
      {v: "C", t: "Die Buchhaltung des Unternehmens führen"},
      {v: "D", t: "Die Löhne der Mitarbeitenden festlegen"}
    ],
    correct: "A",
    explain: "Die strategische Unternehmensführung ist für die Gesamtkoordination und -steuerung verantwortlich. Sie denkt langfristig und sichert den Erfolg auf lange Sicht. Die anderen Optionen beschreiben operative Aufgaben."
  },
  {
    id: "e02", topic: "einfuehrung", type: "tf", diff: 1, tax: "K1",
    q: "Die strategische Unternehmensführung ist den betrieblichen Funktionen wie Marketing oder Produktion übergeordnet.",
    correct: true,
    explain: "Die strategische Unternehmensführung bestimmt die längerfristigen (strategischen) Ziele und koordiniert die verschiedenen Funktionsbereiche auf diese Ziele hin."
  },
  {
    id: "e03", topic: "einfuehrung", type: "fill", diff: 1, tax: "K1",
    q: "Die strategische Planung erfolgt als Prozess in {0} aufeinanderfolgenden Schritten.",
    blanks: [
      {answer: "vier", alts: ["4"]}
    ],
    explain: "Die strategische Planung umfasst vier Schritte: 1. Analyse der Ausgangslage, 2. Entwicklung der Unternehmensstrategie, 3. Umsetzung der Strategie, 4. Evaluation."
  },
  {
    id: "e04", topic: "einfuehrung", type: "mc", diff: 2, tax: "K2",
    q: "Welche Reihenfolge beschreibt den Prozess der strategischen Planung korrekt?",
    options: [
      {v: "A", t: "Analyse → Strategieentwicklung → Umsetzung → Evaluation"},
      {v: "B", t: "Strategieentwicklung → Analyse → Evaluation → Umsetzung"},
      {v: "C", t: "Evaluation → Analyse → Umsetzung → Strategieentwicklung"},
      {v: "D", t: "Umsetzung → Evaluation → Analyse → Strategieentwicklung"}
    ],
    correct: "A",
    img: {src: "img/bwl/stratfuehrung/stratfuehrung_planungsprozess_01.svg", alt: "Kreisdiagramm: Prozess der strategischen Planung mit vier Phasen"},
    explain: "Der Prozess beginnt mit der Analyse der Ausgangslage (intern und extern), darauf folgt die Entwicklung der Strategie, dann deren Umsetzung und schliesslich die Evaluation. Werte, Vision und Leitbild bilden den Mittelpunkt."
  },
  {
    id: "e05", topic: "einfuehrung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zur strategischen Unternehmensführung treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Sie ist ein langfristiger, sich wiederholender Vorgang"},
      {v: "B", t: "Die Zukunft ist unsicher, deshalb muss man Entwicklungen einschätzen"},
      {v: "C", t: "Sie befasst sich nur mit dem Tagesgeschäft"},
      {v: "D", t: "Werte, Vision und Leitbild bilden den Mittelpunkt des Prozesses"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die strategische Planung ist langfristig und wiederholt sich. Werte, Vision und Leitbild bilden den Orientierungspunkt. Sie befasst sich gerade nicht mit dem Tagesgeschäft (C ist falsch), sondern mit der langfristigen Ausrichtung."
  },
  {
    id: "e06", topic: "einfuehrung", type: "tf", diff: 2, tax: "K2",
    q: "Der Prozess der strategischen Planung ist linear und wird nur einmal durchlaufen.",
    correct: false,
    explain: "Die strategische Planung ist ein zyklischer Prozess. Die Resultate der Evaluation fliessen wieder in den Prozess ein, wenn die strategische Planung von Neuem beginnt."
  },
  {
    id: "e07", topic: "einfuehrung", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter «digitaler Transformation» im Kontext der strategischen Unternehmensführung?",
    options: [
      {v: "A", t: "Die Einführung eines neuen Buchhaltungsprogramms"},
      {v: "B", t: "Die grundlegende Veränderung von Organisation und Geschäftsmodell durch Digitalisierung"},
      {v: "C", t: "Die Erstellung einer Website für das Unternehmen"},
      {v: "D", t: "Die Anschaffung neuer Computer für die Mitarbeitenden"}
    ],
    correct: "B",
    explain: "Digitale Transformation geht über einzelne IT-Massnahmen hinaus. Sie umfasst die grundlegende Veränderung von Organisation und Geschäftsmodell aufgrund der Digitalisierung — z.B. neue Produkte, neue Geschäftsfelder, neue Formen der Marktbearbeitung."
  },
  {
    id: "e08", topic: "einfuehrung", type: "mc", diff: 3, tax: "K4",
    q: "Eine Schule stellt ihre Notenverwaltung auf ein Online-System um und bietet Prüfungen via Webshop auch externen Personen an. Welche Stufe der Digitalisierung wird damit erreicht?",
    options: [
      {v: "A", t: "Nur Einführung digitaler Hilfsmittel in bestehende Prozesse"},
      {v: "B", t: "Digitale Vernetzung von Prozessen, aber kein neues Geschäftsmodell"},
      {v: "C", t: "Digitale Transformation: Neue Produkte und Geschäftsfelder werden erschlossen"},
      {v: "D", t: "Keine Digitalisierung, da es sich um eine Schule handelt"}
    ],
    correct: "C",
    explain: "Die Notenverwaltung online ist eine digitale Vernetzung bestehender Prozesse. Aber der Verkauf von Prüfungen an externe Personen über einen Webshop eröffnet ein völlig neues Geschäftsfeld — das entspricht der digitalen Transformation."
  },
  {
    id: "e09", topic: "einfuehrung", type: "tf", diff: 3, tax: "K5",
    q: "Ein Unternehmen ohne ausformulierte Strategie kann langfristig trotzdem erfolgreich sein, weil die Unternehmensleitung intuitiv richtig entscheidet.",
    correct: false,
    explain: "Zwar kann ein Unternehmen kurzfristig auch ohne formelle Strategie Erfolg haben. Langfristig ist dies jedoch riskant: Erst mit einer ausformulierten Strategie wird die Entwicklungsrichtung schriftlich festgelegt, für alle nachvollziehbar und systematisch überprüfbar. Viele Unternehmen scheitern gerade daran, dass sie keine oder keine realistische Strategie haben."
  },

  // ============================================================
  // TOPIC: grundsaetze (Kap. 3.2 — Vision, Leitbild, CSR)
  // ============================================================

  {
    id: "g01", topic: "grundsaetze", type: "mc", diff: 1, tax: "K1",
    q: "Was beschreibt eine Unternehmensvision?",
    options: [
      {v: "A", t: "Das gewünschte Zukunftsbild des Unternehmens"},
      {v: "B", t: "Den aktuellen Jahresabschluss"},
      {v: "C", t: "Die Organisationsstruktur des Unternehmens"},
      {v: "D", t: "Die Liste aller Produkte und Dienstleistungen"}
    ],
    correct: "A",
    explain: "Die Vision beschreibt das gewünschte Zukunftsbild des Unternehmens — wohin es sich langfristig entwickeln will. Sie dient als Orientierung für alle strategischen Entscheidungen."
  },
  {
    id: "g02", topic: "grundsaetze", type: "fill", diff: 1, tax: "K1",
    q: "Ein {0} enthält die Grundwerte und -prinzipien eines Unternehmens und dient als Orientierungshilfe für alle Beteiligten.",
    blanks: [
      {answer: "Leitbild", alts: ["Unternehmensleitbild"]}
    ],
    explain: "Das Leitbild (auch Unternehmensleitbild) formuliert die Grundwerte und -prinzipien eines Unternehmens. Es dient intern und extern als Orientierung."
  },
  {
    id: "g03", topic: "grundsaetze", type: "tf", diff: 1, tax: "K2",
    q: "Corporate Social Responsibility (CSR) bedeutet, dass Unternehmen Verantwortung gegenüber Gesellschaft und Umwelt wahrnehmen.",
    correct: true,
    explain: "CSR umfasst die freiwillige Übernahme gesellschaftlicher und ökologischer Verantwortung durch Unternehmen — über die gesetzlichen Pflichten hinaus."
  },
  {
    id: "g04", topic: "grundsaetze", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aspekte gehören zur Corporate Social Responsibility? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Faire Arbeitsbedingungen und Einhaltung der Menschenrechte"},
      {v: "B", t: "Maximierung des Aktienkurses um jeden Preis"},
      {v: "C", t: "Schonung der Umwelt und fairer Umgang mit der Konkurrenz"},
      {v: "D", t: "Transparenz und Berücksichtigung der Konsumenteninteressen"}
    ],
    correct: ["A", "C", "D"],
    explain: "CSR umfasst faire Arbeitsbedingungen, Menschenrechte, Umweltschutz, fairen Wettbewerb, Transparenz und Konsumenteninteressen. Die reine Profitmaximierung ohne Rücksicht auf diese Aspekte widerspricht dem CSR-Gedanken."
  },
  {
    id: "g05", topic: "grundsaetze", type: "mc", diff: 2, tax: "K2",
    q: "Welches Instrument wird eingesetzt, wenn ein Unternehmen einen verbindlichen Verhaltenskodex für alle Führungsstufen einführt?",
    options: [
      {v: "A", t: "Code of Conduct"},
      {v: "B", t: "SWOT-Analyse"},
      {v: "C", t: "Produkt-Markt-Matrix"},
      {v: "D", t: "Fähigkeitsanalyse"}
    ],
    correct: "A",
    explain: "Ein Code of Conduct (Verhaltenskodex) legt Handlungsrichtlinien für alle Ebenen fest. Er wird im Rahmen der Führung und in Mitarbeitergesprächen verankert und überprüft."
  },
  {
    id: "g06", topic: "grundsaetze", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Instrumente dienen der Umsetzung von CSR-Zielen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Nutzung von Gütesiegeln (z.B. Fairtrade, ASC)"},
      {v: "B", t: "Sponsoring von kulturellen oder sozialen Projekten"},
      {v: "C", t: "Erstellung eines Nachhaltigkeitsberichts"},
      {v: "D", t: "Einführung einer aggressiven Preisstrategie"}
    ],
    correct: ["A", "B", "C"],
    explain: "Gütesiegel, Sponsoring und Nachhaltigkeitsberichte sind typische CSR-Instrumente. Eine aggressive Preisstrategie ist eine Wettbewerbsstrategie, die nichts mit CSR zu tun hat."
  },
  {
    id: "g07", topic: "grundsaetze", type: "mc", diff: 3, tax: "K5",
    q: "Ein Ölkonzern veröffentlicht einen aufwendigen Nachhaltigkeitsbericht, investiert aber gleichzeitig Milliarden in neue Ölfelder. Wie ist dieses Verhalten aus CSR-Perspektive zu bewerten?",
    options: [
      {v: "A", t: "Vorbildliche CSR, weil der Bericht Transparenz schafft"},
      {v: "B", t: "Kritisch, weil CSR möglicherweise nur zur Imagepflege eingesetzt wird (Greenwashing)"},
      {v: "C", t: "Unproblematisch, weil CSR freiwillig ist"},
      {v: "D", t: "Positiv, weil jedes CSR-Engagement besser ist als gar keines"}
    ],
    correct: "B",
    explain: "CSR wird kritisch diskutiert, wenn Unternehmen es primär zur Verbesserung des Images oder zur Verhinderung neuer staatlicher Regulierungen einsetzen. Wenn die Kernstrategie den CSR-Zielen widerspricht, spricht man von Greenwashing."
  },
  {
    id: "g08", topic: "grundsaetze", type: "tf", diff: 3, tax: "K4",
    q: "CSR dient ausschliesslich der Verbesserung der Welt und hat keinen wirtschaftlichen Nutzen für das Unternehmen.",
    correct: false,
    explain: "CSR kann sich auch wirtschaftlich auszahlen: Durch verantwortungsvolles Handeln steigt das Ansehen bei Konsumenten, Investoren und Medien. Negative Berichte können sich via soziale Medien schnell verbreiten und dem Unternehmen schaden. CSR ist also auch ökonomisch sinnvoll."
  },
  {
    id: "g09", topic: "grundsaetze", type: "mc", diff: 3, tax: "K4",
    q: "Welche Anspruchsgruppen haben gemäss Lehrbuch beim Thema CSR unterschiedliche Interessen?",
    options: [
      {v: "A", t: "Nur die Aktionäre und die Unternehmensleitung"},
      {v: "B", t: "Gesellschaft/NGOs, Investoren, Konsumenten, Medien, Staat und das Unternehmen selbst"},
      {v: "C", t: "Nur die Konsumenten und der Staat"},
      {v: "D", t: "Nur die Mitarbeitenden und die Lieferanten"}
    ],
    correct: "B",
    explain: "Verschiedene Anspruchsgruppen haben unterschiedliche CSR-Interessen: Gesellschaft/NGOs fordern faire Arbeitsbedingungen, Investoren fordern Transparenz, Konsumenten wollen nachhaltige Produkte, Medien decken Missstände auf, der Staat vermittelt, und das Unternehmen will seine Strategie umsetzen."
  },

  // ============================================================
  // TOPIC: analyse_intern (Kap. 3.4 — Unternehmensanalyse)
  // ============================================================

  {
    id: "i01", topic: "analyse_intern", type: "mc", diff: 1, tax: "K1",
    q: "Was ist das Ziel der Unternehmensanalyse?",
    options: [
      {v: "A", t: "Die internen Stärken und Schwächen des Unternehmens erkennen"},
      {v: "B", t: "Die Konkurrenz ausspionieren"},
      {v: "C", t: "Einen Businessplan für die Bank erstellen"},
      {v: "D", t: "Neue Mitarbeitende rekrutieren"}
    ],
    correct: "A",
    explain: "Die Unternehmensanalyse durchleuchtet die internen Rahmenbedingungen. Ziel ist es, die Fähigkeiten zu bestimmen, die das Unternehmen von anderen abheben — sogenannte strategische Erfolgspotenziale."
  },
  {
    id: "i02", topic: "analyse_intern", type: "fill", diff: 1, tax: "K1",
    q: "Fähigkeiten und Kompetenzen, die es einem Unternehmen erlauben, im Vergleich zur Konkurrenz dauerhaft vorhandene Stärken aufzubauen, nennt man strategische {0}.",
    blanks: [
      {answer: "Erfolgspotenziale", alts: ["Erfolgspotentiale"]}
    ],
    explain: "Strategische Erfolgspotenziale sind Fähigkeiten und Kompetenzen, die dauerhaft Wettbewerbsvorteile gegenüber der Konkurrenz ermöglichen."
  },
  {
    id: "i03", topic: "analyse_intern", type: "tf", diff: 1, tax: "K2",
    q: "Bei der Fähigkeitsanalyse vergleicht ein Unternehmen seine Leistungen mit denen eines Hauptkonkurrenten.",
    correct: true,
    explain: "Die Fähigkeitsanalyse zeigt auf, in welchen Bereichen das Unternehmen gegenüber einem Hauptkonkurrenten Stärken besitzt und wo es Schwächen hat. Die Einschätzungen sollten möglichst mit objektiven Daten gestützt werden."
  },
  {
    id: "i04", topic: "analyse_intern", type: "multi", diff: 2, tax: "K2",
    q: "Welche Bereiche werden in einer Fähigkeitsanalyse typischerweise untersucht? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Marketing, Produktion, Forschung & Entwicklung"},
      {v: "B", t: "Finanzen, Personal, Führung/Organisation"},
      {v: "C", t: "Politische Rahmenbedingungen und Gesetzgebung"},
      {v: "D", t: "Innovationsfähigkeit, Know-how, Synergien"}
    ],
    correct: ["A", "B", "D"],
    img: {src: "img/bwl/stratfuehrung/stratfuehrung_faehigkeitsanalyse_01.svg", alt: "Raster einer Fähigkeitsanalyse mit verschiedenen Unternehmensbereichen"},
    explain: "Die Fähigkeitsanalyse untersucht interne Bereiche: Marketing, Produktion, F&E, Finanzen, Personal, Führung, Innovationsfähigkeit, Know-how und Synergien. Politische Rahmenbedingungen (C) gehören zur externen Umweltanalyse."
  },
  {
    id: "i05", topic: "analyse_intern", type: "mc", diff: 2, tax: "K3",
    q: "Ein Unternehmen stellt fest, dass seine Produktionsanlagen moderner sind als die des Hauptkonkurrenten, aber der Kundenservice schlechter bewertet wird. Was zeigt die Fähigkeitsanalyse?",
    options: [
      {v: "A", t: "Stärke bei Produktion, Schwäche beim Marketing/Kundenservice"},
      {v: "B", t: "Stärke bei Personal, Schwäche bei Finanzen"},
      {v: "C", t: "Chance im Marktumfeld, Gefahr durch Konkurrenz"},
      {v: "D", t: "Bedrohung durch Ersatzprodukte"}
    ],
    correct: "A",
    explain: "Die Fähigkeitsanalyse vergleicht mit dem Hauptkonkurrenten: Moderne Anlagen = Stärke bei Produktion, schlechterer Kundenservice = Schwäche im Bereich Marketing/Service. Chancen und Gefahren (C, D) gehören zur Umweltanalyse."
  },
  {
    id: "i06", topic: "analyse_intern", type: "tf", diff: 2, tax: "K2",
    q: "Ein Erfolgspotenzial wird erst dann zum echten Wettbewerbsvorteil, wenn es durch nachgelagerte Funktionen wie Leistungserstellung oder Marketing gewinnbringend umgesetzt wird.",
    correct: true,
    explain: "Ein Erfolgspotenzial allein genügt nicht. Es muss durch die nachgelagerten betrieblichen Funktionen (Produktion, Marketing, Vertrieb) in einen tatsächlichen Wettbewerbsvorteil am Markt umgesetzt werden."
  },
  {
    id: "i07", topic: "analyse_intern", type: "mc", diff: 3, tax: "K4",
    q: "Ein Softwareunternehmen hat hervorragende Programmierer (Know-how), aber eine veraltete Website und kaum Social-Media-Präsenz. Welche strategische Schlussfolgerung lässt die Fähigkeitsanalyse zu?",
    options: [
      {v: "A", t: "Das Know-how ist ein Erfolgspotenzial, das aber durch schwaches Marketing nicht in einen Wettbewerbsvorteil umgesetzt wird"},
      {v: "B", t: "Das Unternehmen hat keine Stärken"},
      {v: "C", t: "Die Schwäche im Marketing ist irrelevant, solange die Produkte gut sind"},
      {v: "D", t: "Das Unternehmen sollte die Programmierer entlassen"}
    ],
    correct: "A",
    explain: "Die Fähigkeitsanalyse zeigt eine klare Stärke (Know-how bei F&E) und eine klare Schwäche (Marketing). Das Potenzial wird nicht voll genutzt, weil die nachgelagerte Funktion Marketing das Produkt nicht ausreichend am Markt positioniert."
  },
  {
    id: "i08", topic: "analyse_intern", type: "mc", diff: 3, tax: "K5",
    q: "Warum sollten die Einschätzungen einer Fähigkeitsanalyse möglichst mit objektiven Daten gestützt werden?",
    options: [
      {v: "A", t: "Damit das Dokument für die Bank vorzeigbar ist"},
      {v: "B", t: "Weil subjektive Einschätzungen zu Fehlentscheidungen führen können"},
      {v: "C", t: "Weil die Konkurrenz die Analyse einsehen kann"},
      {v: "D", t: "Weil es gesetzlich vorgeschrieben ist"}
    ],
    correct: "B",
    explain: "Ohne objektive Daten besteht die Gefahr, die eigenen Stärken zu überschätzen oder Schwächen zu übersehen. Statistiken, Marktforschungsstudien und Publikationen helfen, ein realistisches Bild zu zeichnen und fundierte strategische Entscheidungen zu treffen."
  },

  // ============================================================
  // TOPIC: analyse_extern (Kap. 3.4 — Umweltanalyse, 5-Kräfte-Modell)
  // ============================================================

  {
    id: "x01", topic: "analyse_extern", type: "mc", diff: 1, tax: "K1",
    q: "Wer hat das Fünf-Kräfte-Modell zur Analyse der Wettbewerbsintensität entwickelt?",
    options: [
      {v: "A", t: "Michael Porter"},
      {v: "B", t: "Harry Ansoff"},
      {v: "C", t: "Peter Drucker"},
      {v: "D", t: "Adam Smith"}
    ],
    correct: "A",
    explain: "Michael Porter entwickelte das Fünf-Kräfte-Modell (Five Forces), mit dem die Wettbewerbsintensität eines Marktes analysiert wird."
  },
  {
    id: "x02", topic: "analyse_extern", type: "fill", diff: 1, tax: "K1",
    q: "Die Umweltanalyse untersucht die {0} Rahmenbedingungen eines Unternehmens.",
    blanks: [
      {answer: "externen", alts: ["äusseren", "ausseren"]}
    ],
    explain: "Im Gegensatz zur Unternehmensanalyse (intern) untersucht die Umweltanalyse die externen Rahmenbedingungen — also alles ausserhalb des Unternehmens: Markt, Konkurrenz, Trends, gesetzliche Entwicklungen."
  },
  {
    id: "x03", topic: "analyse_extern", type: "multi", diff: 1, tax: "K1",
    q: "Welche der folgenden gehören zu den fünf Wettbewerbskräften nach Porter? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Bestehende Rivalität im Markt"},
      {v: "B", t: "Verhandlungsmacht der Kunden"},
      {v: "C", t: "Technologische Umweltsphäre"},
      {v: "D", t: "Gefahr durch Ersatzprodukte"}
    ],
    correct: ["A", "B", "D"],
    img: {src: "img/bwl/stratfuehrung/stratfuehrung_porter_01.svg", alt: "Diagramm: Fünf-Kräfte-Modell nach Porter mit fünf Wettbewerbskräften"},
    explain: "Die fünf Kräfte sind: 1. Bestehende Rivalität, 2. Verhandlungsmacht der Kunden, 3. Verhandlungsmacht der Lieferanten, 4. Gefahr potenzieller neuer Konkurrenten, 5. Gefahr durch Ersatzprodukte. Die technologische Umweltsphäre (C) gehört zum Unternehmensmodell, nicht zu Porter."
  },
  {
    id: "x04", topic: "analyse_extern", type: "mc", diff: 2, tax: "K2",
    q: "Was misst die «Verhandlungsmacht der Kunden» im Fünf-Kräfte-Modell?",
    options: [
      {v: "A", t: "Ob Kunden über eine grosse Einkaufsmacht verfügen und leicht zur Konkurrenz wechseln können"},
      {v: "B", t: "Wie zufrieden die Kunden mit dem Produkt sind"},
      {v: "C", t: "Wie viele Kunden das Unternehmen hat"},
      {v: "D", t: "Ob die Kunden genug Geld haben, um das Produkt zu kaufen"}
    ],
    correct: "A",
    explain: "Die Verhandlungsmacht der Kunden beschreibt, ob Kunden Preisdruck ausüben können und wie leicht sie zur Konkurrenz wechseln können. Je höher die Verhandlungsmacht, desto schwieriger ist es für das Unternehmen, hohe Preise durchzusetzen."
  },
  {
    id: "x05", topic: "analyse_extern", type: "mc", diff: 2, tax: "K3",
    q: "In einem Markt mit vielen Anbietern standardisierter Produkte und niedrigen Eintrittsbarrieren — welche Wettbewerbskraft ist besonders hoch?",
    options: [
      {v: "A", t: "Verhandlungsmacht der Lieferanten"},
      {v: "B", t: "Bestehende Rivalität im Markt"},
      {v: "C", t: "Verhandlungsmacht der Kunden, aber nicht die Rivalität"},
      {v: "D", t: "Gefahr durch Ersatzprodukte, aber nicht durch neue Konkurrenten"}
    ],
    correct: "B",
    explain: "Viele Anbieter mit ähnlichen Produkten führen zu hoher Rivalität. Zudem erleichtern niedrige Eintrittsbarrieren den Markteintritt neuer Konkurrenten, was die Intensität weiter steigert."
  },
  {
    id: "x06", topic: "analyse_extern", type: "tf", diff: 2, tax: "K2",
    q: "Je stärker der Konkurrenzkampf in einem Markt, desto attraktiver ist dieser Markt für Unternehmen.",
    correct: false,
    explain: "Es ist umgekehrt: Je stärker der Konkurrenzkampf, desto grösser ist der Preisdruck und desto weniger attraktiv ist der Markt. Ein intensiver Wettbewerb drückt die Margen und erschwert es, Gewinne zu erzielen."
  },
  {
    id: "x07", topic: "analyse_extern", type: "mc", diff: 3, tax: "K4",
    q: "Die Migros steht im Schweizer Detailhandel im Wettbewerb mit Coop, Aldi, Lidl und Onlineanbietern. Warum ist die Verhandlungsmacht der Lieferanten gegenüber der Migros eher gering?",
    options: [
      {v: "A", t: "Weil die Migros als einer der grössten Abnehmer selbst Druck auf die Lieferanten ausüben kann"},
      {v: "B", t: "Weil die Migros keine Lieferanten hat"},
      {v: "C", t: "Weil die Lieferanten immer den besten Preis erhalten"},
      {v: "D", t: "Weil es gesetzlich so vorgeschrieben ist"}
    ],
    correct: "A",
    explain: "Die Migros ist eine der grössten Abnehmerin im Schweizer Detailhandel. Ihre Grösse gibt ihr starke Verhandlungsposition gegenüber den Lieferanten — sie kann Preise und Konditionen mitbestimmen. Dies führt teilweise zu Protesten (z.B. Bauernproteste)."
  },
  {
    id: "x08", topic: "analyse_extern", type: "mc", diff: 3, tax: "K4",
    q: "Netflix war ursprünglich ein DVD-Verleih per Post. Welche der fünf Kräfte nach Porter beschreibt die Bedrohung, die Netflix für traditionelle Videotheken darstellte?",
    options: [
      {v: "A", t: "Bestehende Rivalität im Markt"},
      {v: "B", t: "Gefahr durch Ersatzprodukte"},
      {v: "C", t: "Verhandlungsmacht der Lieferanten"},
      {v: "D", t: "Verhandlungsmacht der Kunden"}
    ],
    correct: "B",
    explain: "Netflix als Online-Streaming-Dienst war ein Ersatzprodukt für den klassischen Videoverleih. Es ersetzte die bestehende Dienstleistung durch eine technologisch neue Lösung — genau das beschreibt die «Gefahr durch Ersatzprodukte» im Porter-Modell."
  },
  {
    id: "x09", topic: "analyse_extern", type: "tf", diff: 3, tax: "K5",
    q: "Hohe Eintrittsbarrieren in einem Markt schützen bestehende Unternehmen, weil die Gefahr potenzieller neuer Konkurrenten dadurch sinkt.",
    correct: true,
    explain: "Hohe Eintrittsbarrieren (z.B. hoher Kapitalbedarf, starke Marken, Patente, knappe Verkaufsstandorte) erschweren den Markteintritt neuer Wettbewerber. Dies schützt die bestehenden Unternehmen vor zusätzlichem Konkurrenzdruck."
  },

  // ============================================================
  // TOPIC: swot (Kap. 3.4 — SWOT-Analyse)
  // ============================================================

  {
    id: "s01", topic: "swot", type: "fill", diff: 1, tax: "K1",
    q: "SWOT steht für: S = {0}, W = {1}, O = {2}, T = {3}.",
    blanks: [
      {answer: "Strengths", alts: ["Stärken"]},
      {answer: "Weaknesses", alts: ["Schwächen"]},
      {answer: "Opportunities", alts: ["Chancen"]},
      {answer: "Threats", alts: ["Gefahren", "Risiken"]}
    ],
    explain: "SWOT steht für Strengths (Stärken), Weaknesses (Schwächen), Opportunities (Chancen) und Threats (Gefahren). Stärken und Schwächen betreffen das Unternehmen selbst, Chancen und Gefahren das Umfeld."
  },
  {
    id: "s02", topic: "swot", type: "mc", diff: 1, tax: "K2",
    q: "Welcher Teil der SWOT-Analyse bezieht sich auf das Unternehmen selbst (intern)?",
    options: [
      {v: "A", t: "Stärken und Schwächen"},
      {v: "B", t: "Chancen und Gefahren"},
      {v: "C", t: "Stärken und Chancen"},
      {v: "D", t: "Schwächen und Gefahren"}
    ],
    correct: "A",
    explain: "Stärken (Strengths) und Schwächen (Weaknesses) beziehen sich auf das Unternehmen selbst — sie stammen aus der Unternehmensanalyse. Chancen und Gefahren stammen aus dem Marktumfeld (Umweltanalyse)."
  },
  {
    id: "s03", topic: "swot", type: "tf", diff: 1, tax: "K2",
    q: "Die SWOT-Analyse kombiniert die interne und die externe Sicht auf ein Unternehmen.",
    correct: true,
    explain: "Die SWOT-Analyse ist eine strategische Analyse, die die Ergebnisse der Unternehmensanalyse (Stärken/Schwächen) und der Umweltanalyse (Chancen/Gefahren) zusammenführt."
  },
  {
    id: "s04", topic: "swot", type: "mc", diff: 2, tax: "K2",
    q: "Was ist das Ziel der Kombination «Stärken treffen auf Chancen» in der SWOT-Matrix?",
    options: [
      {v: "A", t: "Eigene Stärken nutzen, um Chancen im Umfeld optimal auszuschöpfen"},
      {v: "B", t: "Schwächen abbauen, um Gefahren zu minimieren"},
      {v: "C", t: "Schwächen in Stärken umwandeln"},
      {v: "D", t: "Gefahren durch Stärken abwehren"}
    ],
    correct: "A",
    explain: "Wenn Stärken auf Chancen treffen, ist das der Idealfall: Das Unternehmen kann seine vorhandenen Stärken nutzen, um die sich bietenden Chancen optimal auszuschöpfen."
  },
  {
    id: "s05", topic: "swot", type: "mc", diff: 2, tax: "K2",
    q: "Welche Kombination in der SWOT-Matrix ist die gefährlichste für ein Unternehmen?",
    options: [
      {v: "A", t: "Stärken treffen auf Chancen"},
      {v: "B", t: "Stärken treffen auf Gefahren"},
      {v: "C", t: "Schwächen treffen auf Chancen"},
      {v: "D", t: "Schwächen treffen auf Gefahren"}
    ],
    correct: "D",
    explain: "Wenn Schwächen auf Gefahren treffen, ist das die gefährlichste Kombination. Das Unternehmen muss gleichzeitig Schwächen abbauen und Gefahren verringern — sonst drohen ernsthafte Probleme."
  },
  {
    id: "s06", topic: "swot", type: "multi", diff: 2, tax: "K3",
    q: "Ein Softdrinkhersteller hat einen guten Zugang zu Cafés und Tankstellen (Stärke) und ein qualitativ gutes Produkt (Stärke), aber hohe Produktionskosten (Schwäche) und schwaches Marketing (Schwäche). Welche sind Schwächen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Guter Zugang zu Cafés und Tankstellen"},
      {v: "B", t: "Hohe Produktionskosten und dadurch hoher Produktpreis"},
      {v: "C", t: "Qualitativ gutes Produkt"},
      {v: "D", t: "Schwaches Marketing"}
    ],
    correct: ["B", "D"],
    explain: "Hohe Produktionskosten (und dadurch hoher Preis) sowie schwaches Marketing sind interne Schwächen. Der gute Zugang zu Verkaufsstellen und die Produktqualität sind hingegen Stärken."
  },
  {
    id: "s07", topic: "swot", type: "mc", diff: 3, tax: "K4",
    q: "Ein Softdrinkhersteller hat die Schwäche «hohe Produktionskosten» und die Chance «Konsumenten kaufen vermehrt unterwegs ein». Welche strategische Handlung empfiehlt die SWOT-Logik?",
    options: [
      {v: "A", t: "Nichts tun, weil sich Schwäche und Chance aufheben"},
      {v: "B", t: "Die Schwäche abbauen (Kosten senken) oder in eine Stärke umwandeln, um die Chance zu nutzen"},
      {v: "C", t: "Die Chance ignorieren und sich auf Gefahren konzentrieren"},
      {v: "D", t: "Das Produkt vom Markt nehmen"}
    ],
    correct: "B",
    explain: "Bei der Kombination «Schwächen treffen auf Chancen» sollen Schwächen abgebaut oder in Stärken verwandelt werden, um die Chancen nutzen zu können. Hier: Produktionskosten senken, um vom Trend «Einkauf unterwegs» profitieren zu können."
  },
  {
    id: "s08", topic: "swot", type: "tf", diff: 3, tax: "K5",
    q: "Eine SWOT-Analyse ist nur dann sinnvoll, wenn sie auf einer fundierten Unternehmens- und Umweltanalyse basiert.",
    correct: true,
    explain: "Die SWOT-Analyse ist eine Zusammenführung der Ergebnisse aus der internen und externen Analyse. Ohne fundierte Datengrundlage (z.B. Fähigkeitsanalyse, Fünf-Kräfte-Modell) wäre die SWOT nur oberflächlich und könnte zu Fehlentscheidungen führen."
  },
  {
    id: "s09", topic: "swot", type: "mc", diff: 3, tax: "K4",
    q: "Auf der Basis der SWOT-Analyse wird die Unternehmensstrategie entwickelt. Was sollte die Strategie idealerweise bewirken?",
    options: [
      {v: "A", t: "Stärken und Chancen maximieren, Schwächen und Gefahren minimieren"},
      {v: "B", t: "Alle Schwächen akzeptieren und nur auf Stärken setzen"},
      {v: "C", t: "Alle Gefahren ignorieren und nur Chancen verfolgen"},
      {v: "D", t: "Stärken abbauen, um flexibler zu werden"}
    ],
    correct: "A",
    explain: "Die Unternehmensstrategie sollte die Stärken und Chancen maximieren und gleichzeitig Schwächen abbauen sowie Gefahren minimieren. Nur so kann das Unternehmen langfristig erfolgreich sein."
  },

  // ============================================================
  // TOPIC: strategie (Kap. 3.5 — Ziele, Produkt-Markt-Matrix, Wettbewerbsstrategien)
  // ============================================================

  {
    id: "t01", topic: "strategie", type: "multi", diff: 1, tax: "K1",
    q: "Unternehmensziele lassen sich in drei Kategorien einteilen. Welche? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Leistungswirtschaftliche Ziele"},
      {v: "B", t: "Finanzwirtschaftliche Ziele"},
      {v: "C", t: "Soziale und ökologische Ziele"},
      {v: "D", t: "Politische Ziele"}
    ],
    correct: ["A", "B", "C"],
    explain: "Unternehmensziele werden in drei Kategorien gegliedert: leistungswirtschaftlich (Marktanteil, Produkte), finanzwirtschaftlich (Gewinn, Rendite, Liquidität) und sozial/ökologisch (Mitarbeitende, Umwelt)."
  },
  {
    id: "t02", topic: "strategie", type: "mc", diff: 1, tax: "K1",
    q: "Von wem stammt die Produkt-Markt-Matrix?",
    options: [
      {v: "A", t: "Harry Ansoff"},
      {v: "B", t: "Michael Porter"},
      {v: "C", t: "Peter Drucker"},
      {v: "D", t: "Philip Kotler"}
    ],
    correct: "A",
    explain: "Die Produkt-Markt-Matrix wurde von Harry Ansoff entwickelt. Sie zeigt vier Strategiemöglichkeiten, je nachdem ob bestehende oder neue Produkte auf bestehenden oder neuen Märkten angeboten werden."
  },
  {
    id: "t03", topic: "strategie", type: "fill", diff: 1, tax: "K1",
    q: "Bei der {0} werden bestehende Märkte mit bisherigen Produkten intensiver bearbeitet, z.B. durch verstärktes Marketing.",
    blanks: [
      {answer: "Marktdurchdringung", alts: ["Marktpenetration"]}
    ],
    explain: "Marktdurchdringung (Ansoff) bedeutet: Bestehende Produkte auf bestehenden Märkten intensiver verkaufen — z.B. durch mehr Werbung, Aktionen oder besseren Service, um Marktanteile zu gewinnen."
  },
  {
    id: "t04", topic: "strategie", type: "mc", diff: 2, tax: "K2",
    q: "Ein Unternehmen bringt ein völlig neues Produkt auf einen Markt, den es noch nicht bearbeitet hat. Welche Ansoff-Strategie verfolgt es?",
    options: [
      {v: "A", t: "Marktdurchdringung"},
      {v: "B", t: "Marktentwicklung"},
      {v: "C", t: "Produktentwicklung"},
      {v: "D", t: "Diversifikation"}
    ],
    correct: "D",
    img: {src: "img/bwl/stratfuehrung/stratfuehrung_ansoff_01.svg", alt: "Produkt-Markt-Matrix nach Ansoff mit vier Strategiefeldern"},
    explain: "Diversifikation = neues Produkt + neuer Markt. Die riskanteste Strategie nach Ansoff, da weder Produkt- noch Markterfahrung vorhanden ist."
  },
  {
    id: "t05", topic: "strategie", type: "multi", diff: 2, tax: "K2",
    q: "Welche drei Formen der Diversifikation werden unterschieden? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Horizontale Diversifikation"},
      {v: "B", t: "Vertikale Diversifikation"},
      {v: "C", t: "Laterale Diversifikation"},
      {v: "D", t: "Diagonale Diversifikation"}
    ],
    correct: ["A", "B", "C"],
    explain: "Es werden drei Formen unterschieden: Horizontal (neue Produkte im Zusammenhang mit bisherigen), vertikal (Übernahme von vor-/nachgelagerten Stufen) und lateral (völlig neues Geschäftsfeld ohne Zusammenhang). Diagonale Diversifikation (D) gibt es als Fachbegriff nicht."
  },
  {
    id: "t06", topic: "strategie", type: "mc", diff: 2, tax: "K3",
    q: "Victorinox stellt neben Messern neu auch Uhren, Reisegepäck und Parfüms her. Welche Form der Diversifikation liegt vor?",
    options: [
      {v: "A", t: "Horizontale Diversifikation"},
      {v: "B", t: "Vertikale Diversifikation"},
      {v: "C", t: "Laterale Diversifikation"},
      {v: "D", t: "Marktdurchdringung"}
    ],
    correct: "A",
    explain: "Victorinox erweitert sein Sortiment mit Produkten, die thematisch im Zusammenhang mit der Marke stehen (Swiss Quality, Lifestyle). Es handelt sich um horizontale Diversifikation, da Synergien mit dem bisherigen Markenimage genutzt werden können."
  },
  {
    id: "t07", topic: "strategie", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter einer Differenzierungsstrategie nach Porter?",
    options: [
      {v: "A", t: "Sich durch Qualität, Service oder Image von der Konkurrenz abheben"},
      {v: "B", t: "Die Preise unter die der Konkurrenz senken"},
      {v: "C", t: "Sich auf eine kleine Nische konzentrieren"},
      {v: "D", t: "Neue Märkte erschliessen"}
    ],
    correct: "A",
    explain: "Bei der Differenzierungsstrategie versucht ein Unternehmen, sich durch einzigartige Produkteigenschaften (USP) oder einzigartige Kommunikation (UAP) von der Konkurrenz abzuheben und so dem Preiswettbewerb zu entkommen."
  },
  {
    id: "t08", topic: "strategie", type: "fill", diff: 2, tax: "K1",
    q: "USP steht für {0} und beschreibt ein einmaliges Verkaufsargument basierend auf Produkteigenschaften.",
    blanks: [
      {answer: "Unique Selling Proposition", alts: ["unique selling proposition"]}
    ],
    explain: "USP (Unique Selling Proposition) = einmaliges Verkaufsargument. Es basiert auf herausragenden Eigenschaften des Produkts oder der Dienstleistung (z.B. besonderes Design, lange Lebensdauer, besonderer Service)."
  },
  {
    id: "t09", topic: "strategie", type: "mc", diff: 3, tax: "K4",
    q: "Red Bull differenziert sich nicht primär über Produkteigenschaften, sondern über seine Verbindung mit Extremsport-Events. Welche Art der Differenzierung liegt vor?",
    options: [
      {v: "A", t: "USP — Differenzierung über Produkteigenschaften"},
      {v: "B", t: "UAP — Differenzierung über Kommunikation und Image"},
      {v: "C", t: "Aggressive Preisstrategie"},
      {v: "D", t: "Nischenstrategie"}
    ],
    correct: "B",
    explain: "Red Bull setzt auf eine UAP (Unique Advertising Proposition) — ein einmaliges Kommunikationsargument. Die Verbindung mit Extremsport schafft ein emotionales Image, das sich von der Konkurrenz abhebt, obwohl das Produkt (Energydrink) an sich austauschbar wäre."
  },
  {
    id: "t10", topic: "strategie", type: "mc", diff: 3, tax: "K4",
    q: "Aldi, Denner und Lidl verfolgen eine aggressive Preisstrategie. Welche Voraussetzung ist dafür zwingend nötig?",
    options: [
      {v: "A", t: "Ein besonders innovatives Produktsortiment"},
      {v: "B", t: "Die Fähigkeit, die Kosten dauerhaft tief zu halten"},
      {v: "C", t: "Ein starkes Markenimage bei Premiumkunden"},
      {v: "D", t: "Möglichst wenige Filialen, um Kosten zu sparen"}
    ],
    correct: "B",
    explain: "Eine aggressive Preisstrategie (Kostenführerschaft) kann nur von Unternehmen verfolgt werden, die ihre Kosten dauerhaft tief halten können. Sonst verkauft man unter den Herstellkosten und macht Verlust. Discounter erreichen dies durch Standardisierung, hohe Stückzahlen und schlanke Prozesse."
  },
  {
    id: "t11", topic: "strategie", type: "tf", diff: 3, tax: "K5",
    q: "Bei einer Nischenstrategie kann auch ein kleines Unternehmen gegen grosse Konzerne bestehen, wenn es sich auf einen spezifischen Teilmarkt spezialisiert.",
    correct: true,
    explain: "Die Nischenstrategie ermöglicht es auch kleineren Unternehmen, attraktive Gewinne zu erzielen. In einer Nische stellen die Kunden spezifische Ansprüche, die von den grossen Gesamtmarktanbietern nicht bedient werden. Spezialisierte Kompetenz schirmt die Nische ab."
  },

  // ============================================================
  // TOPIC: konzept (Kap. 3.6 + 3.7 — Unternehmenskonzept & Evaluation)
  // ============================================================

  {
    id: "k01", topic: "konzept", type: "mc", diff: 1, tax: "K1",
    q: "Was beschreibt ein Unternehmenskonzept?",
    options: [
      {v: "A", t: "Die konkreten Ziele, Mittel und Methoden zur Umsetzung der Strategie"},
      {v: "B", t: "Die Vision und das Leitbild des Unternehmens"},
      {v: "C", t: "Die SWOT-Analyse des Unternehmens"},
      {v: "D", t: "Die Buchhaltung des Unternehmens"}
    ],
    correct: "A",
    explain: "Das Unternehmenskonzept formuliert die Unternehmensstrategie aus. Es beschreibt die konkreten Ziele und gibt den Mitarbeitenden Auskunft über die Mittel und die Methoden, wie die Strategie umgesetzt werden soll."
  },
  {
    id: "k02", topic: "konzept", type: "multi", diff: 1, tax: "K1",
    q: "Das Unternehmenskonzept umfasst Ziele, Mittel und Methoden in drei Bereichen. Welche? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Leistungswirtschaftlicher Bereich"},
      {v: "B", t: "Finanzwirtschaftlicher Bereich"},
      {v: "C", t: "Sozialer und ökologischer Bereich"},
      {v: "D", t: "Politischer Bereich"}
    ],
    correct: ["A", "B", "C"],
    explain: "Das Unternehmenskonzept gliedert sich in drei Bereiche: leistungswirtschaftlich (Produkte, Märkte, Produktion), finanzwirtschaftlich (Gewinn, Kapital, Wirtschaftlichkeit) und sozial/ökologisch (Mitarbeitende, Gesellschaft, Umwelt)."
  },
  {
    id: "k03", topic: "konzept", type: "fill", diff: 1, tax: "K1",
    q: "Die Evaluation bildet den {0} im Prozess der strategischen Planung.",
    blanks: [
      {answer: "Abschluss", alts: ["letzten Schritt", "Schluss"]}
    ],
    explain: "Die Evaluation ist der vierte und letzte Schritt der strategischen Planung. Sie überprüft, ob die Umsetzung erfolgreich war und die gesteckten Ziele erreicht wurden."
  },
  {
    id: "k04", topic: "konzept", type: "mc", diff: 2, tax: "K2",
    q: "Was gehört zum leistungswirtschaftlichen Bereich eines Unternehmenskonzepts?",
    options: [
      {v: "A", t: "Marktziele, Produktziele und Imageziele"},
      {v: "B", t: "Gewinnziele und Kapitalstruktur"},
      {v: "C", t: "Mitarbeiterbezogene Ziele und Umweltschutz"},
      {v: "D", t: "Steuerstrategie und Dividendenpolitik"}
    ],
    correct: "A",
    explain: "Der leistungswirtschaftliche Bereich umfasst Ziele zu Produkten, Märkten und Image. Gewinn und Kapital gehören zum finanzwirtschaftlichen Bereich, Mitarbeitende und Umwelt zum sozialen Bereich."
  },
  {
    id: "k05", topic: "konzept", type: "multi", diff: 2, tax: "K2",
    q: "Auf welchen drei Ebenen erfolgt die Strategiekontrolle bei der Evaluation? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kontrolle der zugrunde liegenden Annahmen"},
      {v: "B", t: "Kontrolle der Umsetzung"},
      {v: "C", t: "Kontrolle der Wirksamkeit (Soll-Ist-Vergleich)"},
      {v: "D", t: "Kontrolle der Mitarbeiterleistung"}
    ],
    correct: ["A", "B", "C"],
    explain: "Die Strategiekontrolle erfolgt auf drei Ebenen: 1. Stimmen die anfänglichen Annahmen noch? 2. Gibt es Widerstände oder Schwierigkeiten bei der Umsetzung? 3. Wurden die Ziele erreicht (Soll-Ist-Vergleich)? Die Mitarbeiterleistung wird im operativen Controlling beurteilt."
  },
  {
    id: "k06", topic: "konzept", type: "mc", diff: 2, tax: "K3",
    q: "Ein Cupcake-Startup definiert als Ziel: «Wir wollen im ersten Jahr 100'000 CHF Umsatz erzielen.» In welchen Bereich des Unternehmenskonzepts gehört dieses Ziel?",
    options: [
      {v: "A", t: "Leistungswirtschaftlicher Bereich"},
      {v: "B", t: "Finanzwirtschaftlicher Bereich"},
      {v: "C", t: "Sozialer Bereich"},
      {v: "D", t: "Keiner — Umsatz gehört nicht ins Konzept"}
    ],
    correct: "B",
    explain: "Ein Umsatzziel ist ein finanzwirtschaftliches Ziel. Es gehört in den finanzwirtschaftlichen Bereich des Unternehmenskonzepts, zusammen mit Gewinn-, Kapital- und Wirtschaftlichkeitszielen."
  },
  {
    id: "k07", topic: "konzept", type: "tf", diff: 2, tax: "K2",
    q: "Bei der Umsetzung der Strategie genügt es, wenn nur die obere Führungsebene die Strategie kennt.",
    correct: false,
    explain: "Die Vision, Ziele und Strategie müssen allen Mitarbeitenden nachvollziehbar und stufengerecht kommuniziert werden. Nur wenn alle die gleiche Richtung kennen, können sie auch bei Schwierigkeiten an der Strategie arbeiten. Es muss ein gemeinsames Verständnis geschaffen werden."
  },
  {
    id: "k08", topic: "konzept", type: "mc", diff: 3, tax: "K4",
    q: "Das Cupcake-Startup stellt nach 6 Monaten fest, dass die Nachfrage nach veganen Cupcakes viel höher ist als erwartet, aber das ursprüngliche Sortiment kaum vegane Optionen enthält. Welche Ebene der Evaluation ist betroffen?",
    options: [
      {v: "A", t: "Kontrolle der zugrunde liegenden Annahmen — die Markteinschätzung war falsch"},
      {v: "B", t: "Kontrolle der Umsetzung — die Produktion funktioniert nicht"},
      {v: "C", t: "Kontrolle der Wirksamkeit — der Umsatz stimmt nicht"},
      {v: "D", t: "Keine Ebene — alles läuft planmässig"}
    ],
    correct: "A",
    explain: "Die anfängliche Annahme über die Nachfrage (wenig Bedarf an veganen Cupcakes) hat sich als falsch erwiesen. Dies fällt unter die «Kontrolle der zugrunde liegenden Annahmen». Die Strategie muss entsprechend angepasst werden."
  },
  {
    id: "k09", topic: "konzept", type: "mc", diff: 3, tax: "K5",
    q: "Warum ist es wichtig, dass ein Unternehmenskonzept nicht nur die Ziele, sondern auch die Mittel und Verfahren enthält?",
    options: [
      {v: "A", t: "Weil Ziele ohne konkrete Mittel und Verfahren abstrakt bleiben und nicht umgesetzt werden können"},
      {v: "B", t: "Weil es gesetzlich vorgeschrieben ist"},
      {v: "C", t: "Weil die Bank es für den Kredit verlangt"},
      {v: "D", t: "Weil nur so die Konkurrenz eingeschüchtert werden kann"}
    ],
    correct: "A",
    explain: "Ein abstraktes Strategiedokument nützt wenig, wenn nicht klar ist, wie die Ziele konkret erreicht werden sollen. Mittel (Ressourcen) und Verfahren (Methoden) machen die Strategie operationalisierbar — sie zeigen den Mitarbeitenden, was zu tun ist."
  },
  {
    id: "k10", topic: "konzept", type: "tf", diff: 3, tax: "K4",
    q: "Die Evaluation findet erst statt, wenn die gesamte Strategie vollständig umgesetzt wurde.",
    correct: false,
    explain: "Die Evaluation findet nicht nur am Schluss statt. Vielmehr finden Umsetzung, Evaluation und Kontrolle zeitlich parallel statt. So können korrigierende Rückkopplungen frühzeitig vorgenommen werden, statt erst am Ende festzustellen, dass etwas schiefgelaufen ist."
  }
];
