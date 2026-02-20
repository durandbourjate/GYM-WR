// ============================================================
// Pool: BWL – Unternehmensmodell
// Fach: BWL | Stufe: SF GYM1
// Lehrplanbezug: Unternehmensmodell mit Umweltsphären und
//   Anspruchsgruppen, Zielbeziehungen, ökonomische Prinzipien
// Erstellt: 2026-02-21
// ============================================================

window.POOL_META = {
  title: "Unternehmensmodell – Umweltsphären & Anspruchsgruppen",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM1"
};

window.TOPICS = {
  "modelle":           {label: "Modelle in der BWL",                       short: "Modelle"},
  "anspruchsgruppen":  {label: "Anspruchsgruppen & ihre Ansprüche",        short: "Anspruchsgruppen"},
  "zielbeziehungen":   {label: "Zielbeziehungen & Wertansätze",            short: "Zielbeziehungen"},
  "umweltsphaeren":    {label: "Die fünf Umweltsphären",                   short: "Umweltsphären"},
  "wechselwirkungen":  {label: "Wechselwirkungen Unternehmen & Umwelt",    short: "Wechselwirkungen"},
  "verhaltensweisen":  {label: "Verhaltensweisen von Unternehmen",         short: "Verhaltensweisen"},
  "anwendung":         {label: "Anwendung & Fallbeispiele",                short: "Anwendung"}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: modelle
  // ============================================================

  {
    id: "m01", topic: "modelle", type: "mc", diff: 1, tax: "K1",
    q: "Was ist ein Modell in der Betriebswirtschaftslehre?",
    options: [
      {v: "A", t: "Eine vereinfachte Darstellung der Wirklichkeit"},
      {v: "B", t: "Eine exakte Kopie der Realität"},
      {v: "C", t: "Ein Gesetz, das immer gilt"},
      {v: "D", t: "Eine Anweisung der Geschäftsleitung"}
    ],
    correct: "A",
    explain: "Modelle sind Abbildungen einer bestimmten Wirklichkeit, die einen Ausschnitt daraus vereinfacht darstellen. Sie helfen, komplexe Zusammenhänge zu ordnen und zu verstehen."
  },
  {
    id: "m02", topic: "modelle", type: "tf", diff: 1, tax: "K1",
    q: "Die Buchhaltung eines Unternehmens ist ein Beispiel für ein Beschreibungsmodell.",
    correct: true,
    explain: "In einer Buchhaltung werden sämtliche Geschäftsfälle im Zeitablauf erfasst und dargestellt – also beschrieben, ohne Ursachen zu erklären oder Handlungsempfehlungen abzugeben."
  },
  {
    id: "m03", topic: "modelle", type: "fill", diff: 1, tax: "K1",
    q: "Ein Modell, das Ursachen von betrieblichen Prozessabläufen erklären soll, wird als {0} bezeichnet.",
    blanks: [
      {answer: "Erklärungsmodell", alts: ["Erklaerungsmodell"]}
    ],
    explain: "Erklärungsmodelle dienen dazu, Hypothesen über Gesetzmässigkeiten aufzustellen, z.B. die Annahme, dass mit zunehmender Produktionsmenge die Stückkosten sinken."
  },
  {
    id: "m04", topic: "modelle", type: "mc", diff: 2, tax: "K2",
    q: "Welches Modell wird aufgestellt, um optimale Handlungsmöglichkeiten für die Zukunft zu bestimmen?",
    options: [
      {v: "A", t: "Beschreibungsmodell"},
      {v: "B", t: "Erklärungsmodell"},
      {v: "C", t: "Entscheidungsmodell"},
      {v: "D", t: "Prognosemodell"}
    ],
    correct: "C",
    explain: "Entscheidungsmodelle werden aufgestellt, um die Bestimmung optimaler Handlungsmöglichkeiten zu erleichtern. Sie enthalten Aussagen, die auf die Zukunft gerichtet sind."
  },
  {
    id: "m05", topic: "modelle", type: "multi", diff: 2, tax: "K2",
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
    q: "Ein Unternehmen nutzt historische Verkaufsdaten, um den Umsatz der nächsten Quartale vorherzusagen. Welche Modellarten kommen dabei zum Einsatz?",
    options: [
      {v: "A", t: "Nur ein Beschreibungsmodell"},
      {v: "B", t: "Erst ein Beschreibungsmodell, dann ein Erklärungsmodell"},
      {v: "C", t: "Beschreibungsmodell → Erklärungsmodell → Entscheidungsmodell"},
      {v: "D", t: "Nur ein Entscheidungsmodell"}
    ],
    correct: "C",
    explain: "Zuerst werden die historischen Daten beschrieben (Beschreibungsmodell), dann werden Muster und Ursachen identifiziert (Erklärungsmodell, z.B. saisonale Schwankungen), und schliesslich wird daraus eine Prognose für Entscheidungen abgeleitet (Entscheidungsmodell)."
  },
  {
    id: "m07", topic: "modelle", type: "tf", diff: 2, tax: "K2",
    q: "Ein Erklärungsmodell könnte die Hypothese aufstellen, dass mit zunehmender Produktionsmenge die Stückkosten sinken.",
    correct: true,
    explain: "Genau so funktionieren Erklärungsmodelle: Sie stellen Hypothesen über Gesetzmässigkeiten auf. Die Annahme sinkender Stückkosten bei steigender Produktion (Skaleneffekte) ist ein klassisches Beispiel."
  },
  {
    id: "m08", topic: "modelle", type: "mc", diff: 3, tax: "K5",
    q: "Warum ist es problematisch, unternehmerische Entscheidungen ausschliesslich auf ein einziges Modell zu stützen?",
    options: [
      {v: "A", t: "Modelle sind immer falsch und daher nutzlos."},
      {v: "B", t: "Jedes Modell vereinfacht die Realität und blendet bestimmte Aspekte aus."},
      {v: "C", t: "Modelle sind nur für grosse Unternehmen geeignet."},
      {v: "D", t: "Modelle können nur die Vergangenheit abbilden."}
    ],
    correct: "B",
    explain: "Modelle sind bewusste Vereinfachungen. Sie zeigen nur einen Ausschnitt der Realität. Wer sich auf ein einziges Modell verlässt, riskiert, wichtige Faktoren zu übersehen. Deshalb ist es sinnvoll, verschiedene Modelle und Perspektiven zu kombinieren."
  },
  {
    id: "m09", topic: "modelle", type: "tf", diff: 3, tax: "K5",
    q: "Die Grenzen des Modelldenkens zu erkennen gehört laut Lehrplan zu den Kompetenzen, die Schülerinnen und Schüler im Fach Wirtschaft und Recht erwerben sollen.",
    correct: true,
    explain: "Der Lehrplan fordert explizit, dass SuS Modelle anwenden und zur Lösung konkreter Probleme beiziehen, aber auch die Grenzen des Modelldenkens erkennen."
  },

  // ============================================================
  // TOPIC: anspruchsgruppen
  // ============================================================

  {
    id: "a01", topic: "anspruchsgruppen", type: "mc", diff: 1, tax: "K1",
    q: "Was sind Anspruchsgruppen (Stakeholder)?",
    options: [
      {v: "A", t: "Nur die Aktionäre eines Unternehmens"},
      {v: "B", t: "Organisierte oder nicht organisierte Gruppen, die Ansprüche an ein Unternehmen stellen"},
      {v: "C", t: "Staatliche Behörden, die Unternehmen kontrollieren"},
      {v: "D", t: "Die Geschäftsleitung eines Unternehmens"}
    ],
    correct: "B",
    explain: "Anspruchsgruppen (Stakeholder) sind organisierte oder nicht organisierte Gruppen von Unternehmen, Menschen oder Institutionen, die Ansprüche an ein Unternehmen stellen. Dazu gehören z.B. Kunden, Mitarbeitende, Lieferanten, Staat, Kapitalgeber, Konkurrenz und die Öffentlichkeit."
  },
  {
    id: "a02", topic: "anspruchsgruppen", type: "multi", diff: 1, tax: "K1",
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
    q: "Die Anspruchsgruppe, die ein gutes Preis-Leistungs-Verhältnis, Zusatzleistungen und guten Service erwartet, sind die {0}.",
    blanks: [
      {answer: "Kunden", alts: ["Kundinnen und Kunden", "Kundinnen", "Kundschaft"]}
    ],
    explain: "Kundinnen und Kunden erwarten ein gutes Preis-Leistungs-Verhältnis, Zusatzleistungen und guten Service vom Unternehmen."
  },
  {
    id: "a04", topic: "anspruchsgruppen", type: "mc", diff: 2, tax: "K2",
    q: "Welchen Anspruch haben Fremdkapitalgeber (z.B. Banken) typischerweise an ein Unternehmen?",
    options: [
      {v: "A", t: "Fairer Lohn und Arbeitsplatzsicherheit"},
      {v: "B", t: "Möglichst hoher Zins, pünktliche Rückzahlung und Sicherheiten"},
      {v: "C", t: "Tiefe Preise und guter Service"},
      {v: "D", t: "Hohe Steuereinnahmen und Arbeitsplätze"}
    ],
    correct: "B",
    explain: "Fremdkapitalgeber wie Banken erwarten einen möglichst hohen Zins für ihr ausgeliehenes Kapital, pünktliche Rückzahlung sowie Sicherheiten, damit ihr Risiko begrenzt bleibt."
  },
  {
    id: "a05", topic: "anspruchsgruppen", type: "mc", diff: 2, tax: "K2",
    q: "Was erwarten Mitarbeitende typischerweise von einem Unternehmen?",
    options: [
      {v: "A", t: "Wertsteigerung der Anteile und hohe Dividende"},
      {v: "B", t: "Fairen Lohn, gute Arbeitsbedingungen und Weiterbildungsmöglichkeiten"},
      {v: "C", t: "Langfristige Lieferbeziehungen und hohe Preise"},
      {v: "D", t: "Finanzielle Unterstützung bei Projekten (Sponsoring)"}
    ],
    correct: "B",
    explain: "Mitarbeitende erwarten einen fairen Lohn, Weiterbildungs- und Mitwirkungsmöglichkeiten, Arbeitsplatzsicherheit sowie gute Arbeitsbedingungen."
  },
  {
    id: "a06", topic: "anspruchsgruppen", type: "multi", diff: 2, tax: "K2",
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
    q: "Die Konkurrenz ist keine Anspruchsgruppe, weil sie dem Unternehmen feindlich gesinnt ist.",
    correct: false,
    explain: "Die Konkurrenz ist durchaus eine Anspruchsgruppe. Sie erwartet faires Verhalten im Wettbewerb (z.B. kein Preisdumping) und Mitwirkung in Branchenverbänden."
  },
  {
    id: "a08", topic: "anspruchsgruppen", type: "mc", diff: 3, tax: "K4",
    q: "Ein Technologieunternehmen plant, die Produktion ins Ausland zu verlagern. Welche Anspruchsgruppen sind davon am stärksten betroffen?",
    options: [
      {v: "A", t: "Nur die Aktionäre, da der Aktienkurs schwanken könnte"},
      {v: "B", t: "Mitarbeitende (Arbeitsplatzverlust), Staat (Steuereinnahmen), Lieferanten (Auftragsverlust)"},
      {v: "C", t: "Nur die Kunden, da die Qualität sinken könnte"},
      {v: "D", t: "Nur die Konkurrenz, da sie einen Vorteil erhält"}
    ],
    correct: "B",
    explain: "Eine Produktionsverlagerung betrifft vor allem Mitarbeitende (drohendem Arbeitsplatzverlust), den Staat (Rückgang von Steuereinnahmen und Arbeitsplätzen) und Lieferanten (Verlust von Aufträgen). Natürlich können auch andere Gruppen betroffen sein, aber diese drei spüren die Auswirkungen am direktesten."
  },
  {
    id: "a09", topic: "anspruchsgruppen", type: "tf", diff: 1, tax: "K1",
    q: "Institutionen wie Gewerkschaften, Umweltverbände und Parteien gehören ebenfalls zu den Anspruchsgruppen eines Unternehmens.",
    correct: true,
    explain: "Institutionen (z.B. Verbände, Presse, Parteien, Vereine) bilden eine eigene Anspruchsgruppe. Sie erwarten z.B. finanzielle Unterstützung bei Projekten (Sponsoring) und achten auf die Einhaltung ökologischer und sozialer Standards."
  },
  {
    id: "a10", topic: "anspruchsgruppen", type: "mc", diff: 3, tax: "K5",
    q: "Warum agiert ein Unternehmen laut dem Unternehmensmodell nicht isoliert?",
    options: [
      {v: "A", t: "Weil es vom Staat dazu gezwungen wird"},
      {v: "B", t: "Weil es in dauernder Wechselbeziehung mit seinem Umfeld, anderen Unternehmen und verschiedenen Personengruppen steht"},
      {v: "C", t: "Weil es nur so Gewinne erzielen kann"},
      {v: "D", t: "Weil Unternehmen keinen Selbstzweck haben"}
    ],
    correct: "B",
    explain: "Das Unternehmensmodell zeigt, dass Unternehmen in dauernder Wechselbeziehung mit ihrem Umfeld stehen – mit Anspruchsgruppen und den Umweltsphären. Diese Beziehungen sind vielfältig und komplex und beeinflussen die Ziele und Entscheide des Unternehmens massgeblich."
  },
  {
    id: "a11", topic: "anspruchsgruppen", type: "fill", diff: 2, tax: "K1",
    q: "Eigenkapitalgeber erwarten vom Unternehmen eine {0} der Anteile (Shareholder-Value), eine hohe {1} und Sicherheit für das eingesetzte Kapital.",
    blanks: [
      {answer: "Wertsteigerung", alts: ["Werterhöhung", "Wertzunahme"]},
      {answer: "Rentabilität", alts: ["Rendite", "Dividende"]}
    ],
    explain: "Eigenkapitalgeber (Eigentümer, Aktionäre) erwarten eine Wertsteigerung der Anteile (Shareholder-Value), eine möglichst hohe Rentabilität (Rendite/Dividende) und Sicherheit für das eingesetzte Kapital."
  },
  {
    id: "a12", topic: "anspruchsgruppen", type: "multi", diff: 2, tax: "K3",
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
    q: "Was bedeutet «Zielharmonie» zwischen zwei Anspruchsgruppen?",
    options: [
      {v: "A", t: "Die Erfüllung des einen Ziels führt zu einer Minderung des anderen Ziels."},
      {v: "B", t: "Die beiden Ziele beeinflussen sich gegenseitig nicht."},
      {v: "C", t: "Durch das Erreichen des einen Ziels wird die Erfüllung des anderen Ziels gesteigert."},
      {v: "D", t: "Beide Ziele können nie gleichzeitig erreicht werden."}
    ],
    correct: "C",
    explain: "Bei einer Zielharmonie (komplementäre Ziele) fördert das Erreichen des einen Ziels gleichzeitig das andere Ziel. Beide Seiten profitieren."
  },
  {
    id: "z02", topic: "zielbeziehungen", type: "fill", diff: 1, tax: "K1",
    q: "Man unterscheidet drei Arten von Zielbeziehungen: {0}, Neutralität und {1}.",
    blanks: [
      {answer: "Harmonie", alts: ["Zielharmonie"]},
      {answer: "Konkurrenz", alts: ["Konflikt", "Zielkonflikt", "Zielkonkurrenz"]}
    ],
    explain: "Die drei Zielbeziehungen sind: Harmonie (Ziele fördern sich gegenseitig), Neutralität (Ziele beeinflussen sich nicht) und Konkurrenz/Konflikt (Ziele behindern sich gegenseitig)."
  },
  {
    id: "z03", topic: "zielbeziehungen", type: "mc", diff: 2, tax: "K3",
    q: "Die Mitarbeitenden fordern höhere Löhne, gleichzeitig möchte das Unternehmen die Kosten senken. Welche Zielbeziehung liegt vor?",
    options: [
      {v: "A", t: "Zielharmonie"},
      {v: "B", t: "Zielneutralität"},
      {v: "C", t: "Zielkonflikt (Konkurrenz)"},
      {v: "D", t: "Zielidentität"}
    ],
    correct: "C",
    explain: "Höhere Löhne bedeuten höhere Kosten für das Unternehmen. Das Ziel der Mitarbeitenden (höherer Lohn) und das Unternehmensziel (Kostensenkung) stehen in Konkurrenz zueinander – ein klassischer Zielkonflikt."
  },
  {
    id: "z04", topic: "zielbeziehungen", type: "mc", diff: 2, tax: "K2",
    img: {src: "img/bwl/unternehmensmodell/shareholder_stakeholder_vergleich_01.svg", alt: "Vergleich zweier Ansätze: Ansatz A mit Fokus auf eine Gruppe und Gewinnmaximierung, Ansatz B mit Fokus auf alle Gruppen und Ausgewogenheit"},
    q: "Betrachten Sie das Diagramm. Welche Begriffe gehören zu Ansatz A und Ansatz B?",
    options: [
      {v: "A", t: "A = Stakeholder-Value, B = Shareholder-Value"},
      {v: "B", t: "A = Shareholder-Value, B = Stakeholder-Value"},
      {v: "C", t: "A = Kostenführerschaft, B = Differenzierungsstrategie"},
      {v: "D", t: "A = Unternehmensmodell, B = Umweltmodell"}
    ],
    correct: "B",
    explain: "Ansatz A zeigt den Shareholder-Value-Ansatz: Fokus auf nur eine Gruppe (Eigentümer/Aktionäre) mit dem Ziel der Gewinnmaximierung und kurzfristiger Perspektive. Ansatz B zeigt den Stakeholder-Value-Ansatz: Alle Anspruchsgruppen werden berücksichtigt, mit dem Ziel der Ausgewogenheit und langfristiger Perspektive."
  },
  {
    id: "z05", topic: "zielbeziehungen", type: "multi", diff: 2, tax: "K2",
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
    q: "Zielneutralität bedeutet, dass sich zwei Ziele gegenseitig nicht beeinflussen.",
    correct: true,
    explain: "Bei neutralen Zielbeziehungen hat die Erfüllung des einen Ziels keinen Einfluss auf die Erfüllung des anderen Ziels. Die beiden Ziele existieren unabhängig voneinander."
  },
  {
    id: "z07", topic: "zielbeziehungen", type: "mc", diff: 3, tax: "K4",
    q: "Ein Unternehmen investiert in bessere Arbeitsbedingungen. Die Mitarbeitenden sind zufriedener und produktiver, was zu höheren Gewinnen führt. Welche Zielbeziehung besteht hier zwischen den Ansprüchen der Mitarbeitenden und der Eigenkapitalgeber?",
    options: [
      {v: "A", t: "Zielkonflikt, weil die Investition kurzfristig Kosten verursacht"},
      {v: "B", t: "Zielneutralität, weil die Bereiche nichts miteinander zu tun haben"},
      {v: "C", t: "Zielharmonie, weil beide Seiten langfristig profitieren"},
      {v: "D", t: "Die Beziehung lässt sich nicht bestimmen"}
    ],
    correct: "C",
    explain: "Obwohl kurzfristig Kosten entstehen, profitieren langfristig sowohl Mitarbeitende (bessere Bedingungen) als auch Eigenkapitalgeber (höhere Gewinne durch Produktivitätssteigerung). Das ist ein Beispiel für Zielharmonie im Sinne des Stakeholder-Value-Ansatzes."
  },
  {
    id: "z08", topic: "zielbeziehungen", type: "tf", diff: 3, tax: "K5",
    q: "Der Shareholder-Value-Ansatz kann langfristige Unternehmensziele gefährden, z.B. durch verminderte Reinvestitionen des Gewinns.",
    correct: true,
    explain: "Wenn ein Unternehmen konsequent nur die kurzfristige Gewinnmaximierung verfolgt, kann es langfristige Investitionen (z.B. in Forschung, Mitarbeitende, Nachhaltigkeit) vernachlässigen. Das gefährdet die langfristigen Unternehmensziele."
  },
  {
    id: "z09", topic: "zielbeziehungen", type: "mc", diff: 3, tax: "K5",
    q: "Zwischen den Forderungen der Eigenkapitalgeber und den Forderungen der Fremdkapitalgeber besteht meistens:",
    options: [
      {v: "A", t: "Ein starker Zielkonflikt"},
      {v: "B", t: "Weitgehende Zielharmonie"},
      {v: "C", t: "Zielneutralität"},
      {v: "D", t: "Keine Beziehung"}
    ],
    correct: "B",
    explain: "Eigen- und Fremdkapitalgeber stehen in weitgehender Zielharmonie zueinander: Beide möchten eine hohe Rendite erzielen bzw. ihre Kapitaleinlage gesichert wissen. Die Förderung des einen Anspruchs (z.B. Wertsteigerung) fördert auch das Vertrauen der anderen Gruppe."
  },
  {
    id: "z10", topic: "zielbeziehungen", type: "multi", diff: 3, tax: "K4",
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
    img: {src: "img/bwl/unternehmensmodell/zielbeziehungen_schema_01.svg", alt: "Drei Typen von Zielbeziehungen: Typ A mit zwei steigenden Zielen, Typ B mit unabhängigen Zielen, Typ C mit gegenläufigen Zielen"},
    q: "Betrachten Sie das Diagramm. Welche Bezeichnungen passen zu den drei Typen A, B und C?",
    options: [
      {v: "A", t: "A = Zielharmonie, B = Zielneutralität, C = Zielkonkurrenz"},
      {v: "B", t: "A = Zielkonkurrenz, B = Zielharmonie, C = Zielneutralität"},
      {v: "C", t: "A = Zielneutralität, B = Zielkonkurrenz, C = Zielharmonie"},
      {v: "D", t: "A = Zielharmonie, B = Zielkonkurrenz, C = Zielneutralität"}
    ],
    correct: "A",
    explain: "Typ A zeigt Zielharmonie: Beide Ziele steigen gemeinsam — die Erreichung des einen Ziels fördert das andere. Typ B zeigt Zielneutralität: Die Ziele beeinflussen sich gegenseitig nicht. Typ C zeigt Zielkonkurrenz (Zielkonflikt): Ein Ziel steigt, das andere sinkt — die Erreichung des einen Ziels beeinträchtigt das andere."
  },

  // ============================================================
  // TOPIC: umweltsphaeren
  // ============================================================

  {
    id: "u01", topic: "umweltsphaeren", type: "mc", diff: 1, tax: "K1",
    q: "In wie viele Umweltsphären wird die Unternehmensumwelt im St. Galler Unternehmensmodell unterteilt?",
    options: [
      {v: "A", t: "Drei"},
      {v: "B", t: "Vier"},
      {v: "C", t: "Fünf"},
      {v: "D", t: "Sechs"}
    ],
    correct: "C",
    explain: "Die Unternehmensumwelt wird in fünf Umweltsphären unterteilt: die ökonomische, technologische, ökologische, soziale und rechtliche Umweltsphäre."
  },
  {
    id: "u02", topic: "umweltsphaeren", type: "fill", diff: 1, tax: "K1",
    q: "Die fünf Umweltsphären sind: ökonomische, {0}, ökologische, soziale und {1} Umweltsphäre.",
    blanks: [
      {answer: "technologische", alts: ["Technologische"]},
      {answer: "rechtliche", alts: ["Rechtliche"]}
    ],
    explain: "Die fünf Umweltsphären sind: ökonomisch, technologisch, ökologisch, sozial und rechtlich."
  },
  {
    id: "u03", topic: "umweltsphaeren", type: "mc", diff: 1, tax: "K1",
    q: "Konjunktur, Inflationsrate und Wechselkurse sind Grössen welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Technologische Umweltsphäre"},
      {v: "B", t: "Ökonomische Umweltsphäre"},
      {v: "C", t: "Soziale Umweltsphäre"},
      {v: "D", t: "Rechtliche Umweltsphäre"}
    ],
    correct: "B",
    explain: "Konjunktur, Inflationsrate und Wechselkurse sind gesamtwirtschaftliche Rahmenbedingungen und gehören zur ökonomischen Umweltsphäre."
  },
  {
    id: "u04", topic: "umweltsphaeren", type: "mc", diff: 2, tax: "K2",
    q: "Bodenknappheit, Rohstoffvorkommen und Klimaerwärmung sind Einflüsse welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Soziale Umweltsphäre"},
      {v: "B", t: "Ökonomische Umweltsphäre"},
      {v: "C", t: "Ökologische Umweltsphäre"},
      {v: "D", t: "Technologische Umweltsphäre"}
    ],
    correct: "C",
    explain: "Natürliche Gegebenheiten wie Bodenknappheit, Rohstoffvorkommen und Klimaerwärmung gehören zur ökologischen Umweltsphäre. Diese Umweltsphäre umfasst alle Einflüsse aus der natürlichen Umgebung."
  },
  {
    id: "u05", topic: "umweltsphaeren", type: "multi", diff: 2, tax: "K2",
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
    q: "Einstellungen und Werthaltungen der Menschen in einer Gesellschaft, z.B. zu Themen wie Sonntagsverkauf oder fremde Kulturen, gehören zu welcher Umweltsphäre?",
    options: [
      {v: "A", t: "Ökonomische Umweltsphäre"},
      {v: "B", t: "Rechtliche Umweltsphäre"},
      {v: "C", t: "Ökologische Umweltsphäre"},
      {v: "D", t: "Soziale Umweltsphäre"}
    ],
    correct: "D",
    explain: "In der sozialen Umweltsphäre betrachten wir Einflüsse aus dem Zusammenleben und den Werthaltungen der Menschen: z.B. Themen wie Sonntagsverkauf, Gleichstellung, Kindertagesstätten oder Offenheit gegenüber anderen Ländern."
  },
  {
    id: "u07", topic: "umweltsphaeren", type: "tf", diff: 2, tax: "K2",
    q: "Die Einführung des Rauchverbots im Kanton Bern, das grosse Auswirkungen auf Gastronomiebetriebe hatte, ist ein Beispiel für die rechtliche Umweltsphäre.",
    correct: true,
    explain: "Gesetze und Verordnungen wie das Rauchverbot gehören zur rechtlichen Umweltsphäre. Das Beispiel zeigt, wie ein neues Gesetz direkte Auswirkungen auf Unternehmen haben kann (Umbauten, veränderte Kundenströme)."
  },
  {
    id: "u08", topic: "umweltsphaeren", type: "mc", diff: 2, tax: "K3",
    q: "Ein Winterferienort unter 1200 m ü.M. hat wegen des Klimawandels kaum noch Schnee und muss in Beschneiungsanlagen investieren. Welche Umweltsphäre wirkt hier primär auf das Unternehmen?",
    options: [
      {v: "A", t: "Soziale Umweltsphäre"},
      {v: "B", t: "Rechtliche Umweltsphäre"},
      {v: "C", t: "Ökologische Umweltsphäre"},
      {v: "D", t: "Ökonomische Umweltsphäre"}
    ],
    correct: "C",
    explain: "Der Klimawandel ist ein Phänomen der ökologischen Umweltsphäre. Er führt zu weniger Schnee in tieferen Lagen, was die Tourismusunternehmen direkt betrifft und zu Investitionen in Beschneiungsanlagen oder alternative Angebote zwingt."
  },
  {
    id: "u09", topic: "umweltsphaeren", type: "multi", diff: 3, tax: "K4",
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
    q: "Abgaswerte, Werbeverbote für Tabak und gesetzlich geregelte Ladenöffnungszeiten sind Beispiele für die rechtliche Umweltsphäre.",
    correct: true,
    explain: "All diese Beispiele betreffen gesetzliche Regelungen und Verordnungen, die zur rechtlichen Umweltsphäre gehören und das Handeln von Unternehmen direkt beeinflussen."
  },
  {
    id: "u11", topic: "umweltsphaeren", type: "mc", diff: 3, tax: "K4",
    q: "Ein neues Gesetz zur CO₂-Bepreisung betrifft ein Industrieunternehmen. Welche Umweltsphären sind hier verknüpft?",
    options: [
      {v: "A", t: "Nur die rechtliche Umweltsphäre"},
      {v: "B", t: "Die rechtliche und die ökologische Umweltsphäre"},
      {v: "C", t: "Die rechtliche, ökologische und ökonomische Umweltsphäre"},
      {v: "D", t: "Alle fünf Umweltsphären gleichermassen"}
    ],
    correct: "C",
    explain: "Ein CO₂-Gesetz ist ein rechtlicher Rahmen (rechtlich), der auf ein ökologisches Problem reagiert (ökologisch) und finanzielle Auswirkungen auf das Unternehmen hat (ökonomisch). Die Umweltsphären sind nicht immer eindeutig voneinander abzugrenzen — ein CO₂-Gesetz kann gleichzeitig der rechtlichen und der ökologischen Sphäre zugeordnet werden."
  },

  // ============================================================
  // TOPIC: wechselwirkungen
  // ============================================================

  {
    id: "w01", topic: "wechselwirkungen", type: "tf", diff: 1, tax: "K2",
    q: "Unternehmen können ihre Umweltsphären aktiv steuern und kontrollieren.",
    correct: false,
    explain: "Die Umweltsphären sind durch das Unternehmen weder steuerbar noch kontrollierbar. Es bestehen zwar Wechselwirkungen (das Unternehmen beeinflusst die Umwelt und umgekehrt), aber die Umweltsphären entwickeln sich nach eigenen Gesetzmässigkeiten."
  },
  {
    id: "w02", topic: "wechselwirkungen", type: "mc", diff: 1, tax: "K2",
    img: {src: "img/bwl/unternehmensmodell/umweltsphaeren_wechselwirkung_01.svg", alt: "Diagramm mit Unternehmen und Umweltsphären, drei nummerierte Pfeile zeigen verschiedene Wechselwirkungen"},
    q: "Das Diagramm zeigt drei Arten von Wechselwirkungen. Welche Aussage beschreibt alle drei korrekt?",
    options: [
      {v: "A", t: "Nur: Umweltsphäre → Unternehmen"},
      {v: "B", t: "Sphäre ↔ Sphäre, Sphäre ↔ Unternehmen, Unternehmen ↔ Sphäre"},
      {v: "C", t: "Nur: Unternehmen → Anspruchsgruppen"},
      {v: "D", t: "Nur zwischen Anspruchsgruppen untereinander"}
    ],
    correct: "B",
    explain: "Im Unternehmensmodell gibt es drei Arten von Wechselwirkungen: zwischen Sphären untereinander, von Sphären auf das Unternehmen und vom Unternehmen auf die Sphären. Alle Richtungen sind möglich."
  },
  {
    id: "w03", topic: "wechselwirkungen", type: "mc", diff: 2, tax: "K3",
    q: "Ein Unternehmen baut eine neue Fabrik und schafft 200 Arbeitsplätze in einer Region. Welche Wechselwirkung findet statt?",
    options: [
      {v: "A", t: "Umweltsphäre → Unternehmen (ökonomisch)"},
      {v: "B", t: "Unternehmen → Umweltsphäre (ökonomisch und sozial)"},
      {v: "C", t: "Sphäre → Sphäre (sozial → ökonomisch)"},
      {v: "D", t: "Anspruchsgruppe → Unternehmen (Staat fordert Arbeitsplätze)"}
    ],
    correct: "B",
    explain: "Das Unternehmen beeinflusst aktiv seine Umwelt: Es schafft Arbeitsplätze (soziale Wirkung) und stärkt die regionale Wirtschaft (ökonomische Wirkung). Das ist eine Wechselwirkung vom Unternehmen auf die Umweltsphären."
  },
  {
    id: "w04", topic: "wechselwirkungen", type: "multi", diff: 2, tax: "K3",
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
    q: "Warum ist die Analyse der Umwelt und die Prognose kommender Entwicklungen eine vordringliche Aufgabe der Unternehmensführung?",
    options: [
      {v: "A", t: "Weil es gesetzlich vorgeschrieben ist"},
      {v: "B", t: "Weil ein optimales Miteinander von Unternehmen und Umwelt ein wesentlicher Wettbewerbsvorteil ist"},
      {v: "C", t: "Weil die Konkurrenz es auch macht"},
      {v: "D", t: "Weil die Anspruchsgruppen es verlangen"}
    ],
    correct: "B",
    explain: "Die Umweltvoraussetzungen sind für Unternehmen einer Branche in derselben Region oft ähnlich. Wenn es einem Unternehmen gelingt, ein optimales Miteinander mit seiner Umwelt zu schaffen, ist das ein wesentlicher Wettbewerbsvorteil."
  },
  {
    id: "w06", topic: "wechselwirkungen", type: "tf", diff: 2, tax: "K2",
    q: "Die Umweltsphären sind immer eindeutig voneinander abzugrenzen.",
    correct: false,
    explain: "Die Umweltsphären sind nicht immer eindeutig voneinander abzugrenzen. So kann z.B. die Einhaltung von Umweltverordnungen sowohl zur ökologischen als auch zur rechtlichen Umweltsphäre gezählt werden. Die Sphären überlappen sich in der Praxis häufig."
  },
  {
    id: "w07", topic: "wechselwirkungen", type: "mc", diff: 3, tax: "K5",
    q: "Ein Unternehmen stösst grosse Mengen CO₂ aus. Die Regierung erlässt daraufhin strengere Emissionsgesetze. Welche Wechselwirkungskette liegt vor?",
    options: [
      {v: "A", t: "Unternehmen → ökologische Sphäre → rechtliche Sphäre → Unternehmen"},
      {v: "B", t: "Rechtliche Sphäre → Unternehmen → soziale Sphäre"},
      {v: "C", t: "Ökonomische Sphäre → Unternehmen → technologische Sphäre"},
      {v: "D", t: "Soziale Sphäre → Unternehmen → ökonomische Sphäre"}
    ],
    correct: "A",
    explain: "Das Unternehmen belastet die Umwelt (Unternehmen → ökologische Sphäre), was zu gesellschaftlichem und politischem Druck führt und in neue Gesetze mündet (ökologische → rechtliche Sphäre). Diese Gesetze wirken wiederum auf das Unternehmen zurück (rechtliche Sphäre → Unternehmen). Ein Beispiel für eine Wechselwirkungskette über mehrere Sphären.",
    img: {src: "img/bwl/unternehmensmodell/unternehmensmodell_wechselwirkungen_01.svg", alt: "Diagramm: Wechselwirkungskette zwischen Unternehmen und Umweltsphären"}
  },
  {
    id: "w08", topic: "wechselwirkungen", type: "fill", diff: 1, tax: "K1",
    q: "Die Entwicklungstrends aus der Umwelt müssen vom Unternehmen laufend {0} werden.",
    blanks: [
      {answer: "analysiert", alts: ["beobachtet", "untersucht"]}
    ],
    explain: "Unternehmen können ihre Umwelt nicht steuern, aber sie müssen die Entwicklungstrends laufend analysieren, um rechtzeitig reagieren oder proaktiv handeln zu können."
  },
  {
    id: "w09", topic: "wechselwirkungen", type: "tf", diff: 3, tax: "K4",
    q: "Die vollständige Darstellung des Unternehmensmodells zeigt, dass zwischen allen Elementen (Unternehmen, Anspruchsgruppen, Umweltsphären) vielfältige Beziehungen und Wechselwirkungen bestehen.",
    correct: true,
    explain: "Im vollständigen Modell werden Unternehmen, Anspruchsgruppen und Umweltsphären zusammengefügt. Zwischen allen Elementen bestehen vielfältige Beziehungen und Wechselwirkungen, die das Unternehmen laufend analysieren und berücksichtigen muss."
  },

  // ============================================================
  // TOPIC: verhaltensweisen
  // ============================================================

  {
    id: "v01", topic: "verhaltensweisen", type: "mc", diff: 1, tax: "K1",
    q: "Welche drei grundsätzlichen Verhaltensweisen kann ein Unternehmen gegenüber seiner Umwelt einnehmen?",
    options: [
      {v: "A", t: "Beharren, Reaktion und Aktion"},
      {v: "B", t: "Analyse, Planung und Kontrolle"},
      {v: "C", t: "Innovation, Imitation und Fusion"},
      {v: "D", t: "Wachstum, Stagnation und Schrumpfung"}
    ],
    correct: "A",
    explain: "Die drei grundsätzlichen Verhaltensweisen sind: Beharren (am Bestehenden festhalten), Reaktion (auf Veränderungen reagieren) und Aktion (proaktiv Veränderungen vorantreiben)."
  },
  {
    id: "v02", topic: "verhaltensweisen", type: "fill", diff: 1, tax: "K1",
    q: "Ein Unternehmen, das vorausschauend handelt und Veränderungen aktiv vorantreibt, zeigt die Verhaltensweise der {0}.",
    blanks: [
      {answer: "Aktion", alts: ["Proaktion", "aktiven Gestaltung"]}
    ],
    explain: "Aktion bedeutet, dass das Unternehmen proaktiv handelt, Trends erkennt und vorausschauend neue Wege geht, bevor es durch die Umwelt dazu gezwungen wird."
  },
  {
    id: "v03", topic: "verhaltensweisen", type: "mc", diff: 2, tax: "K3",
    q: "Ein Detailhändler führt erst einen Online-Shop ein, nachdem die meisten Konkurrenten dies bereits getan haben und die Umsätze im stationären Handel stark gesunken sind. Welche Verhaltensweise zeigt das Unternehmen?",
    options: [
      {v: "A", t: "Aktion"},
      {v: "B", t: "Reaktion"},
      {v: "C", t: "Beharren"},
      {v: "D", t: "Innovation"}
    ],
    correct: "B",
    explain: "Das Unternehmen reagiert erst auf den Druck der Umwelt (sinkende Umsätze, Konkurrenz online). Es handelt nicht vorausschauend (das wäre Aktion), aber auch nicht untätig (das wäre Beharren). Es reagiert – allerdings spät."
  },
  {
    id: "v04", topic: "verhaltensweisen", type: "multi", diff: 2, tax: "K2",
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
    q: "Ein Unternehmen, das als erstes in seiner Branche eine KI-gestützte Kundenbetreuerung einführt, zeigt die Verhaltensweise der Aktion.",
    correct: true,
    explain: "Das Unternehmen handelt proaktiv und geht einen neuen Weg, bevor die Konkurrenz dies tut. Es reagiert nicht auf einen bestehenden Druck, sondern gestaltet aktiv die Zukunft. Das ist Aktion."
  },
  {
    id: "v06", topic: "verhaltensweisen", type: "mc", diff: 3, tax: "K5",
    q: "Welche Verhaltensweise wäre für ein Unternehmen in einem sich schnell wandelnden technologischen Umfeld langfristig am riskantesten?",
    options: [
      {v: "A", t: "Aktion – weil sie teuer ist"},
      {v: "B", t: "Reaktion – weil sie immer zu spät kommt"},
      {v: "C", t: "Beharren – weil das Unternehmen technologische Entwicklungen verpasst"},
      {v: "D", t: "Alle drei sind gleich riskant"}
    ],
    correct: "C",
    explain: "In einem sich schnell wandelnden technologischen Umfeld ist Beharren am riskantesten, weil das Unternehmen wichtige Entwicklungen verpasst und den Anschluss an den Markt verlieren kann. Beispiele dafür gibt es viele (z.B. Kodak und die Digitalfotografie)."
  },
  {
    id: "v07", topic: "verhaltensweisen", type: "mc", diff: 3, tax: "K4",
    q: "Ein traditioneller Buchladen beobachtet den Aufstieg von E-Books und Online-Händlern. Er entscheidet sich, neben dem Buchverkauf auch Lesungen, Autorentreffen und ein Café anzubieten. Welche Verhaltensweise zeigt er?",
    options: [
      {v: "A", t: "Beharren, weil er weiterhin Bücher verkauft"},
      {v: "B", t: "Reaktion, weil er erst auf den Druck des Marktes reagiert"},
      {v: "C", t: "Aktion, weil er kreativ neue Wege geht"},
      {v: "D", t: "Sowohl Reaktion als auch Aktion"}
    ],
    correct: "D",
    explain: "Der Buchladen reagiert auf den Druck durch Online-Händler (Reaktion), geht aber gleichzeitig kreativ neue Wege, indem er sein Geschäftsmodell um Erlebnisangebote erweitert (Aktion). In der Praxis sind die Verhaltensweisen oft nicht trennscharf – hier zeigt das Unternehmen Elemente von Reaktion und Aktion."
  },
  {
    id: "v08", topic: "verhaltensweisen", type: "tf", diff: 1, tax: "K2",
    q: "Reaktion bedeutet, dass ein Unternehmen auf Veränderungen in der Umwelt antwortet, anstatt sie selbst auszulösen.",
    correct: true,
    explain: "Bei der Reaktion wartet das Unternehmen, bis Veränderungen eintreten, und passt sich dann daran an. Im Gegensatz zur Aktion, bei der das Unternehmen selbst Veränderungen vorantreibt."
  },

  // ============================================================
  // TOPIC: anwendung (Fallstudie Brent Spar und Transfer)
  // ============================================================

  {
    id: "f01", topic: "anwendung", type: "mc", diff: 1, tax: "K1",
    q: "Was war die Brent Spar?",
    options: [
      {v: "A", t: "Ein Öltanker der Shell AG"},
      {v: "B", t: "Ein schwimmender Speichertank (Ölplattform) von Shell in der Nordsee"},
      {v: "C", t: "Eine Raffinerie an der britischen Küste"},
      {v: "D", t: "Ein Umweltschutzprojekt von Greenpeace"}
    ],
    correct: "B",
    explain: "Die Brent Spar war ein schwimmender Speichertank (Öl-Lagerplattform), der 1975/76 in Norwegen montiert wurde, um Rohöl anderer Bohrinseln zwischenzulagern. Sie war 137 Meter hoch und 14'500 Tonnen schwer."
  },
  {
    id: "f02", topic: "anwendung", type: "mc", diff: 2, tax: "K2",
    q: "Welche zwei Entsorgungsvarianten standen bei der Brent Spar zur Diskussion?",
    options: [
      {v: "A", t: "Stehen lassen oder verschrotten"},
      {v: "B", t: "Versenken in tiefer See oder vollständiger Abbau an Land"},
      {v: "C", t: "Verkauf an eine andere Firma oder Umbau zu einem Hotel"},
      {v: "D", t: "Sprengung vor Ort oder Transport nach Afrika"}
    ],
    correct: "B",
    explain: "Die zwei Hauptvarianten waren: Variante 1 – Versenken in einem tiefen atlantischen Graben (ca. 2'375 m Tiefe), und Variante 2 – Vollständiger Abbau an Land (Plattform an Land schleppen und auseinandernehmen)."
  },
  {
    id: "f03", topic: "anwendung", type: "multi", diff: 2, tax: "K3",
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
    q: "Im Fall Brent Spar argumentierte die Ökonomin Elke Reeding, dass die Versenkungskosten bei ca. 24 Mio. Franken liegen, der Landabbau aber bei ca. 94 Mio. Franken. Welche Umweltsphäre steht bei ihrem Bericht im Vordergrund?",
    options: [
      {v: "A", t: "Ökologische Umweltsphäre"},
      {v: "B", t: "Technologische Umweltsphäre"},
      {v: "C", t: "Ökonomische Umweltsphäre"},
      {v: "D", t: "Soziale Umweltsphäre"}
    ],
    correct: "C",
    explain: "Die Ökonomin analysiert primär die Kosten und finanziellen Konsequenzen der Entsorgungsvarianten. Ihr Bericht fokussiert auf die ökonomische Umweltsphäre: Kosten, Gewinnwirkung, Steuereffekte, Wettbewerbsvorteile."
  },
  {
    id: "f05", topic: "anwendung", type: "mc", diff: 3, tax: "K4",
    q: "Der Kommunikationsspezialist Aldo Müller empfahl im Fall Brent Spar den Landabbau, obwohl dieser viermal teurer war. Was war sein Hauptargument?",
    options: [
      {v: "A", t: "Die technischen Risiken der Versenkung seien zu hoch."},
      {v: "B", t: "Ein Imagegewinn als umweltbewusstes Unternehmen sei langfristig wertvoller als die Kostenersparnis."},
      {v: "C", t: "Die britische Regierung hätte die Versenkung ohnehin verboten."},
      {v: "D", t: "Die Mitarbeitenden hätten sich geweigert, die Versenkung durchzuführen."}
    ],
    correct: "B",
    explain: "Aldo Müller argumentierte aus der sozialen Perspektive: Ein möglicher Boykott und der damit verbundene Imageverlust wären katastrophal teuer. Umgekehrt könnte Shell sich durch den Landabbau als Vorreiterin im Umweltschutz positionieren und langfristig Marktanteile gewinnen."
  },
  {
    id: "f06", topic: "anwendung", type: "tf", diff: 2, tax: "K1",
    q: "Shell entschied sich letztlich für den vollständigen Abbau der Brent Spar an Land.",
    correct: true,
    explain: "Am 20. Juni 1995 beschloss Shell unter dem enormen öffentlichen Druck, die Brent Spar an Land zu entsorgen. Ein Grossteil der gereinigten Aussenhülle wurde als Fundament für einen Hafen verwendet, der Rest verschrottet."
  },
  {
    id: "f07", topic: "anwendung", type: "mc", diff: 3, tax: "K5",
    q: "Was war die langfristig bedeutendste Folge des Brent-Spar-Falls?",
    options: [
      {v: "A", t: "Shell ging bankrott."},
      {v: "B", t: "Die 15 Nordsee-Anrainerstaaten beschlossen 1998 ein Versenkungsverbot für Ölplattformen."},
      {v: "C", t: "Greenpeace wurde verboten."},
      {v: "D", t: "Alle Ölplattformen in der Nordsee wurden sofort abgebaut."}
    ],
    correct: "B",
    explain: "Die bedeutendste Folge war das 1998 von den 15 Anrainerstaaten einstimmig beschlossene Plattform-Versenkungsverbot im Nordostatlantik. Der Fall gilt als einer der ersten grossen Erfolge von Konsumenten gegen einen Grosskonzern."
  },
  {
    id: "f08", topic: "anwendung", type: "multi", diff: 3, tax: "K4",
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
    q: "Welches Modell wird durch den Fall Brent Spar besonders gut illustriert?",
    options: [
      {v: "A", t: "Das Modell der doppelten Buchhaltung"},
      {v: "B", t: "Das Unternehmensmodell mit Anspruchsgruppen und Umweltsphären"},
      {v: "C", t: "Das Modell der Preisbildung auf dem Markt"},
      {v: "D", t: "Das Konjunkturmodell"}
    ],
    correct: "B",
    explain: "Der Fall Brent Spar illustriert perfekt das Unternehmensmodell: Er zeigt die verschiedenen Anspruchsgruppen (Kunden, Staat, Öffentlichkeit, Mitarbeitende, Aktionäre), die Umweltsphären (ökonomisch, ökologisch, technologisch, sozial, rechtlich) und die komplexen Wechselwirkungen und Zielkonflikte zwischen ihnen."
  },
  {
    id: "f10", topic: "anwendung", type: "tf", diff: 3, tax: "K5",
    q: "Im Fall Brent Spar hatte Greenpeace mit einer falschen Zahl argumentiert (5'500 statt 130 Tonnen Öl an Bord). Dies zeigt, dass auch Anspruchsgruppen nicht immer korrekte Informationen liefern.",
    correct: true,
    explain: "Greenpeace hatte die Menge an Öl auf der Brent Spar massiv überschätzt (5'500 statt tatsächlich 130 Tonnen). Dies zeigt eine wichtige Lektion: Auch Anspruchsgruppen wie NGOs können mit unkorrekten Daten arbeiten. Unternehmen und Öffentlichkeit müssen Informationen kritisch hinterfragen."
  },
  {
    id: "f11", topic: "anwendung", type: "mc", diff: 2, tax: "K3",
    q: "Die Alti Moschti Mühlethurnen ist eine Kulturgenossenschaft in einer Berner Gemeinde. Welche Anspruchsgruppe ist für sie am wichtigsten?",
    options: [
      {v: "A", t: "Die Eigenkapitalgeber, da sie hohe Rendite erwarten"},
      {v: "B", t: "Die Kundschaft, die qualitativ hochstehende Veranstaltungen in angenehmer Atmosphäre erwartet"},
      {v: "C", t: "Die Konkurrenz, da sie den gleichen Markt bedient"},
      {v: "D", t: "Der Staat, der hohe Steuereinnahmen erwartet"}
    ],
    correct: "B",
    explain: "Gemäss dem Lehrbuch-Beispiel ist die wichtigste Anspruchsgruppe der Alti Moschti die Kundschaft, die qualitativ hochstehende Konzerte und Veranstaltungen in einer angenehmen und speziellen Atmosphäre geniessen möchte."
  }
];
