// ============================================================
// Pool: BWL – Unternehmensmodell
// Fach: BWL | Stufe: SF GYM1
// Lehrplanbezug: Unternehmensmodell mit Umweltsphären und
//   Anspruchsgruppen, Zielbeziehungen, ökonomische Prinzipien
// Erstellt: 2026-02-21
// ============================================================

window.POOL_META = {
  id: "bwl_unternehmensmodell",
  title: "Unternehmensmodell – Umweltsphären & Anspruchsgruppen",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM1",
  lernziele: [
    "Ich kann die Elemente des Unternehmensmodells (Umweltsphären und Anspruchsgruppen) erklären. (K2)",
    "Ich kann Wechselwirkungen zwischen Unternehmen und Umwelt analysieren. (K4)",
    "Ich kann das Unternehmensmodell auf konkrete Fallbeispiele anwenden. (K3)"
  ]
};

window.TOPICS = {
  "modelle":           {label: "Modelle in der BWL",                       short: "Modelle", lernziele: ["Ich kann erklären, warum in der BWL Modelle verwendet werden (Vereinfachung, Verständnis). (K2)", "Ich kann das Unternehmensmodell als zentrales BWL-Modell beschreiben. (K2)"]},
  "anspruchsgruppen":  {label: "Anspruchsgruppen & ihre Ansprüche",        short: "Anspruchsgruppen", lernziele: ["Ich kann die wichtigsten Anspruchsgruppen (Stakeholder) eines Unternehmens nennen. (K1)", "Ich kann die Ansprüche und Beiträge verschiedener Anspruchsgruppen beschreiben. (K2)"]},
  "zielbeziehungen":   {label: "Zielbeziehungen & Wertansätze",            short: "Zielbeziehungen", lernziele: ["Ich kann Zielkonflikte zwischen verschiedenen Anspruchsgruppen erkennen. (K4)", "Ich kann den Shareholder- und den Stakeholder-Ansatz vergleichen. (K4)"]},
  "umweltsphaeren":    {label: "Die fünf Umweltsphären",                   short: "Umweltsphären", lernziele: ["Ich kann die fünf Umweltsphären (ökologisch, technologisch, ökonomisch, sozial, rechtlich) beschreiben. (K1)", "Ich kann erklären, wie die Umweltsphären auf ein Unternehmen einwirken. (K2)"]},
  "wechselwirkungen":  {label: "Wechselwirkungen Unternehmen & Umwelt",    short: "Wechselwirkungen", lernziele: ["Ich kann die Wechselwirkungen zwischen Unternehmen und ihren Umweltsphären analysieren. (K4)", "Ich kann anhand von Beispielen zeigen, wie Veränderungen in der Umwelt Chancen und Risiken für Unternehmen schaffen. (K3)"]},
  "verhaltensweisen":  {label: "Verhaltensweisen von Unternehmen",         short: "Verhaltensweisen", lernziele: ["Ich kann verschiedene Verhaltensweisen von Unternehmen (reaktiv, aktiv, proaktiv, interaktiv) unterscheiden. (K2)", "Ich kann beurteilen, welche Verhaltensstrategie in einer bestimmten Situation angemessen ist. (K5)"]},
  "anwendung":         {label: "Anwendung & Fallbeispiele",                short: "Anwendung", lernziele: ["Ich kann das Unternehmensmodell auf ein konkretes Unternehmen anwenden. (K3)", "Ich kann eine Anspruchsgruppenanalyse für ein reales Fallbeispiel durchführen. (K3)"]}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: modelle
  // ============================================================

  {
    id: "m01", topic: "modelle", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was ist ein Modell in der Betriebswirtschaftslehre?",
    options: [
      {v: "A", t: "Eine Anweisung der Geschäftsleitung"},
      {v: "B", t: "Eine exakte Kopie der Realität"},
      {v: "C", t: "Ein Gesetz, das immer gilt"},
      {v: "D", t: "Eine vereinfachte Darstellung der Wirklichkeit"}
    ],
    correct: "D",
    explain: "Modelle sind Abbildungen einer bestimmten Wirklichkeit, die einen Ausschnitt daraus vereinfacht darstellen. Sie helfen, komplexe Zusammenhänge zu ordnen und zu verstehen."
  },
  {
    id: "m02", topic: "modelle", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Buchhaltung eines Unternehmens ist ein Beispiel für ein Beschreibungsmodell.",
    correct: true,
    explain: "In einer Buchhaltung werden sämtliche Geschäftsfälle im Zeitablauf erfasst und dargestellt – also beschrieben, ohne Ursachen zu erklären oder Handlungsempfehlungen abzugeben."
  },
  {
    id: "m03", topic: "modelle", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Ein Modell, das Ursachen von betrieblichen Prozessabläufen erklären soll, wird als {0} bezeichnet.",
    blanks: [
      {answer: "Erklärungsmodell", alts: ["Erklaerungsmodell"]}
    ],
    explain: "Erklärungsmodelle dienen dazu, Hypothesen über Gesetzmässigkeiten aufzustellen, z.B. die Annahme, dass mit zunehmender Produktionsmenge die Stückkosten sinken."
  },
  {
    id: "m04", topic: "modelle", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welches Modell wird aufgestellt, um optimale Handlungsmöglichkeiten für die Zukunft zu bestimmen?",
    options: [
      {v: "A", t: "Beschreibungsmodell"},
      {v: "B", t: "Entscheidungsmodell"},
      {v: "C", t: "Erklärungsmodell"},
      {v: "D", t: "Prognosemodell"}
    ],
    correct: "B",
    explain: "Entscheidungsmodelle werden aufgestellt, um die Bestimmung optimaler Handlungsmöglichkeiten zu erleichtern. Sie enthalten Aussagen, die auf die Zukunft gerichtet sind."
  },
  {
    id: "m05", topic: "modelle", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Aussagen zu Modellen treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Modelle stellen komplexe reale Zustände vereinfacht dar."},
      {v: "B", t: "Das St. Galler Unternehmensmodell ist ein Entscheidungsmodell."},
      {v: "C", t: "Modelle helfen, Entscheidungsfaktoren zu ordnen und zu gewichten."},
      {v: "D", t: "Ein einzelnes Modell kann die gesamte Wirklichkeit exakt abbilden."}
    ],
    correct: ["A", "C"],
    explain: "Modelle sind vereinfachte Darstellungen (A korrekt) und helfen bei der Ordnung von Faktoren (C korrekt). Das St. Galler Unternehmensmodell ist ein Erklärungs- und Beschreibungsmodell, kein Entscheidungsmodell (B falsch). Kein Modell kann die gesamte Wirklichkeit exakt abbilden (D falsch)."
  },
  {
    id: "m06", topic: "modelle", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Unternehmen nutzt historische Verkaufsdaten, um den Umsatz der nächsten Quartale vorherzusagen. Welche Modellarten kommen dabei zum Einsatz?",
    options: [
      {v: "A", t: "Nur ein Beschreibungsmodell"},
      {v: "B", t: "Beschreibungsmodell → Erklärungsmodell → Entscheidungsmodell"},
      {v: "C", t: "Erst ein Beschreibungsmodell, dann ein Erklärungsmodell"},
      {v: "D", t: "Nur ein Entscheidungsmodell"}
    ],
    correct: "B",
    explain: "Zuerst werden die historischen Daten beschrieben (Beschreibungsmodell), dann werden Muster und Ursachen identifiziert (Erklärungsmodell, z.B. saisonale Schwankungen), und schliesslich wird daraus eine Prognose für Entscheidungen abgeleitet (Entscheidungsmodell)."
  },
  {
    id: "m07", topic: "modelle", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein Erklärungsmodell könnte die Hypothese aufstellen, dass mit zunehmender Produktionsmenge die Stückkosten sinken.",
    correct: true,
    explain: "Genau so funktionieren Erklärungsmodelle: Sie stellen Hypothesen über Gesetzmässigkeiten auf. Die Annahme sinkender Stückkosten bei steigender Produktion (Skaleneffekte) ist ein klassisches Beispiel."
  },
  {
    id: "m08", topic: "modelle", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Warum ist es problematisch, unternehmerische Entscheidungen ausschliesslich auf ein einziges Modell zu stützen?",
    options: [
      {v: "A", t: "Jedes Modell vereinfacht die Realität und blendet bestimmte Aspekte aus."},
      {v: "B", t: "Modelle können nur die Vergangenheit abbilden."},
      {v: "C", t: "Modelle sind nur für grosse Unternehmen geeignet."},
      {v: "D", t: "Modelle sind immer falsch und daher nutzlos."}
    ],
    correct: "A",
    explain: "Modelle sind bewusste Vereinfachungen. Sie zeigen nur einen Ausschnitt der Realität. Wer sich auf ein einziges Modell verlässt, riskiert, wichtige Faktoren zu übersehen. Deshalb ist es sinnvoll, verschiedene Modelle und Perspektiven zu kombinieren."
  },
  {
    id: "m09", topic: "modelle", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Die Grenzen des Modelldenkens zu erkennen gehört laut Lehrplan zu den Kompetenzen, die Schülerinnen und Schüler im Fach Wirtschaft und Recht erwerben sollen.",
    correct: true,
    explain: "Der Lehrplan fordert explizit, dass SuS Modelle anwenden und zur Lösung konkreter Probleme beiziehen, aber auch die Grenzen des Modelldenkens erkennen."
  },

  // ============================================================
  // TOPIC: anspruchsgruppen
  // ============================================================

  {
    id: "a01", topic: "anspruchsgruppen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was sind Anspruchsgruppen (Stakeholder)?",
    options: [
      {v: "A", t: "Organisierte oder nicht organisierte Gruppen, die Ansprüche an ein Unternehmen stellen"},
      {v: "B", t: "Die Geschäftsleitung eines Unternehmens"},
      {v: "C", t: "Nur die Aktionäre eines Unternehmens"},
      {v: "D", t: "Staatliche Behörden, die Unternehmen kontrollieren"}
    ],
    correct: "A",
    explain: "Anspruchsgruppen (Stakeholder) sind organisierte oder nicht organisierte Gruppen von Unternehmen, Menschen oder Institutionen, die Ansprüche an ein Unternehmen stellen. Dazu gehören z.B. Kunden, Mitarbeitende, Lieferanten, Staat, Kapitalgeber, Konkurrenz und die Öffentlichkeit."
  },
  {
    id: "a02", topic: "anspruchsgruppen", type: "multi", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche der folgenden gehören zu den typischen Anspruchsgruppen eines Unternehmens? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kundinnen und Kunden"},
      {v: "B", t: "Mitarbeitende"},
      {v: "C", t: "Eigenkapitalgeber"},
      {v: "D", t: "Umweltsphären"}
    ],
    correct: ["A", "B", "C"],
    explain: "Kunden, Mitarbeitende und Eigenkapitalgeber sind Anspruchsgruppen (A, B, C korrekt). Umweltsphären sind keine Anspruchsgruppen, sondern bilden das Umfeld, in dem Unternehmen und Anspruchsgruppen agieren (D falsch)."
  },
  {
    id: "a03", topic: "anspruchsgruppen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Anspruchsgruppe, die ein gutes Preis-Leistungs-Verhältnis, Zusatzleistungen und guten Service erwartet, sind die {0}.",
    blanks: [
      {answer: "Kunden", alts: ["Kundinnen und Kunden", "Kundinnen", "Kundschaft"]}
    ],
    explain: "Kundinnen und Kunden erwarten ein gutes Preis-Leistungs-Verhältnis, Zusatzleistungen und guten Service vom Unternehmen."
  },
  {
    id: "a04", topic: "anspruchsgruppen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welchen Anspruch haben Fremdkapitalgeber (z.B. Banken) typischerweise an ein Unternehmen?",
    options: [
      {v: "A", t: "Möglichst hoher Zins, pünktliche Rückzahlung und Sicherheiten"},
      {v: "B", t: "Tiefe Preise und guter Service"},
      {v: "C", t: "Hohe Steuereinnahmen und Arbeitsplätze"},
      {v: "D", t: "Fairer Lohn und Arbeitsplatzsicherheit"}
    ],
    correct: "A",
    explain: "Fremdkapitalgeber wie Banken erwarten einen möglichst hohen Zins für ihr ausgeliehenes Kapital, pünktliche Rückzahlung sowie Sicherheiten, damit ihr Risiko begrenzt bleibt."
  },
  {
    id: "a05", topic: "anspruchsgruppen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was erwarten Mitarbeitende typischerweise von einem Unternehmen?",
    options: [
      {v: "A", t: "Wertsteigerung der Anteile und hohe Dividende"},
      {v: "B", t: "Finanzielle Unterstützung bei Projekten (Sponsoring)"},
      {v: "C", t: "Langfristige Lieferbeziehungen und hohe Preise"},
      {v: "D", t: "Fairen Lohn, gute Arbeitsbedingungen und Weiterbildungsmöglichkeiten"}
    ],
    correct: "D",
    explain: "Mitarbeitende erwarten einen fairen Lohn, Weiterbildungs- und Mitwirkungsmöglichkeiten, Arbeitsplatzsicherheit sowie gute Arbeitsbedingungen."
  },
  {
    id: "a06", topic: "anspruchsgruppen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Ansprüche hat der Staat (Gemeinde, Kanton, Bund) an ein Unternehmen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Hohe Steuereinnahmen"},
      {v: "B", t: "Schaffung und Erhaltung von Arbeitsplätzen"},
      {v: "C", t: "Einhalten von Gesetzen"},
      {v: "D", t: "Möglichst hohe Dividende"}
    ],
    correct: ["A", "B", "C"],
    explain: "Der Staat erwartet hohe Steuereinnahmen (A), die Schaffung und Erhaltung zukunftsorientierter Arbeitsplätze (B) sowie gesellschaftlich verantwortliches Handeln und das Einhalten von Gesetzen (C). Dividenden sind ein Anspruch der Eigenkapitalgeber, nicht des Staates (D falsch)."
  },
  {
    id: "a07", topic: "anspruchsgruppen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Konkurrenz ist keine Anspruchsgruppe, weil sie dem Unternehmen feindlich gesinnt ist.",
    correct: false,
    explain: "Die Konkurrenz ist durchaus eine Anspruchsgruppe. Sie erwartet faires Verhalten im Wettbewerb (z.B. kein Preisdumping) und Mitwirkung in Branchenverbänden."
  },
  {
    id: "a08", topic: "anspruchsgruppen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Technologieunternehmen plant, die Produktion ins Ausland zu verlagern. Welche Anspruchsgruppen sind davon am stärksten betroffen?",
    options: [
      {v: "A", t: "Nur die Konkurrenz, da sie einen Vorteil erhält"},
      {v: "B", t: "Nur die Aktionäre, da der Aktienkurs schwanken könnte"},
      {v: "C", t: "Nur die Kunden, da die Qualität sinken könnte"},
      {v: "D", t: "Mitarbeitende (Arbeitsplatzverlust), Staat (Steuereinnahmen), Lieferanten (Auftragsverlust)"}
    ],
    correct: "D",
    explain: "Eine Produktionsverlagerung betrifft vor allem Mitarbeitende (drohendem Arbeitsplatzverlust), den Staat (Rückgang von Steuereinnahmen und Arbeitsplätzen) und Lieferanten (Verlust von Aufträgen). Natürlich können auch andere Gruppen betroffen sein, aber diese drei spüren die Auswirkungen am direktesten."
  },
  {
    id: "a09", topic: "anspruchsgruppen", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Institutionen wie Gewerkschaften, Umweltverbände und Parteien gehören ebenfalls zu den Anspruchsgruppen eines Unternehmens.",
    correct: true,
    explain: "Institutionen (z.B. Verbände, Presse, Parteien, Vereine) bilden eine eigene Anspruchsgruppe. Sie erwarten z.B. finanzielle Unterstützung bei Projekten (Sponsoring) und achten auf die Einhaltung ökologischer und sozialer Standards."
  },
  {
    id: "a10", topic: "anspruchsgruppen", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Warum agiert ein Unternehmen laut dem Unternehmensmodell nicht isoliert?",
    options: [
      {v: "A", t: "Weil Unternehmen keinen Selbstzweck haben"},
      {v: "B", t: "Weil es in dauernder Wechselbeziehung mit seinem Umfeld, anderen Unternehmen und verschiedenen Personengruppen steht"},
      {v: "C", t: "Weil es vom Staat dazu gezwungen wird"},
      {v: "D", t: "Weil es nur so Gewinne erzielen kann"}
    ],
    correct: "B",
    explain: "Das Unternehmensmodell zeigt, dass Unternehmen in dauernder Wechselbeziehung mit ihrem Umfeld stehen – mit Anspruchsgruppen und den Umweltsphären. Diese Beziehungen sind vielfältig und komplex und beeinflussen die Ziele und Entscheide des Unternehmens massgeblich."
  },
  {
    id: "a11", topic: "anspruchsgruppen", type: "fill", diff: 2, tax: "K1",
 reviewed:false,
    q: "Eigenkapitalgeber erwarten vom Unternehmen eine {0} der Anteile (Shareholder-Value), eine hohe {1} und Sicherheit für das eingesetzte Kapital.",
    blanks: [
      {answer: "Wertsteigerung", alts: ["Werterhöhung", "Wertzunahme"]},
      {answer: "Rentabilität", alts: ["Rendite", "Dividende"]}
    ],
    explain: "Eigenkapitalgeber (Eigentümer, Aktionäre) erwarten eine Wertsteigerung der Anteile (Shareholder-Value), eine möglichst hohe Rentabilität (Rendite/Dividende) und Sicherheit für das eingesetzte Kapital."
  },
  {
    id: "a12", topic: "anspruchsgruppen", type: "multi", diff: 2, tax: "K3",
 reviewed:false,
    img: {src: "img/bwl/unternehmensmodell/unternehmensmodell_vollstaendig_01.svg", alt: "Unternehmensmodell mit Unternehmen im Zentrum, umgeben von acht Ellipsen mit Fragezeichen und fünf farbigen Umweltsphären-Segmenten"},
    q: "Das Diagramm zeigt das Unternehmensmodell mit acht Anspruchsgruppen (als ‹?› dargestellt). Welche der folgenden Gruppen gehören zu den typischen acht Anspruchsgruppen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kunden, Mitarbeitende, Lieferanten"},
      {v: "B", t: "Konkurrenz, Staat, Kapitalgeber"},
      {v: "C", t: "NGOs, UNO, Weltbank"},
      {v: "D", t: "Öffentlichkeit/Institutionen wie Medien und Verbände"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die acht typischen Anspruchsgruppen sind: Kunden, Mitarbeitende, Lieferanten, Konkurrenz, Staat, Eigenkapitalgeber, Fremdkapitalgeber und Öffentlichkeit/Institutionen (Medien, Verbände, Parteien). NGOs, UNO und Weltbank (C) gehören nicht zu den typischen acht, obwohl sie als Teil der Öffentlichkeit/Institutionen Einfluss nehmen können."
  },

  // ============================================================
  // TOPIC: zielbeziehungen
  // ============================================================

  {
    id: "z01", topic: "zielbeziehungen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was bedeutet «Zielharmonie» zwischen zwei Anspruchsgruppen?",
    options: [
      {v: "A", t: "Beide Ziele können nie gleichzeitig erreicht werden."},
      {v: "B", t: "Die beiden Ziele beeinflussen sich gegenseitig nicht."},
      {v: "C", t: "Die Erfüllung des einen Ziels führt zu einer Minderung des anderen Ziels."},
      {v: "D", t: "Durch das Erreichen des einen Ziels wird die Erfüllung des anderen Ziels gesteigert."}
    ],
    correct: "D",
    explain: "Bei einer Zielharmonie (komplementäre Ziele) fördert das Erreichen des einen Ziels gleichzeitig das andere Ziel. Beide Seiten profitieren."
  },
  {
    id: "z02", topic: "zielbeziehungen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Man unterscheidet drei Arten von Zielbeziehungen: {0}, Neutralität und {1}.",
    blanks: [
      {answer: "Harmonie", alts: ["Zielharmonie"]},
      {answer: "Konkurrenz", alts: ["Konflikt", "Zielkonflikt", "Zielkonkurrenz"]}
    ],
    explain: "Die drei Zielbeziehungen sind: Harmonie (Ziele fördern sich gegenseitig), Neutralität (Ziele beeinflussen sich nicht) und Konkurrenz/Konflikt (Ziele behindern sich gegenseitig)."
  },
  {
    id: "z03", topic: "zielbeziehungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Mitarbeitenden fordern höhere Löhne, gleichzeitig möchte das Unternehmen die Kosten senken. Welche Zielbeziehung liegt vor?",
    options: [
      {v: "A", t: "Zielkonflikt (Konkurrenz)"},
      {v: "B", t: "Zielidentität"},
      {v: "C", t: "Zielneutralität"},
      {v: "D", t: "Zielharmonie"}
    ],
    correct: "A",
    explain: "Höhere Löhne bedeuten höhere Kosten für das Unternehmen. Das Ziel der Mitarbeitenden (höherer Lohn) und das Unternehmensziel (Kostensenkung) stehen in Konkurrenz zueinander – ein klassischer Zielkonflikt."
  },
  {
    id: "z04", topic: "zielbeziehungen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/unternehmensmodell/shareholder_stakeholder_vergleich_01.svg", alt: "Vergleich zweier Ansätze: Ansatz A mit Fokus auf eine Gruppe und Gewinnmaximierung, Ansatz B mit Fokus auf alle Gruppen und Ausgewogenheit"},
    q: "Betrachten Sie das Diagramm. Welche Begriffe gehören zu Ansatz A und Ansatz B?",
    options: [
      {v: "A", t: "A = Stakeholder-Value, B = Shareholder-Value"},
      {v: "B", t: "A = Unternehmensmodell, B = Umweltmodell"},
      {v: "C", t: "A = Shareholder-Value, B = Stakeholder-Value"},
      {v: "D", t: "A = Kostenführerschaft, B = Differenzierungsstrategie"}
    ],
    correct: "C",
    explain: "Ansatz A zeigt den Shareholder-Value-Ansatz: Fokus auf nur eine Gruppe (Eigentümer/Aktionäre) mit dem Ziel der Gewinnmaximierung und kurzfristiger Perspektive. Ansatz B zeigt den Stakeholder-Value-Ansatz: Alle Anspruchsgruppen werden berücksichtigt, mit dem Ziel der Ausgewogenheit und langfristiger Perspektive."
  },
  {
    id: "z05", topic: "zielbeziehungen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zum Stakeholder-Value-Ansatz treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Unternehmen muss mehreren Anspruchsgruppen gerecht werden."},
      {v: "B", t: "Die langfristig ausgewogene Berücksichtigung aller Anspruchsgruppen soll den Shareholder-Value maximieren."},
      {v: "C", t: "Nur die Interessen der Kunden zählen."},
      {v: "D", t: "Eine höhere Motivation der Mitarbeitenden führt zu besseren Leistungsergebnissen."}
    ],
    correct: ["A", "B", "D"],
    explain: "Der Stakeholder-Value-Ansatz setzt auf das Bewusstsein, dass ein Unternehmen mehreren Anspruchsgruppen gerecht werden muss (A), insbesondere Kunden und Mitarbeitenden. Die langfristig ausgewogene Berücksichtigung aller Gruppen soll letztlich auch den Shareholder-Value steigern (B). Höhere Mitarbeitermotivation führt zu besseren Ergebnissen (D). Es zählen nicht nur die Kunden (C falsch)."
  },
  {
    id: "z06", topic: "zielbeziehungen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Zielneutralität bedeutet, dass sich zwei Ziele gegenseitig nicht beeinflussen.",
    correct: true,
    explain: "Bei neutralen Zielbeziehungen hat die Erfüllung des einen Ziels keinen Einfluss auf die Erfüllung des anderen Ziels. Die beiden Ziele existieren unabhängig voneinander."
  },
  {
    id: "z07", topic: "zielbeziehungen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Unternehmen investiert in bessere Arbeitsbedingungen. Die Mitarbeitenden sind zufriedener und produktiver, was zu höheren Gewinnen führt. Welche Zielbeziehung besteht hier zwischen den Ansprüchen der Mitarbeitenden und der Eigenkapitalgeber?",
    options: [
      {v: "A", t: "Zielkonflikt, weil die Investition kurzfristig Kosten verursacht"},
      {v: "B", t: "Die Beziehung lässt sich nicht bestimmen"},
      {v: "C", t: "Zielharmonie, weil beide Seiten langfristig profitieren"},
      {v: "D", t: "Zielneutralität, weil die Bereiche nichts miteinander zu tun haben"}
    ],
    correct: "C",
    explain: "Obwohl kurzfristig Kosten entstehen, profitieren langfristig sowohl Mitarbeitende (bessere Bedingungen) als auch Eigenkapitalgeber (höhere Gewinne durch Produktivitätssteigerung). Das ist ein Beispiel für Zielharmonie im Sinne des Stakeholder-Value-Ansatzes."
  },
  {
    id: "z08", topic: "zielbeziehungen", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Der Shareholder-Value-Ansatz kann langfristige Unternehmensziele gefährden, z.B. durch verminderte Reinvestitionen des Gewinns.",
    correct: true,
    explain: "Wenn ein Unternehmen konsequent nur die kurzfristige Gewinnmaximierung verfolgt, kann es langfristige Investitionen (z.B. in Forschung, Mitarbeitende, Nachhaltigkeit) vernachlässigen. Das gefährdet die langfristigen Unternehmensziele."
  },
  {
    id: "z09", topic: "zielbeziehungen", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Zwischen den Forderungen der Eigenkapitalgeber und den Forderungen der Fremdkapitalgeber besteht meistens:",
    options: [
      {v: "A", t: "Keine Beziehung"},
      {v: "B", t: "Zielneutralität"},
      {v: "C", t: "Ein starker Zielkonflikt"},
      {v: "D", t: "Weitgehende Zielharmonie"}
    ],
    correct: "D",
    explain: "Eigen- und Fremdkapitalgeber stehen in weitgehender Zielharmonie zueinander: Beide möchten eine hohe Rendite erzielen bzw. ihre Kapitaleinlage gesichert wissen. Die Förderung des einen Anspruchs (z.B. Wertsteigerung) fördert auch das Vertrauen der anderen Gruppe."
  },
  {
    id: "z10", topic: "zielbeziehungen", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein Unternehmen will die Preise senken, um mehr Kunden zu gewinnen. Welche Zielkonflikte können dadurch entstehen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Konflikt mit Eigenkapitalgebern wegen tieferer Gewinnmargen"},
      {v: "B", t: "Konflikt mit Lieferanten, die höhere Preise fordern"},
      {v: "C", t: "Konflikt mit dem Staat wegen tieferer Steuereinnahmen"},
      {v: "D", t: "Harmonie mit der Konkurrenz, die ebenfalls von tieferen Preisen profitiert"}
    ],
    correct: ["A", "B"],
    explain: "Preissenkungen können zu Konflikten mit Eigenkapitalgebern führen, die höhere Gewinne erwarten (A), und mit Lieferanten, deren hohe Preise bei tieferen Verkaufspreisen nicht mehr tragbar sind (B). Der Effekt auf den Staat (C) ist indirekt und nicht zwangsläufig ein Hauptkonflikt. Die Konkurrenz hat durch Preissenkungen eher einen Nachteil, keine Harmonie (D falsch)."
  },
  {
    id: "z11", topic: "zielbeziehungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/unternehmensmodell/zielbeziehungen_schema_01.svg", alt: "Drei Typen von Zielbeziehungen: Typ A mit zwei steigenden Zielen, Typ B mit unabhängigen Zielen, Typ C mit gegenläufigen Zielen"},
    q: "Betrachten Sie das Diagramm. Welche Bezeichnungen passen zu den drei Typen A, B und C?",
    options: [
      {v: "A", t: "A = Zielneutralität, B = Zielkonkurrenz, C = Zielharmonie"},
      {v: "B", t: "A = Zielharmonie, B = Zielkonkurrenz, C = Zielneutralität"},
      {v: "C", t: "A = Zielkonkurrenz, B = Zielharmonie, C = Zielneutralität"},
      {v: "D", t: "A = Zielharmonie, B = Zielneutralität, C = Zielkonkurrenz"}
    ],
    correct: "D",
    explain: "Typ A zeigt Zielharmonie: Beide Ziele steigen gemeinsam — die Erreichung des einen Ziels fördert das andere. Typ B zeigt Zielneutralität: Die Ziele beeinflussen sich gegenseitig nicht. Typ C zeigt Zielkonkurrenz (Zielkonflikt): Ein Ziel steigt, das andere sinkt — die Erreichung des einen Ziels beeinträchtigt das andere."
  },

  // ============================================================
  // TOPIC: umweltsphaeren
  // ============================================================

  {
    id: "u01", topic: "umweltsphaeren", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "In wie viele Umweltsphären wird die Unternehmensumwelt im St. Galler Unternehmensmodell unterteilt?",
    options: [
      {v: "A", t: "Sechs"},
      {v: "B", t: "Vier"},
      {v: "C", t: "Fünf"},
      {v: "D", t: "Drei"}
    ],
    correct: "C",
    explain: "Die Unternehmensumwelt wird in fünf Umweltsphären unterteilt: die ökonomische, technologische, ökologische, soziale und rechtliche Umweltsphäre."
  },
  {
    id: "u02", topic: "umweltsphaeren", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die fünf Umweltsphären sind: ökonomische, {0}, ökologische, soziale und {1} Umweltsphäre.",
    blanks: [
      {answer: "technologische", alts: ["Technologische"]},
      {answer: "rechtliche", alts: ["Rechtliche"]}
    ],
    explain: "Die fünf Umweltsphären sind: ökonomisch, technologisch, ökologisch, sozial und rechtlich."
  },
  {
    id: "u03", topic: "umweltsphaeren", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Konjunktur, Inflationsrate und Wechselkurse sind Grössen welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Ökonomische Umweltsphäre"},
      {v: "B", t: "Rechtliche Umweltsphäre"},
      {v: "C", t: "Soziale Umweltsphäre"},
      {v: "D", t: "Technologische Umweltsphäre"}
    ],
    correct: "A",
    explain: "Konjunktur, Inflationsrate und Wechselkurse sind gesamtwirtschaftliche Rahmenbedingungen und gehören zur ökonomischen Umweltsphäre."
  },
  {
    id: "u04", topic: "umweltsphaeren", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Bodenknappheit, Rohstoffvorkommen und Klimaerwärmung sind Einflüsse welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Ökologische Umweltsphäre"},
      {v: "B", t: "Soziale Umweltsphäre"},
      {v: "C", t: "Technologische Umweltsphäre"},
      {v: "D", t: "Ökonomische Umweltsphäre"}
    ],
    correct: "A",
    explain: "Natürliche Gegebenheiten wie Bodenknappheit, Rohstoffvorkommen und Klimaerwärmung gehören zur ökologischen Umweltsphäre. Diese Umweltsphäre umfasst alle Einflüsse aus der natürlichen Umgebung."
  },
  {
    id: "u05", topic: "umweltsphaeren", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Entwicklungen gehören zur technologischen Umweltsphäre? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Neue Produktionsverfahren und Roboter"},
      {v: "B", t: "Digitalisierung und Internet"},
      {v: "C", t: "Demografische Entwicklung"},
      {v: "D", t: "Neue Werbe- und Verkaufsplattformen durch das Internet"}
    ],
    correct: ["A", "B", "D"],
    explain: "Neue Produktionstechniken, Roboter, Digitalisierung, Internet und daraus entstehende neue Plattformen gehören zur technologischen Umweltsphäre (A, B, D korrekt). Die demografische Entwicklung (Bevölkerungsstruktur) gehört zur sozialen Umweltsphäre (C falsch)."
  },
  {
    id: "u06", topic: "umweltsphaeren", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Einstellungen und Werthaltungen der Menschen in einer Gesellschaft, z.B. zu Themen wie Sonntagsverkauf oder fremde Kulturen, gehören zu welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Soziale Umweltsphäre"},
      {v: "B", t: "Ökonomische Umweltsphäre"},
      {v: "C", t: "Rechtliche Umweltsphäre"},
      {v: "D", t: "Ökologische Umweltsphäre"}
    ],
    correct: "A",
    explain: "In der sozialen Umweltsphäre betrachten wir Einflüsse aus dem Zusammenleben und den Werthaltungen der Menschen: z.B. Themen wie Sonntagsverkauf, Gleichstellung, Kindertagesstätten oder Offenheit gegenüber anderen Ländern."
  },
  {
    id: "u07", topic: "umweltsphaeren", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Einführung des Rauchverbots im Kanton Bern, das grosse Auswirkungen auf Gastronomiebetriebe hatte, ist ein Beispiel für die rechtliche Umweltsphäre.",
    correct: true,
    explain: "Gesetze und Verordnungen wie das Rauchverbot gehören zur rechtlichen Umweltsphäre. Das Beispiel zeigt, wie ein neues Gesetz direkte Auswirkungen auf Unternehmen haben kann (Umbauten, veränderte Kundenströme)."
  },
  {
    id: "u08", topic: "umweltsphaeren", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Winterferienort unter 1200 m ü.M. hat wegen des Klimawandels kaum noch Schnee und muss in Beschneiungsanlagen investieren. Welche Umweltsphäre wirkt hier primär auf das Unternehmen?",
    options: [
      {v: "A", t: "Rechtliche Umweltsphäre"},
      {v: "B", t: "Ökologische Umweltsphäre"},
      {v: "C", t: "Soziale Umweltsphäre"},
      {v: "D", t: "Ökonomische Umweltsphäre"}
    ],
    correct: "B",
    explain: "Der Klimawandel ist ein Phänomen der ökologischen Umweltsphäre. Er führt zu weniger Schnee in tieferen Lagen, was die Tourismusunternehmen direkt betrifft und zu Investitionen in Beschneiungsanlagen oder alternative Angebote zwingt."
  },
  {
    id: "u09", topic: "umweltsphaeren", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche ökologischen Zielbereiche unterscheidet man im Zusammenhang mit der ökologischen Umweltsphäre? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ressourcenziel: knappe Ressourcen erhalten und schonen"},
      {v: "B", t: "Emissionsziel: Emissionen vermeiden, vermindern, verwerten, entsorgen"},
      {v: "C", t: "Risikoziel: potentielle Gefahren vermindern, verhindern, begrenzen"},
      {v: "D", t: "Gewinnziel: ökologische Massnahmen gewinnbringend umsetzen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Die drei ökologischen Zielbereiche sind: Ressourcenschutz (A), Emissionsbegrenzung (B) und Risikobegrenzung (C). Ein «Gewinnziel» ist kein ökologischer Zielbereich (D falsch) — das gehört eher zur ökonomischen Sphäre.",
    img: {src: "img/bwl/unternehmensmodell/unternehmensmodell_oekologische_zielbereiche_01.svg", alt: "Diagramm: Drei ökologische Zielbereiche mit ihren Teilzielen"}
  },
  {
    id: "u10", topic: "umweltsphaeren", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Abgaswerte, Werbeverbote für Tabak und gesetzlich geregelte Ladenöffnungszeiten sind Beispiele für die rechtliche Umweltsphäre.",
    correct: true,
    explain: "All diese Beispiele betreffen gesetzliche Regelungen und Verordnungen, die zur rechtlichen Umweltsphäre gehören und das Handeln von Unternehmen direkt beeinflussen."
  },
  {
    id: "u11", topic: "umweltsphaeren", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein neues Gesetz zur CO₂-Bepreisung betrifft ein Industrieunternehmen. Welche Umweltsphären sind hier verknüpft?",
    options: [
      {v: "A", t: "Die rechtliche, ökologische und ökonomische Umweltsphäre"},
      {v: "B", t: "Nur die rechtliche Umweltsphäre"},
      {v: "C", t: "Alle fünf Umweltsphären gleichermassen"},
      {v: "D", t: "Die rechtliche und die ökologische Umweltsphäre"}
    ],
    correct: "A",
    explain: "Ein CO₂-Gesetz ist ein rechtlicher Rahmen (rechtlich), der auf ein ökologisches Problem reagiert (ökologisch) und finanzielle Auswirkungen auf das Unternehmen hat (ökonomisch). Die Umweltsphären sind nicht immer eindeutig voneinander abzugrenzen — ein CO₂-Gesetz kann gleichzeitig der rechtlichen und der ökologischen Sphäre zugeordnet werden."
  },

  // ============================================================
  // TOPIC: wechselwirkungen
  // ============================================================

  {
    id: "w01", topic: "wechselwirkungen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Unternehmen können ihre Umweltsphären aktiv steuern und kontrollieren.",
    correct: false,
    explain: "Die Umweltsphären sind durch das Unternehmen weder steuerbar noch kontrollierbar. Es bestehen zwar Wechselwirkungen (das Unternehmen beeinflusst die Umwelt und umgekehrt), aber die Umweltsphären entwickeln sich nach eigenen Gesetzmässigkeiten."
  },
  {
    id: "w02", topic: "wechselwirkungen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    img: {src: "img/bwl/unternehmensmodell/umweltsphaeren_wechselwirkung_01.svg", alt: "Diagramm mit Unternehmen und Umweltsphären, drei nummerierte Pfeile zeigen verschiedene Wechselwirkungen"},
    q: "Das Diagramm zeigt drei Arten von Wechselwirkungen. Welche Aussage beschreibt alle drei korrekt?",
    options: [
      {v: "A", t: "Nur: Unternehmen → Anspruchsgruppen"},
      {v: "B", t: "Sphäre ↔ Sphäre, Sphäre ↔ Unternehmen, Unternehmen ↔ Sphäre"},
      {v: "C", t: "Nur zwischen Anspruchsgruppen untereinander"},
      {v: "D", t: "Nur: Umweltsphäre → Unternehmen"}
    ],
    correct: "B",
    explain: "Im Unternehmensmodell gibt es drei Arten von Wechselwirkungen: zwischen Sphären untereinander, von Sphären auf das Unternehmen und vom Unternehmen auf die Sphären. Alle Richtungen sind möglich."
  },
  {
    id: "w03", topic: "wechselwirkungen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Unternehmen baut eine neue Fabrik und schafft 200 Arbeitsplätze in einer Region. Welche Wechselwirkung findet statt?",
    options: [
      {v: "A", t: "Umweltsphäre → Unternehmen (ökonomisch)"},
      {v: "B", t: "Unternehmen → Umweltsphäre (ökonomisch und sozial)"},
      {v: "C", t: "Anspruchsgruppe → Unternehmen (Staat fordert Arbeitsplätze)"},
      {v: "D", t: "Sphäre → Sphäre (sozial → ökonomisch)"}
    ],
    correct: "B",
    explain: "Das Unternehmen beeinflusst aktiv seine Umwelt: Es schafft Arbeitsplätze (soziale Wirkung) und stärkt die regionale Wirtschaft (ökonomische Wirkung). Das ist eine Wechselwirkung vom Unternehmen auf die Umweltsphären."
  },
  {
    id: "w04", topic: "wechselwirkungen", type: "multi", diff: 2, tax: "K3",
 reviewed:false,
    q: "Inwiefern beeinflusst eine Rezession (Konjunkturabschwung) ein Unternehmen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Umsatz vieler Güter sinkt."},
      {v: "B", t: "Die Nachfrage nach Produkten geht zurück."},
      {v: "C", t: "Die technologische Entwicklung wird beschleunigt."},
      {v: "D", t: "Das Unternehmen muss seine Strategie anpassen."}
    ],
    correct: ["A", "B", "D"],
    explain: "In einer Rezession sinken Umsätze (A) und Nachfrage (B), weshalb Unternehmen ihre Strategie anpassen müssen (D). Die technologische Entwicklung wird nicht zwangsläufig durch eine Rezession beschleunigt (C falsch) — eher im Gegenteil, da Investitionen in F&E oft gekürzt werden."
  },
  {
    id: "w05", topic: "wechselwirkungen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Warum ist die Analyse der Umwelt und die Prognose kommender Entwicklungen eine vordringliche Aufgabe der Unternehmensführung?",
    options: [
      {v: "A", t: "Weil die Konkurrenz es auch macht"},
      {v: "B", t: "Weil die Anspruchsgruppen es verlangen"},
      {v: "C", t: "Weil es gesetzlich vorgeschrieben ist"},
      {v: "D", t: "Weil ein optimales Miteinander von Unternehmen und Umwelt ein wesentlicher Wettbewerbsvorteil ist"}
    ],
    correct: "D",
    explain: "Die Umweltvoraussetzungen sind für Unternehmen einer Branche in derselben Region oft ähnlich. Wenn es einem Unternehmen gelingt, ein optimales Miteinander mit seiner Umwelt zu schaffen, ist das ein wesentlicher Wettbewerbsvorteil."
  },
  {
    id: "w06", topic: "wechselwirkungen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Umweltsphären sind immer eindeutig voneinander abzugrenzen.",
    correct: false,
    explain: "Die Umweltsphären sind nicht immer eindeutig voneinander abzugrenzen. So kann z.B. die Einhaltung von Umweltverordnungen sowohl zur ökologischen als auch zur rechtlichen Umweltsphäre gezählt werden. Die Sphären überlappen sich in der Praxis häufig."
  },
  {
    id: "w07", topic: "wechselwirkungen", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Ein Unternehmen stösst grosse Mengen CO₂ aus. Die Regierung erlässt daraufhin strengere Emissionsgesetze. Welche Wechselwirkungskette liegt vor?",
    options: [
      {v: "A", t: "Rechtliche Sphäre → Unternehmen → soziale Sphäre"},
      {v: "B", t: "Soziale Sphäre → Unternehmen → ökonomische Sphäre"},
      {v: "C", t: "Unternehmen → ökologische Sphäre → rechtliche Sphäre → Unternehmen"},
      {v: "D", t: "Ökonomische Sphäre → Unternehmen → technologische Sphäre"}
    ],
    correct: "C",
    explain: "Das Unternehmen belastet die Umwelt (Unternehmen → ökologische Sphäre), was zu gesellschaftlichem und politischem Druck führt und in neue Gesetze mündet (ökologische → rechtliche Sphäre). Diese Gesetze wirken wiederum auf das Unternehmen zurück (rechtliche Sphäre → Unternehmen). Ein Beispiel für eine Wechselwirkungskette über mehrere Sphären.",
    img: {src: "img/bwl/unternehmensmodell/unternehmensmodell_wechselwirkungen_01.svg", alt: "Diagramm: Wechselwirkungskette zwischen Unternehmen und Umweltsphären"}
  },
  {
    id: "w08", topic: "wechselwirkungen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Entwicklungstrends aus der Umwelt müssen vom Unternehmen laufend {0} werden.",
    blanks: [
      {answer: "analysiert", alts: ["beobachtet", "untersucht"]}
    ],
    explain: "Unternehmen können ihre Umwelt nicht steuern, aber sie müssen die Entwicklungstrends laufend analysieren, um rechtzeitig reagieren oder proaktiv handeln zu können."
  },
  {
    id: "w09", topic: "wechselwirkungen", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Die vollständige Darstellung des Unternehmensmodells zeigt, dass zwischen allen Elementen (Unternehmen, Anspruchsgruppen, Umweltsphären) vielfältige Beziehungen und Wechselwirkungen bestehen.",
    correct: true,
    explain: "Im vollständigen Modell werden Unternehmen, Anspruchsgruppen und Umweltsphären zusammengefügt. Zwischen allen Elementen bestehen vielfältige Beziehungen und Wechselwirkungen, die das Unternehmen laufend analysieren und berücksichtigen muss."
  },

  // ============================================================
  // TOPIC: verhaltensweisen
  // ============================================================

  {
    id: "v01", topic: "verhaltensweisen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welche drei grundsätzlichen Verhaltensweisen kann ein Unternehmen gegenüber seiner Umwelt einnehmen?",
    options: [
      {v: "A", t: "Innovation, Imitation und Fusion"},
      {v: "B", t: "Wachstum, Stagnation und Schrumpfung"},
      {v: "C", t: "Beharren, Reaktion und Aktion"},
      {v: "D", t: "Analyse, Planung und Kontrolle"}
    ],
    correct: "C",
    explain: "Die drei grundsätzlichen Verhaltensweisen sind: Beharren (am Bestehenden festhalten), Reaktion (auf Veränderungen reagieren) und Aktion (proaktiv Veränderungen vorantreiben)."
  },
  {
    id: "v02", topic: "verhaltensweisen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Ein Unternehmen, das vorausschauend handelt und Veränderungen aktiv vorantreibt, zeigt die Verhaltensweise der {0}.",
    blanks: [
      {answer: "Aktion", alts: ["Proaktion", "aktiven Gestaltung"]}
    ],
    explain: "Aktion bedeutet, dass das Unternehmen proaktiv handelt, Trends erkennt und vorausschauend neue Wege geht, bevor es durch die Umwelt dazu gezwungen wird."
  },
  {
    id: "v03", topic: "verhaltensweisen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Ein Detailhändler führt erst einen Online-Shop ein, nachdem die meisten Konkurrenten dies bereits getan haben und die Umsätze im stationären Handel stark gesunken sind. Welche Verhaltensweise zeigt das Unternehmen?",
    options: [
      {v: "A", t: "Reaktion"},
      {v: "B", t: "Aktion"},
      {v: "C", t: "Innovation"},
      {v: "D", t: "Beharren"}
    ],
    correct: "A",
    explain: "Das Unternehmen reagiert erst auf den Druck der Umwelt (sinkende Umsätze, Konkurrenz online). Es handelt nicht vorausschauend (das wäre Aktion), aber auch nicht untätig (das wäre Beharren). Es reagiert – allerdings spät."
  },
  {
    id: "v04", topic: "verhaltensweisen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zur Verhaltensweise «Beharren» treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Unternehmen hält an bestehenden Strategien und Prozessen fest."},
      {v: "B", t: "Beharren kann kurzfristig Stabilität bieten."},
      {v: "C", t: "Langfristiges Beharren ist immer die beste Strategie."},
      {v: "D", t: "Beharren kann dazu führen, dass das Unternehmen den Anschluss verliert."}
    ],
    correct: ["A", "B", "D"],
    explain: "Beharren bedeutet, am Bestehenden festzuhalten (A). Das kann kurzfristig Stabilität bieten (B), birgt aber langfristig das Risiko, den Anschluss an Entwicklungen zu verlieren (D). Es ist nicht immer die beste Strategie (C falsch)."
  },
  {
    id: "v05", topic: "verhaltensweisen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein Unternehmen, das als erstes in seiner Branche eine KI-gestützte Kundenbetreuerung einführt, zeigt die Verhaltensweise der Aktion.",
    correct: true,
    explain: "Das Unternehmen handelt proaktiv und geht einen neuen Weg, bevor die Konkurrenz dies tut. Es reagiert nicht auf einen bestehenden Druck, sondern gestaltet aktiv die Zukunft. Das ist Aktion."
  },
  {
    id: "v06", topic: "verhaltensweisen", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Welche Verhaltensweise wäre für ein Unternehmen in einem sich schnell wandelnden technologischen Umfeld langfristig am riskantesten?",
    options: [
      {v: "A", t: "Aktion – weil sie teuer ist"},
      {v: "B", t: "Reaktion – weil sie immer zu spät kommt"},
      {v: "C", t: "Alle drei sind gleich riskant"},
      {v: "D", t: "Beharren – weil das Unternehmen technologische Entwicklungen verpasst"}
    ],
    correct: "D",
    explain: "In einem sich schnell wandelnden technologischen Umfeld ist Beharren am riskantesten, weil das Unternehmen wichtige Entwicklungen verpasst und den Anschluss an den Markt verlieren kann. Beispiele dafür gibt es viele (z.B. Kodak und die Digitalfotografie)."
  },
  {
    id: "v07", topic: "verhaltensweisen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Ein traditioneller Buchladen beobachtet den Aufstieg von E-Books und Online-Händlern. Er entscheidet sich, neben dem Buchverkauf auch Lesungen, Autorentreffen und ein Café anzubieten. Welche Verhaltensweise zeigt er?",
    options: [
      {v: "A", t: "Sowohl Reaktion als auch Aktion"},
      {v: "B", t: "Reaktion, weil er erst auf den Druck des Marktes reagiert"},
      {v: "C", t: "Aktion, weil er kreativ neue Wege geht"},
      {v: "D", t: "Beharren, weil er weiterhin Bücher verkauft"}
    ],
    correct: "A",
    explain: "Der Buchladen reagiert auf den Druck durch Online-Händler (Reaktion), geht aber gleichzeitig kreativ neue Wege, indem er sein Geschäftsmodell um Erlebnisangebote erweitert (Aktion). In der Praxis sind die Verhaltensweisen oft nicht trennscharf – hier zeigt das Unternehmen Elemente von Reaktion und Aktion."
  },
  {
    id: "v08", topic: "verhaltensweisen", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Reaktion bedeutet, dass ein Unternehmen auf Veränderungen in der Umwelt antwortet, anstatt sie selbst auszulösen.",
    correct: true,
    explain: "Bei der Reaktion wartet das Unternehmen, bis Veränderungen eintreten, und passt sich dann daran an. Im Gegensatz zur Aktion, bei der das Unternehmen selbst Veränderungen vorantreibt."
  },

  // ============================================================
  // TOPIC: anwendung (Fallstudie Brent Spar und Transfer)
  // ============================================================

  {
    id: "f01", topic: "anwendung", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was war die Brent Spar?",
    options: [
      {v: "A", t: "Ein Öltanker der Shell AG"},
      {v: "B", t: "Ein Umweltschutzprojekt von Greenpeace"},
      {v: "C", t: "Ein schwimmender Speichertank (Ölplattform) von Shell in der Nordsee"},
      {v: "D", t: "Eine Raffinerie an der britischen Küste"}
    ],
    correct: "C",
    explain: "Die Brent Spar war ein schwimmender Speichertank (Öl-Lagerplattform), der 1975/76 in Norwegen montiert wurde, um Rohöl anderer Bohrinseln zwischenzulagern. Sie war 137 Meter hoch und 14'500 Tonnen schwer."
  },
  {
    id: "f02", topic: "anwendung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche zwei Entsorgungsvarianten standen bei der Brent Spar zur Diskussion?",
    options: [
      {v: "A", t: "Stehen lassen oder verschrotten"},
      {v: "B", t: "Sprengung vor Ort oder Transport nach Afrika"},
      {v: "C", t: "Verkauf an eine andere Firma oder Umbau zu einem Hotel"},
      {v: "D", t: "Versenken in tiefer See oder vollständiger Abbau an Land"}
    ],
    correct: "D",
    explain: "Die zwei Hauptvarianten waren: Variante 1 – Versenken in einem tiefen atlantischen Graben (ca. 2'375 m Tiefe), und Variante 2 – Vollständiger Abbau an Land (Plattform an Land schleppen und auseinandernehmen)."
  },
  {
    id: "f03", topic: "anwendung", type: "multi", diff: 2, tax: "K3",
 reviewed:false,
    q: "Welche Anspruchsgruppen spielten im Fall Brent Spar eine wichtige Rolle? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kunden (Boykott der Shell-Tankstellen)"},
      {v: "B", t: "Öffentlichkeit und Medien (öffentlicher Druck)"},
      {v: "C", t: "Staat (britische Regierung, Nordsee-Anrainerstaaten)"},
      {v: "D", t: "Konkurrenz (Vorbildwirkung für die gesamte Branche)"}
    ],
    correct: ["A", "B", "C", "D"],
    explain: "Alle genannten Anspruchsgruppen spielten eine zentrale Rolle: Kunden drohten mit Boykott (A), die Öffentlichkeit und Medien übten enormen Druck aus (B), die britische Regierung und die Nordsee-Anrainerstaaten waren regulatorisch beteiligt (C), und die Entscheidung hatte Vorbildcharakter für die gesamte Ölbranche mit ca. 418 weiteren zu entsorgenden Plattformen (D)."
  },
  {
    id: "f04", topic: "anwendung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Im Fall Brent Spar argumentierte die Ökonomin Elke Reeding, dass die Versenkungskosten bei ca. 24 Mio. Franken liegen, der Landabbau aber bei ca. 94 Mio. Franken. Welche Umweltsphäre steht bei ihrem Bericht im Vordergrund?",
    options: [
      {v: "A", t: "Technologische Umweltsphäre"},
      {v: "B", t: "Ökonomische Umweltsphäre"},
      {v: "C", t: "Soziale Umweltsphäre"},
      {v: "D", t: "Ökologische Umweltsphäre"}
    ],
    correct: "B",
    explain: "Die Ökonomin analysiert primär die Kosten und finanziellen Konsequenzen der Entsorgungsvarianten. Ihr Bericht fokussiert auf die ökonomische Umweltsphäre: Kosten, Gewinnwirkung, Steuereffekte, Wettbewerbsvorteile."
  },
  {
    id: "f05", topic: "anwendung", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Der Kommunikationsspezialist Aldo Müller empfahl im Fall Brent Spar den Landabbau, obwohl dieser viermal teurer war. Was war sein Hauptargument?",
    options: [
      {v: "A", t: "Die Mitarbeitenden hätten sich geweigert, die Versenkung durchzuführen."},
      {v: "B", t: "Die technischen Risiken der Versenkung seien zu hoch."},
      {v: "C", t: "Ein Imagegewinn als umweltbewusstes Unternehmen sei langfristig wertvoller als die Kostenersparnis."},
      {v: "D", t: "Die britische Regierung hätte die Versenkung ohnehin verboten."}
    ],
    correct: "C",
    explain: "Aldo Müller argumentierte aus der sozialen Perspektive: Ein möglicher Boykott und der damit verbundene Imageverlust wären katastrophal teuer. Umgekehrt könnte Shell sich durch den Landabbau als Vorreiterin im Umweltschutz positionieren und langfristig Marktanteile gewinnen."
  },
  {
    id: "f06", topic: "anwendung", type: "tf", diff: 2, tax: "K1",
 reviewed:false,
    q: "Shell entschied sich letztlich für den vollständigen Abbau der Brent Spar an Land.",
    correct: true,
    explain: "Am 20. Juni 1995 beschloss Shell unter dem enormen öffentlichen Druck, die Brent Spar an Land zu entsorgen. Ein Grossteil der gereinigten Aussenhülle wurde als Fundament für einen Hafen verwendet, der Rest verschrottet."
  },
  {
    id: "f07", topic: "anwendung", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    q: "Was war die langfristig bedeutendste Folge des Brent-Spar-Falls?",
    options: [
      {v: "A", t: "Shell ging bankrott."},
      {v: "B", t: "Alle Ölplattformen in der Nordsee wurden sofort abgebaut."},
      {v: "C", t: "Die 15 Nordsee-Anrainerstaaten beschlossen 1998 ein Versenkungsverbot für Ölplattformen."},
      {v: "D", t: "Greenpeace wurde verboten."}
    ],
    correct: "C",
    explain: "Die bedeutendste Folge war das 1998 von den 15 Anrainerstaaten einstimmig beschlossene Plattform-Versenkungsverbot im Nordostatlantik. Der Fall gilt als einer der ersten grossen Erfolge von Konsumenten gegen einen Grosskonzern."
  },
  {
    id: "f08", topic: "anwendung", type: "multi", diff: 3, tax: "K4",
 reviewed:false,
    q: "Welche Lehren lassen sich aus dem Fall Brent Spar für das Unternehmensmodell ziehen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Unternehmen müssen die Ansprüche aller Stakeholder ernst nehmen, nicht nur die ökonomischen."},
      {v: "B", t: "Die billigste Lösung ist immer die beste."},
      {v: "C", t: "Die öffentliche Meinung und Medien können enormen Druck auf Unternehmen ausüben."},
      {v: "D", t: "Ökologische, ökonomische und soziale Zielkonflikte erfordern eine sorgfältige Abwägung."}
    ],
    correct: ["A", "C", "D"],
    explain: "Der Fall zeigt, dass Unternehmen alle Stakeholder berücksichtigen müssen (A), die öffentliche Meinung massiven Druck aufbauen kann (C) und komplexe Zielkonflikte sorgfältig abgewogen werden müssen (D). Die billigste Lösung ist nicht immer die beste (B falsch) — Shell hätte bei der Versenkung zwar kurzfristig gespart, aber langfristig durch Boykott und Imageschaden viel mehr verloren."
  },
  {
    id: "f09", topic: "anwendung", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Welches Modell wird durch den Fall Brent Spar besonders gut illustriert?",
    options: [
      {v: "A", t: "Das Unternehmensmodell mit Anspruchsgruppen und Umweltsphären"},
      {v: "B", t: "Das Modell der doppelten Buchhaltung"},
      {v: "C", t: "Das Modell der Preisbildung auf dem Markt"},
      {v: "D", t: "Das Konjunkturmodell"}
    ],
    correct: "A",
    explain: "Der Fall Brent Spar illustriert perfekt das Unternehmensmodell: Er zeigt die verschiedenen Anspruchsgruppen (Kunden, Staat, Öffentlichkeit, Mitarbeitende, Aktionäre), die Umweltsphären (ökonomisch, ökologisch, technologisch, sozial, rechtlich) und die komplexen Wechselwirkungen und Zielkonflikte zwischen ihnen."
  },
  {
    id: "f10", topic: "anwendung", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
    q: "Im Fall Brent Spar hatte Greenpeace mit einer falschen Zahl argumentiert (5'500 statt 130 Tonnen Öl an Bord). Dies zeigt, dass auch Anspruchsgruppen nicht immer korrekte Informationen liefern.",
    correct: true,
    explain: "Greenpeace hatte die Menge an Öl auf der Brent Spar massiv überschätzt (5'500 statt tatsächlich 130 Tonnen). Dies zeigt eine wichtige Lektion: Auch Anspruchsgruppen wie NGOs können mit unkorrekten Daten arbeiten. Unternehmen und Öffentlichkeit müssen Informationen kritisch hinterfragen."
  },
  {
    id: "f11", topic: "anwendung", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    q: "Die Alti Moschti Mühlethurnen ist eine Kulturgenossenschaft in einer Berner Gemeinde. Welche Anspruchsgruppe ist für sie am wichtigsten?",
    options: [
      {v: "A", t: "Der Staat, der hohe Steuereinnahmen erwartet"},
      {v: "B", t: "Die Eigenkapitalgeber, da sie hohe Rendite erwarten"},
      {v: "C", t: "Die Kundschaft, die qualitativ hochstehende Veranstaltungen in angenehmer Atmosphäre erwartet"},
      {v: "D", t: "Die Konkurrenz, da sie den gleichen Markt bedient"}
    ],
    correct: "C",
    explain: "Gemäss dem Lehrbuch-Beispiel ist die wichtigste Anspruchsgruppe der Alti Moschti die Kundschaft, die qualitativ hochstehende Konzerte und Veranstaltungen in einer angenehmen und speziellen Atmosphäre geniessen möchte."
  },

  // --- Sortierungsfragen ---
  {
    id: "neu_sort_01", topic: "umweltsphaeren", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die fünf Umweltsphären nach dem Grad des direkten Einflusses auf die täglichen operativen Entscheide eines Unternehmens – vom direktesten zum indireksten Einfluss.",
    items: [
      "Ökonomische Umweltsphäre (Konjunktur, Zinsen, Wechselkurse, Konkurrenz)",
      "Technologische Umweltsphäre (Digitalisierung, Innovationen, Automatisierung)",
      "Rechtliche Umweltsphäre (Gesetze, Regulierungen, Branchenvorschriften)",
      "Soziale Umweltsphäre (demografischer Wandel, Wertewandel, Bildungsniveau)",
      "Ökologische Umweltsphäre (Klimawandel, Ressourcenknappheit, Umweltauflagen)"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Die ökonomische Umwelt beeinflusst Unternehmen am direktesten (Preise, Nachfrage, Zinsen wirken täglich). Technologie verändert Prozesse und Geschäftsmodelle. Rechtliche Rahmenbedingungen setzen Grenzen. Soziale Veränderungen wirken längerfristig. Ökologische Faktoren werden zunehmend wichtiger, wirken aber oft indirekt über Regulierung oder veränderte Kundenpräferenzen."
  },
  {
    id: "neu_sort_02", topic: "verhaltensweisen", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Verhaltensweisen von Unternehmen gegenüber ihrer Umwelt nach dem Grad der Eigeninitiative – von der passivsten zur aktivsten.",
    items: [
      "Reaktiv: Abwarten und erst bei Druck reagieren (z.B. Gesetz wird erlassen)",
      "Aktiv: Umweltveränderungen frühzeitig erkennen und sich anpassen",
      "Proaktiv: Veränderungen vorwegnehmen und präventiv handeln",
      "Interaktiv: Aktiv auf die Umwelt einwirken und sie mitgestalten (z.B. Lobbying, Innovation)"
    ],
    correct: [0, 1, 2, 3],
    explain: "Reaktive Unternehmen warten ab (riskant). Aktive Unternehmen beobachten und passen sich an. Proaktive Unternehmen handeln vorausschauend (z.B. nachhaltige Produktion bevor Gesetze kommen). Interaktive Unternehmen gestalten ihre Umwelt mit – durch Innovation, Branchenstandards oder politische Einflussnahme."
  },
  {
    id: "neu_sort_03", topic: "anspruchsgruppen", type: "sortierung", diff: 3, tax: "K3", reviewed: false,
    q: "Ordnen Sie die folgenden Anspruchsgruppen nach der Direktheit ihrer Beziehung zum Unternehmen – von den engsten (internen) zu den weitesten (externen) Stakeholdern.",
    items: [
      "Mitarbeitende (direkt im Unternehmen tätig)",
      "Eigentümer/Aktionäre (Kapitalgeber, tragen Risiko)",
      "Kunden und Lieferanten (direkte Geschäftsbeziehung)",
      "Staat und Behörden (Rahmenbedingungen, Steuern, Regulierung)",
      "Öffentlichkeit und NGOs (gesellschaftliche Erwartungen, Reputation)"
    ],
    correct: [0, 1, 2, 3, 4],
    explain: "Mitarbeitende sind die engsten Stakeholder (intern, tägliche Interaktion). Eigentümer sind ebenfalls intern, aber oft weniger operativ involviert. Kunden und Lieferanten haben direkte vertragliche Beziehungen. Staat und Behörden setzen die rechtlichen Rahmenbedingungen. Die breite Öffentlichkeit und NGOs haben den indireksten, aber durch Social Media zunehmend spürbaren Einfluss."
  },

// ──── ZEICHNEN ────
  {
    id: "neu_zeichnen_01", topic: "umweltsphaeren", type: "zeichnen", diff: 2, tax: "K3", reviewed: false,
    q: "Zeichne das St. Galler Unternehmensmodell (vereinfacht): Unternehmen im Zentrum, umgeben von Umweltsphären und Anspruchsgruppen. Beschrifte die wichtigsten Elemente.",
    hints: ["Das Unternehmen steht im Zentrum.", "Es gibt vier Umweltsphären: Gesellschaft, Natur, Technologie, Wirtschaft.", "Anspruchsgruppen (Stakeholder) stehen zwischen Unternehmen und Umwelt."],
    sample: { src: "img/bwl/unternehmensmodell/unternehmensmodell_umweltsphaeren_zeichnen.svg", alt: "Musterlösung: St. Galler Unternehmensmodell" },
    explain: "Das St. Galler Management-Modell zeigt das Unternehmen eingebettet in Umweltsphären (Gesellschaft, Natur, Technologie, Wirtschaft). Anspruchsgruppen (Eigentümer, Mitarbeitende, Kunden, Lieferanten, Staat, Öffentlichkeit, NGOs) stehen an der Schnittstelle und haben unterschiedliche Interessen."
  },

  // ===== INTERAKTIVE FRAGETYPEN =====
  {
    id: "hotspot01", topic: "umweltsphaeren", type: "hotspot", diff: 2, tax: "K2", reviewed: false,
    q: "Klicke auf die Umweltsphäre, die Gesetze, gesellschaftliche Normen und demografische Entwicklungen umfasst.",
    img: { src: "img/bwl/unternehmensmodell/unternehmensmodell_umweltsphaeren_hotspot.svg", alt: "St. Galler Unternehmensmodell mit Umweltsphären A–D" },
    hotspots: [
      { x: 58.8, y: 35.7, r: 8, label: "A: Technologische Sphäre" },
      { x: 61, y: 52.4, r: 8, label: "B: Ökonomische Sphäre" },
      { x: 50, y: 81.9, r: 8, label: "C: Soziale Sphäre" },
      { x: 29.8, y: 52.4, r: 8, label: "D: Ökologische Sphäre" }
    ],
    correct: [2],
    explain: "Die soziale Sphäre umfasst gesellschaftliche Rahmenbedingungen: Gesetze, Normen, Werte, Demografie, Bildung. Die technologische Sphäre betrifft Innovationen/Digitalisierung, die ökonomische Sphäre Konjunktur/Märkte, die ökologische Sphäre Umwelt/Ressourcen."
  },
  {
    id: "beschriftung01", topic: "modelle", type: "bildbeschriftung", diff: 3, tax: "K2", reviewed: false,
    q: "Beschrifte die sechs Elemente des St. Galler Unternehmensmodells.",
    img: { src: "img/bwl/unternehmensmodell/unternehmensmodell_beschriftung.svg", alt: "St. Galler Unternehmensmodell mit leeren Bereichen" },
    labels: [
      { id: "l1", text: "Unternehmen (Kern)", x: 50, y: 53 },
      { id: "l2", text: "Anspruchsgruppen (Stakeholder)", x: 50, y: 25 },
      { id: "l3", text: "Umweltsphären", x: 85, y: 53 },
      { id: "l4", text: "Interaktionsthemen", x: 50, y: 87 },
      { id: "l5", text: "Ordnungsmomente (Strategie, Struktur, Kultur)", x: 41, y: 44 },
      { id: "l6", text: "Prozesse (Management-, Geschäfts-, Unterstützungsproz.)", x: 41, y: 62 }
    ],
    explain: "Das St. Galler Modell zeigt: Unternehmen im Zentrum, umgeben von Anspruchsgruppen (Kunden, MA, Aktionäre...), eingebettet in Umweltsphären. Ordnungsmomente (Strategie, Struktur, Kultur) steuern die Prozesse."
  },
  {
    id: "dragdrop01", topic: "umweltsphaeren", type: "dragdrop_bild", diff: 2, tax: "K3", reviewed: false,
    q: "Ordne die folgenden Themen der richtigen Umweltsphäre zu.",
    img: { src: "img/bwl/unternehmensmodell/unternehmensmodell_stakeholder_dragdrop.svg", alt: "Vier Umweltsphären: Technologisch, Ökonomisch, Sozial, Ökologisch" },
    zones: [
      { id: "tech", x: 2.5, y: 14, w: 22, h: 82 },
      { id: "oeko", x: 26, y: 14, w: 22, h: 82 },
      { id: "sozial", x: 49.5, y: 14, w: 22, h: 82 },
      { id: "oekol", x: 73, y: 14, w: 25, h: 82 }
    ],
    labels: [
      { id: "lb1", text: "Digitalisierung", zone: "tech" },
      { id: "lb2", text: "Künstliche Intelligenz", zone: "tech" },
      { id: "lb3", text: "Konjunkturlage", zone: "oeko" },
      { id: "lb4", text: "Wechselkurse", zone: "oeko" },
      { id: "lb5", text: "Arbeitsmarkt", zone: "oeko" },
      { id: "lb6", text: "Demografischer Wandel", zone: "sozial" },
      { id: "lb7", text: "Gesetzgebung", zone: "sozial" },
      { id: "lb8", text: "Wertewandel", zone: "sozial" },
      { id: "lb9", text: "Klimawandel", zone: "oekol" },
      { id: "lb10", text: "Ressourcenknappheit", zone: "oekol" },
      { id: "lb11", text: "Umweltregulierung", zone: "oekol" }
    ],
    explain: "Technologisch: Digitalisierung, KI, Automatisierung. Ökonomisch: Konjunktur, Wechselkurse, Arbeitsmarkt. Sozial: Demografie, Gesetze, Werte. Ökologisch: Klima, Ressourcen, Umweltauflagen."
  }
];
