// ============================================================
// Übungspool: Mietrecht (OR 253–274)
// Fachbereich: Recht | Stufe: SF GYM3
// Erstellt: 2026-02-21
// Basiert auf: Werkstatt Mietrecht (14 Posten), Präsentation Mietrecht
// ============================================================

window.POOL_META = {
  title: "Mietrecht – OR 253 bis 274",
  fach: "Recht",
  color: "#73ab2c",
  level: "SF GYM3",
  lernziele: [
    "Ich kann die Grundlagen des Mietvertrags (OR 253–274) erklären und den Mietvertrag von verwandten Vertragstypen abgrenzen. (K2)",
    "Ich kann die Rechte und Pflichten von Mieter und Vermieter beschreiben. (K2)",
    "Ich kann die Regeln zu Kündigung, Mängeln und Mietzins auf konkrete Fälle anwenden. (K3)",
    "Ich kann den Mieterschutz im schweizerischen Recht beurteilen. (K5)"
  ]
};

window.TOPICS = {
  "grundlagen":    {label: "Grundlagen des Mietvertrags",           short: "Grundlagen",      lernziele: ["Ich kann den Mietvertrag definieren und von Pacht, Gebrauchsleihe und Leasing abgrenzen. (K2)", "Ich kann die Hauptpflichten von Mieter und Vermieter gemäss OR nennen. (K1)"]},
  "mietzins":      {label: "Mietzins, Nebenkosten & Depot",         short: "Mietzins",        lernziele: ["Ich kann die Regeln zur Mietzinsanpassung und zur Anfechtung des Anfangsmietzinses erklären. (K2)", "Ich kann Nebenkosten von der Nettomiete abgrenzen und die Regeln zum Mietzinsdepot (OR 257e) nennen. (K2)"]},
  "kuendigung":    {label: "Kündigung & Kündigungsfristen",          short: "Kündigung",       lernziele: ["Ich kann die ordentlichen Kündigungsfristen und -termine für Wohn- und Geschäftsräume nennen (OR 266a ff.). (K1)", "Ich kann beurteilen, ob eine Kündigung formgültig und missbräuchlich ist. (K5)"]},
  "maengel":       {label: "Mängel & Reparaturen",                  short: "Mängel",          lernziele: ["Ich kann die Rechte des Mieters bei Mängeln an der Mietsache (OR 259a–259h) erklären. (K2)", "Ich kann zwischen kleinem und grossem Unterhalt unterscheiden. (K2)"]},
  "untermiete":    {label: "Untermiete & Erstreckung",              short: "Untermiete",      lernziele: ["Ich kann die Voraussetzungen der Untermiete (OR 262) und der Mieterstreckung (OR 272) erklären. (K2)", "Ich kann beurteilen, wann der Vermieter die Untermiete verweigern darf. (K3)"]},
  "uebergabe":     {label: "Wohnungsübergabe & -abgabe",            short: "Übergabe",        lernziele: ["Ich kann den Ablauf der Wohnungsübergabe und -rückgabe beschreiben. (K2)", "Ich kann die Pflichten von Mieter und Vermieter bei der Rückgabe der Mietsache erklären (OR 267). (K2)"]},
  "zusammenleben": {label: "Zusammenleben, Haustiere & Datenschutz", short: "Zusammenleben",  lernziele: ["Ich kann die Regeln zum nachbarschaftlichen Zusammenleben im Mietrecht erklären. (K2)", "Ich kann die Rechte des Mieters bezüglich Haustieren und Datenschutz einordnen. (K2)"]}
};

window.QUESTIONS = [

  // ============================================================
  // TOPIC: grundlagen (Grundlagen des Mietvertrags)
  // ============================================================

  // --- diff 1 ---
  {
    id: "g01", topic: "grundlagen", type: "mc", diff: 1, tax: "K1",
    q: "In welchen Artikeln des Obligationenrechts ist das Mietrecht geregelt?",
    options: [
      {v: "A", t: "OR 1–10"},
      {v: "B", t: "OR 253–274"},
      {v: "C", t: "OR 319–362"},
      {v: "D", t: "OR 184–215"}
    ],
    correct: "B",
    explain: "Das Mietrecht ist in den Art. 253–274 OR geregelt. Art. 319–362 OR betreffen den Arbeitsvertrag, Art. 184–215 OR den Kaufvertrag."
  },
  {
    id: "g02", topic: "grundlagen", type: "tf", diff: 1, tax: "K1",
    q: "Ein Mietvertrag muss zwingend schriftlich abgeschlossen werden.",
    correct: false,
    explain: "Der Mietvertrag ist grundsätzlich formfrei (formlos). Er kann mündlich, schriftlich oder sogar stillschweigend abgeschlossen werden. Das Gesetz schreibt keine besondere Form vor."
  },
  {
    id: "g03", topic: "grundlagen", type: "fill", diff: 1, tax: "K1",
    q: "Der Mietvertrag gehört zur Kategorie der Verträge auf {0}.",
    blanks: [
      {answer: "Gebrauchsüberlassung", alts: ["Gebrauchsueberlassung"]}
    ],
    explain: "Neben der Miete gehören auch die Gebrauchsleihe, das Darlehen und die Pacht zu den Verträgen auf Gebrauchsüberlassung."
  },
  {
    id: "g04", topic: "grundlagen", type: "mc", diff: 1, tax: "K2",
    q: "Was unterscheidet die Miete von der Pacht?",
    options: [
      {v: "A", t: "Bei der Pacht wird die Sache zum Eigentum übertragen."},
      {v: "B", t: "Bei der Pacht darf der Pächter die Sache nutzen und die Erträge daraus ziehen (z.B. Früchte eines Ackers)."},
      {v: "C", t: "Die Pacht ist immer befristet, die Miete immer unbefristet."},
      {v: "D", t: "Es gibt keinen Unterschied; die Begriffe sind austauschbar."}
    ],
    correct: "B",
    explain: "Bei der Miete wird dem Mieter der Gebrauch einer Sache überlassen. Bei der Pacht hingegen darf der Pächter die Sache nicht nur nutzen, sondern auch deren Früchte und Erträge ziehen (z.B. Landwirtschaftsbetrieb, Restaurant)."
  },

  // --- diff 2 ---
  {
    id: "g05", topic: "grundlagen", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Aussagen zum Mietrecht treffen zu? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Das Mietrecht enthält zahlreiche zwingende Vorschriften zum Schutz des Mieters."},
      {v: "B", t: "Von zwingenden Bestimmungen darf zu Gunsten des Mieters abgewichen werden."},
      {v: "C", t: "Der Mietvertrag muss immer schriftlich abgeschlossen werden."},
      {v: "D", t: "Koppelungsgeschäfte sind gemäss Art. 254 OR verboten."}
    ],
    correct: ["A", "B", "D"],
    explain: "Das Mietrecht schützt den Mieter als schwächere Partei durch zwingende Vorschriften. Abweichungen sind nur zu Gunsten des Mieters möglich, nicht zu seinen Ungunsten. Der Mietvertrag ist grundsätzlich formfrei (C ist falsch). Koppelungsgeschäfte sind nach Art. 254 OR verboten."
  },
  {
    id: "g06", topic: "grundlagen", type: "mc", diff: 2, tax: "K2",
    q: "Was ist die Hauptpflicht des Vermieters gemäss OR 253?",
    options: [
      {v: "A", t: "Die Mietsache dem Mieter zum Gebrauch überlassen und in einem tauglichen Zustand erhalten."},
      {v: "B", t: "Dem Mieter das Eigentum an der Mietsache übertragen."},
      {v: "C", t: "Die Nebenkosten für den Mieter bezahlen."},
      {v: "D", t: "Die Wohnung jährlich renovieren."}
    ],
    correct: "A",
    explain: "Nach Art. 253 und Art. 256 OR ist der Vermieter verpflichtet, die Mietsache dem Mieter in einem zum vorausgesetzten Gebrauch tauglichen Zustand zu übergeben und in diesem Zustand zu erhalten."
  },
  {
    id: "g07", topic: "grundlagen", type: "multi", diff: 2, tax: "K2",
    q: "Welches sind Pflichten des Mieters? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Mietzins bezahlen"},
      {v: "B", t: "Sorgfältig mit der Mietsache umgehen"},
      {v: "C", t: "Rücksicht auf Hausbewohner und Nachbarn nehmen"},
      {v: "D", t: "Die Wohnung jährlich streichen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Nach Art. 257 ff. OR muss der Mieter den Mietzins bezahlen, die Mietsache sorgfältig gebrauchen (Art. 257f OR) und auf Hausbewohner und Nachbarn Rücksicht nehmen. Eine jährliche Streichpflicht besteht nicht."
  },

  // --- diff 3 ---
  {
    id: "g08", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
    context: "Lisa unterschreibt einen Mietvertrag für eine 3-Zimmer-Wohnung. Der Vertrag enthält eine Klausel, die besagt: «Der Mieter verzichtet auf das Recht, bei der Schlichtungsbehörde eine Mietzinssenkung zu beantragen.»",
    q: "Ist diese Vertragsklausel gültig?",
    options: [
      {v: "A", t: "Ja, Vertragsfreiheit erlaubt solche Klauseln."},
      {v: "B", t: "Nein, da das Recht auf Mietzinssenkung eine zwingende Bestimmung ist und nicht zum Nachteil des Mieters wegbedungen werden kann."},
      {v: "C", t: "Ja, aber nur wenn Lisa die Klausel eigenhändig unterschrieben hat."},
      {v: "D", t: "Nein, weil Mietverträge generell keine Zusatzklauseln enthalten dürfen."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Vertragsklausel gültig ist. Voraussetzungen: Das Mietrecht enthält zahlreiche zwingende Vorschriften zum Schutz des Mieters. Art. 270a OR (Mietzinsherabsetzung) ist eine solche zwingende Bestimmung. Subsumtion: Von zwingenden Bestimmungen darf nur zu Gunsten der schwächeren Partei (Mieter) abgewichen werden, nicht zu ihren Ungunsten. Ein Verzicht auf das Recht zur Mietzinssenkung benachteiligt den Mieter. Schlussfolgerung: Die Klausel ist nichtig."
  },
  {
    id: "g09", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
    context: "Marco und sein Vermieter haben mündlich einen Mietvertrag abgeschlossen. Nach einem Monat behauptet der Vermieter, der vereinbarte Mietzins sei CHF 1'500 gewesen. Marco ist überzeugt, dass man sich auf CHF 1'300 geeinigt hat.",
    q: "Welche rechtliche Problematik ergibt sich hier?",
    options: [
      {v: "A", t: "Der Vertrag ist ungültig, weil er nicht schriftlich ist."},
      {v: "B", t: "Es handelt sich um ein Beweisproblem: Da der Vertrag mündlich abgeschlossen wurde, kann keine der Parteien die genaue Vereinbarung beweisen."},
      {v: "C", t: "Im Zweifel gilt immer die Aussage des Vermieters."},
      {v: "D", t: "Ein mündlicher Mietvertrag wird automatisch nach einem Monat ungültig."}
    ],
    correct: "B",
    explain: "Der Mietvertrag ist grundsätzlich formfrei und daher auch mündlich gültig. Das Problem liegt in der Beweisbarkeit: Ohne schriftlichen Vertrag kann keine Partei den vereinbarten Mietzins eindeutig beweisen. Dies zeigt, weshalb ein schriftlicher Vertrag zwar nicht rechtlich vorgeschrieben, aber praktisch sehr empfehlenswert ist."
  },
  {
    id: "g10", topic: "grundlagen", type: "tf", diff: 2, tax: "K2",
    q: "Ein Mietvertrag kann sowohl auf bestimmte als auch auf unbestimmte Zeit abgeschlossen werden (Art. 255 OR).",
    correct: true,
    explain: "Gemäss Art. 255 OR kann die Miete auf bestimmte oder unbestimmte Zeit eingegangen werden. Befristete Mietverträge enden automatisch mit Ablauf der vereinbarten Dauer (Art. 266 OR). Unbefristete Mietverträge enden durch Kündigung."
  },

  // ============================================================
  // TOPIC: mietzins (Mietzins, Nebenkosten & Depot)
  // ============================================================

  // --- diff 1 ---
  {
    id: "m01", topic: "mietzins", type: "mc", diff: 1, tax: "K1",
    q: "Wie hoch darf das Mietzinsdepot (Kaution) maximal sein?",
    options: [
      {v: "A", t: "1 Monatsmiete"},
      {v: "B", t: "2 Monatsmieten"},
      {v: "C", t: "3 Monatsmieten"},
      {v: "D", t: "6 Monatsmieten"}
    ],
    correct: "C",
    explain: "Gemäss Art. 257e OR darf der Vermieter ein Depot von maximal drei Bruttomieten verlangen. Das Depot wird auf einem Sperrkonto im Namen des Mieters hinterlegt und muss spätestens ein Jahr nach dem Auszug zurückerstattet werden."
  },
  {
    id: "m02", topic: "mietzins", type: "tf", diff: 1, tax: "K1",
    q: "Nebenkosten sind automatisch im Mietzins inbegriffen, wenn nichts anderes vereinbart ist.",
    correct: true,
    explain: "Wird im Mietvertrag nichts anderes vereinbart, sind die Nebenkosten mit dem Mietzins abgegolten. Sollen Nebenkosten separat bezahlt werden, müssen diese im Vertrag einzeln aufgeführt werden (Art. 257a OR)."
  },
  {
    id: "m03", topic: "mietzins", type: "fill", diff: 1, tax: "K1",
    q: "Ein gängiger Richtwert besagt, dass der Mietzins maximal einen {0} des Bruttoeinkommens ausmachen sollte.",
    blanks: [
      {answer: "Drittel", alts: ["1/3", "dritten Teil"]}
    ],
    explain: "Nach der Budgetberatung Schweiz sollte der gesamte Mietzins inklusive Nebenkosten maximal ein Drittel des Bruttoeinkommens betragen. Viele Verwaltungen nutzen diesen Richtwert bei der Prüfung von Mietbewerbungen."
  },

  // --- diff 2 ---
  {
    id: "m04", topic: "mietzins", type: "mc", diff: 2, tax: "K2",
    q: "Welcher Gesetzesartikel regelt das Herabsetzungsbegehren des Mieters bei gesunkenem Referenzzinssatz?",
    options: [
      {v: "A", t: "Art. 253 OR"},
      {v: "B", t: "Art. 270a OR"},
      {v: "C", t: "Art. 266c OR"},
      {v: "D", t: "Art. 259 OR"}
    ],
    correct: "B",
    explain: "Art. 270a OR regelt das Recht des Mieters, eine Herabsetzung des Mietzinses zu verlangen, wenn sich die Berechnungsgrundlage wesentlich verändert hat (z.B. Senkung des Referenzzinssatzes)."
  },
  {
    id: "m05", topic: "mietzins", type: "mc", diff: 2, tax: "K3",
    context: "Die Familie Lachmann hat vor einigen Jahren eine Wohnung gemietet, wobei der Referenzzinssatz damals bei 3% lag. Mittlerweile ist er auf 2.25% gesunken. Der Vermieter hat den Mietzins nicht angepasst.",
    q: "Was muss die Familie Lachmann als Erstes tun, um eine Mietzinssenkung zu erreichen?",
    options: [
      {v: "A", t: "Sofort die Schlichtungsbehörde einschalten."},
      {v: "B", t: "Dem Vermieter ein schriftliches Herabsetzungsbegehren zusenden."},
      {v: "C", t: "Den Mietzins eigenmächtig kürzen."},
      {v: "D", t: "Die Wohnung kündigen."}
    ],
    correct: "B",
    explain: "Der erste Schritt ist ein schriftliches Herabsetzungsbegehren an den Vermieter. Dann muss man 30 Tage auf seine Stellungnahme warten. Reagiert der Vermieter nicht oder lehnt ab, kann der Mieter innert 30 Tagen die Schlichtungsbehörde anrufen (Art. 270a OR). Eine eigenmächtige Mietzinskürzung ist nicht zulässig."
  },
  {
    id: "m06", topic: "mietzins", type: "multi", diff: 2, tax: "K2",
    q: "Welche Nebenkosten müssen im Mietvertrag einzeln aufgeführt werden, damit sie separat verrechnet werden dürfen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Warmwasser und Heizung"},
      {v: "B", t: "Hauswartung"},
      {v: "C", t: "Allgemeinstrom"},
      {v: "D", t: "Alle oben genannten"}
    ],
    correct: ["D"],
    explain: "Gemäss Art. 257a OR müssen alle Nebenkosten, die separat abgerechnet werden sollen, einzeln im Vertrag aufgeführt sein. Dazu gehören z.B. Warmwasser, Heizung, Hauswartung, Allgemeinstrom, Kabelfernsehen etc. Sind sie nicht aufgeführt, gelten sie als mit dem Mietzins abgegolten."
  },

  // --- diff 3 ---
  {
    id: "m07", topic: "mietzins", type: "mc", diff: 3, tax: "K4",
    context: "Der Vermieter schreibt seiner Mieterin per normalem Brief: «Wir teilen Ihnen mit, dass wir den Mietzins auf Anfang April um CHF 100 auf CHF 2'500 anheben müssen.»",
    q: "Ist diese Mietzinserhöhung rechtsgültig?",
    options: [
      {v: "A", t: "Ja, ein Brief reicht als Mitteilung aus."},
      {v: "B", t: "Nein, eine Mietzinserhöhung muss auf dem offiziellen kantonalen Formular mitgeteilt und begründet werden."},
      {v: "C", t: "Ja, aber nur wenn die Mieterin nicht widerspricht."},
      {v: "D", t: "Nein, Mietzinserhöhungen sind generell verboten."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Mietzinserhöhung formgültig ist. Voraussetzungen: Gemäss Art. 269d OR muss eine Mietzinserhöhung auf dem vom Kanton genehmigten Formular mitgeteilt und begründet werden. Subsumtion: Der Vermieter hat lediglich einen normalen Brief geschickt, nicht das offizielle Formular verwendet. Schlussfolgerung: Die Mietzinserhöhung ist formungültig und damit nichtig."
  },
  {
    id: "m08", topic: "mietzins", type: "mc", diff: 3, tax: "K5",
    context: "Die Familie Lachmann hat erfolgreich beim Vermieter ein Herabsetzungsbegehren eingereicht, doch der Vermieter lehnt ab. Die 30-tägige Frist läuft.",
    q: "Wie lautet die korrekte Reihenfolge der weiteren Schritte?",
    options: [
      {v: "A", t: "Regionalgericht → Schlichtungsbehörde → Bundesgericht"},
      {v: "B", t: "Schlichtungsbehörde → falls keine Einigung: Regionalgericht"},
      {v: "C", t: "Mietzins eigenständig kürzen → Schlichtungsbehörde"},
      {v: "D", t: "Anwalt beauftragen → Polizei einschalten"}
    ],
    correct: "B",
    explain: "Nach der Ablehnung des Herabsetzungsbegehrens kann der Mieter innert 30 Tagen die Schlichtungsbehörde anrufen. Wird dort keine Einigung erzielt, kann er innert 30 Tagen sein Begehren dem Regionalgericht vorbringen. Eine eigenmächtige Mietzinskürzung ist nicht zulässig."
  },
  {
    id: "m09", topic: "mietzins", type: "tf", diff: 2, tax: "K2",
    q: "Wer nicht genügend Geld für das Mietzinsdepot aufbringen kann, hat die Möglichkeit, eine Mietkautionsversicherung abzuschliessen.",
    correct: true,
    explain: "Eine Mietkautionsversicherung übernimmt das Depot gegen eine jährliche Prämie. Vorsicht: Solche Versicherungen funktionieren nicht wie Haftpflichtversicherungen — ausstehende Mieten werden zwar bis zur Kautionssumme übernommen, aber mit Gebühren und Verzugszinsen vom Mieter zurückgefordert."
  },

  // ============================================================
  // TOPIC: kuendigung (Kündigung & Kündigungsfristen)
  // ============================================================

  // --- diff 1 ---
  {
    id: "k01", topic: "kuendigung", type: "fill", diff: 1, tax: "K1",
    q: "Die gesetzliche Kündigungsfrist für Wohnungen beträgt {0} Monate (Art. 266c OR).",
    blanks: [
      {answer: "3", alts: ["drei"]}
    ],
    explain: "Gemäss Art. 266c OR beträgt die Kündigungsfrist für Wohnungen drei Monate. Fehlt ein Ortsgebrauch, kann auf einen ortsüblichen Termin oder auf das Ende einer dreimonatigen Mietdauer gekündigt werden."
  },
  {
    id: "k02", topic: "kuendigung", type: "mc", diff: 1, tax: "K1",
    q: "In welcher Form muss eine Kündigung des Mietverhältnisses erfolgen?",
    options: [
      {v: "A", t: "Mündlich genügt."},
      {v: "B", t: "Schriftlich (Art. 266l OR)."},
      {v: "C", t: "Per E-Mail."},
      {v: "D", t: "Öffentlich beurkundet."}
    ],
    correct: "B",
    explain: "Gemäss Art. 266l Abs. 1 OR muss die Kündigung schriftlich erfolgen. Bei Wohnungen muss der Vermieter zudem das offizielle Formular verwenden (Art. 266l Abs. 2 OR). Die Kündigung ist eine empfangsbedürftige Willenserklärung."
  },
  {
    id: "k03", topic: "kuendigung", type: "mc", diff: 1, tax: "K1",
    q: "Wie lange beträgt die gesetzliche Kündigungsfrist für Geschäftsräume (Art. 266d OR)?",
    options: [
      {v: "A", t: "1 Monat"},
      {v: "B", t: "3 Monate"},
      {v: "C", t: "6 Monate"},
      {v: "D", t: "12 Monate"}
    ],
    correct: "C",
    explain: "Gemäss Art. 266d OR beträgt die Kündigungsfrist für Geschäftsräume sechs Monate. Für Wohnungen sind es drei Monate (Art. 266c OR), für möblierte Zimmer und Parkplätze zwei Wochen (Art. 266e OR)."
  },

  // --- diff 2 ---
  {
    id: "k04", topic: "kuendigung", type: "mc", diff: 2, tax: "K3",
    context: "Gabriel wohnt in Höfen bei Thun. Heute, am 15. Februar, beschliesst er, seine Wohnung zu kündigen. Es sind keine besonderen Termine oder Fristen vereinbart. Die Kündigungstermine gemäss Ortsgebrauch (Region Bern-Thun) sind der 30. April und der 31. Oktober.",
    q: "Auf welchen Termin kann Gabriel frühestens kündigen?",
    options: [
      {v: "A", t: "30. April (Kündigung bis Ende Januar nötig — Termin bereits verpasst). Nächstmöglich: 31. Oktober."},
      {v: "B", t: "31. Mai"},
      {v: "C", t: "30. April"},
      {v: "D", t: "28. Februar"}
    ],
    correct: "A",
    explain: "In der Region Bern-Thun gelten die Kündigungstermine 30. April und 31. Oktober (Ortsgebrauch). Die Kündigungsfrist beträgt 3 Monate. Für den 30. April hätte die Kündigung bis spätestens 31. Januar beim Vermieter eingehen müssen. Da Gabriel erst am 15. Februar kündigt, ist dieser Termin verpasst. Der nächste Termin ist der 31. Oktober (Kündigung muss bis 31. Juli eingehen)."
  },
  {
    id: "k05", topic: "kuendigung", type: "multi", diff: 2, tax: "K2",
    q: "Welche Voraussetzungen muss ein Nachmieter gemäss Art. 264 OR erfüllen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Er muss dem Vermieter zumutbar sein."},
      {v: "B", t: "Er muss zahlungsfähig sein."},
      {v: "C", t: "Er muss bereit sein, den Vertrag zu den gleichen Bedingungen zu übernehmen."},
      {v: "D", t: "Er muss vom gleichen Geschlecht wie der bisherige Mieter sein."}
    ],
    correct: ["A", "B", "C"],
    explain: "Nach Art. 264 Abs. 1 OR kann der Mieter vorzeitig aus dem Vertrag aussteigen, wenn er einen zumutbaren, zahlungsfähigen Nachmieter vorschlägt, der bereit ist, den Vertrag zu den gleichen Bedingungen zu übernehmen. Das Geschlecht spielt keine Rolle."
  },
  {
    id: "k06", topic: "kuendigung", type: "mc", diff: 2, tax: "K2",
    q: "Was passiert, wenn eine Kündigung zu spät abgeschickt wird und der Termin verpasst wird?",
    options: [
      {v: "A", t: "Die Kündigung ist ungültig und wird ignoriert."},
      {v: "B", t: "Die Kündigung gilt auf den nächsten ordentlichen Termin (Art. 266a OR)."},
      {v: "C", t: "Der Vermieter muss die Kündigung trotzdem akzeptieren."},
      {v: "D", t: "Der Mieter muss eine Strafe bezahlen."}
    ],
    correct: "B",
    explain: "Gemäss Art. 266a OR gilt eine verspätete Kündigung nicht auf den verpassten Termin, sondern auf den nächstfolgenden Kündigungstermin."
  },
  {
    id: "k07", topic: "kuendigung", type: "tf", diff: 2, tax: "K2",
    q: "Kündigungsfristen können vertraglich verlängert, aber nicht verkürzt werden (Art. 266a Abs. 1 OR).",
    correct: true,
    explain: "Gemäss Art. 266a Abs. 1 OR können die Parteien längere, aber nicht kürzere Kündigungsfristen vereinbaren. Dies dient dem Schutz beider Parteien, insbesondere des Mieters."
  },

  // --- diff 3 ---
  {
    id: "k08", topic: "kuendigung", type: "mc", diff: 3, tax: "K3",
    context: "Sandra unterzeichnet am 15. Oktober einen Mietvertrag für eine 2-Zimmer-Wohnung in Bern. Der Vertrag beginnt am 1. November und ist kündbar mit einer Frist von 3 Monaten, jeweils auf Ende eines Monats. Wenige Tage nach Vertragsunterzeichnung erhält sie ein Jobangebot in Zürich und will den Vertrag sofort wieder kündigen.",
    q: "Bis wann muss Sandra mindestens die Miete bezahlen?",
    options: [
      {v: "A", t: "Bis Ende November (1 Monat)"},
      {v: "B", t: "Bis Ende Januar (3 volle Monate ab Mietbeginn)"},
      {v: "C", t: "Bis Ende Februar"},
      {v: "D", t: "Sie kann den Vertrag vor Mietbeginn kostenfrei stornieren."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ab wann Sandra den Vertrag beenden kann. Voraussetzungen: Der Vertrag ist gültig abgeschlossen. Die Kündigungsfrist beträgt 3 Monate auf Ende eines Monats. Subsumtion: Selbst wenn Sandra sofort kündigt, läuft die 3-monatige Frist ab November. Die Kündigung wirkt frühestens auf Ende Januar. Schlussfolgerung: Sandra muss die Miete bis Ende Januar bezahlen. Alternativ könnte sie einen zumutbaren Nachmieter stellen (Art. 264 OR)."
  },
  {
    id: "k09", topic: "kuendigung", type: "mc", diff: 3, tax: "K3",
    context: "Ein Mieter stirbt unerwartet. Seine Erben sind unsicher, was mit dem Mietvertrag geschieht.",
    q: "Was gilt gemäss Art. 266i OR beim Tod des Mieters?",
    options: [
      {v: "A", t: "Der Mietvertrag endet automatisch mit dem Tod."},
      {v: "B", t: "Die Erben treten in das Mietverhältnis ein und können mit der gesetzlichen Frist kündigen, auch wenn vertraglich eine längere Frist gilt."},
      {v: "C", t: "Der Vermieter muss den Vertrag sofort auflösen."},
      {v: "D", t: "Der Vertrag wird für ein Jahr eingefroren."}
    ],
    correct: "B",
    explain: "Gemäss Art. 266i OR geht das Mietverhältnis auf die Erben über. Die Erben können den Vertrag mit der gesetzlichen Kündigungsfrist (3 Monate bei Wohnungen) auf den nächsten gesetzlichen Termin kündigen — auch wenn vertraglich eine längere Frist vereinbart wurde. Tun die Erben nichts, läuft der Vertrag weiter und sie müssen die Miete bezahlen."
  },
  {
    id: "k10", topic: "kuendigung", type: "mc", diff: 2, tax: "K2",
    q: "Bei welchem Mietobjekt beträgt die Kündigungsfrist nur zwei Wochen (Art. 266e OR)?",
    options: [
      {v: "A", t: "Wohnungen"},
      {v: "B", t: "Geschäftsräume"},
      {v: "C", t: "Möblierte Zimmer und Parkplätze"},
      {v: "D", t: "Einfamilienhäuser"}
    ],
    correct: "C",
    explain: "Gemäss Art. 266e OR beträgt die Kündigungsfrist für möblierte Zimmer und gesondert vermietete Einstellplätze oder ähnliches zwei Wochen auf Ende eines Monats nach Beginn der Miete."
  },
  {
    id: "k11", topic: "kuendigung", type: "tf", diff: 3, tax: "K4",
    q: "Eine Kündigung der Familienwohnung durch den Vermieter ist nur rechtskräftig, wenn sie beiden Ehepartnern separat zugestellt wird — selbst wenn nur ein Ehepartner den Mietvertrag unterschrieben hat (Art. 266n/266m OR).",
    correct: true,
    explain: "Gemäss Art. 266m und 266n OR muss die Kündigung bei Familienwohnungen beiden Ehegatten bzw. eingetragenen Partnern separat zugestellt werden. Dies gilt auch dann, wenn nur ein Partner den Mietvertrag unterzeichnet hat. Die Kündigung durch den Mieter ist ebenfalls nur gültig, wenn beide zustimmen."
  },

  // ============================================================
  // TOPIC: maengel (Mängel & Reparaturen)
  // ============================================================

  // --- diff 1 ---
  {
    id: "r01", topic: "maengel", type: "mc", diff: 1, tax: "K1",
    q: "In welchen Artikeln des OR ist das Vorgehen bei Mängeln an der Mietsache geregelt?",
    options: [
      {v: "A", t: "Art. 253–255 OR"},
      {v: "B", t: "Art. 259–259i OR"},
      {v: "C", t: "Art. 266–266o OR"},
      {v: "D", t: "Art. 270–270e OR"}
    ],
    correct: "B",
    explain: "Die Art. 259 bis 259i OR regeln die Mängelrechte des Mieters: vom kleinen Unterhalt (Art. 259 OR) über die Pflichten bei grösseren Mängeln (Art. 259a ff. OR) bis zur Hinterlegung des Mietzinses (Art. 259g–h OR)."
  },
  {
    id: "r02", topic: "maengel", type: "tf", diff: 1, tax: "K2",
    q: "Kleine Mängel, die durch gewöhnlichen Unterhalt behoben werden können (z.B. eine Glühbirne wechseln), muss der Mieter auf eigene Kosten beheben (Art. 259 OR).",
    correct: true,
    explain: "Gemäss Art. 259 OR ist der Mieter für den gewöhnlichen Unterhalt der Mietsache verantwortlich. Darunter fallen kleine Reparaturen, die jeder selbst erledigen kann (z.B. Glühbirne ersetzen, verstopften Abfluss reinigen). Sobald ein Fachmann nötig ist, handelt es sich nicht mehr um gewöhnlichen Unterhalt."
  },
  {
    id: "r03", topic: "maengel", type: "fill", diff: 1, tax: "K1",
    q: "Gemäss Art. 257f OR hat der Mieter eine {0}: Er muss dem Vermieter Schäden an der Mietsache mitteilen.",
    blanks: [
      {answer: "Meldepflicht", alts: ["Anzeigepflicht"]}
    ],
    explain: "Der Mieter muss Mängel und Schäden dem Vermieter melden (Meldepflicht nach Art. 257f und 257g OR). Unterlässt er dies und vergrössert sich der Schaden, kann er dafür haftbar gemacht werden."
  },

  // --- diff 2 ---
  {
    id: "r04", topic: "maengel", type: "multi", diff: 2, tax: "K2",
    q: "Welche Rechte hat der Mieter bei einem Mangel, den er nicht selbst verschuldet hat und der nicht durch gewöhnlichen Unterhalt behoben werden kann (Art. 259a–259f OR)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Beseitigung des Mangels auf Kosten des Vermieters verlangen"},
      {v: "B", t: "Eine Reduktion des Mietzinses verlangen, bis der Mangel behoben ist"},
      {v: "C", t: "Schadenersatz verlangen für Schäden an seinem Eigentum"},
      {v: "D", t: "Den Vermieter strafrechtlich anzeigen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Bei Mängeln, die der Mieter nicht zu verantworten hat und die er nicht selber beheben muss, kann er gemäss Art. 259a–259f OR: die Mängelbeseitigung verlangen (259b), eine Mietzinsherabsetzung fordern (259d), Schadenersatz verlangen (259e), und unter Umständen fristlos kündigen (259b lit. a). Eine strafrechtliche Anzeige ist in diesem Zusammenhang nicht vorgesehen."
  },
  {
    id: "r05", topic: "maengel", type: "mc", diff: 2, tax: "K3",
    context: "In der Wohnung der Familie Kunz tropft seit Tagen Wasser von der Decke. Die Verwaltung reagiert nicht auf Meldungen. Die Familie hat den Schaden gemeldet und eine Frist zur Behebung gesetzt, aber es passiert nichts.",
    q: "Welche letzte Druckmöglichkeit hat Frau Kunz nach Art. 259g und 259h OR?",
    options: [
      {v: "A", t: "Die Miete eigenmächtig kürzen"},
      {v: "B", t: "Den Mietzins bei einer von der Schlichtungsbehörde bezeichneten Stelle hinterlegen"},
      {v: "C", t: "Die Wohnung auf eigene Kosten renovieren"},
      {v: "D", t: "Den Mietvertrag mündlich kündigen"}
    ],
    correct: "B",
    explain: "Gemäss Art. 259g und 259h OR kann der Mieter den Mietzins bei einer amtlichen Stelle hinterlegen (Mietzinshinterlegung), wenn der Vermieter einen Mangel trotz Aufforderung nicht behebt. Der Mieter muss dies dem Vermieter schriftlich androhen. Die Hinterlegung setzt den Vermieter unter Druck, den Mangel zu beheben, ohne dass der Mieter seinen Mietzins schuldig bleibt."
  },

  // --- diff 3 ---
  {
    id: "r06", topic: "maengel", type: "mc", diff: 3, tax: "K4",
    context: "Die Familie Kunz wohnt seit 8 Jahren in einer 4½-Zimmer-Wohnung. Plötzlich tropft Wasser von der Decke. Der Vermieter behauptet, die Familie müsse den Schaden selbst beheben.",
    q: "Prüfen Sie die Tatbestandsmerkmale: Handelt es sich um einen Mangel nach Art. 259 OR (gewöhnlicher Unterhalt) oder nach Art. 259a OR (Mängelbeseitigung durch Vermieter)?",
    options: [
      {v: "A", t: "Art. 259 OR: Es handelt sich um gewöhnlichen Unterhalt, den der Mieter selbst beheben muss."},
      {v: "B", t: "Art. 259a OR: Der Mangel ist nicht vom Mieter verschuldet, kann nicht durch gewöhnlichen Unterhalt behoben werden, und stört den Gebrauch der Wohnung."},
      {v: "C", t: "Weder noch: Wasserschäden sind nicht durch das Mietrecht geregelt."},
      {v: "D", t: "Art. 259 OR und 259a OR gleichzeitig."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Art. 259 oder Art. 259a OR anwendbar ist. Voraussetzungen Art. 259: Gewöhnlicher Unterhalt = einfache Arbeiten, die jeder selbst erledigen kann. Voraussetzungen Art. 259a: (1) Mangel nicht vom Mieter verschuldet, (2) nicht durch gewöhnlichen Unterhalt behebbar, (3) Mieter wird im Gebrauch gestört. Subsumtion: Ein tropfendes Dach oder eine defekte Wasserleitung erfordert einen Fachmann und ist kein gewöhnlicher Unterhalt. Die Familie hat den Schaden nicht verursacht und wird im Gebrauch der Wohnung erheblich gestört. Schlussfolgerung: Art. 259a OR ist anwendbar. Die Familie kann die Mängelbeseitigung, Mietzinsreduktion und Schadenersatz verlangen."
  },
  {
    id: "r07", topic: "maengel", type: "tf", diff: 2, tax: "K2",
    q: "Der Mieter darf den Mangel auch selbst beheben lassen und die Kosten dem Vermieter in Rechnung stellen, wenn dieser trotz Fristsetzung nicht handelt (Art. 259b OR).",
    correct: true,
    explain: "Gemäss Art. 259b lit. b OR kann der Mieter bei einem Mangel, den der Vermieter kennt und trotz Fristsetzung nicht behebt, den Mangel auf Kosten des Vermieters selbst beseitigen lassen (Ersatzvornahme)."
  },
  {
    id: "r08", topic: "maengel", type: "mc", diff: 3, tax: "K5",
    context: "In Linas Mietwohnung fällt die Heizung im Januar aus. Sie meldet dies sofort dem Vermieter und setzt eine Frist von einer Woche. Der Vermieter reagiert nicht.",
    q: "Welche der folgenden Vorgehensweisen wäre für Lina am sinnvollsten?",
    options: [
      {v: "A", t: "Abwarten und hoffen, dass der Vermieter von selbst handelt."},
      {v: "B", t: "Die Heizung selbst reparieren lassen (Ersatzvornahme nach Art. 259b OR), Mietzinsreduktion verlangen (Art. 259d OR) und Schadenersatz geltend machen (Art. 259e OR)."},
      {v: "C", t: "Sofort ausziehen, ohne den Mietvertrag zu kündigen."},
      {v: "D", t: "Den Mietzins ohne Ankündigung auf ein Privatkonto einzahlen."}
    ],
    correct: "B",
    explain: "Bei einem schwerwiegenden Mangel wie einem Heizungsausfall im Winter kann Lina: (1) den Mangel nach Fristablauf selbst beheben lassen und die Kosten dem Vermieter in Rechnung stellen (Art. 259b OR), (2) eine Mietzinsreduktion für die Zeit der Beeinträchtigung verlangen (Art. 259d OR), und (3) Schadenersatz fordern, z.B. für ein Heizgerät (Art. 259e OR). Eine Hinterlegung wäre auf ein amtliches Konto nötig, nicht auf ein Privatkonto."
  },

  // ============================================================
  // TOPIC: untermiete (Untermiete & Erstreckung)
  // ============================================================

  // --- diff 1 ---
  {
    id: "u01", topic: "untermiete", type: "mc", diff: 1, tax: "K1",
    q: "In welchem Artikel des OR ist die Untermiete geregelt?",
    options: [
      {v: "A", t: "Art. 254 OR"},
      {v: "B", t: "Art. 259 OR"},
      {v: "C", t: "Art. 262 OR"},
      {v: "D", t: "Art. 272 OR"}
    ],
    correct: "C",
    explain: "Die Untermiete ist in Art. 262 OR geregelt. Der Mieter darf die Mietsache mit Zustimmung des Vermieters ganz oder teilweise untervermieten."
  },
  {
    id: "u02", topic: "untermiete", type: "tf", diff: 1, tax: "K1",
    q: "Zwischen dem Vermieter und dem Untermieter besteht eine direkte Rechtsbeziehung.",
    correct: false,
    explain: "Zwischen dem Vermieter und dem Untermieter besteht keine direkte Rechtsbeziehung. Der Hauptmieter bleibt Vertragspartner des Vermieters und haftet für den Mietzins und die Sorgfaltspflicht. Der Untermieter steht nur zum Hauptmieter in einem Vertragsverhältnis."
  },
  {
    id: "u03", topic: "untermiete", type: "tf", diff: 1, tax: "K2",
    q: "Der Mieter benötigt grundsätzlich die Zustimmung des Vermieters, bevor er untervermieten darf.",
    correct: true,
    explain: "Gemäss Art. 262 Abs. 1 OR darf der Mieter die Mietsache nur mit Zustimmung des Vermieters ganz oder teilweise untervermieten."
  },

  // --- diff 2 ---
  {
    id: "u04", topic: "untermiete", type: "multi", diff: 2, tax: "K2",
    q: "In welchen Fällen kann der Vermieter die Zustimmung zur Untermiete verweigern (Art. 262 Abs. 2 OR)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Wenn der Mieter dem Vermieter die Bedingungen der Untermiete nicht bekannt gibt."},
      {v: "B", t: "Wenn die Bedingungen der Untermiete im Vergleich zum Hauptmietvertrag missbräuchlich sind."},
      {v: "C", t: "Wenn dem Vermieter aus der Untermiete wesentliche Nachteile entstehen."},
      {v: "D", t: "Wenn der Untermieter eine andere Nationalität hat als der Hauptmieter."}
    ],
    correct: ["A", "B", "C"],
    explain: "Gemäss Art. 262 Abs. 2 OR kann der Vermieter die Zustimmung verweigern, wenn: (a) der Mieter die Bedingungen nicht offenlegt, (b) die Bedingungen missbräuchlich sind (z.B. überhöhter Untermietzins), oder (c) dem Vermieter wesentliche Nachteile entstehen. Die Nationalität ist kein zulässiger Verweigerungsgrund."
  },
  {
    id: "u05", topic: "untermiete", type: "mc", diff: 2, tax: "K3",
    context: "Linus hat eine Wohnung für CHF 1'350 pro Monat gemietet. Er vermietet zwei Zimmer an seine Studienkollegen für je CHF 700 — also insgesamt CHF 1'400.",
    q: "Darf der Vermieter diese Untermiete verbieten?",
    options: [
      {v: "A", t: "Nein, Untermiete ist immer erlaubt."},
      {v: "B", t: "Ja, weil die Bedingungen missbräuchlich sind: Linus verdient an der Untermiete, da der Gesamtbetrag der Untermieten den Hauptmietzins übersteigt."},
      {v: "C", t: "Nein, die Untermietpreise sind Sache des Hauptmieters."},
      {v: "D", t: "Ja, weil Studierende keine zuverlässigen Mieter sind."}
    ],
    correct: "B",
    explain: "Gemäss Art. 262 Abs. 2 lit. b OR kann der Vermieter die Zustimmung verweigern, wenn die Bedingungen der Untermiete missbräuchlich sind. Hier verlangen die Untermieter zusammen CHF 1'400, während Linus nur CHF 1'350 Hauptmiete zahlt. Linus verdient somit an der Untermiete, was als missbräuchlich gilt."
  },
  {
    id: "u06", topic: "untermiete", type: "mc", diff: 2, tax: "K1",
    q: "Wie lange kann eine Erstreckung des Mietverhältnisses bei Wohnungen maximal dauern (Art. 272b OR)?",
    options: [
      {v: "A", t: "Maximal 1 Jahr"},
      {v: "B", t: "Maximal 2 Jahre"},
      {v: "C", t: "Maximal 4 Jahre"},
      {v: "D", t: "Unbeschränkt"}
    ],
    correct: "C",
    explain: "Gemäss Art. 272b Abs. 1 OR kann eine Wohnungsmiete um höchstens vier Jahre erstreckt werden, eine Geschäftsmiete um höchstens sechs Jahre. Die Erstreckung muss bei der Schlichtungsbehörde beantragt werden und setzt einen Härtefall voraus (Art. 272 OR)."
  },

  // --- diff 3 ---
  {
    id: "u07", topic: "untermiete", type: "mc", diff: 3, tax: "K4",
    context: "Linus hat eine Wohnung gemietet und zwei Zimmer an Lukas und Simon untervermietet. Linus ist seit zwei Monaten mit der Miete im Rückstand. Lukas und Simon befürchten, dass der Vermieter von ihnen die ausstehenden Mietzinse verlangen könnte.",
    q: "Ist die Angst von Lukas und Simon berechtigt?",
    options: [
      {v: "A", t: "Ja, der Vermieter kann sich direkt an die Untermieter wenden."},
      {v: "B", t: "Nein, die Untermieter stehen in keiner Rechtsbeziehung zum Vermieter. Nur Linus schuldet dem Vermieter den Mietzins."},
      {v: "C", t: "Ja, aber nur wenn Linus pleitegeht."},
      {v: "D", t: "Nein, weil Untermieter generell keine Miete zahlen müssen."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob der Vermieter die Mietzinse von den Untermietern verlangen kann. Voraussetzungen: Zwischen dem Vermieter und dem Untermieter besteht keine direkte Rechtsbeziehung (Art. 262 OR). Der Mietvertrag besteht nur zwischen Vermieter und Hauptmieter. Subsumtion: Lukas und Simon haben ihren Untermietvertrag mit Linus abgeschlossen, nicht mit dem Vermieter. Der Vermieter kann nur von Linus den Mietzins verlangen. Schlussfolgerung: Die Angst ist unberechtigt — allerdings riskieren die Untermieter bei einer Kündigung des Hauptmietvertrags den Verlust ihrer Wohnung."
  },
  {
    id: "u08", topic: "untermiete", type: "multi", diff: 3, tax: "K4",
    q: "In welchen Fällen ist eine Erstreckung des Mietverhältnisses ausgeschlossen (Art. 272a OR)? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Der Mieter ist mit dem Mietzins in Rückstand."},
      {v: "B", t: "Der Mieter hat seine Sorgfaltspflicht schwer verletzt."},
      {v: "C", t: "Der Mieter geht in Konkurs."},
      {v: "D", t: "Der Mieter möchte in eine andere Stadt ziehen."}
    ],
    correct: ["A", "B", "C"],
    explain: "Gemäss Art. 272a OR ist die Erstreckung ausgeschlossen bei: Zahlungsrückstand, schwerer Pflichtverletzung des Mieters, und Konkurs des Mieters. Auch bei befristeten Mietverträgen wegen Umbau ist sie ausgeschlossen. Ein freiwilliger Umzugswunsch ist kein Ausschlussgrund, da der Mieter in diesem Fall gar keine Erstreckung beantragen würde."
  },

  // ============================================================
  // TOPIC: uebergabe (Wohnungsübergabe & -abgabe)
  // ============================================================

  // --- diff 1 ---
  {
    id: "a01", topic: "uebergabe", type: "fill", diff: 1, tax: "K1",
    q: "Bei der Übernahme einer Mietwohnung wird ein {0} erstellt, in dem vorhandene Mängel und Schäden festgehalten werden.",
    blanks: [
      {answer: "Antrittsprotokoll", alts: ["Übergabeprotokoll", "Schadenprotokoll", "Zustandsprotokoll"]}
    ],
    explain: "Das Antrittsprotokoll (auch Übergabe- oder Schadenprotokoll genannt) dokumentiert den Zustand der Wohnung beim Einzug. Es wird gemeinsam von Mieter und Vermieter erstellt und von beiden unterzeichnet. Es dient als Beweis, dass bestimmte Mängel bereits vor dem Einzug bestanden."
  },
  {
    id: "a02", topic: "uebergabe", type: "tf", diff: 1, tax: "K2",
    q: "Ohne Antrittsprotokoll wird bei einem späteren Auszug angenommen, dass alle Schäden vom Mieter verursacht wurden.",
    correct: true,
    explain: "Ohne Antrittsprotokoll gerät der Mieter in Beweisnot. Wenn bei der Wohnungsabgabe Mängel festgestellt werden, kann der Mieter nicht beweisen, dass diese bereits beim Einzug vorhanden waren. Der Vermieter wird davon ausgehen, dass der Mieter sie verursacht hat."
  },
  {
    id: "a03", topic: "uebergabe", type: "mc", diff: 1, tax: "K1",
    q: "Was ist eine paritätische Lebensdauertabelle?",
    options: [
      {v: "A", t: "Eine Tabelle, die festlegt, nach wie vielen Jahren sich Einrichtungsgegenstände in einer Mietwohnung abnutzen."},
      {v: "B", t: "Eine Tabelle über die Lebenserwartung der Schweizer Bevölkerung."},
      {v: "C", t: "Eine Übersicht über die durchschnittlichen Mietpreise in der Schweiz."},
      {v: "D", t: "Eine Liste der Pflichten des Vermieters."}
    ],
    correct: "A",
    explain: "Die paritätische Lebensdauertabelle wird vom Hauseigentümerverband (HEV) und dem Schweizerischen Mieterinnen- und Mieterverband (SMV) gemeinsam herausgegeben. Sie legt fest, wie lange verschiedene Einrichtungsgegenstände (z.B. Wandanstrich, Parkettboden, Kühlschrank) üblicherweise halten. Sie dient der Berechnung des Zeitwerts bei Schadenersatzforderungen."
  },

  // --- diff 2 ---
  {
    id: "a04", topic: "uebergabe", type: "calc", diff: 2, tax: "K3",
    context: "Sandra hat 6 Jahre lang eine Wohnung gemietet. Der 30-jährige massive Parkettboden hat durch unsorgfältiges Giessen von Pflanzen Wasserschäden erlitten und muss renoviert werden. Die Renovationskosten betragen CHF 6'000. Die Lebensdauer eines massiven Parkettbodens beträgt gemäss Lebensdauertabelle 40 Jahre.",
    q: "Berechnen Sie den Anteil, den Sandra dem Vermieter bezahlen muss.",
    rows: [
      {label: "Restlebensdauer in Jahren (40 – 30 = ?)", answer: 10, tolerance: 0, unit: "Jahre"},
      {label: "Sandras Kostenanteil (Restlebensdauer / Gesamtlebensdauer × Kosten)", answer: 1500, tolerance: 0, unit: "CHF"}
    ],
    explain: "Lösungsweg: Der Parkettboden ist 30 Jahre alt, seine Gesamtlebensdauer beträgt 40 Jahre. Die Restlebensdauer beträgt 10 Jahre. Sandra muss nur den Anteil bezahlen, der der noch nicht abgelaufenen Lebensdauer entspricht: 10/40 × CHF 6'000 = CHF 1'500."
  },
  {
    id: "a05", topic: "uebergabe", type: "multi", diff: 2, tax: "K2",
    q: "Welche drei Schritte sollte ein Mieter bei der Wohnungsabgabe beachten? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Gründliche Reinigung der Wohnung"},
      {v: "B", t: "Defekte und Beschädigungen notieren und fotografieren"},
      {v: "C", t: "Mit dem Vermieter die Behebung von Defekten und allfällige Anteilszahlungen festlegen"},
      {v: "D", t: "Die Schlüssel ohne Abnahme in den Briefkasten des Vermieters werfen"}
    ],
    correct: ["A", "B", "C"],
    explain: "Bei der Wohnungsabgabe sollte der Mieter: (1) die Wohnung gründlich reinigen, da ein sauberer Zustand den ersten Eindruck positiv beeinflusst, (2) Defekte dokumentieren als Beweis, und (3) mit dem Vermieter die Kostenaufteilung klären. Die Schlüssel sollten nie ohne offizielle Abnahme übergeben werden."
  },
  {
    id: "a06", topic: "uebergabe", type: "mc", diff: 2, tax: "K2",
    q: "Was bedeutet der «Zeitwert» im Zusammenhang mit der Wohnungsabgabe?",
    options: [
      {v: "A", t: "Der aktuelle Marktwert der Mietsache."},
      {v: "B", t: "Der Wert eines Einrichtungsgegenstands unter Berücksichtigung seines Alters und der normalen Abnutzung."},
      {v: "C", t: "Der Neuwert eines Gegenstands zum Zeitpunkt des Kaufs."},
      {v: "D", t: "Der Versicherungswert der Wohnung."}
    ],
    correct: "B",
    explain: "Der Zeitwert berücksichtigt das Alter und die normale Abnutzung eines Gegenstands. Bei einem Schaden muss der Mieter nur den Zeitwert ersetzen — nicht den Neuwert. Die paritätische Lebensdauertabelle dient zur Berechnung: Hat z.B. ein Wandanstrich eine Lebensdauer von 8 Jahren und ist bereits 5 Jahre alt, muss der Mieter nur noch 3/8 der Neustreichkosten übernehmen."
  },

  // --- diff 3 ---
  {
    id: "a07", topic: "uebergabe", type: "calc", diff: 3, tax: "K3",
    context: "Ein Mieterpaar hat eine Wohnung 5 Jahre lang bewohnt. Beim Auszug wird festgestellt, dass der Wandanstrich (Lebensdauer 8 Jahre gemäss Lebensdauertabelle) durch Rauchschäden erneuert werden muss. Die Kosten für den Neuanstrich betragen CHF 4'000.",
    q: "Berechnen Sie den Anteil, den das Mieterpaar bezahlen muss.",
    rows: [
      {label: "Restlebensdauer in Jahren (8 – 5 = ?)", answer: 3, tolerance: 0, unit: "Jahre"},
      {label: "Kostenanteil des Mieterpaars (Restlebensdauer / Gesamtlebensdauer × Kosten)", answer: 1500, tolerance: 0, unit: "CHF"}
    ],
    explain: "Lösungsweg: Die Lebensdauer des Anstrichs beträgt 8 Jahre. Das Mieterpaar hat 5 Jahre gewohnt, somit beträgt die Restlebensdauer 3 Jahre. Ihr Anteil: 3/8 × CHF 4'000 = CHF 1'500. Die normale Abnutzung für 5 Jahre muss der Mieter nicht bezahlen — nur die Restlebensdauer, die durch den Schaden verloren geht."
  },
  {
    id: "a08", topic: "uebergabe", type: "tf", diff: 3, tax: "K4",
    q: "Wenn der Vermieter sich weigert, Mängel ins Antrittsprotokoll aufzunehmen, sollte der Mieter ihm stattdessen eine eigene Mängelliste per Einschreiben schicken.",
    correct: true,
    explain: "Weigert sich der Vermieter, gewisse Mängel ins Protokoll aufzunehmen, sollte der Mieter eine eigene vollständige Mängelliste erstellen und dem Vermieter per Einschreiben zustellen. So hat der Mieter einen Beweis dafür, dass er die Mängel beim Einzug dokumentiert hat. Die Frist für nachträgliche Mängelrügen beträgt in der Regel 10 bis 30 Tage."
  },

  // ============================================================
  // TOPIC: zusammenleben (Zusammenleben, Haustiere & Datenschutz)
  // ============================================================

  // --- diff 1 ---
  {
    id: "z01", topic: "zusammenleben", type: "mc", diff: 1, tax: "K1",
    q: "Welcher Gesetzesartikel regelt das Verhalten des Mieters und die Rücksichtnahme auf Hausbewohner und Nachbarn?",
    options: [
      {v: "A", t: "Art. 253 OR"},
      {v: "B", t: "Art. 257f OR"},
      {v: "C", t: "Art. 262 OR"},
      {v: "D", t: "Art. 270 OR"}
    ],
    correct: "B",
    explain: "Art. 257f OR regelt die Sorgfaltspflicht des Mieters und die Pflicht zur Rücksichtnahme auf die Hausbewohner und Nachbarn. Bei schwerwiegenden Verstössen kann der Vermieter nach Abmahnung die Kündigung aussprechen."
  },
  {
    id: "z02", topic: "zusammenleben", type: "tf", diff: 1, tax: "K1",
    q: "Meerschweinchen, Hamster und Wellensittiche dürfen auch ohne Einwilligung des Vermieters in der Mietwohnung gehalten werden.",
    correct: true,
    explain: "Unproblematische Kleintiere wie Meerschweinchen, Hamster, Wellensittiche und Kanarienvögel dürfen auch ohne ausdrückliche Einwilligung des Vermieters gehalten werden, solange sie nicht in grosser Zahl gehalten werden und keine Klagen verursachen. Dies gilt sogar, wenn der Mietvertrag die Tierhaltung verbietet."
  },
  {
    id: "z03", topic: "zusammenleben", type: "fill", diff: 1, tax: "K1",
    q: "Die übliche Nachtruhe dauert von {0} Uhr bis {1} Uhr.",
    blanks: [
      {answer: "22", alts: ["22:00"]},
      {answer: "6", alts: ["06", "6:00", "06:00"]}
    ],
    explain: "Die Nachtruhe gilt üblicherweise von 22 bis 6 Uhr. Während der Sommerzeit vor Wochenenden und Feiertagen beginnt sie um 23 Uhr. Die Ruhezeiten an Werktagen sind zudem von 12 bis 13 Uhr und ab 20 Uhr."
  },

  // --- diff 2 ---
  {
    id: "z04", topic: "zusammenleben", type: "mc", diff: 2, tax: "K3",
    context: "Carla hält seit langem eine Hauskatze in ihrer Mietwohnung. Die Vermieterin Frau Neckermann wusste davon, hat es stillschweigend akzeptiert und streichelt die Katze sogar gelegentlich im Garten. Nun fordert Frau Neckermann plötzlich die Beseitigung aller Tiere.",
    q: "Darf die Vermieterin die Beseitigung der Hauskatze verlangen?",
    options: [
      {v: "A", t: "Ja, sie ist die Vermieterin und kann jederzeit Tierhaltung verbieten."},
      {v: "B", t: "Nein, da sie die Katze über längere Zeit stillschweigend geduldet hat, gilt die Einwilligung als stillschweigend erteilt."},
      {v: "C", t: "Ja, aber nur mit einer Frist von 6 Monaten."},
      {v: "D", t: "Nein, weil Katzen generell nie verboten werden dürfen."}
    ],
    correct: "B",
    explain: "Eine einmal erteilte Einwilligung zur Tierhaltung — auch eine stillschweigende — darf nicht ohne triftigen Grund widerrufen werden. Da Frau Neckermann die Katze über längere Zeit geduldet und sogar gestreichelt hat, gilt die Einwilligung als stillschweigend erteilt. Sie kann die Beseitigung der Katze daher nicht mehr verlangen."
  },
  {
    id: "z05", topic: "zusammenleben", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Fragen darf ein Vermieter einem Mietinteressenten gemäss Datenschutzrecht NICHT stellen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Mitgliedschaft bei einer Mieterschutzorganisation"},
      {v: "B", t: "Bestehende Krankheiten"},
      {v: "C", t: "Ungefähre Höhe des Einkommens"},
      {v: "D", t: "Mitgliedschaft bei politischen Parteien"}
    ],
    correct: ["A", "B", "D"],
    explain: "Gemäss den Richtlinien des Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) darf der Vermieter nur Angaben verlangen, die für die Mieterauswahl nach objektiven Kriterien nötig sind. Fragen zu Krankheiten, Mitgliedschaft bei Mieterschutzorganisationen oder politischen Parteien sind unzulässig. Die ungefähre Höhe des Einkommens (in 10'000er-Schritten) darf erfragt werden."
  },
  {
    id: "z06", topic: "zusammenleben", type: "mc", diff: 2, tax: "K2",
    q: "Was sollte ein Mieter als Erstes tun, wenn ein Nachbar wiederholt gegen die Ruhezeiten verstösst?",
    options: [
      {v: "A", t: "Sofort die Polizei rufen."},
      {v: "B", t: "Das Gespräch mit dem Nachbarn suchen und an die Rücksichtnahme appellieren."},
      {v: "C", t: "Den Vermieter verklagen."},
      {v: "D", t: "Die Wohnung kündigen."}
    ],
    correct: "B",
    explain: "Der erste Schritt bei Nachbarschaftskonflikten sollte immer das direkte Gespräch sein. Führt dies nicht zum Ziel, kann man die Verwaltung oder den Vermieter informieren, der den störenden Mieter schriftlich abmahnen kann. Als weitere Schritte kommen eine Anzeige bei der Polizei oder eine Zivilklage in Frage."
  },

  // --- diff 3 ---
  {
    id: "z07", topic: "zusammenleben", type: "mc", diff: 3, tax: "K4",
    context: "Carla hat ein grosses 840-Liter-Aquarium für Saugschmerlen angeschafft und kürzlich einen Hund adoptiert, der beim Heimkommen minutenlang laut bellt. Die Vermieterin fordert die Beseitigung aller Tiere und droht mit sofortiger Kündigung.",
    q: "Wie ist die Rechtslage bezüglich des Hundes zu beurteilen?",
    options: [
      {v: "A", t: "Der Hund darf bleiben, weil Haustiere generell erlaubt sind."},
      {v: "B", t: "Die Vermieterin kann die Beseitigung des Hundes verlangen, da er durch das laute Bellen die Nachbarschaft stört. Eine sofortige Kündigung ist jedoch nur nach vorgängiger schriftlicher Mahnung und bei fortgesetzter Störung möglich."},
      {v: "C", t: "Die Vermieterin kann sofort fristlos kündigen."},
      {v: "D", t: "Der Hund darf bleiben, solange Carla ihn draussen hält."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Vermieterin die Beseitigung des Hundes verlangen und fristlos kündigen kann. Voraussetzungen: Hunde benötigen grundsätzlich die Einwilligung des Vermieters. Ein störender Hund, der die Nachbarschaft belästigt, kann ein Grund für eine Beseitigungsforderung sein. Für eine fristlose Kündigung braucht es vorher eine schriftliche Mahnung (Art. 257f Abs. 3 OR). Subsumtion: Konny bellt laut und stört die Nachbarschaft. Die Vermieterin hat keine Einwilligung erteilt. Schlussfolgerung: Die Vermieterin darf die Beseitigung des Hundes verlangen. Eine sofortige Kündigung ist aber erst nach erfolgloser schriftlicher Mahnung und unter Einhaltung einer Frist von 30 Tagen auf Monatsende möglich."
  },
  {
    id: "z08", topic: "zusammenleben", type: "multi", diff: 2, tax: "K2",
    q: "Welche der folgenden Informationen darf ein Vermieter von einem Mietinteressenten verlangen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Name, Vorname und Geburtsdatum"},
      {v: "B", t: "Ob Haustiere gehalten werden"},
      {v: "C", t: "Ob ein Musikinstrument gespielt wird"},
      {v: "D", t: "Kinderwunsch"}
    ],
    correct: ["A", "B", "C"],
    explain: "Der Vermieter darf nach grundlegenden Personalien, Haustieren und lärmigen Tätigkeiten wie dem Spielen eines Musikinstruments fragen, da diese Informationen für die Mieterauswahl objektiv relevant sind. Fragen nach einem Kinderwunsch sind hingegen nicht zulässig, da sie die Privatsphäre verletzen und diskriminierend wirken können."
  },
  {
    id: "z09", topic: "zusammenleben", type: "tf", diff: 1, tax: "K1",
    q: "Ein Betreibungsauszug gibt Auskunft über die Zahlungsmoral einer Person und ist für Vermieter ein wichtiges Dokument bei der Mieterauswahl.",
    correct: true,
    explain: "Der Betreibungsauszug zeigt, ob gegen eine Person in den letzten Jahren Betreibungen eingeleitet wurden. Für den Vermieter ist dies ein Indiz (aber kein Beweis) für die Zahlungsmoral des potenziellen Mieters. Viele Vermieter verlangen dieses Dokument als Bestandteil der Mietbewerbung."
  },
  {
    id: "z10", topic: "zusammenleben", type: "mc", diff: 3, tax: "K5",
    context: "Peter spielt seit kurzem Schlagzeug in seiner Mietwohnung. Der Mietvertrag enthält keine Regelung zur Tierhaltung oder Musizieren. Ein Nachbar beschwert sich regelmässig über den Lärm.",
    q: "Darf Peter Schlagzeug spielen, und was riskiert er?",
    options: [
      {v: "A", t: "Ja, Musizieren ist ein Grundrecht und kann nicht eingeschränkt werden."},
      {v: "B", t: "Schlagzeug oder laute Blasinstrumente können zu jeder Tageszeit als unzumutbare Störung gelten. Bei wiederholter Störung trotz Abmahnung riskiert Peter die Kündigung."},
      {v: "C", t: "Nein, Musizieren ist in Mietwohnungen generell verboten."},
      {v: "D", t: "Ja, solange er nur während der Nachtruhe spielt."}
    ],
    correct: "B",
    explain: "Schlagzeug und laute Blasinstrumente gelten gemäss gängigen Polizei- und Gemeindeverordnungen als potenziell störend — unabhängig von der Tageszeit. Das Spielen kann die Sorgfaltspflicht nach Art. 257f OR verletzen. Bei wiederholter Störung kann der Vermieter nach schriftlicher Abmahnung eine Kündigung mit 30-tägiger Frist auf Monatsende aussprechen (Art. 257f Abs. 3 OR)."
  }
,

  // ============================================================
  // ERGÄNZUNGSFRAGEN (s01–s16) — mit SVG-Bildreferenzen
  // ============================================================

  // --- SVG 1: Systematik-Übersicht ---
  {
    id: "s01", topic: "grundlagen", type: "mc", diff: 2, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_systematik_01.svg", alt: "Übersicht Mietrecht OR 253–274"},
    context: "Die Vermieterin verweigert seit Wochen die Reparatur einer defekten Heizung in Leonas Wohnung.",
    q: "In welchem der vier Hauptbereiche der Übersicht findest du die relevanten Bestimmungen für Leonas Problem?",
    options: [
      {v: "A", t: "Vertragsabschluss — es handelt sich um eine Formvorschrift beim Vertragsschluss."},
      {v: "B", t: "Während der Miete — die Mängelbeseitigung fällt unter die laufenden Pflichten (OR 259 ff.)."},
      {v: "C", t: "Kündigung — Leona muss zuerst kündigen, bevor sie handeln kann."},
      {v: "D", t: "Mieterschutz — es handelt sich um einen missbräuchlichen Mietzins."}
    ],
    correct: "B",
    explain: "Die defekte Heizung ist ein Mangel an der Mietsache. Gemäss der Übersicht fällt die Mängelbeseitigung unter den Bereich 'Während der Miete' (OR 259 ff.). Der Vermieter ist verpflichtet, grössere Mängel zu beheben. Leona muss nicht kündigen, sondern kann die Mängelbeseitigung verlangen, den Mietzins reduzieren oder hinterlegen."
  },

  // --- SVG 2: Kündigungsfristen ---
  {
    id: "s02", topic: "kuendigung", type: "mc", diff: 2, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_kuendigungsfristen_02.svg", alt: "Kündigungsfristen im Mietrecht"},
    context: "Betrachte die Zeitleiste auf dem Bild. Matteo möchte sein möbliertes Zimmer in Bern kündigen. Heute ist der 10. Oktober.",
    q: "Bis wann muss Matteo frühestens das Zimmer verlassen, wenn er heute kündigt?",
    options: [
      {v: "A", t: "24. Oktober (zwei Wochen ab heute)"},
      {v: "B", t: "31. Oktober (zwei Wochen auf Monatsende)"},
      {v: "C", t: "31. Januar (drei Monate)"},
      {v: "D", t: "10. November (ein Monat)"}
    ],
    correct: "B",
    explain: "Für möblierte Zimmer gilt eine Kündigungsfrist von zwei Wochen auf ein Monatsende (Art. 266e OR). Kündigt Matteo am 10. Oktober, endet das Mietverhältnis am 31. Oktober."
  },
  {
    id: "s03", topic: "kuendigung", type: "mc", diff: 3, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_kuendigungsfristen_02.svg", alt: "Kündigungsfristen im Mietrecht"},
    context: "Ein Geschäftsinhaber in Bern will seinen Laden kündigen. Heute ist der 20. März. Die Kündigungstermine gemäss Ortsgebrauch sind der 30. April und der 31. Oktober.",
    q: "Auf welchen Termin kann der Geschäftsinhaber frühestens kündigen?",
    options: [
      {v: "A", t: "30. April dieses Jahres — Kündigung muss 6 Monate vorher (bis 31. Okt. des Vorjahres) eingehen, also bereits verpasst."},
      {v: "B", t: "31. Oktober dieses Jahres — 6 Monate vorher ist der 30. April; da heute erst der 20. März ist, kann die Kündigung rechtzeitig eingereicht werden."},
      {v: "C", t: "30. April nächstes Jahr — erst dann wäre ein neuer Termin fällig."},
      {v: "D", t: "20. September — genau 6 Monate ab heute."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, auf welchen Termin frühestens gekündigt werden kann. Voraussetzungen: Geschäftsräume haben eine 6-monatige Kündigungsfrist (Art. 266d OR). Die Kündigung muss spätestens 6 Monate vor dem Kündigungstermin beim Vermieter eingehen. Subsumtion: Für den 30. April müsste die Kündigung bis 31. Oktober des Vorjahres eingegangen sein — verpasst. Für den 31. Oktober: 6 Monate vorher = 30. April. Heute ist der 20. März, also liegt die Kündigung rechtzeitig vor dem 30. April. Schlussfolgerung: Der Geschäftsinhaber kann auf den 31. Oktober kündigen, sofern die Kündigung bis spätestens 30. April beim Vermieter eingeht."
  },

  // --- SVG 3: Mängelrecht ---
  {
    id: "s04", topic: "maengel", type: "mc", diff: 2, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_maengelrecht_03.svg", alt: "Flussdiagramm Vorgehen bei Mängeln"},
    context: "Der Abfluss in Sarahs Badewanne ist verstopft. Es handelt sich um eine einfache Verstopfung, die mit einem Saugnapf behoben werden kann.",
    q: "Folge dem Flussdiagramm: Welchen Weg durchläuft Sarahs Fall und was ist das Ergebnis?",
    options: [
      {v: "A", t: "Mangel → Gewöhnlicher Unterhalt? Ja → Sarah muss den Abfluss selbst reparieren (Art. 259 OR)."},
      {v: "B", t: "Mangel → Vermieter melden → Vermieter behebt → Erledigt."},
      {v: "C", t: "Mangel → Gewöhnlicher Unterhalt? Nein → Sarah kann sofort den Mietzins hinterlegen."},
      {v: "D", t: "Mangel → Vermieter melden → Nicht behoben → Fristlose Kündigung."}
    ],
    correct: "A",
    explain: "Ein verstopfter Abfluss, der mit einem Saugnapf behoben werden kann, ist gewöhnlicher (kleiner) Unterhalt gemäss Art. 259 OR. Im Flussdiagramm folgt man: Mangel entdeckt → Gewöhnlicher Unterhalt? → Ja → Mieter behebt selbst. Erst bei grösseren Mängeln (defekte Heizung, undichtes Dach) muss der Vermieter eingeschaltet werden."
  },
  {
    id: "s05", topic: "maengel", type: "mc", diff: 3, tax: "K4",
    img: {src: "img/recht/mietrecht/mietrecht_maengelrecht_03.svg", alt: "Flussdiagramm Vorgehen bei Mängeln"},
    context: "In Jonas' Wohnung ist die Geschirrspülmaschine seit zwei Wochen defekt. Er hat den Vermieter schriftlich informiert und eine Frist von 10 Tagen gesetzt. Die Frist ist abgelaufen, der Vermieter hat nicht reagiert.",
    q: "In welcher Phase des Flussdiagramms befindet sich Jonas, und welche Optionen hat er jetzt?",
    options: [
      {v: "A", t: "Er ist bei 'Vermieter behebt den Mangel? → Nein' und hat nun vier Optionen: Mängelbeseitigung, Mietzinsreduktion, Schadenersatz oder Mietzinshinterlegung."},
      {v: "B", t: "Er ist noch bei 'Mangel entdeckt' und muss zuerst prüfen, ob es gewöhnlicher Unterhalt ist."},
      {v: "C", t: "Er muss nochmals eine Frist setzen, bevor er handeln darf."},
      {v: "D", t: "Er kann nur den Mietzins hinterlegen, alle anderen Optionen sind ausgeschlossen."}
    ],
    correct: "A",
    explain: "Obersatz: Es ist zu prüfen, welche Rechte Jonas hat. Voraussetzungen: Jonas hat den Mangel gemeldet, eine Frist gesetzt und der Vermieter hat nicht gehandelt. Subsumtion: Eine defekte Geschirrspülmaschine ist kein gewöhnlicher Unterhalt (Fachmann nötig). Jonas hat korrekt gemeldet und eine Frist gesetzt. Da der Vermieter nicht reagiert hat, stehen Jonas alle vier Rechte aus Art. 259a–259i OR zur Verfügung. Schlussfolgerung: Jonas kann die Reparatur selbst veranlassen (Ersatzvornahme), Mietzinsreduktion fordern, Schadenersatz verlangen oder den Mietzins hinterlegen."
  },

  // --- SVG 4: Zeitwertberechnung ---
  {
    id: "s06", topic: "uebergabe", type: "calc", diff: 3, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_zeitwert_04.svg", alt: "Zeitwertberechnung bei Wohnungsabgabe"},
    context: "Beim Auszug nach 4 Jahren wird festgestellt, dass der Teppichboden (Lebensdauer 10 Jahre gemäss Lebensdauertabelle) durch Brandflecken ersetzt werden muss. Die Kosten betragen CHF 5'000.",
    q: "Berechne den Kostenanteil des Mieters anhand der Zeitwert-Formel.",
    rows: [
      {label: "Restlebensdauer in Jahren (10 – 4 = ?)", answer: 6, tolerance: 0, unit: "Jahre"},
      {label: "Kostenanteil Mieter (Rest / Gesamt × Kosten)", answer: 3000, tolerance: 0, unit: "CHF"}
    ],
    explain: "Lösungsweg: Die Lebensdauer des Teppichbodens beträgt 10 Jahre. Der Mieter hat 4 Jahre gewohnt, die Restlebensdauer beträgt 6 Jahre. Der Kostenanteil: 6/10 × CHF 5'000 = CHF 3'000. Der Mieter muss also CHF 3'000 bezahlen."
  },
  {
    id: "s07", topic: "uebergabe", type: "mc", diff: 2, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_zeitwert_04.svg", alt: "Zeitwertberechnung bei Wohnungsabgabe"},
    context: "Familie Becker zieht nach 12 Jahren aus ihrer Wohnung aus. Bei der Wohnungsabgabe werden Schäden am Teppichboden und am Kühlschrank festgestellt (jeweils durch unsachgemässen Gebrauch).",
    q: "Für welchen Gegenstand muss Familie Becker gemäss der Lebensdauertabelle noch einen Kostenanteil bezahlen?",
    options: [
      {v: "A", t: "Nur für den Teppichboden — seine Lebensdauer ist kürzer als die Mietdauer."},
      {v: "B", t: "Nur für den Kühlschrank — seine Lebensdauer (15 Jahre) ist noch nicht erreicht, der Teppichboden (10 Jahre) ist bereits abgeschrieben."},
      {v: "C", t: "Für beide Gegenstände, da die Lebensdauer bei beiden noch nicht abgelaufen ist."},
      {v: "D", t: "Für keinen der Gegenstände — nach 12 Jahren ist alles abgeschrieben."}
    ],
    correct: "B",
    explain: "Gemäss der Lebensdauertabelle: Teppichboden = 10 Jahre, Kühlschrank = 15 Jahre. Nach 12 Jahren Mietdauer ist der Teppichboden vollständig abgeschrieben (Restlebensdauer = 0) — der Mieter schuldet nichts. Der Kühlschrank hat noch 3 Jahre Restlebensdauer — der Mieter muss einen Zeitwert-Anteil (3/15 × Kosten) bezahlen."
  },

  // --- SVG 5: Pflichten ---
  {
    id: "s08", topic: "grundlagen", type: "mc", diff: 2, tax: "K3",
    img: {src: "img/recht/mietrecht/mietrecht_pflichten_05.svg", alt: "Pflichten Vermieter und Mieter"},
    context: "Herr Weber zahlt seit zwei Monaten keinen Mietzins, wohnt aber weiterhin in der Wohnung und nutzt alle Einrichtungen.",
    q: "Welche Konsequenz ergibt sich aus der Vertragsstruktur (siehe Übersicht) für den Vermieter?",
    options: [
      {v: "A", t: "Keine — der Vermieter hat keinen Anspruch auf Mietzins, solange Herr Weber wohnt."},
      {v: "B", t: "Der Vermieter muss weiterhin alle seine Pflichten erfüllen (Unterhalt, Mängelbeseitigung), unabhängig davon, ob Herr Weber zahlt."},
      {v: "C", t: "Da der Mietvertrag auf Leistung gegen Gegenleistung aufgebaut ist, kann der Vermieter bei Zahlungsverzug nach schriftlicher Mahnung und Fristansetzung ausserordentlich kündigen (Art. 257d OR)."},
      {v: "D", t: "Der Vermieter darf die Wohnung sofort räumen lassen, ohne Mahnung."}
    ],
    correct: "C",
    explain: "Der Mietvertrag ist ein synallagmatischer Vertrag: Gebrauchsüberlassung gegen Mietzins. Wenn der Mieter seine Hauptpflicht (Mietzinszahlung, Art. 257 OR) verletzt, kann der Vermieter gemäss Art. 257d OR eine Zahlungsfrist von mindestens 30 Tagen setzen und bei Nichtzahlung mit einer Frist von mindestens 30 Tagen auf Monatsende ausserordentlich kündigen. Eine sofortige Räumung ohne Mahnung ist nicht zulässig."
  },

  // --- Zusätzliche diff-3-Fragen zur Verstärkung ---
  {
    id: "s09", topic: "mietzins", type: "mc", diff: 3, tax: "K4",
    context: "Frau Meier zieht in eine neue Wohnung ein und stellt fest, dass der Mietzins 20% über dem Mietzins des Vormieters liegt. Der Vermieter hat keine wertvermehrenden Investitionen vorgenommen.",
    q: "Welches Recht hat Frau Meier gemäss Art. 270 OR?",
    options: [
      {v: "A", t: "Kein Recht, da der Mietzins bei Vertragsabschluss akzeptiert wurde."},
      {v: "B", t: "Sie kann innert 30 Tagen nach Übernahme der Sache den Anfangsmietzins bei der Schlichtungsbehörde als missbräuchlich anfechten."},
      {v: "C", t: "Sie kann den Mietzins einseitig auf den Vormieter-Niveau senken."},
      {v: "D", t: "Sie muss den Mietzins 12 Monate zahlen, bevor sie anfechten kann."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob Frau Meier den Anfangsmietzins anfechten kann. Voraussetzungen: Gemäss Art. 270 OR kann ein neuer Mieter den Anfangsmietzins als missbräuchlich anfechten, wenn er sich in einer persönlichen oder familiären Notlage zum Vertragsabschluss gezwungen sah, oder wenn der Mietzins deutlich über dem Vormieter-Niveau liegt und keine wertvermehrenden Investitionen vorgenommen wurden. Die Frist beträgt 30 Tage nach Übernahme. Subsumtion: Der Mietzins liegt 20% über dem Vormieter-Niveau ohne Investitionen. Schlussfolgerung: Frau Meier kann den Anfangsmietzins innert 30 Tagen bei der Schlichtungsbehörde anfechten."
  },
  {
    id: "s10", topic: "zusammenleben", type: "mc", diff: 3, tax: "K4",
    context: "Herr Brunner entdeckt, dass sein Vermieter eine Überwachungskamera im Eingangsbereich installiert hat, die auch den Zugang zu seiner Wohnung filmt. Der Vermieter begründet dies mit 'Sicherheitsgründen'.",
    q: "Wie ist die Rechtslage einzuschätzen?",
    options: [
      {v: "A", t: "Der Vermieter darf Kameras jederzeit und überall installieren."},
      {v: "B", t: "Die Videoüberwachung ist problematisch: Der Vermieter muss die Verhältnismässigkeit wahren, die Mieter vorgängig informieren und darf keine Privatbereiche filmen."},
      {v: "C", t: "Videoüberwachung ist in Mietobjekten generell verboten."},
      {v: "D", t: "Nur die Polizei darf Kameras in Wohnhäusern installieren."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Videoüberwachung zulässig ist. Voraussetzungen: Gemäss dem Datenschutzgesetz (DSG) und der Rechtsprechung muss eine Videoüberwachung verhältnismässig sein, die Betroffenen müssen informiert werden, und Privatbereiche (Wohnungszugänge, Balkone) dürfen nicht überwacht werden. Subsumtion: Die Kamera filmt den Zugang zu Herrn Brunners Wohnung. Es fehlt die vorgängige Information. Schlussfolgerung: Die Videoüberwachung in dieser Form ist datenschutzrechtlich problematisch und der Mieter kann die Entfernung oder Neuausrichtung der Kamera verlangen."
  },
  {
    id: "s11", topic: "untermiete", type: "mc", diff: 2, tax: "K3",
    context: "Anna vermietet während ihres Auslandsemesters (6 Monate) ihre gesamte 3-Zimmer-Wohnung über eine Online-Plattform an Touristen, jeweils für wenige Tage.",
    q: "Ist diese Nutzung als Untermiete zulässig?",
    options: [
      {v: "A", t: "Ja, Untermiete ist immer erlaubt."},
      {v: "B", t: "Die kurzfristige Vermietung an Touristen geht über die gewöhnliche Untermiete hinaus. Der Vermieter kann die Zustimmung verweigern, da die häufig wechselnden Gäste wesentliche Nachteile verursachen können."},
      {v: "C", t: "Nein, eine ganze Wohnung darf nie untervermietet werden."},
      {v: "D", t: "Ja, solange Anna den Mietzins weiterhin bezahlt."}
    ],
    correct: "B",
    explain: "Gemäss Art. 262 Abs. 2 lit. c OR kann der Vermieter die Zustimmung verweigern, wenn ihm wesentliche Nachteile entstehen. Kurzfristige Touristenvermietungen (z.B. über Airbnb) verursachen typischerweise höheren Verschleiss, häufigen Personenwechsel und können die Nachbarn stören. Zudem kann der Mietzins im Vergleich zur Hauptmiete missbräuchlich hoch sein (Art. 262 Abs. 2 lit. b OR)."
  },
  {
    id: "s12", topic: "kuendigung", type: "mc", diff: 3, tax: "K5",
    context: "Der Vermieter kündigt Frau Müller die Wohnung, nachdem sie sich bei der Schlichtungsbehörde über eine ungerechtfertigte Mietzinserhöhung beschwert hat.",
    q: "Wie ist diese Kündigung rechtlich zu beurteilen?",
    options: [
      {v: "A", t: "Die Kündigung ist gültig, der Vermieter kann jederzeit kündigen."},
      {v: "B", t: "Es handelt sich wahrscheinlich um eine Rachekündigung (missbräuchliche Kündigung nach Art. 271a OR), die angefochten werden kann."},
      {v: "C", t: "Die Kündigung ist nur ungültig, wenn sie mündlich ausgesprochen wurde."},
      {v: "D", t: "Frau Müller muss die Kündigung akzeptieren, da sie den Rechtsweg beschritten hat."}
    ],
    correct: "B",
    explain: "Obersatz: Es ist zu prüfen, ob die Kündigung missbräuchlich ist. Voraussetzungen: Gemäss Art. 271a Abs. 1 lit. a OR ist eine Kündigung anfechtbar, wenn sie ausgesprochen wird, weil der Mieter Ansprüche aus dem Mietverhältnis geltend macht. Subsumtion: Frau Müller hat eine Mietzinserhöhung bei der Schlichtungsbehörde angefochten — ein gesetzlich vorgesehenes Recht. Die Kündigung erfolgte als Reaktion darauf. Schlussfolgerung: Die Kündigung ist mit hoher Wahrscheinlichkeit missbräuchlich (Rachekündigung) und kann bei der Schlichtungsbehörde angefochten werden."
  },
  {
    id: "s13", topic: "grundlagen", type: "tf", diff: 3, tax: "K4",
    q: "Ein Koppelungsgeschäft liegt vor, wenn der Vermieter den Abschluss des Mietvertrags davon abhängig macht, dass der Mieter gleichzeitig einen Parkplatz mietet, den er gar nicht braucht (Art. 254 OR).",
    correct: true,
    explain: "Gemäss Art. 254 OR ist ein Koppelungsgeschäft im Zusammenhang mit der Miete nichtig. Ein Koppelungsgeschäft liegt vor, wenn der Vermieter den Abschluss oder die Fortsetzung des Mietvertrags mit dem Abschluss eines weiteren Vertrags verknüpft, der in keinem sachlichen Zusammenhang zur Miete steht. Der ungewollte Parkplatz ist ein klassisches Beispiel."
  },
  {
    id: "s14", topic: "zusammenleben", type: "mc", diff: 2, tax: "K3",
    context: "Familie Weber hat sich bei der Vermieterin über den lauten Nachbarn beschwert. Die Vermieterin hat den Nachbarn bereits zweimal schriftlich abgemahnt, doch dieser feiert weiterhin laut bis in die Nacht.",
    q: "Welchen nächsten Schritt kann die Vermieterin nun einleiten?",
    options: [
      {v: "A", t: "Sie kann dem Nachbarn ausserordentlich kündigen mit einer Frist von 30 Tagen auf Monatsende (Art. 257f Abs. 3 OR)."},
      {v: "B", t: "Sie kann nichts tun, der Nachbar hat Hausrecht."},
      {v: "C", t: "Sie muss noch mindestens fünf Abmahnungen schicken."},
      {v: "D", t: "Sie kann nur die Polizei rufen, aber nicht kündigen."}
    ],
    correct: "A",
    explain: "Nach Art. 257f Abs. 3 OR kann der Vermieter bei schwerer Verletzung der Sorgfaltspflicht (fortgesetzte Ruhestörung trotz Abmahnung) ausserordentlich kündigen. Die Frist beträgt mindestens 30 Tage auf Monatsende bei Wohnungen. Die schriftliche Mahnung ist Voraussetzung — hier wurde sie bereits zweimal erteilt."
  },
  {
    id: "s15", topic: "mietzins", type: "tf", diff: 2, tax: "K2",
    q: "Der Referenzzinssatz ist ein vom Bundesamt für Wohnungswesen vierteljährlich publizierter Durchschnittszinssatz, der als Grundlage für Mietzinsanpassungen dient.",
    correct: true,
    explain: "Der Referenzzinssatz basiert auf dem Durchschnittszinssatz der inländischen Hypothekarforderungen. Er wird vierteljährlich vom Bundesamt für Wohnungswesen publiziert. Sinkt er, können Mieter eine Mietzinssenkung verlangen; steigt er, kann der Vermieter eine Erhöhung durchsetzen."
  },
  {
    id: "s16", topic: "uebergabe", type: "multi", diff: 3, tax: "K4",
    context: "Beim Auszug nach 3 Jahren Mietdauer werden folgende Schäden festgestellt: (1) Kratzer im Parkettboden durch einen schweren Schrank, (2) vergilbte Wände in der Küche durch normales Kochen, (3) ein Loch in der Wand (Durchmesser ca. 5 cm).",
    q: "Für welche dieser Schäden muss der Mieter aufkommen? (Mehrere Antworten möglich.)",
    options: [
      {v: "A", t: "Kratzer im Parkettboden: Ja, da unsachgemässer Gebrauch (schwerer Schrank ohne Filzgleiter)."},
      {v: "B", t: "Vergilbte Wände: Nein, da normale Abnutzung durch Kochen."},
      {v: "C", t: "Loch in der Wand: Ja, da übermässige Beschädigung."},
      {v: "D", t: "Alle drei Schäden sind normale Abnutzung."}
    ],
    correct: ["A", "B", "C"],
    explain: "Obersatz: Es ist zu prüfen, welche Schäden über die normale Abnutzung hinausgehen. (1) Kratzer durch einen Schrank ohne Schutz = unsachgemässer Gebrauch → Mieter haftet (Zeitwert-Berechnung). (2) Vergilbte Wände durch Kochen = normale Abnutzung → Vermieter trägt die Kosten. (3) Ein Loch in der Wand = übermässige Beschädigung → Mieter haftet (Zeitwert-Berechnung). A und C sind richtig: Der Mieter muss für die Kratzer und das Loch aufkommen, aber nur zum Zeitwert. B ist auch richtig als Aussage: Vergilbte Wände sind normale Abnutzung."
  }
];
