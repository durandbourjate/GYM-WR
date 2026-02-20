// ============================================================
// BWL Einführung – Grundlagen der Betriebswirtschaftslehre
// Kapitel 1 (HEP Betriebswirtschaftslehre 2023)
// Pool für SF GYM1, Semester 1
// ============================================================

window.POOL_META = {
  title: "Einführung BWL – Grundlagen der Betriebswirtschaftslehre",
  fach: "BWL",
  color: "#01a9f4",
  level: "SF GYM1"
};

window.TOPICS = {
  "wirtschaft":  "Wirtschaft, Bedürfnisse & Knappheit",
  "gueter":      "Güterarten & ökonomisches Prinzip",
  "struktur":    "Struktur der Schweizer Wirtschaft",
  "unternehmen": "Kriterien zur Unterscheidung von Unternehmen",
  "ziele":       "Unternehmensziele & Zielbeziehungen",
  "kennzahlen":  "Kennzahlen",
  "standort":    "Standortfaktoren & Nutzwertanalyse"
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: wirtschaft – Wirtschaft, Bedürfnisse & Knappheit
  // ============================================================

  {
    id: "w01", topic: "wirtschaft", type: "mc", diff: 1, tax: "K1",
    q: "Was ist ein Bedürfnis?",
    options: [
      {v: "A", t: "Der Wunsch, einen empfundenen Mangel zu beseitigen oder zu mildern"},
      {v: "B", t: "Ein Gut, das man im Laden kaufen kann"},
      {v: "C", t: "Die Menge an Geld, die man zur Verfügung hat"},
      {v: "D", t: "Eine Dienstleistung, die von Unternehmen angeboten wird"}
    ],
    correct: "A",
    explain: "Ein Bedürfnis ist gemäss Definition der Wunsch, einen empfundenen Mangel zu beseitigen oder zu mildern. Bedürfnisse sind der Ausgangspunkt wirtschaftlicher Aktivitäten."
  },
  {
    id: "w02", topic: "wirtschaft", type: "mc", diff: 1, tax: "K1",
    q: "Welche Stufe der Maslow'schen Bedürfnispyramide bildet die Basis?",
    options: [
      {v: "A", t: "Sicherheitsbedürfnisse"},
      {v: "B", t: "Soziale Bedürfnisse"},
      {v: "C", t: "Physiologische Bedürfnisse"},
      {v: "D", t: "Selbstverwirklichung"}
    ],
    correct: "C",
    img: {src: "img/bwl/einfuehrung/einfuehrung_beduerfnispyramide_01.svg", alt: "Pyramide mit vier Stufen, Beschriftungen durch Fragezeichen ersetzt"},
    explain: "Die physiologischen Bedürfnisse (z.B. Nahrung, Schlaf, Wärme) bilden die unterste Stufe der Pyramide. Sie müssen zuerst befriedigt werden, bevor höhere Bedürfnisse relevant werden."
  },
  {
    id: "w03", topic: "wirtschaft", type: "fill", diff: 1, tax: "K1",
    q: "Bedürfnisse der Menschen sind der Ausgangspunkt der {0}. Diese ungelösten Probleme bieten die Möglichkeit für das Anbieten von Lösungen, für welche eine {1} bestehen kann.",
    blanks: [
      {answer: "Wirtschaft", alts: ["wirtschaftlichen Aktivitäten", "wirtschaftlichen Tätigkeit"]},
      {answer: "Zahlungsbereitschaft", alts: ["Nachfrage"]}
    ],
    explain: "Bedürfnisse sind der Motor der Wirtschaft. Wenn Menschen bereit sind, für die Lösung eines Problems zu bezahlen, entsteht ein Markt."
  },
  {
    id: "w04", topic: "wirtschaft", type: "tf", diff: 1, tax: "K2",
    q: "Dem Menschen gelingt es, alle seine Bedürfnisse vollständig zu befriedigen, wenn er genug Geld verdient.",
    correct: false,
    explain: "Falsch. Dem Menschen gelingt es nie, alle seine Bedürfnisse zu befriedigen. Sein Budget ist beschränkt und die zur Verfügung stehenden Ressourcen und Güter sind knapp. Auch mit viel Geld bleiben Bedürfnisse unerfüllt (z.B. Zeit, Gesundheit)."
  },
  {
    id: "w05", topic: "wirtschaft", type: "mc", diff: 2, tax: "K2",
    q: "Welche der folgenden Aussagen beschreibt den Zusammenhang zwischen Bedürfnissen und Knappheit korrekt?",
    options: [
      {v: "A", t: "Knappheit entsteht, weil Bedürfnisse begrenzt, aber Ressourcen unbegrenzt sind"},
      {v: "B", t: "Knappheit entsteht, weil die Bedürfnisse unbegrenzt, die Mittel zur Befriedigung aber begrenzt sind"},
      {v: "C", t: "Knappheit existiert nur in Entwicklungsländern"},
      {v: "D", t: "Knappheit entsteht durch staatliche Regulierung"}
    ],
    correct: "B",
    explain: "Das Grundproblem der Wirtschaft ist, dass die menschlichen Bedürfnisse praktisch unbegrenzt sind, während die Ressourcen (Geld, Rohstoffe, Zeit) zur Befriedigung begrenzt sind. Dieses Spannungsfeld zwischen Bedarf und Deckungsmöglichkeit ist die Ursache der Knappheit."
  },
  {
    id: "w06", topic: "wirtschaft", type: "multi", diff: 2, tax: "K2",
    q: "In welchen Rollen sind Menschen mit der Wirtschaft verknüpft? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Als Arbeitnehmende bei einem Unternehmen"},
      {v: "B", t: "Als Konsumentinnen und Konsumenten beim täglichen Einkauf"},
      {v: "C", t: "Als Produzierende von Gütern und Dienstleistungen"},
      {v: "D", t: "Als Sparerinnen und Sparer, um Zinsen zu erwirtschaften"}
    ],
    correct: ["A", "B", "C", "D"],
    explain: "Alle Menschen sind auf vielfältige Weise mit der Wirtschaft verknüpft: als Arbeitnehmende (Einkommen erzielen), als Konsumierende (Bedürfnisse befriedigen), als Produzierende (Güter herstellen, Gewinn erzielen) und als Sparende (Zinsen erwirtschaften)."
  },
  {
    id: "w07", topic: "wirtschaft", type: "mc", diff: 2, tax: "K2",
    q: "Frau Wepfer schliesst eine Privathaftpflichtversicherung ab. Welcher Kategorie der Maslow'schen Bedürfnispyramide entspricht dieses Bedürfnis?",
    options: [
      {v: "A", t: "Physiologisches Bedürfnis"},
      {v: "B", t: "Sicherheitsbedürfnis"},
      {v: "C", t: "Soziales Bedürfnis"},
      {v: "D", t: "Bedürfnis nach Selbstverwirklichung"}
    ],
    correct: "B",
    explain: "Eine Privathaftpflichtversicherung dient der Absicherung gegen finanzielle Risiken. Dies entspricht einem Sicherheitsbedürfnis (Schutz vor Gefahren, festes Einkommen, Absicherung, Unterkunft)."
  },
  {
    id: "w08", topic: "wirtschaft", type: "mc", diff: 3, tax: "K4",
    q: "Herr Sommer kauft sich einen Porsche. Welche Bedürfniskategorie(n) könnten hier zutreffen?",
    options: [
      {v: "A", t: "Nur physiologisches Bedürfnis, da ein Auto der Fortbewegung dient"},
      {v: "B", t: "Nur Sicherheitsbedürfnis, da ein Auto Schutz bietet"},
      {v: "C", t: "Primär Bedürfnis nach Anerkennung (Prestige), eventuell auch Selbstverwirklichung"},
      {v: "D", t: "Nur soziales Bedürfnis, da man mit dem Auto Freunde besuchen kann"}
    ],
    correct: "C",
    explain: "Ein Porsche geht weit über das Grundbedürfnis nach Mobilität hinaus. Der Kauf eines Luxusautos befriedigt primär das Bedürfnis nach Anerkennung und Prestige (Achtung). Je nach Motivation kann auch Selbstverwirklichung eine Rolle spielen."
  },
  {
    id: "w09", topic: "wirtschaft", type: "tf", diff: 3, tax: "K5",
    q: "Die Maslow'sche Bedürfnispyramide impliziert, dass höhere Bedürfnisse erst dann relevant werden, wenn die darunterliegenden vollständig befriedigt sind. Dieses Modell bildet die Realität exakt ab.",
    correct: false,
    explain: "Falsch. Die Maslow'sche Bedürfnispyramide ist ein vereinfachtes Modell. In der Realität können Menschen durchaus höhere Bedürfnisse verfolgen, obwohl niedrigere noch nicht vollständig befriedigt sind (z.B. Künstler, die trotz finanzieller Not kreativ arbeiten). Die starre Hierarchie ist eine Kritik am Modell."
  },
  {
    id: "w10", topic: "wirtschaft", type: "fill", diff: 2, tax: "K1",
    q: "{0} bedeutet eine möglichst effiziente Umwandlung von Inputs hin zu Outputs, also die Vermeidung von Verschwendung.",
    blanks: [
      {answer: "Wirtschaften", alts: ["Das Wirtschaften"]}
    ],
    explain: "Wirtschaften bedeutet, mit knappen Ressourcen (Inputs) einen möglichst grossen Nutzen (Output) zu erzielen. Die zentrale Aufgabe ist die Vermeidung von Verschwendung."
  },

  // ============================================================
  // TOPIC: gueter – Güterarten & ökonomisches Prinzip
  // ============================================================

  {
    id: "g01", topic: "gueter", type: "mc", diff: 1, tax: "K1",
    q: "Wie werden Güter genannt, die durch die Wirtschaft bereitgestellt werden und der Bedürfnisbefriedigung dienen?",
    options: [
      {v: "A", t: "Freie Güter"},
      {v: "B", t: "Wirtschaftsgüter"},
      {v: "C", t: "Luxusgüter"},
      {v: "D", t: "Naturgüter"}
    ],
    correct: "B",
    explain: "Wirtschaftsgüter sind Güter, die knapp sind und bewirtschaftet werden müssen. Im Gegensatz dazu sind freie Güter (wie Luft) in ausreichender Menge vorhanden und werden von der BWL nicht näher betrachtet."
  },
  {
    id: "g02", topic: "gueter", type: "mc", diff: 1, tax: "K2",
    q: "Welches der folgenden Beispiele ist ein Verbrauchsgut?",
    options: [
      {v: "A", t: "Ein Fernseher"},
      {v: "B", t: "Ein Lebensmittel"},
      {v: "C", t: "Ein Buch"},
      {v: "D", t: "Ein Kletterseil"}
    ],
    correct: "B",
    img: {src: "img/bwl/einfuehrung/einfuehrung_gueterarten_01.svg", alt: "Übersicht der Güterarten als Baumdiagramm mit leeren Feldern"},
    explain: "Lebensmittel sind Verbrauchsgüter, weil sie mit dem Konsum verbraucht werden. Fernseher, Bücher und Kletterseile können wiederholt benutzt werden und sind somit Gebrauchsgüter."
  },
  {
    id: "g03", topic: "gueter", type: "tf", diff: 1, tax: "K2",
    q: "Dienstleistungen zählen zu den immateriellen Gütern.",
    correct: true,
    explain: "Richtig. Immaterielle Güter umfassen Dienstleistungen aller Art, Patente, Rechte und Lizenzen. Im Gegensatz dazu sind materielle Güter (Sachgüter) physisch greifbar."
  },
  {
    id: "g04", topic: "gueter", type: "fill", diff: 1, tax: "K1",
    q: "Materielle Güter lassen sich in {0} und {1} unterteilen.",
    blanks: [
      {answer: "Konsumgüter", alts: ["Konsumgueter"]},
      {answer: "Investitionsgüter", alts: ["Investitionsgueter"]}
    ],
    explain: "Materielle Güter (Sachgüter) werden in Konsumgüter (für den privaten Verbrauch) und Investitionsgüter (für die Erstellung von Konsumgütern, z.B. Maschinen) unterteilt."
  },
  {
    id: "g05", topic: "gueter", type: "mc", diff: 2, tax: "K2",
    q: "Was unterscheidet Investitionsgüter von Konsumgütern?",
    options: [
      {v: "A", t: "Investitionsgüter sind immer teurer als Konsumgüter"},
      {v: "B", t: "Investitionsgüter dienen der Erstellung von Konsumgütern und tragen indirekt zur Bedürfnisbefriedigung bei"},
      {v: "C", t: "Konsumgüter können nur einmal verwendet werden"},
      {v: "D", t: "Investitionsgüter werden ausschliesslich vom Staat gekauft"}
    ],
    correct: "B",
    explain: "Investitionsgüter (z.B. Maschinen, Fahrzeuge) werden für die Erstellung von Konsumgütern verwendet. Sie tragen somit indirekt zur Bedürfnisbefriedigung bei, während Konsumgüter direkt dem privaten Verbrauch dienen."
  },
  {
    id: "g06", topic: "gueter", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zum ökonomischen Prinzip treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Maximumprinzip: Mit gegebenem Input den grösstmöglichen Output erzielen"},
      {v: "B", t: "Das Minimumprinzip: Einen vorgegebenen Output mit minimalem Input erreichen"},
      {v: "C", t: "Das Optimumprinzip: Input und Output optimal aufeinander abstimmen"},
      {v: "D", t: "Das Gewinnprinzip: Immer den maximalen Gewinn anstreben"}
    ],
    correct: ["A", "B", "C"],
    explain: "Das ökonomische Prinzip kennt drei Varianten: Maximumprinzip (gegebener Input → maximaler Output), Minimumprinzip (vorgegebener Output → minimaler Input) und Optimumprinzip (Input und Output optimal abstimmen). Ein «Gewinnprinzip» gibt es in dieser Form nicht."
  },
  {
    id: "g07", topic: "gueter", type: "mc", diff: 2, tax: "K3",
    q: "Ein Unternehmen will aus 125 Holzlatten möglichst viele Tischplatten herstellen. Welches ökonomische Prinzip wird hier angewendet?",
    options: [
      {v: "A", t: "Minimumprinzip"},
      {v: "B", t: "Maximumprinzip"},
      {v: "C", t: "Optimumprinzip"},
      {v: "D", t: "Sparsamkeitsprinzip"}
    ],
    correct: "B",
    explain: "Hier ist der Input (125 Holzlatten) gegeben und der Output (Anzahl Tischplatten) soll maximiert werden. Das entspricht dem Maximumprinzip (auch Ergiebigkeitsprinzip genannt)."
  },
  {
    id: "g08", topic: "gueter", type: "mc", diff: 2, tax: "K3",
    q: "Sechs Tischplatten sollen aus möglichst wenigen Holzlatten fabriziert werden. Welches ökonomische Prinzip wird angewendet?",
    options: [
      {v: "A", t: "Maximumprinzip"},
      {v: "B", t: "Minimumprinzip"},
      {v: "C", t: "Optimumprinzip"},
      {v: "D", t: "Ergiebigkeitsprinzip"}
    ],
    correct: "B",
    explain: "Hier ist der Output (sechs Tischplatten) vorgegeben und der Input (Holzlatten) soll minimiert werden. Das entspricht dem Minimumprinzip (auch Sparsamkeitsprinzip genannt)."
  },
  {
    id: "g09", topic: "gueter", type: "mc", diff: 3, tax: "K3",
    q: "Ein Flughafen soll mit vertretbaren Kosten so ausgebaut werden, dass damit mehr Passagiere befördert werden können. Welches ökonomische Prinzip wird hier angewendet?",
    options: [
      {v: "A", t: "Maximumprinzip, weil mehr Passagiere befördert werden sollen"},
      {v: "B", t: "Minimumprinzip, weil die Kosten «vertretbar» sein sollen"},
      {v: "C", t: "Optimumprinzip, weil weder Input noch Output genau vorgegeben sind"},
      {v: "D", t: "Keines der ökonomischen Prinzipien"}
    ],
    correct: "C",
    explain: "Weder der zu erreichende Output (Passagierzahl) noch der verfügbare Input (Budget) sind genau vorgegeben. Es wird nach dem Optimumprinzip vorgegangen: eine Abwägung zwischen Kosten und Nutzen, um eine optimale Relation zu finden."
  },
  {
    id: "g10", topic: "gueter", type: "tf", diff: 3, tax: "K4",
    q: "Produkte und Dienstleistungen bilden zusammen die Marktleistungen eines Unternehmens.",
    correct: true,
    explain: "Richtig. Konsum- und Investitionsgüter werden unter dem Begriff «Produkte» zusammengefasst und von den Dienstleistungen unterschieden. Produkte und Dienstleistungen bilden zusammen die Marktleistungen."
  },
  {
    id: "g11", topic: "gueter", type: "mc", diff: 3, tax: "K4",
    q: "Eine Maschine in einer Fabrik wird als Investitionsgut klassifiziert. Welcher Untertyp trifft zu?",
    options: [
      {v: "A", t: "Repetierfaktor, weil die Maschine immer wieder dieselbe Aufgabe ausführt"},
      {v: "B", t: "Potenzialfaktor, weil die Maschine über längere Zeit genutzt wird und nicht im Produktionsprozess verbraucht wird"},
      {v: "C", t: "Verbrauchsgut, weil die Maschine irgendwann ersetzt werden muss"},
      {v: "D", t: "Konsumgut, weil sie dem Unternehmen dient"}
    ],
    correct: "B",
    explain: "Investitionsgüter werden in Repetierfaktoren (gehen im Produktionsprozess auf, z.B. Rohstoffe, Betriebsmittel) und Potenzialfaktoren (werden langfristig genutzt, z.B. Maschinen, Gebäude) unterteilt. Eine Maschine ist ein Potenzialfaktor."
  },

  // ============================================================
  // TOPIC: struktur – Struktur der Schweizer Wirtschaft
  // ============================================================

  {
    id: "s01", topic: "struktur", type: "mc", diff: 1, tax: "K1",
    q: "Welcher Sektor umfasst die Land- und Forstwirtschaft, den Gartenbau und die Fischerei?",
    options: [
      {v: "A", t: "1. Sektor"},
      {v: "B", t: "2. Sektor"},
      {v: "C", t: "3. Sektor"},
      {v: "D", t: "4. Sektor"}
    ],
    correct: "A",
    explain: "Der 1. Sektor (Primärsektor) umfasst die Land- und Forstwirtschaft, den Gartenbau und die Fischerei."
  },
  {
    id: "s02", topic: "struktur", type: "fill", diff: 1, tax: "K1",
    q: "Der 2. Sektor umfasst {0} und {1}. Der 3. Sektor umfasst die {2}.",
    blanks: [
      {answer: "Industrie", alts: ["die Industrie"]},
      {answer: "Gewerbe", alts: ["das Gewerbe"]},
      {answer: "Dienstleistungen", alts: ["Dienstleistungsbranche"]}
    ],
    explain: "Die drei Wirtschaftssektoren: 1. Sektor = Land-/Forstwirtschaft; 2. Sektor = Industrie und Gewerbe; 3. Sektor = Dienstleistungen."
  },
  {
    id: "s03", topic: "struktur", type: "tf", diff: 1, tax: "K2",
    q: "In der Schweiz arbeiten heute über 75% der Erwerbstätigen im 3. Sektor (Dienstleistungen).",
    correct: true,
    explain: "Richtig. Gemäss der Statistik arbeiten rund 76,7% der Erwerbstätigen im 3. Sektor. Die Schweiz ist eine typische Dienstleistungsgesellschaft."
  },
  {
    id: "s04", topic: "struktur", type: "mc", diff: 2, tax: "K2",
    q: "Wie hat sich die Verteilung der Erwerbstätigen auf die drei Sektoren in der Schweiz seit 1850 verändert?",
    options: [
      {v: "A", t: "Der 1. Sektor ist gewachsen, der 3. Sektor geschrumpft"},
      {v: "B", t: "Der 1. Sektor ist stark geschrumpft, der 3. Sektor stark gewachsen"},
      {v: "C", t: "Alle drei Sektoren sind etwa gleich geblieben"},
      {v: "D", t: "Nur der 2. Sektor hat sich verändert"}
    ],
    correct: "B",
    explain: "Seit 1850 hat ein massiver Strukturwandel stattgefunden: Der 1. Sektor (Landwirtschaft) ist von über 50% auf ca. 2,6% geschrumpft. Der 3. Sektor (Dienstleistungen) ist auf ca. 76,7% gewachsen. Der 2. Sektor (Industrie) lag zwischenzeitlich hoch und liegt heute bei ca. 20,7%."
  },
  {
    id: "s05", topic: "struktur", type: "mc", diff: 2, tax: "K2",
    q: "Welche Branche hat in der Schweiz den höchsten monatlichen Medianlohn (Bruttolohn)?",
    options: [
      {v: "A", t: "IT und Kommunikation"},
      {v: "B", t: "Finanz- und Versicherungsgewerbe"},
      {v: "C", t: "Erziehung und Unterricht"},
      {v: "D", t: "Gesundheits- und Sozialwesen"}
    ],
    correct: "B",
    explain: "Gemäss der Schweizerischen Lohnstrukturerhebung hat das Finanz- und Versicherungsgewerbe mit CHF 9'630 den höchsten Medianlohn, gefolgt von IT und Kommunikation (CHF 8'724) sowie Erziehung und Unterricht (CHF 8'494)."
  },
  {
    id: "s06", topic: "struktur", type: "multi", diff: 2, tax: "K2",
    q: "Welche Aussagen zur Unternehmensstruktur der Schweiz sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Über 99% der Unternehmen sind KMU (Mikro-, Klein- und Mittelunternehmen)"},
      {v: "B", t: "Grossunternehmen beschäftigen knapp ein Drittel der Erwerbstätigen"},
      {v: "C", t: "Es gibt in der Schweiz rund 617'700 Arbeitsstätten"},
      {v: "D", t: "Die meisten Unternehmen sind Grossunternehmen mit über 250 Mitarbeitenden"}
    ],
    correct: ["A", "B", "C"],
    explain: "99,7% der marktwirtschaftlichen Unternehmen sind KMU (bis 249 Vollzeitstellen). Grossunternehmen (ca. 1'706) beschäftigen mit ca. 1,5 Mio. Personen knapp ein Drittel aller Erwerbstätigen. Die Schweiz hat rund 617'700 Arbeitsstätten."
  },
  {
    id: "s07", topic: "struktur", type: "mc", diff: 3, tax: "K4",
    q: "Die Mammut Sports Group AG produziert Outdoor-Bekleidung und Sportgeräte. Welchem Sektor gehört das Unternehmen an?",
    options: [
      {v: "A", t: "1. Sektor, weil Rohstoffe verwendet werden"},
      {v: "B", t: "2. Sektor, weil Produkte hergestellt werden (Verarbeitung und Fabrikation)"},
      {v: "C", t: "3. Sektor, weil die Produkte an Konsumenten verkauft werden"},
      {v: "D", t: "Allen drei Sektoren gleichzeitig"}
    ],
    correct: "B",
    explain: "Die Mammut Sports Group AG ist dem 2. Sektor (Verarbeitung und Fabrikation) zuzuordnen. Obwohl das Unternehmen auch Produkte verkauft, ist die Herstellung von Bekleidung und Sportgeräten das Kerngeschäft, was der Branche «Herstellung von Bekleidung und Sportgeräten» entspricht."
  },
  {
    id: "s08", topic: "struktur", type: "mc", diff: 3, tax: "K4",
    q: "In welcher Grossregion der Schweiz gibt es am meisten Unternehmen?",
    options: [
      {v: "A", t: "Zürich"},
      {v: "B", t: "Genferseeregion"},
      {v: "C", t: "Espace Mittelland"},
      {v: "D", t: "Nordwestschweiz"}
    ],
    correct: "C",
    explain: "Der Espace Mittelland hat mit 120'971 Unternehmen die meisten Unternehmen, knapp vor der Genferseeregion (115'242) und Zürich (105'835). Dies ist auch durch die grosse Fläche und Bevölkerung dieser Region bedingt."
  },
  {
    id: "s09", topic: "struktur", type: "tf", diff: 3, tax: "K5",
    q: "Die Tatsache, dass der Frauenanteil im Baugewerbe bei nur 11,7% liegt, kann als Indiz für bestehende Geschlechterstereotypen bei der Berufswahl interpretiert werden.",
    correct: true,
    explain: "Richtig. Der sehr niedrige Frauenanteil in Branchen wie Baugewerbe (11,7%) und Maschinenbau (17,3%) sowie der hohe Anteil in Pflege und Erziehung (über 60%) weisen auf geschlechterspezifische Berufswahlmuster hin, die durch gesellschaftliche Normen und Stereotypen mitgeprägt werden."
  },

  // ============================================================
  // TOPIC: unternehmen – Kriterien zur Unterscheidung
  // ============================================================

  {
    id: "u01", topic: "unternehmen", type: "mc", diff: 1, tax: "K1",
    q: "Ab wie vielen Vollzeitstellen gilt ein Unternehmen in der Schweiz als Grossunternehmen?",
    options: [
      {v: "A", t: "Ab 50 Vollzeitstellen"},
      {v: "B", t: "Ab 100 Vollzeitstellen"},
      {v: "C", t: "Ab 250 Vollzeitstellen"},
      {v: "D", t: "Ab 500 Vollzeitstellen"}
    ],
    correct: "C",
    explain: "Die Grössenklassen: Mikrounternehmen (0–9), Kleinunternehmen (10–49), Mittelunternehmen (50–249), Grossunternehmen (250 und mehr Vollzeitstellen)."
  },
  {
    id: "u02", topic: "unternehmen", type: "fill", diff: 1, tax: "K1",
    q: "Unternehmen mit 0 bis 9 Vollzeitstellen werden als {0} bezeichnet. Zusammen mit Klein- und Mittelunternehmen bilden sie die Gruppe der {1}.",
    blanks: [
      {answer: "Mikrounternehmen", alts: ["Mikro-Unternehmen"]},
      {answer: "KMU", alts: ["Klein- und Mittelunternehmen"]}
    ],
    explain: "Mikrounternehmen (0–9 Vollzeitstellen), Kleinunternehmen (10–49) und Mittelunternehmen (50–249) bilden zusammen die KMU (Klein- und Mittelunternehmen). Sie machen 99,7% aller Unternehmen in der Schweiz aus."
  },
  {
    id: "u03", topic: "unternehmen", type: "mc", diff: 1, tax: "K2",
    q: "Welche Rechtsform ist in der Schweiz am häufigsten?",
    options: [
      {v: "A", t: "Aktiengesellschaft (AG)"},
      {v: "B", t: "GmbH"},
      {v: "C", t: "Einzelunternehmung"},
      {v: "D", t: "Kollektivgesellschaft"}
    ],
    correct: "C",
    explain: "Die Einzelunternehmung ist mit 166'658 Firmen die in der Schweiz am häufigsten vorkommende Rechtsform, noch vor der GmbH (231'250) und der AG (229'736) (Stand 2022). Hinweis: Die Zahlen zeigen, dass es sich knapp um die Einzelunternehmung handelt."
  },
  {
    id: "u04", topic: "unternehmen", type: "multi", diff: 2, tax: "K2",
    q: "Nach welchen Kriterien können Unternehmen unterschieden werden? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Sektor und Branche"},
      {v: "B", t: "Eigentumsverhältnisse und Gewinnorientierung"},
      {v: "C", t: "Grösse und Reichweite der Tätigkeit"},
      {v: "D", t: "Rechtsform"}
    ],
    correct: ["A", "B", "C", "D"],
    explain: "Unternehmen lassen sich nach allen genannten Kriterien unterscheiden: Sektor/Branche (Tätigkeitsgebiet), Eigentumsverhältnisse (privat/öffentlich/gemischt), Gewinnorientierung (gewinnorientiert/NPO), Grösse (Mikro bis Gross), Reichweite (lokal bis international) und Rechtsform."
  },
  {
    id: "u05", topic: "unternehmen", type: "mc", diff: 2, tax: "K2",
    q: "Was kennzeichnet eine Non-Profit-Organisation (NPO)?",
    options: [
      {v: "A", t: "Sie macht grundsätzlich keinen Umsatz"},
      {v: "B", t: "Die Gewinnerzielung steht nicht im Vordergrund, sondern spezielle Bedürfnisbefriedigung"},
      {v: "C", t: "Sie darf kein Personal anstellen"},
      {v: "D", t: "Sie gehört immer dem Staat"}
    ],
    correct: "B",
    explain: "Bei NPOs steht nicht die Gewinnerzielung im Vordergrund, sondern gemeinnützige, soziale, kulturelle oder wissenschaftliche Ziele. Beispiele sind die Schweizerische Rettungsflugwacht Rega oder die Krebsliga Schweiz. NPOs können durchaus Umsatz und Überschüsse erzielen."
  },
  {
    id: "u06", topic: "unternehmen", type: "tf", diff: 2, tax: "K2",
    q: "Die Swisscom ist ein Beispiel für ein gemischtwirtschaftliches Unternehmen, weil sowohl der Staat als auch Private am Unternehmen beteiligt sind.",
    correct: true,
    explain: "Richtig. Bei gemischtwirtschaftlichen Unternehmen sind sowohl der Staat als auch Private beteiligt. Die Swisscom ist ein typisches Beispiel: Der Bund hält eine Mehrheitsbeteiligung, aber auch private Aktionäre sind beteiligt."
  },
  {
    id: "u07", topic: "unternehmen", type: "mc", diff: 2, tax: "K2",
    q: "Ein Unternehmen, das in mehreren Ländern produziert und seine Produkte weltweit vertreibt, hat welche Reichweite?",
    options: [
      {v: "A", t: "Lokale Tätigkeit"},
      {v: "B", t: "Regionale Tätigkeit"},
      {v: "C", t: "Nationale Tätigkeit"},
      {v: "D", t: "Internationale Tätigkeit"}
    ],
    correct: "D",
    explain: "Ein Unternehmen mit Produktion und Vertrieb in mehreren Ländern hat eine internationale Tätigkeit. Beispiele sind Nestlé oder die Mammut Sports Group AG."
  },
  {
    id: "u08", topic: "unternehmen", type: "mc", diff: 3, tax: "K4",
    q: "Drei Freundinnen haben einen Impfstoff entwickelt und wollen ein Unternehmen gründen. Sie wünschen sich beschränkte Haftung, geringes Mindestkapital und aktive Mitarbeit aller Gesellschafterinnen. Welche Rechtsform passt am besten?",
    options: [
      {v: "A", t: "Einzelunternehmung"},
      {v: "B", t: "Kollektivgesellschaft"},
      {v: "C", t: "Aktiengesellschaft (AG)"},
      {v: "D", t: "Gesellschaft mit beschränkter Haftung (GmbH)"}
    ],
    correct: "D",
    explain: "Die GmbH bietet beschränkte Haftung (nur Gesellschaftsvermögen haftet), erfordert geringes Mindestkapital (CHF 20'000) und ist besonders geeignet für kleinere, personenbezogene Unternehmen mit aktiver Mitarbeit der Gesellschafterinnen. Eine Einzelunternehmung scheidet aus (3 Personen), eine KollG hat unbeschränkte Haftung, und eine AG erfordert höheres Kapital (CHF 100'000)."
  },
  {
    id: "u09", topic: "unternehmen", type: "tf", diff: 3, tax: "K4",
    q: "Bei einer Kollektivgesellschaft haften die Gesellschafter primär mit dem Gesellschaftsvermögen. Reicht dieses nicht aus, haften sie subsidiär, unbeschränkt und solidarisch mit ihrem persönlichen Vermögen.",
    correct: true,
    explain: "Richtig. Bei der Kollektivgesellschaft haftet primär das Gesellschaftsvermögen. Subsidiär (ergänzend) haften die Gesellschafter unbeschränkt und solidarisch mit ihrem gesamten persönlichen Vermögen – ein wesentlicher Nachteil dieser Rechtsform."
  },
  {
    id: "u10", topic: "unternehmen", type: "multi", diff: 3, tax: "K4",
    q: "Welche Vorteile bietet die Aktiengesellschaft (AG)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Beschränkte Haftung auf das Gesellschaftsvermögen"},
      {v: "B", t: "Einfache Übertragung von Anteilen"},
      {v: "C", t: "Anonymität der Aktionäre"},
      {v: "D", t: "Keine Gründungskosten"}
    ],
    correct: ["A", "B", "C"],
    explain: "Die AG bietet beschränkte Haftung (nur das Gesellschaftsvermögen haftet), einfache Anteilsübertragung (Aktien können verkauft werden) und Anonymität der Aktionäre. Allerdings fallen bei der Gründung Kosten an und das Mindestkapital beträgt CHF 100'000."
  },

  // ============================================================
  // TOPIC: ziele – Unternehmensziele & Zielbeziehungen
  // ============================================================

  {
    id: "z01", topic: "ziele", type: "mc", diff: 1, tax: "K1",
    q: "Was ist das Kernziel, das ein Unternehmen langfristig verfolgen muss, um am Markt zu bestehen?",
    options: [
      {v: "A", t: "Möglichst viele Mitarbeitende anstellen"},
      {v: "B", t: "Eine nachhaltige und marktgerechte Rentabilität erwirtschaften"},
      {v: "C", t: "Möglichst viele Produkte herstellen"},
      {v: "D", t: "Den Umsatz jedes Jahr verdoppeln"}
    ],
    correct: "B",
    explain: "Das Kernziel eines Unternehmens ist die Erwirtschaftung einer nachhaltigen und marktgerechten Rentabilität. Nur wenn der Ertrag langfristig grösser ist als der Aufwand, kann ein Unternehmen bestehen."
  },
  {
    id: "z02", topic: "ziele", type: "fill", diff: 1, tax: "K1",
    q: "SMART steht für: {0}, Measurable, {1}, Relevant, {2}.",
    blanks: [
      {answer: "Specific", alts: ["Spezifisch"]},
      {answer: "Achievable", alts: ["Erreichbar", "Attainable"]},
      {answer: "Time-bound", alts: ["Terminiert", "Time bound", "Timebound"]}
    ],
    explain: "SMART ist eine Systematik zur Zielformulierung: Specific (spezifisch), Measurable (messbar), Achievable (erreichbar), Relevant (sachbezogen), Time-bound (terminiert)."
  },
  {
    id: "z03", topic: "ziele", type: "mc", diff: 1, tax: "K2",
    q: "Was bedeutet das «M» in der SMART-Systematik?",
    options: [
      {v: "A", t: "Ziele müssen motivierend sein"},
      {v: "B", t: "Ziele müssen messbar sein"},
      {v: "C", t: "Ziele müssen minimal sein"},
      {v: "D", t: "Ziele müssen mehrheitsfähig sein"}
    ],
    correct: "B",
    explain: "Das «M» steht für Measurable (messbar). Ziele müssen so formuliert sein, dass ihre Erreichung überprüft werden kann – z.B. durch Kennzahlen, Mengen oder Zeitangaben."
  },
  {
    id: "z04", topic: "ziele", type: "mc", diff: 2, tax: "K2",
    q: "Ein Unternehmen will seinen Ausschuss senken und gleichzeitig die Kosten reduzieren. Durch die Reduktion des Ausschusses werden automatisch auch Kosten gesenkt. Welche Zielbeziehung liegt vor?",
    options: [
      {v: "A", t: "Zielkonkurrenz"},
      {v: "B", t: "Zielharmonie"},
      {v: "C", t: "Zielneutralität"},
      {v: "D", t: "Zielindifferenz"}
    ],
    correct: "B",
    explain: "Es liegt Zielharmonie vor: Das Erreichen des einen Ziels (Ausschuss senken) fördert automatisch das andere Ziel (Kosten senken), da weniger fehlerhafte Produkte auch weniger Kosten verursachen."
  },
  {
    id: "z05", topic: "ziele", type: "mc", diff: 2, tax: "K2",
    q: "Ein Unternehmen will eine hohe Lieferbereitschaft garantieren, aber gleichzeitig die Lagerhaltungskosten senken. Welche Zielbeziehung besteht?",
    options: [
      {v: "A", t: "Zielharmonie"},
      {v: "B", t: "Zielneutralität"},
      {v: "C", t: "Zielkonkurrenz"},
      {v: "D", t: "Zielidentität"}
    ],
    correct: "C",
    explain: "Es liegt Zielkonkurrenz vor: Um schnell liefern zu können, muss das Unternehmen grosse Lagerbestände halten. Grosse Lagerbestände bedeuten aber hohe Lagerhaltungskosten. Die beiden Ziele stehen in einem Spannungsverhältnis."
  },
  {
    id: "z06", topic: "ziele", type: "tf", diff: 2, tax: "K2",
    q: "Strategische Ziele sind langfristige Unternehmensziele mit einem Zeithorizont von über 3 Jahren.",
    correct: true,
    explain: "Richtig. Strategische Ziele haben einen Zeithorizont von über 3 Jahren (z.B. neue Märkte erschliessen). Mittelfristige Ziele umfassen 1–3 Jahre, operative Ziele weniger als 1 Jahr (z.B. Quartalsziele)."
  },
  {
    id: "z07", topic: "ziele", type: "multi", diff: 3, tax: "K3",
    q: "Welches der folgenden Ziele ist SMART formuliert? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Wir wollen den Umsatz bis Ende 2026 um 10% steigern"},
      {v: "B", t: "Wir wollen besser werden"},
      {v: "C", t: "Die Kundenzufriedenheit soll bis Q2 2026 von 7,5 auf 8,5 (auf einer Skala von 10) steigen"},
      {v: "D", t: "Wir sollten irgendwann mehr Gewinn machen"}
    ],
    correct: ["A", "C"],
    explain: "Ziel A ist SMART: spezifisch (Umsatz), messbar (10%), erreichbar, relevant, terminiert (Ende 2026). Ziel C ebenso: spezifisch (Kundenzufriedenheit), messbar (7,5→8,5), terminiert (Q2 2026). Ziele B und D sind zu vage formuliert – sie sind weder spezifisch noch messbar oder terminiert."
  },
  {
    id: "z08", topic: "ziele", type: "mc", diff: 3, tax: "K4",
    q: "Ein Unternehmen erneuert seine alte Lastwagenflotte aus Umweltschutzgründen und will gleichzeitig eine hohe Produktqualität sicherstellen. Die Erneuerung der Flotte hat keinen Einfluss auf die Produktqualität. Welche Zielbeziehung liegt vor?",
    options: [
      {v: "A", t: "Zielharmonie"},
      {v: "B", t: "Zielkonkurrenz"},
      {v: "C", t: "Zielneutralität"},
      {v: "D", t: "Zielkomplementarität"}
    ],
    correct: "C",
    explain: "Es liegt Zielneutralität vor: Das Erreichen des einen Ziels (Erneuerung der Lastwagenflotte) hat keinen Einfluss auf das andere Ziel (Produktqualität). Die beiden Ziele berühren sich nicht."
  },

  // ============================================================
  // TOPIC: kennzahlen – Kennzahlen
  // ============================================================

  {
    id: "k01", topic: "kennzahlen", type: "fill", diff: 1, tax: "K1",
    q: "Produktivität = {0} (Menge) / {1} (Menge)",
    blanks: [
      {answer: "Output", alts: ["Ausbringungsmenge", "Ertrag"]},
      {answer: "Input", alts: ["Einsatzmenge", "Aufwand"]}
    ],
    explain: "Produktivität bezeichnet das Verhältnis zwischen produzierten Gütern (Output) und den dafür eingesetzten Produktionsfaktoren (Input), jeweils in Mengeneinheiten gemessen."
  },
  {
    id: "k02", topic: "kennzahlen", type: "mc", diff: 1, tax: "K1",
    q: "Welche Kennzahl setzt den Gewinn ins Verhältnis zum eingesetzten Kapital?",
    options: [
      {v: "A", t: "Produktivität"},
      {v: "B", t: "Wirtschaftlichkeit"},
      {v: "C", t: "Rentabilität"},
      {v: "D", t: "Liquidität"}
    ],
    correct: "C",
    explain: "Die Rentabilität setzt den Gewinn ins Verhältnis zum eingesetzten Kapital (Rentabilität = Gewinn / Kapital × 100). Sie zeigt, wie effizient das Kapital eingesetzt wurde."
  },
  {
    id: "k03", topic: "kennzahlen", type: "mc", diff: 2, tax: "K2",
    q: "Wie ergibt sich die Wirtschaftlichkeit aus der Produktivität?",
    options: [
      {v: "A", t: "Outputmenge × Verkaufspreis / Inputmenge × Einkaufspreis"},
      {v: "B", t: "Outputmenge / Inputmenge × Steuersatz"},
      {v: "C", t: "Gewinn / Gesamtkapital × 100"},
      {v: "D", t: "Umsatz / Anzahl Mitarbeitende"}
    ],
    correct: "A",
    explain: "Die Wirtschaftlichkeit ergibt sich, indem die Outputmenge mit dem Verkaufspreis und die Inputmenge mit dem Einkaufspreis multipliziert wird: (Output × Verkaufspreis) / (Input × Einkaufspreis) = Ertrag / Aufwand. So werden verschiedene Produktivitäten monetär vergleichbar."
  },
  {
    id: "k04", topic: "kennzahlen", type: "calc", diff: 2, tax: "K3",
    q: "Ein Möbelschreiner stellt in 8 Stunden 4 Stühle her. Wie hoch ist seine Arbeitsproduktivität (in Stühle pro Stunde)?",
    rows: [
      {label: "Arbeitsproduktivität", answer: 0.5, tolerance: 0.01, unit: "Stühle/h"}
    ],
    explain: "Arbeitsproduktivität = Output / Input = 4 Stühle / 8 Stunden = 0,5 Stühle pro Stunde."
  },
  {
    id: "k05", topic: "kennzahlen", type: "calc", diff: 2, tax: "K3",
    q: "Ein Unternehmen erzielt einen Gewinn von CHF 150'000 bei einem Eigenkapital von CHF 1'000'000. Wie hoch ist die Eigenkapitalrentabilität (in %)?",
    rows: [
      {label: "Eigenkapitalrentabilität", answer: 15, tolerance: 0.5, unit: "%"}
    ],
    explain: "Eigenkapitalrentabilität = Gewinn / Eigenkapital × 100 = 150'000 / 1'000'000 × 100 = 15%."
  },
  {
    id: "k06", topic: "kennzahlen", type: "calc", diff: 3, tax: "K3",
    q: "Ein Unternehmen hat einen Ertrag von CHF 800'000 und einen Aufwand von CHF 600'000. Wie hoch ist die Wirtschaftlichkeit?",
    rows: [
      {label: "Wirtschaftlichkeit", answer: 1.33, tolerance: 0.02, unit: ""}
    ],
    explain: "Wirtschaftlichkeit = Ertrag / Aufwand = 800'000 / 600'000 = 1,33. Ein Wert über 1 bedeutet, dass das Unternehmen wirtschaftlich arbeitet (mehr einnimmt als ausgibt)."
  },
  {
    id: "k07", topic: "kennzahlen", type: "mc", diff: 2, tax: "K2",
    q: "Ein Unternehmen hat eine Wirtschaftlichkeit von 0,85. Was bedeutet das?",
    options: [
      {v: "A", t: "Das Unternehmen arbeitet mit Gewinn"},
      {v: "B", t: "Das Unternehmen arbeitet mit Verlust, da der Aufwand grösser ist als der Ertrag"},
      {v: "C", t: "Das Unternehmen ist sehr produktiv"},
      {v: "D", t: "Das Unternehmen hat eine hohe Rentabilität"}
    ],
    correct: "B",
    explain: "Eine Wirtschaftlichkeit unter 1 (hier 0,85) bedeutet, dass der Aufwand grösser ist als der Ertrag – das Unternehmen arbeitet also mit Verlust. Wirtschaftlichkeit = Ertrag / Aufwand."
  },
  {
    id: "k08", topic: "kennzahlen", type: "tf", diff: 1, tax: "K2",
    q: "Produktivität wird in Mengeneinheiten gemessen, Wirtschaftlichkeit in Geldeinheiten.",
    correct: true,
    explain: "Richtig. Produktivität setzt Mengen ins Verhältnis (z.B. Stühle pro Arbeitsstunde), während die Wirtschaftlichkeit die monetäre Bewertung darstellt (Ertrag in CHF / Aufwand in CHF)."
  },
  {
    id: "k09", topic: "kennzahlen", type: "calc", diff: 3, tax: "K3",
    q: "Ein Unternehmen erzielt einen Gewinn von CHF 200'000 und zahlt CHF 50'000 an Fremdkapitalzinsen. Das Gesamtkapital beträgt CHF 2'500'000. Wie hoch ist die Gesamtkapitalrentabilität (in %)?",
    rows: [
      {label: "Gesamtkapitalrentabilität", answer: 10, tolerance: 0.5, unit: "%"}
    ],
    explain: "Gesamtkapitalrentabilität = (Gewinn + Zinsen) / Gesamtkapital × 100 = (200'000 + 50'000) / 2'500'000 × 100 = 250'000 / 2'500'000 × 100 = 10%."
  },
  {
    id: "k10", topic: "kennzahlen", type: "multi", diff: 3, tax: "K4",
    q: "Welche Aussagen zur Beziehung zwischen Produktivität, Wirtschaftlichkeit und Rentabilität sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Eine hohe Wirtschaftlichkeit ist eine wichtige Voraussetzung für eine gute Rentabilität"},
      {v: "B", t: "Produktivität allein sagt noch nichts über die Wirtschaftlichkeit aus, weil die Preise fehlen"},
      {v: "C", t: "Die Rentabilität ist immer höher als die Wirtschaftlichkeit"},
      {v: "D", t: "Alle drei Kennzahlen messen dasselbe, nur in unterschiedlichen Einheiten"}
    ],
    correct: ["A", "B"],
    explain: "A ist korrekt: Wirtschaftlichkeit (Ertrag > Aufwand) schafft die Basis für Rentabilität. B ist korrekt: Produktivität ist ein Mengenverhältnis – erst durch Multiplikation mit Preisen ergibt sich die monetäre Wirtschaftlichkeit. C ist falsch: Die Kennzahlen sind nicht direkt vergleichbar. D ist falsch: Sie messen verschiedene Aspekte der Unternehmensleistung."
  },

  // ============================================================
  // TOPIC: standort – Standortfaktoren & Nutzwertanalyse
  // ============================================================

  {
    id: "t01", topic: "standort", type: "mc", diff: 1, tax: "K1",
    q: "Was versteht man unter einem Standortfaktor?",
    options: [
      {v: "A", t: "Den Gewinn eines Unternehmens am Standort"},
      {v: "B", t: "Ein Kriterium, das die Standortwahl eines Unternehmens beeinflusst"},
      {v: "C", t: "Die Anzahl Mitarbeitende an einem Standort"},
      {v: "D", t: "Die Rechtsform des Unternehmens"}
    ],
    correct: "B",
    explain: "Ein Standortfaktor ist ein Kriterium, das bei der Wahl des Unternehmensstandorts eine Rolle spielt. Je nach Unternehmensart können unterschiedliche Standortfaktoren ausschlaggebend sein."
  },
  {
    id: "t02", topic: "standort", type: "multi", diff: 1, tax: "K1",
    q: "Welche der folgenden sind Standortfaktoren? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Absatzorientierte Faktoren (Nähe zur Kundschaft)"},
      {v: "B", t: "Verkehrsorientierte Faktoren (Verkehrsanbindung)"},
      {v: "C", t: "Die Lieblingsfarbe des Geschäftsführers"},
      {v: "D", t: "Infrastrukturorientierte Faktoren (Strassennetz, Stromversorgung)"}
    ],
    correct: ["A", "B", "D"],
    explain: "Absatzorientierte, verkehrsorientierte und infrastrukturorientierte Faktoren sind anerkannte Standortfaktoren. Persönliche Vorlieben wie eine Lieblingsfarbe sind keine Standortfaktoren."
  },
  {
    id: "t03", topic: "standort", type: "mc", diff: 2, tax: "K2",
    q: "Für welchen Unternehmenstyp sind absatzorientierte Standortfaktoren (Nähe zur Kundschaft) besonders wichtig?",
    options: [
      {v: "A", t: "Bergbauunternehmen"},
      {v: "B", t: "Softwareentwickler mit Home-Office"},
      {v: "C", t: "Detailhandelsgeschäft oder Restaurant"},
      {v: "D", t: "Fabrik für Grossmaschinen"}
    ],
    correct: "C",
    explain: "Für Detailhandelsgeschäfte, Restaurants, Hotels und ähnliche Betriebe ist die Nähe zur Kundschaft entscheidend. Banken, Hotels und Handwerkerbetriebe sind weitere Beispiele, bei denen absatzorientierte Standortfaktoren im Vordergrund stehen."
  },
  {
    id: "t04", topic: "standort", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter einer Nutzwertanalyse (NWA)?",
    options: [
      {v: "A", t: "Eine Methode, um den Gewinn verschiedener Standorte zu berechnen"},
      {v: "B", t: "Ein Instrument, bei dem Standorte anhand gewichteter Kriterien bewertet und verglichen werden"},
      {v: "C", t: "Eine Analyse der Kundennachfrage am Standort"},
      {v: "D", t: "Ein Verfahren zur Berechnung der Mietkosten"}
    ],
    correct: "B",
    img: {src: "img/bwl/einfuehrung/einfuehrung_nwa_01.svg", alt: "Schematische Darstellung einer Nutzwertanalyse mit Kriterien, Gewichtung und Bewertung"},
    explain: "Die Nutzwertanalyse ist ein Entscheidungsinstrument, bei dem gemeinsame Faktoren definiert, gewichtet (total 100%) und je Standort bewertet (z.B. 1–6) werden. Der Standort mit der höchsten Punktzahl erhält den Zuschlag."
  },
  {
    id: "t05", topic: "standort", type: "tf", diff: 2, tax: "K2",
    q: "Bei einer Nutzwertanalyse muss die Summe aller Gewichtungen 100% ergeben.",
    correct: true,
    explain: "Richtig. Die Gewichtungen der Kriterien müssen in der Summe genau 100% (bzw. 100 Punkte) ergeben. So wird sichergestellt, dass die Kriterien im Verhältnis zueinander stehen."
  },
  {
    id: "t06", topic: "standort", type: "mc", diff: 2, tax: "K2",
    q: "Warum werden bei arbeitsintensiver Produktion die Arbeitskosten als besonders wichtiger Standortfaktor betrachtet?",
    options: [
      {v: "A", t: "Weil die Schweiz keine Arbeitskräfte hat"},
      {v: "B", t: "Weil bei wenig Know-how-Anforderung die Kosten der Arbeitskräfte ein ausschlaggebender Faktor sind und günstigere Standorte im Ausland attraktiv werden"},
      {v: "C", t: "Weil Maschinen immer günstiger sind als Menschen"},
      {v: "D", t: "Weil der Staat die Löhne festlegt"}
    ],
    correct: "B",
    explain: "Bei arbeitsintensiver Produktion mit wenig Know-how-Anforderung (z.B. Bekleidungsindustrie) sind die Arbeitskosten der ausschlaggebende Standortfaktor. Da die Schweiz hohe Lohn- und Lohnnebenkosten hat, werden Produktionsstätten häufig ins Ausland verlagert."
  },
  {
    id: "t07", topic: "standort", type: "calc", diff: 3, tax: "K3",
    q: "In einer Nutzwertanalyse wird das Kriterium «Kundenfrequenz» mit 40% gewichtet und der Standort «Bahnhof» erhält die Bewertung 5 (von 6). Wie viele Nutzwertpunkte ergibt das für dieses Kriterium?",
    rows: [
      {label: "Nutzwertpunkte", answer: 200, tolerance: 1, unit: "Punkte"}
    ],
    explain: "Nutzwert = Gewichtung × Bewertung = 40 × 5 = 200 Punkte. Die Gewichtung wird als ganze Zahl (40 statt 0,4) mit der Bewertung multipliziert."
  },
  {
    id: "t08", topic: "standort", type: "multi", diff: 3, tax: "K4",
    q: "Welche Schwächen hat die Nutzwertanalyse? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die Bewertung hängt stark vom Entscheidungsträger und seinen persönlichen Vorlieben ab"},
      {v: "B", t: "Die Vergleichbarkeit der Standorte ist nicht in jedem Fall gegeben"},
      {v: "C", t: "Bei mehreren Entscheidungsträgern kann die Einigung auf Gewichtungen schwierig sein"},
      {v: "D", t: "Sie liefert grundsätzlich falsche Ergebnisse"}
    ],
    correct: ["A", "B", "C"],
    explain: "Die NWA hat mehrere Schwächen: Die Bewertung ist subjektiv (persönliche Vorlieben), die Vergleichbarkeit ist nicht immer gegeben, und die Einigung auf Gewichtungen kann bei mehreren Personen schwierig sein. Trotzdem ist sie ein wertvolles Instrument – sie liefert nicht grundsätzlich falsche Ergebnisse, sondern hilft, den Entscheid zu objektivieren."
  },
  {
    id: "t09", topic: "standort", type: "mc", diff: 3, tax: "K4",
    q: "Welche Standortfaktoren stehen bei einem Chemieunternehmen im Vordergrund?",
    options: [
      {v: "A", t: "Absatzorientierte Faktoren und Standortimage"},
      {v: "B", t: "Umweltorientierte und material-/rohstofforientierte Faktoren"},
      {v: "C", t: "Nur grundstückorientierte Faktoren"},
      {v: "D", t: "Ausschliesslich interkantonale Steuerfaktoren"}
    ],
    correct: "B",
    explain: "Für ein Chemieunternehmen sind umweltorientierte Faktoren (strenge Umweltauflagen für Abgaswerte, Abwasser) und material-/rohstofforientierte Faktoren (Zugang zu Rohstoffen, Transportkosten) besonders relevant. Auch verkehrsorientierte und infrastrukturorientierte Faktoren spielen eine Rolle."
  },
  {
    id: "t10", topic: "standort", type: "tf", diff: 1, tax: "K2",
    q: "Den idealen Standort gibt es in der Regel nicht – Unternehmen müssen Kompromisse eingehen.",
    correct: true,
    explain: "Richtig. Kein Standort erfüllt alle Kriterien perfekt. Unternehmen müssen abwägen, welche Standortfaktoren für sie am wichtigsten sind, und entsprechende Kompromisse eingehen."
  }
];
