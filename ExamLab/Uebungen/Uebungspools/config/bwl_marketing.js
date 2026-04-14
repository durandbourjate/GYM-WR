// =====================================================
// Pool: Markt- und Leistungsanalyse (BWL Kapitel 4)
// Fach: BWL | Stufe: SF GYM3
// Lehrmittel: HEP Betriebswirtschaftslehre 2023, K 4.1–4.2
// Erstellt: 2026-02-20
// =====================================================

window.POOL_META = {
  id: "bwl_marketing",
  title: "Markt- und Leistungsanalyse",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM3",
  lernziele: [
    "Ich kann ein Marketingkonzept in seinen Grundzügen erklären. (K2)",
    "Ich kann die Marktgrösse (Potenzial, Volumen, Anteil) berechnen und interpretieren. (K3)",
    "Ich kann strategische Analyseinstrumente (BCG-Portfolio, Produktlebenszyklus) anwenden. (K3)"
  ]
};

window.TOPICS = {
  "marketing":      {label: "Marketing & Marketingkonzept", short: "Marketing", lernziele: ["Ich kann den Begriff Marketing definieren und die Elemente eines Marketingkonzepts nennen. (K1)", "Ich kann den Marketing-Mix (4P: Product, Price, Place, Promotion) erklären und auf ein Unternehmen anwenden. (K3)"]},
  "marktgroesse":   {label: "Marktgrösse: Potenzial, Volumen, Sättigung", short: "Marktgrösse", lernziele: ["Ich kann Marktpotenzial, Marktvolumen und Marktsättigungsgrad berechnen. (K3)", "Ich kann die Begriffe voneinander abgrenzen und ihre Bedeutung für die Unternehmensplanung erklären. (K2)"]},
  "marktstellung":  {label: "Marktstellung & Marktanteil", short: "Marktstellung", lernziele: ["Ich kann den absoluten und relativen Marktanteil berechnen. (K3)", "Ich kann Marktführer, Marktherausforderer und Mitläufer unterscheiden. (K2)"]},
  "segmentierung":  {label: "Marktsegmentierung & Konkurrenz", short: "Segmentierung", lernziele: ["Ich kann Kriterien der Marktsegmentierung (demografisch, geografisch, psychografisch, verhaltensbasiert) nennen. (K1)", "Ich kann für ein konkretes Produkt eine sinnvolle Marktsegmentierung vorschlagen. (K3)"]},
  "bcg":            {label: "BCG-Portfolio", short: "BCG", lernziele: ["Ich kann die BCG-Matrix (Stars, Cash Cows, Question Marks, Poor Dogs) erklären und Produkte einordnen. (K3)", "Ich kann Normstrategien für die vier Felder der BCG-Matrix ableiten. (K4)"]},
  "plz":            {label: "Produktlebenszyklus", short: "PLZ", lernziele: ["Ich kann die Phasen des Produktlebenszyklus (Einführung, Wachstum, Reife, Sättigung, Degeneration) beschreiben. (K2)", "Ich kann für ein Produkt die aktuelle PLZ-Phase bestimmen und Marketing-Massnahmen ableiten. (K4)"]}
};

window.QUESTIONS = [

  // ===================================================
  // TOPIC: marketing (Einführung Marketing, K4.1)
  // ===================================================

  // --- diff 1 ---
  {
    id: "e01", topic: "marketing", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Marketing ist das Bindeglied zwischen Unternehmen und Markt.",
    correct: true,
    explain: "Marketing stellt tatsächlich das Bindeglied zwischen Unternehmen und Markt dar. Es umfasst die Aufgaben, Kundenbedürfnisse zu erkennen und zu befriedigen."
  },
  {
    id: "e02", topic: "marketing", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist die Hauptaufgabe des Marketings?",
    options: [
      {v: "A", t: "Möglichst günstige Rohstoffe einkaufen"},
      {v: "B", t: "Kundenbedürfnisse erkennen und befriedigen"},
      {v: "C", t: "Mitarbeitende rekrutieren und schulen"},
      {v: "D", t: "Die Buchhaltung des Unternehmens führen"}
    ],
    correct: "B",
    explain: "Marketing nimmt die Aufgaben wahr, Kundenbedürfnisse zu erkennen und zu befriedigen. Es schliesst die Denkhaltung mit ein, dass das Unternehmen immer mit Blick auf den Markt geführt werden sollte."
  },
  {
    id: "e03", topic: "marketing", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Ein {0} wird entwickelt, um Produkte und Dienstleistungen bei einem breiten Publikum bekannt zu machen und den Absatz optimal zu gestalten.",
    blanks: [
      {answer: "Marketingkonzept", alts: ["Marketing-Konzept"]}
    ],
    explain: "Die Unternehmensleitung entwickelt ein Marketingkonzept in Abstimmung mit der Unternehmensstrategie, um Produkte und Dienstleistungen bekannt zu machen."
  },

  // --- diff 2 ---
  {
    id: "e04", topic: "marketing", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "In welcher Reihenfolge werden die vier Schritte eines Marketingkonzepts durchlaufen?",
    options: [
      {v: "A", t: "Produkt- und Marktziele → Markt- und Leistungsanalyse → Marketing-Mix → Marktforschung"},
      {v: "B", t: "Marktforschung → Marketing-Mix → Markt- und Leistungsanalyse → Produkt- und Marktziele"},
      {v: "C", t: "Markt- und Leistungsanalyse → Marktforschung → Produkt- und Marktziele → Marketing-Mix"},
      {v: "D", t: "Marketing-Mix → Marktforschung → Produkt- und Marktziele → Markt- und Leistungsanalyse"}
    ],
    correct: "C",
    explain: "Das Marketingkonzept umfasst vier Schritte in dieser Reihenfolge: 1. Markt- und Leistungsanalyse, 2. Marktforschung, 3. Produkt- und Marktziele, 4. Marketing-Mix."
  },
  {
    id: "e05", topic: "marketing", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Elemente gehören zu den vier Schritten eines Marketingkonzepts? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Marktforschung"},
      {v: "B", t: "Personalplanung"},
      {v: "C", t: "Marketing-Mix"},
      {v: "D", t: "Markt- und Leistungsanalyse"}
    ],
    correct: ["A", "C", "D"],
    explain: "Die vier Schritte des Marketingkonzepts sind: 1. Markt- und Leistungsanalyse, 2. Marktforschung, 3. Produkt- und Marktziele, 4. Marketing-Mix. Personalplanung gehört nicht dazu."
  },
  {
    id: "e06", topic: "marketing", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Das Marketingkonzept wird unabhängig von der Unternehmensstrategie entwickelt.",
    correct: false,
    explain: "Das Marketingkonzept wird in Abstimmung mit der Unternehmensstrategie entwickelt, nicht unabhängig davon."
  },

  // --- diff 3 ---
  {
    id: "e07", topic: "marketing", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Warum muss die Markt- und Leistungsanalyse vor der Formulierung der Produkt- und Marktziele durchgeführt werden?",
    options: [
      {v: "A", t: "Weil die Analyse gesetzlich vorgeschrieben ist"},
      {v: "B", t: "Weil erst die Analyse zeigt, welche Ziele realistisch und sinnvoll sind"},
      {v: "C", t: "Weil die Produkt- und Marktziele nur intern relevant sind"},
      {v: "D", t: "Weil die Markt- und Leistungsanalyse die günstigste Methode ist"}
    ],
    correct: "B",
    explain: "Die Markt- und Leistungsanalyse liefert die Grundlage für realistische Zielsetzungen. Ohne Kenntnis der Marktgrösse, der Konkurrenz und der eigenen Leistungsposition wären die Ziele nicht fundiert."
  },
  {
    id: "e08", topic: "marketing", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein Start-up plant den Markteintritt mit einem neuartigen Produkt. Es hat wenig Budget und kennt den Markt kaum. Welcher Schritt des Marketingkonzepts ist für dieses Unternehmen besonders kritisch?",
    options: [
      {v: "A", t: "Produkt- und Marktziele, weil jedes Unternehmen Ziele braucht"},
      {v: "B", t: "Marketing-Mix, weil die Werbung entscheidend ist"},
      {v: "C", t: "Alle vier Schritte sind gleich wichtig"},
      {v: "D", t: "Markt- und Leistungsanalyse, weil das Unternehmen den Markt zuerst verstehen muss"}
    ],
    correct: "D",
    explain: "Für ein Start-up, das den Markt noch nicht kennt, ist die Markt- und Leistungsanalyse besonders kritisch. Ohne dieses Wissen besteht die Gefahr, am Markt vorbei zu produzieren und knappe Ressourcen falsch einzusetzen."
  },
  {
    id: "e09", topic: "marketing", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Unternehmen, das seit Jahrzehnten erfolgreich am Markt ist, kann auf die Markt- und Leistungsanalyse verzichten, da es den Markt bereits gut kennt.",
    correct: false,
    explain: "Auch etablierte Unternehmen müssen regelmässig die Markt- und Leistungsanalyse durchführen, da sich Märkte laufend verändern (neue Konkurrenten, veränderte Kundenbedürfnisse, technologischer Wandel). Unterlässt man dies, riskiert man, Marktveränderungen zu verpassen."
  },

  // ===================================================
  // TOPIC: marktgroesse (K4.2a – Marktgrösse)
  // ===================================================

  // --- diff 1 ---
  {
    id: "g01", topic: "marktgroesse", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche drei Kennzahlen werden zur Analyse der Marktgrösse verwendet?",
    options: [
      {v: "A", t: "Angebot, Nachfrage und Gleichgewichtspreis"},
      {v: "B", t: "Marktpotenzial, Marktvolumen und Sättigungsgrad"},
      {v: "C", t: "Marktanteil, Rendite und Produktivität"},
      {v: "D", t: "Umsatz, Gewinn und Cashflow"}
    ],
    correct: "B",
    explain: "Für die Analyse der Marktgrösse werden drei Kennzahlen verwendet: das Marktpotenzial, das Marktvolumen und der Sättigungsgrad."
  },
  {
    id: "g02", topic: "marktgroesse", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Das {0} beschreibt die theoretisch höchstmögliche Absatzmenge einer Leistung im Markt.",
    blanks: [
      {answer: "Marktpotenzial", alts: ["Markt-Potenzial", "Marktpotential", "Markt-Potential"]}
    ],
    explain: "Das Marktpotenzial beschreibt die theoretisch höchstmögliche Absatzmenge einer Leistung im Markt. Es handelt sich um eine Abschätzung der Aufnahmefähigkeit eines Marktes."
  },
  {
    id: "g03", topic: "marktgroesse", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Das Marktvolumen gibt die effektiv verkaufte Menge einer Leistung pro Jahr an.",
    correct: true,
    explain: "Das Marktvolumen gibt die effektiv verkaufte Menge einer Leistung pro Jahr an. Berücksichtigt werden dabei die Umsatzzahlen aller Anbieter."
  },
  {
    id: "g04", topic: "marktgroesse", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Was zeigt der Sättigungsgrad eines Marktes an?",
    options: [
      {v: "A", t: "Das Verhältnis von Marktvolumen zu Marktpotenzial"},
      {v: "B", t: "Das Verhältnis von Umsatz zu Kosten"},
      {v: "C", t: "Den Gewinn des grössten Anbieters"},
      {v: "D", t: "Die Anzahl der Anbieter auf dem Markt"}
    ],
    correct: "A",
    explain: "Der Sättigungsgrad ergibt sich aus dem Vergleich von Marktpotenzial und Marktvolumen: Sättigungsgrad in % = (Marktvolumen / Marktpotenzial) × 100."
  },

  // --- diff 2 ---
  {
    id: "g05", topic: "marktgroesse", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Marktpotenzial für Elektrofahrräder in der Schweiz wird auf CHF 800 Mio. geschätzt. Das aktuelle Marktvolumen beträgt CHF 520 Mio. Berechnen Sie den Sättigungsgrad.",
    rows: [
      {label: "Sättigungsgrad in %", answer: 65, tolerance: 0.5, unit: "%"}
    ],
    explain: "Sättigungsgrad = (Marktvolumen / Marktpotenzial) × 100 = (520 / 800) × 100 = 65 %. Der Markt hat noch Wachstumspotenzial von rund 35 %."
  },
  {
    id: "g06", topic: "marktgroesse", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was bedeutet ein hoher Sättigungsgrad für Unternehmen auf dem Markt?",
    options: [
      {v: "A", t: "Umsatzsteigerung ist nur noch auf Kosten der Konkurrenz möglich (Verdrängungskampf)"},
      {v: "B", t: "Neue Unternehmen können problemlos eintreten"},
      {v: "C", t: "Die Preise werden automatisch steigen"},
      {v: "D", t: "Der Markt bietet besonders gute Wachstumschancen"}
    ],
    correct: "A",
    explain: "Ist der Sättigungsgrad hoch, kann der Markt kaum noch wachsen. Eine Umsatzsteigerung ist dann nur noch auf Kosten der Konkurrenz möglich – es findet ein Verdrängungskampf statt."
  },
  {
    id: "g07", topic: "marktgroesse", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zum Marktpotenzial sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Es beschreibt die theoretisch höchstmögliche Absatzmenge"},
      {v: "B", t: "Es wird als Umsatzzahl oder Absatzmenge angegeben"},
      {v: "C", t: "Es entspricht dem tatsächlich erzielten Umsatz aller Anbieter"},
      {v: "D", t: "Es basiert auf einer Abschätzung der Aufnahmefähigkeit des Marktes"}
    ],
    correct: ["A", "B", "D"],
    explain: "Das Marktpotenzial ist die theoretisch höchstmögliche Absatzmenge (A), wird als Umsatzzahl angegeben (B) und basiert auf einer Abschätzung (D). Der tatsächlich erzielte Umsatz aller Anbieter ist das Marktvolumen, nicht das Marktpotenzial (C ist falsch)."
  },
  {
    id: "g08", topic: "marktgroesse", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein tiefer Sättigungsgrad deutet auf einen wachsenden Markt hin, der für Unternehmen besonders attraktiv ist.",
    correct: true,
    explain: "Ist der Sättigungsgrad tief, befindet sich der Markt in einer Wachstumsphase – was für Unternehmen besonders attraktiv ist, da Umsatzsteigerungen leichter zu erzielen sind."
  },

  // --- diff 3 ---
  {
    id: "g09", topic: "marktgroesse", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Schweizer Markt für Bio-Lebensmittel hat ein geschätztes Marktpotenzial von CHF 6 Mrd. und einen Sättigungsgrad von 58 %. Berechnen Sie das aktuelle Marktvolumen.",
    rows: [
      {label: "Marktvolumen in Mrd. CHF", answer: 3.48, tolerance: 0.05, unit: "Mrd. CHF"}
    ],
    explain: "Sättigungsgrad = Marktvolumen / Marktpotenzial × 100. Umgestellt: Marktvolumen = Sättigungsgrad × Marktpotenzial / 100 = 58 % × 6 Mrd. / 100 = 3.48 Mrd. CHF."
  },
  {
    id: "g10", topic: "marktgroesse", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Der Markt für Streaming-Dienste in der Schweiz hat einen Sättigungsgrad von 92 %. Welche strategische Konsequenz ergibt sich daraus am ehesten für einen neuen Anbieter?",
    options: [
      {v: "A", t: "Es lohnt sich, möglichst viel in Produktionskapazitäten zu investieren"},
      {v: "B", t: "Der Eintritt ist riskant, da Wachstum nur durch Verdrängung bestehender Anbieter möglich ist"},
      {v: "C", t: "Der hohe Sättigungsgrad garantiert einen grossen Kundenstamm"},
      {v: "D", t: "Die Preise können frei gesetzt werden, da der Markt ausgereift ist"}
    ],
    correct: "B",
    explain: "Bei einem Sättigungsgrad von 92 % ist der Markt nahezu gesättigt. Neukunden zu gewinnen ist schwierig, und Wachstum ist fast nur über die Verdrängung bestehender Anbieter möglich. Ein Markteintritt ist daher sehr riskant und erfordert ein klares Differenzierungsmerkmal."
  },
  {
    id: "g11", topic: "marktgroesse", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Warum ist das Marktpotenzial immer nur eine Schätzung und kein exakter Wert?",
    options: [
      {v: "A", t: "Weil es auf Annahmen über die maximale Aufnahmefähigkeit des Marktes basiert, die sich verändern können"},
      {v: "B", t: "Weil das Marktvolumen immer grösser ist als das Marktpotenzial"},
      {v: "C", t: "Weil die Unternehmen ihre Umsatzzahlen geheim halten"},
      {v: "D", t: "Weil es nur für neue Märkte berechnet werden kann"}
    ],
    correct: "A",
    explain: "Das Marktpotenzial ist eine theoretische Grösse, die auf Annahmen basiert (z.B. wie viele Konsumenten das Produkt maximal nutzen würden). Diese Annahmen können sich durch gesellschaftliche Trends, technologischen Wandel oder neue Bedürfnisse verändern."
  },

  // ===================================================
  // TOPIC: marktstellung (K4.2a – Marktanteil)
  // ===================================================

  // --- diff 1 ---
  {
    id: "s01", topic: "marktstellung", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Der {0} entspricht dem Anteil in Prozent am Marktvolumen, welchen ein Unternehmen erwirtschaftet hat.",
    blanks: [
      {answer: "Marktanteil", alts: ["Markt-Anteil", "absolute Marktanteil", "absoluter Marktanteil"]}
    ],
    explain: "Der Marktanteil entspricht dem Anteil in Prozent am Marktvolumen (bzw. vom Gesamtumsatz), welchen ein Unternehmen erwirtschaftet hat."
  },
  {
    id: "s02", topic: "marktstellung", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Wie wird das Unternehmen mit dem höchsten Marktanteil bezeichnet?",
    options: [
      {v: "A", t: "Marktführer"},
      {v: "B", t: "Cash Cow"},
      {v: "C", t: "Monopolist"},
      {v: "D", t: "Marktpionier"}
    ],
    correct: "A",
    explain: "Das Unternehmen mit dem höchsten Marktanteil wird als Marktführer (bzw. Marktleader) bezeichnet."
  },
  {
    id: "s03", topic: "marktstellung", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Der relative Marktanteil setzt den eigenen Marktanteil ins Verhältnis zum Marktanteil des stärksten Konkurrenten.",
    correct: true,
    explain: "Der relative Marktanteil entspricht dem Marktanteil des eigenen Unternehmens im Verhältnis zu dem des stärksten Konkurrenten: Relativer Marktanteil = Eigener Marktanteil / Marktanteil des grössten Konkurrenten."
  },

  // --- diff 2 ---
  {
    id: "s04", topic: "marktstellung", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Das Marktvolumen für Sportschuhe in der Schweiz beträgt CHF 450 Mio. Ein Unternehmen erzielt einen Umsatz von CHF 72 Mio. Berechnen Sie den Marktanteil des Unternehmens.",
    rows: [
      {label: "Marktanteil in %", answer: 16, tolerance: 0.1, unit: "%"}
    ],
    explain: "Marktanteil = (Umsatz des Unternehmens / Marktvolumen) × 100 = (72 / 450) × 100 = 16 %."
  },
  {
    id: "s05", topic: "marktstellung", type: "calc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Unternehmen A hat einen Marktanteil von 8 %. Der Marktführer (Unternehmen B) hat einen Marktanteil von 20 %. Berechnen Sie den relativen Marktanteil von Unternehmen A.",
    rows: [
      {label: "Relativer Marktanteil", answer: 0.4, tolerance: 0.01, unit: ""}
    ],
    explain: "Relativer Marktanteil = Eigener Marktanteil / Marktanteil des grössten Konkurrenten = 8 % / 20 % = 0,4. Ein Wert unter 1 bedeutet, dass das Unternehmen nicht Marktführer ist."
  },
  {
    id: "s06", topic: "marktstellung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Warum kann ein hoher Marktanteil für ein Unternehmen vorteilhaft sein?",
    options: [
      {v: "A", t: "Er senkt automatisch die Produktionskosten auf null"},
      {v: "B", t: "Er bedeutet, dass das Unternehmen keine Werbung mehr braucht"},
      {v: "C", t: "Er garantiert, dass keine neuen Konkurrenten eintreten"},
      {v: "D", t: "Er ermöglicht es dem Unternehmen, den Markt nach seinen Bedingungen zu gestalten"}
    ],
    correct: "D",
    explain: "Ein hoher Marktanteil (Marktführerschaft) kann es dem Unternehmen ermöglichen, den Markt nach seinen Bedingungen zu gestalten, z.B. bei der Preissetzung oder bei Produktstandards."
  },
  {
    id: "s07", topic: "marktstellung", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein relativer Marktanteil von genau 1,0 bedeutet, dass das Unternehmen und sein stärkster Konkurrent gleich grosse Marktanteile haben.",
    correct: true,
    explain: "Bei einem relativen Marktanteil von 1,0 ist der eigene Marktanteil genau gleich gross wie der des grössten Konkurrenten. Ein Wert über 1,0 bedeutet Marktführerschaft."
  },

  // --- diff 3 ---
  {
    id: "s08", topic: "marktstellung", type: "calc", diff: 3, tax: "K3",
 reviewed:false,
    q: "Der Pharma-Markt hat ein Marktvolumen von USD 1162 Mrd. Roche erzielt einen Umsatz von USD 62,1 Mrd. und Sinopharm (Marktführer) USD 66,3 Mrd. Berechnen Sie den Marktanteil von Roche und den relativen Marktanteil von Roche.",
    rows: [
      {label: "Marktanteil Roche in %", answer: 5.3, tolerance: 0.1, unit: "%"},
      {label: "Relativer Marktanteil Roche", answer: 0.93, tolerance: 0.02, unit: ""}
    ],
    explain: "Marktanteil Roche = (62,1 / 1162) × 100 = 5,3 %. Relativer Marktanteil Roche = 5,3 % / 5,7 % = 0,93. Obwohl Roche nicht Marktführer ist, liegt der relative Marktanteil nahe bei 1, was auf einen stark umkämpften Markt ohne klaren Dominanten hindeutet."
  },
  {
    id: "s09", topic: "marktstellung", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Der relative Marktanteil von Roche im Pharma-Markt beträgt 0,93. Was lässt sich daraus über die Marktstruktur ableiten?",
    options: [
      {v: "A", t: "Der Markt ist stark umkämpft – es gibt keinen klar dominierenden Marktführer"},
      {v: "B", t: "Der absolute Marktanteil von Roche ist sehr hoch"},
      {v: "C", t: "Der Markt ist ein Monopol"},
      {v: "D", t: "Roche ist klarer Marktführer mit grossem Vorsprung"}
    ],
    correct: "A",
    explain: "Ein relativer Marktanteil von 0,93 liegt sehr nahe bei 1,0. Das bedeutet, dass Roche und der Marktführer fast gleich grosse Marktanteile haben. Der Pharma-Markt ist stark umkämpft mit mehreren grossen Anbietern, ohne dass ein einzelner dominiert."
  },
  {
    id: "s10", topic: "marktstellung", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Wann ist der relative Marktanteil aussagekräftiger als der absolute Marktanteil? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Wenn viele Unternehmen mit vergleichsweise kleinen Marktanteilen am Markt sind"},
      {v: "B", t: "Wenn man die tatsächliche Wettbewerbsposition im Vergleich zum stärksten Konkurrenten wissen möchte"},
      {v: "C", t: "Wenn nur ein einziges Unternehmen auf dem Markt tätig ist"},
      {v: "D", t: "Wenn der absolute Marktanteil wenig über den Einfluss eines Unternehmens aussagt"}
    ],
    correct: ["A", "B", "D"],
    explain: "Der relative Marktanteil ist besonders sinnvoll, wenn der absolute Marktanteil wenig aussagt (D), z.B. weil viele Unternehmen kleine Anteile haben (A). Er zeigt die Wettbewerbsposition im direkten Vergleich zum stärksten Konkurrenten (B). Bei einem Monopol (C) wäre der relative Marktanteil nicht sinnvoll berechenbar."
  },

  // ===================================================
  // TOPIC: segmentierung (K4.2a – Segmentierung & Konkurrenz)
  // ===================================================

  // --- diff 1 ---
  {
    id: "z01", topic: "segmentierung", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was versteht man unter Marktsegmentierung?",
    options: [
      {v: "A", t: "Die Aufteilung des Gewinns auf die Abteilungen"},
      {v: "B", t: "Die geografische Expansion in neue Länder"},
      {v: "C", t: "Die Aufteilung des Gesamtmarktes in Teilmärkte (Segmente) nach bestimmten Kriterien"},
      {v: "D", t: "Die Berechnung des Marktanteils für jedes Produkt"}
    ],
    correct: "C",
    explain: "Marktsegmentierung bedeutet, den Gesamtmarkt in Teilmärkte (Marktsegmente) aufzuteilen. Die Segmente bestehen aus Konsumenten, die sich anhand bestimmter Kriterien gruppieren lassen."
  },
  {
    id: "z02", topic: "segmentierung", type: "multi", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche der folgenden sind Kriterien zur Marktsegmentierung? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Geografie (z.B. Land, Region, städtisch/ländlich)"},
      {v: "B", t: "Demografie (z.B. Alter, Geschlecht, Einkommen)"},
      {v: "C", t: "Eigenkapitalquote des Unternehmens"},
      {v: "D", t: "Psychografie (z.B. Lebensstil, Einstellungen)"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die vier Hauptkriterien der Marktsegmentierung sind: Geografie, Demografie, Kundenverhalten und Psychografie. Die Eigenkapitalquote ist eine interne Finanzkennzahl und kein Segmentierungskriterium."
  },
  {
    id: "z03", topic: "segmentierung", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Das Unternehmen wählt aus den verschiedenen Marktsegmenten seine {0} aus.",
    blanks: [
      {answer: "Zielgruppe", alts: ["Zielgruppen"]}
    ],
    explain: "Das Unternehmen entscheidet sich, welches Marktsegment am besten geeignet ist, und wählt daraus seine Zielgruppe."
  },

  // --- diff 2 ---
  {
    id: "z04", topic: "segmentierung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welches Segmentierungskriterium wird angewendet, wenn ein Reiseanbieter seine Angebote nach «Familien mit Kindern», «Abenteuerreisende» und «Senioren» unterteilt?",
    options: [
      {v: "A", t: "Psychografie"},
      {v: "B", t: "Kundenverhalten"},
      {v: "C", t: "Demografie (Alter, Familienstand)"},
      {v: "D", t: "Geografie"}
    ],
    correct: "C",
    explain: "Die Unterteilung nach Familien, Abenteuerreisenden und Senioren basiert primär auf demografischen Kriterien wie Alter und Familienstand."
  },
  {
    id: "z05", topic: "segmentierung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein Kosmetikunternehmen beschreibt seine Zielgruppe als «Frauen um die 30, die Karriere machen, Wert auf ein gepflegtes Äusseres legen und in etablierten Parfümerieketten einkaufen». Welche Segmentierungskriterien werden hier kombiniert?",
    options: [
      {v: "A", t: "Nur Demografie"},
      {v: "B", t: "Nur Kundenverhalten"},
      {v: "C", t: "Geografie und Demografie"},
      {v: "D", t: "Demografie und Psychografie und Kundenverhalten"}
    ],
    correct: "D",
    explain: "Hier werden mehrere Kriterien kombiniert: Demografie (Frauen um 30, Beruf), Psychografie (Wert auf gepflegtes Äusseres) und Kundenverhalten (Einkauf in Parfümerieketten). In der Praxis werden Marktsegmente meist anhand einer Kombination von Kriterien gebildet."
  },
  {
    id: "z06", topic: "segmentierung", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Bei der Konkurrenzanalyse interessieren vor allem folgende Punkte: (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Charakteristische Merkmale der Konkurrenten und ihrer Marketinginstrumente"},
      {v: "B", t: "Stärken und Schwächen der Konkurrenz im Vergleich zum eigenen Unternehmen"},
      {v: "C", t: "Das Privatleben der Geschäftsführer der Konkurrenz"},
      {v: "D", t: "Die Identifikation möglicher neuer Konkurrenten"}
    ],
    correct: ["A", "B", "D"],
    explain: "Bei der Konkurrenzanalyse werden die wichtigsten Konkurrenten bestimmt und analysiert: ihre Merkmale und Marketinginstrumente (A), ihre Stärken und Schwächen im Vergleich (B) sowie mögliche neue Konkurrenten (D)."
  },

  // --- diff 3 ---
  {
    id: "z07", topic: "segmentierung", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Schweizer Bio-Getränkehersteller will seine Zielgruppe definieren. Er segmentiert nach Geografie (Deutschschweiz), Demografie (25–45 Jahre, mittleres bis hohes Einkommen), Psychografie (umweltbewusst) und Kundenverhalten (kauft regelmässig im Bio-Fachhandel). Welcher Vorteil ergibt sich aus dieser Kombination?",
    options: [
      {v: "A", t: "Das Unternehmen kann seine Marketingmassnahmen sehr gezielt auf die Bedürfnisse dieser Gruppe ausrichten"},
      {v: "B", t: "Die Zielgruppe wird grösser, je mehr Kriterien verwendet werden"},
      {v: "C", t: "Die Segmentierung wird überflüssig, weil die Zielgruppe zu klein ist"},
      {v: "D", t: "Das Unternehmen spart Geld, weil weniger Kunden angesprochen werden"}
    ],
    correct: "A",
    explain: "Je präziser die Zielgruppe definiert ist, desto gezielter können Marketingmassnahmen auf deren Bedürfnisse abgestimmt werden (Produktgestaltung, Kommunikation, Vertriebskanäle). Allerdings wird die Zielgruppe kleiner (nicht grösser), was eine bewusste strategische Entscheidung ist."
  },
  {
    id: "z08", topic: "segmentierung", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Zur Beantwortung von Fragen über die Konkurrenz genügt es in der Regel, das Verhalten der Konkurrenz zu beobachten und Unternehmensinformationen auszuwerten (Sekundärmarktforschung).",
    correct: true,
    explain: "Das Lehrbuch bestätigt: Zur Beantwortung von Fragen über die Konkurrenz genügt es in der Regel, die Konkurrenz zu beobachten und Unternehmensinformationen (Sekundärmarktforschung) auszuwerten."
  },
  {
    id: "z09", topic: "segmentierung", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein Unternehmen stellt fest, dass seine Konkurrenten zunehmend in Online-Marketing investieren, während es selbst nur klassische Printwerbung einsetzt. Welche Schlussfolgerung ist am sinnvollsten?",
    options: [
      {v: "A", t: "Die Konkurrenzanalyse hat keinen Einfluss auf eigene Marketingentscheide"},
      {v: "B", t: "Das Unternehmen sollte noch mehr in Printwerbung investieren, um sich zu differenzieren"},
      {v: "C", t: "Das Unternehmen sollte die gleiche Online-Strategie wie die Konkurrenz 1:1 kopieren"},
      {v: "D", t: "Das Unternehmen sollte prüfen, ob es seine Kommunikationsstrategie anpassen muss, um wettbewerbsfähig zu bleiben"}
    ],
    correct: "D",
    explain: "Die Konkurrenzanalyse dient dazu, Stärken und Schwächen der Konkurrenz zu erkennen und daraus Schlüsse für die eigene Strategie zu ziehen. Wenn die Konkurrenz Online-Marketing nutzt und die Zielgruppe dort erreichbar ist, sollte das Unternehmen prüfen, ob eine Anpassung nötig ist. Blindes Kopieren (D) oder stures Festhalten (B) sind keine strategisch fundierten Reaktionen."
  },

  // ===================================================
  // TOPIC: bcg (K4.2b – BCG-Portfolio)
  // ===================================================

  // --- diff 1 ---
  {
    id: "b01", topic: "bcg", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Von wem wurde die BCG-Portfolio-Methode entwickelt?",
    options: [
      {v: "A", t: "Boston Consulting Group"},
      {v: "B", t: "Harvard Business School"},
      {v: "C", t: "Schweizerische Nationalbank"},
      {v: "D", t: "McKinsey & Company"}
    ],
    correct: "A",
    explain: "Die BCG-Portfolio-Methode wurde von der Boston Consulting Group (BCG) entwickelt, einem weltweit tätigen Managementberatungs-Unternehmen."
  },
  {
    id: "b02", topic: "bcg", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die BCG-Portfolio-Methode beurteilt Leistungen anhand von zwei Grössen: dem {0} und dem {1}.",
    blanks: [
      {answer: "Marktwachstum", alts: ["Markt-Wachstum"]},
      {answer: "relativen Marktanteil", alts: ["Marktanteil", "rel. Marktanteil"]}
    ],
    explain: "Das BCG-Portfolio beurteilt Leistungen nach zwei Grössen: dem Marktwachstum (y-Achse) und dem relativen Marktanteil (x-Achse)."
  },
  {
    id: "b03", topic: "bcg", type: "multi", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche der folgenden sind Quadranten des BCG-Portfolios? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Stars"},
      {v: "B", t: "Cash Cows"},
      {v: "C", t: "Rising Stars"},
      {v: "D", t: "Poor Dogs"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die vier Quadranten des BCG-Portfolios sind: Poor Dogs, Question Marks, Stars und Cash Cows. «Rising Stars» existiert im BCG-Modell nicht."
  },
  {
    id: "b04", topic: "bcg", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche Leistungen zeichnen sich durch einen hohen Marktanteil und niedrige Marktwachstumsraten aus?",
    options: [
      {v: "A", t: "Question Marks"},
      {v: "B", t: "Poor Dogs"},
      {v: "C", t: "Cash Cows"},
      {v: "D", t: "Stars"}
    ],
    correct: "C",
    explain: "Cash Cows haben einen hohen Marktanteil bei niedrigen Marktwachstumsraten. Sie waren in der Regel vorher Stars, deren Marktwachstum zurückgegangen ist."
  },

  // --- diff 2 ---
  {
    id: "b05", topic: "bcg", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist die Normstrategie für Poor Dogs?",
    options: [
      {v: "A", t: "Position halten und ausbauen"},
      {v: "B", t: "Ausstieg – Abbau der Leistungen und Einsatz der Ressourcen für besser positionierte Produkte"},
      {v: "C", t: "Keine nennenswerten Investitionen mehr tätigen"},
      {v: "D", t: "Intensive Marktbearbeitung durch hohe Werbeinvestitionen"}
    ],
    correct: "B",
    explain: "Poor Dogs haben einen kleinen Marktanteil und niedrige Marktwachstumsraten. Die Normstrategie ist der Ausstieg: Abbau dieser Leistungen und Einsatz der frei werdenden Ressourcen für besser positionierte Marktleistungen."
  },
  {
    id: "b06", topic: "bcg", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Warum sind Stars trotz ihres Erfolgs kostenintensiv?",
    options: [
      {v: "A", t: "Weil sie keinen Umsatz generieren"},
      {v: "B", t: "Weil sie in einem schrumpfenden Markt operieren"},
      {v: "C", t: "Weil sie hohe Investitionen in Werbung und Marktbearbeitung erfordern, um die Position zu halten"},
      {v: "D", t: "Weil sie nur für den internen Gebrauch bestimmt sind"}
    ],
    correct: "C",
    explain: "Stars haben einen hohen Marktanteil in wachsenden Märkten. Um diese Position zu halten oder auszubauen, sind hohe Investitionen in Werbung und Marktbearbeitung nötig – Stars sind daher werbe- und kostenintensiv."
  },
  {
    id: "b07", topic: "bcg", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Cash Cows erwirtschaften hohe und stabile Gewinne bei niedrigen Ausgaben, weil sie keine nennenswerten Investitionen mehr erfordern.",
    correct: true,
    explain: "Da Cash Cows ihre Leistung früher oder später verlieren werden, wird kaum noch investiert. Trotzdem erzielen sie einen beachtlichen Umsatz bei kaum noch Ausgaben, weshalb sie hohe und stabile Gewinne abwerfen."
  },
  {
    id: "b08", topic: "bcg", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zu Question Marks sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Sie haben einen kleinen Marktanteil, aber hohe Marktwachstumsraten"},
      {v: "B", t: "Ihre Zukunftsaussichten sind fraglich – sie können Stars oder Poor Dogs werden"},
      {v: "C", t: "Sie erfordern keine finanziellen Investitionen"},
      {v: "D", t: "Die Normstrategie ist intensive Marktbearbeitung (z.B. Werbung)"}
    ],
    correct: ["A", "B", "D"],
    explain: "Question Marks haben einen kleinen Marktanteil bei hohen Wachstumsraten (A), ihre Zukunft ist unsicher (B), und die Normstrategie ist intensive Marktbearbeitung, um sie zu Stars zu machen (D). Dies erfordert allerdings grosse finanzielle Investitionen (C ist falsch)."
  },

  // --- diff 3 ---
  {
    id: "b09", topic: "bcg", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    img: {src: "img/bwl/marketing/bcg_portfolio_01.svg", alt: "BCG-Portfolio mit vier Leistungen eines Unternehmens"},
    q: "Ein Unternehmen hat folgendes Portfolio: Leistung A (Poor Dog, CHF 200'000), Leistung B (Star, CHF 425'000), Leistung C (Cash Cow / Star-Grenze, CHF 800'000), Leistung D (Cash Cow, CHF 950'000). Warum ist dieses Portfolio problematisch?",
    options: [
      {v: "A", t: "Das Unternehmen hat zu wenig Poor Dogs"},
      {v: "B", t: "Die Cash Cows sind zu profitabel"},
      {v: "C", t: "Es hat zu viele Stars"},
      {v: "D", t: "Es fehlt an Nachfolgeprodukten (Question Marks), die langfristig Stars werden könnten"}
    ],
    correct: "D",
    explain: "Obwohl das Portfolio viele umsatzstarke Leistungen hat, fehlen Question Marks als Nachfolgeprodukte. Wenn die Cash Cows und Stars ihre Marktposition verlieren, hat das Unternehmen keine Nachfolger – es wird mittel- bis langfristig Probleme bekommen."
  },
  {
    id: "b10", topic: "bcg", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein Unternehmen hat drei Cash Cows und ein Question Mark. Wie sollte es seine finanziellen Mittel strategisch einsetzen?",
    options: [
      {v: "A", t: "Alle Mittel in die Cash Cows investieren, um deren Position zu sichern"},
      {v: "B", t: "Gewinne der Cash Cows nutzen, um das Question Mark durch intensive Marktbearbeitung zum Star zu entwickeln"},
      {v: "C", t: "Das Question Mark sofort aufgeben, da es noch keinen Gewinn erwirtschaftet"},
      {v: "D", t: "Die Cash Cows sofort abbauen und nur noch das Question Mark betreiben"}
    ],
    correct: "B",
    explain: "Die Cash Cows generieren hohe Gewinne bei niedrigen Investitionskosten. Diese Mittel sollten strategisch eingesetzt werden, um das Question Mark durch intensive Marktbearbeitung zum Star zu entwickeln – das sichert die Zukunft des Unternehmens."
  },
  {
    id: "b11", topic: "bcg", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welcher Zusammenhang besteht zwischen dem BCG-Portfolio und dem Produktlebenszyklus?",
    options: [
      {v: "A", t: "Cash Cows sind immer in der Einführungsphase des Produktlebenszyklus"},
      {v: "B", t: "Stars befinden sich immer in der Rückgangsphase"},
      {v: "C", t: "Das BCG-Portfolio und der Produktlebenszyklus haben nichts miteinander zu tun"},
      {v: "D", t: "Produkte durchlaufen typischerweise die Phasen Question Mark → Star → Cash Cow → Poor Dog"}
    ],
    correct: "D",
    explain: "Es besteht ein typischer Zusammenhang: Neue Produkte starten oft als Question Marks (Einführungsphase), werden bei Erfolg zu Stars (Wachstumsphase), dann zu Cash Cows (Reife-/Sättigungsphase) und schliesslich zu Poor Dogs (Rückgangsphase)."
  },
  {
    id: "b12", topic: "bcg", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein ausgewogenes BCG-Portfolio enthält Leistungen in allen vier Quadranten.",
    correct: false,
    explain: "Ein ausgewogenes Portfolio muss nicht zwingend Leistungen in allen vier Quadranten haben – idealerweise hat ein Unternehmen möglichst wenige Poor Dogs. Wichtig ist, dass genügend Cash Cows vorhanden sind, um Question Marks und Stars zu finanzieren, und dass es genügend Nachfolgeprodukte (Question Marks/Stars) gibt."
  },

  // ===================================================
  // TOPIC: plz (K4.2b – Produktlebenszyklus)
  // ===================================================

  // --- diff 1 ---
  {
    id: "p01", topic: "plz", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche fünf Phasen umfasst der Produktlebenszyklus?",
    options: [
      {v: "A", t: "Start, Aufstieg, Höhepunkt, Abstieg und Ende"},
      {v: "B", t: "Forschung, Entwicklung, Test, Markt und Auslauf"},
      {v: "C", t: "Planung, Produktion, Verkauf, Service und Entsorgung"},
      {v: "D", t: "Einführung, Wachstum, Reife, Sättigung und Rückgang"}
    ],
    correct: "D",
    explain: "Der Produktlebenszyklus umfasst fünf Phasen: Einführung, Wachstum, Reife, Sättigung und Rückgang. Diese beschreiben den Verlauf von Umsatz und Gewinn über die Zeit."
  },
  {
    id: "p02", topic: "plz", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Der Punkt, an dem die Umsatzkurve die Gewinnschwelle erreicht, heisst {0}.",
    blanks: [
      {answer: "Break-even", alts: ["Break-Even", "Breakeven", "Gewinnschwelle", "Break even"]}
    ],
    explain: "Die Gewinnschwelle (Break-even) ist der Punkt, an dem der Umsatz erstmals die Kosten deckt und das Produkt beginnt, Gewinn zu erzielen."
  },
  {
    id: "p03", topic: "plz", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "In der Einführungsphase wird in der Regel noch kaum Gewinn realisiert, obwohl der Umsatz bereits steigt.",
    correct: true,
    explain: "In der Einführungsphase sind die Kosten sehr hoch (Anfangsinvestitionen, Bekanntmachung), sodass bei steigendem Umsatz noch kaum Gewinn realisiert wird."
  },
  {
    id: "p04", topic: "plz", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "In welcher Phase des Produktlebenszyklus erreichen Umsatz und Gewinnkurve ihren Höhepunkt?",
    options: [
      {v: "A", t: "Wachstumsphase"},
      {v: "B", t: "Einführungsphase"},
      {v: "C", t: "Sättigungsphase"},
      {v: "D", t: "Reifephase"}
    ],
    correct: "D",
    explain: "In der Reifephase weist der Markt ein hohes Volumen auf. Die Gewinnkurve und die Absatzmenge erreichen ihren Höhepunkt."
  },

  // --- diff 2 ---
  {
    id: "p05", topic: "plz", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Warum besteht in der Einführungsphase ein hohes Risiko für das Produkt?",
    options: [
      {v: "A", t: "Weil sich entscheidet, ob sich die Leistung am Markt durchsetzen kann – falls nicht, wird sie sofort aus dem Sortiment genommen"},
      {v: "B", t: "Weil die Konkurrenz in dieser Phase am stärksten ist"},
      {v: "C", t: "Weil die Produktionskapazitäten nicht ausreichen"},
      {v: "D", t: "Weil der Gewinn am höchsten ist und viel Steuern anfallen"}
    ],
    correct: "A",
    explain: "In der Einführungsphase entscheidet sich, ob die Leistung am Markt Fuss fassen kann. Falls nicht, wird sie aus dem Sortiment genommen. Das Risiko des Scheiterns ist hier am höchsten."
  },
  {
    id: "p06", topic: "plz", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Merkmale kennzeichnen die Sättigungsphase? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Markt ist gesättigt und der Preiskampf erreicht seinen Höhepunkt"},
      {v: "B", t: "Die Umsatzkurve flacht ab und der Gewinn wird kleiner"},
      {v: "C", t: "Häufig entstehen Varianten zur ursprünglichen Marktleistung"},
      {v: "D", t: "Es werden grosse Investitionen in Neukundengewinnung getätigt"}
    ],
    correct: ["A", "B", "C"],
    explain: "In der Sättigungsphase ist der Markt gesättigt, der Preiskampf intensiv (A), die Umsatzkurve flacht ab und der Gewinn sinkt (B). Um den Ausstieg hinauszuzögern, werden oft Varianten der Leistung lanciert (C). Die Anstrengungen für Marketing werden eher reduziert, da kaum noch Neukunden zu erreichen sind (D falsch)."
  },
  {
    id: "p07", topic: "plz", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was geschieht typischerweise in der Rückgangsphase eines Produkts?",
    options: [
      {v: "A", t: "Die Konkurrenz zieht sich vom Markt zurück und der Gewinn steigt"},
      {v: "B", t: "Der Umsatz steigt noch einmal leicht an"},
      {v: "C", t: "Das Unternehmen investiert stark in Werbung"},
      {v: "D", t: "Der Umsatz bricht ein, der Gewinn tendiert gegen null oder es resultieren Verluste"}
    ],
    correct: "D",
    explain: "In der Rückgangsphase wenden sich Kunden neuen, innovativeren Produkten zu. Der Umsatz bricht ein, der Gewinn tendiert gegen null oder es entstehen sogar Verluste. Das Unternehmen ersetzt die Leistung durch neue Produkte."
  },
  {
    id: "p08", topic: "plz", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "In der Reifephase richten sich Marketingaktivitäten vor allem gegen die Mitkonkurrenten, um Marktanteile zu gewinnen.",
    correct: true,
    explain: "In der Reifephase können Marktanteilsgewinne beinahe nur noch auf Kosten der Konkurrenz erreicht werden. Die Marketingaktivitäten richten sich daher gegen die Mitkonkurrenten, z.B. durch Betonung des Markenprestiges."
  },

  // --- diff 3 ---
  {
    id: "p09", topic: "plz", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Coca-Cola (seit 1886) und das iPhone (seit 2007) durchlaufen beide den Produktlebenszyklus. Was erklärt den Unterschied in der Dauer der Sättigungsphase?",
    options: [
      {v: "A", t: "Der Produktlebenszyklus gilt nur für technische Produkte"},
      {v: "B", t: "Coca-Cola hat die Sättigungsphase übersprungen"},
      {v: "C", t: "Das iPhone befindet sich noch in der Einführungsphase"},
      {v: "D", t: "Die Sättigungsphase variiert stark je nach Produkt – bei Konsumgütern des täglichen Bedarfs kann sie sehr lang sein, bei Technologieprodukten deutlich kürzer"}
    ],
    correct: "D",
    explain: "Die Dauer der einzelnen Phasen, insbesondere der Sättigungsphase, variiert stark je nach Produktart. Produkte wie Coca-Cola halten sich seit über 100 Jahren, während Technologieprodukte wie Handys und Computer innerhalb kurzer Zeit veralten."
  },
  {
    id: "p10", topic: "plz", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Warum ist es für ein Unternehmen wichtig, dass sich seine verschiedenen Marktleistungen nicht alle in derselben Phase des Produktlebenszyklus befinden?",
    options: [
      {v: "A", t: "Weil die Steuerbehörde eine Streuung der Produkte verlangt"},
      {v: "B", t: "Weil die Kunden Abwechslung im Sortiment erwarten"},
      {v: "C", t: "Weil der Produktlebenszyklus vorschreibt, dass maximal ein Produkt pro Phase erlaubt ist"},
      {v: "D", t: "Weil die Geldflüsse (Investitionen, Umsatz, Gewinne) sich gegenseitig ausgleichen müssen, damit das Unternehmen nicht plötzlich ohne verkaufbare Leistung dasteht"}
    ],
    correct: "D",
    explain: "Es ist entscheidend, dass sich die Produkte in verschiedenen Phasen befinden, damit die Geldflüsse die Waage halten: Cash Cows (Reife/Sättigung) finanzieren neue Produkte in der Einführungs- und Wachstumsphase. So steht das Unternehmen nicht plötzlich ohne einzige verkaufbare Leistung da."
  },
  {
    id: "p11", topic: "plz", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Swiffer lancierte nach Swiffer Dry auch Swiffer Wet, und Rivella erweiterte sein Sortiment über die Jahre um neue Geschmacksrichtungen. In welcher Phase des Produktlebenszyklus treten solche Varianten typischerweise auf?",
    options: [
      {v: "A", t: "In der Einführungsphase, um den Markt zu testen"},
      {v: "B", t: "In der Sättigungsphase, um den Ausstieg hinauszuzögern"},
      {v: "C", t: "In der Wachstumsphase, um schnell Marktanteile zu gewinnen"},
      {v: "D", t: "In der Rückgangsphase, als letzter Rettungsversuch"}
    ],
    correct: "B",
    explain: "In der Sättigungsphase werden häufig Varianten zur ursprünglichen Marktleistung lanciert, um den Ausstieg hinauszuzögern. Die Beispiele Swiffer (Dry → Wet) und Rivella (neue Geschmacksrichtungen) illustrieren diese Strategie."
  },
  {
    id: "p12", topic: "plz", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Das Modell des Produktlebenszyklus lässt sich nutzen, um den exakten Zeitpunkt vorherzusagen, an dem ein Produkt in die Rückgangsphase eintritt.",
    correct: false,
    explain: "Der Produktlebenszyklus ist ein vereinfachtes Modell, das typische Muster beschreibt. Er kann nicht exakte Zeitpunkte vorhersagen. Die Dauer der Phasen ist von Produkt zu Produkt sehr unterschiedlich und hängt von vielen Faktoren ab (technologischer Wandel, Konsumverhalten, Konkurrenz). Um festzustellen, in welcher Phase sich ein Produkt befindet, wird Marktforschung betrieben."
  },

  // --- Sortierungsfragen ---
  {
    id: "neu_sort_01", topic: "plz", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Phasen des Produktlebenszyklus in die korrekte Reihenfolge.",
    items: [
      "Einführungsphase (hohe Marketingkosten, geringe Umsätze, oft noch Verluste)",
      "Wachstumsphase (Umsatz steigt stark, erste Gewinne, Konkurrenz tritt ein)",
      "Reifephase (Umsatz auf Höchststand, Gewinne maximal, intensiver Wettbewerb)",
      "Sättigungsphase (Umsatz stagniert, Gewinne sinken, Markt gesättigt)",
      "Degenerationsphase (Umsatz und Gewinne fallen, Produkt wird vom Markt genommen)"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Der PLZ beschreibt den idealtypischen Verlauf eines Produkts am Markt. In der Einführung entstehen hohe Kosten (Werbung, Distribution). Im Wachstum steigt der Umsatz stark. In der Reife erreicht der Umsatz sein Maximum. In der Sättigung stagniert der Markt. In der Degeneration sinkt die Nachfrage – das Produkt wird oft durch ein Nachfolgeprodukt ersetzt."
  },
  {
    id: "neu_sort_02", topic: "marketing", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Schritte eines Marketingkonzepts in die logische Reihenfolge.",
    items: [
      "Marktanalyse (Marktforschung, Kundenbedürfnisse, Konkurrenz)",
      "Marketingziele festlegen (Umsatz, Marktanteil, Bekanntheitsgrad)",
      "Marketingstrategie wählen (Zielgruppe, Positionierung, Differenzierung)",
      "Marketing-Mix gestalten (Product, Price, Place, Promotion)",
      "Umsetzung und Kontrolle (Budget, Massnahmenplanung, Erfolgsmessung)"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Ein Marketingkonzept wird systematisch entwickelt: Zuerst wird der Markt analysiert (Wo stehen wir?), dann werden Ziele definiert (Wo wollen wir hin?), eine Strategie gewählt (Wie kommen wir dahin?) und der Marketing-Mix ausgestaltet (konkrete Massnahmen). Abschliessend folgen Umsetzung und Kontrolle."
  },
  {
    id: "neu_sort_03", topic: "bcg", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
    q: "Ordnen Sie die BCG-Kategorien in die typische Reihenfolge, die ein erfolgreiches Produkt im Laufe seines Lebenszyklus durchläuft.",
    items: [
      "Question Mark (niedriger Marktanteil, hoher Marktwachstum – Investitionsentscheid nötig)",
      "Star (hoher Marktanteil, hohes Marktwachstum – Investitionen zur Verteidigung)",
      "Cash Cow (hoher Marktanteil, niedriges Marktwachstum – Gewinne «melken»)",
      "Poor Dog (niedriger Marktanteil, niedriges Marktwachstum – Desinvestition prüfen)"
    ],
    correct: [0, 1, 2, 3],
    explain: "Der idealtypische Weg: Ein neues Produkt startet als Question Mark (ungewisser Erfolg). Bei Erfolg wird es zum Star (Marktführer im Wachstumsmarkt). Wenn das Marktwachstum nachlässt, wird es zur Cash Cow (sichere Gewinne). Am Ende kann es zum Poor Dog werden, wenn der Marktanteil sinkt. Nicht alle Produkte durchlaufen alle Phasen – manche bleiben Question Marks und scheitern."
  },

// ──── ZEICHNEN ────
  {
    id: "neu_zeichnen_01", topic: "marketing", type: "zeichnen", diff: 2, tax: "K2", reviewed: false,
    q: "Zeichne das Marketing-Mix-Modell (4P). Stelle die vier Instrumente dar und nenne jeweils 2–3 konkrete Massnahmen.",
    hints: ["Die 4P stehen für: Product, Price, Place, Promotion.", "Auf Deutsch: Produkt, Preis, Distribution, Kommunikation.", "Jedes P umfasst verschiedene Teilentscheidungen."],
    sample: { src: "img/bwl/marketing/marketing_4p_zeichnen.svg", alt: "Musterlösung: Marketing-Mix 4P" },
    explain: "Der Marketing-Mix (McCarthy, 1960) umfasst vier Instrumente: Product (Sortiment, Qualität, Design), Price (Preisgestaltung, Rabatte, Konditionen), Place (Vertriebskanäle, Logistik, Standort), Promotion (Werbung, PR, Verkaufsförderung). Alle vier müssen aufeinander abgestimmt sein."
  },

  // ===== INTERAKTIVE FRAGETYPEN =====
  {
    id: "hotspot01", topic: "bcg", type: "hotspot", diff: 2, tax: "K2", reviewed: false,
    q: "Klicke auf den Quadranten, in dem sich Produkte befinden, die hohe Gewinne abwerfen und wenig Investition brauchen (hoher Marktanteil, niedriges Wachstum).",
    img: { src: "img/bwl/marketing/marketing_bcg_hotspot.svg", alt: "BCG-Portfolio-Matrix mit vier Quadranten A–D" },
    hotspots: [
      { x: 19.4, y: 23.8, r: 8, label: "A: Stars" },
      { x: 83.1, y: 23.8, r: 8, label: "B: Question Marks" },
      { x: 19.4, y: 83.3, r: 8, label: "C: Cash Cows" },
      { x: 83.1, y: 83.3, r: 8, label: "D: Dogs" }
    ],
    correct: [2],
    explain: "Cash Cows (C): Hoher Marktanteil, niedriges Marktwachstum — diese Produkte generieren stabile Gewinne bei geringen Investitionen. Sie finanzieren Stars und Question Marks."
  },
  {
    id: "beschriftung01", topic: "marketing", type: "bildbeschriftung", diff: 1, tax: "K2", reviewed: false,
    q: "Beschrifte die vier Elemente des Marketing-Mix (4P).",
    img: { src: "img/bwl/marketing/marketing_4p_beschriftung.svg", alt: "Marketing-Mix 4P ohne Labels" },
    labels: [
      { id: "l1", text: "Product (Produktpolitik)", x: 23, y: 32 },
      { id: "l2", text: "Price (Preispolitik)", x: 77, y: 32 },
      { id: "l3", text: "Place (Distributionspolitik)", x: 23, y: 81 },
      { id: "l4", text: "Promotion (Kommunikationspolitik)", x: 77, y: 81 }
    ],
    explain: "Die 4P: Product (Was? Sortiment, Qualität, Design), Price (Wie teuer? Strategie, Rabatte), Place (Wo? Vertriebskanäle, Logistik), Promotion (Wie bekannt machen? Werbung, PR, Verkaufsförderung)."
  },
  {
    id: "dragdrop01", topic: "plz", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
    q: "Ordne die folgenden Marketing-Massnahmen dem richtigen P zu.",
    img: { src: "img/bwl/marketing/marketing_4p_dragdrop.svg", alt: "Vier Spalten: Product, Price, Place, Promotion" },
    zones: [
      { id: "product", x: 2.5, y: 14, w: 22, h: 82 },
      { id: "price", x: 26, y: 14, w: 22, h: 82 },
      { id: "place", x: 49.5, y: 14, w: 22, h: 82 },
      { id: "promotion", x: 73, y: 14, w: 25, h: 82 }
    ],
    labels: [
      { id: "lb1", text: "Verpackungsdesign", zone: "product" },
      { id: "lb2", text: "Sortimentserweiterung", zone: "product" },
      { id: "lb3", text: "Rabattaktion", zone: "price" },
      { id: "lb4", text: "Skimming-Strategie", zone: "price" },
      { id: "lb5", text: "Online-Shop eröffnen", zone: "place" },
      { id: "lb6", text: "Filialstandort wählen", zone: "place" },
      { id: "lb7", text: "TV-Werbespot", zone: "promotion" },
      { id: "lb8", text: "Influencer-Kampagne", zone: "promotion" }
    ],
    explain: "Product: Sortiment, Design, Qualität. Price: Preisstrategie, Rabatte. Place: Vertriebskanäle, Standorte. Promotion: Werbung, PR, Social Media."
  }

];
