// =====================================================
// Pool: Markt- und Leistungsanalyse (BWL Kapitel 4)
// Fach: BWL | Stufe: SF GYM3
// Lehrmittel: HEP Betriebswirtschaftslehre 2023, K 4.1–4.2
// Erstellt: 2026-02-20
// =====================================================

window.POOL_META = {
  title: "Markt- und Leistungsanalyse",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM3"
};

window.TOPICS = {
  "marketing":      {label: "Marketing & Marketingkonzept", short: "Marketing"},
  "marktgroesse":   {label: "Marktgrösse: Potenzial, Volumen, Sättigung", short: "Marktgrösse"},
  "marktstellung":  {label: "Marktstellung & Marktanteil", short: "Marktstellung"},
  "segmentierung":  {label: "Marktsegmentierung & Konkurrenz", short: "Segmentierung"},
  "bcg":            {label: "BCG-Portfolio", short: "BCG"},
  "plz":            {label: "Produktlebenszyklus", short: "PLZ"}
};

window.QUESTIONS = [

  // ===================================================
  // TOPIC: marketing (Einführung Marketing, K4.1)
  // ===================================================

  // --- diff 1 ---
  {
    id: "e01", topic: "marketing", type: "tf", diff: 1, tax: "K1",
    q: "Marketing ist das Bindeglied zwischen Unternehmen und Markt.",
    correct: true,
    explain: "Marketing stellt tatsächlich das Bindeglied zwischen Unternehmen und Markt dar. Es umfasst die Aufgaben, Kundenbedürfnisse zu erkennen und zu befriedigen."
  },
  {
    id: "e02", topic: "marketing", type: "mc", diff: 1, tax: "K1",
    q: "Was ist die Hauptaufgabe des Marketings?",
    options: [
      {v: "A", t: "Kundenbedürfnisse erkennen und befriedigen"},
      {v: "B", t: "Möglichst günstige Rohstoffe einkaufen"},
      {v: "C", t: "Die Buchhaltung des Unternehmens führen"},
      {v: "D", t: "Mitarbeitende rekrutieren und schulen"}
    ],
    correct: "A",
    explain: "Marketing nimmt die Aufgaben wahr, Kundenbedürfnisse zu erkennen und zu befriedigen. Es schliesst die Denkhaltung mit ein, dass das Unternehmen immer mit Blick auf den Markt geführt werden sollte."
  },
  {
    id: "e03", topic: "marketing", type: "fill", diff: 1, tax: "K1",
    q: "Ein {0} wird entwickelt, um Produkte und Dienstleistungen bei einem breiten Publikum bekannt zu machen und den Absatz optimal zu gestalten.",
    blanks: [
      {answer: "Marketingkonzept", alts: ["Marketing-Konzept"]}
    ],
    explain: "Die Unternehmensleitung entwickelt ein Marketingkonzept in Abstimmung mit der Unternehmensstrategie, um Produkte und Dienstleistungen bekannt zu machen."
  },

  // --- diff 2 ---
  {
    id: "e04", topic: "marketing", type: "mc", diff: 2, tax: "K2",
    q: "In welcher Reihenfolge werden die vier Schritte eines Marketingkonzepts durchlaufen?",
    options: [
      {v: "A", t: "Markt- und Leistungsanalyse → Marktforschung → Produkt- und Marktziele → Marketing-Mix"},
      {v: "B", t: "Marketing-Mix → Marktforschung → Produkt- und Marktziele → Markt- und Leistungsanalyse"},
      {v: "C", t: "Marktforschung → Marketing-Mix → Markt- und Leistungsanalyse → Produkt- und Marktziele"},
      {v: "D", t: "Produkt- und Marktziele → Markt- und Leistungsanalyse → Marketing-Mix → Marktforschung"}
    ],
    correct: "A",
    explain: "Das Marketingkonzept umfasst vier Schritte in dieser Reihenfolge: 1. Markt- und Leistungsanalyse, 2. Marktforschung, 3. Produkt- und Marktziele, 4. Marketing-Mix."
  },
  {
    id: "e05", topic: "marketing", type: "multi", diff: 2, tax: "K2",
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
    q: "Das Marketingkonzept wird unabhängig von der Unternehmensstrategie entwickelt.",
    correct: false,
    explain: "Das Marketingkonzept wird in Abstimmung mit der Unternehmensstrategie entwickelt, nicht unabhängig davon."
  },

  // --- diff 3 ---
  {
    id: "e07", topic: "marketing", type: "mc", diff: 3, tax: "K4",
    q: "Warum muss die Markt- und Leistungsanalyse vor der Formulierung der Produkt- und Marktziele durchgeführt werden?",
    options: [
      {v: "A", t: "Weil erst die Analyse zeigt, welche Ziele realistisch und sinnvoll sind"},
      {v: "B", t: "Weil die Analyse gesetzlich vorgeschrieben ist"},
      {v: "C", t: "Weil die Produkt- und Marktziele nur intern relevant sind"},
      {v: "D", t: "Weil die Markt- und Leistungsanalyse die günstigste Methode ist"}
    ],
    correct: "A",
    explain: "Die Markt- und Leistungsanalyse liefert die Grundlage für realistische Zielsetzungen. Ohne Kenntnis der Marktgrösse, der Konkurrenz und der eigenen Leistungsposition wären die Ziele nicht fundiert."
  },
  {
    id: "e08", topic: "marketing", type: "mc", diff: 3, tax: "K5",
    q: "Ein Start-up plant den Markteintritt mit einem neuartigen Produkt. Es hat wenig Budget und kennt den Markt kaum. Welcher Schritt des Marketingkonzepts ist für dieses Unternehmen besonders kritisch?",
    options: [
      {v: "A", t: "Markt- und Leistungsanalyse, weil das Unternehmen den Markt zuerst verstehen muss"},
      {v: "B", t: "Marketing-Mix, weil die Werbung entscheidend ist"},
      {v: "C", t: "Produkt- und Marktziele, weil jedes Unternehmen Ziele braucht"},
      {v: "D", t: "Alle vier Schritte sind gleich wichtig"}
    ],
    correct: "A",
    explain: "Für ein Start-up, das den Markt noch nicht kennt, ist die Markt- und Leistungsanalyse besonders kritisch. Ohne dieses Wissen besteht die Gefahr, am Markt vorbei zu produzieren und knappe Ressourcen falsch einzusetzen."
  },
  {
    id: "e09", topic: "marketing", type: "tf", diff: 3, tax: "K4",
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
    q: "Welche drei Kennzahlen werden zur Analyse der Marktgrösse verwendet?",
    options: [
      {v: "A", t: "Marktpotenzial, Marktvolumen und Sättigungsgrad"},
      {v: "B", t: "Umsatz, Gewinn und Cashflow"},
      {v: "C", t: "Marktanteil, Rendite und Produktivität"},
      {v: "D", t: "Angebot, Nachfrage und Gleichgewichtspreis"}
    ],
    correct: "A",
    explain: "Für die Analyse der Marktgrösse werden drei Kennzahlen verwendet: das Marktpotenzial, das Marktvolumen und der Sättigungsgrad."
  },
  {
    id: "g02", topic: "marktgroesse", type: "fill", diff: 1, tax: "K1",
    q: "Das {0} beschreibt die theoretisch höchstmögliche Absatzmenge einer Leistung im Markt.",
    blanks: [
      {answer: "Marktpotenzial", alts: ["Markt-Potenzial", "Marktpotential", "Markt-Potential"]}
    ],
    explain: "Das Marktpotenzial beschreibt die theoretisch höchstmögliche Absatzmenge einer Leistung im Markt. Es handelt sich um eine Abschätzung der Aufnahmefähigkeit eines Marktes."
  },
  {
    id: "g03", topic: "marktgroesse", type: "tf", diff: 1, tax: "K1",
    q: "Das Marktvolumen gibt die effektiv verkaufte Menge einer Leistung pro Jahr an.",
    correct: true,
    explain: "Das Marktvolumen gibt die effektiv verkaufte Menge einer Leistung pro Jahr an. Berücksichtigt werden dabei die Umsatzzahlen aller Anbieter."
  },
  {
    id: "g04", topic: "marktgroesse", type: "mc", diff: 1, tax: "K2",
    q: "Was zeigt der Sättigungsgrad eines Marktes an?",
    options: [
      {v: "A", t: "Das Verhältnis von Marktvolumen zu Marktpotenzial"},
      {v: "B", t: "Den Gewinn des grössten Anbieters"},
      {v: "C", t: "Die Anzahl der Anbieter auf dem Markt"},
      {v: "D", t: "Das Verhältnis von Umsatz zu Kosten"}
    ],
    correct: "A",
    explain: "Der Sättigungsgrad ergibt sich aus dem Vergleich von Marktpotenzial und Marktvolumen: Sättigungsgrad in % = (Marktvolumen / Marktpotenzial) × 100."
  },

  // --- diff 2 ---
  {
    id: "g05", topic: "marktgroesse", type: "calc", diff: 2, tax: "K3",
    q: "Das Marktpotenzial für Elektrofahrräder in der Schweiz wird auf CHF 800 Mio. geschätzt. Das aktuelle Marktvolumen beträgt CHF 520 Mio. Berechnen Sie den Sättigungsgrad.",
    rows: [
      {label: "Sättigungsgrad in %", answer: 65, tolerance: 0.5, unit: "%"}
    ],
    explain: "Sättigungsgrad = (Marktvolumen / Marktpotenzial) × 100 = (520 / 800) × 100 = 65 %. Der Markt hat noch Wachstumspotenzial von rund 35 %."
  },
  {
    id: "g06", topic: "marktgroesse", type: "mc", diff: 2, tax: "K2",
    q: "Was bedeutet ein hoher Sättigungsgrad für Unternehmen auf dem Markt?",
    options: [
      {v: "A", t: "Umsatzsteigerung ist nur noch auf Kosten der Konkurrenz möglich (Verdrängungskampf)"},
      {v: "B", t: "Der Markt bietet besonders gute Wachstumschancen"},
      {v: "C", t: "Neue Unternehmen können problemlos eintreten"},
      {v: "D", t: "Die Preise werden automatisch steigen"}
    ],
    correct: "A",
    explain: "Ist der Sättigungsgrad hoch, kann der Markt kaum noch wachsen. Eine Umsatzsteigerung ist dann nur noch auf Kosten der Konkurrenz möglich – es findet ein Verdrängungskampf statt."
  },
  {
    id: "g07", topic: "marktgroesse", type: "multi", diff: 2, tax: "K2",
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
    q: "Ein tiefer Sättigungsgrad deutet auf einen wachsenden Markt hin, der für Unternehmen besonders attraktiv ist.",
    correct: true,
    explain: "Ist der Sättigungsgrad tief, befindet sich der Markt in einer Wachstumsphase – was für Unternehmen besonders attraktiv ist, da Umsatzsteigerungen leichter zu erzielen sind."
  },

  // --- diff 3 ---
  {
    id: "g09", topic: "marktgroesse", type: "calc", diff: 3, tax: "K3",
    q: "Der Schweizer Markt für Bio-Lebensmittel hat ein geschätztes Marktpotenzial von CHF 6 Mrd. und einen Sättigungsgrad von 58 %. Berechnen Sie das aktuelle Marktvolumen.",
    rows: [
      {label: "Marktvolumen in Mrd. CHF", answer: 3.48, tolerance: 0.05, unit: "Mrd. CHF"}
    ],
    explain: "Sättigungsgrad = Marktvolumen / Marktpotenzial × 100. Umgestellt: Marktvolumen = Sättigungsgrad × Marktpotenzial / 100 = 58 % × 6 Mrd. / 100 = 3.48 Mrd. CHF."
  },
  {
    id: "g10", topic: "marktgroesse", type: "mc", diff: 3, tax: "K4",
    q: "Der Markt für Streaming-Dienste in der Schweiz hat einen Sättigungsgrad von 92 %. Welche strategische Konsequenz ergibt sich daraus am ehesten für einen neuen Anbieter?",
    options: [
      {v: "A", t: "Der Eintritt ist riskant, da Wachstum nur durch Verdrängung bestehender Anbieter möglich ist"},
      {v: "B", t: "Der hohe Sättigungsgrad garantiert einen grossen Kundenstamm"},
      {v: "C", t: "Es lohnt sich, möglichst viel in Produktionskapazitäten zu investieren"},
      {v: "D", t: "Die Preise können frei gesetzt werden, da der Markt ausgereift ist"}
    ],
    correct: "A",
    explain: "Bei einem Sättigungsgrad von 92 % ist der Markt nahezu gesättigt. Neukunden zu gewinnen ist schwierig, und Wachstum ist fast nur über die Verdrängung bestehender Anbieter möglich. Ein Markteintritt ist daher sehr riskant und erfordert ein klares Differenzierungsmerkmal."
  },
  {
    id: "g11", topic: "marktgroesse", type: "mc", diff: 3, tax: "K5",
    q: "Warum ist das Marktpotenzial immer nur eine Schätzung und kein exakter Wert?",
    options: [
      {v: "A", t: "Weil es auf Annahmen über die maximale Aufnahmefähigkeit des Marktes basiert, die sich verändern können"},
      {v: "B", t: "Weil die Unternehmen ihre Umsatzzahlen geheim halten"},
      {v: "C", t: "Weil es nur für neue Märkte berechnet werden kann"},
      {v: "D", t: "Weil das Marktvolumen immer grösser ist als das Marktpotenzial"}
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
    q: "Der {0} entspricht dem Anteil in Prozent am Marktvolumen, welchen ein Unternehmen erwirtschaftet hat.",
    blanks: [
      {answer: "Marktanteil", alts: ["Markt-Anteil", "absolute Marktanteil", "absoluter Marktanteil"]}
    ],
    explain: "Der Marktanteil entspricht dem Anteil in Prozent am Marktvolumen (bzw. vom Gesamtumsatz), welchen ein Unternehmen erwirtschaftet hat."
  },
  {
    id: "s02", topic: "marktstellung", type: "mc", diff: 1, tax: "K1",
    q: "Wie wird das Unternehmen mit dem höchsten Marktanteil bezeichnet?",
    options: [
      {v: "A", t: "Marktführer"},
      {v: "B", t: "Monopolist"},
      {v: "C", t: "Marktpionier"},
      {v: "D", t: "Cash Cow"}
    ],
    correct: "A",
    explain: "Das Unternehmen mit dem höchsten Marktanteil wird als Marktführer (bzw. Marktleader) bezeichnet."
  },
  {
    id: "s03", topic: "marktstellung", type: "tf", diff: 1, tax: "K1",
    q: "Der relative Marktanteil setzt den eigenen Marktanteil ins Verhältnis zum Marktanteil des stärksten Konkurrenten.",
    correct: true,
    explain: "Der relative Marktanteil entspricht dem Marktanteil des eigenen Unternehmens im Verhältnis zu dem des stärksten Konkurrenten: Relativer Marktanteil = Eigener Marktanteil / Marktanteil des grössten Konkurrenten."
  },

  // --- diff 2 ---
  {
    id: "s04", topic: "marktstellung", type: "calc", diff: 2, tax: "K3",
    q: "Das Marktvolumen für Sportschuhe in der Schweiz beträgt CHF 450 Mio. Ein Unternehmen erzielt einen Umsatz von CHF 72 Mio. Berechnen Sie den Marktanteil des Unternehmens.",
    rows: [
      {label: "Marktanteil in %", answer: 16, tolerance: 0.1, unit: "%"}
    ],
    explain: "Marktanteil = (Umsatz des Unternehmens / Marktvolumen) × 100 = (72 / 450) × 100 = 16 %."
  },
  {
    id: "s05", topic: "marktstellung", type: "calc", diff: 2, tax: "K3",
    q: "Unternehmen A hat einen Marktanteil von 8 %. Der Marktführer (Unternehmen B) hat einen Marktanteil von 20 %. Berechnen Sie den relativen Marktanteil von Unternehmen A.",
    rows: [
      {label: "Relativer Marktanteil", answer: 0.4, tolerance: 0.01, unit: ""}
    ],
    explain: "Relativer Marktanteil = Eigener Marktanteil / Marktanteil des grössten Konkurrenten = 8 % / 20 % = 0,4. Ein Wert unter 1 bedeutet, dass das Unternehmen nicht Marktführer ist."
  },
  {
    id: "s06", topic: "marktstellung", type: "mc", diff: 2, tax: "K2",
    q: "Warum kann ein hoher Marktanteil für ein Unternehmen vorteilhaft sein?",
    options: [
      {v: "A", t: "Er ermöglicht es dem Unternehmen, den Markt nach seinen Bedingungen zu gestalten"},
      {v: "B", t: "Er senkt automatisch die Produktionskosten auf null"},
      {v: "C", t: "Er garantiert, dass keine neuen Konkurrenten eintreten"},
      {v: "D", t: "Er bedeutet, dass das Unternehmen keine Werbung mehr braucht"}
    ],
    correct: "A",
    explain: "Ein hoher Marktanteil (Marktführerschaft) kann es dem Unternehmen ermöglichen, den Markt nach seinen Bedingungen zu gestalten, z.B. bei der Preissetzung oder bei Produktstandards."
  },
  {
    id: "s07", topic: "marktstellung", type: "tf", diff: 2, tax: "K2",
    q: "Ein relativer Marktanteil von genau 1,0 bedeutet, dass das Unternehmen und sein stärkster Konkurrent gleich grosse Marktanteile haben.",
    correct: true,
    explain: "Bei einem relativen Marktanteil von 1,0 ist der eigene Marktanteil genau gleich gross wie der des grössten Konkurrenten. Ein Wert über 1,0 bedeutet Marktführerschaft."
  },

  // --- diff 3 ---
  {
    id: "s08", topic: "marktstellung", type: "calc", diff: 3, tax: "K3",
    q: "Der Pharma-Markt hat ein Marktvolumen von USD 1162 Mrd. Roche erzielt einen Umsatz von USD 62,1 Mrd. und Sinopharm (Marktführer) USD 66,3 Mrd. Berechnen Sie den Marktanteil von Roche und den relativen Marktanteil von Roche.",
    rows: [
      {label: "Marktanteil Roche in %", answer: 5.3, tolerance: 0.1, unit: "%"},
      {label: "Relativer Marktanteil Roche", answer: 0.93, tolerance: 0.02, unit: ""}
    ],
    explain: "Marktanteil Roche = (62,1 / 1162) × 100 = 5,3 %. Relativer Marktanteil Roche = 5,3 % / 5,7 % = 0,93. Obwohl Roche nicht Marktführer ist, liegt der relative Marktanteil nahe bei 1, was auf einen stark umkämpften Markt ohne klaren Dominanten hindeutet."
  },
  {
    id: "s09", topic: "marktstellung", type: "mc", diff: 3, tax: "K4",
    q: "Der relative Marktanteil von Roche im Pharma-Markt beträgt 0,93. Was lässt sich daraus über die Marktstruktur ableiten?",
    options: [
      {v: "A", t: "Der Markt ist stark umkämpft – es gibt keinen klar dominierenden Marktführer"},
      {v: "B", t: "Roche ist klarer Marktführer mit grossem Vorsprung"},
      {v: "C", t: "Der Markt ist ein Monopol"},
      {v: "D", t: "Der absolute Marktanteil von Roche ist sehr hoch"}
    ],
    correct: "A",
    explain: "Ein relativer Marktanteil von 0,93 liegt sehr nahe bei 1,0. Das bedeutet, dass Roche und der Marktführer fast gleich grosse Marktanteile haben. Der Pharma-Markt ist stark umkämpft mit mehreren grossen Anbietern, ohne dass ein einzelner dominiert."
  },
  {
    id: "s10", topic: "marktstellung", type: "multi", diff: 3, tax: "K4",
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
    q: "Was versteht man unter Marktsegmentierung?",
    options: [
      {v: "A", t: "Die Aufteilung des Gesamtmarktes in Teilmärkte (Segmente) nach bestimmten Kriterien"},
      {v: "B", t: "Die Berechnung des Marktanteils für jedes Produkt"},
      {v: "C", t: "Die Aufteilung des Gewinns auf die Abteilungen"},
      {v: "D", t: "Die geografische Expansion in neue Länder"}
    ],
    correct: "A",
    explain: "Marktsegmentierung bedeutet, den Gesamtmarkt in Teilmärkte (Marktsegmente) aufzuteilen. Die Segmente bestehen aus Konsumenten, die sich anhand bestimmter Kriterien gruppieren lassen."
  },
  {
    id: "z02", topic: "segmentierung", type: "multi", diff: 1, tax: "K1",
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
    q: "Das Unternehmen wählt aus den verschiedenen Marktsegmenten seine {0} aus.",
    blanks: [
      {answer: "Zielgruppe", alts: ["Zielgruppen"]}
    ],
    explain: "Das Unternehmen entscheidet sich, welches Marktsegment am besten geeignet ist, und wählt daraus seine Zielgruppe."
  },

  // --- diff 2 ---
  {
    id: "z04", topic: "segmentierung", type: "mc", diff: 2, tax: "K2",
    q: "Welches Segmentierungskriterium wird angewendet, wenn ein Reiseanbieter seine Angebote nach «Familien mit Kindern», «Abenteuerreisende» und «Senioren» unterteilt?",
    options: [
      {v: "A", t: "Demografie (Alter, Familienstand)"},
      {v: "B", t: "Geografie"},
      {v: "C", t: "Psychografie"},
      {v: "D", t: "Kundenverhalten"}
    ],
    correct: "A",
    explain: "Die Unterteilung nach Familien, Abenteuerreisenden und Senioren basiert primär auf demografischen Kriterien wie Alter und Familienstand."
  },
  {
    id: "z05", topic: "segmentierung", type: "mc", diff: 2, tax: "K2",
    q: "Ein Kosmetikunternehmen beschreibt seine Zielgruppe als «Frauen um die 30, die Karriere machen, Wert auf ein gepflegtes Äusseres legen und in etablierten Parfümerieketten einkaufen». Welche Segmentierungskriterien werden hier kombiniert?",
    options: [
      {v: "A", t: "Demografie und Psychografie und Kundenverhalten"},
      {v: "B", t: "Nur Demografie"},
      {v: "C", t: "Geografie und Demografie"},
      {v: "D", t: "Nur Kundenverhalten"}
    ],
    correct: "A",
    explain: "Hier werden mehrere Kriterien kombiniert: Demografie (Frauen um 30, Beruf), Psychografie (Wert auf gepflegtes Äusseres) und Kundenverhalten (Einkauf in Parfümerieketten). In der Praxis werden Marktsegmente meist anhand einer Kombination von Kriterien gebildet."
  },
  {
    id: "z06", topic: "segmentierung", type: "multi", diff: 2, tax: "K2",
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
    q: "Ein Schweizer Bio-Getränkehersteller will seine Zielgruppe definieren. Er segmentiert nach Geografie (Deutschschweiz), Demografie (25–45 Jahre, mittleres bis hohes Einkommen), Psychografie (umweltbewusst) und Kundenverhalten (kauft regelmässig im Bio-Fachhandel). Welcher Vorteil ergibt sich aus dieser Kombination?",
    options: [
      {v: "A", t: "Das Unternehmen kann seine Marketingmassnahmen sehr gezielt auf die Bedürfnisse dieser Gruppe ausrichten"},
      {v: "B", t: "Die Zielgruppe wird grösser, je mehr Kriterien verwendet werden"},
      {v: "C", t: "Das Unternehmen spart Geld, weil weniger Kunden angesprochen werden"},
      {v: "D", t: "Die Segmentierung wird überflüssig, weil die Zielgruppe zu klein ist"}
    ],
    correct: "A",
    explain: "Je präziser die Zielgruppe definiert ist, desto gezielter können Marketingmassnahmen auf deren Bedürfnisse abgestimmt werden (Produktgestaltung, Kommunikation, Vertriebskanäle). Allerdings wird die Zielgruppe kleiner (nicht grösser), was eine bewusste strategische Entscheidung ist."
  },
  {
    id: "z08", topic: "segmentierung", type: "tf", diff: 3, tax: "K4",
    q: "Zur Beantwortung von Fragen über die Konkurrenz genügt es in der Regel, das Verhalten der Konkurrenz zu beobachten und Unternehmensinformationen auszuwerten (Sekundärmarktforschung).",
    correct: true,
    explain: "Das Lehrbuch bestätigt: Zur Beantwortung von Fragen über die Konkurrenz genügt es in der Regel, die Konkurrenz zu beobachten und Unternehmensinformationen (Sekundärmarktforschung) auszuwerten."
  },
  {
    id: "z09", topic: "segmentierung", type: "mc", diff: 3, tax: "K5",
    q: "Ein Unternehmen stellt fest, dass seine Konkurrenten zunehmend in Online-Marketing investieren, während es selbst nur klassische Printwerbung einsetzt. Welche Schlussfolgerung ist am sinnvollsten?",
    options: [
      {v: "A", t: "Das Unternehmen sollte prüfen, ob es seine Kommunikationsstrategie anpassen muss, um wettbewerbsfähig zu bleiben"},
      {v: "B", t: "Das Unternehmen sollte noch mehr in Printwerbung investieren, um sich zu differenzieren"},
      {v: "C", t: "Die Konkurrenzanalyse hat keinen Einfluss auf eigene Marketingentscheide"},
      {v: "D", t: "Das Unternehmen sollte die gleiche Online-Strategie wie die Konkurrenz 1:1 kopieren"}
    ],
    correct: "A",
    explain: "Die Konkurrenzanalyse dient dazu, Stärken und Schwächen der Konkurrenz zu erkennen und daraus Schlüsse für die eigene Strategie zu ziehen. Wenn die Konkurrenz Online-Marketing nutzt und die Zielgruppe dort erreichbar ist, sollte das Unternehmen prüfen, ob eine Anpassung nötig ist. Blindes Kopieren (D) oder stures Festhalten (B) sind keine strategisch fundierten Reaktionen."
  },

  // ===================================================
  // TOPIC: bcg (K4.2b – BCG-Portfolio)
  // ===================================================

  // --- diff 1 ---
  {
    id: "b01", topic: "bcg", type: "mc", diff: 1, tax: "K1",
    q: "Von wem wurde die BCG-Portfolio-Methode entwickelt?",
    options: [
      {v: "A", t: "Boston Consulting Group"},
      {v: "B", t: "Harvard Business School"},
      {v: "C", t: "McKinsey & Company"},
      {v: "D", t: "Schweizerische Nationalbank"}
    ],
    correct: "A",
    explain: "Die BCG-Portfolio-Methode wurde von der Boston Consulting Group (BCG) entwickelt, einem weltweit tätigen Managementberatungs-Unternehmen."
  },
  {
    id: "b02", topic: "bcg", type: "fill", diff: 1, tax: "K1",
    q: "Die BCG-Portfolio-Methode beurteilt Leistungen anhand von zwei Grössen: dem {0} und dem {1}.",
    blanks: [
      {answer: "Marktwachstum", alts: ["Markt-Wachstum"]},
      {answer: "relativen Marktanteil", alts: ["Marktanteil", "rel. Marktanteil"]}
    ],
    explain: "Das BCG-Portfolio beurteilt Leistungen nach zwei Grössen: dem Marktwachstum (y-Achse) und dem relativen Marktanteil (x-Achse)."
  },
  {
    id: "b03", topic: "bcg", type: "multi", diff: 1, tax: "K1",
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
    q: "Welche Leistungen zeichnen sich durch einen hohen Marktanteil und niedrige Marktwachstumsraten aus?",
    options: [
      {v: "A", t: "Cash Cows"},
      {v: "B", t: "Stars"},
      {v: "C", t: "Question Marks"},
      {v: "D", t: "Poor Dogs"}
    ],
    correct: "A",
    explain: "Cash Cows haben einen hohen Marktanteil bei niedrigen Marktwachstumsraten. Sie waren in der Regel vorher Stars, deren Marktwachstum zurückgegangen ist."
  },

  // --- diff 2 ---
  {
    id: "b05", topic: "bcg", type: "mc", diff: 2, tax: "K2",
    q: "Was ist die Normstrategie für Poor Dogs?",
    options: [
      {v: "A", t: "Ausstieg – Abbau der Leistungen und Einsatz der Ressourcen für besser positionierte Produkte"},
      {v: "B", t: "Intensive Marktbearbeitung durch hohe Werbeinvestitionen"},
      {v: "C", t: "Position halten und ausbauen"},
      {v: "D", t: "Keine nennenswerten Investitionen mehr tätigen"}
    ],
    correct: "A",
    explain: "Poor Dogs haben einen kleinen Marktanteil und niedrige Marktwachstumsraten. Die Normstrategie ist der Ausstieg: Abbau dieser Leistungen und Einsatz der frei werdenden Ressourcen für besser positionierte Marktleistungen."
  },
  {
    id: "b06", topic: "bcg", type: "mc", diff: 2, tax: "K2",
    q: "Warum sind Stars trotz ihres Erfolgs kostenintensiv?",
    options: [
      {v: "A", t: "Weil sie hohe Investitionen in Werbung und Marktbearbeitung erfordern, um die Position zu halten"},
      {v: "B", t: "Weil sie in einem schrumpfenden Markt operieren"},
      {v: "C", t: "Weil sie keinen Umsatz generieren"},
      {v: "D", t: "Weil sie nur für den internen Gebrauch bestimmt sind"}
    ],
    correct: "A",
    explain: "Stars haben einen hohen Marktanteil in wachsenden Märkten. Um diese Position zu halten oder auszubauen, sind hohe Investitionen in Werbung und Marktbearbeitung nötig – Stars sind daher werbe- und kostenintensiv."
  },
  {
    id: "b07", topic: "bcg", type: "tf", diff: 2, tax: "K2",
    q: "Cash Cows erwirtschaften hohe und stabile Gewinne bei niedrigen Ausgaben, weil sie keine nennenswerten Investitionen mehr erfordern.",
    correct: true,
    explain: "Da Cash Cows ihre Leistung früher oder später verlieren werden, wird kaum noch investiert. Trotzdem erzielen sie einen beachtlichen Umsatz bei kaum noch Ausgaben, weshalb sie hohe und stabile Gewinne abwerfen."
  },
  {
    id: "b08", topic: "bcg", type: "multi", diff: 2, tax: "K2",
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
    img: {src: "img/bwl/marketing/bcg_portfolio_01.svg", alt: "BCG-Portfolio mit vier Leistungen eines Unternehmens"},
    q: "Ein Unternehmen hat folgendes Portfolio: Leistung A (Poor Dog, CHF 200'000), Leistung B (Star, CHF 425'000), Leistung C (Cash Cow / Star-Grenze, CHF 800'000), Leistung D (Cash Cow, CHF 950'000). Warum ist dieses Portfolio problematisch?",
    options: [
      {v: "A", t: "Es fehlt an Nachfolgeprodukten (Question Marks), die langfristig Stars werden könnten"},
      {v: "B", t: "Es hat zu viele Stars"},
      {v: "C", t: "Die Cash Cows sind zu profitabel"},
      {v: "D", t: "Das Unternehmen hat zu wenig Poor Dogs"}
    ],
    correct: "A",
    explain: "Obwohl das Portfolio viele umsatzstarke Leistungen hat, fehlen Question Marks als Nachfolgeprodukte. Wenn die Cash Cows und Stars ihre Marktposition verlieren, hat das Unternehmen keine Nachfolger – es wird mittel- bis langfristig Probleme bekommen."
  },
  {
    id: "b10", topic: "bcg", type: "mc", diff: 3, tax: "K5",
    q: "Ein Unternehmen hat drei Cash Cows und ein Question Mark. Wie sollte es seine finanziellen Mittel strategisch einsetzen?",
    options: [
      {v: "A", t: "Gewinne der Cash Cows nutzen, um das Question Mark durch intensive Marktbearbeitung zum Star zu entwickeln"},
      {v: "B", t: "Alle Mittel in die Cash Cows investieren, um deren Position zu sichern"},
      {v: "C", t: "Das Question Mark sofort aufgeben, da es noch keinen Gewinn erwirtschaftet"},
      {v: "D", t: "Die Cash Cows sofort abbauen und nur noch das Question Mark betreiben"}
    ],
    correct: "A",
    explain: "Die Cash Cows generieren hohe Gewinne bei niedrigen Investitionskosten. Diese Mittel sollten strategisch eingesetzt werden, um das Question Mark durch intensive Marktbearbeitung zum Star zu entwickeln – das sichert die Zukunft des Unternehmens."
  },
  {
    id: "b11", topic: "bcg", type: "mc", diff: 3, tax: "K4",
    q: "Welcher Zusammenhang besteht zwischen dem BCG-Portfolio und dem Produktlebenszyklus?",
    options: [
      {v: "A", t: "Produkte durchlaufen typischerweise die Phasen Question Mark → Star → Cash Cow → Poor Dog"},
      {v: "B", t: "Cash Cows sind immer in der Einführungsphase des Produktlebenszyklus"},
      {v: "C", t: "Das BCG-Portfolio und der Produktlebenszyklus haben nichts miteinander zu tun"},
      {v: "D", t: "Stars befinden sich immer in der Rückgangsphase"}
    ],
    correct: "A",
    explain: "Es besteht ein typischer Zusammenhang: Neue Produkte starten oft als Question Marks (Einführungsphase), werden bei Erfolg zu Stars (Wachstumsphase), dann zu Cash Cows (Reife-/Sättigungsphase) und schliesslich zu Poor Dogs (Rückgangsphase)."
  },
  {
    id: "b12", topic: "bcg", type: "tf", diff: 3, tax: "K5",
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
    q: "Welche fünf Phasen umfasst der Produktlebenszyklus?",
    options: [
      {v: "A", t: "Einführung, Wachstum, Reife, Sättigung und Rückgang"},
      {v: "B", t: "Planung, Produktion, Verkauf, Service und Entsorgung"},
      {v: "C", t: "Forschung, Entwicklung, Test, Markt und Auslauf"},
      {v: "D", t: "Start, Aufstieg, Höhepunkt, Abstieg und Ende"}
    ],
    correct: "A",
    explain: "Der Produktlebenszyklus umfasst fünf Phasen: Einführung, Wachstum, Reife, Sättigung und Rückgang. Diese beschreiben den Verlauf von Umsatz und Gewinn über die Zeit."
  },
  {
    id: "p02", topic: "plz", type: "fill", diff: 1, tax: "K1",
    q: "Der Punkt, an dem die Umsatzkurve die Gewinnschwelle erreicht, heisst {0}.",
    blanks: [
      {answer: "Break-even", alts: ["Break-Even", "Breakeven", "Gewinnschwelle", "Break even"]}
    ],
    explain: "Die Gewinnschwelle (Break-even) ist der Punkt, an dem der Umsatz erstmals die Kosten deckt und das Produkt beginnt, Gewinn zu erzielen."
  },
  {
    id: "p03", topic: "plz", type: "tf", diff: 1, tax: "K1",
    q: "In der Einführungsphase wird in der Regel noch kaum Gewinn realisiert, obwohl der Umsatz bereits steigt.",
    correct: true,
    explain: "In der Einführungsphase sind die Kosten sehr hoch (Anfangsinvestitionen, Bekanntmachung), sodass bei steigendem Umsatz noch kaum Gewinn realisiert wird."
  },
  {
    id: "p04", topic: "plz", type: "mc", diff: 1, tax: "K1",
    q: "In welcher Phase des Produktlebenszyklus erreichen Umsatz und Gewinnkurve ihren Höhepunkt?",
    options: [
      {v: "A", t: "Reifephase"},
      {v: "B", t: "Einführungsphase"},
      {v: "C", t: "Wachstumsphase"},
      {v: "D", t: "Sättigungsphase"}
    ],
    correct: "A",
    explain: "In der Reifephase weist der Markt ein hohes Volumen auf. Die Gewinnkurve und die Absatzmenge erreichen ihren Höhepunkt."
  },

  // --- diff 2 ---
  {
    id: "p05", topic: "plz", type: "mc", diff: 2, tax: "K2",
    q: "Warum besteht in der Einführungsphase ein hohes Risiko für das Produkt?",
    options: [
      {v: "A", t: "Weil sich entscheidet, ob sich die Leistung am Markt durchsetzen kann – falls nicht, wird sie sofort aus dem Sortiment genommen"},
      {v: "B", t: "Weil die Konkurrenz in dieser Phase am stärksten ist"},
      {v: "C", t: "Weil der Gewinn am höchsten ist und viel Steuern anfallen"},
      {v: "D", t: "Weil die Produktionskapazitäten nicht ausreichen"}
    ],
    correct: "A",
    explain: "In der Einführungsphase entscheidet sich, ob die Leistung am Markt Fuss fassen kann. Falls nicht, wird sie aus dem Sortiment genommen. Das Risiko des Scheiterns ist hier am höchsten."
  },
  {
    id: "p06", topic: "plz", type: "multi", diff: 2, tax: "K2",
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
    q: "Was geschieht typischerweise in der Rückgangsphase eines Produkts?",
    options: [
      {v: "A", t: "Der Umsatz bricht ein, der Gewinn tendiert gegen null oder es resultieren Verluste"},
      {v: "B", t: "Der Umsatz steigt noch einmal leicht an"},
      {v: "C", t: "Das Unternehmen investiert stark in Werbung"},
      {v: "D", t: "Die Konkurrenz zieht sich vom Markt zurück und der Gewinn steigt"}
    ],
    correct: "A",
    explain: "In der Rückgangsphase wenden sich Kunden neuen, innovativeren Produkten zu. Der Umsatz bricht ein, der Gewinn tendiert gegen null oder es entstehen sogar Verluste. Das Unternehmen ersetzt die Leistung durch neue Produkte."
  },
  {
    id: "p08", topic: "plz", type: "tf", diff: 2, tax: "K2",
    q: "In der Reifephase richten sich Marketingaktivitäten vor allem gegen die Mitkonkurrenten, um Marktanteile zu gewinnen.",
    correct: true,
    explain: "In der Reifephase können Marktanteilsgewinne beinahe nur noch auf Kosten der Konkurrenz erreicht werden. Die Marketingaktivitäten richten sich daher gegen die Mitkonkurrenten, z.B. durch Betonung des Markenprestiges."
  },

  // --- diff 3 ---
  {
    id: "p09", topic: "plz", type: "mc", diff: 3, tax: "K4",
    q: "Coca-Cola (seit 1886) und das iPhone (seit 2007) durchlaufen beide den Produktlebenszyklus. Was erklärt den Unterschied in der Dauer der Sättigungsphase?",
    options: [
      {v: "A", t: "Die Sättigungsphase variiert stark je nach Produkt – bei Konsumgütern des täglichen Bedarfs kann sie sehr lang sein, bei Technologieprodukten deutlich kürzer"},
      {v: "B", t: "Coca-Cola hat die Sättigungsphase übersprungen"},
      {v: "C", t: "Das iPhone befindet sich noch in der Einführungsphase"},
      {v: "D", t: "Der Produktlebenszyklus gilt nur für technische Produkte"}
    ],
    correct: "A",
    explain: "Die Dauer der einzelnen Phasen, insbesondere der Sättigungsphase, variiert stark je nach Produktart. Produkte wie Coca-Cola halten sich seit über 100 Jahren, während Technologieprodukte wie Handys und Computer innerhalb kurzer Zeit veralten."
  },
  {
    id: "p10", topic: "plz", type: "mc", diff: 3, tax: "K5",
    q: "Warum ist es für ein Unternehmen wichtig, dass sich seine verschiedenen Marktleistungen nicht alle in derselben Phase des Produktlebenszyklus befinden?",
    options: [
      {v: "A", t: "Weil die Geldflüsse (Investitionen, Umsatz, Gewinne) sich gegenseitig ausgleichen müssen, damit das Unternehmen nicht plötzlich ohne verkaufbare Leistung dasteht"},
      {v: "B", t: "Weil der Produktlebenszyklus vorschreibt, dass maximal ein Produkt pro Phase erlaubt ist"},
      {v: "C", t: "Weil die Kunden Abwechslung im Sortiment erwarten"},
      {v: "D", t: "Weil die Steuerbehörde eine Streuung der Produkte verlangt"}
    ],
    correct: "A",
    explain: "Es ist entscheidend, dass sich die Produkte in verschiedenen Phasen befinden, damit die Geldflüsse die Waage halten: Cash Cows (Reife/Sättigung) finanzieren neue Produkte in der Einführungs- und Wachstumsphase. So steht das Unternehmen nicht plötzlich ohne einzige verkaufbare Leistung da."
  },
  {
    id: "p11", topic: "plz", type: "mc", diff: 3, tax: "K4",
    q: "Swiffer lancierte nach Swiffer Dry auch Swiffer Wet, und Rivella erweiterte sein Sortiment über die Jahre um neue Geschmacksrichtungen. In welcher Phase des Produktlebenszyklus treten solche Varianten typischerweise auf?",
    options: [
      {v: "A", t: "In der Sättigungsphase, um den Ausstieg hinauszuzögern"},
      {v: "B", t: "In der Einführungsphase, um den Markt zu testen"},
      {v: "C", t: "In der Wachstumsphase, um schnell Marktanteile zu gewinnen"},
      {v: "D", t: "In der Rückgangsphase, als letzter Rettungsversuch"}
    ],
    correct: "A",
    explain: "In der Sättigungsphase werden häufig Varianten zur ursprünglichen Marktleistung lanciert, um den Ausstieg hinauszuzögern. Die Beispiele Swiffer (Dry → Wet) und Rivella (neue Geschmacksrichtungen) illustrieren diese Strategie."
  },
  {
    id: "p12", topic: "plz", type: "tf", diff: 3, tax: "K5",
    q: "Das Modell des Produktlebenszyklus lässt sich nutzen, um den exakten Zeitpunkt vorherzusagen, an dem ein Produkt in die Rückgangsphase eintritt.",
    correct: false,
    explain: "Der Produktlebenszyklus ist ein vereinfachtes Modell, das typische Muster beschreibt. Er kann nicht exakte Zeitpunkte vorhersagen. Die Dauer der Phasen ist von Produkt zu Produkt sehr unterschiedlich und hängt von vielen Faktoren ab (technologischer Wandel, Konsumverhalten, Konkurrenz). Um festzustellen, in welcher Phase sich ein Produkt befindet, wird Marktforschung betrieben."
  }

];
