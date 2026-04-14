// ============================================================
// Pool: Personenrecht (ZGB 11–28)
// Fach: Recht | Farbe: #73ab2c
// Stufe: SF GYM2 (Zyklus 1)
// Erstellt: 2026-02-21
// ============================================================

window.POOL_META = {
  id: "recht_personenrecht",
  title: "Personenrecht – ZGB 11 bis 28",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM2",
  lernziele: [
    "Ich kann die Begriffe Rechtsfähigkeit, Urteilsfähigkeit und Handlungsfähigkeit unterscheiden und erklären. (K2)",
    "Ich kann prüfen, ob eine Person handlungsfähig ist und welche Rechtsgeschäfte sie abschliessen kann. (K3)",
    "Ich kann den Persönlichkeitsschutz (Art. 28 ZGB) erklären und auf Fälle anwenden. (K3)"
  ]
};

window.TOPICS = {
  "rechtssubjekte":      {label: "Rechtssubjekte und Rechtsobjekte",        short: "Rechtssubjekte", lernziele: ["Ich kann Rechtssubjekte und Rechtsobjekte unterscheiden. (K2)", "Ich kann natürliche und juristische Personen als Rechtssubjekte identifizieren. (K1)"]},
  "rechtsfaehigkeit":    {label: "Rechtsfähigkeit (ZGB 11, 31, 53, 54)",    short: "Rechtsfähigkeit", lernziele: ["Ich kann den Begriff Rechtsfähigkeit definieren (Art. 11 ZGB). (K1)", "Ich kann erklären, wann die Rechtsfähigkeit beginnt und endet. (K2)"]},
  "handlungsfaehigkeit": {label: "Handlungsfähigkeit (ZGB 12–18)",          short: "Handlungsfähigkeit", lernziele: ["Ich kann die Voraussetzungen der Handlungsfähigkeit (Volljährigkeit + Urteilsfähigkeit) nennen (Art. 12–13 ZGB). (K1)", "Ich kann die Handlungsfähigkeit einer Person anhand eines Sachverhalts beurteilen. (K3)"]},
  "beschraenkte_hu":     {label: "Beschränkte Handlungsunfähigkeit (ZGB 19 ff.)", short: "Beschr. HU", lernziele: ["Ich kann die Rechtsfolgen der beschränkten Handlungsunfähigkeit erklären (Art. 19 ff. ZGB). (K2)", "Ich kann bestimmen, welche Geschäfte eine beschränkt handlungsunfähige Person selbst abschliessen kann. (K3)"]},
  "persoenlichkeit":     {label: "Persönlichkeitsverletzungen (ZGB 28)",    short: "Persönlichkeit", lernziele: ["Ich kann die Voraussetzungen einer Persönlichkeitsverletzung nach Art. 28 ZGB nennen. (K1)", "Ich kann in einem konkreten Fall prüfen, ob eine Persönlichkeitsverletzung vorliegt und welche Rechtsbehelfe bestehen. (K3)"]}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: rechtssubjekte
  // ============================================================

  // --- diff 1 ---
  {
    id: "r01", topic: "rechtssubjekte", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was versteht man unter einem Rechtssubjekt?",
    options: [
      {v: "A", t: "Ein Träger von Rechten und Pflichten."},
      {v: "B", t: "Eine staatliche Behörde."},
      {v: "C", t: "Ein Gegenstand, über den gestritten wird."},
      {v: "D", t: "Ein Vertrag zwischen zwei Parteien."}
    ],
    correct: "A",
    explain: "Ein Rechtssubjekt ist ein Träger von Rechten und Pflichten. Es kann sich dabei um natürliche Personen (Menschen) oder juristische Personen (z.B. AG, GmbH, Verein) handeln. Rechtssubjekte können Verträge abschliessen, klagen und verklagt werden."
  },
  {
    id: "r02", topic: "rechtssubjekte", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Ein Hund ist ein Rechtssubjekt.",
    correct: false,
    explain: "Ein Hund ist kein Rechtssubjekt, sondern ein Rechtsobjekt. Nur natürliche Personen (Menschen) und juristische Personen (z.B. AG, GmbH, Verein) sind Rechtssubjekte. Tiere gehören rechtlich zu den Rechtsobjekten (Sachen), auch wenn sie gemäss Art. 641a ZGB keine Sachen im herkömmlichen Sinn sind."
  },
  {
    id: "r03", topic: "rechtssubjekte", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Rechtssubjekte werden unterteilt in {0} Personen (Menschen) und {1} Personen (z.B. AG, Verein).",
    blanks: [
      {answer: "natürliche", alts: ["Natürliche", "natuerliche"]},
      {answer: "juristische", alts: ["Juristische"]}
    ],
    explain: "Die zwei Arten von Rechtssubjekten sind natürliche Personen (alle Menschen) und juristische Personen (z.B. Aktiengesellschaften, GmbH, Vereine, Stiftungen). Beide können Träger von Rechten und Pflichten sein."
  },
  {
    id: "r04", topic: "rechtssubjekte", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Ein Auto ist ein Rechtsobjekt.",
    correct: true,
    explain: "Ein Auto ist ein Rechtsobjekt. Rechtsobjekte sind Gegenstände (Sachen), über die Rechtssubjekte verfügen können. Typischerweise streiten Rechtssubjekte um Rechtsobjekte — z.B. wem das Auto gehört."
  },

  // --- diff 2 ---
  {
    id: "r05", topic: "rechtssubjekte", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden Beispiele sind Rechtssubjekte?",
    options: [
      {v: "A", t: "Ein Mensch und eine Aktiengesellschaft."},
      {v: "B", t: "Ein Bargeldbestand und ein Goldbarren."},
      {v: "C", t: "Ein Grundstück und ein Auto."},
      {v: "D", t: "Ein Bankkonto und ein Patent."}
    ],
    correct: "A",
    explain: "Rechtssubjekte sind Träger von Rechten und Pflichten. Nur ein Mensch (natürliche Person) und eine Aktiengesellschaft (juristische Person) sind Rechtssubjekte. Grundstücke, Autos, Bankkonten, Patente, Bargeld und Goldbarren sind hingegen Rechtsobjekte — Gegenstände, über die Rechtssubjekte verfügen."
  },
  {
    id: "r06", topic: "rechtssubjekte", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden sind juristische Personen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Eine Aktiengesellschaft (AG)"},
      {v: "B", t: "Ein neugeborenes Baby"},
      {v: "C", t: "Ein Verein"},
      {v: "D", t: "Ein Einzelunternehmer"}
    ],
    correct: ["A", "C"],
    explain: "Juristische Personen sind von der Rechtsordnung als Rechtssubjekte anerkannte Organisationen. Dazu gehören die AG (Art. 620 ff. OR) und der Verein (Art. 60 ff. ZGB). Ein neugeborenes Baby ist eine natürliche Person. Ein Einzelunternehmer handelt als natürliche Person, auch wenn er im Handelsregister eingetragen ist."
  },

  // --- diff 3 ---
  {
    id: "r07", topic: "rechtssubjekte", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    context: "Die Tischlerei Müller GmbH bestellt bei einem Holzhändler Eichenbretter. Der Lehrling der GmbH, Tim (16), holt die Bretter persönlich ab.",
    q: "Wer ist in diesem Sachverhalt das Rechtssubjekt, das den Kaufvertrag abschliesst?",
    options: [
      {v: "A", t: "Der Holzhändler, weil er die Ware liefert."},
      {v: "B", t: "Die Tischlerei Müller GmbH, weil sie als juristische Person den Vertrag abschliesst."},
      {v: "C", t: "Tim, weil er die Bretter abholt."},
      {v: "D", t: "Beide: Die GmbH als Käuferin und der Holzhändler als Verkäufer."}
    ],
    correct: "D",
    explain: "An diesem Kaufvertrag sind zwei Rechtssubjekte beteiligt: Die Tischlerei Müller GmbH als Käuferin und der Holzhändler als Verkäufer. Beide schliessen als Rechtssubjekte den Vertrag ab. Tim handelt lediglich als Hilfsperson für die GmbH — er holt die Ware ab, ist aber nicht Vertragspartei. Die Eichenbretter sind das Rechtsobjekt des Vertrags."
  },
  {
    id: "r08", topic: "rechtssubjekte", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    q: "Warum ist die Unterscheidung zwischen Rechtssubjekten und Rechtsobjekten rechtlich bedeutsam?",
    options: [
      {v: "A", t: "Weil nur Rechtssubjekte Träger von Rechten und Pflichten sein können und nur sie Verträge abschliessen, klagen und verklagt werden können."},
      {v: "B", t: "Weil Rechtsobjekte einen höheren rechtlichen Schutz geniessen als Rechtssubjekte."},
      {v: "C", t: "Weil nur Rechtsobjekte vor Gericht klagen können."},
      {v: "D", t: "Weil die Unterscheidung nur im Strafrecht relevant ist."}
    ],
    correct: "A",
    explain: "Die Unterscheidung ist fundamental: Nur Rechtssubjekte (natürliche und juristische Personen) können Träger von Rechten und Pflichten sein. Sie können Verträge abschliessen, klagen und verklagt werden. Rechtsobjekte hingegen sind Gegenstände des Rechtsverkehrs — über sie wird verfügt und gestritten, aber sie haben selbst keine Rechte."
  },

  // ============================================================
  // TOPIC: rechtsfaehigkeit
  // ============================================================

  // --- diff 1 ---
  {
    id: "f01", topic: "rechtsfaehigkeit", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was bedeutet Rechtsfähigkeit?",
    options: [
      {v: "A", t: "Die Fähigkeit, vor Gericht aufzutreten."},
      {v: "B", t: "Die Fähigkeit, vernünftig zu handeln."},
      {v: "C", t: "Die Fähigkeit, Verträge abzuschliessen."},
      {v: "D", t: "Die Fähigkeit, Rechte und Pflichten zu haben."}
    ],
    correct: "D",
    explain: "Die Rechtsfähigkeit ist die Fähigkeit, Rechte und Pflichten zu haben (Art. 11 ZGB). Sie ist zu unterscheiden von der Handlungsfähigkeit, welche die Fähigkeit betrifft, Rechte und Pflichten zu begründen (Art. 12 ZGB). Rechtsfähig sein heisst «haben», handlungsfähig sein heisst «begründen»."
  },
  {
    id: "f02", topic: "rechtsfaehigkeit", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Gemäss Art. 11 ZGB ist jeder {0} rechtsfähig.",
    blanks: [
      {answer: "Mensch", alts: ["mensch"]}
    ],
    explain: "Art. 11 Abs. 1 ZGB bestimmt: «Rechtsfähig ist jeder Mensch.» Dies bedeutet, dass jede natürliche Person — unabhängig von Alter, Geschlecht, Herkunft oder geistigem Zustand — Trägerin von Rechten und Pflichten sein kann. Dies steht im Zusammenhang mit dem Gleichheitsgebot von Art. 8 BV."
  },
  {
    id: "f03", topic: "rechtsfaehigkeit", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Rechtsfähigkeit einer natürlichen Person beginnt mit der Geburt.",
    correct: true,
    explain: "Gemäss Art. 31 Abs. 1 ZGB beginnt die Rechtspersönlichkeit (und damit die Rechtsfähigkeit) mit der vollendeten Geburt. Bereits vor der Geburt ist das Kind unter der Bedingung rechtsfähig, dass es lebend geboren wird (bedingte Rechtsfähigkeit des Nasciturus)."
  },
  {
    id: "f04", topic: "rechtsfaehigkeit", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Die Rechtsfähigkeit einer natürlichen Person endet mit dem Tod.",
    correct: true,
    explain: "Die Rechtsfähigkeit endet mit dem Tod der natürlichen Person. Ab dem Todeszeitpunkt kann die verstorbene Person keine Rechte und Pflichten mehr haben. Bestehende Rechte und Pflichten gehen auf die Erben über (Universalsukzession)."
  },

  // --- diff 2 ---
  {
    id: "f05", topic: "rechtsfaehigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Wann beginnt die Rechtsfähigkeit einer juristischen Person?",
    options: [
      {v: "A", t: "Mit der Wahl des Verwaltungsrats."},
      {v: "B", t: "Mit der Aufnahme der Geschäftstätigkeit."},
      {v: "C", t: "Mit der Gründungsversammlung."},
      {v: "D", t: "Mit dem Eintrag ins Handelsregister."}
    ],
    correct: "D",
    explain: "Die Rechtsfähigkeit (Rechtspersönlichkeit) einer juristischen Person beginnt mit dem Eintrag ins Handelsregister. Ab diesem Zeitpunkt kann die juristische Person Rechte und Pflichten haben. Die Rechtsfähigkeit endet mit der Löschung aus dem Handelsregister."
  },
  {
    id: "f06", topic: "rechtsfaehigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Rechte kann eine juristische Person gemäss Art. 53 ZGB NICHT haben?",
    options: [
      {v: "A", t: "Rechte, die das Menschsein voraussetzen (z.B. das Recht auf Leben)."},
      {v: "B", t: "Das Recht, Verträge abzuschliessen."},
      {v: "C", t: "Das Recht, Mitarbeitende anzustellen."},
      {v: "D", t: "Das Recht auf Eigentum."}
    ],
    correct: "A",
    explain: "Gemäss Art. 53 ZGB können juristische Personen alle Rechte und Pflichten haben, die nicht das Menschsein zur notwendigen Voraussetzung haben. Rechte wie das Recht auf Leben, körperliche Unversehrtheit oder Ehe setzen das Menschsein voraus und stehen nur natürlichen Personen zu."
  },
  {
    id: "f07", topic: "rechtsfaehigkeit", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Aussagen zur Rechtsfähigkeit sind korrekt? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Alle Menschen sind rechtsfähig, unabhängig von Alter oder Urteilsfähigkeit."},
      {v: "B", t: "Ein neugeborenes Baby kann Eigentümer eines Hauses sein."},
      {v: "C", t: "Nur volljährige Personen sind rechtsfähig."},
      {v: "D", t: "Die Rechtsfähigkeit ist gleichbedeutend mit der Handlungsfähigkeit."}
    ],
    correct: ["A", "B"],
    explain: "Gemäss Art. 11 ZGB ist jeder Mensch rechtsfähig — unabhängig von Alter, Gesundheitszustand oder Urteilsfähigkeit (A korrekt). Daher kann auch ein Baby Eigentümer sein, z.B. durch Erbschaft (B korrekt). Die Rechtsfähigkeit ist nicht an die Volljährigkeit geknüpft (C falsch). Rechtsfähigkeit (Rechte haben) und Handlungsfähigkeit (Rechte begründen) sind verschiedene Konzepte (D falsch)."
  },

  // --- diff 3 ---
  {
    id: "f08", topic: "rechtsfaehigkeit", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Die schwangere Maria erleidet im 8. Monat einen Autounfall. Ihr ungeborenes Kind erbt am selben Tag von seinem Grossvater eine Liegenschaft. Das Kind wird zwei Wochen später gesund geboren.",
    q: "Kann das Kind die Liegenschaft erben?",
    options: [
      {v: "A", t: "Nein, ein Kind muss mindestens 1 Jahr alt sein, um erben zu können."},
      {v: "B", t: "Ja, aber erst ab dem Zeitpunkt der Geburt."},
      {v: "C", t: "Ja, da das Kind lebend geboren wurde und die Rechtsfähigkeit gemäss Art. 31 Abs. 2 ZGB auf den Zeitpunkt der Empfängnis zurückwirkt."},
      {v: "D", t: "Nein, da das Kind zum Zeitpunkt des Erbfalls noch nicht geboren war und somit nicht rechtsfähig war."}
    ],
    correct: "C",
    explain: "Obersatz: Es ist zu prüfen, ob das ungeborene Kind zum Zeitpunkt des Erbfalls rechtsfähig war.\n\nVoraussetzungen: Gemäss Art. 31 Abs. 1 ZGB beginnt die Rechtspersönlichkeit mit der vollendeten Geburt. Art. 31 Abs. 2 ZGB bestimmt jedoch, dass das Kind vor der Geburt unter dem Vorbehalt rechtsfähig ist, dass es lebend geboren wird.\n\nSubsumtion: Das Kind war zum Zeitpunkt des Erbfalls noch ungeboren, wurde aber zwei Wochen später gesund (lebend) geboren. Damit wirkt die Rechtsfähigkeit auf den Zeitpunkt der Empfängnis zurück.\n\nSchlussfolgerung: Das Kind kann die Liegenschaft erben, da seine Rechtsfähigkeit auf den Zeitpunkt vor dem Erbfall zurückwirkt."
  },
  {
    id: "f09", topic: "rechtsfaehigkeit", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Auch eine Person, die wegen Geistesschwäche unter umfassender Beistandschaft steht, ist rechtsfähig.",
    correct: true,
    explain: "Die Rechtsfähigkeit ist von der Handlungsfähigkeit strikt zu unterscheiden. Gemäss Art. 11 ZGB ist jeder Mensch rechtsfähig — unabhängig von Alter, Gesundheitszustand oder Urteilsfähigkeit. Eine Person unter umfassender Beistandschaft verliert zwar die Handlungsfähigkeit (sie kann nicht selbst Rechte begründen), bleibt aber Trägerin von Rechten und Pflichten. Sie kann z.B. Eigentümerin eines Hauses sein oder Erbin werden."
  },

  // ============================================================
  // TOPIC: handlungsfaehigkeit
  // ============================================================

  // --- diff 1 ---
  {
    id: "h01", topic: "handlungsfaehigkeit", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Was bedeutet Handlungsfähigkeit gemäss Art. 12 ZGB?",
    options: [
      {v: "A", t: "Die Fähigkeit, Rechte und Pflichten zu haben."},
      {v: "B", t: "Die Fähigkeit, vor Gericht aufzutreten."},
      {v: "C", t: "Die Fähigkeit, durch eigenes Handeln Rechte und Pflichten zu begründen."},
      {v: "D", t: "Die Fähigkeit, einen Beruf auszuüben."}
    ],
    correct: "C",
    explain: "Die Handlungsfähigkeit gemäss Art. 12 ZGB ist die Fähigkeit, durch eigenes Handeln Rechte und Pflichten zu begründen. Das bedeutet z.B., dass man selbstständig Verträge abschliessen kann, die rechtlich bindend sind. Merkhilfe: Rechtsfähigkeit = «haben», Handlungsfähigkeit = «begründen»."
  },
  {
    id: "h02", topic: "handlungsfaehigkeit", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Handlungsfähigkeit setzt gemäss Art. 13 ZGB zwei Voraussetzungen voraus: {0} und {1}.",
    blanks: [
      {answer: "Mündigkeit", alts: ["Volljährigkeit", "mündigkeit", "volljährigkeit", "Muendigkeit"]},
      {answer: "Urteilsfähigkeit", alts: ["urteilsfähigkeit", "Urteilsfaehigkeit"]}
    ],
    explain: "Art. 13 ZGB: Handlungsfähig ist, wer volljährig (mündig) und urteilsfähig ist. Beide Voraussetzungen müssen kumulativ erfüllt sein. Die Mündigkeit wird mit dem 18. Lebensjahr erreicht (Art. 14 ZGB). Die Urteilsfähigkeit erfordert vernunftgemässes Handeln (Art. 16 ZGB)."
  },
  {
    id: "h03", topic: "handlungsfaehigkeit", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Ab welchem Alter wird man in der Schweiz mündig?",
    options: [
      {v: "A", t: "Ab 20 Jahren."},
      {v: "B", t: "Ab 18 Jahren."},
      {v: "C", t: "Ab 16 Jahren."},
      {v: "D", t: "Ab 14 Jahren."}
    ],
    correct: "B",
    explain: "Gemäss Art. 14 ZGB ist mündig (volljährig), wer das 18. Lebensjahr zurückgelegt hat. Die Mündigkeit ist eine der zwei Voraussetzungen der Handlungsfähigkeit (Art. 13 ZGB)."
  },
  {
    id: "h04", topic: "handlungsfaehigkeit", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Urteilsfähigkeit bedeutet, dass man das 18. Lebensjahr erreicht hat.",
    correct: false,
    explain: "Die Urteilsfähigkeit (Art. 16 ZGB) ist nicht an ein bestimmtes Alter geknüpft, sondern an die Fähigkeit, vernunftgemäss zu handeln. Sie kann auch Minderjährigen zukommen — gemäss Bundesgerichtspraxis etwa ab ca. 12 Jahren für die meisten Angelegenheiten. Die Volljährigkeit mit 18 Jahren betrifft die Mündigkeit (Art. 14 ZGB), nicht die Urteilsfähigkeit."
  },

  // --- diff 2 ---
  {
    id: "h05", topic: "handlungsfaehigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    img: {src: "img/recht/personenrecht/personenrecht_handlungsfaehigkeit_01.svg", alt: "Prüfungsschema Handlungsfähigkeit mit Entscheidungspunkten"},
    q: "Welche der folgenden Personen sind handlungsfähig?",
    options: [
      {v: "A", t: "Ein 25-jähriger urteilsfähiger Student."},
      {v: "B", t: "Eine 17-jährige urteilsfähige Gymnasiastin."},
      {v: "C", t: "Ein 5-jähriges Kind."},
      {v: "D", t: "Eine 45-jährige bewusstlose Patientin."}
    ],
    correct: "A",
    explain: "Handlungsfähig ist nur, wer beide Voraussetzungen von Art. 13 ZGB erfüllt: Mündigkeit (Art. 14 ZGB: 18 Jahre) UND Urteilsfähigkeit (Art. 16 ZGB: vernunftgemässes Handeln). Nur der 25-jährige urteilsfähige Student erfüllt beides. Die 17-Jährige ist noch nicht mündig, das 5-jährige Kind ist weder mündig noch urteilsfähig, und die bewusstlose Patientin ist vorübergehend urteilsunfähig."
  },
  {
    id: "h06", topic: "handlungsfaehigkeit", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Gründe können zum Verlust der Urteilsfähigkeit führen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kindesalter (z.B. ein 3-jähriges Kind)"},
      {v: "B", t: "Geistige Behinderung"},
      {v: "C", t: "Starker Alkoholrausch"},
      {v: "D", t: "Minderjährigkeit (z.B. 17 Jahre alt)"}
    ],
    correct: ["A", "B", "C"],
    explain: "Art. 16 ZGB nennt als Gründe für fehlende Urteilsfähigkeit: Kindesalter, geistige Behinderung, psychische Störung, Rausch und ähnliche Zustände. Ein 3-jähriges Kind (A), eine geistig behinderte Person (B) und eine stark betrunkene Person (C) können urteilsunfähig sein. Die blosse Minderjährigkeit (D) führt dagegen nicht zur Urteilsunfähigkeit — ein 17-Jähriger ist in der Regel urteilsfähig, aber noch nicht mündig."
  },
  {
    id: "h07", topic: "handlungsfaehigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was ist die Rechtsfolge, wenn eine urteilsunfähige Person einen Vertrag abschliesst?",
    options: [
      {v: "A", t: "Der Vertrag ist gültig, wenn die andere Partei gutgläubig war."},
      {v: "B", t: "Der Vertrag wird erst ungültig, wenn die Person ihre Urteilsunfähigkeit beweist."},
      {v: "C", t: "Der Vertrag ist von Anfang an nichtig (ungültig) gemäss Art. 18 ZGB."},
      {v: "D", t: "Der Vertrag ist gültig, aber anfechtbar."}
    ],
    correct: "C",
    explain: "Wer urteilsunfähig ist, ist handlungsunfähig gemäss Art. 17 und 18 ZGB. Handlungsunfähige Personen können durch ihre Handlungen keine rechtliche Wirkung erzeugen. Ein von einer urteilsunfähigen Person abgeschlossener Vertrag ist daher nichtig — er ist von Anfang an ungültig und muss nicht angefochten werden."
  },
  {
    id: "h08", topic: "handlungsfaehigkeit", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Die Urteilsfähigkeit ist ein absoluter Zustand: Man ist entweder für alles urteilsfähig oder für nichts.",
    correct: false,
    explain: "Die Urteilsfähigkeit ist relativ — sie hängt von der konkreten Handlung ab. Eine Person kann z.B. urteilsfähig sein, um eine CD zu kaufen, aber urteilsunfähig, um ein kompliziertes Finanzgeschäft abzuschliessen. Art. 16 ZGB spricht von der Fähigkeit, vernunftgemäss zu handeln, und dies muss jeweils im Hinblick auf die konkrete Handlung beurteilt werden."
  },

  // --- diff 3 ---
  {
    id: "h09", topic: "handlungsfaehigkeit", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Hans (30, gesund) kauft sich zu seinem Geburtstag eine Harley-Davidson.",
    q: "Kann Hans das Motorrad alleine kaufen?",
    options: [
      {v: "A", t: "Ja, aber nur schriftlich."},
      {v: "B", t: "Nur mit Zustimmung seiner Ehefrau."},
      {v: "C", t: "Ja, Hans ist handlungsfähig und kann eigenständig Verträge abschliessen."},
      {v: "D", t: "Nein, für so teure Anschaffungen braucht man eine Bewilligung."}
    ],
    correct: "C",
    explain: "Obersatz: Es ist zu prüfen, ob Hans handlungsfähig ist.\n\nVoraussetzungen: Handlungsfähigkeit setzt Mündigkeit (Art. 14 ZGB) und Urteilsfähigkeit (Art. 16 ZGB) voraus (Art. 13 ZGB).\n\nSubsumtion: Hans ist 30 Jahre alt und damit mündig (Art. 14 ZGB). Er ist gesund und somit urteilsfähig (Art. 16 ZGB).\n\nSchlussfolgerung: Hans ist handlungsfähig (Art. 12 ZGB) und kann das Motorrad eigenständig kaufen."
  },
  {
    id: "h10", topic: "handlungsfaehigkeit", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Hans (30) geht nach der Arbeit mit Kollegen in die Wirtschaft. Nach mehreren Bieren kauft er betrunken einem Kollegen dessen Auto ab. Beide halten den Kauf schriftlich fest. Am nächsten Tag will Hans nichts mehr davon wissen.",
    q: "Muss Hans das Auto bezahlen?",
    options: [
      {v: "A", t: "Nein, wenn Hans aufgrund des Alkohols tatsächlich urteilsunfähig war, ist der Vertrag nichtig (Art. 18 ZGB)."},
      {v: "B", t: "Ja, denn Alkoholkonsum ist kein Grund für Urteilsunfähigkeit."},
      {v: "C", t: "Ja, ein schriftlicher Vertrag ist immer bindend."},
      {v: "D", t: "Nein, denn Verträge in einer Wirtschaft sind nie gültig."}
    ],
    correct: "A",
    explain: "Obersatz: Es ist zu prüfen, ob Hans zum Zeitpunkt des Vertragsabschlusses handlungsfähig war.\n\nVoraussetzungen: Handlungsfähigkeit setzt Urteilsfähigkeit voraus (Art. 13 ZGB). Urteilsunfähig ist, wer aufgrund von Rausch nicht vernunftgemäss handeln kann (Art. 16 ZGB). Handlungsunfähige können keine wirksamen Rechtsgeschäfte abschliessen (Art. 18 ZGB).\n\nSubsumtion: Hans hat «einen über den Durst getrunken». Wenn er aufgrund des Alkoholkonsums tatsächlich urteilsunfähig war, war er handlungsunfähig. Die Schriftform ändert daran nichts.\n\nSchlussfolgerung: War Hans urteilsunfähig, ist der Vertrag nichtig (Art. 18 ZGB). Hans muss das Auto dann nicht bezahlen. Er müsste allerdings seine Urteilsunfähigkeit beweisen."
  },
  {
    id: "h11", topic: "handlungsfaehigkeit", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Hans (30) stürzt auf dem betrunkenen Heimweg in den Garten der Nachbarin Erika und zerdrückt ihre seltenen Blumen.",
    q: "Muss Hans für den Schaden aufkommen, obwohl er urteilsunfähig war?",
    options: [
      {v: "A", t: "Ja, aber nur wenn Erika den Schaden beweisen kann."},
      {v: "B", t: "Nein, es handelt sich um einen Unfall."},
      {v: "C", t: "Ja, gemäss Art. 54 OR haftet, wer vorübergehend die Urteilsfähigkeit verliert und Schaden anrichtet — es sei denn, der Zustand trat ohne eigenes Verschulden ein."},
      {v: "D", t: "Nein, urteilsunfähige Personen haften nie."}
    ],
    correct: "C",
    explain: "Obersatz: Es ist zu prüfen, ob Hans trotz vorübergehender Urteilsunfähigkeit schadenersatzpflichtig ist.\n\nVoraussetzungen: Art. 54 OR regelt die Haftung bei vorübergehender Urteilsunfähigkeit. Wer in einem solchen Zustand Schaden anrichtet, ist ersatzpflichtig, sofern er nicht nachweist, dass der Zustand ohne sein Verschulden eingetreten ist.\n\nSubsumtion: Hans hat sich freiwillig betrunken. Der Zustand der Urteilsunfähigkeit ist somit durch sein eigenes Verschulden eingetreten.\n\nSchlussfolgerung: Hans muss den Schaden ersetzen (Art. 54 OR), weil er den Rauschzustand selbst verschuldet hat."
  },
  {
    id: "h12", topic: "handlungsfaehigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Wann erlangt eine juristische Person die Handlungsfähigkeit?",
    options: [
      {v: "A", t: "Wenn sie ins Handelsregister eingetragen wird."},
      {v: "B", t: "Wenn die notwendigen Organe bestellt sind (Art. 54 ZGB)."},
      {v: "C", t: "Wenn sie ihren ersten Vertrag abschliesst."},
      {v: "D", t: "Sobald sie gegründet wird."}
    ],
    correct: "B",
    explain: "Gemäss Art. 54 ZGB erlangt eine juristische Person die Handlungsfähigkeit, wenn die nach Gesetz und Statuten hierfür notwendigen Organe bestellt sind. Die Organe (z.B. Verwaltungsrat bei einer AG) handeln für die juristische Person. Fehlen die notwendigen Organe, ist die juristische Person handlungsunfähig."
  },

  // ============================================================
  // TOPIC: beschraenkte_hu
  // ============================================================

  // --- diff 1 ---
  {
    id: "b01", topic: "beschraenkte_hu", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Wer gilt als beschränkt handlungsunfähig?",
    options: [
      {v: "A", t: "Alle Personen über 65 Jahre."},
      {v: "B", t: "Alle Personen unter 18 Jahren."},
      {v: "C", t: "Urteilsfähige, aber unmündige Personen (Art. 19 ZGB)."},
      {v: "D", t: "Urteilsunfähige mündige Personen."}
    ],
    correct: "C",
    explain: "Beschränkt handlungsunfähig sind Personen, die zwar urteilsfähig (Art. 16 ZGB), aber noch nicht mündig (unter 18 Jahren, Art. 14 ZGB) sind. Sie befinden sich zwischen Handlungsfähigkeit und Handlungsunfähigkeit. Typisches Beispiel: ein 16-jähriger Jugendlicher."
  },
  {
    id: "b02", topic: "beschraenkte_hu", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Beschränkt Handlungsunfähige brauchen grundsätzlich die Zustimmung ihres gesetzlichen Vertreters, um Rechte und Pflichten zu begründen.",
    correct: true,
    explain: "Gemäss Art. 19 Abs. 1 ZGB bedürfen urteilsfähige Unmündige der Zustimmung ihres gesetzlichen Vertreters (z.B. der Eltern), um Rechte und Pflichten zu begründen. Es gibt jedoch Ausnahmen von dieser Regel (Art. 19 Abs. 2 ZGB, Art. 19c ZGB, Art. 323 Abs. 1 ZGB)."
  },
  {
    id: "b03", topic: "beschraenkte_hu", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Die Zustimmung des gesetzlichen Vertreters kann im {0} oder im {1} erfolgen.",
    blanks: [
      {answer: "Voraus", alts: ["voraus", "Vorhinein", "vorhinein"]},
      {answer: "Nachhinein", alts: ["nachhinein"]}
    ],
    explain: "Die Zustimmung des gesetzlichen Vertreters kann gemäss Art. 19 Abs. 1 und Art. 19a ZGB im Voraus (Einwilligung) oder im Nachhinein (Genehmigung) erteilt werden. Sie kann zudem ausdrücklich oder stillschweigend erfolgen."
  },

  // --- diff 2 ---
  {
    id: "b04", topic: "beschraenkte_hu", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Ausnahmen erlauben es beschränkt Handlungsunfähigen, OHNE Zustimmung des gesetzlichen Vertreters zu handeln? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Unentgeltliche Vorteile erlangen (Art. 19 Abs. 2 ZGB)"},
      {v: "B", t: "Geringfügige Angelegenheiten des täglichen Lebens (Art. 19 Abs. 2 ZGB)"},
      {v: "C", t: "Ausübung höchstpersönlicher Rechte (Art. 19c ZGB)"},
      {v: "D", t: "Kauf eines Autos mit dem Ersparten"}
    ],
    correct: ["A", "B", "C"],
    explain: "Die Ausnahmen zur Zustimmungspflicht sind: unentgeltliche Vorteile erlangen wie Geschenke annehmen (Art. 19 Abs. 2 ZGB), geringfügige Angelegenheiten des täglichen Lebens wie z.B. ein Busbillett kaufen (Art. 19 Abs. 2 ZGB), und höchstpersönliche Rechte ausüben (Art. 19c ZGB). Der Kauf eines Autos ist weder geringfügig noch unentgeltlich und braucht daher die Zustimmung."
  },
  {
    id: "b05", topic: "beschraenkte_hu", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    context: "Die 15-jährige Vreni bekommt von ihrer Gotte Marianne ein Pferd geschenkt.",
    q: "Darf Vreni das Pferd ohne Zustimmung ihres Vaters annehmen?",
    options: [
      {v: "A", t: "Ja, denn es handelt sich um einen unentgeltlichen Vorteil (Art. 19 Abs. 2 ZGB), der keine laufenden Kosten verursacht."},
      {v: "B", t: "Ja, Geschenke können immer ohne Zustimmung angenommen werden."},
      {v: "C", t: "Nein, denn das Pferd verursacht Unterhaltskosten und ist daher kein rein unentgeltlicher Vorteil. Die Zustimmung des Vaters ist nötig."},
      {v: "D", t: "Nein, ein Pferd ist zu teuer für eine Minderjährige."}
    ],
    correct: "C",
    explain: "Obersatz: Es ist zu prüfen, ob Vreni das Pferd ohne Zustimmung ihres gesetzlichen Vertreters annehmen kann.\n\nVoraussetzungen: Vreni ist 15 und damit unmündig (Art. 14 ZGB). Als urteilsfähige Unmündige ist sie beschränkt handlungsunfähig (Art. 19 ZGB). Sie braucht grundsätzlich die Zustimmung ihres gesetzlichen Vertreters (Art. 19 Abs. 1 ZGB). Ausnahme: rein unentgeltliche Vorteile (Art. 19 Abs. 2 ZGB), also Vorteile, die keine Kosten verursachen.\n\nSubsumtion: Ein Pferd verursacht erhebliche laufende Kosten (Futter, Tierarzt, Stallmiete). Es handelt sich daher nicht um einen rein unentgeltlichen Vorteil.\n\nSchlussfolgerung: Vreni braucht die Zustimmung ihres Vaters, um das Pferd anzunehmen."
  },
  {
    id: "b06", topic: "beschraenkte_hu", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
    context: "Hansli (16, urteilsfähig) möchte mit seinem Taschengeld die neue CD von Justin Bieber für CHF 20 kaufen.",
    q: "Darf Hansli die CD alleine kaufen?",
    options: [
      {v: "A", t: "Nein, Minderjährige dürfen kein Geld ausgeben."},
      {v: "B", t: "Ja, denn der Kauf einer CD für CHF 20 ist eine geringfügige Angelegenheit des täglichen Lebens (Art. 19 Abs. 2 ZGB)."},
      {v: "C", t: "Ja, aber nur wenn er das Geld selbst verdient hat."},
      {v: "D", t: "Nein, er braucht für jeden Kauf die Zustimmung seiner Eltern."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Hansli den Kauf ohne elterliche Zustimmung tätigen kann.\n\nVoraussetzungen: Hansli ist 16 und urteilsfähig, aber unmündig — er ist beschränkt handlungsunfähig (Art. 19 ZGB). Grundsätzlich braucht er die Zustimmung seiner Eltern (Art. 19 Abs. 1 ZGB). Ausnahme: geringfügige Angelegenheiten des täglichen Lebens (Art. 19 Abs. 2 ZGB).\n\nSubsumtion: Der Kauf einer CD für CHF 20 mit Taschengeld ist eine geringfügige Angelegenheit des täglichen Lebens.\n\nSchlussfolgerung: Hansli darf die CD alleine kaufen."
  },
  {
    id: "b07", topic: "beschraenkte_hu", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was bedeutet es, wenn die Zustimmung «stillschweigend» erteilt wird?",
    options: [
      {v: "A", t: "Die Zustimmung muss vor einem Notar erfolgen."},
      {v: "B", t: "Die Zustimmung wird automatisch nach 30 Tagen erteilt."},
      {v: "C", t: "Der gesetzliche Vertreter muss schriftlich unterschreiben."},
      {v: "D", t: "Der gesetzliche Vertreter sagt nichts, obwohl er von der Handlung weiss — sein Schweigen gilt als Zustimmung."}
    ],
    correct: "D",
    explain: "Die Zustimmung des gesetzlichen Vertreters kann ausdrücklich (z.B. «Ja, du darfst das kaufen») oder stillschweigend erfolgen. Stillschweigende Zustimmung liegt vor, wenn der gesetzliche Vertreter von der Handlung weiss und nicht widerspricht. Beispiel: Die Mutter sieht, wie ihr 16-jähriger Sohn ein Töffli kauft, und sagt nichts dagegen."
  },

  // --- diff 3 ---
  {
    id: "b08", topic: "beschraenkte_hu", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Hansli (16) erhält von seinem Vater Hans ein Couvert mit Bargeld zum Geburtstag, zweckgebunden für den Kauf eines Töfflis. Am nächsten Morgen kauft Hansli das Töffli.",
    q: "Kann Hansli das Töffli alleine kaufen?",
    options: [
      {v: "A", t: "Nein, Hansli müsste mindestens 18 Jahre alt sein."},
      {v: "B", t: "Nein, ein Töffli ist zu teuer für eine geringfügige Angelegenheit."},
      {v: "C", t: "Ja, denn Hansli kann frei über geschenktes Geld verfügen."},
      {v: "D", t: "Ja, denn Hans hat mit dem zweckgebundenen Geld stillschweigend seine Zustimmung zum Kauf erteilt (Art. 19 Abs. 1 ZGB)."}
    ],
    correct: "D",
    explain: "Obersatz: Es ist zu prüfen, ob Hansli den Kauf alleine tätigen kann.\n\nVoraussetzungen: Hansli ist 16, urteilsfähig und unmündig, also beschränkt handlungsunfähig (Art. 19 ZGB). Er braucht grundsätzlich die Zustimmung seines gesetzlichen Vertreters (Art. 19 Abs. 1 ZGB).\n\nSubsumtion: Sein Vater Hans hat ihm das Geld zweckgebunden für den Kauf eines Töfflis geschenkt. Indem Hans das Geld speziell für diesen Kauf übergibt, erteilt er im Voraus seine Zustimmung zum Kauf des Töfflis.\n\nSchlussfolgerung: Hansli kann das Töffli alleine kaufen, weil die elterliche Zustimmung durch das zweckgebundene Geldgeschenk im Voraus erteilt wurde."
  },
  {
    id: "b09", topic: "beschraenkte_hu", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    context: "Hansli (16) hat das Töffli mit dem Geld seines Vaters gekauft (der Vater stimmte zu). Nun will Hansli das Töffli aber nicht mehr und möchte es gegen eine Sammlung Konsolenspiele seines Freundes Fritzli tauschen. Sein Vater ist damit nicht einverstanden.",
    q: "Darf Hansli das Töffli gegen die Spielesammlung tauschen?",
    options: [
      {v: "A", t: "Nein, weil Hansli das Töffli nicht tauschen, sondern nur verkaufen darf."},
      {v: "B", t: "Nein, denn die Zustimmung des Vaters galt nur für den Kauf des Töfflis. Für den Tausch bräuchte Hansli eine neue Zustimmung (Art. 19 Abs. 1 ZGB)."},
      {v: "C", t: "Ja, denn ein Tausch ist eine geringfügige Angelegenheit."},
      {v: "D", t: "Ja, denn das Töffli gehört Hansli, und er kann frei darüber verfügen."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Hansli ohne erneute Zustimmung des Vaters das Töffli tauschen kann.\n\nVoraussetzungen: Hansli ist beschränkt handlungsunfähig (Art. 19 ZGB). Jedes Rechtsgeschäft, das nicht unter eine Ausnahme fällt, braucht die Zustimmung des gesetzlichen Vertreters.\n\nSubsumtion: Die Zustimmung des Vaters bezog sich auf den Kauf eines Töfflis mit dem zweckgebundenen Geld. Der Tausch des Töfflis gegen Konsolenspiele ist ein neues Rechtsgeschäft. Es ist weder geringfügig noch ein unentgeltlicher Vorteil. Der Vater ist ausdrücklich nicht einverstanden.\n\nSchlussfolgerung: Hansli darf den Tausch nicht vornehmen. Ohne die Zustimmung seines Vaters wäre das Tauschgeschäft schwebend unwirksam."
  },
  {
    id: "b10", topic: "beschraenkte_hu", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
    context: "Hansli (16) fährt mit seinem Töffli zu nah am Mercedes des Nachbarn vorbei und verursacht eine grosse Schramme.",
    q: "Muss Hansli den Schaden ersetzen?",
    options: [
      {v: "A", t: "Nur seine Eltern müssen haften, nicht Hansli selbst."},
      {v: "B", t: "Ja, denn beschränkt Handlungsunfähige werden durch unerlaubte Handlungen schadenersatzpflichtig (Art. 19 Abs. 3 ZGB)."},
      {v: "C", t: "Nein, Minderjährige haften nie für Schäden."},
      {v: "D", t: "Nur wenn der Nachbar Anzeige erstattet."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Hansli für den Schaden am Mercedes haftet.\n\nVoraussetzungen: Art. 19 Abs. 3 ZGB bestimmt, dass urteilsfähige Unmündige für Schaden aus unerlaubten Handlungen ersatzpflichtig werden (Deliktsfähigkeit).\n\nSubsumtion: Hansli ist 16 und urteilsfähig. Er hat durch sein Fahrverhalten eine unerlaubte Handlung begangen und einen Schaden verursacht.\n\nSchlussfolgerung: Hansli muss den Schaden ersetzen (Art. 19 Abs. 3 ZGB). Die beschränkte Handlungsunfähigkeit schützt nur vor rechtsgeschäftlichen Verpflichtungen, nicht vor Haftung aus Delikt."
  },
  {
    id: "b11", topic: "beschraenkte_hu", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    q: "Was bedeutet «Lohn eigene Arbeit / Vermögen» als Ausnahme gemäss Art. 323 Abs. 1 ZGB?",
    options: [
      {v: "A", t: "Unmündige dürfen nur sparen, nicht ausgeben."},
      {v: "B", t: "Unmündige dürfen selbstständig über den Lohn verfügen, den sie durch eigene Arbeit verdient haben."},
      {v: "C", t: "Nur volljährige Personen dürfen über ihren Lohn verfügen."},
      {v: "D", t: "Unmündige dürfen unbegrenzt Geld ausgeben."}
    ],
    correct: "B",
    explain: "Gemäss Art. 323 Abs. 1 ZGB darf ein Unmündiger über den Ertrag seiner Arbeit (z.B. Lohn aus einem Ferienjob) frei verfügen. Dies ist eine Ausnahme zur Zustimmungspflicht nach Art. 19 Abs. 1 ZGB. Der Unmündige kann mit seinem selbst verdienten Geld eigenständig Käufe tätigen."
  },
  {
    id: "b12", topic: "beschraenkte_hu", type: "tf", diff: 1, tax: "K2",
 reviewed:false,
    q: "Beschränkt Handlungsunfähige können durch unerlaubte Handlungen schadenersatzpflichtig werden.",
    correct: true,
    explain: "Gemäss Art. 19 Abs. 3 ZGB werden urteilsfähige Unmündige durch ihre unerlaubten Handlungen (Delikte) schadenersatzpflichtig. Man spricht hier von der Deliktsfähigkeit. Dies bedeutet: Auch wenn ein 16-Jähriger nicht alle Verträge alleine abschliessen kann, haftet er dennoch, wenn er jemandem einen Schaden zufügt."
  },

  // ============================================================
  // TOPIC: persoenlichkeit
  // ============================================================

  // --- diff 1 ---
  {
    id: "p01", topic: "persoenlichkeit", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
    q: "Welcher Gesetzesartikel schützt die Persönlichkeit?",
    options: [
      {v: "A", t: "Art. 28 ZGB"},
      {v: "B", t: "Art. 19 ZGB"},
      {v: "C", t: "Art. 11 ZGB"},
      {v: "D", t: "Art. 14 ZGB"}
    ],
    correct: "A",
    explain: "Art. 28 ZGB regelt den Schutz der Persönlichkeit. Er bestimmt den Grundsatz, dass jede Verletzung der Persönlichkeit widerrechtlich ist, sofern kein Rechtfertigungsgrund vorliegt. Art. 11 ZGB regelt die Rechtsfähigkeit, Art. 14 ZGB die Mündigkeit und Art. 19 ZGB die beschränkte Handlungsunfähigkeit."
  },
  {
    id: "p02", topic: "persoenlichkeit", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
    q: "Jede Verletzung der Persönlichkeit ist gemäss Art. 28 ZGB widerrechtlich.",
    correct: true,
    explain: "Art. 28 ZGB stellt den Grundsatz auf, dass jede Verletzung der Persönlichkeit widerrechtlich ist. Allerdings kann die Widerrechtlichkeit durch einen Rechtfertigungsgrund aufgehoben werden: Einwilligung des Verletzten, überwiegendes privates oder öffentliches Interesse oder gesetzliche Erlaubnis."
  },
  {
    id: "p03", topic: "persoenlichkeit", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
    q: "Der Persönlichkeitsschutz umfasst drei Sphären: die {0}, die {1} und die {2}.",
    blanks: [
      {answer: "Gemeinsphäre", alts: ["gemeinsphäre", "Gemeinsphaere"]},
      {answer: "Privatsphäre", alts: ["privatsphäre", "Privatsphaere"]},
      {answer: "Intimsphäre", alts: ["intimsphäre", "Intimsphaere"]}
    ],
    explain: "Der Persönlichkeitsschutz von Art. 28 ZGB umfasst drei konzentrische Sphären: die Gemeinsphäre (öffentliches Auftreten, z.B. auf der Strasse), die Privatsphäre (z.B. Essen zu Hause mit der Familie) und die Intimsphäre (z.B. Duschen, Sexualität). Je näher am Kern (Intimsphäre), desto stärker ist der Schutz."
  },

  // --- diff 2 ---
  {
    id: "p04", topic: "persoenlichkeit", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche der folgenden sind Rechtfertigungsgründe für eine Persönlichkeitsverletzung? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Einwilligung des Verletzten"},
      {v: "B", t: "Überwiegendes privates oder öffentliches Interesse"},
      {v: "C", t: "Unwissenheit des Verletzers"},
      {v: "D", t: "Gesetzliche Erlaubnis (Gesetz)"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die drei Rechtfertigungsgründe für eine Persönlichkeitsverletzung gemäss Art. 28 ZGB sind: Einwilligung des Verletzten, überwiegendes privates oder öffentliches Interesse und gesetzliche Erlaubnis. Unwissenheit des Verletzers ist kein Rechtfertigungsgrund — wer die Persönlichkeit eines anderen verletzt, haftet unabhängig davon, ob er es wusste oder nicht."
  },
  {
    id: "p05", topic: "persoenlichkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
    img: {src: "img/recht/personenrecht/personenrecht_sphaeren_01.svg", alt: "Sphärenmodell des Persönlichkeitsschutzes mit drei konzentrischen Kreisen"},
    q: "Welches Beispiel fällt in die Privatsphäre?",
    options: [
      {v: "A", t: "Jemand geht auf der Strasse spazieren."},
      {v: "B", t: "Eine Familie isst gemeinsam zu Hause zu Abend."},
      {v: "C", t: "Jemand hält eine öffentliche Rede."},
      {v: "D", t: "Jemand duscht im Badezimmer."}
    ],
    correct: "B",
    explain: "Die drei Sphären: Gemeinsphäre betrifft das öffentliche Auftreten (Strasse, öffentliche Rede). Privatsphäre umfasst den engeren persönlichen Bereich (Familie zu Hause, Freundeskreis). Intimsphäre betrifft den innersten Bereich (Duschen, Sexualität). Das Familien-Abendessen zu Hause gehört zur Privatsphäre."
  },
  {
    id: "p06", topic: "persoenlichkeit", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
    q: "Welche Rechtsfolgen kann eine Persönlichkeitsverletzung nach sich ziehen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Schadenersatz"},
      {v: "B", t: "Genugtuung"},
      {v: "C", t: "Freiheitsstrafe"},
      {v: "D", t: "Verbot der drohenden Verletzung"}
    ],
    correct: ["A", "B", "D"],
    explain: "Die zivilrechtlichen Rechtsfolgen einer Persönlichkeitsverletzung nach Art. 28 ZGB umfassen: Schadenersatz, Genugtuung (Schmerzensgeld), Beseitigung der bestehenden Verletzung und Verbot einer drohenden Verletzung. Eine Freiheitsstrafe ist eine strafrechtliche Sanktion und keine direkte Folge von Art. 28 ZGB."
  },
  {
    id: "p07", topic: "persoenlichkeit", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
    q: "Ein Journalist darf den Namen eines verurteilten Straftäters in der Zeitung veröffentlichen, weil ein überwiegendes öffentliches Interesse vorliegt.",
    correct: true,
    explain: "Die Veröffentlichung des Namens eines verurteilten Straftäters kann durch ein überwiegendes öffentliches Interesse gerechtfertigt sein. Dies ist ein anerkannter Rechtfertigungsgrund gemäss Art. 28 ZGB. Allerdings ist immer eine Interessenabwägung nötig — bei weniger schweren Delikten oder bei Jugendlichen kann das Persönlichkeitsrecht überwiegen."
  },

  // --- diff 3 ---
  {
    id: "p08", topic: "persoenlichkeit", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
    context: "Lisa postet auf Instagram ein Foto von ihrer Mitschülerin Sarah im Bikini, das sie heimlich am Strand aufgenommen hat. Sarah hat dem Foto nicht zugestimmt.",
    q: "Liegt eine widerrechtliche Persönlichkeitsverletzung vor?",
    options: [
      {v: "A", t: "Ja, aber nur wenn Sarah unter 18 ist."},
      {v: "B", t: "Ja, das heimliche Fotografieren und Veröffentlichen eines Bikinifotos verletzt die Privat- oder Intimsphäre von Sarah, und es liegt kein Rechtfertigungsgrund vor."},
      {v: "C", t: "Nein, auf Instagram gelten keine Persönlichkeitsrechte."},
      {v: "D", t: "Nein, Sarah war am öffentlichen Strand — das fällt in die Gemeinsphäre."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob eine widerrechtliche Persönlichkeitsverletzung gemäss Art. 28 ZGB vorliegt.\n\nVoraussetzungen: Jede Verletzung der Persönlichkeit ist widerrechtlich (Art. 28 ZGB), es sei denn, ein Rechtfertigungsgrund liegt vor (Einwilligung, überwiegendes Interesse, Gesetz).\n\nSubsumtion: Das heimliche Fotografieren einer Person im Bikini berührt die Privat- bis Intimsphäre. Die Veröffentlichung auf Instagram ohne Zustimmung verstärkt die Verletzung. Sarah hat nicht eingewilligt, es besteht kein überwiegendes öffentliches Interesse, und kein Gesetz erlaubt dies.\n\nSchlussfolgerung: Es liegt eine widerrechtliche Persönlichkeitsverletzung vor. Sarah könnte Beseitigung (Löschung des Fotos), Schadenersatz und Genugtuung verlangen."
  },
  {
    id: "p09", topic: "persoenlichkeit", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
    context: "Ein Arbeitgeber installiert ohne Vorankündigung Videokameras in den Büros seiner Angestellten, um deren Arbeitsleistung zu überwachen.",
    q: "Liegt eine gerechtfertigte Persönlichkeitsverletzung vor?",
    options: [
      {v: "A", t: "Ja, der Arbeitgeber hat ein Weisungsrecht und darf die Arbeit überwachen."},
      {v: "B", t: "Nein, die heimliche Videoüberwachung am Arbeitsplatz verletzt die Privatsphäre der Angestellten. Ohne deren Einwilligung und ohne gesetzliche Grundlage liegt eine widerrechtliche Persönlichkeitsverletzung vor."},
      {v: "C", t: "Ja, am Arbeitsplatz hat man keine Privatsphäre."},
      {v: "D", t: "Nein, aber nur wenn die Angestellten dagegen protestieren."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Videoüberwachung eine gerechtfertigte Persönlichkeitsverletzung darstellt.\n\nVoraussetzungen: Jede Persönlichkeitsverletzung ist widerrechtlich (Art. 28 ZGB), es sei denn, ein Rechtfertigungsgrund liegt vor.\n\nSubsumtion: Die heimliche Videoüberwachung greift in die Privatsphäre der Angestellten ein. Die Angestellten haben nicht eingewilligt. Ein überwiegendes Interesse des Arbeitgebers an einer solch invasiven Massnahme ist fraglich, zumal sie ohne Vorankündigung erfolgt. Auch das Arbeitsrecht bietet keine Grundlage für heimliche Überwachung.\n\nSchlussfolgerung: Es liegt eine widerrechtliche Persönlichkeitsverletzung vor."
  },
  {
    id: "p10", topic: "persoenlichkeit", type: "tf", diff: 3, tax: "K4",
 reviewed:false,
    q: "Wenn jemand in die Veröffentlichung eines Fotos einwilligt, kann er später trotzdem eine Persönlichkeitsverletzung geltend machen.",
    correct: false,
    explain: "Die Einwilligung des Verletzten ist ein Rechtfertigungsgrund gemäss Art. 28 ZGB. Wer in die Veröffentlichung eines Fotos einwilligt, kann grundsätzlich später nicht mehr geltend machen, seine Persönlichkeit sei verletzt worden — vorausgesetzt, die Einwilligung wurde freiwillig und in Kenntnis der Sachlage erteilt und die tatsächliche Verwendung geht nicht über die Einwilligung hinaus."
  },
  {
    id: "p11", topic: "persoenlichkeit", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
    q: "Welche Sphäre geniesst den stärksten Schutz?",
    options: [
      {v: "A", t: "Die Privatsphäre"},
      {v: "B", t: "Die Intimsphäre"},
      {v: "C", t: "Alle Sphären sind gleich geschützt."},
      {v: "D", t: "Die Gemeinsphäre"}
    ],
    correct: "B",
    explain: "Die drei Sphären bilden ein Zwiebelmodell: Die Gemeinsphäre (aussen) betrifft das öffentliche Auftreten und ist am wenigsten geschützt. Die Privatsphäre (Mitte) umfasst den persönlichen Lebensbereich. Die Intimsphäre (innen) betrifft den innersten Bereich und geniesst den stärksten Schutz. Je tiefer die Verletzung in den Kern eindringt, desto schwerer wiegt sie."
  },

  // --- Sortierungsfragen ---
  {
    id: "neu_sort_01", topic: "handlungsfaehigkeit", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die folgenden Stufen der Handlungsfähigkeit nach dem Umfang der Geschäftsfähigkeit – von der geringsten zur umfassendsten.",
    items: [
      "Handlungsunfähig (z.B. Kleinkind, dauerhaft urteilsunfähige Person – keine gültigen Rechtsgeschäfte)",
      "Beschränkt handlungsunfähig (z.B. Kind ab ca. 7 Jahren – nur ausschliesslich vorteilhafte und geringfügige Geschäfte)",
      "Beschränkt handlungsfähig (z.B. 16-Jährige/r – zusätzlich Taschengeld, Arbeitslohn, BUT nur mit Zustimmung)",
      "Voll handlungsfähig (volljährig + urteilsfähig – unbeschränkte Geschäftsfähigkeit)"
    ],
    correct: [0, 1, 2, 3],
    explain: "Die Handlungsfähigkeit ist abgestuft: Handlungsunfähige können gar keine gültigen Rechtsgeschäfte vornehmen. Beschränkt Handlungsunfähige (Kinder) können nur Geschäfte tätigen, die ihnen ausschliesslich Vorteile bringen (z.B. Geschenk annehmen). Beschränkt Handlungsfähige dürfen über ihr Taschengeld/Lohn verfügen. Volle Handlungsfähigkeit setzt Volljährigkeit (18) und Urteilsfähigkeit voraus."
  },
  {
    id: "neu_sort_02", topic: "persoenlichkeit", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
    q: "Ordnen Sie die Schutzsphären der Persönlichkeit nach dem Grad des Schutzes – vom geringsten zum stärksten Schutz.",
    items: [
      "Gemeinsphäre (öffentliches Auftreten – geringster Schutz, z.B. Foto an öffentlicher Veranstaltung)",
      "Privatsphäre (persönlicher Lebensbereich – mittlerer Schutz, z.B. Familienfotos, Adresse)",
      "Intimsphäre (innerster Bereich – stärkster Schutz, z.B. Gesundheitsdaten, sexuelle Orientierung)"
    ],
    correct: [0, 1, 2],
    explain: "Das Drei-Sphären-Modell stuft den Persönlichkeitsschutz ab: Die Gemeinsphäre betrifft das öffentliche Auftreten und ist am schwächsten geschützt (Berichterstattung oft zulässig). Die Privatsphäre umfasst den persönlichen Lebensbereich und ist stärker geschützt. Die Intimsphäre geniesst den absolut stärksten Schutz – Eingriffe sind fast nie gerechtfertigt."
  },


// ===== INTERAKTIVE FRAGETYPEN =====

  {
    id: "beschriftung01", topic: "handlungsfaehigkeit", type: "bildbeschriftung", diff: 2, tax: "K2", reviewed: false,
    q: "Beschrifte das Stufenmodell der Handlungsfähigkeit mit den richtigen Begriffen und Voraussetzungen.",
    img: { src: "img/recht/personenrecht/personenrecht_handlungsfaehigkeit_beschriftung.svg", alt: "Stufenmodell der Handlungsfähigkeit: voll, beschränkt, handlungsunfähig" },
    labels: [
      { id: "l1", text: "Handlungsfähigkeit", x: 50, y: 15 },
      { id: "l2", text: "Urteilsfähigkeit + Mündigkeit", x: 50, y: 26 },
      { id: "l3", text: "Beschränkte Handlungsfähigkeit", x: 50, y: 42 },
      { id: "l4", text: "Urteilsfähig, aber unmündig (< 18 J.)", x: 50, y: 52 },
      { id: "l5", text: "Handlungsunfähigkeit", x: 50, y: 69 },
      { id: "l6", text: "Urteilsunfähig (z.B. Kleinkind)", x: 50, y: 79 }
    ],
    explain: "Handlungsfähigkeit = Urteilsfähigkeit + Mündigkeit (18 J., Art. 12–14 ZGB). Beschränkt handlungsfähig = urteilsfähig, aber unter 18 (Art. 19 ZGB). Handlungsunfähig = urteilsunfähig (Kleinkinder, schwere geistige Beeinträchtigung, Art. 16 ZGB)."
  },

  {
    id: "dragdrop01", topic: "persoenlichkeit", type: "dragdrop_bild", diff: 2, tax: "K2", reviewed: false,
    q: "Ordne die Lebensbereiche den drei Persönlichkeitsrechtssphären zu.",
    img: { src: "img/recht/personenrecht/personenrecht_sphaeren_dragdrop.svg", alt: "Drei Spalten: Geheimsphäre, Privatsphäre, Öffentliche Sphäre" },
    zones: [
      { id: "geheim", x: 2.5, y: 13.75, w: 30, h: 82.5 },
      { id: "privat", x: 35, y: 13.75, w: 30, h: 82.5 },
      { id: "oeffentlich", x: 67.5, y: 13.75, w: 30, h: 82.5 }
    ],
    labels: [
      { id: "tagebuch", text: "Tagebucheinträge", zone: "geheim" },
      { id: "arzt", text: "Arzt-Patient-Kommunikation", zone: "geheim" },
      { id: "bankgeheimnis", text: "Bankgeheimnis", zone: "geheim" },
      { id: "familienleben", text: "Familienleben", zone: "privat" },
      { id: "freundschaft", text: "Freundschaftsbeziehungen", zone: "privat" },
      { id: "wohnung", text: "Wohnung", zone: "privat" },
      { id: "beruf", text: "Berufliche Tätigkeit", zone: "oeffentlich" },
      { id: "politik", text: "Politisches Engagement", zone: "oeffentlich" }
    ],
    explain: "Geheimsphäre (stärkster Schutz): Tagebuch, Arzt-Patient, Bankgeheimnis. Privatsphäre (mittlerer Schutz): Familie, Freundschaften, Wohnung. Öffentliche Sphäre (geringster Schutz): berufliches Wirken, politisches Engagement."
  }

];
