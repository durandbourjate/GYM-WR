// ============================================================
// Übungspool: Menschenrechte und Grundrechte
// Fach: Recht | Farbe: Grün (#73ab2c)
// Erstellt: 2026-02-21
// ============================================================

window.POOL_META = {
  title: "Menschenrechte und Grundrechte",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM2 / EWR GYM2",
  lernziele: [
    "Ich kann die Allgemeine Erklärung der Menschenrechte (AEMR) und ihre Bedeutung erklären. (K2)",
    "Ich kann die Grundrechte der schweizerischen Bundesverfassung nennen und einordnen. (K2)",
    "Ich kann die Voraussetzungen für die Einschränkung von Grundrechten (Art. 36 BV) erklären und anwenden. (K3)",
    "Ich kann Grundrechtsfragen auf konkrete Alltagssituationen anwenden. (K3)"
  ]
};

window.TOPICS = {
  "menschenrechte": {label: "Allgemeine Menschenrechte & AEMR", short: "Menschenrechte", lernziele: ["Ich kann die Entstehung und den Inhalt der AEMR beschreiben. (K1)", "Ich kann die Merkmale der Menschenrechte (universell, unveräusserlich, unteilbar) erklären. (K2)"]},
  "grundrechte_bv": {label: "Grundrechte in der Bundesverfassung", short: "Grundrechte BV", lernziele: ["Ich kann die wichtigsten Grundrechte der BV (Art. 7–34 BV) nennen und einordnen. (K1)", "Ich kann den Unterschied zwischen Freiheitsrechten, politischen Rechten und Sozialzielen erklären. (K2)"]},
  "einschraenkung": {label: "Einschränkung von Grundrechten (Art. 36 BV)", short: "Einschränkung", lernziele: ["Ich kann die vier Voraussetzungen für die Einschränkung von Grundrechten nach Art. 36 BV nennen. (K1)", "Ich kann anhand eines Falles prüfen, ob eine Grundrechtseinschränkung zulässig ist. (K3)"]},
  "faelle": {label: "Fallanwendungen – Grundrechte im Alltag", short: "Fälle", lernziele: ["Ich kann Grundrechtsfragen in konkreten Alltagssituationen erkennen und analysieren. (K4)", "Ich kann bei Grundrechtskollisionen eine Güterabwägung vornehmen. (K5)"]}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: menschenrechte
  // ============================================================

  // --- diff 1 ---
  {
    id: "m01", topic: "menschenrechte", type: "mc", diff: 1, tax: "K1",
    q: "Wann wurde die Allgemeine Erklärung der Menschenrechte (AEMR) verabschiedet?",
    options: [
      {v: "A", t: "10. Dezember 1948"},
      {v: "B", t: "26. Juni 1945"},
      {v: "C", t: "1. August 1291"},
      {v: "D", t: "4. Juli 1776"}
    ],
    correct: "A",
    explain: "Die Allgemeine Erklärung der Menschenrechte wurde am 10. Dezember 1948 von der Generalversammlung der Vereinten Nationen als Resolution 217 A (III) verabschiedet."
  },
  {
    id: "m02", topic: "menschenrechte", type: "tf", diff: 1, tax: "K1",
    q: "Die Allgemeine Erklärung der Menschenrechte ist für alle UNO-Mitgliedstaaten rechtlich verbindlich.",
    correct: false,
    explain: "Die AEMR ist eine Erklärung (Deklaration) und kein völkerrechtlicher Vertrag. Sie ist daher nicht direkt rechtlich verbindlich, hat aber als Ausdruck eines gemeinsamen Ideals grosse moralische und politische Bedeutung. Rechtlich verbindlich sind erst die darauf aufbauenden Menschenrechtspakte (z.B. der UNO-Pakt II über bürgerliche und politische Rechte)."
  },
  {
    id: "m03", topic: "menschenrechte", type: "fill", diff: 1, tax: "K1",
    q: "Gemäss Art. 1 der AEMR sind alle Menschen frei und gleich an {0} und {1} geboren.",
    blanks: [
      {answer: "Würde", alts: ["Wuerde"]},
      {answer: "Rechten", alts: ["Recht"]}
    ],
    explain: "Art. 1 AEMR lautet: «Alle Menschen sind frei und gleich an Würde und Rechten geboren. Sie sind mit Vernunft und Gewissen begabt und sollen einander im Geiste der Brüderlichkeit begegnen.»"
  },
  {
    id: "m04", topic: "menschenrechte", type: "mc", diff: 1, tax: "K2",
    q: "Was bedeutet die «Unteilbarkeit» der Menschenrechte?",
    options: [
      {v: "A", t: "Menschenrechte können nicht auf mehrere Personen aufgeteilt werden."},
      {v: "B", t: "Alle Menschenrechte sind gleichwertig und bedingen sich gegenseitig — keines darf isoliert gewährt oder verweigert werden."},
      {v: "C", t: "Menschenrechte gelten nur als Gesamtpaket und können nicht einzeln eingeklagt werden."},
      {v: "D", t: "Die Menschenrechte dürfen nicht in verschiedene Kategorien eingeteilt werden."}
    ],
    correct: "B",
    explain: "Unteilbarkeit bedeutet, dass bürgerliche, politische, wirtschaftliche, soziale und kulturelle Menschenrechte gleichwertig sind und sich gegenseitig bedingen. Es wäre sinnlos, jemandem politische Rechte zu gewähren, wenn er keinen Zugang zu Bildung oder Nahrung hat."
  },
  {
    id: "m05", topic: "menschenrechte", type: "tf", diff: 1, tax: "K1",
    q: "Menschenrechte stehen nur Staatsbürgern des jeweiligen Landes zu.",
    correct: false,
    explain: "Menschenrechte stehen jedem Menschen zu — unabhängig von Staatsangehörigkeit, Herkunft, Geschlecht, Religion oder anderen Merkmalen. Das ergibt sich bereits aus Art. 2 AEMR: «Jeder hat Anspruch auf alle in dieser Erklärung verkündeten Rechte und Freiheiten, ohne irgendeinen Unterschied.»"
  },

  // --- diff 2 ---
  {
    id: "m06", topic: "menschenrechte", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Rechte gehören zu den bürgerlichen und politischen Menschenrechten (1. Dimension)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Recht auf Meinungsfreiheit (Art. 19 AEMR)"},
      {v: "B", t: "Recht auf Arbeit (Art. 23 AEMR)"},
      {v: "C", t: "Recht auf Leben und Freiheit (Art. 3 AEMR)"},
      {v: "D", t: "Recht auf Bildung (Art. 26 AEMR)"}
    ],
    correct: ["A", "C"],
    explain: "Bürgerliche und politische Rechte (1. Dimension) umfassen Abwehrrechte gegen den Staat wie das Recht auf Leben, Freiheit, Meinungsfreiheit und politische Teilhabe. Das Recht auf Arbeit und Bildung gehören zu den wirtschaftlichen, sozialen und kulturellen Rechten (2. Dimension), die Leistungsansprüche darstellen."
  },
  {
    id: "m07", topic: "menschenrechte", type: "mc", diff: 2, tax: "K2",
    q: "Wer ist gemäss der AEMR primär für die Umsetzung und Einhaltung der Menschenrechte verantwortlich?",
    options: [
      {v: "A", t: "Die Vereinten Nationen (UNO)"},
      {v: "B", t: "Die einzelnen Staaten"},
      {v: "C", t: "Nichtregierungsorganisationen (NGOs) wie Amnesty International"},
      {v: "D", t: "Der Internationale Gerichtshof in Den Haag"}
    ],
    correct: "B",
    explain: "Primär verantwortlich für die Umsetzung und Einhaltung der Menschenrechte sind die einzelnen Staaten. Dies bringt ein grundlegendes Problem mit sich: Gerade jene Staaten, die Menschenrechte verletzen, sollen diese gleichzeitig schützen. NGOs übernehmen daher eine wichtige Überwachungsfunktion."
  },
  {
    id: "m08", topic: "menschenrechte", type: "mc", diff: 2, tax: "K2",
    q: "Welche Aufgabe haben Nichtregierungsorganisationen (NGOs) im Bereich der Menschenrechte?",
    options: [
      {v: "A", t: "Sie erlassen verbindliche Gesetze zum Schutz der Menschenrechte."},
      {v: "B", t: "Sie überwachen die Einhaltung der Menschenrechte, dokumentieren Verletzungen und üben öffentlichen Druck auf Staaten aus."},
      {v: "C", t: "Sie sind die offiziellen Gerichte zur Durchsetzung der Menschenrechte."},
      {v: "D", t: "Sie können Staaten mit Sanktionen bestrafen, die Menschenrechte verletzen."}
    ],
    correct: "B",
    explain: "NGOs wie Amnesty International oder Human Rights Watch können weder Gesetze erlassen noch Sanktionen verhängen. Ihre Stärke liegt in der Überwachung (Monitoring), Dokumentation von Menschenrechtsverletzungen und der Mobilisierung von öffentlichem Druck auf die verantwortlichen Staaten."
  },
  {
    id: "m09", topic: "menschenrechte", type: "multi", diff: 2, tax: "K4",
    q: "Welche der folgenden Punkte gelten als Hauptstreitpunkte bezüglich der Allgemeinen Menschenrechtserklärung? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die Frage, ob Menschenrechte universell gelten oder kulturell bedingt sind (Universalismus vs. Kulturrelativismus)."},
      {v: "B", t: "Die Frage, ob die AEMR zu wenige Artikel enthält."},
      {v: "C", t: "Die Frage, ob wirtschaftliche und soziale Rechte gleich wichtig sind wie bürgerliche und politische Rechte."},
      {v: "D", t: "Die Frage, ob Staaten souverän über die Anwendung der Menschenrechte entscheiden dürfen."}
    ],
    correct: ["A", "C", "D"],
    explain: "Zu den Hauptstreitpunkten gehören: (1) Universalismus vs. Kulturrelativismus — manche Staaten argumentieren, die Menschenrechte seien westlich geprägt. (2) Die Gewichtung der verschiedenen Dimensionen — westliche Staaten betonen bürgerliche/politische Rechte, andere Staaten wirtschaftliche/soziale Rechte. (3) Das Spannungsfeld zwischen staatlicher Souveränität und internationaler Menschenrechtsdurchsetzung."
  },

  // --- diff 3 ---
  {
    id: "m10", topic: "menschenrechte", type: "mc", diff: 3, tax: "K5",
    q: "Art. 29 Abs. 2 AEMR erlaubt Beschränkungen von Menschenrechten unter bestimmten Bedingungen. Welche Aussage gibt diese Bedingungen am treffendsten wieder?",
    options: [
      {v: "A", t: "Beschränkungen sind erlaubt, wenn die Mehrheit der Bevölkerung dies befürwortet."},
      {v: "B", t: "Beschränkungen sind nur zulässig, wenn sie gesetzlich vorgesehen sind und der Anerkennung der Rechte anderer sowie den Anforderungen der Moral, der öffentlichen Ordnung und des allgemeinen Wohls in einer demokratischen Gesellschaft dienen."},
      {v: "C", t: "Beschränkungen sind in Krisenzeiten unbegrenzt möglich."},
      {v: "D", t: "Beschränkungen sind nie zulässig, da Menschenrechte absolut gelten."}
    ],
    correct: "B",
    explain: "Art. 29 Abs. 2 AEMR lautet sinngemäss: Jeder ist bei der Ausübung seiner Rechte und Freiheiten nur den Beschränkungen unterworfen, die das Gesetz vorsieht, und zwar ausschliesslich zu dem Zweck, die Rechte anderer zu sichern und den Anforderungen der Moral, der öffentlichen Ordnung und des allgemeinen Wohles in einer demokratischen Gesellschaft zu genügen. Dies zeigt Parallelen zum schweizerischen Art. 36 BV."
  },
  {
    id: "m11", topic: "menschenrechte", type: "mc", diff: 3, tax: "K4",
    img: {src: "img/recht/grundrechte/grundrechte_ebenen_01.svg", alt: "Übersicht: Menschenrechtsschutz auf internationaler, europäischer und nationaler Ebene"},
    q: "Welcher grundlegende Unterschied besteht zwischen der Allgemeinen Erklärung der Menschenrechte (AEMR) und der Europäischen Menschenrechtskonvention (EMRK)?",
    options: [
      {v: "A", t: "Die AEMR umfasst mehr Rechte als die EMRK."},
      {v: "B", t: "Die EMRK ist ein völkerrechtlich verbindlicher Vertrag mit einem Gerichtshof (EGMR) zur Durchsetzung, während die AEMR eine nicht-bindende Erklärung ist."},
      {v: "C", t: "Die EMRK gilt weltweit, die AEMR nur in Europa."},
      {v: "D", t: "Die AEMR wurde nach der EMRK verabschiedet und baut auf ihr auf."}
    ],
    correct: "B",
    explain: "Die AEMR (1948) ist eine Erklärung ohne direkte Rechtsverbindlichkeit. Die EMRK (1950) hingegen ist ein völkerrechtlicher Vertrag, der für die Vertragsstaaten (Mitglieder des Europarats) verbindlich ist. Zur Durchsetzung besteht der Europäische Gerichtshof für Menschenrechte (EGMR) in Strassburg, an den sich auch Einzelpersonen wenden können."
  },
  {
    id: "m12", topic: "menschenrechte", type: "tf", diff: 3, tax: "K5",
    q: "Das Argument des Kulturrelativismus — wonach Menschenrechte keine universelle Geltung beanspruchen können, da sie kulturell bedingt seien — wird in der AEMR selbst durch Art. 30 entkräftet.",
    correct: true,
    explain: "Art. 30 AEMR bestimmt, dass keine Bestimmung der Erklärung so ausgelegt werden darf, dass sie für einen Staat oder eine Person ein Recht begründet, Handlungen zu begehen, welche die Beseitigung der in der Erklärung verkündeten Rechte zum Ziel haben. Damit wird einem Missbrauch kultureller Argumente zur Aushöhlung universeller Menschenrechte vorgebeugt — auch wenn die Debatte in der Praxis fortdauert."
  },

  // ============================================================
  // TOPIC: grundrechte_bv
  // ============================================================

  // --- diff 1 ---
  {
    id: "g01", topic: "grundrechte_bv", type: "mc", diff: 1, tax: "K1",
    q: "In welchen Artikeln der Bundesverfassung (BV) sind die Grundrechte geregelt?",
    options: [
      {v: "A", t: "Art. 1–6 BV"},
      {v: "B", t: "Art. 7–36 BV"},
      {v: "C", t: "Art. 42–135 BV"},
      {v: "D", t: "Art. 136–142 BV"}
    ],
    correct: "B",
    explain: "Die Grundrechte der Schweiz sind im 2. Titel der Bundesverfassung in den Art. 7 bis 36 unter der Überschrift «Grundrechte, Bürgerrechte und Sozialziele» verankert."
  },
  {
    id: "g02", topic: "grundrechte_bv", type: "fill", diff: 1, tax: "K1",
    q: "Grundrechte sollen den Einfluss des {0} auf die Personen beschränken. Sie verpflichten ihn i.d.R. zu einem {1}.",
    blanks: [
      {answer: "Staates", alts: ["Staat", "Staats"]},
      {answer: "Unterlassen", alts: ["unterlassen"]}
    ],
    explain: "Grundrechte sind primär Abwehrrechte: Sie schützen die Einzelnen vor staatlichen Eingriffen. Der Staat ist verpflichtet, diese Rechte zu respektieren und grundsätzlich nicht in sie einzugreifen (Unterlassungspflicht). Nur selten begründen Grundrechte auch Leistungsansprüche (Pflicht zu einem Tun)."
  },
  {
    id: "g03", topic: "grundrechte_bv", type: "tf", diff: 1, tax: "K1",
    q: "Die Menschenwürde ist in Art. 7 BV verankert.",
    correct: true,
    explain: "Art. 7 BV lautet: «Die Würde des Menschen ist zu achten und zu schützen.» Die Menschenwürde steht bewusst am Anfang des Grundrechtskatalogs und bildet die Basis aller anderen Grundrechte."
  },
  {
    id: "g04", topic: "grundrechte_bv", type: "mc", diff: 1, tax: "K1",
    q: "Welches Grundrecht schützt Art. 16 BV?",
    options: [
      {v: "A", t: "Die Religionsfreiheit"},
      {v: "B", t: "Die Meinungs- und Informationsfreiheit"},
      {v: "C", t: "Die Eigentumsgarantie"},
      {v: "D", t: "Die Versammlungsfreiheit"}
    ],
    correct: "B",
    explain: "Art. 16 BV garantiert die Meinungs- und Informationsfreiheit. Art. 15 BV schützt die Glaubens- und Gewissensfreiheit, Art. 22 BV die Versammlungsfreiheit und Art. 26 BV die Eigentumsgarantie."
  },

  // --- diff 2 ---
  {
    id: "g05", topic: "grundrechte_bv", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Grundrechte sind in der Bundesverfassung verankert? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Versammlungsfreiheit (Art. 22 BV)"},
      {v: "B", t: "Recht auf eine Wohnung"},
      {v: "C", t: "Glaubens- und Gewissensfreiheit (Art. 15 BV)"},
      {v: "D", t: "Persönliche Freiheit (Art. 10 BV)"}
    ],
    correct: ["A", "C", "D"],
    explain: "Die Versammlungsfreiheit (Art. 22 BV), die Glaubens- und Gewissensfreiheit (Art. 15 BV) und die persönliche Freiheit (Art. 10 BV) sind als Grundrechte in der BV verankert. Ein eigenständiges «Recht auf eine Wohnung» gibt es in der BV nicht als Grundrecht, sondern nur als Sozialziel (Art. 41 Abs. 1 Bst. e BV)."
  },
  {
    id: "g06", topic: "grundrechte_bv", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet Grundrechte von Sozialzielen in der Bundesverfassung?",
    options: [
      {v: "A", t: "Grundrechte richten sich an Private, Sozialziele an den Staat."},
      {v: "B", t: "Grundrechte sind einklagbare Individualrechte, Sozialziele sind programmatische Staatsziele, aus denen keine direkten Ansprüche abgeleitet werden können."},
      {v: "C", t: "Sozialziele stehen hierarchisch über den Grundrechten."},
      {v: "D", t: "Es gibt keinen wesentlichen Unterschied; beides sind gleichwertige Rechte."}
    ],
    correct: "B",
    explain: "Grundrechte (Art. 7–34 BV) sind subjektive Rechte, die vor Gericht eingeklagt werden können. Sozialziele (Art. 41 BV) sind demgegenüber Aufträge an den Gesetzgeber, bestimmte Ziele anzustreben (z.B. soziale Sicherheit, Wohnraum). Aus Sozialzielen können Einzelne jedoch keine direkten Leistungsansprüche ableiten (Art. 41 Abs. 4 BV)."
  },
  {
    id: "g07", topic: "grundrechte_bv", type: "tf", diff: 2, tax: "K2",
    q: "Grundrechte gelten in der Schweiz absolut und dürfen unter keinen Umständen eingeschränkt werden.",
    correct: false,
    explain: "Art. 36 BV regelt ausdrücklich, dass Grundrechte unter bestimmten Voraussetzungen eingeschränkt werden können: Es braucht eine gesetzliche Grundlage, ein öffentliches Interesse oder den Schutz von Grundrechten Dritter, die Massnahme muss verhältnismässig sein, und der Kerngehalt muss unangetastet bleiben."
  },
  {
    id: "g08", topic: "grundrechte_bv", type: "mc", diff: 2, tax: "K2",
    q: "Was ist mit der Aussage gemeint, Grundrechte hätten primär eine «Abwehrfunktion»?",
    options: [
      {v: "A", t: "Der Staat muss die Bürger vor Angriffen durch andere Staaten schützen."},
      {v: "B", t: "Private Unternehmen müssen die Grundrechte ihrer Angestellten garantieren."},
      {v: "C", t: "Die Grundrechte schützen die Einzelnen vor ungerechtfertigten Eingriffen durch den Staat."},
      {v: "D", t: "Die Grundrechte erlauben es den Bürgern, sich gegen Gerichtsurteile zu wehren."}
    ],
    correct: "C",
    explain: "Die Abwehrfunktion bedeutet, dass Grundrechte in erster Linie den Staat verpflichten, nicht in die geschützten Bereiche der Einzelnen einzugreifen. Sie schützen die individuelle Freiheitssphäre gegen staatliche Übergriffe. Der Staat muss grundsätzlich unterlassen, in Grundrechte einzugreifen."
  },

  // --- diff 3 ---
  {
    id: "g09", topic: "grundrechte_bv", type: "mc", diff: 3, tax: "K4",
    context: "Auf dem Bundesplatz in Bern plant eine Gruppe von Neonazis eine Kundgebung, an der rassistisches Gedankengut verbreitet werden soll.",
    q: "Können sich die Organisatoren auf die Meinungsäusserungsfreiheit (Art. 16 BV) und die Versammlungsfreiheit (Art. 22 BV) berufen?",
    options: [
      {v: "A", t: "Ja, die Meinungsäusserungsfreiheit schützt jede Meinungsäusserung, auch rassistische."},
      {v: "B", t: "Nein, Grundrechte schützen nur Meinungen, die von der Mehrheit geteilt werden."},
      {v: "C", t: "Grundsätzlich ja, aber beide Grundrechte können gemäss Art. 36 BV eingeschränkt werden — z.B. zum Schutz der öffentlichen Ordnung oder der Grundrechte Dritter."},
      {v: "D", t: "Nein, Neonazis haben keine Grundrechte."}
    ],
    correct: "C",
    explain: "Die Meinungsäusserungsfreiheit (Art. 16 BV) und die Versammlungsfreiheit (Art. 22 BV) schützen grundsätzlich auch kontroverse Meinungen — Grundrechte stehen allen Menschen zu. Allerdings gelten Grundrechte nicht absolut: Gemäss Art. 36 BV können sie eingeschränkt werden, wenn eine gesetzliche Grundlage besteht, ein öffentliches Interesse vorliegt (z.B. Schutz der öffentlichen Ordnung) oder Grundrechte Dritter geschützt werden müssen (z.B. Schutz vor rassistischer Diskriminierung, Art. 8 Abs. 2 BV), die Einschränkung verhältnismässig ist und der Kerngehalt unangetastet bleibt."
  },
  {
    id: "g10", topic: "grundrechte_bv", type: "multi", diff: 3, tax: "K4",
    q: "Art. 35 Abs. 3 BV verlangt, dass Behörden dafür sorgen, dass Grundrechte auch unter Privaten wirksam werden. Welche Aussagen treffen auf diese sogenannte «Drittwirkung» zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Grundrechte gelten dadurch direkt und unmittelbar zwischen Privatpersonen."},
      {v: "B", t: "Der Gesetzgeber muss Gesetze erlassen, die den Schutz der Grundrechte auch im Verhältnis zwischen Privaten sicherstellen (indirekte Drittwirkung)."},
      {v: "C", t: "Die Drittwirkung bedeutet, dass Private Grundrechtsverletzungen gegenüber dem Staat geltend machen können."},
      {v: "D", t: "Beispielsweise schützt das Arbeitsrecht die Grundrechte der Arbeitnehmenden gegenüber dem Arbeitgeber."}
    ],
    correct: ["B", "D"],
    explain: "Die Schweiz kennt grundsätzlich eine indirekte Drittwirkung: Grundrechte gelten nicht direkt zwischen Privaten, sondern der Gesetzgeber ist verpflichtet, die Grundrechte auch im Privatrechtsverkehr zu berücksichtigen. Beispiel: Das Arbeitsgesetz und das OR schützen die Persönlichkeit der Arbeitnehmenden (Art. 328 OR). Eine direkte Drittwirkung (Antwort A) ist die Ausnahme."
  },
  {
    id: "g11", topic: "grundrechte_bv", type: "tf", diff: 3, tax: "K4",
    q: "Die Bundesverfassung unterscheidet zwischen Grundrechten, die allen Menschen zustehen, und Bürgerrechten, die nur Schweizer Staatsangehörigen zukommen (z.B. politische Rechte gemäss Art. 34 BV).",
    correct: true,
    explain: "Die BV unterscheidet zwischen Menschenrechten (stehen allen zu, z.B. Menschenwürde, Meinungsfreiheit, Glaubensfreiheit) und Bürgerrechten (nur für Schweizer Staatsangehörige, z.B. politische Rechte wie das Stimm- und Wahlrecht gemäss Art. 34 BV oder die Niederlassungsfreiheit gemäss Art. 24 BV). Der 2. Titel der BV trägt daher den Namen «Grundrechte, Bürgerrechte und Sozialziele»."
  },

  // ============================================================
  // TOPIC: einschraenkung
  // ============================================================

  // --- diff 1 ---
  {
    id: "e01", topic: "einschraenkung", type: "mc", diff: 1, tax: "K1",
    q: "Welcher Artikel der Bundesverfassung regelt die Voraussetzungen für die Einschränkung von Grundrechten?",
    options: [
      {v: "A", t: "Art. 5 BV"},
      {v: "B", t: "Art. 7 BV"},
      {v: "C", t: "Art. 36 BV"},
      {v: "D", t: "Art. 190 BV"}
    ],
    correct: "C",
    explain: "Art. 36 BV legt die Voraussetzungen fest, unter denen Grundrechte eingeschränkt werden dürfen: gesetzliche Grundlage (Abs. 1), öffentliches Interesse oder Schutz von Grundrechten Dritter (Abs. 2), Verhältnismässigkeit (Abs. 3) und Unantastbarkeit des Kerngehalts (Abs. 4)."
  },
  {
    id: "e02", topic: "einschraenkung", type: "fill", diff: 1, tax: "K1",
    q: "Gemäss Art. 36 Abs. 1 BV bedürfen Einschränkungen von Grundrechten einer {0} Grundlage.",
    blanks: [
      {answer: "gesetzlichen", alts: ["gesetzliche", "Gesetzlichen"]}
    ],
    explain: "Art. 36 Abs. 1 BV verlangt eine gesetzliche Grundlage für jede Grundrechtseinschränkung. Dies stellt sicher, dass Einschränkungen demokratisch legitimiert sind — nur der Gesetzgeber (Parlament) kann durch ein Gesetz die Freiheit der Bürgerinnen und Bürger einschränken."
  },
  {
    id: "e03", topic: "einschraenkung", type: "tf", diff: 1, tax: "K1",
    q: "Der Kerngehalt eines Grundrechts darf unter keinen Umständen angetastet werden.",
    correct: true,
    explain: "Art. 36 Abs. 4 BV bestimmt ausdrücklich: «Der Kerngehalt der Grundrechte ist unantastbar.» Der Kerngehalt ist derjenige Bereich eines Grundrechts, der keinen Eingriff duldet. Beispiel: Das Folterverbot gehört zum unantastbaren Kerngehalt der persönlichen Freiheit (Art. 10 Abs. 3 BV)."
  },
  {
    id: "e04", topic: "einschraenkung", type: "mc", diff: 1, tax: "K2",
    q: "Die vier Voraussetzungen für eine zulässige Grundrechtseinschränkung gemäss Art. 36 BV müssen …",
    options: [
      {v: "A", t: "… alternativ erfüllt sein (eine reicht aus)."},
      {v: "B", t: "… kumulativ erfüllt sein (alle müssen gleichzeitig erfüllt sein)."},
      {v: "C", t: "… nur bei schweren Eingriffen alle erfüllt sein."},
      {v: "D", t: "… nur in einem Gerichtsverfahren geprüft werden."}
    ],
    correct: "B",
    explain: "Die vier Voraussetzungen von Art. 36 BV gelten kumulativ: Fehlt auch nur eine der Voraussetzungen (gesetzliche Grundlage, öffentliches Interesse, Verhältnismässigkeit, unantastbarer Kerngehalt), so ist die Grundrechtseinschränkung unzulässig."
  },

  // --- diff 2 ---
  {
    id: "e05", topic: "einschraenkung", type: "multi", diff: 2, tax: "K2",
    img: {src: "img/recht/grundrechte/grundrechte_pruefschema_01.svg", alt: "Flussdiagramm: Prüfschema zur Einschränkung von Grundrechten nach Art. 36 BV"},
    q: "Welche der folgenden Elemente gehören zum Prüfschema bei Grundrechtseinschränkungen nach Art. 36 BV? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Gesetzliche Grundlage"},
      {v: "B", t: "Zustimmung der betroffenen Person"},
      {v: "C", t: "Öffentliches Interesse oder Schutz von Grundrechten Dritter"},
      {v: "D", t: "Verhältnismässigkeit der Massnahme"}
    ],
    correct: ["A", "C", "D"],
    explain: "Das Prüfschema nach Art. 36 BV umfasst: (1) Liegt eine Grundrechtseinschränkung vor? (2) Gesetzliche Grundlage (Abs. 1), (3) Öffentliches Interesse oder Schutz von Grundrechten Dritter (Abs. 2), (4) Verhältnismässigkeit (Abs. 3), (5) Kerngehalt unangetastet (Abs. 4). Die Zustimmung der betroffenen Person ist nicht erforderlich — gerade das macht Grundrechte so wichtig: Sie schützen auch gegen den Willen der Mehrheit."
  },
  {
    id: "e06", topic: "einschraenkung", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter der «polizeilichen Generalklausel» im Zusammenhang mit Grundrechtseinschränkungen?",
    options: [
      {v: "A", t: "Die Polizei darf Grundrechte jederzeit und ohne Einschränkungen beschränken."},
      {v: "B", t: "Eine Ausnahme vom Erfordernis der gesetzlichen Grundlage bei ernster, unmittelbarer und nicht anders abwendbarer Gefahr."},
      {v: "C", t: "Ein Gesetz, das der Polizei besondere Befugnisse gibt."},
      {v: "D", t: "Die allgemeine Pflicht der Polizei, Grundrechte zu schützen."}
    ],
    correct: "B",
    explain: "Die polizeiliche Generalklausel erlaubt ausnahmsweise Grundrechtseinschränkungen ohne spezifische gesetzliche Grundlage, wenn eine ernste, unmittelbare und nicht anders abwendbare Gefahr für wichtige Rechtsgüter besteht. Beispiel: Bei einer Naturkatastrophe darf die Polizei ein Gebiet evakuieren, auch wenn kein Gesetz dies ausdrücklich vorsieht."
  },
  {
    id: "e07", topic: "einschraenkung", type: "mc", diff: 2, tax: "K3",
    q: "Was bedeutet «Verhältnismässigkeit» bei einer Grundrechtseinschränkung gemäss Art. 36 Abs. 3 BV?",
    options: [
      {v: "A", t: "Die Massnahme muss von der Mehrheit der Bevölkerung unterstützt werden."},
      {v: "B", t: "Die Massnahme muss geeignet sein, das angestrebte Ziel zu erreichen, und der Eingriff muss für den Betroffenen zumutbar sein."},
      {v: "C", t: "Die Massnahme muss von einem Gericht angeordnet werden."},
      {v: "D", t: "Die Massnahme darf maximal drei Monate dauern."}
    ],
    correct: "B",
    explain: "Verhältnismässigkeit hat zwei Komponenten: (1) Eignung — die Massnahme muss geeignet sein, das angestrebte Ziel zu erreichen. (2) Verhältnismässigkeit im engeren Sinne (Zumutbarkeit) — der Eingriff muss für den Betroffenen in einem angemessenen Verhältnis zum verfolgten Zweck stehen. Beispiel: Der Staat darf für den Bau einer Autobahn nicht mehr Land enteignen, als tatsächlich benötigt wird."
  },
  {
    id: "e08", topic: "einschraenkung", type: "tf", diff: 2, tax: "K2",
    q: "Die aktuelle Meinung der Bevölkerung stellt ein legitimes öffentliches Interesse dar, das eine Grundrechtseinschränkung rechtfertigen kann.",
    correct: false,
    explain: "Die aktuelle Meinung der Bevölkerung stellt kein legitimes öffentliches Interesse dar. Öffentliche Interessen umfassen vielmehr sogenannte Polizeigüter wie öffentliche Sicherheit und Ordnung, Gesundheit, Sittlichkeit und öffentliche Ruhe sowie soziale, kulturelle oder ökologische Werte. Grundrechte schützen gerade auch Minderheiten vor der «Tyrannei der Mehrheit»."
  },

  // --- diff 3 ---
  {
    id: "e09", topic: "einschraenkung", type: "mc", diff: 3, tax: "K5",
    context: "Während einer Pandemie erlässt der Bundesrat per Notverordnung ein Verbot aller öffentlichen Versammlungen von mehr als 5 Personen. Herr Müller möchte dagegen klagen.",
    q: "Prüfen Sie: Welche Grundrechte werden durch das Versammlungsverbot primär eingeschränkt?",
    options: [
      {v: "A", t: "Nur die Versammlungsfreiheit (Art. 22 BV)."},
      {v: "B", t: "Die Versammlungsfreiheit (Art. 22 BV) und potenziell die Meinungsäusserungsfreiheit (Art. 16 BV) sowie die persönliche Freiheit (Art. 10 Abs. 2 BV)."},
      {v: "C", t: "Nur die persönliche Freiheit (Art. 10 BV)."},
      {v: "D", t: "Keine Grundrechte, da es sich um eine Gesundheitsmassnahme handelt."}
    ],
    correct: "B",
    explain: "Ein Versammlungsverbot greift primär in die Versammlungsfreiheit (Art. 22 BV) ein. Da Versammlungen oft der Meinungsäusserung dienen, ist auch Art. 16 BV betroffen. Zudem schränkt ein solches Verbot die allgemeine persönliche Freiheit (Art. 10 Abs. 2 BV, Bewegungsfreiheit) ein. Dass die Massnahme einen gesundheitspolitischen Zweck verfolgt, ändert nichts daran, dass Grundrechte eingeschränkt werden — es kann aber ein öffentliches Interesse (Gesundheitsschutz) begründen."
  },
  {
    id: "e10", topic: "einschraenkung", type: "multi", diff: 3, tax: "K5",
    context: "Die Stadt Bern verbietet das Tragen von religiösen Symbolen in allen öffentlichen Gebäuden, gestützt auf eine städtische Verordnung.",
    q: "Welche Prüfpunkte gemäss Art. 36 BV sind bei dieser Massnahme problematisch? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Gesetzliche Grundlage: Eine städtische Verordnung reicht für einen schweren Grundrechtseingriff möglicherweise nicht aus; es bräuchte ein formelles Gesetz."},
      {v: "B", t: "Öffentliches Interesse: Es ist fraglich, welches öffentliche Interesse ein generelles Symbolverbot rechtfertigt."},
      {v: "C", t: "Verhältnismässigkeit: Ein generelles Verbot in allen öffentlichen Gebäuden könnte unverhältnismässig sein, da mildere Mittel denkbar wären."},
      {v: "D", t: "Kerngehalt: Das Verbot tangiert den Kerngehalt der Glaubensfreiheit, da es das Tragen religiöser Symbole vollständig untersagt."}
    ],
    correct: ["A", "B", "C", "D"],
    explain: "Alle vier Punkte sind problematisch: (1) Für einen schweren Grundrechtseingriff (Glaubensfreiheit, Art. 15 BV) genügt eine Verordnung nicht — es braucht ein formelles Gesetz im demokratischen Verfahren. (2) Ein generelles Symbolverbot in allen öffentlichen Gebäuden lässt sich kaum mit einem konkreten öffentlichen Interesse begründen. (3) Mildere Mittel (z.B. Regelung nur für bestimmte Berufsgruppen) wären möglich. (4) Ein umfassendes Verbot religiöser Symbole tangiert den Kerngehalt der Glaubens- und Gewissensfreiheit, da es die Religionsausübung weitgehend verunmöglicht."
  },
  {
    id: "e11", topic: "einschraenkung", type: "mc", diff: 3, tax: "K4",
    q: "Was gehört zum «Kerngehalt» der persönlichen Freiheit (Art. 10 BV), der gemäss Art. 36 Abs. 4 BV unter keinen Umständen angetastet werden darf?",
    options: [
      {v: "A", t: "Das Recht, jederzeit das Land frei verlassen zu können."},
      {v: "B", t: "Das Folterverbot und das Verbot grausamer, unmenschlicher oder erniedrigender Behandlung."},
      {v: "C", t: "Das Recht auf ein eigenes Auto."},
      {v: "D", t: "Das Recht, keiner beruflichen Tätigkeit nachgehen zu müssen."}
    ],
    correct: "B",
    explain: "Zum unantastbaren Kerngehalt der persönlichen Freiheit gehört insbesondere das Folterverbot (Art. 10 Abs. 3 BV). Das Verbot der Folter und grausamer, unmenschlicher oder erniedrigender Behandlung darf selbst in Krisenzeiten nicht eingeschränkt werden. Die Bewegungsfreiheit oder die Reisefreiheit hingegen können unter den Voraussetzungen von Art. 36 BV eingeschränkt werden."
  },
  {
    id: "e12", topic: "einschraenkung", type: "tf", diff: 2, tax: "K2",
    q: "Bei der Prüfung von Grundrechtseinschränkungen muss als Erstes geprüft werden, ob überhaupt ein Grundrecht betroffen ist.",
    correct: true,
    explain: "Das strukturierte Prüfschema beginnt mit der Frage: «Beschränkt die strittige staatliche Massnahme überhaupt ein Grundrecht?» Man sucht dazu einen von der Massnahme betroffenen Artikel in der BV. Falls kein Grundrecht tangiert ist, erübrigt sich die weitere Prüfung nach Art. 36 BV."
  },

  // ============================================================
  // TOPIC: faelle
  // ============================================================

  // --- diff 1 ---
  {
    id: "f01", topic: "faelle", type: "mc", diff: 1, tax: "K1",
    q: "Im Fall «Es darf weggewiesen werden» ging es um Wegweisungen aus dem Berner Bahnhof. Auf welche gesetzliche Grundlage stützte sich die Polizei?",
    options: [
      {v: "A", t: "Art. 36 BV"},
      {v: "B", t: "Art. 29b des Polizeigesetzes des Kantons Bern"},
      {v: "C", t: "Art. 10 BV (persönliche Freiheit)"},
      {v: "D", t: "Das Strafgesetzbuch (StGB)"}
    ],
    correct: "B",
    explain: "Die Polizei stützte sich auf Art. 29b (heute Art. 29) des kantonalen Polizeigesetzes des Kantons Bern. Dieser erlaubt die vorübergehende Wegweisung oder Fernhaltung von Personen unter bestimmten Voraussetzungen, etwa wenn sie die öffentliche Sicherheit und Ordnung gefährden oder stören."
  },
  {
    id: "f02", topic: "faelle", type: "tf", diff: 1, tax: "K2",
    q: "Im Wegweisungsfall beurteilte das Bundesgericht den Wegweisungsartikel als grundsätzlich verfassungskonform.",
    correct: true,
    explain: "Das Bundesgericht entschied mit 4 gegen 1 Stimme, dass der Berner Wegweisungsartikel grundsätzlich verfassungskonform ist. Alle fünf Richter hielten den Artikel für verfassungskonform — auch der dissentierende Richter Fonjallaz sah nur in der konkreten Anwendung auf die 13 Beschwerdeführer ein Problem, nicht im Artikel selbst."
  },
  {
    id: "f03", topic: "faelle", type: "mc", diff: 1, tax: "K1",
    q: "Welche Übung handelt vom Fall einer Lehrerin, der das Tragen eines Kopftuchs im Unterricht verboten wurde?",
    options: [
      {v: "A", t: "Übung Versammlungsfreiheit"},
      {v: "B", t: "Übung Meinungsäusserungsfreiheit"},
      {v: "C", t: "Übung Glaubensfreiheit"},
      {v: "D", t: "Übung Eigentumsgarantie"}
    ],
    correct: "C",
    explain: "In der Übung zur Glaubensfreiheit geht es um die Lehrerin Rosalie, die nach ihrer Konversion zum Islam ein Kopftuch im Unterricht tragen möchte. Die Schulleitung verbietet dies gestützt auf das kantonale Schulgesetz, das die religiöse Neutralität der Schule festschreibt. Es stellt sich die Frage, ob dieses Verbot die Glaubens- und Gewissensfreiheit (Art. 15 BV) zulässig einschränkt."
  },

  // --- diff 2 ---
  {
    id: "f04", topic: "faelle", type: "mc", diff: 2, tax: "K3",
    context: "13 Personen wurden wegen Alkoholkonsums und Störung der öffentlichen Ordnung für drei Monate aus dem Berner Bahnhof weggewiesen. Ihr Anwalt rügte die Wegweisungen als «ästhetische Säuberung» und Verstoss gegen die Bundesverfassung.",
    q: "In welches Grundrecht greifen die Wegweisungen gemäss dem Bundesgericht ein?",
    options: [
      {v: "A", t: "In die Eigentumsgarantie (Art. 26 BV)"},
      {v: "B", t: "In die Versammlungsfreiheit (Art. 22 BV) und teilweise in die persönliche Freiheit (Art. 10 BV)"},
      {v: "C", t: "In die Meinungsäusserungsfreiheit (Art. 16 BV)"},
      {v: "D", t: "In die Niederlassungsfreiheit (Art. 24 BV)"}
    ],
    correct: "B",
    explain: "Das Bundesgericht erkannte einstimmig, dass die Wegweisungen in die Versammlungsfreiheit (Art. 22 BV) eingreifen. Einzelne Richter sahen zudem einen Eingriff in die persönliche Freiheit (Art. 10 BV). Der Eingriff wurde jedoch als «nicht sehr schwer» taxiert, da die Betroffenen lediglich den Bahnhof nicht mehr aufsuchen durften, aber weiterhin Züge nehmen und einkaufen konnten."
  },
  {
    id: "f05", topic: "faelle", type: "multi", diff: 2, tax: "K3",
    context: "Im Fall «Es darf weggewiesen werden» prüfte das Bundesgericht die Zulässigkeit der Grundrechtseinschränkung nach dem Schema von Art. 36 BV.",
    q: "Welche der folgenden Argumente verwendete das Bundesgericht zur Begründung der Verfassungskonformität? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Art. 29b Polizeigesetz BE stellt eine ausreichende gesetzliche Grundlage dar, obwohl «recht offen formuliert»."},
      {v: "B", t: "Das öffentliche Interesse liegt im Unterbinden «negativer Erscheinungen» im Umfeld von Drogen- und Alkoholszenen."},
      {v: "C", t: "Die Wegweisung ist ein geeignetes und verhältnismässiges Mittel, da sie sachlich und örtlich begrenzt ist."},
      {v: "D", t: "Die Menschenwürde der Weggewiesenen wurde verletzt, weshalb der Kerngehalt nicht gewahrt war."}
    ],
    correct: ["A", "B", "C"],
    explain: "Das Bundesgericht argumentierte: (1) Art. 29b PolG BE ist zwar offen formuliert, genügt aber als gesetzliche Grundlage. (2) Das öffentliche Interesse liegt in der Störung der öffentlichen Ordnung und Sicherheit — «negative Erscheinungen» wie Belästigung von Passanten, aggressives Betteln und grosse Unordnung. (3) Befristete und örtlich begrenzte Wegweisungen sind ein geeignetes und verhältnismässiges Mittel. Der Wegweisungsartikel verstösst laut Bundesgericht nicht gegen die Menschenwürde, da die Betroffenen nicht wegen ihrer Person, sondern wegen ihres Verhaltens weggewiesen wurden."
  },
  {
    id: "f06", topic: "faelle", type: "mc", diff: 2, tax: "K3",
    context: "Die Lehrerin Rosalie in Genf konvertierte zum Islam und trägt seither ein Kopftuch. Die Schulleitung verbietet ihr das Tragen des Kopftuchs im Unterricht, gestützt auf das kantonale Schulgesetz, das die religiöse Neutralität der Schule festschreibt.",
    q: "Welches Grundrecht wird durch das Kopftuchverbot eingeschränkt?",
    options: [
      {v: "A", t: "Die Versammlungsfreiheit (Art. 22 BV)"},
      {v: "B", t: "Die Meinungsäusserungsfreiheit (Art. 16 BV)"},
      {v: "C", t: "Die Glaubens- und Gewissensfreiheit (Art. 15 BV)"},
      {v: "D", t: "Die Wirtschaftsfreiheit (Art. 27 BV)"}
    ],
    correct: "C",
    explain: "Das Tragen eines Kopftuchs ist Ausdruck der Religionsausübung und fällt unter die Glaubens- und Gewissensfreiheit (Art. 15 BV). Ein Verbot schränkt dieses Grundrecht ein. Es ist daher anhand von Art. 36 BV zu prüfen, ob die Einschränkung zulässig ist."
  },

  // --- diff 3 ---
  {
    id: "f07", topic: "faelle", type: "mc", diff: 3, tax: "K5",
    context: "Die Lehrerin Rosalie (Genf) klagt gegen das Kopftuchverbot im Unterricht. Die Schulleitung stützt sich auf das kantonale Schulgesetz, das die religiöse Neutralität der Schule vorschreibt.",
    q: "Prüfen Sie alle fünf Punkte von Art. 36 BV: Ist das Kopftuchverbot insgesamt verfassungskonform?",
    options: [
      {v: "A", t: "Nein, es fehlt an einer gesetzlichen Grundlage, da das Schulgesetz keine Kleidervorschriften enthält."},
      {v: "B", t: "Nein, der Kerngehalt der Glaubensfreiheit wird verletzt, da das Verbot die Religionsausübung vollständig verunmöglicht."},
      {v: "C", t: "Ja — es besteht eine gesetzliche Grundlage (Schulgesetz), ein öffentliches Interesse (religiöse Neutralität der Schule), die Massnahme ist verhältnismässig (gilt nur im Unterricht, nicht privat) und der Kerngehalt bleibt gewahrt (Rosalie kann ihren Glauben ausserhalb der Schule frei ausüben)."},
      {v: "D", t: "Nein, die religiöse Neutralität ist kein anerkanntes öffentliches Interesse."}
    ],
    correct: "C",
    explain: "Obersatz: Es ist zu prüfen, ob das Kopftuchverbot die Glaubensfreiheit (Art. 15 BV) zulässig einschränkt. Prüfung: (1) Grundrecht betroffen: Ja, Art. 15 BV (Glaubens- und Gewissensfreiheit). (2) Gesetzliche Grundlage: Ja, das kantonale Schulgesetz schreibt religiöse Neutralität vor. (3) Öffentliches Interesse: Ja, die religiöse Neutralität der öffentlichen Schule ist ein anerkanntes öffentliches Interesse. (4) Verhältnismässigkeit: Ja, das Verbot gilt nur im Unterricht; ausserhalb der Schule kann Rosalie ihr Kopftuch tragen. (5) Kerngehalt: Gewahrt, da Rosalie ihren Glauben weiterhin privat und ausserhalb der Schule ausüben kann. Schlussfolgerung: Das Verbot ist verfassungskonform. Der EGMR hat dies in einem vergleichbaren Fall (Dahlab gegen die Schweiz, 2001) bestätigt."
  },
  {
    id: "f08", topic: "faelle", type: "multi", diff: 3, tax: "K5",
    context: "Während der COVID-19-Pandemie erliess der Bundesrat per Notverordnung weitreichende Massnahmen: Verbot von Veranstaltungen mit mehr als 5 Personen, Schliessung von Restaurants und Geschäften, Einreisebeschränkungen und eine Maskenpflicht im öffentlichen Raum.",
    q: "Welche Grundrechte wurden durch die COVID-Massnahmen des Bundesrats eingeschränkt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Versammlungsfreiheit (Art. 22 BV)"},
      {v: "B", t: "Wirtschaftsfreiheit (Art. 27 BV)"},
      {v: "C", t: "Persönliche Freiheit / Bewegungsfreiheit (Art. 10 BV)"},
      {v: "D", t: "Glaubens- und Gewissensfreiheit (Art. 15 BV)"}
    ],
    correct: ["A", "B", "C", "D"],
    explain: "Die COVID-Massnahmen griffen in zahlreiche Grundrechte ein: (A) Versammlungsfreiheit — durch das Verbot von Veranstaltungen und Versammlungen. (B) Wirtschaftsfreiheit — durch Schliessungen von Restaurants, Geschäften und Betrieben. (C) Persönliche Freiheit — durch Einreisebeschränkungen, Quarantänepflichten und Bewegungseinschränkungen. (D) Glaubens- und Gewissensfreiheit — durch das Verbot von Gottesdiensten und religiösen Versammlungen. Die Massnahmen waren besonders kontrovers, da sie per Notverordnung des Bundesrates erfolgten und nicht vom Parlament beschlossen wurden."
  },
  {
    id: "f09", topic: "faelle", type: "mc", diff: 3, tax: "K5",
    context: "Der dissentierende Bundesrichter Fonjallaz hielt im Wegweisungsfall den Art. 29b Polizeigesetz zwar für grundsätzlich verfassungskonform, rügte jedoch die konkrete Anwendung auf die 13 Beschwerdeführer.",
    q: "Was war das Hauptargument von Richter Fonjallaz gegen die Rechtfertigung der konkreten Wegweisungen?",
    options: [
      {v: "A", t: "Er fand, dass Art. 29b PolG BE keine ausreichende gesetzliche Grundlage darstelle."},
      {v: "B", t: "Er hielt die polizeiliche Sachverhaltsabklärung im Fall der 13 Beschwerdeführer für ungenügend — es bestehe kein gesichertes öffentliches Interesse."},
      {v: "C", t: "Er argumentierte, das Folterverbot sei verletzt worden."},
      {v: "D", t: "Er fand, dass die Wegweisung gegen das Diskriminierungsverbot verstosse, da die Betroffenen wegen ihrer Herkunft weggewiesen worden seien."}
    ],
    correct: "B",
    explain: "Richter Fonjallaz hielt den Wegweisungsartikel grundsätzlich für verfassungskonform, kritisierte aber die Anwendung im konkreten Fall: Die polizeiliche Sachverhaltsabklärung sei ungenügend gewesen. Für Leute, die lediglich Lärm machten und Unrat produzierten, aber nicht aggressiv waren, sah er kein ausreichendes öffentliches Interesse für eine Wegweisung. Er verglich die Wegweisung mit der «Verbannung im Mittelalter» und gab zu bedenken, dass Alkoholkranke, Arbeits- und Obdachlose keinen anderen Ort hätten, um sich zu treffen."
  },
  {
    id: "f10", topic: "faelle", type: "tf", diff: 2, tax: "K3",
    context: "Im Berner Wegweisungsfall argumentierte der Anwalt der Betroffenen, die Wegweisungen seien eine «ästhetische Säuberung» und diskriminierten die Betroffenen aufgrund ihres Aussehens und ihrer Lebensform.",
    q: "Das Bundesgericht stellte fest, dass die Betroffenen nicht wegen eines personenspezifischen Merkmals, sondern allein wegen ihres Verhaltens weggewiesen wurden.",
    correct: true,
    explain: "Das Bundesgericht wies den Vorwurf der Diskriminierung zurück. Bundesrichter Nay erläuterte, die Betroffenen seien nicht wegen ihrer Rasse, ihres Geschlechts, ihrer Sprache oder ihrer Lebensweise weggewiesen worden, sondern allein wegen ihres Verhaltens: Sie hatten in erheblichem Mass Alkohol konsumiert, Lärm verursacht und grosse Unordnung erzeugt, was Passanten belästigt hatte."
  },
  {
    id: "f11", topic: "faelle", type: "mc", diff: 2, tax: "K3",
    context: "Die Lehrerin Rosalie will im Unterricht ein Kopftuch tragen. Die Schulleitung verbietet dies unter Berufung auf die religiöse Neutralität der Schule.",
    q: "Welches Prüfkriterium von Art. 36 BV ist bei diesem Fall am ehesten umstritten?",
    options: [
      {v: "A", t: "Die gesetzliche Grundlage, da kein Schulgesetz existiert."},
      {v: "B", t: "Die Verhältnismässigkeit — ein Verbot nur im Unterricht könnte als milderes Mittel gegenüber einem generellen Berufsverbot gelten."},
      {v: "C", t: "Der Kerngehalt, da Rosalie ihren Glauben komplett aufgeben müsste."},
      {v: "D", t: "Das öffentliche Interesse, da religiöse Neutralität umstritten ist."}
    ],
    correct: "B",
    explain: "Die Verhältnismässigkeit ist das zentrale Streitthema: Ist ein Kopftuchverbot nur im Unterricht ein geeignetes und zumutbares Mittel? Einerseits ist es ein milderer Eingriff als ein generelles Berufsverbot (Rosalie kann ausserhalb der Schule ein Kopftuch tragen). Andererseits könnte man argumentieren, dass auch ein Unterricht mit Kopftuch möglich wäre, wenn die Lehrerin neutral unterrichtet. Der EGMR hat das Verbot in einem vergleichbaren Fall als verhältnismässig beurteilt."
  },

  // --- weitere Fragen zur Abrundung ---

  {
    id: "m13", topic: "menschenrechte", type: "mc", diff: 1, tax: "K1",
    q: "Wie viele Artikel umfasst die Allgemeine Erklärung der Menschenrechte (AEMR)?",
    options: [
      {v: "A", t: "10 Artikel"},
      {v: "B", t: "20 Artikel"},
      {v: "C", t: "30 Artikel"},
      {v: "D", t: "50 Artikel"}
    ],
    correct: "C",
    explain: "Die AEMR umfasst eine Präambel und 30 Artikel. Sie deckt ein breites Spektrum von Rechten ab: bürgerliche und politische Rechte (Art. 1–21) sowie wirtschaftliche, soziale und kulturelle Rechte (Art. 22–27). Die letzten Artikel (Art. 28–30) regeln den Rahmen und die Grenzen der Rechte."
  },
  {
    id: "m14", topic: "menschenrechte", type: "fill", diff: 2, tax: "K1",
    q: "Gemäss Art. 3 AEMR hat jeder das Recht auf {0}, {1} und Sicherheit der Person.",
    blanks: [
      {answer: "Leben", alts: ["das Leben"]},
      {answer: "Freiheit", alts: ["die Freiheit"]}
    ],
    explain: "Art. 3 AEMR: «Jeder hat das Recht auf Leben, Freiheit und Sicherheit der Person.» Dieser Artikel gehört zu den fundamentalsten Menschenrechten und bildet die Grundlage für zahlreiche weitere Rechte."
  },
  {
    id: "g12", topic: "grundrechte_bv", type: "fill", diff: 1, tax: "K1",
    q: "Die Grundrechte der Schweiz stehen im {0}. Titel der Bundesverfassung, unter dem Namen «Grundrechte, {1} und Sozialziele».",
    blanks: [
      {answer: "2", alts: ["zweiten", "2."]},
      {answer: "Bürgerrechte", alts: ["Buergerrechte"]}
    ],
    explain: "Der 2. Titel der BV trägt die Überschrift «Grundrechte, Bürgerrechte und Sozialziele» und umfasst die Art. 7–41 BV. Die Grundrechte (Art. 7–34) stehen allen Menschen zu, die Bürgerrechte (Art. 34–40) nur Schweizer Staatsangehörigen."
  },
  {
    id: "e13", topic: "einschraenkung", type: "fill", diff: 1, tax: "K1",
    q: "Grundrechtseinschränkungen müssen gemäss Art. 36 Abs. 3 BV {0} sein.",
    blanks: [
      {answer: "verhältnismässig", alts: ["verhaeltnismaessig", "verhältnismäßig", "Verhältnismässig"]}
    ],
    explain: "Art. 36 Abs. 3 BV: «Einschränkungen von Grundrechten müssen verhältnismässig sein.» Die Verhältnismässigkeit verlangt, dass die Massnahme geeignet ist und dass der Eingriff in einem angemessenen Verhältnis zum verfolgten Zweck steht."
  },
  {
    id: "f12", topic: "faelle", type: "tf", diff: 1, tax: "K2",
    q: "Im Berner Wegweisungsfall ging es um Personen, die aus dem Berner Bahnhof weggewiesen wurden, weil sie in erheblichem Mass Alkohol konsumiert und die öffentliche Ordnung gestört hatten.",
    correct: true,
    explain: "Gemäss Polizeiangaben hatte die Gruppe bei den Steinen im Bahnhof «in erheblichem Mass dem Alkohol zugesprochen», es hatte Lärm und grosse Unordnung geherrscht, und zahlreiche Passanten hatten am Verhalten der Gruppe Anstoss genommen. Die Polizei verbot darauf den 13 Leuten für drei Monate, sich im Bahnhofsbereich in Personenansammlungen aufzuhalten, in welchen Alkohol konsumiert wird."
  },
  {
    id: "e14", topic: "einschraenkung", type: "mc", diff: 3, tax: "K4",
    q: "Welches der folgenden Beispiele illustriert die polizeiliche Generalklausel korrekt?",
    options: [
      {v: "A", t: "Die Polizei räumt nach einem Erdbeben ein einsturzgefährdetes Quartier, obwohl kein spezifisches Evakuierungsgesetz existiert."},
      {v: "B", t: "Die Polizei kontrolliert routinemässig Ausweise in der Fussgängerzone."},
      {v: "C", t: "Das Parlament beschliesst ein neues Demonstrationsverbot."},
      {v: "D", t: "Ein Gericht verurteilt jemanden wegen Hausfriedensbruch."}
    ],
    correct: "A",
    explain: "Die polizeiliche Generalklausel erlaubt Grundrechtseinschränkungen ohne spezifische gesetzliche Grundlage bei ernster, unmittelbarer und nicht anders abwendbarer Gefahr. Ein Erdbeben mit Einsturzgefahr ist ein klassisches Beispiel: Die Evakuierung greift in die persönliche Freiheit und das Eigentumsrecht ein, ist aber wegen der akuten Gefahr auch ohne spezifische Rechtsgrundlage zulässig. Routinekontrollen (B) erfordern hingegen eine ordentliche gesetzliche Grundlage."
  },
  {
    id: "g13", topic: "grundrechte_bv", type: "mc", diff: 2, tax: "K2",
    q: "Art. 8 BV garantiert die Rechtsgleichheit. Was bedeutet das Diskriminierungsverbot in Art. 8 Abs. 2 BV?",
    options: [
      {v: "A", t: "Alle Gesetze müssen für alle Personen identisch sein."},
      {v: "B", t: "Niemand darf aufgrund von Herkunft, Rasse, Geschlecht, Alter, Sprache, sozialer Stellung, Lebensform, religiöser oder politischer Überzeugung oder körperlicher, geistiger oder psychischer Behinderung diskriminiert werden."},
      {v: "C", t: "Der Staat muss allen Bürgerinnen und Bürgern den gleichen Lohn zahlen."},
      {v: "D", t: "Nur Schweizer Staatsbürger haben Anspruch auf Gleichbehandlung."}
    ],
    correct: "B",
    explain: "Art. 8 Abs. 2 BV enthält ein qualifiziertes Diskriminierungsverbot: Es verbietet Ungleichbehandlungen, die an bestimmte verpönte Merkmale anknüpfen (Herkunft, Geschlecht, Alter, Sprache, Behinderung etc.). Dies bedeutet nicht, dass alle Gesetze identisch sein müssen — sachlich begründete Unterscheidungen sind erlaubt. Aber Benachteiligungen aufgrund der genannten Merkmale sind verboten."
  },
  {
    id: "m15", topic: "menschenrechte", type: "tf", diff: 2, tax: "K2",
    q: "Art. 5 AEMR verbietet Folter und grausame, unmenschliche oder erniedrigende Behandlung oder Strafe — dieses Recht gilt absolut und darf nicht eingeschränkt werden.",
    correct: true,
    explain: "Das Folterverbot gehört zu den sogenannten notstandsfesten Menschenrechten: Es darf unter keinen Umständen eingeschränkt oder aufgehoben werden, auch nicht in Krisenzeiten oder bei Bedrohung der nationalen Sicherheit. In der schweizerischen BV entspricht dies dem Kerngehalt der persönlichen Freiheit (Art. 10 Abs. 3 BV), der gemäss Art. 36 Abs. 4 BV unantastbar ist."
  },
  {
    id: "f13", topic: "faelle", type: "mc", diff: 3, tax: "K5",
    context: "Während der COVID-19-Pandemie wehrten sich verschiedene Gruppen gegen die Grundrechtseinschränkungen durch den Bundesrat. Es kam zu Demonstrationen gegen die Massnahmen, die teilweise verboten wurden.",
    q: "Warum waren die Grundrechtseinschränkungen durch den Bundesrat während der COVID-19-Pandemie besonders kontrovers?",
    options: [
      {v: "A", t: "Weil der Bundesrat keine Kompetenz hatte, Grundrechte einzuschränken."},
      {v: "B", t: "Weil die Massnahmen per Notverordnung erlassen wurden (ohne ordentliches Gesetzgebungsverfahren im Parlament) und weil umstritten war, ob sie verhältnismässig waren."},
      {v: "C", t: "Weil das Bundesgericht die Massnahmen sofort als verfassungswidrig erklärte."},
      {v: "D", t: "Weil die Massnahmen nur für bestimmte Bevölkerungsgruppen galten."}
    ],
    correct: "B",
    explain: "Die Kontroverse hatte mehrere Ebenen: (1) Demokratische Legitimation: Die Massnahmen wurden per Notverordnung des Bundesrates erlassen (Art. 185 Abs. 3 BV), ohne Mitsprache des Parlaments. Erst mit dem COVID-19-Gesetz wurde eine ordentliche gesetzliche Grundlage geschaffen. (2) Verhältnismässigkeit: Es war umstritten, ob die weitreichenden Einschränkungen (Lockdown, Versammlungsverbot, Schliessungen) in jedem Fall verhältnismässig waren. (3) Das COVID-Gesetz wurde in einer Volksabstimmung 2021 knapp angenommen, was die gesellschaftliche Spaltung zeigte."
  }
];
