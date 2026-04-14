// ============================================================
// Pool: Prozessrecht – Zivilprozess und Strafverfahren
// Fach: Recht | Stufe: EWR GYM2
// Lehrplan 17: Prozessrecht (EWR) – Zivilprozessrecht (ZPO),
//   Zuständigkeit, Beweislast, Beweismittel, alternative
//   Streitbeilegung, Strafverfahren (Vergleich)
// Quellen: Zivilprozessrecht-Theorietext, Zwick Bd.1 (ZPO),
//   RSW16 Prozessrecht, Präsentation EWR Prozessrecht
// ============================================================

window.POOL_META = {
  id: "recht_prozessrecht",
  title: "Prozessrecht – Zivilprozess und Strafverfahren",
  fach: "Recht",
  color: "#73ab2c",
  level: "EWR GYM2",
  lernziele: [
    "Ich kann die Unterschiede zwischen Zivilprozess und Strafverfahren erklären. (K2)",
    "Ich kann die sachliche und örtliche Zuständigkeit im Zivilprozess bestimmen. (K3)",
    "Ich kann die Beweislast zuordnen und die Beweismittel im Zivilprozess nennen. (K2)",
    "Ich kann die Formen der alternativen Streitbeilegung (Schlichtung, Mediation, Schiedsgericht) unterscheiden. (K2)"
  ]
};

window.TOPICS = {
  "grundlagen":       {label: "Zivilprozess und Strafverfahren im Vergleich",   short: "Grundlagen",       lernziele: ["Ich kann den Zivilprozess vom Strafverfahren unterscheiden (Beteiligte, Ziel, Verfahrensgrundsätze). (K2)", "Ich kann die Begriffe Kläger, Beklagter, Staatsanwaltschaft und Beschuldigter korrekt zuordnen. (K1)"]},
  "zustaendigkeit":   {label: "Sachliche und örtliche Zuständigkeit",            short: "Zuständigkeit",    lernziele: ["Ich kann die sachliche Zuständigkeit anhand des Streitwerts bestimmen (vereinfachtes vs. ordentliches Verfahren). (K3)", "Ich kann die Grundregel der örtlichen Zuständigkeit (Wohnsitz des Beklagten) erklären und anwenden. (K3)"]},
  "instanzenzug":     {label: "Instanzenzug und Gerichtsorganisation",           short: "Instanzenzug",     lernziele: ["Ich kann den dreistufigen Instanzenzug im Schweizer Zivilprozess beschreiben (Regionalgericht → Obergericht → Bundesgericht). (K1)", "Ich kann erklären, was eine Berufung und was eine Beschwerde ist. (K2)"]},
  "beweis":           {label: "Beweislast und Beweismittel",                     short: "Beweis",           lernziele: ["Ich kann den Grundsatz der Beweislast nach Art. 8 ZGB erklären und auf einfache Fälle anwenden. (K3)", "Ich kann die fünf Beweismittel im Zivilprozess aufzählen und beschreiben. (K1)"]},
  "streitbeilegung":  {label: "Alternative Streitbeilegung",                     short: "Streitbeilegung",  lernziele: ["Ich kann Schlichtung, Mediation und Schiedsgericht voneinander abgrenzen. (K2)", "Ich kann erklären, warum die Schlichtung in der Schweiz obligatorisch ist (Art. 197 ZPO). (K2)"]},
  "strafverfahren":   {label: "Ablauf des Strafverfahrens",                      short: "Strafverfahren",   lernziele: ["Ich kann den Ablauf eines Strafverfahrens in der Schweiz beschreiben (Vorverfahren → Anklage → Hauptverhandlung → Urteil). (K2)", "Ich kann die Unschuldsvermutung erklären und ihre Bedeutung einordnen. (K2)"]}
};

window.QUESTIONS = [

// ============================================================
// TOPIC: grundlagen (Präfix g)
// ============================================================

// --- diff 1 ---
{
  id: "g01", topic: "grundlagen", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  img: {src: "img/recht/prozessrecht/prozessrecht_vergleich_zivil_straf_01.svg", alt: "Vergleichstabelle: Zivilprozess und Strafverfahren – Parteien, Ziel, Grundsatz, Rechtsgebiet"},
  q: "Was regelt das Prozessrecht?",
  options: [
    {v: "A", t: "Es regelt ausschliesslich die Strafen bei Gesetzesverstössen."},
    {v: "B", t: "Es regelt die Organisation der Verwaltung."},
    {v: "C", t: "Es regelt, wie Rechte vor Gericht durchgesetzt werden (Verfahrensrecht)."},
    {v: "D", t: "Es regelt die inhaltlichen Rechte und Pflichten der Bürgerinnen und Bürger (materielles Recht)."}
  ],
  correct: "C",
  explain: "Das Prozessrecht (Verfahrensrecht) regelt, wie Rechte vor Gericht durchgesetzt werden — also den Ablauf von Gerichtsverfahren. Es ist vom materiellen Recht zu unterscheiden, welches die inhaltlichen Rechte und Pflichten regelt (z.B. OR, ZGB)."
},
{
  id: "g02", topic: "grundlagen", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "Im Zivilprozess klagt der Staat gegen eine Privatperson.",
  correct: false,
  explain: "Falsch. Im Zivilprozess stehen sich zwei private Parteien gegenüber: der Kläger (der seine Rechte geltend macht) und der Beklagte (gegen den die Klage gerichtet ist). Es ist der Strafprozess, in dem der Staat (vertreten durch die Staatsanwaltschaft) gegen eine Person vorgeht."
},
{
  id: "g03", topic: "grundlagen", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Im Zivilprozess stehen sich der {0} und der {1} gegenüber.",
  blanks: [
    {answer: "Kläger", alts: ["Klägerin"]},
    {answer: "Beklagte", alts: ["Beklagter"]}
  ],
  explain: "Im Zivilprozess heissen die Parteien «Kläger» (wer klagt) und «Beklagter» (gegen wen geklagt wird). Im Strafprozess dagegen stehen sich Staatsanwaltschaft und Beschuldigter/Angeklagter gegenüber."
},
{
  id: "g04", topic: "grundlagen", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
  q: "Wer verfolgt im Strafverfahren die Straftaten?",
  options: [
    {v: "A", t: "Der Kläger — er muss die Klage einreichen."},
    {v: "B", t: "Die Schlichtungsbehörde — sie leitet das Verfahren ein."},
    {v: "C", t: "Die Staatsanwaltschaft — sie handelt im öffentlichen Interesse."},
    {v: "D", t: "Das Opfer — es muss die Straftat selbst anzeigen und verfolgen."}
  ],
  correct: "C",
  explain: "Im Strafverfahren ist die Staatsanwaltschaft für die Strafverfolgung zuständig. Sie handelt im öffentlichen Interesse (Offizialprinzip). Der «Kläger» ist ein Begriff aus dem Zivilprozess (B). Das Opfer kann zwar eine Strafanzeige erstatten, verfolgt aber nicht selbst (C)."
},

// --- diff 2 ---
{
  id: "g05", topic: "grundlagen", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was bedeutet die Dispositionsmaxime im Zivilprozess?",
  options: [
    {v: "A", t: "Das Gericht bestimmt von sich aus, welche Fälle verhandelt werden."},
    {v: "B", t: "Das Gericht muss alle Beweise von sich aus beschaffen."},
    {v: "C", t: "Die Parteien bestimmen selbst, ob und worüber ein Verfahren geführt wird."},
    {v: "D", t: "Die Staatsanwaltschaft entscheidet, ob Anklage erhoben wird."}
  ],
  correct: "C",
  explain: "Die Dispositionsmaxime bedeutet, dass die Parteien im Zivilprozess selbst entscheiden, ob sie ein Verfahren einleiten, was sie verlangen und ob sie das Verfahren beenden wollen. Im Gegensatz dazu gilt im Strafprozess die Offizialmaxime: Der Staat (Staatsanwaltschaft) verfolgt Straftaten von Amtes wegen."
},
{
  id: "g06", topic: "grundlagen", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
  q: "Welche Aussagen treffen auf den Zivilprozess zu? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Die Parteien heissen Kläger und Beklagter."},
    {v: "B", t: "Es gilt die Dispositionsmaxime."},
    {v: "C", t: "Die Staatsanwaltschaft erhebt Anklage."},
    {v: "D", t: "Ziel ist die Beilegung eines Streits zwischen privaten Parteien."}
  ],
  correct: ["A", "B", "D"],
  explain: "Im Zivilprozess stehen sich Kläger und Beklagter gegenüber (A). Es gilt die Dispositionsmaxime — die Parteien bestimmen über das Verfahren (B). Ziel ist die Beilegung privater Streitigkeiten (D). Die Staatsanwaltschaft (C) gehört zum Strafprozess, nicht zum Zivilprozess."
},
{
  id: "g07", topic: "grundlagen", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
  context: "Lukas hat Marco CHF 5'000 geliehen. Marco weigert sich, das Geld zurückzuzahlen. Lukas möchte sein Geld auf dem Rechtsweg zurückbekommen.",
  q: "Welches Verfahren ist hier einschlägig?",
  options: [
    {v: "A", t: "Ein Strafverfahren — Marco hat sich strafbar gemacht."},
    {v: "B", t: "Keines — man kann Schulden nicht einklagen."},
    {v: "C", t: "Ein Zivilprozess — es handelt sich um eine privatrechtliche Streitigkeit."},
    {v: "D", t: "Ein Verwaltungsverfahren — der Staat muss eingreifen."}
  ],
  correct: "C",
  explain: "Es handelt sich um eine privatrechtliche Streitigkeit (Darlehensvertrag nach Art. 312 OR). Lukas muss als Kläger einen Zivilprozess gegen Marco als Beklagten anstrengen. Das blosse Nichtzurückzahlen einer Schuld ist keine Straftat (B). Selbstverständlich können Schulden eingeklagt werden (D)."
},
{
  id: "g08", topic: "grundlagen", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Im Strafprozess kann das Opfer die Strafverfolgung jederzeit stoppen, indem es die Anzeige zurückzieht.",
  correct: false,
  explain: "Falsch. Bei Offizialdelikten (z.B. Raub, schwere Körperverletzung) verfolgt die Staatsanwaltschaft die Tat von Amtes wegen — unabhängig vom Willen des Opfers. Nur bei Antragsdelikten (z.B. einfacher Diebstahl, Ehrverletzung) kann das Opfer durch Rückzug des Strafantrags das Verfahren beenden."
},

// --- diff 3 ---
{
  id: "g09", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  context: "Petra wird auf dem Fussgängerstreifen von einem Auto angefahren und verletzt. Der Fahrer, Thomas, war alkoholisiert. Petra möchte Schadenersatz für ihre Arztkosten und Thomas soll bestraft werden.",
  q: "Welche Verfahren kommen hier in Frage?",
  options: [
    {v: "A", t: "Nur ein Zivilprozess, weil Petra Geld verlangt."},
    {v: "B", t: "Ein Verwaltungsverfahren, weil es sich um einen Verkehrsunfall handelt."},
    {v: "C", t: "Sowohl ein Strafverfahren (wegen fahrlässiger Körperverletzung) als auch ein Zivilprozess (Schadenersatzklage) sind möglich."},
    {v: "D", t: "Nur ein Strafverfahren, weil Thomas gegen das Gesetz verstossen hat."}
  ],
  correct: "C",
  explain: "Ein Sachverhalt kann sowohl straf- als auch zivilrechtliche Folgen haben. Strafrechtlich liegt eine mögliche fahrlässige Körperverletzung (Art. 125 StGB) und Fahren in angetrunkenem Zustand (Art. 91 SVG) vor — das verfolgt die Staatsanwaltschaft. Zivilrechtlich kann Petra Schadenersatz für ihre Arztkosten verlangen (Art. 41 OR). Beide Verfahren laufen unabhängig voneinander."
},
{
  id: "g10", topic: "grundlagen", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Warum gilt im Strafprozess die Offizialmaxime und nicht die Dispositionsmaxime?",
  options: [
    {v: "A", t: "Weil die Gerichte im Strafprozess mehr Erfahrung haben."},
    {v: "B", t: "Weil im Strafprozess immer zwei Private gegeneinander klagen."},
    {v: "C", t: "Weil Straftaten das öffentliche Interesse berühren und der Staat die Pflicht hat, für Ordnung und Sicherheit zu sorgen."},
    {v: "D", t: "Weil der Beschuldigte keine eigenen Rechte geltend machen kann."}
  ],
  correct: "C",
  explain: "Die Offizialmaxime gilt im Strafprozess, weil Straftaten nicht nur den Einzelnen, sondern die gesamte Gesellschaft betreffen. Der Staat hat die Pflicht, die öffentliche Ordnung und Sicherheit zu gewährleisten. Deshalb verfolgt die Staatsanwaltschaft Straftaten von Amtes wegen — unabhängig davon, ob das Opfer dies möchte oder nicht (bei Offizialdelikten)."
},

// ============================================================
// TOPIC: zustaendigkeit (Präfix z)
// ============================================================

// --- diff 1 ---
{
  id: "z01", topic: "zustaendigkeit", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  q: "Was bestimmt die sachliche Zuständigkeit im Zivilprozess?",
  options: [
    {v: "A", t: "An welchem Ort das Verfahren durchgeführt wird."},
    {v: "B", t: "Ob der Fall zivil- oder strafrechtlich ist."},
    {v: "C", t: "Welcher Anwalt den Fall übernimmt."},
    {v: "D", t: "Welche Art von Gericht (Einzelrichter oder Kollegialgericht) den Fall beurteilt."}
  ],
  correct: "D",
  explain: "Die sachliche Zuständigkeit bestimmt, welche Art von Gericht für einen Fall zuständig ist — insbesondere ob ein Einzelrichter (vereinfachtes Verfahren) oder ein Kollegialgericht (ordentliches Verfahren) urteilt. Die örtliche Zuständigkeit (B) bestimmt den Ort des Verfahrens."
},
{
  id: "z02", topic: "zustaendigkeit", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Bei einem Streitwert bis CHF {0} gilt im Zivilprozess das vereinfachte Verfahren (Art. 243 ZPO).",
  blanks: [
    {answer: "30'000", alts: ["30000", "30 000"]}
  ],
  explain: "Gemäss Art. 243 Abs. 1 ZPO gilt das vereinfachte Verfahren für vermögensrechtliche Streitigkeiten bis zu einem Streitwert von CHF 30'000. Darüber greift das ordentliche Verfahren."
},
{
  id: "z03", topic: "zustaendigkeit", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "Grundsätzlich ist dasjenige Gericht örtlich zuständig, das sich am Wohnsitz des Beklagten befindet.",
  correct: true,
  explain: "Richtig. Die Grundregel der örtlichen Zuständigkeit besagt, dass das Gericht am Wohnsitz des Beklagten zuständig ist (Art. 10 Abs. 1 ZPO). Von dieser Grundregel gibt es Ausnahmen, z.B. bei Streitigkeiten über Grundstücke (Ort des Grundstücks)."
},

// --- diff 2 ---
{
  id: "z04", topic: "zustaendigkeit", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was ist der Unterschied zwischen dem vereinfachten und dem ordentlichen Verfahren?",
  options: [
    {v: "A", t: "Das vereinfachte Verfahren kann nur am Bundesgericht durchgeführt werden."},
    {v: "B", t: "Im ordentlichen Verfahren gibt es keine Beweisaufnahme."},
    {v: "C", t: "Das vereinfachte Verfahren gilt bei tieferem Streitwert (bis CHF 30'000), ist formloser und wird oft von einem Einzelrichter geführt."},
    {v: "D", t: "Das vereinfachte Verfahren ist nur für strafrechtliche Fälle vorgesehen."}
  ],
  correct: "C",
  explain: "Das vereinfachte Verfahren (Art. 243 ff. ZPO) gilt bei einem Streitwert bis CHF 30'000. Es ist weniger formal, schneller und wird typischerweise von einem Einzelrichter beurteilt. Das ordentliche Verfahren gilt bei höherem Streitwert und wird von einem Kollegialgericht (mehrere Richter) geführt."
},
{
  id: "z05", topic: "zustaendigkeit", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
  context: "Elena wohnt in Bern. Sie hat online einen Laptop für CHF 1'200 gekauft. Der Laptop ist defekt und die Verkäuferin Sandra (wohnhaft in Zürich) weigert sich, den Kaufpreis zurückzuerstatten.",
  q: "Welches Verfahren ist anwendbar und wo muss Elena klagen?",
  options: [
    {v: "A", t: "Vereinfachtes Verfahren, am Gericht in Zürich (Wohnsitz der Beklagten)."},
    {v: "B", t: "Vereinfachtes Verfahren, am Gericht in Bern (Wohnsitz der Klägerin)."},
    {v: "C", t: "Ordentliches Verfahren, am Gericht in Bern (Wohnsitz der Klägerin)."},
    {v: "D", t: "Ordentliches Verfahren, am Gericht in Zürich (Wohnsitz der Beklagten)."}
  ],
  correct: "A",
  explain: "Der Streitwert beträgt CHF 1'200 — also unter CHF 30'000, womit das vereinfachte Verfahren gilt (Art. 243 ZPO). Die örtliche Zuständigkeit liegt grundsätzlich am Wohnsitz der Beklagten (Art. 10 ZPO), also in Zürich."
},
{
  id: "z06", topic: "zustaendigkeit", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
  q: "Welche Aussagen zur Zuständigkeit im Zivilprozess sind korrekt? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Die sachliche Zuständigkeit richtet sich u.a. nach dem Streitwert."},
    {v: "B", t: "Die örtliche Zuständigkeit bestimmt, an welchem Ort das Gericht angerufen wird."},
    {v: "C", t: "Der Kläger kann frei wählen, an welchem Gericht er klagen will."},
    {v: "D", t: "Bei Streitigkeiten über Grundstücke ist das Gericht am Ort des Grundstücks zuständig."}
  ],
  correct: ["A", "B", "D"],
  explain: "Die sachliche Zuständigkeit hängt vom Streitwert ab (A). Die örtliche Zuständigkeit bestimmt den Gerichtsort (B). Bei Grundstücken gilt eine Sonderregel: Zuständig ist das Gericht am Ort des Grundstücks (D). Der Kläger kann den Gerichtsort nicht frei wählen (C) — es gelten gesetzliche Regeln."
},
{
  id: "z07", topic: "zustaendigkeit", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Bei einem Streit um CHF 50'000 ist das vereinfachte Verfahren anwendbar.",
  correct: false,
  explain: "Falsch. Das vereinfachte Verfahren gilt nur bei einem Streitwert bis CHF 30'000 (Art. 243 ZPO). Bei CHF 50'000 greift das ordentliche Verfahren, das formeller ist und von einem Kollegialgericht beurteilt wird."
},

// --- diff 3 ---
{
  id: "z08", topic: "zustaendigkeit", type: "mc", diff: 3, tax: "K3",
 reviewed:false,
  context: "Markus (wohnhaft in Bern) und seine Schwester Claudia (wohnhaft in Basel) streiten über ein geerbtes Ferienhaus in Interlaken im Wert von CHF 400'000.",
  q: "Welches Gericht ist zuständig?",
  options: [
    {v: "A", t: "Das Gericht in Basel (Wohnsitz der Beklagten), ordentliches Verfahren."},
    {v: "B", t: "Das Bundesgericht, weil der Streitwert hoch ist."},
    {v: "C", t: "Das Gericht in Bern (Wohnsitz des Klägers), vereinfachtes Verfahren."},
    {v: "D", t: "Das Gericht in Interlaken (am Ort des Grundstücks), ordentliches Verfahren."}
  ],
  correct: "D",
  explain: "Bei Streitigkeiten über Grundstücke (Immobilien) ist das Gericht am Ort des Grundstücks zuständig — also Interlaken. Der Streitwert von CHF 400'000 liegt weit über CHF 30'000, daher gilt das ordentliche Verfahren mit einem Kollegialgericht. Das Bundesgericht (D) ist keine erste Instanz."
},
{
  id: "z09", topic: "zustaendigkeit", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Warum ist die Frage der Zuständigkeit für ein Gerichtsverfahren so wichtig?",
  options: [
    {v: "A", t: "Weil die Zuständigkeit ausschliesslich vom Kläger bestimmt wird."},
    {v: "B", t: "Weil ein Urteil eines unzuständigen Gerichts angefochten werden kann und das Verfahren vor dem richtigen Gericht neu begonnen werden muss."},
    {v: "C", t: "Weil die Zuständigkeit keinen Einfluss auf das Urteil hat."},
    {v: "D", t: "Weil nur sachlich zuständige Gerichte Beweismittel zulassen dürfen."}
  ],
  correct: "B",
  explain: "Die Zuständigkeit ist eine Prozessvoraussetzung. Wird eine Klage beim unzuständigen Gericht eingereicht, tritt das Gericht auf die Klage nicht ein oder das Urteil kann angefochten werden. Das führt zu Zeitverlust und zusätzlichen Kosten. Deshalb muss die Zuständigkeit zu Beginn des Verfahrens geklärt werden."
},

// ============================================================
// TOPIC: instanzenzug (Präfix i)
// ============================================================

// --- diff 1 ---
{
  id: "i01", topic: "instanzenzug", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  img: {src: "img/recht/prozessrecht/prozessrecht_instanzenzug_01.svg", alt: "Diagramm: Instanzenzug im Zivilprozess – Schlichtungsbehörde, Regionalgericht, Obergericht, Bundesgericht"},
  q: "Wie viele Gerichtsinstanzen gibt es im Schweizer Zivilprozess?",
  options: [
    {v: "A", t: "Zwei: erste Instanz und Bundesgericht."},
    {v: "B", t: "Drei: erste Instanz, zweite Instanz (Berufung) und Bundesgericht."},
    {v: "C", t: "Eine: das Regionalgericht entscheidet endgültig."},
    {v: "D", t: "Vier: Friedensrichter, Regionalgericht, Obergericht, Bundesgericht."}
  ],
  correct: "B",
  explain: "Im Schweizer Zivilprozess gibt es drei Instanzen: Die erste Instanz (z.B. Regionalgericht), die zweite Instanz (Obergericht, Berufung) und als letzte Instanz das Bundesgericht. Die Schlichtungsbehörde ist keine Gerichtsinstanz im engeren Sinn."
},
{
  id: "i02", topic: "instanzenzug", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Die erste Instanz im Zivilprozess im Kanton Bern heisst {0}.",
  blanks: [
    {answer: "Regionalgericht", alts: ["regionalgericht"]}
  ],
  explain: "Im Kanton Bern ist das Regionalgericht die erste Instanz im Zivilprozess. Andere Kantone haben andere Bezeichnungen (z.B. Bezirksgericht, Kreisgericht). Die zweite Instanz im Kanton Bern ist das Obergericht."
},
{
  id: "i03", topic: "instanzenzug", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "Das Bundesgericht in Lausanne ist die höchste richterliche Instanz der Schweiz.",
  correct: true,
  explain: "Richtig. Das Bundesgericht mit Sitz in Lausanne (bzw. Mon-Repos und Luzern für bestimmte Abteilungen) ist das oberste Gericht der Schweiz. Es ist die letzte Instanz für Beschwerden in Zivilsachen, Strafsachen und öffentlich-rechtlichen Angelegenheiten."
},

// --- diff 2 ---
{
  id: "i04", topic: "instanzenzug", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was ist eine Berufung im Zivilprozess?",
  options: [
    {v: "A", t: "Ein Antrag an das Bundesgericht, einen Fall neu zu beurteilen."},
    {v: "B", t: "Eine schriftliche Stellungnahme des Beklagten zur Klage."},
    {v: "C", t: "Die Überweisung eines Falls an die Schlichtungsbehörde."},
    {v: "D", t: "Ein Rechtsmittel, mit dem ein Urteil der ersten Instanz bei der zweiten Instanz (Obergericht) angefochten wird."}
  ],
  correct: "D",
  explain: "Die Berufung ist das ordentliche Rechtsmittel gegen Urteile der ersten Instanz. Die unterlegene Partei kann damit das Urteil beim Obergericht (zweite Instanz) anfechten. Das Obergericht überprüft den Fall in tatsächlicher und rechtlicher Hinsicht."
},
{
  id: "i05", topic: "instanzenzug", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
  q: "Welche Aussagen zum Instanzenzug sind korrekt? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Die zweite Instanz im Kanton Bern ist das Obergericht."},
    {v: "B", t: "Man kann jeden Fall ohne Weiteres ans Bundesgericht weiterziehen."},
    {v: "C", t: "Die Berufung ist ein Rechtsmittel gegen Urteile der ersten Instanz."},
    {v: "D", t: "Das Bundesgericht prüft in der Regel nur Rechtsfragen, nicht den Sachverhalt."}
  ],
  correct: ["A", "C", "D"],
  explain: "Das Obergericht ist im Kanton Bern die zweite Instanz (A). Die Berufung richtet sich gegen Urteile der ersten Instanz (C). Das Bundesgericht prüft grundsätzlich nur Rechtsfragen — ob das Recht korrekt angewendet wurde — und nicht den Sachverhalt (D). Nicht jeder Fall kann ans Bundesgericht weitergezogen werden (B); es gibt Streitwertgrenzen und formelle Voraussetzungen."
},
{
  id: "i06", topic: "instanzenzug", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Man kann im Zivilprozess jedes Urteil der ersten Instanz direkt beim Bundesgericht anfechten, ohne den Weg über die zweite Instanz zu gehen.",
  correct: false,
  explain: "Falsch. Der Instanzenzug muss in der Regel eingehalten werden. Zuerst muss das Urteil bei der zweiten Instanz (Obergericht) angefochten werden. Erst gegen das Urteil des Obergerichts kann beim Bundesgericht Beschwerde erhoben werden. Eine Sprungbeschwerde direkt ans Bundesgericht ist nur in Ausnahmefällen möglich."
},

// --- diff 3 ---
{
  id: "i07", topic: "instanzenzug", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  context: "Sandro verliert einen Mietrechtsstreit um CHF 8'000 vor dem Regionalgericht Bern. Er ist mit dem Urteil nicht einverstanden.",
  q: "Welchen Schritt muss Sandro als nächstes unternehmen?",
  options: [
    {v: "A", t: "Er muss direkt Beschwerde beim Bundesgericht erheben."},
    {v: "B", t: "Er muss den Fall nochmals der Schlichtungsbehörde vorlegen."},
    {v: "C", t: "Er kann nichts mehr tun — Urteile des Regionalgerichts sind endgültig."},
    {v: "D", t: "Er muss Berufung beim Obergericht des Kantons Bern einlegen."}
  ],
  correct: "D",
  explain: "Sandro muss als nächstes Berufung beim Obergericht des Kantons Bern einlegen. Der Instanzenzug sieht vor, dass zuerst die zweite Instanz angerufen wird. Ein direkter Gang ans Bundesgericht (B) ist nicht möglich. Urteile des Regionalgerichts sind nicht endgültig (D) — die Berufung ist das vorgesehene Rechtsmittel."
},
{
  id: "i08", topic: "instanzenzug", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Warum prüft das Bundesgericht in der Regel nur Rechtsfragen und nicht den Sachverhalt?",
  options: [
    {v: "A", t: "Weil das Bundesgericht keine Beweismittel zulassen darf."},
    {v: "B", t: "Weil das Bundesgericht nur für Strafsachen zuständig ist."},
    {v: "C", t: "Weil die Feststellung des Sachverhalts Aufgabe der Vorinstanzen ist und das Bundesgericht die einheitliche Rechtsanwendung in der Schweiz sicherstellen soll."},
    {v: "D", t: "Weil der Sachverhalt nach der ersten Instanz nicht mehr geändert werden kann."}
  ],
  correct: "C",
  explain: "Das Bundesgericht hat die Aufgabe, die einheitliche Rechtsanwendung in der ganzen Schweiz sicherzustellen. Die Sachverhaltsfeststellung — also die Ermittlung der Fakten und die Beweiswürdigung — ist primär Aufgabe der kantonalen Gerichte (erste und zweite Instanz). Das Bundesgericht greift nur ein, wenn der Sachverhalt offensichtlich unrichtig festgestellt wurde."
},
{
  id: "i09", topic: "instanzenzug", type: "fill", diff: 3, tax: "K2",
 reviewed:false,
  q: "Der Instanzenzug im Kanton Bern lautet: {0} → {1} → {2}.",
  blanks: [
    {answer: "Regionalgericht", alts: ["regionalgericht"]},
    {answer: "Obergericht", alts: ["obergericht"]},
    {answer: "Bundesgericht", alts: ["bundesgericht"]}
  ],
  explain: "Im Kanton Bern ist die erste Instanz das Regionalgericht, die zweite Instanz das Obergericht (Berufungsinstanz) und die dritte Instanz das Bundesgericht (prüft primär Rechtsfragen). Dieser dreistufige Instanzenzug gewährleistet Rechtsschutz und Rechtssicherheit."
},

// ============================================================
// TOPIC: beweis (Präfix b)
// ============================================================

// --- diff 1 ---
{
  id: "b01", topic: "beweis", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  q: "Was besagt die Beweislastregel nach Art. 8 ZGB?",
  options: [
    {v: "A", t: "Das Gericht muss alle Beweise selbst beschaffen."},
    {v: "B", t: "Der Beklagte muss immer beweisen, dass er unschuldig ist."},
    {v: "C", t: "Beweise müssen immer schriftlich vorgelegt werden."},
    {v: "D", t: "Wer aus einer Tatsache Rechte ableitet, muss deren Vorhandensein beweisen."}
  ],
  correct: "D",
  explain: "Art. 8 ZGB enthält die grundlegende Beweislastregel: Wer aus einer behaupteten Tatsache Rechte ableiten will, muss diese Tatsache beweisen. Das bedeutet in der Regel: Der Kläger muss beweisen, was er behauptet, um seine Ansprüche durchzusetzen."
},
{
  id: "b02", topic: "beweis", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "Urkunden (z.B. Verträge, Quittungen) sind ein anerkanntes Beweismittel im Zivilprozess.",
  correct: true,
  explain: "Richtig. Urkunden — also schriftliche Dokumente wie Verträge, Quittungen, Briefe oder E-Mails — sind eines der fünf anerkannten Beweismittel im Zivilprozess. Sie haben oft eine hohe Beweiskraft, weil sie den Inhalt einer Vereinbarung oder eines Vorgangs dokumentieren."
},
{
  id: "b03", topic: "beweis", type: "multi", diff: 1, tax: "K1",
 reviewed:false,
  q: "Welche der folgenden sind Beweismittel im Zivilprozess? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Urkunden (z.B. Verträge, Quittungen)"},
    {v: "B", t: "Zeugenaussagen"},
    {v: "C", t: "Meinungen aus sozialen Medien"},
    {v: "D", t: "Augenschein (das Gericht betrachtet den Streitgegenstand vor Ort)"}
  ],
  correct: ["A", "B", "D"],
  explain: "Die anerkannten Beweismittel im Zivilprozess sind: Urkunden (A), Zeugenaussagen (B), Augenschein (D), Parteibefragung und Gutachten (Sachverständige). Meinungen aus sozialen Medien (C) sind kein eigenständiges Beweismittel — sie könnten allenfalls als Urkunde eingereicht werden, haben aber geringe Beweiskraft."
},
{
  id: "b04", topic: "beweis", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Die fünf Beweismittel im Zivilprozess sind: Urkunden, {0}, Augenschein, {1} und Gutachten.",
  blanks: [
    {answer: "Zeugenaussagen", alts: ["Zeugen", "Zeugenbefragung", "Zeugeneinvernahme"]},
    {answer: "Parteibefragung", alts: ["Parteianhörung", "Parteieinvernahme", "Parteiaussagen"]}
  ],
  explain: "Die fünf Beweismittel im Zivilprozess sind: (1) Urkunden (schriftliche Dokumente), (2) Zeugenaussagen, (3) Augenschein (Gericht besichtigt den Streitgegenstand), (4) Parteibefragung (die Parteien werden befragt) und (5) Gutachten (Sachverständige erstellen eine Expertise)."
},

// --- diff 2 ---
{
  id: "b05", topic: "beweis", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
  context: "Sabrina behauptet, sie habe Marc CHF 3'000 geliehen. Marc bestreitet dies. Es gibt keinen schriftlichen Vertrag.",
  q: "Wer trägt die Beweislast?",
  options: [
    {v: "A", t: "Das Gericht — es muss den Sachverhalt von Amtes wegen abklären."},
    {v: "B", t: "Marc — er muss beweisen, dass er das Geld nicht erhalten hat."},
    {v: "C", t: "Sabrina — sie leitet aus dem behaupteten Darlehen einen Rückzahlungsanspruch ab."},
    {v: "D", t: "Niemand — ohne schriftlichen Vertrag kann kein Anspruch geltend gemacht werden."}
  ],
  correct: "C",
  explain: "Obersatz: Es ist zu prüfen, wer die Beweislast für das Darlehen trägt. Voraussetzung: Nach Art. 8 ZGB muss beweisen, wer aus einer Tatsache Rechte ableitet. Subsumtion: Sabrina will einen Rückzahlungsanspruch geltend machen — sie leitet also Rechte aus dem behaupteten Darlehen ab. Schluss: Sabrina trägt die Beweislast. Dass kein schriftlicher Vertrag existiert, schliesst den Anspruch nicht aus (D) — ein Darlehen kann auch mündlich vereinbart werden —, erschwert aber den Beweis."
},
{
  id: "b06", topic: "beweis", type: "mc", diff: 2, tax: "K3",
 reviewed:false,
  context: "In einem Bauprozess behauptet die Bauherrin, der Bauunternehmer habe mangelhafte Materialien verwendet. Der Bauunternehmer bestreitet dies.",
  q: "Welches Beweismittel wäre hier besonders geeignet?",
  options: [
    {v: "A", t: "Ein Augenschein ist bei Baufragen nie sinnvoll."},
    {v: "B", t: "Nur die Parteiaussage der Bauherrin genügt."},
    {v: "C", t: "Im Bauprozess sind keine Beweismittel nötig."},
    {v: "D", t: "Ein Gutachten (Sachverständiger untersucht die verbauten Materialien)."}
  ],
  correct: "D",
  explain: "Bei technischen Fragen wie der Qualität von Baumaterialien ist ein Gutachten (Expertise) das geeignetste Beweismittel. Ein Sachverständiger (z.B. ein Bauingenieur) kann die Materialien fachkundig untersuchen und beurteilen. Zusätzlich kann auch ein Augenschein sinnvoll sein — das Gericht besichtigt dann die Baustelle."
},
{
  id: "b07", topic: "beweis", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Im Zivilprozess muss der Beklagte immer beweisen, dass er unschuldig ist.",
  correct: false,
  explain: "Falsch. Im Zivilprozess gilt die Beweislastregel nach Art. 8 ZGB: Grundsätzlich muss derjenige beweisen, der Rechte geltend macht — in der Regel also der Kläger. Der Beklagte muss nur dann etwas beweisen, wenn er seinerseits Tatsachen behauptet, aus denen er Rechte ableitet (z.B. eine Einrede wie Verjährung)."
},

// --- diff 3 ---
{
  id: "b08", topic: "beweis", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  context: "Jan hat bei einer Online-Auktion ein Gemälde gekauft. Der Verkäufer behauptet, es sei ein Original im Wert von CHF 15'000. Jan bezweifelt die Echtheit und verlangt den Kaufpreis zurück.",
  q: "Wer muss was beweisen?",
  options: [
    {v: "A", t: "Der Verkäufer muss beweisen, dass er das Geld bereits ausgegeben hat."},
    {v: "B", t: "Jan muss beweisen, dass das Gemälde eine Fälschung ist, da er aus diesem Mangel Rechte ableiten will (Rückforderung des Kaufpreises)."},
    {v: "C", t: "Der Verkäufer muss beweisen, dass das Gemälde echt ist, weil er den Kaufpreis behalten will."},
    {v: "D", t: "Niemand muss etwas beweisen — das Gericht entscheidet nach freiem Ermessen."}
  ],
  correct: "B",
  explain: "Nach Art. 8 ZGB muss beweisen, wer Rechte ableitet. Jan will den Kaufpreis zurückfordern — er stützt sich dabei auf einen Sachmangel (Fälschung statt Original). Also muss Jan beweisen, dass das Gemälde nicht echt ist. Ein Gutachten eines Kunstexperten wäre hier das geeignete Beweismittel. Diese Beweislastverteilung kann für den Käufer eine Herausforderung darstellen."
},
{
  id: "b09", topic: "beweis", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Was ist ein «Augenschein» und wann ist er als Beweismittel besonders geeignet?",
  options: [
    {v: "A", t: "Das Gericht betrachtet den Streitgegenstand vor Ort — besonders geeignet bei Nachbarschaftsstreitigkeiten, Baumängeln oder Grenzstreitigkeiten."},
    {v: "B", t: "Ein Zeuge beschreibt dem Gericht, was er gesehen hat."},
    {v: "C", t: "Ein Gutachter nimmt den Streitgegenstand in Augenschein und erstellt einen Bericht."},
    {v: "D", t: "Das Gericht betrachtet nur Fotografien des Streitgegenstands."}
  ],
  correct: "A",
  explain: "Beim Augenschein verschafft sich das Gericht einen persönlichen, unmittelbaren Eindruck vom Streitgegenstand — z.B. indem es eine Baustelle besichtigt, einen Zaun inspiziert oder eine Liegenschaft begeht. Dies ist besonders geeignet, wenn der Zustand eines Gegenstands oder einer Örtlichkeit strittig ist. Es ist vom Gutachten (D) zu unterscheiden, bei dem ein externer Sachverständiger eine fachliche Beurteilung abgibt."
},
{
  id: "b10", topic: "beweis", type: "tf", diff: 3, tax: "K5",
 reviewed:false,
  q: "Die Zeugenaussage ist im Zivilprozess das zuverlässigste Beweismittel.",
  correct: false,
  explain: "Falsch. Zeugenaussagen gelten als eines der unzuverlässigeren Beweismittel, da die menschliche Wahrnehmung und Erinnerung fehleranfällig sind (vgl. TED-Talk Scott Fraser). Urkunden (schriftliche Dokumente) und Gutachten haben in der Regel eine höhere Beweiskraft, weil sie objektiver und nachprüfbar sind. Das Gericht würdigt alle Beweise frei (freie Beweiswürdigung)."
},

// ============================================================
// TOPIC: streitbeilegung (Präfix s)
// ============================================================

// --- diff 1 ---
{
  id: "s01", topic: "streitbeilegung", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  q: "Was ist ein Schlichtungsverfahren?",
  options: [
    {v: "A", t: "Ein Verfahren, das nur in Strafsachen zur Anwendung kommt."},
    {v: "B", t: "Ein obligatorisches Verfahren vor der Schlichtungsbehörde, bei dem versucht wird, eine Einigung zwischen den Parteien zu erzielen."},
    {v: "C", t: "Die erste Verhandlung vor dem Regionalgericht."},
    {v: "D", t: "Ein freiwilliges Verfahren, bei dem ein privater Richter ein verbindliches Urteil fällt."}
  ],
  correct: "B",
  explain: "Das Schlichtungsverfahren ist in der Schweiz grundsätzlich obligatorisch vor der Einreichung einer Zivilklage (Art. 197 ZPO). Die Schlichtungsbehörde versucht, zwischen den Parteien eine Einigung zu vermitteln. Erst wenn die Schlichtung scheitert, erhält der Kläger eine Klagebewilligung für das Gericht."
},
{
  id: "s02", topic: "streitbeilegung", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "In der Schweiz muss vor der Einreichung einer Zivilklage grundsätzlich ein Schlichtungsverfahren durchgeführt werden.",
  correct: true,
  explain: "Richtig. Gemäss Art. 197 ZPO ist das Schlichtungsverfahren in der Schweiz grundsätzlich obligatorisch. Die Schlichtungsbehörde versucht, die Parteien zu einer gütlichen Einigung zu bewegen. Erst wenn dies scheitert, wird eine Klagebewilligung erteilt. Es gibt wenige Ausnahmen (z.B. bei dringlichen Massnahmen)."
},
{
  id: "s03", topic: "streitbeilegung", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Mediation ist ein {0} Verfahren, bei dem ein neutraler Dritter die Parteien bei der Lösungsfindung unterstützt.",
  blanks: [
    {answer: "freiwilliges", alts: ["freiwillig"]}
  ],
  explain: "Im Gegensatz zur Schlichtung (obligatorisch) ist die Mediation freiwillig (Art. 213 ff. ZPO). Der Mediator hat keine Entscheidungsgewalt — er unterstützt die Parteien dabei, selbst eine Lösung zu finden. Beide Parteien müssen der Mediation zustimmen."
},

// --- diff 2 ---
{
  id: "s04", topic: "streitbeilegung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was unterscheidet die Mediation von der Schlichtung?",
  options: [
    {v: "A", t: "Bei der Mediation entscheidet der Mediator verbindlich über den Fall."},
    {v: "B", t: "Schlichtung ist freiwillig, Mediation ist obligatorisch."},
    {v: "C", t: "Mediation ist freiwillig und der Mediator hat keine Entscheidungsgewalt; Schlichtung ist obligatorisch und die Schlichtungsbehörde kann einen Urteilsvorschlag machen."},
    {v: "D", t: "Schlichtung und Mediation sind dasselbe Verfahren."}
  ],
  correct: "C",
  explain: "Die Schlichtung ist in der Schweiz obligatorisch vor der Klage (Art. 197 ZPO). Die Schlichtungsbehörde kann bei einem Streitwert bis CHF 2'000 sogar einen Entscheid fällen und bei höherem Streitwert einen Urteilsvorschlag unterbreiten. Die Mediation ist freiwillig (Art. 213 ff. ZPO), und der Mediator hat keine Entscheidungsgewalt — er hilft den Parteien lediglich, selbst eine Lösung zu finden."
},
{
  id: "s05", topic: "streitbeilegung", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was ist ein Schiedsgericht?",
  options: [
    {v: "A", t: "Ein Verfahren, das nur bei Streitigkeiten unter CHF 5'000 zulässig ist."},
    {v: "B", t: "Ein staatliches Gericht, das besonders schnell urteilt."},
    {v: "C", t: "Ein privates Gericht, bei dem die Parteien die Richter selbst wählen und dessen Urteil bindend ist."},
    {v: "D", t: "Eine kostenlose Alternative zum Zivilprozess."}
  ],
  correct: "C",
  explain: "Ein Schiedsgericht ist eine private Gerichtsbarkeit: Die Parteien vereinbaren, ihren Streit nicht vor einem staatlichen Gericht, sondern vor einem oder mehreren privaten Schiedsrichtern auszutragen. Das Schiedsurteil (Schiedsspruch) ist bindend und vollstreckbar. Schiedsgerichte werden oft in internationalen Handelsverträgen vereinbart."
},
{
  id: "s06", topic: "streitbeilegung", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
  q: "Welche Aussagen zur alternativen Streitbeilegung sind korrekt? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Die Schlichtung ist in der Schweiz vor der Zivilklage obligatorisch (Art. 197 ZPO)."},
    {v: "B", t: "Bei einer Mediation entscheidet der Mediator über den Ausgang."},
    {v: "C", t: "Ein Schiedsspruch ist rechtlich bindend."},
    {v: "D", t: "Alternative Streitbeilegung kann Zeit und Kosten sparen."}
  ],
  correct: ["A", "C", "D"],
  explain: "Die Schlichtung ist obligatorisch (A, Art. 197 ZPO). Schiedssprüche sind bindend und vollstreckbar (C). Alternative Streitbeilegung (ADR) kann schneller und günstiger sein als ein ordentliches Gerichtsverfahren (D). Bei einer Mediation hat der Mediator keine Entscheidungsgewalt (B falsch) — er unterstützt nur die Parteien."
},
{
  id: "s07", topic: "streitbeilegung", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Bei einer Mediation entscheidet der Mediator verbindlich über den Ausgang des Streits.",
  correct: false,
  explain: "Falsch. Der Mediator hat keine Entscheidungsgewalt. Er ist ein neutraler Dritter, der die Parteien bei der Suche nach einer einvernehmlichen Lösung unterstützt. Nur wenn beide Parteien eine Vereinbarung unterzeichnen, ist das Ergebnis bindend. Im Gegensatz dazu kann ein Schiedsrichter ein verbindliches Urteil fällen."
},

// --- diff 3 ---
{
  id: "s08", topic: "streitbeilegung", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
  context: "Zwei KMU streiten über die Qualität einer Lieferung im Wert von CHF 80'000. Sie haben eine langjährige Geschäftsbeziehung und möchten diese nicht gefährden. Gleichzeitig möchten sie eine verbindliche Lösung.",
  q: "Welche Form der Streitbeilegung empfehlen Sie?",
  options: [
    {v: "A", t: "Mediation — sie wahrt die Geschäftsbeziehung und ermöglicht eine einvernehmliche Lösung. Falls keine Einigung erzielt wird, kann immer noch geklagt werden."},
    {v: "B", t: "Ein Schiedsverfahren — es ist verbindlich, aber diskreter als ein öffentliches Gerichtsverfahren."},
    {v: "C", t: "Keine Streitbeilegung — die Parteien sollten den Streit einfach vergessen."},
    {v: "D", t: "Sofort ein ordentliches Gerichtsverfahren — nur so ist ein verbindliches Urteil möglich."}
  ],
  correct: "A",
  explain: "Bei einer langjährigen Geschäftsbeziehung, die erhalten bleiben soll, ist die Mediation besonders geeignet. Sie ermöglicht eine einvernehmliche Lösung, bei der beide Parteien ihre Interessen einbringen können. Die Geschäftsbeziehung wird weniger belastet als bei einem Gerichtsverfahren. Ein Schiedsverfahren (C) wäre auch denkbar und hätte den Vorteil der Vertraulichkeit und Verbindlichkeit, ist aber in der Regel teurer und kontradiktorischer."
},
{
  id: "s09", topic: "streitbeilegung", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Warum hat die Schweiz das obligatorische Schlichtungsverfahren eingeführt?",
  options: [
    {v: "A", t: "Weil das Gesetz es verbietet, direkt vor Gericht zu klagen."},
    {v: "B", t: "Um Gerichte zu entlasten und den Parteien die Möglichkeit zu geben, ihren Streit schnell und kostengünstig beizulegen, bevor sie den aufwändigen Gerichtsweg beschreiten."},
    {v: "C", t: "Weil die Schlichtungsbehörde bessere Urteile fällt als ein Gericht."},
    {v: "D", t: "Weil in der Schweiz nicht genügend Richterinnen und Richter zur Verfügung stehen."}
  ],
  correct: "B",
  explain: "Das obligatorische Schlichtungsverfahren dient der Entlastung der Gerichte und gibt den Parteien eine niederschwellige Möglichkeit, ihren Streit einvernehmlich beizulegen. Viele Fälle werden bereits im Schlichtungsverfahren gelöst, was Zeit und Kosten spart — sowohl für die Parteien als auch für das Justizsystem. Es geht nicht darum, dass Schlichtungsbehörden besser urteilen (B), sondern darum, eine Einigung zu fördern."
},
{
  id: "s10", topic: "streitbeilegung", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
  q: "Welcher Nachteil kann bei einem Schiedsgericht im Vergleich zum staatlichen Gericht bestehen?",
  options: [
    {v: "A", t: "Ein Schiedsspruch ist nie verbindlich."},
    {v: "B", t: "Bei einem Schiedsgericht sind keine Anwälte zugelassen."},
    {v: "C", t: "Die Kosten können hoch sein, da die Schiedsrichter privat bezahlt werden müssen, und die Möglichkeiten der Anfechtung sind eingeschränkt."},
    {v: "D", t: "Ein Schiedsverfahren dauert immer länger als ein Gerichtsverfahren."}
  ],
  correct: "C",
  explain: "Schiedsverfahren haben den Nachteil, dass die Parteien die Schiedsrichter selbst bezahlen müssen, was insbesondere bei komplexen Fällen teuer werden kann. Zudem sind die Möglichkeiten, einen Schiedsspruch anzufechten, stark eingeschränkt. Dafür bieten Schiedsverfahren Vorteile wie Vertraulichkeit, Schnelligkeit und die Möglichkeit, spezialisierte Schiedsrichter zu wählen."
},

// ============================================================
// TOPIC: strafverfahren (Präfix v)
// ============================================================

// --- diff 1 ---
{
  id: "v01", topic: "strafverfahren", type: "mc", diff: 1, tax: "K1",
 reviewed:false,
  img: {src: "img/recht/prozessrecht/prozessrecht_strafverfahren_ablauf_01.svg", alt: "Ablaufdiagramm: Phasen eines Strafverfahrens – Einleitung, Vorverfahren, Anklage, Hauptverhandlung, Urteil"},
  q: "Wie wird ein Strafverfahren in der Regel eingeleitet?",
  options: [
    {v: "A", t: "Durch eine Zivilklage beim Regionalgericht."},
    {v: "B", t: "Durch eine Schlichtung bei der Schlichtungsbehörde."},
    {v: "C", t: "Durch den Beschuldigten selbst, der sich stellt."},
    {v: "D", t: "Durch eine Strafanzeige oder einen Strafantrag, oder die Staatsanwaltschaft wird von sich aus tätig."}
  ],
  correct: "D",
  explain: "Ein Strafverfahren wird eingeleitet durch: eine Strafanzeige (jede Person kann eine Straftat melden), einen Strafantrag (bei Antragsdelikten muss das Opfer dies innerhalb von 3 Monaten tun) oder durch die Staatsanwaltschaft von Amtes wegen (bei Offizialdelikten). Eine Zivilklage (B) gehört zum Zivilprozess."
},
{
  id: "v02", topic: "strafverfahren", type: "fill", diff: 1, tax: "K1",
 reviewed:false,
  q: "Das Vorverfahren im Strafprozess besteht aus der Ermittlung durch die {0} und der Untersuchung durch die {1}.",
  blanks: [
    {answer: "Polizei", alts: ["polizei"]},
    {answer: "Staatsanwaltschaft", alts: ["staatsanwaltschaft"]}
  ],
  explain: "Das Vorverfahren hat zwei Phasen: Zuerst ermittelt die Polizei (sie sichert Spuren, befragt Zeugen, nimmt Verdächtige fest). Dann führt die Staatsanwaltschaft die Untersuchung (sie prüft die Beweise und entscheidet, ob Anklage erhoben wird oder das Verfahren eingestellt wird)."
},
{
  id: "v03", topic: "strafverfahren", type: "tf", diff: 1, tax: "K1",
 reviewed:false,
  q: "Die Staatsanwaltschaft erhebt im Strafverfahren die Anklage gegen den Beschuldigten.",
  correct: true,
  explain: "Richtig. Nach Abschluss der Untersuchung entscheidet die Staatsanwaltschaft, ob sie Anklage erhebt. Wenn ja, übergibt sie den Fall dem Gericht zur Hauptverhandlung. Die Staatsanwaltschaft vertritt im Strafprozess die Anklage — sie ist quasi die «Klägerin» des Staates."
},
{
  id: "v04", topic: "strafverfahren", type: "mc", diff: 1, tax: "K2",
 reviewed:false,
  q: "Was bedeutet die Unschuldsvermutung?",
  options: [
    {v: "A", t: "Das Gericht geht davon aus, dass der Beschuldigte schuldig ist, bis er das Gegenteil beweist."},
    {v: "B", t: "Der Beschuldigte muss seine Unschuld beweisen."},
    {v: "C", t: "Die Polizei darf niemanden verhaften, solange kein Urteil vorliegt."},
    {v: "D", t: "Jede beschuldigte Person gilt als unschuldig, bis ihre Schuld in einem rechtskräftigen Urteil bewiesen ist."}
  ],
  correct: "D",
  explain: "Die Unschuldsvermutung (Art. 6 Abs. 2 EMRK, Art. 32 Abs. 1 BV) ist ein fundamentales Grundrecht: Jede beschuldigte Person gilt als unschuldig, bis ein rechtskräftiges Urteil vorliegt. Die Beweislast liegt bei der Staatsanwaltschaft — sie muss die Schuld beweisen, nicht der Beschuldigte seine Unschuld (D)."
},

// --- diff 2 ---
{
  id: "v05", topic: "strafverfahren", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "In welcher Reihenfolge läuft ein Strafverfahren typischerweise ab?",
  options: [
    {v: "A", t: "Strafanzeige → Vorverfahren (Ermittlung und Untersuchung) → Anklageerhebung → Hauptverhandlung → Urteil"},
    {v: "B", t: "Schlichtung → Klage → Verhandlung → Urteil"},
    {v: "C", t: "Strafanzeige → Urteil → Hauptverhandlung → Berufung"},
    {v: "D", t: "Hauptverhandlung → Anklageerhebung → Ermittlung → Urteil"}
  ],
  correct: "A",
  explain: "Der Ablauf eines Strafverfahrens: (1) Eine Strafanzeige oder ein Strafantrag leitet das Verfahren ein. (2) Im Vorverfahren ermittelt die Polizei und die Staatsanwaltschaft untersucht. (3) Die Staatsanwaltschaft erhebt Anklage. (4) In der Hauptverhandlung verhandelt das Gericht den Fall. (5) Das Gericht fällt ein Urteil. Option C beschreibt den Zivilprozess."
},
{
  id: "v06", topic: "strafverfahren", type: "multi", diff: 2, tax: "K2",
 reviewed:false,
  q: "Welche Aussagen zum Strafverfahren sind korrekt? (Mehrere Antworten möglich.)",
  options: [
    {v: "A", t: "Die Staatsanwaltschaft leitet die Untersuchung und erhebt ggf. Anklage."},
    {v: "B", t: "Der Beschuldigte hat das Recht auf einen Verteidiger (Anwalt)."},
    {v: "C", t: "Im Strafprozess stehen sich Kläger und Beklagter gegenüber."},
    {v: "D", t: "Es gilt die Unschuldsvermutung."}
  ],
  correct: ["A", "B", "D"],
  explain: "Die Staatsanwaltschaft leitet die Untersuchung und erhebt Anklage (A). Der Beschuldigte hat das Recht auf einen Verteidiger — dies gehört zu den Verfahrensgarantien (B). Die Unschuldsvermutung gilt (D). Im Strafprozess stehen sich nicht Kläger und Beklagter (C) gegenüber — das sind Begriffe aus dem Zivilprozess. Im Strafprozess heissen die Parteien Staatsanwaltschaft und Beschuldigter/Angeklagter."
},
{
  id: "v07", topic: "strafverfahren", type: "mc", diff: 2, tax: "K2",
 reviewed:false,
  q: "Was ist der Unterschied zwischen einer Strafanzeige und einem Strafantrag?",
  options: [
    {v: "A", t: "Ein Strafantrag kann nur die Polizei stellen."},
    {v: "B", t: "Eine Strafanzeige kann jede Person erstatten; ein Strafantrag muss vom Opfer selbst gestellt werden (bei Antragsdelikten)."},
    {v: "C", t: "Eine Strafanzeige ist verbindlicher als ein Strafantrag."},
    {v: "D", t: "Es gibt keinen Unterschied — die Begriffe sind synonym."}
  ],
  correct: "B",
  explain: "Eine Strafanzeige ist eine Mitteilung an die Behörden, dass eine Straftat begangen wurde — jede Person kann sie erstatten. Ein Strafantrag ist bei sogenannten Antragsdelikten nötig (z.B. einfacher Diebstahl nach Art. 139 Ziff. 1 StGB). Hier muss das Opfer innerhalb von 3 Monaten ausdrücklich verlangen, dass der Täter bestraft wird."
},
{
  id: "v08", topic: "strafverfahren", type: "tf", diff: 2, tax: "K2",
 reviewed:false,
  q: "Im Strafverfahren ist die Staatsanwaltschaft verpflichtet, auch entlastende Umstände zu ermitteln.",
  correct: true,
  explain: "Richtig. Die Staatsanwaltschaft hat eine Objektivitätspflicht: Sie muss sowohl belastende als auch entlastende Umstände gleichermassen ermitteln und berücksichtigen. Sie ist nicht einseitige Anklägerin, sondern hat die Aufgabe, den wahren Sachverhalt festzustellen."
},

// --- diff 3 ---
{
  id: "v09", topic: "strafverfahren", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  context: "Kevin (16 Jahre) wird verdächtigt, zusammen mit einem Freund (19 Jahre) einen Ladendiebstahl begangen zu haben. Der gestohlene Gegenstand hat einen Wert von CHF 50.",
  q: "Was gilt für Kevin im Strafverfahren?",
  options: [
    {v: "A", t: "Kevin wird nur verwarnt, da der Wert unter CHF 100 liegt."},
    {v: "B", t: "Kevin wird gleich behandelt wie sein 19-jähriger Freund — das Alter spielt keine Rolle."},
    {v: "C", t: "Kevin untersteht dem Jugendstrafrecht (JStG). Im Vordergrund stehen Schutzmassnahmen und Erziehung, nicht Bestrafung."},
    {v: "D", t: "Kevin kann nicht bestraft werden, weil er noch minderjährig ist."}
  ],
  correct: "C",
  explain: "Kevin ist 16 und fällt damit unter das Jugendstrafgesetz (JStG). Im Jugendstrafrecht steht der Schutz und die Erziehung des Jugendlichen im Vordergrund — nicht die Vergeltung. Der Jugendliche kann trotzdem bestraft werden (C ist falsch), aber die Massnahmen sind auf Erziehung ausgerichtet. Sein 19-jähriger Freund wird nach dem ordentlichen Strafrecht (StGB) beurteilt."
},
{
  id: "v10", topic: "strafverfahren", type: "mc", diff: 3, tax: "K4",
 reviewed:false,
  q: "Was wird im Strafregister (VOSTRA) eingetragen?",
  options: [
    {v: "A", t: "Nur Freiheitsstrafen ab einem Jahr Dauer."},
    {v: "B", t: "Jede Strafanzeige, unabhängig davon, ob es zu einer Verurteilung kommt."},
    {v: "C", t: "Strafurteile (Verurteilungen zu Freiheitsstrafen, Geldstrafen und bestimmte Massnahmen) — nach einer gewissen Zeit werden Einträge gelöscht."},
    {v: "D", t: "Strafregistereinträge werden nie gelöscht."}
  ],
  correct: "C",
  explain: "Im Strafregister (VOSTRA, Art. 365 ff. StGB) werden rechtskräftige Verurteilungen eingetragen — also Freiheitsstrafen, Geldstrafen und bestimmte Massnahmen. Blosse Strafanzeigen (B) werden nicht eingetragen. Die Einträge werden nach einer gesetzlich festgelegten Frist gelöscht (D ist falsch) — bei Geldstrafen z.B. nach 10 Jahren. Nicht alle Verurteilungen werden eingetragen; Bussen z.B. erscheinen in der Regel nicht im Strafregister."
},
{
  id: "v11", topic: "strafverfahren", type: "mc", diff: 3, tax: "K5",
 reviewed:false,
  q: "Warum ist die Unschuldsvermutung für einen fairen Strafprozess so wichtig?",
  options: [
    {v: "A", t: "Sie verhindert, dass die Polizei Ermittlungen aufnehmen kann."},
    {v: "B", t: "Sie sorgt dafür, dass alle Beschuldigten freigesprochen werden."},
    {v: "C", t: "Sie schützt den Einzelnen vor staatlicher Willkür und stellt sicher, dass die Beweislast bei der Anklagebehörde liegt — nicht beim Beschuldigten."},
    {v: "D", t: "Sie ermöglicht es dem Beschuldigten, ohne Verteidiger vor Gericht aufzutreten."}
  ],
  correct: "C",
  explain: "Die Unschuldsvermutung ist ein fundamentaler Grundsatz des Rechtsstaats. Sie schützt den Einzelnen vor willkürlicher Bestrafung durch den Staat, indem sie verlangt, dass die Schuld zweifelsfrei bewiesen wird — und zwar durch die Staatsanwaltschaft (Beweislast). Der Beschuldigte muss seine Unschuld nicht beweisen. Ohne Unschuldsvermutung könnte der Staat beliebig Personen verurteilen."
},

// --- Sortierungsfragen ---
{
  id: "neu_sort_01", topic: "instanzenzug", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
  q: "Ordnen Sie den Instanzenzug im Schweizer Zivilprozess in die korrekte Reihenfolge – von der ersten zur letzten Instanz.",
  items: [
    "Schlichtungsbehörde (obligatorischer Schlichtungsversuch vor dem Prozess, Art. 197 ZPO)",
    "Erstinstanzliches Gericht (Regionalgericht / Bezirksgericht)",
    "Kantonales Obergericht (Berufungsinstanz – überprüft Sachverhalt und Recht)",
    "Bundesgericht (letzte Instanz – überprüft nur noch Rechtsfragen)"
  ],
  correct: [0, 1, 2, 3],
  explain: "In der Schweiz muss vor jedem Zivilprozess ein Schlichtungsversuch stattfinden (Ausnahmen z.B. bei hohem Streitwert möglich). Scheitert die Schlichtung, wird beim erstinstanzlichen Gericht Klage erhoben. Gegen das Urteil kann Berufung beim Obergericht eingelegt werden. Das Bundesgericht ist die letzte Instanz – es prüft nur noch Rechtsfragen, nicht den Sachverhalt."
},
{
  id: "neu_sort_02", topic: "strafverfahren", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
  q: "Ordnen Sie die Phasen eines Schweizer Strafverfahrens in die korrekte Reihenfolge.",
  items: [
    "Vorverfahren: Polizeiliche Ermittlung und staatsanwaltliche Untersuchung",
    "Anklageerhebung: Staatsanwaltschaft erhebt Anklage beim Gericht",
    "Hauptverhandlung: Beweisaufnahme, Plädoyers, rechtliches Gehör",
    "Urteil: Schuld- und Freispruch, Strafmass",
    "Rechtsmittelverfahren: Berufung oder Beschwerde (falls eingelegt)"
  ],
  correct: [0, 1, 2, 3, 4],
  explain: "Das Strafverfahren beginnt mit dem Vorverfahren (Polizei ermittelt, Staatsanwaltschaft untersucht). Reichen die Beweise, wird Anklage erhoben. Es folgt die Hauptverhandlung mit Beweisaufnahme und Plädoyers. Das Gericht fällt ein Urteil. Gegen das Urteil kann Berufung (kantonales Obergericht) oder Beschwerde (Bundesgericht) eingelegt werden."
},
{
  id: "neu_sort_03", topic: "streitbeilegung", type: "sortierung", diff: 2, tax: "K3", reviewed: false,
  q: "Ordnen Sie die Formen der Streitbeilegung nach dem Grad der Formalisierung – von der informellsten zur formellsten.",
  items: [
    "Direkte Verhandlung zwischen den Parteien (aussergerichtliche Einigung)",
    "Mediation (neutrale Vermittlungsperson, freiwillig, keine Entscheidungsmacht)",
    "Schlichtung (obligatorisch vor Zivilprozess, Schlichtungsbehörde kann Urteilsvorschlag machen)",
    "Schiedsgericht (private Richter, bindender Entscheid, vertragliche Vereinbarung)",
    "Staatliches Gericht (formelles Verfahren, gesetzlich geregelt, vollstreckbares Urteil)"
  ],
  correct: [0, 1, 2, 3, 4],
  explain: "Die Streitbeilegung reicht von informell bis hochformalisiert: Direkte Verhandlung ist am einfachsten. Mediation ist freiwillig und auf Konsens ausgerichtet. Die Schlichtung ist in der Schweiz obligatorisch vor Zivilklagen. Schiedsgerichte sind vertraglich vereinbart und treffen bindende Entscheide (oft im internationalen Handel). Das staatliche Gericht ist die formellste und letzte Option."
},

// ===== INTERAKTIVE FRAGETYPEN =====

  {
    id: "hotspot01", topic: "instanzenzug", type: "hotspot", diff: 2, tax: "K2", reviewed: false,
    q: "Klicke auf die Instanz, die als letztes innerstaatliches Gericht über einen Fall entscheidet.",
    img: { src: "img/recht/prozessrecht/prozessrecht_instanzenzug_hotspot.svg", alt: "Instanzenzug-Diagramm mit Buchstaben-Markern A bis D" },
    hotspots: [
      { x: 10, y: 81, r: 8, label: "A: Bezirksgericht (1. Instanz)" },
      { x: 42.5, y: 59.5, r: 8, label: "B: Obergericht (2. Instanz)" },
      { x: 73.8, y: 36.9, r: 8, label: "C: Bundesgericht (letzte Instanz)" },
      { x: 73.8, y: 10, r: 8, label: "D: EGMR Strassburg" }
    ],
    correct: [2],
    explain: "Das Bundesgericht (C) in Lausanne ist die letzte innerstaatliche Instanz der Schweiz. Es prüft primär Rechtsfragen, nicht den Sachverhalt. Danach kann nur noch der EGMR in Strassburg angerufen werden — aber nur bei Verletzungen der Europäischen Menschenrechtskonvention (EMRK)."
  },

  {
    id: "beschriftung01", topic: "instanzenzug", type: "bildbeschriftung", diff: 2, tax: "K2", reviewed: false,
    q: "Beschrifte die drei Stufen des Schweizer Instanzenzugs und die Rechtsmittel zwischen den Stufen.",
    img: { src: "img/recht/prozessrecht/prozessrecht_instanzenzug_beschriftung.svg", alt: "Treppendiagramm des Instanzenzugs mit roten Kreisen" },
    labels: [
      { id: "l1", text: "1. Instanz: Bezirksgericht / Regionalgericht", x: 18, y: 83 },
      { id: "l2", text: "Berufung / Beschwerde", x: 36, y: 64 },
      { id: "l3", text: "2. Instanz: Obergericht / Kantonsgericht", x: 50, y: 63 },
      { id: "l4", text: "Beschwerde in Zivilsachen / Strafsachen", x: 69, y: 44 },
      { id: "l5", text: "3. Instanz: Bundesgericht (Lausanne)", x: 83, y: 30 }
    ],
    explain: "Schweizer Instanzenzug: 1. Instanz (Bezirks-/Regionalgericht) → 2. Instanz (Obergericht/Kantonsgericht, via Berufung/Beschwerde) → Bundesgericht (via Beschwerde in Zivil-/Strafsachen, letzte Instanz). Das Bundesgericht prüft primär Rechtsfragen, nicht den Sachverhalt."
  },

  {
    id: "dragdrop01", topic: "grundlagen", type: "dragdrop_bild", diff: 2, tax: "K2", reviewed: false,
    q: "Ordne die Merkmale dem Zivilprozess oder dem Strafprozess zu.",
    img: { src: "img/recht/prozessrecht/prozessrecht_verfahren_dragdrop.svg", alt: "Zwei Spalten: Zivilprozess und Strafprozess" },
    zones: [
      { id: "zivil", x: 3.75, y: 13.75, w: 44.375, h: 82.5 },
      { id: "straf", x: 51.875, y: 13.75, w: 44.375, h: 82.5 }
    ],
    labels: [
      { id: "klaeger", text: "Kläger vs. Beklagter", zone: "zivil" },
      { id: "verhandlung", text: "Verhandlungsgrundsatz", zone: "zivil" },
      { id: "disposition", text: "Dispositionsmaxime", zone: "zivil" },
      { id: "kostenvorschuss", text: "Kostenvorschusspflicht", zone: "zivil" },
      { id: "sta", text: "Staatsanwaltschaft vs. Beschuldigter", zone: "straf" },
      { id: "offizialprinzip", text: "Offizialprinzip / Legalitätsprinzip", zone: "straf" },
      { id: "untersuchung", text: "Untersuchungsgrundsatz", zone: "straf" },
      { id: "unschuld", text: "Unschuldsvermutung (in dubio)", zone: "straf" }
    ],
    explain: "Zivilprozess: Kläger vs. Beklagter, Parteien bestimmen Streitgegenstand (Dispositionsmaxime), tragen Kosten (Vorschusspflicht). Strafprozess: Staat (StA) vs. Beschuldigter, Offizialprinzip (Staat muss verfolgen), Untersuchungsgrundsatz (Gericht/StA ermittelt), Unschuldsvermutung."
  }

]; // Ende QUESTIONS
