// ============================================================
// Pool: Rechtsquellen und Rechtsgrundsätze (ZGB Einleitungsartikel)
// Fachbereich: Recht
// Stufe: SF GYM1–GYM2
// ============================================================

window.POOL_META = {
  title: "Rechtsquellen und Rechtsgrundsätze – ZGB Einleitungsartikel",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM1–GYM2"
};

window.TOPICS = {
  "rechtsquellen":    {label: "Rechtsquellen (Art. 1 ZGB)", short: "Rechtsquellen"},
  "treu_glauben":     {label: "Handeln nach Treu und Glauben (Art. 2 Abs. 1 ZGB)", short: "Treu & Glauben"},
  "rechtsmissbrauch": {label: "Rechtsmissbrauchsverbot (Art. 2 Abs. 2 ZGB)", short: "Rechtsmissbrauch"},
  "guter_glaube":     {label: "Der gute Glaube (Art. 3 ZGB)", short: "Guter Glaube"},
  "beweislast":       {label: "Die Beweislast (Art. 8 ZGB)", short: "Beweislast"},
  "weitere":          {label: "Weitere Rechtsgrundsätze", short: "Weitere"}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: rechtsquellen (Art. 1 ZGB)
  // ============================================================

  // --- diff 1 ---
  {
    id: "r01", topic: "rechtsquellen", type: "mc", diff: 1, tax: "K1",
    q: "Welcher Artikel des ZGB nennt die Rechtsquellen, auf die sich ein Gericht stützt?",
    options: [
      {v: "A", t: "Art. 1 ZGB"},
      {v: "B", t: "Art. 2 ZGB"},
      {v: "C", t: "Art. 8 ZGB"},
      {v: "D", t: "Art. 3 ZGB"}
    ],
    correct: "A",
    explain: "Art. 1 ZGB ist der zentrale Einleitungsartikel, der die Rechtsquellen aufzählt: geschriebenes Recht, Gewohnheitsrecht und – bei Lücken – die richterliche Rechtsfindung."
  },
  {
    id: "r02", topic: "rechtsquellen", type: "fill", diff: 1, tax: "K1",
    q: "Das geschriebene Recht umfasst drei hierarchische Stufen: {0}, {1} und {2}.",
    img: {src: "img/recht/einleitungsartikel/einleitungsartikel_normenpyramide_01.svg", alt: "Normenpyramide mit drei Stufen des geschriebenen Rechts"},
    blanks: [
      {answer: "Verfassung", alts: ["Bundesverfassung", "BV"]},
      {answer: "Gesetz", alts: ["Gesetze"]},
      {answer: "Verordnung", alts: ["Verordnungen"]}
    ],
    explain: "Die drei Stufen des geschriebenen Rechts sind hierarchisch geordnet: Die Verfassung steht zuoberst, darunter folgen die Gesetze und zuunterst die Verordnungen."
  },
  {
    id: "r03", topic: "rechtsquellen", type: "tf", diff: 1, tax: "K1",
    q: "Verordnungen werden von der Regierung (Bundesrat) erlassen.",
    correct: true,
    explain: "Verordnungen werden in der Regel von der Regierung (Exekutive) erlassen, also auf Bundesebene vom Bundesrat. Sie können jederzeit – ohne Mitwirkung des Parlaments oder des Volkes – erlassen, abgeändert oder aufgehoben werden."
  },
  {
    id: "r04", topic: "rechtsquellen", type: "mc", diff: 1, tax: "K1",
    q: "Wer muss einer Änderung der Bundesverfassung zustimmen?",
    options: [
      {v: "A", t: "Der Bundesrat allein"},
      {v: "B", t: "Das Parlament allein"},
      {v: "C", t: "Volk und Stände (Kantone)"},
      {v: "D", t: "Das Bundesgericht"}
    ],
    correct: "C",
    explain: "Verfassungsänderungen unterliegen dem obligatorischen Referendum und benötigen die Zustimmung der Mehrheit des Volkes und der Stände (Kantone)."
  },

  // --- diff 2 ---
  {
    id: "r05", topic: "rechtsquellen", type: "mc", diff: 2, tax: "K2",
    q: "Was versteht man unter Gewohnheitsrecht?",
    options: [
      {v: "A", t: "Gesetze, die schon sehr alt sind"},
      {v: "B", t: "Althergebrachte, lang geübte Bräuche, die als allgemein verbindlich anerkannt werden"},
      {v: "C", t: "Regeln, die vom Bundesrat gewohnheitsmässig erlassen werden"},
      {v: "D", t: "Gerichtsentscheide, die zur Gewohnheit geworden sind"}
    ],
    correct: "B",
    explain: "Gewohnheitsrecht beruht auf althergebrachten, lang geübten Bräuchen, die als allgemein verpflichtend anerkannt werden. Beispiele sind Orts- und Handelsbräuche (Handelsusanzen), wie die Berechnung eines Monats mit 30 Tagen bei Banken."
  },
  {
    id: "r06", topic: "rechtsquellen", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Aussagen zum ungeschriebenen Recht sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Gewohnheitsrecht hat heute praktisch keine Bedeutung mehr, da das geschriebene Recht es weitgehend verdrängt hat."},
      {v: "B", t: "Gerichtspraxis (Präjudizien) sind wegweisend, aber nicht absolut verbindlich."},
      {v: "C", t: "Bei Gesetzeslücken darf der Richter frei nach seinem persönlichen Empfinden entscheiden."},
      {v: "D", t: "Unter bewährter Lehre versteht man die Meinung von Rechtsgelehrten in Kommentaren und Dissertationen."}
    ],
    correct: ["A", "B", "D"],
    explain: "A ist richtig: Die Regelungsdichte des geschriebenen Rechts hat das Gewohnheitsrecht weitgehend verdrängt. B ist richtig: Präjudizien sind wegweisend, aber das Bundesgericht kann seine Rechtsprechung ändern. C ist falsch: Der Richter muss nach bewährter Lehre und Überlieferung entscheiden, wie wenn er Gesetzgeber wäre (Art. 1 Abs. 2 ZGB). D ist richtig."
  },
  {
    id: "r07", topic: "rechtsquellen", type: "tf", diff: 2, tax: "K2",
    q: "Gesetzesänderungen können nur mit Zustimmung des Volkes in Kraft treten.",
    correct: false,
    explain: "Gesetze werden vom Parlament verabschiedet. Das Volk kann mit dem fakultativen Referendum (50'000 Unterschriften) eine Abstimmung über ein Gesetz verlangen, muss dies aber nicht. Ohne Referendum treten Gesetze ohne Volksabstimmung in Kraft."
  },
  {
    id: "r08", topic: "rechtsquellen", type: "mc", diff: 2, tax: "K2",
    q: "Warum benötigen Verordnungen eine ausdrückliche Grundlage in einem Gesetz?",
    options: [
      {v: "A", t: "Weil der Bundesrat sonst nicht weiss, worüber er eine Verordnung erlassen soll"},
      {v: "B", t: "Weil die Verordnung die detaillierten Ausführungsbestimmungen zu einem Gesetz enthält und sich darauf stützen muss"},
      {v: "C", t: "Weil es die Verfassung ausdrücklich so vorschreibt"},
      {v: "D", t: "Weil das Parlament jede Verordnung genehmigen muss"}
    ],
    correct: "B",
    explain: "Verordnungen enthalten detaillierte Bestimmungen darüber, wie ein Gesetz konkret angewendet werden soll. Sie benötigen deshalb eine ausdrückliche gesetzliche Grundlage – ohne Gesetz kann keine Verordnung erlassen werden."
  },

  // --- diff 3 ---
  {
    id: "r09", topic: "rechtsquellen", type: "mc", diff: 3, tax: "K4",
    q: "Ein Autohändler verkauft einem Kunden ein Fahrzeug. Im Vertrag steht: «Gerichtsstand ist Zürich.» Welche Rechtsquelle liegt dieser Klausel zugrunde?",
    options: [
      {v: "A", t: "Gewohnheitsrecht, weil es handelsüblich ist"},
      {v: "B", t: "Geschriebenes Recht: Der Grundsatz des Gerichtsstands am Wohnsitz kann vertraglich abgeändert werden (Art. 30 Abs. 2 BV)"},
      {v: "C", t: "Richterliche Rechtsfindung, weil kein Gesetz den Gerichtsstand regelt"},
      {v: "D", t: "Die Bundesverfassung, weil sie alle Verträge regelt"}
    ],
    correct: "B",
    explain: "Art. 30 Abs. 2 BV gibt jeder Person Anspruch darauf, dass die Sache vom Gericht an ihrem Wohnsitz beurteilt wird. Auf diese Garantie kann aber vertraglich verzichtet werden, sofern dies in einer ausdrücklichen Erklärung geschieht. Die Gerichtsstandsklausel stützt sich somit auf geschriebenes Recht."
  },
  {
    id: "r10", topic: "rechtsquellen", type: "multi", diff: 3, tax: "K4",
    q: "In welchen der folgenden Fälle stützt sich die Entscheidungsgrundlage auf ungeschriebenes Recht? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Die Bundesversammlung erlässt ein Gesetz über die Mutterschaftsversicherung."},
      {v: "B", t: "Einem Automobilisten, der in angetrunkenem Zustand einen Verkehrsunfall verursacht hat, wird der Führerausweis gemäss Praxis des Bundesgerichtes während 6 Monaten entzogen."},
      {v: "C", t: "Schweizerische Banken berechnen den Zins auf Sparkonten mit 360 Tagen pro Jahr und 30 Tagen pro Monat."},
      {v: "D", t: "In einem Scheidungsprozess werden die Unterhaltszahlungen von der Amtsgerichtspräsidentin festgesetzt."}
    ],
    correct: ["B", "C", "D"],
    explain: "A ist geschriebenes Recht (Gesetz). B stützt sich auf Gerichtspraxis (Präjudizien). C beruht auf Gewohnheitsrecht (Handelsusanz). D beruht auf richterlichem Ermessen (gerichtliche Rechtsfindung), da die konkrete Höhe der Unterhaltszahlungen vom Richter nach den Umständen bestimmt wird."
  },
  {
    id: "r11", topic: "rechtsquellen", type: "mc", diff: 3, tax: "K5",
    q: "Warum gibt es in der Schweiz keine Verfassungsgerichtsbarkeit für Bundesgesetze?",
    options: [
      {v: "A", t: "Weil die Schweiz kein Verfassungsgericht hat"},
      {v: "B", t: "Weil das Bundesgericht Bundesgesetze nicht auf ihre Verfassungsmässigkeit überprüfen darf, der Grundsatz «übergeordnetes Recht geht vor» auf Bundesebene also nur eingeschränkt gilt"},
      {v: "C", t: "Weil alle Gesetze automatisch verfassungskonform sind"},
      {v: "D", t: "Weil kantonale Gerichte diese Aufgabe übernehmen"}
    ],
    correct: "B",
    explain: "In der Schweiz darf das Bundesgericht Bundesgesetze nicht auf ihre Verfassungsmässigkeit überprüfen. Praktisch gehen Gesetze der Verfassung deshalb nicht vor, aber sie können auch nicht für ungültig erklärt werden. Bei Verordnungen hingegen prüft das Bundesgericht indirekt die Verfassungsmässigkeit."
  },

  // ============================================================
  // TOPIC: treu_glauben (Art. 2 Abs. 1 ZGB)
  // ============================================================

  // --- diff 1 ---
  {
    id: "t01", topic: "treu_glauben", type: "fill", diff: 1, tax: "K1",
    q: "Art. 2 Abs. 1 ZGB lautet: «Jedermann hat in der Ausübung seiner Rechte und in der Erfüllung seiner Pflichten nach {0} und {1} zu handeln.»",
    blanks: [
      {answer: "Treu", alts: ["treu"]},
      {answer: "Glauben", alts: ["glauben"]}
    ],
    explain: "Art. 2 Abs. 1 ZGB enthält das Gebot des Handelns nach Treu und Glauben. Es verlangt von den Rechtssubjekten, sich anständig und korrekt zu verhalten."
  },
  {
    id: "t02", topic: "treu_glauben", type: "mc", diff: 1, tax: "K1",
    q: "An wen richtet sich das Gebot des Handelns nach Treu und Glauben gemäss Art. 2 Abs. 1 ZGB?",
    options: [
      {v: "A", t: "Nur an Richterinnen und Richter"},
      {v: "B", t: "Nur an Vertragsparteien"},
      {v: "C", t: "An alle Rechtssubjekte"},
      {v: "D", t: "Nur an juristische Personen"}
    ],
    correct: "C",
    explain: "Art. 2 Abs. 1 ZGB richtet sich an alle Rechtssubjekte – also an alle natürlichen und juristischen Personen. Es verlangt, dass jeder in der Rechtsausübung als anständiger und korrekter Mensch handelt."
  },
  {
    id: "t03", topic: "treu_glauben", type: "tf", diff: 1, tax: "K1",
    q: "Das Gebot von Treu und Glauben bedeutet, dass allgemeine Werte der Sittlichkeit und Moral über Art. 2 ZGB Eingang ins Recht finden.",
    correct: true,
    explain: "Art. 2 Abs. 1 ZGB verlangt von den Rechtssubjekten, sich als anständige und korrekte Menschen zu verhalten. Auf diese Weise finden allgemeine Werte der Sittlichkeit und Moral Eingang ins Recht."
  },

  // --- diff 2 ---
  {
    id: "t04", topic: "treu_glauben", type: "mc", diff: 2, tax: "K3",
    q: "Herr Wagner verspricht einem Interessenten seinen BMW für Fr. 10'000.–. Die briefliche Annahmeerklärung soll bis Freitag, 18. Juli, eintreffen. Am 18. Juli erhält Wagner einen Brief, dessen Umschlag aber leer ist. Wagner verkauft den Wagen daraufhin an eine andere Person. Ist das Verhalten von Herrn Wagner korrekt?",
    options: [
      {v: "A", t: "Ja, weil keine Annahmeerklärung vorlag"},
      {v: "B", t: "Nein, weil er gemäss Art. 2 Abs. 1 ZGB nach Treu und Glauben den Absender hätte benachrichtigen müssen, dass der Briefumschlag leer war"},
      {v: "C", t: "Ja, weil der Interessent selbst schuld ist"},
      {v: "D", t: "Nein, weil der Kaufvertrag bereits zustande gekommen war"}
    ],
    correct: "B",
    explain: "Da zwischen Wagner und dem Interessenten ein Rechtsverhältnis bestand (Vertragsverhandlung), gebieten es Treu und Glauben (Art. 2 Abs. 1 ZGB), dass Wagner den Absender sofort benachrichtigt, wenn der Briefumschlag leer war. Berechtigtes Vertrauen soll nicht enttäuscht werden."
  },
  {
    id: "t05", topic: "treu_glauben", type: "multi", diff: 2, tax: "K3",
    q: "In welchen der folgenden Fälle wird gegen Treu und Glauben verstossen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ein Hauseigentümer lehnt alle vom Makler vermittelten Interessenten ab, schliesst dann aber nach Ablauf des Maklervertrags direkt mit einem dieser Interessenten den Kaufvertrag ab, um die Provision zu sparen."},
      {v: "B", t: "Ein Käufer bezahlt den vereinbarten Kaufpreis fristgerecht."},
      {v: "C", t: "Ein Aktionär ficht einen Beschluss der Generalversammlung an, dem er selbst zugestimmt hat."},
      {v: "D", t: "Zwei Brüder versprechen dem Enterbten, ihm seinen Pflichtteil auszuzahlen. Nach Ablauf der Klagefrist erklären sie, er erhalte nichts, da er die Frist verpasst habe."}
    ],
    correct: ["A", "C", "D"],
    explain: "A: Verstoss – der Hauseigentümer handelt treuwidrig, indem er den Maklervertrag umgeht. B: Kein Verstoss – fristgerechte Zahlung ist vertragskonform. C: Verstoss – wer einem Beschluss zugestimmt hat, handelt widersprüchlich, wenn er ihn anficht. D: Verstoss – die Brüder haben den Enterbten absichtlich hingehalten, um die Klagefrist verstreichen zu lassen."
  },
  {
    id: "t06", topic: "treu_glauben", type: "tf", diff: 2, tax: "K2",
    q: "Wer berechtigtes Vertrauen in die Anständigkeit anderer gesetzt hat, soll gemäss dem Grundsatz von Treu und Glauben nicht enttäuscht werden.",
    correct: true,
    explain: "Der Grundsatz von Treu und Glauben schützt das berechtigte Vertrauen. Wer in die Anständigkeit anderer – meistens des Vertragspartners – vertraut hat, soll in diesem Vertrauen nicht enttäuscht werden."
  },

  // --- diff 3 ---
  {
    id: "t07", topic: "treu_glauben", type: "mc", diff: 3, tax: "K4",
    q: "Während eines Lockdowns muss ein Mieter sein Restaurant mehrere Monate geschlossen halten und erzielt keine Einnahmen. Er klagt auf Mietzinsreduktion. Welcher Rechtsgrundsatz wird hier angerufen?",
    options: [
      {v: "A", t: "Rechtsmissbrauchsverbot (Art. 2 Abs. 2 ZGB)"},
      {v: "B", t: "Der gute Glaube (Art. 3 ZGB)"},
      {v: "C", t: "Handeln nach Treu und Glauben (Art. 2 Abs. 1 ZGB) – clausula rebus sic stantibus"},
      {v: "D", t: "Beweislast (Art. 8 ZGB)"}
    ],
    correct: "C",
    explain: "Es handelt sich um die clausula rebus sic stantibus: Obwohl Verträge grundsätzlich einzuhalten sind, kann es infolge grundlegend und unvorhersehbar veränderter Umstände (hier: Lockdown) nach dem Grundsatz von Treu und Glauben (Art. 2 Abs. 1 ZGB) dazu kommen, dass der Vertragspartner auf die Gegenleistung ganz oder teilweise verzichten muss."
  },
  {
    id: "t08", topic: "treu_glauben", type: "mc", diff: 3, tax: "K5",
    q: "A erhält von einem Gericht einen Entscheid mit der Rechtsmittelbelehrung, dass innerhalb von 30 Tagen Beschwerde geführt werden könne. A reicht nach 26 Tagen eine Beschwerde ein. Die obere Instanz erklärt, die Frist betrage gemäss ZPO nur 10 Tage. Wie entscheidet die obere Instanz?",
    options: [
      {v: "A", t: "Die Beschwerde wird abgewiesen, da die Frist abgelaufen ist."},
      {v: "B", t: "Die Beschwerde wird zugelassen, weil A auf die Rechtsmittelbelehrung des unteren Gerichts vertrauen durfte (Art. 2 Abs. 1 ZGB)."},
      {v: "C", t: "Die Beschwerde wird zugelassen, weil A gutgläubig war (Art. 3 ZGB)."},
      {v: "D", t: "Die Beschwerde wird abgewiesen, weil Rechtsunkenntnis schadet."}
    ],
    correct: "B",
    explain: "A durfte auf die Richtigkeit der Rechtsmittelbelehrung des unteren Gerichts vertrauen. Dieses berechtigte Vertrauen wird durch den Grundsatz von Treu und Glauben (Art. 2 Abs. 1 ZGB) geschützt. Die obere Instanz muss deshalb trotz verspäteter Eingabe auf die Beschwerde eintreten."
  },
  {
    id: "t09", topic: "treu_glauben", type: "tf", diff: 3, tax: "K4",
    q: "Der Grundsatz von Treu und Glauben kann auch dazu führen, dass ein Vertragspartner auf die Gegenleistung ganz oder teilweise verzichten muss, wenn sich die Umstände grundlegend und unvorhersehbar verändert haben (clausula rebus sic stantibus).",
    correct: true,
    explain: "Die clausula rebus sic stantibus ist eine Ausnahme vom Grundsatz pacta sunt servanda (Verträge sind einzuhalten). Bei grundlegend und unvorhersehbar veränderten Umständen kann gestützt auf Art. 2 Abs. 1 ZGB eine Anpassung des Vertrags verlangt werden."
  },

  // ============================================================
  // TOPIC: rechtsmissbrauch (Art. 2 Abs. 2 ZGB)
  // ============================================================

  // --- diff 1 ---
  {
    id: "m01", topic: "rechtsmissbrauch", type: "fill", diff: 1, tax: "K1",
    q: "Art. 2 Abs. 2 ZGB: «Der offenbare Missbrauch eines Rechtes findet keinen {0}.»",
    blanks: [
      {answer: "Rechtsschutz", alts: ["rechtsschutz"]}
    ],
    explain: "Art. 2 Abs. 2 ZGB enthält das Rechtsmissbrauchsverbot: Wer ein Recht offenbar missbräuchlich ausübt, wird vom Richter nicht geschützt."
  },
  {
    id: "m02", topic: "rechtsmissbrauch", type: "mc", diff: 1, tax: "K1",
    q: "Wann liegt gemäss Art. 2 Abs. 2 ZGB ein Rechtsmissbrauch vor?",
    options: [
      {v: "A", t: "Immer wenn die Ausübung eines Rechts den anderen hart trifft"},
      {v: "B", t: "Erst wenn ein krass stossendes Verhalten vorliegt"},
      {v: "C", t: "Wenn ein Recht formell korrekt, aber für einen fragwürdigen Zweck ausgeübt wird"},
      {v: "D", t: "Wenn jemand sein Recht nicht sofort ausübt"}
    ],
    correct: "B",
    explain: "Es liegt nicht schon dann Rechtsmissbrauch vor, wenn die Ausübung eines Rechts den anderen hart trifft. Erst ein krass stossendes Verhalten ist rechtsmissbräuchlich im Sinne von Art. 2 Abs. 2 ZGB."
  },
  {
    id: "m03", topic: "rechtsmissbrauch", type: "tf", diff: 1, tax: "K2",
    q: "Das Rechtsmissbrauchsverbot schützt denjenigen, der sich formell auf ein Recht beruft, dieses aber zweckwidrig einsetzt.",
    correct: false,
    explain: "Genau das Gegenteil ist der Fall: Art. 2 Abs. 2 ZGB weist den Richter an, den offenbaren Missbrauch eines Rechts nicht zu schützen. Wer ein Recht missbräuchlich ausübt, verliert den Rechtsschutz."
  },

  // --- diff 2 ---
  {
    id: "m04", topic: "rechtsmissbrauch", type: "mc", diff: 2, tax: "K3",
    q: "Eine geschiedene Person zieht mit ihrem neuen Lebenspartner zusammen, heiratet aber nicht, um den Rentenanspruch gegenüber dem Ex-Ehepartner nicht zu verlieren. Wie ist dieses Verhalten rechtlich einzuordnen?",
    options: [
      {v: "A", t: "Zulässig, weil das Gesetz das Zusammenleben ohne Heirat erlaubt"},
      {v: "B", t: "Rechtsmissbräuchlich, weil das formelle Beharren auf dem Recht missbräuchlich erscheint"},
      {v: "C", t: "Verstoss gegen Treu und Glauben, aber kein Rechtsmissbrauch"},
      {v: "D", t: "Irrelevant, da der Rentenanspruch automatisch entfällt"}
    ],
    correct: "B",
    explain: "Gemäss bundesgerichtlicher Rechtsprechung handelt es sich um Rechtsmissbrauch (Art. 2 Abs. 2 ZGB), wenn die rentenberechtigte Person in einem stabilen Konkubinat lebt, das eine eheähnliche Lebensgemeinschaft darstellt, und nur nicht heiratet, um den Rentenanspruch nicht zu verlieren."
  },
  {
    id: "m05", topic: "rechtsmissbrauch", type: "multi", diff: 2, tax: "K3",
    q: "In welchen Fällen liegt Rechtsmissbrauch vor? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ein Vermieter beharrt beim Auszug des Mieters auf einer Reinigung der Wohnung, obwohl das Haus nach dem Auszug abgebrochen wird."},
      {v: "B", t: "Ein Mieter zahlt die vertraglich vereinbarte Miete nicht."},
      {v: "C", t: "Eine AG wird nur gegründet, um das Privatvermögen des Aktionärs vor Gläubigern zu schützen, obwohl die Gesellschaft nie lebensfähig war."},
      {v: "D", t: "Ein Schuldner erhebt die Einrede der Verjährung, nachdem er dem Gläubiger versprochen hatte, dies nicht zu tun."}
    ],
    correct: ["A", "C", "D"],
    explain: "A: Rechtsmissbrauch – nutzlose Rechtsausübung aus Schikane. B: Kein Rechtsmissbrauch, sondern Vertragsverletzung. C: Rechtsmissbrauch – Durchgriffshaftung («Piercing the corporate veil»). D: Rechtsmissbrauch – widersprüchliches Verhalten, da der Schuldner zuvor auf die Einrede verzichtet hatte."
  },
  {
    id: "m06", topic: "rechtsmissbrauch", type: "tf", diff: 2, tax: "K2",
    q: "Nutzlose Rechtsausübung aus Rache, Schikane oder Schadenfreude gilt als Rechtsmissbrauch.",
    correct: true,
    explain: "Ein Rechtsmissbrauch liegt auch bei nutzloser Rechtsausübung vor, d.h. wenn die Rechtsausübung aus Rache, Schikane oder Schadenfreude erfolgt. Das Recht wird dabei zweckwidrig eingesetzt."
  },

  // --- diff 3 ---
  {
    id: "m07", topic: "rechtsmissbrauch", type: "mc", diff: 3, tax: "K4",
    q: "F10: Im BGE 116 II 431ff. spielte Art. 2 ZGB eine entscheidende Rolle. Ein Autohändler verkaufte 1981 einen Fiat 131 CL Panorama als «fabrikneu». Der Wagen wurde aber bereits 1978 in die Schweiz eingeführt. Es handelte sich um ein dreijähriges Modell, das nicht mehr hergestellt wurde. Welcher Rechtsgrundsatz spielte die entscheidende Rolle?",
    options: [
      {v: "A", t: "Das Rechtsmissbrauchsverbot (Art. 2 Abs. 2 ZGB)"},
      {v: "B", t: "Das Gebot des Handelns nach Treu und Glauben (Art. 2 Abs. 1 ZGB)"},
      {v: "C", t: "Der gute Glaube (Art. 3 ZGB)"},
      {v: "D", t: "Die Beweislast (Art. 8 ZGB)"}
    ],
    correct: "B",
    explain: "Es handelt sich um einen Verstoss gegen das Gebot des Handelns nach Treu und Glauben (Art. 2 Abs. 1 ZGB). Der Autohändler hat den Käufer durch Verschweigen eines wesentlichen Umstandes (Alter des Fahrzeugs) getäuscht. Anständige und korrekte Menschen verschweigen solche Tatsachen nicht."
  },
  {
    id: "m08", topic: "rechtsmissbrauch", type: "mc", diff: 3, tax: "K5",
    q: "Für die Verpflichtungen einer AG haftet grundsätzlich nur deren Vermögen, nicht das Privatvermögen der Aktionäre. In welchem Fall können die Gerichte trotzdem auf den Aktionär durchgreifen?",
    options: [
      {v: "A", t: "Wenn die AG Verluste macht"},
      {v: "B", t: "Wenn die AG von Anfang an so konzipiert war, dass sie nicht lebensfähig sein kann oder infolge Vermögensentzug durch die kleinste Schwierigkeit zu Fall kommt (Rechtsmissbrauch)"},
      {v: "C", t: "Wenn der Aktionär Geschäftsführer ist"},
      {v: "D", t: "Wenn die AG weniger als 3 Aktionäre hat"}
    ],
    correct: "B",
    explain: "Wenn die AG-Struktur rechtsmissbräuchlich eingesetzt wird (Art. 2 Abs. 2 ZGB), können die Gerichte «den Schleier der juristischen Person» durchdringen und direkt auf den Aktionär greifen (Durchgriffshaftung / Piercing the corporate veil)."
  },
  {
    id: "m09", topic: "rechtsmissbrauch", type: "tf", diff: 3, tax: "K4",
    q: "Gemäss Art. 141 Abs. 1 OR kann auf die Einrede der Verjährung im Voraus verzichtet werden.",
    correct: false,
    explain: "Gemäss Art. 141 Abs. 1 OR kann auf die Einrede der Verjährung nicht im Voraus verzichtet werden. Ein solcher Verzicht ist unwirksam. Trotzdem kann es in der Praxis vorkommen, dass ein Schuldner verspricht, die Einrede nicht zu erheben. Erhebt er sie dann trotzdem, kann ihm Rechtsmissbrauch vorgeworfen werden."
  },

  // ============================================================
  // TOPIC: guter_glaube (Art. 3 ZGB)
  // ============================================================

  // --- diff 1 ---
  {
    id: "g01", topic: "guter_glaube", type: "mc", diff: 1, tax: "K1",
    q: "Was regelt Art. 3 ZGB?",
    options: [
      {v: "A", t: "Das Gebot des Handelns nach Treu und Glauben"},
      {v: "B", t: "Das Rechtsmissbrauchsverbot"},
      {v: "C", t: "Den guten Glauben und seine Vermutung"},
      {v: "D", t: "Die Beweislast"}
    ],
    correct: "C",
    explain: "Art. 3 ZGB regelt den guten Glauben: Wo das Gesetz eine Rechtswirkung an den guten Glauben einer Person knüpft, ist dessen Dasein zu vermuten (Abs. 1). Wer bösgläubig sein musste, kann sich nicht auf den guten Glauben berufen (Abs. 2)."
  },
  {
    id: "g02", topic: "guter_glaube", type: "tf", diff: 1, tax: "K1",
    q: "Der gute Glaube wird gemäss Art. 3 Abs. 1 ZGB vermutet.",
    correct: true,
    explain: "Art. 3 Abs. 1 ZGB stellt eine Vermutung auf: Wo das Gesetz eine Rechtswirkung an den guten Glauben knüpft, ist dessen Dasein zu vermuten. Jeder Mensch gilt von Gesetzes wegen als gutgläubig, bis das Gegenteil bewiesen ist."
  },
  {
    id: "g03", topic: "guter_glaube", type: "fill", diff: 1, tax: "K1",
    q: "Das Gesetz geht von der {0} der Menschen aus. Bis zum Beweis der Bösgläubigkeit gilt jeder Mensch von Gesetzes wegen als {1}.",
    blanks: [
      {answer: "Anständigkeit", alts: ["anständigkeit"]},
      {answer: "gutgläubig", alts: ["Gutgläubig"]}
    ],
    explain: "Das Gesetz geht von der Anständigkeit der Menschen aus. Bis zum Beweis der Bösgläubigkeit gilt jeder Mensch von Gesetzes wegen als gutgläubig. Dies führt zu einer Umkehr der Beweislast."
  },

  // --- diff 2 ---
  {
    id: "g04", topic: "guter_glaube", type: "mc", diff: 2, tax: "K2",
    q: "Warum führt Art. 3 ZGB zu einer Umkehr der Beweislast?",
    options: [
      {v: "A", t: "Weil der gute Glaube vermutet wird und somit nicht bewiesen werden muss – die Gegenpartei muss die Bösgläubigkeit beweisen"},
      {v: "B", t: "Weil der Richter immer zugunsten des Gutgläubigen entscheidet"},
      {v: "C", t: "Weil Art. 8 ZGB bei Art. 3 ZGB nicht gilt"},
      {v: "D", t: "Weil der gute Glaube nie bewiesen werden kann"}
    ],
    correct: "A",
    explain: "Gemäss Art. 8 ZGB muss normalerweise derjenige eine Tatsache beweisen, der aus ihr Rechte ableitet. Bei Art. 3 ZGB wird der gute Glaube aber vermutet. Wer behauptet, der andere sei gutgläubig gewesen, muss dies nicht beweisen. Umgekehrt muss die Gegenpartei die Bösgläubigkeit beweisen – daher die Beweislastumkehr."
  },
  {
    id: "g05", topic: "guter_glaube", type: "multi", diff: 2, tax: "K3",
    q: "In welchen der folgenden Fälle kann sich eine Person NICHT auf den guten Glauben berufen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Ein Hehler kauft wissentlich Diebesgut."},
      {v: "B", t: "Eine Person kauft ein Mountain-Bike von jemandem aus der Drogenszene zu einem Schleuderpreis."},
      {v: "C", t: "Eine Person kauft ein Buch in einer regulären Buchhandlung."},
      {v: "D", t: "Ein Occasionshändler kauft einen gestohlenen Ferrari, ohne die Fahrzeugpapiere genauer zu überprüfen, wie es nach den Umständen angemessen gewesen wäre."}
    ],
    correct: ["A", "B", "D"],
    explain: "A: Bösgläubig – der Hehler weiss, dass es Diebesgut ist. B: Bösgläubig – aufgrund der Umstände (Drogenszene, Schleuderpreis) musste die Person annehmen, dass es sich um Diebesgut handelt. C: Gutgläubig – keine verdächtigen Umstände. D: Bösgläubig – der Occasionshändler hat es an der nach den Umständen gebotenen Aufmerksamkeit fehlen lassen (BGE 113 II 397ff.)."
  },
  {
    id: "g06", topic: "guter_glaube", type: "tf", diff: 2, tax: "K2",
    q: "Art. 3 ZGB stellt einen allgemeinen Grundsatz auf, der auf alle Rechtsverhältnisse anwendbar ist.",
    correct: false,
    explain: "Art. 3 ZGB findet nur auf die Fälle Anwendung, wo das Gesetz eine Rechtsfolge davon abhängig macht, ob jemand gutgläubig oder bösgläubig war. Es gibt im schweizerischen Recht keinen umfassenden Gutglaubensschutz."
  },

  // --- diff 3 ---
  {
    id: "g07", topic: "guter_glaube", type: "mc", diff: 3, tax: "K3",
    q: "F12: Der Prokurist Franz Renggli wird fristlos entlassen und verpflichtet noch vor der Publikation des Prokuraentzugs im SHAB eine Rockgruppe. Der Agent der Rockgruppe behauptet, vom Entzug der Prokura nichts gewusst zu haben. Muss er seine Gutgläubigkeit beweisen?",
    options: [
      {v: "A", t: "Ja, weil er als Kläger die Beweislast trägt"},
      {v: "B", t: "Nein, weil der gute Glaube gemäss Art. 3 Abs. 1 ZGB vermutet wird"},
      {v: "C", t: "Ja, weil bei Handelsregistereintragungen besondere Regeln gelten"},
      {v: "D", t: "Nein, weil der Prokuraentzug noch nicht im SHAB publiziert war"}
    ],
    correct: "B",
    explain: "Gemäss Art. 3 Abs. 1 ZGB wird der gute Glaube vermutet. Der Agent muss seine Gutgläubigkeit nicht beweisen. Die Arbeitgeberin müsste beweisen, dass der Agent bösgläubig war, d.h. vom Prokuraentzug Kenntnis hatte."
  },
  {
    id: "g08", topic: "guter_glaube", type: "mc", diff: 3, tax: "K4",
    q: "Gemäss BGE 107 II 41 wurde einem Garagisten die Berufung auf den guten Glauben verwehrt, weil er einen Wagen im Wert von Fr. 19'250.– für Fr. 13'000.– kaufte, ohne das Eigentumsvorbehaltsregister zu prüfen. Welcher Absatz von Art. 3 ZGB kommt hier zum Tragen?",
    options: [
      {v: "A", t: "Art. 3 Abs. 1 ZGB – die Vermutung des guten Glaubens"},
      {v: "B", t: "Art. 3 Abs. 2 ZGB – wer bei der gebotenen Aufmerksamkeit nicht gutgläubig sein konnte, ist nicht berechtigt, sich auf den guten Glauben zu berufen"},
      {v: "C", t: "Art. 3 Abs. 1 und 2 ZGB gleichermassen"},
      {v: "D", t: "Keiner, es handelt sich um Gewohnheitsrecht"}
    ],
    correct: "B",
    explain: "Art. 3 Abs. 2 ZGB: Wer bei der Aufmerksamkeit, wie sie nach den Umständen von ihm verlangt werden darf, nicht gutgläubig sein konnte, ist nicht berechtigt, sich auf den guten Glauben zu berufen. Der Garagist hätte bei einem so verdächtig tiefen Preis das Eigentumsvorbehaltsregister prüfen müssen."
  },
  {
    id: "g09", topic: "guter_glaube", type: "mc", diff: 3, tax: "K3",
    q: "Peter kauft von einem fliegenden Händler an einer Autobahnraststätte 2 Stangen Marlboro-Zigaretten für je Fr. 36.–. Welcher Einleitungsartikel des ZGB ist hier relevant?",
    options: [
      {v: "A", t: "Art. 1 ZGB (Rechtsquellen)"},
      {v: "B", t: "Art. 2 Abs. 1 ZGB (Treu und Glauben)"},
      {v: "C", t: "Art. 3 ZGB (Der gute Glaube)"},
      {v: "D", t: "Art. 8 ZGB (Beweislast)"}
    ],
    correct: "C",
    explain: "Art. 3 ZGB (guter Glaube): Peter kauft zu einem auffällig tiefen Preis von einem fliegenden Händler an der Raststätte. Aufgrund dieser Umstände musste er annehmen, dass die Zigaretten nicht regulär beschafft wurden. Er kann sich nicht auf den guten Glauben berufen (Art. 3 Abs. 2 ZGB)."
  },

  // ============================================================
  // TOPIC: beweislast (Art. 8 ZGB)
  // ============================================================

  // --- diff 1 ---
  {
    id: "b01", topic: "beweislast", type: "fill", diff: 1, tax: "K1",
    q: "Art. 8 ZGB: «Wo das Gesetz es nicht anders bestimmt, hat derjenige das Vorhandensein einer behaupteten Tatsache zu {0}, der aus ihr Rechte ableitet.»",
    blanks: [
      {answer: "beweisen", alts: ["Beweisen"]}
    ],
    explain: "Art. 8 ZGB enthält die Grundregel der Beweislast: Wer aus einer Tatsache Rechte ableiten will, muss das Vorhandensein dieser Tatsache beweisen. Gelingt der Beweis nicht, trägt er die Folgen der Beweislosigkeit."
  },
  {
    id: "b02", topic: "beweislast", type: "mc", diff: 1, tax: "K1",
    q: "Was gilt im Strafprozessrecht hinsichtlich der Sachverhaltsabklärung?",
    options: [
      {v: "A", t: "Die Verhandlungsmaxime"},
      {v: "B", t: "Die Untersuchungsmaxime – der Sachverhalt wird von Amtes wegen abgeklärt"},
      {v: "C", t: "Die Behauptungslast"},
      {v: "D", t: "Der Richter entscheidet nach Gutdünken"}
    ],
    correct: "B",
    explain: "Im Strafprozessrecht gilt die Untersuchungsmaxime: Der Sachverhalt muss von Amtes wegen abgeklärt werden. Es ist Aufgabe der Strafverfolgungsbehörden, die Wahrheit zu ermitteln."
  },
  {
    id: "b03", topic: "beweislast", type: "tf", diff: 1, tax: "K1",
    q: "Im Zivilprozess gilt grundsätzlich die Verhandlungsmaxime: Der Richter befasst sich nur mit Tatsachen, die von einer Partei behauptet und bewiesen worden sind.",
    correct: true,
    explain: "Im Zivilprozess gilt – von Ausnahmen abgesehen – die Verhandlungsmaxime. Der Richter klärt den Sachverhalt nicht von Amtes wegen ab. Die Parteien müssen die für sie wesentlichen Tatsachen behaupten (Behauptungslast) und beweisen (Beweislast)."
  },

  // --- diff 2 ---
  {
    id: "b04", topic: "beweislast", type: "mc", diff: 2, tax: "K3",
    q: "Aus der Geschäftskasse sind während der letzten Wochen einige Hundert Franken gestohlen worden. Der Arbeitgeber verdächtigt die Putzfrau und entlässt sie fristlos. Die Putzfrau bestreitet den Diebstahl. Wer trägt die Beweislast?",
    options: [
      {v: "A", t: "Die Putzfrau muss beweisen, dass sie unschuldig ist"},
      {v: "B", t: "Der Arbeitgeber muss beweisen, dass die Putzfrau die Täterin war, weil er aus dieser Tatsache das Recht zur fristlosen Entlassung ableitet"},
      {v: "C", t: "Niemand, der Richter klärt von Amtes wegen ab"},
      {v: "D", t: "Beide Parteien tragen die Beweislast zu gleichen Teilen"}
    ],
    correct: "B",
    explain: "Gemäss Art. 8 ZGB muss derjenige das Vorhandensein einer Tatsache beweisen, der aus ihr Rechte ableitet. Der Arbeitgeber leitet aus dem behaupteten Diebstahl das Recht ab, die Putzfrau fristlos entlassen zu dürfen. Daher muss er beweisen, dass sie die Täterin war."
  },
  {
    id: "b05", topic: "beweislast", type: "multi", diff: 2, tax: "K3",
    q: "In welchen der folgenden Fälle trägt der Kläger/die Klägerin die Beweislast? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Käufer behauptet, er habe einen offensichtlichen Mangel rechtzeitig gerügt, und möchte die Ware zurückgeben."},
      {v: "B", t: "Der Ehegatte behauptet, er habe einen Vermögenswert aus Mitteln einer Erbschaft gekauft und somit falle er in sein Eigengut."},
      {v: "C", t: "Der Schuldner behauptet, er habe den Vertrag nicht erfüllen können, weil höhere Gewalt vorlag."},
      {v: "D", t: "Die Arbeitgeberin behauptet, die Mitarbeiterin habe einen wichtigen Grund für eine fristlose Kündigung geliefert."}
    ],
    correct: ["A", "B", "D"],
    explain: "Gemäss Art. 8 ZGB muss jeweils diejenige Partei beweisen, die aus einer Tatsache Rechte ableitet. A: Der Käufer will die Ware zurückgeben → er muss die rechtzeitige Mängelrüge beweisen. B: Der Ehegatte will Eigengut geltend machen → er muss die Herkunft beweisen. C: Bei Verschulden kehrt Art. 97 OR die Beweislast um – der Schuldner muss beweisen, dass ihn kein Verschulden trifft. D: Die Arbeitgeberin will fristlos kündigen → sie muss den wichtigen Grund beweisen."
  },
  {
    id: "b06", topic: "beweislast", type: "tf", diff: 2, tax: "K2",
    q: "Recht haben und Recht bekommen ist dasselbe.",
    correct: false,
    explain: "Recht haben und Recht bekommen ist nicht dasselbe. Nicht selten unterliegt eine Partei in einem Prozess nicht deshalb, weil sie nicht im Recht ist, sondern weil sie nicht in der Lage ist, die notwendigen Beweise zu erbringen."
  },

  // --- diff 3 ---
  {
    id: "b07", topic: "beweislast", type: "mc", diff: 3, tax: "K4",
    q: "Art. 97 OR regelt die Haftung bei Nichterfüllung eines Vertrags. Der Schuldner wird ersatzpflichtig, sofern er nicht beweist, dass ihn kein Verschulden trifft. Wie verhält sich dies zur Grundregel von Art. 8 ZGB?",
    options: [
      {v: "A", t: "Es handelt sich um eine Ausnahme: Die Beweislast wird umgekehrt – nicht der Gläubiger muss das Verschulden beweisen, sondern der Schuldner muss beweisen, dass ihn keines trifft"},
      {v: "B", t: "Es ist die gleiche Regel wie Art. 8 ZGB"},
      {v: "C", t: "Art. 97 OR hebt Art. 8 ZGB für alle Vertragsverhältnisse auf"},
      {v: "D", t: "Art. 97 OR gilt nur im Strafrecht"}
    ],
    correct: "A",
    explain: "Art. 97 OR kehrt die Beweislast um: Es wird vermutet, dass der Schuldner schuldhaft gehandelt hat. Der Gläubiger muss das Verschulden nicht beweisen. Stattdessen muss der Schuldner beweisen, dass ihn kein Verschulden trifft. Dies ist eine gesetzliche Ausnahme zu Art. 8 ZGB."
  },
  {
    id: "b08", topic: "beweislast", type: "mc", diff: 3, tax: "K4",
    q: "Der Richter klärt im Zivilprozess den Sachverhalt nicht von Amtes wegen ab. Was geschieht, wenn sich die Prozessparteien über wesentliche Tatsachen einig sind?",
    options: [
      {v: "A", t: "Der Richter muss trotzdem Beweise erheben"},
      {v: "B", t: "Die Parteien können dem Richter wesentliche Tatsachen vorenthalten, und der Richter darf einzig notorische Tatsachen von sich aus berücksichtigen"},
      {v: "C", t: "Der Prozess wird eingestellt"},
      {v: "D", t: "Der Richter muss einen Sachverständigen beiziehen"}
    ],
    correct: "B",
    explain: "Da im Zivilprozess die Verhandlungsmaxime gilt, befasst sich der Richter nur mit den von den Parteien behaupteten und bewiesenen Tatsachen. Sind sich die Parteien einig, können sie dem Richter Tatsachen vorenthalten. Der Richter darf von sich aus einzig notorische Tatsachen (jedermann bekannte Tatsachen) berücksichtigen."
  },
  {
    id: "b09", topic: "beweislast", type: "tf", diff: 3, tax: "K4",
    q: "Bei Offizialdelikten im Strafrecht gilt der Grundsatz «Wo kein Kläger ist, da ist auch kein Richter» nicht, da die Polizei von Amtes wegen ein Ermittlungsverfahren einleitet.",
    correct: true,
    explain: "Der Grundsatz «Wo kein Kläger, da kein Richter» gilt im Strafprozess nur für Antragsdelikte. Bei Offizialdelikten führt die Strafverfolgungsbehörde ein Ermittlungsverfahren von Amtes wegen durch, auch wenn niemand Strafanzeige eingereicht hat. Ergibt sich ein hinreichender Anfangsverdacht, erhebt die Untersuchungsbehörde Anklage."
  },

  // ============================================================
  // TOPIC: weitere (Weitere Rechtsgrundsätze)
  // ============================================================

  // --- diff 1 ---
  {
    id: "w01", topic: "weitere", type: "mc", diff: 1, tax: "K1",
    q: "Was bedeutet der lateinische Grundsatz «Lex posterior derogat legi priori»?",
    options: [
      {v: "A", t: "Das spezielle Recht geht dem allgemeinen Recht vor"},
      {v: "B", t: "Das jüngere Recht geht dem älteren Recht vor"},
      {v: "C", t: "Das übergeordnete Recht geht dem untergeordneten Recht vor"},
      {v: "D", t: "Bundesrecht bricht kantonales Recht"}
    ],
    correct: "B",
    explain: "«Lex posterior derogat legi priori» bedeutet: Das jüngere (neuere) Recht geht dem älteren Recht vor. Beim Erlass eines neuen Gesetzes ist der Gesetzgeber bemüht, widersprechende ältere Erlasse formell aufzuheben."
  },
  {
    id: "w02", topic: "weitere", type: "fill", diff: 1, tax: "K1",
    q: "Der Grundsatz «{0} derogat legi generali» besagt, dass das spezielle Recht dem allgemeinen Recht vorgeht.",
    blanks: [
      {answer: "Lex specialis", alts: ["lex specialis"]}
    ],
    explain: "«Lex specialis derogat legi generali» ist ein grundlegender Rechtsgrundsatz: Wenn ein spezielles Gesetz (z.B. Versicherungsvertragsgesetz) eine Frage anders regelt als ein allgemeines Gesetz (z.B. OR), geht die spezielle Regelung vor."
  },
  {
    id: "w03", topic: "weitere", type: "tf", diff: 1, tax: "K1",
    q: "Der Grundsatz «Unwissenheit schützt vor Strafe nicht» (Error iuris nocet) bedeutet, dass im Strafrecht die Unkenntnis des Gesetzes in jedem Fall zur vollen Bestrafung führt.",
    correct: false,
    explain: "Die Verallgemeinerung stimmt so nicht. Im Strafrecht sieht Art. 21 StGB vor, dass der Täter straffrei ausgeht, wenn er bei der Begehung der Tat nicht wissen konnte, dass er sich rechtswidrig verhält. Bei fahrlässigem Rechtsirrtum kann die Strafe gemildert werden."
  },

  // --- diff 2 ---
  {
    id: "w04", topic: "weitere", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Aussagen zu den Rechtsgrundsätzen sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Grundsatz «Wo kein Kläger, da kein Richter» gilt im Privatrecht (Zivilprozess) – es gilt die Verhandlungsmaxime."},
      {v: "B", t: "Bundesrecht bricht kantonales Recht (Art. 49 BV)."},
      {v: "C", t: "Rechtsunkenntnis schadet: Wer seine Rechte nicht kennt, kann daraus keine Vorteile ableiten."},
      {v: "D", t: "Das übergeordnete Recht geht dem untergeordneten Recht vor – deshalb kann das Bundesgericht jedes Bundesgesetz für verfassungswidrig erklären."}
    ],
    correct: ["A", "B", "C"],
    explain: "A: Korrekt – im Zivilprozess herrscht die Verhandlungsmaxime. B: Korrekt – Art. 49 BV. C: Korrekt – «Ignorantia iuris nocet». D: Falsch – die Schweiz kennt keine Verfassungsgerichtsbarkeit für Bundesgesetze; das Bundesgericht darf Bundesgesetze nicht auf ihre Verfassungsmässigkeit überprüfen."
  },
  {
    id: "w05", topic: "weitere", type: "mc", diff: 2, tax: "K3",
    q: "Ein Käufer weiss nicht, dass er mangelhafte Ware gemäss Art. 201 Abs. 2 OR sofort rügen muss. Die Ware gilt als genehmigt. Welcher Rechtsgrundsatz wird hier angewendet?",
    options: [
      {v: "A", t: "Unwissenheit schützt vor Strafe nicht (Error iuris nocet)"},
      {v: "B", t: "Rechtsunkenntnis schadet (Ignorantia iuris nocet)"},
      {v: "C", t: "Wo kein Kläger, da kein Richter"},
      {v: "D", t: "Das jüngere Recht geht dem älteren Recht vor"}
    ],
    correct: "B",
    explain: "Rechtsunkenntnis schadet (Ignorantia iuris nocet): Wer nicht weiss, welche Rechtshandlungen er vornehmen muss, kann aus seiner Unkenntnis nichts zu seinen Gunsten ableiten. Der Käufer hat die Rechtsfolge seiner Unkenntnis selber zu tragen – die Ware gilt als genehmigt."
  },
  {
    id: "w06", topic: "weitere", type: "tf", diff: 2, tax: "K2",
    q: "Der Grundsatz «Wo kein Kläger, da kein Richter» gilt im Strafprozess bei Offizialdelikten nicht.",
    correct: true,
    explain: "Bei Offizialdelikten leitet die Strafverfolgungsbehörde ein Ermittlungsverfahren von Amtes wegen ein, auch wenn niemand eine Strafanzeige eingereicht hat. Bei Antragsdelikten hingegen dürfen die Behörden erst einschreiten, wenn ein Strafantrag vorliegt."
  },

  // --- diff 3 ---
  {
    id: "w07", topic: "weitere", type: "mc", diff: 3, tax: "K4",
    q: "Das Versicherungsvertragsgesetz (VVG) regelt, dass ein Versicherer, der beim Vertragsabschluss über eine erhebliche Gefahrstatsache getäuscht wurde, innerhalb von 4 Wochen vom Vertrag zurücktreten kann. Das OR (allgemeines Recht) sieht bei Täuschung eine Anfechtungsfrist von 1 Jahr vor. Welche Frist gilt?",
    options: [
      {v: "A", t: "1 Jahr gemäss OR, weil das OR das ältere Gesetz ist"},
      {v: "B", t: "4 Wochen gemäss VVG, weil das spezielle Recht dem allgemeinen Recht vorgeht (lex specialis derogat legi generali)"},
      {v: "C", t: "Beide Fristen gleichzeitig"},
      {v: "D", t: "Die kürzere Frist, weil im Zweifel die kürzere Frist gilt"}
    ],
    correct: "B",
    explain: "Es gilt der Grundsatz «Lex specialis derogat legi generali»: Das Versicherungsvertragsgesetz als Spezialgesetz geht dem OR als allgemeinem Recht vor. Die Frist von 4 Wochen gemäss VVG gilt daher anstelle der 1-Jahres-Frist des OR."
  },
  {
    id: "w08", topic: "weitere", type: "mc", diff: 3, tax: "K4",
    q: "Ein Kanton erlaubt es dem Vermieter, Liegenschaftensteuern und Gebäudeversicherungsprämien als Nebenkosten auf den Mieter zu überwälzen. Art. 257a OR bestimmt jedoch, dass nur solche Kosten als Nebenkosten gelten, die mit dem Gebrauch der Sache im Zusammenhang stehen. Was gilt?",
    options: [
      {v: "A", t: "Das kantonale Recht, weil es für den Kanton spezifisch ist"},
      {v: "B", t: "Das Bundesrecht (OR), weil Bundesrecht kantonales Recht bricht (Art. 49 BV)"},
      {v: "C", t: "Es kommt auf die Vereinbarung im Mietvertrag an"},
      {v: "D", t: "Beide Regelungen gelten gleichzeitig"}
    ],
    correct: "B",
    explain: "Gemäss Art. 49 BV bricht Bundesrecht kantonales Recht. Wenn der Bund in einem Rechtsgebiet allein zuständig ist, dürfen die Kantone keine widersprechenden Gesetze erlassen. Die kantonale Bestimmung ist wegen der derogatorischen Kraft des Bundesrechts nichtig."
  },
  {
    id: "w09", topic: "weitere", type: "multi", diff: 3, tax: "K5",
    q: "Ordnen Sie die folgenden Rechtsgrundsätze korrekt zu. Welche sind NICHT im ZGB verankert? (Mehrere Antworten möglich.)",
    img: {src: "img/recht/einleitungsartikel/einleitungsartikel_ueberblick_01.svg", alt: "Übersichtsdiagramm der ZGB-Einleitungsartikel mit Zuordnungsaufgabe"},
    options: [
      {v: "A", t: "Handeln nach Treu und Glauben (Art. 2 Abs. 1 ZGB)"},
      {v: "B", t: "Bundesrecht bricht kantonales Recht (Art. 49 BV)"},
      {v: "C", t: "Unwissenheit schützt vor Strafe nicht (Art. 21 StGB)"},
      {v: "D", t: "Lex posterior derogat legi priori (allgemeiner Rechtsgrundsatz)"}
    ],
    correct: ["B", "C", "D"],
    explain: "A ist im ZGB verankert (Art. 2 Abs. 1 ZGB). B ist in der Bundesverfassung verankert (Art. 49 BV). C stammt aus dem Strafgesetzbuch (Art. 21 StGB). D ist ein allgemeiner, ungeschriebener Rechtsgrundsatz, der in keinem spezifischen Gesetz steht, sondern sich aus der Rechtslogik ergibt."
  }
];
